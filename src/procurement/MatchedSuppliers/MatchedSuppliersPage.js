"use client"

import React, { useState } from "react"
import {
  HeartHandshake,
  Users,
  ShieldCheck,
  AlertTriangle,
  Scale,
  Sparkles,
  Download,
  Filter,
  CheckCircle,
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

  // Modals & Drawers state
  const [selectedSupplierForReason, setSelectedSupplierForReason] = useState(null)
  const [selectedSupplierForDetail, setSelectedSupplierForDetail] = useState(null)
  const [selectedSupplierForRFI, setSelectedSupplierForRFI] = useState(null)
  const [selectedSupplierForDecision, setSelectedSupplierForDecision] = useState(null)
  const [selectedSupplierForHandoff, setSelectedSupplierForHandoff] = useState(null)
  const [suppliersToCompare, setSuppliersToCompare] = useState([])
  const [notification, setNotification] = useState(null)

  // Quick Metrics
  const totalMatches = suppliers.length
  const strongMatches = suppliers.filter((s) => s.requirementFit >= 75).length
  const passportActive = suppliers.filter((s) => s.passportStatus === "Active").length
  const criticalGapsCount = suppliers.filter((s) => s.criticalGaps && s.criticalGaps.length > 0).length

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
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <HeartHandshake size={28} color="#4A352F" />
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700, color: "#4A352F" }}>
            Matched Suppliers Explorer
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#8D6E63", maxWidth: "800px" }}>
          Buyer view of shared platform data. Discover pre-vetted suppliers matched against your organisation's demand context,
          inspect explainable BIG scores, review verified statutory credentials, and manage auditable interactions.
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
            Total Matched Suppliers
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#4A352F", marginTop: "4px" }}>
            {loading ? "..." : totalMatches}
          </div>
          <div style={{ fontSize: "0.725rem", color: "#A89482", marginTop: "2px" }}>
            From shared canonical database
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
            Fully verified statutory compliance
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

      {/* Main Matched Suppliers Table */}
      <MatchedSuppliersTable
        suppliers={suppliers}
        loading={loading}
        error={error}
        onInspectSupplier={(supplier) => setSelectedSupplierForDetail(supplier.raw || supplier)}
        onOpenMatchReason={(supplier) => setSelectedSupplierForReason(supplier)}
        onOpenCompare={(suppliersList) => setSuppliersToCompare(suppliersList)}
        onOpenRFI={handleOpenRFI}
        onShortlist={handleToggleShortlist}
        demandContext={demandContext}
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
      />

      {/* Supplier Compare Modal */}
      <SupplierCompareModal
        isOpen={suppliersToCompare.length > 0}
        onClose={() => setSuppliersToCompare([])}
        selectedSuppliers={suppliersToCompare}
        onOpenSupplierDetail={(supplier) => {
          setSuppliersToCompare([])
          setSelectedSupplierForDetail(supplier.raw || supplier)
        }}
      />

      {/* Procurement Supplier 360 Dossier Modal */}
      {selectedSupplierForDetail && (
        <ProcurementSupplierModal
          supplier={selectedSupplierForDetail}
          isOpen={!!selectedSupplierForDetail}
          onClose={() => setSelectedSupplierForDetail(null)}
          onOpenRFI={(s) => {
            setSelectedSupplierForDetail(null)
            setSelectedSupplierForRFI(s)
          }}
          onOpenPortalHandoff={(s) => {
            setSelectedSupplierForDetail(null)
            setSelectedSupplierForHandoff(s)
          }}
          onOpenStageDecision={(s) => {
            setSelectedSupplierForDetail(null)
            setSelectedSupplierForDecision(s)
          }}
          onToggleShortlist={handleToggleShortlist}
          isShortlisted={selectedSupplierForDetail ? isShortlisted(selectedSupplierForDetail.id) : false}
          supplierInteractions={interactions.filter((i) => i.supplierId === (selectedSupplierForDetail?.id || selectedSupplierForDetail?.supplierId))}
        />
      )}

      {/* RFI Modal */}
      {selectedSupplierForRFI && (
        <RFIDialogModal
          isOpen={!!selectedSupplierForRFI}
          onClose={() => setSelectedSupplierForRFI(null)}
          supplier={selectedSupplierForRFI}
          onSubmitRFI={async (payload) => {
            await createRFI(payload)
            showNotification(`Auditable RFI dispatched to ${payload.supplierName}.`)
          }}
        />
      )}

      {/* Stage-Gate Governance Decision Modal */}
      {selectedSupplierForDecision && (
        <StageDecisionModal
          isOpen={!!selectedSupplierForDecision}
          onClose={() => setSelectedSupplierForDecision(null)}
          supplier={selectedSupplierForDecision}
          buyerProfile={buyerProfile}
          onSaveDecision={async (dec) => {
            await recordStageDecision(dec)
            showNotification(`Stage-gate decision for ${dec.supplierName} recorded.`)
          }}
        />
      )}

      {/* External Portal Handoff Modal */}
      {selectedSupplierForHandoff && (
        <PortalRegistrationModal
          isOpen={!!selectedSupplierForHandoff}
          onClose={() => setSelectedSupplierForHandoff(null)}
          supplier={selectedSupplierForHandoff}
          buyerProfile={buyerProfile}
          onSaveHandoff={async (handoff) => {
            await recordPortalHandoff(handoff)
            showNotification(`External portal handoff reference saved for ${handoff.supplierName}.`)
          }}
        />
      )}
    </div>
  )
}
