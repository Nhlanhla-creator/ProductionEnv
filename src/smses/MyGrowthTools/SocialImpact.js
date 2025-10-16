"use client"

import { useState, useEffect } from "react"
import { Bar, Doughnut } from "react-chartjs-2"
import { Download } from "lucide-react"
import Sidebar from "smses/Sidebar/Sidebar"
import Header from "../DashboardHeader/DashboardHeader"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from "chart.js"
import ChartDataLabels from "chartjs-plugin-datalabels"

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,

)

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
        <h2 style={{ color: "#4a352f", margin: 0 }}>Jobs Created by HDI Group</h2>
        <button
          onClick={handleDownloadCSV}
          style={{
            padding: "8px 12px",
            backgroundColor: "#a67c52",
            color: "#faf7f2",
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
          }}
        >
          <h3 style={{ color: "#7d5a50", margin: "0 0 10px 0" }}>Total Jobs to Create</h3>
          <div
            style={{
              fontSize: "36px",
              fontWeight: "bold",
              color: "#4a352f",
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
          }}
        >
          <h3 style={{ color: "#7d5a50", margin: "0 0 15px 0" }}>Ownership Breakdown</h3>
          <div style={{ fontSize: "14px", color: "#4a352f" }}>
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
                borderWidth: 1,
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
        borderWidth: 1,
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
        <h2 style={{ color: "#4a352f", margin: 0 }}>HDI Ownership Distribution</h2>
        <button
          onClick={handleDownloadCSV}
          style={{
            padding: "8px 12px",
            backgroundColor: "#a67c52",
            color: "#faf7f2",
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
        },
        datalabels: { // ← KEEP this configuration
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
    plugins={[ChartDataLabels]} // ← ADD THIS LINE (after options)
  />
</div>
        <div>
          <div
            style={{
              backgroundColor: "#f5f0e1",
              padding: "20px",
              borderRadius: "6px",
            }}
          >
            <h3 style={{ color: "#7d5a50" }}>HDI Ownership Breakdown</h3>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                color: "#4a352f",
              }}
            >
              <li style={{ marginBottom: "10px" }}>• Black Ownership: {blackOwnership}%</li>
              <li style={{ marginBottom: "10px" }}>• Women Ownership: {womenOwnership}%</li>
              <li style={{ marginBottom: "10px" }}>• Youth Ownership: {youthOwnership}%</li>
              <li style={{ marginBottom: "10px" }}>• Disabled Ownership: {disabledOwnership}%</li>
              <li style={{ marginBottom: "10px", fontWeight: "bold" }}>• Average HDI: {avgHDIOwnership.toFixed(1)}%</li>
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
        <h2 style={{ color: "#4a352f", margin: 0 }}>CSI/CSR Spend</h2>
        <button
          onClick={handleDownloadCSV}
          style={{
            padding: "8px 12px",
            backgroundColor: "#a67c52",
            color: "#faf7f2",
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
          }}
        >
          <h3 style={{ color: "#7d5a50", margin: "0 0 20px 0" }}>Annual CSI/CSR Investment</h3>
          <div
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              color: "#4a352f",
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
        <h2 style={{ color: "#4a352f", margin: 0 }}>B-BBEE Level (Estimated)</h2>
        <button
          onClick={handleDownloadCSV}
          style={{
            padding: "8px 12px",
            backgroundColor: "#a67c52",
            color: "#faf7f2",
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
              color: "white",
              fontSize: "48px",
              fontWeight: "bold",
              marginBottom: "20px",
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
                  color: level <= estimatedLevel ? "white" : "#4a352f",
                  fontWeight: "bold",
                  fontSize: "14px",
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
            }}
          >
            <h3 style={{ color: "#7d5a50", margin: "0 0 15px 0" }}>Ownership Summary</h3>
            <div style={{ color: "#4a352f", fontSize: "14px", textAlign: "left" }}>
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

// Main SocialImpact Component
const SocialImpact = () => {
  const [activeSection, setActiveSection] = useState("jobs-created")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [fundingData, setFundingData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFundingData = async () => {
      try {
        const userId = auth.currentUser?.uid
        if (!userId) {
          setLoading(false)
          return
        }

        const docRef = doc(db, "universalProfiles", userId)
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

  const getContentStyles = () => ({
    width: "100%",
    marginLeft: "0",
    backgroundColor: "#f0e6d9",
    minHeight: "100vh",
    padding: `70px 20px 20px ${isSidebarCollapsed ? "100px" : "270px"}`,
    transition: "padding 0.3s ease",
    boxSizing: "border-box",
  })

  const sectionButtons = [
    { id: "jobs-created", label: "Jobs Created" },
    { id: "hdi-funding", label: "HDI Ownership" },
    { id: "csi-spend", label: "CSI/CSR Spend" },
    { id: "bbbee-level", label: "B-BBEE Level" },
  ]

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <div style={getContentStyles()}>
          <Header />
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "50vh",
              color: "#4a352f",
            }}
          >
            Loading social impact data...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      <div style={getContentStyles()}>
        <Header />

        <div style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              gap: "10px",
              margin: "50px 0 20px 0",
              padding: "15px",
              backgroundColor: "#faf7f2",
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

          <JobsCreated activeSection={activeSection} fundingData={fundingData} />
          <HDIFunding activeSection={activeSection} fundingData={fundingData} />
          <CSISpend activeSection={activeSection} fundingData={fundingData} />
          <BbbeeLevel activeSection={activeSection} fundingData={fundingData} />
        </div>
      </div>
    </div>
  )
}

export default SocialImpact
