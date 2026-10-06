"use client"

import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Target,
  Layers,
  ShieldCheck,
  Users,
  Lock,
  Database,
  Save,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Building,
  Eye,
  Edit,
  Sparkles,
} from "lucide-react"

import { useBuyerProfile } from "../hooks/useBuyerProfile"
import CompletionPlanCard from "./CompletionPlanCard"
import ProcurementProfileSummary from "./ProcurementProfileSummary"

import SectionObjectives from "./sections/SectionObjectives"
import SectionDemand from "./sections/SectionDemand"
import SectionComplianceGates from "./sections/SectionComplianceGates"
import SectionDecisions from "./sections/SectionDecisions"
import SectionEnvironment from "./sections/SectionEnvironment"
import SectionConsent from "./sections/SectionConsent"

const SECTIONS = [
  { id: "objectives", label: "1. Objectives", icon: Target, subtitle: "Entity & Priorities" },
  { id: "demand", label: "2. Demand Context", icon: Layers, subtitle: "Taxonomy & Scope" },
  { id: "compliance", label: "3. Compliance Gates", icon: ShieldCheck, subtitle: "Statutory & ISO" },
  { id: "decisions", label: "4. Decision Roles", icon: Users, subtitle: "Approval Hierarchy" },
  { id: "environment", label: "5. Environment & ERP", icon: Database, subtitle: "ERP & Portal Coexistence" },
  { id: "consent", label: "6. Policy & Consent", icon: Lock, subtitle: "Data Minimisation" },
]

