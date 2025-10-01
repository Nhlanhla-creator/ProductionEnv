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

export const fetchUserProfile = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const profileRef = doc(db, "universalProfiles", userId);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      return profileSnap.data(); // This is the user's profile data
    } else {
      throw new Error("No profile found for the current user.");
    }
  } catch (error) {
    console.error("Error fetching profile data:", error);
    throw error;
  }
};
// ChatGPT API function - replace YOUR_API_KEY with your actual OpenAI API key
const sendMessageToChatGPT = async (message,apiKey) => {
  const API_KEY = apiKey; // Replace with your actual API key
  const API_URL = 'https://api.openai.com/v1/chat/completions';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('ChatGPT API Error:', error);
    throw new Error(`Failed to get response from ChatGPT: ${error.message}`);
  }
};

export default function PitchDeckGPT({ files = [], onEvaluationComplete ,apiKey}) {
  const [input, setInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedScore, setExtractedScore] = useState(null);
  const [fundabilityLabel, setFundabilityLabel] = useState('');
  const [aiEvaluation, setAiEvaluation] = useState(null); // Store AI response

  const [saveSuccess, setSaveSuccess] = useState(false);
  useEffect(() => {
    if (files && files.length > 0) {
      const validFile = files.some(file => {
        if (!file || !file.name) return false;
        const ext = file.name.split('.').pop().toLowerCase();
        return ['pdf', 'docx', 'txt', 'md'].includes(ext);
      });

      if (!validFile) {
        alert("Invalid or unsupported file format. Please upload a PDF, DOCX, TXT, or MD file.");
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


  const handleIncomingFiles = async (incomingFiles) => {
    if (!incomingFiles || incomingFiles.length === 0) {
      alert("No file was uploaded. Please upload a valid document.");
      return;
    }

    setIsLoading(true);
    const newFiles = [];

    try {
      for (const file of incomingFiles) {
        const fileType = file.name.split('.').pop().toLowerCase();
        const allowedTypes = ['txt', 'docx', 'md', 'pdf'];

        if (!allowedTypes.includes(fileType)) {
          console.warn(`Unsupported file type: ${file.name}`);
          alert(`Unsupported file type: ${file.name}. Please upload a valid document.`);
          continue;
        }

        try {
          const content = await extractTextFromFile(file);

          if (!content || content.trim().length < 20) {
            alert(`The uploaded file "${file.name}" is empty or unreadable. Please re-upload a valid file.`);
            continue;
          }

          newFiles.push({
            name: file.name,
            size: file.size,
            type: file.type,
            content,
            id: Date.now() + Math.random()
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
      await performEvaluation(newFiles);

    } catch (error) {
      console.error('Unhandled file processing error:', error);
      alert('An unexpected error occurred during file processing.');
    } finally {
      setIsLoading(false);
    }
  };


const performEvaluation = async (filesToEvaluate) => {
  const profileData = await fetchUserProfile();
  const stage = (profileData?.entityOverview?.operationStage || "").toLowerCase();

  const stageLabel = ["pre-seed", "preseed"].includes(stage) ? "Pre-seed"
                    : ["growth", "scale-up", "scaling"].includes(stage) ? "Growth"
                    : "Maturity";

  let prompt = `
You are evaluating a startup pitch using the BIG Fundability Scorecard (Pitch Deck). Score each item 0–5 with 1-2 sentence justification per line. Then provide a total weighted score out of 100 based on the startup's current stage: ${stageLabel}.

Startup Summary:
Stage: ${stageLabel}
Description: ${profileData?.entityOverview?.businessDescription || "Not provided"}

Use these 9 main criteria for the weighted score:
1. Problem Clarity
2. Solution Fit
3. Market Understanding (TAM, SAM)
4. Competitive Landscape and Advantage
5. Revenue Streams
6. Financial Projections
7. Traction
8. MVP (Minimum Viable Product) Maturity
9. Investor IRR

ADDITIONAL EVALUATION (not included in main score):
10. Operational Strength & Operating Model Clarity

Weighting by stage (for main 9 criteria only):

For Pre-seed:
- Problem Clarity: 3%, Solution Fit: 3%, Market: 2%, Competition: 2%, Revenue: 2%, Financials: 2%, Traction: 2%, MVP Maturity: 3%, IRR: 1%

For Growth:
- Problem Clarity: 2%, Solution Fit: 2%, Market: 2%, Competition: 2%, Revenue: 2%, Financials: 2%, Traction: 1%, MVP Maturity: 1%, IRR: 1%

For Maturity:
- Problem Clarity: 1%, Solution Fit: 1%, Market: 1%, Competition: 1%, Revenue: 1%, Financials: 2%, Traction: 1%, MVP Maturity: 1%, IRR: 1%

Instructions:
- Score each of the 9 main items from 0–5 with short justification.
- Calculate a weighted total out of 100 using the stage-adjusted weights above.
- Score item 10 (Operational Strength & Operating Model Clarity) separately from 0–5 with justification.
- Label the main result: "Investment-Ready", "Fundable with Support", "Emerging Potential", or "Not Yet Ready".
- Suggest 2–3 priority improvements in weak areas (score ≤ 3).
- Clearly indicate: "Operational Strength Score: X/5" at the end.

Evaluate the following pitch content:
`;

  filesToEvaluate.forEach((file, index) => {
    prompt += `\n\nFile ${index + 1}: ${file.name}\n${file.content}\n`;
  });

  try {
    const reply = await sendMessageToChatGPT(prompt,apiKey);
    setResponse(reply);

    const score = extractScoreFromResponse(reply);
    const operationalScore = extractOperationalScoreFromResponse(reply);
const operationalSummary = extractOperationalSummaryFromResponse(reply); // ✅ NEW

    if (score !== null) {
      setExtractedScore(score);
      const label = getFundabilityLabel(score);
      setFundabilityLabel(label);

      if (onEvaluationComplete) {
        onEvaluationComplete(reply, score, label, operationalScore);
      }

      // ✅ Save with stage and operational score
    await saveDataToFirebase(reply, score, label, stageLabel, operationalScore, operationalSummary);


      console.log("Score:", score, "Label:", label, "Stage:", stageLabel, "Operational Score:", operationalScore);
    } else {
      console.warn("No score extracted");
      setExtractedScore(null);
      setFundabilityLabel('');
    }
  } catch (error) {
    console.error("Evaluation error:", error);
  }
};

// Add this new function to extract operational score
// Improved operational score extraction with multiple fallback patterns
const extractOperationalScoreFromResponse = (responseText) => {
  try {
    console.log("Extracting from response:", responseText.substring(0, 500) + "...");
    
    // Multiple patterns to try in order of preference
    const patterns = [
      // Pattern 1: **10. Operational Strength** **Score: X/5**
      /\*\*10\.\s*Operational\s+Strength.*?\*\*\s*\*\*Score:\s*(\d(?:\.\d)?)\/5\*\*/is,
      
      // Pattern 2: 10. Operational Strength & Operating Model Clarity Score: X/5
      /10\.\s*Operational\s+Strength.*?Score:\s*(\d(?:\.\d)?)\/5/is,
      
      // Pattern 3: Operational Strength Score: X/5 (anywhere in text)
      /Operational\s+Strength\s+Score:\s*(\d(?:\.\d)?)\/5/i,
      
      // Pattern 4: **Operational Strength Score: X/5**
      /\*\*Operational\s+Strength\s+Score:\s*(\d(?:\.\d)?)\/5\*\*/i,
      
      // Pattern 5: Score: X/5 (after "Operational" keyword)
      /Operational.*?Score:\s*(\d(?:\.\d)?)\/5/is,
      
      // Pattern 6: Just look for X/5 after "10." or "Operational"
      /(?:10\.|Operational).*?(\d(?:\.\d)?)\/5/is,
      
      // Pattern 7: Very loose - any number/5 after operational mention
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

// Improved operational summary extraction
const extractOperationalSummaryFromResponse = (responseText) => {
  try {
    console.log("Extracting operational summary...");
    
    const patterns = [
      // Pattern 1: After **10. Operational Strength** until next section
      /\*\*10\.\s*Operational\s+Strength.*?\*\*\s*\*\*Score:\s*\d\/5\*\*\s*(.*?)(?=\n\s*---|\n\s*\*\*Priority|\n\s*###|\*\*\d+\.|\n\s*$)/is,
      
      // Pattern 2: After "10. Operational" until next numbered item
      /10\.\s*Operational\s+Strength.*?Score:\s*\d\/5[^\n]*\n(.*?)(?=\n\s*\*\*Priority|\n\s*---|\n\s*\d+\.|\n\s*$)/is,
      
      // Pattern 3: Look for text after operational score
      /Operational\s+Strength\s+Score:\s*\d\/5[^\n]*\n(.*?)(?=\n\s*\*\*|\n\s*---|\n\s*Priority|\n\s*$)/is,
      
      // Pattern 4: Very loose - text after "operational" keyword
      /10\..*?operational.*?(\d\/5)[^\n]*\n(.*?)(?=\n\s*\*\*|\n\s*---|\n\s*Priority|\n\s*\d+\.|\n\s*$)/is
    ];

    for (let i = 0; i < patterns.length; i++) {
      const match = responseText.match(patterns[i]);
      if (match) {
        let summary = match[match.length - 1]; // Get the last capture group
        if (summary && summary.trim().length > 10) {
          // Clean up the summary
          summary = summary
            .trim()
            .replace(/\*\*/g, '') // Remove markdown formatting
            .replace(/^\s*[-•]\s*/, '') // Remove bullet points
            .replace(/\n\s*[-•]\s*/g, '\n') // Clean up bullet points
            .substring(0, 500); // Limit length
          
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

// Debug function to help you see what's in the response
const debugOperationalExtraction = (responseText) => {
  console.log("=== DEBUG OPERATIONAL EXTRACTION ===");
  console.log("Response length:", responseText.length);
  
  // Look for any mention of "operational"
  const operationalMentions = responseText.match(/operational[^.\n]*[.\n]/gi);
  console.log("Operational mentions:", operationalMentions);
  
  // Look for any X/5 patterns
  const scorePatterns = responseText.match(/\d+(?:\.\d+)?\/5/g);
  console.log("All X/5 patterns found:", scorePatterns);
  
  // Look for "10." patterns
  const tenPatterns = responseText.match(/10\..*$/gm);
  console.log("Lines starting with '10.':", tenPatterns);
  
  console.log("=== END DEBUG ===");
};


// Update the saveDataToFirebase function
const saveDataToFirebase = async (response, score, label, growthStage, operationalScore , operationalSummary) => {

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
    operationalSummary, // ✅ NEW
    evaluatedAt: new Date().toISOString(),
    modelVersion: "GPT-4",
    growthStage,
  },
      userId,
      createdAt: new Date().toISOString(),
      files: uploadedFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
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

  const extractTextFromFile = async (file) => {
    const fileType = file.name.split('.').pop().toLowerCase();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (event) => {
        const result = event.target.result;

        try {
          if (fileType === 'txt' || fileType === 'md') {
            resolve(result);
          } else if (fileType === 'pdf') {
            // For this demo, we'll use a simple text extraction
            // In a real implementation, you'd use pdf.js
            try {
              const text = new TextDecoder().decode(new Uint8Array(result));
              resolve(text.slice(0, 1000) + '... [PDF content extracted]');
            } catch {
              resolve('[PDF file detected - content extraction would require pdf.js library]');
            }
          } else if (fileType === 'docx') {
            try {
              const arrayBuffer = result;
              const { value } = await mammoth.extractRawText({ arrayBuffer });
              resolve(value);
            } catch (error) {
              resolve('[DOCX file detected - using mammoth for extraction]');
            }
          } else {
            reject('Unsupported file type');
          }
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => reject('Failed to read file');

      if (['pdf', 'docx'].includes(fileType)) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsLoading(true);
    const newFiles = [];

    try {
      for (const file of files) {
        try {
          const content = await extractTextFromFile(file);
          newFiles.push({
            name: file.name,
            size: file.size,
            type: file.type,
            content: content,
            id: Date.now() + Math.random()
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

      // Auto-trigger evaluation for manually uploaded files too
      await performEvaluation(newFiles);

    } catch (error) {
      console.error('File processing or API error:', error);
      alert('Failed to process some files or get AI response.');
    } finally {
      setIsLoading(false);
      e.target.value = '';
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
      {/* <h1 className="text-3xl font-bold text-gray-800 mb-6">ChatGPT File Uploader</h1> */}


      {/* File Upload */}
      {/* <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Files (supports .txt, .md, .pdf, .docx)
        </label>
        <input
          type="file"
          accept=".txt,.md,.pdf,.docx"
          onChange={handleFileChange}
          multiple
          className="w-full p-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div> */}

      {/* Uploaded Files List */}
      {/* {uploadedFiles.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Uploaded Files ({uploadedFiles.length})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className={`flex items-center justify-between p-3 border rounded-lg ${
                  file.error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${file.error ? 'text-red-800' : 'text-gray-900'}`}>
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)} • {file.content.length} characters extracted
                  </p>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                  title="Remove file"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )} */}

      {/* Action Buttons */}
      {/* <div className="flex gap-3 mb-6">
    
        <button
          onClick={clearAll}
          className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium"
        >
          Clear All
        </button>
      </div> */}
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

      {/* Response */}
      {/* {response && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">ChatGPT Response:</h3>
          <div className="text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border">
            {response}
          </div>
        </div>
      )} */}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-700">Processing...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}