"use client"

import React, { useState, useMemo } from "react"
import {
  FileText,
  ShieldCheck,
  Download,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building,
  FileQuestion,
  Users,
  Clock,
  Layers,
  Calendar,
  Lock,
  ExternalLink,
  ChevronRight,
  FileSpreadsheet,
  FileJson,
} from "lucide-react"

import { useProcurementInteractions } from "../hooks/useProcurementInteractions"
import { useESDCohorts } from "../hooks/useESDCohorts"
import { useBuyerProfile } from "../hooks/useBuyerProfile"
import { useProcurementRBAC } from "../hooks/useProcurementRBAC"

export default function AuditReportsPage() {
  const {
    interactions = [],
    stageDecisions = [],
    portalHandoffs = [],
    shortlists = [],
  } = useProcurementInteractions()

  const { cohorts = [] } = useESDCohorts()
  const { profile: buyerProfile } = useBuyerProfile()
  const { activeSubRole, roleMeta, permissions } = useProcurementRBAC()

  const [filterCategory, setFilterCategory] = useState("all")
  const [filterOutcome, setFilterOutcome] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAuditLog, setSelectedAuditLog] = useState(null)

  // Compile unified audit log events
  const unifiedAuditLogs = useMemo(() => {
    const logs = []

    // 1. Stage Decisions
    stageDecisions.forEach((dec) => {
      logs.push({
        id: dec.id || `dec_${Math.random()}`,
        timestamp: dec.timestamp || new Date().toISOString(),
        category: "Stage Gate Decision",
        supplierName: dec.supplierName,
        supplierCategory: dec.supplierCategory || "General",
        action: `Stage Gate Evaluation: ${dec.gateType}`,
        actor: dec.approver || "Procurement Approver",
        reviewer: dec.reviewer,
        outcome: dec.outcome,
        details: dec.justification,
        conditions: dec.conditionalRequirements,
        rejectionReason: dec.rejectionCode,
        refCode: `#${dec.id}`,
      })
    })

    // 2. RFIs
    interactions.forEach((rfi) => {
      logs.push({
        id: rfi.id || `rfi_${Math.random()}`,
        timestamp: rfi.createdAt || new Date().toISOString(),
        category: "RFI Clarification",
        supplierName: rfi.supplierName,
        supplierCategory: rfi.type || "Clarification",
        action: `Issued RFI: ${rfi.subject}`,
        actor: rfi.createdBy || "Procurement Manager",
        outcome: rfi.status,
        details: rfi.details,
        refCode: `#${rfi.id}`,
      })
    })

    // 3. Portal Handoffs
    portalHandoffs.forEach((handoff) => {
      logs.push({
        id: handoff.id || `hnd_${Math.random()}`,
        timestamp: handoff.updatedAt || new Date().toISOString(),
        category: "ERP Portal Handoff",
        supplierName: handoff.supplierName,
        supplierCategory: handoff.supplierCategory || "General",
        action: `Vendor Master Handoff (${handoff.erpSystem || "SAP S/4HANA"})`,
        actor: handoff.buyerOrg || "Supply Chain Admin",
        outcome: handoff.status,
        details: `Reference: ${handoff.referenceNumber}. ${handoff.notes || ""}`,
        refCode: handoff.referenceNumber,
      })
    })

    // 4. Cohort Interventions & Milestones
    cohorts.forEach((cohort) => {
      ;(cohort.members || []).forEach((member) => {
        ;(member.interventions || []).forEach((it) => {
          logs.push({
            id: it.id || `int_${Math.random()}`,
            timestamp: member.entryDate ? `${member.entryDate}T10:00:00Z` : new Date().toISOString(),
            category: "ESD Development",
            supplierName: member.supplierName,
            supplierCategory: member.category,
            action: `Intervention Assigned: ${it.intervention}`,
            actor: it.owner || cohort.owner || "ESD Lead",
            outcome: it.status,
            details: `Gap: ${it.gap}. Provider: ${it.provider}. Evidence: ${it.evidenceRequired}`,
            refCode: `#${it.id}`,
          })
        })
      })
    })

    // Sort descending by timestamp
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [stageDecisions, interactions, portalHandoffs, cohorts])

  // Filter logs
  const filteredLogs = useMemo(() => {
    return unifiedAuditLogs.filter((log) => {
      if (filterCategory !== "all" && log.category !== filterCategory) return false
      if (filterOutcome !== "all" && log.outcome !== filterOutcome) return false
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const matchesSupplier = log.supplierName.toLowerCase().includes(q)
        const matchesAction = log.action.toLowerCase().includes(q)
        const matchesActor = log.actor.toLowerCase().includes(q)
        const matchesRef = log.refCode.toLowerCase().includes(q)
        if (!matchesSupplier && !matchesAction && !matchesActor && !matchesRef) return false
      }
      return true
    })
  }, [unifiedAuditLogs, filterCategory, filterOutcome, searchTerm])

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Timestamp",
      "Audit ID",
      "Category",
      "Supplier Name",
      "Offering Category",
      "Action / Event",
      "Actor / Approver",
      "Outcome / Status",
      "Audit Findings & Details",
    ]

    const rows = filteredLogs.map((log) => [
      `"${log.timestamp}"`,
      `"${log.refCode}"`,
      `"${log.category}"`,
      `"${log.supplierName}"`,
      `"${log.supplierCategory}"`,
      `"${log.action.replace(/"/g, '""')}"`,
      `"${log.actor}"`,
      `"${log.outcome}"`,
      `"${(log.details || "").replace(/"/g, '""')}"`,
    ])

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `procurement_audit_trail_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export JSON
  const handleExportJSON = () => {
    const payload = {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        exportedByRole: activeSubRole,
        organization: buyerProfile?.organisation?.legalName || "Buyer Organization",
        erpSystem: buyerProfile?.currentEnvironment?.primaryERP || "SAP S/4HANA",
        popiaComplianceStatus: "Compliant - Zero Scraping, Strict Evidence Minimisation",
        totalRecords: filteredLogs.length,
      },
      auditLogs: filteredLogs,
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2))
    const link = document.createElement("a")
    link.setAttribute("href", dataStr)
    link.setAttribute("download", `procurement_compliance_package_${new Date().toISOString().split("T")[0]}.json`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div
      style={{
        padding: "24px 32px",
        minHeight: "100vh",
        background: "#FAF7F2",
        color: "#4A352F",
        boxSizing: "border-box",
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <span
              style={{
                background: "rgba(46, 125, 50, 0.12)",
                color: "#2E7D32",
                fontSize: "0.75rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "4px",
                textTransform: "uppercase",
              }}
            >
              Auditable Governance
            </span>
            <span style={{ fontSize: "0.8rem", color: "#8D6E63" }}>
              King IV Governance & POPIA Evidence Minimisation
            </span>
          </div>

          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#4A352F", margin: 0 }}>
            Audit Trail & Statutory Compliance Reports
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#5D4037", margin: "6px 0 0 0" }}>
            Immutable chronological record of stage-gate evaluations, RFI resolutions, external ERP handoffs, and cohort milestones.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleExportCSV}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
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
            <FileSpreadsheet size={15} color="#2E7D32" /> Export Audit CSV
          </button>

          <button
            onClick={handleExportJSON}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              background: "#4A352F",
              border: "none",
              borderRadius: "6px",
              color: "#FAF7F2",
              fontSize: "0.825rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <FileJson size={15} /> Download Compliance JSON
          </button>
        </div>
      </div>

      {/* Aggregate KPI Banner */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E6D7C3",
            borderRadius: "10px",
            padding: "16px 20px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8D6E63", textTransform: "uppercase" }}>
            Total Auditable Events
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#4A352F", marginTop: "4px" }}>
            {unifiedAuditLogs.length}
          </div>
          <div style={{ fontSize: "0.725rem", color: "#6D4C41", marginTop: "2px" }}>
            Decisions, RFIs & Handoffs
          </div>
        </div>

        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E6D7C3",
            borderRadius: "10px",
            padding: "16px 20px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8D6E63", textTransform: "uppercase" }}>
            Stage-Gate Determinations
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#2E7D32", marginTop: "4px" }}>
            {stageDecisions.length}
          </div>
          <div style={{ fontSize: "0.725rem", color: "#2E7D32", marginTop: "2px" }}>
            {stageDecisions.filter((d) => d.outcome === "Approved").length} Approved · {stageDecisions.filter((d) => d.outcome === "Conditional").length} Conditional
          </div>
        </div>

        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E6D7C3",
            borderRadius: "10px",
            padding: "16px 20px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8D6E63", textTransform: "uppercase" }}>
            ERP Portal Handoffs
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1565C0", marginTop: "4px" }}>
            {portalHandoffs.length}
          </div>
          <div style={{ fontSize: "0.725rem", color: "#1565C0", marginTop: "2px" }}>
            Zero credential storage policy
          </div>
        </div>

        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E6D7C3",
            borderRadius: "10px",
            padding: "16px 20px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8D6E63", textTransform: "uppercase" }}>
            POPIA Compliance Status
          </div>
          <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#2E7D32", marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            <ShieldCheck size={22} color="#2E7D32" /> 100% Compliant
          </div>
          <div style={{ fontSize: "0.725rem", color: "#8D6E63", marginTop: "4px" }}>
            Evidence Minimisation Active
          </div>
        </div>
      </div>

      {/* Statutory Governance Card */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E6D7C3",
          borderRadius: "12px",
          padding: "18px 24px",
          marginBottom: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#4A352F" }}>
              Statutory Governance & ERP Handoff Scope
            </div>
            <div style={{ fontSize: "0.775rem", color: "#6D4C41", marginTop: "2px" }}>
              Buyer: <strong>{buyerProfile?.organisation?.legalName || "Anglo American Inyosi Coal (Pty) Ltd"}</strong> · Target ERP: <strong>{buyerProfile?.currentEnvironment?.primaryERP || "SAP S/4HANA"}</strong>
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px", fontSize: "0.75rem", color: "#5D4037" }}>
            <div>
              <strong>Lead Approver:</strong> {buyerProfile?.decisionProcess?.approverRole || "Sbonelo Khumalo (CPO)"}
            </div>
            <div>
              <strong>Data Retention:</strong> 5 Years (Corporate Audit Schedule)
            </div>
            <div>
              <strong>Active Simulator Role:</strong> <span style={{ color: roleMeta.badgeColor, fontWeight: 700 }}>{roleMeta.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
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
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: "1 1 400px" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
            <Search size={15} color="#8D6E63" style={{ position: "absolute", left: "10px", top: "10px" }} />
            <input
              type="text"
              placeholder="Search by supplier, action, or ref #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 32px",
                borderRadius: "6px",
                border: "1px solid #C8B6A6",
                fontSize: "0.825rem",
                color: "#4A352F",
                background: "#FFFFFF",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              padding: "7px 12px",
              borderRadius: "6px",
              border: "1px solid #C8B6A6",
              fontSize: "0.8rem",
              color: "#4A352F",
              background: "#FFFFFF",
            }}
          >
            <option value="all">All Event Categories ({unifiedAuditLogs.length})</option>
            <option value="Stage Gate Decision">Stage Gate Decisions ({stageDecisions.length})</option>
            <option value="RFI Clarification">RFIs & Clarifications ({interactions.length})</option>
            <option value="ERP Portal Handoff">ERP Portal Handoffs ({portalHandoffs.length})</option>
            <option value="ESD Development">ESD Milestones</option>
          </select>
        </div>

        <div style={{ fontSize: "0.775rem", color: "#8D6E63" }}>
          Showing {filteredLogs.length} of {unifiedAuditLogs.length} auditable events
        </div>
      </div>

      {/* Main Audit Trail Table */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E6D7C3",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#F5EFEB", borderBottom: "1px solid #E6D7C3" }}>
                <th style={{ padding: "12px 16px", fontSize: "0.75rem", fontWeight: 700, color: "#4A352F" }}>
                  Timestamp
                </th>
                <th style={{ padding: "12px 16px", fontSize: "0.75rem", fontWeight: 700, color: "#4A352F" }}>
                  Category
                </th>
                <th style={{ padding: "12px 16px", fontSize: "0.75rem", fontWeight: 700, color: "#4A352F" }}>
                  Supplier & Offering
                </th>
                <th style={{ padding: "12px 16px", fontSize: "0.75rem", fontWeight: 700, color: "#4A352F" }}>
                  Action / Event Summary
                </th>
                <th style={{ padding: "12px 16px", fontSize: "0.75rem", fontWeight: 700, color: "#4A352F" }}>
                  Actor / Approver
                </th>
                <th style={{ padding: "12px 16px", fontSize: "0.75rem", fontWeight: 700, color: "#4A352F" }}>
                  Outcome / Status
                </th>
                <th style={{ padding: "12px 16px", fontSize: "0.75rem", fontWeight: 700, color: "#4A352F", textAlign: "right" }}>
                  Audit Ref
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "40px 16px", textAlign: "center", color: "#8D6E63" }}>
                    No auditable logs match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isApproved = log.outcome === "Approved" || log.outcome === "Resolved" || log.outcome?.includes("Active")
                  const isConditional = log.outcome === "Conditional" || log.outcome === "Submitted"
                  const isRejected = log.outcome === "Rejected" || log.outcome?.includes("Rejected")

                  const statusColor = isApproved ? "#2E7D32" : isConditional ? "#D4AF37" : isRejected ? "#C62828" : "#4A352F"
                  const statusBg = isApproved
                    ? "rgba(46, 125, 50, 0.12)"
                    : isConditional
                    ? "rgba(212, 175, 55, 0.18)"
                    : isRejected
                    ? "rgba(198, 40, 40, 0.12)"
                    : "rgba(74, 53, 47, 0.08)"

                  return (
                    <tr
                      key={log.id}
                      style={{ borderBottom: "1px solid #F0E6DD", transition: "background 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAF7F2")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td style={{ padding: "12px 16px", fontSize: "0.75rem", color: "#8D6E63", whiteSpace: "nowrap" }}>
                        {new Date(log.timestamp).toLocaleString("en-ZA", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            background: "rgba(74, 53, 47, 0.08)",
                            color: "#4A352F",
                          }}
                        >
                          {log.category}
                        </span>
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#4A352F" }}>
                          {log.supplierName}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#8D6E63" }}>
                          {log.supplierCategory}
                        </div>
                      </td>

                      <td style={{ padding: "12px 16px", maxWidth: "340px" }}>
                        <div style={{ fontSize: "0.8rem", color: "#4A352F", fontWeight: 500 }}>
                          {log.action}
                        </div>
                        {log.details && (
                          <div style={{ fontSize: "0.72rem", color: "#8D6E63", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {log.details}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#5D4037", whiteSpace: "nowrap" }}>
                        {log.actor}
                      </td>

                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: "12px",
                            background: statusBg,
                            color: statusColor,
                            fontSize: "0.72rem",
                            fontWeight: 700,
                          }}
                        >
                          {log.outcome}
                        </span>
                      </td>

                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button
                          onClick={() => setSelectedAuditLog(log)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#6D4C41",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            textDecoration: "underline",
                          }}
                        >
                          {log.refCode}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Detail Modal */}
      {selectedAuditLog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: "rgba(30, 20, 15, 0.58)",
            backdropFilter: "blur(4px)",
            zIndex: 1300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setSelectedAuditLog(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "540px",
              backgroundColor: "#FAF7F2",
              borderRadius: "12px",
              boxShadow: "0 24px 48px rgba(0,0,0,0.25)",
              padding: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={20} color="#2E7D32" />
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#4A352F" }}>
                  Audit Record Verification
                </h3>
              </div>
              <button
                onClick={() => setSelectedAuditLog(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                  color: "#8D6E63",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "8px", padding: "14px", marginBottom: "16px" }}>
              <div style={{ fontSize: "0.75rem", color: "#8D6E63" }}>Event Category</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#4A352F", marginTop: "2px" }}>
                {selectedAuditLog.category}
              </div>

              <div style={{ fontSize: "0.75rem", color: "#8D6E63", marginTop: "10px" }}>Supplier Target</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#4A352F", marginTop: "2px" }}>
                {selectedAuditLog.supplierName} ({selectedAuditLog.supplierCategory})
              </div>

              <div style={{ fontSize: "0.75rem", color: "#8D6E63", marginTop: "10px" }}>Action Recorded</div>
              <div style={{ fontSize: "0.85rem", color: "#4A352F", marginTop: "2px" }}>
                {selectedAuditLog.action}
              </div>

              <div style={{ fontSize: "0.75rem", color: "#8D6E63", marginTop: "10px" }}>Audit Findings & Justification</div>
              <div style={{ fontSize: "0.825rem", color: "#5D4037", marginTop: "2px", lineHeight: "1.4" }}>
                {selectedAuditLog.details || "None specified."}
              </div>

              {selectedAuditLog.conditions && (
                <div style={{ marginTop: "10px", padding: "8px", background: "#FFF8F0", border: "1px solid #E8D5C4", borderRadius: "6px" }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#D4AF37" }}>Conditional Requirements</div>
                  <div style={{ fontSize: "0.775rem", color: "#5D4037", marginTop: "2px" }}>
                    {selectedAuditLog.conditions}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "#8D6E63" }}>
              <div>Actor: <strong>{selectedAuditLog.actor}</strong></div>
              <div>Timestamp: {new Date(selectedAuditLog.timestamp).toLocaleString("en-ZA")}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
