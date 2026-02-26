"use client"
import React, { useState, useEffect } from "react"
import mammoth from "mammoth"
import { collection, query, where, getDocs, addDoc, setDoc } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"
import { GoogleGenAI } from "@google/genai"
import { getFunctions, httpsCallable } from 'firebase/functions';

// ✅ Initialize Firebase Functions
const functions = getFunctions();


const analyzeWithGeminiAI = async (extractedTexts, fileInfo) => {
  try {
    console.log("🔄 Calling Firebase Function for credit analysis...");
    
    const analyzeCreditReport = httpsCallable(functions, 'analyzeCreditReport');
    
    const result = await analyzeCreditReport({
      extractedTexts,
      fileInfo
    });

    if (!result.data.success) {
      throw new Error(result.data.error || "Analysis failed");
    }

    console.log("✅ Credit analysis completed successfully");
    return result.data.analysis;

  } catch (error) {
    console.error("❌ Firebase Function credit analysis failed:", error);
    
    // Check for specific error types
    if (error.code === 'functions/unauthenticated') {
      throw new Error("Please sign in to use credit analysis");
    } else if (error.code === 'functions/deadline-exceeded') {
      throw new Error("Analysis timed out. Please try with fewer or smaller files.");
    } else if (error.code === 'functions/resource-exhausted') {
      throw new Error("Service temporarily unavailable. Please try again in a few minutes.");
    }
    
    throw new Error(`Credit analysis failed: ${error.message}`);
  }
};

// ✅ Helper function to get rating from score
const getRatingFromScore = (score) => {
  if (score >= 800) return "Excellent"
  if (score >= 740) return "Very Good"
  if (score >= 670) return "Good"
  if (score >= 580) return "Fair"
  return "Poor"
}

// ✅ File processing utilities
const ext = (name = "") => name.split(".").pop()?.toLowerCase() || ""

const cleanText = (bufOrStr) => {
  try {
    if (typeof bufOrStr === "string") return bufOrStr
    const txt = new TextDecoder().decode(new Uint8Array(bufOrStr))
    return txt.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim()
  } catch {
    return ""
  }
}

// ✅ REPLACE extractWithGoogleAI to use Firebase Function
const extractWithGoogleAI = async (file, documentType = "Credit Report") => {
  try {
    console.log(`🔍 Extracting ${file.name} via Firebase Function...`)

    // Convert file to base64
    const base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result.split(',')[1])
      reader.onerror = () => reject(new Error("Failed to read file"))
    })

    // Call Firebase Function for extraction
    const extractText = httpsCallable(functions, 'extractCreditDocumentText');
    
    const result = await extractText({
      base64Data,
      mimeType: file.type,
      fileName: file.name,
      documentType
    });

    if (!result.data.success) {
      throw new Error(result.data.error || "Extraction failed");
    }

    console.log("✅ Firebase extraction successful")
    return result.data.text || "[No text extracted]"

  } catch (error) {
    console.error("❌ Firebase extraction failed:", error)
    
    // Handle specific Firebase errors
    if (error.code === 'functions/unauthenticated') {
      throw new Error("Please sign in to extract documents");
    } else if (error.code === 'functions/deadline-exceeded') {
      throw new Error("Document extraction timed out. Try a smaller file.");
    }
    
    throw new Error(`Extraction failed: ${error.message}`)
  }
}

