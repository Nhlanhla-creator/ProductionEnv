"use client"

import React, { useState } from "react"
import {
  Users,
  Award,
  ArrowLeft,
  Plus,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Calendar,
  DollarSign,
  User,
  Wrench,
  Trash2,
  FileSpreadsheet,
} from "lucide-react"

const STAGES = [
  "Matched",
  "Introduced",
  "Tendered",
  "Portal Submission",
  "Buyer Registration",
  "Awarded",
]

const NO_PROGRESSION_REASONS = [
  "Failed Technical / Quality Gate",
  "Commercial / Pricing Disparity",
  "Insufficient Capacity for SLA",
  "Statutory Compliance Invalidation",
  "Supplier Withdrew Interest",
  "Procurement Re-scoped or Cancelled",
]

export default function CohortDetailView({
  cohort,
  onBack,
  onOpenAddMember,
  onOpenAddIntervention,
  onUpdateInterventionStatus,
  onUpdateMemberStage,
  onRemoveMember,
  onSelectSupplier,
}) {
  const [activeTab, setActiveTab] = useState("members") // members | interventions | progression
  const [interventionStatusFilter, setInterventionStatusFilter] = useState("all")
  const [selectedMemberFilter, setSelectedMemberFilter] = useState("all")
  const [noProgressionModal, setNoProgressionModal] = useState({ isOpen: false, supplierId: null, supplierName: "" })
  const [noProgressionReason, setNoProgressionReason] = useState(NO_PROGRESSION_REASONS[0])

  if (!cohort) return null

  const members = cohort.members || []

  // Metrics computation
  const totalMembers = members.length
  const avgBaseline = totalMembers > 0
    ? Math.round(members.reduce((acc, m) => acc + (m.baselineScore || 0), 0) / totalMembers)
    : 0
  const avgCurrent = totalMembers > 0
    ? Math.round(members.reduce((acc, m) => acc + (m.currentScore || 0), 0) / totalMembers)
    : 0
  const avgDelta = avgCurrent - avgBaseline

  const allInterventions = members.flatMap((m) =>
    (m.interventions || []).map((it) => ({
      ...it,
      supplierId: m.supplierId,
      supplierName: m.supplierName,
      supplierCategory: m.category,
    }))
  )

  const activeInterventionsCount = allInterventions.filter((it) => it.status === "In Progress").length
  const completedInterventionsCount = allInterventions.filter((it) => it.status === "Completed").length

  const awardedCount = members.filter((m) => m.commercialStage === "Awarded").length
  const tenderedOrPortalCount = members.filter((m) => ["Tendered", "Portal Submission", "Buyer Registration"].includes(m.commercialStage)).length

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      "Supplier Name",
      "Category",
      "Location",
      "Cohort Name",
      "Baseline Score",
      "Current Score",
      "Score Delta",
      "Baseline Coverage %",
      "Current Coverage %",
      "Primary 5C Constraint",
      "Active Intervention",
      "Commercial Stage",
      "No Progression Reason",
      "Entry Date",
    ]

    const rows = members.map((m) => [
      `"${m.supplierName || ""}"`,
      `"${m.category || ""}"`,
      `"${m.location || ""}"`,
      `"${cohort.name || ""}"`,
      m.baselineScore ?? "",
      m.currentScore ?? "",
      (m.currentScore || 0) - (m.baselineScore || 0),
      m.baselineCoverage ?? "",
      m.currentCoverage ?? "",
      `"${m.primaryConstraint || ""}"`,
      `"${m.activeIntervention || ""}"`,
      `"${m.commercialStage || "Matched"}"`,
      `"${m.noProgressionReason || ""}"`,
      m.entryDate || "",
    ])

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${cohort.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_progression_report.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Handle stage change
  const handleStageSelect = (supplierId, newStage, supplierName) => {
    if (newStage === "No Progression") {
      setNoProgressionModal({ isOpen: true, supplierId, supplierName })
    } else {
      onUpdateMemberStage(cohort.id, supplierId, newStage)
    }
  }

  const handleConfirmNoProgression = () => {
    if (noProgressionModal.supplierId) {
      onUpdateMemberStage(cohort.id, noProgressionModal.supplierId, "No Progression", noProgressionReason)
      setNoProgressionModal({ isOpen: false, supplierId: null, supplierName: "" })
    }
  }

  // Filtered interventions
  const filteredInterventions = allInterventions.filter((it) => {
    if (interventionStatusFilter !== "all" && it.status !== interventionStatusFilter) return false
    if (selectedMemberFilter !== "all" && it.supplierId !== selectedMemberFilter) return false
    return true
  })

  return (
    <div style={{ padding: "24px 32px", maxWidth: "1400px", margin: "0 auto", boxSizing: "border-box" }}>
      {/* Top Navigation & Breadcrumb */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            color: "#6D4C41",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: 600,
            padding: 0,
          }}
        >
          <ArrowLeft size={16} /> All ESD Cohorts
        </button>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleExportCSV}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              background: "#FFFFFF",
              border: "1px solid #C8B6A6",
              borderRadius: "6px",
              color: "#4A352F",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <FileSpreadsheet size={15} color="#2E7D32" /> Export CSV
          </button>

          <button
            onClick={onOpenAddMember}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 16px",
              background: "#4A352F",
              border: "none",
              borderRadius: "6px",
              color: "#FAF7F2",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Plus size={15} /> Enroll Supplier
          </button>
        </div>
      </div>

      {/* Cohort Header Banner */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E6D7C3",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ flex: "1 1 500px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span
                style={{
                  background: cohort.status === "Active" ? "rgba(46, 125, 50, 0.12)" : "#ECEFF1",
                  color: cohort.status === "Active" ? "#2E7D32" : "#546E7A",
                  padding: "3px 10px",
                  borderRadius: "12px",
                  fontSize: "0.725rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                {cohort.status}
              </span>
              <span style={{ fontSize: "0.8rem", color: "#8D6E63", fontWeight: 500 }}>
                {cohort.startDate} → {cohort.endDate}
              </span>
            </div>

            <h1 style={{ fontSize: "1.45rem", fontWeight: 700, color: "#4A352F", margin: "0 0 8px 0" }}>
              {cohort.name}
            </h1>

            <p style={{ fontSize: "0.85rem", color: "#5D4037", margin: "0 0 16px 0", lineHeight: "1.45" }}>
              {cohort.objective}
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "18px", fontSize: "0.775rem", color: "#6D4C41" }}>
              <div>
                <strong>Sponsor:</strong> {cohort.sponsor}
              </div>
              <div>
                <strong>Budget Envelope:</strong> <span style={{ color: "#2E7D32", fontWeight: 700 }}>{cohort.budgetEnvelope}</span>
              </div>
              <div>
                <strong>Lead Owner:</strong> {cohort.owner}
              </div>
              <div>
                <strong>Target Sites:</strong> {cohort.sites?.join(", ") || "National"}
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div
              style={{
                background: "#FAF7F2",
                border: "1px solid #E8D5C4",
                borderRadius: "8px",
                padding: "12px 18px",
                minWidth: "120px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.725rem", color: "#8D6E63", fontWeight: 600 }}>Enrolled SMMEs</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#4A352F", marginTop: "2px" }}>
                {totalMembers}
              </div>
            </div>

            <div
              style={{
                background: "#FAF7F2",
                border: "1px solid #E8D5C4",
                borderRadius: "8px",
                padding: "12px 18px",
                minWidth: "130px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.725rem", color: "#8D6E63", fontWeight: 600 }}>Avg Score Delta</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "2px" }}>
                <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#4A352F" }}>{avgCurrent}</span>
                {avgDelta > 0 && (
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#2E7D32" }}>
                    (+{avgDelta})
                  </span>
                )}
              </div>
              <div style={{ fontSize: "0.68rem", color: "#8D6E63" }}>Baseline: {avgBaseline}/100</div>
            </div>

            <div
              style={{
                background: "#FAF7F2",
                border: "1px solid #E8D5C4",
                borderRadius: "8px",
                padding: "12px 18px",
                minWidth: "120px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.725rem", color: "#8D6E63", fontWeight: 600 }}>Active Interventions</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#D4AF37", marginTop: "2px" }}>
                {activeInterventionsCount}
              </div>
              <div style={{ fontSize: "0.68rem", color: "#2E7D32" }}>{completedInterventionsCount} Closed</div>
            </div>

            <div
              style={{
                background: "#FAF7F2",
                border: "1px solid #E8D5C4",
                borderRadius: "8px",
                padding: "12px 18px",
                minWidth: "120px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.725rem", color: "#8D6E63", fontWeight: 600 }}>Contracts / Awards</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#2E7D32", marginTop: "2px" }}>
                {awardedCount}
              </div>
              <div style={{ fontSize: "0.68rem", color: "#6D4C41" }}>{tenderedOrPortalCount} in Tender/Portal</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: "24px", borderBottom: "1px solid #E8D5C4", marginTop: "24px" }}>
          <button
            onClick={() => setActiveTab("members")}
            style={{
              padding: "10px 4px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "members" ? "3px solid #4A352F" : "3px solid transparent",
              color: activeTab === "members" ? "#4A352F" : "#8D6E63",
              fontWeight: activeTab === "members" ? 700 : 500,
              fontSize: "0.875rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Users size={16} /> Members & 5C Baselines ({members.length})
          </button>

          <button
            onClick={() => setActiveTab("interventions")}
            style={{
              padding: "10px 4px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "interventions" ? "3px solid #4A352F" : "3px solid transparent",
              color: activeTab === "interventions" ? "#4A352F" : "#8D6E63",
              fontWeight: activeTab === "interventions" ? 700 : 500,
              fontSize: "0.875rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Wrench size={16} /> Intervention Action Tracker ({allInterventions.length})
          </button>

          <button
            onClick={() => setActiveTab("progression")}
            style={{
              padding: "10px 4px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "progression" ? "3px solid #4A352F" : "3px solid transparent",
              color: activeTab === "progression" ? "#4A352F" : "#8D6E63",
              fontWeight: activeTab === "progression" ? 700 : 500,
              fontSize: "0.875rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <TrendingUp size={16} /> Commercial Progression & Pipeline
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: MEMBERS & 5C BASELINES */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "members" && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E6D7C3",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          {members.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <Users size={40} color="#C8B6A6" style={{ margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: "1.05rem", color: "#4A352F", margin: "0 0 6px" }}>
                No SMMEs Enrolled Yet
              </h3>
              <p style={{ fontSize: "0.825rem", color: "#8D6E63", margin: "0 0 16px" }}>
                Enroll qualified suppliers from the Matched Suppliers pool into this cohort to begin developmental tracking.
              </p>
              <button
                onClick={onOpenAddMember}
                style={{
                  padding: "8px 18px",
                  background: "#4A352F",
                  border: "none",
                  borderRadius: "6px",
                  color: "#FAF7F2",
                  fontSize: "0.825rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                + Enroll First Supplier
              </button>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#F5EFEB", borderBottom: "1px solid #E6D7C3" }}>
                    <th style={{ padding: "12px 16px", fontSize: "0.75rem", fontWeight: 700, color: "#4A352F" }}>
                      Supplier & Category
                    </th>
                    <th style={{ padding: "12px 16px", fontSize: "0.75rem", fontWeight: 700, color: "#4A352F" }}>
                      Location
                    </th>
                    <th style={{ padding: "12px 16px", fontSize: "0.75rem", fontWeight: 700, color: "#4A352F" }}>
                      Primary 5C Bottleneck
                    </th>
                    <th style={{ padding: "12px 16px", fontSize: "0.75rem", fontWeight: 700, color: "#4A352F", textAlign: "center" }}>
                      Baseline Score
                    </th>
                    <th style={{ padding: "12px 16px", fontSize: "0.75rem", fontWeight: 700, color: "#4A352F", textAlign: "center" }}>
                      Current BIG Score
                    </th>
                    <th style={{ padding: "12px 16px", fontSize: "0.75rem", fontWeight: 700, color: "#4A352F" }}>
                      Active Intervention
                    </th>
                    <th style={{ padding: "12px 16px", fontSize: "0.75rem", fontWeight: 700, color: "#4A352F" }}>
                      Commercial Stage
                    </th>
                    <th style={{ padding: "12px 16px", fontSize: "0.75rem", fontWeight: 700, color: "#4A352F", textAlign: "right" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => {
                    const delta = (m.currentScore || 0) - (m.baselineScore || 0)
                    return (
                      <tr
                        key={m.supplierId}
                        style={{ borderBottom: "1px solid #F0E6DD", transition: "background 0.15s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAF7F2")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <td style={{ padding: "14px 16px" }}>
                          <button
                            onClick={() => onSelectSupplier?.(m)}
                            style={{
                              background: "none",
                              border: "none",
                              padding: 0,
                              textAlign: "left",
                              cursor: "pointer",
                              color: "#4A352F",
                              fontWeight: 700,
                              fontSize: "0.85rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            {m.supplierName} <ExternalLink size={12} color="#8D6E63" />
                          </button>
                          <div style={{ fontSize: "0.75rem", color: "#8D6E63", marginTop: "2px" }}>
                            {m.category}
                          </div>
                        </td>

                        <td style={{ padding: "14px 16px", fontSize: "0.8rem", color: "#5D4037" }}>
                          {m.location}
                        </td>

                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              background: "rgba(141, 110, 99, 0.1)",
                              color: "#5D4037",
                              border: "1px solid #D7CCC8",
                            }}
                          >
                            {m.primaryConstraint}
                          </span>
                        </td>

                        <td style={{ padding: "14px 16px", textAlign: "center" }}>
                          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#6D4C41" }}>
                            {m.baselineScore} / 100
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "#8D6E63" }}>
                            {m.baselineCoverage}% cov
                          </div>
                        </td>

                        <td style={{ padding: "14px 16px", textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                            <span style={{ fontSize: "0.925rem", fontWeight: 800, color: "#4A352F" }}>
                              {m.currentScore} / 100
                            </span>
                            {delta > 0 && (
                              <span
                                style={{
                                  background: "rgba(46, 125, 50, 0.1)",
                                  color: "#2E7D32",
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                  padding: "2px 6px",
                                  borderRadius: "10px",
                                }}
                              >
                                +{delta}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "#2E7D32" }}>
                            {m.currentCoverage}% cov
                          </div>
                        </td>

                        <td style={{ padding: "14px 16px", maxWidth: "240px" }}>
                          <div style={{ fontSize: "0.8rem", color: "#4A352F", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {m.activeIntervention}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "#8D6E63", marginTop: "2px" }}>
                            {(m.interventions || []).length} intervention(s) tracked
                          </div>
                        </td>

                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "3px 8px",
                              borderRadius: "12px",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              background:
                                m.commercialStage === "Awarded"
                                  ? "rgba(46, 125, 50, 0.12)"
                                  : m.commercialStage === "No Progression"
                                  ? "rgba(198, 40, 40, 0.1)"
                                  : "rgba(74, 53, 47, 0.08)",
                              color:
                                m.commercialStage === "Awarded"
                                  ? "#2E7D32"
                                  : m.commercialStage === "No Progression"
                                  ? "#C62828"
                                  : "#4A352F",
                            }}
                          >
                            {m.commercialStage || "Matched"}
                          </span>
                        </td>

                        <td style={{ padding: "14px 16px", textAlign: "right" }}>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                            <button
                              onClick={() => onOpenAddIntervention?.(m)}
                              title="Assign New Intervention"
                              style={{
                                padding: "5px 9px",
                                background: "#FAF7F2",
                                border: "1px solid #C8B6A6",
                                borderRadius: "4px",
                                color: "#4A352F",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <Plus size={13} /> Intervention
                            </button>

                            <button
                              onClick={() => onRemoveMember?.(cohort.id, m.supplierId)}
                              title="Remove from cohort"
                              style={{
                                padding: "5px 7px",
                                background: "none",
                                border: "1px solid transparent",
                                borderRadius: "4px",
                                color: "#A1887F",
                                cursor: "pointer",
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: INTERVENTION ACTION TRACKER */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "interventions" && (
        <div>
          {/* Tracker Filters */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={{ fontSize: "0.8rem", color: "#6D4C41", fontWeight: 600 }}>Filter by:</div>

              {/* Status Filter */}
              <select
                value={interventionStatusFilter}
                onChange={(e) => setInterventionStatusFilter(e.target.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #C8B6A6",
                  fontSize: "0.8rem",
                  color: "#4A352F",
                  background: "#FFFFFF",
                }}
              >
                <option value="all">All Statuses ({allInterventions.length})</option>
                <option value="In Progress">In Progress ({allInterventions.filter((i) => i.status === "In Progress").length})</option>
                <option value="Completed">Completed ({allInterventions.filter((i) => i.status === "Completed").length})</option>
                <option value="Planned">Planned ({allInterventions.filter((i) => i.status === "Planned").length})</option>
              </select>

              {/* Supplier Filter */}
              <select
                value={selectedMemberFilter}
                onChange={(e) => setSelectedMemberFilter(e.target.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #C8B6A6",
                  fontSize: "0.8rem",
                  color: "#4A352F",
                  background: "#FFFFFF",
                }}
              >
                <option value="all">All SMMEs</option>
                {members.map((m) => (
                  <option key={m.supplierId} value={m.supplierId}>{m.supplierName}</option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: "0.775rem", color: "#8D6E63" }}>
              Showing {filteredInterventions.length} of {allInterventions.length} interventions
            </div>
          </div>

          {filteredInterventions.length === 0 ? (
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E6D7C3",
                borderRadius: "12px",
                padding: "48px 20px",
                textAlign: "center",
              }}
            >
              <Wrench size={36} color="#C8B6A6" style={{ margin: "0 auto 12px" }} />
              <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#4A352F" }}>
                No Interventions Found
              </div>
              <div style={{ fontSize: "0.8rem", color: "#8D6E63", marginTop: "4px" }}>
                Assign development interventions to enrolled members to monitor gap closure and readiness.
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {filteredInterventions.map((it) => (
                <div
                  key={it.id}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E6D7C3",
                    borderRadius: "10px",
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "20px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                  }}
                >
                  <div style={{ flex: "1 1 500px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "12px",
                          textTransform: "uppercase",
                          background:
                            it.status === "Completed"
                              ? "rgba(46, 125, 50, 0.12)"
                              : it.status === "In Progress"
                              ? "rgba(212, 175, 55, 0.2)"
                              : "rgba(141, 110, 99, 0.1)",
                          color:
                            it.status === "Completed"
                              ? "#2E7D32"
                              : it.status === "In Progress"
                              ? "#8D6E63"
                              : "#5D4037",
                        }}
                      >
                        {it.status}
                      </span>

                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#4A352F" }}>
                        {it.supplierName}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#8D6E63" }}>
                        ({it.supplierCategory})
                      </span>
                    </div>

                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#4A352F", marginBottom: "4px" }}>
                      {it.intervention}
                    </div>

                    <div style={{ fontSize: "0.8rem", color: "#5D4037", marginBottom: "8px" }}>
                      <strong>Identified Gap:</strong> {it.gap}
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", fontSize: "0.75rem", color: "#6D4C41" }}>
                      <div>
                        <strong>Provider:</strong> {it.provider}
                      </div>
                      <div>
                        <strong>Owner:</strong> {it.owner}
                      </div>
                      <div>
                        <strong>Target Due Date:</strong> {it.dueDate}
                      </div>
                      <div>
                        <strong>Funding:</strong> {it.fundingSource}
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: "8px",
                        background: "#FFF8F0",
                        border: "1px dashed #E8D5C4",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "0.75rem",
                        color: "#4A352F",
                      }}
                    >
                      <strong>Evidence Required for Sign-Off:</strong> {it.evidenceRequired}
                    </div>
                  </div>

                  {/* Quick Action Button */}
                  <div style={{ textAlign: "right", minWidth: "140px" }}>
                    {it.status === "Completed" ? (
                      <button
                        onClick={() => onUpdateInterventionStatus(cohort.id, it.supplierId, it.id, "In Progress")}
                        style={{
                          padding: "6px 12px",
                          background: "#FFFFFF",
                          border: "1px solid #C8B6A6",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          color: "#6D4C41",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Reopen Intervention
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpdateInterventionStatus(cohort.id, it.supplierId, it.id, "Completed")}
                        style={{
                          padding: "6px 14px",
                          background: "#2E7D32",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          color: "#FAF7F2",
                          cursor: "pointer",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          justifyContent: "center",
                        }}
                      >
                        <CheckCircle2 size={14} /> Mark Completed
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: COMMERCIAL PROGRESSION & PIPELINE */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "progression" && (
        <div style={{ display: "grid", gap: "16px" }}>
          {/* Stage funnel overview */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E6D7C3",
              borderRadius: "12px",
              padding: "20px 24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#4A352F", marginBottom: "12px" }}>
              Commercial Progression Lifecycle Pipeline
            </div>

            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "6px" }}>
              {STAGES.map((st, idx) => {
                const count = members.filter((m) => m.commercialStage === st).length
                return (
                  <div
                    key={st}
                    style={{
                      flex: 1,
                      minWidth: "120px",
                      background: "#FAF7F2",
                      border: "1px solid #E8D5C4",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "0.68rem", color: "#8D6E63", fontWeight: 700 }}>
                      STEP {idx + 1}
                    </div>
                    <div style={{ fontSize: "0.775rem", fontWeight: 700, color: "#4A352F", margin: "2px 0" }}>
                      {st}
                    </div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#2E7D32" }}>
                      {count}
                    </div>
                  </div>
                )
              })}

              <div
                style={{
                  minWidth: "120px",
                  background: "#FFF8F0",
                  border: "1px solid #FFCDD2",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "0.68rem", color: "#C62828", fontWeight: 700 }}>
                  EXIT / INACTIVE
                </div>
                <div style={{ fontSize: "0.775rem", fontWeight: 700, color: "#C62828", margin: "2px 0" }}>
                  No Progression
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#C62828" }}>
                  {members.filter((m) => m.commercialStage === "No Progression").length}
                </div>
              </div>
            </div>
          </div>

          {/* Members pipeline stepper cards */}
          <div style={{ display: "grid", gap: "12px" }}>
            {members.map((m) => {
              const currentStage = m.commercialStage || "Matched"
              const currentStageIndex = STAGES.indexOf(currentStage)
              const isNoProgression = currentStage === "No Progression"

              return (
                <div
                  key={m.supplierId}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E6D7C3",
                    borderRadius: "10px",
                    padding: "16px 20px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#4A352F" }}>
                          {m.supplierName}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "#8D6E63" }}>
                          · {m.category} · {m.location}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#5D4037", marginTop: "2px" }}>
                        Constraint: <strong>{m.primaryConstraint}</strong> · Current BIG Score: <strong>{m.currentScore}/100</strong>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ fontSize: "0.75rem", color: "#6D4C41" }}>Advance Stage:</div>
                      <select
                        value={currentStage}
                        onChange={(e) => handleStageSelect(m.supplierId, e.target.value, m.supplierName)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "1px solid #C8B6A6",
                          fontSize: "0.8rem",
                          color: "#4A352F",
                          background: "#FFFFFF",
                          fontWeight: 600,
                        }}
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                        <option value="No Progression">No Progression (Discontinue)</option>
                      </select>
                    </div>
                  </div>

                  {/* Visual Stepper */}
                  {isNoProgression ? (
                    <div
                      style={{
                        background: "#FFEBEE",
                        border: "1px solid #FFCDD2",
                        borderRadius: "6px",
                        padding: "10px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <AlertTriangle size={18} color="#C62828" />
                      <div style={{ fontSize: "0.8rem", color: "#C62828" }}>
                        <strong>Progression Discontinued:</strong> {m.noProgressionReason || "Commercial / Technical Gate Failure"}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
                      {STAGES.map((st, idx) => {
                        const isPast = idx < currentStageIndex
                        const isCurrent = idx === currentStageIndex
                        return (
                          <React.Fragment key={st}>
                            <div
                              onClick={() => handleStageSelect(m.supplierId, st, m.supplierName)}
                              title={`Advance or move to ${st}`}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                cursor: "pointer",
                                minWidth: "90px",
                              }}
                            >
                              <div
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "50%",
                                  background: isCurrent ? "#4A352F" : isPast ? "#2E7D32" : "#ECEFF1",
                                  color: isCurrent || isPast ? "#FAF7F2" : "#90A4AE",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  border: isCurrent ? "3px solid #D4AF37" : "none",
                                }}
                              >
                                {isPast ? <CheckCircle2 size={16} /> : idx + 1}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.7rem",
                                  fontWeight: isCurrent ? 700 : 500,
                                  color: isCurrent ? "#4A352F" : isPast ? "#2E7D32" : "#8D6E63",
                                  marginTop: "4px",
                                  textAlign: "center",
                                }}
                              >
                                {st}
                              </div>
                            </div>

                            {idx < STAGES.length - 1 && (
                              <div
                                style={{
                                  flex: 1,
                                  height: "3px",
                                  background: idx < currentStageIndex ? "#2E7D32" : "#ECEFF1",
                                  marginBottom: "18px",
                                }}
                              />
                            )}
                          </React.Fragment>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* No Progression Reason Dialog */}
      {noProgressionModal.isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: "rgba(30, 20, 15, 0.58)",
            backdropFilter: "blur(4px)",
            zIndex: 1400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setNoProgressionModal({ isOpen: false, supplierId: null, supplierName: "" })}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "480px",
              backgroundColor: "#FAF7F2",
              borderRadius: "12px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.22)",
              padding: "20px 24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <AlertTriangle size={20} color="#C62828" />
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#4A352F" }}>
                Confirm No Progression
              </h3>
            </div>

            <p style={{ fontSize: "0.825rem", color: "#5D4037", lineHeight: "1.4", margin: "0 0 16px 0" }}>
              Please specify the audit reason for discontinuing commercial progression for{" "}
              <strong>{noProgressionModal.supplierName}</strong>.
            </p>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#5D4037", marginBottom: "6px" }}>
                Root Cause Reason *
              </label>
              <select
                value={noProgressionReason}
                onChange={(e) => setNoProgressionReason(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #C8B6A6",
                  fontSize: "0.85rem",
                  color: "#4A352F",
                  background: "#FFFFFF",
                }}
              >
                {NO_PROGRESSION_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setNoProgressionModal({ isOpen: false, supplierId: null, supplierName: "" })}
                style={{
                  padding: "8px 16px",
                  background: "#FFFFFF",
                  border: "1px solid #C8B6A6",
                  borderRadius: "6px",
                  color: "#4A352F",
                  fontSize: "0.825rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmNoProgression}
                style={{
                  padding: "8px 18px",
                  background: "#C62828",
                  border: "none",
                  borderRadius: "6px",
                  color: "#FAF7F2",
                  fontSize: "0.825rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Confirm Discontinuation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
