"use client"
// GuaranteesAI.js
//
// Analyzes the full set of Security Instruments captured on the Guarantees page
// (contracts, guarantees, collateral, institutional support, existing financing).
//
// Changes vs. the previous version:
//   1. No "Analyze" button. The analysis is triggered by the parent (Save /
//      Save & Continue) through a ref:
//
//        const guaranteesAiRef = useRef(null)
//        ...
//        await guaranteesAiRef.current?.runAnalysis()
//
//   2. Documents that were already extracted/assessed are never re-processed.
//      Every file gets a fingerprint (name + size + lastModified). Extracted
//      text is cached against that fingerprint, so uploading a NEW document
//      only costs one extraction — the previously assessed ones are reused
//      from cache. If nothing at all has changed since the last analysis,
//      the whole run is skipped and the stored evaluation is reused.
//
// Usage (inside Guarantees.jsx, once instruments.length > 0):
//
//   <GuaranteesAI
//     ref={guaranteesAiRef}
//     instruments={instruments}
//     onEvaluationComplete={(evaluation) => { ... }}
//   />

import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { createPortal } from "react-dom";
import mammoth from "mammoth";
import { db, auth } from "../../firebaseConfig";
import { collection, query, where, getDocs, addDoc, setDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { fetchUserProfile } from "./PitchdeckAi";

const functions = getFunctions();

// ---------------------------------------------------------------------------
// Document extraction pipeline — unchanged from AiBusinessPlan.js, plus the
// hardening around blank mime types and unreadable extractions.
// ---------------------------------------------------------------------------

const EXTENSION_MIME_MAP = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  txt: "text/plain",
  md: "text/markdown",
  csv: "text/csv",
};

// Many camera/mobile uploads (and some renamed files) arrive with an empty
// or generic file.type, e.g. "" or "application/octet-stream". Sending that
// blank mimeType through to the extraction function is what makes it fall
// back to reading raw bytes/file metadata instead of the actual content.
const resolveMimeType = (file) => {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  const extension = (file.name || "").split(".").pop()?.toLowerCase() || "";
  return EXTENSION_MIME_MAP[extension] || file.type || "application/octet-stream";
};

// Heuristic check for whether extracted "text" actually looks like readable
// document content vs. garbage/binary/metadata that slipped through.
const looksLikeFailedExtraction = (text) => {
  if (!text) return true;
  const trimmed = text.trim();
  if (trimmed.length < 20) return true;

  const metadataMarkers = [
    /unreadable/i,
    /no (discernible|readable|extractable) (text|content)/i,
    /appears to be (corrupted|a system|empty|blank)/i,
    /cannot (read|process|interpret) this (file|image|document)/i,
    /\[no text extracted\]/i,
  ];
  if (metadataMarkers.some((re) => re.test(trimmed))) return true;

  const printable = trimmed.match(/[ -~\s]/g)?.length || 0;
  if (printable / trimmed.length < 0.7) return true;

  return false;
};

const extractWithGoogleAI = async (file, documentType = "Guarantee / Security Document") => {
  try {
    const mimeType = resolveMimeType(file);
    console.log(`🔍 Extracting ${file.name} via Firebase Function... (mimeType: ${mimeType})`)

    if (file.size === 0) {
      throw new Error("File is 0 bytes — it may not have uploaded correctly");
    }

    const base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result.split(',')[1])
      reader.onerror = () => reject(new Error("Failed to read file"))
    })

    const extractText = httpsCallable(functions, 'extractDocumentText');

    const result = await extractText({
      base64Data,
      mimeType,
      fileName: file.name,
      documentType
    });

    if (!result.data.success) {
      throw new Error(result.data.error || "Extraction failed");
    }

    const extracted = result.data.text || "[No text extracted]"

    if (looksLikeFailedExtraction(extracted)) {
      console.warn(`⚠️ Extraction for ${file.name} looks like garbage/metadata, not real content`)
      throw new Error("Extraction returned unreadable content (looked like metadata, not document text)");
    }

    console.log("✅ Firebase extraction successful")
    return extracted

  } catch (error) {
    console.error("❌ Firebase extraction failed:", error)

    if (error.code === 'functions/unauthenticated') {
      throw new Error("Please sign in to extract documents");
    } else if (error.code === 'functions/deadline-exceeded') {
      throw new Error("Document extraction timed out. Try a smaller file.");
    }

    throw new Error(`Extraction failed: ${error.message}`)
  }
}

