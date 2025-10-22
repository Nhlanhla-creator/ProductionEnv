"use client"
import { useState, useEffect } from "react"
import { Eye, X, Trophy, Calendar, FileText, Users, MapPin, GraduationCap, Briefcase } from "lucide-react"
import InternApplication from "../../smses/InternApplication/internapplication"
import { InternTablePage } from "./intern-table"
import { db, auth } from "../../firebaseConfig"
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore"

// Text truncation component
const TruncatedText = ({ text, maxLength = 40 }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!text || text === "-" || text === "Not specified" || text === "Various") {
    return <span style={{ color: "#999" }}>{text || "-"}</span>
  }

  const shouldTruncate = text.length > maxLength
  const displayText = isExpanded || !shouldTruncate ? text : `${text.slice(0, maxLength)}...`

  const toggleExpanded = (e) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  return (
    <div style={{ lineHeight: "1.4" }}>
      <span style={{ wordBreak: "break-word" }}>{displayText}</span>
      {shouldTruncate && (
        <button
          style={{
            background: "none",
            border: "none",
            color: "#a67c52",
            cursor: "pointer",
            fontSize: "0.75rem",
            marginLeft: "4px",
            textDecoration: "underline",
            padding: "0",
          }}
          onClick={toggleExpanded}
        >
          {isExpanded ? "Less" : "More"}
        </button>
      )}
    </div>
  )
}

