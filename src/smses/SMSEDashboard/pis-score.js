"use client"

import { useState, useEffect } from "react";
import { ChevronDown, RefreshCw, AlertCircle, CheckCircle, TrendingUp, Calculator } from 'lucide-react';
import { db, auth } from "../../firebaseConfig";
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { API_KEYS } from '../../API';
import { getFunctions, httpsCallable } from "firebase/functions";

export function PISScoreCard({ styles, profileData, onScoreUpdate, apiKey }) {
  const [showModal, setShowModal] = useState(false);
  const [pisScore, setPisScore] = useState(0);
  const [governanceScore, setGovernanceScore] = useState(0);
  const [scoreBreakdown, setScoreBreakdown] = useState([]);
  const [aiEvaluationResult, setAiEvaluationResult] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState('');
  const [showAboutScore, setShowAboutScore] = useState(false);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const [governanceStage, setGovernanceStage] = useState("");
  const [governanceRecommendation, setGovernanceRecommendation] = useState("");
  const [triggeredByAuto, setTriggeredByAuto] = useState(true);

  const calculatePIS = () => {
    const employees = parseInt(profileData?.entityOverview?.employeeCount) || 0;

    // Clean and parse turnover (remove 'R' and commas)
    const turnoverRaw = profileData?.financialOverview?.annualRevenue || '0';
    const turnover = parseFloat(turnoverRaw.toString().replace(/[R,\s]/g, '')) || 0;

    // Clean and parse liabilities
    const liabilitiesRaw = profileData?.financialOverview?.existingDebt || '0';
    const liabilities = parseFloat(liabilitiesRaw.toString().replace(/[R,\s]/g, '')) || 0;

    const shareholders = profileData?.ownershipManagement?.shareholders?.length || 1;

    const turnoverComponent = turnover / 1000000;
    const liabilitiesComponent = liabilities / 1000000;
    const totalPIS = employees + turnoverComponent + liabilitiesComponent + shareholders;

    return {
      employees,
      turnover,
      liabilities,
      shareholders,
      turnoverComponent: parseFloat(turnoverComponent.toFixed(2)),
      liabilitiesComponent: parseFloat(liabilitiesComponent.toFixed(2)),
      totalPIS: parseFloat(totalPIS.toFixed(2))
    };
  };

  // Calculate policies score from compliance checklist
  const calculatePoliciesScore = () => {
    if (!profileData?.legalCompliance?.complianceChecklist) {
      return 0;
    }

    const checklist = profileData.legalCompliance.complianceChecklist;

    // Define all 17 policy items
    const policyItems = [
      "employmentContract", "nda", "mou", "suppliercontract",
      "codeOfConduct", "leavePolicy", "disciplinaryPolicy", "healthSafetyPolicy", "privacyPolicy",
      "remoteWorkPolicy", "conflictInterestPolicy", "ipProtection", "socialMediaPolicy",
      "expensePolicy", "overtimePolicy", "terminationPolicy", "performancePolicy"
    ];

    // Count how many policies are checked (true)
    const completedCount = policyItems.filter(item => checklist[item]).length;

    // Calculate percentage (out of 17 policies)
    const policiesScore = Math.round((completedCount / policyItems.length) * 100);

    return {
      score: policiesScore,
      completed: completedCount,
      total: policyItems.length
    };
  };

  // Add/remove body class to prevent scrolling when modal is open
  useEffect(() => {
    if (!aiEvaluationResult) return;

    const parsed = parseAiEvaluation(aiEvaluationResult);

    // Keep all local states in sync from the parsed AI result
    setPisScore(parsed.pis || 0);
    setGovernanceScore(parsed.govScore || 0);
    setScoreBreakdown(parsed.breakdown || []);
    setGovernanceStage(parsed.stage || "");
    setGovernanceRecommendation(parsed.recommendation || "");

    // Notify parent with the current overall score
    if (onScoreUpdate) onScoreUpdate(parsed.govScore || 0);
  }, [aiEvaluationResult, profileData]);


  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : '';
    return () => document.body.style.overflow = '';
  }, [showModal]);


  const refreshAiEvaluation = async () => {
    const userId = auth?.currentUser?.uid;
    if (!userId) return;

    try {
      const aiEvalRef = doc(db, "aiGovernanceEvaluation", userId);
      const aiSnap = await getDoc(aiEvalRef);

      if (aiSnap.exists()) {
        const saved = aiSnap.data();
        if (saved.result) {
          console.log("Refreshing AI evaluation result");
          setAiEvaluationResult(saved.result);
          return;
        }
      }

      // If no saved result, run new evaluation
      console.log("No saved result found, running new evaluation");
      await runAiEvaluation();
    } catch (error) {
      console.error("Error refreshing AI evaluation:", error);
      setEvaluationError(`Failed to refresh evaluation: ${error.message}`);
    }
  };

  const sendMessageToChatGPT = async (message) => {
    try {
      const functions = getFunctions();
      const fn = httpsCallable(functions, "generateGovernanceAnalysis");
      const resp = await fn({ prompt: message });
      const content = resp?.data?.content;
      if (!content) throw new Error("Empty response from analysis function.");
      return content;
    } catch (err) {
      console.error("Callable error:", err);
      throw new Error(
        err?.message || "Failed to generate governance analysis."
      );
    }
  };

  const parseAiEvaluation = (text) => {
    const raw = text || "";
    const cleaned = raw.replace(/\*\*/g, "");

    // Calculate actual PIS from profile data
    const pisCalculation = calculatePIS();
    const actualPIS = pisCalculation.totalPIS;

    // --- PIS --- (use calculated value as fallback)
    let pis = actualPIS;
    const pisRegexes = [
      /PIS\s*Score\s*[:\-–—]?\s*([\d.]+)/i,
      /PIS[^=]{0,20}=\s*([\d.]+)/i,
    ];
    for (const rx of pisRegexes) {
      const m = cleaned.match(rx);
      if (m) {
        pis = parseFloat(m[1]);
        break;
      }
    }

    // --- Governance Score ---
    let govScore = 0;
    const govRegexes = [
      /(?:Overall\s*)?Governance\s*Score\s*[:\-–—]?\s*([\d.]+)\s*%/i,
      /Governance\s*:\s*([\d.]+)\s*%/i,
    ];
    for (const rx of govRegexes) {
      const m = cleaned.match(rx);
      if (m) { govScore = Math.round(parseFloat(m[1])); break; }
    }

    // --- Stage & Recommendation ---
    let stage = "";
    if (/Advisors Stage/i.test(cleaned)) stage = "Advisors Stage";
    else if (/Emerging Board Stage/i.test(cleaned)) stage = "Emerging Board Stage";
    else if (/Full Board Stage/i.test(cleaned)) stage = "Full Board Stage";

    let recommendation = "";
    if (/Advisors sufficient/i.test(cleaned)) recommendation = "Advisors sufficient";
    else if (/Informal board recommended/i.test(cleaned)) recommendation = "Informal board recommended";
    else if (/Formal board strongly recommended/i.test(cleaned)) recommendation = "Formal board strongly recommended";

    // --- Category breakdown ---
    const policiesData = calculatePoliciesScore();
    const breakdown = [];
    const categoryRegex = /###\s+\d+\.\s*([^\n]+)\s*\*\*Score:\*\*\s*(\d+)\/(\d+)/g;
    const colors = ["#8D6E63", "#6D4C41", "#A67C52", "#5D4037", "#4E342E"];

    let i = 0, match;
    let foundPoliciesInAI = false;

    // Parse categories from AI response
    while ((match = categoryRegex.exec(raw)) !== null) {
      const categoryName = match[1].trim();

      // Check if this is the Policies & Documentation category from AI
      if (categoryName.toLowerCase().includes("policies") || categoryName.toLowerCase().includes("documentation")) {
        foundPoliciesInAI = true;

        // Use the AI's policies score but combine with our actual policies data
        breakdown.push({
          name: "Policies & Documentation",
          score: policiesData.score, // Use our calculated score instead of AI score
          max: 100, // Use percentage-based max
          completed: policiesData.completed,
          total: policiesData.total,
          color: colors[i % colors.length],
        });
      } else {
        // Regular category
        breakdown.push({
          name: categoryName,
          score: parseInt(match[2]),
          max: parseInt(match[3]),
          color: colors[i % colors.length],
        });
      }
      i++;
    }

    // If AI didn't include Policies & Documentation, add it
    if (!foundPoliciesInAI && breakdown.length > 0) {
      breakdown.push({
        name: "Policies & Documentation",
        score: policiesData.score,
        max: 100,
        completed: policiesData.completed,
        total: policiesData.total,
        color: colors[breakdown.length % colors.length],
      });
    }

    // Calculate weights for all categories
    if (breakdown.length > 0) {
      const weightPerCategory = 100 / breakdown.length;

      breakdown.forEach(category => {
        category.weight = weightPerCategory;
        if (category.name === "Policies & Documentation") {
          category.weightedScore = (category.score / category.max) * weightPerCategory;
        } else {
          category.weightedScore = (category.score / category.max) * weightPerCategory;
        }
      });
    }

    return {
      pis,
      govScore,
      stage,
      recommendation,
      breakdown,
      analysis: raw,
      pisCalculation: pisCalculation
    };
  };


  const runAiEvaluation = async () => {
    if (!apiKey?.trim()) {
      setEvaluationError('OpenAI API key not configured.');
      return;
    }

    if (!profileData) {
      setEvaluationError('No profile data available for evaluation.');
      return;
    }

    // Clear previous results before running new evaluation
    setIsEvaluating(true);
    setEvaluationError('');
    setAiEvaluationResult('');
    setPisScore(0);
    setGovernanceScore(0);
    setScoreBreakdown([]);
    setGovernanceStage("");
    setGovernanceRecommendation("");

    try {
      const evaluationData = prepareDataForAiEvaluation(profileData);
      const policiesData = calculatePoliciesScore();
      const pisCalc = calculatePIS();

      const prompt = `Evaluate the business's governance readiness using the Public Interest Score (PIS) system.

IMPORTANT: Use the exact PIS calculation provided below.

## PIS CALCULATION:
Employees: ${pisCalc.employees}
Annual Turnover: R ${pisCalc.turnover.toLocaleString()}
Liabilities: R ${pisCalc.liabilities.toLocaleString()}
Shareholders: ${pisCalc.shareholders}

PIS = Employees + (Turnover/R1m) + (Liabilities/R1m) + Shareholders
PIS = ${pisCalc.employees} + (${pisCalc.turnover.toLocaleString()}/1,000,000) + (${pisCalc.liabilities.toLocaleString()}/1,000,000) + ${pisCalc.shareholders}
PIS = ${pisCalc.employees} + ${pisCalc.turnoverComponent} + ${pisCalc.liabilitiesComponent} + ${pisCalc.shareholders}
PIS = ${pisCalc.totalPIS}

PIS Score: ${pisCalc.totalPIS}

## GOVERNANCE EVALUATION:
Based on PIS level:
- PIS < 100: Advisors Stage rubric
- PIS 100-349: Emerging Board Stage rubric  
- PIS ≥ 350: Full Board Stage rubric

Current Stage: ${pisCalc.totalPIS < 100 ? 'Advisors Stage' : pisCalc.totalPIS < 350 ? 'Emerging Board Stage' : 'Full Board Stage'}

## PLATFORM-SPECIFIC REQUIREMENTS:
When providing improvement advice, focus on ACTUAL STEPS the user can take WITHIN OUR PLATFORM:

1. **For Board Structure improvements:**
   - Go to Ownership Management → Add Directors/Advisors
   - Complete board composition templates
   - Set up meeting frequency in Enterprise Readiness
   - Document board roles and responsibilities

2. **For Policies & Documentation:**
   - Navigate to Legal Compliance → Compliance Checklist
   - Complete missing policies from the 17 available templates
   - Use document generator for Employment Contracts, NDAs, etc.
   - Upload existing policies to Document Vault

3. **For Strategic Planning:**
   - Use Business Plan templates in Strategic Planning section
   - Complete SWOT analysis tool
   - Set up KPI tracking in Performance Metrics
   - Document strategic objectives with timelines

4. **For Risk Management:**
   - Complete Risk Assessment questionnaire
   - Use Risk Register template
   - Set up compliance calendar alerts
   - Document mitigation strategies

5. **For Transparency and Reporting:**
   - Set up regular financial reporting schedules
   - Document stakeholder communication protocols
   - Use reporting templates in Financial Overview
   - Establish audit trail practices

## EVALUATION INSTRUCTIONS:

For each category in the appropriate rubric (plus Policies & Documentation and Transparency and Reporting):
- Score from 0 to max points based on ACTUAL data provided
- Provide short rationale for the score (2-3 sentences)
- FOR EACH CATEGORY, include a "How to Improve" section with 3-5 SPECIFIC, ACTIONABLE steps that the user can actually implement ON OUR PLATFORM

5. POLICIES & DOCUMENTATION CATEGORY:
   Current Policies: ${policiesData.completed}/${policiesData.total} completed (${policiesData.score}%)
   - Evaluate based on their actual policy completion status
   - Recommend SPECIFIC policies to complete next from our 17-template checklist
   - Provide platform-specific steps to improve documentation

6. TRANSPARENCY AND REPORTING CATEGORY:
   - Evaluate financial reporting practices and disclosure standards
   - Assess stakeholder communication quality and frequency
   - Review reporting to boards, shareholders, and authorities
   - Provide platform-specific steps to improve transparency

7. Finally, provide:
   - Overall governance score (0-100%)
   - Governance stage
   - Clear recommendation
   - Actionable improvement suggestions tied to platform features

Input Data:
${evaluationData}

OUTPUT FORMAT:
PIS Score: ${pisCalc.totalPIS}
Governance Stage: [stage]
Governance Recommendation: [recommendation]
Governance Score: [score]%

### Category Breakdown:
### 1. [Category Name]
**Score:** [score]/[max]
**Rationale:** [2-3 sentence explanation based on actual data]
**How to Improve:** 
• [Specific platform action 1 with exact navigation path]
• [Specific platform action 2 with measurable goal]
• [Specific platform action 3 using our templates/tools]

### 2. Policies & Documentation
**Score:** [evaluate 0-100 based on policy completeness]
**Rationale:** [2-3 sentence explanation focusing on their ${policiesData.score}% completion rate and which specific policies are missing]
**How to Improve:** 
• [Complete [specific missing policy] in Legal Compliance → Compliance Checklist]
• [Use our [template name] generator for [document type]]
• [Set up automated reminders for policy reviews in Compliance Calendar]

### 3. Transparency and Reporting
**Score:** [evaluate 0-100 based on reporting practices]
**Rationale:** [2-3 sentence explanation focusing on current reporting standards and disclosure practices]
**How to Improve:** 
• [Set up [specific reporting schedule] in Financial Overview]
• [Use [template name] for stakeholder communications]
• [Establish [specific audit practice] using our compliance tools]

### Overall Assessment
**Final Analysis:** [Brief overall assessment with key platform-specific recommendations]`;

      const result = await sendMessageToChatGPT(prompt);
      const parsed = parseAiEvaluation(result);

      setPisScore(parsed.pis);
      setGovernanceScore(parsed.govScore);
      setScoreBreakdown(parsed.breakdown);
      setGovernanceStage(parsed.stage);
      setGovernanceRecommendation(parsed.recommendation);
      setAiEvaluationResult(parsed.analysis);
      setShowDetailedAnalysis(true);

      // Save to Firestore
      const userId = auth?.currentUser?.uid;
      if (userId) {
        const aiEvalRef = doc(db, "aiGovernanceEvaluation", userId);
        await setDoc(aiEvalRef, {
          result: parsed.analysis,
          pisScore: parsed.pis,
          governanceScore: parsed.govScore,
          timestamp: new Date(),
          profileSnapshot: profileData,
          pisCalculation: parsed.pisCalculation
        }, { merge: true });
      }

      if (onScoreUpdate) onScoreUpdate(parsed.govScore);
    } catch (error) {
      console.error('AI Evaluation error:', error);
      setEvaluationError(`Failed to get AI evaluation: ${error.message}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  const prepareDataForAiEvaluation = (data) => {
    let evaluationData = '=== BUSINESS DATA ===\n';

    // PIS Calculation Components
    const pisCalc = calculatePIS();
    evaluationData += `Employees: ${pisCalc.employees}\n`;
    evaluationData += `Annual Turnover: R ${pisCalc.turnover.toLocaleString()}\n`;
    evaluationData += `Liabilities: R ${pisCalc.liabilities.toLocaleString()}\n`;
    evaluationData += `Shareholders: ${pisCalc.shareholders}\n\n`;

    // Governance Factors
    evaluationData += '=== GOVERNANCE FACTORS ===\n';
    evaluationData += `Directors: ${data?.ownershipManagement?.directors?.length || 0}\n`;
    evaluationData += `Has Advisors: ${data?.enterpriseReadiness?.hasAdvisors === 'yes' ? 'Yes' : 'No'}\n`;
    evaluationData += `Audited Financials: ${data?.enterpriseReadiness?.hasAuditedFinancials === 'yes' ? 'Yes' : 'No'}\n`;
    evaluationData += `BB-BEE Level: ${data?.legalCompliance?.bbbeeLevel || 'Not provided'}\n`;
    evaluationData += `Board Meetings: ${data?.enterpriseReadiness?.advisorsMeetingFrequency || 'Not specified'}\n`;

    // Policies Data
    evaluationData += '=== POLICIES STATUS ===\n';
    const policiesData = calculatePoliciesScore();
    evaluationData += `Policies Completion: ${policiesData.score}%\n`;
    evaluationData += `Completed Policies: ${policiesData.completed}/${policiesData.total}\n`;

    return evaluationData;
  };

  // Load saved evaluation if exists
  useEffect(() => {
    const userId = auth?.currentUser?.uid;
    if (!userId) return;

    const loadSavedEvaluation = async () => {
      const aiEvalRef = doc(db, "aiGovernanceEvaluation", userId);
      const docSnap = await getDoc(aiEvalRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.result) {
          const parsed = parseAiEvaluation(data.result);
          setPisScore(data.pisScore || 0);
          setGovernanceScore(data.governanceScore || 0);
          setAiEvaluationResult(data.result);
          setGovernanceStage(parsed.stage);
          setGovernanceRecommendation(parsed.recommendation);
          setScoreBreakdown(parsed.breakdown);
        }
      }
    };

    loadSavedEvaluation();
  }, [auth?.currentUser?.uid]);

  // Trigger evaluation when profile data changes or manual trigger
  useEffect(() => {
    if (!auth?.currentUser?.uid || !apiKey) return;

    const docRef = doc(db, "universalProfiles", auth.currentUser.uid);
    const aiEvalRef = doc(db, "aiGovernanceEvaluation", auth.currentUser.uid);

    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (!docSnap.exists()) return;

      const data = docSnap.data();
      if (data.triggerLegitimacyEvaluation === true && !isEvaluating) {

        console.log("Trigger detected: Running PIS AI evaluation...");


        const result = await runAiEvaluation();

        // Reset the trigger
        await updateDoc(docRef, { triggerLegitimacyEvaluation: false });

        // Also ensure result is loaded into state if not already
        const aiSnap = await getDoc(aiEvalRef);
        if (aiSnap.exists()) {
          const saved = aiSnap.data();
          if (saved.result) {
            const parsed = parseAiEvaluation(saved.result);
            setPisScore(saved.pisScore || 0);
            setGovernanceScore(saved.governanceScore || 0);
            setAiEvaluationResult(saved.result);
            setGovernanceStage(parsed.stage);
            setGovernanceRecommendation(parsed.recommendation);
            setScoreBreakdown(parsed.breakdown);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [auth?.currentUser?.uid, apiKey, isEvaluating]);

  const getProgressBarColor = (score) => {
    if (score > 90) return "#1B5E20";
    if (score >= 81) return "#4CAF50";
    if (score >= 61) return "#FF9800";
    if (score >= 41) return "#F44336";
    return "#B71C1C";
  };

  const getScoreLevel = (score) => {
    if (score > 90) return { level: "Strong Governance", color: "#1B5E20", icon: CheckCircle };
    if (score >= 81) return { level: "Strong Governance", color: "#4CAF50", icon: CheckCircle };
    if (score >= 61) return { level: "Adequate", color: "#FF9800", icon: TrendingUp };
    if (score >= 41) return { level: "Weak Governance", color: "#F44336", icon: AlertCircle };
    return { level: "Poor Governance", color: "#B71C1C", icon: AlertCircle };
  };

  const formatAiResult = (text) => {
    if (!text) return null;

    const cleanedResult = text.replace(/\*\*(.*?)\*\*/g, "$1");

    // Split by major sections (### headers)
    const sections = cleanedResult.split(/(?=###\s)/g);

    return sections.map((section, index) => {
      const trimmed = section.trim();
      if (!trimmed) return null;

      // Check if this is a category section with "How to Improve"
      const isCategorySection = /^###\s+\d+\./.test(trimmed);

      if (isCategorySection) {
        // Split the category section into parts
        const lines = trimmed.split('\n').filter(line => line.trim());
        const header = lines[0];
        const content = lines.slice(1).join('\n');

        // Extract improvement section with special styling
        const improvementIndex = content.toLowerCase().indexOf('how to improve');
        let mainContent = content;
        let improvementContent = '';

        if (improvementIndex !== -1) {
          mainContent = content.substring(0, improvementIndex);
          improvementContent = content.substring(improvementIndex);
        }

        return (
          <div key={index} style={{ marginBottom: "20px", border: "1px solid #e8d8cf", borderRadius: "8px", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ backgroundColor: "#8d6e63", color: "white", padding: "12px 16px", fontWeight: "bold" }}>
              {header.replace('###', '').trim()}
            </div>

            {/* Main Content */}
            <div style={{ padding: "16px", backgroundColor: "white" }}>
              <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.6", color: "#5d4037", marginBottom: improvementContent ? "15px" : "0" }}>
                {mainContent}
              </div>

              {/* Improvement Section with Special Styling */}
              {improvementContent && (
                <div style={{
                  backgroundColor: "#f8f4f0",
                  padding: "15px",
                  borderRadius: "6px",
                  borderLeft: "4px solid #ff9800"
                }}>
                  <div style={{
                    fontWeight: "bold",
                    color: "#5d4037",
                    marginBottom: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <TrendingUp size={16} />
                    Improvement Actions
                  </div>
                  <div style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.6",
                    color: "#6d4c41",
                    fontSize: "14px"
                  }}>
                    {improvementContent.replace('How to Improve:', '').trim()}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }

      // Regular section formatting (for overall assessment, etc.)
      return (
        <div key={index} style={{ marginBottom: "15px" }}>
          <div style={{
            fontSize: "14px",
            lineHeight: "1.6",
            color: "#6d4c41",
            whiteSpace: "pre-wrap",
            backgroundColor: "white",
            padding: "16px",
            borderRadius: "8px",
            border: "1px solid #e8d8cf"
          }}>
            {trimmed}
          </div>
        </div>
      );
    }).filter(Boolean);
  };

  const scoreLevel = getScoreLevel(governanceScore);
  const ScoreIcon = scoreLevel.icon;

  return (
    <>
      {/* Enhanced Outside Card Design */}
      <div style={{
        background: "linear-gradient(135deg, #ffffff 0%, #faf8f6 100%)",
        borderRadius: "20px",
        boxShadow: "0 8px 32px rgba(141, 110, 99, 0.15)",
        border: "1px solid #e8ddd6",
        overflow: "hidden",
        position: "relative",
        width: "100%",
        minWidth: "210px",
        maxWidth: "000px",
      }}>
        {/* Header with gradient */}
        <div style={{
          background: "linear-gradient(135deg, #8d6e63 0%, #6d4c41 100%)",
          padding: "24px 30px 20px 30px",
          color: "white",
          position: "relative"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "8px"
          }}>
            <h2 style={{
              margin: "0",
              fontSize: "16px",
              fontWeight: "700",
              letterSpacing: "0.5px",
              whiteSpace: "nowrap"
            }}>Governance Score</h2>
          </div>
          <p style={{
            margin: "0",
            fontSize: "13px",
            opacity: "0.9",
            fontWeight: "400"
          }}>Assess compliance readiness </p>

          {/* Decorative elements */}
          <div style={{
            position: "absolute",
            top: "-20px",
            right: "-20px",
            width: "80px",
            height: "80px",
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "50%",
            opacity: "0.6"
          }}></div>
          <div style={{
            position: "absolute",
            bottom: "-10px",
            left: "-10px",
            width: "60px",
            height: "60px",
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "50%"
          }}></div>
        </div>

        {/* Main Content Area */}
        <div style={{
          padding: "24px",
          background: "white",
          textAlign: "center"
        }}>
          {/* Score Circle with Connected Badge */}
          <div style={{
            position: "relative",
            display: "inline-block",
            marginBottom: "24px"
          }}>
            {/* Main Score Circle */}
            <div style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "110px",
              height: "110px",
              border: `4px solid ${scoreLevel.color}`,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #ffffff 0%, #f8fff8 100%)",
              boxShadow: `0 6px 20px ${scoreLevel.color}30`,
              color: "#2d2d2d",
              fontWeight: "bold"
            }}>
              <span style={{
                fontSize: "26px",
                fontWeight: "800",
                lineHeight: "1",
                marginBottom: "2px"
              }}>{governanceScore}%</span>
              <span style={{
                fontSize: "11px",
                fontWeight: "600",
                color: scoreLevel.color,
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}>{governanceRecommendation.split(' ')[0]}</span>

              {/* Animated ring */}
              <div style={{
                position: "absolute",
                top: "-6px",
                left: "-6px",
                right: "-6px",
                bottom: "-6px",
                border: `2px solid ${scoreLevel.color}20`,
                borderRadius: "50%",
                animation: "pulse 2s infinite"
              }}></div>
            </div>

            {/* Connected Status Badge */}
            <div style={{
              position: "absolute",
              bottom: "-12px",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: scoreLevel.color,
              color: "white",
              padding: "6px 16px",
              borderRadius: "20px",
              fontSize: "10px",
              fontWeight: "600",
              textTransform: "capitalize",
              letterSpacing: "0.5px",
              boxShadow: `0 4px 12px ${scoreLevel.color}40`,
              border: "2px solid white",
              whiteSpace: "nowrap"
            }}>
              {scoreLevel.level}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => setShowModal(true)}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #5d4037 0%, #4a2c20 100%)",
              color: "white",
              border: "none",
              fontWeight: "600",
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 16px rgba(93, 64, 55, 0.3)",
              whiteSpace: "nowrap",
              marginTop: "18px"
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 20px rgba(93, 64, 55, 0.4)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0px)";
              e.target.style.boxShadow = "0 4px 16px rgba(93, 64, 55, 0.3)";
            }}
          >
            <span>Score breakdown</span>
            <ChevronDown size={16} />
          </button>

        </div>

        {/* CSS Animations */}
        <style jsx>{`
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.05);
              opacity: 0.7;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}</style>
      </div>

      {/* Enhanced Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: "999999",
            padding: "20px"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div
            style={{
              position: "relative",
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
              zIndex: "999999",
              maxHeight: "90vh",
              overflowY: "auto",
              width: "90%",
              maxWidth: "700px",
              border: "1px solid #ccc"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                background: "#fff",
                border: "2px solid #ddd",
                fontSize: "20px",
                cursor: "pointer",
                color: "#666",
                zIndex: "999999",
                width: "35px",
                height: "35px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                fontWeight: "bold"
              }}
            >
              ×
            </button>

            <div style={{ padding: "30px 20px 20px 20px" }}>
              <h3 style={{
                margin: "0 0 20px 0",
                fontSize: "24px",
                fontWeight: "600",
                color: "#5d4037",
                textAlign: "center"
              }}>Governance score breakdown</h3>

              {/* Score Display Section */}
              <div style={{
                textAlign: "center",
                marginBottom: "30px",
                padding: "20px",
                background: "linear-gradient(135deg, #fdf8f6 0%, #f3e8dc 100%)",
                borderRadius: "12px",
                border: "1px solid #d6b88a"
              }}>
                <div style={{
                  display: "inline-flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "120px",
                  height: "120px",
                  border: `4px solid ${scoreLevel.color}`,
                  borderRadius: "50%",
                  background: "white",
                  boxShadow: "0 4px 12px rgba(139, 69, 19, 0.2)",
                  marginBottom: "15px"
                }}>
                  <span style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    color: "#5d4037",
                    lineHeight: "1"
                  }}>{governanceScore}%</span>
                  <span style={{
                    color: scoreLevel.color,
                    fontSize: "12px",
                    fontWeight: "600",
                    marginTop: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    {scoreLevel.level}
                  </span>
                </div>

                <div style={{
                  fontSize: "16px",
                  color: "#6d4c41",
                  marginBottom: "15px"
                }}>
                  <span>Governance status: </span>
                  <span style={{
                    fontWeight: "600",
                    color: "#5d4037",
                    textTransform: "capitalize"
                  }}>
                    {governanceStage}
                  </span>
                </div>

                {isEvaluating && (
                  <p style={{ color: "#5d4037", fontSize: "14px", textAlign: "center", marginTop: "10px" }}>
                    <RefreshCw size={16} className="spin" style={{ marginRight: "6px" }} />
                    Running automatic AI analysis...
                  </p>
                )}

                {!aiEvaluationResult && (
                  <div style={{ marginTop: "15px" }}>
                    <button
                      onClick={refreshAiEvaluation}
                      disabled={isEvaluating || !apiKey}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: isEvaluating ? "#8d6e63" : "#5d4037",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontWeight: "600",
                        cursor: isEvaluating || !apiKey ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        fontSize: "14px",
                        opacity: isEvaluating || !apiKey ? 0.7 : 1,
                        transition: "all 0.2s ease",
                      }}
                    >
                      {isEvaluating ? (
                        <>
                          <div
                            style={{
                              width: "16px",
                              height: "16px",
                              border: "2px solid #ffffff",
                              borderTop: "2px solid transparent",
                              borderRadius: "50%",
                              animation: "spin 1s linear infinite",
                            }}
                          ></div>
                          Loading analysis...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={16} />
                          Load AI analysis
                        </>
                      )}
                    </button>
                    {!apiKey && (
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#f44336",
                          marginTop: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                        }}
                      >
                        <AlertCircle size={14} />
                        AI analysis requires API key configuration
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* About the Governance Score section */}
              <div style={{
                marginTop: "20px",
                border: "1px solid #d7ccc8",
                borderRadius: "8px",
                overflow: "hidden"
              }}>
                <div
                  style={{
                    backgroundColor: "#8d6e63",
                    color: "white",
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                  onClick={() => setShowAboutScore(!showAboutScore)}
                >
                  <span>About the Governance Score</span>
                  <ChevronDown
                    size={20}
                    style={{
                      transform: showAboutScore ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease"
                    }}
                  />
                </div>
                {showAboutScore && (
                  <div style={{
                    backgroundColor: "#f5f2f0",
                    padding: "20px",
                    color: "#5d4037"
                  }}>
                    {/* Introduction */}
                    <p style={{ marginBottom: "20px", lineHeight: "1.6", fontSize: "15px" }}>
                      The Governance score evaluates whether a business is ready to establish or improve its governance structures.
                      It combines the Public Interest Score (PIS) with an assessment of governance maturity.
                    </p>

                    {/* Evaluation Categories */}
                    <div style={{
                      backgroundColor: "#efebe9",
                      padding: "16px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      borderLeft: "4px solid #8d6e63"
                    }}>
                      <p style={{ fontWeight: "bold", marginBottom: "12px", color: "#6d4c41", fontSize: "15px" }}>
                        Evaluation Categories:
                      </p>
                      <ul style={{ margin: "0", paddingLeft: "20px", color: "#5d4037", lineHeight: "1.8" }}>
                        <li style={{ marginBottom: "12px" }}>
                          <strong>Board Structure and Functionality:</strong> Evaluates the composition, roles, and effectiveness of your board or advisory structure. Assesses whether you have the right governance oversight for your business size and complexity.
                          <ul style={{ marginTop: "8px", paddingLeft: "20px", fontSize: "14px", color: "#6d4c41" }}>
                            <li style={{ marginBottom: "4px" }}>PIS &lt; 100: Advisors Stage - light governance structures suitable for smaller operations</li>
                            <li style={{ marginBottom: "4px" }}>PIS 100-349: Emerging Board Stage - informal board recommended for growing businesses</li>
                            <li>PIS ≥ 350: Full Board Stage - formal board strongly recommended for complex operations</li>
                          </ul>
                          <div style={{ marginTop: "8px", fontSize: "14px", color: "#6d4c41" }}>
                            <strong>PIS Calculation:</strong>
                            <ul style={{ marginTop: "4px", paddingLeft: "20px" }}>
                              <li style={{ marginBottom: "4px" }}>PIS = Employees + (Turnover/R1m) + (Liabilities/R1m) + Shareholders</li>
                              <li>Higher PIS indicates greater public interest and governance requirements</li>
                            </ul>
                          </div>
                        </li>
                        <li style={{ marginBottom: "12px" }}>
                          <strong>Strategic Planning:</strong> Reviews your long-term vision, business plans, and decision-making processes. Examines whether you have clear strategic direction and regularly review performance against goals.
                        </li>
                        <li style={{ marginBottom: "12px" }}>
                          <strong>Risk Management:</strong> Analyzes how you identify, assess, and mitigate business risks. Evaluates your preparedness for crises and ability to protect business continuity.
                        </li>
                        <li style={{ marginBottom: "12px" }}>
                          <strong>Transparency and Reporting:</strong> Evaluates your financial reporting practices, stakeholder communication, and disclosure standards. Assesses the quality and frequency of reporting to boards, shareholders, and relevant authorities.
                        </li>
                        <li style={{ marginBottom: "12px" }}>
                          <strong>Policies & Documentation:</strong> Reviews essential business policies, employment contracts, and compliance documentation. Assesses completeness of your policy framework and legal protection measures.
                        </li>
                      </ul>
                    </div>

                    {/* Score Interpretation */}
                    <div style={{
                      backgroundColor: "#efebe9",
                      padding: "16px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      borderLeft: "4px solid #8d6e63"
                    }}>
                      <p style={{ fontWeight: "bold", marginBottom: "12px", color: "#6d4c41", fontSize: "15px" }}>
                        Score Interpretation:
                      </p>
                      <ul style={{ margin: "0", paddingLeft: "20px", color: "#5d4037", lineHeight: "1.8" }}>
                        <li style={{ marginBottom: "8px" }}>
                          <strong>91-100% (Governance Excellence):</strong> Your business demonstrates exceptional governance maturity with comprehensive structures, robust oversight, and industry-leading practices that inspire stakeholder confidence.
                        </li>
                        <li style={{ marginBottom: "8px" }}>
                          <strong>81-90% (Strong Governance):</strong> Well-established governance framework with effective oversight mechanisms, clear accountability structures, and strong compliance practices that meet investor expectations.
                        </li>
                        <li style={{ marginBottom: "8px" }}>
                          <strong>61-80% (Developing Governance):</strong> Good governance foundations in place with room for refinement. Key structures exist but could be strengthened to enhance oversight and accountability.
                        </li>
                        <li style={{ marginBottom: "8px" }}>
                          <strong>41-60% (Emerging Governance):</strong> Basic governance elements established but significant gaps exist in oversight, reporting, or policy frameworks that need addressing for stakeholder confidence.
                        </li>
                        <li style={{ marginBottom: "0" }}>
                          <strong>0-40% (Foundational Stage):</strong> Governance structures require substantial development. Focus on implementing basic oversight mechanisms, essential policies, and accountability frameworks.
                        </li>
                      </ul>
                    </div>

                    {/* Governance Stages */}
                   
                  </div>
                )}
              </div>

              {/* Score Breakdown Section */}
              <div style={{
                marginTop: "20px",
                border: "1px solid #d7ccc8",
                borderRadius: "8px",
                overflow: "hidden"
              }}>
                <div
                  style={{
                    backgroundColor: "#8d6e63",
                    color: "white",
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                  onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
                >
                  <span>Score breakdown</span>
                  <ChevronDown
                    size={20}
                    style={{
                      transform: showScoreBreakdown ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease"
                    }}
                  />
                </div>
                {showScoreBreakdown && (
                  <div style={{
                    backgroundColor: "#f5f2f0",
                    padding: "20px",
                    color: "#5d4037"
                  }}>
                    {scoreBreakdown.map((item, index) => (
                      <div key={index} style={{
                        padding: "15px",
                        borderBottom: index < scoreBreakdown.length - 1 ? "1px solid #e8d8cf" : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "white",
                        marginBottom: "5px",
                        borderRadius: "8px"
                      }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          flex: "1"
                        }}>
                          <div style={{
                            backgroundColor: item.color,
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            marginRight: "12px",
                            flexShrink: "0"
                          }}></div>
                          <div>
                            <div style={{
                              fontWeight: "600",
                              color: "#5d4037",
                              fontSize: "14px",
                              marginBottom: "2px"
                            }}>{item.name}</div>
                            {item.name === "Policies & Documentation" ? (
                              <div style={{
                                fontSize: "12px",
                                color: "#8d6e63",
                                fontStyle: "italic"
                              }}>
                                {item.completed}/{item.total} policies • {item.score}/{item.max} points
                              </div>
                            ) : (
                              <div style={{
                                fontSize: "12px",
                                color: "#8d6e63",
                                fontStyle: "italic"
                              }}>
                                {item.score}/{item.max} points
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px"
                        }}>
                          <div style={{
                            width: "80px",
                            height: "8px",
                            background: "#f3e8dc",
                            borderRadius: "4px",
                            overflow: "hidden",
                            border: "1px solid #d6b88a"
                          }}>
                            <div style={{
                              width: `${(item.score / item.max) * 100}%`,
                              backgroundColor: getProgressBarColor((item.score / item.max) * 100),
                              height: "100%",
                              borderRadius: "4px",
                              transition: "width 0.3s ease"
                            }}></div>
                          </div>
                          <span style={{
                            fontWeight: "600",
                            color: "#5d4037",
                            fontSize: "14px",
                            minWidth: "35px",
                            textAlign: "right"
                          }}>{Math.round((item.score / item.max) * 100)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Detailed Analysis Section */}
              <div style={{
                marginTop: "20px",
                border: "1px solid #d7ccc8",
                borderRadius: "8px",
                overflow: "hidden"
              }}>
                <div
                  style={{
                    backgroundColor: "#8d6e63",
                    color: "white",
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                  onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
                >
                  <span>Detailed analysis</span>
                  <ChevronDown
                    size={20}
                    style={{
                      transform: showDetailedAnalysis ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease"
                    }}
                  />
                </div>
                {showDetailedAnalysis && (
                  <div style={{
                    backgroundColor: "#f5f2f0",
                    padding: "20px",
                    color: "#5d4037"
                  }}>
                    {aiEvaluationResult ? (
                      <div style={{
                        backgroundColor: "white",
                        padding: "20px",
                        borderRadius: "8px",
                        border: "1px solid #e8d8cf",
                        maxHeight: "400px",
                        overflowY: "auto"
                      }}>
                        {formatAiResult(aiEvaluationResult)}
                      </div>
                    ) : (
                      <div style={{ color: "#5d4037", lineHeight: "1.6" }}>
                        {governanceScore > 90 && (
                          <p style={{ margin: "0" }}>
                            <strong>Exceptional governance capability.</strong> Your business demonstrates outstanding governance maturity with comprehensive structures in place. You have all the necessary governance elements for investment readiness and complex operations.
                          </p>
                        )}
                        {governanceScore >= 81 && governanceScore <= 90 && (
                          <p style={{ margin: "0" }}>
                            <strong>Strong governance foundation.</strong> Your business shows excellent governance capabilities with most key elements in place. Your governance profile would inspire confidence from investors and stakeholders.
                          </p>
                        )}
                        {governanceScore >= 61 && governanceScore <= 80 && (
                          <p style={{ margin: "0" }}>
                            <strong>Developing governance with growth potential.</strong> You have established a good governance foundation but need to strengthen certain areas. Continued development in governance structures could significantly enhance your business profile.
                          </p>
                        )}
                        {governanceScore >= 41 && governanceScore <= 60 && (
                          <p style={{ margin: "0" }}>
                            <strong>Emerging governance requiring development.</strong> While you show governance potential, significant work is needed across multiple areas before you'll be viewed as having strong governance by investors and partners.
                          </p>
                        )}
                        {governanceScore <= 40 && (
                          <p style={{ margin: "0" }}>
                            <strong>Governance development essential.</strong> Your governance profile requires substantial strengthening across multiple dimensions. Focus on implementing basic governance structures and gradually building more sophisticated elements.
                          </p>
                        )}
                      </div>
                    )}

                    {evaluationError && (
                      <div style={{
                        marginTop: "15px",
                        padding: "12px",
                        backgroundColor: "#f8d7da",
                        color: "#721c24",
                        border: "1px solid #f5c6cb",
                        borderRadius: "6px",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}>
                        <AlertCircle size={16} />
                        {evaluationError}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}