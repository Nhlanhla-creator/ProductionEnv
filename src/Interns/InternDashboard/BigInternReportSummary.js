"use client"
import { useState, useEffect } from "react"
import { FileText, Target, X, TrendingUp, Award, AlertCircle } from "lucide-react"

export function BigInternReportSummary({
  profileData,
  academicScore,
  professionalSkillsScore,
  workExperienceScore,
  professionalPresentationScore,
  bigInternScore,
}) {
  const [showModal, setShowModal] = useState(false)
  const [analysisData, setAnalysisData] = useState(null)

  useEffect(() => {
    // Use placeholder data instead of waiting for scores
    generateAnalysis()
  }, [])

  const generateAnalysis = () => {
    // Enhanced placeholder data with more realistic priorities
    const placeholderPriorities = [
      {
        title: "Communication Skills",
        description: "",
      },
      {
        title: "Technical Proficiency",
        description: "",
      },
      {
        title: "Project Management",
        description: "",
      },
     
    ]

    const placeholderRecommendations = [
      "Enroll in advanced communication workshops to improve presentation and interpersonal skills",
      "Complete relevant technical certifications in your field of study within the next 6 months",
      "Seek opportunities to lead small projects or volunteer initiatives to gain management experience",
      "Join professional networking groups and attend industry events to build connections",
      "Practice problem-solving through case studies and real-world scenario simulations",
      "Develop a portfolio showcasing your best work and achievements to date",
    ]

    const placeholderStrengths = [
      { name: "Academic Foundation", score: 87 },
      { name: "Professional Attitude", score: 82 },
      { name: "Adaptability", score: 78 },
    ]

    setAnalysisData({
      readinessLevel: "Good",
      strengths: placeholderStrengths,
      priorities: placeholderPriorities,
      recommendations: placeholderRecommendations,
      scores: {
        overall: 79,
        academic: 87,
        professional: 74,
        experience: 68,
        presentation: 82,
      },
    })
  }

  const getCurrentDate = () => {
    const options = { day: "2-digit", month: "2-digit", year: "numeric" }
    return new Date().toLocaleDateString("en-GB", options)
  }

  if (!analysisData) {
    return (
      <div
        style={{
          background: `linear-gradient(145deg, #4a352f 0%, #7d5a50 100%)`,
          borderRadius: "20px",
          padding: "30px",
          color: "#f5f0e1",
          boxShadow: "0 12px 40px rgba(74, 53, 47, 0.4)",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1px solid #7d5a50`,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              background: "rgba(245, 240, 225, 0.1)",
              borderRadius: "50%",
              padding: "20px",
              display: "inline-flex",
              marginBottom: "20px",
            }}
          >
            <FileText size={48} style={{ opacity: "0.8" }} />
          </div>
          <h3 style={{ margin: "0 0 10px 0", fontSize: "20px", fontWeight: "600" }}>Generating Analysis...</h3>
          <p style={{ margin: "0", opacity: "0.8", fontSize: "14px" }}>
            Compiling your comprehensive assessment report
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        style={{
          background: `linear-gradient(145deg, #4a352f 0%, #7d5a50 100%)`,
          borderRadius: "20px",
          padding: "20px",
          color: "#f5f0e1",
          boxShadow: "0 12px 40px rgba(74, 53, 47, 0.4)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          border: `1px solid #7d5a50`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            marginBottom: "24px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              background: `rgba(166, 124, 82, 0.3)`,
              borderRadius: "16px",
              padding: "14px",
              marginRight: "16px",
              flexShrink: 0,
              border: `1px solid rgba(245, 240, 225, 0.2)`,
            }}
          >
            <FileText size={28} style={{ color: "#f5f0e1" }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                margin: "0 0 8px 0",
                fontSize: "20px",
                fontWeight: "700",
                letterSpacing: "0.5px",
                color: "#f5f0e1",
              }}
            >
              BIG Score Summary Analysis
            </h3>
            <p
              style={{
                margin: "0",
                fontSize: "14px",
                opacity: "0.8",
                color: "#e6d7c3",
              }}
            >
              {getCurrentDate()}
            </p>
          </div>
        </div>

        {/* Top 3 Priorities */}
        <div style={{ marginBottom: "24px", flex: 1, position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                background: "rgba(245, 240, 225, 0.15)",
                borderRadius: "8px",
                padding: "6px",
                marginRight: "10px",
              }}
            >
              <Target size={18} style={{ color: "#f5f0e1" }} />
            </div>
            <h4
              style={{
                margin: "0",
                fontSize: "16px",
                fontWeight: "600",
                letterSpacing: "0.8px",
              }}
            >
              TOP PRIORITIES
            </h4>
          </div>
          {/* Horizontal Priority Cards - Adjusted to 2x2 grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr", // Changed to 2 columns
              gap: "12px",
              marginBottom: "-20px",
            }}
          >
            {analysisData.priorities.map((priority, index) => (
              <div
                key={index}
                style={{
                  background: `rgba(125, 90, 80, 0.3)`,
                  borderRadius: "14px",
                  padding: "16px",
                  border: `1px solid rgba(245, 240, 225, 0.1)`,
                  transition: "transform 0.2s ease",
                  minHeight: "50px",
                  display: "flex",
                  flexDirection: "column",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)"
                  e.currentTarget.style.background = "rgba(125, 90, 80, 0.4)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.background = "rgba(125, 90, 80, 0.3)"
                }}
              >
                <h5
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "15px",
                    fontWeight: "600",
                  }}
                >
                  {priority.title}
                </h5>
                <p
                  style={{
                    margin: "0",
                    fontSize: "12px",
                    opacity: "0.9",
                    lineHeight: "1.4",
                    flex: 1,
                  }}
                >
                  {priority.description}
                </p>
                <div style={{ marginTop: "8px" }}></div>
              </div>
            ))}
          </div>
        </div>

        {/* View Full Summary Button */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <button
            onClick={() => setShowModal(true)}
            style={{
              width: "100%",
              background: `rgba(166, 124, 82, 0.4)`,
              border: `2px solid rgba(245, 240, 225, 0.2)`,
              borderRadius: "14px",
              padding: "16px 24px",
              color: "#f5f0e1",
              fontSize: "15px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease",
              letterSpacing: "0.8px",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = `rgba(166, 124, 82, 0.5)`
              e.target.style.transform = "translateY(-2px)"
            }}
            onMouseLeave={(e) => {
              e.target.style.background = `rgba(166, 124, 82, 0.4)`
              e.target.style.transform = "translateY(0)"
            }}
          >
            <FileText size={18} style={{ marginRight: "10px" }} />
            VIEW FULL SUMMARY
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(74, 53, 47, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "#faf7f2",
              borderRadius: "24px",
              padding: "32px",
              color: "#4a352f",
              maxWidth: "800px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(74, 53, 47, 0.5)",
              border: `2px solid #c8b6a6`,
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "#f5f0e1",
                border: `1px solid #c8b6a6`,
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#4a352f",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#e6d7c3"
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#f5f0e1"
              }}
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div style={{ marginBottom: "32px", paddingRight: "60px" }}>
              <h2
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "#4a352f",
                }}
              >
                Comprehensive Analysis Report
              </h2>
              <p
                style={{
                  margin: "0",
                  fontSize: "16px",
                  opacity: "0.8",
                  lineHeight: "1.5",
                  color: "#7d5a50",
                }}
              >
                Detailed breakdown of your BIG Intern Score assessment
              </p>
            </div>

            {/* Overall Score Section */}
            <div
              style={{
                background: `linear-gradient(135deg, #f5f0e1 0%, #f0e6d9 100%)`,
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "24px",
                border: `1px solid #c8b6a6`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
                <Award size={24} style={{ marginRight: "12px", color: "#a67c52" }} />
                <h3 style={{ margin: "0", fontSize: "20px", fontWeight: "600", color: "#4a352f" }}>
                  Overall Assessment
                </h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <p style={{ margin: "0 0 8px 0", fontSize: "14px", opacity: "0.8", color: "#7d5a50" }}>
                    Readiness Level
                  </p>
                  <p style={{ margin: "0", fontSize: "18px", fontWeight: "600", color: "#4a352f" }}>
                    {analysisData.readinessLevel}
                  </p>
                </div>
                <div>
                  <p style={{ margin: "0 0 8px 0", fontSize: "14px", opacity: "0.8", color: "#7d5a50" }}>
                    Overall Score
                  </p>
                  <p style={{ margin: "0", fontSize: "18px", fontWeight: "600", color: "#4a352f" }}>
                    {analysisData.scores.overall}%
                  </p>
                </div>
              </div>
            </div>

            {/* Strengths Section */}
            <div
              style={{
                background: `linear-gradient(135deg, #f5f0e1 0%, #e6d7c3 100%)`,
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "24px",
                border: `1px solid #c8b6a6`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
                <TrendingUp size={24} style={{ marginRight: "12px", color: "#a67c52" }} />
                <h3 style={{ margin: "0", fontSize: "20px", fontWeight: "600", color: "#4a352f" }}>Key Strengths</h3>
              </div>
              {analysisData.strengths.map((strength, index) => (
                <div key={index} style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "16px", fontWeight: "500", color: "#4a352f" }}>{strength.name}</span>
                    <span style={{ fontSize: "16px", fontWeight: "600", color: "#a67c52" }}>{strength.score}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendations Section - Using light brown */}
            <div
              style={{
                background: `linear-gradient(135deg, #f5f0e1 0%, #f0e6d9 100%)`,
                borderRadius: "16px",
                padding: "24px",
                border: `1px solid #e6d7c3`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
                <AlertCircle size={24} style={{ marginRight: "12px", color: "#a67c52" }} />
                <h3 style={{ margin: "0", fontSize: "20px", fontWeight: "600", color: "#4a352f" }}>Recommendations</h3>
              </div>
              {analysisData.recommendations.map((rec, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    marginBottom: "12px",
                    fontSize: "15px",
                    lineHeight: "1.5",
                    color: "#4a352f",
                  }}
                >
                  <span style={{ marginRight: "8px", color: "#a67c52" }}>•</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
