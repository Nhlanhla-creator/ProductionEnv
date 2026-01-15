"use client"

import { useState, useEffect } from "react"
import { Bar, Doughnut } from "react-chartjs-2"
import Sidebar from "smses/Sidebar/Sidebar"
import Header from "../DashboardHeader/DashboardHeader"
import { db, auth } from "../../firebaseConfig"
import { doc, getDoc } from "firebase/firestore"
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

// ESG Main Component
const ESG = () => {
  const [activeMainTab, setActiveMainTab] = useState("environment")
  const [activeSubTab, setActiveSubTab] = useState("environmental-exposure")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
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
    }
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
    flex: 1,
    paddingLeft: isSidebarCollapsed ? "80px" : "250px",
    transition: "padding 0.3s ease",
    boxSizing: "border-box",
    backgroundColor: "#f5f0e1",
  })

  const handleExitInvestorView = () => {
    sessionStorage.removeItem("viewingSMEId")
    sessionStorage.removeItem("viewingSMEName")
    sessionStorage.removeItem("investorViewMode")
    window.location.href = "/my-cohorts"
  }

  const mainTabs = [
    { id: "environment", label: "Environment" },
    { id: "social", label: "Social" },
    { id: "governance", label: "Governance" },
  ]

  const subTabs = {
    environment: [
      { id: "environmental-exposure", label: "Environmental Exposure & Compliance" },
      { id: "environmental-incidents", label: "Environmental Incidents & Controls" },
    ],
    social: [
      { id: "workforce-demographics", label: "Workforce Demographics" },
      { id: "ownership-inclusion", label: "Ownership & Inclusion" },
      { id: "community-esd", label: "Community & ESD Participation" },
    ],
    governance: [
      { id: "ownership-control", label: "Ownership & Control" },
      { id: "oversight-accountability", label: "Oversight & Accountability" },
      { id: "policies-sops", label: "Policies and Sops" },
      { id: "risk-controls", label: "Risk, Controls & Reporting Discipline" },
    ],
  }

  useEffect(() => {
    // Reset sub-tab when main tab changes
    if (subTabs[activeMainTab]) {
      setActiveSubTab(subTabs[activeMainTab][0].id)
    }
  }, [activeMainTab])

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      <div style={getContentStyles()}>
        <Header />

        {isInvestorView && (
          <div
            style={{
              backgroundColor: "#e6d7c3",
              padding: "16px 20px",
              margin: "90px 0 30px 0",
              borderRadius: "8px",
              border: "2px solid #a67c52",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "20px" }}>👁️</span>
              <span style={{ color: "#5d4037", fontWeight: "600", fontSize: "15px" }}>
                Investor View: Viewing {viewingSMEName}'s ESG (Read-Only)
              </span>
            </div>
            <button
              onClick={handleExitInvestorView}
              style={{
                padding: "8px 16px",
                backgroundColor: "#7d5a50",
                color: "#f5f0e1",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                transition: "background-color 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#5d4037"
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#7d5a50"
              }}
            >
              Back to My Cohorts
            </button>
          </div>
        )}

        <div style={{ padding: "20px" }}>
          {/* Title and Description */}
          <div style={{ margin: isInvestorView ? "20px 0 30px 0" : "50px 0 30px 0" }}>
            <h1 style={{ color: "#5d4037", fontSize: "42px", marginBottom: "10px", fontWeight: "700" }}>ESG Impact</h1>
            <p style={{ color: "#d32f2f", fontSize: "16px", fontWeight: "600", marginBottom: "20px" }}>
              Dashboards show the data. ESG confirms it exists, is governed, and is credible.
            </p>

            <div style={{ display: "flex", gap: "40px", marginTop: "25px" }}>
              <div>
                <h3 style={{ color: "#5d4037", fontSize: "16px", fontWeight: "700", marginBottom: "8px" }}>
                  What this dashboard DOES
                </h3>
                <ul style={{ color: "#5d4037", fontSize: "14px", lineHeight: "1.8", paddingLeft: "20px", margin: 0 }}>
                  <li>
                    Confirms whether ESG factors are <strong>tracked and governed</strong>
                  </li>
                  <li>
                    Signals <strong>readiness for disclosure</strong> to funders, corporates, DFIs
                  </li>
                  <li>
                    Assesses <strong>external trustworthiness</strong>, not internal performance
                  </li>
                  <li>Feeds into BIG Score (Governance, Compliance, Capital Appeal)</li>
                </ul>
              </div>
              <div>
                <h3 style={{ color: "#5d4037", fontSize: "16px", fontWeight: "700", marginBottom: "8px" }}>
                  What this dashboard, does not do
                </h3>
                <p style={{ color: "#5d4037", fontSize: "14px", lineHeight: "1.8", margin: 0 }}>
                  Measure internal execution (People dashboard does that), Provide sustainability reporting or SDG
                  mapping, calculate carbon footprint, replace audits, certifications or statutory disclosures
                </p>
              </div>
            </div>
          </div>

          {/* Main ESG Tabs */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              margin: "30px 0 20px 0",
              padding: "15px",
              backgroundColor: "#fdfcfb",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              overflowX: "auto",
              whiteSpace: "nowrap",
            }}
          >
            {mainTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveMainTab(tab.id)}
                style={{
                  padding: "12px 20px",
                  backgroundColor: activeMainTab === tab.id ? "#7d5a50" : "#f5f0e1",
                  color: activeMainTab === tab.id ? "#f5f0e1" : "#5d4037",
                  border: "2px solid #7d5a50",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "15px",
                  transition: "all 0.3s ease",
                  minWidth: "140px",
                  textAlign: "center",
                  flexShrink: 0,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sub Tabs */}
          {subTabs[activeMainTab] && (
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
              {subTabs[activeMainTab].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  style={{
                    padding: "10px 15px",
                    backgroundColor: activeSubTab === tab.id ? "#a67c52" : "#f5f0e1",
                    color: activeSubTab === tab.id ? "#f5f0e1" : "#5d4037",
                    border: "2px solid #a67c52",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px",
                    transition: "all 0.3s ease",
                    minWidth: "180px",
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Content Area */}
          <ESGContent
            activeMainTab={activeMainTab}
            activeSubTab={activeSubTab}
            currentUser={currentUser}
            isInvestorView={isInvestorView}
          />
        </div>
      </div>
    </div>
  )
}

// ESG Content Component
const ESGContent = ({ activeMainTab, activeSubTab, currentUser, isInvestorView }) => {
  const [fundingData, setFundingData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFundingData = async () => {
      try {
        if (!currentUser?.uid) {
          setLoading(false)
          return
        }

        const docRef = doc(db, "universalProfiles", currentUser.uid)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          setFundingData(data)
        }
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadFundingData()
  }, [currentUser])

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
          color: "#5d4037",
        }}
      >
        Loading ESG data...
      </div>
    )
  }

  // Environment sections
  if (activeMainTab === "environment") {
    if (activeSubTab === "environmental-exposure") {
      return <EnvironmentalExposure fundingData={fundingData} isInvestorView={isInvestorView} />
    }
    if (activeSubTab === "environmental-incidents") {
      return <EnvironmentalIncidents fundingData={fundingData} isInvestorView={isInvestorView} />
    }
  }

  // Social sections
  if (activeMainTab === "social") {
    if (activeSubTab === "workforce-demographics") {
      return <WorkforceDemographics fundingData={fundingData} isInvestorView={isInvestorView} />
    }
    if (activeSubTab === "ownership-inclusion") {
      return <OwnershipInclusion fundingData={fundingData} isInvestorView={isInvestorView} />
    }
    if (activeSubTab === "community-esd") {
      return <CommunityESD fundingData={fundingData} isInvestorView={isInvestorView} />
    }
  }

  // Governance sections
  if (activeMainTab === "governance") {
    if (activeSubTab === "ownership-control") {
      return <OwnershipControl fundingData={fundingData} isInvestorView={isInvestorView} />
    }
    if (activeSubTab === "oversight-accountability") {
      return <OversightAccountability fundingData={fundingData} isInvestorView={isInvestorView} />
    }
    if (activeSubTab === "policies-sops") {
      return <PoliciesSOPs fundingData={fundingData} isInvestorView={isInvestorView} currentUser={currentUser} />
    }
    if (activeSubTab === "risk-controls") {
      return <RiskControls fundingData={fundingData} isInvestorView={isInvestorView} />
    }
  }

  return null
}

