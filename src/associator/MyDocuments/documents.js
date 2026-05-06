"use client";

import { useState } from "react";
import { FileText, ExternalLink, Upload, FolderOpen, File } from "lucide-react";

// Placeholder categories based on the admin governance structure
const ALL_CATEGORIES = [
  { id: "association-governance-board", label: "Association Governance (Board) Templates", path: ["Association Governance", "Board"], files: [{ name: "Board Charter" }, { name: "Terms of Reference" }, { name: "Conflict of Interest Policy" }] },
  { id: "association-governance-general", label: "Association Governance (General) Templates", path: ["Association Governance", "General"], files: [{ name: "Constitution" }, { name: "Membership Agreement" }, { name: "Code of Conduct" }] },
  { id: "beneficiary-impact-reporting", label: "Beneficiary & Impact Reporting Templates", path: ["Beneficiary & Impact Reporting"], files: [{ name: "Impact Report Template" }, { name: "Beneficiary Survey" }, { name: "KPI Dashboard" }] },
  { id: "fundraising-ir-investor-relations", label: "Fundraising & IR (Investor Relations) Templates", path: ["Fundraising & IR", "Investor Relations"], files: [{ name: "Investor Update" }, { name: "LP Report" }, { name: "Capital Call Notice" }] },
  { id: "fundraising-ir-policy", label: "Fundraising & IR (Policy) Templates", path: ["Fundraising & IR", "Policy"], files: [{ name: "Fundraising Policy" }, { name: "Investment Policy" }, { name: "Ethics Policy" }] },
  { id: "secretariat-operations", label: "Secretariat & Operations Templates", path: ["Secretariat & Operations"], files: [{ name: "Meeting Minutes" }, { name: "Resolution Template" }, { name: "Operational Calendar" }] },
  { id: "risk-compliance", label: "Risk and Compliance Templates", path: ["Risk and Compliance"], files: [{ name: "Risk Register" }, { name: "Compliance Checklist" }, { name: "AML Policy" }] },
  { id: "strategic-management", label: "Strategic Management Templates", path: ["Strategic Management"], files: [{ name: "Strategic Plan" }, { name: "Annual Work Plan" }, { name: "Budget Template" }] },
];

const TABS = ALL_CATEGORIES;

const AssociatorDocuments = () => {
  const [activeTab, setActiveTab] = useState(TABS[0]?.id || "");
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadedDocs, setUploadedDocs] = useState({});

  const currentCategory = ALL_CATEGORIES.find(cat => cat.id === activeTab);
  const DOCUMENTS = currentCategory?.files?.map(f => f.name) || [];

  const isUploaded = (docLabel) => {
    return !!(uploadedDocs[activeTab] && uploadedDocs[activeTab][docLabel] && uploadedDocs[activeTab][docLabel].uploaded);
  };

  const getUploadedName = (docLabel) => {
    if (uploadedDocs[activeTab] && uploadedDocs[activeTab][docLabel]) {
      return uploadedDocs[activeTab][docLabel].name || null;
    }
    return null;
  };

  const handleFileUpload = (docLabel, file) => {
    if (!file) return;
    setUploadedDocs(prev => ({
      ...prev,
      [activeTab]: {
        ...(prev[activeTab] || {}),
        [docLabel]: { name: file.name, uploaded: true }
      }
    }));
  };

  const filteredDocuments = DOCUMENTS.filter(function(d) {
    var uploaded = isUploaded(d);
    var matchFilter =
      filter === "all" ||
      (filter === "submitted" && uploaded) ||
      (filter === "pending" && !uploaded);
    var matchSearch = d.toLowerCase().includes(searchTerm.toLowerCase());
    return matchFilter && matchSearch;
  });

  const submittedCount = DOCUMENTS.filter(function(d) { return isUploaded(d); }).length;
  const pendingCount = DOCUMENTS.length - submittedCount;

  const getStatusBadge = (docLabel) => {
    var uploaded = isUploaded(docLabel);
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "4px 10px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: "600",
          backgroundColor: uploaded ? "#e8f5e8" : "#ffebee",
          color: uploaded ? "#2e7d32" : "#c62828",
        }}
      >
        {uploaded ? "Uploaded" : "Pending"}
      </span>
    );
  };

  const renderDocumentLink = (docLabel) => {
    var name = getUploadedName(docLabel);
    if (!name) {
      return (
        <span style={{ color: "#8d6e63", fontSize: "12px", fontStyle: "italic" }}>
          No document uploaded
        </span>
      );
    }
    return (
      <a
        href="#"
        onClick={function(e) { e.preventDefault(); }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          color: "#5d4037",
          textDecoration: "none",
          fontSize: "12px",
          fontWeight: "500",
          padding: "4px 0",
          borderBottom: "1px solid #5d4037",
        }}
      >
        <FileText size={14} />
        {name}
        <ExternalLink size={12} />
      </a>
    );
  };

  return (
    <div>
      <style>{`
        html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
        body { touch-action: manipulation; overflow-x: hidden; }
        @media (max-width: 1024px) {
          .doc-controls { flex-direction: column !important; gap: 16px !important; align-items: stretch !important; }
          .doc-search { width: 100% !important; }
        }
        @media (max-width: 768px) {
          .doc-table-wrap { overflow-x: auto; }
          .doc-table { min-width: 700px; }
        }
      `}</style>

      <div
        style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          minHeight: "100vh",
          backgroundColor: "#faf8f6",
          padding: "0 40px 40px 20px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div style={{ width: "100%", margin: "0 auto" }}>

          {/* Header */}
          <div
            style={{
              marginBottom: "24px",
              padding: "32px",
              background: "linear-gradient(135deg, #f5f2f0 0%, #faf8f6 100%)",
              borderRadius: "16px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              border: "2px solid #d7ccc8",
            }}
          >
            <h1 style={{ fontSize: "2rem", fontWeight: "700", color: "#5d4037", marginBottom: "6px", margin: "0 0 6px 0" }}>
              Governance Templates
            </h1>
            <p style={{ fontSize: "1.125rem", color: "#6d4c41", margin: 0 }}>
              Track and manage all governance and compliance document templates
            </p>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              width: "100%",
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "6px",
              border: "1px solid #d7ccc8",
              boxShadow: "0 2px 8px rgba(59,36,9,0.06)",
              marginBottom: "24px",
              boxSizing: "border-box",
              flexWrap: "wrap",
              gap: "4px",
            }}
          >
            {TABS.map(function(tab) {
              var active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={function() {
                    setActiveTab(tab.id);
                    setFilter("all");
                    setSearchTerm("");
                  }}
                  style={{
                    flex: "1 1 auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "12px 20px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: active ? "700" : "500",
                    backgroundColor: active ? "#8d6e63" : "transparent",
                    color: active ? "white" : "#8d6e63",
                    boxShadow: active ? "0 3px 10px rgba(141,110,99,0.3)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <FolderOpen size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
            {[
              { label: "Total Templates", value: DOCUMENTS.length, color: "#5d4037" },
              { label: "Uploaded", value: submittedCount, color: "#2e7d32" },
              { label: "Pending", value: pendingCount, color: "#c62828" },
            ].map(function(stat) {
              return (
                <div
                  key={stat.label}
                  style={{
                    flex: "1 1 150px",
                    backgroundColor: "white",
                    border: "1px solid #d7ccc8",
                    borderRadius: "12px",
                    padding: "20px 24px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
                  }}
                >
                  <div style={{ fontSize: "28px", fontWeight: "700", color: stat.color, lineHeight: 1, marginBottom: "6px" }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: "13px", color: "#8d6e63" }}>{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* Controls */}
          <div
            className="doc-controls"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
              padding: "20px 24px",
              backgroundColor: "#f5f2f0",
              borderRadius: "12px",
              border: "1px solid #d7ccc8",
              width: "100%",
              boxSizing: "border-box",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["all", "submitted", "pending"].map(function(type) {
                return (
                  <button
                    key={type}
                    onClick={function() { setFilter(type); }}
                    style={{
                      padding: "10px 20px",
                      border: filter === type ? "2px solid #8d6e63" : "2px solid #d7ccc8",
                      backgroundColor: filter === type ? "#8d6e63" : "#faf8f6",
                      color: filter === type ? "white" : "#6d4c41",
                      borderRadius: "8px",
                      fontWeight: "500",
                      fontSize: "0.875rem",
                      cursor: "pointer",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      minWidth: "100px",
                    }}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                );
              })}
            </div>
            <input
              className="doc-search"
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={function(e) { setSearchTerm(e.target.value); }}
              style={{
                padding: "12px 16px",
                border: "2px solid #d7ccc8",
                borderRadius: "8px",
                fontSize: "0.875rem",
                backgroundColor: "#faf8f6",
                color: "#5d4037",
                minWidth: "200px",
                width: "280px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Category Info */}
          {currentCategory && (
            <div
              style={{
                marginBottom: "20px",
                padding: "12px 16px",
                backgroundColor: "#efebe9",
                borderRadius: "8px",
                borderLeft: `4px solid #8d6e63`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <FolderOpen size={18} color="#5d4037" />
                <span style={{ fontSize: "13px", color: "#5d4037", fontWeight: "500" }}>
                  Path: {currentCategory.path.join(" > ")}
                </span>
              </div>
            </div>
          )}

          {/* Table */}
          {filteredDocuments.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "80px 32px",
                backgroundColor: "#f5f2f0",
                borderRadius: "16px",
                border: "2px dashed #d7ccc8",
                color: "#6d4c41",
              }}
            >
              <File size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
              <div>No templates found in this category</div>
              <div style={{ fontSize: "12px", marginTop: "8px", color: "#8d6e63" }}>
                {currentCategory?.files?.length === 0 ? "This category has no template requirements." : "Try changing your search or filter criteria."}
              </div>
            </div>
          ) : (
            <div
              className="doc-table-wrap"
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                overflow: "hidden",
                border: "1px solid #d7ccc8",
                overflowX: "auto",
              }}
            >
              <table
                className="doc-table"
                style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#8d6e63", color: "white", height: "50px" }}>
                    {["Template Name", "Uploaded Document", "Status", "Actions"].map(function(h) {
                      return (
                        <th
                          key={h}
                          style={{
                            padding: "16px 20px",
                            textAlign: "left",
                            fontWeight: "600",
                            fontSize: "12px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            borderBottom: "2px solid #6d4c41",
                          }}
                        >
                          {h}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map(function(docLabel, index) {
                    return (
                      <tr
                        key={docLabel}
                        style={{
                          backgroundColor: index % 2 === 0 ? "white" : "#faf8f6",
                          borderBottom: "1px solid #e8d8cf",
                          height: "60px",
                        }}
                        onMouseEnter={function(e) { e.currentTarget.style.backgroundColor = "#efebe9"; }}
                        onMouseLeave={function(e) { e.currentTarget.style.backgroundColor = index % 2 === 0 ? "white" : "#faf8f6"; }}
                      >
                        <td style={{ padding: "16px 20px", fontSize: "14px", color: "#5d4037", fontWeight: "600", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <FileText size={14} color="#8d6e63" />
                            {docLabel}
                          </div>
                        </td>
                        <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
                          {renderDocumentLink(docLabel)}
                        </td>
                        <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
                          {getStatusBadge(docLabel)}
                        </td>
                        <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
                          <label
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "8px 16px",
                              backgroundColor: "#a67c52",
                              color: "white",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "600",
                              cursor: "pointer",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              transition: "background-color 0.2s",
                            }}
                            onMouseEnter={function(e) { e.currentTarget.style.backgroundColor = "#8d6e63"; }}
                            onMouseLeave={function(e) { e.currentTarget.style.backgroundColor = "#a67c52"; }}
                          >
                            <Upload size={12} />
                            {isUploaded(docLabel) ? "Update" : "Upload"}
                            <input
                              type="file"
                              style={{ display: "none" }}
                              onChange={function(e) { 
                                if (e.target.files && e.target.files[0]) {
                                  handleFileUpload(docLabel, e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Upload Summary Footer */}
          {submittedCount > 0 && (
            <div
              style={{
                marginTop: "24px",
                padding: "16px 20px",
                backgroundColor: "#e8f5e8",
                borderRadius: "8px",
                border: "1px solid #c8e6c9",
                fontSize: "12px",
                color: "#2e7d32",
                textAlign: "center",
              }}
            >
              ✅ {submittedCount} of {DOCUMENTS.length} templates uploaded for {currentCategory?.label}
              {submittedCount === DOCUMENTS.length && DOCUMENTS.length > 0 && " - Complete! All templates have been uploaded."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssociatorDocuments;