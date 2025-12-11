"use client"

import { useState, useEffect } from "react"
import { Bar, Line } from "react-chartjs-2"
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

// Status indicator component
const StatusIndicator = ({ variance, target }) => {
  let emoji = "😐"
  let color = "#FFC107"
  
  const threshold = Math.max(Math.abs(target) * 0.1, 0.5)
  
  if (variance >= 0) {
    if (Math.abs(variance) <= threshold) {
      emoji = "😐"
      color = "#FFC107"
    } else {
      emoji = "😊"
      color = "#4CAF50"
    }
  } else {
    if (Math.abs(variance) <= threshold) {
      emoji = "😐"
      color = "#FFC107"
    } else {
      emoji = "☹️"
      color = "#F44336"
    }
  }

  return (
    <div
      style={{
        backgroundColor: color,
        padding: "4px 8px",
        borderRadius: "4px",
        textAlign: "center",
        fontSize: "18px",
      }}
    >
      {emoji}
    </div>
  )
}

// Helper function to get financial year months
const getFinancialYearMonths = (financialYearStartMonth) => {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const startMonthIndex = financialYearStartMonth - 1 // Convert to 0-indexed
  const months = []
  
  for (let i = 0; i < 12; i++) {
    const monthIndex = (startMonthIndex + i) % 12
    months.push(monthNames[monthIndex])
  }
  
  return months
}

// Helper function to get current month index in financial year
const getCurrentMonthIndex = (financialYearStartMonth) => {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1 // 1-1
    
  let monthIndex
  if (currentMonth >= financialYearStartMonth) {
    monthIndex = currentMonth - financialYearStartMonth
  } else {
    monthIndex = (12 - financialYearStartMonth) + currentMonth
  }
  
  // Cap at 11 (0-indexed) for display purposes
  return Math.min(monthIndex, 11)
}

