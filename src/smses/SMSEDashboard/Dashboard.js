"use client"

import { useState, useEffect, useRef } from "react"
import { DashboardHeader } from "./dashboard-header"
import { ApplicationTracker } from "./application-tracker"
import  {LegitimacyScoreCard } from "./legitimacy-score-card"
import { FundabilityScoreCard } from "./fundability-score-card"
import { ComplianceScoreCard } from "./compliance-score"
import { BigScoreCard } from "./big-score"
import { PISScoreCard } from "./pis-score"
import { LeadershipScoreCard } from "./leadership-score-card" // New import
import { CustomerReviewsCard } from "./customer-reviews-card"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"
import { X, ChevronRight, Info, Smile, Star, ShieldCheck, ChevronDown, ChevronUp, FileText, TrendingUp, AlertCircle, CheckCircle, Download, Calendar, Bus } from "lucide-react"
import "./Dashboard.css"


// Add this import at the top with your other imports
import { useApiKey } from "./callapi"

import { onAuthStateChanged, getAuth } from "firebase/auth"
import {
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { API_KEYS } from "../../API"

// const apiKey = API_KEYS.OPENAI;

const sendMessageToChatGPT = async (message,apiKey) => {
  const API_URL = 'https://api.openai.com/v1/chat/completions';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert business analyst specializing in fundability assessment. Provide detailed, professional evaluations based on the BIG Fundability Scorecard rubric.'
          },
          {
            role: 'user',
            content: message,
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);

      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenAI API key.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (response.status === 403) {
        throw new Error('Access denied. Please check your API key permissions.');
      } else {
        throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`);
      }
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenAI API');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('ChatGPT API Error:', error);
    throw error;
  }
};

// Summary Report Card Component - Updated with Firebase Integration
export const SummaryReportCard = ({ userId: propUserId, styles = {},apiKey }) => {
  const [userId, setUserId] = useState(propUserId || null);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [topPriorities, setTopPriorities] = useState([]);
  const [prioritiesLoading, setPrioritiesLoading] = useState(false);
  const [improvementSummary, setImprovementSummary] = useState("");
  const [isGeneratingNew, setIsGeneratingNew] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log("SummaryReportCard - propUserId:", propUserId);
    console.log("SummaryReportCard - current userId:", userId);
  }, [propUserId, userId]);

  const getScoreLevel = (score) => {
    if (score >= 85) return { level: "Highly Fundable", color: "#4CAF50" };
    if (score >= 70) return { level: "Fundable", color: "#8BC34A" };
    if (score >= 55) return { level: "Moderately Fundable", color: "#FF9800" };
    if (score >= 40) return { level: "Low Fundability", color: "#FF5722" };
    return { level: "Not Ready for Funding", color: "#F44336" };
  };

  // Function to save summary data to Firebase
  const saveSummaryToFirebase = async (userId, summaryData) => {
    try {
      const summaryRef = doc(db, "Aisummaryreports", userId);
      await setDoc(summaryRef, {
        ...summaryData,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });
      console.log("Summary saved to Firebase successfully");
    } catch (error) {
      console.error("Error saving summary to Firebase:", error);
    }
  };

  // Function to load summary data from Firebase
  const loadSummaryFromFirebase = async (userId) => {
    try {
      const summaryRef = doc(db, "Aisummaryreports", userId);
      const summarySnap = await getDoc(summaryRef);
      
      if (summarySnap.exists()) {
        const data = summarySnap.data();
        return {
          topPriorities: data.topPriorities || [],
          improvementSummary: data.improvementSummary || "",
          reportData: data.reportData || null,
          createdAt: data.createdAt,
          lastUpdated: data.lastUpdated
        };
      }
      return null;
    } catch (error) {
      console.error("Error loading summary from Firebase:", error);
      return null;
    }
  };

  // Function to check if trigger is set
  const checkTriggerFundabilityEvaluation = async (userId) => {
    try {
      const profileRef = doc(db, "universalProfiles", userId);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        const data = profileSnap.data();
        return data.triggerLegitimacyEvaluation === true;
      }
      return false;
    } catch (error) {
      console.error("Error checking trigger:", error);
      return false;
    }
  };

  // Function to reset trigger
  const resetTrigger = async (userId) => {
    try {
      const profileRef = doc(db, "universalProfiles", userId);
      await setDoc(profileRef, {
        triggerLegitimacyEvaluation: false
      }, { merge: true });
    } catch (error) {
      console.error("Error resetting trigger:", error);
    }
  };

  // Handle authentication state - Fixed to wait for proper auth
  useEffect(() => {
    if (propUserId) {
      setUserId(propUserId);
      return;
    }

    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user?.uid);
      if (user) {
        setUserId(user.uid);
      } else {
        setError("User not logged in");
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [propUserId]);

  // Main data fetching effect - Enhanced with better error handling
  useEffect(() => {
    if (!userId || !apiKey) {
      console.log("No userId available, skipping data fetch");
      return;
    }

    console.log("Starting data fetch for userId:", userId);

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check if trigger is set
        const shouldTriggerNew = await checkTriggerFundabilityEvaluation(userId);
        
        if (shouldTriggerNew) {
          console.log("Trigger detected, waiting 5 seconds then generating new evaluation...");
          setIsGeneratingNew(true);
          
          // Wait 5 seconds
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Generate new evaluation
          await generateNewEvaluation(userId);
          
          // Reset trigger
          await resetTrigger(userId);
          setIsGeneratingNew(false);
        } else {
          // Try to load existing data from Firebase first
          const existingSummary = await loadSummaryFromFirebase(userId);
          
          if (existingSummary && existingSummary.reportData) {
            console.log("Loading existing summary from Firebase");
            setReportData(existingSummary.reportData);
            setTopPriorities(existingSummary.topPriorities);
            setImprovementSummary(existingSummary.improvementSummary);
          } else {
            console.log("No existing summary found, generating new one");
            await generateNewEvaluation(userId);
          }
        }
      } catch (err) {
        console.error("Data Fetch Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId,apiKey]);

  // Enhanced generateNewEvaluation with better error handling and data validation
  const generateNewEvaluation = async (userId) => {
  try {
    console.log("Generating new evaluation for userId:", userId);

    // Initialize an empty report data structure
    const newReportData = {
      generatedDate: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      overallScore: 0,
      fundabilityStatus: "Assessment Incomplete",
      businessPlanScore: 0,
      pitchDeckScore: 0,
      profileEvaluationScore: 0,
      weightedAverageScore: 0,
      detailedScores: [],
      improvementSuggestions: [],
      structuredContent: {},
      aiEvaluations: {},
      missingSections: []
    };

    // Check what data we have available
    const availableData = {
      combinedEvaluations: false,
      fundability: false,
      legitimacy: false,
      profile: false,
      pitch: false,
      business: false
    };

    // Try to get combined evaluations first
    const combinedQuery = query(collection(db, "combinedEvaluations"), where("userId", "==", userId));
    const combinedSnap = await getDocs(combinedQuery);
    
    if (!combinedSnap.empty) {
      availableData.combinedEvaluations = true;
      const combinedData = combinedSnap.docs[0].data();
      newReportData.structuredContent = combinedData.structuredContent || {};
      newReportData.overallScore = combinedData.combinedScore || 0;
      newReportData.fundabilityStatus = combinedData.status || getScoreLevel(newReportData.overallScore).level;
    }

    // Fetch all other evaluations in parallel
    const [fundSnap, legitSnap, profileSnap, pitchSnap, businessSnap] = await Promise.all([
      getDoc(doc(db, "aiFundabilityEvaluations", userId)),
      getDoc(doc(db, "aiLegitimacyEvaluation", userId)),
      getDoc(doc(db, "universalProfiles", userId)),
      getDocs(query(collection(db, "aiPitchEvaluations"), where("userId", "==", userId))),
      getDocs(query(collection(db, "aiEvaluations"), where("userId", "==", userId)))
    ]);

    // Process fundability data 
        if (fundSnap.exists()) {
      availableData.fundability = true;
      newReportData.aiEvaluations.fundability = fundSnap.data();
    } else {
      newReportData.missingSections.push("Fundability Evaluation");
    }

    // Process legitimacy data
    if (legitSnap.exists()) {
      availableData.legitimacy = true;
      newReportData.aiEvaluations.legitimacy = legitSnap.data();
    } else {
      newReportData.missingSections.push("Legitimacy Evaluation");
    }

    // Process profile data
    if (profileSnap.exists()) {
      availableData.profile = true;
      const profileData = profileSnap.data();
      newReportData.aiEvaluations.profile = profileData;
      newReportData.overallScore = profileData.bigScore || newReportData.overallScore;
      newReportData.profileEvaluationScore = profileData.pisScore || 0;
      
      // If we have profile data but no combined score, use profile score as fallback
      if (!availableData.combinedEvaluations) {
        newReportData.overallScore = profileData.bigScore || 0;
        newReportData.fundabilityStatus = getScoreLevel(newReportData.overallScore).level;
      }
    } else {
      newReportData.missingSections.push("Business Profile");
    }

    // Process pitch data
    if (!pitchSnap.empty) {
      availableData.pitch = true;
      const pitchData = pitchSnap.docs[0].data();
      newReportData.aiEvaluations.pitch = pitchData;
      newReportData.pitchDeckScore = pitchData.evaluation?.score || 0;
    } else {
      newReportData.missingSections.push("Pitch Deck Evaluation");
    }

    // Process business plan data
    if (!businessSnap.empty) {
      availableData.business = true;
      const businessData = businessSnap.docs[0].data();
      newReportData.aiEvaluations.business = businessData;
      newReportData.businessPlanScore = businessData.evaluation?.score || 0;
    } else {
      newReportData.missingSections.push("Business Plan Evaluation");
    }

    // Calculate weighted average if we have multiple scores
    const scores = [];
    if (availableData.business) scores.push(newReportData.businessPlanScore);
    if (availableData.pitch) scores.push(newReportData.pitchDeckScore);
    if (availableData.profile) scores.push(newReportData.profileEvaluationScore);
    
    if (scores.length > 0) {
      newReportData.weightedAverageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      // Only use weighted average if we don't have a combined score
      if (!availableData.combinedEvaluations) {
        newReportData.overallScore = newReportData.weightedAverageScore;
        newReportData.fundabilityStatus = getScoreLevel(newReportData.overallScore).level;
      }
    }

    // Extract detailed scores from available structured content
    if (newReportData.structuredContent.businessPlan?.rawContent) {
      newReportData.detailedScores = [
        ...newReportData.detailedScores,
        ...extractScoresFromMarkdown(newReportData.structuredContent.businessPlan.rawContent)
      ];
    }

    if (newReportData.structuredContent.pitchDeck?.rawContent) {
      newReportData.detailedScores = [
        ...newReportData.detailedScores,
        ...extractScoresFromMarkdown(newReportData.structuredContent.pitchDeck.rawContent)
      ];
    }

    if (newReportData.structuredContent.profileEvaluation?.breakdown) {
      newReportData.detailedScores = [
        ...newReportData.detailedScores,
        ...Object.entries(newReportData.structuredContent.profileEvaluation.breakdown).map(([category, score]) => ({
          category,
          score,
          maxScore: getMaxScoreForProfileCategory(category),
          rationale: `${category} scored ${score} out of ${getMaxScoreForProfileCategory(category)}`
        }))
      ];
    }

    // Set improvement suggestions based on available data
    newReportData.improvementSuggestions = getImprovementSuggestions(newReportData.structuredContent);

    // If we're missing critical sections, add a general improvement suggestion
    if (newReportData.missingSections.length > 0) {
      newReportData.improvementSuggestions.push({
        category: "Complete Missing Evaluations",
        suggestions: [
          `The following evaluations are missing: ${newReportData.missingSections.join(', ')}.`,
          "Complete these evaluations for a more comprehensive analysis."
        ]
      });
    }

    setReportData(newReportData);

    // Generate AI insights with whatever data we have
    if (Object.values(availableData).some(v => v)) {
      await generateAIInsights(newReportData, userId);
    } else {
      // If no data at all, use the basic fallback
      await generateBasicAIInsights(newReportData, userId);
    }

  } catch (error) {
    console.error("Error generating new evaluation:", error);
    throw error;
  }
};

  // New function for basic AI insights when limited data is available
  const generateBasicAIInsights = async (reportData, userId) => {
    const fallbackPriorities = [
      {
        title: "Complete Business Profile",
        description: "Fill out all sections of your business profile to get comprehensive evaluation insights."
      },
      {
        title: "Upload Business Documents",
        description: "Upload your business plan and pitch deck for detailed AI analysis and recommendations."
      },
      {
        title: "Financial Documentation",
        description: "Provide financial statements and projections to improve your fundability assessment."
      }
    ];

    setTopPriorities(fallbackPriorities);
    setImprovementSummary("### Complete Your Profile\n- Fill out all business profile sections\n- Upload required documents\n- Provide financial information\n\n### Next Steps\n- Complete business plan evaluation\n- Submit pitch deck for review\n- Ensure all compliance requirements are met");

    // Save basic summary to Firebase
    const summaryData = {
      reportData,
      topPriorities: fallbackPriorities,
      improvementSummary: "Basic evaluation pending complete profile setup.",
      userId
    };

    await saveSummaryToFirebase(userId, summaryData);
  };

  // Rest of the component methods remain the same...
  const generateAIInsights = async (reportData, userId) => {
    if (!reportData || !reportData.aiEvaluations) return;

    const combinedText = `
AI Fundability Analysis:
${reportData.aiEvaluations.fundability?.result || ""}

AI Legitimacy Analysis:
${reportData.aiEvaluations.legitimacy?.result || ""}

AI Pitch Deck Evaluation:
${reportData.aiEvaluations.pitch?.evaluation?.content || ""}

AI Business Plan Evaluation:
${reportData.aiEvaluations.business?.evaluation?.content || ""}
    `.trim();

    setPrioritiesLoading(true);

    try {
      // Generate top priorities
      const priorityPrompt = `
You are an expert business analyst specializing in fundability assessment. Based on the comprehensive business evaluations provided below, identify the TOP 3 MOST CRITICAL PRIORITIES that this business needs to address immediately to improve their fundability and investment readiness.

EVALUATIONS:
${combinedText}

RESPONSE FORMAT:
{
  "priorities": [
    { "title": "Priority 1", "description": "Short, specific action." },
    { "title": "Priority 2", "description": "Short, specific action." },
    { "title": "Priority 3", "description": "Short, specific action." }
  ]
}

Respond only with valid JSON.
      `.trim();

      const prioritiesResponse = await sendMessageToChatGPT(priorityPrompt,apiKey);
      
      let newTopPriorities = [];
      try {
        const jsonMatch = prioritiesResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || [];
        const cleaned = jsonMatch[1] || prioritiesResponse;
        const parsed = JSON.parse(cleaned);

        if (parsed?.priorities?.length === 3) {
          newTopPriorities = parsed.priorities;
        } else {
          throw new Error("Invalid top priorities format");
        }
      } catch (err) {
        console.warn("Top priorities fallback:", err);
        newTopPriorities = generateIntelligentFallback(reportData);
      }

      setTopPriorities(newTopPriorities);

      // Generate improvement summary
      const summaryPrompt = `
You are an expert business analyst. You are given four evaluations for a company:
1. AI Fundability Analysis
2. AI Legitimacy Analysis
3. AI Pitch Deck Evaluation
4. AI Business Plan Evaluation

Each contains text describing the strengths and weaknesses. Your job is to summarize the **key areas of improvement**, grouped clearly under each of the above headings, in clean Markdown-style formatting.

Respond with a bullet-pointed summary using the following structure:

### AI Fundability Analysis
- [Improvement 1]
- [Improvement 2]

### AI Legitimacy Analysis
- [Improvement 1]
- [Improvement 2]

### AI Pitch Deck Evaluation
- [Improvement 1]
- [Improvement 2]

### AI Business Plan Evaluation
- [Improvement 1]
- [Improvement 2]

Keep it concise, professional, and actionable.
      `.trim();

      const summaryResponse = await sendMessageToChatGPT(summaryPrompt + "\n\n" + combinedText,apiKey);
      setImprovementSummary(summaryResponse);

      // Save to Firebase
      const summaryData = {
        topPriorities: newTopPriorities,
        improvementSummary: summaryResponse,
        userId
      };

      await saveSummaryToFirebase(userId, summaryData);

    } catch (err) {
      console.error("Failed to generate AI insights:", err);
      setImprovementSummary("Unable to generate improvement summary at this time.");
      
      // Save what we have to Firebase anyway
      const summaryData = {
        reportData,
        topPriorities: generateIntelligentFallback(reportData),
        improvementSummary: "Unable to generate improvement summary at this time.",
        userId
      };
      
      await saveSummaryToFirebase(userId, summaryData);
    } finally {
      setPrioritiesLoading(false);
    }
  };

  const generateIntelligentFallback = (reportData) => {
    const fallbackPriorities = [];

    // Analyze scores to determine weak areas
    const scores = {
      business: reportData.businessPlanScore || 0,
      pitch: reportData.pitchDeckScore || 0,
      profile: reportData.profileEvaluationScore || 0,
      overall: reportData.overallScore || 0
    };

    // Find the lowest scoring areas
    const sortedScores = Object.entries(scores).sort(([, a], [, b]) => a - b);

    // Map score types to actionable priorities
    const priorityMap = {
      business: {
        title: "Business Strategy",
        description: "Strengthen your business plan with detailed market analysis, financial projections, and operational strategy to demonstrate viability to investors."
      },
      pitch: {
        title: "Pitch Presentation",
        description: "Improve your pitch deck with compelling storytelling, clear value proposition, and strong financial metrics to capture investor interest."
      },
      profile: {
        title: "Company Profile",
        description: "Enhance your company profile by showcasing team expertise, operational achievements, and governance structure to build investor confidence."
      },
      overall: {
        title: "Overall Readiness",
        description: "Address fundamental business readiness issues across planning, presentation, and operational capabilities to improve fundability."
      }
    };

    // Generate priorities based on lowest scores
    for (let i = 0; i < Math.min(3, sortedScores.length); i++) {
      const [scoreType] = sortedScores[i];
      if (priorityMap[scoreType]) {
        fallbackPriorities.push(priorityMap[scoreType]);
      }
    }

    // Fill remaining slots with common priorities if needed
    const commonPriorities = [
      {
        title: "Financial Modeling",
        description: "Develop comprehensive financial projections with realistic assumptions and clear path to profitability to meet investor requirements."
      },
      {
        title: "Market Validation",
        description: "Provide concrete evidence of market demand through customer testimonials, pilot programs, or pre-orders to reduce investment risk."
      },
      {
        title: "Competitive Edge",
        description: "Clearly articulate your unique value proposition and sustainable competitive advantages to differentiate from alternatives."
      }
    ];

    while (fallbackPriorities.length < 3) {
      const remaining = commonPriorities.find(cp =>
        !fallbackPriorities.some(fp => fp.title === cp.title)
      );
      if (remaining) {
        fallbackPriorities.push(remaining);
      } else {
        break;
      }
    }

    return fallbackPriorities.slice(0, 3);
  };

  // Helper function to extract scores from markdown content
  const extractScoresFromMarkdown = (markdown) => {
    const scoreRegex = /\| (.+?) \| (\d) \|/g;
    const matches = [...markdown.matchAll(scoreRegex)];
    return matches.map(match => ({
      category: match[1],
      score: parseInt(match[2]) * 20, // Convert 0-5 scale to 0-100
      maxScore: 100,
      rationale: `${match[1]} scored ${parseInt(match[2])} out of 5`
    }));
  };

  // Helper function to get max score for profile categories
  const getMaxScoreForProfileCategory = (category) => {
    const maxScores = {
      leadership: 15,
      financialReadiness: 5,
      financialStrength: 5,
      operationalStrength: 15,
      guarantees: 10,
      impact: 10,
      governance: 15
    };
    return maxScores[category] || 5;
  };

  // Helper function to extract improvement suggestions
  const getImprovementSuggestions = (structuredContent) => {
    const suggestions = [];

    // Business plan improvements
    if (structuredContent.businessPlan?.rawContent) {
      const businessPlanContent = structuredContent.businessPlan.rawContent;
      const improvementSection = businessPlanContent.match(/### 3\. Improvement Suggestions.*?### 4/s)?.[0];
      if (improvementSection) {
        suggestions.push({
          category: "Business Plan Improvements",
          suggestions: improvementSection.split('\n')
            .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
            .map(line => line.replace(/^[-\•]\s*/, '').trim())
        });
      }
    }

    // Pitch deck improvements
    if (structuredContent.pitchDeck?.rawContent) {
      const pitchDeckContent = structuredContent.pitchDeck.rawContent;
      const improvementSection = pitchDeckContent.match(/### 4\. Key Improvement Suggestions.*?### 5/s)?.[0];
      if (improvementSection) {
        suggestions.push({
          category: "Pitch Deck Improvements",
          suggestions: improvementSection.split('\n')
            .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
            .map(line => line.replace(/^[-\•]\s*/, '').trim())
        });
      }
    }

    // Profile evaluation improvements
    if (structuredContent.profileEvaluation?.summaryRecommendation) {
      suggestions.push({
        category: "Profile Evaluation",
        suggestions: [structuredContent.profileEvaluation.summaryRecommendation]
      });
    }

    return suggestions.length > 0 ? suggestions : [
      {
        category: "General Improvements",
        suggestions: [
          "Refine executive summary",
          "Add detailed projections",
          "Clarify team strengths"
        ]
      }
    ];
  };

  const handleDownloadReport = () => {
    if (!reportData) return;

    const formatImprovementSummary = (summary) => {
      return summary
        .replace(/### (.*?)$/gm, '<h3 style="color: #5D4037; font-size: 1.3rem; font-weight: 600; margin: 25px 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #8D6E63;">$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #5D4037; font-weight: 600;">$1</strong>')
        .replace(/^- (.*?)$/gm, '<div style="margin: 10px 0; padding-left: 20px; position: relative; line-height: 1.6;"><span style="position: absolute; left: 0; color: #5D4037; font-weight: bold;">•</span>$1</div>')
        .replace(/\n/g, '<br>');
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BIG Fundability Report</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
            padding: 20px;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #5D4037 0%, #3E2723 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          
          .logo {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 10px;
            opacity: 0.9;
          }
          
          .report-title {
            font-size: 2.2rem;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
          }
          
          .report-date {
            font-size: 1rem;
            opacity: 0.9;
            font-weight: 400;
          }
          
          .content {
            padding: 40px 30px;
          }
          
          .scores-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
          }
          
          .score-card {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 12px;
            border: 1px solid #e9ecef;
          }
          
          .score-value {
            font-size: 2rem;
            font-weight: 700;
            color: #5D4037;
            margin-bottom: 5px;
          }
          
          .score-label {
            font-size: 0.9rem;
            color: #6c757d;
            font-weight: 500;
          }
          
          .section {
            margin-bottom: 40px;
          }
            
          
          .section-title {
            font-size: 1.8rem;
            color: #3E2723;
            margin-bottom: 20px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          
          .improvement-content {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 30px;
            border: 1px solid #e9ecef;
            line-height: 1.7;
          }
          
          .status-badge {
            display: inline-block;
            padding: 8px 16px;
            background: rgba(255, 152, 0, 0.1);
            color: #ff9800;
            border-radius: 20px;
            border: 1px solid rgba(255, 152, 0, 0.3);
            font-weight: 600;
            font-size: 0.9rem;
          }
          
          @media print {
            body { padding: 0; background: white; }
            .container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📊 BIG Analytics</div>
            <h1 class="report-title">Business Evaluation Summary Report</h1>
            <p class="report-date">Generated on ${reportData.generatedDate}</p>
          </div>

          <div class="content">
            <!-- Scores Overview -->
            <div class="section">
              <div class="scores-grid">
                <div class="score-card">
                  <div class="score-value">${reportData.overallScore}%</div>
                  <div class="score-label">Overall BIG Score</div>
                </div>
                <div class="score-card">
                  <div class="score-value">${reportData.businessPlanScore}</div>
                  <div class="score-label">Business Plan</div>
                </div>
                <div class="score-card">
                  <div class="score-value">${reportData.pitchDeckScore}</div>
                  <div class="score-label">Pitch Deck</div>
                </div>
                <div class="score-card">
                  <div class="score-value">${reportData.profileEvaluationScore}</div>
                  <div class="score-label">Profile Assessment</div>
                </div>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <span class="status-badge">Status: ${reportData.fundabilityStatus}</span>
              </div>
            </div>

            <!-- Key Improvement Areas -->
            <div class="section">
              <h2 class="section-title">
                <span style="display: inline-block; padding: 8px; background: #5D4037; border-radius: 8px; color: white;">📈</span>
                Key Improvement Areas
              </h2>
              
              <div class="improvement-content">
                ${improvementSummary ? formatImprovementSummary(improvementSummary) : '<p>Improvement recommendations are being generated...</p>'}
              </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center; padding-top: 30px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 0.9rem;">
              <p>This report was generated by BIG Analytics on ${new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BIG-Fundability-Report-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div style={{ padding: 20, color: '#5D4037' }}>
      {isGeneratingNew ? "Generating new summary evaluation..." : "Loading summary report..."}
    </div>
  );

  if (error) return <div style={{ padding: 20, color: 'red' }}>Error: {error}</div>;
  if (!reportData) return <div style={{ padding: 20, color: '#5D4037' }}>No report data available</div>;

  return (
    <>
      {/* Compact Summary Report Card */}
      <div
        className="summary-report-card"
        style={{
          background: 'linear-gradient(135deg, #3E2723 0%, #5D4037 50%, #4E342E 100%)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(62, 39, 35, 0.3)',
          border: '1px solid #6D4C41',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          minHeight: '280px',
          color: 'white',
          ...styles
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(62, 39, 35, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(62, 39, 35, 0.3)';
        }}
      >
        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #8D6E63, #A1887F, #BCAAA4)'
        }} />

        <div style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '100px',
          height: '100px',
          background: 'radial-gradient(circle, rgba(141, 110, 99, 0.2) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              padding: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
            }}>
              <FileText size={24} color="#D7CCC8" />
            </div>
            <div>
              <h3 style={{
                color: '#EFEBE9',
                fontSize: '1.3rem',
                fontWeight: '700',
                margin: '0 0 4px 0'
              }}>
               BIG Score Summary Analysis
              </h3>
              <p style={{
                color: '#BCAAA4',
                fontSize: '0.85rem',
                margin: 0,
                opacity: 0.9
              }}>
                {reportData.generatedDate}
              </p>
            </div>
          </div>

        
        </div>

        {/* Core Metrics - Updated */}
        <div style={{
          marginBottom: '20px'
        }}>
          <h4 style={{
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#EFEBE9',
            margin: '0 0 16px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              padding: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '6px'
            }}>
              🎯
            </span>
            Top 3 Priorities
          </h4>

          {prioritiesLoading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '20px',
              color: '#BCAAA4'
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTop: '2px solid #EFEBE9',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginRight: '8px'
              }}></div>
              Analyzing priorities...
            </div>
          ) : (
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '12px',
  textAlign: 'left'
}}>
  {topPriorities.map((priority, index) => {
  const trimmedDescription = priority.description.includes(',')
    ? priority.description.split(',')[0].trim() + "..."
    : priority.description.length > 100
      ? priority.description.slice(0, 97).trim() + "..."
      : priority.description;

  return (
   <div
  key={index}
  className="priority-card"
  style={{
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '14px 12px',
    minHeight: '90px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    cursor: 'default'
  }}
>
  <h4 style={{ color: '#EFEBE9', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>
    {priority.title}
  </h4>
  <p style={{
    fontSize: '0.7rem',
    color: '#D7CCC8',
    lineHeight: '1.3',
    margin: 0,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }}>
    {priority.description}
  </p>

  <div className="tooltip-content">
    <strong>{priority.title}</strong><br />
    {priority.description}
  </div>
</div>

  );
})}

</div>



          )}
        </div>


        {/* View Full Report Button */}
        <button
          onClick={() => setShowReportModal(true)}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #8D6E63, #A1887F)',
            border: 'none',
            color: 'white',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '12px 24px',
            borderRadius: '12px',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 16px rgba(141, 110, 99, 0.3)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 24px rgba(141, 110, 99, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 16px rgba(141, 110, 99, 0.3)';
          }}
        >
          <FileText size={18} />
          View Full Summary
        </button>
      </div>

      {/* Improved Full Report Modal */}
      {showReportModal && reportData && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            overflowY: 'auto',
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowReportModal(false);
            }
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
              animation: 'modalFadeIn 0.4s ease-out',
              position: 'relative',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #5D4037 0%, #3E2723 100%)',
              color: 'white',
              padding: '32px',
              position: 'relative'
            }}>
              <button
                onClick={() => setShowReportModal(false)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '20px'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.transform = 'scale(1.1)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                ×
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  padding: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px'
                }}>
                  <FileText size={32} color="white" />
                </div>
                <div>
                  <h2 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    margin: '0 0 8px 0',
                    letterSpacing: '-0.5px'
                  }}>
                    Business Evaluation Summary
                  </h2>
                  <p style={{
                    fontSize: '1rem',
                    margin: 0,
                    opacity: 0.9,
                    fontWeight: '400'
                  }}>
                    Comprehensive AI-driven analysis and improvement recommendations
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{
              padding: '40px',
              overflowY: 'auto',
              flex: 1
            }}>
              {/* Improvement Summary Section */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '32px',
                border: '1px solid #dee2e6',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '24px'
                }}>
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#5D4037',
                    borderRadius: '12px'
                  }}>
                    <TrendingUp size={24} color="white" />
                  </div>
                  <h3 style={{
                    fontSize: '1.5rem',
                    color: '#3E2723',
                    margin: 0,
                    fontWeight: '600'
                  }}>
                    Key Improvement Areas
                  </h3>
                </div>

                {improvementSummary ? (
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    borderRadius: '12px',
                    padding: '24px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div
                      style={{
                        fontSize: '0.95rem',
                        lineHeight: '1.7',
                        color: '#333',
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                      }}
                      dangerouslySetInnerHTML={{
                        __html: improvementSummary
                          .replace(/### (.*?)$/gm, '<h4 style="color: #5D4037; font-size: 1.1rem; font-weight: 600; margin: 20px 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #8D6E63;">$1</h4>')
                          .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #5D4037; font-weight: 600;">$1</strong>')
                          .replace(/^- (.*?)$/gm, '<div style="margin: 8px 0; padding-left: 16px; position: relative;"><span style="position: absolute; left: 0; color: #5D4037; font-weight: bold;">•</span>$1</div>')
                          .replace(/\n/g, '<br>')
                      }}
                    />
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '40px',
                    color: '#6c757d'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid #5D4037',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Generating improvement recommendations...
                    </div>
                  </div>
                )}
              </div>

              {/* Download Button */}
              <div style={{
                textAlign: 'center',
                marginTop: '32px'
              }}>
                <button
                  onClick={handleDownloadReport}
                  style={{
                    background: 'linear-gradient(135deg, #5D4037, #3E2723)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '16px 32px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 16px rgba(93, 64, 55, 0.3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 24px rgba(93, 64, 55, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 16px rgba(93, 64, 55, 0.3)';
                  }}
                >
                  <Download size={20} />
                  Download Full Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export function Dashboard() {
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("Funders")
  const [showDashboardPopup, setShowDashboardPopup] = useState(false)
  const [applicationRefreshKey, setApplicationRefreshKey] = useState(0)
  const [currentDashboardStep, setCurrentDashboardStep] = useState(0)
  const [authChecked, setAuthChecked] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Score states for BIG Score calculation - Added leadershipScore
  const [complianceScore, setComplianceScore] = useState(0)
  const [legitimacyScore, setLegitimacyScore] = useState(0)
  const [leadershipScore, setLeadershipScore] = useState(0) // New state
  const [fundabilityScore, setFundabilityScore] = useState(0)
  const [pisScore, setPisScore] = useState(0)
const apiKey = API_KEYS.OPENAI;
  const user = auth.currentUser
  const userName = user ? user.email : "User"

  const dashboardSteps = [
    {
      title: "Welcome to Your Dashboard",
      content:
        "This is your central hub for tracking applications, viewing matches, and monitoring your business metrics.",
      icon: "🏠",
    },
    {
      title: "Application Tracker",
      content:
        "Track the status of all your applications in one place. See which stage each application is in and what's next.",
      icon: "📊",
    },
    {
      title: "Business Metrics",
      content:
        "Monitor your BIG Score components: Compliance, Legitimacy, Leadership, Fundability, PIS Score and overall BIG Score to understand how your business is perceived.",
      icon: "📈",
    },
    {
      title: "Customer Reviews",
      content: "See what customers are saying about your business and track your reputation in the marketplace.",
      icon: "📅",
    },
  ]

  const styles = {
    primaryBrown: "#5D4037",
    lightBrown: "#8D6E63",
    darkBrown: "#3E2723",
    accentBrown: "#A67C52",
    paleBrown: "#D7CCC8",
    backgroundBrown: "#EFEBE9",
  }

  // Add/remove body class to prevent scrolling when modal is open
  useEffect(() => {
    if (showDashboardPopup) {
      document.body.classList.add('modal-open');
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.classList.remove('modal-open');
      document.body.style.position = '';
      document.body.style.width = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [showDashboardPopup]);

  const getUserSpecificKey = (baseKey) => {
    const userId = auth.currentUser?.uid
    return userId ? `${baseKey}_${userId}` : baseKey
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true)
      }
      setAuthChecked(true)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return

    const fetchProfileData = async () => {
      try {
        const userId = auth.currentUser?.uid
        if (!userId) {
          console.error("User not logged in")
          setLoading(false)
          return
        }

        const docRef = doc(db, "universalProfiles", userId)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          setProfileData({ id: userId, formData: docSnap.data() })
        } else {
          console.error("No profile found")
        }

        const hasSeenDashboardPopup = localStorage.getItem(getUserSpecificKey("hasSeenDashboardPopup")) === "true"
        if (!hasSeenDashboardPopup) {
          setShowDashboardPopup(true)
        }

        setLoading(false)
      } catch (err) {
        console.error("Error fetching profile data:", err)
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [isAuthenticated])

  const handleNextDashboardStep = () => {
    if (currentDashboardStep < dashboardSteps.length - 1) {
      setCurrentDashboardStep(currentDashboardStep + 1)
    } else {
      handleCloseDashboardPopup()
    }
  }

  const handleCloseDashboardPopup = () => {
    setShowDashboardPopup(false)
    localStorage.setItem(getUserSpecificKey("hasSeenDashboardPopup"), "true")
  }

  const handleApplicationSubmitted = () => {
    setApplicationRefreshKey((prev) => prev + 1)
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading dashboard...</div>
  }

  return (
    <div className="dashboard-container bg-[#EFEBE9]">
      {showDashboardPopup && (
        <div className="popup-overlay">
          <div className="welcome-popup dashboard-popup">
            <button className="close-popup" onClick={handleCloseDashboardPopup}>
              <X size={24} />
            </button>
            <div className="popup-content">
              <div className="popup-icon">{dashboardSteps[currentDashboardStep].icon}</div>
              <h2>{dashboardSteps[currentDashboardStep].title}</h2>
              <p>{dashboardSteps[currentDashboardStep].content}</p>
              <div className="popup-progress">
                {dashboardSteps.map((_, index) => (
                  <div key={index} className={`progress-dot ${index === currentDashboardStep ? "active" : ""}`} />
                ))}
              </div>
              <div className="popup-buttons">
                <button className="btn btn-secondary" onClick={handleCloseDashboardPopup}>Close</button>
                {currentDashboardStep < dashboardSteps.length - 1 ? (
                  <button className="btn btn-primary" onClick={handleNextDashboardStep}>
                    Next <ChevronRight size={16} />
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={handleCloseDashboardPopup}>Get Started</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="content">
        <main className="dashboard-main">
          <DashboardHeader userName={userName} />

          {/* Top Row - Application Tracker (full width) */}
          <section className="tracker-section" style={{ marginBottom: '20px' }}>
            <ApplicationTracker styles={styles} userId={profileData?.id} />
          </section>

          {/* Row 1 - BIG Score, Customer Reviews, and wider Summary Report */}
          <section className="big-score-reviews-row" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 2fr', // BIG Score (1 unit), Customer Reviews (1 unit), Summary Report (2 units)
            gap: '20px',
            marginBottom: '20px'
          }}>
            <BigScoreCard
              styles={styles}
              profileData={profileData}
              complianceScore={complianceScore}
              legitimacyScore={legitimacyScore}
              leadershipScore={leadershipScore} // Added leadershipScore prop
              fundabilityScore={fundabilityScore}
              pisScore={pisScore}
              onScoreUpdate={score => console.log("Updated BIG Score:", score)}
            />

            <CustomerReviewsCard styles={styles} />

               {apiKey && (
  <SummaryReportCard 
    styles={styles} 
    userId={profileData?.id} 
    apiKey={apiKey} 
  />
)}
 {!apiKey && (
            <section className="individual-scores-row" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '20px',
              marginBottom: '20px'
            }}>
          
                <div style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #faf8f6 100%)',
                  borderRadius: '20px',
                  padding: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '200px',
                  border: '1px solid #e8ddd6'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#8d6e63'
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      border: '3px solid #d7ccc8',
                      borderTop: '3px solid #8d6e63',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <span style={{ fontSize: '12px', fontWeight: '500' }}>Loading...</span>
                  </div>
                </div>
             
            </section>
          )}
          </section>



         {apiKey && (
            <section className="individual-scores-row" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '20px',
              marginBottom: '20px'
            }}>
              <ComplianceScoreCard
                styles={styles}
                profileData={profileData?.formData}
                onScoreUpdate={setComplianceScore}
                apiKey={apiKey}
              />

              <LegitimacyScoreCard
                styles={styles}
                profileData={profileData?.formData}
                onScoreUpdate={setLegitimacyScore}
                apiKey={apiKey}
              />

              <LeadershipScoreCard
                styles={styles}
                profileData={profileData?.formData}
                onScoreUpdate={setLeadershipScore}
                apiKey={apiKey}
              />

              <PISScoreCard
                styles={styles}
                profileData={profileData?.formData}
                onScoreUpdate={setPisScore}
                apiKey={apiKey}
              />

              <FundabilityScoreCard
                profileData={profileData?.formData}
                userId={profileData?.id}
                onScoreUpdate={setFundabilityScore}
                apiKey={apiKey}
              />
            </section>
          )}

          {/* Loading indicator while API key is being fetched */}
          {!apiKey && (
            <section className="individual-scores-row" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '20px',
              marginBottom: '20px'
            }}>
              {[...Array(5)].map((_, index) => (
                <div key={index} style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #faf8f6 100%)',
                  borderRadius: '20px',
                  padding: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '200px',
                  border: '1px solid #e8ddd6'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#8d6e63'
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      border: '3px solid #d7ccc8',
                      borderTop: '3px solid #8d6e63',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <span style={{ fontSize: '12px', fontWeight: '500' }}>Loading...</span>
                  </div>
                </div>
              ))}
            </section>
          )}
        </main>
      </div>

      {/* Additional CSS for responsive design - UPDATED for 5 cards */}
      <style jsx>{`
        /* Prevent body scroll when modal is open */
        body.modal-open {
          overflow: hidden;
          position: fixed;
          width: 100%;
        }

        /* Summary Report Card Specific Styles */
        .summary-report-card {
          min-height: 400px;
        }

        /* Enhanced z-index and interaction handling */
        .score-card-wrapper {
          transition: transform 0.2s ease;
          position: relative;
          z-index: 1;
          isolation: isolate;
        }
        .priority-card {
  position: relative;
}

.priority-card:hover .tooltip-content {
  opacity: 1;
  visibility: visible;
  transform: translateY(0px);
  z-index: 99;
}
.tooltip-content {
  position: absolute;
  bottom: 120%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #3E2723;
  color: #EFEBE9;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.75rem;
  max-width: 240px;
  width: max-content;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
  white-space: normal;
  line-height: 1.4;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.25s ease, transform 0.25s ease;
  z-index: 1000;
}

.priority-card:hover .tooltip-content {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(-6px);
}


        .score-card-wrapper:hover {
          transform: translateY(-2px);
          z-index: 50;
        }

        /* Ensure buttons are always clickable with higher specificity */
        .score-card-wrapper .fun-button,
        .score-card-wrapper button,
        .score-card-wrapper .text-center {
          position: relative;
          z-index: 999 !important;
          pointer-events: auto !important;
        }

        /* Enhanced tooltip positioning and interaction */
        .score-tooltip {
          animation: fadeInUp 0.3s ease;
          z-index: 100 !important;
          pointer-events: none !important;
          user-select: none;
        }

        /* Prevent tooltip from interfering with buttons */
        .score-card-wrapper .fun-button:hover ~ .score-tooltip,
        .score-card-wrapper button:hover ~ .score-tooltip,
        .score-card-wrapper .text-center:hover ~ .score-tooltip {
          display: none !important;
        }

        .explanation-card {
          transition: all 0.3s ease;
          position: relative;
          z-index: 1;
        }

        .explanation-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(141, 110, 99, 0.3) !important;
          z-index: 2;
        }

        /* Modal improvements */
        .modal-overlay {
          z-index: 9999;
          backdrop-filter: blur(4px);
        }

        .modal-content {
          z-index: 10000;
        }

        /* Spinning animation for loading indicator */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes fadeInUp {
          from { 
            opacity: 0; 
            transform: translateX(-50%) translateY(10px); 
          }
          to { 
            opacity: 1; 
            transform: translateX(-50%) translateY(0); 
          }
        }

        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .modal-content {
          animation: modalFadeIn 0.4s ease-out;
        }

        @media (max-width: 1400px) {
          .individual-scores-row {
            grid-template-columns: repeat(3, 1fr) !important; /* 3 columns on smaller desktops */
          }
        }

        @media (max-width: 1200px) {
          .big-score-reviews-row {
            grid-template-columns: 1fr 2fr !important; /* Stack BIG Score and Customer Reviews, keep Summary Report wider */
          }
          
          .individual-scores-row {
            grid-template-columns: repeat(3, 1fr) !important; /* 3 columns on tablets */
          }
        }

        @media (max-width: 1024px) {
          .big-score-reviews-row {
            grid-template-columns: repeat(2, 1fr) !important; /* Two columns on tablets */
          }
          
          .summary-report-card {
            grid-column: 1 / -1; /* Summary Report spans full width on tablets */
          }
          
          .individual-scores-row {
            grid-template-columns: repeat(2, 1fr) !important; /* 2 columns on smaller tablets */
          }

          .explanation-card {
            padding: 20px !important;
          }

          .explanation-title {
            font-size: 1.1rem !important;
          }

          .explanation-text {
            font-size: 0.9rem !important;
          }
        }
        
        @media (max-width: 768px) {
          .big-score-reviews-row,
          .individual-scores-row {
            grid-template-columns: 1fr !important; /* Single column on mobile */
          }

          .summary-report-card {
            grid-column: 1;
            min-height: 350px;
          }

          .score-tooltip {
            width: 280px !important;
            font-size: 11px !important;
            padding: 12px 14px !important;
            max-height: 250px !important;
          }

          .explanation-card {
            padding: 18px !important;
          }

          .explanation-title {
            font-size: 1rem !important;
          }

          .explanation-text {
            font-size: 0.85rem !important;
          }

          .view-more-btn {
            padding: 10px 16px !important;
            font-size: 0.8rem !important;
          }

          /* Modal adjustments for mobile */
          .modal-content {
            max-width: 95vw !important;
            max-height: 95vh !important;
            padding: 20px !important;
          }
        }

        @media (max-width: 480px) {
          .summary-report-card {
            padding: 18px !important;
            min-height: 320px;
          }

          .summary-report-card h3 {
            font-size: 1.1rem !important;
          }

          .score-tooltip {
            width: 250px !important;
            font-size: 10px !important;
            padding: 10px 12px !important;
            max-height: 200px !important;
          }

          .explanation-card {
            padding: 16px !important;
          }

          .explanation-title {
            font-size: 0.95rem !important;
          }

          .explanation-text {
            font-size: 0.8rem !important;
          }

          .modal-content {
            padding: 16px !important;
          }

          .modal-content h2 {
            font-size: 1.4rem !important;
          }

          .modal-content h3 {
            font-size: 1.1rem !important;
          }
        }
      `}</style>
    </div>
  )
}