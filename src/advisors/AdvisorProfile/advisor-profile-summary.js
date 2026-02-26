"use client"

import { useState, useEffect } from "react"
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Award,
  Globe,
  Heart,
  MapPin,
  Clock,
  Check,
  Star,
  Shield,
  TrendingUp,
  User,
  Mail,
} from "lucide-react"
import { createPortal } from "react-dom"

const VerificationScoreCard = ({ profileData }) => {
  const [showModal, setShowModal] = useState(false)
  const [verificationScore, setVerificationScore] = useState(0)
  const [scoreBreakdown, setScoreBreakdown] = useState({})
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    if (profileData) {
      const { score, breakdown } = calculateVerificationScore(profileData)
      setVerificationScore(score)
      setScoreBreakdown(breakdown)

      // Animate score
      let start = 0
      const increment = score / 50
      const timer = setInterval(() => {
        start += increment
        if (start >= score) {
          setAnimatedScore(score)
          clearInterval(timer)
        } else {
          setAnimatedScore(Math.floor(start))
        }
      }, 30)

      return () => clearInterval(timer)
    }
  }, [profileData])

  const calculateVerificationScore = (profileData) => {
    // Initialize breakdown object
    const breakdown = {
      identityLegal: { score: 0, max: 5, weight: 0.2 },
      engagement: { score: 0, max: 5, weight: 0.25 },
      mandate: { score: 0, max: 5, weight: 0.2 },
      trackRecord: { score: 0, max: 5, weight: 0.2 },
      referrals: { score: 0, max: 5, weight: 0.15 },
    }

    // 1. Identity & Legal Standing (20%)
    if (
      profileData?.legalCompliance?.cipcStatus === "compliant" &&
      profileData?.documentUpload?.registrationDocs?.length > 0
    ) {
      breakdown.identityLegal.score += 3 // Basic registration

      if (
        profileData?.ownershipManagement?.certifiedIDs?.length > 0 &&
        profileData?.ownershipManagement?.directors?.length > 0
      ) {
        breakdown.identityLegal.score += 2 // Verified personnel
      }
    }

    // 2. Engagement History (25%)
    // Placeholder - would normally check platform interaction logs
    // For now, we'll assume some engagement if profile is complete
    if (profileData?.completedSections?.entityOverview && profileData?.completedSections?.fundDetails) {
      breakdown.engagement.score = 3 // Registered with some activity

      // If they have uploaded multiple documents, assume more active
      const docCount = Object.values(profileData.documentUpload || {}).reduce(
        (acc, curr) => acc + (Array.isArray(curr) ? curr.length : 0),
        0,
      )
      if (docCount > 5) {
        breakdown.engagement.score = 5 // Very active
      }
    }

    // 3. Investment Mandate (20%)
    if (
      profileData?.productsServices?.fundMandate?.length > 0 ||
      profileData?.documentUpload?.fundMandate?.length > 0
    ) {
      breakdown.mandate.score = 5 // Full mandate uploaded
    } else if (
      profileData?.fundDetails?.funds?.[0]?.averageDealSize ||
      profileData?.productsServices?.sectorFocus?.length > 0
    ) {
      breakdown.mandate.score = 3 // Some criteria available
    }

    // 4. Track Record (20%)
    if (profileData?.fundManageOverview?.numberOfInvestments > 0 || profileData?.productsServices?.portfolioCompanies) {
      breakdown.trackRecord.score = 3 // Mentioned deals

      if (profileData?.documentUpload?.fundProspectus?.length > 0 || profileData?.productsServices?.successStory) {
        breakdown.trackRecord.score = 5 // Documented impact
      }
    }

    // 5. Referrals/Reputation (15%)
    // Placeholder - would normally check platform references
    // For now, we'll look at accreditations as a proxy
    if (
      profileData?.legalCompliance?.industryAccreditationDocs?.length > 0 ||
      profileData?.documentUpload?.industryAccreditationDocs?.length > 0
    ) {
      breakdown.referrals.score = 3 // Indirect affiliation

      if (profileData?.legalCompliance?.bbbeeLevel && profileData?.legalCompliance?.bbbeeCert?.length > 0) {
        breakdown.referrals.score = 5 // Direct endorsement (via B-BBEE)
      }
    }

    // Calculate weighted total score (0-25)
    const totalScore = Object.values(breakdown).reduce((sum, category) => sum + category.score * category.weight * 5, 0)

    // Convert to 0-100 scale for display
    const displayScore = Math.round((totalScore / 25) * 100)

    return { score: displayScore, breakdown }
  }

  const getTierInfo = (score) => {
    const normalizedScore = Math.round((score / 100) * 25) // Convert back to 0-25 scale

    if (normalizedScore >= 21)
      return {
        name: "Tier 1",
        badge: "🟢 Verified Partner",
        description: "Fully verified, transparent, responsive, and trusted.",
      }
    if (normalizedScore >= 16)
      return {
        name: "Tier 2",
        badge: "🔵 Trusted Entity",
        description: "Actively engaged, most disclosures complete.",
      }
    if (normalizedScore >= 11)
      return {
        name: "Tier 3",
        badge: "⚪ Registered",
        description: "Legal entity and partial verification.",
      }
    return {
      name: "Tier 4",
      badge: "❌ Not Verified",
      description: "Limited visibility or excluded from deal matching.",
    }
  }

  const getScoreColor = (score) => {
    const tier = getTierInfo(score).name
    if (tier === "Tier 1") return "linear-gradient(135deg, #4CAF50, #2E7D32)"
    if (tier === "Tier 2") return "linear-gradient(135deg, #2196F3, #1565C0)"
    if (tier === "Tier 3") return "linear-gradient(135deg, #9E9E9E, #616161)"
    return "linear-gradient(135deg, #F44336, #C62828)"
  }

  const getScoreTextColor = (score) => {
    return "#ffffff" // White text for all tiers for better contrast
  }

  const tierInfo = getTierInfo(verificationScore)

  // Modal component that renders outside using portal
  const Modal = () => {
    if (!showModal) return null

    return createPortal(
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(74, 53, 47, 0.6)",
          backdropFilter: "blur(12px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 999999,
          animation: "fadeIn 0.3s ease-out",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowModal(false)
          }
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #faf7f2 0%, #f5f0e1 100%)",
            borderRadius: "20px",
            padding: "32px",
            width: "90%",
            maxWidth: "700px",
            maxHeight: "80vh",
            overflow: "auto",
            position: "relative",
            boxShadow: "0 32px 64px rgba(74, 53, 47, 0.2)",
            border: "1px solid rgba(200, 182, 166, 0.3)",
            animation: "slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            margin: "20px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setShowModal(false)}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              width: "40px",
              height: "40px",
              background: "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
              border: "none",
              borderRadius: "50%",
              fontSize: "20px",
              cursor: "pointer",
              color: "#4a352f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "linear-gradient(135deg, #c8b6a6, #a67c52)"
              e.target.style.color = "#faf7f2"
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "linear-gradient(135deg, #e6d7c3, #c8b6a6)"
              e.target.style.color = "#4a352f"
            }}
          >
            ×
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            <Shield size={28} color="#4a352f" />
            <h3
              style={{
                color: "#4a352f",
                fontSize: "24px",
                fontWeight: "700",
                margin: 0,
              }}
            >
              Advisor Verification Details
            </h3>
          </div>

          <div
            style={{
              padding: "24px",
              background: "linear-gradient(135deg, rgba(240, 230, 217, 0.6), rgba(245, 240, 225, 0.6))",
              borderRadius: "16px",
              fontSize: "14px",
              lineHeight: "1.6",
              marginBottom: "32px",
              border: "1px solid rgba(200, 182, 166, 0.2)",
            }}
          >
            <p style={{ margin: "0 0 16px 0", fontWeight: "600", color: "#4a352f", fontSize: "16px" }}>
              🎯 The Advisor Verification Score ensures credible and transparent funding partnerships.
            </p>
            <p style={{ margin: "0 0 12px 0", color: "#7d5a50" }}>
              Your current verification status: <strong>{tierInfo.name}</strong> ({tierInfo.badge})
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "12px",
                margin: "16px 0",
              }}
            >
              {[
                "Track record of past investments",
                "Responsiveness and deal completion behavior",
                "Clarity on funding criteria and ticket sizes",
                "Credibility signals from networks and referrals",
                "KYC and investment mandate documents",
                "CIPC registration and identity verification",
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#7d5a50",
                  }}
                >
                  <Check size={16} color="#4a352f" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Score Breakdown */}
          <div style={{ marginBottom: "24px" }}>
            <h4
              style={{
                color: "#4a352f",
                fontSize: "18px",
                fontWeight: "600",
                margin: "0 0 16px 0",
              }}
            >
              Verification Score Breakdown
            </h4>

            <div
              style={{
                display: "grid",
                gap: "12px",
              }}
            >
              {Object.entries(scoreBreakdown).map(([category, data]) => {
                const categoryNames = {
                  identityLegal: "Identity & Legal Standing",
                  engagement: "Engagement History",
                  mandate: "Investment Mandate",
                  trackRecord: "Track Record",
                  referrals: "Referrals / Reputation",
                }

                return (
                  <div
                    key={category}
                    style={{
                      padding: "16px",
                      background: "linear-gradient(135deg, rgba(240, 230, 217, 0.3), rgba(245, 240, 225, 0.3))",
                      borderRadius: "12px",
                      border: "1px solid rgba(200, 182, 166, 0.2)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: "600",
                          color: "#4a352f",
                        }}
                      >
                        {categoryNames[category]}
                      </span>
                      <span
                        style={{
                          fontWeight: "600",
                          color: "#7d5a50",
                        }}
                      >
                        {data.score} / {data.max} points
                      </span>
                    </div>

                    <div
                      style={{
                        height: "6px",
                        width: "100%",
                        background: "rgba(200, 182, 166, 0.2)",
                        borderRadius: "3px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${(data.score / data.max) * 100}%`,
                          background: "linear-gradient(135deg, #a67c52, #7d5a50)",
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "4px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#7d5a50",
                        }}
                      >
                        Weight: {data.weight * 100}%
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#7d5a50",
                        }}
                      >
                        Contribution: {Math.round(data.score * data.weight * 20)}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tier Information */}
          <div
            style={{
              padding: "16px",
              background: "linear-gradient(135deg, rgba(166, 124, 82, 0.1), rgba(125, 90, 80, 0.05))",
              borderRadius: "12px",
              border: "1px solid rgba(166, 124, 82, 0.2)",
            }}
          >
            <h4
              style={{
                color: "#4a352f",
                fontSize: "18px",
                fontWeight: "600",
                margin: "0 0 12px 0",
              }}
            >
              Verification Tiers
            </h4>

            <div
              style={{
                display: "grid",
                gap: "8px",
              }}
            >
              {[
                {
                  min: 21,
                  max: 25,
                  badge: "🟢",
                  name: "Tier 1: Verified Partner",
                  desc: "Fully verified, transparent, responsive, and trusted. Shown first in match results.",
                },
                {
                  min: 16,
                  max: 20,
                  badge: "🔵",
                  name: "Tier 2: Trusted Entity",
                  desc: "Actively engaged, most disclosures complete. Eligible for matches and higher visibility.",
                },
                {
                  min: 11,
                  max: 15,
                  badge: "⚪",
                  name: "Tier 3: Registered",
                  desc: "Legal entity and partial verification. Listed, but with lower match priority.",
                },
                {
                  min: 0,
                  max: 10,
                  badge: "❌",
                  name: "Tier 4: Not Verified",
                  desc: "No badge shown. Limited visibility or excluded from deal matching.",
                },
              ].map((tier, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "12px",
                    padding: "12px",
                    background: verificationScore >= tier.min * 4 ? "rgba(255,255,255,0.3)" : "transparent",
                    borderRadius: "8px",
                    border: verificationScore >= tier.min * 4 ? "1px solid rgba(166, 124, 82, 0.3)" : "none",
                  }}
                >
                  <span
                    style={{
                      fontSize: "20px",
                      alignSelf: "flex-start",
                    }}
                  >
                    {tier.badge}
                  </span>
                  <div>
                    <div
                      style={{
                        fontWeight: "600",
                        color: "#4a352f",
                        marginBottom: "4px",
                      }}
                    >
                      {tier.name}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#7d5a50",
                      }}
                    >
                      {tier.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>,
      document.body,
    )
  }

  return (
    <>
      <div
        style={{
          background: "linear-gradient(135deg, #faf7f2 0%, #f5f0e1 100%)",
          borderRadius: "20px",
          padding: "24px",
          boxShadow: "0 20px 40px rgba(74, 53, 47, 0.1), 0 8px 16px rgba(74, 53, 47, 0.06)",
          border: "1px solid rgba(200, 182, 166, 0.3)",
          position: "relative",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          cursor: "pointer",
          maxWidth: "400px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-8px)"
          e.currentTarget.style.boxShadow = "0 32px 64px rgba(74, 53, 47, 0.15), 0 16px 32px rgba(74, 53, 47, 0.1)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)"
          e.currentTarget.style.boxShadow = "0 20px 40px rgba(74, 53, 47, 0.1), 0 8px 16px rgba(74, 53, 47, 0.06)"
        }}
      >
        {/* Background Pattern */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "120px",
            height: "120px",
            background: "radial-gradient(circle, rgba(74, 53, 47, 0.1) 0%, transparent 70%)",
            borderRadius: "50%",
            transform: "translate(40px, -40px)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "20px", position: "relative", zIndex: 2 }}>
          <div
            style={{
              width: "90px",
              height: "90px",
              borderRadius: "50%",
              background: getScoreColor(verificationScore),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: "700",
              color: getScoreTextColor(verificationScore),
              boxShadow: "0 8px 32px rgba(74, 53, 47, 0.2)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "conic-gradient(from 0deg, transparent, rgba(255,255,255,0.2), transparent)",
                borderRadius: "50%",
                animation: "spin 3s linear infinite",
              }}
            />
            {animatedScore}%
          </div>

          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <Shield size={20} color="#4a352f" />
              <h3
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#4a352f",
                }}
              >
                Advisor Verification
              </h3>
            </div>
            <p
              style={{
                margin: "0",
                fontSize: "14px",
                color: "#7d5a50",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>{tierInfo.badge}</span> {tierInfo.name}
            </p>
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: "12px",
                color: "#7d5a50",
              }}
            >
              {tierInfo.description}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            width: "100%",
            marginTop: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "12px 20px",
            background: "linear-gradient(135deg, #4a352f, #7d5a50)",
            color: "#faf7f2",
            border: "none",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 4px 16px rgba(74, 53, 47, 0.3)",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)"
            e.target.style.boxShadow = "0 8px 24px rgba(74, 53, 47, 0.4)"
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)"
            e.target.style.boxShadow = "0 4px 16px rgba(74, 53, 47, 0.3)"
          }}
        >
          View Detailed Breakdown
          <ChevronDown size={16} />
        </button>
      </div>

      <Modal />
    </>
  )
}

