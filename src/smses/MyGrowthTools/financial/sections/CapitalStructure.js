"use client";
import { useState, useEffect } from "react";
import { db } from "../../../../firebaseConfig";
import { collection, doc, addDoc, getDoc, setDoc } from "firebase/firestore";
import {
  KeyQuestionBox,
  KPICard,
  TrendModal,
  CalculationModal,
  TrendButton,
  SectionHeading,
  DateRangePicker,
} from "../components/SharedComponents";
import UniversalAddDataModal from "../components/UniversalAddDataModal";
import { useCapitalStructureData } from "../../../hooks/useFinancialData";
import {
  getYearsRange,
  CALCULATION_TEXTS,
} from "../data_utils/financialConstants";
import {
  calculateTotal,
  formatCurrency,
  makeFormatValue,
  parseYM,
  getRangeMonthsMeta,
  getRangeLabels,
  getRangeComputed,
  computeCapitalStructureChartData,
  formatSmartNumber,
  getSmartUnit,
} from "../data_utils/financialUtils";

// Chart.js imports for Cap Table pie chart
import { Pie } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";

// ==================== HELPERS ====================

const _now        = new Date();
const _defaultTo  = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, "0")}`;
const _defaultFrom = (() => {
  const d = new Date(_now.getFullYear(), _now.getMonth() - 11, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
})();

// ==================== DIVIDEND HISTORY COMPONENT ====================
const DividendHistory = ({ currentUser, isInvestorView }) => {
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
        const data = docSnap.data()
        // Handle legacy data - convert amount to amountPerShare if needed
        const dividendsData = data.dividends || []
        const updatedDividends = dividendsData.map(dividend => ({
          ...dividend,
          amountPerShare: dividend.amountPerShare !== undefined ? dividend.amountPerShare : (dividend.amount || 0),
          totalIssued: dividend.totalIssued !== undefined ? dividend.totalIssued : 0
        }))
        setDividends(updatedDividends)
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
    } else if (field === "amountPerShare") {
      newDividends[index][field] = Number.parseFloat(value) || 0
    } else if (field === "totalIssued") {
      newDividends[index][field] = Number.parseFloat(value) || 0
    } else {
      newDividends[index][field] = value
    }
    setDividends(newDividends)
  }

  const addDividend = () => {
    setDividends([...dividends, { 
      year: new Date().getFullYear(), 
      amountPerShare: 0, 
      totalIssued: 0,
      paymentDate: "" 
    }])
  }

  const removeDividend = (index) => {
    const newDividends = dividends.filter((_, i) => i !== index)
    setDividends(newDividends)
  }

  const handleDownload = (type) => {
    if (type === "csv") {
      const csvContent = [
        ["Year", "Amount per Share", "Total Issued", "Payment Date"],
        ...dividends.map((div) => [
          div.year, 
          (div.amountPerShare || 0).toFixed(2), 
          (div.totalIssued || 0).toFixed(2), 
          div.paymentDate
        ]),
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
        <h3 style={{ color: "#5d4037", margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>Dividend History</h3>
        <div style={{ display: "flex", gap: "10px" }}>
          {!isInvestorView && (
            <button
              onClick={() => setShowEditForm(!showEditForm)}
              style={{
                padding: "6px 12px",
                backgroundColor: "#5d4037",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              {showEditForm ? "Cancel" : "Edit Data"}
            </button>
          )}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowDownloadOptions(!showDownloadOptions)}
              style={{
                padding: "6px 12px",
                backgroundColor: "#72542b",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.8rem",
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
                    fontSize: "0.8rem",
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
                    fontSize: "0.8rem",
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
          <h4 style={{ color: "#72542b", marginTop: 0, fontSize: "1rem" }}>Edit Dividend History Data</h4>
          {dividends.map((dividend, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 2fr auto",
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
                  padding: "6px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                }}
                placeholder="Year"
              />
              <input
                type="number"
                step="0.01"
                value={dividend.amountPerShare || 0}
                onChange={(e) => updateDividend(index, "amountPerShare", e.target.value)}
                style={{
                  padding: "6px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                }}
                placeholder="Amount per Share"
              />
              <input
                type="number"
                step="0.01"
                value={dividend.totalIssued || 0}
                onChange={(e) => updateDividend(index, "totalIssued", e.target.value)}
                style={{
                  padding: "6px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                }}
                placeholder="Total Issued"
              />
              <input
                type="date"
                value={dividend.paymentDate}
                onChange={(e) => updateDividend(index, "paymentDate", e.target.value)}
                style={{
                  padding: "6px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                }}
              />
              <button
                onClick={() => removeDividend(index)}
                style={{
                  padding: "6px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
            <button
              onClick={addDividend}
              style={{
                padding: "6px 12px",
                backgroundColor: "#72542b",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              Add Dividend
            </button>
            <button
              onClick={saveDividendData}
              style={{
                padding: "6px 12px",
                backgroundColor: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.8rem",
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
            padding: "30px",
            color: "#72542b",
            backgroundColor: "#f7f3f0",
            borderRadius: "6px",
          }}
        >
          <p style={{ margin: 0, fontSize: "0.9rem" }}>No dividend data available. {!isInvestorView && 'Click "Edit Data" to add your first dividend entry.'}</p>
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
              fontSize: "0.85rem",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid #d4c4b0",
                }}
              >
                <th style={{ padding: "10px", textAlign: "left" }}>Year</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Amount per Share</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Total Issued</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Payment Date</th>
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
                    <td style={{ padding: "10px" }}>{div.year}</td>
                    <td style={{ padding: "10px", textAlign: "right" }}>R{(div.amountPerShare || 0).toFixed(2)}</td>
                    <td style={{ padding: "10px", textAlign: "right" }}>R{(div.totalIssued || 0).toFixed(2)}</td>
                    <td style={{ padding: "10px" }}>{div.paymentDate}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ==================== CAP TABLE OVERVIEW COMPONENT ====================
const CapTableOverview = ({ currentUser, isInvestorView }) => {
  const [investors, setInvestors] = useState([])
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDownloadOptions, setShowDownloadOptions] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // IRR Investments state
  const [irrInvestments, setIrrInvestments] = useState([])
  const [expandedInvestment, setExpandedInvestment] = useState(null)
  const [showIrrEditForm, setShowIrrEditForm] = useState(false)
  const [showIrrDownloadOptions, setShowIrrDownloadOptions] = useState(false)

  const saveCapTableData = async () => {
    if (!currentUser) return

    try {
      await setDoc(doc(db, "cap-table", currentUser.uid), {
        investors,
        irrInvestments,
        lastUpdated: new Date().toISOString(),
      })
      setShowEditForm(false)
      setShowIrrEditForm(false)
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
        const data = docSnap.data()
        // Handle legacy data - convert valuation to investment if needed
        const investorsData = data.investors || []
        const updatedInvestors = investorsData.map(investor => ({
          ...investor,
          investment: investor.investment !== undefined ? investor.investment : (investor.valuation || 0)
        }))
        setInvestors(updatedInvestors)
        setIrrInvestments(data.irrInvestments || [])
      } else {
        // Initialize with empty data if no document exists
        await setDoc(docRef, {
          investors: [],
          irrInvestments: [],
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
    setInvestors([...investors, { name: "New Investor", shares: 0, investment: 0 }])
  }

  const removeInvestor = (index) => {
    const newInvestors = investors.filter((_, i) => i !== index)
    setInvestors(newInvestors)
  }

  // IRR Investments functions
  const updateIrrInvestment = (index, field, value) => {
    const newInvestments = [...irrInvestments]
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
    setIrrInvestments(newInvestments)
  }

  const addIrrInvestment = () => {
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
    setIrrInvestments([...irrInvestments, newInvestment])
  }

  const removeIrrInvestment = (index) => {
    const newInvestments = irrInvestments.filter((_, i) => i !== index)
    setIrrInvestments(newInvestments)
  }

  const toggleIrrInvestment = (index) => {
    if (expandedInvestment === index) {
      setExpandedInvestment(null)
    } else {
      setExpandedInvestment(index)
    }
  }

  const handleDownload = (type) => {
    const totalShares = investors.reduce((sum, inv) => sum + inv.shares, 0)
    const totalInvestment = investors.reduce((sum, inv) => sum + (inv.investment || 0), 0)

    if (type === "csv") {
      const csvContent = [
        ["Investor Name", "Shares", "Percentage", "Investment (RM)"],
        ...investors.map((inv) => [
          inv.name,
          inv.shares,
          totalShares > 0 ? ((inv.shares / totalShares) * 100).toFixed(1) : 0,
          (inv.investment || 0).toFixed(1),
        ]),
        ["Total", totalShares, "100", totalInvestment.toFixed(1)],
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
      const jsonContent = JSON.stringify({ investors, irrInvestments }, null, 2)
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

  const handleIrrDownload = (type) => {
    if (type === "csv") {
      const csvContent = [
        ["Investment Name", "IRR %", "Initial Investment", "Duration", "Risk Rating"],
        ...irrInvestments.map((inv) => [
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
      const jsonContent = JSON.stringify(irrInvestments, null, 2)
      const blob = new Blob([jsonContent], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "irr-investments.json"
      a.click()
      URL.revokeObjectURL(url)
    }
    setShowIrrDownloadOptions(false)
  }

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
  const totalInvestment = investors.reduce((sum, inv) => sum + (inv.investment || 0), 0)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      {/* Main Cap Table Section */}
      <div
        style={{
          backgroundColor: "#fdfcfb",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ color: "#5d4037", margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>Cap Table Overview</h3>
          <div style={{ display: "flex", gap: "10px" }}>
            {!isInvestorView && (
              <button
                onClick={() => setShowEditForm(!showEditForm)}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                {showEditForm ? "Cancel" : "Edit Data"}
              </button>
            )}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#72542b",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
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
                      fontSize: "0.8rem",
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
                      fontSize: "0.8rem",
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
            <h4 style={{ color: "#72542b", marginTop: 0, fontSize: "1rem" }}>Edit Cap Table Data</h4>
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
                    padding: "6px",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                    fontSize: "0.8rem",
                  }}
                  placeholder="Investor Name"
                />
                <input
                  type="number"
                  value={investor.shares}
                  onChange={(e) => updateInvestor(index, "shares", e.target.value)}
                  style={{
                    padding: "6px",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                    fontSize: "0.8rem",
                  }}
                  placeholder="Shares %"
                />
                <input
                  type="number"
                  step="0.1"
                  value={investor.investment || 0}
                  onChange={(e) => updateInvestor(index, "investment", e.target.value)}
                  style={{
                    padding: "6px",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                    fontSize: "0.8rem",
                  }}
                  placeholder="Investment (RM)"
                />
                <button
                  onClick={() => removeInvestor(index)}
                  style={{
                    padding: "6px",
                    backgroundColor: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
              <button
                onClick={addInvestor}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#72542b",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                Add Investor
              </button>
              <button
                onClick={saveCapTableData}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#16a34a",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
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
              padding: "30px",
              color: "#72542b",
              backgroundColor: "#f7f3f0",
              borderRadius: "6px",
            }}
          >
            <p style={{ margin: 0, fontSize: "0.9rem" }}>No investor data available. {!isInvestorView && 'Click "Edit Data" to add your first investor.'}</p>
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
              <h4 style={{ color: "#7d5a50", marginBottom: "15px", fontSize: "1rem" }}>Ownership Structure</h4>
              <div style={{ height: "300px" }}>
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
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: window.innerWidth < 768 ? "bottom" : "right",
                        labels: { font: { size: 11 } }
                      },
                      datalabels: {
                        color: "#fff",
                        font: { weight: "bold", size: 11 },
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
              <h4 style={{ color: "#7d5a50", marginBottom: "15px", fontSize: "1rem" }}>Investor Details</h4>
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
                    fontSize: "0.85rem",
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e6d7c3" }}>
                      <th style={{ padding: "10px", textAlign: "left" }}>Investor</th>
                      <th style={{ padding: "10px", textAlign: "right" }}>Shares (%)</th>
                      <th style={{ padding: "10px", textAlign: "right" }}>Investment (RM)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investors.map((investor, index) => (
                      <tr key={index} style={{ borderBottom: "1px solid #e6d7c3" }}>
                        <td style={{ padding: "10px" }}>{investor.name}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>
                          {totalShares > 0 ? ((investor.shares / totalShares) * 100).toFixed(1) : 0}%
                        </td>
                        <td style={{ padding: "10px", textAlign: "right" }}>R{(investor.investment || 0).toFixed(1)}</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: "2px solid #e6d7c3", fontWeight: "bold" }}>
                      <td style={{ padding: "10px" }}>Total</td>
                      <td style={{ padding: "10px", textAlign: "right" }}>100%</td>
                      <td style={{ padding: "10px", textAlign: "right" }}>R{totalInvestment.toFixed(1)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* IRR on Investments Section */}
      <div
        style={{
          backgroundColor: "#fdfcfb",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ color: "#5d4037", margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>IRR on Equity Investments</h3>
          <div style={{ display: "flex", gap: "10px" }}>
            {!isInvestorView && (
              <button
                onClick={() => setShowIrrEditForm(!showIrrEditForm)}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                {showIrrEditForm ? "Cancel" : "Edit Data"}
              </button>
            )}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowIrrDownloadOptions(!showIrrDownloadOptions)}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#72542b",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                Download
              </button>
              {showIrrDownloadOptions && (
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
                    onClick={() => handleIrrDownload("json")}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "8px 15px",
                      backgroundColor: "transparent",
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      color: "#5d4037",
                      fontSize: "0.8rem",
                    }}
                  >
                    Download JSON
                  </button>
                  <button
                    onClick={() => handleIrrDownload("csv")}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "8px 15px",
                      backgroundColor: "transparent",
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      color: "#5d4037",
                      fontSize: "0.8rem",
                    }}
                  >
                    Download CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {!isInvestorView && showIrrEditForm && (
          <div
            style={{
              backgroundColor: "#f7f3f0",
              padding: "20px",
              borderRadius: "6px",
              marginBottom: "20px",
            }}
          >
            <h4 style={{ color: "#72542b", marginTop: 0, fontSize: "1rem" }}>Edit IRR Investment Data</h4>
            {irrInvestments.map((investment, index) => (
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
                    onChange={(e) => updateIrrInvestment(index, "name", e.target.value)}
                    style={{
                      padding: "6px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                    }}
                    placeholder="Project Name"
                  />
                  <input
                    type="number"
                    value={investment.irr}
                    onChange={(e) => updateIrrInvestment(index, "irr", e.target.value)}
                    style={{
                      padding: "6px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                    }}
                    placeholder="IRR %"
                  />
                  <select
                    value={investment.details.riskRating}
                    onChange={(e) => updateIrrInvestment(index, "details.riskRating", e.target.value)}
                    style={{
                      padding: "6px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                    }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                  <button
                    onClick={() => removeIrrInvestment(index)}
                    style={{
                      padding: "6px",
                      backgroundColor: "#dc2626",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                    }}
                  >
                    Remove
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  <input
                    type="text"
                    value={investment.details.initialInvestment}
                    onChange={(e) => updateIrrInvestment(index, "details.initialInvestment", e.target.value)}
                    style={{
                      padding: "6px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                    }}
                    placeholder="Initial Investment"
                  />
                  <input
                    type="text"
                    value={investment.details.duration}
                    onChange={(e) => updateIrrInvestment(index, "details.duration", e.target.value)}
                    style={{
                      padding: "6px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                    }}
                    placeholder="Duration"
                  />
                  <input
                    type="text"
                    value={investment.details.cashFlows.join(", ")}
                    onChange={(e) => updateIrrInvestment(index, "details.cashFlows", e.target.value)}
                    style={{
                      padding: "6px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                    }}
                    placeholder="Cash Flows (comma separated)"
                  />
                </div>
              </div>
            ))}
            <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
              <button
                onClick={addIrrInvestment}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#72542b",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                Add Investment
              </button>
              <button
                onClick={saveCapTableData}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#16a34a",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                Save Data
              </button>
            </div>
          </div>
        )}

        {irrInvestments.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "30px",
              color: "#72542b",
              backgroundColor: "#f7f3f0",
              borderRadius: "6px",
            }}
          >
            <p style={{ margin: 0, fontSize: "0.9rem" }}>No investment data available. {!isInvestorView && 'Click "Edit Data" to add your first investment.'}</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: window.innerWidth < 768 ? "1fr" : "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
            }}
          >
            {irrInvestments.map((investment, index) => (
              <div
                key={index}
                style={{
                  padding: "15px",
                  backgroundColor: "#f7f3f0",
                  borderRadius: "6px",
                  textAlign: "center",
                }}
              >
                <h4 style={{ color: "#72542b", marginTop: 0, fontSize: "1rem" }}>{investment.name}</h4>
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    backgroundColor: "#e8ddd4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto",
                    border: "6px solid #9c7c5f",
                    marginBottom: "15px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: "#5d4037",
                    }}
                  >
                    {investment.irr}%
                  </span>
                </div>

                <button
                  onClick={() => toggleIrrInvestment(index)}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#5d4037",
                    color: "#fdfcfb",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    marginBottom: "10px",
                    fontSize: "0.8rem",
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
                      fontSize: "0.8rem",
                    }}
                  >
                    <p><strong>Initial Investment:</strong> {investment.details.initialInvestment}</p>
                    <p><strong>Duration:</strong> {investment.details.duration}</p>
                    <p><strong>Risk Rating:</strong> {investment.details.riskRating}</p>
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
    </div>
  )
}

// ==================== BALANCE SHEET TABLE ====================
const BSTable = ({ title, rows, totalLabel, totalValue, openTrend, totalTrendFn }) => (
  <div className="mb-5">
    <h4 className="text-mediumBrown text-base font-semibold mb-2.5 border-b border-[#e8ddd4] pb-1">
      {title}
    </h4>
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-[#e8ddd4]">
          <th className="p-2.5 text-left text-mediumBrown text-xs font-semibold">Item</th>
          <th className="p-2.5 text-right text-mediumBrown text-xs font-semibold">Amount</th>
          <th className="p-2.5 text-center text-mediumBrown text-xs font-semibold w-12">Trend</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ key, label, value, redLabel, arr }) => (
          <tr key={key}>
            <td className="py-2 text-mediumBrown text-xs">{label}</td>
            <td className={`py-2 text-right text-xs font-semibold ${redLabel ? "text-red-700" : "text-mediumBrown"}`}>
              {redLabel ? `(${value})` : value}
            </td>
            <td className="py-2 text-center">
              <TrendButton onClick={() => openTrend(label, arr)} />
            </td>
          </tr>
        ))}
        {totalLabel && (
          <tr className="bg-[#f5f0eb]">
            <td className="py-2.5 text-mediumBrown text-sm font-bold">{totalLabel}</td>
            <td className="py-2.5 text-right text-mediumBrown text-sm font-bold">{totalValue}</td>
            <td className="py-2.5 text-center">
              {totalTrendFn && <TrendButton onClick={totalTrendFn} />}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

// ==================== CAPITAL STRUCTURE COMPONENT ====================
const CapitalStructure = ({ activeSection, user, isInvestorView }) => {
  // ── Sub-tab & modal state ──────────────────────────────────────────────────
  const [activeSubTab, setActiveSubTab]   = useState("balance-sheet");
  const [showModal, setShowModal]         = useState(false);

  // ── Date range filter — drives everything ─────────────────────────────────
  const [filterMode, setFilterMode]   = useState("range");
  const [fromDate, setFromDate]       = useState(_defaultFrom);
  const [toDate, setToDate]           = useState(_defaultTo);
  const [selectedYear, setSelectedYear] = useState(_now.getFullYear());

  // ── Trend / calculation modals ────────────────────────────────────────────
  const [showTrendModal, setShowTrendModal]       = useState(false);
  const [selectedTrendItem, setSelectedTrendItem] = useState(null);
  const [trendData, setTrendData]                 = useState(null);
  const [trendLoading, setTrendLoading]           = useState(false);
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [selectedCalculation, setSelectedCalculation]   = useState({ title: "", calculation: "" });

  // ── Notes ─────────────────────────────────────────────────────────────────
  const [kpiNotes, setKpiNotes]       = useState({});
  const [expandedNotes, setExpandedNotes] = useState({});

  const [currencyUnit] = useState("zar_million");

  // ── Hook ──────────────────────────────────────────────────────────────────
  const {
    balanceSheetData,
    solvencyData,   setSolvencyData,
    leverageData,   setLeverageData,
    equityData,     setEquityData,
    dividendHistory,
    kpiAnalysis,
    loading,
    firstDataMonth,
    loadCapitalStructureData,
    loadDividendHistory,
    loadTrendData,
  } = useCapitalStructureData(user);

  // ── Derived snapshot index — always the last month of the selected range ──
  const { year: snapshotYear, monthIndex: snapshotMonthIndex } = parseYM(toDate);

  const years       = getYearsRange(2021, 2030);
  const formatValue = makeFormatValue(currencyUnit);

  // ── Initial load + reload when toDate changes ─────────────────────────────
  useEffect(() => {
    if (user) {
      loadCapitalStructureData(toDate);
      loadDividendHistory();
    }
  }, [user, toDate]);

  // ── Auto-calculate solvency / leverage / equity from balance sheet ─────────
  useEffect(() => {
    const mi = snapshotMonthIndex;
    if (mi < 0 || mi >= 12) return;

    const totalAssets_     = calcTotalAssets(mi);
    const totalLiabilities_= calcTotalLiabilities(mi);
    const totalEquity_     = calcTotalEquity(mi);
    const ebit_            = totalAssets_      * 0.1;
    const intExp_          = totalLiabilities_ * 0.05;

    const ensure = (obj, key) => {
      if (!Array.isArray(obj[key])) obj[key] = Array(12).fill("0");
    };

    setSolvencyData((prev) => {
      const s = { ...prev };
      ["debtToEquity", "debtToAssets", "equityRatio", "interestCoverage", "nav"].forEach((k) => ensure(s, k));
      s.debtToEquity[mi]      = (totalEquity_     !== 0 ? totalLiabilities_ / totalEquity_     : 0).toFixed(2);
      s.debtToAssets[mi]      = (totalAssets_     !== 0 ? totalLiabilities_ / totalAssets_     : 0).toFixed(2);
      s.equityRatio[mi]       = (totalAssets_     !== 0 ? (totalEquity_  / totalAssets_) * 100 : 0).toFixed(2);
      s.interestCoverage[mi]  = (intExp_          !== 0 ? ebit_ / intExp_ : 0).toFixed(2);
      s.nav[mi]               = ((totalAssets_ - totalLiabilities_) / 1_000_000).toFixed(2);
      return s;
    });

    setLeverageData((prev) => {
      const l = { ...prev };
      ["totalDebtRatio", "longTermDebtRatio", "equityMultiplier"].forEach((k) => ensure(l, k));
      const ltDebt = calculateTotal(balanceSheetData.liabilities.nonCurrentLiabilities, mi);
      l.totalDebtRatio[mi]    = (totalAssets_  !== 0 ? totalLiabilities_ / totalAssets_        : 0).toFixed(2);
      l.longTermDebtRatio[mi] = (totalAssets_  !== 0 ? ltDebt             / totalAssets_        : 0).toFixed(2);
      l.equityMultiplier[mi]  = (totalEquity_  !== 0 ? totalAssets_        / totalEquity_       : 0).toFixed(2);
      return l;
    });

    setEquityData((prev) => {
      const e = { ...prev };
      ensure(e, "equityRatio");
      e.equityRatio[mi] = (totalAssets_ !== 0 ? (totalEquity_ / totalAssets_) * 100 : 0).toFixed(2);
      return e;
    });
  }, [balanceSheetData, toDate]);

  // ── Balance sheet calculation helpers ─────────────────────────────────────
  const calcTotalAssets = (mi) => {
    const { bank, currentAssets, nonCurrentAssets, customCategories } = balanceSheetData.assets;
    const sumObj = (obj) =>
      Object.values(obj || {}).reduce((s, a) => s + (parseFloat(a?.[mi]) || 0), 0);
    let custom = 0;
    (customCategories || []).forEach((c) => {
      if (c?.items)
        Object.values(c.items).forEach((a) => { custom += parseFloat(a?.[mi]) || 0; });
    });
    return (
      sumObj(bank) +
      calculateTotal(currentAssets, mi) +
      calcFixedAssets(mi) +
      calcIntangibles(mi) +
      calculateTotal(nonCurrentAssets, mi) +
      custom
    );
  };

  const calcFixedAssets = (mi) => {
    const fa = balanceSheetData.assets?.fixedAssets;
    if (!fa) return 0;
    const add = ["land","buildings","computerEquipment","vehicles","furniture","machinery","otherPropertyPlantEquipment","assetsUnderConstruction"];
    const sub = ["lessDepreciationBuildings","lessDepreciationComputer","lessDepreciationVehicles","lessDepreciationFurniture","lessDepreciationMachinery","lessDepreciationOther"];
    return (
      add.reduce((s, k) => s + (parseFloat(fa[k]?.[mi]) || 0), 0) -
      sub.reduce((s, k) => s + (parseFloat(fa[k]?.[mi]) || 0), 0)
    );
  };

  const calcIntangibles = (mi) => {
    const ia = balanceSheetData.assets?.intangibleAssets;
    if (!ia) return 0;
    return (
      ["goodwill","trademarks","patents","software","customerLists"].reduce((s, k) => s + (parseFloat(ia[k]?.[mi]) || 0), 0) -
      (parseFloat(ia.lessAmortization?.[mi]) || 0)
    );
  };

  const calcTotalLiabilities = (mi) =>
    calculateTotal(balanceSheetData.liabilities.currentLiabilities, mi) +
    calculateTotal(balanceSheetData.liabilities.nonCurrentLiabilities, mi) +
    (balanceSheetData.customLiabilitiesCategories || []).reduce(
      (s, c) => s + Object.values(c.items || {}).reduce((ss, a) => ss + (parseFloat(a?.[mi]) || 0), 0),
      0,
    );

  const calcTotalEquity = (mi) =>
    calculateTotal(balanceSheetData.equity, mi) -
    (parseFloat(balanceSheetData.equity.treasuryShares?.[mi]) || 0) +
    (balanceSheetData.customEquityCategories || []).reduce(
      (s, c) => s + Object.values(c.items || {}).reduce((ss, a) => ss + (parseFloat(a?.[mi]) || 0), 0),
      0,
    );

  const totalAssets      = calcTotalAssets(snapshotMonthIndex);
  const totalLiabilities = calcTotalLiabilities(snapshotMonthIndex);
  const totalEquity      = calcTotalEquity(snapshotMonthIndex);

  // ── Trend opener — range-aware ─────────────────────────────────────────────
  const openTrend = async (name, fieldPath, isPercentage = false) => {
    setSelectedTrendItem({ name, isPercentage });
    setTrendData(null);
    setTrendLoading(true);
    setShowTrendModal(true);

    try {
      const labels = getRangeLabels(fromDate, toDate);
      const meta   = getRangeMonthsMeta(fromDate, toDate);

      // ── Case 1: raw balance-sheet array (line item) ─────────────────────
      if (Array.isArray(fieldPath)) {
        const years_    = [...new Set(meta.map((m) => m.year))];
        const docCache  = {};

        await Promise.all(
          years_.map(async (yr) => {
            let snap = await getDoc(doc(db, "financialData", `${user.uid}_capitalStructure_${yr}`));
            if (!snap.exists())
              snap = await getDoc(doc(db, "financialData", `${user.uid}_capitalStructure`));
            docCache[yr] = snap.exists() ? snap.data() : null;
          }),
        );

        // Locate the same array by reference in current balanceSheetData
        const findPath = (obj, target, path = []) => {
          for (const k of Object.keys(obj || {})) {
            if (Array.isArray(obj[k])) {
              if (obj[k] === target) return [...path, k];
            } else if (obj[k] && typeof obj[k] === "object") {
              const found = findPath(obj[k], target, [...path, k]);
              if (found) return found;
            }
          }
          return null;
        };

        const keyPath = findPath(balanceSheetData, fieldPath);

        const actual = meta.map(({ year: yr, monthIndex: mi }) => {
          const raw = docCache[yr];
          if (!raw) return null;
          let arr = null;
          if (keyPath) arr = keyPath.reduce((o, k) => o?.[k], raw?.balanceSheetData);
          if (!Array.isArray(arr)) arr = fieldPath;
          const v = arr?.[mi];
          return v !== undefined && v !== "" && v !== null ? parseFloat(v) : null;
        });

        // Smart y-axis scale from fetched values
        const absVals    = actual.filter((v) => v !== null).map(Math.abs);
        const maxAbs     = absVals.length ? Math.max(...absVals) : 0;
        const scaleUnit    = maxAbs >= 1_000_000 ? "R m" : maxAbs >= 1_000 ? "R k" : "R";
        const scaleDivisor = maxAbs >= 1_000_000 ? 1_000_000 : maxAbs >= 1_000 ? 1_000 : 1;

        setSelectedTrendItem({
          name,
          isPercentage,
          trendFormatValue: (v) => formatCurrency(v, "zar", 2),
          yAxisLabel: `Value (${scaleUnit})`,
          yTickFmt:   (v) => (v / scaleDivisor).toFixed(1),
        });
        setTrendData({ labels, actual, budget: null });
        return;
      }

      // ── Case 2: no fieldPath ────────────────────────────────────────────
      if (!fieldPath || typeof fieldPath !== "string") {
        setTrendData({ labels, actual: Array(labels.length).fill(null), budget: null });
        return;
      }

      // ── Case 3: string key — use hook's range-aware loadTrendData ───────
      const DOT_PATH_MAP = {
        "solvencyData.debtToEquity":        "debtToEquity",
        "solvencyData.debtToAssets":        "debtToAssets",
        "solvencyData.equityRatio":         "equityRatio",
        "solvencyData.interestCoverage":    "interestCoverage",
        "solvencyData.debtServiceCoverage": "debtServiceCoverage",
        "solvencyData.nav":                 "nav",
        "leverageData.totalDebtRatio":      "totalDebtRatio",
        "leverageData.longTermDebtRatio":   "longTermDebtRatio",
        "leverageData.equityMultiplier":    "equityMultiplier",
        "equityData.returnOnEquity":        "returnOnEquity",
        "equityData.bookValuePerShare":     "bookValuePerShare",
      };
      const chartKey = DOT_PATH_MAP[fieldPath] ?? fieldPath;

      const { actual } = await loadTrendData(chartKey, fromDate, toDate);

      // Format helpers per key family
      const BS_TOTAL_KEYS = new Set([
        "totalAssets","totalLiabilities","totalEquity",
        "totalBankAndCash","totalCurrentAssets","totalFixedAssets",
        "totalIntangibleAssets","totalNonCurrentAssets",
        "totalCurrentLiabilities","totalNonCurrentLiabilities",
      ]);
      const RATIO_KEYS = new Set([
        "debtToEquity","debtToAssets","interestCoverage",
        "debtServiceCoverage","totalDebtRatio","longTermDebtRatio","equityMultiplier",
      ]);

      const PERCENT_KEYS = new Set(["equityRatio", "returnOnEquity"]);
      const CURRENCY_KPI_KEYS = new Set(["nav", "bookValuePerShare"]);

      let trendFormatValue, yAxisLabel, yTickFmt;
      if (BS_TOTAL_KEYS.has(chartKey)) {
        trendFormatValue = (v) => formatCurrency(v * 1_000_000, "zar", 2);
        yAxisLabel = "Value (R m)";
        yTickFmt   = (v) => parseFloat(v).toFixed(1);
      } else if (RATIO_KEYS.has(chartKey)) {
        trendFormatValue = (v) => parseFloat(v).toFixed(2);
        yAxisLabel = "Ratio (×)";
        yTickFmt   = (v) => parseFloat(v).toFixed(2);
      } else if (PERCENT_KEYS.has(chartKey)) {
        trendFormatValue = (v) => `${parseFloat(v).toFixed(2)}%`;
        yAxisLabel       = "Percentage (%)";
        yTickFmt         = (v) => `${parseFloat(v).toFixed(1)}%`;
      } else if (CURRENCY_KPI_KEYS.has(chartKey)) {
        // Values are already in millions from the hook
        const allVals  = (actual || []).filter((v) => v !== null && !isNaN(v));
        const maxAbs   = allVals.length ? Math.max(...allVals.map(Math.abs)) : 0;
        const scaleUnit    = maxAbs >= 1_000 ? "R bn" : maxAbs >= 1 ? "R m" : "R k";
        const scaleDivisor = maxAbs >= 1_000 ? 1_000  : maxAbs >= 1 ? 1     : 0.001;
        trendFormatValue = (v) => {
          const num = parseFloat(v) || 0;
          const abs = Math.abs(num);
          if (abs >= 1_000) return `R${(num / 1_000).toFixed(2)}bn`;
          if (abs >= 1)     return `R${num.toFixed(2)}m`;
          return `R${(num * 1_000).toFixed(2)}k`;
        };
        yAxisLabel = `Value (${scaleUnit})`;
        yTickFmt   = (v) => (v / scaleDivisor).toFixed(2);
      }

      setSelectedTrendItem({ name, isPercentage, trendFormatValue, yAxisLabel, yTickFmt });
      setTrendData({ labels, actual, budget: null });

    } catch (e) {
      console.error("Trend load error:", e);
      setTrendData({
        labels: getRangeLabels(fromDate, toDate),
        actual: Array(getRangeMonthsMeta(fromDate, toDate).length).fill(null),
        budget: null,
      });
    } finally {
      setTrendLoading(false);
    }
  };

  const openCalc = (title, calculation) => {
    setSelectedCalculation({ title, calculation });
    setShowCalculationModal(true);
  };

  // ── KPI card metadata ─────────────────────────────────────────────────────
  const KPI_META = {
    nav:                 { unitLabel: null, fmt: (v) => formatSmartNumber(v),     isPercentage: false },
    equityRatio:         { unitLabel: "%",  fmt: (v) => parseFloat(v).toFixed(2), isPercentage: true  },
    debtToEquity:        { unitLabel: "×",  fmt: (v) => parseFloat(v).toFixed(2), isPercentage: false },
    debtToAssets:        { unitLabel: "×",  fmt: (v) => parseFloat(v).toFixed(2), isPercentage: false },
    interestCoverage:    { unitLabel: "×",  fmt: (v) => parseFloat(v).toFixed(2), isPercentage: false },
    debtServiceCoverage: { unitLabel: "×",  fmt: (v) => parseFloat(v).toFixed(2), isPercentage: false },
    totalDebtRatio:      { unitLabel: "×",  fmt: (v) => parseFloat(v).toFixed(2), isPercentage: false },
    longTermDebtRatio:   { unitLabel: "×",  fmt: (v) => parseFloat(v).toFixed(2), isPercentage: false },
    equityMultiplier:    { unitLabel: "×",  fmt: (v) => parseFloat(v).toFixed(2), isPercentage: false },
    returnOnEquity:      { unitLabel: "%",  fmt: (v) => parseFloat(v).toFixed(2), isPercentage: true  },
    bookValuePerShare:   { unitLabel: null, fmt: (v) => formatSmartNumber(v),     isPercentage: false },
  };

  // KPI card renderer — reads from snapshot month index
  const renderKPICard = (title, data, kpiKey, _isPercentage = false, fieldPath = null) => {
    const meta         = KPI_META[kpiKey] || {};
    const isPercentage = meta.isPercentage ?? _isPercentage;
    const rawValue     = parseFloat(data?.[snapshotMonthIndex]) || 0;
    const unitLabel    = meta.unitLabel !== undefined
      ? meta.unitLabel ?? getSmartUnit(rawValue)
      : (isPercentage ? "%" : getSmartUnit(rawValue));
    const fmtCircle    = meta.fmt ?? ((v) => parseFloat(v).toFixed(2));

    return (
      <KPICard
        key={kpiKey}
        title={title}
        actualValue={rawValue}
        budgetValue={0}
        unit={currencyUnit}
        isPercentage={isPercentage}
        unitLabel={unitLabel}
        formatCircleValue={fmtCircle}
        onEyeClick={() => {
          const tab = SUB_TABS.find((t) => t.id === activeSubTab);
          openCalc(title, tab?.calculation || "");
        }}
        onAddNotes={(notes) => setKpiNotes((p) => ({ ...p, [kpiKey]: notes }))}
        onAnalysis={() =>
          setExpandedNotes((p) => ({ ...p, [`${kpiKey}_analysis`]: !p[`${kpiKey}_analysis`] }))
        }
        onTrend={() => openTrend(title, fieldPath || kpiKey, isPercentage)}
        notes={kpiNotes[kpiKey]}
        formatValue={formatValue}
      />
    );
  };

  const SUB_TABS = [
    { id: "balance-sheet",  label: "Balance Sheet"  },
    { id: "solvency",  label: "Solvency",  calculation: CALCULATION_TEXTS.capitalStructure?.solvency || "" },
    { id: "leverage",  label: "Leverage",  calculation: CALCULATION_TEXTS.capitalStructure?.leverage || "" },
    { id: "equity",    label: "Equity Structure", calculation: CALCULATION_TEXTS.capitalStructure?.equity || "" },
  ];

  if (activeSection !== "capital-structure") return null;

  // Balance sheet amounts displayed in full rands
  const fv = (v) => formatCurrency(parseFloat(v) || 0, "zar", 2);

  const bsRows = (obj, mi, overrides = {}) =>
    Object.keys(obj).map((key) => ({
      key,
      arr: obj[key],
      label: overrides[key]?.label ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
      value: fv(parseFloat(obj[key]?.[mi]) || 0),
      redLabel: overrides[key]?.red ?? false,
    }));

  // Snapshot label shown next to picker (e.g. "Showing snapshot: Feb 2025")
  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const snapshotLabel = `${MONTH_NAMES[snapshotMonthIndex]} ${snapshotYear}`;

  return (
    <div>
      {/* ── Sub-tab nav ──────────────────────────────────────────────────────── */}
      <div className="flex gap-2.5 mb-5 border-b-2 border-[#e8ddd4] pb-2.5">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2 border-0 rounded-t-md cursor-pointer font-semibold text-sm transition-all ${
              activeSubTab === tab.id
                ? "bg-mediumBrown text-[#fdfcfb]"
                : "bg-transparent text-mediumBrown hover:bg-[#f5f0eb]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Global date range picker + action buttons ───────────────────────── */}
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <DateRangePicker
            filterMode={filterMode}
            setFilterMode={setFilterMode}
            fromDate={fromDate}
            setFromDate={setFromDate}
            toDate={toDate}
            setToDate={setToDate}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            years={years}
            minDate={firstDataMonth ?? "2023-01"}
            maxDate={_defaultTo}
          />
          <span className="text-xs text-lightBrown">Snapshot: {snapshotLabel}</span>
        </div>
        {!isInvestorView && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-mediumBrown text-[#fdfcfb] border-0 rounded cursor-pointer font-semibold text-xs hover:bg-[#4a3027]"
          >
            + Add Data
          </button>
        )}
      </div>

      {/* ===== BALANCE SHEET ===== */}
      {activeSubTab === "balance-sheet" && (
        <div>
          <KeyQuestionBox
            question="Is the business financially solvent and appropriately structured for its current stage?"
            signals="Leverage, balance sheet strength, working capital position"
            decisions="Raise equity vs debt, restructure balance sheet, optimize working capital"
          />

          <div className="grid grid-cols-2 gap-7">
            {/* ASSETS */}
            <div className="bg-[#fdfcfb] p-5 rounded-lg shadow-md">
              <h3 className="text-mediumBrown mb-4 text-lg font-bold">ASSETS</h3>

              <BSTable
                title="Bank & Cash"
                rows={bsRows(balanceSheetData.assets?.bank || {}, snapshotMonthIndex)}
                totalLabel="Total Bank & Cash"
                totalValue={fv(
                  Object.values(balanceSheetData.assets?.bank || {}).reduce(
                    (s, a) => s + (parseFloat(a?.[snapshotMonthIndex]) || 0), 0,
                  ),
                )}
                openTrend={(l, a) => openTrend(l, a)}
                totalTrendFn={() => openTrend("Total Bank & Cash", "totalBankAndCash")}
              />

              <BSTable
                title="Current Assets"
                rows={bsRows(balanceSheetData.assets?.currentAssets || {}, snapshotMonthIndex)}
                totalLabel="Total Current Assets"
                totalValue={fv(calculateTotal(balanceSheetData.assets?.currentAssets || {}, snapshotMonthIndex))}
                openTrend={openTrend}
                totalTrendFn={() => openTrend("Total Current Assets", "totalCurrentAssets")}
              />

              <BSTable
                title="Fixed Assets (Net)"
                rows={[
                  {
                    key: "land", label: "Land",
                    value: fv(parseFloat(balanceSheetData.assets?.fixedAssets?.land?.[snapshotMonthIndex]) || 0),
                    arr: balanceSheetData.assets?.fixedAssets?.land,
                  },
                  {
                    key: "buildings", label: "Buildings (Net)",
                    value: fv(
                      (parseFloat(balanceSheetData.assets?.fixedAssets?.buildings?.[snapshotMonthIndex]) || 0) -
                      (parseFloat(balanceSheetData.assets?.fixedAssets?.lessDepreciationBuildings?.[snapshotMonthIndex]) || 0)
                    ),
                    arr: balanceSheetData.assets?.fixedAssets?.buildings,
                  },
                  {
                    key: "computer", label: "Computer Equipment (Net)",
                    value: fv(
                      (parseFloat(balanceSheetData.assets?.fixedAssets?.computerEquipment?.[snapshotMonthIndex]) || 0) -
                      (parseFloat(balanceSheetData.assets?.fixedAssets?.lessDepreciationComputer?.[snapshotMonthIndex]) || 0)
                    ),
                    arr: balanceSheetData.assets?.fixedAssets?.computerEquipment,
                  },
                  {
                    key: "vehicles", label: "Vehicles (Net)",
                    value: fv(
                      (parseFloat(balanceSheetData.assets?.fixedAssets?.vehicles?.[snapshotMonthIndex]) || 0) -
                      (parseFloat(balanceSheetData.assets?.fixedAssets?.lessDepreciationVehicles?.[snapshotMonthIndex]) || 0)
                    ),
                    arr: balanceSheetData.assets?.fixedAssets?.vehicles,
                  },
                  {
                    key: "furniture", label: "Furniture (Net)",
                    value: fv(
                      (parseFloat(balanceSheetData.assets?.fixedAssets?.furniture?.[snapshotMonthIndex]) || 0) -
                      (parseFloat(balanceSheetData.assets?.fixedAssets?.lessDepreciationFurniture?.[snapshotMonthIndex]) || 0)
                    ),
                    arr: balanceSheetData.assets?.fixedAssets?.furniture,
                  },
                  {
                    key: "machinery", label: "Machinery (Net)",
                    value: fv(
                      (parseFloat(balanceSheetData.assets?.fixedAssets?.machinery?.[snapshotMonthIndex]) || 0) -
                      (parseFloat(balanceSheetData.assets?.fixedAssets?.lessDepreciationMachinery?.[snapshotMonthIndex]) || 0)
                    ),
                    arr: balanceSheetData.assets?.fixedAssets?.machinery,
                  },
                  {
                    key: "ppe", label: "Other PPE (Net)",
                    value: fv(
                      (parseFloat(balanceSheetData.assets?.fixedAssets?.otherPropertyPlantEquipment?.[snapshotMonthIndex]) || 0) -
                      (parseFloat(balanceSheetData.assets?.fixedAssets?.lessDepreciationOther?.[snapshotMonthIndex]) || 0)
                    ),
                    arr: balanceSheetData.assets?.fixedAssets?.otherPropertyPlantEquipment,
                  },
                  {
                    key: "auc", label: "Assets Under Construction",
                    value: fv(parseFloat(balanceSheetData.assets?.fixedAssets?.assetsUnderConstruction?.[snapshotMonthIndex]) || 0),
                    arr: balanceSheetData.assets?.fixedAssets?.assetsUnderConstruction,
                  },
                ]}
                totalLabel="Total Fixed Assets"
                totalValue={fv(calcFixedAssets(snapshotMonthIndex))}
                openTrend={openTrend}
                totalTrendFn={() => openTrend("Total Fixed Assets", "totalFixedAssets")}
              />

              <BSTable
                title="Intangible Assets"
                rows={Object.keys(balanceSheetData.assets?.intangibleAssets || {}).map((key) => ({
                  key,
                  arr: balanceSheetData.assets.intangibleAssets[key],
                  label: key === "lessAmortization"
                    ? "Less: Accumulated Amortization"
                    : key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
                  value: fv(parseFloat(balanceSheetData.assets.intangibleAssets[key]?.[snapshotMonthIndex]) || 0),
                  redLabel: key === "lessAmortization",
                }))}
                totalLabel="Total Intangible Assets"
                totalValue={fv(calcIntangibles(snapshotMonthIndex))}
                openTrend={openTrend}
                totalTrendFn={() => openTrend("Total Intangible Assets", "totalIntangibleAssets")}
              />

              <BSTable
                title="Non-Current Assets"
                rows={bsRows(balanceSheetData.assets?.nonCurrentAssets || {}, snapshotMonthIndex)}
                totalLabel="Total Non-Current Assets"
                totalValue={fv(calculateTotal(balanceSheetData.assets?.nonCurrentAssets || {}, snapshotMonthIndex))}
                openTrend={openTrend}
                totalTrendFn={() => openTrend("Total Non-Current Assets", "totalNonCurrentAssets")}
              />

              {(balanceSheetData.assets?.customCategories || []).map((custom, i) => (
                <BSTable
                  key={i}
                  title={custom?.category || "Custom"}
                  rows={Object.keys(custom?.items || {}).map((k) => ({
                    key: k, label: k,
                    value: fv(parseFloat(custom.items[k]?.[snapshotMonthIndex]) || 0),
                    arr: custom.items[k],
                  }))}
                  totalLabel={`Total ${custom?.category}`}
                  totalValue={fv(
                    Object.values(custom?.items || {}).reduce(
                      (s, a) => s + (parseFloat(a?.[snapshotMonthIndex]) || 0), 0,
                    ),
                  )}
                  openTrend={openTrend}
                />
              ))}

              <div className="mt-5 p-4 bg-mediumBrown rounded-md flex justify-between items-center">
                <span className="text-[#fdfcfb] text-base font-bold">TOTAL ASSETS</span>
                <span className="text-[#fdfcfb] text-lg font-bold">{fv(totalAssets)}</span>
              </div>
            </div>

            {/* LIABILITIES & EQUITY */}
            <div className="bg-[#fdfcfb] p-5 rounded-lg shadow-md">
              <h3 className="text-mediumBrown mb-4 text-lg font-bold">LIABILITIES & EQUITY</h3>

              <BSTable
                title="Current Liabilities"
                rows={bsRows(balanceSheetData.liabilities?.currentLiabilities || {}, snapshotMonthIndex)}
                totalLabel="Total Current Liabilities"
                totalValue={fv(calculateTotal(balanceSheetData.liabilities?.currentLiabilities || {}, snapshotMonthIndex))}
                openTrend={openTrend}
                totalTrendFn={() => openTrend("Total Current Liabilities", "totalCurrentLiabilities")}
              />

              <BSTable
                title="Non-Current Liabilities"
                rows={bsRows(balanceSheetData.liabilities?.nonCurrentLiabilities || {}, snapshotMonthIndex)}
                totalLabel="Total Non-Current Liabilities"
                totalValue={fv(calculateTotal(balanceSheetData.liabilities?.nonCurrentLiabilities || {}, snapshotMonthIndex))}
                openTrend={openTrend}
                totalTrendFn={() => openTrend("Total Non-Current Liabilities", "totalNonCurrentLiabilities")}
              />

              <div className="mb-5 p-4 bg-[#8d6e63] rounded-md flex justify-between items-center">
                <span className="text-[#fdfcfb] text-base font-bold">TOTAL LIABILITIES</span>
                <span className="text-[#fdfcfb] text-lg font-bold">{fv(totalLiabilities)}</span>
              </div>

              <BSTable
                title="Equity"
                rows={Object.keys(balanceSheetData.equity || {}).map((key) => ({
                  key,
                  arr: balanceSheetData.equity[key],
                  label: key === "treasuryShares"
                    ? "Less: Treasury Shares"
                    : key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
                  value: fv(parseFloat(balanceSheetData.equity[key]?.[snapshotMonthIndex]) || 0),
                  redLabel: key === "treasuryShares",
                }))}
                totalLabel="Total Equity"
                totalValue={fv(totalEquity)}
                openTrend={openTrend}
                totalTrendFn={() => openTrend("Total Equity", "totalEquity")}
              />

              <div className="mt-5 p-4 bg-mediumBrown rounded-md flex justify-between items-center">
                <span className="text-[#fdfcfb] text-base font-bold">TOTAL LIABILITIES & EQUITY</span>
                <span className="text-[#fdfcfb] text-lg font-bold">{fv(totalLiabilities + totalEquity)}</span>
              </div>
            </div>
          </div>

          {/* Additional Metrics */}
          {balanceSheetData?.assets?.additionalMetrics && (
            <div className="mt-7 p-5 bg-[#fdfcfb] rounded-lg shadow-md">
              <h4 className="text-mediumBrown mb-4 text-base font-semibold">Additional Business Metrics</h4>
              <div className="grid grid-cols-4 gap-5">
                {Object.keys(balanceSheetData.assets.additionalMetrics).map((key) => (
                  <div key={key}>
                    <div className="text-xs text-lightBrown mb-1">
                      {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                    </div>
                    <div className="text-base font-semibold text-mediumBrown">
                      {fv(parseFloat(balanceSheetData.assets.additionalMetrics[key]?.[snapshotMonthIndex] || 0))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== SOLVENCY ===== */}
      {activeSubTab === "solvency" && (
        <div>
          <KeyQuestionBox
            question="Can the business meet its long-term financial obligations? Is the business financially stable?"
            signals="Net asset value, equity ratio"
            decisions="Manage debt levels, improve asset base, consider equity financing"
          />
          <div className="grid grid-cols-2 gap-5">
            {renderKPICard("Net Asset Value", solvencyData.nav,       "nav",        false, "solvencyData.nav")}
            {renderKPICard("Equity Ratio",    solvencyData.equityRatio, "equityRatio", true, "solvencyData.equityRatio")}
          </div>
        </div>
      )}

      {/* ===== LEVERAGE ===== */}
      {activeSubTab === "leverage" && (
        <div>
          <KeyQuestionBox
            question="How effectively is the business using debt to finance its operations?"
            signals="Debt-to-asset ratio, debt-to-equity ratio"
            decisions="Optimize capital structure, manage risk, refinance high-cost debt"
          />
          <div className="grid grid-cols-2 gap-5">
            {renderKPICard("Debt to Assets", solvencyData.debtToAssets, "debtToAssets", false, "solvencyData.debtToAssets")}
            {renderKPICard("Debt to Equity", solvencyData.debtToEquity, "debtToEquity", false, "solvencyData.debtToEquity")}
          </div>
        </div>
      )}

      {/* ===== EQUITY STRUCTURE — with Dividend History, Cap Table, and IRR ===== */}
      {activeSubTab === "equity" && (
        <div>
          <KeyQuestionBox
            question="How is equity being distributed and retained? What is the dividend policy?"
            signals="Dividend yield, payout ratio, capital retention"
            decisions="Balance dividends vs reinvestment, optimize equity structure"
          />

          {/* Integrated Dividend History Component */}
          <DividendHistory 
            currentUser={user} 
            isInvestorView={isInvestorView} 
          />

          {/* Cap Table Overview with IRR Investments */}
          <CapTableOverview 
            currentUser={user} 
            isInvestorView={isInvestorView} 
          />
        </div>
      )}

      {/* ===== MODALS ===== */}
      <UniversalAddDataModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentTab="capital-structure"
        user={user}
        onSave={() => loadCapitalStructureData(toDate)}
        loading={loading}
        fromDate={fromDate}
        toDate={toDate}
      />

      <CalculationModal
        isOpen={showCalculationModal}
        onClose={() => setShowCalculationModal(false)}
        title={selectedCalculation.title}
        calculation={selectedCalculation.calculation}
      />

      {showTrendModal && (
        <TrendModal
          isOpen={showTrendModal}
          onClose={() => { setShowTrendModal(false); setTrendData(null); }}
          item={selectedTrendItem}
          trendData={trendData}
          currencyUnit={currencyUnit}
          formatValue={formatValue}
          activeSection="capital-structure"
          loading={trendLoading}
        />
      )}
    </div>
  );
};

export default CapitalStructure;