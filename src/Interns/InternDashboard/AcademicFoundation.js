"use client"
import { useState, useEffect } from "react"
import { ChevronDown, CheckCircle, TrendingUp, AlertCircle, GraduationCap, RefreshCw } from "lucide-react"
import { db, auth } from "../../firebaseConfig"
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore"
import { API_KEYS } from "../../API"

export function AcademicFoundation({ styles, profileData, onScoreUpdate,apiKey }) {
  const [showModal, setShowModal] = useState(false)
  const [academicScore, setAcademicScore] = useState(0)
  const [scoreBreakdown, setScoreBreakdown] = useState([])
  const [aiEvaluationResult, setAiEvaluationResult] = useState("")
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluationError, setEvaluationError] = useState("")
  const [showAboutScore, setShowAboutScore] = useState(false)
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false)
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)
  const [triggeredByAuto, setTriggeredByAuto] = useState(false)
  const [isLoadingScore, setIsLoadingScore] = useState(true)
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
      const aiEvalRef = doc(db, "aiAcademicEvaluation", userId);
      await setDoc(aiEvalRef, {
        savedScore: scoreData.totalScore,
        scoreBreakdown: scoreData.breakdown,
        lastUpdated: new Date()
      }, { merge: true });
    } catch (error) {
      console.error("Error saving score:", error);
      setLoadError("Failed to save score. Please try again.");
    }
  };

  useEffect(() => {
    if (profileData && aiEvaluationResult) {
      const result = calculateAcademicScore(profileData, aiEvaluationResult);
      setAcademicScore(result.totalScore);
      setScoreBreakdown(result.breakdown);
      if (onScoreUpdate) onScoreUpdate(result.totalScore);

      // Save to Firebase
      saveScoreToFirebase(result);
    }
  }, [profileData, aiEvaluationResult, onScoreUpdate]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const loadSavedScore = async () => {
          setIsLoadingScore(true);
          try {
            const aiEvalRef = doc(db, "aiAcademicEvaluation", user.uid);
            const docSnap = await getDoc(aiEvalRef);

            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.savedScore !== undefined) {
                setAcademicScore(data.savedScore);
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
      qualification: ["Qualification Level", "Educational Qualification", "qualification"],
      relevance: ["Field Relevance", "Relevance of Studies", "relevance"],
      performance: ["Academic Performance", "GPA Score", "performance"],
      certifications: ["Certifications", "Professional Certifications", "certifications"],
      honors: ["Academic Honors", "Honors and Awards", "honors"],
      projects: ["Academic Projects", "Relevant Projects", "projects"]
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
      const aiEvalRef = doc(db, "aiAcademicEvaluation", userId)
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
        if (data.triggerAcademicEvaluation === true && !isEvaluating) {
          setTriggeredByAuto(true)
          await runAiEvaluation()
          await updateDoc(docRef, {
            triggerAcademicEvaluation: false,
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
              content: "You are an expert academic advisor specializing in evaluating student readiness for internships. Provide detailed, professional evaluations based on the Academic Foundation Scorecard rubric.",
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

      const combinedMessage = `Evaluate the academic foundation of the following internship candidate using the Academic Foundation Scorecard rubric.

Instructions:
- Score each of the 6 categories below from 0 to 5 using the rubric where:
  • 0 = No evidence or very poor
  • 1 = Minimal/poor evidence  
  • 2 = Below average
  • 3 = Average/acceptable
  • 4 = Good/strong evidence
  • 5 = Excellent/outstanding
- Provide a short rationale for each score (2-3 sentences)
- At the end, give a total score out of 30, normalize it to 100, and assign an academic readiness band:
  • 85–100: Excellent Academic Preparation
  • 65–84: Strong Academic Foundation
  • 50–64: Developing Academic Skills
  • <50: Needs Academic Support

Categories to evaluate:
1. Qualification Level (degree/diploma level, institution reputation)
2. Field Relevance (alignment between studies and internship field)
3. Academic Performance (GPA, honors, distinctions)
4. Certifications (professional, technical certifications)
5. Academic Honors (awards, scholarships, recognition)
6. Relevant Projects (academic projects, research experience)

Input Data:
${evaluationData}`

      const result = await sendMessageToChatGPT(combinedMessage);
      setAiEvaluationResult(result);
      setShowDetailedAnalysis(true);

      // Calculate and save scores
      const calculatedScores = calculateAcademicScore(profileData, result);
      setAcademicScore(calculatedScores.totalScore);
      setScoreBreakdown(calculatedScores.breakdown);
      setAiEvaluationResult(result);
      setShowDetailedAnalysis(true);

      if (onScoreUpdate) onScoreUpdate(calculatedScores.totalScore);
      await saveScoreToFirebase(calculatedScores);

      return result;
    } catch (error) {
      console.error("AI Evaluation error:", error);
      setEvaluationError(`Failed to get AI evaluation: ${error.message}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  const prepareDataForAiEvaluation = (data) => {
    const academicInfo = data?.formData?.academicOverview || {}
    const experience = data?.formData?.experienceTrackRecord || {}

    let evaluationData = "\n=== ACADEMIC FOUNDATION DATA ===\n"

    // Qualification Information
    evaluationData += `\nQualification Level: ${academicInfo.qualificationLevel || "Not provided"}\n`
    evaluationData += `Degree/Diploma: ${academicInfo.degree || academicInfo.degreeOther || "Not provided"}\n`
    evaluationData += `Institution: ${academicInfo.institution || academicInfo.institutionOther || "Not provided"}\n`
    evaluationData += `Year of Study: ${academicInfo.yearOfStudy || academicInfo.yearOther || "Not provided"}\n`

    // Field of Study
    evaluationData += `\nField of Study: ${academicInfo.fieldOfStudy || academicInfo.fieldOther || "Not provided"}\n`

    // Academic Performance
    evaluationData += `\nAcademic Performance:\n`
    evaluationData += `GPA: ${academicInfo.academicPerformance || "Not provided"}\n`
    evaluationData += `Honors: ${academicInfo.academicHonors || "None"}\n`

    // Certifications
    evaluationData += `\nCertifications: ${academicInfo.certifications?.join(", ") || "None"}\n`

    // Academic Projects
    evaluationData += `\nAcademic Projects:\n`
    if (experience.academicProjects?.length > 0) {
      evaluationData += experience.academicProjects.join("\n• ") + "\n"
    } else {
      evaluationData += "None reported\n"
    }

    // Additional context
    evaluationData += `\n=== ADDITIONAL CONTEXT ===\n`
    evaluationData += `Graduation Year: ${academicInfo.graduationYear || "Not specified"}\n`
    evaluationData += `LinkedIn Profile: ${experience.linkedInProfile || "Not provided"}\n`

    return evaluationData
  }

  const getProgressBarColor = (score) => {
    if (score >= 90) return "#1B5E20"
    if (score >= 75) return "#4CAF50"
    if (score >= 50) return "#FF9800"
    return "#F44336"
  }

  const calculateAcademicScore = (data, aiEvaluationResult = "") => {
    const academicInfo = data?.formData?.academicOverview || {}
    const experience = data?.formData?.experienceTrackRecord || {}

    // Default weights
    const weights = {
      qualification: 30,
      relevance: 25,
      performance: 20,
      certifications: 15,
      honors: 5,
      projects: 5
    }

    const aiScores = aiEvaluationResult ? parseAiEvaluationScores(aiEvaluationResult) : null

    const categoryNames = {
      qualification: "Qualification Level",
      relevance: "Field Relevance",
      performance: "Academic Performance",
      certifications: "Certifications",
      honors: "Academic Honors",
      projects: "Relevant Projects"
    }

    const colors = ["#8D6E63", "#6D4C41", "#A67C52", "#B8860B", "#5D4037", "#795548"]

    const breakdown = Object.entries(categoryNames).map(([key, label], i) => {
      const aiRaw = aiScores?.[key] || 0
      const percent = (aiRaw / 5) * 100
      const weighted = percent * (weights[key] / 100)

      return {
        name: label,
        score: Math.round(percent),
        weight: weights[key],
        weightedScore: Math.round(weighted),
        color: colors[i],
        rawScore: aiRaw,
        maxScore: 5
      }
    })

    const totalScore = Math.round(breakdown.reduce((sum, item) => sum + item.weightedScore, 0))
    return { totalScore, breakdown }
  }

  const getScoreLevel = (score) => {
    if (score >= 90) return {
      level: "Excellent",
      color: "#1B5E20",
      icon: CheckCircle,
      description: "Top academic preparation; ready for advanced internship roles."
    }
    if (score >= 75) return {
      level: "Strong",
      color: "#4CAF50",
      icon: CheckCircle,
      description: "Solid academic base; minor skill add-ons beneficial."
    }
    if (score >= 50) return {
      level: "Developing",
      color: "#FF9800",
      icon: TrendingUp,
      description: "Basic foundation; needs support with professional skills."
    }
    return {
      level: "Needs Support",
      color: "#F44336",
      icon: AlertCircle,
      description: "Minimal academic readiness; intensive support needed."
    }
  }

  const scoreLevel = getScoreLevel(academicScore)
  const ScoreIcon = scoreLevel.icon

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

            {/* Header with gradient */}
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
                  Academic Foundation
                </h2>
             
              </div>
              <p style={{
                margin: "0",
                fontSize: "13px",
                opacity: "0.9",
                fontWeight: "400",
              }}>
                Qualifications assessment
              </p>
            </div>

            {/* Main Content Area */}
            <div style={{
              padding: "24px",
              background: "white",
              textAlign: "center",
            }}>
              {/* Score Circle */}
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
                    {academicScore ?? '--'}%
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
                  {academicScore !== null ? scoreLevel.level : 'Not evaluated'}
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
                Academic Foundation Breakdown
              </h3>

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
                    {academicScore ?? '--'}%
                  </span>
                  <span style={{
                    color: scoreLevel.color,
                    fontSize: "12px",
                    fontWeight: "600",
                    marginTop: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}>
                    {academicScore !== null ? scoreLevel.level : 'Not evaluated'}
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
                  <span>About the Academic Score</span>
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
                      The Academic Foundation Score evaluates a candidate's educational background and readiness for professional internships. It assesses key academic indicators that correlate with workplace success.
                    </p>
                    <div style={{
                      backgroundColor: "#efebe9",
                      padding: "16px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      borderLeft: "4px solid #8d6e63",
                    }}>
                      <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>Key Assessment Areas:</p>
                      <ul style={{ margin: "0", paddingLeft: "20px", color: "#5d4037" }}>
                        <li style={{ marginBottom: "6px" }}><strong>Qualification Level (30%):</strong> Highest degree/diploma level and institution reputation</li>
                        <li style={{ marginBottom: "6px" }}><strong>Field Relevance (25%):</strong> Alignment between studies and internship field</li>
                        <li style={{ marginBottom: "6px" }}><strong>Academic Performance (20%):</strong> GPA, honors, and academic distinctions</li>
                        <li style={{ marginBottom: "6px" }}><strong>Certifications (15%):</strong> Professional and technical certifications</li>
                        <li style={{ marginBottom: "6px" }}><strong>Academic Honors (5%):</strong> Awards, scholarships, and recognition</li>
                        <li style={{ marginBottom: "6px" }}><strong>Relevant Projects (5%):</strong> Academic projects and research experience</li>
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
                    {scoreBreakdown ? (
                      scoreBreakdown.map((item, index) => (
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
                                {item.rawScore}/{item.maxScore} × {item.weight}% weight = {item.weightedScore}%
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
                                height: "100%",
                                background: getProgressBarColor(item.score),
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
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '20px', color: '#8d6e63' }}>
                        No score breakdown available
                      </div>
                    )}
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
                        {academicScore !== null ? (
                          <>
                            {academicScore >= 90 && (
                              <p style={{ margin: "0" }}>
                                <strong>Excellent academic preparation.</strong> {scoreLevel.description} This candidate demonstrates outstanding educational qualifications with highly relevant field of study.
                              </p>
                            )}
                            {academicScore >= 75 && academicScore < 90 && (
                              <p style={{ margin: "0" }}>
                                <strong>Strong academic foundation.</strong> {scoreLevel.description} This candidate shows solid educational background with good academic performance.
                              </p>
                            )}
                            {academicScore >= 50 && academicScore < 75 && (
                              <p style={{ margin: "0" }}>
                                <strong>Developing academic skills.</strong> {scoreLevel.description} Focus on obtaining additional certifications would improve readiness.
                              </p>
                            )}
                            {academicScore < 50 && (
                              <p style={{ margin: "0" }}>
                                <strong>Needs academic support.</strong> {scoreLevel.description} Consider pursuing relevant qualifications before internship responsibilities.
                              </p>
                            )}
                          </>
                        ) : (
                          <p style={{ textAlign: 'center', margin: '20px 0' }}>
                            No evaluation available yet. Run the AI analysis to get started.
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

      <style jsx>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
    </>
  )
}