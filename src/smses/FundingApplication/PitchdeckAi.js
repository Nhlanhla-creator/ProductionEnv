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
import { API_KEYS } from '../../API';
import { GoogleGenAI } from "@google/genai"
import { getFunctions, httpsCallable } from 'firebase/functions';

// ✅ Initialize Firebase Functions
const functions = getFunctions();
// ✅ Initialize Google AI only

// ✅ Replace GoogleGenAI with Firebase Functions
export const fetchUserProfile = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const profileRef = doc(db, "universalProfiles", userId);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      return profileSnap.data();
    } else {
      throw new Error("No profile found for the current user.");
    }
  } catch (error) {
    console.error("Error fetching profile data:", error);
    throw error;
  }
};

// ✅ REPLACE extractWithGoogleAI with Firebase Function
const extractWithGoogleAI = async (file, documentType = "Pitch Deck") => {
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

// ✅ Enhanced PDF extraction with fallbacks (using Firebase Function)
const extractFromPDF = async (file) => {
  try {
    console.log("📄 Attempting PDF extraction with Firebase Function...")
    
    // Primary method: Use Firebase Function for best results
    const aiText = await extractWithGoogleAI(file, "Pitch Deck PDF")
    if (aiText && aiText.length > 100) {
      console.log("✅ PDF extracted successfully with Firebase Function")
      return aiText
    }
    
    // Fallback: Traditional PDF.js extraction (keep your existing fallback)
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

// ✅ Enhanced DOCX extraction with Firebase Function fallback
const extractFromDOCX = async (file) => {
  try {
    console.log("📝 Attempting DOCX extraction with Mammoth...")
    const arrayBuffer = await file.arrayBuffer()
    const { value } = await mammoth.extractRawText({ arrayBuffer })
    
    if (value && value.length > 100) {
      console.log("✅ DOCX extracted successfully with Mammoth")
      return value.length > 20000 ? value.slice(0, 20000) + "…[truncated]" : value
    }
    
    // Fallback to Firebase Function if Mammoth fails
    console.log("🔄 Falling back to Firebase Function for DOCX...")
    const aiText = await extractWithGoogleAI(file, "Word Document")
    return aiText
    
  } catch (error) {
    console.error("❌ DOCX extraction failed:", error)
    
    // Final fallback to Firebase Function
    try {
      const aiText = await extractWithGoogleAI(file, "Word Document")
      return aiText
    } catch (aiError) {
      return "[DOCX file - extraction incomplete]"
    }
  }
}

// ✅ Enhanced image processing with Firebase Function
const extractFromImage = async (file) => {
  try {
    console.log("🖼️ Extracting text from image with Firebase Function...")
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
      // Fallback to Firebase Function for Excel files
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
    
    // Fallback to Firebase Function
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
    return `[${file.name}] skipped - file too large (${sizeMb.toFixed(1)} MB). Max supported ~25 MB.`
  }

  try {
    console.log(`🔍 Processing ${file.name} (${fileExt})...`)

    // Handle different file types with appropriate methods
    switch (fileExt) {
      case "pdf":
        return await extractFromPDF(file)
        
      case "docx":
        return await extractFromDOCX(file)
        
      case "doc":
        // For .doc files, use Firebase Function directly
        return await extractWithGoogleAI(file, "Legacy Word Document")
        
      case "xlsx":
      case "xls":
        return await extractFromXLS(file)
        
      case "jpg":
      case "jpeg":
      case "png":
        return await extractFromImage(file)
        
      case "txt":
      case "md":
        return await extractFromText(file)
        
      default:
        // For unknown types, try Firebase Function
        console.log(`🔄 Unknown file type ${fileExt}, trying Firebase Function...`)
        return await extractWithGoogleAI(file, "Unknown Document Type")
    }

  } catch (error) {
    console.error(`❌ Error processing ${file.name}:`, error)
    
    // Final fallback: try Firebase Function extraction
    try {
      console.log("🔄 Attempting final fallback with Firebase Function...")
      const fallbackText = await extractWithGoogleAI(file, "Document of unknown type")
      return fallbackText || `[Extraction failed: ${error.message}]`
    } catch (finalError) {
      return `[Error extracting content from ${file.name}: ${error.message}]`
    }
  }
}
// In your PitchDeckGPT component, replace the analyzeWithGeminiAI function with:
const analyzeWithGeminiAI = async (extractedTexts, fileInfo, profileData, stageLabel) => {
  try {
    console.log("🔄 Calling Firebase Function for pitch deck analysis...");
    
    const analyzePitchDeck = httpsCallable(functions, 'analyzePitchDeck');
    
    const result = await analyzePitchDeck({
      extractedTexts,
      fileInfo,
      profileData,
      stageLabel
    });

    if (!result.data.success) {
      throw new Error(result.data.error || "Analysis failed");
    }

    console.log("✅ Pitch deck analysis completed successfully");
    return result.data.analysis;

  } catch (error) {
    console.error("❌ Firebase Function pitch analysis failed:", error);
    
    // Check for specific error types
    if (error.code === 'functions/unauthenticated') {
      throw new Error("Please sign in to use pitch analysis");
    } else if (error.code === 'functions/deadline-exceeded') {
      throw new Error("Analysis timed out. Please try with fewer or smaller files.");
    } else if (error.code === 'functions/resource-exhausted') {
      throw new Error("Service temporarily unavailable. Please try again in a few minutes.");
    }
    
    throw new Error(`Pitch analysis failed: ${error.message}`);
  }
};


export default function PitchDeckGPT({ files = [], onEvaluationComplete }) {
  const [input, setInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedScore, setExtractedScore] = useState(null);
  const [fundabilityLabel, setFundabilityLabel] = useState('');
  const [aiEvaluation, setAiEvaluation] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);


   // ✅ NEW: Add processing stages
  const [processingStage, setProcessingStage] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  useEffect(() => {
    if (files && files.length > 0) {
      const validFile = files.some(file => {
        if (!file || !file.name) return false;
        const ext = file.name.split('.').pop().toLowerCase();
        return ['pdf', 'docx', 'txt', 'md', 'jpg', 'jpeg', 'png', 'xlsx', 'xls'].includes(ext);
      });

      if (!validFile) {
        alert("Invalid or unsupported file format. Please upload a PDF, DOCX, TXT, MD, Image, or Excel file.");
        return;
      }

      handleIncomingFiles(files);
    }
  }, [files]);

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

   // ✅ UPDATED: handleIncomingFiles with progress tracking
  const handleIncomingFiles = async (incomingFiles) => {
    if (!incomingFiles || incomingFiles.length === 0) {
      alert("No file was uploaded. Please upload a valid document.");
      return;
    }

    setIsLoading(true);
    setProcessingStage('Preparing files...');
    setProcessingProgress(10);

    const newFiles = [];

    try {
      for (const file of incomingFiles) {
        const fileType = file.name.split('.').pop().toLowerCase();
        const allowedTypes = ['txt', 'docx', 'md', 'pdf', 'jpg', 'jpeg', 'png', 'xlsx', 'xls'];

        if (!allowedTypes.includes(fileType)) {
          console.warn(`Unsupported file type: ${file.name}`);
          alert(`Unsupported file type: ${file.name}. Please upload a valid document.`);
          continue;
        }

        try {
          setProcessingStage(`Extracting text from ${file.name}...`);
          setProcessingProgress(20 + (newFiles.length / incomingFiles.length) * 20);

          const content = await extractTextFromFile(file);

          if (!content || content.trim().length < 20) {
            alert(`The uploaded file "${file.name}" is empty or unreadable. Please re-upload a valid file.`);
            continue;
          }

          newFiles.push({
            name: file.name,
            size: file.size,
            type: file.type,
            content: content,
            id: Date.now() + Math.random(),
            extractionMethod: "firebase_function_enhanced"
          });

        } catch (error) {
          console.error(`Error extracting content from ${file.name}:`, error);
          alert(`Error reading file: ${file.name}. Please try another format.`);
        }
      }

      // Final validation before evaluation
      if (newFiles.length === 0) {
        alert("No valid files found for evaluation. Please re-upload a valid document.");
        return;
      }

      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      setProcessingStage('Analyzing pitch deck with AI...');
      setProcessingProgress(60);
      
      await performEvaluation(newFiles);
      
      setProcessingStage('Saving results...');
      setProcessingProgress(80);

    } catch (error) {
      console.error('Unhandled file processing error:', error);
      alert('An unexpected error occurred during file processing.');
    } finally {
      setProcessingProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProcessingStage('');
        setProcessingProgress(0);
      }, 500);
    }
  };


 // Also update the performEvaluation function to handle the new response structure:
const performEvaluation = async (filesToEvaluate) => {
  const profileData = await fetchUserProfile();
  const stage = (profileData?.entityOverview?.operationStage || "").toLowerCase();

  const stageLabel = ["pre-seed", "preseed"].includes(stage) ? "Pre-seed"
                    : ["growth", "scale-up", "scaling"].includes(stage) ? "Growth"
                    : "Maturity";

  try {
    const result = await analyzeWithGeminiAI(
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

    // Handle the result - it could be the analysis text or an object
    let analysisText, score, label, operationalScore, operationalSummary;
    
    if (typeof result === 'string') {
      // Backward compatibility: result is just the analysis text
      analysisText = result;
      score = extractScoreFromResponse(result);
      operationalScore = extractOperationalScoreFromResponse(result);
      operationalSummary = extractOperationalSummaryFromResponse(result);
      label = score !== null ? getFundabilityLabel(score) : 'Analysis Failed';
    } else {
      // New format: result is an object with all the data
      analysisText = result.analysis || result;
      score = result.score;
      operationalScore = result.operationalScore;
      operationalSummary = result.operationalSummary;
      label = result.label || (score !== null ? getFundabilityLabel(score) : 'Analysis Failed');
    }

    setResponse(analysisText);

    if (score !== null) {
      setExtractedScore(score);
      setFundabilityLabel(label);

      if (onEvaluationComplete) {
        onEvaluationComplete(analysisText, score, label, operationalScore, operationalSummary);
      }

      await saveDataToFirebase(analysisText, score, label, stageLabel, operationalScore, operationalSummary);

      console.log("Score:", score, "Label:", label, "Stage:", stageLabel, "Operational Score:", operationalScore);
    } else {
      console.warn("No score extracted");
      setExtractedScore(null);
      setFundabilityLabel('');
    }
  } catch (error) {
    console.error("Evaluation error:", error);
    // Set error state
    setResponse(`❌ Analysis Error: ${error.message}`);
    setExtractedScore(0);
    setFundabilityLabel('Analysis Failed');
  }
};

  // Operational score extraction functions (keep your existing ones)
  const extractOperationalScoreFromResponse = (responseText) => {
    try {
      console.log("Extracting from response:", responseText.substring(0, 500) + "...");
      
      const patterns = [
        /\*\*10\.\s*Operational\s+Strength.*?\*\*\s*\*\*Score:\s*(\d(?:\.\d)?)\/5\*\*/is,
        /10\.\s*Operational\s+Strength.*?Score:\s*(\d(?:\.\d)?)\/5/is,
        /Operational\s+Strength\s+Score:\s*(\d(?:\.\d)?)\/5/i,
        /\*\*Operational\s+Strength\s+Score:\s*(\d(?:\.\d)?)\/5\*\*/i,
        /Operational.*?Score:\s*(\d(?:\.\d)?)\/5/is,
        /(?:10\.|Operational).*?(\d(?:\.\d)?)\/5/is,
        /operational.*?(\d(?:\.\d)?)\s*\/\s*5/is
      ];

      for (let i = 0; i < patterns.length; i++) {
        const match = responseText.match(patterns[i]);
        if (match && match[1]) {
          const score = parseFloat(match[1]);
          console.log(`Pattern ${i + 1} matched: ${score}`);
          if (score >= 0 && score <= 5) {
            return score;
          }
        }
      }

      console.log("No operational score pattern matched");
      return null;
    } catch (error) {
      console.error("Error extracting operational score:", error);
      return null;
    }
  };

  const extractOperationalSummaryFromResponse = (responseText) => {
    try {
      console.log("Extracting operational summary...");
      
      const patterns = [
        /\*\*10\.\s*Operational\s+Strength.*?\*\*\s*\*\*Score:\s*\d\/5\*\*\s*(.*?)(?=\n\s*---|\n\s*\*\*Priority|\n\s*###|\*\*\d+\.|\n\s*$)/is,
        /10\.\s*Operational\s+Strength.*?Score:\s*\d\/5[^\n]*\n(.*?)(?=\n\s*\*\*Priority|\n\s*---|\n\s*\d+\.|\n\s*$)/is,
        /Operational\s+Strength\s+Score:\s*\d\/5[^\n]*\n(.*?)(?=\n\s*\*\*|\n\s*---|\n\s*Priority|\n\s*$)/is,
        /10\..*?operational.*?(\d\/5)[^\n]*\n(.*?)(?=\n\s*\*\*|\n\s*---|\n\s*Priority|\n\s*\d+\.|\n\s*$)/is
      ];

      for (let i = 0; i < patterns.length; i++) {
        const match = responseText.match(patterns[i]);
        if (match) {
          let summary = match[match.length - 1];
          if (summary && summary.trim().length > 10) {
            summary = summary
              .trim()
              .replace(/\*\*/g, '')
              .replace(/^\s*[-•]\s*/, '')
              .replace(/\n\s*[-•]\s*/g, '\n')
              .substring(0, 500);
            
            console.log(`Summary pattern ${i + 1} matched`);
            return summary;
          }
        }
      }

      console.log("No operational summary pattern matched");
      return null;
    } catch (error) {
      console.error('Error extracting operational summary:', error);
      return null;
    }
  };

  const saveDataToFirebase = async (response, score, label, growthStage, operationalScore, operationalSummary) => {
    try {
      setIsLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("User not logged in.");
      if (!response) throw new Error("No evaluation data to save");

      const dataToSave = {
        evaluation: {
          content: response,
          score,
          label,
          operationalScore,
          operationalSummary,
          evaluatedAt: new Date().toISOString(),
          modelVersion: "Gemini-2.5-Flash", // ✅ Updated to Gemini
          growthStage,
        },
        userId,
        createdAt: new Date().toISOString(),
        files: uploadedFiles.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          extractionMethod: file.extractionMethod
        }))
      };

      const evaluationsRef = collection(db, "aiPitchEvaluations");
      const q = query(evaluationsRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await setDoc(docRef, dataToSave, { merge: true });
      } else {
        const docRef = await addDoc(evaluationsRef, dataToSave);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Firebase save error:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
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
          {saveSuccess && (
            <div className="mt-2 text-green-600 text-sm">
              Evaluation saved successfully!
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
              Analyzing Pitch Deck
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
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}