// Section Note Box Component
const SectionNote = ({ keyQuestion, keySignals, keyDecisions }) => {
  return (
    <div
      style={{
        backgroundColor: "#fff8e1",
        padding: "20px",
        borderRadius: "8px",
        marginBottom: "25px",
        border: "2px solid #e6d7c3",
      }}
    >
      <div style={{ marginBottom: "15px" }}>
        <h4 style={{ color: "#7d5a50", margin: "0 0 8px 0", fontSize: "15px", fontWeight: "700" }}>Key Question:</h4>
        <p style={{ color: "#5d4037", margin: 0, fontSize: "14px", lineHeight: "1.6" }}>{keyQuestion}</p>
      </div>
      <div style={{ marginBottom: "15px" }}>
        <h4 style={{ color: "#7d5a50", margin: "0 0 8px 0", fontSize: "15px", fontWeight: "700" }}>Key Signals:</h4>
        <p style={{ color: "#5d4037", margin: 0, fontSize: "14px", lineHeight: "1.6" }}>{keySignals}</p>
      </div>
      <div>
        <h4 style={{ color: "#7d5a50", margin: "0 0 8px 0", fontSize: "15px", fontWeight: "700" }}>Key Decisions:</h4>
        <p style={{ color: "#5d4037", margin: 0, fontSize: "14px", lineHeight: "1.6" }}>{keyDecisions}</p>
      </div>
    </div>
  )
}

