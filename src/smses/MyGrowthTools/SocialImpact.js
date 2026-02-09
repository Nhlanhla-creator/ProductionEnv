"use client"

import { useState, useEffect } from "react"
import { Bar, Line, Pie, Doughnut, Scatter } from "react-chartjs-2"
import Sidebar from "smses/Sidebar/Sidebar"
import Header from "../DashboardHeader/DashboardHeader"
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
import ChartDataLabels from "chartjs-plugin-datalabels"

// Register ChartJS components
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

// Helper function to get months array based on year
const getMonthsForYear = (year, viewMode = "month") => {
  if (viewMode === "year") return [`FY ${year}`]
  if (viewMode === "quarter") return ["Q1", "Q2", "Q3", "Q4"]
  
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return months
}

// Key Question Component with Show More functionality (from Financial Performance)
const KeyQuestionBox = ({ question, signals, decisions, section }) => {
  const [showMore, setShowMore] = useState(false)
  
  // Get first sentence
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
        border: "1px solid	#5d4037",
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

// Data Entry Modal Component
const DataEntryModal = ({ isOpen, onClose, section, onSave, currentData }) => {
  const [formData, setFormData] = useState({})

  useEffect(() => {
    if (currentData) {
      setFormData(currentData)
    }
  }, [currentData])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
    onClose()
  }

  const renderFormFields = () => {
    switch (section) {
      case "environmental-exposure":
        return (
          <>
            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
                CSI/CSR Spend (R):
              </label>
              <input
                type="number"
                value={formData.csiSpend || ""}
                onChange={(e) => setFormData({ ...formData, csiSpend: Number.parseFloat(e.target.value) || 0 })}
                placeholder="Annual CSI Spend"
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
                HDI Vendor Spend (R):
              </label>
              <input
                type="number"
                value={formData.hdiVendorSpend || ""}
                onChange={(e) => setFormData({ ...formData, hdiVendorSpend: Number.parseFloat(e.target.value) || 0 })}
                placeholder="HDI Vendor Spend"
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

      case "governance-ownership":
        return (
          <>
            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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

      case "governance-policies":
        return (
          <>
            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
                Conditional Policies Identified & In Place:
              </label>
              <select
                value={formData.conditionalPolicies || "no"}
                onChange={(e) => setFormData({ ...formData, conditionalPolicies: e.target.value })}
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                }}
              >
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

// Environmental Tab Components - SIMPLIFIED WITH DROPDOWNS
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

      {/* Environmental Exposure & Compliance Section */}
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
          Environmental Exposure & Compliance
        </h3>

        <div style={{ display: "grid", gap: "20px" }}>
          {/* Environmental Exposure Type */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <label
              style={{
                minWidth: "220px",
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
                minWidth: "220px",
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
                minWidth: "220px",
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
                minWidth: "220px",
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
                minWidth: "220px",
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
  )
}

// Social Tab Components - WITH PIE CHARTS
// Social Tab Components - WITH PIE CHARTS
const SocialTab = ({ activeSubTab, setActiveSubTab, userData, onSave, isInvestorView }) => {
  const [selectedViewMode, setSelectedViewMode] = useState("month")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [activeSpendTab, setActiveSpendTab] = useState("csi") // "csi" or "hdi"
  const [activeProcurementTab, setActiveProcurementTab] = useState("amount") // "amount" or "percentage"

  // Chart options for pie/doughnut charts with values on top
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
        enabled: false // Disable hover tooltip
      },
      datalabels: {
        color: "#ffffff",
        font: {
          weight: "bold",
          size: 16
        },
        formatter: (value, context) => {
          return value + '%';
        }
      }
    }
  })

  // Handle dropdown changes for social data
  const handleDropdownChange = (field, value) => {
    const updatedData = { ...userData, [field]: value };
    onSave(updatedData);
  };

  const renderWorkforceDemographics = () => {
    // Data from userData with fallbacks
    const workforceData = {
      locality: userData?.locality || 65,
      gender: userData?.gender || 45,
      eap: userData?.eap || 70,
      femaleLeadership: userData?.femaleLeadership || 35,
      youthLeadership: userData?.youthLeadership || 25,
      bbbeeLevel: userData?.bbbeeLevel || 4,
      jobsCreated: userData?.jobsCreated || 150,
    }

    return (
      <div>
        <KeyQuestionBox
          question="Does the workforce profile align with transformation and inclusion expectations of external stakeholders? This includes assessing B-BBEE positioning and employment impact."
          signals="B-BBEE positioning, Employment impact"
          decisions="Eligibility for ESD, CSI, procurement, Alignment with funder mandates"
          section="workforce-demographics"
        />

        {/* Workforce Demographics - REMOVED B-BBEE dropdown from top */}
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

            {/* EAP Chart */}
            <ESGChartCard
              title="EAP"
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
    // Data from userData with fallbacks
    const ownershipData = {
      hdiOwnership: userData?.hdiOwnership || 65,
      shareholderGenderMale: userData?.shareholderGenderMale || 60,
      shareholderGenderFemale: userData?.shareholderGenderFemale || 35,
      shareholderRaceBlack: userData?.shareholderRaceBlack || 40,
      permanentJobs: userData?.permanentJobs || 120,
      contractJobs: userData?.contractJobs || 80,
      bbbeeLevel: userData?.bbbeeLevel || 4,
    }

    return (
      <div>
        <KeyQuestionBox
          question="Does ownership structure support inclusion and transformation objectives? This involves assessing HDI / Black ownership, youth, gender, and disability ownership."
          signals="HDI / Black ownership, Youth, gender, disability ownership"
          decisions="Eligibility for targeted funding or ESD, Transformation gap remediation"
          section="ownership-inclusion"
        />

        {/* Ownership Dropdowns - REMOVED B-BBEE dropdown from here */}
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

          {/* REMOVED the entire dropdown grid section */}

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
                labels: ["Male", "Female", "Other"],
                datasets: [
                  {
                    data: [ownershipData.shareholderGenderMale, ownershipData.shareholderGenderFemale, 5],
                    backgroundColor: ["#3e2723", "#8d6e63", "#d7ccc8"],
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
                labels: ["Black", "White", "Colored", "Indian/Asian", "Other"],
                datasets: [
                  {
                    data: [ownershipData.shareholderRaceBlack, 30, 15, 10, 5],
                    backgroundColor: ["#3e2723", "#5d4037", "#8d6e63", "#a1887f", "#d7ccc8"],
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

            {/* Total Jobs Created Chart with B-BBEE Level circle NEXT TO IT */}
            <div style={{ 
              display: "flex", 
              flexDirection: "column",
              gap: "20px",
              gridColumn: "span 2" // Make this take 2 columns
            }}>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "2fr 1fr", 
                gap: "20px",
                alignItems: "center"
              }}>
                {/* Jobs Created Chart - 2/3 width */}
                <div>
                  <ESGChartCard
                    title="Total Jobs Created"
                    chartType="bar"
                    data={{
                      labels: ["Permanent", "Contract", "Temporary", "Internship"],
                      datasets: [
                        {
                          label: "Jobs",
                          data: [ownershipData.permanentJobs, ownershipData.contractJobs, 30, 20],
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

                {/* B-BBEE Level Circle - 1/3 width */}
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
    // Data from userData with fallbacks
    const csiData = {
      csiSpend: userData?.csiSpend || 500000,
      csiPercentage: userData?.csiPercentage || 2.5,
      hdiVendorSpend: userData?.hdiVendorSpend || 750000,
      hdiPercentage: userData?.hdiPercentage || 35,
      totalProcurementSpend: userData?.totalProcurementSpend || 2000000,
      procurementPercentage: userData?.procurementPercentage || 65,
    }

    return (
      <div>
        <KeyQuestionBox
          question="Is the business contributing meaningfully to broader social and economic development? This involves evaluating CSI intent and ESD participation maturity."
          signals="CSI intent, ESD participation maturity"
          decisions="Qualify for CSI / ESG-linked funding?, Partnership readiness with corporates, readiness to have own CSI programme, readiness to have own ESD programme"
          section="community-esd"
        />

        {/* Community & ESD Section */}
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

          {/* View Mode Selectors */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <select
                value={selectedViewMode}
                onChange={(e) => setSelectedViewMode(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                  color: "#5d4037",
                }}
              >
                <option value="month">Monthly</option>
                <option value="quarter">Quarterly</option>
                <option value="year">Yearly</option>
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number.parseInt(e.target.value))}
                style={{
                  padding: "8px 12px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                  color: "#5d4037",
                }}
              >
                {[selectedYear - 2, selectedYear - 1, selectedYear, selectedYear + 1, selectedYear + 2].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
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
            {/* CSI/CSR Spend OR HDI Spend Chart (based on active tab) */}
            <ESGChartCard
              title={activeSpendTab === "csi" ? "CSI/CSR Spend (R)" : "HDI Spend (R)"}
              chartType="bar"
              data={{
                labels: getMonthsForYear(selectedYear, selectedViewMode),
                datasets: [
                  {
                    label: activeSpendTab === "csi" ? "CSI Spend" : "HDI Spend",
                    data: Array(getMonthsForYear(selectedYear, selectedViewMode).length)
                      .fill(0)
                      .map(() => {
                        const base = activeSpendTab === "csi" ? 
                          (Math.random() * 100000 + 50000) : 
                          (Math.random() * 500000 + 250000);
                        return base;
                      }),
                    backgroundColor: activeSpendTab === "csi" ? "#5d4037" : "#8d6e63",
                    borderColor: activeSpendTab === "csi" ? "#5d4037" : "#8d6e63",
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
                      text: "Amount (R)",
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
              kpiKey={activeSpendTab === "csi" ? "csiSpend" : "hdiVendorSpend"}
              unit="R"
              isInvestorView={isInvestorView}
            />

            {/* CSI/CSR Spend % OR HDI Spend % Chart (based on active tab) */}
            <ESGChartCard
              title={activeSpendTab === "csi" ? "CSI Spend as % of Revenue" : "HDI Spend as % of Revenue"}
              chartType="line"
              data={{
                labels: getMonthsForYear(selectedYear, selectedViewMode),
                datasets: [
                  {
                    label: activeSpendTab === "csi" ? "CSI %" : "HDI %",
                    data: Array(getMonthsForYear(selectedYear, selectedViewMode).length)
                      .fill(0)
                      .map(() => {
                        const base = activeSpendTab === "csi" ? 
                          (Math.random() * 5) : 
                          (Math.random() * 50 + 10);
                        return base;
                      }),
                    borderColor: activeSpendTab === "csi" ? "#5d4037" : "#8d6e63",
                    backgroundColor: activeSpendTab === "csi" ? "rgba(93, 64, 55, 0.1)" : "rgba(141, 110, 99, 0.1)",
                    borderWidth: 2,
                    tension: 0.1,
                    fill: true,
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
                      text: "Percentage (%)",
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
              kpiKey={activeSpendTab === "csi" ? "csiPercentage" : "hdiPercentage"}
              unit="%"
              isInvestorView={isInvestorView}
            />

            {/* Total Procurement Spend Chart - IN THE SAME LINE AS OTHERS */}
            <div>
              {/* Procurement Tabs */}
              <div style={{ 
                display: "flex", 
                gap: "10px", 
                marginBottom: "15px"
              }}>
                <button
                  onClick={() => setActiveProcurementTab("amount")}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: activeProcurementTab === "amount" ? "#5d4037" : "#e8ddd4",
                    color: activeProcurementTab === "amount" ? "#fdfcfb" : "#5d4037",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "13px",
                    transition: "all 0.3s ease",
                    flex: 1
                  }}
                >
                  Total Procurement Spend
                </button>
                <button
                  onClick={() => setActiveProcurementTab("percentage")}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: activeProcurementTab === "percentage" ? "#5d4037" : "#e8ddd4",
                    color: activeProcurementTab === "percentage" ? "#fdfcfb" : "#5d4037",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "13px",
                    transition: "all 0.3s ease",
                    flex: 1
                  }}
                >
                  Procurement % Spent
                </button>
              </div>

              {/* Total Procurement Spend Chart */}
              <ESGChartCard
                title="Procurement Spend"
                chartType={activeProcurementTab === "amount" ? "bar" : "line"}
                data={{
                  labels: getMonthsForYear(selectedYear, selectedViewMode),
                  datasets: [
                    {
                      label: activeProcurementTab === "amount" ? "Procurement Spend" : "Procurement %",
                      data: Array(getMonthsForYear(selectedYear, selectedViewMode).length)
                        .fill(0)
                        .map(() => {
                          const base = activeProcurementTab === "amount" ? 
                            (Math.random() * 1000000 + 500000) : 
                            (Math.random() * 30 + 50);
                          return base;
                        }),
                      backgroundColor: activeProcurementTab === "amount" ? "#3e2723" : "rgba(62, 39, 35, 0.1)",
                      borderColor: "#3e2723",
                      borderWidth: 2,
                      fill: activeProcurementTab === "percentage",
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
                        text: activeProcurementTab === "amount" ? "Amount (R)" : "Percentage (%)",
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
                kpiKey={activeProcurementTab === "amount" ? "totalProcurementSpend" : "procurementPercentage"}
                unit={activeProcurementTab === "amount" ? "R" : "%"}
                isInvestorView={isInvestorView}
              />
            </div>
          </div>

          {/* CSI/CSR Projects Table */}
          <div style={{ marginTop: "30px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h4 style={{ color: "#5d4037", fontSize: "16px" }}>CSI/CSR Projects</h4>
              <button
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
                  <tr>
                    <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>Environmental Cleanup</td>
                    <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>Environment</td>
                    <td style={{ padding: "12px", textAlign: "right", color: "#5d4037", fontSize: "14px" }}>75,000</td>
                    <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>Completed</td>
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
// Governance Tab Components - SIMPLIFIED WITH DROPDOWNS
const GovernanceTab = ({ userData, onSave, isInvestorView }) => {
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

      {/* Ownership & Control Section */}
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
          Ownership & Control
        </h3>

        <div style={{ display: "grid", gap: "20px" }}>
          {/* Shareholder Register */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <label
              style={{
                minWidth: "220px",
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
                minWidth: "220px",
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
          Oversight & Accountability
        </h3>

        <div style={{ display: "grid", gap: "20px" }}>
          {/* Oversight Structure */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <label
              style={{
                minWidth: "220px",
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
                minWidth: "220px",
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
        </div>
      </div>

      {/* Policies and SOPs Section */}
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
          Policies and SOPs
        </h3>

        <div style={{ display: "grid", gap: "20px" }}>
          {/* Core Governance Policies */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <label
              style={{
                minWidth: "220px",
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
                minWidth: "220px",
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
                minWidth: "220px",
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
                minWidth: "220px",
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
      </div>
    </div>
  )
}

// Main ESG Component
const ESG = () => {
  const [activeMainTab, setActiveMainTab] = useState("environmental")
  const [activeSubTab, setActiveSubTab] = useState("workforce-demographics")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [isInvestorView, setIsInvestorView] = useState(false)
  const [viewingSMEId, setViewingSMEId] = useState(null)
  const [viewingSMEName, setViewingSMEName] = useState("")
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalSection, setModalSection] = useState("")
  const [userData, setUserData] = useState({})

  useEffect(() => {
    const investorViewMode = sessionStorage.getItem("investorViewMode")
    const smeId = sessionStorage.getItem("viewingSMEId")
    const smeName = sessionStorage.getItem("viewingSMEName")

    if (investorViewMode === "true" && smeId) {
      setIsInvestorView(true)
      setViewingSMEId(smeId)
      setViewingSMEName(smeName || "SME")
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (isInvestorView && viewingSMEId) {
        setCurrentUser({ uid: viewingSMEId })
        fetchUserData(viewingSMEId)
      } else {
        setCurrentUser(user)
        if (user) {
          fetchUserData(user.uid)
        }
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

  const mainTabs = [
    { id: "environmental", label: "Environmental" },
    { id: "social", label: "Social" },
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
                Investor View: Viewing {viewingSMEName}'s ESG Impact
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
      ESG Impact
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
      <div style={{ padding: "50px", paddingTop: "100px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "-80px" }}>
          <div>
            <h3 style={{ color: "#7d5a50", marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>
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
            <h3 style={{ color: "#7d5a50", marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>
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
          <h3 style={{ color: "#7d5a50", marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>
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
    </div>
  )}

  {/* Main Tab Buttons */}
  <div
    style={{
      display: "flex",
      gap: "15px",
      margin: "30px 0",
      padding: "15px",
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
          // Reset sub tab when main tab changes
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
      />
    </div>
  )
}

export default ESG