"use client"

import { useState, useEffect } from "react"
import { ChevronDown, RefreshCw, AlertCircle, FileText, CheckCircle, TrendingUp } from "lucide-react"
import { db, auth } from "../../firebaseConfig"
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore"
import { API_KEYS } from "../../API" // Make sure this path is correct
import { getFunctions, httpsCallable } from "firebase/functions";

export function ProfessionalPresentation({ styles, profileData, onScoreUpdate,apiKey }) {
  const [showModal, setShowModal] = useState(false)
  const [professionalScore, setProfessionalScore] = useState(0)
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
      const aiEvalRef = doc(db, "aiPresentationEvaluation", userId);
      await setDoc(aiEvalRef, {
        savedScore: scoreData.totalScore,
        scoreBreakdown: scoreData.breakdown,
        lastUpdated: new Date(),
        result: aiEvaluationResult
      }, { merge: true });
    } catch (error) {
      console.error("Error saving score:", error);
    }
  };

  useEffect(() => {
    if (profileData && aiEvaluationResult) {
      const result = calculateProfessionalScore(profileData, aiEvaluationResult)
      setProfessionalScore(result.totalScore)
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
            const aiEvalRef = doc(db, "aiPresentationEvaluation", user.uid);
            const docSnap = await getDoc(aiEvalRef);

            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.savedScore !== undefined) {
                setProfessionalScore(data.savedScore);
              }
              if (data.scoreBreakdown) {
                setScoreBreakdown(data.scoreBreakdown);
              }
              if (data.result) {
                setAiEvaluationResult(data.result);
              }
            }
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
  }, []);

  const parseAiEvaluationScores = (text) => {
    const categories = {
      structure: ["Structure & Format", "Document Structure", "structure"],
      relevance: ["Relevance & Tailoring", "Content Relevance", "relevance"],
      grammar: ["Grammar & Tone", "Language Quality", "grammar"],
      persuasiveness: ["Persuasiveness", "Argument Strength", "persuasiveness"],
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
      const aiEvalRef = doc(db, "aiPresentationEvaluation", userId)
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
        if (data.triggerPresentationEvaluation === true && !isEvaluating) {
          console.log("Trigger detected: Running professional presentation AI evaluation...")
          setTriggeredByAuto(true)
          await runAiEvaluation()
          await updateDoc(docRef, {
            triggerPresentationEvaluation: false,
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
    const aiEvalRef = doc(db, "aiPresentationEvaluation", userId)
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

const sendMessageToChatGPT = async (message /* , apiKey not needed */) => {
  try {
    const functions = getFunctions(); // add region if you deploy to a non-default one
    const run = httpsCallable(functions, "evaluateProfessionalPresentation");
    const resp = await run({ prompt: message });
    const content = resp?.data?.content;
    if (!content) throw new Error("Empty response from evaluateProfessionalPresentation.");
    return content;
  } catch (err) {
    console.error("Callable error:", err);
    throw new Error(err?.message || "Failed to run presentation insights.");
  }
};

  useEffect(() => {
    if (!auth?.currentUser?.uid) return

    const userId = auth.currentUser.uid
    const profileRef = doc(db, "internProfiles", userId)
    const aiEvalRef = doc(db, "aiPresentationEvaluation", userId)

    const unsubscribe = onSnapshot(profileRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        if (data.triggerPresentationEvaluation === true && !isEvaluating) {
          console.log("Trigger detected: Running presentation AI evaluation...")
          setTriggeredByAuto(true)
          const result = await runAiEvaluation(userId)
          await updateDoc(profileRef, { triggerPresentationEvaluation: false })
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
  }, [auth?.currentUser?.uid, isEvaluating])

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
      console.log("Final evaluation data:", evaluationData)

      const combinedMessage = `Evaluate the professional quality of the following internship application materials using our Professional Presentation Rubric.

Instructions:
- Score each of the 4 categories below from 0 to 5 where:
  • 0 = No evidence or very poor
  • 1 = Minimal/poor evidence  
  • 2 = Below average
  • 3 = Average/acceptable
  • 4 = Good/strong evidence
  • 5 = Excellent/outstanding
- Provide a short rationale for each score (2-3 sentences)
- At the end, give a total score out of 20, normalize it to 100, and assign a professional level:
  • 90-100: Excellent
  • 75-89: Strong
  • 50-74: Developing
  • <50: Weak

Categories to evaluate:
1. Structure & Format (professional document structure with clear sections)
2. Relevance & Tailoring (alignment with role requirements and organization)
3. Grammar & Tone (professional language, proper grammar, appropriate tone)
4. Persuasiveness (compelling presentation and originality)

Application Materials:
${evaluationData}`

      const result = await sendMessageToChatGPT(combinedMessage);
      setAiEvaluationResult(result);
      setShowDetailedAnalysis(true);

      // Calculate and save scores
      const calculatedScores = calculateProfessionalScore(profileData, result);
      setProfessionalScore(calculatedScores.totalScore);
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
    // Access the professionalPresentation data correctly from the nested structure
    const professionalData = data?.formData?.professionalPresentation || {};

    let evaluationData = "";

    // Cover Letter
    evaluationData += `\n=== COVER LETTER ===\n`;
    evaluationData += `Content: ${data?.formData?.professionalPresentation?.professionalPresentation?.coverLetter || "Not provided"}\n`;

    // Case Study Response
    evaluationData += `\n=== CASE STUDY RESPONSE ===\n`;
    evaluationData += `Content: ${data?.formData?.professionalPresentation?.professionalPresentation?.caseStudyResponse || "Not provided"}\n`;

    // Additional context from profile
    evaluationData += `\n=== APPLICANT CONTEXT ===\n`;
    evaluationData += `Full Name: ${data?.formData?.personalOverview?.fullName || "Not provided"}\n`;
    evaluationData += `Field of Study: ${data?.formData?.academicOverview?.fieldOfStudy || "Not provided"}\n`;
    evaluationData += `Institution: ${data?.formData?.academicOverview?.institution || "Not provided"}\n`;
    evaluationData += `Internship Preference: ${data?.formData?.skillsInterests?.internTypePreference || "Not provided"}\n`;

    console.log("Evaluation data being sent to AI:", evaluationData); // Debug log
    return evaluationData;
  };

  const getProgressBarColor = (score) => {
    if (score >= 90) return "#1B5E20" // Dark green
    if (score >= 75) return "#4CAF50" // Green
    if (score >= 50) return "#FF9800" // Orange
    return "#F44336" // Red
  }

  const calculateProfessionalScore = (data, aiEvaluationResult = "") => {
    console.log("Calculating professional score with AI result:", !!aiEvaluationResult)

    const weights = {
      structure: 25,
      relevance: 30,
      grammar: 25,
      persuasiveness: 20
    }

    const aiScores = aiEvaluationResult ? parseAiEvaluationScores(aiEvaluationResult) : null
    console.log("AI scores extracted:", aiScores)

    const categoryNames = {
      structure: "Structure & Format",
      relevance: "Relevance & Tailoring",
      grammar: "Grammar & Tone",
      persuasiveness: "Persuasiveness"
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

  const getScoreLevel = (score) => {
    if (score >= 90)
      return {
        level: "Excellent",
        color: "#1B5E20",
        icon: CheckCircle,
        description: "Highly professional; ready for client-facing roles.",
      }
    if (score >= 75)
      return {
        level: "Strong",
        color: "#4CAF50",
        icon: CheckCircle,
        description: "Good professionalism; polish tone for complex tasks.",
      }
    if (score >= 50)
      return {
        level: "Developing",
        color: "#FF9800",
        icon: TrendingUp,
        description: "Basic communication; needs mentoring for workplace docs.",
      }
    return {
      level: "Weak",
      color: "#F44336",
      icon: AlertCircle,
      description: "Major communication gaps; intensive support required.",
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

  const scoreLevel = getScoreLevel(professionalScore)
  const ScoreIcon = scoreLevel.icon

  return (
    <>
      {/* Card Design */}
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
                  Professional Presentation
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
                Communication quality assessment
              </p>
            </div>

            {/* Main Content Area */}
            <div
              style={{
                padding: "24px",
                background: "white",
                textAlign: "center",
              }}
            >
              {/* Score Circle */}
              <div style={{ position: "relative", display: "inline-block", marginBottom: "24px" }}>
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
                    {professionalScore ?? '--'}%
                  </span>
                </div>

                {/* Status Badge */}
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
                  {professionalScore !== null ? scoreLevel.level : 'Not evaluated'}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
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
                  }}
                >
                  <span>Score breakdown</span>
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal - This remains unchanged */}
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
                Professional Presentation Score
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
                    {professionalScore}%
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

              {/* About the Score section */}
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
                  <span>About the Professional Presentation Score</span>
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
                      The Professional Presentation score evaluates the quality of your written communication materials,
                      including cover letters and case study responses. It assesses how effectively you present yourself
                      professionally in written form.
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
                          <strong>Structure & Format (25%):</strong> Professional document structure with clear
                          introduction, body, and conclusion
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Relevance & Tailoring (30%):</strong> Alignment with role requirements and
                          organizational mission
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Grammar & Tone (25%):</strong> Professional language, proper grammar, and appropriate
                          formatting
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Persuasiveness (20%):</strong> Compelling presentation and originality in
                          communication
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
                          <strong>90-100% (Excellent):</strong> Highly professional; ready for client-facing roles
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>75-89% (Strong):</strong> Good professionalism; polish tone for complex tasks
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>50-74% (Developing):</strong> Basic communication; needs mentoring for workplace docs
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>0-49% (Weak):</strong> Major communication gaps; intensive support required
                        </li>
                      </ul>
                    </div>
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
                        {professionalScore >= 90 && (
                          <p style={{ margin: "0" }}>
                            <strong>Excellent professional presentation achieved.</strong> {scoreLevel.description} This
                            candidate demonstrates outstanding communication skills with highly professional, clear, and
                            persuasive writing.
                          </p>
                        )}
                        {professionalScore >= 75 && professionalScore <= 89 && (
                          <p style={{ margin: "0" }}>
                            <strong>Strong professional communication demonstrated.</strong> {scoreLevel.description}
                          </p>
                        )}
                        {professionalScore >= 50 && professionalScore <= 74 && (
                          <p style={{ margin: "0" }}>
                            <strong>Developing communication skills requiring support.</strong> {scoreLevel.description}
                          </p>
                        )}
                        {professionalScore < 50 && (
                          <p style={{ margin: "0" }}>
                            <strong>Communication skills require significant development.</strong>{" "}
                            {scoreLevel.description}
                            {scoreLevel.description}
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

                    {/* Improve Your Score Button */}
                    <div style={{ marginTop: "20px", textAlign: "center" }}>
                      <button
                        onClick={() => window.open("http://localhost:3000/growth/shop#professional", "_blank")}
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
                        <span>📝 Improve Your Score</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
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