"use client"

import React, { useState } from "react"
import { Layers, Plus, X } from "lucide-react"
import MultiSelect from "../../../components/MultiSelect"

const CORE_TAXONOMY_CATEGORIES = [
  "Information Technology",
  "Facilities Management",
  "Logistics & Freight",
  "Travel & Transport",
  "Construction & Civil Works",
  "Industrial Equipment & Spares",
  "Financial Services & Auditing",
  "Legal & Advisory Services",
  "Security & Guarding Services",
  "Catering & Hospitality",
  "Cleaning & Waste Management",
  "PPE & Safety Equipment",
  "Mining Consumables & Drilling",
  "Engineering & Fabrication",
  "Marketing & Communications",
  "Human Resources & Training",
]

const GEOGRAPHY_TYPES = [
  "Host Community / Local Site Radius",
  "South Africa (Provincial / National)",
  "Cross-border / SADC Region",
  "International / Foreign",
  "No Geographic Preference",
]

const PROVINCES_LIST = [
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
]

export default function SectionDemand({ data = {}, onChange }) {
  const [customInput, setCustomInput] = useState("")

  const categories = Array.isArray(data.categories) ? data.categories : []
  const selectedProvinces = Array.isArray(data.selectedProvinces) ? data.selectedProvinces : []
  const geoType = data.geographyType || "South Africa (Provincial / National)"

  const toggleCategory = (cat) => {
    const next = categories.includes(cat)
      ? categories.filter((c) => c !== cat)
      : [...categories, cat]
    onChange({ ...data, categories: next })
  }

  const addCustomCategory = () => {
    if (customInput.trim() && !categories.includes(customInput.trim())) {
      onChange({ ...data, categories: [...categories, customInput.trim()] })
      setCustomInput("")
    }
  }

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value })
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

  const taxonomyOptions = CORE_TAXONOMY_CATEGORIES.map((c) => ({ value: c, label: c }))
  const provinceOptions = PROVINCES_LIST.map((p) => ({ value: p, label: p }))

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h4 style={{ margin: "0 0 6px 0", fontSize: "1rem", fontWeight: 700, color: "#4A352F" }}>
          Demand Context & Sourcing Taxonomy
        </h4>
        <p style={{ margin: 0, fontSize: "0.825rem", color: "#8D6E63" }}>
          Configure product and service categories, geographic preferences, spend thresholds, and supplier onboarding guidelines.
        </p>
      </div>

      {/* Sourcing Categories Multi-Select Dropdown */}
      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>
          Select from Enterprise Taxonomy Library ({categories.length} selected) *
        </label>
        <MultiSelect
          options={taxonomyOptions}
          selected={categories}
          onChange={(newSelected) => handleChange("categories", newSelected)}
          placeholder="Search and select categories from taxonomy library..."
        />
        {categories.length === 0 && (
          <div style={{ fontSize: "0.775rem", color: "#C62828", marginTop: "6px" }}>
            * Please select at least one sourcing category to unlock Match Ready status.
          </div>
        )}
      </div>

      {/* Selected Categories Tags */}
      {categories.length > 0 && (
        <div style={{ marginBottom: "18px" }}>
          <div style={{ fontSize: "0.725rem", color: "#8D6E63", marginBottom: "6px" }}>
            Active Sourcing Categories:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {categories.map((cat) => (
              <span
                key={cat}
                style={{
                  background: "#4A352F",
                  color: "#FAF7F2",
                  padding: "4px 10px",
                  borderRadius: "14px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {cat}
                <button
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#D7CCC8",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: "0.75rem",
                  }}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Custom Category Input */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        <input
          type="text"
          placeholder="Add custom niche commodity or service..."
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addCustomCategory()
            }
          }}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          type="button"
          onClick={addCustomCategory}
          style={{
            padding: "8px 16px",
            background: "#4A352F",
            color: "#FAF7F2",
            border: "none",
            borderRadius: "6px",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <Plus size={14} /> Add Custom
        </button>
      </div>

      {/* Geographic Sourcing Preferences */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E6D7C3",
          borderRadius: "8px",
          padding: "18px",
          marginBottom: "20px",
        }}
      >
        <h5 style={{ margin: "0 0 4px 0", fontSize: "0.9rem", fontWeight: 700, color: "#4A352F" }}>
          Geographic Sourcing Preferences
        </h5>
        <p style={{ margin: "0 0 14px 0", fontSize: "0.775rem", color: "#8D6E63" }}>
          Define geographic boundaries and host community localisation tiers. Tender-specific preferences override general corporate settings.
        </p>

        <div style={{ marginBottom: "14px" }}>
          <label style={labelStyle}>Geographic Sourcing Scope</label>
          <select
            value={geoType}
            onChange={(e) => handleChange("geographyType", e.target.value)}
            style={inputStyle}
          >
            {GEOGRAPHY_TYPES.map((gt) => (
              <option key={gt} value={gt}>{gt}</option>
            ))}
          </select>
        </div>

        {geoType !== "No Geographic Preference" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div>
              <label style={labelStyle}>Host Community / Site Radius</label>
              <input
                type="text"
                placeholder="e.g. Within 50km of operational sites / Host Municipality"
                value={data.localRadius || ""}
                onChange={(e) => handleChange("localRadius", e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Designated Municipalities / Districts</label>
              <input
                type="text"
                placeholder="e.g. Rustenburg, eMalahleni, City of Johannesburg"
                value={data.designatedMunicipalities || ""}
                onChange={(e) => handleChange("designatedMunicipalities", e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        )}

        {/* Operating Provinces Multi-Select Dropdown */}
        <div style={{ marginBottom: "4px" }}>
          <label style={labelStyle}>Target Operating Provinces</label>
          <MultiSelect
            options={provinceOptions}
            selected={selectedProvinces}
            onChange={(newSelected) => handleChange("selectedProvinces", newSelected)}
            placeholder="Select operating provinces..."
          />
        </div>
      </div>

      {/* Spend Volumes & Operational Scope */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E6D7C3",
          borderRadius: "8px",
          padding: "18px",
          marginBottom: "20px",
        }}
      >
        <h5 style={{ margin: "0 0 12px 0", fontSize: "0.9rem", fontWeight: 700, color: "#4A352F" }}>
          Spend Volumes & Operational Scope
        </h5>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Estimated Annual Sourcing Spend (ZAR)</label>
            <input
              type="text"
              placeholder="e.g. R 50,000,000 - R 250,000,000"
              value={data.annualSpendRange || ""}
              onChange={(e) => handleChange("annualSpendRange", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Typical Order / Contract Size</label>
            <input
              type="text"
              placeholder="e.g. R 100,000 - R 5,000,000"
              value={data.typicalOrderRange || ""}
              onChange={(e) => handleChange("typicalOrderRange", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Delivery Mode Preference</label>
            <select
              value={data.deliveryModePreference || "Hybrid"}
              onChange={(e) => handleChange("deliveryModePreference", e.target.value)}
              style={inputStyle}
            >
              <option value="On-site">On-site Delivery Only</option>
              <option value="Hybrid">Hybrid (On-site & Remote)</option>
              <option value="Remote">Remote / Digital Delivery</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Payment Terms Baseline</label>
            <select
              value={data.paymentTerms || "30 Days from Invoice"}
              onChange={(e) => handleChange("paymentTerms", e.target.value)}
              style={inputStyle}
            >
              <option value="15 Days (SMME Fast-track)">15 Days (SMME Fast-track)</option>
              <option value="30 Days from Invoice">30 Days from Invoice</option>
              <option value="60 Days from Statement">60 Days from Statement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Supplier Onboarding Instructions */}
      <div
        style={{
          background: "#FAF7F2",
          border: "1px solid #E8D5C4",
          borderRadius: "8px",
          padding: "18px",
        }}
      >
        <h5 style={{ margin: "0 0 4px 0", fontSize: "0.9rem", fontWeight: 700, color: "#4A352F" }}>
          Supplier Onboarding Instructions & Guidelines
        </h5>
        <p style={{ margin: "0 0 12px 0", fontSize: "0.775rem", color: "#8D6E63" }}>
          Free-text instructions provided to shortlisted or applicant suppliers detailing requirements for vendor pack submission, mandatory tender documents, and registration steps.
        </p>

        <textarea
          rows={5}
          placeholder="e.g. All prospective suppliers must hold active COIDA Letters of Good Standing and valid Tax Compliance status. For engineering works, submit CIDB grade verification. Shortlisted vendors will receive a formal invite to complete registration on our vendor portal with their verified BIG Green Passport."
          value={data.onboardingInstructions || ""}
          onChange={(e) => handleChange("onboardingInstructions", e.target.value)}
          style={{
            ...inputStyle,
            fontFamily: "inherit",
            resize: "vertical",
            lineHeight: "1.5",
          }}
        />
      </div>
    </div>
  )
}
