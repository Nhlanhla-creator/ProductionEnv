"use client"

import React, { useState, useMemo, useEffect, useCallback } from "react"
import {
  Search,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Eye,
  CheckSquare,
  Square,
  Scale,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileQuestion,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Bookmark,
  Share2,
} from "lucide-react"

import {
  PROCUREMENT_COLUMN_DEFS,
  DEFAULT_PROCUREMENT_COLUMN_ORDER,
  DEFAULT_PROCUREMENT_VISIBILITY,
  DEFAULT_PROCUREMENT_WIDTHS,
  SUPPLIER_KEY,
  ACTION_KEY,
  FIXED_WIDTHS,
  MIN_COLUMN_WIDTH,
} from "./procurementColumns"

const VIEWS_STORAGE_KEY = "procurement-matches-views-v1"

/**
 * Visual circular gauge for BIG Score matching the design in the brief:
 * Soft beige circular track, proportional active colored arc, inner score value,
 * and status pill below (Weak / Moderate / Strong).
 */
function BigScoreGauge({ score }) {
  const numericScore = typeof score === "number" ? Math.round(score) : Number(score)
  const isPending = score === null || score === undefined || isNaN(numericScore)

  let color = "#27AE60"
  let bgColor = "#E8F5E9"
  let label = "Strong"

  if (isPending) {
    color = "#8D6E63"
    bgColor = "#F5F0E1"
    label = "Pending"
  } else if (numericScore < 50) {
    color = "#E53935"
    bgColor = "#FFEBEE"
    label = "Weak"
  } else if (numericScore < 75) {
    color = "#E67E22"
    bgColor = "#FFF3E0"
    label = "Moderate"
  } else {
    color = "#27AE60"
    bgColor = "#E8F5E9"
    label = "Strong"
  }

  const radius = 15
  const circumference = 2 * Math.PI * radius // ~94.25
  const validScore = isPending ? 0 : Math.min(Math.max(numericScore, 0), 100)
  const strokeDashoffset = circumference - (circumference * validScore) / 100

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="40" height="40" viewBox="0 0 40 40">
          {/* Background Ring Track */}
          <circle
            cx="20"
            cy="20"
            r={radius}
            fill="none"
            stroke="#E8DFD8"
            strokeWidth="3.5"
          />
          {/* Progress Arc */}
          {!isPending && validScore > 0 && (
            <circle
              cx="20"
              cy="20"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="3.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 20 20)"
            />
          )}
        </svg>
        <span
          style={{
            position: "absolute",
            fontSize: "0.8rem",
            fontWeight: 700,
            color: color,
            lineHeight: 1,
          }}
        >
          {isPending ? "—" : validScore}
        </span>
      </div>
      <div
        style={{
          marginTop: "4px",
          display: "inline-block",
          padding: "2px 10px",
          borderRadius: "12px",
          fontSize: "0.7rem",
          fontWeight: 600,
          background: bgColor,
          color: color,
          lineHeight: 1.2,
        }}
      >
        {label}
      </div>
    </div>
  )
}

/**
 * Requirement Fit cell with percentage, (?) trigger, and horizontal progress bar.
 * Clicking opens the Match Reason breakdown modal/drawer.
 */
