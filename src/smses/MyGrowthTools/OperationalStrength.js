"use client"

import { useState, useEffect } from "react"
import { Bar, Line, Pie } from "react-chartjs-2"
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db, auth } from "../../firebaseConfig"
import { onAuthStateChanged } from "firebase/auth"
import Sidebar from "smses/Sidebar/Sidebar"
import Header from "../DashboardHeader/DashboardHeader"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend)

// Helper function to get months array based on year
const getMonthsForYear = (year, viewMode = "month") => {
  if (viewMode === "year") return [`FY ${year}`]
  if (viewMode === "quarter") return ["Q1", "Q2", "Q3", "Q4"]
  
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return months
}

// Helper component for trend icon
const TrendChartIcon = ({ onClick, style = {} }) => (
  <div
    onClick={onClick}
    style={{
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "24px",
      height: "24px",
      ...style
    }}
  >
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#5d4037"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  </div>
)

// Key Question Component with Show More functionality
const KeyQuestionBox = ({ question, signals, decisions, section }) => {
  const [showMore, setShowMore] = useState(false)
  
  // Get first sentence
  const getFirstSentence = (text) => {
    const match = text.match(/^[^.!?]+[.!?]/)
    return match ? match[0] : text.split('.')[0] + '.'
  }
  
  return (
    <div
      style={{
        backgroundColor: "	#DCDCDC",
        padding: "15px 20px",
        borderRadius: "8px",
        marginBottom: "20px",
        border: "1px solid 	#5d4037",
      }}
    >
      <div style={{ marginBottom: "8px" }}>
        <strong style={{ color: "#5d4037", fontSize: "14px" }}>Key Question:</strong>
        <span style={{ color: "#5d4037", fontSize: "14px", marginLeft: "8px" }}>
          {showMore ? question : getFirstSentence(question)}
        </span>
{!showMore && (question.length > getFirstSentence(question).length || signals || decisions) && (
          <button
            onClick={() => setShowMore(true)}
            style={{
              background: "none",
              border: "none",
              color: "#5d4037",
              fontWeight: "600",
              cursor: "pointer",
              marginLeft: "5px",
              textDecoration: "underline",
            }}
          >
            Show more
          </button>
        )}
      </div>
      
      {showMore && (
        <>
          <div style={{ marginBottom: "8px" }}>
            <strong style={{ color: "#5d4037", fontSize: "14px" }}>Key Signals:</strong>
            <span style={{ color: "#5d4037", fontSize: "14px", marginLeft: "8px" }}>{signals}</span>
          </div>
          <div>
            <strong style={{ color: "#5d4037", fontSize: "14px" }}>Key Decisions:</strong>
            <span style={{ color: "#5d4037", fontSize: "14px", marginLeft: "8px" }}>{decisions}</span>
          </div>
          <button
            onClick={() => setShowMore(false)}
            style={{
              background: "none",
              border: "none",
              color: "#5d4037",
              fontWeight: "600",
              cursor: "pointer",
              marginTop: "10px",
              textDecoration: "underline",
            }}
          >
            Show less
          </button>
        </>
      )}
    </div>
  )
}

