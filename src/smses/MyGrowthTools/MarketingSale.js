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

// Updated NotesSection Component with "See More/See Less" functionality
const NotesSection = ({ sectionKey, isExpanded, onToggle }) => {
  const notes = PIPELINE_SECTIONS[sectionKey].notes
  
  // Get first sentence for collapsed view
  const getFirstSentence = (text) => {
    if (!text) return "";
    const match = text.match(/^[^.!?]+[.!?]/);
    return match ? match[0] : text.split('.')[0] + '.';
  };
  
  const firstSentence = getFirstSentence(notes.keyQuestion);
  const showSeeMore = !isExpanded && (
    notes.keyQuestion.length > firstSentence.length || 
    notes.keySignals || 
    notes.keyDecisions
  );
  
  return (
    <div
      style={{
        backgroundColor: "#DCDCDC",
        padding: "15px 20px",
        borderRadius: "8px",
        marginBottom: "20px",
        border: "1px solid	#5d4037",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "8px" }}>
        <strong style={{ color: "#5d4037", fontSize: "14px", minWidth: "100px" }}>Key Question:</strong>
        <span style={{ color: "#5d4037", fontSize: "14px", marginLeft: "8px", flex: 1 }}>
          {isExpanded ? notes.keyQuestion : firstSentence}
        </span>
        {showSeeMore && (
          <button
            onClick={onToggle}
            style={{
              background: "none",
              border: "none",
              color: "#5d4037",
              fontWeight: "600",
              cursor: "pointer",
              marginLeft: "10px",
              textDecoration: "underline",
              whiteSpace: "nowrap",
              fontSize: "14px",
            }}
          >
            See more
          </button>
        )}
      </div>
      
      {isExpanded && (
        <>
          {notes.keySignals && (
            <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "8px" }}>
              <strong style={{ color: "#5d4037", fontSize: "14px", minWidth: "100px" }}>Key Signals:</strong>
              <span style={{ color: "#5d4037", fontSize: "14px", marginLeft: "8px", flex: 1 }}>{notes.keySignals}</span>
            </div>
          )}
          {notes.keyDecisions && (
            <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "8px" }}>
              <strong style={{ color: "#5d4037", fontSize: "14px", minWidth: "100px" }}>Key Decisions:</strong>
              <span style={{ color: "#5d4037", fontSize: "14px", marginLeft: "8px", flex: 1 }}>{notes.keyDecisions}</span>
            </div>
          )}
          <button
            onClick={onToggle}
            style={{
              background: "none",
              border: "none",
              color: "#5d4037",
              fontWeight: "600",
              cursor: "pointer",
              marginTop: "10px",
              textDecoration: "underline",
              fontSize: "14px",
            }}
          >
            See less
          </button>
        </>
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
// Pipeline Visibility Component
const PipelineVisibility = ({ activeSection, currentUser, isInvestorView }) => {
  const [newLeadsData, setNewLeadsData] = useState(Array(12).fill(0))
  const [funnelData, setFunnelData] = useState({
    visitors: 0,
    leads: 0,
    mql: 0,
    sql: 0,
    opportunity: 0,
    customer: 0,
  })
  const [salesVelocityData, setSalesVelocityData] = useState(Array(12).fill(0))
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
        setNewLeadsData(data.newLeadsData || Array(12).fill(0))
        setFunnelData(data.funnelData || {
          visitors: 0,
          leads: 0,
          mql: 0,
          sql: 0,
          opportunity: 0,
          customer: 0,
        })
        setSalesVelocityData(data.salesVelocityData || Array(12).fill(0))
      } else {
        // Set all zeros as default instead of unrealistic values
        await setDoc(docRef, {
          newLeadsData: Array(12).fill(0),
          funnelData: {
            visitors: 0,
            leads: 0,
            mql: 0,
            sql: 0,
            opportunity: 0,
            customer: 0,
          },
          salesVelocityData: Array(12).fill(0),
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
        newLeadsData,
        funnelData,
        salesVelocityData,
        lastUpdated: new Date().toISOString(),
      })
      setShowEditForm(false)
      alert("Pipeline visibility data saved successfully!")
    } catch (error) {
      console.error("Error saving data:", error)
      alert("Error saving data")
    }
  }

  const handleAddNotes = (chartName) => {
    alert(`Add Notes functionality for ${chartName}`)
  }

  const handleViewAnalysis = (chartName) => {
    alert(`View Analysis functionality for ${chartName}`)
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

  // Calculate conversion rates
  const conversionRates = {
    visitorToLead: funnelData.visitors > 0 ? ((funnelData.leads / funnelData.visitors) * 100).toFixed(1) : 0,
    leadToMQL: funnelData.leads > 0 ? ((funnelData.mql / funnelData.leads) * 100).toFixed(1) : 0,
    mqlToSQL: funnelData.mql > 0 ? ((funnelData.sql / funnelData.mql) * 100).toFixed(1) : 0,
    sqlToOpportunity: funnelData.sql > 0 ? ((funnelData.opportunity / funnelData.sql) * 100).toFixed(1) : 0,
    opportunityToCustomer: funnelData.opportunity > 0 ? ((funnelData.customer / funnelData.opportunity) * 100).toFixed(1) : 0,
  }

  // Calculate overall metrics
  const totalNewLeads = newLeadsData.reduce((sum, val) => sum + val, 0)
  const avgSalesVelocity = salesVelocityData.reduce((sum, val) => sum + val, 0) / (salesVelocityData.filter(val => val > 0).length || 1)

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
          
          <h4 style={{ color: "#72542b" }}>New Leads Data (Monthly)</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "20px" }}>
            {monthNames.map((month, index) => (
              <div key={month}>
                <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>{month}</label>
                <input
                  type="number"
                  value={newLeadsData[index]}
                  onChange={(e) => {
                    const newData = [...newLeadsData]
                    newData[index] = Number(e.target.value)
                    setNewLeadsData(newData)
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

          <h4 style={{ color: "#72542b" }}>Sales Velocity (Monthly Average Days)</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "20px" }}>
            {monthNames.map((month, index) => (
              <div key={month}>
                <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>{month}</label>
                <input
                  type="number"
                  value={salesVelocityData[index]}
                  onChange={(e) => {
                    const newData = [...salesVelocityData]
                    newData[index] = Number(e.target.value)
                    setSalesVelocityData(newData)
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

      {/* Overall Metrics on Top */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px", marginBottom: "30px" }}>
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "6px",
            textAlign: "center",
            borderTop: "4px solid #9c7c5f",
          }}
        >
          <div style={{ fontSize: "14px", color: "#72542b", marginBottom: "8px", fontWeight: "600" }}>Total New Leads</div>
          <div style={{ fontSize: "32px", color: "#5d4037", fontWeight: "bold" }}>{totalNewLeads.toLocaleString()}</div>
          <div style={{ fontSize: "12px", color: "#7d5a50", marginTop: "5px" }}>Year {selectedYear}</div>
        </div>
        
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "6px",
            textAlign: "center",
            borderTop: "4px solid #7d5a50",
          }}
        >
          <div style={{ fontSize: "14px", color: "#72542b", marginBottom: "8px", fontWeight: "600" }}>Overall Conversion Rate</div>
          <div style={{ fontSize: "32px", color: "#5d4037", fontWeight: "bold" }}>
            {funnelData.visitors > 0 ? ((funnelData.customer / funnelData.visitors) * 100).toFixed(1) : 0}%
          </div>
          <div style={{ fontSize: "12px", color: "#7d5a50", marginTop: "5px" }}>Visitor → Customer</div>
        </div>
        
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "6px",
            textAlign: "center",
            borderTop: "4px solid #5d4037",
          }}
        >
          <div style={{ fontSize: "14px", color: "#72542b", marginBottom: "8px", fontWeight: "600" }}>Avg Sales Velocity</div>
          <div style={{ fontSize: "32px", color: "#5d4037", fontWeight: "bold" }}>{avgSalesVelocity.toFixed(1)} days</div>
          <div style={{ fontSize: "12px", color: "#7d5a50", marginTop: "5px" }}>Average to close</div>
        </div>
      </div>

      {/* Three Charts Side by Side */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
        
        {/* New Leads Chart */}
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px", fontSize: "16px" }}>New Leads (#)</h3>
          <div style={{ height: "250px", marginBottom: "15px" }}>
            <Bar
              data={{
                labels: monthNames,
                datasets: [
                  {
                    label: "New Leads",
                    data: newLeadsData,
                    backgroundColor: "#9c7c5f",
                    borderColor: "#5d4037",
                    borderWidth: 1,
                    borderRadius: 4,
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
                    title: {
                      display: true,
                      text: "Number of Leads",
                      color: "#72542b",
                    },
                    grid: {
                      color: "rgba(125, 90, 80, 0.1)",
                    },
                    ticks: {
                      color: "#72542b",
                    },
                  },
                  x: {
                    ticks: {
                      color: "#72542b",
                      maxRotation: 45,
                    },
                    grid: {
                      color: "rgba(125, 90, 80, 0.1)",
                    },
                  },
                },
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              onClick={() => handleAddNotes("New Leads")}
              style={{
                padding: "6px 12px",
                backgroundColor: "#7d5a50",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
              }}
            >
              <FaStickyNote size={12} /> Add Notes
            </button>
            <button
              onClick={() => handleViewAnalysis("New Leads")}
              style={{
                padding: "6px 12px",
                backgroundColor: "#5d4037",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
              }}
            >
              <FaChartBar size={12} /> View Analysis
            </button>
          </div>
        </div>

        {/* Funnel Conversion Rates Chart */}
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px", fontSize: "16px" }}>
            Funnel Conversion Rates
          </h3>
          <div style={{ height: "250px", marginBottom: "15px" }}>
            <Bar
              data={{
                labels: ["Vis→Lead", "Lead→MQL", "MQL→SQL", "SQL→Opp", "Opp→Cust"],
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
                    backgroundColor: "#7d5a50",
                    borderColor: "#5d4037",
                    borderWidth: 1,
                    borderRadius: 4,
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
                    max: 100,
                    title: {
                      display: true,
                      text: "Conversion Rate (%)",
                      color: "#72542b",
                    },
                    grid: {
                      color: "rgba(125, 90, 80, 0.1)",
                    },
                    ticks: {
                      color: "#72542b",
                    },
                  },
                  x: {
                    ticks: {
                      color: "#72542b",
                      maxRotation: 45,
                    },
                    grid: {
                      color: "rgba(125, 90, 80, 0.1)",
                    },
                  },
                },
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              onClick={() => handleAddNotes("Funnel Conversion Rates")}
              style={{
                padding: "6px 12px",
                backgroundColor: "#7d5a50",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
              }}
            >
              <FaStickyNote size={12} /> Add Notes
            </button>
            <button
              onClick={() => handleViewAnalysis("Funnel Conversion Rates")}
              style={{
                padding: "6px 12px",
                backgroundColor: "#5d4037",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
              }}
            >
              <FaChartBar size={12} /> View Analysis
            </button>
          </div>
        </div>

        {/* Sales Velocity Chart */}
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px", fontSize: "16px" }}>
            Sales Velocity (Days to Close)
          </h3>
          <div style={{ height: "250px", marginBottom: "15px" }}>
            <Line
              data={{
                labels: monthNames,
                datasets: [
                  {
                    label: "Days to Close",
                    data: salesVelocityData,
                    borderColor: "#5d4037",
                    backgroundColor: "rgba(93, 64, 55, 0.1)",
                    borderWidth: 2,
                    tension: 0.3,
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
                    title: {
                      display: true,
                      text: "Days to Close",
                      color: "#72542b",
                    },
                    grid: {
                      color: "rgba(125, 90, 80, 0.1)",
                    },
                    ticks: {
                      color: "#72542b",
                    },
                  },
                  x: {
                    ticks: {
                      color: "#72542b",
                      maxRotation: 45,
                    },
                    grid: {
                      color: "rgba(125, 90, 80, 0.1)",
                    },
                  },
                },
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              onClick={() => handleAddNotes("Sales Velocity")}
              style={{
                padding: "6px 12px",
                backgroundColor: "#7d5a50",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
              }}
            >
              <FaStickyNote size={12} /> Add Notes
            </button>
            <button
              onClick={() => handleViewAnalysis("Sales Velocity")}
              style={{
                padding: "6px 12px",
                backgroundColor: "#5d4037",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
              }}
            >
              <FaChartBar size={12} /> View Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
// Pipeline Sufficiency Component
// Pipeline Sufficiency Component
const PipelineSufficiency = ({ activeSection, currentUser, isInvestorView }) => {
  const [totalPipelineValue, setTotalPipelineValue] = useState(0)
  const [probability, setProbability] = useState(0) // Overall probability percentage
  const [targetRevenue, setTargetRevenue] = useState(0)
  const [leadVolumeTrends, setLeadVolumeTrends] = useState(Array(12).fill(0))
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
        setTotalPipelineValue(data.totalPipelineValue || 0)
        setProbability(data.probability || 0)
        setTargetRevenue(data.targetRevenue || 0)
        setLeadVolumeTrends(data.leadVolumeTrends || Array(12).fill(0))
        setConversionRates(data.conversionRates || Array(12).fill(0))
      } else {
        await setDoc(docRef, {
          totalPipelineValue: 0,
          probability: 0,
          targetRevenue: 0,
          leadVolumeTrends: Array(12).fill(0),
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
        totalPipelineValue,
        probability,
        targetRevenue,
        leadVolumeTrends,
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

  const handleAddNotes = (chartName) => {
    alert(`Add Notes functionality for ${chartName}`)
  }

  const handleViewAnalysis = (chartName) => {
    alert(`View Analysis functionality for ${chartName}`)
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

  // CALCULATIONS BASED ON YOUR SPECIFICATIONS:
  
  // 1. Risk Adjusted Pipeline Value = Total Pipeline value * probability
  const riskAdjustedValue = (totalPipelineValue * probability) / 100
  
  // 2. Pipeline Coverage Ratio = Pipeline Value ÷ Target Revenue (as percentage)
  const pipelineCoverageRatio = targetRevenue > 0 ? ((totalPipelineValue / targetRevenue) * 100).toFixed(2) : 0
  
  // 3. Average Lead Volume (for summary)
  const avgLeadVolume = leadVolumeTrends.reduce((sum, val) => sum + val, 0) / 12
  
  // 4. Average Conversion Rate (for summary)
  const avgConversionRate = conversionRates.reduce((sum, val) => sum + val, 0) / 12

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
                value={totalPipelineValue}
                onChange={(e) => setTotalPipelineValue(Number(e.target.value))}
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
                Overall Probability (%)
              </label>
              <input
                type="number"
                value={probability}
                onChange={(e) => setProbability(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                min="0"
                max="100"
              />
              <small style={{ color: "#7d5a50", fontSize: "11px" }}>
                Overall probability percentage (0-100%)
              </small>
            </div>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>
                Target/Budget Revenue (ZAR)
              </label>
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
                  value={leadVolumeTrends[index]}
                  onChange={(e) => {
                    const newData = [...leadVolumeTrends]
                    newData[index] = Number(e.target.value)
                    setLeadVolumeTrends(newData)
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
                  min="0"
                  max="100"
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

      {/* KEY METRICS - Top Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px", marginBottom: "30px" }}>
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "6px",
            textAlign: "center",
            borderTop: "4px solid #9c7c5f",
          }}
        >
          <div style={{ fontSize: "14px", color: "#72542b", marginBottom: "8px", fontWeight: "600" }}>
            Total Pipeline Value
          </div>
          <div style={{ fontSize: "20px", color: "#5d4037", fontWeight: "bold" }}>
            R {totalPipelineValue.toLocaleString()}
          </div>
          <div style={{ fontSize: "12px", color: "#7d5a50", marginTop: "5px" }}>
            Probability: {probability}%
          </div>
        </div>
        
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "6px",
            textAlign: "center",
            borderTop: "4px solid #7d5a50",
          }}
        >
          <div style={{ fontSize: "14px", color: "#72542b", marginBottom: "8px", fontWeight: "600" }}>
            Risk Adjusted Value
          </div>
          <div style={{ fontSize: "20px", color: "#5d4037", fontWeight: "bold" }}>
            R {riskAdjustedValue.toLocaleString()}
          </div>
          <div style={{ fontSize: "12px", color: "#7d5a50", marginTop: "5px" }}>
            Formula: Total Value × {probability}%
          </div>
        </div>
        
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "6px",
            textAlign: "center",
            borderTop: "4px solid #5d4037",
          }}
        >
          <div style={{ fontSize: "14px", color: "#72542b", marginBottom: "8px", fontWeight: "600" }}>
            Pipeline Coverage
          </div>
          <div style={{ fontSize: "20px", color: "#5d4037", fontWeight: "bold" }}>
            {pipelineCoverageRatio}%
          </div>
          <div style={{ fontSize: "12px", color: "#7d5a50", marginTop: "5px" }}>
            Target Revenue: R {targetRevenue.toLocaleString()}
          </div>
        </div>
        
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "6px",
            textAlign: "center",
            borderTop: "4px solid #4a352f",
          }}
        >
          <div style={{ fontSize: "14px", color: "#72542b", marginBottom: "8px", fontWeight: "600" }}>
            Avg Conversion Rate
          </div>
          <div style={{ fontSize: "20px", color: "#5d4037", fontWeight: "bold" }}>
            {avgConversionRate.toFixed(1)}%
          </div>
          <div style={{ fontSize: "12px", color: "#7d5a50", marginTop: "5px" }}>
            Monthly Average
          </div>
        </div>
      </div>

      {/* CHARTS SECTION - Four Charts (2x2 grid) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "30px" }}>
        
        {/* Lead Volume Trends Chart */}
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px", fontSize: "16px" }}>
            Lead Volume Trends
          </h3>
          <div style={{ height: "250px", marginBottom: "15px" }}>
            <Bar
              data={{
                labels: monthNames,
                datasets: [
                  {
                    label: "Lead Volume",
                    data: leadVolumeTrends,
                    backgroundColor: "#9c7c5f",
                    borderColor: "#5d4037",
                    borderWidth: 1,
                    borderRadius: 4,
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
                    title: {
                      display: true,
                      text: "Number of Leads",
                      color: "#72542b",
                    },
                    grid: {
                      color: "rgba(125, 90, 80, 0.1)",
                    },
                    ticks: {
                      color: "#72542b",
                    },
                  },
                  x: {
                    ticks: {
                      color: "#72542b",
                      maxRotation: 45,
                    },
                    grid: {
                      color: "rgba(125, 90, 80, 0.1)",
                    },
                  },
                },
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "12px", color: "#7d5a50" }}>
              Avg: {avgLeadVolume.toFixed(1)} leads/month
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => handleAddNotes("Lead Volume Trends")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#7d5a50",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                }}
              >
                <FaStickyNote size={12} /> Add Notes
              </button>
              <button
                onClick={() => handleViewAnalysis("Lead Volume Trends")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                }}
              >
                <FaChartBar size={12} /> View Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Conversion Rates Chart */}
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px", fontSize: "16px" }}>
            Conversion Rates Trend
          </h3>
          <div style={{ height: "250px", marginBottom: "15px" }}>
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
                    max: 100,
                    title: {
                      display: true,
                      text: "Conversion Rate (%)",
                      color: "#72542b",
                    },
                    grid: {
                      color: "rgba(125, 90, 80, 0.1)",
                    },
                    ticks: {
                      color: "#72542b",
                      callback: function(value) {
                        return value + '%';
                      }
                    },
                  },
                  x: {
                    ticks: {
                      color: "#72542b",
                      maxRotation: 45,
                    },
                    grid: {
                      color: "rgba(125, 90, 80, 0.1)",
                    },
                  },
                },
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "12px", color: "#7d5a50" }}>
              Range: {Math.min(...conversionRates).toFixed(1)}% - {Math.max(...conversionRates).toFixed(1)}%
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => handleAddNotes("Conversion Rates")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#7d5a50",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                }}
              >
                <FaStickyNote size={12} /> Add Notes
              </button>
              <button
                onClick={() => handleViewAnalysis("Conversion Rates")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                }}
              >
                <FaChartBar size={12} /> View Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Pipeline Value vs Risk Adjusted Value Chart */}
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px", fontSize: "16px" }}>
            Pipeline Value Comparison
          </h3>
          <div style={{ height: "250px", marginBottom: "15px" }}>
            <Bar
              data={{
                labels: ["Total vs Risk Adjusted"],
                datasets: [
                  {
                    label: "Total Pipeline Value",
                    data: [totalPipelineValue],
                    backgroundColor: "#9c7c5f",
                    borderColor: "#5d4037",
                    borderWidth: 1,
                    borderRadius: 4,
                  },
                  {
                    label: "Risk Adjusted Value",
                    data: [riskAdjustedValue],
                    backgroundColor: "#7d5a50",
                    borderColor: "#4a352f",
                    borderWidth: 1,
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      color: "#72542b",
                    }
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: "Value (ZAR)",
                      color: "#72542b",
                    },
                    grid: {
                      color: "rgba(125, 90, 80, 0.1)",
                    },
                    ticks: {
                      color: "#72542b",
                      callback: function(value) {
                        if (value >= 1000000) {
                          return 'R' + (value / 1000000).toFixed(1) + 'M';
                        } else if (value >= 1000) {
                          return 'R' + (value / 1000).toFixed(0) + 'K';
                        }
                        return 'R' + value;
                      }
                    },
                  },
                  x: {
                    ticks: {
                      color: "#72542b",
                    },
                    grid: {
                      color: "rgba(125, 90, 80, 0.1)",
                    },
                  },
                },
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "12px", color: "#7d5a50" }}>
              Risk Adjustment: {probability}% probability
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => handleAddNotes("Pipeline Value Comparison")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#7d5a50",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                }}
              >
                <FaStickyNote size={12} /> Add Notes
              </button>
              <button
                onClick={() => handleViewAnalysis("Pipeline Value Comparison")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                }}
              >
                <FaChartBar size={12} /> View Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Pipeline Coverage Explanation */}
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px", fontSize: "16px" }}>
            Pipeline Coverage Analysis
          </h3>
          <div style={{ 
            flex: 1, 
            display: "flex", 
            flexDirection: "column", 
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center"
          }}>
            <div style={{ 
              fontSize: "48px", 
              color: pipelineCoverageRatio >= 100 ? "#16a34a" : 
                     pipelineCoverageRatio >= 80 ? "#f59e0b" : "#dc2626",
              fontWeight: "bold",
              marginBottom: "10px"
            }}>
              {pipelineCoverageRatio}%
            </div>
            <div style={{ fontSize: "16px", color: "#5d4037", marginBottom: "5px", fontWeight: "600" }}>
              Pipeline Coverage Ratio
            </div>
            <div style={{ fontSize: "14px", color: "#7d5a50", marginBottom: "15px" }}>
              Pipeline Value ÷ Target Revenue
            </div>
            
            <div style={{ 
              width: "100%", 
              backgroundColor: "#e8ddd4", 
              height: "20px", 
              borderRadius: "10px",
              marginBottom: "15px",
              overflow: "hidden"
            }}>
              <div 
                style={{ 
                  width: `${Math.min(pipelineCoverageRatio, 100)}%`, 
                  height: "100%", 
                  backgroundColor: pipelineCoverageRatio >= 100 ? "#16a34a" : 
                                 pipelineCoverageRatio >= 80 ? "#f59e0b" : "#dc2626",
                  transition: "width 0.5s ease"
                }} 
              />
            </div>
            
            <div style={{ fontSize: "13px", color: "#72542b", textAlign: "left", width: "100%" }}>
              <div style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
                <span>Target Revenue:</span>
                <span style={{ fontWeight: "600" }}>R {targetRevenue.toLocaleString()}</span>
              </div>
              <div style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
                <span>Pipeline Value:</span>
                <span style={{ fontWeight: "600" }}>R {totalPipelineValue.toLocaleString()}</span>
              </div>
              <div style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
                <span>Risk Adjusted:</span>
                <span style={{ fontWeight: "600" }}>R {riskAdjustedValue.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "15px" }}>
            <button
              onClick={() => handleAddNotes("Pipeline Coverage")}
              style={{
                padding: "6px 12px",
                backgroundColor: "#7d5a50",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
              }}
            >
              <FaStickyNote size={12} /> Add Notes
            </button>
          </div>
        </div>
      </div>

      {/* CALCULATION SUMMARY */}
      <div style={{ 
        backgroundColor: "#f7f3f0", 
        padding: "15px", 
        borderRadius: "6px",
        marginTop: "20px"
      }}>
        <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "10px" }}>Calculation Formulas</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
          <div>
            <div style={{ fontSize: "13px", color: "#72542b", fontWeight: "600", marginBottom: "5px" }}>
              Risk Adjusted Pipeline Value
            </div>
            <div style={{ fontSize: "12px", color: "#7d5a50" }}>
              = Total Pipeline Value × Probability %
            </div>
            <div style={{ fontSize: "12px", color: "#5d4037", marginTop: "5px" }}>
              R {totalPipelineValue.toLocaleString()} × {probability}% = R {riskAdjustedValue.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "13px", color: "#72542b", fontWeight: "600", marginBottom: "5px" }}>
              Pipeline Coverage Ratio
            </div>
            <div style={{ fontSize: "12px", color: "#7d5a50" }}>
              = (Pipeline Value ÷ Target Revenue) × 100%
            </div>
            <div style={{ fontSize: "12px", color: "#5d4037", marginTop: "5px" }}>
              (R {totalPipelineValue.toLocaleString()} ÷ R {targetRevenue.toLocaleString()}) × 100% = {pipelineCoverageRatio}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Pipeline Quality Component
