"use client"
import { useState, useEffect } from "react"
import { ChevronDown, CheckCircle, TrendingUp, AlertCircle, FileText } from "lucide-react"
import { doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../../firebaseConfig"
import NeedHelp from "../../NeedHelp"

export function BigScoreCard({
  styles,
  profileData,
  complianceScore,
  legitimacyScore,
  fundabilityScore,
  pisScore,
  leadershipScore,
  onScoreUpdate,
  onTabChange, // Add this prop to handle tab switching
}) {
  const [showModal, setShowModal] = useState(false)
  const [bigScore, setBigScore] = useState(null)
  const [scoreBreakdown, setScoreBreakdown] = useState([])
  const [showAboutScore, setShowAboutScore] = useState(false)
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false)
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)
  const [showBoostScoreModal, setShowBoostScoreModal] = useState(false)

  useEffect(() => {
    if (showModal) {
      document.body.classList.add("modal-open")
      document.body.style.overflow = "hidden"
    } else {
      document.body.classList.remove("modal-open")
      document.body.style.overflow = ""
    }
    return () => {
      document.body.classList.remove("modal-open")
      document.body.style.overflow = ""
    }
  }, [showModal])

  useEffect(() => {
    if (
      complianceScore !== undefined &&
      complianceScore !== null &&
      legitimacyScore !== undefined &&
      legitimacyScore !== null &&
      fundabilityScore !== undefined &&
      fundabilityScore !== null &&
      pisScore !== undefined &&
      pisScore !== null &&
      leadershipScore !== undefined &&
      leadershipScore !== null &&
      profileData?.id &&
      profileData?.formData
    ) {
      const result = calculateBigScore(
        complianceScore,
        legitimacyScore,
        fundabilityScore,
        pisScore,
        leadershipScore,
        profileData.formData,
      )
      setBigScore(result.totalScore)
      setScoreBreakdown(result.breakdown)
      if (onScoreUpdate) {
        onScoreUpdate(result.totalScore)
      }

      const smeName = profileData?.formData?.entityOverview?.registeredName || "Unnamed SME"
      const evaluationRef = doc(db, "bigEvaluations", profileData.id)
      setDoc(
        evaluationRef,
        {
          smeName: smeName,
          scores: {
            compliance: complianceScore,
            legitimacy: legitimacyScore,
            fundability: fundabilityScore,
            pis: pisScore,
            leadership: leadershipScore,
            bigScore: result.totalScore,
            lastUpdated: new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
          createdAt: serverTimestamp(),
        },
        { merge: true },
      ).catch((err) => console.error("Failed to update BIG evaluation in Firestore:", err))

      const profileRef = doc(db, "universalProfiles", profileData.id)
      updateDoc(profileRef, {
        bigScore: result.totalScore,
        bigScoreUpdatedAt: new Date().toISOString(),
      }).catch((err) => console.error("Failed to update BIG Score in Firestore:", err))
    }
  }, [complianceScore, legitimacyScore, fundabilityScore, pisScore, leadershipScore, profileData, onScoreUpdate])

  // Generate smart recommendations based on scores - UPDATED
  const getRecommendations = () => {
    const recommendations = []

    // Legitimacy Tools
    recommendations.push({
      category: "Legitimacy",
      title: "Legitimacy Tools",
      description:
        "A strong online presence and brand builds trust. If your business looks real, funders and clients will believe it is.",
      action: "Legitimacy Tools",
      tab: "legitimacy",
      priority: "high",
      color: "#6D4C41",
    })

    // Governance Tools
    recommendations.push({
      category: "Governance",
      title: "Governance Tools",
      description:
        "Your Governance score shows whether you're just hustling — or building an enterprise with proper structure and leadership.",
      action: "Governance Tools",
      tab: "governance",
      priority: "medium",
      color: "#B8860B",
    })

    // Compliance Tools
    recommendations.push({
      category: "Compliance",
      title: "Compliance Templates",
      description:
        "Professional legal and regulatory templates to ensure your business meets all compliance requirements and reduces risk.",
      action: "Compliance Tools",
      tab: "compliance",
      priority: "high",
      color: "#8D6E63",
    })

    // Capital Appeal Tools
    recommendations.push({
      category: "Capital Appeal",
      title: "Capital Appeal Tools",
      description:
        "Investment-ready documents and financial templates to make your business attractive to investors and funders.",
      action: "Capital Appeal Tools",
      tab: "fundability",
      priority: "high",
      color: "#A67C52",
    })

    // HR Templates
    recommendations.push({
      category: "Team Development",
      title: "HR Templates",
      description:
        "Streamline your human resources with professional, ready-to-use templates for policies, contracts, and employee management.",
      action: "HR Templates",
      tab: "governance",
      priority: "medium",
      color: "#A0522D",
    })

    // Find Service Provider
    recommendations.push({
      category: "Services",
      title: "Find Service Provider",
      description:
        "Connect with expert service providers to help you with various business needs, from legal and accounting to marketing and HR.",
      action: "Find Service Provider",
      url: "/applications/product/request-overview",
      priority: "low",
      color: "#4CAF50",
    })

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  }

  const getProgressBarColor = (score) => {
    if (score > 90) return "#1B5E20"
    if (score >= 81) return "#4CAF50"
    if (score >= 61) return "#FF9800"
    if (score >= 41) return "#F44336"
    return "#B71C1C"
  }

  const calculateBigScore = (compliance, legitimacy, fundability, pis, leadership, data) => {
    const stage = data?.entityOverview?.operationStage?.toLowerCase() || "ideation"
    const stageWeights = {
      ideation: { compliance: 0.32, legitimacy: 0.13, fundability: 0.32, pis: 0.13, leadership: 0.1 },
      prototype: { compliance: 0.32, legitimacy: 0.13, fundability: 0.32, pis: 0.13, leadership: 0.1 },
      startup: { compliance: 0.32, legitimacy: 0.13, fundability: 0.32, pis: 0.13, leadership: 0.1 },
      "early-growth": { compliance: 0.32, legitimacy: 0.13, fundability: 0.32, pis: 0.13, leadership: 0.1 },
      growth: { compliance: 0.32, legitimacy: 0.13, fundability: 0.32, pis: 0.13, leadership: 0.1 },
      "scale-up": { compliance: 0.32, legitimacy: 0.13, fundability: 0.32, pis: 0.13, leadership: 0.1 },
      mature: { compliance: 0.32, legitimacy: 0.13, fundability: 0.32, pis: 0.13, leadership: 0.1 },
    }
    const weights = stageWeights[stage] || stageWeights.ideation

    const complianceWeighted = compliance * weights.compliance
    const legitimacyWeighted = legitimacy * weights.legitimacy
    const fundabilityWeighted = fundability * weights.fundability
    const leadershipWeighted = leadership * weights.leadership
    const pisWeighted = pis * weights.pis

    const totalScore = Math.round(
      complianceWeighted + legitimacyWeighted + fundabilityWeighted + pisWeighted + leadershipWeighted,
    )

    const breakdown = [
      {
        name: "Compliance score",
        score: compliance,
        weight: Math.round(weights.compliance * 100),
        weightedScore: Math.round(complianceWeighted),
        color: "#8D6E63",
      },
      {
        name: "Legitimacy score",
        score: legitimacy,
        weight: Math.round(weights.legitimacy * 100),
        weightedScore: Math.round(legitimacyWeighted),
        color: "#6D4C41",
      },
      {
        name: "Capital appeal score",
        score: fundability,
        weight: Math.round(weights.fundability * 100),
        weightedScore: Math.round(fundabilityWeighted),
        color: "#A67C52",
      },
      {
        name: "Governance score",
        score: pis,
        weight: Math.round(weights.pis * 100),
        weightedScore: Math.round(pisWeighted),
        color: "#B8860B",
      },
      {
        name: "Leadership score",
        score: leadership,
        weight: Math.round(weights.leadership * 100),
        weightedScore: Math.round(leadershipWeighted),
        color: "#A0522D",
      },
    ]

    return { totalScore, breakdown }
  }

  const getScoreLevel = (score) => {
    if (!score && score !== 0) return { level: "Calculating...", color: "#9E9E9E", icon: AlertCircle, description: "" }
    if (score >= 91)
      return {
        level: "Exceptional",
        color: "#1B5E20",
        icon: CheckCircle,
      }
    if (score >= 81)
      return {
        level: "Strong",
        color: "#4CAF50",
        icon: CheckCircle,
      }
    if (score >= 61)
      return {
        level: "Progressing",
        color: "#FF9800",
        icon: TrendingUp,
      }
    if (score >= 41)
      return {
        level: "Foundational",
        color: "#F44336",
        icon: AlertCircle,
      }
    return {
      level: "Emerging",
      color: "#B71C1C",
      icon: AlertCircle,
    }
  }

  const scoreLevel = getScoreLevel(bigScore)
  const ScoreIcon = scoreLevel.icon
  const recommendations = getRecommendations()

  // NEW: Handle tool card click
  const handleToolClick = (rec) => {
    setShowBoostScoreModal(false)
    
    if (rec.url) {
      // External URL - navigate normally
      window.location.href = rec.url
    } else if (rec.tab && onTabChange) {
      // Switch to tools tab and set the category
      onTabChange("tools", rec.tab)
    }
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
          minWidth: "300px",
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
              width: "100%",
            }}
          >
            <h2
              style={{
                margin: "0",
                fontSize: "20px",
                fontWeight: "700",
                letterSpacing: "0.5px",
                flex: "1",
              }}
            >
              BIG Score
            </h2>
            <div style={{ marginLeft: "auto" }}>
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.3)",
                  borderRadius: "8px",
                  padding: "2px",
                }}
              >
                <NeedHelp disabled={bigScore === null} />
              </div>
            </div>
          </div>
          <p
            style={{
              margin: "0",
              fontSize: "13px",
              opacity: "0.9",
              fontWeight: "400",
            }}
          >
            Overall business assessment
          </p>
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
                {bigScore !== null ? `${bigScore}%` : "..."}
              </span>
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
            <button
              onClick={() => setShowModal(true)}
              disabled={bigScore === null}
              style={{
                flex: "1",
                padding: "13px 6px",
                borderRadius: "8px",
                background:
                  bigScore === null
                    ? "linear-gradient(135deg, #cccccc 0%, #aaaaaa 100%)"
                    : "linear-gradient(135deg, #5d4037 0%, #4a2c20 100%)",
                color: "white",
                border: "none",
                fontWeight: "600",
                fontSize: "12px",
                cursor: bigScore === null ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "2px",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 16px rgba(93, 64, 55, 0.3)",
                whiteSpace: "nowrap",
                opacity: bigScore === null ? 0.7 : 1,
              }}
              onMouseOver={(e) => {
                if (bigScore !== null) {
                  e.target.style.transform = "translateY(-2px)"
                  e.target.style.boxShadow = "0 6px 20px rgba(93, 64, 55, 0.4)"
                }
              }}
              onMouseOut={(e) => {
                if (bigScore !== null) {
                  e.target.style.transform = "translateY(0px)"
                  e.target.style.boxShadow = "0 4px 16px rgba(93, 64, 55, 0.3)"
                }
              }}
            >
              <span>Score breakdown</span>
              <ChevronDown size={16} />
            </button>
            <button
              onClick={() => setShowBoostScoreModal(true)}
              disabled={bigScore === null}
              style={{
                flex: "1",
                padding: "12px 14px",
                borderRadius: "8px",
                background:
                  bigScore === null
                    ? "linear-gradient(135deg, #cccccc 0%, #aaaaaa 100%)"
                    : "linear-gradient(135deg, #8D6E63 0%, #6D4C41 100%)",
                color: "white",
                border: "none",
                fontWeight: "600",
                fontSize: "12px",
                cursor: bigScore === null ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 16px rgba(141, 110, 99, 0.3)",
                whiteSpace: "nowrap",
                opacity: bigScore === null ? 0.7 : 1,
              }}
              onMouseOver={(e) => {
                if (bigScore !== null) {
                  e.target.style.transform = "translateY(-2px)"
                  e.target.style.boxShadow = "0 6px 20px rgba(141, 110, 99, 0.4)"
                }
              }}
              onMouseOut={(e) => {
                if (bigScore !== null) {
                  e.target.style.transform = "translateY(0px)"
                  e.target.style.boxShadow = "0 4px 16px rgba(141, 110, 99, 0.3)"
                }
              }}
            >
              <span>Boost your score</span>
            </button>
          </div>
        </div>

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
              maxWidth: "600px",
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
              {"×"}
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
                BIG score breakdown
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
                    {bigScore !== null ? `${bigScore}%` : "..."}
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
                    {profileData?.formData?.entityOverview?.operationStage || "Ideation"}
                  </span>
                </div>
              </div>

              {/* About the BIG Score section */}
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
                  <span>About the BIG score</span>
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
                      The BIG score combines your compliance, legitimacy, team, fundability, and governance scores into
                      one comprehensive business readiness metric that reflects your overall organizational maturity and
                      market readiness.
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
                      <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>Five key components:</p>
                      <ul style={{ margin: "0", paddingLeft: "20px", color: "#5d4037" }}>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Compliance score (32%):</strong> Legal and regulatory documentation and compliance
                          status
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Legitimacy score (13%):</strong> Business credibility, professionalism, and market
                          presence
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Fundability score (32%):</strong> Investment readiness, financial health, and growth
                          potential
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Governance score (13%):</strong> Board readiness and governance maturity indicators
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Team score (10%):</strong> Evaluates the team capabilities and experience of business
                          owners and key executives
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
                          <strong>91-100%:</strong> Exceptional - Your business is highly prepared for major
                          opportunities, partnerships, and growth.
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>81-90%:</strong> Strong - Well-positioned for scaling, funding, and strategic
                          partnerships.
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>61-80%:</strong> Progressing - On track with solid foundations. Strengthen key areas
                          to unlock full potential.
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>41-60%:</strong> Foundational - Core building blocks are in place, but targeted
                          improvements are needed to advance.
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>0-40%:</strong> Emerging - Your business is in the early stages of readiness. Focus on
                          key priorities to grow.
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
                      <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>Weighted assessment:</p>
                      <p style={{ margin: "0", color: "#5d4037" }}>
                        Compliance and fundability receive the highest weights (32% each) as they represent the
                        fundamental legal foundation and investment attractiveness that drive business opportunities and
                        partnerships.
                      </p>
                    </div>
                    <p style={{ marginBottom: "0", lineHeight: "1.6", fontStyle: "italic", color: "#6d4c41" }}>
                      Your BIG score provides a comprehensive view of your business readiness across all critical
                      dimensions that matter to investors, partners, and stakeholders.
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
                    {bigScore !== null &&
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
                      {bigScore >= 91 && (
                        <p style={{ margin: "0" }}>
                          <strong>Outstanding business readiness.</strong> Your organization demonstrates excellence
                          across all critical dimensions - compliance, legitimacy, fundability, and governance. You're
                          exceptionally well-positioned for major funding opportunities, strategic partnerships, and
                          rapid scaling. This level of business maturity places you in the top tier of investment-ready
                          companies.
                        </p>
                      )}
                      {bigScore >= 81 && bigScore <= 90 && (
                        <p style={{ margin: "0" }}>
                          <strong>Strong overall business position.</strong> Your company shows solid performance across
                          most areas with good compliance, credibility, and fundability foundations. You're
                          well-prepared for growth opportunities and would be attractive to most investors and partners.
                          Minor improvements in weaker areas could elevate you to exceptional status.
                        </p>
                      )}
                      {bigScore >= 61 && bigScore <= 80 && (
                        <p style={{ margin: "0" }}>
                          <strong>Fair business readiness with improvement opportunities.</strong> While you have
                          established foundations in several areas, significant gaps remain that may limit access to
                          premium opportunities. Focus on strengthening your weakest scores - particularly compliance
                          and fundability - to improve your overall market position.
                        </p>
                      )}
                      {bigScore >= 41 && bigScore <= 60 && (
                        <p style={{ margin: "0" }}>
                          <strong>Basic foundation requiring substantial development.</strong> Your business shows some
                          positive elements but lacks the comprehensive readiness needed for major opportunities.
                          Systematic improvements across compliance, legitimacy, and operational areas are essential
                          before pursuing significant funding or partnerships.
                        </p>
                      )}
                      {bigScore <= 40 && (
                        <p style={{ margin: "0" }}>
                          <strong>Fundamental improvements urgently needed.</strong> Your business requires
                          comprehensive strengthening across multiple critical areas. Focus immediately on achieving
                          basic compliance, establishing professional legitimacy, and building fundamental operational
                          capabilities before pursuing external opportunities.
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

      {/* UPDATED Boost Score Modal - Removed icons, cleaner design */}
      {showBoostScoreModal && (
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
              setShowBoostScoreModal(false)
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
              maxWidth: "800px",
              border: "1px solid #ccc",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowBoostScoreModal(false)}
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
              {"×"}
            </button>
            <div style={{ padding: "30px 20px 20px 20px" }}>
              <h3
                style={{
                  margin: "0 0 20px 0",
                  fontSize: "24px",
                  fontWeight: "600",
                  color: "#8D6E63",
                  textAlign: "center",
                }}
              >
                Boost Your BIG Score
              </h3>

              {/* Low Score Catalyst Message - Only show when score < 50% */}
              {bigScore !== null && bigScore < 50 && (
                <div
                  style={{
                    marginBottom: "20px",
                    padding: "20px",
                    background: "linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)",
                    borderRadius: "12px",
                    border: "2px solid #D32F2F",
                    textAlign: "center",
                  }}
                >
                  <h4 style={{
                    margin: "0 0 12px 0",
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#B71C1C"
                  }}>
                    Need Help Getting Started?
                  </h4>
                  <p style={{
                    margin: "0 0 16px 0",
                    fontSize: "14px",
                    color: "#C62828",
                    lineHeight: "1.6"
                  }}>
                    Your score indicates you may benefit from incubation or acceleration support to strengthen your business foundation.
                  </p>
                  <button
                    onClick={() => {
                      setShowBoostScoreModal(false);
                      window.location.href = "/applications/product/request-overview";
                    }}
                    style={{
                      width: "100%",
                      background: "linear-gradient(135deg, #D32F2F, #B71C1C)",
                      color: "white",
                      border: "none",
                      padding: "14px 24px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      boxShadow: "0 4px 12px rgba(211, 47, 47, 0.3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}
                    onMouseOver={(e) => {
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow = "0 6px 16px rgba(211, 47, 47, 0.4)";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "0 4px 12px rgba(211, 47, 47, 0.3)";
                    }}
                  >
                    Apply for Catalyst Program
                  </button>
                </div>
              )}

              {recommendations.length > 0 ? (
                <>
                  <div
                    style={{
                      background: "linear-gradient(135deg, #F5F2F0 0%, #EFEBE9 100%)",
                      padding: "16px",
                      borderRadius: "8px",
                      border: "2px solid #8D6E63",
                      marginBottom: "20px",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 8px 0",
                        color: "#6D4C41",
                        fontSize: "16px",
                        fontWeight: "700",
                      }}
                    >
                      Targeted Growth Tools
                    </p>
                    <p
                      style={{
                        margin: "0",
                        color: "#5D4037",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      Purchase these specialized tools to improve your BIG Score and unlock funding opportunities
                    </p>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {recommendations.map((rec, index) => (
                      <div
                        key={index}
                        style={{
                          background: `linear-gradient(135deg, #8D6E63 0%, #6D4C41 100%)`,
                          color: "white",
                          border: "none",
                          padding: "24px 20px",
                          borderRadius: "12px",
                          fontSize: "14px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: "16px",
                          transition: "all 0.2s ease",
                          textAlign: "left",
                          lineHeight: "1.4",
                          minHeight: "140px",
                          position: "relative",
                          overflow: "hidden",
                          boxShadow: "0 4px 12px rgba(141, 110, 99, 0.3)",
                        }}
                        onClick={() => handleToolClick(rec)}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = "translateY(-3px)"
                          e.currentTarget.style.boxShadow = "0 8px 20px rgba(141, 110, 99, 0.4)"
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = "translateY(0px)"
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(141, 110, 99, 0.3)"
                        }}
                      >
                        {/* Priority badge */}
                        {rec.priority === "critical" && (
                          <div
                            style={{
                              position: "absolute",
                              top: "12px",
                              right: "12px",
                              background: "#D32F2F",
                              color: "white",
                              padding: "4px 8px",
                              borderRadius: "12px",
                              fontSize: "10px",
                              fontWeight: "700",
                              textTransform: "uppercase",
                            }}
                          >
                            URGENT
                          </div>
                        )}
                        <div style={{ flex: "1", width: "100%" }}>
                          <h4 style={{ 
                            fontSize: "18px", 
                            fontWeight: "700",
                            margin: "0 0 12px 0",
                            color: "white"
                          }}>
                            {rec.title}
                          </h4>
                          <p
                            style={{
                              fontSize: "13px",
                              fontWeight: "400",
                              margin: "0",
                              opacity: "0.95",
                              lineHeight: "1.5",
                            }}
                          >
                            {rec.description}
                          </p>
                        </div>
                        <div
                          style={{
                            width: "100%",
                            background: "linear-gradient(135deg, #A67C52 0%, #8D6E63 100%)",
                            padding: "12px 16px",
                            borderRadius: "8px",
                            textAlign: "center",
                            fontSize: "13px",
                            fontWeight: "700",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            border: "2px solid rgba(255, 255, 255, 0.2)",
                            marginTop: "auto",
                          }}
                        >
                          {rec.action === "Find Service Provider"
                            ? "Find Service Provider"
                            : `Purchase ${rec.action}`}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      marginTop: "24px",
                      padding: "20px",
                      background: "linear-gradient(135deg, #F3E8DC 0%, #E8D8CF 100%)",
                      borderRadius: "12px",
                      border: "2px solid #A67C52",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 10px 0",
                        color: "#5D4037",
                        fontSize: "16px",
                        fontWeight: "700",
                      }}
                    >
                      Why Invest in Growth Tools?
                    </p>
                    <p
                      style={{
                        margin: "0",
                        color: "#6D4C41",
                        fontSize: "14px",
                        lineHeight: "1.5",
                      }}
                    >
                      Each tool is strategically designed to boost specific areas of your BIG Score. Higher scores lead
                      to better funding opportunities, stronger corporate partnerships, and accelerated business growth.
                    </p>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    background: "linear-gradient(135deg, #F3E8DC 0%, #E8D8CF 100%)",
                    borderRadius: "12px",
                    border: "2px solid #A67C52",
                  }}
                >
                  <p style={{ fontSize: "18px", fontWeight: "700", color: "#5D4037", margin: "0 0 12px 0" }}>
                    Outstanding Performance!
                  </p>
                  <p style={{ fontSize: "15px", color: "#6D4C41", margin: "0" }}>
                    Your scores are excellent across all areas. Consider our premium optimization tools for advanced
                    growth strategies.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  )
}