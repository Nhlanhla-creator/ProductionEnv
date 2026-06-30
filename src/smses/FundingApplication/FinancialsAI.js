// FinancialsGPT.jsx — comprehensive financial health analysis via Gemini
"use client"
import React, { useState, useEffect, useRef } from 'react';
import mammoth from 'mammoth';
import { db, auth } from '../../firebaseConfig';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

// ─────────────────────────────────────────────────────────────────────────
// Shared extraction pipeline (mirrors AiBusinessPlan.jsx / BPAI)
// ─────────────────────────────────────────────────────────────────────────

const extractWithGoogleAI = async (file, documentType = "Financial Document") => {
  try {
    const base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = () => reject(new Error("Failed to read file"));
    });

    const extractText = httpsCallable(functions, 'extractDocumentText');
    const result = await extractText({
      base64Data,
      mimeType: file.type,
      fileName: file.name,
      documentType
    });

    if (!result.data.success) {
      throw new Error(result.data.error || "Extraction failed");
    }
    return result.data.text || "[No text extracted]";
  } catch (error) {
    if (error.code === 'functions/unauthenticated') {
      throw new Error("Please sign in to extract documents");
    } else if (error.code === 'functions/deadline-exceeded') {
      throw new Error("Document extraction timed out. Try a smaller file.");
    }
    throw new Error(`Extraction failed: ${error.message}`);
  }
};

