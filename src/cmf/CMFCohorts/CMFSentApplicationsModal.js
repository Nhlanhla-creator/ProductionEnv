"use client"

import React, { useState, useMemo } from "react"
import {
  X, Send, Target, Eye, ListChecks, FilePlus, Search,
  BadgeCheck, ScrollText, Banknote, XCircle, Archive, ArrowRight,
  FileText, Shield, AlertCircle, FileCheck, CheckCircle, LogOut,
  Phone, Award, ClipboardCheck, TrendingUp, Trophy, Landmark,
  Briefcase, GraduationCap, DollarSign, Building, Check, Sparkles,
  Plus, Calendar, User, ShieldCheck
} from "lucide-react"

const formatCurrency = (amount) => {
  if (!amount || amount === "Not specified" || amount === "N/A") return "Not specified"
  if (typeof amount === "string") {
    if (amount.includes("R") || amount.includes("$") || amount.includes("€")) return amount
    return `R ${amount}`
  }
  return `R ${amount.toLocaleString()}`
}

const formatDate = (dateValue) => {
  if (!dateValue) return "Recently"
  let date
  if (typeof dateValue === "object" && typeof dateValue.toDate === "function") date = dateValue.toDate()
  else date = new Date(dateValue)
  if (isNaN(date.getTime())) return "Recently"
  return date.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })
}

