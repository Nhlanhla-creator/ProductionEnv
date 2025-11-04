"use client"
import FormField from "./FormField"
import FileUpload from "./FileUpload"
import { barrierOptions } from "./applicationOptions"
import "./FundingApplication.css"
import React, { useState } from 'react';
import mammoth from 'mammoth';
import { useEffect } from 'react';
import { db, auth } from '../../firebaseConfig'
import { doc, setDoc, getDoc } from "firebase/firestore"
import { collection, query, where, getDocs, addDoc } from "firebase/firestore"
import PitchDeckGPT from './PitchdeckAi';
import { API_KEYS } from '../../API';
import { fetchUserProfile } from "./PitchdeckAi"
import { GoogleGenAI } from "@google/genai"

// ✅ Initialize Google AI only
const ai = new GoogleGenAI({ 
  apiKey: "AIzaSyBV5LGcaYjT0qLWsfqpbKxo8ohz0SDkIvU" // Consider moving to env var
})

// ✅ NEW: Enhanced file extraction with Google AI
const extractWithGoogleAI = async (file, documentType = "Pitch Document") => {
  try {
    console.log(`🔍 Analyzing ${file.name} with Google AI...`)

    // Convert file to base64 for Google AI
    const base64Data = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result.split(',')[1])
    })

    const prompt = `
EXTRACT ALL TEXT FROM THIS PITCH DOCUMENT:

DOCUMENT TYPE: ${documentType}
FILE NAME: ${file.name}

INSTRUCTIONS:
1. Extract ALL readable text from this document
2. Preserve numbers, financial data, business metrics, and strategic information
3. Include headers, footers, tables, and any visible text
4. Focus on business plans, financial projections, market analysis, and growth strategies
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
    const aiText = await extractWithGoogleAI(file, "Pitch Deck or Business Plan PDF")
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
    const aiText = await extractWithGoogleAI(file, "Pitch Deck Image")
    
    if (aiText && aiText.length > 50) {
      console.log("✅ Image text extraction successful")
      return `[IMAGE TEXT EXTRACTED]\n${aiText}`
    }
    
    return `[Image file ${file.name} - Limited text extraction. Consider uploading PDF/DOCX for better analysis.]`
    
  } catch (error) {
    console.error("❌ Image extraction failed:", error)
    return `[Image file ${file.name} - Text extraction failed. Please upload PDF/DOCX for pitch analysis.]`
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
      const aiText = await extractWithGoogleAI(file, "Excel Spreadsheet with Financial Data")
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

// ✅ File processing utilities
const ext = (name = "") => name.split(".").pop()?.toLowerCase() || ""

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
    return result.text

  } catch (error) {
    console.error(`❌ Error processing ${file.name}:`, error)
    
    // Final fallback: try basic Google AI extraction
    try {
      console.log("🔄 Attempting final fallback with Google AI...")
      const fallbackText = await extractWithGoogleAI(file, "Document of unknown type")
      return fallbackText || `[Extraction failed: ${error.message}]`
    } catch (finalError) {
      return `[Error extracting content from ${file.name}: ${error.message}]`
    }
  }
}

// ✅ NEW: Fundability analysis with Gemini AI
const analyzeWithGeminiAI = async (extractedTexts, fileInfo, profileData, stageLabel) => {
  try {
    const prompt = `
STARTUP FUNDABILITY ANALYSIS REQUEST:

You are evaluating a startup pitch using the BIG Fundability Scorecard (Business Plan Evaluation). Score each item 0–5 with 1-2 sentence justification per line. Then provide a total weighted score out of 100 based on the startup's current stage: ${stageLabel}.

Startup Summary:
Stage: ${stageLabel}
Description: ${profileData?.entityOverview?.businessDescription || "Not provided"}


Use these 9 criteria:
1. Problem Clarity
2. Solution Fit
3. Market Understanding (TAM, SAM)
4. Competitive Landscape and Advantage
5. Revenue Streams
6. Financial Projections
7. Traction
8. MVP (Minimum Viable Product) Maturity
9. Investor IRR

Weighting by stage:

For Pre-seed:
- Problem Clarity: 3%, Solution Fit: 3%, Market: 2%, Competition: 2%, Revenue: 2%, Financials: 2%, Traction: 2%, MVP Maturity: 3%, IRR: 1%

For Growth:
- Problem Clarity: 2%, Solution Fit: 2%, Market: 2%, Competition: 2%, Revenue: 2%, Financials: 2%, Traction: 1%, MVP Maturity: 1%, IRR: 1%

For Maturity:
- Problem Clarity: 1%, Solution Fit: 1%, Market: 1%, Competition: 1%, Revenue: 1%, Financials: 2%, Traction: 1%, MVP Maturity: 1%, IRR: 1%

DOCUMENTS TO ANALYZE:
${fileInfo.map((file, index) => `
--- DOCUMENT ${index + 1} ---
FILE: ${file.name}
EXTRACTION METHOD: ${file.extractionMethod}
CONTENT:
${file.text}
`).join('\n')}

RESPONSE FORMAT:
- Score each of the 9 items from 0–5 with short justification
- Calculate a weighted total out of 100 using the stage-adjusted weights above
- Label the result: "Investment-Ready", "Fundable with Support", "Emerging Potential", or "Not Yet Ready"
- Suggest 2–3 priority improvements in weak areas (score ≤ 3)
- Include the final score clearly as "BIG Fundability Score: X/100"

