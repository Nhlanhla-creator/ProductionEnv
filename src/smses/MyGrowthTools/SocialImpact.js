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
        backgroundColor: "#fff9c4",
        padding: "15px 20px",
        borderRadius: "8px",
        marginBottom: "20px",
        border: "1px solid #f9a825",
      }}
    >
      <div style={{ marginBottom: "8px" }}>
        <strong style={{ color: "#5d4037", fontSize: "14px" }}>Key Question:</strong>
        <span style={{ color: "#5d4037", fontSize: "14px", marginLeft: "8px" }}>
          {showMore ? question : getFirstSentence(question)}
        </span>
        {!showMore && question.length > getFirstSentence(question).length && (
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

// Environmental Tab Components
const EnvironmentalTab = ({ activeSubTab, setActiveSubTab, userData, onOpenModal, isInvestorView }) => {
  const environmentalSubTabs = [
    { id: "exposure-compliance", label: "Environmental Exposure & Compliance" },
    { id: "incidents-controls", label: "Environmental Incidents & Controls" },
  ]

  const renderExposureCompliance = () => (
    <div>
      <KeyQuestionBox
        question="Are environmental risks identified, tracked and managed where relevant? This includes assessing sector exposure (direct vs indirect), regulatory requirements, and licence-to-operate risk."
        signals="Sector exposure (direct vs indirect), Regulatory requirements, Licence-to-operate risk"
        decisions="Disclosures, readiness for compliance scrutiny, specialist oversight requirements, insurance or permitting risk"
        section="environmental-exposure"
      />

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
        {!isInvestorView && (
          <button
            onClick={() => onOpenModal("environmental-exposure")}
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
            Enter Data
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
        {/* Environmental Exposure Type */}
        <div
          style={{
            backgroundColor: "#fdfcfb",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h4 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "16px" }}>Environmental Exposure Type</h4>
          <div style={{ textAlign: "center", padding: "20px" }}>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: userData?.exposureType === "direct" ? "#c62828" : 
                       userData?.exposureType === "indirect" ? "#f57c00" : "#2e7d32",
                marginBottom: "10px",
              }}
            >
              {userData?.exposureType?.toUpperCase() || "NONE"}
            </div>
            <div style={{ color: "#8d6e63", fontSize: "14px" }}>
              {userData?.exposureType === "direct" ? "High Risk - Direct Environmental Impact" :
               userData?.exposureType === "indirect" ? "Medium Risk - Indirect Impact" :
               "Low Risk - Minimal Environmental Impact"}
            </div>
          </div>
        </div>

        {/* Environmental Compliance */}
        <div
          style={{
            backgroundColor: "#fdfcfb",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h4 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "16px" }}>Environmental Compliance Required</h4>
          <div style={{ textAlign: "center", padding: "20px" }}>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: userData?.complianceRequired === "yes" ? "#2e7d32" : "#c62828",
                marginBottom: "10px",
              }}
            >
              {userData?.complianceRequired?.toUpperCase() || "NO"}
            </div>
            <div style={{ color: "#8d6e63", fontSize: "14px" }}>
              {userData?.complianceRequired === "yes" ? "Regulatory Compliance Required" : "No Specific Compliance Required"}
            </div>
          </div>
        </div>

        {/* Environmental Permits */}
        <div
          style={{
            backgroundColor: "#fdfcfb",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h4 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "16px" }}>Environmental Permits in Place</h4>
          <div style={{ textAlign: "center", padding: "20px" }}>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: userData?.permitsInPlace === "yes" ? "#2e7d32" : 
                       userData?.permitsInPlace === "partial" ? "#f57c00" : "#c62828",
                marginBottom: "10px",
              }}
            >
              {userData?.permitsInPlace?.toUpperCase() || "NO"}
            </div>
            <div style={{ color: "#8d6e63", fontSize: "14px" }}>
              {userData?.permitsInPlace === "yes" ? "All Permits Secured" :
               userData?.permitsInPlace === "partial" ? "Partial Permits" :
               "No Permits Required/Secured"}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderIncidentsControls = () => (
    <div>
      <KeyQuestionBox
        question="Are environmental incidents monitored and managed transparently? and are controls in place to prevent recurrence? This involves tracking incident history logs and ensuring proper controls are documented."
        signals="Incident history logs, Controls Documented"
        decisions="Escalate risk to funders or insurers, Remediation before engagement"
        section="environmental-incidents"
      />

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
        {!isInvestorView && (
          <button
            onClick={() => onOpenModal("environmental-exposure")}
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
            Enter Data
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
        {/* Environmental Incidents */}
        <div
          style={{
            backgroundColor: "#fdfcfb",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h4 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "16px" }}>Environmental Incidents</h4>
          <div style={{ textAlign: "center", padding: "20px" }}>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: userData?.incidents === "major" ? "#c62828" : 
                       userData?.incidents === "minor" ? "#f57c00" : "#2e7d32",
                marginBottom: "10px",
              }}
            >
              {userData?.incidents?.toUpperCase() || "NONE"}
            </div>
            <div style={{ color: "#8d6e63", fontSize: "14px" }}>
              {userData?.incidents === "major" ? "Major Incidents Reported" :
               userData?.incidents === "minor" ? "Minor Incidents Only" :
               "No Incidents Reported"}
            </div>
          </div>
        </div>

        {/* Environmental Controls */}
        <div
          style={{
            backgroundColor: "#fdfcfb",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h4 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "16px" }}>Environmental Controls</h4>
          <div style={{ textAlign: "center", padding: "20px" }}>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: userData?.controls === "formal" ? "#2e7d32" : 
                       userData?.controls === "basic" ? "#f57c00" : "#c62828",
                marginBottom: "10px",
              }}
            >
              {userData?.controls?.toUpperCase() || "NONE"}
            </div>
            <div style={{ color: "#8d6e63", fontSize: "14px" }}>
              {userData?.controls === "formal" ? "Formal Control Systems" :
               userData?.controls === "basic" ? "Basic Control Measures" :
               "No Specific Controls"}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      {/* Environmental Sub Tabs */}
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
        {environmentalSubTabs.map((tab) => (
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
      {activeSubTab === "exposure-compliance" && renderExposureCompliance()}
      {activeSubTab === "incidents-controls" && renderIncidentsControls()}
    </div>
  )
}

// Social Tab Components
const SocialTab = ({ activeSubTab, setActiveSubTab, userData, onOpenModal, isInvestorView }) => {
  const [selectedViewMode, setSelectedViewMode] = useState("month")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const socialSubTabs = [
    { id: "workforce-demographics", label: "Workforce Demographics" },
    { id: "ownership-inclusion", label: "Ownership & Inclusion" },
    { id: "community-esd", label: "Community & ESD Participation" },
  ]

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

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
          {!isInvestorView && (
            <button
              onClick={() => onOpenModal("workforce-demographics")}
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
              Enter Data
            </button>
          )}
        </div>

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

        {/* B-BBEE Level and Jobs Created */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h4 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "16px" }}>B-BBEE Level</h4>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  backgroundColor: "#5d4037",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fdfcfb",
                  fontSize: "36px",
                  fontWeight: "bold",
                  margin: "0 auto 15px auto",
                }}
              >
                {workforceData.bbbeeLevel}
              </div>
              <div style={{ color: "#8d6e63", fontSize: "14px" }}>
                Current B-BBEE Level
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h4 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "16px" }}>Jobs Created (Net)</h4>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div
                style={{
                  fontSize: "48px",
                  fontWeight: "bold",
                  color: "#5d4037",
                  marginBottom: "10px",
                }}
              >
                {workforceData.jobsCreated}
              </div>
              <div style={{ color: "#8d6e63", fontSize: "14px" }}>
                Total Jobs Created (Permanent + Contract)
              </div>
            </div>
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
    }

    return (
      <div>
        <KeyQuestionBox
          question="Does ownership structure support inclusion and transformation objectives? This involves assessing HDI / Black ownership, youth, gender, and disability ownership."
          signals="HDI / Black ownership, Youth, gender, disability ownership"
          decisions="Eligibility for targeted funding or ESD, Transformation gap remediation"
          section="ownership-inclusion"
        />

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
          {!isInvestorView && (
            <button
              onClick={() => onOpenModal("ownership-inclusion")}
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
              Enter Data
            </button>
          )}
        </div>

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

          {/* Total Jobs Created Chart */}
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
      </div>
    )
  }

  const renderCommunityESD = () => {
    // Data from userData with fallbacks
    const csiData = {
      csiSpend: userData?.csiSpend || 500000,
      csiPercentage: userData?.csiPercentage || 2.5,
      hdiVendorSpend: userData?.hdiVendorSpend || 750000,
    }

    return (
      <div>
        <KeyQuestionBox
          question="Is the business contributing meaningfully to broader social and economic development? This involves evaluating CSI intent and ESD participation maturity."
          signals="CSI intent, ESD participation maturity"
          decisions="Qualify for CSI / ESG-linked funding?, Partnership readiness with corporates, readiness to have own CSI programme, readiness to have own ESD programme"
          section="community-esd"
        />

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
          
          {!isInvestorView && (
            <button
              onClick={() => onOpenModal("csi-spend")}
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
              Enter Data
            </button>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {/* CSI/CSR Spend Chart */}
          <ESGChartCard
            title="CSI/CSR Spend (R)"
            chartType="bar"
            data={{
              labels: getMonthsForYear(selectedYear, selectedViewMode),
              datasets: [
                {
                  label: "Spend",
                  data: Array(getMonthsForYear(selectedYear, selectedViewMode).length)
                    .fill(0)
                    .map(() => Math.random() * 100000 + 50000),
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
            kpiKey="csiSpend"
            unit="R"
            isInvestorView={isInvestorView}
          />

          {/* CSI Spend as % of Revenue */}
          <ESGChartCard
            title="CSI Spend as % of Revenue"
            chartType="line"
            data={{
              labels: getMonthsForYear(selectedYear, selectedViewMode),
              datasets: [
                {
                  label: "Percentage",
                  data: Array(getMonthsForYear(selectedYear, selectedViewMode).length)
                    .fill(0)
                    .map(() => Math.random() * 5),
                  borderColor: "#5d4037",
                  backgroundColor: "rgba(93, 64, 55, 0.1)",
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
            kpiKey="csiPercentage"
            unit="%"
            isInvestorView={isInvestorView}
          />

          {/* HDI Vendor Spend */}
          <ESGChartCard
            title="HDI Vendor Spend (R)"
            chartType="bar"
            data={{
              labels: getMonthsForYear(selectedYear, selectedViewMode),
              datasets: [
                {
                  label: "Spend",
                  data: Array(getMonthsForYear(selectedYear, selectedViewMode).length)
                    .fill(0)
                    .map(() => Math.random() * 500000 + 250000),
                  backgroundColor: "#8d6e63",
                  borderColor: "#8d6e63",
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
            kpiKey="hdiVendorSpend"
            unit="R"
            isInvestorView={isInvestorView}
          />
        </div>

        {/* CSI/CSR Projects Table */}
        <div style={{ marginTop: "30px" }}>
          <h4 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "16px" }}>CSI/CSR Projects</h4>
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
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #e8ddd4" }}>
                  <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>Youth Skills Development</td>
                  <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>Education</td>
                  <td style={{ padding: "12px", textAlign: "right", color: "#5d4037", fontSize: "14px" }}>250,000</td>
                  <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>Active</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #e8ddd4" }}>
                  <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>Community Health Initiative</td>
                  <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>Healthcare</td>
                  <td style={{ padding: "12px", textAlign: "right", color: "#5d4037", fontSize: "14px" }}>150,000</td>
                  <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>Planning</td>
                </tr>
                <tr>
                  <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>Environmental Cleanup</td>
                  <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>Environment</td>
                  <td style={{ padding: "12px", textAlign: "right", color: "#5d4037", fontSize: "14px" }}>75,000</td>
                  <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>Completed</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

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

// Governance Tab Components
const GovernanceTab = ({ activeSubTab, setActiveSubTab, userData, onOpenModal, isInvestorView }) => {
  const governanceSubTabs = [
    { id: "ownership-control", label: "Ownership & Control" },
    { id: "oversight-accountability", label: "Oversight & Accountability" },
    { id: "policies-sops", label: "Policies and SOPs" },
    { id: "risk-controls", label: "Risk, Controls & Reporting" },
  ]

  const renderOwnershipControl = () => {
    const ownershipData = {
      shareholderRegister: userData?.shareholderRegister || "no",
      votingRights: userData?.votingRights || "no",
    }

    return (
      <div>
        <KeyQuestionBox
          question="Are ownership and control structures clearly documented and transparent? This involves assessing control concentration and founder dominance risk."
          signals="Control concentration, Founder dominance risk"
          decisions="Governance uplift requirements before funding, minority protection sufficiency"
          section="ownership-control"
        />

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
          {!isInvestorView && (
            <button
              onClick={() => onOpenModal("governance-ownership")}
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
              Enter Data
            </button>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {/* Shareholder Register */}
          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <h4 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "16px" }}>Shareholder Register Maintained</h4>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: ownershipData.shareholderRegister === "yes" ? "#2e7d32" : "#c62828",
                marginBottom: "10px",
              }}
            >
              {ownershipData.shareholderRegister?.toUpperCase() || "NO"}
            </div>
            <div style={{ color: "#8d6e63", fontSize: "14px" }}>
              Formal shareholder register documentation
            </div>
          </div>

          {/* Voting Rights */}
          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <h4 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "16px" }}>Voting Rights Documented</h4>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: ownershipData.votingRights === "yes" ? "#2e7d32" : "#c62828",
                marginBottom: "10px",
              }}
            >
              {ownershipData.votingRights?.toUpperCase() || "NO"}
            </div>
            <div style={{ color: "#8d6e63", fontSize: "14px" }}>
              Clear voting rights and procedures documented
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderOversightAccountability = () => {
    const oversightData = {
      oversightStructure: userData?.oversightStructure || "none",
      independentOversight: userData?.independentOversight || "no",
      meetingCadence: userData?.meetingCadence || "ad-hoc",
      femaleDirectors: userData?.femaleDirectors || 2,
      maleDirectors: userData?.maleDirectors || 3,
    }

    return (
      <div>
        <KeyQuestionBox
          question="Is there effective oversight over management decisions? This involves assessing board or advisory presence and independence of oversight."
          signals="Board or advisory presence, Independence of oversight"
          decisions="Advisory board requirement, Board composition optimisation"
          section="oversight-accountability"
        />

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
          {!isInvestorView && (
            <button
              onClick={() => onOpenModal("governance-oversight")}
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
              Enter Data
            </button>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {/* Oversight Structure */}
          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <h4 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "16px" }}>Oversight Structure</h4>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#5d4037",
                marginBottom: "10px",
              }}
            >
              {oversightData.oversightStructure?.toUpperCase() || "NONE"}
            </div>
            <div style={{ color: "#8d6e63", fontSize: "14px" }}>
              Current governance oversight mechanism
            </div>
          </div>

          {/* Independent Oversight */}
          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <h4 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "16px" }}>Independent Oversight</h4>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: oversightData.independentOversight === "yes" ? "#2e7d32" : "#c62828",
                marginBottom: "10px",
              }}
            >
              {oversightData.independentOversight?.toUpperCase() || "NO"}
            </div>
            <div style={{ color: "#8d6e63", fontSize: "14px" }}>
              Presence of independent directors/advisors
            </div>
          </div>

          {/* Meeting Cadence */}
          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <h4 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "16px" }}>Meeting Cadence</h4>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#5d4037",
                marginBottom: "10px",
              }}
            >
              {oversightData.meetingCadence?.toUpperCase() || "AD HOC"}
            </div>
            <div style={{ color: "#8d6e63", fontSize: "14px" }}>
              Regularity of governance meetings
            </div>
          </div>
        </div>

        {/* Board Demographic Chart */}
        <div style={{ marginTop: "30px" }}>
          <ESGChartCard
            title="Board Demographics"
            chartType="bar"
            data={{
              labels: ["Female", "Male", "Independent", "Executive", "Non-Executive"],
              datasets: [
                {
                  label: "Count",
                  data: [oversightData.femaleDirectors, oversightData.maleDirectors, 1, 2, 3],
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
                    text: "Number of Directors",
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
            kpiKey="boardDemographics"
            unit="directors"
            isInvestorView={isInvestorView}
          />
        </div>
      </div>
    )
  }

  const renderPoliciesSOPs = () => {
    const policyData = {
      corePolicies: userData?.corePolicies || "no",
      conditionalPolicies: userData?.conditionalPolicies || "no",
      criticalSOPs: userData?.criticalSOPs || "no",
      policyOwner: userData?.policyOwner || "no",
      reviewCycle: userData?.reviewCycle || "no",
    }

    return (
      <div>
        <KeyQuestionBox
          question="Are essential policies and procedures documented, owned, and maintained to support transparent and accountable operations? This involves assessing existence, relevance, ownership, and review discipline."
          signals="Existence, Relevance, Ownership, Review discipline"
          decisions="Is the business institution-ready? Is governance uplift required before funding? Can disclosures be relied on?"
          section="policies-sops"
        />

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
          {!isInvestorView && (
            <button
              onClick={() => onOpenModal("governance-policies")}
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
              Enter Data
            </button>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {/* Core Governance Policies */}
          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <h4 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "16px" }}>Core Governance Policies in Place</h4>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: policyData.corePolicies === "yes" ? "#2e7d32" : 
                       policyData.corePolicies === "partial" ? "#f57c00" : "#c62828",
                marginBottom: "10px",
              }}
            >
              {policyData.corePolicies === "partial" ? "PARTIAL" : (policyData.corePolicies?.toUpperCase() || "NO")}
            </div>
            <div style={{ color: "#8d6e63", fontSize: "14px" }}>
              Essential governance policies implemented
            </div>
          </div>

          {/* Conditional Policies */}
          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <h4 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "16px" }}>Conditional Policies Identified & In Place</h4>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: policyData.conditionalPolicies === "yes" ? "#2e7d32" : "#c62828",
                marginBottom: "10px",
              }}
            >
              {policyData.conditionalPolicies?.toUpperCase() || "NO"}
            </div>
            <div style={{ color: "#8d6e63", fontSize: "14px" }}>
              Risk-based conditional policies established
            </div>
          </div>

          {/* Critical SOPs */}
          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <h4 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "16px" }}>Critical SOPs Documented</h4>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: policyData.criticalSOPs === "yes" ? "#2e7d32" : "#c62828",
                marginBottom: "10px",
              }}
            >
              {policyData.criticalSOPs?.toUpperCase() || "NO"}
            </div>
            <div style={{ color: "#8d6e63", fontSize: "14px" }}>
              Standard Operating Procedures documented
            </div>
          </div>

          {/* Policy/SOP Owner */}
          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <h4 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "16px" }}>Policy / SOP Owner Assigned</h4>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: policyData.policyOwner === "yes" ? "#2e7d32" : "#c62828",
                marginBottom: "10px",
              }}
            >
              {policyData.policyOwner?.toUpperCase() || "NO"}
            </div>
            <div style={{ color: "#8d6e63", fontSize: "14px" }}>
              Clear ownership and accountability assigned
            </div>
          </div>

          {/* Review Cycle */}
          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <h4 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "16px" }}>Review Cycle Defined</h4>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: policyData.reviewCycle === "yes" ? "#2e7d32" : "#c62828",
                marginBottom: "10px",
              }}
            >
              {policyData.reviewCycle?.toUpperCase() || "NO"}
            </div>
            <div style={{ color: "#8d6e63", fontSize: "14px" }}>
              Regular review and update process established
            </div>
          </div>
        </div>

        {/* Policy Checklist Table */}
        <div style={{ marginTop: "30px" }}>
          <h4 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "16px" }}>Policy Checklist</h4>
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
                  <th style={{ padding: "12px", textAlign: "left", color: "#5d4037", fontSize: "14px" }}>Policy</th>
                  <th style={{ padding: "12px", textAlign: "center", color: "#5d4037", fontSize: "14px" }}>Status</th>
                  <th style={{ padding: "12px", textAlign: "center", color: "#5d4037", fontSize: "14px" }}>Owner</th>
                  <th style={{ padding: "12px", textAlign: "center", color: "#5d4037", fontSize: "14px" }}>Last Review</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { policy: "Code of Conduct", status: "Implemented", owner: "CEO", review: "Jan 2024" },
                  { policy: "Anti-Bribery & Corruption", status: "Implemented", owner: "Legal", review: "Mar 2024" },
                  { policy: "Whistleblower Policy", status: policyData.criticalSOPs === "yes" ? "Implemented" : "In Progress", owner: "HR", review: policyData.criticalSOPs === "yes" ? "Mar 2024" : "Draft" },
                  { policy: "Conflict of Interest", status: "Implemented", owner: "Board", review: "Dec 2023" },
                  { policy: "Risk Management", status: policyData.conditionalPolicies === "yes" ? "Implemented" : "Planned", owner: "CFO", review: policyData.conditionalPolicies === "yes" ? "Q2 2024" : "Q3 2024" },
                ].map((item, index) => (
                  <tr key={index} style={{ borderBottom: "1px solid #e8ddd4" }}>
                    <td style={{ padding: "12px", color: "#5d4037", fontSize: "14px" }}>{item.policy}</td>
                    <td style={{ padding: "12px", textAlign: "center", color: "#5d4037", fontSize: "14px" }}>
                      <span
                        style={{
                          backgroundColor: item.status === "Implemented" ? "#2e7d32" : 
                                         item.status === "In Progress" ? "#f57c00" : "#c62828",
                          color: "#fff",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px", textAlign: "center", color: "#5d4037", fontSize: "14px" }}>{item.owner}</td>
                    <td style={{ padding: "12px", textAlign: "center", color: "#5d4037", fontSize: "14px" }}>{item.review}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const renderRiskControls = () => {
    const riskData = {
      riskRegister: userData?.riskRegister || "no",
      reportingResponsibility: userData?.reportingResponsibility || "no",
    }

    return (
      <div>
        <KeyQuestionBox
          question="Are risks, decisions, and reporting responsibilities clearly governed? This involves assessing risk discipline, policy enforcement, and reporting maturity."
          signals="Risk discipline, policy enforcement, Reporting maturity"
          decisions="Governance-readiness for institutional engagement, Reporting upgrades requirement"
          section="risk-controls"
        />

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
          {!isInvestorView && (
            <button
              onClick={() => onOpenModal("governance-risk")}
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
              Enter Data
            </button>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {/* Risk Register */}
          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <h4 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "16px" }}>Risk Register Maintained</h4>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: riskData.riskRegister === "yes" ? "#2e7d32" : "#c62828",
                marginBottom: "10px",
              }}
            >
              {riskData.riskRegister?.toUpperCase() || "NO"}
            </div>
            <div style={{ color: "#8d6e63", fontSize: "14px" }}>
              Formal risk identification and tracking
            </div>
          </div>

          {/* Reporting Responsibility */}
          <div
            style={{
              backgroundColor: "#fdfcfb",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <h4 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "16px" }}>Reporting Responsibility Assigned</h4>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: riskData.reportingResponsibility === "yes" ? "#2e7d32" : "#c62828",
                marginBottom: "10px",
              }}
            >
              {riskData.reportingResponsibility?.toUpperCase() || "NO"}
            </div>
            <div style={{ color: "#8d6e63", fontSize: "14px" }}>
              Clear reporting lines and accountability
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Governance Sub Tabs */}
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
        {governanceSubTabs.map((tab) => (
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
      {activeSubTab === "ownership-control" && renderOwnershipControl()}
      {activeSubTab === "oversight-accountability" && renderOversightAccountability()}
      {activeSubTab === "policies-sops" && renderPoliciesSOPs()}
      {activeSubTab === "risk-controls" && renderRiskControls()}
    </div>
  )
}

// Main ESG Component
const ESG = () => {
  const [activeMainTab, setActiveMainTab] = useState("environmental")
  const [activeSubTab, setActiveSubTab] = useState("exposure-compliance")
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

        <div style={{ padding: "20px" }}>
          <h1 style={{ color: "#5d4037", fontSize: "32px", fontWeight: "700", marginBottom: "20px" }}>
            ESG Impact
          </h1>

          {/* ESG Description */}
          <div
            style={{
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
                alignItems: "flex-start",
                marginBottom: "15px",
              }}
            >
              <div>
                <strong style={{ color: "#5d4037", fontSize: "16px", display: "block", marginBottom: "5px" }}>
                  What this dashboard DOES
                </strong>
                <span style={{ color: "#5d4037", fontSize: "15px" }}>
                  Confirms whether ESG factors are tracked and governed
                </span>
              </div>

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
                {showFullDescription ? "See Less" : "See More"}
              </button>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <strong style={{ color: "#5d4037", fontSize: "16px", display: "block", marginBottom: "5px" }}>
                What this dashboard, do
              </strong>
              <span style={{ color: "#5d4037", fontSize: "15px" }}>
                Measure internal execution (People dashboard does that), Provide sustainability reporting or SDG mapping, calculate carbon footprints or ESG narratives, optimise impact or performance, replace audits, certifications, or statutory disclosures
              </span>
            </div>

            {showFullDescription && (
              <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #e8ddd4" }}>
                <p style={{ color: "#5d4037", fontSize: "14px", lineHeight: "1.6", marginBottom: "12px" }}>
                  Dashboards show the data. ESG confirms it exists, is governed, and is credible.
                </p>
                <ul style={{ color: "#5d4037", fontSize: "14px", lineHeight: "1.8", paddingLeft: "20px" }}>
                  <li>
                    <strong>Signals readiness for disclosure to funders, corporates, DFIs</strong>
                  </li>
                  <li>
                    <strong>Assesses external trustworthiness, not internal performance</strong>
                  </li>
                  <li>
                    <strong>Feeds into BIG Score (Governance, Compliance, Capital Appeal)</strong>
                  </li>
                </ul>
                <p style={{ color: "#5d4037", fontSize: "14px", lineHeight: "1.6", marginTop: "12px" }}>
                  This dashboard provides a comprehensive view of your business's Environmental, Social, and Governance (ESG) impact across three key dimensions:
                </p>
                <ul style={{ color: "#5d4037", fontSize: "14px", lineHeight: "1.8", paddingLeft: "20px" }}>
                  <li>
                    <strong>Environmental:</strong> Track exposure, compliance, incidents, and controls to manage environmental risks
                  </li>
                  <li>
                    <strong>Social:</strong> Monitor workforce demographics, ownership inclusion, and community development contributions
                  </li>
                  <li>
                    <strong>Governance:</strong> Assess ownership structures, oversight mechanisms, policies, and risk management frameworks
                  </li>
                </ul>
              </div>
            )}
          </div>

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
                  if (tab.id === "environmental") setActiveSubTab("exposure-compliance")
                  if (tab.id === "social") setActiveSubTab("workforce-demographics")
                  if (tab.id === "governance") setActiveSubTab("ownership-control")
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
              activeSubTab={activeSubTab}
              setActiveSubTab={setActiveSubTab}
              userData={userData}
              onOpenModal={openModal}
              isInvestorView={isInvestorView}
            />
          )}

          {activeMainTab === "social" && (
            <SocialTab 
              activeSubTab={activeSubTab}
              setActiveSubTab={setActiveSubTab}
              userData={userData}
              onOpenModal={openModal}
              isInvestorView={isInvestorView}
            />
          )}

          {activeMainTab === "governance" && (
            <GovernanceTab 
              activeSubTab={activeSubTab}
              setActiveSubTab={setActiveSubTab}
              userData={userData}
              onOpenModal={openModal}
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