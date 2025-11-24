"use client"

import { useState, useEffect } from "react"
import { Bar, Scatter, Doughnut } from "react-chartjs-2"
import { Download } from "lucide-react"
import Sidebar from "smses/Sidebar/Sidebar"
import Header from "../DashboardHeader/DashboardHeader"
import { db, auth } from "../../firebaseConfig"
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, onSnapshot, getDoc } from "firebase/firestore"
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
import ChartDataLabels from "chartjs-plugin-datalabels"

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
  const [activeMainTab, setActiveMainTab] = useState("environmental")
  const [activeSocialSubTab, setActiveSocialSubTab] = useState("bbbee-level")
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
    backgroundColor: "#f5f0e1", // Light beige background
  })

  const handleExitInvestorView = () => {
    sessionStorage.removeItem("viewingSMEId")
    sessionStorage.removeItem("viewingSMEName")
    sessionStorage.removeItem("investorViewMode")
    window.location.href = "/my-cohorts"
  }

  const mainTabs = [
    { id: "environmental", label: "Environmental" },
    { id: "social", label: "Social" },
    { id: "governance", label: "Governance" },
  ]

  const socialSubTabs = [
    { id: "bbbee-level", label: "B-BBEE Level" },
    { id: "jobs-created", label: "Jobs Created" },
    { id: "hdi-funding", label: "HDI Ownership" },
    { id: "csi-spend", label: "CSI/CSR Spend" },
  ]

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      <div style={getContentStyles()}>
        <Header />

        {isInvestorView && (
          <div
            style={{
              backgroundColor: "#e6d7c3", // Light brown
              padding: "16px 20px",
              margin: "90px 0 30px 0",
              borderRadius: "8px",
              border: "2px solid #a67c52", // Medium brown
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
                backgroundColor: "#7d5a50", // Dark brown
                color: "#f5f0e1", // Light beige
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                transition: "background-color 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#5d4037" // Darker brown
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
          {/* Main ESG Tabs */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              margin: isInvestorView ? "20px 0" : "50px 0 20px 0",
              padding: "15px",
              backgroundColor: "#fdfcfb", // Off-white
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

          {/* Environmental Tab Content */}
          {activeMainTab === "environmental" && (
            <div
              style={{
                backgroundColor: "#faf7f2", // Light cream
                padding: "40px",
                margin: "20px 0",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                textAlign: "center",
                border: "2px solid #d4c4b0", // Light brown border
              }}
            >
              <h2 style={{ color: "#5d4037", marginBottom: "20px" }}>Environmental Impact</h2>
              <p style={{ color: "#7d5a50", fontSize: "16px" }}>
                Environmental tracking and sustainability metrics will be available soon.
              </p>
              <div style={{ marginTop: "30px", fontSize: "48px", color: "#a67c52" }}>🌱</div>
            </div>
          )}

          {/* Social Tab Content */}
          {activeMainTab === "social" && (
            <div>
              {/* Social Sub Tabs */}
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
                {socialSubTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSocialSubTab(tab.id)}
                    style={{
                      padding: "10px 15px",
                      backgroundColor: activeSocialSubTab === tab.id ? "#a67c52" : "#f5f0e1",
                      color: activeSocialSubTab === tab.id ? "#f5f0e1" : "#5d4037",
                      border: "2px solid #a67c52",
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
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Social Sub Tab Components */}
              <SocialImpactContent 
                activeSection={activeSocialSubTab} 
                currentUser={currentUser}
                isInvestorView={isInvestorView}
              />
            </div>
          )}

          {/* Governance Tab Content */}
          {activeMainTab === "governance" && (
            <GovernanceContent 
              currentUser={currentUser}
              isInvestorView={isInvestorView}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Social Impact Content Component
const SocialImpactContent = ({ activeSection, currentUser, isInvestorView }) => {
  const [fundingData, setFundingData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFundingData = async () => {
      try {
        if (!currentUser?.uid) {
          setLoading(false)
          return
        }

        console.log("Fetching social impact data for user ID:", currentUser.uid)
        const docRef = doc(db, "universalProfiles", currentUser.uid)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          setFundingData(data)
        }
      } catch (error) {
        console.error("Error loading funding data:", error)
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
        Loading social impact data...
      </div>
    )
  }

  return (
    <div>
      <BbbeeLevel activeSection={activeSection} fundingData={fundingData} />
      <JobsCreated activeSection={activeSection} fundingData={fundingData} />
      <HDIFunding activeSection={activeSection} fundingData={fundingData} />
      <CSISpend activeSection={activeSection} fundingData={fundingData} />
    </div>
  )
}

// B-BBEE Level Component
const BbbeeLevel = ({ activeSection, fundingData }) => {
  const handleDownloadCSV = () => {
    const blackOwnership = Number.parseFloat(fundingData?.socialImpact?.blackOwnership || 0)
    const womenOwnership = Number.parseFloat(fundingData?.socialImpact?.womenOwnership || 0)
    const youthOwnership = Number.parseFloat(fundingData?.socialImpact?.youthOwnership || 0)
    const disabledOwnership = Number.parseFloat(fundingData?.socialImpact?.disabledOwnership || 0)
    const totalHDI = blackOwnership + womenOwnership + youthOwnership + disabledOwnership

    let estimatedLevel = 8
    if (totalHDI >= 300) estimatedLevel = 1
    else if (totalHDI >= 250) estimatedLevel = 2
    else if (totalHDI >= 200) estimatedLevel = 3
    else if (totalHDI >= 150) estimatedLevel = 4
    else if (totalHDI >= 120) estimatedLevel = 5
    else if (totalHDI >= 90) estimatedLevel = 6
    else if (totalHDI >= 60) estimatedLevel = 7

    const csvContent = [
      ["Metric", "Value"],
      ["Estimated B-BBEE Level", estimatedLevel],
      ["Black Ownership %", blackOwnership],
      ["Women Ownership %", womenOwnership],
      ["Youth Ownership %", youthOwnership],
      ["Disabled Ownership %", disabledOwnership],
      ["Total HDI Score", totalHDI],
      ["Note", "Simplified estimation based on ownership data only"],
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "bbbee-level-data.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (activeSection !== "bbbee-level") return null

  const blackOwnership = Number.parseFloat(fundingData?.socialImpact?.blackOwnership || 0)
  const womenOwnership = Number.parseFloat(fundingData?.socialImpact?.womenOwnership || 0)
  const youthOwnership = Number.parseFloat(fundingData?.socialImpact?.youthOwnership || 0)
  const disabledOwnership = Number.parseFloat(fundingData?.socialImpact?.disabledOwnership || 0)
  const totalHDI = blackOwnership + womenOwnership + youthOwnership + disabledOwnership

  let estimatedLevel = 8
  if (totalHDI >= 300) estimatedLevel = 1
  else if (totalHDI >= 250) estimatedLevel = 2
  else if (totalHDI >= 200) estimatedLevel = 3
  else if (totalHDI >= 150) estimatedLevel = 4
  else if (totalHDI >= 120) estimatedLevel = 5
  else if (totalHDI >= 90) estimatedLevel = 6
  else if (totalHDI >= 60) estimatedLevel = 7

  const levels = [1, 2, 3, 4, 5, 6, 7, 8]

  return (
    <div
      style={{
        backgroundColor: "#faf7f2",
        padding: "20px",
        margin: "20px 0",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        border: "2px solid #d4c4b0",
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
        <h2 style={{ color: "#5d4037", margin: 0 }}>B-BBEE Level (Estimated)</h2>
        <button
          onClick={handleDownloadCSV}
          style={{
            padding: "8px 12px",
            backgroundColor: "#a67c52",
            color: "#f5f0e1",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <Download size={16} />
          Download CSV
        </button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "30px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              backgroundColor: "#a67c52",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#f5f0e1",
              fontSize: "48px",
              fontWeight: "bold",
              marginBottom: "20px",
              border: "4px solid #7d5a50",
            }}
          >
            {estimatedLevel}
          </div>

          <div
            style={{
              display: "flex",
              gap: "5px",
              marginBottom: "20px",
            }}
          >
            {levels.map((level) => (
              <div
                key={level}
                style={{
                  width: "35px",
                  height: "35px",
                  borderRadius: "50%",
                  backgroundColor: level <= estimatedLevel ? "#a67c52" : "#e6d7c3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: level <= estimatedLevel ? "#f5f0e1" : "#5d4037",
                  fontWeight: "bold",
                  fontSize: "14px",
                  border: level <= estimatedLevel ? "2px solid #7d5a50" : "2px solid #d4c4b0",
                }}
              >
                {level}
              </div>
            ))}
          </div>

          <div
            style={{
              backgroundColor: "#f5f0e1",
              padding: "20px",
              borderRadius: "6px",
              textAlign: "center",
              maxWidth: "400px",
              border: "2px solid #d4c4b0",
            }}
          >
            <h3 style={{ color: "#7d5a50", margin: "0 0 15px 0" }}>Ownership Summary</h3>
            <div style={{ color: "#5d4037", fontSize: "14px", textAlign: "left" }}>
              <div>Black Ownership: {blackOwnership}%</div>
              <div>Women Ownership: {womenOwnership}%</div>
              <div>Youth Ownership: {youthOwnership}%</div>
              <div>Disabled Ownership: {disabledOwnership}%</div>
              <hr style={{ margin: "10px 0", border: "1px solid #c8b6a6" }} />
              <div style={{ fontWeight: "bold" }}>Total HDI Score: {totalHDI}</div>
            </div>
            <div
              style={{
                marginTop: "15px",
                fontSize: "12px",
                color: "#7d5a50",
                fontStyle: "italic",
              }}
            >
              *Simplified estimation based on ownership data only
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Jobs Created Component
const JobsCreated = ({ activeSection, fundingData }) => {
  const handleDownloadCSV = () => {
    const jobsToCreate = fundingData?.socialImpact?.jobsToCreate || 0
    const blackOwnership = Number.parseFloat(fundingData?.socialImpact?.blackOwnership || 0)
    const womenOwnership = Number.parseFloat(fundingData?.socialImpact?.womenOwnership || 0)
    const youthOwnership = Number.parseFloat(fundingData?.socialImpact?.youthOwnership || 0)
    const disabledOwnership = Number.parseFloat(fundingData?.socialImpact?.disabledOwnership || 0)

    const jobDistribution = {
      "Black Employees": Math.round(jobsToCreate * (blackOwnership / 100)),
      "Women Employees": Math.round(jobsToCreate * (womenOwnership / 100)),
      "Youth Employees": Math.round(jobsToCreate * (youthOwnership / 100)),
      "Disabled Employees": Math.round(jobsToCreate * (disabledOwnership / 100)),
    }

    const csvContent = [
      ["HDI Group", "Jobs Created"],
      ...Object.entries(jobDistribution).map(([group, jobs]) => [group, jobs]),
      ["", ""],
      ["Total Jobs to Create", jobsToCreate],
      ["Black Ownership %", blackOwnership],
      ["Women Ownership %", womenOwnership],
      ["Youth Ownership %", youthOwnership],
      ["Disabled Ownership %", disabledOwnership],
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "jobs-created-data.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (activeSection !== "jobs-created") return null

  const jobsToCreate = fundingData?.socialImpact?.jobsToCreate || 0
  const blackOwnership = Number.parseFloat(fundingData?.socialImpact?.blackOwnership || 0)
  const womenOwnership = Number.parseFloat(fundingData?.socialImpact?.womenOwnership || 0)
  const youthOwnership = Number.parseFloat(fundingData?.socialImpact?.youthOwnership || 0)
  const disabledOwnership = Number.parseFloat(fundingData?.socialImpact?.disabledOwnership || 0)

  const jobDistribution = {
    "Black Employees": Math.round(jobsToCreate * (blackOwnership / 100)),
    "Women Employees": Math.round(jobsToCreate * (womenOwnership / 100)),
    "Youth Employees": Math.round(jobsToCreate * (youthOwnership / 100)),
    "Disabled Employees": Math.round(jobsToCreate * (disabledOwnership / 100)),
  }

  const hdiGroups = Object.keys(jobDistribution)
  const jobsData = Object.values(jobDistribution)

  return (
    <div
      style={{
        backgroundColor: "#faf7f2",
        padding: "20px",
        margin: "20px 0",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        border: "2px solid #d4c4b0",
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
        <h2 style={{ color: "#5d4037", margin: 0 }}>Jobs Created by HDI Group</h2>
        <button
          onClick={handleDownloadCSV}
          style={{
            padding: "8px 12px",
            backgroundColor: "#a67c52",
            color: "#f5f0e1",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <Download size={16} />
          Download CSV
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            backgroundColor: "#f5f0e1",
            padding: "20px",
            borderRadius: "6px",
            textAlign: "center",
            border: "2px solid #d4c4b0",
          }}
        >
          <h3 style={{ color: "#7d5a50", margin: "0 0 10px 0" }}>Total Jobs to Create</h3>
          <div
            style={{
              fontSize: "36px",
              fontWeight: "bold",
              color: "#5d4037",
            }}
          >
            {jobsToCreate}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#f5f0e1",
            padding: "20px",
            borderRadius: "6px",
            border: "2px solid #d4c4b0",
          }}
        >
          <h3 style={{ color: "#7d5a50", margin: "0 0 15px 0" }}>Ownership Breakdown</h3>
          <div style={{ fontSize: "14px", color: "#5d4037" }}>
            <div>Black Ownership: {blackOwnership}%</div>
            <div>Women Ownership: {womenOwnership}%</div>
            <div>Youth Ownership: {youthOwnership}%</div>
            <div>Disabled Ownership: {disabledOwnership}%</div>
          </div>
        </div>
      </div>

      <div style={{ height: "400px" }}>
        <Bar
          data={{
            labels: hdiGroups,
            datasets: [
              {
                label: "Estimated Jobs",
                data: jobsData,
                backgroundColor: "#a67c52",
                borderColor: "#7d5a50",
                borderWidth: 2,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: "#e6d7c3",
                },
                ticks: {
                  color: "#5d4037",
                },
              },
              x: {
                grid: {
                  display: false,
                },
                ticks: {
                  color: "#5d4037",
                },
              },
            },
          }}
        />
      </div>
    </div>
  )
}

// HDI Funding Component
const HDIFunding = ({ activeSection, fundingData }) => {
  const handleDownloadCSV = () => {
    const blackOwnership = Number.parseFloat(fundingData?.socialImpact?.blackOwnership || 0)
    const womenOwnership = Number.parseFloat(fundingData?.socialImpact?.womenOwnership || 0)
    const youthOwnership = Number.parseFloat(fundingData?.socialImpact?.youthOwnership || 0)
    const disabledOwnership = Number.parseFloat(fundingData?.socialImpact?.disabledOwnership || 0)
    const avgHDIOwnership = (blackOwnership + womenOwnership + youthOwnership + disabledOwnership) / 4
    const nonHDI = 100 - avgHDIOwnership

    const csvContent = [
      ["Category", "Percentage"],
      ["HDI-Owned", avgHDIOwnership.toFixed(2)],
      ["Non-HDI", nonHDI.toFixed(2)],
      ["", ""],
      ["HDI Breakdown", "Percentage"],
      ["Black Ownership", blackOwnership],
      ["Women Ownership", womenOwnership],
      ["Youth Ownership", youthOwnership],
      ["Disabled Ownership", disabledOwnership],
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "hdi-funding-data.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (activeSection !== "hdi-funding") return null

  const blackOwnership = Number.parseFloat(fundingData?.socialImpact?.blackOwnership || 0)
  const womenOwnership = Number.parseFloat(fundingData?.socialImpact?.womenOwnership || 0)
  const youthOwnership = Number.parseFloat(fundingData?.socialImpact?.youthOwnership || 0)
  const disabledOwnership = Number.parseFloat(fundingData?.socialImpact?.disabledOwnership || 0)
  const avgHDIOwnership = (blackOwnership + womenOwnership + youthOwnership + disabledOwnership) / 4
  const nonHDI = 100 - avgHDIOwnership

  const fundingChartData = {
    labels: ["HDI-Owned", "Non-HDI"],
    datasets: [
      {
        data: [avgHDIOwnership, nonHDI],
        backgroundColor: ["#a67c52", "#e6d7c3"],
        borderColor: "#7d5a50",
        borderWidth: 2,
      },
    ],
  }

  return (
    <div
      style={{
        backgroundColor: "#faf7f2",
        padding: "20px",
        margin: "20px 0",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        border: "2px solid #d4c4b0",
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
        <h2 style={{ color: "#5d4037", margin: 0 }}>HDI Ownership Distribution</h2>
        <button
          onClick={handleDownloadCSV}
          style={{
            padding: "8px 12px",
            backgroundColor: "#a67c52",
            color: "#f5f0e1",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <Download size={16} />
          Download CSV
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          alignItems: "center",
        }}
      >
        <div style={{ height: "300px" }}>
          <Doughnut
            data={fundingChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "right",
                  labels: {
                    color: "#5d4037",
                    font: {
                      size: 14,
                    },
                  },
                },
                datalabels: {
                  color: "#fff",
                  font: {
                    weight: "bold",
                    size: 16,
                  },
                  formatter: (value) => {
                    return value.toFixed(1) + "%"
                  },
                },
              },
            }}
            plugins={[ChartDataLabels]}
          />
        </div>
        <div>
          <div
            style={{
              backgroundColor: "#f5f0e1",
              padding: "20px",
              borderRadius: "6px",
              border: "2px solid #d4c4b0",
            }}
          >
            <h3 style={{ color: "#7d5a50", marginBottom: "15px" }}>HDI Ownership Breakdown</h3>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                color: "#5d4037",
              }}
            >
              <li style={{ marginBottom: "10px", padding: "5px 0", borderBottom: "1px solid #e6d7c3" }}>
                • Black Ownership: {blackOwnership}%
              </li>
              <li style={{ marginBottom: "10px", padding: "5px 0", borderBottom: "1px solid #e6d7c3" }}>
                • Women Ownership: {womenOwnership}%
              </li>
              <li style={{ marginBottom: "10px", padding: "5px 0", borderBottom: "1px solid #e6d7c3" }}>
                • Youth Ownership: {youthOwnership}%
              </li>
              <li style={{ marginBottom: "10px", padding: "5px 0", borderBottom: "1px solid #e6d7c3" }}>
                • Disabled Ownership: {disabledOwnership}%
              </li>
              <li style={{ marginBottom: "10px", padding: "5px 0", fontWeight: "bold", color: "#7d5a50" }}>
                • Average HDI: {avgHDIOwnership.toFixed(1)}%
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// CSI/CSR Spend Component
const CSISpend = ({ activeSection, fundingData }) => {
  const handleDownloadCSV = () => {
    const csiSpend = fundingData?.socialImpact?.csiCsrSpend || "R0"
    const numericSpend = Number.parseFloat(csiSpend.replace(/[^\d.]/g, "")) || 0

    const csvContent = [
      ["Metric", "Value"],
      ["CSI/CSR Spend", csiSpend],
      ["Numeric Value", numericSpend],
      ["Currency", "ZAR"],
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "csi-spend-data.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (activeSection !== "csi-spend") return null

  const csiSpend = fundingData?.socialImpact?.csiCsrSpend || "R0"

  return (
    <div
      style={{
        backgroundColor: "#faf7f2",
        padding: "20px",
        margin: "20px 0",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        border: "2px solid #d4c4b0",
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
        <h2 style={{ color: "#5d4037", margin: 0 }}>CSI/CSR Spend</h2>
        <button
          onClick={handleDownloadCSV}
          style={{
            padding: "8px 12px",
            backgroundColor: "#a67c52",
            color: "#f5f0e1",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <Download size={16} />
          Download CSV
        </button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "200px",
        }}
      >
        <div
          style={{
            backgroundColor: "#f5f0e1",
            padding: "40px",
            borderRadius: "12px",
            textAlign: "center",
            minWidth: "300px",
            border: "3px solid #a67c52",
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={{ color: "#7d5a50", margin: "0 0 20px 0" }}>Annual CSI/CSR Investment</h3>
          <div
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              color: "#5d4037",
              marginBottom: "10px",
            }}
          >
            {csiSpend}
          </div>
          <div
            style={{
              fontSize: "16px",
              color: "#7d5a50",
            }}
          >
            Corporate Social Investment & Responsibility
          </div>
        </div>
      </div>
    </div>
  )
}

// Governance Content Component
const GovernanceContent = ({ currentUser, isInvestorView }) => {
  const [pisScore, setPisScore] = useState(0)
  const [isLoadingPisScore, setIsLoadingPisScore] = useState(true)
  const [hasBoardDirectors, setHasBoardDirectors] = useState(null)
  const [showBoardQuestion, setShowBoardQuestion] = useState(true)
  const [policies, setPolicies] = useState([])
  const [meetings, setMeetings] = useState([])
  const [directors, setDirectors] = useState([])
  const [committees, setCommittees] = useState([])
  const [uploadedFiles, setUploadedFiles] = useState({})

  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [showDirectorModal, setShowDirectorModal] = useState(false)
  const [showCommitteeModal, setShowCommitteeModal] = useState(false)
  const [showPolicyProcedureModal, setShowPolicyProcedureModal] = useState(false)

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

  const [editingMeeting, setEditingMeeting] = useState(null)
  const [editingDirector, setEditingDirector] = useState(null)
  const [editingCommittee, setEditingCommittee] = useState(null)
  const [editingPolicyProcedure, setEditingPolicyProcedure] = useState(null)

  useEffect(() => {
    const userIdToFetch = isInvestorView && currentUser?.uid ? currentUser.uid : currentUser?.uid

    if (!userIdToFetch) {
      setPisScore(0)
      setIsLoadingPisScore(false)
      return
    }

    setIsLoadingPisScore(true)
    const docRef = doc(db, "bigEvaluations", userIdToFetch)

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        try {
          if (docSnap.exists()) {
            const data = docSnap.data()
            if (data.scores && data.scores.pis !== undefined) {
              setPisScore(data.scores.pis)
            } else {
              setPisScore(0)
            }
          } else {
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
  }, [currentUser, isInvestorView])

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

    loadUserData()
  }, [currentUser])

  const hasMinimumGovernanceScore = pisScore >= 262.5
  const hasFullBoardScore = pisScore >= 350

  const handleBoardDirectorsResponse = (hasDirectors) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }
    setHasBoardDirectors(hasDirectors)
    setShowBoardQuestion(false)
  }

  const handleAddMeeting = () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }
    setEditingMeeting(null)
    setNewMeeting({ date: "", type: "", attendees: "", totalMembers: "", minutes: "" })
    setShowMeetingModal(true)
  }

  const handleEditMeeting = (meeting) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }
    setEditingMeeting(meeting)
    setNewMeeting(meeting)
    setShowMeetingModal(true)
  }

  const handleSaveMeeting = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

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
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

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

  const handleAddDirector = () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }
    setEditingDirector(null)
    setNewDirector({ name: "", position: "", date: "", committees: [] })
    setShowDirectorModal(true)
  }

  const handleEditDirector = (director) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }
    setEditingDirector(director)
    setNewDirector(director)
    setShowDirectorModal(true)
  }

  const handleSaveDirector = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

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
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

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

  const handleAddCommittee = () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }
    setEditingCommittee(null)
    setNewCommittee({ name: "", position: "", date: "", committees: [] })
    setShowCommitteeModal(true)
  }

  const handleEditCommittee = (committee) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }
    setEditingCommittee(committee)
    setNewCommittee(committee)
    setShowCommitteeModal(true)
  }

  const handleSaveCommittee = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

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
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

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

  const handleRequestAdvisorRedirect = () => {
    window.location.href = "/find-advisors"
  }

  const handleFileUpload = async (e, policyId = null) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    const file = e.target.files[0]
    if (!file) return

    try {
      const fileData = {
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      }

      if (policyId) {
        const policyRef = doc(db, "policyProcedures", policyId)
        await updateDoc(policyRef, {
          fileAttached: true,
          fileData: fileData,
        })

        setPolicies((prev) =>
          prev.map((p) => (p.id === policyId ? { ...p, fileAttached: true, fileData: fileData } : p)),
        )
      } else {
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
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    if (!currentUser) {
      alert("You must be logged in to save policies/procedures.")
      return
    }

    try {
      const policyProcedureWithUser = {
        ...newPolicyProcedure,
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
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

      setUploadedFiles((prev) => ({ ...prev, temp: null }))
      setShowPolicyProcedureModal(false)
      setNewPolicyProcedure({ name: "", type: "policy", status: "", date: "", fileAttached: false, fileData: null })
    } catch (error) {
      console.error("Error saving policy/procedure:", error)
      alert("Error saving policy/procedure. Please try again.")
    }
  }

  const handleDeletePolicyProcedure = async (policyId) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

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
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }
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
        border: "2px solid #d4c4b0",
      }}
    >
      <h3 style={{ color: "#5d4037", marginBottom: "20px" }}>Board Activity & Governance</h3>

      {/* PIS Score Explanation */}
      <div
        style={{
          backgroundColor: "#f5f0e1",
          border: "2px solid #c8b6a6",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px" }}>Understanding Your Governance Score</h4>

        <div style={{ marginBottom: "15px" }}>
          <p style={{ color: "#5d4037", margin: "0 0 10px 0", fontWeight: "600" }}>PIS Calculation:</p>
          <p style={{ color: "#5d4037", margin: "0 0 5px 0" }}>
            • PIS = Employees + (Turnover/R1m) + (Liabilities/R1m) + Shareholders
          </p>
          <p style={{ color: "#5d4037", margin: 0 }}>
            • Higher PIS indicates greater public interest and governance requirements
          </p>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <p style={{ color: "#5d4037", margin: "0 0 10px 0", fontWeight: "600" }}>Governance Stages:</p>
          <p style={{ color: "#5d4037", margin: "0 0 5px 0" }}>• PIS &lt; 100: Advisors Stage - light governance</p>
          <p style={{ color: "#5d4037", margin: "0 0 5px 0" }}>
            • PIS 100-349: Emerging Board Stage - informal board recommended
          </p>
          <p style={{ color: "#5d4037", margin: 0 }}>• PIS ≥ 350: Full Board Stage - formal board strongly recommended</p>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <p style={{ color: "#5d4037", margin: "0 0 10px 0", fontWeight: "600" }}>
            Purpose - the governance score helps:
          </p>
          <p style={{ color: "#5d4037", margin: "0 0 5px 0" }}>• Determine appropriate governance structures</p>
          <p style={{ color: "#5d4037", margin: "0 0 5px 0" }}>• Assess compliance readiness</p>
          <p style={{ color: "#5d4037", margin: "0 0 5px 0" }}>• Identify governance improvement areas</p>
          <p style={{ color: "#5d4037", margin: 0 }}>• Prepare for investment and scaling</p>
        </div>

        <p style={{ color: "#5d4037", margin: 0, fontStyle: "italic", fontWeight: "500" }}>
          Strong governance scores indicate readiness for investment and ability to manage complex business operations.
        </p>
      </div>

      <div
        style={{
          backgroundColor: hasMinimumGovernanceScore ? "#e6d7c3" : "#f5f0e1",
          border: `2px solid ${hasMinimumGovernanceScore ? "#a67c52" : "#c8b6a6"}`,
          padding: "15px",
          borderRadius: "6px",
          marginBottom: "20px",
        }}
      >
        <p style={{ color: "#5d4037", margin: 0, fontWeight: "500" }}>
          Current Governance Score: {Math.round((pisScore / 350) * 100)}% ({pisScore} / 350 points)
        </p>
        {!hasMinimumGovernanceScore && (
          <div>
            <p style={{ color: "#7d5a50", margin: "10px 0 0 0", fontSize: "14px" }}>
              You need at least 75% (262.5 points) to access board director features. You can request advisor support
              below.
            </p>
            {!isInvestorView && (
              <button
                onClick={handleRequestAdvisorRedirect}
                style={{
                  marginTop: "10px",
                  padding: "8px 16px",
                  backgroundColor: "#a67c52",
                  color: "#f5f0e1",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "14px",
                }}
              >
                Request Advisor
              </button>
            )}
          </div>
        )}
      </div>

      {showBoardQuestion && !isInvestorView && (
        <div
          style={{
            backgroundColor: "#fdfcfb",
            padding: "30px",
            borderRadius: "6px",
            textAlign: "center",
            border: "2px solid #e6d7c3",
          }}
        >
          <h4 style={{ color: "#5d4037", marginBottom: "20px" }}>Do you have Board of Directors?</h4>
          <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
            <button
              onClick={() => handleBoardDirectorsResponse(true)}
              style={{
                padding: "12px 30px",
                backgroundColor: "#7d5a50",
                color: "#f5f0e1",
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
                color: "#5d4037",
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
              <h4 style={{ color: "#5d4037", margin: 0 }}>Board of Directors</h4>
              {!isInvestorView && (
                <button
                  onClick={handleAddDirector}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#7d5a50",
                    color: "#f5f0e1",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "12px",
                  }}
                >
                  Add Director
                </button>
              )}
            </div>

            {directors.length > 0 ? (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  color: "#5d4037",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "2px solid #c8b6a6", backgroundColor: "#e6d7c3" }}>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Name</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Position</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Date Appointed</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Committees</th>
                    {!isInvestorView && (
                      <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Actions</th>
                    )}
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
                      {!isInvestorView && (
                        <td style={{ padding: "12px" }}>
                          <div style={{ display: "flex", gap: "5px" }}>
                            <button
                              onClick={() => handleEditDirector(director)}
                              style={{
                                padding: "4px 8px",
                                backgroundColor: "#a67c52",
                                color: "#f5f0e1",
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
                                backgroundColor: "#7d5a50",
                                color: "#f5f0e1",
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
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "#7d5a50" }}>
                No directors added yet. {!isInvestorView && 'Click "Add Director" to get started.'}
              </div>
            )}
          </div>

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
              <h4 style={{ color: "#5d4037", margin: 0 }}>Meetings Held</h4>
              {!isInvestorView && (
                <button
                  onClick={handleAddMeeting}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#7d5a50",
                    color: "#f5f0e1",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "12px",
                  }}
                >
                  Add Meeting
                </button>
              )}
            </div>

            {meetings.length > 0 ? (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  color: "#5d4037",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "2px solid #c8b6a6", backgroundColor: "#e6d7c3" }}>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Date</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Type</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Attendance</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Minutes</th>
                    {!isInvestorView && (
                      <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Actions</th>
                    )}
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
                      {!isInvestorView && (
                        <td style={{ padding: "12px" }}>
                          <div style={{ display: "flex", gap: "5px" }}>
                            <button
                              onClick={() => handleEditMeeting(meeting)}
                              style={{
                                padding: "4px 8px",
                                backgroundColor: "#a67c52",
                                color: "#f5f0e1",
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
                                backgroundColor: "#7d5a50",
                                color: "#f5f0e1",
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
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "#7d5a50" }}>
                No meetings added yet. {!isInvestorView && 'Click "Add Meeting" to get started.'}
              </div>
            )}
          </div>
        </>
      )}

      {!showBoardQuestion && !hasBoardDirectors && hasFullBoardScore && (
        <div
          style={{
            backgroundColor: "#f5f0e1",
            border: "2px solid #c8b6a6",
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px" }}>
            Consider Establishing a Board of Directors
          </h3>
          <p style={{ color: "#5d4037", marginBottom: "15px" }}>
            With your current governance score of {pisScore} points, your business would benefit from establishing a
            formal Board of Directors. A board can provide strategic guidance, improve governance, and enhance
            credibility with investors and stakeholders.
          </p>
          {!isInvestorView && (
            <button
              onClick={handleRequestAdvisorRedirect}
              style={{
                padding: "10px 20px",
                backgroundColor: "#a67c52",
                color: "#f5f0e1",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Request Advisor Support
            </button>
          )}
        </div>
      )}

      {!showBoardQuestion && !hasBoardDirectors && !hasFullBoardScore && (
        <div
          style={{
            backgroundColor: "#f5f0e1",
            border: "2px solid #e6d7c3",
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#7d5a50", margin: 0 }}>
            You indicated you don't have a Board of Directors. Focus on improving your governance score to {350} points
            to unlock recommendations for establishing a formal board structure.
          </p>
        </div>
      )}

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
          <h4 style={{ color: "#5d4037", margin: 0 }}>Policies & Procedures</h4>
          {!isInvestorView && (
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
                  color: "#f5f0e1",
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
                  backgroundColor: "#a67c52",
                  color: "#f5f0e1",
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
                  backgroundColor: "#c8b6a6",
                  color: "#5d4037",
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
          )}
        </div>
        <div
          style={{
            backgroundColor: "#f5f0e1",
            padding: "15px",
            borderRadius: "6px",
            minHeight: "200px",
            border: "1px solid #d4c4b0",
          }}
        >
          {policies.length > 0 ? (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                color: "#5d4037",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "2px solid #c8b6a6", backgroundColor: "#e6d7c3" }}>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Name</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Type</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Status</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Date</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Attach Policy/Procedure</th>
                  {!isInvestorView && (
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Actions</th>
                  )}
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
                        <span style={{ color: "#a67c52", fontWeight: "500" }}>
                          ✓ {item.fileData?.name || "Attached"}
                        </span>
                      ) : !isInvestorView ? (
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
                              backgroundColor: "#a67c52",
                              color: "#f5f0e1",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "10px",
                            }}
                          >
                            Attach File
                          </button>
                        </>
                      ) : (
                        <span style={{ color: "#c8b6a6" }}>-</span>
                      )}
                    </td>
                    {!isInvestorView && (
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", gap: "5px" }}>
                          <button
                            onClick={() => handleEditPolicyProcedure(item)}
                            style={{
                              padding: "4px 8px",
                              backgroundColor: "#a67c52",
                              color: "#f5f0e1",
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
                              backgroundColor: "#7d5a50",
                              color: "#f5f0e1",
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
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "#7d5a50" }}>
              No policies or procedures added yet. {!isInvestorView && 'Click "Add Policy/Procedure" to get started.'}
            </div>
          )}
        </div>
      </div>

      {/* Policy/Procedure Modal */}
      {showPolicyProcedureModal && !isInvestorView && (
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
            <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "20px" }}>
              {editingPolicyProcedure ? "Edit Policy/Procedure" : "Add Policy/Procedure"}
            </h3>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "500" }}>
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
                  value={newPolicyProcedure.type}
                  onChange={(e) => setNewPolicyProcedure((prev) => ({ ...prev, type: e.target.value }))}
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
                  <option value="policy">Policy</option>
                  <option value="procedure">Procedure</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "500" }}>
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
                    backgroundColor: "#faf7f2",
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
                <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "500" }}>
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
                    backgroundColor: "#faf7f2",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "500" }}>
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
                    backgroundColor: "#faf7f2",
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
                onClick={handleSavePolicyProcedure}
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
                {editingPolicyProcedure ? "Update Policy/Procedure" : "Add Policy/Procedure"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Modal */}
      {showMeetingModal && !isInvestorView && (
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
              width: "90%",
              maxWidth: "500px",
              border: "2px solid #a67c52",
            }}
          >
            <h3 style={{ color: "#5d4037", marginTop: 0 }}>{editingMeeting ? "Edit Meeting" : "Add Meeting"}</h3>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037" }}>Date:</label>
              <input
                type="date"
                value={newMeeting.date}
                onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
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
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037" }}>Type:</label>
              <input
                type="text"
                value={newMeeting.type}
                onChange={(e) => setNewMeeting({ ...newMeeting, type: e.target.value })}
                placeholder="e.g. Board Meeting, Strategy Session"
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
                <label style={{ display: "block", marginBottom: "5px", color: "#5d4037" }}>Attendees:</label>
                <input
                  type="number"
                  value={newMeeting.attendees}
                  onChange={(e) => setNewMeeting({ ...newMeeting, attendees: e.target.value })}
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
                <label style={{ display: "block", marginBottom: "5px", color: "#5d4037" }}>Total Members:</label>
                <input
                  type="number"
                  value={newMeeting.totalMembers}
                  onChange={(e) => setNewMeeting({ ...newMeeting, totalMembers: e.target.value })}
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
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037" }}>Minutes:</label>
              <textarea
                value={newMeeting.minutes}
                onChange={(e) => setNewMeeting({ ...newMeeting, minutes: e.target.value })}
                placeholder="Meeting notes and minutes"
                rows="4"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e6d7c3",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  resize: "vertical",
                  backgroundColor: "#faf7f2",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowMeetingModal(false)}
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
                onClick={handleSaveMeeting}
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
                {editingMeeting ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Director Modal */}
      {showDirectorModal && !isInvestorView && (
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
              width: "90%",
              maxWidth: "500px",
              border: "2px solid #a67c52",
            }}
          >
            <h3 style={{ color: "#5d4037", marginTop: 0 }}>
              {editingDirector ? "Edit Director" : "Add Director"}
            </h3>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037" }}>Name:</label>
              <input
                type="text"
                value={newDirector.name}
                onChange={(e) => setNewDirector({ ...newDirector, name: e.target.value })}
                placeholder="Director's full name"
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
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037" }}>Position:</label>
              <input
                type="text"
                value={newDirector.position}
                onChange={(e) => setNewDirector({ ...newDirector, position: e.target.value })}
                placeholder="e.g. Chairperson, Non-Executive Director"
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
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#5d4037" }}>Date Appointed:</label>
              <input
                type="date"
                value={newDirector.date}
                onChange={(e) => setNewDirector({ ...newDirector, date: e.target.value })}
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
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowDirectorModal(false)}
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
                onClick={handleSaveDirector}
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
                {editingDirector ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ESG