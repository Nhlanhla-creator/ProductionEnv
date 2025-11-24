"use client"

import { useState, useEffect } from "react"
import { Bar, Scatter } from "react-chartjs-2"
import Sidebar from "smses/Sidebar/Sidebar"
import Header from "../DashboardHeader/DashboardHeader"
import { db, auth } from "../../firebaseConfig"
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, onSnapshot } from "firebase/firestore"
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

// Vision, Mission, Values Component
const VisionMissionValues = ({ activeSection, currentUser, isInvestorView }) => {
  const [visionMissionData, setVisionMissionData] = useState({
    vision: "",
    mission: "",
    values: [],
  })
  const [showModal, setShowModal] = useState(false)
  const [newValue, setNewValue] = useState("")

  useEffect(() => {
    const loadVisionMissionData = async () => {
      if (!currentUser || activeSection !== "vision-mission-values") return

      try {
        const visionMissionSnapshot = await getDocs(
          query(collection(db, "visionMission"), where("userId", "==", currentUser.uid)),
        )

        if (!visionMissionSnapshot.empty) {
          const data = visionMissionSnapshot.docs[0].data()
          setVisionMissionData(data)
        }
      } catch (error) {
        console.error("Error loading vision/mission data:", error)
      }
    }

    loadVisionMissionData()
  }, [activeSection, currentUser])

  if (activeSection !== "vision-mission-values") return null

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

      alert("Vision, Mission, and Values saved successfully!")
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
          <p style={{ color: "#856404", margin: 0 }}>
            Please log in to access and manage your vision, mission, and values.
          </p>
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
    </div>
  )
}

