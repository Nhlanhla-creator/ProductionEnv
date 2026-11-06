"use client"

import React, { useState, useMemo } from "react"
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
  Settings,
  BarChart3,
  Lock,
  Sparkles,
  Building,
  Target,
  ExternalLink,
} from "lucide-react"
import { useESDCohorts } from "../hooks/useESDCohorts"
import { useProcurementMatches } from "../hooks/useProcurementMatches"
import AddMemberModal from "./AddMemberModal"
import NewInterventionModal from "./NewInterventionModal"
import CreateCohortModal from "./CreateCohortModal"
import CohortDetailView from "./CohortDetailView"
import ProcurementSupplierModal from "../SupplierDetail/ProcurementSupplierModal"

const ESD_TABS = [
  { id: "setup", label: "Program Setup", icon: Settings, description: "Add & configure ED, SD, or ESD programs" },
  { id: "matching", label: "Matching", icon: Search, description: "Auto-matched & applied supplier candidates" },
  { id: "cohorts", label: "Cohorts", icon: Users, description: "Accepted/enrolled supplier tracks & tracking" },
  { id: "portfolio", label: "Portfolio", icon: BarChart3, description: "Multi-program overview & enterprise analytics" },
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
    source: "Applied",
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
    source: "Applied",
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
    source: "Applied",
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
    source: "Applied",
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

  // Catalyst 4-tab workflow state
  const [activeTab, setActiveTab] = useState("cohorts") // setup | matching | cohorts | portfolio
  const [currentView, setCurrentView] = useState("detail") // 'list' | 'detail' inside Cohorts
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [matchingSourceFilter, setMatchingSourceFilter] = useState("all") // 'all' | 'auto' | 'applied'

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
    setActiveTab("cohorts")
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
      passportStatus: "Active",
      passportLabel: "Passport Active",
      raw: {},
    }
    setSelectedSupplierFor360(fullSupplier)
  }

  // Combined matching candidates pool: Auto-Matched suppliers + Applied candidates
  const combinedMatchingCandidates = useMemo(() => {
    const autoList = suppliers.map((s) => ({
      id: s.id,
      companyName: s.name,
      category: s.offeringCategory,
      location: s.location,
      bigScore: s.bigScore || 70,
      bbbeeLevel: s.bbbeeLevel || "Level 1",
      diagnosticGap: (s.criticalGaps && s.criticalGaps[0]) || "Statutory Gate Renewal",
      targetTrack: s.offeringCategory,
      source: "Auto-Matched",
      status: s.passportStatus === "Active" ? "Passport Verified" : "Readiness Gap Detected",
      rawSupplier: s,
    }))

    const appliedList = SAMPLE_APPLICATIONS.map((app) => ({
      ...app,
      source: "Applied",
      rawSupplier: {
        id: app.id,
        name: app.companyName,
        offeringCategory: app.category,
        location: app.location,
        bigScore: app.bigScore,
        bbbeeLevel: app.bbbeeLevel,
        verifiedCoverage: 75,
        criticalGaps: [app.diagnosticGap],
      },
    }))

    return [...autoList, ...appliedList]
  }, [suppliers])

  const filteredMatchingCandidates = useMemo(() => {
    return combinedMatchingCandidates.filter((item) => {
      const matchSearch =
        item.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase())
      const matchSource =
        matchingSourceFilter === "all" ||
        (matchingSourceFilter === "auto" && item.source === "Auto-Matched") ||
        (matchingSourceFilter === "applied" && item.source === "Applied")
      return matchSearch && matchSource
    })
  }, [combinedMatchingCandidates, searchTerm, matchingSourceFilter])

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
      {/* 4-Tab Catalyst Restructured Header */}
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
                Enterprise & Supplier Development Lifecycle (Catalyst Restructured)
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
              <Plus size={15} /> Add Program (ED / SD / ESD)
            </button>
          </div>
        </div>

        {/* 4 Core Tabs Navigation */}
        <div style={{ display: "flex", gap: "6px", overflowX: "auto" }}>
          {ESD_TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "10px 18px",
                  border: "none",
                  background: isActive ? "#FAF7F2" : "transparent",
                  borderBottom: isActive ? "3px solid #4A352F" : "3px solid transparent",
                  color: isActive ? "#4A352F" : "#8D6E63",
                  fontSize: "0.85rem",
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  whiteSpace: "nowrap",
                  borderRadius: "6px 6px 0 0",
                }}
              >
                <Icon size={16} color={isActive ? "#4A352F" : "#A89482"} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: PROGRAM SETUP */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "setup" && (
        <div style={{ padding: "28px 36px", maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "1.1rem", fontWeight: 700, color: "#4A352F" }}>
              Program Setup & Development Tracks
            </h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#8D6E63" }}>
              Add and configure Enterprise Development (ED), Supplier Development (SD), or combined ESD programs without re-entering corporate profile data.
            </p>
          </div>

          {/* Quick Track Selection Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "10px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <span style={{ background: "#E8F5E9", color: "#2E7D32", padding: "2px 8px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700 }}>
                  TRACK 1
                </span>
                <span style={{ fontSize: "0.75rem", color: "#8D6E63" }}>5 B-BBEE Points</span>
              </div>
              <h4 style={{ margin: "0 0 6px", fontSize: "1rem", fontWeight: 700, color: "#4A352F" }}>
                Enterprise Development (ED)
              </h4>
              <p style={{ margin: "0 0 16px", fontSize: "0.8rem", color: "#6D4C41", lineHeight: "1.4" }}>
                Target exempt micro-enterprises (EMEs) and qualifying small enterprises (QSEs) not currently on your direct vendor list.
              </p>
              <button
                onClick={() => setIsCreateCohortOpen(true)}
                style={{
                  padding: "7px 14px",
                  background: "#4A352F",
                  color: "#FAF7F2",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "0.775rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Plus size={13} /> Add ED Program
              </button>
            </div>

            <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "10px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <span style={{ background: "#E3F2FD", color: "#1565C0", padding: "2px 8px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700 }}>
                  TRACK 2
                </span>
                <span style={{ fontSize: "0.75rem", color: "#8D6E63" }}>10 B-BBEE Points</span>
              </div>
              <h4 style={{ margin: "0 0 6px", fontSize: "1rem", fontWeight: 700, color: "#4A352F" }}>
                Supplier Development (SD)
              </h4>
              <p style={{ margin: "0 0 16px", fontSize: "0.8rem", color: "#6D4C41", lineHeight: "1.4" }}>
                Focus on active supply chain vendors to close operational capacity gaps and expand purchase order allocations.
              </p>
              <button
                onClick={() => setIsCreateCohortOpen(true)}
                style={{
                  padding: "7px 14px",
                  background: "#4A352F",
                  color: "#FAF7F2",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "0.775rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Plus size={13} /> Add SD Program
              </button>
            </div>

            <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "10px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <span style={{ background: "#FFF3E0", color: "#E65100", padding: "2px 8px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700 }}>
                  TRACK 3
                </span>
                <span style={{ fontSize: "0.75rem", color: "#8D6E63" }}>Full ESD Suite</span>
              </div>
              <h4 style={{ margin: "0 0 6px", fontSize: "1rem", fontWeight: 700, color: "#4A352F" }}>
                Combined (ESD) Accelerator
              </h4>
              <p style={{ margin: "0 0 16px", fontSize: "0.8rem", color: "#6D4C41", lineHeight: "1.4" }}>
                End-to-end pipeline providing diagnostic auditing, grant/loan capital matching, and guaranteed tender access.
              </p>
              <button
                onClick={() => setIsCreateCohortOpen(true)}
                style={{
                  padding: "7px 14px",
                  background: "#4A352F",
                  color: "#FAF7F2",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "0.775rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Plus size={13} /> Add Combined ESD
              </button>
            </div>
          </div>

          {/* Configured Active Programs Overview Table */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "10px", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #E6D7C3", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#4A352F" }}>
                Configured Development Programs ({cohorts.length})
              </h4>
              <button
                onClick={() => setIsCreateCohortOpen(true)}
                style={{
                  padding: "6px 12px",
                  background: "#FAF7F2",
                  border: "1px solid #4A352F",
                  borderRadius: "6px",
                  color: "#4A352F",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                + New Program Setup
              </button>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.825rem" }}>
              <thead>
                <tr style={{ background: "#F5EFEB", borderBottom: "1px solid #E6D7C3" }}>
                  <th style={{ padding: "12px 16px", color: "#4A352F" }}>Program Name</th>
                  <th style={{ padding: "12px 16px", color: "#4A352F" }}>Track Type</th>
                  <th style={{ padding: "12px 16px", color: "#4A352F" }}>Sponsor & Envelope</th>
                  <th style={{ padding: "12px 16px", color: "#4A352F" }}>Category & Sites</th>
                  <th style={{ padding: "12px 16px", color: "#4A352F" }}>Enrolled SMMEs</th>
                  <th style={{ padding: "12px 16px", color: "#4A352F", textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.map((c) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #F0E6D8" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "#4A352F" }}>
                      {c.name}
                      <div style={{ fontSize: "0.725rem", color: "#8D6E63", fontWeight: 400 }}>{c.owner}</div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "0.725rem",
                          fontWeight: 700,
                          background:
                            c.programType === "ED"
                              ? "#E8F5E9"
                              : c.programType === "SD"
                              ? "#E3F2FD"
                              : "#FFF3E0",
                          color:
                            c.programType === "ED"
                              ? "#2E7D32"
                              : c.programType === "SD"
                              ? "#1565C0"
                              : "#E65100",
                        }}
                      >
                        {c.programType || "ESD"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#5D4037" }}>
                      <div>{c.sponsor}</div>
                      <div style={{ fontSize: "0.725rem", color: "#2E7D32", fontWeight: 600 }}>{c.budgetEnvelope}</div>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#5D4037" }}>
                      <div>{c.category}</div>
                      <div style={{ fontSize: "0.725rem", color: "#8D6E63" }}>{c.sites?.join(", ") || "National"}</div>
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "#4A352F" }}>
                      {c.members?.length || 0} SMMEs
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <span style={{ padding: "3px 8px", borderRadius: "10px", fontSize: "0.725rem", fontWeight: 600, background: "#E8F5E9", color: "#2E7D32" }}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: MATCHING (AUTO-MATCHED + APPLIED CANDIDATES) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "matching" && (
        <div style={{ padding: "28px 36px", maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "1.1rem", fontWeight: 700, color: "#4A352F" }}>
                Matching Candidates (Auto-Matched & Applied)
              </h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#8D6E63" }}>
                Consolidated pool of algorithmic matches from your directory and incoming applicant SMMEs for ESD cohort onboarding.
              </p>
            </div>

            {/* Filter Toggle: All vs Auto-Matched vs Applied */}
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                { id: "all", label: `All Candidates (${combinedMatchingCandidates.length})` },
                { id: "auto", label: `Auto-Matched (${suppliers.length})` },
                { id: "applied", label: `Applied (${SAMPLE_APPLICATIONS.length})` },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setMatchingSourceFilter(pill.id)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "6px",
                    fontSize: "0.775rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: matchingSourceFilter === pill.id ? "#4A352F" : "#FFFFFF",
                    color: matchingSourceFilter === pill.id ? "#FAF7F2" : "#6D4C41",
                    border: matchingSourceFilter === pill.id ? "1px solid #4A352F" : "1px solid #C8B6A6",
                  }}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ marginBottom: "16px", position: "relative", maxWidth: "420px" }}>
            <Search size={16} color="#8D6E63" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search candidate by company, category, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 36px",
                borderRadius: "6px",
                border: "1px solid #C8B6A6",
                background: "#FFFFFF",
                fontSize: "0.825rem",
                color: "#4A352F",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Unified Matching Candidates Table */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "10px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.825rem" }}>
              <thead>
                <tr style={{ background: "#4A352F", color: "#FAF7F2" }}>
                  <th style={{ padding: "12px 16px" }}>Candidate Entity</th>
                  <th style={{ padding: "12px 16px" }}>Source</th>
                  <th style={{ padding: "12px 16px" }}>Category & Location</th>
                  <th style={{ padding: "12px 16px", textAlign: "center" }}>BIG Score</th>
                  <th style={{ padding: "12px 16px" }}>Primary 5C Diagnostic Gap</th>
                  <th style={{ padding: "12px 16px" }}>Target Track</th>
                  <th style={{ padding: "12px 16px", textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMatchingCandidates.map((cand) => (
                  <tr key={cand.id} style={{ borderBottom: "1px solid #F0E6D8" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "#4A352F" }}>
                      {cand.companyName}
                      <div style={{ fontSize: "0.725rem", color: "#8D6E63", fontWeight: 400 }}>{cand.bbbeeLevel}</div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "10px",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          background: cand.source === "Auto-Matched" ? "rgba(212, 175, 55, 0.18)" : "#E3F2FD",
                          color: cand.source === "Auto-Matched" ? "#5D4037" : "#1565C0",
                        }}
                      >
                        {cand.source}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#5D4037" }}>
                      <div>{cand.category}</div>
                      <div style={{ fontSize: "0.725rem", color: "#8D6E63" }}>{cand.location}</div>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: 800, color: "#4A352F" }}>
                      {cand.bigScore}%
                    </td>
                    <td style={{ padding: "14px 16px", color: "#C62828", fontWeight: 500 }}>
                      {cand.diagnosticGap}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#5D4037" }}>
                      {cand.targetTrack}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("cohorts")
                          setIsAddMemberOpen(true)
                        }}
                        style={{
                          padding: "6px 14px",
                          background: "#4A352F",
                          border: "none",
                          borderRadius: "4px",
                          color: "#FAF7F2",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Enroll into Cohort
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: COHORTS (ACCEPTED / ENROLLED SUPPLIERS & TRACKING) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "cohorts" && (
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
                          {c.objective || c.description}
                        </p>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: "#FAF7F2", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
                          <div>
                            <div style={{ fontSize: "0.7rem", color: "#8D6E63" }}>Program Track</div>
                            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#4A352F" }}>{c.programType || "ESD"}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: "0.7rem", color: "#8D6E63" }}>Corporate Sponsor</div>
                            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#4A352F" }}>{c.sponsor}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: "0.7rem", color: "#8D6E63" }}>Improvement Score</div>
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

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: PORTFOLIO (OVERVIEW OF ALL PROGRAMS) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "portfolio" && (
        <div style={{ padding: "28px 36px", maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "1.1rem", fontWeight: 700, color: "#4A352F" }}>
              ESD Portfolio Executive Overview
            </h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#8D6E63" }}>
              Multi-program performance dashboard, B-BBEE scorecard recognition, and commercial contract allocation.
            </p>
          </div>

          {/* Key Metrics Bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "10px", padding: "16px 20px" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8D6E63", textTransform: "uppercase" }}>Active Programs</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#4A352F", marginTop: "4px" }}>{totalCohorts}</div>
              <div style={{ fontSize: "0.725rem", color: "#6D4C41", marginTop: "2px" }}>ED, SD, & ESD combined tracks</div>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "10px", padding: "16px 20px" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8D6E63", textTransform: "uppercase" }}>Enrolled SMMEs</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#4A352F", marginTop: "4px" }}>{totalEnrolled}</div>
              <div style={{ fontSize: "0.725rem", color: "#6D4C41", marginTop: "2px" }}>Active developmental incubation</div>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "10px", padding: "16px 20px" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8D6E63", textTransform: "uppercase" }}>Active Interventions</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#D4AF37", marginTop: "4px" }}>{allInterventionsCount}</div>
              <div style={{ fontSize: "0.725rem", color: "#6D4C41", marginTop: "2px" }}>Targeted 5C gap closures</div>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "10px", padding: "16px 20px" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8D6E63", textTransform: "uppercase" }}>Commercial Awards</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#2E7D32", marginTop: "4px" }}>{totalAwards}</div>
              <div style={{ fontSize: "0.725rem", color: "#2E7D32", marginTop: "2px" }}>Direct procurement contracts issued</div>
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
                Quick Portfolio Actions
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("setup")}
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
                  <span>Configure Program Tracks (ED, SD, ESD)</span>
                  <ChevronRight size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("matching")}
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
                  <span>Review Matching Candidates & 5C Gaps</span>
                  <ChevronRight size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("cohorts")}
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
                  <span>Open Active Cohorts & Member Workspaces</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modals ─── */}
      <CreateCohortModal
        isOpen={isCreateCohortOpen}
        onClose={() => setIsCreateCohortOpen(false)}
        onCreateCohort={addCohort}
      />

      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        cohortId={activeCohort?.id}
        cohortName={activeCohort?.name}
        suppliers={suppliers}
        onAddMember={addMemberToCohort}
      />

      <NewInterventionModal
        isOpen={interventionModalState.isOpen}
        onClose={() => setInterventionModalState({ isOpen: false, supplier: null })}
        supplier={interventionModalState.supplier}
        cohortId={activeCohort?.id}
        onAddIntervention={addInterventionToMember}
      />

      {selectedSupplierFor360 && (
        <ProcurementSupplierModal
          supplier={selectedSupplierFor360}
          isOpen={!!selectedSupplierFor360}
          onClose={() => setSelectedSupplierFor360(null)}
          onOpenRFI={(s) => {
            setSelectedSupplierFor360(null)
          }}
        />
      )}
    </div>
  )
}
