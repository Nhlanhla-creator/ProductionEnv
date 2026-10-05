"use client"

import React, { useState } from "react"
import {
  Users,
  Plus,
  Layers,
  Award,
  TrendingUp,
  DollarSign,
  Calendar,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Briefcase,
  Search,
} from "lucide-react"
import { useESDCohorts } from "../hooks/useESDCohorts"
import { useProcurementMatches } from "../hooks/useProcurementMatches"
import AddMemberModal from "./AddMemberModal"
import NewInterventionModal from "./NewInterventionModal"
import CreateCohortModal from "./CreateCohortModal"
import CohortDetailView from "./CohortDetailView"
import ProcurementSupplierModal from "../SupplierDetail/ProcurementSupplierModal"

export default function ESDCohortWorkspace() {
  const {
    cohorts,
    activeCohort,
    activeCohortId,
    setActiveCohortId,
    addCohort,
    addMemberToCohort,
    addInterventionToMember,
    updateInterventionStatus,
    removeMemberFromCohort,
    updateMemberStage,
  } = useESDCohorts()

  const { suppliers } = useProcurementMatches()

  // View state: 'list' or 'detail'
  const [currentView, setCurrentView] = useState("detail") // default to showing the active cohort in detail
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  // Modals state
  const [isCreateCohortOpen, setIsCreateCohortOpen] = useState(false)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [interventionModalState, setInterventionModalState] = useState({ isOpen: false, supplier: null })
  const [selectedSupplierFor360, setSelectedSupplierFor360] = useState(null)

  // Overall statistics
  const totalCohorts = cohorts.length
  const totalEnrolled = cohorts.reduce((acc, c) => acc + (c.members?.length || 0), 0)
  const allInterventionsCount = cohorts.reduce(
    (acc, c) => acc + (c.members?.reduce((mAcc, m) => mAcc + (m.interventions?.length || 0), 0) || 0),
    0
  )
  const totalAwards = cohorts.reduce(
    (acc, c) => acc + (c.members?.filter((m) => m.commercialStage === "Awarded").length || 0),
    0
  )

  const handleOpenAddIntervention = (supplier) => {
    setInterventionModalState({ isOpen: true, supplier })
  }

  const handleSelectCohortForDetail = (cohortId) => {
    setActiveCohortId(cohortId)
    setCurrentView("detail")
  }

  // Find supplier for 360 view
  const handleOpenSupplier360 = (member) => {
    const fullSupplier = suppliers.find((s) => s.id === member.supplierId) || {
      id: member.supplierId,
      name: member.supplierName,
      tradingName: member.supplierName,
      offeringCategory: member.category,
      location: member.location,
      bigScore: member.currentScore,
      verifiedCoverage: member.currentCoverage,
      bbbeeLevel: "Level 1",
      blackOwnershipPct: 100,
      blackWomenOwnershipPct: 51,
      youthOwnershipPct: 30,
      matchBreakdown: { semanticAiScore: 88, structuredScore: 82 },
      documentsCount: 6,
      documentsVerified: 5,
      coidaStatus: "Valid",
      taxPinStatus: "Valid",
      cipcStatus: "Active",
      statutoryGatePassed: true,
      turnoverBracket: "QSE (R10m - R50m)",
    }
    setSelectedSupplierFor360(fullSupplier)
  }

  // Filter cohorts for list view
  const filteredCohorts = cohorts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.sponsor.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || c.status.toLowerCase() === filterStatus.toLowerCase()
    return matchesSearch && matchesStatus
  })

  return (
    <div style={{ minHeight: "100%", backgroundColor: "#FAF7F2" }}>
      {/* If in detail view, render CohortDetailView */}
      {currentView === "detail" && activeCohort ? (
        <CohortDetailView
          cohort={activeCohort}
          onBack={() => setCurrentView("list")}
          onOpenAddMember={() => setIsAddMemberOpen(true)}
          onOpenAddIntervention={handleOpenAddIntervention}
          onUpdateInterventionStatus={updateInterventionStatus}
          onUpdateMemberStage={updateMemberStage}
          onRemoveMember={removeMemberFromCohort}
          onSelectSupplier={handleOpenSupplier360}
        />
      ) : (
        /* Cohort Hub & Overview List */
        <div style={{ padding: "28px 36px", maxWidth: "1400px", margin: "0 auto", boxSizing: "border-box" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                <span
                  style={{
                    background: "rgba(212, 175, 55, 0.2)",
                    color: "#5D4037",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    textTransform: "uppercase",
                  }}
                >
                  ESD & Supplier Incubation
                </span>
                <span style={{ fontSize: "0.8rem", color: "#8D6E63" }}>
                  B-BBEE Codes 400 & 500 Enterprise Development
                </span>
              </div>
              <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#4A352F", margin: 0 }}>
                Enterprise & Supplier Development (ESD) Cohort Workspace
              </h1>
              <p style={{ fontSize: "0.875rem", color: "#5D4037", margin: "6px 0 0 0" }}>
                Structure target SMME cohorts, baseline 5C constraints, assign developmental interventions, and govern commercial tender readiness.
              </p>
            </div>

            <button
              onClick={() => setIsCreateCohortOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 18px",
                background: "#4A352F",
                border: "none",
                borderRadius: "8px",
                color: "#FAF7F2",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(74, 53, 47, 0.2)",
              }}
            >
              <Plus size={16} /> Create New Cohort
            </button>
          </div>

          {/* Aggregate KPI Banner */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
              marginBottom: "28px",
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.775rem", fontWeight: 600, color: "#8D6E63" }}>Active Cohorts</span>
                <Layers size={18} color="#4A352F" />
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#4A352F", marginTop: "6px" }}>
                {totalCohorts}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#6D4C41", marginTop: "2px" }}>
                Structured incubation programs
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.775rem", fontWeight: 600, color: "#8D6E63" }}>Enrolled SMMEs</span>
                <Users size={18} color="#4A352F" />
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#4A352F", marginTop: "6px" }}>
                {totalEnrolled}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#2E7D32", marginTop: "2px" }}>
                100% Black-owned baseline pool
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.775rem", fontWeight: 600, color: "#8D6E63" }}>Development Interventions</span>
                <TrendingUp size={18} color="#D4AF37" />
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#D4AF37", marginTop: "6px" }}>
                {allInterventionsCount}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#6D4C41", marginTop: "2px" }}>
                Targeted technical & capital actions
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.775rem", fontWeight: 600, color: "#8D6E63" }}>Commercial Contracts Awarded</span>
                <Award size={18} color="#2E7D32" />
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#2E7D32", marginTop: "6px" }}>
                {totalAwards}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#2E7D32", marginTop: "2px" }}>
                Graduated into corporate supply chain
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: "1 1 300px", maxWidth: "450px" }}>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                }}
              >
                <Search size={16} color="#8D6E63" style={{ position: "absolute", left: "10px", top: "10px" }} />
                <input
                  type="text"
                  placeholder="Search cohorts by name, sponsor, category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px 8px 34px",
                    borderRadius: "6px",
                    border: "1px solid #C8B6A6",
                    fontSize: "0.825rem",
                    color: "#4A352F",
                    background: "#FFFFFF",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              {["all", "active", "planned"].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    fontSize: "0.775rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    textTransform: "capitalize",
                    background: filterStatus === st ? "#4A352F" : "#FFFFFF",
                    color: filterStatus === st ? "#FAF7F2" : "#6D4C41",
                    border: filterStatus === st ? "1px solid #4A352F" : "1px solid #C8B6A6",
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Cohorts Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
              gap: "20px",
            }}
          >
            {filteredCohorts.map((c) => {
              const membersCount = c.members?.length || 0
              const cAvgBaseline = membersCount > 0
                ? Math.round(c.members.reduce((acc, m) => acc + (m.baselineScore || 0), 0) / membersCount)
                : 0
              const cAvgCurrent = membersCount > 0
                ? Math.round(c.members.reduce((acc, m) => acc + (m.currentScore || 0), 0) / membersCount)
                : 0
              const delta = cAvgCurrent - cAvgBaseline

              return (
                <div
                  key={c.id}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E6D7C3",
                    borderRadius: "12px",
                    padding: "20px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                >
                  <div>
                    {/* Top status */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span
                        style={{
                          background: c.status === "Active" ? "rgba(46, 125, 50, 0.12)" : "#ECEFF1",
                          color: c.status === "Active" ? "#2E7D32" : "#546E7A",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        {c.status}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#8D6E63" }}>
                        {c.startDate} → {c.endDate}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#4A352F", margin: "0 0 6px 0" }}>
                      {c.name}
                    </h3>

                    <p style={{ fontSize: "0.8rem", color: "#6D4C41", margin: "0 0 14px 0", lineHeight: "1.4" }}>
                      {c.objective}
                    </p>

                    <div style={{ display: "grid", gap: "6px", fontSize: "0.75rem", color: "#5D4037", marginBottom: "16px" }}>
                      <div>
                        <strong>Sponsor:</strong> {c.sponsor}
                      </div>
                      <div>
                        <strong>Category:</strong> {c.category}
                      </div>
                      <div>
                        <strong>Budget Envelope:</strong> <span style={{ color: "#2E7D32", fontWeight: 700 }}>{c.budgetEnvelope}</span>
                      </div>
                      <div>
                        <strong>Lead Owner:</strong> {c.owner}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Stats & Action */}
                  <div>
                    <div
                      style={{
                        background: "#FAF7F2",
                        border: "1px solid #E8D5C4",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "14px",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "0.7rem", color: "#8D6E63", fontWeight: 600 }}>Enrolled SMMEs</div>
                        <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#4A352F" }}>
                          {membersCount} Suppliers
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.7rem", color: "#8D6E63", fontWeight: 600 }}>BIG Score Delta</div>
                        <div style={{ fontSize: "1rem", fontWeight: 800, color: "#4A352F" }}>
                          {cAvgCurrent}/100{" "}
                          {delta > 0 && <span style={{ color: "#2E7D32", fontSize: "0.8rem" }}>(+{delta})</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectCohortForDetail(c.id)}
                      style={{
                        width: "100%",
                        padding: "8px 14px",
                        background: "#4A352F",
                        border: "none",
                        borderRadius: "6px",
                        color: "#FAF7F2",
                        fontSize: "0.825rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      Manage Cohort & Development Plans <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal 1: Create New Cohort */}
      <CreateCohortModal
        isOpen={isCreateCohortOpen}
        onClose={() => setIsCreateCohortOpen(false)}
        onCreateCohort={addCohort}
      />

      {/* Modal 2: Enroll Member Supplier */}
      {activeCohort && (
        <AddMemberModal
          isOpen={isAddMemberOpen}
          onClose={() => setIsAddMemberOpen(false)}
          cohort={activeCohort}
          matchedSuppliers={suppliers}
          onEnrollSupplier={addMemberToCohort}
        />
      )}

      {/* Modal 3: Assign New Intervention */}
      {activeCohort && interventionModalState.supplier && (
        <NewInterventionModal
          isOpen={interventionModalState.isOpen}
          onClose={() => setInterventionModalState({ isOpen: false, supplier: null })}
          cohort={activeCohort}
          supplier={interventionModalState.supplier}
          onSaveIntervention={addInterventionToMember}
        />
      )}

      {/* Modal 4: Supplier 360 Deep-Dive Modal */}
      {selectedSupplierFor360 && (
        <ProcurementSupplierModal
          isOpen={!!selectedSupplierFor360}
          onClose={() => setSelectedSupplierFor360(null)}
          supplier={selectedSupplierFor360}
          onOpenRFI={() => {}}
        />
      )}
    </div>
  )
}