// ✅ Enhanced PDF extraction with fallbacks
const extractFromPDF = async (file) => {
  try {
    console.log("📄 Attempting PDF extraction with Google AI...")
    
    // Primary method: Use Google AI for best results
    const aiText = await extractWithGoogleAI(file, "Credit Report or Financial Document")
    if (aiText && aiText.length > 100) {
      console.log("✅ PDF extracted successfully with Google AI")
      return aiText
    }
    
    // Fallback: Traditional PDF.js extraction
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
    
    // Final fallback: basic text decode
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

// ✅ Enhanced DOCX extraction with Google AI fallback
const extractFromDOCX = async (file) => {
  try {
    console.log("📝 Attempting DOCX extraction with Mammoth...")
    const arrayBuffer = await file.arrayBuffer()
    const { value } = await mammoth.extractRawText({ arrayBuffer })
    
    if (value && value.length > 100) {
      console.log("✅ DOCX extracted successfully with Mammoth")
      return value.length > 20000 ? value.slice(0, 20000) + "…[truncated]" : value
    }
    
    // Fallback to Google AI if Mammoth fails
    console.log("🔄 Falling back to Google AI for DOCX...")
    const aiText = await extractWithGoogleAI(file, "Word Document")
    return aiText
    
  } catch (error) {
    console.error("❌ DOCX extraction failed:", error)
    
    // Final fallback to Google AI
    try {
      const aiText = await extractWithGoogleAI(file, "Word Document")
      return aiText
    } catch (aiError) {
      return "[DOCX file - extraction incomplete]"
    }
  }
}

// ✅ Enhanced image processing with Google AI
const extractFromImage = async (file) => {
  try {
    console.log("🖼️ Extracting text from image with Google AI...")
    const aiText = await extractWithGoogleAI(file, "Image Document possibly containing credit information")
    
    if (aiText && aiText.length > 50) {
      console.log("✅ Image text extraction successful")
      return `[IMAGE TEXT EXTRACTED]\n${aiText}`
    }
    
    return `[Image file ${file.name} - Limited text extraction. Consider uploading PDF/DOCX for better analysis.]`
    
  } catch (error) {
    console.error("❌ Image extraction failed:", error)
    return `[Image file ${file.name} - Text extraction failed. Please upload PDF/DOCX for credit analysis.]`
  }
}

// ✅ Enhanced Excel processing
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
      // Fallback to Google AI for Excel files
      const aiText = await extractWithGoogleAI(file, "Excel Spreadsheet possibly containing financial data")
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
    
    // Fallback to Google AI
    try {
      const aiText = await extractWithGoogleAI(file, "Excel Spreadsheet")
      return aiText
    } catch (aiError) {
      return "[Excel file - extraction failed]"
    }
  }
}

// ✅ Enhanced text file processing
const extractFromText = async (file) => {
  try {
    const text = await file.text()
    return text.length > 20000 ? text.slice(0, 20000) + "…[truncated]" : text
  } catch (error) {
    console.error("❌ Text file extraction failed:", error)
    return "[Text file - reading failed]"
  }
}