// Environment - Environmental Exposure & Compliance
const EnvironmentalExposure = ({ fundingData, isInvestorView }) => {
  const [exposureType, setExposureType] = useState("none")
  const [complianceRequired, setComplianceRequired] = useState("no")
  const [permitsInPlace, setPermitsInPlace] = useState("no")

  return (
    <div
      style={{
        backgroundColor: "#faf7f2",
        padding: "30px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        border: "2px solid #d4c4b0",
      }}
    >


      <SectionNote
        keyQuestion="Are environmental risks identified, tracked and managed where relevant?"
        keySignals="Sector exposure (direct vs indirect), Regulatory requirements, Licence-to-operate risk"
        keyDecisions="disclosures, readiness for compliance scrutiny, specialist oversight requirements, insurance or permitting risk"
      />

   

      {!isInvestorView && (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "25px",
            borderRadius: "8px",
            border: "2px solid #e6d7c3",
          }}
        >
          <h3 style={{ color: "#7d5a50", marginBottom: "20px" }}>Update Environmental Exposure</h3>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "600" }}>
              Environmental Exposure Type:
            </label>
            <select
              value={exposureType}
              onChange={(e) => setExposureType(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e6d7c3",
                borderRadius: "6px",
                fontSize: "14px",
                backgroundColor: "#faf7f2",
              }}
            >
              <option value="none">None</option>
              <option value="indirect">Indirect</option>
              <option value="direct">Direct</option>
            </select>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "600" }}>
              Environmental Compliance Required:
            </label>
            <select
              value={complianceRequired}
              onChange={(e) => setComplianceRequired(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e6d7c3",
                borderRadius: "6px",
                fontSize: "14px",
                backgroundColor: "#faf7f2",
              }}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "600" }}>
              Environmental Permits in Place:
            </label>
            <select
              value={permitsInPlace}
              onChange={(e) => setPermitsInPlace(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e6d7c3",
                borderRadius: "6px",
                fontSize: "14px",
                backgroundColor: "#faf7f2",
              }}
            >
              <option value="no">No</option>
              <option value="partial">Partial</option>
              <option value="yes">Yes</option>
            </select>
          </div>

          <button
            style={{
              padding: "12px 24px",
              backgroundColor: "#7d5a50",
              color: "#f5f0e1",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "15px",
            }}
          >
            Save Changes
          </button>
        </div>
      )}

      {/* Display Current Values */}
      <div
        style={{
          marginTop: "25px",
          backgroundColor: "#fff",
          padding: "25px",
          borderRadius: "8px",
          border: "2px solid #e6d7c3",
        }}
      >
        <h3 style={{ color: "#7d5a50", marginBottom: "15px" }}>Current Status</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
          <div>
            <div style={{ color: "#7d5a50", fontSize: "12px", fontWeight: "600", marginBottom: "5px" }}>
              Exposure Type
            </div>
            <div
              style={{
                padding: "10px",
                backgroundColor: "#f5f0e1",
                borderRadius: "6px",
                color: "#5d4037",
                fontWeight: "600",
                textTransform: "capitalize",
              }}
            >
              {exposureType}
            </div>
          </div>
          <div>
            <div style={{ color: "#7d5a50", fontSize: "12px", fontWeight: "600", marginBottom: "5px" }}>
              Compliance Required
            </div>
            <div
              style={{
                padding: "10px",
                backgroundColor: "#f5f0e1",
                borderRadius: "6px",
                color: "#5d4037",
                fontWeight: "600",
                textTransform: "capitalize",
              }}
            >
              {complianceRequired}
            </div>
          </div>
          <div>
            <div style={{ color: "#7d5a50", fontSize: "12px", fontWeight: "600", marginBottom: "5px" }}>
              Permits in Place
            </div>
            <div
              style={{
                padding: "10px",
                backgroundColor: "#f5f0e1",
                borderRadius: "6px",
                color: "#5d4037",
                fontWeight: "600",
                textTransform: "capitalize",
              }}
            >
              {permitsInPlace}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Environment - Environmental Incidents & Controls
const EnvironmentalIncidents = ({ fundingData, isInvestorView }) => {
  const [incidentLevel, setIncidentLevel] = useState("none")
  const [controlsInPlace, setControlsInPlace] = useState("none")

  return (
    <div
      style={{
        backgroundColor: "#faf7f2",
        padding: "30px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        border: "2px solid #d4c4b0",
      }}
    >


      <SectionNote
        keyQuestion="Are environmental incidents monitored and managed transparently? and are controls in place to prevent recurrence?"
        keySignals="Incident history logs, Controls Documented"
        keyDecisions="Escalate risk to funders or insurers, Remediation before engagement"
      />

  

      {!isInvestorView && (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "25px",
            borderRadius: "8px",
            border: "2px solid #e6d7c3",
          }}
        >
          <h3 style={{ color: "#7d5a50", marginBottom: "20px" }}>Update Environmental Incidents</h3>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "600" }}>
              Environmental Incident Level:
            </label>
            <select
              value={incidentLevel}
              onChange={(e) => setIncidentLevel(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e6d7c3",
                borderRadius: "6px",
                fontSize: "14px",
                backgroundColor: "#faf7f2",
              }}
            >
              <option value="none">None</option>
              <option value="minor">Minor</option>
              <option value="major">Major</option>
            </select>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "600" }}>
              Environmental Controls:
            </label>
            <select
              value={controlsInPlace}
              onChange={(e) => setControlsInPlace(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e6d7c3",
                borderRadius: "6px",
                fontSize: "14px",
                backgroundColor: "#faf7f2",
              }}
            >
              <option value="none">None</option>
              <option value="basic">Basic</option>
              <option value="formal">Formal</option>
            </select>
          </div>

          <button
            style={{
              padding: "12px 24px",
              backgroundColor: "#7d5a50",
              color: "#f5f0e1",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "15px",
            }}
          >
            Save Changes
          </button>
        </div>
      )}

      {/* Display Current Values */}
      <div
        style={{
          marginTop: "25px",
          backgroundColor: "#fff",
          padding: "25px",
          borderRadius: "8px",
          border: "2px solid #e6d7c3",
        }}
      >
        <h3 style={{ color: "#7d5a50", marginBottom: "15px" }}>Current Status</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <div style={{ color: "#7d5a50", fontSize: "12px", fontWeight: "600", marginBottom: "5px" }}>
              Incident Level
            </div>
            <div
              style={{
                padding: "10px",
                backgroundColor: "#f5f0e1",
                borderRadius: "6px",
                color: "#5d4037",
                fontWeight: "600",
                textTransform: "capitalize",
              }}
            >
              {incidentLevel}
            </div>
          </div>
          <div>
            <div style={{ color: "#7d5a50", fontSize: "12px", fontWeight: "600", marginBottom: "5px" }}>
              Controls in Place
            </div>
            <div
              style={{
                padding: "10px",
                backgroundColor: "#f5f0e1",
                borderRadius: "6px",
                color: "#5d4037",
                fontWeight: "600",
                textTransform: "capitalize",
              }}
            >
              {controlsInPlace}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Social - Workforce Demographics
const WorkforceDemographics = ({ fundingData, isInvestorView }) => {
  const blackOwnership = Number.parseFloat(fundingData?.socialImpact?.blackOwnership || 0)
  const womenOwnership = Number.parseFloat(fundingData?.socialImpact?.womenOwnership || 0)
  const youthOwnership = Number.parseFloat(fundingData?.socialImpact?.youthOwnership || 0)

  const chartData = {
    labels: ["Locality", "Gender", "EAP", "Female Leadership", "Youth Leadership"],
    datasets: [
      {
        label: "Workforce Metrics (%)",
        data: [65, 45, 30, 25, 20],
        backgroundColor: ["#7d5a50", "#a67c52", "#c8b6a6", "#e6d7c3", "#d4c4b0"],
      },
    ],
  }

  return (
    <div
      style={{
        backgroundColor: "#faf7f2",
        padding: "30px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        border: "2px solid #d4c4b0",
      }}
    >


      <SectionNote
        keyQuestion="Does the workforce profile align with transformation and inclusion expectations of external stakeholders?"
        keySignals="B-BBEE positioning, Employment impact"
        keyDecisions="Eligibility for ESD, CSI, procurement, Alignment with funder mandates"
      />

   

      {/* Chart */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "25px",
          borderRadius: "8px",
          border: "2px solid #e6d7c3",
          marginBottom: "25px",
        }}
      >
        <h3 style={{ color: "#7d5a50", marginBottom: "20px" }}>Workforce Profile</h3>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <Bar
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
              },
              scales: {
                y: { beginAtZero: true, max: 100 },
              },
            }}
          />
        </div>
      </div>

      {/* Current Data Display */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "25px",
          borderRadius: "8px",
          border: "2px solid #e6d7c3",
        }}
      >
        <h3 style={{ color: "#7d5a50", marginBottom: "15px" }}>Current Demographics</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
          <div>
            <div style={{ color: "#7d5a50", fontSize: "12px", fontWeight: "600", marginBottom: "5px" }}>
              Black Ownership
            </div>
            <div
              style={{
                padding: "10px",
                backgroundColor: "#f5f0e1",
                borderRadius: "6px",
                color: "#5d4037",
                fontWeight: "600",
                fontSize: "20px",
              }}
            >
              {blackOwnership}%
            </div>
          </div>
          <div>
            <div style={{ color: "#7d5a50", fontSize: "12px", fontWeight: "600", marginBottom: "5px" }}>
              Women Ownership
            </div>
            <div
              style={{
                padding: "10px",
                backgroundColor: "#f5f0e1",
                borderRadius: "6px",
                color: "#5d4037",
                fontWeight: "600",
                fontSize: "20px",
              }}
            >
              {womenOwnership}%
            </div>
          </div>
          <div>
            <div style={{ color: "#7d5a50", fontSize: "12px", fontWeight: "600", marginBottom: "5px" }}>
              Youth Ownership
            </div>
            <div
              style={{
                padding: "10px",
                backgroundColor: "#f5f0e1",
                borderRadius: "6px",
                color: "#5d4037",
                fontWeight: "600",
                fontSize: "20px",
              }}
            >
              {youthOwnership}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Social - Ownership & Inclusion
const OwnershipInclusion = ({ fundingData, isInvestorView }) => {
  const blackOwnership = Number.parseFloat(fundingData?.socialImpact?.blackOwnership || 0)
  const womenOwnership = Number.parseFloat(fundingData?.socialImpact?.womenOwnership || 0)
  const youthOwnership = Number.parseFloat(fundingData?.socialImpact?.youthOwnership || 0)
  const disabledOwnership = Number.parseFloat(fundingData?.socialImpact?.disabledOwnership || 0)

  const chartData = {
    labels: ["Black Ownership", "Women Ownership", "Youth Ownership", "Disabled Ownership"],
    datasets: [
      {
        data: [blackOwnership, womenOwnership, youthOwnership, disabledOwnership],
        backgroundColor: ["#7d5a50", "#a67c52", "#c8b6a6", "#e6d7c3"],
      },
    ],
  }

  return (
    <div
      style={{
        backgroundColor: "#faf7f2",
        padding: "30px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        border: "2px solid #d4c4b0",
      }}
    >
    

      <SectionNote
        keyQuestion="Does ownership structure support inclusion and transformation objectives?"
        keySignals="HDI / Black ownership, Youth, gender, disability ownership"
        keyDecisions="Eligibility for targeted funding or ESD, Transformation gap remediation"
      />

 

      {/* Chart */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "25px",
          borderRadius: "8px",
          border: "2px solid #e6d7c3",
          marginBottom: "25px",
        }}
      >
        <h3 style={{ color: "#7d5a50", marginBottom: "20px" }}>Ownership Distribution</h3>
        <div style={{ maxWidth: "400px", margin: "0 auto" }}>
          <Doughnut
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: "bottom" },
              },
            }}
          />
        </div>
      </div>

      {/* Summary */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "25px",
          borderRadius: "8px",
          border: "2px solid #e6d7c3",
        }}
      >
        <h3 style={{ color: "#7d5a50", marginBottom: "15px" }}>Ownership Summary</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px",
              backgroundColor: "#f5f0e1",
              borderRadius: "6px",
            }}
          >
            <span style={{ color: "#5d4037", fontWeight: "600" }}>Black Ownership:</span>
            <span style={{ color: "#7d5a50", fontWeight: "700" }}>{blackOwnership}%</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px",
              backgroundColor: "#f5f0e1",
              borderRadius: "6px",
            }}
          >
            <span style={{ color: "#5d4037", fontWeight: "600" }}>Women Ownership:</span>
            <span style={{ color: "#7d5a50", fontWeight: "700" }}>{womenOwnership}%</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px",
              backgroundColor: "#f5f0e1",
              borderRadius: "6px",
            }}
          >
            <span style={{ color: "#5d4037", fontWeight: "600" }}>Youth Ownership:</span>
            <span style={{ color: "#7d5a50", fontWeight: "700" }}>{youthOwnership}%</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px",
              backgroundColor: "#f5f0e1",
              borderRadius: "6px",
            }}
          >
            <span style={{ color: "#5d4037", fontWeight: "600" }}>Disabled Ownership:</span>
            <span style={{ color: "#7d5a50", fontWeight: "700" }}>{disabledOwnership}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Social - Community & ESD Participation
const CommunityESD = ({ fundingData, isInvestorView }) => {
  const [csiSpend, setCsiSpend] = useState("0")
  const [csiPercentage, setCsiPercentage] = useState("0")

  return (
    <div
      style={{
        backgroundColor: "#faf7f2",
        padding: "30px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        border: "2px solid #d4c4b0",
      }}
    >
     

      <SectionNote
        keyQuestion="Is the business contributing meaningfully to broader social and economic development?"
        keySignals="CSI intent, ESD participation maturity"
        keyDecisions="Qualify for CSI / ESG-linked funding?, Partnership readiness with corporates, readiness to have own CSI programme, readiness to have own ESD programme"
      />

    

      {!isInvestorView && (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "25px",
            borderRadius: "8px",
            border: "2px solid #e6d7c3",
            marginBottom: "25px",
          }}
        >
          <h3 style={{ color: "#7d5a50", marginBottom: "20px" }}>Update CSI/CSR Data</h3>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "600" }}>
              CSI/CSR Spend (ZAR):
            </label>
            <input
              type="number"
              value={csiSpend}
              onChange={(e) => setCsiSpend(e.target.value)}
              placeholder="Enter amount"
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e6d7c3",
                borderRadius: "6px",
                fontSize: "14px",
                backgroundColor: "#faf7f2",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "600" }}>
              CSI Spend as % of Revenue:
            </label>
            <input
              type="number"
              value={csiPercentage}
              onChange={(e) => setCsiPercentage(e.target.value)}
              placeholder="Enter percentage"
              step="0.1"
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e6d7c3",
                borderRadius: "6px",
                fontSize: "14px",
                backgroundColor: "#faf7f2",
              }}
            />
          </div>

          <button
            style={{
              padding: "12px 24px",
              backgroundColor: "#7d5a50",
              color: "#f5f0e1",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "15px",
            }}
          >
            Save Changes
          </button>
        </div>
      )}

      {/* Display Current Values */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "25px",
          borderRadius: "8px",
          border: "2px solid #e6d7c3",
        }}
      >
        <h3 style={{ color: "#7d5a50", marginBottom: "15px" }}>Current CSI/CSR Data</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <div style={{ color: "#7d5a50", fontSize: "12px", fontWeight: "600", marginBottom: "5px" }}>
              CSI/CSR Spend
            </div>
            <div
              style={{
                padding: "15px",
                backgroundColor: "#f5f0e1",
                borderRadius: "6px",
                color: "#5d4037",
                fontWeight: "600",
                fontSize: "24px",
              }}
            >
              R {Number(csiSpend).toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ color: "#7d5a50", fontSize: "12px", fontWeight: "600", marginBottom: "5px" }}>
              % of Revenue
            </div>
            <div
              style={{
                padding: "15px",
                backgroundColor: "#f5f0e1",
                borderRadius: "6px",
                color: "#5d4037",
                fontWeight: "600",
                fontSize: "24px",
              }}
            >
              {csiPercentage}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Governance - Ownership & Control
