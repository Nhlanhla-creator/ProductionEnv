/**
 * extractionPipeline.js
 * 
 * Drop this file into your project and import from it in GuaranteesAI.js
 * (or replace the extraction block in that file with these exports).
 *
 * Root-cause fix
 * ─────────────────────────────────────────────────────────────────────────────
 * Gemini's inline-data endpoint only accepts a fixed list of MIME types.
 * Office document formats (DOCX, XLSX, DOC, XLS) are NOT on that list.
 * Sending them as inline-data causes Gemini to read raw binary / ZIP bytes
 * and respond with a description of the file's metadata rather than its text.
 *
 * This file enforces the rule: Gemini is only called for types it actually
 * supports. For everything else, the local parser is the only path, and if
 * that fails the user gets a clear, actionable error — not silent garbage.
 *
 * Gemini 2.x inline-data supported MIME types (as of mid-2025):
 *   application/pdf
 *   image/jpeg, image/png, image/gif, image/webp, image/heic, image/heif
 *   text/plain, text/html, text/csv, text/xml, text/rtf
 *
 * NOT supported (use local parser only):
 *   application/vnd.openxmlformats-officedocument.wordprocessingml.document  (.docx)
 *   application/vnd.openxmlformats-officedocument.spreadsheetml.sheet        (.xlsx)
 *   application/msword                                                        (.doc)
 *   application/vnd.ms-excel                                                  (.xls)
 */

import mammoth from "mammoth";
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();

// ─────────────────────────────────────────────────────────────────────────────
// SUPPORT MATRIX  (single source of truth)
// ─────────────────────────────────────────────────────────────────────────────
// geminiDirect: true  → send this file type to the Firebase/Gemini function
// geminiDirect: false → local parser ONLY; Gemini cannot process this format
// maxMb              → size limit that makes sense for this type
// suggestion         → what to tell the user when extraction fails
// ─────────────────────────────────────────────────────────────────────────────

export const FILE_SUPPORT = {
  // ── Fully supported: Gemini + local fallback ────────────────────────────
  pdf: {
    label: "PDF",
    localParser: "pdfjs",
    geminiDirect: true,
    maxMb: 20,
    suggestion: "Re-save the PDF using 'Print to PDF' to ensure a text layer, or scan at a higher resolution.",
  },
  jpg: {
    label: "JPEG image",
    localParser: null,
    geminiDirect: true,
    maxMb: 8,
    suggestion: "Ensure the image is sharp, well-lit, and not rotated. JPEG quality ≥ 80 works best.",
  },
  jpeg: {
    label: "JPEG image",
    localParser: null,
    geminiDirect: true,
    maxMb: 8,
    suggestion: "Ensure the image is sharp, well-lit, and not rotated.",
  },
  png: {
    label: "PNG image",
    localParser: null,
    geminiDirect: true,
    maxMb: 8,
    suggestion: "Ensure the image is clear and the text is readable.",
  },
  gif: {
    label: "GIF image",
    localParser: null,
    geminiDirect: true,
    maxMb: 5,
    suggestion: "For documents, save as PDF or JPEG for better extraction results.",
  },
  webp: {
    label: "WebP image",
    localParser: null,
    geminiDirect: true,
    maxMb: 5,
    suggestion: "For documents, save as PDF or JPEG for better extraction results.",
  },
  txt: {
    label: "Text file",
    localParser: "text",
    geminiDirect: true,
    maxMb: 5,
    suggestion: "Ensure the file is valid UTF-8 text.",
  },
  md: {
    label: "Markdown file",
    localParser: "text",
    geminiDirect: true,
    maxMb: 5,
    suggestion: "Ensure the file is valid UTF-8 text.",
  },
  csv: {
    label: "CSV file",
    localParser: "text",
    geminiDirect: true,
    maxMb: 10,
    suggestion: "Ensure the file is valid UTF-8 text.",
  },

  // ── Partially supported: local parser only — do NOT send to Gemini ────────
  docx: {
    label: "Word document (.docx)",
    localParser: "mammoth",
    geminiDirect: false,   // ← Gemini does not accept DOCX inline-data
    maxMb: 15,
    suggestion: "Open in Word, go to File → Save As → PDF, then upload the PDF instead.",
  },
  xlsx: {
    label: "Excel spreadsheet (.xlsx)",
    localParser: "xlsx",
    geminiDirect: false,   // ← Gemini does not accept XLSX inline-data
    maxMb: 15,
    suggestion: "Export the sheet as a PDF or CSV, then upload that instead.",
  },
  xls: {
    label: "Legacy Excel spreadsheet (.xls)",
    localParser: "xlsx",
    geminiDirect: false,   // ← Gemini does not accept XLS inline-data
    maxMb: 10,
    suggestion: "Open in Excel, Save As .xlsx or PDF, then upload that file.",
  },

  // ── Limited support: local parser may fail; HEIC/HEIF is unreliable ──────
  heic: {
    label: "HEIC image (iPhone photo)",
    localParser: null,
    geminiDirect: true,    // Gemini supports it, but conversion is safer
    maxMb: 8,
    suggestion: "Convert to JPEG first (Settings → Camera → Formats → Most Compatible on iPhone), then upload.",
  },
  heif: {
    label: "HEIF image",
    localParser: null,
    geminiDirect: true,
    maxMb: 8,
    suggestion: "Convert to JPEG first, then upload.",
  },

  // ── Cannot extract: legacy binary Word ───────────────────────────────────
  doc: {
    label: "Legacy Word document (.doc)",
    localParser: null,     // No reliable browser-side parser for legacy .doc
    geminiDirect: false,   // Gemini cannot process .doc inline-data
    maxMb: 0,              // Reject immediately — no path works reliably
    suggestion: "Open in Word and Save As → .docx or .pdf, then upload that file.",
  },
};