// ✅ Main extraction function with better file type handling
const extractTextFromFile = async (file) => {
  const fileExt = ext(file.name)
  const type = file.type || ""
  const sizeMb = file.size / (1024 * 1024)
  
  if (sizeMb > 25) {
    return {
      kind: "too_large",
      meta: { name: file.name, type, size: file.size },
      text: `[${file.name}] skipped - file too large (${sizeMb.toFixed(1)} MB). Max supported ~25 MB.`,
    }
  }

  const result = { 
    kind: "text", 
    meta: { name: file.name, type, size: file.size }, 
    text: "",
    extractionMethod: "traditional"
  }

  try {
    console.log(`🔍 Processing ${file.name} (${fileExt})...`)

    // Handle different file types with appropriate methods
    switch (fileExt) {
      case "pdf":
        result.text = await extractFromPDF(file)
        result.extractionMethod = "google_ai+pdfjs"
        break
        
      case "docx":
        result.text = await extractFromDOCX(file)
        result.extractionMethod = "mammoth+google_ai"
        break
        
      case "doc":
        // For .doc files, use Google AI directly
        result.text = await extractWithGoogleAI(file, "Legacy Word Document")
        result.extractionMethod = "google_ai"
        break
        
      case "xlsx":
      case "xls":
        result.text = await extractFromXLS(file)
        result.extractionMethod = "xlsx+google_ai"
        break
        
      case "jpg":
      case "jpeg":
      case "png":
        result.kind = "image"
        result.text = await extractFromImage(file)
        result.extractionMethod = "google_ai_vision"
        break
        
      case "txt":
      case "md":
        result.text = await extractFromText(file)
        result.extractionMethod = "direct"
        break
        
      default:
        // For unknown types, try Google AI
        console.log(`🔄 Unknown file type ${fileExt}, trying Google AI...`)
        result.text = await extractWithGoogleAI(file, "Unknown Document Type")
        result.extractionMethod = "google_ai"
        result.kind = "unknown"
    }

    // Ensure text isn't too long for API limits
    if (result.text.length > 30000) {
      result.text = result.text.slice(0, 30000) + "…[truncated for API limits]"
    }

    console.log(`✅ ${file.name} processed successfully with ${result.extractionMethod}`)
    return result

  } catch (error) {
    console.error(`❌ Error processing ${file.name}:`, error)
    
    // Final fallback: try basic Google AI extraction
    try {
      console.log("🔄 Attempting final fallback with Google AI...")
      const fallbackText = await extractWithGoogleAI(file, "Document of unknown type")
      return {
        kind: "fallback",
        meta: { name: file.name, type, size: file.size },
        text: fallbackText || `[Extraction failed: ${error.message}]`,
        extractionMethod: "google_ai_fallback"
      }
    } catch (finalError) {
      return {
        kind: "error",
        meta: { name: file.name, type, size: file.size },
        text: `[Error extracting content from ${file.name}: ${error.message}]`,
        extractionMethod: "failed"
      }
    }
  }
}


