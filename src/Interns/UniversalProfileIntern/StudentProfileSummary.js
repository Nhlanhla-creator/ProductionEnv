"use client"
import { useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  Edit,
  User,
  GraduationCap,
  Briefcase,
  Users,
  Award,
  FileText,
  Shield,
} from "lucide-react"

const StudentProfileSummary = ({ formData, onEdit }) => {
  const [expandedSections, setExpandedSections] = useState({
    personalOverview: false,
    academicOverview: false,
    experienceTrackRecord: false,
    programAffiliation: false,
    skillsInterests: false,
    professionalPresentation: false,
    requiredDocuments: false,
    declarationConsent: false,
  })

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const formatArray = (arr) => {
    if (!arr || !arr.length) return "None specified"
    if (Array.isArray(arr)) {
      return arr.filter((item) => item && item.trim()).join(" • ")
    }
    return arr
  }

  const handleEdit = () => {
    if (onEdit) onEdit()
  }

  const getSummaryData = () => {
    return {
      // Personal Overview
      fullName: formData?.personalOverview?.fullName,
      email: formData?.personalOverview?.email,
      phone: formData?.personalOverview?.phone,
      location: formData?.personalOverview?.location,
      dateOfBirth: formData?.personalOverview?.dateOfBirth,
      nationalIdOrStudentNo: formData?.personalOverview?.nationalIdOrStudentNo,

      // Academic Overview
      institution: formData?.academicOverview?.institution,
      degree: formData?.academicOverview?.degree,
      fieldOfStudy: formData?.academicOverview?.fieldOfStudy,
      yearOfStudy: formData?.academicOverview?.yearOfStudy,
      graduationYear: formData?.academicOverview?.graduationYear,
      qualificationLevel: formData?.academicOverview?.qualificationLevel,
      academicPerformance: formData?.academicOverview?.academicPerformance,
      academicHonors: formData?.academicOverview?.academicHonors,
      certifications: formData?.academicOverview?.certifications,

      // Experience Overview
      internshipExperience: formData?.experienceTrackRecord?.internshipExperience,
      referenceContact: formData?.experienceTrackRecord?.referenceContact,
      linkedInProfile: formData?.experienceTrackRecord?.linkedInProfile,
      workExperience: formData?.experienceTrackRecord?.workExperience,
      academicProjects: formData?.experienceTrackRecord?.academicProjects,
      volunteerWork: formData?.experienceTrackRecord?.volunteerWork,
      leadershipExperience: formData?.experienceTrackRecord?.leadershipExperience,

      // Professional Presentation
      coverLetter: formData?.professionalPresentation?.coverLetter,
      caseStudyResponse: formData?.professionalPresentation?.caseStudyResponse,

      // Program Affiliation
      sponsorName: formData?.programAffiliation?.sponsorName,
      programType: formData?.programAffiliation?.programType,
      referenceCode: formData?.programAffiliation?.referenceCode,
      fundingStatus: formData?.programAffiliation?.fundingStatus,
      stipendAmount: formData?.programAffiliation?.stipendAmount,
      sponsorContactName: formData?.programAffiliation?.sponsorContactName,
      sponsorContactEmail: formData?.programAffiliation?.sponsorContactEmail,
      requiresLogbook: formData?.programAffiliation?.requiresLogbook,
      duration: formData?.programAffiliation?.duration,
      locationLimit: formData?.programAffiliation?.locationLimit,

      // Skills & Interests
      technicalSkills: formData?.skillsInterests?.technicalSkills,
      softSkills: formData?.skillsInterests?.softSkills,
      languagesSpoken: formData?.skillsInterests?.languagesSpoken,
      passionAreas: formData?.skillsInterests?.passionAreas,
      availabilityStart: formData?.skillsInterests?.availabilityStart,
      availableHours: formData?.skillsInterests?.availableHours,
      internTypePreference: formData?.skillsInterests?.internTypePreference,

      // Required Documents
      profilePhoto: formData?.requiredDocuments?.profilePhoto,
      transcriptFile: formData?.requiredDocuments?.transcriptFile,
      cvFile: formData?.requiredDocuments?.cvFile,
      portfolioFile: formData?.requiredDocuments?.portfolioFile,
      idDocument: formData?.requiredDocuments?.idDocument,
      proofOfStudy: formData?.requiredDocuments?.proofOfStudy,
      motivationLetter: formData?.requiredDocuments?.motivationLetter,
      references: formData?.requiredDocuments?.references,

      // Declaration & Consent
      dataProcessingConsent: formData?.declarationConsent?.dataProcessingConsent,
      backgroundCheckConsent: formData?.declarationConsent?.backgroundCheckConsent,
      communicationConsent: formData?.declarationConsent?.communicationConsent,
      termsAndConditions: formData?.declarationConsent?.termsAndConditions,
      privacyPolicy: formData?.declarationConsent?.privacyPolicy,
      accuracyDeclaration: formData?.declarationConsent?.accuracyDeclaration,
      eligibilityConfirmation: formData?.declarationConsent?.eligibilityConfirmation,
      commitmentAgreement: formData?.declarationConsent?.commitmentAgreement,
    }
  }

  const summaryData = getSummaryData()

  const handleNavigate = () => {
    // Navigation logic here
  }

  return (
    <>
      <style jsx global>{`
        html {
          -webkit-text-size-adjust: 100%;
          text-size-adjust: 100%;
          width: 100%;
          overflow-x: hidden;
        }
        body {
          touch-action: manipulation;
          min-width: 100vw;
          overflow-x: hidden;
          margin: 0;
          padding: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Responsive adjustments */
        @media (max-width: 1200px) {
          .application-summary-container {
            padding-left: 24px !important;
            padding-right: 24px !important;
          }
        }
        
        @media (max-width: 1024px) {
          .application-summary-container {
            margin-left: 0 !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
          
          .header-grid {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 24px !important;
          }
        }
        
        @media (max-width: 768px) {
          .application-summary-container {
            padding: 16px !important;
            margin-left: 0 !important;
          }
          
          .header-grid {
            gap: 16px !important;
          }
        }
           /* ADD THIS NEW RULE */
  body.sidebar-collapsed .main-container {
    padding-left: var(--sidebar-collapsed-width) !important;
  }
        
        @media (max-width: 480px) {
          .application-summary-container {
            padding: 12px !important;
            margin-left: 0 !important;
          }
        }
      `}</style>

      <div
        className="application-summary-container"
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #faf7f2 0%, #f5f0e1 50%, #f0e6d9 100%)",
          padding: "24px",
          paddingLeft: "280px",
          marginTop: "60px",
          width: "100%",
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1200px",
            margin: "0 auto",
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
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "relative",
                zIndex: 2,
              }}
            >
              <div>
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
                  Student Profile Summary
                </h1>
                <p
                  style={{
                    color: "#7d5a50",
                    fontSize: "18px",
                    margin: 0,
                    fontWeight: "500",
                  }}
                >
                  Complete Student Application Profile
                </p>
              </div>
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

          {/* Profile Sections */}
          <div
            style={{
              display: "grid",
              gap: "24px",
            }}
          >
            {/* Personal Overview */}
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
                onClick={() => toggleSection("personalOverview")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.personalOverview
                    ? "linear-gradient(135deg, #a67c52, #7d5a50)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <User size={24} color={expandedSections.personalOverview ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "20px",
                      fontWeight: "700",
                      color: expandedSections.personalOverview ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Personal Overview
                  </h2>
                </div>
                {expandedSections.personalOverview ? (
                  <ChevronUp size={24} color="#faf7f2" />
                ) : (
                  <ChevronDown size={24} color="#4a352f" />
                )}
              </div>
              {expandedSections.personalOverview && (
                <div
                  style={{
                    padding: "28px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    {[
                      { label: "Full Name", value: summaryData?.fullName },
                      { label: "Email", value: summaryData?.email },
                      { label: "Phone Number", value: summaryData?.phone },
                      { label: "Location", value: summaryData?.location },
                      { label: "Date of Birth", value: summaryData?.dateOfBirth },
                      { label: "National ID/Student No", value: summaryData?.nationalIdOrStudentNo },
                    ].map((item, i) => (
                      <div
                        key={i}
                        style={{
                          background: "rgba(250, 247, 242, 0.8)",
                          borderRadius: "12px",
                          padding: "20px",
                          border: "1px solid rgba(200, 182, 166, 0.2)",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            fontSize: "13px",
                            color: "#7d5a50",
                            marginBottom: "8px",
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
              )}
            </div>

            {/* Academic Overview */}
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
                onClick={() => toggleSection("academicOverview")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.academicOverview
                    ? "linear-gradient(135deg, #7d5a50, #4a352f)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <GraduationCap size={24} color={expandedSections.academicOverview ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "20px",
                      fontWeight: "700",
                      color: expandedSections.academicOverview ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Academic Background
                  </h2>
                </div>
                {expandedSections.academicOverview ? (
                  <ChevronUp size={24} color="#faf7f2" />
                ) : (
                  <ChevronDown size={24} color="#4a352f" />
                )}
              </div>
              {expandedSections.academicOverview && (
                <div
                  style={{
                    padding: "28px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    {[
                      { label: "Institution", value: summaryData?.institution },
                      { label: "Degree/Qualification", value: summaryData?.degree },
                      { label: "Field of Study", value: summaryData?.fieldOfStudy },
                      { label: "Year of Study", value: summaryData?.yearOfStudy },
                      { label: "Graduation Year", value: summaryData?.graduationYear },
                      { label: "Qualification Level", value: summaryData?.qualificationLevel },
                      { label: "Academic Performance", value: summaryData?.academicPerformance },
                      { label: "Academic Honors", value: summaryData?.academicHonors },
                      { label: "Professional Certifications", value: formatArray(summaryData?.certifications) },
                    ].map((item, i) => (
                      <div
                        key={i}
                        style={{
                          background: "rgba(250, 247, 242, 0.8)",
                          borderRadius: "12px",
                          padding: "20px",
                          border: "1px solid rgba(200, 182, 166, 0.2)",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            fontSize: "13px",
                            color: "#7d5a50",
                            marginBottom: "8px",
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
                          {item.value || "Not specified"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Experience Overview */}
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
                onClick={() => toggleSection("experienceTrackRecord")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.experienceTrackRecord
                    ? "linear-gradient(135deg, #c8b6a6, #a67c52)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Briefcase size={24} color={expandedSections.experienceTrackRecord ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "20px",
                      fontWeight: "700",
                      color: expandedSections.experienceTrackRecord ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Experience Overview
                  </h2>
                </div>
                {expandedSections.experienceTrackRecord ? (
                  <ChevronUp size={24} color="#faf7f2" />
                ) : (
                  <ChevronDown size={24} color="#4a352f" />
                )}
              </div>
              {expandedSections.experienceTrackRecord && (
                <div
                  style={{
                    padding: "28px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    {[
                      { label: "Internship Experience", value: summaryData?.internshipExperience },
                      { label: "Reference Contact", value: summaryData?.referenceContact },
                      { label: "LinkedIn Profile", value: summaryData?.linkedInProfile },
                      { label: "Work Experience", value: summaryData?.workExperience },
                      { label: "Academic Projects", value: formatArray(summaryData?.academicProjects) },
                      { label: "Volunteer Work", value: formatArray(summaryData?.volunteerWork) },
                      { label: "Leadership Experience", value: formatArray(summaryData?.leadershipExperience) },
                    ].map((item, i) => (
                      <div
                        key={i}
                        style={{
                          background: "rgba(250, 247, 242, 0.8)",
                          borderRadius: "12px",
                          padding: "20px",
                          border: "1px solid rgba(200, 182, 166, 0.2)",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            fontSize: "13px",
                            color: "#7d5a50",
                            marginBottom: "8px",
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
                          {item.value || "Not specified"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Program Affiliation */}
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
                onClick={() => toggleSection("programAffiliation")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.programAffiliation
                    ? "linear-gradient(135deg, #a67c52, #7d5a50)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Users size={24} color={expandedSections.programAffiliation ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "20px",
                      fontWeight: "700",
                      color: expandedSections.programAffiliation ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Program Affiliation
                  </h2>
                </div>
                {expandedSections.programAffiliation ? (
                  <ChevronUp size={24} color="#faf7f2" />
                ) : (
                  <ChevronDown size={24} color="#4a352f" />
                )}
              </div>
              {expandedSections.programAffiliation && (
                <div
                  style={{
                    padding: "28px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    {[
                      { label: "Sponsor Name", value: summaryData?.sponsorName },
                      { label: "Program Type", value: summaryData?.programType },
                      { label: "Reference Code", value: summaryData?.referenceCode },
                      { label: "Funding Status", value: summaryData?.fundingStatus },
                      {
                        label: "Stipend Amount",
                        value: summaryData?.stipendAmount ? `ZAR ${summaryData.stipendAmount}` : "N/A",
                      },
                      { label: "Duration", value: summaryData?.duration },
                      { label: "Sponsor Contact Name", value: summaryData?.sponsorContactName },
                      { label: "Sponsor Contact Email", value: summaryData?.sponsorContactEmail },
                      { label: "Requires Logbook", value: summaryData?.requiresLogbook },
                      { label: "Location Limit", value: summaryData?.locationLimit },
                    ].map((item, i) => (
                      <div
                        key={i}
                        style={{
                          background: "rgba(250, 247, 242, 0.8)",
                          borderRadius: "12px",
                          padding: "20px",
                          border: "1px solid rgba(200, 182, 166, 0.2)",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            fontSize: "13px",
                            color: "#7d5a50",
                            marginBottom: "8px",
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
                          {item.value || "Not specified"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Skills & Interests */}
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
                onClick={() => toggleSection("skillsInterests")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.skillsInterests
                    ? "linear-gradient(135deg, #7d5a50, #4a352f)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Award size={24} color={expandedSections.skillsInterests ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "20px",
                      fontWeight: "700",
                      color: expandedSections.skillsInterests ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Skills & Interests
                  </h2>
                </div>
                {expandedSections.skillsInterests ? (
                  <ChevronUp size={24} color="#faf7f2" />
                ) : (
                  <ChevronDown size={24} color="#4a352f" />
                )}
              </div>
              {expandedSections.skillsInterests && (
                <div
                  style={{
                    padding: "28px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    {[
                      { label: "Technical Skills", value: formatArray(summaryData?.technicalSkills) },
                      { label: "Soft Skills", value: formatArray(summaryData?.softSkills) },
                      { label: "Languages Spoken", value: formatArray(summaryData?.languagesSpoken) },
                      { label: "Passion Areas", value: formatArray(summaryData?.passionAreas) },
                      { label: "Availability Start", value: summaryData?.availabilityStart },
                      { label: "Available Hours/Week", value: summaryData?.availableHours },
                      { label: "Intern Type Preference", value: summaryData?.internTypePreference },
                    ].map((item, i) => (
                      <div
                        key={i}
                        style={{
                          background: "rgba(250, 247, 242, 0.8)",
                          borderRadius: "12px",
                          padding: "20px",
                          border: "1px solid rgba(200, 182, 166, 0.2)",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            fontSize: "13px",
                            color: "#7d5a50",
                            marginBottom: "8px",
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
                          {item.value || "Not specified"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Professional Presentation */}
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
                onClick={() => toggleSection("professionalPresentation")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.professionalPresentation
                    ? "linear-gradient(135deg, #a67c52, #7d5a50)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <FileText size={24} color={expandedSections.professionalPresentation ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "20px",
                      fontWeight: "700",
                      color: expandedSections.professionalPresentation ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Professional Presentation
                  </h2>
                </div>
                {expandedSections.professionalPresentation ? (
                  <ChevronUp size={24} color="#faf7f2" />
                ) : (
                  <ChevronDown size={24} color="#4a352f" />
                )}
              </div>
              {expandedSections.professionalPresentation && (
                <div
                  style={{
                    padding: "28px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  <div style={{ display: "grid", gap: "20px" }}>
                    <div
                      style={{
                        background: "rgba(250, 247, 242, 0.8)",
                        borderRadius: "12px",
                        padding: "20px",
                        border: "1px solid rgba(200, 182, 166, 0.2)",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          fontSize: "13px",
                          color: "#7d5a50",
                          marginBottom: "8px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Cover Letter
                      </span>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#4a352f",
                          fontWeight: "400",
                          lineHeight: "1.6",
                          maxHeight: "200px",
                          overflow: "auto",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {summaryData?.coverLetter || "Not provided"}
                      </div>
                    </div>

                    <div
                      style={{
                        background: "rgba(250, 247, 242, 0.8)",
                        borderRadius: "12px",
                        padding: "20px",
                        border: "1px solid rgba(200, 182, 166, 0.2)",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          fontSize: "13px",
                          color: "#7d5a50",
                          marginBottom: "8px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Case Study Response
                      </span>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#4a352f",
                          fontWeight: "400",
                          lineHeight: "1.6",
                          maxHeight: "300px",
                          overflow: "auto",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {summaryData?.caseStudyResponse || "Not provided"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Required Documents */}
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
                onClick={() => toggleSection("requiredDocuments")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.requiredDocuments
                    ? "linear-gradient(135deg, #c8b6a6, #a67c52)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <FileText size={24} color={expandedSections.requiredDocuments ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "20px",
                      fontWeight: "700",
                      color: expandedSections.requiredDocuments ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Required Documents
                  </h2>
                </div>
                {expandedSections.requiredDocuments ? (
                  <ChevronUp size={24} color="#faf7f2" />
                ) : (
                  <ChevronDown size={24} color="#4a352f" />
                )}
              </div>
              {expandedSections.requiredDocuments && (
                <div
                  style={{
                    padding: "28px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    {[
                      {
                        label: "Profile Photo",
                        value: summaryData?.profilePhoto ? "Uploaded" : "Not uploaded",
                        status: summaryData?.profilePhoto ? "complete" : "pending",
                      },
                      {
                        label: "Academic Transcript",
                        value: summaryData?.transcriptFile ? "Uploaded" : "Not uploaded",
                        status: summaryData?.transcriptFile ? "complete" : "pending",
                      },
                      {
                        label: "CV/Resume",
                        value: summaryData?.cvFile ? "Uploaded" : "Not uploaded",
                        status: summaryData?.cvFile ? "complete" : "pending",
                      },
                      {
                        label: "Portfolio or Sample Work",
                        value: summaryData?.portfolioFile ? "Uploaded" : "Not uploaded",
                        status: summaryData?.portfolioFile ? "complete" : "pending",
                      },
                      {
                        label: "ID Document",
                        value: summaryData?.idDocument ? "Uploaded" : "Not uploaded",
                        status: summaryData?.idDocument ? "complete" : "pending",
                      },
                      {
                        label: "Proof of Study",
                        value: summaryData?.proofOfStudy ? "Uploaded" : "Not uploaded",
                        status: summaryData?.proofOfStudy ? "complete" : "pending",
                      },
                      {
                        label: "Motivation Letter",
                        value: summaryData?.motivationLetter ? "Uploaded" : "Not uploaded",
                        status: summaryData?.motivationLetter ? "complete" : "pending",
                      },
                      {
                        label: "Reference Letters",
                        value: summaryData?.references ? "Uploaded" : "Not uploaded",
                        status: summaryData?.references ? "complete" : "pending",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        style={{
                          background: "rgba(250, 247, 242, 0.8)",
                          borderRadius: "12px",
                          padding: "20px",
                          border: "1px solid rgba(200, 182, 166, 0.2)",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <div
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "4px",
                              background:
                                item.status === "complete" ? "linear-gradient(135deg, #a67c52, #7d5a50)" : "#e5e5e5",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            {item.status === "complete" ? "✓" : ""}
                          </div>
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
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: "600",
                            color: item.status === "complete" ? "#22c55e" : "#ef4444",
                          }}
                        >
                          {item.value}
                        </div>
                      </div>
                    ))}
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
                transition: "all 0.3s ease",
              }}
            >
              <div
                onClick={() => toggleSection("declarationConsent")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.declarationConsent
                    ? "linear-gradient(135deg, #a67c52, #7d5a50)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Shield size={24} color={expandedSections.declarationConsent ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "20px",
                      fontWeight: "700",
                      color: expandedSections.declarationConsent ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Declaration & Consent
                  </h2>
                </div>
                {expandedSections.declarationConsent ? (
                  <ChevronUp size={24} color="#faf7f2" />
                ) : (
                  <ChevronDown size={24} color="#4a352f" />
                )}
              </div>
              {expandedSections.declarationConsent && (
                <div
                  style={{
                    padding: "28px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    {[
                      {
                        label: "Data Processing Consent",
                        value: summaryData?.dataProcessingConsent,
                        description: "Consent to process personal data for internship applications",
                      },
                      {
                        label: "Terms & Conditions",
                        value: summaryData?.termsAndConditions,
                        description: "Agreement to platform terms of use",
                      },
                      {
                        label: "Privacy Policy",
                        value: summaryData?.privacyPolicy,
                        description: "Acknowledgment of privacy policy",
                      },
                      {
                        label: "Accuracy Declaration",
                        value: summaryData?.accuracyDeclaration,
                        description: "Declaration that all information is accurate",
                      },
                      {
                        label: "Eligibility Confirmation",
                        value: summaryData?.eligibilityConfirmation,
                        description: "Confirmation of eligibility for internship programs",
                      },
                      {
                        label: "Commitment Agreement",
                        value: summaryData?.commitmentAgreement,
                        description: "Commitment to fulfill internship responsibilities",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        style={{
                          background: "rgba(250, 247, 242, 0.8)",
                          borderRadius: "12px",
                          padding: "20px",
                          border: "1px solid rgba(200, 182, 166, 0.2)",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <div
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "4px",
                              background: item.value ? "linear-gradient(135deg, #a67c52, #7d5a50)" : "#e5e5e5",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            {item.value ? "✓" : ""}
                          </div>
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
                            fontSize: "14px",
                            color: "#4a352f",
                            fontWeight: "400",
                            lineHeight: "1.4",
                            display: "block",
                          }}
                        >
                          {item.description}
                        </span>
                        <div
                          style={{
                            marginTop: "8px",
                            fontSize: "13px",
                            fontWeight: "600",
                            color: item.value ? "#22c55e" : "#ef4444",
                          }}
                        >
                          {item.value ? "Agreed" : "Not Agreed"}
                        </div>
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

export default StudentProfileSummary