"use client"

import { useState, useEffect } from "react"
import { Bar, Line, Pie } from "react-chartjs-2"
import Sidebar from "smses/Sidebar/Sidebar"
import Header from "../DashboardHeader/DashboardHeader"
import { db, auth } from "../../firebaseConfig"
import { collection, getDocs, doc, getDoc, query, where, setDoc, addDoc, deleteDoc, orderBy } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
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

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend)

// ==================== HELPER FUNCTIONS ====================

const getMonthsForYear = (year, viewMode = "month") => {
  if (viewMode === "year") return [`FY ${year}`]
  if (viewMode === "quarter") return ["Q1", "Q2", "Q3", "Q4"]
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return months
}

const formatCurrency = (value, unit = "zar_million") => {
  const num = Number.parseFloat(value) || 0
  switch(unit) {
    case "zar": return `R${num.toLocaleString()}`
    case "zar_thousand": return `R${(num * 1000).toLocaleString()}K`
    case "zar_million": return `R${num.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}m`
    case "zar_billion": return `R${(num / 1000).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}bn`
    default: return `R${num.toLocaleString()}`
  }
}

const formatPercentage = (value) => {
  const num = Number.parseFloat(value) || 0
  return `${num.toFixed(1)}%`
}

const getMonthIndex = (month) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return months.indexOf(month)
}

const calculateAverage = (arr) => {
  if (!arr || arr.length === 0) return 0
  const valid = arr.filter(v => v !== "" && !isNaN(Number.parseFloat(v)))
  if (valid.length === 0) return 0
  return valid.reduce((sum, v) => sum + Number.parseFloat(v), 0) / valid.length
}

const calculateTotal = (items, monthIndex) => {
  if (!items || monthIndex < 0 || monthIndex >= 12) return 0
  return Object.values(items).reduce((sum, arr) => {
    if (!Array.isArray(arr) || arr.length <= monthIndex) return sum
    const val = Number.parseFloat(arr[monthIndex]) || 0
    return sum + val
  }, 0)
}

// ==================== COMPONENTS ====================

const EyeIcon = ({ onClick, title }) => (
  <div
    onClick={onClick}
    style={{
      position: "absolute",
      top: "10px",
      right: "10px",
      cursor: "pointer",
      width: "32px",
      height: "32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "50%",
      backgroundColor: "#fdfcfb",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      transition: "all 0.2s ease",
      zIndex: 10,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = "#e8ddd4"
      e.currentTarget.style.transform = "scale(1.1)"
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = "#fdfcfb"
      e.currentTarget.style.transform = "scale(1)"
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
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z"></path>
    </svg>
    {title && <span style={{ position: "absolute", top: "40px", right: "0", fontSize: "11px", color: "#5d4037", whiteSpace: "nowrap", backgroundColor: "#fdfcfb", padding: "4px 8px", borderRadius: "4px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", display: "none" }}>{title}</span>}
  </div>
)

const CalculationModal = ({ isOpen, onClose, title, calculation }) => {
  if (!isOpen) return null

  return (
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
        zIndex: 2000,
      }}
    >
      <div
        style={{
          backgroundColor: "#fdfcfb",
          padding: "30px",
          borderRadius: "8px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ color: "#5d4037", margin: 0 }}>{title} - Calculation</h3>
          <button
            onClick={onClose}
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
        <div style={{ backgroundColor: "#f5f0eb", padding: "20px", borderRadius: "6px" }}>
          <p style={{ color: "#5d4037", fontSize: "14px", lineHeight: "1.6", margin: 0, whiteSpace: "pre-wrap" }}>
            {calculation}
          </p>
        </div>
      </div>
    </div>
  )
}

const KeyQuestionBox = ({ question, signals, decisions, section }) => {
  const [showMore, setShowMore] = useState(false)
  
  const getFirstSentence = (text) => {
    const match = text.match(/^[^.!?]+[.!?]/)
    return match ? match[0] : text.split('.')[0] + '.'
  }
  
  return (
    <div
      style={{
        backgroundColor: "#DCDCDC",
        padding: "15px 20px",
        borderRadius: "8px",
        marginBottom: "20px",
        border: "1px solid #5d4037",
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
            See more
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
            See less
          </button>
        </>
      )}
    </div>
  )
}

// ==================== TREND MODAL COMPONENT ====================

const TrendModal = ({ isOpen, onClose, item, currencyUnit, generateLabels, aggregateDataForView, formatValue }) => {
  if (!isOpen || !item) return null

  const labels = generateLabels()
  
  const chartData = {
    labels,
    datasets: [
      {
        label: `${item.name} - Actual`,
        data: aggregateDataForView ? aggregateDataForView(item.actual) : item.actual,
        borderColor: "#5d4037",
        backgroundColor: "rgba(93, 64, 55, 0.1)",
        borderWidth: 3,
        fill: true,
        tension: 0.3,
      },
    ]
  }
  
  if (item.budget && Array.isArray(item.budget) && item.budget.some(v => parseFloat(v) !== 0)) {
    chartData.datasets.push({
      label: `${item.name} - Budget`,
      data: aggregateDataForView ? aggregateDataForView(item.budget) : item.budget,
      borderColor: "#f9a825",
      backgroundColor: "rgba(249, 168, 37, 0.1)",
      borderWidth: 2,
      borderDash: [5, 5],
      fill: false,
      tension: 0.3,
    })
  }

  // Calculate statistics
  const actualData = item.actual || []
  const validActualData = actualData.filter(v => !isNaN(parseFloat(v)) && parseFloat(v) !== 0)
  const currentValue = validActualData.length > 0 ? validActualData[validActualData.length - 1] : 0
  const averageValue = validActualData.length > 0 
    ? validActualData.reduce((a, b) => a + parseFloat(b), 0) / validActualData.length 
    : 0
  
  let trend = "N/A"
  if (validActualData.length >= 2) {
    const last = parseFloat(validActualData[validActualData.length - 1])
    const prev = parseFloat(validActualData[validActualData.length - 2])
    if (last > prev) trend = "↗ Increasing"
    else if (last < prev) trend = "↘ Decreasing"
    else trend = "→ Stable"
  }

  return (
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
          maxWidth: "900px",
          width: "95%",
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ color: "#5d4037", margin: 0 }}>{item.name} - Trend Analysis</h3>
          <button
            onClick={onClose}
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
        
        <div style={{ height: "400px", marginBottom: "20px" }}>
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { 
                  display: true,
                  position: "top",
                },
                title: { display: false },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const value = context.raw
                      return item.isPercentage
                        ? `${context.dataset.label}: ${parseFloat(value).toFixed(2)}%`
                        : `${context.dataset.label}: ${formatValue ? formatValue(value, currencyUnit) : value}`
                    },
                  },
                },
              },
              scales: {
                y: { 
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: item.isPercentage ? "Percentage (%)" : `Value`,
                    color: "#5d4037",
                  },
                },
                x: {
                  title: {
                    display: true,
                    text: "Time Period",
                    color: "#5d4037",
                  },
                },
              },
            }}
          />
        </div>

        {/* Trend Statistics */}
        <div style={{ 
          backgroundColor: "#f5f0eb", 
          padding: "20px", 
          borderRadius: "6px",
          marginBottom: "20px" 
        }}>
          <h4 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "16px" }}>Trend Statistics</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px" }}>
            <div>
              <div style={{ fontSize: "12px", color: "#8d6e63", marginBottom: "5px" }}>Current Value</div>
              <div style={{ fontSize: "16px", fontWeight: "600", color: "#5d4037" }}>
                {item.isPercentage 
                  ? `${parseFloat(currentValue).toFixed(1)}%`
                  : formatValue ? formatValue(currentValue, currencyUnit) : currentValue
                }
              </div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#8d6e63", marginBottom: "5px" }}>Average</div>
              <div style={{ fontSize: "16px", fontWeight: "600", color: "#5d4037" }}>
                {item.isPercentage
                  ? `${parseFloat(averageValue).toFixed(1)}%`
                  : formatValue ? formatValue(averageValue, currencyUnit) : averageValue
                }
              </div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#8d6e63", marginBottom: "5px" }}>Trend</div>
              <div style={{ fontSize: "16px", fontWeight: "600", color: "#5d4037" }}>
                {trend}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#8d6e63", marginBottom: "5px" }}>Data Points</div>
              <div style={{ fontSize: "16px", fontWeight: "600", color: "#5d4037" }}>
                {validActualData.length}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
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
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ==================== FINANCIAL DATA PULL HELPER ====================

// This function pulls financial data from the financial performance module
const pullFinancialData = async (userId) => {
  try {
    // Pull P&L data for revenue, labor costs, training spend
    const pnlDoc = await getDoc(doc(db, "financialData", `${userId}_pnlManual`))
    let revenueData = Array(12).fill(0)
    let laborCostData = Array(12).fill(0)
    let trainingSpendData = Array(12).fill(0)
    let marketingSpendData = Array(12).fill(0)
    let rAndDSpendData = Array(12).fill(0)
    
    if (pnlDoc.exists()) {
      const data = pnlDoc.data()
      revenueData = data.sales?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
      laborCostData = data.salaries?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
    }
    
    // Pull balance sheet data for employee counts and training metrics
    const capitalDoc = await getDoc(doc(db, "financialData", `${userId}_capitalStructure`))
    let employeeCountData = Array(12).fill(0)
    
    if (capitalDoc.exists()) {
      const data = capitalDoc.data()
      if (data.balanceSheetData?.assets?.additionalMetrics) {
        employeeCountData = data.balanceSheetData.assets.additionalMetrics.numberOfEmployees?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
        trainingSpendData = data.balanceSheetData.assets.additionalMetrics.trainingSpend?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
        marketingSpendData = data.balanceSheetData.assets.additionalMetrics.marketingSpend?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
        rAndDSpendData = data.balanceSheetData.assets.additionalMetrics.rAndDSpend?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
      }
    }
    
    return {
      revenue: revenueData,
      laborCost: laborCostData,
      employeeCount: employeeCountData,
      trainingSpend: trainingSpendData,
      marketingSpend: marketingSpendData,
      rAndDSpend: rAndDSpendData
    }
  } catch (error) {
    console.error("Error pulling financial data:", error)
    return {
      revenue: Array(12).fill(0),
      laborCost: Array(12).fill(0),
      employeeCount: Array(12).fill(0),
      trainingSpend: Array(12).fill(0),
      marketingSpend: Array(12).fill(0),
      rAndDSpend: Array(12).fill(0)
    }
  }
}

// ==================== UNIFIED DATA ENTRY MODAL ====================