// Pipeline Quality Component
const PipelineQuality = ({ activeSection, currentUser, isInvestorView }) => {
  const [costPerLeadChannels, setCostPerLeadChannels] = useState([])
  const [cacLtvData, setCacLtvData] = useState(Array(12).fill({ cac: 0, ltv: 0 }))
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
        setCacLtvData(data.cacLtvData || Array(12).fill({ cac: 0, ltv: 0 }))
        setSqlToOpportunity(data.sqlToOpportunity || 0)
        setOpportunityToCustomer(data.opportunityToCustomer || 0)
        setRepeatCustomers(data.repeatCustomers || 0)
        setChurnRate(data.churnRate || 0)
      } else {
        await setDoc(docRef, {
          costPerLeadChannels: [
            { name: "Social Media", cost: 0 },
            { name: "Email", cost: 0 },
            { name: "PPC", cost: 0 },
            { name: "SEO", cost: 0 },
            { name: "Referral", cost: 0 }
          ],
          cacLtvData: Array(12).fill({ cac: 0, ltv: 0 }),
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
        cacLtvData,
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

  const handleAddNotes = (chartName) => {
    alert(`Add Notes functionality for ${chartName}`)
  }

  const handleViewAnalysis = (chartName) => {
    alert(`View Analysis functionality for ${chartName}`)
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

  // Calculate averages and totals
  const totalCac = cacLtvData.reduce((sum, month) => sum + month.cac, 0) / (cacLtvData.filter(m => m.cac > 0).length || 1)
  const totalLtv = cacLtvData.reduce((sum, month) => sum + month.ltv, 0) / (cacLtvData.filter(m => m.ltv > 0).length || 1)
  const ltvCacRatio = totalCac > 0 ? (totalLtv / totalCac).toFixed(1) : 0
  
  // Calculate average cost per lead across all channels
  const avgCostPerLead = costPerLeadChannels.length > 0 
    ? costPerLeadChannels.reduce((sum, channel) => sum + channel.cost, 0) / costPerLeadChannels.length
    : 0

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

          <h4 style={{ color: "#72542b" }}>Cost Per Lead by Channel (ZAR)</h4>
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

          <h4 style={{ color: "#72542b" }}>CAC vs LTV Trend (Monthly)</h4>
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
                min="0"
                max="100"
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
                min="0"
                max="100"
              />
            </div>
          </div>

          <h4 style={{ color: "#72542b" }}>Customer Retention Metrics</h4>
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
                min="0"
                max="100"
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
                min="0"
                max="100"
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

      {/* KEY METRICS - Top Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "10px", marginBottom: "30px" }}>
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
            borderTop: "4px solid #9c7c5f",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px", fontWeight: "600" }}>
            Avg Cost Per Lead
          </div>
          <div style={{ fontSize: "18px", color: "#5d4037", fontWeight: "bold" }}>
            R {avgCostPerLead.toFixed(0)}
          </div>
          <div style={{ fontSize: "10px", color: "#7d5a50", marginTop: "3px" }}>
            {costPerLeadChannels.length} channels
          </div>
        </div>
        
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
            borderTop: "4px solid #7d5a50",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px", fontWeight: "600" }}>
            SQL → Opportunity
          </div>
          <div style={{ fontSize: "18px", color: "#5d4037", fontWeight: "bold" }}>{sqlToOpportunity}%</div>
          <div style={{ fontSize: "10px", color: "#7d5a50", marginTop: "3px" }}>Conversion Rate</div>
        </div>
        
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
            borderTop: "4px solid #5d4037",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px", fontWeight: "600" }}>
            Opp → Customer
          </div>
          <div style={{ fontSize: "18px", color: "#5d4037", fontWeight: "bold" }}>{opportunityToCustomer}%</div>
          <div style={{ fontSize: "10px", color: "#7d5a50", marginTop: "3px" }}>Conversion Rate</div>
        </div>
        
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
            borderTop: "4px solid #4a352f",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px", fontWeight: "600" }}>
            Repeat Customers
          </div>
          <div style={{ fontSize: "18px", color: "#5d4037", fontWeight: "bold" }}>{repeatCustomers}%</div>
          <div style={{ fontSize: "10px", color: "#7d5a50", marginTop: "3px" }}>Retention Rate</div>
        </div>
        
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
            borderTop: "4px solid #dc2626",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px", fontWeight: "600" }}>
            Churn Rate
          </div>
          <div style={{ fontSize: "18px", color: "#5d4037", fontWeight: "bold" }}>{churnRate}%</div>
          <div style={{ fontSize: "10px", color: "#7d5a50", marginTop: "3px" }}>Customer Loss</div>
        </div>
        
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
            borderTop: "4px solid #16a34a",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px", fontWeight: "600" }}>
            LTV:CAC Ratio
          </div>
          <div style={{ fontSize: "18px", color: "#5d4037", fontWeight: "bold" }}>{ltvCacRatio}x</div>
          <div style={{ fontSize: "10px", color: "#7d5a50", marginTop: "3px" }}>
            Avg: R{totalLtv.toFixed(0)}:R{totalCac.toFixed(0)}
          </div>
        </div>
      </div>

      {/* CHARTS SECTION - 3 charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
        
        {/* Cost Per Lead by Channel Chart */}
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px", fontSize: "16px" }}>
            Cost Per Lead by Channel
          </h3>
          <div style={{ height: "250px", marginBottom: "15px" }}>
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
                    borderRadius: 4,
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
                    title: {
                      display: true,
                      text: "Cost (ZAR)",
                      color: "#72542b",
                    },
                    grid: {
                      color: "rgba(125, 90, 80, 0.1)",
                    },
                    ticks: {
                      color: "#72542b",
                    },
                  },
                  x: {
                    ticks: {
                      color: "#72542b",
                      maxRotation: 45,
                    },
                    grid: {
                      color: "rgba(125, 90, 80, 0.1)",
                    },
                  },
                },
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "12px", color: "#7d5a50" }}>
              Avg: R{avgCostPerLead.toFixed(0)}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => handleAddNotes("Cost Per Lead")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#7d5a50",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                }}
              >
                <FaStickyNote size={12} /> Add Notes
              </button>
              <button
                onClick={() => handleViewAnalysis("Cost Per Lead")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                }}
              >
                <FaChartBar size={12} /> View Analysis
              </button>
            </div>
          </div>
        </div>

        {/* CAC vs LTV Trend Chart */}
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px", fontSize: "16px" }}>
            CAC vs LTV Trend
          </h3>
          <div style={{ height: "250px", marginBottom: "15px" }}>
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
                    fill: false,
                  },
                  {
                    label: "LTV (ZAR)",
                    data: cacLtvData.map((d) => d.ltv),
                    borderColor: "#16a34a",
                    backgroundColor: "rgba(22, 163, 74, 0.1)",
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      color: "#72542b",
                    }
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: "Value (ZAR)",
                      color: "#72542b",
                    },
                    grid: {
                      color: "rgba(125, 90, 80, 0.1)",
                    },
                    ticks: {
                      color: "#72542b",
                    },
                  },
                  x: {
                    ticks: {
                      color: "#72542b",
                      maxRotation: 45,
                    },
                    grid: {
                      color: "rgba(125, 90, 80, 0.1)",
                    },
                  },
                },
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "12px", color: "#7d5a50" }}>
              LTV:CAC = {ltvCacRatio}x
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => handleAddNotes("CAC vs LTV")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#7d5a50",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                }}
              >
                <FaStickyNote size={12} /> Add Notes
              </button>
              <button
                onClick={() => handleViewAnalysis("CAC vs LTV")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                }}
              >
                <FaChartBar size={12} /> View Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Repeat Customers vs Churn Chart */}
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px", fontSize: "16px" }}>
            Repeat Customers vs Churn
          </h3>
          <div style={{ height: "250px", marginBottom: "15px" }}>
            <Bar
              data={{
                labels: ["Retention vs Churn"],
                datasets: [
                  {
                    label: "Repeat Customers",
                    data: [repeatCustomers],
                    backgroundColor: "#16a34a",
                    borderColor: "#15803d",
                    borderWidth: 1,
                    borderRadius: 4,
                  },
                  {
                    label: "Churn Rate",
                    data: [churnRate],
                    backgroundColor: "#dc2626",
                    borderColor: "#b91c1c",
                    borderWidth: 1,
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      color: "#72542b",
                    }
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                      display: true,
                      text: "Percentage (%)",
                      color: "#72542b",
                    },
                    grid: {
                      color: "rgba(125, 90, 80, 0.1)",
                    },
                    ticks: {
                      color: "#72542b",
                      callback: function(value) {
                        return value + '%';
                      }
                    },
                  },
                  x: {
                    ticks: {
                      color: "#72542b",
                    },
                    grid: {
                      color: "rgba(125, 90, 80, 0.1)",
                    },
                  },
                },
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "12px", color: "#7d5a50" }}>
              Net Retention: {repeatCustomers - churnRate}%
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => handleAddNotes("Retention vs Churn")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#7d5a50",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                }}
              >
                <FaStickyNote size={12} /> Add Notes
              </button>
              <button
                onClick={() => handleViewAnalysis("Retention vs Churn")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                }}
              >
                <FaChartBar size={12} /> View Analysis
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONVERSION FUNNEL VISUALIZATION */}
      <div
        style={{
          backgroundColor: "#f7f3f0",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          marginBottom: "30px",
        }}
      >
        <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px", fontSize: "16px" }}>
          Conversion Funnel Analysis
        </h3>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ 
              backgroundColor: "#fdfcfb", 
              padding: "15px 25px", 
              borderRadius: "8px",
              border: "2px solid #d4c4b0",
              marginBottom: "10px"
            }}>
              <div style={{ fontSize: "14px", color: "#72542b", fontWeight: "600" }}>SQL</div>
              <div style={{ fontSize: "12px", color: "#7d5a50" }}>Starting Point</div>
            </div>
            <div style={{ 
              backgroundColor: sqlToOpportunity >= 50 ? "#16a34a" : 
                             sqlToOpportunity >= 30 ? "#f59e0b" : "#dc2626",
              color: "white",
              padding: "5px 10px",
              borderRadius: "15px",
              fontSize: "12px",
              fontWeight: "600",
              marginTop: "10px"
            }}>
              {sqlToOpportunity}% Convert
            </div>
          </div>
          
          <div style={{ fontSize: "24px", color: "#7d5a50", margin: "0 10px" }}>→</div>
          
          <div style={{ textAlign: "center" }}>
            <div style={{ 
              backgroundColor: "#fdfcfb", 
              padding: "15px 25px", 
              borderRadius: "8px",
              border: "2px solid #d4c4b0",
              marginBottom: "10px"
            }}>
              <div style={{ fontSize: "14px", color: "#72542b", fontWeight: "600" }}>Opportunity</div>
              <div style={{ fontSize: "12px", color: "#7d5a50" }}>Qualified Leads</div>
            </div>
            <div style={{ 
              backgroundColor: opportunityToCustomer >= 50 ? "#16a34a" : 
                             opportunityToCustomer >= 30 ? "#f59e0b" : "#dc2626",
              color: "white",
              padding: "5px 10px",
              borderRadius: "15px",
              fontSize: "12px",
              fontWeight: "600",
              marginTop: "10px"
            }}>
              {opportunityToCustomer}% Convert
            </div>
          </div>
          
          <div style={{ fontSize: "24px", color: "#7d5a50", margin: "0 10px" }}>→</div>
          
          <div style={{ textAlign: "center" }}>
            <div style={{ 
              backgroundColor: "#fdfcfb", 
              padding: "15px 25px", 
              borderRadius: "8px",
              border: "2px solid #d4c4b0",
              marginBottom: "10px"
            }}>
              <div style={{ fontSize: "14px", color: "#72542b", fontWeight: "600" }}>Customer</div>
              <div style={{ fontSize: "12px", color: "#7d5a50" }}>Closed Deals</div>
            </div>
            <div style={{ 
              backgroundColor: repeatCustomers >= 70 ? "#16a34a" : 
                             repeatCustomers >= 50 ? "#f59e0b" : "#dc2626",
              color: "white",
              padding: "5px 10px",
              borderRadius: "15px",
              fontSize: "12px",
              fontWeight: "600",
              marginTop: "10px"
            }}>
              {repeatCustomers}% Repeat
            </div>
          </div>
        </div>
        
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          marginTop: "20px",
          paddingTop: "15px",
          borderTop: "1px solid #e8ddd4"
        }}>
          <div style={{ fontSize: "12px", color: "#7d5a50" }}>
            <strong>Overall Efficiency:</strong> {(sqlToOpportunity * opportunityToCustomer / 100).toFixed(1)}% SQL to Customer
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => handleAddNotes("Conversion Funnel")}
              style={{
                padding: "6px 12px",
                backgroundColor: "#7d5a50",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
              }}
            >
              <FaStickyNote size={12} /> Add Notes
            </button>
            <button
              onClick={() => handleViewAnalysis("Conversion Funnel")}
              style={{
                padding: "6px 12px",
                backgroundColor: "#5d4037",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
              }}
            >
              <FaChartBar size={12} /> View Analysis
            </button>
          </div>
        </div>
      </div>

      {/* CAC vs LTV RATIO ANALYSIS */}
      <div style={{ 
        backgroundColor: "#f7f3f0", 
        padding: "15px", 
        borderRadius: "6px",
        marginTop: "20px"
      }}>
        <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "10px" }}>LTV:CAC Ratio Analysis</h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px" }}>
          <div>
            <div style={{ fontSize: "13px", color: "#72542b", fontWeight: "600", marginBottom: "5px" }}>
              Current LTV:CAC Ratio
            </div>
            <div style={{ 
              fontSize: "24px", 
              color: ltvCacRatio >= 3 ? "#16a34a" : 
                     ltvCacRatio >= 1.5 ? "#f59e0b" : "#dc2626",
              fontWeight: "bold" 
            }}>
              {ltvCacRatio}x
            </div>
            <div style={{ fontSize: "12px", color: "#7d5a50", marginTop: "5px" }}>
              {ltvCacRatio >= 3 ? "Excellent" : 
               ltvCacRatio >= 1.5 ? "Good" : "Needs Improvement"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "13px", color: "#72542b", fontWeight: "600", marginBottom: "5px" }}>
              Average Customer Acquisition Cost
            </div>
            <div style={{ fontSize: "18px", color: "#5d4037", fontWeight: "bold" }}>
              R {totalCac.toFixed(0)}
            </div>
            <div style={{ fontSize: "12px", color: "#7d5a50", marginTop: "5px" }}>
              Monthly Average CAC
            </div>
          </div>
          <div>
            <div style={{ fontSize: "13px", color: "#72542b", fontWeight: "600", marginBottom: "5px" }}>
              Average Lifetime Value
            </div>
            <div style={{ fontSize: "18px", color: "#5d4037", fontWeight: "bold" }}>
              R {totalLtv.toFixed(0)}
            </div>
            <div style={{ fontSize: "12px", color: "#7d5a50", marginTop: "5px" }}>
              Monthly Average LTV
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Revenue Concentration Component
// Revenue Concentration Component
const RevenueConcentration = ({ activeSection, currentUser, isInvestorView }) => {
  const [revenueChannels, setRevenueChannels] = useState([])
  const [customerSegments, setCustomerSegments] = useState([])
  const [showEditForm, setShowEditForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [notesExpanded, setNotesExpanded] = useState(false)
  const [chartType, setChartType] = useState("channel") // "channel" or "segment"

  useEffect(() => {
    if (currentUser && activeSection === "revenue-concentration") {
      loadData()
    }
  }, [currentUser, activeSection, selectedYear])

  const loadData = async () => {
    if (!currentUser) return
    try {
      setIsLoading(true)
      const docRef = doc(db, "revenue-concentration", `${currentUser.uid}_${selectedYear}`)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        setRevenueChannels(data.revenueChannels || [])
        setCustomerSegments(data.customerSegments || [])
      } else {
        await setDoc(docRef, {
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
      await setDoc(doc(db, "revenue-concentration", `${currentUser.uid}_${selectedYear}`), {
        revenueChannels,
        customerSegments,
        lastUpdated: new Date().toISOString(),
      })
      setShowEditForm(false)
      alert("Revenue concentration data saved successfully!")
    } catch (error) {
      console.error("Error saving data:", error)
      alert("Error saving data")
    }
  }

  const addRevenueChannel = () => {
    setRevenueChannels([...revenueChannels, { name: "New Channel", revenue: 0, spend: 0 }])
  }

  const removeRevenueChannel = (index) => {
    const newChannels = revenueChannels.filter((_, i) => i !== index)
    setRevenueChannels(newChannels)
  }

  const updateRevenueChannel = (index, field, value) => {
    const newChannels = [...revenueChannels]
    newChannels[index][field] = field === "name" ? value : Number(value)
    setRevenueChannels(newChannels)
  }

  const addCustomerSegment = () => {
    setCustomerSegments([...customerSegments, { name: "New Segment", revenue: 0, customerCount: 0 }])
  }

  const removeCustomerSegment = (index) => {
    const newSegments = customerSegments.filter((_, i) => i !== index)
    setCustomerSegments(newSegments)
  }

  const updateCustomerSegment = (index, field, value) => {
    const newSegments = [...customerSegments]
    newSegments[index][field] = field === "name" ? value : Number(value)
    setCustomerSegments(newSegments)
  }

  const handleAddNotes = (chartName) => {
    alert(`Add Notes functionality for ${chartName}`)
  }

  const handleViewAnalysis = (chartName) => {
    alert(`View Analysis functionality for ${chartName}`)
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

  // Calculate totals and analytics
  const totalRevenue = revenueChannels.reduce((sum, channel) => sum + channel.revenue, 0)
  const totalSpend = revenueChannels.reduce((sum, channel) => sum + channel.spend, 0)
  const totalROI = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend * 100).toFixed(1) : 0
  
  // Sort channels by revenue to get top 3
  const sortedChannels = [...revenueChannels].sort((a, b) => b.revenue - a.revenue)
  const top3Channels = sortedChannels.slice(0, 3)
  const top3Revenue = top3Channels.reduce((sum, c) => sum + c.revenue, 0)
  const top3Percentage = totalRevenue > 0 ? ((top3Revenue / totalRevenue) * 100).toFixed(1) : 0
  
  // Sort segments by revenue to get top 3
  const sortedSegments = [...customerSegments].sort((a, b) => b.revenue - a.revenue)
  const top3Segments = sortedSegments.slice(0, 3)
  const top3SegmentRevenue = top3Segments.reduce((sum, s) => sum + s.revenue, 0)
  const top3SegmentPercentage = totalRevenue > 0 ? ((top3SegmentRevenue / totalRevenue) * 100).toFixed(1) : 0

  // Calculate ROI per channel
  const channelsWithROI = revenueChannels.map(channel => ({
    ...channel,
    roi: channel.spend > 0 ? ((channel.revenue - channel.spend) / channel.spend * 100).toFixed(1) : 0,
    roiValue: channel.spend > 0 ? (channel.revenue - channel.spend) : 0
  }))

  // Calculate revenue per customer for segments
  const segmentsWithMetrics = customerSegments.map(segment => ({
    ...segment,
    avgRevenuePerCustomer: segment.customerCount > 0 ? (segment.revenue / segment.customerCount).toFixed(0) : 0
  }))

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
          <h3 style={{ color: "#72542b", marginTop: 0 }}>Add Revenue Concentration Data</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
            {/* Revenue Channels Section */}
            <div>
              <h4 style={{ color: "#72542b", marginBottom: "15px" }}>Revenue Channels</h4>
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
                    onChange={(e) => updateRevenueChannel(index, "name", e.target.value)}
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
                    onChange={(e) => updateRevenueChannel(index, "revenue", e.target.value)}
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
                    onChange={(e) => updateRevenueChannel(index, "spend", e.target.value)}
                    style={{
                      padding: "8px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                    }}
                    placeholder="Spend (ZAR)"
                  />
                  <button
                    onClick={() => removeRevenueChannel(index)}
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
                onClick={addRevenueChannel}
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
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                <FaPlus /> Add Channel
              </button>
            </div>

            {/* Customer Segments Section */}
            <div>
              <h4 style={{ color: "#72542b", marginBottom: "15px" }}>Customer Segments</h4>
              {customerSegments.map((segment, index) => (
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
                    value={segment.name}
                    onChange={(e) => updateCustomerSegment(index, "name", e.target.value)}
                    style={{
                      padding: "8px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                    }}
                    placeholder="Segment Name"
                  />
                  <input
                    type="number"
                    value={segment.revenue}
                    onChange={(e) => updateCustomerSegment(index, "revenue", e.target.value)}
                    style={{
                      padding: "8px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                    }}
                    placeholder="Revenue (ZAR)"
                  />
                  <input
                    type="number"
                    value={segment.customerCount}
                    onChange={(e) => updateCustomerSegment(index, "customerCount", e.target.value)}
                    style={{
                      padding: "8px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                    }}
                    placeholder="Customers"
                  />
                  <button
                    onClick={() => removeCustomerSegment(index)}
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
                onClick={addCustomerSegment}
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
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                <FaPlus /> Add Segment
              </button>
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
              width: "100%",
            }}
          >
            Save Data
          </button>
        </div>
      )}

      {/* KEY METRICS - Top Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px", marginBottom: "30px" }}>
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "6px",
            textAlign: "center",
            borderTop: "4px solid #9c7c5f",
          }}
        >
          <div style={{ fontSize: "14px", color: "#72542b", marginBottom: "8px", fontWeight: "600" }}>
            Total Revenue
          </div>
          <div style={{ fontSize: "20px", color: "#5d4037", fontWeight: "bold" }}>
            R {totalRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: "12px", color: "#7d5a50", marginTop: "5px" }}>
            Year {selectedYear}
          </div>
        </div>
        
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "6px",
            textAlign: "center",
            borderTop: "4px solid #7d5a50",
          }}
        >
          <div style={{ fontSize: "14px", color: "#72542b", marginBottom: "8px", fontWeight: "600" }}>
            Total Spend
          </div>
          <div style={{ fontSize: "20px", color: "#5d4037", fontWeight: "bold" }}>
            R {totalSpend.toLocaleString()}
          </div>
          <div style={{ fontSize: "12px", color: "#7d5a50", marginTop: "5px" }}>
            Across all channels
          </div>
        </div>
        
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "6px",
            textAlign: "center",
            borderTop: "4px solid #5d4037",
          }}
        >
          <div style={{ fontSize: "14px", color: "#72542b", marginBottom: "8px", fontWeight: "600" }}>
            Overall ROI
          </div>
          <div style={{ fontSize: "20px", color: totalROI > 0 ? "#16a34a" : "#dc2626", fontWeight: "bold" }}>
            {totalROI}%
          </div>
          <div style={{ fontSize: "12px", color: "#7d5a50", marginTop: "5px" }}>
            Return on Investment
          </div>
        </div>
        
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "6px",
            textAlign: "center",
            borderTop: "4px solid #4a352f",
          }}
        >
          <div style={{ fontSize: "14px", color: "#72542b", marginBottom: "8px", fontWeight: "600" }}>
            Top 3 Concentration
          </div>
          <div style={{ 
            fontSize: "20px", 
            color: top3Percentage > 70 ? "#dc2626" : 
                   top3Percentage > 50 ? "#f59e0b" : "#16a34a", 
            fontWeight: "bold" 
          }}>
            {top3Percentage}%
          </div>
          <div style={{ fontSize: "12px", color: "#7d5a50", marginTop: "5px" }}>
            {chartType === "channel" ? "Channels" : "Segments"}
          </div>
        </div>
      </div>

      {/* CHART TYPE SELECTOR */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <button
          onClick={() => setChartType("channel")}
          style={{
            padding: "8px 16px",
            backgroundColor: chartType === "channel" ? "#5d4037" : "#e8ddd4",
            color: chartType === "channel" ? "#fdfcfb" : "#5d4037",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
          }}
        >
          View by Channel
        </button>
        <button
          onClick={() => setChartType("segment")}
          style={{
            padding: "8px 16px",
            backgroundColor: chartType === "segment" ? "#5d4037" : "#e8ddd4",
            color: chartType === "segment" ? "#fdfcfb" : "#5d4037",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
          }}
        >
          View by Customer Segment
        </button>
      </div>

      {/* CHARTS SECTION - 3 charts in grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
        
        {/* Revenue Distribution Pie Chart */}
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px", fontSize: "16px" }}>
            {chartType === "channel" ? "Revenue by Channel" : "Revenue by Customer Segment"}
          </h3>
          <div style={{ height: "250px", marginBottom: "15px" }}>
            {chartType === "channel" ? (
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
                      position: 'right',
                      labels: {
                        color: "#72542b",
                        padding: 15,
                      }
                    },
                  },
                }}
              />
            ) : (
              <Pie
                data={{
                  labels: customerSegments.map((s) => s.name),
                  datasets: [
                    {
                      label: "Revenue (ZAR)",
                      data: customerSegments.map((s) => s.revenue),
                      backgroundColor: [
                        "#16a34a",
                        "#f59e0b",
                        "#dc2626",
                        "#3b82f6",
                        "#8b5cf6",
                        "#06b6d4",
                        "#f97316",
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
                      position: 'right',
                      labels: {
                        color: "#72542b",
                        padding: 15,
                      }
                    },
                  },
                }}
              />
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "12px", color: "#7d5a50" }}>
              Total: R{totalRevenue.toLocaleString()}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => handleAddNotes(chartType === "channel" ? "Revenue by Channel" : "Revenue by Segment")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#7d5a50",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                }}
              >
                <FaStickyNote size={12} /> Add Notes
              </button>
              <button
                onClick={() => handleViewAnalysis(chartType === "channel" ? "Revenue by Channel" : "Revenue by Segment")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                }}
              >
                <FaChartBar size={12} /> View Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Revenue vs Spend Bar Chart */}
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px", fontSize: "16px" }}>
            Revenue per Channel vs Spend
          </h3>
          <div style={{ height: "250px", marginBottom: "15px" }}>
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
                    borderRadius: 4,
                  },
                  {
                    label: "Spend (ZAR)",
                    data: revenueChannels.map((c) => c.spend),
                    backgroundColor: "#dc2626",
                    borderColor: "#b91c1c",
                    borderWidth: 1,
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      color: "#72542b",
                    }
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: "Amount (ZAR)",
                      color: "#72542b",
                    },
                    grid: {
                      color: "rgba(125, 90, 80, 0.1)",
                    },
                    ticks: {
                      color: "#72542b",
                    },
                  },
                  x: {
                    ticks: {
                      color: "#72542b",
                      maxRotation: 45,
                    },
                    grid: {
                      color: "rgba(125, 90, 80, 0.1)",
                    },
                  },
                },
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "12px", color: "#7d5a50" }}>
              ROI: {totalROI}%
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => handleAddNotes("Revenue vs Spend")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#7d5a50",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                }}
              >
                <FaStickyNote size={12} /> Add Notes
              </button>
              <button
                onClick={() => handleViewAnalysis("Revenue vs Spend")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                }}
              >
                <FaChartBar size={12} /> View Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Top 3 Concentration Pie Chart */}
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px", fontSize: "16px" }}>
            {chartType === "channel" ? "Top 3 Channels" : "Top 3 Customer Segments"}
          </h3>
          <div style={{ height: "250px", marginBottom: "15px" }}>
            <Pie
              data={{
                labels: chartType === "channel" 
                  ? top3Channels.map((c) => c.name)
                  : top3Segments.map((s) => s.name),
                datasets: [
                  {
                    label: "Revenue (ZAR)",
                    data: chartType === "channel"
                      ? top3Channels.map((c) => c.revenue)
                      : top3Segments.map((s) => s.revenue),
                    backgroundColor: [
                      "#16a34a",
                      "#f59e0b",
                      "#dc2626",
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
                    position: 'right',
                    labels: {
                      color: "#72542b",
                      padding: 15,
                    }
                  },
                },
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "12px", color: "#7d5a50" }}>
              {top3Percentage}% of total revenue
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => handleAddNotes(chartType === "channel" ? "Top 3 Channels" : "Top 3 Segments")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#7d5a50",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                }}
              >
                <FaStickyNote size={12} /> Add Notes
              </button>
              <button
                onClick={() => handleViewAnalysis(chartType === "channel" ? "Top 3 Channels" : "Top 3 Segments")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                }}
              >
                <FaChartBar size={12} /> View Analysis
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CHANNEL PERFORMANCE ANALYSIS */}
      <div
        style={{
          backgroundColor: "#f7f3f0",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          marginBottom: "30px",
        }}
      >
        <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px", fontSize: "16px" }}>
          Channel Performance & ROI Analysis
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#5d4037", color: "#fdfcfb" }}>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "13px" }}>Channel</th>
                <th style={{ padding: "12px", textAlign: "right", fontSize: "13px" }}>Revenue (ZAR)</th>
                <th style={{ padding: "12px", textAlign: "right", fontSize: "13px" }}>Spend (ZAR)</th>
                <th style={{ padding: "12px", textAlign: "right", fontSize: "13px" }}>Net Profit</th>
                <th style={{ padding: "12px", textAlign: "right", fontSize: "13px" }}>ROI %</th>
                <th style={{ padding: "12px", textAlign: "right", fontSize: "13px" }}>% of Revenue</th>
              </tr>
            </thead>
            <tbody>
              {channelsWithROI.sort((a, b) => b.revenue - a.revenue).map((channel, index) => (
                <tr
                  key={index}
                  style={{
                    borderBottom: "1px solid #e8ddd4",
                    backgroundColor: index % 2 === 0 ? "#fdfcfb" : "#f7f3f0",
                  }}
                >
                  <td style={{ padding: "10px", fontSize: "13px", color: "#5d4037", fontWeight: "600" }}>
                    {channel.name}
                  </td>
                  <td style={{ padding: "10px", fontSize: "13px", color: "#5d4037", textAlign: "right" }}>
                    R {channel.revenue.toLocaleString()}
                  </td>
                  <td style={{ padding: "10px", fontSize: "13px", color: "#5d4037", textAlign: "right" }}>
                    R {channel.spend.toLocaleString()}
                  </td>
                  <td style={{ 
                    padding: "10px", 
                    fontSize: "13px", 
                    color: channel.roiValue >= 0 ? "#16a34a" : "#dc2626", 
                    textAlign: "right",
                    fontWeight: "600"
                  }}>
                    R {Math.abs(channel.roiValue).toLocaleString()} {channel.roiValue >= 0 ? "Profit" : "Loss"}
                  </td>
                  <td style={{ 
                    padding: "10px", 
                    fontSize: "13px", 
                    color: channel.roi >= 0 ? "#16a34a" : "#dc2626", 
                    textAlign: "right",
                    fontWeight: "600"
                  }}>
                    {channel.roi}%
                  </td>
                  <td style={{ padding: "10px", fontSize: "13px", color: "#5d4037", textAlign: "right" }}>
                    {totalRevenue > 0 ? ((channel.revenue / totalRevenue) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: "#e8ddd4", fontWeight: "600" }}>
                <td style={{ padding: "12px", fontSize: "13px", color: "#5d4037" }}>TOTAL</td>
                <td style={{ padding: "12px", fontSize: "13px", color: "#5d4037", textAlign: "right" }}>
                  R {totalRevenue.toLocaleString()}
                </td>
                <td style={{ padding: "12px", fontSize: "13px", color: "#5d4037", textAlign: "right" }}>
                  R {totalSpend.toLocaleString()}
                </td>
                <td style={{ 
                  padding: "12px", 
                  fontSize: "13px", 
                  color: totalRevenue - totalSpend >= 0 ? "#16a34a" : "#dc2626", 
                  textAlign: "right"
                }}>
                  R {Math.abs(totalRevenue - totalSpend).toLocaleString()} {totalRevenue - totalSpend >= 0 ? "Profit" : "Loss"}
                </td>
                <td style={{ 
                  padding: "12px", 
                  fontSize: "13px", 
                  color: totalROI >= 0 ? "#16a34a" : "#dc2626", 
                  textAlign: "right"
                }}>
                  {totalROI}%
                </td>
                <td style={{ padding: "12px", fontSize: "13px", color: "#5d4037", textAlign: "right" }}>
                  100%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "15px" }}>
          <button
            onClick={() => handleAddNotes("Channel Performance")}
            style={{
              padding: "6px 12px",
              backgroundColor: "#7d5a50",
              color: "#fdfcfb",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "12px",
            }}
          >
            <FaStickyNote size={12} /> Add Notes
          </button>
        </div>
      </div>

      {/* CONCENTRATION RISK ANALYSIS */}
      <div style={{ 
        backgroundColor: "#f7f3f0", 
        padding: "15px", 
        borderRadius: "6px",
      }}>
        <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "10px" }}>Concentration Risk Analysis</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <div style={{ fontSize: "13px", color: "#72542b", fontWeight: "600", marginBottom: "5px" }}>
              Channel Concentration Risk
            </div>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              marginBottom: "10px"
            }}>
              <div style={{ 
                width: "100%", 
                backgroundColor: "#e8ddd4", 
                height: "20px", 
                borderRadius: "10px",
                overflow: "hidden"
              }}>
                <div 
                  style={{ 
                    width: `${top3Percentage}%`, 
                    height: "100%", 
                    backgroundColor: top3Percentage > 70 ? "#dc2626" : 
                                   top3Percentage > 50 ? "#f59e0b" : "#16a34a",
                  }} 
                />
              </div>
              <div style={{ 
                marginLeft: "10px", 
                fontSize: "14px", 
                color: "#5d4037",
                fontWeight: "600",
                minWidth: "40px"
              }}>
                {top3Percentage}%
              </div>
            </div>
            <div style={{ fontSize: "12px", color: "#7d5a50" }}>
              Top 3 channels generate {top3Percentage}% of total revenue
              {top3Percentage > 70 && " - High risk: Over-dependent on few channels"}
              {top3Percentage <= 70 && top3Percentage > 50 && " - Moderate risk"}
              {top3Percentage <= 50 && " - Low risk: Well diversified"}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: "13px", color: "#72542b", fontWeight: "600", marginBottom: "5px" }}>
              Customer Segment Concentration
            </div>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              marginBottom: "10px"
            }}>
              <div style={{ 
                width: "100%", 
                backgroundColor: "#e8ddd4", 
                height: "20px", 
                borderRadius: "10px",
                overflow: "hidden"
              }}>
                <div 
                  style={{ 
                    width: `${top3SegmentPercentage}%`, 
                    height: "100%", 
                    backgroundColor: top3SegmentPercentage > 70 ? "#dc2626" : 
                                   top3SegmentPercentage > 50 ? "#f59e0b" : "#16a34a",
                  }} 
                />
              </div>
              <div style={{ 
                marginLeft: "10px", 
                fontSize: "14px", 
                color: "#5d4037",
                fontWeight: "600",
                minWidth: "40px"
              }}>
                {top3SegmentPercentage}%
              </div>
            </div>
            <div style={{ fontSize: "12px", color: "#7d5a50" }}>
              Top 3 customer segments generate {top3SegmentPercentage}% of total revenue
              {top3SegmentPercentage > 70 && " - High risk: Over-dependent on few segments"}
              {top3SegmentPercentage <= 70 && top3SegmentPercentage > 50 && " - Moderate risk"}
              {top3SegmentPercentage <= 50 && " - Low risk: Well diversified"}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Demand Sustainability Component
