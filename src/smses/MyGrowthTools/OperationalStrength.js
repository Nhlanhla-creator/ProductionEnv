"use client"

import { useState, useEffect } from "react"
import { Bar, Line, Pie } from "react-chartjs-2"
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db, auth } from "../../firebaseConfig"
import { onAuthStateChanged } from "firebase/auth"
import { DateRangePicker } from "./financial/components/SharedComponents"
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

// Helper function to format numbers to 2 decimal places
const formatToTwoDecimals = (value) => {
  if (value === null || value === undefined || value === "") return ""
  const num = Number(value)
  if (isNaN(num)) return value
  return Number(num.toFixed(2))
}

// Helper function to parse and validate number inputs
const parseToTwoDecimals = (value) => {
  if (value === null || value === undefined || value === "") return ""
  const num = Number(value)
  if (isNaN(num)) return ""
  return Math.round(num * 100) / 100
}

// Helper function to get months array based on year
const getMonthsForYear = (year, viewMode = "month") => {
  if (viewMode === "year") return [`FY ${year}`]
  if (viewMode === "quarter") return ["Q1", "Q2", "Q3", "Q4"]
  
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return months
}

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

// Eye Icon Component
const EyeIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#8d6e63"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
)

// Chart View Modal Component with AI Analysis Section
const ChartViewModal = ({ isOpen, onClose, kpiData, historicalData = [] }) => {
  const _now = new Date()
  const _toDefault = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, "0")}`
  const _fromDefault = (() => {
    const d = new Date(_now.getFullYear(), _now.getMonth() - 11, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  })()
  const [filterMode, setFilterMode] = useState("range")
  const [fromDate, setFromDate] = useState(_fromDefault)
  const [toDate, setToDate] = useState(_toDefault)
  const [aiAnalysis, setAiAnalysis] = useState("")
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false)

  // Build ordered "Mon YYYY" labels between fromDate and toDate
  const buildRangeLabels = () => {
    if (!fromDate || !toDate) return []
    const allMonths = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    const [fy, fm] = fromDate.split("-").map(Number)
    const [ty, tm] = toDate.split("-").map(Number)
    const labels = []
    let y = fy, m = fm
    while (y < ty || (y === ty && m <= tm)) {
      labels.push(`${allMonths[m - 1]} ${y}`)
      m++
      if (m > 12) { m = 1; y++ }
    }
    return labels
  }
  
  // Brown color shades for charts
  const brownShades = [
    "#3E2723", // Darkest
    "#5D4037",
    "#795548",
    "#8D6E63",
    "#A1887F",
    "#BCAAA4",
    "#D7CCC8",
    "#EFEBE9" // Lightest
  ]
  
  useEffect(() => {
    if (isOpen && kpiData && !aiAnalysis) {
      generateAiAnalysis()
    }
  }, [isOpen, kpiData])
  
  const generateAiAnalysis = async () => {
    setGeneratingAnalysis(true)
    try {
      // Simulate AI analysis generation
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const analysis = `Based on the trend analysis for ${kpiData.kpi}:

🎯 **Performance Summary**: The current value of ${formatToTwoDecimals(kpiData.currentValue)} ${kpiData.units} is ${kpiData.currentValue > kpiData.target ? 'above' : 'below'} the target of ${formatToTwoDecimals(kpiData.target)} ${kpiData.units}.

📈 **Trend Insight**: Historical data shows ${Math.random() > 0.5 ? 'an improving' : 'a declining'} trend over the past 12 months, with ${Math.random() > 0.5 ? 'notable improvement' : 'some fluctuations'} in Q${Math.floor(Math.random() * 4) + 1}.

⚠️ **Key Observations**: 
• ${kpiData.currentValue > kpiData.target ? 'Excellent performance exceeding targets' : 'Attention needed to meet targets'}
• ${Math.random() > 0.5 ? 'Seasonal patterns detected' : 'Consistent performance observed'}
• ${Math.random() > 0.5 ? 'Strong correlation with production volume' : 'Independent of external factors'}

💡 **Recommendations**:
1. ${kpiData.currentValue > kpiData.target ? 'Maintain current performance levels' : 'Implement improvement initiatives'}
2. ${Math.random() > 0.5 ? 'Monitor monthly variations' : 'Focus on quarterly targets'}
3. ${Math.random() > 0.5 ? 'Review supplier dependencies' : 'Optimize resource allocation'}

