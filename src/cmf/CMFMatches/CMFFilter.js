import React, { useState } from "react"
import { Filter, X } from "lucide-react"

export default function CMFFilter({ filters, onFilterChange }) {
  const [showFilters, setShowFilters] = useState(false)

  const handleFilterChange = (key, value) => {
    onFilterChange({ [key]: value })
  }

  const clearFilters = () => {
    onFilterChange({
      location: "",
      matchScore: 0,
      minValue: "",
      maxValue: "",
      instruments: [],
      stages: [],
      sectors: [],
      supportTypes: [],
      smeType: "",
      sortBy: "",
    })
  }

  return (
    <div style={{ marginBottom: "24px" }} className="font-sans">
      <button
        onClick={() => setShowFilters(!showFilters)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 20px",
          backgroundColor: "#8D6E63",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "600",
          fontSize: "0.85rem",
          transition: "all 0.2s ease",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#5D4037"}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#8D6E63"}
      >
        <Filter size={14} />
        {showFilters ? "Hide Filters" : "Show Filters"}
      </button>

      {showFilters && (
        <div
          style={{
            marginTop: "16px",
            padding: "24px",
            backgroundColor: "#faf7f2",
            borderRadius: "16px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
            border: "1px solid #e6d7c3",
            fontFamily: "inherit"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#4a352f", margin: 0 }}>Filter Matches</h3>
            <button
              onClick={clearFilters}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                backgroundColor: "transparent",
                color: "#7d5a50",
                border: "1px solid #c8b6a6",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: "600",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#8D6E63"
                e.currentTarget.style.color = "white"
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent"
                e.currentTarget.style.color = "#7d5a50"
              }}
            >
              <X size={12} />
              Clear All
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#4a352f", marginBottom: "8px" }}>
                Location (Province)
              </label>
              <select
                value={filters.location}
                onChange={(e) => handleFilterChange("location", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #c8b6a6",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  backgroundColor: "white",
                  color: "#4a352f"
                }}
              >
                <option value="">All Locations</option>
                <option value="Gauteng">Gauteng</option>
                <option value="Western Cape">Western Cape</option>
                <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                <option value="Eastern Cape">Eastern Cape</option>
                <option value="Free State">Free State</option>
                <option value="Limpopo">Limpopo</option>
                <option value="Mpumalanga">Mpumalanga</option>
                <option value="North West">North West</option>
                <option value="Northern Cape">Northern Cape</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#4a352f", marginBottom: "8px" }}>
                Minimum Match Score: {filters.matchScore}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.matchScore}
                onChange={(e) => handleFilterChange("matchScore", Number(e.target.value))}
                style={{ width: "100%", accentColor: "#8D6E63" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#4a352f", marginBottom: "8px" }}>
                Funding Required (Min)
              </label>
              <input
                type="text"
                value={filters.minValue}
                onChange={(e) => handleFilterChange("minValue", e.target.value)}
                placeholder="e.g., R100,000"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #c8b6a6",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  backgroundColor: "white",
                  color: "#4a352f"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#4a352f", marginBottom: "8px" }}>
                Funding Required (Max)
              </label>
              <input
                type="text"
                value={filters.maxValue}
                onChange={(e) => handleFilterChange("maxValue", e.target.value)}
                placeholder="e.g., R5,000,000"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #c8b6a6",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  backgroundColor: "white",
                  color: "#4a352f"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#4a352f", marginBottom: "8px" }}>
                Sector
              </label>
              <select
                value={filters.sectors[0] || ""}
                onChange={(e) => handleFilterChange("sectors", e.target.value ? [e.target.value] : [])}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #c8b6a6",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  backgroundColor: "white",
                  color: "#4a352f"
                }}
              >
                <option value="">All Sectors</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Automotive">Automotive</option>
                <option value="CleanTech">CleanTech</option>
                <option value="EdTech">EdTech</option>
                <option value="HealthTech">HealthTech</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Technology">Technology</option>
                <option value="Tourism">Tourism</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#4a352f", marginBottom: "8px" }}>
                Operation Stage
              </label>
              <select
                value={filters.stages[0] || ""}
                onChange={(e) => handleFilterChange("stages", e.target.value ? [e.target.value] : [])}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #c8b6a6",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  backgroundColor: "white",
                  color: "#4a352f"
                }}
              >
                <option value="">All Stages</option>
                <option value="Pre-revenue Startup">Pre-revenue Startup</option>
                <option value="Post-revenue Startup">Post-revenue Startup</option>
                <option value="Growth Stage">Growth Stage</option>
                <option value="Mature Operation">Mature Operation</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