const extractFromPDF = async (file) => {
  try {
    console.log("📄 Attempting PDF extraction with Google AI...")

    const aiText = await extractWithGoogleAI(file, "Guarantee, Contract, or Security Document PDF")
    if (aiText && aiText.length > 100) {
      console.log("✅ PDF extracted successfully with Google AI")
      return aiText
    }

    console.log("🔄 Falling back to PDF.js extraction...")
    let pdfjsLib = null

    try {
      const pdfjs = await import("pdfjs-dist")
      pdfjs.GlobalWorkerOptions.workerSrc =
        `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
      pdfjsLib = pdfjs
    } catch (pdfError) {
      console.warn("PDF.js not available:", pdfError)
      throw new Error("PDF extraction libraries not available")
    }

    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    })

    const pdf = await loadingTask.promise
    console.log(`✅ PDF loaded: ${pdf.numPages} pages`)

    const maxPages = Math.min(pdf.numPages, 25)
    let fullText = ""

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        const pageText = textContent.items
          .map((item) => item.str || "")
          .join(" ")
          .trim()

        if (pageText) {
          fullText += `\n\n[PAGE ${pageNum}]\n${pageText}`
        }

        if (fullText.length > 100000) {
          console.log("⚠️ Text limit reached, stopping extraction")
          break
        }
      } catch (pageError) {
        console.warn(`⚠️ Error extracting page ${pageNum}:`, pageError)
      }
    }

    await pdf.destroy()

    if (fullText.length === 0) {
      return "[PDF parsed but no selectable text found. This may be a scanned image PDF.]"
    }

    console.log(`✅ Successfully extracted ${fullText.length} characters from PDF`)
    return fullText.length > 25000 ? fullText.slice(0, 25000) + "…[truncated]" : fullText

  } catch (error) {
    console.error("❌ All PDF extraction methods failed:", error)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const fallbackText = new TextDecoder("utf-8", { fatal: false })
        .decode(new Uint8Array(arrayBuffer))
        .replace(/[^\u0009\u000A\u000D\u0020-\u007E]/g, " ")
        .replace(/\s+/g, " ")
        .trim()

      if (fallbackText && fallbackText.length > 100) {
        console.log("✅ Fallback extraction succeeded")
        return fallbackText.length > 10000 ? fallbackText.slice(0, 10000) + "…[truncated]" : fallbackText
      }
    } catch (fallbackError) {
      console.error("❌ Fallback extraction failed:", fallbackError)
    }

    return `[PDF extraction failed: ${error.message}]`
  }
}

const extractFromDOCX = async (file) => {
  try {
    console.log("📝 Attempting DOCX extraction with Mammoth...")
    const arrayBuffer = await file.arrayBuffer()
    const { value } = await mammoth.extractRawText({ arrayBuffer })

    if (value && value.length > 100) {
      console.log("✅ DOCX extracted successfully with Mammoth")
      return value.length > 20000 ? value.slice(0, 20000) + "…[truncated]" : value
    }

    console.log("🔄 Falling back to Google AI for DOCX...")
    const aiText = await extractWithGoogleAI(file, "Word Document")
    return aiText

  } catch (error) {
    console.error("❌ DOCX extraction failed:", error)

    try {
      const aiText = await extractWithGoogleAI(file, "Word Document")
      return aiText
    } catch (aiError) {
      return "[DOCX file - extraction incomplete]"
    }
  }
}

const extractFromImage = async (file) => {
  try {
    console.log("🖼️ Extracting text from image with Google AI...")
    const aiText = await extractWithGoogleAI(file, "Guarantee or Security Document Image")

    if (aiText && aiText.length > 50) {
      console.log("✅ Image text extraction successful")
      return `[IMAGE TEXT EXTRACTED]\n${aiText}`
    }

    return `[Image file ${file.name} - Limited text extraction. Consider uploading PDF/DOCX for better analysis.]`

  } catch (error) {
    console.error("❌ Image extraction failed:", error)
    return `[Image file ${file.name} - Text extraction failed. Please upload PDF/DOCX for analysis.]`
  }
}

let xlsxLib = null

const ensureXlsx = async () => {
  if (!xlsxLib) {
    try {
      xlsxLib = await import("xlsx")
    } catch {
      xlsxLib = null
    }
  }
  return xlsxLib
}

const extractFromXLS = async (file) => {
  try {
    const XLSX = await ensureXlsx()
    if (!XLSX) {
      const aiText = await extractWithGoogleAI(file, "Excel Spreadsheet with Security/Financial Data")
      return aiText || "[Excel file - xlsx parser not installed]"
    }

    const arrayBuffer = await file.arrayBuffer()
    const wb = XLSX.read(arrayBuffer, { type: "array" })
    const sheetNames = wb.SheetNames.slice(0, 5)
    let out = []

    for (const s of sheetNames) {
      const ws = wb.Sheets[s]
      const csv = XLSX.utils.sheet_to_csv(ws, { FS: " | " })
      out.push(`[SHEET: ${s}]\n${csv}`)
      if (out.join("\n").length > 25000) break
    }

    const result = out.join("\n\n")
    return result.length > 25000 ? result.slice(0, 25000) + "…[truncated]" : result

  } catch (error) {
    console.error("❌ Excel extraction failed:", error)

    try {
      const aiText = await extractWithGoogleAI(file, "Excel Spreadsheet")
      return aiText
    } catch (aiError) {
      return "[Excel file - extraction failed]"
    }
  }
}

const extractFromText = async (file) => {
  try {
    const text = await file.text()
    return text.length > 20000 ? text.slice(0, 20000) + "…[truncated]" : text
  } catch (error) {
    console.error("❌ Text file extraction failed:", error)
    return "[Text file - reading failed]"
  }
}

const isExtractionFailureText = (text) => {
  if (!text) return true;
  const failureMarkers = [
    /^\[.*skipped - file too large/i,
    /^\[.*extraction failed/i,
    /^\[.*extraction incomplete/i,
    /^\[.*reading failed/i,
    /^\[No text extracted\]/i,
    /^\[Error extracting content/i,
    /0 bytes/i,
    /Limited text extraction/i,
  ];
  return failureMarkers.some((re) => re.test(text.trim()));
};

const ext = (name = "") => name.split(".").pop()?.toLowerCase() || ""

const extractTextFromFile = async (file) => {
  const fileExt = ext(file.name);
  const sizeMb = file.size / (1024 * 1024);

  const sizeLimits = {
    pdf: 25,
    docx: 20,
    doc: 15,
    xlsx: 25,
    xls: 25,
    jpg: 10,
    jpeg: 10,
    png: 10,
    gif: 5,
    webp: 5,
    txt: 10,
    md: 10,
    csv: 10,
    default: 15
  };

  const limit = sizeLimits[fileExt] || sizeLimits.default;
  if (sizeMb > limit) {
    return `[${file.name}] skipped - file too large (${sizeMb.toFixed(1)} MB). Max supported: ${limit} MB for ${fileExt.toUpperCase()} files.`;
  }

  let text = ""
  let extractionMethod = "traditional"

  try {
    console.log(`🔍 Processing ${file.name} (${fileExt})...`)

    switch (fileExt) {
      case "pdf":
        text = await extractFromPDF(file)
        extractionMethod = "google_ai+pdfjs"
        break

      case "docx":
        text = await extractFromDOCX(file)
        extractionMethod = "mammoth+google_ai"
        break

      case "doc":
        text = await extractWithGoogleAI(file, "Legacy Word Document")
        extractionMethod = "google_ai"
        break

      case "xlsx":
      case "xls":
        text = await extractFromXLS(file)
        extractionMethod = "xlsx+google_ai"
        break

      case "jpg":
      case "jpeg":
      case "png":
        text = await extractFromImage(file)
        extractionMethod = "google_ai_vision"
        break

      case "txt":
      case "md":
        text = await extractFromText(file)
        extractionMethod = "direct"
        break

      default:
        console.log(`🔄 Unknown file type ${fileExt}, trying Google AI...`)
        text = await extractWithGoogleAI(file, "Unknown Document Type")
        extractionMethod = "google_ai"
    }

    if (text.length > 30000) {
      text = text.slice(0, 30000) + "…[truncated for API limits]"
    }

    console.log(`✅ ${file.name} processed successfully with ${extractionMethod}`)
    return text

  } catch (error) {
    console.error(`❌ Error processing ${file.name}:`, error)

    try {
      console.log("🔄 Attempting final fallback with Google AI...")
      const fallbackText = await extractWithGoogleAI(file, "Document of unknown type")
      return fallbackText || `[Extraction failed: ${error.message}]`
    } catch (finalError) {
      return `[Error extracting content from ${file.name}: ${error.message}]`
    }
  }
}

// ---------------------------------------------------------------------------
// Extraction cache + change detection
//
// The cache lives at module level so it survives re-renders, section switches
// and even navigating away from the Guarantees step and back — anything that
// keeps the tab open. A file is identified by name + size + lastModified, so
// re-picking the exact same document also hits the cache.
// ---------------------------------------------------------------------------

const extractionCache = new Map(); // fingerprint -> extracted text (successes only)

const fileFingerprint = (file) => {
  if (file instanceof File) {
    return `file::${file.name}::${file.size}::${file.lastModified}`;
  }
  if (typeof file === "string") return `url::${file}`;
  return `ref::${file?.url || file?.path || file?.name || "unknown"}`;
};

const displayName = (file) => {
  if (file instanceof File) return file.name;
  if (typeof file === "string") return file.split("/").pop();
  return file?.name || "previously uploaded document";
};

const SIGNATURE_FIELDS = [
  "category",
  "instrument",
  "instrumentOther",
  "counterpartyName",
  "counterpartyType",
  "counterpartyTypeOther",
  "value",
  "startDate",
  "endDate",
  "paymentTerms",
  "isSigned",
  "isCurrent",
  "isAssignable",
  "isFunderConsentRequired",
  "notes",
];

const cheapHash = (str) => {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
};

// A signature changes whenever the instrument's details or its documents
// change. Same signature = already assessed, nothing to redo.
const instrumentSignature = (item) => {
  const fields = SIGNATURE_FIELDS.map((f) => `${f}=${item?.[f] ?? ""}`);
  const files = (item?.files || []).map(fileFingerprint).sort();
  return cheapHash([...fields, "|files|", ...files].join("~"));
};

const buildSignatureMap = (items) => {
  const map = {};
  items.forEach((item) => {
    map[item.id || item.category] = instrumentSignature(item);
  });
  return map;
};

const signatureMapsMatch = (a = {}, b = {}) => {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length === 0 || keysA.length !== keysB.length) return false;
  return keysA.every((k) => a[k] === b[k]);
};

// Extract once, reuse forever. Failed extractions are NOT cached so the user
// can fix the file and try again.
const extractWithCache = async (file) => {
  const key = fileFingerprint(file);

  if (extractionCache.has(key)) {
    console.log(`♻️ Reusing cached extraction for ${displayName(file)}`);
    return { text: extractionCache.get(key), cached: true, failed: false };
  }

  const text = await extractTextFromFile(file);
  const failed = isExtractionFailureText(text);
  if (!failed) extractionCache.set(key, text);

  return { text, cached: false, failed };
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const mapToBIGStage = (stage) => {
  switch (stage?.toLowerCase()) {
    case "startup": return "Pre-seed";
    case "growth": return "Seed";
    case "scaling": return "Series A/B";
    case "mature":
    case "turnaround": return "Maturity";
    default: return "Pre-seed";
  }
};

const LABEL_COLORS = {
  "Low Risk - Highly Fundable": { bg: "#e8f5e9", text: "#2e7d32" },
  "Moderate Risk - Fundable with Mitigation": { bg: "#fff8e1", text: "#f9a825" },
  "High Risk - Needs Significant Improvement": { bg: "#fff3e0", text: "#ef6c00" },
  "Critical Risk - Not Fundable": { bg: "#ffebee", text: "#c62828" },
  "Analysis Failed": { bg: "#f5f5f5", text: "#616161" },
};

const getLabelColor = (label) => LABEL_COLORS[label] || LABEL_COLORS["Analysis Failed"];

// ---------------------------------------------------------------------------
// Blocking overlay shown for the whole run.
//
// Portalled to <body> so no ancestor stacking context can trap it, sits above
// the app's other popups (z-index 9999), swallows every pointer and key event,
// locks page scroll and warns on refresh/close. There is deliberately no
// dismiss control — the run has to finish.
// ---------------------------------------------------------------------------

const ANALYSIS_STEPS = [
  { key: "extracting", label: "Reading your documents" },
  { key: "profile", label: "Loading your business profile" },
  { key: "analyzing", label: "Scoring your guarantees & collateral" },
  { key: "saving", label: "Saving your results" },
];

const AnalysisOverlay = ({ phase, status, currentFileIndex, totalFiles }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    // Escape / Enter / Space must not reach anything behind the overlay, and
    // Tab must not walk focus into the form underneath it.
    const blockKeys = (e) => {
      if (e.key === "Escape" || e.key === "Tab") {
        e.preventDefault();
        e.stopPropagation();
        containerRef.current?.focus();
      }
    };

    const warnOnUnload = (e) => {
      e.preventDefault();
      e.returnValue = "Your guarantees are still being analyzed. Leave anyway?";
      return e.returnValue;
    };

    document.addEventListener("keydown", blockKeys, true);
    window.addEventListener("beforeunload", warnOnUnload);
    containerRef.current?.focus();

    return () => {
      body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", blockKeys, true);
      window.removeEventListener("beforeunload", warnOnUnload);
    };
  }, []);

  const activeIndex = Math.max(
    0,
    ANALYSIS_STEPS.findIndex((s) => s.key === phase)
  );

  const showFileProgress = phase === "extracting" && totalFiles > 0;
  const percent = showFileProgress
    ? Math.round((currentFileIndex / totalFiles) * 100)
    : null;

  return (
    <div
      className="guarantees-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-live="polite"
      aria-label="Analyzing your guarantees and collateral"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="guarantees-overlay-card" tabIndex={-1} ref={containerRef}>
        <div className="guarantees-overlay-spinner" aria-hidden="true" />

        <h3 className="guarantees-overlay-title">Analyzing your guarantees &amp; collateral</h3>
        <p className="guarantees-overlay-subtitle">
          This takes a moment. Keep this page open — closing or navigating away now
          will lose the analysis.
        </p>

        <ol className="guarantees-overlay-steps">
          {ANALYSIS_STEPS.map((step, i) => {
            const state = i < activeIndex ? "done" : i === activeIndex ? "active" : "pending";
            return (
              <li key={step.key} className={`guarantees-overlay-step is-${state}`}>
                <span className="guarantees-overlay-step-marker">
                  {state === "done" ? "✓" : i + 1}
                </span>
                <span className="guarantees-overlay-step-label">{step.label}</span>
              </li>
            );
          })}
        </ol>

        {showFileProgress && (
          <div className="guarantees-overlay-progress">
            <div className="guarantees-overlay-progress-track">
              <div
                className="guarantees-overlay-progress-fill"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="guarantees-overlay-progress-label">
              {currentFileIndex} of {totalFiles} new documents
            </div>
          </div>
        )}

        {status && <div className="guarantees-overlay-status">{status}</div>}
      </div>
    </div>
  );
};

const GuaranteesAI = forwardRef(function GuaranteesAI(
  { instruments = [], onEvaluationComplete },
  ref
) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState(null); // { score, label, instrumentScores, analysis }
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [extractionWarnings, setExtractionWarnings] = useState([]);
  const [lastRunAt, setLastRunAt] = useState(null);
  const [skippedMessage, setSkippedMessage] = useState("");
  const [phase, setPhase] = useState(null); // extracting | profile | analyzing | saving

  // Signatures of everything already assessed by the last successful run.
  const analyzedSignaturesRef = useRef({});
  const lastEvaluationRef = useRef(null);
  const isRunningRef = useRef(false);

  // Only instruments that have at least a category selected and either a
  // file or meaningful metadata are worth sending — skip fully-empty rows.
  const analyzableInstruments = instruments.filter(
    (item) => item.category && (
      (item.files && item.files.length > 0) ||
      item.counterpartyName ||
      item.value ||
      item.instrument
    )
  );

  // ----- Load the previous evaluation so a reload doesn't re-analyze -------
  useEffect(() => {
    let cancelled = false;

    const loadPrevious = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      try {
        const evaluationsRef = collection(db, "aiEvaluations");
        const q = query(evaluationsRef, where("userId", "==", userId));
        const snapshot = await getDocs(q);
        if (snapshot.empty || cancelled) return;

        const stored = snapshot.docs[0].data()?.guaranteesEvaluation;
        if (!stored || cancelled) return;

        const evaluation = {
          score: stored.score,
          label: stored.label,
          instrumentScores: stored.instrumentScores || [],
          analysis: stored.analysis,
        };

        analyzedSignaturesRef.current = stored.instrumentSignatures || {};
        lastEvaluationRef.current = evaluation;
        setResult(evaluation);
        setLastRunAt(stored.evaluatedAt || null);
      } catch (err) {
        console.warn("Could not load previous guarantees evaluation:", err);
      }
    };

    loadPrevious();
    return () => { cancelled = true; };
  }, []);

  // ----- Payload building --------------------------------------------------
  const buildItemsPayload = async (items, previousSignatures) => {
    const payload = [];
    const warnings = [];
    setPhase("extracting");

    // Only count files that actually need extracting, so the progress
    // counter reflects real work rather than cache hits.
    const pendingFiles = items.flatMap((item) =>
      (item.files || [])
        .filter((f) => f instanceof File)
        .filter((f) => !extractionCache.has(fileFingerprint(f)))
    );
    setTotalFiles(pendingFiles.length);
    let processedCount = 0;

    for (const item of items) {
      const key = item.id || item.category;
      const signature = instrumentSignature(item);
      const unchanged = previousSignatures[key] === signature;

      const files = item.files || [];
      const fileNames = files.map(displayName);
      let extractedText = "";

      for (const file of files) {
        if (!(file instanceof File)) continue; // already-saved uploads: nothing to re-read

        const cacheHit = extractionCache.has(fileFingerprint(file));
        if (!cacheHit) {
          processedCount += 1;
          setCurrentFileIndex(processedCount);
          setStatus(`Reading document ${processedCount} of ${pendingFiles.length}: ${file.name}`);
        }

        try {
          const { text, failed } = await extractWithCache(file);
          if (failed) warnings.push({ fileName: file.name, category: item.category });
          extractedText += `\n\n[FILE: ${file.name}]\n${text}`;
        } catch (err) {
          warnings.push({ fileName: file.name, category: item.category });
          extractedText += `\n\n[FILE: ${file.name}] extraction failed: ${err.message}`;
        }
      }

      const previousScore = (lastEvaluationRef.current?.instrumentScores || []).find(
        (s) => s.id === key
      );

      payload.push({
        id: key,
        category: item.category,
        extractedText: extractedText.trim(),
        fileNames,
        // Lets the backend reuse its earlier reasoning for instruments that
        // haven't changed instead of scoring them from scratch.
        unchanged,
        previousScore: unchanged ? previousScore?.score ?? null : null,
        previousLabel: unchanged ? previousScore?.label ?? null : null,
        metadata: {
          instrument: item.instrument,
          instrumentOther: item.instrumentOther,
          counterpartyName: item.counterpartyName,
          counterpartyType: item.counterpartyType,
          counterpartyTypeOther: item.counterpartyTypeOther,
          value: item.value,
          startDate: item.startDate,
          endDate: item.endDate,
          paymentTerms: item.paymentTerms,
          isSigned: item.isSigned,
          isCurrent: item.isCurrent,
          isAssignable: item.isAssignable,
          isFunderConsentRequired: item.isFunderConsentRequired,
          notes: item.notes,
        },
      });
    }

    return { payload, warnings };
  };

  const saveToFirebase = async (evaluation, signatures) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const dataToSave = {
      guaranteesEvaluation: {
        ...evaluation,
        instrumentSignatures: signatures,
        evaluatedAt: new Date().toISOString(),
      },
      userId,
    };

    const evaluationsRef = collection(db, "aiEvaluations");
    const q = query(evaluationsRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      await setDoc(snapshot.docs[0].ref, dataToSave, { merge: true });
    } else {
      await addDoc(evaluationsRef, { ...dataToSave, createdAt: new Date().toISOString() });
    }
  };

  // ----- The run, called by the parent on Save / Save & Continue -----------
  const runAnalysis = async ({ force = false } = {}) => {
    if (isRunningRef.current) {
      return { ran: false, reason: "already-running" };
    }

    const items = analyzableInstruments;

    if (items.length === 0) {
      setSkippedMessage("");
      return { ran: false, reason: "no-instruments" };
    }

    const signatures = buildSignatureMap(items);

    if (!force && signatureMapsMatch(signatures, analyzedSignaturesRef.current)) {
      setSkippedMessage("No changes since the last analysis — your existing score still applies.");
      setError(null);
      return { ran: false, reason: "unchanged", evaluation: lastEvaluationRef.current };
    }

    isRunningRef.current = true;
    setIsLoading(true);
    setError(null);
    setSkippedMessage("");
    setExtractionWarnings([]);
    setCurrentFileIndex(0);
    setTotalFiles(0);
    setPhase("extracting");
    setStatus("Preparing your documents...");

    try {
      const { payload, warnings } = await buildItemsPayload(items, analyzedSignaturesRef.current);
      setExtractionWarnings(warnings);

      setPhase("profile");
      setStatus("Fetching your profile...");
      const profileData = await fetchUserProfile();
      const stageLabel = mapToBIGStage(profileData?.entityOverview?.operationStage);

      const newOrChanged = payload.filter((p) => !p.unchanged).length;
      setPhase("analyzing");
      setStatus(
        newOrChanged === payload.length
          ? "Analyzing your guarantees & collateral..."
          : `Updating your score for ${newOrChanged} new/changed item(s)...`
      );

      const analyzeFn = httpsCallable(functions, "analyzeSecurityInstruments");
      const { data } = await analyzeFn({
        items: payload,
        profileData,
        stageLabel,
        previousEvaluation: lastEvaluationRef.current || null,
      });

      if (!data.success) {
        throw new Error(data.error || "Analysis failed");
      }

      // Defensive merge: if the backend only returns scores for the items it
      // re-scored, keep the previously stored score for the rest.
      const returned = data.instrumentScores || [];
      const previous = lastEvaluationRef.current?.instrumentScores || [];
      const instrumentScores = payload.map((item, index) => {
        const match =
          returned.find((r) => r.id === item.id) ||
          (returned.length === payload.length ? returned[index] : null);
        if (match) return { id: item.id, ...match };
        const old = previous.find((p) => p.id === item.id);
        return old || { id: item.id, category: item.category, score: null, label: null };
      });

      const evaluation = {
        score: data.score,
        label: data.label,
        instrumentScores,
        analysis: data.analysis,
      };

      setResult(evaluation);
      lastEvaluationRef.current = evaluation;
      analyzedSignaturesRef.current = signatures;

      setPhase("saving");
      setStatus("Saving results...");
      await saveToFirebase(evaluation, signatures);
      setLastRunAt(new Date().toISOString());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      if (onEvaluationComplete) onEvaluationComplete(evaluation);
      setStatus("");

      return { ran: true, evaluation };
    } catch (err) {
      console.error("Guarantees analysis error:", err);
      setError(err.message || "Something went wrong while analyzing your guarantees.");
      setStatus("");
      return { ran: false, reason: "error", error: err };
    } finally {
      isRunningRef.current = false;
      setIsLoading(false);
      setPhase(null);
    }
  };

  // Keep the exposed method pointing at the latest closure so it always sees
  // current props/state without re-creating the ref handle.
  const runRef = useRef(runAnalysis);
  runRef.current = runAnalysis;

  useImperativeHandle(ref, () => ({
    runAnalysis: (options) => runRef.current(options),
    hasPendingChanges: () => {
      const items = instruments.filter(
        (item) => item.category && (
          (item.files && item.files.length > 0) ||
          item.counterpartyName ||
          item.value ||
          item.instrument
        )
      );
      if (items.length === 0) return false;
      return !signatureMapsMatch(buildSignatureMap(items), analyzedSignaturesRef.current);
    },
    isAnalyzing: () => isRunningRef.current,
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="guarantees-ai">
      {isLoading && typeof document !== "undefined" &&
        createPortal(
          <AnalysisOverlay
            phase={phase}
            status={status}
            currentFileIndex={currentFileIndex}
            totalFiles={totalFiles}
          />,
          document.body
        )}

      {!isLoading && !result && !error && (
        <div className="guarantees-ai-hint">
          Your guarantees and collateral are scored automatically when you save this section.
          Documents that have already been assessed aren't read again.
        </div>
      )}

      {isLoading && (
        <div className="guarantees-ai-status">
          {status}
          {totalFiles > 0 && (
            <span> ({currentFileIndex}/{totalFiles} new documents)</span>
          )}
        </div>
      )}

      {!isLoading && skippedMessage && (
        <div className="guarantees-ai-hint">{skippedMessage}</div>
      )}

      {error && <div className="guarantees-ai-error">{error}</div>}

      {!isLoading && extractionWarnings.length > 0 && (
        <div className="guarantees-ai-warning">
          <strong>{extractionWarnings.length} file(s) couldn't be read properly</strong> — the
          score below treated these as undocumented. Try re-uploading as a clear PDF or photo:
          <ul>
            {extractionWarnings.map((w, i) => (
              <li key={i}>{w.fileName}</li>
            ))}
          </ul>
        </div>
      )}

      {result && (
        <div className="guarantees-ai-result">
          <div className="guarantees-ai-overall" style={{
            backgroundColor: getLabelColor(result.label).bg,
            borderColor: getLabelColor(result.label).text,
          }}>
            <div className="guarantees-ai-score">{result.score ?? "—"}/100</div>
            <div className="guarantees-ai-label" style={{ color: getLabelColor(result.label).text }}>
              {result.label}
            </div>
            {lastRunAt && (
              <div className="guarantees-ai-timestamp">
                Last scored {new Date(lastRunAt).toLocaleString()}
              </div>
            )}
            {saveSuccess && <div className="guarantees-ai-saved">Saved to your profile ✓</div>}
          </div>

          {result.instrumentScores?.length > 0 && (
            <div className="guarantees-ai-breakdown">
              {result.instrumentScores.map((inst, i) => (
                <div key={inst.id || i} className="guarantees-ai-instrument-row">
                  <span className="guarantees-ai-instrument-name">
                    {i + 1}. {inst.instrument || inst.category || "Security Instrument"}
                  </span>
                  <span className="guarantees-ai-instrument-score">
                    {inst.score !== null && inst.score !== undefined ? `${inst.score}/100` : "—"}
                    {inst.label ? ` · ${inst.label}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}

          <details className="guarantees-ai-full">
            <summary>View full AI analysis</summary>
            <pre className="guarantees-ai-full-text">{result.analysis}</pre>
          </details>
        </div>
      )}

      <style>{`
        .guarantees-ai {
          margin-top: 1.5rem;
        }

        /* ---- blocking analysis overlay ---- */

        .guarantees-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000; /* above the app's other popups (9999) */
          background: rgba(62, 39, 35, 0.55);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          box-sizing: border-box;
          cursor: wait;
        }

        .guarantees-overlay-card {
          background: #fff;
          border-radius: 10px;
          padding: 1.75rem 1.75rem 1.5rem;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 12px 40px rgba(62, 39, 35, 0.35);
          text-align: left;
          outline: none;
        }

        .guarantees-overlay-spinner {
          width: 34px;
          height: 34px;
          border: 3px solid #efe6e1;
          border-top-color: #8d6e63;
          border-radius: 50%;
          animation: guarantees-spin 0.9s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes guarantees-spin {
          to { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .guarantees-overlay-spinner { animation-duration: 2.4s; }
        }

        .guarantees-overlay-title {
          margin: 0 0 0.4rem;
          font-size: 1.05rem;
          font-weight: 600;
          color: #3e2723;
        }

        .guarantees-overlay-subtitle {
          margin: 0 0 1.1rem;
          font-size: 0.85rem;
          line-height: 1.5;
          color: #6d4c41;
        }

        .guarantees-overlay-steps {
          list-style: none;
          margin: 0 0 0.9rem;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
        }

        .guarantees-overlay-step {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.85rem;
          color: #bcaaa4;
        }

        .guarantees-overlay-step-marker {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 700;
          background: #f0e9e4;
          color: #a1887f;
        }

        .guarantees-overlay-step.is-active {
          color: #3e2723;
          font-weight: 600;
        }

        .guarantees-overlay-step.is-active .guarantees-overlay-step-marker {
          background: #8d6e63;
          color: #fff;
        }

        .guarantees-overlay-step.is-done {
          color: #6d4c41;
        }

        .guarantees-overlay-step.is-done .guarantees-overlay-step-marker {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .guarantees-overlay-progress {
          margin-bottom: 0.75rem;
        }

        .guarantees-overlay-progress-track {
          height: 6px;
          border-radius: 3px;
          background: #f0e9e4;
          overflow: hidden;
        }

        .guarantees-overlay-progress-fill {
          height: 100%;
          background: #8d6e63;
          transition: width 0.3s ease;
        }

        .guarantees-overlay-progress-label {
          margin-top: 0.35rem;
          font-size: 0.78rem;
          color: #8d6e63;
        }

        .guarantees-overlay-status {
          font-size: 0.78rem;
          color: #a1887f;
          word-break: break-word;
        }

        .guarantees-ai-hint {
          padding: 0.6rem 0.9rem;
          background: #faf8f6;
          border: 1px dashed #d7ccc8;
          border-radius: 6px;
          color: #6d4c41;
          font-size: 0.85rem;
          line-height: 1.5;
        }

        .guarantees-ai-status {
          margin-top: 0.6rem;
          font-size: 0.85rem;
          color: #6d4c41;
        }

        .guarantees-ai-error {
          margin-top: 0.6rem;
          padding: 0.6rem 0.9rem;
          background: #ffebee;
          border: 1px solid #ef9a9a;
          border-radius: 6px;
          color: #c62828;
          font-size: 0.85rem;
        }

        .guarantees-ai-warning {
          margin-top: 0.6rem;
          padding: 0.6rem 0.9rem;
          background: #fff8e1;
          border: 1px solid #ffe082;
          border-radius: 6px;
          color: #8d6e00;
          font-size: 0.85rem;
        }

        .guarantees-ai-warning ul {
          margin: 0.4rem 0 0;
          padding-left: 1.1rem;
        }

        .guarantees-ai-result {
          margin-top: 1rem;
        }

        .guarantees-ai-overall {
          border: 2px solid;
          border-radius: 8px;
          padding: 1rem 1.25rem;
        }

        .guarantees-ai-score {
          font-size: 1.6rem;
          font-weight: 700;
          color: #3e2723;
        }

        .guarantees-ai-label {
          font-weight: 600;
          margin-top: 0.25rem;
        }

        .guarantees-ai-timestamp {
          margin-top: 0.35rem;
          font-size: 0.78rem;
          color: #8d6e63;
        }

        .guarantees-ai-saved {
          margin-top: 0.5rem;
          font-size: 0.8rem;
          color: #2e7d32;
        }

        .guarantees-ai-breakdown {
          margin-top: 1rem;
          border: 1px solid #e8ddd6;
          border-radius: 8px;
          overflow: hidden;
        }

        .guarantees-ai-instrument-row {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.6rem 0.9rem;
          font-size: 0.85rem;
          border-bottom: 1px solid #f0e9e4;
        }

        .guarantees-ai-instrument-row:last-child {
          border-bottom: none;
        }

        .guarantees-ai-instrument-name {
          color: #5d4037;
          font-weight: 500;
        }

        .guarantees-ai-instrument-score {
          color: #8d6e63;
        }

        .guarantees-ai-full {
          margin-top: 0.75rem;
          font-size: 0.85rem;
          color: #6d4c41;
        }

        .guarantees-ai-full-text {
          white-space: pre-wrap;
          background: #faf8f6;
          border: 1px solid #e8ddd6;
          border-radius: 6px;
          padding: 0.75rem;
          margin-top: 0.5rem;
          font-family: inherit;
          font-size: 0.82rem;
        }
      `}</style>
    </div>
  );
});

export default GuaranteesAI;