// KPI Dashboard Component with Navigation
const KPIDashboard = ({ activeSection, isInvestorView, onCategoryClick, financialYearStartMonth }) => {
  const [allData, setAllData] = useState({})
  const [financialYearMonths, setFinancialYearMonths] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [kpiViewMode, setKpiViewMode] = useState("month")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user)
        loadAllData(user.uid)
      } else {
        setCurrentUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const months = getMonthsForYear(new Date().getFullYear(), "month")
    setFinancialYearMonths(months)
  }, [])

  const loadAllData = async (userId) => {
    try {
      // Load data from all sections
      const sections = [
        'supplierDependency',
        'continuityRisk',
        'productivity',
        'reliability',
        'safetyRisk',
        'compliance'
      ]
      
      const data = {}
      for (const section of sections) {
        try {
          const docRef = doc(db, section, userId)
          const docSnap = await getDoc(docRef)
          if (docSnap.exists()) {
            data[section] = docSnap.data()
          }
        } catch (error) {
          console.error(`Error loading ${section} data:`, error)
        }
      }
      setAllData(data)
    } catch (error) {
      console.error("Error loading all data:", error)
    }
  }

  // Build KPI rows from all data sources
  const buildKPIRows = () => {
    const rows = []

    // Supplier Dependency Category
    if (allData.supplierDependency) {
      const top3SupplierPercent = allData.supplierDependency.top3SupplierPercent || 0
      const singleSourceFlags = allData.supplierDependency.singleSourceFlags || 0
      const criticalSupplierCount = allData.supplierDependency.criticalSupplierCount || 0

      rows.push({
        category: "Supply Chain",
        sectionId: "supply-chain",
        kpi: "Top 3 Supplier %",
        units: "%",
        thisMonthTarget: 70,
        thisMonthActual: top3SupplierPercent,
        ytdTarget: 70,
        ytdActual: top3SupplierPercent,
      })
      rows.push({
        category: "Supply Chain",
        sectionId: "supply-chain",
        kpi: "Single Source Flags",
        units: "#",
        thisMonthTarget: 0,
        thisMonthActual: singleSourceFlags,
        ytdTarget: 0,
        ytdActual: singleSourceFlags,
      })
      rows.push({
        category: "Supply Chain",
        sectionId: "supply-chain",
        kpi: "Critical Supplier Count",
        units: "#",
        thisMonthTarget: 5,
        thisMonthActual: criticalSupplierCount,
        ytdTarget: 5,
        ytdActual: criticalSupplierCount,
      })
    }

    // Continuity Risk Category
    if (allData.continuityRisk) {
      const leadTimeVariance = allData.continuityRisk.leadTimeVariance || 0
      const stockCoverDays = allData.continuityRisk.stockCoverDays || 0
      const disruptionRisk = allData.continuityRisk.disruptionRisk || 0

      rows.push({
        category: "Continuity Risk",
        sectionId: "supply-chain",
        kpi: "Lead Time Variance",
        units: "days",
        thisMonthTarget: 2,
        thisMonthActual: leadTimeVariance,
        ytdTarget: 2,
        ytdActual: leadTimeVariance,
      })
      rows.push({
        category: "Continuity Risk",
        sectionId: "supply-chain",
        kpi: "Stock Cover Days",
        units: "days",
        thisMonthTarget: 30,
        thisMonthActual: stockCoverDays,
        ytdTarget: 30,
        ytdActual: stockCoverDays,
      })
      rows.push({
        category: "Continuity Risk",
        sectionId: "supply-chain",
        kpi: "Disruption Risk Index",
        units: "index",
        thisMonthTarget: 20,
        thisMonthActual: disruptionRisk,
        ytdTarget: 20,
        ytdActual: disruptionRisk,
      })
    }

    // Productivity Category
    if (allData.productivity) {
      const volume = allData.productivity.volume || 0
      const availability = allData.productivity.availability || 0
      const utilization = allData.productivity.utilization || 0
      const unitCost = allData.productivity.unitCost || 0

      rows.push({
        category: "Productivity",
        sectionId: "delivery",
        kpi: "Production Volume",
        units: "units",
        thisMonthTarget: 10000,
        thisMonthActual: volume,
        ytdTarget: 10000,
        ytdActual: volume,
      })
      rows.push({
        category: "Productivity",
        sectionId: "delivery",
        kpi: "Availability %",
        units: "%",
        thisMonthTarget: 95,
        thisMonthActual: availability,
        ytdTarget: 95,
        ytdActual: availability,
      })
      rows.push({
        category: "Productivity",
        sectionId: "delivery",
        kpi: "Utilization %",
        units: "%",
        thisMonthTarget: 85,
        thisMonthActual: utilization,
        ytdTarget: 85,
        ytdActual: utilization,
      })
      rows.push({
        category: "Productivity",
        sectionId: "delivery",
        kpi: "Unit Cost",
        units: "R",
        thisMonthTarget: 50,
        thisMonthActual: unitCost,
        ytdTarget: 50,
        ytdActual: unitCost,
      })
    }

    // Reliability Category
    if (allData.reliability) {
      const onTimeDelivery = allData.reliability.onTimeDelivery || 0
      const reworkRate = allData.reliability.reworkRate || 0
      const defectRate = allData.reliability.defectRate || 0

      rows.push({
        category: "Reliability",
        sectionId: "delivery",
        kpi: "On-time Delivery %",
        units: "%",
        thisMonthTarget: 98,
        thisMonthActual: onTimeDelivery,
        ytdTarget: 98,
        ytdActual: onTimeDelivery,
      })
      rows.push({
        category: "Reliability",
        sectionId: "delivery",
        kpi: "Rework Rate",
        units: "%",
        thisMonthTarget: 2,
        thisMonthActual: reworkRate,
        ytdTarget: 2,
        ytdActual: reworkRate,
      })
      rows.push({
        category: "Reliability",
        sectionId: "delivery",
        kpi: "Defect Rate",
        units: "%",
        thisMonthTarget: 1,
        thisMonthActual: defectRate,
        ytdTarget: 1,
        ytdActual: defectRate,
      })
    }

    // Safety Risk Category
    if (allData.safetyRisk) {
      const safetyIncidents = allData.safetyRisk.safetyIncidents || 0
      const openActions = allData.safetyRisk.openActions || 0
      const complianceStatus = allData.safetyRisk.complianceStatus || 0

      rows.push({
        category: "Safety Risk",
        sectionId: "safety",
        kpi: "Safety Incidents",
        units: "#",
        thisMonthTarget: 0,
        thisMonthActual: safetyIncidents,
        ytdTarget: 0,
        ytdActual: safetyIncidents,
      })
      rows.push({
        category: "Safety Risk",
        sectionId: "safety",
        kpi: "Open Safety Actions",
        units: "#",
        thisMonthTarget: 5,
        thisMonthActual: openActions,
        ytdTarget: 5,
        ytdActual: openActions,
      })
      rows.push({
        category: "Safety Risk",
        sectionId: "safety",
        kpi: "Compliance Status %",
        units: "%",
        thisMonthTarget: 100,
        thisMonthActual: complianceStatus,
        ytdTarget: 100,
        ytdActual: complianceStatus,
      })
    }

    // Compliance Category
    if (allData.compliance) {
      const regulatoryGaps = allData.compliance.regulatoryGaps || 0
      const auditFindings = allData.compliance.auditFindings || 0
      const certificationStatus = allData.compliance.certificationStatus || 0

      rows.push({
        category: "Compliance",
        sectionId: "safety",
        kpi: "Regulatory Gaps",
        units: "#",
        thisMonthTarget: 0,
        thisMonthActual: regulatoryGaps,
        ytdTarget: 0,
        ytdActual: regulatoryGaps,
      })
      rows.push({
        category: "Compliance",
        sectionId: "safety",
        kpi: "Audit Findings",
        units: "#",
        thisMonthTarget: 3,
        thisMonthActual: auditFindings,
        ytdTarget: 3,
        ytdActual: auditFindings,
      })
      rows.push({
        category: "Compliance",
        sectionId: "safety",
        kpi: "Certification Status %",
        units: "%",
        thisMonthTarget: 100,
        thisMonthActual: certificationStatus,
        ytdTarget: 100,
        ytdActual: certificationStatus,
      })
    }

    return rows
  }

  const formatValue = (value, decimals = 0) => {
    if (value === null || value === undefined) return "0"
    return Number(value).toFixed(decimals)
  }

  const calculateVariance = (target, actual) => {
    return actual - target
  }

  const handleDownloadCSV = () => {
    const headers = ["Category", "KPI", "Units of Measure", "This Month Target", "This Month Actual", "This Month Var.", "YTD Target", "YTD Actual", "YTD Var."]
    const rows = []
    const kpiRows = buildKPIRows()

    kpiRows.forEach(row => {
      const monthlyVar = calculateVariance(row.thisMonthTarget, row.thisMonthActual)
      const ytdVar = calculateVariance(row.ytdTarget, row.ytdActual)

      rows.push([
        row.category,
        row.kpi,
        row.units,
        formatValue(row.thisMonthTarget, 1),
        formatValue(row.thisMonthActual, 1),
        formatValue(monthlyVar, 1),
        formatValue(row.ytdTarget, 1),
        formatValue(row.ytdActual, 1),
        formatValue(ytdVar, 1)
      ])
    })

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `operational-kpi-dashboard.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const kpiRows = buildKPIRows()

  // Group by category
  const groupedKPIs = kpiRows.reduce((acc, row) => {
    if (!acc[row.category]) {
      acc[row.category] = []
    }
    acc[row.category].push(row)
    return acc
  }, {})

  if (activeSection !== "kpi-dashboard") return null

  return (
    <div
      style={{
        backgroundColor: "#faf7f2",
        padding: "20px",
        margin: "20px 0",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ color: "#4a352f", marginTop: 0, marginBottom: "5px" }}>KPI Dashboard Summary</h2>
          <p style={{ color: "#7d5a50", fontSize: "14px", margin: 0 }}>
            Operational Performance Metrics Overview
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "5px", marginRight: "20px" }}>
            <button
              onClick={() => setKpiViewMode("month")}
              style={{
                padding: "8px 16px",
                backgroundColor: kpiViewMode === "month" ? "#5d4037" : "#e8ddd4",
                color: kpiViewMode === "month" ? "#fdfcfb" : "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px",
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setKpiViewMode("quarter")}
              style={{
                padding: "8px 16px",
                backgroundColor: kpiViewMode === "quarter" ? "#5d4037" : "#e8ddd4",
                color: kpiViewMode === "quarter" ? "#fdfcfb" : "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px",
              }}
            >
              Quarterly
            </button>
            <button
              onClick={() => setKpiViewMode("year")}
              style={{
                padding: "8px 16px",
                backgroundColor: kpiViewMode === "year" ? "#5d4037" : "#e8ddd4",
                color: kpiViewMode === "year" ? "#fdfcfb" : "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px",
              }}
            >
              Yearly
            </button>
          </div>
          <button
            onClick={handleDownloadCSV}
            style={{
              padding: "10px 20px",
              backgroundColor: "#a67c52",
              color: "#faf7f2",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
            }}
          >
            Download CSV
          </button>
        </div>
      </div>

      {kpiRows.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#72542b" }}>
          <p>No data available. Please add data in the other tabs to see the KPI summary here.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              backgroundColor: "white",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#9c8269" }}>
                <th style={{ padding: "12px", textAlign: "left", color: "white", fontWeight: "bold", borderRight: "1px solid #8b7355" }}>
                  Category
                </th>
                <th style={{ padding: "12px", textAlign: "left", color: "white", fontWeight: "bold", borderRight: "1px solid #8b7355" }}>
                  KPI
                </th>
                <th style={{ padding: "12px", textAlign: "center", color: "white", fontWeight: "bold", borderRight: "1px solid #8b7355" }}>
                  Units of<br />Measure
                </th>
                <th colSpan="2" style={{ padding: "12px", textAlign: "center", color: "white", fontWeight: "bold", borderRight: "1px solid #8b7355", backgroundColor: "#b4a592" }}>
                  Status
                </th>
                <th colSpan="3" style={{ padding: "12px", textAlign: "center", color: "white", fontWeight: "bold", borderRight: "1px solid #8b7355", backgroundColor: "#a89885" }}>
                  This {kpiViewMode === "quarter" ? "Quarter" : kpiViewMode === "year" ? "Year" : "Month"}
                </th>
                <th colSpan="3" style={{ padding: "12px", textAlign: "center", color: "white", fontWeight: "bold", backgroundColor: "#9c8c78" }}>
                  YTD
                </th>
              </tr>
              <tr style={{ backgroundColor: "#d4c4b0" }}>
                <th style={{ padding: "8px", borderRight: "1px solid #c4b4a0" }}></th>
                <th style={{ padding: "8px", borderRight: "1px solid #c4b4a0" }}></th>
                <th style={{ padding: "8px", borderRight: "1px solid #c4b4a0" }}></th>
                <th style={{ padding: "8px", textAlign: "center", color: "#4a352f", fontSize: "12px", fontWeight: "600", borderRight: "1px solid #c4b4a0" }}>
                  This<br />{kpiViewMode === "quarter" ? "Qtr" : kpiViewMode === "year" ? "Year" : "Month"}
                </th>
                <th style={{ padding: "8px", textAlign: "center", color: "#4a352f", fontSize: "12px", fontWeight: "600", borderRight: "1px solid #c4b4a0" }}>
                  YTD
                </th>
                <th style={{ padding: "8px", textAlign: "center", color: "#4a352f", fontSize: "12px", fontWeight: "600", borderRight: "1px solid #c4b4a0" }}>
                  Target
                </th>
                <th style={{ padding: "8px", textAlign: "center", color: "#4a352f", fontSize: "12px", fontWeight: "600", borderRight: "1px solid #c4b4a0" }}>
                  Actual
                </th>
                <th style={{ padding: "8px", textAlign: "center", color: "#4a352f", fontSize: "12px", fontWeight: "600", borderRight: "1px solid #c4b4a0" }}>
                  Var.
                </th>
                <th style={{ padding: "8px", textAlign: "center", color: "#4a352f", fontSize: "12px", fontWeight: "600", borderRight: "1px solid #c4b4a0" }}>
                  Target
                </th>
                <th style={{ padding: "8px", textAlign: "center", color: "#4a352f", fontSize: "12px", fontWeight: "600", borderRight: "1px solid #c4b4a0" }}>
                  Actual
                </th>
                <th style={{ padding: "8px", textAlign: "center", color: "#4a352f", fontSize: "12px", fontWeight: "600" }}>
                  Var.
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedKPIs).map(([category, categoryKpis], categoryIndex) => (
                <>
                  {categoryKpis.map((row, kpiIndex) => {
                    const monthlyVar = calculateVariance(row.thisMonthTarget, row.thisMonthActual)
                    const ytdVar = calculateVariance(row.ytdTarget, row.ytdActual)

                    return (
                      <tr
                        key={`${category}-${kpiIndex}`}
                        style={{
                          backgroundColor: categoryIndex % 2 === 0 ? "#f5f5f5" : "#e8e8e8",
                          borderBottom: "1px solid #ddd",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          if (onCategoryClick && row.sectionId) {
                            onCategoryClick(row.sectionId)
                          }
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = categoryIndex % 2 === 0 ? "#e8e8e8" : "#f5f5f5"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = categoryIndex % 2 === 0 ? "#f5f5f5" : "#e8e8e8"
                        }}
                      >
                        {kpiIndex === 0 && (
                          <td
                            rowSpan={categoryKpis.length}
                            style={{
                              padding: "12px",
                              fontWeight: "bold",
                              color: "#4a352f",
                              borderRight: "2px solid #999",
                              backgroundColor: categoryIndex % 2 === 0 ? "#e6d7c3" : "#d4c4b0",
                              verticalAlign: "top",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              {category}
                              <span style={{ fontSize: "12px", color: "#72542b" }}>▶</span>
                            </div>
                          </td>
                        )}
                        <td style={{ padding: "12px", color: "#4a352f", borderRight: "1px solid #ddd" }}>
                          {row.kpi}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center", color: "#4a352f", borderRight: "1px solid #ddd" }}>
                          {row.units}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center", borderRight: "1px solid #ddd" }}>
                          {monthlyVar >= 0 ? "✅" : "⚠️"}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center", borderRight: "1px solid #ddd" }}>
                          {ytdVar >= 0 ? "✅" : "⚠️"}
                        </td>
                        <td style={{ padding: "12px", textAlign: "right", color: "#4a352f", borderRight: "1px solid #ddd" }}>
                          {formatValue(row.thisMonthTarget, 1)}
                        </td>
                        <td style={{ padding: "12px", textAlign: "right", color: "#4a352f", borderRight: "1px solid #ddd" }}>
                          {formatValue(row.thisMonthActual, 1)}
                        </td>
                        <td style={{ padding: "12px", textAlign: "right", color: "#4a352f", fontWeight: "bold", borderRight: "1px solid #ddd" }}>
                          {formatValue(monthlyVar, 1)}
                        </td>
                        <td style={{ padding: "12px", textAlign: "right", color: "#4a352f", borderRight: "1px solid #ddd" }}>
                          {formatValue(row.ytdTarget, 1)}
                        </td>
                        <td style={{ padding: "12px", textAlign: "right", color: "#4a352f", borderRight: "1px solid #ddd" }}>
                          {formatValue(row.ytdActual, 1)}
                        </td>
                        <td style={{ padding: "12px", textAlign: "right", color: "#4a352f", fontWeight: "bold" }}>
                          {formatValue(ytdVar, 1)}
                        </td>
                      </tr>
                    )
                  })}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Generic Chart Component with Notes and AI Analysis
const OperationalChart = ({ title, data, kpiKey, isInvestorView, onUpdate, units = "", type = "bar", notes = "", analysis = "", chartHeight = "60px" }) => {
  const [expandedNotes, setExpandedNotes] = useState(false)
  const [expandedAnalysis, setExpandedAnalysis] = useState(false)
  const [currentNotes, setCurrentNotes] = useState(notes)
  const [currentAnalysis, setCurrentAnalysis] = useState(analysis)

  const handleAddNotes = () => {
    setExpandedNotes(!expandedNotes)
  }

  const handleAIAnalysis = () => {
    setExpandedAnalysis(!expandedAnalysis)
  }

  const updateNotes = (newNotes) => {
    setCurrentNotes(newNotes)
    if (onUpdate) {
      onUpdate('notes', newNotes)
    }
  }

  const updateAnalysis = (newAnalysis) => {
    setCurrentAnalysis(newAnalysis)
    if (onUpdate) {
      onUpdate('analysis', newAnalysis)
    }
  }

  const renderChart = () => {
    if (type === "line") {
      return (
        <Line
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
              title: {
                display: false,
              },
              tooltip: {
                backgroundColor: 'rgba(93, 64, 55, 0.9)',
                titleColor: '#fdfcfb',
                bodyColor: '#fdfcfb',
                displayColors: false
              }
            },
            scales: {
              x: {
                ticks: {
                  maxRotation: 0,
                  autoSkip: true,
                  maxTicksLimit: 6
                },
                grid: {
                  display: false
                }
              },
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return units === '%' ? value + '%' : value
                  }
                },
                grid: {
                  color: 'rgba(0,0,0,0.05)'
                }
              },
            },
          }}
          height={chartHeight}
        />
      )
    } else if (type === "pie") {
      return (
        <div style={{ height: chartHeight }}>
          <Pie
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
                tooltip: {
                  backgroundColor: 'rgba(93, 64, 55, 0.9)',
                  titleColor: '#fdfcfb',
                  bodyColor: '#fdfcfb'
                }
              },
            }}
          />
        </div>
      )
    } else {
      return (
        <Bar
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
              title: {
                display: false,
              },
              tooltip: {
                backgroundColor: 'rgba(93, 64, 55, 0.9)',
                titleColor: '#fdfcfb',
                bodyColor: '#fdfcfb',
                displayColors: false
              }
            },
            scales: {
              x: {
                ticks: {
                  maxRotation: 0,
                  autoSkip: true,
                  maxTicksLimit: 6
                },
                grid: {
                  display: false
                }
              },
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return units === '%' ? value + '%' : value
                  }
                },
                grid: {
                  color: 'rgba(0,0,0,0.05)'
                }
              },
            },
          }}
          height={chartHeight}
        />
      )
    }
  }

  const totalValue = data.datasets[0].data.reduce((a, b) => a + b, 0)
  const averageValue = totalValue / data.datasets[0].data.length

  return (
    <div
      style={{
        backgroundColor: "#fdfcfb",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        marginBottom: "20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
        <div
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            border: "5px solid #f9a825",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: "20px",
            backgroundColor: "#fff9c4",
            flexShrink: 0,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: "700", color: "#5d4037" }}>
              {averageValue.toFixed(1)}
            </div>
            <div style={{ fontSize: "11px", color: "#8d6e63" }}>{units}</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ color: "#5d4037", marginBottom: "5px", fontSize: "16px" }}>{title}</h4>
          <div style={{ height: chartHeight }}>
            {renderChart()}
          </div>
        </div>
      </div>

      {!isInvestorView && (
        <div style={{ borderTop: "1px solid #e8ddd4", paddingTop: "15px" }}>
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <button
              onClick={handleAddNotes}
              style={{
                padding: "6px 12px",
                backgroundColor: "#e8ddd4",
                color: "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "12px",
              }}
            >
              ADD notes
            </button>
            <button
              onClick={handleAIAnalysis}
              style={{
                padding: "6px 12px",
                backgroundColor: "#e8ddd4",
                color: "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "12px",
              }}
            >
              AI analysis
            </button>
          </div>

          {expandedNotes && (
            <div style={{ marginBottom: "10px" }}>
              <label
                style={{
                  fontSize: "12px",
                  color: "#5d4037",
                  fontWeight: "600",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Notes / Comments:
              </label>
              <textarea
                value={currentNotes}
                onChange={(e) => updateNotes(e.target.value)}
                placeholder="Add notes or comments..."
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  minHeight: "60px",
                  fontSize: "13px",
                }}
              />
            </div>
          )}

          {expandedAnalysis && (
            <div
              style={{
                backgroundColor: "#e3f2fd",
                padding: "15px",
                borderRadius: "6px",
                border: "1px solid #90caf9",
              }}
            >
              <label
                style={{
                  fontSize: "12px",
                  color: "#1565c0",
                  fontWeight: "600",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                AI Analysis:
              </label>
              <p style={{ fontSize: "13px", color: "#1565c0", lineHeight: "1.5", margin: 0 }}>
                {currentAnalysis || "AI analysis will be generated based on your data trends, comparing current performance against historical averages and industry benchmarks. This feature provides actionable insights for improving this metric."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Supply Chain Component with Updated Charts
const SupplyChain = ({ activeSection, viewMode, user, isInvestorView }) => {
  const [activeSubTab, setActiveSubTab] = useState("supplier-dependency")
  const [showModal, setShowModal] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState("Jan")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [dataDate, setDataDate] = useState(new Date().toISOString().split('T')[0])
  const [showKPIAdd, setShowKPIAdd] = useState(false)
  const [kpiViewMode, setKpiViewMode] = useState("month")

  // Supplier Dependency Data
  const [supplierData, setSupplierData] = useState({
    top3SupplierPercent: Array(12).fill(""),
    singleSourceFlags: Array(12).fill(""),
    criticalSupplierCount: Array(12).fill(""),
    notes: "",
    analysis: "",
  })

  // Continuity Risk Data
  const [continuityData, setContinuityData] = useState({
    leadTimeVariance: Array(12).fill(""),
    stockCoverDays: Array(12).fill(""),
    disruptionRisk: Array(12).fill(""),
    supplierPerformance: Array(12).fill(""),
    notes: "",
    analysis: "",
  })

  const months = getMonthsForYear(selectedYear, kpiViewMode)
  const years = Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i)

  const subTabs = [
    { id: "supplier-dependency", label: "Supplier Dependency" },
    { id: "continuity-risk", label: "Continuity Risk" },
  ]

  useEffect(() => {
    if (user) {
      loadSupplyChainData()
    }
  }, [user])

  useEffect(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.toLocaleString('default', { month: 'short' })
    setSelectedYear(year)
    setSelectedMonth(month)
    setDataDate(today.toISOString().split('T')[0])
  }, [])

  const loadSupplyChainData = async () => {
    if (!user) return
    setLoading(true)
    try {
      // Load Supplier Dependency Data
      const supplierDoc = await getDoc(doc(db, "supplierDependency", user.uid))
      if (supplierDoc.exists()) {
        const data = supplierDoc.data()
        setSupplierData({
          top3SupplierPercent: data.top3SupplierPercent || Array(12).fill(""),
          singleSourceFlags: data.singleSourceFlags || Array(12).fill(""),
          criticalSupplierCount: data.criticalSupplierCount || Array(12).fill(""),
          notes: data.notes || "",
          analysis: data.analysis || "",
        })
      }

      // Load Continuity Risk Data
      const continuityDoc = await getDoc(doc(db, "continuityRisk", user.uid))
      if (continuityDoc.exists()) {
        const data = continuityDoc.data()
        setContinuityData({
          leadTimeVariance: data.leadTimeVariance || Array(12).fill(""),
          stockCoverDays: data.stockCoverDays || Array(12).fill(""),
          disruptionRisk: data.disruptionRisk || Array(12).fill(""),
          supplierPerformance: data.supplierPerformance || Array(12).fill(""),
          notes: data.notes || "",
          analysis: data.analysis || "",
        })
      }
    } catch (error) {
      console.error("Error loading supply chain data:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveSupplyChainData = async () => {
    if (!user) {
      alert("Please log in to save data")
      return
    }
    setLoading(true)
    try {
      // Save Supplier Dependency Data
      await setDoc(doc(db, "supplierDependency", user.uid), {
        ...supplierData,
        userId: user.uid,
        lastUpdated: new Date().toISOString(),
        dataDate: dataDate,
      })

      // Save Continuity Risk Data
      await setDoc(doc(db, "continuityRisk", user.uid), {
        ...continuityData,
        userId: user.uid,
        lastUpdated: new Date().toISOString(),
        dataDate: dataDate,
      })

      setShowModal(false)
      alert("Data saved successfully!")
    } catch (error) {
      console.error("Error saving data:", error)
      alert("Error saving data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getMonthIndex = (month) => months.indexOf(month)
  const monthIndex = getMonthIndex(selectedMonth)

  const updateSupplierData = (field, value) => {
    setSupplierData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const updateContinuityData = (field, value) => {
    setContinuityData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const renderSupplierDependency = () => {
    const colors = ["#5d4037", "#8d6e63", "#a67c52", "#72542b"]
    
    return (
      <div>
        <KeyQuestionBox
          question="Are we exposed to supplier failure?"
          signals="Concentration risk"
          decisions="Diversify or consolidate suppliers"
          section="supplier-dependency"
        />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginBottom: "20px" }}>
          {!isInvestorView && (
            <>
              <button
                onClick={() => setShowKPIAdd(true)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#8d6e63",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "13px",
                }}
              >
                Add KPI
              </button>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "13px",
                }}
              >
                Add Data
              </button>
            </>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "20px" }}>
          <OperationalChart
            title="Top 3 Supplier %"
            data={{
              labels: months,
              datasets: [{
                data: supplierData.top3SupplierPercent.map(v => Number.parseFloat(v) || 0),
                backgroundColor: colors[0],
                borderColor: colors[0],
                borderWidth: 2,
              }]
            }}
            kpiKey="top3SupplierPercent"
            isInvestorView={isInvestorView}
            onUpdate={(field, value) => updateSupplierData(field, value)}
            units="%"
            type="line"
            notes={supplierData.notes}
            analysis={supplierData.analysis}
          />

          <OperationalChart
            title="Single Source Flags"
            data={{
              labels: months,
              datasets: [{
                data: supplierData.singleSourceFlags.map(v => Number.parseFloat(v) || 0),
                backgroundColor: colors[1],
                borderColor: colors[1],
                borderWidth: 2,
              }]
            }}
            kpiKey="singleSourceFlags"
            isInvestorView={isInvestorView}
            onUpdate={(field, value) => updateSupplierData(field, value)}
            units="#"
            type="bar"
          />

          <OperationalChart
            title="Critical Supplier Count"
            data={{
              labels: months,
              datasets: [{
                data: supplierData.criticalSupplierCount.map(v => Number.parseFloat(v) || 0),
                backgroundColor: colors[2],
                borderColor: colors[2],
                borderWidth: 2,
              }]
            }}
            kpiKey="criticalSupplierCount"
            isInvestorView={isInvestorView}
            onUpdate={(field, value) => updateSupplierData(field, value)}
            units="#"
            type="bar"
          />
        </div>
      </div>
    )
  }

  const renderContinuityRisk = () => {
    const colors = ["#33ab9f", "#26a69a", "#009688", "#00897b"]
    
    return (
      <div>
        <KeyQuestionBox
          question="Can we scale without disruption?"
          signals="Lead time & dependency"
          decisions="Adjust growth plans"
          section="continuity-risk"
        />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginBottom: "20px" }}>
          {!isInvestorView && (
            <>
              <button
                onClick={() => setShowKPIAdd(true)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#8d6e63",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "13px",
                }}
              >
                Add KPI
              </button>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "13px",
                }}
              >
                Add Data
              </button>
            </>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "20px" }}>
          <OperationalChart
            title="Lead Time Variance"
            data={{
              labels: months,
              datasets: [{
                data: continuityData.leadTimeVariance.map(v => Number.parseFloat(v) || 0),
                backgroundColor: colors[0],
                borderColor: colors[0],
                borderWidth: 2,
              }]
            }}
            kpiKey="leadTimeVariance"
            isInvestorView={isInvestorView}
            onUpdate={(field, value) => updateContinuityData(field, value)}
            units="days"
            type="line"
            notes={continuityData.notes}
            analysis={continuityData.analysis}
          />

          <OperationalChart
            title="Stock Cover Days"
            data={{
              labels: months,
              datasets: [{
                data: continuityData.stockCoverDays.map(v => Number.parseFloat(v) || 0),
                backgroundColor: colors[1],
                borderColor: colors[1],
                borderWidth: 2,
              }]
            }}
            kpiKey="stockCoverDays"
            isInvestorView={isInvestorView}
            onUpdate={(field, value) => updateContinuityData(field, value)}
            units="days"
            type="bar"
          />

          <OperationalChart
            title="Disruption Risk Index"
            data={{
              labels: months,
              datasets: [{
                data: continuityData.disruptionRisk.map(v => Number.parseFloat(v) || 0),
                backgroundColor: colors[2],
                borderColor: colors[2],
                borderWidth: 2,
              }]
            }}
            kpiKey="disruptionRisk"
            isInvestorView={isInvestorView}
            onUpdate={(field, value) => updateContinuityData(field, value)}
            units="index"
            type="line"
          />
        </div>
      </div>
    )
  }

  if (activeSection !== "supply-chain") return null

  return (
    <div style={{ paddingTop: "20px" }}>
      {/* Sub-tabs */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "25px",
          padding: "10px",
          backgroundColor: "#fdfcfb",
          borderRadius: "8px",
          flexWrap: "wrap",
        }}
      >
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              padding: "10px 20px",
              backgroundColor: activeSubTab === tab.id ? "#5d4037" : "#e8ddd4",
              color: activeSubTab === tab.id ? "#fdfcfb" : "#5d4037",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              transition: "all 0.3s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-tab Content */}
      {activeSubTab === "supplier-dependency" && renderSupplierDependency()}
      {activeSubTab === "continuity-risk" && renderContinuityRisk()}

      {/* Add Data Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "30px",
              borderRadius: "8px",
              maxWidth: "800px",
              maxHeight: "90vh",
              overflow: "auto",
              width: "95%",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#5d4037" }}>
                {activeSubTab === "supplier-dependency" ? "Supplier Dependency Data" : "Continuity Risk Data"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  color: "#5d4037",
                  cursor: "pointer",
                  padding: "0",
                  lineHeight: "1",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                Data Date
              </label>
              <input
                type="date"
                value={dataDate}
                onChange={(e) => setDataDate(e.target.value)}
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                  color: "#5d4037",
                  width: "100%",
                  maxWidth: "200px",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "20px", marginBottom: "20px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                <span style={{ color: "#5d4037", fontSize: "14px" }}>Year:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number.parseInt(e.target.value))}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "4px",
                    border: "1px solid #e8ddd4",
                    fontSize: "14px",
                    color: "#5d4037",
                    minWidth: "100px",
                  }}
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                <span style={{ color: "#5d4037", fontSize: "14px" }}>Month:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "4px",
                    border: "1px solid #e8ddd4",
                    fontSize: "14px",
                    color: "#5d4037",
                    minWidth: "100px",
                  }}
                >
                  {months.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {activeSubTab === "supplier-dependency" ? (
              <div>
                <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>Supplier Dependency Metrics</h4>
                <div style={{ display: "grid", gap: "15px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                      Top 3 Supplier % for {selectedMonth} {selectedYear}
                    </label>
                    <input
                      type="number"
                      value={supplierData.top3SupplierPercent[monthIndex] || ""}
                      onChange={(e) => {
                        const newData = [...supplierData.top3SupplierPercent]
                        newData[monthIndex] = e.target.value
                        updateSupplierData("top3SupplierPercent", newData)
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                      Single Source Flags for {selectedMonth} {selectedYear}
                    </label>
                    <input
                      type="number"
                      value={supplierData.singleSourceFlags[monthIndex] || ""}
                      onChange={(e) => {
                        const newData = [...supplierData.singleSourceFlags]
                        newData[monthIndex] = e.target.value
                        updateSupplierData("singleSourceFlags", newData)
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                      Critical Supplier Count for {selectedMonth} {selectedYear}
                    </label>
                    <input
                      type="number"
                      value={supplierData.criticalSupplierCount[monthIndex] || ""}
                      onChange={(e) => {
                        const newData = [...supplierData.criticalSupplierCount]
                        newData[monthIndex] = e.target.value
                        updateSupplierData("criticalSupplierCount", newData)
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>Continuity Risk Metrics</h4>
                <div style={{ display: "grid", gap: "15px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                      Lead Time Variance (days) for {selectedMonth} {selectedYear}
                    </label>
                    <input
                      type="number"
                      value={continuityData.leadTimeVariance[monthIndex] || ""}
                      onChange={(e) => {
                        const newData = [...continuityData.leadTimeVariance]
                        newData[monthIndex] = e.target.value
                        updateContinuityData("leadTimeVariance", newData)
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                      Stock Cover Days for {selectedMonth} {selectedYear}
                    </label>
                    <input
                      type="number"
                      value={continuityData.stockCoverDays[monthIndex] || ""}
                      onChange={(e) => {
                        const newData = [...continuityData.stockCoverDays]
                        newData[monthIndex] = e.target.value
                        updateContinuityData("stockCoverDays", newData)
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                      Disruption Risk Index for {selectedMonth} {selectedYear}
                    </label>
                    <input
                      type="number"
                      value={continuityData.disruptionRisk[monthIndex] || ""}
                      onChange={(e) => {
                        const newData = [...continuityData.disruptionRisk]
                        newData[monthIndex] = e.target.value
                        updateContinuityData("disruptionRisk", newData)
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                Notes
              </label>
              <textarea
                value={activeSubTab === "supplier-dependency" ? supplierData.notes : continuityData.notes}
                onChange={(e) => {
                  if (activeSubTab === "supplier-dependency") {
                    updateSupplierData("notes", e.target.value)
                  } else {
                    updateContinuityData("notes", e.target.value)
                  }
                }}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  minHeight: "100px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e8ddd4",
                  color: "#5d4037",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveSupplyChainData}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                {loading ? "Saving..." : "Save Data"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add KPI Modal */}
      {showKPIAdd && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1001,
          }}
        >
          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "30px",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "95%",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#5d4037" }}>Add KPI Data</h3>
              <button
                onClick={() => setShowKPIAdd(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  color: "#5d4037",
                  cursor: "pointer",
                  padding: "0",
                  lineHeight: "1",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                View Mode
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setKpiViewMode("month")}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: kpiViewMode === "month" ? "#5d4037" : "#e8ddd4",
                    color: kpiViewMode === "month" ? "#fdfcfb" : "#5d4037",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "13px",
                    flex: 1,
                  }}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setKpiViewMode("quarter")}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: kpiViewMode === "quarter" ? "#5d4037" : "#e8ddd4",
                    color: kpiViewMode === "quarter" ? "#fdfcfb" : "#5d4037",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "13px",
                    flex: 1,
                  }}
                >
                  Quarterly
                </button>
                <button
                  onClick={() => setKpiViewMode("year")}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: kpiViewMode === "year" ? "#5d4037" : "#e8ddd4",
                    color: kpiViewMode === "year" ? "#fdfcfb" : "#5d4037",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "13px",
                    flex: 1,
                  }}
                >
                  Yearly
                </button>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                Data Date
              </label>
              <input
                type="date"
                value={dataDate}
                onChange={(e) => setDataDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                  color: "#5d4037",
                }}
              />
            </div>

            <div style={{ marginTop: "20px" }}>
              <p style={{ color: "#5d4037", fontSize: "14px", textAlign: "center" }}>
                Select "Add Data" to enter specific metric values for the selected period.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button
                onClick={() => setShowKPIAdd(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e8ddd4",
                  color: "#5d4037",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowKPIAdd(false)
                  setShowModal(true)
                }}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Add Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Delivery Component with Updated Charts
const Delivery = ({ activeSection, viewMode, user, isInvestorView }) => {
  const [activeSubTab, setActiveSubTab] = useState("productivity")
  const [showModal, setShowModal] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState("Jan")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [dataDate, setDataDate] = useState(new Date().toISOString().split('T')[0])
  const [showKPIAdd, setShowKPIAdd] = useState(false)
  const [kpiViewMode, setKpiViewMode] = useState("month")

  // Productivity Data
  const [productivityData, setProductivityData] = useState({
    volume: Array(12).fill(""),
    availability: Array(12).fill(""),
    utilization: Array(12).fill(""),
    unitCost: Array(12).fill(""),
    notes: "",
    analysis: "",
  })

  // Reliability Data
  const [reliabilityData, setReliabilityData] = useState({
    onTimeDelivery: Array(12).fill(""),
    reworkRate: Array(12).fill(""),
    defectRate: Array(12).fill(""),
    customerComplaints: Array(12).fill(""),
    notes: "",
    analysis: "",
  })

  const months = getMonthsForYear(selectedYear, kpiViewMode)
  const years = Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i)

  const subTabs = [
    { id: "productivity", label: "Productivity" },
    { id: "reliability", label: "Reliability" },
  ]

  useEffect(() => {
    if (user) {
      loadDeliveryData()
    }
  }, [user])

  useEffect(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.toLocaleString('default', { month: 'short' })
    setSelectedYear(year)
    setSelectedMonth(month)
    setDataDate(today.toISOString().split('T')[0])
  }, [])

  const loadDeliveryData = async () => {
    if (!user) return
    setLoading(true)
    try {
      // Load Productivity Data
      const productivityDoc = await getDoc(doc(db, "productivity", user.uid))
      if (productivityDoc.exists()) {
        const data = productivityDoc.data()
        setProductivityData({
          volume: data.volume || Array(12).fill(""),
          availability: data.availability || Array(12).fill(""),
          utilization: data.utilization || Array(12).fill(""),
          unitCost: data.unitCost || Array(12).fill(""),
          notes: data.notes || "",
          analysis: data.analysis || "",
        })
      }

      // Load Reliability Data
      const reliabilityDoc = await getDoc(doc(db, "reliability", user.uid))
      if (reliabilityDoc.exists()) {
        const data = reliabilityDoc.data()
        setReliabilityData({
          onTimeDelivery: data.onTimeDelivery || Array(12).fill(""),
          reworkRate: data.reworkRate || Array(12).fill(""),
          defectRate: data.defectRate || Array(12).fill(""),
          customerComplaints: data.customerComplaints || Array(12).fill(""),
          notes: data.notes || "",
          analysis: data.analysis || "",
        })
      }
    } catch (error) {
      console.error("Error loading delivery data:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveDeliveryData = async () => {
    if (!user) {
      alert("Please log in to save data")
      return
    }
    setLoading(true)
    try {
      // Save Productivity Data
      await setDoc(doc(db, "productivity", user.uid), {
        ...productivityData,
        userId: user.uid,
        lastUpdated: new Date().toISOString(),
        dataDate: dataDate,
      })

      // Save Reliability Data
      await setDoc(doc(db, "reliability", user.uid), {
        ...reliabilityData,
        userId: user.uid,
        lastUpdated: new Date().toISOString(),
        dataDate: dataDate,
      })

      setShowModal(false)
      alert("Data saved successfully!")
    } catch (error) {
      console.error("Error saving data:", error)
      alert("Error saving data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getMonthIndex = (month) => months.indexOf(month)
  const monthIndex = getMonthIndex(selectedMonth)

  const updateProductivityData = (field, value) => {
    setProductivityData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const updateReliabilityData = (field, value) => {
    setReliabilityData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const renderProductivity = () => {
    const colors = ["#1565c0", "#1976d2", "#2196f3", "#64b5f6"]
    
    return (
      <div>
        <KeyQuestionBox
          question="Can we deliver at scale? Can we deliver efficiently?"
          signals="Capacity, bottlenecks, saturation, unit cost of production"
          decisions="Hire, automate, slow sales"
          section="productivity"
        />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginBottom: "20px" }}>
          {!isInvestorView && (
            <>
              <button
                onClick={() => setShowKPIAdd(true)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#8d6e63",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "13px",
                }}
              >
                Add KPI
              </button>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "13px",
                }}
              >
                Add Data
              </button>
            </>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "20px" }}>
          <OperationalChart
            title="Production Volume"
            data={{
              labels: months,
              datasets: [{
                data: productivityData.volume.map(v => Number.parseFloat(v) || 0),
                backgroundColor: colors[0],
                borderColor: colors[0],
                borderWidth: 2,
              }]
            }}
            kpiKey="volume"
            isInvestorView={isInvestorView}
            onUpdate={(field, value) => updateProductivityData(field, value)}
            units="units"
            type="bar"
            notes={productivityData.notes}
            analysis={productivityData.analysis}
          />

          <OperationalChart
            title="Availability %"
            data={{
              labels: months,
              datasets: [{
                data: productivityData.availability.map(v => Number.parseFloat(v) || 0),
                backgroundColor: colors[1],
                borderColor: colors[1],
                borderWidth: 2,
              }]
            }}
            kpiKey="availability"
            isInvestorView={isInvestorView}
            onUpdate={(field, value) => updateProductivityData(field, value)}
            units="%"
            type="line"
          />

          <OperationalChart
            title="Utilization %"
            data={{
              labels: months,
              datasets: [{
                data: productivityData.utilization.map(v => Number.parseFloat(v) || 0),
                backgroundColor: colors[2],
                borderColor: colors[2],
                borderWidth: 2,
              }]
            }}
            kpiKey="utilization"
            isInvestorView={isInvestorView}
            onUpdate={(field, value) => updateProductivityData(field, value)}
            units="%"
            type="line"
          />

          <OperationalChart
            title="Unit Cost"
            data={{
              labels: months,
              datasets: [{
                data: productivityData.unitCost.map(v => Number.parseFloat(v) || 0),
                backgroundColor: colors[3],
                borderColor: colors[3],
                borderWidth: 2,
              }]
            }}
            kpiKey="unitCost"
            isInvestorView={isInvestorView}
            onUpdate={(field, value) => updateProductivityData(field, value)}
            units="R"
            type="bar"
          />
        </div>
      </div>
    )
  }

  const renderReliability = () => {
    const colors = ["#2e7d32", "#43a047", "#66bb6a", "#81c784"]
    
    return (
      <div>
        <KeyQuestionBox
          question="Is delivery consistent?"
          signals="Rework & failure"
          decisions="Improve processes"
          section="reliability"
        />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginBottom: "20px" }}>
          {!isInvestorView && (
            <>
              <button
                onClick={() => setShowKPIAdd(true)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#8d6e63",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "13px",
                }}
              >
                Add KPI
              </button>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "13px",
                }}
              >
                Add Data
              </button>
            </>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "20px" }}>
          <OperationalChart
            title="On-time Delivery %"
            data={{
              labels: months,
              datasets: [{
                data: reliabilityData.onTimeDelivery.map(v => Number.parseFloat(v) || 0),
                backgroundColor: colors[0],
                borderColor: colors[0],
                borderWidth: 2,
              }]
            }}
            kpiKey="onTimeDelivery"
            isInvestorView={isInvestorView}
            onUpdate={(field, value) => updateReliabilityData(field, value)}
            units="%"
            type="line"
            notes={reliabilityData.notes}
            analysis={reliabilityData.analysis}
          />

          <OperationalChart
            title="Rework Rate"
            data={{
              labels: months,
              datasets: [{
                data: reliabilityData.reworkRate.map(v => Number.parseFloat(v) || 0),
                backgroundColor: colors[1],
                borderColor: colors[1],
                borderWidth: 2,
              }]
            }}
            kpiKey="reworkRate"
            isInvestorView={isInvestorView}
            onUpdate={(field, value) => updateReliabilityData(field, value)}
            units="%"
            type="bar"
          />

          <OperationalChart
            title="Defect Rate"
            data={{
              labels: months,
              datasets: [{
                data: reliabilityData.defectRate.map(v => Number.parseFloat(v) || 0),
                backgroundColor: colors[2],
                borderColor: colors[2],
                borderWidth: 2,
              }]
            }}
            kpiKey="defectRate"
            isInvestorView={isInvestorView}
            onUpdate={(field, value) => updateReliabilityData(field, value)}
            units="%"
            type="bar"
          />

          <OperationalChart
            title="Customer Complaints"
            data={{
              labels: months,
              datasets: [{
                data: reliabilityData.customerComplaints.map(v => Number.parseFloat(v) || 0),
                backgroundColor: colors[3],
                borderColor: colors[3],
                borderWidth: 2,
              }]
            }}
            kpiKey="customerComplaints"
            isInvestorView={isInvestorView}
            onUpdate={(field, value) => updateReliabilityData(field, value)}
            units="#"
            type="line"
          />
        </div>
      </div>
    )
  }

  if (activeSection !== "delivery") return null

  return (
    <div style={{ paddingTop: "20px" }}>
      {/* Sub-tabs */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "25px",
          padding: "10px",
          backgroundColor: "#fdfcfb",
          borderRadius: "8px",
          flexWrap: "wrap",
        }}
      >
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              padding: "10px 20px",
              backgroundColor: activeSubTab === tab.id ? "#5d4037" : "#e8ddd4",
              color: activeSubTab === tab.id ? "#fdfcfb" : "#5d4037",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              transition: "all 0.3s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-tab Content */}
      {activeSubTab === "productivity" && renderProductivity()}
      {activeSubTab === "reliability" && renderReliability()}

      {/* Add Data Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "30px",
              borderRadius: "8px",
              maxWidth: "800px",
              maxHeight: "90vh",
              overflow: "auto",
              width: "95%",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#5d4037" }}>
                {activeSubTab === "productivity" ? "Productivity Data" : "Reliability Data"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  color: "#5d4037",
                  cursor: "pointer",
                  padding: "0",
                  lineHeight: "1",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                Data Date
              </label>
              <input
                type="date"
                value={dataDate}
                onChange={(e) => setDataDate(e.target.value)}
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                  color: "#5d4037",
                  width: "100%",
                  maxWidth: "200px",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "20px", marginBottom: "20px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                <span style={{ color: "#5d4037", fontSize: "14px" }}>Year:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number.parseInt(e.target.value))}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "4px",
                    border: "1px solid #e8ddd4",
                    fontSize: "14px",
                    color: "#5d4037",
                    minWidth: "100px",
                  }}
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                <span style={{ color: "#5d4037", fontSize: "14px" }}>Month:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "4px",
                    border: "1px solid #e8ddd4",
                    fontSize: "14px",
                    color: "#5d4037",
                    minWidth: "100px",
                  }}
                >
                  {months.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {activeSubTab === "productivity" ? (
              <div>
                <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>Productivity Metrics</h4>
                <div style={{ display: "grid", gap: "15px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                      Production Volume for {selectedMonth} {selectedYear}
                    </label>
                    <input
                      type="number"
                      value={productivityData.volume[monthIndex] || ""}
                      onChange={(e) => {
                        const newData = [...productivityData.volume]
                        newData[monthIndex] = e.target.value
                        updateProductivityData("volume", newData)
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                      Availability % for {selectedMonth} {selectedYear}
                    </label>
                    <input
                      type="number"
                      value={productivityData.availability[monthIndex] || ""}
                      onChange={(e) => {
                        const newData = [...productivityData.availability]
                        newData[monthIndex] = e.target.value
                        updateProductivityData("availability", newData)
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                      Utilization % for {selectedMonth} {selectedYear}
                    </label>
                    <input
                      type="number"
                      value={productivityData.utilization[monthIndex] || ""}
                      onChange={(e) => {
                        const newData = [...productivityData.utilization]
                        newData[monthIndex] = e.target.value
                        updateProductivityData("utilization", newData)
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                      Unit Cost (R) for {selectedMonth} {selectedYear}
                    </label>
                    <input
                      type="number"
                      value={productivityData.unitCost[monthIndex] || ""}
                      onChange={(e) => {
                        const newData = [...productivityData.unitCost]
                        newData[monthIndex] = e.target.value
                        updateProductivityData("unitCost", newData)
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>Reliability Metrics</h4>
                <div style={{ display: "grid", gap: "15px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                      On-time Delivery % for {selectedMonth} {selectedYear}
                    </label>
                    <input
                      type="number"
                      value={reliabilityData.onTimeDelivery[monthIndex] || ""}
                      onChange={(e) => {
                        const newData = [...reliabilityData.onTimeDelivery]
                        newData[monthIndex] = e.target.value
                        updateReliabilityData("onTimeDelivery", newData)
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                      Rework Rate % for {selectedMonth} {selectedYear}
                    </label>
                    <input
                      type="number"
                      value={reliabilityData.reworkRate[monthIndex] || ""}
                      onChange={(e) => {
                        const newData = [...reliabilityData.reworkRate]
                        newData[monthIndex] = e.target.value
                        updateReliabilityData("reworkRate", newData)
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                      Defect Rate % for {selectedMonth} {selectedYear}
                    </label>
                    <input
                      type="number"
                      value={reliabilityData.defectRate[monthIndex] || ""}
                      onChange={(e) => {
                        const newData = [...reliabilityData.defectRate]
                        newData[monthIndex] = e.target.value
                        updateReliabilityData("defectRate", newData)
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                      Customer Complaints for {selectedMonth} {selectedYear}
                    </label>
                    <input
                      type="number"
                      value={reliabilityData.customerComplaints[monthIndex] || ""}
                      onChange={(e) => {
                        const newData = [...reliabilityData.customerComplaints]
                        newData[monthIndex] = e.target.value
                        updateReliabilityData("customerComplaints", newData)
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                Notes
              </label>
              <textarea
                value={activeSubTab === "productivity" ? productivityData.notes : reliabilityData.notes}
                onChange={(e) => {
                  if (activeSubTab === "productivity") {
                    updateProductivityData("notes", e.target.value)
                  } else {
                    updateReliabilityData("notes", e.target.value)
                  }
                }}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  minHeight: "100px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e8ddd4",
                  color: "#5d4037",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveDeliveryData}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                {loading ? "Saving..." : "Save Data"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add KPI Modal */}
      {showKPIAdd && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1001,
          }}
        >
          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "30px",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "95%",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#5d4037" }}>Add KPI Data</h3>
              <button
                onClick={() => setShowKPIAdd(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  color: "#5d4037",
                  cursor: "pointer",
                  padding: "0",
                  lineHeight: "1",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                View Mode
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setKpiViewMode("month")}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: kpiViewMode === "month" ? "#5d4037" : "#e8ddd4",
                    color: kpiViewMode === "month" ? "#fdfcfb" : "#5d4037",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "13px",
                    flex: 1,
                  }}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setKpiViewMode("quarter")}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: kpiViewMode === "quarter" ? "#5d4037" : "#e8ddd4",
                    color: kpiViewMode === "quarter" ? "#fdfcfb" : "#5d4037",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "13px",
                    flex: 1,
                  }}
                >
                  Quarterly
                </button>
                <button
                  onClick={() => setKpiViewMode("year")}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: kpiViewMode === "year" ? "#5d4037" : "#e8ddd4",
                    color: kpiViewMode === "year" ? "#fdfcfb" : "#5d4037",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "13px",
                    flex: 1,
                  }}
                >
                  Yearly
                </button>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                Data Date
              </label>
              <input
                type="date"
                value={dataDate}
                onChange={(e) => setDataDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                  color: "#5d4037",
                }}
              />
            </div>

            <div style={{ marginTop: "20px" }}>
              <p style={{ color: "#5d4037", fontSize: "14px", textAlign: "center" }}>
                Select "Add Data" to enter specific metric values for the selected period.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button
                onClick={() => setShowKPIAdd(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e8ddd4",
                  color: "#5d4037",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowKPIAdd(false)
                  setShowModal(true)
                }}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Add Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Safety Component with Updated Charts
const Safety = ({ activeSection, viewMode, user, isInvestorView }) => {
  const [activeSubTab, setActiveSubTab] = useState("safety-risk")
  const [showModal, setShowModal] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState("Jan")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [dataDate, setDataDate] = useState(new Date().toISOString().split('T')[0])
  const [showKPIAdd, setShowKPIAdd] = useState(false)
  const [kpiViewMode, setKpiViewMode] = useState("month")

  // Safety Risk Data
  const [safetyRiskData, setSafetyRiskData] = useState({
    safetyIncidents: Array(12).fill(""),
    openActions: Array(12).fill(""),
    complianceStatus: Array(12).fill(""),
    incidentSeverity: Array(12).fill(""),
    notes: "",
    analysis: "",
  })

  // Compliance Data
  const [complianceData, setComplianceData] = useState({
    regulatoryGaps: Array(12).fill(""),
    auditFindings: Array(12).fill(""),
    certificationStatus: Array(12).fill(""),
    correctiveActions: Array(12).fill(""),
    notes: "",
    analysis: "",
  })

  const months = getMonthsForYear(selectedYear, kpiViewMode)
  const years = Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i)

  const subTabs = [
    { id: "safety-risk", label: "Safety Risk" },
    { id: "compliance", label: "Compliance" },
  ]

  useEffect(() => {
    if (user) {
      loadSafetyData()
    }
  }, [user])

  useEffect(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.toLocaleString('default', { month: 'short' })
    setSelectedYear(year)
    setSelectedMonth(month)
    setDataDate(today.toISOString().split('T')[0])
  }, [])

  const loadSafetyData = async () => {
    if (!user) return
    setLoading(true)
    try {
      // Load Safety Risk Data
      const safetyRiskDoc = await getDoc(doc(db, "safetyRisk", user.uid))
      if (safetyRiskDoc.exists()) {
        const data = safetyRiskDoc.data()
        setSafetyRiskData({
          safetyIncidents: data.safetyIncidents || Array(12).fill(""),
          openActions: data.openActions || Array(12).fill(""),
          complianceStatus: data.complianceStatus || Array(12).fill(""),
          incidentSeverity: data.incidentSeverity || Array(12).fill(""),
          notes: data.notes || "",
          analysis: data.analysis || "",
        })
      }

      // Load Compliance Data
      const complianceDoc = await getDoc(doc(db, "compliance", user.uid))
      if (complianceDoc.exists()) {
        const data = complianceDoc.data()
        setComplianceData({
          regulatoryGaps: data.regulatoryGaps || Array(12).fill(""),
          auditFindings: data.auditFindings || Array(12).fill(""),
          certificationStatus: data.certificationStatus || Array(12).fill(""),
          correctiveActions: data.correctiveActions || Array(12).fill(""),
          notes: data.notes || "",
          analysis: data.analysis || "",
        })
      }
    } catch (error) {
      console.error("Error loading safety data:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveSafetyData = async () => {
    if (!user) {
      alert("Please log in to save data")
      return
    }
    setLoading(true)
    try {
      // Save Safety Risk Data
      await setDoc(doc(db, "safetyRisk", user.uid), {
        ...safetyRiskData,
        userId: user.uid,
        lastUpdated: new Date().toISOString(),
        dataDate: dataDate,
      })

      // Save Compliance Data
      await setDoc(doc(db, "compliance", user.uid), {
        ...complianceData,
        userId: user.uid,
        lastUpdated: new Date().toISOString(),
        dataDate: dataDate,
      })

      setShowModal(false)
      alert("Data saved successfully!")
    } catch (error) {
      console.error("Error saving data:", error)
      alert("Error saving data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getMonthIndex = (month) => months.indexOf(month)
  const monthIndex = getMonthIndex(selectedMonth)

  const updateSafetyRiskData = (field, value) => {
    setSafetyRiskData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const updateComplianceData = (field, value) => {
    setComplianceData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const renderSafetyRisk = () => {
    const colors = ["#d32f2f", "#f44336", "#ef5350", "#e57373"]
    
    return (
      <div>
        <KeyQuestionBox
          question="Does safety threaten licence to operate?"
          signals="Incidents and incident severity"
          decisions="Halt ops, invest in safety"
          section="safety-risk"
        />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginBottom: "20px" }}>
          {!isInvestorView && (
            <>
              <button
                onClick={() => setShowKPIAdd(true)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#8d6e63",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "13px",
                }}
              >
                Add KPI
              </button>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "13px",
                }}
              >
                Add Data
              </button>
            </>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "20px" }}>
          <OperationalChart
            title="Safety Incidents"
            data={{
              labels: months,
              datasets: [{
                data: safetyRiskData.safetyIncidents.map(v => Number.parseFloat(v) || 0),
                backgroundColor: colors[0],
                borderColor: colors[0],
                borderWidth: 2,
              }]
            }}
            kpiKey="safetyIncidents"
            isInvestorView={isInvestorView}
            onUpdate={(field, value) => updateSafetyRiskData(field, value)}
            units="#"
            type="bar"
            notes={safetyRiskData.notes}
            analysis={safetyRiskData.analysis}
          />

          <OperationalChart
            title="Open Safety Actions"
            data={{
              labels: months,
              datasets: [{
                data: safetyRiskData.openActions.map(v => Number.parseFloat(v) || 0),
                backgroundColor: colors[1],
                borderColor: colors[1],
                borderWidth: 2,
              }]
            }}
            kpiKey="openActions"
            isInvestorView={isInvestorView}
            onUpdate={(field, value) => updateSafetyRiskData(field, value)}
            units="#"
            type="bar"
          />

          <OperationalChart
            title="Compliance Status %"
            data={{
              labels: months,
              datasets: [{
                data: safetyRiskData.complianceStatus.map(v => Number.parseFloat(v) || 0),
                backgroundColor: colors[2],
                borderColor: colors[2],
                borderWidth: 2,
              }]
            }}
            kpiKey="complianceStatus"
            isInvestorView={isInvestorView}
            onUpdate={(field, value) => updateSafetyRiskData(field, value)}
            units="%"
            type="line"
          />
        </div>
      </div>
    )
  }

  const renderCompliance = () => {
    const colors = ["#7b1fa2", "#9c27b0", "#ab47bc", "#ba68c8"]
    
    return (
      <div>
        <KeyQuestionBox
          question="Are we exposed legally?"
          signals="Regulatory gaps"
          decisions="Fix compliance gaps"
          section="compliance"
        />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginBottom: "20px" }}>
          {!isInvestorView && (
            <>
              <button
                onClick={() => setShowKPIAdd(true)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#8d6e63",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "13px",
                }}
              >
                Add KPI
              </button>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "13px",
                }}
              >
                Add Data
              </button>
            </>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "20px" }}>
          <OperationalChart
            title="Regulatory Gaps"
            data={{
              labels: months,
              datasets: [{
                data: complianceData.regulatoryGaps.map(v => Number.parseFloat(v) || 0),
                backgroundColor: colors[0],
                borderColor: colors[0],
                borderWidth: 2,
              }]
            }}
            kpiKey="regulatoryGaps"
            isInvestorView={isInvestorView}
            onUpdate={(field, value) => updateComplianceData(field, value)}
            units="#"
            type="bar"
            notes={complianceData.notes}
            analysis={complianceData.analysis}
          />

          <OperationalChart
            title="Audit Findings"
            data={{
              labels: months,
              datasets: [{
                data: complianceData.auditFindings.map(v => Number.parseFloat(v) || 0),
                backgroundColor: colors[1],
                borderColor: colors[1],
                borderWidth: 2,
              }]
            }}
            kpiKey="auditFindings"
            isInvestorView={isInvestorView}
            onUpdate={(field, value) => updateComplianceData(field, value)}
            units="#"
            type="bar"
          />

          <OperationalChart
            title="Certification Status %"
            data={{
              labels: months,
              datasets: [{
                data: complianceData.certificationStatus.map(v => Number.parseFloat(v) || 0),
                backgroundColor: colors[2],
                borderColor: colors[2],
                borderWidth: 2,
              }]
            }}
            kpiKey="certificationStatus"
            isInvestorView={isInvestorView}
            onUpdate={(field, value) => updateComplianceData(field, value)}
            units="%"
            type="line"
          />
        </div>
      </div>
    )
  }

  if (activeSection !== "safety") return null

  return (
    <div style={{ paddingTop: "20px" }}>
      {/* Sub-tabs */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "25px",
          padding: "10px",
          backgroundColor: "#fdfcfb",
          borderRadius: "8px",
          flexWrap: "wrap",
        }}
      >
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              padding: "10px 20px",
              backgroundColor: activeSubTab === tab.id ? "#5d4037" : "#e8ddd4",
              color: activeSubTab === tab.id ? "#fdfcfb" : "#5d4037",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              transition: "all 0.3s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-tab Content */}
      {activeSubTab === "safety-risk" && renderSafetyRisk()}
      {activeSubTab === "compliance" && renderCompliance()}

      {/* Add Data Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "30px",
              borderRadius: "8px",
              maxWidth: "800px",
              maxHeight: "90vh",
              overflow: "auto",
              width: "95%",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#5d4037" }}>
                {activeSubTab === "safety-risk" ? "Safety Risk Data" : "Compliance Data"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  color: "#5d4037",
                  cursor: "pointer",
                  padding: "0",
                  lineHeight: "1",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                Data Date
              </label>
              <input
                type="date"
                value={dataDate}
                onChange={(e) => setDataDate(e.target.value)}
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                  color: "#5d4037",
                  width: "100%",
                  maxWidth: "200px",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "20px", marginBottom: "20px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                <span style={{ color: "#5d4037", fontSize: "14px" }}>Year:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number.parseInt(e.target.value))}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "4px",
                    border: "1px solid #e8ddd4",
                    fontSize: "14px",
                    color: "#5d4037",
                    minWidth: "100px",
                  }}
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                <span style={{ color: "#5d4037", fontSize: "14px" }}>Month:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "4px",
                    border: "1px solid #e8ddd4",
                    fontSize: "14px",
                    color: "#5d4037",
                    minWidth: "100px",
                  }}
                >
                  {months.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {activeSubTab === "safety-risk" ? (
              <div>
                <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>Safety Risk Metrics</h4>
                <div style={{ display: "grid", gap: "15px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                      Safety Incidents for {selectedMonth} {selectedYear}
                    </label>
                    <input
                      type="number"
                      value={safetyRiskData.safetyIncidents[monthIndex] || ""}
                      onChange={(e) => {
                        const newData = [...safetyRiskData.safetyIncidents]
                        newData[monthIndex] = e.target.value
                        updateSafetyRiskData("safetyIncidents", newData)
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                      Open Safety Actions for {selectedMonth} {selectedYear}
                    </label>
                    <input
                      type="number"
                      value={safetyRiskData.openActions[monthIndex] || ""}
                      onChange={(e) => {
                        const newData = [...safetyRiskData.openActions]
                        newData[monthIndex] = e.target.value
                        updateSafetyRiskData("openActions", newData)
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                      Compliance Status % for {selectedMonth} {selectedYear}
                    </label>
                    <input
                      type="number"
                      value={safetyRiskData.complianceStatus[monthIndex] || ""}
                      onChange={(e) => {
                        const newData = [...safetyRiskData.complianceStatus]
                        newData[monthIndex] = e.target.value
                        updateSafetyRiskData("complianceStatus", newData)
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>Compliance Metrics</h4>
                <div style={{ display: "grid", gap: "15px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                      Regulatory Gaps for {selectedMonth} {selectedYear}
                    </label>
                    <input
                      type="number"
                      value={complianceData.regulatoryGaps[monthIndex] || ""}
                      onChange={(e) => {
                        const newData = [...complianceData.regulatoryGaps]
                        newData[monthIndex] = e.target.value
                        updateComplianceData("regulatoryGaps", newData)
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                      Audit Findings for {selectedMonth} {selectedYear}
                    </label>
                    <input
                      type="number"
                      value={complianceData.auditFindings[monthIndex] || ""}
                      onChange={(e) => {
                        const newData = [...complianceData.auditFindings]
                        newData[monthIndex] = e.target.value
                        updateComplianceData("auditFindings", newData)
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                      Certification Status % for {selectedMonth} {selectedYear}
                    </label>
                    <input
                      type="number"
                      value={complianceData.certificationStatus[monthIndex] || ""}
                      onChange={(e) => {
                        const newData = [...complianceData.certificationStatus]
                        newData[monthIndex] = e.target.value
                        updateComplianceData("certificationStatus", newData)
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                Notes
              </label>
              <textarea
                value={activeSubTab === "safety-risk" ? safetyRiskData.notes : complianceData.notes}
                onChange={(e) => {
                  if (activeSubTab === "safety-risk") {
                    updateSafetyRiskData("notes", e.target.value)
                  } else {
                    updateComplianceData("notes", e.target.value)
                  }
                }}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  minHeight: "100px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e8ddd4",
                  color: "#5d4037",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveSafetyData}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                {loading ? "Saving..." : "Save Data"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add KPI Modal */}
      {showKPIAdd && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1001,
          }}
        >
          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "30px",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "95%",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#5d4037" }}>Add KPI Data</h3>
              <button
                onClick={() => setShowKPIAdd(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  color: "#5d4037",
                  cursor: "pointer",
                  padding: "0",
                  lineHeight: "1",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                View Mode
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setKpiViewMode("month")}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: kpiViewMode === "month" ? "#5d4037" : "#e8ddd4",
                    color: kpiViewMode === "month" ? "#fdfcfb" : "#5d4037",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "13px",
                    flex: 1,
                  }}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setKpiViewMode("quarter")}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: kpiViewMode === "quarter" ? "#5d4037" : "#e8ddd4",
                    color: kpiViewMode === "quarter" ? "#fdfcfb" : "#5d4037",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "13px",
                    flex: 1,
                  }}
                >
                  Quarterly
                </button>
                <button
                  onClick={() => setKpiViewMode("year")}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: kpiViewMode === "year" ? "#5d4037" : "#e8ddd4",
                    color: kpiViewMode === "year" ? "#fdfcfb" : "#5d4037",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "13px",
                    flex: 1,
                  }}
                >
                  Yearly
                </button>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                Data Date
              </label>
              <input
                type="date"
                value={dataDate}
                onChange={(e) => setDataDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                  color: "#5d4037",
                }}
              />
            </div>

            <div style={{ marginTop: "20px" }}>
              <p style={{ color: "#5d4037", fontSize: "14px", textAlign: "center" }}>
                Select "Add Data" to enter specific metric values for the selected period.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button
                onClick={() => setShowKPIAdd(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e8ddd4",
                  color: "#5d4037",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowKPIAdd(false)
                  setShowModal(true)
                }}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Add Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Main Operational Performance Component
const OperationalPerformance = () => {
  const [activeSection, setActiveSection] = useState("kpi-dashboard")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [user, setUser] = useState(null)
  const [showFullDescription, setShowFullDescription] = useState(false)

  const [isInvestorView, setIsInvestorView] = useState(false)
  const [viewingSMEId, setViewingSMEId] = useState(null)
  const [viewingSMEName, setViewingSMEName] = useState("")

  useEffect(() => {
    const investorViewMode = sessionStorage.getItem("investorViewMode")
    const smeId = sessionStorage.getItem("viewingSMEId")
    const smeName = sessionStorage.getItem("viewingSMEName")

    if (investorViewMode === "true" && smeId) {
      setIsInvestorView(true)
      setViewingSMEId(smeId)
      setViewingSMEName(smeName || "SME")
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (isInvestorView && viewingSMEId) {
        setUser({ uid: viewingSMEId })
      } else {
        setUser(currentUser)
      }
    })

    return () => unsubscribe()
  }, [isInvestorView, viewingSMEId])

  useEffect(() => {
    const checkSidebarState = () => {
      setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"))
    }

    checkSidebarState()

    const observer = new MutationObserver(checkSidebarState)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  const handleExitInvestorView = () => {
    sessionStorage.removeItem("viewingSMEId")
    sessionStorage.removeItem("viewingSMEName")
    sessionStorage.removeItem("investorViewMode")
    window.location.href = "/my-cohorts"
  }

  const getContentStyles = () => ({
    width: "100%",
    marginLeft: "0",
    backgroundColor: "#f7f3f0",
    minHeight: "100vh",
    padding: `70px 20px 20px ${isSidebarCollapsed ? "100px" : "270px"}`,
    transition: "padding 0.3s ease",
    boxSizing: "border-box",
  })

  const sectionButtons = [
    { id: "kpi-dashboard", label: "KPI Dashboard" },
    { id: "supply-chain", label: "Supply Chain" },
    { id: "delivery", label: "Delivery" },
    { id: "safety", label: "Safety" },
  ]

  const handleCategoryClick = (sectionId) => {
    setActiveSection(sectionId)
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      <div style={getContentStyles()}>
        <Header />

        {isInvestorView && (
          <div
            style={{
              backgroundColor: "#e8f5e9",
              padding: "16px 20px",
              margin: "50px 0 20px 0",
              borderRadius: "8px",
              border: "2px solid #4caf50",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "20px" }}>👁️</span>
              <span style={{ color: "#2e7d32", fontWeight: "600", fontSize: "15px" }}>
                Investor View: Viewing {viewingSMEName}'s Operational Performance
              </span>
            </div>
            <button
              onClick={handleExitInvestorView}
              style={{
                padding: "8px 16px",
                backgroundColor: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                transition: "background-color 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#45a049"
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#4caf50"
              }}
            >
              Back to My Cohorts
            </button>
          </div>
        )}

    <div style={{ padding: "20px", paddingTop: "40px", marginLeft: "20px" }}>
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
    <h1 style={{ color: "#5d4037", fontSize: "32px", fontWeight: "700", margin: 0 }}>
      Operational Performance
    </h1>
    
    <button
      onClick={() => setShowFullDescription(!showFullDescription)}
      style={{
        padding: "8px 16px",
        backgroundColor: "#7d5a50",
        color: "#fdfcfb",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "13px",
        whiteSpace: "nowrap",
      }}
    >
      {showFullDescription ? "See less" : "See more"}
    </button>
  </div>

  {/* Operational Performance Description */}
  {showFullDescription && (
    <div
      style={{
        backgroundColor: "#fdfcfb",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        marginBottom: "30px",
      }}
    >
      <div style={{ padding: "50px", paddingTop: "100px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "-80px" }}>
          <div>
            <h3 style={{ color: "#7d5a50", marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>
              What this dashboard DOES
            </h3>
            <ul style={{ color: "#4a352f", fontSize: "14px", lineHeight: "1.7", margin: 0, paddingLeft: "20px" }}>
              <li>Assesses delivery confidence and operational risk</li>
              <li>Evaluates supply chain resilience and continuity risk</li>
              <li>Monitors safety compliance and operational license maintenance</li>
              <li>Measures productivity and delivery reliability</li>
              <li>Tracks supplier dependency and supply chain vulnerabilities</li>
            </ul>
          </div>

          <div>
            <h3 style={{ color: "#7d5a50", marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>
              What this dashboard does NOT do
            </h3>
            <ul style={{ color: "#4a352f", fontSize: "14px", lineHeight: "1.7", margin: 0, paddingLeft: "20px" }}>
              <li>Manage workflows or task tracking</li>
              <li>Replace ERP/MES systems</li>
              <li>Operational transaction processing</li>
              <li>Detailed project management</li>
              <li>Real-time process control</li>
            </ul>
          </div>
        </div>

        <div style={{ marginTop: "30px", paddingTop: "20px", borderTop: "1px solid #e8ddd4" }}>
          <h3 style={{ color: "#7d5a50", marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>
            Key Operational Dimensions
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
            <div>
              <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
                Supply Chain
              </h4>
              <p style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
                Evaluate supplier dependency and continuity risk to ensure supply chain resilience
              </p>
            </div>
            <div>
              <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
                Delivery
              </h4>
              <p style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
                Assess productivity and reliability to ensure efficient and consistent delivery performance
              </p>
            </div>
            <div>
              <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
                Safety
              </h4>
              <p style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
                Monitor safety risks and compliance to maintain operational license and legal compliance
              </p>
            </div>
          </div>
          <p style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6", marginTop: "15px" }}>
            Each section provides key metrics, signals, and decision points to help you make informed strategic choices about your business's operational future.
          </p>
        </div>
      </div>
    </div>
  )}
</div>

        {/* Main Tab Buttons */}
        <div
          style={{
            display: "flex",
            gap: "15px",
            marginBottom: "30px",
            padding: "15px",
            backgroundColor: "#fdfcfb",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            flexWrap: "wrap",
          }}
        >
          {sectionButtons.map((button) => (
            <button
              key={button.id}
              onClick={() => setActiveSection(button.id)}
              style={{
                padding: "12px 24px",
                backgroundColor: activeSection === button.id ? "#5d4037" : "#e8ddd4",
                color: activeSection === button.id ? "#fdfcfb" : "#5d4037",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "15px",
                transition: "all 0.3s ease",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                minWidth: "180px",
                textAlign: "center",
              }}
            >
              {button.label}
            </button>
          ))}
        </div>

        {activeSection === "kpi-dashboard" && (
          <KPIDashboard
            activeSection={activeSection}
            isInvestorView={isInvestorView}
            onCategoryClick={handleCategoryClick}
            viewingSMEId={viewingSMEId}
          />
        )}

        {activeSection === "supply-chain" && (
          <SupplyChain
            activeSection={activeSection}
            viewMode="month"
            user={user}
            isInvestorView={isInvestorView}
          />
        )}

        {activeSection === "delivery" && (
          <Delivery
            activeSection={activeSection}
            viewMode="month"
            user={user}
            isInvestorView={isInvestorView}
          />
        )}

        {activeSection === "safety" && (
          <Safety
            activeSection={activeSection}
            viewMode="month"
            user={user}
            isInvestorView={isInvestorView}
          />
        )}
      </div>
    </div>
  )
}

export default OperationalPerformance