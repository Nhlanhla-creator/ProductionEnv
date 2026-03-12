"use client";

import { Info, CheckCircle, XCircle, Target, Shield, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { auth } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

function GrowthSuiteLanding() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isInvestorView, setIsInvestorView] = useState(false);
  const [viewingSMEId, setViewingSMEId] = useState(null);
  const [viewingSMEName, setViewingSMEName] = useState("");
  const [viewOrigin, setViewOrigin] = useState("investor"); // ADD THIS LINE
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    // Check for investor view mode
    const investorViewMode = sessionStorage.getItem("investorViewMode");
    const smeId = sessionStorage.getItem("viewingSMEId");
    const smeName = sessionStorage.getItem("viewingSMEName");

    if (investorViewMode === "true" && smeId) {
      setIsInvestorView(true);
      setViewingSMEId(smeId);
      setViewingSMEName(smeName || "SME");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (isInvestorView && viewingSMEId) {
        setCurrentUser({ uid: viewingSMEId });
      } else {
        setCurrentUser(user);
      }
    });

    return () => unsubscribe();
  }, [isInvestorView, viewingSMEId]);

  const handleExitInvestorView = () => {
    // Clear all session storage items
    sessionStorage.removeItem("viewingSMEId");
    sessionStorage.removeItem("viewingSMEName");
    sessionStorage.removeItem("investorViewMode");
    sessionStorage.removeItem("viewOrigin"); // ADD THIS

    // Navigate based on origin
    if (viewOrigin === "catalyst") {
      window.location.href = "/catalyst/cohorts"; // Go back to Catalyst cohorts
    } else {
      window.location.href = "/my-cohorts"; // Go back to Investor cohorts
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div
        style={{
          minHeight: "100vh",
          margin: "0",
          width: "100%",
          boxSizing: "border-box",
          transition: "padding 0.3s ease",
        }}
      >
        {isInvestorView && (
          <div
            style={{
              padding: "16px 20px",
              margin: "50px 0 20px 0",
              borderRadius: "8px",
              border: "2px solid #4caf50",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "20px" }}>👁️</span>
              <span
                style={{
                  color: "#2e7d32",
                  fontWeight: "600",
                  fontSize: "15px",
                }}
              >
                {viewOrigin === "catalyst"
                  ? `Catalyst View: Viewing ${viewingSMEName}'s Growth Suite Overview`
                  : `Investor View: Viewing ${viewingSMEName}'s Growth Suite Overview`}
              </span>
            </div>
            <button
              onClick={handleExitInvestorView}
              style={{
                padding: "8px 16px",
                backgroundColor: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                transition: "background-color 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#45a049";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#4caf50";
              }}
            >
              <span>←</span>
              {viewOrigin === "catalyst"
                ? "Back to Catalyst Cohorts"
                : "Back to My Cohorts"}
            </button>
          </div>
        )}

        <div
          style={{
            maxWidth: "100%",
            margin: "0 auto",
            width: "100%",
          }}
        >
          {/* Page Header with See More Button */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              padding: "0 20px",
            }}
          >
            <h1
              style={{
                fontSize: "32px",
                fontWeight: "700",
                color: "#5d4037",
                margin: 0,
              }}
            >
              Growth Suite Overview
            </h1>

            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#5d4037",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px",
                whiteSpace: "nowrap",
              }}
            >
              {showFullDescription ? "See less" : "See more about suite"}
            </button>
          </div>

          {/* Expanded Description */}
          {showFullDescription && (
            <div
              style={{
                backgroundColor: "#fdfcfb",
                padding: "25px",
                borderRadius: "8px",
                margin: "0 20px 30px",
                border: "1px solid #e8ddd4",
              }}
            >
              <h3
                style={{
                  color: "#5d4037",
                  marginTop: 0,
                  marginBottom: "15px",
                  fontSize: "18px",
                }}
              >
                About the BIG Growth Suite
              </h3>
              <p
                style={{
                  color: "#4a352f",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  marginBottom: "15px",
                }}
              >
                The BIG Growth Suite is a comprehensive decision support and
                risk management platform designed specifically for growing
                businesses. It helps founders, executives, and investors
                understand business health, identify risks early, and make
                informed strategic decisions.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                }}
              >
                <div>
                  <h4
                    style={{
                      color: "#5d4037",
                      marginBottom: "10px",
                      fontSize: "15px",
                    }}
                  >
                    Key Benefits:
                  </h4>
                  <ul
                    style={{
                      color: "#4a352f",
                      fontSize: "13px",
                      lineHeight: "1.6",
                      margin: 0,
                      paddingLeft: "20px",
                    }}
                  >
                    <li>
                      Real-time health monitoring across all business dimensions
                    </li>
                    <li>Early warning system for potential risks</li>
                    <li>Investor-ready reporting and insights</li>
                    <li>AI-powered analysis and recommendations</li>
                    <li>Benchmarking against industry peers</li>
                  </ul>
                </div>
                <div>
                  <h4
                    style={{
                      color: "#5d4037",
                      marginBottom: "10px",
                      fontSize: "15px",
                    }}
                  >
                    Who It's For:
                  </h4>
                  <ul
                    style={{
                      color: "#4a352f",
                      fontSize: "13px",
                      lineHeight: "1.6",
                      margin: 0,
                      paddingLeft: "20px",
                    }}
                  >
                    <li>Founders and CEOs of growing SMEs</li>
                    <li>Board members and advisors</li>
                    <li>Investors and funders</li>
                    <li>Business development professionals</li>
                    <li>Strategic partners and stakeholders</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Hero Section */}
          <div
            style={{
              backgroundColor: "#fdfcfb",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(93, 64, 55, 0.1)",
              padding: "40px",
              margin: "0 20px 30px",
              border: "1px solid #e8ddd4",
            }}
          >
            <div style={{ marginBottom: "30px" }}>
              <p
                style={{
                  fontSize: "16px",
                  color: "#7d5a50",
                  fontStyle: "italic",
                  fontWeight: "500",
                  margin: 0,
                }}
              >
                Decision support and risk management for resilient, investable
                businesses
              </p>
            </div>

            {/* Main Content Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
                gap: "20px",
                marginBottom: "30px",
              }}
            >
              {/* What It Is */}
              <div
                style={{
                  backgroundColor: "#f7f3f0",
                  borderRadius: "8px",
                  padding: "20px",
                  border: "2px solid #7d5a50",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "20px",
                  }}
                >
                  <Target
                    size={24}
                    style={{ color: "#7d5a50", marginRight: "12px" }}
                  />
                  <h2
                    style={{
                      fontSize: "20px",
                      fontWeight: "700",
                      color: "#5d4037",
                      margin: 0,
                    }}
                  >
                    What the BIG Growth Suite is
                  </h2>
                </div>

                <p
                  style={{
                    fontSize: "14px",
                    lineHeight: "1.6",
                    color: "#4a352f",
                    marginBottom: "20px",
                  }}
                >
                  A{" "}
                  <strong style={{ color: "#7d5a50" }}>
                    decision support and risk management system
                  </strong>{" "}
                  developed from real management consulting engagements,
                  designed to help founders, executives, boards, funders, and
                  partners answer one question:
                </p>

                <div
                  style={{
                    backgroundColor: "#fdfcfb",
                    borderLeft: "4px solid #7d5a50",
                    padding: "15px",
                    borderRadius: "0 6px 6px 0",
                    marginBottom: "20px",
                    border: "1px solid #e8ddd4",
                  }}
                >
                  <p
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#5d4037",
                      margin: 0,
                      lineHeight: "1.4",
                    }}
                  >
                    "Is this business resilient, investable, and scalable — and
                    what could break it?"
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: "#fdfcfb",
                    borderRadius: "6px",
                    padding: "20px",
                    border: "1px solid #e8ddd4",
                  }}
                >
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: "700",
                      color: "#5d4037",
                      marginBottom: "15px",
                    }}
                  >
                    It:
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    {[
                      "Abstracts complexity",
                      "Surfaces risk early",
                      "Focuses on key value drivers",
                      "Reduces cognitive load for SMEs",
                      "Trains founders to think like boards and funders",
                    ].map((item, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                        }}
                      >
                        <CheckCircle
                          size={18}
                          style={{
                            color: "#7d5a50",
                            flexShrink: 0,
                            marginTop: "2px",
                          }}
                        />
                        <span
                          style={{
                            fontSize: "13px",
                            color: "#4a352f",
                            lineHeight: "1.5",
                          }}
                        >
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* What It's NOT */}
              <div
                style={{
                  backgroundColor: "#f7f3f0",
                  borderRadius: "8px",
                  padding: "20px",
                  border: "2px solid #7d5a50",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "20px",
                  }}
                >
                  <XCircle
                    size={24}
                    style={{ color: "#7d5a50", marginRight: "12px" }}
                  />
                  <h2
                    style={{
                      fontSize: "20px",
                      fontWeight: "700",
                      color: "#5d4037",
                      margin: 0,
                    }}
                  >
                    What the BIG Growth Suite is NOT
                  </h2>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "10px",
                    marginBottom: "20px",
                  }}
                >
                  {[
                    "ERP",
                    "CRM",
                    "HR system",
                    "Accounting software",
                    "Workflow tool",
                    "ESG reporting platform",
                  ].map((item, index) => (
                    <div
                      key={index}
                      style={{
                        backgroundColor: "#fdfcfb",
                        padding: "12px",
                        borderRadius: "6px",
                        border: "1px solid #e8ddd4",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "default",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "16px",
                          fontWeight: "700",
                          color: "#7d5a50",
                        }}
                      >
                        ✕
                      </span>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "#5d4037",
                        }}
                      >
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Positioning Statement */}
                <div
                  style={{
                    backgroundColor: "#fdfcfb",
                    borderRadius: "6px",
                    padding: "20px",
                    border: "2px solid #7d5a50",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "10px",
                    }}
                  >
                    <Shield size={20} style={{ color: "#7d5a50" }} />
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "700",
                        color: "#5d4037",
                      }}
                    >
                      Positioning
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "13px",
                      lineHeight: "1.6",
                      color: "#4a352f",
                      margin: 0,
                    }}
                  >
                    It sits <strong style={{ color: "#7d5a50" }}>above</strong>{" "}
                    operational systems and focuses on{" "}
                    <strong style={{ color: "#7d5a50" }}>
                      interpretation, prioritisation, and judgement
                    </strong>
                    .
                  </p>
                </div>
              </div>
            </div>

            {/* Design Principles */}
            <div
              style={{
                backgroundColor: "#fdfcfb",
                borderRadius: "8px",
                padding: "20px",
                border: "2px solid #7d5a50",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <Zap
                  size={24}
                  style={{ color: "#7d5a50", marginRight: "10px" }}
                />
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "#5d4037",
                    margin: 0,
                  }}
                >
                  Design principles
                </h2>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#7d5a50",
                    backgroundColor: "#f7f3f0",
                    padding: "4px 10px",
                    borderRadius: "4px",
                    border: "1px solid #7d5a50",
                  }}
                >
                  non-negotiable
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "15px",
                }}
              >
                {[
                  { label: "Decision-led, not data-led" },
                  { label: "Risk-weighted, not activity-driven" },
                  { label: "Modular (switch on/off by relevance)" },
                  { label: "Board- and funder-credible" },
                  { label: "AI as analyst, not operator" },
                ].map((principle, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: "#f7f3f0",
                      borderLeft: "4px solid #7d5a50",
                      padding: "15px",
                      borderRadius: "0 6px 6px 0",
                      border: "1px solid #e8ddd4",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#4a352f",
                        lineHeight: "1.5",
                      }}
                    >
                      {principle.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Module Access Section - Only show if not in investor view or if investor should see available modules */}
            {!isInvestorView && (
              <div
                style={{
                  backgroundColor: "#f7f3f0",
                  borderRadius: "8px",
                  padding: "20px",
                  border: "2px solid #7d5a50",
                  marginBottom: "20px",
                }}
              >
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#5d4037",
                    margin: "0 0 15px 0",
                  }}
                >
                  Available Growth Suite Modules
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "15px",
                  }}
                >
                  {[
                    {
                      name: "Company Health",
                      status: "active",
                      description: "Overall business health monitoring",
                    },
                    {
                      name: "ESG Impact",
                      status: "active",
                      description:
                        "Environmental, social, and governance tracking",
                    },
                    {
                      name: "Financial Health",
                      status: "coming-soon",
                      description: "Deep financial analysis and forecasting",
                    },
                    {
                      name: "Risk Assessment",
                      status: "active",
                      description: "Comprehensive risk identification",
                    },
                    {
                      name: "Growth Planning",
                      status: "coming-soon",
                      description: "Strategic growth and scaling tools",
                    },
                    {
                      name: "Investor Readiness",
                      status: "active",
                      description: "Prepare for funding and investment",
                    },
                  ].map((module, index) => (
                    <div
                      key={index}
                      style={{
                        backgroundColor: "#fdfcfb",
                        padding: "15px",
                        borderRadius: "6px",
                        border: `2px solid ${module.status === "active" ? "#7d5a50" : "#e8ddd4"}`,
                        opacity: module.status === "active" ? 1 : 0.7,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "15px",
                            fontWeight: "700",
                            color: "#5d4037",
                          }}
                        >
                          {module.name}
                        </span>
                        {module.status === "active" ? (
                          <CheckCircle size={16} style={{ color: "#16a34a" }} />
                        ) : (
                          <span
                            style={{
                              fontSize: "11px",
                              padding: "2px 6px",
                              backgroundColor: "#f7f3f0",
                              borderRadius: "4px",
                              color: "#8d6e63",
                            }}
                          >
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#8d6e63",
                          margin: 0,
                          lineHeight: "1.4",
                        }}
                      >
                        {module.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Financial Disclaimer */}
          <div
            style={{
              backgroundColor: "#f7f3f0",
              borderRadius: "8px",
              padding: "20px",
              border: "2px solid #7d5a50",
              margin: "0 20px 20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "15px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  backgroundColor: "#fdfcfb",
                  borderRadius: "6px",
                  padding: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #e8ddd4",
                }}
              >
                <Info size={24} style={{ color: "#7d5a50" }} />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "#5d4037",
                    margin: 0,
                    marginBottom: "5px",
                  }}
                >
                  Financial Information Disclaimer
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#7d5a50",
                    margin: 0,
                    fontWeight: "500",
                  }}
                >
                  Important information about data accuracy and verification
                </p>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#fdfcfb",
                borderRadius: "6px",
                padding: "20px",
                border: "1px solid #e8ddd4",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  color: "#4a352f",
                }}
              >
                <p style={{ margin: 0 }}>
                  Financial metrics, ratios, and scores displayed on BIG
                  Marketplace are calculated based on financial information{" "}
                  <strong style={{ color: "#7d5a50" }}>
                    provided by the business, including profit and loss
                    statements, balance sheets, and cash flow statements, as
                    submitted by the user
                  </strong>
                  .
                </p>
                <p style={{ margin: 0 }}>
                  These financial statements are{" "}
                  <strong style={{ color: "#7d5a50" }}>
                    accepted and processed as presented
                  </strong>{" "}
                  and are not independently verified unless explicitly stated
                  otherwise.
                </p>
                <p style={{ margin: 0 }}>
                  Where enhanced verification is required by a funder,
                  corporate, or the business itself, BIG Marketplace may request
                  additional supporting information, including but not limited
                  to trial balances, accounting system access, or supplementary
                  schedules, in order to validate or confirm reported figures.
                </p>
                <div
                  style={{
                    backgroundColor: "#f7f3f0",
                    borderLeft: "4px solid #7d5a50",
                    padding: "15px",
                    borderRadius: "0 6px 6px 0",
                    marginTop: "10px",
                    border: "1px solid #e8ddd4",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontWeight: "600",
                      color: "#4a352f",
                      fontSize: "13px",
                    }}
                  >
                    BIG Marketplace assumes responsibility for the accuracy,
                    completeness, or appropriateness of financial information
                    supplied by users only when such information has undergone a
                    formal verification or validation process facilitated by the
                    platform.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GrowthSuiteLanding;
