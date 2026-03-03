"use client"

import { useState, useEffect } from "react"
import { Bar, Pie, Line } from "react-chartjs-2"
import { doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, deleteDoc } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"
import { onAuthStateChanged } from "firebase/auth"
import Sidebar from "smses/Sidebar/Sidebar"
import { Info, ChevronDown, ChevronUp, Upload, X, Calendar } from "lucide-react"
import Header from "../DashboardHeader/DashboardHeader"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend)

// ==================== HELPER FUNCTIONS ====================

const getMonthsForYear = (year, financialYearStart = "Jan") => {
  const allMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const startIndex = allMonths.indexOf(financialYearStart)
  if (startIndex === -1) return allMonths
  
  return [...allMonths.slice(startIndex), ...allMonths.slice(0, startIndex)]
}

const formatNumber = (value) => {
  const num = Number.parseFloat(value) || 0
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toFixed(2)
}

const formatCurrency = (value) => {
  const num = Number.parseFloat(value) || 0
  if (num >= 1e9) return `R${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `R${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `R${(num / 1e3).toFixed(2)}K`
  return `R${num.toFixed(2)}`
}

const formatPercentage = (value) => {
  const num = Number.parseFloat(value) || 0
  return `${num.toFixed(1)}%`
}

const getMonthIndex = (month) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return months.indexOf(month)
}

// Circle colors - Orange and Green with better visibility
const circleColors = [
  { border: "#FF8C00", background: "#FFB347", text: "#663d00" }, // Orange
  { border: "#32CD32", background: "#90EE90", text: "#1e4d1e" }, // Light Green
  { border: "#FFA500", background: "#FFD700", text: "#664d00" }, // Orange/Gold
  { border: "#228B22", background: "#98FB98", text: "#145214" }, // Forest Green
  { border: "#FF6347", background: "#FFA07A", text: "#8b3a2b" }, // Tomato/Light Salmon
  { border: "#2E8B57", background: "#66CDAA", text: "#1e4d33" }, // Sea Green
  { border: "#FF8C69", background: "#FFB6C1", text: "#8b4d39" }, // Coral/Light Pink
  { border: "#006400", background: "#ADFF2F", text: "#003300" }, // Dark Green/Green Yellow
]

// ==================== DATE RANGE PICKER COMPONENT ====================

