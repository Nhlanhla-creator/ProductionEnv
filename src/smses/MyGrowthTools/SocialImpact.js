"use client"

import { useState, useEffect } from "react"
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2"
import { db, auth } from "../../firebaseConfig"
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, onSnapshot, getDoc, setDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register ChartJS components and datalabels plugin
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
)

// Helper function to get months array based on financial year
const getMonthsForYear = (financialYearEnd) => {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  
  let yearEnd = financialYearEnd || "2026-03"
  let endYear = parseInt(yearEnd.split('-')[0])
  let endMonth = parseInt(yearEnd.split('-')[1]) - 1
  
  let startYear = endYear - 1
  let startMonth = endMonth + 1
  
  const months = []
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  
  let year = startYear
  let month = startMonth
  
  while (year < currentYear || (year === currentYear && month <= currentMonth)) {
    months.push(`${monthNames[month]}(${year})`)
    
    month++
    if (month > 11) {
      month = 0
      year++
    }
    
    if (year > currentYear + 1) break
  }
  
  return months
}

// Format currency helper
const formatCurrency = (value) => {
  if (!value) return "R 0"
  if (typeof value === 'string') {
    const numericValue = value.replace(/[^\d]/g, '')
    if (!numericValue) return "R 0"
    return `R ${parseInt(numericValue).toLocaleString()}`
  }
  return `R ${value.toLocaleString()}`
}

// Parse currency from string
const parseCurrency = (value) => {
  if (!value) return 0
  if (typeof value === 'string') {
    return parseInt(value.replace(/[^\d]/g, '')) || 0
  }
  return value
}

// Key Question Component with See More button under heading
const KeyQuestionBox = ({ question, signals, decisions, section }) => {
  const [showMore, setShowMore] = useState(false)
  
  const getFirstSentence = (text) => {
    const match = text.match(/^[^.!?]+[.!?]/)
    return match ? match[0] : text.split('.')[0] + '.'
  }
  
  return (
    <div
      style={{
        backgroundColor: "#DCDCDC",
        padding: "15px 20px",
        borderRadius: "8px",
        marginBottom: "20px",
        border: "1px solid #5d4037",
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
            See more
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
            See less
          </button>
        </>
      )}
    </div>
  )
}

