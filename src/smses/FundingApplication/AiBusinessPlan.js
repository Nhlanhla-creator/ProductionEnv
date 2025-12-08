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

import { getFunctions, httpsCallable } from 'firebase/functions';



const functions = getFunctions();

const extractWithGoogleAI = async (file, documentType = "Pitch Document") => {
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
    console.log("🔄 Calling Firebase Function for analysis...");
    
    const analyzeFundability = httpsCallable(functions, 'analyzeFundability');
    
    const result = await analyzeFundability({
      extractedTexts,
      fileInfo,
      profileData,
      stageLabel
    });

    if (!result.data.success) {
      throw new Error(result.data.error || "Analysis failed");
    }

    console.log("✅ Analysis completed successfully");
    return result.data.analysis;

  } catch (error) {
    console.error("❌ Firebase Function analysis failed:", error);
    
    // Check for specific error types
    if (error.code === 'functions/unauthenticated') {
      throw new Error("Please sign in to use AI analysis");
    } else if (error.code === 'functions/deadline-exceeded') {
      throw new Error("Analysis timed out. Please try with fewer or smaller files.");
    } else if (error.code === 'functions/resource-exhausted') {
      throw new Error("Service temporarily unavailable. Please try again in a few minutes.");
    }
    
    throw new Error(`AI analysis failed: ${error.message}`);
  }
};


export default function GPT({ files = [], onEvaluationComplete }) {
  const [input, setInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedScore, setExtractedScore] = useState(null);
  const [fundabilityLabel, setFundabilityLabel] = useState('');
  const [aiEvaluation, setAiEvaluation] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
// Initialize functions (add near your other Firebase imports)
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  
  // Add these states for the processing modal
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
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

    // Show processing modal
    setShowProcessingModal(true);
    setProcessingStatus('Starting file processing...');
    setIsProcessingFiles(true);
    setTotalFiles(incomingFiles.length);
    setCurrentFileIndex(0);

    const newFiles = [];

    try {
      for (let i = 0; i < incomingFiles.length; i++) {
        const file = incomingFiles[i];
        
        // Update processing status
        setCurrentFileIndex(i + 1);
        setProcessingStatus(`Processing file ${i + 1} of ${incomingFiles.length}: ${file.name}`);
        
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
      
      // Update status for AI analysis
      setProcessingStatus('File extraction complete. Starting AI analysis...');
      
      // Auto-trigger evaluation
      await performEvaluation(newFiles);
      
      // Close modal after completion
      setTimeout(() => {
        setShowProcessingModal(false);
        setIsProcessingFiles(false);
      }, 500);

    } catch (error) {
      console.error('File processing error:', error);
      setProcessingStatus(`Error: ${error.message}`);
      
      // Keep modal open with error for a bit before closing
      setTimeout(() => {
        setShowProcessingModal(false);
        setIsProcessingFiles(false);
      }, 3000);
    }
  };

  const performEvaluation = async (filesToEvaluate) => {
    // Show processing modal if not already showing
    if (!showProcessingModal) {
      setShowProcessingModal(true);
      setProcessingStatus('Starting AI analysis...');
    }
    
    setIsLoading(true);
    
    try {
      setProcessingStatus('Fetching user profile...');
      const profileData = await fetchUserProfile();

      const mapToBIGStage = (stage) => {
        switch (stage?.toLowerCase()) {
          case 'startup': return 'Pre-seed';
          case 'growth': return 'Seed';
          case 'scaling': return 'Series A/B';
          case 'mature':
          case 'turnaround': return 'Maturity';
          default: return 'Pre-seed';
        }
      };

      const stageLabel = mapToBIGStage(profileData?.entityOverview?.operationStage);

      // Prepare data for Firebase Function
      const extractedTexts = filesToEvaluate.map(f => f.content);
      const fileMetadata = filesToEvaluate.map(f => ({ 
        name: f.name, 
        type: f.type,
        extractionMethod: f.extractionMethod || 'standard'
      }));

      setProcessingStatus('Analyzing content with AI... This may take a moment.');
      
      const reply = await analyzeWithGeminiAI(
        extractedTexts,
        fileMetadata,
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

        setProcessingStatus('Saving results...');
        // Save to Firebase
        await saveDataToFirebase(reply, score, label, stageLabel);

        console.log("Score:", score, "Label:", label, "Stage:", stageLabel);
        
        setProcessingStatus('Analysis complete!');
      } else {
        console.warn("No score extracted from response");
        setExtractedScore(null);
        setFundabilityLabel('');
        setProcessingStatus('Analysis complete (no score extracted)');
      }
    } catch (error) {
      console.error("Evaluation error:", error);
      setProcessingStatus(`Error: ${error.message}`);
      setResponse(`❌ Analysis Error: ${error.message}\n\nPlease try again or contact support if the issue persists.`);
      setExtractedScore(null);
      setFundabilityLabel('');
    } finally {
      setIsLoading(false);
      
      // Close modal after a delay
      setTimeout(() => {
        setShowProcessingModal(false);
      }, 1000);
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