const DateRangePicker = ({ startDate, endDate, onStartDateChange, onEndDateChange }) => {
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)
  const [startPickerYear, setStartPickerYear] = useState(startDate?.year || new Date().getFullYear())
  const [endPickerYear, setEndPickerYear] = useState(endDate?.year || new Date().getFullYear())
  
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "center", position: "relative" }}>
      {/* Start Date Picker */}
      <div style={{ position: "relative" }}>
        <div
          onClick={() => setShowStartPicker(!showStartPicker)}
          style={{
            padding: "8px 16px",
            backgroundColor: "#fdfcfb",
            border: "1px solid #5d4037",
            borderRadius: "4px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            minWidth: "120px",
            justifyContent: "space-between",
          }}
        >
          <span style={{ color: "#5d4037", fontSize: "14px" }}>
            {startDate ? `${startDate.month} ${startDate.year}` : "Start Date"}
          </span>
          <Calendar size={16} color="#5d4037" />
        </div>

        {showStartPicker && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              marginTop: "4px",
              backgroundColor: "#fdfcfb",
              border: "1px solid #5d4037",
              borderRadius: "4px",
              zIndex: 1000,
              minWidth: "200px",
              maxHeight: "300px",
              overflow: "auto",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            {years.map((year) => (
              <div key={year}>
                <div
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#5d4037",
                    color: "#fdfcfb",
                    fontWeight: "600",
                    fontSize: "13px",
                  }}
                >
                  {year}
                </div>
                {months.map((month) => (
                  <div
                    key={`${year}-${month}`}
                    onClick={() => {
                      onStartDateChange({ year, month })
                      setShowStartPicker(false)
                    }}
                    style={{
                      padding: "8px 12px 8px 24px",
                      cursor: "pointer",
                      backgroundColor: startDate?.year === year && startDate?.month === month ? "#e8ddd4" : "transparent",
                      color: "#5d4037",
                      fontSize: "13px",
                      borderBottom: "1px solid #e8ddd4",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f0eb"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 
                      startDate?.year === year && startDate?.month === month ? "#e8ddd4" : "transparent"
                    }
                  >
                    {month}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <span style={{ color: "#5d4037", fontSize: "14px" }}>to</span>

      {/* End Date Picker */}
      <div style={{ position: "relative" }}>
        <div
          onClick={() => setShowEndPicker(!showEndPicker)}
          style={{
            padding: "8px 16px",
            backgroundColor: "#fdfcfb",
            border: "1px solid #5d4037",
            borderRadius: "4px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            minWidth: "120px",
            justifyContent: "space-between",
          }}
        >
          <span style={{ color: "#5d4037", fontSize: "14px" }}>
            {endDate ? `${endDate.month} ${endDate.year}` : "End Date"}
          </span>
          <Calendar size={16} color="#5d4037" />
        </div>

        {showEndPicker && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              marginTop: "4px",
              backgroundColor: "#fdfcfb",
              border: "1px solid #5d4037",
              borderRadius: "4px",
              zIndex: 1000,
              minWidth: "200px",
              maxHeight: "300px",
              overflow: "auto",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            {years.map((year) => (
              <div key={year}>
                <div
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#5d4037",
                    color: "#fdfcfb",
                    fontWeight: "600",
                    fontSize: "13px",
                  }}
                >
                  {year}
                </div>
                {months.map((month) => (
                  <div
                    key={`${year}-${month}`}
                    onClick={() => {
                      onEndDateChange({ year, month })
                      setShowEndPicker(false)
                    }}
                    style={{
                      padding: "8px 12px 8px 24px",
                      cursor: "pointer",
                      backgroundColor: endDate?.year === year && endDate?.month === month ? "#e8ddd4" : "transparent",
                      color: "#5d4037",
                      fontSize: "13px",
                      borderBottom: "1px solid #e8ddd4",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f0eb"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 
                      endDate?.year === year && endDate?.month === month ? "#e8ddd4" : "transparent"
                    }
                  >
                    {month}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== COMPONENTS ====================

const EyeIcon = ({ onClick, title, color = "#5d4037" }) => (
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
      border: `2px solid ${color}`,
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
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="2"></circle>
      <circle cx="12" cy="12" r="5" strokeOpacity="0.5"></circle>
      <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z"></path>
    </svg>
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

const TrendModal = ({ isOpen, onClose, title, data, labels, isPercentage }) => {
  if (!isOpen || !data) return null

  // Format labels to show month and year
  const formattedLabels = labels.map(label => {
    if (label.includes(" ")) return label
    const month = label.substring(0, 3)
    const year = label.length > 3 ? label.substring(3) : new Date().getFullYear()
    return `${month} ${year}`
  })

  const chartData = {
    labels: formattedLabels,
    datasets: [
      {
        label: title,
        data: data,
        borderColor: "#5d4037",
        backgroundColor: "rgba(93, 64, 55, 0.1)",
        borderWidth: 3,
        fill: true,
        tension: 0.3,
      },
    ]
  }

  const validData = data.filter(v => !isNaN(parseFloat(v)) && parseFloat(v) !== 0)
  const currentValue = validData.length > 0 ? validData[validData.length - 1] : 0
  const averageValue = validData.length > 0 
    ? validData.reduce((a, b) => a + parseFloat(b), 0) / validData.length 
    : 0
  
  let trend = "N/A"
  if (validData.length >= 2) {
    const last = parseFloat(validData[validData.length - 1])
    const prev = parseFloat(validData[validData.length - 2])
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
          <h3 style={{ color: "#5d4037", margin: 0 }}>{title} - Trend Analysis</h3>
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
                datalabels: { display: false },
                legend: { display: true, position: "top" },
                title: { display: false },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const value = context.raw
                      return isPercentage
                        ? `${context.dataset.label}: ${parseFloat(value).toFixed(2)}%`
                        : `${context.dataset.label}: ${formatCurrency(value)}`
                    },
                  },
                },
              },
              scales: {
                y: { 
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: isPercentage ? "Percentage (%)" : "Value (R)",
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
                {isPercentage ? `${parseFloat(currentValue).toFixed(1)}%` : formatCurrency(currentValue)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#8d6e63", marginBottom: "5px" }}>Average</div>
              <div style={{ fontSize: "16px", fontWeight: "600", color: "#5d4037" }}>
                {isPercentage ? `${parseFloat(averageValue).toFixed(1)}%` : formatCurrency(averageValue)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#8d6e63", marginBottom: "5px" }}>Trend</div>
              <div style={{ fontSize: "16px", fontWeight: "600", color: "#5d4037" }}>{trend}</div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#8d6e63", marginBottom: "5px" }}>Data Points</div>
              <div style={{ fontSize: "16px", fontWeight: "600", color: "#5d4037" }}>{validData.length}</div>
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

// ==================== UNIVERSAL ADD DATA MODAL ====================

const UniversalAddDataModal = ({ 
  isOpen, 
  onClose, 
  currentTab,
  user,
  onSave,
  loading,
  initialData = {}
}) => {
  const [activeTab, setActiveTab] = useState(currentTab)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  
  const tabs = [
    { id: "pipeline-visibility", label: "Pipeline Visibility" },
    { id: "pipeline-sufficiency", label: "Pipeline Sufficiency" },
    { id: "revenue-concentration", label: "Revenue Concentration" },
    { id: "demand-sustainability", label: "Demand Sustainability" },
    { id: "pipeline-table", label: "Pipeline Table" }
  ]
  
  // Pipeline Visibility Data (Now with Conversion Rates)
  const [pipelineVisibilityData, setPipelineVisibilityData] = useState({
    newLeads: Array(12).fill(""),
    salesVelocity: Array(12).fill(""),
    conversionRates: Array(12).fill(""),
    notes: "",
  })

  // Pipeline Sufficiency Data
  const [pipelineSufficiencyData, setPipelineSufficiencyData] = useState({
    totalPipelineValue: "",
    probability: "",
    targetRevenue: "",
    notes: "",
  })

  // Revenue Concentration Data
  const [revenueConcentrationData, setRevenueConcentrationData] = useState({
    revenueChannels: [
      { name: "Social Media", revenue: "", spend: "" },
      { name: "Email", revenue: "", spend: "" },
      { name: "PPC", revenue: "", spend: "" },
      { name: "SEO", revenue: "", spend: "" },
      { name: "Referral", revenue: "", spend: "" },
      { name: "Direct", revenue: "", spend: "" }
    ],
    customerSegments: [
      { name: "Enterprise", revenue: "", customerCount: "" },
      { name: "SMB", revenue: "", customerCount: "" },
      { name: "Startup", revenue: "", customerCount: "" },
      { name: "Non-Profit", revenue: "", customerCount: "" },
      { name: "Education", revenue: "", customerCount: "" }
    ],
    revenueByCustomer: [],
    notes: "",
  })

  // Demand Sustainability Data
  const [demandSustainabilityData, setDemandSustainabilityData] = useState({
    repeatCustomerRate: "",
    churnRate: "",
    campaigns: [
      { name: "Q1 Campaign", cost: "", revenue: "" },
      { name: "Q2 Campaign", cost: "", revenue: "" },
      { name: "Summer Sale", cost: "", revenue: "" },
      { name: "Holiday Campaign", cost: "", revenue: "" }
    ],
    notes: "",
  })

  // Pipeline Table Data
  const [pipelineDealData, setPipelineDealData] = useState({
    clientName: "",
    segment: "",
    stage: "initial-contact",
    probability: "",
    expectedClose: "",
    dealValue: "",
    source: "",
    owner: "",
    establishedStartDate: "",
    expectedOnboardingDate: "",
    signedDate: "",
  })

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const years = Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i)

  useEffect(() => {
    if (isOpen && user) {
      loadDataForTab(activeTab)
    }
  }, [isOpen, activeTab, user, selectedYear])

  const loadDataForTab = async (tabId) => {
    try {
      switch(tabId) {
        case "pipeline-visibility":
          const visibilityDoc = await getDoc(doc(db, "pipelineData", `${user.uid}_visibility_${selectedYear}`))
          if (visibilityDoc.exists()) {
            const data = visibilityDoc.data()
            setPipelineVisibilityData({
              newLeads: data.newLeads?.map(String) || Array(12).fill(""),
              salesVelocity: data.salesVelocity?.map(String) || Array(12).fill(""),
              conversionRates: data.conversionRates?.map(String) || Array(12).fill(""),
              notes: data.notes || "",
            })
          }
          break
        case "pipeline-sufficiency":
          const sufficiencyDoc = await getDoc(doc(db, "pipelineData", `${user.uid}_sufficiency_${selectedYear}`))
          if (sufficiencyDoc.exists()) {
            const data = sufficiencyDoc.data()
            setPipelineSufficiencyData({
              totalPipelineValue: data.totalPipelineValue?.toString() || "",
              probability: data.probability?.toString() || "",
              targetRevenue: data.targetRevenue?.toString() || "",
              notes: data.notes || "",
            })
          }
          break
        case "revenue-concentration":
          const concentrationDoc = await getDoc(doc(db, "pipelineData", `${user.uid}_concentration_${selectedYear}`))
          if (concentrationDoc.exists()) {
            const data = concentrationDoc.data()
            setRevenueConcentrationData({
              revenueChannels: data.revenueChannels || [
                { name: "Social Media", revenue: "", spend: "" },
                { name: "Email", revenue: "", spend: "" },
                { name: "PPC", revenue: "", spend: "" },
                { name: "SEO", revenue: "", spend: "" },
                { name: "Referral", revenue: "", spend: "" },
                { name: "Direct", revenue: "", spend: "" }
              ],
              customerSegments: data.customerSegments || [
                { name: "Enterprise", revenue: "", customerCount: "" },
                { name: "SMB", revenue: "", customerCount: "" },
                { name: "Startup", revenue: "", customerCount: "" },
                { name: "Non-Profit", revenue: "", customerCount: "" },
                { name: "Education", revenue: "", customerCount: "" }
              ],
              revenueByCustomer: data.revenueByCustomer || [],
              notes: data.notes || "",
            })
          }
          break
        case "demand-sustainability":
          const sustainabilityDoc = await getDoc(doc(db, "pipelineData", `${user.uid}_sustainability_${selectedYear}`))
          if (sustainabilityDoc.exists()) {
            const data = sustainabilityDoc.data()
            setDemandSustainabilityData({
              repeatCustomerRate: data.repeatCustomerRate?.toString() || "",
              churnRate: data.churnRate?.toString() || "",
              campaigns: data.campaigns || [
                { name: "Q1 Campaign", cost: "", revenue: "" },
                { name: "Q2 Campaign", cost: "", revenue: "" },
                { name: "Summer Sale", cost: "", revenue: "" },
                { name: "Holiday Campaign", cost: "", revenue: "" }
              ],
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
      switch(activeTab) {
        case "pipeline-visibility":
          await setDoc(doc(db, "pipelineData", `${user.uid}_visibility_${selectedYear}`), {
            userId: user.uid,
            year: selectedYear,
            newLeads: pipelineVisibilityData.newLeads.map(v => Number.parseFloat(v) || 0),
            salesVelocity: pipelineVisibilityData.salesVelocity.map(v => Number.parseFloat(v) || 0),
            conversionRates: pipelineVisibilityData.conversionRates.map(v => Number.parseFloat(v) || 0),
            notes: pipelineVisibilityData.notes,
            lastUpdated: new Date().toISOString(),
          })
          break
        case "pipeline-sufficiency":
          await setDoc(doc(db, "pipelineData", `${user.uid}_sufficiency_${selectedYear}`), {
            userId: user.uid,
            year: selectedYear,
            totalPipelineValue: Number.parseFloat(pipelineSufficiencyData.totalPipelineValue) || 0,
            probability: Number.parseFloat(pipelineSufficiencyData.probability) || 0,
            targetRevenue: Number.parseFloat(pipelineSufficiencyData.targetRevenue) || 0,
            notes: pipelineSufficiencyData.notes,
            lastUpdated: new Date().toISOString(),
          })
          break
        case "revenue-concentration":
          await setDoc(doc(db, "pipelineData", `${user.uid}_concentration_${selectedYear}`), {
            userId: user.uid,
            year: selectedYear,
            revenueChannels: revenueConcentrationData.revenueChannels.map(c => ({
              name: c.name,
              revenue: Number.parseFloat(c.revenue) || 0,
              spend: Number.parseFloat(c.spend) || 0
            })),
            customerSegments: revenueConcentrationData.customerSegments.map(s => ({
              name: s.name,
              revenue: Number.parseFloat(s.revenue) || 0,
              customerCount: Number.parseFloat(s.customerCount) || 0
            })),
            revenueByCustomer: revenueConcentrationData.revenueByCustomer,
            notes: revenueConcentrationData.notes,
            lastUpdated: new Date().toISOString(),
          })
          break
        case "demand-sustainability":
          await setDoc(doc(db, "pipelineData", `${user.uid}_sustainability_${selectedYear}`), {
            userId: user.uid,
            year: selectedYear,
            repeatCustomerRate: Number.parseFloat(demandSustainabilityData.repeatCustomerRate) || 0,
            churnRate: Number.parseFloat(demandSustainabilityData.churnRate) || 0,
            campaigns: demandSustainabilityData.campaigns.map(c => ({
              name: c.name,
              cost: Number.parseFloat(c.cost) || 0,
              revenue: Number.parseFloat(c.revenue) || 0
            })),
            notes: demandSustainabilityData.notes,
            lastUpdated: new Date().toISOString(),
          })
          break
        case "pipeline-table":
          if (!pipelineDealData.clientName || !pipelineDealData.dealValue) {
            alert("Please fill in required fields")
            return
          }
          const riskAdjustedValue = (Number.parseFloat(pipelineDealData.dealValue) * Number.parseFloat(pipelineDealData.probability) / 100) || 0
          
          // Use subcollection for deals
          const dealsRef = collection(db, "users", user.uid, "pipelineDeals")
          await addDoc(dealsRef, {
            year: selectedYear,
            ...pipelineDealData,
            probability: Number.parseFloat(pipelineDealData.probability) || 0,
            dealValue: Number.parseFloat(pipelineDealData.dealValue) || 0,
            riskAdjustedValue,
            createdAt: new Date().toISOString(),
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

  const renderMonthlyInputs = (label, dataArray, setDataArray, options = {}) => {
    const { step = "0.01", unit = "" } = options
    
    return (
      <div style={{ 
        marginBottom: "20px",
        display: "grid",
        gridTemplateColumns: "repeat(12, 1fr)",
        gap: "5px",
      }}>
        {months.map((month, idx) => (
          <div key={month}>
            <label style={{ fontSize: "10px", color: "#8d6e63", display: "block", marginBottom: "2px" }}>
              {month}
            </label>
            <input
              type="number"
              step={step}
              value={dataArray[idx] || ""}
              onChange={(e) => {
                const newArray = [...dataArray]
                newArray[idx] = e.target.value
                setDataArray(newArray)
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
          </div>
        ))}
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
          <h3 style={{ color: "#5d4037", margin: 0 }}>Add Marketing & Sales Data</h3>
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
        <div style={{ 
          display: "flex", 
          gap: "5px", 
          marginBottom: "20px",
          flexWrap: "wrap",
          borderBottom: "2px solid #e8ddd4",
          paddingBottom: "10px"
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 20px",
                backgroundColor: activeTab === tab.id ? "#5d4037" : "#e8ddd4",
                color: activeTab === tab.id ? "#fdfcfb" : "#5d4037",
                border: "none",
                borderRadius: "6px 6px 0 0",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                transition: "all 0.3s ease",
                marginBottom: "-2px",
                borderBottom: activeTab === tab.id ? "2px solid #5d4037" : "2px solid transparent",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Year Selection */}
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
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Pipeline Visibility */}
        {activeTab === "pipeline-visibility" && (
          <div>
            <h4 style={{ color: "#5d4037", marginBottom: "20px" }}>Pipeline Visibility Data</h4>
            
            <h5 style={{ color: "#5d4037", marginBottom: "15px", fontWeight: "600" }}>New Leads</h5>
            {renderMonthlyInputs("New Leads", pipelineVisibilityData.newLeads, (val) => 
              setPipelineVisibilityData({...pipelineVisibilityData, newLeads: val}), { unit: "leads", step: "1" })}
            
            <h5 style={{ color: "#5d4037", marginBottom: "15px", fontWeight: "600" }}>Sales Velocity (Days to Close)</h5>
            {renderMonthlyInputs("Sales Velocity", pipelineVisibilityData.salesVelocity, (val) => 
              setPipelineVisibilityData({...pipelineVisibilityData, salesVelocity: val}), { unit: "days", step: "1" })}

            <h5 style={{ color: "#5d4037", marginBottom: "15px", fontWeight: "600" }}>Conversion Rates (%)</h5>
            {renderMonthlyInputs("Conversion Rates", pipelineVisibilityData.conversionRates, (val) => 
              setPipelineVisibilityData({...pipelineVisibilityData, conversionRates: val}), { unit: "%", step: "0.1" })}
            
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>Notes:</label>
              <textarea
                value={pipelineVisibilityData.notes}
                onChange={(e) => setPipelineVisibilityData({...pipelineVisibilityData, notes: e.target.value})}
                placeholder="Add any additional notes..."
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

        {/* Pipeline Sufficiency */}
        {activeTab === "pipeline-sufficiency" && (
          <div>
            <h4 style={{ color: "#5d4037", marginBottom: "20px" }}>Pipeline Sufficiency Data</h4>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "30px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#5d4037", fontWeight: "600" }}>Total Pipeline Value (R)</label>
                <input
                  type="number"
                  value={pipelineSufficiencyData.totalPipelineValue}
                  onChange={(e) => setPipelineSufficiencyData({...pipelineSufficiencyData, totalPipelineValue: e.target.value})}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #e8ddd4" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#5d4037", fontWeight: "600" }}>Overall Probability (%)</label>
                <input
                  type="number"
                  value={pipelineSufficiencyData.probability}
                  onChange={(e) => setPipelineSufficiencyData({...pipelineSufficiencyData, probability: e.target.value})}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #e8ddd4" }}
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#5d4037", fontWeight: "600" }}>Target Revenue (R)</label>
                <input
                  type="number"
                  value={pipelineSufficiencyData.targetRevenue}
                  onChange={(e) => setPipelineSufficiencyData({...pipelineSufficiencyData, targetRevenue: e.target.value})}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #e8ddd4" }}
                />
              </div>
            </div>
            
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>Notes:</label>
              <textarea
                value={pipelineSufficiencyData.notes}
                onChange={(e) => setPipelineSufficiencyData({...pipelineSufficiencyData, notes: e.target.value})}
                placeholder="Add any additional notes..."
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

        {/* Revenue Concentration */}
        {activeTab === "revenue-concentration" && (
          <div>
            <h4 style={{ color: "#5d4037", marginBottom: "20px" }}>Revenue Concentration Data</h4>
            
            <h5 style={{ color: "#5d4037", marginBottom: "15px", fontWeight: "600" }}>Revenue by Channel</h5>
            {revenueConcentrationData.revenueChannels.map((channel, index) => (
              <div key={index} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                <input
                  type="text"
                  value={channel.name}
                  onChange={(e) => {
                    const newChannels = [...revenueConcentrationData.revenueChannels]
                    newChannels[index].name = e.target.value
                    setRevenueConcentrationData({...revenueConcentrationData, revenueChannels: newChannels})
                  }}
                  style={{ padding: "8px", borderRadius: "4px", border: "1px solid #e8ddd4" }}
                />
                <input
                  type="number"
                  value={channel.revenue}
                  onChange={(e) => {
                    const newChannels = [...revenueConcentrationData.revenueChannels]
                    newChannels[index].revenue = e.target.value
                    setRevenueConcentrationData({...revenueConcentrationData, revenueChannels: newChannels})
                  }}
                  placeholder="Revenue (R)"
                  style={{ padding: "8px", borderRadius: "4px", border: "1px solid #e8ddd4" }}
                />
                <input
                  type="number"
                  value={channel.spend}
                  onChange={(e) => {
                    const newChannels = [...revenueConcentrationData.revenueChannels]
                    newChannels[index].spend = e.target.value
                    setRevenueConcentrationData({...revenueConcentrationData, revenueChannels: newChannels})
                  }}
                  placeholder="Marketing Spend (R)"
                  style={{ padding: "8px", borderRadius: "4px", border: "1px solid #e8ddd4" }}
                />
              </div>
            ))}
            
            <h5 style={{ color: "#5d4037", marginTop: "30px", marginBottom: "15px", fontWeight: "600" }}>Customer Segments</h5>
            {revenueConcentrationData.customerSegments.map((segment, index) => (
              <div key={index} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                <input
                  type="text"
                  value={segment.name}
                  onChange={(e) => {
                    const newSegments = [...revenueConcentrationData.customerSegments]
                    newSegments[index].name = e.target.value
                    setRevenueConcentrationData({...revenueConcentrationData, customerSegments: newSegments})
                  }}
                  style={{ padding: "8px", borderRadius: "4px", border: "1px solid #e8ddd4" }}
                />
                <input
                  type="number"
                  value={segment.revenue}
                  onChange={(e) => {
                    const newSegments = [...revenueConcentrationData.customerSegments]
                    newSegments[index].revenue = e.target.value
                    setRevenueConcentrationData({...revenueConcentrationData, customerSegments: newSegments})
                  }}
                  placeholder="Revenue (R)"
                  style={{ padding: "8px", borderRadius: "4px", border: "1px solid #e8ddd4" }}
                />
                <input
                  type="number"
                  value={segment.customerCount}
                  onChange={(e) => {
                    const newSegments = [...revenueConcentrationData.customerSegments]
                    newSegments[index].customerCount = e.target.value
                    setRevenueConcentrationData({...revenueConcentrationData, customerSegments: newSegments})
                  }}
                  placeholder="# Customers"
                  style={{ padding: "8px", borderRadius: "4px", border: "1px solid #e8ddd4" }}
                />
              </div>
            ))}
            
            <div style={{ marginBottom: "20px", marginTop: "30px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>Notes:</label>
              <textarea
                value={revenueConcentrationData.notes}
                onChange={(e) => setRevenueConcentrationData({...revenueConcentrationData, notes: e.target.value})}
                placeholder="Add any additional notes..."
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

        {/* Demand Sustainability */}
        {activeTab === "demand-sustainability" && (
          <div>
            <h4 style={{ color: "#5d4037", marginBottom: "20px" }}>Demand Sustainability Data</h4>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "30px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#5d4037", fontWeight: "600" }}>Repeat Customer Rate (%)</label>
                <input
                  type="number"
                  value={demandSustainabilityData.repeatCustomerRate}
                  onChange={(e) => setDemandSustainabilityData({...demandSustainabilityData, repeatCustomerRate: e.target.value})}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #e8ddd4" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#5d4037", fontWeight: "600" }}>Churn Rate (%)</label>
                <input
                  type="number"
                  value={demandSustainabilityData.churnRate}
                  onChange={(e) => setDemandSustainabilityData({...demandSustainabilityData, churnRate: e.target.value})}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #e8ddd4" }}
                />
              </div>
            </div>
            
            <h5 style={{ color: "#5d4037", marginBottom: "15px", fontWeight: "600" }}>Campaigns</h5>
            {demandSustainabilityData.campaigns.map((campaign, index) => (
              <div key={index} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                <input
                  type="text"
                  value={campaign.name}
                  onChange={(e) => {
                    const newCampaigns = [...demandSustainabilityData.campaigns]
                    newCampaigns[index].name = e.target.value
                    setDemandSustainabilityData({...demandSustainabilityData, campaigns: newCampaigns})
                  }}
                  style={{ padding: "8px", borderRadius: "4px", border: "1px solid #e8ddd4" }}
                />
                <input
                  type="number"
                  value={campaign.cost}
                  onChange={(e) => {
                    const newCampaigns = [...demandSustainabilityData.campaigns]
                    newCampaigns[index].cost = e.target.value
                    setDemandSustainabilityData({...demandSustainabilityData, campaigns: newCampaigns})
                  }}
                  placeholder="Cost (R)"
                  style={{ padding: "8px", borderRadius: "4px", border: "1px solid #e8ddd4" }}
                />
                <input
                  type="number"
                  value={campaign.revenue}
                  onChange={(e) => {
                    const newCampaigns = [...demandSustainabilityData.campaigns]
                    newCampaigns[index].revenue = e.target.value
                    setDemandSustainabilityData({...demandSustainabilityData, campaigns: newCampaigns})
                  }}
                  placeholder="Revenue (R)"
                  style={{ padding: "8px", borderRadius: "4px", border: "1px solid #e8ddd4" }}
                />
              </div>
            ))}
            
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>Notes:</label>
              <textarea
                value={demandSustainabilityData.notes}
                onChange={(e) => setDemandSustainabilityData({...demandSustainabilityData, notes: e.target.value})}
                placeholder="Add any additional notes..."
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

        {/* Pipeline Table */}
        {activeTab === "pipeline-table" && (
          <div style={{ padding: "20px" }}>
            <h4 style={{ color: "#5d4037", marginBottom: "20px" }}>Add New Deal</h4>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#5d4037", fontWeight: "600" }}>Client / Deal *</label>
                <input
                  type="text"
                  value={pipelineDealData.clientName}
                  onChange={(e) => setPipelineDealData({...pipelineDealData, clientName: e.target.value})}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #e8ddd4" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#5d4037", fontWeight: "600" }}>Customer Segment</label>
                <input
                  type="text"
                  value={pipelineDealData.segment}
                  onChange={(e) => setPipelineDealData({...pipelineDealData, segment: e.target.value})}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #e8ddd4" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#5d4037", fontWeight: "600" }}>Stage</label>
                <select
                  value={pipelineDealData.stage}
                  onChange={(e) => setPipelineDealData({...pipelineDealData, stage: e.target.value})}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #e8ddd4" }}
                >
                  <option value="initial-contact">Initial Contact</option>
                  <option value="qualification">Qualification</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="closed-won">Closed Won</option>
                  <option value="closed-lost">Closed Lost</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#5d4037", fontWeight: "600" }}>Probability (%)</label>
                <input
                  type="number"
                  value={pipelineDealData.probability}
                  onChange={(e) => setPipelineDealData({...pipelineDealData, probability: e.target.value})}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #e8ddd4" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#5d4037", fontWeight: "600" }}>Expected Close</label>
                <input
                  type="date"
                  value={pipelineDealData.expectedClose}
                  onChange={(e) => setPipelineDealData({...pipelineDealData, expectedClose: e.target.value})}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #e8ddd4" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#5d4037", fontWeight: "600" }}>Deal Value (R) *</label>
                <input
                  type="number"
                  value={pipelineDealData.dealValue}
                  onChange={(e) => setPipelineDealData({...pipelineDealData, dealValue: e.target.value})}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #e8ddd4" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#5d4037", fontWeight: "600" }}>Source</label>
                <input
                  type="text"
                  value={pipelineDealData.source}
                  onChange={(e) => setPipelineDealData({...pipelineDealData, source: e.target.value})}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #e8ddd4" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#5d4037", fontWeight: "600" }}>Owner</label>
                <input
                  type="text"
                  value={pipelineDealData.owner}
                  onChange={(e) => setPipelineDealData({...pipelineDealData, owner: e.target.value})}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #e8ddd4" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#5d4037", fontWeight: "600" }}>Established Start Date</label>
                <input
                  type="date"
                  value={pipelineDealData.establishedStartDate}
                  onChange={(e) => setPipelineDealData({...pipelineDealData, establishedStartDate: e.target.value})}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #e8ddd4" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#5d4037", fontWeight: "600" }}>Expected Onboarding</label>
                <input
                  type="date"
                  value={pipelineDealData.expectedOnboardingDate}
                  onChange={(e) => setPipelineDealData({...pipelineDealData, expectedOnboardingDate: e.target.value})}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #e8ddd4" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#5d4037", fontWeight: "600" }}>Signed Date</label>
                <input
                  type="date"
                  value={pipelineDealData.signedDate}
                  onChange={(e) => setPipelineDealData({...pipelineDealData, signedDate: e.target.value})}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #e8ddd4" }}
                />
              </div>
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

// ==================== PIPELINE TABLE COMPONENT ====================

const PipelineTable = ({ currentUser, isInvestorView, selectedYear, onAddData }) => {
  const [deals, setDeals] = useState([])
  const [filteredDeals, setFilteredDeals] = useState([])
  const [loading, setLoading] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState({ show: false, dealId: null })
  
  // Filter states
  const [filters, setFilters] = useState({
    clientName: "",
    segment: "",
    stage: "",
    source: "",
    owner: "",
    minValue: "",
    maxValue: ""
  })

  const stageOptions = [
    { value: "initial-contact", label: "Initial Contact" },
    { value: "qualification", label: "Qualification" },
    { value: "proposal", label: "Proposal" },
    { value: "negotiation", label: "Negotiation" },
    { value: "closed-won", label: "Closed Won" },
    { value: "closed-lost", label: "Closed Lost" },
  ]

  useEffect(() => {
    if (currentUser) {
      loadDeals()
    }
  }, [currentUser, selectedYear])

  useEffect(() => {
    applyFilters()
  }, [deals, filters])

  const loadDeals = async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const dealsRef = collection(db, "users", currentUser.uid, "pipelineDeals")
      const q = query(dealsRef, where("year", "==", selectedYear))
      const querySnapshot = await getDocs(q)
      const dealsData = []
      querySnapshot.forEach((doc) => {
        dealsData.push({ id: doc.id, ...doc.data() })
      })
      setDeals(dealsData)
      setFilteredDeals(dealsData)
    } catch (error) {
      console.error("Error loading deals:", error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...deals]
    
    if (filters.clientName) {
      filtered = filtered.filter(deal => 
        deal.clientName?.toLowerCase().includes(filters.clientName.toLowerCase())
      )
    }
    
    if (filters.segment) {
      filtered = filtered.filter(deal => 
        deal.segment?.toLowerCase().includes(filters.segment.toLowerCase())
      )
    }
    
    if (filters.stage) {
      filtered = filtered.filter(deal => deal.stage === filters.stage)
    }
    
    if (filters.source) {
      filtered = filtered.filter(deal => 
        deal.source?.toLowerCase().includes(filters.source.toLowerCase())
      )
    }
    
    if (filters.owner) {
      filtered = filtered.filter(deal => 
        deal.owner?.toLowerCase().includes(filters.owner.toLowerCase())
      )
    }
    
    if (filters.minValue) {
      filtered = filtered.filter(deal => (deal.dealValue || 0) >= parseFloat(filters.minValue))
    }
    
    if (filters.maxValue) {
      filtered = filtered.filter(deal => (deal.dealValue || 0) <= parseFloat(filters.maxValue))
    }
    
    setFilteredDeals(filtered)
  }

  const deleteDeal = async (dealId) => {
    if (!currentUser || isInvestorView) {
      alert("You cannot delete deals in this mode.")
      return
    }
    setConfirmDialog({ show: true, dealId })
  }

  const handleConfirmDelete = async () => {
    try {
      const dealsRef = collection(db, "users", currentUser.uid, "pipelineDeals")
      await deleteDoc(doc(dealsRef, confirmDialog.dealId))
      loadDeals()
    } catch (error) {
      console.error("Error deleting deal:", error)
      alert("Error deleting deal")
    } finally {
      setConfirmDialog({ show: false, dealId: null })
    }
  }

  const clearFilters = () => {
    setFilters({
      clientName: "",
      segment: "",
      stage: "",
      source: "",
      owner: "",
      minValue: "",
      maxValue: ""
    })
  }

  const totalPipelineValue = filteredDeals.reduce((sum, deal) => sum + (deal.dealValue || 0), 0)
  const totalRiskAdjusted = filteredDeals.reduce((sum, deal) => sum + (deal.riskAdjustedValue || 0), 0)

  return (
    <div style={{ marginTop: "30px" }}>
      {confirmDialog.show && (
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
              maxWidth: "400px",
              width: "90%",
            }}
          >
            <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px" }}>Confirm Deletion</h3>
            <p style={{ color: "#5d4037", marginBottom: "25px" }}>
              Are you sure you want to delete this deal? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setConfirmDialog({ show: false, dealId: null })}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#e8ddd4",
                  color: "#5d4037",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#dc2626",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
        <h3 style={{ color: "#5d4037", fontSize: "18px", fontWeight: "700", margin: 0 }}>Pipeline Deals</h3>
        
        {!isInvestorView && (
          <button
            onClick={onAddData}
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
            Add Deal
          </button>
        )}
      </div>

      {/* Filters Section */}
      <div style={{ 
        backgroundColor: "#f5f0eb", 
        padding: "20px", 
        borderRadius: "8px", 
        marginBottom: "20px",
        border: "1px solid #e8ddd4"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h4 style={{ color: "#5d4037", fontSize: "16px", fontWeight: "600", margin: 0 }}>Filters</h4>
          <button
            onClick={clearFilters}
            style={{
              padding: "6px 12px",
              backgroundColor: "#e8ddd4",
              color: "#5d4037",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            Clear Filters
          </button>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px" }}>
          <div>
            <label style={{ fontSize: "12px", color: "#5d4037", display: "block", marginBottom: "5px" }}>
              Client Name
            </label>
            <input
              type="text"
              value={filters.clientName}
              onChange={(e) => setFilters({...filters, clientName: e.target.value})}
              placeholder="Search client..."
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #e8ddd4",
                fontSize: "13px",
              }}
            />
          </div>
          
          <div>
            <label style={{ fontSize: "12px", color: "#5d4037", display: "block", marginBottom: "5px" }}>
              Segment
            </label>
            <input
              type="text"
              value={filters.segment}
              onChange={(e) => setFilters({...filters, segment: e.target.value})}
              placeholder="Filter by segment..."
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #e8ddd4",
                fontSize: "13px",
              }}
            />
          </div>
          
          <div>
            <label style={{ fontSize: "12px", color: "#5d4037", display: "block", marginBottom: "5px" }}>
              Stage
            </label>
            <select
              value={filters.stage}
              onChange={(e) => setFilters({...filters, stage: e.target.value})}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #e8ddd4",
                fontSize: "13px",
              }}
            >
              <option value="">All Stages</option>
              {stageOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ fontSize: "12px", color: "#5d4037", display: "block", marginBottom: "5px" }}>
              Source
            </label>
            <input
              type="text"
              value={filters.source}
              onChange={(e) => setFilters({...filters, source: e.target.value})}
              placeholder="Filter by source..."
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #e8ddd4",
                fontSize: "13px",
              }}
            />
          </div>
          
          <div>
            <label style={{ fontSize: "12px", color: "#5d4037", display: "block", marginBottom: "5px" }}>
              Owner
            </label>
            <input
              type="text"
              value={filters.owner}
              onChange={(e) => setFilters({...filters, owner: e.target.value})}
              placeholder="Filter by owner..."
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #e8ddd4",
                fontSize: "13px",
              }}
            />
          </div>
          
          <div>
            <label style={{ fontSize: "12px", color: "#5d4037", display: "block", marginBottom: "5px" }}>
              Min Value (R)
            </label>
            <input
              type="number"
              value={filters.minValue}
              onChange={(e) => setFilters({...filters, minValue: e.target.value})}
              placeholder="Min amount..."
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #e8ddd4",
                fontSize: "13px",
              }}
            />
          </div>
          
          <div>
            <label style={{ fontSize: "12px", color: "#5d4037", display: "block", marginBottom: "5px" }}>
              Max Value (R)
            </label>
            <input
              type="number"
              value={filters.maxValue}
              onChange={(e) => setFilters({...filters, maxValue: e.target.value})}
              placeholder="Max amount..."
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #e8ddd4",
                fontSize: "13px",
              }}
            />
          </div>
        </div>
      </div>

      {/* Deals Table */}
      <div style={{ overflowX: "auto", backgroundColor: "#f5f0eb", borderRadius: "8px", padding: "20px", marginBottom: "30px" }}>
        {filteredDeals.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#8d6e63" }}>
            {deals.length === 0 ? "No deals found. Click 'Add Deal' to get started." : "No deals match the current filters."}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#5d4037", color: "#fdfcfb" }}>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "13px" }}>Client</th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "13px" }}>Segment</th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "13px" }}>Stage</th>
                <th style={{ padding: "12px", textAlign: "right", fontSize: "13px" }}>Probability</th>
                <th style={{ padding: "12px", textAlign: "right", fontSize: "13px" }}>Value</th>
                <th style={{ padding: "12px", textAlign: "right", fontSize: "13px" }}>Risk Adj</th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "13px" }}>Source</th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "13px" }}>Owner</th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "13px" }}>Expected Close</th>
                {!isInvestorView && <th style={{ padding: "12px", textAlign: "center", fontSize: "13px" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredDeals.map((deal, index) => {
                const stageLabel = stageOptions.find(option => option.value === deal.stage)?.label || deal.stage
                return (
                  <tr
                    key={deal.id}
                    style={{
                      borderBottom: "1px solid #e8ddd4",
                      backgroundColor: index % 2 === 0 ? "#fdfcfb" : "#f5f0eb",
                    }}
                  >
                    <td style={{ padding: "10px", fontSize: "13px", color: "#5d4037" }}>{deal.clientName}</td>
                    <td style={{ padding: "10px", fontSize: "13px", color: "#5d4037" }}>{deal.segment}</td>
                    <td style={{ padding: "10px", fontSize: "13px", color: "#5d4037" }}>{stageLabel}</td>
                    <td style={{ padding: "10px", fontSize: "13px", color: "#5d4037", textAlign: "right" }}>
                      {deal.probability}%
                    </td>
                    <td style={{ padding: "10px", fontSize: "13px", color: "#5d4037", textAlign: "right" }}>
                      {formatCurrency(deal.dealValue)}
                    </td>
                    <td style={{ padding: "10px", fontSize: "13px", color: "#5d4037", textAlign: "right" }}>
                      {formatCurrency(deal.riskAdjustedValue)}
                    </td>
                    <td style={{ padding: "10px", fontSize: "13px", color: "#5d4037" }}>{deal.source}</td>
                    <td style={{ padding: "10px", fontSize: "13px", color: "#5d4037" }}>{deal.owner}</td>
                    <td style={{ padding: "10px", fontSize: "13px", color: "#5d4037" }}>{deal.expectedClose}</td>
                    {!isInvestorView && (
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <button
                          onClick={() => deleteDeal(deal.id)}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#dc2626",
                            color: "#fdfcfb",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px", marginBottom: "20px" }}>
        <div style={{ backgroundColor: "#f5f0eb", padding: "20px", borderRadius: "6px", textAlign: "center" }}>
          <div style={{ fontSize: "14px", color: "#5d4037", marginBottom: "8px", fontWeight: "600" }}>
            Total Deals (Filtered)
          </div>
          <div style={{ fontSize: "28px", color: "#5d4037", fontWeight: "700" }}>
            {filteredDeals.length}
          </div>
        </div>
        
        <div style={{ backgroundColor: "#f5f0eb", padding: "20px", borderRadius: "6px", textAlign: "center" }}>
          <div style={{ fontSize: "14px", color: "#5d4037", marginBottom: "8px", fontWeight: "600" }}>
            Pipeline Value
          </div>
          <div style={{ fontSize: "28px", color: "#5d4037", fontWeight: "700" }}>
            {formatCurrency(totalPipelineValue)}
          </div>
        </div>
        
        <div style={{ backgroundColor: "#f5f0eb", padding: "20px", borderRadius: "6px", textAlign: "center" }}>
          <div style={{ fontSize: "14px", color: "#5d4037", marginBottom: "8px", fontWeight: "600" }}>
            Risk Adjusted
          </div>
          <div style={{ fontSize: "28px", color: "#5d4037", fontWeight: "700" }}>
            {formatCurrency(totalRiskAdjusted)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== PIPELINE VISIBILITY COMPONENT ====================

const PipelineVisibility = ({ activeSection, currentUser, isInvestorView, onAddData, startDate, endDate }) => {
  const [loading, setLoading] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState({})
  const [kpiNotes, setKpiNotes] = useState({})
  const [kpiAnalysis, setKpiAnalysis] = useState({})
  const [showCalculationModal, setShowCalculationModal] = useState(false)
  const [selectedCalculation, setSelectedCalculation] = useState({ title: "", calculation: "" })
  const [showTrendModal, setShowTrendModal] = useState(false)
  const [selectedTrendItem, setSelectedTrendItem] = useState(null)
  const [financialYearStart, setFinancialYearStart] = useState("Jan")

  const [pipelineData, setPipelineData] = useState({
    newLeads: Array(12).fill(0),
    salesVelocity: Array(12).fill(0),
    conversionRates: Array(12).fill(0),
    notes: "",
  })

  useEffect(() => {
    const loadFinancialYear = async () => {
      if (!currentUser) return
      try {
        const docRef = doc(db, "universalProfiles", currentUser.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          const fyEnd = data.entityOverview?.financialYearEnd
          if (fyEnd) {
            const monthNum = parseInt(fyEnd.split('-')[1])
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            setFinancialYearStart(months[(monthNum % 12)])
          }
        }
      } catch (error) {
        console.error("Error loading financial year:", error)
      }
    }
    loadFinancialYear()
  }, [currentUser])

  useEffect(() => {
    if (currentUser && activeSection === "pipeline-visibility") {
      loadData()
    }
  }, [currentUser, activeSection, startDate?.year])

  const loadData = async () => {
    if (!currentUser || !startDate) return
    setLoading(true)
    try {
      const docRef = doc(db, "pipelineData", `${currentUser.uid}_visibility_${startDate.year}`)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        setPipelineData({
          newLeads: data.newLeads || Array(12).fill(0),
          salesVelocity: data.salesVelocity || Array(12).fill(0),
          conversionRates: data.conversionRates || Array(12).fill(0),
          notes: data.notes || "",
        })
      }
    } catch (error) {
      console.error("Error loading pipeline visibility data:", error)
    } finally {
      setLoading(false)
    }
  }

  const openTrendModal = (itemName, dataArray, isPercentage = false) => {
    if (!startDate || !endDate) return
    
    const months = getMonthsForYear(startDate.year, financialYearStart)
    const startMonthIndex = months.indexOf(startDate.month)
    const endMonthIndex = months.indexOf(endDate.month)
    
    // Get all months from start to end (last 11 months + current)
    const monthIndices = []
    let currentIndex = endMonthIndex
    for (let i = 0; i < 12; i++) {
      monthIndices.unshift(currentIndex)
      currentIndex = (currentIndex - 1 + 12) % 12
    }
    
    const trendData = []
    const trendLabels = []
    
    monthIndices.forEach(idx => {
      trendData.push(dataArray[idx] || 0)
      trendLabels.push(`${months[idx]} ${startDate.year}`)
    })
    
    setSelectedTrendItem({ 
      name: itemName, 
      data: trendData,
      labels: trendLabels,
      isPercentage
    })
    setShowTrendModal(true)
  }

  const handleCalculationClick = (title, calculation) => {
    setSelectedCalculation({ title, calculation })
    setShowCalculationModal(true)
  }

  const months = getMonthsForYear(startDate?.year || new Date().getFullYear(), financialYearStart)
  const monthIndex = startDate ? months.indexOf(startDate.month) : 0

  const renderKPICard = (title, dataKey, calculation = "", isPercentage = false, colorIndex = 0) => {
    let currentValue = 0
    let dataArray = []
    
    if (dataKey === "newLeads") {
      dataArray = pipelineData.newLeads || []
      currentValue = dataArray[monthIndex] || 0
    } else if (dataKey === "salesVelocity") {
      dataArray = pipelineData.salesVelocity || []
      currentValue = dataArray[monthIndex] || 0
    } else if (dataKey === "conversionRates") {
      dataArray = pipelineData.conversionRates || []
      currentValue = dataArray[monthIndex] || 0
    }

    const displayValue = isPercentage 
      ? `${currentValue.toFixed(1)}%`
      : dataKey === "salesVelocity" 
        ? `${currentValue.toFixed(1)} days`
        : formatNumber(currentValue)

    const color = circleColors[colorIndex % circleColors.length]

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
        <EyeIcon onClick={() => handleCalculationClick(title, calculation)} color={color.border} />
        
        <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
          <div
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              border: `5px solid ${color.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "20px",
              backgroundColor: color.background,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "16px", fontWeight: "700", color: color.text }}>
                {displayValue}
              </div>
              <div style={{ fontSize: "11px", color: color.text, opacity: 0.8 }}>Current</div>
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
              onClick={() => openTrendModal(title, dataArray, isPercentage)}
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
                  `Based on the current ${title.toLowerCase()} of ${displayValue}:
                  \n\nThis metric indicates your ${title.toLowerCase()} performance.
                  \n\nRecommended actions:
                  \n• Monitor this metric monthly
                  \n• Compare against targets
                  \n• Investigate significant changes`}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (activeSection !== "pipeline-visibility" || !startDate || !endDate) return null

  const calculationTexts = {
    newLeads: "New Leads: Number of new leads generated in the period.\n\nCalculation: Count of new leads added to CRM.",
    salesVelocity: "Sales Velocity = (Number of Opportunities × Deal Value × Win Rate) ÷ Sales Cycle Length\n\nMeasures how quickly deals move through the pipeline.",
    conversionRates: "Conversion Rate = (Number of Converted Leads ÷ Total Leads) × 100%\n\nMeasures how effectively leads are converted to customers.",
  }

  return (
    <div>
      <KeyQuestionBox
        question="Do we have enough quality demand, at the right risk, to hit revenue?"
        signals="Forecast clarity, pipeline coverage, conversion rates"
        decisions="Formalise sales process, improve lead quality, adjust targets"
        section="pipeline-visibility"
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
        <h2 style={{ color: "#5d4037", fontSize: "24px", fontWeight: "700", margin: 0 }}>Pipeline Visibility</h2>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {!isInvestorView && (
            <button
              onClick={onAddData}
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

      {/* KPI Cards - 3 in a row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
        {renderKPICard("New Leads", "newLeads", calculationTexts.newLeads, false, 0)}
        {renderKPICard("Sales Velocity", "salesVelocity", calculationTexts.salesVelocity, false, 1)}
        {renderKPICard("Conversion Rates", "conversionRates", calculationTexts.conversionRates, true, 2)}
      </div>

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
          isPercentage={selectedTrendItem.isPercentage}
        />
      )}
    </div>
  )
}

// ==================== PIPELINE SUFFICIENCY COMPONENT ====================

const PipelineSufficiency = ({ activeSection, currentUser, isInvestorView, onAddData, startDate, endDate }) => {
  const [loading, setLoading] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState({})
  const [kpiNotes, setKpiNotes] = useState({})
  const [kpiAnalysis, setKpiAnalysis] = useState({})
  const [showCalculationModal, setShowCalculationModal] = useState(false)
  const [selectedCalculation, setSelectedCalculation] = useState({ title: "", calculation: "" })
  const [showTrendModal, setShowTrendModal] = useState(false)
  const [selectedTrendItem, setSelectedTrendItem] = useState(null)
  const [financialYearStart, setFinancialYearStart] = useState("Jan")

  const [pipelineData, setPipelineData] = useState({
    totalPipelineValue: 0,
    probability: 0,
    targetRevenue: 0,
    notes: "",
  })

  useEffect(() => {
    const loadFinancialYear = async () => {
      if (!currentUser) return
      try {
        const docRef = doc(db, "universalProfiles", currentUser.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          const fyEnd = data.entityOverview?.financialYearEnd
          if (fyEnd) {
            const monthNum = parseInt(fyEnd.split('-')[1])
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            setFinancialYearStart(months[(monthNum % 12)])
          }
        }
      } catch (error) {
        console.error("Error loading financial year:", error)
      }
    }
    loadFinancialYear()
  }, [currentUser])

  useEffect(() => {
    if (currentUser && activeSection === "pipeline-sufficiency") {
      loadData()
    }
  }, [currentUser, activeSection, startDate?.year])

  const loadData = async () => {
    if (!currentUser || !startDate) return
    setLoading(true)
    try {
      const docRef = doc(db, "pipelineData", `${currentUser.uid}_sufficiency_${startDate.year}`)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        setPipelineData({
          totalPipelineValue: data.totalPipelineValue || 0,
          probability: data.probability || 0,
          targetRevenue: data.targetRevenue || 0,
          notes: data.notes || "",
        })
      }
    } catch (error) {
      console.error("Error loading pipeline sufficiency data:", error)
    } finally {
      setLoading(false)
    }
  }

  const openTrendModal = (itemName, dataValue, isPercentage = false) => {
    if (!startDate || !endDate) return
    
    // For sufficiency metrics, we need historical data
    // Since we only have current value, we'll create a trend based on monthly data
    // In a real app, you'd fetch historical data from Firestore
    const months = getMonthsForYear(startDate.year, financialYearStart)
    
    // Create sample historical data (in production, fetch from database)
    const historicalData = []
    const trendLabels = []
    
    const startMonthIndex = months.indexOf(startDate.month)
    for (let i = 0; i < 12; i++) {
      const monthIdx = (startMonthIndex - 11 + i + 12) % 12
      // This is where you'd load actual historical values
      historicalData.push(dataValue * (0.8 + Math.random() * 0.4)) // Placeholder
      trendLabels.push(`${months[monthIdx]} ${startDate.year}`)
    }
    
    setSelectedTrendItem({ 
      name: itemName, 
      data: historicalData,
      labels: trendLabels,
      isPercentage
    })
    setShowTrendModal(true)
  }

  const handleCalculationClick = (title, calculation) => {
    setSelectedCalculation({ title, calculation })
    setShowCalculationModal(true)
  }

  const months = getMonthsForYear(startDate?.year || new Date().getFullYear(), financialYearStart)
  const monthIndex = startDate ? months.indexOf(startDate.month) : 0

  const renderKPICard = (title, dataKey, calculation = "", isPercentage = false, colorIndex = 2) => {
    let currentValue = 0
    
    if (dataKey === "riskAdjustedValue") {
      currentValue = (pipelineData.totalPipelineValue * pipelineData.probability) / 100
    } else if (dataKey === "pipelineCoverage") {
      currentValue = pipelineData.targetRevenue > 0 ? (pipelineData.totalPipelineValue / pipelineData.targetRevenue) * 100 : 0
    }

    const displayValue = isPercentage 
      ? `${currentValue.toFixed(1)}%`
      : formatCurrency(currentValue)

    const color = circleColors[colorIndex % circleColors.length]

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
        <EyeIcon onClick={() => handleCalculationClick(title, calculation)} color={color.border} />
        
        <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
          <div
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              border: `5px solid ${color.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "20px",
              backgroundColor: color.background,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "16px", fontWeight: "700", color: color.text }}>
                {displayValue}
              </div>
              <div style={{ fontSize: "11px", color: color.text, opacity: 0.8 }}>Current</div>
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
              onClick={() => openTrendModal(title, currentValue, isPercentage)}
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
                  `Based on the current ${title.toLowerCase()} of ${displayValue}:
                  \n\nThis metric indicates your pipeline sufficiency.
                  \n\nRecommended actions:
                  \n• Monitor this metric monthly
                  \n• Compare against targets
                  \n• Adjust pipeline generation activities`}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (activeSection !== "pipeline-sufficiency" || !startDate || !endDate) return null

  const riskAdjustedValue = (pipelineData.totalPipelineValue * pipelineData.probability) / 100
  const pipelineCoverage = pipelineData.targetRevenue > 0 ? (pipelineData.totalPipelineValue / pipelineData.targetRevenue) * 100 : 0

  const calculationTexts = {
    riskAdjustedValue: "Risk Adjusted Pipeline Value = Total Pipeline Value × Probability %\n\nAccounts for deal probability to show expected value.",
    pipelineCoverage: "Pipeline Coverage Ratio = (Pipeline Value ÷ Target Revenue) × 100%\n\nMeasures if pipeline is sufficient to meet revenue targets.",
  }

  return (
    <div>
      <KeyQuestionBox
        question="Is pipeline big enough?"
        signals="Coverage ratio, lead volume trends"
        decisions="Increase lead generation, adjust targets"
        section="pipeline-sufficiency"
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
        <h2 style={{ color: "#5d4037", fontSize: "24px", fontWeight: "700", margin: 0 }}>Pipeline Sufficiency</h2>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {!isInvestorView && (
            <button
              onClick={onAddData}
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

      {/* KPI Cards - 2 in a row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "30px" }}>
        {renderKPICard("Risk Adjusted Value", "riskAdjustedValue", calculationTexts.riskAdjustedValue, false, 0)}
        {renderKPICard("Pipeline Coverage", "pipelineCoverage", calculationTexts.pipelineCoverage, true, 1)}
      </div>

      {/* Pipeline Table inside Pipeline Sufficiency */}
      <PipelineTable 
        currentUser={currentUser}
        isInvestorView={isInvestorView}
        selectedYear={startDate?.year || new Date().getFullYear()}
        onAddData={onAddData}
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
          isPercentage={selectedTrendItem.isPercentage}
        />
      )}
    </div>
  )
}

// ==================== REVENUE CONCENTRATION COMPONENT ====================

const RevenueConcentration = ({ activeSection, currentUser, isInvestorView, onAddData, startDate, endDate }) => {
  const [loading, setLoading] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState({})
  const [kpiNotes, setKpiNotes] = useState({})
  const [kpiAnalysis, setKpiAnalysis] = useState({})
  const [showCalculationModal, setShowCalculationModal] = useState(false)
  const [selectedCalculation, setSelectedCalculation] = useState({ title: "", calculation: "" })
  const [showTrendModal, setShowTrendModal] = useState(false)
  const [selectedTrendItem, setSelectedTrendItem] = useState(null)
  const [activeTab, setActiveTab] = useState("channel") // "channel", "customer", "segment"
  const [financialYearStart, setFinancialYearStart] = useState("Jan")

  const [concentrationData, setConcentrationData] = useState({
    revenueChannels: [
      { name: "Social Media", revenue: 0, spend: 0 },
      { name: "Email", revenue: 0, spend: 0 },
      { name: "PPC", revenue: 0, spend: 0 },
      { name: "SEO", revenue: 0, spend: 0 },
      { name: "Referral", revenue: 0, spend: 0 },
      { name: "Direct", revenue: 0, spend: 0 }
    ],
    customerSegments: [
      { name: "Enterprise", revenue: 0, customerCount: 0 },
      { name: "SMB", revenue: 0, customerCount: 0 },
      { name: "Startup", revenue: 0, customerCount: 0 },
      { name: "Non-Profit", revenue: 0, customerCount: 0 },
      { name: "Education", revenue: 0, customerCount: 0 }
    ],
    revenueByCustomer: [
      { name: "Customer A", revenue: 0 },
      { name: "Customer B", revenue: 0 },
      { name: "Customer C", revenue: 0 },
      { name: "Customer D", revenue: 0 },
      { name: "Customer E", revenue: 0 },
    ],
    notes: "",
  })

  useEffect(() => {
    const loadFinancialYear = async () => {
      if (!currentUser) return
      try {
        const docRef = doc(db, "universalProfiles", currentUser.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          const fyEnd = data.entityOverview?.financialYearEnd
          if (fyEnd) {
            const monthNum = parseInt(fyEnd.split('-')[1])
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            setFinancialYearStart(months[(monthNum % 12)])
          }
        }
      } catch (error) {
        console.error("Error loading financial year:", error)
      }
    }
    loadFinancialYear()
  }, [currentUser])

  useEffect(() => {
    if (currentUser && activeSection === "revenue-concentration") {
      loadData()
    }
  }, [currentUser, activeSection, startDate?.year])

  const loadData = async () => {
    if (!currentUser || !startDate) return
    setLoading(true)
    try {
      const docRef = doc(db, "pipelineData", `${currentUser.uid}_concentration_${startDate.year}`)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        setConcentrationData({
          revenueChannels: data.revenueChannels || [
            { name: "Social Media", revenue: 0, spend: 0 },
            { name: "Email", revenue: 0, spend: 0 },
            { name: "PPC", revenue: 0, spend: 0 },
            { name: "SEO", revenue: 0, spend: 0 },
            { name: "Referral", revenue: 0, spend: 0 },
            { name: "Direct", revenue: 0, spend: 0 }
          ],
          customerSegments: data.customerSegments || [
            { name: "Enterprise", revenue: 0, customerCount: 0 },
            { name: "SMB", revenue: 0, customerCount: 0 },
            { name: "Startup", revenue: 0, customerCount: 0 },
            { name: "Non-Profit", revenue: 0, customerCount: 0 },
            { name: "Education", revenue: 0, customerCount: 0 }
          ],
          revenueByCustomer: data.revenueByCustomer || [
            { name: "Customer A", revenue: 0 },
            { name: "Customer B", revenue: 0 },
            { name: "Customer C", revenue: 0 },
            { name: "Customer D", revenue: 0 },
            { name: "Customer E", revenue: 0 },
          ],
          notes: data.notes || "",
        })
      }
    } catch (error) {
      console.error("Error loading revenue concentration data:", error)
    } finally {
      setLoading(false)
    }
  }

  const openTrendModal = (itemName, dataValue, isPercentage = false) => {
    if (!startDate || !endDate) return
    
    const months = getMonthsForYear(startDate.year, financialYearStart)
    
    // Create sample historical data (in production, fetch from database)
    const historicalData = []
    const trendLabels = []
    
    const startMonthIndex = months.indexOf(startDate.month)
    for (let i = 0; i < 12; i++) {
      const monthIdx = (startMonthIndex - 11 + i + 12) % 12
      historicalData.push(dataValue * (0.7 + Math.random() * 0.6)) // Placeholder
      trendLabels.push(`${months[monthIdx]} ${startDate.year}`)
    }
    
    setSelectedTrendItem({ 
      name: itemName, 
      data: historicalData,
      labels: trendLabels,
      isPercentage
    })
    setShowTrendModal(true)
  }

  const handleCalculationClick = (title, calculation) => {
    setSelectedCalculation({ title, calculation })
    setShowCalculationModal(true)
  }

  const months = getMonthsForYear(startDate?.year || new Date().getFullYear(), financialYearStart)

  const renderKPICard = (title, dataKey, calculation = "", isPercentage = false, colorIndex = 4) => {
    let currentValue = 0
    
    if (dataKey === "totalMarketingSpend") {
      currentValue = concentrationData.revenueChannels.reduce((sum, c) => sum + c.spend, 0)
    } else if (dataKey === "totalROI") {
      const totalRevenue = concentrationData.revenueChannels.reduce((sum, c) => sum + c.revenue, 0)
      const totalSpend = concentrationData.revenueChannels.reduce((sum, c) => sum + c.spend, 0)
      currentValue = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0
    }

    const displayValue = isPercentage 
      ? `${currentValue.toFixed(1)}%`
      : formatCurrency(currentValue)

    const color = circleColors[colorIndex % circleColors.length]

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
        <EyeIcon onClick={() => handleCalculationClick(title, calculation)} color={color.border} />
        
        <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
          <div
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              border: `5px solid ${color.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "20px",
              backgroundColor: color.background,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "16px", fontWeight: "700", color: color.text }}>
                {displayValue}
              </div>
              <div style={{ fontSize: "11px", color: color.text, opacity: 0.8 }}>Current</div>
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
              onClick={() => openTrendModal(title, currentValue, isPercentage)}
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
                  `Based on the current ${title.toLowerCase()} of ${displayValue}:
                  \n\nThis metric indicates your marketing efficiency.
                  \n\nRecommended actions:
                  \n• Monitor spend effectiveness
                  \n• Optimize channel performance
                  \n• Focus on high-ROI activities`}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (activeSection !== "revenue-concentration" || !startDate || !endDate) return null

  const totalMarketingSpend = concentrationData.revenueChannels.reduce((sum, c) => sum + c.spend, 0)
  const totalRevenue = concentrationData.revenueChannels.reduce((sum, c) => sum + c.revenue, 0)
  const totalROI = totalMarketingSpend > 0 ? ((totalRevenue - totalMarketingSpend) / totalMarketingSpend) * 100 : 0
  
  const sortedChannels = [...concentrationData.revenueChannels].sort((a, b) => b.revenue - a.revenue)
  const top3Channels = sortedChannels.slice(0, 3)
  const top3Revenue = top3Channels.reduce((sum, c) => sum + c.revenue, 0)
  const top3Percentage = totalRevenue > 0 ? (top3Revenue / totalRevenue) * 100 : 0

  const sortedSegments = [...concentrationData.customerSegments].sort((a, b) => b.revenue - a.revenue)
  const top3Segments = sortedSegments.slice(0, 3)

  const sortedCustomers = [...concentrationData.revenueByCustomer].sort((a, b) => b.revenue - a.revenue)
  const top3Customers = sortedCustomers.slice(0, 3)

  const calculationTexts = {
    totalMarketingSpend: "Total Marketing Spend: Sum of marketing spend across all channels.\n\nShows total marketing investment.",
    totalROI: "Return on Investment = (Revenue - Spend) ÷ Spend × 100%\n\nMeasures marketing efficiency.",
  }

  return (
    <div>
      <KeyQuestionBox
        question="Where does revenue actually come from? Are we over-dependent?"
        signals="Channel concentration, segment dependency"
        decisions="Diversify channels, reduce reliance on top clients"
        section="revenue-concentration"
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
        <h2 style={{ color: "#5d4037", fontSize: "24px", fontWeight: "700", margin: 0 }}>Revenue Concentration</h2>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Toggle Buttons */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={() => setActiveTab("channel")}
              style={{
                padding: "8px 16px",
                backgroundColor: activeTab === "channel" ? "#5d4037" : "#e8ddd4",
                color: activeTab === "channel" ? "#fdfcfb" : "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              By Channel
            </button>
            <button
              onClick={() => setActiveTab("customer")}
              style={{
                padding: "8px 16px",
                backgroundColor: activeTab === "customer" ? "#5d4037" : "#e8ddd4",
                color: activeTab === "customer" ? "#fdfcfb" : "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              By Customer
            </button>
            <button
              onClick={() => setActiveTab("segment")}
              style={{
                padding: "8px 16px",
                backgroundColor: activeTab === "segment" ? "#5d4037" : "#e8ddd4",
                color: activeTab === "segment" ? "#fdfcfb" : "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              By Segment
            </button>
          </div>
          
          {!isInvestorView && (
            <button
              onClick={onAddData}
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

      {/* KPI Cards - Only 2 cards (removed Total Revenue and Top 3 Concentration) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "30px" }}>
        {renderKPICard("Total Marketing Spend", "totalMarketingSpend", calculationTexts.totalMarketingSpend, false, 5)}
        {renderKPICard("Overall ROI", "totalROI", calculationTexts.totalROI, true, 6)}
      </div>

      {/* Top 3 Concentration Table */}
      <div style={{ 
        backgroundColor: "#f5f0eb", 
        padding: "20px", 
        borderRadius: "8px",
        marginBottom: "30px"
      }}>
        <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px", fontSize: "16px" }}>
          Top 3 Concentration
        </h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
          <div>
            <h4 style={{ color: "#5d4037", fontSize: "14px", marginBottom: "10px" }}>Top 3 Channels</h4>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#5d4037", color: "#fdfcfb" }}>
                  <th style={{ padding: "8px", textAlign: "left", fontSize: "12px" }}>Channel</th>
                  <th style={{ padding: "8px", textAlign: "right", fontSize: "12px" }}>Revenue</th>
                  <th style={{ padding: "8px", textAlign: "right", fontSize: "12px" }}>%</th>
                </tr>
              </thead>
              <tbody>
                {top3Channels.map((channel, index) => (
                  <tr key={index} style={{ borderBottom: "1px solid #e8ddd4" }}>
                    <td style={{ padding: "8px", fontSize: "12px", color: "#5d4037" }}>{channel.name}</td>
                    <td style={{ padding: "8px", fontSize: "12px", color: "#5d4037", textAlign: "right" }}>
                      {formatCurrency(channel.revenue)}
                    </td>
                    <td style={{ padding: "8px", fontSize: "12px", color: "#5d4037", textAlign: "right" }}>
                      {totalRevenue > 0 ? ((channel.revenue / totalRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div>
            <h4 style={{ color: "#5d4037", fontSize: "14px", marginBottom: "10px" }}>Top 3 Customers</h4>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#5d4037", color: "#fdfcfb" }}>
                  <th style={{ padding: "8px", textAlign: "left", fontSize: "12px" }}>Customer</th>
                  <th style={{ padding: "8px", textAlign: "right", fontSize: "12px" }}>Revenue</th>
                  <th style={{ padding: "8px", textAlign: "right", fontSize: "12px" }}>%</th>
                </tr>
              </thead>
              <tbody>
                {top3Customers.map((customer, index) => (
                  <tr key={index} style={{ borderBottom: "1px solid #e8ddd4" }}>
                    <td style={{ padding: "8px", fontSize: "12px", color: "#5d4037" }}>{customer.name}</td>
                    <td style={{ padding: "8px", fontSize: "12px", color: "#5d4037", textAlign: "right" }}>
                      {formatCurrency(customer.revenue)}
                    </td>
                    <td style={{ padding: "8px", fontSize: "12px", color: "#5d4037", textAlign: "right" }}>
                      {totalRevenue > 0 ? ((customer.revenue / totalRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div>
            <h4 style={{ color: "#5d4037", fontSize: "14px", marginBottom: "10px" }}>Top 3 Segments</h4>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#5d4037", color: "#fdfcfb" }}>
                  <th style={{ padding: "8px", textAlign: "left", fontSize: "12px" }}>Segment</th>
                  <th style={{ padding: "8px", textAlign: "right", fontSize: "12px" }}>Revenue</th>
                  <th style={{ padding: "8px", textAlign: "right", fontSize: "12px" }}>%</th>
                </tr>
              </thead>
              <tbody>
                {top3Segments.map((segment, index) => (
                  <tr key={index} style={{ borderBottom: "1px solid #e8ddd4" }}>
                    <td style={{ padding: "8px", fontSize: "12px", color: "#5d4037" }}>{segment.name}</td>
                    <td style={{ padding: "8px", fontSize: "12px", color: "#5d4037", textAlign: "right" }}>
                      {formatCurrency(segment.revenue)}
                    </td>
                    <td style={{ padding: "8px", fontSize: "12px", color: "#5d4037", textAlign: "right" }}>
                      {totalRevenue > 0 ? ((segment.revenue / totalRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Channel/Segment Chart based on active tab */}
      <div style={{ 
        backgroundColor: "#f5f0eb", 
        padding: "20px", 
        borderRadius: "8px",
        marginBottom: "30px"
      }}>
        <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px", fontSize: "16px" }}>
          {activeTab === "channel" && "Revenue by Channel"}
          {activeTab === "customer" && "Revenue by Customer"}
          {activeTab === "segment" && "Revenue by Segment"}
        </h3>
        
        <div style={{ height: "300px" }}>
          <Bar
            data={{
              labels: activeTab === "channel" 
                ? concentrationData.revenueChannels.map(c => c.name)
                : activeTab === "customer"
                  ? concentrationData.revenueByCustomer.map(c => c.name)
                  : concentrationData.customerSegments.map(s => s.name),
              datasets: [
                {
                  label: "Revenue",
                  data: activeTab === "channel"
                    ? concentrationData.revenueChannels.map(c => c.revenue)
                    : activeTab === "customer"
                      ? concentrationData.revenueByCustomer.map(c => c.revenue)
                      : concentrationData.customerSegments.map(s => s.revenue),
                  backgroundColor: "#5d4037",
                  borderRadius: 4,
                },
                ...(activeTab === "channel" ? [{
                  label: "Marketing Spend",
                  data: concentrationData.revenueChannels.map(c => c.spend),
                  backgroundColor: "#8d6e63",
                  borderRadius: 4,
                }] : []),
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                datalabels: { display: false },
                legend: { display: activeTab === "channel" },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      return `${context.dataset.label}: ${formatCurrency(context.raw)}`
                    },
                  },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => formatCurrency(value),
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Channel Table (always show full data) */}
      <div style={{ 
        backgroundColor: "#f5f0eb", 
        padding: "20px", 
        borderRadius: "8px",
        marginBottom: "30px"
      }}>
        <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px", fontSize: "16px" }}>
          Channel Performance
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#5d4037", color: "#fdfcfb" }}>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "13px" }}>Channel</th>
                <th style={{ padding: "12px", textAlign: "right", fontSize: "13px" }}>Revenue</th>
                <th style={{ padding: "12px", textAlign: "right", fontSize: "13px" }}>Marketing Spend</th>
                <th style={{ padding: "12px", textAlign: "right", fontSize: "13px" }}>Net Profit</th>
                <th style={{ padding: "12px", textAlign: "right", fontSize: "13px" }}>ROI %</th>
                <th style={{ padding: "12px", textAlign: "right", fontSize: "13px" }}>% of Revenue</th>
              </tr>
            </thead>
            <tbody>
              {concentrationData.revenueChannels.sort((a, b) => b.revenue - a.revenue).map((channel, index) => {
                const netProfit = channel.revenue - channel.spend
                const roi = channel.spend > 0 ? (netProfit / channel.spend) * 100 : 0
                const revenuePercentage = totalRevenue > 0 ? (channel.revenue / totalRevenue) * 100 : 0
                
                return (
                  <tr
                    key={index}
                    style={{
                      borderBottom: "1px solid #e8ddd4",
                      backgroundColor: index % 2 === 0 ? "#fdfcfb" : "#f5f0eb",
                    }}
                  >
                    <td style={{ padding: "10px", fontSize: "13px", color: "#5d4037", fontWeight: "600" }}>
                      {channel.name}
                    </td>
                    <td style={{ padding: "10px", fontSize: "13px", color: "#5d4037", textAlign: "right" }}>
                      {formatCurrency(channel.revenue)}
                    </td>
                    <td style={{ padding: "10px", fontSize: "13px", color: "#5d4037", textAlign: "right" }}>
                      {formatCurrency(channel.spend)}
                    </td>
                    <td style={{ 
                      padding: "10px", 
                      fontSize: "13px", 
                      color: netProfit >= 0 ? "#16a34a" : "#dc2626", 
                      textAlign: "right",
                      fontWeight: "600"
                    }}>
                      {formatCurrency(netProfit)}
                    </td>
                    <td style={{ 
                      padding: "10px", 
                      fontSize: "13px", 
                      color: roi >= 0 ? "#16a34a" : "#dc2626", 
                      textAlign: "right",
                      fontWeight: "600"
                    }}>
                      {roi.toFixed(1)}%
                    </td>
                    <td style={{ padding: "10px", fontSize: "13px", color: "#5d4037", textAlign: "right" }}>
                      {revenuePercentage.toFixed(1)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Concentration Risk Analysis */}
      <div style={{ 
        backgroundColor: "#f5f0eb", 
        padding: "15px", 
        borderRadius: "6px",
      }}>
        <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "10px" }}>Concentration Risk Analysis</h4>
        <div>
          <div style={{ fontSize: "13px", color: "#5d4037", fontWeight: "600", marginBottom: "5px" }}>
            Channel Concentration Risk
          </div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
            <div style={{ width: "100%", backgroundColor: "#e8ddd4", height: "20px", borderRadius: "10px", overflow: "hidden" }}>
              <div 
                style={{ 
                  width: `${top3Percentage}%`, 
                  height: "100%", 
                  backgroundColor: top3Percentage > 70 ? "#dc2626" : top3Percentage > 50 ? "#f59e0b" : "#16a34a",
                }} 
              />
            </div>
            <div style={{ marginLeft: "10px", fontSize: "14px", color: "#5d4037", fontWeight: "600", minWidth: "40px" }}>
              {top3Percentage.toFixed(1)}%
            </div>
          </div>
          <div style={{ fontSize: "12px", color: "#8d6e63" }}>
            Top 3 channels generate {top3Percentage.toFixed(1)}% of total revenue
            {top3Percentage > 70 && " - High risk: Over-dependent on few channels"}
            {top3Percentage <= 70 && top3Percentage > 50 && " - Moderate risk"}
            {top3Percentage <= 50 && " - Low risk: Well diversified"}
          </div>
        </div>
      </div>

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
          isPercentage={selectedTrendItem.isPercentage}
        />
      )}
    </div>
  )
}

// ==================== DEMAND SUSTAINABILITY COMPONENT ====================

const DemandSustainability = ({ activeSection, currentUser, isInvestorView, onAddData, startDate, endDate }) => {
  const [loading, setLoading] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState({})
  const [kpiNotes, setKpiNotes] = useState({})
  const [kpiAnalysis, setKpiAnalysis] = useState({})
  const [showCalculationModal, setShowCalculationModal] = useState(false)
  const [selectedCalculation, setSelectedCalculation] = useState({ title: "", calculation: "" })
  const [showTrendModal, setShowTrendModal] = useState(false)
  const [selectedTrendItem, setSelectedTrendItem] = useState(null)
  const [financialYearStart, setFinancialYearStart] = useState("Jan")

  const [sustainabilityData, setSustainabilityData] = useState({
    repeatCustomerRate: 0,
    churnRate: 0,
    campaigns: [
      { name: "Q1 Campaign", cost: 0, revenue: 0 },
      { name: "Q2 Campaign", cost: 0, revenue: 0 },
      { name: "Summer Sale", cost: 0, revenue: 0 },
      { name: "Holiday Campaign", cost: 0, revenue: 0 }
    ],
    notes: "",
  })

  useEffect(() => {
    const loadFinancialYear = async () => {
      if (!currentUser) return
      try {
        const docRef = doc(db, "universalProfiles", currentUser.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          const fyEnd = data.entityOverview?.financialYearEnd
          if (fyEnd) {
            const monthNum = parseInt(fyEnd.split('-')[1])
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            setFinancialYearStart(months[(monthNum % 12)])
          }
        }
      } catch (error) {
        console.error("Error loading financial year:", error)
      }
    }
    loadFinancialYear()
  }, [currentUser])

  useEffect(() => {
    if (currentUser && activeSection === "demand-sustainability") {
      loadData()
    }
  }, [currentUser, activeSection, startDate?.year])

  const loadData = async () => {
    if (!currentUser || !startDate) return
    setLoading(true)
    try {
      const docRef = doc(db, "pipelineData", `${currentUser.uid}_sustainability_${startDate.year}`)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        setSustainabilityData({
          repeatCustomerRate: data.repeatCustomerRate || 0,
          churnRate: data.churnRate || 0,
          campaigns: data.campaigns || [
            { name: "Q1 Campaign", cost: 0, revenue: 0 },
            { name: "Q2 Campaign", cost: 0, revenue: 0 },
            { name: "Summer Sale", cost: 0, revenue: 0 },
            { name: "Holiday Campaign", cost: 0, revenue: 0 }
          ],
          notes: data.notes || "",
        })
      }
    } catch (error) {
      console.error("Error loading demand sustainability data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCalculationClick = (title, calculation) => {
    setSelectedCalculation({ title, calculation })
    setShowCalculationModal(true)
  }

  const openTrendModal = (itemName, dataArray, isPercentage = false) => {
    if (!startDate || !endDate) return
    
    const months = getMonthsForYear(startDate.year, financialYearStart)
    const startMonthIndex = months.indexOf(startDate.month)
    const endMonthIndex = months.indexOf(endDate.month)
    
    // Get last 11 months + current month
    const monthIndices = []
    let currentIndex = endMonthIndex
    for (let i = 0; i < 12; i++) {
      monthIndices.unshift(currentIndex)
      currentIndex = (currentIndex - 1 + 12) % 12
    }
    
    const trendData = []
    const trendLabels = []
    
    monthIndices.forEach(idx => {
      trendData.push(dataArray[idx] || 0)
      trendLabels.push(`${months[idx]} ${startDate.year}`)
    })
    
    setSelectedTrendItem({ 
      name: itemName, 
      data: trendData,
      labels: trendLabels,
      isPercentage
    })
    setShowTrendModal(true)
  }

  const months = getMonthsForYear(startDate?.year || new Date().getFullYear(), financialYearStart)
  const monthIndex = startDate ? months.indexOf(startDate.month) : 0

  const renderKPICard = (title, dataKey, calculation = "", isPercentage = false, colorIndex = 0) => {
    let currentValue = 0
    let dataArray = []
    
    if (dataKey === "repeatCustomerRate") {
      currentValue = sustainabilityData.repeatCustomerRate
    } else if (dataKey === "churnRate") {
      currentValue = sustainabilityData.churnRate
    } else if (dataKey === "netRetention") {
      currentValue = sustainabilityData.repeatCustomerRate - sustainabilityData.churnRate
    } else if (dataKey === "campaignROI") {
      const totalCost = sustainabilityData.campaigns.reduce((sum, c) => sum + c.cost, 0)
      const totalRevenue = sustainabilityData.campaigns.reduce((sum, c) => sum + c.revenue, 0)
      currentValue = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0
    }

    const displayValue = isPercentage 
      ? `${currentValue.toFixed(1)}%`
      : formatCurrency(currentValue)

    const color = circleColors[colorIndex % circleColors.length]

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
        <EyeIcon onClick={() => handleCalculationClick(title, calculation)} color={color.border} />
        
        <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
          <div
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              border: `5px solid ${color.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "20px",
              backgroundColor: color.background,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "16px", fontWeight: "700", color: color.text }}>
                {displayValue}
              </div>
              <div style={{ fontSize: "11px", color: color.text, opacity: 0.8 }}>Current</div>
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
              onClick={() => {
                if (dataKey === "campaignROI") {
                  // For campaign ROI, we need to create a data array
                  const roiData = sustainabilityData.campaigns.map(c => {
                    const roi = c.cost > 0 ? ((c.revenue - c.cost) / c.cost) * 100 : 0
                    return roi
                  })
                  openTrendModal(title, roiData, true)
                } else {
                  // For other metrics, we need monthly data
                  // In production, you'd fetch this from Firestore
                  const monthlyData = Array(12).fill(currentValue * (0.9 + Math.random() * 0.2))
                  openTrendModal(title, monthlyData, isPercentage)
                }
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
                  `Based on the current ${title.toLowerCase()} of ${displayValue}:
                  \n\nThis metric indicates demand sustainability.
                  \n\nRecommended actions:
                  \n• Monitor trends monthly
                  \n• Focus on customer retention
                  \n• Optimize campaign ROI`}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (activeSection !== "demand-sustainability" || !startDate || !endDate) return null

  const netRetention = sustainabilityData.repeatCustomerRate - sustainabilityData.churnRate
  
  const totalCampaignCost = sustainabilityData.campaigns.reduce((sum, c) => sum + c.cost, 0)
  const totalCampaignRevenue = sustainabilityData.campaigns.reduce((sum, c) => sum + c.revenue, 0)
  const campaignROI = totalCampaignCost > 0 ? ((totalCampaignRevenue - totalCampaignCost) / totalCampaignCost) * 100 : 0

  const calculationTexts = {
    repeatCustomerRate: "Repeat Customer Rate = (Repeat Customers ÷ Total Customers) × 100%\n\nMeasures customer loyalty and satisfaction.",
    churnRate: "Churn Rate = (Customers Lost ÷ Total Customers) × 100%\n\nMeasures customer retention.",
    netRetention: "Net Retention Rate = Repeat Customer Rate - Churn Rate\n\nIndicates overall customer retention health.",
    campaignROI: "Campaign ROI = (Revenue - Cost) ÷ Cost × 100%\n\nMeasures marketing campaign effectiveness.",
  }

  return (
    <div>
      <KeyQuestionBox
        question="Is demand repeatable? Will demand persist without constant spend?"
        signals="Referral rates, repeat customers, CAC trends"
        decisions="Build demand engine, focus on retention, optimize campaigns"
        section="demand-sustainability"
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
        <h2 style={{ color: "#5d4037", fontSize: "24px", fontWeight: "700", margin: 0 }}>Demand Sustainability</h2>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {!isInvestorView && (
            <button
              onClick={onAddData}
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

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "30px" }}>
        {renderKPICard("Repeat Customer Rate", "repeatCustomerRate", calculationTexts.repeatCustomerRate, true, 0)}
        {renderKPICard("Churn Rate", "churnRate", calculationTexts.churnRate, true, 1)}
        {renderKPICard("Net Retention", "netRetention", calculationTexts.netRetention, true, 2)}
        {renderKPICard("Campaign ROI", "campaignROI", calculationTexts.campaignROI, true, 3)}
      </div>

      {/* Campaign Table */}
      <div style={{ 
        backgroundColor: "#f5f0eb", 
        padding: "15px", 
        borderRadius: "6px",
        marginBottom: "20px"
      }}>
        <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "10px" }}>Campaign Performance</h4>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#5d4037", color: "#fdfcfb" }}>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "13px" }}>Campaign</th>
                <th style={{ padding: "12px", textAlign: "right", fontSize: "13px" }}>Cost</th>
                <th style={{ padding: "12px", textAlign: "right", fontSize: "13px" }}>Revenue</th>
                <th style={{ padding: "12px", textAlign: "right", fontSize: "13px" }}>ROI %</th>
              </tr>
            </thead>
            <tbody>
              {sustainabilityData.campaigns.map((campaign, index) => {
                const roi = campaign.cost > 0 ? ((campaign.revenue - campaign.cost) / campaign.cost) * 100 : 0
                return (
                  <tr
                    key={index}
                    style={{
                      borderBottom: "1px solid #e8ddd4",
                      backgroundColor: index % 2 === 0 ? "#fdfcfb" : "#f5f0eb",
                    }}
                  >
                    <td style={{ padding: "10px", fontSize: "13px", color: "#5d4037", fontWeight: "600" }}>
                      {campaign.name}
                    </td>
                    <td style={{ padding: "10px", fontSize: "13px", color: "#5d4037", textAlign: "right" }}>
                      {formatCurrency(campaign.cost)}
                    </td>
                    <td style={{ padding: "10px", fontSize: "13px", color: "#5d4037", textAlign: "right" }}>
                      {formatCurrency(campaign.revenue)}
                    </td>
                    <td style={{ 
                      padding: "10px", 
                      fontSize: "13px", 
                      color: roi >= 0 ? "#16a34a" : "#dc2626", 
                      textAlign: "right",
                      fontWeight: "600"
                    }}>
                      {roi.toFixed(1)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

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
          isPercentage={selectedTrendItem.isPercentage}
        />
      )}
    </div>
  )
}

// ==================== MAIN MARKETING SALES COMPONENT ====================

export default function MarketingSales() {
  const [activeSection, setActiveSection] = useState("pipeline-visibility")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [user, setUser] = useState(null)
  const [showFullDescription, setShowFullDescription] = useState(false)

  const [isInvestorView, setIsInvestorView] = useState(false)
  const [viewingSMEId, setViewingSMEId] = useState(null)
  const [viewingSMEName, setViewingSMEName] = useState("")
  
  const [showAddDataModal, setShowAddDataModal] = useState(false)
  const [loading, setLoading] = useState(false)

  // Date range state
  const [startDate, setStartDate] = useState({ year: new Date().getFullYear(), month: "Jan" })
  const [endDate, setEndDate] = useState({ year: new Date().getFullYear(), month: "Dec" })

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
    { id: "pipeline-visibility", label: "Pipeline Visibility" },
    { id: "pipeline-sufficiency", label: "Pipeline Sufficiency" },
    { id: "revenue-concentration", label: "Revenue Concentration" },
    { id: "demand-sustainability", label: "Demand Sustainability" },
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
                Investor View: Viewing {viewingSMEName}'s Marketing & Sales Data
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
              }}
            >
              Back to My Cohorts
            </button>
          </div>
        )}

        <div style={{ padding: "20px", paddingTop: "40px", marginLeft: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h1 style={{ color: "#5d4037", fontSize: "32px", fontWeight: "700", margin: 0 }}>
              Marketing & Pipeline Performance
            </h1>
          </div>

          {/* About Dashboard */}
          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              marginBottom: "30px",
              border: "1px solid #5d4037",
            }}
          >
            <div
              onClick={() => setShowFullDescription(!showFullDescription)}
              style={{
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                color: "#5d4037",
                fontWeight: "600",
              }}
            >
              <span>About this Dashboard</span>
              <span>{showFullDescription ? "▼" : "▶"}</span>
            </div>

            {showFullDescription && (
              <div style={{ marginTop: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div>
                    <h3 style={{ color: "#7d5a50", marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>
                      What this dashboard DOES
                    </h3>
                    <ul style={{ color: "#4a352f", fontSize: "14px", lineHeight: "1.7", margin: 0, paddingLeft: "20px" }}>
                      <li>Assesses pipeline visibility, quality, and concentration</li>
                      <li>Evaluates demand risk and market exposure</li>
                      <li>Monitors lead generation effectiveness and conversion rates</li>
                      <li>Measures customer acquisition cost and marketing ROI</li>
                      <li>Tracks sales cycle efficiency and pipeline velocity</li>
                    </ul>
                  </div>

                  <div>
                    <h3 style={{ color: "#7d5a50", marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>
                      What this dashboard does NOT do
                    </h3>
                    <ul style={{ color: "#4a352f", fontSize: "14px", lineHeight: "1.7", margin: 0, paddingLeft: "20px" }}>
                      <li>Run marketing campaigns or ad management</li>
                      <li>Manage CRM or customer relationship tracking</li>
                      <li>Track social media engagement or content scheduling</li>
                      <li>Email marketing automation or lead nurturing</li>
                      <li>SEO optimization or website analytics management</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Date Range Picker */}
          <div style={{ marginBottom: "30px" }}>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
          </div>

          {/* Section Buttons */}
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

          {/* Section Components */}
          <PipelineVisibility
            activeSection={activeSection}
            currentUser={user}
            isInvestorView={isInvestorView}
            onAddData={() => setShowAddDataModal(true)}
            startDate={startDate}
            endDate={endDate}
          />
          <PipelineSufficiency
            activeSection={activeSection}
            currentUser={user}
            isInvestorView={isInvestorView}
            onAddData={() => setShowAddDataModal(true)}
            startDate={startDate}
            endDate={endDate}
          />
          <RevenueConcentration
            activeSection={activeSection}
            currentUser={user}
            isInvestorView={isInvestorView}
            onAddData={() => setShowAddDataModal(true)}
            startDate={startDate}
            endDate={endDate}
          />
          <DemandSustainability
            activeSection={activeSection}
            currentUser={user}
            isInvestorView={isInvestorView}
            onAddData={() => setShowAddDataModal(true)}
            startDate={startDate}
            endDate={endDate}
          />
        </div>
      </div>

      {/* Universal Add Data Modal */}
      <UniversalAddDataModal
        isOpen={showAddDataModal}
        onClose={() => setShowAddDataModal(false)}
        currentTab={activeSection}
        user={user}
        onSave={() => {
          setLoading(true)
          setTimeout(() => setLoading(false), 1000)
        }}
        loading={loading}
      />
    </div>
  )
}