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
const VisionMissionValues = ({ activeSection, currentUser }) => {
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
                style={{
                  width: "100%",
                  padding: "15px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  resize: "vertical",
                  fontFamily: "inherit",
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
                style={{
                  width: "100%",
                  padding: "15px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  resize: "vertical",
                  fontFamily: "inherit",
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
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}
            >
              <h3 style={{ color: "#5d4037", margin: 0 }}>Values</h3>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#5d4037",
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
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "15px",
                minHeight: "100px",
              }}
            >
              {visionMissionData.values.length > 0 ? (
                visionMissionData.values.map((value, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: "#e8ddd4",
                      padding: "15px",
                      borderRadius: "4px",
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ color: "#5d4037", fontWeight: "500" }}>{value}</span>
                    <button
                      onClick={() => handleRemoveValue(index)}
                      style={{
                        backgroundColor: "#F44336",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: "20px",
                        height: "20px",
                        cursor: "pointer",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    textAlign: "center",
                    color: "#72542b",
                    padding: "40px",
                    fontStyle: "italic",
                  }}
                >
                  No values added yet. Click "Add Value" to get started.
                </div>
              )}
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <button
              onClick={handleSaveVisionMission}
              style={{
                padding: "12px 30px",
                backgroundColor: "#5d4037",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "16px",
              }}
            >
              Save Vision, Mission & Values
            </button>
          </div>

          {showModal && (
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
                  boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                  width: "400px",
                  maxWidth: "90vw",
                }}
              >
                <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "20px" }}>Add New Value</h3>

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
                  onKeyPress={(e) => e.key === "Enter" && handleAddValue()}
                />

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setShowModal(false)}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#e8ddd4",
                      color: "#5d4037",
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
                      backgroundColor: "#5d4037",
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
        </>
      )}
    </div>
  )
}

