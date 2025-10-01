"use client";

import { useState } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { API_KEYS } from '../../API';

const OPENAI_API_KEY = API_KEYS.OPENAI; // Make sure it's set

export default function AiProfileEvaluator() {
  const [aiText, setAiText] = useState("");
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(null);

  const handleEvaluation = async () => {
    setLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("User not authenticated");

      const profileRef = doc(db, "universalProfiles", userId);
      const profileSnap = await getDoc(profileRef);
      if (!profileSnap.exists()) throw new Error("Profile not found");

      const profileData = profileSnap.data();
      const stage = (profileData?.applicationOverview?.fundingStage || "Seed").toLowerCase();

      const prompt = `
You are an expert evaluator using the BIG Fundability Scorecard Rubric. Evaluate ONLY the following categories:

3.1 Leadership Strength  
3.2 Financial Readiness  
3.3 Financial Strength  
3.4 Operational Strength & Operating Model Clarity  
3.6 Guarantees  
3.7 Impact Proof  
3.8 Governance  

Based on the business stage: ${stage.toUpperCase()}, use the following weights:
Seed: 15%, 10%, 5%, 15%, 10%, 10%, 15%
Growth: 10%, 15%, 10%, 15%, 15%, 10%, 10%
Maturity: 5%, 20%, 15%, 10%, 20%, 10%, 10%

For each category, provide:
- A score out of 5
- 1–2 sentence rationale
- Then calculate and return the total weighted score (excluding 3.5 Pitch/Business Plan).

Respond in markdown format.

Here is the profile data:
${JSON.stringify(profileData, null, 2)}
`;

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            { role: "system", content: "You are a fundability evaluation expert." },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
        }),
      });

      const data = await res.json();
      const aiResponse = data.choices?.[0]?.message?.content;
      if (!aiResponse) throw new Error("No response from AI");

      setAiText(aiResponse);

      const scoreMatch = aiResponse.match(/total weighted score.*?(\d{1,3})/i);
      const parsedScore = scoreMatch ? parseInt(scoreMatch[1]) : null;
      setScore(parsedScore);

      await setDoc(doc(db, "aiProfileEvaluations", userId), {
        evaluationText: aiResponse,
        fundabilityScore: parsedScore,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("AI Evaluation Error:", error);
      setAiText("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleEvaluation} disabled={loading}>
        {loading ? "Evaluating..." : "Run Fundability Evaluation"}
      </button>
      {aiText && (
        <div>
          <h3>AI Fundability Evaluation</h3>
          <pre style={{ whiteSpace: "pre-wrap", background: "#f5f5f5", padding: "1rem" }}>{aiText}</pre>
        </div>
      )}
    </div>
  );
}