// Formats that are completely unsupported — reject before attempting anything
export const UNSUPPORTED_FORMATS = {
  zip:  "ZIP archives cannot be read. Please upload the individual documents inside the archive.",
  rar:  "RAR archives cannot be read. Please upload the individual documents inside the archive.",
  ppt:  "Legacy PowerPoint (.ppt) cannot be read. Convert to PDF via File → Export, then upload.",
  pptx: "PowerPoint files cannot be read. Convert to PDF via File → Export, then upload.",
  mp4:  "Video files cannot be processed. Please upload a document file.",
  mp3:  "Audio files cannot be processed. Please upload a document file.",
  wav:  "Audio files cannot be processed. Please upload a document file.",
  exe:  "Executable files cannot be processed.",
  bin:  "Binary files cannot be processed.",
};


// ─────────────────────────────────────────────────────────────────────────────
// MIME-TYPE RESOLVER
// Many camera / mobile uploads arrive with file.type = "" or
// "application/octet-stream". Guess from the extension so we never send a
// blank mimeType to the extraction function.
// ─────────────────────────────────────────────────────────────────────────────

const EXTENSION_MIME_MAP = {
  pdf:  "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc:  "application/msword",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls:  "application/vnd.ms-excel",
  jpg:  "image/jpeg",
  jpeg: "image/jpeg",
  png:  "image/png",
  gif:  "image/gif",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  txt:  "text/plain",
  md:   "text/markdown",
  csv:  "text/csv",
};

const getExt = (name = "") => (name.split(".").pop() || "").toLowerCase();

const resolveMimeType = (file) => {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  const ext = getExt(file.name);
  return EXTENSION_MIME_MAP[ext] || file.type || "application/octet-stream";
};


// ─────────────────────────────────────────────────────────────────────────────
// PRE-FLIGHT CHECK
// Returns null if the file is safe to process, or a structured failure object
// if it should be rejected immediately before any network call is made.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} ExtractionWarning
 * @property {string} fileName
 * @property {string} category
 * @property {'unsupported_format'|'size_limit'|'parse_error'|'no_content'|'gemini_error'} failureType
 * @property {string} message       - Short human-readable reason
 * @property {string} suggestion    - Actionable fix the user can take
 */

/**
 * Returns a warning object if the file should be rejected upfront, else null.
 * @returns {ExtractionWarning|null}
 */