// Strategic Goals Charts Component with Eye Icons and Visibility Toggle
const StrategicGoals = ({ activeSection, milestoneData, onNavigateToMilestone }) => {
  const [visibleCategories, setVisibleCategories] = useState({
    Growth: true,
    Finance: true,
    Operations: true,
    People: true,
    Systems: true,
    Customers: true,
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

    // Calculate average percentage completion
    const totalPercentage = relevantMilestones.reduce((sum, milestone) => {
      return sum + (milestone.percentageCompletion || 0)
    }, 0)

    return Math.round(totalPercentage / relevantMilestones.length)
  }

  const createChartData = (growthStage, color) => {
    const goals = ["Goal 1", "Goal 2", "Goal 3", "Goal 4"]
    const completionData = goals.map((_, index) => calculateGoalCompletion(index + 1, growthStage))

    // Filter out goals with no data (0% completion and no milestones)
    const goalsWithData = []
    const dataWithValues = []

    goals.forEach((goal, index) => {
      const completion = completionData[index]
      const relevantMilestones = milestoneData.filter(
        (milestone) => milestone.goal === goal && milestone.growthStage === growthStage,
      )

      // Only include goals that have milestones or completion data
      if (relevantMilestones.length > 0 || completion > 0) {
        goalsWithData.push(goal)
        dataWithValues.push(completion)
      }
    })

    // If no goals have data, return empty dataset
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
            // Access growthStage from the dataset attribute
            const growthStage = context.chart.canvas.dataset.growthStage

            // Find the actual milestone for this goal and growth stage
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

  const categories = [
    { key: "Growth", name: "Growth", color: "#a67c52" },
    { key: "Finance", name: "Finance", color: "#7d5a50" },
    { key: "Operations", name: "Operations", color: "#c8b6a6" },
    { key: "People", name: "People", color: "#e6d7c3" },
    { key: "Systems", name: "Systems", color: "#f5f0e1" },
    { key: "Customers", name: "Customers", color: "#a67c52" },
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
                <button
                  onClick={() => onNavigateToMilestone(category.name)}
                  style={{
                    padding: "4px 8px",
                    backgroundColor: category.color,
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "10px",
                    fontWeight: "500",
                  }}
                >
                  View Milestones
                </button>
              </div>

              <div style={{ height: "200px" }}>
                <Bar
                  data={createChartData(category.name, category.color)}
                  options={{
                    ...chartOptions,
                    onClick: (event, elements) => {
                      if (elements.length > 0) {
                        onNavigateToMilestone(category.name)
                      }
                    },
                  }}
                  // Add a data attribute to pass the growth stage to the tooltip callback
                  data-growth-stage={category.name}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Milestone Tracking Component with Filter
const MilestoneTracking = ({ activeSection, milestoneData, setMilestoneData, currentUser, filterStage = null }) => {
  const [showModal, setShowModal] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState(null)
  const [filterBy, setFilterBy] = useState(filterStage || "all")
  const [newMilestone, setNewMilestone] = useState({
    growthStage: "",
    goal: "",
    goalDescription: "",
    milestones: [],
    targetDate: "",
    status: "",
    owner: "",
    info: "",
    percentageCompletion: 0,
  })

  useEffect(() => {
    if (filterStage) {
      setFilterBy(filterStage)
    }
  }, [filterStage])

  if (activeSection !== "milestone-tracking") return null

  const growthStages = ["Growth", "Finance", "Operations", "People", "Systems", "Customers"]
  const goals = ["Goal 1", "Goal 2", "Goal 3", "Goal 4"]
  const statuses = ["Not Started", "In Progress", "On Track", "At Risk", "Done"]
  const owners = ["Product Team", "Business Dev", "Legal Team", "Engineering", "Marketing", "Operations"]
  const availableMilestones = [
    "Market Research",
    "Product Development",
    "Testing Phase",
    "Launch Preparation",
    "Marketing Campaign",
    "Sales Training",
    "Partnership Development",
    "Quality Assurance",
    "Regulatory Approval",
    "System Integration",
    "User Training",
    "Documentation",
  ]

  // Filter milestones based on selected filter
  const filteredMilestones = milestoneData.filter((milestone) => {
    if (filterBy === "all") return true

    // Filter by specific values
    if (growthStages.includes(filterBy)) return milestone.growthStage === filterBy
    if (statuses.includes(filterBy)) return milestone.status === filterBy
    if (owners.includes(filterBy)) return milestone.owner === filterBy
    if (goals.includes(filterBy)) return milestone.goal === filterBy

    return true
  })

  const handleAddMilestone = () => {
    setEditingMilestone(null)
    setNewMilestone({
      growthStage: "",
      goal: "",
      goalDescription: "",
      milestones: [],
      targetDate: "",
      status: "",
      owner: "",
      info: "",
      percentageCompletion: 0,
    })
    setShowModal(true)
  }

  const handleEditMilestone = (milestone) => {
    setEditingMilestone(milestone)
    setNewMilestone({
      ...milestone,
      milestones: milestone.milestones || [],
      percentageCompletion: milestone.percentageCompletion || 0,
    })
    setShowModal(true)
  }

  const handleSaveMilestone = async () => {
    if (!currentUser) {
      alert("You must be logged in to save milestones.")
      return
    }

    try {
      const milestoneWithUser = {
        ...newMilestone,
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

      setShowModal(false)
      setNewMilestone({
        growthStage: "",
        goal: "",
        goalDescription: "",
        milestones: [],
        targetDate: "",
        status: "",
        owner: "",
        info: "",
        percentageCompletion: 0,
      })
    } catch (error) {
      console.error("Error saving milestone:", error)
      alert("Error saving milestone. Please try again.")
    }
  }

  const handleDeleteMilestone = async (milestoneId) => {
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

  const getStatusColor = (status) => {
    switch (status) {
      case "Done":
        return "#4CAF50"
      case "On Track":
        return "#2196F3"
      case "In Progress":
        return "#FF9800"
      case "At Risk":
        return "#F44336"
      case "Not Started":
        return "#9E9E9E"
      default:
        return "#9E9E9E"
    }
  }

  const getPercentageColor = (percentage) => {
    if (percentage < 30) return "#F44336" // Red
    if (percentage < 70) return "#FF9800" // Orange
    return "#4CAF50" // Green
  }

  const handleMilestoneSelection = (milestone) => {
    const currentMilestones = newMilestone.milestones || []
    if (currentMilestones.includes(milestone)) {
      setNewMilestone((prev) => ({
        ...prev,
        milestones: currentMilestones.filter((m) => m !== milestone),
      }))
    } else {
      setNewMilestone((prev) => ({
        ...prev,
        milestones: [...currentMilestones, milestone],
      }))
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ color: "#4a352f", margin: 0 }}>Milestone Tracking</h3>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <label style={{ color: "#4a352f", fontWeight: "500" }}>Filter by:</label>
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "2px solid #e6d7c3",
              borderRadius: "4px",
              fontSize: "14px",
              color: "#4a352f",
            }}
          >
            <option value="all">All</option>
            {growthStages.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
            {goals.map((goal) => (
              <option key={goal} value={goal}>
                {goal}
              </option>
            ))}
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
            {owners.map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </select>
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
            }}
          >
            Add Milestone
          </button>
        </div>
      </div>

      {filteredMilestones.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#4a352f",
            backgroundColor: "#f5f0e1",
            borderRadius: "6px",
          }}
        >
          <p style={{ fontSize: "16px", marginBottom: "10px" }}>
            {filterBy === "all" ? "No milestones added yet." : `No milestones found for filter: ${filterBy}`}
          </p>
          <p style={{ fontSize: "14px", color: "#7d5a50" }}>
            Click "Add Milestone" to get started with tracking your goals.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              color: "#4a352f",
              minWidth: "1100px",
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "#e6d7c3",
                  borderBottom: "2px solid #c8b6a6",
                }}
              >
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Growth Stage</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Goal</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Goal Description</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Milestones</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Target Date</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Milestone Status</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>% Completion</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Owner</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Info</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Actions</th>
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
                  <td style={{ padding: "12px", maxWidth: "200px", wordWrap: "break-word" }}>
                    {milestone.goalDescription}
                  </td>
                  <td style={{ padding: "12px", maxWidth: "150px" }}>
                    {milestone.milestones && milestone.milestones.length > 0 ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {milestone.milestones.map((m, index) => (
                          <span
                            key={index}
                            style={{
                              padding: "2px 6px",
                              backgroundColor: "#e6d7c3",
                              borderRadius: "4px",
                              fontSize: "10px",
                            }}
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td style={{ padding: "12px" }}>{milestone.targetDate}</td>
                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        padding: "6px 12px",
                        borderRadius: "4px",
                        backgroundColor: getStatusColor(milestone.status),
                        color: "white",
                        fontSize: "12px",
                        fontWeight: "500",
                        display: "inline-block",
                        minWidth: "80px",
                        textAlign: "center",
                      }}
                    >
                      {milestone.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        padding: "6px 12px",
                        borderRadius: "4px",
                        backgroundColor: getPercentageColor(milestone.percentageCompletion || 0),
                        color: "white",
                        fontSize: "12px",
                        fontWeight: "500",
                        display: "inline-block",
                        minWidth: "50px",
                        textAlign: "center",
                      }}
                    >
                      {milestone.percentageCompletion || 0}%
                    </span>
                  </td>
                  <td style={{ padding: "12px" }}>{milestone.owner}</td>
                  <td style={{ padding: "12px", maxWidth: "150px", wordWrap: "break-word" }}>{milestone.info}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for adding/editing milestones */}
      {showModal && (
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
              backgroundColor: "#faf7f2",
              padding: "30px",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              width: "600px",
              maxWidth: "90vw",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h3
              style={{
                color: "#4a352f",
                marginTop: 0,
                marginBottom: "20px",
              }}
            >
              {editingMilestone ? "Edit Milestone" : "Add New Milestone"}
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#4a352f",
                    fontWeight: "500",
                  }}
                >
                  Growth Stage:
                </label>
                <select
                  value={newMilestone.growthStage}
                  onChange={(e) => setNewMilestone((prev) => ({ ...prev, growthStage: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e6d7c3",
                    borderRadius: "4px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Select Growth Stage</option>
                  {growthStages.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#4a352f",
                    fontWeight: "500",
                  }}
                >
                  Goal:
                </label>
                <select
                  value={newMilestone.goal}
                  onChange={(e) => setNewMilestone((prev) => ({ ...prev, goal: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e6d7c3",
                    borderRadius: "4px",
                    fontSize: "14px",
                    boxSizing: "border-box",
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
            </div>

            <div style={{ marginBottom: "20px", marginTop: "15px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#4a352f",
                  fontWeight: "500",
                }}
              >
                Goal Description:
              </label>
              <textarea
                value={newMilestone.goalDescription}
                onChange={(e) => setNewMilestone((prev) => ({ ...prev, goalDescription: e.target.value }))}
                placeholder="Enter goal description"
                rows="3"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e6d7c3",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#4a352f",
                  fontWeight: "500",
                }}
              >
                Milestones (select multiple):
              </label>
              <div
                style={{
                  border: "2px solid #e6d7c3",
                  borderRadius: "4px",
                  padding: "10px",
                  maxHeight: "150px",
                  overflowY: "auto",
                }}
              >
                {availableMilestones.map((milestone) => (
                  <label
                    key={milestone}
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={newMilestone.milestones?.includes(milestone) || false}
                      onChange={() => handleMilestoneSelection(milestone)}
                      style={{ marginRight: "8px" }}
                    />
                    {milestone}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#4a352f",
                    fontWeight: "500",
                  }}
                >
                  Target Date:
                </label>
                <input
                  type="date"
                  value={newMilestone.targetDate}
                  onChange={(e) => setNewMilestone((prev) => ({ ...prev, targetDate: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e6d7c3",
                    borderRadius: "4px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#4a352f",
                    fontWeight: "500",
                  }}
                >
                  Status:
                </label>
                <select
                  value={newMilestone.status}
                  onChange={(e) => setNewMilestone((prev) => ({ ...prev, status: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e6d7c3",
                    borderRadius: "4px",
                    fontSize: "14px",
                    boxSizing: "border-box",
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginTop: "15px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#4a352f",
                    fontWeight: "500",
                  }}
                >
                  Owner:
                </label>
                <select
                  value={newMilestone.owner}
                  onChange={(e) => setNewMilestone((prev) => ({ ...prev, owner: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e6d7c3",
                    borderRadius: "4px",
                    fontSize: "14px",
                    boxSizing: "border-box",
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
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#4a352f",
                    fontWeight: "500",
                  }}
                >
                  Percentage Completion:
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newMilestone.percentageCompletion}
                  onChange={(e) => {
                    const value = Math.min(100, Math.max(0, Number.parseInt(e.target.value) || 0))
                    setNewMilestone((prev) => ({ ...prev, percentageCompletion: value }))
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e6d7c3",
                    borderRadius: "4px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                  placeholder="0-100"
                />
              </div>
            </div>

            <div style={{ marginBottom: "25px", marginTop: "15px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#4a352f",
                  fontWeight: "500",
                }}
              >
                Additional Info:
              </label>
              <textarea
                value={newMilestone.info}
                onChange={(e) => setNewMilestone((prev) => ({ ...prev, info: e.target.value }))}
                placeholder="Enter additional information"
                rows="3"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e6d7c3",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
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

const RiskManagement = ({ activeSection, currentUser, onNavigateToRiskCategory }) => {
  const [riskSection, setRiskSection] = useState("financial")
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
    const newItem = {
      id: Date.now().toString(),
      risk: "",
      riskCategory: category.charAt(0).toUpperCase() + category.slice(1).replace("-", " "),
      description: "",
      severity: 1,
      likelihood: 1,
      mitigation: "",
      mitigationStatus: "not done", // Default value
    }

    const newRiskData = {
      ...riskData,
      [category]: [...(riskData[category] || []), newItem],
    }

    setRiskData(newRiskData)
    saveRiskData(newRiskData)
  }

  const updateRiskItem = (category, itemId, field, value) => {
    const newRiskData = {
      ...riskData,
      [category]: riskData[category].map((item) => (item.id === itemId ? { ...item, [field]: value } : item)),
    }

    setRiskData(newRiskData)
    // Debounce save to avoid too many writes
    if (updateRiskItem.timeout) clearTimeout(updateRiskItem.timeout)
    updateRiskItem.timeout = setTimeout(() => {
      saveRiskData(newRiskData)
    }, 500)
  }

  const deleteRiskItem = (category, itemId) => {
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
    const data = riskData[category] || []
    return {
      datasets: data
        .filter((item) => item.risk && item.likelihood && item.severity)
        .map((item, index) => ({
          label: item.risk,
          data: [
            {
              x: item.likelihood,
              y: item.severity,
            },
          ],
          backgroundColor: color,
          borderColor: "#7d5a50",
          borderWidth: 2,
          pointRadius: 10,
          pointHoverRadius: 12,
        })),
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

        const data = riskData[category.id] || []

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
              <h4 style={{ color: "#4a352f", marginBottom: "15px" }}>{category.name} Matrix</h4>
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
                <h4 style={{ color: "#4a352f", margin: 0 }}>Risk Assessment Table</h4>
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
              </div>

              {data.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#7d5a50" }}>
                  No risk items added yet. Click "Add Risk Item" to get started.
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
                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", width: "80px" }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((item) => (
                        <tr
                          key={item.id}
                          style={{
                            borderBottom: "1px solid #e6d7c3",
                          }}
                        >
                          <td style={{ padding: "12px" }}>
                            <input
                              type="text"
                              value={item.risk || ""}
                              onChange={(e) => updateRiskItem(category.id, item.id, "risk", e.target.value)}
                              placeholder="Risk ID"
                              style={{
                                width: "100%",
                                padding: "8px",
                                border: "1px solid #e6d7c3",
                                borderRadius: "4px",
                                fontSize: "12px",
                              }}
                            />
                          </td>
                          <td style={{ padding: "12px" }}>
                            <input
                              type="text"
                              value={item.riskCategory || ""}
                              onChange={(e) => updateRiskItem(category.id, item.id, "riskCategory", e.target.value)}
                              placeholder="Category"
                              style={{
                                width: "100%",
                                padding: "8px",
                                border: "1px solid #e6d7c3",
                                borderRadius: "4px",
                                fontSize: "12px",
                              }}
                            />
                          </td>
                          <td style={{ padding: "12px" }}>
                            <textarea
                              value={item.description || ""}
                              onChange={(e) => updateRiskItem(category.id, item.id, "description", e.target.value)}
                              placeholder="Enter description"
                              rows="2"
                              style={{
                                width: "100%",
                                padding: "8px",
                                border: "1px solid #e6d7c3",
                                borderRadius: "4px",
                                fontSize: "12px",
                                resize: "vertical",
                              }}
                            />
                          </td>
                          <td style={{ padding: "12px" }}>
                            <select
                              value={item.severity || 1}
                              onChange={(e) =>
                                updateRiskItem(category.id, item.id, "severity", Number.parseInt(e.target.value))
                              }
                              style={{
                                width: "100%",
                                padding: "8px",
                                border: "1px solid #e6d7c3",
                                borderRadius: "4px",
                                fontSize: "12px",
                              }}
                            >
                              <option value={1}>1</option>
                              <option value={2}>2</option>
                              <option value={3}>3</option>
                              <option value={4}>4</option>
                              <option value={5}>5</option>
                            </select>
                          </td>
                          <td style={{ padding: "12px" }}>
                            <select
                              value={item.likelihood || 1}
                              onChange={(e) =>
                                updateRiskItem(category.id, item.id, "likelihood", Number.parseInt(e.target.value))
                              }
                              style={{
                                width: "100%",
                                padding: "8px",
                                border: "1px solid #e6d7c3",
                                borderRadius: "4px",
                                fontSize: "12px",
                              }}
                            >
                              <option value={1}>1</option>
                              <option value={2}>2</option>
                              <option value={3}>3</option>
                              <option value={4}>4</option>
                              <option value={5}>5</option>
                            </select>
                          </td>
                          <td style={{ padding: "12px" }}>
                            <textarea
                              value={item.mitigation || ""}
                              onChange={(e) => updateRiskItem(category.id, item.id, "mitigation", e.target.value)}
                              placeholder="Enter mitigation strategy"
                              rows="2"
                              style={{
                                width: "100%",
                                padding: "8px",
                                border: "1px solid #e6d7c3",
                                borderRadius: "4px",
                                fontSize: "12px",
                                resize: "vertical",
                              }}
                            />
                          </td>
                          <td style={{ padding: "12px" }}>
                            <select
                              value={item.mitigationStatus || "not done"}
                              onChange={(e) => updateRiskItem(category.id, item.id, "mitigationStatus", e.target.value)}
                              style={{
                                width: "100%",
                                padding: "8px",
                                border: "1px solid #e6d7c3",
                                borderRadius: "4px",
                                fontSize: "12px",
                              }}
                            >
                              <option value="not done">Not Done</option>
                              <option value="done">Done</option>
                            </select>
                          </td>
                          <td style={{ padding: "12px" }}>
                            <button
                              onClick={() => deleteRiskItem(category.id, item.id)}
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
                        </tr>
                      ))}
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

// Board Activity & Governance Component (Updated with PIS score logic and new structure)
// Board Activity & Governance Component (Updated with conditional logic)
const BoardActivityGovernance = ({ activeSection, currentUser, pisScore = 0 }) => {
  const [hasBoardDirectors, setHasBoardDirectors] = useState(null)
  const [showBoardQuestion, setShowBoardQuestion] = useState(true)
  const [policies, setPolicies] = useState([])
  const [meetings, setMeetings] = useState([])
  const [directors, setDirectors] = useState([])
  const [committees, setCommittees] = useState([])
  const [uploadedFiles, setUploadedFiles] = useState({})

  // Modal states
  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [showDirectorModal, setShowDirectorModal] = useState(false)
  const [showCommitteeModal, setShowCommitteeModal] = useState(false)
  const [showPolicyProcedureModal, setShowPolicyProcedureModal] = useState(false)

  // Form states
  const [newMeeting, setNewMeeting] = useState({ date: "", type: "", attendees: "", totalMembers: "", minutes: "" })
  const [newDirector, setNewDirector] = useState({ name: "", position: "", date: "", committees: [] })
  const [newCommittee, setNewCommittee] = useState({ name: "", position: "", date: "", committees: [] })
  const [newPolicyProcedure, setNewPolicyProcedure] = useState({
    name: "",
    type: "policy",
    status: "",
    date: "",
    fileAttached: false,
    fileData: null,
  })

  // Edit states
  const [editingMeeting, setEditingMeeting] = useState(null)
  const [editingDirector, setEditingDirector] = useState(null)
  const [editingCommittee, setEditingCommittee] = useState(null)
  const [editingPolicyProcedure, setEditingPolicyProcedure] = useState(null)

  // Load user-specific data from Firebase on component mount
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) return

      try {
        const [meetingsSnapshot, directorsSnapshot, committeesSnapshot, policyProceduresSnapshot] = await Promise.all([
          getDocs(query(collection(db, "meetings"), where("userId", "==", currentUser.uid))),
          getDocs(query(collection(db, "directors"), where("userId", "==", currentUser.uid))),
          getDocs(query(collection(db, "committees"), where("userId", "==", currentUser.uid))),
          getDocs(query(collection(db, "policyProcedures"), where("userId", "==", currentUser.uid))),
        ])

        setMeetings(meetingsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
        setDirectors(directorsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
        setCommittees(committeesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
        setPolicies(policyProceduresSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      } catch (error) {
        console.error("Error loading user data:", error)
      }
    }

    if (activeSection === "governance") {
      loadUserData()
    }
  }, [activeSection, currentUser])

  if (activeSection !== "governance") return null

  const hasMinimumGovernanceScore = pisScore >= 262.5
  const hasFullBoardScore = pisScore >= 350

  const handleBoardDirectorsResponse = (hasDirectors) => {
    setHasBoardDirectors(hasDirectors)
    setShowBoardQuestion(false)
  }

  // Meeting handlers
  const handleAddMeeting = () => {
    setEditingMeeting(null)
    setNewMeeting({ date: "", type: "", attendees: "", totalMembers: "", minutes: "" })
    setShowMeetingModal(true)
  }

  const handleEditMeeting = (meeting) => {
    setEditingMeeting(meeting)
    setNewMeeting(meeting)
    setShowMeetingModal(true)
  }

  const handleSaveMeeting = async () => {
    if (!currentUser) {
      alert("You must be logged in to save meetings.")
      return
    }

    try {
      const meetingWithUser = {
        ...newMeeting,
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
      }

      if (editingMeeting) {
        const meetingRef = doc(db, "meetings", editingMeeting.id)
        await updateDoc(meetingRef, meetingWithUser)
        setMeetings((prev) =>
          prev.map((m) => (m.id === editingMeeting.id ? { ...meetingWithUser, id: editingMeeting.id } : m)),
        )
      } else {
        const docRef = await addDoc(collection(db, "meetings"), meetingWithUser)
        setMeetings((prev) => [...prev, { ...meetingWithUser, id: docRef.id }])
      }

      setShowMeetingModal(false)
      setNewMeeting({ date: "", type: "", attendees: "", totalMembers: "", minutes: "" })
    } catch (error) {
      console.error("Error saving meeting:", error)
      alert("Error saving meeting. Please try again.")
    }
  }

  const handleDeleteMeeting = async (meetingId) => {
    if (window.confirm("Are you sure you want to delete this meeting?")) {
      try {
        await deleteDoc(doc(db, "meetings", meetingId))
        setMeetings((prev) => prev.filter((m) => m.id !== meetingId))
      } catch (error) {
        console.error("Error deleting meeting:", error)
        alert("Error deleting meeting. Please try again.")
      }
    }
  }

  // Director handlers
  const handleAddDirector = () => {
    setEditingDirector(null)
    setNewDirector({ name: "", position: "", date: "", committees: [] })
    setShowDirectorModal(true)
  }

  const handleEditDirector = (director) => {
    setEditingDirector(director)
    setNewDirector(director)
    setShowDirectorModal(true)
  }

  const handleSaveDirector = async () => {
    if (!currentUser) {
      alert("You must be logged in to save directors.")
      return
    }

    try {
      const directorWithUser = {
        ...newDirector,
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
      }

      if (editingDirector) {
        const directorRef = doc(db, "directors", editingDirector.id)
        await updateDoc(directorRef, directorWithUser)
        setDirectors((prev) =>
          prev.map((d) => (d.id === editingDirector.id ? { ...directorWithUser, id: editingDirector.id } : d)),
        )
      } else {
        const docRef = await addDoc(collection(db, "directors"), directorWithUser)
        setDirectors((prev) => [...prev, { ...directorWithUser, id: docRef.id }])
      }

      setShowDirectorModal(false)
      setNewDirector({ name: "", position: "", date: "", committees: [] })
    } catch (error) {
      console.error("Error saving director:", error)
      alert("Error saving director. Please try again.")
    }
  }

  const handleDeleteDirector = async (directorId) => {
    if (window.confirm("Are you sure you want to delete this director?")) {
      try {
        await deleteDoc(doc(db, "directors", directorId))
        setDirectors((prev) => prev.filter((d) => d.id !== directorId))
      } catch (error) {
        console.error("Error deleting director:", error)
        alert("Error deleting director. Please try again.")
      }
    }
  }

  // Committee handlers
  const handleAddCommittee = () => {
    setEditingCommittee(null)
    setNewCommittee({ name: "", position: "", date: "", committees: [] })
    setShowCommitteeModal(true)
  }

  const handleEditCommittee = (committee) => {
    setEditingCommittee(committee)
    setNewCommittee(committee)
    setShowCommitteeModal(true)
  }

  const handleSaveCommittee = async () => {
    if (!currentUser) {
      alert("You must be logged in to save committees.")
      return
    }

    try {
      const committeeWithUser = {
        ...newCommittee,
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
      }

      if (editingCommittee) {
        const committeeRef = doc(db, "committees", editingCommittee.id)
        await updateDoc(committeeRef, committeeWithUser)
        setCommittees((prev) =>
          prev.map((c) => (c.id === editingCommittee.id ? { ...committeeWithUser, id: editingCommittee.id } : c)),
        )
      } else {
        const docRef = await addDoc(collection(db, "committees"), committeeWithUser)
        setCommittees((prev) => [...prev, { ...committeeWithUser, id: docRef.id }])
      }

      setShowCommitteeModal(false)
      setNewCommittee({ name: "", position: "", date: "", committees: [] })
    } catch (error) {
      console.error("Error saving committee:", error)
      alert("Error saving committee. Please try again.")
    }
  }

  const handleDeleteCommittee = async (committeeId) => {
    if (window.confirm("Are you sure you want to delete this committee?")) {
      try {
        await deleteDoc(doc(db, "committees", committeeId))
        setCommittees((prev) => prev.filter((c) => c.id !== committeeId))
      } catch (error) {
        console.error("Error deleting committee:", error)
        alert("Error deleting committee. Please try again.")
      }
    }
  }

  const handleBulkPolicyRedirect = () => {
    window.location.href = "/growth/shop?tab=compliance"
  }

  const handleBuyGovernanceRedirect = () => {
    window.location.href = "/growth/shop?tab=governance"
  }

  const handleFileUpload = async (e, policyId = null) => {
    const file = e.target.files[0]
    if (!file) return

    // In a real implementation, you would upload to Firebase Storage
    // For now, we'll simulate the upload
    try {
      // Simulate file upload
      const fileData = {
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      }

      if (policyId) {
        // Update specific policy
        const policyRef = doc(db, "policyProcedures", policyId)
        await updateDoc(policyRef, {
          fileAttached: true,
          fileData: fileData,
        })

        setPolicies((prev) =>
          prev.map((p) => (p.id === policyId ? { ...p, fileAttached: true, fileData: fileData } : p)),
        )
      } else {
        // Store for new policy
        setUploadedFiles((prev) => ({
          ...prev,
          temp: fileData,
        }))
      }

      alert(`File "${file.name}" uploaded successfully!`)
    } catch (error) {
      console.error("Error uploading file:", error)
      alert("Error uploading file. Please try again.")
    }
  }

  const handleSavePolicyProcedure = async () => {
    if (!currentUser) {
      alert("You must be logged in to save policies/procedures.")
      return
    }

    try {
      const policyProcedureWithUser = {
        ...newPolicyProcedure,
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
        // Include fileData if it exists from a temporary upload
        ...(uploadedFiles.temp && { fileData: uploadedFiles.temp }),
      }

      if (editingPolicyProcedure) {
        const docRef = doc(db, "policyProcedures", editingPolicyProcedure.id)
        await updateDoc(docRef, policyProcedureWithUser)
        setPolicies((prev) =>
          prev.map((p) =>
            p.id === editingPolicyProcedure.id ? { ...policyProcedureWithUser, id: editingPolicyProcedure.id } : p,
          ),
        )
      } else {
        const docRef = await addDoc(collection(db, "policyProcedures"), policyProcedureWithUser)
        setPolicies((prev) => [...prev, { ...policyProcedureWithUser, id: docRef.id }])
      }

      // Clear temporary uploaded file info
      setUploadedFiles((prev) => ({ ...prev, temp: null }))
      setShowPolicyProcedureModal(false)
      setNewPolicyProcedure({ name: "", type: "policy", status: "", date: "", fileAttached: false, fileData: null })
    } catch (error) {
      console.error("Error saving policy/procedure:", error)
      alert("Error saving policy/procedure. Please try again.")
    }
  }

  const handleDeletePolicyProcedure = async (policyId) => {
    if (window.confirm("Are you sure you want to delete this policy/procedure?")) {
      try {
        await deleteDoc(doc(db, "policyProcedures", policyId))
        setPolicies((prev) => prev.filter((p) => p.id !== policyId))
      } catch (error) {
        console.error("Error deleting policy/procedure:", error)
        alert("Error deleting policy/procedure. Please try again.")
      }
    }
  }

  const handleEditPolicyProcedure = (policy) => {
    setEditingPolicyProcedure(policy)
    setNewPolicyProcedure(policy)
    setShowPolicyProcedureModal(true)
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
      <h3 style={{ color: "#4a352f", marginBottom: "20px" }}>Board Activity & Governance</h3>

      {/* Governance Score Display */}
      <div
        style={{
          backgroundColor: hasMinimumGovernanceScore ? "#d4edda" : "#fff3cd",
          border: `1px solid ${hasMinimumGovernanceScore ? "#c3e6cb" : "#ffeaa7"}`,
          padding: "15px",
          borderRadius: "6px",
          marginBottom: "20px",
        }}
      >
        <p style={{ color: "#4a352f", margin: 0, fontWeight: "500" }}>
          Current Governance Score: {Math.round((pisScore / 350) * 100)}% ({pisScore} / 350 points)
        </p>
        {!hasMinimumGovernanceScore && (
          <p style={{ color: "#856404", margin: "10px 0 0 0", fontSize: "14px" }}>
            You need at least 75% (262.5 points) to access board director features. You can purchase governance support
            under Tools and Tablets.
          </p>
        )}
      </div>

      {/* Board Directors Question - Only show if user hasn't answered yet */}
      {showBoardQuestion && (
        <div
          style={{
            backgroundColor: "#fdfcfb",
            padding: "30px",
            borderRadius: "6px",
            textAlign: "center",
            border: "2px solid #e6d7c3",
          }}
        >
          <h4 style={{ color: "#4a352f", marginBottom: "20px" }}>Do you have Board of Directors?</h4>
          <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
            <button
              onClick={() => handleBoardDirectorsResponse(true)}
              style={{
                padding: "12px 30px",
                backgroundColor: "#7d5a50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "16px",
              }}
            >
              Yes
            </button>
            <button
              onClick={() => handleBoardDirectorsResponse(false)}
              style={{
                padding: "12px 30px",
                backgroundColor: "#e6d7c3",
                color: "#4a352f",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "16px",
              }}
            >
              No
            </button>
          </div>
        </div>
      )}

      {/* Show Board Directors if user answered "Yes" */}
      {!showBoardQuestion && hasBoardDirectors && (
        <>
          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "20px",
              borderRadius: "6px",
              marginBottom: "20px",
              border: "2px solid #e6d7c3",
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
              <h4 style={{ color: "#4a352f", margin: 0 }}>Board of Directors</h4>
              <button
                onClick={handleAddDirector}
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
                Add Director
              </button>
            </div>

            {directors.length > 0 ? (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  color: "#4a352f",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "2px solid #c8b6a6" }}>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Name</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Position</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Date Appointed</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Committees</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {directors.map((director) => (
                    <tr key={director.id} style={{ borderBottom: "1px solid #e6d7c3" }}>
                      <td style={{ padding: "12px" }}>{director.name}</td>
                      <td style={{ padding: "12px" }}>{director.position}</td>
                      <td style={{ padding: "12px" }}>{director.date}</td>
                      <td style={{ padding: "12px" }}>
                        {director.committees && director.committees.length > 0 ? director.committees.join(", ") : "-"}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", gap: "5px" }}>
                          <button
                            onClick={() => handleEditDirector(director)}
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
                            onClick={() => handleDeleteDirector(director.id)}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "#7d5a50" }}>
                No directors added yet. Click "Add Director" to get started.
              </div>
            )}
          </div>

          {/* Meetings Section for users with Board of Directors */}
          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "20px",
              borderRadius: "6px",
              marginBottom: "20px",
              border: "2px solid #e6d7c3",
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
              <h4 style={{ color: "#4a352f", margin: 0 }}>Meetings Held</h4>
              <button
                onClick={handleAddMeeting}
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
                Add Meeting
              </button>
            </div>

            {meetings.length > 0 ? (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  color: "#4a352f",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "2px solid #c8b6a6" }}>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Date</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Type</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Attendance</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Minutes</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {meetings.map((meeting) => (
                    <tr key={meeting.id} style={{ borderBottom: "1px solid #e6d7c3" }}>
                      <td style={{ padding: "12px" }}>{meeting.date}</td>
                      <td style={{ padding: "12px" }}>{meeting.type}</td>
                      <td style={{ padding: "12px" }}>
                        {meeting.attendees}/{meeting.totalMembers}
                      </td>
                      <td style={{ padding: "12px", maxWidth: "200px", wordWrap: "break-word" }}>{meeting.minutes}</td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", gap: "5px" }}>
                          <button
                            onClick={() => handleEditMeeting(meeting)}
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
                            onClick={() => handleDeleteMeeting(meeting.id)}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "#7d5a50" }}>
                No meetings added yet. Click "Add Meeting" to get started.
              </div>
            )}
          </div>
        </>
      )}

      {/* Show message if user answered "No" AND has high enough score */}
      {!showBoardQuestion && !hasBoardDirectors && hasFullBoardScore && (
        <div
          style={{
            backgroundColor: "#fff3cd",
            border: "1px solid #ffeaa7",
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          <h3 style={{ color: "#856404", marginTop: 0, marginBottom: "15px" }}>
            Consider Establishing a Board of Directors
          </h3>
          <p style={{ color: "#856404", marginBottom: "15px" }}>
            With your current governance score of {pisScore} points, your business would benefit from establishing a
            formal Board of Directors. A board can provide strategic guidance, improve governance, and enhance
            credibility with investors and stakeholders.
          </p>
          <button
            onClick={handleBuyGovernanceRedirect}
            style={{
              padding: "10px 20px",
              backgroundColor: "#856404",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            Learn About Board Setup
          </button>
        </div>
      )}

      {/* Show message if user answered "No" but doesn't have high enough score */}
      {!showBoardQuestion && !hasBoardDirectors && !hasFullBoardScore && (
        <div
          style={{
            backgroundColor: "#f8f9fa",
            border: "1px solid #e9ecef",
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#6c757d", margin: 0 }}>
            You indicated you don't have a Board of Directors. Focus on improving your governance score to {350} points
            to unlock recommendations for establishing a formal board structure.
          </p>
        </div>
      )}

      {/* Policies & Procedures Section (always visible regardless of board status) */}
      <div
        style={{
          backgroundColor: "#fdfcfb",
          padding: "20px",
          borderRadius: "6px",
          border: "2px solid #e6d7c3",
          marginBottom: "20px",
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
          <h4 style={{ color: "#4a352f", margin: 0 }}>Policies & Procedures</h4>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => {
                setEditingPolicyProcedure(null)
                setNewPolicyProcedure({
                  name: "",
                  type: "policy",
                  status: "",
                  date: "",
                  fileAttached: false,
                  fileData: null,
                })
                setShowPolicyProcedureModal(true)
              }}
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
              Add Policy/Procedure
            </button>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              style={{ display: "none" }}
              id="file-upload-general"
              onChange={(e) => handleFileUpload(e)}
            />
            <button
              onClick={() => document.getElementById("file-upload-general").click()}
              style={{
                padding: "8px 16px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "12px",
              }}
            >
              Attach File
            </button>
            <button
              onClick={handleBulkPolicyRedirect}
              style={{
                padding: "8px 16px",
                backgroundColor: "#a67c52",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "12px",
              }}
            >
              Buy Policy
            </button>
          </div>
        </div>
        <div
          style={{
            backgroundColor: "#f5f0e1",
            padding: "15px",
            borderRadius: "6px",
            minHeight: "200px",
          }}
        >
          {policies.length > 0 ? (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                color: "#4a352f",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "2px solid #c8b6a6" }}>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Name</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Type</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Status</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Date</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Attach Policy/Procedure</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #e6d7c3" }}>
                    <td style={{ padding: "12px" }}>{item.name}</td>
                    <td style={{ padding: "12px", textTransform: "capitalize" }}>{item.type}</td>
                    <td style={{ padding: "12px" }}>{item.status}</td>
                    <td style={{ padding: "12px" }}>{item.date}</td>
                    <td style={{ padding: "12px" }}>
                      {item.fileAttached ? (
                        <span style={{ color: "#4CAF50", fontWeight: "500" }}>
                          ✓ {item.fileData?.name || "Attached"}
                        </span>
                      ) : (
                        <>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            style={{ display: "none" }}
                            id={`file-upload-${item.id}`}
                            onChange={(e) => handleFileUpload(e, item.id)}
                          />
                          <button
                            onClick={() => document.getElementById(`file-upload-${item.id}`).click()}
                            style={{
                              padding: "4px 8px",
                              backgroundColor: "#2196F3",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "10px",
                            }}
                          >
                            Attach File
                          </button>
                        </>
                      )}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", gap: "5px" }}>
                        <button
                          onClick={() => handleEditPolicyProcedure(item)}
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
                          onClick={() => handleDeletePolicyProcedure(item.id)}
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
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "#7d5a50" }}>
              No policies or procedures added yet. Click "Add Policy/Procedure" to get started.
            </div>
          )}
        </div>
      </div>

      {/* Meeting Modal */}
      {showMeetingModal && (
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
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              width: "500px",
              maxWidth: "90vw",
            }}
          >
            <h3 style={{ color: "#4a352f", marginTop: 0, marginBottom: "20px" }}>
              {editingMeeting ? "Edit Board Meeting" : "Add New Board Meeting"}
            </h3>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#4a352f", fontWeight: "500" }}>
                Date:
              </label>
              <input
                type="date"
                value={newMeeting.date}
                onChange={(e) => setNewMeeting((prev) => ({ ...prev, date: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e6d7c3",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#4a352f", fontWeight: "500" }}>
                Meeting Type:
              </label>
              <input
                type="text"
                value={newMeeting.type}
                onChange={(e) => setNewMeeting((prev) => ({ ...prev, type: e.target.value }))}
                placeholder="e.g., Board Meeting, Committee Meeting"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e6d7c3",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", color: "#4a352f", fontWeight: "500" }}>
                  Attendees:
                </label>
                <input
                  type="number"
                  value={newMeeting.attendees}
                  onChange={(e) => setNewMeeting((prev) => ({ ...prev, attendees: e.target.value }))}
                  placeholder="Number of attendees"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e6d7c3",
                    borderRadius: "4px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", color: "#4a352f", fontWeight: "500" }}>
                  Total Members:
                </label>
                <input
                  type="number"
                  value={newMeeting.totalMembers}
                  onChange={(e) => setNewMeeting((prev) => ({ ...prev, totalMembers: e.target.value }))}
                  placeholder="Total board members"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e6d7c3",
                    borderRadius: "4px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#4a352f", fontWeight: "500" }}>
                Minutes/Notes:
              </label>
              <textarea
                value={newMeeting.minutes}
                onChange={(e) => setNewMeeting((prev) => ({ ...prev, minutes: e.target.value }))}
                placeholder="Meeting minutes or notes"
                rows="4"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e6d7c3",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowMeetingModal(false)}
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
                onClick={handleSaveMeeting}
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
                {editingMeeting ? "Update Meeting" : "Add Meeting"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Director Modal */}
      {showDirectorModal && (
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
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              width: "500px",
              maxWidth: "90vw",
            }}
          >
            <h3 style={{ color: "#4a352f", marginTop: 0, marginBottom: "20px" }}>
              {editingDirector ? "Edit Board Director" : "Add New Board Director"}
            </h3>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#4a352f", fontWeight: "500" }}>
                Name:
              </label>
              <input
                type="text"
                value={newDirector.name}
                onChange={(e) => setNewDirector((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Director's Name"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e6d7c3",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#4a352f", fontWeight: "500" }}>
                Position:
              </label>
              <input
                type="text"
                value={newDirector.position}
                onChange={(e) => setNewDirector((prev) => ({ ...prev, position: e.target.value }))}
                placeholder="Director's Position"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e6d7c3",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#4a352f", fontWeight: "500" }}>
                Date Appointed:
              </label>
              <input
                type="date"
                value={newDirector.date}
                onChange={(e) => setNewDirector((prev) => ({ ...prev, date: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e6d7c3",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#4a352f", fontWeight: "500" }}>
                Committees:
              </label>
              <select
                multiple
                value={newDirector.committees}
                onChange={(e) => {
                  const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value)
                  setNewDirector((prev) => ({ ...prev, committees: selectedOptions }))
                }}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e6d7c3",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  minHeight: "100px",
                }}
              >
                {committees.map((committee) => (
                  <option key={committee.id} value={committee.name}>
                    {committee.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowDirectorModal(false)}
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
                onClick={handleSaveDirector}
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
                {editingDirector ? "Update Director" : "Add Director"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Policy/Procedure Modal */}
      {showPolicyProcedureModal && (
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
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              width: "500px",
              maxWidth: "90vw",
            }}
          >
            <h3 style={{ color: "#4a352f", marginTop: 0, marginBottom: "20px" }}>
              {editingPolicyProcedure ? "Edit Policy/Procedure" : "Add Policy/Procedure"}
            </h3>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#4a352f", fontWeight: "500" }}>
                Name:
              </label>
              <input
                type="text"
                value={newPolicyProcedure.name}
                onChange={(e) => setNewPolicyProcedure((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter name"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e6d7c3",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", color: "#4a352f", fontWeight: "500" }}>
                  Type:
                </label>
                <select
                  value={newPolicyProcedure.type}
                  onChange={(e) => setNewPolicyProcedure((prev) => ({ ...prev, type: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e6d7c3",
                    borderRadius: "4px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="policy">Policy</option>
                  <option value="procedure">Procedure</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", color: "#4a352f", fontWeight: "500" }}>
                  Status:
                </label>
                <select
                  value={newPolicyProcedure.status}
                  onChange={(e) => setNewPolicyProcedure((prev) => ({ ...prev, status: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e6d7c3",
                    borderRadius: "4px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Select Status</option>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="under review">Under Review</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", color: "#4a352f", fontWeight: "500" }}>
                  Date:
                </label>
                <input
                  type="date"
                  value={newPolicyProcedure.date}
                  onChange={(e) => setNewPolicyProcedure((prev) => ({ ...prev, date: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e6d7c3",
                    borderRadius: "4px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", color: "#4a352f", fontWeight: "500" }}>
                  File Attached:
                </label>
                <select
                  value={newPolicyProcedure.fileAttached}
                  onChange={(e) =>
                    setNewPolicyProcedure((prev) => ({ ...prev, fileAttached: e.target.value === "true" }))
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e6d7c3",
                    borderRadius: "4px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowPolicyProcedureModal(false)}
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
                onClick={handleSavePolicyProcedure}
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
                {editingPolicyProcedure ? "Update Policy/Procedure" : "Add Policy/Procedure"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Main Strategy Component
const Strategy = () => {
  const [activeSection, setActiveSection] = useState("vision-mission-values")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [milestoneData, setMilestoneData] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [pisScore, setPisScore] = useState(0)
  const [milestoneFilterStage, setMilestoneFilterStage] = useState(null)
  const [isLoadingPisScore, setIsLoadingPisScore] = useState(true)

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
        // In investor view, we don't use the logged-in user
        // We'll create a pseudo-user object with the SME's ID
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

  useEffect(() => {
    const userIdToFetch = isInvestorView && viewingSMEId ? viewingSMEId : currentUser?.uid

    if (!userIdToFetch) {
      setPisScore(0)
      setIsLoadingPisScore(false)
      return
    }

    setIsLoadingPisScore(true)
    console.log("Fetching PIS score for user ID:", userIdToFetch)

    const docRef = doc(db, "bigEvaluations", userIdToFetch)

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        try {
          if (docSnap.exists()) {
            const data = docSnap.data()
            console.log("PIS score document data:", data)

            if (data.scores && data.scores.pis !== undefined) {
              console.log("PIS score found:", data.scores.pis)
              setPisScore(data.scores.pis)
            } else {
              console.warn("No PIS score found in evaluation data")
              setPisScore(0)
            }
          } else {
            console.warn("No bigEvaluation document found for user ID:", userIdToFetch)
            setPisScore(0)
          }
        } catch (error) {
          console.error("Error processing PIS score data:", error)
          setPisScore(0)
        } finally {
          setIsLoadingPisScore(false)
        }
      },
      (error) => {
        console.error("Error in PIS score listener:", error)
        setPisScore(0)
        setIsLoadingPisScore(false)
      },
    )

    return () => unsubscribe()
  }, [currentUser, isInvestorView, viewingSMEId])

  const getGovernanceStage = (score) => {
    if (score < 100) return "Advisors"
    if (score < 350) return "Emerging Board"
    return "Full Board"
  }

  const getContentStyles = () => ({
    flex: 1,
    paddingLeft: isSidebarCollapsed ? "80px" : "250px",
    transition: "padding 0.3s ease",
    boxSizing: "border-box",
  })

  const handleNavigateToMilestone = (growthStage) => {
    setMilestoneFilterStage(growthStage)
    setActiveSection("milestone-tracking")
  }

  const handleExitInvestorView = () => {
    sessionStorage.removeItem("viewingSMEId")
    sessionStorage.removeItem("viewingSMEName")
    sessionStorage.removeItem("investorViewMode")
    window.location.href = "/my-cohorts"
  }

  const sectionButtons = [
    { id: "vision-mission-values", label: "Vision, Mission, Values" },
    { id: "strategic-goals", label: "Strategic Goals" },
    { id: "milestone-tracking", label: "Milestone Tracking" },
    { id: "business-risk", label: "Business Risk" },
    { id: "risk-management", label: "Risk Management" },
    { id: "governance", label: "Governance" },
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
                Investor View: Viewing {viewingSMEName}'s Strategy & Execution
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
                  backgroundColor: activeSection === button.id ? "#5d4037" : "#e8ddd4",
                  color: activeSection === button.id ? "#fdfcfb" : "#5d4037",
                  border: "none",
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

          {currentUser && (
            <div
              style={{
                backgroundColor: "#e8f5e8",
                border: "1px solid #4CAF50",
                padding: "10px",
                borderRadius: "6px",
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              {isLoadingPisScore ? (
                <p style={{ color: "#2e7d32", margin: 0, fontSize: "14px" }}>Loading PIS Score...</p>
              ) : (
                <p style={{ color: "#2e7d32", margin: 0, fontSize: "14px" }}>
                  Current PIS Score: {pisScore} | Governance Stage: {getGovernanceStage(pisScore)}
                </p>
              )}
            </div>
          )}

          <VisionMissionValues activeSection={activeSection} currentUser={currentUser} />
          <StrategicGoals
            activeSection={activeSection}
            milestoneData={milestoneData}
            onNavigateToMilestone={handleNavigateToMilestone}
          />
          <MilestoneTracking
            activeSection={activeSection}
            milestoneData={milestoneData}
            setMilestoneData={setMilestoneData}
            currentUser={currentUser}
            filterStage={milestoneFilterStage}
          />
          <BusinessRiskTab activeSection={activeSection} currentUser={currentUser} />
          <RiskManagement activeSection={activeSection} currentUser={currentUser} />
          <BoardActivityGovernance activeSection={activeSection} currentUser={currentUser} pisScore={pisScore} />
        </div>
      </div>
    </div>
  )
}

const BusinessRiskTab = ({ activeSection, currentUser }) => {
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
      if (!currentUser || activeSection !== "business-risk") return

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

  if (activeSection !== "business-risk") return null

  // Aggregate all risk data for the matrix
  const allRisks = []
  const categoryColors = {
    financial: "#e74c3c",
    operational: "#3498db",
    "legal-compliance": "#9b59b6",
    insurance: "#f39c12",
    people: "#1abc9c",
    "disaster-recovery": "#e67e22",
    "stakeholder-management": "#2ecc71",
  }

  Object.keys(riskData).forEach((category) => {
    riskData[category].forEach((risk) => {
      if (risk.risk && risk.likelihood && risk.severity) {
        allRisks.push({
          ...risk,
          category,
          color: categoryColors[category] || "#9E9E9E",
        })
      }
    })
  })

  const createRiskMatrixData = () => {
    return {
      datasets: allRisks.map((risk, index) => ({
        label: risk.risk,
        data: [
          {
            x: risk.likelihood,
            y: risk.severity,
            riskId: risk.risk,
            description: risk.description,
            category: risk.category,
          },
        ],
        backgroundColor: risk.color,
        borderColor: "#7d5a50",
        borderWidth: 2,
        pointRadius: 15,
        pointHoverRadius: 18,
      })),
    }
  }

  const matrixOptions = {
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
            const dataPoint = context.dataset.data[0]
            return [
              `Likelihood: ${point.x}`,
              `Severity: ${point.y}`,
              `Description: ${dataPoint.description || "No description"}`,
            ]
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
      <h3 style={{ color: "#4a352f", marginTop: 0 }}>Business Risk Overview</h3>

      <div
        style={{
          height: "500px",
          marginBottom: "30px",
          backgroundColor: "#fdfcfb",
          padding: "20px",
          borderRadius: "6px",
          border: "2px solid #a67c52",
        }}
      >
        <h4 style={{ color: "#4a352f", marginTop: 0, marginBottom: "15px" }}>Risk Matrix</h4>
        {allRisks.length > 0 ? (
          <Scatter data={createRiskMatrixData()} options={matrixOptions} />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "400px",
              color: "#7d5a50",
              fontSize: "16px",
            }}
          >
            No risk data available. Add risks in the Risk Management section to see them here.
          </div>
        )}
      </div>

      {/* Risk Category Legend */}
      <div
        style={{
          backgroundColor: "#fdfcfb",
          padding: "20px",
          borderRadius: "6px",
          marginBottom: "20px",
          border: "2px solid #a67c52",
        }}
      >
        <h4 style={{ color: "#4a352f", margin: "0 0 15px 0" }}>Risk Categories</h4>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "10px",
          }}
        >
          {Object.entries(categoryColors).map(([category, color]) => (
            <div
              key={category}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px",
                backgroundColor: "#fdfcfb",
                borderRadius: "4px",
                border: "1px solid #e6d7c3",
              }}
            >
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  backgroundColor: color,
                  borderRadius: "50%",
                  border: "2px solid #4a352f",
                }}
              ></div>
              <span
                style={{
                  color: "#4a352f",
                  fontWeight: "500",
                  textTransform: "capitalize",
                }}
              >
                {category.replace("-", " & ")}
              </span>
              <span
                style={{
                  color: "#7d5a50",
                  fontSize: "12px",
                  marginLeft: "auto",
                }}
              >
                ({riskData[category]?.length || 0} risks)
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          backgroundColor: "#fff3cd",
          border: "1px solid #ffeaa7",
          padding: "15px",
          borderRadius: "6px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#856404", margin: 0 }}>
          To add or edit risk data, please go to the Risk Management section.
        </p>
      </div>
    </div>
  )
}

export default Strategy
