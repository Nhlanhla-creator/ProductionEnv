"use client"

import { useState, useEffect } from "react"
import { Bar, Scatter } from "react-chartjs-2"
import Sidebar from "smses/Sidebar/Sidebar"
import Header from "../DashboardHeader/DashboardHeader"
import { db, auth } from "../../firebaseConfig"
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js"

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
)

const SECTION_DATA = {
  "strategic-clarity": {
    name: "Strategic Clarity",
    notes: {
      keyQuestion: "Is there a clear, articulated strategy that guides decision-making across the business?",
      keySignals: "Strategic priorities are explicit, Operating intent is consistent",
      keyDecisions:
        "Is the business intentionally steered or founder-driven? Is strategic clarification required before scaling or funding? Can external stakeholders understand the business direction?",
    },
    kpis: [
      "Vision",
      "Mission",
      "Values",
      "Strategic Priorities (Max 3-5)",
      "Strategic Horizon (timeframe selector 12-36 months)",
    ],
  },
  "operating-model": {
    name: "Operating Model",
    notes: {
      keyQuestion:
        "Is the way the business operates clearly defined and understood? Is the operating model fit for the current size and complexity of the business?",
      keySignals: "Current operating model explicit, not assumed.",
      keyDecisions: "Op model visibility, scalability, replicability, execution dependability",
    },
    kpis: [
      "Operating model definition",
      "Operating Model Fit: draw a table similar to heat map with each component of business canvas and we can do an analysis to see if it Strained 🔴 Strained 🟡 Misaligned 🔴",
    ],
  },
  "strategy-operationalisation": {
    name: "Strategy Operationalisation",
    notes: {
      keyQuestion: "Is strategy translated into clear goals, milestones, and management focus?",
      keySignals: "Strategic goals exist, Milestones are defined, Progress is reviewed, Accountability is clear",
      keyDecisions:
        "Business execution-ready for growth? Alignment to strategy, likelihood of absorbing funding effectively?",
    },
    kpis: ["Goal and Milestone table"],
  },
  "strategic-risk-control": {
    name: "Strategic Risk Control",
    notes: {
      keyQuestion: "Are strategic risks identified, monitored, and mitigated?",
      keySignals: "Risk register exists, Risks prioritised, Mitigations tracked, Ownership assigned",
      keyDecisions: "Business governability, existential risk mitigation, risk maturity sufficiency assessment",
    },
    kpis: [
      'Risk Management (change to Risk Register), and add "Owner" after Likelihood. Also add "review cadence" after status. Change mitigation status dropdown to 🟢 Controlled 🟡 Partially controlled 🔴 Uncontrolled',
    ],
  },
  "change-adaptability": {
    name: "Change and adaptability",
    notes: {
      keyQuestion: "Can the business adapt strategy in response to change without losing control?",
      keySignals: "Strategy reviews occur, Adjustments are deliberate, Learning is institutionalised",
      keyDecisions: "Business resilience, change management, growth signals",
    },
    kpis: [
      'Strategy review calendar (with place for status "done or not done"',
      "Adjustments documented",
      "Pivot history documented",
    ],
  },
}

const RISK_TYPE_DEFINITIONS = {
  "Financial Risk": "Risks related to funding, cash flow, pricing, revenue, and financial sustainability",
  "Market Risk": "Risks related to market dynamics, competition, demand shifts, and market positioning",
  "Operational Risk": "Risks related to processes, systems, resource availability, and operational execution",
  "Reputational Risk": "Risks related to brand perception, stakeholder trust, and public image",
  "Compliance Risk": "Risks related to legal requirements, regulations, licenses, and statutory obligations",
  "Technology Risk": "Risks related to technology infrastructure, cybersecurity, and digital capabilities",
}