// Demand Sustainability Component
const DemandSustainability = ({ activeSection, currentUser, isInvestorView }) => {
  const [referralRateTrend, setReferralRateTrend] = useState(Array(12).fill(0))
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
        setReferralRateTrend(data.referralRateTrend || Array(12).fill(0))
        setRepeatCustomerRate(data.repeatCustomerRate || 0)
        setChurnRate(data.churnRate || 0)
        setCampaigns(data.campaigns || [])
        setCacLtvData(data.cacLtvData || Array(12).fill({ cac: 0, ltv: 0 }))
      } else {
        await setDoc(docRef, {
          referralRateTrend: Array(12).fill(0),
          repeatCustomerRate: 0,
          churnRate: 0,
          campaigns: [
            { name: "Q1 Campaign", cost: 0, revenue: 0 },
            { name: "Q2 Campaign", cost: 0, revenue: 0 },
            { name: "Summer Sale", cost: 0, revenue: 0 },
            { name: "Holiday Campaign", cost: 0, revenue: 0 }
          ],
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
        referralRateTrend,
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
    setCampaigns([...campaigns, { name: "New Campaign", cost: 0, revenue: 0 }])
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

  const handleAddNotes = (chartName) => {
    alert(`Add Notes functionality for ${chartName}`)
  }

  const handleViewAnalysis = (chartName) => {
    alert(`View Analysis functionality for ${chartName}`)
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

  // Calculate campaign metrics
  const totalCampaignCost = campaigns.reduce((sum, campaign) => sum + campaign.cost, 0)
  const totalCampaignRevenue = campaigns.reduce((sum, campaign) => sum + campaign.revenue, 0)
  const totalCampaignROI = totalCampaignCost > 0 ? ((totalCampaignRevenue - totalCampaignCost) / totalCampaignCost * 100).toFixed(1) : 0
  const campaignsWithROI = campaigns.map(campaign => ({
    ...campaign,
    roi: campaign.cost > 0 ? ((campaign.revenue - campaign.cost) / campaign.cost * 100).toFixed(1) : 0,
    roiValue: campaign.revenue - campaign.cost,
    contribution: totalCampaignCost > 0 ? ((campaign.cost / totalCampaignCost) * 100).toFixed(1) : 0
  }))

  // Calculate CAC vs LTV trends
  const avgCac = cacLtvData.reduce((sum, month) => sum + month.cac, 0) / (cacLtvData.filter(m => m.cac > 0).length || 1)
  const avgLtv = cacLtvData.reduce((sum, month) => sum + month.ltv, 0) / (cacLtvData.filter(m => m.ltv > 0).length || 1)
  const ltvCacRatio = avgCac > 0 ? (avgLtv / avgCac).toFixed(1) : 0
  
  // Calculate CAC trend (is it declining?)
  const firstHalfAvgCac = cacLtvData.slice(0, 6).reduce((sum, month) => sum + month.cac, 0) / 6
  const secondHalfAvgCac = cacLtvData.slice(6, 12).reduce((sum, month) => sum + month.cac, 0) / 6
  const cacDeclineRate = firstHalfAvgCac > 0 ? ((firstHalfAvgCac - secondHalfAvgCac) / firstHalfAvgCac * 100).toFixed(1) : 0
  
  // Calculate LTV trend (is it rising?)
  const firstHalfAvgLtv = cacLtvData.slice(0, 6).reduce((sum, month) => sum + month.ltv, 0) / 6
  const secondHalfAvgLtv = cacLtvData.slice(6, 12).reduce((sum, month) => sum + month.ltv, 0) / 6
  const ltvGrowthRate = firstHalfAvgLtv > 0 ? ((secondHalfAvgLtv - firstHalfAvgLtv) / firstHalfAvgLtv * 100).toFixed(1) : 0

  // Calculate referral rate average
  const avgReferralRate = referralRateTrend.reduce((sum, rate) => sum + rate, 0) / 12

  // Net retention rate (Repeat - Churn)
  const netRetentionRate = repeatCustomerRate - churnRate

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
                  value={referralRateTrend[index]}
                  onChange={(e) => {
                    const newData = [...referralRateTrend]
                    newData[index] = Number(e.target.value)
                    setReferralRateTrend(newData)
                  }}
                  style={{
                    width: "100%",
                    padding: "6px",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                  }}
                  min="0"
                  max="100"
                />
              </div>
            ))}
          </div>

          <h4 style={{ color: "#72542b" }}>Customer Retention Metrics</h4>
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
                min="0"
                max="100"
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
                min="0"
                max="100"
              />
            </div>
          </div>

          <h4 style={{ color: "#72542b" }}>Campaign Cost & Revenue</h4>
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
                value={campaign.revenue}
                onChange={(e) => updateCampaign(index, "revenue", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Revenue (ZAR)"
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

      {/* KEY METRICS - Top Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "10px", marginBottom: "30px" }}>
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
            borderTop: "4px solid #9c7c5f",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px", fontWeight: "600" }}>
            Avg Referral Rate
          </div>
          <div style={{ fontSize: "18px", color: "#5d4037", fontWeight: "bold" }}>{avgReferralRate.toFixed(1)}%</div>
          <div style={{ fontSize: "10px", color: "#7d5a50", marginTop: "3px" }}>Organic Growth</div>
        </div>
        
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
            borderTop: "4px solid #7d5a50",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px", fontWeight: "600" }}>
            Repeat Customers
          </div>
          <div style={{ fontSize: "18px", color: "#5d4037", fontWeight: "bold" }}>{repeatCustomerRate}%</div>
          <div style={{ fontSize: "10px", color: "#7d5a50", marginTop: "3px" }}>Retention Rate</div>
        </div>
        
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
            borderTop: "4px solid #5d4037",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px", fontWeight: "600" }}>
            Churn Rate
          </div>
          <div style={{ fontSize: "18px", color: "#5d4037", fontWeight: "bold" }}>{churnRate}%</div>
          <div style={{ fontSize: "10px", color: "#7d5a50", marginTop: "3px" }}>Customer Loss</div>
        </div>
        
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
            borderTop: "4px solid #4a352f",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px", fontWeight: "600" }}>
            Net Retention
          </div>
          <div style={{ 
            fontSize: "18px", 
            color: netRetentionRate >= 0 ? "#16a34a" : "#dc2626", 
            fontWeight: "bold" 
          }}>
            {netRetentionRate}%
          </div>
          <div style={{ fontSize: "10px", color: "#7d5a50", marginTop: "3px" }}>Repeat - Churn</div>
        </div>
        
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
            borderTop: "4px solid #dc2626",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px", fontWeight: "600" }}>
            Campaign ROI
          </div>
          <div style={{ 
            fontSize: "18px", 
            color: totalCampaignROI >= 0 ? "#16a34a" : "#dc2626", 
            fontWeight: "bold" 
          }}>
            {totalCampaignROI}%
          </div>
          <div style={{ fontSize: "10px", color: "#7d5a50", marginTop: "3px" }}>Overall ROI</div>
        </div>
        
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "15px",
            borderRadius: "6px",
            textAlign: "center",
            borderTop: "4px solid #16a34a",
          }}
        >
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px", fontWeight: "600" }}>
            LTV:CAC Trend
          </div>
          <div style={{ fontSize: "18px", color: "#5d4037", fontWeight: "bold" }}>
            {cacDeclineRate > 0 && ltvGrowthRate > 0 ? "✓ Healthy" : "⚠ Needs Work"}
          </div>
          <div style={{ fontSize: "10px", color: "#7d5a50", marginTop: "3px" }}>
            {cacDeclineRate}%↓ CAC, {ltvGrowthRate}%↑ LTV
          </div>
        </div>
      </div>

      {/* CHARTS SECTION - 3 charts in grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
        
        {/* Referral Rate Trend Chart */}
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px", fontSize: "16px" }}>
            Referral Rate Trend
          </h3>
          <div style={{ height: "250px", marginBottom: "15px" }}>
            <Line
              data={{
                labels: monthNames,
                datasets: [
                  {
                    label: "Referral Rate (%)",
                    data: referralRateTrend,
                    borderColor: "#9c7c5f",
                    backgroundColor: "rgba(156, 124, 95, 0.1)",
                    borderWidth: 2,
                    tension: 0.3,
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
                    max: 100,
                    title: {
                      display: true,
                      text: "Referral Rate (%)",
                      color: "#72542b",
                    },
                    grid: {
                      color: "rgba(125, 90, 80, 0.1)",
                    },
                    ticks: {
                      color: "#72542b",
                      callback: function(value) {
                        return value + '%';
                      }
                    },
                  },
                  x: {
                    ticks: {
                      color: "#72542b",
                      maxRotation: 45,
                    },
                    grid: {
                      color: "rgba(125, 90, 80, 0.1)",
                    },
                  },
                },
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "12px", color: "#7d5a50" }}>
              Avg: {avgReferralRate.toFixed(1)}%
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => handleAddNotes("Referral Rate Trend")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#7d5a50",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                }}
              >
                <FaStickyNote size={12} /> Add Notes
              </button>
              <button
                onClick={() => handleViewAnalysis("Referral Rate Trend")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                }}
              >
                <FaChartBar size={12} /> View Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Campaign Cost Contribution & ROI Chart */}
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px", fontSize: "16px" }}>
            Campaign Cost Contribution & ROI
          </h3>
          <div style={{ height: "250px", marginBottom: "15px" }}>
            <Bar
              data={{
                labels: campaignsWithROI.map((c) => c.name),
                datasets: [
                  {
                    label: "Cost Contribution (%)",
                    data: campaignsWithROI.map((c) => c.contribution),
                    backgroundColor: "#dc2626",
                    borderColor: "#b91c1c",
                    borderWidth: 1,
                    borderRadius: 4,
                    yAxisID: 'y',
                  },
                  {
                    label: "ROI (%)",
                    data: campaignsWithROI.map((c) => c.roi),
                    backgroundColor: "#16a34a",
                    borderColor: "#15803d",
                    borderWidth: 1,
                    borderRadius: 4,
                    yAxisID: 'y1',
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      color: "#72542b",
                    }
                  },
                },
                scales: {
                  y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                      display: true,
                      text: "Cost Contribution (%)",
                      color: "#72542b",
                    },
                    grid: {
                      color: "rgba(125, 90, 80, 0.1)",
                    },
                    ticks: {
                      color: "#72542b",
                      callback: function(value) {
                        return value + '%';
                      }
                    },
                  },
                  y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                      display: true,
                      text: "ROI (%)",
                      color: "#72542b",
                    },
                    grid: {
                      drawOnChartArea: false,
                    },
                    ticks: {
                      color: "#72542b",
                      callback: function(value) {
                        return value + '%';
                      }
                    },
                  },
                  x: {
                    ticks: {
                      color: "#72542b",
                      maxRotation: 45,
                    },
                    grid: {
                      color: "rgba(125, 90, 80, 0.1)",
                    },
                  },
                },
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "12px", color: "#7d5a50" }}>
              Total Cost: R{totalCampaignCost.toLocaleString()}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => handleAddNotes("Campaign Analysis")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#7d5a50",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                }}
              >
                <FaStickyNote size={12} /> Add Notes
              </button>
              <button
                onClick={() => handleViewAnalysis("Campaign Analysis")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                }}
              >
                <FaChartBar size={12} /> View Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Repeat Customers vs Churn Chart */}
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px", fontSize: "16px" }}>
            Customer Retention Analysis
          </h3>
          <div style={{ height: "250px", marginBottom: "15px" }}>
            <Bar
              data={{
                labels: ["Retention vs Churn"],
                datasets: [
                  {
                    label: "Repeat Customers",
                    data: [repeatCustomerRate],
                    backgroundColor: "#16a34a",
                    borderColor: "#15803d",
                    borderWidth: 1,
                    borderRadius: 4,
                  },
                  {
                    label: "Churn Rate",
                    data: [churnRate],
                    backgroundColor: "#dc2626",
                    borderColor: "#b91c1c",
                    borderWidth: 1,
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      color: "#72542b",
                    }
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                      display: true,
                      text: "Percentage (%)",
                      color: "#72542b",
                    },
                    grid: {
                      color: "rgba(125, 90, 80, 0.1)",
                    },
                    ticks: {
                      color: "#72542b",
                      callback: function(value) {
                        return value + '%';
                      }
                    },
                  },
                  x: {
                    ticks: {
                      color: "#72542b",
                    },
                    grid: {
                      color: "rgba(125, 90, 80, 0.1)",
                    },
                  },
                },
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "12px", color: "#7d5a50" }}>
              Net Retention: {netRetentionRate}%
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => handleAddNotes("Retention Analysis")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#7d5a50",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                }}
              >
                <FaStickyNote size={12} /> Add Notes
              </button>
              <button
                onClick={() => handleViewAnalysis("Retention Analysis")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                }}
              >
                <FaChartBar size={12} /> View Analysis
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DECLINING CAC WITH RISING LTV - KEY METRIC */}
      <div
        style={{
          backgroundColor: "#f7f3f0",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          marginBottom: "30px",
        }}
      >
        <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px", fontSize: "16px" }}>
          Declining CAC with Rising LTV (Key Health Indicator)
        </h3>
        <div style={{ height: "300px", marginBottom: "15px" }}>
          <Line
            data={{
              labels: monthNames,
              datasets: [
                {
                  label: "CAC (Customer Acquisition Cost)",
                  data: cacLtvData.map((d) => d.cac),
                  borderColor: "#dc2626",
                  backgroundColor: "rgba(220, 38, 38, 0.1)",
                  borderWidth: 3,
                  tension: 0.4,
                  fill: false,
                },
                {
                  label: "LTV (Lifetime Value)",
                  data: cacLtvData.map((d) => d.ltv),
                  borderColor: "#16a34a",
                  backgroundColor: "rgba(22, 163, 74, 0.1)",
                  borderWidth: 3,
                  tension: 0.4,
                  fill: false,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                  labels: {
                    color: "#72542b",
                  }
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: "Value (ZAR)",
                    color: "#72542b",
                  },
                  grid: {
                    color: "rgba(125, 90, 80, 0.1)",
                  },
                  ticks: {
                    color: "#72542b",
                  },
                },
                x: {
                  ticks: {
                    color: "#72542b",
                    maxRotation: 45,
                  },
                  grid: {
                    color: "rgba(125, 90, 80, 0.1)",
                  },
                },
              },
            }}
          />
        </div>
        
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(4, 1fr)", 
          gap: "15px",
          marginTop: "20px"
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "14px", color: "#72542b", marginBottom: "5px", fontWeight: "600" }}>
              Avg CAC
            </div>
            <div style={{ fontSize: "20px", color: "#dc2626", fontWeight: "bold" }}>
              R {avgCac.toFixed(0)}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "14px", color: "#72542b", marginBottom: "5px", fontWeight: "600" }}>
              Avg LTV
            </div>
            <div style={{ fontSize: "20px", color: "#16a34a", fontWeight: "bold" }}>
              R {avgLtv.toFixed(0)}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "14px", color: "#72542b", marginBottom: "5px", fontWeight: "600" }}>
              LTV:CAC Ratio
            </div>
            <div style={{ 
              fontSize: "20px", 
              color: ltvCacRatio >= 3 ? "#16a34a" : 
                     ltvCacRatio >= 1.5 ? "#f59e0b" : "#dc2626",
              fontWeight: "bold" 
            }}>
              {ltvCacRatio}x
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "14px", color: "#72542b", marginBottom: "5px", fontWeight: "600" }}>
              Trend Health
            </div>
            <div style={{ 
              fontSize: "20px", 
              color: cacDeclineRate > 0 && ltvGrowthRate > 0 ? "#16a34a" : 
                     cacDeclineRate > 0 || ltvGrowthRate > 0 ? "#f59e0b" : "#dc2626",
              fontWeight: "bold" 
            }}>
              {cacDeclineRate > 0 && ltvGrowthRate > 0 ? "✓ Healthy" : 
               cacDeclineRate > 0 || ltvGrowthRate > 0 ? "⚠ Mixed" : "✗ At Risk"}
            </div>
          </div>
        </div>
        
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          marginTop: "20px",
          paddingTop: "15px",
          borderTop: "1px solid #e8ddd4"
        }}>
          <div style={{ fontSize: "12px", color: "#7d5a50" }}>
            <strong>Trend Analysis:</strong> CAC {cacDeclineRate >= 0 ? `declined by ${cacDeclineRate}%` : `increased by ${Math.abs(cacDeclineRate)}%`}, 
            LTV {ltvGrowthRate >= 0 ? `grew by ${ltvGrowthRate}%` : `declined by ${Math.abs(ltvGrowthRate)}%`}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => handleAddNotes("CAC vs LTV Trend")}
              style={{
                padding: "6px 12px",
                backgroundColor: "#7d5a50",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
              }}
            >
              <FaStickyNote size={12} /> Add Notes
            </button>
            <button
              onClick={() => handleViewAnalysis("CAC vs LTV Trend")}
              style={{
                padding: "6px 12px",
                backgroundColor: "#5d4037",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
              }}
            >
              <FaChartBar size={12} /> View Analysis
            </button>
          </div>
        </div>
      </div>

      {/* CAMPAIGN PERFORMANCE DETAILS */}
      <div style={{ 
        backgroundColor: "#f7f3f0", 
        padding: "15px", 
        borderRadius: "6px",
        marginBottom: "30px"
      }}>
        <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "10px" }}>Campaign Performance Details</h4>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#5d4037", color: "#fdfcfb" }}>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "13px" }}>Campaign</th>
                <th style={{ padding: "12px", textAlign: "right", fontSize: "13px" }}>Cost (ZAR)</th>
                <th style={{ padding: "12px", textAlign: "right", fontSize: "13px" }}>Revenue (ZAR)</th>
                <th style={{ padding: "12px", textAlign: "right", fontSize: "13px" }}>Net Profit</th>
                <th style={{ padding: "12px", textAlign: "right", fontSize: "13px" }}>ROI %</th>
                <th style={{ padding: "12px", textAlign: "right", fontSize: "13px" }}>Cost Contribution</th>
              </tr>
            </thead>
            <tbody>
              {campaignsWithROI.sort((a, b) => b.cost - a.cost).map((campaign, index) => (
                <tr
                  key={index}
                  style={{
                    borderBottom: "1px solid #e8ddd4",
                    backgroundColor: index % 2 === 0 ? "#fdfcfb" : "#f7f3f0",
                  }}
                >
                  <td style={{ padding: "10px", fontSize: "13px", color: "#5d4037", fontWeight: "600" }}>
                    {campaign.name}
                  </td>
                  <td style={{ padding: "10px", fontSize: "13px", color: "#5d4037", textAlign: "right" }}>
                    R {campaign.cost.toLocaleString()}
                  </td>
                  <td style={{ padding: "10px", fontSize: "13px", color: "#5d4037", textAlign: "right" }}>
                    R {campaign.revenue.toLocaleString()}
                  </td>
                  <td style={{ 
                    padding: "10px", 
                    fontSize: "13px", 
                    color: campaign.roiValue >= 0 ? "#16a34a" : "#dc2626", 
                    textAlign: "right",
                    fontWeight: "600"
                  }}>
                    R {Math.abs(campaign.roiValue).toLocaleString()} {campaign.roiValue >= 0 ? "Profit" : "Loss"}
                  </td>
                  <td style={{ 
                    padding: "10px", 
                    fontSize: "13px", 
                    color: campaign.roi >= 0 ? "#16a34a" : "#dc2626", 
                    textAlign: "right",
                    fontWeight: "600"
                  }}>
                    {campaign.roi}%
                  </td>
                  <td style={{ padding: "10px", fontSize: "13px", color: "#5d4037", textAlign: "right" }}>
                    {campaign.contribution}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: "#e8ddd4", fontWeight: "600" }}>
                <td style={{ padding: "12px", fontSize: "13px", color: "#5d4037" }}>TOTAL</td>
                <td style={{ padding: "12px", fontSize: "13px", color: "#5d4037", textAlign: "right" }}>
                  R {totalCampaignCost.toLocaleString()}
                </td>
                <td style={{ padding: "12px", fontSize: "13px", color: "#5d4037", textAlign: "right" }}>
                  R {totalCampaignRevenue.toLocaleString()}
                </td>
                <td style={{ 
                  padding: "12px", 
                  fontSize: "13px", 
                  color: totalCampaignRevenue - totalCampaignCost >= 0 ? "#16a34a" : "#dc2626", 
                  textAlign: "right"
                }}>
                  R {Math.abs(totalCampaignRevenue - totalCampaignCost).toLocaleString()} {totalCampaignRevenue - totalCampaignCost >= 0 ? "Profit" : "Loss"}
                </td>
                <td style={{ 
                  padding: "12px", 
                  fontSize: "13px", 
                  color: totalCampaignROI >= 0 ? "#16a34a" : "#dc2626", 
                  textAlign: "right"
                }}>
                  {totalCampaignROI}%
                </td>
                <td style={{ padding: "12px", fontSize: "13px", color: "#5d4037", textAlign: "right" }}>
                  100%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* SUSTAINABILITY HEALTH CHECK */}
      <div style={{ 
        backgroundColor: "#f7f3f0", 
        padding: "15px", 
        borderRadius: "6px",
      }}>
        <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "10px" }}>Demand Sustainability Health Check</h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px" }}>
          <div>
            <div style={{ fontSize: "13px", color: "#72542b", fontWeight: "600", marginBottom: "5px" }}>
              Organic Growth Health
            </div>
            <div style={{ 
              fontSize: "24px", 
              color: avgReferralRate >= 10 ? "#16a34a" : 
                     avgReferralRate >= 5 ? "#f59e0b" : "#dc2626",
              fontWeight: "bold" 
            }}>
              {avgReferralRate >= 10 ? "Strong" : 
               avgReferralRate >= 5 ? "Moderate" : "Weak"}
            </div>
            <div style={{ fontSize: "12px", color: "#7d5a50", marginTop: "5px" }}>
              Avg Referral: {avgReferralRate.toFixed(1)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: "13px", color: "#72542b", fontWeight: "600", marginBottom: "5px" }}>
              Customer Retention Health
            </div>
            <div style={{ 
              fontSize: "24px", 
              color: netRetentionRate >= 20 ? "#16a34a" : 
                     netRetentionRate >= 0 ? "#f59e0b" : "#dc2626",
              fontWeight: "bold" 
            }}>
              {netRetentionRate >= 20 ? "Excellent" : 
               netRetentionRate >= 0 ? "Stable" : "At Risk"}
            </div>
            <div style={{ fontSize: "12px", color: "#7d5a50", marginTop: "5px" }}>
              Net Retention: {netRetentionRate}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: "13px", color: "#72542b", fontWeight: "600", marginBottom: "5px" }}>
              Campaign Efficiency
            </div>
            <div style={{ 
              fontSize: "24px", 
              color: totalCampaignROI >= 100 ? "#16a34a" : 
                     totalCampaignROI >= 50 ? "#f59e0b" : "#dc2626",
              fontWeight: "bold" 
            }}>
              {totalCampaignROI >= 100 ? "High ROI" : 
               totalCampaignROI >= 50 ? "Moderate ROI" : "Low ROI"}
            </div>
            <div style={{ fontSize: "12px", color: "#7d5a50", marginTop: "5px" }}>
              Overall ROI: {totalCampaignROI}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: "13px", color: "#72542b", fontWeight: "600", marginBottom: "5px" }}>
              LTV:CAC Health
            </div>
            <div style={{ 
              fontSize: "24px", 
              color: ltvCacRatio >= 3 ? "#16a34a" : 
                     ltvCacRatio >= 1.5 ? "#f59e0b" : "#dc2626",
              fontWeight: "bold" 
            }}>
              {ltvCacRatio >= 3 ? "Healthy" : 
               ltvCacRatio >= 1.5 ? "Acceptable" : "Poor"}
            </div>
            <div style={{ fontSize: "12px", color: "#7d5a50", marginTop: "5px" }}>
              Ratio: {ltvCacRatio}x
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Pipeline Table Component
// Pipeline Table Component
const PipelineTable = ({ activeSection, currentUser, isInvestorView }) => {
  const [deals, setDeals] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState({ show: false, dealId: null })
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [isLoading, setIsLoading] = useState(true)

  const [newDeal, setNewDeal] = useState({
    clientName: "",
    segment: "",
    stage: "initial-contact",
    probability: 0,
    expectedClose: "",
    dealValue: 0,
    source: "",
    owner: "",
    establishedStartDate: "",
    expectedOnboardingDate: "",
    signedDate: "",
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
        establishedStartDate: newDeal.establishedStartDate,
        expectedOnboardingDate: newDeal.expectedOnboardingDate,
        signedDate: newDeal.signedDate,
        userId: currentUser.uid,
        year: selectedYear,
        createdAt: new Date().toISOString(),
      })
      setNewDeal({
        clientName: "",
        segment: "",
        stage: "initial-contact",
        probability: 0,
        expectedClose: "",
        dealValue: 0,
        source: "",
        owner: "",
        establishedStartDate: "",
        expectedOnboardingDate: "",
        signedDate: "",
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
          <div style={{ fontSize: "12px", color: "#72542b", marginBottom: "5px" }}>Risk Adjustment</div>
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
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>Customer Segment</label>
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
                {stageOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
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
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>Established Start Date</label>
              <input
                type="date"
                value={newDeal.establishedStartDate}
                onChange={(e) => setNewDeal({ ...newDeal, establishedStartDate: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>Expected Onboarding Date</label>
              <input
                type="date"
                value={newDeal.expectedOnboardingDate}
                onChange={(e) => setNewDeal({ ...newDeal, expectedOnboardingDate: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#72542b", marginBottom: "5px" }}>Signed Date</label>
              <input
                type="date"
                value={newDeal.signedDate}
                onChange={(e) => setNewDeal({ ...newDeal, signedDate: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
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
              <th style={{ padding: "12px", textAlign: "left", fontSize: "13px" }}>Client / Deal</th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "13px" }}>Customer Segment</th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "13px" }}>Stage</th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "13px" }}>Probability %</th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "13px" }}>Established Start</th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "13px" }}>Expected Onboarding</th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "13px" }}>Signed Date</th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "13px" }}>Expected Close</th>
              <th style={{ padding: "12px", textAlign: "right", fontSize: "13px" }}>Deal Value (ZAR)</th>
              <th style={{ padding: "12px", textAlign: "right", fontSize: "13px" }}>Risk Adjustment (ZAR)</th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "13px" }}>Source</th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "13px" }}>Owner</th>
              {!isInvestorView && <th style={{ padding: "12px", textAlign: "center", fontSize: "13px" }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {deals.map((deal, index) => {
              const stageLabel = stageOptions.find(option => option.value === deal.stage)?.label || deal.stage
              return (
                <tr
                  key={deal.id}
                  style={{
                    borderBottom: "1px solid #e8ddd4",
                    backgroundColor: index % 2 === 0 ? "#fdfcfb" : "#f7f3f0",
                  }}
                >
                  <td style={{ padding: "12px", fontSize: "13px", color: "#5d4037" }}>{deal.clientName}</td>
                  <td style={{ padding: "12px", fontSize: "13px", color: "#5d4037" }}>{deal.segment}</td>
                  <td style={{ padding: "12px", fontSize: "13px", color: "#5d4037" }}>
                    <span style={{
                      display: "inline-block",
                      padding: "3px 8px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: "600",
                      backgroundColor: 
                        deal.stage === "initial-contact" ? "#e8ddd4" :
                        deal.stage === "qualification" ? "#d4c4b0" :
                        deal.stage === "proposal" ? "#9c7c5f" :
                        deal.stage === "negotiation" ? "#7d5a50" :
                        deal.stage === "closed-won" ? "#16a34a" :
                        deal.stage === "closed-lost" ? "#dc2626" : "#e8ddd4",
                      color: 
                        deal.stage === "initial-contact" ? "#5d4037" :
                        deal.stage === "closed-won" || deal.stage === "closed-lost" ? "white" : "#5d4037"
                    }}>
                      {stageLabel}
                    </span>
                  </td>
                  <td style={{ padding: "12px", fontSize: "13px", color: "#5d4037" }}>{deal.probability}%</td>
                  <td style={{ padding: "12px", fontSize: "13px", color: "#5d4037" }}>
                    {deal.establishedStartDate ? new Date(deal.establishedStartDate).toLocaleDateString() : "-"}
                  </td>
                  <td style={{ padding: "12px", fontSize: "13px", color: "#5d4037" }}>
                    {deal.expectedOnboardingDate ? new Date(deal.expectedOnboardingDate).toLocaleDateString() : "-"}
                  </td>
                  <td style={{ padding: "12px", fontSize: "13px", color: "#5d4037" }}>
                    {deal.signedDate ? new Date(deal.signedDate).toLocaleDateString() : "-"}
                  </td>
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
              )
            })}
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
                labels: stageOptions.map(option => option.label),
                datasets: [
                  {
                    label: "Deals by Stage",
                    data: stageOptions.map(option => 
                      deals.filter((d) => d.stage === option.value).length
                    ),
                    backgroundColor: [
                      "#e8ddd4", // Initial Contact
                      "#d4c4b0", // Qualification
                      "#9c7c5f", // Proposal
                      "#7d5a50", // Negotiation
                      "#16a34a", // Closed Won
                      "#dc2626", // Closed Lost
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
                    labels: {
                      color: "#72542b",
                      padding: 15,
                    }
                  },
                },
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "15px" }}>
            <button
              onClick={handleStageDistributionAddNotes}
              style={{
                padding: "6px 12px",
                backgroundColor: "#7d5a50",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
              }}
            >
              <FaStickyNote size={12} /> Add Notes
            </button>
            <button
              onClick={handleStageDistributionViewAnalysis}
              style={{
                padding: "6px 12px",
                backgroundColor: "#5d4037",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
                marginLeft: "10px"
              }}
            >
              <FaChartBar size={12} /> View Analysis
            </button>
          </div>
        </div>
      )}

      {/* Key Deal Metrics */}
      {deals.length > 0 && (
        <div style={{ 
          backgroundColor: "#f7f3f0", 
          padding: "15px", 
          borderRadius: "6px",
          marginTop: "30px"
        }}>
          <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "10px" }}>Deal Pipeline Insights</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px" }}>
            <div>
              <div style={{ fontSize: "13px", color: "#72542b", fontWeight: "600", marginBottom: "5px" }}>
                Average Deal Value
              </div>
              <div style={{ fontSize: "18px", color: "#5d4037", fontWeight: "bold" }}>
                R {(totalPipelineValue / deals.length).toFixed(0).toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "13px", color: "#72542b", fontWeight: "600", marginBottom: "5px" }}>
                Win Rate Potential
              </div>
              <div style={{ fontSize: "18px", color: "#5d4037", fontWeight: "bold" }}>
                {deals.length > 0 ? (deals.reduce((sum, d) => sum + d.probability, 0) / deals.length).toFixed(1) : 0}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: "13px", color: "#72542b", fontWeight: "600", marginBottom: "5px" }}>
                Risk Adjustment %
              </div>
              <div style={{ fontSize: "18px", color: "#5d4037", fontWeight: "bold" }}>
                {totalPipelineValue > 0 ? ((totalRiskAdjustedValue / totalPipelineValue) * 100).toFixed(1) : 0}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: "13px", color: "#72542b", fontWeight: "600", marginBottom: "5px" }}>
                Active Deals
              </div>
              <div style={{ fontSize: "18px", color: "#5d4037", fontWeight: "bold" }}>
                {deals.filter(d => !["closed-won", "closed-lost"].includes(d.stage)).length}
              </div>
            </div>
          </div>
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
  const [showFullDescription, setShowFullDescription] = useState(false)

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

        <div style={{ padding: "20px", paddingTop: "40px", marginLeft: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h1 style={{ color: "#5d4037", fontSize: "32px", fontWeight: "700", margin: 0 }}>
              Marketing & Pipeline Performance
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

          {/* Marketing & Pipeline Performance Description */}
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

                <div style={{ marginTop: "30px", paddingTop: "20px", borderTop: "1px solid #e8ddd4" }}>
                  <h3 style={{ color: "#7d5a50", marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>
                    Key Performance Dimensions
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div>
                      <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
                        Pipeline Visibility & Quality
                      </h4>
                      <p style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
                        Monitor lead quality, pipeline coverage, and deal health metrics
                      </p>
                    </div>
                    <div>
                      <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
                        Demand Risk & Concentration
                      </h4>
                      <p style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
                        Assess customer concentration, market dependence, and revenue predictability
                      </p>
                    </div>
                    <div>
                      <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
                        Conversion Efficiency
                      </h4>
                      <p style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
                        Track lead-to-opportunity and opportunity-to-close conversion rates
                      </p>
                    </div>
                    <div>
                      <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
                        Marketing Effectiveness
                      </h4>
                      <p style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
                        Measure channel performance, cost per acquisition, and marketing ROI
                      </p>
                    </div>
                  </div>
                  <p style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6", marginTop: "15px" }}>
                    This dashboard provides strategic insights into your marketing funnel and sales pipeline to identify growth opportunities and mitigate revenue risks.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section Buttons */}
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