const extractFromPDF = async (file) => {
  try {
    const aiText = await extractWithGoogleAI(file, "Financial Statement PDF (balance sheet, income statement, cash flow)");
    if (aiText && aiText.length > 100) return aiText;

    let pdfjsLib = null;
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc =
        `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
      pdfjsLib = pdfjs;
    } catch {
      throw new Error("PDF extraction libraries not available");
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    }).promise;

    const maxPages = Math.min(pdf.numPages, 25);
    let fullText = "";
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str || "").join(" ").trim();
        if (pageText) fullText += `\n\n[PAGE ${pageNum}]\n${pageText}`;
        if (fullText.length > 100000) break;
      } catch (pageError) {
        console.warn(`⚠️ Error extracting page ${pageNum}:`, pageError);
      }
    }
    await pdf.destroy();

    if (fullText.length === 0) {
      return "[PDF parsed but no selectable text found. This may be a scanned image PDF.]";
    }
    return fullText.length > 25000 ? fullText.slice(0, 25000) + "…[truncated]" : fullText;
  } catch (error) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const fallbackText = new TextDecoder("utf-8", { fatal: false })
        .decode(new Uint8Array(arrayBuffer))
        .replace(/[^\u0009\u000A\u000D\u0020-\u007E]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (fallbackText && fallbackText.length > 100) {
        return fallbackText.length > 10000 ? fallbackText.slice(0, 10000) + "…[truncated]" : fallbackText;
      }
    } catch {}
    return `[PDF extraction failed: ${error.message}]`;
  }
};

const extractFromDOCX = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const { value } = await mammoth.extractRawText({ arrayBuffer });
    if (value && value.length > 100) {
      return value.length > 20000 ? value.slice(0, 20000) + "…[truncated]" : value;
    }
    return await extractWithGoogleAI(file, "Word Document - Financial Report");
  } catch {
    try {
      return await extractWithGoogleAI(file, "Word Document - Financial Report");
    } catch {
      return "[DOCX file - extraction incomplete]";
    }
  }
};

const extractFromImage = async (file) => {
  try {
    const aiText = await extractWithGoogleAI(file, "Financial Statement Image (photo or screenshot of statement/spreadsheet)");
    if (aiText && aiText.length > 30) return `[IMAGE TEXT EXTRACTED]\n${aiText}`;
    return `[Image file ${file.name} - Limited text extraction. Consider uploading PDF/XLSX for better analysis.]`;
  } catch (error) {
    return `[Image file ${file.name} - Text extraction failed: ${error.message}]`;
  }
};

let xlsxLib = null;
const ensureXlsx = async () => {
  if (!xlsxLib) {
    try { xlsxLib = await import("xlsx"); } catch { xlsxLib = null; }
  }
  return xlsxLib;
};

const extractFromXLS = async (file) => {
  try {
    const XLSX = await ensureXlsx();
    if (!XLSX) {
      const aiText = await extractWithGoogleAI(file, "Excel Spreadsheet with Financial Data");
      return aiText || "[Excel file - xlsx parser not installed]";
    }
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: "array" });
    const sheetNames = wb.SheetNames.slice(0, 5);
    let out = [];
    for (const s of sheetNames) {
      const ws = wb.Sheets[s];
      const csv = XLSX.utils.sheet_to_csv(ws, { FS: " | " });
      out.push(`[SHEET: ${s}]\n${csv}`);
      if (out.join("\n").length > 25000) break;
    }
    const result = out.join("\n\n");
    return result.length > 25000 ? result.slice(0, 25000) + "…[truncated]" : result;
  } catch {
    try {
      return await extractWithGoogleAI(file, "Excel Spreadsheet");
    } catch {
      return "[Excel file - extraction failed]";
    }
  }
};

const extractFromText = async (file) => {
  try {
    const text = await file.text();
    return text.length > 20000 ? text.slice(0, 20000) + "…[truncated]" : text;
  } catch {
    return "[Text file - reading failed]";
  }
};

const ext = (name = "") => name.split(".").pop()?.toLowerCase() || "";

const extractTextFromFile = async (file) => {
  const fileExt = ext(file.name);
  const sizeMb = file.size / (1024 * 1024);

  if (sizeMb > 25) {
    return `[${file.name}] skipped - file too large (${sizeMb.toFixed(1)} MB). Max supported ~25 MB.`;
  }

  try {
    switch (fileExt) {
      case "pdf":
        return await extractFromPDF(file);
      case "docx":
        return await extractFromDOCX(file);
      case "doc":
        return await extractWithGoogleAI(file, "Legacy Word Document - Financial Report");
      case "xlsx":
      case "xls":
        return await extractFromXLS(file);
      case "jpg":
      case "jpeg":
      case "png":
      case "webp":
        return await extractFromImage(file);
      case "txt":
      case "md":
      case "csv":
        return await extractFromText(file);
      default:
        return await extractWithGoogleAI(file, "Unknown Financial Document Type");
    }
  } catch (error) {
    try {
      const fallbackText = await extractWithGoogleAI(file, "Document of unknown type");
      return fallbackText || `[Extraction failed: ${error.message}]`;
    } catch (finalError) {
      return `[Error extracting content from ${file.name}: ${error.message}]`;
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────
// Gemini financial health analysis (Firebase callable)
// ─────────────────────────────────────────────────────────────────────────

const analyzeFinancialHealthWithGemini = async (extractedTexts, fileInfo, profileData, profileFields, stageLabel) => {
  try {
    const analyzeFinancials = httpsCallable(functions, 'analyzeFinancialHealth');
    const result = await analyzeFinancials({
      extractedTexts,
      fileInfo,
      profileData,
      profileFields,
      stageLabel
    });

    if (!result.data.success) {
      throw new Error(result.data.error || "Analysis failed");
    }
    return result.data.analysis;
  } catch (error) {
    if (error.code === 'functions/unauthenticated') {
      throw new Error("Please sign in to use AI analysis");
    } else if (error.code === 'functions/deadline-exceeded') {
      throw new Error("Analysis timed out. Please try with fewer or smaller files.");
    } else if (error.code === 'functions/resource-exhausted' || error.code === 'functions/not-found') {
      throw new Error("Financial analysis function is unavailable. Please try again shortly.");
    }
    throw new Error(`AI analysis failed: ${error.message}`);
  }
};

const parseScore = (text, label) => {
  const m = text.match(new RegExp(`${label}\\s*Score:\\s*(\\d(?:\\.\\d)?)\\s*\\/\\s*5`, 'i'));
  return m ? parseFloat(m[1]) : null;
};

const fetchUserProfile = async () => {
  const userId = auth.currentUser?.uid;
  if (!userId) return null;
  const snap = await getDoc(doc(db, "universalProfiles", userId));
  return snap.exists() ? snap.data() : null;
};

// ─────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────
export default function FinancialsGPT({
  financialStatementsDocs = [],
  auditedFinancialsDocs = [],
  managementAccountsDocs = [],
  profileFields = {},
  onEvaluationComplete,
}) {
  const [score, setScore] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [error, setError] = useState('');
  const processedFingerprint = useRef(null);

  // Modal state
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);

  const allFiles = [
    ...financialStatementsDocs.map(f => ({ file: f, category: 'Financial Statements' })),
    ...auditedFinancialsDocs.map(f => ({ file: f, category: 'Audited Financials' })),
    ...managementAccountsDocs.map(f => ({ file: f, category: 'Management Accounts' })),
  ].filter(entry => entry.file instanceof File);

  useEffect(() => {
    if (allFiles.length === 0) return;

    const fingerprint = allFiles
      .map(({ file, category }) => `${category}:${file.name}:${file.size}:${file.lastModified}`)
      .sort()
      .join('|');

    if (fingerprint === processedFingerprint.current) return;
    processedFingerprint.current = fingerprint;

    handleFiles(allFiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [financialStatementsDocs, auditedFinancialsDocs, managementAccountsDocs]);

  const handleFiles = async (entries) => {
    setIsLoading(true);
    setError('');
    setShowProcessingModal(true);
    setTotalFiles(entries.length);
    setCurrentFileIndex(0);
    setProcessingStatus('Starting document analysis...');

    const processed = [];

    try {
      for (let i = 0; i < entries.length; i++) {
        const { file, category } = entries[i];
        setCurrentFileIndex(i + 1);
        setProcessingStatus(`Extracting ${i + 1} of ${entries.length}: ${file.name}`);
        try {
          const content = await extractTextFromFile(file);
          if (!content || content.length < 20) continue;
          processed.push({ name: file.name, category, content, type: file.type });
        } catch (err) {
          console.error(`Error processing ${file.name}`, err);
        }
      }

      if (processed.length > 0) {
        setProcessingStatus('Extraction complete. Starting AI analysis...');
        await performEvaluation(processed);
      } else {
        setError('Could not extract usable content from the uploaded file(s).');
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => setShowProcessingModal(false), 600);
    }
  };

  const performEvaluation = async (filesToEvaluate) => {
    setProcessingStatus('Fetching profile context...');
    const profileData = await fetchUserProfile();
    const stage = (profileData?.entityOverview?.operationStage || '').toLowerCase();
    const stageLabel = ["pre-seed", "preseed", "startup"].includes(stage)
      ? "Pre-seed"
      : ["growth"].includes(stage)
      ? "Growth"
      : ["scaling", "scale-up"].includes(stage)
      ? "Scaling"
      : ["mature", "maturity"].includes(stage)
      ? "Maturity"
      : "Unspecified";

    try {
      setProcessingStatus('Analyzing financial health with AI... this may take a moment.');

      const extractedTexts = filesToEvaluate.map(f => f.content);
      const fileInfo = filesToEvaluate.map(f => ({
        name: f.name,
        category: f.category,
        type: f.type,
        extractionMethod: 'google_ai_enhanced'
      }));

      const reply = await analyzeFinancialHealthWithGemini(
        extractedTexts,
        fileInfo,
        profileData,
        profileFields,
        stageLabel
      );

      const parsedBreakdown = {
        revenueGrowth: parseScore(reply, 'Revenue Growth'),
        profitability: parseScore(reply, 'Profitability'),
        cashFlow: parseScore(reply, 'Cash Flow'),
        debtManagement: parseScore(reply, 'Debt Management'),
        financialControls: parseScore(reply, 'Financial Controls'),
      };
      const overallScore = parseScore(reply, 'Overall');

      const summaryMatch = reply.match(/Summary:\s*(.*)/is);
      const parsedSummary = summaryMatch ? summaryMatch[1].trim().substring(0, 1500) : '';

      setScore(overallScore);
      setBreakdown(parsedBreakdown);
      setSummary(parsedSummary);
      setProcessingStatus('Analysis complete!');

      if (onEvaluationComplete) {
        onEvaluationComplete(reply, overallScore, parsedSummary);
      }

      const userId = auth.currentUser?.uid;
      if (userId && overallScore !== null) {
        const dataToSave = {
          evaluation: {
            content: reply,
            overallScore,
            breakdown: parsedBreakdown,
            summary: parsedSummary,
            evaluatedAt: new Date().toISOString(),
            modelVersion: 'Gemini-2.5-Flash',
            operationStage: stageLabel,
          },
          userId,
          createdAt: new Date().toISOString(),
          files: filesToEvaluate.map(f => ({ name: f.name, category: f.category })),
        };

        try {
          await setDoc(doc(db, `aiFinancialEvaluations/${userId}`), dataToSave, { merge: true });
        } catch (err) {
          console.error("Error saving to Firestore:", err);
        }
      }
    } catch (err) {
      console.error("Evaluation failed", err);
      setError(err.message || "Analysis failed. Please try again.");
      setProcessingStatus('');
      throw err;
    }
  };

  if (allFiles.length === 0 && score === null && !error && !showProcessingModal) return null;

  return (
    <div style={{ marginTop: "16px" }}>
      {/* Processing modal overlay */}
      {showProcessingModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "28px 32px",
            maxWidth: "420px",
            width: "90%",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            textAlign: "center",
          }}>
            <div style={{
              width: "36px",
              height: "36px",
              margin: "0 auto 16px",
              border: "3px solid #dbeafe",
              borderTopColor: "#2563eb",
              borderRadius: "50%",
              animation: "fin-gpt-spin 0.8s linear infinite",
            }} />
            <h4 style={{ margin: "0 0 8px 0", fontSize: "16px", color: "#111827" }}>
              Analyzing Financial Documents
            </h4>
            <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#4b5563" }}>
              {processingStatus || "Working..."}
            </p>
            {totalFiles > 0 && (
              <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>
                File {Math.min(currentFileIndex, totalFiles)} of {totalFiles}
              </p>
            )}
            <style>{`@keyframes fin-gpt-spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      )}

      {error && !showProcessingModal && (
        <div style={{ padding: "10px 12px", backgroundColor: "#fdecea", border: "1px solid #f5c6cb", borderRadius: "6px", color: "#b91c1c", fontSize: "13px" }}>
          {error}
        </div>
      )}

      {score !== null && !showProcessingModal && (
        <div style={{
          padding: "16px",
          backgroundColor: "#f0f7ff",
          borderRadius: "8px",
          border: "1px solid #4a90e2",
        }}>
          <h4 style={{ margin: "0 0 8px 0", fontSize: "15px" }}>Financial Health Analysis</h4>
          <p style={{ fontSize: "24px", fontWeight: "bold", color: "#1d4ed8", margin: "0 0 12px 0" }}>
            {score}/5 Overall
          </p>
          {breakdown && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "12px", marginBottom: "12px" }}>
              <div>Revenue Growth: <strong>{breakdown.revenueGrowth ?? '—'}/5</strong></div>
              <div>Profitability: <strong>{breakdown.profitability ?? '—'}/5</strong></div>
              <div>Cash Flow: <strong>{breakdown.cashFlow ?? '—'}/5</strong></div>
              <div>Debt Management: <strong>{breakdown.debtManagement ?? '—'}/5</strong></div>
              <div>Financial Controls: <strong>{breakdown.financialControls ?? '—'}/5</strong></div>
            </div>
          )}
          {summary && (
            <p style={{ fontSize: "13px", color: "#374151", margin: 0, whiteSpace: "pre-line" }}>
              {summary}
            </p>
          )}
        </div>
      )}
    </div>
  );
}