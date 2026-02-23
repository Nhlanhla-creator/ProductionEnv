"use client"

import { useState, useEffect } from "react"
import { Bar, Line } from "react-chartjs-2"
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
  Title,
  Tooltip,
  Legend,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend)

// ==================== HELPER FUNCTIONS ====================

const getMonthsForYear = (year, financialYearStart = "Jan") => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const startIndex = months.indexOf(financialYearStart)
  if (startIndex === -1) return months
  return [...months.slice(startIndex), ...months.slice(0, startIndex)]
}

const getYearsRange = (startYear = 2021, endYear = 2030) => {
  const years = []
  for (let year = startYear; year <= endYear; year++) {
    years.push(year)
  }
  return years
}

const formatCurrency = (value, unit = "zar_million", decimals = 2) => {
  const num = Number.parseFloat(value) || 0
  switch(unit) {
    case "zar": return `R${num.toLocaleString(undefined, {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}`
    case "zar_thousand": return `R${(num * 1000).toLocaleString(undefined, {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}K`
    case "zar_million": return `R${num.toLocaleString(undefined, {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}m`
    case "zar_billion": return `R${(num / 1000).toLocaleString(undefined, {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}bn`
    default: return `R${num.toLocaleString(undefined, {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}`
  }
}

const formatPercentage = (value, decimals = 2) => {
  const num = Number.parseFloat(value) || 0
  return `${num.toFixed(decimals)}%`
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

const getFinancialYearStart = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "universalProfiles", userId))
    if (userDoc.exists()) {
      const data = userDoc.data()
      const financialYearEnd = data.entityOverview?.financialYearEnd
      if (financialYearEnd) {
        // financialYearEnd is in format "YYYY-MM"
        const month = new Date(financialYearEnd + "-01").toLocaleString('default', { month: 'short' })
        // Financial year start is the month after year end
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        const endIndex = months.indexOf(month)
        const startIndex = (endIndex + 1) % 12
        return months[startIndex]
      }
    }
  } catch (error) {
    console.error("Error getting financial year start:", error)
  }
  return "Jan" // Default to Jan if not found
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

// ==================== BUDGET ARROW COMPONENT ====================

const BudgetArrow = ({ actual, budget }) => {
  const actualNum = Number.parseFloat(actual) || 0
  const budgetNum = Number.parseFloat(budget) || 0
  const variance = actualNum - budgetNum
  const variancePercent = budgetNum !== 0 ? (variance / budgetNum) * 100 : 0
  
  let arrow = null
  let color = "#5d4037"
  
  if (variance > 0) {
    arrow = "↑"
    color = "#2e7d32" // green
  } else if (variance < 0) {
    arrow = "↓"
    color = "#c62828" // red
  } else {
    arrow = "→"
    color = "#f9a825" // yellow
  }
  
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <span style={{ color, fontWeight: "600", fontSize: "14px" }}>{arrow}</span>
      <span style={{ fontSize: "11px", color: "#8d6e63" }}>
        {variancePercent !== 0 && `${Math.abs(variancePercent).toFixed(1)}%`}
      </span>
    </div>
  )
}

// ==================== KPI CARD WITH BUDGET CIRCLE ====================