// Data Entry Modal Component with Month/Year inside
const DataEntryModal = ({ isOpen, onClose, section, onSave, currentData, financialYearEnd }) => {
  const [formData, setFormData] = useState({})
  const [selectedMonth, setSelectedMonth] = useState("")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    if (currentData) {
      setFormData(currentData)
    }
  }, [currentData])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const dataWithPeriod = {
      ...formData,
      dataMonth: selectedMonth,
      dataYear: selectedYear,
      financialYearEnd: financialYearEnd
    }
    onSave(dataWithPeriod)
    onClose()
  }

  const getMonthOptions = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return months.map(month => (
      <option key={month} value={month}>{month}</option>
    ))
  }

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = currentYear - 2; i <= currentYear; i++) {
      years.push(i)
    }
    return years.map(year => (
      <option key={year} value={year}>{year}</option>
    ))
  }

  const renderFormFields = () => {
    switch (section) {
      case "environmental-exposure":
        return (
          <>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Environmental Exposure Type:
              </label>
              <select
                value={formData.exposureType || "none"}
                onChange={(e) => setFormData({ ...formData, exposureType: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              >
                <option value="none">None</option>
                <option value="indirect">Indirect</option>
                <option value="direct">Direct</option>
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Environmental Compliance Required:
              </label>
              <select
                value={formData.complianceRequired || "no"}
                onChange={(e) => setFormData({ ...formData, complianceRequired: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Environmental Permits in Place:
              </label>
              <select
                value={formData.permitsInPlace || "no"}
                onChange={(e) => setFormData({ ...formData, permitsInPlace: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              >
                <option value="no">No</option>
                <option value="partial">Partial</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Environmental Incidents:
              </label>
              <select
                value={formData.incidents || "none"}
                onChange={(e) => setFormData({ ...formData, incidents: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              >
                <option value="none">None</option>
                <option value="minor">Minor</option>
                <option value="major">Major</option>
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Environmental Controls:
              </label>
              <select
                value={formData.controls || "none"}
                onChange={(e) => setFormData({ ...formData, controls: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              >
                <option value="none">None</option>
                <option value="basic">Basic</option>
                <option value="formal">Formal</option>
              </select>
            </div>
          </>
        )

      case "workforce-demographics":
        return (
          <>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Locality (%):
              </label>
              <input
                type="number"
                value={formData.locality || ""}
                onChange={(e) => setFormData({ ...formData, locality: Number.parseInt(e.target.value) || 0 })}
                placeholder="Local %"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Gender (%):
              </label>
              <input
                type="number"
                value={formData.gender || ""}
                onChange={(e) => setFormData({ ...formData, gender: Number.parseInt(e.target.value) || 0 })}
                placeholder="Female %"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                EAP (%):
              </label>
              <input
                type="number"
                value={formData.eap || ""}
                onChange={(e) => setFormData({ ...formData, eap: Number.parseInt(e.target.value) || 0 })}
                placeholder="EAP %"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Female Leadership (%):
              </label>
              <input
                type="number"
                value={formData.femaleLeadership || ""}
                onChange={(e) => setFormData({ ...formData, femaleLeadership: Number.parseInt(e.target.value) || 0 })}
                placeholder="Female Leadership %"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Youth Leadership (%):
              </label>
              <input
                type="number"
                value={formData.youthLeadership || ""}
                onChange={(e) => setFormData({ ...formData, youthLeadership: Number.parseInt(e.target.value) || 0 })}
                placeholder="Youth Leadership %"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                B-BBEE Level:
              </label>
              <select
                value={formData.bbbeeLevel || "8"}
                onChange={(e) => setFormData({ ...formData, bbbeeLevel: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              >
                <option value="1">Level 1</option>
                <option value="2">Level 2</option>
                <option value="3">Level 3</option>
                <option value="4">Level 4</option>
                <option value="5">Level 5</option>
                <option value="6">Level 6</option>
                <option value="7">Level 7</option>
                <option value="8">Level 8</option>
                <option value="non-compliant">Non-Compliant</option>
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Jobs Created (Net):
              </label>
              <input
                type="number"
                value={formData.jobsCreated || ""}
                onChange={(e) => setFormData({ ...formData, jobsCreated: Number.parseInt(e.target.value) || 0 })}
                placeholder="Total Jobs Created"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>
          </>
        )

      case "ownership-inclusion":
        return (
          <>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                HDI Ownership (%):
              </label>
              <input
                type="number"
                value={formData.hdiOwnership || ""}
                onChange={(e) => setFormData({ ...formData, hdiOwnership: Number.parseInt(e.target.value) || 0 })}
                placeholder="HDI-Owned %"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Shareholder Gender - Male (%):
              </label>
              <input
                type="number"
                value={formData.shareholderGenderMale || ""}
                onChange={(e) => setFormData({ ...formData, shareholderGenderMale: Number.parseInt(e.target.value) || 0 })}
                placeholder="Male %"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Shareholder Gender - Female (%):
              </label>
              <input
                type="number"
                value={formData.shareholderGenderFemale || ""}
                onChange={(e) => setFormData({ ...formData, shareholderGenderFemale: Number.parseInt(e.target.value) || 0 })}
                placeholder="Female %"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Black Shareholders (%):
              </label>
              <input
                type="number"
                value={formData.shareholderRaceBlack || ""}
                onChange={(e) => setFormData({ ...formData, shareholderRaceBlack: Number.parseInt(e.target.value) || 0 })}
                placeholder="Black %"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Permanent Jobs:
              </label>
              <input
                type="number"
                value={formData.permanentJobs || ""}
                onChange={(e) => setFormData({ ...formData, permanentJobs: Number.parseInt(e.target.value) || 0 })}
                placeholder="Permanent Jobs"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Contract Jobs:
              </label>
              <input
                type="number"
                value={formData.contractJobs || ""}
                onChange={(e) => setFormData({ ...formData, contractJobs: Number.parseInt(e.target.value) || 0 })}
                placeholder="Contract Jobs"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>
          </>
        )

      case "csi-spend":
        return (
          <>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                CSI/CSR Spend (R):
              </label>
              <input
                type="text"
                value={formData.csiSpend || ""}
                onChange={(e) => setFormData({ ...formData, csiSpend: e.target.value })}
                placeholder="R 0"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                CSI Spend as % of Revenue:
              </label>
              <input
                type="number"
                value={formData.csiPercentage || ""}
                onChange={(e) => setFormData({ ...formData, csiPercentage: Number.parseFloat(e.target.value) || 0 })}
                placeholder="Percentage"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                HDI Vendor Spend (R):
              </label>
              <input
                type="text"
                value={formData.hdiVendorSpend || ""}
                onChange={(e) => setFormData({ ...formData, hdiVendorSpend: e.target.value })}
                placeholder="R 0"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Total Procurement Spend (R):
              </label>
              <input
                type="text"
                value={formData.totalProcurementSpend || ""}
                onChange={(e) => setFormData({ ...formData, totalProcurementSpend: e.target.value })}
                placeholder="R 0"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Procurement % to HDI:
              </label>
              <input
                type="number"
                value={formData.procurementPercentage || ""}
                onChange={(e) => setFormData({ ...formData, procurementPercentage: Number.parseFloat(e.target.value) || 0 })}
                placeholder="Percentage"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>
          </>
        )

      case "governance-policies":
        return (
          <>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Core Governance Policies in Place:
              </label>
              <select
                value={formData.corePolicies || "no"}
                onChange={(e) => setFormData({ ...formData, corePolicies: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              >
                <option value="no">No</option>
                <option value="partial">Partial</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Critical SOPs Documented:
              </label>
              <select
                value={formData.criticalSOPs || "no"}
                onChange={(e) => setFormData({ ...formData, criticalSOPs: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Policy / SOP Owner Assigned:
              </label>
              <select
                value={formData.policyOwner || "no"}
                onChange={(e) => setFormData({ ...formData, policyOwner: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Review Cycle Defined:
              </label>
              <select
                value={formData.reviewCycle || "no"}
                onChange={(e) => setFormData({ ...formData, reviewCycle: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </>
        )

      case "governance-risk":
        return (
          <>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Risk Register Maintained:
              </label>
              <select
                value={formData.riskRegister || "no"}
                onChange={(e) => setFormData({ ...formData, riskRegister: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Reporting Responsibility Assigned:
              </label>
              <select
                value={formData.reportingResponsibility || "no"}
                onChange={(e) => setFormData({ ...formData, reportingResponsibility: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </>
        )

      case "governance-ownership":
        return (
          <>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Shareholder Register Maintained:
              </label>
              <select
                value={formData.shareholderRegister || "no"}
                onChange={(e) => setFormData({ ...formData, shareholderRegister: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Voting Rights Documented:
              </label>
              <select
                value={formData.votingRights || "no"}
                onChange={(e) => setFormData({ ...formData, votingRights: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </>
        )

      case "governance-oversight":
        return (
          <>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Oversight Structure:
              </label>
              <select
                value={formData.oversightStructure || "none"}
                onChange={(e) => setFormData({ ...formData, oversightStructure: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              >
                <option value="none">None</option>
                <option value="founder-only">Founder Only</option>
                <option value="advisory-board">Advisory Board</option>
                <option value="formal-board">Formal Board</option>
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Independent Oversight:
              </label>
              <select
                value={formData.independentOversight || "no"}
                onChange={(e) => setFormData({ ...formData, independentOversight: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Meeting Cadence:
              </label>
              <select
                value={formData.meetingCadence || "ad-hoc"}
                onChange={(e) => setFormData({ ...formData, meetingCadence: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              >
                <option value="ad-hoc">Ad Hoc</option>
                <option value="quarterly">Quarterly</option>
                <option value="monthly">Monthly</option>
                <option value="regular">Regular</option>
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Female Directors:
              </label>
              <input
                type="number"
                value={formData.femaleDirectors || ""}
                onChange={(e) => setFormData({ ...formData, femaleDirectors: Number.parseInt(e.target.value) || 0 })}
                placeholder="Number of Female Directors"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Male Directors:
              </label>
              <input
                type="number"
                value={formData.maleDirectors || ""}
                onChange={(e) => setFormData({ ...formData, maleDirectors: Number.parseInt(e.target.value) || 0 })}
                placeholder="Number of Male Directors"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>
          </>
        )

      default:
        return null
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
          borderRadius: "12px",
          maxWidth: "500px",
          maxHeight: "85vh",
          overflow: "auto",
          width: "90%",
          boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
          border: "2px solid #5d4037",
        }}
      >
        <h3 style={{ color: "#5d4037", marginTop: 0, fontSize: "24px", textAlign: "center" }}>
          {section === "environmental-exposure" && "Enter Environmental Data"}
          {section === "workforce-demographics" && "Enter Workforce Demographics"}
          {section === "ownership-inclusion" && "Enter Ownership & Inclusion Data"}
          {section === "csi-spend" && "Enter CSI/CSR Data"}
          {section === "governance-ownership" && "Enter Ownership & Control Data"}
          {section === "governance-oversight" && "Enter Oversight & Accountability Data"}
          {section === "governance-policies" && "Enter Policies and SOPs Data"}
          {section === "governance-risk" && "Enter Risk, Controls & Reporting Data"}
        </h3>
        
        {/* Month and Year Selection */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600", fontSize: "14px" }}>
              Month:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "2px solid #e8ddd4",
                fontSize: "14px",
              }}
              required
            >
              <option value="">Select Month</option>
              {getMonthOptions()}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600", fontSize: "14px" }}>
              Year:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "2px solid #e8ddd4",
                fontSize: "14px",
              }}
              required
            >
              <option value="">Select Year</option>
              {getYearOptions()}
            </select>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {renderFormFields()}
          <div style={{ display: "flex", gap: "15px", justifyContent: "center", marginTop: "25px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "12px 25px",
                backgroundColor: "#e8ddd4",
                color: "#5d4037",
                border: "2px solid #5d4037",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: "12px 25px",
                backgroundColor: "#5d4037",
                color: "#fdfcfb",
                border: "2px solid #5d4037",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              Save Data
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Generic Chart Component with Notes and AI Analysis
const ESGChartCard = ({ title, chartType, data, options, kpiKey, unit = "", onAddNotes, onAIAnalysis, isInvestorView }) => {
  const [expandedNotes, setExpandedNotes] = useState(false)
  const [expandedAnalysis, setExpandedAnalysis] = useState(false)
  const [notes, setNotes] = useState("")
  const [analysis, setAnalysis] = useState("")

  const handleAddNotes = () => {
    setExpandedNotes(!expandedNotes)
    if (onAddNotes) onAddNotes(kpiKey, notes)
  }

  const handleAIAnalysis = () => {
    setExpandedAnalysis(!expandedAnalysis)
    if (onAIAnalysis) onAIAnalysis(kpiKey, analysis)
  }

  const renderChart = () => {
    switch (chartType) {
      case "bar":
        return <Bar data={data} options={options} />
      case "line":
        return <Line data={data} options={options} />
      case "pie":
        return <Pie data={data} options={options} />
      case "doughnut":
        return <Doughnut data={data} options={options} />
      default:
        return <Bar data={data} options={options} />
    }
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
      <h4 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "16px" }}>{title}</h4>
      <div style={{ height: "250px" }}>
        {renderChart()}
      </div>

      {!isInvestorView && (
        <div style={{ borderTop: "1px solid #e8ddd4", paddingTop: "15px" }}>
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <button
              onClick={handleAddNotes}
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
              onClick={handleAIAnalysis}
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

          {expandedNotes && (
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
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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

          {expandedAnalysis && (
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
                {analysis || "AI analysis will be generated based on your data trends, comparing current performance against historical averages and industry benchmarks. This feature provides actionable insights for improving this metric."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Policies Table Component - FIXED with full CRUD functionality
const PoliciesTable = ({ policies, onUpdate, isInvestorView }) => {
  const [showTable, setShowTable] = useState(false)
  const [localPolicies, setLocalPolicies] = useState(policies || [])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    type: "Policy",
    owner: "",
    reviewDate: ""
  })

  useEffect(() => {
    setLocalPolicies(policies || [])
  }, [policies])

  const handleAddPolicy = () => {
    const newPolicy = {
      id: Date.now().toString(),
      ...formData
    }
    const updatedPolicies = [...localPolicies, newPolicy]
    setLocalPolicies(updatedPolicies)
    onUpdate(updatedPolicies)
    setShowAddModal(false)
    setFormData({ name: "", type: "Policy", owner: "", reviewDate: "" })
  }

  const handleEditPolicy = (policy) => {
    setEditingPolicy(policy)
    setFormData({
      name: policy.name,
      type: policy.type,
      owner: policy.owner,
      reviewDate: policy.reviewDate
    })
    setShowAddModal(true)
  }

  const handleUpdatePolicy = () => {
    const updatedPolicies = localPolicies.map(p => 
      p.id === editingPolicy.id ? { ...p, ...formData } : p
    )
    setLocalPolicies(updatedPolicies)
    onUpdate(updatedPolicies)
    setShowAddModal(false)
    setEditingPolicy(null)
    setFormData({ name: "", type: "Policy", owner: "", reviewDate: "" })
  }

  const handleDeletePolicy = (id) => {
    const updatedPolicies = localPolicies.filter(p => p.id !== id)
    setLocalPolicies(updatedPolicies)
    onUpdate(updatedPolicies)
  }

  if (!showTable && !isInvestorView) {
    return (
      <button
        onClick={() => setShowTable(true)}
        style={{
          padding: "8px 16px",
          backgroundColor: "#5d4037",
          color: "#fdfcfb",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: "600",
          fontSize: "13px",
          marginTop: "10px",
        }}
      >
        Show Policies & SOPs Details
      </button>
    )
  }

  return (
    <div style={{ marginTop: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h4 style={{ color: "#5d4037", fontSize: "16px", margin: 0 }}>Policies & SOPs Register</h4>
        {!isInvestorView && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setShowTable(false)}
              style={{
                background: "none",
                border: "none",
                color: "#5d4037",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px",
                textDecoration: "underline",
              }}
            >
              Hide Table
            </button>
          </div>
        )}
      </div>
      <div
        style={{
          backgroundColor: "#fdfcfb",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#e8ddd4" }}>
              <th style={{ padding: "12px", textAlign: "left", color: "#5d4037", fontSize: "14px" }}>Policy/SOP Name</th>
              <th style={{ padding: "12px", textAlign: "left", color: "#5d4037", fontSize: "14px" }}>Type</th>
              <th style={{ padding: "12px", textAlign: "left", color: "#5d4037", fontSize: "14px" }}>Owner</th>
              <th style={{ padding: "12px", textAlign: "left", color: "#5d4037", fontSize: "14px" }}>Review Date</th>
              {!isInvestorView && (
                <th style={{ padding: "12px", textAlign: "center", color: "#5d4037", fontSize: "14px" }}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {localPolicies && localPolicies.length > 0 ? (
              localPolicies.map((policy) => (
                <tr key={policy.id} style={{ borderBottom: "1px solid #e8ddd4" }}>
                  <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>{policy.name}</td>
                  <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>{policy.type}</td>
                  <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>{policy.owner}</td>
                  <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>{policy.reviewDate}</td>
                  {!isInvestorView && (
                    <td style={{ padding: "12px", textAlign: "center", color: "#5d4037", fontSize: "14px" }}>
                      <button 
                        onClick={() => handleEditPolicy(policy)}
                        style={{ 
                          background: "none", 
                          border: "none", 
                          color: "#5d4037", 
                          cursor: "pointer", 
                          margin: "0 5px",
                          padding: "5px 10px",
                          borderRadius: "4px",
                          backgroundColor: "#e8ddd4"
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeletePolicy(policy.id)}
                        style={{ 
                          background: "none", 
                          border: "none", 
                          color: "#c62828", 
                          cursor: "pointer", 
                          margin: "0 5px",
                          padding: "5px 10px",
                          borderRadius: "4px",
                          backgroundColor: "#ffebee"
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={!isInvestorView ? "5" : "4"} style={{ padding: "20px", textAlign: "center", color: "#8d6e63", fontSize: "14px" }}>
                  No policies added yet. Click "Add Policy" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {!isInvestorView && (
          <div style={{ marginTop: "15px", textAlign: "right" }}>
            <button
              onClick={() => {
                setEditingPolicy(null)
                setFormData({ name: "", type: "Policy", owner: "", reviewDate: "" })
                setShowAddModal(true)
              }}
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
              + Add Policy/SOP
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Policy Modal */}
      {showAddModal && (
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
            zIndex: 2000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "30px",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "90%",
            }}
          >
            <h3 style={{ color: "#5d4037", marginBottom: "20px" }}>
              {editingPolicy ? "Edit Policy/SOP" : "Add New Policy/SOP"}
            </h3>
            
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                Policy/SOP Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                }}
              >
                <option value="Policy">Policy</option>
                <option value="SOP">SOP</option>
                <option value="Procedure">Procedure</option>
                <option value="Guideline">Guideline</option>
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                Owner
              </label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                placeholder="e.g., CEO, HR Manager"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                Review Date
              </label>
              <input
                type="date"
                value={formData.reviewDate}
                onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingPolicy(null)
                  setFormData({ name: "", type: "Policy", owner: "", reviewDate: "" })
                }}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e8ddd4",
                  color: "#5d4037",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Cancel
              </button>
              <button
                onClick={editingPolicy ? handleUpdatePolicy : handleAddPolicy}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                {editingPolicy ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Risk Register Table Component - FIXED with full CRUD functionality
const RiskTable = ({ risks, onUpdate, isInvestorView }) => {
  const [showTable, setShowTable] = useState(false)
  const [localRisks, setLocalRisks] = useState(risks || [])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingRisk, setEditingRisk] = useState(null)
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    likelihood: "Medium",
    impact: "Medium",
    mitigation: ""
  })

  useEffect(() => {
    setLocalRisks(risks || [])
  }, [risks])

  const handleAddRisk = () => {
    const newRisk = {
      id: Date.now().toString(),
      ...formData
    }
    const updatedRisks = [...localRisks, newRisk]
    setLocalRisks(updatedRisks)
    onUpdate(updatedRisks)
    setShowAddModal(false)
    setFormData({ category: "", description: "", likelihood: "Medium", impact: "Medium", mitigation: "" })
  }

  const handleEditRisk = (risk) => {
    setEditingRisk(risk)
    setFormData({
      category: risk.category,
      description: risk.description,
      likelihood: risk.likelihood,
      impact: risk.impact,
      mitigation: risk.mitigation
    })
    setShowAddModal(true)
  }

  const handleUpdateRisk = () => {
    const updatedRisks = localRisks.map(r => 
      r.id === editingRisk.id ? { ...r, ...formData } : r
    )
    setLocalRisks(updatedRisks)
    onUpdate(updatedRisks)
    setShowAddModal(false)
    setEditingRisk(null)
    setFormData({ category: "", description: "", likelihood: "Medium", impact: "Medium", mitigation: "" })
  }

  const handleDeleteRisk = (id) => {
    const updatedRisks = localRisks.filter(r => r.id !== id)
    setLocalRisks(updatedRisks)
    onUpdate(updatedRisks)
  }

  if (!showTable && !isInvestorView) {
    return (
      <button
        onClick={() => setShowTable(true)}
        style={{
          padding: "8px 16px",
          backgroundColor: "#5d4037",
          color: "#fdfcfb",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: "600",
          fontSize: "13px",
          marginTop: "10px",
        }}
      >
        Show Risk Register Details
      </button>
    )
  }

  return (
    <div style={{ marginTop: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h4 style={{ color: "#5d4037", fontSize: "16px", margin: 0 }}>Risk Register</h4>
        {!isInvestorView && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setShowTable(false)}
              style={{
                background: "none",
                border: "none",
                color: "#5d4037",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px",
                textDecoration: "underline",
              }}
            >
              Hide Table
            </button>
          </div>
        )}
      </div>
      <div
        style={{
          backgroundColor: "#fdfcfb",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#e8ddd4" }}>
              <th style={{ padding: "12px", textAlign: "left", color: "#5d4037", fontSize: "14px" }}>Risk Category</th>
              <th style={{ padding: "12px", textAlign: "left", color: "#5d4037", fontSize: "14px" }}>Risk Description</th>
              <th style={{ padding: "12px", textAlign: "left", color: "#5d4037", fontSize: "14px" }}>Likelihood</th>
              <th style={{ padding: "12px", textAlign: "left", color: "#5d4037", fontSize: "14px" }}>Impact</th>
              <th style={{ padding: "12px", textAlign: "left", color: "#5d4037", fontSize: "14px" }}>Mitigation</th>
              {!isInvestorView && (
                <th style={{ padding: "12px", textAlign: "center", color: "#5d4037", fontSize: "14px" }}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {localRisks && localRisks.length > 0 ? (
              localRisks.map((risk) => (
                <tr key={risk.id} style={{ borderBottom: "1px solid #e8ddd4" }}>
                  <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>{risk.category}</td>
                  <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>{risk.description}</td>
                  <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>{risk.likelihood}</td>
                  <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>{risk.impact}</td>
                  <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>{risk.mitigation}</td>
                  {!isInvestorView && (
                    <td style={{ padding: "12px", textAlign: "center", color: "#5d4037", fontSize: "14px" }}>
                      <button 
                        onClick={() => handleEditRisk(risk)}
                        style={{ 
                          background: "none", 
                          border: "none", 
                          color: "#5d4037", 
                          cursor: "pointer", 
                          margin: "0 5px",
                          padding: "5px 10px",
                          borderRadius: "4px",
                          backgroundColor: "#e8ddd4"
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteRisk(risk.id)}
                        style={{ 
                          background: "none", 
                          border: "none", 
                          color: "#c62828", 
                          cursor: "pointer", 
                          margin: "0 5px",
                          padding: "5px 10px",
                          borderRadius: "4px",
                          backgroundColor: "#ffebee"
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={!isInvestorView ? "6" : "5"} style={{ padding: "20px", textAlign: "center", color: "#8d6e63", fontSize: "14px" }}>
                  No risks added yet. Click "Add Risk" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {!isInvestorView && (
          <div style={{ marginTop: "15px", textAlign: "right" }}>
            <button
              onClick={() => {
                setEditingRisk(null)
                setFormData({ category: "", description: "", likelihood: "Medium", impact: "Medium", mitigation: "" })
                setShowAddModal(true)
              }}
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
              + Add Risk
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Risk Modal */}
      {showAddModal && (
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
            zIndex: 2000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "30px",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "90%",
            }}
          >
            <h3 style={{ color: "#5d4037", marginBottom: "20px" }}>
              {editingRisk ? "Edit Risk" : "Add New Risk"}
            </h3>
            
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                Risk Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                }}
              >
                <option value="">Select Category</option>
                <option value="Financial">Financial</option>
                <option value="Operational">Operational</option>
                <option value="Strategic">Strategic</option>
                <option value="Compliance">Compliance</option>
                <option value="Reputational">Reputational</option>
                <option value="Environmental">Environmental</option>
                <option value="Social">Social</option>
                <option value="Governance">Governance</option>
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                Risk Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the risk..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                Likelihood
              </label>
              <select
                value={formData.likelihood}
                onChange={(e) => setFormData({ ...formData, likelihood: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                }}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                Impact
              </label>
              <select
                value={formData.impact}
                onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                }}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                Mitigation Strategy
              </label>
              <textarea
                value={formData.mitigation}
                onChange={(e) => setFormData({ ...formData, mitigation: e.target.value })}
                placeholder="Describe how this risk is mitigated..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingRisk(null)
                  setFormData({ category: "", description: "", likelihood: "Medium", impact: "Medium", mitigation: "" })
                }}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e8ddd4",
                  color: "#5d4037",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Cancel
              </button>
              <button
                onClick={editingRisk ? handleUpdateRisk : handleAddRisk}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                {editingRisk ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Board Table Component - FIXED with full CRUD functionality
const BoardTable = ({ boardData, oversightStructure, onUpdate, isInvestorView }) => {
  const [showTable, setShowTable] = useState(false)
  const [localBoardData, setLocalBoardData] = useState(boardData || { directors: [], advisors: [] })
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    gender: "Male",
    independent: false,
    appointedDate: "",
    expertise: ""
  })

  useEffect(() => {
    setLocalBoardData(boardData || { directors: [], advisors: [] })
  }, [boardData])

  if (!localBoardData) return null

  const handleAddMember = () => {
    const newMember = {
      id: Date.now().toString(),
      ...formData
    }
    
    const updatedBoardData = { ...localBoardData }
    if (oversightStructure === "formal-board") {
      updatedBoardData.directors = [...(updatedBoardData.directors || []), newMember]
    } else if (oversightStructure === "advisory-board") {
      updatedBoardData.advisors = [...(updatedBoardData.advisors || []), newMember]
    }
    
    setLocalBoardData(updatedBoardData)
    onUpdate(updatedBoardData)
    setShowAddModal(false)
    setFormData({ name: "", role: "", gender: "Male", independent: false, appointedDate: "", expertise: "" })
  }

  const handleEditMember = (member) => {
    setEditingMember(member)
    setFormData({
      name: member.name,
      role: member.role || "",
      gender: member.gender || "Male",
      independent: member.independent || false,
      appointedDate: member.appointedDate || "",
      expertise: member.expertise || ""
    })
    setShowAddModal(true)
  }

  const handleUpdateMember = () => {
    const updatedBoardData = { ...localBoardData }
    if (oversightStructure === "formal-board") {
      updatedBoardData.directors = updatedBoardData.directors.map(d => 
        d.id === editingMember.id ? { ...d, ...formData } : d
      )
    } else if (oversightStructure === "advisory-board") {
      updatedBoardData.advisors = updatedBoardData.advisors.map(a => 
        a.id === editingMember.id ? { ...a, ...formData } : a
      )
    }
    
    setLocalBoardData(updatedBoardData)
    onUpdate(updatedBoardData)
    setShowAddModal(false)
    setEditingMember(null)
    setFormData({ name: "", role: "", gender: "Male", independent: false, appointedDate: "", expertise: "" })
  }

  const handleDeleteMember = (id) => {
    const updatedBoardData = { ...localBoardData }
    if (oversightStructure === "formal-board") {
      updatedBoardData.directors = updatedBoardData.directors.filter(d => d.id !== id)
    } else if (oversightStructure === "advisory-board") {
      updatedBoardData.advisors = updatedBoardData.advisors.filter(a => a.id !== id)
    }
    
    setLocalBoardData(updatedBoardData)
    onUpdate(updatedBoardData)
  }

  if (!showTable && !isInvestorView) {
    return (
      <button
        onClick={() => setShowTable(true)}
        style={{
          padding: "8px 16px",
          backgroundColor: "#5d4037",
          color: "#fdfcfb",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: "600",
          fontSize: "13px",
          marginTop: "10px",
        }}
      >
        Show {oversightStructure === "formal-board" ? "Board" : oversightStructure === "advisory-board" ? "Advisory Board" : "Oversight"} Details
      </button>
    )
  }

  const getTableTitle = () => {
    switch(oversightStructure) {
      case "formal-board": return "Board of Directors"
      case "advisory-board": return "Advisory Board"
      case "founder-only": return "Founder Oversight"
      default: return "Oversight Structure"
    }
  }

  return (
    <div style={{ marginTop: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h4 style={{ color: "#5d4037", fontSize: "16px", margin: 0 }}>{getTableTitle()}</h4>
        {!isInvestorView && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setShowTable(false)}
              style={{
                background: "none",
                border: "none",
                color: "#5d4037",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px",
                textDecoration: "underline",
              }}
            >
              Hide Table
            </button>
          </div>
        )}
      </div>
      <div
        style={{
          backgroundColor: "#fdfcfb",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        {oversightStructure === "formal-board" && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#e8ddd4" }}>
                <th style={{ padding: "12px", textAlign: "left", color: "#5d4037", fontSize: "14px" }}>Name</th>
                <th style={{ padding: "12px", textAlign: "left", color: "#5d4037", fontSize: "14px" }}>Role</th>
                <th style={{ padding: "12px", textAlign: "left", color: "#5d4037", fontSize: "14px" }}>Gender</th>
                <th style={{ padding: "12px", textAlign: "left", color: "#5d4037", fontSize: "14px" }}>Independent</th>
                <th style={{ padding: "12px", textAlign: "left", color: "#5d4037", fontSize: "14px" }}>Appointed Date</th>
                {!isInvestorView && (
                  <th style={{ padding: "12px", textAlign: "center", color: "#5d4037", fontSize: "14px" }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {localBoardData.directors && localBoardData.directors.length > 0 ? (
                localBoardData.directors.map((director) => (
                  <tr key={director.id} style={{ borderBottom: "1px solid #e8ddd4" }}>
                    <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>{director.name}</td>
                    <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>{director.role}</td>
                    <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>{director.gender}</td>
                    <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>{director.independent ? "Yes" : "No"}</td>
                    <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>{director.appointedDate}</td>
                    {!isInvestorView && (
                      <td style={{ padding: "12px", textAlign: "center", color: "#5d4037", fontSize: "14px" }}>
                        <button 
                          onClick={() => handleEditMember(director)}
                          style={{ 
                            background: "none", 
                            border: "none", 
                            color: "#5d4037", 
                            cursor: "pointer", 
                            margin: "0 5px",
                            padding: "5px 10px",
                            borderRadius: "4px",
                            backgroundColor: "#e8ddd4"
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteMember(director.id)}
                          style={{ 
                            background: "none", 
                            border: "none", 
                            color: "#c62828", 
                            cursor: "pointer", 
                            margin: "0 5px",
                            padding: "5px 10px",
                            borderRadius: "4px",
                            backgroundColor: "#ffebee"
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={!isInvestorView ? "6" : "5"} style={{ padding: "20px", textAlign: "center", color: "#8d6e63", fontSize: "14px" }}>
                    No directors added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {oversightStructure === "advisory-board" && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#e8ddd4" }}>
                <th style={{ padding: "12px", textAlign: "left", color: "#5d4037", fontSize: "14px" }}>Name</th>
                <th style={{ padding: "12px", textAlign: "left", color: "#5d4037", fontSize: "14px" }}>Expertise</th>
                <th style={{ padding: "12px", textAlign: "left", color: "#5d4037", fontSize: "14px" }}>Appointed Date</th>
                {!isInvestorView && (
                  <th style={{ padding: "12px", textAlign: "center", color: "#5d4037", fontSize: "14px" }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {localBoardData.advisors && localBoardData.advisors.length > 0 ? (
                localBoardData.advisors.map((advisor) => (
                  <tr key={advisor.id} style={{ borderBottom: "1px solid #e8ddd4" }}>
                    <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>{advisor.name}</td>
                    <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>{advisor.expertise}</td>
                    <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>{advisor.appointedDate}</td>
                    {!isInvestorView && (
                      <td style={{ padding: "12px", textAlign: "center", color: "#5d4037", fontSize: "14px" }}>
                        <button 
                          onClick={() => handleEditMember(advisor)}
                          style={{ 
                            background: "none", 
                            border: "none", 
                            color: "#5d4037", 
                            cursor: "pointer", 
                            margin: "0 5px",
                            padding: "5px 10px",
                            borderRadius: "4px",
                            backgroundColor: "#e8ddd4"
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteMember(advisor.id)}
                          style={{ 
                            background: "none", 
                            border: "none", 
                            color: "#c62828", 
                            cursor: "pointer", 
                            margin: "0 5px",
                            padding: "5px 10px",
                            borderRadius: "4px",
                            backgroundColor: "#ffebee"
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={!isInvestorView ? "4" : "3"} style={{ padding: "20px", textAlign: "center", color: "#8d6e63", fontSize: "14px" }}>
                    No advisors added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {oversightStructure === "founder-only" && (
          <div style={{ padding: "20px", textAlign: "center", color: "#5d4037", fontSize: "14px" }}>
            <p>Founder-only oversight structure. No formal board or advisory committee in place.</p>
            <p>Consider establishing advisory or board oversight for enhanced governance.</p>
          </div>
        )}

        {!isInvestorView && oversightStructure !== "none" && oversightStructure !== "founder-only" && (
          <div style={{ marginTop: "15px", textAlign: "right" }}>
            <button
              onClick={() => {
                setEditingMember(null)
                setFormData({ name: "", role: "", gender: "Male", independent: false, appointedDate: "", expertise: "" })
                setShowAddModal(true)
              }}
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
              + Add {oversightStructure === "formal-board" ? "Director" : "Advisor"}
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Board Member Modal */}
      {showAddModal && (
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
            zIndex: 2000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "30px",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "90%",
            }}
          >
            <h3 style={{ color: "#5d4037", marginBottom: "20px" }}>
              {editingMember ? "Edit" : "Add"} {oversightStructure === "formal-board" ? "Director" : "Advisor"}
            </h3>
            
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>

            {oversightStructure === "formal-board" ? (
              <>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                    Role
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g., Chairperson, Non-Executive Director"
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "4px",
                      border: "1px solid #e8ddd4",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "4px",
                      border: "1px solid #e8ddd4",
                      fontSize: "14px",
                    }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                    <input
                      type="checkbox"
                      checked={formData.independent}
                      onChange={(e) => setFormData({ ...formData, independent: e.target.checked })}
                      style={{ marginRight: "8px" }}
                    />
                    Independent Director
                  </label>
                </div>
              </>
            ) : (
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                  Expertise
                </label>
                <input
                  type="text"
                  value={formData.expertise}
                  onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                  placeholder="e.g., Finance, Strategy, Marketing"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #e8ddd4",
                    fontSize: "14px",
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "600" }}>
                Appointed Date
              </label>
              <input
                type="date"
                value={formData.appointedDate}
                onChange={(e) => setFormData({ ...formData, appointedDate: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingMember(null)
                  setFormData({ name: "", role: "", gender: "Male", independent: false, appointedDate: "", expertise: "" })
                }}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e8ddd4",
                  color: "#5d4037",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Cancel
              </button>
              <button
                onClick={editingMember ? handleUpdateMember : handleAddMember}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                {editingMember ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Environmental Tab Component
const EnvironmentalTab = ({ userData, onSave, isInvestorView }) => {
  // Handle dropdown changes
  const handleDropdownChange = (field, value) => {
    const updatedData = { ...userData, [field]: value };
    onSave(updatedData);
  };

  return (
    <div>
      <KeyQuestionBox
        question="Are environmental risks identified, tracked and managed where relevant? This includes assessing sector exposure (direct vs indirect), regulatory requirements, and licence-to-operate risk."
        signals="Sector exposure (direct vs indirect), Regulatory requirements, Licence-to-operate risk"
        decisions="Disclosures, readiness for compliance scrutiny, specialist oversight requirements, insurance or permitting risk"
        section="environmental-exposure"
      />

      {/* Two columns for Environmental sections */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
        {/* Environmental Exposure & Compliance Section */}
        <div
          style={{
            backgroundColor: "#fdfcfb",
            padding: "25px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              color: "#5d4037",
              marginTop: 0,
              marginBottom: "25px",
              fontSize: "18px",
              fontWeight: "600",
              borderBottom: "2px solid #e8ddd4",
              paddingBottom: "10px",
            }}
          >
            Environmental Exposure & Compliance
          </h3>

          <div style={{ display: "grid", gap: "20px" }}>
            {/* Environmental Exposure Type */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <label
                style={{
                  minWidth: "180px",
                  color: "#5d4037",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Environmental Exposure Type:
              </label>
              <select
                value={userData?.exposureType || "none"}
                onChange={(e) => handleDropdownChange("exposureType", e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 15px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                  color: "#5d4037",
                  backgroundColor: "#fdfcfb",
                  cursor: isInvestorView ? "not-allowed" : "pointer",
                  opacity: isInvestorView ? 0.7 : 1,
                }}
                disabled={isInvestorView}
              >
                <option value="none">None</option>
                <option value="indirect">Indirect</option>
                <option value="direct">Direct</option>
              </select>
            </div>

            {/* Environmental Compliance Required */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <label
                style={{
                  minWidth: "180px",
                  color: "#5d4037",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Environmental Compliance Required:
              </label>
              <select
                value={userData?.complianceRequired || "no"}
                onChange={(e) => handleDropdownChange("complianceRequired", e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 15px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                  color: "#5d4037",
                  backgroundColor: "#fdfcfb",
                  cursor: isInvestorView ? "not-allowed" : "pointer",
                  opacity: isInvestorView ? 0.7 : 1,
                }}
                disabled={isInvestorView}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            {/* Environmental Permits in Place */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <label
                style={{
                  minWidth: "180px",
                  color: "#5d4037",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Environmental Permits in Place:
              </label>
              <select
                value={userData?.permitsInPlace || "no"}
                onChange={(e) => handleDropdownChange("permitsInPlace", e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 15px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                  color: "#5d4037",
                  backgroundColor: "#fdfcfb",
                  cursor: isInvestorView ? "not-allowed" : "pointer",
                  opacity: isInvestorView ? 0.7 : 1,
                }}
                disabled={isInvestorView}
              >
                <option value="no">No</option>
                <option value="partial">Partial</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Environmental Incidents & Controls Section */}
        <div
          style={{
            backgroundColor: "#fdfcfb",
            padding: "25px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              color: "#5d4037",
              marginTop: 0,
              marginBottom: "25px",
              fontSize: "18px",
              fontWeight: "600",
              borderBottom: "2px solid #e8ddd4",
              paddingBottom: "10px",
            }}
          >
            Environmental Incidents & Controls
          </h3>

          <div style={{ display: "grid", gap: "20px" }}>
            {/* Environmental Incidents */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <label
                style={{
                  minWidth: "180px",
                  color: "#5d4037",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Environmental Incidents:
              </label>
              <select
                value={userData?.incidents || "none"}
                onChange={(e) => handleDropdownChange("incidents", e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 15px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                  color: "#5d4037",
                  backgroundColor: "#fdfcfb",
                  cursor: isInvestorView ? "not-allowed" : "pointer",
                  opacity: isInvestorView ? 0.7 : 1,
                }}
                disabled={isInvestorView}
              >
                <option value="none">None</option>
                <option value="minor">Minor</option>
                <option value="major">Major</option>
              </select>
            </div>

            {/* Environmental Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <label
                style={{
                  minWidth: "180px",
                  color: "#5d4037",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Environmental Controls:
              </label>
              <select
                value={userData?.controls || "none"}
                onChange={(e) => handleDropdownChange("controls", e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 15px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                  color: "#5d4037",
                  backgroundColor: "#fdfcfb",
                  cursor: isInvestorView ? "not-allowed" : "pointer",
                  opacity: isInvestorView ? 0.7 : 1,
                }}
                disabled={isInvestorView}
              >
                <option value="none">None</option>
                <option value="basic">Basic</option>
                <option value="formal">Formal</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Social Tab Component - UPDATED with proper data pulling
const SocialTab = ({ activeSubTab, setActiveSubTab, userData, onSave, isInvestorView, fundingAppData, financialData }) => {
  const [activeSpendTab, setActiveSpendTab] = useState("csi") // "csi" or "hdi"
  const [activeProcurementTab, setActiveProcurementTab] = useState("amount") // "amount" or "percentage"
  const [financialYearEnd, setFinancialYearEnd] = useState("2026-03")
  const [localUserData, setLocalUserData] = useState(userData || {})

  useEffect(() => {
    // Merge funding application data with existing userData
    if (fundingAppData) {
      const mergedData = {
        ...localUserData,
        // Map Funding Application fields to ESG fields
        jobsCreated: fundingAppData.jobsToCreate || localUserData?.jobsCreated || 0,
        shareholderRaceBlack: fundingAppData.blackOwnership || localUserData?.shareholderRaceBlack || 0,
        shareholderGenderFemale: fundingAppData.womenOwnership || localUserData?.shareholderGenderFemale || 0,
        youthLeadership: fundingAppData.youthOwnership || localUserData?.youthLeadership || 0,
        eap: fundingAppData.disabledOwnership || localUserData?.eap || 0, // Map disabled to EAP
        // CSI/CSR data
        csiSpend: parseCurrency(fundingAppData.csiCsrSpend) || localUserData?.csiSpend || 500000,
        // Local procurement data
        hdiVendorSpend: parseCurrency(fundingAppData.localProcurementSpend) || localUserData?.hdiVendorSpend || 750000,
        // Beneficiaries
        numberOfBeneficiaries: fundingAppData.numberOfBeneficiaries || localUserData?.numberOfBeneficiaries || 1000,
        // Environmental impact text
        environmentalImpact: fundingAppData.environmentalImpact || localUserData?.environmentalImpact || "",
        // SDG alignment
        sdgAlignment: fundingAppData.sdgAlignment || localUserData?.sdgAlignment || "",
      }
      
      setLocalUserData(mergedData)
      
      // Save to parent if needed
      if (JSON.stringify(mergedData) !== JSON.stringify(userData)) {
        onSave(mergedData)
      }
    }

    // Merge financial data for HDI/CSI metrics
    if (financialData) {
      const mergedData = {
        ...localUserData,
        // From financial data - balance sheet additional metrics
        hdiSpent: financialData?.balanceSheetData?.assets?.additionalMetrics?.hdiSpent?.[0] || localUserData?.hdiVendorSpend || 750000,
        trainingSpend: financialData?.balanceSheetData?.assets?.additionalMetrics?.trainingSpend?.[0] || localUserData?.trainingSpend || 250000,
        labourCost: financialData?.balanceSheetData?.assets?.additionalMetrics?.labourCost?.[0] || localUserData?.labourCost || 2000000,
        numberOfEmployees: financialData?.balanceSheetData?.assets?.additionalMetrics?.numberOfEmployees?.[0] || localUserData?.numberOfEmployees || 50,
        revenuePerEmployee: financialData?.balanceSheetData?.assets?.additionalMetrics?.revenuePerEmployee?.[0] || localUserData?.revenuePerEmployee || 500000,
      }
      
      setLocalUserData(mergedData)
      
      // Save to parent if needed
      if (JSON.stringify(mergedData) !== JSON.stringify(userData)) {
        onSave(mergedData)
      }
    }
  }, [fundingAppData, financialData])

  // Chart options for pie/doughnut charts with values INSIDE (white text)
  const getPieChartOptions = (title, showLegend = true) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: showLegend ? "bottom" : "none",
        labels: {
          color: "#5d4037",
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        enabled: true
      },
      datalabels: {
        color: "#ffffff",
        font: {
          weight: "bold",
          size: 16
        },
        formatter: (value, context) => {
          return value + '%';
        },
        anchor: 'center',
        align: 'center',
        offset: 0
      }
    }
  })

  // Handle dropdown changes for social data
  const handleDropdownChange = (field, value) => {
    const updatedData = { ...localUserData, [field]: value };
    setLocalUserData(updatedData)
    onSave(updatedData);
  };

  const renderWorkforceDemographics = () => {
    // Data from funding application + userData
    const workforceData = {
      locality: localUserData?.locality || 65,
      gender: localUserData?.gender || 45,
      eap: localUserData?.eap || 70, // From disabled ownership
      femaleLeadership: localUserData?.femaleLeadership || 35,
      youthLeadership: localUserData?.youthLeadership || 25, // From youth ownership
      bbbeeLevel: localUserData?.bbbeeLevel || 4,
      jobsCreated: localUserData?.jobsCreated || 150, // From jobsToCreate
    }

    return (
      <div>
        <KeyQuestionBox
          question="Does the workforce profile align with transformation and inclusion expectations of external stakeholders? This includes assessing B-BBEE positioning and employment impact."
          signals="B-BBEE positioning, Employment impact"
          decisions="Eligibility for ESD, CSI, procurement, Alignment with funder mandates"
          section="workforce-demographics"
        />

        <div
          style={{
            backgroundColor: "#fdfcfb",
            padding: "25px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            marginBottom: "30px",
          }}
        >
          <h3
            style={{
              color: "#5d4037",
              marginTop: 0,
              marginBottom: "25px",
              fontSize: "18px",
              fontWeight: "600",
              borderBottom: "2px solid #e8ddd4",
              paddingBottom: "10px",
            }}
          >
            Workforce Demographics
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            {/* Locality Chart */}
            <ESGChartCard
              title="Locality"
              chartType="doughnut"
              data={{
                labels: ["Local", "Non-Local"],
                datasets: [
                  {
                    data: [workforceData.locality, 100 - workforceData.locality],
                    backgroundColor: ["#5d4037", "#e8ddd4"],
                    borderColor: "#ffffff",
                    borderWidth: 3,
                  },
                ],
              }}
              options={getPieChartOptions("Locality")}
              kpiKey="locality"
              unit="%"
              isInvestorView={isInvestorView}
            />

            {/* Gender Chart */}
            <ESGChartCard
              title="Gender"
              chartType="doughnut"
              data={{
                labels: ["Female", "Male"],
                datasets: [
                  {
                    data: [workforceData.gender, 100 - workforceData.gender],
                    backgroundColor: ["#8d6e63", "#5d4037"],
                    borderColor: "#ffffff",
                    borderWidth: 3,
                  },
                ],
              }}
              options={getPieChartOptions("Gender")}
              kpiKey="gender"
              unit="%"
              isInvestorView={isInvestorView}
            />

            {/* EAP Chart (Disabled) */}
            <ESGChartCard
              title="EAP (Disabled)"
              chartType="doughnut"
              data={{
                labels: ["EAP", "Non-EAP"],
                datasets: [
                  {
                    data: [workforceData.eap, 100 - workforceData.eap],
                    backgroundColor: ["#3e2723", "#8d6e63"],
                    borderColor: "#ffffff",
                    borderWidth: 3,
                  },
                ],
              }}
              options={getPieChartOptions("EAP")}
              kpiKey="eap"
              unit="%"
              isInvestorView={isInvestorView}
            />

            {/* Female Leadership */}
            <ESGChartCard
              title="Female Leadership"
              chartType="doughnut"
              data={{
                labels: ["Female Leaders", "Other"],
                datasets: [
                  {
                    data: [workforceData.femaleLeadership, 100 - workforceData.femaleLeadership],
                    backgroundColor: ["#795548", "#d7ccc8"],
                    borderColor: "#ffffff",
                    borderWidth: 3,
                  },
                ],
              }}
              options={getPieChartOptions("Female Leadership")}
              kpiKey="femaleLeadership"
              unit="%"
              isInvestorView={isInvestorView}
            />

            {/* Youth Leadership */}
            <ESGChartCard
              title="Youth Leadership"
              chartType="doughnut"
              data={{
                labels: ["Youth Leaders", "Other"],
                datasets: [
                  {
                    data: [workforceData.youthLeadership, 100 - workforceData.youthLeadership],
                    backgroundColor: ["#6d4c41", "#d7ccc8"],
                    borderColor: "#ffffff",
                    borderWidth: 3,
                  },
                ],
              }}
              options={getPieChartOptions("Youth Leadership")}
              kpiKey="youthLeadership"
              unit="%"
              isInvestorView={isInvestorView}
            />
          </div>
        </div>
      </div>
    )
  }

  const renderOwnershipInclusion = () => {
    // Data from funding application + userData
    const ownershipData = {
      hdiOwnership: localUserData?.hdiOwnership || 65,
      shareholderGenderMale: localUserData?.shareholderGenderMale || 60,
      shareholderGenderFemale: localUserData?.shareholderGenderFemale || 35, // From women ownership
      shareholderRaceBlack: localUserData?.shareholderRaceBlack || 40, // From black ownership
      permanentJobs: localUserData?.permanentJobs || 120,
      contractJobs: localUserData?.contractJobs || 80,
      bbbeeLevel: localUserData?.bbbeeLevel || 4,
    }

    return (
      <div>
        <KeyQuestionBox
          question="Does ownership structure support inclusion and transformation objectives? This involves assessing HDI / Black ownership, youth, gender, and disability ownership."
          signals="HDI / Black ownership, Youth, gender, disability ownership"
          decisions="Eligibility for targeted funding or ESD, Transformation gap remediation"
          section="ownership-inclusion"
        />

        <div
          style={{
            backgroundColor: "#fdfcfb",
            padding: "25px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            marginBottom: "30px",
          }}
        >
          <h3
            style={{
              color: "#5d4037",
              marginTop: 0,
              marginBottom: "25px",
              fontSize: "18px",
              fontWeight: "600",
              borderBottom: "2px solid #e8ddd4",
              paddingBottom: "10px",
            }}
          >
            Ownership & Inclusion
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            {/* HDI Ownership Chart */}
            <ESGChartCard
              title="HDI Ownership"
              chartType="doughnut"
              data={{
                labels: ["HDI-Owned", "Non-HDI"],
                datasets: [
                  {
                    data: [ownershipData.hdiOwnership, 100 - ownershipData.hdiOwnership],
                    backgroundColor: ["#5d4037", "#e8ddd4"],
                    borderColor: "#ffffff",
                    borderWidth: 3,
                  },
                ],
              }}
              options={getPieChartOptions("HDI Ownership")}
              kpiKey="hdiOwnership"
              unit="%"
              isInvestorView={isInvestorView}
            />

            {/* Shareholder Demographics - Gender */}
            <ESGChartCard
              title="Shareholder Gender"
              chartType="pie"
              data={{
                labels: ["Male", "Female"],
                datasets: [
                  {
                    data: [ownershipData.shareholderGenderMale, ownershipData.shareholderGenderFemale],
                    backgroundColor: ["#3e2723", "#8d6e63"],
                    borderColor: "#ffffff",
                    borderWidth: 3,
                  },
                ],
              }}
              options={getPieChartOptions("Shareholder Gender")}
              kpiKey="shareholderGender"
              unit="%"
              isInvestorView={isInvestorView}
            />

            {/* Shareholder Demographics - Race */}
            <ESGChartCard
              title="Shareholder Race"
              chartType="pie"
              data={{
                labels: ["Black", "White", "Colored", "Indian/Asian"],
                datasets: [
                  {
                    data: [ownershipData.shareholderRaceBlack, 30, 15, 10],
                    backgroundColor: ["#3e2723", "#5d4037", "#8d6e63", "#a1887f"],
                    borderColor: "#ffffff",
                    borderWidth: 3,
                  },
                ],
              }}
              options={getPieChartOptions("Shareholder Race")}
              kpiKey="shareholderRace"
              unit="%"
              isInvestorView={isInvestorView}
            />

            {/* Total Jobs Created Chart with B-BBEE Level circle */}
            <div style={{ 
              display: "flex", 
              flexDirection: "column",
              gap: "20px",
              gridColumn: "span 2"
            }}>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "2fr 1fr", 
                gap: "20px",
                alignItems: "center"
              }}>
                {/* Jobs Created Chart */}
                <div>
                  <ESGChartCard
                    title="Total Jobs Created"
                    chartType="bar"
                    data={{
                      labels: ["Permanent", "Contract"],
                      datasets: [
                        {
                          label: "Jobs",
                          data: [ownershipData.permanentJobs, ownershipData.contractJobs],
                          backgroundColor: "#5d4037",
                          borderColor: "#5d4037",
                          borderWidth: 2,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: "Number of Jobs",
                          },
                        },
                      },
                      plugins: {
                        tooltip: {
                          enabled: true
                        },
                        datalabels: {
                          display: false
                        }
                      }
                    }}
                    kpiKey="totalJobs"
                    unit="jobs"
                    isInvestorView={isInvestorView}
                  />
                </div>

                {/* B-BBEE Level Circle */}
                <div
                  style={{
                    backgroundColor: "#fdfcfb",
                    padding: "20px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    textAlign: "center",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <h4 style={{ color: "#5d4037", marginBottom: "20px", fontSize: "16px" }}>B-BBEE Level</h4>
                  <div
                    style={{
                      width: "120px",
                      height: "120px",
                      borderRadius: "50%",
                      backgroundColor: "#5d4037",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fdfcfb",
                      fontSize: "42px",
                      fontWeight: "bold",
                      margin: "0 auto 15px auto",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                    }}
                  >
                    {ownershipData.bbbeeLevel === "non-compliant" ? "NC" : ownershipData.bbbeeLevel}
                  </div>
                  <div style={{ color: "#8d6e63", fontSize: "15px", fontWeight: "600" }}>
                    {ownershipData.bbbeeLevel === "non-compliant" ? "Non-Compliant" : `Level ${ownershipData.bbbeeLevel}`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

const renderCommunityESD = () => {
    // Get months based on financial year end
    const months = getMonthsForYear(financialYearEnd)
    
    // Get REAL data from actual sources
    const csiData = {
      // CSI/CSR from funding application (monthly now)
      csiSpend: parseCurrency(localUserData?.csiSpend) || 0,
      csiPercentage: localUserData?.csiPercentage || 0,
      hasMonthlyCsiData: financialData?.balanceSheetData?.assets?.additionalMetrics?.csiSpent ? true : false,
      monthlyCsiData: financialData?.balanceSheetData?.assets?.additionalMetrics?.csiSpent || [],
      
      // HDI Spend from financial data
      hdiVendorSpend: localUserData?.hdiSpent || localUserData?.hdiVendorSpend || 0,
      hdiPercentage: localUserData?.hdiPercentage || 0,
      hasMonthlyHdiData: financialData?.balanceSheetData?.assets?.additionalMetrics?.hdiSpent ? true : false,
      monthlyHdiData: financialData?.balanceSheetData?.assets?.additionalMetrics?.hdiSpent || [],
    }

    // Log the data to debug
    console.log('Monthly CSI Data:', csiData.monthlyCsiData);
    console.log('Monthly HDI Data:', csiData.monthlyHdiData);
    console.log('Months:', months);

    return (
      <div>
        <KeyQuestionBox
          question="Is the business contributing meaningfully to broader social and economic development? This involves evaluating CSI intent and ESD participation maturity."
          signals="CSI intent, ESD participation maturity"
          decisions="Qualify for CSI / ESG-linked funding?, Partnership readiness with corporates, readiness to have own CSI programme, readiness to have own ESD programme"
          section="community-esd"
        />

        <div
          style={{
            backgroundColor: "#fdfcfb",
            padding: "25px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            marginBottom: "30px",
          }}
        >
          <h3
            style={{
              color: "#5d4037",
              marginTop: 0,
              marginBottom: "25px",
              fontSize: "18px",
              fontWeight: "600",
              borderBottom: "2px solid #e8ddd4",
              paddingBottom: "10px",
            }}
          >
            Community & ESD Participation
          </h3>

          {/* Data Source Indicator - Simplified */}
          <div style={{ 
            marginBottom: "20px", 
            padding: "10px", 
            backgroundColor: "#fff3e0", 
            borderRadius: "4px",
            fontSize: "13px",
            color: "#5d4037",
            borderLeft: "4px solid #ff9800"
          }}>
            <strong>📊 Monthly Data Available:</strong>{' '}
            {csiData.hasMonthlyCsiData && 'CSI ✓ '}
            {csiData.hasMonthlyHdiData && 'HDI ✓ '}
            {!csiData.hasMonthlyCsiData && !csiData.hasMonthlyHdiData && 'Annual only'}
          </div>

          {/* CSI/HDI Spend Selection */}
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "15px",
                backgroundColor: "#e8ddd4",
                padding: "10px",
                borderRadius: "6px",
              }}
            >
              <button
                onClick={() => setActiveSpendTab("csi")}
                style={{
                  padding: "8px 16px",
                  backgroundColor: activeSpendTab === "csi" ? "#5d4037" : "transparent",
                  color: activeSpendTab === "csi" ? "#fdfcfb" : "#5d4037",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                  transition: "all 0.3s ease",
                }}
              >
                CSI/CSR Spend
              </button>
              <button
                onClick={() => setActiveSpendTab("hdi")}
                style={{
                  padding: "8px 16px",
                  backgroundColor: activeSpendTab === "hdi" ? "#5d4037" : "transparent",
                  color: activeSpendTab === "hdi" ? "#fdfcfb" : "#5d4037",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                  transition: "all 0.3s ease",
                }}
              >
                HDI Spend
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            {/* CSI/CSR Combined Chart - Amount (Bar) + Percentage (Line) */}
            {activeSpendTab === "csi" && (
              <ESGChartCard
                title={csiData.hasMonthlyCsiData ? "CSI/CSR Spend & % of Revenue (Monthly)" : "CSI/CSR Spend & % of Revenue (Annual)"}
                chartType="bar"
                data={{
                  labels: csiData.hasMonthlyCsiData ? months : ["Annual Total"],
                  datasets: [
                    {
                      label: "CSI Spend (R millions)",
                      type: 'bar',
                      data: csiData.hasMonthlyCsiData 
                        ? csiData.monthlyCsiData.map(v => v / 1000000)
                        : [csiData.csiSpend / 1000000],
                      backgroundColor: "#5d4037",
                      borderColor: "#5d4037",
                      borderWidth: 2,
                      yAxisID: 'y-axis-amount',
                    },
                    {
                      label: "CSI % of Revenue",
                      type: 'line',
                      data: csiData.hasMonthlyCsiData 
                        ? months.map(() => csiData.csiPercentage)
                        : [csiData.csiPercentage],
                      backgroundColor: "#9e9e9e",
                      borderColor: "#9e9e9e",
                      borderWidth: 3,
                      pointBackgroundColor: "#9e9e9e",
                      pointBorderColor: "#fff",
                      pointBorderWidth: 2,
                      pointRadius: 5,
                      pointHoverRadius: 7,
                      fill: false,
                      tension: 0.1,
                      yAxisID: 'y-axis-percentage',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    'y-axis-amount': {
                      type: 'linear',
                      position: 'left',
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: "Amount (R millions)",
                      },
                      grid: {
                        drawOnChartArea: false,
                      },
                    },
                    'y-axis-percentage': {
                      type: 'linear',
                      position: 'right',
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: "Percentage (%)",
                      },
                      grid: {
                        drawOnChartArea: false,
                      },
                    },
                  },
                  plugins: {
                    tooltip: {
                      enabled: true,
                      callbacks: {
                        label: (context) => {
                          if (context.dataset.label === "CSI Spend (R millions)") {
                            return `CSI Spend: R ${(context.raw * 1000000).toLocaleString()}`;
                          } else {
                            return `CSI % of Revenue: ${context.raw.toFixed(2)}%`;
                          }
                        }
                      }
                    },
                    datalabels: {
                      display: false
                    }
                  }
                }}
                kpiKey="csiSpend"
                unit="R"
                isInvestorView={isInvestorView}
              />
            )}

            {/* HDI Combined Chart - Amount (Bar) + Percentage (Line) */}
            {activeSpendTab === "hdi" && (
              <ESGChartCard
                title={csiData.hasMonthlyHdiData ? "HDI Spend & % of Revenue (Monthly)" : "HDI Spend & % of Revenue (Annual)"}
                chartType="bar"
                data={{
                  labels: csiData.hasMonthlyHdiData ? months : ["Annual Total"],
                  datasets: [
                    {
                      label: "HDI Spend (R millions)",
                      type: 'bar',
                      data: csiData.hasMonthlyHdiData 
                        ? csiData.monthlyHdiData.map(v => v / 1000000)
                        : [csiData.hdiVendorSpend / 1000000],
                      backgroundColor: "#8d6e63",
                      borderColor: "#8d6e63",
                      borderWidth: 2,
                      yAxisID: 'y-axis-amount',
                    },
                    {
                      label: "HDI % of Revenue",
                      type: 'line',
                      data: csiData.hasMonthlyHdiData 
                        ? months.map(() => csiData.hdiPercentage)
                        : [csiData.hdiPercentage],
                      backgroundColor: "#9e9e9e",
                      borderColor: "#9e9e9e",
                      borderWidth: 3,
                      pointBackgroundColor: "#9e9e9e",
                      pointBorderColor: "#fff",
                      pointBorderWidth: 2,
                      pointRadius: 5,
                      pointHoverRadius: 7,
                      fill: false,
                      tension: 0.1,
                      yAxisID: 'y-axis-percentage',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    'y-axis-amount': {
                      type: 'linear',
                      position: 'left',
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: "Amount (R millions)",
                      },
                      grid: {
                        drawOnChartArea: false,
                      },
                    },
                    'y-axis-percentage': {
                      type: 'linear',
                      position: 'right',
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: "Percentage (%)",
                      },
                      grid: {
                        drawOnChartArea: false,
                      },
                    },
                  },
                  plugins: {
                    tooltip: {
                      enabled: true,
                      callbacks: {
                        label: (context) => {
                          if (context.dataset.label === "HDI Spend (R millions)") {
                            return `HDI Spend: R ${(context.raw * 1000000).toLocaleString()}`;
                          } else {
                            return `HDI % of Revenue: ${context.raw.toFixed(2)}%`;
                          }
                        }
                      }
                    },
                    datalabels: {
                      display: false
                    }
                  }
                }}
                kpiKey="hdiVendorSpend"
                unit="R"
                isInvestorView={isInvestorView}
              />
            )}
          </div>

          {/* CSI/CSR Projects Table */}
          <div style={{ marginTop: "30px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h4 style={{ color: "#5d4037", fontSize: "16px" }}>CSI/CSR Projects</h4>
              {!isInvestorView && (
                <button
                  onClick={() => {
                    alert("Add project functionality coming soon")
                  }}
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
                  + Add Project
                </button>
              )}
            </div>
            <div
              style={{
                backgroundColor: "#fdfcfb",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#e8ddd4" }}>
                    <th style={{ padding: "12px", textAlign: "left", color: "#5d4037", fontSize: "14px" }}>Project Name</th>
                    <th style={{ padding: "12px", textAlign: "left", color: "#5d4037", fontSize: "14px" }}>Focus Area</th>
                    <th style={{ padding: "12px", textAlign: "right", color: "#5d4037", fontSize: "14px" }}>Budget (R)</th>
                    <th style={{ padding: "12px", textAlign: "left", color: "#5d4037", fontSize: "14px" }}>Status</th>
                    <th style={{ padding: "12px", textAlign: "center", color: "#5d4037", fontSize: "14px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #e8ddd4" }}>
                    <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>Youth Skills Development</td>
                    <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>Education</td>
                    <td style={{ padding: "12px", textAlign: "right", color: "#5d4037", fontSize: "14px" }}>250,000</td>
                    <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>Active</td>
                    <td style={{ padding: "12px", textAlign: "center", color: "#5d4037", fontSize: "14px" }}>
                      <button style={{ background: "none", border: "none", color: "#5d4037", cursor: "pointer", margin: "0 5px" }}>Edit</button>
                      <button style={{ background: "none", border: "none", color: "#5d4037", cursor: "pointer", margin: "0 5px" }}>Delete</button>
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e8ddd4" }}>
                    <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>Community Health Initiative</td>
                    <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>Healthcare</td>
                    <td style={{ padding: "12px", textAlign: "right", color: "#5d4037", fontSize: "14px" }}>150,000</td>
                    <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>Planning</td>
                    <td style={{ padding: "12px", textAlign: "center", color: "#5d4037", fontSize: "14px" }}>
                      <button style={{ background: "none", border: "none", color: "#5d4037", cursor: "pointer", margin: "0 5px" }}>Edit</button>
                      <button style={{ background: "none", border: "none", color: "#5d4037", cursor: "pointer", margin: "0 5px" }}>Delete</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const socialSubTabs = [
    { id: "workforce-demographics", label: "Workforce Demographics" },
    { id: "ownership-inclusion", label: "Ownership & Inclusion" },
    { id: "community-esd", label: "Community & ESD Participation" },
  ]

  return (
    <div>
      {/* Social Sub Tabs */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "25px",
          padding: "10px",
          backgroundColor: "#fdfcfb",
          borderRadius: "8px",
          flexWrap: "wrap",
        }}
      >
        {socialSubTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              padding: "10px 20px",
              backgroundColor: activeSubTab === tab.id ? "#5d4037" : "#e8ddd4",
              color: activeSubTab === tab.id ? "#fdfcfb" : "#5d4037",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              transition: "all 0.3s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub Tab Content */}
      {activeSubTab === "workforce-demographics" && renderWorkforceDemographics()}
      {activeSubTab === "ownership-inclusion" && renderOwnershipInclusion()}
      {activeSubTab === "community-esd" && renderCommunityESD()}
    </div>
  )
}

// Governance Tab Component - REDESIGNED WITH TABLES (fixed editing)
const GovernanceTab = ({ userData, onSave, isInvestorView }) => {
  const [policies, setPolicies] = useState(userData?.policies || [])
  const [risks, setRisks] = useState(userData?.risks || [])
  const [boardData, setBoardData] = useState(userData?.boardData || { directors: [], advisors: [] })

  // Handle dropdown changes for governance data
  const handleDropdownChange = (field, value) => {
    const updatedData = { ...userData, [field]: value };
    onSave(updatedData);
  };

  return (
    <div>
      <KeyQuestionBox
        question="Are ownership and control structures clearly documented and transparent? This involves assessing control concentration and founder dominance risk."
        signals="Control concentration, Founder dominance risk"
        decisions="Governance uplift requirements before funding, minority protection sufficiency"
        section="governance-ownership"
      />

      {/* First Row: Policies and SOPs AND Risk, Controls & Reporting */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
        {/* Policies and SOPs Section */}
        <div
          style={{
            backgroundColor: "#fdfcfb",
            padding: "25px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              color: "#5d4037",
              marginTop: 0,
              marginBottom: "25px",
              fontSize: "18px",
              fontWeight: "600",
              borderBottom: "2px solid #e8ddd4",
              paddingBottom: "10px",
            }}
          >
            Policies and SOPs
          </h3>

          <div style={{ display: "grid", gap: "20px" }}>
            {/* Core Governance Policies */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <label
                style={{
                  minWidth: "150px",
                  color: "#5d4037",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Core Governance Policies:
              </label>
              <select
                value={userData?.corePolicies || "no"}
                onChange={(e) => handleDropdownChange("corePolicies", e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 15px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                  color: "#5d4037",
                  backgroundColor: "#fdfcfb",
                  cursor: isInvestorView ? "not-allowed" : "pointer",
                  opacity: isInvestorView ? 0.7 : 1,
                }}
                disabled={isInvestorView}
              >
                <option value="no">No</option>
                <option value="partial">Partial</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            {/* Critical SOPs */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <label
                style={{
                  minWidth: "150px",
                  color: "#5d4037",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Critical SOPs Documented:
              </label>
              <select
                value={userData?.criticalSOPs || "no"}
                onChange={(e) => handleDropdownChange("criticalSOPs", e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 15px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                  color: "#5d4037",
                  backgroundColor: "#fdfcfb",
                  cursor: isInvestorView ? "not-allowed" : "pointer",
                  opacity: isInvestorView ? 0.7 : 1,
                }}
                disabled={isInvestorView}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </div>

          {/* Show Policies Table if answer is Yes */}
          {(userData?.corePolicies === "yes" || userData?.criticalSOPs === "yes") && (
            <PoliciesTable 
              policies={policies} 
              onUpdate={(newPolicies) => {
                setPolicies(newPolicies)
                onSave({ ...userData, policies: newPolicies })
              }}
              isInvestorView={isInvestorView}
            />
          )}
        </div>

        {/* Risk, Controls & Reporting Section */}
        <div
          style={{
            backgroundColor: "#fdfcfb",
            padding: "25px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              color: "#5d4037",
              marginTop: 0,
              marginBottom: "25px",
              fontSize: "18px",
              fontWeight: "600",
              borderBottom: "2px solid #e8ddd4",
              paddingBottom: "10px",
            }}
          >
            Risk, Controls & Reporting
          </h3>

          <div style={{ display: "grid", gap: "20px" }}>
            {/* Risk Register */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <label
                style={{
                  minWidth: "150px",
                  color: "#5d4037",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Risk Register Maintained:
              </label>
              <select
                value={userData?.riskRegister || "no"}
                onChange={(e) => handleDropdownChange("riskRegister", e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 15px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                  color: "#5d4037",
                  backgroundColor: "#fdfcfb",
                  cursor: isInvestorView ? "not-allowed" : "pointer",
                  opacity: isInvestorView ? 0.7 : 1,
                }}
                disabled={isInvestorView}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            {/* Reporting Responsibility */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <label
                style={{
                  minWidth: "150px",
                  color: "#5d4037",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Reporting Responsibility Assigned:
              </label>
              <select
                value={userData?.reportingResponsibility || "no"}
                onChange={(e) => handleDropdownChange("reportingResponsibility", e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 15px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                  color: "#5d4037",
                  backgroundColor: "#fdfcfb",
                  cursor: isInvestorView ? "not-allowed" : "pointer",
                  opacity: isInvestorView ? 0.7 : 1,
                }}
                disabled={isInvestorView}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </div>

          {/* Show Risk Table if answer is Yes */}
          {userData?.riskRegister === "yes" && (
            <RiskTable 
              risks={risks} 
              onUpdate={(newRisks) => {
                setRisks(newRisks)
                onSave({ ...userData, risks: newRisks })
              }}
              isInvestorView={isInvestorView}
            />
          )}
        </div>
      </div>

      {/* Second Row: Ownership & Control AND Oversight & Accountability */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
        {/* Ownership & Control Section */}
        <div
          style={{
            backgroundColor: "#fdfcfb",
            padding: "25px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              color: "#5d4037",
              marginTop: 0,
              marginBottom: "25px",
              fontSize: "18px",
              fontWeight: "600",
              borderBottom: "2px solid #e8ddd4",
              paddingBottom: "10px",
            }}
          >
            Ownership & Control
          </h3>

          <div style={{ display: "grid", gap: "20px" }}>
            {/* Shareholder Register */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <label
                style={{
                  minWidth: "150px",
                  color: "#5d4037",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Shareholder Register Maintained:
              </label>
              <select
                value={userData?.shareholderRegister || "no"}
                onChange={(e) => handleDropdownChange("shareholderRegister", e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 15px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                  color: "#5d4037",
                  backgroundColor: "#fdfcfb",
                  cursor: isInvestorView ? "not-allowed" : "pointer",
                  opacity: isInvestorView ? 0.7 : 1,
                }}
                disabled={isInvestorView}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            {/* Voting Rights */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <label
                style={{
                  minWidth: "150px",
                  color: "#5d4037",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Voting Rights Documented:
              </label>
              <select
                value={userData?.votingRights || "no"}
                onChange={(e) => handleDropdownChange("votingRights", e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 15px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                  color: "#5d4037",
                  backgroundColor: "#fdfcfb",
                  cursor: isInvestorView ? "not-allowed" : "pointer",
                  opacity: isInvestorView ? 0.7 : 1,
                }}
                disabled={isInvestorView}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Oversight & Accountability Section */}
        <div
          style={{
            backgroundColor: "#fdfcfb",
            padding: "25px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              color: "#5d4037",
              marginTop: 0,
              marginBottom: "25px",
              fontSize: "18px",
              fontWeight: "600",
              borderBottom: "2px solid #e8ddd4",
              paddingBottom: "10px",
            }}
          >
            Oversight & Accountability
          </h3>

          <div style={{ display: "grid", gap: "20px" }}>
            {/* Oversight Structure */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <label
                style={{
                  minWidth: "150px",
                  color: "#5d4037",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Oversight Structure:
              </label>
              <select
                value={userData?.oversightStructure || "none"}
                onChange={(e) => handleDropdownChange("oversightStructure", e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 15px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                  color: "#5d4037",
                  backgroundColor: "#fdfcfb",
                  cursor: isInvestorView ? "not-allowed" : "pointer",
                  opacity: isInvestorView ? 0.7 : 1,
                }}
                disabled={isInvestorView}
              >
                <option value="none">None</option>
                <option value="founder-only">Founder Only</option>
                <option value="advisory-board">Advisory Board</option>
                <option value="formal-board">Formal Board</option>
              </select>
            </div>

            {/* Meeting Cadence */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <label
                style={{
                  minWidth: "150px",
                  color: "#5d4037",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Meeting Cadence:
              </label>
              <select
                value={userData?.meetingCadence || "ad-hoc"}
                onChange={(e) => handleDropdownChange("meetingCadence", e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 15px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                  color: "#5d4037",
                  backgroundColor: "#fdfcfb",
                  cursor: isInvestorView ? "not-allowed" : "pointer",
                  opacity: isInvestorView ? 0.7 : 1,
                }}
                disabled={isInvestorView}
              >
                <option value="ad-hoc">Ad Hoc</option>
                <option value="quarterly">Quarterly</option>
                <option value="monthly">Monthly</option>
                <option value="regular">Regular</option>
              </select>
            </div>

            {/* Female Directors */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <label
                style={{
                  minWidth: "150px",
                  color: "#5d4037",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Female Directors:
              </label>
              <input
                type="number"
                value={userData?.femaleDirectors || ""}
                onChange={(e) => handleDropdownChange("femaleDirectors", Number.parseInt(e.target.value) || 0)}
                placeholder="Number"
                style={{
                  flex: 1,
                  padding: "10px 15px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                  color: "#5d4037",
                  backgroundColor: "#fdfcfb",
                  cursor: isInvestorView ? "not-allowed" : "text",
                  opacity: isInvestorView ? 0.7 : 1,
                }}
                disabled={isInvestorView}
              />
            </div>

            {/* Male Directors */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <label
                style={{
                  minWidth: "150px",
                  color: "#5d4037",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Male Directors:
              </label>
              <input
                type="number"
                value={userData?.maleDirectors || ""}
                onChange={(e) => handleDropdownChange("maleDirectors", Number.parseInt(e.target.value) || 0)}
                placeholder="Number"
                style={{
                  flex: 1,
                  padding: "10px 15px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  fontSize: "14px",
                  color: "#5d4037",
                  backgroundColor: "#fdfcfb",
                  cursor: isInvestorView ? "not-allowed" : "text",
                  opacity: isInvestorView ? 0.7 : 1,
                }}
                disabled={isInvestorView}
              />
            </div>
          </div>

          {/* Show Board Table based on oversight structure */}
          {userData?.oversightStructure && userData?.oversightStructure !== "none" && (
            <BoardTable 
              boardData={boardData}
              oversightStructure={userData.oversightStructure}
              onUpdate={(newBoardData) => {
                setBoardData(newBoardData)
                onSave({ ...userData, boardData: newBoardData })
              }}
              isInvestorView={isInvestorView}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Main ESG Component
const ESG = () => {
  const [activeMainTab, setActiveMainTab] = useState("environmental")
  const [activeSubTab, setActiveSubTab] = useState("workforce-demographics")
  const [currentUser, setCurrentUser] = useState(null)
  const [isInvestorView, setIsInvestorView] = useState(false)
  const [viewingSMEId, setViewingSMEId] = useState(null)
  const [viewingSMEName, setViewingSMEName] = useState("")
  // NEW: Add state for view origin
  const [viewOrigin, setViewOrigin] = useState("investor")
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalSection, setModalSection] = useState("")
  const [userData, setUserData] = useState({})
  const [fundingAppData, setFundingAppData] = useState(null)
  const [financialData, setFinancialData] = useState(null)
  const [financialYearEnd, setFinancialYearEnd] = useState("2026-03")

  // UPDATED: Check investor view mode and origin
  useEffect(() => {
    const investorViewMode = sessionStorage.getItem("investorViewMode")
    const smeId = sessionStorage.getItem("viewingSMEId")
    const smeName = sessionStorage.getItem("viewingSMEName")
    const origin = sessionStorage.getItem("viewOrigin") // Get the origin

    if (investorViewMode === "true" && smeId) {
      setIsInvestorView(true)
      setViewingSMEId(smeId)
      setViewingSMEName(smeName || "SME")
      setViewOrigin(origin || "investor") // Default to investor if not specified
    }
    
    // Get financial year end from user profile or set default
    const savedFYE = localStorage.getItem("financialYearEnd")
    if (savedFYE) {
      setFinancialYearEnd(savedFYE)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (isInvestorView && viewingSMEId) {
        setCurrentUser({ uid: viewingSMEId })
        fetchUserData(viewingSMEId)
        fetchFundingAppData(viewingSMEId)
        fetchFinancialData(viewingSMEId)
      } else {
        setCurrentUser(user)
        if (user) {
          fetchUserData(user.uid)
          fetchFundingAppData(user.uid)
          fetchFinancialData(user.uid)
        }
      }
    })

    return () => unsubscribe()
  }, [isInvestorView, viewingSMEId])

  const fetchUserData = async (userId) => {
    try {
      const esgDoc = await getDoc(doc(db, "esgData", userId))
      if (esgDoc.exists()) {
        setUserData(esgDoc.data())
      }
    } catch (error) {
      console.error("Error loading ESG data:", error)
    }
  }

  const fetchFundingAppData = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, "universalProfiles", userId))
      if (userDoc.exists()) {
        const data = userDoc.data()
        setFundingAppData(data.socialImpact || {})
      }
    } catch (error) {
      console.error("Error loading funding application data:", error)
    }
  }

  const fetchFinancialData = async (userId) => {
    try {
      // Fetch capital structure data
      const capitalDoc = await getDoc(doc(db, "financialData", `${userId}_capitalStructure`))
      if (capitalDoc.exists()) {
        setFinancialData(capitalDoc.data())
      }
    } catch (error) {
      console.error("Error loading financial data:", error)
    }
  }

  const handleSaveData = async (data) => {
    if (!currentUser) return

    try {
      const docRef = doc(db, "esgData", currentUser.uid)
      await setDoc(docRef, {
        ...userData,
        ...data,
        userId: currentUser.uid,
        updatedAt: new Date().toISOString(),
      })
      
      setUserData(prev => ({ ...prev, ...data }))
    } catch (error) {
      console.error("Error saving ESG data:", error)
    }
  }

  const openModal = (section) => {
    setModalSection(section)
    setIsModalOpen(true)
  }

  // UPDATED: Enhanced exit function with origin-based navigation
  const handleExitInvestorView = () => {
    // Clear all session storage items
    sessionStorage.removeItem("viewingSMEId")
    sessionStorage.removeItem("viewingSMEName")
    sessionStorage.removeItem("investorViewMode")
    sessionStorage.removeItem("viewOrigin")
    
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

  const mainTabs = [
    { id: "environmental", label: "Environmental" },
    { id: "social", label: "Social" },
    { id: "governance", label: "Governance" },
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
                  ? `Catalyst View: Viewing ${viewingSMEName}'s ESG Impact`
                  : `Investor View: Viewing ${viewingSMEName}'s ESG Impact`
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
          ESG Impact
        </h1>
        
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
          {showFullDescription ? "See less" : "See more about dashboard"}
        </button>
      </div>

      {/* ESG Description */}
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>
                What this dashboard DOES
              </h3>
              <ul style={{ color: "#4a352f", fontSize: "14px", lineHeight: "1.7", margin: 0, paddingLeft: "20px" }}>
                <li>Confirms ESG factors are tracked and governed</li>
                <li>Signals readiness for disclosure to funders, corporates, DFIs</li>
                <li>Assesses external trustworthiness and credibility</li>
                <li>Feeds into BIG Score (Governance, Compliance, Capital Appeal)</li>
                <li>Monitors ESG framework implementation and oversight</li>
              </ul>
            </div>

            <div>
              <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>
                What this dashboard does NOT do
              </h3>
              <ul style={{ color: "#4a352f", fontSize: "14px", lineHeight: "1.7", margin: 0, paddingLeft: "20px" }}>
                <li>Measure internal execution performance</li>
                <li>Provide sustainability reporting or SDG mapping</li>
                <li>Calculate carbon footprints or create ESG narratives</li>
                <li>Optimize impact or operational performance</li>
                <li>Replace audits, certifications, or statutory disclosures</li>
              </ul>
            </div>
          </div>

          <div style={{ marginTop: "30px", paddingTop: "20px", borderTop: "1px solid #e8ddd4" }}>
            <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>
              Key ESG Impact Dimensions
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
              <div>
                <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
                  Environmental
                </h4>
                <p style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
                  Track exposure, compliance, incidents, and controls to manage environmental risks
                </p>
              </div>
              <div>
                <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
                  Social
                </h4>
                <p style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
                  Monitor workforce demographics, ownership inclusion, and community development
                </p>
              </div>
              <div>
                <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
                  Governance
                </h4>
                <p style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
                  Assess ownership structures, oversight mechanisms, policies, and risk management
                </p>
              </div>
            </div>
            <p style={{ color: "#4a352f", fontSize: "13px", lineHeight: "1.6", marginTop: "15px" }}>
              Dashboards show the data. ESG confirms it exists, is governed, and is credible for external stakeholders.
            </p>
          </div>
        </div>
      )}

          {/* Main Tab Buttons */}
          <div
            style={{
              display: "flex",
              gap: "15px",
              margin: "30px 0",
              backgroundColor: "#fdfcfb",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              flexWrap: "wrap",
            }}
          >
            {mainTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveMainTab(tab.id)
                  if (tab.id === "social") setActiveSubTab("workforce-demographics")
                }}
                style={{
                  padding: "12px 24px",
                  backgroundColor: activeMainTab === tab.id ? "#5d4037" : "#e8ddd4",
                  color: activeMainTab === tab.id ? "#fdfcfb" : "#5d4037",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "15px",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  minWidth: "150px",
                  textAlign: "center",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeMainTab === "environmental" && (
            <EnvironmentalTab 
              userData={userData}
              onSave={handleSaveData}
              isInvestorView={isInvestorView}
            />
          )}

          {activeMainTab === "social" && (
            <SocialTab 
              activeSubTab={activeSubTab}
              setActiveSubTab={setActiveSubTab}
              userData={userData}
              onSave={handleSaveData}
              isInvestorView={isInvestorView}
              fundingAppData={fundingAppData}
              financialData={financialData}
            />
          )}

          {activeMainTab === "governance" && (
            <GovernanceTab 
              userData={userData}
              onSave={handleSaveData}
              isInvestorView={isInvestorView}
            />
          )}
        </div>
      </div>

      <DataEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        section={modalSection}
        onSave={handleSaveData}
        currentData={userData}
        financialYearEnd={financialYearEnd}
      />
    </div>
  )
}

export default ESG