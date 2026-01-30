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
    // Cleanup on unmount
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

  const checkFieldExists = (data, path) => {
    const parts = path.split(".");
    let current = data;
    for (const part of parts) {
      if (!current || !(part in current)) return false;
      current = current[part];
    }
    // Array or string (like a COID number or file URL)
    if (Array.isArray(current)) return current.length > 0;
    if (typeof current === "string") return current.trim().length > 0;
    return !!current;
  };

  const checkFieldExistsInDocuments = (data, documentId) => {
    try {
      if (!data || !data.documents) return false;
      const files = data.documents[documentId];
      return Array.isArray(files) ? files.length > 0 : !!files;
    } catch (error) {
      console.error(`Error checking document ${documentId}:`, error);
      return false;
    }
  };

  const checkFieldExistsInFundingDocuments = (data, documentId) => {
    try {
      if (!data || !data.fundingDocuments) return false;
      const files = data.fundingDocuments[documentId];
      return Array.isArray(files) ? files.length > 0 : !!files;
    } catch (error) {
      console.error(`Error checking funding document ${documentId}:`, error);
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

    const rubric = [
      {
        documentId: "registrationCertificate",
        path: "entityOverview.registrationCertificate",
        displayName: "CIPC business registration",
        description: "Company registration certificate",
        importance: "Non-negotiable – proves legal existence",
        compulsory: true,
        weights: { earlyStage: 0.2, growthStage: 0.15, matureStage: 0.1 },
      },
      {
        documentId: "taxClearanceCert",
        path: "legalCompliance.taxClearanceCert",
        displayName: "SARS tax compliance status",
        description: "Tax clearance certificate",
        importance: "Critical – shows financial/legal integrity",
        compulsory: true,
        weights: { earlyStage: 0.2, growthStage: 0.15, matureStage: 0.1 },
      },
      {
        documentId: "vatCertificate",
        path: "legalCompliance.vatNumber",
        displayName: "VAT registration (if applicable)",
        description: "VAT number present",
        importance: "Needed for turnover above R1M",
        condition: () =>
          Number.parseFloat(data.financialOverview?.annualRevenue || "0") >
          1000000,
        weights: { earlyStage: 0.0, growthStage: 0.05, matureStage: 0.05 },
      },
      {
        documentId: "bbbeeCert",
        path: "legalCompliance.bbbeeCert",
        displayName: "B-BBEE certification",
        description: "B-BBEE certificate uploaded",
        importance:
          "Essential for corporate procurement – only relevant for RSA",
        compulsory: true,
        weights: { earlyStage: 0.1, growthStage: 0.15, matureStage: 0.15 },
      },
      {
        documentId: "uifCoida",
        path: "legalCompliance.uifNumber",
        displayName: "UIF & COIDA Registration",
        description: "UIF and COIDA registration documents",
        importance: "Shows SME complies with labour laws (staff cover)",
        verifyFn: (data) => {
          // Check both UIF number and COIDA number exist
          const hasUIF = data.legalCompliance?.uifNumber?.trim().length > 0;
          const hasCOIDA = data.legalCompliance?.coidaNumber?.trim().length > 0;
          // Also check for uploaded documents if available
          const hasDocs = checkFieldExistsInDocuments(data, "uifCoida");
          return (hasUIF && hasCOIDA) || hasDocs;
        },
        weights: { earlyStage: 0.0, growthStage: 0.05, matureStage: 0.1 },
      },
      {
        documentId: "bankAccount",
        path: "financialOverview.bankAccount",
        displayName: "Business Bank Account",
        description: "Proof of business banking details",
        importance: "Confirms financial separation from owners",
        verifyFn: (data) => {
          // Check bank confirmation in either documents or fundingDocuments
          return (
            checkFieldExistsInDocuments(data, "bankConfirmation") ||
            checkFieldExistsInFundingDocuments(data, "bankConfirmation") ||
            checkFieldExists(data, "financialOverview.bankAccount")
          );
        },
        weights: { earlyStage: 0.1, growthStage: 0.15, matureStage: 0.2 },
      },
      {
        documentId: "shareRegister",
        path: "ownershipManagement.shareRegister",
        displayName: "Ownership/Shareholding Structure",
        description: "Share register uploaded",
        importance: "Ensures transparency (helps with B-BBEE too)",
        compulsory: true,
        weights: { earlyStage: 0.1, growthStage: 0.1, matureStage: 0.1 },
      },
      {
        documentId: "certifiedIds",
        path: "ownershipManagement.certifiedIds",
        displayName: "Verified Address & Director ID",
        description: "ID documents and proof of address uploaded",
        importance: "Confirms accountable individuals",
        compulsory: true,
        weights: { earlyStage: 0.2, growthStage: 0.15, matureStage: 0.1 },
      },
      {
        documentId: "sectorLicenses",
        path: "legalCompliance.industryAccreditations",
        displayName: "Sector-Specific Licenses (if applicable)",
        description: "Industry-specific licenses and permits",
        importance: "e.g., FSP license, Health Dept permit, Mining permits",
        verifyFn: (data) => {
          // Check for either accreditation docs or specific licenses
          return (
            checkFieldExistsInDocuments(data, "industryAccreditationDocs") ||
            checkFieldExists(data, "legalCompliance.industryAccreditations")
          );
        },
        weights: { earlyStage: 0.0, growthStage: 0.05, matureStage: 0.1 },
      },
      {
        path: "fundabilityScore",
        displayName: "Complete business profile",
        description: "Profile filled (based on fundability score)",
        importance: "Tells funders who they're dealing with",
        weights: { earlyStage: 0.1, growthStage: 0.1, matureStage: 0.1 },
        isProfileScore: true,
      },
    ];

    let totalScore = 0;
    let maxScore = 0;

    const documents = rubric.map((doc) => {
      let verified = false;
      let weight = doc.weights[weightKey];

      if (doc.condition && !doc.condition()) {
        weight = 0;
      } else if (doc.isProfileScore) {
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

        // Always contribute partial weight to totalScore
        totalScore += weight * completionRatio;
        maxScore += weight;

        // Consider 80%+ as verified ✅
        verified = completionRatio >= 0.8;
      } else if (doc.verifyFn) {
        verified = doc.verifyFn(data);
      } else if (doc.documentId) {
        // Check AI validation status
        const verification = data.verification?.[doc.documentId];
        verified = verification && verification.status === "verified";
      } else {
        verified = checkFieldExists(data, doc.path);
      }

      if (weight > 0) {
        maxScore += weight;
        if (verified) totalScore += weight;
      }

      return {
        path: doc.path,
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
      documents: documents.filter((doc) => doc.weight > 0), // Only show documents with weight > 0
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
      {/* Enhanced Outside Card Design - Same as PIS Score */}
      <div
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #faf8f6 100%)",
          borderRadius: "20px",
          boxShadow: "0 8px 32px rgba(141, 110, 99, 0.15)",
          border: "1px solid #e8ddd6",
          overflow: "hidden",
          position: "relative",
          width: "100%", // Add this line to make it full width
          minWidth: "210px", // Add this for minimum width
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
                        Essential requirements verified:
                      </p>
                      <ul
                        style={{
                          margin: "0",
                          paddingLeft: "20px",
                          color: "#5d4037",
                        }}
                      >
                        <li style={{ marginBottom: "4px" }}>
                          CIPC business registration
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          SARS tax compliance status
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          VAT registration (where applicable)
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          Verified business address & Director IDs
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          Ownership and shareholding structure
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          B-BBEE certification
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          UIF & COIDA registration (for growth/mature)
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          POPIA compliance documentation
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          Complete business profile
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
                      This assessment is tailored to your business stage, with
                      higher weight given to critical documents like
                      registration certificates, tax clearance, and B-BBEE
                      certification.
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
