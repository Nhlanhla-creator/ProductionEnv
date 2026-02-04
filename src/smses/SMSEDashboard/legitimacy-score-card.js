"use client"

import { useState, useEffect } from "react"
import { ChevronDown, RefreshCw, AlertCircle, Shield, CheckCircle, TrendingUp } from "lucide-react"
import { db, auth } from "../../firebaseConfig"
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore"
import { API_KEYS } from "../../API" // Make sure this path is correct
import { getFunctions, httpsCallable } from "firebase/functions";

export function LegitimacyScoreCard({ styles, profileData, onScoreUpdate, apiKey }) {
  const [showModal, setShowModal] = useState(false)
  const [legitimacyScore, setLegitimacyScore] = useState(0)
  const [scoreBreakdown, setScoreBreakdown] = useState([])
  const [aiEvaluationResult, setAiEvaluationResult] = useState("")
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluationError, setEvaluationError] = useState("")
  const [showAboutScore, setShowAboutScore] = useState(false)
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false)
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)
  const [triggeredByAuto, setTriggeredByAuto] = useState(false)

  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : ""
    return () => (document.body.style.overflow = "")
  }, [showModal])

  useEffect(() => {
    if (profileData && aiEvaluationResult) {
      const result = calculateLegitimacyScore(profileData, aiEvaluationResult)
      setLegitimacyScore(result.totalScore)
      setScoreBreakdown(result.breakdown)
      if (onScoreUpdate) onScoreUpdate(result.totalScore)
    }
  }, [profileData, aiEvaluationResult])

  const parseAiEvaluationScores = (text) => {
    console.log("Full AI response text:", text); // Debug log

    const categories = {
      foundational: ["Identity Markers", "Foundational Business Identity", "foundational"],
      digital: ["Digital Presence", "Digital Presence & Discoverability", "digital"],
      track: ["Track Record", "Track Record Indicators", "track"],
      thirdParty: ["Third-Party Validation", "Third-Party Validations", "third-party", "thirdparty"],
    }

    const scores = {}

    // Split text into lines for easier processing
    const lines = text.split('\n');
    console.log("Text lines:", lines); // Debug log

    // Then extract individual category scores
    Object.entries(categories).forEach(([key, labels]) => {
      let foundScore = 0

      // Try multiple label variations
      for (const label of labels) {
        console.log(`Looking for label: "${label}" in category: ${key}`); // Debug log

        // Most specific pattern for your AI response format: **1. Identity Markers: Score 5**
        const exactPattern = new RegExp(`\\*\\*\\d+\\.\\s*${label}\\s*:\\s*Score\\s+(\\d+)\\*\\*`, "i")

        // Alternative patterns
        const patterns = [
          exactPattern,
          new RegExp(`\\*\\*\\d+\\.\\s*${label}\\s*:\\s*Score\\s*=\\s*(\\d+)\\*\\*`, "i"), // with equals
          new RegExp(`${label}\\s*:\\s*Score\\s+(\\d+)`, "i"), // without bold/numbers
          new RegExp(`${label}\\s*:\\s*Score\\s*=\\s*(\\d+)`, "i"), // without bold/numbers with equals
          new RegExp(`\\d+\\.\\s*${label}\\s*:\\s*Score\\s+(\\d+)`, "i"), // numbered without bold
          new RegExp(`${label}[^\\d]*?(\\d+)`, "i"), // fallback: label followed by any number
        ]

        for (let i = 0; i < patterns.length; i++) {
          const pattern = patterns[i]
          const match = text.match(pattern)
          console.log(`Pattern ${i} for ${label}:`, pattern, "Match:", match); // Debug log

          if (match && match[1]) {
            foundScore = parseInt(match[1])
            console.log(`✓ Found score for ${key} (${label}): ${foundScore} using pattern ${i}`)
            break
          }
        }
        if (foundScore > 0) break
      }

      scores[key] = Math.min(Math.max(foundScore, 0), 5) // Ensure score is between 0-5
      console.log(`Final score for ${key}: ${scores[key]}`); // Debug log
    })

    // Extract normalized score - try multiple patterns
    const normalizedPatterns = [
      /Normalized Score:\s*[:=]?\s*\(?(\d+)\/\d+\)?\s*\*\s*100\s*=\s*(\d+)/i,
      /Normalized Score:\s*[:=]?\s*(\d+)/i,
      /\((\d+)\/\d+\)\s*\*\s*100\s*=\s*(\d+)/i, // (22/25) * 100 = 88
      /=\s*(\d+)$/m // Just look for = followed by number at end of line
    ]

    for (const pattern of normalizedPatterns) {
      const match = text.match(pattern)
      console.log("Normalized pattern:", pattern, "Match:", match); // Debug log
      if (match) {
        scores.normalized = parseInt(match[match.length - 1]) // Get the last captured group
        console.log(`✓ Found normalized score: ${scores.normalized}`)
        break
      }
    }

    console.log("Final parsed AI scores:", scores)
    return scores
  }

  const refreshAiEvaluation = async () => {
    const userId = auth?.currentUser?.uid
    if (!userId) return

    try {
      const aiEvalRef = doc(db, "aiLegitimacyEvaluation", userId)
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
        if (data.triggerLegitimacyEvaluation === true && !isEvaluating) {
          console.log("Trigger detected: Running legitimacy AI evaluation...")
          setTriggeredByAuto(true)
          await runAiEvaluation()
          // Reset the trigger to prevent repeated evaluations
          await updateDoc(docRef, {
            triggerLegitimacyEvaluation: false,
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
    const aiEvalRef = doc(db, "aiLegitimacyEvaluation", userId)
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

  // AI Evaluation Function
  const sendMessageToChatGPT = async (message) => {
    try {
      const functions = getFunctions();
      const generateLegitimacyAnalysis = httpsCallable(functions, "generateLegitimacyAnalysis");
      const resp = await generateLegitimacyAnalysis({
        prompt: message,
      });

      const content = resp?.data?.content;
      if (!content) {
        throw new Error("Invalid response format from server");
      }
      return content;
    } catch (error) {
      console.error("ChatGPT API Error (via functions):", error);
      throw error;
    }
  };

  // -- Helpers: normalize social links (accepts URL or handle) --
  const SOCIAL_BASE = {
    facebook: "https://facebook.com/",
    x: "https://x.com/",
    twitter: "https://twitter.com/", // fallback if you ever store 'twitter'
    linkedin: "https://www.linkedin.com/in/",
    instagram: "https://instagram.com/",
    youtube: "https://youtube.com/",
    website: "", // pass through
  }

  const cleanStr = (v) => (typeof v === "string" ? v.trim() : "")

  const normalizeSocial = (platform, value) => {
    const v = cleanStr(value)
    if (!v) return ""

    // Return URLs as-is
    if (/^https?:\/\//i.test(v)) return v

    // Remove leading '@' for handles
    const handle = v.replace(/^@/, "")

    // Pick base URL
    const base =
      platform === "x"
        ? SOCIAL_BASE.x
        : platform === "twitter"
          ? SOCIAL_BASE.twitter
          : SOCIAL_BASE[platform] ?? ""

    // Website gets passed through (if someone typed a bare domain, prefix https)
    if (platform === "website") {
      if (/^https?:\/\//i.test(handle)) return handle
      return `https://${handle}`
    }

    // Construct normalized URL from handle
    return base ? `${base}${handle}` : handle
  }

  const presentOrNot = (url) => (url ? url : "Not provided")

  useEffect(() => {
    if (!auth?.currentUser?.uid || !apiKey) return

    const userId = auth.currentUser.uid
    const profileRef = doc(db, "universalProfiles", userId)
    const aiEvalRef = doc(db, "aiLegitimacyEvaluation", userId)

    const unsubscribe = onSnapshot(profileRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        if (data.triggerLegitimacyEvaluation === true && !isEvaluating) {
          console.log("Trigger detected: Running legitimacy AI evaluation...")
          setTriggeredByAuto(true)
          const result = await runAiEvaluation(userId)
          await updateDoc(profileRef, { triggerLegitimacyEvaluation: false })
          // Save result to aiLegitimacyEvaluation
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
            // Don't automatically show the evaluation, just set the result
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
      // Prepare data for AI evaluation
      const evaluationData = prepareDataForAiEvaluation(profileData)

      const combinedMessage = `Evaluate the legitimacy of the following business using the BIG Legitimacy Scorecard rubric.

IMPORTANT FORMATTING REQUIREMENTS:
- Use clear section headers with ###
- Provide specific, actionable improvement recommendations for EACH category
- Keep rationale concise but insightful

Instructions:
- Score each of the 4 categories below from 0 to 5 using the rubric where:
  • 0 = No evidence or very poor
  • 1 = Minimal/poor evidence  
  • 2 = Below average
  • 3 = Average/acceptable
  • 4 = Good/strong evidence
  • 5 = Excellent/outstanding
- Provide a short rationale for each score (2-3 sentences)
- FOR EACH CATEGORY, include a "How to Improve" section with 3-5 specific, actionable steps to increase the score
- At the end, give a total score out of 20, normalize it to 100, and assign a legitimacy band:
  • 85–100: Highly Legitimate
  • 65–84: Credible but Improving
  • 50–64: Emerging Presence
  • <50: Needs Credibility Work

CRITICAL: For improvement recommendations, be SPECIFIC and ACTIONABLE. Instead of vague advice like "improve online presence," provide concrete steps like:
- "Create and publish 3 case studies showcasing client success stories within the next 3 months"
- "Register for BBBEE certification and complete the application within 6 months"
- "Launch a professional website with company portfolio and contact information by next quarter"
- "Establish active LinkedIn and Facebook business pages with weekly content updates"

Categories to evaluate:
1. Identity Markers (website, domain email, registered address, company logo)
2. Digital Presence (Google search, online visibility, social links, discoverability)
3. Track Record (clients, years in operation, projects, financials, revenue history)
4. Third-Party Validation (certifications, awards, memberships, accreditations)

Input Data:
${evaluationData}

OUTPUT FORMAT:
### 1. Identity Markers
**Score:** [0-5]
**Rationale:** [2-3 sentence explanation]
**How to Improve:** 
• [Specific action 1 with timeline]
• [Specific action 2 with measurable goal]
• [Specific action 3 with concrete steps]

### 2. Digital Presence
**Score:** [0-5]
**Rationale:** [2-3 sentence explanation]
**How to Improve:** 
• [Specific action 1 with timeline]
• [Specific action 2 with measurable goal]
• [Specific action 3 with concrete steps]

### 3. Track Record
**Score:** [0-5]
**Rationale:** [2-3 sentence explanation]
**How to Improve:** 
• [Specific action 1 with timeline]
• [Specific action 2 with measurable goal]
• [Specific action 3 with concrete steps]

### 4. Third-Party Validation
**Score:** [0-5]
**Rationale:** [2-3 sentence explanation]
**How to Improve:** 
• [Specific action 1 with timeline]
• [Specific action 2 with measurable goal]
• [Specific action 3 with concrete steps]

### Overall Assessment
**Total Score:** [X]/20
**Normalized to 100:** [Y]%
**Legitimacy Band:** [Band Name]
**Final Analysis:** [Brief overall assessment with key recommendations]`

      const result = await sendMessageToChatGPT(combinedMessage)
      setAiEvaluationResult(result)
      setShowDetailedAnalysis(true)
      return result // Return result to be used elsewhere
    } catch (error) {
      console.error("AI Evaluation error:", error)
      setEvaluationError(`Failed to get AI evaluation: ${error.message}`)
    } finally {
      setIsEvaluating(false)
    }
  }

  const prepareDataForAiEvaluation = (data) => {
    let evaluationData = ""

    // Identity Markers
    evaluationData += `\n=== IDENTITY MARKERS ===\n`
    evaluationData += `Website: ${data?.contactDetails?.website || "Not provided"}\n`
    evaluationData += `Email: ${data?.contactDetails?.email || "Not provided"}\n`
    evaluationData += `Company Logo: ${data?.entityOverview?.companyLogo?.length > 0 ? "Available" : "Not provided"}\n`
    evaluationData += `Physical Address: ${data?.contactDetails?.physicalAddress || "Not provided"}\n`
    evaluationData += `Proof of Address: ${data?.documents?.proofOfAddress?.length > 0 ? "Available" : "Not provided"}\n`

    // Digital Presence
    evaluationData += `\n=== DIGITAL PRESENCE ===\n`

    const socialsRaw = {
      website: data?.contactDetails?.website,
      facebook: data?.contactDetails?.facebook,
      x: data?.contactDetails?.x || data?.contactDetails?.twitter,
      linkedin: data?.contactDetails?.linkedin,
      instagram: data?.contactDetails?.instagram,
      youtube: data?.contactDetails?.youtube,
    }

    const socialsNorm = {
      Website: normalizeSocial("website", socialsRaw.website),
      "LinkedIn URL": normalizeSocial("linkedin", socialsRaw.linkedin),
      "Facebook URL": normalizeSocial("facebook", socialsRaw.facebook),
      "Instagram URL": normalizeSocial("instagram", socialsRaw.instagram),
      "X (Twitter) URL": normalizeSocial("x", socialsRaw.x),
      "YouTube URL": normalizeSocial("youtube", socialsRaw.youtube),
    }

    Object.entries(socialsNorm).forEach(([label, url]) => {
      evaluationData += `${label}: ${presentOrNot(url)}\n`
    })

    // Simple count for the AI to use in scoring Digital Presence
    const socialPresentCount = Object.values(socialsNorm).filter(Boolean).length
    evaluationData += `Social Links Present (out of 6): ${socialPresentCount}\n`

    // Keep your visibility hint
    evaluationData += `Online Visibility: ${socialsNorm["Website"] ? "Present" : "Limited"}\n`

    // Track Record
    evaluationData += `\n=== TRACK RECORD ===\n`
    evaluationData += `Years in Operation: ${data?.entityOverview?.yearsInOperation || "Not specified"}\n`
    evaluationData += `Operation Stage: ${data?.entityOverview?.operationStage || "Not specified"}\n`
    evaluationData += `Key Clients: ${data?.productsServices?.keyClients?.map(c => c?.name || "").filter(Boolean).join(", ") || "Not provided"}\n`
    evaluationData += `Has Paying Customers: ${data?.enterpriseReadiness?.hasPayingCustomers || "Not specified"}\n`
    evaluationData += `Annual Revenue: ${data?.financialOverview?.annualRevenue || "Not provided"}\n`
    evaluationData += `Generates Revenue: ${data?.financialOverview?.generatesRevenue || "Not specified"}\n`

    // Third-Party Validation
    evaluationData += `\n=== THIRD-PARTY VALIDATION ===\n`
    evaluationData += `BBBEE Certificate: ${data?.documents?.bbbeeCert?.length > 0 ? "Available" : "Not provided"}\n`
    evaluationData += `Industry Accreditations: ${data?.documents?.industryAccreditationDocs || "Not provided"}\n`
    evaluationData += `Support Letters: ${data?.documentUpload?.supportLetters?.length > 0 ? "Available" : "Not provided"}\n`
    evaluationData += `Has Mentor: ${data?.enterpriseReadiness?.hasMentor || "Not specified"}\n`

    // Additional context
    evaluationData += `\n=== ADDITIONAL CONTEXT ===\n`
    evaluationData += `Business Description: ${data?.entityOverview?.businessDescription || data?.productsServices?.companyProfile || "Not provided"}\n`
    evaluationData += `Industry: ${data?.entityOverview?.industry || "Not specified"}\n`
    evaluationData += `Company Size: ${data?.entityOverview?.companySize || "Not specified"}\n`

    return evaluationData
  }

  // Function to get progress bar color based on score with updated color scheme
  const getProgressBarColor = (score) => {
    if (score > 90) return "#1B5E20" // Dark green
    if (score >= 81) return "#4CAF50" // Green
    if (score >= 61) return "#FF9800" // Orange
    if (score >= 41) return "#F44336" // Red
    return "#B71C1C" // Dark red
  }

  const mapStageToCategory = (stage) => {
    const s = (stage || "").toLowerCase()
    if (["pre-seed", "preseed"].includes(s)) return "pre-seed"
    if (["seed"].includes(s)) return "seed"
    if (["series a", "seriesa"].includes(s)) return "seriesa"
    if (["series b", "seriesb"].includes(s)) return "seriesb"
    if (["early-growth", "growth", "scale-up"].includes(s)) return "growth"
    return "maturity"
  }

  // UPDATED WEIGHTINGS: Team & leadership removed, others redistributed
  const weightingsByStage = {
    "pre-seed": { foundational: 36, digital: 29, track: 21, thirdParty: 14 },
    "seed": { foundational: 36, digital: 29, track: 21, thirdParty: 14 },
    "seriesa": { foundational: 36, digital: 29, track: 21, thirdParty: 14 },
    "seriesb": { foundational: 36, digital: 29, track: 21, thirdParty: 14 },
    "growth": { foundational: 36, digital: 29, track: 21, thirdParty: 14 },
    "maturity": { foundational: 36, digital: 29, track: 21, thirdParty: 14 },
  }

  const calculateLegitimacyScore = (data, aiEvaluationResult = "") => {
    console.log("Calculating legitimacy score with AI result:", !!aiEvaluationResult)
    const stage = mapStageToCategory(data?.entityOverview?.operationStage || "seed")
    const weightings = weightingsByStage[stage]
    const aiScores = aiEvaluationResult ? parseAiEvaluationScores(aiEvaluationResult) : null
    console.log("AI scores extracted:", aiScores)

    const categoryNames = {
      foundational: "Foundational business identity",
      digital: "Digital presence & discoverability",
      track: "Track record indicators",
      thirdParty: "Third-party validations",
    }

    const colors = ["#8D6E63", "#6D4C41", "#A67C52", "#D7CCC8"]

    const breakdown = Object.entries(categoryNames).map(([key, label], i) => {
      const aiRaw = aiScores?.[key] ?? 0
      const percent = (aiRaw / 5) * 100
      const weighted = percent * (weightings[key] / 100)
      return {
        name: label,
        score: Math.round(percent),
        weight: weightings[key],
        weightedScore: Math.round(weighted),
        color: colors[i],
        rawScore: aiRaw,
        maxScore: 5,
      }
    })

    const totalScore = Math.round(breakdown.reduce((sum, item) => sum + item.weightedScore, 0))
    console.log("Final calculated score:", totalScore)
    return { totalScore, breakdown }
  }

  // Updated score levels with new labels and descriptions
  const getScoreLevel = (score) => {
    if (score >= 91)
      return {
        level: "Market Leader",
        color: "#1B5E20",
        icon: CheckCircle,
        description: "Your business demonstrates exceptional credibility and a strong, trusted market presence.",
      }
    if (score >= 81)
      return {
        level: "Trusted Brand",
        color: "#4CAF50",
        icon: CheckCircle,
        description: "Well-established with a professional identity and growing influence in the market.",
      }
    if (score >= 61)
      return {
        level: "Emerging Force",
        color: "#FF9800",
        icon: TrendingUp,
        description: "Good foundations in place; refining presence will strengthen credibility further.",
      }
    if (score >= 41)
      return {
        level: "Building Credibility",
        color: "#F44336",
        icon: AlertCircle,
        description: "Key elements of professional identity exist, but there are noticeable gaps to address.",
      }
    return {
      level: "Early Stage Identity",
      color: "#B71C1C",
      icon: AlertCircle,
      description: "Foundational improvements needed to build trust and a visible, professional brand.",
    }
  }

  const scoreLevel = getScoreLevel(legitimacyScore)
  const ScoreIcon = scoreLevel.icon

  // UPDATED: Format AI result with improvement actions styling
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
          width: "100%", // Add this line to make it full width
          minWidth: "210px", // Add this for minimum width
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
              Legitimacy Score
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
            Business credibility assessment
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
                {legitimacyScore}%
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

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "16px",
            }}
          >
            {/* Action Button */}
            <button
              onClick={() => setShowModal(true)}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #5d4037 0%, #4a2c20 100%)",
                color: "white",
                marginTop: "3px",
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
                Legitimacy score breakdown
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
                    {legitimacyScore}%
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
                    fontSize: "16px",
                    color: "#6d4c41",
                    marginBottom: "15px",
                  }}
                >
                  <span>Business stage: </span>
                  <span
                    style={{
                      fontWeight: "600",
                      color: "#5d4037",
                      textTransform: "capitalize",
                    }}
                  >
                    {profileData?.entityOverview?.operationStage || "Ideation"}
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

              {/* About the Legitimacy Score section */}
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
                  <span>About the legitimacy score</span>
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
                      The legitimacy score assesses how professionally and credibly a business presents itself in the
                      market — beyond just legal compliance. It focuses on brand presence, digital identity, and
                      operational transparency that help build trust with funders, partners, and clients.
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
                        Four key assessment areas:
                      </p>
                      <ul style={{ margin: "0", paddingLeft: "20px", color: "#5d4037" }}>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Foundational business identity (36%):</strong> Professional website, business email, logo,
                          and company materials
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Digital presence (29%):</strong> Social media presence and online discoverability
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Track record (21%):</strong> Years of operation, client portfolio, and revenue history
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Third-party validations (14%):</strong> Industry certifications, accreditations, and
                          compliance certificates
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
                          <strong>91-100% (Market Leader):</strong> Your business demonstrates exceptional credibility
                          and a strong, trusted market presence.
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>81-90% (Trusted Brand):</strong> Well-established with a professional identity and
                          growing influence in the market.
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>61-80% (Emerging Force):</strong> Good foundations in place; refining presence will
                          strengthen credibility further.
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>41-60% (Building Credibility):</strong> Key elements of professional identity exist,
                          but there are noticeable gaps to address.
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>0-40% (Early Stage Identity):</strong> Foundational improvements needed to build trust
                          and a visible, professional brand.
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
                        Stage-adjusted weighting:
                      </p>
                      <p style={{ margin: "0", color: "#5d4037" }}>
                        Early-stage companies are weighted more heavily on foundational elements like professional
                        websites and branding, while mature companies are assessed primarily on track record and
                        third-party validations.
                      </p>
                    </div>

                    <p style={{ marginBottom: "0", lineHeight: "1.6", fontStyle: "italic", color: "#6d4c41" }}>
                      The stronger your public presence and brand signals, the higher your legitimacy score — helping
                      your business stand out as credible and trustworthy in a crowded marketplace.
                    </p>
                  </div>
                )}
              </div>

              {/* Score Breakdown Section */}
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
                              {item.rawScore}/{item.maxScore} items × {item.weight}% weight = {item.weightedScore}%
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
                                height: "100%",
                                background: getProgressBarColor(item.score),
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

              {/* Detailed Analysis Section */}
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
                        {legitimacyScore >= 91 && (
                          <p style={{ margin: "0" }}>
                            <strong>Market Leader status achieved.</strong> {scoreLevel.description} You have
                            established exceptional credibility that positions you as a trusted leader in your industry.
                          </p>
                        )}
                        {legitimacyScore >= 81 && legitimacyScore <= 90 && (
                          <p style={{ margin: "0" }}>
                            <strong>Trusted Brand recognition.</strong> {scoreLevel.description} Your business shows
                            strong legitimacy credentials that inspire confidence in stakeholders.
                          </p>
                        )}
                        {legitimacyScore >= 61 && legitimacyScore <= 80 && (
                          <p style={{ margin: "0" }}>
                            <strong>Emerging Force in the market.</strong> {scoreLevel.description} You're building
                            momentum and credibility that will serve as a strong foundation for growth.
                          </p>
                        )}
                        {legitimacyScore >= 41 && legitimacyScore <= 60 && (
                          <p style={{ margin: "0" }}>
                            <strong>Building Credibility phase.</strong> {scoreLevel.description} Focus on strengthening
                            your digital presence and professional documentation to advance to the next level.
                          </p>
                        )}
                        {legitimacyScore <= 40 && (
                          <p style={{ margin: "0" }}>
                            <strong>Early Stage Identity development.</strong> {scoreLevel.description} This is an
                            exciting opportunity to build a strong professional foundation from the ground up.
                          </p>
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
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}