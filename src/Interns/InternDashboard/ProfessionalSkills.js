"use client"

import { useState, useEffect } from "react"
import { ChevronDown, CheckCircle, TrendingUp, AlertCircle, Brain, RefreshCw } from "lucide-react"
import { db, auth } from "../../firebaseConfig"
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore"
import { API_KEYS } from "../../API"

export function ProfessionalSkills({ profileData, onScoreUpdate,apiKey }) {
  const [showModal, setShowModal] = useState(false)
  const [professionalSkillsScore, setProfessionalSkillsScore] = useState(0)
  const [scoreBreakdown, setScoreBreakdown] = useState([])
  const [aiEvaluationResult, setAiEvaluationResult] = useState("")
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluationError, setEvaluationError] = useState("")
  const [showAboutScore, setShowAboutScore] = useState(false)
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false)
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)
  const [triggeredByAuto, setTriggeredByAuto] = useState(false)
  const [isLoadingScore, setIsLoadingScore] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // const apiKey = API_KEYS.OPENAI

  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : ""
    return () => (document.body.style.overflow = "")
  }, [showModal])

  const saveScoreToFirebase = async (scoreData) => {
    const userId = auth?.currentUser?.uid;
    if (!userId) return;

    try {
      const aiEvalRef = doc(db, "aiProfessionalSkillsEvaluation", userId);
      await setDoc(aiEvalRef, {
        savedScore: scoreData.totalScore,
        scoreBreakdown: scoreData.breakdown,
        lastUpdated: new Date(),
        result: aiEvaluationResult
      }, { merge: true });
    } catch (error) {
      console.error("Error saving score:", error);
      setLoadError("Failed to save score. Please try again.");
    }
  };

  useEffect(() => {
    if (profileData && aiEvaluationResult) {
      const result = calculateProfessionalSkillsScore(profileData, aiEvaluationResult)
      setProfessionalSkillsScore(result.totalScore)
      setScoreBreakdown(result.breakdown)
      if (onScoreUpdate) onScoreUpdate(result.totalScore);

      saveScoreToFirebase(result);
    }
  }, [profileData, aiEvaluationResult, onScoreUpdate])

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const loadSavedScore = async () => {
          setIsLoadingScore(true);
          try {
            const aiEvalRef = doc(db, "aiProfessionalSkillsEvaluation", user.uid);
            const docSnap = await getDoc(aiEvalRef);

            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.savedScore !== undefined) {
                setProfessionalSkillsScore(data.savedScore);
              }
              if (data.scoreBreakdown) {
                setScoreBreakdown(data.scoreBreakdown);
              }
              if (data.result) {
                setAiEvaluationResult(data.result);
              }
            }

            // Set up listener for trigger updates
            const profileRef = doc(db, "internProfiles", user.uid);
            const unsubscribeProfile = onSnapshot(profileRef, async (profileSnap) => {
              if (profileSnap.exists()) {
                const profileData = profileSnap.data();
                if (profileData.triggerProfessionalSkillsEvaluation === true && !isEvaluating) {
                  console.log("Trigger detected: Running professional skills AI evaluation...");
                  setTriggeredByAuto(true);
                  const result = await runAiEvaluation();
                  await updateDoc(profileRef, { triggerProfessionalSkillsEvaluation: false });
                }
              }
            });

            return () => unsubscribeProfile();
          } catch (error) {
            console.error("Error loading saved score:", error);
            setLoadError("Failed to load saved scores. Please refresh.");
          } finally {
            setIsLoadingScore(false);
          }
        };

        loadSavedScore();
      }
    });

    return () => unsubscribe();
  }, [auth?.currentUser?.uid, isEvaluating]);

  const parseAiEvaluationScores = (text) => {
    const categories = {
      problemSolving: ["Problem Solving", "Problem-Solving", "problem solving", "problem-solving"],
      criticalThinking: ["Critical Thinking", "Critical-Thinking", "critical thinking", "critical-thinking"],
      communication: ["Communication", "communication skills", "Communication Skills"],
      creativity: ["Creativity", "Creativity & Initiative", "creativity", "Innovation"],
    }

    const scores = {}
    Object.entries(categories).forEach(([key, labels]) => {
      let foundScore = 0
      for (const label of labels) {
        const patterns = [
          new RegExp(`\\*\\*${label}\\s*:\\s*(\\d)\\*\\*`, "i"),
          new RegExp(`${label}\\s*:\\s*(\\d)`, "i"),
          new RegExp(`\\d+\\.\\s*\\*\\*${label}\\s*:\\s*(\\d)\\*\\*`, "i"),
          new RegExp(`${label}[^\\d]*(\\d)/5`, "i"),
          new RegExp(`${label}[^\\d]*(\\d)\\s*out\\s*of\\s*5`, "i"),
          new RegExp(`${label}.*?score[^\\d]*(\\d)`, "i"),
          new RegExp(`\\d+\\.\\s*${label}\\s*:\\s*(\\d)`, "i"),
        ]

        for (const pattern of patterns) {
          const match = text.match(pattern)
          if (match) {
            foundScore = Number.parseInt(match[1])
            console.log(`Found score for ${key} (${label}): ${foundScore}`)
            break
          }
        }
        if (foundScore > 0) break
      }
      scores[key] = Math.min(Math.max(foundScore, 0), 5) // Ensure score is between 0-5
    })

    console.log("Parsed AI scores:", scores)
    return scores
  }

  const refreshAiEvaluation = async () => {
    const userId = auth?.currentUser?.uid
    if (!userId) return

    try {
      const aiEvalRef = doc(db, "aiProfessionalSkillsEvaluation", userId)
      const aiSnap = await getDoc(aiEvalRef)
      if (aiSnap.exists()) {
        const saved = aiSnap.data()
        if (saved.result) {
          console.log("Refreshing AI evaluation result")
          setAiEvaluationResult(saved.result)
          return
        }
      }
      console.log("No saved result found, running new evaluation")
      await runAiEvaluation()
    } catch (error) {
      console.error("Error refreshing AI evaluation:", error)
      setEvaluationError(`Failed to refresh evaluation: ${error.message}`)
    }
  }

  useEffect(() => {
    if (!auth?.currentUser?.uid) return

    const docRef = doc(db, "internProfiles", auth.currentUser.uid)
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        if (data.triggerProfessionalSkillsEvaluation === true && !isEvaluating) {
          console.log("Trigger detected: Running professional skills AI evaluation...")
          setTriggeredByAuto(true)
          await runAiEvaluation()
          await updateDoc(docRef, {
            triggerProfessionalSkillsEvaluation: false,
          })
        }
      }
    })
    return () => unsubscribe()
  }, [auth?.currentUser?.uid, isEvaluating])

  const sendMessageToChatGPT = async (message) => {
    const API_URL = "https://api.openai.com/v1/chat/completions"
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "You are an expert career coach specializing in professional skills assessment. Provide detailed, professional evaluations based on the Professional Skills Scorecard rubric.",
            },
            {
              role: "user",
              content: message,
            },
          ],
          max_tokens: 2000,
          temperature: 0.3,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        if (response.status === 401) {
          throw new Error("Invalid API key. Please check your OpenAI API key.")
        } else if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.")
        } else if (response.status === 403) {
          throw new Error("Access denied. Please check your API key permissions.")
        } else {
          throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`)
        }
      }

      const data = await response.json()
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response format from OpenAI API")
      }
      return data.choices[0].message.content
    } catch (error) {
      console.error("ChatGPT API Error:", error)
      throw error
    }
  }

  const runAiEvaluation = async () => {
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

      const combinedMessage = `Evaluate the professional skills of this candidate using the Professional Skills Scorecard rubric.

Instructions:
- Score each of the 4 categories below from 0 to 5 using this rubric:
  • 0 = No evidence or very poor
  • 1 = Minimal/poor evidence  
  • 2 = Below average
  • 3 = Average/acceptable
  • 4 = Good/strong evidence
  • 5 = Excellent/outstanding
- Provide a short rationale for each score (2-3 sentences)
- At the end, give a total score out of 20, normalize it to 100, and assign a skill level:
  • 90-100: Excellent
  • 75-89: Strong
  • 50-74: Developing
  • <50: Weak

Categories to evaluate:
1. Problem Solving (30% weight): Ability to analyze problems and propose effective solutions
2. Critical Thinking (30% weight): Logical reasoning and analytical skills
3. Communication (25% weight): Clarity, structure, and professionalism in written responses
4. Creativity & Initiative (15% weight): Innovation and proactive thinking

Input Data:
${evaluationData}`

      const result = await sendMessageToChatGPT(combinedMessage);
      setAiEvaluationResult(result);
      setShowDetailedAnalysis(true);

      // Calculate and save scores
      const calculatedScores = calculateProfessionalSkillsScore(profileData, result);
      setProfessionalSkillsScore(calculatedScores.totalScore);
      setScoreBreakdown(calculatedScores.breakdown);
      setAiEvaluationResult(result);
      setShowDetailedAnalysis(true);

      if (onScoreUpdate) onScoreUpdate(calculatedScores.totalScore);
      await saveScoreToFirebase(calculatedScores);

      return result;
    } catch (error) {
      console.error("AI Evaluation error:", error)
      setEvaluationError(`Failed to get AI evaluation: ${error.message}`)
    } finally {
      setIsEvaluating(false)
    }
  }

  const prepareDataForAiEvaluation = (data) => {
    let evaluationData = ""

    // Academic background
    evaluationData += `\n=== ACADEMIC BACKGROUND ===\n`
    evaluationData += `Degree: ${data?.formData?.academicOverview?.degree || "Not provided"}\n`
    evaluationData += `Field of Study: ${data?.formData?.academicOverview?.fieldOfStudy || "Not provided"}\n`
    evaluationData += `Institution: ${data?.formData?.academicOverview?.institution || "Not provided"}\n`
    evaluationData += `GPA/Performance: ${data?.formData?.academicOverview?.academicPerformance || "Not provided"}\n`
    evaluationData += `Honors: ${data?.formData?.academicOverview?.academicHonors || "None"}\n`

    // Experience
    evaluationData += `\n=== EXPERIENCE ===\n`
    evaluationData += `Work Experience: ${data?.formData?.experienceTrackRecord?.workExperiences?.length || 0
      } positions\n`
    evaluationData += `Internship Experience: ${data?.formData?.experienceTrackRecord?.internshipExperience || "None"
      }\n`
    evaluationData += `Academic Projects: ${data?.formData?.experienceTrackRecord?.academicProjects?.join(", ") || "None"
      }\n`
    evaluationData += `Leadership Experience: ${data?.formData?.experienceTrackRecord?.leadershipExperience?.join(", ") || "None"
      }\n`

    // Professional documents
    evaluationData += `\n=== PROFESSIONAL MATERIALS ===\n`
    evaluationData += `Case Study Response: ${data?.formData?.professionalPresentation?.caseStudyResponse
      ? "Available"
      : "Not provided"
      }\n`
    evaluationData += `Cover Letter: ${data?.formData?.professionalPresentation?.coverLetter ? "Available" : "Not provided"
      }\n`
    evaluationData += `LinkedIn Profile: ${data?.formData?.experienceTrackRecord?.linkedInProfile || "Not provided"
      }\n`

    // Skills and interests
    evaluationData += `\n=== SKILLS & INTERESTS ===\n`
    evaluationData += `Preferred Internship Type: ${data?.formData?.skillsInterests?.internTypePreference || "Not specified"
      }\n`
    evaluationData += `Availability: ${data?.formData?.skillsInterests?.availableHours || "Not specified"
      } hours/week\n`

    return evaluationData
  }

  const calculateProfessionalSkillsScore = (data, aiEvaluationResult = "") => {
    const weights = {
      problemSolving: 30,
      criticalThinking: 30,
      communication: 25,
      creativity: 15,
    }

    const aiScores = aiEvaluationResult ? parseAiEvaluationScores(aiEvaluationResult) : null
    console.log("AI scores extracted:", aiScores)

    const categoryNames = {
      problemSolving: "Problem Solving",
      criticalThinking: "Critical Thinking",
      communication: "Communication",
      creativity: "Creativity & Initiative",
    }

    const colors = ["#8D6E63", "#6D4C41", "#A67C52", "#B8860B"]

    const breakdown = Object.entries(categoryNames).map(([key, label], i) => {
      const aiRaw = aiScores?.[key] ?? 0
      const percent = (aiRaw / 5) * 100
      const weighted = percent * (weights[key] / 100)
      return {
        name: label,
        score: Math.round(percent),
        weight: weights[key],
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

  const getProgressBarColor = (score) => {
    if (score >= 90) return "#1B5E20"
    if (score >= 75) return "#4CAF50"
    if (score >= 50) return "#FF9800"
    return "#F44336"
  }

  const getScoreLevel = (score) => {
    if (score >= 90)
      return {
        level: "Excellent",
        color: "#1B5E20",
        icon: CheckCircle,
        description: "Advanced problem-solving; placement-ready.",
      }
    if (score >= 75)
      return {
        level: "Strong",
        color: "#4CAF50",
        icon: CheckCircle,
        description: "Good thinking; needs refinement for complex tasks.",
      }
    if (score >= 50)
      return {
        level: "Developing",
        color: "#FF9800",
        icon: TrendingUp,
        description: "Emerging skill; coaching recommended.",
      }
    return {
      level: "Weak",
      color: "#F44336",
      icon: AlertCircle,
      description: "Critical gaps in reasoning; foundational work needed.",
    }
  }

  const formatAiResult = (result) => {
    const cleanedResult = result.replace(/\*\*(.*?)\*\*/g, "$1")
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

  const scoreLevel = getScoreLevel(professionalSkillsScore)
  const ScoreIcon = scoreLevel.icon

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
        }}
      >
        {isLoadingScore ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '300px',
            padding: '40px'
          }}>
            <RefreshCw
              size={40}
              style={{
                color: '#8d6e63',
                animation: 'spin 1s linear infinite'
              }}
            />
          </div>
        ) : (
          <>
            {loadError && (
              <div style={{
                backgroundColor: '#ffebee',
                color: '#c62828',
                padding: '12px',
                textAlign: 'center',
                fontSize: '14px',
                borderBottom: '1px solid #ef9a9a'
              }}>
                {loadError}
              </div>
            )}

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
                  Professional Skills Score
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
                Problem-solving assessment
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
                    {professionalSkillsScore ?? '--'}%
                  </span>

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
                  {professionalSkillsScore !== null ? scoreLevel.level : 'Not evaluated'}
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
                <button
                  onClick={() => setShowModal(true)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #5d4037 0%, #4a2c20 100%)",
                    color: "white",
                    border: "none",
                    marginTop: "-1px",
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
          </>
        )}

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

      {/* Enhanced Modal - remains unchanged */}
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
            zIndex: "9999999",
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
                Professional Skills Score Breakdown
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
                    {professionalSkillsScore ?? '--'}%
                  </span>
                  <span style={{
                    color: scoreLevel.color,
                    fontSize: "12px",
                    fontWeight: "600",
                    marginTop: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}>
                    {professionalSkillsScore !== null ? scoreLevel.level : 'Not evaluated'}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    color: "#6d4c41",
                    marginBottom: "15px",
                  }}
                >
                  <span>Assessment: </span>
                  <span
                    style={{
                      fontWeight: "600",
                      color: "#5d4037",
                      textTransform: "capitalize",
                    }}
                  >
                    {aiEvaluationResult ? "AI-Generated Evaluation" : "Estimated Assessment"}
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
                      onClick={runAiEvaluation}
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
                          <Brain size={16} />
                          Run AI analysis
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

              {/* About the Professional Skills Score section */}
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
                  <span>About the Professional Skills Score</span>
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
                      The Professional Skills score evaluates core competencies that are critical for workplace success.
                      This assessment represents 40% of the overall BIG Intern Score and is based on an analysis of the
                      candidate's academic background, experience, and responses to professional scenarios.
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
                          <strong>Problem Solving (30%):</strong> Ability to analyze complex situations and develop
                          effective solutions
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Critical Thinking (30%):</strong> Logical reasoning, analytical skills, and ability to
                          evaluate information objectively
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Communication (25%):</strong> Clarity, structure, and professionalism in written and
                          verbal responses
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Creativity & Initiative (15%):</strong> Innovation, originality, and proactive
                          approach to challenges
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
                          <strong>90-100% (Excellent):</strong> Advanced problem-solving skills demonstrated, ready for
                          complex responsibilities
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>75-89% (Strong):</strong> Solid foundation with some areas for refinement in handling
                          complex tasks
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>50-74% (Developing):</strong> Emerging skills that would benefit from structured
                          coaching and mentorship
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>0-49% (Weak):</strong> Foundational work needed to develop core professional
                          competencies
                        </li>
                      </ul>
                    </div>

                    <p style={{ marginBottom: "0", lineHeight: "1.6", fontStyle: "italic", color: "#6d4c41" }}>
                      Strong professional skills scores correlate with better workplace performance and ability to handle
                      complex responsibilities independently.
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
                        {professionalSkillsScore >= 90 && (
                          <p style={{ margin: "0" }}>
                            <strong>Excellent professional skills demonstrated.</strong> {scoreLevel.description} Your
                            responses show advanced analytical abilities and clear communication.
                          </p>
                        )}
                        {professionalSkillsScore >= 75 && professionalSkillsScore < 90 && (
                          <p style={{ margin: "0" }}>
                            <strong>Strong professional foundation.</strong> {scoreLevel.description} With some
                            refinement, you'll be ready to handle more complex professional challenges.
                          </p>
                        )}
                        {professionalSkillsScore >= 50 && professionalSkillsScore < 75 && (
                          <p style={{ margin: "0" }}>
                            <strong>Developing professional skills.</strong> {scoreLevel.description} Focused coaching
                            and practice will help strengthen these critical workplace competencies.
                          </p>
                        )}
                        {professionalSkillsScore < 50 && (
                          <p style={{ margin: "0" }}>
                            <strong>Foundational skills development needed.</strong> {scoreLevel.description} Structured
                            training in problem-solving and critical thinking would be beneficial.
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

              {/* Improve Your Skills Button */}
              <div
                style={{
                  marginTop: "20px",
                  textAlign: "center",
                }}
              >
                <button
                  onClick={() => window.open("http://localhost:3000/growth/shop#skills", "_blank")}
                  style={{
                    padding: "14px 24px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #8D6E63 0%, #6D4C41 100%)",
                    color: "white",
                    border: "none",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 16px rgba(141, 110, 99, 0.3)",
                    margin: "0 auto",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = "translateY(-2px)"
                    e.target.style.boxShadow = "0 6px 20px rgba(141, 110, 99, 0.4)"
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = "translateY(0px)"
                    e.target.style.boxShadow = "0 4px 16px rgba(141, 110, 99, 0.3)"
                  }}
                >
                  <span>📚 Improve Your Skills</span>
                </button>
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