export default function AdvisorProfileSummary({ data, onEdit }) {
  const [expanded, setExpanded] = useState({
    personalProfessionalOverview: false,
    contactDetails: false,
    selectionCriteria: false,
    professionalCredentials: false,
    declarationConsent: false,
  })

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          const isCollapsed = document.body.classList.contains("sidebar-collapsed")
          setIsSidebarCollapsed(isCollapsed)
        }
      })
    })

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    })

    setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"))

    return () => observer.disconnect()
  }, [])

  const toggle = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))

  const formatArray = (arr) => {
    if (!arr || !arr.length) return "None specified"
    return arr.join(" • ")
  }

  const formatBoolean = (value) => (value ? "✅ Confirmed" : "❌ Pending")

  const handleEdit = () => {
    if (onEdit) onEdit()
  }

  const handleNavigate = () => {
    // Add your navigation logic here
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(32px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes slideDown {
          from { 
            opacity: 0;
            transform: translateY(-16px);
            max-height: 0;
          }
          to { 
            opacity: 1;
            transform: translateY(0);
            max-height: 1000px;
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Responsive sidebar adjustments */
        @media (max-width: 1024px) {
          .advisor-profile-container {
            padding-left: 24px !important;
          }
          .header-grid {
            grid-template-columns: 1fr !important;
            text-align: center !important;
            gap: 24px !important;
          }
        }
        
        @media (max-width: 768px) {
          .header-grid {
            gap: 16px !important;
          }
        }
        
        /* For collapsed sidebar state */
        .sidebar-collapsed .advisor-profile-container {
          padding-left: max(24px, calc(80px + 24px)) !important;
        }
      `}</style>

      <div
        className="advisor-profile-container"
        style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #faf7f2 0%, #f5f0e1 50%, #f0e6d9 100%)",
          padding: `24px 24px 24px ${isSidebarCollapsed ? "104px" : "304px"}`,
          marginTop: "60px",
          transition: "padding 0.3s ease",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
              backdropFilter: "blur(20px)",
              borderRadius: "24px",
              padding: "32px",
              marginBottom: "32px",
              boxShadow: "0 20px 40px rgba(74, 53, 47, 0.1)",
              border: "1px solid rgba(200, 182, 166, 0.3)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Background decoration */}
            <div
              style={{
                position: "absolute",
                top: "-50%",
                right: "-20%",
                width: "400px",
                height: "400px",
                background: "radial-gradient(circle, rgba(166, 124, 82, 0.1) 0%, transparent 70%)",
                borderRadius: "50%",
              }}
            />

            <div
              className="header-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: "32px",
                alignItems: "center",
                position: "relative",
                zIndex: 2,
              }}
            >
              {/* Verification Score */}
              <VerificationScoreCard profileData={data} />

              {/* Title */}
              <div style={{ textAlign: "center" }}>
                <h1
                  style={{
                    background: "linear-gradient(135deg, #4a352f, #7d5a50)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontSize: "36px",
                    fontWeight: "800",
                    margin: "0 0 8px 0",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Advisor Profile
                </h1>
                <p
                  style={{
                    color: "#7d5a50",
                    fontSize: "18px",
                    margin: 0,
                    fontWeight: "500",
                  }}
                >
                  Professional Advisory Dashboard
                </p>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexDirection: "column",
                }}
              >
                <button
                  onClick={handleEdit}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 20px",
                    background: "linear-gradient(135deg, #a67c52, #7d5a50)",
                    color: "#faf7f2",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: "0 4px 16px rgba(166, 124, 82, 0.3)",
                    minWidth: "140px",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)"
                    e.target.style.boxShadow = "0 8px 24px rgba(166, 124, 82, 0.4)"
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)"
                    e.target.style.boxShadow = "0 4px 16px rgba(166, 124, 82, 0.3)"
                  }}
                >
                  <Edit size={16} /> Edit Profile
                </button>
              </div>
            </div>
          </div>

          {/* Profile Sections */}
          <div
            style={{
              display: "grid",
              gap: "24px",
            }}
          >
            {/* Personal & Professional Overview */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
                backdropFilter: "blur(20px)",
                borderRadius: "20px",
                overflow: "hidden",
                border: "1px solid rgba(200, 182, 166, 0.3)",
                boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
                transition: "all 0.3s ease",
              }}
            >
              <div
                onClick={() => toggle("personalProfessionalOverview")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expanded.personalProfessionalOverview
                    ? "linear-gradient(135deg, #a67c52, #7d5a50)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  if (!expanded.personalProfessionalOverview) {
                    e.currentTarget.style.background = "linear-gradient(135deg, #c8b6a6, #a67c52)"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!expanded.personalProfessionalOverview) {
                    e.currentTarget.style.background = "linear-gradient(135deg, #e6d7c3, #c8b6a6)"
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <User size={24} color={expanded.personalProfessionalOverview ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "20px",
                      fontWeight: "700",
                      color: expanded.personalProfessionalOverview ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Personal & Professional Overview
                  </h2>
                </div>
                {expanded.personalProfessionalOverview ? (
                  <ChevronUp size={24} color="#faf7f2" />
                ) : (
                  <ChevronDown size={24} color="#4a352f" />
                )}
              </div>

              {expanded.personalProfessionalOverview && (
                <div
                  style={{
                    padding: "28px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: "20px",
                      marginBottom: "24px",
                    }}
                  >
                    {[
                      { label: "Full Name", value: data?.personalProfessionalOverview?.fullName, icon: User },
                      {
                        label: "Current Position",
                        value: data?.personalProfessionalOverview?.currentPosition,
                        icon: Award,
                      },
                      {
                        label: "Current Employer",
                        value: data?.personalProfessionalOverview?.currentEmployer,
                        icon: Globe,
                      },
                      {
                        label: "Professional Headline",
                        value: data?.personalProfessionalOverview?.professionalHeadline,
                        icon: Star,
                      },
                      {
                        label: "Years of Experience",
                        value: data?.personalProfessionalOverview?.yearsOfExperience,
                        icon: Clock,
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        style={{
                          background: "rgba(250, 247, 242, 0.6)",
                          borderRadius: "12px",
                          padding: "16px",
                          border: "1px solid rgba(200, 182, 166, 0.2)",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)"
                          e.currentTarget.style.boxShadow = "0 8px 24px rgba(74, 53, 47, 0.1)"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)"
                          e.currentTarget.style.boxShadow = "none"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <item.icon size={16} color="#a67c52" />
                          <span
                            style={{
                              fontSize: "13px",
                              color: "#7d5a50",
                              fontWeight: "600",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {item.label}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "16px",
                            color: "#4a352f",
                            fontWeight: "600",
                            display: "block",
                          }}
                        >
                          {item.value || "Not provided"}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      background: "rgba(166, 124, 82, 0.1)",
                      borderRadius: "16px",
                      padding: "24px",
                      border: "1px solid rgba(166, 124, 82, 0.2)",
                      marginBottom: "24px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                      <Heart size={18} color="#a67c52" />
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#7d5a50",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Brief Bio
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "16px",
                        color: "#4a352f",
                        lineHeight: "1.7",
                        margin: 0,
                        fontWeight: "400",
                      }}
                    >
                      {data?.personalProfessionalOverview?.briefBio || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "700",
                        color: "#4a352f",
                        marginBottom: "20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <TrendingUp size={20} color="#a67c52" />
                      Areas of Expertise
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                        gap: "16px",
                      }}
                    >
                      {[
                        {
                          label: "Functional Expertise",
                          value: formatArray(data?.personalProfessionalOverview?.functionalExpertise),
                        },
                        {
                          label: "Industry Experience",
                          value: formatArray(data?.personalProfessionalOverview?.industryExperience),
                        },
                        { label: "Board Experience", value: data?.personalProfessionalOverview?.boardExperience },
                        {
                          label: "Mentorship Experience",
                          value: data?.personalProfessionalOverview?.mentorshipExperience,
                        },
                        {
                          label: "Languages Spoken",
                          value: formatArray(data?.personalProfessionalOverview?.languagesSpoken),
                        },
                        {
                          label: "Region Familiarity",
                          value: formatArray(data?.personalProfessionalOverview?.regionFamiliarity),
                        },
                      ].map((item, i) => (
                        <div
                          key={i}
                          style={{
                            background: "rgba(250, 247, 242, 0.8)",
                            borderRadius: "12px",
                            padding: "16px",
                            border: "1px solid rgba(200, 182, 166, 0.2)",
                          }}
                        >
                          <span
                            style={{
                              display: "block",
                              fontSize: "13px",
                              color: "#7d5a50",
                              marginBottom: "6px",
                              fontWeight: "600",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {item.label}
                          </span>
                          <span
                            style={{
                              fontSize: "15px",
                              color: "#4a352f",
                              fontWeight: "500",
                              lineHeight: "1.4",
                            }}
                          >
                            {item.value || "Not provided"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Contact Details */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
                backdropFilter: "blur(20px)",
                borderRadius: "20px",
                overflow: "hidden",
                border: "1px solid rgba(200, 182, 166, 0.3)",
                boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
                transition: "all 0.3s ease",
              }}
            >
              <div
                onClick={() => toggle("contactDetails")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expanded.contactDetails
                    ? "linear-gradient(135deg, #7d5a50, #4a352f)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Mail size={24} color={expanded.contactDetails ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "20px",
                      fontWeight: "700",
                      color: expanded.contactDetails ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Contact Details
                  </h2>
                </div>
                {expanded.contactDetails ? (
                  <ChevronUp size={24} color="#faf7f2" />
                ) : (
                  <ChevronDown size={24} color="#4a352f" />
                )}
              </div>

              {expanded.contactDetails && (
                <div
                  style={{
                    padding: "28px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {[
                      {
                        label: "Full Name",
                        value:
                          `${data?.contactDetails?.title || ""} ${data?.contactDetails?.name || ""} ${data?.contactDetails?.surname || ""}`.trim(),
                        icon: User,
                      },
                      { label: "Position", value: data?.contactDetails?.position, icon: Award },
                      { label: "Mobile", value: data?.contactDetails?.mobile, icon: Globe },
                      { label: "Email", value: data?.contactDetails?.email, icon: Mail },
                      {
                        label: "Location",
                        value:
                          `${data?.contactDetails?.city || ""}, ${data?.contactDetails?.province || ""}, ${data?.contactDetails?.country || ""}`.replace(
                            /^,\s*|,\s*$/g,
                            "",
                          ),
                        icon: MapPin,
                      },
                      {
                        label: "Remote Available",
                        value: formatBoolean(data?.contactDetails?.remoteVirtualAvailable),
                        icon: Globe,
                      },
                      { label: "LinkedIn", value: data?.contactDetails?.linkedinProfile, icon: Globe },
                      { label: "Preferred Contact", value: data?.contactDetails?.preferredContactMethod, icon: Mail },
                    ].map((item, i) => (
                      <div
                        key={i}
                        style={{
                          background: "rgba(250, 247, 242, 0.8)",
                          borderRadius: "12px",
                          padding: "16px",
                          border: "1px solid rgba(200, 182, 166, 0.2)",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-1px)"
                          e.currentTarget.style.boxShadow = "0 4px 16px rgba(74, 53, 47, 0.08)"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)"
                          e.currentTarget.style.boxShadow = "none"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <item.icon size={16} color="#7d5a50" />
                          <span
                            style={{
                              fontSize: "13px",
                              color: "#7d5a50",
                              fontWeight: "600",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {item.label}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "15px",
                            color: "#4a352f",
                            fontWeight: "500",
                          }}
                        >
                          {item.value || "Not provided"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Selection Criteria */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
                backdropFilter: "blur(20px)",
                borderRadius: "20px",
                overflow: "hidden",
                border: "1px solid rgba(200, 182, 166, 0.3)",
                boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
              }}
            >
              <div
                onClick={() => toggle("selectionCriteria")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expanded.selectionCriteria
                    ? "linear-gradient(135deg, #c8b6a6, #a67c52)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <TrendingUp size={24} color={expanded.selectionCriteria ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "20px",
                      fontWeight: "700",
                      color: expanded.selectionCriteria ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Selection Criteria
                  </h2>
                </div>
                {expanded.selectionCriteria ? (
                  <ChevronUp size={24} color="#faf7f2" />
                ) : (
                  <ChevronDown size={24} color="#4a352f" />
                )}
              </div>

              {expanded.selectionCriteria && (
                <div
                  style={{
                    padding: "28px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {[
                      { label: "Preferred Advisor Role", value: data?.selectionCriteria?.preferredAdvisorRole },
                      {
                        label: "Advisory Support Type",
                        value: formatArray(data?.selectionCriteria?.advisorySupportType),
                      },
                      { label: "SME Stage Fit", value: formatArray(data?.selectionCriteria?.smeStageFit) },
                      { label: "Revenue Threshold", value: data?.selectionCriteria?.revenueThreshold },
                      { label: "Legal Entity Fit", value: data?.selectionCriteria?.legalEntityFit },
                      { label: "Impact Focus", value: formatArray(data?.selectionCriteria?.impactFocus) },
                      { label: "Time Commitment", value: data?.selectionCriteria?.timeCommitment },
                      { label: "Compensation Model", value: data?.selectionCriteria?.compensationModel },
                      { label: "Engagement Style", value: data?.selectionCriteria?.preferredEngagementStyle },
                    ].map((item, i) => (
                      <div
                        key={i}
                        style={{
                          background: "rgba(250, 247, 242, 0.8)",
                          borderRadius: "12px",
                          padding: "16px",
                          border: "1px solid rgba(200, 182, 166, 0.2)",
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            fontSize: "13px",
                            color: "#7d5a50",
                            marginBottom: "6px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {item.label}
                        </span>
                        <span
                          style={{
                            fontSize: "15px",
                            color: "#4a352f",
                            fontWeight: "500",
                          }}
                        >
                          {item.value || "Not provided"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Professional Credentials */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
                backdropFilter: "blur(20px)",
                borderRadius: "20px",
                overflow: "hidden",
                border: "1px solid rgba(200, 182, 166, 0.3)",
                boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
              }}
            >
              <div
                onClick={() => toggle("professionalCredentials")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expanded.professionalCredentials
                    ? "linear-gradient(135deg, #a67c52, #7d5a50)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Award size={24} color={expanded.professionalCredentials ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "20px",
                      fontWeight: "700",
                      color: expanded.professionalCredentials ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Professional Credentials
                  </h2>
                </div>
                {expanded.professionalCredentials ? (
                  <ChevronUp size={24} color="#faf7f2" />
                ) : (
                  <ChevronDown size={24} color="#4a352f" />
                )}
              </div>

              {expanded.professionalCredentials && (
                <div
                  style={{
                    padding: "28px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: "16px",
                      marginBottom: "24px",
                    }}
                  >
                    <div
                      style={{
                        background: "rgba(250, 247, 242, 0.8)",
                        borderRadius: "12px",
                        padding: "16px",
                        border: "1px solid rgba(200, 182, 166, 0.2)",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          fontSize: "13px",
                          color: "#7d5a50",
                          marginBottom: "6px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Qualifications
                      </span>
                      <span
                        style={{
                          fontSize: "15px",
                          color: "#4a352f",
                          fontWeight: "500",
                        }}
                      >
                        {formatArray(data?.professionalCredentials?.qualifications)}
                      </span>
                    </div>
                    <div
                      style={{
                        background: "rgba(250, 247, 242, 0.8)",
                        borderRadius: "12px",
                        padding: "16px",
                        border: "1px solid rgba(200, 182, 166, 0.2)",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          fontSize: "13px",
                          color: "#7d5a50",
                          marginBottom: "6px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Current Board Seats
                      </span>
                      <span
                        style={{
                          fontSize: "15px",
                          color: "#4a352f",
                          fontWeight: "500",
                        }}
                      >
                        {data?.professionalCredentials?.currentBoardSeats || "Not provided"}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      background: "rgba(166, 124, 82, 0.1)",
                      borderRadius: "16px",
                      padding: "20px",
                      border: "1px solid rgba(166, 124, 82, 0.2)",
                      marginBottom: "16px",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: "13px",
                        color: "#7d5a50",
                        marginBottom: "12px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Past Board/Advisory Roles
                    </span>
                    <p
                      style={{
                        fontSize: "16px",
                        color: "#4a352f",
                        lineHeight: "1.6",
                        margin: 0,
                        fontWeight: "400",
                      }}
                    >
                      {data?.professionalCredentials?.pastBoardRoles || "Not provided"}
                    </p>
                  </div>

                  <div
                    style={{
                      background: "rgba(166, 124, 82, 0.1)",
                      borderRadius: "16px",
                      padding: "20px",
                      border: "1px solid rgba(166, 124, 82, 0.2)",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: "13px",
                        color: "#7d5a50",
                        marginBottom: "12px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Key Achievements
                    </span>
                    <p
                      style={{
                        fontSize: "16px",
                        color: "#4a352f",
                        lineHeight: "1.6",
                        margin: 0,
                        fontWeight: "400",
                      }}
                    >
                      {data?.professionalCredentials?.keyAchievements || "Not provided"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Declaration & Consent */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
                backdropFilter: "blur(20px)",
                borderRadius: "20px",
                overflow: "hidden",
                border: "1px solid rgba(200, 182, 166, 0.3)",
                boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
              }}
            >
              <div
                onClick={() => toggle("declarationConsent")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expanded.declarationConsent
                    ? "linear-gradient(135deg, #7d5a50, #4a352f)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Shield size={24} color={expanded.declarationConsent ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "20px",
                      fontWeight: "700",
                      color: expanded.declarationConsent ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Declaration & Consent
                  </h2>
                </div>
                {expanded.declarationConsent ? (
                  <ChevronUp size={24} color="#faf7f2" />
                ) : (
                  <ChevronDown size={24} color="#4a352f" />
                )}
              </div>

              {expanded.declarationConsent && (
                <div
                  style={{
                    padding: "28px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {[
                      { label: "Code of Conduct", value: formatBoolean(data?.declarationConsent?.codeOfConduct) },
                      {
                        label: "Data Sharing Consent",
                        value: formatBoolean(data?.declarationConsent?.dataSharingConsent),
                      },
                      {
                        label: "Availability Confirmation",
                        value: formatBoolean(data?.declarationConsent?.availabilityConfirmation),
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        style={{
                          background: "rgba(250, 247, 242, 0.8)",
                          borderRadius: "12px",
                          padding: "16px",
                          border: "1px solid rgba(200, 182, 166, 0.2)",
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            fontSize: "13px",
                            color: "#7d5a50",
                            marginBottom: "6px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {item.label}
                        </span>
                        <span
                          style={{
                            fontSize: "15px",
                            color: "#4a352f",
                            fontWeight: "500",
                          }}
                        >
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: "40px",
              textAlign: "center",
              background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
              backdropFilter: "blur(20px)",
              borderRadius: "20px",
              padding: "32px",
              border: "1px solid rgba(200, 182, 166, 0.3)",
              boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
            }}
          >
            <button
              onClick={handleNavigate}
              style={{
                padding: "16px 32px",
                background: "linear-gradient(135deg, #a67c52, #7d5a50)",
                color: "#faf7f2",
                border: "none",
                borderRadius: "16px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 8px 24px rgba(166, 124, 82, 0.3)",
                minWidth: "200px",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-4px)"
                e.target.style.boxShadow = "0 16px 40px rgba(166, 124, 82, 0.4)"
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)"
                e.target.style.boxShadow = "0 8px 24px rgba(166, 124, 82, 0.3)"
              }}
            >
              🚀 Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export { VerificationScoreCard }
