"use client"

import React, { useState } from "react"
import { Layers, Plus, X, Search, DollarSign } from "lucide-react"

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

export default function SectionDemand({ data = {}, onChange }) {
  const [customInput, setCustomInput] = useState("")

  const categories = Array.isArray(data.categories) ? data.categories : []

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

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h4 style={{ margin: "0 0 6px 0", fontSize: "1rem", fontWeight: 700, color: "#4A352F" }}>
          Demand Context & Sourcing Taxonomy
        </h4>
        <p style={{ margin: 0, fontSize: "0.825rem", color: "#8D6E63" }}>
          Configures the product and service categories that trigger supplier matches and algorithm weighting.
        </p>
      </div>

      {/* Selected Categories Display */}
      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>
          Active Sourcing Categories ({categories.length} selected) *
        </label>
        {categories.length === 0 ? (
          <div style={{ fontSize: "0.8rem", color: "#C62828", fontStyle: "italic", marginBottom: "8px" }}>
            No categories selected. Please select at least one category to achieve "Match Ready" status.
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
            {categories.map((cat) => (
              <span
                key={cat}
                style={{
                  background: "#4A352F",
                  color: "#FAF7F2",
                  padding: "5px 12px",
                  borderRadius: "16px",
                  fontSize: "0.775rem",
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
        )}
      </div>

      {/* Core Taxonomy Grid */}
      <div style={{ marginBottom: "20px" }}>
        <label style={labelStyle}>Select from Enterprise Taxonomy Library</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {CORE_TAXONOMY_CATEGORIES.map((cat) => {
            const isSelected = categories.includes(cat)
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: isSelected ? "1px solid #4A352F" : "1px solid #D7CCC8",
                  background: isSelected ? "#FDF8F0" : "#FFFFFF",
                  color: isSelected ? "#4A352F" : "#6D4C41",
                  fontSize: "0.775rem",
                  fontWeight: isSelected ? 600 : 400,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {isSelected ? "✓" : "+"} {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom Category Input */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        <input
          type="text"
          placeholder="Add custom niche category or commodity..."
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
          <Plus size={14} /> Add
        </button>
      </div>

      {/* Volume & Budget Context */}
      <div
        style={{
          background: "#FAF7F2",
          border: "1px solid #E8D5C4",
          borderRadius: "8px",
          padding: "16px",
        }}
      >
        <h5 style={{ margin: "0 0 12px 0", fontSize: "0.85rem", fontWeight: 700, color: "#4A352F" }}>
          Spend Volumes & Operational Scope
        </h5>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Estimated Annual Procurement Spend (ZAR)</label>
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
            <label style={labelStyle}>Host Community / Localisation Sourcing Radius</label>
            <input
              type="text"
              placeholder="e.g. 50km radius of mine site / Host Municipality"
              value={data.localRadius || ""}
              onChange={(e) => handleChange("localRadius", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Delivery Flexibility Expected</label>
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
        </div>
      </div>
    </div>
  )
}