export default function BuyerUniversalProfile() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState("objectives")
  const [showSummary, setShowSummary] = useState(false)

  const {
    profile,
    stateInfo,
    loading,
    saving,
    saveSuccess,
    updateSection,
    saveProfile,
    seedCompleteProfile,
  } = useBuyerProfile()

  const currentSectionIndex = SECTIONS.findIndex((s) => s.id === activeSection)

  const handleNextSection = () => {
    if (currentSectionIndex < SECTIONS.length - 1) {
      setActiveSection(SECTIONS[currentSectionIndex + 1].id)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handlePrevSection = () => {
    if (currentSectionIndex > 0) {
      setActiveSection(SECTIONS[currentSectionIndex - 1].id)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleCompleteAndSummary = async () => {
    await saveProfile()
    setShowSummary(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleEditSectionFromSummary = (secId) => {
    if (secId && SECTIONS.some((s) => s.id === secId)) {
      setActiveSection(secId)
    }
    setShowSummary(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const completedMap = stateInfo.completedMap || {}

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
      {saveSuccess && (
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
          <CheckCircle size={18} />
          Procurement Universal Profile saved successfully!
        </div>
      )}

      {showSummary ? (
        <ProcurementProfileSummary
          profile={profile}
          stateInfo={stateInfo}
          onEdit={() => setShowSummary(false)}
          onEditSection={handleEditSectionFromSummary}
          onSeed={seedCompleteProfile}
        />
      ) : (
        <>
          {/* Page Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                <Building size={26} color="#4A352F" />
                <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700, color: "#4A352F" }}>
                  Procurement Universal Profile
                </h1>
              </div>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#8D6E63", maxWidth: "800px" }}>
                Configure corporate objectives, sourcing demand taxonomy, compliance & accreditation gates, governance roles, and ERP coexistence parameters.
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setShowSummary(true)}
                style={{
                  padding: "9px 16px",
                  background: "#FAF7F2",
                  border: "1px solid #4A352F",
                  borderRadius: "6px",
                  color: "#4A352F",
                  fontSize: "0.825rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Eye size={14} /> View Summary
              </button>

              {stateInfo.isMatchReady && (
                <button
                  type="button"
                  onClick={() => navigate("/procurement/matches")}
                  style={{
                    padding: "9px 16px",
                    background: "#FAF7F2",
                    border: "1px solid #2E7D32",
                    borderRadius: "6px",
                    color: "#2E7D32",
                    fontSize: "0.825rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  Preferred Suppliers <ArrowRight size={14} />
                </button>
              )}

              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                style={{
                  padding: "9px 18px",
                  background: "#4A352F",
                  border: "none",
                  borderRadius: "6px",
                  color: "#FAF7F2",
                  fontSize: "0.825rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                <Save size={15} /> {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>

          {/* Profile Completion Progress Card */}
          <CompletionPlanCard stateInfo={stateInfo} />

          {/* Edit Mode: Horizontal Section Tracker Cards + Form Card */}
          <div>
          {/* Horizontal Section Card Tracker (Pattern matching SMSE/Investor profiles) */}
          <div
            style={{
              marginBottom: "20px",
              overflowX: "auto",
              paddingBottom: "4px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, minmax(170px, 1fr))",
                gap: "10px",
                minWidth: "1020px",
              }}
            >
              {SECTIONS.map((section, idx) => {
                const isActive = activeSection === section.id
                const isCompleted = completedMap[section.id] === true
                const Icon = section.icon

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    style={{
                      background: isActive
                        ? "linear-gradient(135deg, #4A352F, #3E2723)"
                        : isCompleted
                        ? "#FFFFFF"
                        : "#FAF7F2",
                      border: isActive
                        ? "2px solid #3E2723"
                        : isCompleted
                        ? "1.5px solid #2E7D32"
                        : "1px solid #E8D5C4",
                      borderRadius: "10px",
                      padding: "14px 14px",
                      textAlign: "left",
                      cursor: "pointer",
                      position: "relative",
                      transition: "all 0.15s ease",
                      boxShadow: isActive
                        ? "0 4px 12px rgba(74, 53, 47, 0.25)"
                        : "0 1px 3px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          background: isActive
                            ? "rgba(255,255,255,0.15)"
                            : isCompleted
                            ? "#E8F5E9"
                            : "#F5F0E1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon
                          size={15}
                          color={isActive ? "#FAF7F2" : isCompleted ? "#2E7D32" : "#8D6E63"}
                        />
                      </div>

                      {isCompleted ? (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            color: isActive ? "#81C784" : "#2E7D32",
                            background: isActive ? "rgba(46,125,50,0.2)" : "#E8F5E9",
                            padding: "2px 6px",
                            borderRadius: "10px",
                          }}
                        >
                          <CheckCircle size={11} /> Done
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: "0.675rem",
                            fontWeight: 600,
                            color: isActive ? "#D7CCC8" : "#A89482",
                          }}
                        >
                          Pending
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        fontSize: "0.825rem",
                        fontWeight: 700,
                        color: isActive ? "#FAF7F2" : "#4A352F",
                        lineHeight: "1.2",
                        marginBottom: "2px",
                      }}
                    >
                      {section.label}
                    </div>

                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: isActive ? "#D7CCC8" : "#8D6E63",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {section.subtitle}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Main Form Content Card */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E6D7C3",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              overflow: "hidden",
            }}
          >
            {/* Active Section Body */}
            <div style={{ padding: "28px" }}>
              {activeSection === "objectives" && (
                <SectionObjectives
                  data={profile.objectives}
                  organisation={profile.organisation}
                  onChange={(next) => updateSection("objectives", next)}
                  onOrgChange={(next) => updateSection("organisation", next)}
                />
              )}

              {activeSection === "demand" && (
                <SectionDemand
                  data={profile.demandContext}
                  onChange={(next) => updateSection("demandContext", next)}
                />
              )}

              {activeSection === "compliance" && (
                <SectionComplianceGates
                  data={profile.requirements}
                  onChange={(next) => updateSection("requirements", next)}
                />
              )}

              {activeSection === "decisions" && (
                <SectionDecisions
                  data={profile.decisionProcess}
                  onChange={(next) => updateSection("decisionProcess", next)}
                />
              )}

              {activeSection === "environment" && (
                <SectionEnvironment
                  data={profile.currentEnvironment}
                  onChange={(next) => updateSection("currentEnvironment", next)}
                />
              )}

              {activeSection === "consent" && (
                <SectionConsent
                  data={profile.dataConsent}
                  onChange={(next) => updateSection("dataConsent", next)}
                />
              )}
            </div>

            {/* Footer Navigation Bar */}
            <div
              style={{
                padding: "16px 28px",
                borderTop: "1px solid #E8D5C4",
                background: "#FAF7F2",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <button
                type="button"
                onClick={handlePrevSection}
                disabled={currentSectionIndex === 0}
                style={{
                  padding: "8px 16px",
                  background: "#FFFFFF",
                  border: "1px solid #C8B6A6",
                  borderRadius: "6px",
                  color: currentSectionIndex === 0 ? "#BDBDBD" : "#4A352F",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: currentSectionIndex === 0 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <ArrowLeft size={14} /> Previous
              </button>

              <div style={{ fontSize: "0.775rem", color: "#8D6E63" }}>
                Section {currentSectionIndex + 1} of {SECTIONS.length}
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={saving}
                  style={{
                    padding: "8px 16px",
                    background: "#FFFFFF",
                    border: "1px solid #4A352F",
                    borderRadius: "6px",
                    color: "#4A352F",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Save Draft
                </button>

                {currentSectionIndex < SECTIONS.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNextSection}
                    style={{
                      padding: "8px 18px",
                      background: "#4A352F",
                      border: "none",
                      borderRadius: "6px",
                      color: "#FAF7F2",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    Next Section <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCompleteAndSummary}
                    disabled={saving}
                    style={{
                      padding: "8px 18px",
                      background: "#2E7D32",
                      border: "none",
                      borderRadius: "6px",
                      color: "#FFFFFF",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    Complete & View Summary <CheckCircle size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  )
}