📊 **Confidence Level**: ${Math.floor(Math.random() * 30) + 70}% accurate based on historical patterns.`

      setAiAnalysis(analysis)
    } catch (error) {
      console.error("Error generating AI analysis:", error)
      setAiAnalysis("AI analysis temporarily unavailable. Please try again later.")
    } finally {
      setGeneratingAnalysis(false)
    }
  }
  
  if (!isOpen || !kpiData) return null

  const rangeLabels = buildRangeLabels()

  // Generate chart data for each label in the selected range
  const generateChartData = () => {
    const baseValue = kpiData.currentValue || 50
    const chartData = rangeLabels.map((_, i) => {
      const trend = 1 + (i / Math.max(rangeLabels.length - 1, 1)) * 0.05
      const variation = (Math.random() - 0.5) * baseValue * 0.3
      return Math.max(0, parseToTwoDecimals(baseValue * trend + variation))
    })

    return {
      labels: rangeLabels,
      datasets: [{
        label: `${kpiData.kpi}`,
        data: chartData,
        backgroundColor: brownShades[1] + "80", // 80 = 50% opacity
        borderColor: brownShades[0],
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: brownShades[0],
        pointRadius: 5,
        pointHoverRadius: 8,
      }]
    }
  }
  
  const chartData = generateChartData()
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
      display: false // This disables datalabels for this specific chart
    },
      legend: {
        position: 'top',
        labels: {
          color: "#5d4037",
          font: {
            size: 12,
          },
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: "rgba(93, 64, 55, 0.95)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 14 },
        borderColor: "#5d4037",
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              const value = formatToTwoDecimals(context.parsed.y);
              label += value;
              if (kpiData.units === '%') {
                label += '%';
              } else if (kpiData.units === 'R') {
                label = 'R' + value;
              } else {
                label += ' ' + kpiData.units;
              }
            }
            return label;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(232, 221, 212, 0.5)",
        },
        ticks: {
          color: "#5d4037",
          font: { size: 12 },
          callback: function(value) {
            const formatted = formatToTwoDecimals(value);
            if (kpiData.units === '%') return formatted + '%'
            if (kpiData.units === 'R') return 'R' + formatted
            return formatted
          }
        },
      },
      x: {
        grid: {
          color: "rgba(232, 221, 212, 0.3)",
        },
        ticks: {
          color: "#5d4037",
          font: { size: 12 }
        },
      },
    },
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "#fdfcfb",
          padding: "30px",
          borderRadius: "12px",
          maxWidth: "1000px",
          maxHeight: "90vh",
          overflow: "auto",
          width: "100%",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "25px" }}>
          <div>
            <h3 style={{ color: "#5d4037", margin: 0, fontSize: "22px", fontWeight: "700" }}>
              {kpiData.kpi} Analysis
            </h3>
            <div style={{ display: "flex", gap: "10px", marginTop: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{
                backgroundColor: "#e8ddd4",
                color: "#5d4037",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "600",
              }}>
                {kpiData.category} → {kpiData.subCategory}
              </span>
              <span style={{ color: "#8d6e63", fontSize: "14px" }}>
                Units: {kpiData.units}
              </span>
              <span style={{ color: "#8d6e63", fontSize: "14px" }}>
                Target: {formatToTwoDecimals(kpiData.target)} {kpiData.units}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "28px",
              color: "#5d4037",
              cursor: "pointer",
              padding: "0",
              lineHeight: "1",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              backgroundColor: "#f5f0eb",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#e8ddd4"
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#f5f0eb"
            }}
          >
            ×
          </button>
        </div>
        
        <div style={{ marginBottom: "20px" }}>
          <div style={{ marginBottom: "12px" }}>
            <DateRangePicker
              filterMode={filterMode}
              setFilterMode={setFilterMode}
              fromDate={fromDate}
              setFromDate={setFromDate}
              toDate={toDate}
              setToDate={setToDate}
            />
          </div>
          <div style={{ display: "flex", gap: "15px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={generateAiAnalysis}
              disabled={generatingAnalysis}
              style={{
                padding: "8px 16px",
                backgroundColor: "#5d4037",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "6px",
                cursor: generatingAnalysis ? "not-allowed" : "pointer",
                fontWeight: "600",
                fontSize: "14px",
                transition: "all 0.3s ease",
                opacity: generatingAnalysis ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {generatingAnalysis ? (
                <>
                  <span style={{ fontSize: "16px" }}>⟳</span>
                  Generating...
                </>
              ) : (
                <>
                  <span style={{ fontSize: "16px" }}>🤖</span>
                  Regenerate AI Analysis
                </>
              )}
            </button>
          </div>
        </div>
        
        <div style={{ 
          backgroundColor: "#f5f0eb", 
          padding: "20px", 
          borderRadius: "8px",
          height: "300px",
          marginBottom: "20px"
        }}>
          <div style={{ height: "100%" }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
        
        {/* AI Analysis Section */}
        <div style={{ 
          backgroundColor: "#e8f5e9", 
          padding: "20px", 
          borderRadius: "8px",
          border: "1px solid #c8e6c9",
          marginBottom: "20px"
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "10px", 
            marginBottom: "15px" 
          }}>
            <span style={{ fontSize: "20px" }}>🤖</span>
            <h4 style={{ 
              color: "#2e7d32", 
              margin: 0, 
              fontSize: "16px", 
              fontWeight: "700" 
            }}>
              AI Performance Analysis
            </h4>
            {generatingAnalysis && (
              <span style={{
                padding: "4px 10px",
                backgroundColor: "#ffebee",
                color: "#c62828",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "600",
              }}>
                Generating...
              </span>
            )}
          </div>
          
          {generatingAnalysis ? (
            <div style={{
              padding: "30px",
              textAlign: "center",
              color: "#5d4037",
              fontSize: "14px",
            }}>
              <div style={{ fontSize: "32px", marginBottom: "10px" }}>⟳</div>
              Generating AI-powered analysis for {kpiData.kpi}...
              <div style={{ 
                marginTop: "20px", 
                height: "4px", 
                backgroundColor: "#e8ddd4", 
                borderRadius: "2px",
                overflow: "hidden"
              }}>
                <div style={{
                  height: "100%",
                  backgroundColor: "#5d4037",
                  width: "60%",
                  animation: "loading 2s infinite"
                }}></div>
              </div>
            </div>
          ) : aiAnalysis ? (
            <div style={{ color: "#1b5e20", fontSize: "14px", lineHeight: "1.6" }}>
              {aiAnalysis.split('\n\n').map((paragraph, idx) => (
                <div key={idx} style={{ marginBottom: "12px" }}>
                  {paragraph.split('\n').map((line, lineIdx) => (
                    <div key={lineIdx} style={{ 
                      marginBottom: "8px",
                      paddingLeft: line.startsWith('•') || line.match(/^\d+\./) ? "20px" : "0"
                    }}>
                      {line}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "#666", fontSize: "14px", fontStyle: "italic" }}>
              AI analysis will appear here...
            </div>
          )}
        </div>
        
        <div style={{ 
          display: "flex", 
          justifyContent: "flex-end",
          marginTop: "25px",
          paddingTop: "20px",
          borderTop: "1px solid #e8ddd4",
          gap: "10px"
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 24px",
              backgroundColor: "#5d4037",
              color: "#fdfcfb",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#3e2723"
              e.target.style.transform = "translateY(-2px)"
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#5d4037"
              e.target.style.transform = "translateY(0)"
            }}
          >
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  )
}

// Add Data Modal Component with Category Sections, Spread Months, Add KPI Button, and Notes
const AddDataModal = ({ isOpen, onClose, kpiData }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [dataValues, setDataValues] = useState({})
  const [notes, setNotes] = useState("")
  const [activeCategory, setActiveCategory] = useState("supply-chain")
  const [newKPI, setNewKPI] = useState({ name: "", units: "", target: "" })
  const [showAddKPIForm, setShowAddKPIForm] = useState(false)
  
  // Brown color shades for charts
  const brownShades = [
    "#3E2723", // Darkest
    "#5D4037",
    "#795548",
    "#8D6E63",
    "#A1887F",
    "#BCAAA4",
    "#D7CCC8",
    "#EFEBE9" // Lightest
  ]
  
  // KPI structure for data entry
  const [kpiStructure, setKpiStructure] = useState([
    {
      id: "supply-chain",
      name: "Supply Chain",
      subCategories: [
        {
          name: "Supplier Dependency",
          kpis: [
            { name: "Top 3 Supplier %", units: "%", target: 70, currentValue: 79 },
            { name: "Single Source Flags", units: "#", target: 0, currentValue: 1 },
            { name: "Critical Supplier Count", units: "#", target: 5, currentValue: 16 }
          ]
        },
        {
          name: "Continuity Risk",
          kpis: [
            { name: "Lead Time Variance", units: "days", target: 2, currentValue: 2.3 },
            { name: "Stock Cover Days", units: "days", target: 30, currentValue: 27 },
            { name: "Disruption Risk Index", units: "index", target: 20, currentValue: 23 }
          ]
        }
      ]
    },
    {
      id: "delivery",
      name: "Delivery",
      subCategories: [
        {
          name: "Productivity",
          kpis: [
            { name: "Production Volume", units: "units", target: 10000, currentValue: 12800 },
            { name: "Availability %", units: "%", target: 95, currentValue: 93 },
            { name: "Utilization %", units: "%", target: 85, currentValue: 85 },
            { name: "Unit Cost", units: "R", target: 50, currentValue: 41 }
          ]
        },
        {
          name: "Reliability",
          kpis: [
            { name: "On-time Delivery %", units: "%", target: 98, currentValue: 96 },
            { name: "Rework Rate", units: "%", target: 2, currentValue: 1.1 },
            { name: "Defect Rate", units: "%", target: 1, currentValue: 0.1 }
          ]
        }
      ]
    },
    {
      id: "safety",
      name: "Safety",
      subCategories: [
        {
          name: "Safety Risk",
          kpis: [
            { name: "Safety Incidents", units: "#", target: 0, currentValue: 0 },
            { name: "Open Safety Actions", units: "#", target: 5, currentValue: 1 },
            { name: "Compliance Status %", units: "%", target: 100, currentValue: 100 }
          ]
        },
        {
          name: "Regulatory Compliance",
          kpis: [
            { name: "Regulatory Gaps", units: "#", target: 0, currentValue: 0 },
            { name: "Audit Findings", units: "#", target: 3, currentValue: 0 },
            { name: "Certification Status %", units: "%", target: 100, currentValue: 100 }
          ]
        }
      ]
    }
  ])

  useEffect(() => {
    if (isOpen) {
      // Initialize data values for all months
      const initialValues = {}
      const months = getMonthsForYear(selectedYear, "month")
      months.forEach(month => {
        // Initialize with random values based on year to show differences
        const yearMultiplier = 1 + (selectedYear - new Date().getFullYear()) * 0.15
        kpiStructure.forEach(category => {
          category.subCategories.forEach(subCategory => {
            subCategory.kpis.forEach(kpi => {
              const kpiKey = `${category.id}-${subCategory.name}-${kpi.name}-${month}`
              const baseValue = kpi.currentValue || 50
              const variation = Math.random() * (baseValue * 0.2) - (baseValue * 0.1)
              initialValues[kpiKey] = parseToTwoDecimals(baseValue * yearMultiplier + variation)
            })
          })
        })
      })
      setDataValues(initialValues)
    }
  }, [isOpen, selectedYear])

  if (!isOpen) return null
  
  const years = Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i)
  const months = getMonthsForYear(selectedYear, "month")
  const currentCategory = kpiStructure.find(cat => cat.id === activeCategory)
  
  const handleSave = async () => {
    setLoading(true)
    try {
      // Format all values to 2 decimals before saving
      const formattedDataValues = {}
      Object.keys(dataValues).forEach(key => {
        formattedDataValues[key] = parseToTwoDecimals(dataValues[key])
      })
      
      console.log("Saving data:", {
        category: activeCategory,
        year: selectedYear,
        dataValues: formattedDataValues,
        notes
      })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert("Data saved successfully!")
      onClose()
    } catch (error) {
      console.error("Error saving data:", error)
      alert("Error saving data. Please try again.")
    } finally {
      setLoading(false)
    }
  }
  
  const handleAddKPI = () => {
    if (!newKPI.name || !newKPI.units || !newKPI.target) {
      alert("Please fill in all KPI fields")
      return
    }
    
    const categoryIndex = kpiStructure.findIndex(cat => cat.id === activeCategory)
    if (categoryIndex === -1) return
    
    const subCategoryIndex = kpiStructure[categoryIndex].subCategories.findIndex(
      sub => sub.name === (kpiData?.subCategory || kpiStructure[categoryIndex].subCategories[0].name)
    )
    
    if (subCategoryIndex === -1) return
    
    const updatedStructure = [...kpiStructure]
    updatedStructure[categoryIndex].subCategories[subCategoryIndex].kpis.push({
      name: newKPI.name,
      units: newKPI.units,
      target: parseToTwoDecimals(newKPI.target),
      currentValue: 0
    })
    
    setKpiStructure(updatedStructure)
    setNewKPI({ name: "", units: "", target: "" })
    setShowAddKPIForm(false)
    
    // Initialize data for the new KPI across all months
    const newDataValues = { ...dataValues }
    months.forEach(month => {
      const kpiKey = `${activeCategory}-${updatedStructure[categoryIndex].subCategories[subCategoryIndex].name}-${newKPI.name}-${month}`
      newDataValues[kpiKey] = ""
    })
    setDataValues(newDataValues)
    
    alert("New KPI added successfully!")
  }

  const handleInputChange = (kpiKey, value) => {
    // Allow empty string or valid number
    if (value === "" || value === "-") {
      setDataValues(prev => ({
        ...prev,
        [kpiKey]: value
      }))
      return
    }
    
    // Parse to number and format to 2 decimals
    const num = parseFloat(value)
    if (!isNaN(num)) {
      setDataValues(prev => ({
        ...prev,
        [kpiKey]: parseToTwoDecimals(num)
      }))
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "#fdfcfb",
          padding: "30px",
          borderRadius: "12px",
          maxWidth: "1300px",
          maxHeight: "90vh",
          overflow: "auto",
          width: "100%",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "25px" }}>
          <div>
            <h3 style={{ color: "#5d4037", margin: 0, fontSize: "22px", fontWeight: "700" }}>
              Add Operational Data
            </h3>
            <p style={{ color: "#8d6e63", fontSize: "14px", marginTop: "5px", marginBottom: 0 }}>
              Enter data for operational KPIs by category - All months shown for {selectedYear}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "28px",
              color: "#5d4037",
              cursor: "pointer",
              padding: "0",
              lineHeight: "1",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              backgroundColor: "#f5f0eb",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#e8ddd4"
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#f5f0eb"
            }}
          >
            ×
          </button>
        </div>
        
        {/* Category Tabs */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "25px",
            paddingBottom: "10px",
            borderBottom: "1px solid #e8ddd4",
            flexWrap: "wrap",
          }}
        >
          {kpiStructure.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              style={{
                padding: "10px 20px",
                backgroundColor: activeCategory === category.id ? "#5d4037" : "#e8ddd4",
                color: activeCategory === category.id ? "#fdfcfb" : "#5d4037",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                transition: "all 0.3s ease",
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
        
        {/* Year Selection and Add KPI Button */}
        <div style={{ 
          marginBottom: "15px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px"
        }}>
          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            <span style={{ color: "#5d4037", fontSize: "14px", fontWeight: "600" }}>Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number.parseInt(e.target.value))}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #d7ccc8",
                fontSize: "14px",
                color: "#5d4037",
                minWidth: "100px",
                backgroundColor: "#fff",
                cursor: "pointer",
              }}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => setShowAddKPIForm(!showAddKPIForm)}
            style={{
              padding: "10px 20px",
              backgroundColor: "#8d6e63",
              color: "#fdfcfb",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#5d4037"
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#8d6e63"
            }}
          >
            <span style={{ fontSize: "18px" }}>+</span>
            {showAddKPIForm ? "Cancel Add KPI" : "Add New KPI"}
          </button>
        </div>
        
        {/* Add KPI Form */}
        {showAddKPIForm && (
          <div style={{
            backgroundColor: "#f0e6d6",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "20px",
            border: "1px solid #d7ccc8"
          }}>
            <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px", fontSize: "16px" }}>
              Add New KPI to {currentCategory?.name}
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600", fontSize: "13px" }}>
                  KPI Name
                </label>
                <input
                  type="text"
                  value={newKPI.name}
                  onChange={(e) => setNewKPI({...newKPI, name: e.target.value})}
                  placeholder="Enter KPI name"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #d7ccc8",
                    fontSize: "14px",
                    color: "#5d4037",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600", fontSize: "13px" }}>
                  Units
                </label>
                <select
                  value={newKPI.units}
                  onChange={(e) => setNewKPI({...newKPI, units: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #d7ccc8",
                    fontSize: "14px",
                    color: "#5d4037",
                    backgroundColor: "white",
                  }}
                >
                  <option value="">Select units</option>
                  <option value="%">%</option>
                  <option value="R">R</option>
                  <option value="#">#</option>
                  <option value="days">days</option>
                  <option value="units">units</option>
                  <option value="index">index</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600", fontSize: "13px" }}>
                  Target Value
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newKPI.target}
                  onChange={(e) => setNewKPI({...newKPI, target: parseToTwoDecimals(e.target.value)})}
                  placeholder="Enter target"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #d7ccc8",
                    fontSize: "14px",
                    color: "#5d4037",
                  }}
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setShowAddKPIForm(false)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#e8ddd4",
                  color: "#5d4037",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "13px",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddKPI}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "13px",
                }}
              >
                Add KPI
              </button>
            </div>
          </div>
        )}
        
        <div style={{ 
          marginBottom: "25px",
          overflowX: "auto"
        }}>
          {/* KPIs for selected category - All months spread horizontally */}
          {currentCategory?.subCategories.map((subCategory, subIndex) => (
            <div key={subIndex} style={{ 
              backgroundColor: "#f5f0eb", 
              padding: "20px", 
              borderRadius: "8px",
              marginBottom: "20px"
            }}>
              <h5 style={{ 
                color: "#5d4037", 
                marginTop: 0, 
                marginBottom: "20px",
                fontSize: "16px",
                fontWeight: "600",
                backgroundColor: "#e8ddd4",
                padding: "10px 15px",
                borderRadius: "6px"
              }}>
                {subCategory.name}
              </h5>
              
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
                  <thead>
                    <tr>
                      <th style={{ 
                        padding: "12px", 
                        textAlign: "left", 
                        color: "#5d4037", 
                        fontWeight: "600",
                        borderBottom: "2px solid #d7ccc8",
                        position: "sticky",
                        left: 0,
                        backgroundColor: "#f5f0eb"
                      }}>
                        KPI
                      </th>
                      <th style={{ 
                        padding: "12px", 
                        textAlign: "center", 
                        color: "#5d4037", 
                        fontWeight: "600",
                        borderBottom: "2px solid #d7ccc8",
                        backgroundColor: "#e8ddd4"
                      }}>
                        Units
                      </th>
                      <th style={{ 
                        padding: "12px", 
                        textAlign: "center", 
                        color: "#5d4037", 
                        fontWeight: "600",
                        borderBottom: "2px solid #d7ccc8",
                        backgroundColor: "#f0e6d6"
                      }}>
                        Target
                      </th>
                      {months.map((month, index) => (
                        <th key={month} style={{ 
                          padding: "8px", 
                          textAlign: "center", 
                          color: "#5d4037", 
                          fontWeight: "600",
                          borderBottom: "2px solid #d7ccc8",
                          backgroundColor: index % 2 === 0 ? "#f9f4ef" : "#f5f0eb",
                          minWidth: "80px"
                        }}>
                          {month}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subCategory.kpis.map((kpi, kpiIndex) => (
                      <tr key={kpiIndex} style={{ 
                        borderBottom: "1px solid #e8ddd4",
                        backgroundColor: kpiIndex % 2 === 0 ? "#fdfcfb" : "#f9f4ef"
                      }}>
                        <td style={{ 
                          padding: "12px", 
                          color: "#5d4037",
                          position: "sticky",
                          left: 0,
                          backgroundColor: kpiIndex % 2 === 0 ? "#fdfcfb" : "#f9f4ef"
                        }}>
                          {kpi.name}
                        </td>
                        <td style={{ 
                          padding: "12px", 
                          textAlign: "center", 
                          color: "#8d6e63",
                          backgroundColor: "#e8ddd4"
                        }}>
                          {kpi.units}
                        </td>
                        <td style={{ 
                          padding: "12px", 
                          textAlign: "center", 
                          color: "#5d4037",
                          fontWeight: "600",
                          backgroundColor: "#f0e6d6"
                        }}>
                          {formatToTwoDecimals(kpi.target)}
                        </td>
                        {months.map((month, monthIndex) => {
                          const kpiKey = `${currentCategory.id}-${subCategory.name}-${kpi.name}-${month}`
                          return (
                            <td key={month} style={{ 
                              padding: "8px",
                              textAlign: "center"
                            }}>
                              <input
                                type="number"
                                step="0.01"
                                value={dataValues[kpiKey] !== undefined ? dataValues[kpiKey] : ""}
                                placeholder="-"
                                style={{
                                  width: "100%",
                                  padding: "6px",
                                  borderRadius: "4px",
                                  border: "1px solid #d7ccc8",
                                  fontSize: "13px",
                                  color: "#5d4037",
                                  textAlign: "center",
                                  backgroundColor: "white"
                                }}
                                onChange={(e) => handleInputChange(kpiKey, e.target.value)}
                              />
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
        
        {/* Notes Section */}
        <div style={{ marginTop: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
            Notes on Data Entry
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes or comments about this data entry. Include observations, anomalies, or contextual information that might be helpful for analysis..."
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "6px",
              border: "1px solid #d7ccc8",
              fontSize: "14px",
              color: "#5d4037",
              minHeight: "100px",
              resize: "vertical",
            }}
          />
          <div style={{ fontSize: "12px", color: "#8d6e63", marginTop: "5px" }}>
            These notes will be saved with the data and visible when viewing charts.
          </div>
        </div>
        
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginTop: "25px",
          paddingTop: "20px",
          borderTop: "1px solid #e8ddd4"
        }}>
          <div style={{ fontSize: "13px", color: "#8d6e63" }}>
            All values will be rounded to 2 decimal places when saved. Enter values for all months at once.
          </div>
          
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={onClose}
              style={{
                padding: "10px 24px",
                backgroundColor: "#e8ddd4",
                color: "#5d4037",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#d7ccc8"
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#e8ddd4"
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                padding: "10px 24px",
                backgroundColor: "#5d4037",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "600",
                fontSize: "14px",
                transition: "all 0.3s ease",
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = "#3e2723"
                  e.target.style.transform = "translateY(-2px)"
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = "#5d4037"
                  e.target.style.transform = "translateY(0)"
                }
              }}
            >
              {loading ? "Saving..." : "Save All Data"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// KPI Dashboard Component with Eye Icon instead of View button
const KPIDashboard = ({ activeSection, isInvestorView, financialYearStartMonth }) => {
  const [allData, setAllData] = useState({})
  const [currentUser, setCurrentUser] = useState(null)
  const [kpiViewMode, setKpiViewMode] = useState("month")
  const [selectedKPI, setSelectedKPI] = useState(null)
  const [showAddDataModal, setShowAddDataModal] = useState(false)
  const [showChartModal, setShowChartModal] = useState(false)
  
  // CORRECT KPI structure with Category → Sub-Category → KPI hierarchy
  const kpiStructure = [
    {
      category: "Supply Chain",
      subCategories: [
        {
          name: "Supplier Dependency",
          kpis: [
            { name: "Top 3 Supplier %", units: "%", target: 70, currentValue: 79 },
            { name: "Single Source Flags", units: "#", target: 0, currentValue: 1 },
            { name: "Critical Supplier Count", units: "#", target: 5, currentValue: 16 }
          ]
        },
        {
          name: "Continuity Risk",
          kpis: [
            { name: "Lead Time Variance", units: "days", target: 2, currentValue: 2.3 },
            { name: "Stock Cover Days", units: "days", target: 30, currentValue: 27 },
            { name: "Disruption Risk Index", units: "index", target: 20, currentValue: 23 }
          ]
        }
      ]
    },
    {
      category: "Delivery",
      subCategories: [
        {
          name: "Productivity",
          kpis: [
            { name: "Production Volume", units: "units", target: 10000, currentValue: 12800 },
            { name: "Availability %", units: "%", target: 95, currentValue: 93 },
            { name: "Utilization %", units: "%", target: 85, currentValue: 85 },
            { name: "Unit Cost", units: "R", target: 50, currentValue: 41 }
          ]
        },
        {
          name: "Reliability",
          kpis: [
            { name: "On-time Delivery %", units: "%", target: 98, currentValue: 96 },
            { name: "Rework Rate", units: "%", target: 2, currentValue: 1.1 },
            { name: "Defect Rate", units: "%", target: 1, currentValue: 0.1 }
          ]
        }
      ]
    },
    {
      category: "Safety",
      subCategories: [
        {
          name: "Safety Risk",
          kpis: [
            { name: "Safety Incidents", units: "#", target: 0, currentValue: 0 },
            { name: "Open Safety Actions", units: "#", target: 5, currentValue: 1 },
            { name: "Compliance Status %", units: "%", target: 100, currentValue: 100 }
          ]
        },
        {
          name: "Regulatory Compliance",
          kpis: [
            { name: "Regulatory Gaps", units: "#", target: 0, currentValue: 0 },
            { name: "Audit Findings", units: "#", target: 3, currentValue: 0 },
            { name: "Certification Status %", units: "%", target: 100, currentValue: 100 }
          ]
        }
      ]
    }
  ]

  // Format all KPI values to 2 decimals on load
  useEffect(() => {
    kpiStructure.forEach(category => {
      category.subCategories.forEach(subCategory => {
        subCategory.kpis.forEach(kpi => {
          kpi.target = parseToTwoDecimals(kpi.target)
          kpi.currentValue = parseToTwoDecimals(kpi.currentValue)
        })
      })
    })
  }, [])

    const parseToTwoDecimals = (value) => {
  if (typeof value === 'number') {
    return Math.round(value * 100) / 100
  }
  return value
}


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


  const loadAllData = async (userId) => {
    try {
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
            // Format all numbers to 2 decimals when loading
            const docData = docSnap.data()
            Object.keys(docData).forEach(key => {
              if (typeof docData[key] === 'number') {
                docData[key] = parseToTwoDecimals(docData[key])
              }
            })
            data[section] = docData
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

  const handleViewChart = (category, subCategory, kpi) => {
    setSelectedKPI({
      category: category,
      subCategory: subCategory.name,
      kpi: kpi.name,
      units: kpi.units,
      target: kpi.target,
      currentValue: kpi.currentValue
    })
    setShowChartModal(true)
  }

  const handleDownloadCSV = () => {
    const headers = ["Category", "Sub-Category", "KPI", "Units", "Target", "Current Value", "Variance", "Status"]
    const rows = []
    
    kpiStructure.forEach(category => {
      category.subCategories.forEach(subCategory => {
        subCategory.kpis.forEach(kpi => {
          const variance = typeof kpi.currentValue === 'number' && typeof kpi.target === 'number' 
            ? parseToTwoDecimals(kpi.currentValue - kpi.target)
            : "N/A"
          
          const status = typeof variance === 'number' 
            ? variance >= 0 ? "On Target" : "Below Target"
            : "N/A"
          
          rows.push([
            category.category,
            subCategory.name,
            kpi.name,
            kpi.units,
            formatToTwoDecimals(kpi.target),
            formatToTwoDecimals(kpi.currentValue),
            formatToTwoDecimals(variance),
            status
          ])
        })
      })
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
            Operational Performance Metrics Overview (All values shown to 2 decimal places)
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
          {!isInvestorView && (
            <button
              onClick={() => setShowAddDataModal(true)}
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
              + Add Data
            </button>
          )}
        </div>
      </div>
<div style={{ overflowX: "auto" }}>
  {kpiStructure.map((category, categoryIndex) => (
    <div key={category.category} style={{ marginBottom: "40px" }}>
      {/* Category Heading with decorative elements */}
      <div style={{
        display: "flex",
        alignItems: "center",
        marginBottom: "15px",
      }}>
        <div style={{
          width: "8px",
          height: "32px",
          backgroundColor: categoryIndex === 0 ? "#5d4037" : categoryIndex === 1 ? "#8d6e63" : "#a67c52",
          borderRadius: "4px",
          marginRight: "12px",
        }} />
        <h3 style={{
          color: "#4a352f",
          margin: 0,
          fontSize: "18px",
          fontWeight: "700",
          letterSpacing: "0.5px",
        }}>
          {category.category}
        </h3>
        <div style={{
          flex: 1,
          height: "2px",
          background: "linear-gradient(90deg, #9c8269 0%, #e8ddd4 100%)",
          marginLeft: "20px",
        }} />
      </div>
      
      {/* Table for this category with enhanced borders */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          backgroundColor: "white",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          marginBottom: "20px",
          border: `2px solid ${
            categoryIndex === 0 ? "#5d4037" : 
            categoryIndex === 1 ? "#8d6e63" : 
            "#a67c52"
          }`,
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <thead>
          <tr style={{ 
            backgroundColor: categoryIndex === 0 ? "#5d4037" : 
                           categoryIndex === 1 ? "#8d6e63" : 
                           "#a67c52",
          }}>
            <th style={{ 
              padding: "14px 12px", 
              textAlign: "left", 
              color: "white", 
              fontWeight: "bold", 
              borderRight: "2px solid rgba(255,255,255,0.2)", 
              width: "180px",
              fontSize: "14px",
            }}>
              Category
            </th>
            <th style={{ 
              padding: "14px 12px", 
              textAlign: "left", 
              color: "white", 
              fontWeight: "bold", 
              borderRight: "2px solid rgba(255,255,255,0.2)",
              fontSize: "14px",
            }}>
              KPI
            </th>
            <th style={{ 
              padding: "14px 12px", 
              textAlign: "center", 
              color: "white", 
              fontWeight: "bold", 
              borderRight: "2px solid rgba(255,255,255,0.2)", 
              width: "80px",
              fontSize: "14px",
            }}>
              Units
            </th>
            <th style={{ 
              padding: "14px 12px", 
              textAlign: "center", 
              color: "white", 
              fontWeight: "bold", 
              borderRight: "2px solid rgba(255,255,255,0.2)", 
              backgroundColor: "rgba(255,255,255,0.15)",
              fontSize: "14px",
            }}>
              Target
            </th>
            <th style={{ 
              padding: "14px 12px", 
              textAlign: "center", 
              color: "white", 
              fontWeight: "bold", 
              borderRight: "2px solid rgba(255,255,255,0.2)", 
              backgroundColor: "rgba(255,255,255,0.1)",
              fontSize: "14px",
            }}>
              Current
            </th>
            <th style={{ 
              padding: "14px 12px", 
              textAlign: "center", 
              color: "white", 
              fontWeight: "bold", 
              borderRight: "2px solid rgba(255,255,255,0.2)", 
              backgroundColor: "rgba(255,255,255,0.05)",
              fontSize: "14px",
            }}>
              Variance
            </th>
            <th style={{ 
              padding: "14px 12px", 
              textAlign: "center", 
              color: "white", 
              fontWeight: "bold", 
              backgroundColor: "rgba(0,0,0,0.2)", 
              width: "80px",
              fontSize: "14px",
            }}>
              Chart
            </th>
          </tr>
        </thead>
        <tbody>
          {category.subCategories.map((subCategory, subCategoryIndex) => (
            subCategory.kpis.map((kpi, kpiIndex) => {
              const isFirstKPIInSubCategory = kpiIndex === 0
              const variance = typeof kpi.currentValue === 'number' && typeof kpi.target === 'number' 
                ? kpi.currentValue - kpi.target
                : "N/A"
              
              return (
                <tr
                  key={`${category.category}-${subCategory.name}-${kpi.name}`}
                  style={{
                    backgroundColor: (subCategoryIndex + kpiIndex) % 2 === 0 ? "#faf7f2" : "#f5f0eb",
                    borderBottom: subCategoryIndex === category.subCategories.length - 1 && 
                                 kpiIndex === subCategory.kpis.length - 1 
                                 ? "none" 
                                 : "2px solid #e8ddd4",
                  }}
                >
                  {isFirstKPIInSubCategory ? (
                    <td
                      rowSpan={subCategory.kpis.length}
                      style={{
                        padding: "14px 12px",
                        color: "#5d4037",
                        borderRight: "2px solid #d7ccc8",
                        backgroundColor: subCategoryIndex % 2 === 0 ? "#f0e6d6" : "#e8e0d1",
                        fontWeight: "700",
                        fontSize: "14px",
                        width: "180px",
                        borderBottom: subCategoryIndex === category.subCategories.length - 1 
                                     ? "none" 
                                     : "2px solid #d7ccc8",
                        boxShadow: "inset -2px 0 0 rgba(93, 64, 55, 0.1)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span style={{
                          display: "inline-block",
                          width: "6px",
                          height: "6px",
                          backgroundColor: "#5d4037",
                          borderRadius: "50%",
                          marginRight: "8px",
                        }} />
                        {subCategory.name}
                      </div>
                    </td>
                  ) : null}
                  
                  <td style={{ 
                    padding: "14px 12px", 
                    color: "#4a352f", 
                    borderRight: "2px solid #d7ccc8",
                    fontWeight: "500",
                  }}>
                    {kpi.name}
                  </td>
                  
                  <td style={{ 
                    padding: "14px 12px", 
                    textAlign: "center", 
                    color: "#4a352f", 
                    borderRight: "2px solid #d7ccc8", 
                    width: "80px",
                    backgroundColor: "rgba(215, 204, 200, 0.2)",
                  }}>
                    {kpi.units}
                  </td>
                  
                  <td style={{ 
                    padding: "14px 12px", 
                    textAlign: "center", 
                    color: "#5d4037", 
                    borderRight: "2px solid #d7ccc8",
                    backgroundColor: "#f0e6d6",
                    fontWeight: "600",
                  }}>
                    {kpi.target}
                  </td>
                  
                  <td style={{ 
                    padding: "14px 12px", 
                    textAlign: "center", 
                    color: "#4a352f", 
                    borderRight: "2px solid #d7ccc8",
                    backgroundColor: "#e8e0d1",
                    fontWeight: "600",
                  }}>
                    {kpi.currentValue}
                  </td>
                  
                  <td style={{ 
                    padding: "14px 12px", 
                    textAlign: "center", 
                    color: typeof variance === 'number' ? (variance >= 0 ? "#2e7d32" : "#c62828") : "#5d4037", 
                    fontWeight: "bold",
                    borderRight: "2px solid #d7ccc8",
                    backgroundColor: typeof variance === 'number' 
                      ? (variance >= 0 ? "#e8f5e9" : "#ffebee") 
                      : "#f5f0eb",
                  }}>
                    {typeof variance === 'number' ? (variance >= 0 ? '+' : '') + variance.toFixed(2) : variance}
                  </td>
                  
                  <td style={{ 
                    padding: "14px 12px", 
                    textAlign: "center",
                    backgroundColor: "#f5f0eb",
                  }}>
                    <button
                      onClick={() => handleViewChart(category.category, subCategory, kpi)}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "transparent",
                        color: "#5d4037",
                        border: `2px solid ${
                          categoryIndex === 0 ? "#5d4037" : 
                          categoryIndex === 1 ? "#8d6e63" : 
                          "#a67c52"
                        }`,
                        borderRadius: "6px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto",
                        transition: "all 0.3s ease",
                        width: "40px",
                        height: "40px",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = categoryIndex === 0 ? "#5d4037" : 
                                                       categoryIndex === 1 ? "#8d6e63" : 
                                                       "#a67c52"
                        e.target.style.transform = "scale(1.1)"
                        e.target.style.color = "white"
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "transparent"
                        e.target.style.transform = "scale(1)"
                        e.target.style.color = "#5d4037"
                      }}
                      title="View Chart & AI Analysis"
                    >
                      <EyeIcon size={20} />
                    </button>
                  </td>
                </tr>
              )
            })
          ))}
        </tbody>
      </table>
      
      {/* Category footer with subtle border */}
      <div style={{
        marginTop: "5px",
        padding: "8px 15px",
        backgroundColor: categoryIndex === 0 ? "rgba(93, 64, 55, 0.05)" : 
                        categoryIndex === 1 ? "rgba(141, 110, 99, 0.05)" : 
                        "rgba(166, 124, 82, 0.05)",
        borderRadius: "0 0 8px 8px",
        borderLeft: `4px solid ${
          categoryIndex === 0 ? "#5d4037" : 
          categoryIndex === 1 ? "#8d6e63" : 
          "#a67c52"
        }`,
        fontSize: "12px",
        color: "#8d6e63",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span>
          <strong>{category.subCategories.length} categories</strong> • 
          <strong> {category.subCategories.reduce((total, sc) => total + sc.kpis.length, 0)} KPIs</strong>
        </span>
        <span style={{ fontStyle: "italic" }}>
          Last updated: {new Date().toLocaleDateString()}
        </span>
      </div>
    </div>
  ))}
  
  {/* Tip section - enhanced with gradient border */}
  <div style={{ 
    marginTop: "30px", 
    padding: "20px 25px", 
    background: "linear-gradient(135deg, #f1f8e9 0%, #e8f5e9 100%)", 
    borderRadius: "12px",
    border: "2px solid #a5d6a7",
    boxShadow: "0 4px 12px rgba(76, 175, 80, 0.2)",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
      <div style={{
        width: "40px",
        height: "40px",
        backgroundColor: "#4caf50",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "24px",
        color: "white",
      }}>
        💡
      </div>
      <div>
        <span style={{ color: "#2e7d32", fontSize: "16px", fontWeight: "600", display: "block", marginBottom: "4px" }}>
          Pro Tip
        </span>
        <span style={{ color: "#1b5e20", fontSize: "14px" }}>
          Click the 👁️ icon to view charts and AI-powered analysis for each KPI. 
          Use "+ Add Data" button to enter values for multiple KPIs at once. 
          Each category table is color-coded for easy identification.
        </span>
      </div>
    </div>
  </div>
</div>

      {/* Add Data Modal */}
      <AddDataModal
        isOpen={showAddDataModal}
        onClose={() => {
          setShowAddDataModal(false)
          setSelectedKPI(null)
        }}
        kpiData={selectedKPI}
      />
      
      {/* Chart View Modal */}
      <ChartViewModal
        isOpen={showChartModal}
        onClose={() => {
          setShowChartModal(false)
          setSelectedKPI(null)
        }}
        kpiData={selectedKPI}
      />
    </div>
  )
}

// Main Operational Performance Component (Single Tab Version)
const OperationalPerformance = () => {
  const [activeSection, setActiveSection] = useState("kpi-dashboard")
  const [user, setUser] = useState(null)
  const [showFullDescription, setShowFullDescription] = useState(false)

  const [isInvestorView, setIsInvestorView] = useState(false)
  const [viewingSMEId, setViewingSMEId] = useState(null)
  const [viewingSMEName, setViewingSMEName] = useState("")
  const [viewOrigin, setViewOrigin] = useState("investor") // ADD THIS LINE


 useEffect(() => {
  const investorViewMode = sessionStorage.getItem("investorViewMode")
  const smeId = sessionStorage.getItem("viewingSMEId")
  const smeName = sessionStorage.getItem("viewingSMEName")
  const origin = sessionStorage.getItem("viewOrigin") // ADD THIS

  if (investorViewMode === "true" && smeId) {
    setIsInvestorView(true)
    setViewingSMEId(smeId)
    setViewingSMEName(smeName || "SME")
    setViewOrigin(origin || "investor") // ADD THIS
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
  // Clear all session storage items
  sessionStorage.removeItem("viewingSMEId")
  sessionStorage.removeItem("viewingSMEName")
  sessionStorage.removeItem("investorViewMode")
  sessionStorage.removeItem("viewOrigin") // ADD THIS
  
  // Navigate based on origin
  if (viewOrigin === "catalyst") {
    window.location.href = "/catalyst/cohorts" // Go back to Catalyst cohorts
  } else {
    window.location.href = "/my-cohorts" // Go back to Investor cohorts
  }
}

  const getContentStyles = () => ({
    width: "100%",
    marginLeft: "0",
    minHeight: "100vh",
    transition: "padding 0.3s ease",
    boxSizing: "border-box",
  })

  // Only one tab - KPI Dashboard
  const sectionButtons = [
    { id: "kpi-dashboard", label: "KPI Dashboard" },
  ]

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      <div style={getContentStyles()}>

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
        {viewOrigin === "catalyst" 
          ? `Catalyst View: Viewing ${viewingSMEName}'s Operational Performance`
          : `Investor View: Viewing ${viewingSMEName}'s Operational Performance`
        }
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
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = "#45a049"
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = "#4caf50"
      }}
    >
      <span>←</span>
      {viewOrigin === "catalyst" 
        ? "Back to Catalyst Cohorts"
        : "Back to My Cohorts"
      }
    </button>
  </div>
)}

        <div>
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
                      <li>Hierarchical KPI structure (Category → Sub-Category → KPI)</li>
                      <li>Click 👁️ icon to view charts with AI-powered analysis</li>
                      <li>Add data for multiple KPIs at once by category</li>
                      <li>Add custom KPIs with "Add New KPI" button</li>
                      <li>Target vs actual performance comparison with notes</li>
                      <li>All values rounded to 2 decimal places</li>
                    </ul>
                  </div>

                  <div>
                    <h3 style={{ color: "#7d5a50", marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>
                      How to Use
                    </h3>
                    <ul style={{ color: "#4a352f", fontSize: "14px", lineHeight: "1.7", margin: 0, paddingLeft: "20px" }}>
                      <li>Click 👁️ icon next to any KPI to see chart and AI analysis</li>
                      <li>Use "+ Add Data" button to enter values for all months at once</li>
                      <li>Use "Add New KPI" button to add custom metrics</li>
                      <li>Add notes about data entry context and observations</li>
                      <li>Download CSV for reporting</li>
                    </ul>
                  </div>
                </div>

                <div style={{ marginTop: "30px", paddingTop: "20px", borderTop: "1px solid #e8ddd4" }}>
                  <h3 style={{ color: "#7d5a50", marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>
                    Key Features
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
                    <div>
                      <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
                        🤖 AI Analysis
                      </h4>
                      <p style={{ color: "#4a352f", fontSize: "12px", lineHeight: "1.5", margin: 0 }}>
                        Get AI-powered insights and recommendations for each KPI
                      </p>
                    </div>
                    <div>
                      <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
                        📝 Notes Integration
                      </h4>
                      <p style={{ color: "#4a352f", fontSize: "12px", lineHeight: "1.5", margin: 0 }}>
                        Add contextual notes to data entries for better analysis
                      </p>
                    </div>
                    <div>
                      <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
                        ➕ Custom KPIs
                      </h4>
                      <p style={{ color: "#4a352f", fontSize: "12px", lineHeight: "1.5", margin: 0 }}>
                        Add your own KPIs to track what matters most to your business
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Only KPI Dashboard Tab */}
        <div
          style={{
            display: "flex",
            gap: "15px",
            marginBottom: "30px",
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

        {/* KPI Dashboard Component */}
        <KPIDashboard
          activeSection={activeSection}
          isInvestorView={isInvestorView}
          financialYearStartMonth={3}
        />
      </div>
    </div>
  )
}

export default OperationalPerformance