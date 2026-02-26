"use client"

import { useState, useEffect } from "react"
import { ChevronDown, CheckCircle, TrendingUp, AlertCircle, Briefcase, RefreshCw } from "lucide-react"
import { db, auth } from "../../firebaseConfig"
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore"
import { API_KEYS } from "../../API"
import { getFunctions, httpsCallable } from "firebase/functions";

export function WorkExperience({ profileData, onScoreUpdate ,apiKey}) {
  const [showModal, setShowModal] = useState(false)
  const [workExperienceScore, setWorkExperienceScore] = useState(0)
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

  const saveScoreToFirebase = async (scoreData, aiResult = null) => {
  const userId = auth?.currentUser?.uid;
  if (!userId) return;

  try {
    const aiEvalRef = doc(db, "aiWorkExperienceEvaluation", userId);
    await setDoc(aiEvalRef, {
      savedScore: scoreData.totalScore,
      scoreBreakdown: scoreData.breakdown,
      result: aiResult || aiEvaluationResult, // Save the AI result
      lastUpdated: new Date()
    }, { merge: true });
  } catch (error) {
    console.error("Error saving score:", error);
    setLoadError("Failed to save score. Please try again.");
  }
};
useEffect(() => {
  if (profileData && aiEvaluationResult) {
    const result = calculateWorkExperienceScore(profileData, aiEvaluationResult)
    setWorkExperienceScore(result.totalScore)
    setScoreBreakdown(result.breakdown)
    if (onScoreUpdate) onScoreUpdate(result.totalScore);

    // Pass the AI result when saving
    saveScoreToFirebase(result, aiEvaluationResult);
  }
}, [profileData, aiEvaluationResult])

  useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged((user) => {
    if (user) {
      const loadSavedScore = async () => {
        setIsLoadingScore(true);
        try {
          const aiEvalRef = doc(db, "aiWorkExperienceEvaluation", user.uid);
          const docSnap = await getDoc(aiEvalRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Restore all states in the correct order
            if (data.result) {
              setAiEvaluationResult(data.result);
              // Calculate scores based on the restored AI result
              if (profileData) {
                const result = calculateWorkExperienceScore(profileData, data.result);
                setWorkExperienceScore(result.totalScore);
                setScoreBreakdown(result.breakdown);
              }
            } else if (data.savedScore !== undefined) {
              setWorkExperienceScore(data.savedScore);
            }
            
            if (data.scoreBreakdown) {
              setScoreBreakdown(data.scoreBreakdown);
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
}, [profileData]); // Add profileData as dependency

  const parseAiEvaluationScores = (text) => {
    const categories = {
      internships: ["Internship Experience", "Internships", "internship"],
      projects: ["Academic Projects", "Project Work", "projects"],
      volunteer: ["Volunteer Work", "Community Service", "volunteer"],
      leadership: ["Leadership Roles", "Leadership Experience", "leadership"],
      skills: ["Technical Skills", "Relevant Skills", "skills"],
      duration: ["Experience Duration", "Duration of Experience", "duration"]
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
            break
          }
        }
        if (foundScore > 0) break
      }
      scores[key] = Math.min(Math.max(foundScore, 0), 5)
    })

    return scores
  }

  const refreshAiEvaluation = async () => {
    const userId = auth?.currentUser?.uid
    if (!userId) return

    try {
      const aiEvalRef = doc(db, "aiWorkExperienceEvaluation", userId)
      const aiSnap = await getDoc(aiEvalRef)
      if (aiSnap.exists()) {
        const saved = aiSnap.data()
        if (saved.result) {
          setAiEvaluationResult(saved.result)
          return
        }
      }
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
        if (data.triggerWorkExperienceEvaluation === true && !isEvaluating) {
          setTriggeredByAuto(true)
          await runAiEvaluation()
          await updateDoc(docRef, {
            triggerWorkExperienceEvaluation: false,
          })
        }
      }
    })
    return () => unsubscribe()
  }, [auth?.currentUser?.uid, isEvaluating])

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

      const combinedMessage = `Evaluate the work experience of this candidate based on the following rubric:

**Scoring Guide (0-5 points per category):**
0 = No evidence
1 = Minimal evidence
2 = Below average
3 = Average
4 = Good
5 = Excellent

**Categories to Evaluate:**
1. Internship Experience (quality and relevance of internships)
2. Academic Projects (complexity and relevance of projects)
3. Volunteer Work (community involvement and relevance)
4. Leadership Roles (demonstrated leadership experience)
5. Technical Skills (relevant technical competencies)
6. Experience Duration (length and consistency of experience)

Provide:
- Score for each category (0-5)
- Brief rationale for each score
- Total score out of 30
- Normalized score out of 100
- Overall assessment band:
  • 90-100: Excellent (Strong practical exposure)
  • 75-89: Strong (Good real-world experience)
  • 50-74: Developing (Some relevant experience)
  • <50: Limited (Minimal practical exposure)

Candidate Data:
${evaluationData}`

      const result = await sendMessageToChatGPT(combinedMessage);
      setAiEvaluationResult(result);
      setShowDetailedAnalysis(true);

      // Calculate and save scores
      const calculatedScores = calculateWorkExperienceScore(profileData, result);
      setWorkExperienceScore(calculatedScores.totalScore);
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

 const sendMessageToChatGPT = async (message /* no apiKey on client */) => {
  const functions = getFunctions(); // pass region if you deployed elsewhere
  const run = httpsCallable(functions, "evaluateWorkExperience");
  const resp = await run({ prompt: message });
  const content = resp?.data?.content;
  if (!content) throw new Error("Empty response from evaluateWorkExperience.");
  return content;
};


  const prepareDataForAiEvaluation = (data) => {
    const workData = data?.formData?.experienceTrackRecord || {}
    const skillsData = data?.formData?.skillsInterests || {}
    const academicData = data?.formData?.academicOverview || {}

    let evaluationData = "=== WORK EXPERIENCE ===\n"
    evaluationData += `Internships: ${workData.internshipExperience || "Not provided"}\n`
    evaluationData += `Projects: ${workData.academicProjects?.join(", ") || "None listed"}\n`
    evaluationData += `Volunteer Work: ${workData.volunteerWork?.join(", ") || "None listed"}\n`
    evaluationData += `Leadership Roles: ${workData.leadershipExperience?.join(", ") || "None listed"}\n\n`

    evaluationData += "=== SKILLS ===\n"
    evaluationData += `Technical Skills: ${skillsData.technicalSkills?.join(", ") || "Not specified"}\n`
    evaluationData += `Internship Type Preference: ${skillsData.internTypePreference || "Not specified"}\n\n`

    evaluationData += "=== ACADEMIC BACKGROUND ===\n"
    evaluationData += `Degree: ${academicData.degree || "Not specified"}\n`
    evaluationData += `Field of Study: ${academicData.fieldOfStudy || "Not specified"}\n`
    evaluationData += `Institution: ${academicData.institution || "Not specified"}\n`
    evaluationData += `Graduation Year: ${academicData.graduationYear || "Not specified"}\n`
    evaluationData += `Academic Performance: ${academicData.academicPerformance || "Not specified"}\n\n`

    evaluationData += "=== ADDITIONAL INFORMATION ===\n"
    evaluationData += `LinkedIn Profile: ${workData.linkedInProfile || "Not provided"}\n`
    evaluationData += `Reference Contact: ${workData.referenceContact || "Not provided"}\n`

    return evaluationData
  }

  const calculateWorkExperienceScore = (data, aiEvaluationResult = "") => {
    const weights = {
      internships: 30,
      projects: 25,
      volunteer: 15,
      leadership: 10,
      skills: 15,
      duration: 5
    }

    const aiScores = aiEvaluationResult ? parseAiEvaluationScores(aiEvaluationResult) : null

    // Fallback to simple calculation if no AI result
    if (!aiScores) {
      const workData = data?.formData?.experienceTrackRecord || {}

      // Simple scoring logic
      const internships = workData.internshipExperience ? 4 : 0
      const projects = workData.academicProjects?.length > 0 ? 3 : 0
      const volunteer = workData.volunteerWork?.length > 0 ? 2 : 0
      const leadership = workData.leadershipExperience?.length > 0 ? 3 : 0

      const totalScore = Math.round(
        (internships * weights.internships +
          projects * weights.projects +
          volunteer * weights.volunteer +
          leadership * weights.leadership) / 100
      )

      const breakdown = [
        {
          name: "Internship Experience",
          score: Math.round((internships / 5) * 100),
          weight: weights.internships,
          color: "#8D6E63",
          rawScore: internships,
          maxScore: 5
        },
        {
          name: "Academic Projects",
          score: Math.round((projects / 5) * 100),
          weight: weights.projects,
          color: "#6D4C41",
          rawScore: projects,
          maxScore: 5
        },
        {
          name: "Volunteer Work",
          score: Math.round((volunteer / 5) * 100),
          weight: weights.volunteer,
          color: "#A67C52",
          rawScore: volunteer,
          maxScore: 5
        },
        {
          name: "Leadership Roles",
          score: Math.round((leadership / 5) * 100),
          weight: weights.leadership,
          color: "#B8860B",
          rawScore: leadership,
          maxScore: 5
        }
      ]

      return { totalScore, breakdown }
    }

    // Use AI scores if available
    const breakdown = Object.entries(weights).map(([key, weight]) => {
      const aiRaw = aiScores[key] || 0
      const percent = (aiRaw / 5) * 100
      const weighted = percent * (weight / 100)

      return {
        name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        score: Math.round(percent),
        weight: weight,
        weightedScore: Math.round(weighted),
        color: getCategoryColor(key),
        rawScore: aiRaw,
        maxScore: 5
      }
    })

    const totalScore = Math.round(breakdown.reduce((sum, item) => sum + item.weightedScore, 0))
    return { totalScore, breakdown }
  }

  const getCategoryColor = (category) => {
    const colors = {
      internships: "#8D6E63",
      projects: "#6D4C41",
      volunteer: "#A67C52",
      leadership: "#B8860B",
      skills: "#5D4037",
      duration: "#3E2723"
    }
    return colors[category] || "#795548"
  }

  const getProgressBarColor = (score) => {
    if (score >= 90) return "#1B5E20"
    if (score >= 75) return "#4CAF50"
    if (score >= 50) return "#FF9800"
    return "#F44336"
  }

  const getScoreLevel = (score) => {
    if (score >= 90) return {
      level: "Excellent",
      color: "#1B5E20",
      icon: CheckCircle,
      description: "Strong practical exposure; contributes to workplace readiness."
    }
    if (score >= 75) return {
      level: "Strong",
      color: "#4CAF50",
      icon: CheckCircle,
      description: "Some real-world exposure; complements academic skills."
    }
    if (score >= 50) return {
      level: "Developing",
      color: "#FF9800",
      icon: TrendingUp,
      description: "Minimal exposure; recommend simulated projects."
    }
    return {
      level: "Limited",
      color: "#F44336",
      icon: AlertCircle,
      description: "Minimal practical exposure - typical for fresh graduates."
    }
  }

  const formatAiResult = (result) => {
    const cleanedResult = result.replace(/\*\*(.*?)\*\*/g, "$1")
    const sections = cleanedResult.split(/(?=\d+\.\s|\n\n)/)

    return sections
      .map((section, index) => {
        const trimmed = section.trim()
        if (!trimmed) return null

        const isHeader = /^\d+\.\s/.test(trimmed)

        return (
          <div key={index} style={{ marginBottom: "15px" }}>
            {isHeader ? (
              <div style={{
                fontWeight: "bold",
                color: "#5d4037",
                fontSize: "16px",
                marginBottom: "8px",
                paddingBottom: "5px",
                borderBottom: "1px solid #e8d8cf",
              }}>
                {trimmed.split("\n")[0]}
              </div>
            ) : null}
            <div style={{
              fontSize: "14px",
              lineHeight: "1.6",
              color: "#6d4c41",
              whiteSpace: "pre-wrap",
            }}>
              {isHeader ? trimmed.split("\n").slice(1).join("\n") : trimmed}
            </div>
          </div>
        )
      })
      .filter(Boolean)
  }

  const scoreLevel = getScoreLevel(workExperienceScore)
  const ScoreIcon = scoreLevel.icon

  return (
    <>
      <div style={{
        background: "linear-gradient(135deg, #ffffff 0%, #faf8f6 100%)",
        borderRadius: "20px",
        boxShadow: "0 8px 32px rgba(141, 110, 99, 0.15)",
        border: "1px solid #e8ddd6",
        overflow: "hidden",
        position: "relative",
      }}>
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

            {/* Header */}
            <div style={{
              background: "linear-gradient(135deg, #8d6e63 0%, #6d4c41 100%)",
              padding: "24px 30px 20px 30px",
              color: "white",
              position: "relative",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}>
                <h2 style={{
                  margin: "0",
                     fontSize: "16px",
                  fontWeight: "700",
                  letterSpacing: "0.5px",
                  whiteSpace: "nowrap",
                }}>
                  Work Experience Score
                </h2>
             
              </div>
              <p style={{
                margin: "0",
                fontSize: "13px",
                opacity: "0.9",
                fontWeight: "400",
              }}>
                Professional experience assessment
              </p>
            </div>

            {/* Main Content */}
            <div style={{
              padding: "24px",
              background: "white",
              textAlign: "center",
            }}>
              {/* Score Display */}
              <div style={{
                position: "relative",
                display: "inline-block",
                marginBottom: "24px",
              }}>
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
                  fontWeight: "bold",
                }}>
                  <span style={{
                    fontSize: "26px",
                    fontWeight: "800",
                    lineHeight: "1",
                    marginBottom: "2px",
                  }}>
                    {workExperienceScore ?? '--'}%
                  </span>
                </div>
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
                  whiteSpace: "nowrap",
                }}>
                  {workExperienceScore !== null ? scoreLevel.level : 'Not evaluated'}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: "flex",
                gap: "10px",
                marginTop: "16px",
              }}>
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

      {/* Modal */}
      {showModal && (
        <div style={{
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
        }}>
          <div style={{
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
          }}>
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
              <h3 style={{
                margin: "0 0 20px 0",
                fontSize: "24px",
                fontWeight: "600",
                color: "#5d4037",
                textAlign: "center",
              }}>
                Work Experience Analysis
              </h3>

              {/* Score Summary */}
              <div style={{
                textAlign: "center",
                marginBottom: "30px",
                padding: "20px",
                background: "linear-gradient(135deg, #fdf8f6 0%, #f3e8dc 100%)",
                borderRadius: "12px",
                border: "1px solid #d6b88a",
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
                  marginBottom: "15px",
                }}>
                  <span style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    color: "#5d4037",
                    lineHeight: "1",
                  }}>
                    {workExperienceScore}%
                  </span>
                  <span style={{
                    color: scoreLevel.color,
                    fontSize: "12px",
                    fontWeight: "600",
                    marginTop: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}>
                    {scoreLevel.level}
                  </span>
                </div>

                {isEvaluating && (
                  <p style={{ color: "#5d4037", fontSize: "14px", textAlign: "center", marginTop: "10px" }}>
                    <RefreshCw size={16} className="spin" style={{ marginRight: "6px" }} />
                    Running AI analysis...
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
                          <div style={{
                            width: "16px",
                            height: "16px",
                            border: "2px solid #ffffff",
                            borderTop: "2px solid transparent",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                          }}></div>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={16} />
                          Run AI Analysis
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* About Score Section */}
              <div style={{
                marginTop: "20px",
                border: "1px solid #d7ccc8",
                borderRadius: "8px",
                overflow: "hidden",
              }}>
                <div style={{
                  backgroundColor: "#8d6e63",
                  color: "white",
                  padding: "12px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  fontWeight: "bold",
                }} onClick={() => setShowAboutScore(!showAboutScore)}>
                  <span>About the Work Experience Score</span>
                  <ChevronDown size={20} style={{
                    transform: showAboutScore ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }} />
                </div>
                {showAboutScore && (
                  <div style={{
                    backgroundColor: "#f5f2f0",
                    padding: "20px",
                    color: "#5d4037",
                  }}>
                    <p style={{ marginBottom: "16px", lineHeight: "1.6" }}>
                      The Work Experience Score evaluates the quality and relevance of your professional experience,
                      including internships, projects, volunteer work, and leadership roles. This assessment helps
                      employers understand your practical exposure and readiness for professional environments.
                    </p>
                    <div style={{
                      backgroundColor: "#efebe9",
                      padding: "16px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      borderLeft: "4px solid #8d6e63",
                    }}>
                      <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>
                        Key Assessment Areas:
                      </p>
                      <ul style={{ margin: "0", paddingLeft: "20px", color: "#5d4037" }}>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Internship Experience (30%):</strong> Professional internships and part-time work
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Academic Projects (25%):</strong> Relevant academic or personal projects
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Volunteer Work (15%):</strong> Community service and volunteer activities
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Leadership Roles (10%):</strong> Team leadership and organizational roles
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Technical Skills (15%):</strong> Relevant technical competencies
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Experience Duration (5%):</strong> Length and consistency of experience
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Score Breakdown Section */}
              <div style={{
                marginTop: "20px",
                border: "1px solid #d7ccc8",
                borderRadius: "8px",
                overflow: "hidden",
              }}>
                <div style={{
                  backgroundColor: "#8d6e63",
                  color: "white",
                  padding: "12px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  fontWeight: "bold",
                }} onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}>
                  <span>Score Breakdown</span>
                  <ChevronDown size={20} style={{
                    transform: showScoreBreakdown ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }} />
                </div>
                {showScoreBreakdown && (
                  <div style={{
                    backgroundColor: "#f5f2f0",
                    padding: "20px",
                    color: "#5d4037",
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
                        borderRadius: "8px",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", flex: "1" }}>
                          <div style={{
                            backgroundColor: item.color,
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            marginRight: "12px",
                            flexShrink: "0",
                          }}></div>
                          <div>
                            <div style={{
                              fontWeight: "600",
                              color: "#5d4037",
                              fontSize: "14px",
                              marginBottom: "2px",
                            }}>
                              {item.name}
                            </div>
                            <div style={{
                              fontSize: "12px",
                              color: "#8d6e63",
                              fontStyle: "italic",
                            }}>
                              {item.rawScore}/{item.maxScore} × {item.weight}% weight
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{
                            width: "80px",
                            height: "8px",
                            background: "#f3e8dc",
                            borderRadius: "4px",
                            overflow: "hidden",
                            border: "1px solid #d6b88a",
                          }}>
                            <div style={{
                              width: `${item.score}%`,
                              backgroundColor: getProgressBarColor(item.score),
                              height: "100%",
                              borderRadius: "4px",
                              transition: "width 0.3s ease",
                            }}></div>
                          </div>
                          <span style={{
                            fontWeight: "600",
                            color: "#5d4037",
                            fontSize: "14px",
                            minWidth: "35px",
                            textAlign: "right",
                          }}>
                            {item.score}%
                          </span>
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
                overflow: "hidden",
              }}>
                <div style={{
                  backgroundColor: "#8d6e63",
                  color: "white",
                  padding: "12px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  fontWeight: "bold",
                }} onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}>
                  <span>Detailed Analysis</span>
                  <ChevronDown size={20} style={{
                    transform: showDetailedAnalysis ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }} />
                </div>
                {showDetailedAnalysis && (
                  <div style={{
                    backgroundColor: "#f5f2f0",
                    padding: "20px",
                    color: "#5d4037",
                  }}>
                    {aiEvaluationResult ? (
                      <div style={{
                        backgroundColor: "white",
                        padding: "20px",
                        borderRadius: "8px",
                        border: "1px solid #e8d8cf",
                        maxHeight: "400px",
                        overflowY: "auto",
                      }}>
                        {formatAiResult(aiEvaluationResult)}
                      </div>
                    ) : (
                      <div style={{ color: "#5d4037", lineHeight: "1.6" }}>
                        {workExperienceScore >= 90 && (
                          <p style={{ margin: "0" }}>
                            <strong>Excellent practical exposure demonstrated.</strong> {scoreLevel.description}
                          </p>
                        )}
                        {workExperienceScore >= 75 && workExperienceScore < 90 && (
                          <p style={{ margin: "0" }}>
                            <strong>Strong practical foundation.</strong> {scoreLevel.description}
                          </p>
                        )}
                        {workExperienceScore >= 50 && workExperienceScore < 75 && (
                          <p style={{ margin: "0" }}>
                            <strong>Developing experience level.</strong> {scoreLevel.description}
                          </p>
                        )}
                        {workExperienceScore < 50 && (
                          <p style={{ margin: "0" }}>
                            <strong>Limited practical exposure.</strong> {scoreLevel.description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}