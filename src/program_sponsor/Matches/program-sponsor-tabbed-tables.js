"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Eye, Check, ChevronDown, Filter, Search, RefreshCw, X, AlertTriangle, Trophy, TrendingUp, Calendar, DollarSign, Users, BarChart3, Package, GraduationCap, Award, Building, Star, Clock } from "lucide-react";
import { ProgramSponsorInternTable } from "./program-sponsor-intern-table";
import styles from "./program-sponsor.module.css";
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from "../../firebaseConfig";

// Text truncation component
const TruncatedText = ({ text, maxLength = 40 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text || text === "-" || text === "Not specified" || text === "Various") {
    return <span style={{ color: "#999" }}>{text || "-"}</span>;
  }

  const shouldTruncate = text.length > maxLength;
  const displayText = isExpanded || !shouldTruncate ? text : `${text.slice(0, maxLength)}...`;

  const toggleExpanded = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

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
      )
      }
    </div>
  );
};

// Empty State Component for Successful Placements
const EmptySuccessfulPlacementsTable = () => {
  return (
    <div>
      {/* Empty Table Structure */}
      <div style={{
        overflowX: "auto",
        borderRadius: "8px",
        border: "1px solid #E8D5C4",
        boxShadow: "0 4px 24px rgba(139, 69, 19, 0.08)",
        marginBottom: "2rem",
      }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "white",
          fontSize: "0.875rem",
          backgroundColor: "#FEFCFA",
          tableLayout: "fixed"
        }}>
          <thead>
            <tr>
              <th style={{
                background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                color: "#FEFCFA",
                padding: "0.75rem 0.5rem",
                textAlign: "left",
                fontWeight: "600",
                fontSize: "0.75rem",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                borderRight: "1px solid #1a0c02",
                width: '12%'
              }}>
                Intern Name
              </th>
              <th style={{
                background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                color: "#FEFCFA",
                padding: "0.75rem 0.5rem",
                textAlign: "left",
                fontWeight: "600",
                fontSize: "0.75rem",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                borderRight: "1px solid #1a0c02",
                width: '10%'
              }}>
                Monthly Stipend
              </th>
              <th style={{
                background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                color: "#FEFCFA",
                padding: "0.75rem 0.5rem",
                textAlign: "left",
                fontWeight: "600",
                fontSize: "0.75rem",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                borderRight: "1px solid #1a0c02",
                width: '9%'
              }}>
                Program Name
              </th>
              <th style={{
                background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                color: "#FEFCFA",
                padding: "0.75rem 0.5rem",
                textAlign: "left",
                fontWeight: "600",
                fontSize: "0.75rem",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                borderRight: "1px solid #1a0c02",
                width: '10%'
              }}>
                Location
              </th>
              <th style={{
                background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                color: "#FEFCFA",
                padding: "0.75rem 0.5rem",
                textAlign: "left",
                fontWeight: "600",
                fontSize: "0.75rem",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                borderRight: "1px solid #1a0c02",
                width: '9%'
              }}>
                Field
              </th>
              <th style={{
                background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                color: "#FEFCFA",
                padding: "0.75rem 0.5rem",
                textAlign: "left",
                fontWeight: "600",
                fontSize: "0.75rem",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                borderRight: "1px solid #1a0c02",
                width: '8%'
              }}>
                Duration
              </th>
              <th style={{
                background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                color: "#FEFCFA",
                padding: "0.75rem 0.5rem",
                textAlign: "left",
                fontWeight: "600",
                fontSize: "0.75rem",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                borderRight: "1px solid #1a0c02",
                width: '11%'
              }}>
                Status
              </th>
              <th style={{
                background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                color: "#FEFCFA",
                padding: "0.75rem 0.5rem",
                textAlign: "left",
                fontWeight: "600",
                fontSize: "0.75rem",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                borderRight: "1px solid #1a0c02",
                width: '10%'
              }}>
                Post Internship
              </th>
              <th style={{
                background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                color: "#FEFCFA",
                padding: "0.75rem 0.5rem",
                textAlign: "center",
                fontWeight: "600",
                fontSize: "0.75rem",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                borderRight: "none",
                width: '14%'
              }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Empty rows to show structure */}
            {[].map((index) => (
              <tr key={index} style={{
                borderBottom: "1px solid #E8D5C4",
                opacity: 0.3
              }}>
                <td style={{
                  padding: "0.75rem 0.5rem",
                  borderRight: "1px solid #E8D5C4",
                  wordWrap: "break-word",
                  whiteSpace: "normal",
                  verticalAlign: "top"
                }}>
                  <span style={{
                    color: "#999",
                    fontWeight: "500",
                    lineHeight: "1.3"
                  }}>
                    No data
                  </span>
                </td>
                
                <td style={{
                  padding: "0.75rem 0.5rem",
                  borderRight: "1px solid #E8D5C4",
                  verticalAlign: "top",
                  fontWeight: "600",
                  color: "#999"
                }}>
                  -
                </td>
                
                <td style={{
                  padding: "0.75rem 0.5rem",
                  borderRight: "1px solid #E8D5C4",
                  verticalAlign: "top"
                }}>
                  <span style={{
                    backgroundColor: "#f5f5f5",
                    color: "#999",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}>
                    -
                  </span>
                </td>
                
                <td style={{
                  padding: "0.75rem 0.5rem",
                  borderRight: "1px solid #E8D5C4",
                  verticalAlign: "top",
                  color: "#999"
                }}>
                  -
                </td>
                
                <td style={{
                  padding: "0.75rem 0.5rem",
                  borderRight: "1px solid #E8D5C4",
                  verticalAlign: "top",
                  color: "#999"
                }}>
                  -
                </td>
                
                <td style={{
                  padding: "0.75rem 0.5rem",
                  borderRight: "1px solid #E8D5C4",
                  verticalAlign: "top",
                  fontSize: "14px",
                  color: "#999"
                }}>
                  -
                </td>
                
                <td style={{
                  padding: "0.75rem 0.5rem",
                  borderRight: "1px solid #E8D5C4",
                  verticalAlign: "top"
                }}>
                  <span style={{
                    backgroundColor: "#f5f5f5",
                    color: "#999",
                    padding: "6px 10px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "inline-block"
                  }}>
                    -
                  </span>
                </td>
                
                <td style={{
                  padding: "0.75rem 0.5rem",
                  borderRight: "1px solid #E8D5C4",
                  verticalAlign: "top"
                }}>
                  <span style={{
                    backgroundColor: "#f5f5f5",
                    color: "#999",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: "600",
                    display: "inline-block"
                  }}>
                    -
                  </span>
                </td>
                
                <td style={{
                  padding: "0.75rem 0.5rem",
                  verticalAlign: "top",
                  textAlign: "center"
                }}>
                  <button
                    disabled
                    style={{
                      backgroundColor: "#e0e0e0",
                      color: "#999",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 16px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      margin: "0 auto"
                    }}
                  >
                    <Eye size={14} />
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Message underneath the empty table */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "3rem 2rem",
          backgroundColor: "#f8f9fa",
          borderRadius: "12px",
          border: "2px dashed #d7ccc8",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "3rem",
            marginBottom: "1rem",
            color: "#8d6e63",
          }}
        >
          🏆
        </div>
        <h3
          style={{
            fontSize: "1.5rem",
            fontWeight: "600",
            color: "#5d4037",
            margin: "0 0 1rem 0",
          }}
        >
          No Successful Deals Yet
        </h3>
        <p
          style={{
            fontSize: "1.1rem",
            color: "#666",
            margin: "0 0 1.5rem 0",
            maxWidth: "500px",
            lineHeight: "1.6",
          }}
        >
          When you accept matches, they will appear here as successful deals.
        </p>
     
      </div>
    </div>
  );
};

// Successful Program Placements Table Component
const SuccessfulPlacementsTable = () => {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlacement, setSelectedPlacement] = useState(null);

  useEffect(() => {
    fetchSuccessfulPlacements();
  }, []);

  const fetchSuccessfulPlacements = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Get the current sponsor's profile to get their organization name
      const sponsorProfileRef = doc(db, "programSponsorProfiles", user.uid);
      const sponsorProfileSnap = await getDoc(sponsorProfileRef);
      
      if (!sponsorProfileSnap.exists()) {
        console.error("Sponsor profile not found");
        setLoading(false);
        return;
      }

      const sponsorData = sponsorProfileSnap.data();
      const sponsorOrgName = sponsorData.formData?.entityOverview?.organizationName;

      // Get program details from the sponsor profile
      const programName = sponsorData.formData?.programDetails?.programmeName || "Not specified";
      const monthlyStipend = sponsorData.formData?.programDetails?.stipendValue || "Not specified";
      const programDuration = sponsorData.formData?.programDetails?.duration || "Not specified";

      // Fetch all internship applications with Accepted status
      const applicationsQuery = query(
        collection(db, "internshipApplications"),
        where("status", "==", "Accepted")
      );
      
      const applicationsSnapshot = await getDocs(applicationsQuery);
      
      const successfulPlacements = await Promise.all(
        applicationsSnapshot.docs.map(async (applicationDoc) => {
          const data = applicationDoc.data();
          const internId = data.applicantId;
          
          if (!internId) return null;

          try {
            // Get the intern profile
            const internProfileRef = doc(db, "internProfiles", internId);
            const internProfileSnap = await getDoc(internProfileRef);
            
            if (!internProfileSnap.exists()) return null;

            const profile = internProfileSnap.data();
            const internSponsorName = profile.formData?.programAffiliation?.sponsorName;

            // Only include if the intern's sponsor matches the current sponsor's org name
            if (internSponsorName.toLowerCase() !== sponsorOrgName.toLowerCase()) return null;

            // Calculate completion date based on start date and duration
            const calculateCompletionDate = (startDate, duration) => {
              if (!startDate || !duration) return "Not specified";
              
              const start = new Date(startDate);
              const months = parseInt(duration);
              if (isNaN(months)) return "Not specified";
              
              start.setMonth(start.getMonth() + months);
              return start.toLocaleDateString('en-ZA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });
            };

            const startDate = profile.formData?.programAffiliation?.programStartDate;
            const completionDate = calculateCompletionDate(startDate, programDuration);

            return {
              id: applicationDoc.id,
              internName: data.applicantName,
              placementAmount: monthlyStipend,
              placementType: programName,
              completionDate: completionDate,
              field: data.field,
              placementStructure: programName,
              placementDuration: programDuration ? `${programDuration} months` : "Not specified",
              servicesDelivered: profile.formData?.skillsInterests?.technicalSkills?.join(", ") || "Not specified",
              currentStatus: "Successfully Completed",
              contractValue: monthlyStipend,
              nextMilestone: "Program Completed",
              location: data.location,
              programType: programName,
              institution: data.institution,
              degree: data.degree,
              postInternship: "Completed Program"
            };
          } catch (error) {
            console.error(`Error processing placement ${applicationDoc.id}:`, error);
            return null;
          }
        })
      );

      // Filter out any null values
      const validPlacements = successfulPlacements.filter(placement => placement !== null);
      setPlacements(validPlacements);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch successful placements:", error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active Placement':
        return '#4caf50';
      case 'Successfully Completed':
        return '#2196f3';
      case 'Under Review':
        return '#ff9800';
      default:
        return '#666';
    }
  };

  const getPostInternshipColor = (status) => {
    switch (status) {
      case 'Hired Full-time':
        return '#4caf50';
      case 'Contract Extended':
        return '#2196f3';
      case 'Completed Program':
        return '#2196f3';
      case 'Under Review':
        return '#ff9800';
      default:
        return '#666';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === "Not specified") return "Not specified";
    
    try {
      return new Date(dateString).toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const handleViewDetails = (placement) => {
    setSelectedPlacement(placement);
  };

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
  };

  const modalContentStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "40px",
    maxWidth: "900px",
    width: "95%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(62, 39, 35, 0.5), 0 0 0 1px rgba(141, 110, 99, 0.1)",
    animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <p>Loading successful placements...</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: '24px' }}>
        {placements.length === 0 ? (
          <EmptySuccessfulPlacementsTable />
        ) : (
          <div style={{
            overflowX: "auto",
            borderRadius: "8px",
            border: "1px solid #E8D5C4",
            boxShadow: "0 4px 24px rgba(139, 69, 19, 0.08)",
          }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "white",
              fontSize: "0.875rem",
              backgroundColor: "#FEFCFA",
              tableLayout: "fixed"
            }}>
              <thead>
                <tr>
                  <th style={{
                    background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                    color: "#FEFCFA",
                    padding: "0.75rem 0.5rem",
                    textAlign: "left",
                    fontWeight: "600",
                    fontSize: "0.75rem",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    borderRight: "1px solid #1a0c02",
                    width: '12%'
                  }}>
                    Intern Name
                  </th>
                  <th style={{
                    background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                    color: "#FEFCFA",
                    padding: "0.75rem 0.5rem",
                    textAlign: "left",
                    fontWeight: "600",
                    fontSize: "0.75rem",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    borderRight: "1px solid #1a0c02",
                    width: '10%'
                  }}>
                    Monthly Stipend
                  </th>
                  <th style={{
                    background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                    color: "#FEFCFA",
                    padding: "0.75rem 0.5rem",
                    textAlign: "left",
                    fontWeight: "600",
                    fontSize: "0.75rem",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    borderRight: "1px solid #1a0c02",
                    width: '9%'
                  }}>
                    Program Name
                  </th>
                  <th style={{
                    background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                    color: "#FEFCFA",
                    padding: "0.75rem 0.5rem",
                    textAlign: "left",
                    fontWeight: "600",
                    fontSize: "0.75rem",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    borderRight: "1px solid #1a0c02",
                    width: '10%'
                  }}>
                    Location
                  </th>
                  <th style={{
                    background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                    color: "#FEFCFA",
                    padding: "0.75rem 0.5rem",
                    textAlign: "left",
                    fontWeight: "600",
                    fontSize: "0.75rem",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    borderRight: "1px solid #1a0c02",
                    width: '9%'
                  }}>
                    Field
                  </th>
                  <th style={{
                    background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                    color: "#FEFCFA",
                    padding: "0.75rem 0.5rem",
                    textAlign: "left",
                    fontWeight: "600",
                    fontSize: "0.75rem",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    borderRight: "1px solid #1a0c02",
                    width: '8%'
                  }}>
                    Duration
                  </th>
                  <th style={{
                    background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                    color: "#FEFCFA",
                    padding: "0.75rem 0.5rem",
                    textAlign: "left",
                    fontWeight: "600",
                    fontSize: "0.75rem",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    borderRight: "1px solid #1a0c02",
                    width: '11%'
                  }}>
                    Status
                  </th>
                  <th style={{
                    background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                    color: "#FEFCFA",
                    padding: "0.75rem 0.5rem",
                    textAlign: "left",
                    fontWeight: "600",
                    fontSize: "0.75rem",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    borderRight: "1px solid #1a0c02",
                    width: '10%'
                  }}>
                    Post Internship
                  </th>
                  <th style={{
                    background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                    color: "#FEFCFA",
                    padding: "0.75rem 0.5rem",
                    textAlign: "center",
                    fontWeight: "600",
                    fontSize: "0.75rem",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    borderRight: "none",
                    width: '14%'
                  }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {placements.map((placement) => (
                  <tr key={placement.id} style={{
                    borderBottom: "1px solid #E8D5C4",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
                    <td style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      wordWrap: "break-word",
                      whiteSpace: "normal",
                      verticalAlign: "top"
                    }}>
                      <span style={{
                        color: "#a67c52",
                        fontWeight: "500",
                        lineHeight: "1.3"
                      }}>
                        <TruncatedText text={placement.internName} maxLength={30} />
                      </span>
                    </td>
                    
                    <td style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                      fontWeight: "600",
                      color: "#2196f3"
                    }}>
                      {placement.placementAmount}
                    </td>
                    
                    <td style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top"
                    }}>
                      <span style={{
                        backgroundColor: "#e1f5fe",
                        color: "#01579b",
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600"
                      }}>
                        <TruncatedText text={placement.placementType} maxLength={20} />
                      </span>
                    </td>
                    
                    <td style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top"
                    }}>
                      <TruncatedText text={placement.location} maxLength={20} />
                    </td>
                    
                    <td style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top"
                    }}>
                      <TruncatedText text={placement.field} maxLength={20} />
                    </td>
                    
                    <td style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                      fontSize: "14px"
                    }}>
                      {placement.placementDuration}
                    </td>
                    
                    <td style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top"
                    }}>
                      <span style={{
                        backgroundColor: getStatusColor(placement.currentStatus) + '20',
                        color: getStatusColor(placement.currentStatus),
                        padding: "6px 10px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        display: "inline-block"
                      }}>
                        {placement.currentStatus}
                      </span>
                    </td>
                    
                    <td style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top"
                    }}>
                      <span style={{
                        backgroundColor: getPostInternshipColor(placement.postInternship) + '20',
                        color: getPostInternshipColor(placement.postInternship),
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "600",
                        display: "inline-block"
                      }}>
                        {placement.postInternship}
                      </span>
                    </td>
                    
                    <td style={{
                      padding: "0.75rem 0.5rem",
                      verticalAlign: "top",
                      textAlign: "center"
                    }}>
                      <button
                        onClick={() => handleViewDetails(placement)}
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
                          margin: "0 auto"
                        }}
                      >
                        <Eye size={14} />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Placement Details Modal */}
      {selectedPlacement && (
        <div style={modalOverlayStyle} onClick={() => setSelectedPlacement(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "32px",
              paddingBottom: "24px",
              borderBottom: "3px solid #8d6e63"
            }}>
              <h2 style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#3e2723",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}>
                <GraduationCap size={32} style={{ color: "#4caf50" }} />
                Placement Details: {selectedPlacement.internName}
              </h2>
              <button
                onClick={() => setSelectedPlacement(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#666",
                  padding: "8px"
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Placement Overview Cards */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px",
              marginBottom: "32px"
            }}>
              <div style={{
                backgroundColor: "#f8f9fa",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid #e9ecef"
              }}>
                <h3 style={{
                  color: "#3e2723",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <DollarSign size={20} />
                  Placement Financial Details
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <strong>Monthly Stipend:</strong> {selectedPlacement.placementAmount}
                  </div>
                  <div>
                    <strong>Program Name:</strong> {selectedPlacement.placementType}
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: "#f8f9fa",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid #e9ecef"
              }}>
                <h3 style={{
                  color: "#3e2723",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <Calendar size={20} />
                  Placement Timeline
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <strong>Completion Date:</strong> {formatDate(selectedPlacement.completionDate)}
                  </div>
                  <div>
                    <strong>Placement Duration:</strong> {selectedPlacement.placementDuration}
                  </div>
                  <div>
                    <strong>Next Milestone:</strong> {selectedPlacement.nextMilestone}
                  </div>
                  <div>
                    <strong>Current Status:</strong>
                    <span style={{
                      backgroundColor: getStatusColor(selectedPlacement.currentStatus) + "20",
                      color: getStatusColor(selectedPlacement.currentStatus),
                      padding: "4px 8px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "600",
                      marginLeft: "8px"
                    }}>
                      {selectedPlacement.currentStatus}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: "#f8f9fa",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid #e9ecef"
              }}>
                <h3 style={{
                  color: "#3e2723",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <Award size={20} />
                  Intern & Program Info
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <strong>Institution:</strong> {selectedPlacement.institution}
                  </div>
                  <div>
                    <strong>Degree:</strong> {selectedPlacement.degree}
                  </div>
                  <div>
                    <strong>Location:</strong> {selectedPlacement.location}
                  </div>
                  <div>
                    <strong>Post Internship:</strong>
                    <span style={{
                      backgroundColor: getPostInternshipColor(selectedPlacement.postInternship) + "20",
                      color: getPostInternshipColor(selectedPlacement.postInternship),
                      padding: "4px 8px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "600",
                      marginLeft: "8px"
                    }}>
                      {selectedPlacement.postInternship}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Services Delivered Section */}
            <div style={{
              backgroundColor: "#f8f9fa",
              padding: "24px",
              borderRadius: "12px",
              border: "1px solid #e9ecef",
              marginBottom: "24px"
            }}>
              <h3 style={{
                color: "#3e2723",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <Package size={20} />
                Skills Developed
              </h3>
              <p style={{ fontSize: "16px", color: "#333", lineHeight: "1.6", margin: 0 }}>
                {selectedPlacement.servicesDelivered}
              </p>
            </div>

            {/* Close Button */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setSelectedPlacement(null)}
                style={{
                  backgroundColor: "#5d4037",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  padding: "16px 32px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
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
  );
};

// Main Tabbed Component for Program Sponsors
const ProgramSponsorTabbedTables = ({ filters, stageFilter, loading }) => {
  const [activeTab, setActiveTab] = useState('my-matches');

  const tabStyle = (isActive) => ({
    flex: 1,
    padding: '16px 24px',
    border: 'none',
    backgroundColor: isActive ? '#5d4037' : 'transparent',
    color: isActive ? 'white' : '#5d4037',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    borderRadius: '12px 12px 0 0',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  });

  // Calculate counts for tab badges
  const myMatchesCount = 24; // You can make this dynamic from props
  const [successfulPlacementsCount, setSuccessfulPlacementsCount] = useState(0);

  useEffect(() => {
    fetchSuccessfulPlacementsCount();
  }, []);

  const fetchSuccessfulPlacementsCount = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Get the current sponsor's profile to get their organization name
      const sponsorProfileRef = doc(db, "programSponsorProfiles", user.uid);
      const sponsorProfileSnap = await getDoc(sponsorProfileRef);
      
      if (!sponsorProfileSnap.exists()) return;

      const sponsorData = sponsorProfileSnap.data();
      const sponsorOrgName = sponsorData.formData?.entityOverview?.organizationName;

      // Fetch all internship applications with Accepted status
      const applicationsQuery = query(
        collection(db, "internshipApplications"),
        where("status", "==", "Accepted")
      );
      
      const applicationsSnapshot = await getDocs(applicationsQuery);
      
      // Count only those that match the sponsor's organization
      let count = 0;
      for (const applicationDoc of applicationsSnapshot.docs) {
        const data = applicationDoc.data();
        const internId = data.applicantId;
        
        if (!internId) continue;

        const internProfileRef = doc(db, "internProfiles", internId);
        const internProfileSnap = await getDoc(internProfileRef);
        
        if (!internProfileSnap.exists()) continue;

        const profile = internProfileSnap.data();
        const internSponsorName = profile.formData?.programAffiliation?.sponsorName;

        if (internSponsorName.toLowerCase() === sponsorOrgName.toLowerCase()) {
          count++;
        }
      }

      setSuccessfulPlacementsCount(count);
    } catch (error) {
      console.error("Failed to fetch successful placements count:", error);
    }
  };

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto', padding: '0' }}>
      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        marginBottom: '0',
        backgroundColor: '#f5f5f5',
        borderRadius: '12px 12px 0 0',
        padding: '4px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <button
          onClick={() => setActiveTab('my-matches')}
          style={tabStyle(activeTab === 'my-matches')}
          onMouseEnter={(e) => {
            if (activeTab !== 'my-matches') {
              e.target.style.backgroundColor = '#8d6e63';
              e.target.style.color = 'white';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'my-matches') {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#5d4037';
            }
          }}
        >
          <Users size={18} />
          My Matches
          <span style={{
            backgroundColor: activeTab === 'my-matches' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(93, 64, 55, 0.1)',
            color: activeTab === 'my-matches' ? 'white' : '#5d4037',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            fontSize: '12px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: '4px'
          }}>
            {myMatchesCount}
          </span>
        </button>
        
        <button
          onClick={() => setActiveTab('successful-placements')}
          style={tabStyle(activeTab === 'successful-placements')}
          onMouseEnter={(e) => {
            if (activeTab !== 'successful-placements') {
              e.target.style.backgroundColor = '#8d6e63';
              e.target.style.color = 'white';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'successful-placements') {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#5d4037';
            }
          }}
        >
          <Trophy size={18} />
          Successful Deals
          <span style={{
            backgroundColor: activeTab === 'successful-placements' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(93, 64, 55, 0.1)',
            color: activeTab === 'successful-placements' ? 'white' : '#5d4037',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            fontSize: '12px',
            fontWeight: '700',
            display: 'flex',
            alignItems: "center",
            justifyContent: "center",
            marginLeft: "4px"
          }}>
            {successfulPlacementsCount}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "0 0 16px 16px",
        padding: "24px",
        minHeight: "600px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e8e8e8",
        borderTop: "none"
      }}>
        {activeTab === "my-matches" && (
          <div>
            <ProgramSponsorInternTable 
              filters={filters} 
              stageFilter={stageFilter}
            />
          </div>
        )}
        
        {activeTab === "successful-placements" && <SuccessfulPlacementsTable />}
      </div>

      {/* Enhanced styling for tab transitions */}
      <style>{`
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
  );
};

export default ProgramSponsorTabbedTables;