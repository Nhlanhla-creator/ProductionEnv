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
import { Info, ChevronDown, ChevronUp, Upload, X, Calendar, TrendingUp, TrendingDown } from "lucide-react";

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
    case "zar_thousand": return `R${(num * 1000).toLocaleString()}`
    case "zar_million": return `R${num.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}`
    case "zar_billion": return `R${(num / 1000).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
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

const TrendModal = ({ isOpen, onClose, item, currencyUnit, formatValue }) => {
  if (!isOpen || !item) return null

  // Generate labels with month and year (last 11 months + current month)
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  
  const labels = []
  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentYear, currentMonth - i, 1)
    const month = date.toLocaleString('default', { month: 'short' })
    const year = date.getFullYear()
    labels.push(`${month} ${year}`)
  }

  // Ensure we have 12 data points (fill with zeros if needed)
  const actualData = [...(item.actual || [])]
  while (actualData.length < 12) actualData.unshift(0)
  const last12Months = actualData.slice(-12)

  const chartData = {
    labels,
    datasets: [
      {
        label: `${item.name} - Actual`,
        data: last12Months,
        borderColor: "#5d4037",
        backgroundColor: "rgba(93, 64, 55, 0.1)",
        borderWidth: 3,
        fill: true,
        tension: 0.3,
      },
    ]
  }

  // Calculate statistics
  const validActualData = last12Months.filter(v => !isNaN(parseFloat(v)) && parseFloat(v) !== 0)
  const currentValue = validActualData.length > 0 ? validActualData[validActualData.length - 1] : 0
  const averageValue = validActualData.length > 0 
    ? validActualData.reduce((a, b) => a + parseFloat(b), 0) / validActualData.length 
    : 0
  const minValue = validActualData.length > 0 ? Math.min(...validActualData) : 0
  const maxValue = validActualData.length > 0 ? Math.max(...validActualData) : 0
  
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
          <h3 style={{ color: "#5d4037", margin: 0 }}>{item.name} - Trend Analysis (Last 12 Months)</h3>
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
                datalabels: {
                  display: false
                },
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
              <div style={{ fontSize: "12px", color: "#8d6e63", marginBottom: "5px" }}>Average (12 Months)</div>
              <div style={{ fontSize: "16px", fontWeight: "600", color: "#5d4037" }}>
                {item.isPercentage
                  ? `${parseFloat(averageValue).toFixed(1)}%`
                  : formatValue ? formatValue(averageValue, currencyUnit) : averageValue
                }
              </div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#8d6e63", marginBottom: "5px" }}>Min / Max</div>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#5d4037" }}>
                {item.isPercentage
                  ? `${parseFloat(minValue).toFixed(1)}% / ${parseFloat(maxValue).toFixed(1)}%`
                  : `${formatValue ? formatValue(minValue, currencyUnit) : minValue} / ${formatValue ? formatValue(maxValue, currencyUnit) : maxValue}`
                }
              </div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#8d6e63", marginBottom: "5px" }}>Trend</div>
              <div style={{ fontSize: "16px", fontWeight: "600", color: "#5d4037" }}>
                {trend}
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
    trainingSpendAmount: { actual: Array(12).fill(""), budget: Array(12).fill("") },
    trainingSpendPercentage: { actual: Array(12).fill(""), budget: Array(12).fill("") },
    trainingFocus: { actual: Array(12).fill(""), budget: Array(12).fill("") },
  })
  const [productivityData, setProductivityData] = useState({
    salesVolumePerEmployee: { actual: Array(12).fill(""), budget: Array(12).fill("") },
    revenuePerEmployee: { actual: Array(12).fill(""), budget: Array(12).fill("") },
    laborCostPercentage: { actual: Array(12).fill(""), budget: Array(12).fill("") },
    overtimeHours: { actual: Array(12).fill(""), budget: Array(12).fill("") },
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
    name: "",
    dateStarted: "",
    dateEnded: "",
    reason: "",
    customReason: ""
  })
  const [newHireEntries, setNewHireEntries] = useState([])
  const [newHireForm, setNewHireForm] = useState({
    name: "",
    dateStarted: "",
    contractType: "Permanent",
    endDate: ""
  })

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Predefined reasons for terminations
  const predefinedReasons = ["Performance", "Resignation", "Redundancy", "Misconduct", "Retirement", "Other"]
  
  // Contract types for new hires
  const contractTypes = ["Permanent", "Contract", "Internship"]

  // Tab structure for the modal
  const modalTabs = [
    { id: "employee-composition", label: "Employee Composition" },
    { id: "execution-capacity", label: "Execution Capacity" },
    { id: "productivity", label: "Productivity" },
    { id: "capability-training", label: "Capability & Training" },
    { id: "stability-continuity", label: "Stability & Continuity" },
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
    }
  }, [isOpen, currentTab, user])

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
            if (data.productivityData) {
              setProductivityData({
                salesVolumePerEmployee: data.productivityData.salesVolumePerEmployee || { actual: Array(12).fill(""), budget: Array(12).fill("") },
                revenuePerEmployee: data.productivityData.revenuePerEmployee || { actual: Array(12).fill(""), budget: Array(12).fill("") },
                laborCostPercentage: data.productivityData.laborCostPercentage || { actual: Array(12).fill(""), budget: Array(12).fill("") },
                overtimeHours: data.productivityData.overtimeHours || { actual: Array(12).fill(""), budget: Array(12).fill("") },
              })
            }
          }
          break
        case "capability-training":
          const capDoc = await getDoc(doc(db, "peopleData", `${user.uid}_capabilityTraining`))
          if (capDoc.exists()) {
            const data = capDoc.data()
            if (data.capabilityData) {
              setCapabilityTrainingData({
                trainingSpendAmount: data.capabilityData.trainingSpendAmount || { actual: Array(12).fill(""), budget: Array(12).fill("") },
                trainingSpendPercentage: data.capabilityData.trainingSpendPercentage || { actual: Array(12).fill(""), budget: Array(12).fill("") },
                trainingFocus: data.capabilityData.trainingFocus || { actual: Array(12).fill(""), budget: Array(12).fill("") },
              })
            }
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
          
          const hireDoc = await getDoc(doc(db, "peopleData", `${user.uid}_newHireData`))
          if (hireDoc.exists()) {
            const data = hireDoc.data()
            if (data.entries) setNewHireEntries(data.entries)
          }
          break
        case "employee-composition":
          const compDoc = await getDoc(doc(db, "peopleData", `${user.uid}_employeeComposition`))
          if (compDoc.exists()) {
            const data = compDoc.data()
            if (data.employeeData) {
              setLocalData(data.employeeData)
            }
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
            productivityData: productivityData,
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
          
          await setDoc(doc(db, "peopleData", `${user.uid}_newHireData`), {
            userId: user.uid,
            entries: newHireEntries,
            lastUpdated: new Date().toISOString(),
          })
          break
        case "employee-composition":
          await setDoc(doc(db, "peopleData", `${user.uid}_employeeComposition`), {
            userId: user.uid,
            employeeData: localData,
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
    if (!newTermination.name || !newTermination.reason || !newTermination.dateStarted || !newTermination.dateEnded) {
      alert("Please fill in all fields: Employee Name, Date Started, Date Ended, and Reason")
      return
    }

    const reasonToSave = newTermination.reason === "Other" ? newTermination.customReason : newTermination.reason
    
    if (!reasonToSave.trim()) {
      alert("Please specify the reason")
      return
    }

    const newEntry = {
      id: Date.now(),
      name: newTermination.name,
      dateStarted: newTermination.dateStarted,
      dateEnded: newTermination.dateEnded,
      reason: reasonToSave,
      dateAdded: new Date().toISOString()
    }

    setTerminationEntries([...terminationEntries, newEntry])
    
    // Reset form
    setNewTermination({
      name: "",
      dateStarted: "",
      dateEnded: "",
      reason: "",
      customReason: ""
    })
  }

  const removeTerminationEntry = (id) => {
    setTerminationEntries(terminationEntries.filter(entry => entry.id !== id))
  }

  const addNewHireEntry = () => {
    if (!newHireForm.name || !newHireForm.dateStarted || !newHireForm.contractType) {
      alert("Please enter name, start date, and contract type")
      return
    }

    const newEntry = {
      id: Date.now(),
      name: newHireForm.name,
      dateStarted: newHireForm.dateStarted,
      contractType: newHireForm.contractType,
      endDate: newHireForm.endDate || null,
      dateAdded: new Date().toISOString()
    }

    setNewHireEntries([...newHireEntries, newEntry])
    
    // Reset form
    setNewHireForm({
      name: "",
      dateStarted: "",
      contractType: "Permanent",
      endDate: ""
    })
  }

  const removeNewHireEntry = (id) => {
    setNewHireEntries(newHireEntries.filter(entry => entry.id !== id))
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

  const renderMonthlyInputsWithBudget = (label, dataObj, setDataObj, field, options = {}) => {
    const { step = "0.01", unit = "" } = options
    
    return (
      <div style={{ marginBottom: "25px", padding: "15px", backgroundColor: "#fff", borderRadius: "6px", border: "1px solid #e8ddd4" }}>
        <h5 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "14px", fontWeight: "600" }}>{label}</h5>
        
        {/* Actual Row */}
        <div style={{ marginBottom: "15px" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ width: "60px", height: "20px", backgroundColor: "#FFB347", borderRadius: "4px", marginRight: "10px" }}></div>
            <label style={{ fontSize: "13px", color: "#5d4037", fontWeight: "600" }}>Actual</label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "5px" }}>
            {months.map((month, idx) => (
              <div key={`actual-${month}`}>
                <label style={{ fontSize: "10px", color: "#8d6e63", display: "block", marginBottom: "2px" }}>
                  {month}
                </label>
                <input
                  type="number"
                  step={step}
                  value={dataObj[field]?.actual?.[idx] || ""}
                  onChange={(e) => {
                    const newData = { ...dataObj }
                    if (!newData[field]) newData[field] = { actual: Array(12).fill(""), budget: Array(12).fill("") }
                    if (!newData[field].actual) newData[field].actual = Array(12).fill("")
                    newData[field].actual[idx] = e.target.value
                    setDataObj(newData)
                  }}
                  placeholder="0"
                  style={{
                    width: "100%",
                    padding: "6px",
                    borderRadius: "4px",
                    border: "1px solid #FFB347",
                    fontSize: "12px",
                    backgroundColor: "#fff9c4",
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Budget Row */}
        <div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ width: "60px", height: "20px", backgroundColor: "#90EE90", borderRadius: "4px", marginRight: "10px" }}></div>
            <label style={{ fontSize: "13px", color: "#5d4037", fontWeight: "600" }}>Budget</label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "5px" }}>
            {months.map((month, idx) => (
              <div key={`budget-${month}`}>
                <label style={{ fontSize: "10px", color: "#8d6e63", display: "block", marginBottom: "2px" }}>
                  {month}
                </label>
                <input
                  type="number"
                  step={step}
                  value={dataObj[field]?.budget?.[idx] || ""}
                  onChange={(e) => {
                    const newData = { ...dataObj }
                    if (!newData[field]) newData[field] = { actual: Array(12).fill(""), budget: Array(12).fill("") }
                    if (!newData[field].budget) newData[field].budget = Array(12).fill("")
                    newData[field].budget[idx] = e.target.value
                    setDataObj(newData)
                  }}
                  placeholder="0"
                  style={{
                    width: "100%",
                    padding: "6px",
                    borderRadius: "4px",
                    border: "1px solid #32CD32",
                    fontSize: "12px",
                    backgroundColor: "#f0fff0",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderMonthlyInputsWithBudgetForSelect = (label, dataObj, setDataObj, field, options = []) => {
    return (
      <div style={{ marginBottom: "25px", padding: "15px", backgroundColor: "#fff", borderRadius: "6px", border: "1px solid #e8ddd4" }}>
        <h5 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "14px", fontWeight: "600" }}>{label}</h5>
        
        {/* Actual Row */}
        <div style={{ marginBottom: "15px" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ width: "60px", height: "20px", backgroundColor: "#FFB347", borderRadius: "4px", marginRight: "10px" }}></div>
            <label style={{ fontSize: "13px", color: "#5d4037", fontWeight: "600" }}>Actual</label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "5px" }}>
            {months.map((month, idx) => (
              <div key={`actual-${month}`}>
                <label style={{ fontSize: "10px", color: "#8d6e63", display: "block", marginBottom: "2px" }}>
                  {month}
                </label>
                <select
                  value={dataObj[field]?.actual?.[idx] || ""}
                  onChange={(e) => {
                    const newData = { ...dataObj }
                    if (!newData[field]) newData[field] = { actual: Array(12).fill(""), budget: Array(12).fill("") }
                    if (!newData[field].actual) newData[field].actual = Array(12).fill("")
                    newData[field].actual[idx] = e.target.value
                    setDataObj(newData)
                  }}
                  style={{
                    width: "100%",
                    padding: "6px",
                    borderRadius: "4px",
                    border: "1px solid #FFB347",
                    fontSize: "12px",
                    backgroundColor: "#fff9c4",
                  }}
                >
                  <option value="">Select</option>
                  {options.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Row */}
        <div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ width: "60px", height: "20px", backgroundColor: "#90EE90", borderRadius: "4px", marginRight: "10px" }}></div>
            <label style={{ fontSize: "13px", color: "#5d4037", fontWeight: "600" }}>Budget</label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "5px" }}>
            {months.map((month, idx) => (
              <div key={`budget-${month}`}>
                <label style={{ fontSize: "10px", color: "#8d6e63", display: "block", marginBottom: "2px" }}>
                  {month}
                </label>
                <select
                  value={dataObj[field]?.budget?.[idx] || ""}
                  onChange={(e) => {
                    const newData = { ...dataObj }
                    if (!newData[field]) newData[field] = { actual: Array(12).fill(""), budget: Array(12).fill("") }
                    if (!newData[field].budget) newData[field].budget = Array(12).fill("")
                    newData[field].budget[idx] = e.target.value
                    setDataObj(newData)
                  }}
                  style={{
                    width: "100%",
                    padding: "6px",
                    borderRadius: "4px",
                    border: "1px solid #32CD32",
                    fontSize: "12px",
                    backgroundColor: "#f0fff0",
                  }}
                >
                  <option value="">Select</option>
                  {options.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
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
          maxWidth: "1400px",
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
        </div>

        {/* Tab Content */}
        <div style={{ marginBottom: "30px" }}>
          {/* Employee Composition Tab */}
          {activeModalTab === "employee-composition" && (
            <div style={{ marginBottom: "30px" }}>
              <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f5f0eb", borderRadius: "8px" }}>
                <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>Head Count</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div>
                    <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px" }}>
                      Current Head Count:
                    </label>
                    <input
                      type="number"
                      value={localData.headCount || 0}
                      onChange={(e) => setLocalData({...localData, headCount: Number.parseInt(e.target.value) || 0})}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px" }}>
                      Target Head Count:
                    </label>
                    <input
                      type="number"
                      value={localData.targetHeadCount || 0}
                      onChange={(e) => setLocalData({...localData, targetHeadCount: Number.parseInt(e.target.value) || 0})}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f5f0eb", borderRadius: "8px" }}>
                <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>Contract Type Distribution</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
                  <div>
                    <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px" }}>
                      Permanent:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={localData.permanent || 0}
                      onChange={(e) => setLocalData({...localData, permanent: Number.parseInt(e.target.value) || 0})}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px" }}>
                      Contract:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={localData.contract || 0}
                      onChange={(e) => setLocalData({...localData, contract: Number.parseInt(e.target.value) || 0})}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px" }}>
                      Internship:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={localData.internship || 0}
                      onChange={(e) => setLocalData({...localData, internship: Number.parseInt(e.target.value) || 0})}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f5f0eb", borderRadius: "8px" }}>
                <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>Occupational Levels</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
                  <div>
                    <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px" }}>
                      Unskilled:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={localData.unskilled || 0}
                      onChange={(e) => setLocalData({...localData, unskilled: Number.parseInt(e.target.value) || 0})}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px" }}>
                      Semi-Skilled:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={localData.semiSkilled || 0}
                      onChange={(e) => setLocalData({...localData, semiSkilled: Number.parseInt(e.target.value) || 0})}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px" }}>
                      Skilled Jnr:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={localData.skilledJnr || 0}
                      onChange={(e) => setLocalData({...localData, skilledJnr: Number.parseInt(e.target.value) || 0})}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px" }}>
                      Prof Mid:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={localData.profMid || 0}
                      onChange={(e) => setLocalData({...localData, profMid: Number.parseInt(e.target.value) || 0})}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px" }}>
                      Snr Mgt:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={localData.snrMgt || 0}
                      onChange={(e) => setLocalData({...localData, snrMgt: Number.parseInt(e.target.value) || 0})}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px" }}>
                      Top Mgt:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={localData.topMgt || 0}
                      onChange={(e) => setLocalData({...localData, topMgt: Number.parseInt(e.target.value) || 0})}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Execution Capacity & Stability Tabs */}
          {["execution-capacity", "stability-continuity"].includes(activeModalTab) && tabFields[activeModalTab] && (
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
            </div>
          )}

          {/* Productivity Tab - With Actual & Budget */}
          {activeModalTab === "productivity" && (
            <div style={{ marginBottom: "30px" }}>
              {renderMonthlyInputsWithBudget(
                "Sales Volume per Employee", 
                productivityData, 
                setProductivityData, 
                "salesVolumePerEmployee", 
                { step: "1", unit: "units" }
              )}
              
              {renderMonthlyInputsWithBudget(
                "Revenue per Employee (R)", 
                productivityData, 
                setProductivityData, 
                "revenuePerEmployee", 
                { step: "1000", unit: "currency" }
              )}
              
              {renderMonthlyInputsWithBudget(
                "Labour Cost % of Revenue", 
                productivityData, 
                setProductivityData, 
                "laborCostPercentage", 
                { step: "0.1", unit: "percentage" }
              )}
              
              {renderMonthlyInputsWithBudget(
                "Overtime Hours", 
                productivityData, 
                setProductivityData, 
                "overtimeHours", 
                { step: "1", unit: "hours" }
              )}
            </div>
          )}

          {/* Capability & Training Tab - With Actual & Budget */}
          {activeModalTab === "capability-training" && (
            <>
              {/* Training Data */}
              <div style={{ marginBottom: "30px" }}>
                {renderMonthlyInputsWithBudget(
                  "Training Spend (R)", 
                  capabilityTrainingData, 
                  setCapabilityTrainingData, 
                  "trainingSpendAmount", 
                  { step: "1000", unit: "currency" }
                )}
                
                {renderMonthlyInputsWithBudget(
                  "Training Spend (% of payroll)", 
                  capabilityTrainingData, 
                  setCapabilityTrainingData, 
                  "trainingSpendPercentage", 
                  { step: "0.1", unit: "percentage" }
                )}
                
                {renderMonthlyInputsWithBudgetForSelect(
                  "Training Focus", 
                  capabilityTrainingData, 
                  setCapabilityTrainingData, 
                  "trainingFocus", 
                  [
                    { value: "1", label: "Technical" },
                    { value: "2", label: "Leadership" },
                    { value: "3", label: "Compliance" }
                  ]
                )}
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
                              newData[index].skillsGap.status = "Done"
                              setEmployeeTrackingData(newData)
                            }}
                            style={{
                              flex: "1",
                              padding: "8px",
                              backgroundColor: employee.skillsGap?.status === "Done" ? "#4caf50" : "#e8e8e8",
                              color: employee.skillsGap?.status === "Done" ? "#fff" : "#5d4037",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            Done
                          </button>
                          <button
                            onClick={() => {
                              const newData = [...employeeTrackingData]
                              if (!newData[index].skillsGap) newData[index].skillsGap = {}
                              newData[index].skillsGap.status = "Not Done"
                              setEmployeeTrackingData(newData)
                            }}
                            style={{
                              flex: "1",
                              padding: "8px",
                              backgroundColor: employee.skillsGap?.status === "Not Done" ? "#f44336" : "#e8e8e8",
                              color: employee.skillsGap?.status === "Not Done" ? "#fff" : "#5d4037",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            Not Done
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
                              newData[index].idp.status = "Done"
                              setEmployeeTrackingData(newData)
                            }}
                            style={{
                              flex: "1",
                              padding: "8px",
                              backgroundColor: employee.idp?.status === "Done" ? "#4caf50" : "#e8e8e8",
                              color: employee.idp?.status === "Done" ? "#fff" : "#5d4037",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            Done
                          </button>
                          <button
                            onClick={() => {
                              const newData = [...employeeTrackingData]
                              if (!newData[index].idp) newData[index].idp = {}
                              newData[index].idp.status = "Not Done"
                              setEmployeeTrackingData(newData)
                            }}
                            style={{
                              flex: "1",
                              padding: "8px",
                              backgroundColor: employee.idp?.status === "Not Done" ? "#f44336" : "#e8e8e8",
                              color: employee.idp?.status === "Not Done" ? "#fff" : "#5d4037",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            Not Done
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
                              newData[index].midTermReview.status = "Done"
                              setEmployeeTrackingData(newData)
                            }}
                            style={{
                              flex: "1",
                              padding: "8px",
                              backgroundColor: employee.midTermReview?.status === "Done" ? "#4caf50" : "#e8e8e8",
                              color: employee.midTermReview?.status === "Done" ? "#fff" : "#5d4037",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            Done
                          </button>
                          <button
                            onClick={() => {
                              const newData = [...employeeTrackingData]
                              if (!newData[index].midTermReview) newData[index].midTermReview = {}
                              newData[index].midTermReview.status = "Not Done"
                              setEmployeeTrackingData(newData)
                            }}
                            style={{
                              flex: "1",
                              padding: "8px",
                              backgroundColor: employee.midTermReview?.status === "Not Done" ? "#f44336" : "#e8e8e8",
                              color: employee.midTermReview?.status === "Not Done" ? "#fff" : "#5d4037",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            Not Done
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
                              newData[index].annualReview.status = "Done"
                              setEmployeeTrackingData(newData)
                            }}
                            style={{
                              flex: "1",
                              padding: "8px",
                              backgroundColor: employee.annualReview?.status === "Done" ? "#4caf50" : "#e8e8e8",
                              color: employee.annualReview?.status === "Done" ? "#fff" : "#5d4037",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            Done
                          </button>
                          <button
                            onClick={() => {
                              const newData = [...employeeTrackingData]
                              if (!newData[index].annualReview) newData[index].annualReview = {}
                              newData[index].annualReview.status = "Not Done"
                              setEmployeeTrackingData(newData)
                            }}
                            style={{
                              flex: "1",
                              padding: "8px",
                              backgroundColor: employee.annualReview?.status === "Not Done" ? "#f44336" : "#e8e8e8",
                              color: employee.annualReview?.status === "Not Done" ? "#fff" : "#5d4037",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            Not Done
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Termination and New Hire Data for Stability & Continuity */}
          {activeModalTab === "stability-continuity" && (
            <>
              {/* Termination Records */}
              <div style={{ marginBottom: "30px", padding: "15px", backgroundColor: "#f5f0eb", borderRadius: "8px" }}>
                <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>Termination Records</h4>
                
                {/* Add New Termination Form */}
                <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#fff", borderRadius: "6px", border: "1px solid #e8ddd4" }}>
                  <h5 style={{ color: "#5d4037", marginBottom: "15px" }}>Add New Termination Record</h5>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                    {/* Employee Name */}
                    <div>
                      <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>
                        Employee Name
                      </label>
                      <input
                        type="text"
                        value={newTermination.name}
                        onChange={(e) => setNewTermination({...newTermination, name: e.target.value})}
                        placeholder="John Doe"
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

                    {/* Reason Selection */}
                    <div>
                      <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>
                        Reason for Termination
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
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                    {/* Date Started */}
                    <div>
                      <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>
                        Date Started
                      </label>
                      <input
                        type="date"
                        value={newTermination.dateStarted}
                        onChange={(e) => setNewTermination({...newTermination, dateStarted: e.target.value})}
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

                    {/* Date Ended */}
                    <div>
                      <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>
                        Date Ended
                      </label>
                      <input
                        type="date"
                        value={newTermination.dateEnded}
                        onChange={(e) => setNewTermination({...newTermination, dateEnded: e.target.value})}
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
                    <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead>
                          <tr style={{ backgroundColor: "#e8ddd4" }}>
                            <th style={{ padding: "10px", textAlign: "left", color: "#5d4037" }}>Employee Name</th>
                            <th style={{ padding: "10px", textAlign: "left", color: "#5d4037" }}>Date Started</th>
                            <th style={{ padding: "10px", textAlign: "left", color: "#5d4037" }}>Date Ended</th>
                            <th style={{ padding: "10px", textAlign: "left", color: "#5d4037" }}>Reason</th>
                            <th style={{ padding: "10px", textAlign: "center", color: "#5d4037" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {terminationEntries.map((entry, index) => (
                            <tr key={entry.id || index} style={{ borderBottom: "1px solid #e8ddd4" }}>
                              <td style={{ padding: "10px", color: "#5d4037" }}>{entry.name || "-"}</td>
                              <td style={{ padding: "10px", color: "#5d4037" }}>{entry.dateStarted || "-"}</td>
                              <td style={{ padding: "10px", color: "#5d4037" }}>{entry.dateEnded || "-"}</td>
                              <td style={{ padding: "10px", color: "#5d4037" }}>
                                <span style={{
                                  padding: "4px 8px",
                                  backgroundColor: "#ffebee",
                                  color: "#c62828",
                                  borderRadius: "12px",
                                  fontSize: "11px",
                                  fontWeight: "600"
                                }}>
                                  {entry.reason}
                                </span>
                              </td>
                              <td style={{ padding: "10px", textAlign: "center" }}>
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
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: "20px", textAlign: "center", color: "#8d6e63", backgroundColor: "#fff", borderRadius: "6px" }}>
                      No termination records added yet.
                    </div>
                  )}
                </div>
              </div>

              {/* New Hire Records */}
              <div style={{ marginBottom: "30px", padding: "15px", backgroundColor: "#f5f0eb", borderRadius: "8px" }}>
                <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>New Hire Records</h4>
                
                {/* Add New Hire Form */}
                <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#fff", borderRadius: "6px", border: "1px solid #e8ddd4" }}>
                  <h5 style={{ color: "#5d4037", marginBottom: "15px" }}>Add New Hire</h5>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                    {/* Name */}
                    <div>
                      <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>
                        Employee Name
                      </label>
                      <input
                        type="text"
                        value={newHireForm.name}
                        onChange={(e) => setNewHireForm({...newHireForm, name: e.target.value})}
                        placeholder="John Doe"
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

                    {/* Date Started */}
                    <div>
                      <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>
                        Date Started
                      </label>
                      <input
                        type="date"
                        value={newHireForm.dateStarted}
                        onChange={(e) => setNewHireForm({...newHireForm, dateStarted: e.target.value})}
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

                    {/* Contract Type */}
                    <div>
                      <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>
                        Contract Type
                      </label>
                      <select
                        value={newHireForm.contractType}
                        onChange={(e) => setNewHireForm({...newHireForm, contractType: e.target.value})}
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: "4px",
                          border: "1px solid #e8ddd4",
                          fontSize: "13px",
                          color: "#5d4037",
                        }}
                      >
                        {contractTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* End Date (for non-permanent contracts) */}
                  {newHireForm.contractType !== "Permanent" && (
                    <div style={{ marginBottom: "15px" }}>
                      <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>
                        End Date (if applicable)
                      </label>
                      <input
                        type="date"
                        value={newHireForm.endDate}
                        onChange={(e) => setNewHireForm({...newHireForm, endDate: e.target.value})}
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
                    onClick={addNewHireEntry}
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
                    + Add New Hire
                  </button>
                </div>

                {/* Current New Hire Entries */}
                <div>
                  <h5 style={{ color: "#5d4037", marginBottom: "15px" }}>Current New Hire Records ({newHireEntries.length})</h5>
                  
                  {newHireEntries.length > 0 ? (
                    <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead>
                          <tr style={{ backgroundColor: "#e8ddd4" }}>
                            <th style={{ padding: "10px", textAlign: "left", color: "#5d4037" }}>Employee Name</th>
                            <th style={{ padding: "10px", textAlign: "left", color: "#5d4037" }}>Date Started</th>
                            <th style={{ padding: "10px", textAlign: "left", color: "#5d4037" }}>Contract Type</th>
                            <th style={{ padding: "10px", textAlign: "left", color: "#5d4037" }}>End Date</th>
                            <th style={{ padding: "10px", textAlign: "center", color: "#5d4037" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {newHireEntries.map((entry, index) => (
                            <tr key={entry.id || index} style={{ borderBottom: "1px solid #e8ddd4" }}>
                              <td style={{ padding: "10px", color: "#5d4037" }}>{entry.name}</td>
                              <td style={{ padding: "10px", color: "#5d4037" }}>{entry.dateStarted}</td>
                              <td style={{ padding: "10px", color: "#5d4037" }}>
                                <span style={{
                                  padding: "4px 8px",
                                  backgroundColor: 
                                    entry.contractType === "Permanent" ? "#e8f5e9" :
                                    entry.contractType === "Contract" ? "#fff3e0" : "#f3e5f5",
                                  color: 
                                    entry.contractType === "Permanent" ? "#2e7d32" :
                                    entry.contractType === "Contract" ? "#f57c00" : "#7b1fa2",
                                  borderRadius: "12px",
                                  fontSize: "11px",
                                  fontWeight: "600"
                                }}>
                                  {entry.contractType}
                                </span>
                              </td>
                              <td style={{ padding: "10px", color: "#5d4037" }}>{entry.endDate || "-"}</td>
                              <td style={{ padding: "10px", textAlign: "center" }}>
                                <button
                                  onClick={() => removeNewHireEntry(entry.id)}
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
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: "20px", textAlign: "center", color: "#8d6e63", backgroundColor: "#fff", borderRadius: "6px" }}>
                      No new hire records added yet.
                    </div>
                  )}
                </div>
              </div>
            </>
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

// ==================== EMPLOYEE COMPOSITION COMPONENT ====================

const DARK_BROWN_COLORS = {
  primary: "#3E2723",
  secondary: "#5D4037",
  tertiary: "#795548",
  accent1: "#8D6E63",
  accent2: "#A1887F",
  accent3: "#BCAAA4",
  accent4: "#D7CCC8",
  accent5: "#EFEBE9",
  warning: "#F9A825",
  success: "#2E7D32",
  error: "#C62828",
}

const EmployeeComposition = ({ activeSection, userData, onOpenModal }) => {
  if (activeSection !== "employee-composition") return null

  const defaultData = {
    headCount: 0,
    targetHeadCount: 0,
    permanent: 0,
    contract: 0,
    internship: 0,
    unskilled: 0,
    semiSkilled: 0,
    skilledJnr: 0,
    profMid: 0,
    snrMgt: 0,
    topMgt: 0,
    femalePercent: 0,
    malePercent: 0,
    otherPercent: 0,
    femaleLeadershipPercent: 0,
    youthLeadershipPercent: 0,
    hdiOwnershipPercent: 0,
  }

  const data = { ...defaultData, ...userData }
  const vacancies = Math.max(0, data.targetHeadCount - data.headCount)

  // Calculate totals for percentages
  const totalContract = (data.permanent || 0) + (data.contract || 0) + (data.internship || 0)
  const totalOccupational = (data.unskilled || 0) + (data.semiSkilled || 0) + (data.skilledJnr || 0) + 
                           (data.profMid || 0) + (data.snrMgt || 0) + (data.topMgt || 0)

  // Contract type data
  const contractData = {
    labels: ["Permanent", "Contract", "Internship"],
    datasets: [
      {
        data: [
          data.permanent || 0,
          data.contract || 0,
          data.internship || 0
        ],
        backgroundColor: [
          DARK_BROWN_COLORS.primary,
          DARK_BROWN_COLORS.accent1,
          DARK_BROWN_COLORS.accent3,
        ],
        borderColor: DARK_BROWN_COLORS.primary,
        borderWidth: 2,
      },
    ],
  }

  // Occupational levels data
  const occupationalData = {
    labels: ["Unskilled", "Semi-skilled", "Skilled Jnr", "Prof Mid", "Snr Mgt", "Top Mgt"],
    datasets: [
      {
        label: "Count",
        data: [
          data.unskilled || 0,
          data.semiSkilled || 0,
          data.skilledJnr || 0,
          data.profMid || 0,
          data.snrMgt || 0,
          data.topMgt || 0
        ],
        backgroundColor: [
          DARK_BROWN_COLORS.primary,
          DARK_BROWN_COLORS.secondary,
          DARK_BROWN_COLORS.tertiary,
          DARK_BROWN_COLORS.accent1,
          DARK_BROWN_COLORS.accent2,
          DARK_BROWN_COLORS.accent3,
        ],
        borderColor: DARK_BROWN_COLORS.primary,
        borderWidth: 2,
      },
    ],
  }

  return (
    <div
      style={{
        backgroundColor: "#fdfcfb",
        padding: "25px",
        margin: "20px 0",
        borderRadius: "12px",
        boxShadow: `0 4px 12px rgba(62, 39, 35, 0.15)`,
        border: `1px solid ${DARK_BROWN_COLORS.accent4}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: DARK_BROWN_COLORS.secondary, margin: 0, fontSize: "28px" }}>Employee Composition</h2>
        <button
          onClick={() => onOpenModal("employee-composition")}
          style={{
            padding: "12px 20px",
            backgroundColor: DARK_BROWN_COLORS.secondary,
            color: "#fdfcfb",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        >
         Add Data
        </button>
      </div>

      {/* ESG-N NOTE - VISIBLE ON FRONTEND */}
      <div
        style={{
          backgroundColor: "#f5f0eb",
          padding: "12px 15px",
          marginBottom: "25px",
          borderRadius: "8px",
          borderLeft: `4px solid ${DARK_BROWN_COLORS.primary}`,
          fontSize: "14px",
          color: DARK_BROWN_COLORS.secondary,
        }}
      >
        <strong>ESG Note:</strong> All other demographics (female%, male%, other%, female leadership%, 
        youth leadership%, HDI ownership%) are tracked and reported under ESG Impact.
      </div>

      {/* Top Row - Head Count, Contract Type, Occupational Levels */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          marginBottom: "40px",
        }}
      >
        {/* Head Count with Target and Vacancies */}
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "12px",
            textAlign: "center",
            border: `2px solid ${DARK_BROWN_COLORS.accent4}`,
          }}
        >
          <h3 style={{ color: DARK_BROWN_COLORS.tertiary, margin: "0 0 15px 0", fontSize: "16px" }}>Head Count</h3>
          <div
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${DARK_BROWN_COLORS.secondary}, ${DARK_BROWN_COLORS.tertiary})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 15px auto",
              color: "#fdfcfb",
              fontSize: "28px",
              fontWeight: "bold",
              boxShadow: "0 4px 8px rgba(62, 39, 35, 0.3)",
            }}
          >
            {data.headCount}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              marginTop: "10px",
            }}
          >
            <div
              style={{
                backgroundColor: "#fff",
                padding: "8px",
                borderRadius: "6px",
                border: `1px solid ${DARK_BROWN_COLORS.accent3}`,
              }}
            >
              <div style={{ fontSize: "11px", color: DARK_BROWN_COLORS.tertiary, marginBottom: "3px" }}>Target</div>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: DARK_BROWN_COLORS.secondary }}>
                {data.targetHeadCount}
              </div>
            </div>
            <div
              style={{
                backgroundColor: "#fff",
                padding: "8px",
                borderRadius: "6px",
                border: `1px solid ${DARK_BROWN_COLORS.accent3}`,
              }}
            >
              <div style={{ fontSize: "11px", color: DARK_BROWN_COLORS.tertiary, marginBottom: "3px" }}>Vacancies</div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: vacancies > 0 ? DARK_BROWN_COLORS.warning : DARK_BROWN_COLORS.success,
                }}
              >
                {vacancies}
              </div>
            </div>
          </div>
        </div>

        {/* Contract Type - WITH WHITE NUMBERS */}
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "12px",
            textAlign: "center",
            border: `2px solid ${DARK_BROWN_COLORS.accent4}`,
          }}
        >
          <h3 style={{ color: DARK_BROWN_COLORS.tertiary, margin: "0 0 15px 0", fontSize: "16px" }}>Contract Type</h3>
          <div style={{ height: "150px" }}>
            <Pie
              data={contractData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      color: DARK_BROWN_COLORS.secondary,
                      font: {
                        size: 10,
                        weight: "bold",
                      },
                    },
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const percentage = totalContract > 0 ? ((value / totalContract) * 100).toFixed(1) : 0;
                        return `${label}: ${value} (${percentage}%)`;
                      }
                    }
                  },
                  // WHITE NUMBERS on pie chart
                  datalabels: {
                    display: true,
                    color: '#ffffff',
                    font: {
                      weight: 'bold',
                      size: 12
                    },
                    formatter: (value, context) => {
                      return value > 0 ? value : '';
                    },
                    anchor: 'center',
                    align: 'center',
                    offset: 0
                  }
                },
              }}
            />
          </div>
        </div>

        {/* Occupational Levels */}
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "12px",
            textAlign: "center",
            border: `2px solid ${DARK_BROWN_COLORS.accent4}`,
          }}
        >
          <h3 style={{ color: DARK_BROWN_COLORS.tertiary, margin: "0 0 15px 0", fontSize: "16px" }}>Occupational Levels</h3>
          <div style={{ height: "150px" }}>
            <Bar
              data={occupationalData}
              options={{
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const value = context.raw || 0;
                        const percentage = totalOccupational > 0 ? ((value / totalOccupational) * 100).toFixed(1) : 0;
                        return `Count: ${value} (${percentage}%)`;
                      }
                    }
                  },
                  // NO datalabels on bar chart
                  datalabels: {
                    display: false
                  }
                },
                scales: {
                  x: {
                    beginAtZero: true,
                    grid: {
                      color: DARK_BROWN_COLORS.accent4,
                      drawBorder: false,
                    },
                    ticks: {
                      color: DARK_BROWN_COLORS.secondary,
                      font: {
                        size: 10,
                      },
                    },
                  },
                  y: {
                    grid: {
                      display: false,
                    },
                    ticks: {
                      color: DARK_BROWN_COLORS.secondary,
                      font: {
                        size: 10,
                        weight: "bold",
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Second Row - Leadership & Ownership Metrics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        {/* These fields are under ESG-N reporting */}
      </div>
    </div>
  )
}

// ==================== EXECUTION CAPACITY COMPONENT ====================

const ExecutionCapacity = ({ activeSection, user, isInvestorView }) => {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
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

  // Get months for trend view - last 11 months plus current month
  const getTrendMonths = () => {
    const months = []
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    // Start from 11 months ago and go to current month
    for (let i = 11; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12
      months.push(monthNames[monthIndex])
    }
    return months
  }

  const months = getMonthsForYear(selectedYear, "month")
  const trendMonths = getTrendMonths() // Last 11 months + current month
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
    // Get last 12 months of data (last 11 + current)
    const actualData = Array.isArray(dataArray) 
      ? dataArray.slice(-12).map(v => parseFloat(v) || 0)
      : Array(12).fill(0)
    
    setSelectedTrendItem({ 
      name: itemName, 
      actual: actualData,
      budget: null,
      isPercentage,
      labels: trendMonths // Use the last 11 + current month labels
    })
    setShowTrendModal(true)
  }

  const renderKPICard = (title, data, kpiKey, unit = "", isPercentage = false, calculation = "") => {
    const monthIndex = 11 // Use last month
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
          <h4 style={{ color: "#5d4037", marginBottom: "5px", fontSize: "16px" }}>Founder Operational Load - Last 12 Months</h4>
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
                {trendMonths.map((month, idx) => (
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
                {executionData.founderLoad.slice(-12).map((value, idx) => {
                  const status = getStatus(value, "founderLoad")
                  
                  return (
                    <td key={idx} style={{ padding: "10px", textAlign: "center" }}>
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
          <h4 style={{ color: "#5d4037", marginBottom: "5px", fontSize: "16px" }}>Average Span of Control - Last 12 Months</h4>
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
                {trendMonths.map((month, idx) => (
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
                {executionData.spanOfControl.slice(-12).map((value, idx) => {
                  const status = getStatus(value, "spanOfControl")
                  
                  return (
                    <td key={idx} style={{ padding: "10px", textAlign: "center" }}>
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
                        {value ? `${Number.parseFloat(value).toFixed(1)}` : "Not Set"}
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

      {/* CRITICAL CHARTS - First Row - 2 per row */}
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

      {/* LONG TABLES - Only the original two tables with last 11 + current month data */}
      {renderFounderLoadTable()}
      {renderSpanOfControlTable()}

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
  const [expandedNotes, setExpandedNotes] = useState({})
  const [kpiNotes, setKpiNotes] = useState({})
  const [kpiAnalysis, setKpiAnalysis] = useState({})
  const [showTrendModal, setShowTrendModal] = useState(false)
  const [selectedTrendItem, setSelectedTrendItem] = useState(null)
  const [showCalculationModal, setShowCalculationModal] = useState(false)
  const [selectedCalculation, setSelectedCalculation] = useState({ title: "", calculation: "" })
  const [currencyUnit, setCurrencyUnit] = useState("zar_million")
  
  // Data structure for productivity KPIs with Actual & Budget
  const [productivityData, setProductivityData] = useState({
    salesVolumePerEmployee: { actual: Array(12).fill(""), budget: Array(12).fill("") },
    revenuePerEmployee: { actual: Array(12).fill(""), budget: Array(12).fill("") },
    laborCostPercentage: { actual: Array(12).fill(""), budget: Array(12).fill("") },
    overtimeHours: { actual: Array(12).fill(""), budget: Array(12).fill("") },
  })
  
  // Financial data pulled from Financial Performance
  const [financialData, setFinancialData] = useState({
    revenue: Array(12).fill(0),
    laborCost: Array(12).fill(0),
    employeeCount: Array(12).fill(1)
  })

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
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
      revenuePerEmployee: {
        actual: revenuePerEmployee.map(v => v.toString()),
        budget: prev.revenuePerEmployee?.budget || Array(12).fill("")
      },
      laborCostPercentage: {
        actual: laborCostPercentage.map(v => v.toFixed(2).toString()),
        budget: prev.laborCostPercentage?.budget || Array(12).fill("")
      }
    }))
  }

  const formatValue = (value, unit = currencyUnit) => {
    const num = Number.parseFloat(value) || 0
    switch(unit) {
      case "zar": return `R${num.toLocaleString()}`
      case "zar_thousand": return `R${(num * 1000).toLocaleString()}`
      case "zar_million": return `R${num.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}`
      case "zar_billion": return `R${(num / 1000).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
      default: return `R${num.toLocaleString()}`
    }
  }

  const formatNumber = (value) => {
    const num = Number.parseFloat(value) || 0
    return num.toFixed(1)
  }

  const formatPercentage = (value) => {
    const num = Number.parseFloat(value) || 0
    return `${num.toFixed(1)}%`
  }

  const formatHours = (value) => {
    const num = Number.parseFloat(value) || 0
    return `${num.toFixed(0)} hrs`
  }

  const handleCalculationClick = (title, calculation) => {
    setSelectedCalculation({ title, calculation })
    setShowCalculationModal(true)
  }

  const openTrendModal = (itemName, dataArray, unit = "number") => {
    if (!dataArray) return
    
    const trendData = dataArray.map(v => parseFloat(v) || 0)
    const trendLabels = months
    
    setSelectedTrendItem({ 
      name: itemName, 
      data: trendData,
      labels: trendLabels,
      unit
    })
    setShowTrendModal(true)
  }

  // Circle colors
  const circleColors = [
    { border: "#FF8C00", background: "#FFB347", text: "#663d00" },
    { border: "#32CD32", background: "#90EE90", text: "#1e4d1e" },
    { border: "#FFA500", background: "#FFD700", text: "#664d00" },
  ]

  const TrendArrow = ({ value, goodDirection = "up" }) => {
    const isPositive = value > 0
    const isGood = (goodDirection === "up" && isPositive) || (goodDirection === "down" && !isPositive)
    
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "center" }}>
        {isPositive ? (
          <TrendingUp size={16} color={isGood ? "#16a34a" : "#dc2626"} />
        ) : (
          <TrendingDown size={16} color={isGood ? "#16a34a" : "#dc2626"} />
        )}
        <span style={{ 
          color: isGood ? "#16a34a" : "#dc2626",
          fontSize: "12px",
          fontWeight: "600"
        }}>
          {Math.abs(value).toFixed(1)}%
        </span>
      </div>
    )
  }

  const renderTripleCard = (title, dataKey, unit = "number", goodDirection = "up", calculation = "") => {
    const monthIndex = new Date().getMonth() // Current month
    
    let actualValue = 0
    let budgetValue = 0
    let formatFn = formatNumber
    
    if (dataKey === "revenuePerEmployee") {
      actualValue = parseFloat(productivityData.revenuePerEmployee?.actual?.[monthIndex]) || 0
      budgetValue = parseFloat(productivityData.revenuePerEmployee?.budget?.[monthIndex]) || 0
      formatFn = formatValue
      unit = "currency"
    } else if (dataKey === "laborCostPercentage") {
      actualValue = parseFloat(productivityData.laborCostPercentage?.actual?.[monthIndex]) || 0
      budgetValue = parseFloat(productivityData.laborCostPercentage?.budget?.[monthIndex]) || 0
      formatFn = formatPercentage
      unit = "percentage"
    } else if (dataKey === "salesVolumePerEmployee") {
      actualValue = parseFloat(productivityData.salesVolumePerEmployee?.actual?.[monthIndex]) || 0
      budgetValue = parseFloat(productivityData.salesVolumePerEmployee?.budget?.[monthIndex]) || 0
      formatFn = formatNumber
    } else if (dataKey === "overtimeHours") {
      actualValue = parseFloat(productivityData.overtimeHours?.actual?.[monthIndex]) || 0
      budgetValue = parseFloat(productivityData.overtimeHours?.budget?.[monthIndex]) || 0
      formatFn = formatHours
    }
    
    const variance = actualValue - budgetValue
    const variancePercent = budgetValue !== 0 ? (variance / Math.abs(budgetValue)) * 100 : 0
    
    return (
      <div
        style={{
          backgroundColor: "#fdfcfb",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          marginBottom: "20px",
          position: "relative",
          border: "1px solid #e8ddd4",
        }}
      >
        {/* Eye Icon */}
        <div
          onClick={() => handleCalculationClick(title, calculation)}
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
            zIndex: 10,
            border: `2px solid ${circleColors[0].border}`,
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={circleColors[0].border} strokeWidth="2">
            <circle cx="12" cy="12" r="2"></circle>
            <circle cx="12" cy="12" r="5" strokeOpacity="0.5"></circle>
            <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z"></path>
          </svg>
        </div>

        {/* Title */}
        <h4 style={{ color: "#5d4037", marginBottom: "20px", fontSize: "16px", textAlign: "center", fontWeight: "600" }}>
          {title}
        </h4>

        {/* Three Circles */}
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", marginBottom: "20px" }}>
          {/* Actual Circle */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                border: `4px solid ${circleColors[0].border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 8px",
                backgroundColor: circleColors[0].background,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "14px", fontWeight: "700", color: circleColors[0].text }}>
                  {formatFn(actualValue)}
                </div>
              </div>
            </div>
            <div style={{ fontSize: "11px", color: "#5d4037", fontWeight: "500" }}>Actual</div>
          </div>

          {/* Budget Circle */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                border: `4px solid ${circleColors[1].border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 8px",
                backgroundColor: circleColors[1].background,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "14px", fontWeight: "700", color: circleColors[1].text }}>
                  {formatFn(budgetValue)}
                </div>
              </div>
            </div>
            <div style={{ fontSize: "11px", color: "#5d4037", fontWeight: "500" }}>Budget</div>
          </div>

          {/* Variance Circle */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                border: `4px solid ${circleColors[2].border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 8px",
                backgroundColor: circleColors[2].background,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <TrendArrow value={variancePercent} goodDirection={goodDirection} />
              </div>
            </div>
            <div style={{ fontSize: "11px", color: "#5d4037", fontWeight: "500" }}>Variance</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ borderTop: "1px solid #e8ddd4", paddingTop: "15px" }}>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "10px" }}>
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
              onClick={() => {
                let dataArray = []
                if (dataKey === "revenuePerEmployee") dataArray = productivityData.revenuePerEmployee?.actual || []
                else if (dataKey === "laborCostPercentage") dataArray = productivityData.laborCostPercentage?.actual || []
                else if (dataKey === "salesVolumePerEmployee") dataArray = productivityData.salesVolumePerEmployee?.actual || []
                else if (dataKey === "overtimeHours") dataArray = productivityData.overtimeHours?.actual || []
                openTrendModal(title, dataArray, unit)
              }}
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
              <label style={{ fontSize: "12px", color: "#5d4037", fontWeight: "600", display: "block", marginBottom: "5px" }}>
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
            <div style={{ backgroundColor: "#e3f2fd", padding: "15px", borderRadius: "6px", border: "1px solid #90caf9" }}>
              <label style={{ fontSize: "12px", color: "#1565c0", fontWeight: "600", display: "block", marginBottom: "8px" }}>
                AI Analysis:
              </label>
              <p style={{ fontSize: "13px", color: "#1565c0", lineHeight: "1.5", margin: 0 }}>
                {kpiAnalysis[dataKey] ||
                  `Based on current ${title.toLowerCase()}:
                  \n\nActual: ${formatFn(actualValue)} vs Budget: ${formatFn(budgetValue)}
                  \nVariance: ${variancePercent > 0 ? '+' : ''}${variancePercent.toFixed(1)}%
                  \n\nRecommended actions:
                  \n• ${variancePercent > 0 ? 'Exceeding budget - analyze what\'s working well' : 'Below budget - investigate causes and adjust plans'}
                  \n• Review trends over past months
                  \n• Set improvement targets for next period`}
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

      {/* Productivity Triple Cards - 2 per row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "30px" }}>
        {renderTripleCard(
          "Revenue per Employee", 
          "revenuePerEmployee", 
          "currency", 
          "up",
          "Revenue per Employee measures the average revenue generated per employee.\n\n" +
          "Calculation: Total Revenue ÷ Total Number of Employees\n\n" +
          "This metric is automatically calculated from Financial Performance data:\n" +
          "• Revenue: Pulled from P&L Statement\n" +
          "• Employee Count: Pulled from Balance Sheet - Additional Metrics\n\n" +
          "Higher values indicate better productivity and efficiency.\n" +
          "Compare against industry benchmarks and track trends over time."
        )}
        {renderTripleCard(
          "Labour Cost % of Revenue", 
          "laborCostPercentage", 
          "percentage", 
          "down",
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
        {renderTripleCard(
          "Sales Volume per Employee", 
          "salesVolumePerEmployee", 
          "number", 
          "up",
          "Sales Volume per Employee measures the average number of units sold per employee.\n\n" +
          "Calculation: Total Units Sold ÷ Total Number of Employees\n\n" +
          "This metric helps assess operational efficiency and sales productivity.\n" +
          "Enter monthly sales volume data manually in the Add Data modal.\n\n" +
          "Track this metric to:\n" +
          "• Identify top-performing periods\n" +
          "• Plan seasonal staffing needs\n" +
          "• Benchmark sales team performance"
        )}
        {renderTripleCard(
          "Overtime Hours", 
          "overtimeHours", 
          "hours", 
          "down",
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
      {showTrendModal && selectedTrendItem && (
        <TrendModal
          isOpen={showTrendModal}
          onClose={() => setShowTrendModal(false)}
          title={selectedTrendItem.name}
          data={selectedTrendItem.data}
          labels={selectedTrendItem.labels}
          unit={selectedTrendItem.unit}
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
  
  // Data structure for capability & training KPIs with Actual & Budget
  const [capabilityData, setCapabilityData] = useState({
    trainingSpendAmount: { actual: Array(12).fill(""), budget: Array(12).fill("") },
    trainingSpendPercentage: { actual: Array(12).fill(""), budget: Array(12).fill("") },
    trainingFocus: { actual: Array(12).fill(""), budget: Array(12).fill("") },
  })
  
  // Financial data pulled from Financial Performance
  const [financialData, setFinancialData] = useState({
    laborCost: Array(12).fill(1),
    trainingSpend: Array(12).fill(0)
  })

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
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
      trainingSpendAmount: {
        actual: data.trainingSpend.map(v => v.toString()),
        budget: prev.trainingSpendAmount?.budget || Array(12).fill("")
      },
      trainingSpendPercentage: {
        actual: trainingSpendPercentage.map(v => v.toFixed(2).toString()),
        budget: prev.trainingSpendPercentage?.budget || Array(12).fill("")
      }
    }))
  }

  const formatValue = (value, unit = currencyUnit) => {
    const num = Number.parseFloat(value) || 0
    switch(unit) {
      case "zar": return `R${num.toLocaleString()}`
      case "zar_thousand": return `R${(num * 1000).toLocaleString()}`
      case "zar_million": return `R${num.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}`
      case "zar_billion": return `R${(num / 1000).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
      default: return `R${num.toLocaleString()}`
    }
  }

  const formatPercentage = (value) => {
    const num = Number.parseFloat(value) || 0
    return `${num.toFixed(1)}%`
  }

  const handleCalculationClick = (title, calculation) => {
    setSelectedCalculation({ title, calculation })
    setShowCalculationModal(true)
  }

  const openTrendModal = (itemName, dataArray, unit = "number") => {
    if (!dataArray) return
    
    const trendData = dataArray.map(v => parseFloat(v) || 0)
    const trendLabels = months
    
    setSelectedTrendItem({ 
      name: itemName, 
      data: trendData,
      labels: trendLabels,
      unit
    })
    setShowTrendModal(true)
  }

  // Circle colors
  const circleColors = [
    { border: "#FF8C00", background: "#FFB347", text: "#663d00" },
    { border: "#32CD32", background: "#90EE90", text: "#1e4d1e" },
    { border: "#FFA500", background: "#FFD700", text: "#664d00" },
  ]

  const TrendArrow = ({ value, goodDirection = "up" }) => {
    const isPositive = value > 0
    const isGood = (goodDirection === "up" && isPositive) || (goodDirection === "down" && !isPositive)
    
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "center" }}>
        {isPositive ? (
          <TrendingUp size={16} color={isGood ? "#16a34a" : "#dc2626"} />
        ) : (
          <TrendingDown size={16} color={isGood ? "#16a34a" : "#dc2626"} />
        )}
        <span style={{ 
          color: isGood ? "#16a34a" : "#dc2626",
          fontSize: "12px",
          fontWeight: "600"
        }}>
          {Math.abs(value).toFixed(1)}%
        </span>
      </div>
    )
  }

  const renderTripleCard = (title, dataKey, unit = "number", goodDirection = "up", calculation = "") => {
    const monthIndex = new Date().getMonth() // Current month
    
    let actualValue = 0
    let budgetValue = 0
    let formatFn = formatValue
    
    if (dataKey === "trainingSpendAmount") {
      actualValue = parseFloat(capabilityData.trainingSpendAmount?.actual?.[monthIndex]) || 0
      budgetValue = parseFloat(capabilityData.trainingSpendAmount?.budget?.[monthIndex]) || 0
      formatFn = (val) => formatValue(val, "zar_million")
      unit = "currency"
    } else if (dataKey === "trainingSpendPercentage") {
      actualValue = parseFloat(capabilityData.trainingSpendPercentage?.actual?.[monthIndex]) || 0
      budgetValue = parseFloat(capabilityData.trainingSpendPercentage?.budget?.[monthIndex]) || 0
      formatFn = formatPercentage
      unit = "percentage"
    } else if (dataKey === "trainingFocus") {
      const actualVal = capabilityData.trainingFocus?.actual?.[monthIndex] || ""
      const budgetVal = capabilityData.trainingFocus?.budget?.[monthIndex] || ""
      
      // Convert numeric values to labels for display
      const getFocusLabel = (val) => {
        if (val === "1") return "Technical"
        if (val === "2") return "Leadership"
        if (val === "3") return "Compliance"
        return "Not Set"
      }
      
      actualValue = getFocusLabel(actualVal)
      budgetValue = getFocusLabel(budgetVal)
      formatFn = (val) => val
    }
    
    // For training focus, variance is not applicable
    const showVariance = dataKey !== "trainingFocus"
    const variance = showVariance ? actualValue - budgetValue : 0
    const variancePercent = showVariance && budgetValue !== 0 ? (variance / Math.abs(budgetValue)) * 100 : 0
    
    return (
      <div
        style={{
          backgroundColor: "#fdfcfb",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          marginBottom: "20px",
          position: "relative",
          border: "1px solid #e8ddd4",
        }}
      >
        {/* Eye Icon */}
        <div
          onClick={() => handleCalculationClick(title, calculation)}
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
            zIndex: 10,
            border: `2px solid ${circleColors[0].border}`,
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={circleColors[0].border} strokeWidth="2">
            <circle cx="12" cy="12" r="2"></circle>
            <circle cx="12" cy="12" r="5" strokeOpacity="0.5"></circle>
            <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z"></path>
          </svg>
        </div>

        {/* Title */}
        <h4 style={{ color: "#5d4037", marginBottom: "20px", fontSize: "16px", textAlign: "center", fontWeight: "600" }}>
          {title}
        </h4>

        {/* Three Circles */}
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", marginBottom: "20px" }}>
          {/* Actual Circle */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                border: `4px solid ${circleColors[0].border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 8px",
                backgroundColor: circleColors[0].background,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "14px", fontWeight: "700", color: circleColors[0].text }}>
                  {formatFn(actualValue)}
                </div>
              </div>
            </div>
            <div style={{ fontSize: "11px", color: "#5d4037", fontWeight: "500" }}>Actual</div>
          </div>

          {/* Budget Circle */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                border: `4px solid ${circleColors[1].border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 8px",
                backgroundColor: circleColors[1].background,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "14px", fontWeight: "700", color: circleColors[1].text }}>
                  {formatFn(budgetValue)}
                </div>
              </div>
            </div>
            <div style={{ fontSize: "11px", color: "#5d4037", fontWeight: "500" }}>Budget</div>
          </div>

          {/* Variance Circle */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                border: `4px solid ${circleColors[2].border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 8px",
                backgroundColor: circleColors[2].background,
              }}
            >
              <div style={{ textAlign: "center" }}>
                {showVariance ? (
                  <TrendArrow value={variancePercent} goodDirection={goodDirection} />
                ) : (
                  <span style={{ fontSize: "12px", color: circleColors[2].text }}>N/A</span>
                )}
              </div>
            </div>
            <div style={{ fontSize: "11px", color: "#5d4037", fontWeight: "500" }}>Variance</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ borderTop: "1px solid #e8ddd4", paddingTop: "15px" }}>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "10px" }}>
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
              onClick={() => {
                let dataArray = []
                if (dataKey === "trainingSpendAmount") dataArray = capabilityData.trainingSpendAmount?.actual || []
                else if (dataKey === "trainingSpendPercentage") dataArray = capabilityData.trainingSpendPercentage?.actual || []
                else if (dataKey === "trainingFocus") dataArray = capabilityData.trainingFocus?.actual || []
                openTrendModal(title, dataArray, unit)
              }}
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
              <label style={{ fontSize: "12px", color: "#5d4037", fontWeight: "600", display: "block", marginBottom: "5px" }}>
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
            <div style={{ backgroundColor: "#e3f2fd", padding: "15px", borderRadius: "6px", border: "1px solid #90caf9" }}>
              <label style={{ fontSize: "12px", color: "#1565c0", fontWeight: "600", display: "block", marginBottom: "8px" }}>
                AI Analysis:
              </label>
              <p style={{ fontSize: "13px", color: "#1565c0", lineHeight: "1.5", margin: 0 }}>
                {kpiAnalysis[dataKey] ||
                  `Based on current ${title.toLowerCase()}:
                  \n\nActual: ${formatFn(actualValue)} vs Budget: ${formatFn(budgetValue)}
                  \n${showVariance ? `Variance: ${variancePercent > 0 ? '+' : ''}${variancePercent.toFixed(1)}%` : ''}
                  \n\nRecommended actions:
                  \n• ${variancePercent > 0 ? 'Exceeding budget - consider reallocating excess' : 'Below budget - identify barriers to investment'}
                  \n• Compare against industry benchmarks
                  \n• Link training outcomes to business results`}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderEmployeeTrackingTable = () => {
    // Calculate summary statistics
    const totalEmployees = employeeTrackingData.length
    const skillsGapDone = employeeTrackingData.filter(e => e.skillsGap?.status === "Done").length
    const idpDone = employeeTrackingData.filter(e => e.idp?.status === "Done").length
    const midTermReviewDone = employeeTrackingData.filter(e => e.midTermReview?.status === "Done").length
    const annualReviewDone = employeeTrackingData.filter(e => e.annualReview?.status === "Done").length

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
                        backgroundColor: employee.skillsGap?.status === "Done" ? "#4caf50" : "#f44336",
                        color: "#fff"
                      }}>
                        {employee.skillsGap?.status === "Done" ? "Done" : "Not Done"}
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
                        backgroundColor: employee.idp?.status === "Done" ? "#4caf50" : "#f44336",
                        color: "#fff"
                      }}>
                        {employee.idp?.status === "Done" ? "Done" : "Not Done"}
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
                        backgroundColor: employee.midTermReview?.status === "Done" ? "#4caf50" : "#f44336",
                        color: "#fff"
                      }}>
                        {employee.midTermReview?.status === "Done" ? "Done" : "Not Done"}
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
                        backgroundColor: employee.annualReview?.status === "Done" ? "#4caf50" : "#f44336",
                        color: "#fff"
                      }}>
                        {employee.annualReview?.status === "Done" ? "Done" : "Not Done"}
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

      {/* Capability Triple Cards - 3 per row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
        {renderTripleCard(
          "Training Spend (R)", 
          "trainingSpendAmount", 
          "currency", 
          "up",
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
        {renderTripleCard(
          "Training Spend (% of payroll)", 
          "trainingSpendPercentage", 
          "percentage", 
          "up",
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
        {renderTripleCard(
          "Training Focus", 
          "trainingFocus", 
          "text", 
          "up",
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
      {showTrendModal && selectedTrendItem && (
        <TrendModal
          isOpen={showTrendModal}
          onClose={() => setShowTrendModal(false)}
          title={selectedTrendItem.name}
          data={selectedTrendItem.data}
          labels={selectedTrendItem.labels}
          unit={selectedTrendItem.unit}
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

  // Data structure for termination and new hire entries
  const [terminationEntries, setTerminationEntries] = useState([])
  const [newHireEntries, setNewHireEntries] = useState([])

  // Get months for trend view - last 11 months plus current month
  const getTrendMonths = () => {
    const months = []
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    // Start from 11 months ago and go to current month
    for (let i = 11; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12
      months.push(monthNames[monthIndex])
    }
    return months
  }

  const months = getMonthsForYear(selectedYear, "month")
  const trendMonths = getTrendMonths() // Last 11 months + current month
  const years = Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i)

  useEffect(() => {
    if (user) {
      loadStabilityData()
      loadTerminationData()
      loadNewHireData()
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

  const loadNewHireData = async () => {
    if (!user) return
    try {
      const hireDoc = await getDoc(doc(db, "peopleData", `${user.uid}_newHireData`))
      if (hireDoc.exists()) {
        const data = hireDoc.data()
        if (data.entries) setNewHireEntries(data.entries)
      }
    } catch (error) {
      console.error("Error loading new hire data:", error)
    }
  }

  // Calculate summary statistics from termination entries
  const calculateTerminationSummary = () => {
    const summary = {
      total: terminationEntries.length,
      byReason: {}
    }

    terminationEntries.forEach(entry => {
      summary.byReason[entry.reason] = (summary.byReason[entry.reason] || 0) + 1
    })

    return summary
  }

  const calculateNewHireSummary = () => {
    const summary = {
      total: newHireEntries.length,
      byType: {
        Permanent: newHireEntries.filter(e => e.contractType === "Permanent").length,
        Contract: newHireEntries.filter(e => e.contractType === "Contract").length,
        Internship: newHireEntries.filter(e => e.contractType === "Internship").length
      },
      byMonth: {}
    }

    newHireEntries.forEach(entry => {
      const date = new Date(entry.dateStarted)
      const month = date.toLocaleString('default', { month: 'short' })
      summary.byMonth[month] = (summary.byMonth[month] || 0) + 1
    })

    return summary
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
      actual: actualData.slice(-12), // Last 12 months
      budget: null,
      isPercentage,
      labels: trendMonths
    })
    setShowTrendModal(true)
  }

  const renderTerminationTable = () => {
    const summary = calculateTerminationSummary()

    return (
      <div
        style={{
          backgroundColor: "#fdfcfb",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h4 style={{ color: "#5d4037", marginBottom: "5px", fontSize: "16px" }}>Termination Records</h4>
          <EyeIcon 
            onClick={() => handleCalculationClick(
              "Termination Analysis", 
              "Termination Analysis tracks employee exits by employee.\n\n" +
              "Common termination reasons and implications:\n\n" +
              "• Performance: May indicate hiring quality or management issues\n" +
              "• Resignation: Voluntary exits - conduct exit interviews to identify patterns\n" +
              "• Redundancy: Role elimination - ensure fair process and communication\n" +
              "• Misconduct: Policy violations - review training and communication\n" +
              "• Retirement: Natural attrition - plan for knowledge transfer\n\n" +
              "Key metrics:\n" +
              "• Total terminations: Monitor trend over time\n" +
              "• Top reasons: Address root causes\n\n" +
              "Target: Voluntary turnover <15% annually, involuntary turnover <5% annually"
            )} 
          />
        </div>
        
        {/* Summary Statistics */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(2, 1fr)", 
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
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#5d4037" }}>
              {Object.keys(summary.byReason).length}
            </div>
            <div style={{ fontSize: "12px", color: "#8d6e63" }}>Unique Reasons</div>
          </div>
        </div>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ backgroundColor: "#e8ddd4" }}>
                <th style={{ padding: "12px", textAlign: "left", color: "#5d4037" }}>Employee Name</th>
                <th style={{ padding: "12px", textAlign: "left", color: "#5d4037" }}>Date Started</th>
                <th style={{ padding: "12px", textAlign: "left", color: "#5d4037" }}>Date Ended</th>
                <th style={{ padding: "12px", textAlign: "left", color: "#5d4037" }}>Reason</th>
                <th style={{ padding: "12px", textAlign: "center", color: "#5d4037" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {terminationEntries.length > 0 ? (
                terminationEntries.map((entry, index) => (
                  <tr key={entry.id || index} style={{ borderBottom: "1px solid #e8ddd4" }}>
                    <td style={{ padding: "12px", color: "#5d4037" }}>{entry.name || "-"}</td>
                    <td style={{ padding: "12px", color: "#5d4037" }}>{entry.dateStarted || "-"}</td>
                    <td style={{ padding: "12px", color: "#5d4037" }}>{entry.dateEnded || "-"}</td>
                    <td style={{ padding: "12px", color: "#5d4037" }}>
                      <span style={{
                        padding: "4px 8px",
                        backgroundColor: "#ffebee",
                        color: "#c62828",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "600"
                      }}>
                        {entry.reason}
                      </span>
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <button
                        onClick={() => {
                          const newEntries = terminationEntries.filter(e => e.id !== entry.id)
                          setTerminationEntries(newEntries)
                        }}
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
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: "20px", textAlign: "center", color: "#8d6e63" }}>
                    No termination records found. Click "Add Data" to add termination records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderNewHireTable = () => {
    const summary = calculateNewHireSummary()

    return (
      <div
        style={{
          backgroundColor: "#fdfcfb",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h4 style={{ color: "#5d4037", marginBottom: "5px", fontSize: "16px" }}>New Hire Records</h4>
          <EyeIcon 
            onClick={() => handleCalculationClick(
              "New Hire Analysis", 
              "New Hire Analysis tracks new employee additions by type and date.\n\n" +
              "Contract types and implications:\n\n" +
              "• Permanent: Core team members, long-term investment\n" +
              "• Contract: Project-based or temporary, flexible capacity\n" +
              "• Internship: Pipeline for future talent, development opportunity\n\n" +
              "Key metrics:\n" +
              "• Total new hires: Monitor growth rate\n" +
              "• Contract type mix: Indicates workforce strategy\n" +
              "• Seasonal patterns: Plan recruitment cycles\n\n" +
              "Track against termination data to understand net headcount growth."
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
            <div style={{ fontSize: "12px", color: "#8d6e63" }}>Total New Hires</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "#2e7d32" }}>{summary.byType.Permanent}</div>
            <div style={{ fontSize: "11px", color: "#8d6e63" }}>Permanent</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "#f57c00" }}>{summary.byType.Contract}</div>
            <div style={{ fontSize: "11px", color: "#8d6e63" }}>Contract</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "#7b1fa2" }}>{summary.byType.Internship}</div>
            <div style={{ fontSize: "11px", color: "#8d6e63" }}>Internship</div>
          </div>
        </div>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ backgroundColor: "#e8ddd4" }}>
                <th style={{ padding: "12px", textAlign: "left", color: "#5d4037" }}>Employee Name</th>
                <th style={{ padding: "12px", textAlign: "left", color: "#5d4037" }}>Date Started</th>
                <th style={{ padding: "12px", textAlign: "left", color: "#5d4037" }}>Contract Type</th>
                <th style={{ padding: "12px", textAlign: "left", color: "#5d4037" }}>End Date</th>
                <th style={{ padding: "12px", textAlign: "center", color: "#5d4037" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {newHireEntries.length > 0 ? (
                newHireEntries.map((entry, index) => (
                  <tr key={entry.id || index} style={{ borderBottom: "1px solid #e8ddd4" }}>
                    <td style={{ padding: "12px", color: "#5d4037" }}>{entry.name}</td>
                    <td style={{ padding: "12px", color: "#5d4037" }}>{entry.dateStarted}</td>
                    <td style={{ padding: "12px", color: "#5d4037" }}>
                      <span style={{
                        padding: "4px 8px",
                        backgroundColor: 
                          entry.contractType === "Permanent" ? "#e8f5e9" :
                          entry.contractType === "Contract" ? "#fff3e0" : "#f3e5f5",
                        color: 
                          entry.contractType === "Permanent" ? "#2e7d32" :
                          entry.contractType === "Contract" ? "#f57c00" : "#7b1fa2",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "600"
                      }}>
                        {entry.contractType}
                      </span>
                    </td>
                    <td style={{ padding: "12px", color: "#5d4037" }}>{entry.endDate || "-"}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <button
                        onClick={() => {
                          const newEntries = newHireEntries.filter(e => e.id !== entry.id)
                          setNewHireEntries(newEntries)
                        }}
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
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: "20px", textAlign: "center", color: "#8d6e63" }}>
                    No new hire records found. Click "Add Data" to add new hire records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderTerminationPieChart = () => {
    const summary = calculateTerminationSummary()
    const reasons = Object.keys(summary.byReason)
    const values = reasons.map(r => summary.byReason[r])

    if (reasons.length === 0) return null

    const colors = ["#3E2723", "#5D4037", "#795548", "#8D6E63", "#A1887F", "#BCAAA4"]

    const data = {
      labels: reasons,
      datasets: [
        {
          data: values,
          backgroundColor: colors.slice(0, reasons.length),
          borderColor: "#ffffff",
          borderWidth: 2,
        },
      ],
    }

    return (
      <div
        style={{
          backgroundColor: "#fdfcfb",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <h4 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "16px", textAlign: "center" }}>
          Reasons for Termination
        </h4>
        <div style={{ height: "250px" }}>
          <Pie
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "bottom",
                  labels: {
                    color: "#5d4037",
                    font: {
                      size: 11,
                    },
                  },
                },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const label = context.label || '';
                      const value = context.raw || 0;
                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                      const percentage = ((value / total) * 100).toFixed(1);
                      return `${label}: ${value} (${percentage}%)`;
                    }
                  }
                },
                // WHITE NUMBERS on pie chart
                datalabels: {
                  display: true,
                  color: '#ffffff',
                  font: {
                    weight: 'bold',
                    size: 12
                  },
                  formatter: (value, context) => {
                    return value > 0 ? value : '';
                  },
                  anchor: 'center',
                  align: 'center',
                  offset: 0
                }
              },
            }}
          />
        </div>
      </div>
    )
  }

  const renderNewHirePieChart = () => {
    const summary = calculateNewHireSummary()
    const types = Object.keys(summary.byType).filter(type => summary.byType[type] > 0)
    const values = types.map(t => summary.byType[t])

    if (types.length === 0 || summary.total === 0) return null

    const colors = ["#2e7d32", "#f57c00", "#7b1fa2"]

    const data = {
      labels: types,
      datasets: [
        {
          data: values,
          backgroundColor: colors.slice(0, types.length),
          borderColor: "#ffffff",
          borderWidth: 2,
        },
      ],
    }

    return (
      <div
        style={{
          backgroundColor: "#fdfcfb",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <h4 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "16px", textAlign: "center" }}>
          New Hires by Contract Type
        </h4>
        <div style={{ height: "250px" }}>
          <Pie
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "bottom",
                  labels: {
                    color: "#5d4037",
                    font: {
                      size: 11,
                    },
                  },
                },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const label = context.label || '';
                      const value = context.raw || 0;
                      const percentage = ((value / summary.total) * 100).toFixed(1);
                      return `${label}: ${value} (${percentage}%)`;
                    }
                  }
                },
                // WHITE NUMBERS on pie chart
                datalabels: {
                  display: true,
                  color: '#ffffff',
                  font: {
                    weight: 'bold',
                    size: 12
                  },
                  formatter: (value, context) => {
                    return value > 0 ? value : '';
                  },
                  anchor: 'center',
                  align: 'center',
                  offset: 0
                }
              },
            }}
          />
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

      {/* Row 1: Termination Table and Pie Chart */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        {renderTerminationTable()}
        {renderTerminationPieChart()}
      </div>

      {/* Row 2: New Hires Table and Pie Chart */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        {renderNewHireTable()}
        {renderNewHirePieChart()}
      </div>

      {/* Row 3: KPI Cards - 4 per row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "30px" }}>
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
          loadNewHireData()
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
          formatValue={formatValue}
        />
      )}
    </div>
  )
}

// ==================== MAIN PEOPLE PERFORMANCE COMPONENT ====================

const PeoplePerformance = () => {
  const [activeSection, setActiveSection] = useState("employee-composition") // Changed default to employee-composition
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [user, setUser] = useState(null)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [showDataEntryModal, setShowDataEntryModal] = useState(false)
  const [userData, setUserData] = useState({})
  const [loading, setLoading] = useState(false)

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
    if (user && activeSection === "employee-composition") {
      loadEmployeeData()
    }
  }, [user, activeSection])

  const loadEmployeeData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const employeeDoc = await getDoc(doc(db, "peopleData", `${user.uid}_employeeComposition`))
      if (employeeDoc.exists()) {
        const data = employeeDoc.data()
        if (data.employeeData) {
          setUserData(data.employeeData)
        } else {
          setUserData({})
        }
      } else {
        setUserData({})
      }
    } catch (error) {
      console.error("Error loading employee composition data:", error)
      setUserData({})
    } finally {
      setLoading(false)
    }
  }

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
    { id: "employee-composition", label: "Employee Composition" },
    { id: "execution-capacity", label: "Execution Capacity" },
    { id: "productivity", label: "Productivity" },
    { id: "capability-training", label: "Capability & Training" },
    { id: "stability-continuity", label: "Stability & Continuity" },
  ]

  const handleExitInvestorView = () => {
    sessionStorage.removeItem("viewingSMEId")
    sessionStorage.removeItem("viewingSMEName")
    sessionStorage.removeItem("investorViewMode")
    window.location.href = "/my-cohorts"
  }

  const handleOpenModal = (tabId) => {
    setShowDataEntryModal(true)
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
                transition: "backgroundColor 0.3s ease",
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

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#8d6e63" }}>
            Loading data...
          </div>
        ) : (
          <>
            <EmployeeComposition
              activeSection={activeSection}
              userData={userData}
              onOpenModal={handleOpenModal}
            />

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
          </>
        )}

        <UnifiedDataEntryModal
          isOpen={showDataEntryModal}
          onClose={() => setShowDataEntryModal(false)}
          currentTab={activeSection}
          user={user}
          onSave={() => {
            if (activeSection === "employee-composition") {
              loadEmployeeData()
            }
          }}
          loading={loading}
        />
      </div>
    </div>
  )
}

export default PeoplePerformance