export const getDealflowApplicationStatus = (app) => {
  if (!app) return { label: "—", isSuccess: false }
  const raw = String(app.status || app.pipelineStage || "").trim()
  const type = app.type || "Funder"
  const lower = raw.toLowerCase()

  let label = raw
  if (!raw || lower === "application sent" || lower === "sent" || lower === "applied") {
    label = type === "Advisor" ? "Contacted" : "Applied"
  } else if (lower === "under review" || lower === "in review") {
    label = type === "Catalyst" ? "Evaluation" : "Under Review"
  } else if (lower.includes("eval")) {
    label = "Evaluation"
  } else if (lower.includes("due diligence") || lower.includes("diligence")) {
    label = "Due Diligence"
  } else if (lower.includes("interview") || lower.includes("call")) {
    label = type === "Intern" ? "Contacted / Interview" : "Interviewing"
  } else if (lower.includes("decision")) {
    label = "Decision"
  } else if (lower.includes("term")) {
    label = type === "Intern" ? "Term Sheet Signed" : "Termsheet"
  } else if (lower.includes("offer")) {
    label = "Offer"
  } else if (lower.includes("funded")) {
    label = "Funded"
  } else if (lower.includes("admitted")) {
    label = "Admitted"
  } else if (lower.includes("engaged") || lower.includes("placed")) {
    label = "Engaged / Placed"
  } else if (lower.includes("contract")) {
    label = "Contract Signed"
  } else if (lower.includes("completed")) {
    label = "Completed"
  } else if (lower.includes("accept") || lower.includes("approv")) {
    label = "Accepted"
  } else if (lower.includes("declin") || lower.includes("reject")) {
    label = "Declined"
  } else if (lower.includes("close")) {
    label = "Closed"
  } else if (lower.includes("withdraw")) {
    label = "Withdrawn"
  } else {
    label = raw.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")
  }

  const labelLower = label.toLowerCase()
  const isSuccess = (
    labelLower.includes("funded") ||
    labelLower.includes("accepted") ||
    labelLower.includes("approved") ||
    labelLower.includes("admitted") ||
    labelLower.includes("engaged") ||
    labelLower.includes("placed") ||
    labelLower.includes("contract") ||
    labelLower.includes("completed")
  )

  return { label, isSuccess }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXACT SME-SIDE STAGE DEFINITIONS FOR ALL 4 PARTNER TYPES
// Mirrored directly from:
// - Funders: /funding-matches (funding-flow-pipeline.js)
// - Catalysts: /support-program-matches (stageConfig.js)
// - Advisors: /find-advisors (advisor-flow-pipeline.js)
// - Interns: /intern-matches-page (intern-deal-flow-pipeline.js)
// ─────────────────────────────────────────────────────────────────────────────

export const SME_DEALFLOW_PIPELINES = {
  Funder: {
    title: "DealFlow Pipeline",
    headerIcon: Landmark,
    subtitle: "Funder match dealflow progression, stage by stage",
    stages: [
      { id: "new_match", name: "New Match", icon: Target, statuses: ["new match", "match", "matched"], tooltip: "Funds matched to profile that haven't been acted on yet." },
      { id: "viewed", name: "Viewed", icon: Eye, statuses: ["viewed"], tooltip: "Funds opened but not shortlisted." },
      { id: "shortlisted", name: "Shortlisted", icon: ListChecks, statuses: ["shortlisted"], tooltip: "Funds saved as worth applying to." },
      { id: "started", name: "Application Started", icon: FilePlus, statuses: ["application started", "started", "draft"], tooltip: "Application opened but not yet submitted." },
      { id: "applied", name: "Applied", icon: Send, statuses: ["applied", "application sent", "sent"], tooltip: "Application submitted and with the funder." },
      { id: "review", name: "Under Review", icon: Search, statuses: ["under review", "in review", "review", "screening", "evaluation"], tooltip: "The funder is assessing the application." },
      { id: "accepted", name: "Accepted", icon: BadgeCheck, statuses: ["accepted", "approved"], tooltip: "Funding approved in principle." },
      { id: "termsheet", name: "Termsheet", icon: ScrollText, statuses: ["termsheet", "term sheet"], tooltip: "Terms issued and under negotiation." },
      { id: "funded", name: "Funded", icon: Banknote, statuses: ["funded", "disbursed", "completed"], tooltip: "Money committed and the deal is done." },
      // Terminal Stages (grouped in red box at end)
      { id: "declined", name: "Declined", icon: XCircle, terminal: true, statuses: ["declined", "rejected"], tooltip: "The funder passed, or application was withdrawn." },
      { id: "closed", name: "Closed", icon: Archive, terminal: true, statuses: ["closed"], tooltip: "Ended without a deal." },
    ]
  },

  Catalyst: {
    title: "Catalyst Pipeline",
    headerIcon: Briefcase,
    subtitle: "Accelerator & incubator match dealflow, stage by stage",
    stages: [
      { id: "matched", name: "Matched", icon: Target, statuses: ["matched", "match", "new match"], tooltip: "BIG identified the SME as potential fit, but not applied yet." },
      { id: "applied", name: "Applied", icon: FileText, statuses: ["applied", "application sent", "sent"], tooltip: "Application submitted and acknowledged." },
      { id: "evaluation", name: "Evaluation", icon: Search, statuses: ["evaluation", "under review", "in review", "screening"], tooltip: "Catalyst reviewing fit and cohort readiness." },
      { id: "dueDiligence", name: "Due Diligence", icon: Shield, statuses: ["due diligence", "shortlisted"], tooltip: "Detailed assessment and verification of SME information." },
      { id: "decision", name: "Decision", icon: AlertCircle, statuses: ["decision", "committee review", "interview", "pitch"], tooltip: "Catalyst making a final decision on whether to proceed." },
      { id: "offer", name: "Offer", icon: FileCheck, statuses: ["offer", "term sheet", "support approved"], tooltip: "Programme offer issued to the SME." },
      { id: "admitted", name: "Admitted", icon: CheckCircle, statuses: ["admitted", "active", "active support", "completed"], tooltip: "SME accepted the offer and is admitted into the programme." },
      // Terminal Stages
      { id: "declined", name: "Declined", icon: XCircle, terminal: true, statuses: ["declined", "support declined", "rejected"], tooltip: "Application did not proceed." },
      { id: "withdrawn", name: "Withdrawn", icon: LogOut, terminal: true, statuses: ["withdrawn", "closed"], tooltip: "Application was withdrawn." },
    ]
  },

  Advisor: {
    title: "DealFlow Pipeline",
    headerIcon: Briefcase,
    subtitle: "Advisor engagement dealflow, stage by stage",
    stages: [
      { id: "new_match", name: "New Match", icon: Target, statuses: ["new match", "match", "matched"], tooltip: "Advisors matched that haven't been acted on yet." },
      { id: "viewed", name: "Viewed", icon: Eye, statuses: ["viewed"], tooltip: "Profiles opened but not shortlisted." },
      { id: "shortlisted", name: "Shortlisted", icon: ListChecks, statuses: ["shortlisted"], tooltip: "Advisors flagged as worth approaching." },
      { id: "contacted", name: "Contacted", icon: Send, statuses: ["contacted", "applied", "application sent", "sent"], tooltip: "Connection request or application sent." },
      { id: "under_review", name: "Under Review", icon: Search, statuses: ["under review", "in review", "evaluation"], tooltip: "Advisor considering the engagement request." },
      { id: "interviewing", name: "Interviewing", icon: Phone, statuses: ["interviewing", "interview", "discovery call"], tooltip: "Introductory calls arranged or held." },
      { id: "accepted", name: "Accepted", icon: Award, statuses: ["accepted", "approved"], tooltip: "Advisor has agreed to work with SME." },
      { id: "engaged", name: "Engaged / Placed", icon: CheckCircle, statuses: ["engaged/placed", "engaged", "placed", "active", "completed"], tooltip: "Advisory engagement is live." },
      // Terminal Stages
      { id: "declined", name: "Declined", icon: XCircle, terminal: true, statuses: ["declined", "rejected"], tooltip: "Advisor declined, or request was withdrawn." },
      { id: "closed", name: "Closed", icon: Archive, terminal: true, statuses: ["closed"], tooltip: "Conversation ended without an engagement." },
    ]
  },

  Intern: {
    title: "Intern Pipeline",
    headerIcon: GraduationCap,
    subtitle: "Candidate internship dealflow, stage by stage",
    stages: [
      { id: "matched", name: "Matched", icon: Target, statuses: ["matched", "match", "new match"], tooltip: "Candidates matched to request not acted on yet." },
      { id: "shortlisted", name: "Shortlisted", icon: ListChecks, statuses: ["shortlisted"], tooltip: "Candidates flagged as worth pursuing." },
      { id: "requested", name: "Requested", icon: Send, statuses: ["requested"], tooltip: "Invited candidate to apply." },
      { id: "applied", name: "Applied", icon: FileText, statuses: ["applied", "application sent"], tooltip: "Application sent or candidate applied." },
      { id: "interviewed", name: "Contacted / Interview", icon: Phone, statuses: ["contacted/interview", "interviewed", "contacted", "interview"], tooltip: "Interview arranged or held." },
      { id: "confirmed", name: "Confirmed", icon: CheckCircle, statuses: ["confirmed"], tooltip: "Placement agreed in principle." },
      { id: "confirmed_ts", name: "Term Sheet Signed", icon: FileCheck, statuses: ["confirmed/term sheet sign", "term sheet signed", "term sheet"], tooltip: "Terms issued and signed." },
      { id: "accepted", name: "Accepted", icon: Award, statuses: ["accepted"], tooltip: "Offer accepted by candidate." },
      { id: "contract_signed", name: "Contract Signed", icon: ClipboardCheck, statuses: ["contract signed", "contract_signed"], tooltip: "Contract executed." },
      { id: "active", name: "Active", icon: TrendingUp, statuses: ["active", "active support"], tooltip: "Placement is running." },
      { id: "completed", name: "Completed", icon: Trophy, statuses: ["completed", "graduated"], tooltip: "Placement finished." },
      // Terminal Stages
      { id: "declined", name: "Declined", icon: XCircle, terminal: true, statuses: ["declined", "decline", "rejected", "closed"], tooltip: "Not taken forward or candidate withdrew." },
    ]
  }
}

// Helper to determine stage states (completed, current, upcoming, or terminal)
const resolveStageProgression = (pipelineConfig, currentStatus) => {
  const normStatus = String(currentStatus || "").toLowerCase().trim()
  const liveStages = pipelineConfig.stages.filter((s) => !s.terminal)
  const terminalStages = pipelineConfig.stages.filter((s) => s.terminal)

  // 1. Check if matches any terminal stage
  const activeTerminal = terminalStages.find((ts) =>
    ts.statuses.some((s) => normStatus.includes(s) || s === normStatus)
  )

  if (activeTerminal) {
    return {
      activeTerminalId: activeTerminal.id,
      currentLiveIndex: -1,
      isTerminal: true,
      currentStageName: activeTerminal.name,
      currentStageDesc: activeTerminal.tooltip,
      liveStages,
      terminalStages
    }
  }

  // 2. Match against live stages (find highest matching live stage)
  let matchedIndex = -1
  for (let i = liveStages.length - 1; i >= 0; i--) {
    const stage = liveStages[i]
    if (stage.statuses.some((s) => normStatus.includes(s) || s === normStatus)) {
      matchedIndex = i
      break
    }
  }

  // If no direct status match, default based on common patterns
  if (matchedIndex === -1) {
    if (normStatus.includes("appl") || normStatus.includes("sent")) {
      matchedIndex = liveStages.findIndex((s) => s.id === "applied" || s.id === "contacted")
    } else if (normStatus.includes("review") || normStatus.includes("eval")) {
      matchedIndex = liveStages.findIndex((s) => s.id === "review" || s.id === "evaluation" || s.id === "under_review")
    }
  }

  // Default to the first live stage after submission (usually "applied" or "contacted")
  if (matchedIndex === -1) {
    const appliedIdx = liveStages.findIndex((s) => s.id === "applied" || s.id === "contacted")
    matchedIndex = appliedIdx !== -1 ? appliedIdx : 0
  }

  const currentStage = liveStages[matchedIndex]

  return {
    activeTerminalId: null,
    currentLiveIndex: matchedIndex,
    isTerminal: false,
    currentStageName: currentStage?.name || "Application Sent",
    currentStageDesc: currentStage?.tooltip || "Application in progress",
    liveStages,
    terminalStages
  }
}

export default function CMFSentApplicationsModal({
  cohort,
  applications = [],
  onClose,
  onOpenApply
}) {
  const [selectedTypeTab, setSelectedTypeTab] = useState("all")
  const [selectedAppIndex, setSelectedAppIndex] = useState(0)

  // Distinct types among sent applications
  const applicationTypes = useMemo(() => {
    const types = new Set(applications.map((a) => a.type || "Funder"))
    return Array.from(types)
  }, [applications])

  // Filtered applications based on type tab
  const filteredApps = useMemo(() => {
    if (selectedTypeTab === "all") return applications
    return applications.filter((a) => (a.type || "Funder") === selectedTypeTab)
  }, [applications, selectedTypeTab])

  // Currently selected application
  const activeApp = filteredApps[selectedAppIndex] || filteredApps[0] || null
  const activeType = activeApp?.type || "Funder"

  // Get exact pipeline config for the active partner type
  const pipelineConfig = SME_DEALFLOW_PIPELINES[activeType] || SME_DEALFLOW_PIPELINES.Funder
  const HeaderIcon = pipelineConfig.headerIcon || Landmark

  // Progression analysis
  const {
    activeTerminalId,
    currentLiveIndex,
    isTerminal,
    currentStageName,
    currentStageDesc,
    liveStages,
    terminalStages
  } = useMemo(() => {
    return resolveStageProgression(pipelineConfig, activeApp?.status || activeApp?.pipelineStage || "Application Sent")
  }, [pipelineConfig, activeApp])

  const getTypeIcon = (type) => {
    switch (type) {
      case "Funder":
        return DollarSign
      case "Catalyst":
        return Trophy
      case "Advisor":
        return Briefcase
      case "Intern":
        return GraduationCap
      default:
        return Building
    }
  }

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case "Funder":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "Catalyst":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "Advisor":
        return "bg-[#7d5a50]/15 text-[#7d5a50] border-[#c8b6a6]"
      case "Intern":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-[#e6d7c3] overflow-hidden flex flex-col my-6 max-h-[94vh]">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-[#4a352f] to-[#241a14] text-white p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <HeaderIcon className="text-[#d9b98a]" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold m-0 leading-tight">
                  {pipelineConfig.title}
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/15 text-[#f5f0e1] border border-white/20">
                  {cohort?.smeName}
                </span>
              </div>
              <p className="text-xs text-[#d9c4b0] m-0 mt-0.5">
                {pipelineConfig.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#faf7f2]">
          {/* Top Level Category Tabs (if multiple application types exist) */}
          {applicationTypes.length > 1 && (
            <div className="flex items-center gap-2 border-b border-[#e6d7c3] pb-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => {
                  setSelectedTypeTab("all")
                  setSelectedAppIndex(0)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedTypeTab === "all"
                    ? "bg-[#7d5a50] text-white shadow-sm"
                    : "bg-white text-[#7d5a50] hover:bg-[#f5f0e1] border border-[#e6d7c3]"
                }`}
              >
                All Applications ({applications.length})
              </button>
              {applicationTypes.map((type) => {
                const Icon = getTypeIcon(type)
                const count = applications.filter((a) => (a.type || "Funder") === type).length
                const active = selectedTypeTab === type
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setSelectedTypeTab(type)
                      setSelectedAppIndex(0)
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      active
                        ? "bg-[#7d5a50] text-white shadow-sm"
                        : "bg-white text-[#7d5a50] hover:bg-[#f5f0e1] border border-[#e6d7c3]"
                    }`}
                  >
                    <Icon size={13} /> {type} ({count})
                  </button>
                )
              })}
            </div>
          )}

          {/* Application Selector Pills (if multiple applications in this view) */}
          {filteredApps.length > 1 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#7d5a50] uppercase tracking-wider">
                Select Application to Track ({filteredApps.length} Total):
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {filteredApps.map((app, idx) => {
                  const Icon = getTypeIcon(app.type)
                  const isSelected = idx === selectedAppIndex
                  return (
                    <button
                      key={app.id || idx}
                      type="button"
                      onClick={() => setSelectedAppIndex(idx)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer border ${
                        isSelected
                          ? "bg-white border-[#7d5a50] text-[#4a352f] shadow-sm ring-1 ring-[#7d5a50]"
                          : "bg-white/80 border-[#e6d7c3] text-[#7d5a50] hover:bg-white"
                      }`}
                    >
                      <Icon size={14} className={isSelected ? "text-[#7d5a50]" : "text-[#a89482]"} />
                      <span>{app.partnerName || app.programName || `Application ${idx + 1}`}</span>
                      {(() => {
                        const appStatusInfo = getDealflowApplicationStatus(app)
                        return (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-semibold whitespace-nowrap"
                            style={
                              appStatusInfo.isSuccess
                                ? { backgroundColor: "#10b98120", color: "#10b981", border: "1px solid #10b98140" }
                                : { backgroundColor: "#f5f0e1", color: "#7d5a50", border: "1px solid #e6d7c3" }
                            }
                          >
                            {appStatusInfo.label}
                          </span>
                        )
                      })()}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {activeApp ? (
            <div className="space-y-5">
              {/* Recipient Overview Strip */}
              <div className="bg-white rounded-2xl border border-[#e6d7c3] shadow-sm overflow-hidden">
                <div className="p-4 bg-[#f5f0e1] border-b border-[#e6d7c3] flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    {React.createElement(getTypeIcon(activeApp.type), { size: 18, className: "text-[#7d5a50]" })}
                    <div>
                      <h3 className="text-sm font-bold text-[#4a352f] m-0">
                        {activeApp.partnerName || activeApp.fundName || activeApp.programName || "Partner Recipient"}
                      </h3>
                      <p className="text-[11px] text-[#7d5a50] m-0">
                        {activeApp.programName || activeApp.fundName || `${activeApp.type} Track`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getTypeBadgeColor(activeApp.type)}`}>
                      {activeApp.type} Application
                    </span>
                    {(() => {
                      const activeStatusInfo = getDealflowApplicationStatus(activeApp)
                      return (
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold inline-block whitespace-nowrap"
                          style={
                            activeStatusInfo.isSuccess
                              ? { backgroundColor: "#10b98120", color: "#10b981", border: "1px solid #10b98140" }
                              : { backgroundColor: "#f5f0e1", color: "#7d5a50", border: "1px solid #e6d7c3" }
                          }
                        >
                          Status: {activeStatusInfo.label}
                        </span>
                      )
                    })()}
                  </div>
                </div>

                <div className="p-5 space-y-6">
                  {/* ─────────────────────────────────────────────────────────────
                      SME-SIDE HORIZONTAL DEALFLOW PIPELINE CARDS
                      Direct mirror of SME side cards, arrows, and terminal box
                     ───────────────────────────────────────────────────────────── */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-extrabold text-[#4a352f] uppercase tracking-wider flex items-center gap-1.5 m-0">
                          <Sparkles size={14} className="text-[#a67c52]" />
                          {pipelineConfig.title}
                        </h4>
                        <span className="text-[11px] text-[#7d5a50]">
                          — Stage-by-stage progression tracking
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="font-bold text-[#4a352f] bg-[#f5f0e1] px-2.5 py-0.5 rounded-full border border-[#e6d7c3]">
                          {isTerminal ? `Terminal: ${currentStageName}` : `Active Stage: ${currentStageName}`}
                        </span>
                      </div>
                    </div>

                    {/* Horizontal Scrolling Pipeline Stage Cards Container */}
                    <div className="bg-[#faf7f2] rounded-2xl border border-[#e6d7c3] p-3 shadow-inner">
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-1 px-1">
                        {/* 1. Live Stages */}
                        {liveStages.map((stage, idx) => {
                          const Icon = stage.icon
                          const isCompleted = !isTerminal && idx < currentLiveIndex
                          const isCurrent = !isTerminal && idx === currentLiveIndex
                          const isUpcoming = isTerminal || idx > currentLiveIndex

                          return (
                            <React.Fragment key={stage.id}>
                              {/* Stage Card */}
                              <div
                                title={stage.name}
                                style={{ width: "124px", minWidth: "124px", height: "98px" }}
                                className={`rounded-xl p-2.5 flex flex-col justify-between transition-all flex-shrink-0 relative select-none ${
                                  isCurrent
                                    ? "bg-[#4a352f] text-white shadow-lg ring-2 ring-[#d9b98a] scale-[1.02]"
                                    : isCompleted
                                    ? "bg-[#3a2e2b]/95 text-white/95 shadow-sm"
                                    : "bg-[#3a2e2b]/70 text-[#d9c4b0]/75"
                                }`}
                              >
                                {/* Top: Icon + Stage Name */}
                                <div className="flex items-start gap-1.5">
                                  <Icon
                                    size={13}
                                    className={`flex-shrink-0 mt-0.5 ${
                                      isCurrent ? "text-[#d9b98a]" : isCompleted ? "text-emerald-400" : "text-[#c8b6a6]/70"
                                    }`}
                                  />
                                  <span className="text-[10px] font-extrabold uppercase tracking-wide leading-tight line-clamp-2">
                                    {stage.name}
                                  </span>
                                </div>

                                {/* Center: Stage Status Indicator */}
                                <div className="text-center my-auto">
                                  {isCurrent ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-[#d9b98a] text-[#3a2e2b] shadow-sm animate-pulse">
                                      ★ Current
                                    </span>
                                  ) : isCompleted ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/25 text-emerald-300 border border-emerald-400/30">
                                      <Check size={9} /> Completed
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-medium text-white/40">
                                      Pending
                                    </span>
                                  )}
                                </div>

                                {/* Bottom: Step bar */}
                                <div className="w-full bg-black/30 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      isCurrent
                                        ? "w-full bg-[#d9b98a]"
                                        : isCompleted
                                        ? "w-full bg-emerald-400"
                                        : "w-0"
                                    }`}
                                  />
                                </div>
                              </div>

                              {/* Inter-stage conversion arrow (if not last live stage) */}
                              {idx < liveStages.length - 1 && (
                                <div className="flex items-center justify-center flex-shrink-0 px-0.5">
                                  <ArrowRight
                                    size={13}
                                    className={isCompleted ? "text-emerald-600" : "text-[#c8b6a6]"}
                                  />
                                </div>
                              )}
                            </React.Fragment>
                          )
                        })}

                        {/* 2. Terminal Stages Separator & Box (Declined / Closed / Withdrawn) */}
                        {terminalStages.length > 0 && (
                          <div className="flex items-center gap-1 pl-2 ml-1 border-l-2 border-dashed border-[#e6d7c3] flex-shrink-0">
                            <div className="border border-red-300/80 bg-red-50/40 rounded-xl p-1.5 flex items-center gap-1.5">
                              {terminalStages.map((termStage) => {
                                const TermIcon = termStage.icon
                                const isTermActive = activeTerminalId === termStage.id

                                return (
                                  <div
                                    key={termStage.id}
                                    title={termStage.name}
                                    style={{ width: "112px", minWidth: "112px", height: "90px" }}
                                    className={`rounded-lg p-2 flex flex-col justify-between transition-all flex-shrink-0 ${
                                      isTermActive
                                        ? "bg-red-700 text-white shadow-md ring-2 ring-red-400"
                                        : "bg-red-100/60 text-red-900/70 border border-red-200/60"
                                    }`}
                                  >
                                    <div className="flex items-start gap-1">
                                      <TermIcon size={12} className="flex-shrink-0 mt-0.5" />
                                      <span className="text-[10px] font-bold uppercase tracking-wide leading-tight truncate">
                                        {termStage.name}
                                      </span>
                                    </div>
                                    <div className="text-center my-auto">
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isTermActive ? "bg-white text-red-800" : "text-red-700/60"}`}>
                                        {isTermActive ? "Terminal Active" : "Outcome"}
                                      </span>
                                    </div>
                                    <div className="text-[8px] text-center opacity-60">
                                      Terminal Stage
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Operational definition note */}
                    <div className="bg-[#faf7f2] p-3 rounded-xl border border-[#f0e6d9] flex items-center justify-between text-xs text-[#7d5a50]">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={14} className="text-[#a67c52] flex-shrink-0" />
                        <span>
                          <strong className="text-[#4a352f]">{currentStageName}:</strong> {currentStageDesc}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-[#a89482] whitespace-nowrap pl-2">
                        {isTerminal ? "Pipeline Concluded" : `Stage ${currentLiveIndex + 1} of ${liveStages.length}`}
                      </span>
                    </div>
                  </div>

                  {/* Key Application Metadata Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#faf7f2] p-4 rounded-xl border border-[#f0e6d9]">
                    <div>
                      <span className="text-[10px] text-[#7d5a50] font-semibold uppercase">Submitted Date</span>
                      <p className="text-xs font-bold text-[#4a352f] m-0 flex items-center gap-1 mt-0.5">
                        <Calendar size={12} className="text-[#a67c52]" />
                        {formatDate(activeApp.createdAt || activeApp.timestamp)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#7d5a50] font-semibold uppercase">Initiated By</span>
                      <p className="text-xs font-bold text-[#4a352f] m-0 flex items-center gap-1 mt-0.5">
                        <User size={12} className="text-[#a67c52]" />
                        {activeApp.facilitatorName || "CMF Facilitator"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#7d5a50] font-semibold uppercase">
                        {activeApp.type === "Funder" ? "Funding Amount" : "Scope / Ticket"}
                      </span>
                      <p className="text-xs font-extrabold text-[#7d5a50] m-0 mt-0.5">
                        {activeApp.fundingNeeded || cohort?.dealAmount || "Custom Scope"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#7d5a50] font-semibold uppercase">Application ID</span>
                      <p className="text-xs font-mono text-gray-500 m-0 truncate mt-0.5" title={activeApp.id}>
                        {activeApp.id ? activeApp.id.slice(0, 10) + "..." : "cmf-app"}
                      </p>
                    </div>
                  </div>

                  {/* Facilitator Recommendation Notes */}
                  {activeApp.facilitatorNotes && (
                    <div className="space-y-1.5 bg-[#fdfbf7] p-3.5 rounded-xl border border-[#e6d7c3]">
                      <span className="text-[11px] font-extrabold text-[#4a352f] uppercase tracking-wide flex items-center gap-1.5">
                        <FileText size={13} className="text-[#7d5a50]" /> Facilitator Pitch & Recommendation
                      </span>
                      <p className="text-xs text-[#4a352f] leading-relaxed m-0 italic">
                        "{activeApp.facilitatorNotes}"
                      </p>
                    </div>
                  )}

                  {/* Attached Business Profile Credentials */}
                  <div className="space-y-2 pt-2 border-t border-[#f0e6d9]">
                    <span className="text-xs font-extrabold text-[#4a352f] uppercase tracking-wider flex items-center gap-1.5 text-[#7d5a50]">
                      <ShieldCheck size={14} /> Attached Business Profile Credentials
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div className="bg-[#faf7f2] p-2.5 rounded-lg border border-[#f0e6d9]">
                        <span className="text-[10px] text-[#a89482] uppercase">Business</span>
                        <p className="font-bold text-[#4a352f] m-0 truncate">{cohort?.smeName}</p>
                      </div>
                      <div className="bg-[#faf7f2] p-2.5 rounded-lg border border-[#f0e6d9]">
                        <span className="text-[10px] text-[#a89482] uppercase">Sector</span>
                        <p className="font-bold text-[#4a352f] m-0 truncate">{cohort?.sector || "Services"}</p>
                      </div>
                      <div className="bg-[#faf7f2] p-2.5 rounded-lg border border-[#f0e6d9]">
                        <span className="text-[10px] text-[#a89482] uppercase">BIG Score</span>
                        <p className="font-extrabold text-[#7d5a50] m-0">{cohort?.bigScore || 75}/100 Verified</p>
                      </div>
                      <div className="bg-[#faf7f2] p-2.5 rounded-lg border border-[#f0e6d9]">
                        <span className="text-[10px] text-[#a89482] uppercase">Location</span>
                        <p className="font-bold text-[#4a352f] m-0 truncate">{cohort?.location || "South Africa"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-10 text-center border border-[#e6d7c3] space-y-2">
              <Building size={32} className="mx-auto text-[#c8b6a6]" />
              <h4 className="text-sm font-bold text-[#4a352f] m-0">No Sent Applications Found</h4>
              <p className="text-xs text-[#a89482] m-0">
                You haven't initiated or submitted applications for this business yet.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white p-4 border-t border-[#e6d7c3] flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[#7d5a50] hover:text-[#4a352f] transition-colors cursor-pointer"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            {onOpenApply && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenApply()
                }}
                className="px-4 py-2 bg-[#7d5a50] hover:bg-[#5d4037] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Plus size={13} /> Apply to Another Partner
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
