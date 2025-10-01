"use client"

import { useState } from "react"
import { Filter, X } from "lucide-react"
import styles from "./support-funding.module.css";

export function FilterSupport({ filters, onFilterChange }) {
  const [showFilters, setShowFilters] = useState(false)

  const handleFilterChange = (key, value) => {
    onFilterChange({ [key]: value })
  }

  const clearFilters = () => {
    onFilterChange({
      location: "",
      matchScore: 50,
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
    <div style={{ marginBottom: "24px" }}>
      <button
        onClick={() => setShowFilters(!showFilters)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 24px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "500",
        }}
      >
        <Filter size={16} />
        {showFilters ? "Hide Filters" : "Show Filters"}
      </button>

      {showFilters && (
        <div
          style={{
            marginTop: "16px",
            padding: "24px",
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            border: "1px solid #e9ecef",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>Filter Support Applications</h3>
            <button
              onClick={clearFilters}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "8px 16px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              <X size={14} />
              Clear All
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
                Location
              </label>
              <select
                value={filters.location}
                onChange={(e) => handleFilterChange("location", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #dee2e6",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              >
                <option value="">All Locations</option>
                <option value="cape-town">Cape Town</option>
                <option value="johannesburg">Johannesburg</option>
                <option value="durban">Durban</option>
                <option value="pretoria">Pretoria</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
                Minimum Match Score: {filters.matchScore}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.matchScore}
                onChange={(e) => handleFilterChange("matchScore", Number.parseInt(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
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
                  border: "1px solid #dee2e6",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
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
                  border: "1px solid #dee2e6",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
                Sector
              </label>
              <select
                value={filters.sectors[0] || ""}
                onChange={(e) => handleFilterChange("sectors", e.target.value ? [e.target.value] : [])}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #dee2e6",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              >
                <option value="">All Sectors</option>
                <option value="tech">Technology</option>
                <option value="agri">Agriculture</option>
                <option value="cleantech">CleanTech</option>
                <option value="healthtech">HealthTech</option>
                <option value="edtech">EdTech</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
                Funding Stage
              </label>
              <select
                value={filters.stages[0] || ""}
                onChange={(e) => handleFilterChange("stages", e.target.value ? [e.target.value] : [])}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #dee2e6",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              >
                <option value="">All Stages</option>
                <option value="pre-seed">Pre-Seed</option>
                <option value="seed">Seed</option>
                <option value="series-a">Series A</option>
                <option value="series-b">Series B</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