export default function CreditGPT({ files = [], onEvaluationComplete }) {
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [response, setResponse] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [extractedScore, setExtractedScore] = useState(null)
  const [fundabilityLabel, setFundabilityLabel] = useState("")
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  
  // ✅ NEW: Add processing stages
  const [processingStage, setProcessingStage] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);

  const performEvaluation = async (filesToEvaluate, setters) => {
  const { setAnalysisResult, setResponse, setExtractedScore, setFundabilityLabel } = setters;
  
  try {
    const analysis = await analyzeWithGeminiAI(
      filesToEvaluate.map(f => f.text),
      filesToEvaluate.map(f => ({ name: f.name, type: f.type, text: f.text }))
    )

    setAnalysisResult(analysis)
    
    const formattedResponse = formatAnalysisResponse(analysis)
    setResponse(formattedResponse)

    const finalScore = analysis.isCreditReport ? (analysis.creditScore || 0) : 0
    const finalLabel = getFundabilityLabel(finalScore, analysis.isCreditReport)

    setExtractedScore(finalScore)
    setFundabilityLabel(finalLabel)
    
    return { formattedResponse, finalScore, finalLabel, analysis }

  } catch (error) {
    console.error("Evaluation error:", error)
    const errorResponse = `❌ Credit Analysis Error: ${error.message}\n\nPlease try again or contact support if the issue persists.`
    
    setResponse(errorResponse)
    setExtractedScore(0)
    setFundabilityLabel("Analysis Failed")
    
    const errorAnalysis = {
      isCreditReport: false,
      creditScore: 0,
      creditRating: "Analysis Failed",
      overallAssessment: errorResponse,
      confidence: "low"
    }
    
    setAnalysisResult(errorAnalysis)
    
    return { formattedResponse: errorResponse, finalScore: 0, finalLabel: "Analysis Failed", analysis: errorAnalysis }
  }
}
  const formatAnalysisResponse = (result) => {
    if (!result) return "Analysis in progress..."
    
    if (!result.isCreditReport) {
      return result.overallAssessment
    }
    
    return `
CREDIT REPORT ANALYSIS COMPLETE:

📊 Credit Score: ${result.creditScore || "Not specified"}${result.creditScore ? "/850" : ""}
⭐ Credit Rating: ${result.creditRating}

🔍 Key Findings:
${result.keyFindings?.map(item => `• ${item}`).join('\n') || "• No specific findings"}

⚠️ Negative Items:
${result.negativeItems?.length > 0 ? result.negativeItems.map(item => `• ${item}`).join('\n') : "• No negative items found"}

📈 Overall Assessment:
${result.overallAssessment}

Confidence: ${result.confidence}
    `.trim()
  }

  const getFundabilityLabel = (score, isCreditReport) => {
    if (!isCreditReport) return "Not a Credit Report"
    if (score === null || score === 0) return "Score Not Found"
    if (score >= 800) return "Excellent"
    if (score >= 740) return "Very Good"
    if (score >= 670) return "Good"
    if (score >= 580) return "Fair"
    return "Poor"
  }

  // ✅ ENHANCED: handleIncomingFiles with progress tracking
  const handleIncomingFiles = async (incomingFiles) => {
    if (!incomingFiles?.length) return
    setIsLoading(true)
    setProcessingStage('Preparing files...');
    setProcessingProgress(10);

    try {
      const processed = []
      const totalFiles = incomingFiles.length;
      
      for (let i = 0; i < incomingFiles.length; i++) {
        const file = incomingFiles[i];
        
        setProcessingStage(`Extracting text from ${file.name}...`);
        setProcessingProgress(10 + (i / totalFiles) * 40);
        
        try {
          console.log(`📁 Processing file: ${file.name}`)
          const extracted = await extractTextFromFile(file)
          processed.push({
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            type: file.type,
            ext: ext(file.name),
            text: extracted.text,
            kind: extracted.kind,
            meta: extracted.meta,
            extractionMethod: extracted.extractionMethod,
          })
          console.log(`✅ File processed: ${file.name} with ${extracted.extractionMethod}`)
        } catch (err) {
          console.error(`❌ Error extracting ${file.name}:`, err)
          processed.push({
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            type: file.type,
            ext: ext(file.name),
            text: `[Error extracting content from ${file.name}: ${err.message}]`,
            kind: "error",
            meta: {},
            extractionMethod: "failed",
          })
        }
      }
      
      setUploadedFiles((prev) => [...prev, ...processed])
      setProcessingProgress(50);
      
      setProcessingStage('Analyzing credit report with AI...');
      setProcessingProgress(60);
      
      const result = await performEvaluation(processed, {
        setAnalysisResult,
        setResponse,
        setExtractedScore,
        setFundabilityLabel
      })
      
      setProcessingProgress(85);
      setProcessingStage('Saving results...');
      
      onEvaluationComplete?.(result.formattedResponse, result.finalScore, result.finalLabel, result.analysis)
      await saveDataToFirebase(result.formattedResponse, result.finalScore, result.finalLabel, processed, result.analysis)
      
      setProcessingProgress(100);
      
    } catch (error) {
      console.error('File processing error:', error);
      setProcessingStage('Error occurred');
    } finally {
      setTimeout(() => {
        setIsLoading(false)
        setProcessingStage('');
        setProcessingProgress(0);
      }, 500);
    }
  }

  useEffect(() => {
    if (files && files.length > 0) {
      handleIncomingFiles(files)
    }
  }, [files])

  const saveDataToFirebase = async (response, score, label, filesEvaluated, analysis) => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) throw new Error("User not logged in.")

      const dataToSave = {
        evaluation: {
          content: response,
          score,
          label,
          analysisResult: analysis,
          isCreditReport: analysis?.isCreditReport || false,
          evaluatedAt: new Date().toISOString(),
          modelVersion: "Gemini-2.5-Flash",
        },
        userId,
        createdAt: new Date().toISOString(),
        files: (filesEvaluated || uploadedFiles).map((f) => ({
          name: f.name,
          size: f.size,
          type: f.type,
          ext: f.ext,
          kind: f.kind,
          extractionMethod: f.extractionMethod,
        })),
      }

      const evaluationsRef = collection(db, "creditAnalyses")
      const q = query(evaluationsRef, where("userId", "==", userId))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref
        await setDoc(docRef, dataToSave, { merge: true })
      } else {
        await addDoc(evaluationsRef, dataToSave)
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error("Error saving to Firebase:", err)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen">
      {extractedScore !== null && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Credit Report Analysis</h3>
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold text-blue-900">
              {extractedScore === 0 ? "N/A" : `${extractedScore}`}
              {extractedScore !== 0 && <span className="text-sm ml-1">/850</span>}
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                extractedScore === 0
                  ? "bg-gray-100 text-gray-800"
                  : extractedScore >= 800
                  ? "bg-green-100 text-green-800"
                  : extractedScore >= 740
                  ? "bg-blue-100 text-blue-800"
                  : extractedScore >= 670
                  ? "bg-yellow-100 text-yellow-800"
                  : extractedScore >= 580
                  ? "bg-orange-100 text-orange-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {fundabilityLabel}
            </div>
          </div>
          
          {analysisResult && (
            <div className="mt-3 text-sm">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="text-center p-2 bg-white rounded border">
                  <div className="font-semibold text-gray-600">Document Type</div>
                  <div className={analysisResult.isCreditReport ? "text-green-600 font-medium" : "text-orange-600 font-medium"}>
                    {analysisResult.isCreditReport ? "Credit Report" : "Not a Credit Report"}
                  </div>
                </div>
                <div className="text-center p-2 bg-white rounded border">
                  <div className="font-semibold text-gray-600">Confidence</div>
                  <div className={
                    analysisResult.confidence === "high" ? "text-green-600 font-medium" :
                    analysisResult.confidence === "medium" ? "text-yellow-600 font-medium" : "text-red-600 font-medium"
                  }>
                    {analysisResult.confidence || "Unknown"}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {saveSuccess && <div className="mt-2 text-green-600 text-sm">Analysis saved successfully!</div>}
          
          {response && (
            <div className="mt-3 p-3 bg-white rounded border text-sm">
              <div className="font-semibold mb-2">Analysis Results:</div>
              <div className="text-gray-700 max-h-64 overflow-y-auto whitespace-pre-wrap">
                {response}
              </div>
            </div>
          )}
        </div>
      )}


{isLoading && (
  <div 
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}
  >
    <div 
      style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        textAlign: 'center',
        minWidth: '300px',
        maxWidth: '400px',
        margin: '20px'
      }}
    >
      {/* Spinner */}
      <div 
        style={{
          width: '40px',
          height: '40px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #8d6e63',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px auto'
        }}
      />
      
      {/* Title */}
      <h3 
        style={{
          margin: '0 0 8px 0',
          fontSize: '18px',
          fontWeight: '600',
          color: '#333'
        }}
      >
        Analyzing Credit Report
      </h3>
      
      {/* Stage Message */}
      <p 
        style={{
          color: '#666',
          fontSize: '14px',
          margin: '0 0 20px 0',
          minHeight: '20px'
        }}
      >
        {processingStage || 'Initializing...'}
      </p>
      
      {/* Progress Bar */}
      <div 
        style={{
          width: '100%',
          height: '6px',
          backgroundColor: '#f0f0f0',
          borderRadius: '3px',
          overflow: 'hidden',
          marginBottom: '8px'
        }}
      >
        <div 
          style={{
            height: '100%',
            backgroundColor: '#8d6e63',
            width: `${processingProgress}%`,
            transition: 'width 0.5s ease-out'
          }}
        />
      </div>
      
      {/* Progress Percentage */}
      <p 
        style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#8d6e63',
          margin: '0 0 16px 0'
        }}
      >
        {processingProgress}%
      </p>
      
      {/* Simple Warning Message */}
      <div 
        style={{
          fontSize: '12px',
          color: '#666',
          fontStyle: 'italic'
        }}
      >
        Please don't close this window
      </div>
    </div>
    
    {/* Animation Styles */}
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
)}
    </div>
  )
}