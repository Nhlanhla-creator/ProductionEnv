"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  Check,
  FileCheck,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  Info,
} from "lucide-react";
import { getDocumentId } from "../../utils/documentMapping";

export function ComplianceScoreCard({ styles, profileData, onScoreUpdate }) {
  const [showModal, setShowModal] = useState(false);
  const [complianceScore, setComplianceScore] = useState(0);
  const [complianceDocuments, setComplianceDocuments] = useState([]);
  const [showAboutScore, setShowAboutScore] = useState(false);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const [hoveredField, setHoveredField] = useState(null);

  // Add/remove body class to prevent scrolling when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.classList.add("modal-open");
      document.body.style.overflow = "hidden";
    } else {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
    }
    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
    };
  }, [showModal]);

  useEffect(() => {
    if (profileData) {
      const { score, documents } = calculateComplianceStatus(profileData);
      setComplianceScore(score);
      setComplianceDocuments(documents);
      if (onScoreUpdate) onScoreUpdate(score);
    }
  }, [profileData]);

  // Helper function to check document status from MyDocuments
  const getDocumentVerified = (docLabel, profileData) => {
    try {
      const documentId = getDocumentId(docLabel);
      
      // Check in verification object first (AI validation results)
      const verification = profileData.verification?.[documentId];
      if (verification && (verification.status === "verified" || verification.status === "verified:not_audited")) {
        return true;
      }
      
      // For multi-upload documents, check if any are verified
      const multiUploadDocs = profileData.documents?.[`${documentId}_multiple`];
      if (Array.isArray(multiUploadDocs)) {
        return multiUploadDocs.some(doc => 
          doc.url && doc.url !== "" && 
          (doc.status === "verified" || doc.status === "verified:not_audited")
        );
      }
      
      // Check single document
      const singleDoc = profileData.documents?.[documentId];
      if (singleDoc && typeof singleDoc === 'string' && singleDoc.trim() !== '') {
        // If it's a URL string, consider it uploaded but check verification
        const verificationStatus = profileData.verification?.[documentId]?.status;
        return verificationStatus === "verified" || verificationStatus === "verified:not_audited";
      }
      
      return false;
    } catch (error) {
      console.error(`Error checking document ${docLabel}:`, error);
      return false;
    }
  };

  // Helper to check if document exists (any status)
  const getDocumentExists = (docLabel, profileData) => {
    try {
      const documentId = getDocumentId(docLabel);
      
      // Check multi-upload documents
      const multiUploadDocs = profileData.documents?.[`${documentId}_multiple`];
      if (Array.isArray(multiUploadDocs)) {
        return multiUploadDocs.some(doc => doc.url && doc.url !== "");
      }
      
      // Check single document
      const singleDoc = profileData.documents?.[documentId];
      return !!(singleDoc && typeof singleDoc === 'string' && singleDoc.trim() !== '');
    } catch (error) {
      return false;
    }
  };

  const calculateComplianceStatus = (data) => {
    const stageRaw = data.entityOverview?.operationStage?.toLowerCase();

    // Map operation stages to weight categories
    let weightKey = "earlyStage"; // default
    if (["growth", "scale-up"].includes(stageRaw)) {
      weightKey = "growthStage";
    } else if (["mature"].includes(stageRaw)) {
      weightKey = "matureStage";
    }

    // Updated rubric with actual document labels from MyDocuments
    const rubric = [
      {
        docLabel: "Company Registration Certificate",
        displayName: "Company Registration Certificate",
        description: "CIPC registration document",
        importance: "Non-negotiable – proves legal existence",
        compulsory: true,
        weights: { earlyStage: 0.2, growthStage: 0.15, matureStage: 0.1 },
        verifyFn: (data) => getDocumentVerified("Company Registration Certificate", data)
      },
      {
        docLabel: "Tax Clearance Certificate",
        displayName: "SARS Tax Clearance",
        description: "Valid tax clearance certificate",
        importance: "Critical – shows financial/legal integrity",
        compulsory: true,
        weights: { earlyStage: 0.2, growthStage: 0.15, matureStage: 0.1 },
        verifyFn: (data) => getDocumentVerified("Tax Clearance Certificate", data)
      },
      {
        docLabel: "VAT Registration",
        displayName: "VAT registration (if applicable)",
        description: "VAT number present",
        importance: "Needed for turnover above R1M",
        condition: () =>
          Number.parseFloat(data.financialOverview?.annualRevenue || "0") > 1000000,
        weights: { earlyStage: 0.0, growthStage: 0.05, matureStage: 0.05 },
        verifyFn: (data) => {
          // Check VAT number exists in legal compliance
          return data.legalCompliance?.vatNumber?.trim().length > 0;
        }
      },
      {
        docLabel: "B-BBEE Certificate",
        displayName: "B-BBEE Certification",
        description: "Valid B-BBEE certificate",
        importance: "Essential for corporate procurement",
        compulsory: true,
        weights: { earlyStage: 0.1, growthStage: 0.15, matureStage: 0.15 },
        verifyFn: (data) => getDocumentVerified("B-BBEE Certificate", data)
      },
      {
        docLabel: "COIDA Letter of Good Standing",
        displayName: "COIDA Registration",
        description: "Letter of good standing from Compensation Fund",
        importance: "Shows compliance with labour laws",
        weights: { earlyStage: 0.0, growthStage: 0.05, matureStage: 0.1 },
        verifyFn: (data) => {
          const hasCOIDA = getDocumentVerified("COIDA Letter of Good Standing", data);
          const hasUIF = data.legalCompliance?.uifNumber?.trim().length > 0;
          return hasCOIDA && hasUIF;
        }
      },
      {
        docLabel: "Bank Details Confirmation Letter",
        displayName: "Business Bank Account",
        description: "Bank confirmation letter with business details",
        importance: "Confirms financial separation from owners",
        weights: { earlyStage: 0.1, growthStage: 0.15, matureStage: 0.2 },
        verifyFn: (data) => getDocumentVerified("Bank Details Confirmation Letter", data)
      },
      {
        docLabel: "Share Register",
        displayName: "Share Register",
        description: "Official share register document",
        importance: "Ensures ownership transparency",
        compulsory: true,
        weights: { earlyStage: 0.1, growthStage: 0.1, matureStage: 0.1 },
        verifyFn: (data) => getDocumentVerified("Share Register", data)
      },
      {
        docLabel: "IDs of Directors & Shareholders",
        displayName: "Director IDs",
        description: "Certified copies of ID documents",
        importance: "Verifies accountable individuals",
        compulsory: true,
        weights: { earlyStage: 0.1, growthStage: 0.1, matureStage: 0.05 },
        verifyFn: (data) => getDocumentVerified("IDs of Directors & Shareholders", data)
      },
      {
        docLabel: "Proof of Address",
        displayName: "Proof of Address",
        description: "Business address verification",
        importance: "Confirms physical business location",
        compulsory: true,
        weights: { earlyStage: 0.1, growthStage: 0.05, matureStage: 0.05 },
        verifyFn: (data) => getDocumentVerified("Proof of Address", data)
      },
      {
        docLabel: "Industry Accreditations",
        displayName: "Industry Licenses",
        description: "Sector-specific permits and accreditations",
        importance: "Required for regulated industries",
        weights: { earlyStage: 0.0, growthStage: 0.05, matureStage: 0.1 },
        verifyFn: (data) => getDocumentVerified("Industry Accreditations", data)
      },
      {
        docLabel: "Company Profile",
        displayName: "Company Profile",
        description: "Business profile and overview",
        importance: "Provides business context to funders",
        weights: { earlyStage: 0.0, growthStage: 0.0, matureStage: 0.0 },
        verifyFn: (data) => getDocumentExists("Company Profile / Brochure", data)
      },
      {
        isProfileScore: true,
        displayName: "Complete business profile",
        description: "All profile sections completed",
        importance: "Tells funders who they're dealing with",
        weights: { earlyStage: 0.1, growthStage: 0.1, matureStage: 0.1 },
      },
    ];

    let totalScore = 0;
    let maxScore = 0;

    const documents = rubric.map((doc) => {
      let verified = false;
      let weight = doc.weights[weightKey];

      // Check if document is applicable based on condition
      if (doc.condition && !doc.condition()) {
        weight = 0;
      } 
      // Handle profile completion score
      else if (doc.isProfileScore) {
        const totalSections = [
          "instructions",
          "entityOverview",
          "ownershipManagement",
          "contactDetails",
          "legalCompliance",
          "productsServices",
          "howDidYouHear",
          "documents",
          "declarationConsent",
        ];
        const completedMap = data.completedSections || {};
        const completedCount = totalSections.filter(
          (key) => completedMap[key]
        ).length;
        const completionRatio = completedCount / totalSections.length;

        totalScore += weight * completionRatio;
        maxScore += weight;
        verified = completionRatio >= 0.8;
      } 
      // Use verifyFn if provided
      else if (doc.verifyFn) {
        verified = doc.verifyFn(data);
      }

      if (weight > 0) {
        maxScore += weight;
        if (verified) totalScore += weight;
      }

      return {
        docLabel: doc.docLabel,
        displayName: doc.displayName,
        description: doc.description,
        importance: doc.importance,
        compulsory: doc.compulsory || false,
        verified,
        weight: Math.round(weight * 100),
      };
    });

    const finalScore =
      maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    return {
      score: finalScore,
      documents: documents.filter((doc) => doc.weight > 0),
    };
  };

  // Updated score levels with new color scheme
  const getScoreLevel = (score) => {
    if (score > 90)
      return { level: "Fully compliant", color: "#1B5E20", icon: CheckCircle };
    if (score >= 81)
      return { level: "Highly compliant", color: "#4CAF50", icon: CheckCircle };
    if (score >= 61)
      return { level: "Mostly compliant", color: "#FF9800", icon: TrendingUp };
    if (score >= 41)
      return {
        level: "Partially compliant",
        color: "#F44336",
        icon: AlertCircle,
      };
    return { level: "Non-compliant", color: "#B71C1C", icon: AlertCircle };
  };

  const scoreLevel = getScoreLevel(complianceScore);
  const ScoreIcon = scoreLevel.icon;

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
          width: "100%",
          minWidth: "210px",
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
                fontSize: "16px",
                fontWeight: "700",
                letterSpacing: "0.5px",
                whiteSpace: "nowrap",
              }}
            >
              Compliance Score
            </h2>
            <FileCheck size={24} style={{ opacity: 0.8 }} />
          </div>
          <p
            style={{
              margin: "0",
              fontSize: "13px",
              opacity: "0.9",
              fontWeight: "400",
            }}
          >
            Legal & regulatory verification
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
                {complianceScore}%
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: scoreLevel.color,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              ></span>

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

          {/* Action Button */}
          <button
            onClick={() => setShowModal(true)}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #5d4037 0%, #4a2c20 100%)",
              color: "white",
              border: "none",
              marginTop: "15px",
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
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 20px rgba(93, 64, 55, 0.4)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0px)";
              e.target.style.boxShadow = "0 4px 16px rgba(93, 64, 55, 0.3)";
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
            zIndex: "999999",
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
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
                Compliance verification
              </h3>

              <div
                style={{
                  textAlign: "center",
                  marginBottom: "30px",
                  padding: "20px",
                  background:
                    "linear-gradient(135deg, #fdf8f6 0%, #f3e8dc 100%)",
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
                    {complianceScore}%
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
                    {profileData?.entityOverview?.operationStage || "Ideation"}
                  </span>
                </div>
              </div>

              {/* Enhanced About the Compliance Score section */}
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
                  <span>About the compliance score</span>
                  <ChevronDown
                    size={20}
                    style={{
                      transform: showAboutScore
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
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
                      The compliance score measures whether a business meets the
                      core legal and regulatory requirements needed to operate
                      formally and access funding opportunities. Weightings are
                      adjusted based on your business stage.
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
                      <p
                        style={{
                          fontWeight: "bold",
                          marginBottom: "8px",
                          color: "#6d4c41",
                        }}
                      >
                        Documents verified:
                      </p>
                      <ul
                        style={{
                          margin: "0",
                          paddingLeft: "20px",
                          color: "#5d4037",
                        }}
                      >
                        <li style={{ marginBottom: "4px" }}>
                          Company Registration Certificate
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          Tax Clearance Certificate
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          B-BBEE Certificate
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          Bank Details Confirmation Letter
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          Share Register
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          IDs of Directors & Shareholders
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          Proof of Address
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          COIDA Letter of Good Standing
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          Industry Accreditations (if applicable)
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
                      <p
                        style={{
                          fontWeight: "bold",
                          marginBottom: "8px",
                          color: "#6d4c41",
                        }}
                      >
                        Score breakdown:
                      </p>
                      <ul
                        style={{
                          margin: "0",
                          paddingLeft: "20px",
                          color: "#5d4037",
                        }}
                      >
                        <li style={{ marginBottom: "4px" }}>
                          <strong>91-100%:</strong> Fully compliant - ready for
                          all opportunities
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>81-90%:</strong> Highly compliant - minor gaps
                          to address
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>61-80%:</strong> Mostly compliant - some
                          documentation needed
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>41-60%:</strong> Partially compliant -
                          significant gaps present
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>0-40%:</strong> Non-compliant - substantial
                          work required
                        </li>
                      </ul>
                    </div>

                    <p
                      style={{
                        marginBottom: "0",
                        lineHeight: "1.6",
                        fontStyle: "italic",
                        color: "#6d4c41",
                      }}
                    >
                      Documents are considered "verified" when they have passed
                      AI validation and are marked as verified in the system.
                      Regular uploads without verification are not counted
                      toward your score.
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
                      transform: showScoreBreakdown
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
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
                    {complianceDocuments.map((doc, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "15px",
                          borderBottom:
                            index < complianceDocuments.length - 1
                              ? "1px solid #e8d8cf"
                              : "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "white",
                          marginBottom: "5px",
                          borderRadius: "8px",
                          position: "relative",
                        }}
                        onMouseEnter={() => setHoveredField(index)}
                        onMouseLeave={() => setHoveredField(null)}
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
                              width: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              backgroundColor: doc.verified
                                ? "#4CAF50"
                                : "#f3e8dc",
                              border: doc.verified
                                ? "2px solid #4CAF50"
                                : "2px solid #d6b88a",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: "12px",
                              flexShrink: "0",
                            }}
                          >
                            {doc.verified ? (
                              <Check size={14} color="white" />
                            ) : (
                              <span
                                style={{
                                  color: "#F44336",
                                  fontSize: "16px",
                                  fontWeight: "bold",
                                }}
                              >
                                ×
                              </span>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontWeight: "600",
                                color: "#5d4037",
                                fontSize: "14px",
                                marginBottom: "2px",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              {doc.displayName}
                              {doc.compulsory && (
                                <span
                                  style={{
                                    backgroundColor: "#F44336",
                                    color: "white",
                                    fontSize: "8px",
                                    padding: "2px 4px",
                                    borderRadius: "4px",
                                    fontWeight: "700",
                                    textTransform: "uppercase",
                                  }}
                                >
                                  Required
                                </span>
                              )}
                              {doc.importance && (
                                <Info
                                  size={12}
                                  color="#8d6e63"
                                  style={{ cursor: "help" }}
                                />
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#8d6e63",
                                fontStyle: "italic",
                              }}
                            >
                              {doc.description} • Weight: {doc.weight}%
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: doc.verified ? "#4CAF50" : "#FF5722",
                          }}
                        >
                          {doc.verified ? "Verified" : "Missing"}
                        </div>

                        {/* Importance Tooltip */}
                        {hoveredField === index && doc.importance && (
                          <div
                            style={{
                              position: "absolute",
                              top: "-10px",
                              left: "50%",
                              transform: "translateX(-50%) translateY(-100%)",
                              backgroundColor: "#5d4037",
                              color: "white",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              whiteSpace: "nowrap",
                              maxWidth: "300px",
                              whiteSpace: "normal",
                              zIndex: 1000,
                              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                            }}
                          >
                            {doc.importance}
                            <div
                              style={{
                                position: "absolute",
                                top: "100%",
                                left: "50%",
                                transform: "translateX(-50%)",
                                borderWidth: "6px",
                                borderStyle: "solid",
                                borderColor:
                                  "#5d4037 transparent transparent transparent",
                              }}
                            ></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}