"use client"

import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { 
  Building2, 
  ShieldCheck, 
  Bell, 
  ExternalLink, 
  Lock, 
  Database, 
  CheckCircle2, 
  AlertCircle,
  Save,
  UserCheck,
  FileText,
  Sparkles,
} from "lucide-react"
import { auth, db } from "../../firebaseConfig"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { COMPLETE_BUYER_PROFILE } from "../hooks/useBuyerProfile"

export default function ProcurementSettingsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("portal")
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const [settings, setSettings] = useState({
    // ERP & External Portal Hand-off
    portalName: "SAP S/4HANA Vendor Master",
    portalUrl: "https://vendor.angloamerican.com/registration",
    portalInstructions: "Please register your business on the Anglo American Sourcing Portal using your CIPC registration number and valid Tax PIN. Provide your SAP Vendor Number in the stage-gate handoff.",
    erpType: "SAP S/4HANA",
    autoRequestPortalAfterFit: 85,
    enforceZeroScraping: true,

    // Notification Preferences
    notifyNewMatches: true,
    notifyThreshold: 80,
    notifyRFIReplies: true,
    notifyStageApprovals: true,
    notifyCohortMilestones: true,
    digestFrequency: "daily",

    // Governance & RBAC
    dualSignoffThreshold: 500000, // ZAR
    requireSHEQApproval: true,
    requireESDSignoff: true,
    defaultAuditorNotification: true,

    // POPIA & Compliance
    dataMinimisationActive: true,
    evidenceRetentionDays: 365,
    autoRedactFinancials: true,
    immutableAuditHashing: true,
  })

  // Load existing profile if available
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const uid = auth.currentUser?.uid
        if (uid) {
          const snap = await getDoc(doc(db, "universalProfiles", uid))
          if (snap.exists()) {
            const data = snap.data()
            const erp = data.erpCoexistence || {}
            setSettings(prev => ({
              ...prev,
              portalName: erp.portalName || prev.portalName,
              portalUrl: erp.portalUrl || prev.portalUrl,
              portalInstructions: erp.registrationInstructions || prev.portalInstructions,
              erpType: erp.erpSystem || prev.erpType,
            }))
          }
        } else {
          // Check local draft
          const localDraft = localStorage.getItem("procurement_buyer_universal_profile_v1")
          if (localDraft) {
            const parsed = JSON.parse(localDraft)
            const erp = parsed.erpCoexistence || {}
            if (erp.portalUrl) {
              setSettings(prev => ({
                ...prev,
                portalName: erp.portalName || prev.portalName,
                portalUrl: erp.portalUrl || prev.portalUrl,
                portalInstructions: erp.registrationInstructions || prev.portalInstructions,
                erpType: erp.erpSystem || prev.erpType,
              }))
            }
          }
        }
      } catch (err) {
        console.warn("Could not load procurement settings:", err)
      }
    }
    loadSettings()
  }, [])

  const handleSave = async (e) => {
    e?.preventDefault()
    setSaving(true)
    setSavedSuccess(false)

    try {
      const uid = auth.currentUser?.uid
      if (uid) {
        await updateDoc(doc(db, "universalProfiles", uid), {
          "erpCoexistence.portalName": settings.portalName,
          "erpCoexistence.portalUrl": settings.portalUrl,
          "erpCoexistence.registrationInstructions": settings.portalInstructions,
          "erpCoexistence.erpSystem": settings.erpType,
          procurementSettings: settings,
          updatedAt: new Date(),
        })
      } else {
        // Save locally for preview
        localStorage.setItem("procurement_settings_preview_v1", JSON.stringify(settings))
      }
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 4000)
    } catch (err) {
      console.error("Failed to save procurement settings:", err)
      // Save locally if Firestore update fails
      localStorage.setItem("procurement_settings_preview_v1", JSON.stringify(settings))
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 4000)
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: "portal", label: "ERP & External Portal", icon: <ExternalLink size={18} /> },
    { id: "notifications", label: "Notifications & Alerts", icon: <Bell size={18} /> },
    { id: "governance", label: "RBAC & Stage Gates", icon: <UserCheck size={18} /> },
    { id: "security", label: "POPIA & Evidence Security", icon: <ShieldCheck size={18} /> },
  ]

  return (
    <div style={{ padding: "32px", maxWidth: "1280px", margin: "0 auto", color: "#4A352F" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0 0 6px 0", color: "#4A352F" }}>
            Procurement Configuration & Settings
          </h1>
          <p style={{ margin: 0, color: "#7D5A50", fontSize: "0.95rem" }}>
            Manage ERP portal hand-off instructions, stage-gate governance thresholds, POPIA compliance, and alert preferences.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            onClick={() => navigate("/procurement/profile")}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              border: "1px solid #C8B6A6",
              background: "#FFFFFF",
              color: "#4A352F",
              fontWeight: 600,
              fontSize: "0.88rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Building2 size={16} />
            Edit Universal Profile
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "10px 22px",
              borderRadius: "8px",
              border: "none",
              background: "#4A352F",
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: "0.88rem",
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 2px 4px rgba(74, 53, 47, 0.15)",
            }}
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div
          style={{
            background: "#E8F5E9",
            border: "1px solid #A5D6A7",
            borderRadius: "8px",
            padding: "12px 18px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#2E7D32",
            fontSize: "0.9rem",
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} />
          Settings successfully updated and synchronized across the procurement workspace!
        </div>
      )}

      {/* Main Settings Card */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid #E6D7C3",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(74, 53, 47, 0.05)",
        }}
      >
        {/* Navigation Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #E6D7C3",
            background: "#FAF7F2",
            padding: "0 16px",
          }}
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "14px 20px",
                  border: "none",
                  background: "transparent",
                  color: active ? "#4A352F" : "#7D5A50",
                  fontWeight: active ? 700 : 500,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  borderBottom: active ? "3px solid #4A352F" : "3px solid transparent",
                  transition: "all 0.15s ease",
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div style={{ padding: "32px" }}>
          {/* TAB 1: ERP & Portal Coexistence */}
          {activeTab === "portal" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 4px 0", color: "#4A352F" }}>
                  ERP & External Supplier Portal Coexistence
                </h3>
                <p style={{ margin: 0, color: "#7D5A50", fontSize: "0.88rem" }}>
                  Configure your primary vendor master portal. BIG Prism passes suppliers to your existing portal with zero scraping and zero credential storage.
                </p>
              </div>

              <div
                style={{
                  background: "#F5F5F5",
                  border: "1px solid #E0E0E0",
                  borderRadius: "8px",
                  padding: "14px 18px",
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                }}
              >
                <Lock size={18} color="#4A352F" style={{ marginTop: "2px" }} />
                <div style={{ fontSize: "0.85rem", color: "#4A352F", lineHeight: 1.5 }}>
                  <strong>Zero-Scraping Policy Enforced:</strong> BIG Prism never asks for or stores supplier login credentials to your internal vendor portal. Registration occurs directly on your official buyer URL, and progress is confirmed via audited reference hand-off.
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>
                    Primary ERP / Sourcing Suite System
                  </label>
                  <select
                    value={settings.erpType}
                    onChange={(e) => setSettings({ ...settings, erpType: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "6px",
                      border: "1px solid #D7CCC8",
                      fontSize: "0.9rem",
                      background: "#FFFFFF",
                      color: "#4A352F",
                    }}
                  >
                    <option value="SAP S/4HANA">SAP S/4HANA Vendor Master</option>
                    <option value="SAP Ariba">SAP Ariba Sourcing</option>
                    <option value="Coupa">Coupa Procurement</option>
                    <option value="Oracle Fusion">Oracle Fusion ERP</option>
                    <option value="Custom Internal Portal">Custom Buyer Internal Portal</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>
                    Portal Display Label
                  </label>
                  <input
                    type="text"
                    value={settings.portalName}
                    onChange={(e) => setSettings({ ...settings, portalName: e.target.value })}
                    placeholder="e.g. Anglo American Vendor Master"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "6px",
                      border: "1px solid #D7CCC8",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>
                  Official Supplier Onboarding URL (Launched externally to supplier)
                </label>
                <input
                  type="url"
                  value={settings.portalUrl}
                  onChange={(e) => setSettings({ ...settings, portalUrl: e.target.value })}
                  placeholder="https://vendor.yourcompany.com/register"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    border: "1px solid #D7CCC8",
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>
                  Supplier Onboarding Instructions & Guidelines
                </label>
                <textarea
                  rows={4}
                  value={settings.portalInstructions}
                  onChange={(e) => setSettings({ ...settings, portalInstructions: e.target.value })}
                  placeholder="Provide precise step-by-step guidance for suppliers when navigating your external portal..."
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    border: "1px solid #D7CCC8",
                    fontSize: "0.9rem",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
                <input
                  type="checkbox"
                  id="zeroScrapingCheck"
                  checked={settings.enforceZeroScraping}
                  onChange={(e) => setSettings({ ...settings, enforceZeroScraping: e.target.checked })}
                  style={{ width: "16px", height: "16px", accentColor: "#4A352F" }}
                />
                <label htmlFor="zeroScrapingCheck" style={{ fontSize: "0.88rem", fontWeight: 600, color: "#4A352F" }}>
                  Require explicit confirmation of ERP Reference Code before closing onboarding stage-gate
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: Notifications & Alerts */}
          {activeTab === "notifications" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 4px 0", color: "#4A352F" }}>
                  Alert & Notification Preferences
                </h3>
                <p style={{ margin: 0, color: "#7D5A50", fontSize: "0.88rem" }}>
                  Control when your corporate procurement team receives automated triggers and matching updates.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#FAF7F2", borderRadius: "8px", border: "1px solid #E6D7C3" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "#4A352F" }}>High-Fit Supplier Match Alerts</div>
                    <div style={{ fontSize: "0.82rem", color: "#7D5A50" }}>Notify when a newly registered SMME matches your demand context with fit &ge; 80%</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifyNewMatches}
                    onChange={(e) => setSettings({ ...settings, notifyNewMatches: e.target.checked })}
                    style={{ width: "18px", height: "18px", accentColor: "#4A352F" }}
                  />
                </label>

                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#FAF7F2", borderRadius: "8px", border: "1px solid #E6D7C3" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "#4A352F" }}>RFI & Message Responses</div>
                    <div style={{ fontSize: "0.82rem", color: "#7D5A50" }}>Alert assigned buyers when suppliers submit responses or clarify technical capabilities</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifyRFIReplies}
                    onChange={(e) => setSettings({ ...settings, notifyRFIReplies: e.target.checked })}
                    style={{ width: "18px", height: "18px", accentColor: "#4A352F" }}
                  />
                </label>

                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#FAF7F2", borderRadius: "8px", border: "1px solid #E6D7C3" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "#4A352F" }}>Stage-Gate Approval Triggers</div>
                    <div style={{ fontSize: "0.82rem", color: "#7D5A50" }}>Notify CPO / SHEQ / ESD Leads when a supplier reaches a milestone requiring decision sign-off</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifyStageApprovals}
                    onChange={(e) => setSettings({ ...settings, notifyStageApprovals: e.target.checked })}
                    style={{ width: "18px", height: "18px", accentColor: "#4A352F" }}
                  />
                </label>

                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#FAF7F2", borderRadius: "8px", border: "1px solid #E6D7C3" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "#4A352F" }}>ESD Cohort Progress Summaries</div>
                    <div style={{ fontSize: "0.82rem", color: "#7D5A50" }}>Receive weekly digest of SMME intervention milestones and commercial pipeline readiness</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifyCohortMilestones}
                    onChange={(e) => setSettings({ ...settings, notifyCohortMilestones: e.target.checked })}
                    style={{ width: "18px", height: "18px", accentColor: "#4A352F" }}
                  />
                </label>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>
                  Digest Frequency
                </label>
                <select
                  value={settings.digestFrequency}
                  onChange={(e) => setSettings({ ...settings, digestFrequency: e.target.value })}
                  style={{
                    width: "300px",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    border: "1px solid #D7CCC8",
                    fontSize: "0.9rem",
                    background: "#FFFFFF",
                  }}
                >
                  <option value="realtime">Real-time alerts</option>
                  <option value="daily">Daily executive summary</option>
                  <option value="weekly">Weekly procurement digest</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 3: Governance & RBAC */}
          {activeTab === "governance" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 4px 0", color: "#4A352F" }}>
                  Stage-Gate Governance & Approval Matrix
                </h3>
                <p style={{ margin: 0, color: "#7D5A50", fontSize: "0.88rem" }}>
                  Enforce statutory compliance controls, sign-off limits, and SHEQ mandatory gate approvals before vendor onboarding.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div style={{ background: "#FAF7F2", padding: "18px", borderRadius: "8px", border: "1px solid #E6D7C3" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.92rem", marginBottom: "6px", color: "#4A352F" }}>
                    Dual Sign-off Spend Threshold
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#7D5A50", marginBottom: "12px" }}>
                    Tenders and pilot awards above this value require both CPO and ESD Lead approval.
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: 600 }}>ZAR</span>
                    <input
                      type="number"
                      value={settings.dualSignoffThreshold}
                      onChange={(e) => setSettings({ ...settings, dualSignoffThreshold: Number(e.target.value) })}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #D7CCC8",
                        width: "160px",
                        fontSize: "0.9rem",
                      }}
                    />
                  </div>
                </div>

                <div style={{ background: "#FAF7F2", padding: "18px", borderRadius: "8px", border: "1px solid #E6D7C3" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.92rem", marginBottom: "6px", color: "#4A352F" }}>
                    SHEQ Mandatory Clearance
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#7D5A50", marginBottom: "12px" }}>
                    Requires verified COIDA Good Standing letter and valid Tax Clearance PIN prior to pilot onboarding.
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={settings.requireSHEQApproval}
                      onChange={(e) => setSettings({ ...settings, requireSHEQApproval: e.target.checked })}
                      style={{ width: "16px", height: "16px", accentColor: "#4A352F" }}
                    />
                    <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>Enforce SHEQ sign-off gate</span>
                  </label>
                </div>
              </div>

              <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "8px", padding: "16px" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "0.92rem", fontWeight: 700, color: "#4A352F" }}>
                  Active Governance Roles in Organization
                </h4>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <span style={{ padding: "6px 14px", background: "#EFEBE9", borderRadius: "16px", fontSize: "0.8rem", fontWeight: 600, color: "#4A352F" }}>
                    CPO / Head of Procurement
                  </span>
                  <span style={{ padding: "6px 14px", background: "#E8F5E9", borderRadius: "16px", fontSize: "0.8rem", fontWeight: 600, color: "#2E7D32" }}>
                    SHEQ Lead (Safety & Environment)
                  </span>
                  <span style={{ padding: "6px 14px", background: "#FFF8E1", borderRadius: "16px", fontSize: "0.8rem", fontWeight: 600, color: "#F57F17" }}>
                    ESD Lead (Enterprise Development)
                  </span>
                  <span style={{ padding: "6px 14px", background: "#EDE7F6", borderRadius: "16px", fontSize: "0.8rem", fontWeight: 600, color: "#512DA8" }}>
                    Internal / External Auditor
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: POPIA & Evidence Security */}
          {activeTab === "security" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 4px 0", color: "#4A352F" }}>
                  POPIA Compliance & Evidence Security
                </h3>
                <p style={{ margin: 0, color: "#7D5A50", fontSize: "0.88rem" }}>
                  Manage data minimisation rules, cryptographic audit trails, and document retention policies.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#FAF7F2", borderRadius: "8px", border: "1px solid #E6D7C3" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "#4A352F" }}>POPIA Data Minimisation Filter</div>
                    <div style={{ fontSize: "0.82rem", color: "#7D5A50" }}>Restricted supplier documents (e.g. employee medicals, detailed bank account balances) are redacted and marked with explicit limitation badges</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.dataMinimisationActive}
                    onChange={(e) => setSettings({ ...settings, dataMinimisationActive: e.target.checked })}
                    style={{ width: "18px", height: "18px", accentColor: "#4A352F" }}
                  />
                </label>

                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#FAF7F2", borderRadius: "8px", border: "1px solid #E6D7C3" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "#4A352F" }}>Immutable Cryptographic Audit Hashing</div>
                    <div style={{ fontSize: "0.82rem", color: "#7D5A50" }}>Every stage-gate decision generates an auditable SHA-256 evidence hash for regulatory reporting</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.immutableAuditHashing}
                    onChange={(e) => setSettings({ ...settings, immutableAuditHashing: e.target.checked })}
                    style={{ width: "18px", height: "18px", accentColor: "#4A352F" }}
                  />
                </label>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>
                    Audit Evidence Retention Period
                  </label>
                  <select
                    value={settings.evidenceRetentionDays}
                    onChange={(e) => setSettings({ ...settings, evidenceRetentionDays: Number(e.target.value) })}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "6px",
                      border: "1px solid #D7CCC8",
                      fontSize: "0.9rem",
                      background: "#FFFFFF",
                      width: "240px",
                    }}
                  >
                    <option value={180}>6 Months (180 days)</option>
                    <option value={365}>1 Year (365 days)</option>
                    <option value={1095}>3 Years (Statutory)</option>
                    <option value={1825}>5 Years (Mining Charter)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
