"use client"

import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Building,
  Target,
  Database,
  Layers,
  ShieldCheck,
  Users,
  Lock,
  Save,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react"

import { useBuyerProfile } from "../hooks/useBuyerProfile"
import CompletionPlanCard from "./CompletionPlanCard"

import SectionOrganisation from "./sections/SectionOrganisation"
import SectionObjectives from "./sections/SectionObjectives"
import SectionEnvironment from "./sections/SectionEnvironment"
import SectionDemand from "./sections/SectionDemand"
import SectionRequirements from "./sections/SectionRequirements"
import SectionDecisions from "./sections/SectionDecisions"
import SectionConsent from "./sections/SectionConsent"

const TABS = [
  { id: "organisation", label: "1. Organisation", icon: Building },
  { id: "objectives", label: "2. Objectives", icon: Target },
  { id: "environment", label: "3. Environment & ERP", icon: Database },
  { id: "demand", label: "4. Demand Context", icon: Layers },
  { id: "requirements", label: "5. Statutory Gates", icon: ShieldCheck },
  { id: "decisions", label: "6. Decision Roles", icon: Users },
  { id: "consent", label: "7. Policy & Consent", icon: Lock },
]

export default function BuyerUniversalProfile() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("organisation")

  const {
    profile,
    stateInfo,
    loading,
    saving,
    saveSuccess,
    updateSection,
    saveProfile,
  } = useBuyerProfile()

  const currentTabIndex = TABS.findIndex((t) => t.id === activeTab)

  const handleNextTab = () => {
    if (currentTabIndex < TABS.length - 1) {
      setActiveTab(TABS[currentTabIndex + 1].id)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handlePrevTab = () => {
    if (currentTabIndex > 0) {
      setActiveTab(TABS[currentTabIndex - 1].id)
      window.scrollTo({ top: 0, behavior: "smooth" })
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
          Universal Profile successfully saved and readiness state recalculated!
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <Building size={26} color="#4A352F" />
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700, color: "#4A352F" }}>
              Procurement Universal Profile
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "#8D6E63", maxWidth: "800px" }}>
            The first-time journey asks what the organisation wants from Prism, what it already has, and what BIG must configure. The profile determines dashboard modules, setup tasks, matching rules, permissions and success measures.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {stateInfo.isMatchReady && (
            <button
              type="button"
              onClick={() => navigate("/procurement/matches")}
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
              View Matches <ArrowRight size={14} />
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

      {/* Completion Plan Card */}
      <CompletionPlanCard
        stateInfo={stateInfo}
        onNavigateToSection={(sec) => {
          setActiveTab(sec)
          window.scrollTo({ top: 320, behavior: "smooth" })
        }}
      />

      {/* Main Wizard Card */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E6D7C3",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          overflow: "hidden",
        }}
      >
        {/* Navigation Tabs Header */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #E8D5C4",
            background: "#FAF7F2",
            overflowX: "auto",
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "14px 18px",
                  background: isActive ? "#FFFFFF" : "transparent",
                  border: "none",
                  borderBottom: isActive ? "3px solid #4A352F" : "3px solid transparent",
                  color: isActive ? "#4A352F" : "#8D6E63",
                  fontSize: "0.825rem",
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                <Icon size={16} color={isActive ? "#4A352F" : "#A89482"} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content Body */}
        <div style={{ padding: "28px" }}>
          {activeTab === "organisation" && (
            <SectionOrganisation
              data={profile.organisation}
              onChange={(next) => updateSection("organisation", next)}
            />
          )}

          {activeTab === "objectives" && (
            <SectionObjectives
              data={profile.objectives}
              onChange={(next) => updateSection("objectives", next)}
            />
          )}

          {activeTab === "environment" && (
            <SectionEnvironment
              data={profile.currentEnvironment}
              onChange={(next) => updateSection("currentEnvironment", next)}
            />
          )}

          {activeTab === "demand" && (
            <SectionDemand
              data={profile.demandContext}
              onChange={(next) => updateSection("demandContext", next)}
            />
          )}

          {activeTab === "requirements" && (
            <SectionRequirements
              data={profile.requirements}
              onChange={(next) => updateSection("requirements", next)}
            />
          )}

          {activeTab === "decisions" && (
            <SectionDecisions
              data={profile.decisionProcess}
              onChange={(next) => updateSection("decisionProcess", next)}
            />
          )}

          {activeTab === "consent" && (
            <SectionConsent
              data={profile.dataConsent}
              onChange={(next) => updateSection("dataConsent", next)}
            />
          )}
        </div>

        {/* Wizard Footer Navigation */}
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
            onClick={handlePrevTab}
            disabled={currentTabIndex === 0}
            style={{
              padding: "8px 16px",
              background: "#FFFFFF",
              border: "1px solid #C8B6A6",
              borderRadius: "6px",
              color: currentTabIndex === 0 ? "#BDBDBD" : "#4A352F",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: currentTabIndex === 0 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <ArrowLeft size={14} /> Previous
          </button>

          <div style={{ fontSize: "0.775rem", color: "#8D6E63" }}>
            Section {currentTabIndex + 1} of {TABS.length}
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

            {currentTabIndex < TABS.length - 1 ? (
              <button
                type="button"
                onClick={handleNextTab}
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
                onClick={saveProfile}
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
                Complete & Validate <CheckCircle size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