// Business Model Canvas Component
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
      if (!currentUser || activeSection !== "business-model-canvas") return

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

  if (activeSection !== "business-model-canvas") return null

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

      alert("Business Model Canvas saved successfully!")
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
          <p style={{ color: "#856404", margin: 0 }}>Please log in to access and manage your Business Model Canvas.</p>
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
                Save Canvas
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const StrategicGoals = ({ activeSection, milestoneData, setMilestoneData, currentUser, isInvestorView }) => {
  // Updated categories array to match the goalDomains
  const categories = [
    { key: "Strategic Growth & Product Development", name: "Strategic Growth & Product Development", color: "#a67c52" },
    { key: "Marketing, Brand & Customer Acquisition", name: "Marketing, Brand & Customer Acquisition", color: "#7d5a50" },
    { key: "Finance", name: "Finance", color: "#c8b6a6" },
    { key: "Operations", name: "Operations", color: "#e6d7c3" },
    { key: "Systems & Technology", name: "Systems & Technology", color: "#f5f0e1" },
    { key: "People, Capability & Knowledge", name: "People, Capability & Knowledge", color: "#d4c4b0" },
    { key: "Governance, Impact & Ecosystem Building", name: "Governance, Impact & Ecosystem Building", color: "#b8a491" },
  ]

  const [visibleCategories, setVisibleCategories] = useState({
    "Strategic Growth & Product Development": true,
    "Marketing, Brand & Customer Acquisition": true,
    "Finance": true,
    "Operations": true,
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

  if (activeSection !== "strategic-goals") return null

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
      <h3 style={{ color: "#4a352f", marginBottom: "10px" }}>Strategic Goals Progress</h3>

      <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#fdfcfb", borderRadius: "6px" }}>
        <p style={{ color: "#4a352f", marginBottom: "10px", fontWeight: "500" }}>Select charts to display:</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
          {categories.map((category) => (
            <label
              key={category.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                padding: "8px 12px",
                backgroundColor: visibleCategories[category.key] ? "#e6d7c3" : "#f5f0e1",
                borderRadius: "4px",
                border: `2px solid ${category.color}`,
                transition: "all 0.2s ease",
              }}
            >
              <input
                type="checkbox"
                checked={visibleCategories[category.key]}
                onChange={() => toggleCategoryVisibility(category.key)}
                style={{ cursor: "pointer", width: "16px", height: "16px" }}
              />
              <span style={{ color: "#4a352f", fontWeight: "500", fontSize: "14px" }}>{category.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
          marginBottom: "40px",
        }}
      >
        {categories.map((category) => {
          if (!visibleCategories[category.key]) return null

          return (
            <div
              key={category.key}
              style={{
                backgroundColor: "#fdfcfb",
                padding: "15px",
                borderRadius: "6px",
                border: `2px solid ${category.color}`,
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <h4 style={{ color: "#4a352f", margin: 0 }}>{category.name}</h4>
              </div>

              <div style={{ height: "200px" }}>
                <Bar
                  data={createChartData(category.name, category.color)}
                  options={chartOptions}
                  data-growth-stage={category.name}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div
        style={{
          backgroundColor: "#fdfcfb",
          padding: "20px",
          margin: "20px 0",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          border: "2px solid #7d5a50",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#4a352f", margin: 0 }}>Milestone Tracking</h3>
          {!isInvestorView && (
            <button
              onClick={handleAddMilestone}
              style={{
                padding: "10px 20px",
                backgroundColor: "#7d5a50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              Add Milestone
            </button>
          )}
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
            <p style={{ color: "#856404", margin: 0 }}>Please log in to access and manage milestones.</p>
          </div>
        )}

        {currentUser && (
          <>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ color: "#4a352f", fontWeight: "500", marginRight: "10px" }}>Filter by:</label>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                  color: "#4a352f",
                }}
              >
                <option value="all">All Milestones</option>
                <optgroup label="Goal Domain">
                  {goalDomains.map((domain) => (
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
            </div>

            {filteredMilestones.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#7d5a50" }}>
                No milestones found. {!isInvestorView && 'Click "Add Milestone" to get started.'}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    color: "#4a352f",
                    minWidth: "1000px",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: "#e6d7c3",
                        borderBottom: "2px solid #c8b6a6",
                      }}
                    >
                      <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Goal Domain</th>
                      <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Goal</th>
                      <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Milestone Category</th>
                      <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Milestone Description</th>
                      <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Target Date</th>
                      <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Status</th>
                      <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Owner</th>
                      <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>% Complete</th>
                      {!isInvestorView && (
                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMilestones.map((milestone) => (
                      <tr
                        key={milestone.id}
                        style={{
                          borderBottom: "1px solid #e6d7c3",
                        }}
                      >
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
                                  ? "#4CAF50"
                                  : milestone.status === "At Risk"
                                    ? "#F44336"
                                    : milestone.status === "On Track"
                                      ? "#2196F3"
                                      : "#FFC107",
                              color: "white",
                            }}
                          >
                            {milestone.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>{milestone.owner}</td>
                        <td style={{ padding: "12px" }}>{milestone.percentageCompletion}%</td>
                        {!isInvestorView && (
                          <td style={{ padding: "12px" }}>
                            <div style={{ display: "flex", gap: "5px" }}>
                              <button
                                onClick={() => handleEditMilestone(milestone)}
                                style={{
                                  padding: "4px 8px",
                                  backgroundColor: "#a67c52",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "10px",
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
                                  fontSize: "10px",
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
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
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "700px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h3 style={{ color: "#4a352f", marginTop: 0 }}>
              {editingMilestone ? "Edit Milestone" : "Add New Milestone"}
            </h3>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", color: "#4a352f", marginBottom: "5px", fontWeight: "500" }}>
                Goal Domain (Growth Stage)
              </label>
              <select
                value={newMilestone.growthStage}
                onChange={(e) => {
                  setNewMilestone({
                    ...newMilestone,
                    growthStage: e.target.value,
                    milestoneCategory: "",
                    customMilestoneCategory: "",
                  })
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
                <label style={{ display: "block", color: "#4a352f", marginBottom: "5px", fontWeight: "500" }}>
                  Specify Goal Domain
                </label>
                <input
                  type="text"
                  value={newMilestone.customGrowthStage}
                  onChange={(e) => setNewMilestone({ ...newMilestone, customGrowthStage: e.target.value })}
                  placeholder="Enter custom goal domain"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e8ddd4",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", color: "#4a352f", marginBottom: "5px", fontWeight: "500" }}>
                Goal
              </label>
              <select
                value={newMilestone.goal}
                onChange={(e) => setNewMilestone({ ...newMilestone, goal: e.target.value })}
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
                <label style={{ display: "block", color: "#4a352f", marginBottom: "5px", fontWeight: "500" }}>
                  Milestone Category
                </label>
                <select
                  value={newMilestone.milestoneCategory}
                  onChange={(e) => setNewMilestone({ ...newMilestone, milestoneCategory: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e8ddd4",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                >
                  <option value="">Select Milestone Category</option>
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
                <label style={{ display: "block", color: "#4a352f", marginBottom: "5px", fontWeight: "500" }}>
                  Specify Milestone Category
                </label>
                <input
                  type="text"
                  value={newMilestone.customMilestoneCategory}
                  onChange={(e) => setNewMilestone({ ...newMilestone, customMilestoneCategory: e.target.value })}
                  placeholder="Enter custom milestone category"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e8ddd4",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", color: "#4a352f", marginBottom: "5px", fontWeight: "500" }}>
                Milestone Description
              </label>
              <textarea
                value={newMilestone.milestoneDescription}
                onChange={(e) => setNewMilestone({ ...newMilestone, milestoneDescription: e.target.value })}
                placeholder="Describe the milestone in detail..."
                rows="4"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <div>
                <label style={{ display: "block", color: "#4a352f", marginBottom: "5px", fontWeight: "500" }}>
                  Target Date
                </label>
                <input
                  type="date"
                  value={newMilestone.targetDate}
                  onChange={(e) => setNewMilestone({ ...newMilestone, targetDate: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e8ddd4",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", color: "#4a352f", marginBottom: "5px", fontWeight: "500" }}>
                  Status
                </label>
                <select
                  value={newMilestone.status}
                  onChange={(e) => setNewMilestone({ ...newMilestone, status: e.target.value })}
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
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <div>
                <label style={{ display: "block", color: "#4a352f", marginBottom: "5px", fontWeight: "500" }}>
                  Owner
                </label>
                <select
                  value={newMilestone.owner}
                  onChange={(e) => setNewMilestone({ ...newMilestone, owner: e.target.value })}
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

              <div>
                <label style={{ display: "block", color: "#4a352f", marginBottom: "5px", fontWeight: "500" }}>
                  % Completion
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newMilestone.percentageCompletion}
                  onChange={(e) =>
                    setNewMilestone({ ...newMilestone, percentageCompletion: Number.parseInt(e.target.value) || 0 })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e8ddd4",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                />
              </div>
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
  const [riskSection, setRiskSection] = useState("business-risk")
  const [riskData, setRiskData] = useState({
    financial: [],
    operational: [],
    "legal-compliance": [],
    insurance: [],
    people: [],
    "disaster-recovery": [],
    "stakeholder-management": [],
  })

  useEffect(() => {
    const loadRiskData = async () => {
      if (!currentUser || activeSection !== "risk-management") return

      try {
        const riskSnapshot = await getDocs(query(collection(db, "riskData"), where("userId", "==", currentUser.uid)))

        if (!riskSnapshot.empty) {
          const data = riskSnapshot.docs[0].data()
          setRiskData(
            data.risks || {
              financial: [],
              operational: [],
              "legal-compliance": [],
              insurance: [],
              people: [],
              "disaster-recovery": [],
              "stakeholder-management": [],
            },
          )
        }
      } catch (error) {
        console.error("Error loading risk data:", error)
      }
    }

    loadRiskData()
  }, [activeSection, currentUser])

  if (activeSection !== "risk-management") return null

  const saveRiskData = async (newRiskData) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    if (!currentUser) return

    try {
      const dataWithUser = {
        risks: newRiskData,
        userId: currentUser.uid,
        updatedAt: new Date().toISOString(),
      }

      const existingSnapshot = await getDocs(query(collection(db, "riskData"), where("userId", "==", currentUser.uid)))

      if (existingSnapshot.empty) {
        await addDoc(collection(db, "riskData"), dataWithUser)
      } else {
        const docRef = doc(db, "riskData", existingSnapshot.docs[0].id)
        await updateDoc(docRef, dataWithUser)
      }
    } catch (error) {
      console.error("Error saving risk data:", error)
    }
  }

  const addRiskItem = (category) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    const newItem = {
      id: Date.now().toString(),
      risk: "",
      riskCategory: category.charAt(0).toUpperCase() + category.slice(1).replace("-", " "),
      description: "",
      severity: 1,
      likelihood: 1,
      mitigation: "",
      mitigationStatus: "not done",
    }

    const newRiskData = {
      ...riskData,
      [category]: [...(riskData[category] || []), newItem],
    }

    setRiskData(newRiskData)
    saveRiskData(newRiskData)
  }

  const updateRiskItem = (category, itemId, field, value) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    const newRiskData = {
      ...riskData,
      [category]: riskData[category].map((item) => (item.id === itemId ? { ...item, [field]: value } : item)),
    }

    setRiskData(newRiskData)
    if (updateRiskItem.timeout) clearTimeout(updateRiskItem.timeout)
    updateRiskItem.timeout = setTimeout(() => {
      saveRiskData(newRiskData)
    }, 500)
  }

  const deleteRiskItem = (category, itemId) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    if (window.confirm("Are you sure you want to delete this risk item?")) {
      const newRiskData = {
        ...riskData,
        [category]: riskData[category].filter((item) => item.id !== itemId),
      }

      setRiskData(newRiskData)
      saveRiskData(newRiskData)
    }
  }

  const createScatterChartData = (category, color) => {
    let data = []
    const categoryMap = {}

    if (category === "business-risk") {
      Object.entries(riskData).forEach(([catId, risks]) => {
        risks.forEach((risk) => {
          data.push(risk)
          categoryMap[risk.id] = catId
        })
      })
    } else {
      data = riskData[category] || []
    }

    return {
      datasets: data
        .filter((item) => item.risk && item.likelihood && item.severity)
        .map((item, index) => {
          let dotColor = color
          if (category === "business-risk") {
            const originalCategory = categoryMap[item.id]
            const categoryInfo = riskCategories.find((cat) => cat.id === originalCategory)
            dotColor = categoryInfo ? categoryInfo.color : color
          }

          return {
            label: item.risk,
            data: [
              {
                x: item.likelihood,
                y: item.severity,
              },
            ],
            backgroundColor: dotColor,
            borderColor: "#7d5a50",
            borderWidth: 2,
            pointRadius: 10,
            pointHoverRadius: 12,
          }
        }),
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
          title: (context) => context[0].dataset.label,
          label: (context) => {
            const point = context.parsed
            return [`Likelihood: ${point.x}`, `Severity: ${point.y}`]
          },
        },
      },
    },
    scales: {
      x: {
        type: "linear",
        position: "bottom",
        min: 0,
        max: 5,
        title: {
          display: true,
          text: "Likelihood",
          color: "#4a352f",
          font: {
            weight: "bold",
            size: 14,
          },
        },
        grid: {
          color: "#f0e6d9",
        },
        ticks: {
          stepSize: 1,
        },
      },
      y: {
        min: 0,
        max: 5,
        title: {
          display: true,
          text: "Severity",
          color: "#4a352f",
          font: {
            weight: "bold",
            size: 14,
          },
        },
        grid: {
          color: "#f0e6d9",
        },
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  const riskCategories = [
    { id: "business-risk", name: "Business Risk", color: "#c62828" },
    { id: "financial", name: "Financial Risk", color: "#e74c3c" },
    { id: "operational", name: "Operational Risk", color: "#3498db" },
    { id: "legal-compliance", name: "Legal & Compliance", color: "#9b59b6" },
    { id: "insurance", name: "Insurance", color: "#f39c12" },
    { id: "people", name: "People Risk", color: "#1abc9c" },
    { id: "disaster-recovery", name: "Disaster Recovery", color: "#e67e22" },
    { id: "stakeholder-management", name: "Stakeholder Management", color: "#2ecc71" },
  ]

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
      <h3 style={{ color: "#4a352f", marginBottom: "20px" }}>Risk Management</h3>

      {/* Risk Category Tabs */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        {riskCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setRiskSection(category.id)}
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
                      minWidth: "900px",
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
                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", width: "200px" }}>
                          Description
                        </th>
                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", width: "100px" }}>
                          Severity (1-5)
                        </th>
                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", width: "100px" }}>
                          Likelihood
                        </th>
                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", width: "200px" }}>
                          Mitigation
                        </th>
                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", width: "120px" }}>
                          Mitigation Status
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
                                <option value="not done">Not Done</option>
                                <option value="in progress">In Progress</option>
                                <option value="done">Done</option>
                              </select>
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

const Strategy = () => {
  const [activeSection, setActiveSection] = useState("vision-mission-values")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [milestoneData, setMilestoneData] = useState([])
  const [currentUser, setCurrentUser] = useState(null)

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

  const handleExitInvestorView = () => {
    sessionStorage.removeItem("viewingSMEId")
    sessionStorage.removeItem("viewingSMEName")
    sessionStorage.removeItem("investorViewMode")
    window.location.href = "/my-cohorts"
  }

  const sectionButtons = [
    { id: "vision-mission-values", label: "Vision, Mission, Values" },
    { id: "business-model-canvas", label: "Business Model Canvas" },
    { id: "strategic-goals", label: "Strategic Goals" },
    { id: "risk-management", label: "Risk Management" },
  ]

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
              margin: "90px 0 30px 0",
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
                Investor View: Viewing {viewingSMEName}'s Strategy & Execution (Read-Only)
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
          <div
            style={{
              display: "flex",
              gap: "10px",
              margin: isInvestorView ? "20px 0" : "50px 0 20px 0",
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
                  backgroundColor: activeSection === button.id ? "#5d4037" : "#ffffff",
                  color: activeSection === button.id ? "#fdfcfb" : "#5d4037",
                  border: "2px solid #e8ddd4",
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

          <VisionMissionValues
            activeSection={activeSection}
            currentUser={currentUser}
            isInvestorView={isInvestorView}
          />
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
         
        </div>
      </div>
    </div>
  )
}

export default Strategy