// Empty table row component for when there are no deals
const EmptyTableRow = () => (
  <tr style={{ borderBottom: "1px solid #E8D5C4" }}>
    <td
      colSpan="10"
      style={{
        padding: "2rem",
        textAlign: "center",
        color: "#999",
        fontStyle: "italic",
        borderRight: "none",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
        <Trophy size={48} style={{ color: "#ddd" }} />
        <div>
          <p style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", color: "#666" }}>
            You have not hired any interns, so there are no successful deals available.
          </p>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#999" }}>
            You need to hire interns first to see your successful deals here.
          </p>
        </div>
      </div>
    </td>
  </tr>
)

// Successful Intern Deals Table Component
const SuccessfulInternDealsTable = () => {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDeal, setSelectedDeal] = useState(null)

  useEffect(() => {
    const user = auth.currentUser
    if (!user) {
      setLoading(false)
      return
    }

    // Query the correct collection and status fields
    const q = query(
      collection(db, "internshipApplications"),
      where("sponsorId", "==", user.uid),
      where("status", "in", ["Accepted", "Confirmed", "Confirmed/Term Sheet Sign", "Completed"]),
    )

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      try {
        const dealsData = []

        for (const docSnapshot of querySnapshot.docs) {
          const data = docSnapshot.data()

          let internApplicationData = null
          if (data.applicantId) {
            try {
              const applicationDoc = await getDoc(doc(db, "internApplications", data.applicantId))
              if (applicationDoc.exists()) {
                internApplicationData = applicationDoc.data()
              }
            } catch (error) {
              console.log("[v0] Error fetching intern application:", error)
            }
          }

          let internProfileData = null
          if (data.applicantId) {
            try {
              const profileDoc = await getDoc(doc(db, "internProfiles", data.applicantId))
              if (profileDoc.exists()) {
                internProfileData = profileDoc.data()
              }
            } catch (error) {
              console.log("[v0] Error fetching intern profile:", error)
            }
          }

          const stipendAmount =
            internApplicationData?.internshipRequest?.stipendAmount ||
            data.stipendAmount ||
            data.monthlyStipend ||
            "Not specified"

          const duration =
            internApplicationData?.internshipRequest?.duration ||
            data.duration ||
            data.programDuration ||
            "Not specified"

          const dealData = {
            id: docSnapshot.id,
            internName: data.applicantName || "Not specified",
            dealAmount: stipendAmount,
            dealType: data.internType || data.programType || "Internship Program",
            completionDate: data.startDate || data.completedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            sector: data.field || "Not specified",
            dealStructure: duration,
            dealDuration: duration,
            serviceDelivered: data.keyTasks || data.workDescription || "Various internship tasks and projects",
            currentStatus: data.status || "Active",
            contractValue: data.totalValue || (stipendAmount ? `${stipendAmount} total` : "Not specified"),
            nextRenewal: data.endDate || "To be determined",
            location: data.location || "Not specified",
            internType: data.internType || data.department || "General Intern",
            performanceRating: data.performanceRating || "4.5/5",
            institution: data.institution || "Not specified",
            degree: data.degree || "Not specified",
            stipendAmount: stipendAmount,
            duration: duration,
            internDetails: {
              ...data,
              profileData: internProfileData,
              applicationData: internApplicationData,
              email: internProfileData?.userEmail || data.applicantEmail || "Not specified",
              phone: internProfileData?.phoneNumber || "Not specified",
              availabilityStart: internProfileData?.availabilityStart || "Not specified",
              availableHours: internProfileData?.availableHours || "Not specified",
              technicalSkills: internProfileData?.technicalSkills || [],
              languagesSpoken: internProfileData?.languagesSpoken || [],
              cv: internProfileData?.cv || null,
              transcript: internProfileData?.transcript || null,
              idDocument: internProfileData?.idDocument || null,
              portfolioFile: internProfileData?.portfolioFile || null,
              proofOfStudy: internProfileData?.proofOfStudy || null,
              references: internProfileData?.references || null,
              motivationLetter: internProfileData?.motivationLetter || null,
            },
          }

          dealsData.push(dealData)
        }

        setDeals(dealsData)
        console.log("[v0] Loaded successful intern deals:", dealsData.length)
      } catch (error) {
        console.error("[v0] Error loading successful deals:", error)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "#388E3C"
      case "Completed Successfully":
        return "#2196f3"
      case "Under Review":
        return "#ff9800"
      default:
        return "#666"
    }
  }

  const getRatingColor = (rating) => {
    const score = Number.parseFloat(rating.split("/")[0])
    if (score >= 4.5) return "#372a09ff"
    if (score >= 4.0) return "#1c1602ff"
    if (score >= 3.5) return "#110b02ff"
    return "#f44336"
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleViewDetails = (deal) => {
    setSelectedDeal(deal)
  }

  const renderDocumentLink = (docUrl, docName) => {
    if (!docUrl) {
      return <span style={{ color: "#999", fontSize: "0.9rem" }}>Not provided</span>
    }

    return (
      <a
        href={docUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "#5d4037",
          textDecoration: "underline",
          fontSize: "0.9rem",
          cursor: "pointer",
        }}
      >
        View {docName}
      </a>
    )
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <div style={{ fontSize: "16px", color: "#666" }}>Loading successful deals...</div>
      </div>
    )
  }

  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(62, 39, 35, 0.85)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    animation: "fadeIn 0.3s ease-out",
    backdropFilter: "blur(4px)",
  }

  const modalContentStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "40px",
    maxWidth: "900px",
    width: "95%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(62, 39, 35, 0.5), 0 0 0 1px rgba(141, 110, 99, 0.1)",
    animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
  }

  return (
    <>
      <div
        style={{
          overflowX: "auto",
          borderRadius: "8px",
          border: "1px solid #E8D5C4",
          boxShadow: "0 4px 24px rgba(139, 69, 19, 0.08)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "white",
            fontSize: "0.875rem",
            backgroundColor: "#FEFCFA",
            tableLayout: "fixed",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "12%",
                }}
              >
                Intern Name
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "10%",
                }}
              >
                Monthly Stipend
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "9%",
                }}
              >
                Program Type
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "10%",
                }}
              >
                Start Date
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "9%",
                }}
              >
                Specialization
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "10%",
                }}
              >
                Location
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "center",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "8%",
                }}
              >
                Duration
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "center",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "7%",
                }}
              >
                Rating
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "11%",
                }}
              >
                Program Status
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "center",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "none",
                  width: "14%",
                }}
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {deals.length === 0 ? (
              <EmptyTableRow />
            ) : (
              deals.map((deal) => (
                <tr
                  key={deal.id}
                  style={{
                    borderBottom: "1px solid #E8D5C4",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f5f5f5"
                    e.currentTarget.style.transform = "translateY(-1px)"
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "white"
                    e.currentTarget.style.transform = "translateY(0)"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                >
                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      wordWrap: "break-word",
                      whiteSpace: "normal",
                      verticalAlign: "top",
                    }}
                  >
                    <span
                      style={{
                        color: "#a67c52",
                        fontWeight: "500",
                        lineHeight: "1.3",
                      }}
                    >
                      <TruncatedText text={deal.internName} maxLength={30} />
                    </span>
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                      fontWeight: "600",
                      color: "#372306ff",
                    }}
                  >
                    {deal.dealAmount}
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                    }}
                  >
                    <span
                      style={{
                        color: "#372306ff",
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {deal.dealType}
                    </span>
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                      fontSize: "14px",
                    }}
                  >
                    {formatDate(deal.completionDate)}
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                    }}
                  >
                    <TruncatedText text={deal.sector} maxLength={20} />
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                    }}
                  >
                    <TruncatedText text={deal.location} maxLength={15} />
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                      fontSize: "14px",
                    }}
                  >
                    {deal.dealDuration}
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                      textAlign: "center",
                    }}
                  >
                    <span
                      style={{
                        color: getRatingColor(deal.performanceRating),
                        fontWeight: "700",
                        fontSize: "14px",
                      }}
                    >
                      {deal.performanceRating}
                    </span>
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: getStatusColor(deal.currentStatus) + "20",
                        color: getStatusColor(deal.currentStatus),
                        padding: "6px 10px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        display: "inline-block",
                      }}
                    >
                      {deal.currentStatus}
                    </span>
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      verticalAlign: "top",
                      textAlign: "center",
                    }}
                  >
                    <button
                      onClick={() => handleViewDetails(deal)}
                      style={{
                        backgroundColor: "#5d4037",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        padding: "8px 16px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        margin: "0 auto",
                      }}
                    >
                      <Eye size={14} />
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedDeal && (
        <div style={modalOverlayStyle} onClick={() => setSelectedDeal(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}
            >
              <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#4a352f", margin: "0" }}>Intern Details</h2>
              <button
                onClick={() => setSelectedDeal(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#f5f5f5",
                  transition: "all 0.2s ease",
                }}
              >
                <X size={24} color="#666" />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
              <div>
                <h4
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#4a352f",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Users size={20} />
                  Basic Information
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <strong>Name:</strong> {selectedDeal.internName}
                  </div>
                  <div>
                    <strong>Email:</strong> {selectedDeal.internDetails.email}
                  </div>
                  <div>
                    <strong>Phone:</strong> {selectedDeal.internDetails.phone}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <MapPin size={16} />
                    <strong>Location:</strong> {selectedDeal.location}
                  </div>
                  <div>
                    <strong>Status:</strong> {selectedDeal.currentStatus}
                  </div>
                </div>
              </div>

              <div>
                <h4
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#4a352f",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <GraduationCap size={20} />
                  Education Details
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <strong>Institution:</strong> {selectedDeal.institution}
                  </div>
                  <div>
                    <strong>Degree:</strong> {selectedDeal.degree}
                  </div>
                  <div>
                    <strong>Field:</strong> {selectedDeal.sector}
                  </div>
                  <div>
                    <strong>Intern Type:</strong> {selectedDeal.internType}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
              <div>
                <h4
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#4a352f",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Briefcase size={20} />
                  Internship Details
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <strong>Monthly Stipend:</strong> {selectedDeal.stipendAmount}
                  </div>
                  <div>
                    <strong>Duration:</strong> {selectedDeal.duration}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Calendar size={16} />
                    <strong>Start Date:</strong> {formatDate(selectedDeal.completionDate)}
                  </div>
                  <div>
                    <strong>Available Hours:</strong> {selectedDeal.internDetails.availableHours}
                  </div>
                  <div>
                    <strong>Availability Start:</strong> {selectedDeal.internDetails.availabilityStart}
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: "18px", fontWeight: "600", color: "#4a352f", marginBottom: "16px" }}>
                  Skills & Languages
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <strong>Technical Skills:</strong>
                    <div style={{ marginTop: "4px" }}>
                      {selectedDeal.internDetails.technicalSkills?.length > 0 ? (
                        selectedDeal.internDetails.technicalSkills.map((skill, index) => (
                          <span
                            key={index}
                            style={{
                              display: "inline-block",
                              backgroundColor: "#f0f0f0",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              margin: "2px 4px 2px 0",
                            }}
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: "#999" }}>Not specified</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <strong>Languages:</strong>
                    <div style={{ marginTop: "4px" }}>
                      {selectedDeal.internDetails.languagesSpoken?.length > 0 ? (
                        selectedDeal.internDetails.languagesSpoken.map((lang, index) => (
                          <span
                            key={index}
                            style={{
                              display: "inline-block",
                              backgroundColor: "#e8f5e8",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              margin: "2px 4px 2px 0",
                            }}
                          >
                            {lang}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: "#999" }}>Not specified</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: "18px", fontWeight: "600", color: "#4a352f", marginBottom: "16px" }}>Documents</h4>
              <div
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}
              >
                <div>
                  <strong>CV:</strong> {renderDocumentLink(selectedDeal.internDetails.cv, "CV")}
                </div>
                <div>
                  <strong>Transcript:</strong> {renderDocumentLink(selectedDeal.internDetails.transcript, "Transcript")}
                </div>
                <div>
                  <strong>ID Document:</strong>{" "}
                  {renderDocumentLink(selectedDeal.internDetails.idDocument, "ID Document")}
                </div>
                <div>
                  <strong>Portfolio:</strong>{" "}
                  {renderDocumentLink(selectedDeal.internDetails.portfolioFile, "Portfolio")}
                </div>
                <div>
                  <strong>Proof of Study:</strong>{" "}
                  {renderDocumentLink(selectedDeal.internDetails.proofOfStudy, "Proof of Study")}
                </div>
                <div>
                  <strong>References:</strong> {renderDocumentLink(selectedDeal.internDetails.references, "References")}
                </div>
                <div>
                  <strong>Motivation Letter:</strong>{" "}
                  {renderDocumentLink(selectedDeal.internDetails.motivationLetter, "Motivation Letter")}
                </div>
              </div>
            </div>

            <div style={{ marginTop: "30px", padding: "20px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
              <h4 style={{ fontSize: "16px", fontWeight: "600", color: "#4a352f", marginBottom: "12px" }}>
                Performance Summary
              </h4>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>
                  <strong>Rating:</strong> {selectedDeal.performanceRating}
                </span>
                <span>
                  <strong>Contract Value:</strong> {selectedDeal.contractValue}
                </span>
                <span>
                  <strong>Program Status:</strong> {selectedDeal.currentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  )
}

const InternTabbedTables = ({
  filters,
  stageFilter,
  loading,
  activeTab = "application", // Changed default to "application"
  setActiveTab,
  onDealComplete,
  profiles,
}) => {
  const [localActiveTab, setLocalActiveTab] = useState(activeTab)
  const [successfulDealsCount, setSuccessfulDealsCount] = useState(0)
  const [myMatchesCount, setMyMatchesCount] = useState(0)
  const [profileMatchesCount, setProfileMatchesCount] = useState(0)

  // Use external tab control if provided, otherwise use local state
  const currentActiveTab = setActiveTab ? activeTab : localActiveTab
  const handleTabChange = setActiveTab || setLocalActiveTab

  useEffect(() => {
    profiles(profileMatchesCount)
  }, [profileMatchesCount])

  useEffect(() => {
    const user = auth.currentUser
    if (!user) return

    // Query the correct collection and status fields
    const q = query(
      collection(db, "internshipApplications"),
      where("sponsorId", "==", user.uid),
      where("status", "in", ["Accepted", "Confirmed", "Confirmed/Term Sheet Sign", "Completed"]),
    )

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setSuccessfulDealsCount(querySnapshot.docs.length)
    })

    return () => unsubscribe()
  }, [])

  const tabStyle = (isActive) => ({
    flex: 1,
    padding: "16px 24px",
    border: "none",
    backgroundColor: isActive ? "#5d4037" : "transparent",
    color: isActive ? "white" : "#5d4037",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    borderRadius: "12px 12px 0 0",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    minHeight: "56px",
    lineHeight: "1",
  })

  return (
    <div style={{ maxWidth: "100%", margin: "0 auto", padding: "0" }}>
      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          marginBottom: "0",
          backgroundColor: "#f5f5f5",
          borderRadius: "12px 12px 0 0",
          padding: "4px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Intern Application Tab - FIRST */}
        <button
          onClick={() => handleTabChange("application")}
          style={tabStyle(currentActiveTab === "application")}
          onMouseEnter={(e) => {
            if (currentActiveTab !== "application") {
              e.target.style.backgroundColor = "#8d6e63"
              e.target.style.color = "white"
            }
          }}
          onMouseLeave={(e) => {
            if (currentActiveTab !== "application") {
              e.target.style.backgroundColor = "transparent"
              e.target.style.color = "#5d4037"
            }
          }}
        >
          <FileText size={18} style={{ flexShrink: 0, display: "block" }} />
          <span style={{ whiteSpace: "nowrap", lineHeight: "1", display: "block" }}>Intern Application</span>
        </button>

        {/* My Matches Tab - SECOND */}
        <button
          onClick={() => handleTabChange("my-matches")}
          style={tabStyle(currentActiveTab === "my-matches")}
          onMouseEnter={(e) => {
            if (currentActiveTab !== "my-matches") {
              e.target.style.backgroundColor = "#8d6e63"
              e.target.style.color = "white"
            }
          }}
          onMouseLeave={(e) => {
            if (currentActiveTab !== "my-matches") {
              e.target.style.backgroundColor = "transparent"
              e.target.style.color = "#5d4037"
            }
          }}
        >
          <Users size={18} style={{ flexShrink: 0, display: "block" }} />
          <span style={{ whiteSpace: "nowrap", lineHeight: "1", display: "block" }}>My Matches</span>
          <span
            style={{
              backgroundColor: currentActiveTab === "my-matches" ? "rgba(255, 255, 255, 0.2)" : "rgba(93, 64, 55, 0.1)",
              color: currentActiveTab === "my-matches" ? "white" : "#5d4037",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              fontSize: "12px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: "4px",
              flexShrink: 0,
            }}
          >
            {myMatchesCount}
          </span>
        </button>

        {/* Successful Deals Tab - THIRD */}
        <button
          onClick={() => handleTabChange("successful-deals")}
          style={tabStyle(currentActiveTab === "successful-deals")}
          onMouseEnter={(e) => {
            if (currentActiveTab !== "successful-deals") {
              e.target.style.backgroundColor = "#8d6e63"
              e.target.style.color = "white"
            }
          }}
          onMouseLeave={(e) => {
            if (currentActiveTab !== "successful-deals") {
              e.target.style.backgroundColor = "transparent"
              e.target.style.color = "#5d4037"
            }
          }}
        >
          <Trophy size={18} style={{ flexShrink: 0, display: "block" }} />
          <span style={{ whiteSpace: "nowrap", lineHeight: "1", display: "block" }}>Successful Deals</span>
          <span
            style={{
              backgroundColor:
                currentActiveTab === "successful-deals" ? "rgba(255, 255, 255, 0.2)" : "rgba(93, 64, 55, 0.1)",
              color: currentActiveTab === "successful-deals" ? "white" : "#5d4037",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              fontSize: "12px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: "4px",
              flexShrink: 0,
            }}
          >
            {successfulDealsCount}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "0 0 16px 16px",
          padding: "24px",
          minHeight: "600px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          border: "1px solid #e8e8e8",
          borderTop: "none",
        }}
      >
        {/* Intern Application Content - FIRST - FIXED ALIGNMENT */}
        {currentActiveTab === "application" && (
          <div style={{ 
            width: "100%", 
            display: "flex", 
            justifyContent: "flex-start", 
            alignItems: "flex-start" 
          }}>
            <div style={{ 
              width: "100%", 
              maxWidth: "100%", 
              margin: 0, 
              padding: 0 
            }}>
              <InternApplication />
            </div>
          </div>
        )}

        {/* My Matches Content - SECOND */}
        {currentActiveTab === "my-matches" && (
          <div>
            <InternTablePage
              filters={filters}
              stageFilter={stageFilter}
              onDealComplete={onDealComplete}
              matchesCount={setMyMatchesCount}
              profileMatchesCount={setProfileMatchesCount}
            />
          </div>
        )}

        {/* Successful Deals Content - THIRD */}
        {currentActiveTab === "successful-deals" && <SuccessfulInternDealsTable />}
      </div>

      {/* Enhanced styling for tab transitions */}
      <style jsx>{`
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        /* Tab content animation */
        div[style*="backgroundColor: white"] > div {
          animation: fadeIn 0.3s ease-out;
        }
        
        /* Button hover effects */
        button:hover {
          transform: translateY(-1px);
        }
        
        /* Table row hover effects */
        tr:hover {
          transition: all 0.2s ease !important;
        }
        
        /* Input and button focus styles */
        button:focus {
          outline: 2px solid #5d4037;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  )
}

export default InternTabbedTables