export const preflightCheck = (file) => {
  const ext = getExt(file.name);
  const sizeMb = file.size / (1024 * 1024);

  // 1. Completely unsupported format
  if (UNSUPPORTED_FORMATS[ext]) {
    return {
      fileName: file.name,
      category: null,
      failureType: "unsupported_format",
      message: UNSUPPORTED_FORMATS[ext],
      suggestion: UNSUPPORTED_FORMATS[ext],
    };
  }

  const support = FILE_SUPPORT[ext];

  // 2. Unknown extension — try anyway but warn
  if (!support) {
    return null; // fall through to generic Gemini attempt
  }

  // 3. .doc files — no reliable extraction path
  if (ext === "doc") {
    return {
      fileName: file.name,
      category: null,
      failureType: "unsupported_format",
      message:
        "Legacy .doc files cannot be reliably extracted. Microsoft Word's binary format requires conversion first.",
      suggestion: support.suggestion,
    };
  }

  // 4. Zero-byte file
  if (file.size === 0) {
    return {
      fileName: file.name,
      category: null,
      failureType: "parse_error",
      message: "File is 0 bytes — it may not have uploaded correctly.",
      suggestion: "Try uploading the file again. If the problem persists, re-save and retry.",
    };
  }

  // 5. Size limit exceeded
  if (support.maxMb > 0 && sizeMb > support.maxMb) {
    return {
      fileName: file.name,
      category: null,
      failureType: "size_limit",
      message: `File is ${sizeMb.toFixed(1)} MB, which exceeds the ${support.maxMb} MB limit for ${support.label} files.`,
      suggestion: `Reduce the file size below ${support.maxMb} MB, or split it into smaller sections.`,
    };
  }

  return null; // all good
};


// ─────────────────────────────────────────────────────────────────────────────
// FAILURE DETECTION
// Catches all the ways extraction can silently return junk instead of content.
// Expanded to catch Gemini's actual "I can't process this" phrases (which vary
// by model version) as well as our new [FAIL:...] sentinel from the Firebase
// function, and raw binary leakage.
// ─────────────────────────────────────────────────────────────────────────────

