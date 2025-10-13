"use client"

import { useState, useEffect } from "react"
import { Bar, Line } from "react-chartjs-2"
import Sidebar from "smses/Sidebar/Sidebar"
import Header from "../DashboardHeader/DashboardHeader"
import { db, auth } from "../../firebaseConfig"
import { collection, addDoc, getDocs, updateDoc, doc, getDoc,query, where, setDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend)

// Balance Sheet Component - Now Primary
const BalanceSheet = ({ activeSection, onUpdateBalanceSheet, balanceSheetData, currentMonth, onMonthChange, user }) => {
  const [showModal, setShowModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [balanceSheetDetails, setBalanceSheetDetails] = useState({
    // Assets
    cash: "",
    inventory: "",
    prepaidExpenses: "",
    accountsReceivable: "",
    deposits: "",
    propertyPlantEquipment: "",
    intangibleAssets: "",
    accumulatedDepreciation: "",
    // Liabilities
    accountsPayable: "",
    currentBorrowing: "",
    nonCurrentLiabilities: "",
    longTermLiabilities: "",
    // Equity
    ownersEquity: "",
    // P&L Related Data for Charts
    sales: "",
    cogs: "",
    opex: "",
    month: currentMonth,
    notes: "",
  })

  if (activeSection !== "balance-sheet") return null

  // Get current month data or use empty values
  const currentData = balanceSheetData?.[currentMonth] || {}

  // Calculate totals
  const cash = Number.parseFloat(currentData.cash) || 0
  const inventory = Number.parseFloat(currentData.inventory) || 0
  const prepaidExpenses = Number.parseFloat(currentData.prepaidExpenses) || 0
  const accountsReceivable = Number.parseFloat(currentData.accountsReceivable) || 0
  const deposits = Number.parseFloat(currentData.deposits) || 0
  const propertyPlantEquipment = Number.parseFloat(currentData.propertyPlantEquipment) || 0
  const intangibleAssets = Number.parseFloat(currentData.intangibleAssets) || 0
  const accumulatedDepreciation = Number.parseFloat(currentData.accumulatedDepreciation) || 0

  const accountsPayable = Number.parseFloat(currentData.accountsPayable) || 0
  const currentBorrowing = Number.parseFloat(currentData.currentBorrowing) || 0
  const nonCurrentLiabilities = Number.parseFloat(currentData.nonCurrentLiabilities) || 0
  const longTermLiabilities = Number.parseFloat(currentData.longTermLiabilities) || 0
  const ownersEquity = Number.parseFloat(currentData.ownersEquity) || 0

  // Calculations
  const totalCurrentAssets = cash + inventory + prepaidExpenses + accountsReceivable
  const totalNonCurrentAssets = propertyPlantEquipment + intangibleAssets - accumulatedDepreciation
  const totalAssets = totalCurrentAssets + deposits + totalNonCurrentAssets

  const totalCurrentLiabilities = accountsPayable + currentBorrowing
  const totalNonCurrentLiabilities = nonCurrentLiabilities
  const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities + longTermLiabilities
  const totalLiabilitiesAndCapital = totalLiabilities + ownersEquity

  const handleDownloadBalanceSheet = () => {
    const csvContent = `Balance Sheet - ${currentMonth}
Assets,Amount
Current Assets,
Cash,${cash}
Inventory,${inventory}
Prepaid Expenses,${prepaidExpenses}
Accounts Receivable,${accountsReceivable}
Total Current Assets,${totalCurrentAssets}

Deposits,${deposits}

Non-Current Assets,
Property Plant & Equipment,${propertyPlantEquipment}
Intangible Assets,${intangibleAssets}
Accumulated Depreciation,${accumulatedDepreciation}
Total Non-Current Assets,${totalNonCurrentAssets}

Total Assets,${totalAssets}

Liabilities and Equity,
Current Liabilities,
Accounts Payable,${accountsPayable}
Current Borrowing,${currentBorrowing}
Total Current Liabilities,${totalCurrentLiabilities}

Non-Current Liabilities,${nonCurrentLiabilities}
Long-term Liabilities,${longTermLiabilities}
Total Liabilities,${totalLiabilities}

Owners Equity,${ownersEquity}
Total Liabilities and Capital,${totalLiabilitiesAndCapital}`

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `balance_sheet_${currentMonth}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleAddDetails = () => {
    setShowModal(true)
    // Pre-fill with current data if available
    setBalanceSheetDetails({
      ...currentData,
      month: currentMonth,
      notes: balanceSheetData?.[currentMonth]?.notes || "",
    })
  }

  const handleSaveDetails = async () => {
    const updatedData = {
      ...balanceSheetData,
      [currentMonth]: {
        ...balanceSheetDetails,
        month: currentMonth,
      }
    }
    onUpdateBalanceSheet(updatedData)

    // Save to Firebase if user is logged in
    if (user) {
      try {
        await setDoc(doc(db, "financialData", `${user.uid}_balanceSheet`), {
          userId: user.uid,
          chartName: "balanceSheet",
          data: updatedData,
          lastUpdated: new Date().toISOString()
        })
        console.log("Balance sheet data saved to Firebase")
      } catch (error) {
        console.error("Error saving balance sheet data:", error)
      }
    }

    setShowModal(false)
  }

  // CSV Upload Handler
  const handleCSVUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const csvText = e.target.result
      parseCSVData(csvText)
    }
    reader.readAsText(file)
    setShowUploadModal(false)
  }

  // Parse CSV data and extract balance sheet values
  const parseCSVData = (csvText) => {
    const lines = csvText.split('\n')
    const extractedData = {}

    lines.forEach(line => {
      const [key, value] = line.split(',').map(item => item.trim())
      if (!key) return // Skip empty lines

      // Map CSV headers to our data structure
      const normalizedKey = key.toLowerCase().trim()

      switch (normalizedKey) {
        // Assets
        case 'cash':
          extractedData.cash = value || "0"
          break
        case 'inventory':
          extractedData.inventory = value || "0"
          break
        case 'prepaid expenses':
          extractedData.prepaidExpenses = value || "0"
          break
        case 'accounts receivable':
          extractedData.accountsReceivable = value || "0"
          break
        case 'deposits':
          extractedData.deposits = value || "0"
          break
        case 'property plant & equipment':
        case 'property plant and equipment':
        case 'property, plant & equipment':
          extractedData.propertyPlantEquipment = value || "0"
          break
        case 'intangible assets':
          extractedData.intangibleAssets = value || "0"
          break
        case 'accumulated depreciation':
          extractedData.accumulatedDepreciation = value || "0"
          break

        // Liabilities & Equity
        case 'accounts payable':
          extractedData.accountsPayable = value || "0"
          break
        case 'current borrowing':
          extractedData.currentBorrowing = value || "0"
          break
        case 'non-current liabilities':
          extractedData.nonCurrentLiabilities = value || "0"
          break
        case 'long-term liabilities':
          extractedData.longTermLiabilities = value || "0"
          break
        case 'owners equity':
          extractedData.ownersEquity = value || "0"
          break

        // P&L Data - Enhanced parsing
        case 'sales':
        case 'sales revenue':
        case 'revenue':
        case 'income':
          extractedData.sales = value || "0"
          break
        case 'cogs':
        case 'cost of goods sold':
        case 'cost of sales':
          extractedData.cogs = value || "0"
          break
        case 'opex':
        case 'operating expenses':
        case 'expenses':
        case 'operating costs':
          extractedData.opex = value || "0"
          break
        case 'gross profit':
        case 'grossprofit':
          extractedData.grossProfit = value || "0"
          break
        case 'net profit':
        case 'netprofit':
        case 'net income':
          extractedData.netProfit = value || "0"
          break
        default:
          // Skip unrecognized headers
          break
      }
    })

    // Update the balance sheet details with extracted data
    setBalanceSheetDetails(prev => ({
      ...prev,
      ...extractedData,
      month: currentMonth
    }))

    // Auto-save the imported data
    const updatedData = {
      ...balanceSheetData,
      [currentMonth]: {
        ...extractedData,
        month: currentMonth
      }
    }

    onUpdateBalanceSheet(updatedData)

    // Auto-close the modal after import
    setShowModal(false)
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
      {/* Month Selector and Action Buttons */}
      <div
        style={{
          display: "flex",
          gap: "15px",
          marginBottom: "20px",
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div>
          <label
            style={{
              marginRight: "8px",
              color: "#5d4037",
              fontWeight: "500",
            }}
          >
            Select Month:
          </label>
          <select
            value={currentMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            style={{
              padding: "8px",
              border: "2px solid #e8ddd4",
              borderRadius: "4px",
              backgroundColor: "#fdfcfb",
              color: "#5d4037",
              fontWeight: "500",
            }}
          >
            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleDownloadBalanceSheet}
          style={{
            padding: "12px 24px",
            backgroundColor: "#8b6914",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
          }}
        >
          📥 Download {currentMonth} Balance Sheet
        </button>

        <button
          onClick={() => setShowUploadModal(true)}
          style={{
            padding: "12px 24px",
            backgroundColor: "#5d4037",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
          }}
        >
          📁 Upload CSV
        </button>

        <button
          onClick={handleAddDetails}
          style={{
            padding: "12px 24px",
            backgroundColor: "#9c7c5f",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
          }}
        >
          ➕ Add/Edit Details
        </button>
      </div>

      {/* Balance Sheet Display */}
      <div
        style={{
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "8px",
          border: "2px solid #5d4037",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            backgroundColor: "#b89f8d",
            color: "white",
            padding: "10px",
            textAlign: "right",
            fontWeight: "bold",
            fontSize: "18px",
            marginBottom: "20px",
          }}
        >
          {currentMonth} - Year 0
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {/* Assets Section */}
            <tr>
              <td style={{ fontWeight: "bold", fontSize: "18px", padding: "10px 0", borderBottom: "1px solid #ddd" }}>
                Assets
              </td>
              <td></td>
            </tr>

            <tr>
              <td style={{ fontWeight: "bold", fontSize: "16px", padding: "8px 0" }}>Current Assets</td>
              <td></td>
            </tr>

            <tr>
              <td style={{ paddingLeft: "20px", padding: "5px 0" }}>Cash</td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>{cash ? cash.toLocaleString() : "-"}</td>
            </tr>

            <tr>
              <td style={{ paddingLeft: "20px", padding: "5px 0" }}>Inventory</td>
              <td style={{ textAlign: "right" }}>{inventory ? inventory.toLocaleString() : "-"}</td>
            </tr>

            <tr>
              <td style={{ paddingLeft: "20px", padding: "5px 0" }}>Prepaid Expenses</td>
              <td style={{ textAlign: "right" }}>{prepaidExpenses ? prepaidExpenses.toLocaleString() : "-"}</td>
            </tr>

            <tr>
              <td style={{ paddingLeft: "20px", padding: "5px 0" }}>Accounts Receivable</td>
              <td style={{ textAlign: "right" }}>
                {accountsReceivable ? accountsReceivable.toLocaleString() : "-"}
              </td>
            </tr>

            <tr style={{ borderBottom: "1px solid #000" }}>
              <td style={{ fontWeight: "bold", padding: "8px 0" }}>Total Current Assets</td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>{totalCurrentAssets ? totalCurrentAssets.toLocaleString() : "-"}</td>
            </tr>

            <tr style={{ borderBottom: "1px solid #000" }}>
              <td style={{ fontWeight: "bold", padding: "15px 0" }}>Deposits</td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>{deposits ? deposits.toLocaleString() : "-"}</td>
            </tr>

            <tr>
              <td style={{ fontWeight: "bold", fontSize: "16px", padding: "15px 0 8px 0" }}>Non-Current Assets</td>
              <td></td>
            </tr>

            <tr>
              <td style={{ paddingLeft: "20px", padding: "5px 0" }}>Property, Plant & Equipment</td>
              <td style={{ textAlign: "right" }}>{propertyPlantEquipment ? propertyPlantEquipment.toLocaleString() : "-"}</td>
            </tr>

            <tr>
              <td style={{ paddingLeft: "20px", padding: "5px 0" }}>Intangible Assets</td>
              <td style={{ textAlign: "right" }}>{intangibleAssets ? intangibleAssets.toLocaleString() : "-"}</td>
            </tr>

            <tr>
              <td style={{ paddingLeft: "20px", padding: "5px 0" }}>Accumulated Depreciation</td>
              <td style={{ textAlign: "right" }}>
                {accumulatedDepreciation ? `(${accumulatedDepreciation.toLocaleString()})` : "-"}
              </td>
            </tr>

            <tr style={{ borderBottom: "1px solid #000" }}>
              <td style={{ fontWeight: "bold", padding: "8px 0" }}>Total Non-Current Assets</td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>
                {totalNonCurrentAssets ? totalNonCurrentAssets.toLocaleString() : "-"}
              </td>
            </tr>

            <tr style={{ borderBottom: "3px solid #000" }}>
              <td style={{ fontWeight: "bold", fontSize: "16px", padding: "15px 0" }}>Total Assets</td>
              <td style={{ textAlign: "right", fontWeight: "bold", fontSize: "16px" }}>
                {totalAssets ? totalAssets.toLocaleString() : "-"}
              </td>
            </tr>

            {/* Liabilities and Equity Section */}
            <tr>
              <td style={{ fontWeight: "bold", fontSize: "18px", padding: "20px 0 10px 0" }}>Liabilities and Equity</td>
              <td></td>
            </tr>

            <tr>
              <td style={{ fontWeight: "bold", fontSize: "16px", padding: "8px 0" }}>Current Liabilities</td>
              <td></td>
            </tr>

            <tr>
              <td style={{ paddingLeft: "20px", padding: "5px 0" }}>Accounts Payable</td>
              <td style={{ textAlign: "right" }}>{accountsPayable ? accountsPayable.toLocaleString() : "-"}</td>
            </tr>

            <tr>
              <td style={{ paddingLeft: "20px", padding: "5px 0" }}>Current Borrowing</td>
              <td style={{ textAlign: "right" }}>{currentBorrowing ? currentBorrowing.toLocaleString() : "-"}</td>
            </tr>

            <tr style={{ borderBottom: "1px solid #000" }}>
              <td style={{ fontWeight: "bold", padding: "8px 0" }}>Total Current Liabilities</td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>{totalCurrentLiabilities ? totalCurrentLiabilities.toLocaleString() : "-"}</td>
            </tr>

            <tr>
              <td style={{ fontWeight: "bold", fontSize: "16px", padding: "15px 0 8px 0" }}>Non-Current Liabilities</td>
              <td></td>
            </tr>

            <tr>
              <td style={{ paddingLeft: "20px", padding: "5px 0" }}>Non-current Liabilities</td>
              <td style={{ textAlign: "right" }}>
                {nonCurrentLiabilities ? nonCurrentLiabilities.toLocaleString() : "-"}
              </td>
            </tr>

            <tr style={{ borderBottom: "1px solid #000" }}>
              <td style={{ fontWeight: "bold", padding: "8px 0" }}>Total Non-Current Liabilities</td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>
                {totalNonCurrentLiabilities ? totalNonCurrentLiabilities.toLocaleString() : "-"}
              </td>
            </tr>

            <tr style={{ borderBottom: "1px solid #000" }}>
              <td style={{ fontWeight: "bold", padding: "8px 0" }}>Long-term Liabilities</td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>{longTermLiabilities ? longTermLiabilities : "-"}</td>
            </tr>

            <tr style={{ borderBottom: "1px solid #000" }}>
              <td style={{ fontWeight: "bold", padding: "8px 0" }}>Total Liabilities</td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>{totalLiabilities ? totalLiabilities.toLocaleString() : "-"}</td>
            </tr>

            <tr style={{ borderBottom: "1px solid #000" }}>
              <td style={{ fontWeight: "bold", padding: "15px 0" }}>Owners Equity</td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>{ownersEquity ? ownersEquity.toLocaleString() : "-"}</td>
            </tr>

            <tr style={{ borderBottom: "3px solid #000" }}>
              <td style={{ fontWeight: "bold", fontSize: "16px", padding: "8px 0" }}>Total Liabilities and Capital</td>
              <td style={{ textAlign: "right", fontWeight: "bold", fontSize: "16px" }}>
                {totalLiabilitiesAndCapital ? totalLiabilitiesAndCapital.toLocaleString() : "-"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Modal for adding/editing details */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              width: "900px",
              maxWidth: "90vw",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "20px" }}>Balance Sheet Details - {currentMonth}</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
              {/* Assets Column */}
              <div>
                <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>Assets</h4>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "500" }}>
                    Cash:
                  </label>
                  <input
                    type="number"
                    value={balanceSheetDetails.cash}
                    onChange={(e) => setBalanceSheetDetails((prev) => ({ ...prev, cash: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "2px solid #e8ddd4",
                      borderRadius: "4px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "500" }}>
                    Inventory:
                  </label>
                  <input
                    type="number"
                    value={balanceSheetDetails.inventory}
                    onChange={(e) => setBalanceSheetDetails((prev) => ({ ...prev, inventory: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "2px solid #e8ddd4",
                      borderRadius: "4px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "500" }}>
                    Prepaid Expenses:
                  </label>
                  <input
                    type="number"
                    value={balanceSheetDetails.prepaidExpenses}
                    onChange={(e) => setBalanceSheetDetails((prev) => ({ ...prev, prepaidExpenses: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "2px solid #e8ddd4",
                      borderRadius: "4px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "500" }}>
                    Accounts Receivable:
                  </label>
                  <input
                    type="number"
                    value={balanceSheetDetails.accountsReceivable}
                    onChange={(e) =>
                      setBalanceSheetDetails((prev) => ({ ...prev, accountsReceivable: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "2px solid #e8ddd4",
                      borderRadius: "4px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "500" }}>
                    Deposits:
                  </label>
                  <input
                    type="number"
                    value={balanceSheetDetails.deposits}
                    onChange={(e) => setBalanceSheetDetails((prev) => ({ ...prev, deposits: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "2px solid #e8ddd4",
                      borderRadius: "4px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "500" }}>
                    Property, Plant & Equipment:
                  </label>
                  <input
                    type="number"
                    value={balanceSheetDetails.propertyPlantEquipment}
                    onChange={(e) =>
                      setBalanceSheetDetails((prev) => ({ ...prev, propertyPlantEquipment: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "2px solid #e8ddd4",
                      borderRadius: "4px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "500" }}>
                    Intangible Assets:
                  </label>
                  <input
                    type="number"
                    value={balanceSheetDetails.intangibleAssets}
                    onChange={(e) => setBalanceSheetDetails((prev) => ({ ...prev, intangibleAssets: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "2px solid #e8ddd4",
                      borderRadius: "4px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "500" }}>
                    Accumulated Depreciation:
                  </label>
                  <input
                    type="number"
                    value={balanceSheetDetails.accumulatedDepreciation}
                    onChange={(e) =>
                      setBalanceSheetDetails((prev) => ({ ...prev, accumulatedDepreciation: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "2px solid #e8ddd4",
                      borderRadius: "4px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Liabilities Column */}
              <div>
                <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>Liabilities & Equity</h4>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "500" }}>
                    Accounts Payable:
                  </label>
                  <input
                    type="number"
                    value={balanceSheetDetails.accountsPayable}
                    onChange={(e) => setBalanceSheetDetails((prev) => ({ ...prev, accountsPayable: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "2px solid #e8ddd4",
                      borderRadius: "4px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "500" }}>
                    Current Borrowing:
                  </label>
                  <input
                    type="number"
                    value={balanceSheetDetails.currentBorrowing}
                    onChange={(e) => setBalanceSheetDetails((prev) => ({ ...prev, currentBorrowing: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "2px solid #e8ddd4",
                      borderRadius: "4px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "500" }}>
                    Non-Current Liabilities:
                  </label>
                  <input
                    type="number"
                    value={balanceSheetDetails.nonCurrentLiabilities}
                    onChange={(e) =>
                      setBalanceSheetDetails((prev) => ({ ...prev, nonCurrentLiabilities: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "2px solid #e8ddd4",
                      borderRadius: "4px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "500" }}>
                    Long-term Liabilities:
                  </label>
                  <input
                    type="number"
                    value={balanceSheetDetails.longTermLiabilities}
                    onChange={(e) =>
                      setBalanceSheetDetails((prev) => ({ ...prev, longTermLiabilities: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "2px solid #e8ddd4",
                      borderRadius: "4px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "500" }}>
                    Owners Equity:
                  </label>
                  <input
                    type="number"
                    value={balanceSheetDetails.ownersEquity}
                    onChange={(e) => setBalanceSheetDetails((prev) => ({ ...prev, ownersEquity: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "2px solid #e8ddd4",
                      borderRadius: "4px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "500" }}>
                    Notes:
                  </label>
                  <textarea
                    value={balanceSheetDetails.notes}
                    onChange={(e) => setBalanceSheetDetails((prev) => ({ ...prev, notes: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "2px solid #e8ddd4",
                      borderRadius: "4px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                      minHeight: "60px",
                    }}
                  />
                </div>
              </div>

              {/* P&L Data Column */}
              <div>
                <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>P&L Data for Charts</h4>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "500" }}>
                    Sales Revenue:
                  </label>
                  <input
                    type="number"
                    value={balanceSheetDetails.sales}
                    onChange={(e) => setBalanceSheetDetails((prev) => ({ ...prev, sales: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "2px solid #e8ddd4",
                      borderRadius: "4px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "500" }}>
                    Cost of Goods Sold (COGS):
                  </label>
                  <input
                    type="number"
                    value={balanceSheetDetails.cogs}
                    onChange={(e) => setBalanceSheetDetails((prev) => ({ ...prev, cogs: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "2px solid #e8ddd4",
                      borderRadius: "4px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", color: "#5d4037", fontWeight: "500" }}>
                    Operating Expenses (OPEX):
                  </label>
                  <input
                    type="number"
                    value={balanceSheetDetails.opex}
                    onChange={(e) => setBalanceSheetDetails((prev) => ({ ...prev, opex: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "2px solid #e8ddd4",
                      borderRadius: "4px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div
                  style={{
                    backgroundColor: "#f0f8ff",
                    padding: "15px",
                    borderRadius: "6px",
                    border: "1px solid #b3d9ff",
                    marginTop: "20px",
                  }}
                >
                  <p style={{ color: "#1e3a8a", margin: "0", fontSize: "12px", fontWeight: "500" }}>
                    💡 <strong>Note:</strong> Enter P&L data here to populate the charts automatically.
                    Gross Profit = Sales - COGS, Net Profit = Gross Profit - OPEX
                  </p>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
                marginTop: "20px",
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e8ddd4",
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
                onClick={handleSaveDetails}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#5d4037",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {showUploadModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              width: "500px",
              maxWidth: "90vw",
              textAlign: "center",
            }}
          >
            <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "20px" }}>Upload CSV File</h3>

            <div
              style={{
                backgroundColor: "#f0f8ff",
                padding: "20px",
                borderRadius: "6px",
                marginBottom: "20px",
                border: "2px dashed #b3d9ff",
              }}
            >
              <p style={{ color: "#1e3a8a", margin: "0 0 15px 0", fontSize: "14px" }}>
                Upload a CSV file with your balance sheet data. The CSV should have two columns: Account and Amount.
              </p>

              <div style={{ textAlign: "left", backgroundColor: "white", padding: "15px", borderRadius: "4px", fontSize: "12px", fontFamily: "monospace" }}>
                <p><strong>Expected format:</strong></p>
                <p>Cash,100000</p>
                <p>Inventory,50000</p>
                <p>Accounts Receivable,75000</p>
                <p>Property Plant & Equipment,200000</p>
                <p>...</p>
              </div>
            </div>

            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              style={{
                marginBottom: "20px",
                width: "100%",
                padding: "10px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
              }}
            />

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "center",
              }}
            >
              <button
                onClick={() => setShowUploadModal(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e8ddd4",
                  color: "#5d4037",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const CashflowTrends = ({ activeSection, financialYearStart, chartData, balanceSheetData, currentMonth }) => {
  if (activeSection !== "cashflow-trends") return null

  // Generate months based on financial year start
  const generateMonths = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const startMonthIndex = months.indexOf(financialYearStart)
    return [...months.slice(startMonthIndex), ...months.slice(0, startMonthIndex)]
  }

  const months = generateMonths()

  // Pull cashflow data from Balance Sheet cash values (convert to millions)
  const cashflowData = months.map(month => {
    const balanceData = balanceSheetData?.[month]
    return balanceData ? Number.parseFloat(balanceData.cash) / 1000000 : 0
  })

  // Calculate burn rate: (COGS + OPEX - Sales) for each month
  // This represents net cash outflow per month
  const burnRateData = months.map(month => {
    const balanceData = balanceSheetData?.[month]
    if (!balanceData) return 0

    const sales = Number.parseFloat(balanceData.sales) || 0
    const cogs = Number.parseFloat(balanceData.cogs) || 0
    const opex = Number.parseFloat(balanceData.opex) || 0

    // Burn rate = Cash going out - Cash coming in
    // Cash going out = COGS + OPEX, Cash coming in = Sales
    const burnRate = (cogs + opex - sales) / 1000000 // Convert to millions
    return Math.max(burnRate, 0) // Only show positive burn rate
  })

  // Calculate months runway: Current cash balance / average monthly burn rate
  const currentCashBalance = cashflowData[months.indexOf(currentMonth)] || 0
  const avgBurnRate = burnRateData.reduce((sum, rate) => sum + rate, 0) / burnRateData.filter(rate => rate > 0).length || 1
  const runwayMonths = avgBurnRate > 0 ? Math.round(currentCashBalance / avgBurnRate) : 999

  const cashflowOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Cashflow",
        color: "#5d4037",
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `Cashflow: R${context.raw.toFixed(1)}m`,
        },
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: "Amount (R-m)",
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
  }

  const burnRateOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Burn Rate (Monthly Net Cash Outflow)",
        color: "#5d4037",
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `Burn Rate: R${context.raw.toFixed(1)}m/month`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Amount (R-m)",
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
      {/* Information Panel */}


      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "20px",
        }}
      >
        <div style={{ height: "300px", padding: "15px", backgroundColor: "#f7f3f0", borderRadius: "6px" }}>
          <Line
            data={{
              labels: months,
              datasets: [
                {
                  label: "Cashflow",
                  data: cashflowData,
                  borderColor: "#5d4037",
                  backgroundColor: "rgba(93, 64, 55, 0.1)",
                  borderWidth: 2,
                  tension: 0.1,
                  fill: true,
                },
              ],
            }}
            options={cashflowOptions}
          />
        </div>
        <div style={{ height: "300px", padding: "15px", backgroundColor: "#f7f3f0", borderRadius: "6px" }}>
          <Line
            data={{
              labels: months,
              datasets: [
                {
                  label: "Burn Rate",
                  data: burnRateData,
                  borderColor: "#8b6914",
                  backgroundColor: "rgba(139, 105, 20, 0.1)",
                  borderWidth: 2,
                  tension: 0.1,
                  fill: true,
                },
              ],
            }}
            options={burnRateOptions}
          />
        </div>
        <div
          style={{
            height: "300px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "15px",
            backgroundColor: "#f7f3f0",
            borderRadius: "6px",
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
              {runwayMonths > 999 ? "∞" : runwayMonths}
            </span>
            <span
              style={{
                fontSize: "16px",
                color: "#72542b",
              }}
            >
              Months Runway
            </span>
            <span
              style={{
                fontSize: "12px",
                color: "#72542b",
                marginTop: "5px",
                textAlign: "center",
              }}
            >
              From {currentMonth}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

const BalanceSheetHealth = ({ activeSection, financialYearStart, chartData, onUpdateChartData, user }) => {
  const [showModal, setShowModal] = useState(false)
  const [healthDetails, setHealthDetails] = useState({
    receivables: "",
    payables: "",
    receivablesDays: "",
    payablesDays: "",
    inventory: "",
    inventoryDays: "",
    date: "",
    notes: "",
  })

  if (activeSection !== "balance-sheet-health") return null

  // Generate months based on financial year start
  const generateMonths = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const startMonthIndex = months.indexOf(financialYearStart)
    return [...months.slice(startMonthIndex), ...months.slice(0, startMonthIndex)]
  }

  const months = generateMonths()

  // Use stored data or empty arrays for manual entry
  const receivablesData = chartData.receivables?.actual || []
  const payablesData = chartData.payables?.actual || []
  const receivablesDaysData = chartData.receivablesDays?.actual || []
  const payablesDaysData = chartData.payablesDays?.actual || []
  const inventoryData = chartData.inventory?.actual || []
  const inventoryDaysData = chartData.inventoryDays?.actual || []

  const handleAddDetails = () => {
    setShowModal(true)
    // Pre-fill with existing data if available
    setHealthDetails({
      receivables: receivablesData.join(",") || "",
      payables: payablesData.join(",") || "",
      receivablesDays: receivablesDaysData.join(",") || "",
      payablesDays: payablesDaysData.join(",") || "",
      inventory: inventoryData.join(",") || "",
      inventoryDays: inventoryDaysData.join(",") || "",
      date: chartData.balanceSheetHealth?.date || "",
      notes: chartData.balanceSheetHealth?.notes || "",
    })
  }

  const handleSaveDetails = async () => {
    // Convert comma-separated strings to arrays
    const parseDataArray = (dataString) => {
      const values = dataString.split(",").map((val) => Number.parseFloat(val.trim()) || 0)
      while (values.length < 12) values.push(0)
      return values.slice(0, 12)
    }

    const updatedData = {
      receivables: { actual: parseDataArray(healthDetails.receivables) },
      payables: { actual: parseDataArray(healthDetails.payables) },
      receivablesDays: { actual: parseDataArray(healthDetails.receivablesDays) },
      payablesDays: { actual: parseDataArray(healthDetails.payablesDays) },
      inventory: { actual: parseDataArray(healthDetails.inventory) },
      inventoryDays: { actual: parseDataArray(healthDetails.inventoryDays) },
      balanceSheetHealth: {
        date: healthDetails.date,
        notes: healthDetails.notes,
      },
    }

    // Update each chart data
    Object.keys(updatedData).forEach((key) => {
      if (key !== "balanceSheetHealth") {
        onUpdateChartData(key, updatedData[key])
      }
    })
    onUpdateChartData("balanceSheetHealth", updatedData.balanceSheetHealth)

    // Save to Firebase if user is logged in
    if (user) {
      try {
        for (const [key, data] of Object.entries(updatedData)) {
          if (key !== "balanceSheetHealth") {
            await setDoc(doc(db, "financialData", `${user.uid}_${key}`), {
              userId: user.uid,
              chartName: key,
              ...data,
              lastUpdated: new Date().toISOString()
            })
          }
        }
        await setDoc(doc(db, "financialData", `${user.uid}_balanceSheetHealth`), {
          userId: user.uid,
          chartName: "balanceSheetHealth",
          ...updatedData.balanceSheetHealth,
          lastUpdated: new Date().toISOString()
        })
        console.log("Balance sheet health data saved to Firebase")
      } catch (error) {
        console.error("Error saving balance sheet health data:", error)
      }
    }

    setShowModal(false)
  }

  const receivablesPayablesOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Receivables & Payables",
        color: "#5d4037",
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: R${context.raw}m`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Amount (R-m)",
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
  }

  const daysOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Receivables & Payables Days",
        color: "#5d4037",
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Days",
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
  }

  const inventoryOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Inventory & Inventory Days",
        color: "#5d4037",
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) =>
            context.datasetIndex === 0 ? `Inventory: R${context.raw}m` : `Inventory Days: ${context.raw}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Inventory (R-m)",
          color: "#72542b",
        },
        position: "left",
      },
      y1: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Inventory Days",
          color: "#8b6914",
        },
        position: "right",
        grid: {
          drawOnChartArea: false,
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
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={handleAddDetails}
          style={{
            padding: "12px 24px",
            backgroundColor: "#5d4037",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
          }}
        >
          ➕ Add Details
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "20px",
        }}
      >
        <div style={{ height: "300px", padding: "15px", backgroundColor: "#f7f3f0", borderRadius: "6px" }}>
          <Bar
            data={{
              labels: months,
              datasets: [
                {
                  label: "Receivables",
                  data: receivablesData,
                  backgroundColor: "#9c7c5f",
                  borderColor: "#5d4037",
                  borderWidth: 1,
                },
                {
                  label: "Payables",
                  data: payablesData,
                  backgroundColor: "#8b6914",
                  borderColor: "#5d4037",
                  borderWidth: 1,
                },
              ],
            }}
            options={receivablesPayablesOptions}
          />
        </div>
        <div style={{ height: "300px", padding: "15px", backgroundColor: "#f7f3f0", borderRadius: "6px" }}>
          <Bar
            data={{
              labels: months,
              datasets: [
                {
                  label: "Receivables Days",
                  data: receivablesDaysData,
                  backgroundColor: "#b89f8d",
                  borderColor: "#5d4037",
                  borderWidth: 1,
                },
                {
                  label: "Payables Days",
                  data: payablesDaysData,
                  backgroundColor: "#d4c4b0",
                  borderColor: "#5d4037",
                  borderWidth: 1,
                },
              ],
            }}
            options={daysOptions}
          />
        </div>
        <div style={{ height: "300px", padding: "15px", backgroundColor: "#f7f3f0", borderRadius: "6px" }}>
          <Bar
            data={{
              labels: months,
              datasets: [
                {
                  label: "Inventory (R-m)",
                  data: inventoryData,
                  backgroundColor: "rgba(156, 124, 95, 0.7)",
                  borderColor: "#5d4037",
                  borderWidth: 1,
                  yAxisID: "y",
                },
                {
                  label: "Inventory Days",
                  data: inventoryDaysData,
                  borderColor: "#8b6914",
                  backgroundColor: "rgba(139, 105, 20, 0.1)",
                  borderWidth: 2,
                  type: "line",
                  yAxisID: "y1",
                },
              ],
            }}
            options={inventoryOptions}
          />
        </div>
      </div>

      {/* Modal for adding/editing details */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              width: "600px",
              maxWidth: "90vw",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "20px" }}>Balance Sheet Health Details</h3>

            <div
              style={{
                backgroundColor: "#f0f8ff",
                padding: "15px",
                borderRadius: "6px",
                marginBottom: "20px",
                border: "1px solid #b3d9ff",
              }}
            >
              <p style={{ color: "#1e3a8a", margin: "0", fontSize: "14px", fontWeight: "500" }}>
                💡 <strong>Tip:</strong> Enter data for all 12 months separated by commas.
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "500" }}>
                Receivables (12 months, comma separated):
              </label>
              <input
                type="text"
                value={healthDetails.receivables}
                onChange={(e) => setHealthDetails((prev) => ({ ...prev, receivables: e.target.value }))}
                placeholder="e.g., 100, 120, 110, 130, 125, 140, 135, 145, 150, 155, 160, 165"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "500" }}>
                Payables (12 months, comma separated):
              </label>
              <input
                type="text"
                value={healthDetails.payables}
                onChange={(e) => setHealthDetails((prev) => ({ ...prev, payables: e.target.value }))}
                placeholder="e.g., 80, 85, 90, 95, 88, 92, 87, 89, 91, 93, 95, 97"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "500" }}>
                Receivables Days (12 months, comma separated):
              </label>
              <input
                type="text"
                value={healthDetails.receivablesDays}
                onChange={(e) => setHealthDetails((prev) => ({ ...prev, receivablesDays: e.target.value }))}
                placeholder="e.g., 30, 32, 28, 35, 33, 31, 29, 34, 36, 38, 40, 42"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "500" }}>
                Payables Days (12 months, comma separated):
              </label>
              <input
                type="text"
                value={healthDetails.payablesDays}
                onChange={(e) => setHealthDetails((prev) => ({ ...prev, payablesDays: e.target.value }))}
                placeholder="e.g., 25, 27, 24, 28, 26, 25, 23, 29, 31, 33, 35, 37"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "500" }}>
                Inventory (12 months, comma separated):
              </label>
              <input
                type="text"
                value={healthDetails.inventory}
                onChange={(e) => setHealthDetails((prev) => ({ ...prev, inventory: e.target.value }))}
                placeholder="e.g., 50, 55, 52, 58, 56, 60, 57, 59, 61, 63, 65, 67"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "500" }}>
                Inventory Days (12 months, comma separated):
              </label>
              <input
                type="text"
                value={healthDetails.inventoryDays}
                onChange={(e) => setHealthDetails((prev) => ({ ...prev, inventoryDays: e.target.value }))}
                placeholder="e.g., 45, 48, 42, 50, 47, 49, 44, 51, 53, 55, 57, 59"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "500" }}>
                Date:
              </label>
              <input
                type="date"
                value={healthDetails.date}
                onChange={(e) => setHealthDetails((prev) => ({ ...prev, date: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "25px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#5d4037", fontWeight: "500" }}>
                Notes:
              </label>
              <textarea
                value={healthDetails.notes}
                onChange={(e) => setHealthDetails((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter any additional notes"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  minHeight: "80px",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e8ddd4",
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
                onClick={handleSaveDetails}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#5d4037",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const PnLSnapshot = ({ activeSection, viewMode, financialYearStart, pnlData, user, onUpdateChartData }) => {
  const [chartViewMode, setChartViewMode] = useState("data")
  const [visibleCharts, setVisibleCharts] = useState({
    sales: true,
    cogs: true,
    opex: true,
    grossProfit: true,
    netProfit: true,
    percentage: true,
  })
  const [showModal, setShowModal] = useState(false)
  const [pnlDetails, setPnlDetails] = useState({
    // Monthly data for key P&L items
    sales: Array(12).fill(""),
    cogs: Array(12).fill(""),
    opex: Array(12).fill(""),
    grossProfit: Array(12).fill(""),
    netProfit: Array(12).fill(""),
    // Budget data
    salesBudget: Array(12).fill(""),
    cogsBudget: Array(12).fill(""),
    opexBudget: Array(12).fill(""),
    grossProfitBudget: Array(12).fill(""),
    netProfitBudget: Array(12).fill(""),
    notes: "",
  })
  const [firebaseChartData, setFirebaseChartData] = useState({})
  const [loading, setLoading] = useState(false)

  // Load PnL data from Firebase when component mounts or user changes
  useEffect(() => {
    if (user) {
      loadPnLDataFromFirebase()
    }
  }, [user])

  // Load PnL data from Firebase
  const loadPnLDataFromFirebase = async () => {
    if (!user) return

    setLoading(true)
    try {
      const pnlManualDoc = await getDoc(doc(db, "financialData", `${user.uid}_pnlManual`))

      if (pnlManualDoc.exists()) {
        const firebaseData = pnlManualDoc.data()
        console.log("Loaded PnL data from Firebase:", firebaseData)

        // Update local state with Firebase data
        setPnlDetails(prev => ({
          sales: firebaseData.sales?.map(String) || Array(12).fill(""),
          cogs: firebaseData.cogs?.map(String) || Array(12).fill(""),
          opex: firebaseData.opex?.map(String) || Array(12).fill(""),
          grossProfit: firebaseData.grossProfit?.map(String) || Array(12).fill(""),
          netProfit: firebaseData.netProfit?.map(String) || Array(12).fill(""),
          salesBudget: firebaseData.salesBudget?.map(String) || Array(12).fill(""),
          cogsBudget: firebaseData.cogsBudget?.map(String) || Array(12).fill(""),
          opexBudget: firebaseData.opexBudget?.map(String) || Array(12).fill(""),
          grossProfitBudget: firebaseData.grossProfitBudget?.map(String) || Array(12).fill(""),
          netProfitBudget: firebaseData.netProfitBudget?.map(String) || Array(12).fill(""),
          notes: firebaseData.notes || "",
        }))

        // Process the data for charts
        processFirebaseDataForCharts(firebaseData)
      } else {
        console.log("No PnL data found in Firebase")
        // Initialize with empty data
        setFirebaseChartData({})
      }
    } catch (error) {
      console.error("Error loading PnL data from Firebase:", error)
    } finally {
      setLoading(false)
    }
  }

  // Process Firebase data for chart display
  const processFirebaseDataForCharts = (firebaseData) => {
    const chartData = {
      sales: {
        actual: firebaseData.sales?.map(val => Number.parseFloat(val) || 0) || Array(12).fill(0),
        budget: firebaseData.salesBudget?.map(val => Number.parseFloat(val) || 0) || Array(12).fill(0)
      },
      cogs: {
        actual: firebaseData.cogs?.map(val => Number.parseFloat(val) || 0) || Array(12).fill(0),
        budget: firebaseData.cogsBudget?.map(val => Number.parseFloat(val) || 0) || Array(12).fill(0)
      },
      opex: {
        actual: firebaseData.opex?.map(val => Number.parseFloat(val) || 0) || Array(12).fill(0),
        budget: firebaseData.opexBudget?.map(val => Number.parseFloat(val) || 0) || Array(12).fill(0)
      },
      grossProfit: {
        actual: firebaseData.grossProfit?.map(val => Number.parseFloat(val) || 0) || Array(12).fill(0),
        budget: firebaseData.grossProfitBudget?.map(val => Number.parseFloat(val) || 0) || Array(12).fill(0)
      },
      netProfit: {
        actual: firebaseData.netProfit?.map(val => Number.parseFloat(val) || 0) || Array(12).fill(0),
        budget: firebaseData.netProfitBudget?.map(val => Number.parseFloat(val) || 0) || Array(12).fill(0)
      }
    }

    setFirebaseChartData(chartData)

    // Update parent component's chart data
    if (onUpdateChartData) {
      Object.keys(chartData).forEach((key) => {
        onUpdateChartData(key, chartData[key])
      })
    }
  }

  if (activeSection !== "pnl-snapshot") return null

  // Generate labels based on financial year start and view mode
  const generateLabels = () => {
    if (viewMode === "month") {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const startMonthIndex = months.indexOf(financialYearStart)
      return [...months.slice(startMonthIndex), ...months.slice(0, startMonthIndex)]
    } else if (viewMode === "quarter") {
      return ["Q1", "Q2", "Q3", "Q4"]
    } else {
      return ["2019", "2020", "2021", "2022", "2023", "2024"]
    }
  }

  const labels = generateLabels()

  // Handle manual data entry
  const handleAddDetails = () => {
    setShowModal(true)
  }

  const handleSavePnlDetails = async () => {
    if (!user) {
      alert("Please log in to save P&L data")
      return
    }

    setLoading(true)
    try {
      // Prepare data for Firebase
      const firebaseData = {
        userId: user.uid,
        chartName: "pnlManual",
        // Convert string values to numbers for storage
        sales: pnlDetails.sales.map(val => Number.parseFloat(val) || 0),
        cogs: pnlDetails.cogs.map(val => Number.parseFloat(val) || 0),
        opex: pnlDetails.opex.map(val => Number.parseFloat(val) || 0),
        grossProfit: pnlDetails.grossProfit.map(val => Number.parseFloat(val) || 0),
        netProfit: pnlDetails.netProfit.map(val => Number.parseFloat(val) || 0),
        salesBudget: pnlDetails.salesBudget.map(val => Number.parseFloat(val) || 0),
        cogsBudget: pnlDetails.cogsBudget.map(val => Number.parseFloat(val) || 0),
        opexBudget: pnlDetails.opexBudget.map(val => Number.parseFloat(val) || 0),
        grossProfitBudget: pnlDetails.grossProfitBudget.map(val => Number.parseFloat(val) || 0),
        netProfitBudget: pnlDetails.netProfitBudget.map(val => Number.parseFloat(val) || 0),
        notes: pnlDetails.notes,
        lastUpdated: new Date().toISOString()
      }

      // Save to Firebase
      await setDoc(doc(db, "financialData", `${user.uid}_pnlManual`), firebaseData)
      console.log("P&L manual data saved to Firebase")

      // Process the saved data for charts
      processFirebaseDataForCharts(firebaseData)

      setShowModal(false)
    } catch (error) {
      console.error("Error saving P&L manual data:", error)
      alert("Error saving data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Process PnL data - prioritize Firebase data over uploaded data
  const processPnLData = () => {
    // If we have Firebase data, use it
    if (Object.keys(firebaseChartData).length > 0) {
      return firebaseChartData
    }

    // If we have uploaded PnL data, use it
    if (pnlData && Object.keys(pnlData).length > 0) {
      const sales = Number.parseFloat(pnlData.sales) || 0
      const cogs = Number.parseFloat(pnlData.cogs) || 0
      const opex = Number.parseFloat(pnlData.opex) || 0
      const grossProfit = sales - cogs
      const netProfit = grossProfit - opex

      // For monthly view, spread the data across months
      const monthlyData = (value) => {
        return labels.map((_, index) => {
          // Distribute annual data across months (simple equal distribution)
          return value / 12
        })
      }

      return {
        sales: {
          actual: monthlyData(sales),
          budget: monthlyData(sales * 1.1)
        },
        cogs: {
          actual: monthlyData(cogs),
          budget: monthlyData(cogs * 0.9)
        },
        opex: {
          actual: monthlyData(opex),
          budget: monthlyData(opex * 0.95)
        },
        grossProfit: {
          actual: monthlyData(grossProfit),
          budget: monthlyData(grossProfit * 1.15)
        },
        netProfit: {
          actual: monthlyData(netProfit),
          budget: monthlyData(netProfit * 1.2)
        },
      }
    }

    // Default empty data
    return {
      sales: { actual: Array(12).fill(0), budget: Array(12).fill(0) },
      cogs: { actual: Array(12).fill(0), budget: Array(12).fill(0) },
      opex: { actual: Array(12).fill(0), budget: Array(12).fill(0) },
      grossProfit: { actual: Array(12).fill(0), budget: Array(12).fill(0) },
      netProfit: { actual: Array(12).fill(0), budget: Array(12).fill(0) },
    }
  }

  // Calculate chart data
  const chartData = processPnLData()

  // Check if we have any data
  const hasData = () => {
    return Object.keys(firebaseChartData).length > 0 || (pnlData && (pnlData.sales || pnlData.cogs || pnlData.opex))
  }

  // ... rest of the component remains the same (calculateVariance, createChartOptions, etc.)

  // Calculate variances
  const calculateVariance = (budget, actual) => {
    return budget.map((b, i) => b - (actual[i] || 0))
  }

  // Chart options (keep the existing createChartOptions function)
  const createChartOptions = (title, showNegative = false) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: true,
        text: title,
        color: "#5d4037",
        font: {
          size: 14,
          weight: "bold",
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const datasetLabel = context.dataset.label || ''
            const value = context.raw
            return `${datasetLabel}: R${value.toLocaleString()}`
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: !showNegative,
        grid: {
          display: true,
          color: "#e0e0e0",
        },
        ticks: {
          font: {
            size: 10,
          },
          color: "#72542b",
          callback: function (value) {
            return 'R' + value.toLocaleString()
          }
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 9,
          },
          maxRotation: 45,
          color: "#72542b",
        },
      },
    },
  })

  // Calculate variances
  const salesVariance = calculateVariance(chartData.sales.budget, chartData.sales.actual)
  const cogsVariance = calculateVariance(chartData.cogs.budget, chartData.cogs.actual)
  const opexVariance = calculateVariance(chartData.opex.budget, chartData.opex.actual)
  const grossProfitVariance = calculateVariance(chartData.grossProfit.budget, chartData.grossProfit.actual)
  const netProfitVariance = calculateVariance(chartData.netProfit.budget, chartData.netProfit.actual)

  // Calculate percentages
  const grossProfitPercent = chartData.sales.actual.map((sales, i) =>
    sales > 0 ? (chartData.grossProfit.actual[i] / sales) * 100 : 0
  )
  const netProfitPercent = chartData.sales.actual.map((sales, i) =>
    sales > 0 ? (chartData.netProfit.actual[i] / sales) * 100 : 0
  )

  const createDataChartDatasets = (data) => [
    {
      label: "Budget",
      data: data.budget,
      backgroundColor: "rgba(139, 105, 20, 0.7)",
      borderColor: "#8b6914",
      borderWidth: 1,
    },
    {
      label: "Actual",
      data: data.actual,
      backgroundColor: "rgba(93, 64, 55, 0.7)",
      borderColor: "#5d4037",
      borderWidth: 1,
    },
  ]

  const createVarianceChartDatasets = (variance, title) => [
    {
      label: "Variance",
      data: variance,
      backgroundColor: variance.map(v =>
        v >= 0 ? "rgba(76, 175, 80, 0.7)" : "rgba(244, 67, 54, 0.7)"
      ),
      borderColor: variance.map(v => v >= 0 ? "#4caf50" : "#f44336"),
      borderWidth: 1,
    },
  ]

  const charts = [
    { id: 'sales', title: 'Sales Revenue', data: chartData.sales, variance: salesVariance },
    { id: 'cogs', title: 'Cost of Goods Sold', data: chartData.cogs, variance: cogsVariance },
    { id: 'opex', title: 'Operating Expenses', data: chartData.opex, variance: opexVariance },
    { id: 'grossProfit', title: 'Gross Profit', data: chartData.grossProfit, variance: grossProfitVariance, showNegative: true },
    { id: 'netProfit', title: 'Net Profit', data: chartData.netProfit, variance: netProfitVariance, showNegative: true },
  ]

  // Generate month labels for the form
  const monthLabels = generateLabels()

  return (
    <div
      style={{
        backgroundColor: "#f8f9fa",
        padding: "20px",
        margin: "20px 0",
        borderRadius: "8px",
      }}
    >
      {/* Loading Indicator */}
      {loading && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            padding: "20px",
            borderRadius: "8px",
            zIndex: 1000,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          <p style={{ margin: 0, color: "#5d4037", fontWeight: "500" }}>Loading P&L Data...</p>
        </div>
      )}

      {/* Action Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={handleAddDetails}
          disabled={loading}
          style={{
            padding: "12px 24px",
            backgroundColor: "#5d4037",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "600",
            fontSize: "14px",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Loading..." : "➕ Add/Edit P&L Details"}
        </button>
      </div>

      {/* Data Status */}
      {!user ? (
        <div
          style={{
            backgroundColor: "#fff3cd",
            border: "1px solid #ffeaa7",
            color: "#856404",
            padding: "15px",
            borderRadius: "6px",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0, fontWeight: "500" }}>
            🔐 Please log in to view and manage your P&L data.
          </p>
        </div>
      ) : !hasData() ? (
        <div
          style={{
            backgroundColor: "#fff3cd",
            border: "1px solid #ffeaa7",
            color: "#856404",
            padding: "15px",
            borderRadius: "6px",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0, fontWeight: "500" }}>
            📊 Click "Add/Edit P&L Details" to enter your Profit & Loss data.
          </p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#d4edda",
            border: "1px solid #c3e6cb",
            color: "#155724",
            padding: "15px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <p style={{ margin: 0, fontWeight: "500" }}>
            ✅ Showing {Object.keys(firebaseChartData).length > 0 ? "saved P&L data from Firebase" : "P&L data from uploaded CSV file"}
          </p>
        </div>
      )}

      {/* Rest of the component remains the same... */}
      {/* Chart Controls */}
      <div
        style={{
          backgroundColor: "#fdfcfb",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "1px solid #e8ddd4",
        }}
      >
        <h4 style={{ color: "#5d4037", margin: "0 0 15px 0" }}>Chart Visibility</h4>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {Object.entries(visibleCharts).map(([chartName, isVisible]) => (
            <button
              key={chartName}
              onClick={() => setVisibleCharts(prev => ({ ...prev, [chartName]: !prev[chartName] }))}
              style={{
                padding: "8px 16px",
                backgroundColor: isVisible ? "#5d4037" : "#e8ddd4",
                color: isVisible ? "#fdfcfb" : "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "12px",
                textTransform: "capitalize",
              }}
            >
              {chartName === 'grossProfit' ? 'Gross Profit' :
                chartName === 'netProfit' ? 'Net Profit' :
                  chartName === 'percentage' ? 'Profit Margins' :
                    chartName === 'sales' ? 'Sales Revenue' :
                      chartName === 'cogs' ? 'COGS' :
                        chartName === 'opex' ? 'OPEX' : chartName}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "20px",
        }}
      >
        {charts.filter(chart => visibleCharts[chart.id]).map((chart) => (
          <div
            key={chart.id}
            style={{
              backgroundColor: "white",
              padding: "15px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              height: "400px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ height: "350px" }}>
              {chartViewMode === "data" ? (
                <Bar
                  data={{
                    labels,
                    datasets: createDataChartDatasets(chart.data),
                  }}
                  options={createChartOptions(chart.title, chart.showNegative)}
                />
              ) : (
                <Bar
                  data={{
                    labels,
                    datasets: createVarianceChartDatasets(chart.variance, chart.title),
                  }}
                  options={createChartOptions(`${chart.title} - Variance`, chart.showNegative)}
                />
              )}
            </div>
          </div>
        ))}

        {visibleCharts.percentage && (
          <div
            style={{
              backgroundColor: "white",
              padding: "15px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              height: "400px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ height: "350px" }}>
              <Line
                data={{
                  labels,
                  datasets: [
                    {
                      label: "Gross Profit %",
                      data: grossProfitPercent,
                      borderColor: "#8b6914",
                      backgroundColor: "rgba(139, 105, 20, 0.1)",
                      borderWidth: 3,
                      tension: 0.1,
                      fill: false,
                    },
                    {
                      label: "Net Profit %",
                      data: netProfitPercent,
                      borderColor: "#5d4037",
                      backgroundColor: "rgba(93, 64, 55, 0.1)",
                      borderWidth: 3,
                      tension: 0.1,
                      fill: false,
                    },
                  ],
                }}
                options={createChartOptions("Profit Margins (%)")}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modal for adding/editing P&L details */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              width: "900px",
              maxWidth: "90vw",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "20px" }}>P&L Details - Manual Entry</h3>

            <div
              style={{
                backgroundColor: "#f0f8ff",
                padding: "15px",
                borderRadius: "6px",
                marginBottom: "20px",
                border: "1px solid #b3d9ff",
              }}
            >
              <p style={{ color: "#1e3a8a", margin: "0", fontSize: "14px", fontWeight: "500" }}>
                💡 <strong>Tip:</strong> Enter actual values for each month. Budget values will be auto-calculated if left empty.
                Based on your spreadsheet, focus on key totals like Trading Income, Cost of Sales, Gross Profit, Operating Expenses, and Net Profit.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {/* Actual Values Column */}
              <div>
                <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>Actual Values (R)</h4>

                {/* Sales Revenue */}
                <div style={{ marginBottom: "20px" }}>
                  <h5 style={{ color: "#5d4037", marginBottom: "10px" }}>Sales Revenue</h5>
                  {monthLabels.map((month, index) => (
                    <div key={index} style={{ marginBottom: "8px" }}>
                      <label style={{ display: "block", marginBottom: "3px", color: "#5d4037", fontSize: "12px", fontWeight: "500" }}>
                        {month}:
                      </label>
                      <input
                        type="number"
                        value={pnlDetails.sales[index] || ""}
                        onChange={(e) => {
                          const newSales = [...pnlDetails.sales]
                          newSales[index] = e.target.value
                          setPnlDetails(prev => ({ ...prev, sales: newSales }))
                        }}
                        placeholder="0"
                        style={{
                          width: "100%",
                          padding: "6px",
                          border: "1px solid #e8ddd4",
                          borderRadius: "4px",
                          fontSize: "12px",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Cost of Goods Sold */}
                <div style={{ marginBottom: "20px" }}>
                  <h5 style={{ color: "#5d4037", marginBottom: "10px" }}>Cost of Goods Sold</h5>
                  {monthLabels.map((month, index) => (
                    <div key={index} style={{ marginBottom: "8px" }}>
                      <label style={{ display: "block", marginBottom: "3px", color: "#5d4037", fontSize: "12px", fontWeight: "500" }}>
                        {month}:
                      </label>
                      <input
                        type="number"
                        value={pnlDetails.cogs[index] || ""}
                        onChange={(e) => {
                          const newCogs = [...pnlDetails.cogs]
                          newCogs[index] = e.target.value
                          setPnlDetails(prev => ({ ...prev, cogs: newCogs }))
                        }}
                        placeholder="0"
                        style={{
                          width: "100%",
                          padding: "6px",
                          border: "1px solid #e8ddd4",
                          borderRadius: "4px",
                          fontSize: "12px",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Operating Expenses */}
                <div style={{ marginBottom: "20px" }}>
                  <h5 style={{ color: "#5d4037", marginBottom: "10px" }}>Operating Expenses</h5>
                  {monthLabels.map((month, index) => (
                    <div key={index} style={{ marginBottom: "8px" }}>
                      <label style={{ display: "block", marginBottom: "3px", color: "#5d4037", fontSize: "12px", fontWeight: "500" }}>
                        {month}:
                      </label>
                      <input
                        type="number"
                        value={pnlDetails.opex[index] || ""}
                        onChange={(e) => {
                          const newOpex = [...pnlDetails.opex]
                          newOpex[index] = e.target.value
                          setPnlDetails(prev => ({ ...prev, opex: newOpex }))
                        }}
                        placeholder="0"
                        style={{
                          width: "100%",
                          padding: "6px",
                          border: "1px solid #e8ddd4",
                          borderRadius: "4px",
                          fontSize: "12px",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Budget Values Column */}
              <div>
                <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>Budget Values (R) - Optional</h4>

                {/* Sales Budget */}
                <div style={{ marginBottom: "20px" }}>
                  <h5 style={{ color: "#5d4037", marginBottom: "10px" }}>Sales Budget</h5>
                  {monthLabels.map((month, index) => (
                    <div key={index} style={{ marginBottom: "8px" }}>
                      <label style={{ display: "block", marginBottom: "3px", color: "#5d4037", fontSize: "12px", fontWeight: "500" }}>
                        {month}:
                      </label>
                      <input
                        type="number"
                        value={pnlDetails.salesBudget[index] || ""}
                        onChange={(e) => {
                          const newSalesBudget = [...pnlDetails.salesBudget]
                          newSalesBudget[index] = e.target.value
                          setPnlDetails(prev => ({ ...prev, salesBudget: newSalesBudget }))
                        }}
                        placeholder="Auto-calculated"
                        style={{
                          width: "100%",
                          padding: "6px",
                          border: "1px solid #e8ddd4",
                          borderRadius: "4px",
                          fontSize: "12px",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* COGS Budget */}
                <div style={{ marginBottom: "20px" }}>
                  <h5 style={{ color: "#5d4037", marginBottom: "10px" }}>COGS Budget</h5>
                  {monthLabels.map((month, index) => (
                    <div key={index} style={{ marginBottom: "8px" }}>
                      <label style={{ display: "block", marginBottom: "3px", color: "#5d4037", fontSize: "12px", fontWeight: "500" }}>
                        {month}:
                      </label>
                      <input
                        type="number"
                        value={pnlDetails.cogsBudget[index] || ""}
                        onChange={(e) => {
                          const newCogsBudget = [...pnlDetails.cogsBudget]
                          newCogsBudget[index] = e.target.value
                          setPnlDetails(prev => ({ ...prev, cogsBudget: newCogsBudget }))
                        }}
                        placeholder="Auto-calculated"
                        style={{
                          width: "100%",
                          padding: "6px",
                          border: "1px solid #e8ddd4",
                          borderRadius: "4px",
                          fontSize: "12px",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* OPEX Budget */}
                <div style={{ marginBottom: "20px" }}>
                  <h5 style={{ color: "#5d4037", marginBottom: "10px" }}>OPEX Budget</h5>
                  {monthLabels.map((month, index) => (
                    <div key={index} style={{ marginBottom: "8px" }}>
                      <label style={{ display: "block", marginBottom: "3px", color: "#5d4037", fontSize: "12px", fontWeight: "500" }}>
                        {month}:
                      </label>
                      <input
                        type="number"
                        value={pnlDetails.opexBudget[index] || ""}
                        onChange={(e) => {
                          const newOpexBudget = [...pnlDetails.opexBudget]
                          newOpexBudget[index] = e.target.value
                          setPnlDetails(prev => ({ ...prev, opexBudget: newOpexBudget }))
                        }}
                        placeholder="Auto-calculated"
                        style={{
                          width: "100%",
                          padding: "6px",
                          border: "1px solid #e8ddd4",
                          borderRadius: "4px",
                          fontSize: "12px",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Notes */}
                <div style={{ marginBottom: "20px" }}>
                  <h5 style={{ color: "#5d4037", marginBottom: "10px" }}>Notes</h5>
                  <textarea
                    value={pnlDetails.notes}
                    onChange={(e) => setPnlDetails(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Enter any additional notes about your P&L data..."
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e8ddd4",
                      borderRadius: "4px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                      minHeight: "80px",
                    }}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
                marginTop: "20px",
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e8ddd4",
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
                onClick={handleSavePnlDetails}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#5d4037",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Save P&L Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Main Financial Performance Component
const FinancialPerformance = () => {
  const [activeSection, setActiveSection] = useState("balance-sheet")
  const [viewMode, setViewMode] = useState("month")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [financialYearStart, setFinancialYearStart] = useState("Jan")
  const [chartData, setChartData] = useState({})
  const [balanceSheetData, setBalanceSheetData] = useState(null)
  const [pnlData, setPnLData] = useState(null) // New state for PnL data
  const [currentMonth, setCurrentMonth] = useState("Jan")
  const [user, setUser] = useState(null)

  // Firebase authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        loadUserData(currentUser.uid)
      } else {
        setChartData({})
        setBalanceSheetData(null)
      }
    })

    return () => unsubscribe()
  }, [])

  // Load user-specific data from Firebase
  const loadUserData = async (userId) => {
    try {
      const chartRef = collection(db, "financialData")
      const q = query(chartRef, where("userId", "==", userId))
      const querySnapshot = await getDocs(q)

      const userData = {}
      let balanceSheet = null

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.chartName === "balanceSheet") {
          balanceSheet = data.data
        } else {
          userData[data.chartName] = {
            name: data.name,
            actual: data.actual || [],
            budget: data.budget || [],
            date: data.date,
            notes: data.notes,
          }
        }
      })

      setChartData(userData)
      setBalanceSheetData(balanceSheet)
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }

  useEffect(() => {
    const checkSidebarState = () => {
      setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"))
    }

    // Check initial state
    checkSidebarState()

    // Watch for changes
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

  // Reordered sections with Balance Sheet first
  const sectionButtons = [
    { id: "balance-sheet", label: "Balance Sheet" },
    { id: "pnl-snapshot", label: "P&L Snapshot" },
    { id: "cashflow-trends", label: "Cashflow Trends" },
    { id: "balance-sheet-health", label: "Balance Sheet Health" },
  ]

  const handleUpdateChartData = (chartName, data) => {
    setChartData((prev) => ({
      ...prev,
      [chartName]: data,
    }))
  }

  const handleUpdateBalanceSheet = (data) => {
    setBalanceSheetData(data)
  }

  const handleMonthChange = (month) => {
    setCurrentMonth(month)
  }

  const handleUpdatePnLData = (data) => {
    setPnLData(data)
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
              gap: "15px",
              margin: "50px 0",
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

          {activeSection === "pnl-snapshot" && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                flexWrap: "wrap",
                gap: "15px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  alignItems: "center",
                }}
              >
                <button
                  onClick={() => setViewMode("month")}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: viewMode === "month" ? "#5d4037" : "#e8ddd4",
                    color: viewMode === "month" ? "#fdfcfb" : "#5d4037",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "14px",
                    transition: "all 0.3s ease",
                  }}
                >
                  Monthly View
                </button>
                <button
                  onClick={() => setViewMode("quarter")}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: viewMode === "quarter" ? "#5d4037" : "#e8ddd4",
                    color: viewMode === "quarter" ? "#fdfcfb" : "#5d4037",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "14px",
                    transition: "all 0.3s ease",
                  }}
                >
                  Quarterly View
                </button>
                <button
                  onClick={() => setViewMode("year")}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: viewMode === "year" ? "#5d4037" : "#e8ddd4",
                    color: viewMode === "year" ? "#fdfcfb" : "#5d4037",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "14px",
                    transition: "all 0.3s ease",
                  }}
                >
                  Yearly View
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  alignItems: "center",
                }}
              >
                <div>
                  <label
                    style={{
                      marginRight: "8px",
                      color: "#5d4037",
                      fontWeight: "500",
                    }}
                  >
                    Financial Year Start:
                  </label>
                  <select
                    value={financialYearStart}
                    onChange={(e) => setFinancialYearStart(e.target.value)}
                    style={{
                      padding: "8px",
                      border: "2px solid #e8ddd4",
                      borderRadius: "4px",
                      backgroundColor: "#fdfcfb",
                      color: "#5d4037",
                      fontWeight: "500",
                    }}
                  >
                    <option value="Jan">January</option>
                    <option value="Feb">February</option>
                    <option value="Mar">March</option>
                    <option value="Apr">April</option>
                    <option value="May">May</option>
                    <option value="Jun">June</option>
                    <option value="Jul">July</option>
                    <option value="Aug">August</option>
                    <option value="Sep">September</option>
                    <option value="Oct">October</option>
                    <option value="Nov">November</option>
                    <option value="Dec">December</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {!user && (
            <div
              style={{
                backgroundColor: "#fdfcfb",
                padding: "20px",
                borderRadius: "8px",
                textAlign: "center",
                marginBottom: "20px",
                border: "2px solid #e8ddd4",
              }}
            >
              <p style={{ color: "#5d4037", fontSize: "16px", margin: 0 }}>
                Please log in to view and manage your financial data.
              </p>
            </div>
          )}

          <BalanceSheet
            activeSection={activeSection}
            onUpdateBalanceSheet={handleUpdateBalanceSheet}
            balanceSheetData={balanceSheetData}
            currentMonth={currentMonth}
            onMonthChange={handleMonthChange}
            user={user}
            onUpdatePnLData={handleUpdatePnLData} // Add this prop
          />
          <PnLSnapshot
            activeSection={activeSection}
            viewMode={viewMode}
            financialYearStart={financialYearStart}
            pnlData={pnlData} // Pass PnL data instead of balanceSheetData
            user={user}
          />
          <CashflowTrends
            activeSection={activeSection}
            financialYearStart={financialYearStart}
            chartData={chartData}
            balanceSheetData={balanceSheetData}
            currentMonth={currentMonth}
          />
          <BalanceSheetHealth
            activeSection={activeSection}
            financialYearStart={financialYearStart}
            chartData={chartData}
            onUpdateChartData={handleUpdateChartData}
            user={user}
          />
        </div>
      </div>
    </div>
  )
}

export default FinancialPerformance