"use client"

import React, { useState, useMemo, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
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
  GripVertical,
  Info,
  MoreVertical,
  Building,
  Layers,
  FileText,
  Send,
  TrendingUp,
  Award,
  X,
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
 * Portal wrapper for floating header tooltips and popups
 */
const PopupPortal = ({ children }) => {
  if (typeof document === "undefined") return null
  return createPortal(children, document.body)
}

/**
 * Header tooltip component matching AdvisorCohorts
 */
const HeaderInfoTooltip = ({ text }) => {
  const [rect, setRect] = useState(null)
  if (!text) return null

  return (
    <span
      onMouseEnter={(e) => setRect(e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => setRect(null)}
      style={{ display: "inline-flex", cursor: "help", marginLeft: "2px" }}
    >
      <Info size={12} style={{ color: "#D9C7B8", opacity: 0.8 }} />
      {rect && (
        <PopupPortal>
          <div
            style={{
              position: "fixed",
              zIndex: 1200,
              background: "#4A352F",
              color: "#FAF7F2",
              fontSize: "0.75rem",
              borderRadius: "8px",
              padding: "8px 12px",
              boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
              pointerEvents: "none",
              textTransform: "none",
              fontWeight: 400,
              letterSpacing: "normal",
              top: rect.bottom + 8,
              left: Math.min(Math.max(rect.left - 90, 12), window.innerWidth - 232),
              width: "220px",
              lineHeight: 1.3,
            }}
          >
            {text}
          </div>
        </PopupPortal>
      )}
    </span>
  )
}

/**
 * Sort Trigger component matching AdvisorCohorts
 */
const SortTrigger = ({ colKey, sortField, sortAsc, onSort }) => {
  const isActive = sortField === colKey
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onSort(colKey)
      }}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 18,
        height: 18,
        color: isActive ? "#E6D7C3" : "#C8B6A6",
        opacity: isActive ? 1 : 0.65,
      }}
      title={isActive ? (sortAsc ? "Sort descending" : "Clear sort") : "Sort ascending"}
    >
      {isActive ? (
        sortAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />
      ) : (
        <ArrowUpDown size={11} />
      )}
    </button>
  )
}