IMPORTANT: Provide a comprehensive analysis that investors would find valuable.
`

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }]
    })

    return response.text

  } catch (error) {
    console.error("Gemini AI analysis failed:", error)
    throw new Error(`AI analysis failed: ${error.message}`)
  }
}

export default function GPT({ files = [], onEvaluationComplete }) {
  const [input, setInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedScore, setExtractedScore] = useState(null);
  const [fundabilityLabel, setFundabilityLabel] = useState('');
  const [aiEvaluation, setAiEvaluation] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const extractScoreFromResponse = (responseText) => {
    try {
      // Pattern 1: Look for "BIG Fundability Score: X/100" or "Score: X/100"
      const scorePattern1 = /(?:BIG\s+Fundability\s+Score|Total\s+Score|Composite\s+Score|Final\s+Score):\s*(\d+(?:\.\d+)?)\s*(?:\/100|%|out\s+of\s+100)/i;

      // Pattern 2: Look for "X/100" standalone
      const scorePattern2 = /(\d+(?:\.\d+)?)\s*\/\s*100/g;

      // Pattern 3: Look for score in table format
      const scorePattern3 = /(?:Score|Total)[\s\|]*(\d+(?:\.\d+)?)\s*(?:\/100|%)/i;

      let score = null;

      // Try pattern 1 first (most specific)
      const match1 = responseText.match(scorePattern1);
      if (match1) {
        score = parseFloat(match1[1]);
      } else {
        // Try pattern 2 - find all X/100 patterns and take the last one (likely the total)
        const matches2 = [...responseText.matchAll(scorePattern2)];
        if (matches2.length > 0) {
          score = parseFloat(matches2[matches2.length - 1][1]);
        } else {
          // Try pattern 3
          const match3 = responseText.match(scorePattern3);
          if (match3) {
            score = parseFloat(match3[1]);
          }
        }
      }

      return score;
    } catch (error) {
      console.error('Error extracting score:', error);
      return null;
    }
  };

  const getFundabilityLabel = (score) => {
    if (score >= 85) return 'Investment-Ready';
    if (score >= 65) return 'Fundable with Support';
    if (score >= 50) return 'Emerging Potential';
    return 'Not Yet Ready';
  };

  const handleIncomingFiles = async (incomingFiles) => {
    if (incomingFiles.length === 0) return;

    setIsLoading(true);
    const newFiles = [];

    try {
      for (const file of incomingFiles) {
        try {
          const content = await extractTextFromFile(file);
          newFiles.push({
            name: file.name,
            size: file.size,
            type: file.type,
            content: content,
            id: Date.now() + Math.random(),
            extractionMethod: "google_ai_enhanced"
          });
        } catch (error) {
          console.error(`Error extracting ${file.name}:`, error);
          newFiles.push({
            name: file.name,
            size: file.size,
            type: file.type,
            content: `[Error extracting content from ${file.name}]`,
            id: Date.now() + Math.random(),
            error: true
          });
        }
      }

      setUploadedFiles(prev => [...prev, ...newFiles]);

      // Auto-trigger evaluation
      await performEvaluation(newFiles);

    } catch (error) {
      console.error('File processing error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const performEvaluation = async (filesToEvaluate) => {
    const profileData = await fetchUserProfile();

    const mapToBIGStage = (stage) => {
      switch (stage?.toLowerCase()) {
        case 'startup': return 'Pre-seed';
        case 'growth': return 'Seed';
        case 'scaling': return 'Series A/B';
        case 'mature':
        case 'turnaround': return 'Maturity';
        default: return 'Not specified';
      }
    };

    const stageLabel = mapToBIGStage(profileData?.entityOverview?.operationStage);

    try {
      const reply = await analyzeWithGeminiAI(
        filesToEvaluate.map(f => f.content),
        filesToEvaluate.map(f => ({ 
          name: f.name, 
          type: f.type, 
          text: f.content,
          extractionMethod: f.extractionMethod 
        })),
        profileData,
        stageLabel
      );

      setResponse(reply);

      const score = extractScoreFromResponse(reply);
      if (score !== null) {
        setExtractedScore(score);
        const label = getFundabilityLabel(score);
        setFundabilityLabel(label);

        if (onEvaluationComplete) {
          onEvaluationComplete(reply, score, label);
        }

        // ✅ Save with stage
        await saveDataToFirebase(reply, score, label, stageLabel);

        console.log("Score:", score, "Label:", label, "Stage:", stageLabel);
      } else {
        console.warn("No score extracted");
        setExtractedScore(null);
        setFundabilityLabel('');
      }
    } catch (error) {
      console.error("Evaluation error:", error);
    }
  };

  useEffect(() => {
    if (files && files.length > 0) {
      handleIncomingFiles(files);
    }
  }, [files]);

  const saveDataToFirebase = async (response, score, label, growthStage) => {
    try {
      setIsLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error("User not logged in.");
      }

      if (!response) {
        throw new Error("No evaluation data to save");
      }

      // Create a more structured data object
      const dataToSave = {
        evaluation: {
          content: response,
          score,
          label,
          evaluatedAt: new Date().toISOString(),
          modelVersion: "Gemini-2.5-Flash",
          growthStage, // ✅ Save growth stage explicitly
        },
        userId: userId,
        createdAt: new Date().toISOString(),
        files: uploadedFiles.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          extractionMethod: file.extractionMethod
        }))
      };
      
      const evaluationsRef = collection(db, "aiEvaluations");

      // First, check if a document with this userId already exists
      const q = query(evaluationsRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Document exists - update it
        const docRef = querySnapshot.docs[0].ref;
        await setDoc(docRef, dataToSave, { merge: true });
        console.log('Evaluation updated in Firebase with ID: ', docRef.id);
      } else {
        // Document doesn't exist - create new one
        const docRef = await addDoc(evaluationsRef, dataToSave);
        console.log('New evaluation saved to Firebase with ID: ', docRef.id);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (err) {
      console.error("Error saving to Firebase:", err);
      if (err.message.includes("permission-denied")) {
        console.error("You don't have permission to save evaluations");
      } else if (err.message.includes("network-error") || !navigator.onLine) {
        console.error("Network error - please check your connection");
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearAll = () => {
    setInput('');
    setUploadedFiles([]);
    setResponse('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen">
      {extractedScore !== null && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">BIG Fundability Assessment</h3>
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold text-blue-900">
              {extractedScore}/100
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${extractedScore >= 85 ? 'bg-green-100 text-green-800' :
                extractedScore >= 65 ? 'bg-yellow-100 text-yellow-800' :
                  extractedScore >= 50 ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
              }`}>
              {fundabilityLabel}
            </div>
          </div>
          {/* Success message will go here */}
          {saveSuccess && (
            <div className="mt-2 text-green-600 text-sm">
              Evaluation saved successfully!
            </div>
          )}
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-700">Processing ...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}