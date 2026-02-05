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

// Unified Data Entry Modal Component
const UnifiedDataEntryModal = ({ 
  isOpen, 
  onClose, 
  currentTab,
  user,
  onSave,
  loading 
}) => {
  const [activeModalTab, setActiveModalTab] = useState(currentTab)
  const [localData, setLocalData] = useState({})
  const [capabilityTrainingData, setCapabilityTrainingData] = useState({
    trainingSpendAmount: Array(12).fill(""),
    trainingSpendPercentage: Array(12).fill(""),
    trainingFocus: Array(12).fill(""),
  })
  const [employeeTrackingData, setEmployeeTrackingData] = useState([])
  const [stabilityData, setStabilityData] = useState({
    overallTurnover: Array(12).fill(""),
    workforceMovements: Array(12).fill(""),
    criticalRoleTurnover: Array(12).fill(""),
    contractorDependence: Array(12).fill(""),
  })
  const [terminationEntries, setTerminationEntries] = useState([])
  const [newTermination, setNewTermination] = useState({
    month: "Jan",
    reason: "",
    customReason: "",
    count: ""
  })
  const [employeeData, setEmployeeData] = useState({
    gender: { male: 60, female: 35, other: 5 },
    race: { african: 40, white: 30, colored: 15, indian: 10, other: 5 },
    age: { under25: 15, "25-34": 30, "35-44": 25, "45-54": 20, "55+": 10 },
    tenure: { under1: 20, "1-3": 35, "3-5": 25, "5-10": 15, "10+": 5 },
    education: { highSchool: 20, diploma: 25, degree: 40, postgraduate: 15 },
  })

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Predefined reasons for terminations
  const predefinedReasons = ["Performance", "Resignation", "Redundancy", "Misconduct", "Retirement", "Other"]

  // Tab structure for the modal
  const modalTabs = [
    { id: "execution-capacity", label: "Execution Capacity & Scalability" },
    { id: "productivity", label: "Productivity" },
    { id: "capability-training", label: "Capability & Training" },
    { id: "stability-continuity", label: "Stability & Continuity" },
    { id: "employee-composition", label: "Employee Composition" },
  ]

  // Fields for each tab
  const tabFields = {
    "execution-capacity": [
      {
        id: "founderLoad",
        label: "Founder operational load (1=low, 2=med, 3=high, 4=critical)",
        type: "select",
        options: [
          { value: "1", label: "Low" },
          { value: "2", label: "Medium" },
          { value: "3", label: "High" },
          { value: "4", label: "Critical" }
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
    ],
    "productivity": [
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
    ],
    "capability-training": [
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
    ],
    "stability-continuity": [
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
  }

  useEffect(() => {
    if (isOpen) {
      setActiveModalTab(currentTab)
      loadDataForTab(currentTab)
    }
  }, [isOpen, currentTab])

  const loadDataForTab = async (tabId) => {
    if (!user) return
    
    try {
      switch(tabId) {
        case "execution-capacity":
          const execDoc = await getDoc(doc(db, "peopleData", `${user.uid}_executionCapacity`))
          if (execDoc.exists()) {
            const data = execDoc.data()
            if (data.executionData) setLocalData(data.executionData)
          }
          break
        case "productivity":
          const prodDoc = await getDoc(doc(db, "peopleData", `${user.uid}_productivity`))
          if (prodDoc.exists()) {
            const data = prodDoc.data()
            if (data.productivityData) setLocalData(data.productivityData)
          }
          break
        case "capability-training":
          const capDoc = await getDoc(doc(db, "peopleData", `${user.uid}_capabilityTraining`))
          if (capDoc.exists()) {
            const data = capDoc.data()
            if (data.capabilityData) setCapabilityTrainingData(data.capabilityData)
          }
          
          const empDoc = await getDoc(doc(db, "peopleData", `${user.uid}_employeeTracking`))
          if (empDoc.exists()) {
            const data = empDoc.data()
            if (data.employees) setEmployeeTrackingData(data.employees)
          }
          break
        case "stability-continuity":
          const stabDoc = await getDoc(doc(db, "peopleData", `${user.uid}_stabilityContinuity`))
          if (stabDoc.exists()) {
            const data = stabDoc.data()
            if (data.stabilityData) setStabilityData(data.stabilityData)
          }
          
          const termDoc = await getDoc(doc(db, "peopleData", `${user.uid}_terminationData`))
          if (termDoc.exists()) {
            const data = termDoc.data()
            if (data.entries) setTerminationEntries(data.entries)
          }
          break
        case "employee-composition":
          const compDoc = await getDoc(doc(db, "peopleData", `${user.uid}_employeeComposition`))
          if (compDoc.exists()) {
            const data = compDoc.data()
            if (data.employeeData) setEmployeeData(data.employeeData)
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
      switch(activeModalTab) {
        case "execution-capacity":
          await setDoc(doc(db, "peopleData", `${user.uid}_executionCapacity`), {
            userId: user.uid,
            executionData: localData,
            lastUpdated: new Date().toISOString(),
          })
          break
        case "productivity":
          await setDoc(doc(db, "peopleData", `${user.uid}_productivity`), {
            userId: user.uid,
            productivityData: localData,
            lastUpdated: new Date().toISOString(),
          })
          break
        case "capability-training":
          await setDoc(doc(db, "peopleData", `${user.uid}_capabilityTraining`), {
            userId: user.uid,
            capabilityData: capabilityTrainingData,
            lastUpdated: new Date().toISOString(),
          })
          
          await setDoc(doc(db, "peopleData", `${user.uid}_employeeTracking`), {
            userId: user.uid,
            employees: employeeTrackingData,
            lastUpdated: new Date().toISOString(),
          })
          break
        case "stability-continuity":
          await setDoc(doc(db, "peopleData", `${user.uid}_stabilityContinuity`), {
            userId: user.uid,
            stabilityData: stabilityData,
            lastUpdated: new Date().toISOString(),
          })
          
          await setDoc(doc(db, "peopleData", `${user.uid}_terminationData`), {
            userId: user.uid,
            entries: terminationEntries,
            lastUpdated: new Date().toISOString(),
          })
          break
        case "employee-composition":
          await setDoc(doc(db, "peopleData", `${user.uid}_employeeComposition`), {
            userId: user.uid,
            employeeData: employeeData,
            lastUpdated: new Date().toISOString(),
          })
          break
      }
      
      onSave()
      onClose()
      alert("Data saved successfully!")
    } catch (error) {
      console.error("Error saving data:", error)
      alert("Error saving data. Please try again.")
    }
  }

  const addTerminationEntry = () => {
    if (!newTermination.reason || !newTermination.count || !newTermination.month) {
      alert("Please select month, reason, and enter count")
      return
    }

    const reasonToSave = newTermination.reason === "Other" ? newTermination.customReason : newTermination.reason
    
    if (!reasonToSave.trim()) {
      alert("Please specify the reason")
      return
    }

    const newEntry = {
      id: Date.now(),
      month: newTermination.month,
      reason: reasonToSave,
      count: Number.parseInt(newTermination.count) || 0,
      dateAdded: new Date().toISOString()
    }

    setTerminationEntries([...terminationEntries, newEntry])
    
    // Reset form
    setNewTermination({
      month: "Jan",
      reason: "",
      customReason: "",
      count: ""
    })
  }

  const removeTerminationEntry = (id) => {
    setTerminationEntries(terminationEntries.filter(entry => entry.id !== id))
  }

  const addEmployeeTrackingEntry = () => {
    const newEntry = {
      id: employeeTrackingData.length + 1,
      employee: `Employee ${employeeTrackingData.length + 1}`,
      skillsGap: { date: "", status: "No" },
      idp: { date: "", status: "No" },
      midTermReview: { date: "", status: "No" },
      annualReview: { date: "", status: "No" }
    }
    
    setEmployeeTrackingData([...employeeTrackingData, newEntry])
  }

  const removeEmployeeTrackingEntry = (index) => {
    const newData = employeeTrackingData.filter((_, i) => i !== index)
    setEmployeeTrackingData(newData)
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
          maxWidth: "1200px",
          maxHeight: "90vh",
          overflow: "auto",
          width: "95%",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ color: "#5d4037" }}>Add Data</h3>
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

        {/* Tab Navigation inside Modal */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
          {modalTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveModalTab(tab.id)
                loadDataForTab(tab.id)
              }}
              style={{
                padding: "10px 20px",
                backgroundColor: activeModalTab === tab.id ? "#5d4037" : "#e8ddd4",
                color: activeModalTab === tab.id ? "#fdfcfb" : "#5d4037",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              {tab.label}
            </button>
          ))}
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

        {/* Tab Content */}
        <div style={{ marginBottom: "30px" }}>
          {/* Execution Capacity & Productivity Tabs */}
          {["execution-capacity", "productivity", "stability-continuity"].includes(activeModalTab) && tabFields[activeModalTab] && (
            <div style={{ marginBottom: "30px", padding: "15px", backgroundColor: "#f5f0eb", borderRadius: "8px" }}>
              <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>Monthly Values</h4>
              {tabFields[activeModalTab].map((field) => (
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
          )}

          {/* Capability & Training Tab */}
          {activeModalTab === "capability-training" && (
            <>
              {/* Training Data */}
              <div style={{ marginBottom: "30px", padding: "15px", backgroundColor: "#f5f0eb", borderRadius: "8px" }}>
                <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>Training Data - Monthly Values</h4>
                {tabFields[activeModalTab].map((field) => (
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
                              value={capabilityTrainingData[field.id]?.[idx] || ""}
                              onChange={(e) => {
                                const newData = { ...capabilityTrainingData }
                                if (!newData[field.id]) newData[field.id] = Array(12).fill("")
                                newData[field.id][idx] = e.target.value
                                setCapabilityTrainingData(newData)
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
                              value={capabilityTrainingData[field.id]?.[idx] || ""}
                              onChange={(e) => {
                                const newData = { ...capabilityTrainingData }
                                if (!newData[field.id]) newData[field.id] = Array(12).fill("")
                                newData[field.id][idx] = e.target.value
                                setCapabilityTrainingData(newData)
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

              {/* Employee Tracking */}
              <div style={{ marginBottom: "30px", padding: "15px", backgroundColor: "#f5f0eb", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <h4 style={{ color: "#5d4037", margin: 0 }}>Employee Development Tracking</h4>
                  <button
                    onClick={addEmployeeTrackingEntry}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#5d4037",
                      color: "#fdfcfb",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "13px",
                    }}
                  >
                    + Add Employee
                  </button>
                </div>

                {employeeTrackingData.map((employee, index) => (
                  <div key={employee.id || index} style={{ marginBottom: "30px", padding: "20px", backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #e8ddd4" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                      <input
                        type="text"
                        value={employee.employee}
                        onChange={(e) => {
                          const newData = [...employeeTrackingData]
                          newData[index].employee = e.target.value
                          setEmployeeTrackingData(newData)
                        }}
                        placeholder="Employee Name"
                        style={{
                          padding: "10px",
                          borderRadius: "4px",
                          border: "1px solid #e8ddd4",
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#5d4037",
                          width: "300px",
                        }}
                      />
                      <button
                        onClick={() => removeEmployeeTrackingEntry(index)}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#f44336",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "13px",
                        }}
                      >
                        Remove
                      </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
                      {/* Skills Gap Assessment */}
                      <div>
                        <h5 style={{ color: "#5d4037", marginBottom: "10px", fontSize: "14px" }}>Skills Gap Assessment</h5>
                        <input
                          type="date"
                          value={employee.skillsGap?.date || ""}
                          onChange={(e) => {
                            const newData = [...employeeTrackingData]
                            if (!newData[index].skillsGap) newData[index].skillsGap = {}
                            newData[index].skillsGap.date = e.target.value
                            setEmployeeTrackingData(newData)
                          }}
                          style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #e8ddd4",
                            marginBottom: "10px",
                          }}
                        />
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            onClick={() => {
                              const newData = [...employeeTrackingData]
                              if (!newData[index].skillsGap) newData[index].skillsGap = {}
                              newData[index].skillsGap.status = "Yes"
                              setEmployeeTrackingData(newData)
                            }}
                            style={{
                              flex: "1",
                              padding: "8px",
                              backgroundColor: employee.skillsGap?.status === "Yes" ? "#4caf50" : "#e8e8e8",
                              color: employee.skillsGap?.status === "Yes" ? "#fff" : "#5d4037",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => {
                              const newData = [...employeeTrackingData]
                              if (!newData[index].skillsGap) newData[index].skillsGap = {}
                              newData[index].skillsGap.status = "No"
                              setEmployeeTrackingData(newData)
                            }}
                            style={{
                              flex: "1",
                              padding: "8px",
                              backgroundColor: employee.skillsGap?.status === "No" ? "#f44336" : "#e8e8e8",
                              color: employee.skillsGap?.status === "No" ? "#fff" : "#5d4037",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            No
                          </button>
                        </div>
                      </div>

                      {/* IDP */}
                      <div>
                        <h5 style={{ color: "#5d4037", marginBottom: "10px", fontSize: "14px" }}>Individual Development Plan</h5>
                        <input
                          type="date"
                          value={employee.idp?.date || ""}
                          onChange={(e) => {
                            const newData = [...employeeTrackingData]
                            if (!newData[index].idp) newData[index].idp = {}
                            newData[index].idp.date = e.target.value
                            setEmployeeTrackingData(newData)
                          }}
                          style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #e8ddd4",
                            marginBottom: "10px",
                          }}
                        />
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            onClick={() => {
                              const newData = [...employeeTrackingData]
                              if (!newData[index].idp) newData[index].idp = {}
                              newData[index].idp.status = "Yes"
                              setEmployeeTrackingData(newData)
                            }}
                            style={{
                              flex: "1",
                              padding: "8px",
                              backgroundColor: employee.idp?.status === "Yes" ? "#4caf50" : "#e8e8e8",
                              color: employee.idp?.status === "Yes" ? "#fff" : "#5d4037",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => {
                              const newData = [...employeeTrackingData]
                              if (!newData[index].idp) newData[index].idp = {}
                              newData[index].idp.status = "No"
                              setEmployeeTrackingData(newData)
                            }}
                            style={{
                              flex: "1",
                              padding: "8px",
                              backgroundColor: employee.idp?.status === "No" ? "#f44336" : "#e8e8e8",
                              color: employee.idp?.status === "No" ? "#fff" : "#5d4037",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            No
                          </button>
                        </div>
                      </div>

                      {/* Mid-Term Review */}
                      <div>
                        <h5 style={{ color: "#5d4037", marginBottom: "10px", fontSize: "14px" }}>Mid-Term Performance Review</h5>
                        <input
                          type="date"
                          value={employee.midTermReview?.date || ""}
                          onChange={(e) => {
                            const newData = [...employeeTrackingData]
                            if (!newData[index].midTermReview) newData[index].midTermReview = {}
                            newData[index].midTermReview.date = e.target.value
                            setEmployeeTrackingData(newData)
                          }}
                          style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #e8ddd4",
                            marginBottom: "10px",
                          }}
                        />
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            onClick={() => {
                              const newData = [...employeeTrackingData]
                              if (!newData[index].midTermReview) newData[index].midTermReview = {}
                              newData[index].midTermReview.status = "Yes"
                              setEmployeeTrackingData(newData)
                            }}
                            style={{
                              flex: "1",
                              padding: "8px",
                              backgroundColor: employee.midTermReview?.status === "Yes" ? "#4caf50" : "#e8e8e8",
                              color: employee.midTermReview?.status === "Yes" ? "#fff" : "#5d4037",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => {
                              const newData = [...employeeTrackingData]
                              if (!newData[index].midTermReview) newData[index].midTermReview = {}
                              newData[index].midTermReview.status = "No"
                              setEmployeeTrackingData(newData)
                            }}
                            style={{
                              flex: "1",
                              padding: "8px",
                              backgroundColor: employee.midTermReview?.status === "No" ? "#f44336" : "#e8e8e8",
                              color: employee.midTermReview?.status === "No" ? "#fff" : "#5d4037",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            No
                          </button>
                        </div>
                      </div>

                      {/* Annual Review */}
                      <div>
                        <h5 style={{ color: "#5d4037", marginBottom: "10px", fontSize: "14px" }}>Annual Performance Review</h5>
                        <input
                          type="date"
                          value={employee.annualReview?.date || ""}
                          onChange={(e) => {
                            const newData = [...employeeTrackingData]
                            if (!newData[index].annualReview) newData[index].annualReview = {}
                            newData[index].annualReview.date = e.target.value
                            setEmployeeTrackingData(newData)
                          }}
                          style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #e8ddd4",
                            marginBottom: "10px",
                          }}
                        />
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            onClick={() => {
                              const newData = [...employeeTrackingData]
                              if (!newData[index].annualReview) newData[index].annualReview = {}
                              newData[index].annualReview.status = "Yes"
                              setEmployeeTrackingData(newData)
                            }}
                            style={{
                              flex: "1",
                              padding: "8px",
                              backgroundColor: employee.annualReview?.status === "Yes" ? "#4caf50" : "#e8e8e8",
                              color: employee.annualReview?.status === "Yes" ? "#fff" : "#5d4037",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => {
                              const newData = [...employeeTrackingData]
                              if (!newData[index].annualReview) newData[index].annualReview = {}
                              newData[index].annualReview.status = "No"
                              setEmployeeTrackingData(newData)
                            }}
                            style={{
                              flex: "1",
                              padding: "8px",
                              backgroundColor: employee.annualReview?.status === "No" ? "#f44336" : "#e8e8e8",
                              color: employee.annualReview?.status === "No" ? "#fff" : "#5d4037",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            No
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Termination Data for Stability & Continuity */}
          {activeModalTab === "stability-continuity" && (
            <div style={{ marginBottom: "30px", padding: "15px", backgroundColor: "#f5f0eb", borderRadius: "8px" }}>
              <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>Termination Records</h4>
              
              {/* Add New Termination Form */}
              <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#fff", borderRadius: "6px", border: "1px solid #e8ddd4" }}>
                <h5 style={{ color: "#5d4037", marginBottom: "15px" }}>Add New Termination Record</h5>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                  {/* Month Selection */}
                  <div>
                    <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>
                      Month
                    </label>
                    <select
                      value={newTermination.month}
                      onChange={(e) => setNewTermination({...newTermination, month: e.target.value})}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        fontSize: "13px",
                        color: "#5d4037",
                      }}
                    >
                      {months.map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </div>

                  {/* Reason Selection */}
                  <div>
                    <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>
                      Reason
                    </label>
                    <select
                      value={newTermination.reason}
                      onChange={(e) => setNewTermination({...newTermination, reason: e.target.value})}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        fontSize: "13px",
                        color: "#5d4037",
                      }}
                    >
                      <option value="">Select a reason</option>
                      {predefinedReasons.map(reason => (
                        <option key={reason} value={reason}>{reason}</option>
                      ))}
                    </select>
                  </div>

                  {/* Count Input */}
                  <div>
                    <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>
                      Number of People
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newTermination.count}
                      onChange={(e) => setNewTermination({...newTermination, count: e.target.value})}
                      placeholder="0"
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        fontSize: "13px",
                        color: "#5d4037",
                      }}
                    />
                  </div>
                </div>

                {/* Custom Reason (if Other is selected) */}
                {newTermination.reason === "Other" && (
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", color: "#5d4037", marginBottom: "5px", fontSize: "13px", fontWeight: "600" }}>
                      Specify Reason
                    </label>
                    <input
                      type="text"
                      value={newTermination.customReason}
                      onChange={(e) => setNewTermination({...newTermination, customReason: e.target.value})}
                      placeholder="Enter custom reason..."
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        fontSize: "13px",
                        color: "#5d4037",
                      }}
                    />
                  </div>
                )}

                <button
                  onClick={addTerminationEntry}
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
                  + Add Termination Record
                </button>
              </div>

              {/* Current Termination Entries */}
              <div>
                <h5 style={{ color: "#5d4037", marginBottom: "15px" }}>Current Termination Records ({terminationEntries.length})</h5>
                
                {terminationEntries.length > 0 ? (
                  <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {terminationEntries.map((entry, index) => (
                      <div key={entry.id} style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px",
                        marginBottom: "8px",
                        backgroundColor: index % 2 === 0 ? "#fdfcfb" : "#f5f0eb",
                        borderRadius: "6px",
                        border: "1px solid #e8ddd4"
                      }}>
                        <div>
                          <span style={{ color: "#5d4037", fontWeight: "600", marginRight: "10px" }}>{entry.month}</span>
                          <span style={{ color: "#5d4037", marginRight: "10px" }}>{entry.reason}</span>
                          <span style={{
                            padding: "2px 6px",
                            backgroundColor: "#e3f2fd",
                            color: "#1565c0",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "600"
                          }}>
                            {entry.count} person{entry.count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <button
                          onClick={() => removeTerminationEntry(entry.id)}
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#f44336",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "11px",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: "20px", textAlign: "center", color: "#8d6e63", backgroundColor: "#fff", borderRadius: "6px" }}>
                    No termination records added yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Employee Composition Tab */}
          {activeModalTab === "employee-composition" && (
            <div style={{ marginBottom: "30px" }}>
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
          )}
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
    founderLoad: Array(12).fill(""), // low=1, med=2, high=3, critical=4
    criticalFunctionsSinglePoint: Array(12).fill(""), // percentage
    criticalRolesWith2IC: Array(12).fill(""), // percentage
    spanOfControl: Array(12).fill(""), // average number
  })

  // Helper functions
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

  // Status calculation based on values
  const getStatus = (value, type) => {
    if (!value && value !== 0) return { text: "Not Set", color: "#f5f5f5", textColor: "#5d4037" }
    
    const numValue = Number.parseFloat(value)
    
    switch(type) {
      case "founderLoad":
        if (value === "1") return { text: "Low", color: "#4caf50", textColor: "#fff" } // Green
        if (value === "2") return { text: "Medium", color: "#ff9800", textColor: "#fff" } // Orange
        if (value === "3") return { text: "High", color: "#f44336", textColor: "#fff" } // Red
        if (value === "4") return { text: "Critical", color: "#d32f2f", textColor: "#fff" } // Dark Red
        return { text: "Not Set", color: "#f5f5f5", textColor: "#5d4037" }
      
      case "criticalFunctionsSinglePoint":
        if (numValue < 20) return { text: "Low", color: "#4caf50", textColor: "#fff" }
        if (numValue <= 40) return { text: "Medium", color: "#ff9800", textColor: "#fff" }
        if (numValue <= 60) return { text: "High", color: "#f44336", textColor: "#fff" }
        return { text: "Critical", color: "#d32f2f", textColor: "#fff" }
      
      case "criticalRolesWith2IC":
        if (numValue >= 80) return { text: "Good", color: "#4caf50", textColor: "#fff" }
        if (numValue >= 60) return { text: "Medium", color: "#ff9800", textColor: "#fff" }
        if (numValue >= 40) return { text: "Low", color: "#f44336", textColor: "#fff" }
        return { text: "Critical", color: "#d32f2f", textColor: "#fff" }
      
      case "spanOfControl":
        if (numValue >= 5 && numValue <= 8) return { text: "Optimal", color: "#4caf50", textColor: "#fff" }
        if (numValue < 3 || numValue > 12) return { text: "Critical", color: "#d32f2f", textColor: "#fff" }
        if (numValue < 5 || numValue > 8) return { text: "Review", color: "#ff9800", textColor: "#fff" }
        return { text: "Not Set", color: "#f5f5f5", textColor: "#5d4037" }
      
      default:
        return { text: "Not Set", color: "#f5f5f5", textColor: "#5d4037" }
    }
  }

  const renderSpanOfControlTable = () => {
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
          <h4 style={{ color: "#5d4037", marginBottom: "5px", fontSize: "16px" }}>Average Span of Control</h4>
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
                  Average Number
                </td>
                {months.map((month, idx) => {
                  const value = executionData.spanOfControl[idx]
                  const status = getStatus(value, "spanOfControl")
                  
                  return (
                    <td key={month} style={{ padding: "10px", textAlign: "center" }}>
                      <div
                        style={{
                          padding: "8px 4px",
                          backgroundColor: status.color,
                          color: status.textColor,
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "600",
                          minWidth: "60px",
                        }}
                      >
                        {value ? `${value} (${status.text})` : "Not Set"}
                      </div>
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
        
        <div style={{ marginTop: "15px", color: "#8d6e63", fontSize: "12px" }}>
          <strong>Guidelines:</strong> Optimal: 5-8, Review: &lt;3 or &gt;8, Critical: &lt;3 or &gt;12
        </div>
      </div>
    )
  }

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
                  const status = getStatus(value, "founderLoad")
                  
                  return (
                    <td key={month} style={{ padding: "10px", textAlign: "center" }}>
                      <div
                        style={{
                          padding: "8px 4px",
                          backgroundColor: status.color,
                          color: status.textColor,
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "600",
                          minWidth: "60px",
                        }}
                      >
                        {status.text}
                      </div>
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
        
        <div style={{ marginTop: "15px", color: "#8d6e63", fontSize: "12px" }}>
          <strong>Legend:</strong> Low = 1, Medium = 2, High = 3, Critical = 4
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
    const status = getStatus(currentValue.toString(), kpiKey)

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
              <div
                style={{
                  padding: "4px 8px",
                  backgroundColor: status.color,
                  color: status.textColor,
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: "600",
                }}
              >
                {status.text}
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

  if (activeSection !== "execution-capacity") return null

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

      {/* Average Span of Control Table */}
      {renderSpanOfControlTable()}

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
      </div>

      {/* Unified Data Entry Modal */}
      <UnifiedDataEntryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentTab="execution-capacity"
        user={user}
        onSave={loadExecutionData}
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

      {/* Unified Data Entry Modal */}
      <UnifiedDataEntryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentTab="productivity"
        user={user}
        onSave={loadProductivityData}
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
  
  // Data structure for detailed employee tracking
  const [employeeTrackingData, setEmployeeTrackingData] = useState([])
  
  // Data structure for capability & training KPIs
  const [capabilityData, setCapabilityData] = useState({
    trainingSpendAmount: Array(12).fill(""), // R amount
    trainingSpendPercentage: Array(12).fill(""), // % of payroll
    trainingFocus: Array(12).fill(""), // 1=technical, 2=leadership, 3=compliance
  })

  useEffect(() => {
    if (user) {
      loadCapabilityData()
      loadEmployeeTrackingData()
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

  const loadEmployeeTrackingData = async () => {
    if (!user) return
    try {
      const employeeDoc = await getDoc(doc(db, "peopleData", `${user.uid}_employeeTracking`))
      if (employeeDoc.exists()) {
        const data = employeeDoc.data()
        if (data.employees) setEmployeeTrackingData(data.employees)
      }
    } catch (error) {
      console.error("Error loading employee tracking data:", error)
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

  // Render Employee Tracking Table with Date and Yes/No statuses
  const renderEmployeeTrackingTable = () => {
    // Calculate summary statistics
    const totalEmployees = employeeTrackingData.length
    const skillsGapDone = employeeTrackingData.filter(e => e.skillsGap?.status === "Yes").length
    const idpDone = employeeTrackingData.filter(e => e.idp?.status === "Yes").length
    const midTermReviewDone = employeeTrackingData.filter(e => e.midTermReview?.status === "Yes").length
    const annualReviewDone = employeeTrackingData.filter(e => e.annualReview?.status === "Yes").length

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
          <h4 style={{ color: "#5d4037", marginBottom: "5px", fontSize: "16px" }}>Employee Development Tracking</h4>
        </div>
        
        {/* Summary Statistics */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(5, 1fr)", 
          gap: "15px", 
          marginBottom: "20px",
          padding: "15px",
          backgroundColor: "#f5f0eb",
          borderRadius: "6px"
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#5d4037" }}>{totalEmployees}</div>
            <div style={{ fontSize: "12px", color: "#8d6e63" }}>Total Employees</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: skillsGapDone > 0 ? "#4caf50" : "#f44336" }}>
              {skillsGapDone}/{totalEmployees}
            </div>
            <div style={{ fontSize: "12px", color: "#8d6e63" }}>Skills Gap Done</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: idpDone > 0 ? "#4caf50" : "#f44336" }}>
              {idpDone}/{totalEmployees}
            </div>
            <div style={{ fontSize: "12px", color: "#8d6e63" }}>IDP Done</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: midTermReviewDone > 0 ? "#4caf50" : "#f44336" }}>
              {midTermReviewDone}/{totalEmployees}
            </div>
            <div style={{ fontSize: "12px", color: "#8d6e63" }}>Mid-Term Review Done</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: annualReviewDone > 0 ? "#4caf50" : "#f44336" }}>
              {annualReviewDone}/{totalEmployees}
            </div>
            <div style={{ fontSize: "12px", color: "#8d6e63" }}>Annual Review Done</div>
          </div>
        </div>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ backgroundColor: "#e8ddd4" }}>
                <th style={{ padding: "12px", textAlign: "left", color: "#5d4037", borderBottom: "2px solid #5d4037" }}>Employee</th>
                
                {/* Skills Gap Assessment */}
                <th style={{ padding: "12px", textAlign: "center", color: "#5d4037", borderBottom: "2px solid #5d4037" }} colSpan="2">
                  Skills Gap Assessment Done?
                </th>
                
                {/* IDP */}
                <th style={{ padding: "12px", textAlign: "center", color: "#5d4037", borderBottom: "2px solid #5d4037" }} colSpan="2">
                  IDP Done?
                </th>
                
                {/* Mid-Term Review */}
                <th style={{ padding: "12px", textAlign: "center", color: "#5d4037", borderBottom: "2px solid #5d4037" }} colSpan="2">
                  Mid-Term Performance Review Done?
                </th>
                
                {/* Annual Review */}
                <th style={{ padding: "12px", textAlign: "center", color: "#5d4037", borderBottom: "2px solid #5d4037" }} colSpan="2">
                  Annual Performance Review Done?
                </th>
              </tr>
              
              {/* Sub-headers for Date and Status */}
              <tr style={{ backgroundColor: "#f5f0eb" }}>
                <th style={{ padding: "8px", textAlign: "left", color: "#5d4037", fontSize: "12px" }}></th>
                
                {/* Skills Gap sub-headers */}
                <th style={{ padding: "8px", textAlign: "center", color: "#5d4037", fontSize: "12px" }}>Date</th>
                <th style={{ padding: "8px", textAlign: "center", color: "#5d4037", fontSize: "12px" }}>Status</th>
                
                {/* IDP sub-headers */}
                <th style={{ padding: "8px", textAlign: "center", color: "#5d4037", fontSize: "12px" }}>Date</th>
                <th style={{ padding: "8px", textAlign: "center", color: "#5d4037", fontSize: "12px" }}>Status</th>
                
                {/* Mid-Term Review sub-headers */}
                <th style={{ padding: "8px", textAlign: "center", color: "#5d4037", fontSize: "12px" }}>Date</th>
                <th style={{ padding: "8px", textAlign: "center", color: "#5d4037", fontSize: "12px" }}>Status</th>
                
                {/* Annual Review sub-headers */}
                <th style={{ padding: "8px", textAlign: "center", color: "#5d4037", fontSize: "12px" }}>Date</th>
                <th style={{ padding: "8px", textAlign: "center", color: "#5d4037", fontSize: "12px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {employeeTrackingData.length > 0 ? (
                employeeTrackingData.map((employee, index) => (
                  <tr key={employee.id || index} style={{ borderBottom: "1px solid #e8ddd4" }}>
                    <td style={{ padding: "12px", color: "#5d4037", fontWeight: "600" }}>{employee.employee}</td>
                    
                    {/* Skills Gap - Date and Status */}
                    <td style={{ padding: "12px", textAlign: "center", color: "#5d4037" }}>
                      {employee.skillsGap?.date ? new Date(employee.skillsGap.date).toLocaleDateString() : "-"}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px"
                      }}>
                        <div style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: employee.skillsGap?.status === "Yes" ? "#4caf50" : "#f44336",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: "10px",
                          fontWeight: "bold"
                        }}>
                          {employee.skillsGap?.status === "Yes" ? "✓" : "✗"}
                        </div>
                        <span style={{
                          padding: "4px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "600",
                          backgroundColor: employee.skillsGap?.status === "Yes" ? "#4caf50" : "#f44336",
                          color: "#fff"
                        }}>
                          {employee.skillsGap?.status === "Yes" ? "Yes" : "No"}
                        </span>
                      </div>
                    </td>
                    
                    {/* IDP - Date and Status */}
                    <td style={{ padding: "12px", textAlign: "center", color: "#5d4037" }}>
                      {employee.idp?.date ? new Date(employee.idp.date).toLocaleDateString() : "-"}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px"
                      }}>
                        <div style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: employee.idp?.status === "Yes" ? "#4caf50" : "#f44336",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: "10px",
                          fontWeight: "bold"
                        }}>
                          {employee.idp?.status === "Yes" ? "✓" : "✗"}
                        </div>
                        <span style={{
                          padding: "4px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "600",
                          backgroundColor: employee.idp?.status === "Yes" ? "#4caf50" : "#f44336",
                          color: "#fff"
                        }}>
                          {employee.idp?.status === "Yes" ? "Yes" : "No"}
                        </span>
                      </div>
                    </td>
                    
                    {/* Mid-Term Review - Date and Status */}
                    <td style={{ padding: "12px", textAlign: "center", color: "#5d4037" }}>
                      {employee.midTermReview?.date ? new Date(employee.midTermReview.date).toLocaleDateString() : "-"}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px"
                      }}>
                        <div style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: employee.midTermReview?.status === "Yes" ? "#4caf50" : "#f44336",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: "10px",
                          fontWeight: "bold"
                        }}>
                          {employee.midTermReview?.status === "Yes" ? "✓" : "✗"}
                        </div>
                        <span style={{
                          padding: "4px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "600",
                          backgroundColor: employee.midTermReview?.status === "Yes" ? "#4caf50" : "#f44336",
                          color: "#fff"
                        }}>
                          {employee.midTermReview?.status === "Yes" ? "Yes" : "No"}
                        </span>
                      </div>
                    </td>
                    
                    {/* Annual Review - Date and Status */}
                    <td style={{ padding: "12px", textAlign: "center", color: "#5d4037" }}>
                      {employee.annualReview?.date ? new Date(employee.annualReview.date).toLocaleDateString() : "-"}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px"
                      }}>
                        <div style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: employee.annualReview?.status === "Yes" ? "#4caf50" : "#f44336",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: "10px",
                          fontWeight: "bold"
                        }}>
                          {employee.annualReview?.status === "Yes" ? "✓" : "✗"}
                        </div>
                        <span style={{
                          padding: "4px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "600",
                          backgroundColor: employee.annualReview?.status === "Yes" ? "#4caf50" : "#f44336",
                          color: "#fff"
                        }}>
                          {employee.annualReview?.status === "Yes" ? "Yes" : "No"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ padding: "20px", textAlign: "center", color: "#8d6e63" }}>
                    No employee data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div style={{ marginTop: "15px", color: "#8d6e63", fontSize: "12px", display: "flex", gap: "20px" }}>
          <div>
            <strong>Legend:</strong> 
            <span style={{ marginLeft: "10px", padding: "2px 8px", backgroundColor: "#4caf50", color: "#fff", borderRadius: "4px" }}>Yes ✓</span>
            <span style={{ marginLeft: "10px", padding: "2px 8px", backgroundColor: "#f44336", color: "#fff", borderRadius: "4px" }}>No ✗</span>
          </div>
        </div>
      </div>
    )
  }

  // Updated renderKPICard to show R instead of $
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
          flex: "1",
          minWidth: "350px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <div>
            <h4 style={{ color: "#5d4037", marginBottom: "5px", fontSize: "16px" }}>{title}</h4>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#5d4037" }}>
                {isPercentage ? `${currentValue.toFixed(1)}%` : 
                 isCurrency ? `R${currentValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 
                 kpiKey === "trainingFocus" ? 
                   currentValue === 1 ? "Technical" : currentValue === 2 ? "Leadership" : currentValue === 3 ? "Compliance" : "Not Set" :
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

        <div style={{ height: "200px", marginBottom: "20px" }}>
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
                  callbacks: {
                    label: function(context) {
                      if (isCurrency) {
                        return `R${context.parsed.y.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                      } else if (isPercentage) {
                        return `${context.parsed.y.toFixed(1)}%`
                      } else if (kpiKey === "trainingFocus") {
                        const value = context.parsed.y
                        return value === 1 ? "Technical" : value === 2 ? "Leadership" : value === 3 ? "Compliance" : "Not Set"
                      }
                      return context.parsed.y.toFixed(1)
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
                    callback: function(value) {
                      if (isCurrency) {
                        return `R${value.toLocaleString()}`
                      } else if (isPercentage) {
                        return `${value}%`
                      }
                      return value
                    }
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

      {/* Employee Tracking Table */}
      {renderEmployeeTrackingTable()}

      {/* Charts in one line - 3 charts side by side */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          marginBottom: "30px",
          flexWrap: "wrap",
        }}
      >
        {renderKPICard("Training Spend (R)", capabilityData.trainingSpendAmount, "trainingSpendAmount", "", false, true)}
        {renderKPICard("Training Spend (% of payroll)", capabilityData.trainingSpendPercentage, "trainingSpendPercentage", "", true)}
        {renderKPICard("Training Focus", capabilityData.trainingFocus, "trainingFocus", "Type")}
      </div>

      {/* Unified Data Entry Modal */}
      <UnifiedDataEntryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentTab="capability-training"
        user={user}
        onSave={() => {
          loadCapabilityData()
          loadEmployeeTrackingData()
        }}
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
    criticalRoleTurnover: Array(12).fill(""), // percentage
    contractorDependence: Array(12).fill(""), // percentage
  })

  // Data structure for termination entries
  const [terminationEntries, setTerminationEntries] = useState([])

  const monthOptions = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  useEffect(() => {
    if (user) {
      loadStabilityData()
      loadTerminationData()
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

  const loadTerminationData = async () => {
    if (!user) return
    try {
      const terminationDoc = await getDoc(doc(db, "peopleData", `${user.uid}_terminationData`))
      if (terminationDoc.exists()) {
        const data = terminationDoc.data()
        if (data.entries) setTerminationEntries(data.entries)
      }
    } catch (error) {
      console.error("Error loading termination data:", error)
    }
  }

  // Calculate summary statistics
  const calculateTerminationSummary = () => {
    const summary = {
      total: 0,
      byMonth: {},
      byReason: {}
    }

    terminationEntries.forEach(entry => {
      // Total
      summary.total += entry.count

      // By month
      if (!summary.byMonth[entry.month]) {
        summary.byMonth[entry.month] = 0
      }
      summary.byMonth[entry.month] += entry.count

      // By reason
      if (!summary.byReason[entry.reason]) {
        summary.byReason[entry.reason] = 0
      }
      summary.byReason[entry.reason] += entry.count
    })

    return summary
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

  // Render termination reasons table - FIXED TABLE STRUCTURE
  const renderTerminationReasonsTable = () => {
    const summary = calculateTerminationSummary()

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
        
        {/* Summary Statistics */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(4, 1fr)", 
          gap: "15px", 
          marginBottom: "20px",
          padding: "15px",
          backgroundColor: "#f5f0eb",
          borderRadius: "6px"
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#5d4037" }}>{summary.total}</div>
            <div style={{ fontSize: "12px", color: "#8d6e63" }}>Total Terminations</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#5d4037" }}>{terminationEntries.length}</div>
            <div style={{ fontSize: "12px", color: "#8d6e63" }}>Termination Records</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#5d4037" }}>
              {Object.keys(summary.byMonth).length}
            </div>
            <div style={{ fontSize: "12px", color: "#8d6e63" }}>Months with Data</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#5d4037" }}>
              {Object.keys(summary.byReason).length}
            </div>
            <div style={{ fontSize: "12px", color: "#8d6e63" }}>Unique Reasons</div>
          </div>
        </div>
        
        {/* Termination Entries Table - FIXED STRUCTURE: Months in rows, Reasons in columns */}
        <div style={{ overflowX: "auto" }}>
          {terminationEntries.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ backgroundColor: "#e8ddd4" }}>
                  <th style={{ padding: "12px", textAlign: "left", color: "#5d4037", borderBottom: "2px solid #5d4037" }}>
                    Month
                  </th>
                  {Array.from(new Set(terminationEntries.map(e => e.reason))).map(reason => (
                    <th key={reason} style={{ padding: "12px", textAlign: "center", color: "#5d4037", borderBottom: "2px solid #5d4037" }}>
                      {reason}
                    </th>
                  ))}
                  <th style={{ padding: "12px", textAlign: "center", color: "#5d4037", borderBottom: "2px solid #5d4037", backgroundColor: "#d7ccc8" }}>
                    Monthly Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthOptions.map(month => {
                  // Filter entries for this month
                  const monthEntries = terminationEntries.filter(entry => entry.month === month)
                  if (monthEntries.length === 0) return null
                  
                  const monthTotal = monthEntries.reduce((sum, entry) => sum + entry.count, 0)
                  
                  return (
                    <tr key={month} style={{ borderBottom: "1px solid #e8ddd4" }}>
                      <td style={{ padding: "12px", color: "#5d4037", fontWeight: "600" }}>
                        {month}
                      </td>
                      {Array.from(new Set(terminationEntries.map(e => e.reason))).map(reason => {
                        const entry = monthEntries.find(e => e.reason === reason)
                        return (
                          <td key={`${month}-${reason}`} style={{ padding: "12px", textAlign: "center", color: "#5d4037" }}>
                            {entry ? (
                              <span style={{
                                padding: "4px 8px",
                                backgroundColor: entry.count > 0 ? "#ffebee" : "#e8f5e9",
                                color: entry.count > 0 ? "#c62828" : "#2e7d32",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: "600"
                              }}>
                                {entry.count}
                              </span>
                            ) : "-"}
                          </td>
                        )
                      })}
                      <td style={{ 
                        padding: "12px", 
                        textAlign: "center", 
                        color: "#5d4037",
                        fontWeight: "700",
                        backgroundColor: "#f5f0eb"
                      }}>
                        {monthTotal}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: "#d7ccc8", fontWeight: "700" }}>
                  <td style={{ padding: "12px", textAlign: "right", color: "#5d4037" }}>
                    Reason Total:
                  </td>
                  {Array.from(new Set(terminationEntries.map(e => e.reason))).map(reason => {
                    const reasonTotal = terminationEntries
                      .filter(entry => entry.reason === reason)
                      .reduce((sum, entry) => sum + entry.count, 0)
                    return (
                      <td key={`total-${reason}`} style={{ 
                        padding: "12px", 
                        textAlign: "center", 
                        color: "#5d4037",
                        backgroundColor: "#e8ddd4"
                      }}>
                        {reasonTotal}
                      </td>
                    )
                  })}
                  <td style={{ 
                    padding: "12px", 
                    textAlign: "center", 
                    color: "#5d4037",
                    backgroundColor: "#c8b7a8",
                    fontSize: "14px"
                  }}>
                    {summary.total}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div style={{ padding: "40px", textAlign: "center", color: "#8d6e63" }}>
              <p style={{ marginBottom: "10px" }}>No termination data recorded yet.</p>
            </div>
          )}
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

      {/* Termination Reasons Table - CORRECT STRUCTURE */}
      {renderTerminationReasonsTable()}

      {/* Charts - 2 PER ROW */}
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

      {/* Unified Data Entry Modal */}
      <UnifiedDataEntryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentTab="stability-continuity"
        user={user}
        onSave={() => {
          loadStabilityData()
          loadTerminationData()
        }}
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
            options={pieChartOptions}
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

      {/* Unified Data Entry Modal */}
      <UnifiedDataEntryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentTab="employee-composition"
        user={user}
        onSave={loadEmployeeData}
        loading={loading}
      />
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

      <div style={{ padding: "20px", paddingTop: "40px", marginLeft: "20px" }}>
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
    <h1 style={{ color: "#5d4037", fontSize: "32px", fontWeight: "700", margin: 0 }}>
      People Performance
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

  {/* People Performance Description */}
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
              <li>Assesses organisational resilience and execution capacity</li>
              <li>Evaluates continuity risk and talent retention</li>
              <li>Monitors productivity scaling with headcount growth</li>
              <li>Measures capability development and skills investment</li>
              <li>Analyzes workforce demographics and representation</li>
            </ul>
          </div>

          <div>
            <h3 style={{ color: "#7d5a50", marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>
              What this dashboard does NOT do
            </h3>
            <ul style={{ color: "#4a352f", fontSize: "14px", lineHeight: "1.7", margin: 0, paddingLeft: "20px" }}>
              <li>Payroll processing or salary management</li>
              <li>Leave and attendance tracking</li>
              <li>Performance review administration</li>
              <li>HR compliance and policy management</li>
              <li>Recruitment and onboarding workflows</li>
            </ul>
          </div>
        </div>

        <div style={{ marginTop: "30px", paddingTop: "20px", borderTop: "1px solid #e8ddd4" }}>
          <h3 style={{ color: "#7d5a50", marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>
            Key People Performance Dimensions
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
                Execution Capacity & Scalability
              </h4>
              <p style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
                Evaluate leadership capacity and team sufficiency for current and near-term workload
              </p>
            </div>
            <div>
              <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
                Productivity
              </h4>
              <p style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
                Assess if output is scaling with headcount through efficiency trends
              </p>
            </div>
            <div>
              <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
                Capability & Training
              </h4>
              <p style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
                Determine if the business is investing enough in skills development for future growth
              </p>
            </div>
            <div>
              <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
                Stability & Continuity
              </h4>
              <p style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
                Monitor talent leakage risks and ensure business continuity
              </p>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
                Employee Composition
              </h4>
              <p style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
                Analyze workforce demographics and representation for external credibility
              </p>
            </div>
          </div>
          <p style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6", marginTop: "15px" }}>
            Each section provides key metrics, signals, and decision points to help you make informed strategic choices about your organization's human capital.
          </p>
        </div>
      </div>
    </div>
  )}
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