const KPICard = ({ 
  title, 
  actualValue, 
  budgetValue, 
  unit = "zar_million", 
  isPercentage = false,
  onEyeClick,
  onAddNotes,
  onAnalysis,
  onTrend,
  notes,
  analysis,
  formatValue,
  decimals = 2
}) => {
  const [expanded, setExpanded] = useState(false)
  
  const formattedActual = isPercentage 
    ? formatPercentage(actualValue, decimals)
    : formatValue(actualValue, unit, decimals)
    
  const formattedBudget = isPercentage
    ? formatPercentage(budgetValue, decimals)
    : formatValue(budgetValue, unit, decimals)

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
      <EyeIcon onClick={onEyeClick} />
      
      <div style={{ textAlign: "center", marginBottom: "15px" }}>
        <h4 style={{ color: "#5d4037", margin: 0, fontSize: "16px" }}>{title}</h4>
      </div>

      <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", marginBottom: "15px" }}>
        {/* Actual Circle */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "90px",
              height: "90px",
              borderRadius: "50%",
              border: "4px solid #5d4037",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 8px",
              backgroundColor: "#fdfcfb",
            }}
          >
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#5d4037" }}>
              {formattedActual}
            </div>
            <div style={{ fontSize: "10px", color: "#8d6e63" }}>Actual</div>
          </div>
        </div>

        {/* Budget Circle */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "90px",
              height: "90px",
              borderRadius: "50%",
              border: "4px solid #f9a825",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 8px",
              backgroundColor: "#fff9c4",
              position: "relative",
            }}
          >
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#5d4037" }}>
              {formattedBudget}
            </div>
            <div style={{ fontSize: "10px", color: "#8d6e63" }}>Budget</div>
            
            {/* Budget Arrow */}
            <div style={{ position: "absolute", bottom: "-20px", left: "50%", transform: "translateX(-50%)" }}>
              <BudgetArrow actual={actualValue} budget={budgetValue} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #e8ddd4", paddingTop: "15px" }}>
        <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              padding: "6px 12px",
              backgroundColor: "#e8ddd4",
              color: "#5d4037",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "11px",
            }}
          >
            Notes
          </button>
          <button
            onClick={onAnalysis}
            style={{
              padding: "6px 12px",
              backgroundColor: "#e8ddd4",
              color: "#5d4037",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "11px",
            }}
          >
            Analysis
          </button>
          <button
            onClick={onTrend}
            style={{
              padding: "6px 12px",
              backgroundColor: "#e8ddd4",
              color: "#5d4037",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "11px",
            }}
          >
            Trend
          </button>
        </div>

        {expanded && (
          <div style={{ marginTop: "10px" }}>
            <textarea
              value={notes || ""}
              onChange={(e) => onAddNotes(e.target.value)}
              placeholder="Add notes or comments..."
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #e8ddd4",
                minHeight: "60px",
                fontSize: "12px",
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== TREND MODAL COMPONENT ====================

const TrendModal = ({ isOpen, onClose, item, currencyUnit, labels, data, formatValue, financialYearStart }) => {
  if (!isOpen || !item) return null

  const chartData = {
    labels: labels.map(label => {
      if (label.includes("(")) return label
      if (label.length === 3) return `${label}(${financialYearStart})`
      return label
    }),
    datasets: [
      {
        label: `${item.name} - Actual`,
        data: item.actual || [],
        borderColor: "#5d4037",
        backgroundColor: "rgba(93, 64, 55, 0.1)",
        borderWidth: 3,
        fill: true,
        tension: 0.3,
      },
    ]
  }
  
  if (item.budget && item.budget.some(v => parseFloat(v) !== 0)) {
    chartData.datasets.push({
      label: `${item.name} - Budget`,
      data: item.budget,
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
                        : `${context.dataset.label}: ${formatValue(value, currencyUnit)}`
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
                  ? `${parseFloat(currentValue).toFixed(2)}%`
                  : formatValue(currentValue, currencyUnit)
                }
              </div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#8d6e63", marginBottom: "5px" }}>Average</div>
              <div style={{ fontSize: "16px", fontWeight: "600", color: "#5d4037" }}>
                {item.isPercentage
                  ? `${parseFloat(averageValue).toFixed(2)}%`
                  : formatValue(averageValue, currencyUnit)
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

        {/* Budget vs Actual Summary */}
        {item.budget && item.budget.some(v => parseFloat(v) !== 0) && (
          <div style={{ 
            backgroundColor: "#e8ddd4", 
            padding: "20px", 
            borderRadius: "6px",
            marginBottom: "20px" 
          }}>
            <h4 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "16px" }}>Budget vs Actual Analysis</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px" }}>
              <div>
                <div style={{ fontSize: "12px", color: "#8d6e63", marginBottom: "5px" }}>Actual (Current)</div>
                <div style={{ fontSize: "16px", fontWeight: "600", color: "#5d4037" }}>
                  {item.isPercentage 
                    ? `${parseFloat(currentValue).toFixed(2)}%`
                    : formatValue(currentValue, currencyUnit)
                  }
                </div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#8d6e63", marginBottom: "5px" }}>Budget (Current)</div>
                <div style={{ fontSize: "16px", fontWeight: "600", color: "#5d4037" }}>
                  {item.budget && item.budget.length > 0
                    ? item.isPercentage 
                      ? `${parseFloat(item.budget[item.budget.length - 1] || 0).toFixed(2)}%`
                      : formatValue(item.budget[item.budget.length - 1] || 0, currencyUnit)
                    : "N/A"
                  }
                </div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#8d6e63", marginBottom: "5px" }}>Variance</div>
                <div style={{ 
                  fontSize: "16px", 
                  fontWeight: "600", 
                  color: (currentValue - (item.budget?.[item.budget.length - 1] || 0)) >= 0 ? "#2e7d32" : "#c62828"
                }}>
                  {item.budget && item.budget.length > 0
                    ? item.isPercentage
                      ? `${(parseFloat(currentValue) - parseFloat(item.budget[item.budget.length - 1] || 0)).toFixed(2)}%`
                      : formatValue(parseFloat(currentValue) - parseFloat(item.budget[item.budget.length - 1] || 0), currencyUnit)
                    : "N/A"
                  }
                </div>
              </div>
            </div>
          </div>
        )}

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

// ==================== UNIVERSAL ADD DATA MODAL ====================

const UniversalAddDataModal = ({ 
  isOpen, 
  onClose, 
  currentTab,
  user,
  onSave,
  loading,
  initialData = {},
  financialYearStart = "Jan"
}) => {
  const [activeModalTab, setActiveModalTab] = useState(currentTab)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(financialYearStart)
  
  // ========== CAPITAL STRUCTURE / BALANCE SHEET DATA ==========
  const [balanceSheetData, setBalanceSheetData] = useState({
    assets: {
      bank: {
        callAccounts: Array(12).fill(""),
        currentAccount: Array(12).fill(""),
        pettyCash: Array(12).fill(""),
        moneyMarket: Array(12).fill(""),
      },
      currentAssets: {
        accountsReceivable: Array(12).fill(""),
        tradeReceivables: Array(12).fill(""),
        otherReceivables: Array(12).fill(""),
        inventory: Array(12).fill(""),
        prepaidExpenses: Array(12).fill(""),
        deposits: Array(12).fill(""),
        cash: Array(12).fill(""),
        callAccounts: Array(12).fill(""),
        shortTermInvestments: Array(12).fill(""),
      },
      fixedAssets: {
        land: Array(12).fill(""),
        buildings: Array(12).fill(""),
        lessDepreciationBuildings: Array(12).fill(""),
        computerEquipment: Array(12).fill(""),
        lessDepreciationComputer: Array(12).fill(""),
        vehicles: Array(12).fill(""),
        lessDepreciationVehicles: Array(12).fill(""),
        furniture: Array(12).fill(""),
        lessDepreciationFurniture: Array(12).fill(""),
        machinery: Array(12).fill(""),
        lessDepreciationMachinery: Array(12).fill(""),
        otherPropertyPlantEquipment: Array(12).fill(""),
        lessDepreciationOther: Array(12).fill(""),
        assetsUnderConstruction: Array(12).fill(""),
        totalFixedAssets: Array(12).fill(""),
      },
      intangibleAssets: {
        goodwill: Array(12).fill(""),
        trademarks: Array(12).fill(""),
        patents: Array(12).fill(""),
        software: Array(12).fill(""),
        customerLists: Array(12).fill(""),
        lessAmortization: Array(12).fill(""),
      },
      nonCurrentAssets: {
        loans: Array(12).fill(""),
        loanAccount: Array(12).fill(""),
        investments: Array(12).fill(""),
        deferredTaxAssets: Array(12).fill(""),
      },
      additionalMetrics: {
        trainingSpend: Array(12).fill(""),
        hdiSpent: Array(12).fill(""),
        labourCost: Array(12).fill(""),
        revenuePerEmployee: Array(12).fill(""),
        numberOfEmployees: Array(12).fill(""),
        marketingSpend: Array(12).fill(""),
        rAndDSpend: Array(12).fill(""),
      },
      customCategories: []
    },
    liabilities: {
      currentLiabilities: {
        accountsPayable: Array(12).fill(""),
        tradePayables: Array(12).fill(""),
        accruedExpenses: Array(12).fill(""),
        shortTermDebt: Array(12).fill(""),
        currentPortionLongTermDebt: Array(12).fill(""),
        incomeReceivedInAdvance: Array(12).fill(""),
        provisionIntercompany: Array(12).fill(""),
        provisionForLeavePay: Array(12).fill(""),
        provisionForBonuses: Array(12).fill(""),
        salaryControlMedicalFund: Array(12).fill(""),
        salaryControlPAYE: Array(12).fill(""),
        salaryControlPensionFund: Array(12).fill(""),
        salaryControlSalaries: Array(12).fill(""),
        vatLiability: Array(12).fill(""),
        otherTaxesPayable: Array(12).fill(""),
      },
      nonCurrentLiabilities: {
        longTermDebt: Array(12).fill(""),
        thirdPartyLoans: Array(12).fill(""),
        intercompanyLoans: Array(12).fill(""),
        directorsLoans: Array(12).fill(""),
        deferredTaxLiabilities: Array(12).fill(""),
        leaseLiabilities: Array(12).fill(""),
        provisions: Array(12).fill(""),
        totalNonCurrentLiabilities: Array(12).fill(""),
      },
    },
    equity: {
      shareCapital: Array(12).fill(""),
      capital: Array(12).fill(""),
      additionalPaidInCapital: Array(12).fill(""),
      retainedEarnings: Array(12).fill(""),
      currentYearEarnings: Array(12).fill(""),
      reserves: Array(12).fill(""),
      treasuryShares: Array(12).fill(""),
      ownerAContribution: Array(12).fill(""),
      ownerAShare: Array(12).fill(""),
      ownerBContribution: Array(12).fill(""),
      ownerBShare: Array(12).fill(""),
      otherEquity: Array(12).fill(""),
    },
    customLiabilitiesCategories: [],
    customEquityCategories: []
  })
  
  // ========== PERFORMANCE ENGINE / P&L DATA ==========
  const [pnlData, setPnlData] = useState({
    sales: Array(12).fill(""),
    salesBudget: Array(12).fill(""),
    cogs: Array(12).fill(""),
    cogsBudget: Array(12).fill(""),
    grossProfit: Array(12).fill(""),
    grossProfitBudget: Array(12).fill(""),
    opex: Array(12).fill(""),
    opexBudget: Array(12).fill(""),
    salaries: Array(12).fill(""),
    salariesBudget: Array(12).fill(""),
    rent: Array(12).fill(""),
    rentBudget: Array(12).fill(""),
    utilities: Array(12).fill(""),
    utilitiesBudget: Array(12).fill(""),
    marketing: Array(12).fill(""),
    marketingBudget: Array(12).fill(""),
    admin: Array(12).fill(""),
    adminBudget: Array(12).fill(""),
    otherExpenses: Array(12).fill(""),
    otherExpensesBudget: Array(12).fill(""),
    ebitda: Array(12).fill(""),
    ebitdaBudget: Array(12).fill(""),
    depreciation: Array(12).fill(""),
    depreciationBudget: Array(12).fill(""),
    amortization: Array(12).fill(""),
    amortizationBudget: Array(12).fill(""),
    ebit: Array(12).fill(""),
    ebitBudget: Array(12).fill(""),
    interestExpense: Array(12).fill(""),
    interestExpenseBudget: Array(12).fill(""),
    interestIncome: Array(12).fill(""),
    interestIncomeBudget: Array(12).fill(""),
    tax: Array(12).fill(""),
    taxBudget: Array(12).fill(""),
    netProfit: Array(12).fill(""),
    netProfitBudget: Array(12).fill(""),
    notes: "",
  })

  // ========== COST AGILITY DATA ==========
  const [costAgilityData, setCostAgilityData] = useState({
    fixedCosts: Array(12).fill(""),
    variableCosts: Array(12).fill(""),
    discretionaryCosts: Array(12).fill(""),
    semiVariableCosts: Array(12).fill(""),
    lockInDuration: Array(12).fill(""),
    notes: "",
  })

  // ========== LIQUIDITY & SURVIVAL DATA ==========
  const [liquidityData, setLiquidityData] = useState({
    currentRatio: Array(12).fill(""),
    quickRatio: Array(12).fill(""),
    cashRatio: Array(12).fill(""),
    burnRate: Array(12).fill(""),
    cashCover: Array(12).fill(""),
    cashflow: Array(12).fill(""),
    operatingCashflow: Array(12).fill(""),
    investingCashflow: Array(12).fill(""),
    financingCashflow: Array(12).fill(""),
    loanRepayments: Array(12).fill(""),
    cashBalance: Array(12).fill(""),
    workingCapital: Array(12).fill(""),
    notes: "",
  })

  // ========== DIVIDEND DATA ==========
  const [dividendData, setDividendData] = useState({
    date: "",
    amount: "",
    type: "Interim",
    declaredBy: ""
  })

  // ========== LOAN DATA ==========
  const [loanData, setLoanData] = useState({
    name: "",
    amount: "",
    interestRate: "",
    startDate: "",
    term: "",
    monthlyPayment: "",
    status: "active"
  })

  // ========== CUSTOM KPI DATA ==========
  const [customKPI, setCustomKPI] = useState({
    name: "",
    type: "bar",
    dataType: "currency",
    actual: Array(12).fill(""),
    budget: Array(12).fill("")
  })

  const months = getMonthsForYear(selectedYear, financialYearStart)
  const years = getYearsRange(2021, 2030)

  // Tab definitions
  const modalTabs = [
    { id: "capital-structure", label: "Capital Structure (Balance Sheet)" },
    { id: "performance-engine", label: "Performance Engine (P&L)" },
    { id: "cost-agility", label: "Cost Agility" },
    { id: "liquidity-survival", label: "Liquidity & Survival" },
    { id: "dividends", label: "Dividend History" },
    { id: "loans", label: "Loan Management" },
    { id: "custom-kpi", label: "Custom KPI" },
  ]

  // Load existing data when modal opens
  useEffect(() => {
    if (isOpen && user) {
      loadDataForTab(activeModalTab)
    }
  }, [isOpen, activeModalTab, user])

  const loadDataForTab = async (tabId) => {
    try {
      switch(tabId) {
        case "capital-structure":
          const capitalDoc = await getDoc(doc(db, "financialData", `${user.uid}_capitalStructure`))
          if (capitalDoc.exists()) {
            const data = capitalDoc.data()
            if (data.balanceSheetData) setBalanceSheetData(data.balanceSheetData)
          }
          break
        case "performance-engine":
          const pnlDoc = await getDoc(doc(db, "financialData", `${user.uid}_pnlManual`))
          if (pnlDoc.exists()) {
            const data = pnlDoc.data()
            setPnlData(prev => ({
              ...prev,
              sales: data.sales?.map(v => v.toFixed(2)) || Array(12).fill(""),
              salesBudget: data.salesBudget?.map(v => v.toFixed(2)) || Array(12).fill(""),
              cogs: data.cogs?.map(v => v.toFixed(2)) || Array(12).fill(""),
              cogsBudget: data.cogsBudget?.map(v => v.toFixed(2)) || Array(12).fill(""),
              opex: data.opex?.map(v => v.toFixed(2)) || Array(12).fill(""),
              opexBudget: data.opexBudget?.map(v => v.toFixed(2)) || Array(12).fill(""),
              salaries: data.salaries?.map(v => v.toFixed(2)) || Array(12).fill(""),
              salariesBudget: data.salariesBudget?.map(v => v.toFixed(2)) || Array(12).fill(""),
              rent: data.rent?.map(v => v.toFixed(2)) || Array(12).fill(""),
              rentBudget: data.rentBudget?.map(v => v.toFixed(2)) || Array(12).fill(""),
              utilities: data.utilities?.map(v => v.toFixed(2)) || Array(12).fill(""),
              utilitiesBudget: data.utilitiesBudget?.map(v => v.toFixed(2)) || Array(12).fill(""),
              marketing: data.marketing?.map(v => v.toFixed(2)) || Array(12).fill(""),
              marketingBudget: data.marketingBudget?.map(v => v.toFixed(2)) || Array(12).fill(""),
              admin: data.admin?.map(v => v.toFixed(2)) || Array(12).fill(""),
              adminBudget: data.adminBudget?.map(v => v.toFixed(2)) || Array(12).fill(""),
              otherExpenses: data.otherExpenses?.map(v => v.toFixed(2)) || Array(12).fill(""),
              otherExpensesBudget: data.otherExpensesBudget?.map(v => v.toFixed(2)) || Array(12).fill(""),
              depreciation: data.depreciation?.map(v => v.toFixed(2)) || Array(12).fill(""),
              depreciationBudget: data.depreciationBudget?.map(v => v.toFixed(2)) || Array(12).fill(""),
              amortization: data.amortization?.map(v => v.toFixed(2)) || Array(12).fill(""),
              amortizationBudget: data.amortizationBudget?.map(v => v.toFixed(2)) || Array(12).fill(""),
              interestExpense: data.interestExpense?.map(v => v.toFixed(2)) || Array(12).fill(""),
              interestExpenseBudget: data.interestExpenseBudget?.map(v => v.toFixed(2)) || Array(12).fill(""),
              interestIncome: data.interestIncome?.map(v => v.toFixed(2)) || Array(12).fill(""),
              interestIncomeBudget: data.interestIncomeBudget?.map(v => v.toFixed(2)) || Array(12).fill(""),
              tax: data.tax?.map(v => v.toFixed(2)) || Array(12).fill(""),
              taxBudget: data.taxBudget?.map(v => v.toFixed(2)) || Array(12).fill(""),
              notes: data.notes || "",
            }))
          }
          break
        case "cost-agility":
          const costDoc = await getDoc(doc(db, "financialData", `${user.uid}_costAgility`))
          if (costDoc.exists()) {
            const data = costDoc.data()
            setCostAgilityData({
              fixedCosts: data.fixedCosts?.map(v => v.toFixed(2)) || Array(12).fill(""),
              variableCosts: data.variableCosts?.map(v => v.toFixed(2)) || Array(12).fill(""),
              discretionaryCosts: data.discretionaryCosts?.map(v => v.toFixed(2)) || Array(12).fill(""),
              semiVariableCosts: data.semiVariableCosts?.map(v => v.toFixed(2)) || Array(12).fill(""),
              lockInDuration: data.lockInDuration?.map(v => v.toFixed(0)) || Array(12).fill(""),
              notes: data.notes || "",
            })
          }
          break
        case "liquidity-survival":
          const liquidityDoc = await getDoc(doc(db, "financialData", `${user.uid}_liquiditySurvival`))
          if (liquidityDoc.exists()) {
            const data = liquidityDoc.data()
            setLiquidityData({
              currentRatio: data.currentRatio?.map(v => v.toFixed(2)) || Array(12).fill(""),
              quickRatio: data.quickRatio?.map(v => v.toFixed(2)) || Array(12).fill(""),
              cashRatio: data.cashRatio?.map(v => v.toFixed(2)) || Array(12).fill(""),
              burnRate: data.burnRate?.map(v => v.toFixed(2)) || Array(12).fill(""),
              cashCover: data.cashCover?.map(v => v.toFixed(1)) || Array(12).fill(""),
              cashflow: data.cashflow?.map(v => v.toFixed(2)) || Array(12).fill(""),
              operatingCashflow: data.operatingCashflow?.map(v => v.toFixed(2)) || Array(12).fill(""),
              investingCashflow: data.investingCashflow?.map(v => v.toFixed(2)) || Array(12).fill(""),
              financingCashflow: data.financingCashflow?.map(v => v.toFixed(2)) || Array(12).fill(""),
              loanRepayments: data.loanRepayments?.map(v => v.toFixed(2)) || Array(12).fill(""),
              cashBalance: data.cashBalance?.map(v => v.toFixed(2)) || Array(12).fill(""),
              workingCapital: data.workingCapital?.map(v => v.toFixed(2)) || Array(12).fill(""),
              notes: data.notes || "",
            })
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
        case "capital-structure":
          await setDoc(doc(db, "financialData", `${user.uid}_capitalStructure`), {
            userId: user.uid,
            balanceSheetData,
            lastUpdated: new Date().toISOString(),
          })
          break
        case "performance-engine":
          await setDoc(doc(db, "financialData", `${user.uid}_pnlManual`), {
            userId: user.uid,
            sales: pnlData.sales.map(v => Number.parseFloat(v) || 0),
            salesBudget: pnlData.salesBudget.map(v => Number.parseFloat(v) || 0),
            cogs: pnlData.cogs.map(v => Number.parseFloat(v) || 0),
            cogsBudget: pnlData.cogsBudget.map(v => Number.parseFloat(v) || 0),
            opex: pnlData.opex.map(v => Number.parseFloat(v) || 0),
            opexBudget: pnlData.opexBudget.map(v => Number.parseFloat(v) || 0),
            salaries: pnlData.salaries.map(v => Number.parseFloat(v) || 0),
            salariesBudget: pnlData.salariesBudget.map(v => Number.parseFloat(v) || 0),
            rent: pnlData.rent.map(v => Number.parseFloat(v) || 0),
            rentBudget: pnlData.rentBudget.map(v => Number.parseFloat(v) || 0),
            utilities: pnlData.utilities.map(v => Number.parseFloat(v) || 0),
            utilitiesBudget: pnlData.utilitiesBudget.map(v => Number.parseFloat(v) || 0),
            marketing: pnlData.marketing.map(v => Number.parseFloat(v) || 0),
            marketingBudget: pnlData.marketingBudget.map(v => Number.parseFloat(v) || 0),
            admin: pnlData.admin.map(v => Number.parseFloat(v) || 0),
            adminBudget: pnlData.adminBudget.map(v => Number.parseFloat(v) || 0),
            otherExpenses: pnlData.otherExpenses.map(v => Number.parseFloat(v) || 0),
            otherExpensesBudget: pnlData.otherExpensesBudget.map(v => Number.parseFloat(v) || 0),
            depreciation: pnlData.depreciation.map(v => Number.parseFloat(v) || 0),
            depreciationBudget: pnlData.depreciationBudget.map(v => Number.parseFloat(v) || 0),
            amortization: pnlData.amortization.map(v => Number.parseFloat(v) || 0),
            amortizationBudget: pnlData.amortizationBudget.map(v => Number.parseFloat(v) || 0),
            interestExpense: pnlData.interestExpense.map(v => Number.parseFloat(v) || 0),
            interestExpenseBudget: pnlData.interestExpenseBudget.map(v => Number.parseFloat(v) || 0),
            interestIncome: pnlData.interestIncome.map(v => Number.parseFloat(v) || 0),
            interestIncomeBudget: pnlData.interestIncomeBudget.map(v => Number.parseFloat(v) || 0),
            tax: pnlData.tax.map(v => Number.parseFloat(v) || 0),
            taxBudget: pnlData.taxBudget.map(v => Number.parseFloat(v) || 0),
            notes: pnlData.notes,
            lastUpdated: new Date().toISOString(),
          })
          break
        case "cost-agility":
          await setDoc(doc(db, "financialData", `${user.uid}_costAgility`), {
            userId: user.uid,
            fixedCosts: costAgilityData.fixedCosts.map(v => Number.parseFloat(v) || 0),
            variableCosts: costAgilityData.variableCosts.map(v => Number.parseFloat(v) || 0),
            discretionaryCosts: costAgilityData.discretionaryCosts.map(v => Number.parseFloat(v) || 0),
            semiVariableCosts: costAgilityData.semiVariableCosts.map(v => Number.parseFloat(v) || 0),
            lockInDuration: costAgilityData.lockInDuration.map(v => Number.parseFloat(v) || 0),
            notes: costAgilityData.notes,
            lastUpdated: new Date().toISOString(),
          })
          break
        case "liquidity-survival":
          await setDoc(doc(db, "financialData", `${user.uid}_liquiditySurvival`), {
            userId: user.uid,
            currentRatio: liquidityData.currentRatio.map(v => Number.parseFloat(v) || 0),
            quickRatio: liquidityData.quickRatio.map(v => Number.parseFloat(v) || 0),
            cashRatio: liquidityData.cashRatio.map(v => Number.parseFloat(v) || 0),
            burnRate: liquidityData.burnRate.map(v => Number.parseFloat(v) || 0),
            cashCover: liquidityData.cashCover.map(v => Number.parseFloat(v) || 0),
            cashflow: liquidityData.cashflow.map(v => Number.parseFloat(v) || 0),
            operatingCashflow: liquidityData.operatingCashflow.map(v => Number.parseFloat(v) || 0),
            investingCashflow: liquidityData.investingCashflow.map(v => Number.parseFloat(v) || 0),
            financingCashflow: liquidityData.financingCashflow.map(v => Number.parseFloat(v) || 0),
            loanRepayments: liquidityData.loanRepayments.map(v => Number.parseFloat(v) || 0),
            cashBalance: liquidityData.cashBalance.map(v => Number.parseFloat(v) || 0),
            workingCapital: liquidityData.workingCapital.map(v => Number.parseFloat(v) || 0),
            notes: liquidityData.notes,
            lastUpdated: new Date().toISOString(),
          })
          break
        case "dividends":
          if (!dividendData.date || !dividendData.amount) {
            alert("Please fill in all required fields")
            return
          }
          await addDoc(collection(db, "financialData", `${user.uid}_dividends`, "dividendHistory"), {
            ...dividendData,
            amount: Number.parseFloat(dividendData.amount),
            userId: user.uid,
            createdAt: new Date().toISOString(),
          })
          break
        case "loans":
          if (!loanData.name || !loanData.amount) {
            alert("Please fill in required fields")
            return
          }
          const loanId = `loan_${Date.now()}`
          await setDoc(doc(db, "financialData", `${user.uid}_${loanId}`), {
            userId: user.uid,
            id: loanId,
            type: "loan",
            section: "liquidity-survival",
            ...loanData,
            amount: Number.parseFloat(loanData.amount) || 0,
            interestRate: Number.parseFloat(loanData.interestRate) || 0,
            term: Number.parseInt(loanData.term) || 0,
            monthlyPayment: Number.parseFloat(loanData.monthlyPayment) || 0,
            createdDate: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
          })
          break
        case "custom-kpi":
          if (!customKPI.name.trim()) {
            alert("Please enter a KPI name")
            return
          }
          const chartName = customKPI.name.toLowerCase().replace(/\s+/g, "_")
          await setDoc(doc(db, "financialData", `${user.uid}_${chartName}`), {
            userId: user.uid,
            chartName: chartName,
            name: customKPI.name,
            type: customKPI.type,
            dataType: customKPI.dataType,
            actual: customKPI.actual.map(v => Number.parseFloat(v) || 0),
            budget: customKPI.budget.map(v => Number.parseFloat(v) || 0),
            isCustomKPI: true,
            section: "performance-engine",
            lastUpdated: new Date().toISOString(),
          })
          break
      }
      
      if (onSave) onSave()
      alert("Data saved successfully!")
    } catch (error) {
      console.error("Error saving data:", error)
      alert("Error saving data. Please try again.")
    }
  }

  const renderMonthlyInputs = (category, label, data, setData, options = {}) => {
    const { isSelect = false, selectOptions = [], step = "0.01", unit = "" } = options
    
    return (
      <div style={{ marginBottom: "20px" }}>
        <h5 style={{ color: "#5d4037", marginBottom: "15px", fontWeight: "600" }}>
          {label} {unit && <span style={{ fontSize: "12px", color: "#8d6e63", marginLeft: "8px" }}>({unit})</span>}
        </h5>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gap: "5px",
          }}
        >
          {months.map((month, idx) => (
            <div key={month}>
              <label style={{ fontSize: "10px", color: "#8d6e63", display: "block", marginBottom: "2px" }}>
                {month}
              </label>
              {isSelect ? (
                <select
                  value={data[category]?.[idx] || ""}
                  onChange={(e) => {
                    const newData = { ...data }
                    if (!newData[category]) newData[category] = Array(12).fill("")
                    newData[category][idx] = e.target.value
                    setData(newData)
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
                  {selectOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  step={step}
                  value={data[category]?.[idx] || ""}
                  onChange={(e) => {
                    const newData = { ...data }
                    if (!newData[category]) newData[category] = Array(12).fill("")
                    newData[category][idx] = e.target.value
                    setData(newData)
                  }}
                  placeholder="0"
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
    )
  }

  const renderBalanceSheetSection = (section, title, data, setData) => {
    if (!data || typeof data !== 'object') {
      return (
        <div style={{ marginBottom: "30px", padding: "15px", backgroundColor: "#f5f0eb", borderRadius: "8px" }}>
          <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>{title}</h4>
          <p style={{ color: "#8d6e63", textAlign: "center" }}>No data available</p>
        </div>
      );
    }

    return (
      <div style={{ marginBottom: "30px", padding: "15px", backgroundColor: "#f5f0eb", borderRadius: "8px" }}>
        <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>{title}</h4>
        {data && Object.keys(data).length > 0 ? (
          Object.keys(data).map((key) => (
            <div key={key} style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  color: "#5d4037",
                  fontWeight: "600",
                  marginBottom: "8px",
                  fontSize: "13px",
                }}
              >
                {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
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
                      value={data[key]?.[idx] || ""}
                      onChange={(e) => {
                        const newData = { ...data }
                        if (!newData[key]) {
                          newData[key] = Array(12).fill("")
                        }
                        newData[key][idx] = e.target.value
                        setData(newData)
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
          ))
        ) : (
          <p style={{ color: "#8d6e63", textAlign: "center", padding: "20px" }}>
            No items in this section. Add custom items below.
          </p>
        )}
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
          <h3 style={{ color: "#5d4037", margin: 0 }}>Add Financial Data</h3>
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

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
          {modalTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveModalTab(tab.id)}
              style={{
                padding: "10px 20px",
                backgroundColor: activeModalTab === tab.id ? "#5d4037" : "#e8ddd4",
                color: activeModalTab === tab.id ? "#fdfcfb" : "#5d4037",
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

        {/* Year/Month Selection for relevant tabs */}
        {["capital-structure", "performance-engine", "cost-agility", "liquidity-survival", "custom-kpi"].includes(activeModalTab) && (
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
            
            <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
              <span style={{ color: "#5d4037", fontSize: "14px" }}>Select Month:</span>
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
        )}

        {/* ========== CAPITAL STRUCTURE / BALANCE SHEET ========== */}
        {activeModalTab === "capital-structure" && (
          <div>
            {balanceSheetData?.assets?.bank && renderBalanceSheetSection(
              balanceSheetData.assets.bank, 
              "Bank Accounts", 
              balanceSheetData.assets.bank, 
              (newData) => {
                setBalanceSheetData(prev => ({
                  ...prev,
                  assets: { ...prev.assets, bank: newData }
                }))
              }
            )}
            
            {balanceSheetData?.assets?.currentAssets && renderBalanceSheetSection(
              balanceSheetData.assets.currentAssets, 
              "Current Assets", 
              balanceSheetData.assets.currentAssets, 
              (newData) => {
                setBalanceSheetData(prev => ({
                  ...prev,
                  assets: { ...prev.assets, currentAssets: newData }
                }))
              }
            )}
            
            {balanceSheetData?.assets?.fixedAssets && renderBalanceSheetSection(
              balanceSheetData.assets.fixedAssets, 
              "Fixed Assets", 
              balanceSheetData.assets.fixedAssets, 
              (newData) => {
                setBalanceSheetData(prev => ({
                  ...prev,
                  assets: { ...prev.assets, fixedAssets: newData }
                }))
              }
            )}
            
            {balanceSheetData?.assets?.intangibleAssets && renderBalanceSheetSection(
              balanceSheetData.assets.intangibleAssets, 
              "Intangible Assets", 
              balanceSheetData.assets.intangibleAssets, 
              (newData) => {
                setBalanceSheetData(prev => ({
                  ...prev,
                  assets: { ...prev.assets, intangibleAssets: newData }
                }))
              }
            )}
            
            {balanceSheetData?.assets?.nonCurrentAssets && renderBalanceSheetSection(
              balanceSheetData.assets.nonCurrentAssets, 
              "Non-Current Assets", 
              balanceSheetData.assets.nonCurrentAssets, 
              (newData) => {
                setBalanceSheetData(prev => ({
                  ...prev,
                  assets: { ...prev.assets, nonCurrentAssets: newData }
                }))
              }
            )}
            
            {balanceSheetData?.assets?.additionalMetrics && renderBalanceSheetSection(
              balanceSheetData.assets.additionalMetrics, 
              "Additional Metrics", 
              balanceSheetData.assets.additionalMetrics, 
              (newData) => {
                setBalanceSheetData(prev => ({
                  ...prev,
                  assets: { ...prev.assets, additionalMetrics: newData }
                }))
              }
            )}
            
            {balanceSheetData?.liabilities?.currentLiabilities && renderBalanceSheetSection(
              balanceSheetData.liabilities.currentLiabilities, 
              "Current Liabilities", 
              balanceSheetData.liabilities.currentLiabilities, 
              (newData) => {
                setBalanceSheetData(prev => ({
                  ...prev,
                  liabilities: { ...prev.liabilities, currentLiabilities: newData }
                }))
              }
            )}
            
            {balanceSheetData?.liabilities?.nonCurrentLiabilities && renderBalanceSheetSection(
              balanceSheetData.liabilities.nonCurrentLiabilities, 
              "Non-Current Liabilities", 
              balanceSheetData.liabilities.nonCurrentLiabilities, 
              (newData) => {
                setBalanceSheetData(prev => ({
                  ...prev,
                  liabilities: { ...prev.liabilities, nonCurrentLiabilities: newData }
                }))
              }
            )}
            
            {balanceSheetData?.equity && renderBalanceSheetSection(
              balanceSheetData.equity, 
              "Equity", 
              balanceSheetData.equity, 
              (newData) => {
                setBalanceSheetData(prev => ({
                  ...prev,
                  equity: newData
                }))
              }
            )}

            {/* Add Custom Category */}
            <div style={{ marginTop: "20px", padding: "20px", backgroundColor: "#fdfcfb", borderRadius: "8px", border: "2px dashed #e8ddd4" }}>
              <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>Add Custom Category</h4>
              <p style={{ color: "#8d6e63", fontSize: "13px", marginBottom: "15px" }}>
                Create your own balance sheet categories and items.
              </p>
              <button
                onClick={() => {
                  const categoryName = prompt("Enter custom category name (e.g., Cryptocurrency, Biological Assets):")
                  if (categoryName) {
                    const itemName = prompt(`Enter item name for ${categoryName}:`)
                    if (itemName) {
                      setBalanceSheetData(prev => {
                        const newCategory = {
                          [itemName]: Array(12).fill("")
                        }
                        return {
                          ...prev,
                          assets: {
                            ...prev.assets,
                            customCategories: [
                              ...(prev.assets?.customCategories || []),
                              {
                                category: categoryName,
                                items: newCategory
                              }
                            ]
                          }
                        }
                      })
                    }
                  }
                }}
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
                + Add Custom Category
              </button>

              {/* Render Custom Categories */}
              {balanceSheetData?.assets?.customCategories && balanceSheetData.assets.customCategories.map((custom, index) => (
                <div key={index} style={{ marginTop: "20px", padding: "15px", backgroundColor: "#f5f0eb", borderRadius: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                    <h5 style={{ color: "#5d4037", margin: 0 }}>{custom?.category || "Custom Category"}</h5>
                    <button
                      onClick={() => {
                        setBalanceSheetData(prev => ({
                          ...prev,
                          assets: {
                            ...prev.assets,
                            customCategories: prev.assets?.customCategories?.filter((_, i) => i !== index) || []
                          }
                        }))
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
                  </div>
                  {custom?.items && Object.keys(custom.items).map((itemKey) => (
                    <div key={itemKey} style={{ marginBottom: "15px" }}>
                      <label style={{ display: "block", color: "#5d4037", fontWeight: "600", marginBottom: "8px", fontSize: "13px" }}>
                        {itemKey}
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
                              value={custom.items[itemKey]?.[idx] || ""}
                              onChange={(e) => {
                                setBalanceSheetData(prev => {
                                  const newCustomCategories = [...(prev.assets?.customCategories || [])]
                                  if (!newCustomCategories[index]?.items[itemKey]) {
                                    newCustomCategories[index].items[itemKey] = Array(12).fill("")
                                  }
                                  newCustomCategories[index].items[itemKey][idx] = e.target.value
                                  return {
                                    ...prev,
                                    assets: {
                                      ...prev.assets,
                                      customCategories: newCustomCategories
                                    }
                                  }
                                })
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
                  ))}
                  <button
                    onClick={() => {
                      const itemName = prompt(`Enter new item name for ${custom?.category || "Custom Category"}:`)
                      if (itemName) {
                        setBalanceSheetData(prev => {
                          const newCustomCategories = [...(prev.assets?.customCategories || [])]
                          if (!newCustomCategories[index].items) {
                            newCustomCategories[index].items = {}
                          }
                          newCustomCategories[index].items[itemName] = Array(12).fill("")
                          return {
                            ...prev,
                            assets: {
                              ...prev.assets,
                              customCategories: newCustomCategories
                            }
                          }
                        })
                      }
                    }}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#e8ddd4",
                      color: "#5d4037",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "12px",
                    }}
                  >
                    + Add Item to {custom?.category || "Custom Category"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== PERFORMANCE ENGINE / P&L ========== */}
        {activeModalTab === "performance-engine" && (
          <div>
            <h4 style={{ color: "#5d4037", marginBottom: "20px" }}>Profit & Loss Statement</h4>
            
            <div style={{ marginBottom: "30px" }}>
              <h5 style={{ color: "#5d4037", marginBottom: "15px", fontWeight: "600" }}>Revenue</h5>
              {renderMonthlyInputs("sales", "Sales / Revenue", pnlData, setPnlData, { unit: "R m" })}
              {renderMonthlyInputs("salesBudget", "Sales Budget", pnlData, setPnlData, { unit: "R m" })}
            </div>

            <div style={{ marginBottom: "30px" }}>
              <h5 style={{ color: "#5d4037", marginBottom: "15px", fontWeight: "600" }}>Cost of Goods Sold</h5>
              {renderMonthlyInputs("cogs", "COGS", pnlData, setPnlData, { unit: "R m" })}
              {renderMonthlyInputs("cogsBudget", "COGS Budget", pnlData, setPnlData, { unit: "R m" })}
            </div>

            <div style={{ marginBottom: "30px" }}>
              <h5 style={{ color: "#5d4037", marginBottom: "15px", fontWeight: "600" }}>Operating Expenses</h5>
              {renderMonthlyInputs("opex", "Total Opex", pnlData, setPnlData, { unit: "R m" })}
              {renderMonthlyInputs("opexBudget", "Opex Budget", pnlData, setPnlData, { unit: "R m" })}
              {renderMonthlyInputs("salaries", "Salaries & Wages", pnlData, setPnlData, { unit: "R m" })}
              {renderMonthlyInputs("salariesBudget", "Salaries Budget", pnlData, setPnlData, { unit: "R m" })}
              {renderMonthlyInputs("rent", "Rent", pnlData, setPnlData, { unit: "R m" })}
              {renderMonthlyInputs("rentBudget", "Rent Budget", pnlData, setPnlData, { unit: "R m" })}
              {renderMonthlyInputs("utilities", "Utilities", pnlData, setPnlData, { unit: "R m" })}
              {renderMonthlyInputs("utilitiesBudget", "Utilities Budget", pnlData, setPnlData, { unit: "R m" })}
              {renderMonthlyInputs("marketing", "Marketing", pnlData, setPnlData, { unit: "R m" })}
              {renderMonthlyInputs("marketingBudget", "Marketing Budget", pnlData, setPnlData, { unit: "R m" })}
              {renderMonthlyInputs("admin", "Administrative", pnlData, setPnlData, { unit: "R m" })}
              {renderMonthlyInputs("adminBudget", "Administrative Budget", pnlData, setPnlData, { unit: "R m" })}
              {renderMonthlyInputs("otherExpenses", "Other Expenses", pnlData, setPnlData, { unit: "R m" })}
              {renderMonthlyInputs("otherExpensesBudget", "Other Expenses Budget", pnlData, setPnlData, { unit: "R m" })}
            </div>

            <div style={{ marginBottom: "30px" }}>
              <h5 style={{ color: "#5d4037", marginBottom: "15px", fontWeight: "600" }}>Depreciation & Amortization</h5>
              {renderMonthlyInputs("depreciation", "Depreciation", pnlData, setPnlData, { unit: "R m" })}
              {renderMonthlyInputs("depreciationBudget", "Depreciation Budget", pnlData, setPnlData, { unit: "R m" })}
              {renderMonthlyInputs("amortization", "Amortization", pnlData, setPnlData, { unit: "R m" })}
              {renderMonthlyInputs("amortizationBudget", "Amortization Budget", pnlData, setPnlData, { unit: "R m" })}
            </div>

            <div style={{ marginBottom: "30px" }}>
              <h5 style={{ color: "#5d4037", marginBottom: "15px", fontWeight: "600" }}>Interest & Tax</h5>
              {renderMonthlyInputs("interestExpense", "Interest Expense", pnlData, setPnlData, { unit: "R m" })}
              {renderMonthlyInputs("interestExpenseBudget", "Interest Expense Budget", pnlData, setPnlData, { unit: "R m" })}
              {renderMonthlyInputs("interestIncome", "Interest Income", pnlData, setPnlData, { unit: "R m" })}
              {renderMonthlyInputs("interestIncomeBudget", "Interest Income Budget", pnlData, setPnlData, { unit: "R m" })}
              {renderMonthlyInputs("tax", "Tax", pnlData, setPnlData, { unit: "R m" })}
              {renderMonthlyInputs("taxBudget", "Tax Budget", pnlData, setPnlData, { unit: "R m" })}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Notes:
              </label>
              <textarea
                value={pnlData.notes}
                onChange={(e) => setPnlData({ ...pnlData, notes: e.target.value })}
                placeholder="Add any additional notes about your P&L data..."
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  minHeight: "80px",
                  fontSize: "13px",
                }}
              />
            </div>
          </div>
        )}

        {/* ========== COST AGILITY ========== */}
        {activeModalTab === "cost-agility" && (
          <div>
            <h4 style={{ color: "#5d4037", marginBottom: "20px" }}>Cost Structure Analysis</h4>
            
            {renderMonthlyInputs("fixedCosts", "Fixed Costs", costAgilityData, setCostAgilityData, { unit: "R m" })}
            {renderMonthlyInputs("variableCosts", "Variable Costs", costAgilityData, setCostAgilityData, { unit: "R m" })}
            {renderMonthlyInputs("semiVariableCosts", "Semi-Variable Costs", costAgilityData, setCostAgilityData, { unit: "R m" })}
            {renderMonthlyInputs("discretionaryCosts", "Discretionary Costs", costAgilityData, setCostAgilityData, { unit: "R m" })}
            {renderMonthlyInputs("lockInDuration", "Fixed Costs Lock-in Duration", costAgilityData, setCostAgilityData, { unit: "months", step: "1" })}

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Notes:
              </label>
              <textarea
                value={costAgilityData.notes}
                onChange={(e) => setCostAgilityData({ ...costAgilityData, notes: e.target.value })}
                placeholder="Add notes about your cost structure..."
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  minHeight: "80px",
                  fontSize: "13px",
                }}
              />
            </div>
          </div>
        )}

        {/* ========== LIQUIDITY & SURVIVAL ========== */}
        {activeModalTab === "liquidity-survival" && (
          <div>
            <h4 style={{ color: "#5d4037", marginBottom: "20px" }}>Liquidity & Survival Metrics</h4>
            
            {renderMonthlyInputs("currentRatio", "Current Ratio", liquidityData, setLiquidityData, { step: "0.01", unit: "ratio" })}
            {renderMonthlyInputs("quickRatio", "Quick Ratio", liquidityData, setLiquidityData, { step: "0.01", unit: "ratio" })}
            {renderMonthlyInputs("cashRatio", "Cash Ratio", liquidityData, setLiquidityData, { step: "0.01", unit: "ratio" })}
            {renderMonthlyInputs("burnRate", "Burn Rate", liquidityData, setLiquidityData, { unit: "R m" })}
            {renderMonthlyInputs("cashCover", "Cash Cover", liquidityData, setLiquidityData, { unit: "months", step: "1" })}
            {renderMonthlyInputs("cashflow", "Free Cashflow", liquidityData, setLiquidityData, { unit: "R m" })}
            {renderMonthlyInputs("operatingCashflow", "Operating Cashflow", liquidityData, setLiquidityData, { unit: "R m" })}
            {renderMonthlyInputs("investingCashflow", "Investing Cashflow", liquidityData, setLiquidityData, { unit: "R m" })}
            {renderMonthlyInputs("financingCashflow", "Financing Cashflow", liquidityData, setLiquidityData, { unit: "R m" })}
            {renderMonthlyInputs("loanRepayments", "Loan Repayments", liquidityData, setLiquidityData, { unit: "R m" })}
            {renderMonthlyInputs("cashBalance", "Cash Balance", liquidityData, setLiquidityData, { unit: "R m" })}
            {renderMonthlyInputs("workingCapital", "Working Capital", liquidityData, setLiquidityData, { unit: "R m" })}

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Notes:
              </label>
              <textarea
                value={liquidityData.notes}
                onChange={(e) => setLiquidityData({ ...liquidityData, notes: e.target.value })}
                placeholder="Add notes about your liquidity position..."
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  minHeight: "80px",
                  fontSize: "13px",
                }}
              />
            </div>
          </div>
        )}

        {/* ========== DIVIDEND HISTORY ========== */}
        {activeModalTab === "dividends" && (
          <div style={{ padding: "20px" }}>
            <h4 style={{ color: "#5d4037", marginBottom: "20px" }}>Add Dividend Record</h4>
            
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>
                Date *
              </label>
              <input
                type="date"
                value={dividendData.date}
                onChange={(e) => setDividendData({...dividendData, date: e.target.value})}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>
                Amount (ZAR) *
              </label>
              <input
                type="number"
                value={dividendData.amount}
                onChange={(e) => setDividendData({...dividendData, amount: e.target.value})}
                placeholder="0.00"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>
                Type
              </label>
              <select
                value={dividendData.type}
                onChange={(e) => setDividendData({...dividendData, type: e.target.value})}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                }}
              >
                <option value="Interim">Interim</option>
                <option value="Final">Final</option>
                <option value="Special">Special</option>
              </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>
                Declared By
              </label>
              <input
                type="text"
                value={dividendData.declaredBy}
                onChange={(e) => setDividendData({...dividendData, declaredBy: e.target.value})}
                placeholder="e.g., Board Resolution #123"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>
        )}

        {/* ========== LOAN MANAGEMENT ========== */}
        {activeModalTab === "loans" && (
          <div style={{ padding: "20px" }}>
            <h4 style={{ color: "#5d4037", marginBottom: "20px" }}>Add Loan</h4>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "15px", marginBottom: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600", fontSize: "13px" }}>
                  Loan Name *
                </label>
                <input
                  type="text"
                  value={loanData.name}
                  onChange={(e) => setLoanData({ ...loanData, name: e.target.value })}
                  placeholder="e.g., Business Loan"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #e8ddd4",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600", fontSize: "13px" }}>
                  Loan Amount (R m) *
                </label>
                <input
                  type="number"
                  value={loanData.amount}
                  onChange={(e) => setLoanData({ ...loanData, amount: e.target.value })}
                  placeholder="0.00"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #e8ddd4",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600", fontSize: "13px" }}>
                  Interest Rate (%)
                </label>
                <input
                  type="number"
                  value={loanData.interestRate}
                  onChange={(e) => setLoanData({ ...loanData, interestRate: e.target.value })}
                  placeholder="0.0"
                  step="0.1"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #e8ddd4",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600", fontSize: "13px" }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={loanData.startDate}
                  onChange={(e) => setLoanData({ ...loanData, startDate: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #e8ddd4",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600", fontSize: "13px" }}>
                  Term (months)
                </label>
                <input
                  type="number"
                  value={loanData.term}
                  onChange={(e) => setLoanData({ ...loanData, term: e.target.value })}
                  placeholder="12"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #e8ddd4",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600", fontSize: "13px" }}>
                  Monthly Payment (R m)
                </label>
                <input
                  type="number"
                  value={loanData.monthlyPayment}
                  onChange={(e) => setLoanData({ ...loanData, monthlyPayment: e.target.value })}
                  placeholder="0.00"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #e8ddd4",
                    fontSize: "14px",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600", fontSize: "13px" }}>
                Status
              </label>
              <select
                value={loanData.status}
                onChange={(e) => setLoanData({ ...loanData, status: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                }}
              >
                <option value="active">Active</option>
                <option value="paid">Paid Off</option>
              </select>
            </div>
          </div>
        )}

        {/* ========== CUSTOM KPI ========== */}
        {activeModalTab === "custom-kpi" && (
          <div style={{ padding: "20px" }}>
            <h4 style={{ color: "#5d4037", marginBottom: "20px" }}>Create Custom KPI</h4>
            
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600", fontSize: "13px" }}>
                KPI Name *
              </label>
              <input
                type="text"
                value={customKPI.name}
                onChange={(e) => setCustomKPI({ ...customKPI, name: e.target.value })}
                placeholder="e.g., Customer Acquisition Cost"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600", fontSize: "13px" }}>
                  Chart Type
                </label>
                <select
                  value={customKPI.type}
                  onChange={(e) => setCustomKPI({ ...customKPI, type: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #e8ddd4",
                    fontSize: "14px",
                  }}
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600", fontSize: "13px" }}>
                  Data Type
                </label>
                <select
                  value={customKPI.dataType}
                  onChange={(e) => setCustomKPI({ ...customKPI, dataType: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #e8ddd4",
                    fontSize: "14px",
                  }}
                >
                  <option value="currency">Currency (R m)</option>
                  <option value="percentage">Percentage (%)</option>
                  <option value="number">Number</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "30px" }}>
              <h5 style={{ color: "#5d4037", marginBottom: "15px", fontWeight: "600" }}>Actual Values</h5>
              {renderMonthlyInputs("actual", "Actual", customKPI, setCustomKPI, { 
                unit: customKPI.dataType === "percentage" ? "%" : 
                      customKPI.dataType === "currency" ? "R m" : "units" 
              })}
            </div>

            <div style={{ marginBottom: "30px" }}>
              <h5 style={{ color: "#5d4037", marginBottom: "15px", fontWeight: "600" }}>Budget Values</h5>
              {renderMonthlyInputs("budget", "Budget", customKPI, setCustomKPI, { 
                unit: customKPI.dataType === "percentage" ? "%" : 
                      customKPI.dataType === "currency" ? "R m" : "units" 
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
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
            disabled={loading}
            style={{
              padding: "10px 20px",
              backgroundColor: "#5d4037",
              color: "#fdfcfb",
              border: "none",
              borderRadius: "6px",
              cursor: loading ? "wait" : "pointer",
              fontWeight: "600",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Saving..." : "Save Data"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ==================== CAPITAL STRUCTURE COMPONENT ====================

const CapitalStructure = ({ activeSection, viewMode, user, isInvestorView, isEmbedded, financialYearStart }) => {
  const [activeSubTab, setActiveSubTab] = useState("balance-sheet")
  const [showModal, setShowModal] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(financialYearStart)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [showTrendModal, setShowTrendModal] = useState(false)
  const [selectedTrendItem, setSelectedTrendItem] = useState(null)
  const [expandedNotes, setExpandedNotes] = useState({})
  const [kpiNotes, setKpiNotes] = useState({})
  const [kpiAnalysis, setKpiAnalysis] = useState({})
  const [currencyUnit, setCurrencyUnit] = useState("zar_million")
  const [showCalculationModal, setShowCalculationModal] = useState(false)
  const [selectedCalculation, setSelectedCalculation] = useState({ title: "", calculation: "" })
  const [dividendData, setDividendData] = useState({
    date: "",
    amount: "",
    type: "Interim",
    declaredBy: ""
  })

  // Dividend History State
  const [dividendHistory, setDividendHistory] = useState([])
  const [showDividendModal, setShowDividendModal] = useState(false)

  // Balance Sheet Data Structure - Expanded with custom categories
  const [balanceSheetData, setBalanceSheetData] = useState({
    assets: {
      bank: {
        callAccounts: Array(12).fill(""),
        currentAccount: Array(12).fill(""),
        pettyCash: Array(12).fill(""),
        moneyMarket: Array(12).fill(""),
      },
      currentAssets: {
        accountsReceivable: Array(12).fill(""),
        tradeReceivables: Array(12).fill(""),
        otherReceivables: Array(12).fill(""),
        inventory: Array(12).fill(""),
        prepaidExpenses: Array(12).fill(""),
        deposits: Array(12).fill(""),
        cash: Array(12).fill(""),
        callAccounts: Array(12).fill(""),
        shortTermInvestments: Array(12).fill(""),
      },
      fixedAssets: {
        land: Array(12).fill(""),
        buildings: Array(12).fill(""),
        lessDepreciationBuildings: Array(12).fill(""),
        computerEquipment: Array(12).fill(""),
        lessDepreciationComputer: Array(12).fill(""),
        vehicles: Array(12).fill(""),
        lessDepreciationVehicles: Array(12).fill(""),
        furniture: Array(12).fill(""),
        lessDepreciationFurniture: Array(12).fill(""),
        machinery: Array(12).fill(""),
        lessDepreciationMachinery: Array(12).fill(""),
        otherPropertyPlantEquipment: Array(12).fill(""),
        lessDepreciationOther: Array(12).fill(""),
        assetsUnderConstruction: Array(12).fill(""),
        totalFixedAssets: Array(12).fill(""),
      },
      intangibleAssets: {
        goodwill: Array(12).fill(""),
        trademarks: Array(12).fill(""),
        patents: Array(12).fill(""),
        software: Array(12).fill(""),
        customerLists: Array(12).fill(""),
        lessAmortization: Array(12).fill(""),
      },
      nonCurrentAssets: {
        loans: Array(12).fill(""),
        loanAccount: Array(12).fill(""),
        investments: Array(12).fill(""),
        deferredTaxAssets: Array(12).fill(""),
      },
      additionalMetrics: {
        trainingSpend: Array(12).fill(""),
        hdiSpent: Array(12).fill(""),
        labourCost: Array(12).fill(""),
        revenuePerEmployee: Array(12).fill(""),
        numberOfEmployees: Array(12).fill(""),
        marketingSpend: Array(12).fill(""),
        rAndDSpend: Array(12).fill(""),
      },
      customCategories: []
    },
    liabilities: {
      currentLiabilities: {
        accountsPayable: Array(12).fill(""),
        tradePayables: Array(12).fill(""),
        accruedExpenses: Array(12).fill(""),
        shortTermDebt: Array(12).fill(""),
        currentPortionLongTermDebt: Array(12).fill(""),
        incomeReceivedInAdvance: Array(12).fill(""),
        provisionIntercompany: Array(12).fill(""),
        provisionForLeavePay: Array(12).fill(""),
        provisionForBonuses: Array(12).fill(""),
        salaryControlMedicalFund: Array(12).fill(""),
        salaryControlPAYE: Array(12).fill(""),
        salaryControlPensionFund: Array(12).fill(""),
        salaryControlSalaries: Array(12).fill(""),
        vatLiability: Array(12).fill(""),
        otherTaxesPayable: Array(12).fill(""),
      },
      nonCurrentLiabilities: {
        longTermDebt: Array(12).fill(""),
        thirdPartyLoans: Array(12).fill(""),
        intercompanyLoans: Array(12).fill(""),
        directorsLoans: Array(12).fill(""),
        deferredTaxLiabilities: Array(12).fill(""),
        leaseLiabilities: Array(12).fill(""),
        provisions: Array(12).fill(""),
        totalNonCurrentLiabilities: Array(12).fill(""),
      },
    },
    equity: {
      shareCapital: Array(12).fill(""),
      capital: Array(12).fill(""),
      additionalPaidInCapital: Array(12).fill(""),
      retainedEarnings: Array(12).fill(""),
      currentYearEarnings: Array(12).fill(""),
      reserves: Array(12).fill(""),
      treasuryShares: Array(12).fill(""),
      ownerAContribution: Array(12).fill(""),
      ownerAShare: Array(12).fill(""),
      ownerBContribution: Array(12).fill(""),
      ownerBShare: Array(12).fill(""),
      otherEquity: Array(12).fill(""),
    },
    customLiabilitiesCategories: [],
    customEquityCategories: []
  })

  // Solvency KPIs
  const [solvencyData, setSolvencyData] = useState({
    debtToEquity: Array(12).fill("0"),
    debtToAssets: Array(12).fill("0"),
    equityRatio: Array(12).fill("0"),
    interestCoverage: Array(12).fill("0"),
    debtServiceCoverage: Array(12).fill("0"),
    nav: Array(12).fill("0"),
  })

  // Leverage KPIs
  const [leverageData, setLeverageData] = useState({
    totalDebtRatio: Array(12).fill("0"),
    longTermDebtRatio: Array(12).fill("0"),
    equityMultiplier: Array(12).fill("0"),
  })

  // Equity KPIs
  const [equityData, setEquityData] = useState({
    returnOnEquity: Array(12).fill("0"),
    bookValuePerShare: Array(12).fill("0"),
    equityRatio: Array(12).fill("0"),
  })

  const months = getMonthsForYear(selectedYear, financialYearStart)
  const years = getYearsRange(2021, 2030)

  const subTabs = [
    { id: "balance-sheet", label: "Balance Sheet" },
    { id: "solvency", label: "Solvency", calculation: "Solvency metrics assess long-term financial stability:\n\n• Debt to Equity = Total Liabilities ÷ Total Equity\n• Debt to Assets = Total Liabilities ÷ Total Assets\n• Equity Ratio = Total Equity ÷ Total Assets\n• Interest Coverage = EBIT ÷ Interest Expense\n• Debt Service Coverage = Operating Income ÷ Total Debt Service\n• Net Asset Value = Total Assets - Total Liabilities" },
    { id: "leverage", label: "Leverage", calculation: "Leverage metrics measure debt usage:\n\n• Total Debt Ratio = Total Liabilities ÷ Total Assets\n• Long-term Debt Ratio = Long-term Debt ÷ Total Assets\n• Equity Multiplier = Total Assets ÷ Total Equity" },
    { id: "equity", label: "Equity Structure", calculation: "Equity metrics measure shareholder value:\n\n• Return on Equity = Net Income ÷ Average Shareholders' Equity\n• Book Value per Share = (Total Equity - Preferred Equity) ÷ Number of Shares Outstanding" },
  ]
    
  useEffect(() => {
    if (user) {
      loadCapitalStructureData()
      loadDividendHistory()
    }
  }, [user])

  useEffect(() => {
    calculateKPIsFromBalanceSheet()
  }, [balanceSheetData, selectedMonth, selectedYear])

  const loadCapitalStructureData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const capitalDoc = await getDoc(doc(db, "financialData", `${user.uid}_capitalStructure`))
      if (capitalDoc.exists()) {
        const data = capitalDoc.data()
        if (data.balanceSheetData) setBalanceSheetData(data.balanceSheetData)
        if (data.solvencyData) setSolvencyData(data.solvencyData)
        if (data.leverageData) setLeverageData(data.leverageData)
        if (data.equityData) setEquityData(data.equityData)
        if (data.kpiNotes) setKpiNotes(data.kpiNotes)
        if (data.kpiAnalysis) setKpiAnalysis(data.kpiAnalysis)
      }
    } catch (error) {
      console.error("Error loading capital structure data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadDividendHistory = async () => {
    if (!user) return
    try {
      const dividendQuery = query(
        collection(db, "financialData", `${user.uid}_dividends`, "dividendHistory"),
        orderBy("date", "desc")
      )
      const snapshot = await getDocs(dividendQuery)
      const dividends = []
      snapshot.forEach(doc => {
        dividends.push({ id: doc.id, ...doc.data() })
      })
      setDividendHistory(dividends)
    } catch (error) {
      console.error("Error loading dividend history:", error)
    }
  }

  const calculateKPIsFromBalanceSheet = () => {
    const monthIndex = getMonthIndex(selectedMonth)
    if (monthIndex < 0 || monthIndex >= 12) return
    
    // Calculate totals
    const totalAssets = calculateTotalAssets(monthIndex) || 0
    const totalLiabilities = calculateTotalLiabilities(monthIndex) || 0
    const totalEquity = calculateTotalEquity(monthIndex) || 0
    const netAssets = totalAssets - totalLiabilities
    
    // Calculate EBIT and Interest for coverage ratios (placeholders - should come from P&L)
    const ebit = totalAssets * 0.1
    const interestExpense = totalLiabilities * 0.05
    
    // Initialize arrays if they don't exist
    const newSolvencyData = { ...solvencyData }
    if (!newSolvencyData.debtToEquity || !Array.isArray(newSolvencyData.debtToEquity)) {
      newSolvencyData.debtToEquity = Array(12).fill("0")
    }
    if (!newSolvencyData.debtToAssets || !Array.isArray(newSolvencyData.debtToAssets)) {
      newSolvencyData.debtToAssets = Array(12).fill("0")
    }
    if (!newSolvencyData.equityRatio || !Array.isArray(newSolvencyData.equityRatio)) {
      newSolvencyData.equityRatio = Array(12).fill("0")
    }
    if (!newSolvencyData.interestCoverage || !Array.isArray(newSolvencyData.interestCoverage)) {
      newSolvencyData.interestCoverage = Array(12).fill("0")
    }
    if (!newSolvencyData.nav || !Array.isArray(newSolvencyData.nav)) {
      newSolvencyData.nav = Array(12).fill("0")
    }
    
    const newLeverageData = { ...leverageData }
    if (!newLeverageData.totalDebtRatio || !Array.isArray(newLeverageData.totalDebtRatio)) {
      newLeverageData.totalDebtRatio = Array(12).fill("0")
    }
    if (!newLeverageData.longTermDebtRatio || !Array.isArray(newLeverageData.longTermDebtRatio)) {
      newLeverageData.longTermDebtRatio = Array(12).fill("0")
    }
    if (!newLeverageData.equityMultiplier || !Array.isArray(newLeverageData.equityMultiplier)) {
      newLeverageData.equityMultiplier = Array(12).fill("0")
    }
    
    const newEquityData = { ...equityData }
    if (!newEquityData.equityRatio || !Array.isArray(newEquityData.equityRatio)) {
      newEquityData.equityRatio = Array(12).fill("0")
    }
    if (!newEquityData.returnOnEquity || !Array.isArray(newEquityData.returnOnEquity)) {
      newEquityData.returnOnEquity = Array(12).fill("0")
    }
    if (!newEquityData.bookValuePerShare || !Array.isArray(newEquityData.bookValuePerShare)) {
      newEquityData.bookValuePerShare = Array(12).fill("0")
    }
    
    // Solvency Ratios
    const debtToEquity = totalEquity !== 0 ? (totalLiabilities / totalEquity) : 0
    const debtToAssets = totalAssets !== 0 ? (totalLiabilities / totalAssets) : 0
    const equityRatio = totalAssets !== 0 ? (totalEquity / totalAssets) * 100 : 0
    const interestCoverage = interestExpense !== 0 ? (ebit / interestExpense) : 0
    
    // Leverage Ratios
    const totalDebtRatio = totalAssets !== 0 ? (totalLiabilities / totalAssets) : 0
    const longTermDebt = calculateTotal(balanceSheetData.liabilities.nonCurrentLiabilities, monthIndex) || 0
    const longTermDebtRatio = totalAssets !== 0 ? (longTermDebt / totalAssets) : 0
    const equityMultiplier = totalEquity !== 0 ? (totalAssets / totalEquity) : 0
    
    // Set values with 2 decimal places
    newSolvencyData.debtToEquity[monthIndex] = debtToEquity.toFixed(2)
    newSolvencyData.debtToAssets[monthIndex] = debtToAssets.toFixed(2)
    newSolvencyData.equityRatio[monthIndex] = equityRatio.toFixed(2)
    newSolvencyData.interestCoverage[monthIndex] = interestCoverage.toFixed(2)
    newSolvencyData.nav[monthIndex] = (netAssets / 1000000).toFixed(2)
    
    newLeverageData.totalDebtRatio[monthIndex] = totalDebtRatio.toFixed(2)
    newLeverageData.longTermDebtRatio[monthIndex] = longTermDebtRatio.toFixed(2)
    newLeverageData.equityMultiplier[monthIndex] = equityMultiplier.toFixed(2)
    
    newEquityData.equityRatio[monthIndex] = equityRatio.toFixed(2)
    
    setSolvencyData(newSolvencyData)
    setLeverageData(newLeverageData)
    setEquityData(newEquityData)
  }

  const calculateTotalAssets = (monthIndex) => {
    if (monthIndex < 0 || monthIndex >= 12) return 0
    
    // Bank accounts - with safe navigation
    let totalBank = 0
    if (balanceSheetData?.assets?.bank) {
      totalBank = Object.values(balanceSheetData.assets.bank).reduce((sum, arr) => {
        return sum + (Number.parseFloat(arr?.[monthIndex]) || 0)
      }, 0)
    }
    
    // Current assets - with safe navigation
    let totalCurrentAssets = 0
    if (balanceSheetData?.assets?.currentAssets) {
      totalCurrentAssets = calculateTotal(balanceSheetData.assets.currentAssets, monthIndex)
    }
    
    // Fixed assets - with safe navigation
    const totalFixedAssets = calculateTotalFixedAssets(monthIndex)
    
    // Intangible assets - with safe navigation
    const totalIntangibleAssets = calculateTotalIntangibleAssets(monthIndex)
    
    // Non-current assets - with safe navigation
    let totalNonCurrentAssets = 0
    if (balanceSheetData?.assets?.nonCurrentAssets) {
      totalNonCurrentAssets = calculateTotal(balanceSheetData.assets.nonCurrentAssets, monthIndex)
    }
    
    // Custom categories - with safe navigation
    let totalCustomAssets = 0
    if (balanceSheetData?.assets?.customCategories) {
      balanceSheetData.assets.customCategories.forEach(custom => {
        if (custom?.items) {
          Object.values(custom.items).forEach(arr => {
            totalCustomAssets += Number.parseFloat(arr?.[monthIndex]) || 0
          })
        }
      })
    }
    
    return totalBank + totalCurrentAssets + totalFixedAssets + totalIntangibleAssets + totalNonCurrentAssets + totalCustomAssets
  }

  const calculateTotalFixedAssets = (monthIndex) => {
    let total = 0
    
    if (balanceSheetData?.assets?.fixedAssets) {
      const fixedAssets = balanceSheetData.assets.fixedAssets
      
      // Add all fixed assets (positive values)
      total += Number.parseFloat(fixedAssets?.land?.[monthIndex]) || 0
      total += Number.parseFloat(fixedAssets?.buildings?.[monthIndex]) || 0
      total += Number.parseFloat(fixedAssets?.computerEquipment?.[monthIndex]) || 0
      total += Number.parseFloat(fixedAssets?.vehicles?.[monthIndex]) || 0
      total += Number.parseFloat(fixedAssets?.furniture?.[monthIndex]) || 0
      total += Number.parseFloat(fixedAssets?.machinery?.[monthIndex]) || 0
      total += Number.parseFloat(fixedAssets?.otherPropertyPlantEquipment?.[monthIndex]) || 0
      total += Number.parseFloat(fixedAssets?.assetsUnderConstruction?.[monthIndex]) || 0
      
      // Subtract accumulated depreciation
      total -= Number.parseFloat(fixedAssets?.lessDepreciationBuildings?.[monthIndex]) || 0
      total -= Number.parseFloat(fixedAssets?.lessDepreciationComputer?.[monthIndex]) || 0
      total -= Number.parseFloat(fixedAssets?.lessDepreciationVehicles?.[monthIndex]) || 0
      total -= Number.parseFloat(fixedAssets?.lessDepreciationFurniture?.[monthIndex]) || 0
      total -= Number.parseFloat(fixedAssets?.lessDepreciationMachinery?.[monthIndex]) || 0
      total -= Number.parseFloat(fixedAssets?.lessDepreciationOther?.[monthIndex]) || 0
    }
    
    return total
  }

  const calculateTotalIntangibleAssets = (monthIndex) => {
    let total = 0
    
    if (balanceSheetData?.assets?.intangibleAssets) {
      const intangibleAssets = balanceSheetData.assets.intangibleAssets
      
      total += Number.parseFloat(intangibleAssets?.goodwill?.[monthIndex]) || 0
      total += Number.parseFloat(intangibleAssets?.trademarks?.[monthIndex]) || 0
      total += Number.parseFloat(intangibleAssets?.patents?.[monthIndex]) || 0
      total += Number.parseFloat(intangibleAssets?.software?.[monthIndex]) || 0
      total += Number.parseFloat(intangibleAssets?.customerLists?.[monthIndex]) || 0
      
      // Subtract accumulated amortization
      total -= Number.parseFloat(intangibleAssets?.lessAmortization?.[monthIndex]) || 0
    }
    
    return total
  }

  const calculateTotalLiabilities = (monthIndex) => {
    const totalCurrentLiabilities = calculateTotal(balanceSheetData.liabilities.currentLiabilities, monthIndex)
    const totalNonCurrentLiabilities = calculateTotal(balanceSheetData.liabilities.nonCurrentLiabilities, monthIndex)
    
    // Custom liability categories
    let totalCustomLiabilities = 0
    if (balanceSheetData.customLiabilitiesCategories) {
      balanceSheetData.customLiabilitiesCategories.forEach(custom => {
        Object.values(custom.items).forEach(arr => {
          totalCustomLiabilities += Number.parseFloat(arr[monthIndex]) || 0
        })
      })
    }
    
    return totalCurrentLiabilities + totalNonCurrentLiabilities + totalCustomLiabilities
  }

  const calculateTotalEquity = (monthIndex) => {
    let total = calculateTotal(balanceSheetData.equity, monthIndex)
    
    // Subtract treasury shares
    total -= Number.parseFloat(balanceSheetData.equity.treasuryShares?.[monthIndex]) || 0
    
    // Custom equity categories
    if (balanceSheetData.customEquityCategories) {
      balanceSheetData.customEquityCategories.forEach(custom => {
        Object.values(custom.items).forEach(arr => {
          total += Number.parseFloat(arr[monthIndex]) || 0
        })
      })
    }
    
    return total
  }

  const monthIndex = getMonthIndex(selectedMonth)
  const totalAssets = calculateTotalAssets(monthIndex)
  const totalLiabilities = calculateTotalLiabilities(monthIndex)
  const totalEquity = calculateTotalEquity(monthIndex)
  const netAssets = totalAssets - totalLiabilities

  const formatValue = (value, unit = currencyUnit, decimals = 2) => {
    const num = Number.parseFloat(value) || 0
    switch(unit) {
      case "zar": return `R${num.toLocaleString(undefined, {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}`
      case "zar_thousand": return `R${(num * 1000).toLocaleString(undefined, {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}K`
      case "zar_million": return `R${num.toLocaleString(undefined, {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}m`
      case "zar_billion": return `R${(num / 1000).toLocaleString(undefined, {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}bn`
      default: return `R${num.toLocaleString(undefined, {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}`
    }
  }

  const handleCalculationClick = (title, calculation) => {
    setSelectedCalculation({ title, calculation })
    setShowCalculationModal(true)
  }

  const openTrendModal = (itemName, dataArray, budgetArray = null, isPercentage = false) => {
    // Ensure dataArray is an array
    const actualData = Array.isArray(dataArray) 
      ? dataArray.map(v => parseFloat(v) || 0)
      : Array(12).fill(0)
    
    const budgetData = budgetArray && Array.isArray(budgetArray)
      ? budgetArray.map(v => parseFloat(v) || 0)
      : null
    
    setSelectedTrendItem({ 
      name: itemName, 
      actual: actualData,
      budget: budgetData,
      isPercentage 
    })
    setShowTrendModal(true)
  }

  const renderTrendModal = () => {
    if (!selectedTrendItem) return null

    const labels = months.map(month => `${month}(${selectedYear})`)
    
    const chartData = {
      labels,
      datasets: [
        {
          label: `${selectedTrendItem.name} - Actual`,
          data: selectedTrendItem.actual,
          borderColor: "#5d4037",
          backgroundColor: "rgba(93, 64, 55, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.3,
        },
      ]
    }
    
    if (selectedTrendItem.budget) {
      chartData.datasets.push({
        label: `${selectedTrendItem.name} - Budget`,
        data: selectedTrendItem.budget,
        borderColor: "#f9a825",
        backgroundColor: "rgba(249, 168, 37, 0.1)",
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.3,
      })
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
            <h3 style={{ color: "#5d4037", margin: 0 }}>{selectedTrendItem.name} - Trend Analysis</h3>
            <button
              onClick={() => setShowTrendModal(false)}
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
                        return selectedTrendItem.isPercentage
                          ? `${context.dataset.label}: ${value.toFixed(2)}%`
                          : `${context.dataset.label}: ${formatValue(value)}`
                      },
                    },
                  },
                },
                scales: {
                  y: { 
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: selectedTrendItem.isPercentage ? "Percentage (%)" : `Value (${currencyUnit === "zar_million" ? "R m" : currencyUnit})`,
                      color: "#5d4037",
                    },
                  },
                  x: {
                    title: {
                      display: true,
                      text: "Month",
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px" }}>
              <div>
                <div style={{ fontSize: "12px", color: "#8d6e63", marginBottom: "5px" }}>Current Value</div>
                <div style={{ fontSize: "16px", fontWeight: "600", color: "#5d4037" }}>
                  {selectedTrendItem.isPercentage 
                    ? `${(selectedTrendItem.actual[selectedTrendItem.actual.length - 1] || 0).toFixed(2)}%`
                    : formatValue(selectedTrendItem.actual[selectedTrendItem.actual.length - 1] || 0)
                  }
                </div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#8d6e63", marginBottom: "5px" }}>Average</div>
                <div style={{ fontSize: "16px", fontWeight: "600", color: "#5d4037" }}>
                  {selectedTrendItem.isPercentage
                    ? `${(selectedTrendItem.actual.reduce((a, b) => a + b, 0) / selectedTrendItem.actual.length || 0).toFixed(2)}%`
                    : formatValue(selectedTrendItem.actual.reduce((a, b) => a + b, 0) / selectedTrendItem.actual.length || 0)
                  }
                </div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#8d6e63", marginBottom: "5px" }}>Trend</div>
                <div style={{ fontSize: "16px", fontWeight: "600", color: "#5d4037" }}>
                  {selectedTrendItem.actual.length > 1
                    ? selectedTrendItem.actual[selectedTrendItem.actual.length - 1] > 
                      selectedTrendItem.actual[selectedTrendItem.actual.length - 2]
                      ? "↗ Increasing"
                      : selectedTrendItem.actual[selectedTrendItem.actual.length - 1] < 
                        selectedTrendItem.actual[selectedTrendItem.actual.length - 2]
                      ? "↘ Decreasing"
                      : "→ Stable"
                    : "N/A"
                  }
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              onClick={() => setShowTrendModal(false)}
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

  const renderKPICard = (title, data, kpiKey, unit = "", isPercentage = false) => {
    const currentValue = Number.parseFloat(data[monthIndex]) || 0
    const budgetValue = 0 // Budget would come from a separate source
    
    return (
      <KPICard
        title={title}
        actualValue={currentValue}
        budgetValue={budgetValue}
        unit={currencyUnit}
        isPercentage={isPercentage}
        onEyeClick={() => {
          const tab = subTabs.find(t => t.id === activeSubTab)
          handleCalculationClick(title, tab?.calculation || "No calculation available")
        }}
        onAddNotes={(notes) => setKpiNotes(prev => ({ ...prev, [kpiKey]: notes }))}
        onAnalysis={() => setExpandedNotes(prev => ({ ...prev, [`${kpiKey}_analysis`]: !prev[`${kpiKey}_analysis`] }))}
        onTrend={() => openTrendModal(title, data, null, isPercentage)}
        notes={kpiNotes[kpiKey]}
        analysis={kpiAnalysis[kpiKey]}
        formatValue={formatValue}
        decimals={2}
      />
    )
  }

  const renderSolvency = () => (
    <div>
      <KeyQuestionBox
        question="Can the business meet its long-term financial obligations? Is the business financially stable?"
        signals="Debt levels, interest coverage, net asset value"
        decisions="Manage debt levels, improve asset base, consider equity financing"
        section="solvency"
      />
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
        {renderKPICard("Net Asset Value", solvencyData.nav, "nav", "ZAR")}
        {renderKPICard("Debt to Equity", solvencyData.debtToEquity, "debtToEquity", "ratio")}
        {renderKPICard("Debt to Assets", solvencyData.debtToAssets, "debtToAssets", "ratio")}
        {renderKPICard("Equity Ratio", solvencyData.equityRatio, "equityRatio", "%", true)}
        {renderKPICard("Interest Coverage", solvencyData.interestCoverage, "interestCoverage", "x")}
      </div>
    </div>
  )

  const renderLeverage = () => (
    <div>
      <KeyQuestionBox
        question="How effectively is the business using debt to finance its operations? What is the risk profile?"
        signals="Debt ratios, equity multiplier"
        decisions="Optimize capital structure, manage risk, refinance high-cost debt"
        section="leverage"
      />
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
        {renderKPICard("Total Debt Ratio", leverageData.totalDebtRatio, "totalDebtRatio", "ratio")}
        {renderKPICard("Long-term Debt Ratio", leverageData.longTermDebtRatio, "longTermDebtRatio", "ratio")}
        {renderKPICard("Equity Multiplier", leverageData.equityMultiplier, "equityMultiplier", "x")}
      </div>
    </div>
  )

  const renderEquityTab = () => {
    const last12MonthsDividends = dividendHistory
      .filter(d => {
        const dividendDate = new Date(d.date)
        const oneYearAgo = new Date()
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
        return dividendDate >= oneYearAgo
      })
      .reduce((sum, d) => sum + (d.amount || 0), 0)

    const dividendYield = totalEquity > 0 ? (last12MonthsDividends / totalEquity) * 100 : 0
    const currentYearEarnings = Number.parseFloat(balanceSheetData.equity?.currentYearEarnings?.[monthIndex]) || 0
    const payoutRatio = currentYearEarnings > 0 ? (last12MonthsDividends / currentYearEarnings) * 100 : 0

    return (
      <div>
        <KeyQuestionBox
          question="How effectively is equity being utilized? What is the return on shareholder investment?"
          signals="ROE, book value per share, dividend policy"
          decisions="Improve profitability, optimize equity structure, balance dividends vs reinvestment"
          section="equity"
        />
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "30px" }}>
          {renderKPICard("Equity Ratio", equityData.equityRatio, "equityRatio", "%", true)}
          {renderKPICard("Return on Equity", equityData.returnOnEquity, "returnOnEquity", "%", true)}
          {renderKPICard("Book Value per Share", equityData.bookValuePerShare, "bookValuePerShare", "ZAR")}
        </div>
        
        {/* Dividend Policy Section */}
        <div style={{ backgroundColor: "#fdfcfb", padding: "20px", borderRadius: "8px", marginBottom: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h4 style={{ color: "#5d4037", margin: 0 }}>Dividend Policy & Capital Retention</h4>
            {!isInvestorView && (
              <button
                onClick={() => setShowDividendModal(true)}
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
                + Add Dividend
              </button>
            )}
          </div>
          
          <p style={{ color: "#8d6e63", fontSize: "14px", marginBottom: "20px", lineHeight: "1.5" }}>
            Dividend policy analysis shows how the company balances returning capital to shareholders versus reinvesting for growth.
          </p>
          
          {/* Dividend History Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#e8ddd4" }}>
                  <th style={{ padding: "12px", textAlign: "left", color: "#5d4037", fontSize: "13px", fontWeight: "600" }}>Date</th>
                  <th style={{ padding: "12px", textAlign: "right", color: "#5d4037", fontSize: "13px", fontWeight: "600" }}>Amount (ZAR)</th>
                  <th style={{ padding: "12px", textAlign: "left", color: "#5d4037", fontSize: "13px", fontWeight: "600" }}>Type</th>
                  <th style={{ padding: "12px", textAlign: "left", color: "#5d4037", fontSize: "13px", fontWeight: "600" }}>Declared By</th>
                </tr>
              </thead>
              <tbody>
                {dividendHistory.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: "20px", textAlign: "center", color: "#8d6e63" }}>
                      No dividend records found
                    </td>
                  </tr>
                ) : (
                  dividendHistory.map((dividend, index) => (
                    <tr key={dividend.id} style={{ borderBottom: "1px solid #e8ddd4", backgroundColor: index % 2 === 0 ? "#fdfcfb" : "#f7f3f0" }}>
                      <td style={{ padding: "12px", color: "#5d4037", fontSize: "13px" }}>{dividend.date}</td>
                      <td style={{ padding: "12px", textAlign: "right", color: "#5d4037", fontSize: "13px", fontWeight: "600" }}>
                        {formatCurrency(dividend.amount, "zar", 2)}
                      </td>
                      <td style={{ padding: "12px", color: "#5d4037", fontSize: "13px" }}>{dividend.type}</td>
                      <td style={{ padding: "12px", color: "#5d4037", fontSize: "13px" }}>{dividend.declaredBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Dividend Statistics */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(3, 1fr)", 
            gap: "20px", 
            marginTop: "25px",
            paddingTop: "20px",
            borderTop: "2px solid #e8ddd4"
          }}>
            <div>
              <div style={{ fontSize: "12px", color: "#8d6e63", marginBottom: "5px" }}>Total Dividends (12 months)</div>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#5d4037" }}>
                {formatCurrency(last12MonthsDividends, "zar", 2)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#8d6e63", marginBottom: "5px" }}>Dividend Yield</div>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#5d4037" }}>
                {dividendYield.toFixed(2)}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#8d6e63", marginBottom: "5px" }}>Payout Ratio</div>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#5d4037" }}>
                {payoutRatio.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderBalanceSheet = () => {
    return (
      <div>
        <KeyQuestionBox
          question="Is the business financially solvent and appropriately structured for its current stage?"
          signals="Leverage, balance sheet strength, working capital position"
          decisions="Raise equity vs debt, restructure balance sheet, optimize working capital"
          section="balance-sheet"
        />

        {/* Controls */}
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
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
              <span style={{ color: "#5d4037", fontSize: "14px", whiteSpace: "nowrap" }}>Year:</span>
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
              <span style={{ color: "#5d4037", fontSize: "14px", whiteSpace: "nowrap" }}>Month:</span>
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

            <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
              <span style={{ color: "#5d4037", fontSize: "14px", whiteSpace: "nowrap" }}>Units:</span>
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

          {!isInvestorView && (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
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
            </div>
          )}
        </div>

        {/* Balance Sheet - Two Column Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
          {/* Assets Column */}
          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "18px", fontWeight: "700" }}>ASSETS</h3>
            
            {/* Bank Accounts */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ color: "#5d4037", fontSize: "16px", fontWeight: "600", marginBottom: "10px", borderBottom: "1px solid #e8ddd4", paddingBottom: "5px" }}>
                Bank & Cash
              </h4>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#e8ddd4" }}>
                    <th style={{ padding: "10px", textAlign: "left", color: "#5d4037", fontSize: "12px" }}>Account</th>
                    <th style={{ padding: "10px", textAlign: "right", color: "#5d4037", fontSize: "12px" }}>Amount</th>
                    <th style={{ padding: "10px", textAlign: "center", color: "#5d4037", fontSize: "12px", width: "50px" }}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {balanceSheetData?.assets?.bank && Object.keys(balanceSheetData.assets.bank).map((key) => (
                    <tr key={key}>
                      <td style={{ padding: "8px 0", color: "#5d4037", fontSize: "13px" }}>
                        {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                      </td>
                      <td style={{ padding: "8px 0", textAlign: "right", color: "#5d4037", fontSize: "13px", fontWeight: "600" }}>
                        {formatValue(Number.parseFloat(balanceSheetData.assets.bank[key]?.[monthIndex]) || 0)}
                      </td>
                      <td style={{ padding: "8px 0", textAlign: "center" }}>
                        <button
                          onClick={() => openTrendModal(
                            key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()),
                            balanceSheetData.assets.bank[key],
                            null,
                            false
                          )}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px",
                            borderRadius: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e8ddd4"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#5d4037"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: "#f5f0eb" }}>
                    <td style={{ padding: "10px 0", color: "#5d4037", fontSize: "14px", fontWeight: "700" }}>
                      Total Bank & Cash
                    </td>
                    <td style={{ padding: "10px 0", textAlign: "right", color: "#5d4037", fontSize: "14px", fontWeight: "700" }}>
                      {formatValue(
                        balanceSheetData?.assets?.bank ? 
                        Object.values(balanceSheetData.assets.bank).reduce((sum, arr) => 
                          sum + (Number.parseFloat(arr?.[monthIndex]) || 0), 0
                        ) : 0
                      )}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Current Assets */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ color: "#5d4037", fontSize: "16px", fontWeight: "600", marginBottom: "10px", borderBottom: "1px solid #e8ddd4", paddingBottom: "5px" }}>
                Current Assets
              </h4>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#e8ddd4" }}>
                    <th style={{ padding: "10px", textAlign: "left", color: "#5d4037", fontSize: "12px" }}>Item</th>
                    <th style={{ padding: "10px", textAlign: "right", color: "#5d4037", fontSize: "12px" }}>Amount</th>
                    <th style={{ padding: "10px", textAlign: "center", color: "#5d4037", fontSize: "12px", width: "50px" }}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {balanceSheetData?.assets?.currentAssets && Object.keys(balanceSheetData.assets.currentAssets).map((key) => (
                    <tr key={key}>
                      <td style={{ padding: "8px 0", color: "#5d4037", fontSize: "13px" }}>
                        {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                      </td>
                      <td style={{ padding: "8px 0", textAlign: "right", color: "#5d4037", fontSize: "13px", fontWeight: "600" }}>
                        {formatValue(Number.parseFloat(balanceSheetData.assets.currentAssets[key]?.[monthIndex]) || 0)}
                      </td>
                      <td style={{ padding: "8px 0", textAlign: "center" }}>
                        <button
                          onClick={() => openTrendModal(
                            key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()),
                            balanceSheetData.assets.currentAssets[key],
                            null,
                            false
                          )}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px",
                            borderRadius: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e8ddd4"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#5d4037"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: "#f5f0eb" }}>
                    <td style={{ padding: "10px 0", color: "#5d4037", fontSize: "14px", fontWeight: "700" }}>
                      Total Current Assets
                    </td>
                    <td style={{ padding: "10px 0", textAlign: "right", color: "#5d4037", fontSize: "14px", fontWeight: "700" }}>
                      {formatValue(calculateTotal(balanceSheetData?.assets?.currentAssets || {}, monthIndex))}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Fixed Assets */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ color: "#5d4037", fontSize: "16px", fontWeight: "600", marginBottom: "10px", borderBottom: "1px solid #e8ddd4", paddingBottom: "5px" }}>
                Fixed Assets (Net)
              </h4>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#e8ddd4" }}>
                    <th style={{ padding: "10px", textAlign: "left", color: "#5d4037", fontSize: "12px" }}>Item</th>
                    <th style={{ padding: "10px", textAlign: "right", color: "#5d4037", fontSize: "12px" }}>Amount</th>
                    <th style={{ padding: "10px", textAlign: "center", color: "#5d4037", fontSize: "12px", width: "50px" }}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "8px 0", color: "#5d4037", fontSize: "13px" }}>Land</td>
                    <td style={{ padding: "8px 0", textAlign: "right", color: "#5d4037", fontSize: "13px", fontWeight: "600" }}>
                      {formatValue(Number.parseFloat(balanceSheetData?.assets?.fixedAssets?.land?.[monthIndex]) || 0)}
                    </td>
                    <td style={{ padding: "8px 0", textAlign: "center" }}>
                      <button
                        onClick={() => openTrendModal(
                          "Land",
                          [balanceSheetData?.assets?.fixedAssets?.land?.[monthIndex]],
                          null,
                          false
                        )}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto",
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5d4037" strokeWidth="2">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 0", color: "#5d4037", fontSize: "13px" }}>Buildings (Net)</td>
                    <td style={{ padding: "8px 0", textAlign: "right", color: "#5d4037", fontSize: "13px", fontWeight: "600" }}>
                      {formatValue(
                        (Number.parseFloat(balanceSheetData?.assets?.fixedAssets?.buildings?.[monthIndex]) || 0) -
                        (Number.parseFloat(balanceSheetData?.assets?.fixedAssets?.lessDepreciationBuildings?.[monthIndex]) || 0)
                      )}
                    </td>
                    <td style={{ padding: "8px 0", textAlign: "center" }}>
                      <button
                        onClick={() => openTrendModal(
                          "Buildings",
                          [balanceSheetData?.assets?.fixedAssets?.buildings?.[monthIndex]],
                          null,
                          false
                        )}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto",
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5d4037" strokeWidth="2">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 0", color: "#5d4037", fontSize: "13px" }}>Computer Equipment (Net)</td>
                    <td style={{ padding: "8px 0", textAlign: "right", color: "#5d4037", fontSize: "13px", fontWeight: "600" }}>
                      {formatValue(
                        (Number.parseFloat(balanceSheetData?.assets?.fixedAssets?.computerEquipment?.[monthIndex]) || 0) -
                        (Number.parseFloat(balanceSheetData?.assets?.fixedAssets?.lessDepreciationComputer?.[monthIndex]) || 0)
                      )}
                    </td>
                    <td style={{ padding: "8px 0", textAlign: "center" }}>
                      <button
                        onClick={() => openTrendModal(
                          "Computer Equipment",
                          [balanceSheetData?.assets?.fixedAssets?.computerEquipment?.[monthIndex]],
                          null,
                          false
                        )}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto",
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5d4037" strokeWidth="2">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 0", color: "#5d4037", fontSize: "13px" }}>Vehicles (Net)</td>
                    <td style={{ padding: "8px 0", textAlign: "right", color: "#5d4037", fontSize: "13px", fontWeight: "600" }}>
                      {formatValue(
                        (Number.parseFloat(balanceSheetData?.assets?.fixedAssets?.vehicles?.[monthIndex]) || 0) -
                        (Number.parseFloat(balanceSheetData?.assets?.fixedAssets?.lessDepreciationVehicles?.[monthIndex]) || 0)
                      )}
                    </td>
                    <td style={{ padding: "8px 0", textAlign: "center" }}>
                      <button
                        onClick={() => openTrendModal(
                          "Vehicles",
                          [balanceSheetData?.assets?.fixedAssets?.vehicles?.[monthIndex]],
                          null,
                          false
                        )}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto",
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5d4037" strokeWidth="2">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 0", color: "#5d4037", fontSize: "13px" }}>Furniture (Net)</td>
                    <td style={{ padding: "8px 0", textAlign: "right", color: "#5d4037", fontSize: "13px", fontWeight: "600" }}>
                      {formatValue(
                        (Number.parseFloat(balanceSheetData?.assets?.fixedAssets?.furniture?.[monthIndex]) || 0) -
                        (Number.parseFloat(balanceSheetData?.assets?.fixedAssets?.lessDepreciationFurniture?.[monthIndex]) || 0)
                      )}
                    </td>
                    <td style={{ padding: "8px 0", textAlign: "center" }}>
                      <button
                        onClick={() => openTrendModal(
                          "Furniture",
                          [balanceSheetData?.assets?.fixedAssets?.furniture?.[monthIndex]],
                          null,
                          false
                        )}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto",
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5d4037" strokeWidth="2">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 0", color: "#5d4037", fontSize: "13px" }}>Machinery (Net)</td>
                    <td style={{ padding: "8px 0", textAlign: "right", color: "#5d4037", fontSize: "13px", fontWeight: "600" }}>
                      {formatValue(
                        (Number.parseFloat(balanceSheetData?.assets?.fixedAssets?.machinery?.[monthIndex]) || 0) -
                        (Number.parseFloat(balanceSheetData?.assets?.fixedAssets?.lessDepreciationMachinery?.[monthIndex]) || 0)
                      )}
                    </td>
                    <td style={{ padding: "8px 0", textAlign: "center" }}>
                      <button
                        onClick={() => openTrendModal(
                          "Machinery",
                          [balanceSheetData?.assets?.fixedAssets?.machinery?.[monthIndex]],
                          null,
                          false
                        )}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto",
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5d4037" strokeWidth="2">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 0", color: "#5d4037", fontSize: "13px" }}>Other PPE (Net)</td>
                    <td style={{ padding: "8px 0", textAlign: "right", color: "#5d4037", fontSize: "13px", fontWeight: "600" }}>
                      {formatValue(
                        (Number.parseFloat(balanceSheetData?.assets?.fixedAssets?.otherPropertyPlantEquipment?.[monthIndex]) || 0) -
                        (Number.parseFloat(balanceSheetData?.assets?.fixedAssets?.lessDepreciationOther?.[monthIndex]) || 0)
                      )}
                    </td>
                    <td style={{ padding: "8px 0", textAlign: "center" }}>
                      <button
                        onClick={() => openTrendModal(
                          "Other PPE",
                          [balanceSheetData?.assets?.fixedAssets?.otherPropertyPlantEquipment?.[monthIndex]],
                          null,
                          false
                        )}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto",
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5d4037" strokeWidth="2">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 0", color: "#5d4037", fontSize: "13px" }}>Assets Under Construction</td>
                    <td style={{ padding: "8px 0", textAlign: "right", color: "#5d4037", fontSize: "13px", fontWeight: "600" }}>
                      {formatValue(Number.parseFloat(balanceSheetData?.assets?.fixedAssets?.assetsUnderConstruction?.[monthIndex]) || 0)}
                    </td>
                    <td style={{ padding: "8px 0", textAlign: "center" }}>
                      <button
                        onClick={() => openTrendModal(
                          "Assets Under Construction",
                          [balanceSheetData?.assets?.fixedAssets?.assetsUnderConstruction?.[monthIndex]],
                          null,
                          false
                        )}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto",
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5d4037" strokeWidth="2">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                      </button>
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: "#f5f0eb" }}>
                    <td style={{ padding: "10px 0", color: "#5d4037", fontSize: "14px", fontWeight: "700" }}>
                      Total Fixed Assets
                    </td>
                    <td style={{ padding: "10px 0", textAlign: "right", color: "#5d4037", fontSize: "14px", fontWeight: "700" }}>
                      {formatValue(calculateTotalFixedAssets(monthIndex))}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Intangible Assets */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ color: "#5d4037", fontSize: "16px", fontWeight: "600", marginBottom: "10px", borderBottom: "1px solid #e8ddd4", paddingBottom: "5px" }}>
                Intangible Assets
              </h4>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#e8ddd4" }}>
                    <th style={{ padding: "10px", textAlign: "left", color: "#5d4037", fontSize: "12px" }}>Item</th>
                    <th style={{ padding: "10px", textAlign: "right", color: "#5d4037", fontSize: "12px" }}>Amount</th>
                    <th style={{ padding: "10px", textAlign: "center", color: "#5d4037", fontSize: "12px", width: "50px" }}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {balanceSheetData?.assets?.intangibleAssets && Object.keys(balanceSheetData.assets.intangibleAssets).map((key) => {
                    if (key === "lessAmortization") {
                      return (
                        <tr key={key}>
                          <td style={{ padding: "8px 0", color: "#5d4037", fontSize: "13px" }}>
                            Less: Accumulated Amortization
                          </td>
                          <td style={{ padding: "8px 0", textAlign: "right", color: "#c62828", fontSize: "13px", fontWeight: "600" }}>
                            ({formatValue(Number.parseFloat(balanceSheetData.assets.intangibleAssets[key]?.[monthIndex]) || 0)})
                          </td>
                          <td style={{ padding: "8px 0", textAlign: "center" }}>
                            <button
                              onClick={() => openTrendModal(
                                "Accumulated Amortization",
                                [balanceSheetData.assets.intangibleAssets[key]?.[monthIndex]],
                                null,
                                false
                              )}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: "4px",
                                borderRadius: "4px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto",
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5d4037" strokeWidth="2">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      )
                    }
                    return (
                      <tr key={key}>
                        <td style={{ padding: "8px 0", color: "#5d4037", fontSize: "13px" }}>
                          {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                        </td>
                        <td style={{ padding: "8px 0", textAlign: "right", color: "#5d4037", fontSize: "13px", fontWeight: "600" }}>
                          {formatValue(Number.parseFloat(balanceSheetData.assets.intangibleAssets[key]?.[monthIndex]) || 0)}
                        </td>
                        <td style={{ padding: "8px 0", textAlign: "center" }}>
                          <button
                            onClick={() => openTrendModal(
                              key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()),
                              [balanceSheetData.assets.intangibleAssets[key]?.[monthIndex]],
                              null,
                              false
                            )}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "4px",
                              borderRadius: "4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              margin: "0 auto",
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5d4037" strokeWidth="2">
                              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  <tr style={{ backgroundColor: "#f5f0eb" }}>
                    <td style={{ padding: "10px 0", color: "#5d4037", fontSize: "14px", fontWeight: "700" }}>
                      Total Intangible Assets
                    </td>
                    <td style={{ padding: "10px 0", textAlign: "right", color: "#5d4037", fontSize: "14px", fontWeight: "700" }}>
                      {formatValue(calculateTotalIntangibleAssets(monthIndex))}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Non-Current Assets */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ color: "#5d4037", fontSize: "16px", fontWeight: "600", marginBottom: "10px", borderBottom: "1px solid #e8ddd4", paddingBottom: "5px" }}>
                Non-Current Assets
              </h4>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#e8ddd4" }}>
                    <th style={{ padding: "10px", textAlign: "left", color: "#5d4037", fontSize: "12px" }}>Item</th>
                    <th style={{ padding: "10px", textAlign: "right", color: "#5d4037", fontSize: "12px" }}>Amount</th>
                    <th style={{ padding: "10px", textAlign: "center", color: "#5d4037", fontSize: "12px", width: "50px" }}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {balanceSheetData?.assets?.nonCurrentAssets && Object.keys(balanceSheetData.assets.nonCurrentAssets).map((key) => (
                    <tr key={key}>
                      <td style={{ padding: "8px 0", color: "#5d4037", fontSize: "13px" }}>
                        {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                      </td>
                      <td style={{ padding: "8px 0", textAlign: "right", color: "#5d4037", fontSize: "13px", fontWeight: "600" }}>
                        {formatValue(Number.parseFloat(balanceSheetData.assets.nonCurrentAssets[key]?.[monthIndex]) || 0)}
                      </td>
                      <td style={{ padding: "8px 0", textAlign: "center" }}>
                        <button
                          onClick={() => openTrendModal(
                            key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()),
                            [balanceSheetData.assets.nonCurrentAssets[key]?.[monthIndex]],
                            null,
                            false
                          )}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px",
                            borderRadius: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto",
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5d4037" strokeWidth="2">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: "#f5f0eb" }}>
                    <td style={{ padding: "10px 0", color: "#5d4037", fontSize: "14px", fontWeight: "700" }}>
                      Total Non-Current Assets
                    </td>
                    <td style={{ padding: "10px 0", textAlign: "right", color: "#5d4037", fontSize: "14px", fontWeight: "700" }}>
                      {formatValue(calculateTotal(balanceSheetData?.assets?.nonCurrentAssets || {}, monthIndex))}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Custom Asset Categories */}
            {balanceSheetData?.assets?.customCategories && balanceSheetData.assets.customCategories.map((custom, index) => (
              <div key={index} style={{ marginBottom: "20px" }}>
                <h4 style={{ color: "#5d4037", fontSize: "16px", fontWeight: "600", marginBottom: "10px", borderBottom: "1px solid #e8ddd4", paddingBottom: "5px" }}>
                  {custom?.category || "Custom Category"}
                </h4>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#e8ddd4" }}>
                      <th style={{ padding: "10px", textAlign: "left", color: "#5d4037", fontSize: "12px" }}>Item</th>
                      <th style={{ padding: "10px", textAlign: "right", color: "#5d4037", fontSize: "12px" }}>Amount</th>
                      <th style={{ padding: "10px", textAlign: "center", color: "#5d4037", fontSize: "12px", width: "50px" }}>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {custom?.items && Object.keys(custom.items).map((itemKey) => (
                      <tr key={itemKey}>
                        <td style={{ padding: "8px 0", color: "#5d4037", fontSize: "13px" }}>
                          {itemKey}
                        </td>
                        <td style={{ padding: "8px 0", textAlign: "right", color: "#5d4037", fontSize: "13px", fontWeight: "600" }}>
                          {formatValue(Number.parseFloat(custom.items[itemKey]?.[monthIndex]) || 0)}
                        </td>
                        <td style={{ padding: "8px 0", textAlign: "center" }}>
                          <button
                            onClick={() => openTrendModal(
                              itemKey,
                              [custom.items[itemKey]?.[monthIndex]],
                              null,
                              false
                            )}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "4px",
                              borderRadius: "4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              margin: "0 auto",
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5d4037" strokeWidth="2">
                              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: "#f5f0eb" }}>
                      <td style={{ padding: "10px 0", color: "#5d4037", fontSize: "14px", fontWeight: "700" }}>
                        Total {custom?.category || "Custom Category"}
                      </td>
                      <td style={{ padding: "10px 0", textAlign: "right", color: "#5d4037", fontSize: "14px", fontWeight: "700" }}>
                        {formatValue(
                          custom?.items ? 
                          Object.values(custom.items).reduce((sum, arr) => 
                            sum + (Number.parseFloat(arr?.[monthIndex]) || 0), 0
                          ) : 0
                        )}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}

            {/* Total Assets */}
            <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#5d4037", borderRadius: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#fdfcfb", fontSize: "16px", fontWeight: "700" }}>TOTAL ASSETS</span>
                <span style={{ color: "#fdfcfb", fontSize: "18px", fontWeight: "700" }}>
                  {formatValue(totalAssets)}
                </span>
              </div>
            </div>
          </div>

          {/* Liabilities & Equity Column */}
          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "18px", fontWeight: "700" }}>
              LIABILITIES & EQUITY
            </h3>
            
            {/* Current Liabilities */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ color: "#5d4037", fontSize: "16px", fontWeight: "600", marginBottom: "10px", borderBottom: "1px solid #e8ddd4", paddingBottom: "5px" }}>
                Current Liabilities
              </h4>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#e8ddd4" }}>
                    <th style={{ padding: "10px", textAlign: "left", color: "#5d4037", fontSize: "12px" }}>Item</th>
                    <th style={{ padding: "10px", textAlign: "right", color: "#5d4037", fontSize: "12px" }}>Amount</th>
                    <th style={{ padding: "10px", textAlign: "center", color: "#5d4037", fontSize: "12px", width: "50px" }}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {balanceSheetData?.liabilities?.currentLiabilities && Object.keys(balanceSheetData.liabilities.currentLiabilities).map((key) => (
                    <tr key={key}>
                      <td style={{ padding: "8px 0", color: "#5d4037", fontSize: "13px" }}>
                        {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                      </td>
                      <td style={{ padding: "8px 0", textAlign: "right", color: "#5d4037", fontSize: "13px", fontWeight: "600" }}>
                        {formatValue(Number.parseFloat(balanceSheetData.liabilities.currentLiabilities[key]?.[monthIndex]) || 0)}
                      </td>
                      <td style={{ padding: "8px 0", textAlign: "center" }}>
                        <button
                          onClick={() => openTrendModal(
                            key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()),
                            [balanceSheetData.liabilities.currentLiabilities[key]?.[monthIndex]],
                            null,
                            false
                          )}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px",
                            borderRadius: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto",
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5d4037" strokeWidth="2">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: "#f5f0eb" }}>
                    <td style={{ padding: "10px 0", color: "#5d4037", fontSize: "14px", fontWeight: "700" }}>
                      Total Current Liabilities
                    </td>
                    <td style={{ padding: "10px 0", textAlign: "right", color: "#5d4037", fontSize: "14px", fontWeight: "700" }}>
                      {formatValue(calculateTotal(balanceSheetData?.liabilities?.currentLiabilities || {}, monthIndex))}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Non-Current Liabilities */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ color: "#5d4037", fontSize: "16px", fontWeight: "600", marginBottom: "10px", borderBottom: "1px solid #e8ddd4", paddingBottom: "5px" }}>
                Non-Current Liabilities
              </h4>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#e8ddd4" }}>
                    <th style={{ padding: "10px", textAlign: "left", color: "#5d4037", fontSize: "12px" }}>Item</th>
                    <th style={{ padding: "10px", textAlign: "right", color: "#5d4037", fontSize: "12px" }}>Amount</th>
                    <th style={{ padding: "10px", textAlign: "center", color: "#5d4037", fontSize: "12px", width: "50px" }}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {balanceSheetData?.liabilities?.nonCurrentLiabilities && Object.keys(balanceSheetData.liabilities.nonCurrentLiabilities).map((key) => (
                    <tr key={key}>
                      <td style={{ padding: "8px 0", color: "#5d4037", fontSize: "13px" }}>
                        {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                      </td>
                      <td style={{ padding: "8px 0", textAlign: "right", color: "#5d4037", fontSize: "13px", fontWeight: "600" }}>
                        {formatValue(Number.parseFloat(balanceSheetData.liabilities.nonCurrentLiabilities[key]?.[monthIndex]) || 0)}
                      </td>
                      <td style={{ padding: "8px 0", textAlign: "center" }}>
                        <button
                          onClick={() => openTrendModal(
                            key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()),
                            [balanceSheetData.liabilities.nonCurrentLiabilities[key]?.[monthIndex]],
                            null,
                            false
                          )}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px",
                            borderRadius: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto",
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5d4037" strokeWidth="2">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: "#f5f0eb" }}>
                    <td style={{ padding: "10px 0", color: "#5d4037", fontSize: "14px", fontWeight: "700" }}>
                      Total Non-Current Liabilities
                    </td>
                    <td style={{ padding: "10px 0", textAlign: "right", color: "#5d4037", fontSize: "14px", fontWeight: "700" }}>
                      {formatValue(calculateTotal(balanceSheetData?.liabilities?.nonCurrentLiabilities || {}, monthIndex))}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Liabilities */}
            <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#8d6e63", borderRadius: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#fdfcfb", fontSize: "16px", fontWeight: "700" }}>TOTAL LIABILITIES</span>
                <span style={{ color: "#fdfcfb", fontSize: "18px", fontWeight: "700" }}>
                  {formatValue(totalLiabilities)}
                </span>
              </div>
            </div>

            {/* Equity */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ color: "#5d4037", fontSize: "16px", fontWeight: "600", marginBottom: "10px", borderBottom: "1px solid #e8ddd4", paddingBottom: "5px" }}>
                Equity
              </h4>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#e8ddd4" }}>
                    <th style={{ padding: "10px", textAlign: "left", color: "#5d4037", fontSize: "12px" }}>Item</th>
                    <th style={{ padding: "10px", textAlign: "right", color: "#5d4037", fontSize: "12px" }}>Amount</th>
                    <th style={{ padding: "10px", textAlign: "center", color: "#5d4037", fontSize: "12px", width: "50px" }}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {balanceSheetData?.equity && Object.keys(balanceSheetData.equity).map((key) => {
                    if (key === "treasuryShares") {
                      return (
                        <tr key={key}>
                          <td style={{ padding: "8px 0", color: "#5d4037", fontSize: "13px" }}>
                            Less: Treasury Shares
                          </td>
                          <td style={{ padding: "8px 0", textAlign: "right", color: "#c62828", fontSize: "13px", fontWeight: "600" }}>
                            ({formatValue(Number.parseFloat(balanceSheetData.equity[key]?.[monthIndex]) || 0)})
                          </td>
                          <td style={{ padding: "8px 0", textAlign: "center" }}>
                            <button
                              onClick={() => openTrendModal(
                                "Treasury Shares",
                                [balanceSheetData.equity[key]?.[monthIndex]],
                                null,
                                false
                              )}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: "4px",
                                borderRadius: "4px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto",
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5d4037" strokeWidth="2">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      )
                    }
                    return (
                      <tr key={key}>
                        <td style={{ padding: "8px 0", color: "#5d4037", fontSize: "13px" }}>
                          {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                        </td>
                        <td style={{ padding: "8px 0", textAlign: "right", color: "#5d4037", fontSize: "13px", fontWeight: "600" }}>
                          {formatValue(Number.parseFloat(balanceSheetData.equity[key]?.[monthIndex]) || 0)}
                        </td>
                        <td style={{ padding: "8px 0", textAlign: "center" }}>
                          <button
                            onClick={() => openTrendModal(
                              key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()),
                              [balanceSheetData.equity[key]?.[monthIndex]],
                              null,
                              false
                            )}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "4px",
                              borderRadius: "4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              margin: "0 auto",
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5d4037" strokeWidth="2">
                              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  <tr style={{ backgroundColor: "#f5f0eb" }}>
                    <td style={{ padding: "10px 0", color: "#5d4037", fontSize: "14px", fontWeight: "700" }}>
                      Total Equity
                    </td>
                    <td style={{ padding: "10px 0", textAlign: "right", color: "#5d4037", fontSize: "14px", fontWeight: "700" }}>
                      {formatValue(totalEquity)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Liabilities & Equity */}
            <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#5d4037", borderRadius: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#fdfcfb", fontSize: "16px", fontWeight: "700" }}>TOTAL LIABILITIES & EQUITY</span>
                <span style={{ color: "#fdfcfb", fontSize: "18px", fontWeight: "700" }}>
                  {formatValue(totalLiabilities + totalEquity)}
                </span>
              </div>
            </div>

            {/* Balance Check */}
            <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#e8ddd4", borderRadius: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#5d4037", fontSize: "14px", fontWeight: "600" }}>Balance Check</span>
                <span style={{ 
                  color: "#5d4037", 
                  fontSize: "16px", 
                  fontWeight: "700",
                  padding: "4px 12px",
                  backgroundColor: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1 ? "#4caf50" : "#f44336",
                  color: "#fff",
                  borderRadius: "4px"
                }}>
                  {Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1 ? "✓ Balanced" : "✗ Not Balanced"}
                </span>
              </div>
              <div style={{ marginTop: "8px", fontSize: "12px", color: "#8d6e63" }}>
                Difference: {formatValue(Math.abs(totalAssets - (totalLiabilities + totalEquity)))}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        {balanceSheetData?.assets?.additionalMetrics && (
          <div style={{ marginTop: "30px", padding: "20px", backgroundColor: "#fdfcfb", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <h4 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "16px", fontWeight: "600" }}>
              Additional Business Metrics
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
              {Object.keys(balanceSheetData.assets.additionalMetrics).map((key) => (
                <div key={key}>
                  <div style={{ fontSize: "12px", color: "#8d6e63", marginBottom: "5px" }}>
                    {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: "600", color: "#5d4037" }}>
                    {key.includes("Percentage") || key.includes("per") ? 
                      `${Number.parseFloat(balanceSheetData.assets.additionalMetrics[key]?.[monthIndex] || 0).toFixed(2)}%` :
                      formatValue(Number.parseFloat(balanceSheetData.assets.additionalMetrics[key]?.[monthIndex] || 0))
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderDividendModal = () => (
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
          width: "90%",
        }}
      >
        <h3 style={{ color: "#5d4037", marginBottom: "20px" }}>Add Dividend Record</h3>
        
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>
            Date *
          </label>
          <input
            type="date"
            value={dividendData.date}
            onChange={(e) => setDividendData({...dividendData, date: e.target.value})}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #e8ddd4",
              fontSize: "14px",
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>
            Amount (ZAR) *
          </label>
          <input
            type="number"
            value={dividendData.amount}
            onChange={(e) => setDividendData({...dividendData, amount: e.target.value})}
            placeholder="0.00"
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #e8ddd4",
              fontSize: "14px",
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>
            Type
          </label>
          <select
            value={dividendData.type}
            onChange={(e) => setDividendData({...dividendData, type: e.target.value})}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #e8ddd4",
              fontSize: "14px",
            }}
          >
            <option value="Interim">Interim</option>
            <option value="Final">Final</option>
            <option value="Special">Special</option>
          </select>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>
            Declared By
          </label>
          <input
            type="text"
            value={dividendData.declaredBy}
            onChange={(e) => setDividendData({...dividendData, declaredBy: e.target.value})}
            placeholder="e.g., Board Resolution #123"
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #e8ddd4",
              fontSize: "14px",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={() => {
              setShowDividendModal(false)
              setDividendData({ date: "", amount: "", type: "Interim", declaredBy: "" })
            }}
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
            onClick={async () => {
              if (!user) return
              try {
                await addDoc(
                  collection(db, "financialData", `${user.uid}_dividends`, "dividendHistory"),
                  {
                    ...dividendData,
                    amount: Number.parseFloat(dividendData.amount),
                    userId: user.uid,
                    createdAt: new Date().toISOString()
                  }
                )
                loadDividendHistory()
                setShowDividendModal(false)
                setDividendData({ date: "", amount: "", type: "Interim", declaredBy: "" })
                alert("Dividend added successfully!")
              } catch (error) {
                console.error("Error saving dividend:", error)
                alert("Error saving dividend. Please try again.")
              }
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
            Save Dividend
          </button>
        </div>
      </div>
    </div>
  )

  if (activeSection !== "capital-structure") return null

  return (
    <div>
      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          borderBottom: "2px solid #e8ddd4",
          paddingBottom: "10px",
        }}
      >
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              padding: "8px 16px",
              backgroundColor: activeSubTab === tab.id ? "#5d4037" : "transparent",
              color: activeSubTab === tab.id ? "#fdfcfb" : "#5d4037",
              border: "none",
              borderRadius: "6px 6px 0 0",
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

      {/* Render Active Tab */}
      {activeSubTab === "balance-sheet" && renderBalanceSheet()}
      {activeSubTab === "solvency" && renderSolvency()}
      {activeSubTab === "leverage" && renderLeverage()}
      {activeSubTab === "equity" && renderEquityTab()}

      {/* Universal Add Data Modal */}
      <UniversalAddDataModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentTab="capital-structure"
        user={user}
        onSave={loadCapitalStructureData}
        loading={loading}
        financialYearStart={financialYearStart}
      />

      {/* Dividend Modal */}
      {showDividendModal && renderDividendModal()}

      {/* Calculation Modal */}
      <CalculationModal
        isOpen={showCalculationModal}
        onClose={() => setShowCalculationModal(false)}
        title={selectedCalculation.title}
        calculation={selectedCalculation.calculation}
      />

      {/* Trend Modal */}
      {showTrendModal && renderTrendModal()}
    </div>
  )
}

// ==================== PERFORMANCE ENGINE COMPONENT ====================

const PerformanceEngine = ({ activeSection, viewMode, financialYearStart, user, onUpdateChartData, isInvestorView }) => {
  const [visibleCharts, setVisibleCharts] = useState({
    sales: true,
    cogs: true,
    opex: true,
    grossProfit: true,
    netProfit: true,
    ebitda: false,
    gpMargin: true,
    npMargin: true,
  })
  const [showModal, setShowModal] = useState(false)
  const [showVariance, setShowVariance] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState({})
  const [pnlDetails, setPnlDetails] = useState({
    sales: Array(12).fill(""),
    cogs: Array(12).fill(""),
    opex: Array(12).fill(""),
    tax: Array(12).fill(""),
    interestExpense: Array(12).fill(""),
    depreciation: Array(12).fill(""),
    amortization: Array(12).fill(""),
    salesBudget: Array(12).fill(""),
    cogsBudget: Array(12).fill(""),
    opexBudget: Array(12).fill(""),
    taxBudget: Array(12).fill(""),
    interestExpenseBudget: Array(12).fill(""),
    depreciationBudget: Array(12).fill(""),
    amortizationBudget: Array(12).fill(""),
    notes: "",
  })
  const [chartNotes, setChartNotes] = useState({})
  const [chartAnalysis, setChartAnalysis] = useState({})
  const [firebaseChartData, setFirebaseChartData] = useState({})
  const [loading, setLoading] = useState(false)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selectedFinancialYearStart, setSelectedFinancialYearStart] = useState(financialYearStart)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [showAddKPIModal, setShowAddKPIModal] = useState(false)
  const [newKPI, setNewKPI] = useState({ name: "", type: "bar", dataType: "currency" })
  const [customKPIs, setCustomKPIs] = useState({})
  const [selectedViewMode, setSelectedViewMode] = useState("month")
  const [showTrendModal, setShowTrendModal] = useState(false)
  const [selectedTrendItem, setSelectedTrendItem] = useState(null)
  const [currencyUnit, setCurrencyUnit] = useState("zar_million")
  const [showCalculationModal, setShowCalculationModal] = useState(false)
  const [selectedCalculation, setSelectedCalculation] = useState({ title: "", calculation: "" })

  useEffect(() => {
    if (user) {
      loadPnLDataFromFirebase()
      loadCustomKPIs()
    }
  }, [user])

  const loadPnLDataFromFirebase = async () => {
    if (!user) return
    setLoading(true)
    try {
      const pnlManualDoc = await getDoc(doc(db, "financialData", `${user.uid}_pnlManual`))
      if (pnlManualDoc.exists()) {
        const firebaseData = pnlManualDoc.data()
        setPnlDetails({
          sales: firebaseData.sales?.map(v => v.toFixed(2)) || Array(12).fill(""),
          cogs: firebaseData.cogs?.map(v => v.toFixed(2)) || Array(12).fill(""),
          opex: firebaseData.opex?.map(v => v.toFixed(2)) || Array(12).fill(""),
          tax: firebaseData.tax?.map(v => v.toFixed(2)) || Array(12).fill(""),
          interestExpense: firebaseData.interestExpense?.map(v => v.toFixed(2)) || Array(12).fill(""),
          depreciation: firebaseData.depreciation?.map(v => v.toFixed(2)) || Array(12).fill(""),
          amortization: firebaseData.amortization?.map(v => v.toFixed(2)) || Array(12).fill(""),
          salesBudget: firebaseData.salesBudget?.map(v => v.toFixed(2)) || Array(12).fill(""),
          cogsBudget: firebaseData.cogsBudget?.map(v => v.toFixed(2)) || Array(12).fill(""),
          opexBudget: firebaseData.opexBudget?.map(v => v.toFixed(2)) || Array(12).fill(""),
          taxBudget: firebaseData.taxBudget?.map(v => v.toFixed(2)) || Array(12).fill(""),
          interestExpenseBudget: firebaseData.interestExpenseBudget?.map(v => v.toFixed(2)) || Array(12).fill(""),
          depreciationBudget: firebaseData.depreciationBudget?.map(v => v.toFixed(2)) || Array(12).fill(""),
          amortizationBudget: firebaseData.amortizationBudget?.map(v => v.toFixed(2)) || Array(12).fill(""),
          notes: firebaseData.notes || "",
        })
        if (firebaseData.chartNotes) setChartNotes(firebaseData.chartNotes)
        if (firebaseData.chartAnalysis) setChartAnalysis(firebaseData.chartAnalysis)
        if (firebaseData.financialYearStart) setSelectedFinancialYearStart(firebaseData.financialYearStart)
        if (firebaseData.year) setSelectedYear(firebaseData.year)
        processFirebaseDataForCharts(firebaseData)
      }
    } catch (error) {
      console.error("Error loading PnL data from Firebase:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadCustomKPIs = async () => {
    if (!user) return
    try {
      const kpiQuery = query(
        collection(db, "financialData"),
        where("userId", "==", user.uid),
        where("isCustomKPI", "==", true),
        where("section", "==", "performance-engine")
      )
      const querySnapshot = await getDocs(kpiQuery)
      const kpis = {}
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        kpis[data.chartName] = data
        setVisibleCharts(prev => ({ ...prev, [data.chartName]: true }))
      })
      setCustomKPIs(kpis)
    } catch (error) {
      console.error("Error loading custom KPIs:", error)
    }
  }

  const processFirebaseDataForCharts = (firebaseData) => {
    const sales = firebaseData.sales?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
    const cogs = firebaseData.cogs?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
    const opex = firebaseData.opex?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
    const tax = firebaseData.tax?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
    const interestExpense = firebaseData.interestExpense?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
    const depreciation = firebaseData.depreciation?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
    const amortization = firebaseData.amortization?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)

    const salesBudget = firebaseData.salesBudget?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
    const cogsBudget = firebaseData.cogsBudget?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
    const opexBudget = firebaseData.opexBudget?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
    const taxBudget = firebaseData.taxBudget?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
    const interestExpenseBudget = firebaseData.interestExpenseBudget?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
    const depreciationBudget = firebaseData.depreciationBudget?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
    const amortizationBudget = firebaseData.amortizationBudget?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)

    const grossProfit = sales.map((s, i) => s - cogs[i])
    const grossProfitBudget = salesBudget.map((s, i) => s - cogsBudget[i])

    const ebitda = grossProfit.map((gp, i) => gp - opex[i])
    const ebitdaBudget = grossProfitBudget.map((gp, i) => gp - opexBudget[i])

    const ebit = ebitda.map((e, i) => e - depreciation[i] - amortization[i])
    const ebitBudget = ebitdaBudget.map((e, i) => e - depreciationBudget[i] - amortizationBudget[i])

    const netProfit = ebit.map((e, i) => e - interestExpense[i] + (firebaseData.interestIncome?.[i] || 0) - tax[i])
    const netProfitBudget = ebitBudget.map((e, i) => e - interestExpenseBudget[i] + (firebaseData.interestIncomeBudget?.[i] || 0) - taxBudget[i])

    const gpMargin = sales.map((s, i) => s !== 0 ? (grossProfit[i] / s) * 100 : 0)
    const gpMarginBudget = salesBudget.map((s, i) => s !== 0 ? (grossProfitBudget[i] / s) * 100 : 0)

    const npMargin = sales.map((s, i) => s !== 0 ? (netProfit[i] / s) * 100 : 0)
    const npMarginBudget = salesBudget.map((s, i) => s !== 0 ? (netProfitBudget[i] / s) * 100 : 0)

    const chartData = {
      sales: { actual: sales.map(v => v / 1000000), budget: salesBudget.map(v => v / 1000000) },
      cogs: { actual: cogs.map(v => v / 1000000), budget: cogsBudget.map(v => v / 1000000) },
      opex: { actual: opex.map(v => v / 1000000), budget: opexBudget.map(v => v / 1000000) },
      grossProfit: { actual: grossProfit.map(v => v / 1000000), budget: grossProfitBudget.map(v => v / 1000000) },
      ebitda: { actual: ebitda.map(v => v / 1000000), budget: ebitdaBudget.map(v => v / 1000000) },
      ebit: { actual: ebit.map(v => v / 1000000), budget: ebitBudget.map(v => v / 1000000) },
      netProfit: { actual: netProfit.map(v => v / 1000000), budget: netProfitBudget.map(v => v / 1000000) },
      gpMargin: { actual: gpMargin, budget: gpMarginBudget },
      npMargin: { actual: npMargin, budget: npMarginBudget },
    }

    setFirebaseChartData(chartData)
    if (onUpdateChartData) {
      Object.keys(chartData).forEach(key => onUpdateChartData(key, chartData[key]))
    }
  }

  const openTrendModal = (itemName, dataKey, isPercentage = false) => {
    const data = firebaseChartData[dataKey] || { actual: [], budget: [] }
    setSelectedTrendItem({ 
      name: itemName, 
      actual: data.actual || [], 
      budget: data.budget || [], 
      isPercentage 
    })
    setShowTrendModal(true)
  }

  const renderTrendModal = () => {
    if (!selectedTrendItem) return null

    const labels = generateLabels().map(label => {
      if (label.includes("(")) return label
      if (label.length === 3) return `${label}(${selectedYear})`
      return label
    })
    
    const chartData = {
      labels,
      datasets: [
        {
          label: `${selectedTrendItem.name} - Actual`,
          data: aggregateDataForView(selectedTrendItem.actual),
          borderColor: "#5d4037",
          backgroundColor: "rgba(93, 64, 55, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.3,
        },
      ]
    }
    
    if (selectedTrendItem.budget && selectedTrendItem.budget.length > 0 && selectedTrendItem.budget.some(v => v !== 0)) {
      chartData.datasets.push({
        label: `${selectedTrendItem.name} - Budget`,
        data: aggregateDataForView(selectedTrendItem.budget),
        borderColor: "#f9a825",
        backgroundColor: "rgba(249, 168, 37, 0.1)",
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.3,
      })
    }

    return (
      <TrendModal
        isOpen={showTrendModal}
        onClose={() => setShowTrendModal(false)}
        item={selectedTrendItem}
        currencyUnit={currencyUnit}
        labels={labels}
        formatValue={formatValue}
        financialYearStart={selectedFinancialYearStart}
      />
    )
  }

  if (activeSection !== "performance-engine") return null

  const generateLabels = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const startMonthIndex = months.indexOf(selectedFinancialYearStart)
    const orderedMonths = [...months.slice(startMonthIndex), ...months.slice(0, startMonthIndex)]

    if (selectedViewMode === "month") return orderedMonths
    else if (selectedViewMode === "quarter") return ["Q1", "Q2", "Q3", "Q4"]
    else return [selectedYear.toString()]
  }

  const aggregateDataForView = (data) => {
    if (selectedViewMode === "month") return data
    else if (selectedViewMode === "quarter") {
      const quarters = []
      for (let i = 0; i < 4; i++) {
        const sum = data.slice(i * 3, i * 3 + 3).reduce((acc, val) => acc + val, 0)
        quarters.push(sum / 3)
      }
      return quarters
    } else {
      const avg = data.reduce((acc, val) => acc + val, 0) / data.length
      return [avg]
    }
  }

  const formatValue = (value, unit = currencyUnit, decimals = 2) => {
    const num = Number.parseFloat(value) || 0
    switch(unit) {
      case "zar": return `R${num.toLocaleString(undefined, {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}`
      case "zar_thousand": return `R${(num * 1000).toLocaleString(undefined, {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}K`
      case "zar_million": return `R${num.toLocaleString(undefined, {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}m`
      case "zar_billion": return `R${(num / 1000).toLocaleString(undefined, {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}bn`
      default: return `R${num.toLocaleString(undefined, {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}`
    }
  }

  const handleCalculationClick = (title, calculation) => {
    setSelectedCalculation({ title, calculation })
    setShowCalculationModal(true)
  }

  const renderKPICard = (title, dataKey, isPercentage = false, calculation = "") => {
    const data = firebaseChartData[dataKey] || { actual: [], budget: [] }
    const chartData = aggregateDataForView(data.actual)
    const budgetData = aggregateDataForView(data.budget || [])
    const currentValue = chartData.length > 0 ? chartData[chartData.length - 1] : 0
    const currentBudget = budgetData.length > 0 ? budgetData[budgetData.length - 1] : 0
    
    return (
      <KPICard
        title={title}
        actualValue={currentValue}
        budgetValue={currentBudget}
        unit={currencyUnit}
        isPercentage={isPercentage}
        onEyeClick={() => handleCalculationClick(title, calculation)}
        onAddNotes={(notes) => setChartNotes(prev => ({ ...prev, [dataKey]: notes }))}
        onAnalysis={() => setExpandedNotes(prev => ({ ...prev, [`${dataKey}_analysis`]: !prev[`${dataKey}_analysis`] }))}
        onTrend={() => openTrendModal(title, dataKey, isPercentage)}
        notes={chartNotes[dataKey]}
        analysis={chartAnalysis[dataKey]}
        formatValue={formatValue}
        decimals={2}
      />
    )
  }

  const labels = generateLabels()

  const calculationTexts = {
    sales: "Sales / Revenue: Total income from goods sold or services rendered.\n\nCalculation: Sum of all sales invoices for the period.",
    cogs: "Cost of Goods Sold: Direct costs attributable to production.\n\nCalculation: Opening Inventory + Purchases - Closing Inventory",
    opex: "Operating Expenses: Costs to run daily operations.\n\nCalculation: Salaries + Rent + Utilities + Marketing + Admin + Other",
    grossProfit: "Gross Profit = Sales - Cost of Goods Sold\n\nShows profitability of core products/services before operating expenses.",
    ebitda: "EBITDA = Gross Profit - Operating Expenses\n\nEarnings Before Interest, Taxes, Depreciation & Amortization",
    ebit: "EBIT = EBITDA - Depreciation - Amortization\n\nEarnings Before Interest & Taxes",
    netProfit: "Net Profit = EBIT + Interest Income - Interest Expense - Tax\n\nBottom-line profit after all expenses.",
    gpMargin: "Gross Profit Margin = (Gross Profit ÷ Sales) × 100%\n\nMeasures production efficiency and pricing power.",
    npMargin: "Net Profit Margin = (Net Profit ÷ Sales) × 100%\n\nMeasures overall profitability after all expenses.",
  }

  return (
    <div style={{ paddingTop: "20px" }}>
      <KeyQuestionBox
        question="Is the business economically working? Are margins healthy and sustainable?"
        signals="Margin trends, profitability direction, revenue growth"
        decisions="Fix pricing, cost control, optimize product mix, growth pacing"
        section="performance-engine"
      />

      {/* Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "15px",
        }}
      >
        <h2 style={{ color: "#5d4037", fontSize: "24px", fontWeight: "700" }}>Performance Engine</h2>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
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
          
          <button
            onClick={() => setShowVariance(!showVariance)}
            style={{
              padding: "8px 16px",
              backgroundColor: showVariance ? "#5d4037" : "#e8ddd4",
              color: showVariance ? "#fdfcfb" : "#5d4037",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "500",
              fontSize: "14px",
            }}
          >
            {showVariance ? "Show Actual/Budget" : "Show Variance"}
          </button>
          
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
                fontSize: "14px",
              }}
            >
              Add Data
            </button>
          )}
        </div>
      </div>

      {/* Revenue & Cost Circles - 3 per row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
        {renderKPICard("Revenue", "sales", false, calculationTexts.sales)}
        {renderKPICard("COGS", "cogs", false, calculationTexts.cogs)}
        {renderKPICard("Operating Expenses", "opex", false, calculationTexts.opex)}
      </div>

      {/* Profit Circles - 2 per row */}
      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ color: "#5d4037", fontSize: "20px", fontWeight: "600", marginBottom: "15px", paddingBottom: "10px", borderBottom: "2px solid #e8ddd4" }}>
          Profitability Analysis
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
          {renderKPICard("Gross Profit", "grossProfit", false, calculationTexts.grossProfit)}
          {renderKPICard("EBITDA", "ebitda", false, calculationTexts.ebitda)}
          {renderKPICard("EBIT", "ebit", false, calculationTexts.ebit)}
          {renderKPICard("Net Profit", "netProfit", false, calculationTexts.netProfit)}
        </div>
      </div>

      {/* Margin Circles - 2 per row */}
      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ color: "#5d4037", fontSize: "20px", fontWeight: "600", marginBottom: "15px", paddingBottom: "10px", borderBottom: "2px solid #e8ddd4" }}>
          Margin Analysis
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
          {renderKPICard("Gross Profit Margin", "gpMargin", true, calculationTexts.gpMargin)}
          {renderKPICard("Net Profit Margin", "npMargin", true, calculationTexts.npMargin)}
        </div>
      </div>

      {/* Custom KPIs */}
      {Object.keys(customKPIs).length > 0 && (
        <>
          <h3 style={{ color: "#5d4037", fontSize: "20px", fontWeight: "600", marginBottom: "15px" }}>Custom KPIs</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
            {Object.values(customKPIs).map((kpi) => {
              const data = firebaseChartData[kpi.chartName] || { actual: [], budget: [] }
              const chartData = aggregateDataForView(data.actual)
              const budgetData = aggregateDataForView(data.budget || [])
              const currentValue = chartData.length > 0 ? chartData[chartData.length - 1] : 0
              const currentBudget = budgetData.length > 0 ? budgetData[budgetData.length - 1] : 0
              
              return (
                <KPICard
                  key={kpi.chartName}
                  title={kpi.name}
                  actualValue={currentValue}
                  budgetValue={currentBudget}
                  unit={currencyUnit}
                  isPercentage={kpi.dataType === "percentage"}
                  onEyeClick={() => handleCalculationClick(kpi.name, `Custom KPI: ${kpi.name}\n\nData Type: ${kpi.dataType}\nChart Type: ${kpi.type}`)}
                  onAddNotes={(notes) => setChartNotes(prev => ({ ...prev, [kpi.chartName]: notes }))}
                  onAnalysis={() => setExpandedNotes(prev => ({ ...prev, [`${kpi.chartName}_analysis`]: !prev[`${kpi.chartName}_analysis`] }))}
                  onTrend={() => openTrendModal(kpi.name, kpi.chartName, kpi.dataType === "percentage")}
                  notes={chartNotes[kpi.chartName]}
                  analysis={chartAnalysis[kpi.chartName]}
                  formatValue={formatValue}
                  decimals={2}
                />
              )
            })}
          </div>
        </>
      )}

      {/* Universal Add Data Modal */}
      <UniversalAddDataModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentTab="performance-engine"
        user={user}
        onSave={() => {
          loadPnLDataFromFirebase()
          loadCustomKPIs()
        }}
        loading={loading}
        financialYearStart={selectedFinancialYearStart}
      />

      {/* Calculation Modal */}
      <CalculationModal
        isOpen={showCalculationModal}
        onClose={() => setShowCalculationModal(false)}
        title={selectedCalculation.title}
        calculation={selectedCalculation.calculation}
      />

      {/* Trend Modal */}
      {showTrendModal && renderTrendModal()}
    </div>
  )
}

// ==================== COST AGILITY COMPONENT ====================

const CostAgility = ({ activeSection, user, isInvestorView, financialYearStart }) => {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(financialYearStart)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedViewMode, setSelectedViewMode] = useState("month")
  const [expandedNotes, setExpandedNotes] = useState({})
  const [chartNotes, setChartNotes] = useState({})
  const [chartAnalysis, setChartAnalysis] = useState({})
  const [currencyUnit, setCurrencyUnit] = useState("zar_million")
  const [showCalculationModal, setShowCalculationModal] = useState(false)
  const [selectedCalculation, setSelectedCalculation] = useState({ title: "", calculation: "" })
  const [showTrendModal, setShowTrendModal] = useState(false)
  const [selectedTrendItem, setSelectedTrendItem] = useState(null)
  const [costDetails, setCostDetails] = useState({
    fixedCosts: Array(12).fill(""),
    variableCosts: Array(12).fill(""),
    discretionaryCosts: Array(12).fill(""),
    semiVariableCosts: Array(12).fill(""),
    lockInDuration: Array(12).fill(""),
    notes: "",
  })

  const [firebaseChartData, setFirebaseChartData] = useState({})

  useEffect(() => {
    if (user) loadCostDataFromFirebase()
  }, [user])

  const loadCostDataFromFirebase = async () => {
    if (!user) return
    setLoading(true)
    try {
      const costDoc = await getDoc(doc(db, "financialData", `${user.uid}_costAgility`))
      if (costDoc.exists()) {
        const firebaseData = costDoc.data()
        setCostDetails({
          fixedCosts: firebaseData.fixedCosts?.map(v => v.toFixed(2)) || Array(12).fill(""),
          variableCosts: firebaseData.variableCosts?.map(v => v.toFixed(2)) || Array(12).fill(""),
          discretionaryCosts: firebaseData.discretionaryCosts?.map(v => v.toFixed(2)) || Array(12).fill(""),
          semiVariableCosts: firebaseData.semiVariableCosts?.map(v => v.toFixed(2)) || Array(12).fill(""),
          lockInDuration: firebaseData.lockInDuration?.map(v => v.toFixed(0)) || Array(12).fill(""),
          notes: firebaseData.notes || "",
        })
        processFirebaseDataForCharts(firebaseData)
      }
    } catch (error) {
      console.error("Error loading cost data:", error)
    } finally {
      setLoading(false)
    }
  }

  const processFirebaseDataForCharts = (firebaseData) => {
    const fixedCosts = firebaseData.fixedCosts?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
    const variableCosts = firebaseData.variableCosts?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
    const discretionaryCosts = firebaseData.discretionaryCosts?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
    const semiVariableCosts = firebaseData.semiVariableCosts?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
    const lockInDuration = firebaseData.lockInDuration?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)

    const totalCosts = fixedCosts.map((fc, i) => fc + variableCosts[i] + semiVariableCosts[i])
    const fixedVariableRatio = totalCosts.map((total, i) => total !== 0 ? (fixedCosts[i] / total) * 100 : 0)
    const discretionaryPercentage = totalCosts.map((total, i) => total !== 0 ? (discretionaryCosts[i] / total) * 100 : 0)

    setFirebaseChartData({
      fixedCosts: { actual: fixedCosts.map(v => v / 1000000) },
      variableCosts: { actual: variableCosts.map(v => v / 1000000) },
      discretionaryCosts: { actual: discretionaryCosts.map(v => v / 1000000) },
      semiVariableCosts: { actual: semiVariableCosts.map(v => v / 1000000) },
      lockInDuration: { actual: lockInDuration },
      totalCosts: { actual: totalCosts.map(v => v / 1000000) },
      fixedVariableRatio: { actual: fixedVariableRatio },
      discretionaryPercentage: { actual: discretionaryPercentage },
    })
  }

  const openTrendModal = (itemName, dataKey, isPercentage = false) => {
    const data = firebaseChartData[dataKey] || { actual: [] }
    setSelectedTrendItem({ 
      name: itemName, 
      actual: data.actual || [], 
      budget: [], 
      isPercentage 
    })
    setShowTrendModal(true)
  }

  const renderTrendModal = () => {
    if (!selectedTrendItem) return null

    const labels = generateLabels().map(label => {
      if (label.includes("(")) return label
      if (label.length === 3) return `${label}(${selectedYear})`
      return label
    })
    
    const chartData = {
      labels,
      datasets: [
        {
          label: `${selectedTrendItem.name}`,
          data: aggregateDataForView(selectedTrendItem.actual),
          borderColor: "#5d4037",
          backgroundColor: "rgba(93, 64, 55, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.3,
        },
      ]
    }

    return (
      <TrendModal
        isOpen={showTrendModal}
        onClose={() => setShowTrendModal(false)}
        item={selectedTrendItem}
        currencyUnit={currencyUnit}
        labels={labels}
        formatValue={formatValue}
        financialYearStart={financialYearStart}
      />
    )
  }

  if (activeSection !== "cost-agility") return null

  const generateLabels = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const startMonthIndex = months.indexOf(financialYearStart)
    const orderedMonths = [...months.slice(startMonthIndex), ...months.slice(0, startMonthIndex)]

    if (selectedViewMode === "month") return orderedMonths
    else if (selectedViewMode === "quarter") return ["Q1", "Q2", "Q3", "Q4"]
    else return [selectedYear.toString()]
  }

  const aggregateDataForView = (data) => {
    if (selectedViewMode === "month") return data
    else if (selectedViewMode === "quarter") {
      const quarters = []
      for (let i = 0; i < 4; i++) {
        const sum = data.slice(i * 3, i * 3 + 3).reduce((acc, val) => acc + val, 0)
        quarters.push(sum / 3)
      }
      return quarters
    } else {
      const avg = data.reduce((acc, val) => acc + val, 0) / data.length
      return [avg]
    }
  }

  const formatValue = (value, unit = currencyUnit, decimals = 2) => {
    const num = Number.parseFloat(value) || 0
    switch(unit) {
      case "zar": return `R${num.toLocaleString(undefined, {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}`
      case "zar_thousand": return `R${(num * 1000).toLocaleString(undefined, {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}K`
      case "zar_million": return `R${num.toLocaleString(undefined, {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}m`
      case "zar_billion": return `R${(num / 1000).toLocaleString(undefined, {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}bn`
      default: return `R${num.toLocaleString(undefined, {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}`
    }
  }

  const handleCalculationClick = (title, calculation) => {
    setSelectedCalculation({ title, calculation })
    setShowCalculationModal(true)
  }

  const renderKPICard = (title, dataKey, isPercentage = false, calculation = "") => {
    const data = firebaseChartData[dataKey] || { actual: [] }
    const chartData = aggregateDataForView(data.actual)
    const currentValue = chartData.length > 0 ? chartData[chartData.length - 1] : 0
    
    return (
      <KPICard
        title={title}
        actualValue={currentValue}
        budgetValue={0}
        unit={currencyUnit}
        isPercentage={isPercentage}
        onEyeClick={() => handleCalculationClick(title, calculation)}
        onAddNotes={(notes) => setChartNotes(prev => ({ ...prev, [dataKey]: notes }))}
        onAnalysis={() => setExpandedNotes(prev => ({ ...prev, [`${dataKey}_analysis`]: !prev[`${dataKey}_analysis`] }))}
        onTrend={() => openTrendModal(title, dataKey, isPercentage)}
        notes={chartNotes[dataKey]}
        analysis={chartAnalysis[dataKey]}
        formatValue={formatValue}
        decimals={2}
      />
    )
  }

  const months = getMonthsForYear(selectedYear, financialYearStart)
  const years = getYearsRange(2021, 2030)

  const calculationTexts = {
    fixedCosts: "Fixed Costs: Costs that remain constant regardless of production volume.\n\nExamples: Rent, Salaries, Insurance, Depreciation",
    variableCosts: "Variable Costs: Costs that vary directly with production volume.\n\nExamples: Raw materials, Direct labor, Sales commissions",
    discretionaryCosts: "Discretionary Costs: Non-essential costs that can be reduced or eliminated.\n\nExamples: Advertising, R&D, Training, Bonuses",
    semiVariableCosts: "Semi-Variable Costs: Costs with both fixed and variable components.\n\nExamples: Utilities, Maintenance, Phone bills",
    lockInDuration: "Lock-in Duration: Average time fixed costs are committed.\n\nCalculation: Weighted average of contract terms (months)",
    fixedVariableRatio: "Fixed/Variable Ratio = (Fixed Costs ÷ Total Costs) × 100%\n\nHigher ratio indicates less cost flexibility",
    discretionaryPercentage: "Discretionary % = (Discretionary Costs ÷ Total Costs) × 100%\n\nIndicates capacity to reduce costs quickly",
  }

  return (
    <div style={{ paddingTop: "20px" }}>
      <KeyQuestionBox
        question="Can costs flex under pressure? If revenue drops, can the business adapt quickly?"
        signals="Fixed vs variable rigidity, discretionary spending capacity"
        decisions="Restructure costs, delay scaling, renegotiate contracts, adjust capital strategy"
        section="cost-agility"
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "15px",
        }}
      >
        <h2 style={{ color: "#5d4037", fontSize: "24px", fontWeight: "700" }}>Cost Agility</h2>

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
                  <option key={year} value={year}>{year}</option>
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
                  <option key={month} value={month}>{month}</option>
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
                fontSize: "14px",
              }}
            >
              Add Data
            </button>
          )}
        </div>
      </div>

      {/* Cost Structure Circles - 3 per row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
        {renderKPICard("Fixed Costs", "fixedCosts", false, calculationTexts.fixedCosts)}
        {renderKPICard("Variable Costs", "variableCosts", false, calculationTexts.variableCosts)}
        {renderKPICard("Semi-Variable Costs", "semiVariableCosts", false, calculationTexts.semiVariableCosts)}
        {renderKPICard("Discretionary Costs", "discretionaryCosts", false, calculationTexts.discretionaryCosts)}
        {renderKPICard("Lock-in Duration", "lockInDuration", false, calculationTexts.lockInDuration)}
        {renderKPICard("Total Costs", "totalCosts", false)}
      </div>

      {/* Ratio Analysis - 2 per row */}
      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ color: "#5d4037", fontSize: "20px", fontWeight: "600", marginBottom: "15px", paddingBottom: "10px", borderBottom: "2px solid #e8ddd4" }}>
          Cost Structure Ratios
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
          {renderKPICard("Fixed/Variable Ratio", "fixedVariableRatio", true, calculationTexts.fixedVariableRatio)}
          {renderKPICard("Discretionary % of Total", "discretionaryPercentage", true, calculationTexts.discretionaryPercentage)}
        </div>
      </div>

      {/* Universal Add Data Modal */}
      <UniversalAddDataModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentTab="cost-agility"
        user={user}
        onSave={loadCostDataFromFirebase}
        loading={loading}
        financialYearStart={financialYearStart}
      />

      {/* Calculation Modal */}
      <CalculationModal
        isOpen={showCalculationModal}
        onClose={() => setShowCalculationModal(false)}
        title={selectedCalculation.title}
        calculation={selectedCalculation.calculation}
      />

      {/* Trend Modal */}
      {showTrendModal && renderTrendModal()}
    </div>
  )
}

// ==================== LIQUIDITY & SURVIVAL COMPONENT ====================

const LiquiditySurvival = ({ activeSection, user, isInvestorView, financialYearStart }) => {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(financialYearStart)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedViewMode, setSelectedViewMode] = useState("month")
  const [expandedNotes, setExpandedNotes] = useState({})
  const [chartNotes, setChartNotes] = useState({})
  const [chartAnalysis, setChartAnalysis] = useState({})
  const [currencyUnit, setCurrencyUnit] = useState("zar_million")
  const [showCalculationModal, setShowCalculationModal] = useState(false)
  const [selectedCalculation, setSelectedCalculation] = useState({ title: "", calculation: "" })
  const [showTrendModal, setShowTrendModal] = useState(false)
  const [selectedTrendItem, setSelectedTrendItem] = useState(null)
  const [liquidityDetails, setLiquidityDetails] = useState({
    currentRatio: Array(12).fill(""),
    quickRatio: Array(12).fill(""),
    cashRatio: Array(12).fill(""),
    burnRate: Array(12).fill(""),
    cashCover: Array(12).fill(""),
    cashflow: Array(12).fill(""),
    operatingCashflow: Array(12).fill(""),
    investingCashflow: Array(12).fill(""),
    financingCashflow: Array(12).fill(""),
    loanRepayments: Array(12).fill(""),
    cashBalance: Array(12).fill(""),
    workingCapital: Array(12).fill(""),
    notes: "",
  })

  const [firebaseChartData, setFirebaseChartData] = useState({})
  const [loans, setLoans] = useState([])

  useEffect(() => {
    if (user) {
      loadLiquidityDataFromFirebase()
      loadLoans()
    }
  }, [user])

  const loadLiquidityDataFromFirebase = async () => {
    if (!user) return
    setLoading(true)
    try {
      const liquidityDoc = await getDoc(doc(db, "financialData", `${user.uid}_liquiditySurvival`))
      if (liquidityDoc.exists()) {
        const firebaseData = liquidityDoc.data()
        setLiquidityDetails({
          currentRatio: firebaseData.currentRatio?.map(v => v.toFixed(2)) || Array(12).fill(""),
          quickRatio: firebaseData.quickRatio?.map(v => v.toFixed(2)) || Array(12).fill(""),
          cashRatio: firebaseData.cashRatio?.map(v => v.toFixed(2)) || Array(12).fill(""),
          burnRate: firebaseData.burnRate?.map(v => v.toFixed(2)) || Array(12).fill(""),
          cashCover: firebaseData.cashCover?.map(v => v.toFixed(1)) || Array(12).fill(""),
          cashflow: firebaseData.cashflow?.map(v => v.toFixed(2)) || Array(12).fill(""),
          operatingCashflow: firebaseData.operatingCashflow?.map(v => v.toFixed(2)) || Array(12).fill(""),
          investingCashflow: firebaseData.investingCashflow?.map(v => v.toFixed(2)) || Array(12).fill(""),
          financingCashflow: firebaseData.financingCashflow?.map(v => v.toFixed(2)) || Array(12).fill(""),
          loanRepayments: firebaseData.loanRepayments?.map(v => v.toFixed(2)) || Array(12).fill(""),
          cashBalance: firebaseData.cashBalance?.map(v => v.toFixed(2)) || Array(12).fill(""),
          workingCapital: firebaseData.workingCapital?.map(v => v.toFixed(2)) || Array(12).fill(""),
          notes: firebaseData.notes || "",
        })
        processFirebaseDataForCharts(firebaseData)
      }
    } catch (error) {
      console.error("Error loading liquidity data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadLoans = async () => {
    if (!user) return
    try {
      const loansQuery = query(
        collection(db, "financialData"),
        where("userId", "==", user.uid),
        where("type", "==", "loan"),
        where("section", "==", "liquidity-survival")
      )
      const querySnapshot = await getDocs(loansQuery)
      const loadedLoans = []
      querySnapshot.forEach((doc) => loadedLoans.push(doc.data()))
      setLoans(loadedLoans)
    } catch (error) {
      console.error("Error loading loans:", error)
    }
  }

  const processFirebaseDataForCharts = (firebaseData) => {
    const currentRatio = firebaseData.currentRatio?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
    const quickRatio = firebaseData.quickRatio?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
    const cashRatio = firebaseData.cashRatio?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
    const burnRate = firebaseData.burnRate?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
    const cashCover = firebaseData.cashCover?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
    const cashflow = firebaseData.cashflow?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
    const loanRepayments = firebaseData.loanRepayments?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
    const cashBalance = firebaseData.cashBalance?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)
    const workingCapital = firebaseData.workingCapital?.map(v => Number.parseFloat(v) || 0) || Array(12).fill(0)

    const monthsRunway = burnRate.map((burn, i) => burn !== 0 ? (cashBalance[i] / burn) : 0)

    setFirebaseChartData({
      currentRatio: { actual: currentRatio },
      quickRatio: { actual: quickRatio },
      cashRatio: { actual: cashRatio },
      burnRate: { actual: burnRate.map(v => v / 1000000) },
      cashCover: { actual: cashCover },
      cashflow: { actual: cashflow.map(v => v / 1000000) },
      loanRepayments: { actual: loanRepayments.map(v => v / 1000000) },
      cashBalance: { actual: cashBalance.map(v => v / 1000000) },
      workingCapital: { actual: workingCapital.map(v => v / 1000000) },
      monthsRunway: { actual: monthsRunway },
    })
  }

  const openTrendModal = (itemName, dataKey, isPercentage = false) => {
    const data = firebaseChartData[dataKey] || { actual: [] }
    setSelectedTrendItem({ 
      name: itemName, 
      actual: data.actual || [], 
      budget: [], 
      isPercentage 
    })
    setShowTrendModal(true)
  }

  const renderTrendModal = () => {
    if (!selectedTrendItem) return null

    const labels = generateLabels().map(label => {
      if (label.includes("(")) return label
      if (label.length === 3) return `${label}(${selectedYear})`
      return label
    })
    
    const chartData = {
      labels,
      datasets: [
        {
          label: `${selectedTrendItem.name}`,
          data: aggregateDataForView(selectedTrendItem.actual),
          borderColor: "#5d4037",
          backgroundColor: "rgba(93, 64, 55, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.3,
        },
      ]
    }

    return (
      <TrendModal
        isOpen={showTrendModal}
        onClose={() => setShowTrendModal(false)}
        item={selectedTrendItem}
        currencyUnit={currencyUnit}
        labels={labels}
        formatValue={formatValue}
        financialYearStart={financialYearStart}
      />
    )
  }

  if (activeSection !== "liquidity-survival") return null

  const generateLabels = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const startMonthIndex = months.indexOf(financialYearStart)
    const orderedMonths = [...months.slice(startMonthIndex), ...months.slice(0, startMonthIndex)]

    if (selectedViewMode === "month") return orderedMonths
    else if (selectedViewMode === "quarter") return ["Q1", "Q2", "Q3", "Q4"]
    else return [selectedYear.toString()]
  }

  const aggregateDataForView = (data) => {
    if (selectedViewMode === "month") return data
    else if (selectedViewMode === "quarter") {
      const quarters = []
      for (let i = 0; i < 4; i++) {
        const sum = data.slice(i * 3, i * 3 + 3).reduce((acc, val) => acc + val, 0)
        quarters.push(sum / 3)
      }
      return quarters
    } else {
      const avg = data.reduce((acc, val) => acc + val, 0) / data.length
      return [avg]
    }
  }

  const formatValue = (value, unit = currencyUnit, decimals = 2) => {
    const num = Number.parseFloat(value) || 0
    switch(unit) {
      case "zar": return `R${num.toLocaleString(undefined, {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}`
      case "zar_thousand": return `R${(num * 1000).toLocaleString(undefined, {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}K`
      case "zar_million": return `R${num.toLocaleString(undefined, {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}m`
      case "zar_billion": return `R${(num / 1000).toLocaleString(undefined, {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}bn`
      default: return `R${num.toLocaleString(undefined, {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}`
    }
  }

  const handleCalculationClick = (title, calculation) => {
    setSelectedCalculation({ title, calculation })
    setShowCalculationModal(true)
  }

  const renderKPICard = (title, dataKey, isPercentage = false, calculation = "", customFormatter = null) => {
    const data = firebaseChartData[dataKey] || { actual: [] }
    const chartData = aggregateDataForView(data.actual)
    const currentValue = chartData.length > 0 ? chartData[chartData.length - 1] : 0
    
    const displayValue = customFormatter 
      ? customFormatter(currentValue) 
      : isPercentage 
        ? `${currentValue.toFixed(2)}%` 
        : dataKey.includes("ratio") 
          ? currentValue.toFixed(2) 
          : formatValue(currentValue)
    
    return (
      <KPICard
        title={title}
        actualValue={currentValue}
        budgetValue={0}
        unit={currencyUnit}
        isPercentage={isPercentage}
        onEyeClick={() => handleCalculationClick(title, calculation)}
        onAddNotes={(notes) => setChartNotes(prev => ({ ...prev, [dataKey]: notes }))}
        onAnalysis={() => setExpandedNotes(prev => ({ ...prev, [`${dataKey}_analysis`]: !prev[`${dataKey}_analysis`] }))}
        onTrend={() => openTrendModal(title, dataKey, isPercentage)}
        notes={chartNotes[dataKey]}
        analysis={chartAnalysis[dataKey]}
        formatValue={formatValue}
        decimals={2}
      />
    )
  }

  const renderLoansTable = () => {
    return (
      <div style={{ marginTop: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ color: "#5d4037", fontSize: "20px", fontWeight: "600" }}>Loan Repayments Schedule</h3>
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
                fontSize: "14px",
              }}
            >
              + Add Loan
            </button>
          )}
        </div>

        {loans.length === 0 ? (
          <div style={{ 
            backgroundColor: "#fdfcfb", 
            padding: "40px", 
            borderRadius: "8px",
            textAlign: "center",
            border: "2px dashed #e8ddd4"
          }}>
            <p style={{ color: "#8d6e63", marginBottom: "15px" }}>No loans added yet.</p>
          </div>
        ) : (
          <div style={{ 
            backgroundColor: "#fdfcfb", 
            padding: "20px", 
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            overflowX: "auto"
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e8ddd4" }}>
                  <th style={{ textAlign: "left", padding: "12px", color: "#5d4037", fontWeight: "600", fontSize: "14px" }}>Loan Name</th>
                  <th style={{ textAlign: "left", padding: "12px", color: "#5d4037", fontWeight: "600", fontSize: "14px" }}>Amount</th>
                  <th style={{ textAlign: "left", padding: "12px", color: "#5d4037", fontWeight: "600", fontSize: "14px" }}>Interest Rate</th>
                  <th style={{ textAlign: "left", padding: "12px", color: "#5d4037", fontWeight: "600", fontSize: "14px" }}>Start Date</th>
                  <th style={{ textAlign: "left", padding: "12px", color: "#5d4037", fontWeight: "600", fontSize: "14px" }}>Term</th>
                  <th style={{ textAlign: "left", padding: "12px", color: "#5d4037", fontWeight: "600", fontSize: "14px" }}>Monthly Payment</th>
                  <th style={{ textAlign: "left", padding: "12px", color: "#5d4037", fontWeight: "600", fontSize: "14px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan, index) => (
                  <tr 
                    key={loan.id} 
                    style={{ 
                      borderBottom: "1px solid #e8ddd4",
                      backgroundColor: index % 2 === 0 ? "#f9f5f2" : "transparent"
                    }}
                  >
                    <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>{loan.name}</td>
                    <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>{formatValue(loan.amount / 1000000)}</td>
                    <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>{loan.interestRate}%</td>
                    <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>{loan.startDate}</td>
                    <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>{loan.term} months</td>
                    <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>{formatValue(loan.monthlyPayment / 1000000)}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        backgroundColor: loan.status === "active" ? "#e8f5e8" : "#f5e8e8",
                        color: loan.status === "active" ? "#2e7d32" : "#c62828"
                      }}>
                        {loan.status === "active" ? "Active" : "Paid Off"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div style={{ 
              marginTop: "20px", 
              padding: "15px", 
              backgroundColor: "#f5f0eb", 
              borderRadius: "6px",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "15px"
            }}>
              <div>
                <div style={{ fontSize: "12px", color: "#8d6e63", marginBottom: "5px" }}>Total Loans</div>
                <div style={{ fontSize: "16px", fontWeight: "600", color: "#5d4037" }}>{loans.length}</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#8d6e63", marginBottom: "5px" }}>Total Outstanding</div>
                <div style={{ fontSize: "16px", fontWeight: "600", color: "#5d4037" }}>
                  {formatValue(loans.reduce((sum, loan) => sum + loan.amount, 0) / 1000000)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#8d6e63", marginBottom: "5px" }}>Monthly Payments</div>
                <div style={{ fontSize: "16px", fontWeight: "600", color: "#5d4037" }}>
                  {formatValue(loans.reduce((sum, loan) => sum + loan.monthlyPayment, 0) / 1000000)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const months = getMonthsForYear(selectedYear, financialYearStart)
  const years = getYearsRange(2021, 2030)

  const calculationTexts = {
    currentRatio: "Current Ratio = Current Assets ÷ Current Liabilities\n\nMeasures ability to pay short-term obligations.\n\nHealthy range: 1.5 - 3.0",
    quickRatio: "Quick Ratio = (Current Assets - Inventory) ÷ Current Liabilities\n\nMeasures ability to pay immediate obligations.\n\nHealthy range: 1.0 - 2.0",
    cashRatio: "Cash Ratio = (Cash + Cash Equivalents) ÷ Current Liabilities\n\nMost conservative liquidity measure.\n\nHealthy range: 0.5 - 1.0",
    burnRate: "Burn Rate = Average monthly cash outflow\n\nHow quickly the company spends cash.\n\nCalculation: (Beginning Cash - Ending Cash) ÷ Months",
    cashCover: "Cash Cover = Cash Balance ÷ Burn Rate\n\nMonths of operation without additional funding.\n\nTarget: > 6 months",
    cashflow: "Free Cashflow = Operating Cashflow - Capital Expenditures\n\nCash available for distribution or reinvestment.",
    monthsRunway: "Months Runway = Cash Balance ÷ Burn Rate\n\nHow many months the company can operate at current burn rate.\n\nTarget: > 12 months",
    workingCapital: "Working Capital = Current Assets - Current Liabilities\n\nLiquidity available for day-to-day operations.",
  }

  return (
    <div style={{ paddingTop: "20px" }}>
      <KeyQuestionBox
        question="Will the business survive a shock? Do we have enough liquidity to weather a downturn?"
        signals="Cash runway, burn rate, current ratio"
        decisions="Cut burn rate, raise capital, slow growth, optimize working capital"
        section="liquidity-survival"
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "15px",
        }}
      >
        <h2 style={{ color: "#5d4037", fontSize: "24px", fontWeight: "700" }}>Liquidity & Survival</h2>

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
                  <option key={year} value={year}>{year}</option>
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
                  <option key={month} value={month}>{month}</option>
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
                fontSize: "14px",
              }}
            >
              Add Data
            </button>
          )}
        </div>
      </div>

      {/* Liquidity Ratios - 3 per row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
        {renderKPICard("Current Ratio", "currentRatio", false, calculationTexts.currentRatio)}
        {renderKPICard("Quick Ratio", "quickRatio", false, calculationTexts.quickRatio)}
        {renderKPICard("Cash Ratio", "cashRatio", false, calculationTexts.cashRatio)}
      </div>

      {/* Cash Flow Metrics - 3 per row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
        {renderKPICard("Burn Rate", "burnRate", false, calculationTexts.burnRate)}
        {renderKPICard("Cash Cover", "cashCover", false, calculationTexts.cashCover)}
        {renderKPICard("Free Cashflow", "cashflow", false, calculationTexts.cashflow)}
        {renderKPICard("Cash Balance", "cashBalance", false)}
        {renderKPICard("Months Runway", "monthsRunway", false, calculationTexts.monthsRunway, (v) => `${v.toFixed(1)} months`)}
        {renderKPICard("Working Capital", "workingCapital", false, calculationTexts.workingCapital)}
      </div>

      {/* Loan Repayments Table */}
      {renderLoansTable()}

      {/* Universal Add Data Modal */}
      <UniversalAddDataModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentTab="liquidity-survival"
        user={user}
        onSave={() => {
          loadLiquidityDataFromFirebase()
          loadLoans()
        }}
        loading={loading}
        financialYearStart={financialYearStart}
      />

      {/* Calculation Modal */}
      <CalculationModal
        isOpen={showCalculationModal}
        onClose={() => setShowCalculationModal(false)}
        title={selectedCalculation.title}
        calculation={selectedCalculation.calculation}
      />

      {/* Trend Modal */}
      {showTrendModal && renderTrendModal()}
    </div>
  )
}

// ==================== MAIN FINANCIAL PERFORMANCE COMPONENT ====================

const FinancialPerformance = () => {
  const [activeSection, setActiveSection] = useState("capital-structure")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [user, setUser] = useState(null)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [financialYearStart, setFinancialYearStart] = useState("Jan")

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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (isInvestorView && viewingSMEId) {
        setUser({ uid: viewingSMEId })
        // Get financial year start for the viewed SME
        const fyStart = await getFinancialYearStart(viewingSMEId)
        setFinancialYearStart(fyStart)
      } else if (currentUser) {
        setUser(currentUser)
        // Get financial year start for the logged-in user
        const fyStart = await getFinancialYearStart(currentUser.uid)
        setFinancialYearStart(fyStart)
      } else {
        setUser(null)
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
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] })
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
    { id: "capital-structure", label: "Capital Structure" },
    { id: "performance-engine", label: "Performance Engine" },
    { id: "cost-agility", label: "Cost Agility" },
    { id: "liquidity-survival", label: "Liquidity & Survival" },
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
                Investor View: Viewing {viewingSMEName}'s Financial Performance
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
              onMouseEnter={(e) => { e.target.style.backgroundColor = "#45a049" }}
              onMouseLeave={(e) => { e.target.style.backgroundColor = "#4caf50" }}
            >
              Back to My Cohorts
            </button>
          </div>
        )}

        <div style={{ padding: "20px", paddingTop: "40px", marginLeft: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h1 style={{ color: "#5d4037", fontSize: "32px", fontWeight: "700", margin: 0 }}>
              Financial Performance
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
                      <li>Assesses solvency, liquidity, and financial survivability</li>
                      <li>Evaluates capital structure quality and financial risk</li>
                      <li>Monitors cash runway and burn rate for survival planning</li>
                      <li>Tests cost agility and ability to flex under pressure</li>
                      <li>Measures performance engine health and margin sustainability</li>
                    </ul>
                  </div>

                  <div>
                    <h3 style={{ color: "#7d5a50", marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>
                      What this dashboard does NOT do
                    </h3>
                    <ul style={{ color: "#4a352f", fontSize: "14px", lineHeight: "1.7", margin: 0, paddingLeft: "20px" }}>
                      <li>Bookkeeping, invoicing, or payments processing</li>
                      <li>Payroll management or accounting automation</li>
                      <li>Tax compliance or audit preparation</li>
                      <li>Regulatory reporting or statutory filings</li>
                      <li>Operational transaction processing</li>
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

        <CapitalStructure
          activeSection={activeSection}
          viewMode="month"
          user={user}
          isInvestorView={isInvestorView}
          isEmbedded={true}
          financialYearStart={financialYearStart}
        />

        <PerformanceEngine
          activeSection={activeSection}
          viewMode="month"
          financialYearStart={financialYearStart}
          pnlData={null}
          user={user}
          onUpdateChartData={() => {}}
          isInvestorView={isInvestorView}
        />

        <CostAgility
          activeSection={activeSection}
          user={user}
          isInvestorView={isInvestorView}
          financialYearStart={financialYearStart}
        />

        <LiquiditySurvival
          activeSection={activeSection}
          user={user}
          isInvestorView={isInvestorView}
          financialYearStart={financialYearStart}
        />
      </div>
    </div>
  )
}

export default FinancialPerformance