"use client"

import { useState, useEffect } from "react"
import { Bar, Line, Pie } from "react-chartjs-2"
import Sidebar from "smses/Sidebar/Sidebar"
import Header from "../DashboardHeader/DashboardHeader"
import { db, auth } from "../../firebaseConfig"
import { collection, getDocs, doc, getDoc, query, where, setDoc } from "firebase/firestore"
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
  
  const getFirstSentence = (text) => {
    const match = text.match(/^[^.!?]+[.!?]/)
    return match ? match[0] : text.split('.')[0] + '.'
  }
  
  return (
    <div
      style={{
        backgroundColor: "#fff9c4",
        padding: "15px 20px",
        borderRadius: "8px",
        marginBottom: "20px",
        border: "1px solid #f9a825",
      }}
    >
      <div style={{ marginBottom: "8px" }}>
        <strong style={{ color: "#5d4037", fontSize: "14px" }}>Key Question:</strong>
        <span style={{ color: "#5d4037", fontSize: "14px", marginLeft: "8px" }}>
          {showMore ? question : getFirstSentence(question)}
        </span>
        {!showMore && question.length > getFirstSentence(question).length && (
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

// Data Entry Modal Component for tables
const TableDataEntryModal = ({ isOpen, onClose, title, fields, data, onSave, loading }) => {
  const [localData, setLocalData] = useState({})
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    if (data) {
      setLocalData(data)
    }
  }, [data])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(localData)
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
          padding: "30px",
          borderRadius: "8px",
          maxWidth: "1000px",
          maxHeight: "90vh",
          overflow: "auto",
          width: "95%",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ color: "#5d4037" }}>{title}</h3>
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

        <div style={{ marginBottom: "30px", padding: "15px", backgroundColor: "#f5f0eb", borderRadius: "8px" }}>
          <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>Monthly Values</h4>
          {fields.map((field) => (
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

// Execution Capacity & Scalability Component
const ExecutionCapacity = ({ activeSection, user, isInvestorView }) => {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [expandedNotes, setExpandedNotes] = useState({})
  const [kpiNotes, setKpiNotes] = useState({})
  const [kpiAnalysis, setKpiAnalysis] = useState({})
  const [selectedViewMode, setSelectedViewMode] = useState("month")
  const [chartType, setChartType] = useState("bar")
  
  // Data structure for execution capacity KPIs
  const [executionData, setExecutionData] = useState({
    founderLoad: Array(12).fill(""), // low=1, med=2, high=3
    criticalFunctionsSinglePoint: Array(12).fill(""), // percentage
    criticalRolesWith2IC: Array(12).fill(""), // percentage
    spanOfControl: Array(12).fill(""), // average number
  })

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

  const saveExecutionData = async () => {
    if (!user) {
      alert("Please log in to save data")
      return
    }
    setLoading(true)
    try {
      await setDoc(doc(db, "peopleData", `${user.uid}_executionCapacity`), {
        userId: user.uid,
        executionData,
        kpiNotes,
        kpiAnalysis,
        lastUpdated: new Date().toISOString(),
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

  const generateLabels = () => {
    const months = getMonthsForYear(selectedYear, "month")
    if (selectedViewMode === "month") {
      return months
    } else if (selectedViewMode === "quarter") {
      return ["Q1", "Q2", "Q3", "Q4"]
    } else {
      return [selectedYear.toString()]
    }
  }

  const aggregateDataForView = (data) => {
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

  const renderKPICard = (title, data, kpiKey, unit = "", isPercentage = false) => {
    const labels = generateLabels()
    const chartData = aggregateDataForView(data)
    
    const chartConfig = {
      labels,
      datasets: [
        {
          label: title,
          data: chartData,
          backgroundColor: chartType === "bar" ? "rgba(93, 64, 55, 0.6)" : "transparent",
          borderColor: "rgb(93, 64, 55)",
          borderWidth: 3,
          fill: chartType === "line" ? true : false,
          tension: chartType === "line" ? 0.4 : 0,
          pointBackgroundColor: "rgb(93, 64, 55)",
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    }

    const currentValue = chartData[chartData.length - 1] || 0

    const ChartComponent = chartType === "line" ? Line : Bar

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(93, 64, 55, 0.95)",
          titleColor: "#ffffff",
          bodyColor: "#ffffff",
          titleFont: { size: 12, weight: 'bold' },
          bodyFont: { size: 14 },
          borderColor: "#5d4037",
          borderWidth: 1,
          padding: 10,
          displayColors: false,
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
            font: { size: 12 }
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
          backgroundColor: "#fdfcfb",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <div>
            <h4 style={{ color: "#5d4037", marginBottom: "5px", fontSize: "16px" }}>{title}</h4>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#5d4037" }}>
                {isPercentage ? `${currentValue.toFixed(1)}%` : currentValue.toFixed(1)}
              </div>
              {unit && (
                <div style={{ fontSize: "14px", color: "#8d6e63" }}>{unit}</div>
              )}
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setChartType("bar")}
              style={{
                padding: "6px 12px",
                backgroundColor: chartType === "bar" ? "#5d4037" : "#e8ddd4",
                color: chartType === "bar" ? "#fff" : "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Bar
            </button>
            <button
              onClick={() => setChartType("line")}
              style={{
                padding: "6px 12px",
                backgroundColor: chartType === "line" ? "#5d4037" : "#e8ddd4",
                color: chartType === "line" ? "#fff" : "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Line
            </button>
          </div>
        </div>

        <div style={{ height: "250px", marginBottom: "20px" }}>
          <ChartComponent
            data={chartConfig}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: "rgba(93, 64, 55, 0.9)",
                  titleColor: "#fff",
                  bodyColor: "#fff",
                  borderColor: "#5d4037",
                  borderWidth: 1,
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
                  },
                },
                x: {
                  grid: {
                    color: "rgba(232, 221, 212, 0.3)",
                  },
                  ticks: {
                    color: "#5d4037",
                  },
                },
              },
            }}
          />
        </div>

        {!isInvestorView && (
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
                ADD notes
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
                    "AI analysis will be generated based on your data trends, comparing current performance against historical averages and industry benchmarks. This feature provides actionable insights for improving this metric."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Render Founder Load as a table instead of chart
  const renderFounderLoadTable = () => {
    const months = getMonthsForYear(selectedYear, "month")
    
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
              Edit Data
            </button>
          )}
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
                  let displayValue = ""
                  let bgColor = "#f5f5f5"
                  
                  if (value === "1") {
                    displayValue = "Low"
                    bgColor = "#4caf50" // Green
                  } else if (value === "2") {
                    displayValue = "Medium"
                    bgColor = "#ff9800" // Orange
                  } else if (value === "3") {
                    displayValue = "High"
                    bgColor = "#f44336" // Red
                  } else {
                    displayValue = "Not Set"
                  }
                  
                  return (
                    <td key={month} style={{ padding: "10px", textAlign: "center" }}>
                      <div
                        style={{
                          padding: "8px 4px",
                          backgroundColor: bgColor,
                          color: value ? "#fff" : "#5d4037",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "600",
                          minWidth: "60px",
                        }}
                      >
                        {displayValue}
                      </div>
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
        
        <div style={{ marginTop: "15px", color: "#8d6e63", fontSize: "12px" }}>
          <strong>Legend:</strong> Low = 1, Medium = 2, High = 3
        </div>
      </div>
    )
  }

  if (activeSection !== "execution-capacity") return null

  const founderLoadFields = [
    {
      id: "founderLoad",
      label: "Founder operational load (1=low, 2=med, 3=high)",
      type: "select",
      options: [
        { value: "1", label: "Low" },
        { value: "2", label: "Medium" },
        { value: "3", label: "High" }
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
  ]

  return (
    <div style={{ paddingTop: "20px" }}>
      <KeyQuestionBox
        question="Is leadership overstretched? Is the current team sufficient to deliver the existing and near-term workload?"
        signals="Founder bottleneck, capacity strain"
        decisions="Redesign org, De-risk key roles"
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
                transition: "all 0.3s ease",
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
                transition: "all 0.3s ease",
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
                transition: "all 0.3s ease",
              }}
            >
              Yearly
            </button>
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
      </div>

      {/* Founder Load Table */}
      {renderFounderLoadTable()}

      {/* Chart Grid - 2 per row for other KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        {renderKPICard("% of critical functions dependent on 1 person", executionData.criticalFunctionsSinglePoint, "criticalFunctionsSinglePoint", "", true)}
        {renderKPICard("% Critical roles/functions with 2IC", executionData.criticalRolesWith2IC, "criticalRolesWith2IC", "", true)}
        {renderKPICard("Average span of control", executionData.spanOfControl, "spanOfControl", "People")}
      </div>

      {/* Data Entry Modal */}
      <TableDataEntryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Execution Capacity Data"
        fields={founderLoadFields}
        data={executionData}
        onSave={saveExecutionData}
        loading={loading}
      />
    </div>
  )
}

// Productivity Component
const Productivity = ({ activeSection, user, isInvestorView }) => {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [expandedNotes, setExpandedNotes] = useState({})
  const [kpiNotes, setKpiNotes] = useState({})
  const [kpiAnalysis, setKpiAnalysis] = useState({})
  const [selectedViewMode, setSelectedViewMode] = useState("month")
  const [chartType, setChartType] = useState("bar")
  
  // Data structure for productivity KPIs
  const [productivityData, setProductivityData] = useState({
    salesVolumePerEmployee: Array(12).fill(""),
    revenuePerEmployee: Array(12).fill(""),
    laborCostPercentage: Array(12).fill(""),
    overtimeHours: Array(12).fill(""),
  })

  useEffect(() => {
    if (user) {
      loadProductivityData()
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

  const saveProductivityData = async () => {
    if (!user) {
      alert("Please log in to save data")
      return
    }
    setLoading(true)
    try {
      await setDoc(doc(db, "peopleData", `${user.uid}_productivity`), {
        userId: user.uid,
        productivityData,
        kpiNotes,
        kpiAnalysis,
        lastUpdated: new Date().toISOString(),
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

  const generateLabels = () => {
    const months = getMonthsForYear(selectedYear, "month")
    if (selectedViewMode === "month") {
      return months
    } else if (selectedViewMode === "quarter") {
      return ["Q1", "Q2", "Q3", "Q4"]
    } else {
      return [selectedYear.toString()]
    }
  }

  const aggregateDataForView = (data) => {
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

  const renderKPICard = (title, data, kpiKey, unit = "", isPercentage = false, isCurrency = false) => {
    const labels = generateLabels()
    const chartData = aggregateDataForView(data)
    
    const chartConfig = {
      labels,
      datasets: [
        {
          label: title,
          data: chartData,
          backgroundColor: chartType === "bar" ? "rgba(93, 64, 55, 0.6)" : "transparent",
          borderColor: "rgb(93, 64, 55)",
          borderWidth: 3,
          fill: chartType === "line" ? true : false,
          tension: chartType === "line" ? 0.4 : 0,
          pointBackgroundColor: "rgb(93, 64, 55)",
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    }

    const currentValue = chartData[chartData.length - 1] || 0

    const ChartComponent = chartType === "line" ? Line : Bar

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
          <div>
            <h4 style={{ color: "#5d4037", marginBottom: "5px", fontSize: "16px" }}>{title}</h4>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#5d4037" }}>
                {isPercentage ? `${currentValue.toFixed(1)}%` : 
                 isCurrency ? `R${currentValue.toLocaleString()}` : 
                 currentValue.toFixed(1)}
              </div>
              {unit && (
                <div style={{ fontSize: "14px", color: "#8d6e63" }}>{unit}</div>
              )}
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setChartType("bar")}
              style={{
                padding: "6px 12px",
                backgroundColor: chartType === "bar" ? "#5d4037" : "#e8ddd4",
                color: chartType === "bar" ? "#fff" : "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Bar
            </button>
            <button
              onClick={() => setChartType("line")}
              style={{
                padding: "6px 12px",
                backgroundColor: chartType === "line" ? "#5d4037" : "#e8ddd4",
                color: chartType === "line" ? "#fff" : "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Line
            </button>
          </div>
        </div>

        <div style={{ height: "250px", marginBottom: "20px" }}>
          <ChartComponent
            data={chartConfig}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: "rgba(93, 64, 55, 0.9)",
                  titleColor: "#fff",
                  bodyColor: "#fff",
                  borderColor: "#5d4037",
                  borderWidth: 1,
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
                  },
                },
                x: {
                  grid: {
                    color: "rgba(232, 221, 212, 0.3)",
                  },
                  ticks: {
                    color: "#5d4037",
                  },
                },
              },
            }}
          />
        </div>

        {!isInvestorView && (
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
                ADD notes
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
                    "AI analysis will be generated based on your data trends, comparing current performance against historical averages and industry benchmarks. This feature provides actionable insights for improving this metric."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (activeSection !== "productivity") return null

  const productivityFields = [
    {
      id: "salesVolumePerEmployee",
      label: "Sales volume per employee (units)",
      type: "number",
      step: "0.01"
    },
    {
      id: "revenuePerEmployee",
      label: "Revenue per Employee (R)",
      type: "number",
      step: "0.01"
    },
    {
      id: "laborCostPercentage",
      label: "Labour as % revenue",
      type: "number",
      step: "0.01"
    },
    {
      id: "overtimeHours",
      label: "Overtime (hours)",
      type: "number",
      step: "0.01"
    }
  ]

  return (
    <div style={{ paddingTop: "20px" }}>
      <KeyQuestionBox
        question="Is output scaling with people?"
        signals="Efficiency trend"
        decisions="Slow hiring, fix execution"
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
                transition: "all 0.3s ease",
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
                transition: "all 0.3s ease",
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
                transition: "all 0.3s ease",
              }}
            >
              Yearly
            </button>
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
      </div>

      {/* Chart Grid - 2 per row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        {renderKPICard("Sales volume per employee", productivityData.salesVolumePerEmployee, "salesVolumePerEmployee", "Units", false, true)}
        {renderKPICard("Revenue per Employee", productivityData.revenuePerEmployee, "revenuePerEmployee", "", false, true)}
        {renderKPICard("Labour as % revenue", productivityData.laborCostPercentage, "laborCostPercentage", "", true)}
        {renderKPICard("Overtime (hrs)", productivityData.overtimeHours, "overtimeHours", "Hours")}
      </div>

      {/* Add Data Modal */}
      <TableDataEntryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Productivity Data"
        fields={productivityFields}
        data={productivityData}
        onSave={saveProductivityData}
        loading={loading}
      />
    </div>
  )
}

// Capability & Training Component
const CapabilityTraining = ({ activeSection, user, isInvestorView }) => {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [expandedNotes, setExpandedNotes] = useState({})
  const [kpiNotes, setKpiNotes] = useState({})
  const [kpiAnalysis, setKpiAnalysis] = useState({})
  const [selectedViewMode, setSelectedViewMode] = useState("month")
  const [chartType, setChartType] = useState("bar")
  
  // Data structure for capability & training KPIs
  const [capabilityData, setCapabilityData] = useState({
    skillsGapsIdentified: Array(12).fill(""), // 0=no, 1=yes
    employeeIDPsDone: Array(12).fill(""), // 0=no, 1=yes
    trainingSpendAmount: Array(12).fill(""), // R amount
    trainingSpendPercentage: Array(12).fill(""), // % of payroll
    trainingFocus: Array(12).fill(""), // 1=technical, 2=leadership, 3=compliance
  })

  useEffect(() => {
    if (user) {
      loadCapabilityData()
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

  const saveCapabilityData = async () => {
    if (!user) {
      alert("Please log in to save data")
      return
    }
    setLoading(true)
    try {
      await setDoc(doc(db, "peopleData", `${user.uid}_capabilityTraining`), {
        userId: user.uid,
        capabilityData,
        kpiNotes,
        kpiAnalysis,
        lastUpdated: new Date().toISOString(),
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

  const generateLabels = () => {
    const months = getMonthsForYear(selectedYear, "month")
    if (selectedViewMode === "month") {
      return months
    } else if (selectedViewMode === "quarter") {
      return ["Q1", "Q2", "Q3", "Q4"]
    } else {
      return [selectedYear.toString()]
    }
  }

  const aggregateDataForView = (data) => {
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

  // Render Yes/No questions as tables
  const renderYesNoTable = (title, data, kpiKey) => {
    const months = getMonthsForYear(selectedYear, "month")
    
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
          <h4 style={{ color: "#5d4037", marginBottom: "5px", fontSize: "16px" }}>{title}</h4>
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
                  Status
                </td>
                {months.map((month, idx) => {
                  const value = data[idx]
                  let displayValue = ""
                  let bgColor = "#f5f5f5"
                  
                  if (value === "1" || value === "yes") {
                    displayValue = "Yes"
                    bgColor = "#4caf50" // Green
                  } else if (value === "0" || value === "no") {
                    displayValue = "No"
                    bgColor = "#f44336" // Red
                  } else {
                    displayValue = "Not Set"
                  }
                  
                  return (
                    <td key={month} style={{ padding: "10px", textAlign: "center" }}>
                      <div
                        style={{
                          padding: "8px 4px",
                          backgroundColor: bgColor,
                          color: value ? "#fff" : "#5d4037",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "600",
                          minWidth: "60px",
                        }}
                      >
                        {displayValue}
                      </div>
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderKPICard = (title, data, kpiKey, unit = "", isPercentage = false, isCurrency = false) => {
    const labels = generateLabels()
    const chartData = aggregateDataForView(data)
    
    const chartConfig = {
      labels,
      datasets: [
        {
          label: title,
          data: chartData,
          backgroundColor: chartType === "bar" ? "rgba(93, 64, 55, 0.6)" : "transparent",
          borderColor: "rgb(93, 64, 55)",
          borderWidth: 3,
          fill: chartType === "line" ? true : false,
          tension: chartType === "line" ? 0.4 : 0,
          pointBackgroundColor: "rgb(93, 64, 55)",
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    }

    const currentValue = chartData[chartData.length - 1] || 0

    const ChartComponent = chartType === "line" ? Line : Bar

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
          <div>
            <h4 style={{ color: "#5d4037", marginBottom: "5px", fontSize: "16px" }}>{title}</h4>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#5d4037" }}>
                {isPercentage ? `${currentValue.toFixed(1)}%` : 
                 isCurrency ? `R${currentValue.toLocaleString()}` : 
                 kpiKey === "trainingFocus" ? 
                   currentValue === 1 ? "Technical" : currentValue === 2 ? "Leadership" : "Compliance" :
                 currentValue.toFixed(1)}
              </div>
              {unit && (
                <div style={{ fontSize: "14px", color: "#8d6e63" }}>{unit}</div>
              )}
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setChartType("bar")}
              style={{
                padding: "6px 12px",
                backgroundColor: chartType === "bar" ? "#5d4037" : "#e8ddd4",
                color: chartType === "bar" ? "#fff" : "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Bar
            </button>
            <button
              onClick={() => setChartType("line")}
              style={{
                padding: "6px 12px",
                backgroundColor: chartType === "line" ? "#5d4037" : "#e8ddd4",
                color: chartType === "line" ? "#fff" : "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Line
            </button>
          </div>
        </div>

        <div style={{ height: "250px", marginBottom: "20px" }}>
          <ChartComponent
            data={chartConfig}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: "rgba(93, 64, 55, 0.9)",
                  titleColor: "#fff",
                  bodyColor: "#fff",
                  borderColor: "#5d4037",
                  borderWidth: 1,
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
                  },
                },
                x: {
                  grid: {
                    color: "rgba(232, 221, 212, 0.3)",
                  },
                  ticks: {
                    color: "#5d4037",
                  },
                },
              },
            }}
          />
        </div>

        {!isInvestorView && (
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
                ADD notes
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
                    "AI analysis will be generated based on your data trends, comparing current performance against historical averages and industry benchmarks. This feature provides actionable insights for improving this metric."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (activeSection !== "capability-training") return null

  const capabilityFields = [
    {
      id: "skillsGapsIdentified",
      label: "Skills gaps identified",
      type: "select",
      options: [
        { value: "0", label: "No" },
        { value: "1", label: "Yes" }
      ]
    },
    {
      id: "employeeIDPsDone",
      label: "Employee IDPs done",
      type: "select",
      options: [
        { value: "0", label: "No" },
        { value: "1", label: "Yes" }
      ]
    },
    {
      id: "trainingSpendAmount",
      label: "Training Spend (R)",
      type: "number",
      step: "0.01"
    },
    {
      id: "trainingSpendPercentage",
      label: "Training Spend (% of payroll)",
      type: "number",
      step: "0.01"
    },
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
  ]

  return (
    <div style={{ paddingTop: "20px" }}>
      <KeyQuestionBox
        question="Are we future-ready? Is the business investing enough to remain capable as it grows?"
        signals="Skills gaps"
        decisions="Invest in capability"
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
                transition: "all 0.3s ease",
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
                transition: "all 0.3s ease",
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
                transition: "all 0.3s ease",
              }}
            >
              Yearly
            </button>
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
      </div>

      {/* Yes/No Question Tables */}
      {renderYesNoTable("Skills gaps identified (Yes/No)", capabilityData.skillsGapsIdentified, "skillsGapsIdentified")}
      {renderYesNoTable("Employee IDPs done (Yes/No)", capabilityData.employeeIDPsDone, "employeeIDPsDone")}

      {/* Chart Grid - 2 per row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        {renderKPICard("Training Spend ($)", capabilityData.trainingSpendAmount, "trainingSpendAmount", "", false, true)}
        {renderKPICard("Training Spend (% of payroll)", capabilityData.trainingSpendPercentage, "trainingSpendPercentage", "", true)}
        {renderKPICard("Training focus", capabilityData.trainingFocus, "trainingFocus", "Type")}
      </div>

      {/* Add Data Modal */}
      <TableDataEntryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Capability & Training Data"
        fields={capabilityFields}
        data={capabilityData}
        onSave={saveCapabilityData}
        loading={loading}
      />
    </div>
  )
}

// Stability and Continuity Component
const StabilityContinuity = ({ activeSection, user, isInvestorView }) => {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [expandedNotes, setExpandedNotes] = useState({})
  const [kpiNotes, setKpiNotes] = useState({})
  const [kpiAnalysis, setKpiAnalysis] = useState({})
  const [selectedViewMode, setSelectedViewMode] = useState("month")
  const [chartType, setChartType] = useState("bar")
  
  // Data structure for stability & continuity KPIs
  const [stabilityData, setStabilityData] = useState({
    overallTurnover: Array(12).fill(""), // percentage annually
    workforceMovements: Array(12).fill(""), // number of movements
    terminationReasons: Array(12).fill(""), // coded reasons
    criticalRoleTurnover: Array(12).fill(""), // percentage
    contractorDependence: Array(12).fill(""), // percentage
  })

  useEffect(() => {
    if (user) {
      loadStabilityData()
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

  const saveStabilityData = async () => {
    if (!user) {
      alert("Please log in to save data")
      return
    }
    setLoading(true)
    try {
      await setDoc(doc(db, "peopleData", `${user.uid}_stabilityContinuity`), {
        userId: user.uid,
        stabilityData,
        kpiNotes,
        kpiAnalysis,
        lastUpdated: new Date().toISOString(),
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

  const generateLabels = () => {
    const months = getMonthsForYear(selectedYear, "month")
    if (selectedViewMode === "month") {
      return months
    } else if (selectedViewMode === "quarter") {
      return ["Q1", "Q2", "Q3", "Q4"]
    } else {
      return [selectedYear.toString()]
    }
  }

  const aggregateDataForView = (data) => {
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

  // Render termination reasons as a table instead of chart
  const renderTerminationReasonsTable = () => {
    const months = getMonthsForYear(selectedYear, "month")
    const reasonCodes = {
      "1": "Performance",
      "2": "Resignation",
      "3": "Redundancy",
      "4": "Misconduct",
      "5": "Retirement",
      "6": "Other"
    }
    
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
                  Reason Code
                </td>
                {months.map((month, idx) => {
                  const value = stabilityData.terminationReasons[idx]
                  const reasonText = reasonCodes[value] || "Not Set"
                  const bgColor = value ? "#e8ddd4" : "#f5f5f5"
                  
                  return (
                    <td key={month} style={{ padding: "10px", textAlign: "center" }}>
                      <div
                        style={{
                          padding: "8px 4px",
                          backgroundColor: bgColor,
                          color: "#5d4037",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "600",
                          minWidth: "80px",
                        }}
                      >
                        {value ? `${value}: ${reasonText}` : "Not Set"}
                      </div>
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
        
        <div style={{ marginTop: "15px", color: "#8d6e63", fontSize: "12px" }}>
          <strong>Reason Codes:</strong> 1=Performance, 2=Resignation, 3=Redundancy, 4=Misconduct, 5=Retirement, 6=Other
        </div>
      </div>
    )
  }

  const renderKPICard = (title, data, kpiKey, unit = "", isPercentage = false) => {
    const labels = generateLabels()
    const chartData = aggregateDataForView(data)
    
    const chartConfig = {
      labels,
      datasets: [
        {
          label: title,
          data: chartData,
          backgroundColor: chartType === "bar" ? "rgba(93, 64, 55, 0.6)" : "transparent",
          borderColor: "rgb(93, 64, 55)",
          borderWidth: 3,
          fill: chartType === "line" ? true : false,
          tension: chartType === "line" ? 0.4 : 0,
          pointBackgroundColor: "rgb(93, 64, 55)",
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    }

    const currentValue = chartData[chartData.length - 1] || 0

    const ChartComponent = chartType === "line" ? Line : Bar

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
          <div>
            <h4 style={{ color: "#5d4037", marginBottom: "5px", fontSize: "16px" }}>{title}</h4>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#5d4037" }}>
                {isPercentage ? `${currentValue.toFixed(1)}%` : currentValue.toFixed(1)}
              </div>
              {unit && (
                <div style={{ fontSize: "14px", color: "#8d6e63" }}>{unit}</div>
              )}
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setChartType("bar")}
              style={{
                padding: "6px 12px",
                backgroundColor: chartType === "bar" ? "#5d4037" : "#e8ddd4",
                color: chartType === "bar" ? "#fff" : "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Bar
            </button>
            <button
              onClick={() => setChartType("line")}
              style={{
                padding: "6px 12px",
                backgroundColor: chartType === "line" ? "#5d4037" : "#e8ddd4",
                color: chartType === "line" ? "#fff" : "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Line
            </button>
          </div>
        </div>

        <div style={{ height: "250px", marginBottom: "20px" }}>
          <ChartComponent
            data={chartConfig}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: "rgba(93, 64, 55, 0.9)",
                  titleColor: "#fff",
                  bodyColor: "#fff",
                  borderColor: "#5d4037",
                  borderWidth: 1,
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
                  },
                },
                x: {
                  grid: {
                    color: "rgba(232, 221, 212, 0.3)",
                  },
                  ticks: {
                    color: "#5d4037",
                  },
                },
              },
            }}
          />
        </div>

        {!isInvestorView && (
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
                ADD notes
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
                    "AI analysis will be generated based on your data trends, comparing current performance against historical averages and industry benchmarks. This feature provides actionable insights for improving this metric."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (activeSection !== "stability-continuity") return null

  const stabilityFields = [
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
      id: "terminationReasons",
      label: "Reasons for terminations (code)",
      type: "select",
      options: [
        { value: "1", label: "1: Performance" },
        { value: "2", label: "2: Resignation" },
        { value: "3", label: "3: Redundancy" },
        { value: "4", label: "4: Misconduct" },
        { value: "5", label: "5: Retirement" },
        { value: "6", label: "6: Other" }
      ]
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

  return (
    <div style={{ paddingTop: "20px" }}>
      <KeyQuestionBox
        question="Is talent leakage threatening continuity or execution?"
        signals="Critical role churn"
        decisions="Retention strategy"
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
        <h2 style={{ color: "#5d4037", fontSize: "24px", fontWeight: "700" }}>Stability and Continuity</h2>

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
                transition: "all 0.3s ease",
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
                transition: "all 0.3s ease",
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
                transition: "all 0.3s ease",
              }}
            >
              Yearly
            </button>
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
      </div>

      {/* Termination Reasons Table */}
      {renderTerminationReasonsTable()}

      {/* Chart Grid - 2 per row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        {renderKPICard("Overall turnover (% Annually)", stabilityData.overallTurnover, "overallTurnover", "", true)}
        {renderKPICard("Workforce movements", stabilityData.workforceMovements, "workforceMovements", "Movements")}
        {renderKPICard("Critical Role Turnover", stabilityData.criticalRoleTurnover, "criticalRoleTurnover", "", true)}
        {renderKPICard("Contractor dependence", stabilityData.contractorDependence, "contractorDependence", "", true)}
      </div>

      {/* Add Data Modal */}
      <TableDataEntryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Stability & Continuity Data"
        fields={stabilityFields}
        data={stabilityData}
        onSave={saveStabilityData}
        loading={loading}
      />
    </div>
  )
}

// Employee Composition Component (using pie charts with white percentage labels)
const EmployeeCompositionTab = ({ activeSection, user, isInvestorView }) => {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [employeeData, setEmployeeData] = useState({
    gender: { male: 60, female: 35, other: 5 },
    race: { african: 40, white: 30, colored: 15, indian: 10, other: 5 },
    age: { under25: 15, "25-34": 30, "35-44": 25, "45-54": 20, "55+": 10 },
    tenure: { under1: 20, "1-3": 35, "3-5": 25, "5-10": 15, "10+": 5 },
    education: { highSchool: 20, diploma: 25, degree: 40, postgraduate: 15 },
  })

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
      }
    } catch (error) {
      console.error("Error loading employee composition data:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveEmployeeData = async () => {
    if (!user) {
      alert("Please log in to save data")
      return
    }
    setLoading(true)
    try {
      await setDoc(doc(db, "peopleData", `${user.uid}_employeeComposition`), {
        userId: user.uid,
        employeeData,
        lastUpdated: new Date().toISOString(),
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

  const createPieChartData = (data, colors) => {
    const labels = Object.keys(data).map(key => 
      key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
    )
    const values = Object.values(data)
    
    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderColor: "#5d4037",
          borderWidth: 2,
        },
      ],
    }
  }

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: "#5d4037",
          font: {
            size: 11,
          },
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: "rgba(93, 64, 55, 0.9)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#5d4037",
        borderWidth: 1,
      },
    },
  }

  const renderPieChart = (title, data, colors) => {
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
          {title}
        </h4>
        <div style={{ height: "250px", position: "relative" }}>
          <Pie
            data={createPieChartData(data, colors)}
            options={{
              ...pieChartOptions,
              plugins: {
                ...pieChartOptions.plugins,
                datalabels: {
                  color: "#fff",
                  font: {
                    size: 14,
                    weight: "bold"
                  },
                  formatter: (value) => {
                    return `${value}%`
                  }
                }
              }
            }}
          />
        </div>
      </div>
    )
  }

  if (activeSection !== "employee-composition") return null

  const years = Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i)

  return (
    <div style={{ paddingTop: "20px" }}>
      <KeyQuestionBox
        question="Are we externally credible?"
        signals="Representation Risk"
        decisions="Board & Leadership changes"
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
      </div>

      {/* Pie Charts Grid - 3 per row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        {renderPieChart("Gender Distribution", employeeData.gender, ["#3E2723", "#5D4037", "#8D6E63"])}
        {renderPieChart("Race Distribution", employeeData.race, ["#3E2723", "#5D4037", "#8D6E63", "#A1887F", "#D7CCC8"])}
        {renderPieChart("Age Distribution", employeeData.age, ["#3E2723", "#5D4037", "#8D6E63", "#A1887F", "#D7CCC8"])}
        {renderPieChart("Tenure Distribution", employeeData.tenure, ["#3E2723", "#5D4037", "#8D6E63", "#A1887F", "#D7CCC8"])}
        {renderPieChart("Education Distribution", employeeData.education, ["#3E2723", "#5D4037", "#8D6E63", "#A1887F"])}
      </div>

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
              maxWidth: "600px",
              maxHeight: "90vh",
              overflow: "auto",
              width: "95%",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#5d4037" }}>Add Employee Composition Data</h3>
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
              <div style={{ display: "flex", gap: "5px", alignItems: "center", marginBottom: "15px" }}>
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

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
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
                onClick={saveEmployeeData}
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
    </div>
  )
}

// Main People Performance Component
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
      console.log("Investor view mode activated for SME:", smeId)
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
    { id: "stability-continuity", label: "Stability and Continuity" },
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

        <div style={{ padding: "20px" }}>
          <h1 style={{ color: "#5d4037", fontSize: "32px", fontWeight: "700", marginBottom: "20px" }}>
            People Performance
          </h1>

          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "15px",
              }}
            >
              <div>
                <strong style={{ color: "#5d4037", fontSize: "16px", display: "block", marginBottom: "5px" }}>
                  What this dashboard DOES
                </strong>
                <span style={{ color: "#5d4037", fontSize: "15px" }}>
                  Assesses organisational resilience, execution capacity, continuity risk
                </span>
              </div>

              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "13px",
                  whiteSpace: "nowrap",
                }}
              >
                {showFullDescription ? "See Less" : "See More"}
              </button>
            </div>

            <div>
              <strong style={{ color: "#5d4037", fontSize: "16px", display: "block", marginBottom: "5px" }}>
                What this dashboard does not do
              </strong>
              <span style={{ color: "#5d4037", fontSize: "15px" }}>
                Payroll, leave, performance reviews, HR administration
              </span>
            </div>

            {showFullDescription && (
              <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #e8ddd4" }}>
                <p style={{ color: "#5d4037", fontSize: "14px", lineHeight: "1.6", marginBottom: "12px" }}>
                  This dashboard provides a comprehensive view of your organization's people performance across five key dimensions:
                </p>
                <ul style={{ color: "#5d4037", fontSize: "14px", lineHeight: "1.8", paddingLeft: "20px" }}>
                  <li>
                    <strong>Execution Capacity & Scalability:</strong> Evaluate leadership capacity and team sufficiency for current and near-term workload
                  </li>
                  <li>
                    <strong>Productivity:</strong> Assess if output is scaling with headcount through efficiency trends
                  </li>
                  <li>
                    <strong>Capability & Training:</strong> Determine if the business is investing enough in skills development for future growth
                  </li>
                  <li>
                    <strong>Stability & Continuity:</strong> Monitor talent leakage risks and ensure business continuity
                  </li>
                  <li>
                    <strong>Employee Composition:</strong> Analyze workforce demographics and representation for external credibility
                  </li>
                </ul>
                <p style={{ color: "#5d4037", fontSize: "14px", lineHeight: "1.6", marginTop: "12px" }}>
                  Each section provides key metrics, signals, and decision points to help you make informed strategic choices about your organization's human capital.
                </p>
              </div>
            )}
          </div>
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