// Strategic Clarity Component
const StrategicClarity = ({ activeSection, currentUser, isInvestorView }) => {
  const [visionMissionData, setVisionMissionData] = useState({
    vision: "",
    mission: "",
    values: [],
    strategicPriorities: [],
    strategicHorizon: "12",
  })
  const [showModal, setShowModal] = useState(false)
  const [showPriorityModal, setShowPriorityModal] = useState(false)
  const [newValue, setNewValue] = useState("")
  const [newPriority, setNewPriority] = useState("")

  useEffect(() => {
    const loadVisionMissionData = async () => {
      if (!currentUser || activeSection !== "strategic-clarity") return

      try {
        const visionMissionSnapshot = await getDocs(
          query(collection(db, "visionMission"), where("userId", "==", currentUser.uid)),
        )

        if (!visionMissionSnapshot.empty) {
          const data = visionMissionSnapshot.docs[0].data()
          setVisionMissionData({
            ...data,
            strategicPriorities: data.strategicPriorities || [],
            strategicHorizon: data.strategicHorizon || "12",
          })
        }
      } catch (error) {
        console.error("Error loading vision/mission data:", error)
      }
    }

    loadVisionMissionData()
  }, [activeSection, currentUser])

  if (activeSection !== "strategic-clarity") return null

  const handleSaveVisionMission = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    if (!currentUser) {
      alert("You must be logged in to save data.")
      return
    }

    try {
      const dataWithUser = {
        ...visionMissionData,
        userId: currentUser.uid,
        updatedAt: new Date().toISOString(),
      }

      const existingSnapshot = await getDocs(
        query(collection(db, "visionMission"), where("userId", "==", currentUser.uid)),
      )

      if (existingSnapshot.empty) {
        await addDoc(collection(db, "visionMission"), dataWithUser)
      } else {
        const docRef = doc(db, "visionMission", existingSnapshot.docs[0].id)
        await updateDoc(docRef, dataWithUser)
      }

      alert("Strategic Clarity data saved successfully!")
    } catch (error) {
      console.error("Error saving vision/mission data:", error)
      alert("Error saving data. Please try again.")
    }
  }

  const handleAddValue = () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    if (newValue.trim()) {
      setVisionMissionData((prev) => ({
        ...prev,
        values: [...prev.values, newValue.trim()],
      }))
      setNewValue("")
      setShowModal(false)
    }
  }

  const handleRemoveValue = (index) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    setVisionMissionData((prev) => ({
      ...prev,
      values: prev.values.filter((_, i) => i !== index),
    }))
  }

  const handleAddPriority = () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    if (newPriority.trim() && visionMissionData.strategicPriorities.length < 5) {
      setVisionMissionData((prev) => ({
        ...prev,
        strategicPriorities: [...prev.strategicPriorities, newPriority.trim()],
      }))
      setNewPriority("")
      setShowPriorityModal(false)
    } else if (visionMissionData.strategicPriorities.length >= 5) {
      alert("Maximum 5 strategic priorities allowed")
    }
  }

  const handleRemovePriority = (index) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    setVisionMissionData((prev) => ({
      ...prev,
      strategicPriorities: prev.strategicPriorities.filter((_, i) => i !== index),
    }))
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
      {/* Notes Section */}
      <div
        style={{
          backgroundColor: "#f5f0eb",
          padding: "15px",
          borderRadius: "6px",
          marginBottom: "20px",
          border: "2px solid #7d5a50",
        }}
      >

        <div style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6" }}>
          <p style={{ marginBottom: "8px" }}>
            <strong>Key Question:</strong> {SECTION_DATA["strategic-clarity"].notes.keyQuestion}
          </p>
          <p style={{ marginBottom: "8px" }}>
            <strong>Key Signals:</strong> {SECTION_DATA["strategic-clarity"].notes.keySignals}
          </p>
          <p style={{ marginBottom: "0" }}>
            <strong>Key Decisions:</strong> {SECTION_DATA["strategic-clarity"].notes.keyDecisions}
          </p>
        </div>
      </div>

      {!currentUser && (
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
          <p style={{ color: "#856404", margin: 0 }}>Please log in to access and manage your Strategic Clarity data.</p>
        </div>
      )}

      {currentUser && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "30px",
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                backgroundColor: "#f7f3f0",
                padding: "20px",
                borderRadius: "6px",
              }}
            >
              <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px" }}>Vision</h3>
              <textarea
                value={visionMissionData.vision}
                onChange={(e) => setVisionMissionData((prev) => ({ ...prev, vision: e.target.value }))}
                placeholder="Enter your organization's vision statement..."
                rows="6"
                disabled={isInvestorView}
                style={{
                  width: "100%",
                  padding: "15px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  resize: "vertical",
                  fontFamily: "inherit",
                  backgroundColor: isInvestorView ? "#f5f5f5" : "white",
                  cursor: isInvestorView ? "not-allowed" : "text",
                }}
              />
            </div>

            <div
              style={{
                backgroundColor: "#f7f3f0",
                padding: "20px",
                borderRadius: "6px",
              }}
            >
              <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px" }}>Mission</h3>
              <textarea
                value={visionMissionData.mission}
                onChange={(e) => setVisionMissionData((prev) => ({ ...prev, mission: e.target.value }))}
                placeholder="Enter your organization's mission statement..."
                rows="6"
                disabled={isInvestorView}
                style={{
                  width: "100%",
                  padding: "15px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  resize: "vertical",
                  fontFamily: "inherit",
                  backgroundColor: isInvestorView ? "#f5f5f5" : "white",
                  cursor: isInvestorView ? "not-allowed" : "text",
                }}
              />
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#f7f3f0",
              padding: "20px",
              borderRadius: "6px",
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h3 style={{ color: "#5d4037", margin: 0 }}>Core Values</h3>
              {!isInvestorView && (
                <button
                  onClick={() => setShowModal(true)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#7d5a50",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "12px",
                  }}
                >
                  Add Value
                </button>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "15px",
              }}
            >
              {visionMissionData.values.map((value, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: "#fdfcfb",
                    padding: "15px",
                    borderRadius: "4px",
                    border: "2px solid #e8ddd4",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "#5d4037", fontWeight: "500" }}>{value}</span>
                  {!isInvestorView && (
                    <button
                      onClick={() => handleRemoveValue(index)}
                      style={{
                        backgroundColor: "transparent",
                        border: "none",
                        color: "#d32f2f",
                        cursor: "pointer",
                        fontSize: "18px",
                        padding: "0 5px",
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#f7f3f0",
              padding: "20px",
              borderRadius: "6px",
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h3 style={{ color: "#5d4037", margin: 0 }}>Strategic Priorities (Max 3-5)</h3>
              {!isInvestorView && visionMissionData.strategicPriorities.length < 5 && (
                <button
                  onClick={() => setShowPriorityModal(true)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#7d5a50",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "12px",
                  }}
                >
                  Add Priority
                </button>
              )}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {visionMissionData.strategicPriorities.map((priority, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: "#fdfcfb",
                    padding: "15px",
                    borderRadius: "4px",
                    border: "2px solid #e8ddd4",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "#5d4037", fontWeight: "500" }}>
                    {index + 1}. {priority}
                  </span>
                  {!isInvestorView && (
                    <button
                      onClick={() => handleRemovePriority(index)}
                      style={{
                        backgroundColor: "transparent",
                        border: "none",
                        color: "#d32f2f",
                        cursor: "pointer",
                        fontSize: "18px",
                        padding: "0 5px",
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#f7f3f0",
              padding: "20px",
              borderRadius: "6px",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px" }}>
              Strategic Horizon (timeframe selector 12-36 months)
            </h3>
            <select
              value={visionMissionData.strategicHorizon}
              onChange={(e) => setVisionMissionData((prev) => ({ ...prev, strategicHorizon: e.target.value }))}
              disabled={isInvestorView}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                backgroundColor: isInvestorView ? "#f5f5f5" : "white",
                cursor: isInvestorView ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              <option value="12">12 months</option>
              <option value="18">18 months</option>
              <option value="24">24 months</option>
              <option value="30">30 months</option>
              <option value="36">36 months</option>
            </select>
          </div>

          {!isInvestorView && (
            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button
                onClick={handleSaveVisionMission}
                style={{
                  padding: "12px 30px",
                  backgroundColor: "#7d5a50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Save Changes
              </button>
            </div>
          )}
        </>
      )}

      {/* Add Value Modal */}
      {showModal && !isInvestorView && (
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
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "500px",
            }}
          >
            <h3 style={{ color: "#5d4037", marginTop: 0 }}>Add Core Value</h3>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Enter a core value..."
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "20px",
              }}
            />
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e6d7c3",
                  color: "#4a352f",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddValue}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#7d5a50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Add Value
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Priority Modal */}
      {showPriorityModal && !isInvestorView && (
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
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "500px",
            }}
          >
            <h3 style={{ color: "#5d4037", marginTop: 0 }}>Add Strategic Priority</h3>
            <input
              type="text"
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              placeholder="Enter a strategic priority..."
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "20px",
              }}
            />
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowPriorityModal(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e6d7c3",
                  color: "#4a352f",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddPriority}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#7d5a50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Add Priority
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Business Model Canvas Component (unchanged but renamed in tab)
const BusinessModelCanvas = ({ activeSection, currentUser, isInvestorView }) => {
  const [canvasData, setCanvasData] = useState({
    keyPartners: "",
    keyActivities: "",
    keyResources: "",
    valuePropositions: "",
    customerRelationships: "",
    channels: "",
    customerSegments: "",
    costStructure: "",
    revenueStreams: "",
  })

  useEffect(() => {
    const loadCanvasData = async () => {
      if (!currentUser || activeSection !== "operating-model") return

      try {
        const canvasSnapshot = await getDocs(
          query(collection(db, "businessModelCanvas"), where("userId", "==", currentUser.uid)),
        )

        if (!canvasSnapshot.empty) {
          const data = canvasSnapshot.docs[0].data()
          setCanvasData(data)
        }
      } catch (error) {
        console.error("Error loading canvas data:", error)
      }
    }

    loadCanvasData()
  }, [activeSection, currentUser])

  if (activeSection !== "operating-model") return null

  const handleSaveCanvas = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    if (!currentUser) {
      alert("You must be logged in to save data.")
      return
    }

    try {
      const dataWithUser = {
        ...canvasData,
        userId: currentUser.uid,
        updatedAt: new Date().toISOString(),
      }

      const existingSnapshot = await getDocs(
        query(collection(db, "businessModelCanvas"), where("userId", "==", currentUser.uid)),
      )

      if (existingSnapshot.empty) {
        await addDoc(collection(db, "businessModelCanvas"), dataWithUser)
      } else {
        const docRef = doc(db, "businessModelCanvas", existingSnapshot.docs[0].id)
        await updateDoc(docRef, dataWithUser)
      }

      alert("Operating Model saved successfully!")
    } catch (error) {
      console.error("Error saving canvas data:", error)
      alert("Error saving data. Please try again.")
    }
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
      {/* Notes Section */}
      <div
        style={{
          backgroundColor: "#f5f0eb",
          padding: "15px",
          borderRadius: "6px",
          marginBottom: "20px",
          border: "2px solid #7d5a50",
        }}
      >

        <div style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6" }}>
          <p style={{ marginBottom: "8px" }}>
            <strong>Key Question:</strong> {SECTION_DATA["operating-model"].notes.keyQuestion}
          </p>
          <p style={{ marginBottom: "8px" }}>
            <strong>Key Signals:</strong> {SECTION_DATA["operating-model"].notes.keySignals}
          </p>
          <p style={{ marginBottom: "0" }}>
            <strong>Key Decisions:</strong> {SECTION_DATA["operating-model"].notes.keyDecisions}
          </p>
        </div>
      </div>

      {!currentUser && (
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
          <p style={{ color: "#856404", margin: 0 }}>Please log in to access and manage your Operating Model.</p>
        </div>
      )}

      {currentUser && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gridTemplateRows: "auto auto",
              gap: "15px",
              marginBottom: "20px",
            }}
          >
            {/* Key Partners */}
            <div
              style={{
                gridColumn: "1",
                gridRow: "1 / 3",
                backgroundColor: "white",
                padding: "15px",
                borderRadius: "6px",
                border: "2px solid #e8ddd4",
              }}
            >
              <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "10px", fontSize: "14px" }}>Key Partners</h4>
              <textarea
                value={canvasData.keyPartners}
                onChange={(e) => setCanvasData((prev) => ({ ...prev, keyPartners: e.target.value }))}
                placeholder="Who are your key partners?"
                rows="10"
                disabled={isInvestorView}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "12px",
                  boxSizing: "border-box",
                  resize: "vertical",
                  fontFamily: "inherit",
                  backgroundColor: isInvestorView ? "#f5f5f5" : "white",
                  cursor: isInvestorView ? "not-allowed" : "text",
                }}
              />
            </div>

            {/* Key Activities */}
            <div
              style={{
                gridColumn: "2",
                gridRow: "1",
                backgroundColor: "white",
                padding: "15px",
                borderRadius: "6px",
                border: "2px solid #e8ddd4",
              }}
            >
              <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "10px", fontSize: "14px" }}>Key Activities</h4>
              <textarea
                value={canvasData.keyActivities}
                onChange={(e) => setCanvasData((prev) => ({ ...prev, keyActivities: e.target.value }))}
                placeholder="What key activities do you perform?"
                rows="4"
                disabled={isInvestorView}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "12px",
                  boxSizing: "border-box",
                  resize: "vertical",
                  fontFamily: "inherit",
                  backgroundColor: isInvestorView ? "#f5f5f5" : "white",
                  cursor: isInvestorView ? "not-allowed" : "text",
                }}
              />
            </div>

            {/* Value Propositions */}
            <div
              style={{
                gridColumn: "3",
                gridRow: "1 / 3",
                backgroundColor: "white",
                padding: "15px",
                borderRadius: "6px",
                border: "2px solid #e8ddd4",
              }}
            >
              <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "10px", fontSize: "14px" }}>
                Value Propositions
              </h4>
              <textarea
                value={canvasData.valuePropositions}
                onChange={(e) => setCanvasData((prev) => ({ ...prev, valuePropositions: e.target.value }))}
                placeholder="What value do you deliver?"
                rows="10"
                disabled={isInvestorView}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "12px",
                  boxSizing: "border-box",
                  resize: "vertical",
                  fontFamily: "inherit",
                  backgroundColor: isInvestorView ? "#f5f5f5" : "white",
                  cursor: isInvestorView ? "not-allowed" : "text",
                }}
              />
            </div>

            {/* Customer Relationships */}
            <div
              style={{
                gridColumn: "4",
                gridRow: "1",
                backgroundColor: "white",
                padding: "15px",
                borderRadius: "6px",
                border: "2px solid #e8ddd4",
              }}
            >
              <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "10px", fontSize: "14px" }}>
                Customer Relationships
              </h4>
              <textarea
                value={canvasData.customerRelationships}
                onChange={(e) => setCanvasData((prev) => ({ ...prev, customerRelationships: e.target.value }))}
                placeholder="What relationships do you have with customers?"
                rows="4"
                disabled={isInvestorView}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "12px",
                  boxSizing: "border-box",
                  resize: "vertical",
                  fontFamily: "inherit",
                  backgroundColor: isInvestorView ? "#f5f5f5" : "white",
                  cursor: isInvestorView ? "not-allowed" : "text",
                }}
              />
            </div>

            {/* Customer Segments */}
            <div
              style={{
                gridColumn: "5",
                gridRow: "1 / 3",
                backgroundColor: "white",
                padding: "15px",
                borderRadius: "6px",
                border: "2px solid #e8ddd4",
              }}
            >
              <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "10px", fontSize: "14px" }}>
                Customer Segments
              </h4>
              <textarea
                value={canvasData.customerSegments}
                onChange={(e) => setCanvasData((prev) => ({ ...prev, customerSegments: e.target.value }))}
                placeholder="Who are your customers?"
                rows="10"
                disabled={isInvestorView}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "12px",
                  boxSizing: "border-box",
                  resize: "vertical",
                  fontFamily: "inherit",
                  backgroundColor: isInvestorView ? "#f5f5f5" : "white",
                  cursor: isInvestorView ? "not-allowed" : "text",
                }}
              />
            </div>

            {/* Key Resources */}
            <div
              style={{
                gridColumn: "2",
                gridRow: "2",
                backgroundColor: "white",
                padding: "15px",
                borderRadius: "6px",
                border: "2px solid #e8ddd4",
              }}
            >
              <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "10px", fontSize: "14px" }}>Key Resources</h4>
              <textarea
                value={canvasData.keyResources}
                onChange={(e) => setCanvasData((prev) => ({ ...prev, keyResources: e.target.value }))}
                placeholder="What key resources do you need?"
                rows="4"
                disabled={isInvestorView}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "12px",
                  boxSizing: "border-box",
                  resize: "vertical",
                  fontFamily: "inherit",
                  backgroundColor: isInvestorView ? "#f5f5f5" : "white",
                  cursor: isInvestorView ? "not-allowed" : "text",
                }}
              />
            </div>

            {/* Channels */}
            <div
              style={{
                gridColumn: "4",
                gridRow: "2",
                backgroundColor: "white",
                padding: "15px",
                borderRadius: "6px",
                border: "2px solid #e8ddd4",
              }}
            >
              <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "10px", fontSize: "14px" }}>Channels</h4>
              <textarea
                value={canvasData.channels}
                onChange={(e) => setCanvasData((prev) => ({ ...prev, channels: e.target.value }))}
                placeholder="How do you reach customers?"
                rows="4"
                disabled={isInvestorView}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "12px",
                  boxSizing: "border-box",
                  resize: "vertical",
                  fontFamily: "inherit",
                  backgroundColor: isInvestorView ? "#f5f5f5" : "white",
                  cursor: isInvestorView ? "not-allowed" : "text",
                }}
              />
            </div>
          </div>

          {/* Cost Structure and Revenue Streams - Full Width Bottom Section */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "15px",
              marginBottom: "20px",
            }}
          >
            {/* Cost Structure */}
            <div
              style={{
                backgroundColor: "white",
                padding: "15px",
                borderRadius: "6px",
                border: "2px solid #e8ddd4",
              }}
            >
              <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "10px", fontSize: "14px" }}>Cost Structure</h4>
              <textarea
                value={canvasData.costStructure}
                onChange={(e) => setCanvasData((prev) => ({ ...prev, costStructure: e.target.value }))}
                placeholder="What are your main costs?"
                rows="4"
                disabled={isInvestorView}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "12px",
                  boxSizing: "border-box",
                  resize: "vertical",
                  fontFamily: "inherit",
                  backgroundColor: isInvestorView ? "#f5f5f5" : "white",
                  cursor: isInvestorView ? "not-allowed" : "text",
                }}
              />
            </div>

            {/* Revenue Streams */}
            <div
              style={{
                backgroundColor: "white",
                padding: "15px",
                borderRadius: "6px",
                border: "2px solid #e8ddd4",
              }}
            >
              <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "10px", fontSize: "14px" }}>
                Revenue Streams
              </h4>
              <textarea
                value={canvasData.revenueStreams}
                onChange={(e) => setCanvasData((prev) => ({ ...prev, revenueStreams: e.target.value }))}
                placeholder="How do you generate revenue?"
                rows="4"
                disabled={isInvestorView}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "12px",
                  boxSizing: "border-box",
                  resize: "vertical",
                  fontFamily: "inherit",
                  backgroundColor: isInvestorView ? "#f5f5f5" : "white",
                  cursor: isInvestorView ? "not-allowed" : "text",
                }}
              />
            </div>
          </div>

          {!isInvestorView && (
            <div style={{ textAlign: "right" }}>
              <button
                onClick={handleSaveCanvas}
                style={{
                  padding: "12px 30px",
                  backgroundColor: "#7d5a50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Save Operating Model
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Strategic Goals Component (renamed to Strategy Operationalisation)
const StrategicGoals = ({ activeSection, milestoneData, setMilestoneData, currentUser, isInvestorView }) => {
const categories = [
  {
    key: "Strategic Growth & Product Development",
    name: "Strategic Growth & Product Development",
    color: "#4A2E1F", // very dark espresso brown
  },
  {
    key: "Marketing, Brand & Customer Acquisition",
    name: "Marketing, Brand & Customer Acquisition",
    color: "#6B3F2A", // dark cocoa brown
  },
  {
    key: "Finance",
    name: "Finance",
    color: "#8B5A2B", // classic medium brown
  },
  {
    key: "Operations",
    name: "Operations",
    color: "#A47148", // warm tan brown
  },
  {
    key: "Systems & Technology",
    name: "Systems & Technology",
    color: "#7A5230", // roasted brown
  },
  {
    key: "People, Capability & Knowledge",
    name: "People, Capability & Knowledge",
    color: "#C6A27E", // light caramel
  },
  {
    key: "Governance, Impact & Ecosystem Building",
    name: "Governance, Impact & Ecosystem Building",
    color: "#E0C4A8", // soft beige brown
  },
  ]

  const [visibleCategories, setVisibleCategories] = useState({
    "Strategic Growth & Product Development": true,
    "Marketing, Brand & Customer Acquisition": true,
    Finance: true,
    Operations: true,
    "Systems & Technology": true,
    "People, Capability & Knowledge": true,
    "Governance, Impact & Ecosystem Building": true,
  })

  const [showMilestoneModal, setShowMilestoneModal] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState(null)
  const [filterBy, setFilterBy] = useState("all")
  const [newMilestone, setNewMilestone] = useState({
    growthStage: "",
    customGrowthStage: "",
    goal: "",
    milestoneCategory: "",
    customMilestoneCategory: "",
    milestoneDescription: "",
    targetDate: "",
    status: "",
    owner: "",
    percentageCompletion: 0,
  })

  if (activeSection !== "strategy-operationalisation") return null

  const toggleCategoryVisibility = (categoryKey) => {
    setVisibleCategories((prev) => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }))
  }

  const calculateGoalCompletion = (goalNumber, growthStage) => {
    const relevantMilestones = milestoneData.filter(
      (milestone) => milestone.goal === `Goal ${goalNumber}` && milestone.growthStage === growthStage,
    )

    if (relevantMilestones.length === 0) return 0

    const totalPercentage = relevantMilestones.reduce((sum, milestone) => {
      return sum + (milestone.percentageCompletion || 0)
    }, 0)

    return Math.round(totalPercentage / relevantMilestones.length)
  }

  const createChartData = (growthStage, color) => {
    const goals = ["Goal 1", "Goal 2", "Goal 3", "Goal 4"]
    const completionData = goals.map((_, index) => calculateGoalCompletion(index + 1, growthStage))

    const goalsWithData = []
    const dataWithValues = []

    goals.forEach((goal, index) => {
      const completion = completionData[index]
      const relevantMilestones = milestoneData.filter(
        (milestone) => milestone.goal === goal && milestone.growthStage === growthStage,
      )

      if (relevantMilestones.length > 0 || completion > 0) {
        goalsWithData.push(goal)
        dataWithValues.push(completion)
      }
    })

    if (goalsWithData.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: "% Completion",
            data: [],
            backgroundColor: color,
            borderColor: "#7d5a50",
            borderWidth: 1,
          },
        ],
      }
    }

    return {
      labels: goalsWithData,
      datasets: [
        {
          label: "% Completion",
          data: dataWithValues,
          backgroundColor: color,
          borderColor: "#7d5a50",
          borderWidth: 1,
        },
      ],
    }
  }

  const chartOptions = {
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
        callbacks: {
          afterLabel: (context) => {
            const goalNumber = context.dataIndex + 1
            const growthStage = context.chart.canvas.dataset.growthStage

            const relevantMilestones = milestoneData.filter(
              (milestone) => milestone.goal === `Goal ${goalNumber}` && milestone.growthStage === growthStage,
            )

            if (relevantMilestones.length > 0 && relevantMilestones[0].goalDescription) {
              return relevantMilestones[0].goalDescription
            }

            return "No description available"
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value) => `${value}%`,
        },
        title: {
          display: true,
          text: "Completion %",
          color: "#4a352f",
          font: {
            weight: "bold",
            size: 12,
          },
        },
        grid: {
          color: "#f0e6d9",
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#4a352f",
        },
      },
    },
  }

  const goalDomains = [
    "Strategic Growth & Product Development",
    "Marketing, Brand & Customer Acquisition",
    "Finance",
    "Operations",
    "Systems & Technology",
    "People, Capability & Knowledge",
    "Governance, Impact & Ecosystem Building",
    "Other (Specify)",
  ]

  const milestoneCategoriesByDomain = {
    "Strategic Growth & Product Development": [
      "Market Research",
      "Product Development",
      "Testing & Quality Assurance",
      "Launch Preparation",
      "Continuous Improvement & Scaling",
      "Other (Specify)",
    ],
    "Marketing, Brand & Customer Acquisition": [
      "Branding & Positioning",
      "Marketing Campaigns",
      "Sales & Conversion",
      "Partnerships & Affiliations",
      "Customer Retention & Engagement",
      "Other (Specify)",
    ],
    Finance: [
      "Financial Planning & Forecasting",
      "Fundraising & Capital Strategy",
      "Cost Management",
      "Revenue Optimization",
      "Compliance & Financial Governance",
      "Other (Specify)",
    ],
    Operations: [
      "Process Design & Optimization",
      "Resource & Procurement Management",
      "Team & Workforce Planning",
      "Quality Management",
      "Documentation & Reporting",
      "Other (Specify)",
    ],
    "Systems & Technology": [
      "System Integration",
      "Platform Infrastructure",
      "Security & Compliance",
      "Automation & AI Enablement",
      "Tech Cost Auditing & Optimization",
      "Other (Specify)",
    ],
    "People, Capability & Knowledge": [
      "Onboarding & Training",
      "Performance & Development",
      "Culture & Engagement",
      "User & Partner Training",
      "Other (Specify)",
    ],
    "Governance, Impact & Ecosystem Building": [
      "Governance Framework",
      "Impact Measurement",
      "Ecosystem & Catalyst Partnerships",
      "Policy & Risk Management",
      "Other (Specify)",
    ],
    "Other (Specify)": ["Other (Specify)"],
  }

  const goals = ["Goal 1", "Goal 2", "Goal 3", "Goal 4"]
  const statuses = ["Not Started", "In Progress", "On Track", "At Risk", "Done"]
  const owners = ["Product Team", "Business Dev", "Legal Team", "Engineering", "Marketing", "Operations"]

  const filteredMilestones = milestoneData.filter((milestone) => {
    if (filterBy === "all") return true
    if (goalDomains.includes(filterBy)) return milestone.growthStage === filterBy
    if (statuses.includes(filterBy)) return milestone.status === filterBy
    if (owners.includes(filterBy)) return milestone.owner === filterBy
    if (goals.includes(filterBy)) return milestone.goal === filterBy
    return true
  })

  const handleAddMilestone = () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    setEditingMilestone(null)
    setNewMilestone({
      growthStage: "",
      customGrowthStage: "",
      goal: "",
      milestoneCategory: "",
      customMilestoneCategory: "",
      milestoneDescription: "",
      targetDate: "",
      status: "",
      owner: "",
      percentageCompletion: 0,
    })
    setShowMilestoneModal(true)
  }

  const handleEditMilestone = (milestone) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    setEditingMilestone(milestone)
    setNewMilestone({
      ...milestone,
      customGrowthStage: milestone.customGrowthStage || "",
      customMilestoneCategory: milestone.customMilestoneCategory || "",
      percentageCompletion: milestone.percentageCompletion || 0,
    })
    setShowMilestoneModal(true)
  }

  const handleSaveMilestone = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    if (!currentUser) {
      alert("You must be logged in to save milestones.")
      return
    }

    try {
      const finalGrowthStage =
        newMilestone.growthStage === "Other (Specify)" ? newMilestone.customGrowthStage : newMilestone.growthStage

      const finalMilestoneCategory =
        newMilestone.milestoneCategory === "Other (Specify)"
          ? newMilestone.customMilestoneCategory
          : newMilestone.milestoneCategory

      const milestoneWithUser = {
        growthStage: finalGrowthStage,
        customGrowthStage: newMilestone.customGrowthStage,
        goal: newMilestone.goal,
        milestoneCategory: finalMilestoneCategory,
        customMilestoneCategory: newMilestone.customMilestoneCategory,
        milestoneDescription: newMilestone.milestoneDescription,
        targetDate: newMilestone.targetDate,
        status: newMilestone.status,
        owner: newMilestone.owner,
        percentageCompletion: newMilestone.percentageCompletion,
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
      }

      if (editingMilestone) {
        const milestoneRef = doc(db, "milestones", editingMilestone.id)
        await updateDoc(milestoneRef, milestoneWithUser)

        setMilestoneData((prev) =>
          prev.map((m) => (m.id === editingMilestone.id ? { ...milestoneWithUser, id: editingMilestone.id } : m)),
        )
      } else {
        const docRef = await addDoc(collection(db, "milestones"), milestoneWithUser)
        setMilestoneData((prev) => [...prev, { ...milestoneWithUser, id: docRef.id }])
      }

      setShowMilestoneModal(false)
      setNewMilestone({
        growthStage: "",
        customGrowthStage: "",
        goal: "",
        milestoneCategory: "",
        customMilestoneCategory: "",
        milestoneDescription: "",
        targetDate: "",
        status: "",
        owner: "",
        percentageCompletion: 0,
      })
    } catch (error) {
      console.error("Error saving milestone:", error)
      alert("Error saving milestone. Please try again.")
    }
  }

  const handleDeleteMilestone = async (milestoneId) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    if (window.confirm("Are you sure you want to delete this milestone?")) {
      try {
        await deleteDoc(doc(db, "milestones", milestoneId))
        setMilestoneData((prev) => prev.filter((m) => m.id !== milestoneId))
      } catch (error) {
        console.error("Error deleting milestone:", error)
        alert("Error deleting milestone. Please try again.")
      }
    }
  }

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
      {/* Notes Section */}
      <div
        style={{
          backgroundColor: "#f5f0eb",
          padding: "15px",
          borderRadius: "6px",
          marginBottom: "20px",
          border: "2px solid #7d5a50",
        }}
      >

        <div style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6" }}>
          <p style={{ marginBottom: "8px" }}>
            <strong>Key Question:</strong> {SECTION_DATA["strategy-operationalisation"].notes.keyQuestion}
          </p>
          <p style={{ marginBottom: "8px" }}>
            <strong>Key Signals:</strong> {SECTION_DATA["strategy-operationalisation"].notes.keySignals}
          </p>
          <p style={{ marginBottom: "0" }}>
            <strong>Key Decisions:</strong> {SECTION_DATA["strategy-operationalisation"].notes.keyDecisions}
          </p>
        </div>
      </div>

      <h3 style={{ color: "#4a352f", marginBottom: "10px" }}>Strategic Goals Progress</h3>

      <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#fdfcfb", borderRadius: "6px" }}>
        <p style={{ color: "#4a352f", marginBottom: "10px", fontWeight: "500" }}>Select charts to display:</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
          {categories.map((category) => (
            <div
              key={category.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                backgroundColor: visibleCategories[category.key] ? category.color : "#f5f0e1",
                borderRadius: "6px",
                border: "2px solid #e6d7c3",
                transition: "all 0.2s ease",
                position: "relative",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  flex: 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={visibleCategories[category.key]}
                  onChange={() => toggleCategoryVisibility(category.key)}
                  style={{ cursor: "pointer" }}
                />
                <span
                  style={{
                    color: visibleCategories[category.key] ? "#ffffff" : "#4a352f",
                    fontWeight: "500",
                    fontSize: "13px",
                  }}
                >
                  {category.name}
                </span>
              </label>
              {visibleCategories[category.key] && (
                <button
                  onClick={() => toggleCategoryVisibility(category.key)}
                  style={{
                    background: "rgba(255, 255, 255, 0.3)",
                    border: "1px solid rgba(255, 255, 255, 0.5)",
                    borderRadius: "4px",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "bold",
                    padding: "2px 6px",
                    marginLeft: "4px",
                  }}
                  title="Remove chart"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        {categories
          .filter((category) => visibleCategories[category.key])
          .map((category) => {
            const chartData = createChartData(category.key, category.color)
            if (chartData.labels.length === 0) return null

            return (
              <div
                key={category.key}
                style={{
                  backgroundColor: "#fdfcfb",
                  padding: "20px",
                  borderRadius: "8px",
                  border: `2px solid ${category.color}`,
                }}
              >
                <h4 style={{ color: "#4a352f", marginBottom: "15px", fontSize: "15px" }}>{category.name}</h4>
                <div style={{ height: "250px" }}>
                  <Bar data={chartData} options={chartOptions} data-growth-stage={category.key} />
                </div>
              </div>
            )
          })}
      </div>

      <div style={{ marginBottom: "20px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ color: "#4a352f", fontWeight: "500" }}>Filter by:</label>
        <select
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value)}
          style={{
            padding: "8px 12px",
            border: "2px solid #e8ddd4",
            borderRadius: "4px",
            backgroundColor: "white",
            color: "#4a352f",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          <option value="all">All Milestones</option>
          <optgroup label="Goal Domain">
            {goalDomains
              .filter((d) => d !== "Other (Specify)")
              .map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
          </optgroup>
          <optgroup label="Status">
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </optgroup>
          <optgroup label="Owner">
            {owners.map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </optgroup>
          <optgroup label="Goal">
            {goals.map((goal) => (
              <option key={goal} value={goal}>
                {goal}
              </option>
            ))}
          </optgroup>
        </select>

        {!isInvestorView && (
          <button
            onClick={handleAddMilestone}
            style={{
              padding: "8px 16px",
              backgroundColor: "#7d5a50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "500",
              fontSize: "14px",
              marginLeft: "auto",
            }}
          >
            Add Milestone
          </button>
        )}
      </div>

      {/* Milestone Table */}
      <div style={{ overflowX: "auto", backgroundColor: "#fdfcfb", borderRadius: "6px", padding: "20px" }}>
        {filteredMilestones.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#7d5a50" }}>
            {filterBy === "all"
              ? `No milestones added yet. ${!isInvestorView ? 'Click "Add Milestone" to get started.' : ""}`
              : `No milestones found for the selected filter.`}
          </div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              color: "#4a352f",
              minWidth: "1000px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#e6d7c3", borderBottom: "2px solid #c8b6a6" }}>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Goal Domain</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Goal</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Category</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Description</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Target Date</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Status</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Owner</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>% Complete</th>
                {!isInvestorView && <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredMilestones.map((milestone) => (
                <tr key={milestone.id} style={{ borderBottom: "1px solid #e6d7c3" }}>
                  <td style={{ padding: "12px" }}>{milestone.growthStage}</td>
                  <td style={{ padding: "12px" }}>{milestone.goal}</td>
                  <td style={{ padding: "12px" }}>{milestone.milestoneCategory}</td>
                  <td style={{ padding: "12px", maxWidth: "250px" }}>{milestone.milestoneDescription}</td>
                  <td style={{ padding: "12px" }}>{milestone.targetDate}</td>
                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "500",
                        backgroundColor:
                          milestone.status === "Done"
                            ? "#c8e6c9"
                            : milestone.status === "On Track"
                              ? "#fff9c4"
                              : milestone.status === "At Risk"
                                ? "#ffcdd2"
                                : "#f5f5f5",
                      }}
                    >
                      {milestone.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px" }}>{milestone.owner}</td>
                  <td style={{ padding: "12px" }}>{milestone.percentageCompletion}%</td>
                  {!isInvestorView && (
                    <td style={{ padding: "12px" }}>
                      <button
                        onClick={() => handleEditMilestone(milestone)}
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "#7d5a50",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "11px",
                          marginRight: "5px",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMilestone(milestone.id)}
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "#F44336",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "11px",
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Milestone Modal */}
      {showMilestoneModal && !isInvestorView && (
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
            overflow: "auto",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <h3 style={{ color: "#5d4037", marginTop: 0 }}>
              {editingMilestone ? "Edit Milestone" : "Add New Milestone"}
            </h3>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500" }}>
                Goal Domain
              </label>
              <select
                value={newMilestone.growthStage}
                onChange={(e) => {
                  setNewMilestone((prev) => ({
                    ...prev,
                    growthStage: e.target.value,
                    milestoneCategory: "",
                  }))
                }}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              >
                <option value="">Select Goal Domain</option>
                {goalDomains.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
            </div>

            {newMilestone.growthStage === "Other (Specify)" && (
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500" }}>
                  Custom Goal Domain
                </label>
                <input
                  type="text"
                  value={newMilestone.customGrowthStage}
                  onChange={(e) => setNewMilestone((prev) => ({ ...prev, customGrowthStage: e.target.value }))}
                  placeholder="Enter custom goal domain"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e8ddd4",
                    borderRadius: "4px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500" }}>Goal</label>
              <select
                value={newMilestone.goal}
                onChange={(e) => setNewMilestone((prev) => ({ ...prev, goal: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              >
                <option value="">Select Goal</option>
                {goals.map((goal) => (
                  <option key={goal} value={goal}>
                    {goal}
                  </option>
                ))}
              </select>
            </div>

            {newMilestone.growthStage && newMilestone.growthStage !== "Other (Specify)" && (
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500" }}>
                  Milestone Category
                </label>
                <select
                  value={newMilestone.milestoneCategory}
                  onChange={(e) => setNewMilestone((prev) => ({ ...prev, milestoneCategory: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e8ddd4",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                >
                  <option value="">Select Category</option>
                  {milestoneCategoriesByDomain[newMilestone.growthStage]?.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {newMilestone.milestoneCategory === "Other (Specify)" && (
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500" }}>
                  Custom Milestone Category
                </label>
                <input
                  type="text"
                  value={newMilestone.customMilestoneCategory}
                  onChange={(e) => setNewMilestone((prev) => ({ ...prev, customMilestoneCategory: e.target.value }))}
                  placeholder="Enter custom category"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e8ddd4",
                    borderRadius: "4px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500" }}>
                Milestone Description
              </label>
              <textarea
                value={newMilestone.milestoneDescription}
                onChange={(e) => setNewMilestone((prev) => ({ ...prev, milestoneDescription: e.target.value }))}
                placeholder="Describe the milestone"
                rows="3"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500" }}>
                Target Date
              </label>
              <input
                type="date"
                value={newMilestone.targetDate}
                onChange={(e) => setNewMilestone((prev) => ({ ...prev, targetDate: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500" }}>
                Status
              </label>
              <select
                value={newMilestone.status}
                onChange={(e) => setNewMilestone((prev) => ({ ...prev, status: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              >
                <option value="">Select Status</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500" }}>
                Owner
              </label>
              <select
                value={newMilestone.owner}
                onChange={(e) => setNewMilestone((prev) => ({ ...prev, owner: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              >
                <option value="">Select Owner</option>
                {owners.map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500" }}>
                Percentage Completion: {newMilestone.percentageCompletion}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={newMilestone.percentageCompletion}
                onChange={(e) =>
                  setNewMilestone((prev) => ({ ...prev, percentageCompletion: Number.parseInt(e.target.value) }))
                }
                style={{ width: "100%" }}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowMilestoneModal(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e6d7c3",
                  color: "#4a352f",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMilestone}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#7d5a50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                {editingMilestone ? "Update Milestone" : "Add Milestone"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const RiskManagement = ({ activeSection, currentUser, isInvestorView }) => {
  const [riskData, setRiskData] = useState({
    "financial-risk": [],
    "market-risk": [],
    "operational-risk": [],
    "reputational-risk": [],
    "compliance-risk": [],
    "technology-risk": [],
  })
  const [riskSection, setRiskSection] = useState("business-risk")
  const [hoveredRiskType, setHoveredRiskType] = useState(null)

  const riskCategories = [
    { id: "business-risk", name: "Business Risk (All)", color: "#7d5a50" },
    { id: "financial-risk", name: "Financial Risk", color: "#a67c52" },
    { id: "market-risk", name: "Market Risk", color: "#c8b6a6" },
    { id: "operational-risk", name: "Operational Risk", color: "#d4c4b0" },
    { id: "reputational-risk", name: "Reputational Risk", color: "#b8a491" },
    { id: "compliance-risk", name: "Compliance Risk", color: "#9d8573" },
    { id: "technology-risk", name: "Technology Risk", color: "#8b7355" },
  ]

  useEffect(() => {
    const loadRiskData = async () => {
      if (!currentUser || activeSection !== "strategic-risk-control") return

      try {
        const riskSnapshot = await getDocs(query(collection(db, "risks"), where("userId", "==", currentUser.uid)))

        const loadedRisks = {
          "financial-risk": [],
          "market-risk": [],
          "operational-risk": [],
          "reputational-risk": [],
          "compliance-risk": [],
          "technology-risk": [],
        }

        riskSnapshot.docs.forEach((doc) => {
          const data = doc.data()
          const category = data.category || "financial-risk"
          if (loadedRisks[category]) {
            loadedRisks[category].push({ id: doc.id, ...data })
          }
        })

        setRiskData(loadedRisks)
      } catch (error) {
        console.error("Error loading risk data:", error)
      }
    }

    loadRiskData()
  }, [activeSection, currentUser])

  if (activeSection !== "strategic-risk-control") return null

  const addRiskItem = async (category) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    if (!currentUser) {
      alert("You must be logged in to add risks.")
      return
    }

    const newRisk = {
      risk: "",
      riskCategory: riskCategories.find((c) => c.id === category)?.name || "Financial Risk",
      description: "",
      severity: 1,
      likelihood: 1,
      mitigation: "",
      mitigationStatus: "🔴 Uncontrolled",
      owner: "",
      reviewCadence: "",
      userId: currentUser.uid,
      category: category,
      createdAt: new Date().toISOString(),
    }

    try {
      const docRef = await addDoc(collection(db, "risks"), newRisk)
      setRiskData((prev) => ({
        ...prev,
        [category]: [...prev[category], { id: docRef.id, ...newRisk }],
      }))
    } catch (error) {
      console.error("Error adding risk:", error)
      alert("Error adding risk. Please try again.")
    }
  }

  const updateRiskItem = async (category, id, field, value) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    setRiskData((prev) => ({
      ...prev,
      [category]: prev[category].map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }))

    try {
      const riskRef = doc(db, "risks", id)
      await updateDoc(riskRef, { [field]: value })
    } catch (error) {
      console.error("Error updating risk:", error)
    }
  }

  const deleteRiskItem = async (category, id) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    if (window.confirm("Are you sure you want to delete this risk item?")) {
      try {
        await deleteDoc(doc(db, "risks", id))
        setRiskData((prev) => ({
          ...prev,
          [category]: prev[category].filter((item) => item.id !== id),
        }))
      } catch (error) {
        console.error("Error deleting risk:", error)
        alert("Error deleting risk. Please try again.")
      }
    }
  }

  const createScatterChartData = (category, color) => {
    const data = category === "business-risk" ? Object.values(riskData).flat() : riskData[category] || []

    return {
      datasets: [
        {
          label: "Risks",
          data: data.map((item) => ({
            x: item.likelihood,
            y: item.severity,
            label: item.risk || "Unnamed Risk",
          })),
          backgroundColor: color,
          borderColor: "#5d4037",
          borderWidth: 2,
          pointRadius: 8,
          pointHoverRadius: 10,
        },
      ],
    }
  }

  const scatterOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return context.raw.label || "Risk"
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Likelihood (1-5)",
          color: "#4a352f",
          font: {
            weight: "bold",
            size: 12,
          },
        },
        min: 0,
        max: 6,
        ticks: {
          stepSize: 1,
          color: "#4a352f",
        },
        grid: {
          color: "#f0e6d9",
        },
      },
      y: {
        title: {
          display: true,
          text: "Severity (1-5)",
          color: "#4a352f",
          font: {
            weight: "bold",
            size: 12,
          },
        },
        min: 0,
        max: 6,
        ticks: {
          stepSize: 1,
          color: "#4a352f",
        },
        grid: {
          color: "#f0e6d9",
        },
      },
    },
  }

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
      {/* Notes Section */}
      <div
        style={{
          backgroundColor: "#f5f0eb",
          padding: "15px",
          borderRadius: "6px",
          marginBottom: "20px",
          border: "2px solid #7d5a50",
        }}
      >
        
        <div style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6" }}>
          <p style={{ marginBottom: "8px" }}>
            <strong>Key Question:</strong> {SECTION_DATA["strategic-risk-control"].notes.keyQuestion}
          </p>
          <p style={{ marginBottom: "8px" }}>
            <strong>Key Signals:</strong> {SECTION_DATA["strategic-risk-control"].notes.keySignals}
          </p>
          <p style={{ marginBottom: "0" }}>
            <strong>Key Decisions:</strong> {SECTION_DATA["strategic-risk-control"].notes.keyDecisions}
          </p>
        </div>
      </div>

      <h3 style={{ color: "#4a352f", marginBottom: "20px" }}>Risk Register</h3>

      {/* Risk Category Tabs with hover tooltips */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        {riskCategories.map((category) => (
          <div key={category.id} style={{ position: "relative" }}>
            <button
              onClick={() => setRiskSection(category.id)}
              onMouseEnter={() => {
                if (category.id !== "business-risk") {
                  const typeName = category.name.replace(" Risk", " Risk")
                  setHoveredRiskType(typeName)
                }
              }}
              onMouseLeave={() => setHoveredRiskType(null)}
              style={{
                padding: "10px 20px",
                backgroundColor: riskSection === category.id ? category.color : "#f5f0e1",
                color: riskSection === category.id ? "white" : "#4a352f",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              {category.name}
            </button>
            {hoveredRiskType === category.name && RISK_TYPE_DEFINITIONS[category.name] && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  marginTop: "8px",
                  padding: "10px 15px",
                  backgroundColor: "#4a352f",
                  color: "white",
                  borderRadius: "6px",
                  fontSize: "12px",
                  width: "250px",
                  zIndex: 1000,
                  boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
                  lineHeight: "1.4",
                }}
              >
                {RISK_TYPE_DEFINITIONS[category.name]}
                <div
                  style={{
                    position: "absolute",
                    top: "-6px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "0",
                    height: "0",
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderBottom: "6px solid #4a352f",
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Risk Category Content */}
      {riskCategories.map((category) => {
        if (riskSection !== category.id) return null

        const data = category.id === "business-risk" ? Object.values(riskData).flat() : riskData[category.id] || []

        return (
          <div key={category.id}>
            {/* Scatter Chart */}
            <div
              style={{
                backgroundColor: "#fdfcfb",
                padding: "20px",
                borderRadius: "6px",
                marginBottom: "20px",
                border: `2px solid ${category.color}`,
              }}
            >
              <h4 style={{ color: "#4a352f", marginBottom: "15px" }}>
                {category.name} Matrix
                {category.id === "business-risk" && " (All Risks)"}
              </h4>
              <div style={{ height: "300px" }}>
                <Scatter data={createScatterChartData(category.id, category.color)} options={scatterOptions} />
              </div>
            </div>

            {/* Risk Assessment Table */}
            <div
              style={{
                backgroundColor: "#fdfcfb",
                padding: "20px",
                borderRadius: "6px",
                border: `2px solid ${category.color}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                }}
              >
                <h4 style={{ color: "#4a352f", margin: 0 }}>
                  Risk Assessment Table
                  {category.id === "business-risk" && " (All Risks)"}
                </h4>
                {!isInvestorView && category.id !== "business-risk" && (
                  <button
                    onClick={() => addRiskItem(category.id)}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#7d5a50",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "500",
                      fontSize: "12px",
                    }}
                  >
                    Add Risk Item
                  </button>
                )}
              </div>

              {data.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#7d5a50" }}>
                  {category.id === "business-risk"
                    ? "No risk items added yet in any category."
                    : `No risk items added yet. ${!isInvestorView ? 'Click "Add Risk Item" to get started.' : ""}`}
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      color: "#4a352f",
                      minWidth: "1200px",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          backgroundColor: "#e6d7c3",
                          borderBottom: "2px solid #c8b6a6",
                        }}
                      >
                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", width: "80px" }}>Risk</th>
                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", width: "120px" }}>
                          Risk Category
                        </th>
                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", width: "180px" }}>
                          Description
                        </th>
                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", width: "80px" }}>
                          Severity (1-5)
                        </th>
                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", width: "80px" }}>
                          Likelihood (1-5)
                        </th>
                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", width: "100px" }}>Owner</th>
                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", width: "180px" }}>
                          Mitigation
                        </th>
                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", width: "140px" }}>
                          Mitigation Status
                        </th>
                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", width: "120px" }}>
                          Review Cadence
                        </th>
                        {!isInvestorView && category.id !== "business-risk" && (
                          <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", width: "80px" }}>
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((item) => {
                        const originalCategory =
                          category.id === "business-risk"
                            ? Object.keys(riskData).find((key) => riskData[key].some((r) => r.id === item.id))
                            : category.id

                        return (
                          <tr
                            key={item.id}
                            style={{
                              borderBottom: "1px solid #e6d7c3",
                            }}
                          >
                            <td style={{ padding: "12px" }}>
                              <input
                                type="text"
                                value={item.risk}
                                onChange={(e) => updateRiskItem(originalCategory, item.id, "risk", e.target.value)}
                                disabled={isInvestorView || category.id === "business-risk"}
                                style={{
                                  width: "100%",
                                  padding: "6px",
                                  border: "1px solid #e8ddd4",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  backgroundColor:
                                    isInvestorView || category.id === "business-risk" ? "#f5f5f5" : "white",
                                  cursor: isInvestorView || category.id === "business-risk" ? "not-allowed" : "text",
                                }}
                              />
                            </td>
                            <td style={{ padding: "12px" }}>{item.riskCategory}</td>
                            <td style={{ padding: "12px" }}>
                              <textarea
                                value={item.description}
                                onChange={(e) =>
                                  updateRiskItem(originalCategory, item.id, "description", e.target.value)
                                }
                                disabled={isInvestorView || category.id === "business-risk"}
                                rows="2"
                                style={{
                                  width: "100%",
                                  padding: "6px",
                                  border: "1px solid #e8ddd4",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  resize: "vertical",
                                  backgroundColor:
                                    isInvestorView || category.id === "business-risk" ? "#f5f5f5" : "white",
                                  cursor: isInvestorView || category.id === "business-risk" ? "not-allowed" : "text",
                                }}
                              />
                            </td>
                            <td style={{ padding: "12px" }}>
                              <input
                                type="number"
                                min="1"
                                max="5"
                                value={item.severity}
                                onChange={(e) =>
                                  updateRiskItem(originalCategory, item.id, "severity", Number.parseInt(e.target.value))
                                }
                                disabled={isInvestorView || category.id === "business-risk"}
                                style={{
                                  width: "60px",
                                  padding: "6px",
                                  border: "1px solid #e8ddd4",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  backgroundColor:
                                    isInvestorView || category.id === "business-risk" ? "#f5f5f5" : "white",
                                  cursor: isInvestorView || category.id === "business-risk" ? "not-allowed" : "text",
                                }}
                              />
                            </td>
                            <td style={{ padding: "12px" }}>
                              <input
                                type="number"
                                min="1"
                                max="5"
                                value={item.likelihood}
                                onChange={(e) =>
                                  updateRiskItem(
                                    originalCategory,
                                    item.id,
                                    "likelihood",
                                    Number.parseInt(e.target.value),
                                  )
                                }
                                disabled={isInvestorView || category.id === "business-risk"}
                                style={{
                                  width: "60px",
                                  padding: "6px",
                                  border: "1px solid #e8ddd4",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  backgroundColor:
                                    isInvestorView || category.id === "business-risk" ? "#f5f5f5" : "white",
                                  cursor: isInvestorView || category.id === "business-risk" ? "not-allowed" : "text",
                                }}
                              />
                            </td>
                            <td style={{ padding: "12px" }}>
                              <input
                                type="text"
                                value={item.owner || ""}
                                onChange={(e) => updateRiskItem(originalCategory, item.id, "owner", e.target.value)}
                                disabled={isInvestorView || category.id === "business-risk"}
                                placeholder="Owner name"
                                style={{
                                  width: "100%",
                                  padding: "6px",
                                  border: "1px solid #e8ddd4",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  backgroundColor:
                                    isInvestorView || category.id === "business-risk" ? "#f5f5f5" : "white",
                                  cursor: isInvestorView || category.id === "business-risk" ? "not-allowed" : "text",
                                }}
                              />
                            </td>
                            <td style={{ padding: "12px" }}>
                              <textarea
                                value={item.mitigation}
                                onChange={(e) =>
                                  updateRiskItem(originalCategory, item.id, "mitigation", e.target.value)
                                }
                                disabled={isInvestorView || category.id === "business-risk"}
                                rows="2"
                                style={{
                                  width: "100%",
                                  padding: "6px",
                                  border: "1px solid #e8ddd4",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  resize: "vertical",
                                  backgroundColor:
                                    isInvestorView || category.id === "business-risk" ? "#f5f5f5" : "white",
                                  cursor: isInvestorView || category.id === "business-risk" ? "not-allowed" : "text",
                                }}
                              />
                            </td>
                            <td style={{ padding: "12px" }}>
                              <select
                                value={item.mitigationStatus}
                                onChange={(e) =>
                                  updateRiskItem(originalCategory, item.id, "mitigationStatus", e.target.value)
                                }
                                disabled={isInvestorView || category.id === "business-risk"}
                                style={{
                                  width: "100%",
                                  padding: "6px",
                                  border: "1px solid #e8ddd4",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  backgroundColor:
                                    isInvestorView || category.id === "business-risk" ? "#f5f5f5" : "white",
                                  cursor: isInvestorView || category.id === "business-risk" ? "not-allowed" : "pointer",
                                }}
                              >
                                <option value="🟢 Controlled">🟢 Controlled</option>
                                <option value="🟡 Partially controlled">🟡 Partially controlled</option>
                                <option value="🔴 Uncontrolled">🔴 Uncontrolled</option>
                              </select>
                            </td>
                            <td style={{ padding: "12px" }}>
                              <input
                                type="text"
                                value={item.reviewCadence || ""}
                                onChange={(e) =>
                                  updateRiskItem(originalCategory, item.id, "reviewCadence", e.target.value)
                                }
                                disabled={isInvestorView || category.id === "business-risk"}
                                placeholder="e.g., Monthly"
                                style={{
                                  width: "100%",
                                  padding: "6px",
                                  border: "1px solid #e8ddd4",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  backgroundColor:
                                    isInvestorView || category.id === "business-risk" ? "#f5f5f5" : "white",
                                  cursor: isInvestorView || category.id === "business-risk" ? "not-allowed" : "text",
                                }}
                              />
                            </td>
                            {!isInvestorView && category.id !== "business-risk" && (
                              <td style={{ padding: "12px" }}>
                                <button
                                  onClick={() => deleteRiskItem(originalCategory, item.id)}
                                  style={{
                                    padding: "4px 8px",
                                    backgroundColor: "#F44336",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "10px",
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
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const ChangeAdaptability = ({ activeSection, currentUser, isInvestorView }) => {
  const [reviewData, setReviewData] = useState([])
  const [adjustments, setAdjustments] = useState([])
  const [pivots, setPivots] = useState([])
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [showPivotModal, setShowPivotModal] = useState(false)
  const [newReview, setNewReview] = useState({ date: "", topic: "", status: "Not Done", notes: "" })
  const [newAdjustment, setNewAdjustment] = useState({ date: "", description: "", reason: "" })
  const [newPivot, setNewPivot] = useState({ date: "", from: "", to: "", reason: "" })

  useEffect(() => {
    const loadChangeData = async () => {
      if (!currentUser || activeSection !== "change-adaptability") return

      try {
        const reviewsSnapshot = await getDocs(
          query(collection(db, "strategyReviews"), where("userId", "==", currentUser.uid)),
        )
        setReviewData(reviewsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))

        const adjustmentsSnapshot = await getDocs(
          query(collection(db, "adjustments"), where("userId", "==", currentUser.uid)),
        )
        setAdjustments(adjustmentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))

        const pivotsSnapshot = await getDocs(query(collection(db, "pivots"), where("userId", "==", currentUser.uid)))
        setPivots(pivotsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      } catch (error) {
        console.error("Error loading change data:", error)
      }
    }

    loadChangeData()
  }, [activeSection, currentUser])

  if (activeSection !== "change-adaptability") return null

  const handleAddReview = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    if (!currentUser) {
      alert("You must be logged in to add reviews.")
      return
    }

    try {
      const reviewWithUser = {
        ...newReview,
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
      }
      const docRef = await addDoc(collection(db, "strategyReviews"), reviewWithUser)
      setReviewData((prev) => [...prev, { id: docRef.id, ...reviewWithUser }])
      setShowReviewModal(false)
      setNewReview({ date: "", topic: "", status: "Not Done", notes: "" })
    } catch (error) {
      console.error("Error adding review:", error)
      alert("Error adding review. Please try again.")
    }
  }

  const handleDeleteReview = async (id) => {
    if (isInvestorView) return
    if (window.confirm("Are you sure you want to delete this review?")) {
      try {
        await deleteDoc(doc(db, "strategyReviews", id))
        setReviewData((prev) => prev.filter((r) => r.id !== id))
      } catch (error) {
        console.error("Error deleting review:", error)
      }
    }
  }

  const handleAddAdjustment = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    if (!currentUser) {
      alert("You must be logged in to add adjustments.")
      return
    }

    try {
      const adjustmentWithUser = {
        ...newAdjustment,
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
      }
      const docRef = await addDoc(collection(db, "adjustments"), adjustmentWithUser)
      setAdjustments((prev) => [...prev, { id: docRef.id, ...adjustmentWithUser }])
      setShowAdjustmentModal(false)
      setNewAdjustment({ date: "", description: "", reason: "" })
    } catch (error) {
      console.error("Error adding adjustment:", error)
      alert("Error adding adjustment. Please try again.")
    }
  }

  const handleDeleteAdjustment = async (id) => {
    if (isInvestorView) return
    if (window.confirm("Are you sure you want to delete this adjustment?")) {
      try {
        await deleteDoc(doc(db, "adjustments", id))
        setAdjustments((prev) => prev.filter((a) => a.id !== id))
      } catch (error) {
        console.error("Error deleting adjustment:", error)
      }
    }
  }

  const handleAddPivot = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    if (!currentUser) {
      alert("You must be logged in to add pivots.")
      return
    }

    try {
      const pivotWithUser = {
        ...newPivot,
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
      }
      const docRef = await addDoc(collection(db, "pivots"), pivotWithUser)
      setPivots((prev) => [...prev, { id: docRef.id, ...pivotWithUser }])
      setShowPivotModal(false)
      setNewPivot({ date: "", from: "", to: "", reason: "" })
    } catch (error) {
      console.error("Error adding pivot:", error)
      alert("Error adding pivot. Please try again.")
    }
  }

  const handleDeletePivot = async (id) => {
    if (isInvestorView) return
    if (window.confirm("Are you sure you want to delete this pivot?")) {
      try {
        await deleteDoc(doc(db, "pivots", id))
        setPivots((prev) => prev.filter((p) => p.id !== id))
      } catch (error) {
        console.error("Error deleting pivot:", error)
      }
    }
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
      {/* Notes Section */}
      <div
        style={{
          backgroundColor: "#f5f0eb",
          padding: "15px",
          borderRadius: "6px",
          marginBottom: "20px",
          border: "2px solid #7d5a50",
        }}
      >

        <div style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6" }}>
          <p style={{ marginBottom: "8px" }}>
            <strong>Key Question:</strong> {SECTION_DATA["change-adaptability"].notes.keyQuestion}
          </p>
          <p style={{ marginBottom: "8px" }}>
            <strong>Key Signals:</strong> {SECTION_DATA["change-adaptability"].notes.keySignals}
          </p>
          <p style={{ marginBottom: "0" }}>
            <strong>Key Decisions:</strong> {SECTION_DATA["change-adaptability"].notes.keyDecisions}
          </p>
        </div>
      </div>

      {/* Strategy Review Calendar */}
      <div
        style={{
          backgroundColor: "#f7f3f0",
          padding: "20px",
          borderRadius: "6px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >
          <h3 style={{ color: "#5d4037", margin: 0 }}>Strategy Review Calendar</h3>
          {!isInvestorView && (
            <button
              onClick={() => setShowReviewModal(true)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#7d5a50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "12px",
              }}
            >
              Add Review
            </button>
          )}
        </div>

        {reviewData.length === 0 ? (
          <p style={{ color: "#7d5a50", textAlign: "center", padding: "20px" }}>No strategy reviews scheduled yet.</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              color: "#4a352f",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#e6d7c3", borderBottom: "2px solid #c8b6a6" }}>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Date</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Topic</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Status</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Notes</th>
                {!isInvestorView && <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {reviewData.map((review) => (
                <tr key={review.id} style={{ borderBottom: "1px solid #e6d7c3" }}>
                  <td style={{ padding: "12px" }}>{review.date}</td>
                  <td style={{ padding: "12px" }}>{review.topic}</td>
                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "500",
                        backgroundColor: review.status === "Done" ? "#c8e6c9" : "#ffcdd2",
                      }}
                    >
                      {review.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px", maxWidth: "300px" }}>{review.notes}</td>
                  {!isInvestorView && (
                    <td style={{ padding: "12px" }}>
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "#F44336",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "11px",
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Adjustments Documented */}
      <div
        style={{
          backgroundColor: "#f7f3f0",
          padding: "20px",
          borderRadius: "6px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >
          <h3 style={{ color: "#5d4037", margin: 0 }}>Adjustments Documented</h3>
          {!isInvestorView && (
            <button
              onClick={() => setShowAdjustmentModal(true)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#7d5a50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "12px",
              }}
            >
              Add Adjustment
            </button>
          )}
        </div>

        {adjustments.length === 0 ? (
          <p style={{ color: "#7d5a50", textAlign: "center", padding: "20px" }}>No adjustments documented yet.</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              color: "#4a352f",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#e6d7c3", borderBottom: "2px solid #c8b6a6" }}>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Date</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Description</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Reason</th>
                {!isInvestorView && <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {adjustments.map((adjustment) => (
                <tr key={adjustment.id} style={{ borderBottom: "1px solid #e6d7c3" }}>
                  <td style={{ padding: "12px" }}>{adjustment.date}</td>
                  <td style={{ padding: "12px", maxWidth: "300px" }}>{adjustment.description}</td>
                  <td style={{ padding: "12px", maxWidth: "300px" }}>{adjustment.reason}</td>
                  {!isInvestorView && (
                    <td style={{ padding: "12px" }}>
                      <button
                        onClick={() => handleDeleteAdjustment(adjustment.id)}
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "#F44336",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "11px",
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pivot History Documented */}
      <div
        style={{
          backgroundColor: "#f7f3f0",
          padding: "20px",
          borderRadius: "6px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >
          <h3 style={{ color: "#5d4037", margin: 0 }}>Pivot History Documented</h3>
          {!isInvestorView && (
            <button
              onClick={() => setShowPivotModal(true)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#7d5a50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "12px",
              }}
            >
              Add Pivot
            </button>
          )}
        </div>

        {pivots.length === 0 ? (
          <p style={{ color: "#7d5a50", textAlign: "center", padding: "20px" }}>No pivots documented yet.</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              color: "#4a352f",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#e6d7c3", borderBottom: "2px solid #c8b6a6" }}>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Date</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>From</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>To</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Reason</th>
                {!isInvestorView && <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {pivots.map((pivot) => (
                <tr key={pivot.id} style={{ borderBottom: "1px solid #e6d7c3" }}>
                  <td style={{ padding: "12px" }}>{pivot.date}</td>
                  <td style={{ padding: "12px", maxWidth: "200px" }}>{pivot.from}</td>
                  <td style={{ padding: "12px", maxWidth: "200px" }}>{pivot.to}</td>
                  <td style={{ padding: "12px", maxWidth: "300px" }}>{pivot.reason}</td>
                  {!isInvestorView && (
                    <td style={{ padding: "12px" }}>
                      <button
                        onClick={() => handleDeletePivot(pivot.id)}
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "#F44336",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "11px",
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {showReviewModal && !isInvestorView && (
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
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "500px",
            }}
          >
            <h3 style={{ color: "#5d4037", marginTop: 0 }}>Add Strategy Review</h3>
            <input
              type="date"
              value={newReview.date}
              onChange={(e) => setNewReview((prev) => ({ ...prev, date: e.target.value }))}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "15px",
              }}
            />
            <input
              type="text"
              placeholder="Topic"
              value={newReview.topic}
              onChange={(e) => setNewReview((prev) => ({ ...prev, topic: e.target.value }))}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "15px",
              }}
            />
            <select
              value={newReview.status}
              onChange={(e) => setNewReview((prev) => ({ ...prev, status: e.target.value }))}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                marginBottom: "15px",
              }}
            >
              <option value="Done">Done</option>
              <option value="Not Done">Not Done</option>
            </select>
            <textarea
              placeholder="Notes"
              value={newReview.notes}
              onChange={(e) => setNewReview((prev) => ({ ...prev, notes: e.target.value }))}
              rows="3"
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "20px",
                fontFamily: "inherit",
              }}
            />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowReviewModal(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e6d7c3",
                  color: "#4a352f",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddReview}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#7d5a50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Add Review
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdjustmentModal && !isInvestorView && (
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
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "500px",
            }}
          >
            <h3 style={{ color: "#5d4037", marginTop: 0 }}>Add Adjustment</h3>
            <input
              type="date"
              value={newAdjustment.date}
              onChange={(e) => setNewAdjustment((prev) => ({ ...prev, date: e.target.value }))}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "15px",
              }}
            />
            <textarea
              placeholder="Description"
              value={newAdjustment.description}
              onChange={(e) => setNewAdjustment((prev) => ({ ...prev, description: e.target.value }))}
              rows="3"
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "15px",
                fontFamily: "inherit",
              }}
            />
            <textarea
              placeholder="Reason"
              value={newAdjustment.reason}
              onChange={(e) => setNewAdjustment((prev) => ({ ...prev, reason: e.target.value }))}
              rows="3"
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "20px",
                fontFamily: "inherit",
              }}
            />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowAdjustmentModal(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e6d7c3",
                  color: "#4a352f",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddAdjustment}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#7d5a50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Add Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {showPivotModal && !isInvestorView && (
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
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "500px",
            }}
          >
            <h3 style={{ color: "#5d4037", marginTop: 0 }}>Add Pivot</h3>
            <input
              type="date"
              value={newPivot.date}
              onChange={(e) => setNewPivot((prev) => ({ ...prev, date: e.target.value }))}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "15px",
              }}
            />
            <textarea
              placeholder="From (previous direction)"
              value={newPivot.from}
              onChange={(e) => setNewPivot((prev) => ({ ...prev, from: e.target.value }))}
              rows="2"
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "15px",
                fontFamily: "inherit",
              }}
            />
            <textarea
              placeholder="To (new direction)"
              value={newPivot.to}
              onChange={(e) => setNewPivot((prev) => ({ ...prev, to: e.target.value }))}
              rows="2"
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "15px",
                fontFamily: "inherit",
              }}
            />
            <textarea
              placeholder="Reason"
              value={newPivot.reason}
              onChange={(e) => setNewPivot((prev) => ({ ...prev, reason: e.target.value }))}
              rows="3"
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "20px",
                fontFamily: "inherit",
              }}
            />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowPivotModal(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e6d7c3",
                  color: "#4a352f",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddPivot}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#7d5a50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Add Pivot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const Strategy = () => {
  const [activeSection, setActiveSection] = useState("strategic-clarity")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [milestoneData, setMilestoneData] = useState([])
  const [currentUser, setCurrentUser] = useState(null)

  const [isInvestorView, setIsInvestorView] = useState(false)
  const [viewingSMEId, setViewingSMEId] = useState(null)
  const [viewingSMEName, setViewingSMEName] = useState("")
  const [selectedCohort, setSelectedCohort] = useState(null) // Added for potential future use or context

  const [showFullDescription, setShowFullDescription] = useState(false)

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (isInvestorView && viewingSMEId) {
        setCurrentUser({ uid: viewingSMEId })
      } else {
        setCurrentUser(user)
      }
    })

    return () => unsubscribe()
  }, [isInvestorView, viewingSMEId])

  useEffect(() => {
    const loadUserMilestoneData = async () => {
      if (!currentUser) {
        setMilestoneData([])
        return
      }

      try {
        const milestonesSnapshot = await getDocs(
          query(collection(db, "milestones"), where("userId", "==", currentUser.uid)),
        )
        setMilestoneData(milestonesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      } catch (error) {
        console.error("Error loading user milestone data:", error)
      }
    }

    loadUserMilestoneData()
  }, [currentUser])

  const getContentStyles = () => ({
    flex: 1,
    paddingLeft: isSidebarCollapsed ? "80px" : "250px",
    transition: "padding 0.3s ease",
    boxSizing: "border-box",
  })

  // const handleExitInvestorView = () => {
  //   sessionStorage.removeItem("viewingSMEId")
  //   sessionStorage.removeItem("viewingSMEName")
  //   sessionStorage.removeItem("investorViewMode")
  //   window.location.href = "/my-cohorts"
  // }

  // Updated handleExitInvestorView to align with the change in updates
  const handleExitInvestorView = () => {
    sessionStorage.removeItem("viewingSMEId")
    sessionStorage.removeItem("viewingSMEName")
    sessionStorage.removeItem("investorViewMode")
    // Navigate to the 'my-cohorts' page or a relevant dashboard after exiting investor view
    window.location.href = "/my-cohorts" // Or '/dashboard' or wherever appropriate
  }

  const sectionButtons = [
    { id: "strategic-clarity", label: "Strategic Clarity" },
    { id: "operating-model", label: "Operating Model" },
    { id: "strategy-operationalisation", label: "Strategy Operationalisation" },
    { id: "strategic-risk-control", label: "Strategic Risk Control" },
    { id: "change-adaptability", label: "Change and adaptability" },
  ]

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      <div style={getContentStyles()}>
        <Header />

        {isInvestorView && (
          <div style={{ padding: "20px", borderBottom: "1px solid #e0d5c7" }}>
            <button
              onClick={() => {
                setIsInvestorView(false)
                setSelectedCohort(null) // Assuming setSelectedCohort is related to managing cohorts
              }}
              style={{
                padding: "10px 20px",
                backgroundColor: "#7d5a50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Back to My Cohorts
            </button>
          </div>
        )}

        <div style={{ padding: "60px 20px 20px 20px" }}>
          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "25px",
              margin: isInvestorView ? "20px 0" : "50px 0 20px 0",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              border: "2px solid #7d5a50",
            }}
          >
            <h1 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px", fontSize: "32px" }}>
              Strategy & Execution
            </h1>
            <p style={{ color: "#4a352f", fontSize: "15px", lineHeight: "1.6", marginBottom: "20px" }}>
              <strong>
                Strategy & Execution health reflects how deliberately the business is steered, not whether the strategy
                itself is 'right'. It tests intentionality, coherence, and control — not success.
              </strong>
            </p>

            {showFullDescription && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
                <div>
                  <h3 style={{ color: "#7d5a50", marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>
                    What this dashboard DOES
                  </h3>
                  <ul style={{ color: "#4a352f", fontSize: "14px", lineHeight: "1.7", margin: 0, paddingLeft: "20px" }}>
                    <li>Assesses whether the business is deliberately steered, not reactive</li>
                    <li>Evaluates whether strategy is translated into structure, priorities, and action</li>
                    <li>Surfaces strategic execution risk, not operational performance</li>
                    <li>Tests whether the operating model fits the business's current reality</li>
                  </ul>
                </div>

                <div>
                  <h3 style={{ color: "#7d5a50", marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>
                    What this dashboard does NOT do
                  </h3>
                  <ul style={{ color: "#4a352f", fontSize: "14px", lineHeight: "1.7", margin: 0, paddingLeft: "20px" }}>
                    <li>Evaluate strategy quality or competitiveness</li>
                    <li>Track operational KPIs (Ops dashboard does that)</li>
                    <li>Measure performance outcomes (Finance & Ops do that)</li>
                    <li>Manage projects or OKRs</li>
                    <li>Replace business planning or consulting work</li>
                  </ul>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              style={{
                marginTop: "15px",
                padding: "8px 16px",
                backgroundColor: "transparent",
                color: "#7d5a50",
                border: "1px solid #7d5a50",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              {showFullDescription ? "Show less" : "Read more"}
            </button>
          </div>

          {/* Tab buttons */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "20px",
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
                  padding: "12px 18px",
                  backgroundColor: activeSection === button.id ? "#7d5a50" : "#ffffff",
                  color: activeSection === button.id ? "#fdfcfb" : "#5d4037",
                  border: "2px solid #7d5a50",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                  transition: "all 0.3s ease",
                  minWidth: "140px",
                  textAlign: "center",
                  flexShrink: 0,
                }}
              >
                {button.label}
              </button>
            ))}
          </div>

          <StrategicClarity activeSection={activeSection} currentUser={currentUser} isInvestorView={isInvestorView} />
          <BusinessModelCanvas
            activeSection={activeSection}
            currentUser={currentUser}
            isInvestorView={isInvestorView}
          />
          <StrategicGoals
            activeSection={activeSection}
            milestoneData={milestoneData}
            setMilestoneData={setMilestoneData}
            currentUser={currentUser}
            isInvestorView={isInvestorView}
          />
          <RiskManagement activeSection={activeSection} currentUser={currentUser} isInvestorView={isInvestorView} />
          <ChangeAdaptability activeSection={activeSection} currentUser={currentUser} isInvestorView={isInvestorView} />
        </div>
      </div>
    </div>
  )
}

export default Strategy