const OwnershipControl = ({ fundingData, isInvestorView }) => {
  const [shareholderRegister, setShareholderRegister] = useState("no")
  const [votingRights, setVotingRights] = useState("no")

  return (
    <div
      style={{
        backgroundColor: "#faf7f2",
        padding: "30px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        border: "2px solid #d4c4b0",
      }}
    >


      <SectionNote
        keyQuestion="Are ownership and control structures clearly documented and transparent?"
        keySignals="Control concentration, Founder dominance risk"
        keyDecisions="Governance uplift requirements before funding, minority protection sufficiency"
      />

  

      {!isInvestorView && (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "25px",
            borderRadius: "8px",
            border: "2px solid #e6d7c3",
            marginBottom: "25px",
          }}
        >
          <h3 style={{ color: "#7d5a50", marginBottom: "20px" }}>Update Ownership Data</h3>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "600" }}>
              Shareholder Register Maintained:
            </label>
            <select
              value={shareholderRegister}
              onChange={(e) => setShareholderRegister(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e6d7c3",
                borderRadius: "6px",
                fontSize: "14px",
                backgroundColor: "#faf7f2",
              }}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "600" }}>
              Voting Rights Documented:
            </label>
            <select
              value={votingRights}
              onChange={(e) => setVotingRights(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e6d7c3",
                borderRadius: "6px",
                fontSize: "14px",
                backgroundColor: "#faf7f2",
              }}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>

          <button
            style={{
              padding: "12px 24px",
              backgroundColor: "#7d5a50",
              color: "#f5f0e1",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "15px",
            }}
          >
            Save Changes
          </button>
        </div>
      )}

      {/* Display Current Values */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "25px",
          borderRadius: "8px",
          border: "2px solid #e6d7c3",
        }}
      >
        <h3 style={{ color: "#7d5a50", marginBottom: "15px" }}>Current Status</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <div style={{ color: "#7d5a50", fontSize: "12px", fontWeight: "600", marginBottom: "5px" }}>
              Shareholder Register
            </div>
            <div
              style={{
                padding: "10px",
                backgroundColor: shareholderRegister === "yes" ? "#d4edda" : "#f8d7da",
                borderRadius: "6px",
                color: shareholderRegister === "yes" ? "#155724" : "#721c24",
                fontWeight: "600",
                textTransform: "capitalize",
              }}
            >
              {shareholderRegister}
            </div>
          </div>
          <div>
            <div style={{ color: "#7d5a50", fontSize: "12px", fontWeight: "600", marginBottom: "5px" }}>
              Voting Rights Documented
            </div>
            <div
              style={{
                padding: "10px",
                backgroundColor: votingRights === "yes" ? "#d4edda" : "#f8d7da",
                borderRadius: "6px",
                color: votingRights === "yes" ? "#155724" : "#721c24",
                fontWeight: "600",
                textTransform: "capitalize",
              }}
            >
              {votingRights}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Governance - Oversight & Accountability
