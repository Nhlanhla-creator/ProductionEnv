"use client"

import { useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  Edit,
  FileText,
  ExternalLink,
  Building,
  Users,
  Mail,
  Shield,
  Package,
  MessageCircle,
  CheckSquare,
  Linkedin,
  DollarSign,
  FileCheck,
} from "lucide-react"

const ProfileSummary = ({ data, onEdit }) => {
  const [expandedSections, setExpandedSections] = useState({
    entityOverview: false,
    ownershipManagement: false,
    contactDetails: false,
    legalCompliance: false,
    financialOverview: false,
    governance: false,
    productsServices: false,
    documents: false,
    howDidYouHear: false,
    declarationConsent: false,
  })

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Helper functions
  const formatLabel = (value) => {
    if (!value) return "Not provided"
    return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  }

  const renderDocumentLink = (url, label = "View Document") => {
    if (!url) return "No document uploaded"

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 12px",
          background: "linear-gradient(135deg, #a67c52, #7d5a50)",
          color: "#faf7f2",
          borderRadius: "8px",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: "500",
          transition: "all 0.3s ease",
          cursor: "pointer",
          maxWidth: "fit-content",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)"
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(166, 124, 82, 0.3)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)"
          e.currentTarget.style.boxShadow = "none"
        }}
        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      >
        <FileText size={16} />
        <span>{label}</span>
        <ExternalLink size={14} />
      </div>
    )
  }

  const renderLinkedInLink = (url) => {
    if (!url) return "Not provided"

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 10px",
          background: "linear-gradient(135deg, #0077b5, #005582)",
          color: "#ffffff",
          borderRadius: "6px",
          textDecoration: "none",
          fontSize: "12px",
          fontWeight: "500",
          transition: "all 0.3s ease",
          cursor: "pointer",
          maxWidth: "fit-content",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)"
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 119, 181, 0.3)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)"
          e.currentTarget.style.boxShadow = "none"
        }}
        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      >
        <Linkedin size={14} />
        <span>LinkedIn</span>
        <ExternalLink size={11} />
      </div>
    )
  }

  const formatFiles = (files) => {
    if (!files || !files.length) return "None"
    return files.map((file) => (typeof file === "string" ? file : file.name)).join(", ")
  }

  const formatArray = (arr) => {
    if (!arr || !arr.length) return "None"
    return arr.join(" • ")
  }

  const formatBoolean = (value) => (value ? "✅ " : "❌ ")

  const handleEdit = () => {
    if (onEdit) onEdit()
  }

  const renderDocumentsList = (files, documentName) => {
    if (!files || files.length === 0) {
      return (
        <div style={{ fontSize: "14px", color: "#7d5a50", fontStyle: "italic" }}>
          No documents uploaded
        </div>
      )
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {files.map((file, index) => {
          const fileUrl = typeof file === "string" ? file : file.url
          const fileName = typeof file === "string" ? `${documentName} ${index + 1}` : file.name
          return (
            <div key={index}>
              {renderDocumentLink(fileUrl, fileName)}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      <style>{`
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
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
  
  /* ADD THIS NEW RULE */
  body.sidebar-collapsed .main-container {
    padding-left: var(--sidebar-collapsed-width) !important;
  }
  
  /* Responsive adjustments for mobile/tablet */
  @media (max-width: 1024px) {
    .main-container {
      padding-left: 16px !important;
      padding-top: 16px !important;
    }
  }
  
  @media (max-width: 768px) {
    .main-container {
      padding-left: 12px !important;
      padding-top: 12px !important;
    }
  }
`}</style>
      <div
        className="main-container"
        style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          minHeight: "100vh",
          width: "100%",
          background: "linear-gradient(135deg, #faf7f2 0%, #f5f0e1 50%, #f0e6d9 100%)",
          padding: "16px",
          paddingLeft: "calc(var(--sidebar-width) + 24px)",
          paddingTop: "80px",
          boxSizing: "border-box",
          transition: "all 0.3s ease",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "none",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
              backdropFilter: "blur(20px)",
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "20px",
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
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                position: "relative",
                zIndex: 2,
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              {/* Title */}
              <div style={{ flex: "1", minWidth: "250px" }}>
                <h1
                  style={{
                    background: "linear-gradient(135deg, #4a352f, #7d5a50)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontSize: "clamp(24px, 4vw, 36px)",
                    fontWeight: "800",
                    margin: "0 0 8px 0",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Universal Profile
                </h1>
                <p
                  style={{
                    color: "#7d5a50",
                    fontSize: "clamp(14px, 2vw, 18px)",
                    margin: 0,
                    fontWeight: "500",
                  }}
                >
                  Complete Business Overview
                </p>
              </div>

              {/* Action Button */}
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
                  flexShrink: 0,
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
              gap: "16px",
            }}
          >
            {/* Entity Overview */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
                backdropFilter: "blur(20px)",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid rgba(200, 182, 166, 0.3)",
                boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
                transition: "all 0.3s ease",
              }}
            >
              <div
                onClick={() => toggleSection("entityOverview")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  background: expandedSections.entityOverview
                    ? "linear-gradient(135deg, #a67c52, #7d5a50)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Building size={20} color={expandedSections.entityOverview ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(16px, 2.5vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.entityOverview ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Entity Overview
                  </h2>
                </div>
                {expandedSections.entityOverview ? (
                  <ChevronUp size={20} color="#faf7f2" />
                ) : (
                  <ChevronDown size={20} color="#4a352f" />
                )}
              </div>

              {expandedSections.entityOverview && (
                <div
                  style={{
                    padding: "20px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {[
                      { label: "Registered Name", value: formatLabel(data?.entityOverview?.registeredName) },
                      { label: "Trading Name", value: data?.entityOverview?.tradingName || "Same as registered name" },
                      { label: "Registration Number", value: data?.entityOverview?.registrationNumber },
                      { label: "Entity Type", value: data?.entityOverview?.entityType },
                      { label: "Entity Size", value: data?.entityOverview?.entitySize },
                      { label: "Financial Year End", value: data?.entityOverview?.financialYearEnd },
                      { label: "Number of Employees", value: data?.entityOverview?.employeeCount },
                      { label: "Years in Operation", value: data?.entityOverview?.yearsInOperation },
                      { label: "Operation Stage", value: formatLabel(data?.entityOverview?.operationStage) },
                      { label: "Target Market", value: data?.entityOverview?.targetMarket },
                      { label: "Location", value: formatLabel(data?.entityOverview?.location) },
                      { label: "City", value: data?.entityOverview?.city || "Not provided" },
                      ...(data?.entityOverview?.location === "south_africa"
                        ? [{ label: "Province", value: data?.entityOverview?.province }]
                        : []),
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
                      >
                        <span
                          style={{
                            display: "block",
                            fontSize: "12px",
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
                            fontSize: "14px",
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

                  <div
                    style={{
                      background: "rgba(166, 124, 82, 0.1)",
                      borderRadius: "12px",
                      padding: "16px",
                      border: "1px solid rgba(166, 124, 82, 0.2)",
                      marginTop: "16px",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "#7d5a50",
                        marginBottom: "8px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Business Description
                    </span>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#4a352f",
                        lineHeight: "1.6",
                        margin: 0,
                        fontWeight: "400",
                      }}
                    >
                      {data?.entityOverview?.businessDescription || "Not provided"}
                    </p>
                  </div>

                  <div
                    style={{
                      background: "rgba(166, 124, 82, 0.1)",
                      borderRadius: "12px",
                      padding: "16px",
                      border: "1px solid rgba(166, 124, 82, 0.2)",
                      marginTop: "12px",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "#7d5a50",
                        marginBottom: "8px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Economic Sectors
                    </span>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#4a352f",
                        lineHeight: "1.6",
                        margin: 0,
                        fontWeight: "400",
                      }}
                    >
                      {formatArray(data?.entityOverview?.economicSectors) || "Not provided"}
                    </p>
                  </div>

                  <div
                    style={{
                      background: "rgba(166, 124, 82, 0.1)",
                      borderRadius: "12px",
                      padding: "16px",
                      border: "1px solid rgba(166, 124, 82, 0.2)",
                      marginTop: "12px",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "#7d5a50",
                        marginBottom: "8px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Company Logo
                    </span>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#4a352f",
                        lineHeight: "1.6",
                        margin: 0,
                        fontWeight: "400",
                      }}
                    >
                      {data?.entityOverview?.companyLogo ? "✅ Uploaded" : "❌ Not provided"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Products & Services */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
                backdropFilter: "blur(20px)",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid rgba(200, 182, 166, 0.3)",
                boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
                transition: "all 0.3s ease",
              }}
            >
              <div
                onClick={() => toggleSection("productsServices")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  background: expandedSections.productsServices
                    ? "linear-gradient(135deg, #7d5a50, #4a352f)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Package size={20} color={expandedSections.productsServices ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(16px, 2.5vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.productsServices ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Products & Services
                  </h2>
                </div>
                {expandedSections.productsServices ? (
                  <ChevronUp size={20} color="#faf7f2" />
                ) : (
                  <ChevronDown size={20} color="#4a352f" />
                )}
              </div>

              {expandedSections.productsServices && (
                <div
                  style={{
                    padding: "20px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  {/* Product Categories */}
                  <div style={{ marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px" }}>
                      Product Categories
                    </h3>
                    {data?.productsServices?.productCategories && data.productsServices.productCategories.length > 0 ? (
                      data.productsServices.productCategories.map((category, index) => (
                        <div
                          key={index}
                          style={{
                            background: "rgba(250, 247, 242, 0.8)",
                            borderRadius: "12px",
                            padding: "16px",
                            border: "1px solid rgba(200, 182, 166, 0.2)",
                            marginBottom: "12px",
                          }}
                        >
                          <h4
                            style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#4a352f",
                              marginBottom: "10px",
                              background: "linear-gradient(135deg, #a67c52, #7d5a50)",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                            }}
                          >
                            {category.name || "Unnamed Category"}
                          </h4>
                          {category.products && category.products.length > 0 ? (
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <thead>
                                <tr style={{ borderBottom: "2px solid #c8b6a6" }}>
                                  <th
                                    style={{
                                      padding: "8px 6px",
                                      textAlign: "left",
                                      fontSize: "11px",
                                      fontWeight: "700",
                                      color: "#7d5a50",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                    }}
                                  >
                                    Product Name
                                  </th>
                                  <th
                                    style={{
                                      padding: "8px 6px",
                                      textAlign: "left",
                                      fontSize: "11px",
                                      fontWeight: "700",
                                      color: "#7d5a50",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                    }}
                                  >
                                    Description
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {category.products.map((product, idx) => (
                                  <tr key={idx} style={{ borderBottom: "1px solid #e6d7c3" }}>
                                    <td
                                      style={{
                                        padding: "8px 6px",
                                        color: "#4a352f",
                                        fontWeight: "500",
                                        fontSize: "12px",
                                      }}
                                    >
                                      {product.name || "Not provided"}
                                    </td>
                                    <td style={{ padding: "8px 6px", color: "#4a352f", fontSize: "12px" }}>
                                      {product.description || "Not provided"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div
                              style={{
                                padding: "16px",
                                textAlign: "center",
                                color: "#7d5a50",
                                fontStyle: "italic",
                                fontSize: "13px",
                              }}
                            >
                              No products in this category
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: "14px", color: "#7d5a50", fontStyle: "italic" }}>
                        No product categories provided
                      </div>
                    )}
                  </div>

                  {/* Service Categories */}
                  <div style={{ marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px" }}>
                      Service Categories
                    </h3>
                    {data?.productsServices?.serviceCategories && data.productsServices.serviceCategories.length > 0 ? (
                      data.productsServices.serviceCategories.map((category, index) => (
                        <div
                          key={index}
                          style={{
                            background: "rgba(250, 247, 242, 0.8)",
                            borderRadius: "12px",
                            padding: "16px",
                            border: "1px solid rgba(200, 182, 166, 0.2)",
                            marginBottom: "12px",
                          }}
                        >
                          <h4
                            style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#4a352f",
                              marginBottom: "10px",
                              background: "linear-gradient(135deg, #a67c52, #7d5a50)",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                            }}
                          >
                            {category.name || "Unnamed Category"}
                          </h4>
                          {category.services && category.services.length > 0 ? (
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <thead>
                                <tr style={{ borderBottom: "2px solid #c8b6a6" }}>
                                  <th
                                    style={{
                                      padding: "8px 6px",
                                      textAlign: "left",
                                      fontSize: "11px",
                                      fontWeight: "700",
                                      color: "#7d5a50",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                    }}
                                  >
                                    Service Name
                                  </th>
                                  <th
                                    style={{
                                      padding: "8px 6px",
                                      textAlign: "left",
                                      fontSize: "11px",
                                      fontWeight: "700",
                                      color: "#7d5a50",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                    }}
                                  >
                                    Description
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {category.services.map((service, idx) => (
                                  <tr key={idx} style={{ borderBottom: "1px solid #e6d7c3" }}>
                                    <td
                                      style={{
                                        padding: "8px 6px",
                                        color: "#4a352f",
                                        fontWeight: "500",
                                        fontSize: "12px",
                                      }}
                                    >
                                      {service.name || "Not provided"}
                                    </td>
                                    <td style={{ padding: "8px 6px", color: "#4a352f", fontSize: "12px" }}>
                                      {service.description || "Not provided"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div
                              style={{
                                padding: "16px",
                                textAlign: "center",
                                color: "#7d5a50",
                                fontStyle: "italic",
                                fontSize: "13px",
                              }}
                            >
                              No services in this category
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: "14px", color: "#7d5a50", fontStyle: "italic" }}>
                        No service categories provided
                      </div>
                    )}
                  </div>

                  {/* Key Clients */}
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px" }}>
                      Key Clients
                    </h3>
                    {data?.productsServices?.keyClients && data.productsServices.keyClients.length > 0 ? (
                      <div
                        style={{
                          background: "rgba(250, 247, 242, 0.8)",
                          borderRadius: "12px",
                          padding: "16px",
                          border: "1px solid rgba(200, 182, 166, 0.2)",
                          overflowX: "auto",
                        }}
                      >
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ borderBottom: "2px solid #c8b6a6" }}>
                              <th
                                style={{
                                  padding: "10px 6px",
                                  textAlign: "left",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  color: "#7d5a50",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                Client Name
                              </th>
                              <th
                                style={{
                                  padding: "10px 6px",
                                  textAlign: "left",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  color: "#7d5a50",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                Industry
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.productsServices.keyClients.map((client, index) => (
                              <tr key={index} style={{ borderBottom: "1px solid #e6d7c3" }}>
                                <td
                                  style={{ padding: "10px 6px", color: "#4a352f", fontWeight: "500", fontSize: "13px" }}
                                >
                                  {client.name || "Not provided"}
                                </td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>
                                  {client.industry || "Not provided"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ fontSize: "14px", color: "#7d5a50", fontStyle: "italic" }}>
                        No key clients provided
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Ownership & Management */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
                backdropFilter: "blur(20px)",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid rgba(200, 182, 166, 0.3)",
                boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
                transition: "all 0.3s ease",
              }}
            >
              <div
                onClick={() => toggleSection("ownershipManagement")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  background: expandedSections.ownershipManagement
                    ? "linear-gradient(135deg, #7d5a50, #4a352f)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Users size={20} color={expandedSections.ownershipManagement ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(16px, 2.5vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.ownershipManagement ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Ownership & Management
                  </h2>
                </div>
                {expandedSections.ownershipManagement ? (
                  <ChevronUp size={20} color="#faf7f2" />
                ) : (
                  <ChevronDown size={20} color="#4a352f" />
                )}
              </div>

              {expandedSections.ownershipManagement && (
                <div
                  style={{
                    padding: "20px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  <div
                    style={{
                      background: "rgba(166, 124, 82, 0.1)",
                      borderRadius: "12px",
                      padding: "16px",
                      border: "1px solid rgba(166, 124, 82, 0.2)",
                      marginBottom: "20px",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "#7d5a50",
                        marginBottom: "8px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Total Shares
                    </span>
                    <p
                      style={{
                        fontSize: "18px",
                        color: "#4a352f",
                        margin: 0,
                        fontWeight: "600",
                      }}
                    >
                      {data?.ownershipManagement?.totalShares || "Not provided"}
                    </p>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: "700",
                        color: "#4a352f",
                        marginBottom: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Users size={18} color="#a67c52" />
                      Shareholders
                    </h3>
                    {data?.ownershipManagement?.shareholders && data.ownershipManagement.shareholders.length > 0 ? (
                      <div
                        style={{
                          background: "rgba(250, 247, 242, 0.8)",
                          borderRadius: "12px",
                          padding: "16px",
                          border: "1px solid rgba(200, 182, 166, 0.2)",
                          overflowX: "auto",
                        }}
                      >
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ borderBottom: "2px solid #c8b6a6" }}>
                              {[
                                "Name",
                                "Country",
                                "LinkedIn Profile",
                                "% Shareholding",
                                "Race",
                                "Gender",
                                "Youth",
                                "Disabled",
                              ].map((header, i) => (
                                <th
                                  key={i}
                                  style={{
                                    padding: "10px 6px",
                                    textAlign: "left",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    color: "#7d5a50",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                  }}
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {data.ownershipManagement.shareholders.map((shareholder, index) => (
                              <tr key={index} style={{ borderBottom: "1px solid #e6d7c3" }}>
                                <td
                                  style={{ padding: "10px 6px", color: "#4a352f", fontWeight: "500", fontSize: "13px" }}
                                >
                                  {shareholder.name || "Not provided"}
                                </td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>
                                  {shareholder.country || "Not provided"}
                                </td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>
                                  {shareholder.linkedin
                                    ? renderLinkedInLink(shareholder.linkedin)
                                    : "Not provided"}
                                </td>
                                <td
                                  style={{ padding: "10px 6px", color: "#4a352f", fontWeight: "600", fontSize: "13px" }}
                                >
                                  {shareholder.shareholding || "0"}%
                                </td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>
                                  {shareholder.race || "Not provided"}
                                </td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>
                                  {shareholder.gender || "Not provided"}
                                </td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>
                                  {formatBoolean(shareholder.isYouth)}
                                </td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>
                                  {formatBoolean(shareholder.isDisabled)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div
                        style={{
                          background: "rgba(200, 182, 166, 0.1)",
                          borderRadius: "12px",
                          padding: "16px",
                          border: "1px solid rgba(200, 182, 166, 0.2)",
                          textAlign: "center",
                          color: "#7d5a50",
                          fontStyle: "italic",
                        }}
                      >
                        No shareholders provided
                      </div>
                    )}
                  </div>

                  <div>
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: "700",
                        color: "#4a352f",
                        marginBottom: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Users size={18} color="#a67c52" />
                      Directors
                    </h3>
                    {data?.ownershipManagement?.directors && data.ownershipManagement.directors.length > 0 ? (
                      <div
                        style={{
                          background: "rgba(250, 247, 242, 0.8)",
                          borderRadius: "12px",
                          padding: "16px",
                          border: "1px solid rgba(200, 182, 166, 0.2)",
                          overflowX: "auto",
                        }}
                      >
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ borderBottom: "2px solid #c8b6a6" }}>
                              {[
                                "Name",
                                "Position",
                                "Nationality",
                                "CV Upload",
                                "LinkedIn Profile",
                                "Exec/Non-Exec",
                                "Race",
                                "Gender",
                                "Youth",
                                "Disabled",
                              ].map((header, i) => (
                                <th
                                  key={i}
                                  style={{
                                    padding: "10px 6px",
                                    textAlign: "left",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    color: "#7d5a50",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                  }}
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {data.ownershipManagement.directors.map((director, index) => (
                              <tr key={index} style={{ borderBottom: "1px solid #e6d7c3" }}>
                                <td
                                  style={{ padding: "10px 6px", color: "#4a352f", fontWeight: "500", fontSize: "13px" }}
                                >
                                  {director.name || "Not provided"}
                                </td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>
                                  {director.position === "Other" && director.customPosition 
                                    ? director.customPosition 
                                    : director.position || "Not provided"}
                                </td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>
                                  {director.nationality || "Not provided"}
                                </td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>
                                  {director.cv && director.cv.url
                                    ? renderDocumentLink(director.cv.url, "View CV")
                                    : "No CV uploaded"}
                                </td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>
                                  {director.linkedin
                                    ? renderLinkedInLink(director.linkedin)
                                    : "Not provided"}
                                </td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>
                                  {director.execType || "Not provided"}
                                </td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>
                                  {director.race || "Not provided"}
                                </td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>
                                  {director.gender || "Not provided"}
                                </td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>
                                  {formatBoolean(director.isYouth)}
                                </td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>
                                  {formatBoolean(director.isDisabled)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div
                        style={{
                          background: "rgba(200, 182, 166, 0.1)",
                          borderRadius: "12px",
                          padding: "16px",
                          border: "1px solid rgba(200, 182, 166, 0.2)",
                          textAlign: "center",
                          color: "#7d5a50",
                          fontStyle: "italic",
                        }}
                      >
                        No directors provided
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Contact Details */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
                backdropFilter: "blur(20px)",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid rgba(200, 182, 166, 0.3)",
                boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
                transition: "all 0.3s ease",
              }}
            >
              <div
                onClick={() => toggleSection("contactDetails")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  background: expandedSections.contactDetails
                    ? "linear-gradient(135deg, #c8b6a6, #a67c52)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Mail size={20} color={expandedSections.contactDetails ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(16px, 2.5vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.contactDetails ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Contact Details
                  </h2>
                </div>
                {expandedSections.contactDetails ? (
                  <ChevronUp size={20} color="#faf7f2" />
                ) : (
                  <ChevronDown size={20} color="#4a352f" />
                )}
              </div>

              {expandedSections.contactDetails && (
                <div
                  style={{
                    padding: "20px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#4a352f",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Users size={18} color="#a67c52" />
                    Primary Contact Person
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "16px",
                      marginBottom: "20px",
                    }}
                  >
                    {[
                      { label: "Title", value: data?.contactDetails?.contactTitle },
                      { label: "Contact Name", value: data?.contactDetails?.contactName },
                      { label: "Position", value: data?.contactDetails?.position },
                      { label: "ID Number", value: data?.contactDetails?.contactId },
                      { label: "Email", value: data?.contactDetails?.email },
                      { label: "Phone", value: data?.contactDetails?.businessPhone },
                      { label: "Mobile", value: data?.contactDetails?.mobile },
                      { label: "Website", value: data?.contactDetails?.website },
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
                            fontSize: "12px",
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
                            fontSize: "14px",
                            color: "#4a352f",
                            fontWeight: "500",
                          }}
                        >
                          {item.value || "Not provided"}
                        </span>
                      </div>
                    ))}
                  </div>

                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#4a352f",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Building size={18} color="#a67c52" />
                    Address Information
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "16px",
                      marginBottom: "20px",
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
                          fontSize: "12px",
                          color: "#7d5a50",
                          marginBottom: "6px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Physical Address
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#4a352f",
                          fontWeight: "500",
                        }}
                      >
                        {data?.contactDetails?.physicalAddress || "Not provided"}
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
                          fontSize: "12px",
                          color: "#7d5a50",
                          marginBottom: "6px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Postal Address
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#4a352f",
                          fontWeight: "500",
                        }}
                      >
                        {data?.contactDetails?.sameAsPhysical
                          ? "Same as physical address"
                          : data?.contactDetails?.postalAddress || "Not provided"}
                      </span>
                    </div>
                  </div>

                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#4a352f",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <MessageCircle size={18} color="#a67c52" />
                    Social Media Links
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "16px",
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
                          fontSize: "12px",
                          color: "#7d5a50",
                          marginBottom: "12px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        LinkedIn
                      </span>
                      {renderDocumentLink(data?.contactDetails?.linkedin, "LinkedIn Profile")}
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
                          fontSize: "12px",
                          color: "#7d5a50",
                          marginBottom: "12px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Other Social Media
                      </span>
                      {renderDocumentLink(data?.contactDetails?.otherSocial, "Social Media Link")}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Legal & Compliance */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
                backdropFilter: "blur(20px)",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid rgba(200, 182, 166, 0.3)",
                boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
                transition: "all 0.3s ease",
              }}
            >
              <div
                onClick={() => toggleSection("legalCompliance")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  background: expandedSections.legalCompliance
                    ? "linear-gradient(135deg, #a67c52, #7d5a50)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Shield size={20} color={expandedSections.legalCompliance ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(16px, 2.5vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.legalCompliance ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Legal & Compliance
                  </h2>
                </div>
                {expandedSections.legalCompliance ? (
                  <ChevronUp size={20} color="#faf7f2" />
                ) : (
                  <ChevronDown size={20} color="#4a352f" />
                )}
              </div>

              {expandedSections.legalCompliance && (
                <div
                  style={{
                    padding: "20px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  {/* Basic Legal Information */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "16px",
                      marginBottom: "24px",
                    }}
                  >
                    {[
                      { label: "Tax Number", value: data?.legalCompliance?.taxNumber },
                      { label: "PAYE Number", value: data?.legalCompliance?.payeNumber },
                      { label: "UIF Status", value: data?.legalCompliance?.uifStatus },
                      { label: "UIF Number", value: data?.legalCompliance?.uifNumber },
                      { label: "COIDA Number", value: data?.legalCompliance?.coidaNumber },
                      { label: "VAT Number", value: data?.legalCompliance?.vatNumber },
                      { label: "B-BBEE Level", value: data?.legalCompliance?.bbbeeLevel },
                      {
                        label: "Industry Accreditations",
                        value: data?.legalCompliance?.industryAccreditations || "None",
                      },
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
                      >
                        <span
                          style={{
                            display: "block",
                            fontSize: "12px",
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
                            fontSize: "14px",
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

            {/* Financial Overview */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
                backdropFilter: "blur(20px)",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid rgba(200, 182, 166, 0.3)",
                boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
                transition: "all 0.3s ease",
              }}
            >
              <div
                onClick={() => toggleSection("financialOverview")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  background: expandedSections.financialOverview
                    ? "linear-gradient(135deg, #7d5a50, #4a352f)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <DollarSign size={20} color={expandedSections.financialOverview ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(16px, 2.5vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.financialOverview ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Financial Overview
                  </h2>
                </div>
                {expandedSections.financialOverview ? (
                  <ChevronUp size={20} color="#faf7f2" />
                ) : (
                  <ChevronDown size={20} color="#4a352f" />
                )}
              </div>

              {expandedSections.financialOverview && (
                <div
                  style={{
                    padding: "20px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  {/* Revenue & Valuation */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "16px",
                      marginBottom: "20px",
                    }}
                  >
                    {[
                      { label: "Generates Revenue", value: data?.financialOverview?.generatesRevenue === "yes" ? "Yes" : "No" },
                      { label: "Annual Revenue", value: data?.financialOverview?.annualRevenue || "Not provided" },
                      { label: "Current Valuation", value: data?.financialOverview?.currentValuation || "Not provided" },
                      { label: "Profitability Status", value: data?.financialOverview?.profitabilityStatus || "Not provided" },
                      { label: "Existing Debt", value: data?.financialOverview?.existingDebt || "None" },
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
                            fontSize: "12px",
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
                            fontSize: "14px",
                            color: "#4a352f",
                            fontWeight: "500",
                          }}
                        >
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Accounting Software */}
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#4a352f",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <FileText size={18} color="#a67c52" />
                    Accounting & Documentation
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "16px",
                      marginBottom: "20px",
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
                          fontSize: "12px",
                          color: "#7d5a50",
                          marginBottom: "6px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Accounting Software
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#4a352f",
                          fontWeight: "500",
                        }}
                      >
                        {data?.financialOverview?.hasAccountingSoftware === "yes" ? "Yes" : "No"}
                      </span>
                      {data?.financialOverview?.hasAccountingSoftware === "yes" && data?.financialOverview?.accountingSoftwareDocs && data?.financialOverview?.accountingSoftwareDocs.length > 0 && (
                        <div style={{ marginTop: "8px" }}>
                          {renderDocumentsList(data.financialOverview.accountingSoftwareDocs, "Accounting Software Report")}
                        </div>
                      )}
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
                          fontSize: "12px",
                          color: "#7d5a50",
                          marginBottom: "6px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Books Up to Date
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#4a352f",
                          fontWeight: "500",
                        }}
                      >
                        {data?.financialOverview?.booksUpToDate === "yes" ? "Yes" : "No"}
                      </span>
                      {data?.financialOverview?.booksUpToDate === "no" && data?.financialOverview?.booksUpToDateDetails && (
                        <div style={{ marginTop: "8px", fontSize: "13px", color: "#7d5a50" }}>
                          {data.financialOverview.booksUpToDateDetails}
                        </div>
                      )}
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
                          fontSize: "12px",
                          color: "#7d5a50",
                          marginBottom: "6px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Financials Audited
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#4a352f",
                          fontWeight: "500",
                        }}
                      >
                        {data?.financialOverview?.financialsAudited === "yes" ? "Yes" : "No"}
                      </span>
                      {data?.financialOverview?.financialsAudited === "yes" && data?.financialOverview?.auditedFinancialsDocs && data?.financialOverview?.auditedFinancialsDocs.length > 0 && (
                        <div style={{ marginTop: "8px" }}>
                          {renderDocumentsList(data.financialOverview.auditedFinancialsDocs, "Audited Financial")}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Credit Information */}
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#4a352f",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Shield size={18} color="#a67c52" />
                    Credit Information
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "16px",
                      marginBottom: "20px",
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
                          fontSize: "12px",
                          color: "#7d5a50",
                          marginBottom: "6px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Credit Report
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#4a352f",
                          fontWeight: "500",
                        }}
                      >
                        {data?.financialOverview?.hasCreditReport === "yes" ? "Available" : "Not Available"}
                      </span>
                      {data?.financialOverview?.hasCreditReport === "yes" && data?.financialOverview?.creditReportDocs && data?.financialOverview?.creditReportDocs.length > 0 && (
                        <div style={{ marginTop: "8px" }}>
                          {renderDocumentsList(data.financialOverview.creditReportDocs, "Credit Report")}
                        </div>
                      )}
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
                          fontSize: "12px",
                          color: "#7d5a50",
                          marginBottom: "6px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Credit Score
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#4a352f",
                          fontWeight: "500",
                        }}
                      >
                        {data?.financialOverview?.creditScore || "Not provided"}
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
                          fontSize: "12px",
                          color: "#7d5a50",
                          marginBottom: "6px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Credit Issues
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#4a352f",
                          fontWeight: "500",
                        }}
                      >
                        {data?.financialOverview?.creditIssues || "None reported"}
                      </span>
                    </div>
                  </div>

                  {/* Additional Information */}
                  {(data?.financialOverview?.fundraisingHistory || data?.financialOverview?.additionalFinancialNotes) && (
                    <>
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: "700",
                          color: "#4a352f",
                          marginBottom: "16px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <FileText size={18} color="#a67c52" />
                        Additional Information
                      </h3>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                          gap: "16px",
                        }}
                      >
                        {data?.financialOverview?.fundraisingHistory && (
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
                                fontSize: "12px",
                                color: "#7d5a50",
                                marginBottom: "6px",
                                fontWeight: "600",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              Fundraising History
                            </span>
                            <span
                              style={{
                                fontSize: "14px",
                                color: "#4a352f",
                                fontWeight: "500",
                              }}
                            >
                              {data.financialOverview.fundraisingHistory}
                            </span>
                          </div>
                        )}

                        {data?.financialOverview?.additionalFinancialNotes && (
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
                                fontSize: "12px",
                                color: "#7d5a50",
                                marginBottom: "6px",
                                fontWeight: "600",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              Additional Notes
                            </span>
                            <span
                              style={{
                                fontSize: "14px",
                                color: "#4a352f",
                                fontWeight: "500",
                              }}
                            >
                              {data.financialOverview.additionalFinancialNotes}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Governance */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
                backdropFilter: "blur(20px)",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid rgba(200, 182, 166, 0.3)",
                boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
                transition: "all 0.3s ease",
              }}
            >
              <div
                onClick={() => toggleSection("governance")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  background: expandedSections.governance
                    ? "linear-gradient(135deg, #7d5a50, #4a352f)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <FileCheck size={20} color={expandedSections.governance ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(16px, 2.5vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.governance ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Governance
                  </h2>
                </div>
                {expandedSections.governance ? (
                  <ChevronUp size={20} color="#faf7f2" />
                ) : (
                  <ChevronDown size={20} color="#4a352f" />
                )}
              </div>

              {expandedSections.governance && (
                <div
                  style={{
                    padding: "20px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  {/* Policies & Controls Checklist */}
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#4a352f",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <CheckSquare size={18} color="#a67c52" />
                    Policies & Controls Progress
                  </h3>

                  {data?.governance?.governanceChecklist && Object.keys(data.governance.governanceChecklist).length > 0 ? (
                    <>
                      {/* Progress Summary */}
                      <div
                        style={{
                          background: "rgba(166, 124, 82, 0.1)",
                          borderRadius: "12px",
                          padding: "20px",
                          border: "1px solid rgba(166, 124, 82, 0.2)",
                          marginBottom: "20px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                          <span style={{ fontSize: "16px", fontWeight: "600", color: "#4a352f" }}>Completion Progress</span>
                          <span style={{ fontSize: "16px", fontWeight: "600", color: "#7d5a50" }}>
                            {Object.values(data.governance.governanceChecklist).filter(Boolean).length} completed
                          </span>
                        </div>
                        <div
                          style={{
                            width: "100%",
                            background: "rgba(200, 182, 166, 0.3)",
                            borderRadius: "8px",
                            height: "12px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              background: "linear-gradient(135deg, #a67c52, #7d5a50)",
                              width: `${(Object.values(data.governance.governanceChecklist).filter(Boolean).length / Object.keys(data.governance.governanceChecklist).length) * 100}%`,
                              transition: "width 0.3s ease",
                              borderRadius: "8px",
                            }}
                          />
                        </div>
                      </div>

                      {/* Completed Items List */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                          gap: "12px",
                          marginBottom: "24px",
                        }}
                      >
                        {Object.entries(data.governance.governanceChecklist)
                          .filter(([key, value]) => value === true)
                          .map(([key, value], index) => (
                            <div
                              key={index}
                              style={{
                                background: "rgba(166, 124, 82, 0.1)",
                                borderRadius: "8px",
                                padding: "12px",
                                border: "1px solid rgba(166, 124, 82, 0.2)",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <CheckSquare size={16} color="#a67c52" />
                              <span style={{ fontSize: "13px", color: "#4a352f", fontWeight: "500" }}>
                                {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                              </span>
                            </div>
                          ))}
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        background: "rgba(200, 182, 166, 0.1)",
                        borderRadius: "12px",
                        padding: "24px",
                        border: "1px solid rgba(200, 182, 166, 0.2)",
                        textAlign: "center",
                        color: "#7d5a50",
                        marginBottom: "24px",
                      }}
                    >
                      <p style={{ margin: 0, fontSize: "14px" }}>No policies & controls checklist completed yet.</p>
                    </div>
                  )}

                  {/* Advisory Section */}
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#4a352f",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <FileText size={18} color="#a67c52" />
                    Advisory Structure
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
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
                          fontSize: "12px",
                          color: "#7d5a50",
                          marginBottom: "6px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Advisory Structure
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#4a352f",
                          fontWeight: "500",
                        }}
                      >
                        {data?.governance?.hasAdvisoryStructure || "Not specified"}
                      </span>
                      {data?.governance?.hasAdvisoryStructure === "Yes" && data?.governance?.advisoryStructureDocs && data.governance.advisoryStructureDocs.length > 0 && (
                        <div style={{ marginTop: "8px" }}>
                          {renderDocumentsList(data.governance.advisoryStructureDocs, "Advisory Structure")}
                        </div>
                      )}
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
                          fontSize: "12px",
                          color: "#7d5a50",
                          marginBottom: "6px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Policy & Controls
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#4a352f",
                          fontWeight: "500",
                        }}
                      >
                        {data?.governance?.hasPolicyControls || "Not specified"}
                      </span>
                      {data?.governance?.hasPolicyControls === "Yes" && data?.governance?.policyControlsDocs && data.governance.policyControlsDocs.length > 0 && (
                        <div style={{ marginTop: "8px" }}>
                          {renderDocumentsList(data.governance.policyControlsDocs, "Policy & Controls")}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ethics & Conflict Resolution Section */}
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#4a352f",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Shield size={18} color="#a67c52" />
                    Ethics & Conflict Resolution
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
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
                          fontSize: "12px",
                          color: "#7d5a50",
                          marginBottom: "6px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Ethics Policy
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#4a352f",
                          fontWeight: "500",
                        }}
                      >
                        {data?.governance?.hasEthicsPolicy || "Not specified"}
                      </span>
                      {data?.governance?.hasEthicsPolicy === "Yes" && data?.governance?.ethicsPolicyDocs && data.governance.ethicsPolicyDocs.length > 0 && (
                        <div style={{ marginTop: "8px" }}>
                          {renderDocumentsList(data.governance.ethicsPolicyDocs, "Ethics Policy")}
                        </div>
                      )}
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
                          fontSize: "12px",
                          color: "#7d5a50",
                          marginBottom: "6px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Conflict Resolution
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#4a352f",
                          fontWeight: "500",
                        }}
                      >
                        {data?.governance?.hasConflictResolution || "Not specified"}
                      </span>
                      {data?.governance?.hasConflictResolution === "Yes" && data?.governance?.conflictResolutionDocs && data.governance.conflictResolutionDocs.length > 0 && (
                        <div style={{ marginTop: "8px" }}>
                          {renderDocumentsList(data.governance.conflictResolutionDocs, "Conflict Resolution")}
                        </div>
                      )}
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
                          fontSize: "12px",
                          color: "#7d5a50",
                          marginBottom: "6px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Whistleblowing Policy
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#4a352f",
                          fontWeight: "500",
                        }}
                      >
                        {data?.governance?.hasWhistleblowingPolicy || "Not specified"}
                      </span>
                      {data?.governance?.hasWhistleblowingPolicy === "Yes" && data?.governance?.whistleblowingPolicyDocs && data.governance.whistleblowingPolicyDocs.length > 0 && (
                        <div style={{ marginTop: "8px" }}>
                          {renderDocumentsList(data.governance.whistleblowingPolicyDocs, "Whistleblowing Policy")}
                        </div>
                      )}
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
                          fontSize: "12px",
                          color: "#7d5a50",
                          marginBottom: "6px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Ethics Training Frequency
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#4a352f",
                          fontWeight: "500",
                        }}
                      >
                        {data?.governance?.ethicsTrainingFrequency || "Not specified"}
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
                          fontSize: "12px",
                          color: "#7d5a50",
                          marginBottom: "6px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Last Ethics Training
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#4a352f",
                          fontWeight: "500",
                        }}
                      >
                        {data?.governance?.lastEthicsTrainingDate || "Not specified"}
                      </span>
                    </div>
                  </div>

                  {/* Transparency & Reporting Section - MOVED FROM OWNERSHIP */}
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#4a352f",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <FileCheck size={18} color="#a67c52" />
                    Transparency & Reporting
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {[
                      { label: "Stakeholder Reporting Frequency", value: data?.governance?.stakeholderReportingFrequency },
                      { label: "Performance Review Cycle", value: data?.governance?.performanceReviewCycle },
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
                            fontSize: "12px",
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
                            fontSize: "14px",
                            color: "#4a352f",
                            fontWeight: "500",
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
                      borderRadius: "12px",
                      padding: "16px",
                      border: "1px solid rgba(166, 124, 82, 0.2)",
                      marginTop: "16px",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "#7d5a50",
                        marginBottom: "8px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Stakeholder Communication Methods
                    </span>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#4a352f",
                        lineHeight: "1.6",
                        margin: 0,
                        fontWeight: "400",
                      }}
                    >
                      {data?.governance?.stakeholderCommunicationMethods || "Not provided"}
                    </p>
                  </div>

                  <div
                    style={{
                      background: "rgba(166, 124, 82, 0.1)",
                      borderRadius: "12px",
                      padding: "16px",
                      border: "1px solid rgba(166, 124, 82, 0.2)",
                      marginTop: "12px",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "#7d5a50",
                        marginBottom: "8px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Performance Review & KPI Monitoring Process
                    </span>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#4a352f",
                        lineHeight: "1.6",
                        margin: 0,
                        fontWeight: "400",
                      }}
                    >
                      {data?.governance?.performanceReviewProcess || "Not provided"}
                    </p>
                  </div>

                  <div
                    style={{
                      background: "rgba(166, 124, 82, 0.1)",
                      borderRadius: "12px",
                      padding: "16px",
                      border: "1px solid rgba(166, 124, 82, 0.2)",
                      marginTop: "12px",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "#7d5a50",
                        marginBottom: "8px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Compliance Monitoring & Risk Management
                    </span>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#4a352f",
                        lineHeight: "1.6",
                        margin: 0,
                        fontWeight: "400",
                      }}
                    >
                      {data?.governance?.complianceProcedures || "Not provided"}
                    </p>
                  </div>

                  <div
                    style={{
                      background: "rgba(166, 124, 82, 0.1)",
                      borderRadius: "12px",
                      padding: "16px",
                      border: "1px solid rgba(166, 124, 82, 0.2)",
                      marginTop: "12px",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "#7d5a50",
                        marginBottom: "8px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Data Management & Privacy Policies
                    </span>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#4a352f",
                        lineHeight: "1.6",
                        margin: 0,
                        fontWeight: "400",
                      }}
                    >
                      {data?.governance?.dataManagementPolicies || "Not provided"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Documents Section - NEW */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
                backdropFilter: "blur(20px)",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid rgba(200, 182, 166, 0.3)",
                boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
                transition: "all 0.3s ease",
              }}
            >
              <div
                onClick={() => toggleSection("documents")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  background: expandedSections.documents
                    ? "linear-gradient(135deg, #a67c52, #7d5a50)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <FileText size={20} color={expandedSections.documents ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(16px, 2.5vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.documents ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Documents
                  </h2>
                </div>
                {expandedSections.documents ? (
                  <ChevronUp size={20} color="#faf7f2" />
                ) : (
                  <ChevronDown size={20} color="#4a352f" />
                )}
              </div>

              {expandedSections.documents && (
                <div
                  style={{
                    padding: "20px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  {/* Required Documents */}
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#4a352f",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <FileCheck size={18} color="#a67c52" />
                    Required Documents
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "16px",
                      marginBottom: "24px",
                    }}
                  >
                    {[
                      { label: "Registration Certificate", files: data?.documents?.registrationCertificate },
                      { label: "Certified IDs", files: data?.documents?.certifiedIds },
                      { label: "Share Register", files: data?.documents?.shareRegister },
                      { label: "Proof of Address", files: data?.documents?.proofOfAddress },
                      { label: "Tax Clearance Certificate", files: data?.documents?.taxClearanceCert },
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
                            fontSize: "12px",
                            color: "#7d5a50",
                            marginBottom: "8px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {item.label}
                        </span>
                        {renderDocumentsList(item.files, item.label)}
                      </div>
                    ))}
                  </div>

                  {/* Optional Documents */}
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#4a352f",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <FileText size={18} color="#a67c52" />
                    Optional Documents
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {[
                      { label: "VAT Certificate", files: data?.documents?.vatCertificate },
                      { label: "B-BBEE Certificate", files: data?.documents?.bbbeeCert },
                      { label: "Other Certificates", files: data?.documents?.otherCerts },
                      { label: "Industry Accreditation Documents", files: data?.documents?.industryAccreditationDocs },
                      { label: "Company Profile", files: data?.documents?.companyProfile },
                      { label: "Client References", files: data?.documents?.clientReferences },
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
                            fontSize: "12px",
                            color: "#7d5a50",
                            marginBottom: "8px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {item.label}
                        </span>
                        {renderDocumentsList(item.files, item.label)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* How Did You Hear */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
                backdropFilter: "blur(20px)",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid rgba(200, 182, 166, 0.3)",
                boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
                transition: "all 0.3s ease",
              }}
            >
              <div
                onClick={() => toggleSection("howDidYouHear")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  background: expandedSections.howDidYouHear
                    ? "linear-gradient(135deg, #c8b6a6, #a67c52)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <MessageCircle size={20} color={expandedSections.howDidYouHear ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(16px, 2.5vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.howDidYouHear ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    How Did You Hear About Us
                  </h2>
                </div>
                {expandedSections.howDidYouHear ? (
                  <ChevronUp size={20} color="#faf7f2" />
                ) : (
                  <ChevronDown size={20} color="#4a352f" />
                )}
              </div>

              {expandedSections.howDidYouHear && (
                <div
                  style={{
                    padding: "20px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "16px",
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
                          fontSize: "12px",
                          color: "#7d5a50",
                          marginBottom: "6px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Source
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#4a352f",
                          fontWeight: "500",
                        }}
                      >
                        {data?.howDidYouHear?.source || "Not provided"}
                      </span>
                    </div>

                    {/* Dynamic fields based on source */}
                    {data?.howDidYouHear?.referralName && (
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
                            fontSize: "12px",
                            color: "#7d5a50",
                            marginBottom: "6px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Referral Name
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#4a352f",
                            fontWeight: "500",
                          }}
                        >
                          {data.howDidYouHear.referralName}
                        </span>
                      </div>
                    )}

                    {data?.howDidYouHear?.socialPlatform && (
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
                            fontSize: "12px",
                            color: "#7d5a50",
                            marginBottom: "6px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Social Media Platform
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#4a352f",
                            fontWeight: "500",
                          }}
                        >
                          {data.howDidYouHear.socialPlatform}
                        </span>
                      </div>
                    )}

                    {data?.howDidYouHear?.eventName && (
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
                            fontSize: "12px",
                            color: "#7d5a50",
                            marginBottom: "6px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Event Name
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#4a352f",
                            fontWeight: "500",
                          }}
                        >
                          {data.howDidYouHear.eventName}
                        </span>
                      </div>
                    )}

                    {data?.howDidYouHear?.acceleratorName && (
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
                            fontSize: "12px",
                            color: "#7d5a50",
                            marginBottom: "6px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Accelerator/Incubator
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#4a352f",
                            fontWeight: "500",
                          }}
                        >
                          {data.howDidYouHear.acceleratorName}
                        </span>
                      </div>
                    )}

                    {data?.howDidYouHear?.newsSource && (
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
                            fontSize: "12px",
                            color: "#7d5a50",
                            marginBottom: "6px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          News Source
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#4a352f",
                            fontWeight: "500",
                          }}
                        >
                          {data.howDidYouHear.newsSource}
                        </span>
                      </div>
                    )}

                    {data?.howDidYouHear?.teamMemberName && (
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
                            fontSize: "12px",
                            color: "#7d5a50",
                            marginBottom: "6px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Team Member
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#4a352f",
                            fontWeight: "500",
                          }}
                        >
                          {data.howDidYouHear.teamMemberName}
                        </span>
                      </div>
                    )}

                    {data?.howDidYouHear?.clientPartnerName && (
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
                            fontSize: "12px",
                            color: "#7d5a50",
                            marginBottom: "6px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Client/Partner Name
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#4a352f",
                            fontWeight: "500",
                          }}
                        >
                          {data.howDidYouHear.clientPartnerName}
                        </span>
                      </div>
                    )}

                    {data?.howDidYouHear?.whatsappDetails && (
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
                            fontSize: "12px",
                            color: "#7d5a50",
                            marginBottom: "6px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          WhatsApp Details
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#4a352f",
                            fontWeight: "500",
                          }}
                        >
                          {data.howDidYouHear.whatsappDetails}
                        </span>
                      </div>
                    )}

                    {data?.howDidYouHear?.otherSource && (
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
                            fontSize: "12px",
                            color: "#7d5a50",
                            marginBottom: "6px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Other Source
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#4a352f",
                            fontWeight: "500",
                          }}
                        >
                          {data.howDidYouHear.otherSource}
                        </span>
                      </div>
                    )}
                  </div>

                  {data?.howDidYouHear?.additionalComments && (
                    <div
                      style={{
                        background: "rgba(166, 124, 82, 0.1)",
                        borderRadius: "12px",
                        padding: "16px",
                        border: "1px solid rgba(166, 124, 82, 0.2)",
                        marginTop: "16px",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          fontSize: "12px",
                          color: "#7d5a50",
                          marginBottom: "8px",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Additional Comments
                      </span>
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#4a352f",
                          lineHeight: "1.6",
                          margin: 0,
                          fontWeight: "400",
                        }}
                      >
                        {data.howDidYouHear.additionalComments}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Declaration & Consent */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
                backdropFilter: "blur(20px)",
                borderRadius: "16px",
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
                  padding: "16px 20px",
                  background: expandedSections.declarationConsent
                    ? "linear-gradient(135deg, #a67c52, #7d5a50)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <CheckSquare size={20} color={expandedSections.declarationConsent ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(16px, 2.5vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.declarationConsent ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Declaration & Consent
                  </h2>
                </div>
                {expandedSections.declarationConsent ? (
                  <ChevronUp size={20} color="#faf7f2" />
                ) : (
                  <ChevronDown size={20} color="#4a352f" />
                )}
              </div>

              {expandedSections.declarationConsent && (
                <div
                  style={{
                    padding: "20px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
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
                      { label: "Declaration of Accuracy", value: formatBoolean(data?.declarationConsent?.accuracy) },
                      {
                        label: "Consent for Data Processing",
                        value: formatBoolean(data?.declarationConsent?.dataProcessing),
                      },
                      {
                        label: "Opt-in for Promotional Visibility",
                        value: formatBoolean(data?.declarationConsent?.termsConditions),
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
                            fontSize: "12px",
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
                            fontSize: "14px",
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
              marginTop: "24px",
              textAlign: "center",
              background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
              backdropFilter: "blur(20px)",
              borderRadius: "16px",
              padding: "20px",
              border: "1px solid rgba(200, 182, 166, 0.3)",
              boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
            }}
          >
            <button
              onClick={() => (window.location.href = "/applications/funding")}
              style={{
                padding: "14px 28px",
                background: "linear-gradient(135deg, #a67c52, #7d5a50)",
                color: "#faf7f2",
                border: "none",
                borderRadius: "12px",
                fontSize: "clamp(14px, 2vw, 16px)",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 8px 24px rgba(166, 124, 82, 0.3)",
                minWidth: "180px",
                width: "100%",
                maxWidth: "250px",
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
              🚀 Go to Funding Application
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileSummary