// src/smses/MyGrowthTools/shared/CsvUploadModal.js
import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  FileSpreadsheet,
  Upload,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const T = {
  ink: "#2d201c",
  body: "#3b2b26",
  muted: "#6b5b55",
  line: "#ded8d4",
  lineSoft: "#e9e3df",
  lineStrong: "#b0a29b",
  bg: "#ffffff",
  panel: "#faf8f7",
  raised: "#f2eeec",
  accent: "#4a352f",
  accentSoft: "#6b4f47",
  accentTint: "#f4efec",
  header: "#241813",
  green: "#166534",
  greenBg: "#f0fdf4",
  greenBorder: "#bbf7d0",
  amber: "#92400e",
  amberBg: "#fffbeb",
  amberBorder: "#fde68a",
  red: "#991b1b",
  redBg: "#fef2f2",
  redBorder: "#fecaca",
  blue: "#1e40af",
  blueBg: "#eff6ff",
  blueBorder: "#bfdbfe",
};

const CsvUploadModal = ({
  isOpen,
  onClose,
  parseResult,
  onConfirm,
  isApplying = false,
}) => {
  const [showAllRows, setShowAllRows] = useState(false);
  const [expandNotices, setExpandNotices] = useState(false);

  if (!isOpen || !parseResult) return null;

  const {
    isValid,
    validCount = 0,
    updates = [],
    errors = [],
    warnings = [],
    info = [],
    metadata = {},
  } = parseResult;

  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  const hasInfo = info.length > 0;

  // Group unique KPIs for preview summary
  const affectedKpiNames = [...new Set(updates.map((u) => u.kpi.name))];
  const displayedUpdates = showAllRows ? updates : updates.slice(0, 15);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(36, 24, 19, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isApplying) onClose();
      }}
    >
      <div
        style={{
          background: T.bg,
          borderRadius: "14px",
          width: "100%",
          maxWidth: "840px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
          border: `1px solid ${T.lineStrong}`,
          overflow: "hidden",
          animation: "fadeIn 0.15s ease-out",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: T.header,
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${T.lineStrong}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FileSpreadsheet size={20} color="#fff" />
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: "16px" }}>
                CSV Import Preview & Validation
              </div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", marginTop: "2px" }}>
                {metadata.section ? `Section: ${metadata.section}` : "KPI Data Import"}
                {metadata.year ? ` · Financial Year: ${metadata.year}` : ""}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isApplying}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.7)",
              cursor: isApplying ? "not-allowed" : "pointer",
              padding: "4px",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
          {/* Status Metrics Bar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "12px",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                background: hasErrors ? T.panel : T.greenBg,
                border: `1px solid ${hasErrors ? T.line : T.greenBorder}`,
                padding: "12px 14px",
                borderRadius: "10px",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 700, color: hasErrors ? T.muted : T.green, textTransform: "uppercase" }}>
                Ready to Override
              </div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: hasErrors ? T.ink : T.green, marginTop: "4px" }}>
                {validCount}
                <span style={{ fontSize: "12px", fontWeight: 500, color: T.muted, marginLeft: "6px" }}>
                  cells ({affectedKpiNames.length} KPIs)
                </span>
              </div>
            </div>

            <div
              style={{
                background: hasErrors ? T.redBg : T.panel,
                border: `1px solid ${hasErrors ? T.redBorder : T.lineSoft}`,
                padding: "12px 14px",
                borderRadius: "10px",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 700, color: hasErrors ? T.red : T.muted, textTransform: "uppercase" }}>
                Blocking Errors
              </div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: hasErrors ? T.red : T.muted, marginTop: "4px" }}>
                {errors.length}
              </div>
            </div>

            <div
              style={{
                background: hasWarnings ? T.amberBg : T.panel,
                border: `1px solid ${hasWarnings ? T.amberBorder : T.lineSoft}`,
                padding: "12px 14px",
                borderRadius: "10px",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 700, color: hasWarnings ? T.amber : T.muted, textTransform: "uppercase" }}>
                Warnings
              </div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: hasWarnings ? T.amber : T.muted, marginTop: "4px" }}>
                {warnings.length}
              </div>
            </div>

            <div
              style={{
                background: hasInfo ? T.blueBg : T.panel,
                border: `1px solid ${hasInfo ? T.blueBorder : T.lineSoft}`,
                padding: "12px 14px",
                borderRadius: "10px",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 700, color: hasInfo ? T.blue : T.muted, textTransform: "uppercase" }}>
                Info & Skipped
              </div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: hasInfo ? T.blue : T.muted, marginTop: "4px" }}>
                {info.length}
              </div>
            </div>
          </div>

          {/* Fatal Errors Box */}
          {hasErrors && (
            <div
              style={{
                background: T.redBg,
                border: `1.5px solid ${T.redBorder}`,
                borderRadius: "10px",
                padding: "14px",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: T.red, fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>
                <XCircle size={17} />
                Validation Failed — Import Blocked
              </div>
              <div style={{ fontSize: "12.5px", color: T.ink, lineHeight: 1.5, marginBottom: "8px" }}>
                Please correct the following errors in your CSV file before uploading:
              </div>
              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "12px", color: T.red, lineHeight: 1.6 }}>
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings and Info Details Accordion */}
          {(hasWarnings || hasInfo) && (
            <div
              style={{
                border: `1px solid ${T.lineSoft}`,
                borderRadius: "10px",
                background: T.panel,
                padding: "10px 14px",
                marginBottom: "16px",
              }}
            >
              <button
                onClick={() => setExpandNotices((p) => !p)}
                style={{
                  background: "transparent",
                  border: "none",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: "inherit",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: T.accent }}>
                  <Info size={15} />
                  <span>
                    Notices & Skipped Items ({warnings.length + info.length})
                  </span>
                </div>
                {expandNotices ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {expandNotices && (
                <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${T.lineSoft}` }}>
                  {hasWarnings && (
                    <div style={{ marginBottom: "10px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: T.amber, marginBottom: "4px" }}>
                        Warnings:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: T.amber }}>
                        {warnings.map((w, i) => (
                          <li key={i} style={{ marginBottom: "2px" }}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {hasInfo && (
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: T.blue, marginBottom: "4px" }}>
                        Informational notices (calculated KPIs & auto-ignored columns):
                      </div>
                      <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: T.blue }}>
                        {info.map((inf, i) => (
                          <li key={i} style={{ marginBottom: "2px" }}>{inf}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Data Preview Table */}
          {updates.length > 0 && (
            <div style={{ border: `1px solid ${T.lineStrong}`, borderRadius: "10px", overflow: "hidden" }}>
              <div
                style={{
                  background: T.raised,
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: `1px solid ${T.lineSoft}`,
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: 700, color: T.accent }}>
                  Override Preview ({validCount} cells to replace)
                </span>
                <span style={{ fontSize: "11.5px", color: T.muted }}>
                  Blank cells preserved
                </span>
              </div>

              <div style={{ maxHeight: "240px", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ background: T.panel, borderBottom: `1px solid ${T.lineSoft}` }}>
                      <th style={{ padding: "8px 12px", textAlign: "left", color: T.muted, fontWeight: 600 }}>Row</th>
                      <th style={{ padding: "8px 12px", textAlign: "left", color: T.muted, fontWeight: 600 }}>KPI Name</th>
                      <th style={{ padding: "8px 12px", textAlign: "center", color: T.muted, fontWeight: 600 }}>Type</th>
                      <th style={{ padding: "8px 12px", textAlign: "left", color: T.muted, fontWeight: 600 }}>Period</th>
                      <th style={{ padding: "8px 12px", textAlign: "right", color: T.muted, fontWeight: 600 }}>New Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedUpdates.map((u, i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom: `1px solid ${T.lineSoft}`,
                          background: i % 2 === 0 ? T.bg : T.panel,
                        }}
                      >
                        <td style={{ padding: "7px 12px", color: T.muted }}>{u.rowIndex}</td>
                        <td style={{ padding: "7px 12px", fontWeight: 600, color: T.ink }}>{u.kpi.name}</td>
                        <td style={{ padding: "7px 12px", textAlign: "center" }}>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: "4px",
                              background: u.which === "budget" ? "#1e3a8a" : "#166534",
                              color: "#fff",
                              textTransform: "uppercase",
                            }}
                          >
                            {u.which}
                          </span>
                        </td>
                        <td style={{ padding: "7px 12px", color: T.body }}>{u.colLabel}</td>
                        <td style={{ padding: "7px 12px", textAlign: "right", fontWeight: 700, color: T.green }}>
                          {u.raw}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {updates.length > 15 && (
                <div style={{ padding: "8px 14px", background: T.panel, textAlign: "center", borderTop: `1px solid ${T.lineSoft}` }}>
                  <button
                    onClick={() => setShowAllRows((p) => !p)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: T.accent,
                      fontWeight: 600,
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    {showAllRows ? "Show fewer rows" : `Show all ${updates.length} rows`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 20px",
            background: T.panel,
            borderTop: `1px solid ${T.lineStrong}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            onClick={onClose}
            disabled={isApplying}
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              border: `1px solid ${T.lineStrong}`,
              background: T.bg,
              color: T.body,
              fontWeight: 600,
              fontSize: "13px",
              cursor: isApplying ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "11.5px", color: T.muted }}>
              Action: Completely overrides matched cells
            </span>
            <button
              onClick={() => onConfirm(updates)}
              disabled={hasErrors || validCount === 0 || isApplying}
              style={{
                padding: "8px 20px",
                borderRadius: "8px",
                border: "none",
                background: hasErrors || validCount === 0 ? T.lineStrong : T.green,
                color: "#fff",
                fontWeight: 700,
                fontSize: "13.5px",
                cursor: hasErrors || validCount === 0 || isApplying ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: hasErrors || validCount === 0 ? "none" : "0 2px 6px rgba(22,101,52,0.3)",
                opacity: isApplying ? 0.7 : 1,
              }}
            >
              <Upload size={14} />
              {isApplying ? "Applying Override…" : `Apply Override (${validCount} cells)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CsvUploadModal;
