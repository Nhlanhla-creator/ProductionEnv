"use client"

import { useState, useEffect, useRef } from "react"
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"
import { onAuthStateChanged, getAuth } from "firebase/auth"
import { X, ChevronRight, Info, FileText, TrendingUp, Download, Star, AlertCircle, CheckCircle } from "lucide-react"

const sendMessageToChatGPT = async (message, apiKey) => {
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
            content: 'You are an expert career advisor and internship coordinator specializing in student development and professional growth. Provide detailed, professional evaluations based on academic and professional performance.'
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

export const InternSummaryReportCard = ({ userId: propUserId, styles = {}, apiKey }) => {
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
    console.log("InternSummaryReportCard - propUserId:", propUserId);
    console.log("InternSummaryReportCard - current userId:", userId);
  }, [propUserId, userId]);

  const getScoreLevel = (score) => {
    if (score >= 90) return { level: "Outstanding", color: "#4CAF50" };
    if (score >= 80) return { level: "Excellent", color: "#8BC34A" };
    if (score >= 70) return { level: "Good", color: "#FF9800" };
    if (score >= 60) return { level: "Satisfactory", color: "#FF5722" };
    return { level: "Needs Improvement", color: "#F44336" };
  };

  // Function to save summary data to Firebase
  const saveSummaryToFirebase = async (userId, summaryData) => {
    try {
      const summaryRef = doc(db, "InternSummaryReports", userId);
      await setDoc(summaryRef, {
        ...summaryData,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });
      console.log("Intern summary saved to Firebase successfully");
    } catch (error) {
      console.error("Error saving intern summary to Firebase:", error);
    }
  };

  // Function to load summary data from Firebase
  const loadSummaryFromFirebase = async (userId) => {
    try {
      const summaryRef = doc(db, "InternSummaryReports", userId);
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
      console.error("Error loading intern summary from Firebase:", error);
      return null;
    }
  };

  // Function to check if ANY trigger is set in internProfiles
  const checkTriggerInternEvaluation = async (userId) => {
    try {
      const profileRef = doc(db, "internProfiles", userId);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const data = profileSnap.data();
        const hasTrigger = 
          data.triggerAcademicEvaluation === true ||
          data.triggerPresentationEvaluation === true ||
          data.triggerProfessionalSkillsEvaluation === true ||
          data.triggerWorkExperienceEvaluation === true;
        
        console.log("Trigger check result:", {
          triggerAcademicEvaluation: data.triggerAcademicEvaluation,
          triggerPresentationEvaluation: data.triggerPresentationEvaluation,
          triggerProfessionalSkillsEvaluation: data.triggerProfessionalSkillsEvaluation,
          triggerWorkExperienceEvaluation: data.triggerWorkExperienceEvaluation,
          hasAnyTrigger: hasTrigger
        });
        
        return hasTrigger;
      }
      return false;
    } catch (error) {
      console.error("Error checking intern triggers:", error);
      return false;
    }
  };

  // Function to reset ALL triggers
  const resetTriggers = async (userId) => {
    try {
      const profileRef = doc(db, "internProfiles", userId);
      await setDoc(profileRef, {
        triggerAcademicEvaluation: false,
        triggerPresentationEvaluation: false,
        triggerProfessionalSkillsEvaluation: false,
        triggerWorkExperienceEvaluation: false
      }, { merge: true });
      console.log("All intern triggers reset successfully");
    } catch (error) {
      console.error("Error resetting intern triggers:", error);
    }
  };

  // Handle authentication state
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

  // Main data fetching effect
  useEffect(() => {
    if (!userId || !apiKey) {
      console.log("No userId available, skipping data fetch");
      return;
    }

    console.log("Starting intern data fetch for userId:", userId);

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check if ANY trigger is set
        const shouldTriggerNew = await checkTriggerInternEvaluation(userId);

        if (shouldTriggerNew) {
          console.log("Trigger detected, waiting 5 seconds then generating new evaluation...");
          setIsGeneratingNew(true);

          // Wait 5 seconds to allow the individual evaluations to complete
          await new Promise(resolve => setTimeout(resolve, 5000));

          // Generate new evaluation
          await generateNewEvaluation(userId);

          // Reset ALL triggers
          await resetTriggers(userId);
          setIsGeneratingNew(false);
        } else {
          // Try to load existing data from Firebase first
          const existingSummary = await loadSummaryFromFirebase(userId);

          if (existingSummary && existingSummary.reportData) {
            console.log("Loading existing intern summary from Firebase");
            setReportData(existingSummary.reportData);
            setTopPriorities(existingSummary.topPriorities);
            setImprovementSummary(existingSummary.improvementSummary);
          } else {
            console.log("No existing intern summary found, generating new one");
            await generateNewEvaluation(userId);
          }
        }
      } catch (err) {
        console.error("Intern Data Fetch Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, apiKey]);

  // Generate new intern evaluation
  const generateNewEvaluation = async (userId) => {
    try {
      console.log("Generating new intern evaluation for userId:", userId);

      // Initialize an empty report data structure
      const newReportData = {
        generatedDate: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        overallScore: 0,
        internshipStatus: "Assessment Incomplete",
        academicScore: 0,
        presentationScore: 0,
        professionalSkillsScore: 0,
        workExperienceScore: 0,
        weightedAverageScore: 0,
        detailedScores: [],
        improvementSuggestions: [],
        structuredContent: {},
        aiEvaluations: {},
        missingSections: []
      };

      // Check what data we have available
      const availableData = {
        academic: false,
        presentation: false,
        professionalSkills: false,
        workExperience: false
      };

      // Fetch all evaluations using the userId as document ID
      const [academicDoc, presentationDoc, professionalDoc, workDoc] = await Promise.all([
        getDoc(doc(db, "aiAcademicEvaluation", userId)),
        getDoc(doc(db, "aiPresentationEvaluation", userId)),
        getDoc(doc(db, "aiProfessionalSkillsEvaluation", userId)),
        getDoc(doc(db, "aiWorkExperienceEvaluation", userId))
      ]);

      // Process academic evaluation data
      if (academicDoc.exists()) {
        availableData.academic = true;
        const academicData = academicDoc.data();
        newReportData.aiEvaluations.academic = academicData;
        newReportData.academicScore = academicData.evaluation?.score || academicData.score || 0;
        console.log("Academic evaluation found:", academicData);
      } else {
        newReportData.missingSections.push("Academic Evaluation");
        console.log("No academic evaluation found for user:", userId);
      }

      // Process presentation evaluation data
      if (presentationDoc.exists()) {
        availableData.presentation = true;
        const presentationData = presentationDoc.data();
        newReportData.aiEvaluations.presentation = presentationData;
        newReportData.presentationScore = presentationData.evaluation?.score || presentationData.score || 0;
        console.log("Presentation evaluation found:", presentationData);
      } else {
        newReportData.missingSections.push("Presentation Evaluation");
        console.log("No presentation evaluation found for user:", userId);
      }

      // Process professional skills evaluation data
      if (professionalDoc.exists()) {
        availableData.professionalSkills = true;
        const professionalData = professionalDoc.data();
        newReportData.aiEvaluations.professionalSkills = professionalData;
        newReportData.professionalSkillsScore = professionalData.evaluation?.score || professionalData.score || 0;
        console.log("Professional skills evaluation found:", professionalData);
      } else {
        newReportData.missingSections.push("Professional Skills Evaluation");
        console.log("No professional skills evaluation found for user:", userId);
      }

      // Process work experience evaluation data
      if (workDoc.exists()) {
        availableData.workExperience = true;
        const workData = workDoc.data();
        newReportData.aiEvaluations.workExperience = workData;
        newReportData.workExperienceScore = workData.evaluation?.score || workData.score || 0;
        console.log("Work experience evaluation found:", workData);
      } else {
        newReportData.missingSections.push("Work Experience Evaluation");
        console.log("No work experience evaluation found for user:", userId);
      }

      // Calculate weighted average
      const scores = [];
      if (availableData.academic) scores.push(newReportData.academicScore);
      if (availableData.presentation) scores.push(newReportData.presentationScore);
      if (availableData.professionalSkills) scores.push(newReportData.professionalSkillsScore);
      if (availableData.workExperience) scores.push(newReportData.workExperienceScore);

      if (scores.length > 0) {
        newReportData.weightedAverageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        newReportData.overallScore = newReportData.weightedAverageScore;
        newReportData.internshipStatus = getScoreLevel(newReportData.overallScore).level;
      }

      // Extract detailed scores from available content
      if (newReportData.aiEvaluations.academic?.evaluation?.content) {
        newReportData.detailedScores = [
          ...newReportData.detailedScores,
          ...extractScoresFromAcademicEvaluation(newReportData.aiEvaluations.academic.evaluation.content)
        ];
      }

      if (newReportData.aiEvaluations.presentation?.evaluation?.content) {
        newReportData.detailedScores = [
          ...newReportData.detailedScores,
          ...extractScoresFromPresentationEvaluation(newReportData.aiEvaluations.presentation.evaluation.content)
        ];
      }

      // Set improvement suggestions based on available data
      newReportData.improvementSuggestions = getInternImprovementSuggestions(newReportData.aiEvaluations);

      // If we're missing critical sections, add a general improvement suggestion
      if (newReportData.missingSections.length > 0) {
        newReportData.improvementSuggestions.push({
          category: "Complete Missing Evaluations",
          suggestions: [
            `The following evaluations are missing: ${newReportData.missingSections.join(', ')}.`,
            "Complete these evaluations for a more comprehensive analysis of your internship readiness."
          ]
        });
      }

      setReportData(newReportData);

      // Generate AI insights with whatever data we have
      if (Object.values(availableData).some(v => v)) {
        await generateInternAIInsights(newReportData, userId);
      } else {
        // If no data at all, use the basic fallback
        await generateBasicInternAIInsights(newReportData, userId);
      }

    } catch (error) {
      console.error("Error generating new intern evaluation:", error);
      throw error;
    }
  };

  // Basic AI insights when limited data is available
  const generateBasicInternAIInsights = async (reportData, userId) => {
    const fallbackPriorities = [
      {
        title: "Complete Academic Profile",
        description: "Fill out your academic background and achievements for comprehensive evaluation."
      },
      {
        title: "Develop Professional Skills",
        description: "Showcase your technical and soft skills relevant to your desired internship field."
      },
      {
        title: "Gain Practical Experience",
        description: "Seek out projects, volunteer work, or entry-level positions to build your experience portfolio."
      }
    ];

    setTopPriorities(fallbackPriorities);
    setImprovementSummary("### Complete Your Profile\n- Fill out all academic and professional sections\n- Complete skills assessments\n- Document any work or project experience\n\n### Next Steps\n- Complete academic evaluation\n- Submit professional skills assessment\n- Add presentation and work experience details");

    // Save basic summary to Firebase
    const summaryData = {
      reportData,
      topPriorities: fallbackPriorities,
      improvementSummary: "Basic evaluation pending complete profile setup.",
      userId
    };

    await saveSummaryToFirebase(userId, summaryData);
  };

  // Generate AI insights for intern evaluation
  const generateInternAIInsights = async (reportData, userId) => {
    if (!reportData || !reportData.aiEvaluations) return;

    const combinedText = `
Academic Evaluation:
${reportData.aiEvaluations.academic?.evaluation?.content || reportData.aiEvaluations.academic?.result || ""}

Presentation Evaluation:
${reportData.aiEvaluations.presentation?.evaluation?.content || reportData.aiEvaluations.presentation?.result || ""}

Professional Skills Evaluation:
${reportData.aiEvaluations.professionalSkills?.evaluation?.content || reportData.aiEvaluations.professionalSkills?.result || ""}

Work Experience Evaluation:
${reportData.aiEvaluations.workExperience?.evaluation?.content || reportData.aiEvaluations.workExperience?.result || ""}
    `.trim();

    setPrioritiesLoading(true);

    try {
      // Generate top priorities
      const priorityPrompt = `
You are an expert career advisor and internship coordinator specializing in student development. Based on the comprehensive intern evaluations provided below, identify the TOP 3 MOST CRITICAL PRIORITIES that this student needs to address immediately to improve their internship readiness and career prospects.

EVALUATIONS:
${combinedText}

RESPONSE FORMAT:
{
  "priorities": [
    { "title": "Priority 1", "description": "Short, specific action for career development." },
    { "title": "Priority 2", "description": "Short, specific action for career development." },
    { "title": "Priority 3", "description": "Short, specific action for career development." }
  ]
}

Respond only with valid JSON.
      `.trim();

      const prioritiesResponse = await sendMessageToChatGPT(priorityPrompt, apiKey);

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
        newTopPriorities = generateIntelligentInternFallback(reportData);
      }

      setTopPriorities(newTopPriorities);

      // Generate improvement summary
      const summaryPrompt = `
You are an expert career advisor and internship coordinator. You are given four evaluations for a student intern:
1. Academic Evaluation
2. Presentation Evaluation
3. Professional Skills Evaluation
4. Work Experience Evaluation

Each contains text describing the strengths and weaknesses. Your job is to summarize the **key areas of improvement**, grouped clearly under each of the above headings, in clean Markdown-style formatting.

Respond with a bullet-pointed summary using the following structure:

### Academic Evaluation
- [Improvement 1]
- [Improvement 2]

### Presentation Evaluation
- [Improvement 1]
- [Improvement 2]

### Professional Skills Evaluation
- [Improvement 1]
- [Improvement 2]

### Work Experience Evaluation
- [Improvement 1]
- [Improvement 2]

Keep it concise, professional, and actionable for career development.
      `.trim();

      const summaryResponse = await sendMessageToChatGPT(summaryPrompt + "\n\n" + combinedText, apiKey);
      setImprovementSummary(summaryResponse);

      // Save to Firebase
      const summaryData = {
        topPriorities: newTopPriorities,
        improvementSummary: summaryResponse,
        userId
      };

      await saveSummaryToFirebase(userId, summaryData);

    } catch (err) {
      console.error("Failed to generate intern AI insights:", err);
      setImprovementSummary("Unable to generate improvement summary at this time.");

      // Save what we have to Firebase anyway
      const summaryData = {
        reportData,
        topPriorities: generateIntelligentInternFallback(reportData),
        improvementSummary: "Unable to generate improvement summary at this time.",
        userId
      };

      await saveSummaryToFirebase(userId, summaryData);
    } finally {
      setPrioritiesLoading(false);
    }
  };

  const generateIntelligentInternFallback = (reportData) => {
    const fallbackPriorities = [];

    // Analyze scores to determine weak areas
    const scores = {
      academic: reportData.academicScore || 0,
      presentation: reportData.presentationScore || 0,
      professional: reportData.professionalSkillsScore || 0,
      work: reportData.workExperienceScore || 0,
      overall: reportData.overallScore || 0
    };

    // Find the lowest scoring areas
    const sortedScores = Object.entries(scores).sort(([, a], [, b]) => a - b);

    // Map score types to actionable priorities
    const priorityMap = {
      academic: {
        title: "Academic Excellence",
        description: "Strengthen your academic profile with relevant coursework, projects, and continuous learning in your field of interest."
      },
      presentation: {
        title: "Communication Skills",
        description: "Improve your presentation and public speaking abilities to effectively communicate ideas and showcase your work."
      },
      professional: {
        title: "Professional Development",
        description: "Develop essential professional skills including teamwork, problem-solving, and industry-specific technical competencies."
      },
      work: {
        title: "Practical Experience",
        description: "Gain hands-on experience through internships, projects, or volunteer work to build your professional portfolio."
      },
      overall: {
        title: "Overall Readiness",
        description: "Address fundamental gaps across academic, professional, and practical dimensions to improve internship readiness."
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
        title: "Networking Skills",
        description: "Build professional connections through networking events, LinkedIn optimization, and informational interviews."
      },
      {
        title: "Career Planning",
        description: "Develop clear career goals and a strategic plan for achieving them through targeted skill development."
      },
      {
        title: "Industry Knowledge",
        description: "Stay updated on industry trends, technologies, and best practices relevant to your desired career path."
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

  // Helper function to extract scores from academic evaluation
  const extractScoresFromAcademicEvaluation = (content) => {
    const scores = [];
    // Look for score patterns in academic evaluation
    const scoreRegex = /(\w+(?:\s+\w+)*):\s*(\d+(?:\.\d+)?)/gi;
    const matches = [...content.matchAll(scoreRegex)];
    
    matches.forEach(match => {
      scores.push({
        category: match[1],
        score: parseFloat(match[2]) * 10,
        maxScore: 100,
        rationale: `${match[1]} scored ${match[2]} out of 10`
      });
    });
    
    return scores;
  };

  // Helper function to extract scores from presentation evaluation
  const extractScoresFromPresentationEvaluation = (content) => {
    const scores = [];
    // Look for score patterns in presentation evaluation
    const scoreRegex = /(\w+(?:\s+\w+)*):\s*(\d+(?:\.\d+)?)\/10/gi;
    const matches = [...content.matchAll(scoreRegex)];
    
    matches.forEach(match => {
      scores.push({
        category: match[1],
        score: parseFloat(match[2]) * 10,
        maxScore: 100,
        rationale: `${match[1]} scored ${match[2]} out of 10`
      });
    });
    
    return scores;
  };

  // Helper function to extract improvement suggestions
  const getInternImprovementSuggestions = (aiEvaluations) => {
    const suggestions = [];

    // Academic improvements
    if (aiEvaluations.academic?.evaluation?.content) {
      const academicContent = aiEvaluations.academic.evaluation.content;
      const improvementSection = academicContent.match(/Improvement Areas:?(.*?)(?=Strengths|$)/is)?.[1];
      if (improvementSection) {
        suggestions.push({
          category: "Academic Improvements",
          suggestions: improvementSection.split('\n')
            .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•') || /^\d\./.test(line.trim()))
            .map(line => line.replace(/^[-\•\d\.]\s*/, '').trim())
            .filter(line => line.length > 0)
        });
      }
    }

    // Presentation improvements
    if (aiEvaluations.presentation?.evaluation?.content) {
      const presentationContent = aiEvaluations.presentation.evaluation.content;
      const improvementSection = presentationContent.match(/Areas for Improvement:?(.*?)(?=Strengths|$)/is)?.[1];
      if (improvementSection) {
        suggestions.push({
          category: "Presentation Improvements",
          suggestions: improvementSection.split('\n')
            .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•') || /^\d\./.test(line.trim()))
            .map(line => line.replace(/^[-\•\d\.]\s*/, '').trim())
            .filter(line => line.length > 0)
        });
      }
    }

    return suggestions.length > 0 ? suggestions : [
      {
        category: "General Career Development",
        suggestions: [
          "Enhance technical skills relevant to your field",
          "Develop professional communication abilities",
          "Build a portfolio of projects and achievements"
        ]
      }
    ];
  };

  const handleDownloadReport = () => {
    if (!reportData) return;

    const formatImprovementSummary = (summary) => {
      return summary
        .replace(/### (.*?)$/gm, '<h3 style="color: #8B6B61; font-size: 1.3rem; font-weight: 600; margin: 25px 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #A68A7B;">$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #8B6B61; font-weight: 600;">$1</strong>')
        .replace(/^- (.*?)$/gm, '<div style="margin: 10px 0; padding-left: 20px; position: relative; line-height: 1.6;"><span style="position: absolute; left: 0; color: #8B6B61; font-weight: bold;">•</span>$1</div>')
        .replace(/\n/g, '<br>');
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Internship Readiness Report</title>
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
            background: linear-gradient(135deg, #8B6B61 0%, #6B4E4E 100%);
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
            background: rgba(93, 64, 55, 0.1);
            color: #5D4037;
            border-radius: 20px;
            border: 1px solid rgba(93, 64, 55, 0.3);
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
            <div class="logo">🎓 BIG Intern Analytics</div>
            <h1 class="report-title">Internship Readiness Report</h1>
            <p class="report-date">Generated on ${reportData.generatedDate}</p>
          </div>

          <div class="content">
            <!-- Scores Overview -->
            <div class="section">
              <div class="scores-grid">
                <div class="score-card">
                  <div class="score-value">${reportData.overallScore}%</div>
                  <div class="score-label">Overall Readiness Score</div>
                </div>
                <div class="score-card">
                  <div class="score-value">${reportData.academicScore}</div>
                  <div class="score-label">Academic Evaluation</div>
                </div>
                <div class="score-card">
                  <div class="score-value">${reportData.presentationScore}</div>
                  <div class="score-label">Presentation Skills</div>
                </div>
                <div class="score-card">
                  <div class="score-value">${reportData.professionalSkillsScore}</div>
                  <div class="score-label">Professional Skills</div>
                </div>
                <div class="score-card">
                  <div class="score-value">${reportData.workExperienceScore}</div>
                  <div class="score-label">Work Experience</div>
                </div>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <span class="status-badge">Status: ${reportData.internshipStatus}</span>
              </div>
            </div>

            <!-- Key Improvement Areas -->
            <div class="section">
              <h2 class="section-title">
                <span style="display: inline-block; padding: 8px; background: #5D4037; border-radius: 8px; color: white;">📈</span>
                Career Development Recommendations
              </h2>
              
              <div class="improvement-content">
                ${improvementSummary ? formatImprovementSummary(improvementSummary) : '<p>Improvement recommendations are being generated...</p>'}
              </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center; padding-top: 30px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 0.9rem;">
              <p>This report was generated by BIG Intern Analytics on ${new Date().toLocaleDateString('en-GB', {
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
    link.download = `Internship-Readiness-Report-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div style={{ padding: 20, color: '#5D4037' }}>
      {isGeneratingNew ? "Generating new intern evaluation..." : "Loading intern summary report..."}
    </div>
  );

  if (error) return <div style={{ padding: 20, color: 'red' }}>Error: {error}</div>;
  if (!reportData) return <div style={{ padding: 20, color: '#5D4037' }}>No intern report data available</div>;

  return (
    <>
      {/* Compact Intern Summary Report Card - UPDATED COLOR SCHEME */}
     <div
  className="intern-summary-report-card"
   style={{
          background: `linear-gradient(145deg, #4a352f 0%, #7d5a50 100%)`,
          borderRadius: "20px",
          padding: "20px",
          color: "#f5f0e1",
          boxShadow: "0 12px 40px rgba(74, 53, 47, 0.4)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          border: `1px solid #7d5a50`,
          position: "relative",
          overflow:"visible",
          
        }}

        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(93, 64, 55, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(93, 64, 55, 0.3)';
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
                Internship Readiness Summary
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

        {/* Core Metrics */}
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
            Top 3 Development Priorities
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
              Analyzing development priorities...
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
          cursor: 'default',
          overflow: 'visible'
        }}
        onMouseEnter={(e) => {
          const tooltip = e.currentTarget.querySelector('.tooltip-content');
          if (tooltip) {
            tooltip.style.opacity = '1';
            tooltip.style.visibility = 'visible';
            tooltip.style.transform = 'translateY(8px)';
          }
        }}
        onMouseLeave={(e) => {
          const tooltip = e.currentTarget.querySelector('.tooltip-content');
          if (tooltip) {
            tooltip.style.opacity = '0';
            tooltip.style.visibility = 'hidden';
            tooltip.style.transform = 'translateY(0)';
          }
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
          {trimmedDescription}
        </p>

        {/* Tooltip that shows on hover */}
        <div 
          className="tooltip-content"
          style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            right: '0',
            backgroundColor: 'rgba(62, 39, 35, 0.98)',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.7rem',
            lineHeight: '1.4',
            zIndex: 1000,
            opacity: 0,
            visibility: 'hidden',
            transition: 'all 0.3s ease',
            border: '1px solid #8D6E63',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            transform: 'translateY(0)',
            marginTop: '8px'
          }}
        >
          <strong style={{ display: 'block', marginBottom: '6px', color: '#EFEBE9', fontSize: '0.75rem' }}>
            {priority.title}
          </strong>
          <span style={{ fontSize: '0.65rem', lineHeight: '1.4' }}>
            {priority.description}
          </span>
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
          View Full Report
        </button>
      </div>

      {/* Full Report Modal - UPDATED COLOR SCHEME */}
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
                    Internship Readiness Report
                  </h2>
                  <p style={{
                    fontSize: '1rem',
                    margin: 0,
                    opacity: 0.9,
                    fontWeight: '400'
                  }}>
                    Comprehensive AI-driven analysis and career development recommendations
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
                    Career Development Recommendations
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
                      Generating career development recommendations...
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