const OversightAccountability = ({ fundingData, isInvestorView }) => {
  const [oversightStructure, setOversightStructure] = useState("none")
  const [independentOversight, setIndependentOversight] = useState("no")
  const [boardDemographics, setBoardDemographics] = useState("no")
  const [meetingCadence, setMeetingCadence] = useState("adhoc")

  return (
    <div
      style={{
        backgroundColor: "#faf7f2",
        padding: "30px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        border: "2px solid #d4c4b0",
      }}
    >


      <SectionNote
        keyQuestion="Is there effective oversight over management decisions?"
        keySignals="Board or advisory presence, Independence of oversight"
        keyDecisions="Advisory board requirement, Board composition optimisation"
      />

  

      {!isInvestorView && (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "25px",
            borderRadius: "8px",
            border: "2px solid #e6d7c3",
            marginBottom: "25px",
          }}
        >
          <h3 style={{ color: "#7d5a50", marginBottom: "20px" }}>Update Oversight Data</h3>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "600" }}>
              Oversight Structure:
            </label>
            <select
              value={oversightStructure}
              onChange={(e) => setOversightStructure(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e6d7c3",
                borderRadius: "6px",
                fontSize: "14px",
                backgroundColor: "#faf7f2",
              }}
            >
              <option value="none">None</option>
              <option value="advisory">Advisory</option>
              <option value="board">Board</option>
            </select>
          </div>

          {oversightStructure !== "none" && (
            <>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "600" }}>
                  Independent Oversight:
                </label>
                <select
                  value={independentOversight}
                  onChange={(e) => setIndependentOversight(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #e6d7c3",
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: "#faf7f2",
                  }}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "600" }}>
                  Board Demographics Available:
                </label>
                <select
                  value={boardDemographics}
                  onChange={(e) => setBoardDemographics(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #e6d7c3",
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: "#faf7f2",
                  }}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "600" }}>
                  Meeting Cadence:
                </label>
                <select
                  value={meetingCadence}
                  onChange={(e) => setMeetingCadence(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #e6d7c3",
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: "#faf7f2",
                  }}
                >
                  <option value="adhoc">Ad hoc</option>
                  <option value="regular">Regular</option>
                </select>
              </div>
            </>
          )}

          <button
            style={{
              padding: "12px 24px",
              backgroundColor: "#7d5a50",
              color: "#f5f0e1",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "15px",
            }}
          >
            Save Changes
          </button>
        </div>
      )}

      {/* Display Current Values */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "25px",
          borderRadius: "8px",
          border: "2px solid #e6d7c3",
        }}
      >
        <h3 style={{ color: "#7d5a50", marginBottom: "15px" }}>Current Oversight Status</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: oversightStructure === "none" ? "1fr" : "1fr 1fr",
            gap: "20px",
          }}
        >
          <div>
            <div style={{ color: "#7d5a50", fontSize: "12px", fontWeight: "600", marginBottom: "5px" }}>
              Oversight Structure
            </div>
            <div
              style={{
                padding: "10px",
                backgroundColor: "#f5f0e1",
                borderRadius: "6px",
                color: "#5d4037",
                fontWeight: "600",
                textTransform: "capitalize",
              }}
            >
              {oversightStructure}
            </div>
          </div>
          {oversightStructure !== "none" && (
            <>
              <div>
                <div style={{ color: "#7d5a50", fontSize: "12px", fontWeight: "600", marginBottom: "5px" }}>
                  Independent Oversight
                </div>
                <div
                  style={{
                    padding: "10px",
                    backgroundColor: "#f5f0e1",
                    borderRadius: "6px",
                    color: "#5d4037",
                    fontWeight: "600",
                    textTransform: "capitalize",
                  }}
                >
                  {independentOversight}
                </div>
              </div>
              <div>
                <div style={{ color: "#7d5a50", fontSize: "12px", fontWeight: "600", marginBottom: "5px" }}>
                  Board Demographics
                </div>
                <div
                  style={{
                    padding: "10px",
                    backgroundColor: "#f5f0e1",
                    borderRadius: "6px",
                    color: "#5d4037",
                    fontWeight: "600",
                    textTransform: "capitalize",
                  }}
                >
                  {boardDemographics}
                </div>
              </div>
              <div>
                <div style={{ color: "#7d5a50", fontSize: "12px", fontWeight: "600", marginBottom: "5px" }}>
                  Meeting Cadence
                </div>
                <div
                  style={{
                    padding: "10px",
                    backgroundColor: "#f5f0e1",
                    borderRadius: "6px",
                    color: "#5d4037",
                    fontWeight: "600",
                    textTransform: "capitalize",
                  }}
                >
                  {meetingCadence}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Governance - Policies and SOPs
const PoliciesSOPs = ({ fundingData, isInvestorView, currentUser }) => {
  const [policies, setPolicies] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [newPolicy, setNewPolicy] = useState({
    name: "",
    type: "core",
    status: "draft",
    owner: "",
    reviewCycle: "annual",
  })

  return (
    <div
      style={{
        backgroundColor: "#faf7f2",
        padding: "30px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        border: "2px solid #d4c4b0",
      }}
    >


      <SectionNote
        keyQuestion="Are essential policies and procedures documented, owned, and maintained to support transparent and accountable operations?"
        keySignals="Existence, Relevance, Ownership, Review discipline"
        keyDecisions="Is the business institution-ready? Is governance uplift required before funding? Can disclosures be relied on?"
      />

  

      {!isInvestorView && (
        <div style={{ marginBottom: "25px" }}>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: "12px 24px",
              backgroundColor: "#7d5a50",
              color: "#f5f0e1",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "15px",
            }}
          >
            Add Policy / SOP
          </button>
        </div>
      )}

      {/* Policies Table */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "25px",
          borderRadius: "8px",
          border: "2px solid #e6d7c3",
        }}
      >
        <h3 style={{ color: "#7d5a50", marginBottom: "15px" }}>Policy Checklist</h3>
        {policies.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f0e1" }}>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#5d4037" }}>Name</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#5d4037" }}>Type</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#5d4037" }}>Status</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#5d4037" }}>Owner</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#5d4037" }}>
                  Review Cycle
                </th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #e6d7c3" }}>
                  <td style={{ padding: "12px", color: "#5d4037" }}>{policy.name}</td>
                  <td style={{ padding: "12px", color: "#5d4037", textTransform: "capitalize" }}>{policy.type}</td>
                  <td style={{ padding: "12px", color: "#5d4037", textTransform: "capitalize" }}>{policy.status}</td>
                  <td style={{ padding: "12px", color: "#5d4037" }}>{policy.owner}</td>
                  <td style={{ padding: "12px", color: "#5d4037", textTransform: "capitalize" }}>
                    {policy.reviewCycle}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: "#7d5a50", textAlign: "center", padding: "40px" }}>
            No policies added yet. {!isInvestorView && 'Click "Add Policy / SOP" to get started.'}
          </p>
        )}
      </div>

      {/* Modal */}
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
              backgroundColor: "#fdfcfb",
              padding: "30px",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              width: "500px",
              maxWidth: "90vw",
              border: "2px solid #a67c52",
            }}
          >
            <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "20px" }}>Add Policy / SOP</h3>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "500" }}>
                Policy / SOP Name:
              </label>
              <input
                type="text"
                value={newPolicy.name}
                onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                placeholder="Enter name"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e6d7c3",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  backgroundColor: "#faf7f2",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "500" }}>
                  Type:
                </label>
                <select
                  value={newPolicy.type}
                  onChange={(e) => setNewPolicy({ ...newPolicy, type: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e6d7c3",
                    borderRadius: "4px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    backgroundColor: "#faf7f2",
                  }}
                >
                  <option value="core">Core</option>
                  <option value="conditional">Conditional</option>
                  <option value="sop">SOP</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "500" }}>
                  Status:
                </label>
                <select
                  value={newPolicy.status}
                  onChange={(e) => setNewPolicy({ ...newPolicy, status: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e6d7c3",
                    borderRadius: "4px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    backgroundColor: "#faf7f2",
                  }}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="under-review">Under Review</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "500" }}>
                  Owner:
                </label>
                <input
                  type="text"
                  value={newPolicy.owner}
                  onChange={(e) => setNewPolicy({ ...newPolicy, owner: e.target.value })}
                  placeholder="Policy owner"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e6d7c3",
                    borderRadius: "4px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    backgroundColor: "#faf7f2",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "500" }}>
                  Review Cycle:
                </label>
                <select
                  value={newPolicy.reviewCycle}
                  onChange={(e) => setNewPolicy({ ...newPolicy, reviewCycle: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e6d7c3",
                    borderRadius: "4px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    backgroundColor: "#faf7f2",
                  }}
                >
                  <option value="annual">Annual</option>
                  <option value="biannual">Biannual</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e6d7c3",
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
                onClick={() => {
                  setPolicies([...policies, newPolicy])
                  setShowModal(false)
                  setNewPolicy({ name: "", type: "core", status: "draft", owner: "", reviewCycle: "annual" })
                }}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#7d5a50",
                  color: "#f5f0e1",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Add Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Governance - Risk, Controls & Reporting Discipline
const RiskControls = ({ fundingData, isInvestorView }) => {
  const [riskRegister, setRiskRegister] = useState("no")
  const [reportingResponsibility, setReportingResponsibility] = useState("no")

  return (
    <div
      style={{
        backgroundColor: "#faf7f2",
        padding: "30px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        border: "2px solid #d4c4b0",
      }}
    >
     

      <SectionNote
        keyQuestion="Are risks, decisions, and reporting responsibilities clearly governed?"
        keySignals="Risk discipline, policy enforcement, Reporting maturity"
        keyDecisions="governance-readiness for institutional engagement, Reporting upgrades requirement"
      />

   

      {!isInvestorView && (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "25px",
            borderRadius: "8px",
            border: "2px solid #e6d7c3",
            marginBottom: "25px",
          }}
        >
          <h3 style={{ color: "#7d5a50", marginBottom: "20px" }}>Update Risk & Controls Data</h3>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "600" }}>
              Risk Register Maintained:
            </label>
            <select
              value={riskRegister}
              onChange={(e) => setRiskRegister(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e6d7c3",
                borderRadius: "6px",
                fontSize: "14px",
                backgroundColor: "#faf7f2",
              }}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "600" }}>
              Reporting Responsibility Assigned:
            </label>
            <select
              value={reportingResponsibility}
              onChange={(e) => setReportingResponsibility(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e6d7c3",
                borderRadius: "6px",
                fontSize: "14px",
                backgroundColor: "#faf7f2",
              }}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>

          <button
            style={{
              padding: "12px 24px",
              backgroundColor: "#7d5a50",
              color: "#f5f0e1",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "15px",
            }}
          >
            Save Changes
          </button>
        </div>
      )}

      {/* Display Current Values */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "25px",
          borderRadius: "8px",
          border: "2px solid #e6d7c3",
        }}
      >
        <h3 style={{ color: "#7d5a50", marginBottom: "15px" }}>Current Status</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <div style={{ color: "#7d5a50", fontSize: "12px", fontWeight: "600", marginBottom: "5px" }}>
              Risk Register Maintained
            </div>
            <div
              style={{
                padding: "10px",
                backgroundColor: riskRegister === "yes" ? "#d4edda" : "#f8d7da",
                borderRadius: "6px",
                color: riskRegister === "yes" ? "#155724" : "#721c24",
                fontWeight: "600",
                textTransform: "capitalize",
              }}
            >
              {riskRegister}
            </div>
          </div>
          <div>
            <div style={{ color: "#7d5a50", fontSize: "12px", fontWeight: "600", marginBottom: "5px" }}>
              Reporting Responsibility Assigned
            </div>
            <div
              style={{
                padding: "10px",
                backgroundColor: reportingResponsibility === "yes" ? "#d4edda" : "#f8d7da",
                borderRadius: "6px",
                color: reportingResponsibility === "yes" ? "#155724" : "#721c24",
                fontWeight: "600",
                textTransform: "capitalize",
              }}
            >
              {reportingResponsibility}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ESG
