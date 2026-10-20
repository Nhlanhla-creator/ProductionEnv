"use client"

import React, { useState } from "react"
import {
  Plus,
  Copy,
  Archive,
  Trash2,
  Edit3,
  Layers,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  ChevronRight,
  Sliders,
  FileText,
  Target,
  ExternalLink,
} from "lucide-react"
import styles from "./catalyst-universal-profile.module.css"
import CatalystProgrammeBriefTab from "./catalyst-programme-brief-tab"
import CatalystMatchingPreferencesTab from "./catalyst-matching-preferences-tab"
import CatalystScoringCustomisationTab from "./catalyst-scoring-customisation-tab"
import CatalystApplicationBriefTab from "./catalyst-application-brief-tab"
import {
  PROGRAMME_TYPES,
  INTAKE_STATUSES,
  DEFAULT_STAGE_WEIGHTS_CATALYST,
} from "./catalystTaxonomy"

export default function CatalystProgrammeSetup({
  data = {},
  updateData,
  isLocked = false,
}) {
  const [selectedProgrammeId, setSelectedProgrammeId] = useState(null)
  const [activeInnerTab, setActiveInnerTab] = useState("programmeBrief")
  const [showAddModal, setShowAddModal] = useState(false)
  const [show5EGuidance, setShow5EGuidance] = useState(false)

  // Initialize programmes array from data.programmes or fallback
  const rawProgrammes = Array.isArray(data.programmes) ? data.programmes : []

  // Ensure at least one initial programme exists if none provided
  const programmes =
    rawProgrammes.length > 0
      ? rawProgrammes
      : [
          {
            id: "prog_default_1",
            programmeName: "Primary Enterprise Support Programme",
            programmeType: "accelerator",
            status: "draft",
            intakeStatus: "open",
            programmeBrief: {
              programmeLead: "",
              aboutProgramme: "",
              primaryMandate: "commercial_growth",
              fundingSources: ["corporate"],
              durationModel: "fixed",
              durationNumber: "6",
              durationUnit: "Months",
              programmeFormat: "fixed_cohort",
              deliveryMode: "hybrid",
              intakeMethod: "open_applications",
              cohortStartTiming: "Upcoming Cohort",
              participantCapacity: "20",
              participationCost: "free_sponsored",
              diagnosticApproach: "combined",
              reviewFrequency: "monthly",
              intendedOutcomes: ["revenue_growth", "repeat_customers"],
              nextDestinations: ["sd_procurement"],
            },
            matchingPreferences: {
              acceptedLifecycleStages: ["early_trading", "established"],
              lifecycleStageRule: "must_meet",
              geographicScope: "national",
              sectorFocus: ["enterprise_support", "information_tech", "manufacturing"],
              supportOfferings: [],
            },
            scoringConfiguration: {
              mode: "default",
              stageWeights: { ...DEFAULT_STAGE_WEIGHTS_CATALYST },
              configurationNote: "",
            },
            applicationBrief: {
              applicationChannel: "big_application",
              applicationWindow: "rolling",
              selectionStages: ["screening", "profile_review", "diagnostic", "interview", "panel"],
              requiredDocuments: [
                { docId: "profile_summary", label: "Verified Universal Profile Snapshot", timing: "application", rule: "required" },
                { docId: "registration_cipc", label: "CIPC Company Registration", timing: "shortlisting", rule: "required" },
              ],
            },
          },
        ]

  const updateProgrammesList = (updatedList) => {
    updateData({ programmes: updatedList })
  }

  const selectedProgramme =
    programmes.find((p) => p.id === selectedProgrammeId) || null

  const handleUpdateCurrentProgramme = (updates) => {
    const updated = programmes.map((p) => {
      if (p.id === selectedProgrammeId) {
        return {
          ...p,
          ...updates,
          // Deep merge for nested sections if passed
          programmeBrief: updates.programmeBrief
            ? { ...p.programmeBrief, ...updates.programmeBrief }
            : p.programmeBrief,
          matchingPreferences: updates.matchingPreferences
            ? { ...p.matchingPreferences, ...updates.matchingPreferences }
            : p.matchingPreferences,
          scoringConfiguration: updates.scoringConfiguration
            ? { ...p.scoringConfiguration, ...updates.scoringConfiguration }
            : p.scoringConfiguration,
          applicationBrief: updates.applicationBrief
            ? { ...p.applicationBrief, ...updates.applicationBrief }
            : p.applicationBrief,
        }
      }
      return p
    })
    updateProgrammesList(updated)
  }

  const handleCreateNewProgramme = (typeId) => {
    const typeMeta = PROGRAMME_TYPES.find((t) => t.id === typeId) || PROGRAMME_TYPES[0]
    const newProg = {
      id: `prog_${Date.now()}`,
      programmeName: `New ${typeMeta.label} Programme`,
      programmeType: typeId,
      status: "draft",
      intakeStatus: "upcoming",
      programmeBrief: {
        programmeLead: "",
        aboutProgramme: "",
        primaryMandate: "",
        fundingSources: [],
        durationModel: "fixed",
        durationNumber: "6",
        durationUnit: "Months",
        programmeFormat: "fixed_cohort",
        deliveryMode: "hybrid",
        intakeMethod: "open_applications",
        cohortStartTiming: "To be confirmed",
        participantCapacity: "15",
        participationCost: "free_sponsored",
        diagnosticApproach: "combined",
        reviewFrequency: "monthly",
        intendedOutcomes: [],
        nextDestinations: [],
      },
      matchingPreferences: {
        acceptedLifecycleStages: ["early_trading"],
        lifecycleStageRule: "must_meet",
        geographicScope: "national",
        sectorFocus: [],
        supportOfferings: [],
      },
      scoringConfiguration: {
        mode: "default",
        stageWeights: { ...DEFAULT_STAGE_WEIGHTS_CATALYST },
      },
      applicationBrief: {
        applicationChannel: "big_application",
        applicationWindow: "rolling",
        selectionStages: ["screening", "profile_review", "diagnostic", "interview", "panel"],
        requiredDocuments: [],
      },
    }

    const updated = [...programmes, newProg]
    updateProgrammesList(updated)
    setShowAddModal(false)
    setSelectedProgrammeId(newProg.id)
    setActiveInnerTab("programmeBrief")
  }

  const handleDuplicateProgramme = (prog) => {
    const duplicate = {
      ...JSON.parse(JSON.stringify(prog)),
      id: `prog_${Date.now()}`,
      programmeName: `${prog.programmeName} (Copy)`,
      status: "draft",
    }
    updateProgrammesList([...programmes, duplicate])
  }

  const handleArchiveToggle = (progId) => {
    const updated = programmes.map((p) => {
      if (p.id === progId) {
        return {
          ...p,
          status: p.status === "archived" ? "draft" : "archived",
        }
      }
      return p
    })
    updateProgrammesList(updated)
  }

  const handleDeleteDraft = (progId) => {
    if (programmes.length <= 1) {
      alert("At least one programme is required.")
      return
    }
    const updated = programmes.filter((p) => p.id !== progId)
    updateProgrammesList(updated)
    if (selectedProgrammeId === progId) {
      setSelectedProgrammeId(null)
    }
  }

  // Inner tabs navigation items
  const innerTabs = [
    { id: "programmeBrief", label: "1. Programme Brief", icon: FileText },
    { id: "matchingPreferences", label: "2. Matching Preferences", icon: Target },
    { id: "bigScore", label: "3. BIG Score Customisation", icon: Sliders },
    { id: "applicationBrief", label: "4. Application Brief", icon: CheckCircle2 },
  ]

  // Render Inner Workspace View when editing a programme
  if (selectedProgramme) {
    const typeMeta =
      PROGRAMME_TYPES.find((t) => t.id === selectedProgramme.programmeType) ||
      PROGRAMME_TYPES[0]

    return (
      <div className={styles.productApplicationContainer}>
        {/* Workspace Breadcrumb & Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "1rem",
            marginBottom: "1rem",
            borderBottom: "1px solid #d7ccc8",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              type="button"
              onClick={() => setSelectedProgrammeId(null)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                backgroundColor: "#f3ebe0",
                color: "#4e342e",
                border: "1px solid #d7ccc8",
                borderRadius: "6px",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={16} /> Back to All Programmes
            </button>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    backgroundColor: typeMeta.badgeColor,
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    padding: "2px 8px",
                    borderRadius: "4px",
                  }}
                >
                  {typeMeta.label}
                </span>
                <span
                  style={{
                    backgroundColor: selectedProgramme.status === "published" ? "#e8f5e9" : "#fff3e0",
                    color: selectedProgramme.status === "published" ? "#2e7d32" : "#e65100",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    padding: "2px 8px",
                    borderRadius: "4px",
                  }}
                >
                  {selectedProgramme.status}
                </span>
              </div>
              <h2
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#4e342e",
                }}
              >
                {selectedProgramme.programmeName}
              </h2>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() =>
                handleUpdateCurrentProgramme({
                  status: selectedProgramme.status === "published" ? "draft" : "published",
                })
              }
              style={{
                padding: "6px 14px",
                backgroundColor: selectedProgramme.status === "published" ? "#6d4c41" : "#2e7d32",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              {selectedProgramme.status === "published" ? "Unpublish to Draft" : "Publish Programme"}
            </button>
          </div>
        </div>

        {/* 4 Inner Tabs Switcher */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            borderBottom: "2px solid #e8d8cf",
            marginBottom: "1.5rem",
            overflowX: "auto",
          }}
        >
          {innerTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeInnerTab === tab.id
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveInnerTab(tab.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  border: "none",
                  borderBottom: isActive ? "3px solid #795548" : "3px solid transparent",
                  backgroundColor: isActive ? "#f8f5f2" : "transparent",
                  color: isActive ? "#4e342e" : "#8d6e63",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content Panels */}
        {activeInnerTab === "programmeBrief" && (
          <CatalystProgrammeBriefTab
            programme={selectedProgramme}
            updateProgramme={handleUpdateCurrentProgramme}
            isLocked={isLocked}
          />
        )}

        {activeInnerTab === "matchingPreferences" && (
          <CatalystMatchingPreferencesTab
            programme={selectedProgramme}
            updateProgramme={handleUpdateCurrentProgramme}
            isLocked={isLocked}
          />
        )}

        {activeInnerTab === "bigScore" && (
          <CatalystScoringCustomisationTab
            programme={selectedProgramme}
            updateProgramme={handleUpdateCurrentProgramme}
            isLocked={isLocked}
          />
        )}

        {activeInnerTab === "applicationBrief" && (
          <CatalystApplicationBriefTab
            programme={selectedProgramme}
            updateProgramme={handleUpdateCurrentProgramme}
            isLocked={isLocked}
          />
        )}
      </div>
    )
  }

  // Default: Programme List / Management Grid
  return (
    <div className={styles.productApplicationContainer}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h2 className={styles.productApplicationHeading} style={{ margin: 0, border: "none" }}>
            Programme Setup Workspace
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#6d4c41" }}>
            Define each programme: mandate, eligibility rules, 5Cs support offerings, BIG Score weighting, and application requirements.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "9px 18px",
            backgroundColor: "#795548",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(121, 85, 72, 0.2)",
          }}
        >
          <Plus size={18} /> Add New Programme
        </button>
      </div>

      {/* 5Es Framework Guidance Collapsible */}
      <div
        style={{
          backgroundColor: "#f8f5f2",
          border: "1px solid #d7ccc8",
          borderRadius: "6px",
          padding: "12px 16px",
          marginBottom: "1.5rem",
        }}
      >
        <div
          onClick={() => setShow5EGuidance(!show5EGuidance)}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={16} color="#795548" />
            <strong style={{ fontSize: "14px", color: "#4e342e" }}>
              The 5Es Setup Framework (Entry, Enablement, Engagement, Evidence, Elevation)
            </strong>
          </div>
          <span style={{ fontSize: "12px", color: "#795548", fontWeight: 600 }}>
            {show5EGuidance ? "Hide details ▲" : "View framework ▼"}
          </span>
        </div>

        {show5EGuidance && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "10px",
              marginTop: "12px",
              paddingTop: "10px",
              borderTop: "1px solid #e8d8cf",
            }}
          >
            {[
              { e: "Entry", desc: "Select suitable businesses; baseline all 5Cs." },
              { e: "Enablement", desc: "Diagnose the constraining C and match support." },
              { e: "Engagement", desc: "Agree actions and monitor milestone delivery." },
              { e: "Evidence", desc: "Measure which C changed against baseline score." },
              { e: "Elevation", desc: "Define the next destination and durable economic gains." },
            ].map((item) => (
              <div
                key={item.e}
                style={{
                  backgroundColor: "#ffffff",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  border: "1px solid #e8d8cf",
                }}
              >
                <strong style={{ color: "#795548", fontSize: "13px", display: "block" }}>
                  {item.e}
                </strong>
                <span style={{ fontSize: "12px", color: "#5d4037" }}>{item.desc}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Programme Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
        {programmes.map((prog) => {
          const typeMeta =
            PROGRAMME_TYPES.find((t) => t.id === prog.programmeType) || PROGRAMME_TYPES[0]
          const intakeMeta =
            INTAKE_STATUSES.find((s) => s.value === prog.intakeStatus) || INTAKE_STATUSES[0]
          const isArchived = prog.status === "archived"
          const isESD = prog.programmeType === "esd"

          return (
            <div
              key={prog.id}
              style={{
                backgroundColor: isArchived ? "#f9f9f9" : "#ffffff",
                border: isArchived ? "1px dashed #ccc" : "1.5px solid #d7ccc8",
                borderRadius: "8px",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: isArchived ? "none" : "0 2px 6px rgba(74, 53, 47, 0.08)",
                transition: "all 0.2s ease",
                opacity: isArchived ? 0.75 : 1,
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span
                      style={{
                        backgroundColor: typeMeta.badgeColor,
                        color: "#ffffff",
                        fontSize: "11px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        padding: "2px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      {typeMeta.label}
                    </span>
                    {isESD && (
                      <span
                        style={{
                          backgroundColor: "#f3ebe0",
                          color: "#6b4c2a",
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        {prog.programmeBrief?.esdTrackStructure === "parallel" ? "Parallel Tracks" : "Sequential ED→SD"}
                      </span>
                    )}
                  </div>

                  <span
                    style={{
                      backgroundColor: intakeMeta.badgeColor,
                      color: "#ffffff",
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "10px",
                    }}
                  >
                    {intakeMeta.label}
                  </span>
                </div>

                <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: 700, color: "#4e342e" }}>
                  {prog.programmeName}
                </h3>

                <p
                  style={{
                    margin: "0 0 12px 0",
                    fontSize: "13px",
                    color: "#6d4c41",
                    lineHeight: "1.4",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {prog.programmeBrief?.aboutProgramme || "No summary added yet. Click Edit Workspace to configure."}
                </p>

                <div style={{ fontSize: "12px", color: "#8d6e63", display: "grid", gap: "3px" }}>
                  <div>
                    Mode: <strong>{prog.programmeBrief?.deliveryMode || "Hybrid"}</strong> • Duration:{" "}
                    <strong>
                      {prog.programmeBrief?.durationNumber || "6"} {prog.programmeBrief?.durationUnit || "Months"}
                    </strong>
                  </div>
                  <div>
                    Capacity: <strong>{prog.programmeBrief?.participantCapacity || "20"} places</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px solid #e8d8cf",
                  paddingTop: "12px",
                  marginTop: "14px",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProgrammeId(prog.id)
                    setActiveInnerTab("programmeBrief")
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 14px",
                    backgroundColor: "#795548",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <Edit3 size={14} /> Edit Workspace
                </button>

                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => handleDuplicateProgramme(prog)}
                    title="Duplicate Configuration"
                    style={{
                      padding: "6px",
                      background: "transparent",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      cursor: "pointer",
                      color: "#5d4037",
                    }}
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleArchiveToggle(prog.id)}
                    title={isArchived ? "Restore Programme" : "Archive Programme"}
                    style={{
                      padding: "6px",
                      background: "transparent",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      cursor: "pointer",
                      color: isArchived ? "#2e7d32" : "#5d4037",
                    }}
                  >
                    <Archive size={14} />
                  </button>
                  {programmes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteDraft(prog.id)}
                      title="Delete Draft"
                      style={{
                        padding: "6px",
                        background: "transparent",
                        border: "1px solid #ffcdd2",
                        borderRadius: "4px",
                        cursor: "pointer",
                        color: "#c62828",
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* "Add Programme" Modal */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              padding: "1.75rem",
              maxWidth: "600px",
              width: "100%",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ margin: "0 0 6px 0", fontSize: "18px", color: "#4e342e", fontWeight: 700 }}>
              What type of programme are you adding?
            </h3>
            <p style={{ margin: "0 0 1.25rem 0", fontSize: "13px", color: "#6d4c41" }}>
              Programme type serves as a template controlling dynamic matching criteria and scorecard setup. You can add multiple programmes.
            </p>

            <div style={{ display: "grid", gap: "10px", marginBottom: "1.5rem" }}>
              {PROGRAMME_TYPES.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleCreateNewProgramme(t.id)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    border: "1px solid #d7ccc8",
                    borderRadius: "6px",
                    cursor: "pointer",
                    backgroundColor: "#fcfaf8",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f3ebe0"
                    e.currentTarget.style.borderColor = "#795548"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#fcfaf8"
                    e.currentTarget.style.borderColor = "#d7ccc8"
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "15px", color: "#4e342e", display: "block" }}>
                      {t.label}
                    </strong>
                    <span style={{ fontSize: "12px", color: "#6d4c41" }}>{t.description}</span>
                  </div>
                  <ChevronRight size={18} color="#795548" />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f5f5f5",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
