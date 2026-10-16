// src/smses/MyGrowthTools/shared/AiDataGenModal.js
import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  X,
  Building2,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Zap,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  SCENARIOS,
  extractProfileContext,
  getBaseEditableKpis,
  generateRealisticKpiData,
} from "./aiDataGenUtils";

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

const AiDataGenModal = ({
  isOpen,
  onClose,
  profileData,
  tabName = "Section",
  tabs = [],
  activeSection = "monthly",
  activeKpiRows = [],
  periods = [],
  onApplyData,
  isApplying = false,
}) => {
  const [selectedScenario, setSelectedScenario] = useState("healthy");
  const [scopeMode, setScopeMode] = useState("current"); // "current" | "all_kpis"
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [customRevenue, setCustomRevenue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState(null);
  const [genResult, setGenResult] = useState(null);
  const [showAllRows, setShowAllRows] = useState(false);

  const profileContext = extractProfileContext(profileData);

  // Available unique categories in this section
  const availableCategories = useMemo(() => {
    const set = new Set();
    activeKpiRows.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return ["all", ...Array.from(set)];
  }, [activeKpiRows]);

  // Base rows across ALL core KPI tabs (Profit & Costs, Cash & Liquidity, Financial Strength)
  const allCoreKpiRows = useMemo(() => {
    const list = [];
    (tabs || []).forEach((t) => {
      if (t.custom === "balanceSheet" || t.custom === "equity") return;
      (t.categories || []).forEach((cat) => {
        if (cat.custom === "loans") return;
        (cat.kpis || []).forEach((k) => {
          if (!k.field && !k.custom) return;
          list.push({ kpi: k, category: `${t.name} • ${cat.name}` });
        });
      });
    });
    return list;
  }, [tabs]);

  // Target rows based on scope mode
  const targetKpiRows = useMemo(() => {
    if (scopeMode === "all_kpis") return allCoreKpiRows;
    if (selectedCategory === "all") return activeKpiRows;
    return activeKpiRows.filter((r) => r.category === selectedCategory);
  }, [scopeMode, allCoreKpiRows, activeKpiRows, selectedCategory]);

  const editableKpis = useMemo(() => {
    return getBaseEditableKpis(targetKpiRows);
  }, [targetKpiRows]);

  useEffect(() => {
    if (isOpen) {
      setGenError(null);
      setGenResult(null);
      setScopeMode("current");
      setSelectedCategory("all");
      if (profileContext?.recommendedScenario) {
        setSelectedScenario(profileContext.recommendedScenario);
      }
      if (profileContext?.anchorMonthlyRevenue) {
        setCustomRevenue(String(profileContext.anchorMonthlyRevenue));
      }
    }
  }, [isOpen, profileData]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenError(null);
    try {
      const revenueNum = Number(customRevenue.replace(/[^0-9.]/g, "")) || profileContext.anchorMonthlyRevenue;
      const res = await generateRealisticKpiData({
        profileData,
        tabName: scopeMode === "all_kpis" ? "All Financial Sections (Profit & Costs, Cash & Liquidity, Financial Strength)" : tabName,
        categoryName: scopeMode === "all_kpis" ? "All Financial Categories" : (selectedCategory === "all" ? "All Categories" : selectedCategory),
        activeSection,
        activeKpiRows: editableKpis,
        periods,
        scenarioId: selectedScenario,
        customMonthlyRevenue: revenueNum,
      });
      setGenResult(res);
    } catch (err) {
      console.error(err);
      setGenError(err.message || "Failed to generate KPI figures.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirm = () => {
    if (!genResult?.updates?.length || !onApplyData) return;
    onApplyData(genResult.updates);
  };

  const displayedUpdates = genResult?.updates
    ? showAllRows
      ? genResult.updates
      : genResult.updates.slice(0, 16)
    : [];

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
    >
      <div
        style={{
          background: T.bg,
          borderRadius: "16px",
          width: "100%",
          maxWidth: "860px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 45px rgba(36, 24, 19, 0.35)",
          border: `1px solid ${T.lineStrong}`,
          overflow: "hidden",
          fontFamily: "inherit",
          color: T.body,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${T.lineSoft}`,
            background: T.panel,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: `linear-gradient(135deg, ${T.accent}, ${T.accentSoft})`,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 6px rgba(74, 53, 47, 0.25)",
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    fontWeight: 700,
                    color: T.header,
                    letterSpacing: "-0.01em",
                  }}
                >
                  AI Realistic KPI Data Generator
                </h3>
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    background: T.amberBg,
                    color: T.amber,
                    border: `1px solid ${T.amberBorder}`,
                  }}
                >
                  Demo / Test Mode
                </span>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: T.muted }}>
                Synthesizes realistic SME figures conditioned on industry, company scale, and business scenario.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: T.muted,
              cursor: "pointer",
              padding: "6px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {/* Company Profile Context Card */}
          <div
            style={{
              padding: "16px 20px",
              borderRadius: "12px",
              background: profileContext.isDerivedFromProfile ? T.accentTint : T.panel,
              border: `1px solid ${profileContext.isDerivedFromProfile ? T.lineStrong : T.line}`,
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Building2 size={16} color={T.accent} />
                <span style={{ fontSize: "12.5px", fontWeight: 700, textTransform: "uppercase", color: T.accent, letterSpacing: "0.04em" }}>
                  Active SME Profile Context
                </span>
              </div>
              {profileContext.isDerivedFromProfile ? (
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: "999px",
                    background: T.greenBg,
                    color: T.green,
                    border: `1px solid ${T.greenBorder}`,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <CheckCircle2 size={12} /> Derived from Universal Profile
                </span>
              ) : (
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: "999px",
                    background: T.amberBg,
                    color: T.amber,
                    border: `1px solid ${T.amberBorder}`,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <AlertCircle size={12} /> Default Benchmarks (Profile not yet filled)
                </span>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", fontSize: "12.5px" }}>
              <div>
                <span style={{ color: T.muted, fontSize: "11px", display: "block" }}>Enterprise</span>
                <strong style={{ color: T.ink, fontSize: "13px" }}>{profileContext.companyName}</strong>
                {profileContext.tradingName && (
                  <div style={{ fontSize: "11px", color: T.accent, fontStyle: "italic", marginTop: "1px" }}>
                    Trading as: {profileContext.tradingName}
                  </div>
                )}
              </div>
              <div>
                <span style={{ color: T.muted, fontSize: "11px", display: "block" }}>Sector / Economic Industries</span>
                <strong style={{ color: T.ink }}>{profileContext.industry}</strong>
              </div>
              <div>
                <span style={{ color: T.muted, fontSize: "11px", display: "block" }}>Entity Size & Scale</span>
                <strong style={{ color: T.ink }}>{profileContext.turnoverRange}</strong>
              </div>
              <div>
                <span style={{ color: T.muted, fontSize: "11px", display: "block" }}>Stage & Workforce</span>
                <strong style={{ color: T.ink }}>
                  {profileContext.operationStage} stage • {profileContext.businessAge}
                </strong>
                <div style={{ fontSize: "11px", color: T.muted }}>{profileContext.employeeCount}</div>
              </div>
            </div>

            {profileContext.offerings && (
              <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: `1px dashed ${T.line}`, fontSize: "12px" }}>
                <span style={{ color: T.muted, fontWeight: 600 }}>Core Offerings: </span>
                <span style={{ color: T.ink, fontWeight: 500 }}>{profileContext.offerings}</span>
              </div>
            )}

            {profileContext.description && !profileContext.offerings && (
              <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: `1px dashed ${T.line}`, fontSize: "11.5px", color: T.muted, fontStyle: "italic" }}>
                "{profileContext.description.slice(0, 140)}{profileContext.description.length > 140 ? "..." : ""}"
              </div>
            )}
          </div>

          {/* Scenario Selection */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: T.ink, marginBottom: "8px" }}>
              Select Business Trajectory Scenario
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "10px" }}>
              {SCENARIOS.map((sc) => {
                const isSelected = selectedScenario === sc.id;
                return (
                  <div
                    key={sc.id}
                    onClick={() => setSelectedScenario(sc.id)}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "10px",
                      cursor: "pointer",
                      border: isSelected ? `2px solid ${T.accent}` : `1px solid ${T.line}`,
                      background: isSelected ? T.panel : T.bg,
                      boxShadow: isSelected ? "0 2px 8px rgba(74,53,47,0.12)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <strong style={{ fontSize: "13px", color: isSelected ? T.accent : T.ink }}>{sc.name}</strong>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: "4px",
                          background: isSelected ? T.accent : T.raised,
                          color: isSelected ? "#fff" : T.muted,
                        }}
                      >
                        {sc.badge}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "11.5px", color: T.muted, lineHeight: 1.4 }}>
                      {sc.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Module / Scope Selection Tabs */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: T.ink, marginBottom: "8px" }}>
              Financial Module Scope
            </label>
            <div
              style={{
                display: "inline-flex",
                background: T.raised,
                padding: "3px",
                borderRadius: "10px",
                gap: "4px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => setScopeMode("current")}
                style={{
                  padding: "7px 14px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  background: scopeMode === "current" ? T.bg : "transparent",
                  color: scopeMode === "current" ? T.accent : T.muted,
                  boxShadow: scopeMode === "current" ? "0 1px 3px rgba(45,32,28,0.12)" : "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>Current Section: {tabName}</span>
                <span
                  style={{
                    fontSize: "10.5px",
                    padding: "1px 6px",
                    borderRadius: "999px",
                    background: scopeMode === "current" ? T.accentTint : T.panel,
                    color: scopeMode === "current" ? T.accent : T.muted,
                    fontWeight: 700,
                  }}
                >
                  {getBaseEditableKpis(activeKpiRows).length} KPIs
                </span>
              </button>

              <button
                type="button"
                onClick={() => setScopeMode("all_kpis")}
                style={{
                  padding: "7px 14px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  background: scopeMode === "all_kpis" ? T.bg : "transparent",
                  color: scopeMode === "all_kpis" ? T.accent : T.muted,
                  boxShadow: scopeMode === "all_kpis" ? "0 1px 3px rgba(45,32,28,0.12)" : "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>All Core Sections (P&L, Cash Flow, Strength)</span>
                <span
                  style={{
                    fontSize: "10.5px",
                    padding: "1px 6px",
                    borderRadius: "999px",
                    background: scopeMode === "all_kpis" ? T.accentTint : T.panel,
                    color: scopeMode === "all_kpis" ? T.accent : T.muted,
                    fontWeight: 700,
                  }}
                >
                  {getBaseEditableKpis(allCoreKpiRows).length} KPIs
                </span>
              </button>
            </div>
          </div>

          {/* Target Parameters */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "14px",
              padding: "14px",
              background: T.panel,
              borderRadius: "10px",
              border: `1px solid ${T.lineSoft}`,
              marginBottom: "20px",
            }}
          >
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: T.ink, marginBottom: "4px" }}>
                Target Monthly Revenue Anchor (ZAR)
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "10px", top: "8px", fontSize: "13px", color: T.muted, fontWeight: 600 }}>
                  R
                </span>
                <input
                  type="text"
                  value={customRevenue}
                  onChange={(e) => setCustomRevenue(e.target.value)}
                  placeholder="e.g. 250000"
                  style={{
                    width: "100%",
                    padding: "7px 10px 7px 28px",
                    borderRadius: "6px",
                    border: `1px solid ${T.lineStrong}`,
                    fontSize: "13px",
                    fontFamily: "inherit",
                    fontWeight: 600,
                    color: T.ink,
                  }}
                />
              </div>
              <span style={{ fontSize: "11px", color: T.muted }}>
                Auto-derived from profile turnover bracket.
              </span>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: T.ink, marginBottom: "4px" }}>
                {scopeMode === "all_kpis" ? "Module Scope" : `Category Filter (${tabName})`}
              </label>
              {scopeMode === "all_kpis" ? (
                <div style={{ height: "34px", display: "flex", alignItems: "center", fontSize: "12.5px", fontWeight: 600, color: T.accent }}>
                  All Sections (P&L • Cash & Liquidity • Strength)
                </div>
              ) : (
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: "6px",
                    border: `1px solid ${T.lineStrong}`,
                    fontSize: "12.5px",
                    fontFamily: "inherit",
                    fontWeight: 600,
                    color: T.ink,
                    background: T.bg,
                    cursor: "pointer",
                  }}
                >
                  <option value="all">All Categories ({tabName})</option>
                  {availableCategories
                    .filter((c) => c !== "all")
                    .map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                </select>
              )}
              <span style={{ fontSize: "11px", color: T.muted }}>
                {scopeMode === "all_kpis"
                  ? "Generates an interconnected model across all three core modules."
                  : "Isolate an individual category or generate across the section."}
              </span>
            </div>

            <div>
              <span style={{ display: "block", fontSize: "12px", fontWeight: 600, color: T.ink, marginBottom: "4px" }}>
                Target Metrics
              </span>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", height: "34px", fontSize: "12.5px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", color: T.body }}>
                  <Layers size={14} color={T.accent} />
                  <span><strong>{editableKpis.length}</strong> input KPIs</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", color: T.body }}>
                  <Calendar size={14} color={T.accent} />
                  <span><strong>{periods.length}</strong> periods ({activeSection})</span>
                </div>
              </div>
              <span style={{ fontSize: "11px", color: T.muted }}>
                Auto-calculated formulas (EBITDA, etc.) excluded.
              </span>
            </div>
          </div>

          {/* Error Banner */}
          {genError && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "12px 14px",
                borderRadius: "8px",
                background: T.redBg,
                border: `1px solid ${T.redBorder}`,
                color: T.red,
                fontSize: "12.5px",
                marginBottom: "16px",
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong>Generation Error:</strong> {genError}
              </div>
            </div>
          )}

          {/* Action Button: Generate */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: genResult ? "20px" : "0" }}>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || isApplying || !editableKpis.length}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                background: isGenerating ? T.muted : `linear-gradient(135deg, ${T.accent}, ${T.accentSoft})`,
                color: "#fff",
                fontSize: "13.5px",
                fontWeight: 600,
                cursor: isGenerating ? "wait" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 2px 6px rgba(74, 53, 47, 0.25)",
              }}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={15} className="spin" style={{ animation: "spin 1s linear infinite" }} />
                  Synthesizing Accounting Figures...
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  {genResult ? "Regenerate Figures" : "Generate Realistic Data"}
                </>
              )}
            </button>
          </div>

          {/* Preview Grid if Generated */}
          {genResult && (
            <div
              style={{
                borderRadius: "12px",
                border: `1px solid ${T.line}`,
                overflow: "hidden",
                marginTop: "16px",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  background: T.greenBg,
                  borderBottom: `1px solid ${T.greenBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: T.green }}>
                  <CheckCircle2 size={16} />
                  <strong style={{ fontSize: "13px" }}>
                    Successfully Generated {genResult.validCount} Values for {editableKpis.length} KPIs
                  </strong>
                </div>
                <span style={{ fontSize: "12px", color: T.green, fontWeight: 600 }}>
                  Ready to Override
                </span>
              </div>

              {/* Preview Table */}
              <div style={{ maxHeight: "240px", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: T.panel, borderBottom: `1px solid ${T.lineSoft}`, color: T.muted }}>
                      <th style={{ padding: "8px 12px" }}>KPI Name</th>
                      <th style={{ padding: "8px 12px" }}>Type</th>
                      <th style={{ padding: "8px 12px" }}>Period</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Generated Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedUpdates.map((u, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.lineSoft}` }}>
                        <td style={{ padding: "8px 12px", fontWeight: 600, color: T.ink }}>{u.kpi.name}</td>
                        <td style={{ padding: "8px 12px" }}>
                          <span
                            style={{
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "10px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              background: u.which === "budget" ? T.blueBg : T.amberBg,
                              color: u.which === "budget" ? T.blue : T.amber,
                            }}
                          >
                            {u.which}
                          </span>
                        </td>
                        <td style={{ padding: "8px 12px", color: T.muted }}>{u.periodKey}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: T.ink }}>
                          {Number(u.value).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {genResult.updates.length > 16 && (
                <div style={{ padding: "6px 12px", textAlign: "center", background: T.panel, borderTop: `1px solid ${T.lineSoft}` }}>
                  <button
                    onClick={() => setShowAllRows(!showAllRows)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: T.accent,
                      fontSize: "11.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {showAllRows ? (
                      <>Show Less <ChevronUp size={13} /></>
                    ) : (
                      <>Show All {genResult.updates.length} Generated Values <ChevronDown size={13} /></>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: `1px solid ${T.lineSoft}`,
            background: T.panel,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "12px", color: T.muted }}>
            Populates live draft and updates Firestore in test mode.
          </span>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={onClose}
              disabled={isApplying}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: `1px solid ${T.lineStrong}`,
                background: T.bg,
                color: T.body,
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!genResult?.updates?.length || isApplying}
              style={{
                padding: "8px 20px",
                borderRadius: "8px",
                border: "none",
                background: !genResult?.updates?.length || isApplying ? T.lineStrong : T.green,
                color: "#fff",
                fontSize: "13px",
                fontWeight: 700,
                cursor: !genResult?.updates?.length || isApplying ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: genResult?.updates?.length ? "0 2px 6px rgba(22, 101, 52, 0.25)" : "none",
              }}
            >
              {isApplying ? (
                <>
                  <RefreshCw size={14} className="spin" style={{ animation: "spin 1s linear infinite" }} />
                  Saving Figures...
                </>
              ) : (
                <>
                  <Zap size={14} />
                  Apply to Table & Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiDataGenModal;
