"use client"

import { useState, useEffect } from "react"
import { ChevronDown, RefreshCw, AlertCircle, Users, CheckCircle, TrendingUp } from "lucide-react"
import { db, auth } from "../../firebaseConfig"
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore"
import { API_KEYS } from "../../API" // Make sure this path is correct
import { getFunctions, httpsCallable } from "firebase/functions";

export function LeadershipScoreCard({ styles, profileData, onScoreUpdate,apiKey }) {
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
    leadership_experience: [
      "Leadership Experience",
      "Experience",
      "Leadership Experience \\(Years in Operation\\)"
    ],
    leadership_team: [
      "Team Management",
      "Team Size",
      "Board Members Count",
      "Team"
    ],
    leadership_recognition: [
      "Recognition & Education",
      "Certifications Count",
      "Recognition",
      "Education"
    ]
  }

  const cleanedText = text.replace(/\*\*(.*?)\*\*/g, "$1")
  const scores = {}

  // Helper: extract the section body after a header containing the label
  const findSectionBody = (label) => {
    const sectionRe = new RegExp(
      // start of line + optional ### or number., then label, then capture until next ###/number. or end
      `(^|\\n)\\s*(?:#{1,6}\\s*)?\\d*\\.?\\s*${label}[^\\n]*\\n([\\s\\S]*?)(?=\\n\\s*(?:#{1,6}\\s*|\\d+\\.\\s|$))`,
      "i"
    )
    const m = cleanedText.match(sectionRe)
    return m ? m[2] : null
  }

  Object.entries(categories).forEach(([key, labels]) => {
    let found = null
    for (const label of labels) {
      const body = findSectionBody(label)
      if (body) {
        // Common bullet variants inside the section
        const scorePatterns = [
          /Score\s*:\s*(\d(?:\.\d)?)/i,               // "- Score: 4.5"
          /(\d(?:\.\d)?)\s*\/\s*5/i,                  // "4.5/5"
          /(\d(?:\.\d)?)\s*out\s*of\s*5/i,            // "4 out of 5"
          /(\d(?:\.\d)?)\s*\*\s*\d+%/i                // "4 * 50%"
        ]
        for (const p of scorePatterns) {
          const mm = body.match(p)
          if (mm) { found = parseFloat(mm[1]); break }
        }
      }
      if (found != null) break

      // fallback: single-line forms with label + score on same line
      const inlinePatterns = [
        new RegExp(`${label}[^\\d]*(\\d(?:\\.\\d)?)\\s*(?:/\\s*5)?`, "i"),
        new RegExp(`${label}[^\\d]*(\\d(?:\\.\\d)?)\\s*out\\s*of\\s*5`, "i"),
        new RegExp(`${label}[^\\d]*(\\d(?:\\.\\d)?)\\s*\\*\\s*\\d+%`, "i"),
        new RegExp(`${label}[^\\d]*Score\\s*:?\\s*(\\d(?:\\.\\d)?)`, "i"),
      ]
      for (const p of inlinePatterns) {
        const mm = cleanedText.match(p)
        if (mm) { found = parseFloat(mm[1]); break }
      }
      if (found != null) break
    }
    if (found != null) scores[key] = Math.min(Math.max(found, 0), 5)
  })

  // Final score (handle lines like "Total Score: 2 + 1.35 + 1 = 4.35")
  let finalScore = null
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

  // Normalized to 100
  let normalizedScore = null
  const normPattern = cleanedText.match(/Normalized\s*(?:to|at)\s*100\s*:?[\s]*([\d.]+)/i)
  if (normPattern) normalizedScore = parseFloat(normPattern[1])

  // Band: support both "Leadership Band:" and "Band:"
  let band = null
  const bandPattern = cleanedText.match(/(?:Leadership\s*Band|Band)\s*:\s*([^\n]+)/i)
  if (bandPattern) band = bandPattern[1].trim()

  console.log("Parsed AI scores:", scores, { finalScore, normalizedScore, band })
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
      // Optional: model: "gpt-4o", max_tokens: 2000, temperature: 0.3
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
  }, [auth?.currentUser?.uid,apiKey, isEvaluating])

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

      const combinedMessage = `Evaluate the leadership strength of the following business leader using the Leadership Scorecard rubric.

Instructions:
- Score each of the 3 categories below from 0 to 5 using the rubric where:
  • 0 = No evidence or very poor
  • 1 = Minimal/poor evidence  
  • 2 = Below average
  • 3 = Average/acceptable
  • 4 = Good/strong evidence
  • 5 = Excellent/outstanding
- Provide a short rationale for each score (2-3 sentences)
- At the end, give a total score out of 10, normalize it to 100, and assign a leadership band:
  • 85–100: Exceptional Leader
  • 65–84: Strong Leader
  • 50–64: Developing Leader
  • <50: Needs Development
  
Categories to evaluate (single metric per category):
1. Leadership Experience (ONLY Years in Operation)
2. Team Management (ONLY Board Members Count) 
3. Recognition & Education (ONLY Certifications Count)
Input Data:
${evaluationData}`

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

    // Leadership Experience - ONLY YEARS
    evaluationData += `\n=== LEADERSHIP EXPERIENCE ===\n`
    evaluationData += `Years of Experience: ${data?.entityOverview?.yearsInOperation || "not specified"}\n` // Using yearsInOperation

    // Team Management - ONLY BOARD MEMBERS
    evaluationData += `\n=== TEAM MANAGEMENT ===\n`
    evaluationData += `Board Members: ${data?.ownershipManagement?.directors?.length || "not specified"}\n` // Using directors array length

    // Recognition & Education - ONLY CERTIFICATIONS
    evaluationData += `\n=== RECOGNITION & EDUCATION ===\n`
    evaluationData += `Certifications: ${data?.documents?.otherCerts?.length || 0}\n` // Using otherCerts array length

    return evaluationData
  }

  const getProgressBarColor = (score) => {
    if (score > 90) return "#1B5E20" // Dark green
    if (score >= 81) return "#4CAF50" // Green
    if (score >= 61) return "#FF9800" // Orange
    if (score >= 41) return "#F44336" // Red
    return "#B71C1C" // Dark red
  }

const calculateLeadershipScore = (data, aiEvaluationResult = "") => {
  console.log("Calculating leadership score with AI result:", !!aiEvaluationResult)
  const weightings = { experience: 40, team: 35, recognition: 25 }

  const parsed = aiEvaluationResult ? parseAiEvaluationScores(aiEvaluationResult) : null
  const ai = parsed?.scores || parsed || {}

  // map parsed keys -> breakdown keys
  const keyMap = {
    experience: ["leadership_experience", "experience"],
    team: ["leadership_team", "team"],
    recognition: ["leadership_recognition", "recognition"],
  }

  const categoryNames = {
    experience: "Leadership experience",
    team: "Team management",
    recognition: "Recognition & education",
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
    }
  })

  const totalScore = Math.round(breakdown.reduce((s, x) => s + x.weightedScore, 0))
  console.log("Final calculated score:", totalScore)
  return { totalScore, breakdown }
}


  // Updated score levels with new labels from the image
  const getScoreLevel = (score) => {
    if (score >= 91)
      return {
        level: "Visionary Leadership",
        color: "#1B5E20",
        icon: CheckCircle,
        description: "Proven ability to lead complex organizations with strategic foresight.",
      }
    if (score >= 81)
      return {
        level: "Seasoned Leadership",
        color: "#4CAF50",
        icon: CheckCircle,
        description: "Excellent management strength and inspiring organizational leadership.",
      }
    if (score >= 61)
      return {
        level: "Rising Leadership",
        color: "#FF9800",
        icon: TrendingUp,
        description: "Strong foundations with clear potential for scaling influence and impact.",
      }
    if (score >= 41)
      return {
        level: "Developing Leadership",
        color: "#F44336",
        icon: AlertCircle,
        description: "Growing experience with opportunities to strengthen leadership depth.",
      }
    return {
      level: "Foundational Stage Leadership",
      color: "#B71C1C",
      icon: AlertCircle,
      description: "Building the capabilities and credibility needed to inspire teams and investors.",
    }
  }

  const scoreLevel = getScoreLevel(leadershipScore)
  const ScoreIcon = scoreLevel.icon

  const formatAiResult = (result) => {
    const cleanedResult = result.replace(/\*\*(.*?)\*\*/g, "$1") // Remove ** formatting

    const sections = cleanedResult.split(/(?=\d+\.\s|\*\*[^*]+\*\*:|\n\n)/)

    return sections
      .map((section, index) => {
        const trimmed = section.trim()
        if (!trimmed) return null

        const isHeader = /^\d+\.\s/.test(trimmed)

        return (
          <div key={index} style={{ marginBottom: "15px" }}>
            {isHeader ? (
              <div
                style={{
                  fontWeight: "bold",
                  color: "#5d4037",
                  fontSize: "16px",
                  marginBottom: "8px",
                  paddingBottom: "5px",
                  borderBottom: "1px solid #e8d8cf",
                }}
              >
                {trimmed.split("\n")[0]}
              </div>
            ) : null}
            <div
              style={{
                fontSize: "14px",
                lineHeight: "1.6",
                color: "#6d4c41",
                whiteSpace: "pre-wrap",
              }}
            >
              {isHeader ? trimmed.split("\n").slice(1).join("\n") : trimmed}
            </div>
          </div>
        )
      })
      .filter(Boolean)
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
    maxWidth: "000px", // Add this to limit maximum width (optional)
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
        marginTop:"17px",
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
                    fontSize: "16px",
                    color: "#6d4c41",
                    marginBottom: "15px",
                  }}
                >
                  <span>Leadership status: </span>
                  <span
                    style={{
                      fontWeight: "600",
                      color: "#5d4037",
                      textTransform: "capitalize",
                    }}
                  >
                    {profileData?.ownershipManagement?.position || "Business leader"}
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

              {/* About the Leadership Score section */}
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
                          <strong>Leadership experience (40%):</strong> Years of management experience, positions held,
                          and business complexity managed
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Team management (35%):</strong> Scale of teams led, organizational structure, and
                          revenue management success
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Recognition & education (25%):</strong> Educational qualifications, certifications,
                          awards, and industry recognition
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
                          <strong>91-100% (Visionary Leadership):</strong> Proven ability to lead complex organizations
                          with strategic foresight.
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>81-90% (Seasoned Leadership):</strong> Excellent management strength and inspiring
                          organizational leadership.
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>61-80% (Rising Leadership):</strong> Strong foundations with clear potential for
                          scaling influence and impact.
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>41-60% (Developing Leadership):</strong> Growing experience with opportunities to
                          strengthen leadership depth.
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>0-40% (Foundational Stage Leadership):</strong> Building the capabilities and
                          credibility needed to inspire teams and investors.
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
                        {leadershipScore >= 91 && (
                          <p style={{ margin: "0" }}>
                            <strong>Visionary Leadership achieved.</strong> {scoreLevel.description} You demonstrate
                            outstanding leadership experience with proven ability to manage complex organizations, lead
                            large teams, and drive significant business results.
                          </p>
                        )}
                        {leadershipScore >= 81 && leadershipScore <= 90 && (
                          <p style={{ margin: "0" }}>
                            <strong>Seasoned Leadership demonstrated.</strong> {scoreLevel.description} Your leadership
                            profile demonstrates the competence needed for business growth and would inspire confidence
                            from investors and stakeholders.
                          </p>
                        )}
                        {leadershipScore >= 61 && leadershipScore <= 80 && (
                          <p style={{ margin: "0" }}>
                            <strong>Rising Leadership with growth potential.</strong> {scoreLevel.description} Continued
                            development in areas like team scale, industry recognition, or educational advancement could
                            significantly enhance your leadership profile.
                          </p>
                        )}
                        {leadershipScore >= 41 && leadershipScore <= 60 && (
                          <p style={{ margin: "0" }}>
                            <strong>Developing Leadership requiring growth.</strong> {scoreLevel.description} Focus on
                            building management experience and gradually taking on larger leadership responsibilities.
                          </p>
                        )}
                        {leadershipScore <= 40 && (
                          <p style={{ margin: "0" }}>
                            <strong>Foundational Stage Leadership development essential.</strong>{" "}
                            {scoreLevel.description} Focus on building management experience, pursuing relevant
                            education, and gradually taking on larger leadership responsibilities.
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