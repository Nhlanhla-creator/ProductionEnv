"use client"

import { useState, useEffect } from "react"
import { Bar, Pie, Line } from "react-chartjs-2"
import { doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, deleteDoc } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"
import { onAuthStateChanged } from "firebase/auth"
import Sidebar from "smses/Sidebar/Sidebar"
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

// Icons for actions
import { FaTrashAlt, FaEdit, FaPlus, FaChevronDown, FaChevronUp, FaStickyNote, FaChartBar } from "react-icons/fa"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend)

const PIPELINE_SECTIONS = {
  "pipeline-visibility": {
    name: "Pipeline Visibility",
    notes: {
      keyQuestion: "Do we have enough quality demand, at the right risk, to hit revenue?",
      keySignals: "Forecast clarity",
      keyDecisions: "Formalise sales",
    },
    kpis: [
      "New Leads (#)",
      "Funnel conversion rates (Visitor → Lead → MQL → SQL → Opportunity → Customer)",
      "Sales velocity (Average days to close)",
      "Total pipeline value (ZAR) & Risk Adjusted Pipeline value (= Total Pipeline value * probability)",
      "Pipeline coverage ratio = Pipeline Value ÷ Target(budget) Revenue",
      "Lead volume trends",
    ],
  },
  "pipeline-sufficiency": {
    name: "Pipeline Sufficiency",
    notes: {
      keyQuestion: "Is pipeline big enough?",
      keySignals: "Coverage risk",
      keyDecisions: "Adjust targets",
    },
    kpis: [
      "Total pipeline value (ZAR) & Risk Adjusted Pipeline value (= Total Pipeline value * probability)",
      "Pipeline coverage ratio = Pipeline Value ÷ Target(budget) Revenue",
      "Lead volume trends",
      "Conversion rates",
      "Pipeline coverage (not a trend chart, just a single number)",
    ],
  },
  "pipeline-quality": {
    name: "Pipeline Quality",
    notes: {
      keyQuestion: "How real is this pipeline? Will it convert?",
      keySignals: "Credibility",
      keyDecisions: "Improve sales discipline",
    },
    kpis: [
      "Cost per lead (by channel)",
      "CAC vs LTV trend",
      "SQL → Opportunity conversion",
      "Opportunity → Customer conversion",
      "Repeat customers vs churn (excellent inclusion)",
    ],
  },
  "revenue-concentration": {
    name: "Revenue Concentration",
    notes: {
      keyQuestion: "Where does revenue actually come from? Are we over-dependent?",
      keySignals: "Client/channel risk",
      keyDecisions: "Diversify clients",
    },
    kpis: [
      "Revenue by channel (bubble chart) or by customer segment",
      "Revenue per channel vs spend",
      "Top 3 channels as % of revenue",
    ],
  },
  "demand-sustainability": {
    name: "Demand Sustainability",
    notes: {
      keyQuestion: "Is demand repeatable? Will demand persist without constant spend",
      keySignals: "Founder or single client reliance",
      keyDecisions: "Build Demand Engine",
    },
    kpis: [
      "Referral rate trend",
      "Repeat customer & churn rate",
      "Cost per Lead by campaign (change to campaign cost contribution), Campaign ROI Analysis",
      "Declining CAC with rising LTV (this is key)",
    ],
  },
  "pipeline-table": {
    name: "Pipeline Table",
    notes: {
      keyQuestion: "",
      keySignals: "",
      keyDecisions: "",
    },
    kpis: [
      "Client / Deal",
      "Segment",
      "Stage",
      "Probability %",
      "Expected Close",
      "Deal Value (ZAR)",
      "Risk Adjusted Pipeline value (ZAR)",
      "Source",
      "Owner",
    ],
  },
}