const FAILURE_PATTERNS = [
  // Our own sentinel format (emitted by the improved Firebase function)
  /^\[FAIL:/i,

  // Legacy sentinel strings emitted by earlier versions of this pipeline
  /^\[.*skipped - file too large/i,
  /^\[.*extraction failed/i,
  /^\[.*extraction incomplete/i,
  /^\[.*reading failed/i,
  /^\[no text extracted\]/i,
  /^\[error extracting content/i,
  /Limited text extraction/i,

  // Gemini "I cannot" response variants
  /\bi('m| am) unable to (extract|read|process|access)/i,
  /\bcannot (extract|read|process|access) (this|the) (file|document|content|image)/i,
  /\bno (readable|extractable|discernible) (text|content)/i,
  /\bappears to be (encrypted|password.protected|corrupted|a binary|empty|blank)/i,
  /\bfile format (is )?not supported/i,
  /\bthis (file|document) (cannot|can't) be (processed|read|opened)/i,
  /\bi (cannot|can't) (open|read) this (file|document)/i,
  /\bthe (provided|uploaded) (file|document) (is|appears|seems)/i,

  // Metadata-only responses (Gemini describing the file instead of its content)
  /^(file name|file size|mime type|document type):/im,
  /unreadable/i,
];

/**
 * Returns true if `text` looks like a failure / garbage response rather than
 * actual extracted document content.
 */
export const looksLikeFailedExtraction = (text) => {
  if (!text) return true;
  const trimmed = text.trim();
  if (trimmed.length < 20) return true;

  if (FAILURE_PATTERNS.some((re) => re.test(trimmed))) return true;

  // If more than 30% of characters are non-printable/non-ASCII, it's likely
  // raw binary that leaked through rather than real text.
  const printable = (trimmed.match(/[ -~\t\n\r]/g) || []).length;
  if (printable / trimmed.length < 0.70) return true;

  return false;
};

/**
 * Parse the structured [FAIL:type] sentinel from the improved Firebase
 * function into a structured warning object.
 * Returns null if the text is NOT a failure sentinel.
 */
export const parseFailureSentinel = (text, fileName, category) => {
  const match = text?.match(/^\[FAIL:(\w+)\]\s*(.+)/s);
  if (!match) return null;

  const [, failureType, message] = match;
  const support = FILE_SUPPORT[getExt(fileName)];

  return {
    fileName,
    category,
    failureType,
    message: message.trim(),
    suggestion: support?.suggestion || "Try re-uploading as a PDF for the most reliable extraction.",
  };
};


// ─────────────────────────────────────────────────────────────────────────────
// GEMINI EXTRACTION  (Firebase Function wrapper)
// Only called for types where geminiDirect === true in FILE_SUPPORT.
// ─────────────────────────────────────────────────────────────────────────────

const extractWithGoogleAI = async (file, documentType = "Security Document") => {
  const mimeType = resolveMimeType(file);

  // Safety guard: never send a non-Gemini type to the Firebase function.
  // This is the primary fix for the "metadata instead of content" bug.
  const ext = getExt(file.name);
  const support = FILE_SUPPORT[ext];
  if (support && !support.geminiDirect) {
    throw new Error(
      `[FAIL:unsupported_format] ${support.label} files cannot be sent to the AI extractor. ` +
      `${support.suggestion}`
    );
  }

  console.log(`🔍 Sending ${file.name} to Gemini via Firebase Function (mimeType: ${mimeType})`);

  const base64Data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Failed to read file for upload"));
  });

  const extractText = httpsCallable(functions, "extractDocumentText");
  const result = await extractText({ base64Data, mimeType, fileName: file.name, documentType });

  if (!result.data.success) {
    throw new Error(result.data.error || "Extraction failed");
  }

  const extracted = result.data.text || "";

  if (looksLikeFailedExtraction(extracted)) {
    console.warn(`⚠️ Gemini returned unreadable content for ${file.name}`);
    throw new Error(
      `[FAIL:no_content] Gemini could not read the content of this file. ` +
      `${support?.suggestion || "Try uploading a clearer PDF or image."}`
    );
  }

  console.log(`✅ Gemini extraction successful for ${file.name}`);
  return extracted;
};


// ─────────────────────────────────────────────────────────────────────────────
// PER-TYPE EXTRACTORS
// ─────────────────────────────────────────────────────────────────────────────

const extractFromPDF = async (file) => {
  // Primary: Gemini (handles scanned PDFs via vision + digital PDFs via text layer)
  try {
    const text = await extractWithGoogleAI(file, "Guarantee, Contract, or Security Document PDF");
    if (text && text.length > 100) return text;
  } catch (geminiError) {
    console.warn("Gemini PDF extraction failed, trying PDF.js:", geminiError.message);
  }

  // Fallback: PDF.js (text-layer PDFs only — will return nothing for scanned PDFs)
  try {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc =
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    }).promise;

    let fullText = "";
    const maxPages = Math.min(pdf.numPages, 25);

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str || "").join(" ").trim();
      if (pageText) fullText += `\n\n[PAGE ${pageNum}]\n${pageText}`;
      if (fullText.length > 80000) break;
    }

    await pdf.destroy();

    if (!fullText || fullText.trim().length < 50) {
      return (
        "[FAIL:no_content] This PDF appears to be a scanned image without a text layer. " +
        "Re-upload as a higher-resolution JPEG or PNG for image-based OCR extraction."
      );
    }

    return fullText.length > 25000 ? fullText.slice(0, 25000) + "…[truncated]" : fullText;

  } catch (pdfjsError) {
    console.error("PDF.js extraction failed:", pdfjsError);
    return `[FAIL:parse_error] PDF could not be parsed: ${pdfjsError.message}. Re-save using 'Print to PDF' and try again.`;
  }
};


const extractFromDOCX = async (file) => {
  // Mammoth is the only reliable path for DOCX — do NOT fall back to Gemini.
  // Gemini's inline-data endpoint rejects application/vnd.openxmlformats-officedocument
  // MIME types and will read the raw ZIP bytes instead of the document content.
  try {
    const arrayBuffer = await file.arrayBuffer();
    const { value } = await mammoth.extractRawText({ arrayBuffer });

    if (!value || value.trim().length < 30) {
      return (
        "[FAIL:no_content] The Word document appears to be empty or contains no selectable text. " +
        "If it contains only images or drawings, export it as a PDF first."
      );
    }

    console.log("✅ DOCX extracted successfully with Mammoth");
    return value.length > 20000 ? value.slice(0, 20000) + "…[truncated]" : value;

  } catch (err) {
    console.error("Mammoth DOCX extraction failed:", err);
    return (
      "[FAIL:parse_error] Word document could not be read. " +
      "Save a fresh copy in Word (File → Save As → .docx) or export as PDF, then re-upload."
    );
  }
};


const extractFromXLS = async (file) => {
  // xlsx library handles both .xls and .xlsx — do NOT fall back to Gemini.
  // Office XML spreadsheet formats are not supported by Gemini's inline-data API.
  try {
    const XLSX = await import("xlsx");
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: "array" });

    const sheetNames = wb.SheetNames.slice(0, 5);
    const parts = [];

    for (const sheetName of sheetNames) {
      const ws = wb.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(ws, { FS: " | " });
      if (csv.trim()) {
        parts.push(`[SHEET: ${sheetName}]\n${csv}`);
      }
      if (parts.join("\n").length > 20000) break;
    }

    if (parts.length === 0) {
      return (
        "[FAIL:no_content] The spreadsheet appears to be empty. " +
        "Ensure the file contains data, or export the relevant sheets as a PDF."
      );
    }

    const result = parts.join("\n\n");
    console.log("✅ Spreadsheet extracted successfully");
    return result.length > 25000 ? result.slice(0, 25000) + "…[truncated]" : result;

  } catch (err) {
    console.error("xlsx extraction failed:", err);
    return (
      "[FAIL:parse_error] Spreadsheet could not be read (error: " + err.message + "). " +
      "Export as CSV or PDF and re-upload."
    );
  }
};


const extractFromImage = async (file) => {
  try {
    const text = await extractWithGoogleAI(file, "Security Document Image");
    return `[IMAGE TEXT EXTRACTED]\n${text}`;
  } catch (err) {
    return (
      `[FAIL:gemini_error] Image text extraction failed: ${err.message}. ` +
      "Ensure the image is clear, well-lit, and not rotated. JPEG at ≥ 80% quality works best."
    );
  }
};


const extractFromText = async (file) => {
  try {
    const text = await file.text();
    return text.length > 20000 ? text.slice(0, 20000) + "…[truncated]" : text;
  } catch (err) {
    return `[FAIL:parse_error] Could not read text file: ${err.message}`;
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXTRACTION ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract text from a File object.
 * Always returns a string. Failure strings start with [FAIL:type].
 * Call looksLikeFailedExtraction() or parseFailureSentinel() on the result
 * to detect and classify failures without string-matching in calling code.
 */
export const extractTextFromFile = async (file) => {
  const ext = getExt(file.name);

  console.log(`🔍 Extracting ${file.name} (ext: ${ext}, ${(file.size / 1024 / 1024).toFixed(2)} MB)`);

  switch (ext) {
    case "pdf":
      return extractFromPDF(file);

    case "docx":
      return extractFromDOCX(file);

    case "doc":
      // No reliable extraction path — pre-flight should have caught this,
      // but handle defensively in case it wasn't called.
      return (
        "[FAIL:unsupported_format] Legacy .doc files cannot be reliably extracted. " +
        FILE_SUPPORT.doc.suggestion
      );

    case "xlsx":
    case "xls":
      return extractFromXLS(file);

    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "webp":
    case "heic":
    case "heif":
      return extractFromImage(file);

    case "txt":
    case "md":
    case "csv":
      return extractFromText(file);

    default: {
      // Unknown extension — try Gemini if the MIME type is in its allow-list,
      // otherwise refuse cleanly.
      const mimeType = resolveMimeType(file);
      const geminiNative = [
        "application/pdf", "image/jpeg", "image/png", "image/gif",
        "image/webp", "image/heic", "image/heif",
        "text/plain", "text/html", "text/csv", "text/xml", "text/rtf",
      ];

      if (geminiNative.includes(mimeType)) {
        try {
          return await extractWithGoogleAI(file, "Unknown Document Type");
        } catch (err) {
          return `[FAIL:gemini_error] ${err.message}`;
        }
      }

      return (
        `[FAIL:unsupported_format] Files with extension ".${ext}" are not supported. ` +
        "Upload as PDF, DOCX, XLSX, or an image (JPEG, PNG) for best results."
      );
    }
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// FAILURE CLASSIFIER (for use in buildItemsPayload)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a structured ExtractionWarning from an extracted text string that
 * represents a failure, plus the file/category context.
 * Returns null if the text is NOT a failure.
 */
export const classifyExtractionResult = (text, file, category) => {
  if (!looksLikeFailedExtraction(text)) return null; // extraction succeeded

  // Try to parse our structured [FAIL:type] sentinel first
  const sentinel = parseFailureSentinel(text, file.name, category);
  if (sentinel) return { ...sentinel, category };

  // Legacy or unstructured failure string
  const support = FILE_SUPPORT[getExt(file.name)];
  return {
    fileName: file.name,
    category,
    failureType: "parse_error",
    message: text?.slice(0, 200) || "Extraction returned unreadable content.",
    suggestion:
      support?.suggestion ||
      "Try re-uploading as a clear PDF or high-resolution JPEG image.",
  };
};