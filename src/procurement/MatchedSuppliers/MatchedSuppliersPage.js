"use client"

import React, { useState } from "react"
import {
  ShieldCheck,
  Users,
  AlertTriangle,
  Scale,
  Sparkles,
  Download,
  Filter,
  CheckCircle,
  FolderCheck,
  Building,
} from "lucide-react"

import { useProcurementMatches } from "../hooks/useProcurementMatches"
import { useProcurementInteractions } from "../hooks/useProcurementInteractions"
import { useBuyerProfile } from "../hooks/useBuyerProfile"
import MatchedSuppliersTable from "./MatchedSuppliersTable"
import MatchReasonDrawer from "./MatchReasonDrawer"
import SupplierCompareModal from "./SupplierCompareModal"
import ProcurementSupplierModal from "../SupplierDetail/ProcurementSupplierModal"
import RFIDialogModal from "../Interactions/RFIDialogModal"
import PortalRegistrationModal from "../StageGate/PortalRegistrationModal"
import StageDecisionModal from "../StageGate/StageDecisionModal"

export default function MatchedSuppliersPage() {
  const { suppliers, loading, error, refetch, demandContext } = useProcurementMatches()
  const { profile: buyerProfile } = useBuyerProfile()
  const {
    interactions,
    createRFI,
    addToShortlist,
    removeFromShortlist,
    isShortlisted,
    recordStageDecision,
    recordPortalHandoff,
  } = useProcurementInteractions()

  // Directory Tab state: 'preferred' (Green Passport) | 'directory' (Full Supplier Directory)
  const [directoryTab, setDirectoryTab] = useState("preferred")

  // Modals & Drawers state
  const [selectedSupplierForReason, setSelectedSupplierForReason] = useState(null)
  const [selectedSupplierForDetail, setSelectedSupplierForDetail] = useState(null)
  const [selectedSupplierForRFI, setSelectedSupplierForRFI] = useState(null)
  const [selectedSupplierForDecision, setSelectedSupplierForDecision] = useState(null)
  const [selectedSupplierForHandoff, setSelectedSupplierForHandoff] = useState(null)
  const [suppliersToCompare, setSuppliersToCompare] = useState([])
  const [notification, setNotification] = useState(null)

  // Preferred suppliers filter (Green Passport active)
  const preferredSuppliers = suppliers.filter((s) => s.passportStatus === "Active")
  const displayedSuppliers = directoryTab === "preferred" ? preferredSuppliers : suppliers

  // Quick Metrics
  const totalMatches = suppliers.length
  const strongMatches = displayedSuppliers.filter((s) => s.requirementFit >= 75).length
  const passportActive = preferredSuppliers.length
  const criticalGapsCount = displayedSuppliers.filter((s) => s.criticalGaps && s.criticalGaps.length > 0).length

  const showNotification = (msg, type = "success") => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 4000)
  }

  const handleOpenRFI = (supplier) => {
    setSelectedSupplierForRFI(supplier)
  }

  const handleToggleShortlist = (supplier) => {
    if (isShortlisted(supplier.id)) {
      removeFromShortlist(supplier.id)
      showNotification(`${supplier.name} removed from shortlist.`)
    } else {
      addToShortlist(supplier)
      showNotification(`${supplier.name} added to procurement shortlist.`)
    }
  }

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
      {notification && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 1200,
            background: notification.type === "success" ? "#2E7D32" : "#4A352F",
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
          <CheckCircle size={18} />
          {notification.msg}
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <FolderCheck size={28} color="#4A352F" />
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700, color: "#4A352F" }}>
            Preferred Suppliers
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#8D6E63", maxWidth: "800px" }}>
          Identify pre-qualified suppliers meeting enterprise passport, statutory compliance, and BIG score standards. Search Preferred Suppliers first, or extend discovery to the full directory.
        </p>
      </div>

      {/* Primary Directory Mode Switch Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
          borderBottom: "1px solid #E8D5C4",
          paddingBottom: "12px",
        }}
      >
        <button
          type="button"
          onClick={() => setDirectoryTab("preferred")}
          style={{
            padding: "10px 20px",
            borderRadius: "6px",
            border: "none",
            background: directoryTab === "preferred" ? "#4A352F" : "#FFFFFF",
            color: directoryTab === "preferred" ? "#FAF7F2" : "#5D4037",
            fontSize: "0.85rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: directoryTab === "preferred" ? "0 2px 6px rgba(74,53,47,0.2)" : "0 1px 3px rgba(0,0,0,0.05)",
            border: directoryTab === "preferred" ? "none" : "1px solid #E6D7C3",
          }}
        >
          <ShieldCheck size={16} color={directoryTab === "preferred" ? "#4CAF50" : "#2E7D32"} />
          Preferred Suppliers ({passportActive})
        </button>

        <button
          type="button"
          onClick={() => setDirectoryTab("directory")}
          style={{
            padding: "10px 20px",
            borderRadius: "6px",
            border: "none",
            background: directoryTab === "directory" ? "#4A352F" : "#FFFFFF",
            color: directoryTab === "directory" ? "#FAF7F2" : "#5D4037",
            fontSize: "0.85rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: directoryTab === "directory" ? "0 2px 6px rgba(74,53,47,0.2)" : "0 1px 3px rgba(0,0,0,0.05)",
            border: directoryTab === "directory" ? "none" : "1px solid #E6D7C3",
          }}
        >
          <Building size={16} color={directoryTab === "directory" ? "#FAF7F2" : "#8D6E63"} />
          Full Supplier Directory ({totalMatches})
        </button>
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
        {/* Metric 1 */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E6D7C3",
            borderRadius: "10px",
            padding: "16px 20px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8D6E63", textTransform: "uppercase" }}>
            {directoryTab === "preferred" ? "Preferred Suppliers" : "Total Directory Suppliers"}
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#4A352F", marginTop: "4px" }}>
            {loading ? "..." : displayedSuppliers.length}
          </div>
          <div style={{ fontSize: "0.725rem", color: "#A89482", marginTop: "2px" }}>
            {directoryTab === "preferred" ? "Active Green Passport verified" : "Canonical supplier database"}
          </div>
        </div>

        {/* Metric 2 */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E6D7C3",
            borderRadius: "10px",
            padding: "16px 20px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8D6E63", textTransform: "uppercase" }}>
            High Alignment (≥75%)
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#2E7D32", marginTop: "4px" }}>
            {loading ? "..." : strongMatches}
          </div>
          <div style={{ fontSize: "0.725rem", color: "#A89482", marginTop: "2px" }}>
            Optimal category & criteria fit
          </div>
        </div>

        {/* Metric 3 */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E6D7C3",
            borderRadius: "10px",
            padding: "16px 20px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8D6E63", textTransform: "uppercase" }}>
            Passport Active
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1565C0", marginTop: "4px" }}>
            {loading ? "..." : passportActive}
          </div>
          <div style={{ fontSize: "0.725rem", color: "#A89482", marginTop: "2px" }}>
            Verified statutory compliance
          </div>
        </div>

        {/* Metric 4 */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E6D7C3",
            borderRadius: "10px",
            padding: "16px 20px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8D6E63", textTransform: "uppercase" }}>
            Readiness Gaps Identified
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#E65100", marginTop: "4px" }}>
            {loading ? "..." : criticalGapsCount}
          </div>
          <div style={{ fontSize: "0.725rem", color: "#A89482", marginTop: "2px" }}>
            Candidates for ESD Cohort support
          </div>
        </div>
      </div>

      {/* Error state (if any) */}
      {error && (
        <div
          style={{
            background: "#FFEBEE",
            border: "1px solid #FFCDD2",
            borderRadius: "8px",
            padding: "12px 16px",
            color: "#C62828",
            fontSize: "0.85rem",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      {/* Main Table */}
      <MatchedSuppliersTable
        suppliers={displayedSuppliers}
        loading={loading}
        error={error}
        onInspectSupplier={(supplier) => setSelectedSupplierForDetail(supplier.raw || supplier)}
        onOpenMatchReason={(supplier) => setSelectedSupplierForReason(supplier)}
        onOpenCompare={(suppliersList) => setSuppliersToCompare(suppliersList)}
        onOpenRFI={handleOpenRFI}
        onShortlist={handleToggleShortlist}
        demandContext={demandContext}
        isPreferredTab={directoryTab === "preferred"}
        onExtendSearch={() => setDirectoryTab("directory")}
      />

      {/* Explainable Fit Reason Drawer */}
      <MatchReasonDrawer
        isOpen={!!selectedSupplierForReason}
        onClose={() => setSelectedSupplierForReason(null)}
        supplier={selectedSupplierForReason}
        demandContext={demandContext}
        onOpenSupplierDetail={(supplier) => {
          setSelectedSupplierForReason(null)
          setSelectedSupplierForDetail(supplier.raw || supplier)
        }}
        onOpenRFI={(supplier) => {
          setSelectedSupplierForReason(null)
          handleOpenRFI(supplier)
        }}
        onShortlist={(supplier) => {
          handleToggleShortlist(supplier)
        }}
        isShortlisted={selectedSupplierForReason ? isShortlisted(selectedSupplierForReason.id) : false}
      />

      {/* Side-by-Side Comparison Modal */}
      {suppliersToCompare.length > 0 && (
        <SupplierCompareModal
          suppliers={suppliersToCompare}
          onClose={() => setSuppliersToCompare([])}
          onInspect={(supplier) => {
            setSuppliersToCompare([])
            setSelectedSupplierForDetail(supplier.raw || supplier)
          }}
        />
      )}

      {/* Supplier 360 Deep-Dive Modal */}
      {selectedSupplierForDetail && (
        <ProcurementSupplierModal
          supplier={selectedSupplierForDetail}
          onClose={() => setSelectedSupplierForDetail(null)}
          onOpenRFI={(supplier) => {
            setSelectedSupplierForDetail(null)
            handleOpenRFI(supplier)
          }}
          onRecordDecision={(supplier) => {
            setSelectedSupplierForDetail(null)
            setSelectedSupplierForDecision(supplier)
          }}
          onPortalHandoff={(supplier) => {
            setSelectedSupplierForDetail(null)
            setSelectedSupplierForHandoff(supplier)
          }}
        />
      )}

      {/* RFI Clarification Dialog */}
      {selectedSupplierForRFI && (
        <RFIDialogModal
          supplier={selectedSupplierForRFI}
          onClose={() => setSelectedSupplierForRFI(null)}
          onSubmit={({ questions, deadline, category }) => {
            createRFI({
              supplierId: selectedSupplierForRFI.id,
              supplierName: selectedSupplierForRFI.name,
              questions,
              deadline,
              category,
            })
            showNotification(`RFI dispatched to ${selectedSupplierForRFI.name}.`)
            setSelectedSupplierForRFI(null)
          }}
        />
      )}

      {/* Stage-Specific Decision Modal */}
      {selectedSupplierForDecision && (
        <StageDecisionModal
          supplier={selectedSupplierForDecision}
          onClose={() => setSelectedSupplierForDecision(null)}
          onSubmit={(decisionData) => {
            recordStageDecision({
              supplierId: selectedSupplierForDecision.id,
              supplierName: selectedSupplierForDecision.name,
              ...decisionData,
            })
            showNotification(`Stage decision recorded for ${selectedSupplierForDecision.name}.`)
            setSelectedSupplierForDecision(null)
          }}
        />
      )}

      {/* External Portal Registration Handoff Modal */}
      {selectedSupplierForHandoff && (
        <PortalRegistrationModal
          supplier={selectedSupplierForHandoff}
          portalUrl={buyerProfile?.currentEnvironment?.portalUrl || "https://suppliers.enterprise.com/register"}
          instructions={buyerProfile?.currentEnvironment?.onboardingInstructions || ""}
          onClose={() => setSelectedSupplierForHandoff(null)}
          onSubmit={(handoffData) => {
            recordPortalHandoff({
              supplierId: selectedSupplierForHandoff.id,
              supplierName: selectedSupplierForHandoff.name,
              ...handoffData,
            })
            showNotification(`Portal registration request dispatched to ${selectedSupplierForHandoff.name}.`)
            setSelectedSupplierForHandoff(null)
          }}
        />
      )}
    </div>
  )
}
