"use client"

import { useState, useEffect } from "react"
import { Bar, Line } from "react-chartjs-2"
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, deleteDoc } from "firebase/firestore"
import { db, auth } from "../../firebaseConfig"
import { onAuthStateChanged } from "firebase/auth"
import Sidebar from "smses/Sidebar/Sidebar"
import Header from "../DashboardHeader/DashboardHeader"
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

// Create KPI Modal Component
const CreateKPIModal = ({ isOpen, onClose, onKPICreated, userId }) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    description: "",
    targetValue: "",
    assignedTo: "",
    decimals: 0,
  })
  
  const [chartOptions, setChartOptions] = useState({
    chartType: "bar",
    barColor: "#a67c52",
    targetLineColor: "#808080",
    showEmptyIntervals: true,
    showChartFromZero: true,
  })
  
  const [step, setStep] = useState(1) // 1 for KPI details, 2 for chart options

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      description: "",
      targetValue: "",
      assignedTo: "",
      decimals: 0,
    })
    setChartOptions({
      chartType: "bar",
      barColor: "#a67c52",
      targetLineColor: "#808080",
      showEmptyIntervals: true,
      showChartFromZero: true,
    })
    setStep(1)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleChartOptionChange = (field, value) => {
    setChartOptions(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (!formData.name || !formData.type) {
      alert("Please fill in Name and Type fields")
      return
    }
    setStep(2)
  }

  const handleSave = async () => {
    if (!userId) {
      alert("User not authenticated")
      return
    }

    try {
      const kpiData = {
        ...formData,
        ...chartOptions,
        targetValue: parseFloat(formData.targetValue) || 0,
        createdAt: new Date().toISOString(),
        dataPoints: [], // Initialize empty data points array
        userId: userId, // Add userId to KPI data
      }

      await addDoc(collection(db, "kpis"), kpiData)
      alert("KPI created successfully!")
      resetForm()
      onClose()
      if (onKPICreated) onKPICreated()
    } catch (error) {
      console.error("Error creating KPI:", error)
      alert("Error creating KPI")
    }
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
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "#fdfcfb",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {step === 1 ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#4a352f", margin: 0 }}>Create KPI</h3>
              <button
                onClick={() => { resetForm(); onClose(); }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#4a352f",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", color: "#7d5a50", marginBottom: "5px", fontWeight: "600" }}>
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Name of the KPI"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", color: "#7d5a50", marginBottom: "5px", fontWeight: "600" }}>
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange("type", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              >
                <option value="">Select</option>
                <option value="revenue">Revenue</option>
                <option value="sales">Sales</option>
                <option value="productivity">Productivity</option>
                <option value="efficiency">Efficiency</option>
                <option value="quality">Quality</option>
                <option value="customer">Customer</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", color: "#7d5a50", marginBottom: "5px", fontWeight: "600" }}>
                Number of Decimals
              </label>
              <select
                value={formData.decimals}
                onChange={(e) => handleInputChange("decimals", parseInt(e.target.value))}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              >
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", color: "#7d5a50", marginBottom: "5px", fontWeight: "600" }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe this KPI"
                rows="3"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "6px",
                  fontSize: "14px",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", color: "#7d5a50", marginBottom: "5px", fontWeight: "600" }}>
                Target Value
              </label>
              <input
                type="number"
                value={formData.targetValue}
                onChange={(e) => handleInputChange("targetValue", e.target.value)}
                placeholder="0"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", color: "#7d5a50", marginBottom: "5px", fontWeight: "600" }}>
                Assigned To
              </label>
              <input
                type="email"
                value={formData.assignedTo}
                onChange={(e) => handleInputChange("assignedTo", e.target.value)}
                placeholder="Email address"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>

            <button
              onClick={handleNext}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "#4a352f",
                color: "#faf7f2",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "16px",
              }}
            >
              Next
            </button>
          </>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#4a352f", margin: 0 }}>Chart Options</h3>
              <button
                onClick={() => { resetForm(); onClose(); }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#4a352f",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", color: "#7d5a50", marginBottom: "5px", fontWeight: "600" }}>
                Chart Type
              </label>
              <select
                value={chartOptions.chartType}
                onChange={(e) => handleChartOptionChange("chartType", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="area">Area Chart</option>
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", color: "#7d5a50", marginBottom: "10px", fontWeight: "600" }}>
                Customize Chart
              </label>
              
              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", color: "#72542b", marginBottom: "5px", fontSize: "14px" }}>
                  Bar color
                </label>
                <input
                  type="color"
                  value={chartOptions.barColor}
                  onChange={(e) => handleChartOptionChange("barColor", e.target.value)}
                  style={{
                    width: "60px",
                    height: "35px",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                />
              </div>

              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", color: "#72542b", marginBottom: "5px", fontSize: "14px" }}>
                  Target Line Color
                </label>
                <input
                  type="color"
                  value={chartOptions.targetLineColor}
                  onChange={(e) => handleChartOptionChange("targetLineColor", e.target.value)}
                  style={{
                    width: "60px",
                    height: "35px",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "flex", alignItems: "center", cursor: "pointer", marginBottom: "8px" }}>
                <input
                  type="checkbox"
                  checked={chartOptions.showEmptyIntervals}
                  onChange={(e) => handleChartOptionChange("showEmptyIntervals", e.target.checked)}
                  style={{ marginRight: "8px" }}
                />
                <span style={{ color: "#72542b", fontSize: "14px" }}>Show empty intervals</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={chartOptions.showChartFromZero}
                  onChange={(e) => handleChartOptionChange("showChartFromZero", e.target.checked)}
                  style={{ marginRight: "8px" }}
                />
                <span style={{ color: "#72542b", fontSize: "14px" }}>Show Chart Starting from Zero</span>
              </label>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#e8ddd4",
                  color: "#4a352f",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "16px",
                }}
              >
                Back
              </button>
              <button
                onClick={handleSave}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#4a352f",
                  color: "#faf7f2",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "16px",
                }}
              >
                Save
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Add Data Modal Component
const AddDataModal = ({ isOpen, onClose, kpiId, kpiName, onDataAdded }) => {
  const [monthYear, setMonthYear] = useState("")
  const [value, setValue] = useState("")
  const [comment, setComment] = useState("")

  const resetForm = () => {
    setMonthYear("")
    setValue("")
    setComment("")
  }

  const handleAdd = async () => {
    if (!monthYear || !value) {
      alert("Please fill in Month/Year and Value")
      return
    }

    try {
      // Get the KPI document
      const kpiQuery = query(collection(db, "kpis"), where("__name__", "==", kpiId))
      const kpiSnapshot = await getDocs(kpiQuery)
      
      if (!kpiSnapshot.empty) {
        const kpiDoc = kpiSnapshot.docs[0]
        const kpiData = kpiDoc.data()
        const dataPoints = kpiData.dataPoints || []
        
        // Add new data point
        dataPoints.push({
          monthYear,
          value: parseFloat(value),
          comment,
          addedAt: new Date().toISOString(),
        })

        // Update the KPI document
        await setDoc(doc(db, "kpis", kpiDoc.id), {
          ...kpiData,
          dataPoints,
        })

        alert("Data added successfully!")
        resetForm()
        onClose()
        if (onDataAdded) onDataAdded()
      }
    } catch (error) {
      console.error("Error adding data:", error)
      alert("Error adding data")
    }
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
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "#fdfcfb",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          maxWidth: "500px",
          width: "90%",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ color: "#4a352f", margin: 0 }}>Add Data</h3>
          <button
            onClick={() => { resetForm(); onClose(); }}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#4a352f",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", color: "#7d5a50", marginBottom: "5px", fontWeight: "600" }}>
            Month and year *
          </label>
          <input
            type="month"
            value={monthYear}
            onChange={(e) => setMonthYear(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #d4c4b0",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", color: "#7d5a50", marginBottom: "5px", fontWeight: "600" }}>
            {kpiName}
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Zar"
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #d4c4b0",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          />
          <small style={{ color: "#999", fontSize: "12px" }}>
            * You may use a period or comma as decimal separator
          </small>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", color: "#7d5a50", marginBottom: "5px", fontWeight: "600" }}>
            Comment
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows="3"
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #d4c4b0",
              borderRadius: "6px",
              fontSize: "14px",
              resize: "vertical",
            }}
          />
        </div>

        <button
          onClick={handleAdd}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#4a352f",
            color: "#faf7f2",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "16px",
          }}
        >
          Add
        </button>
      </div>
    </div>
  )
}

