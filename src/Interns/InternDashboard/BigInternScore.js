"use client"

import { useState, useEffect } from "react"
import { ChevronDown, CheckCircle, TrendingUp, AlertCircle, GraduationCap } from "lucide-react"
import { doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../../firebaseConfig"

export function BigInternScore({
  profileData,
  academicScore,
  professionalSkillsScore,
  workExperienceScore,
  professionalPresentationScore,
  onScoreUpdate,
}) {
  const [showModal, setShowModal] = useState(false)
  const [bigInternScore, setBigInternScore] = useState(null)
  const [scoreBreakdown, setScoreBreakdown] = useState([])
  const [showAboutScore, setShowAboutScore] = useState(false)
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false)
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : ""
    return () => (document.body.style.overflow = "")
  }, [showModal])

  useEffect(() => {
    const calculateAndSaveScore = async () => {
      if (
        academicScore !== null &&
        professionalSkillsScore !== null &&
        workExperienceScore !== null &&
        professionalPresentationScore !== null &&
        profileData?.id
      ) {
        const result = calculateBigInternScore(
          academicScore,
          professionalSkillsScore,
          workExperienceScore,
          professionalPresentationScore,
        )

        // Only update if score has changed
        if (result.totalScore !== bigInternScore) {
          setBigInternScore(result.totalScore)
          setScoreBreakdown(result.breakdown)

          try {
            // Save to evaluations collection
            const evaluationRef = doc(db, "internEvaluations", profileData.id)
            await setDoc(
              evaluationRef,
              {
                scores: {
                  academic: academicScore,
                  professionalSkills: professionalSkillsScore,
                  workExperience: workExperienceScore,
                  professionalPresentation: professionalPresentationScore,
                  bigInternScore: result.totalScore,
                  lastUpdated: new Date().toISOString(),
                },
                updatedAt: new Date().toISOString(),
                createdAt: serverTimestamp(),
              },
              { merge: true }
            )

            // Also update the profile with the latest score
            const profileRef = doc(db, "internProfiles", profileData.id)
            await updateDoc(profileRef, {
              bigInternScore: result.totalScore,
              bigInternScoreUpdatedAt: new Date().toISOString(),
            })
          } catch (error) {
            console.error("Failed to update intern score in Firestore:", error)
          }
        }

        if (onScoreUpdate) {
          onScoreUpdate(result.totalScore)
        }
      }
      setIsLoading(false)
    }

    calculateAndSaveScore()
  }, [
    academicScore,
    professionalSkillsScore,
    workExperienceScore,
    professionalPresentationScore,
    profileData,
    onScoreUpdate,
    bigInternScore
  ])

  const calculateBigInternScore = (academic, professional, work, presentation) => {
    // Weights: Academic 35%, Professional Skills 40%, Work Experience 5%, Professional Presentation 20%
    const weights = {
      academic: 0.35,
      professional: 0.4,
      work: 0.05,
      presentation: 0.2,
    }

    const academicWeighted = academic * weights.academic
    const professionalWeighted = professional * weights.professional
    const workWeighted = work * weights.work
    const presentationWeighted = presentation * weights.presentation

    const totalScore = Math.round(academicWeighted + professionalWeighted + workWeighted + presentationWeighted)

    const breakdown = [
      {
        name: "Academic Foundation",
        score: academic,
        weight: Math.round(weights.academic * 100),
        weightedScore: Math.round(academicWeighted),
        color: "#8D6E63",
      },
      {
        name: "Professional Skills",
        score: professional,
        weight: Math.round(weights.professional * 100),
        weightedScore: Math.round(professionalWeighted),
        color: "#6D4C41",
      },
      {
        name: "Work Experience",
        score: work,
        weight: Math.round(weights.work * 100),
        weightedScore: Math.round(workWeighted),
        color: "#A67C52",
      },
      {
        name: "Professional Presentation",
        score: presentation,
        weight: Math.round(weights.presentation * 100),
        weightedScore: Math.round(presentationWeighted),
        color: "#B8860B",
      },
    ]

    return { totalScore, breakdown }
  }

  const getProgressBarColor = (score) => {
    if (score >= 90) return "#1B5E20" // Dark green
    if (score >= 75) return "#4CAF50" // Green
    if (score >= 50) return "#FF9800" // Orange
    return "#F44336" // Red
  }

  const getScoreLevel = (score) => {
    if (!score && score !== 0) return { level: "Calculating...", color: "#9E9E9E", icon: AlertCircle, description: "" }

    if (score >= 90)
      return {
        level: "Excellent",
        color: "#1B5E20",
        icon: CheckCircle,

      }
    if (score >= 75)
      return {
        level: "Strong",
        color: "#4CAF50",
        icon: CheckCircle,

      }
    if (score >= 50)
      return {
        level: "Developing",
        color: "#FF9800",
        icon: TrendingUp,

      }
    return {
      level: "Needs Support",
      color: "#F44336",
      icon: AlertCircle,

    }
  }

  const scoreLevel = getScoreLevel(bigInternScore)
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
          minWidth: "350px",
          maxWidth: "500px",
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
                fontSize: "20px",
                fontWeight: "700",
                letterSpacing: "0.5px",
                whiteSpace: "nowrap",
              }}
            >
              BIG Intern Score
            </h2>
            <GraduationCap size={24} style={{ opacity: 0.8 }} />
          </div>
          <p
            style={{
              margin: "0",
              fontSize: "13px",
              opacity: "0.9",
              fontWeight: "400",
            }}
          >
            Overall intern readiness assessment
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
                {bigInternScore !== null ? `${bigInternScore}%` : "..."}
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
              {scoreLevel.level}
            </div>
          </div>

          {/* Score Description */}
          {scoreLevel.description && (
            <div
              style={{
                marginBottom: "20px",
                padding: "16px",
                background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                borderRadius: "12px",
                border: `2px solid ${scoreLevel.color}20`,
              }}
            >
              <p
                style={{
                  margin: "0",
                  fontSize: "14px",
                  color: "#495057",
                  lineHeight: "1.5",
                  fontWeight: "500",
                }}
              >
                {scoreLevel.description}
              </p>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={() => setShowModal(true)}
            disabled={bigInternScore === null}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "10px",
              background:
                bigInternScore === null
                  ? "linear-gradient(135deg, #cccccc 0%, #aaaaaa 100%)"
                  : "linear-gradient(135deg, #5d4037 0%, #4a2c20 100%)",
              color: "white",
              border: "none",
              marginTop: "15px",
              fontWeight: "600",
              fontSize: "12px",
              cursor: bigInternScore === null ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 16px rgba(93, 64, 55, 0.3)",
              whiteSpace: "nowrap",
              opacity: bigInternScore === null ? 0.7 : 1,
            }}
            onMouseOver={(e) => {
              if (bigInternScore !== null) {
                e.target.style.transform = "translateY(-2px)"
                e.target.style.boxShadow = "0 6px 20px rgba(93, 64, 55, 0.4)"
              }
            }}
            onMouseOut={(e) => {
              if (bigInternScore !== null) {
                e.target.style.transform = "translateY(0px)"
                e.target.style.boxShadow = "0 4px 16px rgba(93, 64, 55, 0.3)"
              }
            }}
          >
            <span>Score breakdown</span>
            <ChevronDown size={16} />
          </button>
        </div>

        {/* CSS Animations */}
        <style>{`
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
            zIndex: "9999999", // Increase z-index
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
              zIndex: "9999999", // Increase z-index
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
                BIG Intern Score Breakdown
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
                    {bigInternScore !== null ? `${bigInternScore}%` : "..."}
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
                  <span>Intern candidate: </span>
                  <span
                    style={{
                      fontWeight: "600",
                      color: "#5d4037",
                      textTransform: "capitalize",
                    }}
                  >
                    {profileData?.formData?.personalInfo?.name || "Candidate"}
                  </span>
                </div>
              </div>

              {/* About the BIG Intern Score section */}
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
                  <span>About the BIG Intern Score</span>
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
                      The BIG Intern Score evaluates intern readiness across four critical dimensions that predict
                      workplace success and professional growth potential.
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
                          <strong>Academic Foundation (35%):</strong> Educational qualifications, field relevance, and
                          professional certifications
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Professional Skills (40%):</strong> Problem-solving abilities, critical thinking, and
                          workplace solution capabilities
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Work Experience (5%):</strong> Practical exposure through projects, internships, and
                          volunteer work
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Professional Presentation (20%):</strong> Communication skills, professionalism, and
                          alignment with organizational values
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
                          <strong>90-100% (Excellent):</strong> Outstanding intern readiness across all dimensions
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>75-89% (Strong):</strong> Well-prepared for internship with solid foundations
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>50-74% (Developing):</strong> Good potential with areas for improvement
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>0-49% (Needs Support):</strong> Requires additional preparation and support
                        </li>
                      </ul>
                    </div>
                    <p style={{ marginBottom: "0", lineHeight: "1.6", fontStyle: "italic", color: "#6d4c41" }}>
                      The BIG Intern Score helps organizations identify candidates who combine academic excellence with
                      practical readiness and professional maturity.
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
                    {bigInternScore !== null &&
                      scoreBreakdown.map((item, index) => (
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
                                {item.score}% × {item.weight}% weight = {item.weightedScore}%
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
                    <div style={{ color: "#5d4037", lineHeight: "1.6" }}>
                      {bigInternScore >= 90 && (
                        <p style={{ margin: "0" }}>
                          <strong>Excellent intern readiness achieved.</strong> This candidate demonstrates outstanding
                          preparation across all assessment dimensions. They possess strong academic credentials,
                          excellent professional skills, and superior communication abilities. This candidate is ready
                          for challenging internship roles and shows high potential for rapid professional development.
                        </p>
                      )}
                      {bigInternScore >= 75 && bigInternScore <= 89 && (
                        <p style={{ margin: "0" }}>
                          <strong>Strong intern candidate with solid foundations.</strong> This candidate shows good
                          preparation across most areas with strong academic background and developing professional
                          skills. They would benefit from mentorship in areas of growth but are well-positioned for
                          successful internship experiences.
                        </p>
                      )}
                      {bigInternScore >= 50 && bigInternScore <= 74 && (
                        <p style={{ margin: "0" }}>
                          <strong>Developing candidate with growth potential.</strong> This candidate shows promise but
                          would benefit from additional support and structured development. Focus areas may include
                          professional skill development, communication enhancement, or practical experience building.
                        </p>
                      )}
                      {bigInternScore < 50 && (
                        <p style={{ margin: "0" }}>
                          <strong>Candidate requires significant support and development.</strong> While showing
                          potential, this candidate would benefit from preparatory programs, skill development
                          workshops, and intensive mentoring before beginning internship responsibilities.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}