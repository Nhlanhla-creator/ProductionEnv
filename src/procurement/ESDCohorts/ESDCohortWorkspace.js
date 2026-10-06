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
  Filter,
  FileText,
  Activity,
  ChevronRight,
} from "lucide-react"
import { useESDCohorts } from "../hooks/useESDCohorts"
import { useProcurementMatches } from "../hooks/useProcurementMatches"
import AddMemberModal from "./AddMemberModal"
import NewInterventionModal from "./NewInterventionModal"
import CreateCohortModal from "./CreateCohortModal"
import CohortDetailView from "./CohortDetailView"
import ProcurementSupplierModal from "../SupplierDetail/ProcurementSupplierModal"

const WORKFLOW_STAGES = [
  { id: "overview", label: "1. Overview", icon: Layers, description: "Program benchmarks & KPI targets" },
  { id: "applications", label: "2. Applications", icon: Briefcase, description: "Incoming SMME candidates" },
  { id: "matching", label: "3. Matching", icon: Search, description: "5C diagnostic & gap alignment" },
  { id: "cohorts", label: "4. Cohorts", icon: Users, description: "Structured incubation tracks" },
  { id: "tracking", label: "5. Tracking", icon: TrendingUp, description: "Interventions & commercial awards" },
]

const SAMPLE_APPLICATIONS = [
  {
    id: "app_01",
    companyName: "Kopanang Logistics & Transport",
    category: "Logistics & Freight",
    location: "eMalahleni, Mpumalanga",
    bigScore: 68,
    bbbeeLevel: "Level 1 (100% Black Owned)",
    status: "Under Review",
    appliedDate: "2026-10-01",
    diagnosticGap: "COIDA Renewal & OHS Compliance",
    targetTrack: "Engineering & Technical Services",
  },
  {
    id: "app_02",
    companyName: "Vukani Industrial Safety Gear",
    category: "PPE & Safety Equipment",
    location: "Kathu, Northern Cape",
    bigScore: 72,
    bbbeeLevel: "Level 1 (51% Black Women Owned)",
    status: "Pre-screened",
    appliedDate: "2026-09-28",
    diagnosticGap: "SABS Certification & Working Capital",
    targetTrack: "Manufacturing & Local Value-Add",
  },
  {
    id: "app_03",
    companyName: "Thola Mining Consumables",
    category: "Mining Consumables",
    location: "Rustenburg, North West",
    bigScore: 61,
    bbbeeLevel: "Level 2",
    status: "Under Review",
    appliedDate: "2026-09-24",
    diagnosticGap: "Financial Accounting & Tax Clearance Pin",
    targetTrack: "Mining & Industrial Supply",
  },
  {
    id: "app_04",
    companyName: "NexGen Waste & Recycling",
    category: "Cleaning & Waste Management",
    location: "Middelburg, Mpumalanga",
    bigScore: 74,
    bbbeeLevel: "Level 1 (Youth Owned)",
    status: "Approved for Cohort",
    appliedDate: "2026-09-15",
    diagnosticGap: "ISO 14001 Environmental Audit",
    targetTrack: "Sustainability & Green Services",
  },
]

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

  // Catalyst 5-stage workflow state
  const [currentStage, setCurrentStage] = useState("cohorts")
  // View state inside Cohorts: 'list' or 'detail'
  const [currentView, setCurrentView] = useState("detail")
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
    setCurrentStage("cohorts")
  }

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
      {/* 5-Stage Catalyst Workflow Header */}
      <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E8D5C4", padding: "16px 36px 0 36px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
              <span
                style={{
                  background: "rgba(212, 175, 55, 0.2)",
                  color: "#5D4037",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  textTransform: "uppercase",
                }}
              >
                ESD Programs
              </span>
              <span style={{ fontSize: "0.8rem", color: "#8D6E63" }}>
                End-to-End Enterprise Development Lifecycle
              </span>
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#4A352F", margin: 0 }}>
              Enterprise & Supplier Development (ESD) Programs
            </h1>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setIsCreateCohortOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
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
              <Plus size={15} /> Create New Cohort
            </button>
          </div>
        </div>

        {/* 5-Stage Pipeline Bar */}
        <div style={{ display: "flex", gap: "6px", overflowX: "auto" }}>
          {WORKFLOW_STAGES.map((st) => {
            const isActive = currentStage === st.id
            const Icon = st.icon
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setCurrentStage(st.id)}
                style={{
                  padding: "10px 16px",
                  border: "none",
                  background: isActive ? "#FAF7F2" : "transparent",
                  borderBottom: isActive ? "3px solid #4A352F" : "3px solid transparent",
                  color: isActive ? "#4A352F" : "#8D6E63",
                  fontSize: "0.825rem",
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                  borderRadius: "6px 6px 0 0",
                }}
              >
                <Icon size={15} color={isActive ? "#4A352F" : "#A89482"} />
                {st.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Stage 1: Overview */}
      {currentStage === "overview" && (
        <div style={{ padding: "28px 36px", maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "1.1rem", fontWeight: 700, color: "#4A352F" }}>
              ESD Program Overview & Governance
            </h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#8D6E63" }}>
              High-level diagnostics, incubation performance, and commercial graduation rates.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "10px", padding: "16px 20px" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8D6E63", textTransform: "uppercase" }}>Active Cohorts</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#4A352F", marginTop: "4px" }}>{totalCohorts}</div>
              <div style={{ fontSize: "0.725rem", color: "#6D4C41", marginTop: "2px" }}>Structured development tracks</div>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "10px", padding: "16px 20px" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8D6E63", textTransform: "uppercase" }}>Enrolled SMMEs</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#4A352F", marginTop: "4px" }}>{totalEnrolled}</div>
              <div style={{ fontSize: "0.725rem", color: "#6D4C41", marginTop: "2px" }}>Receiving targeted incubation</div>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "10px", padding: "16px 20px" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8D6E63", textTransform: "uppercase" }}>Active Interventions</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#D4AF37", marginTop: "4px" }}>{allInterventionsCount}</div>
              <div style={{ fontSize: "0.725rem", color: "#6D4C41", marginTop: "2px" }}>5C readiness gap closures</div>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "10px", padding: "16px 20px" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8D6E63", textTransform: "uppercase" }}>Graduated / Awarded</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#2E7D32", marginTop: "4px" }}>{totalAwards}</div>
              <div style={{ fontSize: "0.725rem", color: "#2E7D32", marginTop: "2px" }}>Tender contracts issued</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "10px", padding: "20px" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", fontWeight: 700, color: "#4A352F" }}>
                Program Strategic Objectives
              </h4>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.825rem", color: "#5D4037", lineHeight: "1.8" }}>
                <li>Close statutory compliance & certification gaps for local host community suppliers.</li>
                <li>Provide targeted grant & loan capital matching to finance equipment acquisition.</li>
                <li>Fast-track high-potential SMMEs from Tier 2/3 subcontracts to direct vendor contracts.</li>
                <li>Benchmark quarterly BIG score trajectory against sector enterprise baselines.</li>
              </ul>
            </div>

            <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "10px", padding: "20px" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", fontWeight: 700, color: "#4A352F" }}>
                Quick Actions
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setCurrentStage("applications")}
                  style={{
                    padding: "10px 16px",
                    background: "#FAF7F2",
                    border: "1px solid #C8B6A6",
                    borderRadius: "6px",
                    color: "#4A352F",
                    fontSize: "0.825rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>Review Incoming SMME Applications</span>
                  <ChevronRight size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStage("matching")}
                  style={{
                    padding: "10px 16px",
                    background: "#FAF7F2",
                    border: "1px solid #C8B6A6",
                    borderRadius: "6px",
                    color: "#4A352F",
                    fontSize: "0.825rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>Run 5C Diagnostic Gap Analysis</span>
                  <ChevronRight size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStage("cohorts")}
                  style={{
                    padding: "10px 16px",
                    background: "#FAF7F2",
                    border: "1px solid #C8B6A6",
                    borderRadius: "6px",
                    color: "#4A352F",
                    fontSize: "0.825rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>Manage Active Cohort Workspaces</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage 2: Applications */}
      {currentStage === "applications" && (
        <div style={{ padding: "28px 36px", maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "1.1rem", fontWeight: 700, color: "#4A352F" }}>
                Candidate SMME Applications
              </h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#8D6E63" }}>
                Suppliers who applied for enterprise development, incubation support, or localized supplier acceleration.
              </p>
            </div>
          </div>

          <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "10px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.825rem" }}>
              <thead>
                <tr style={{ background: "#4A352F", color: "#FAF7F2" }}>
                  <th style={{ padding: "12px 16px" }}>Candidate Entity</th>
                  <th style={{ padding: "12px 16px" }}>Category</th>
                  <th style={{ padding: "12px 16px" }}>Location</th>
                  <th style={{ padding: "12px 16px" }}>BIG Score</th>
                  <th style={{ padding: "12px 16px" }}>Key Diagnostic Gap</th>
                  <th style={{ padding: "12px 16px" }}>Target Track</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_APPLICATIONS.map((app) => (
                  <tr key={app.id} style={{ borderBottom: "1px solid #F0E6D8" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#4A352F" }}>
                      {app.companyName}
                      <div style={{ fontSize: "0.725rem", color: "#8D6E63", fontWeight: 400 }}>{app.bbbeeLevel}</div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#5D4037" }}>{app.category}</td>
                    <td style={{ padding: "12px 16px", color: "#5D4037" }}>{app.location}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#4A352F" }}>{app.bigScore}%</td>
                    <td style={{ padding: "12px 16px", color: "#C62828" }}>{app.diagnosticGap}</td>
                    <td style={{ padding: "12px 16px", color: "#5D4037" }}>{app.targetTrack}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "12px",
                          fontSize: "0.725rem",
                          fontWeight: 600,
                          background: app.status === "Approved for Cohort" ? "#E8F5E9" : "#FFF3E0",
                          color: app.status === "Approved for Cohort" ? "#2E7D32" : "#E65100",
                        }}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentStage("cohorts")
                          setIsAddMemberOpen(true)
                        }}
                        style={{
                          padding: "5px 12px",
                          background: "#4A352F",
                          border: "none",
                          borderRadius: "4px",
                          color: "#FAF7F2",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Enroll
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stage 3: Matching */}
      {currentStage === "matching" && (
        <div style={{ padding: "28px 36px", maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "1.1rem", fontWeight: 700, color: "#4A352F" }}>
              5C Diagnostic Matching & Gap Identification
            </h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#8D6E63" }}>
              Automated multi-factor evaluation of compliance, capital, capacity, character, and collateral readiness gaps.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            {[
              { dim: "Compliance Gate", gapCount: 14, focus: "Tax, COIDA, SABS", color: "#D32F2F" },
              { dim: "Commercial Capacity", gapCount: 8, focus: "Turnover, Staff, SLA", color: "#E65100" },
              { dim: "Capital & Cashflow", gapCount: 12, focus: "Working capital, PO finance", color: "#F57C00" },
              { dim: "Character / Governance", gapCount: 5, focus: "Audited books, Policies", color: "#1976D2" },
              { dim: "Contract Readiness", gapCount: 7, focus: "Legal review, SHEQ manuals", color: "#388E3C" },
            ].map((d) => (
              <div key={d.dim} style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "10px", padding: "16px 20px" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#4A352F" }}>{d.dim}</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: d.color, marginTop: "4px" }}>{d.gapCount} Identified</div>
                <div style={{ fontSize: "0.725rem", color: "#8D6E63", marginTop: "2px" }}>Focus: {d.focus}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "10px", padding: "24px", textAlign: "center" }}>
            <Activity size={36} color="#8D6E63" style={{ marginBottom: "8px" }} />
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#4A352F" }}>
              Match SMMEs with Targeted Interventions
            </div>
            <p style={{ fontSize: "0.825rem", color: "#8D6E63", maxWidth: "600px", margin: "6px auto 16px" }}>
              Matching rules pair suppliers exhibiting critical compliance or operational gaps with certified training providers, grant funding programs, or enterprise sponsors.
            </p>
            <button
              type="button"
              onClick={() => setCurrentStage("cohorts")}
              style={{
                padding: "9px 20px",
                background: "#4A352F",
                color: "#FAF7F2",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.825rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Open Cohorts Workspace →
            </button>
          </div>
        </div>
      )}

      {/* Stage 4: Cohorts */}
      {currentStage === "cohorts" && (
        <>
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
            <div style={{ padding: "28px 36px", maxWidth: "1400px", margin: "0 auto", boxSizing: "border-box" }}>
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
                  <div style={{ position: "relative", width: "100%" }}>
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
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
                        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                        padding: "22px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onClick={() => handleSelectCohortForDetail(c.id)}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                          <span
                            style={{
                              background: c.status === "Active" ? "#E8F5E9" : "#FFF8E1",
                              color: c.status === "Active" ? "#2E7D32" : "#F57F17",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: "4px",
                              textTransform: "uppercase",
                            }}
                          >
                            {c.status}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "#8D6E63" }}>
                            {c.members?.length || 0} SMMEs Enrolled
                          </span>
                        </div>

                        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#4A352F", margin: "0 0 6px 0" }}>
                          {c.name}
                        </h3>
                        <p style={{ fontSize: "0.8rem", color: "#6D4C41", margin: "0 0 14px 0", lineHeight: "1.4" }}>
                          {c.description}
                        </p>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: "#FAF7F2", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
                          <div>
                            <div style={{ fontSize: "0.7rem", color: "#8D6E63" }}>Category Focus</div>
                            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#4A352F" }}>{c.category}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: "0.7rem", color: "#8D6E63" }}>Corporate Sponsor</div>
                            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#4A352F" }}>{c.sponsor}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: "0.7rem", color: "#8D6E63" }}>Score Improvement</div>
                            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: delta >= 0 ? "#2E7D32" : "#D32F2F" }}>
                              {delta >= 0 ? `+${delta}%` : `${delta}%`} ({cAvgBaseline}% → {cAvgCurrent}%)
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: "0.7rem", color: "#8D6E63" }}>Target Completion</div>
                            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#4A352F" }}>{c.endDate || "Ongoing"}</div>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectCohortForDetail(c.id)
                        }}
                        style={{
                          width: "100%",
                          padding: "10px",
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
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Stage 5: Tracking */}
      {currentStage === "tracking" && (
        <div style={{ padding: "28px 36px", maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "1.1rem", fontWeight: 700, color: "#4A352F" }}>
              Development Tracking, Interventions & Commercial Graduation
            </h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#8D6E63" }}>
              Monitor intervention progress, score deltas, and commercial contract awards across all enrolled SMMEs.
            </p>
          </div>

          <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "10px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.825rem" }}>
              <thead>
                <tr style={{ background: "#4A352F", color: "#FAF7F2" }}>
                  <th style={{ padding: "12px 16px" }}>Enrolled Supplier</th>
                  <th style={{ padding: "12px 16px" }}>Cohort Track</th>
                  <th style={{ padding: "12px 16px" }}>Baseline Score</th>
                  <th style={{ padding: "12px 16px" }}>Current Score</th>
                  <th style={{ padding: "12px 16px" }}>Improvement</th>
                  <th style={{ padding: "12px 16px" }}>Active Interventions</th>
                  <th style={{ padding: "12px 16px" }}>Commercial Stage</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.flatMap((c) =>
                  (c.members || []).map((m) => {
                    const delta = (m.currentScore || 0) - (m.baselineScore || 0)
                    return (
                      <tr key={m.supplierId} style={{ borderBottom: "1px solid #F0E6D8" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: "#4A352F" }}>
                          {m.supplierName}
                          <div style={{ fontSize: "0.725rem", color: "#8D6E63", fontWeight: 400 }}>{m.category}</div>
                        </td>
                        <td style={{ padding: "12px 16px", color: "#5D4037" }}>{c.name}</td>
                        <td style={{ padding: "12px 16px", color: "#8D6E63" }}>{m.baselineScore}%</td>
                        <td style={{ padding: "12px 16px", fontWeight: 700, color: "#4A352F" }}>{m.currentScore}%</td>
                        <td style={{ padding: "12px 16px", fontWeight: 700, color: delta >= 0 ? "#2E7D32" : "#D32F2F" }}>
                          {delta >= 0 ? `+${delta}%` : `${delta}%`}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#5D4037" }}>
                          {m.interventions?.length || 0} assigned
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "12px",
                              fontSize: "0.725rem",
                              fontWeight: 600,
                              background: m.commercialStage === "Awarded" ? "#E8F5E9" : "#F5F0E1",
                              color: m.commercialStage === "Awarded" ? "#2E7D32" : "#5D4037",
                            }}
                          >
                            {m.commercialStage || "Enrolled"}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
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
