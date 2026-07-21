import React, { useState, useMemo } from "react"
import { 
  Eye, Search, Columns, ArrowUp, ArrowDown, ChevronDown, ChevronUp,
  MessageSquare, MoreVertical, CheckCircle, Calendar, Clock, Filter, FileSpreadsheet
} from "lucide-react"
import CMFSMEDetailsModal from "./CMFSMEDetailsModal"

const BIG_SCORE_LABELS = {
  excellent: { min: 80, label: "Excellent", color: "#22c55e", bgRing: "#d1fae5" },
  strong: { min: 60, label: "Strong", color: "#86efac", bgRing: "#d1fae5" },
  moderate: { min: 40, label: "Moderate", color: "#f59e0b", bgRing: "#fef3c7" },
  weak: { min: 20, label: "Weak", color: "#ef4444", bgRing: "#fee2e2" },
  critical: { min: 0, label: "Critical", color: "#dc2626", bgRing: "#fee2e2" }
}

const MATCH_LABELS = {
  excellent: { min: 80, label: "Excellent Fit", stars: 5, color: "#2e7d32", barColor: "#4caf50" },
  strong: { min: 60, label: "Strong Fit", stars: 4, color: "#2e7d32", barColor: "#8bc34a" },
  moderate: { min: 40, label: "Moderate Fit", stars: 3, color: "#e65100", barColor: "#ff9800" },
  weak: { min: 20, label: "Weak Fit", stars: 2, color: "#c62828", barColor: "#f44336" },
  poor: { min: 0, label: "Poor Fit", stars: 1, color: "#c62828", barColor: "#f44336" }
}

const getBigScoreLabel = (score) => {
  for (const [key, value] of Object.entries(BIG_SCORE_LABELS)) {
    if (score >= value.min) return value
  }
  return BIG_SCORE_LABELS.critical
}

const getMatchLabel = (score) => {
  for (const [key, value] of Object.entries(MATCH_LABELS)) {
    if (score >= value.min) return value
  }
  return MATCH_LABELS.poor
}

const STATUS_STYLES = {
  "matching": { bg: "#f5f0e1", text: "#7d5a50", border: "#c8b6a6", dot: "#7d5a50" },
  "matched": { bg: "#f5f0e1", text: "#7d5a50", border: "#c8b6a6", dot: "#7d5a50" },
  "application": { bg: "#f0e6d9", text: "#4a352f", border: "#c8b6a6", dot: "#4a352f" },
  "applied": { bg: "#f0e6d9", text: "#4a352f", border: "#c8b6a6", dot: "#4a352f" },
  "evaluation": { bg: "#faf7f2", text: "#7d5a50", border: "#c8b6a6", dot: "#7d5a50" },
  "due diligence": { bg: "#f5f0e1", text: "#4a352f", border: "#c8b6a6", dot: "#4a352f" },
  "decision": { bg: "#f0e6d9", text: "#7d5a50", border: "#c8b6a6", dot: "#7d5a50" },
  "offer": { bg: "#faf7f2", text: "#4a352f", border: "#c8b6a6", dot: "#4a352f" },
  "admitted": { bg: "#e8f5e9", text: "#2e7d32", border: "#a5d6a7", dot: "#2e7d32" },
  "active": { bg: "#e6d7c3", text: "#4a352f", border: "#a67c52", dot: "#4a352f" },
  "exited": { bg: "#e6d7c3", text: "#7d5a50", border: "#c8b6a6", dot: "#7d5a50" },
  "declined": { bg: "#fee2e2", text: "#b91c1c", border: "#fca5a5", dot: "#b91c1c" },
  "withdrawn": { bg: "#f3f4f6", text: "#4b5563", border: "#d1d5db", dot: "#4b5563" }
}

const getStatusStyle = (status) => {
  if (!status) return STATUS_STYLES["matching"]
  const statusLower = status.toLowerCase()
  for (const [key, value] of Object.entries(STATUS_STYLES)) {
    if (statusLower.includes(key)) return value
  }
  return { bg: "#f5f0e1", text: "#7d5a50", border: "#c8b6a6", dot: "#7d5a50" }
}

const PIPELINE_STAGES = {
  "matched": "Applied",
  "applied": "Evaluation",
  "evaluation": "Due Diligence",
  "due diligence": "Decision",
  "decision": "Offer",
  "offer": "Admitted"
}