const UnifiedDataEntryModal = ({ 
  isOpen, 
  onClose, 
  currentTab,
  user,
  onSave,
  loading 
}) => {
  const [activeModalTab, setActiveModalTab] = useState(currentTab)
  const [localData, setLocalData] = useState({})
  const [capabilityTrainingData, setCapabilityTrainingData] = useState({
    trainingSpendAmount: Array(12).fill(""),
    trainingSpendPercentage: Array(12).fill(""),
    trainingFocus: Array(12).fill(""),
  })
  const [employeeTrackingData, setEmployeeTrackingData] = useState([])
  const [stabilityData, setStabilityData] = useState({
    overallTurnover: Array(12).fill(""),
    workforceMovements: Array(12).fill(""),
    criticalRoleTurnover: Array(12).fill(""),
    contractorDependence: Array(12).fill(""),
  })
  const [terminationEntries, setTerminationEntries] = useState([])
  const [newTermination, setNewTermination] = useState({
    month: "Jan",
    reason: "",
    customReason: "",
    count: ""
  })
  const [employeeData, setEmployeeData] = useState({
    gender: { male: 60, female: 35, other: 5 },
    race: { african: 40, white: 30, colored: 15, indian: 10, other: 5 },
    age: { under25: 15, "25-34": 30, "35-44": 25, "45-54": 20, "55+": 10 },
    tenure: { under1: 20, "1-3": 35, "3-5": 25, "5-10": 15, "10+": 5 },
    education: { highSchool: 20, diploma: 25, degree: 40, postgraduate: 15 },
  })
  const [financialData, setFinancialData] = useState({
    revenue: Array(12).fill(0),
    laborCost: Array(12).fill(0),
    employeeCount: Array(12).fill(0),
    trainingSpend: Array(12).fill(0)
  })

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Predefined reasons for terminations
  const predefinedReasons = ["Performance", "Resignation", "Redundancy", "Misconduct", "Retirement", "Other"]

  // Tab structure for the modal
  const modalTabs = [
    { id: "execution-capacity", label: "Execution Capacity & Scalability" },
    { id: "productivity", label: "Productivity" },
    { id: "capability-training", label: "Capability & Training" },
    { id: "stability-continuity", label: "Stability & Continuity" },
    { id: "employee-composition", label: "Employee Composition" },
  ]

  // Fields for each tab
  const tabFields = {
    "execution-capacity": [
      {
        id: "founderLoad",
        label: "Founder operational load (1=low, 2=med, 3=high, 4=critical)",
        type: "select",
        options: [
          { value: "1", label: "Low" },
          { value: "2", label: "Medium" },
          { value: "3", label: "High" },
          { value: "4", label: "Critical" }
        ]
      },
      {
        id: "criticalFunctionsSinglePoint",
        label: "% of critical functions dependent on 1 person",
        type: "number",
        step: "0.1"
      },
      {
        id: "criticalRolesWith2IC",
        label: "% Critical roles/functions with 2IC",
        type: "number",
        step: "0.1"
      },
      {
        id: "spanOfControl",
        label: "Average span of control",
        type: "number",
        step: "0.01"
      }
    ],
    "productivity": [
      {
        id: "salesVolumePerEmployee",
        label: "Sales volume per employee (units)",
        type: "number",
        step: "0.01"
      },
      {
        id: "overtimeHours",
        label: "Overtime (hours)",
        type: "number",
        step: "0.01"
      }
    ],
    "capability-training": [
      {
        id: "trainingFocus",
        label: "Training focus",
        type: "select",
        options: [
          { value: "1", label: "Technical" },
          { value: "2", label: "Leadership" },
          { value: "3", label: "Compliance" }
        ]
      }
    ],
    "stability-continuity": [
      {
        id: "overallTurnover",
        label: "Overall turnover (% Annually)",
        type: "number",
        step: "0.01"
      },
      {
        id: "workforceMovements",
        label: "Workforce movements (number)",
        type: "number",
        step: "1"
      },
      {
        id: "criticalRoleTurnover",
        label: "Critical Role Turnover (%)",
        type: "number",
        step: "0.01"
      },
      {
        id: "contractorDependence",
        label: "Contractor dependence (%)",
        type: "number",
        step: "0.01"
      }
    ]
  }

  useEffect(() => {
    if (isOpen && user) {
      setActiveModalTab(currentTab)
      loadDataForTab(currentTab)
      loadFinancialData()
    }
  }, [isOpen, currentTab, user])

  const loadFinancialData = async () => {
    if (!user) return
    const data = await pullFinancialData(user.uid)
    setFinancialData(data)
    
    // Auto-calculate derived metrics from financial data
    if (activeModalTab === "productivity") {
      // Calculate revenue per employee from financial data
      const revenuePerEmployee = data.revenue.map((rev, i) => {
        const empCount = data.employeeCount[i] || 1
        return rev / empCount
      })
      
      setLocalData(prev => ({
        ...prev,
        revenuePerEmployee: revenuePerEmployee.map(v => v.toString())
      }))
    }
    
    if (activeModalTab === "capability-training") {
      // Calculate training spend % from financial data
      const trainingSpendPercentage = data.trainingSpend.map((spend, i) => {
        const laborCost = data.laborCost[i] || 1
        return (spend / laborCost) * 100
      })
      
      setCapabilityTrainingData(prev => ({
        ...prev,
        trainingSpendAmount: data.trainingSpend.map(v => v.toString()),
        trainingSpendPercentage: trainingSpendPercentage.map(v => v.toFixed(2).toString())
      }))
    }
  }

  const loadDataForTab = async (tabId) => {
    if (!user) return
    
    try {
      switch(tabId) {
        case "execution-capacity":
          const execDoc = await getDoc(doc(db, "peopleData", `${user.uid}_executionCapacity`))
          if (execDoc.exists()) {
            const data = execDoc.data()
            if (data.executionData) setLocalData(data.executionData)
          }
          break
        case "productivity":
          const prodDoc = await getDoc(doc(db, "peopleData", `${user.uid}_productivity`))
          if (prodDoc.exists()) {
            const data = prodDoc.data()
            if (data.productivityData) setLocalData(data.productivityData)
          }
          break
        case "capability-training":
          const capDoc = await getDoc(doc(db, "peopleData", `${user.uid}_capabilityTraining`))
          if (capDoc.exists()) {
            const data = capDoc.data()
            if (data.capabilityData) setCapabilityTrainingData(data.capabilityData)
          }
          
          const empDoc = await getDoc(doc(db, "peopleData", `${user.uid}_employeeTracking`))
          if (empDoc.exists()) {
            const data = empDoc.data()
            if (data.employees) setEmployeeTrackingData(data.employees)
          }
          break
        case "stability-continuity":
          const stabDoc = await getDoc(doc(db, "peopleData", `${user.uid}_stabilityContinuity`))
          if (stabDoc.exists()) {
            const data = stabDoc.data()
            if (data.stabilityData) setStabilityData(data.stabilityData)
          }
          
          const termDoc = await getDoc(doc(db, "peopleData", `${user.uid}_terminationData`))
          if (termDoc.exists()) {
            const data = termDoc.data()
            if (data.entries) setTerminationEntries(data.entries)
          }
          break
        case "employee-composition":
          const compDoc = await getDoc(doc(db, "peopleData", `${user.uid}_employeeComposition`))
          if (compDoc.exists()) {
            const data = compDoc.data()
            if (data.employeeData) setEmployeeData(data.employeeData)
          }
          break
      }
    } catch (error) {
      console.error(`Error loading data for ${tabId}:`, error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user) {
      alert("Please log in to save data")
      return
    }

    try {
      switch(activeModalTab) {
        case "execution-capacity":
          await setDoc(doc(db, "peopleData", `${user.uid}_executionCapacity`), {
            userId: user.uid,
            executionData: localData,
            lastUpdated: new Date().toISOString(),
          })
          break
        case "productivity":
          await setDoc(doc(db, "peopleData", `${user.uid}_productivity`), {
            userId: user.uid,
            productivityData: localData,
            lastUpdated: new Date().toISOString(),
          })
          break
        case "capability-training":
          await setDoc(doc(db, "peopleData", `${user.uid}_capabilityTraining`), {
            userId: user.uid,
            capabilityData: capabilityTrainingData,
            lastUpdated: new Date().toISOString(),
          })
          
          await setDoc(doc(db, "peopleData", `${user.uid}_employeeTracking`), {
            userId: user.uid,
            employees: employeeTrackingData,
            lastUpdated: new Date().toISOString(),
          })
          break
        case "stability-continuity":
          await setDoc(doc(db, "peopleData", `${user.uid}_stabilityContinuity`), {
            userId: user.uid,
            stabilityData: stabilityData,
            lastUpdated: new Date().toISOString(),
          })
          
          await setDoc(doc(db, "peopleData", `${user.uid}_terminationData`), {
            userId: user.uid,
            entries: terminationEntries,
            lastUpdated: new Date().toISOString(),
          })
          break
        case "employee-composition":
          await setDoc(doc(db, "peopleData", `${user.uid}_employeeComposition`), {
            userId: user.uid,
            employeeData: employeeData,
            lastUpdated: new Date().toISOString(),
          })
          break
      }
      
      onSave()
      onClose()
      alert("Data saved successfully!")
    } catch (error) {
      console.error("Error saving data:", error)
      alert("Error saving data. Please try again.")
    }
  }

  const addTerminationEntry = () => {
    if (!newTermination.reason || !newTermination.count || !newTermination.month) {
      alert("Please select month, reason, and enter count")
      return
    }

    const reasonToSave = newTermination.reason === "Other" ? newTermination.customReason : newTermination.reason
    
    if (!reasonToSave.trim()) {
      alert("Please specify the reason")
      return
    }

    const newEntry = {
      id: Date.now(),
      month: newTermination.month,
      reason: reasonToSave,
      count: Number.parseInt(newTermination.count) || 0,
      dateAdded: new Date().toISOString()
    }

    setTerminationEntries([...terminationEntries, newEntry])
    
    // Reset form
    setNewTermination({
      month: "Jan",
      reason: "",
      customReason: "",
      count: ""
    })
  }

  const removeTerminationEntry = (id) => {
    setTerminationEntries(terminationEntries.filter(entry => entry.id !== id))
  }

  const addEmployeeTrackingEntry = () => {
    const newEntry = {
      id: employeeTrackingData.length + 1,
      employee: `Employee ${employeeTrackingData.length + 1}`,
      skillsGap: { date: "", status: "No" },
      idp: { date: "", status: "No" },
      midTermReview: { date: "", status: "No" },
      annualReview: { date: "", status: "No" }
    }
    
    setEmployeeTrackingData([...employeeTrackingData, newEntry])
  }

  const removeEmployeeTrackingEntry = (index) => {
    const newData = employeeTrackingData.filter((_, i) => i !== index)
    setEmployeeTrackingData(newData)
  }

  if (!isOpen) return null

  return (
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
          padding: "20px",
          borderRadius: "8px",
          maxWidth: "1200px",
          maxHeight: "90vh",
          overflow: "auto",
          width: "95%",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ color: "#5d4037" }}>Add People Data</h3>
          <button
            onClick={onClose}
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

        {/* Tab Navigation inside Modal */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
          {modalTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveModalTab(tab.id)
                loadDataForTab(tab.id)
              }}
              style={{
                padding: "10px 20px",
                backgroundColor: activeModalTab === tab.id ? "#5d4037" : "#e8ddd4",
                color: activeModalTab === tab.id ? "#fdfcfb" : "#5d4037",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "20px", marginBottom: "20px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            <span style={{ color: "#5d4037", fontSize: "14px" }}>Select Year:</span>
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
          
          {/* Show Financial Data Source Notice */}
          {["productivity", "capability-training"].includes(activeModalTab) && (
            <div style={{ 
              padding: "8px 16px", 
              backgroundColor: "#e8f5e9", 
              borderRadius: "4px",
              color: "#2e7d32",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4M12 8h.01"></path>
              </svg>
              Some metrics are automatically pulled from Financial Performance
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div style={{ marginBottom: "30px" }}>
          {/* Execution Capacity & Productivity Tabs */}
          {["execution-capacity", "productivity", "stability-continuity"].includes(activeModalTab) && tabFields[activeModalTab] && (
            <div style={{ marginBottom: "30px", padding: "15px", backgroundColor: "#f5f0eb", borderRadius: "8px" }}>
              <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>Monthly Values</h4>
              {tabFields[activeModalTab].map((field) => (
                <div key={field.id} style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      color: "#5d4037",
                      fontWeight: "600",
                      marginBottom: "8px",
                      fontSize: "13px",
                    }}
                  >
                    {field.label}
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "5px" }}>
                    {months.map((month, idx) => (
                      <div key={month}>
                        <label style={{ fontSize: "10px", color: "#8d6e63", display: "block", marginBottom: "2px" }}>
                          {month}
                        </label>
                        {field.type === "select" ? (
                          <select
                            value={localData[field.id]?.[idx] || ""}
                            onChange={(e) => {
                              const newData = { ...localData }
                              if (!newData[field.id]) newData[field.id] = Array(12).fill("")
                              newData[field.id][idx] = e.target.value
                              setLocalData(newData)
                            }}
                            style={{
                              width: "100%",
                              padding: "6px",
                              borderRadius: "4px",
                              border: "1px solid #e8ddd4",
                              fontSize: "12px",
                              backgroundColor: "#fff",
                            }}
                          >
                            <option value="">Select</option>
                            {field.options.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="number"
                            step={field.step || "0.01"}
                            value={localData[field.id]?.[idx] || ""}
                            onChange={(e) => {
                              const newData = { ...localData }
                              if (!newData[field.id]) newData[field.id] = Array(12).fill("")
                              newData[field.id][idx] = e.target.value
                              setLocalData(newData)
                            }}
                            style={{
                              width: "100%",
                              padding: "6px",
                              borderRadius: "4px",
                              border: "1px solid #e8ddd4",
                              fontSize: "12px",
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Auto-calculated metrics from Financial Data - Read Only */}
              {activeModalTab === "productivity" && (
                <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#e8f5e9", borderRadius: "6px" }}>
                  <h5 style={{ color: "#2e7d32", marginBottom: "10px", fontSize: "14px" }}>
                    Auto-calculated from Financial Performance
                  </h5>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "5px", marginBottom: "10px" }}>
                    {months.map((month, idx) => (
                      <div key={month}>
                        <label style={{ fontSize: "10px", color: "#2e7d32", display: "block", marginBottom: "2px" }}>
                          {month}
                        </label>
                        <input
                          type="number"
                          value={localData.revenuePerEmployee?.[idx] || (financialData.revenue && financialData.employeeCount ? 
                            (financialData.revenue[idx] / (financialData.employeeCount[idx] || 1)).toFixed(2) : "")}
                          readOnly
                          style={{
                            width: "100%",
                            padding: "6px",
                            borderRadius: "4px",
                            border: "1px solid #a5d6a7",
                            fontSize: "12px",
                            backgroundColor: "#f1f8e9",
                            color: "#1e5a1e",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: "12px", color: "#2e7d32" }}>
                    Revenue per Employee = Revenue ÷ Number of Employees
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Capability & Training Tab */}
          {activeModalTab === "capability-training" && (
            <>
              {/* Training Data */}
              <div style={{ marginBottom: "30px", padding: "15px", backgroundColor: "#f5f0eb", borderRadius: "8px" }}>
                <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>Training Data - Monthly Values</h4>
                
                {/* Training Spend Amount - Auto-populated from Financial */}
                <div style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      color: "#5d4037",
                      fontWeight: "600",
                      marginBottom: "8px",
                      fontSize: "13px",
                    }}
                  >
                    Training Spend (R) - From Financial Performance
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "5px" }}>
                    {months.map((month, idx) => (
                      <div key={month}>
                        <label style={{ fontSize: "10px", color: "#8d6e63", display: "block", marginBottom: "2px" }}>
                          {month}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={capabilityTrainingData.trainingSpendAmount?.[idx] || financialData.trainingSpend?.[idx]?.toString() || ""}
                          onChange={(e) => {
                            const newData = { ...capabilityTrainingData }
                            if (!newData.trainingSpendAmount) newData.trainingSpendAmount = Array(12).fill("")
                            newData.trainingSpendAmount[idx] = e.target.value
                            setCapabilityTrainingData(newData)
                          }}
                          style={{
                            width: "100%",
                            padding: "6px",
                            borderRadius: "4px",
                            border: "1px solid #e8ddd4",
                            fontSize: "12px",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Training Spend Percentage - Auto-calculated */}
                <div style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      color: "#5d4037",
                      fontWeight: "600",
                      marginBottom: "8px",
                      fontSize: "13px",
                    }}
                  >
                    Training Spend (% of payroll) - Auto-calculated
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "5px" }}>
                    {months.map((month, idx) => {
                      const spend = parseFloat(capabilityTrainingData.trainingSpendAmount?.[idx] || financialData.trainingSpend?.[idx] || 0)
                      const labor = parseFloat(financialData.laborCost?.[idx] || 1)
                      const percentage = labor > 0 ? (spend / labor) * 100 : 0
                      
                      return (
                        <div key={month}>
                          <label style={{ fontSize: "10px", color: "#8d6e63", display: "block", marginBottom: "2px" }}>
                            {month}
                          </label>
                          <input
                            type="number"
                            value={percentage.toFixed(2)}
                            readOnly
                            style={{
                              width: "100%",
                              padding: "6px",
                              borderRadius: "4px",
                              border: "1px solid #a5d6a7",
                              fontSize: "12px",
                              backgroundColor: "#f1f8e9",
                              color: "#1e5a1e",
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                {tabFields[activeModalTab].map((field) => (
                  <div key={field.id} style={{ marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "block",
                        color: "#5d4037",
                        fontWeight: "600",
                        marginBottom: "8px",
                        fontSize: "13px",
                      }}
                    >
                      {field.label}
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "5px" }}>
                      {months.map((month, idx) => (
                        <div key={month}>
                          <label style={{ fontSize: "10px", color: "#8d6e63", display: "block", marginBottom: "2px" }}>
                            {month}
                          </label>
                          {field.type === "select" ? (
                            <select
                              value={capabilityTrainingData[field.id]?.[idx] || ""}
                              onChange={(e) => {
                                const newData = { ...capabilityTrainingData }
                                if (!newData[field.id]) newData[field.id] = Array(12).fill("")
                                newData[field.id][idx] = e.target.value
                                setCapabilityTrainingData(newData)
                              }}
                              style={{
                                width: "100%",
                                padding: "6px",
                                borderRadius: "4px",
                                border: "1px solid #e8ddd4",
                                fontSize: "12px",
                                backgroundColor: "#fff",
                              }}
                            >
                              <option value="">Select</option>
                              {field.options.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="number"
                              step={field.step || "0.01"}
                              value={capabilityTrainingData[field.id]?.[idx] || ""}
                              onChange={(e) => {
                                const newData = { ...capabilityTrainingData }
                                if (!newData[field.id]) newData[field.id] = Array(12).fill("")
                                newData[field.id][idx] = e.target.value
                                setCapabilityTrainingData(newData)
                              }}
                              style={{
                                width: "100%",
                                padding: "6px",
                                borderRadius: "4px",
                                border: "1px solid #e8ddd4",
                                fontSize: "12px",
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Employee Tracking */}
              <div style={{ marginBottom: "30px", padding: "15px", backgroundColor: "#f5f0eb", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <h4 style={{ color: "#5d4037", margin: 0 }}>Employee Development Tracking</h4>
                  <button
                    onClick={addEmployeeTrackingEntry}
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
                    + Add Employee
                  </button>
                </div>

                {employeeTrackingData.map((employee, index) => (
                  <div key={employee.id || index} style={{ marginBottom: "30px", padding: "20px", backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #e8ddd4" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                      <input
                        type="text"
                        value={employee.employee}
                        onChange={(e) => {
                          const newData = [...employeeTrackingData]
                          newData[index].employee = e.target.value
                          setEmployeeTrackingData(newData)
                        }}
                        placeholder="Employee Name"
                        style={{
                          padding: "10px",
                          borderRadius: "4px",
                          border: "1px solid #e8ddd4",
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#5d4037",
                          width: "300px",
                        }}
                      />
                      <button
                        onClick={() => removeEmployeeTrackingEntry(index)}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#f44336",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "13px",
                        }}
                      >
                        Remove
                      </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
                      {/* Skills Gap Assessment */}
                      <div>
                        <h5 style={{ color: "#5d4037", marginBottom: "10px", fontSize: "14px" }}>Skills Gap Assessment</h5>
                        <input
                          type="date"
                          value={employee.skillsGap?.date || ""}
                          onChange={(e) => {
                            const newData = [...employeeTrackingData]
                            if (!newData[index].skillsGap) newData[index].skillsGap = {}
                            newData[index].skillsGap.date = e.target.value
                            setEmployeeTrackingData(newData)
                          }}
                          style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #e8ddd4",
                            marginBottom: "10px",
                          }}
                        />
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            onClick={() => {
                              const newData = [...employeeTrackingData]
                              if (!newData[index].skillsGap) newData[index].skillsGap = {}
                              newData[index].skillsGap.status = "Yes"
                              setEmployeeTrackingData(newData)
                            }}
                            style={{
                              flex: "1",
                              padding: "8px",
                              backgroundColor: employee.skillsGap?.status === "Yes" ? "#4caf50" : "#e8e8e8",
                              color: employee.skillsGap?.status === "Yes" ? "#fff" : "#5d4037",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => {
                              const newData = [...employeeTrackingData]
                              if (!newData[index].skillsGap) newData[index].skillsGap = {}
                              newData[index].skillsGap.status = "No"
                              setEmployeeTrackingData(newData)
                            }}
                            style={{
                              flex: "1",
                              padding: "8px",
                              backgroundColor: employee.skillsGap?.status === "No" ? "#f44336" : "#e8e8e8",
                              color: employee.skillsGap?.status === "No" ? "#fff" : "#5d4037",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            No
                          </button>
                        </div>
                      </div>

                      {/* IDP */}
                      <div>
                        <h5 style={{ color: "#5d4037", marginBottom: "10px", fontSize: "14px" }}>Individual Development Plan</h5>
                        <input
                          type="date"
                          value={employee.idp?.date || ""}
                          onChange={(e) => {
                            const newData = [...employeeTrackingData]
                            if (!newData[index].idp) newData[index].idp = {}
                            newData[index].idp.date = e.target.value
                            setEmployeeTrackingData(newData)
                          }}
                          style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #e8ddd4",
                            marginBottom: "10px",
                          }}
                        />
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            onClick={() => {
                              const newData = [...employeeTrackingData]
                              if (!newData[index].idp) newData[index].idp = {}
                              newData[index].idp.status = "Yes"
                              setEmployeeTrackingData(newData)
                            }}
                            style={{
                              flex: "1",
                              padding: "8px",
                              backgroundColor: employee.idp?.status === "Yes" ? "#4caf50" : "#e8e8e8",
                              color: employee.idp?.status === "Yes" ? "#fff" : "#5d4037",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => {
                              const newData = [...employeeTrackingData]
                              if (!newData[index].idp) newData[index].idp = {}
                              newData[index].idp.status = "No"
                              setEmployeeTrackingData(newData)
                            }}
                            style={{
                              flex: "1",
                              padding: "8px",
                              backgroundColor: employee.idp?.status === "No" ? "#f44336" : "#e8e8e8",
                              color: employee.idp?.status === "No" ? "#fff" : "#5d4037",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            No
                          </button>
                        </div>
                      </div>

                      {/* Mid-Term Review */}
                      <div>
                        <h5 style={{ color: "#5d4037", marginBottom: "10px", fontSize: "14px" }}>Mid-Term Performance Review</h5>
                        <input
                          type="date"
                          value={employee.midTermReview?.date || ""}
                          onChange={(e) => {
                            const newData = [...employeeTrackingData]
                            if (!newData[index].midTermReview) newData[index].midTermReview = {}
                            newData[index].midTermReview.date = e.target.value
                            setEmployeeTrackingData(newData)
                          }}
                          style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #e8ddd4",
                            marginBottom: "10px",
                          }}
                        />
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            onClick={() => {
                              const newData = [...employeeTrackingData]
                              if (!newData[index].midTermReview) newData[index].midTermReview = {}
                              newData[index].midTermReview.status = "Yes"
                              setEmployeeTrackingData(newData)
                            }}
                            style={{
                              flex: "1",
                              padding: "8px",
                              backgroundColor: employee.midTermReview?.status === "Yes" ? "#4caf50" : "#e8e8e8",
                              color: employee.midTermReview?.status === "Yes" ? "#fff" : "#5d4037",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => {
                              const newData = [...employeeTrackingData]
                              if (!newData[index].midTermReview) newData[index].midTermReview = {}
                              newData[index].midTermReview.status = "No"
                              setEmployeeTrackingData(newData)
                            }}
                            style={{
                              flex: "1",
                              padding: "8px",
                              backgroundColor: employee.midTermReview?.status === "No" ? "#f44336" : "#e8e8e8",
                              color: employee.midTermReview?.status === "No" ? "#fff" : "#5d4037",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            No
                          </button>
                        </div>
                      </div>

                      {/* Annual Review */}
                      <div>
                        <h5 style={{ color: "#5d4037", marginBottom: "10px", fontSize: "14px" }}>Annual Performance Review</h5>
                        <input
                          type="date"
                          value={employee.annualReview?.date || ""}
                          onChange={(e) => {
                            const newData = [...employeeTrackingData]
                            if (!newData[index].annualReview) newData[index].annualReview = {}
                            newData[index].annualReview.date = e.target.value
                            setEmployeeTrackingData(newData)
                          }}
                          style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #e8ddd4",
                            marginBottom: "10px",
                          }}
                        />
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            onClick={() => {
                              const newData = [...employeeTrackingData]
                              if (!newData[index].annualReview) newData[index].annualReview = {}
                              newData[index].annualReview.status = "Yes"
                              setEmployeeTrackingData(newData)
                            }}
                            style={{
                              flex: "1",
                              padding: "8px",
                              backgroundColor: employee.annualReview?.status === "Yes" ? "#4caf50" : "#e8e8e8",
                              color: employee.annualReview?.status === "Yes" ? "#fff" : "#5d4037",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => {
                              const newData = [...employeeTrackingData]
                              if (!newData[index].annualReview) newData[index].annualReview = {}
                              newData[index].annualReview.status = "No"
                              setEmployeeTrackingData(newData)
                            }}
                            style={{
                              flex: "1",
                              padding: "8px",
                              backgroundColor: employee.annualReview?.status === "No" ? "#f44336" : "#e8e8e8",
                              color: employee.annualReview?.status === "No" ? "#fff" : "#5d4037",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            No
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Termination Data for Stability & Continuity */}
          {activeModalTab === "stability-continuity" && (
            <div style={{ marginBottom: "30px", padding: "15px", backgroundColor: "#f5f0eb", borderRadius: "8px" }}>
              <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>Termination Records</h4>
              
              {/* Add New Termination Form */}
              <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#fff", borderRadius: "6px", border: "1px solid #e8ddd4" }}>
                <h5 style={{ color: "#5d4037", marginBottom: "15px" }}>Add New Termination Record</h5>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                  {/* Month Selection */}
                  <div>
                    <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>
                      Month
                    </label>
                    <select
                      value={newTermination.month}
                      onChange={(e) => setNewTermination({...newTermination, month: e.target.value})}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        fontSize: "13px",
                        color: "#5d4037",
                      }}
                    >
                      {months.map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </div>

                  {/* Reason Selection */}
                  <div>
                    <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>
                      Reason
                    </label>
                    <select
                      value={newTermination.reason}
                      onChange={(e) => setNewTermination({...newTermination, reason: e.target.value})}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        fontSize: "13px",
                        color: "#5d4037",
                      }}
                    >
                      <option value="">Select a reason</option>
                      {predefinedReasons.map(reason => (
                        <option key={reason} value={reason}>{reason}</option>
                      ))}
                    </select>
                  </div>

                  {/* Count Input */}
                  <div>
                    <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>
                      Number of People
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newTermination.count}
                      onChange={(e) => setNewTermination({...newTermination, count: e.target.value})}
                      placeholder="0"
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        fontSize: "13px",
                        color: "#5d4037",
                      }}
                    />
                  </div>
                </div>

                {/* Custom Reason (if Other is selected) */}
                {newTermination.reason === "Other" && (
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>
                      Specify Reason
                    </label>
                    <input
                      type="text"
                      value={newTermination.customReason}
                      onChange={(e) => setNewTermination({...newTermination, customReason: e.target.value})}
                      placeholder="Enter custom reason..."
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        fontSize: "13px",
                        color: "#5d4037",
                      }}
                    />
                  </div>
                )}

                <button
                  onClick={addTerminationEntry}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#5d4037",
                    color: "#fdfcfb",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px",
                  }}
                >
                  + Add Termination Record
                </button>
              </div>

              {/* Current Termination Entries */}
              <div>
                <h5 style={{ color: "#5d4037", marginBottom: "15px" }}>Current Termination Records ({terminationEntries.length})</h5>
                
                {terminationEntries.length > 0 ? (
                  <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {terminationEntries.map((entry, index) => (
                      <div key={entry.id} style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px",
                        marginBottom: "8px",
                        backgroundColor: index % 2 === 0 ? "#fdfcfb" : "#f5f0eb",
                        borderRadius: "6px",
                        border: "1px solid #e8ddd4"
                      }}>
                        <div>
                          <span style={{ color: "#5d4037", fontWeight: "600", marginRight: "10px" }}>{entry.month}</span>
                          <span style={{ color: "#5d4037", marginRight: "10px" }}>{entry.reason}</span>
                          <span style={{
                            padding: "2px 6px",
                            backgroundColor: "#e3f2fd",
                            color: "#1565c0",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "600"
                          }}>
                            {entry.count} person{entry.count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <button
                          onClick={() => removeTerminationEntry(entry.id)}
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#f44336",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "11px",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: "20px", textAlign: "center", color: "#8d6e63", backgroundColor: "#fff", borderRadius: "6px" }}>
                    No termination records added yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Employee Composition Tab */}
          {activeModalTab === "employee-composition" && (
            <div style={{ marginBottom: "30px" }}>
              {Object.keys(employeeData).map((category) => (
                <div key={category} style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f5f0eb", borderRadius: "8px" }}>
                  <h4 style={{ color: "#5d4037", marginBottom: "10px" }}>
                    {category.charAt(0).toUpperCase() + category.slice(1)} Distribution (%)
                  </h4>
                  {Object.keys(employeeData[category]).map((item) => (
                    <div key={item} style={{ marginBottom: "10px" }}>
                      <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px" }}>
                        {item}:
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={employeeData[category][item]}
                        onChange={(e) => {
                          const newData = { ...employeeData }
                          newData[category][item] = Number.parseFloat(e.target.value) || 0
                          setEmployeeData(newData)
                        }}
                        style={{
                          width: "100%",
                          padding: "8px",
                          borderRadius: "4px",
                          border: "1px solid #e8ddd4",
                        }}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
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
            onClick={handleSubmit}
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
  )
}

// ==================== EXECUTION CAPACITY COMPONENT ====================

const ExecutionCapacity = ({ activeSection, user, isInvestorView }) => {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedViewMode, setSelectedViewMode] = useState("month")
  const [expandedNotes, setExpandedNotes] = useState({})
  const [kpiNotes, setKpiNotes] = useState({})
  const [kpiAnalysis, setKpiAnalysis] = useState({})
  const [showTrendModal, setShowTrendModal] = useState(false)
  const [selectedTrendItem, setSelectedTrendItem] = useState(null)
  const [showCalculationModal, setShowCalculationModal] = useState(false)
  const [selectedCalculation, setSelectedCalculation] = useState({ title: "", calculation: "" })
  
  // Data structure for execution capacity KPIs
  const [executionData, setExecutionData] = useState({
    founderLoad: Array(12).fill(""), // low=1, med=2, high=3, critical=4
    criticalFunctionsSinglePoint: Array(12).fill(""), // percentage
    criticalRolesWith2IC: Array(12).fill(""), // percentage
    spanOfControl: Array(12).fill(""), // average number
  })

  const months = getMonthsForYear(selectedYear, "month")
  const years = Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i)

  useEffect(() => {
    if (user) {
      loadExecutionData()
    }
  }, [user])

  const loadExecutionData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const executionDoc = await getDoc(doc(db, "peopleData", `${user.uid}_executionCapacity`))
      if (executionDoc.exists()) {
        const data = executionDoc.data()
        if (data.executionData) setExecutionData(data.executionData)
        if (data.kpiNotes) setKpiNotes(data.kpiNotes)
        if (data.kpiAnalysis) setKpiAnalysis(data.kpiAnalysis)
      }
    } catch (error) {
      console.error("Error loading execution capacity data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Helper functions
  const generateLabels = () => {
    if (selectedViewMode === "month") {
      return months
    } else if (selectedViewMode === "quarter") {
      return ["Q1", "Q2", "Q3", "Q4"]
    } else {
      return [selectedYear.toString()]
    }
  }

  const aggregateDataForView = (data) => {
    if (!data) return []
    
    if (selectedViewMode === "month") {
      return data.map(val => Number.parseFloat(val) || 0)
    } else if (selectedViewMode === "quarter") {
      const quarters = []
      for (let i = 0; i < 4; i++) {
        const sum = data.slice(i * 3, i * 3 + 3).reduce((acc, val) => acc + (Number.parseFloat(val) || 0), 0)
        quarters.push(sum / 3) // Average for quarter
      }
      return quarters
    } else {
      const yearlyAvg = data.reduce((acc, val) => acc + (Number.parseFloat(val) || 0), 0) / data.length
      return [yearlyAvg]
    }
  }

  const formatValue = (value) => {
    const num = Number.parseFloat(value) || 0
    return num.toFixed(1)
  }

  // Status calculation based on values
  const getStatus = (value, type) => {
    if (!value && value !== 0) return { text: "Not Set", color: "#f5f5f5", textColor: "#5d4037" }
    
    const numValue = Number.parseFloat(value)
    
    switch(type) {
      case "founderLoad":
        if (value === "1") return { text: "Low", color: "#4caf50", textColor: "#fff" }
        if (value === "2") return { text: "Medium", color: "#ff9800", textColor: "#fff" }
        if (value === "3") return { text: "High", color: "#f44336", textColor: "#fff" }
        if (value === "4") return { text: "Critical", color: "#d32f2f", textColor: "#fff" }
        return { text: "Not Set", color: "#f5f5f5", textColor: "#5d4037" }
      
      case "criticalFunctionsSinglePoint":
        if (numValue < 20) return { text: "Low Risk", color: "#4caf50", textColor: "#fff" }
        if (numValue <= 40) return { text: "Medium Risk", color: "#ff9800", textColor: "#fff" }
        if (numValue <= 60) return { text: "High Risk", color: "#f44336", textColor: "#fff" }
        return { text: "Critical Risk", color: "#d32f2f", textColor: "#fff" }
      
      case "criticalRolesWith2IC":
        if (numValue >= 80) return { text: "Strong", color: "#4caf50", textColor: "#fff" }
        if (numValue >= 60) return { text: "Adequate", color: "#ff9800", textColor: "#fff" }
        if (numValue >= 40) return { text: "Weak", color: "#f44336", textColor: "#fff" }
        return { text: "Critical", color: "#d32f2f", textColor: "#fff" }
      
      case "spanOfControl":
        if (numValue >= 5 && numValue <= 8) return { text: "Optimal", color: "#4caf50", textColor: "#fff" }
        if (numValue < 3 || numValue > 12) return { text: "Critical", color: "#d32f2f", textColor: "#fff" }
        if (numValue < 5 || numValue > 8) return { text: "Review", color: "#ff9800", textColor: "#fff" }
        return { text: "Not Set", color: "#f5f5f5", textColor: "#5d4037" }
      
      default:
        return { text: "Not Set", color: "#f5f5f5", textColor: "#5d4037" }
    }
  }

  const handleCalculationClick = (title, calculation) => {
    setSelectedCalculation({ title, calculation })
    setShowCalculationModal(true)
  }

  const openTrendModal = (itemName, dataArray, isPercentage = false) => {
    const actualData = Array.isArray(dataArray) 
      ? dataArray.map(v => parseFloat(v) || 0)
      : Array(12).fill(0)
    
    setSelectedTrendItem({ 
      name: itemName, 
      actual: actualData,
      budget: null,
      isPercentage 
    })
    setShowTrendModal(true)
  }

  const renderKPICard = (title, data, kpiKey, unit = "", isPercentage = false, calculation = "") => {
    const monthIndex = months.indexOf(selectedViewMode === "month" ? selectedViewMode : "Jan")
    const currentValue = Number.parseFloat(data[monthIndex >= 0 ? monthIndex : 0]) || 0
    const status = getStatus(currentValue.toString(), kpiKey)
    
    return (
      <div
        style={{
          backgroundColor: "#fdfcfb",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          marginBottom: "20px",
          position: "relative",
        }}
      >
        <EyeIcon 
          onClick={() => handleCalculationClick(title, calculation)} 
        />
        
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
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "#5d4037" }}>
                {isPercentage ? `${currentValue.toFixed(1)}%` : 
                 kpiKey === "spanOfControl" ? currentValue.toFixed(1) :
                 kpiKey === "founderLoad" ? 
                   currentValue === 1 ? "Low" : 
                   currentValue === 2 ? "Med" : 
                   currentValue === 3 ? "High" : 
                   currentValue === 4 ? "Critical" : "Not Set" :
                 currentValue.toFixed(1)}
              </div>
              <div style={{ fontSize: "11px", color: "#8d6e63" }}>Current</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ color: "#5d4037", marginBottom: "5px", fontSize: "16px" }}>{title}</h4>
            <div
              style={{
                display: "inline-block",
                padding: "4px 8px",
                backgroundColor: status.color,
                color: status.textColor,
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: "600",
                marginTop: "5px",
              }}
            >
              {status.text}
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #e8ddd4", paddingTop: "15px" }}>
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <button
              onClick={() => setExpandedNotes(prev => ({ ...prev, [kpiKey]: !prev[kpiKey] }))}
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
              Add notes
            </button>
            <button
              onClick={() => setExpandedNotes(prev => ({ ...prev, [`${kpiKey}_analysis`]: !prev[`${kpiKey}_analysis`] }))}
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
            <button
              onClick={() => openTrendModal(title, data, isPercentage)}
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
              View trend
            </button>
          </div>

          {expandedNotes[kpiKey] && (
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
                value={kpiNotes[kpiKey] || ""}
                onChange={(e) => setKpiNotes(prev => ({ ...prev, [kpiKey]: e.target.value }))}
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

          {expandedNotes[`${kpiKey}_analysis`] && (
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
                {kpiAnalysis[kpiKey] ||
                  `Based on current ${title.toLowerCase()} of ${isPercentage ? `${currentValue.toFixed(1)}%` : currentValue.toFixed(1)}:
                  \n\nThis metric indicates your ${title.toLowerCase()} position. ${status.text === "Critical" || status.text === "High Risk" ? "Immediate attention required." : "Monitor regularly."}
                  \n\nRecommended actions:
                  \n• ${kpiKey === "founderLoad" ? "Consider delegating responsibilities or hiring leadership" : 
                       kpiKey === "criticalFunctionsSinglePoint" ? "Develop backup plans for single-point dependencies" :
                       kpiKey === "criticalRolesWith2IC" ? "Invest in developing successors for key roles" :
                       kpiKey === "spanOfControl" ? "Review organizational structure and reporting lines" :
                       "Review and optimize this metric"}
                  \n• Set improvement targets
                  \n• Track progress monthly`}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderFounderLoadTable = () => {
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h4 style={{ color: "#5d4037", marginBottom: "5px", fontSize: "16px" }}>Founder Operational Load</h4>
          <EyeIcon 
            onClick={() => handleCalculationClick(
              "Founder Operational Load", 
              "Founder Operational Load measures the level of dependency on founders for daily operations.\n\n" +
              "Scale:\n• 1 = Low: Founder focused on strategy, operations delegated\n" +
              "• 2 = Medium: Founder involved in key decisions\n" +
              "• 3 = High: Founder critical to daily operations\n" +
              "• 4 = Critical: Business cannot operate without founder\n\n" +
              "Target: Maintain at Level 1-2 to ensure scalability."
            )} 
          />
        </div>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#e8ddd4" }}>
                <th style={{ padding: "10px", textAlign: "left", color: "#5d4037", fontSize: "12px" }}>Month</th>
                {months.map((month, idx) => (
                  <th key={month} style={{ padding: "10px", textAlign: "center", color: "#5d4037", fontSize: "12px" }}>
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "10px", color: "#5d4037", fontSize: "12px", fontWeight: "600" }}>
                  Load Level
                </td>
                {months.map((month, idx) => {
                  const value = executionData.founderLoad[idx]
                  const status = getStatus(value, "founderLoad")
                  
                  return (
                    <td key={month} style={{ padding: "10px", textAlign: "center" }}>
                      <div
                        style={{
                          padding: "8px 4px",
                          backgroundColor: status.color,
                          color: status.textColor,
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "600",
                          minWidth: "60px",
                        }}
                      >
                        {status.text}
                      </div>
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
        
        <div style={{ marginTop: "15px", color: "#8d6e63", fontSize: "12px" }}>
          <strong>Calculation:</strong> Founder Operational Load is assessed on a scale of 1-4 based on founder involvement in daily operations.
          <br />
          <strong>Target:</strong> Low to Medium (1-2) for scalable businesses.
        </div>
      </div>
    )
  }

  const renderSpanOfControlTable = () => {
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h4 style={{ color: "#5d4037", marginBottom: "5px", fontSize: "16px" }}>Average Span of Control</h4>
          <EyeIcon 
            onClick={() => handleCalculationClick(
              "Span of Control", 
              "Span of Control measures the number of direct reports per manager.\n\n" +
              "Calculation: Total number of non-manager employees ÷ Total number of managers\n\n" +
              "Guidelines:\n• Optimal: 5-8 direct reports\n• Review: <3 or >8 direct reports\n• Critical: <3 or >12 direct reports\n\n" +
              "Too narrow (<3): Top-heavy structure, high management costs\n" +
              "Too wide (>8): Managers may be overstretched\n" +
              "Optimal range: Balance of supervision and efficiency"
            )} 
          />
        </div>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#e8ddd4" }}>
                <th style={{ padding: "10px", textAlign: "left", color: "#5d4037", fontSize: "12px" }}>Month</th>
                {months.map((month, idx) => (
                  <th key={month} style={{ padding: "10px", textAlign: "center", color: "#5d4037", fontSize: "12px" }}>
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "10px", color: "#5d4037", fontSize: "12px", fontWeight: "600" }}>
                  Average Number
                </td>
                {months.map((month, idx) => {
                  const value = executionData.spanOfControl[idx]
                  const status = getStatus(value, "spanOfControl")
                  
                  return (
                    <td key={month} style={{ padding: "10px", textAlign: "center" }}>
                      <div
                        style={{
                          padding: "8px 4px",
                          backgroundColor: status.color,
                          color: status.textColor,
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "600",
                          minWidth: "60px",
                        }}
                      >
                        {value ? `${Number.parseFloat(value).toFixed(1)} (${status.text})` : "Not Set"}
                      </div>
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
        
        <div style={{ marginTop: "15px", color: "#8d6e63", fontSize: "12px" }}>
          <strong>Guidelines:</strong> Optimal: 5-8 | Review: &lt;3 or &gt;8 | Critical: &lt;3 or &gt;12
        </div>
      </div>
    )
  }

  if (activeSection !== "execution-capacity") return null

  return (
    <div style={{ paddingTop: "20px" }}>
      <KeyQuestionBox
        question="Is leadership overstretched? Is the current team sufficient to deliver the existing and near-term workload?"
        signals="Founder bottleneck, capacity strain, single points of failure"
        decisions="Redesign organization, de-risk key roles, hire leadership"
        section="execution-capacity"
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <h2 style={{ color: "#5d4037", fontSize: "24px", fontWeight: "700" }}>Execution Capacity & Scalability</h2>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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
          </div>
          
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={() => setSelectedViewMode("month")}
              style={{
                padding: "8px 16px",
                backgroundColor: selectedViewMode === "month" ? "#5d4037" : "#e8ddd4",
                color: selectedViewMode === "month" ? "#fdfcfb" : "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedViewMode("quarter")}
              style={{
                padding: "8px 16px",
                backgroundColor: selectedViewMode === "quarter" ? "#5d4037" : "#e8ddd4",
                color: selectedViewMode === "quarter" ? "#fdfcfb" : "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              Quarterly
            </button>
            <button
              onClick={() => setSelectedViewMode("year")}
              style={{
                padding: "8px 16px",
                backgroundColor: selectedViewMode === "year" ? "#5d4037" : "#e8ddd4",
                color: selectedViewMode === "year" ? "#fdfcfb" : "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              Yearly
            </button>
          </div>
          
          {!isInvestorView && (
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
                whiteSpace: "nowrap",
              }}
            >
              Add Data
            </button>
          )}
        </div>
      </div>

      {/* Founder Load Table */}
      {renderFounderLoadTable()}

      {/* Average Span of Control Table */}
      {renderSpanOfControlTable()}

      {/* KPI Cards - 2 per row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "30px" }}>
        {renderKPICard(
          "% Critical Functions Dependent on 1 Person", 
          executionData.criticalFunctionsSinglePoint, 
          "criticalFunctionsSinglePoint", 
          "", 
          true,
          "Critical Functions Single Point of Failure measures the percentage of key business functions that rely on a single individual.\n\n" +
          "Calculation: (Number of critical functions dependent on 1 person ÷ Total critical functions) × 100%\n\n" +
          "Risk Levels:\n• <20%: Low Risk - Adequate redundancy\n• 20-40%: Medium Risk - Some vulnerability\n• 40-60%: High Risk - Significant vulnerability\n• >60%: Critical Risk - Business continuity at risk\n\n" +
          "Target: <20% to ensure business continuity."
        )}
        {renderKPICard(
          "% Critical Roles with 2IC", 
          executionData.criticalRolesWith2IC, 
          "criticalRolesWith2IC", 
          "", 
          true,
          "Critical Roles with Second-in-Command measures leadership succession readiness.\n\n" +
          "Calculation: (Number of critical roles with identified successor ÷ Total critical roles) × 100%\n\n" +
          "Health Levels:\n• >80%: Strong - Good succession planning\n• 60-80%: Adequate - Some coverage\n• 40-60%: Weak - Significant gaps\n• <40%: Critical - No succession plan\n\n" +
          "Target: >80% for organizational resilience."
        )}
      </div>

      {/* Unified Data Entry Modal */}
      <UnifiedDataEntryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentTab="execution-capacity"
        user={user}
        onSave={loadExecutionData}
        loading={loading}
      />

      {/* Calculation Modal */}
      <CalculationModal
        isOpen={showCalculationModal}
        onClose={() => setShowCalculationModal(false)}
        title={selectedCalculation.title}
        calculation={selectedCalculation.calculation}
      />

      {/* Trend Modal */}
      {showTrendModal && (
        <TrendModal
          isOpen={showTrendModal}
          onClose={() => setShowTrendModal(false)}
          item={selectedTrendItem}
          currencyUnit="zar"
          generateLabels={generateLabels}
          aggregateDataForView={aggregateDataForView}
          formatValue={formatValue}
        />
      )}
    </div>
  )
}

// ==================== PRODUCTIVITY COMPONENT ====================

const Productivity = ({ activeSection, user, isInvestorView }) => {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedViewMode, setSelectedViewMode] = useState("month")
  const [expandedNotes, setExpandedNotes] = useState({})
  const [kpiNotes, setKpiNotes] = useState({})
  const [kpiAnalysis, setKpiAnalysis] = useState({})
  const [showTrendModal, setShowTrendModal] = useState(false)
  const [selectedTrendItem, setSelectedTrendItem] = useState(null)
  const [showCalculationModal, setShowCalculationModal] = useState(false)
  const [selectedCalculation, setSelectedCalculation] = useState({ title: "", calculation: "" })
  const [currencyUnit, setCurrencyUnit] = useState("zar_million")
  
  // Data structure for productivity KPIs
  const [productivityData, setProductivityData] = useState({
    salesVolumePerEmployee: Array(12).fill(""),
    revenuePerEmployee: Array(12).fill(""),
    laborCostPercentage: Array(12).fill(""),
    overtimeHours: Array(12).fill(""),
  })
  
  // Financial data pulled from Financial Performance
  const [financialData, setFinancialData] = useState({
    revenue: Array(12).fill(0),
    laborCost: Array(12).fill(0),
    employeeCount: Array(12).fill(1)
  })

  const months = getMonthsForYear(selectedYear, "month")
  const years = Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i)

  useEffect(() => {
    if (user) {
      loadProductivityData()
      loadFinancialData()
    }
  }, [user])

  const loadProductivityData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const productivityDoc = await getDoc(doc(db, "peopleData", `${user.uid}_productivity`))
      if (productivityDoc.exists()) {
        const data = productivityDoc.data()
        if (data.productivityData) setProductivityData(data.productivityData)
        if (data.kpiNotes) setKpiNotes(data.kpiNotes)
        if (data.kpiAnalysis) setKpiAnalysis(data.kpiAnalysis)
      }
    } catch (error) {
      console.error("Error loading productivity data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadFinancialData = async () => {
    if (!user) return
    const data = await pullFinancialData(user.uid)
    setFinancialData(data)
    
    // Calculate revenue per employee from financial data
    const revenuePerEmployee = data.revenue.map((rev, i) => {
      const empCount = data.employeeCount[i] || 1
      return rev / empCount
    })
    
    // Calculate labor cost percentage
    const laborCostPercentage = data.revenue.map((rev, i) => {
      if (rev === 0) return 0
      return (data.laborCost[i] / rev) * 100
    })
    
    setProductivityData(prev => ({
      ...prev,
      revenuePerEmployee: revenuePerEmployee.map(v => v.toString()),
      laborCostPercentage: laborCostPercentage.map(v => v.toFixed(2).toString())
    }))
  }

  const generateLabels = () => {
    if (selectedViewMode === "month") {
      return months
    } else if (selectedViewMode === "quarter") {
      return ["Q1", "Q2", "Q3", "Q4"]
    } else {
      return [selectedYear.toString()]
    }
  }

  const aggregateDataForView = (data) => {
    if (!data) return []
    
    if (selectedViewMode === "month") {
      return data.map(val => Number.parseFloat(val) || 0)
    } else if (selectedViewMode === "quarter") {
      const quarters = []
      for (let i = 0; i < 4; i++) {
        const sum = data.slice(i * 3, i * 3 + 3).reduce((acc, val) => acc + (Number.parseFloat(val) || 0), 0)
        quarters.push(sum / 3)
      }
      return quarters
    } else {
      const yearlyAvg = data.reduce((acc, val) => acc + (Number.parseFloat(val) || 0), 0) / data.length
      return [yearlyAvg]
    }
  }

  const formatValue = (value, unit = currencyUnit) => {
    const num = Number.parseFloat(value) || 0
    switch(unit) {
      case "zar": return `R${num.toLocaleString()}`
      case "zar_thousand": return `R${(num * 1000).toLocaleString()}K`
      case "zar_million": return `R${num.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}m`
      case "zar_billion": return `R${(num / 1000).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}bn`
      default: return `R${num.toLocaleString()}`
    }
  }

  const handleCalculationClick = (title, calculation) => {
    setSelectedCalculation({ title, calculation })
    setShowCalculationModal(true)
  }

  const openTrendModal = (itemName, dataKey, isPercentage = false) => {
    let actualData = []
    
    if (dataKey === "revenuePerEmployee") {
      actualData = productivityData.revenuePerEmployee?.map(v => parseFloat(v) || 0) || []
    } else if (dataKey === "laborCostPercentage") {
      actualData = productivityData.laborCostPercentage?.map(v => parseFloat(v) || 0) || []
    } else if (dataKey === "salesVolumePerEmployee") {
      actualData = productivityData.salesVolumePerEmployee?.map(v => parseFloat(v) || 0) || []
    } else if (dataKey === "overtimeHours") {
      actualData = productivityData.overtimeHours?.map(v => parseFloat(v) || 0) || []
    }
    
    setSelectedTrendItem({ 
      name: itemName, 
      actual: actualData,
      budget: null,
      isPercentage 
    })
    setShowTrendModal(true)
  }

  const renderKPICard = (title, dataKey, isPercentage = false, isCurrency = false, calculation = "") => {
    let data = []
    let currentValue = 0
    
    if (dataKey === "revenuePerEmployee") {
      data = productivityData.revenuePerEmployee || []
      currentValue = Number.parseFloat(data[data.length - 1]) || 0
    } else if (dataKey === "laborCostPercentage") {
      data = productivityData.laborCostPercentage || []
      currentValue = Number.parseFloat(data[data.length - 1]) || 0
    } else if (dataKey === "salesVolumePerEmployee") {
      data = productivityData.salesVolumePerEmployee || []
      currentValue = Number.parseFloat(data[data.length - 1]) || 0
    } else if (dataKey === "overtimeHours") {
      data = productivityData.overtimeHours || []
      currentValue = Number.parseFloat(data[data.length - 1]) || 0
    }
    
    return (
      <div
        style={{
          backgroundColor: "#fdfcfb",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          marginBottom: "20px",
          position: "relative",
        }}
      >
        <EyeIcon 
          onClick={() => handleCalculationClick(title, calculation)} 
        />
        
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
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "#5d4037" }}>
                {isPercentage ? `${currentValue.toFixed(1)}%` : 
                 isCurrency ? formatValue(currentValue / 1000000, currencyUnit) :
                 currentValue.toFixed(1)}
              </div>
              <div style={{ fontSize: "11px", color: "#8d6e63" }}>Current</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ color: "#5d4037", marginBottom: "5px", fontSize: "16px" }}>{title}</h4>
            {dataKey === "revenuePerEmployee" && (
              <div style={{ fontSize: "12px", color: "#2e7d32", backgroundColor: "#e8f5e9", padding: "4px 8px", borderRadius: "4px", display: "inline-block" }}>
                From Financial Performance
              </div>
            )}
            {dataKey === "laborCostPercentage" && (
              <div style={{ fontSize: "12px", color: "#2e7d32", backgroundColor: "#e8f5e9", padding: "4px 8px", borderRadius: "4px", display: "inline-block" }}>
                Auto-calculated from Financials
              </div>
            )}
          </div>
        </div>

        <div style={{ borderTop: "1px solid #e8ddd4", paddingTop: "15px" }}>
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <button
              onClick={() => setExpandedNotes(prev => ({ ...prev, [dataKey]: !prev[dataKey] }))}
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
              Add notes
            </button>
            <button
              onClick={() => setExpandedNotes(prev => ({ ...prev, [`${dataKey}_analysis`]: !prev[`${dataKey}_analysis`] }))}
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
            <button
              onClick={() => openTrendModal(title, dataKey, isPercentage)}
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
              View trend
            </button>
          </div>

          {expandedNotes[dataKey] && (
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
                value={kpiNotes[dataKey] || ""}
                onChange={(e) => setKpiNotes(prev => ({ ...prev, [dataKey]: e.target.value }))}
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

          {expandedNotes[`${dataKey}_analysis`] && (
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
                {kpiAnalysis[dataKey] ||
                  `Based on current ${title.toLowerCase()} of ${isPercentage ? `${currentValue.toFixed(1)}%` : 
                    isCurrency ? formatValue(currentValue / 1000000, currencyUnit) : currentValue.toFixed(1)}:
                  \n\nThis metric measures ${title.toLowerCase()}. 
                  \n\nRecommended actions:
                  \n• ${dataKey === "revenuePerEmployee" ? "Compare to industry benchmarks and optimize headcount planning" : 
                       dataKey === "laborCostPercentage" ? "Review salary structures and consider productivity improvements" :
                       dataKey === "salesVolumePerEmployee" ? "Analyze sales efficiency and training needs" :
                       dataKey === "overtimeHours" ? "Assess workload distribution and consider hiring" :
                       "Monitor and optimize this metric"}
                  \n• Track trend over time
                  \n• Set improvement targets`}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (activeSection !== "productivity") return null

  return (
    <div style={{ paddingTop: "20px" }}>
      <KeyQuestionBox
        question="Is output scaling with people? Are we getting efficient returns on our human capital investment?"
        signals="Efficiency trend, revenue per employee, labor cost ratio"
        decisions="Slow hiring, fix execution processes, invest in automation"
        section="productivity"
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <h2 style={{ color: "#5d4037", fontSize: "24px", fontWeight: "700" }}>Productivity</h2>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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
              <span style={{ color: "#5d4037", fontSize: "14px" }}>Units:</span>
              <select
                value={currencyUnit}
                onChange={(e) => setCurrencyUnit(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                  color: "#5d4037",
                  minWidth: "100px",
                }}
              >
                <option value="zar">ZAR</option>
                <option value="zar_thousand">R K</option>
                <option value="zar_million">R m</option>
                <option value="zar_billion">R bn</option>
              </select>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={() => setSelectedViewMode("month")}
              style={{
                padding: "8px 16px",
                backgroundColor: selectedViewMode === "month" ? "#5d4037" : "#e8ddd4",
                color: selectedViewMode === "month" ? "#fdfcfb" : "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedViewMode("quarter")}
              style={{
                padding: "8px 16px",
                backgroundColor: selectedViewMode === "quarter" ? "#5d4037" : "#e8ddd4",
                color: selectedViewMode === "quarter" ? "#fdfcfb" : "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              Quarterly
            </button>
            <button
              onClick={() => setSelectedViewMode("year")}
              style={{
                padding: "8px 16px",
                backgroundColor: selectedViewMode === "year" ? "#5d4037" : "#e8ddd4",
                color: selectedViewMode === "year" ? "#fdfcfb" : "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              Yearly
            </button>
          </div>
          
          {!isInvestorView && (
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
                whiteSpace: "nowrap",
              }}
            >
              Add Data
            </button>
          )}
        </div>
      </div>

      {/* Productivity KPI Cards - 2 per row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "30px" }}>
        {renderKPICard(
          "Revenue per Employee", 
          "revenuePerEmployee", 
          false, 
          true,
          "Revenue per Employee measures the average revenue generated per employee.\n\n" +
          "Calculation: Total Revenue ÷ Total Number of Employees\n\n" +
          "This metric is automatically calculated from Financial Performance data:\n" +
          "• Revenue: Pulled from P&L Statement\n" +
          "• Employee Count: Pulled from Balance Sheet - Additional Metrics\n\n" +
          "Higher values indicate better productivity and efficiency.\n" +
          "Compare against industry benchmarks and track trends over time."
        )}
        {renderKPICard(
          "Labour Cost % of Revenue", 
          "laborCostPercentage", 
          true, 
          false,
          "Labour Cost as Percentage of Revenue measures the proportion of revenue spent on employee compensation.\n\n" +
          "Calculation: (Total Employee Compensation ÷ Total Revenue) × 100%\n\n" +
          "This metric is automatically calculated from Financial Performance data:\n" +
          "• Labour Cost: Pulled from P&L Statement (Salaries & Wages)\n" +
          "• Revenue: Pulled from P&L Statement\n\n" +
          "Target ranges by industry:\n" +
          "• Service businesses: 30-50%\n" +
          "• Manufacturing: 20-35%\n" +
          "• Retail: 10-20%\n" +
          "• Tech/SaaS: 40-60%"
        )}
        {renderKPICard(
          "Sales Volume per Employee", 
          "salesVolumePerEmployee", 
          false, 
          false,
          "Sales Volume per Employee measures the average number of units sold per employee.\n\n" +
          "Calculation: Total Units Sold ÷ Total Number of Employees\n\n" +
          "This metric helps assess operational efficiency and sales productivity.\n" +
          "Enter monthly sales volume data manually in the Add Data modal.\n\n" +
          "Track this metric to:\n" +
          "• Identify top-performing periods\n" +
          "• Plan seasonal staffing needs\n" +
          "• Benchmark sales team performance"
        )}
        {renderKPICard(
          "Overtime Hours", 
          "overtimeHours", 
          false, 
          false,
          "Overtime Hours measures the average overtime hours worked per period.\n\n" +
          "Calculation: Total overtime hours recorded\n\n" +
          "High or increasing overtime may indicate:\n" +
          "• Understaffing\n" +
          "• Inefficient processes\n" +
          "• Imbalanced workload distribution\n" +
          "• Potential burnout risk\n\n" +
          "Target: Minimize overtime through proper staffing and process improvement."
        )}
      </div>

      {/* Unified Data Entry Modal */}
      <UnifiedDataEntryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentTab="productivity"
        user={user}
        onSave={() => {
          loadProductivityData()
          loadFinancialData()
        }}
        loading={loading}
      />

      {/* Calculation Modal */}
      <CalculationModal
        isOpen={showCalculationModal}
        onClose={() => setShowCalculationModal(false)}
        title={selectedCalculation.title}
        calculation={selectedCalculation.calculation}
      />

      {/* Trend Modal */}
      {showTrendModal && (
        <TrendModal
          isOpen={showTrendModal}
          onClose={() => setShowTrendModal(false)}
          item={selectedTrendItem}
          currencyUnit={currencyUnit}
          generateLabels={generateLabels}
          aggregateDataForView={aggregateDataForView}
          formatValue={formatValue}
        />
      )}
    </div>
  )
}

// ==================== CAPABILITY & TRAINING COMPONENT ====================

const CapabilityTraining = ({ activeSection, user, isInvestorView }) => {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedViewMode, setSelectedViewMode] = useState("month")
  const [expandedNotes, setExpandedNotes] = useState({})
  const [kpiNotes, setKpiNotes] = useState({})
  const [kpiAnalysis, setKpiAnalysis] = useState({})
  const [showTrendModal, setShowTrendModal] = useState(false)
  const [selectedTrendItem, setSelectedTrendItem] = useState(null)
  const [showCalculationModal, setShowCalculationModal] = useState(false)
  const [selectedCalculation, setSelectedCalculation] = useState({ title: "", calculation: "" })
  const [currencyUnit, setCurrencyUnit] = useState("zar_million")
  
  // Data structure for detailed employee tracking
  const [employeeTrackingData, setEmployeeTrackingData] = useState([])
  
  // Data structure for capability & training KPIs
  const [capabilityData, setCapabilityData] = useState({
    trainingSpendAmount: Array(12).fill(""),
    trainingSpendPercentage: Array(12).fill(""),
    trainingFocus: Array(12).fill(""),
  })
  
  // Financial data pulled from Financial Performance
  const [financialData, setFinancialData] = useState({
    laborCost: Array(12).fill(1),
    trainingSpend: Array(12).fill(0)
  })

  const months = getMonthsForYear(selectedYear, "month")
  const years = Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i)

  useEffect(() => {
    if (user) {
      loadCapabilityData()
      loadEmployeeTrackingData()
      loadFinancialData()
    }
  }, [user])

  const loadCapabilityData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const capabilityDoc = await getDoc(doc(db, "peopleData", `${user.uid}_capabilityTraining`))
      if (capabilityDoc.exists()) {
        const data = capabilityDoc.data()
        if (data.capabilityData) setCapabilityData(data.capabilityData)
        if (data.kpiNotes) setKpiNotes(data.kpiNotes)
        if (data.kpiAnalysis) setKpiAnalysis(data.kpiAnalysis)
      }
    } catch (error) {
      console.error("Error loading capability data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadEmployeeTrackingData = async () => {
    if (!user) return
    try {
      const employeeDoc = await getDoc(doc(db, "peopleData", `${user.uid}_employeeTracking`))
      if (employeeDoc.exists()) {
        const data = employeeDoc.data()
        if (data.employees) setEmployeeTrackingData(data.employees)
      }
    } catch (error) {
      console.error("Error loading employee tracking data:", error)
    }
  }

  const loadFinancialData = async () => {
    if (!user) return
    const data = await pullFinancialData(user.uid)
    setFinancialData({
      laborCost: data.laborCost,
      trainingSpend: data.trainingSpend
    })
    
    // Calculate training spend percentage
    const trainingSpendPercentage = data.trainingSpend.map((spend, i) => {
      const labor = data.laborCost[i] || 1
      return (spend / labor) * 100
    })
    
    setCapabilityData(prev => ({
      ...prev,
      trainingSpendAmount: data.trainingSpend.map(v => v.toString()),
      trainingSpendPercentage: trainingSpendPercentage.map(v => v.toFixed(2).toString())
    }))
  }

  const generateLabels = () => {
    if (selectedViewMode === "month") {
      return months
    } else if (selectedViewMode === "quarter") {
      return ["Q1", "Q2", "Q3", "Q4"]
    } else {
      return [selectedYear.toString()]
    }
  }

  const aggregateDataForView = (data) => {
    if (!data) return []
    
    if (selectedViewMode === "month") {
      return data.map(val => Number.parseFloat(val) || 0)
    } else if (selectedViewMode === "quarter") {
      const quarters = []
      for (let i = 0; i < 4; i++) {
        const sum = data.slice(i * 3, i * 3 + 3).reduce((acc, val) => acc + (Number.parseFloat(val) || 0), 0)
        quarters.push(sum / 3)
      }
      return quarters
    } else {
      const yearlyAvg = data.reduce((acc, val) => acc + (Number.parseFloat(val) || 0), 0) / data.length
      return [yearlyAvg]
    }
  }

  const formatValue = (value, unit = currencyUnit) => {
    const num = Number.parseFloat(value) || 0
    switch(unit) {
      case "zar": return `R${num.toLocaleString()}`
      case "zar_thousand": return `R${(num * 1000).toLocaleString()}K`
      case "zar_million": return `R${num.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}m`
      case "zar_billion": return `R${(num / 1000).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}bn`
      default: return `R${num.toLocaleString()}`
    }
  }

  const handleCalculationClick = (title, calculation) => {
    setSelectedCalculation({ title, calculation })
    setShowCalculationModal(true)
  }

  const openTrendModal = (itemName, dataKey, isPercentage = false) => {
    let actualData = []
    
    if (dataKey === "trainingSpendAmount") {
      actualData = capabilityData.trainingSpendAmount?.map(v => parseFloat(v) || 0) || []
    } else if (dataKey === "trainingSpendPercentage") {
      actualData = capabilityData.trainingSpendPercentage?.map(v => parseFloat(v) || 0) || []
    } else if (dataKey === "trainingFocus") {
      actualData = capabilityData.trainingFocus?.map(v => parseFloat(v) || 0) || []
    }
    
    setSelectedTrendItem({ 
      name: itemName, 
      actual: actualData,
      budget: null,
      isPercentage 
    })
    setShowTrendModal(true)
  }

  const renderEmployeeTrackingTable = () => {
    // Calculate summary statistics
    const totalEmployees = employeeTrackingData.length
    const skillsGapDone = employeeTrackingData.filter(e => e.skillsGap?.status === "Yes").length
    const idpDone = employeeTrackingData.filter(e => e.idp?.status === "Yes").length
    const midTermReviewDone = employeeTrackingData.filter(e => e.midTermReview?.status === "Yes").length
    const annualReviewDone = employeeTrackingData.filter(e => e.annualReview?.status === "Yes").length

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h4 style={{ color: "#5d4037", marginBottom: "5px", fontSize: "16px" }}>Employee Development Tracking</h4>
          <EyeIcon 
            onClick={() => handleCalculationClick(
              "Employee Development Tracking", 
              "Employee Development Tracking measures the completion of key development activities.\n\n" +
              "Metrics tracked:\n\n" +
              "1. Skills Gap Assessment:\n" +
              "   • Identifies gaps between current and required skills\n" +
              "   • Should be conducted annually per employee\n" +
              "   • Target: 100% completion\n\n" +
              "2. Individual Development Plan (IDP):\n" +
              "   • Formal plan for employee growth and skill building\n" +
              "   • Should be created annually for each employee\n" +
              "   • Target: 100% completion\n\n" +
              "3. Mid-Term Performance Review:\n" +
              "   • Interim feedback and performance discussion\n" +
              "   • Should be conducted mid-year\n" +
              "   • Target: 100% completion\n\n" +
              "4. Annual Performance Review:\n" +
              "   • Comprehensive yearly performance evaluation\n" +
              "   • Should be conducted for all employees\n" +
              "   • Target: 100% completion\n\n" +
              "Completion rates below 80% indicate development process gaps."
            )} 
          />
        </div>
        
        {/* Summary Statistics */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(5, 1fr)", 
          gap: "15px", 
          marginBottom: "20px",
          padding: "15px",
          backgroundColor: "#f5f0eb",
          borderRadius: "6px"
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#5d4037" }}>{totalEmployees}</div>
            <div style={{ fontSize: "12px", color: "#8d6e63" }}>Total Employees</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: skillsGapDone > 0 ? "#4caf50" : "#f44336" }}>
              {skillsGapDone}/{totalEmployees}
            </div>
            <div style={{ fontSize: "12px", color: "#8d6e63" }}>Skills Gap Done</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: idpDone > 0 ? "#4caf50" : "#f44336" }}>
              {idpDone}/{totalEmployees}
            </div>
            <div style={{ fontSize: "12px", color: "#8d6e63" }}>IDP Done</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: midTermReviewDone > 0 ? "#4caf50" : "#f44336" }}>
              {midTermReviewDone}/{totalEmployees}
            </div>
            <div style={{ fontSize: "12px", color: "#8d6e63" }}>Mid-Term Review Done</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: annualReviewDone > 0 ? "#4caf50" : "#f44336" }}>
              {annualReviewDone}/{totalEmployees}
            </div>
            <div style={{ fontSize: "12px", color: "#8d6e63" }}>Annual Review Done</div>
          </div>
        </div>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ backgroundColor: "#e8ddd4" }}>
                <th style={{ padding: "12px", textAlign: "left", color: "#5d4037", borderBottom: "2px solid #5d4037" }}>Employee</th>
                <th style={{ padding: "12px", textAlign: "center", color: "#5d4037", borderBottom: "2px solid #5d4037" }} colSpan="2">
                  Skills Gap
                </th>
                <th style={{ padding: "12px", textAlign: "center", color: "#5d4037", borderBottom: "2px solid #5d4037" }} colSpan="2">
                  IDP
                </th>
                <th style={{ padding: "12px", textAlign: "center", color: "#5d4037", borderBottom: "2px solid #5d4037" }} colSpan="2">
                  Mid-Term Review
                </th>
                <th style={{ padding: "12px", textAlign: "center", color: "#5d4037", borderBottom: "2px solid #5d4037" }} colSpan="2">
                  Annual Review
                </th>
              </tr>
              <tr style={{ backgroundColor: "#f5f0eb" }}>
                <th style={{ padding: "8px", textAlign: "left", color: "#5d4037", fontSize: "12px" }}></th>
                <th style={{ padding: "8px", textAlign: "center", color: "#5d4037", fontSize: "12px" }}>Date</th>
                <th style={{ padding: "8px", textAlign: "center", color: "#5d4037", fontSize: "12px" }}>Status</th>
                <th style={{ padding: "8px", textAlign: "center", color: "#5d4037", fontSize: "12px" }}>Date</th>
                <th style={{ padding: "8px", textAlign: "center", color: "#5d4037", fontSize: "12px" }}>Status</th>
                <th style={{ padding: "8px", textAlign: "center", color: "#5d4037", fontSize: "12px" }}>Date</th>
                <th style={{ padding: "8px", textAlign: "center", color: "#5d4037", fontSize: "12px" }}>Status</th>
                <th style={{ padding: "8px", textAlign: "center", color: "#5d4037", fontSize: "12px" }}>Date</th>
                <th style={{ padding: "8px", textAlign: "center", color: "#5d4037", fontSize: "12px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {employeeTrackingData.length > 0 ? (
                employeeTrackingData.map((employee, index) => (
                  <tr key={employee.id || index} style={{ borderBottom: "1px solid #e8ddd4" }}>
                    <td style={{ padding: "12px", color: "#5d4037", fontWeight: "600" }}>{employee.employee}</td>
                    
                    {/* Skills Gap */}
                    <td style={{ padding: "12px", textAlign: "center", color: "#5d4037" }}>
                      {employee.skillsGap?.date ? new Date(employee.skillsGap.date).toLocaleDateString() : "-"}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "600",
                        backgroundColor: employee.skillsGap?.status === "Yes" ? "#4caf50" : "#f44336",
                        color: "#fff"
                      }}>
                        {employee.skillsGap?.status === "Yes" ? "Yes" : "No"}
                      </span>
                    </td>
                    
                    {/* IDP */}
                    <td style={{ padding: "12px", textAlign: "center", color: "#5d4037" }}>
                      {employee.idp?.date ? new Date(employee.idp.date).toLocaleDateString() : "-"}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "600",
                        backgroundColor: employee.idp?.status === "Yes" ? "#4caf50" : "#f44336",
                        color: "#fff"
                      }}>
                        {employee.idp?.status === "Yes" ? "Yes" : "No"}
                      </span>
                    </td>
                    
                    {/* Mid-Term Review */}
                    <td style={{ padding: "12px", textAlign: "center", color: "#5d4037" }}>
                      {employee.midTermReview?.date ? new Date(employee.midTermReview.date).toLocaleDateString() : "-"}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "600",
                        backgroundColor: employee.midTermReview?.status === "Yes" ? "#4caf50" : "#f44336",
                        color: "#fff"
                      }}>
                        {employee.midTermReview?.status === "Yes" ? "Yes" : "No"}
                      </span>
                    </td>
                    
                    {/* Annual Review */}
                    <td style={{ padding: "12px", textAlign: "center", color: "#5d4037" }}>
                      {employee.annualReview?.date ? new Date(employee.annualReview.date).toLocaleDateString() : "-"}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "600",
                        backgroundColor: employee.annualReview?.status === "Yes" ? "#4caf50" : "#f44336",
                        color: "#fff"
                      }}>
                        {employee.annualReview?.status === "Yes" ? "Yes" : "No"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ padding: "20px", textAlign: "center", color: "#8d6e63" }}>
                    No employee data found. Add employees in the Add Data modal.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div style={{ marginTop: "15px", color: "#8d6e63", fontSize: "12px", display: "flex", gap: "20px" }}>
          <div>
            <strong>Target:</strong> 100% completion for all development activities
          </div>
        </div>
      </div>
    )
  }

  const renderKPICard = (title, dataKey, isPercentage = false, isCurrency = false, calculation = "") => {
    let data = []
    let currentValue = 0
    
    if (dataKey === "trainingSpendAmount") {
      data = capabilityData.trainingSpendAmount || []
      currentValue = Number.parseFloat(data[data.length - 1]) || 0
    } else if (dataKey === "trainingSpendPercentage") {
      data = capabilityData.trainingSpendPercentage || []
      currentValue = Number.parseFloat(data[data.length - 1]) || 0
    } else if (dataKey === "trainingFocus") {
      data = capabilityData.trainingFocus || []
      const lastValue = data[data.length - 1]
      currentValue = lastValue === "1" ? "Technical" : lastValue === "2" ? "Leadership" : lastValue === "3" ? "Compliance" : "Not Set"
    }
    
    return (
      <div
        style={{
          backgroundColor: "#fdfcfb",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          marginBottom: "20px",
          position: "relative",
        }}
      >
        <EyeIcon 
          onClick={() => handleCalculationClick(title, calculation)} 
        />
        
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
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "#5d4037" }}>
                {dataKey === "trainingFocus" ? currentValue :
                 isPercentage ? `${Number.parseFloat(currentValue).toFixed(1)}%` : 
                 isCurrency ? formatValue(currentValue / 1000000, currencyUnit) :
                 currentValue}
              </div>
              <div style={{ fontSize: "11px", color: "#8d6e63" }}>Current</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ color: "#5d4037", marginBottom: "5px", fontSize: "16px" }}>{title}</h4>
            {dataKey === "trainingSpendAmount" && (
              <div style={{ fontSize: "12px", color: "#2e7d32", backgroundColor: "#e8f5e9", padding: "4px 8px", borderRadius: "4px", display: "inline-block" }}>
                From Financial Performance
              </div>
            )}
            {dataKey === "trainingSpendPercentage" && (
              <div style={{ fontSize: "12px", color: "#2e7d32", backgroundColor: "#e8f5e9", padding: "4px 8px", borderRadius: "4px", display: "inline-block" }}>
                Auto-calculated from Financials
              </div>
            )}
          </div>
        </div>

        <div style={{ borderTop: "1px solid #e8ddd4", paddingTop: "15px" }}>
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <button
              onClick={() => setExpandedNotes(prev => ({ ...prev, [dataKey]: !prev[dataKey] }))}
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
              Add notes
            </button>
            <button
              onClick={() => setExpandedNotes(prev => ({ ...prev, [`${dataKey}_analysis`]: !prev[`${dataKey}_analysis`] }))}
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
            <button
              onClick={() => openTrendModal(title, dataKey, isPercentage)}
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
              View trend
            </button>
          </div>

          {expandedNotes[dataKey] && (
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
                value={kpiNotes[dataKey] || ""}
                onChange={(e) => setKpiNotes(prev => ({ ...prev, [dataKey]: e.target.value }))}
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

          {expandedNotes[`${dataKey}_analysis`] && (
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
                {kpiAnalysis[dataKey] ||
                  `Based on current ${title.toLowerCase()}:
                  \n\n${dataKey === "trainingSpendAmount" ? 
                    `Training investment of ${formatValue(currentValue / 1000000, currencyUnit)}. ` +
                    `Benchmark: Best-in-class companies invest 3-5% of payroll in training.` :
                   dataKey === "trainingSpendPercentage" ? 
                    `Training spend is ${currentValue.toFixed(1)}% of payroll. ` +
                    `Target range: 2-5% for effective capability building.` :
                   dataKey === "trainingFocus" ? 
                    `Current focus: ${currentValue}. ` +
                    `Consider a balanced approach across technical, leadership, and compliance training.` :
                    `Monitor this metric for trends.`
                  }
                  \n\nRecommended actions:
                  \n• ${dataKey === "trainingSpendAmount" ? "Evaluate ROI of training programs" :
                       dataKey === "trainingSpendPercentage" ? currentValue < 2 ? "Consider increasing training investment" : "Maintain current investment levels" :
                       dataKey === "trainingFocus" ? "Assess if training mix aligns with strategic needs" :
                       "Track and optimize this metric"}
                  \n• Compare against industry benchmarks
                  \n• Link training outcomes to business results`}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (activeSection !== "capability-training") return null

  return (
    <div style={{ paddingTop: "20px" }}>
      <KeyQuestionBox
        question="Are we future-ready? Is the business investing enough in skills development to remain capable as it grows?"
        signals="Training investment, skills gap closure rate, development plan completion"
        decisions="Increase training budget, implement development programs, hire for capability gaps"
        section="capability-training"
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <h2 style={{ color: "#5d4037", fontSize: "24px", fontWeight: "700" }}>Capability & Training</h2>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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
              <span style={{ color: "#5d4037", fontSize: "14px" }}>Units:</span>
              <select
                value={currencyUnit}
                onChange={(e) => setCurrencyUnit(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                  color: "#5d4037",
                  minWidth: "100px",
                }}
              >
                <option value="zar">ZAR</option>
                <option value="zar_thousand">R K</option>
                <option value="zar_million">R m</option>
                <option value="zar_billion">R bn</option>
              </select>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={() => setSelectedViewMode("month")}
              style={{
                padding: "8px 16px",
                backgroundColor: selectedViewMode === "month" ? "#5d4037" : "#e8ddd4",
                color: selectedViewMode === "month" ? "#fdfcfb" : "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedViewMode("quarter")}
              style={{
                padding: "8px 16px",
                backgroundColor: selectedViewMode === "quarter" ? "#5d4037" : "#e8ddd4",
                color: selectedViewMode === "quarter" ? "#fdfcfb" : "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              Quarterly
            </button>
            <button
              onClick={() => setSelectedViewMode("year")}
              style={{
                padding: "8px 16px",
                backgroundColor: selectedViewMode === "year" ? "#5d4037" : "#e8ddd4",
                color: selectedViewMode === "year" ? "#fdfcfb" : "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              Yearly
            </button>
          </div>
          
          {!isInvestorView && (
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
                whiteSpace: "nowrap",
              }}
            >
              Add Data
            </button>
          )}
        </div>
      </div>

      {/* Employee Tracking Table */}
      {renderEmployeeTrackingTable()}

      {/* KPI Cards - 3 per row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
        {renderKPICard(
          "Training Spend (R)", 
          "trainingSpendAmount", 
          false, 
          true,
          "Training Spend measures the total investment in employee training and development.\n\n" +
          "This metric is automatically pulled from Financial Performance:\n" +
          "• Source: Balance Sheet - Additional Metrics\n\n" +
          "Industry benchmarks:\n" +
          "• Average companies: 1-2% of payroll\n" +
          "• Best-in-class: 3-5% of payroll\n" +
          "• High-growth tech: 4-7% of payroll\n\n" +
          "Investment levels correlate with:\n" +
          "• Employee retention\n" +
          "• Innovation capability\n" +
          "• Time-to-productivity for new hires"
        )}
        {renderKPICard(
          "Training Spend (% of payroll)", 
          "trainingSpendPercentage", 
          true, 
          false,
          "Training Spend as Percentage of Payroll measures training investment relative to total compensation.\n\n" +
          "Calculation: (Training Spend ÷ Total Payroll) × 100%\n\n" +
          "This metric is automatically calculated from Financial Performance data:\n" +
          "• Training Spend: Pulled from Balance Sheet\n" +
          "• Payroll: Pulled from P&L Statement (Salaries & Wages)\n\n" +
          "Target ranges:\n" +
          "• <1%: Under-investing - Risk of skills gaps\n" +
          "• 1-2%: Adequate - Maintenance level\n" +
          "• 2-5%: Strategic investment - Building capability\n" +
          "• >5%: High investment - Transformation phase\n\n" +
          "Target: 3%+ for organizations prioritizing capability building"
        )}
        {renderKPICard(
          "Training Focus", 
          "trainingFocus", 
          false, 
          false,
          "Training Focus indicates the primary area of training investment.\n\n" +
          "Categories:\n" +
          "• Technical: Job-specific skills, tools, and methodologies\n" +
          "• Leadership: Management, communication, strategic thinking\n" +
          "• Compliance: Regulatory, safety, mandatory training\n\n" +
          "Optimal mix varies by organization stage:\n" +
          "• Early stage: 70% Technical, 20% Leadership, 10% Compliance\n" +
          "• Growth stage: 50% Technical, 30% Leadership, 20% Compliance\n" +
          "• Mature: 40% Technical, 40% Leadership, 20% Compliance\n\n" +
          "Consider rotating focus quarterly to address different needs."
        )}
      </div>

      {/* Unified Data Entry Modal */}
      <UnifiedDataEntryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentTab="capability-training"
        user={user}
        onSave={() => {
          loadCapabilityData()
          loadEmployeeTrackingData()
          loadFinancialData()
        }}
        loading={loading}
      />

      {/* Calculation Modal */}
      <CalculationModal
        isOpen={showCalculationModal}
        onClose={() => setShowCalculationModal(false)}
        title={selectedCalculation.title}
        calculation={selectedCalculation.calculation}
      />

      {/* Trend Modal */}
      {showTrendModal && (
        <TrendModal
          isOpen={showTrendModal}
          onClose={() => setShowTrendModal(false)}
          item={selectedTrendItem}
          currencyUnit={currencyUnit}
          generateLabels={generateLabels}
          aggregateDataForView={aggregateDataForView}
          formatValue={formatValue}
        />
      )}
    </div>
  )
}

// ==================== STABILITY & CONTINUITY COMPONENT ====================

const StabilityContinuity = ({ activeSection, user, isInvestorView }) => {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedViewMode, setSelectedViewMode] = useState("month")
  const [expandedNotes, setExpandedNotes] = useState({})
  const [kpiNotes, setKpiNotes] = useState({})
  const [kpiAnalysis, setKpiAnalysis] = useState({})
  const [showTrendModal, setShowTrendModal] = useState(false)
  const [selectedTrendItem, setSelectedTrendItem] = useState(null)
  const [showCalculationModal, setShowCalculationModal] = useState(false)
  const [selectedCalculation, setSelectedCalculation] = useState({ title: "", calculation: "" })
  
  // Data structure for stability & continuity KPIs
  const [stabilityData, setStabilityData] = useState({
    overallTurnover: Array(12).fill(""),
    workforceMovements: Array(12).fill(""),
    criticalRoleTurnover: Array(12).fill(""),
    contractorDependence: Array(12).fill(""),
  })

  // Data structure for termination entries
  const [terminationEntries, setTerminationEntries] = useState([])

  const months = getMonthsForYear(selectedYear, "month")
  const years = Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i)
  const monthOptions = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  useEffect(() => {
    if (user) {
      loadStabilityData()
      loadTerminationData()
    }
  }, [user])

  const loadStabilityData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const stabilityDoc = await getDoc(doc(db, "peopleData", `${user.uid}_stabilityContinuity`))
      if (stabilityDoc.exists()) {
        const data = stabilityDoc.data()
        if (data.stabilityData) setStabilityData(data.stabilityData)
        if (data.kpiNotes) setKpiNotes(data.kpiNotes)
        if (data.kpiAnalysis) setKpiAnalysis(data.kpiAnalysis)
      }
    } catch (error) {
      console.error("Error loading stability data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadTerminationData = async () => {
    if (!user) return
    try {
      const terminationDoc = await getDoc(doc(db, "peopleData", `${user.uid}_terminationData`))
      if (terminationDoc.exists()) {
        const data = terminationDoc.data()
        if (data.entries) setTerminationEntries(data.entries)
      }
    } catch (error) {
      console.error("Error loading termination data:", error)
    }
  }

  // Calculate summary statistics
  const calculateTerminationSummary = () => {
    const summary = {
      total: 0,
      byMonth: {},
      byReason: {}
    }

    terminationEntries.forEach(entry => {
      summary.total += entry.count
      summary.byMonth[entry.month] = (summary.byMonth[entry.month] || 0) + entry.count
      summary.byReason[entry.reason] = (summary.byReason[entry.reason] || 0) + entry.count
    })

    return summary
  }

  const generateLabels = () => {
    if (selectedViewMode === "month") {
      return months
    } else if (selectedViewMode === "quarter") {
      return ["Q1", "Q2", "Q3", "Q4"]
    } else {
      return [selectedYear.toString()]
    }
  }

  const aggregateDataForView = (data) => {
    if (!data) return []
    
    if (selectedViewMode === "month") {
      return data.map(val => Number.parseFloat(val) || 0)
    } else if (selectedViewMode === "quarter") {
      const quarters = []
      for (let i = 0; i < 4; i++) {
        const sum = data.slice(i * 3, i * 3 + 3).reduce((acc, val) => acc + (Number.parseFloat(val) || 0), 0)
        quarters.push(sum / 3)
      }
      return quarters
    } else {
      const yearlyAvg = data.reduce((acc, val) => acc + (Number.parseFloat(val) || 0), 0) / data.length
      return [yearlyAvg]
    }
  }

  const formatValue = (value) => {
    const num = Number.parseFloat(value) || 0
    return num.toFixed(1)
  }

  const handleCalculationClick = (title, calculation) => {
    setSelectedCalculation({ title, calculation })
    setShowCalculationModal(true)
  }

  const openTrendModal = (itemName, dataKey, isPercentage = false) => {
    let actualData = []
    
    if (dataKey === "overallTurnover") {
      actualData = stabilityData.overallTurnover?.map(v => parseFloat(v) || 0) || []
    } else if (dataKey === "workforceMovements") {
      actualData = stabilityData.workforceMovements?.map(v => parseFloat(v) || 0) || []
    } else if (dataKey === "criticalRoleTurnover") {
      actualData = stabilityData.criticalRoleTurnover?.map(v => parseFloat(v) || 0) || []
    } else if (dataKey === "contractorDependence") {
      actualData = stabilityData.contractorDependence?.map(v => parseFloat(v) || 0) || []
    }
    
    setSelectedTrendItem({ 
      name: itemName, 
      actual: actualData,
      budget: null,
      isPercentage 
    })
    setShowTrendModal(true)
  }

  const renderTerminationReasonsTable = () => {
    const summary = calculateTerminationSummary()
    const uniqueReasons = [...new Set(terminationEntries.map(e => e.reason))]

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h4 style={{ color: "#5d4037", marginBottom: "5px", fontSize: "16px" }}>Reasons for Terminations</h4>
          <EyeIcon 
            onClick={() => handleCalculationClick(
              "Termination Analysis", 
              "Termination Analysis tracks employee exits by month and reason.\n\n" +
              "Common termination reasons and implications:\n\n" +
              "• Performance: May indicate hiring quality or management issues\n" +
              "• Resignation: Voluntary exits - conduct exit interviews to identify patterns\n" +
              "• Redundancy: Role elimination - ensure fair process and communication\n" +
              "• Misconduct: Policy violations - review training and communication\n" +
              "• Retirement: Natural attrition - plan for knowledge transfer\n\n" +
              "Key metrics:\n" +
              "• Total terminations: Monitor trend over time\n" +
              "• Top reasons: Address root causes\n" +
              "• Seasonal patterns: Plan for cyclical exits\n\n" +
              "Target: Voluntary turnover <15% annually, involuntary turnover <5% annually"
            )} 
          />
        </div>
        
        {/* Summary Statistics */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(4, 1fr)", 
          gap: "15px", 
          marginBottom: "20px",
          padding: "15px",
          backgroundColor: "#f5f0eb",
          borderRadius: "6px"
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#5d4037" }}>{summary.total}</div>
            <div style={{ fontSize: "12px", color: "#8d6e63" }}>Total Terminations</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#5d4037" }}>{terminationEntries.length}</div>
            <div style={{ fontSize: "12px", color: "#8d6e63" }}>Termination Records</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#5d4037" }}>
              {Object.keys(summary.byMonth).length}
            </div>
            <div style={{ fontSize: "12px", color: "#8d6e63" }}>Months with Data</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#5d4037" }}>
              {uniqueReasons.length}
            </div>
            <div style={{ fontSize: "12px", color: "#8d6e63" }}>Unique Reasons</div>
          </div>
        </div>
        
        {/* Termination Entries Table */}
        <div style={{ overflowX: "auto" }}>
          {terminationEntries.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ backgroundColor: "#e8ddd4" }}>
                  <th style={{ padding: "12px", textAlign: "left", color: "#5d4037", borderBottom: "2px solid #5d4037" }}>
                    Month
                  </th>
                  {uniqueReasons.map(reason => (
                    <th key={reason} style={{ padding: "12px", textAlign: "center", color: "#5d4037", borderBottom: "2px solid #5d4037" }}>
                      {reason}
                    </th>
                  ))}
                  <th style={{ padding: "12px", textAlign: "center", color: "#5d4037", borderBottom: "2px solid #5d4037", backgroundColor: "#d7ccc8" }}>
                    Monthly Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthOptions.map(month => {
                  const monthEntries = terminationEntries.filter(entry => entry.month === month)
                  if (monthEntries.length === 0) return null
                  
                  const monthTotal = monthEntries.reduce((sum, entry) => sum + entry.count, 0)
                  
                  return (
                    <tr key={month} style={{ borderBottom: "1px solid #e8ddd4" }}>
                      <td style={{ padding: "12px", color: "#5d4037", fontWeight: "600" }}>
                        {month}
                      </td>
                      {uniqueReasons.map(reason => {
                        const entry = monthEntries.find(e => e.reason === reason)
                        return (
                          <td key={`${month}-${reason}`} style={{ padding: "12px", textAlign: "center", color: "#5d4037" }}>
                            {entry ? (
                              <span style={{
                                padding: "4px 8px",
                                backgroundColor: "#ffebee",
                                color: "#c62828",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: "600"
                              }}>
                                {entry.count}
                              </span>
                            ) : "-"}
                          </td>
                        )
                      })}
                      <td style={{ 
                        padding: "12px", 
                        textAlign: "center", 
                        color: "#5d4037",
                        fontWeight: "700",
                        backgroundColor: "#f5f0eb"
                      }}>
                        {monthTotal}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: "#d7ccc8", fontWeight: "700" }}>
                  <td style={{ padding: "12px", color: "#5d4037" }}>
                    Reason Total:
                  </td>
                  {uniqueReasons.map(reason => {
                    const reasonTotal = terminationEntries
                      .filter(entry => entry.reason === reason)
                      .reduce((sum, entry) => sum + entry.count, 0)
                    return (
                      <td key={`total-${reason}`} style={{ 
                        padding: "12px", 
                        textAlign: "center", 
                        color: "#5d4037",
                        backgroundColor: "#e8ddd4"
                      }}>
                        {reasonTotal}
                      </td>
                    )
                  })}
                  <td style={{ 
                    padding: "12px", 
                    textAlign: "center", 
                    color: "#5d4037",
                    backgroundColor: "#c8b7a8",
                    fontSize: "14px"
                  }}>
                    {summary.total}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div style={{ padding: "40px", textAlign: "center", color: "#8d6e63" }}>
              <p style={{ marginBottom: "10px" }}>No termination data recorded yet.</p>
              {!isInvestorView && (
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
                  Add Termination Data
                </button>
              )}
            </div>
          )}
        </div>
        
        <div style={{ marginTop: "15px", color: "#8d6e63", fontSize: "12px" }}>
          <strong>Annual turnover rate calculation:</strong> (Total terminations ÷ Average headcount) × 100%
          <br />
          <strong>Target:</strong> &lt;15% voluntary turnover, &lt;5% involuntary turnover
        </div>
      </div>
    )
  }

  const renderKPICard = (title, dataKey, isPercentage = false, calculation = "") => {
    let data = []
    let currentValue = 0
    
    if (dataKey === "overallTurnover") {
      data = stabilityData.overallTurnover || []
      currentValue = Number.parseFloat(data[data.length - 1]) || 0
    } else if (dataKey === "workforceMovements") {
      data = stabilityData.workforceMovements || []
      currentValue = Number.parseFloat(data[data.length - 1]) || 0
    } else if (dataKey === "criticalRoleTurnover") {
      data = stabilityData.criticalRoleTurnover || []
      currentValue = Number.parseFloat(data[data.length - 1]) || 0
    } else if (dataKey === "contractorDependence") {
      data = stabilityData.contractorDependence || []
      currentValue = Number.parseFloat(data[data.length - 1]) || 0
    }
    
    return (
      <div
        style={{
          backgroundColor: "#fdfcfb",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          marginBottom: "20px",
          position: "relative",
        }}
      >
        <EyeIcon 
          onClick={() => handleCalculationClick(title, calculation)} 
        />
        
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
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "#5d4037" }}>
                {isPercentage ? `${currentValue.toFixed(1)}%` : currentValue.toFixed(1)}
              </div>
              <div style={{ fontSize: "11px", color: "#8d6e63" }}>Current</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ color: "#5d4037", marginBottom: "5px", fontSize: "16px" }}>{title}</h4>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #e8ddd4", paddingTop: "15px" }}>
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <button
              onClick={() => setExpandedNotes(prev => ({ ...prev, [dataKey]: !prev[dataKey] }))}
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
              Add notes
            </button>
            <button
              onClick={() => setExpandedNotes(prev => ({ ...prev, [`${dataKey}_analysis`]: !prev[`${dataKey}_analysis`] }))}
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
            <button
              onClick={() => openTrendModal(title, dataKey, isPercentage)}
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
              View trend
            </button>
          </div>

          {expandedNotes[dataKey] && (
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
                value={kpiNotes[dataKey] || ""}
                onChange={(e) => setKpiNotes(prev => ({ ...prev, [dataKey]: e.target.value }))}
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

          {expandedNotes[`${dataKey}_analysis`] && (
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
                {kpiAnalysis[dataKey] ||
                  `Based on current ${title.toLowerCase()} of ${isPercentage ? `${currentValue.toFixed(1)}%` : currentValue.toFixed(1)}:
                  \n\n${dataKey === "overallTurnover" ? 
                    currentValue > 25 ? "⚠️ Critical: Turnover is very high. Conduct exit interviews and address root causes immediately." :
                    currentValue > 15 ? "⚠️ High: Turnover exceeds target. Review compensation, culture, and career paths." :
                    currentValue > 10 ? "ℹ️ Moderate: Within acceptable range but monitor trends." :
                    "✅ Good: Turnover is healthy." :
                   dataKey === "criticalRoleTurnover" ?
                    currentValue > 20 ? "⚠️ Critical: Losing key talent. Implement retention plans immediately." :
                    currentValue > 10 ? "⚠️ High: Critical role turnover exceeds target. Review succession planning." :
                    "✅ Good: Critical role retention is strong." :
                   dataKey === "contractorDependence" ?
                    currentValue > 30 ? "⚠️ High contractor dependence. Consider converting key roles to permanent." :
                    currentValue > 20 ? "ℹ️ Moderate contractor dependence. Monitor knowledge retention." :
                    "✅ Healthy balance of permanent vs contractor staff." :
                    "Monitor this metric for trends."
                  }
                  \n\nRecommended actions:
                  \n• ${dataKey === "overallTurnover" ? currentValue > 15 ? "Conduct pulse surveys and exit interviews" : "Maintain retention programs" :
                       dataKey === "workforceMovements" ? "Analyze hiring vs termination patterns" :
                       dataKey === "criticalRoleTurnover" ? currentValue > 10 ? "Implement retention bonuses and succession planning" : "Document knowledge transfer processes" :
                       dataKey === "contractorDependence" ? currentValue > 30 ? "Develop conversion plan for critical contractor roles" : "Review contractor vs permanent cost-benefit" :
                       "Review and optimize"}
                  \n• Set quarterly improvement targets
                  \n• Track progress monthly`}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (activeSection !== "stability-continuity") return null

  return (
    <div style={{ paddingTop: "20px" }}>
      <KeyQuestionBox
        question="Is talent leakage threatening continuity or execution? Are we at risk of losing critical capabilities?"
        signals="Critical role churn, overall turnover trends, contractor dependence"
        decisions="Implement retention strategy, strengthen succession planning, convert critical contractors"
        section="stability-continuity"
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <h2 style={{ color: "#5d4037", fontSize: "24px", fontWeight: "700" }}>Stability & Continuity</h2>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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
          </div>
          
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={() => setSelectedViewMode("month")}
              style={{
                padding: "8px 16px",
                backgroundColor: selectedViewMode === "month" ? "#5d4037" : "#e8ddd4",
                color: selectedViewMode === "month" ? "#fdfcfb" : "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedViewMode("quarter")}
              style={{
                padding: "8px 16px",
                backgroundColor: selectedViewMode === "quarter" ? "#5d4037" : "#e8ddd4",
                color: selectedViewMode === "quarter" ? "#fdfcfb" : "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              Quarterly
            </button>
            <button
              onClick={() => setSelectedViewMode("year")}
              style={{
                padding: "8px 16px",
                backgroundColor: selectedViewMode === "year" ? "#5d4037" : "#e8ddd4",
                color: selectedViewMode === "year" ? "#fdfcfb" : "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              Yearly
            </button>
          </div>
          
          {!isInvestorView && (
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
                whiteSpace: "nowrap",
              }}
            >
              Add Data
            </button>
          )}
        </div>
      </div>

      {/* Termination Reasons Table */}
      {renderTerminationReasonsTable()}

      {/* KPI Cards - 2 per row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "30px" }}>
        {renderKPICard(
          "Overall Turnover (% Annually)", 
          "overallTurnover", 
          true,
          "Overall Turnover measures the percentage of employees who leave the organization annually.\n\n" +
          "Calculation: (Total terminations ÷ Average headcount) × 100%\n\n" +
          "Industry benchmarks:\n" +
          "• Overall average: 15-20%\n" +
          "• High-performing companies: <10%\n" +
          "• High-turnover industries: >30%\n\n" +
          "Components:\n" +
          "• Voluntary turnover (employee-initiated)\n" +
          "• Involuntary turnover (employer-initiated)\n\n" +
          "Cost of turnover: 50-200% of annual salary per role\n\n" +
          "Target: <15% overall, <10% voluntary"
        )}
        {renderKPICard(
          "Workforce Movements", 
          "workforceMovements", 
          false,
          "Workforce Movements tracks net headcount change through hires and terminations.\n\n" +
          "Calculation: New hires - Terminations\n\n" +
          "Positive value = Net growth\n" +
          "Negative value = Net reduction\n" +
          "Zero = Stable headcount\n\n" +
          "Analyze in context of:\n" +
          "• Business growth phase\n" +
          "• Seasonal patterns\n" +
          "• Budget constraints\n\n" +
          "Rapid changes (positive or negative) can indicate:\n" +
          "• Aggressive expansion\n" +
          "• Downsizing/restructuring\n" +
          "• Instability in workforce planning"
        )}
        {renderKPICard(
          "Critical Role Turnover", 
          "criticalRoleTurnover", 
          true,
          "Critical Role Turnover measures turnover specifically in roles that are essential to business operations.\n\n" +
          "Critical roles are those that:\n" +
          "• Are difficult to replace (specialized skills)\n" +
          "• Have significant impact on revenue/operations\n" +
          "• Take >3 months to recruit and onboard\n" +
          "• Represent key intellectual property holders\n\n" +
          "Calculation: (Critical role terminations ÷ Total critical roles) × 100%\n\n" +
          "Target: <10% annually\n\n" +
          "High critical role turnover indicates:\n" +
          "• Succession planning gaps\n" +
          "• Competitive compensation issues\n" +
          "• Leadership or culture problems"
        )}
        {renderKPICard(
          "Contractor Dependence", 
          "contractorDependence", 
          true,
          "Contractor Dependence measures the percentage of the workforce that are contractors/freelancers.\n\n" +
          "Calculation: (Contractor headcount ÷ Total workforce) × 100%\n\n" +
          "Benefits of contractors:\n" +
          "• Flexibility for variable workload\n" +
          "• Access to specialized skills\n" +
          "• Lower fixed costs\n\n" +
          "Risks of high contractor dependence:\n" +
          "• Knowledge retention\n" +
          "• Cultural integration\n" +
          "• IP protection\n" +
          "• Continuity risk\n\n" +
          "Target ranges:\n" +
          "• Stable operations: 10-20%\n" +
          "• Project-based: 20-30%\n" +
          "• High dependence: >30% - review conversion strategy"
        )}
      </div>

      {/* Unified Data Entry Modal */}
      <UnifiedDataEntryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentTab="stability-continuity"
        user={user}
        onSave={() => {
          loadStabilityData()
          loadTerminationData()
        }}
        loading={loading}
      />

      {/* Calculation Modal */}
      <CalculationModal
        isOpen={showCalculationModal}
        onClose={() => setShowCalculationModal(false)}
        title={selectedCalculation.title}
        calculation={selectedCalculation.calculation}
      />

      {/* Trend Modal */}
      {showTrendModal && (
        <TrendModal
          isOpen={showTrendModal}
          onClose={() => setShowTrendModal(false)}
          item={selectedTrendItem}
          currencyUnit="zar"
          generateLabels={generateLabels}
          aggregateDataForView={aggregateDataForView}
          formatValue={formatValue}
        />
      )}
    </div>
  )
}

// ==================== EMPLOYEE COMPOSITION COMPONENT ====================
// FIXED: Pie chart labels are now white

const EmployeeCompositionTab = ({ activeSection, user, isInvestorView }) => {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [showCalculationModal, setShowCalculationModal] = useState(false)
  const [selectedCalculation, setSelectedCalculation] = useState({ title: "", calculation: "" })
  const [employeeData, setEmployeeData] = useState(null)

  const years = Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i)

  useEffect(() => {
    if (user) {
      loadEmployeeData()
    }
  }, [user])

  const loadEmployeeData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const employeeDoc = await getDoc(doc(db, "peopleData", `${user.uid}_employeeComposition`))
      if (employeeDoc.exists()) {
        const data = employeeDoc.data()
        if (data.employeeData) setEmployeeData(data.employeeData)
      } else {
        setEmployeeData(null)
      }
    } catch (error) {
      console.error("Error loading employee composition data:", error)
      setEmployeeData(null)
    } finally {
      setLoading(false)
    }
  }

  const createPieChartData = (data, colors, categoryLabels) => {
    if (!data) return null
    
    const labels = categoryLabels || Object.keys(data).map(key => 
      key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
    )
    const values = Object.values(data)
    
    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderColor: "#ffffff",
          borderWidth: 2,
        },
      ],
    }
  }

  // Updated pie chart options with white numbers inside and black labels outside
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend since we have outside labels
      },
      tooltip: {
        backgroundColor: "rgba(93, 64, 55, 0.9)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#5d4037",
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
      datalabels: {
        // White numbers inside the pie slices
        color: '#FFFFFF',
        font: {
          weight: 'bold',
          size: 14
        },
        formatter: function(value, context) {
          const total = context.dataset.data.reduce(function(a, b) { return a + b; }, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return percentage + '%'; // Show only percentage inside
        },
        anchor: 'center',
        align: 'center',
        offset: 0
      },
    },
    // Add a custom plugin to draw labels outside
    layout: {
      padding: {
        top: 30,
        bottom: 30,
        left: 30,
        right: 30
      }
    }
  }

  // Custom plugin to draw category labels outside the pie
  const outsideLabelsPlugin = {
    id: 'outsideLabels',
    afterDatasetsDraw(chart) {
      const { ctx, data, chartArea: { width, height } } = chart;
      
      ctx.save();
      ctx.font = 'bold 11px Arial';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const meta = chart.getDatasetMeta(0);
      const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
      
      data.labels.forEach((label, index) => {
        const element = meta.data[index];
        if (element) {
          const angle = (element.startAngle + element.endAngle) / 2;
          const radius = element.outerRadius + 20; // Position outside the pie
          
          const x = width / 2 + Math.cos(angle) * radius;
          const y = height / 2 + Math.sin(angle) * radius;
          
          // Draw label text
          ctx.fillText(label, x, y);
        }
      });
      
      ctx.restore();
    }
  };

  const handleCalculationClick = (title, calculation) => {
    setSelectedCalculation({ title, calculation })
    setShowCalculationModal(true)
  }

  const renderPieChart = (title, data, colors, calculation = "", categoryLabels = null) => {
    if (!data) return null

    const chartData = createPieChartData(data, colors, categoryLabels)
    if (!chartData) return null

    return (
      <div
        style={{
          backgroundColor: "#fdfcfb",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          position: "relative",
        }}
      >
        <EyeIcon 
          onClick={() => handleCalculationClick(title, calculation)} 
        />
        <h4 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "16px", textAlign: "center" }}>
          {title}
        </h4>
        <div style={{ height: "350px", position: "relative" }}>
          <Pie
            data={chartData}
            options={pieChartOptions}
            plugins={[outsideLabelsPlugin]}
          />
        </div>
        {/* Simple reference guide */}
        <div style={{ 
          marginTop: "15px", 
          display: "flex", 
          flexWrap: "wrap", 
          justifyContent: "center",
          gap: "15px",
          borderTop: "1px solid #e8ddd4",
          paddingTop: "15px"
        }}>
          {categoryLabels && categoryLabels.map((label, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ 
                width: "12px", 
                height: "12px", 
                backgroundColor: colors[idx % colors.length],
                borderRadius: "3px"
              }}></div>
              <span style={{ fontSize: "11px", color: "#5d4037" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderEmptyState = () => (
    <div
      style={{
        backgroundColor: "#fdfcfb",
        padding: "40px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        textAlign: "center",
        gridColumn: "1 / -1",
      }}
    >
      <p style={{ color: "#8d6e63", fontSize: "16px", marginBottom: "20px" }}>
        No employee composition data available. Click "Add Data" to get started.
      </p>
      {!isInvestorView && (
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: "10px 20px",
            backgroundColor: "#5d4037",
            color: "#fdfcfb",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
          }}
        >
          Add Your First Data
        </button>
      )}
    </div>
  )

  if (activeSection !== "employee-composition") return null

  return (
    <div style={{ paddingTop: "20px" }}>
      <KeyQuestionBox
        question="Are we externally credible? Does our workforce composition reflect the markets we serve and stakeholders we engage?"
        signals="Representation gaps, diversity metrics, inclusion indicators"
        decisions="Board & leadership changes, targeted recruitment, inclusion programs"
        section="employee-composition"
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <h2 style={{ color: "#5d4037", fontSize: "24px", fontWeight: "700" }}>Employee Composition</h2>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            <span style={{ color: "#5d4037", fontSize: "14px", whiteSpace: "nowrap" }}>Select Year:</span>
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
          
          {!isInvestorView && (
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
                whiteSpace: "nowrap",
              }}
            >
              Add Data
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#8d6e63" }}>
          Loading employee composition data...
        </div>
      ) : !employeeData ? (
        <div style={{ marginBottom: "30px" }}>
          {renderEmptyState()}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          {renderPieChart(
            "Gender Distribution", 
            employeeData.gender, 
            ["#3E2723", "#5D4037", "#8D6E63"],
            "Gender Distribution shows the proportion of employees by gender.\n\n" +
            "Calculation: (Employees in each gender category ÷ Total employees) × 100%\n\n" +
            "Why this matters:\n" +
            "• Reflects commitment to diversity and inclusion\n" +
            "• Correlates with innovation and decision-making quality\n" +
            "• Increasingly important to investors and clients\n\n" +
            "Consider:\n" +
            "• Compare to industry benchmarks\n" +
            "• Analyze representation at different levels (entry, management, leadership)\n" +
            "• Set improvement targets with timelines",
            ["Male", "Female", "Other"]
          )}
          {renderPieChart(
            "Race Distribution", 
            employeeData.race, 
            ["#3E2723", "#5D4037", "#8D6E63", "#A1887F", "#D7CCC8"],
            "Race/Ethnicity Distribution shows workforce composition by racial/ethnic groups.\n\n" +
            "Calculation: (Employees in each racial/ethnic group ÷ Total employees) × 100%\n\n" +
            "Why this matters:\n" +
            "• Demonstrates commitment to employment equity\n" +
            "• Enhances understanding of diverse markets\n" +
            "• Often required for regulatory compliance and tenders\n\n" +
            "Consider:\n" +
            "• Compare to available talent pool demographics\n" +
            "• Analyze by job level and function\n" +
            "• Review recruitment sources and selection processes",
            ["African", "White", "Colored", "Indian", "Other"]
          )}
          {renderPieChart(
            "Age Distribution", 
            employeeData.age, 
            ["#3E2723", "#5D4037", "#8D6E63", "#A1887F", "#D7CCC8"],
            "Age Distribution shows the proportion of employees across age brackets.\n\n" +
            "Calculation: (Employees in each age bracket ÷ Total employees) × 100%\n\n" +
            "Why this matters:\n" +
            "• Indicates succession planning readiness\n" +
            "• Reveals potential knowledge transfer gaps\n" +
            "• Highlights multi-generational workplace dynamics\n\n" +
            "Consider:\n" +
            "• High concentration in 55+ = retirement risk\n" +
            "• Low concentration in under 30 = future talent pipeline concerns\n" +
            "• Balance across generations for institutional memory + fresh perspectives",
            ["Under 25", "25-34", "35-44", "45-54", "55+"]
          )}
          {renderPieChart(
            "Tenure Distribution", 
            employeeData.tenure, 
            ["#3E2723", "#5D4037", "#8D6E63", "#A1887F", "#D7CCC8"],
            "Tenure Distribution shows how long employees have been with the organization.\n\n" +
            "Calculation: (Employees in each tenure bracket ÷ Total employees) × 100%\n\n" +
            "Why this matters:\n" +
            "• <1 year: New hire integration effectiveness\n" +
            "• 1-3 years: Early career development\n" +
            "• 3-5 years: Growing contributors\n" +
            "• 5-10 years: Experienced core team\n" +
            "• 10+ years: Institutional knowledge holders\n\n" +
            "Healthy distribution includes mix of new talent and experienced staff.\n" +
            "High concentration in <1 year may indicate rapid growth OR retention issues.",
            ["<1 year", "1-3 years", "3-5 years", "5-10 years", "10+ years"]
          )}
          {renderPieChart(
            "Education Distribution", 
            employeeData.education, 
            ["#3E2723", "#5D4037", "#8D6E63", "#A1887F"],
            "Education Distribution shows the highest qualification levels of employees.\n\n" +
            "Calculation: (Employees with each education level ÷ Total employees) × 100%\n\n" +
            "Why this matters:\n" +
            "• Indicates technical capability and knowledge base\n" +
            "• Affects ability to innovate and solve complex problems\n" +
            "• May influence client perception and credibility\n\n" +
            "Consider:\n" +
            "• Requirements vary by industry and role\n" +
            "• Balance formal qualifications with experience\n" +
            "• Support ongoing education and professional development",
            ["High School", "Diploma", "Degree", "Postgraduate"]
          )}
        </div>
      )}

      <UnifiedDataEntryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentTab="employee-composition"
        user={user}
        onSave={loadEmployeeData}
        loading={loading}
      />

      <CalculationModal
        isOpen={showCalculationModal}
        onClose={() => setShowCalculationModal(false)}
        title={selectedCalculation.title}
        calculation={selectedCalculation.calculation}
      />
    </div>
  )
}

// ==================== MAIN PEOPLE PERFORMANCE COMPONENT ====================

const PeoplePerformance = () => {
  const [activeSection, setActiveSection] = useState("execution-capacity")
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
    { id: "execution-capacity", label: "Execution Capacity & Scalability" },
    { id: "productivity", label: "Productivity" },
    { id: "capability-training", label: "Capability & Training" },
    { id: "stability-continuity", label: "Stability & Continuity" },
    { id: "employee-composition", label: "Employee Composition" },
  ]

  const handleExitInvestorView = () => {
    sessionStorage.removeItem("viewingSMEId")
    sessionStorage.removeItem("viewingSMEName")
    sessionStorage.removeItem("investorViewMode")
    window.location.href = "/my-cohorts"
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
                Investor View: Viewing {viewingSMEName}'s People Performance
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
              People Performance
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

          {/* People Performance Description */}
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
                      <li>Assesses organisational resilience and execution capacity</li>
                      <li>Evaluates continuity risk and talent retention</li>
                      <li>Monitors productivity scaling with headcount growth</li>
                      <li>Measures capability development and skills investment</li>
                      <li>Analyzes workforce demographics and representation</li>
                    </ul>
                  </div>

                  <div>
                    <h3 style={{ color: "#7d5a50", marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>
                      What this dashboard does NOT do
                    </h3>
                    <ul style={{ color: "#4a352f", fontSize: "14px", lineHeight: "1.7", margin: 0, paddingLeft: "20px" }}>
                      <li>Payroll processing or salary management</li>
                      <li>Leave and attendance tracking</li>
                      <li>Performance review administration</li>
                      <li>HR compliance and policy management</li>
                      <li>Recruitment and onboarding workflows</li>
                    </ul>
                  </div>
                </div>

                <div style={{ marginTop: "30px", paddingTop: "20px", borderTop: "1px solid #e8ddd4" }}>
                  <h3 style={{ color: "#7d5a50", marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>
                    Key People Performance Dimensions
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div>
                      <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
                        Execution Capacity & Scalability
                      </h4>
                      <p style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
                        Evaluate leadership capacity and team sufficiency for current and near-term workload
                      </p>
                    </div>
                    <div>
                      <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
                        Productivity
                      </h4>
                      <p style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
                        Assess if output is scaling with headcount through efficiency trends
                      </p>
                    </div>
                    <div>
                      <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
                        Capability & Training
                      </h4>
                      <p style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
                        Determine if the business is investing enough in skills development for future growth
                      </p>
                    </div>
                    <div>
                      <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
                        Stability & Continuity
                      </h4>
                      <p style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
                        Monitor talent leakage risks and ensure business continuity
                      </p>
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
                        Employee Composition
                      </h4>
                      <p style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
                        Analyze workforce demographics and representation for external credibility
                      </p>
                    </div>
                  </div>
                  <p style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6", marginTop: "15px" }}>
                    Each section provides key metrics, signals, and decision points to help you make informed strategic choices about your organization's human capital.
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

        <ExecutionCapacity
          activeSection={activeSection}
          user={user}
          isInvestorView={isInvestorView}
        />

        <Productivity
          activeSection={activeSection}
          user={user}
          isInvestorView={isInvestorView}
        />

        <CapabilityTraining
          activeSection={activeSection}
          user={user}
          isInvestorView={isInvestorView}
        />

        <StabilityContinuity
          activeSection={activeSection}
          user={user}
          isInvestorView={isInvestorView}
        />

        <EmployeeCompositionTab
          activeSection={activeSection}
          user={user}
          isInvestorView={isInvestorView}
        />
      </div>
    </div>
  )
}

export default PeoplePerformance