// Updated KPI Dashboard Component with chart rendering
const KPIDashboard = ({ activeSection, isInvestorView, viewingSMEId }) => {
  const [kpis, setKpis] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddDataModal, setShowAddDataModal] = useState(false)
  const [selectedKPI, setSelectedKPI] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user)
        // If in investor view, load SME's data, otherwise load own data
        const userIdToLoad = isInvestorView && viewingSMEId ? viewingSMEId : user.uid
        loadKPIs(userIdToLoad)
      } else {
        setCurrentUser(null)
        setKpis([])
      }
    })

    return () => unsubscribe()
  }, [isInvestorView, viewingSMEId])

  const loadKPIs = async (userId) => {
    try {
      const q = query(collection(db, "kpis"), where("userId", "==", userId))
      const kpisSnapshot = await getDocs(q)
      const kpisData = kpisSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setKpis(kpisData)
    } catch (error) {
      console.error("Error loading KPIs:", error)
    }
  }

  const handleAddData = (kpi) => {
    if (isInvestorView) {
      alert("You are in investor view mode. You cannot edit SME data.")
      return
    }
    setSelectedKPI(kpi)
    setShowAddDataModal(true)
  }

  const handleDeleteKPI = async (kpiId) => {
    if (isInvestorView) {
      alert("You are in investor view mode. You cannot edit SME data.")
      return
    }

    if (window.confirm("Are you sure you want to delete this KPI?")) {
      try {
        await deleteDoc(doc(db, "kpis", kpiId))
        alert("KPI deleted successfully!")
        if (currentUser) {
          loadKPIs(currentUser.uid)
        }
      } catch (error) {
        console.error("Error deleting KPI:", error)
        alert("Error deleting KPI")
      }
    }
  }

  const handleKPICreated = () => {
    if (currentUser) {
      loadKPIs(currentUser.uid)
    }
  }

  const handleDataAdded = () => {
    if (currentUser) {
      loadKPIs(currentUser.uid)
    }
  }

  const renderChart = (kpi) => {
    if (!kpi.dataPoints || kpi.dataPoints.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "40px", color: "#72542b" }}>
          <p>No data found</p>
        </div>
      )
    }

    const labels = kpi.dataPoints.map(dp => {
      const date = new Date(dp.monthYear + "-01")
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    })
    const values = kpi.dataPoints.map(dp => dp.value)

    const chartData = {
      labels,
      datasets: [
        {
          label: kpi.name,
          data: values,
          backgroundColor: kpi.chartType === "area" 
            ? `${kpi.barColor || "#a67c52"}40` // 40 is 25% opacity in hex
            : kpi.barColor || "#a67c52",
          borderColor: kpi.barColor || "#a67c52",
          borderWidth: 2,
          fill: kpi.chartType === "area" ? true : false,
          tension: kpi.chartType === "area" ? 0.4 : 0.1,
        },
      ],
    }

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
        tooltip: {
          enabled: true,
        },
      },
      scales: {
        y: {
          beginAtZero: kpi.showChartFromZero !== false,
        },
      },
    }

    return (
      <div style={{ height: "300px", marginTop: "20px", position: "relative" }}>
        {kpi.chartType === "line" && <Line data={chartData} options={options} />}
        {kpi.chartType === "bar" && <Bar data={chartData} options={options} />}
        {kpi.chartType === "area" && <Line data={chartData} options={options} />}
      </div>
    )
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
        <h2 style={{ color: "#4a352f", marginTop: 0 }}>KPI Dashboard</h2>
        {!isInvestorView && (
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: "10px 20px",
              backgroundColor: "#4a352f",
              color: "#faf7f2",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
            }}
          >
            + Create KPI
          </button>
        )}
      </div>

      <CreateKPIModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onKPICreated={handleKPICreated}
        userId={currentUser?.uid}
      />

      <AddDataModal
        isOpen={showAddDataModal}
        onClose={() => {
          setShowAddDataModal(false)
          setSelectedKPI(null)
        }}
        kpiId={selectedKPI?.id}
        kpiName={selectedKPI?.name}
        onDataAdded={handleDataAdded}
      />

      {kpis.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#72542b" }}>
          <p>No KPIs created yet. Click "Create KPI" to add your first KPI.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "20px" }}>
          {kpis.map((kpi) => (
            <div
              key={kpi.id}
              style={{
                backgroundColor: "#f5f0e1",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "15px" }}>
                <div>
                  <h3 style={{ color: "#4a352f", margin: "0 0 10px 0" }}>{kpi.name}</h3>
                  {kpi.description && (
                    <p style={{ color: "#7d5a50", margin: "0 0 10px 0", fontSize: "14px" }}>{kpi.description}</p>
                  )}
                  <div style={{ display: "flex", gap: "15px", fontSize: "14px", color: "#72542b" }}>
                    <span>Type: <strong>{kpi.type}</strong></span>
                    <span>Target: <strong>{kpi.targetValue}</strong></span>
                    {kpi.assignedTo && <span>Assigned: <strong>{kpi.assignedTo}</strong></span>}
                  </div>
                </div>
                {!isInvestorView && (
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => handleAddData(kpi)}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#4a352f",
                        color: "#faf7f2",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "600",
                      }}
                    >
                      + Add data
                    </button>
                    <button
                      onClick={() => handleDeleteKPI(kpi.id)}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#dc2626",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "13px",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {renderChart(kpi)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Productivity Measures Component
const ProductivityMeasures = ({ activeSection, isInvestorView }) => {
  const [productivityData, setProductivityData] = useState([0, 0, 0, 0, 0, 0])
  const [efficiencyData, setEfficiencyData] = useState([0, 0, 0, 0, 0, 0])
  const [showEditForm, setShowEditForm] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user)
        loadProductivityData(user.uid)
      } else {
        setCurrentUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  const saveProductivityData = async () => {
    if (isInvestorView) {
      alert("You are in investor view mode. You cannot edit SME data.")
      return
    }

    if (!currentUser) {
      alert("User not authenticated")
      return
    }

    try {
      await setDoc(doc(db, "productivity", currentUser.uid), {
        productivityData,
        efficiencyData,
        userId: currentUser.uid,
      })
      setShowEditForm(false)
      alert("Productivity data saved successfully!")
    } catch (error) {
      console.error("Error saving productivity data:", error)
      alert("Error saving data")
    }
  }

  const loadProductivityData = async (userId) => {
    try {
      const docRef = doc(db, "productivity", userId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        setProductivityData(data.productivityData || [0, 0, 0, 0, 0, 0])
        setEfficiencyData(data.efficiencyData || [0, 0, 0, 0, 0, 0])
      }
    } catch (error) {
      console.error("Error loading productivity data:", error)
    }
  }

  const updateProductivityValue = (index, value) => {
    const newData = [...productivityData]
    newData[index] = Number.parseFloat(value) || 0
    setProductivityData(newData)
  }

  const updateEfficiencyValue = (index, value) => {
    const newData = [...efficiencyData]
    newData[index] = Number.parseFloat(value) || 0
    setEfficiencyData(newData)
  }

  const handleDownload = () => {
    const csvContent = [
      ["Month", "Productivity Index", "Efficiency Ratio"],
      ...months.map((month, index) => [month, productivityData[index], efficiencyData[index]]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "productivity-measures.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (activeSection !== "productivity") return null

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#5d4037", marginTop: 0 }}>Productivity Measures</h2>
        {!isInvestorView && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleDownload}
              style={{
                padding: "8px 16px",
                backgroundColor: "#a67c52",
                color: "#faf7f2",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Download CSV
            </button>
            <button
              onClick={() => setShowEditForm(!showEditForm)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#4a352f",
                color: "#faf7f2",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {showEditForm ? "Cancel" : "Edit Data"}
            </button>
          </div>
        )}
      </div>

      {showEditForm && (
        <div
          style={{
            backgroundColor: "#f5f0e1",
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#7d5a50", marginTop: 0 }}>Edit Productivity Data</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <h4 style={{ color: "#7d5a50" }}>Productivity Index</h4>
              {months.map((month, index) => (
                <div key={month} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ minWidth: "40px", color: "#72542b" }}>{month}:</span>
                  <input
                    type="number"
                    value={productivityData[index]}
                    onChange={(e) => updateProductivityValue(index, e.target.value)}
                    style={{
                      padding: "6px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                      width: "80px",
                    }}
                  />
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ color: "#7d5a50" }}>Efficiency Ratio</h4>
              {months.map((month, index) => (
                <div key={month} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ minWidth: "40px", color: "#72542b" }}>{month}:</span>
                  <input
                    type="number"
                    value={efficiencyData[index]}
                    onChange={(e) => updateEfficiencyValue(index, e.target.value)}
                    style={{
                      padding: "6px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                      width: "80px",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={saveProductivityData}
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

      <div style={{ height: "400px" }}>
        <Line
          data={{
            labels: months,
            datasets: [
              {
                label: "Productivity Index",
                data: productivityData,
                borderColor: "#a67c52",
                backgroundColor: "rgba(166, 124, 82, 0.1)",
                borderWidth: 2,
                tension: 0.1,
                fill: true,
              },
              {
                label: "Efficiency Ratio",
                data: efficiencyData,
                borderColor: "#8b7355",
                backgroundColor: "rgba(139, 115, 85, 0.1)",
                borderWidth: 2,
                tension: 0.1,
                fill: true,
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
              title: {
                display: false,
              },
            },
          }}
        />
      </div>
    </div>
  )
}

// Unit Cost Component
const UnitCost = ({ activeSection, isInvestorView }) => {
  const [products, setProducts] = useState([])
  const [showEditForm, setShowEditForm] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user)
        loadUnitCostData(user.uid)
      } else {
        setCurrentUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  const saveUnitCostData = async () => {
    if (isInvestorView) {
      alert("You are in investor view mode. You cannot edit SME data.")
      return
    }

    if (!currentUser) {
      alert("User not authenticated")
      return
    }

    try {
      await setDoc(doc(db, "unit-cost", currentUser.uid), { 
        products,
        userId: currentUser.uid,
      })
      setShowEditForm(false)
      alert("Unit cost data saved successfully!")
    } catch (error) {
      console.error("Error saving unit cost data:", error)
      alert("Error saving data")
    }
  }

  const loadUnitCostData = async (userId) => {
    try {
      const docRef = doc(db, "unit-cost", userId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setProducts(docSnap.data().products || [])
      }
    } catch (error) {
      console.error("Error loading unit cost data:", error)
    }
  }

  const updateProduct = (index, field, value) => {
    const newProducts = [...products]
    newProducts[index][field] = field === "name" ? value : Number.parseFloat(value) || 0
    setProducts(newProducts)
  }

  const addProduct = () => {
    setProducts([...products, { name: "New Product", cost: 0, price: 0 }])
  }

  const removeProduct = (index) => {
    const newProducts = products.filter((_, i) => i !== index)
    setProducts(newProducts)
  }

  const handleDownload = () => {
    const csvContent = [
      ["Product Name", "Cost (R)", "Price (R)", "Margin %"],
      ...products.map((product) => [
        product.name,
        product.cost.toFixed(2),
        product.price.toFixed(2),
        product.price > 0 ? (((product.price - product.cost) / product.price) * 100).toFixed(1) : 0,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "unit-cost.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (activeSection !== "unit-cost") return null

  const productNames = products.map((p) => p.name)
  const costData = products.map((p) => p.cost)
  const priceData = products.map((p) => p.price)

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#5d4037", marginTop: 0 }}>Unit Cost per Output</h2>
        {!isInvestorView && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleDownload}
              style={{
                padding: "8px 16px",
                backgroundColor: "#a67c52",
                color: "#faf7f2",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Download CSV
            </button>
            <button
              onClick={() => setShowEditForm(!showEditForm)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#4a352f",
                color: "#faf7f2",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {showEditForm ? "Cancel" : "Edit Data"}
            </button>
          </div>
        )}
      </div>

      {showEditForm && (
        <div
          style={{
            backgroundColor: "#f5f0e1",
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#7d5a50", marginTop: 0 }}>Edit Product Data</h3>
          {products.map((product, index) => (
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
                value={product.name}
                onChange={(e) => updateProduct(index, "name", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Product Name"
              />
              <input
                type="number"
                value={product.cost}
                onChange={(e) => updateProduct(index, "cost", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Cost"
              />
              <input
                type="number"
                value={product.price}
                onChange={(e) => updateProduct(index, "price", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Price"
              />
              <button
                onClick={() => removeProduct(index)}
                style={{
                  padding: "8px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <div style={{ marginTop: "15px" }}>
            <button
              onClick={addProduct}
              style={{
                padding: "8px 16px",
                backgroundColor: "#72542b",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              Add Product
            </button>
            <button
              onClick={saveUnitCostData}
              style={{
                padding: "8px 16px",
                backgroundColor: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Save Data
            </button>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#72542b",
          }}
        >
          <p>No product data available. Click "Edit Data" to add your first product.</p>
        </div>
      ) : (
        <div style={{ height: "400px" }}>
          <Bar
            data={{
              labels: productNames,
              datasets: [
                {
                  label: "Production Cost",
                  data: costData,
                  backgroundColor: "#d4c4b0",
                  borderColor: "#5d4037",
                  borderWidth: 1,
                },
                {
                  label: "Selling Price",
                  data: priceData,
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
                title: {
                  display: false,
                },
              },
            }}
          />
        </div>
      )}
    </div>
  )
}

// Order Fulfillment Component
const OrderFulfillment = ({ activeSection, isInvestorView }) => {
  const [metrics, setMetrics] = useState([])
  const [showEditForm, setShowEditForm] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user)
        loadOrderFulfillmentData(user.uid)
      } else {
        setCurrentUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  const saveOrderFulfillmentData = async () => {
    if (isInvestorView) {
      alert("You are in investor view mode. You cannot edit SME data.")
      return
    }

    if (!currentUser) {
      alert("User not authenticated")
      return
    }

    try {
      await setDoc(doc(db, "order-fulfillment", currentUser.uid), { 
        metrics,
        userId: currentUser.uid,
      })
      setShowEditForm(false)
      alert("Order fulfillment data saved successfully!")
    } catch (error) {
      console.error("Error saving order fulfillment data:", error)
      alert("Error saving data")
    }
  }

  const loadOrderFulfillmentData = async (userId) => {
    try {
      const docRef = doc(db, "order-fulfillment", userId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setMetrics(docSnap.data().metrics || [])
      }
    } catch (error) {
      console.error("Error loading order fulfillment data:", error)
    }
  }

  const updateMetric = (index, field, value) => {
    const newMetrics = [...metrics]
    newMetrics[index][field] = field === "name" ? value : Number.parseFloat(value) || 0
    setMetrics(newMetrics)
  }

  const addMetric = () => {
    setMetrics([...metrics, { name: "New Metric", value: 0, target: 100 }])
  }

  const removeMetric = (index) => {
    const newMetrics = metrics.filter((_, i) => i !== index)
    setMetrics(newMetrics)
  }

  const handleDownload = () => {
    const csvContent = [
      ["Metric Name", "Current Value %", "Target Value %", "Performance %"],
      ...metrics.map((metric) => [
        metric.name,
        metric.value,
        metric.target,
        metric.target > 0 ? ((metric.value / metric.target) * 100).toFixed(1) : 0,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "order-fulfillment.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (activeSection !== "order-fulfillment") return null

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#5d4037", marginTop: 0 }}>Order Fulfillment & Delivery Metrics</h2>
        {!isInvestorView && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleDownload}
              style={{
                padding: "8px 16px",
                backgroundColor: "#a67c52",
                color: "#faf7f2",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Download CSV
            </button>
            <button
              onClick={() => setShowEditForm(!showEditForm)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#4a352f",
                color: "#faf7f2",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {showEditForm ? "Cancel" : "Edit Data"}
            </button>
          </div>
        )}
      </div>

      {showEditForm && (
        <div
          style={{
            backgroundColor: "#f5f0e1",
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#7d5a50", marginTop: 0 }}>Edit Metrics Data</h3>
          {metrics.map((metric, index) => (
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
                value={metric.name}
                onChange={(e) => updateMetric(index, "name", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Metric Name"
              />
              <input
                type="number"
                value={metric.value}
                onChange={(e) => updateMetric(index, "value", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Value"
              />
              <input
                type="number"
                value={metric.target}
                onChange={(e) => updateMetric(index, "target", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Target"
              />
              <button
                onClick={() => removeMetric(index)}
                style={{
                  padding: "8px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <div style={{ marginTop: "15px" }}>
            <button
              onClick={addMetric}
              style={{
                padding: "8px 16px",
                backgroundColor: "#72542b",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              Add Metric
            </button>
            <button
              onClick={saveOrderFulfillmentData}
              style={{
                padding: "8px 16px",
                backgroundColor: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Save Data
            </button>
          </div>
        </div>
      )}

      {metrics.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#72542b",
          }}
        >
          <p>No metrics data available. Click "Edit Data" to add your first metric.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
          }}
        >
          {metrics.map((metric, index) => (
            <div
              key={index}
              style={{
                padding: "15px",
                backgroundColor: "#f5f0e1",
                borderRadius: "6px",
                textAlign: "center",
              }}
            >
              <h3 style={{ color: "#7d5a50", marginTop: 0 }}>{metric.name}</h3>
              <div
                style={{
                  width: "120px",
                  height: "120px",
                  margin: "0 auto",
                  position: "relative",
                }}
              >
                <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
                  {/* Background circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#e8ddd4"
                    strokeWidth="12"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke={metric.value >= metric.target ? "#4CAF50" : "#FF9800"}
                    strokeWidth="12"
                    strokeDasharray={2 * Math.PI * 50}
                    strokeDashoffset={2 * Math.PI * 50 - (metric.value / 100) * (2 * Math.PI * 50)}
                    strokeLinecap="round"
                    style={{
                      transition: "stroke-dashoffset 0.5s ease",
                    }}
                  />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#4a352f",
                    }}
                  >
                    {metric.value}%
                  </span>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#7d5a50",
                    }}
                  >
                    Target: {metric.target}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Tech Stack Component
const TechStackUsage = ({ activeSection, isInvestorView }) => {
  const [systems, setSystems] = useState([])
  const [showEditForm, setShowEditForm] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user)
        loadTechStackData(user.uid)
      } else {
        setCurrentUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  const saveTechStackData = async () => {
    if (isInvestorView) {
      alert("You are in investor view mode. You cannot edit SME data.")
      return
    }

    if (!currentUser) {
      alert("User not authenticated")
      return
    }

    try {
      await setDoc(doc(db, "tech-stack", currentUser.uid), { 
        systems,
        userId: currentUser.uid,
      })
      setShowEditForm(false)
      alert("Tech stack data saved successfully!")
    } catch (error) {
      console.error("Error saving tech stack data:", error)
      alert("Error saving data")
    }
  }

  const loadTechStackData = async (userId) => {
    try {
      const docRef = doc(db, "tech-stack", userId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setSystems(docSnap.data().systems || [])
      }
    } catch (error) {
      console.error("Error loading tech stack data:", error)
    }
  }

  const updateSystem = (index, field, value) => {
    const newSystems = [...systems]
    newSystems[index][field] = field === "name" ? value : Number.parseFloat(value) || 0
    setSystems(newSystems)
  }

  const addSystem = () => {
    setSystems([...systems, { name: "New System", adoption: 0, users: 0 }])
  }

  const removeSystem = (index) => {
    const newSystems = systems.filter((_, i) => i !== index)
    setSystems(newSystems)
  }

  const handleDownload = () => {
    const csvContent = [
      ["System Name", "Adoption Rate %", "Active Users"],
      ...systems.map((system) => [system.name, system.adoption, system.users]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "tech-stack-usage.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (activeSection !== "tech-stack") return null

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#5d4037", marginTop: 0 }}>Tech Stack Usage</h2>
        {!isInvestorView && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleDownload}
              style={{
                padding: "8px 16px",
                backgroundColor: "#a67c52",
                color: "#faf7f2",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Download CSV
            </button>
            <button
              onClick={() => setShowEditForm(!showEditForm)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#4a352f",
                color: "#faf7f2",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {showEditForm ? "Cancel" : "Edit Data"}
            </button>
          </div>
        )}
      </div>

      {showEditForm && (
        <div
          style={{
            backgroundColor: "#f5f0e1",
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#7d5a50", marginTop: 0 }}>Edit Tech Stack Data</h3>
          {systems.map((system, index) => (
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
                value={system.name}
                onChange={(e) => updateSystem(index, "name", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="System Name"
              />
              <input
                type="number"
                value={system.adoption}
                onChange={(e) => updateSystem(index, "adoption", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Adoption %"
              />
              <input
                type="number"
                value={system.users}
                onChange={(e) => updateSystem(index, "users", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Users"
              />
              <button
                onClick={() => removeSystem(index)}
                style={{
                  padding: "8px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <div style={{ marginTop: "15px" }}>
            <button
              onClick={addSystem}
              style={{
                padding: "8px 16px",
                backgroundColor: "#72542b",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              Add System
            </button>
            <button
              onClick={saveTechStackData}
              style={{
                padding: "8px 16px",
                backgroundColor: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Save Data
            </button>
          </div>
        </div>
      )}

      {systems.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#72542b",
          }}
        >
          <p>No tech stack data available. Click "Edit Data" to add your first system.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          {systems.map((system, index) => (
            <div
              key={index}
              style={{
                padding: "15px",
                backgroundColor: "#f5f0e1",
                borderRadius: "6px",
              }}
            >
              <h3 style={{ color: "#7d5a50", marginTop: 0 }}>{system.name}</h3>
              <div style={{ marginTop: "15px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "5px",
                  }}
                >
                  <span style={{ color: "#7d5a50" }}>Adoption Rate:</span>
                  <span style={{ fontWeight: "bold", color: "#4a352f" }}>{system.adoption}%</span>
                </div>
                <div
                  style={{
                    height: "10px",
                    backgroundColor: "#e6d7c3",
                    borderRadius: "5px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${system.adoption}%`,
                      height: "100%",
                      backgroundColor: "#9c7c5f",
                      borderRadius: "5px",
                    }}
                  ></div>
                </div>
              </div>
              <div style={{ marginTop: "15px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "5px",
                  }}
                >
                  <span style={{ color: "#7d5a50" }}>Active Users:</span>
                  <span style={{ fontWeight: "bold", color: "#4a352f" }}>{system.users}</span>
                </div>
              </div>
              <div
                style={{
                  height: "10px",
                  backgroundColor: "#e6d7c3",
                  borderRadius: "5px",
                  overflow: "hidden",
                  marginTop: "5px",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, (system.users / 150) * 100)}%`,
                    height: "100%",
                    backgroundColor: "#a67c52",
                    borderRadius: "5px",
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Process Automation Component
const ProcessAutomation = ({ activeSection, isInvestorView }) => {
  const [processes, setProcesses] = useState([])
  const [showEditForm, setShowEditForm] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user)
        loadProcessAutomationData(user.uid)
      } else {
        setCurrentUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  const saveProcessAutomationData = async () => {
    if (isInvestorView) {
      alert("You are in investor view mode. You cannot edit SME data.")
      return
    }

    if (!currentUser) {
      alert("User not authenticated")
      return
    }

    try {
      await setDoc(doc(db, "process-automation", currentUser.uid), { 
        processes,
        userId: currentUser.uid,
      })
      setShowEditForm(false)
      alert("Process automation data saved successfully!")
    } catch (error) {
      console.error("Error saving process automation data:", error)
      alert("Error saving data")
    }
  }

  const loadProcessAutomationData = async (userId) => {
    try {
      const docRef = doc(db, "process-automation", userId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setProcesses(docSnap.data().processes || [])
      }
    } catch (error) {
      console.error("Error loading process automation data:", error)
    }
  }

  const updateProcess = (index, field, value) => {
    const newProcesses = [...processes]
    newProcesses[index][field] = field === "name" ? value : Number.parseFloat(value) || 0
    setProcesses(newProcesses)
  }

  const addProcess = () => {
    setProcesses([...processes, { name: "New Process", automation: 0 }])
  }

  const removeProcess = (index) => {
    const newProcesses = processes.filter((_, i) => i !== index)
    setProcesses(newProcesses)
  }

  const handleDownload = () => {
    const csvContent = [
      ["Process Name", "Automation Level %"],
      ...processes.map((process) => [process.name, process.automation]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "process-automation.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (activeSection !== "process-automation") return null

  const overallIndex = processes.length > 0 ? processes.reduce((sum, p) => sum + p.automation, 0) / processes.length : 0

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#5d4037", marginTop: 0 }}>Process Automation Index</h2>
        {!isInvestorView && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleDownload}
              style={{
                padding: "8px 16px",
                backgroundColor: "#a67c52",
                color: "#faf7f2",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Download CSV
            </button>
            <button
              onClick={() => setShowEditForm(!showEditForm)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#4a352f",
                color: "#faf7f2",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {showEditForm ? "Cancel" : "Edit Data"}
            </button>
          </div>
        )}
      </div>

      {showEditForm && (
        <div
          style={{
            backgroundColor: "#f5f0e1",
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#7d5a50", marginTop: 0 }}>Edit Process Data</h3>
          {processes.map((process, index) => (
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
                value={process.name}
                onChange={(e) => updateProcess(index, "name", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Process Name"
              />
              <input
                type="number"
                value={process.automation}
                onChange={(e) => updateProcess(index, "automation", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Automation %"
              />
              <button
                onClick={() => removeProcess(index)}
                style={{
                  padding: "8px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <div style={{ marginTop: "15px" }}>
            <button
              onClick={addProcess}
              style={{
                padding: "8px 16px",
                backgroundColor: "#72542b",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              Add Process
            </button>
            <button
              onClick={saveProcessAutomationData}
              style={{
                padding: "8px 16px",
                backgroundColor: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Save Data
            </button>
          </div>
        </div>
      )}

      {processes.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#72542b",
          }}
        >
          <p>No process data available. Click "Edit Data" to add your first process.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "30px",
          }}
        >
          <div>
            <div
              style={{
                height: "300px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "200px",
                  height: "200px",
                  borderRadius: "50%",
                  backgroundColor: "#e8ddd4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  border: "10px solid #9c7c5f",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                }}
              >
                <span
                  style={{
                    fontSize: "36px",
                    fontWeight: "bold",
                    color: "#5d4037",
                  }}
                >
                  {Math.round(overallIndex)}%
                </span>
                <span
                  style={{
                    fontSize: "16px",
                    color: "#7d5a50",
                  }}
                >
                  Automation Index
                </span>
              </div>
            </div>
          </div>
          <div>
            {processes.map((process, index) => (
              <div key={index} style={{ marginBottom: "15px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "5px",
                  }}
                >
                  <span style={{ color: "#7d5a50" }}>{process.name}</span>
                  <span style={{ fontWeight: "bold", color: "#4a352f" }}>{process.automation}%</span>
                </div>
                <div
                  style={{
                    height: "10px",
                    backgroundColor: "#e6d7c3",
                    borderRadius: "5px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${process.automation}%`,
                      height: "100%",
                      backgroundColor: "#8b7355",
                      borderRadius: "5px",
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Customer Retention Component
const CustomerRetention = ({ activeSection, isInvestorView }) => {
  const [retentionData, setRetentionData] = useState([0, 0, 0, 0, 0, 0])
  const [churnData, setChurnData] = useState([0, 0, 0, 0, 0, 0])
  const [showEditForm, setShowEditForm] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user)
        loadCustomerRetentionData(user.uid)
      } else {
        setCurrentUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  const saveCustomerRetentionData = async () => {
    if (isInvestorView) {
      alert("You are in investor view mode. You cannot edit SME data.")
      return
    }

    if (!currentUser) {
      alert("User not authenticated")
      return
    }

    try {
      await setDoc(doc(db, "customer-retention", currentUser.uid), {
        retentionData,
        churnData,
        userId: currentUser.uid,
      })
      setShowEditForm(false)
      alert("Customer retention data saved successfully!")
    } catch (error) {
      console.error("Error saving customer retention data:", error)
      alert("Error saving data")
    }
  }

  const loadCustomerRetentionData = async (userId) => {
    try {
      const docRef = doc(db, "customer-retention", userId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        setRetentionData(data.retentionData || [0, 0, 0, 0, 0, 0])
        setChurnData(data.churnData || [0, 0, 0, 0, 0, 0])
      }
    } catch (error) {
      console.error("Error loading customer retention data:", error)
    }
  }

  const updateRetentionValue = (index, value) => {
    const newData = [...retentionData]
    newData[index] = Number.parseFloat(value) || 0
    setRetentionData(newData)
  }

  const updateChurnValue = (index, value) => {
    const newData = [...churnData]
    newData[index] = Number.parseFloat(value) || 0
    setChurnData(newData)
  }

  const handleDownload = () => {
    const csvContent = [
      ["Month", "Retention Rate %", "Churn Rate %"],
      ...months.map((month, index) => [month, retentionData[index], churnData[index]]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "customer-retention.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (activeSection !== "customer-retention") return null

  return (
    <div
      style={{
        backgroundColor: "#f0e6d9",
        padding: "20px",
        margin: "20px 0",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#5d4037", marginTop: 0 }}>Customer Retention & Churn Rates</h2>
        {!isInvestorView && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleDownload}
              style={{
                padding: "8px 16px",
                backgroundColor: "#a67c52",
                color: "#faf7f2",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Download CSV
            </button>
            <button
              onClick={() => setShowEditForm(!showEditForm)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#4a352f",
                color: "#faf7f2",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {showEditForm ? "Cancel" : "Edit Data"}
            </button>
          </div>
        )}
      </div>

      {showEditForm && (
        <div
          style={{
            backgroundColor: "#f5f0e1",
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#7d5a50", marginTop: 0 }}>Edit Customer Retention Data</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <h4 style={{ color: "#7d5a50" }}>Retention Rate (%)</h4>
              {months.map((month, index) => (
                <div key={month} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ minWidth: "40px", color: "#72542b" }}>{month}:</span>
                  <input
                    type="number"
                    value={retentionData[index]}
                    onChange={(e) => updateRetentionValue(index, e.target.value)}
                    style={{
                      padding: "6px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                      width: "80px",
                    }}
                  />
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ color: "#7d5a50" }}>Churn Rate (%)</h4>
              {months.map((month, index) => (
                <div key={month} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ minWidth: "40px", color: "#72542b" }}>{month}:</span>
                  <input
                    type="number"
                    value={churnData[index]}
                    onChange={(e) => updateChurnValue(index, e.target.value)}
                    style={{
                      padding: "6px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                      width: "80px",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={saveCustomerRetentionData}
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

      <div style={{ height: "400px" }}>
        <Line
          data={{
            labels: months,
            datasets: [
              {
                label: "Retention Rate (%)",
                data: retentionData,
                borderColor: "#4CAF50",
                backgroundColor: "rgba(76, 175, 80, 0.1)",
                borderWidth: 2,
                tension: 0.1,
                fill: true,
              },
              {
                label: "Churn Rate (%)",
                data: churnData,
                borderColor: "#F44336",
                backgroundColor: "rgba(244, 67, 54, 0.1)",
                borderWidth: 2,
                tension: 0.1,
                fill: true,
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
              title: {
                display: false,
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                title: {
                  display: true,
                  text: "Rate (%)",
                  color: "#72542b",
                },
              },
              x: {
                title: {
                  display: true,
                  text: "Months",
                  color: "#72542b",
                },
              },
            },
          }}
        />
      </div>
    </div>
  )
}

// Main Operational Strength Component
const OperationalStrength = () => {
  const [activeSection, setActiveSection] = useState("kpi-dashboard")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

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

  const handleExitInvestorView = () => {
    sessionStorage.removeItem("viewingSMEId")
    sessionStorage.removeItem("viewingSMEName")
    sessionStorage.removeItem("investorViewMode")
    window.location.href = "/my-cohorts"
  }

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
    { id: "kpi-dashboard", label: "KPI Dashboard" },
    { id: "productivity", label: "Productivity" },
    { id: "unit-cost", label: "Unit Costs" },
    { id: "order-fulfillment", label: "Order Fulfillment" },
    { id: "tech-stack", label: "Tech Stack" },
    { id: "process-automation", label: "Process Automation" },
    { id: "customer-retention", label: "Customer Retention" },
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
                Investor View: Viewing {viewingSMEName}'s Operational Strength
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
              margin: "50px 0 20px 0",
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
                  backgroundColor: activeSection === button.id ? "#4a352f" : "#e6d7c3",
                  color: activeSection === button.id ? "#faf7f2" : "#4a352f",
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

          <KPIDashboard activeSection={activeSection} isInvestorView={isInvestorView} viewingSMEId={viewingSMEId} />
          <ProductivityMeasures activeSection={activeSection} isInvestorView={isInvestorView} />
          <UnitCost activeSection={activeSection} isInvestorView={isInvestorView} />
          <OrderFulfillment activeSection={activeSection} isInvestorView={isInvestorView} />
          <TechStackUsage activeSection={activeSection} isInvestorView={isInvestorView} />
          <ProcessAutomation activeSection={activeSection} isInvestorView={isInvestorView} />
          <CustomerRetention activeSection={activeSection} isInvestorView={isInvestorView} />
        </div>
      </div>
    </div>
  )
}

export default OperationalStrength