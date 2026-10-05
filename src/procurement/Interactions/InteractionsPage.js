"use client"

import React, { useState } from "react"
import {
  MessageSquare,
  FileQuestion,
  Bookmark,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Send,
  Eye,
  Trash2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  FileCheck,
  Building,
  Plus,
  Hash,
  XCircle,
} from "lucide-react"

import { useProcurementInteractions } from "../hooks/useProcurementInteractions"
import { useProcurementMatches } from "../hooks/useProcurementMatches"
import { useBuyerProfile } from "../hooks/useBuyerProfile"
import RFIDialogModal from "./RFIDialogModal"
import ProcurementSupplierModal from "../SupplierDetail/ProcurementSupplierModal"
import PortalRegistrationModal from "../StageGate/PortalRegistrationModal"
import StageDecisionModal from "../StageGate/StageDecisionModal"

export default function InteractionsPage() {
  const {
    interactions,
    shortlists,
    stageDecisions = [],
    portalHandoffs = [],
    loading,
    createRFI,
    updateRFIStatus,
    removeFromShortlist,
    recordStageDecision,
    recordPortalHandoff,
    updatePortalHandoffStatus,
  } = useProcurementInteractions()

  const { suppliers = [] } = useProcurementMatches()
  const { profile: buyerProfile } = useBuyerProfile()

  const [activeTab, setActiveTab] = useState("rfis") // "rfis" | "shortlists" | "stage_decisions" | "portal_handoffs"
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Modals state
  const [isRFIModalOpen, setIsRFIModalOpen] = useState(false)
  const [selectedSupplierForRFI, setSelectedSupplierForRFI] = useState(null)
  const [selectedSupplierForModal, setSelectedSupplierForModal] = useState(null)
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false)
  const [selectedSupplierForDecision, setSelectedSupplierForDecision] = useState(null)
  const [isHandoffModalOpen, setIsHandoffModalOpen] = useState(false)
  const [selectedSupplierForHandoff, setSelectedSupplierForHandoff] = useState(null)
  const [existingHandoffToEdit, setExistingHandoffToEdit] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Filtered RFIs
  const filteredInteractions = interactions.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchSup = (item.supplierName || "").toLowerCase().includes(q)
      const matchSub = (item.subject || "").toLowerCase().includes(q)
      if (!matchSup && !matchSub) return false
    }

    if (statusFilter !== "all" && item.status !== statusFilter) {
      return false
    }

    return true
  })

  // Metrics
  const totalRFIs = interactions.length
  const openRFIs = interactions.filter((i) => i.status === "Open").length
  const submittedRFIs = interactions.filter((i) => i.status === "Submitted").length
  const resolvedRFIs = interactions.filter((i) => i.status === "Resolved").length

  return (
    <div
      style={{
        padding: "24px 32px",
        minHeight: "100vh",
        background: "#FAF7F2",
        color: "#4A352F",
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 1200,
            background: "#2E7D32",
            color: "#FFFFFF",
            padding: "12px 20px",
            borderRadius: "8px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "0.875rem",
            fontWeight: 500,
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <CheckCircle2 size={18} />
          {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <MessageSquare size={26} color="#4A352F" />
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700, color: "#4A352F" }}>
            Interactions & Auditable Requests
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#8D6E63", maxWidth: "800px" }}>
          Manage two-way auditable communications with suppliers. Issue structured Requests for Information (RFIs), track compliance clarifications, review supplier responses, and govern shortlists.
        </p>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "10px", padding: "16px 20px" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8D6E63", textTransform: "uppercase" }}>
            Total RFIs Issued
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#4A352F", marginTop: "4px" }}>
            {totalRFIs}
          </div>
          <div style={{ fontSize: "0.725rem", color: "#A89482", marginTop: "2px" }}>
            Auditable interaction threads
          </div>
        </div>

        <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "10px", padding: "16px 20px" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8D6E63", textTransform: "uppercase" }}>
            Open / Awaiting Supplier
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#E65100", marginTop: "4px" }}>
            {openRFIs}
          </div>
          <div style={{ fontSize: "0.725rem", color: "#A89482", marginTop: "2px" }}>
            Supplier action pending
          </div>
        </div>

        <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "10px", padding: "16px 20px" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8D6E63", textTransform: "uppercase" }}>
            Responses Ready for Review
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1565C0", marginTop: "4px" }}>
            {submittedRFIs}
          </div>
          <div style={{ fontSize: "0.725rem", color: "#A89482", marginTop: "2px" }}>
            Supplier uploaded answers/evidence
          </div>
        </div>

        <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "10px", padding: "16px 20px" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8D6E63", textTransform: "uppercase" }}>
            Shortlisted Suppliers
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#D4AF37", marginTop: "4px" }}>
            {shortlists.length}
          </div>
          <div style={{ fontSize: "0.725rem", color: "#A89482", marginTop: "2px" }}>
            Tagged for upcoming tenders
          </div>
        </div>
      </div>

      {/* Main Tab Controls */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <button
          onClick={() => setActiveTab("rfis")}
          style={{
            padding: "9px 18px",
            borderRadius: "6px",
            border: activeTab === "rfis" ? "none" : "1px solid #C8B6A6",
            background: activeTab === "rfis" ? "#4A352F" : "#FFFFFF",
            color: activeTab === "rfis" ? "#FAF7F2" : "#6D4C41",
            fontSize: "0.825rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <FileQuestion size={15} /> All Requests for Information ({totalRFIs})
        </button>

        <button
          onClick={() => setActiveTab("shortlists")}
          style={{
            padding: "9px 18px",
            borderRadius: "6px",
            border: activeTab === "shortlists" ? "none" : "1px solid #C8B6A6",
            background: activeTab === "shortlists" ? "#4A352F" : "#FFFFFF",
            color: activeTab === "shortlists" ? "#FAF7F2" : "#6D4C41",
            fontSize: "0.825rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Bookmark size={15} /> Shortlisted Suppliers ({shortlists.length})
        </button>

        <button
          onClick={() => setActiveTab("stage_decisions")}
          style={{
            padding: "9px 18px",
            borderRadius: "6px",
            border: activeTab === "stage_decisions" ? "none" : "1px solid #C8B6A6",
            background: activeTab === "stage_decisions" ? "#4A352F" : "#FFFFFF",
            color: activeTab === "stage_decisions" ? "#FAF7F2" : "#6D4C41",
            fontSize: "0.825rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <FileCheck size={15} /> Stage-Gate Decisions ({stageDecisions.length})
        </button>

        <button
          onClick={() => setActiveTab("portal_handoffs")}
          style={{
            padding: "9px 18px",
            borderRadius: "6px",
            border: activeTab === "portal_handoffs" ? "none" : "1px solid #C8B6A6",
            background: activeTab === "portal_handoffs" ? "#4A352F" : "#FFFFFF",
            color: activeTab === "portal_handoffs" ? "#FAF7F2" : "#6D4C41",
            fontSize: "0.825rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Building size={15} /> External Portal References ({portalHandoffs.length})
        </button>
      </div>

      {/* TAB 1: ALL RFIs */}
      {activeTab === "rfis" && (
        <div>
          {/* Toolbar */}
          <div
            style={{
              background: "#FAF7F2",
              border: "1px solid #E6D7C3",
              borderRadius: "10px",
              padding: "14px 18px",
              marginBottom: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ position: "relative", minWidth: "260px", flex: 1, maxWidth: "380px" }}>
              <Search size={16} color="#8D6E63" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Search by supplier or RFI subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 36px",
                  borderRadius: "6px",
                  border: "1px solid #C8B6A6",
                  background: "#FFFFFF",
                  fontSize: "0.825rem",
                  color: "#4A352F",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: "7px 12px",
                  borderRadius: "6px",
                  border: "1px solid #C8B6A6",
                  background: "#FFFFFF",
                  fontSize: "0.775rem",
                  color: "#4A352F",
                }}
              >
                <option value="all">All Lifecycle States</option>
                <option value="Open">Open (Pending)</option>
                <option value="Submitted">Submitted (Review Ready)</option>
                <option value="Under Review">Under Review</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* RFIs Table */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E6D7C3",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#4A352F", color: "#FAF7F2", fontSize: "0.8rem" }}>
                  <th style={{ padding: "12px 16px" }}>Supplier</th>
                  <th style={{ padding: "12px 16px" }}>Request Classification</th>
                  <th style={{ padding: "12px 16px" }}>Subject & Details</th>
                  <th style={{ padding: "12px 16px", textAlign: "center" }}>State</th>
                  <th style={{ padding: "12px 16px" }}>Issued By</th>
                  <th style={{ padding: "12px 16px" }}>Due Date</th>
                  <th style={{ padding: "12px 16px", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInteractions.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "36px", textAlign: "center", color: "#8D6E63", fontSize: "0.85rem" }}>
                      No Requests for Information match the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredInteractions.map((item, idx) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: "1px solid #F0E6D8",
                        background: idx % 2 === 0 ? "#FFFFFF" : "#FAF7F2",
                      }}
                    >
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#4A352F", fontSize: "0.85rem" }}>
                        {item.supplierName}
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            background: "#F5F0E1",
                            color: "#5D4037",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "0.725rem",
                            fontWeight: 500,
                          }}
                        >
                          {item.type}
                        </span>
                      </td>

                      <td style={{ padding: "12px 16px", maxWidth: "260px" }}>
                        <div style={{ fontSize: "0.825rem", fontWeight: 600, color: "#4A352F" }}>
                          {item.subject}
                        </div>
                        <div style={{ fontSize: "0.725rem", color: "#8D6E63", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.details}
                        </div>
                        {item.responses && item.responses.length > 0 && (
                          <div style={{ fontSize: "0.7rem", color: "#2E7D32", marginTop: "4px", fontWeight: 500 }}>
                            ↳ Supplier responded ({item.responses[0].attachments?.length || 0} file attached)
                          </div>
                        )}
                      </td>

                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: "12px",
                            fontSize: "0.725rem",
                            fontWeight: 700,
                            background:
                              item.status === "Resolved"
                                ? "#E8F5E9"
                                : item.status === "Submitted"
                                ? "#E3F2FD"
                                : item.status === "Under Review"
                                ? "#F3E5F5"
                                : "#FFF3E0",
                            color:
                              item.status === "Resolved"
                                ? "#2E7D32"
                                : item.status === "Submitted"
                                ? "#1565C0"
                                : item.status === "Under Review"
                                ? "#6A1B9A"
                                : "#E65100",
                          }}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td style={{ padding: "12px 16px", fontSize: "0.775rem", color: "#5D4037" }}>
                        {item.createdBy}
                        <div style={{ fontSize: "0.7rem", color: "#A89482" }}>{item.buyerRole}</div>
                      </td>

                      <td style={{ padding: "12px 16px", fontSize: "0.775rem", color: "#5D4037" }}>
                        {item.dueDate}
                      </td>

                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
                          {item.status === "Submitted" && (
                            <button
                              onClick={() => {
                                updateRFIStatus(item.id, "Resolved")
                                showToast(`RFI "${item.subject}" marked as Resolved.`)
                              }}
                              style={{
                                padding: "4px 8px",
                                background: "#2E7D32",
                                color: "#FFFFFF",
                                border: "none",
                                borderRadius: "4px",
                                fontSize: "0.725rem",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Resolve
                            </button>
                          )}

                          {item.status === "Open" && (
                            <button
                              onClick={() => {
                                updateRFIStatus(item.id, "Under Review")
                                showToast(`RFI "${item.subject}" updated to Under Review.`)
                              }}
                              style={{
                                padding: "4px 8px",
                                background: "#4A352F",
                                color: "#FAF7F2",
                                border: "none",
                                borderRadius: "4px",
                                fontSize: "0.725rem",
                                fontWeight: 500,
                                cursor: "pointer",
                              }}
                            >
                              Review
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedSupplierForModal({ id: item.supplierId, name: item.supplierName })
                            }}
                            style={{
                              padding: "4px 8px",
                              background: "transparent",
                              color: "#4A352F",
                              border: "1px solid #C8B6A6",
                              borderRadius: "4px",
                              fontSize: "0.725rem",
                              cursor: "pointer",
                            }}
                          >
                            Inspect
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SHORTLISTS */}
      {activeTab === "shortlists" && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E6D7C3",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#4A352F", color: "#FAF7F2", fontSize: "0.8rem" }}>
                <th style={{ padding: "12px 16px" }}>Shortlisted Supplier</th>
                <th style={{ padding: "12px 16px" }}>Category</th>
                <th style={{ padding: "12px 16px" }}>Location</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>BIG Score</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Fit %</th>
                <th style={{ padding: "12px 16px" }}>Rationale / Tagged By</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shortlists.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "36px", textAlign: "center", color: "#8D6E63", fontSize: "0.85rem" }}>
                    No suppliers currently shortlisted. You can shortlist suppliers from the Matched Suppliers Explorer or Supplier Dossier.
                  </td>
                </tr>
              ) : (
                shortlists.map((s, idx) => (
                  <tr
                    key={s.supplierId}
                    style={{
                      borderBottom: "1px solid #F0E6D8",
                      background: idx % 2 === 0 ? "#FFFFFF" : "#FAF7F2",
                    }}
                  >
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#4A352F", fontSize: "0.85rem" }}>
                      {s.supplierName}
                    </td>

                    <td style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#5D4037" }}>
                      {s.offeringCategory || "General Sourcing"}
                    </td>

                    <td style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#5D4037" }}>
                      {s.location || "Gauteng"}
                    </td>

                    <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 700 }}>
                      {s.bigScore || "78"}/100
                    </td>

                    <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 700, color: "#2E7D32" }}>
                      {s.requirementFit || "85"}%
                    </td>

                    <td style={{ padding: "12px 16px", fontSize: "0.75rem", color: "#6D4C41" }}>
                      <div>{s.reason || "Qualified in Matched Suppliers"}</div>
                      <div style={{ fontSize: "0.7rem", color: "#A89482" }}>
                        By <strong>{s.shortlistedBy}</strong> ({new Date(s.timestamp).toLocaleDateString()})
                      </div>
                    </td>

                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
                        <button
                          onClick={() => {
                            setSelectedSupplierForRFI({ id: s.supplierId, name: s.supplierName, offeringCategory: s.offeringCategory })
                            setIsRFIModalOpen(true)
                          }}
                          style={{
                            padding: "4px 8px",
                            background: "#4A352F",
                            color: "#FAF7F2",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "0.725rem",
                            fontWeight: 500,
                            cursor: "pointer",
                          }}
                        >
                          Issue RFI
                        </button>

                        <button
                          onClick={() => {
                            removeFromShortlist(s.supplierId)
                            showToast(`${s.supplierName} removed from shortlist.`)
                          }}
                          style={{
                            padding: "4px 8px",
                            background: "transparent",
                            color: "#C62828",
                            border: "1px solid #FFCDD2",
                            borderRadius: "4px",
                            fontSize: "0.725rem",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: STAGE-GATE AUDIT DECISIONS */}
      {activeTab === "stage_decisions" && (
        <div style={{ display: "grid", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "#4A352F" }}>
                Auditable Stage-Gate Governance Log
              </h2>
              <div style={{ fontSize: "0.8rem", color: "#8D6E63", marginTop: "2px" }}>
                Formal evaluation sign-offs, statutory gates, approver justifications, and conditional passes.
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedSupplierForDecision(suppliers[0] || { id: "sup_general", name: "Select Supplier", offeringCategory: "Industrial" })
                setIsDecisionModalOpen(true)
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                background: "#4A352F",
                color: "#FAF7F2",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.825rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Plus size={15} /> Record Stage Decision
            </button>
          </div>

          {stageDecisions.length === 0 ? (
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E6D7C3",
                borderRadius: "10px",
                padding: "48px 20px",
                textAlign: "center",
              }}
            >
              <FileCheck size={36} color="#C8B6A6" style={{ margin: "0 auto 12px" }} />
              <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#4A352F" }}>
                No Stage-Gate Decisions Recorded
              </div>
              <div style={{ fontSize: "0.8rem", color: "#8D6E63", marginTop: "4px" }}>
                Record auditable gate determinations for tender readiness, SHEQ compliance, or vendor master onboarding.
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {stageDecisions.map((dec) => {
                const isApproved = dec.outcome === "Approved"
                const isConditional = dec.outcome === "Conditional"
                const isRejected = dec.outcome === "Rejected"

                const outcomeColor = isApproved ? "#2E7D32" : isConditional ? "#D4AF37" : "#C62828"
                const outcomeBg = isApproved
                  ? "rgba(46, 125, 50, 0.12)"
                  : isConditional
                  ? "rgba(212, 175, 55, 0.18)"
                  : "rgba(198, 40, 40, 0.12)"

                return (
                  <div
                    key={dec.id}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E6D7C3",
                      borderRadius: "10px",
                      padding: "18px 22px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", flexWrap: "wrap", gap: "10px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "1rem", fontWeight: 700, color: "#4A352F" }}>
                            {dec.supplierName}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "#8D6E63" }}>
                            · {dec.supplierCategory}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6D4C41", marginTop: "2px" }}>
                          Gate: {dec.gateType}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: "12px",
                            background: outcomeBg,
                            color: outcomeColor,
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          {isApproved && <CheckCircle2 size={13} />}
                          {isConditional && <AlertTriangle size={13} />}
                          {isRejected && <XCircle size={13} />}
                          {dec.outcome}
                        </span>

                        <span style={{ fontSize: "0.72rem", color: "#A89482" }}>
                          {new Date(dec.timestamp).toLocaleDateString("en-ZA")}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: "0.825rem", color: "#4A352F", lineHeight: "1.45", marginBottom: "10px" }}>
                      <strong>Evaluation Findings:</strong> {dec.justification}
                    </div>

                    {dec.conditionalRequirements && (
                      <div
                        style={{
                          background: "#FFF8F0",
                          border: "1px solid #E8D5C4",
                          borderRadius: "6px",
                          padding: "8px 12px",
                          marginBottom: "10px",
                          fontSize: "0.775rem",
                          color: "#5D4037",
                        }}
                      >
                        <strong>Conditional Requirements:</strong> {dec.conditionalRequirements}
                      </div>
                    )}

                    {dec.rejectionCode && (
                      <div
                        style={{
                          background: "#FFEBEE",
                          border: "1px solid #FFCDD2",
                          borderRadius: "6px",
                          padding: "8px 12px",
                          marginBottom: "10px",
                          fontSize: "0.775rem",
                          color: "#C62828",
                        }}
                      >
                        <strong>Rejection Code:</strong> {dec.rejectionCode}
                      </div>
                    )}

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "18px", fontSize: "0.725rem", color: "#8D6E63", paddingTop: "8px", borderTop: "1px dashed #E8D5C4" }}>
                      <div>
                        <strong>Approver:</strong> {dec.approver}
                      </div>
                      {dec.reviewer && (
                        <div>
                          <strong>Reviewer:</strong> {dec.reviewer}
                        </div>
                      )}
                      <div>
                        <strong>Audit Ref:</strong> #{dec.id}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EXTERNAL PORTAL HANDOFFS */}
      {activeTab === "portal_handoffs" && (
        <div style={{ display: "grid", gap: "16px" }}>
          {/* Zero Scraping Security Notice */}
          <div
            style={{
              background: "#FFF8F0",
              border: "1px solid #E8D5C4",
              borderRadius: "8px",
              padding: "12px 16px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <ShieldCheck size={20} color="#2E7D32" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "#4A352F" }}>
                Zero-Scraping ERP Coexistence Policy
              </div>
              <div style={{ fontSize: "0.75rem", color: "#6D4C41", marginTop: "2px", lineHeight: "1.4" }}>
                The platform prepares, pre-qualifies, and benchmarks suppliers for procurement readiness. 
                External vendor master registrations occur strictly on your corporate ERP / procurement portal. 
                Zero passwords or login credentials are ever requested, scraped, or stored.
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "#4A352F" }}>
                External Portal Reference & Vendor Master Handoffs
              </h2>
              <div style={{ fontSize: "0.8rem", color: "#8D6E63", marginTop: "2px" }}>
                Track external ERP vendor references, portal submission statuses, and onboarding notes.
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedSupplierForHandoff(suppliers[0] || { id: "sup_general", name: "Select Supplier", offeringCategory: "General" })
                setExistingHandoffToEdit(null)
                setIsHandoffModalOpen(true)
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                background: "#4A352F",
                color: "#FAF7F2",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.825rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Plus size={15} /> Initiate Portal Handoff
            </button>
          </div>

          {portalHandoffs.length === 0 ? (
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E6D7C3",
                borderRadius: "10px",
                padding: "48px 20px",
                textAlign: "center",
              }}
            >
              <Building size={36} color="#C8B6A6" style={{ margin: "0 auto 12px" }} />
              <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#4A352F" }}>
                No External Portal Handoffs Recorded
              </div>
              <div style={{ fontSize: "0.8rem", color: "#8D6E63", marginTop: "4px" }}>
                Track vendor master applications and external portal handoff reference numbers for matched suppliers.
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {portalHandoffs.map((handoff) => (
                <div
                  key={handoff.id}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E6D7C3",
                    borderRadius: "10px",
                    padding: "18px 22px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "1rem", fontWeight: 700, color: "#4A352F" }}>
                          {handoff.supplierName}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "#8D6E63" }}>
                          · {handoff.supplierCategory}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#5D4037", marginTop: "2px" }}>
                        ERP System: <strong>{handoff.erpSystem || "SAP S/4HANA"}</strong> · Ref #: <strong>{handoff.referenceNumber}</strong>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <select
                        value={handoff.status}
                        onChange={(e) => updatePortalHandoffStatus(handoff.id, e.target.value)}
                        style={{
                          padding: "5px 10px",
                          borderRadius: "6px",
                          border: "1px solid #C8B6A6",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "#4A352F",
                          background: "#FAF7F2",
                        }}
                      >
                        <option value="Invited to External Portal">Invited to External Portal</option>
                        <option value="Pending Supplier Submission">Pending Supplier Submission</option>
                        <option value="Submitted to External Portal">Submitted to External Portal</option>
                        <option value="Under Buyer Vendor Master Review">Under Buyer Vendor Master Review</option>
                        <option value="Approved - Vendor Code Active">Approved - Vendor Code Active</option>
                        <option value="Registration Rejected / On Hold">Registration Rejected / On Hold</option>
                      </select>

                      <a
                        href={handoff.portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "5px 10px",
                          background: "#FAF7F2",
                          border: "1px solid #C8B6A6",
                          borderRadius: "6px",
                          color: "#4A352F",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        Portal Link <ExternalLink size={12} />
                      </a>

                      <button
                        onClick={() => {
                          setSelectedSupplierForHandoff({
                            id: handoff.supplierId,
                            name: handoff.supplierName,
                            offeringCategory: handoff.supplierCategory,
                          })
                          setExistingHandoffToEdit(handoff)
                          setIsHandoffModalOpen(true)
                        }}
                        style={{
                          padding: "5px 10px",
                          background: "#4A352F",
                          border: "none",
                          borderRadius: "6px",
                          color: "#FAF7F2",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Edit Ref
                      </button>
                    </div>
                  </div>

                  {handoff.notes && (
                    <div style={{ fontSize: "0.8rem", color: "#4A352F", marginBottom: "8px" }}>
                      <strong>Notes:</strong> {handoff.notes}
                    </div>
                  )}

                  <div style={{ fontSize: "0.72rem", color: "#8D6E63" }}>
                    Last Updated: {new Date(handoff.updatedAt).toLocaleDateString("en-ZA")} · Buyer Org: {handoff.buyerOrg || "Corporate Buyer"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RFI Modal */}
      {isRFIModalOpen && (
        <RFIDialogModal
          isOpen={isRFIModalOpen}
          onClose={() => {
            setIsRFIModalOpen(false)
            setSelectedSupplierForRFI(null)
          }}
          supplier={selectedSupplierForRFI}
          onSubmitRFI={async (payload) => {
            await createRFI(payload)
            showToast(`Auditable RFI issued to ${payload.supplierName}.`)
          }}
        />
      )}

      {/* Procurement Supplier Dossier Modal */}
      {selectedSupplierForModal && (
        <ProcurementSupplierModal
          supplier={selectedSupplierForModal}
          isOpen={!!selectedSupplierForModal}
          onClose={() => setSelectedSupplierForModal(null)}
          onOpenRFI={(s) => {
            setSelectedSupplierForRFI(s)
            setIsRFIModalOpen(true)
          }}
          supplierInteractions={interactions.filter((i) => i.supplierId === selectedSupplierForModal.id)}
        />
      )}

      {/* Stage-Gate Governance Decision Modal */}
      {isDecisionModalOpen && selectedSupplierForDecision && (
        <StageDecisionModal
          isOpen={isDecisionModalOpen}
          onClose={() => {
            setIsDecisionModalOpen(false)
            setSelectedSupplierForDecision(null)
          }}
          supplier={selectedSupplierForDecision}
          buyerProfile={buyerProfile}
          onSaveDecision={async (dec) => {
            await recordStageDecision(dec)
            showToast(`Stage-gate decision for ${dec.supplierName} recorded successfully.`)
          }}
        />
      )}

      {/* External Portal Handoff Modal */}
      {isHandoffModalOpen && selectedSupplierForHandoff && (
        <PortalRegistrationModal
          isOpen={isHandoffModalOpen}
          onClose={() => {
            setIsHandoffModalOpen(false)
            setSelectedSupplierForHandoff(null)
            setExistingHandoffToEdit(null)
          }}
          supplier={selectedSupplierForHandoff}
          buyerProfile={buyerProfile}
          existingHandoff={existingHandoffToEdit}
          onSaveHandoff={async (handoff) => {
            await recordPortalHandoff(handoff)
            showToast(`External portal handoff reference saved for ${handoff.supplierName}.`)
          }}
        />
      )}
    </div>
  )
}
