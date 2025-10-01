// This is a reduced version of FinancialsGPT
// It focuses only on Revenue Growth evaluation and saves to aiFinancialEvaluations

"use client"
import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import { db, auth } from '../../firebaseConfig';
import { doc, getDoc, collection, setDoc } from "firebase/firestore";
import { API_KEYS } from '../../API';

const sendMessageToChatGPT = async (message,apiKey) => {
  const API_KEY = apiKey;
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
        messages: [{ role: 'user', content: message }],
        max_tokens: 1000,
        temperature: 0.7,
      })
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('ChatGPT API Error:', error);
    throw new Error(`Failed to get response from ChatGPT: ${error.message}`);
  }
};

export default function FinancialsGPT_RevenueOnly({ files = [], onEvaluationComplete,apiKey }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [response, setResponse] = useState('');
  const [score, setScore] = useState(null);
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (files && files.length > 0) {
      const validFile = files.some(file => file?.name && ['pdf', 'docx', 'txt', 'md'].includes(file.name.split('.').pop().toLowerCase()));
      if (!validFile) {
        alert("Unsupported file format. Use PDF, DOCX, TXT, or MD.");
        return;
      }
      handleIncomingFiles(files);
    }
  }, [files]);

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
            resolve(new TextDecoder().decode(new Uint8Array(result)));
          } else if (fileType === 'docx') {
            const { value } = await mammoth.extractRawText({ arrayBuffer: result });
            resolve(value);
          } else {
            reject('Unsupported file type');
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject('Failed to read file');
      reader.readAsArrayBuffer(file);
    });
  };

  const handleIncomingFiles = async (incomingFiles) => {
    setIsLoading(true);
    const processedFiles = [];

    for (const file of incomingFiles) {
      try {
        const content = await extractTextFromFile(file);
        if (!content || content.length < 20) continue;
        processedFiles.push({ name: file.name, size: file.size, type: file.type, content });
      } catch (error) {
        console.error(`Error processing ${file.name}`, error);
      }
    }

    setUploadedFiles(processedFiles);
    if (processedFiles.length > 0) await performEvaluation(processedFiles);
    setIsLoading(false);
  };

  const performEvaluation = async (filesToEvaluate) => {
    const profileData = await fetchUserProfile();
    const stage = (profileData?.entityOverview?.operationStage || '').toLowerCase();
    const stageLabel = ["pre-seed", "preseed"].includes(stage) ? "Pre-seed" : ["growth", "scale-up"].includes(stage) ? "Growth" : "Maturity";

    let prompt = `You are a financial analyst AI evaluating revenue growth from uploaded financial statements. 
Startup Stage: ${stageLabel}
Instructions:
- Analyze revenue data across time (e.g. months or years).
- Score revenue growth from 0 to 5 with 1-2 sentence justification.
- Provide a clear summary of growth trends, stability, and any anomalies.
- Format the response as:
\nRevenue Growth Score: X/5\n\nSummary: ...`;

    filesToEvaluate.forEach((file, idx) => {
      prompt += `\n\nFile ${idx + 1}: ${file.name}\n${file.content}\n`;
    });

    try {
      const reply = await sendMessageToChatGPT(prompt,apiKey);
      setResponse(reply);

      const scoreMatch = reply.match(/Revenue Growth Score:\s*(\d(?:\.\d)?)\s*\/5/i);
      const summaryMatch = reply.match(/Summary:\s*(.*)/is);

      const parsedScore = scoreMatch ? parseFloat(scoreMatch[1]) : null;
      const parsedSummary = summaryMatch ? summaryMatch[1].trim().substring(0, 1000) : '';

      setScore(parsedScore);
      setSummary(parsedSummary);

      if (onEvaluationComplete) onEvaluationComplete(reply, parsedScore, parsedSummary);

      const userId = auth.currentUser?.uid;
      if (userId && parsedScore !== null) {
        const dataToSave = {
          evaluation: {
            content: reply,
            score: parsedScore,
            summary: parsedSummary,
            evaluatedAt: new Date().toISOString(),
            modelVersion: 'GPT-4',
            growthStage: stageLabel,
          },
          userId,
          createdAt: new Date().toISOString(),
          files: uploadedFiles.map(f => ({ name: f.name, size: f.size, type: f.type }))
        };

     try {
  await setDoc(doc(db, `aiFinancialEvaluations/${userId}`), dataToSave, { merge: true });
  console.log("Saved to Firestore");
} catch (err) {
  console.error("Error saving to Firestore:", err);
}

      }
    } catch (err) {
      console.error("Evaluation failed", err);
    }
  };

  const fetchUserProfile = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated");
    const snap = await getDoc(doc(db, "universalProfiles", userId));
    if (!snap.exists()) throw new Error("Profile not found");
    return snap.data();
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {score !== null && (
        <div className="p-4 bg-blue-50 rounded border border-blue-200">
          <h2 className="text-lg font-semibold mb-2">Revenue Growth Analysis</h2>
          <p className="text-2xl font-bold text-blue-800">{score}/5</p>
          {/* <p className="mt-2 text-gray-700 whitespace-pre-line">{summary}</p> */}
        </div>
      )}
      {isLoading && (
        <div className="mt-4 text-blue-600">Analyzing financials, please wait...</div>
      )}
    </div>
  );
}