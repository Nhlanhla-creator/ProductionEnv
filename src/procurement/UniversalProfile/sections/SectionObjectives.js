"use client"

import React from "react"
import { Target, CheckCircle2, TrendingUp, Users, ShieldCheck, MapPin } from "lucide-react"

const OBJECTIVE_OPTIONS = [
  {
    id: "pre_vet",
    title: "Pre-vet Suppliers & Eliminate Risk",
    description: "Verify statutory compliance (Tax, CIPC, COIDA) and financial health before formal engagement.",
    icon: ShieldCheck,
  },
  {
    id: "build_pipeline",
    title: "Build Qualified Supplier Pipeline",
    description: "Discover verified high-score suppliers aligned with ongoing and future procurement opportunities.",
    icon: TrendingUp,
  },
  {
    id: "improve_onboarding",
    title: "Accelerate Buyer Onboarding",
    description: "Streamline supplier document collection and eliminate weeks of repetitive vendor-pack reviews.",
    icon: CheckCircle2,
  },
  {
    id: "manage_esd",
    title: "Manage Enterprise & Supplier Development (ESD)",
    description: "Track supplier growth cohorts, monitor 5C diagnostics, and close commercial readiness gaps.",
    icon: Users,
  },
  {
    id: "localisation",
    title: "Localisation & Community Sourcing",
    description: "Identify and build capacity for host-community and regionally based suppliers near operational sites.",
    icon: MapPin,
  },
  {
    id: "prepare_tenders",
    title: "Prepare Tenders & RFQs",
    description: "Curate vetted shortlists with explainable fit scores ready for formal RFP invitations.",
    icon: Target,
  },
]

export default function SectionObjectives({ data = {}, onChange }) {
  const toggleObjective = (id) => {
    const current = Array.isArray(data.selectedObjectives) ? data.selectedObjectives : []
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    onChange({ ...data, selectedObjectives: next })
  }

  const handleMetricChange = (field, value) => {
    const nextMetrics = { ...(data.successMeasures || {}), [field]: value }
    onChange({ ...data, successMeasures: nextMetrics })
  }

  const inputStyle = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "6px",
    border: "1px solid #C8B6A6",
    fontSize: "0.85rem",
    color: "#4A352F",
    background: "#FFFFFF",
    boxSizing: "border-box",
    outline: "none",
  }

  const labelStyle = {
    display: "block",
    fontSize: "0.775rem",
    fontWeight: 600,
    color: "#5D4037",
    marginBottom: "5px",
  }

  const selected = Array.isArray(data.selectedObjectives) ? data.selectedObjectives : []

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h4 style={{ margin: "0 0 6px 0", fontSize: "1rem", fontWeight: 700, color: "#4A352F" }}>
          Strategic Procurement Objectives & Success Measures
        </h4>
        <p style={{ margin: 0, fontSize: "0.825rem", color: "#8D6E63" }}>
          Configures your prioritized dashboard layout, success benchmarks, and automated match criteria.
        </p>
      </div>

      {/* Objectives Selection Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
        {OBJECTIVE_OPTIONS.map((obj) => {
          const isSelected = selected.includes(obj.id)
          const IconComponent = obj.icon

          return (
            <div
              key={obj.id}
              onClick={() => toggleObjective(obj.id)}
              style={{
                border: isSelected ? "2px solid #4A352F" : "1px solid #E8D5C4",
                borderRadius: "8px",
                padding: "14px 16px",
                background: isSelected ? "#FDF8F0" : "#FFFFFF",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    background: isSelected ? "#4A352F" : "#F5F0E1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconComponent size={16} color={isSelected ? "#FAF7F2" : "#8D6E63"} />
                </div>
                <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#4A352F" }}>
                  {obj.title}
                </div>
              </div>
              <p style={{ margin: 0, fontSize: "0.775rem", color: "#6D4C41", lineHeight: "1.4" }}>
                {obj.description}
              </p>
            </div>
          )
        })}
      </div>

      {/* Success Measures & KPIs */}
      <div
        style={{
          background: "#FAF7F2",
          border: "1px solid #E8D5C4",
          borderRadius: "8px",
          padding: "18px",
        }}
      >
        <h5 style={{ margin: "0 0 12px 0", fontSize: "0.85rem", fontWeight: 700, color: "#4A352F" }}>
          Target Success Benchmarks & KPIs
        </h5>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Target Verified Intake (%)</label>
            <input
              type="text"
              placeholder="e.g. 85%"
              value={data.successMeasures?.targetVerifiedPercent || ""}
              onChange={(e) => handleMetricChange("targetVerifiedPercent", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Localisation Spend Target (%)</label>
            <input
              type="text"
              placeholder="e.g. 40%"
              value={data.successMeasures?.targetLocalSpendPercent || ""}
              onChange={(e) => handleMetricChange("targetLocalSpendPercent", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Annual Intake Capacity (Suppliers)</label>
            <input
              type="text"
              placeholder="e.g. 150 suppliers/yr"
              value={data.successMeasures?.annualSupplierIntake || ""}
              onChange={(e) => handleMetricChange("annualSupplierIntake", e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