function RequirementFitCell({ fit, onClick }) {
  const fitValue = typeof fit === "number" ? Math.round(fit) : Math.round(Number(fit) || 0)
  const fitColor = fitValue >= 75 ? "#27AE60" : fitValue >= 50 ? "#F39C12" : "#E74C3C"

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick && onClick()
        }
      }}
      title={`Match Fit: ${fitValue}%. Click to view criteria breakdown & AI explanation.`}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: "4px 8px",
        borderRadius: "6px",
        transition: "background 0.15s ease",
        userSelect: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#F2EAE1"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
          marginBottom: "4px",
        }}
      >
        <span
          style={{
            fontSize: "0.875rem",
            fontWeight: 700,
            color: fitColor,
          }}
        >
          {fitValue}%
        </span>
        <HelpCircle
          size={13}
          color="#8D6E63"
          style={{ opacity: 0.85 }}
        />
      </div>

      {/* Horizontal Progress Bar */}
      <div
        style={{
          width: "88px",
          height: "4px",
          borderRadius: "3px",
          background: "#E8DFD8",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.min(Math.max(fitValue, 0), 100)}%`,
            height: "100%",
            background: fitColor,
            borderRadius: "3px",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  )
}

export default function MatchedSuppliersTable({
  suppliers = [],
  loading = false,
  error = null,
  onInspectSupplier,
  onOpenMatchReason,
  onOpenCompare,
  onOpenRFI,
  onShortlist,
  demandContext,
  onExtendSearch,
  isPreferredTab = false,
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedBBBEE, setSelectedBBBEE] = useState("all")
  const [selectedPassport, setSelectedPassport] = useState("all")
  const [minFitScore, setMinFitScore] = useState(0)

  const [sortField, setSortField] = useState("requirementFit")
  const [sortAsc, setSortAsc] = useState(false)

  const [selectedIds, setSelectedIds] = useState([])
  const [columnVisibility, setColumnVisibility] = useState(DEFAULT_PROCUREMENT_VISIBILITY)
  const [showColumnPicker, setShowColumnPicker] = useState(false)
  const [density, setDensity] = useState("comfortable") // "compact" | "comfortable" | "spacious"

  // Load saved column visibility
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEWS_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.columnVisibility) {
          setColumnVisibility({ ...DEFAULT_PROCUREMENT_VISIBILITY, ...parsed.columnVisibility })
        }
      }
    } catch {
      // Non-fatal
    }
  }, [])

  // Persist column visibility
  const updateVisibility = (key, value) => {
    setColumnVisibility((prev) => {
      const next = { ...prev, [key]: value }
      try {
        localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify({ columnVisibility: next }))
      } catch {}
      return next
    })
  }

  // Categories list extracted from data
  const availableCategories = useMemo(() => {
    const set = new Set()
    suppliers.forEach((s) => {
      if (s.offeringCategory && s.offeringCategory !== "Not specified") {
        set.add(s.offeringCategory)
      }
    })
    return Array.from(set).sort()
  }, [suppliers])

  // Filter & Search logic
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = (s.name || "").toLowerCase().includes(q)
        const matchCat = (s.offeringCategory || "").toLowerCase().includes(q)
        const matchLoc = (s.location || "").toLowerCase().includes(q)
        if (!matchName && !matchCat && !matchLoc) return false
      }

      // Category filter
      if (selectedCategory !== "all" && s.offeringCategory !== selectedCategory) {
        return false
      }

      // BBBEE filter
      if (selectedBBBEE !== "all") {
        const cleanB = (s.bbbeeLevel || "").toLowerCase()
        if (selectedBBBEE === "Level 1" && !cleanB.includes("level 1")) return false
        if (selectedBBBEE === "Level 1-2" && !cleanB.includes("level 1") && !cleanB.includes("level 2")) return false
        if (selectedBBBEE === "Level 1-4" && (cleanB.includes("level 5") || cleanB.includes("level 6") || cleanB.includes("level 7") || cleanB.includes("level 8") || cleanB.includes("non-compliant"))) return false
      }

      // Passport Status filter
      if (selectedPassport !== "all" && s.passportStatus !== selectedPassport) {
        return false
      }

      // Min Requirement Fit score
      if (s.requirementFit < minFitScore) {
        return false
      }

      return true
    })
  }, [suppliers, searchQuery, selectedCategory, selectedBBBEE, selectedPassport, minFitScore])

  // Sorting logic
  const sortedSuppliers = useMemo(() => {
    const list = [...filteredSuppliers]
    list.sort((a, b) => {
      let va = a[sortField]
      let vb = b[sortField]

      if (va === null || va === undefined) va = ""
      if (vb === null || vb === undefined) vb = ""

      if (typeof va === "number" && typeof vb === "number") {
        return sortAsc ? va - vb : vb - va
      }

      const sa = String(va).toLowerCase()
      const sb = String(vb).toLowerCase()
      return sortAsc ? sa.localeCompare(sb) : sb.localeCompare(sa)
    })
    return list
  }, [filteredSuppliers, sortField, sortAsc])

  // Toggle supplier checkbox
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id)
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id] // Keep max 3
      }
      return [...prev, id]
    })
  }

  const handleSelectAll = () => {
    if (selectedIds.length === sortedSuppliers.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(sortedSuppliers.slice(0, 3).map((s) => s.id))
    }
  }

  const resetFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSelectedBBBEE("all")
    setSelectedPassport("all")
    setMinFitScore(0)
    setSelectedIds([])
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc((prev) => !prev)
    } else {
      setSortField(field)
      setSortAsc(false)
    }
  }

  const cellPadding = density === "compact" ? "8px 12px" : density === "spacious" ? "16px 14px" : "12px 14px"

  return (
    <div style={{ width: "100%", fontFamily: "inherit" }}>
      {/* Table Toolbar */}
      <div
        style={{
          background: "#FAF7F2",
          border: "1px solid #E6D7C3",
          borderRadius: "10px",
          padding: "16px 20px",
          marginBottom: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {/* Top Row: Search and Action Buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          {/* Search box */}
          <div style={{ position: "relative", minWidth: "280px", flex: 1, maxWidth: "420px" }}>
            <Search size={16} color="#8D6E63" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search by supplier name, category, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px 9px 36px",
                borderRadius: "6px",
                border: "1px solid #C8B6A6",
                background: "#FFFFFF",
                fontSize: "0.85rem",
                color: "#4A352F",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#8D6E63",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Toolbar Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Compare Button */}
            {selectedIds.length >= 2 && (
              <button
                onClick={() => {
                  const toCompare = suppliers.filter((s) => selectedIds.includes(s.id))
                  if (onOpenCompare) onOpenCompare(toCompare)
                }}
                style={{
                  padding: "8px 14px",
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
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                <Scale size={15} color="#D4AF37" /> Compare Selected ({selectedIds.length}/3)
              </button>
            )}

            {/* Density Toggle */}
            <div style={{ display: "flex", border: "1px solid #C8B6A6", borderRadius: "6px", overflow: "hidden", background: "#FFFFFF" }}>
              {["compact", "comfortable", "spacious"].map((d) => (
                <button
                  key={d}
                  onClick={() => setDensity(d)}
                  style={{
                    padding: "6px 10px",
                    background: density === d ? "#7D5A50" : "transparent",
                    color: density === d ? "#FAF7F2" : "#6D4C41",
                    border: "none",
                    fontSize: "0.725rem",
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Column Visibility Picker Dropdown */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowColumnPicker((prev) => !prev)}
                style={{
                  padding: "7px 12px",
                  background: "#FFFFFF",
                  border: "1px solid #C8B6A6",
                  borderRadius: "6px",
                  color: "#4A352F",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <SlidersHorizontal size={14} /> Columns
              </button>

              {showColumnPicker && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "100%",
                    marginTop: "6px",
                    background: "#FFFFFF",
                    border: "1px solid #E6D7C3",
                    borderRadius: "8px",
                    padding: "12px",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
                    zIndex: 100,
                    width: "220px",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#4A352F", marginBottom: "8px" }}>
                    Configure Visible Columns
                  </div>
                  {DEFAULT_PROCUREMENT_COLUMN_ORDER.map((colKey) => {
                    const def = PROCUREMENT_COLUMN_DEFS[colKey]
                    return (
                      <label
                        key={colKey}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "0.75rem",
                          color: "#5D4037",
                          padding: "4px 0",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={columnVisibility[colKey] !== false}
                          onChange={(e) => updateVisibility(colKey, e.target.checked)}
                        />
                        {def.label}
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Reset Filters */}
            <button
              onClick={resetFilters}
              style={{
                padding: "7px 12px",
                background: "transparent",
                border: "1px solid #E6D7C3",
                borderRadius: "6px",
                color: "#8D6E63",
                fontSize: "0.8rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>
        </div>

        {/* Bottom Row: Filter Dropdowns */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6D4C41", textTransform: "uppercase" }}>
            Filter By:
          </span>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #C8B6A6",
              background: "#FFFFFF",
              fontSize: "0.775rem",
              color: "#4A352F",
            }}
          >
            <option value="all">All Categories ({availableCategories.length})</option>
            {availableCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* B-BBEE Level Dropdown */}
          <select
            value={selectedBBBEE}
            onChange={(e) => setSelectedBBBEE(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #C8B6A6",
              background: "#FFFFFF",
              fontSize: "0.775rem",
              color: "#4A352F",
            }}
          >
            <option value="all">All B-BBEE Levels</option>
            <option value="Level 1">Level 1 Only</option>
            <option value="Level 1-2">Level 1 or 2</option>
            <option value="Level 1-4">Level 1 to 4 (Enterprise Compliant)</option>
          </select>

          {/* Passport Status Dropdown */}
          <select
            value={selectedPassport}
            onChange={(e) => setSelectedPassport(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #C8B6A6",
              background: "#FFFFFF",
              fontSize: "0.775rem",
              color: "#4A352F",
            }}
          >
            <option value="all">All Passport States</option>
            <option value="Active">Passport Active</option>
            <option value="In Review">Passport In Review</option>
            <option value="Gap Identified">Gaps Identified</option>
          </select>

          {/* Min Fit Score Slider/Select */}
          <select
            value={minFitScore}
            onChange={(e) => setMinFitScore(Number(e.target.value))}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #C8B6A6",
              background: "#FFFFFF",
              fontSize: "0.775rem",
              color: "#4A352F",
            }}
          >
            <option value={0}>Any Match %</option>
            <option value={50}>≥ 50% Match</option>
            <option value={70}>≥ 70% Strong Match</option>
            <option value={85}>≥ 85% Optimal Match</option>
          </select>

          {/* Result counter */}
          <div style={{ marginLeft: "auto", fontSize: "0.775rem", color: "#8D6E63" }}>
            Showing <strong>{sortedSuppliers.length}</strong> of <strong>{suppliers.length}</strong> matched suppliers
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E6D7C3",
          borderRadius: "10px",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ overflowX: "auto", width: "100%" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            {/* Table Header */}
            <thead>
              <tr style={{ background: "#4A352F", color: "#FAF7F2", fontSize: "0.8rem", borderBottom: "2px solid #3E2B26" }}>
                {/* Selection Checkbox */}
                <th style={{ padding: "12px 14px", width: "42px", textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === Math.min(3, sortedSuppliers.length)}
                    onChange={handleSelectAll}
                    style={{ cursor: "pointer" }}
                  />
                </th>

                {/* Pinned Supplier Column */}
                <th
                  onClick={() => handleSort("name")}
                  style={{
                    padding: "12px 14px",
                    width: FIXED_WIDTHS[SUPPLIER_KEY],
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    Supplier Organization
                    {sortField === "name" ? (sortAsc ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={12} opacity={0.5} />}
                  </div>
                </th>

                {/* Configured Columns */}
                {DEFAULT_PROCUREMENT_COLUMN_ORDER.map((colKey) => {
                  if (columnVisibility[colKey] === false) return null
                  const def = PROCUREMENT_COLUMN_DEFS[colKey]
                  return (
                    <th
                      key={colKey}
                      onClick={() => def.sortable && handleSort(colKey)}
                      style={{
                        padding: "12px 14px",
                        width: def.width,
                        textAlign: def.align || "left",
                        cursor: def.sortable ? "pointer" : "default",
                        whiteSpace: "nowrap",
                      }}
                      title={def.tooltip}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: def.align === "center" ? "center" : "flex-start",
                          gap: "5px",
                        }}
                      >
                        {def.label}
                        {def.sortable && (
                          sortField === colKey ? (sortAsc ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={12} opacity={0.5} />
                        )}
                      </div>
                    </th>
                  )
                })}

                {/* Actions Column */}
                <th style={{ padding: "12px 14px", width: FIXED_WIDTHS[ACTION_KEY], textAlign: "center" }}>
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {loading ? (
                /* Loading Skeleton Rows */
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #F0E6D8" }}>
                    <td colSpan={12} style={{ padding: "16px", textAlign: "center", color: "#8D6E63" }}>
                      <div style={{ height: "24px", background: "#F5F0E1", borderRadius: "4px", animation: "pulse 1.2s infinite ease-in-out" }} />
                    </td>
                  </tr>
                ))
              ) : sortedSuppliers.length === 0 ? (
                /* Empty State */
                <tr>
                  <td colSpan={12} style={{ padding: "48px 24px", textAlign: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                      <FileQuestion size={40} color="#A89482" />
                      <div style={{ fontSize: "1rem", fontWeight: 600, color: "#4A352F" }}>
                        No suppliers match the selected filters
                      </div>
                      <div style={{ fontSize: "0.825rem", color: "#8D6E63", maxWidth: "400px" }}>
                        Try lowering the minimum requirement fit score or broadening the category and B-BBEE filters.
                      </div>
                      <div style={{ display: "flex", gap: "10px", marginTop: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                        <button
                          onClick={resetFilters}
                          style={{
                            padding: "8px 16px",
                            background: "#4A352F",
                            border: "none",
                            borderRadius: "6px",
                            color: "#FAF7F2",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Reset All Filters
                        </button>
                        {isPreferredTab && onExtendSearch && (
                          <button
                            onClick={onExtendSearch}
                            style={{
                              padding: "8px 16px",
                              background: "#FAF7F2",
                              border: "1px solid #4A352F",
                              borderRadius: "6px",
                              color: "#4A352F",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Extend Search to Full Directory →
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                /* Data Rows */
                sortedSuppliers.map((supplier, idx) => {
                  const isSelected = selectedIds.includes(supplier.id)

                  return (
                    <tr
                      key={supplier.id}
                      style={{
                        borderBottom: "1px solid #F0E6D8",
                        background: isSelected ? "#FDF8F0" : idx % 2 === 0 ? "#FFFFFF" : "#FAF7F2",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "#F7F2EA"
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = idx % 2 === 0 ? "#FFFFFF" : "#FAF7F2"
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: cellPadding, textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(supplier.id)}
                          style={{ cursor: "pointer" }}
                        />
                      </td>

                      {/* Supplier Name */}
                      <td style={{ padding: cellPadding }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span
                              onClick={() => onInspectSupplier && onInspectSupplier(supplier)}
                              style={{
                                fontWeight: 600,
                                color: "#4A352F",
                                fontSize: "0.875rem",
                                cursor: "pointer",
                                textDecoration: "underline",
                              }}
                            >
                              {supplier.name}
                            </span>
                            {supplier.verified && (
                              <ShieldCheck size={14} color="#2E7D32" title="Platform Verified Entity" />
                            )}
                          </div>
                          {supplier.registeredName && supplier.registeredName !== supplier.name && (
                            <span style={{ fontSize: "0.725rem", color: "#8D6E63" }}>
                              {supplier.registeredName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Offering Category */}
                      {columnVisibility.offeringCategory !== false && (
                        <td style={{ padding: cellPadding }}>
                          <span
                            style={{
                              background: "#F5F0E1",
                              color: "#5D4037",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {supplier.offeringCategory}
                          </span>
                        </td>
                      )}

                      {/* Location */}
                      {columnVisibility.location !== false && (
                        <td style={{ padding: cellPadding, fontSize: "0.8rem", color: "#5D4037" }}>
                          {supplier.location}
                        </td>
                      )}

                      {/* B-BBEE Level */}
                      {columnVisibility.bbbeeLevel !== false && (
                        <td style={{ padding: cellPadding, fontSize: "0.8rem", fontWeight: 500, color: "#4A352F" }}>
                          {supplier.bbbeeLevel}
                        </td>
                      )}

                      {/* BIG Score */}
                      {columnVisibility.bigScore !== false && (
                        <td style={{ padding: cellPadding, textAlign: "center" }}>
                          <BigScoreGauge score={supplier.bigScore} />
                        </td>
                      )}

                      {/* Verification Coverage */}
                      {columnVisibility.verifiedCoverage !== false && (
                        <td style={{ padding: cellPadding, textAlign: "center" }}>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              color: supplier.verifiedCoverage >= 80 ? "#2E7D32" : "#F57C00",
                            }}
                          >
                            {supplier.verifiedCoverage}%
                          </span>
                          <div style={{ fontSize: "0.675rem", color: "#8D6E63" }}>
                            {supplier.documentCount} docs
                          </div>
                        </td>
                      )}

                      {/* Passport Status */}
                      {columnVisibility.passportStatus !== false && (
                        <td style={{ padding: cellPadding }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "4px",
                              fontSize: "0.725rem",
                              fontWeight: 600,
                              background:
                                supplier.passportVariant === "success"
                                  ? "#E8F5E9"
                                  : supplier.passportVariant === "warning"
                                  ? "#FFF3E0"
                                  : "#FFEBEE",
                              color:
                                supplier.passportVariant === "success"
                                  ? "#2E7D32"
                                  : supplier.passportVariant === "warning"
                                  ? "#E65100"
                                  : "#C62828",
                            }}
                          >
                            {supplier.passportLabel}
                          </span>
                        </td>
                      )}

                      {/* Requirement Fit (MATCH %) */}
                      {columnVisibility.requirementFit !== false && (
                        <td style={{ padding: cellPadding, textAlign: "center" }}>
                          <RequirementFitCell
                            fit={supplier.requirementFit}
                            onClick={() => onOpenMatchReason && onOpenMatchReason(supplier)}
                          />
                        </td>
                      )}

                      {/* Critical Gaps */}
                      {columnVisibility.criticalGaps !== false && (
                        <td style={{ padding: cellPadding }}>
                          {supplier.criticalGaps && supplier.criticalGaps.length > 0 ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                background: "#FFEBEE",
                                color: "#C62828",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: "0.725rem",
                                fontWeight: 500,
                              }}
                              title={supplier.criticalGaps.join("; ")}
                            >
                              <AlertTriangle size={12} /> {supplier.criticalGaps.length} gap{supplier.criticalGaps.length > 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span style={{ fontSize: "0.75rem", color: "#2E7D32", fontWeight: 500 }}>
                              ✓ Clear
                            </span>
                          )}
                        </td>
                      )}

                      {/* Capacity (Optional) */}
                      {columnVisibility.capacity !== false && (
                        <td style={{ padding: cellPadding, fontSize: "0.75rem", color: "#5D4037" }}>
                          {supplier.capacity}
                        </td>
                      )}

                      {/* Ownership (Optional) */}
                      {columnVisibility.ownershipProfile !== false && (
                        <td style={{ padding: cellPadding, fontSize: "0.75rem", color: "#5D4037" }}>
                          {supplier.ownershipProfile}
                        </td>
                      )}

                      {/* Last Updated (Optional) */}
                      {columnVisibility.lastUpdated !== false && (
                        <td style={{ padding: cellPadding, fontSize: "0.75rem", color: "#8D6E63" }}>
                          {supplier.lastUpdated ? new Date(supplier.lastUpdated).toLocaleDateString() : "-"}
                        </td>
                      )}

                      {/* Row Actions */}
                      <td style={{ padding: cellPadding, textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                          <button
                            onClick={() => onInspectSupplier && onInspectSupplier(supplier)}
                            style={{
                              padding: "5px 10px",
                              background: "#4A352F",
                              border: "none",
                              borderRadius: "4px",
                              color: "#FAF7F2",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                            title="View Full Supplier Profile"
                          >
                            Inspect
                          </button>

                          <button
                            onClick={() => onOpenRFI && onOpenRFI(supplier)}
                            style={{
                              padding: "5px 8px",
                              background: "transparent",
                              border: "1px solid #C8B6A6",
                              borderRadius: "4px",
                              color: "#4A352F",
                              fontSize: "0.75rem",
                              cursor: "pointer",
                            }}
                            title="Request Information"
                          >
                            RFI
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