// NotesSection Component with See More functionality
const NotesSection = ({ sectionKey, isExpanded, onToggle }) => {
  const notes = PIPELINE_SECTIONS[sectionKey].notes
  
  return (
    <div
      style={{
        backgroundColor: "#f5f0eb",
        padding: "15px",
        borderRadius: "6px",
        marginBottom: "20px",
        border: "2px solid #7d5a50",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "10px", flex: 1 }}>Section Notes</h4>
        <button
          onClick={onToggle}
          style={{
            background: "none",
            border: "none",
            color: "#5d4037",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "14px",
          }}
        >
          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
          {isExpanded ? "See Less" : "See More"}
        </button>
      </div>
      
      {!isExpanded ? (
        <div style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6" }}>
          <p style={{ margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            <strong>Key Question:</strong> {notes.keyQuestion}
          </p>
        </div>
      ) : (
        <div style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6" }}>
          <p style={{ marginBottom: "8px" }}>
            <strong>Key Question:</strong> {notes.keyQuestion}
          </p>
          <p style={{ marginBottom: "8px" }}>
            <strong>Key Signals:</strong> {notes.keySignals}
          </p>
          <p style={{ marginBottom: "0" }}>
            <strong>Key Decisions:</strong> {notes.keyDecisions}
          </p>
        </div>
      )}
    </div>
  )
}

// ChartActions Component for Add Notes and View Analysis buttons
const ChartActions = ({ onAddNotes, onViewAnalysis }) => {
  return (
    <div style={{ display: "flex", gap: "10px", marginTop: "15px", justifyContent: "flex-end" }}>
      <button
        onClick={onAddNotes}
        style={{
          padding: "8px 16px",
          backgroundColor: "#7d5a50",
          color: "#fdfcfb",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "5px",
          fontSize: "14px",
        }}
      >
        <FaStickyNote /> Add Notes
      </button>
      <button
        onClick={onViewAnalysis}
        style={{
          padding: "8px 16px",
          backgroundColor: "#5d4037",
          color: "#fdfcfb",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "5px",
          fontSize: "14px",
        }}
      >
        <FaChartBar /> View Analysis
      </button>
    </div>
  )
}

// Pipeline Visibility Component
const PipelineVisibility = ({ activeSection, currentUser, isInvestorView }) => {
  const [newLeadsCount, setNewLeadsCount] = useState(0)
  const [funnelData, setFunnelData] = useState({
    visitors: 0,
    leads: 0,
    mql: 0,
    sql: 0,
    opportunity: 0,
    customer: 0,
  })
  const [salesVelocity, setSalesVelocity] = useState(0)
  const [pipelineValue, setPipelineValue] = useState(0)
  const [pipelineValueRisk, setPipelineValueRisk] = useState(0)
  const [targetRevenue, setTargetRevenue] = useState(0)
  const [leadVolumeData, setLeadVolumeData] = useState(Array(12).fill(0))
  const [showEditForm, setShowEditForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [notesExpanded, setNotesExpanded] = useState(false)

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  useEffect(() => {
    if (currentUser && activeSection === "pipeline-visibility") {
      loadData()
    }
  }, [currentUser, activeSection, selectedYear])

  const loadData = async () => {
    if (!currentUser) return
    try {
      setIsLoading(true)
      const docRef = doc(db, "pipeline-visibility", `${currentUser.uid}_${selectedYear}`)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        setNewLeadsCount(data.newLeadsCount || 0)
        setFunnelData(data.funnelData || { visitors: 0, leads: 0, mql: 0, sql: 0, opportunity: 0, customer: 0 })
        setSalesVelocity(data.salesVelocity || 0)
        setPipelineValue(data.pipelineValue || 0)
        setPipelineValueRisk(data.pipelineValueRisk || 0)
        setTargetRevenue(data.targetRevenue || 0)
        setLeadVolumeData(data.leadVolumeData || Array(12).fill(0))
      } else {
        await setDoc(docRef, {
          newLeadsCount: 0,
          funnelData: { visitors: 0, leads: 0, mql: 0, sql: 0, opportunity: 0, customer: 0 },
          salesVelocity: 0,
          pipelineValue: 0,
          pipelineValueRisk: 0,
          targetRevenue: 0,
          leadVolumeData: Array(12).fill(0),
          lastUpdated: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error("Error loading pipeline visibility data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveData = async () => {
    if (!currentUser || isInvestorView) {
      alert("You cannot save data in this mode.")
      return
    }
    try {
      await setDoc(doc(db, "pipeline-visibility", `${currentUser.uid}_${selectedYear}`), {
        newLeadsCount,
        funnelData,
        salesVelocity,
        pipelineValue,
        pipelineValueRisk,
        targetRevenue,
        leadVolumeData,
        lastUpdated: new Date().toISOString(),
      })
      setShowEditForm(false)
      alert("Pipeline visibility data saved successfully!")
    } catch (error) {
      console.error("Error saving data:", error)
      alert("Error saving data")
    }
  }

  const handleAddNotes = () => {
    alert("Add Notes functionality for Funnel Conversion Rates")
  }

  const handleViewAnalysis = () => {
    alert("View Analysis functionality for Funnel Conversion Rates")
  }

  const handleLeadVolumeAddNotes = () => {
    alert("Add Notes functionality for Lead Volume Trends")
  }

  const handleLeadVolumeViewAnalysis = () => {
    alert("View Analysis functionality for Lead Volume Trends")
  }

  if (activeSection !== "pipeline-visibility") return null

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "200px",
          backgroundColor: "#fdfcfb",
          borderRadius: "8px",
        }}
      >
        <div>Loading data...</div>
      </div>
    )
  }

  const coverageRatio = targetRevenue > 0 ? ((pipelineValue / targetRevenue) * 100).toFixed(2) : 0
  const conversionRates = {
    visitorToLead: funnelData.visitors > 0 ? ((funnelData.leads / funnelData.visitors) * 100).toFixed(2) : 0,
    leadToMQL: funnelData.leads > 0 ? ((funnelData.mql / funnelData.leads) * 100).toFixed(2) : 0,
    mqlToSQL: funnelData.mql > 0 ? ((funnelData.sql / funnelData.mql) * 100).toFixed(2) : 0,
    sqlToOpportunity: funnelData.sql > 0 ? ((funnelData.opportunity / funnelData.sql) * 100).toFixed(2) : 0,
    opportunityToCustomer:
      funnelData.opportunity > 0 ? ((funnelData.customer / funnelData.opportunity) * 100).toFixed(2) : 0,
  }

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
      <NotesSection 
        sectionKey="pipeline-visibility" 
        isExpanded={notesExpanded}
        onToggle={() => setNotesExpanded(!notesExpanded)}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#5d4037", marginTop: 0 }}>Pipeline Visibility</h2>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{
              padding: "8px 12px",
              border: "1px solid #d4c4b0",
              borderRadius: "4px",
              backgroundColor: "#fdfcfb",
              color: "#5d4037",
            }}
          >
            {[2023, 2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          {!isInvestorView && (
            <>
              <button
                onClick={() => setShowEditForm(!showEditForm)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <FaPlus /> Add Data
              </button>
              <button
                onClick={() => alert("Add KPI functionality")}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#7d5a50",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <FaPlus /> Add KPI
              </button>
            </>
          )}
        </div>
      </div>

      {!isInvestorView && showEditForm && (
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#72542b", marginTop: 0 }}>Add Pipeline Visibility Data</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>New Leads (#)</label>
              <input
                type="number"
                value={newLeadsCount}
                onChange={(e) => setNewLeadsCount(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>Sales Velocity (days)</label>
              <input
                type="number"
                value={salesVelocity}
                onChange={(e) => setSalesVelocity(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              />
            </div>
          </div>

          <h4 style={{ color: "#72542b" }}>Funnel Conversion Data</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>Visitors</label>
              <input
                type="number"
                value={funnelData.visitors}
                onChange={(e) => setFunnelData({ ...funnelData, visitors: Number(e.target.value) })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>Leads</label>
              <input
                type="number"
                value={funnelData.leads}
                onChange={(e) => setFunnelData({ ...funnelData, leads: Number(e.target.value) })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>MQL</label>
              <input
                type="number"
                value={funnelData.mql}
                onChange={(e) => setFunnelData({ ...funnelData, mql: Number(e.target.value) })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>SQL</label>
              <input
                type="number"
                value={funnelData.sql}
                onChange={(e) => setFunnelData({ ...funnelData, sql: Number(e.target.value) })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>Opportunity</label>
              <input
                type="number"
                value={funnelData.opportunity}
                onChange={(e) => setFunnelData({ ...funnelData, opportunity: Number(e.target.value) })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>Customer</label>
              <input
                type="number"
                value={funnelData.customer}
                onChange={(e) => setFunnelData({ ...funnelData, customer: Number(e.target.value) })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              />
            </div>
          </div>

          <h4 style={{ color: "#72542b" }}>Pipeline Value</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>
                Total Pipeline Value (ZAR)
              </label>
              <input
                type="number"
                value={pipelineValue}
                onChange={(e) => setPipelineValue(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>
                Risk Adjusted Pipeline Value (ZAR)
              </label>
              <input
                type="number"
                value={pipelineValueRisk}
                onChange={(e) => setPipelineValueRisk(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>Target Revenue (ZAR)</label>
              <input
                type="number"
                value={targetRevenue}
                onChange={(e) => setTargetRevenue(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              />
            </div>
          </div>

          <h4 style={{ color: "#72542b" }}>Lead Volume Trends (Monthly)</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "20px" }}>
            {monthNames.map((month, index) => (
              <div key={month}>
                <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>{month}</label>
                <input
                  type="number"
                  value={leadVolumeData[index]}
                  onChange={(e) => {
                    const newData = [...leadVolumeData]
                    newData[index] = Number(e.target.value)
                    setLeadVolumeData(newData)
                  }}
                  style={{
                    width: "100%",
                    padding: "6px",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                  }}
                />
              </div>
            ))}
          </div>

          <button
            onClick={saveData}
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

      {/* KPIs Display */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px", marginBottom: "30px" }}>
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px" }}>New Leads</div>
          <div style={{ fontSize: "24px", color: "#5d4037", fontWeight: "bold" }}>{newLeadsCount}</div>
        </div>
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px" }}>Sales Velocity (days)</div>
          <div style={{ fontSize: "24px", color: "#5d4037", fontWeight: "bold" }}>{salesVelocity}</div>
        </div>
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px" }}>Pipeline Coverage Ratio</div>
          <div style={{ fontSize: "24px", color: "#5d4037", fontWeight: "bold" }}>{coverageRatio}%</div>
        </div>
      </div>

      {/* Funnel Conversion Rates Chart */}
      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ color: "#5d4037" }}>Funnel Conversion Rates</h3>
        <div style={{ height: "300px" }}>
          <Bar
            data={{
              labels: ["Visitor → Lead", "Lead → MQL", "MQL → SQL", "SQL → Opportunity", "Opportunity → Customer"],
              datasets: [
                {
                  label: "Conversion Rate (%)",
                  data: [
                    conversionRates.visitorToLead,
                    conversionRates.leadToMQL,
                    conversionRates.mqlToSQL,
                    conversionRates.sqlToOpportunity,
                    conversionRates.opportunityToCustomer,
                  ],
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
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  title: {
                    display: true,
                    text: "Conversion Rate (%)",
                  },
                },
              },
            }}
          />
        </div>
        <ChartActions 
          onAddNotes={handleAddNotes}
          onViewAnalysis={handleViewAnalysis}
        />
      </div>

      {/* Lead Volume Trends Chart */}
      <div>
        <h3 style={{ color: "#5d4037" }}>Lead Volume Trends</h3>
        <div style={{ height: "300px" }}>
          <Line
            data={{
              labels: monthNames,
              datasets: [
                {
                  label: "Lead Volume",
                  data: leadVolumeData,
                  borderColor: "#9c7c5f",
                  backgroundColor: "rgba(156, 124, 95, 0.1)",
                  borderWidth: 2,
                  tension: 0.3,
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
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: "Number of Leads",
                  },
                },
              },
            }}
          />
        </div>
        <ChartActions 
          onAddNotes={handleLeadVolumeAddNotes}
          onViewAnalysis={handleLeadVolumeViewAnalysis}
        />
      </div>
    </div>
  )
}

// Pipeline Sufficiency Component
const PipelineSufficiency = ({ activeSection, currentUser, isInvestorView }) => {
  const [pipelineValue, setPipelineValue] = useState(0)
  const [riskAdjustedValue, setRiskAdjustedValue] = useState(0)
  const [targetRevenue, setTargetRevenue] = useState(0)
  const [leadVolumeData, setLeadVolumeData] = useState(Array(12).fill(0))
  const [conversionRates, setConversionRates] = useState(Array(12).fill(0))
  const [showEditForm, setShowEditForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [notesExpanded, setNotesExpanded] = useState(false)

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  useEffect(() => {
    if (currentUser && activeSection === "pipeline-sufficiency") {
      loadData()
    }
  }, [currentUser, activeSection, selectedYear])

  const loadData = async () => {
    if (!currentUser) return
    try {
      setIsLoading(true)
      const docRef = doc(db, "pipeline-sufficiency", `${currentUser.uid}_${selectedYear}`)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        setPipelineValue(data.pipelineValue || 0)
        setRiskAdjustedValue(data.riskAdjustedValue || 0)
        setTargetRevenue(data.targetRevenue || 0)
        setLeadVolumeData(data.leadVolumeData || Array(12).fill(0))
        setConversionRates(data.conversionRates || Array(12).fill(0))
      } else {
        await setDoc(docRef, {
          pipelineValue: 0,
          riskAdjustedValue: 0,
          targetRevenue: 0,
          leadVolumeData: Array(12).fill(0),
          conversionRates: Array(12).fill(0),
          lastUpdated: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error("Error loading pipeline sufficiency data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveData = async () => {
    if (!currentUser || isInvestorView) {
      alert("You cannot save data in this mode.")
      return
    }
    try {
      await setDoc(doc(db, "pipeline-sufficiency", `${currentUser.uid}_${selectedYear}`), {
        pipelineValue,
        riskAdjustedValue,
        targetRevenue,
        leadVolumeData,
        conversionRates,
        lastUpdated: new Date().toISOString(),
      })
      setShowEditForm(false)
      alert("Pipeline sufficiency data saved successfully!")
    } catch (error) {
      console.error("Error saving data:", error)
      alert("Error saving data")
    }
  }

  const handleLeadVolumeAddNotes = () => {
    alert("Add Notes functionality for Lead Volume Trends")
  }

  const handleLeadVolumeViewAnalysis = () => {
    alert("View Analysis functionality for Lead Volume Trends")
  }

  const handleConversionAddNotes = () => {
    alert("Add Notes functionality for Conversion Rates")
  }

  const handleConversionViewAnalysis = () => {
    alert("View Analysis functionality for Conversion Rates")
  }

  if (activeSection !== "pipeline-sufficiency") return null

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "200px",
          backgroundColor: "#fdfcfb",
          borderRadius: "8px",
        }}
      >
        <div>Loading data...</div>
      </div>
    )
  }

  const coverageRatio = targetRevenue > 0 ? ((pipelineValue / targetRevenue) * 100).toFixed(2) : 0

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
      <NotesSection 
        sectionKey="pipeline-sufficiency" 
        isExpanded={notesExpanded}
        onToggle={() => setNotesExpanded(!notesExpanded)}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#5d4037", marginTop: 0 }}>Pipeline Sufficiency</h2>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{
              padding: "8px 12px",
              border: "1px solid #d4c4b0",
              borderRadius: "4px",
              backgroundColor: "#fdfcfb",
              color: "#5d4037",
            }}
          >
            {[2023, 2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          {!isInvestorView && (
            <>
              <button
                onClick={() => setShowEditForm(!showEditForm)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <FaPlus /> Add Data
              </button>
              <button
                onClick={() => alert("Add KPI functionality")}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#7d5a50",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <FaPlus /> Add KPI
              </button>
            </>
          )}
        </div>
      </div>

      {!isInvestorView && showEditForm && (
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#72542b", marginTop: 0 }}>Add Pipeline Sufficiency Data</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>
                Total Pipeline Value (ZAR)
              </label>
              <input
                type="number"
                value={pipelineValue}
                onChange={(e) => setPipelineValue(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>
                Risk Adjusted Value (ZAR)
              </label>
              <input
                type="number"
                value={riskAdjustedValue}
                onChange={(e) => setRiskAdjustedValue(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>Target Revenue (ZAR)</label>
              <input
                type="number"
                value={targetRevenue}
                onChange={(e) => setTargetRevenue(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              />
            </div>
          </div>

          <h4 style={{ color: "#72542b" }}>Lead Volume Trends (Monthly)</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "20px" }}>
            {monthNames.map((month, index) => (
              <div key={month}>
                <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>{month}</label>
                <input
                  type="number"
                  value={leadVolumeData[index]}
                  onChange={(e) => {
                    const newData = [...leadVolumeData]
                    newData[index] = Number(e.target.value)
                    setLeadVolumeData(newData)
                  }}
                  style={{
                    width: "100%",
                    padding: "6px",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                  }}
                />
              </div>
            ))}
          </div>

          <h4 style={{ color: "#72542b" }}>Conversion Rates (Monthly %)</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "20px" }}>
            {monthNames.map((month, index) => (
              <div key={month}>
                <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>{month}</label>
                <input
                  type="number"
                  value={conversionRates[index]}
                  onChange={(e) => {
                    const newData = [...conversionRates]
                    newData[index] = Number(e.target.value)
                    setConversionRates(newData)
                  }}
                  style={{
                    width: "100%",
                    padding: "6px",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                  }}
                />
              </div>
            ))}
          </div>

          <button
            onClick={saveData}
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

      {/* KPIs Display */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px", marginBottom: "30px" }}>
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px" }}>Total Pipeline Value</div>
          <div style={{ fontSize: "24px", color: "#5d4037", fontWeight: "bold" }}>
            R {pipelineValue.toLocaleString()}
          </div>
        </div>
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px" }}>Risk Adjusted Value</div>
          <div style={{ fontSize: "24px", color: "#5d4037", fontWeight: "bold" }}>
            R {riskAdjustedValue.toLocaleString()}
          </div>
        </div>
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px" }}>Pipeline Coverage</div>
          <div style={{ fontSize: "24px", color: "#5d4037", fontWeight: "bold" }}>{coverageRatio}%</div>
        </div>
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px" }}>Target Revenue</div>
          <div style={{ fontSize: "24px", color: "#5d4037", fontWeight: "bold" }}>
            R {targetRevenue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Lead Volume Trends Chart */}
      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ color: "#5d4037" }}>Lead Volume Trends</h3>
        <div style={{ height: "300px" }}>
          <Line
            data={{
              labels: monthNames,
              datasets: [
                {
                  label: "Lead Volume",
                  data: leadVolumeData,
                  borderColor: "#9c7c5f",
                  backgroundColor: "rgba(156, 124, 95, 0.1)",
                  borderWidth: 2,
                  tension: 0.3,
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
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: "Number of Leads",
                  },
                },
              },
            }}
          />
        </div>
        <ChartActions 
          onAddNotes={handleLeadVolumeAddNotes}
          onViewAnalysis={handleLeadVolumeViewAnalysis}
        />
      </div>

      {/* Conversion Rates Chart */}
      <div>
        <h3 style={{ color: "#5d4037" }}>Conversion Rates Trend</h3>
        <div style={{ height: "300px" }}>
          <Line
            data={{
              labels: monthNames,
              datasets: [
                {
                  label: "Conversion Rate (%)",
                  data: conversionRates,
                  borderColor: "#7d5a50",
                  backgroundColor: "rgba(125, 90, 80, 0.1)",
                  borderWidth: 2,
                  tension: 0.3,
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
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  title: {
                    display: true,
                    text: "Conversion Rate (%)",
                  },
                },
              },
            }}
          />
        </div>
        <ChartActions 
          onAddNotes={handleConversionAddNotes}
          onViewAnalysis={handleConversionViewAnalysis}
        />
      </div>
    </div>
  )
}

// Pipeline Quality Component
const PipelineQuality = ({ activeSection, currentUser, isInvestorView }) => {
  const [costPerLeadChannels, setCostPerLeadChannels] = useState([])
  const [cacVsLtvData, setCacVsLtvData] = useState(Array(12).fill({ cac: 0, ltv: 0 }))
  const [sqlToOpportunity, setSqlToOpportunity] = useState(0)
  const [opportunityToCustomer, setOpportunityToCustomer] = useState(0)
  const [repeatCustomers, setRepeatCustomers] = useState(0)
  const [churnRate, setChurnRate] = useState(0)
  const [showEditForm, setShowEditForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [notesExpanded, setNotesExpanded] = useState(false)

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  useEffect(() => {
    if (currentUser && activeSection === "pipeline-quality") {
      loadData()
    }
  }, [currentUser, activeSection, selectedYear])

  const loadData = async () => {
    if (!currentUser) return
    try {
      setIsLoading(true)
      const docRef = doc(db, "pipeline-quality", `${currentUser.uid}_${selectedYear}`)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        setCostPerLeadChannels(data.costPerLeadChannels || [])
        setCacVsLtvData(data.cacVsLtvData || Array(12).fill({ cac: 0, ltv: 0 }))
        setSqlToOpportunity(data.sqlToOpportunity || 0)
        setOpportunityToCustomer(data.opportunityToCustomer || 0)
        setRepeatCustomers(data.repeatCustomers || 0)
        setChurnRate(data.churnRate || 0)
      } else {
        await setDoc(docRef, {
          costPerLeadChannels: [],
          cacVsLtvData: Array(12).fill({ cac: 0, ltv: 0 }),
          sqlToOpportunity: 0,
          opportunityToCustomer: 0,
          repeatCustomers: 0,
          churnRate: 0,
          lastUpdated: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error("Error loading pipeline quality data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveData = async () => {
    if (!currentUser || isInvestorView) {
      alert("You cannot save data in this mode.")
      return
    }
    try {
      await setDoc(doc(db, "pipeline-quality", `${currentUser.uid}_${selectedYear}`), {
        costPerLeadChannels,
        cacVsLtvData,
        sqlToOpportunity,
        opportunityToCustomer,
        repeatCustomers,
        churnRate,
        lastUpdated: new Date().toISOString(),
      })
      setShowEditForm(false)
      alert("Pipeline quality data saved successfully!")
    } catch (error) {
      console.error("Error saving data:", error)
      alert("Error saving data")
    }
  }

  const addChannel = () => {
    setCostPerLeadChannels([...costPerLeadChannels, { name: "New Channel", cost: 0 }])
  }

  const removeChannel = (index) => {
    const newChannels = costPerLeadChannels.filter((_, i) => i !== index)
    setCostPerLeadChannels(newChannels)
  }

  const updateChannel = (index, field, value) => {
    const newChannels = [...costPerLeadChannels]
    newChannels[index][field] = field === "name" ? value : Number(value)
    setCostPerLeadChannels(newChannels)
  }

  const handleCostPerLeadAddNotes = () => {
    alert("Add Notes functionality for Cost Per Lead by Channel")
  }

  const handleCostPerLeadViewAnalysis = () => {
    alert("View Analysis functionality for Cost Per Lead by Channel")
  }

  const handleCacLtvAddNotes = () => {
    alert("Add Notes functionality for CAC vs LTV Trend")
  }

  const handleCacLtvViewAnalysis = () => {
    alert("View Analysis functionality for CAC vs LTV Trend")
  }

  if (activeSection !== "pipeline-quality") return null

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "200px",
          backgroundColor: "#fdfcfb",
          borderRadius: "8px",
        }}
      >
        <div>Loading data...</div>
      </div>
    )
  }

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
      <NotesSection 
        sectionKey="pipeline-quality" 
        isExpanded={notesExpanded}
        onToggle={() => setNotesExpanded(!notesExpanded)}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#5d4037", marginTop: 0 }}>Pipeline Quality</h2>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{
              padding: "8px 12px",
              border: "1px solid #d4c4b0",
              borderRadius: "4px",
              backgroundColor: "#fdfcfb",
              color: "#5d4037",
            }}
          >
            {[2023, 2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          {!isInvestorView && (
            <>
              <button
                onClick={() => setShowEditForm(!showEditForm)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <FaPlus /> Add Data
              </button>
              <button
                onClick={() => alert("Add KPI functionality")}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#7d5a50",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <FaPlus /> Add KPI
              </button>
            </>
          )}
        </div>
      </div>

      {!isInvestorView && showEditForm && (
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#72542b", marginTop: 0 }}>Add Pipeline Quality Data</h3>

          <h4 style={{ color: "#72542b" }}>Cost Per Lead by Channel</h4>
          {costPerLeadChannels.map((channel, index) => (
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
                value={channel.name}
                onChange={(e) => updateChannel(index, "name", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Channel Name"
              />
              <input
                type="number"
                value={channel.cost}
                onChange={(e) => updateChannel(index, "cost", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Cost (ZAR)"
              />
              <button
                onClick={() => removeChannel(index)}
                style={{
                  padding: "8px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                <FaTrashAlt />
              </button>
            </div>
          ))}
          <button
            onClick={addChannel}
            style={{
              padding: "8px 16px",
              backgroundColor: "#5d4037",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <FaPlus /> Add Channel
          </button>

          <h4 style={{ color: "#72542b" }}>CAC vs LTV (Monthly)</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "20px" }}>
            {monthNames.map((month, index) => (
              <div key={month} style={{ backgroundColor: "#fdfcfb", padding: "10px", borderRadius: "4px" }}>
                <label style={{ display: "block", color: "#72542b", marginBottom: "5px", fontWeight: "bold" }}>
                  {month}
                </label>
                <div style={{ display: "flex", gap: "5px" }}>
                  <input
                    type="number"
                    value={cacVsLtvData[index]?.cac || 0}
                    onChange={(e) => {
                      const newData = [...cacVsLtvData]
                      newData[index] = { ...newData[index], cac: Number(e.target.value) }
                      setCacVsLtvData(newData)
                    }}
                    style={{
                      width: "50%",
                      padding: "6px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                    }}
                    placeholder="CAC"
                  />
                  <input
                    type="number"
                    value={cacVsLtvData[index]?.ltv || 0}
                    onChange={(e) => {
                      const newData = [...cacVsLtvData]
                      newData[index] = { ...newData[index], ltv: Number(e.target.value) }
                      setCacVsLtvData(newData)
                    }}
                    style={{
                      width: "50%",
                      padding: "6px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                    }}
                    placeholder="LTV"
                  />
                </div>
              </div>
            ))}
          </div>

          <h4 style={{ color: "#72542b" }}>Conversion Metrics</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "15px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>
                SQL → Opportunity Conversion (%)
              </label>
              <input
                type="number"
                value={sqlToOpportunity}
                onChange={(e) => setSqlToOpportunity(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>
                Opportunity → Customer Conversion (%)
              </label>
              <input
                type="number"
                value={opportunityToCustomer}
                onChange={(e) => setOpportunityToCustomer(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              />
            </div>
          </div>

          <h4 style={{ color: "#72542b" }}>Customer Metrics</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "15px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>Repeat Customers (%)</label>
              <input
                type="number"
                value={repeatCustomers}
                onChange={(e) => setRepeatCustomers(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>Churn Rate (%)</label>
              <input
                type="number"
                value={churnRate}
                onChange={(e) => setChurnRate(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              />
            </div>
          </div>

          <button
            onClick={saveData}
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

      {/* KPIs Display */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px", marginBottom: "30px" }}>
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px" }}>SQL → Opportunity</div>
          <div style={{ fontSize: "24px", color: "#5d4037", fontWeight: "bold" }}>{sqlToOpportunity}%</div>
        </div>
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px" }}>Opportunity → Customer</div>
          <div style={{ fontSize: "24px", color: "#5d4037", fontWeight: "bold" }}>{opportunityToCustomer}%</div>
        </div>
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px" }}>Repeat Customers</div>
          <div style={{ fontSize: "24px", color: "#5d4037", fontWeight: "bold" }}>{repeatCustomers}%</div>
        </div>
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px" }}>Churn Rate</div>
          <div style={{ fontSize: "24px", color: "#5d4037", fontWeight: "bold" }}>{churnRate}%</div>
        </div>
      </div>

      {/* Cost Per Lead by Channel Chart */}
      {costPerLeadChannels.length > 0 && (
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ color: "#5d4037" }}>Cost Per Lead by Channel</h3>
          <div style={{ height: "300px" }}>
            <Bar
              data={{
                labels: costPerLeadChannels.map((c) => c.name),
                datasets: [
                  {
                    label: "Cost (ZAR)",
                    data: costPerLeadChannels.map((c) => c.cost),
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
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: "Cost (ZAR)",
                    },
                  },
                },
              }}
            />
          </div>
          <ChartActions 
            onAddNotes={handleCostPerLeadAddNotes}
            onViewAnalysis={handleCostPerLeadViewAnalysis}
          />
        </div>
      )}

      {/* CAC vs LTV Trend Chart */}
      <div>
        <h3 style={{ color: "#5d4037" }}>CAC vs LTV Trend</h3>
        <div style={{ height: "300px" }}>
          <Line
            data={{
              labels: monthNames,
              datasets: [
                {
                  label: "CAC (ZAR)",
                  data: cacVsLtvData.map((d) => d.cac),
                  borderColor: "#dc2626",
                  backgroundColor: "rgba(220, 38, 38, 0.1)",
                  borderWidth: 2,
                  tension: 0.3,
                },
                {
                  label: "LTV (ZAR)",
                  data: cacVsLtvData.map((d) => d.ltv),
                  borderColor: "#16a34a",
                  backgroundColor: "rgba(22, 163, 74, 0.1)",
                  borderWidth: 2,
                  tension: 0.3,
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
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: "Value (ZAR)",
                  },
                },
              },
            }}
          />
        </div>
        <ChartActions 
          onAddNotes={handleCacLtvAddNotes}
          onViewAnalysis={handleCacLtvViewAnalysis}
        />
      </div>
    </div>
  )
}

// Revenue Concentration Component
const RevenueConcentration = ({ activeSection, currentUser, isInvestorView }) => {
  const [revenueChannels, setRevenueChannels] = useState([])
  const [showEditForm, setShowEditForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [notesExpanded, setNotesExpanded] = useState(false)

  useEffect(() => {
    if (currentUser && activeSection === "revenue-concentration") {
      loadData()
    }
  }, [currentUser, activeSection])

  const loadData = async () => {
    if (!currentUser) return
    try {
      setIsLoading(true)
      const docRef = doc(db, "revenue-concentration", currentUser.uid)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        setRevenueChannels(data.revenueChannels || [])
      } else {
        await setDoc(docRef, {
          revenueChannels: [],
          lastUpdated: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error("Error loading revenue concentration data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveData = async () => {
    if (!currentUser || isInvestorView) {
      alert("You cannot save data in this mode.")
      return
    }
    try {
      await setDoc(doc(db, "revenue-concentration", currentUser.uid), {
        revenueChannels,
        lastUpdated: new Date().toISOString(),
      })
      setShowEditForm(false)
      alert("Revenue concentration data saved successfully!")
    } catch (error) {
      console.error("Error saving data:", error)
      alert("Error saving data")
    }
  }

  const addChannel = () => {
    setRevenueChannels([...revenueChannels, { name: "New Channel", revenue: 0, spend: 0 }])
  }

  const removeChannel = (index) => {
    const newChannels = revenueChannels.filter((_, i) => i !== index)
    setRevenueChannels(newChannels)
  }

  const updateChannel = (index, field, value) => {
    const newChannels = [...revenueChannels]
    newChannels[index][field] = field === "name" ? value : Number(value)
    setRevenueChannels(newChannels)
  }

  const handleRevenueByChannelAddNotes = () => {
    alert("Add Notes functionality for Revenue by Channel")
  }

  const handleRevenueByChannelViewAnalysis = () => {
    alert("View Analysis functionality for Revenue by Channel")
  }

  const handleRevenueVsSpendAddNotes = () => {
    alert("Add Notes functionality for Revenue per Channel vs Spend")
  }

  const handleRevenueVsSpendViewAnalysis = () => {
    alert("View Analysis functionality for Revenue per Channel vs Spend")
  }

  if (activeSection !== "revenue-concentration") return null

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "200px",
          backgroundColor: "#fdfcfb",
          borderRadius: "8px",
        }}
      >
        <div>Loading data...</div>
      </div>
    )
  }

  const totalRevenue = revenueChannels.reduce((sum, channel) => sum + channel.revenue, 0)
  const top3Channels = [...revenueChannels].sort((a, b) => b.revenue - a.revenue).slice(0, 3)
  const top3Percentage =
    totalRevenue > 0 ? ((top3Channels.reduce((sum, c) => sum + c.revenue, 0) / totalRevenue) * 100).toFixed(2) : 0

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
      <NotesSection 
        sectionKey="revenue-concentration" 
        isExpanded={notesExpanded}
        onToggle={() => setNotesExpanded(!notesExpanded)}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#5d4037", marginTop: 0 }}>Revenue Concentration</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          {!isInvestorView && (
            <button
              onClick={() => setShowEditForm(!showEditForm)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#5d4037",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <FaPlus /> Add Data
            </button>
          )}
        </div>
      </div>

      {!isInvestorView && showEditForm && (
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#72542b", marginTop: 0 }}>Add Revenue Concentration Data</h3>
          <h4 style={{ color: "#72542b" }}>Revenue by Channel</h4>
          {revenueChannels.map((channel, index) => (
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
                value={channel.name}
                onChange={(e) => updateChannel(index, "name", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Channel Name"
              />
              <input
                type="number"
                value={channel.revenue}
                onChange={(e) => updateChannel(index, "revenue", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Revenue (ZAR)"
              />
              <input
                type="number"
                value={channel.spend}
                onChange={(e) => updateChannel(index, "spend", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Spend (ZAR)"
              />
              <button
                onClick={() => removeChannel(index)}
                style={{
                  padding: "8px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                <FaTrashAlt />
              </button>
            </div>
          ))}
          <button
            onClick={addChannel}
            style={{
              padding: "8px 16px",
              backgroundColor: "#5d4037",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <FaPlus /> Add Channel
          </button>

          <button
            onClick={saveData}
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

      {/* KPIs Display */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "15px", marginBottom: "30px" }}>
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px" }}>Total Revenue</div>
          <div style={{ fontSize: "24px", color: "#5d4037", fontWeight: "bold" }}>
            R {totalRevenue.toLocaleString()}
          </div>
        </div>
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px" }}>Top 3 Channels % of Revenue</div>
          <div style={{ fontSize: "24px", color: "#5d4037", fontWeight: "bold" }}>{top3Percentage}%</div>
        </div>
      </div>

      {/* Revenue by Channel Chart */}
      {revenueChannels.length > 0 && (
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ color: "#5d4037" }}>Revenue by Channel</h3>
          <div style={{ height: "300px" }}>
            <Pie
              data={{
                labels: revenueChannels.map((c) => c.name),
                datasets: [
                  {
                    label: "Revenue (ZAR)",
                    data: revenueChannels.map((c) => c.revenue),
                    backgroundColor: [
                      "#9c7c5f",
                      "#7d5a50",
                      "#e8ddd4",
                      "#d4c4b0",
                      "#5d4037",
                      "#f7f3f0",
                      "#72542b",
                      "#4a352f",
                    ],
                    borderColor: "#fdfcfb",
                    borderWidth: 2,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "right",
                  },
                },
              }}
            />
          </div>
          <ChartActions 
            onAddNotes={handleRevenueByChannelAddNotes}
            onViewAnalysis={handleRevenueByChannelViewAnalysis}
          />
        </div>
      )}

      {/* Revenue vs Spend Chart */}
      {revenueChannels.length > 0 && (
        <div>
          <h3 style={{ color: "#5d4037" }}>Revenue per Channel vs Spend</h3>
          <div style={{ height: "300px" }}>
            <Bar
              data={{
                labels: revenueChannels.map((c) => c.name),
                datasets: [
                  {
                    label: "Revenue (ZAR)",
                    data: revenueChannels.map((c) => c.revenue),
                    backgroundColor: "#16a34a",
                    borderColor: "#15803d",
                    borderWidth: 1,
                  },
                  {
                    label: "Spend (ZAR)",
                    data: revenueChannels.map((c) => c.spend),
                    backgroundColor: "#dc2626",
                    borderColor: "#b91c1c",
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
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: "Amount (ZAR)",
                    },
                  },
                },
              }}
            />
          </div>
          <ChartActions 
            onAddNotes={handleRevenueVsSpendAddNotes}
            onViewAnalysis={handleRevenueVsSpendViewAnalysis}
          />
        </div>
      )}
    </div>
  )
}

// Demand Sustainability Component
const DemandSustainability = ({ activeSection, currentUser, isInvestorView }) => {
  const [referralRateData, setReferralRateData] = useState(Array(12).fill(0))
  const [repeatCustomerRate, setRepeatCustomerRate] = useState(0)
  const [churnRate, setChurnRate] = useState(0)
  const [campaigns, setCampaigns] = useState([])
  const [cacLtvData, setCacLtvData] = useState(Array(12).fill({ cac: 0, ltv: 0 }))
  const [showEditForm, setShowEditForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [notesExpanded, setNotesExpanded] = useState(false)

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  useEffect(() => {
    if (currentUser && activeSection === "demand-sustainability") {
      loadData()
    }
  }, [currentUser, activeSection, selectedYear])

  const loadData = async () => {
    if (!currentUser) return
    try {
      setIsLoading(true)
      const docRef = doc(db, "demand-sustainability", `${currentUser.uid}_${selectedYear}`)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        setReferralRateData(data.referralRateData || Array(12).fill(0))
        setRepeatCustomerRate(data.repeatCustomerRate || 0)
        setChurnRate(data.churnRate || 0)
        setCampaigns(data.campaigns || [])
        setCacLtvData(data.cacLtvData || Array(12).fill({ cac: 0, ltv: 0 }))
      } else {
        await setDoc(docRef, {
          referralRateData: Array(12).fill(0),
          repeatCustomerRate: 0,
          churnRate: 0,
          campaigns: [],
          cacLtvData: Array(12).fill({ cac: 0, ltv: 0 }),
          lastUpdated: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error("Error loading demand sustainability data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveData = async () => {
    if (!currentUser || isInvestorView) {
      alert("You cannot save data in this mode.")
      return
    }
    try {
      await setDoc(doc(db, "demand-sustainability", `${currentUser.uid}_${selectedYear}`), {
        referralRateData,
        repeatCustomerRate,
        churnRate,
        campaigns,
        cacLtvData,
        lastUpdated: new Date().toISOString(),
      })
      setShowEditForm(false)
      alert("Demand sustainability data saved successfully!")
    } catch (error) {
      console.error("Error saving data:", error)
      alert("Error saving data")
    }
  }

  const addCampaign = () => {
    setCampaigns([...campaigns, { name: "New Campaign", cost: 0, roi: 0 }])
  }

  const removeCampaign = (index) => {
    const newCampaigns = campaigns.filter((_, i) => i !== index)
    setCampaigns(newCampaigns)
  }

  const updateCampaign = (index, field, value) => {
    const newCampaigns = [...campaigns]
    newCampaigns[index][field] = field === "name" ? value : Number(value)
    setCampaigns(newCampaigns)
  }

  const handleReferralRateAddNotes = () => {
    alert("Add Notes functionality for Referral Rate Trend")
  }

  const handleReferralRateViewAnalysis = () => {
    alert("View Analysis functionality for Referral Rate Trend")
  }

  const handleCampaignAddNotes = () => {
    alert("Add Notes functionality for Campaign Cost & ROI Analysis")
  }

  const handleCampaignViewAnalysis = () => {
    alert("View Analysis functionality for Campaign Cost & ROI Analysis")
  }

  const handleCacLtvAddNotes = () => {
    alert("Add Notes functionality for Declining CAC with Rising LTV")
  }

  const handleCacLtvViewAnalysis = () => {
    alert("View Analysis functionality for Declining CAC with Rising LTV")
  }

  if (activeSection !== "demand-sustainability") return null

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "200px",
          backgroundColor: "#fdfcfb",
          borderRadius: "8px",
        }}
      >
        <div>Loading data...</div>
      </div>
    )
  }

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
      <NotesSection 
        sectionKey="demand-sustainability" 
        isExpanded={notesExpanded}
        onToggle={() => setNotesExpanded(!notesExpanded)}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#5d4037", marginTop: 0 }}>Demand Sustainability</h2>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{
              padding: "8px 12px",
              border: "1px solid #d4c4b0",
              borderRadius: "4px",
              backgroundColor: "#fdfcfb",
              color: "#5d4037",
            }}
          >
            {[2023, 2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          {!isInvestorView && (
            <>
              <button
                onClick={() => setShowEditForm(!showEditForm)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <FaPlus /> Add Data
              </button>
              <button
                onClick={() => alert("Add KPI functionality")}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#7d5a50",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <FaPlus /> Add KPI
              </button>
            </>
          )}
        </div>
      </div>

      {!isInvestorView && showEditForm && (
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#72542b", marginTop: 0 }}>Add Demand Sustainability Data</h3>

          <h4 style={{ color: "#72542b" }}>Referral Rate Trend (Monthly %)</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "20px" }}>
            {monthNames.map((month, index) => (
              <div key={month}>
                <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>{month}</label>
                <input
                  type="number"
                  value={referralRateData[index]}
                  onChange={(e) => {
                    const newData = [...referralRateData]
                    newData[index] = Number(e.target.value)
                    setReferralRateData(newData)
                  }}
                  style={{
                    width: "100%",
                    padding: "6px",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                  }}
                />
              </div>
            ))}
          </div>

          <h4 style={{ color: "#72542b" }}>Customer Metrics</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "15px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>
                Repeat Customer Rate (%)
              </label>
              <input
                type="number"
                value={repeatCustomerRate}
                onChange={(e) => setRepeatCustomerRate(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>Churn Rate (%)</label>
              <input
                type="number"
                value={churnRate}
                onChange={(e) => setChurnRate(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              />
            </div>
          </div>

          <h4 style={{ color: "#72542b" }}>Campaign Cost & ROI</h4>
          {campaigns.map((campaign, index) => (
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
                value={campaign.name}
                onChange={(e) => updateCampaign(index, "name", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Campaign Name"
              />
              <input
                type="number"
                value={campaign.cost}
                onChange={(e) => updateCampaign(index, "cost", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Cost (ZAR)"
              />
              <input
                type="number"
                value={campaign.roi}
                onChange={(e) => updateCampaign(index, "roi", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="ROI (%)"
              />
              <button
                onClick={() => removeCampaign(index)}
                style={{
                  padding: "8px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                <FaTrashAlt />
              </button>
            </div>
          ))}
          <button
            onClick={addCampaign}
            style={{
              padding: "8px 16px",
              backgroundColor: "#5d4037",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <FaPlus /> Add Campaign
          </button>

          <h4 style={{ color: "#72542b" }}>CAC vs LTV (Monthly)</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "20px" }}>
            {monthNames.map((month, index) => (
              <div key={month} style={{ backgroundColor: "#fdfcfb", padding: "10px", borderRadius: "4px" }}>
                <label style={{ display: "block", color: "#72542b", marginBottom: "5px", fontWeight: "bold" }}>
                  {month}
                </label>
                <div style={{ display: "flex", gap: "5px" }}>
                  <input
                    type="number"
                    value={cacLtvData[index]?.cac || 0}
                    onChange={(e) => {
                      const newData = [...cacLtvData]
                      newData[index] = { ...newData[index], cac: Number(e.target.value) }
                      setCacLtvData(newData)
                    }}
                    style={{
                      width: "50%",
                      padding: "6px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                    }}
                    placeholder="CAC"
                  />
                  <input
                    type="number"
                    value={cacLtvData[index]?.ltv || 0}
                    onChange={(e) => {
                      const newData = [...cacLtvData]
                      newData[index] = { ...newData[index], ltv: Number(e.target.value) }
                      setCacLtvData(newData)
                    }}
                    style={{
                      width: "50%",
                      padding: "6px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                    }}
                    placeholder="LTV"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={saveData}
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

      {/* KPIs Display */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "15px", marginBottom: "30px" }}>
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px" }}>Repeat Customer Rate</div>
          <div style={{ fontSize: "24px", color: "#5d4037", fontWeight: "bold" }}>{repeatCustomerRate}%</div>
        </div>
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px" }}>Churn Rate</div>
          <div style={{ fontSize: "24px", color: "#5d4037", fontWeight: "bold" }}>{churnRate}%</div>
        </div>
      </div>

      {/* Referral Rate Trend Chart */}
      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ color: "#5d4037" }}>Referral Rate Trend</h3>
        <div style={{ height: "300px" }}>
          <Line
            data={{
              labels: monthNames,
              datasets: [
                {
                  label: "Referral Rate (%)",
                  data: referralRateData,
                  borderColor: "#9c7c5f",
                  backgroundColor: "rgba(156, 124, 95, 0.1)",
                  borderWidth: 2,
                  tension: 0.3,
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
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  title: {
                    display: true,
                    text: "Referral Rate (%)",
                  },
                },
              },
            }}
          />
        </div>
        <ChartActions 
          onAddNotes={handleReferralRateAddNotes}
          onViewAnalysis={handleReferralRateViewAnalysis}
        />
      </div>

      {/* Campaign ROI Chart */}
      {campaigns.length > 0 && (
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ color: "#5d4037" }}>Campaign Cost & ROI Analysis</h3>
          <div style={{ height: "300px" }}>
            <Bar
              data={{
                labels: campaigns.map((c) => c.name),
                datasets: [
                  {
                    label: "Cost (ZAR)",
                    data: campaigns.map((c) => c.cost),
                    backgroundColor: "#dc2626",
                    borderColor: "#b91c1c",
                    borderWidth: 1,
                  },
                  {
                    label: "ROI (%)",
                    data: campaigns.map((c) => c.roi),
                    backgroundColor: "#16a34a",
                    borderColor: "#15803d",
                    borderWidth: 1,
                    yAxisID: "y1",
                  },
                ],
              }}
            />
          </div>
          <ChartActions 
            onAddNotes={handleCampaignAddNotes}
            onViewAnalysis={handleCampaignViewAnalysis}
          />
        </div>
      )}

      {/* CAC vs LTV Trend Chart */}
      <div>
        <h3 style={{ color: "#5d4037" }}>Declining CAC with Rising LTV</h3>
        <div style={{ height: "300px" }}>
          <Line
            data={{
              labels: monthNames,
              datasets: [
                {
                  label: "CAC (ZAR)",
                  data: cacLtvData.map((d) => d.cac),
                  borderColor: "#dc2626",
                  backgroundColor: "rgba(220, 38, 38, 0.1)",
                  borderWidth: 2,
                  tension: 0.3,
                },
                {
                  label: "LTV (ZAR)",
                  data: cacLtvData.map((d) => d.ltv),
                  borderColor: "#16a34a",
                  backgroundColor: "rgba(22, 163, 74, 0.1)",
                  borderWidth: 2,
                  tension: 0.3,
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
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: "Value (ZAR)",
                  },
                },
              },
            }}
          />
        </div>
        <ChartActions 
          onAddNotes={handleCacLtvAddNotes}
          onViewAnalysis={handleCacLtvViewAnalysis}
        />
      </div>
    </div>
  )
}

// Pipeline Table Component
const PipelineTable = ({ activeSection, currentUser, isInvestorView }) => {
  const [deals, setDeals] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState({ show: false, dealId: null })
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const [newDeal, setNewDeal] = useState({
    clientName: "",
    segment: "",
    stage: "",
    probability: 0,
    expectedClose: "",
    dealValue: 0,
    source: "",
    owner: "",
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (currentUser && activeSection === "pipeline-table") {
      loadDeals()
    }
  }, [currentUser, activeSection, selectedYear])

  const loadDeals = async () => {
    if (!currentUser) return
    try {
      setIsLoading(true)
      const q = query(
        collection(db, "pipeline-deals"), 
        where("userId", "==", currentUser.uid),
        where("year", "==", selectedYear)
      )
      const querySnapshot = await getDocs(q)
      const dealsData = []
      querySnapshot.forEach((doc) => {
        dealsData.push({ id: doc.id, ...doc.data() })
      })
      setDeals(dealsData)
    } catch (error) {
      console.error("Error loading deals:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addDeal = async () => {
    if (!currentUser || isInvestorView) {
      alert("You cannot add deals in this mode.")
      return
    }
    try {
      const riskAdjustedValue = (newDeal.dealValue * newDeal.probability) / 100
      await addDoc(collection(db, "pipeline-deals"), {
        clientName: newDeal.clientName,
        segment: newDeal.segment,
        stage: newDeal.stage,
        probability: newDeal.probability,
        expectedClose: newDeal.expectedClose,
        dealValue: newDeal.dealValue,
        riskAdjustedValue,
        source: newDeal.source,
        owner: newDeal.owner,
        userId: currentUser.uid,
        year: selectedYear,
        createdAt: new Date().toISOString(),
      })
      setNewDeal({
        clientName: "",
        segment: "",
        stage: "",
        probability: 0,
        expectedClose: "",
        dealValue: 0,
        source: "",
        owner: "",
      })
      setShowAddForm(false)
      loadDeals()
      alert("Deal added successfully!")
    } catch (error) {
      console.error("Error adding deal:", error)
      alert("Error adding deal")
    }
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
      await deleteDoc(doc(db, "pipeline-deals", confirmDialog.dealId))
      loadDeals()
      alert("Deal deleted successfully!")
    } catch (error) {
      console.error("Error deleting deal:", error)
      alert("Error deleting deal")
    } finally {
      setConfirmDialog({ show: false, dealId: null })
    }
  }

  const handleCancelDelete = () => {
    setConfirmDialog({ show: false, dealId: null })
  }

  const handleStageDistributionAddNotes = () => {
    alert("Add Notes functionality for Pipeline Stage Distribution")
  }

  const handleStageDistributionViewAnalysis = () => {
    alert("View Analysis functionality for Pipeline Stage Distribution")
  }

  if (activeSection !== "pipeline-table") return null

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "200px",
          backgroundColor: "#fdfcfb",
          borderRadius: "8px",
        }}
      >
        <div>Loading deals...</div>
      </div>
    )
  }

  const totalPipelineValue = deals.reduce((sum, deal) => sum + deal.dealValue, 0)
  const totalRiskAdjustedValue = deals.reduce((sum, deal) => sum + deal.riskAdjustedValue, 0)

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
      {confirmDialog.show && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
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
              maxWidth: "400px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px" }}>Confirm Deletion</h3>
            <p style={{ color: "#72542b", marginBottom: "25px" }}>
              Are you sure you want to delete this deal? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={handleCancelDelete}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#d4c4b0",
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
                  color: "white",
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

      {/* REMOVED: Section Notes completely removed from Pipeline Table */}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#5d4037", marginTop: 0 }}>Pipeline Table</h2>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{
              padding: "8px 12px",
              border: "1px solid #d4c4b0",
              borderRadius: "4px",
              backgroundColor: "#fdfcfb",
              color: "#5d4037",
            }}
          >
            {[2023, 2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          {!isInvestorView && (
            <>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <FaPlus /> Add Data
              </button>
              <button
                onClick={() => alert("Add KPI functionality")}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#7d5a50",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <FaPlus /> Add KPI
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px", marginBottom: "20px" }}>
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px" }}>Total Deals</div>
          <div style={{ fontSize: "24px", color: "#5d4037", fontWeight: "bold" }}>{deals.length}</div>
        </div>
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px" }}>Total Pipeline Value</div>
          <div style={{ fontSize: "24px", color: "#5d4037", fontWeight: "bold" }}>
            R {totalPipelineValue.toLocaleString()}
          </div>
        </div>
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px" }}>Risk Adjusted Value</div>
          <div style={{ fontSize: "24px", color: "#5d4037", fontWeight: "bold" }}>
            R {totalRiskAdjustedValue.toLocaleString()}
          </div>
        </div>
      </div>

      {!isInvestorView && showAddForm && (
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#72542b", marginTop: 0 }}>Add New Deal</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>Client / Deal</label>
              <input
                type="text"
                value={newDeal.clientName}
                onChange={(e) => setNewDeal({ ...newDeal, clientName: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>Segment</label>
              <input
                type="text"
                value={newDeal.segment}
                onChange={(e) => setNewDeal({ ...newDeal, segment: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>Stage</label>
              <select
                value={newDeal.stage}
                onChange={(e) => setNewDeal({ ...newDeal, stage: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              >
                <option value="">Select Stage</option>
                <option value="Proposal">Proposal</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Qualification">Qualification</option>
                <option value="Closed Won">Closed Won</option>
                <option value="Closed Lost">Closed Lost</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>Probability %</label>
              <input
                type="number"
                value={newDeal.probability}
                onChange={(e) => setNewDeal({ ...newDeal, probability: Number(e.target.value) })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                min="0"
                max="100"
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>Expected Close</label>
              <input
                type="date"
                value={newDeal.expectedClose}
                onChange={(e) => setNewDeal({ ...newDeal, expectedClose: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>Deal Value (ZAR)</label>
              <input
                type="number"
                value={newDeal.dealValue}
                onChange={(e) => setNewDeal({ ...newDeal, dealValue: Number(e.target.value) })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>Source</label>
              <input
                type="text"
                value={newDeal.source}
                onChange={(e) => setNewDeal({ ...newDeal, source: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>Owner</label>
              <input
                type="text"
                value={newDeal.owner}
                onChange={(e) => setNewDeal({ ...newDeal, owner: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              />
            </div>
          </div>
          <button
            onClick={addDeal}
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
            Add Deal
          </button>
        </div>
      )}

      {/* Deals Table */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "#f7f3f0",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#5d4037", color: "#fdfcfb" }}>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "14px" }}>Client / Deal</th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "14px" }}>Segment</th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "14px" }}>Stage</th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "14px" }}>Probability %</th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "14px" }}>Expected Close</th>
              <th style={{ padding: "12px", textAlign: "right", fontSize: "14px" }}>Deal Value (ZAR)</th>
              <th style={{ padding: "12px", textAlign: "right", fontSize: "14px" }}>Risk Adjusted (ZAR)</th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "14px" }}>Source</th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "14px" }}>Owner</th>
              {!isInvestorView && <th style={{ padding: "12px", textAlign: "center", fontSize: "14px" }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {deals.map((deal, index) => (
              <tr
                key={deal.id}
                style={{
                  borderBottom: "1px solid #e8ddd4",
                  backgroundColor: index % 2 === 0 ? "#fdfcfb" : "#f7f3f0",
                }}
              >
                <td style={{ padding: "12px", fontSize: "13px", color: "#5d4037" }}>{deal.clientName}</td>
                <td style={{ padding: "12px", fontSize: "13px", color: "#5d4037" }}>{deal.segment}</td>
                <td style={{ padding: "12px", fontSize: "13px", color: "#5d4037" }}>{deal.stage}</td>
                <td style={{ padding: "12px", fontSize: "13px", color: "#5d4037" }}>{deal.probability}%</td>
                <td style={{ padding: "12px", fontSize: "13px", color: "#5d4037" }}>{deal.expectedClose}</td>
                <td style={{ padding: "12px", fontSize: "13px", color: "#5d4037", textAlign: "right" }}>
                  R {deal.dealValue.toLocaleString()}
                </td>
                <td style={{ padding: "12px", fontSize: "13px", color: "#5d4037", textAlign: "right" }}>
                  R {deal.riskAdjustedValue.toLocaleString()}
                </td>
                <td style={{ padding: "12px", fontSize: "13px", color: "#5d4037" }}>{deal.source}</td>
                <td style={{ padding: "12px", fontSize: "13px", color: "#5d4037" }}>{deal.owner}</td>
                {!isInvestorView && (
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
                      <button
                        onClick={() => deleteDeal(deal.id)}
                        style={{
                          padding: "6px",
                          backgroundColor: "#dc2626",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="Delete"
                      >
                        <FaTrashAlt size={14} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {deals.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#72542b",
              backgroundColor: "#f7f3f0",
              borderRadius: "6px",
              marginTop: "10px",
            }}
          >
            No deals in pipeline. Click "Add Data" to get started.
          </div>
        )}
      </div>

      {/* Stage Distribution Chart */}
      {deals.length > 0 && (
        <div style={{ marginTop: "30px" }}>
          <h3 style={{ color: "#5d4037" }}>Pipeline Stage Distribution</h3>
          <div style={{ height: "300px" }}>
            <Pie
              data={{
                labels: ["Proposal", "Negotiation", "Qualification", "Closed Won", "Closed Lost"],
                datasets: [
                  {
                    label: "Deals by Stage",
                    data: [
                      deals.filter((d) => d.stage === "Proposal").length,
                      deals.filter((d) => d.stage === "Negotiation").length,
                      deals.filter((d) => d.stage === "Qualification").length,
                      deals.filter((d) => d.stage === "Closed Won").length,
                      deals.filter((d) => d.stage === "Closed Lost").length,
                    ],
                    backgroundColor: ["#9c7c5f", "#7d5a50", "#e8ddd4", "#16a34a", "#dc2626"],
                    borderColor: "#fdfcfb",
                    borderWidth: 2,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "right",
                  },
                },
              }}
            />
          </div>
          <ChartActions 
            onAddNotes={handleStageDistributionAddNotes}
            onViewAnalysis={handleStageDistributionViewAnalysis}
          />
        </div>
      )}
    </div>
  )
}

// Main Component
export default function MarketingSales() {
  const [activeSection, setActiveSection] = useState("pipeline-visibility")
  const [currentUser, setCurrentUser] = useState(null)
  const [isInvestorView, setIsInvestorView] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const checkSidebarState = () => {
      const sidebar = document.querySelector("[data-sidebar]")
      if (sidebar) {
        const isCollapsed = sidebar.classList.contains("collapsed")
        setIsSidebarCollapsed(isCollapsed)
      }
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
    { id: "pipeline-visibility", label: "Pipeline Visibility" },
    { id: "pipeline-sufficiency", label: "Pipeline Sufficiency" },
    { id: "pipeline-quality", label: "Pipeline Quality" },
    { id: "revenue-concentration", label: "Revenue Concentration" },
    { id: "demand-sustainability", label: "Demand Sustainability" },
    { id: "pipeline-table", label: "Pipeline Table" },
  ]

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      <div style={getContentStyles()}>
        <Header />

        {isInvestorView && (
          <div
            style={{
              backgroundColor: "#fff3cd",
              border: "1px solid #ffeaa7",
              padding: "15px",
              borderRadius: "6px",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            <p style={{ color: "#856404", margin: "0 0 10px 0" }}>
              You are viewing this dashboard in read-only investor mode.
            </p>
            <button
              onClick={() => setIsInvestorView(false)}
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
          <h1 style={{ color: "#5d4037", marginBottom: "10px" }}>
            Marketing & Pipeline Performance 
          </h1>
          <div style={{ marginBottom: "20px" }}>
            <p style={{ color: "#72542b", fontSize: "16px", marginBottom: "5px" }}>
              <strong>What this dashboard DOES:</strong> Assesses pipeline visibility, quality, concentration, and
              demand risk
            </p>
            <p style={{ color: "#72542b", fontSize: "16px" }}>
              <strong>What this dashboard does not do:</strong> Run campaigns, manage CRM, track social media
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              margin: "20px 0",
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
                  backgroundColor: activeSection === button.id ? "#5d4037" : "#e8ddd4",
                  color: activeSection === button.id ? "#fdfcfb" : "#5d4037",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                  transition: "all 0.3s ease",
                  minWidth: "150px",
                  textAlign: "center",
                  flexShrink: 0,
                }}
              >
                {button.label}
              </button>
            ))}
          </div>

          <PipelineVisibility activeSection={activeSection} currentUser={currentUser} isInvestorView={isInvestorView} />
          <PipelineSufficiency
            activeSection={activeSection}
            currentUser={currentUser}
            isInvestorView={isInvestorView}
          />
          <PipelineQuality activeSection={activeSection} currentUser={currentUser} isInvestorView={isInvestorView} />
          <RevenueConcentration
            activeSection={activeSection}
            currentUser={currentUser}
            isInvestorView={isInvestorView}
          />
          <DemandSustainability
            activeSection={activeSection}
            currentUser={currentUser}
            isInvestorView={isInvestorView}
          />
          <PipelineTable activeSection={activeSection} currentUser={currentUser} isInvestorView={isInvestorView} />
        </div>
      </div>
    </div>
  )
}