"use client"

import { useState, useEffect } from "react"
import { ChevronDown, RefreshCw, AlertCircle, Users, CheckCircle, TrendingUp } from "lucide-react"
import { db, auth } from "../../firebaseConfig"
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore"
import { API_KEYS } from "../../API" // Make sure this path is correct
import { getFunctions, httpsCallable } from "firebase/functions";

export function LeadershipScoreCard({ styles, profileData, onScoreUpdate, apiKey }) {
  const [showModal, setShowModal] = useState(false)
  const [leadershipScore, setLeadershipScore] = useState(0)
  const [scoreBreakdown, setScoreBreakdown] = useState([])
  const [aiEvaluationResult, setAiEvaluationResult] = useState("")
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluationError, setEvaluationError] = useState("")
  const [showAboutScore, setShowAboutScore] = useState(false)
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false)
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)
  const [triggeredByAuto, setTriggeredByAuto] = useState(false)
  const [confidenceScores, setConfidenceScores] = useState({})
  const [evidenceTraceability, setEvidenceTraceability] = useState({})

  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : ""
    return () => (document.body.style.overflow = "")
  }, [showModal])

  useEffect(() => {
    if (profileData && aiEvaluationResult) {
      const result = calculateLeadershipScore(profileData, aiEvaluationResult)
      setLeadershipScore(result.totalScore)
      setScoreBreakdown(result.breakdown)
      if (onScoreUpdate) onScoreUpdate(result.totalScore)
    }
  }, [profileData, aiEvaluationResult])

  const parseAiEvaluationScores = (text) => {
    const categories = {
      leadership_credentials: ["Leadership Credentials"],
      leadership_structure: ["Leadership Structure"],
      leadership_behaviour: ["Leadership Behaviour"],
      // These sub-keys are parsed from the AI but rolled into credentials/structure above
    }

    const cleanedText = text.replace(/\*\*(.*?)\*\*/g, "$1")
    const scores = {}
    const evidenceMap = {}
    const confidenceMap = {}

    const findSectionBody = (label) => {
      const sectionRe = new RegExp(
        `(^|\\n)\\s*(?:#{1,6}\\s*)?\\d*\\.?\\s*${label}[^\\n]*\\n([\\s\\S]*?)(?=\\n\\s*(?:#{1,6}\\s*|\\d+\\.\\s|$))`,
        "i"
      )
      const m = cleanedText.match(sectionRe)
      return m ? m[2] : null
    }

    Object.entries(categories).forEach(([key, labels]) => {
      let found = null
      let evidence = null
      let confidence = "Medium"

      for (const label of labels) {
        const body = findSectionBody(label)
        if (body) {
          const evidencePatterns = [
            /Evidence:?\s*([^\n]+)/i,
            /Based on:?\s*([^\n]+)/i,
            /Supporting data:?\s*([^\n]+)/i
          ]
          for (const p of evidencePatterns) {
            const mm = body.match(p)
            if (mm) { evidence = mm[1].trim(); break }
          }

          const confidencePatterns = [
            /Confidence:?\s*(High|Medium|Low)/i,
            /Confidence level:?\s*(High|Medium|Low)/i
          ]
          for (const p of confidencePatterns) {
            const mm = body.match(p)
            if (mm) { confidence = mm[1]; break }
          }

          const scorePatterns = [
            /Score\s*:\s*(\d(?:\.\d)?)/i,
            /(\d(?:\.\d)?)\s*\/\s*5/i,
            /(\d(?:\.\d)?)\s*out\s*of\s*5/i,
            /(\d(?:\.\d)?)\s*\*\s*\d+%/i
          ]
          for (const p of scorePatterns) {
            const mm = body.match(p)
            if (mm) { found = parseFloat(mm[1]); break }
          }
        }
        if (found != null) break
      }

      if (found != null) {
        scores[key] = Math.min(Math.max(found, 0), 5)
        if (evidence) evidenceMap[key] = evidence
        if (confidence) confidenceMap[key] = confidence
      }
    })

    let finalScore = null
    let overallConfidence = "Medium"
    let overallEvidence = null

    const totalLine = cleanedText.match(/Total\s*Score\s*:\s*([^\n]+)/i)
    if (totalLine) {
      const eqNum = totalLine[1].match(/=\s*([\d.]+)/)
      if (eqNum) {
        finalScore = parseFloat(eqNum[1])
      } else {
        const nums = totalLine[1].match(/[\d.]+/g)
        if (nums && nums.length) finalScore = parseFloat(nums[nums.length - 1])
      }
    }

    const confidenceMatch = cleanedText.match(/Overall\s*Confidence:?\s*(High|Medium|Low)/i)
    if (confidenceMatch) overallConfidence = confidenceMatch[1]

    const evidenceMatch = cleanedText.match(/Evidence\s*Summary:?\s*([^\n]+)/i)
    if (evidenceMatch) overallEvidence = evidenceMatch[1].trim()

    const normPattern = cleanedText.match(/Normalized\s*(?:to|at)\s*100\s*:?[\s]*([\d.]+)/i)
    const normalizedScore = normPattern ? parseFloat(normPattern[1]) : null

    const bandPattern = cleanedText.match(/(?:Leadership\s*Band|Band)\s*:\s*([^\n]+)/i)
    const band = bandPattern ? bandPattern[1].trim() : null

    // Update state here instead of returning
    setConfidenceScores(confidenceMap)
    setEvidenceTraceability(evidenceMap)

    return { scores, finalScore, normalizedScore, band }
  }

  const refreshAiEvaluation = async () => {
    const userId = auth?.currentUser?.uid
    if (!userId) return

    try {
      const aiEvalRef = doc(db, "aiLeadershipEvaluation", userId)
      const aiSnap = await getDoc(aiEvalRef)
      if (aiSnap.exists()) {
        const saved = aiSnap.data()
        if (saved.result) {
          console.log("Refreshing AI evaluation result")
          setAiEvaluationResult(saved.result)
          return
        }
      }
      // If no saved result, run new evaluation
      console.log("No saved result found, running new evaluation")
      await runAiEvaluation()
    } catch (error) {
      console.error("Error refreshing AI evaluation:", error)
      setEvaluationError(`Failed to refresh evaluation: ${error.message}`)
    }
  }

  useEffect(() => {
    if (!auth?.currentUser?.uid) return

    const docRef = doc(db, "universalProfiles", auth.currentUser.uid)
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        if (data.triggerFundabilityEvaluation === true && !isEvaluating) {
          console.log("Trigger detected: Running leadership AI evaluation...")
          setTriggeredByAuto(true)
          await runAiEvaluation()
          // Reset the trigger to prevent repeated evaluations
          await updateDoc(docRef, {
            triggerFundabilityEvaluation: false,
          })
        }
      }
    })
    return () => unsubscribe()
  }, [auth?.currentUser?.uid, isEvaluating])

  const manualRun = async () => {
    const userId = auth?.currentUser?.uid
    if (!userId) return

    const result = await runAiEvaluation(userId)
    const aiEvalRef = doc(db, "aiLeadershipEvaluation", userId)
    await updateDoc(aiEvalRef, {
      result,
      timestamp: new Date(),
      profileSnapshot: profileData,
    }).catch(async () => {
      await setDoc(aiEvalRef, {
        result,
        timestamp: new Date(),
        profileSnapshot: profileData,
      })
    })
    setAiEvaluationResult(result)
    setShowDetailedAnalysis(true)
  }

  const sendMessageToChatGPT = async (message) => {
    try {
      const functions = getFunctions();
      const generateLeadershipAnalysis = httpsCallable(functions, "generateLeadershipAnalysis");
      const resp = await generateLeadershipAnalysis({
        prompt: message,
      });

      const content = resp?.data?.content;
      if (!content) throw new Error("Invalid response format from server");
      return content;
    } catch (error) {
      console.error("ChatGPT API Error (via functions):", error);
      throw error;
    }
  };

  useEffect(() => {
    if (!auth?.currentUser?.uid || !apiKey) return

    const userId = auth.currentUser.uid
    const profileRef = doc(db, "universalProfiles", userId)
    const aiEvalRef = doc(db, "aiLeadershipEvaluation", userId)

    const unsubscribe = onSnapshot(profileRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        if (data.triggerLeadershipEvaluation === true && !isEvaluating) {
          console.log("Trigger detected: Running leadership AI evaluation...")
          setTriggeredByAuto(true)
          const result = await runAiEvaluation(userId)
          await updateDoc(profileRef, { triggerLeadershipEvaluation: false })
          // Save result to aiLeadershipEvaluation
          await updateDoc(aiEvalRef, {
            result,
            timestamp: new Date(),
            profileSnapshot: profileData,
          }).catch(async () => {
            await setDoc(aiEvalRef, {
              result,
              timestamp: new Date(),
              profileSnapshot: profileData,
            })
          })
          setAiEvaluationResult(result)
          setShowDetailedAnalysis(true)
        }
      }
      // ALWAYS try to load saved AI evaluation result
      try {
        const aiSnap = await getDoc(aiEvalRef)
        if (aiSnap.exists()) {
          const saved = aiSnap.data()
          if (saved.result) {
            console.log("Loading saved AI evaluation result")
            setAiEvaluationResult(saved.result)
          }
        }
      } catch (error) {
        console.error("Error loading saved AI evaluation:", error)
      }
    })
    return () => unsubscribe()
  }, [auth?.currentUser?.uid, apiKey, isEvaluating])

  const runAiEvaluation = async (userId) => {
    if (!apiKey?.trim()) {
      setEvaluationError("OpenAI API key not configured.")
      return
    }
    if (!profileData) {
      setEvaluationError("No profile data available for evaluation.")
      return
    }

    setIsEvaluating(true)
    setEvaluationError("")

    try {
      const evaluationData = prepareDataForAiEvaluation(profileData)

      // Enhanced system prompt with guardrails and improved "How to Improve" section matching fundability-score-card
      const systemPrompt = `You are a board-level business analyst evaluating leadership strength.
    
CRITICAL RULES:
- ONLY use the provided structured KPI data - never invent or assume missing information
- Never fabricate benchmarks or market comparisons
- Clearly separate fact from inference
- For EVERY conclusion, provide:
  1. Confidence level (High/Medium/Low)
  2. Evidence citation (specific KPI name + value)
- If causation cannot be proven, state correlation only
- If insufficient data exists, state: "Insufficient data to determine"
- All recommendations must map to specific, actionable steps`

      const combinedMessage = `${systemPrompt}

Evaluate the leadership strength using this data:

INPUT DATA:
${evaluationData}

INSTRUCTIONS:
Score each of the 3 categories below. Each uses different input data as described.

SCORING RUBRIC (use strictly):
- 0 = No evidence or very poor
- 1 = Minimal/poor evidence  
- 2 = Below average
- 3 = Average/acceptable
- 4 = Good/strong evidence
- 5 = Excellent/outstanding

SCORING RULES PER CATEGORY:

Leadership Credentials (40%) — score based on:
  - Directors count, CVs uploaded, LinkedIn profiles, executive designations, nationalities
  - Certifications and qualifications uploaded
  - Score 0 if no directors and no certifications. Score 5 if all directors have CVs + LinkedIn + certifications present.

Leadership Structure (30%) — score based on:
  - Executives count, positions filled, CVs uploaded, LinkedIn profiles, department coverage
  - Also factor in Q6 governance answer and Q1 owner structure from behaviour data
  - Score 0 if no executives. Score 5 if full executive team with CVs + LinkedIn + board-level governance (Q6d).

Leadership Behaviour (30%) — score based ONLY on Q1–Q6 behaviour answers:
  - Map Total Behaviour Score directly:
    26–30 = 5 (Scaler), 21–25 = 4 (Builder), 16–20 = 3 (Visionary),
    11–15 = 2 (Survivalist), 1–10 = 1 (Passenger)
  - SPECIAL CASE: If Total Behaviour Score = 0, all questions unanswered — score = 0, state "Questions not yet answered"

OUTPUT FORMAT - YOU MUST FOLLOW THIS EXACTLY:

### 1. Leadership Credentials
**Score:** [0-5]
**Evidence:** [Cite: Directors Count = X, CVs = Y, LinkedIn = Z, Certifications = W]
**Confidence:** [High/Medium/Low]
**Rationale:** [2-3 sentences based on director profiles, CVs, LinkedIn presence and certifications]
**How to Improve:** 
- → Ownership & Management section: add directors with positions, CVs and LinkedIn profiles
- → Documents section: upload certifications, qualifications and awards
- → Ownership & Management section: complete demographic data for all directors
- 💡 Directors with uploaded CVs and LinkedIn profiles significantly strengthen credentials scoring
- 💡 Professional certifications and industry recognition correlate with higher leadership bands

### 2. Leadership Structure
**Score:** [0-5]
**Evidence:** [Cite: Executives Count = X, CVs = Y, LinkedIn = Z, Q1 = X pts, Q6 = X pts]
**Confidence:** [High/Medium/Low]
**Rationale:** [2-3 sentences based on executive team composition, roles, CVs and governance structure from Q1/Q6]
**How to Improve:** 
- → Ownership & Management section: add executive team members with positions and departments
- → Ownership & Management section: upload CVs and LinkedIn profiles for all executives
- → Profile Questions section: answer Q6 governance question to reflect actual management structure
- 💡 Moving from founder-only decisions (Q6a) to board governance (Q6d) indicates stronger structure
- 💡 A Founder + management team structure (Q1b) signals better leadership distribution

### 3. Leadership Behaviour
**Score:** [0-5]
**Evidence:** [Cite: Total Behaviour Score = X/30, Band = Y, Q1=X pts, Q2=X pts, Q3=X pts, Q4=X pts, Q5=X pts, Q6=X pts]
**Confidence:** [High/Medium/Low]
**Rationale:** [2-3 sentences explaining the score based on the 6 profile questions]
**How to Improve:** 
- → Profile Questions section: answer Q2 with scale ambition (c = 5pts) instead of lower options
- → Profile Questions section: answer Q3 with significant expansion or build to sell (c/d = 4-5pts)
- → Profile Questions section: answer Q5 with "very open" to advice (a = 5pts)
- 💡 The fastest score improvement comes from Q2 (motivation) and Q3 (growth ambition)
- 💡 Governance structure (Q6) moving to board-led adds maximum points

### Overall Assessment
**Total Score:** [X]/15
**Normalized to 100:** [Y]%
**Leadership Band:** [Scaler/Builder/Visionary/Survivalist/Passenger - based on behaviour score]
**Overall Confidence:** [High/Medium/Low]
**Evidence Summary:** [Brief summary referencing directors, executives, certifications and behaviour score]
**Final Analysis:** [Brief overall assessment referencing all three pillars]

### Leadership Behaviour Score Interpretation
**Scaler (26–30):** High ambition + high execution
**Builder (21–25):** High commitment + strong execution
**Visionary (16–20):** High ambition but weaker execution
**Survivalist (11–15):** Moderate commitment, limited ambition
**Passenger (6–10):** Low commitment / passive leadership`

      const result = await sendMessageToChatGPT(combinedMessage)

      const userId = auth?.currentUser?.uid;
      if (userId) {
        const aiEvalRef = doc(db, "aiLeadershipEvaluation", userId);
        await updateDoc(aiEvalRef, {
          result,
          timestamp: new Date(),
          profileSnapshot: profileData,
        }).catch(async () => {
          await setDoc(aiEvalRef, {
            result,
            timestamp: new Date(),
            profileSnapshot: profileData,
          });
        });
      }

      setAiEvaluationResult(result)
      setShowDetailedAnalysis(true)
      return result
    } catch (error) {
      console.error("AI Evaluation error:", error)
      setEvaluationError(`Failed to get AI evaluation: ${error.message}`)
    } finally {
      setIsEvaluating(false)
    }
  }

  const prepareDataForAiEvaluation = (data) => {
    let evaluationData = ""

    // ── LEADERSHIP CREDENTIALS (Directors) ──────────────────────────────
    evaluationData += `=== LEADERSHIP CREDENTIALS (DIRECTORS) ===\n`
    const directors = data?.ownershipManagement?.directors || []
    evaluationData += `Directors Count: ${directors.length}\n`
    directors.forEach((director, index) => {
      evaluationData += `\n--- Director ${index + 1} ---\n`
      evaluationData += `Name: ${director.name || "Not specified"}\n`
      evaluationData += `Position: ${director.position === "Other" ? director.customPosition || "Other" : director.position || "Not specified"}\n`
      evaluationData += `Executive Type: ${director.execType || "Not specified"}\n`
      evaluationData += `LinkedIn: ${director.linkedin ? "Provided" : "Not provided"}\n`
      evaluationData += `CV Uploaded: ${director.cv ? "Yes" : "No"}\n`
      evaluationData += `Nationality: ${director.nationality || "Not specified"}\n`
    })
    evaluationData += `\nDirectors with LinkedIn: ${directors.filter(d => d?.linkedin).length}\n`
    evaluationData += `Directors with CVs: ${directors.filter(d => d?.cv).length}\n`
    evaluationData += `Certifications Count: ${data?.documents?.otherCerts?.length || 0}\n`
    evaluationData += `Certifications Available: ${data?.documents?.otherCerts?.length > 0 ? "Yes" : "No"}\n`

    // ── LEADERSHIP STRUCTURE (Executives) ───────────────────────────────
    evaluationData += `\n=== LEADERSHIP STRUCTURE (EXECUTIVES) ===\n`
    const executives = data?.ownershipManagement?.executives || []
    evaluationData += `Executives Count: ${executives.length}\n`
    executives.forEach((executive, index) => {
      evaluationData += `\n--- Executive ${index + 1} ---\n`
      evaluationData += `Name: ${executive.name || "Not specified"}\n`
      evaluationData += `Position: ${executive.position === "Other" ? executive.customPosition || "Other" : executive.position || "Not specified"}\n`
      evaluationData += `Department: ${executive.department || "Not specified"}\n`
      evaluationData += `LinkedIn: ${executive.linkedin ? "Provided" : "Not provided"}\n`
      evaluationData += `CV Uploaded: ${executive.cv ? "Yes" : "No"}\n`
      evaluationData += `Nationality: ${executive.nationality || "Not specified"}\n`
    })
    evaluationData += `\nExecutives with LinkedIn: ${executives.filter(e => e?.linkedin).length}\n`
    evaluationData += `Executives with CVs: ${executives.filter(e => e?.cv).length}\n`
    evaluationData += `Total Leadership Team: ${directors.length + executives.length}\n`
    evaluationData += `Total with LinkedIn: ${directors.filter(d => d?.linkedin).length + executives.filter(e => e?.linkedin).length}\n`
    evaluationData += `Total with CVs: ${directors.filter(d => d?.cv).length + executives.filter(e => e?.cv).length}\n`

    // ── LEADERSHIP BEHAVIOUR (Q1–Q6) ────────────────────────────────────
    const behaviour = data?.ownershipManagement?.businessLeadership || {}

    const behaviourScoring = {
      ownerLed: { founder_led: 3, founder_plus_management: 5, professionally_managed: 4 },
      primaryMotivation: { secure_income: 1, stable_long_term: 3, scale_nationally: 5, build_to_sell: 4, procurement_contracts: 2 },
      growthAmbition: { maintain_current: 1, moderate_growth: 3, significant_expansion: 5, build_to_sell_investors: 4 },
      founderFullTime: { yes_full_time: 5, yes_multiple_businesses: 3, no_not_daily: 1 },
      opennessToAdvice: { very_open: 5, open_evaluate: 4, sometimes_open: 3, prefer_own: 2 },
      decisionGovernance: { founder_all: 2, founder_with_team: 4, management_founder_oversight: 5, board_led: 5 },
    }

    const q1Score = behaviourScoring.ownerLed[behaviour.ownerLed] ?? 0
    const q2Score = behaviourScoring.primaryMotivation[behaviour.primaryMotivation] ?? 0
    const q3Score = behaviourScoring.growthAmbition[behaviour.growthAmbition] ?? 0
    const q4Score = behaviourScoring.founderFullTime[behaviour.founderFullTime] ?? 0
    const q5Score = behaviourScoring.opennessToAdvice[behaviour.opennessToAdvice] ?? 0
    const q6Score = behaviourScoring.decisionGovernance[behaviour.decisionGovernance] ?? 0
    const totalBehaviourScore = q1Score + q2Score + q3Score + q4Score + q5Score + q6Score

    const getBehaviourBand = (score) => {
      if (score >= 26) return "Scaler"
      if (score >= 21) return "Builder"
      if (score >= 16) return "Visionary"
      if (score >= 11) return "Survivalist"
      if (score >= 6) return "Passenger"
      return "Passenger"
    }

    const getBIGScore = (score) => {
      if (score === 0) return 0
      if (score >= 26) return 5
      if (score >= 21) return 4
      if (score >= 16) return 3
      if (score >= 11) return 2
      return 1
    }

    evaluationData += `\n=== LEADERSHIP BEHAVIOUR ASSESSMENT (Q1–Q6) ===\n`
    evaluationData += `Q1 Owner Structure: ${behaviour.ownerLed || "Not answered"} → ${q1Score} pts\n`
    evaluationData += `Q2 Motivation: ${behaviour.primaryMotivation || "Not answered"} → ${q2Score} pts\n`
    evaluationData += `Q3 Growth Ambition: ${behaviour.growthAmbition || "Not answered"} → ${q3Score} pts\n`
    evaluationData += `Q4 Founder Involvement: ${behaviour.founderFullTime || "Not answered"} → ${q4Score} pts\n`
    evaluationData += `Q5 Openness to Advice: ${behaviour.opennessToAdvice || "Not answered"} → ${q5Score} pts\n`
    evaluationData += `Q6 Governance: ${behaviour.decisionGovernance || "Not answered"} → ${q6Score} pts\n`
    evaluationData += `\nTotal Behaviour Score: ${totalBehaviourScore}/30\n`
    evaluationData += `Leadership Band: ${getBehaviourBand(totalBehaviourScore)}\n`
    evaluationData += `BIG Score: ${getBIGScore(totalBehaviourScore)}/5\n`

    return evaluationData
  }

  const getProgressBarColor = (score) => {
    if (score > 90) return "#1B5E20" // Dark green
    if (score >= 81) return "#4CAF50" // Green
    if (score >= 61) return "#FF9800" // Orange
    if (score >= 41) return "#F44336" // Red
    return "#B71C1C" // Dark red
  }

  // UPDATED WEIGHTINGS based on new structure
  const calculateLeadershipScore = (data, aiEvaluationResult = "") => {
    console.log("Calculating leadership score with AI result:", !!aiEvaluationResult)
    const weightings = {
      credentials: 40,      // Leadership Credentials - Directors' experience, track record, education, certifications, recognition
      structure: 30,        // Leadership Structure - Executive management capability, team composition, leadership roles
      behaviour: 30         // Leadership Behaviour - Ambition, Commitment, Learning Mindset, Execution Discipline
    }

    const parsed = aiEvaluationResult ? parseAiEvaluationScores(aiEvaluationResult) : null
    const ai = parsed?.scores || parsed || {}

    const keyMap = {
      credentials: ["leadership_credentials"],
      structure: ["leadership_structure"],
      behaviour: ["leadership_behaviour"],
    }

    const categoryNames = {
      credentials: "Leadership Credentials",
      structure: "Leadership Structure",
      behaviour: "Leadership Behaviour"
    }

    const colors = ["#8D6E63", "#6D4C41", "#A67C52"]

    const breakdown = Object.entries(categoryNames).map(([key, label], i) => {
      const raw =
        keyMap[key].reduce((acc, k) => (ai[k] != null ? ai[k] : acc), null) ?? 0
      const percent = (raw / 5) * 100
      const weighted = percent * (weightings[key] / 100)
      return {
        name: label,
        score: Math.round(percent),
        weight: weightings[key],
        weightedScore: Math.round(weighted),
        color: colors[i],
        rawScore: raw,
        maxScore: 5,
        confidence: confidenceScores[key] || "Medium",
        evidence: evidenceTraceability[key] || "No evidence cited"
      }
    })

    const totalScore = Math.round(breakdown.reduce((s, x) => s + x.weightedScore, 0))
    console.log("Final calculated score:", totalScore)
    return { totalScore, breakdown }
  }

  // Updated score levels
  const getScoreLevel = (score) => {
    if (score >= 91)
      return {
        level: "Scaler",
        color: "#1B5E20",
        icon: CheckCircle,
        description: "High ambition + high execution",
      }
    if (score >= 81)
      return {
        level: "Builder",
        color: "#4CAF50",
        icon: CheckCircle,
        description: "High commitment + strong execution",
      }
    if (score >= 61)
      return {
        level: "Visionary",
        color: "#FF9800",
        icon: TrendingUp,
        description: "High ambition but weaker execution",
      }
    if (score >= 41)
      return {
        level: "Survivalist",
        color: "#F44336",
        icon: AlertCircle,
        description: "Moderate commitment, limited ambition",
      }
    return {
      level: "Passenger",
      color: "#B71C1C",
      icon: AlertCircle,
      description: "Low commitment / passive leadership",
    }
  }

  const scoreLevel = getScoreLevel(leadershipScore)
  const ScoreIcon = scoreLevel.icon

  const formatAiResult = (result) => {
    const cleanedResult = result.replace(/\*\*(.*?)\*\*/g, "$1")

    // Split by major sections (### headers)
    const sections = cleanedResult.split(/(?=###\s)/g)

    return sections.map((section, index) => {
      const trimmed = section.trim()
      if (!trimmed) return null

      // Check if this is a category section with "How to Improve"
      const isCategorySection = /^###\s+\d+\./.test(trimmed)

      if (isCategorySection) {
        // Split the category section into parts
        const lines = trimmed.split('\n').filter(line => line.trim())
        const header = lines[0]
        const content = lines.slice(1).join('\n')

        // Extract improvement section with special styling
        const improvementIndex = content.toLowerCase().indexOf('how to improve')
        let mainContent = content
        let improvementContent = ''

        if (improvementIndex !== -1) {
          mainContent = content.substring(0, improvementIndex)
          improvementContent = content.substring(improvementIndex)
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

              {/* Improvement Section with Special Styling - MATCHING FUNDABILITY SCORE CARD */}
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
        )
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
      )
    }).filter(Boolean)
  }

  return (
    <>
      {/* Enhanced Outside Card Design */}
      <div
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #faf8f6 100%)",
          borderRadius: "20px",
          boxShadow: "0 8px 32px rgba(141, 110, 99, 0.15)",
          border: "1px solid #e8ddd6",
          overflow: "hidden",
          position: "relative",
          width: "100%",
          minWidth: "210px",
        }}
      >
        {/* Header with gradient */}
        <div
          style={{
            background: "linear-gradient(135deg, #8d6e63 0%, #6d4c41 100%)",
            padding: "24px 30px 20px 30px",
            color: "white",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <h2
              style={{
                margin: "0",
                fontSize: "16px",
                fontWeight: "700",
                letterSpacing: "0.5px",
                whiteSpace: "nowrap",
              }}
            >
              Leadership Score
            </h2>

          </div>
          <p
            style={{
              margin: "0",
              fontSize: "13px",
              opacity: "0.9",
              fontWeight: "400",
            }}
          >
            Management capability assessment
          </p>

          {/* Decorative elements */}
          <div
            style={{
              position: "absolute",
              top: "-20px",
              right: "-20px",
              width: "80px",
              height: "80px",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "50%",
              opacity: "0.6",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              bottom: "-10px",
              left: "-10px",
              width: "60px",
              height: "60px",
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "50%",
            }}
          ></div>
        </div>

        {/* Main Content Area */}
        <div
          style={{
            padding: "24px",
            background: "white",
            textAlign: "center",
          }}
        >
          {/* Score Circle with Connected Badge */}
          <div
            style={{
              position: "relative",
              display: "inline-block",
              marginBottom: "24px",
            }}
          >
            {/* Main Score Circle */}
            <div
              style={{
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
                fontWeight: "bold",
              }}
            >
              <span
                style={{
                  fontSize: "26px",
                  fontWeight: "800",
                  lineHeight: "1",
                  marginBottom: "2px",
                }}
              >
                {leadershipScore}%
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: scoreLevel.color,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              ></span>

              {/* Animated ring */}
              <div
                style={{
                  position: "absolute",
                  top: "-6px",
                  left: "-6px",
                  right: "-6px",
                  bottom: "-6px",
                  border: `2px solid ${scoreLevel.color}20`,
                  borderRadius: "50%",
                  animation: "pulse 2s infinite",
                }}
              ></div>
            </div>

            {/* Connected Status Badge */}
            <div
              style={{
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
                whiteSpace: "nowrap",
              }}
            >
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
              marginTop: "17px",
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
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-2px)"
              e.target.style.boxShadow = "0 6px 20px rgba(93, 64, 55, 0.4)"
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0px)"
              e.target.style.boxShadow = "0 4px 16px rgba(93, 64, 55, 0.3)"
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
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false)
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
              border: "1px solid #ccc",
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
                fontWeight: "bold",
              }}
            >
              ×
            </button>

            <div style={{ padding: "30px 20px 20px 20px" }}>
              <h3
                style={{
                  margin: "0 0 20px 0",
                  fontSize: "24px",
                  fontWeight: "600",
                  color: "#5d4037",
                  textAlign: "center",
                }}
              >
                Leadership score breakdown
              </h3>

              <div
                style={{
                  textAlign: "center",
                  marginBottom: "30px",
                  padding: "20px",
                  background: "linear-gradient(135deg, #fdf8f6 0%, #f3e8dc 100%)",
                  borderRadius: "12px",
                  border: "1px solid #d6b88a",
                }}
              >
                <div
                  style={{
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
                    marginBottom: "15px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "28px",
                      fontWeight: "700",
                      color: "#5d4037",
                      lineHeight: "1",
                    }}
                  >
                    {leadershipScore}%
                  </span>
                  <span
                    style={{
                      color: scoreLevel.color,
                      fontSize: "12px",
                      fontWeight: "600",
                      marginTop: "4px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {scoreLevel.level}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#6d4c41",
                    marginBottom: "15px",
                    fontWeight: "500",
                  }}
                >
                  {scoreLevel.description}
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

              {/* About the Leadership Score section - UPDATED */}
              <div
                style={{
                  marginTop: "20px",
                  border: "1px solid #d7ccc8",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#8d6e63",
                    color: "white",
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                  onClick={() => setShowAboutScore(!showAboutScore)}
                >
                  <span>About the Leadership Score</span>
                  <ChevronDown
                    size={20}
                    style={{
                      transform: showAboutScore ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </div>
                {showAboutScore && (
                  <div
                    style={{
                      backgroundColor: "#f5f2f0",
                      padding: "20px",
                      color: "#5d4037",
                    }}
                  >
                    <p style={{ marginBottom: "16px", lineHeight: "1.6" }}>
                      The Leadership score evaluates the leadership capabilities and experience of business owners and
                      key executives. It assesses readiness to lead teams, attract investment, and scale operations
                      effectively.
                    </p>

                    <div
                      style={{
                        backgroundColor: "#efebe9",
                        padding: "16px",
                        borderRadius: "8px",
                        marginBottom: "16px",
                        borderLeft: "4px solid #8d6e63",
                      }}
                    >
                      <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>
                        Three key assessment areas:
                      </p>
                      <ul style={{ margin: "0", paddingLeft: "20px", color: "#5d4037" }}>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Leadership Credentials – 40%:</strong> Directors' experience, professional track record, education, certifications and recognition
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Leadership Structure – 30%:</strong> Executive management capability, team composition and leadership roles
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Leadership Behaviour – 30%:</strong> Assessed through Ambition, Commitment, Learning Mindset and Execution Discipline
                        </li>
                      </ul>
                    </div>

                    <div
                      style={{
                        backgroundColor: "#efebe9",
                        padding: "16px",
                        borderRadius: "8px",
                        marginBottom: "16px",
                        borderLeft: "4px solid #8d6e63",
                      }}
                    >
                      <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>Score interpretation:</p>
                      <ul style={{ margin: "0", paddingLeft: "20px", color: "#5d4037" }}>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>Scaler (26–30):</strong> High ambition + high execution
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>Builder (21–25):</strong> High commitment + strong execution
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>Visionary (16–20):</strong> High ambition but weaker execution
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>Survivalist (11–15):</strong> Moderate commitment, limited ambition
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>Passenger (6–10):</strong> Low commitment / passive leadership
                        </li>
                      </ul>
                    </div>

                    <div
                      style={{
                        backgroundColor: "#efebe9",
                        padding: "16px",
                        borderRadius: "8px",
                        marginBottom: "16px",
                        borderLeft: "4px solid #8d6e63",
                      }}
                    >
                      <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>
                        Purpose - the leadership score helps:
                      </p>
                      <ul style={{ margin: "0", paddingLeft: "20px", color: "#5d4037" }}>
                        <li style={{ marginBottom: "4px" }}>
                          Investors assess management team strength and capability
                        </li>
                        <li style={{ marginBottom: "4px" }}>Identify leadership development opportunities and gaps</li>
                        <li style={{ marginBottom: "4px" }}>Demonstrate readiness for scaling operations and teams</li>
                        <li style={{ marginBottom: "4px" }}>Support succession planning and board readiness</li>
                      </ul>
                    </div>

                    <p style={{ marginBottom: "0", lineHeight: "1.6", fontStyle: "italic", color: "#6d4c41" }}>
                      Strong leadership scores indicate proven ability to guide organizations through growth phases and
                      attract investment confidence.
                    </p>
                  </div>
                )}
              </div>

              {/* Score Breakdown Section - UPDATED */}
              <div
                style={{
                  marginTop: "20px",
                  border: "1px solid #d7ccc8",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#8d6e63",
                    color: "white",
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    fontWeight: "bold",

                  }}
                  onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
                >
                  <span>Score breakdown</span>
                  <ChevronDown
                    size={20}
                    style={{
                      transform: showScoreBreakdown ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </div>
                {showScoreBreakdown && (
                  <div
                    style={{
                      backgroundColor: "#f5f2f0",
                      padding: "20px",
                      color: "#5d4037",
                    }}
                  >
                    {scoreBreakdown.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "15px",
                          borderBottom: index < scoreBreakdown.length - 1 ? "1px solid #e8d8cf" : "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "white",
                          marginBottom: "5px",
                          borderRadius: "8px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            flex: "1",
                          }}
                        >
                          <div
                            style={{
                              backgroundColor: item.color,
                              width: "12px",
                              height: "12px",
                              borderRadius: "50%",
                              marginRight: "12px",
                              flexShrink: "0",
                            }}
                          ></div>
                          <div>
                            <div
                              style={{
                                fontWeight: "600",
                                color: "#5d4037",
                                fontSize: "14px",
                                marginBottom: "2px",
                              }}
                            >
                              {item.name}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#8d6e63",
                                fontStyle: "italic",
                              }}
                            >
                              {item.rawScore}/{item.maxScore} × {item.weight}% weight = {item.weightedScore}%
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              width: "80px",
                              height: "8px",
                              background: "#f3e8dc",
                              borderRadius: "4px",
                              overflow: "hidden",
                              border: "1px solid #d6b88a",
                            }}
                          >
                            <div
                              style={{
                                width: `${item.score}%`,
                                backgroundColor: getProgressBarColor(item.score),
                                height: "100%",
                                borderRadius: "4px",
                                transition: "width 0.3s ease",
                              }}
                            ></div>
                          </div>
                          <span
                            style={{
                              fontWeight: "600",
                              color: "#5d4037",
                              fontSize: "14px",
                              minWidth: "35px",
                              textAlign: "right",
                            }}
                          >
                            {item.score}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Detailed Analysis Section - UPDATED */}
              <div
                style={{
                  marginTop: "20px",
                  border: "1px solid #d7ccc8",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#8d6e63",
                    color: "white",
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                  onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
                >
                  <span>Detailed analysis</span>
                  <ChevronDown
                    size={20}
                    style={{
                      transform: showDetailedAnalysis ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </div>
                {showDetailedAnalysis && (
                  <div
                    style={{
                      backgroundColor: "#f5f2f0",
                      padding: "20px",
                      color: "#5d4037",
                    }}
                  >
                    {aiEvaluationResult ? (
                      <div
                        style={{
                          backgroundColor: "white",
                          padding: "20px",
                          borderRadius: "8px",
                          border: "1px solid #e8d8cf",
                          maxHeight: "400px",
                          overflowY: "auto",
                        }}
                      >
                        {formatAiResult(aiEvaluationResult)}
                      </div>
                    ) : (
                      <div style={{ color: "#5d4037", lineHeight: "1.6" }}>
                        {leadershipScore >= 91 && (
                          <div>
                            <p style={{ margin: "0 0 10px 0" }}>
                              <strong>Scaler: High ambition + high execution</strong>
                            </p>
                            <p style={{ margin: "0" }}>
                              You demonstrate exceptional drive combined with proven ability to execute effectively. This leadership profile is characteristic of founders and CEOs who have successfully scaled businesses and attract significant investment.
                            </p>
                          </div>
                        )}
                        {leadershipScore >= 81 && leadershipScore <= 90 && (
                          <div>
                            <p style={{ margin: "0 0 10px 0" }}>
                              <strong>Builder: High commitment + strong execution</strong>
                            </p>
                            <p style={{ margin: "0" }}>
                              You show strong dedication and consistent delivery of results. Your leadership profile demonstrates the commitment and execution capability needed to build sustainable organizations.
                            </p>
                          </div>
                        )}
                        {leadershipScore >= 61 && leadershipScore <= 80 && (
                          <div>
                            <p style={{ margin: "0 0 10px 0" }}>
                              <strong>Visionary: High ambition but weaker execution</strong>
                            </p>
                            <p style={{ margin: "0" }}>
                              You have ambitious vision but need to strengthen execution capability. Focus on building operational excellence and delivery mechanisms to complement your strategic thinking.
                            </p>
                          </div>
                        )}
                        {leadershipScore >= 41 && leadershipScore <= 60 && (
                          <div>
                            <p style={{ margin: "0 0 10px 0" }}>
                              <strong>Survivalist: Moderate commitment, limited ambition</strong>
                            </p>
                            <p style={{ margin: "0" }}>
                              You're operating with minimal strategic direction or growth focus. Consider developing clearer growth ambitions and strengthening your leadership commitment to drive organizational success.
                            </p>
                          </div>
                        )}
                        {leadershipScore <= 40 && (
                          <div>
                            <p style={{ margin: "0 0 10px 0" }}>
                              <strong>Passenger: Low commitment / passive leadership</strong>
                            </p>
                            <p style={{ margin: "0" }}>
                              Your current leadership approach shows limited engagement or contribution to organizational growth. Focus on developing active leadership capabilities, setting clear goals, and demonstrating commitment to business success.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {evaluationError && (
                      <div
                        style={{
                          marginTop: "15px",
                          padding: "12px",
                          backgroundColor: "#f8d7da",
                          color: "#721c24",
                          border: "1px solid #f5c6cb",
                          borderRadius: "6px",
                          fontSize: "14px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
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
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  )
}