// KPI Dashboard Component
const KPIDashboard = ({ activeSection, isInvestorView, allData, onCategoryClick, financialYearStartMonth }) => {
  const [financialYearMonths, setFinancialYearMonths] = useState([])
  const [currentMonthIndex, setCurrentMonthIndex] = useState(5) // Default to 6th month (0-indexed 5)

  useEffect(() => {
    if (financialYearStartMonth) {
      const months = getFinancialYearMonths(financialYearStartMonth)
      setFinancialYearMonths(months)
      setCurrentMonthIndex(getCurrentMonthIndex(financialYearStartMonth))
    }
  }, [financialYearStartMonth])

  const formatValue = (value, decimals = 0) => {
    if (value === null || value === undefined) return "0"
    return Number(value).toFixed(decimals)
  }

  const calculateVariance = (target, actual) => {
    return actual - target
  }

  // Build KPI rows from all data sources
  const buildKPIRows = () => {
    const rows = []

    // Productivity Category
    if (allData.productivity) {
      const productivityValue = allData.productivity.productivityData?.[currentMonthIndex] || 0
      const efficiencyValue = allData.productivity.efficiencyData?.[currentMonthIndex] || 0
      
      // Calculate YTD (average of all months up to current month)
      const ytdProdAvg = allData.productivity.productivityData?.slice(0, currentMonthIndex + 1).reduce((a, b) => a + b, 0) / (currentMonthIndex + 1) || 0
      const ytdEffAvg = allData.productivity.efficiencyData?.slice(0, currentMonthIndex + 1).reduce((a, b) => a + b, 0) / (currentMonthIndex + 1) || 0

      rows.push({
        category: "Productivity",
        kpi: "Productivity Index",
        units: "index",
        thisMonthTarget: 75,
        thisMonthActual: productivityValue,
        ytdTarget: 75,
        ytdActual: ytdProdAvg,
      })
      rows.push({
        category: "Productivity",
        kpi: "Efficiency Ratio",
        units: "%",
        thisMonthTarget: 80,
        thisMonthActual: efficiencyValue,
        ytdTarget: 80,
        ytdActual: ytdEffAvg,
      })
    }

    // Unit Cost Category
    if (allData.unitCost?.products) {
      allData.unitCost.products.forEach(product => {
        const margin = product.price > 0 ? ((product.price - product.cost) / product.price) * 100 : 0
        rows.push({
          category: "Unit Cost",
          kpi: `${product.name} - Cost`,
          units: "R",
          thisMonthTarget: product.cost * 0.95,
          thisMonthActual: product.cost,
          ytdTarget: product.cost * 0.95,
          ytdActual: product.cost,
        })
        rows.push({
          category: "Unit Cost",
          kpi: `${product.name} - Margin`,
          units: "%",
          thisMonthTarget: 30,
          thisMonthActual: margin,
          ytdTarget: 30,
          ytdActual: margin,
        })
      })
    }

    // Order Fulfillment Category
    if (allData.orderFulfillment?.metrics) {
      allData.orderFulfillment.metrics.forEach(metric => {
        rows.push({
          category: "Order Fulfillment",
          kpi: metric.name,
          units: "%",
          thisMonthTarget: metric.target,
          thisMonthActual: metric.value,
          ytdTarget: metric.target,
          ytdActual: metric.value,
        })
      })
    }

    // Tech Stack Category
    if (allData.techStack?.systems) {
      allData.techStack.systems.forEach(system => {
        rows.push({
          category: "Tech Stack",
          kpi: `${system.name} - Adoption`,
          units: "%",
          thisMonthTarget: 90,
          thisMonthActual: system.adoption,
          ytdTarget: 90,
          ytdActual: system.adoption,
        })
        rows.push({
          category: "Tech Stack",
          kpi: `${system.name} - Users`,
          units: "#",
          thisMonthTarget: 100,
          thisMonthActual: system.users,
          ytdTarget: 100,
          ytdActual: system.users,
        })
      })
    }

    // Process Automation Category
    if (allData.processAutomation?.processes) {
      allData.processAutomation.processes.forEach(process => {
        rows.push({
          category: "Process Automation",
          kpi: process.name,
          units: "%",
          thisMonthTarget: 80,
          thisMonthActual: process.automation,
          ytdTarget: 80,
          ytdActual: process.automation,
        })
      })
    }

    // Customer Retention Category
    if (allData.customerRetention) {
      const retentionValue = allData.customerRetention.retentionData?.[currentMonthIndex] || 0
      const churnValue = allData.customerRetention.churnData?.[currentMonthIndex] || 0
      
      const ytdRetAvg = allData.customerRetention.retentionData?.slice(0, currentMonthIndex + 1).reduce((a, b) => a + b, 0) / (currentMonthIndex + 1) || 0
      const ytdChurnAvg = allData.customerRetention.churnData?.slice(0, currentMonthIndex + 1).reduce((a, b) => a + b, 0) / (currentMonthIndex + 1) || 0

      rows.push({
        category: "Customer Retention",
        kpi: "Retention Rate",
        units: "%",
        thisMonthTarget: 85,
        thisMonthActual: retentionValue,
        ytdTarget: 85,
        ytdActual: ytdRetAvg,
      })
      rows.push({
        category: "Customer Retention",
        kpi: "Churn Rate",
        units: "%",
        thisMonthTarget: 15,
        thisMonthActual: churnValue,
        ytdTarget: 15,
        ytdActual: ytdChurnAvg,
      })
    }

    // Custom KPIs
    if (allData.customKPIs) {
      allData.customKPIs.forEach(kpi => {
        rows.push({
          category: "Custom KPIs",
          kpi: kpi.name,
          units: kpi.units || "",
          thisMonthTarget: kpi.target || 0,
          thisMonthActual: kpi.actual || 0,
          ytdTarget: kpi.target || 0,
          ytdActual: kpi.actual || 0,
        })
      })
    }

    return rows
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

  const handleDownloadCSV = () => {
    const headers = ["Category", "KPI", "Units of Measure", "This Month Target", "This Month Actual", "This Month Var.", "YTD Target", "YTD Actual", "YTD Var."]
    const rows = []

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
    a.download = `kpi-dashboard.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCategoryClick = (category) => {
    if (onCategoryClick) {
      const sectionMap = {
        "Productivity": "productivity",
        "Unit Cost": "unit-cost",
        "Order Fulfillment": "order-fulfillment",
        "Tech Stack": "tech-stack",
        "Process Automation": "process-automation",
        "Customer Retention": "customer-retention",
        "Custom KPIs": "custom-kpis"
      }
      onCategoryClick(sectionMap[category] || category.toLowerCase())
    }
  }

  if (activeSection !== "kpi-dashboard") return null

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const financialYearStartMonthName = monthNames[financialYearStartMonth - 1]

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
            Financial Year starts in {financialYearStartMonthName}
          </p>
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

      {kpiRows.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#72542b" }}>
          <p>No data available. Please add data in the other tabs (Productivity, Unit Cost, etc.) to see the KPI summary here.</p>
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
                  This Month
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
                  This<br />Month
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
                              cursor: "pointer",
                              textDecoration: "underline",
                            }}
                            onClick={() => handleCategoryClick(category)}
                            title={`Click to navigate to ${category} tab`}
                          >
                            {category}
                          </td>
                        )}
                        <td style={{ padding: "12px", color: "#4a352f", borderRight: "1px solid #ddd" }}>
                          {row.kpi}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center", color: "#4a352f", borderRight: "1px solid #ddd" }}>
                          {row.units}
                        </td>
                        <td style={{ padding: "8px", textAlign: "center", borderRight: "1px solid #ddd" }}>
                          <StatusIndicator variance={monthlyVar} target={row.thisMonthTarget} />
                        </td>
                        <td style={{ padding: "8px", textAlign: "center", borderRight: "1px solid #ddd" }}>
                          <StatusIndicator variance={ytdVar} target={row.ytdTarget} />
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

// Custom KPIs Component
const CustomKPIs = ({ activeSection, isInvestorView, onDataChange, financialYearStartMonth }) => {
  const [customKPIs, setCustomKPIs] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [financialYearMonths, setFinancialYearMonths] = useState([])
  const [newKPI, setNewKPI] = useState({
    name: "",
    units: "",
    target: 0,
    actual: 0,
    displayType: "chart",
    data: [],
    description: ""
  })

  useEffect(() => {
    if (financialYearStartMonth) {
      const months = getFinancialYearMonths(financialYearStartMonth)
      setFinancialYearMonths(months)
      setNewKPI(prev => ({
        ...prev,
        data: Array(12).fill(0)
      }))
    }
  }, [financialYearStartMonth])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user)
        loadCustomKPIs(user.uid)
      } else {
        setCurrentUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (onDataChange) {
      onDataChange('customKPIs', customKPIs)
    }
  }, [customKPIs])

  const loadCustomKPIs = async (userId) => {
    try {
      const docRef = doc(db, "custom-kpis", userId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const loadedKPIs = docSnap.data().kpis || []
        // Ensure each KPI has 12 months of data
        const updatedKPIs = loadedKPIs.map(kpi => ({
          ...kpi,
          data: kpi.data && kpi.data.length === 12 ? kpi.data : Array(12).fill(0)
        }))
        setCustomKPIs(updatedKPIs)
      }
    } catch (error) {
      console.error("Error loading custom KPIs:", error)
    }
  }

  const saveCustomKPIs = async () => {
    if (isInvestorView) {
      alert("You are in investor view mode. You cannot edit SME data.")
      return
    }

    if (!currentUser) {
      alert("User not authenticated")
      return
    }

    try {
      await setDoc(doc(db, "custom-kpis", currentUser.uid), {
        kpis: customKPIs,
        userId: currentUser.uid,
      })
      alert("Custom KPIs saved successfully!")
    } catch (error) {
      console.error("Error saving custom KPIs:", error)
      alert("Error saving data")
    }
  }

  const addNewKPI = () => {
    if (!newKPI.name.trim()) {
      alert("Please enter a KPI name")
      return
    }

    const newKpiData = {
      ...newKPI,
      id: Date.now().toString(),
      data: newKPI.displayType === "chart" ? Array(12).fill(0) : []
    }

    setCustomKPIs([...customKPIs, newKpiData])
    setNewKPI({
      name: "",
      units: "",
      target: 0,
      actual: 0,
      displayType: "chart",
      data: Array(12).fill(0),
      description: ""
    })
    setShowAddForm(false)
  }

  const updateKPI = (index, field, value) => {
    const newKPIs = [...customKPIs]
    if (field === "data") {
      const dataIndex = value.index
      const dataValue = value.value
      newKPIs[index].data[dataIndex] = Number.parseFloat(dataValue) || 0
    } else {
      newKPIs[index][field] = field === "name" || field === "units" || field === "description" 
        ? value 
        : Number.parseFloat(value) || 0
    }
    setCustomKPIs(newKPIs)
  }

  const removeKPI = (index) => {
    const newKPIs = customKPIs.filter((_, i) => i !== index)
    setCustomKPIs(newKPIs)
  }

  const handleDownload = () => {
    const csvContent = [
      ["KPI Name", "Units", "Target", "Actual", "Display Type", "Description"],
      ...customKPIs.map(kpi => [
        kpi.name,
        kpi.units,
        kpi.target,
        kpi.actual,
        kpi.displayType,
        kpi.description
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "custom-kpis.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (activeSection !== "custom-kpis") return null

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const financialYearStartMonthName = monthNames[financialYearStartMonth - 1]

  return (
    <div
      style={{
        backgroundColor: "#fdfcfb",
        padding: "20px",
        margin: "20px 0",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ color: "#5d4037", marginTop: 0 }}>Custom KPIs</h2>
          <p style={{ color: "#7d5a50", fontSize: "14px", margin: "5px 0 0 0" }}>
            Financial Year starts in {financialYearStartMonthName}
          </p>
        </div>
        {!isInvestorView && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleDownload}
              style={{
                padding: "8px 16px",
                backgroundColor: "#a67c52",
                color: "#faf7f2",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Download CSV
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#4a352f",
                color: "#faf7f2",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {showAddForm ? "Cancel" : "Add New KPI"}
            </button>
          </div>
        )}
      </div>

      {showAddForm && (
        <div
          style={{
            backgroundColor: "#f5f0e1",
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#7d5a50", marginTop: 0 }}>Add New KPI</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", color: "#7d5a50" }}>KPI Name</label>
              <input
                type="text"
                value={newKPI.name}
                onChange={(e) => setNewKPI({...newKPI, name: e.target.value})}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                  width: "100%",
                }}
                placeholder="Enter KPI name"
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", color: "#7d5a50" }}>Units of Measure</label>
              <input
                type="text"
                value={newKPI.units}
                onChange={(e) => setNewKPI({...newKPI, units: e.target.value})}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                  width: "100%",
                }}
                placeholder="e.g., %, R, index"
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", color: "#7d5a50" }}>Target Value</label>
              <input
                type="number"
                value={newKPI.target}
                onChange={(e) => setNewKPI({...newKPI, target: Number.parseFloat(e.target.value) || 0})}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                  width: "100%",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", color: "#7d5a50" }}>Actual Value</label>
              <input
                type="number"
                value={newKPI.actual}
                onChange={(e) => setNewKPI({...newKPI, actual: Number.parseFloat(e.target.value) || 0})}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                  width: "100%",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", color: "#7d5a50" }}>Display Type</label>
              <select
                value={newKPI.displayType}
                onChange={(e) => setNewKPI({...newKPI, displayType: e.target.value})}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                  width: "100%",
                }}
              >
                <option value="chart">Chart</option>
                <option value="metric">Metric Card</option>
                <option value="progress">Progress Bar</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", color: "#7d5a50" }}>Description</label>
              <input
                type="text"
                value={newKPI.description}
                onChange={(e) => setNewKPI({...newKPI, description: e.target.value})}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                  width: "100%",
                }}
                placeholder="Optional description"
              />
            </div>
          </div>
          <button
            onClick={addNewKPI}
            style={{
              padding: "8px 16px",
              backgroundColor: "#16a34a",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "15px",
            }}
          >
            Add KPI
          </button>
        </div>
      )}

      {customKPIs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#72542b" }}>
          <p>No custom KPIs added yet. Click "Add New KPI" to create your first custom KPI.</p>
        </div>
      ) : (
        <>
          {!isInvestorView && (
            <div style={{ marginBottom: "20px", textAlign: "right" }}>
              <button
                onClick={() => setShowEditForm(!showEditForm)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#72542b",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {showEditForm ? "Hide Edit Mode" : "Edit KPIs"}
              </button>
            </div>
          )}

          {showEditForm && (
            <div
              style={{
                backgroundColor: "#f5f0e1",
                padding: "20px",
                borderRadius: "6px",
                marginBottom: "20px",
              }}
            >
              <h3 style={{ color: "#7d5a50", marginTop: 0 }}>Edit KPIs</h3>
              {customKPIs.map((kpi, index) => (
                <div
                  key={kpi.id}
                  style={{
                    backgroundColor: "#fdfcfb",
                    padding: "15px",
                    borderRadius: "6px",
                    marginBottom: "15px",
                  }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto", gap: "10px", alignItems: "center" }}>
                    <input
                      type="text"
                      value={kpi.name}
                      onChange={(e) => updateKPI(index, "name", e.target.value)}
                      style={{
                        padding: "8px",
                        border: "1px solid #d4c4b0",
                        borderRadius: "4px",
                      }}
                    />
                    <input
                      type="text"
                      value={kpi.units}
                      onChange={(e) => updateKPI(index, "units", e.target.value)}
                      style={{
                        padding: "8px",
                        border: "1px solid #d4c4b0",
                        borderRadius: "4px",
                      }}
                    />
                    <input
                      type="number"
                      value={kpi.target}
                      onChange={(e) => updateKPI(index, "target", e.target.value)}
                      style={{
                        padding: "8px",
                        border: "1px solid #d4c4b0",
                        borderRadius: "4px",
                      }}
                    />
                    <input
                      type="number"
                      value={kpi.actual}
                      onChange={(e) => updateKPI(index, "actual", e.target.value)}
                      style={{
                        padding: "8px",
                        border: "1px solid #d4c4b0",
                        borderRadius: "4px",
                      }}
                    />
                    <select
                      value={kpi.displayType}
                      onChange={(e) => updateKPI(index, "displayType", e.target.value)}
                      style={{
                        padding: "8px",
                        border: "1px solid #d4c4b0",
                        borderRadius: "4px",
                      }}
                    >
                      <option value="chart">Chart</option>
                      <option value="metric">Metric Card</option>
                      <option value="progress">Progress Bar</option>
                    </select>
                    <button
                      onClick={() => removeKPI(index)}
                      style={{
                        padding: "8px",
                        backgroundColor: "#dc2626",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  {kpi.displayType === "chart" && (
                    <div style={{ marginTop: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        {financialYearMonths.map((month, monthIndex) => (
                          <div key={monthIndex} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <span style={{ color: "#7d5a50", fontSize: "12px" }}>{month}:</span>
                            <input
                              type="number"
                              value={kpi.data[monthIndex] || 0}
                              onChange={(e) => updateKPI(index, "data", {index: monthIndex, value: e.target.value})}
                              style={{
                                padding: "4px",
                                border: "1px solid #d4c4b0",
                                borderRadius: "4px",
                                width: "60px",
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ marginTop: "10px" }}>
                    <input
                      type="text"
                      value={kpi.description || ""}
                      onChange={(e) => updateKPI(index, "description", e.target.value)}
                      placeholder="Description"
                      style={{
                        padding: "8px",
                        border: "1px solid #d4c4b0",
                        borderRadius: "4px",
                        width: "100%",
                      }}
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={saveCustomKPIs}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#16a34a",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginTop: "10px",
                }}
              >
                Save Changes
              </button>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            {customKPIs.map((kpi, index) => (
              <div
                key={kpi.id}
                style={{
                  backgroundColor: "#f5f0e1",
                  padding: "15px",
                  borderRadius: "6px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "10px" }}>
                  <div>
                    <h3 style={{ color: "#7d5a50", marginTop: 0, marginBottom: "5px" }}>{kpi.name}</h3>
                    {kpi.description && (
                      <p style={{ color: "#72542b", fontSize: "12px", margin: 0 }}>{kpi.description}</p>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#4a352f", fontWeight: "bold", fontSize: "18px" }}>
                      {kpi.actual} {kpi.units}
                    </div>
                    <div style={{ color: "#7d5a50", fontSize: "12px" }}>
                      Target: {kpi.target} {kpi.units}
                    </div>
                  </div>
                </div>

                {kpi.displayType === "chart" && (
                  <div style={{ height: "150px", marginTop: "15px" }}>
                    <Line
                      data={{
                        labels: financialYearMonths,
                        datasets: [
                          {
                            label: kpi.name,
                            data: kpi.data || Array(12).fill(0),
                            borderColor: "#a67c52",
                            backgroundColor: "rgba(166, 124, 82, 0.1)",
                            borderWidth: 2,
                            tension: 0.1,
                            fill: true,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </div>
                )}

                {kpi.displayType === "metric" && (
                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <div style={{ fontSize: "36px", fontWeight: "bold", color: "#4a352f" }}>
                      {kpi.actual} {kpi.units}
                    </div>
                    <div style={{ color: "#7d5a50", fontSize: "14px", marginTop: "5px" }}>
                      vs Target: {kpi.target} {kpi.units}
                    </div>
                  </div>
                )}

                {kpi.displayType === "progress" && (
                  <div style={{ marginTop: "15px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                      <span style={{ color: "#7d5a50" }}>Progress</span>
                      <span style={{ color: "#4a352f", fontWeight: "bold" }}>
                        {kpi.target > 0 ? Math.min(100, (kpi.actual / kpi.target) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: "10px",
                        backgroundColor: "#e6d7c3",
                        borderRadius: "5px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${kpi.target > 0 ? Math.min(100, (kpi.actual / kpi.target) * 100) : 0}%`,
                          height: "100%",
                          backgroundColor: kpi.actual >= kpi.target ? "#4CAF50" : "#FF9800",
                          borderRadius: "5px",
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Productivity Measures Component
const ProductivityMeasures = ({ activeSection, isInvestorView, onDataChange, financialYearStartMonth }) => {
  const [productivityData, setProductivityData] = useState(Array(12).fill(0))
  const [efficiencyData, setEfficiencyData] = useState(Array(12).fill(0))
  const [showEditForm, setShowEditForm] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [financialYearMonths, setFinancialYearMonths] = useState([])

  useEffect(() => {
    if (financialYearStartMonth) {
      const months = getFinancialYearMonths(financialYearStartMonth)
      setFinancialYearMonths(months)
    }
  }, [financialYearStartMonth])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user)
        loadProductivityData(user.uid)
      } else {
        setCurrentUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (onDataChange) {
      onDataChange('productivity', { productivityData, efficiencyData })
    }
  }, [productivityData, efficiencyData])

  const saveProductivityData = async () => {
    if (isInvestorView) {
      alert("You are in investor view mode. You cannot edit SME data.")
      return
    }

    if (!currentUser) {
      alert("User not authenticated")
      return
    }

    try {
      await setDoc(doc(db, "productivity", currentUser.uid), {
        productivityData,
        efficiencyData,
        userId: currentUser.uid,
      })
      setShowEditForm(false)
      alert("Productivity data saved successfully!")
    } catch (error) {
      console.error("Error saving productivity data:", error)
      alert("Error saving data")
    }
  }

  const loadProductivityData = async (userId) => {
    try {
      const docRef = doc(db, "productivity", userId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        setProductivityData(data.productivityData || Array(12).fill(0))
        setEfficiencyData(data.efficiencyData || Array(12).fill(0))
      }
    } catch (error) {
      console.error("Error loading productivity data:", error)
    }
  }

  const updateProductivityValue = (index, value) => {
    const newData = [...productivityData]
    newData[index] = Number.parseFloat(value) || 0
    setProductivityData(newData)
  }

  const updateEfficiencyValue = (index, value) => {
    const newData = [...efficiencyData]
    newData[index] = Number.parseFloat(value) || 0
    setEfficiencyData(newData)
  }

  const handleDownload = () => {
    const csvContent = [
      ["Month", "Productivity Index", "Efficiency Ratio"],
      ...financialYearMonths.map((month, index) => [month, productivityData[index], efficiencyData[index]]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "productivity-measures.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (activeSection !== "productivity") return null

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const financialYearStartMonthName = monthNames[financialYearStartMonth - 1]

  return (
    <div
      style={{
        backgroundColor: "#fdfcfb",
        padding: "20px",
        margin: "20px 0",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ color: "#5d4037", marginTop: 0 }}>Productivity Measures</h2>
          <p style={{ color: "#7d5a50", fontSize: "14px", margin: "5px 0 0 0" }}>
            Financial Year starts in {financialYearStartMonthName}
          </p>
        </div>
        {!isInvestorView && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleDownload}
              style={{
                padding: "8px 16px",
                backgroundColor: "#a67c52",
                color: "#faf7f2",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Download CSV
            </button>
            <button
              onClick={() => setShowEditForm(!showEditForm)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#4a352f",
                color: "#faf7f2",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {showEditForm ? "Cancel" : "Edit Data"}
            </button>
          </div>
        )}
      </div>

      {showEditForm && (
        <div
          style={{
            backgroundColor: "#f5f0e1",
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#7d5a50", marginTop: 0 }}>Edit Productivity Data</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <h4 style={{ color: "#7d5a50" }}>Productivity Index</h4>
              {financialYearMonths.map((month, index) => (
                <div key={month} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ minWidth: "40px", color: "#72542b" }}>{month}:</span>
                  <input
                    type="number"
                    value={productivityData[index]}
                    onChange={(e) => updateProductivityValue(index, e.target.value)}
                    style={{
                      padding: "6px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                      width: "80px",
                    }}
                  />
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ color: "#7d5a50" }}>Efficiency Ratio</h4>
              {financialYearMonths.map((month, index) => (
                <div key={month} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ minWidth: "40px", color: "#72542b" }}>{month}:</span>
                  <input
                    type="number"
                    value={efficiencyData[index]}
                    onChange={(e) => updateEfficiencyValue(index, e.target.value)}
                    style={{
                      padding: "6px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                      width: "80px",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={saveProductivityData}
            style={{
              padding: "8px 16px",
              backgroundColor: "#16a34a",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "15px",
            }}
          >
            Save Data
          </button>
        </div>
      )}

      <div style={{ height: "400px" }}>
        <Line
          data={{
            labels: financialYearMonths,
            datasets: [
              {
                label: "Productivity Index",
                data: productivityData,
                borderColor: "#a67c52",
                backgroundColor: "rgba(166, 124, 82, 0.1)",
                borderWidth: 2,
                tension: 0.1,
                fill: true,
              },
              {
                label: "Efficiency Ratio",
                data: efficiencyData,
                borderColor: "#8b7355",
                backgroundColor: "rgba(139, 115, 85, 0.1)",
                borderWidth: 2,
                tension: 0.1,
                fill: true,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "top",
              },
              title: {
                display: false,
              },
            },
          }}
        />
      </div>
    </div>
  )
}

// Unit Cost Component
const UnitCost = ({ activeSection, isInvestorView, onDataChange }) => {
  const [products, setProducts] = useState([])
  const [showEditForm, setShowEditForm] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user)
        loadUnitCostData(user.uid)
      } else {
        setCurrentUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (onDataChange) {
      onDataChange('unitCost', { products })
    }
  }, [products])

  const saveUnitCostData = async () => {
    if (isInvestorView) {
      alert("You are in investor view mode. You cannot edit SME data.")
      return
    }

    if (!currentUser) {
      alert("User not authenticated")
      return
    }

    try {
      await setDoc(doc(db, "unit-cost", currentUser.uid), { 
        products,
        userId: currentUser.uid,
      })
      setShowEditForm(false)
      alert("Unit cost data saved successfully!")
    } catch (error) {
      console.error("Error saving unit cost data:", error)
      alert("Error saving data")
    }
  }

  const loadUnitCostData = async (userId) => {
    try {
      const docRef = doc(db, "unit-cost", userId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setProducts(docSnap.data().products || [])
      }
    } catch (error) {
      console.error("Error loading unit cost data:", error)
    }
  }

  const updateProduct = (index, field, value) => {
    const newProducts = [...products]
    newProducts[index][field] = field === "name" ? value : Number.parseFloat(value) || 0
    setProducts(newProducts)
  }

  const addProduct = () => {
    setProducts([...products, { name: "New Product", cost: 0, price: 0 }])
  }

  const removeProduct = (index) => {
    const newProducts = products.filter((_, i) => i !== index)
    setProducts(newProducts)
  }

  const handleDownload = () => {
    const csvContent = [
      ["Product Name", "Cost (R)", "Price (R)", "Margin %"],
      ...products.map((product) => [
        product.name,
        product.cost.toFixed(2),
        product.price.toFixed(2),
        product.price > 0 ? (((product.price - product.cost) / product.price) * 100).toFixed(1) : 0,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "unit-cost.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (activeSection !== "unit-cost") return null

  return (
    <div
      style={{
        backgroundColor: "#fdfcfb",
        padding: "20px",
        margin: "20px 0",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#5d4037", marginTop: 0 }}>Unit Cost per Output</h2>
        {!isInvestorView && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleDownload}
              style={{
                padding: "8px 16px",
                backgroundColor: "#a67c52",
                color: "#faf7f2",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Download CSV
            </button>
            <button
              onClick={() => setShowEditForm(!showEditForm)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#4a352f",
                color: "#faf7f2",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {showEditForm ? "Cancel" : "Edit Data"}
            </button>
          </div>
        )}
      </div>

      {showEditForm && (
        <div
          style={{
            backgroundColor: "#f5f0e1",
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#7d5a50", marginTop: 0 }}>Edit Product Data</h3>
          {products.map((product, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr auto",
                gap: "10px",
                alignItems: "center",
                marginBottom: "10px",
                padding: "10px",
                backgroundColor: "#fdfcfb",
                borderRadius: "4px",
              }}
            >
              <input
                type="text"
                value={product.name}
                onChange={(e) => updateProduct(index, "name", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Product Name"
              />
              <input
                type="number"
                value={product.cost}
                onChange={(e) => updateProduct(index, "cost", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Cost"
              />
              <input
                type="number"
                value={product.price}
                onChange={(e) => updateProduct(index, "price", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Price"
              />
              <button
                onClick={() => removeProduct(index)}
                style={{
                  padding: "8px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <div style={{ marginTop: "15px" }}>
            <button
              onClick={addProduct}
              style={{
                padding: "8px 16px",
                backgroundColor: "#72542b",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              Add Product
            </button>
            <button
              onClick={saveUnitCostData}
              style={{
                padding: "8px 16px",
                backgroundColor: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Save Data
            </button>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#72542b",
          }}
        >
          <p>No product data available. Click "Edit Data" to add your first product.</p>
        </div>
      ) : (
        <div style={{ height: "400px" }}>
          <Bar
            data={{
              labels: products.map((p) => p.name),
              datasets: [
                {
                  label: "Production Cost",
                  data: products.map((p) => p.cost),
                  backgroundColor: "#d4c4b0",
                  borderColor: "#5d4037",
                  borderWidth: 1,
                },
                {
                  label: "Selling Price",
                  data: products.map((p) => p.price),
                  backgroundColor: "#9c7c5f",
                  borderColor: "#5d4037",
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "top",
                },
                title: {
                  display: false,
                },
              },
            }}
          />
        </div>
      )}
    </div>
  )
}

// Order Fulfillment Component
const OrderFulfillment = ({ activeSection, isInvestorView, onDataChange }) => {
  const [metrics, setMetrics] = useState([])
  const [showEditForm, setShowEditForm] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user)
        loadOrderFulfillmentData(user.uid)
      } else {
        setCurrentUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (onDataChange) {
      onDataChange('orderFulfillment', { metrics })
    }
  }, [metrics])

  const saveOrderFulfillmentData = async () => {
    if (isInvestorView) {
      alert("You are in investor view mode. You cannot edit SME data.")
      return
    }

    if (!currentUser) {
      alert("User not authenticated")
      return
    }

    try {
      await setDoc(doc(db, "order-fulfillment", currentUser.uid), { 
        metrics,
        userId: currentUser.uid,
      })
      setShowEditForm(false)
      alert("Order fulfillment data saved successfully!")
    } catch (error) {
      console.error("Error saving order fulfillment data:", error)
      alert("Error saving data")
    }
  }

  const loadOrderFulfillmentData = async (userId) => {
    try {
      const docRef = doc(db, "order-fulfillment", userId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setMetrics(docSnap.data().metrics || [])
      }
    } catch (error) {
      console.error("Error loading order fulfillment data:", error)
    }
  }

  const updateMetric = (index, field, value) => {
    const newMetrics = [...metrics]
    newMetrics[index][field] = field === "name" ? value : Number.parseFloat(value) || 0
    setMetrics(newMetrics)
  }

  const addMetric = () => {
    setMetrics([...metrics, { name: "New Metric", value: 0, target: 100 }])
  }

  const removeMetric = (index) => {
    const newMetrics = metrics.filter((_, i) => i !== index)
    setMetrics(newMetrics)
  }

  const handleDownload = () => {
    const csvContent = [
      ["Metric Name", "Current Value %", "Target Value %", "Performance %"],
      ...metrics.map((metric) => [
        metric.name,
        metric.value,
        metric.target,
        metric.target > 0 ? ((metric.value / metric.target) * 100).toFixed(1) : 0,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "order-fulfillment.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (activeSection !== "order-fulfillment") return null

  return (
    <div
      style={{
        backgroundColor: "#fdfcfb",
        padding: "20px",
        margin: "20px 0",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#5d4037", marginTop: 0 }}>Order Fulfillment & Delivery Metrics</h2>
        {!isInvestorView && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleDownload}
              style={{
                padding: "8px 16px",
                backgroundColor: "#a67c52",
                color: "#faf7f2",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Download CSV
            </button>
            <button
              onClick={() => setShowEditForm(!showEditForm)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#4a352f",
                color: "#faf7f2",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {showEditForm ? "Cancel" : "Edit Data"}
            </button>
          </div>
        )}
      </div>

      {showEditForm && (
        <div
          style={{
            backgroundColor: "#f5f0e1",
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#7d5a50", marginTop: 0 }}>Edit Metrics Data</h3>
          {metrics.map((metric, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr auto",
                gap: "10px",
                alignItems: "center",
                marginBottom: "10px",
                padding: "10px",
                backgroundColor: "#fdfcfb",
                borderRadius: "4px",
              }}
            >
              <input
                type="text"
                value={metric.name}
                onChange={(e) => updateMetric(index, "name", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Metric Name"
              />
              <input
                type="number"
                value={metric.value}
                onChange={(e) => updateMetric(index, "value", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Value"
              />
              <input
                type="number"
                value={metric.target}
                onChange={(e) => updateMetric(index, "target", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Target"
              />
              <button
                onClick={() => removeMetric(index)}
                style={{
                  padding: "8px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <div style={{ marginTop: "15px" }}>
            <button
              onClick={addMetric}
              style={{
                padding: "8px 16px",
                backgroundColor: "#72542b",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              Add Metric
            </button>
            <button
              onClick={saveOrderFulfillmentData}
              style={{
                padding: "8px 16px",
                backgroundColor: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Save Data
            </button>
          </div>
        </div>
      )}

      {metrics.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#72542b",
          }}
        >
          <p>No metrics data available. Click "Edit Data" to add your first metric.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
          }}
        >
          {metrics.map((metric, index) => (
            <div
              key={index}
              style={{
                padding: "15px",
                backgroundColor: "#f5f0e1",
                borderRadius: "6px",
                textAlign: "center",
              }}
            >
              <h3 style={{ color: "#7d5a50", marginTop: 0 }}>{metric.name}</h3>
              <div
                style={{
                  width: "120px",
                  height: "120px",
                  margin: "0 auto",
                  position: "relative",
                }}
              >
                <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#e8ddd4"
                    strokeWidth="12"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke={metric.value >= metric.target ? "#4CAF50" : "#FF9800"}
                    strokeWidth="12"
                    strokeDasharray={2 * Math.PI * 50}
                    strokeDashoffset={2 * Math.PI * 50 - (metric.value / 100) * (2 * Math.PI * 50)}
                    strokeLinecap="round"
                    style={{
                      transition: "stroke-dashoffset 0.5s ease",
                    }}
                  />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#4a352f",
                    }}
                  >
                    {metric.value}%
                  </span>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#7d5a50",
                    }}
                  >
                    Target: {metric.target}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Tech Stack Component
const TechStackUsage = ({ activeSection, isInvestorView, onDataChange }) => {
  const [systems, setSystems] = useState([])
  const [showEditForm, setShowEditForm] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user)
        loadTechStackData(user.uid)
      } else {
        setCurrentUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (onDataChange) {
      onDataChange('techStack', { systems })
    }
  }, [systems])

  const saveTechStackData = async () => {
    if (isInvestorView) {
      alert("You are in investor view mode. You cannot edit SME data.")
      return
    }

    if (!currentUser) {
      alert("User not authenticated")
      return
    }

    try {
      await setDoc(doc(db, "tech-stack", currentUser.uid), { 
        systems,
        userId: currentUser.uid,
      })
      setShowEditForm(false)
      alert("Tech stack data saved successfully!")
    } catch (error) {
      console.error("Error saving tech stack data:", error)
      alert("Error saving data")
    }
  }

  const loadTechStackData = async (userId) => {
    try {
      const docRef = doc(db, "tech-stack", userId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setSystems(docSnap.data().systems || [])
      }
    } catch (error) {
      console.error("Error loading tech stack data:", error)
    }
  }

  const updateSystem = (index, field, value) => {
    const newSystems = [...systems]
    newSystems[index][field] = field === "name" ? value : Number.parseFloat(value) || 0
    setSystems(newSystems)
  }

  const addSystem = () => {
    setSystems([...systems, { name: "New System", adoption: 0, users: 0 }])
  }

  const removeSystem = (index) => {
    const newSystems = systems.filter((_, i) => i !== index)
    setSystems(newSystems)
  }

  const handleDownload = () => {
    const csvContent = [
      ["System Name", "Adoption Rate %", "Active Users"],
      ...systems.map((system) => [system.name, system.adoption, system.users]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "tech-stack-usage.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (activeSection !== "tech-stack") return null

  return (
    <div
      style={{
        backgroundColor: "#fdfcfb",
        padding: "20px",
        margin: "20px 0",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#5d4037", marginTop: 0 }}>Tech Stack Usage</h2>
        {!isInvestorView && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleDownload}
              style={{
                padding: "8px 16px",
                backgroundColor: "#a67c52",
                color: "#faf7f2",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Download CSV
            </button>
            <button
              onClick={() => setShowEditForm(!showEditForm)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#4a352f",
                color: "#faf7f2",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {showEditForm ? "Cancel" : "Edit Data"}
            </button>
          </div>
        )}
      </div>

      {showEditForm && (
        <div
          style={{
            backgroundColor: "#f5f0e1",
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#7d5a50", marginTop: 0 }}>Edit Tech Stack Data</h3>
          {systems.map((system, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr auto",
                gap: "10px",
                alignItems: "center",
                marginBottom: "10px",
                padding: "10px",
                backgroundColor: "#fdfcfb",
                borderRadius: "4px",
              }}
            >
              <input
                type="text"
                value={system.name}
                onChange={(e) => updateSystem(index, "name", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="System Name"
              />
              <input
                type="number"
                value={system.adoption}
                onChange={(e) => updateSystem(index, "adoption", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Adoption %"
              />
              <input
                type="number"
                value={system.users}
                onChange={(e) => updateSystem(index, "users", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Users"
              />
              <button
                onClick={() => removeSystem(index)}
                style={{
                  padding: "8px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <div style={{ marginTop: "15px" }}>
            <button
              onClick={addSystem}
              style={{
                padding: "8px 16px",
                backgroundColor: "#72542b",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              Add System
            </button>
            <button
              onClick={saveTechStackData}
              style={{
                padding: "8px 16px",
                backgroundColor: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Save Data
            </button>
          </div>
        </div>
      )}

      {systems.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#72542b",
          }}
        >
          <p>No tech stack data available. Click "Edit Data" to add your first system.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          {systems.map((system, index) => (
            <div
              key={index}
              style={{
                padding: "15px",
                backgroundColor: "#f5f0e1",
                borderRadius: "6px",
              }}
            >
              <h3 style={{ color: "#7d5a50", marginTop: 0 }}>{system.name}</h3>
              <div style={{ marginTop: "15px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "5px",
                  }}
                >
                  <span style={{ color: "#7d5a50" }}>Adoption Rate:</span>
                  <span style={{ fontWeight: "bold", color: "#4a352f" }}>{system.adoption}%</span>
                </div>
                <div
                  style={{
                    height: "10px",
                    backgroundColor: "#e6d7c3",
                    borderRadius: "5px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${system.adoption}%`,
                      height: "100%",
                      backgroundColor: "#9c7c5f",
                      borderRadius: "5px",
                    }}
                  ></div>
                </div>
              </div>
              <div style={{ marginTop: "15px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "5px",
                  }}
                >
                  <span style={{ color: "#7d5a50" }}>Active Users:</span>
                  <span style={{ fontWeight: "bold", color: "#4a352f" }}>{system.users}</span>
                </div>
              </div>
              <div
                style={{
                  height: "10px",
                  backgroundColor: "#e6d7c3",
                  borderRadius: "5px",
                  overflow: "hidden",
                  marginTop: "5px",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, (system.users / 150) * 100)}%`,
                    height: "100%",
                    backgroundColor: "#a67c52",
                    borderRadius: "5px",
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Process Automation Component
const ProcessAutomation = ({ activeSection, isInvestorView, onDataChange }) => {
  const [processes, setProcesses] = useState([])
  const [showEditForm, setShowEditForm] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user)
        loadProcessAutomationData(user.uid)
      } else {
        setCurrentUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (onDataChange) {
      onDataChange('processAutomation', { processes })
    }
  }, [processes])

  const saveProcessAutomationData = async () => {
    if (isInvestorView) {
      alert("You are in investor view mode. You cannot edit SME data.")
      return
    }

    if (!currentUser) {
      alert("User not authenticated")
      return
    }

    try {
      await setDoc(doc(db, "process-automation", currentUser.uid), { 
        processes,
        userId: currentUser.uid,
      })
      setShowEditForm(false)
      alert("Process automation data saved successfully!")
    } catch (error) {
      console.error("Error saving process automation data:", error)
      alert("Error saving data")
    }
  }

  const loadProcessAutomationData = async (userId) => {
    try {
      const docRef = doc(db, "process-automation", userId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setProcesses(docSnap.data().processes || [])
      }
    } catch (error) {
      console.error("Error loading process automation data:", error)
    }
  }

  const updateProcess = (index, field, value) => {
    const newProcesses = [...processes]
    newProcesses[index][field] = field === "name" ? value : Number.parseFloat(value) || 0
    setProcesses(newProcesses)
  }

  const addProcess = () => {
    setProcesses([...processes, { name: "New Process", automation: 0 }])
  }

  const removeProcess = (index) => {
    const newProcesses = processes.filter((_, i) => i !== index)
    setProcesses(newProcesses)
  }

  const handleDownload = () => {
    const csvContent = [
      ["Process Name", "Automation Level %"],
      ...processes.map((process) => [process.name, process.automation]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "process-automation.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (activeSection !== "process-automation") return null

  const overallIndex = processes.length > 0 ? processes.reduce((sum, p) => sum + p.automation, 0) / processes.length : 0

  return (
    <div
      style={{
        backgroundColor: "#fdfcfb",
        padding: "20px",
        margin: "20px 0",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#5d4037", marginTop: 0 }}>Process Automation Index</h2>
        {!isInvestorView && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleDownload}
              style={{
                padding: "8px 16px",
                backgroundColor: "#a67c52",
                color: "#faf7f2",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Download CSV
            </button>
            <button
              onClick={() => setShowEditForm(!showEditForm)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#4a352f",
                color: "#faf7f2",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {showEditForm ? "Cancel" : "Edit Data"}
            </button>
          </div>
        )}
      </div>

      {showEditForm && (
        <div
          style={{
            backgroundColor: "#f5f0e1",
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#7d5a50", marginTop: 0 }}>Edit Process Data</h3>
          {processes.map((process, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr auto",
                gap: "10px",
                alignItems: "center",
                marginBottom: "10px",
                padding: "10px",
                backgroundColor: "#fdfcfb",
                borderRadius: "4px",
              }}
            >
              <input
                type="text"
                value={process.name}
                onChange={(e) => updateProcess(index, "name", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Process Name"
              />
              <input
                type="number"
                value={process.automation}
                onChange={(e) => updateProcess(index, "automation", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Automation %"
              />
              <button
                onClick={() => removeProcess(index)}
                style={{
                  padding: "8px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <div style={{ marginTop: "15px" }}>
            <button
              onClick={addProcess}
              style={{
                padding: "8px 16px",
                backgroundColor: "#72542b",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              Add Process
            </button>
            <button
              onClick={saveProcessAutomationData}
              style={{
                padding: "8px 16px",
                backgroundColor: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Save Data
            </button>
          </div>
        </div>
      )}

      {processes.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#72542b",
          }}
        >
          <p>No process data available. Click "Edit Data" to add your first process.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "30px",
          }}
        >
          <div>
            <div
              style={{
                height: "300px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "200px",
                  height: "200px",
                  borderRadius: "50%",
                  backgroundColor: "#e8ddd4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  border: "10px solid #9c7c5f",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                }}
              >
                <span
                  style={{
                    fontSize: "36px",
                    fontWeight: "bold",
                    color: "#5d4037",
                  }}
                >
                  {Math.round(overallIndex)}%
                </span>
                <span
                  style={{
                    fontSize: "16px",
                    color: "#7d5a50",
                  }}
                >
                  Automation Index
                </span>
              </div>
            </div>
          </div>
          <div>
            {processes.map((process, index) => (
              <div key={index} style={{ marginBottom: "15px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "5px",
                  }}
                >
                  <span style={{ color: "#7d5a50" }}>{process.name}</span>
                  <span style={{ fontWeight: "bold", color: "#4a352f" }}>{process.automation}%</span>
                </div>
                <div
                  style={{
                    height: "10px",
                    backgroundColor: "#e6d7c3",
                    borderRadius: "5px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${process.automation}%`,
                      height: "100%",
                      backgroundColor: "#8b7355",
                      borderRadius: "5px",
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Customer Retention Component
const CustomerRetention = ({ activeSection, isInvestorView, onDataChange, financialYearStartMonth }) => {
  const [retentionData, setRetentionData] = useState(Array(12).fill(0))
  const [churnData, setChurnData] = useState(Array(12).fill(0))
  const [showEditForm, setShowEditForm] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [financialYearMonths, setFinancialYearMonths] = useState([])

  useEffect(() => {
    if (financialYearStartMonth) {
      const months = getFinancialYearMonths(financialYearStartMonth)
      setFinancialYearMonths(months)
    }
  }, [financialYearStartMonth])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user)
        loadCustomerRetentionData(user.uid)
      } else {
        setCurrentUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (onDataChange) {
      onDataChange('customerRetention', { retentionData, churnData })
    }
  }, [retentionData, churnData])

  const saveCustomerRetentionData = async () => {
    if (isInvestorView) {
      alert("You are in investor view mode. You cannot edit SME data.")
      return
    }

    if (!currentUser) {
      alert("User not authenticated")
      return
    }

    try {
      await setDoc(doc(db, "customer-retention", currentUser.uid), {
        retentionData,
        churnData,
        userId: currentUser.uid,
      })
      setShowEditForm(false)
      alert("Customer retention data saved successfully!")
    } catch (error) {
      console.error("Error saving customer retention data:", error)
      alert("Error saving data")
    }
  }

  const loadCustomerRetentionData = async (userId) => {
    try {
      const docRef = doc(db, "customer-retention", userId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        setRetentionData(data.retentionData || Array(12).fill(0))
        setChurnData(data.churnData || Array(12).fill(0))
      }
    } catch (error) {
      console.error("Error loading customer retention data:", error)
    }
  }

  const updateRetentionValue = (index, value) => {
    const newData = [...retentionData]
    newData[index] = Number.parseFloat(value) || 0
    setRetentionData(newData)
  }

  const updateChurnValue = (index, value) => {
    const newData = [...churnData]
    newData[index] = Number.parseFloat(value) || 0
    setChurnData(newData)
  }

  const handleDownload = () => {
    const csvContent = [
      ["Month", "Retention Rate %", "Churn Rate %"],
      ...financialYearMonths.map((month, index) => [month, retentionData[index], churnData[index]]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "customer-retention.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (activeSection !== "customer-retention") return null

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const financialYearStartMonthName = monthNames[financialYearStartMonth - 1]

  return (
    <div
      style={{
        backgroundColor: "#f0e6d9",
        padding: "20px",
        margin: "20px 0",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ color: "#5d4037", marginTop: 0 }}>Customer Retention & Churn Rates</h2>
          <p style={{ color: "#7d5a50", fontSize: "14px", margin: "5px 0 0 0" }}>
            Financial Year starts in {financialYearStartMonthName}
          </p>
        </div>
        {!isInvestorView && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleDownload}
              style={{
                padding: "8px 16px",
                backgroundColor: "#a67c52",
                color: "#faf7f2",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Download CSV
            </button>
            <button
              onClick={() => setShowEditForm(!showEditForm)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#4a352f",
                color: "#faf7f2",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {showEditForm ? "Cancel" : "Edit Data"}
            </button>
          </div>
        )}
      </div>

      {showEditForm && (
        <div
          style={{
            backgroundColor: "#f5f0e1",
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#7d5a50", marginTop: 0 }}>Edit Customer Retention Data</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <h4 style={{ color: "#7d5a50" }}>Retention Rate (%)</h4>
              {financialYearMonths.map((month, index) => (
                <div key={month} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ minWidth: "40px", color: "#72542b" }}>{month}:</span>
                  <input
                    type="number"
                    value={retentionData[index]}
                    onChange={(e) => updateRetentionValue(index, e.target.value)}
                    style={{
                      padding: "6px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                      width: "80px",
                    }}
                  />
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ color: "#7d5a50" }}>Churn Rate (%)</h4>
              {financialYearMonths.map((month, index) => (
                <div key={month} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ minWidth: "40px", color: "#72542b" }}>{month}:</span>
                  <input
                    type="number"
                    value={churnData[index]}
                    onChange={(e) => updateChurnValue(index, e.target.value)}
                    style={{
                      padding: "6px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                      width: "80px",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={saveCustomerRetentionData}
            style={{
              padding: "8px 16px",
              backgroundColor: "#16a34a",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "15px",
            }}
          >
            Save Data
          </button>
        </div>
      )}

      <div style={{ height: "400px" }}>
        <Line
          data={{
            labels: financialYearMonths,
            datasets: [
              {
                label: "Retention Rate (%)",
                data: retentionData,
                borderColor: "#4CAF50",
                backgroundColor: "rgba(76, 175, 80, 0.1)",
                borderWidth: 2,
                tension: 0.1,
                fill: true,
              },
              {
                label: "Churn Rate (%)",
                data: churnData,
                borderColor: "#F44336",
                backgroundColor: "rgba(244, 67, 54, 0.1)",
                borderWidth: 2,
                tension: 0.1,
                fill: true,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "top",
              },
              title: {
                display: false,
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                title: {
                  display: true,
                  text: "Rate (%)",
                  color: "#72542b",
                },
              },
              x: {
                title: {
                  display: true,
                  text: "Financial Year Months",
                  color: "#72542b",
                },
              },
            },
          }}
        />
      </div>
    </div>
  )
}

// Main Operational Strength Component
const OperationalStrength = () => {
  const [activeSection, setActiveSection] = useState("kpi-dashboard")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [allData, setAllData] = useState({
    productivity: null,
    unitCost: null,
    orderFulfillment: null,
    techStack: null,
    processAutomation: null,
    customerRetention: null,
    customKPIs: null,
  })

  const [isInvestorView, setIsInvestorView] = useState(false)
  const [viewingSMEId, setViewingSMEId] = useState(null)
  const [viewingSMEName, setViewingSMEName] = useState("")
  const [financialYearStartMonth, setFinancialYearStartMonth] = useState(1) // Default to January (1)
  const [loadingFinancialYear, setLoadingFinancialYear] = useState(true)

  // Fetch financial year start month from user profile
  useEffect(() => {
    const fetchFinancialYearStart = async (userId) => {
      try {
        setLoadingFinancialYear(true)
        
        // Get from universalProfiles collection - query for the logged in user's profile
        const profilesQuery = query(
          collection(db, "universalProfiles"),
          where("userId", "==", userId)
        )
        
        const querySnapshot = await getDocs(profilesQuery)
        
        if (!querySnapshot.empty) {
          // Get the first matching document
          const profileDoc = querySnapshot.docs[0]
          const profileData = profileDoc.data()
          
          console.log("Profile data found:", profileData)
          
          if (profileData.entityOverview?.financialYearEnd) {
            // financialYearEnd is in format "2025-02" where 02 is February
            // The month number is the financial year start month
            const financialYearEndStr = profileData.entityOverview.financialYearEnd
            console.log("Financial Year End string:", financialYearEndStr)

            // Split by "-" and get the month part
            const parts = financialYearEndStr.split("-")
            if (parts.length === 2) {
              const month = parseInt(parts[1])
              console.log("Parsed month:", month)
              
              if (!isNaN(month) && month >= 1 && month <= 12) {
                setFinancialYearStartMonth(month)
                console.log("Financial year start month set to:", month)
              } else {
                console.log("Invalid month parsed:", month)
                setFinancialYearStartMonth(1) // Default to January
              }
            
            } else {
              console.log("Invalid financialYearEnd format:", financialYearEndStr)
              setFinancialYearStartMonth(1) // Default to January
            }
          } else {
            console.log("No financialYearEnd found in entityOverview")
            setFinancialYearStartMonth(1) // Default to January
          }
        } else {
          console.log("No universalProfiles document found for user:", userId)
          
          // Fallback: Try to get from user document
          try {
            const userDoc = await getDoc(doc(db, "universalProfiles", userId))
            if (userDoc.exists()) {
              const userData = userDoc.data()
              console.log("User data found:", userData)
              
              if (userData.entityOverview?.financialYearEnd) {
                const financialYearEndStr = userData.entityOverview.financialYearEnd
                console.log("Financial Year End from user doc:", financialYearEndStr)
                
                const parts = financialYearEndStr.split("-")
                if (parts.length === 2) {
                  const month = parseInt(parts[1])
                  if (!isNaN(month) && month >= 1 && month <= 12) {
                    setFinancialYearStartMonth(month)
                    console.log("Financial year start month set to:", month)
                  }
                }
              }
            }
          } catch (fallbackError) {
            console.error("Error in fallback fetch:", fallbackError)
          }
        }
      } catch (error) {
        console.error("Error fetching financial year start:", error)
        setFinancialYearStartMonth(1) // Default to January
      } finally {
        setLoadingFinancialYear(false)
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (isInvestorView && viewingSMEId) {
          // If in investor view, fetch the SME's financial year
          await fetchFinancialYearStart(viewingSMEId)
        } else {
          // If not in investor view, fetch the logged in user's financial year
          await fetchFinancialYearStart(user.uid)
        }
      } else {
        setLoadingFinancialYear(false)
      }
    })

    return () => unsubscribe()
  }, [isInvestorView, viewingSMEId])

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

  const handleDataChange = (section, data) => {
    setAllData(prev => ({
      ...prev,
      [section]: data
    }))
  }

  const handleCategoryClick = (section) => {
    setActiveSection(section)
    // Scroll to the section
    setTimeout(() => {
      document.querySelector(`[data-section="${section}"]`)?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
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
    { id: "productivity", label: "Productivity" },
    { id: "unit-cost", label: "Unit Costs" },
    { id: "order-fulfillment", label: "Order Fulfillment" },
    { id: "tech-stack", label: "Tech Stack" },
    { id: "process-automation", label: "Process Automation" },
    { id: "customer-retention", label: "Customer Retention" },
    { id: "custom-kpis", label: "Add KPI" },
  ]

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const financialYearMonths = getFinancialYearMonths(financialYearStartMonth)
  const financialYearStartMonthName = monthNames[financialYearStartMonth - 1]

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
                Investor View: Viewing {viewingSMEName}'s Operational Strength
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

        <div style={{ padding: "20px" }}>
          <div style={{ margin: "50px 0 10px 0" }}>
            <h2 style={{ color: "#4a352f", margin: 0 }}>Operational Strength Dashboard</h2>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              margin: "10px 0 20px 0",
              padding: "15px",
              backgroundColor: "#fdfcfb",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              overflowX: "auto",
              whiteSpace: "nowrap",
            }}
          >
            {sectionButtons.map((button) => (
              <button
                key={button.id}
                onClick={() => setActiveSection(button.id)}
                style={{
                  padding: "10px 15px",
                  backgroundColor: activeSection === button.id ? "#4a352f" : "#e6d7c3",
                  color: activeSection === button.id ? "#faf7f2" : "#4a352f",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                  transition: "all 0.3s ease",
                  minWidth: "120px",
                  textAlign: "center",
                  flexShrink: 0,
                }}
              >
                {button.label}
              </button>
            ))}
          </div>

          <div data-section="kpi-dashboard">
            <KPIDashboard 
              activeSection={activeSection} 
              isInvestorView={isInvestorView} 
              viewingSMEId={viewingSMEId}
              allData={allData}
              onCategoryClick={handleCategoryClick}
              financialYearStartMonth={financialYearStartMonth}
            />
          </div>
          
          <div data-section="productivity">
            <ProductivityMeasures 
              activeSection={activeSection} 
              isInvestorView={isInvestorView}
              onDataChange={handleDataChange}
              financialYearStartMonth={financialYearStartMonth}
            />
          </div>
          
          <div data-section="unit-cost">
            <UnitCost 
              activeSection={activeSection} 
              isInvestorView={isInvestorView}
              onDataChange={handleDataChange}
            />
          </div>
          
          <div data-section="order-fulfillment">
            <OrderFulfillment 
              activeSection={activeSection} 
              isInvestorView={isInvestorView}
              onDataChange={handleDataChange}
            />
          </div>
          
          <div data-section="tech-stack">
            <TechStackUsage 
              activeSection={activeSection} 
              isInvestorView={isInvestorView}
              onDataChange={handleDataChange}
            />
          </div>
          
          <div data-section="process-automation">
            <ProcessAutomation 
              activeSection={activeSection} 
              isInvestorView={isInvestorView}
              onDataChange={handleDataChange}
            />
          </div>
          
          <div data-section="customer-retention">
            <CustomerRetention 
              activeSection={activeSection} 
              isInvestorView={isInvestorView}
              onDataChange={handleDataChange}
              financialYearStartMonth={financialYearStartMonth}
            />
          </div>
          
          <div data-section="custom-kpis">
            <CustomKPIs 
              activeSection={activeSection} 
              isInvestorView={isInvestorView}
              onDataChange={handleDataChange}
              financialYearStartMonth={financialYearStartMonth}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default OperationalStrength