/**
 * Visual circular gauge for BIG Score matching the brief:
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
          <circle
            cx="20"
            cy="20"
            r={radius}
            fill="none"
            stroke="#E8DFD8"
            strokeWidth="3.5"
          />
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
  onOpenBigScore,
  onOpenPassportReview,
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
  const [columnOrder, setColumnOrder] = useState(DEFAULT_PROCUREMENT_COLUMN_ORDER)
  const [columnWidths, setColumnWidths] = useState({})
  const [resizingColumn, setResizingColumn] = useState(null)
  const [draggedColumn, setDraggedColumn] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)
  const [showColumnPicker, setShowColumnPicker] = useState(false)
  const [density, setDensity] = useState("comfortable")
  const [rowMenu, setRowMenu] = useState(null) // { supplier, position: { x, y } }

  const openRowMenu = (supplier, event) => {
    event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect()
    const menuWidth = 230
    const menuHeight = 350
    let x = rect.right - menuWidth
    let y = rect.bottom + 6
    if (x < 12) x = 12
    if (y + menuHeight > window.innerHeight - 12) {
      y = Math.max(12, rect.top - menuHeight - 6)
    }
    setRowMenu({ supplier, position: { x, y } })
  }

  // Load saved column visibility, order, and widths
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEWS_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.columnVisibility) {
          setColumnVisibility({ ...DEFAULT_PROCUREMENT_VISIBILITY, ...parsed.columnVisibility })
        }
        if (Array.isArray(parsed.columnOrder) && parsed.columnOrder.length > 0) {
          const valid = parsed.columnOrder.filter((k) => DEFAULT_PROCUREMENT_COLUMN_ORDER.includes(k))
          const missing = DEFAULT_PROCUREMENT_COLUMN_ORDER.filter((k) => !valid.includes(k))
          setColumnOrder([...valid, ...missing])
        }
        if (parsed.columnWidths && typeof parsed.columnWidths === "object") {
          setColumnWidths(parsed.columnWidths)
        }
      }
    } catch {}
  }, [])

  // Persist layout helper
  const persistLayout = (nextVisibility, nextOrder, nextWidths) => {
    try {
      const payload = {
        columnVisibility: nextVisibility !== undefined ? nextVisibility : columnVisibility,
        columnOrder: nextOrder !== undefined ? nextOrder : columnOrder,
        columnWidths: nextWidths !== undefined ? nextWidths : columnWidths,
      }
      localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(payload))
    } catch {}
  }

  // Update column visibility
  const updateVisibility = (key, value) => {
    setColumnVisibility((prev) => {
      const next = { ...prev, [key]: value }
      persistLayout(next, undefined, undefined)
      return next
    })
  }

  // Column width calculator matching AdvisorCohorts
  const widthStyle = (key, fallbackWidth) => {
    const w = columnWidths[key]
    if (w) return { width: `${w}px`, minWidth: `${w}px`, maxWidth: `${w}px` }
    if (fallbackWidth) {
      const fw = typeof fallbackWidth === "number" ? `${fallbackWidth}px` : fallbackWidth
      return { width: fw, minWidth: fw }
    }
    return { minWidth: "120px" }
  }

  // Column resizing handlers matching AdvisorCohorts
  const startResize = (event, key) => {
    event.preventDefault()
    event.stopPropagation()
    const th = event.currentTarget.closest("th")
    const startX = event.clientX
    const startWidth = th ? th.getBoundingClientRect().width : 120
    setResizingColumn(key)

    const onMove = (moveEvent) => {
      const next = Math.max(64, Math.round(startWidth + (moveEvent.clientX - startX)))
      setColumnWidths((prev) => {
        const updated = { ...prev, [key]: next }
        persistLayout(undefined, undefined, updated)
        return updated
      })
    }

    const onUp = () => {
      setResizingColumn(null)
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }

  const autoFitColumn = (key) => {
    setColumnWidths((prev) => {
      const { [key]: _dropped, ...rest } = prev
      persistLayout(undefined, undefined, rest)
      return rest
    })
  }

  const ColumnResizer = ({ colKey }) => (
    <span
      onMouseDown={(e) => startResize(e, colKey)}
      onDoubleClick={(e) => {
        e.stopPropagation()
        autoFitColumn(colKey)
      }}
      onDragStart={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onClick={(e) => e.stopPropagation()}
      title="Drag to resize · double-click to auto-fit"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        height: "100%",
        width: "6px",
        cursor: "col-resize",
        userSelect: "none",
        zIndex: 10,
        backgroundColor: resizingColumn === colKey ? "#A67C52" : "transparent",
      }}
    />
  )

  // Drag and Drop handlers for column reordering
  const handleDragStart = (e, key) => {
    if (resizingColumn) {
      e.preventDefault()
      return
    }
    setDraggedColumn(key)
    try {
      e.dataTransfer.setData("text/plain", key)
      e.dataTransfer.effectAllowed = "move"
    } catch {}
  }

  const handleDragOver = (e, key) => {
    e.preventDefault()
    try {
      e.dataTransfer.dropEffect = "move"
    } catch {}
    if (key !== dragOverColumn) {
      setDragOverColumn(key)
    }
  }

  const handleDrop = (e, targetKey) => {
    e.preventDefault()
    if (!draggedColumn || draggedColumn === targetKey) {
      setDraggedColumn(null)
      setDragOverColumn(null)
      return
    }
    setColumnOrder((prev) => {
      const next = [...prev]
      const from = next.indexOf(draggedColumn)
      const to = next.indexOf(targetKey)
      if (from === -1 || to === -1) return prev
      next.splice(from, 1)
      next.splice(to, 0, draggedColumn)
      persistLayout(undefined, next, undefined)
      return next
    })
    setDraggedColumn(null)
    setDragOverColumn(null)
  }

  const handleDragEnd = () => {
    setDraggedColumn(null)
    setDragOverColumn(null)
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
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = (s.name || "").toLowerCase().includes(q)
        const matchCat = (s.offeringCategory || "").toLowerCase().includes(q)
        const matchLoc = (s.location || "").toLowerCase().includes(q)
        if (!matchName && !matchCat && !matchLoc) return false
      }

      if (selectedCategory !== "all" && s.offeringCategory !== selectedCategory) {
        return false
      }

      if (selectedBBBEE !== "all") {
        const cleanB = (s.bbbeeLevel || "").toLowerCase()
        if (selectedBBBEE === "Level 1" && !cleanB.includes("level 1")) return false
        if (selectedBBBEE === "Level 1-2" && !cleanB.includes("level 1") && !cleanB.includes("level 2")) return false
        if (selectedBBBEE === "Level 1-4" && (cleanB.includes("level 5") || cleanB.includes("level 6") || cleanB.includes("level 7") || cleanB.includes("level 8") || cleanB.includes("non-compliant"))) return false
      }

      if (selectedPassport !== "all" && s.passportStatus !== selectedPassport) {
        return false
      }

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

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id)
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id]
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
    setColumnVisibility(DEFAULT_PROCUREMENT_VISIBILITY)
    setColumnOrder(DEFAULT_PROCUREMENT_COLUMN_ORDER)
    setColumnWidths({})
    try {
      localStorage.removeItem(VIEWS_STORAGE_KEY)
    } catch {}
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

  // Render individual column cell dynamically matching columnOrder & widthStyle
  const renderColumnCell = (colKey, supplier) => {
    const colDef = PROCUREMENT_COLUMN_DEFS[colKey]
    const baseStyle = {
      padding: cellPadding,
      ...widthStyle(colKey, colDef?.width),
    }

    switch (colKey) {
      case "offeringCategory":
        return (
          <td key={colKey} style={baseStyle}>
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
        )

      case "location":
        return (
          <td key={colKey} style={{ ...baseStyle, fontSize: "0.8rem", color: "#5D4037" }}>
            {supplier.location}
          </td>
        )

      case "bbbeeLevel":
        return (
          <td key={colKey} style={{ ...baseStyle, fontSize: "0.8rem", fontWeight: 500, color: "#4A352F" }}>
            {supplier.bbbeeLevel}
          </td>
        )

      case "bigScore":
        return (
          <td key={colKey} style={{ ...baseStyle, textAlign: "center" }}>
            <div
              onClick={() => onOpenBigScore && onOpenBigScore(supplier)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onOpenBigScore && onOpenBigScore(supplier)
                }
              }}
              title="Click to view BIG Score 5-pillar breakdown"
              style={{
                cursor: "pointer",
                display: "inline-block",
                padding: "4px 8px",
                borderRadius: "6px",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#F2EAE1"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent"
              }}
            >
              <BigScoreGauge score={supplier.bigScore} />
            </div>
          </td>
        )

      case "requirementFit":
        return (
          <td key={colKey} style={{ ...baseStyle, textAlign: "center" }}>
            <RequirementFitCell
              fit={supplier.requirementFit}
              onClick={() => onOpenMatchReason && onOpenMatchReason(supplier)}
            />
          </td>
        )

      case "passportStatus":
        return (
          <td key={colKey} style={{ ...baseStyle, textAlign: "center" }}>
            <div
              onClick={() => onOpenPassportReview && onOpenPassportReview(supplier)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onOpenPassportReview && onOpenPassportReview(supplier)
                }
              }}
              title="Click to inspect Passport statutory compliance and gap breakdown"
              style={{
                cursor: "pointer",
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                padding: "4px 8px",
                borderRadius: "6px",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#F2EAE1"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent"
              }}
            >
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
                {supplier.passportLabel || supplier.passportStatus || "Pending"}
              </span>
              <span style={{ fontSize: "0.7rem", color: "#8D6E63" }}>
                {supplier.verifiedCoverage ?? 80}% verified • {supplier.criticalGaps?.length || 0} gap{supplier.criticalGaps?.length === 1 ? "" : "s"}
              </span>
            </div>
          </td>
        )

      case "capacity":
        return (
          <td key={colKey} style={{ ...baseStyle, fontSize: "0.75rem", color: "#5D4037" }}>
            {supplier.capacity || "-"}
          </td>
        )

      case "ownershipProfile":
        return (
          <td key={colKey} style={{ ...baseStyle, fontSize: "0.75rem", color: "#5D4037" }}>
            {supplier.ownershipProfile || "-"}
          </td>
        )

      case "lastUpdated":
        return (
          <td key={colKey} style={{ ...baseStyle, fontSize: "0.75rem", color: "#8D6E63" }}>
            {supplier.lastUpdated ? new Date(supplier.lastUpdated).toLocaleDateString() : "-"}
          </td>
        )

      default:
        return null
    }
  }

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
                  {columnOrder.map((colKey) => {
                    const def = PROCUREMENT_COLUMN_DEFS[colKey]
                    if (!def) return null
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
          {/* Header styling and layout rules copied from AdvisorCohorts */}
          <style>{`
            .mc-th { color: #faf7f2 !important; vertical-align: top !important; }
            .mc-th-draggable { cursor: grab; }
            .mc-th-draggable:active { cursor: grabbing; }
            .mc-th-row { display: flex; align-items: flex-start; gap: 4px; min-width: 0; }
            .mc-th-label { flex: 1 1 auto; min-width: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; white-space: normal; overflow-wrap: normal; word-break: normal; line-height: 1.2; }
            .mc-th-tools { display: flex; align-items: center; flex-shrink: 0; gap: 2px; }
            .mc-fit th, .mc-fit td { overflow: hidden; }
            .mc-fit td { word-break: break-word; }
          `}</style>

          <table className="mc-fit" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", tableLayout: "auto" }}>
            {/* Table Header */}
            <thead>
              <tr style={{ background: "#4A352F", color: "#FAF7F2", fontSize: "0.8rem", borderBottom: "2px solid #3E2B26" }}>
                {/* Selection Checkbox */}
                <th
                  className="mc-th"
                  style={{
                    padding: "12px 14px",
                    width: "44px",
                    minWidth: "44px",
                    maxWidth: "44px",
                    textAlign: "center",
                    position: "sticky",
                    top: 0,
                    zIndex: 20,
                    backgroundColor: "#4A352F",
                    borderRight: "1px solid rgba(230, 215, 195, 0.2)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === Math.min(3, sortedSuppliers.length)}
                    onChange={handleSelectAll}
                    style={{ cursor: "pointer" }}
                  />
                </th>

                {/* Pinned Supplier Column with ColumnResizer and Tooltip */}
                <th
                  className="mc-th"
                  style={{
                    padding: "12px 14px",
                    ...widthStyle(SUPPLIER_KEY, FIXED_WIDTHS[SUPPLIER_KEY]),
                    position: "relative",
                    sticky: "top",
                    zIndex: 20,
                    backgroundColor: "#4A352F",
                    borderRight: "1px solid rgba(230, 215, 195, 0.2)",
                  }}
                >
                  <div className="mc-th-row">
                    <span className="mc-th-label" title="Supplier Organization">
                      Supplier Organization
                    </span>
                    <span className="mc-th-tools">
                      <SortTrigger
                        colKey="name"
                        sortField={sortField}
                        sortAsc={sortAsc}
                        onSort={handleSort}
                      />
                      <HeaderInfoTooltip text="Supplier legal identity, trading name, and platform verification badge." />
                    </span>
                  </div>
                  <ColumnResizer colKey={SUPPLIER_KEY} />
                </th>

                {/* Interactive Drag-and-Drop & Resizable Configured Columns */}
                {columnOrder.map((colKey) => {
                  if (columnVisibility[colKey] === false) return null
                  const def = PROCUREMENT_COLUMN_DEFS[colKey]
                  if (!def) return null

                  const isDragging = draggedColumn === colKey
                  const isDragOver = dragOverColumn === colKey && draggedColumn !== colKey

                  return (
                    <th
                      key={colKey}
                      draggable={!resizingColumn}
                      onDragStart={(e) => handleDragStart(e, colKey)}
                      onDragOver={(e) => handleDragOver(e, colKey)}
                      onDrop={(e) => handleDrop(e, colKey)}
                      onDragEnd={handleDragEnd}
                      className={`mc-th mc-th-draggable select-none transition-opacity ${isDragging ? "opacity-40" : ""}`}
                      style={{
                        ...widthStyle(colKey, def.width),
                        backgroundColor: isDragOver ? "#5A423B" : "#4A352F",
                        padding: "12px 14px",
                        position: "relative",
                        textAlign: def.align || "left",
                        borderRight: "1px solid rgba(230, 215, 195, 0.2)",
                      }}
                      title="Drag to reorder · drag edge to resize"
                    >
                      <div
                        className="mc-th-row"
                        style={{
                          justifyContent: def.align === "center" ? "center" : "flex-start",
                        }}
                      >
                        <GripVertical
                          size={11}
                          color="#C8B6A6"
                          style={{ opacity: 0.5, flexShrink: 0, marginTop: "2px", cursor: "grab" }}
                        />
                        <span className="mc-th-label" title={def.label}>
                          {def.label}
                        </span>
                        <span className="mc-th-tools">
                          {def.sortable && (
                            <SortTrigger
                              colKey={colKey}
                              sortField={sortField}
                              sortAsc={sortAsc}
                              onSort={handleSort}
                            />
                          )}
                          <HeaderInfoTooltip text={def.tooltip} />
                        </span>
                      </div>
                      <ColumnResizer colKey={colKey} />
                    </th>
                  )
                })}

                {/* Actions Column with ColumnResizer and Tooltip */}
                <th
                  className="mc-th text-center"
                  style={{
                    padding: "12px 14px",
                    ...widthStyle(ACTION_KEY, FIXED_WIDTHS[ACTION_KEY]),
                    position: "relative",
                    backgroundColor: "#4A352F",
                  }}
                >
                  <div className="mc-th-row" style={{ justifyContent: "center" }}>
                    <span className="mc-th-label">Actions</span>
                    <HeaderInfoTooltip text="Inspect full profile or dispatch clarification requests." />
                  </div>
                  <ColumnResizer colKey={ACTION_KEY} />
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #F0E6D8" }}>
                    <td colSpan={12} style={{ padding: "16px", textAlign: "center", color: "#8D6E63" }}>
                      <div style={{ height: "24px", background: "#F5F0E1", borderRadius: "4px", animation: "pulse 1.2s infinite ease-in-out" }} />
                    </td>
                  </tr>
                ))
              ) : sortedSuppliers.length === 0 ? (
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
                      <td style={{ padding: cellPadding, textAlign: "center", width: "44px", minWidth: "44px", maxWidth: "44px" }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(supplier.id)}
                          style={{ cursor: "pointer" }}
                        />
                      </td>

                      {/* Supplier Name */}
                      <td style={{ padding: cellPadding, ...widthStyle(SUPPLIER_KEY, FIXED_WIDTHS[SUPPLIER_KEY]) }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span
                              onClick={() => onInspectSupplier && onInspectSupplier(supplier)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  onInspectSupplier && onInspectSupplier(supplier)
                                }
                              }}
                              style={{
                                fontWeight: 600,
                                color: "#4A352F",
                                fontSize: "0.875rem",
                                cursor: "pointer",
                                textDecoration: "underline",
                              }}
                              title="Click to view full supplier profile summary"
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

                      {/* Configured Columns Dynamically Rendered by columnOrder */}
                      {columnOrder.map((colKey) => {
                        if (columnVisibility[colKey] === false) return null
                        return renderColumnCell(colKey, supplier)
                      })}

                      {/* Row Actions */}
                      <td style={{ padding: cellPadding, textAlign: "center", ...widthStyle(ACTION_KEY, FIXED_WIDTHS[ACTION_KEY]) }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
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
                              whiteSpace: "nowrap",
                            }}
                            title="View Full Supplier Profile Dossier"
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
                              fontWeight: 600,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                            title="Request Information (RFI)"
                          >
                            RFI
                          </button>

                          <button
                            onClick={(e) => openRowMenu(supplier, e)}
                            style={{
                              padding: "5px 6px",
                              background: "transparent",
                              border: "1px solid #C8B6A6",
                              borderRadius: "4px",
                              color: "#7D5A50",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            title="More Actions"
                          >
                            <MoreVertical size={14} />
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

      {/* Catalyst-Style Quick Actions Floating Menu */}
      {rowMenu && (
        <PopupPortal>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 1100 }}
            onClick={() => setRowMenu(null)}
          />
          <div
            style={{
              position: "fixed",
              zIndex: 1110,
              backgroundColor: "#FFFFFF",
              borderRadius: "10px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
              border: "1px solid #E6D7C3",
              padding: "4px 0",
              width: "230px",
              top: rowMenu.position.y,
              left: rowMenu.position.x,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 14px",
                borderBottom: "1px solid #E6D7C3",
                background: "#FAF7F2",
              }}
            >
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#4A352F" }}>
                Quick Actions
              </span>
              <button
                onClick={() => setRowMenu(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#8D6E63",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: 0,
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* View Profile / Inspect */}
            <button
              onClick={() => {
                const s = rowMenu.supplier
                setRowMenu(null)
                onInspectSupplier && onInspectSupplier(s, "score")
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                background: "none",
                border: "none",
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "#4A352F",
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#FAF7F2" }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
            >
              <Eye size={13} color="#4A352F" /> View Profile & Summary
            </button>

            {/* View BIG Score */}
            <button
              onClick={() => {
                const s = rowMenu.supplier
                setRowMenu(null)
                onOpenBigScore && onOpenBigScore(s)
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                background: "none",
                border: "none",
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "#4A352F",
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#FAF7F2" }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
            >
              <Award size={13} color="#27AE60" /> View BIG Score
            </button>

            {/* View Match Score */}
            <button
              onClick={() => {
                const s = rowMenu.supplier
                setRowMenu(null)
                onOpenMatchReason && onOpenMatchReason(s)
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                background: "none",
                border: "none",
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "#4A352F",
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#FAF7F2" }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
            >
              <Sparkles size={13} color="#D4AF37" /> View Match Score
            </button>

            {/* Deep Dive */}
            <button
              onClick={() => {
                const s = rowMenu.supplier
                setRowMenu(null)
                onInspectSupplier && onInspectSupplier(s, "overview")
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                background: "none",
                border: "none",
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "#4A352F",
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#FAF7F2" }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
            >
              <TrendingUp size={13} color="#1565C0" /> Deep Dive (Dossier 360)
            </button>

            {/* Component Views Section */}
            <div style={{ height: "1px", background: "#E6D7C3", margin: "4px 0" }} />
            <div style={{ padding: "4px 14px 2px", fontSize: "0.65rem", fontWeight: 700, color: "#8D6E63", textTransform: "uppercase" }}>
              Component Views
            </div>

            <button
              onClick={() => {
                const s = rowMenu.supplier
                setRowMenu(null)
                onInspectSupplier && onInspectSupplier(s, "overview")
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "7px 14px",
                background: "none",
                border: "none",
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "#4A352F",
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#FAF7F2" }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
            >
              <Building size={13} color="#7D5A50" /> Entity Overview
            </button>

            <button
              onClick={() => {
                const s = rowMenu.supplier
                setRowMenu(null)
                onInspectSupplier && onInspectSupplier(s, "capabilities")
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "7px 14px",
                background: "none",
                border: "none",
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "#4A352F",
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#FAF7F2" }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
            >
              <Layers size={13} color="#7D5A50" /> Capabilities & Fleet
            </button>

            <button
              onClick={() => {
                const s = rowMenu.supplier
                setRowMenu(null)
                onInspectSupplier && onInspectSupplier(s, "documents")
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "7px 14px",
                background: "none",
                border: "none",
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "#4A352F",
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#FAF7F2" }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
            >
              <FileText size={13} color="#7D5A50" /> Evidence & Documents
            </button>

            {/* Actions & RFI */}
            <div style={{ height: "1px", background: "#E6D7C3", margin: "4px 0" }} />

            <button
              onClick={() => {
                const s = rowMenu.supplier
                setRowMenu(null)
                onOpenRFI && onOpenRFI(s)
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                background: "none",
                border: "none",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#4A352F",
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#FAF7F2" }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
            >
              <Send size={13} color="#4A352F" /> Request for Information (RFI)
            </button>

            <button
              onClick={() => {
                const s = rowMenu.supplier
                setRowMenu(null)
                onShortlist && onShortlist(s)
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                background: "none",
                border: "none",
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "#A67C52",
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#FAF7F2" }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
            >
              <Bookmark size={13} color="#A67C52" /> Toggle Shortlist
            </button>
          </div>
        </PopupPortal>
      )}
    </div>
  )
}
