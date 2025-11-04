"use client"
import React, { useState, useEffect } from "react"
import mammoth from "mammoth"
import { collection, query, where, getDocs, addDoc, setDoc } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"
import { GoogleGenAI } from "@google/genai"

// ✅ Initialize Google AI only
const ai = new GoogleGenAI({ 
  apiKey: "AIzaSyBV5LGcaYjT0qLWsfqpbKxo8ohz0SDkIvU" // Consider moving to env var
})

// ✅ NEW: Credit analysis with Gemini AI
const analyzeWithGeminiAI = async (extractedTexts, fileInfo) => {
  try {
    const prompt = `
CREDIT REPORT ANALYSIS REQUEST:

You are a financial analyst specializing in credit report analysis. Analyze the following document(s) for credit information.

INSTRUCTIONS:
1. FIRST determine if this is actually a credit report or contains credible credit score data
2. If NOT a credit report, clearly state this and return a score of 0
3. If it IS a credit report, extract:
   - Credit Score (FICO/VantageScore or similar; 300–850 range)
   - Credit Rating (Excellent/Very Good/Good/Fair/Poor)
   - Key positive factors
   - Negative items (late payments, collections, bankruptcies)
   - Overall credit assessment

DOCUMENTS TO ANALYZE:
${fileInfo.map((file, index) => `
--- DOCUMENT ${index + 1} ---
FILE: ${file.name}
TYPE: ${file.type}
CONTENT:
${file.text}
`).join('\n')}

RESPONSE FORMAT (JSON only):
{
  "isCreditReport": true/false,
  "creditScore": number (0 if not credit report, null if not found),
  "creditRating": "Excellent/Very Good/Good/Fair/Poor/Not Applicable",
  "keyFindings": ["array", "of", "key", "points"],
  "negativeItems": ["array", "of", "negative", "items", "or", "empty"],
  "overallAssessment": "detailed summary analysis",
  "confidence": "high/medium/low"
}

If not a credit report, return:
{
  "isCreditReport": false,
  "creditScore": 0,
  "creditRating": "Not a Credit Report",
  "keyFindings": ["Document does not appear to be a credit report"],
  "negativeItems": [],
  "overallAssessment": "The provided documents do not contain credit report information. Please upload actual credit reports from recognized credit bureaus.",
  "confidence": "high"
}
`

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }]
    })

    // Parse JSON response
    try {
      const jsonMatch = response.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
    }

    // Fallback: try to extract score from text response
    const fallbackResponse = {
      isCreditReport: false,
      creditScore: 0,
      creditRating: "Analysis Failed",
      keyFindings: ["Could not parse analysis results"],
      negativeItems: [],
      overallAssessment: response.text || "Analysis completed but format was unexpected",
      confidence: "low"
    }

    // Try to detect if it's a credit report from text
    const responseText = response.text.toLowerCase()
    const creditReportIndicators = [
      /credit.*report/i,
      /fico/i,
      /vantage/i,
      /equifax/i,
      /experian/i,
      /transunion/i,
      /credit.*score/i,
      /payment.*history/i,
      /credit.*utilization/i
    ]

    const isLikelyCreditReport = creditReportIndicators.some(pattern => 
      pattern.test(responseText)
    )

    if (isLikelyCreditReport) {
      // Try to extract score from text
      const scorePatterns = [
        /(\d{3})\s*(?:point|score)/i,
        /score.*?(\d{3})/i,
        /rating.*?(\d{3})/i,
        /\b([3-8]\d{2})\b/
      ]

      let extractedScore = null
      for (const pattern of scorePatterns) {
        const match = responseText.match(pattern)
        if (match) {
          const score = parseInt(match[1])
          if (score >= 300 && score <= 850) {
            extractedScore = score
            break
          }
        }
      }

      fallbackResponse.isCreditReport = true
      fallbackResponse.creditScore = extractedScore
      fallbackResponse.creditRating = extractedScore ? getRatingFromScore(extractedScore) : "Score Not Found"
      fallbackResponse.overallAssessment = "Credit report detected but analysis format was unexpected. " + response.text.slice(0, 500)
    }

    return fallbackResponse

  } catch (error) {
    console.error("Gemini AI analysis failed:", error)
    throw new Error(`AI analysis failed: ${error.message}`)
  }
}

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

// ✅ Enhanced PDF extraction using Google AI
const extractWithGoogleAI = async (file, documentType = "Credit Report") => {
  try {
    console.log(`🔍 Analyzing ${file.name} with Google AI...`)

    // Convert file to base64 for Google AI
    const base64Data = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result.split(',')[1])
    })

    const prompt = `
EXTRACT ALL TEXT FROM THIS DOCUMENT:

DOCUMENT TYPE: ${documentType}
FILE NAME: ${file.name}

INSTRUCTIONS:
1. Extract ALL readable text from this document
2. Preserve numbers, dates, scores, and financial terms
3. Include headers, footers, and any visible text
4. If this is a credit report, focus on credit scores, ratings, and financial data
5. Return the extracted text in a clean, readable format

EXTRACTED TEXT:
`

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: file.type,
                data: base64Data,
              }
            },
            {
              text: prompt
            }
          ]
        }
      ]
    })

    console.log("✅ Google AI extraction successful")
    return response.text || "[No text extracted by Google AI]"

  } catch (error) {
    console.error("❌ Google AI extraction failed:", error)
    throw new Error(`AI extraction failed: ${error.message}`)
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

// ✅ Main CreditGPT Component
export default function CreditGPT({ files = [], onEvaluationComplete }) {
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [response, setResponse] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [extractedScore, setExtractedScore] = useState(null)
  const [fundabilityLabel, setFundabilityLabel] = useState("")
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)

  
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

  const handleIncomingFiles = async (incomingFiles) => {
    if (!incomingFiles?.length) return
    setIsLoading(true)

    try {
      const processed = []
      for (const file of incomingFiles) {
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
      await performEvaluation(processed)
    } finally {
      setIsLoading(false)
    }
  }

  const performEvaluation = async (filesToEvaluate) => {
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
      
      onEvaluationComplete?.(formattedResponse, finalScore, finalLabel, analysis)
      await saveDataToFirebase(formattedResponse, finalScore, finalLabel, filesToEvaluate, analysis)

    } catch (error) {
      console.error("Evaluation error:", error)
      const errorResponse = "Analysis failed due to an error. Please try again with different files."
      setResponse(errorResponse)
      setExtractedScore(0)
      setFundabilityLabel("Analysis Failed")
      setAnalysisResult({
        isCreditReport: false,
        creditScore: 0,
        creditRating: "Analysis Failed",
        overallAssessment: errorResponse,
        confidence: "low"
      })
      onEvaluationComplete?.(errorResponse, 0, "Analysis Failed", null)
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-700">Analyzing credit report...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}