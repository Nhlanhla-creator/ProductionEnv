"use client"

import { useState, useEffect } from "react"
import { Bar, Pie } from "react-chartjs-2"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"
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
import ChartDataLabels from "chartjs-plugin-datalabels"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend)

// Download utility function
const downloadCSV = (data, filename) => {
  let content

  if (Array.isArray(data) && data.length > 0) {
    const headers = Object.keys(data[0]).join(",")
    const rows = data.map((row) => Object.values(row).join(",")).join("\n")
    content = headers + "\n" + rows
  } else if (typeof data === "object") {
    // Convert object to CSV format
    const entries = Object.entries(data)
    content = entries.map(([key, value]) => `${key},${value}`).join("\n")
  } else {
    content = String(data)
  }

  const blob = new Blob([content], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Loan Repayments Component (now includes Default Flags)
const LoanRepayments = ({ activeSection, currentUser, isInvestorView }) => {
  const [timeFrame, setTimeFrame] = useState("monthly")
  const [monthlyData, setMonthlyData] = useState({
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    scheduled: [0, 0, 0, 0, 0, 0],
    actual: [0, 0, 0, 0, 0, 0],
  })
  const [quarterlyData, setQuarterlyData] = useState({
    labels: ["Q1", "Q2", "Q3", "Q4"],
    scheduled: [0, 0, 0, 0],
    actual: [0, 0, 0, 0],
  })
  const [comment, setComment] = useState("")
  const [comments, setComments] = useState([])
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDownloadOptions, setShowDownloadOptions] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Default Flags State
  const [flags, setFlags] = useState([])
  const [showFlagsEditForm, setShowFlagsEditForm] = useState(false)
  const [showFlagsDownloadOptions, setShowFlagsDownloadOptions] = useState(false)

  const saveLoanData = async () => {
    if (!currentUser) return

    try {
      await setDoc(doc(db, "loan-repayments", currentUser.uid), {
        monthlyData,
        quarterlyData,
        comments,
        flags,
        lastUpdated: new Date().toISOString(),
      })
      setShowEditForm(false)
      setShowFlagsEditForm(false)
      alert("Loan repayment data saved successfully!")
    } catch (error) {
      console.error("Error saving loan data:", error)
      alert("Error saving data")
    }
  }

  const loadLoanData = async () => {
    if (!currentUser) return

    try {
      setIsLoading(true)
      const docRef = doc(db, "loan-repayments", currentUser.uid)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        setMonthlyData(
          data.monthlyData || {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            scheduled: [0, 0, 0, 0, 0, 0],
            actual: [0, 0, 0, 0, 0, 0],
          },
        )
        setQuarterlyData(
          data.quarterlyData || {
            labels: ["Q1", "Q2", "Q3", "Q4"],
            scheduled: [0, 0, 0, 0],
            actual: [0, 0, 0, 0],
          },
        )
        setComments(data.comments || [])
        setFlags(data.flags || [])
      } else {
        // Initialize with empty data if no document exists
        await setDoc(docRef, {
          monthlyData,
          quarterlyData,
          comments: [],
          flags: [],
          lastUpdated: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error("Error loading loan data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser) {
      loadLoanData()
    }
  }, [currentUser])

  const updateScheduledValue = (index, value, period) => {
    if (period === "monthly") {
      const newData = { ...monthlyData }
      newData.scheduled[index] = Number.parseFloat(value) || 0
      setMonthlyData(newData)
    } else {
      const newData = { ...quarterlyData }
      newData.scheduled[index] = Number.parseFloat(value) || 0
      setQuarterlyData(newData)
    }
  }

  const updateActualValue = (index, value, period) => {
    if (period === "monthly") {
      const newData = { ...monthlyData }
      newData.actual[index] = Number.parseFloat(value) || 0
      setMonthlyData(newData)
    } else {
      const newData = { ...quarterlyData }
      newData.actual[index] = Number.parseFloat(value) || 0
      setQuarterlyData(newData)
    }
  }

  // Default Flags Functions
  const updateFlag = (index, field, value) => {
    const newFlags = [...flags]
    newFlags[index][field] = field === "count" ? Number.parseFloat(value) || 0 : value
    setFlags(newFlags)
  }

  const addFlag = () => {
    const newFlag = {
      id: flags.length + 1,
      name: "New Flag",
      status: "Watch",
      count: 0,
      action: "Monitor",
    }
    setFlags([...flags, newFlag])
  }

  const removeFlag = (index) => {
    const newFlags = flags.filter((_, i) => i !== index)
    setFlags(newFlags)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Critical":
        return "#f44336"
      case "Warning":
        return "#FF9800"
      case "Watch":
        return "#FFC107"
      default:
        return "#9E9E9E"
    }
  }

  const handleAction = (id, action) => {
    alert(`Action "${action}" initiated for flag ${id}`)
  }

  const handleAddComment = () => {
    if (comment.trim()) {
      const newComment = {
        id: comments.length + 1,
        text: comment,
        date: new Date().toISOString().split("T")[0],
      }
      const updatedComments = [...comments, newComment]
      setComments(updatedComments)
      setComment("")

      // Auto-save comments
      if (currentUser) {
        setDoc(
          doc(db, "loan-repayments", currentUser.uid),
          {
            monthlyData,
            quarterlyData,
            comments: updatedComments,
            flags,
            lastUpdated: new Date().toISOString(),
          },
          { merge: true },
        )
      }
    }
  }

  const handleDownload = () => {
    const data = timeFrame === "monthly" ? monthlyData : quarterlyData
    const csvData = [
      ["Metric", "Value"],
      ["Time Frame", timeFrame],
      ["", ""],
      ["Month/Quarter", "Scheduled", "Actual"],
      ...data.labels.map((label, index) => [label, data.scheduled[index], data.actual[index]]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvData], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "loan-repayments.csv"
    a.click()
    URL.revokeObjectURL(url)
    setShowDownloadOptions(false)
  }

  const handleFlagsDownload = (type) => {
    if (type === "csv") {
      const csvContent = [
        ["Flag Name", "Status", "Count", "Action"],
        ...flags.map((flag) => [flag.name, flag.status, flag.count, flag.action]),
      ]
        .map((row) => row.join(","))
        .join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "default-flags.csv"
      a.click()
      URL.revokeObjectURL(url)
    } else if (type === "json") {
      const jsonContent = JSON.stringify(flags, null, 2)
      const blob = new Blob([jsonContent], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "default-flags.json"
      a.click()
      URL.revokeObjectURL(url)
    }
    setShowFlagsDownloadOptions(false)
  }

  if (activeSection !== "loan-repayments") return null

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
        <div>Loading loan repayment data...</div>
      </div>
    )
  }

  const data = timeFrame === "monthly" ? monthlyData : quarterlyData

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: `Loan Repayments vs Schedule (${timeFrame})`,
        color: "#4a352f",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Amount (R)",
          color: "#7d5a50",
        },
      },
      x: {
        title: {
          display: false,
        },
      },
    },
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Loan Repayments Section */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div
          style={{
            flex: 2,
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
              alignItems: "center",
              marginBottom: "20px",
              flexDirection: window.innerWidth < 768 ? "column" : "row",
              gap: window.innerWidth < 768 ? "10px" : "0",
            }}
          >
            <h2 style={{ color: "#5d4037", margin: 0 }}>Loan Repayments</h2>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={() => setTimeFrame("monthly")}
                style={{
                  padding: "8px 15px",
                  backgroundColor: timeFrame === "monthly" ? "#4a352f" : "#e6d7c3",
                  color: timeFrame === "monthly" ? "#faf7f2" : "#4a352f",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setTimeFrame("quarterly")}
                style={{
                  padding: "8px 15px",
                  backgroundColor: timeFrame === "quarterly" ? "#4a352f" : "#e6d7c3",
                  color: timeFrame === "quarterly" ? "#faf7f2" : "#4a352f",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Quarterly
              </button>
              {!isInvestorView && (
                <button
                  onClick={() => setShowEditForm(!showEditForm)}
                  style={{
                    padding: "8px 15px",
                    backgroundColor: "#4a352f",
                    color: "#faf7f2",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  {showEditForm ? "Cancel" : "Edit Data"}
                </button>
              )}
              <button
                onClick={handleDownload}
                style={{
                  padding: "8px 15px",
                  backgroundColor: "#a67c52",
                  color: "#faf7f2",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Download CSV
              </button>
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
              <h3 style={{ color: "#72542b", marginTop: 0 }}>Edit Loan Repayment Data</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <h4 style={{ color: "#72542b" }}>Monthly Data</h4>
                  <div style={{ marginBottom: "15px" }}>
                    <h5 style={{ color: "#72542b" }}>Scheduled</h5>
                    {monthlyData.labels.map((month, index) => (
                      <div
                        key={month}
                        style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}
                      >
                        <span style={{ minWidth: "40px", color: "#72542b" }}>{month}:</span>
                        <input
                          type="number"
                          value={monthlyData.scheduled[index]}
                          onChange={(e) => updateScheduledValue(index, e.target.value, "monthly")}
                          style={{
                            padding: "6px",
                            border: "1px solid #d4c4b0",
                            borderRadius: "4px",
                            width: "100px",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <h5 style={{ color: "#72542b" }}>Actual</h5>
                    {monthlyData.labels.map((month, index) => (
                      <div
                        key={month}
                        style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}
                      >
                        <span style={{ minWidth: "40px", color: "#72542b" }}>{month}:</span>
                        <input
                          type="number"
                          value={monthlyData.actual[index]}
                          onChange={(e) => updateActualValue(index, e.target.value, "monthly")}
                          style={{
                            padding: "6px",
                            border: "1px solid #d4c4b0",
                            borderRadius: "4px",
                            width: "100px",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 style={{ color: "#72542b" }}>Quarterly Data</h4>
                  <div style={{ marginBottom: "15px" }}>
                    <h5 style={{ color: "#72542b" }}>Scheduled</h5>
                    {quarterlyData.labels.map((quarter, index) => (
                      <div
                        key={quarter}
                        style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}
                      >
                        <span style={{ minWidth: "40px", color: "#72542b" }}>{quarter}:</span>
                        <input
                          type="number"
                          value={quarterlyData.scheduled[index]}
                          onChange={(e) => updateScheduledValue(index, e.target.value, "quarterly")}
                          style={{
                            padding: "6px",
                            border: "1px solid #d4c4b0",
                            borderRadius: "4px",
                            width: "100px",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <h5 style={{ color: "#72542b" }}>Actual</h5>
                    {quarterlyData.labels.map((quarter, index) => (
                      <div
                        key={quarter}
                        style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}
                      >
                        <span style={{ minWidth: "40px", color: "#72542b" }}>{quarter}:</span>
                        <input
                          type="number"
                          value={quarterlyData.actual[index]}
                          onChange={(e) => updateActualValue(index, e.target.value, "quarterly")}
                          style={{
                            padding: "6px",
                            border: "1px solid #d4c4b0",
                            borderRadius: "4px",
                            width: "100px",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={saveLoanData}
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
            <Bar
              data={{
                labels: data.labels,
                datasets: [
                  {
                    label: "Scheduled",
                    data: data.scheduled,
                    backgroundColor: "#e6d7c3",
                    borderColor: "#4a352f",
                    borderWidth: 1,
                  },
                  {
                    label: "Actual",
                    data: data.actual,
                    backgroundColor: "#a67c52",
                    borderColor: "#4a352f",
                    borderWidth: 1,
                  },
                ],
              }}
              options={chartOptions}
            />
          </div>
        </div>

        <div
          style={{
            flex: 1,
            backgroundColor: "#fdfcfb",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ color: "#5d4037", marginTop: 0 }}>Comments & Notes</h3>
          {!isInvestorView && (
            <div style={{ marginBottom: "15px" }}>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                style={{
                  width: "100%",
                  minHeight: "80px",
                  padding: "10px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                  resize: "vertical",
                }}
              />
              <button
                onClick={handleAddComment}
                style={{
                  padding: "8px 15px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginTop: "10px",
                }}
              >
                Add Comment
              </button>
            </div>
          )}

          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {comments.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                  color: "#72542b",
                }}
              >
                <p>No comments yet.</p>
              </div>
            ) : (
              comments.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: "10px",
                    marginBottom: "10px",
                    backgroundColor: "#f7f3f0",
                    borderRadius: "4px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "5px",
                      fontSize: "0.9em",
                      color: "#72542b",
                    }}
                  >
                    <span>Comment #{c.id}</span>
                    <span>{c.date}</span>
                  </div>
                  <p style={{ margin: 0 }}>{c.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Default Flags Section - Now under Loan Repayments */}
      <div
        style={{
          backgroundColor: "#fdfcfb",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ color: "#5d4037", marginTop: 0 }}>Default Flags & Early Warnings</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            {!isInvestorView && (
              <button
                onClick={() => setShowFlagsEditForm(!showFlagsEditForm)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {showFlagsEditForm ? "Cancel" : "Edit Data"}
              </button>
            )}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowFlagsDownloadOptions(!showFlagsDownloadOptions)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#72542b",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Download
              </button>
              {showFlagsDownloadOptions && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    backgroundColor: "#fdfcfb",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    zIndex: 1000,
                  }}
                >
                  <button
                    onClick={() => handleFlagsDownload("json")}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "8px 15px",
                      backgroundColor: "transparent",
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      color: "#5d4037",
                    }}
                  >
                    Download JSON
                  </button>
                  <button
                    onClick={() => handleFlagsDownload("csv")}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "8px 15px",
                      backgroundColor: "transparent",
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      color: "#5d4037",
                    }}
                  >
                    Download CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {!isInvestorView && showFlagsEditForm && (
          <div
            style={{
              backgroundColor: "#f7f3f0",
              padding: "20px",
              borderRadius: "6px",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ color: "#72542b", marginTop: 0 }}>Edit Default Flags Data</h3>
            {flags.map((flag, index) => (
              <div
                key={index}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 2fr auto",
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
                  value={flag.name}
                  onChange={(e) => updateFlag(index, "name", e.target.value)}
                  style={{
                    padding: "8px",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                  }}
                  placeholder="Flag Name"
                />
                <select
                  value={flag.status}
                  onChange={(e) => updateFlag(index, "status", e.target.value)}
                  style={{
                    padding: "8px",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                  }}
                >
                  <option value="Watch">Watch</option>
                  <option value="Warning">Warning</option>
                  <option value="Critical">Critical</option>
                </select>
                <input
                  type="number"
                  value={flag.count}
                  onChange={(e) => updateFlag(index, "count", e.target.value)}
                  style={{
                    padding: "8px",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                  }}
                  placeholder="Count"
                />
                <input
                  type="text"
                  value={flag.action}
                  onChange={(e) => updateFlag(index, "action", e.target.value)}
                  style={{
                    padding: "8px",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                  }}
                  placeholder="Action"
                />
                <button
                  onClick={() => removeFlag(index)}
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
                onClick={addFlag}
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
                Add Flag
              </button>
              <button
                onClick={saveLoanData}
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

        {flags.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#72542b",
            }}
          >
            <p>No flag data available. {!isInvestorView && 'Click "Edit Data" to add your first flag.'}</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                color: "#5d4037",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "#e8ddd4",
                    borderBottom: "2px solid #d4c4b0",
                  }}
                >
                  <th style={{ padding: "12px", textAlign: "left" }}>Flag Name</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Status</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Count</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Action</th>
                  {!isInvestorView && <th style={{ padding: "12px", textAlign: "left" }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {flags.map((flag) => (
                  <tr
                    key={flag.id}
                    style={{
                      borderBottom: "1px solid #e8ddd4",
                    }}
                  >
                    <td style={{ padding: "12px" }}>{flag.name}</td>
                    <td style={{ padding: "12px" }}>
                      <span
                        style={{
                          padding: "6px 12px",
                          borderRadius: "4px",
                          backgroundColor: getStatusColor(flag.status),
                          color: "white",
                          display: "inline-block",
                        }}
                      >
                        {flag.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>{flag.count}</td>
                    <td style={{ padding: "12px" }}>{flag.action}</td>
                    {!isInvestorView && (
                      <td style={{ padding: "12px" }}>
                        <button
                          onClick={() => handleAction(flag.id, flag.action)}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#5d4037",
                            color: "#fdfcfb",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Take Action
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// IRR Component
const IRRInvestments = ({ activeSection, currentUser, isInvestorView }) => {
  const [investments, setInvestments] = useState([])
  const [expandedInvestment, setExpandedInvestment] = useState(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDownloadOptions, setShowDownloadOptions] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const saveIRRData = async () => {
    if (!currentUser) return

    try {
      await setDoc(doc(db, "irr-investments", currentUser.uid), {
        investments,
        lastUpdated: new Date().toISOString(),
      })
      setShowEditForm(false)
      alert("IRR investment data saved successfully!")
    } catch (error) {
      console.error("Error saving IRR data:", error)
      alert("Error saving data")
    }
  }

  const loadIRRData = async () => {
    if (!currentUser) return

    try {
      setIsLoading(true)
      const docRef = doc(db, "irr-investments", currentUser.uid)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setInvestments(docSnap.data().investments || [])
      } else {
        // Initialize with empty data if no document exists
        await setDoc(docRef, {
          investments: [],
          lastUpdated: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error("Error loading IRR data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser) {
      loadIRRData()
    }
  }, [currentUser])

  const updateInvestment = (index, field, value) => {
    const newInvestments = [...investments]
    if (field === "name" || field === "riskRating") {
      newInvestments[index][field] = value
    } else if (field === "irr") {
      newInvestments[index][field] = Number.parseFloat(value) || 0
    } else if (field.startsWith("details.")) {
      const detailField = field.split(".")[1]
      if (detailField === "cashFlows") {
        newInvestments[index].details[detailField] = value.split(",").map((flow) => flow.trim())
      } else {
        newInvestments[index].details[detailField] = value
      }
    }
    setInvestments(newInvestments)
  }

  const addInvestment = () => {
    const newInvestment = {
      name: "New Project",
      irr: 0,
      details: {
        initialInvestment: "R0M",
        duration: "0 years",
        cashFlows: ["Year 1: R0M"],
        riskRating: "Medium",
      },
    }
    setInvestments([...investments, newInvestment])
  }

  const removeInvestment = (index) => {
    const newInvestments = investments.filter((_, i) => i !== index)
    setInvestments(newInvestments)
  }

  const toggleInvestment = (index) => {
    if (expandedInvestment === index) {
      setExpandedInvestment(null)
    } else {
      setExpandedInvestment(index)
    }
  }

  const handleDownload = (type) => {
    if (type === "csv") {
      const csvContent = [
        ["Investment Name", "IRR %", "Initial Investment", "Duration", "Risk Rating"],
        ...investments.map((inv) => [
          inv.name,
          inv.irr,
          inv.details.initialInvestment,
          inv.details.duration,
          inv.details.riskRating,
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "irr-investments.csv"
      a.click()
      URL.revokeObjectURL(url)
    } else if (type === "json") {
      const jsonContent = JSON.stringify(investments, null, 2)
      const blob = new Blob([jsonContent], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "irr-investments.json"
      a.click()
      URL.revokeObjectURL(url)
    }
    setShowDownloadOptions(false)
  }

  if (activeSection !== "irr-investments") return null

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
        <div>Loading IRR investments data...</div>
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#5d4037", marginTop: 0 }}>IRR on Equity Investments</h2>
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
              }}
            >
              {showEditForm ? "Cancel" : "Edit Data"}
            </button>
          )}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowDownloadOptions(!showDownloadOptions)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#72542b",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Download
            </button>
            {showDownloadOptions && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  backgroundColor: "#fdfcfb",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  zIndex: 1000,
                }}
              >
                <button
                  onClick={() => handleDownload("json")}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "8px 15px",
                    backgroundColor: "transparent",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    color: "#5d4037",
                  }}
                >
                  Download JSON
                </button>
                <button
                  onClick={() => handleDownload("csv")}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "8px 15px",
                    backgroundColor: "transparent",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    color: "#5d4037",
                  }}
                >
                  Download CSV
                </button>
              </div>
            )}
          </div>
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
          <h3 style={{ color: "#72542b", marginTop: 0 }}>Edit IRR Investment Data</h3>
          {investments.map((investment, index) => (
            <div
              key={index}
              style={{
                marginBottom: "20px",
                padding: "15px",
                backgroundColor: "#fdfcfb",
                borderRadius: "4px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr auto",
                  gap: "10px",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <input
                  type="text"
                  value={investment.name}
                  onChange={(e) => updateInvestment(index, "name", e.target.value)}
                  style={{
                    padding: "8px",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                  }}
                  placeholder="Project Name"
                />
                <input
                  type="number"
                  value={investment.irr}
                  onChange={(e) => updateInvestment(index, "irr", e.target.value)}
                  style={{
                    padding: "8px",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                  }}
                  placeholder="IRR %"
                />
                <select
                  value={investment.details.riskRating}
                  onChange={(e) => updateInvestment(index, "details.riskRating", e.target.value)}
                  style={{
                    padding: "8px",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                  }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
                <button
                  onClick={() => removeInvestment(index)}
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <input
                  type="text"
                  value={investment.details.initialInvestment}
                  onChange={(e) => updateInvestment(index, "details.initialInvestment", e.target.value)}
                  style={{
                    padding: "8px",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                  }}
                  placeholder="Initial Investment"
                />
                <input
                  type="text"
                  value={investment.details.duration}
                  onChange={(e) => updateInvestment(index, "details.duration", e.target.value)}
                  style={{
                    padding: "8px",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                  }}
                  placeholder="Duration"
                />
                <input
                  type="text"
                  value={investment.details.cashFlows.join(", ")}
                  onChange={(e) => updateInvestment(index, "details.cashFlows", e.target.value)}
                  style={{
                    padding: "8px",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                  }}
                  placeholder="Cash Flows (comma separated)"
                />
              </div>
            </div>
          ))}
          <div style={{ marginTop: "15px" }}>
            <button
              onClick={addInvestment}
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
              Add Investment
            </button>
            <button
              onClick={saveIRRData}
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

      {investments.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#72542b",
          }}
        >
          <p>No investment data available. {!isInvestorView && 'Click "Edit Data" to add your first investment.'}</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: window.innerWidth < 768 ? "1fr" : "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
          }}
        >
          {investments.map((investment, index) => (
            <div
              key={index}
              style={{
                padding: "15px",
                backgroundColor: "#f7f3f0",
                borderRadius: "6px",
                textAlign: "center",
              }}
            >
              <h3 style={{ color: "#72542b" }}>{investment.name}</h3>
              <div
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  backgroundColor: "#e8ddd4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                  border: "8px solid #9c7c5f",
                  marginBottom: "15px",
                }}
              >
                <span
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#5d4037",
                  }}
                >
                  {investment.irr}%
                </span>
              </div>

              <button
                onClick={() => toggleInvestment(index)}
                style={{
                  padding: "8px 15px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginBottom: "10px",
                }}
              >
                {expandedInvestment === index ? "Hide Details" : "Breakdown"}
              </button>

              {expandedInvestment === index && (
                <div
                  style={{
                    textAlign: "left",
                    backgroundColor: "#e8ddd4",
                    padding: "10px",
                    borderRadius: "4px",
                    marginTop: "10px",
                  }}
                >
                  <p>
                    <strong>Initial Investment:</strong> {investment.details.initialInvestment}
                  </p>
                  <p>
                    <strong>Duration:</strong> {investment.details.duration}
                  </p>
                  <p>
                    <strong>Risk Rating:</strong> {investment.details.riskRating}
                  </p>
                  <div>
                    <strong>Cash Flows:</strong>
                    <ul style={{ margin: "5px 0 0 20px", padding: 0 }}>
                      {investment.details.cashFlows.map((flow, i) => (
                        <li key={i}>{flow}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Investment Ratios Component (updated - removed mock data)
const InvestmentRatios = ({ activeSection, currentUser, isInvestorView }) => {
  const [expandedRatio, setExpandedRatio] = useState(null)
  const [showDownloadOptions, setShowDownloadOptions] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [ratios, setRatios] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const saveRatiosData = async () => {
    if (!currentUser) return

    try {
      await setDoc(doc(db, "investment-ratios", currentUser.uid), {
        ratios,
        lastUpdated: new Date().toISOString(),
      })
      setShowEditForm(false)
      alert("Investment ratios data saved successfully!")
    } catch (error) {
      console.error("Error saving ratios data:", error)
      alert("Error saving data")
    }
  }

  const loadRatiosData = async () => {
    if (!currentUser) return

    try {
      setIsLoading(true)
      const docRef = doc(db, "investment-ratios", currentUser.uid)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setRatios(docSnap.data().ratios || [])
      } else {
        // Initialize with empty data if no document exists
        await setDoc(docRef, {
          ratios: [],
          lastUpdated: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error("Error loading ratios data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser) {
      loadRatiosData()
    }
  }, [currentUser])

  const updateRatio = (index, field, value) => {
    const newRatios = [...ratios]
    if (field === "value") {
      newRatios[index][field] = Number.parseFloat(value) || 0
    } else {
      newRatios[index][field] = value
    }
    setRatios(newRatios)
  }

  const addRatio = () => {
    const newRatio = {
      name: "New Ratio",
      value: 0,
      target: ">0",
      description: "Description of the ratio",
      status: "Fair",
    }
    setRatios([...ratios, newRatio])
  }

  const removeRatio = (index) => {
    const newRatios = ratios.filter((_, i) => i !== index)
    setRatios(newRatios)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Excellent":
        return "#4CAF50"
      case "Good":
        return "#8BC34A"
      case "Fair":
        return "#FFC107"
      case "Poor":
        return "#F44336"
      default:
        return "#9E9E9E"
    }
  }

  const toggleRatio = (index) => {
    if (expandedRatio === index) {
      setExpandedRatio(null)
    } else {
      setExpandedRatio(index)
    }
  }

  const handleDownload = (type) => {
    if (type === "csv") {
      const csvContent = [
        ["Ratio Name", "Value", "Target", "Status", "Description"],
        ...ratios.map((ratio) => [ratio.name, ratio.value, ratio.target, ratio.status, ratio.description]),
      ]
        .map((row) => row.join(","))
        .join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "investment-ratios.csv"
      a.click()
      URL.revokeObjectURL(url)
    } else if (type === "json") {
      const jsonContent = JSON.stringify(ratios, null, 2)
      const blob = new Blob([jsonContent], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "investment-ratios.json"
      a.click()
      URL.revokeObjectURL(url)
    }
    setShowDownloadOptions(false)
  }

  if (activeSection !== "investment-ratios") return null

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
        <div>Loading investment ratios data...</div>
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#5d4037", marginTop: 0 }}>Investment Ratios</h2>
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
              }}
            >
              {showEditForm ? "Cancel" : "Edit Data"}
            </button>
          )}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowDownloadOptions(!showDownloadOptions)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#72542b",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Download
            </button>
            {showDownloadOptions && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  backgroundColor: "#fdfcfb",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  zIndex: 1000,
                }}
              >
                <button
                  onClick={() => handleDownload("json")}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "8px 15px",
                    backgroundColor: "transparent",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    color: "#5d4037",
                  }}
                >
                  Download JSON
                </button>
                <button
                  onClick={() => handleDownload("csv")}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "8px 15px",
                    backgroundColor: "transparent",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    color: "#5d4037",
                  }}
                >
                  Download CSV
                </button>
              </div>
            )}
          </div>
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
          <h3 style={{ color: "#72542b", marginTop: 0 }}>Edit Investment Ratios Data</h3>
          {ratios.map((ratio, index) => (
            <div
              key={index}
              style={{
                marginBottom: "20px",
                padding: "15px",
                backgroundColor: "#fdfcfb",
                borderRadius: "4px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
                  gap: "10px",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <input
                  type="text"
                  value={ratio.name}
                  onChange={(e) => updateRatio(index, "name", e.target.value)}
                  style={{
                    padding: "8px",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                  }}
                  placeholder="Ratio Name"
                />
                <input
                  type="number"
                  step="0.1"
                  value={ratio.value}
                  onChange={(e) => updateRatio(index, "value", e.target.value)}
                  style={{
                    padding: "8px",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                  }}
                  placeholder="Value"
                />
                <input
                  type="text"
                  value={ratio.target}
                  onChange={(e) => updateRatio(index, "target", e.target.value)}
                  style={{
                    padding: "8px",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                  }}
                  placeholder="Target"
                />
                <select
                  value={ratio.status}
                  onChange={(e) => updateRatio(index, "status", e.target.value)}
                  style={{
                    padding: "8px",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                  }}
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
                <button
                  onClick={() => removeRatio(index)}
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
              <textarea
                value={ratio.description}
                onChange={(e) => updateRatio(index, "description", e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                  minHeight: "60px",
                  resize: "vertical",
                }}
                placeholder="Description"
              />
            </div>
          ))}
          <div style={{ marginTop: "15px" }}>
            <button
              onClick={addRatio}
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
              Add Ratio
            </button>
            <button
              onClick={saveRatiosData}
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

      {ratios.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#72542b",
          }}
        >
          <p>No ratio data available. {!isInvestorView && 'Click "Edit Data" to add your first investment ratio.'}</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: window.innerWidth < 768 ? "1fr" : "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
          }}
        >
          {ratios.map((ratio, index) => (
            <div
              key={index}
              style={{
                padding: "15px",
                backgroundColor: "#f5f0e1",
                borderRadius: "6px",
                textAlign: "center",
              }}
            >
              <h3 style={{ color: "#7d5a50" }}>{ratio.name}</h3>
              <div
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  backgroundColor: "#e6d7c3",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                  border: `8px solid ${getStatusColor(ratio.status)}`,
                  marginBottom: "15px",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#5d4037",
                  }}
                >
                  {ratio.value}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#72542b",
                    marginTop: "5px",
                  }}
                >
                  Target: {ratio.target}
                </span>
              </div>

              <button
                onClick={() => toggleRatio(index)}
                style={{
                  padding: "8px 15px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginBottom: "10px",
                }}
              >
                {expandedRatio === index ? "Hide Details" : "Show Details"}
              </button>

              {expandedRatio === index && (
                <div
                  style={{
                    textAlign: "left",
                    backgroundColor: "#e8ddd4",
                    padding: "10px",
                    borderRadius: "4px",
                    marginTop: "10px",
                  }}
                >
                  <p>
                    <strong>Description:</strong> {ratio.description}
                  </p>
                  <p>
                    <strong>Status:</strong>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        backgroundColor: getStatusColor(ratio.status),
                        color: "white",
                        marginLeft: "8px",
                      }}
                    >
                      {ratio.status}
                    </span>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Cap Table Component
const CapTable = ({ activeSection, currentUser, isInvestorView }) => {
  const [investors, setInvestors] = useState([])
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDownloadOptions, setShowDownloadOptions] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const saveCapTableData = async () => {
    if (!currentUser) return

    try {
      await setDoc(doc(db, "cap-table", currentUser.uid), {
        investors,
        lastUpdated: new Date().toISOString(),
      })
      setShowEditForm(false)
      alert("Cap table data saved successfully!")
    } catch (error) {
      console.error("Error saving cap table data:", error)
      alert("Error saving data")
    }
  }

  const loadCapTableData = async () => {
    if (!currentUser) return

    try {
      setIsLoading(true)
      const docRef = doc(db, "cap-table", currentUser.uid)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setInvestors(docSnap.data().investors || [])
      } else {
        // Initialize with empty data if no document exists
        await setDoc(docRef, {
          investors: [],
          lastUpdated: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error("Error loading cap table data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser) {
      loadCapTableData()
    }
  }, [currentUser])

  const updateInvestor = (index, field, value) => {
    const newInvestors = [...investors]
    newInvestors[index][field] = field === "name" ? value : Number.parseFloat(value) || 0
    setInvestors(newInvestors)
  }

  const addInvestor = () => {
    setInvestors([...investors, { name: "New Investor", shares: 0, valuation: 0 }])
  }

  const removeInvestor = (index) => {
    const newInvestors = investors.filter((_, i) => i !== index)
    setInvestors(newInvestors)
  }

  const handleDownload = (type) => {
    const totalShares = investors.reduce((sum, inv) => sum + inv.shares, 0)
    const totalValuation = investors.reduce((sum, inv) => sum + inv.valuation, 0)

    if (type === "csv") {
      const csvContent = [
        ["Investor Name", "Shares", "Percentage", "Valuation (RM)"],
        ...investors.map((inv) => [
          inv.name,
          inv.shares,
          totalShares > 0 ? ((inv.shares / totalShares) * 100).toFixed(1) : 0,
          inv.valuation.toFixed(1),
        ]),
        ["Total", totalShares, "100", totalValuation.toFixed(1)],
      ]
        .map((row) => row.join(","))
        .join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "cap-table.csv"
      a.click()
      URL.revokeObjectURL(url)
    } else if (type === "json") {
      const jsonContent = JSON.stringify(investors, null, 2)
      const blob = new Blob([jsonContent], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "cap-table.json"
      a.click()
      URL.revokeObjectURL(url)
    }
    setShowDownloadOptions(false)
  }

  if (activeSection !== "cap-table") return null

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
        <div>Loading cap table data...</div>
      </div>
    )
  }

  const totalShares = investors.reduce((sum, inv) => sum + inv.shares, 0)
  const totalValuation = investors.reduce((sum, inv) => sum + inv.valuation, 0)

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
        <h2 style={{ color: "#5d4037", marginTop: 0 }}>Cap Table Overview</h2>
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
              }}
            >
              {showEditForm ? "Cancel" : "Edit Data"}
            </button>
          )}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowDownloadOptions(!showDownloadOptions)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#72542b",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Download
            </button>
            {showDownloadOptions && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  backgroundColor: "#fdfcfb",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  zIndex: 1000,
                }}
              >
                <button
                  onClick={() => handleDownload("json")}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "8px 15px",
                    backgroundColor: "transparent",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    color: "#5d4037",
                  }}
                >
                  Download JSON
                </button>
                <button
                  onClick={() => handleDownload("csv")}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "8px 15px",
                    backgroundColor: "transparent",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    color: "#5d4037",
                  }}
                >
                  Download CSV
                </button>
              </div>
            )}
          </div>
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
          <h3 style={{ color: "#72542b", marginTop: 0 }}>Edit Cap Table Data</h3>
          {investors.map((investor, index) => (
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
                value={investor.name}
                onChange={(e) => updateInvestor(index, "name", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Investor Name"
              />
              <input
                type="number"
                value={investor.shares}
                onChange={(e) => updateInvestor(index, "shares", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Shares %"
              />
              <input
                type="number"
                step="0.1"
                value={investor.valuation}
                onChange={(e) => updateInvestor(index, "valuation", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Valuation (RM)"
              />
              <button
                onClick={() => removeInvestor(index)}
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
              onClick={addInvestor}
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
              Add Investor
            </button>
            <button
              onClick={saveCapTableData}
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

      {investors.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#72542b",
          }}
        >
          <p>No investor data available. {!isInvestorView && 'Click "Edit Data" to add your first investor.'}</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: window.innerWidth < 768 ? "1fr" : "1fr 1fr",
            gap: "30px",
          }}
        >
          <div>
            <h3 style={{ color: "#7d5a50" }}>Ownership Structure</h3>
            <div style={{ height: "400px" }}>
              <Pie
                data={{
                  labels: investors.map((inv) => inv.name),
                  datasets: [
                    {
                      data: investors.map((inv) => inv.shares),
                      backgroundColor: ["#a67c52", "#8b7355", "#b89f8d", "#e6d7c3", "#f5f0e1"],
                      borderColor: "#4a352f",
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: window.innerWidth < 768 ? "bottom" : "right",
                    },
                    datalabels: {
                      color: "#fff",
                      font: {
                        weight: "bold",
                        size: 14,
                      },
                      formatter: (value, context) => {
                        const total = context.dataset.data.reduce((sum, val) => sum + val, 0)
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
                        return percentage + "%"
                      },
                    },
                  },
                }}
                plugins={[ChartDataLabels]}
              />
            </div>
          </div>
          <div>
            <h3 style={{ color: "#7d5a50" }}>Investor Details</h3>
            <div
              style={{
                backgroundColor: "#f5f0e1",
                padding: "15px",
                borderRadius: "6px",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  color: "#5d4037",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid #e6d7c3",
                    }}
                  >
                    <th style={{ padding: "12px", textAlign: "left" }}>Investor</th>
                    <th style={{ padding: "12px", textAlign: "right" }}>Shares (%)</th>
                    <th style={{ padding: "12px", textAlign: "right" }}>Valuation (RM)</th>
                  </tr>
                </thead>
                <tbody>
                  {investors.map((investor, index) => (
                    <tr
                      key={index}
                      style={{
                        borderBottom: "1px solid #e6d7c3",
                      }}
                    >
                      <td style={{ padding: "12px" }}>{investor.name}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        {totalShares > 0 ? ((investor.shares / totalShares) * 100).toFixed(1) : 0}%
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>R{investor.valuation.toFixed(1)}</td>
                    </tr>
                  ))}
                  <tr
                    style={{
                      borderTop: "2px solid #e6d7c3",
                      fontWeight: "bold",
                    }}
                  >
                    <td style={{ padding: "12px" }}>Total</td>
                    <td style={{ padding: "12px", textAlign: "right" }}>100%</td>
                    <td style={{ padding: "12px", textAlign: "right" }}>R{totalValuation.toFixed(1)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Dividend History Component
const DividendHistory = ({ activeSection, currentUser, isInvestorView }) => {
  const [dividends, setDividends] = useState([])
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDownloadOptions, setShowDownloadOptions] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const saveDividendData = async () => {
    if (!currentUser) return

    try {
      await setDoc(doc(db, "dividend-history", currentUser.uid), {
        dividends,
        lastUpdated: new Date().toISOString(),
      })
      setShowEditForm(false)
      alert("Dividend history data saved successfully!")
    } catch (error) {
      console.error("Error saving dividend data:", error)
      alert("Error saving data")
    }
  }

  const loadDividendData = async () => {
    if (!currentUser) return

    try {
      setIsLoading(true)
      const docRef = doc(db, "dividend-history", currentUser.uid)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setDividends(docSnap.data().dividends || [])
      } else {
        // Initialize with empty data if no document exists
        await setDoc(docRef, {
          dividends: [],
          lastUpdated: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error("Error loading dividend data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser) {
      loadDividendData()
    }
  }, [currentUser])

  const updateDividend = (index, field, value) => {
    const newDividends = [...dividends]
    if (field === "year") {
      newDividends[index][field] = Number.parseInt(value) || 0
    } else if (field === "amount") {
      newDividends[index][field] = Number.parseFloat(value) || 0
    } else {
      newDividends[index][field] = value
    }
    setDividends(newDividends)
  }

  const addDividend = () => {
    setDividends([...dividends, { year: new Date().getFullYear(), amount: 0, paymentDate: "" }])
  }

  const removeDividend = (index) => {
    const newDividends = dividends.filter((_, i) => i !== index)
    setDividends(newDividends)
  }

  const handleDownload = (type) => {
    if (type === "csv") {
      const csvContent = [
        ["Year", "Amount per Share", "Payment Date"],
        ...dividends.map((div) => [div.year, div.amount.toFixed(2), div.paymentDate]),
      ]
        .map((row) => row.join(","))
        .join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "dividend-history.csv"
      a.click()
      URL.revokeObjectURL(url)
    } else if (type === "json") {
      const jsonContent = JSON.stringify(dividends, null, 2)
      const blob = new Blob([jsonContent], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "dividend-history.json"
      a.click()
      URL.revokeObjectURL(url)
    }
    setShowDownloadOptions(false)
  }

  if (activeSection !== "dividend-history") return null

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
        <div>Loading dividend history data...</div>
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#5d4037", marginTop: 0 }}>Dividend History</h2>
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
              }}
            >
              {showEditForm ? "Cancel" : "Edit Data"}
            </button>
          )}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowDownloadOptions(!showDownloadOptions)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#72542b",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Download
            </button>
            {showDownloadOptions && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  backgroundColor: "#fdfcfb",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  zIndex: 1000,
                }}
              >
                <button
                  onClick={() => handleDownload("json")}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "8px 15px",
                    backgroundColor: "transparent",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    color: "#5d4037",
                  }}
                >
                  Download JSON
                </button>
                <button
                  onClick={() => handleDownload("csv")}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "8px 15px",
                    backgroundColor: "transparent",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    color: "#5d4037",
                  }}
                >
                  Download CSV
                </button>
              </div>
            )}
          </div>
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
          <h3 style={{ color: "#72542b", marginTop: 0 }}>Edit Dividend History Data</h3>
          {dividends.map((dividend, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 2fr auto",
                gap: "10px",
                alignItems: "center",
                marginBottom: "10px",
                padding: "10px",
                backgroundColor: "#fdfcfb",
                borderRadius: "4px",
              }}
            >
              <input
                type="number"
                value={dividend.year}
                onChange={(e) => updateDividend(index, "year", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Year"
              />
              <input
                type="number"
                step="0.01"
                value={dividend.amount}
                onChange={(e) => updateDividend(index, "amount", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Amount per Share"
              />
              <input
                type="date"
                value={dividend.paymentDate}
                onChange={(e) => updateDividend(index, "paymentDate", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
              />
              <button
                onClick={() => removeDividend(index)}
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
              onClick={addDividend}
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
              Add Dividend
            </button>
            <button
              onClick={saveDividendData}
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

      {dividends.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#72542b",
          }}
        >
          <p>No dividend data available. {!isInvestorView && 'Click "Edit Data" to add your first dividend entry.'}</p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#f0e6d9",
            padding: "15px",
            borderRadius: "6px",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              color: "#5d4037",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid #d4c4b0",
                }}
              >
                <th style={{ padding: "12px", textAlign: "left" }}>Year</th>
                <th style={{ padding: "12px", textAlign: "right" }}>Amount per Share</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Payment Date</th>
              </tr>
            </thead>
            <tbody>
              {dividends
                .sort((a, b) => b.year - a.year)
                .map((div, index) => (
                  <tr
                    key={index}
                    style={{
                      borderBottom: "1px solid #e6d7c3",
                    }}
                  >
                    <td style={{ padding: "12px" }}>{div.year}</td>
                    <td style={{ padding: "12px", textAlign: "right" }}>R{div.amount.toFixed(2)}</td>
                    <td style={{ padding: "12px" }}>{div.paymentDate}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Main Capital Structure Component
const CapitalStructure = ({
  activeSection: parentActiveSection,
  viewMode: parentViewMode,
  user: parentUser,
  isInvestorView: parentIsInvestorView,
  isEmbedded = false,
}) => {
  const [activeSection, setActiveSection] = useState("cap-table")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const [isInvestorView, setIsInvestorView] = useState(parentIsInvestorView || false)
  const [viewingSMEId, setViewingSMEId] = useState(null)
  const [viewingSMEName, setViewingSMEName] = useState("")
  const [currentUser, setCurrentUser] = useState(parentUser || null)

  useEffect(() => {
    // Only check sessionStorage if not in embedded mode
    if (!isEmbedded) {
      const investorViewMode = sessionStorage.getItem("investorViewMode")
      const smeId = sessionStorage.getItem("viewingSMEId")
      const smeName = sessionStorage.getItem("viewingSMEName")

      if (investorViewMode === "true" && smeId) {
        setIsInvestorView(true)
        setViewingSMEId(smeId)
        setViewingSMEName(smeName || "SME")
        console.log("Investor view mode activated for SME:", smeId)
      }
    }
  }, [isEmbedded])

  useEffect(() => {
    // If embedded, use the parent user
    if (isEmbedded && parentUser) {
      setCurrentUser(parentUser)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (isInvestorView && viewingSMEId) {
        // In investor view, use the SME ID as the 'user' ID for data fetching
        setCurrentUser({ uid: viewingSMEId })
      } else {
        // Otherwise, use the actual authenticated user
        setCurrentUser(user)
      }
    })

    return () => unsubscribe()
  }, [isInvestorView, viewingSMEId, isEmbedded, parentUser])

  // Update investor view state from parent
  useEffect(() => {
    if (isEmbedded && parentIsInvestorView !== undefined) {
      setIsInvestorView(parentIsInvestorView)
    }
  }, [isEmbedded, parentIsInvestorView])

  const handleExitInvestorView = () => {
    sessionStorage.removeItem("viewingSMEId")
    sessionStorage.removeItem("viewingSMEName")
    sessionStorage.removeItem("investorViewMode")
    // Redirect to a relevant page after exiting investor view
    window.location.href = "/my-cohorts"
  }

  useEffect(() => {
    // Only track sidebar state if not embedded
    if (isEmbedded) return

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
  }, [isEmbedded])

  const getContentStyles = () => ({
    width: "100%",
    marginLeft: "0",
    backgroundColor: "#f7f3f0",
    minHeight: "100vh",
    padding: `70px 20px 20px ${isSidebarCollapsed ? "100px" : "270px"}`,
    transition: "padding 0.3s ease",
    boxSizing: "border-box",
  })

  const getEmbeddedContentStyles = () => ({
    width: "100%",
    backgroundColor: "transparent",
    padding: "0",
    boxSizing: "border-box",
  })

  const sectionButtons = [
    { id: "cap-table", label: "Cap Table" },
    { id: "irr-investments", label: "IRR on Investments" },
    { id: "investment-ratios", label: "Investment Ratios" },
    { id: "dividend-history", label: "Dividend History" },
    { id: "loan-repayments", label: "Loan Repayments" },
  ]

  if (isEmbedded) {
    return (
      <div style={getEmbeddedContentStyles()}>
        {isInvestorView && (
          <div
            style={{
              backgroundColor: "#e8f5e9",
              padding: "16px 20px",
              marginBottom: "20px",
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
                Investor View: Viewing {viewingSMEName}'s Capital Structure
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
            >
              Back to My Cohorts
            </button>
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
            padding: "15px",
            backgroundColor: "#fdfcfb",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            flexWrap: "wrap",
            overflowX: "auto",
          }}
        >
          {sectionButtons.map((button) => (
            <button
              key={button.id}
              onClick={() => setActiveSection(button.id)}
              style={{
                padding: "10px 20px",
                backgroundColor: activeSection === button.id ? "#4a352f" : "#e6d7c3",
                color: activeSection === button.id ? "#faf7f2" : "#4a352f",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                transition: "all 0.3s ease",
                whiteSpace: "nowrap",
              }}
            >
              {button.label}
            </button>
          ))}
        </div>

        <CapTable activeSection={activeSection} currentUser={currentUser} isInvestorView={isInvestorView} />
        <IRRInvestments activeSection={activeSection} currentUser={currentUser} isInvestorView={isInvestorView} />
        <InvestmentRatios activeSection={activeSection} currentUser={currentUser} isInvestorView={isInvestorView} />
        <DividendHistory activeSection={activeSection} currentUser={currentUser} isInvestorView={isInvestorView} />
        <LoanRepayments activeSection={activeSection} currentUser={currentUser} isInvestorView={isInvestorView} />
      </div>
    )
  }

  // Original standalone render with Sidebar and Header
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
                Investor View: Viewing {viewingSMEName}'s Capital Structure
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
              margin: "0 0 20px 0",
              padding: "15px",
              backgroundColor: "#fdfcfb",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              flexWrap: "wrap",
              overflowX: "auto",
            }}
          >
            {sectionButtons.map((button) => (
              <button
                key={button.id}
                onClick={() => setActiveSection(button.id)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: activeSection === button.id ? "#4a352f" : "#e6d7c3",
                  color: activeSection === button.id ? "#faf7f2" : "#4a352f",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                  transition: "all 0.3s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {button.label}
              </button>
            ))}
          </div>

          <CapTable activeSection={activeSection} currentUser={currentUser} isInvestorView={isInvestorView} />
          <IRRInvestments activeSection={activeSection} currentUser={currentUser} isInvestorView={isInvestorView} />
          <InvestmentRatios activeSection={activeSection} currentUser={currentUser} isInvestorView={isInvestorView} />
          <DividendHistory activeSection={activeSection} currentUser={currentUser} isInvestorView={isInvestorView} />
          <LoanRepayments activeSection={activeSection} currentUser={currentUser} isInvestorView={isInvestorView} />
        </div>
      </div>
    </div>
  )
}

export default CapitalStructure