const getNextStage = (currentStage) => {
  if (!currentStage) return "Applied"
  const stageLower = currentStage.toLowerCase()
  for (const [key, next] of Object.entries(PIPELINE_STAGES)) {
    if (stageLower.includes(key)) return next
  }
  return null
}

const getActionLabel = (stage) => {
  const stageLower = (stage || "").toLowerCase()
  if (stageLower.includes("matched") || stageLower.includes("matching")) return "Review"
  if (stageLower.includes("evaluation") || stageLower.includes("review")) return "Evaluate"
  if (stageLower.includes("decision")) return "Decide"
  if (stageLower.includes("offer")) return "Send Offer"
  if (stageLower.includes("admitted") || stageLower.includes("active")) return "Manage"
  return "Review"
}

export default function CMFSMETable({ 
  filters, 
  stageFilter, 
  smeMatches = [], 
  loading = false, 
  onUpdateStage, 
  onStageOverride 
}) {
  const [selectedSME, setSelectedSME] = useState(null)
  const [showColumnChooser, setShowColumnChooser] = useState(false)
  const [showDensityChooser, setShowDensityChooser] = useState(false)
  const [showViewsChooser, setShowViewsChooser] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: "bigScore", direction: "desc" })
  const [actionMenuOpenId, setActionMenuOpenId] = useState(null)
  const [density, setDensity] = useState("comfortable") // compact or comfortable
  const [selectedView, setSelectedView] = useState("BIG Default")

  const [columnVisibility, setColumnVisibility] = useState({
    name: true,
    bigScore: true,
    matchPercentage: true,
    fundingStage: true,
    fundingRequired: true,
    status: true,
    applied: true,
    daysInStage: true,
    lastActivity: true,
    actions: true,
  })

  // Sort & Filter logic
  const processedMatches = useMemo(() => {
    let list = [...smeMatches]

    // Stage filter
    if (stageFilter) {
      list = list.filter(item => {
        const stage = (item.pipelineStage || item.currentStatus || "").toLowerCase()
        return stage.includes(stageFilter.toLowerCase())
      })
    }

    // Keyword Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(item => 
        (item.name || "").toLowerCase().includes(q) ||
        (item.sector || "").toLowerCase().includes(q) ||
        (item.location || "").toLowerCase().includes(q)
      )
    }

    // Views selector logic
    if (selectedView === "High Score Fit") {
      list = list.filter(item => (item.matchPercentage || 0) >= 80)
    } else if (selectedView === "Action Required") {
      list = list.filter(item => ["matched", "evaluation", "decision", "offer"].includes((item.pipelineStage || "").toLowerCase()))
    }

    // Filters Panel logic
    if (filters.location) {
      list = list.filter(item => (item.location || "").toLowerCase() === filters.location.toLowerCase())
    }
    if (filters.matchScore) {
      list = list.filter(item => (item.matchPercentage || 0) >= filters.matchScore)
    }
    if (filters.minValue) {
      const min = parseFloat(filters.minValue.replace(/[^0-9.]/g, ""))
      if (!isNaN(min)) {
        list = list.filter(item => (item.fundingAmount || 0) >= min)
      }
    }
    if (filters.maxValue) {
      const max = parseFloat(filters.maxValue.replace(/[^0-9.]/g, ""))
      if (!isNaN(max)) {
        list = list.filter(item => (item.fundingAmount || 0) <= max)
      }
    }
    if (filters.sectors && filters.sectors.length > 0) {
      list = list.filter(item => filters.sectors.includes(item.sector))
    }
    if (filters.stages && filters.stages.length > 0) {
      list = list.filter(item => filters.stages.includes(item.fundingStage))
    }

    // Sort
    if (sortConfig.key) {
      list.sort((a, b) => {
        let valA = a[sortConfig.key]
        let valB = b[sortConfig.key]
        if (typeof valA === "string") valA = valA.toLowerCase()
        if (typeof valB === "string") valB = valB.toLowerCase()
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1
        return 0
      })
    }

    return list
  }, [smeMatches, stageFilter, searchQuery, filters, sortConfig, selectedView])

  const requestSort = (key) => {
    let direction = "desc"
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc"
    }
    setSortConfig({ key, direction })
  }

  const toggleColumnVisibility = (col) => {
    setColumnVisibility(prev => ({ ...prev, [col]: !prev[col] }))
  }

  const handleExport = () => {
    alert("Exporting matches list to CSV...")
  }

  if (loading) {
    return <div className="p-8 text-center text-[#7d5a50]">Loading matches list...</div>
  }

  return (
    <div className="p-6 font-sans">
      {/* Controls row */}
      <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
        <div className="relative flex-1 min-w-[280px] max-w-[400px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, sector, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#E8D5C4] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8D6E63]"
          />
        </div>

        {/* Buttons row */}
        <div className="flex gap-2 items-center relative flex-wrap">
          
          {/* Columns Visibility */}
          <div className="relative">
            <button
              onClick={() => {
                setShowColumnChooser(!showColumnChooser)
                setShowDensityChooser(false)
                setShowViewsChooser(false)
              }}
              className="flex items-center gap-1.5 px-3 py-2 border border-[#E8D5C4] rounded-lg text-xs text-[#5D4037] bg-white hover:bg-gray-50 font-semibold"
            >
              <Columns size={14} />
              Columns
              <ChevronDown size={12} />
            </button>
            {showColumnChooser && (
              <div className="absolute right-0 top-10 z-50 bg-white border border-[#E8D5C4] rounded-lg shadow-xl p-3 w-[200px]">
                <h4 className="text-xs font-bold text-[#5D4037] mb-2 uppercase tracking-wide">Toggle Columns</h4>
                {Object.keys(columnVisibility).map(col => (
                  <label key={col} className="flex items-center gap-2 text-xs text-[#5D4037] py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={columnVisibility[col]}
                      onChange={() => toggleColumnVisibility(col)}
                      className="rounded border-[#E8D5C4] text-[#8D6E63] focus:ring-[#8D6E63]"
                    />
                    {col === "matchPercentage" ? "Match Score" : col.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Density Selector */}
          {/* <div className="relative">
            <button
              onClick={() => {
                setShowDensityChooser(!showDensityChooser)
                setShowColumnChooser(false)
                setShowViewsChooser(false)
              }}
              className="flex items-center gap-1.5 px-3 py-2 border border-[#E8D5C4] rounded-lg text-xs text-[#5D4037] bg-white hover:bg-gray-50 font-semibold capitalize"
            >
              {density}
              <ChevronDown size={12} />
            </button>
            {showDensityChooser && (
              <div className="absolute right-0 top-10 z-50 bg-white border border-[#E8D5C4] rounded-lg shadow-xl p-2 w-[140px]">
                {["comfortable", "compact"].map(d => (
                  <button
                    key={d}
                    onClick={() => {
                      setDensity(d)
                      setShowDensityChooser(false)
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#5D4037] hover:bg-[#FAF5EF] rounded font-semibold capitalize"
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div> */}

          {/* Filters toggle */}
          {/* <button
            className="flex items-center gap-1.5 px-3 py-2 border border-[#E8D5C4] rounded-lg text-xs text-[#5D4037] bg-white hover:bg-gray-50 font-semibold"
          >
            <Filter size={14} />
            Filters
          </button> */}

          {/* Views dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowViewsChooser(!showViewsChooser)
                setShowColumnChooser(false)
                setShowDensityChooser(false)
              }}
              className="flex items-center gap-1.5 px-3 py-2 border border-[#E8D5C4] rounded-lg text-xs text-[#5D4037] bg-white hover:bg-gray-50 font-semibold"
            >
              Views
              <ChevronDown size={12} />
            </button>
            {showViewsChooser && (
              <div className="absolute right-0 top-10 z-50 bg-white border border-[#E8D5C4] rounded-lg shadow-xl p-2 w-[160px]">
                {["BIG Default", "High Score Fit", "Action Required"].map(v => (
                  <button
                    key={v}
                    onClick={() => {
                      setSelectedView(v)
                      setShowViewsChooser(false)
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#5D4037] hover:bg-[#FAF5EF] rounded font-semibold"
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 border border-[#8D6E63] rounded-lg text-xs text-white bg-[#8D6E63] hover:bg-[#5D4037] font-semibold"
          >
            <FileSpreadsheet size={14} />
            Export
          </button>

        </div>
      </div>

      {/* Table grid with dark brown header text matching requested changes */}
      <div className="overflow-x-auto rounded-xl border border-[#E8D5C4] shadow-sm">
        <table className="w-full border-collapse bg-white text-sm">
          <thead>
            <tr className="bg-[#4a352f] border-b border-[#E8D5C4]">
              {columnVisibility.name && (
                <th onClick={() => requestSort("name")} className="py-3 px-4 text-left font-bold text-xs text-[#ffffff] uppercase cursor-pointer tracking-wider hover:bg-black/5">
                  Business Name {sortConfig.key === "name" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
              )}
              {columnVisibility.bigScore && (
                <th onClick={() => requestSort("bigScore")} className="py-3 px-4 text-center font-bold text-xs text-[#ffffff] uppercase cursor-pointer tracking-wider hover:bg-black/5">
                  BIG Score {sortConfig.key === "bigScore" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
              )}
              {columnVisibility.matchPercentage && (
                <th onClick={() => requestSort("matchPercentage")} className="py-3 px-4 text-center font-bold text-xs text-[#ffffff] uppercase cursor-pointer tracking-wider hover:bg-black/5">
                  Match % {sortConfig.key === "matchPercentage" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
              )}
              {columnVisibility.fundingStage && (
                <th className="py-3 px-4 text-left font-bold text-xs text-[#ffffff] uppercase tracking-wider">
                  Funding Stage
                </th>
              )}
              {columnVisibility.fundingRequired && (
                <th onClick={() => requestSort("fundingAmount")} className="py-3 px-4 text-left font-bold text-xs text-[#ffffff] uppercase cursor-pointer tracking-wider hover:bg-black/5">
                  Funding
                </th>
              )}
              {columnVisibility.status && (
                <th className="py-3 px-4 text-left font-bold text-xs text-[#ffffff] uppercase tracking-wider">
                  Status
                </th>
              )}
              {columnVisibility.applied && (
                <th onClick={() => requestSort("applicationDate")} className="py-3 px-4 text-left font-bold text-xs text-[#ffffff] uppercase cursor-pointer tracking-wider hover:bg-black/5">
                  Applied
                </th>
              )}
              {columnVisibility.daysInStage && (
                <th className="py-3 px-4 text-left font-bold text-xs text-[#ffffff] uppercase tracking-wider">
                  Days in Stage
                </th>
              )}
              {columnVisibility.lastActivity && (
                <th className="py-3 px-4 text-left font-bold text-xs text-[#ffffff] uppercase tracking-wider">
                  Last Activity
                </th>
              )}
              {columnVisibility.actions && (
                <th className="py-3 px-4 text-left font-bold text-xs text-[#ffffff] uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {processedMatches.length === 0 ? (
              <tr>
                <td colSpan="10" className="py-12 text-center text-gray-400">
                  No matching SMEs found.
                </td>
              </tr>
            ) : (
              processedMatches.map(item => {
                const bigLabel = getBigScoreLabel(item.bigScore || 0)
                const matchLabel = getMatchLabel(item.matchPercentage || 0)
                const statusStyle = getStatusStyle(item.currentStatus || item.pipelineStage)
                const nextStageName = getNextStage(item.currentStatus || item.pipelineStage)
                const rowPadding = density === "compact" ? "py-1.5 px-4" : "py-3.5 px-4"
                const actionLabel = getActionLabel(item.currentStatus || item.pipelineStage)

                return (
                  <tr key={item.id} className="border-b border-[#F0E6DC] hover:bg-[#FAF5EF] transition-all">
                    {columnVisibility.name && (
                      <td className={rowPadding}>
                        <div className="flex items-center gap-3">
                          {/* Round letter avatar */}
                          <div className="w-8 h-8 rounded-full bg-[#5D4037] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {(item.name || "S").charAt(0)}
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-[#5D4037] block">{item.name}</span>
                          </div>
                        </div>
                      </td>
                    )}

                    {/* BIG Score ring cell using Catalyst circular SVG doughnut graph style */}
                    {columnVisibility.bigScore && (
                      <td className={`${rowPadding} text-center`}>
                        <div className="flex flex-col items-center gap-1 mx-auto">
                          <div className="relative w-11 h-11">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                              <circle cx="18" cy="18" r="14" fill="none" stroke="#e6d7c3" strokeWidth="3" />
                              <circle 
                                cx="18" 
                                cy="18" 
                                r="14" 
                                fill="none" 
                                stroke={bigLabel.color} 
                                strokeWidth="3"
                                strokeDasharray={`${(item.bigScore || 0) * 0.88} 88`}
                                strokeLinecap="round"
                                className="transition-all duration-1000"
                              />
                            </svg>
                            <span 
                              className="absolute inset-0 flex items-center justify-center text-xs font-bold"
                              style={{ color: bigLabel.color }}
                            >
                              {item.bigScore}
                            </span>
                          </div>
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1"
                            style={{ 
                              backgroundColor: `${bigLabel.color}20`,
                              color: bigLabel.color
                            }}
                          >
                            {bigLabel.label}
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Match fit bar cell matching screenshot */}
                    {columnVisibility.matchPercentage && (
                      <td className={`${rowPadding} text-center`}>
                        <div className="min-w-[120px] mx-auto inline-block text-left">
                          <div className="flex justify-between text-[10px] font-bold mb-1">
                            <span style={{ color: matchLabel.color }}>{item.matchPercentage}%</span>
                            <span style={{ color: matchLabel.color }}>{matchLabel.label}</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#E8D5C4] rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full"
                              style={{ 
                                width: `${item.matchPercentage}%`,
                                backgroundColor: matchLabel.barColor
                              }}
                            />
                          </div>
                        </div>
                      </td>
                    )}

                    {columnVisibility.fundingStage && (
                      <td className={`${rowPadding} text-xs text-[#5D4037]`}>
                        <span className="px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-lg text-[#4a352f] font-medium">
                          {item.fundingStage || "Startup"}
                        </span>
                      </td>
                    )}

                    {columnVisibility.fundingRequired && (
                      <td className={`${rowPadding} text-xs text-[#5D4037] font-semibold`}>
                        {item.fundingRequired}
                      </td>
                    )}

                    {columnVisibility.status && (
                      <td className={rowPadding}>
                        <span 
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                          style={{ 
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.text,
                            borderColor: statusStyle.border
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusStyle.dot }} />
                          {item.currentStatus || item.pipelineStage || "Matching"}
                        </span>
                      </td>
                    )}

                    {columnVisibility.applied && (
                      <td className={`${rowPadding} text-xs text-[#5D4037]`}>
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-[#8D6E63]" />
                          {new Date(item.applicationDate).toLocaleDateString("en-GB", {
                            day: "2-digit", month: "short", year: "numeric"
                          })}
                        </div>
                      </td>
                    )}

                    {columnVisibility.daysInStage && (
                      <td className={`${rowPadding} text-xs text-[#5D4037]`}>
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-[#8D6E63]" />
                          0 days
                        </div>
                      </td>
                    )}

                    {columnVisibility.lastActivity && (
                      <td className={`${rowPadding} text-xs text-[#5D4037] max-w-[120px] truncate`}>
                        {item.lastActivity || "N/A"}
                      </td>
                    )}

                    {columnVisibility.actions && (
                      <td className={rowPadding}>
                        <div className="flex items-center gap-1.5 relative">
                          <button
                            onClick={() => {
                              onUpdateStage(item.id, nextStageName || "Admitted")
                            }}
                            className="px-3 py-1.5 bg-[#4a352f] text-white hover:bg-[#3E2723] rounded-lg text-xs font-bold transition-all shadow-sm"
                          >
                            {actionLabel}
                          </button>
                          
                          <button
                            onClick={() => setActionMenuOpenId(actionMenuOpenId === item.id ? null : item.id)}
                            className="p-1.5 border border-[#E8D5C4] hover:bg-[#E8D5C4] rounded-lg text-gray-500 hover:text-gray-700"
                          >
                            <MoreVertical size={14} />
                          </button>

                          {actionMenuOpenId === item.id && (
                            <div className="absolute right-0 top-10 z-50 bg-white border border-[#E8D5C4] rounded-lg shadow-xl p-2 w-[180px]">
                              <button
                                onClick={() => {
                                  setSelectedSME(item)
                                  setActionMenuOpenId(null)
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold text-[#5D4037] hover:bg-[#FAF5EF] rounded flex items-center gap-2"
                              >
                                <Eye size={12} />
                                View Details
                              </button>

                              {nextStageName && (
                                <button
                                  onClick={() => {
                                    onUpdateStage(item.id, nextStageName)
                                    setActionMenuOpenId(null)
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs font-semibold text-[#5D4037] hover:bg-[#FAF5EF] rounded flex items-center gap-2"
                                >
                                  <CheckCircle size={12} />
                                  Move to {nextStageName}
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  window.location.href = `/cmf-messages?smeId=${item.id}`
                                  setActionMenuOpenId(null)
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold text-[#5D4037] hover:bg-[#FAF5EF] rounded flex items-center gap-2"
                              >
                                <MessageSquare size={12} />
                                Message SME
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <CMFSMEDetailsModal
        sme={selectedSME}
        isOpen={!!selectedSME}
        onClose={() => setSelectedSME(null)}
      />
    </div>
  )
}
