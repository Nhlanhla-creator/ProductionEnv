import { useState, useEffect } from "react"
import { Bar, Line } from "react-chartjs-2"
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
  Title,
  Tooltip,
  Legend,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend)

// Helper function to get months array based on year
const getMonthsForYear = (year, viewMode = "month") => {
  if (viewMode === "year") return [`FY ${year}`]
  if (viewMode === "quarter") return ["Q1", "Q2", "Q3", "Q4"]
  
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return months
}

// Helper component for trend icon with proper positioning
const TrendChartIcon = ({ onClick, style = {} }) => (
  <div
    onClick={onClick}
    style={{
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "24px",
      height: "24px",
      ...style
    }}
  >
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#5d4037"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  </div>
)

// Key Question Component with Show More functionality
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

// Capital Structure Component
const CapitalStructure = ({ activeSection, viewMode, user, isInvestorView, isEmbedded }) => {
  const [activeSubTab, setActiveSubTab] = useState("balance-sheet")
  const [showModal, setShowModal] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState("Jan")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [showTrendModal, setShowTrendModal] = useState(false)
  const [selectedTrendItem, setSelectedTrendItem] = useState(null)
  const [expandedNotes, setExpandedNotes] = useState({})
  const [kpiNotes, setKpiNotes] = useState({})
  const [kpiAnalysis, setKpiAnalysis] = useState({})
const [navData, setNavData] = useState(Array(12).fill("0"))
  const [financialYear, setFinancialYear] = useState("FY")
  
  // Balance Sheet Data Structure - FIXED with correct hierarchy
  const [balanceSheetData, setBalanceSheetData] = useState({
    assets: {
      bank: {
        callAccounts: Array(12).fill(""),
        currentAccount: Array(12).fill(""),
      },
      currentAssets: {
        accountsReceivable: Array(12).fill(""),
        deposits: Array(12).fill(""),
        cash: Array(12).fill(""),
        callAccounts: Array(12).fill(""), // Added this missing property
        tradeReceivables: Array(12).fill(""),
      },
      fixedAssets: {
        // These are all items under Fixed Assets category
        computerEquipment: Array(12).fill(""),
        lessDepreciationComputer: Array(12).fill(""),
        vehicles: Array(12).fill(""),
        lessDepreciationVehicles: Array(12).fill(""),
        otherPropertyPlantEquipment: Array(12).fill(""),
        lessDepreciationOther: Array(12).fill(""),
        totalFixedAssets: Array(12).fill(""), // This is an item, not a category
      },
      nonCurrentAssets: {
        // FIXED: Loans moved from currentAssets to nonCurrentAssets
        loans: Array(12).fill(""),
        loanAccount: Array(12).fill(""),
        intangibleAssets: Array(12).fill(""),
      },
    },
    liabilities: {
      currentLiabilities: {
        accountsPayable: Array(12).fill(""),
        incomeReceivedInAdvance: Array(12).fill(""),
        provisionIntercompany: Array(12).fill(""),
        provisionForLeavePay: Array(12).fill(""),
        salaryControlMedicalFund: Array(12).fill(""),
        salaryControlPAYE: Array(12).fill(""),
        salaryControlPensionFund: Array(12).fill(""),
        salaryControlSalaries: Array(12).fill(""),
        vatLiability: Array(12).fill(""),
      },
      nonCurrentLiabilities: {
        // This is a category
        thirdPartyLoans: Array(12).fill(""),
        intercompanyLoans: Array(12).fill(""),
        directorsLoans: Array(12).fill(""),
        totalNonCurrentLiabilities: Array(12).fill(""), // This is an item
      },
    },
    equity: {
      currentYearEarnings: Array(12).fill(""),
      ownerAShare: Array(12).fill(""),
      capital: Array(12).fill(""),
      retainedEarnings: Array(12).fill(""),
    },
  })
// In the CapitalStructure component, update the initial state for KPI data:

  // Solvency KPIs - Pull data from balance sheet (Nav moved here from balance sheet)
  const [solvencyData, setSolvencyData] = useState({
    debtToEquity: Array(12).fill("0"),
    interestCoverage: Array(12).fill("0"),
    debtServiceCoverage: Array(12).fill("0"),
    nav: Array(12).fill("0"), // NAV moved to solvency tab
  })

  // Leverage KPIs - Pull data from balance sheet
  const [leverageData, setLeverageData] = useState({
    totalDebtRatio: Array(12).fill("0"),
    longTermDebtRatio: Array(12).fill("0"),
    equityMultiplier: Array(12).fill("0"),
  })

  // Equity KPIs - Pull data from balance sheet
  const [equityData, setEquityData] = useState({
    returnOnEquity: Array(12).fill("0"),
    equityRatio: Array(12).fill("0"),
    bookValuePerShare: Array(12).fill("0"),
  })

  const months = getMonthsForYear(selectedYear, "month")
  const years = Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i)

  const subTabs = [
  { id: "balance-sheet", label: "Balance Sheet" },
  { id: "solvency", label: "Solvency" },
  { id: "leverage", label: "Leverage" },
  { id: "equity", label: "Equity Structure & Capital Discipline" },
]

  useEffect(() => {
    if (user) {
      loadCapitalStructureData()
    }
  }, [user])

  useEffect(() => {
    // Calculate KPIs from balance sheet data
    calculateKPIsFromBalanceSheet()
  }, [balanceSheetData, selectedMonth, selectedYear])

    const calculateKPIsFromBalanceSheet = () => {
    const monthIndex = getMonthIndex(selectedMonth)
    
    // Ensure monthIndex is valid
    if (monthIndex < 0 || monthIndex >= 12) return
    
    // Get values from balance sheet with safe defaults
    const totalEquity = calculateTotal(balanceSheetData.equity, monthIndex) || 0
    const totalLiabilities = (calculateTotal(balanceSheetData.liabilities.currentLiabilities, monthIndex) || 0) + 
                           (calculateTotal(balanceSheetData.liabilities.nonCurrentLiabilities, monthIndex) || 0)
    const totalAssets = calculateTotalAssets(monthIndex) || 0
    
    // Calculate Debt to Equity Ratio
    const debtToEquity = totalEquity !== 0 ? (totalLiabilities / totalEquity) : 0
    
    // Calculate Equity Ratio
    const equityRatio = totalAssets !== 0 ? (totalEquity / totalAssets) : 0
    
    // Calculate Total Debt Ratio
    const totalDebtRatio = totalAssets !== 0 ? (totalLiabilities / totalAssets) : 0
    
    // Calculate Net Assets (NAV)
    const netAssets = totalAssets - totalLiabilities
    
    // Update KPI data - ensure arrays exist
    const newSolvencyData = { ...solvencyData }
    // Ensure arrays are initialized
    if (!newSolvencyData.debtToEquity) newSolvencyData.debtToEquity = Array(12).fill("0")
    if (!newSolvencyData.interestCoverage) newSolvencyData.interestCoverage = Array(12).fill("0")
    if (!newSolvencyData.debtServiceCoverage) newSolvencyData.debtServiceCoverage = Array(12).fill("0")
    if (!newSolvencyData.nav) newSolvencyData.nav = Array(12).fill("0")
    
    newSolvencyData.debtToEquity[monthIndex] = debtToEquity.toFixed(2)
    newSolvencyData.nav[monthIndex] = netAssets.toFixed(2)
    
    const newLeverageData = { ...leverageData }
    // Ensure arrays are initialized
    if (!newLeverageData.totalDebtRatio) newLeverageData.totalDebtRatio = Array(12).fill("0")
    if (!newLeverageData.longTermDebtRatio) newLeverageData.longTermDebtRatio = Array(12).fill("0")
    if (!newLeverageData.equityMultiplier) newLeverageData.equityMultiplier = Array(12).fill("0")
    
    newLeverageData.totalDebtRatio[monthIndex] = totalDebtRatio.toFixed(2)
    
    const newEquityData = { ...equityData }
    // Ensure arrays are initialized
    if (!newEquityData.returnOnEquity) newEquityData.returnOnEquity = Array(12).fill("0")
    if (!newEquityData.equityRatio) newEquityData.equityRatio = Array(12).fill("0")
    if (!newEquityData.bookValuePerShare) newEquityData.bookValuePerShare = Array(12).fill("0")
    
    newEquityData.equityRatio[monthIndex] = (equityRatio * 100).toFixed(2) // Convert to percentage
    
    setSolvencyData(newSolvencyData)
    setLeverageData(newLeverageData)
    setEquityData(newEquityData)
  }

  const loadCapitalStructureData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const capitalDoc = await getDoc(doc(db, "financialData", `${user.uid}_capitalStructure`))
      if (capitalDoc.exists()) {
        const data = capitalDoc.data()
        if (data.balanceSheetData) setBalanceSheetData(data.balanceSheetData)
        if (data.solvencyData) setSolvencyData(data.solvencyData)
        if (data.leverageData) setLeverageData(data.leverageData)
        if (data.equityData) setEquityData(data.equityData)
        if (data.kpiNotes) setKpiNotes(data.kpiNotes)
        if (data.kpiAnalysis) setKpiAnalysis(data.kpiAnalysis)
      }
    } catch (error) {
      console.error("Error loading capital structure data:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveCapitalStructureData = async () => {
    if (!user) {
      alert("Please log in to save data")
      return
    }
    setLoading(true)
    try {
      await setDoc(doc(db, "financialData", `${user.uid}_capitalStructure`), {
        userId: user.uid,
        balanceSheetData,
        solvencyData,
        leverageData,
        equityData,
        kpiNotes,
        kpiAnalysis,
        lastUpdated: new Date().toISOString(),
      })
      setShowModal(false)
      alert("Data saved successfully!")
    } catch (error) {
      console.error("Error saving data:", error)
      alert("Error saving data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getMonthIndex = (month) => months.indexOf(month)

  const calculateTotal = (items, monthIndex) => {
    if (!items || monthIndex < 0 || monthIndex >= 12) return 0
    
    return Object.values(items).reduce((sum, arr) => {
      if (!Array.isArray(arr) || arr.length <= monthIndex) return sum
      const val = Number.parseFloat(arr[monthIndex]) || 0
      return sum + val
    }, 0)
  }

   const calculateTotalAssets = (monthIndex) => {
    if (monthIndex < 0 || monthIndex >= 12) return 0
    
    const totalBank =
      (Number.parseFloat(balanceSheetData?.assets?.bank?.callAccounts?.[monthIndex]) || 0) +
      (Number.parseFloat(balanceSheetData?.assets?.bank?.currentAccount?.[monthIndex]) || 0)
    
    const totalCurrentAssets = calculateTotal(balanceSheetData?.assets?.currentAssets || {}, monthIndex)
    const totalFixedAssets = calculateTotal(balanceSheetData?.assets?.fixedAssets || {}, monthIndex)
    const totalNonCurrentAssets = calculateTotal(balanceSheetData?.assets?.nonCurrentAssets || {}, monthIndex)
    
    return totalBank + totalCurrentAssets + totalFixedAssets + totalNonCurrentAssets
  }

  const monthIndex = getMonthIndex(selectedMonth)

  // Calculate totals with optional chaining
  const totalBank =
    (Number.parseFloat(balanceSheetData?.assets?.bank?.callAccounts?.[monthIndex]) || 0) +
    (Number.parseFloat(balanceSheetData?.assets?.bank?.currentAccount?.[monthIndex]) || 0)

  const totalCurrentAssets = calculateTotal(balanceSheetData?.assets?.currentAssets || {}, monthIndex)
  const totalFixedAssets = calculateTotal(balanceSheetData?.assets?.fixedAssets || {}, monthIndex)
  const totalNonCurrentAssets = calculateTotal(balanceSheetData?.assets?.nonCurrentAssets || {}, monthIndex)
  const totalAssets = totalBank + totalCurrentAssets + totalFixedAssets + totalNonCurrentAssets

  const totalCurrentLiabilities = calculateTotal(balanceSheetData?.liabilities?.currentLiabilities || {}, monthIndex)
  const totalNonCurrentLiabilities = calculateTotal(balanceSheetData?.liabilities?.nonCurrentLiabilities || {}, monthIndex)
  const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities

  const totalEquity = calculateTotal(balanceSheetData?.equity || {}, monthIndex)
  const netAssets = totalAssets - totalLiabilities
  const totalLiabilitiesAndCapital = totalLiabilities + totalEquity

  // Update NAV data in solvency KPI
   // Update NAV data in solvency KPI
  useEffect(() => {
    const monthIndex = getMonthIndex(selectedMonth)
    if (monthIndex < 0 || monthIndex >= 12) return
    
    const newSolvencyData = { ...solvencyData }
    if (!newSolvencyData.nav) newSolvencyData.nav = Array(12).fill("0")
    
    // Ensure netAssets is calculated properly
    const totalAssets = calculateTotalAssets(monthIndex) || 0
    const totalLiabilities = (calculateTotal(balanceSheetData?.liabilities?.currentLiabilities || {}, monthIndex) || 0) + 
                           (calculateTotal(balanceSheetData?.liabilities?.nonCurrentLiabilities || {}, monthIndex) || 0)
    const netAssets = totalAssets - totalLiabilities
    
    newSolvencyData.nav[monthIndex] = netAssets.toString()
    setSolvencyData(newSolvencyData)
  }, [netAssets, monthIndex])

  const toggleNotes = (kpiKey) => {
    setExpandedNotes((prev) => ({ ...prev, [kpiKey]: !prev[kpiKey] }))
  }

  const updateKpiNote = (kpiKey, note) => {
    setKpiNotes((prev) => ({ ...prev, [kpiKey]: note }))
  }

  const updateKpiAnalysis = (kpiKey, analysis) => {
    setKpiAnalysis((prev) => ({ ...prev, [kpiKey]: analysis }))
  }

  const handleAddNotes = (kpiKey) => {
    setExpandedNotes((prev) => ({ ...prev, [kpiKey]: !prev[kpiKey] }))
  }

  const handleAIAnalysis = (kpiKey) => {
    setExpandedNotes((prev) => ({ ...prev, [`${kpiKey}_analysis`]: !prev[`${kpiKey}_analysis`] }))
  }

  const openTrendModal = (itemName, data) => {
    setSelectedTrendItem({ name: itemName, data })
    setShowTrendModal(true)
  }

  const handleCSVUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target.result
        const lines = text.split("\n")
        const headers = lines[0].split(",").map((h) => h.trim())

        const newBalanceSheetData = { ...balanceSheetData }

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.trim())
          if (values.length < 2) continue

          const category = values[0]?.toLowerCase()
          const item = values[1]?.toLowerCase()
          const monthValues = values.slice(2, 14)

          // Map CSV data to balance sheet structure
          if (category.includes("bank")) {
            if (item.includes("call")) {
              newBalanceSheetData.assets.bank.callAccounts = monthValues
            } else if (item.includes("current")) {
              newBalanceSheetData.assets.bank.currentAccount = monthValues
            }
          } else if (category.includes("current assets")) {
            if (item.includes("receivable")) {
              newBalanceSheetData.assets.currentAssets.accountsReceivable = monthValues
            } else if (item.includes("deposit")) {
              newBalanceSheetData.assets.currentAssets.deposits = monthValues
            } else if (item.includes("cash")) {
              newBalanceSheetData.assets.currentAssets.cash = monthValues
            } else if (item.includes("trade")) {
              newBalanceSheetData.assets.currentAssets.tradeReceivables = monthValues
            } else if (item.includes("call")) {
              newBalanceSheetData.assets.currentAssets.callAccounts = monthValues
            }
          } else if (category.includes("non-current assets")) {
            if (item.includes("loan")) {
              newBalanceSheetData.assets.nonCurrentAssets.loans = monthValues
            } else if (item.includes("loan account")) {
              newBalanceSheetData.assets.nonCurrentAssets.loanAccount = monthValues
            } else if (item.includes("intangible")) {
              newBalanceSheetData.assets.nonCurrentAssets.intangibleAssets = monthValues
            }
          }
        }

        setBalanceSheetData(newBalanceSheetData)
        alert("CSV imported successfully!")
      } catch (error) {
        console.error("Error parsing CSV:", error)
        alert("Error parsing CSV file. Please check the format.")
      }
    }
    reader.readAsText(file)
  }

  const handleCSVDownload = () => {
    const headers = [
      "Category",
      "Item",
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ]
    const rows = []

    // Assets - Bank
    rows.push(["Bank", "Call Accounts", ...balanceSheetData?.assets?.bank?.callAccounts || Array(12).fill("")])
    rows.push(["Bank", "Current Account", ...balanceSheetData?.assets?.bank?.currentAccount || Array(12).fill("")])

    // Assets - Current Assets
    rows.push(["Current Assets", "Accounts Receivable", ...balanceSheetData?.assets?.currentAssets?.accountsReceivable || Array(12).fill("")])
    rows.push(["Current Assets", "Deposits", ...balanceSheetData?.assets?.currentAssets?.deposits || Array(12).fill("")])
    rows.push(["Current Assets", "Cash", ...balanceSheetData?.assets?.currentAssets?.cash || Array(12).fill("")])
    rows.push(["Current Assets", "Call Accounts", ...balanceSheetData?.assets?.currentAssets?.callAccounts || Array(12).fill("")])
    rows.push(["Current Assets", "Trade Receivables", ...balanceSheetData?.assets?.currentAssets?.tradeReceivables || Array(12).fill("")])

    // Assets - Fixed Assets (all as items under Fixed Assets category)
    rows.push(["Fixed Assets", "Computer Equipment", ...balanceSheetData?.assets?.fixedAssets?.computerEquipment || Array(12).fill("")])
    rows.push([
      "Fixed Assets",
      "Less Depreciation on Computer Equipment",
      ...balanceSheetData?.assets?.fixedAssets?.lessDepreciationComputer || Array(12).fill(""),
    ])
    rows.push(["Fixed Assets", "Vehicles", ...balanceSheetData?.assets?.fixedAssets?.vehicles || Array(12).fill("")])
    rows.push([
      "Fixed Assets",
      "Less Depreciation on Vehicles",
      ...balanceSheetData?.assets?.fixedAssets?.lessDepreciationVehicles || Array(12).fill(""),
    ])
    rows.push([
      "Fixed Assets",
      "Other Property, Plant & Equipment",
      ...balanceSheetData?.assets?.fixedAssets?.otherPropertyPlantEquipment || Array(12).fill(""),
    ])
    rows.push(["Fixed Assets", "Total Fixed Assets", ...balanceSheetData?.assets?.fixedAssets?.totalFixedAssets || Array(12).fill("")])

    // Assets - Non-Current Assets (FIXED: Loans, Loan Account, Intangible Assets moved here)
    rows.push(["Non-Current Assets", "Loans", ...balanceSheetData?.assets?.nonCurrentAssets?.loans || Array(12).fill("")])
    rows.push(["Non-Current Assets", "Loan Account", ...balanceSheetData?.assets?.nonCurrentAssets?.loanAccount || Array(12).fill("")])
    rows.push(["Non-Current Assets", "Intangible Assets", ...balanceSheetData?.assets?.nonCurrentAssets?.intangibleAssets || Array(12).fill("")])

    // Liabilities - Current
    rows.push([
      "Current Liabilities",
      "Accounts Payable",
      ...balanceSheetData?.liabilities?.currentLiabilities?.accountsPayable || Array(12).fill(""),
    ])
    rows.push([
      "Current Liabilities",
      "Income Received In Advance",
      ...balanceSheetData?.liabilities?.currentLiabilities?.incomeReceivedInAdvance || Array(12).fill(""),
    ])
    rows.push([
      "Current Liabilities",
      "Provision Intercompany",
      ...balanceSheetData?.liabilities?.currentLiabilities?.provisionIntercompany || Array(12).fill(""),
    ])
    rows.push([
      "Current Liabilities",
      "Provision For Leave Pay",
      ...balanceSheetData?.liabilities?.currentLiabilities?.provisionForLeavePay || Array(12).fill(""),
    ])
    rows.push([
      "Current Liabilities",
      "Salary Control Medical Fund",
      ...balanceSheetData?.liabilities?.currentLiabilities?.salaryControlMedicalFund || Array(12).fill(""),
    ])
    rows.push([
      "Current Liabilities",
      "Salary Control PAYE",
      ...balanceSheetData?.liabilities?.currentLiabilities?.salaryControlPAYE || Array(12).fill(""),
    ])
    rows.push([
      "Current Liabilities",
      "Salary Control Pension Fund",
      ...balanceSheetData?.liabilities?.currentLiabilities?.salaryControlPensionFund || Array(12).fill(""),
    ])
    rows.push([
      "Current Liabilities",
      "Salary Control Salaries",
      ...balanceSheetData?.liabilities?.currentLiabilities?.salaryControlSalaries || Array(12).fill(""),
    ])
    rows.push(["Current Liabilities", "VAT Liability", ...balanceSheetData?.liabilities?.currentLiabilities?.vatLiability || Array(12).fill("")])

    // Liabilities - Non-Current (FIXED: Third Party Loans, Intercompany Loans, Directors Loans, Total Non-Current Liabilities)
    rows.push([
      "Non-Current Liabilities",
      "Third Party Loans",
      ...balanceSheetData?.liabilities?.nonCurrentLiabilities?.thirdPartyLoans || Array(12).fill(""),
    ])
    rows.push([
      "Non-Current Liabilities",
      "Intercompany Loans",
      ...balanceSheetData?.liabilities?.nonCurrentLiabilities?.intercompanyLoans || Array(12).fill(""),
    ])
    rows.push([
      "Non-Current Liabilities",
      "Directors Loans",
      ...balanceSheetData?.liabilities?.nonCurrentLiabilities?.directorsLoans || Array(12).fill(""),
    ])
    rows.push([
      "Non-Current Liabilities",
      "Total Non-Current Liabilities",
      ...balanceSheetData?.liabilities?.nonCurrentLiabilities?.totalNonCurrentLiabilities || Array(12).fill(""),
    ])

    // Equity
    rows.push(["Equity", "Current Year Earnings", ...balanceSheetData?.equity?.currentYearEarnings || Array(12).fill("")])
    rows.push(["Equity", "Owner A Share", ...balanceSheetData?.equity?.ownerAShare || Array(12).fill("")])
    rows.push(["Equity", "Capital", ...balanceSheetData?.equity?.capital || Array(12).fill("")])
    rows.push(["Equity", "Retained Earnings", ...balanceSheetData?.equity?.retainedEarnings || Array(12).fill("")])

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `balance_sheet_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderKPICard = (title, data, kpiKey, unit = "ZAR") => {
    const monthIndex = getMonthIndex(selectedMonth)
    const currentValue = Number.parseFloat(data[monthIndex]) || 0
    const chartData = {
      labels: months,
      datasets: [
        {
          label: title,
          data: data.map((v) => Number.parseFloat(v) || 0),
          backgroundColor: "rgba(93, 64, 55, 0.6)",
          borderColor: "rgb(93, 64, 55)",
          borderWidth: 2,
        },
      ],
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
        <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
          <div
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              border: "5px solid #f9a825",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "20px",
              backgroundColor: "#fff9c4",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#5d4037" }}>
                {currentValue.toLocaleString()}
              </div>
              <div style={{ fontSize: "11px", color: "#8d6e63" }}>Target: &gt;0</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ color: "#5d4037", marginBottom: "5px", fontSize: "16px" }}>{title}</h4>
            <Bar
              data={chartData}
              options={{
                responsive: true,
                plugins: { legend: { display: false }, title: { display: false } },
                scales: { y: { beginAtZero: true }, x: { display: true } },
                maintainAspectRatio: true,
              }}
              height={60}
            />
          </div>
        </div>

        {!isInvestorView && (
          <div style={{ borderTop: "1px solid #e8ddd4", paddingTop: "15px" }}>
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
              <button
                onClick={() => handleAddNotes(kpiKey)}
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
                onClick={() => handleAIAnalysis(kpiKey)}
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
                  onChange={(e) => updateKpiNote(kpiKey, e.target.value)}
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

  const renderBalanceSheet = () => (
    <div>
      <KeyQuestionBox
        question="Is the business financially solvent and appropriately structured for its current stage? Is the business structurally investable by institutional capital?"
        signals="Leverage, balance sheet strength"
        decisions="Raise equity vs debt, restructure balance sheet"
        section="balance-sheet"
      />

      {/* Balance Sheet Controls */}
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
        <div style={{ display: "flex", gap: "10px" }}>
          {/* BS Snapshot button removed as requested */}
        </div>

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
          
          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            <span style={{ color: "#5d4037", fontSize: "14px", whiteSpace: "nowrap" }}>Select Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "4px",
                border: "1px solid #e8ddd4",
                fontSize: "14px",
                color: "#5d4037",
                minWidth: "100px",
              }}
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
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
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              style={{ display: "none" }}
              id="csv-upload-input"
            />
            <button
              onClick={() => document.getElementById("csv-upload-input").click()}
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
              Upload CSV
            </button>
            <button
              onClick={handleCSVDownload}
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
              Download CSV
            </button>
          </div>
        )}
      </div>

      {/* Balance Sheet Snapshot View */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
        {/* Assets Side */}
        <div
          style={{
            backgroundColor: "#fdfcfb",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "18px", fontWeight: "700" }}>Assets</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#e8ddd4" }}>
                <th style={{ padding: "10px", textAlign: "left", color: "#5d4037", fontSize: "13px" }}>Category</th>
                <th style={{ padding: "10px", textAlign: "left", color: "#5d4037", fontSize: "13px" }}>Item</th>
                <th style={{ padding: "10px", textAlign: "right", color: "#5d4037", fontSize: "13px" }}>Currency</th>
                <th style={{ padding: "10px", textAlign: "right", color: "#5d4037", fontSize: "13px" }}>Amount</th>
                <th style={{ padding: "10px", textAlign: "center", color: "#5d4037", fontSize: "13px" }}>Trend</th>
              </tr>
            </thead>
            <tbody>
              {/* Bank */}
              <tr>
                <td
                  rowSpan={3}
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    color: "#5d4037",
                    fontWeight: "600",
                    fontSize: "13px",
                    verticalAlign: "top",
                  }}
                >
                  Bank
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Call Accounts
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(Number.parseFloat(balanceSheetData?.assets?.bank?.callAccounts?.[monthIndex]) || 0).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() => openTrendModal("Call Accounts", balanceSheetData?.assets?.bank?.callAccounts || [])}
                  />
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Current Account
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(Number.parseFloat(balanceSheetData?.assets?.bank?.currentAccount?.[monthIndex]) || 0).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() => openTrendModal("Current Account", balanceSheetData?.assets?.bank?.currentAccount || [])}
                  />
                </td>
              </tr>
              <tr style={{ backgroundColor: "#f5f0eb" }}>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    color: "#5d4037",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  Total Bank
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  {totalBank.toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4" }}></td>
              </tr>

              {/* Current Assets */}
              <tr>
                <td
                  rowSpan={6}
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    color: "#5d4037",
                    fontWeight: "600",
                    fontSize: "13px",
                    verticalAlign: "top",
                  }}
                >
                  Current Assets
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Accounts Receivable
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(
                    Number.parseFloat(balanceSheetData?.assets?.currentAssets?.accountsReceivable?.[monthIndex]) || 0
                  ).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() =>
                      openTrendModal("Accounts Receivable", balanceSheetData?.assets?.currentAssets?.accountsReceivable || [])
                    }
                  />
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Deposits
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(
                    Number.parseFloat(balanceSheetData?.assets?.currentAssets?.deposits?.[monthIndex]) || 0
                  ).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() => openTrendModal("Deposits", balanceSheetData?.assets?.currentAssets?.deposits || [])}
                  />
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Cash
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(Number.parseFloat(balanceSheetData?.assets?.currentAssets?.cash?.[monthIndex]) || 0).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon onClick={() => openTrendModal("Cash", balanceSheetData?.assets?.currentAssets?.cash || [])} />
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Call Accounts
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(Number.parseFloat(balanceSheetData?.assets?.currentAssets?.callAccounts?.[monthIndex]) || 0).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() => openTrendModal("Call Accounts", balanceSheetData?.assets?.currentAssets?.callAccounts || [])}
                  />
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Trade Receivables
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(
                    Number.parseFloat(balanceSheetData?.assets?.currentAssets?.tradeReceivables?.[monthIndex]) || 0
                  ).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() =>
                      openTrendModal("Trade Receivables", balanceSheetData?.assets?.currentAssets?.tradeReceivables || [])
                    }
                  />
                </td>
              </tr>
              <tr style={{ backgroundColor: "#f5f0eb" }}>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    color: "#5d4037",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  Total Current Assets
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  {totalCurrentAssets.toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4" }}></td>
              </tr>

              {/* Fixed Assets - Proper structure: Fixed Assets is a category, items underneath */}
              <tr>
                <td
                  rowSpan={7}
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    color: "#5d4037",
                    fontWeight: "600",
                    fontSize: "13px",
                    verticalAlign: "top",
                  }}
                >
                  Fixed Assets
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Computer Equipment
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(
                    Number.parseFloat(balanceSheetData?.assets?.fixedAssets?.computerEquipment?.[monthIndex]) || 0
                  ).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() =>
                      openTrendModal("Computer Equipment", balanceSheetData?.assets?.fixedAssets?.computerEquipment || [])
                    }
                  />
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Less Depreciation on Computer Equipment
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(
                    Number.parseFloat(balanceSheetData?.assets?.fixedAssets?.lessDepreciationComputer?.[monthIndex]) || 0
                  ).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() =>
                      openTrendModal(
                        "Less Depreciation on Computer Equipment",
                        balanceSheetData?.assets?.fixedAssets?.lessDepreciationComputer || [],
                      )
                    }
                  />
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Vehicles
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(Number.parseFloat(balanceSheetData?.assets?.fixedAssets?.vehicles?.[monthIndex]) || 0).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() => openTrendModal("Vehicles", balanceSheetData?.assets?.fixedAssets?.vehicles || [])}
                  />
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Less Depreciation on Vehicles
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(
                    Number.parseFloat(balanceSheetData?.assets?.fixedAssets?.lessDepreciationVehicles?.[monthIndex]) || 0
                  ).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() =>
                      openTrendModal(
                        "Less Depreciation on Vehicles",
                        balanceSheetData?.assets?.fixedAssets?.lessDepreciationVehicles || [],
                      )
                    }
                  />
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Other Property, Plant & Equipment
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(
                    Number.parseFloat(balanceSheetData?.assets?.fixedAssets?.otherPropertyPlantEquipment?.[monthIndex]) || 0
                  ).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() =>
                      openTrendModal(
                        "Other Property, Plant & Equipment",
                        balanceSheetData?.assets?.fixedAssets?.otherPropertyPlantEquipment || [],
                      )
                    }
                  />
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Total Fixed Assets
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(
                    Number.parseFloat(balanceSheetData?.assets?.fixedAssets?.totalFixedAssets?.[monthIndex]) || 0
                  ).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() =>
                      openTrendModal("Total Fixed Assets", balanceSheetData?.assets?.fixedAssets?.totalFixedAssets || [])
                    }
                  />
                </td>
              </tr>

              {/* Non-Current Assets - FIXED: Loans, Loan Account, Intangible Assets moved here */}
              <tr>
                <td
                  rowSpan={4}
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    color: "#5d4037",
                    fontWeight: "600",
                    fontSize: "13px",
                    verticalAlign: "top",
                  }}
                >
                  Non-Current Assets
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Loans
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(
                    Number.parseFloat(balanceSheetData?.assets?.nonCurrentAssets?.loans?.[monthIndex]) || 0
                  ).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() => openTrendModal("Non-Current Loans", balanceSheetData?.assets?.nonCurrentAssets?.loans || [])}
                  />
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Loan Account
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(
                    Number.parseFloat(balanceSheetData?.assets?.nonCurrentAssets?.loanAccount?.[monthIndex]) || 0
                  ).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() => openTrendModal("Loan Account", balanceSheetData?.assets?.nonCurrentAssets?.loanAccount || [])}
                  />
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Intangible Assets
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(
                    Number.parseFloat(balanceSheetData?.assets?.nonCurrentAssets?.intangibleAssets?.[monthIndex]) || 0
                  ).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() =>
                      openTrendModal("Intangible Assets", balanceSheetData?.assets?.nonCurrentAssets?.intangibleAssets || [])
                    }
                  />
                </td>
              </tr>
              <tr style={{ backgroundColor: "#f5f0eb" }}>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    color: "#5d4037",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  Total Non-Current Assets
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  {totalNonCurrentAssets.toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4" }}></td>
              </tr>

              {/* Total Assets */}
              <tr style={{ backgroundColor: "#5d4037" }}>
                <td colSpan={2} style={{ padding: "12px", color: "#fdfcfb", fontSize: "14px", fontWeight: "700" }}>
                  Total Assets
                </td>
                <td style={{ padding: "12px", textAlign: "right", color: "#fdfcfb", fontSize: "14px" }}>ZAR</td>
                <td
                  style={{ padding: "12px", textAlign: "right", color: "#fdfcfb", fontSize: "14px", fontWeight: "700" }}
                >
                  {totalAssets.toLocaleString()}
                </td>
                <td style={{ padding: "12px" }}></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Liabilities and Equity Side */}
        <div
          style={{
            backgroundColor: "#fdfcfb",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={{ color: "#5d4037", marginBottom: "15px", fontSize: "18px", fontWeight: "700" }}>
            Liabilities and Equity
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#e8ddd4" }}>
                <th style={{ padding: "10px", textAlign: "left", color: "#5d4037", fontSize: "13px" }}>Category</th>
                <th style={{ padding: "10px", textAlign: "left", color: "#5d4037", fontSize: "13px" }}>Item</th>
                <th style={{ padding: "10px", textAlign: "right", color: "#5d4037", fontSize: "13px" }}>Currency</th>
                <th style={{ padding: "10px", textAlign: "right", color: "#5d4037", fontSize: "13px" }}>Amount</th>
                <th style={{ padding: "10px", textAlign: "center", color: "#5d4037", fontSize: "13px" }}>Trend</th>
              </tr>
            </thead>
            <tbody>
              {/* Current Liabilities */}
              <tr>
                <td
                  rowSpan={10}
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    color: "#5d4037",
                    fontWeight: "600",
                    fontSize: "13px",
                    verticalAlign: "top",
                  }}
                >
                  Current Liabilities
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Accounts Payable
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(
                    Number.parseFloat(balanceSheetData?.liabilities?.currentLiabilities?.accountsPayable?.[monthIndex]) || 0
                  ).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() =>
                      openTrendModal(
                        "Accounts Payable",
                        balanceSheetData?.liabilities?.currentLiabilities?.accountsPayable || [],
                      )
                    }
                  />
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Income Received In Advance
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(
                    Number.parseFloat(
                      balanceSheetData?.liabilities?.currentLiabilities?.incomeReceivedInAdvance?.[monthIndex],
                    ) || 0
                  ).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() =>
                      openTrendModal(
                        "Income Received In Advance",
                        balanceSheetData?.liabilities?.currentLiabilities?.incomeReceivedInAdvance || [],
                      )
                    }
                  />
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Provision - Intercompany
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(
                    Number.parseFloat(
                      balanceSheetData?.liabilities?.currentLiabilities?.provisionIntercompany?.[monthIndex],
                    ) || 0
                  ).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() =>
                      openTrendModal(
                        "Provision Intercompany",
                        balanceSheetData?.liabilities?.currentLiabilities?.provisionIntercompany || [],
                      )
                    }
                  />
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Provision for Leave Pay
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(
                    Number.parseFloat(
                      balanceSheetData?.liabilities?.currentLiabilities?.provisionForLeavePay?.[monthIndex],
                    ) || 0
                  ).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() =>
                      openTrendModal(
                        "Provision for Leave Pay",
                        balanceSheetData?.liabilities?.currentLiabilities?.provisionForLeavePay || [],
                      )
                    }
                  />
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Salary control: Medical Fund
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(
                    Number.parseFloat(
                      balanceSheetData?.liabilities?.currentLiabilities?.salaryControlMedicalFund?.[monthIndex],
                    ) || 0
                  ).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() =>
                      openTrendModal(
                        "Salary Control Medical",
                        balanceSheetData?.liabilities?.currentLiabilities?.salaryControlMedicalFund || [],
                      )
                    }
                  />
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Salary control: PAYE/SDL/UIF
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(
                    Number.parseFloat(balanceSheetData?.liabilities?.currentLiabilities?.salaryControlPAYE?.[monthIndex]) ||
                    0
                  ).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() =>
                      openTrendModal(
                        "Salary Control PAYE",
                        balanceSheetData?.liabilities?.currentLiabilities?.salaryControlPAYE || [],
                      )
                    }
                  />
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Salary control: Salaries
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(
                    Number.parseFloat(
                      balanceSheetData?.liabilities?.currentLiabilities?.salaryControlSalaries?.[monthIndex],
                    ) || 0
                  ).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() =>
                      openTrendModal(
                        "Salary Control Salaries",
                        balanceSheetData?.liabilities?.currentLiabilities?.salaryControlSalaries || [],
                      )
                    }
                  />
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  VAT Liability
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(
                    Number.parseFloat(balanceSheetData?.liabilities?.currentLiabilities?.vatLiability?.[monthIndex]) || 0
                  ).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() =>
                      openTrendModal("VAT Liability", balanceSheetData?.liabilities?.currentLiabilities?.vatLiability || [])
                    }
                  />
                </td>
              </tr>
              <tr style={{ backgroundColor: "#f5f0eb" }}>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    color: "#5d4037",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  Total Current Liabilities
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  {totalCurrentLiabilities.toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4" }}></td>
              </tr>

              {/* Non-Current Liabilities - Proper structure: Non-Current Liabilities is a category, items underneath */}
              <tr>
                <td
                  rowSpan={5}
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    color: "#5d4037",
                    fontWeight: "600",
                    fontSize: "13px",
                    verticalAlign: "top",
                  }}
                >
                  Non-Current Liabilities
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Third Party Loans
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(
                    Number.parseFloat(
                      balanceSheetData?.liabilities?.nonCurrentLiabilities?.thirdPartyLoans?.[monthIndex],
                    ) || 0
                  ).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() =>
                      openTrendModal(
                        "Third Party Loans",
                        balanceSheetData?.liabilities?.nonCurrentLiabilities?.thirdPartyLoans || [],
                      )
                    }
                  />
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Intercompany Loans
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(
                    Number.parseFloat(
                      balanceSheetData?.liabilities?.nonCurrentLiabilities?.intercompanyLoans?.[monthIndex],
                    ) || 0
                  ).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() =>
                      openTrendModal(
                        "Intercompany Loans",
                        balanceSheetData?.liabilities?.nonCurrentLiabilities?.intercompanyLoans || [],
                      )
                    }
                  />
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Directors Loans
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(
                    Number.parseFloat(balanceSheetData?.liabilities?.nonCurrentLiabilities?.directorsLoans?.[monthIndex]) ||
                    0
                  ).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() =>
                      openTrendModal(
                        "Directors Loans",
                        balanceSheetData?.liabilities?.nonCurrentLiabilities?.directorsLoans || [],
                      )
                    }
                  />
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Total Non-Current Liabilities
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(
                    Number.parseFloat(
                      balanceSheetData?.liabilities?.nonCurrentLiabilities?.totalNonCurrentLiabilities?.[monthIndex],
                    ) || 0
                  ).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() =>
                      openTrendModal(
                        "Total Non-Current Liabilities",
                        balanceSheetData?.liabilities?.nonCurrentLiabilities?.totalNonCurrentLiabilities || [],
                      )
                    }
                  />
                </td>
              </tr>
              <tr style={{ backgroundColor: "#f5f0eb" }}>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    color: "#5d4037",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  Total Non-Current Liabilities (calculated)
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  {totalNonCurrentLiabilities.toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4" }}></td>
              </tr>

              {/* Total Liabilities */}
              <tr style={{ backgroundColor: "#8d6e63" }}>
                <td colSpan={2} style={{ padding: "10px", color: "#fdfcfb", fontSize: "13px", fontWeight: "600" }}>
                  Total Liabilities
                </td>
                <td style={{ padding: "10px", textAlign: "right", color: "#fdfcfb", fontSize: "13px" }}>ZAR</td>
                <td
                  style={{ padding: "10px", textAlign: "right", color: "#fdfcfb", fontSize: "13px", fontWeight: "600" }}
                >
                  {totalLiabilities.toLocaleString()}
                </td>
                <td style={{ padding: "10px" }}></td>
              </tr>

              {/* Net Assets */}
              <tr style={{ backgroundColor: "#f5f0eb" }}>
                <td colSpan={2} style={{ padding: "10px", color: "#5d4037", fontSize: "13px", fontWeight: "600" }}>
                  Net Assets (=Total assets - Total Liabilities)
                </td>
                <td style={{ padding: "10px", textAlign: "right", color: "#5d4037", fontSize: "13px" }}>ZAR</td>
                <td
                  style={{ padding: "10px", textAlign: "right", color: "#5d4037", fontSize: "13px", fontWeight: "600" }}
                >
                  {netAssets.toLocaleString()}
                </td>
                <td style={{ padding: "10px" }}></td>
              </tr>

              {/* Equity Section */}
              <tr>
                <td
                  rowSpan={5}
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    color: "#5d4037",
                    fontWeight: "600",
                    fontSize: "13px",
                    verticalAlign: "top",
                  }}
                >
                  Equity
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Current Year Earnings
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(Number.parseFloat(balanceSheetData?.equity?.currentYearEarnings?.[monthIndex]) || 0).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() => openTrendModal("Current Year Earnings", balanceSheetData?.equity?.currentYearEarnings || [])}
                  />
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Owner A Share
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(Number.parseFloat(balanceSheetData?.equity?.ownerAShare?.[monthIndex]) || 0).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() => openTrendModal("Owner A Share", balanceSheetData?.equity?.ownerAShare || [])}
                  />
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Capital
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(Number.parseFloat(balanceSheetData?.equity?.capital?.[monthIndex]) || 0).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon onClick={() => openTrendModal("Capital", balanceSheetData?.equity?.capital || [])} />
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", color: "#5d4037", fontSize: "13px" }}>
                  Retained Earnings
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  {(Number.parseFloat(balanceSheetData?.equity?.retainedEarnings?.[monthIndex]) || 0).toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4", textAlign: "center" }}>
                  <TrendChartIcon
                    onClick={() => openTrendModal("Retained Earnings", balanceSheetData?.equity?.retainedEarnings || [])}
                  />
                </td>
              </tr>
              <tr style={{ backgroundColor: "#f5f0eb" }}>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    color: "#5d4037",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  Total Equity
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                  }}
                >
                  ZAR
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e8ddd4",
                    textAlign: "right",
                    color: "#5d4037",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  {totalEquity.toLocaleString()}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #e8ddd4" }}></td>
              </tr>

              {/* Total Liabilities and Capital */}
              <tr style={{ backgroundColor: "#5d4037" }}>
                <td colSpan={2} style={{ padding: "12px", color: "#fdfcfb", fontSize: "14px", fontWeight: "700" }}>
                  Total Liabilities and Capital
                </td>
                <td style={{ padding: "12px", textAlign: "right", color: "#fdfcfb", fontSize: "14px" }}>ZAR</td>
                <td
                  style={{ padding: "12px", textAlign: "right", color: "#fdfcfb", fontSize: "14px", fontWeight: "700" }}
                >
                  {totalLiabilitiesAndCapital.toLocaleString()}
                </td>
                <td style={{ padding: "12px" }}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

 const renderSolvency = () => (
  <div>
    <KeyQuestionBox
      question="Is the business financially solvent and appropriately structured for its current stage? Is the business structurally investable by institutional capital?"
      signals="Leverage, balance sheet strength"
      decisions="Raise equity vs debt, restructure balance sheet"
      section="solvency"
    />
    
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
      {!isInvestorView && (
        <button
          onClick={() => {}}
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
          Add KPI
        </button>
      )}
    </div>
    
    {/* CHANGED: 2 charts per row for Solvency */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
      {renderKPICard("NAV", navData, "nav", "ZAR")}
      {renderKPICard("Equity Ratio", equityData.equityRatio, "equityRatio", "%")}
      {renderKPICard("Liabilities:Assets Ratio", leverageData.totalDebtRatio, "liabilitiesAssetsRatio", "ratio")}
    </div>
  </div>
)
 const renderLeverage = () => (
  <div>
    <KeyQuestionBox
      question="Is the business financially solvent and appropriately structured for its current stage? Is the business structurally investable by institutional capital?"
      signals="Leverage, balance sheet strength"
      decisions="Raise equity vs debt, restructure balance sheet"
      section="leverage"
    />
    
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
      {!isInvestorView && (
        <button
          onClick={() => {}}
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
          Add KPI
        </button>
      )}
    </div>
    
    {/* NEW: Leverage charts */}
   <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
      {renderKPICard("Debt:Equity", solvencyData.debtToEquity, "debtToEquity", "ratio")}
      {renderKPICard("Debt:Assets", leverageData.totalDebtRatio, "debtToAssets", "ratio")}
    </div>
  </div>
)

 const renderEquityTab = () => (
  <div>
    <KeyQuestionBox
      question="Is the business financially solvent and appropriately structured for its current stage? Is the business structurally investable by institutional capital?"
      signals="Leverage, balance sheet strength"
      decisions="Raise equity vs debt, restructure balance sheet"
      section="equity"
    />
    
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
      {!isInvestorView && (
        <button
          onClick={() => {}}
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
          Add KPI
        </button>
      )}
    </div>
    
    {/* NEW: Equity Structure & Capital Discipline charts */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
      {renderKPICard("Ownership % (Equity)", equityData.returnOnEquity, "ownershipEquity", "%")}
      {renderKPICard("Dividend Policy / Capital Retention Behaviour", equityData.bookValuePerShare, "dividendPolicy", "ZAR")}
    </div>
  </div>
)

  if (activeSection !== "capital-structure") return null

  return (
    <div style={{ paddingTop: "20px" }}>
      {/* Sub-tabs */}
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
        {subTabs.map((tab) => (
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

      {/* Sub-tab Content */}
      {activeSubTab === "balance-sheet" && renderBalanceSheet()}
      {activeSubTab === "solvency" && renderSolvency()}
      {activeSubTab === "leverage" && renderLeverage()}
      {activeSubTab === "equity" && renderEquityTab()}

      {/* Trend Modal */}
      {showTrendModal && selectedTrendItem && (
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
              maxWidth: "800px",
              width: "90%",
            }}
          >
            <h3 style={{ color: "#5d4037", marginBottom: "20px" }}>{selectedTrendItem.name} - Monthly Trend</h3>
            <Line
              data={{
                labels: months,
                datasets: [
                  {
                    label: selectedTrendItem.name,
                    data: selectedTrendItem.data.map((v) => Number.parseFloat(v) || 0),
                    borderColor: "#5d4037",
                    backgroundColor: "rgba(93, 64, 55, 0.1)",
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  title: { display: false },
                },
                scales: {
                  y: { beginAtZero: true },
                },
              }}
            />
            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button
                onClick={() => setShowTrendModal(false)}
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Balance Sheet Modal */}
      {showModal && (
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
              maxWidth: "1400px",
              maxHeight: "90vh",
              overflow: "auto",
              width: "95%",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#5d4037" }}>Add Balance Sheet Data</h3>
              <button
                onClick={() => setShowModal(false)}
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
              
              <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                <span style={{ color: "#5d4037", fontSize: "14px" }}>Select Month:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "4px",
                    border: "1px solid #e8ddd4",
                    fontSize: "14px",
                    color: "#5d4037",
                    minWidth: "100px",
                  }}
                >
                  {months.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                <span style={{ color: "#5d4037", fontSize: "14px" }}>Financial Year:</span>
                <select
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "4px",
                    border: "1px solid #e8ddd4",
                    fontSize: "14px",
                    color: "#5d4037",
                    minWidth: "100px",
                  }}
                >
                  <option value="FY-2">FY-2</option>
                  <option value="FY-1">FY-1</option>
                  <option value="FY">FY</option>
                  <option value="FY+1">FY+1</option>
                </select>
              </div>
            </div>

            <p style={{ color: "#8d6e63", marginBottom: "20px", fontSize: "14px" }}>
              Enter values for each month. Use the sub-sections below to input your balance sheet data.
            </p>

            {/* Bank Section */}
            <div style={{ marginBottom: "30px", padding: "15px", backgroundColor: "#f5f0eb", borderRadius: "8px" }}>
              <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>Bank</h4>
              {["callAccounts", "currentAccount"].map((field) => (
                <div key={field} style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      color: "#5d4037",
                      fontWeight: "600",
                      marginBottom: "8px",
                      fontSize: "13px",
                    }}
                  >
                    {field === "callAccounts" ? "Call Accounts" : "Current Account"}
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "5px" }}>
                    {months.map((month, idx) => (
                      <div key={month}>
                        <label style={{ fontSize: "10px", color: "#8d6e63", display: "block", marginBottom: "2px" }}>
                          {month}
                        </label>
                        <input
                          type="number"
                          value={balanceSheetData?.assets?.bank?.[field]?.[idx] || ""}
                          onChange={(e) => {
                            const newData = { ...balanceSheetData }
                            if (!newData.assets.bank[field]) {
                              newData.assets.bank[field] = Array(12).fill("")
                            }
                            newData.assets.bank[field][idx] = e.target.value
                            setBalanceSheetData(newData)
                          }}
                          style={{
                            width: "100%",
                            padding: "6px",
                            borderRadius: "4px",
                            border: "1px solid #e8ddd4",
                            fontSize: "12px",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Current Assets Section */}
            <div style={{ marginBottom: "30px", padding: "15px", backgroundColor: "#f5f0eb", borderRadius: "8px" }}>
              <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>Current Assets</h4>
              {Object.keys(balanceSheetData?.assets?.currentAssets || {}).map((field) => (
                <div key={field} style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      color: "#5d4037",
                      fontWeight: "600",
                      marginBottom: "8px",
                      fontSize: "13px",
                    }}
                  >
                    {field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "5px" }}>
                    {months.map((month, idx) => (
                      <div key={month}>
                        <label style={{ fontSize: "10px", color: "#8d6e63", display: "block", marginBottom: "2px" }}>
                          {month}
                        </label>
                        <input
                          type="number"
                          value={balanceSheetData?.assets?.currentAssets?.[field]?.[idx] || ""}
                          onChange={(e) => {
                            const newData = { ...balanceSheetData }
                            if (!newData.assets.currentAssets[field]) {
                              newData.assets.currentAssets[field] = Array(12).fill("")
                            }
                            newData.assets.currentAssets[field][idx] = e.target.value
                            setBalanceSheetData(newData)
                          }}
                          style={{
                            width: "100%",
                            padding: "6px",
                            borderRadius: "4px",
                            border: "1px solid #e8ddd4",
                            fontSize: "12px",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Fixed Assets Section */}
            <div style={{ marginBottom: "30px", padding: "15px", backgroundColor: "#f5f0eb", borderRadius: "8px" }}>
              <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>Fixed Assets</h4>
              {Object.keys(balanceSheetData?.assets?.fixedAssets || {}).map((field) => (
                <div key={field} style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      color: "#5d4037",
                      fontWeight: "600",
                      marginBottom: "8px",
                      fontSize: "13px",
                    }}
                  >
                    {field === "computerEquipment" ? "Computer Equipment" :
                     field === "lessDepreciationComputer" ? "Less Depreciation on Computer Equipment" :
                     field === "vehicles" ? "Vehicles" :
                     field === "lessDepreciationVehicles" ? "Less Depreciation on Vehicles" :
                     field === "otherPropertyPlantEquipment" ? "Other Property, Plant & Equipment" :
                     field === "totalFixedAssets" ? "Total Fixed Assets" :
                     field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "5px" }}>
                    {months.map((month, idx) => (
                      <div key={month}>
                        <label style={{ fontSize: "10px", color: "#8d6e63", display: "block", marginBottom: "2px" }}>
                          {month}
                        </label>
                        <input
                          type="number"
                          value={balanceSheetData?.assets?.fixedAssets?.[field]?.[idx] || ""}
                          onChange={(e) => {
                            const newData = { ...balanceSheetData }
                            if (!newData.assets.fixedAssets[field]) {
                              newData.assets.fixedAssets[field] = Array(12).fill("")
                            }
                            newData.assets.fixedAssets[field][idx] = e.target.value
                            setBalanceSheetData(newData)
                          }}
                          style={{
                            width: "100%",
                            padding: "6px",
                            borderRadius: "4px",
                            border: "1px solid #e8ddd4",
                            fontSize: "12px",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Non-Current Assets Section */}
            <div style={{ marginBottom: "30px", padding: "15px", backgroundColor: "#f5f0eb", borderRadius: "8px" }}>
              <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>Non-Current Assets</h4>
              {Object.keys(balanceSheetData?.assets?.nonCurrentAssets || {}).map((field) => (
                <div key={field} style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      color: "#5d4037",
                      fontWeight: "600",
                      marginBottom: "8px",
                      fontSize: "13px",
                    }}
                  >
                    {field === "loans" ? "Loans" :
                     field === "loanAccount" ? "Loan Account" :
                     field === "intangibleAssets" ? "Intangible Assets" :
                     field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "5px" }}>
                    {months.map((month, idx) => (
                      <div key={month}>
                        <label style={{ fontSize: "10px", color: "#8d6e63", display: "block", marginBottom: "2px" }}>
                          {month}
                        </label>
                        <input
                          type="number"
                          value={balanceSheetData?.assets?.nonCurrentAssets?.[field]?.[idx] || ""}
                          onChange={(e) => {
                            const newData = { ...balanceSheetData }
                            if (!newData.assets.nonCurrentAssets[field]) {
                              newData.assets.nonCurrentAssets[field] = Array(12).fill("")
                            }
                            newData.assets.nonCurrentAssets[field][idx] = e.target.value
                            setBalanceSheetData(newData)
                          }}
                          style={{
                            width: "100%",
                            padding: "6px",
                            borderRadius: "4px",
                            border: "1px solid #e8ddd4",
                            fontSize: "12px",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Non-Current Liabilities Section */}
            <div style={{ marginBottom: "30px", padding: "15px", backgroundColor: "#f5f0eb", borderRadius: "8px" }}>
              <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>Non-Current Liabilities</h4>
              {Object.keys(balanceSheetData?.liabilities?.nonCurrentLiabilities || {}).map((field) => (
                <div key={field} style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      color: "#5d4037",
                      fontWeight: "600",
                      marginBottom: "8px",
                      fontSize: "13px",
                    }}
                  >
                    {field === "thirdPartyLoans" ? "Third Party Loans" :
                     field === "intercompanyLoans" ? "Intercompany Loans" :
                     field === "directorsLoans" ? "Directors Loans" :
                     field === "totalNonCurrentLiabilities" ? "Total Non-Current Liabilities" :
                     field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "5px" }}>
                    {months.map((month, idx) => (
                      <div key={month}>
                        <label style={{ fontSize: "10px", color: "#8d6e63", display: "block", marginBottom: "2px" }}>
                          {month}
                        </label>
                        <input
                          type="number"
                          value={balanceSheetData?.liabilities?.nonCurrentLiabilities?.[field]?.[idx] || ""}
                          onChange={(e) => {
                            const newData = { ...balanceSheetData }
                            if (!newData.liabilities.nonCurrentLiabilities[field]) {
                              newData.liabilities.nonCurrentLiabilities[field] = Array(12).fill("")
                            }
                            newData.liabilities.nonCurrentLiabilities[field][idx] = e.target.value
                            setBalanceSheetData(newData)
                          }}
                          style={{
                            width: "100%",
                            padding: "6px",
                            borderRadius: "4px",
                            border: "1px solid #e8ddd4",
                            fontSize: "12px",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Equity Section */}
            <div style={{ marginBottom: "30px", padding: "15px", backgroundColor: "#f5f0eb", borderRadius: "8px" }}>
              <h4 style={{ color: "#5d4037", marginBottom: "15px" }}>Equity</h4>
              {Object.keys(balanceSheetData?.equity || {}).map((field) => (
                <div key={field} style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      color: "#5d4037",
                      fontWeight: "600",
                      marginBottom: "8px",
                      fontSize: "13px",
                    }}
                  >
                    {field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "5px" }}>
                    {months.map((month, idx) => (
                      <div key={month}>
                        <label style={{ fontSize: "10px", color: "#8d6e63", display: "block", marginBottom: "2px" }}>
                          {month}
                        </label>
                        <input
                          type="number"
                          value={balanceSheetData?.equity?.[field]?.[idx] || ""}
                          onChange={(e) => {
                            const newData = { ...balanceSheetData }
                            if (!newData.equity[field]) {
                              newData.equity[field] = Array(12).fill("")
                            }
                            newData.equity[field][idx] = e.target.value
                            setBalanceSheetData(newData)
                          }}
                          style={{
                            width: "100%",
                            padding: "6px",
                            borderRadius: "4px",
                            border: "1px solid #e8ddd4",
                            fontSize: "12px",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowModal(false)}
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
                onClick={saveCapitalStructureData}
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
      )}
    </div>
  )
}

// Performance Engine Component
const PerformanceEngine = ({
  activeSection,
  viewMode,
  financialYearStart,
  pnlData,
  user,
  onUpdateChartData,
  isInvestorView,
}) => {
 const [visibleCharts, setVisibleCharts] = useState({
  sales: true,
  cogs: true,
  opex: true,
  grossProfit: true,
  netProfit: true,
  // Remove these since we're not showing separate margin charts
  ebitda: false,
  gpMargin: false,
  npMargin: false,
})
  const [showModal, setShowModal] = useState(false)
  const [showVariance, setShowVariance] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState({})
  const [pnlDetails, setPnlDetails] = useState({
    sales: Array(12).fill(""),
    cogs: Array(12).fill(""),
    opex: Array(12).fill(""),
    tax: Array(12).fill(""),
    interestExpense: Array(12).fill(""),
    depreciation: Array(12).fill(""),
    salesBudget: Array(12).fill(""),
    cogsBudget: Array(12).fill(""),
    opexBudget: Array(12).fill(""),
    taxBudget: Array(12).fill(""),
    interestExpenseBudget: Array(12).fill(""),
    depreciationBudget: Array(12).fill(""),
    notes: "",
  })
  const [chartNotes, setChartNotes] = useState({
    sales: "",
    cogs: "",
    opex: "",
    grossProfit: "",
    netProfit: "",
    ebitda: "",
    gpMargin: "",
    npMargin: "",
  })
  const [chartAnalysis, setChartAnalysis] = useState({
    sales: "",
    cogs: "",
    opex: "",
    grossProfit: "",
    netProfit: "",
    ebitda: "",
    gpMargin: "",
    npMargin: "",
  })
  const [firebaseChartData, setFirebaseChartData] = useState({})
  const [loading, setLoading] = useState(false)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selectedFinancialYearStart, setSelectedFinancialYearStart] = useState("Jan")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [showAddKPIModal, setShowAddKPIModal] = useState(false)
  const [newKPI, setNewKPI] = useState({
    name: "",
    type: "bar",
    dataType: "currency",
  })
  const [customKPIs, setCustomKPIs] = useState({})
  const [selectedViewMode, setSelectedViewMode] = useState("month")

  useEffect(() => {
    if (user) {
      loadPnLDataFromFirebase()
      loadCustomKPIs()
    }
  }, [user])

  const loadPnLDataFromFirebase = async () => {
    if (!user) return

    setLoading(true)
    try {
      const pnlManualDoc = await getDoc(doc(db, "financialData", `${user.uid}_pnlManual`))

      if (pnlManualDoc.exists()) {
        const firebaseData = pnlManualDoc.data()
        console.log("Loaded PnL data from Firebase:", firebaseData)

        setPnlDetails((prev) => ({
          sales: firebaseData.sales?.map(String) || Array(12).fill(""),
          cogs: firebaseData.cogs?.map(String) || Array(12).fill(""),
          opex: firebaseData.opex?.map(String) || Array(12).fill(""),
          tax: firebaseData.tax?.map(String) || Array(12).fill(""),
          interestExpense: firebaseData.interestExpense?.map(String) || Array(12).fill(""),
          depreciation: firebaseData.depreciation?.map(String) || Array(12).fill(""),
          salesBudget: firebaseData.salesBudget?.map(String) || Array(12).fill(""),
          cogsBudget: firebaseData.cogsBudget?.map(String) || Array(12).fill(""),
          opexBudget: firebaseData.opexBudget?.map(String) || Array(12).fill(""),
          taxBudget: firebaseData.taxBudget?.map(String) || Array(12).fill(""),
          interestExpenseBudget: firebaseData.interestExpenseBudget?.map(String) || Array(12).fill(""),
          depreciationBudget: firebaseData.depreciationBudget?.map(String) || Array(12).fill(""),
          notes: firebaseData.notes || "",
        }))

        if (firebaseData.chartNotes) {
          setChartNotes(firebaseData.chartNotes)
        }

        if (firebaseData.chartAnalysis) {
          setChartAnalysis(firebaseData.chartAnalysis)
        }

        if (firebaseData.financialYearStart) {
          setSelectedFinancialYearStart(firebaseData.financialYearStart)
        }

        if (firebaseData.year) {
          setSelectedYear(firebaseData.year)
        }

        processFirebaseDataForCharts(firebaseData)
      } else {
        console.log("No PnL data found in Firebase")
        setFirebaseChartData({})
      }
    } catch (error) {
      console.error("Error loading PnL data from Firebase:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadCustomKPIs = async () => {
    if (!user) return

    try {
      const kpiQuery = query(
        collection(db, "financialData"),
        where("userId", "==", user.uid),
        where("isCustomKPI", "==", true),
        where("section", "==", "performance-engine"),
      )
      const querySnapshot = await getDocs(kpiQuery)

      const kpis = {}
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        kpis[data.chartName] = data
        setVisibleCharts((prev) => ({
          ...prev,
          [data.chartName]: true,
        }))
      })

      setCustomKPIs(kpis)
    } catch (error) {
      console.error("Error loading custom KPIs:", error)
    }
  }

  const processFirebaseDataForCharts = (firebaseData) => {
    const sales = firebaseData.sales?.map((val) => Number.parseFloat(val) || 0) || Array(12).fill(0)
    const cogs = firebaseData.cogs?.map((val) => Number.parseFloat(val) || 0) || Array(12).fill(0)
    const opex = firebaseData.opex?.map((val) => Number.parseFloat(val) || 0) || Array(12).fill(0)
    const tax = firebaseData.tax?.map((val) => Number.parseFloat(val) || 0) || Array(12).fill(0)
    const interestExpense = firebaseData.interestExpense?.map((val) => Number.parseFloat(val) || 0) || Array(12).fill(0)
    const depreciation = firebaseData.depreciation?.map((val) => Number.parseFloat(val) || 0) || Array(12).fill(0)

    const salesBudget = firebaseData.salesBudget?.map((val) => Number.parseFloat(val) || 0) || Array(12).fill(0)
    const cogsBudget = firebaseData.cogsBudget?.map((val) => Number.parseFloat(val) || 0) || Array(12).fill(0)
    const opexBudget = firebaseData.opexBudget?.map((val) => Number.parseFloat(val) || 0) || Array(12).fill(0)
    const taxBudget = firebaseData.taxBudget?.map((val) => Number.parseFloat(val) || 0) || Array(12).fill(0)
    const interestExpenseBudget =
      firebaseData.interestExpenseBudget?.map((val) => Number.parseFloat(val) || 0) || Array(12).fill(0)
    const depreciationBudget =
      firebaseData.depreciationBudget?.map((val) => Number.parseFloat(val) || 0) || Array(12).fill(0)

    const grossProfit = sales.map((s, i) => s - cogs[i])
    const grossProfitBudget = salesBudget.map((s, i) => s - cogsBudget[i])

    const ebitda = grossProfit.map((gp, i) => gp - opex[i])
    const ebitdaBudget = grossProfitBudget.map((gp, i) => gp - opexBudget[i])

    const netProfit = ebitda.map((e, i) => e - tax[i] - interestExpense[i] - depreciation[i])
    const netProfitBudget = ebitdaBudget.map(
      (e, i) => e - taxBudget[i] - interestExpenseBudget[i] - depreciationBudget[i],
    )

    const gpMargin = sales.map((s, i) => (s !== 0 ? (grossProfit[i] / s) * 100 : 0))
    const gpMarginBudget = salesBudget.map((s, i) => (s !== 0 ? (grossProfitBudget[i] / s) * 100 : 0))

    const npMargin = sales.map((s, i) => (s !== 0 ? (netProfit[i] / s) * 100 : 0))
    const npMarginBudget = salesBudget.map((s, i) => (s !== 0 ? (netProfitBudget[i] / s) * 100 : 0))

  const chartData = {
  sales: { actual: sales.map((val) => val / 1000000), budget: salesBudget.map((val) => val / 1000000) },
  cogs: { actual: cogs.map((val) => val / 1000000), budget: cogsBudget.map((val) => val / 1000000) },
  opex: { actual: opex.map((val) => val / 1000000), budget: opexBudget.map((val) => val / 1000000) },
  grossProfit: {
    actual: grossProfit.map((val) => val / 1000000),
    budget: grossProfitBudget.map((val) => val / 1000000),
  },
  netProfit: { actual: netProfit.map((val) => val / 1000000), budget: netProfitBudget.map((val) => val / 1000000) },
  // Remove gpMargin and npMargin from here since we're not using separate margin charts
}

    setFirebaseChartData(chartData)

    if (onUpdateChartData) {
      Object.keys(chartData).forEach((key) => {
        onUpdateChartData(key, chartData[key])
      })
    }
  }

  if (activeSection !== "performance-engine") return null

  const generateLabels = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const startMonthIndex = months.indexOf(selectedFinancialYearStart)
    const orderedMonths = [...months.slice(startMonthIndex), ...months.slice(0, startMonthIndex)]

    if (selectedViewMode === "month") {
      return orderedMonths
    } else if (selectedViewMode === "quarter") {
      return ["Q1", "Q2", "Q3", "Q4"]
    } else {
      return [selectedYear.toString()]
    }
  }

  const aggregateDataForView = (data) => {
    if (selectedViewMode === "month") {
      return data
    } else if (selectedViewMode === "quarter") {
      const quarters = []
      for (let i = 0; i < 4; i++) {
        const sum = data.slice(i * 3, i * 3 + 3).reduce((acc, val) => acc + val, 0)
        quarters.push(sum)
      }
      return quarters
    } else {
      return [data.reduce((acc, val) => acc + val, 0)]
    }
  }

  const labels = generateLabels()

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
      const firebaseData = {
        userId: user.uid,
        chartName: "pnlManual",
        sales: pnlDetails.sales.map((val) => Number.parseFloat(val) || 0),
        cogs: pnlDetails.cogs.map((val) => Number.parseFloat(val) || 0),
        opex: pnlDetails.opex.map((val) => Number.parseFloat(val) || 0),
        tax: pnlDetails.tax.map((val) => Number.parseFloat(val) || 0),
        interestExpense: pnlDetails.interestExpense.map((val) => Number.parseFloat(val) || 0),
        depreciation: pnlDetails.depreciation.map((val) => Number.parseFloat(val) || 0),
        salesBudget: pnlDetails.salesBudget.map((val) => Number.parseFloat(val) || 0),
        cogsBudget: pnlDetails.cogsBudget.map((val) => Number.parseFloat(val) || 0),
        opexBudget: pnlDetails.opexBudget.map((val) => Number.parseFloat(val) || 0),
        taxBudget: pnlDetails.taxBudget.map((val) => Number.parseFloat(val) || 0),
        interestExpenseBudget: pnlDetails.interestExpenseBudget.map((val) => Number.parseFloat(val) || 0),
        depreciationBudget: pnlDetails.depreciationBudget.map((val) => Number.parseFloat(val) || 0),
        notes: pnlDetails.notes,
        chartNotes: chartNotes,
        chartAnalysis: chartAnalysis,
        financialYearStart: selectedFinancialYearStart,
        year: selectedYear,
        lastUpdated: new Date().toISOString(),
      }

      await setDoc(doc(db, "financialData", `${user.uid}_pnlManual`), firebaseData)
      console.log("P&L data saved to Firebase")

      processFirebaseDataForCharts(firebaseData)
      setShowModal(false)
    } catch (error) {
      console.error("Error saving P&L data:", error)
      alert("Error saving P&L data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleAddNotes = (chartName) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [chartName]: !prev[chartName],
    }))
  }

  const handleAIAnalysis = (chartName) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [`${chartName}_analysis`]: !prev[`${chartName}_analysis`],
    }))
  }

  const updateChartNote = (chartName, note) => {
    setChartNotes((prev) => ({
      ...prev,
      [chartName]: note,
    }))
  }

  const updateChartAnalysis = (chartName, analysis) => {
    setChartAnalysis((prev) => ({
      ...prev,
      [chartName]: analysis,
    }))
  }

  const createChartData = (chartName, isPercentage = false) => {
    const data = firebaseChartData[chartName] || { actual: [], budget: [] }
    const actualData = aggregateDataForView(data.actual)
    const budgetData = aggregateDataForView(data.budget)
    const varianceData = actualData.map((val, i) => val - budgetData[i])

    if (showVariance) {
      return {
        labels,
        datasets: [
          {
            type: "bar",
            label: "Variance",
            data: varianceData,
            backgroundColor: varianceData.map((v) => (v >= 0 ? "rgba(62, 113, 75, 0.6)" : "rgba(139, 69, 19, 0.6)")),
            borderColor: varianceData.map((v) => (v >= 0 ? "rgb(62, 113, 75)" : "rgb(139, 69, 19)")),
            borderWidth: 2,
          },
        ],
      }
    }

    return {
      labels,
      datasets: [
        {
          type: "bar",
          label: "Actual",
          data: actualData,
          backgroundColor: "rgba(93, 64, 55, 0.6)",
          borderColor: "rgb(93, 64, 55)",
          borderWidth: 2,
        },
        {
          type: "line",
          label: "Budget",
          data: budgetData,
          borderColor: "#5d4037",
          backgroundColor: "rgba(93, 64, 55, 0.1)",
          borderWidth: 2,
          tension: 0.1,
          fill: false,
        },
      ],
    }
  }

  const createCustomKPIChartData = (kpiData) => {
    const actualData = aggregateDataForView(kpiData.actual || [])
    const budgetData = aggregateDataForView(kpiData.budget || [])
    const varianceData = actualData.map((val, i) => val - budgetData[i])

    if (showVariance) {
      return {
        labels,
        datasets: [
          {
            type: "bar",
            label: "Variance",
            data: varianceData,
            backgroundColor: varianceData.map((v) => (v >= 0 ? "rgba(62, 113, 75, 0.6)" : "rgba(139, 69, 19, 0.6)")),
            borderColor: varianceData.map((v) => (v >= 0 ? "rgb(62, 113, 75)" : "rgb(139, 69, 19)")),
            borderWidth: 2,
          },
        ],
      }
    }

    return {
      labels,
      datasets: [
        {
          type: kpiData.type === "line" ? "line" : "bar",
          label: "Actual",
          data: actualData,
          backgroundColor: kpiData.type === "line" ? "rgba(93, 64, 55, 0.1)" : "rgba(93, 64, 55, 0.6)",
          borderColor: "rgb(93, 64, 55)",
          borderWidth: 2,
          fill: kpiData.type === "line",
          tension: 0.1,
        },
        {
          type: "line",
          label: "Budget",
          data: budgetData,
          borderColor: "#5d4037",
          backgroundColor: "rgba(93, 64, 55, 0.1)",
          borderWidth: 2,
          tension: 0.1,
          fill: false,
        },
      ],
    }
  }

  const chartOptions = (title, isPercentage = false) => ({
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      title: {
        display: true,
        text: title,
        color: "#5d4037",
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw
            return isPercentage
              ? `${context.dataset.label}: ${value.toFixed(2)}%`
              : `${context.dataset.label}: R${value.toFixed(2)}m`
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: false,
        },
      },
      x: {
        title: {
          display: false,
        },
      },
    },
  })

  const customKPIOptions = (title, dataType = "currency") => ({
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      title: {
        display: true,
        text: title,
        color: "#5d4037",
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw
            if (dataType === "percentage") {
              return `${context.dataset.label}: ${value.toFixed(2)}%`
            } else if (dataType === "currency") {
              return `${context.dataset.label}: R${value.toFixed(2)}m`
            } else {
              return `${context.dataset.label}: ${value.toFixed(2)}`
            }
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: false,
        },
      },
      x: {
        title: {
          display: false,
        },
      },
    },
  })

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push(i)
    }
    return years
  }

  const updatePnlDetailValue = (category, monthIndex, value) => {
    setPnlDetails((prev) => ({
      ...prev,
      [category]: prev[category].map((val, idx) => (idx === monthIndex ? value : val)),
    }))
  }

  const renderMonthlyInputs = (category, label) => {
    const startMonthIndex = months.indexOf(selectedFinancialYearStart)
    const orderedMonths = [...months.slice(startMonthIndex), ...months.slice(0, startMonthIndex)]

    return (
      <div style={{ marginBottom: "20px" }}>
        <h5 style={{ color: "#5d4037", marginBottom: "15px", fontWeight: "600" }}>{label}</h5>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "10px",
          }}
        >
          {orderedMonths.map((month, displayIndex) => {
            const actualIndex = months.indexOf(month)
            return (
              <div key={month} style={{ display: "flex", flexDirection: "column" }}>
                <label
                  style={{
                    fontSize: "12px",
                    color: "#8d6e63",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  {month}
                </label>
                <input
                  type="number"
                  value={pnlDetails[category][actualIndex] || ""}
                  onChange={(e) => updatePnlDetailValue(category, actualIndex, e.target.value)}
                  placeholder="0"
                  style={{
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #e8ddd4",
                    fontSize: "14px",
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const handleAddKPI = () => {
    setShowAddKPIModal(true)
  }

  const handleSaveKPI = async () => {
    if (!user || !newKPI.name.trim()) {
      alert("Please enter a name for the new KPI")
      return
    }

    try {
      const chartName = newKPI.name.toLowerCase().replace(/\s+/g, "_")
      const kpiData = {
        userId: user.uid,
        chartName: chartName,
        name: newKPI.name,
        type: newKPI.type,
        dataType: newKPI.dataType,
        actual: Array(12).fill(0),
        budget: Array(12).fill(0),
        isCustomKPI: true,
        section: "performance-engine",
        lastUpdated: new Date().toISOString(),
      }

      await setDoc(doc(db, "financialData", `${user.uid}_${chartName}`), kpiData)
      console.log("New KPI saved to Firebase")

      setCustomKPIs((prev) => ({
        ...prev,
        [chartName]: kpiData,
      }))

      setVisibleCharts((prev) => ({
        ...prev,
        [chartName]: true,
      }))

      setNewKPI({
        name: "",
        type: "bar",
        dataType: "currency",
      })
      setShowAddKPIModal(false)
    } catch (error) {
      console.error("Error saving KPI:", error)
      alert("Error saving KPI. Please try again.")
    }
  }

  const chartConfigs = [
  { key: "sales", title: "Revenue", visible: visibleCharts.sales },
  { key: "cogs", title: "COGS", visible: visibleCharts.cogs },
  { key: "opex", title: "Opex", visible: visibleCharts.opex },
  { key: "grossProfit", title: "GP & GP Margin", visible: visibleCharts.grossProfit },
  { key: "netProfit", title: "NP & NP Margin", visible: visibleCharts.netProfit },
]

  

  return (
    <div style={{ paddingTop: "20px" }}>
      <KeyQuestionBox
        question="Is the business economically working?"
        signals="Margin trends, profitability direction"
        decisions="Fix pricing, cost control, growth pacing"
        section="performance-engine"
      />

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
        <h2 style={{ color: "#5d4037", fontSize: "24px", fontWeight: "700" }}>Performance Engine</h2>

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
            <button
              onClick={handleAddDetails}
              style={{
                padding: "10px 20px",
                backgroundColor: "#5d4037",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                transition: "all 0.3s ease",
              }}
            >
              Add Data
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <button
          onClick={() => setShowVariance(!showVariance)}
          style={{
            padding: "10px 20px",
            backgroundColor: showVariance ? "#5d4037" : "#e8ddd4",
            color: showVariance ? "#fdfcfb" : "#5d4037",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
            transition: "all 0.3s ease",
          }}
        >
          {showVariance ? "Show Actual/Budget" : "Show Variance"}
        </button>
        
        {!isInvestorView && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleAddKPI}
              style={{
                padding: "10px 20px",
                backgroundColor: "#5d4037",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                transition: "all 0.3s ease",
              }}
            >
              Add KPI
            </button>
          </div>
        )}
      </div>

      {/* Chart Grid - 2 per row */}
     <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
    marginBottom: "30px",
  }}
>
        {chartConfigs
          .filter((config) => config.visible)
          .map((config) => (
            <div
              key={config.key}
              style={{
                backgroundColor: "#fdfcfb",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <Bar data={createChartData(config.key)} options={chartOptions(config.title)} />

              {!isInvestorView && (
                <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => handleAddNotes(config.key)}
                    style={{
                      padding: "8px 16px",
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
                    onClick={() => handleAIAnalysis(config.key)}
                    style={{
                      padding: "8px 16px",
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
              )}

              {expandedNotes[config.key] && (
                <div style={{ marginTop: "15px" }}>
                  <label
                    style={{
                      fontSize: "12px",
                      color: "#5d4037",
                      fontWeight: "600",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    Notes:
                  </label>
                  <textarea
                    value={chartNotes[config.key] || ""}
                    onChange={(e) => updateChartNote(config.key, e.target.value)}
                    placeholder="Add notes..."
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

              {expandedNotes[`${config.key}_analysis`] && (
                <div
                  style={{
                    backgroundColor: "#e3f2fd",
                    padding: "15px",
                    borderRadius: "6px",
                    border: "1px solid #90caf9",
                    marginTop: "15px",
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
                    {chartAnalysis[config.key] ||
                      "AI analysis will be generated based on your data trends, comparing current performance against historical averages and industry benchmarks. This feature provides actionable insights for improving this metric."}
                  </p>
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Margin Charts */}
    

      {/* Custom KPIs */}
      {Object.keys(customKPIs).length > 0 && (
        <>
          <h3 style={{ color: "#5d4037", fontSize: "20px", fontWeight: "600", marginBottom: "15px" }}>Custom KPIs</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
            {Object.values(customKPIs).map((kpi) => (
              <div
                key={kpi.chartName}
                style={{
                  backgroundColor: "#fdfcfb",
                  padding: "20px",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                {kpi.type === "line" ? (
                  <Line data={createCustomKPIChartData(kpi)} options={customKPIOptions(kpi.name, kpi.dataType)} />
                ) : (
                  <Bar data={createCustomKPIChartData(kpi)} options={customKPIOptions(kpi.name, kpi.dataType)} />
                )}
                
                {!isInvestorView && (
                  <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => handleAddNotes(kpi.chartName)}
                      style={{
                        padding: "8px 16px",
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
                      onClick={() => handleAIAnalysis(kpi.chartName)}
                      style={{
                        padding: "8px 16px",
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
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Details Modal */}
      {showModal && (
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
              maxWidth: "1200px",
              maxHeight: "90vh",
              overflow: "auto",
              width: "95%",
            }}
          >
            <h3 style={{ color: "#5d4037", marginBottom: "20px" }}>Add P&L Data</h3>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Financial Year Start:
              </label>
              <select
                value={selectedFinancialYearStart}
                onChange={(e) => setSelectedFinancialYearStart(e.target.value)}
                style={{
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  marginBottom: "20px",
                  minWidth: "150px",
                }}
              >
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>

              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#5d4037",
                  fontWeight: "600",
                  marginLeft: "20px",
                }}
              >
                Year:
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number.parseInt(e.target.value))}
                style={{
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  marginBottom: "20px",
                  minWidth: "150px",
                  marginLeft: "20px",
                }}
              >
                {generateYearOptions().map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "30px" }}>
              <h4 style={{ color: "#5d4037", marginBottom: "20px", fontSize: "18px" }}>Actual Data</h4>

              {renderMonthlyInputs("sales", "Sales / Revenue (R m)")}
              {renderMonthlyInputs("cogs", "COGS (R m)")}
              {renderMonthlyInputs("opex", "Opex (R m)")}
              {renderMonthlyInputs("tax", "Tax (R m)")}
              {renderMonthlyInputs("interestExpense", "Interest Expense (R m)")}
              {renderMonthlyInputs("depreciation", "Depreciation (R m)")}
            </div>

            <div style={{ marginBottom: "30px" }}>
              <h4 style={{ color: "#5d4037", marginBottom: "20px", fontSize: "18px" }}>Budget Data</h4>

              {renderMonthlyInputs("salesBudget", "Sales Budget (R m)")}
              {renderMonthlyInputs("cogsBudget", "COGS Budget (R m)")}
              {renderMonthlyInputs("opexBudget", "Opex Budget (R m)")}
              {renderMonthlyInputs("taxBudget", "Tax Budget (R m)")}
              {renderMonthlyInputs("interestExpenseBudget", "Interest Expense Budget (R m)")}
              {renderMonthlyInputs("depreciationBudget", "Depreciation Budget (R m)")}
            </div>

            <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
              Notes:
            </label>
            <textarea
              value={pnlDetails.notes}
              onChange={(e) => setPnlDetails({ ...pnlDetails, notes: e.target.value })}
              placeholder="Add any additional notes..."
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "20px",
                borderRadius: "4px",
                border: "1px solid #e8ddd4",
                minHeight: "100px",
              }}
            />

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowModal(false)}
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
                onClick={handleSavePnlDetails}
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
      )}

      {/* Add KPI Modal */}
      {showAddKPIModal && (
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
              maxWidth: "500px",
              width: "90%",
            }}
          >
            <h3 style={{ color: "#5d4037", marginBottom: "20px" }}>Add KPI</h3>

            <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
              KPI Name:
            </label>
            <input
              type="text"
              value={newKPI.name}
              onChange={(e) => setNewKPI({ ...newKPI, name: e.target.value })}
              placeholder="e.g., Customer Acquisition Cost"
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "20px",
                borderRadius: "4px",
                border: "1px solid #e8ddd4",
              }}
            />

            <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
              Chart Type:
            </label>
            <select
              value={newKPI.type}
              onChange={(e) => setNewKPI({ ...newKPI, type: e.target.value })}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "20px",
                borderRadius: "4px",
                border: "1px solid #e8ddd4",
              }}
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
            </select>

            <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
              Data Type:
            </label>
            <select
              value={newKPI.dataType}
              onChange={(e) => setNewKPI({ ...newKPI, dataType: e.target.value })}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "20px",
                borderRadius: "4px",
                border: "1px solid #e8ddd4",
              }}
            >
              <option value="currency">Currency (R m)</option>
              <option value="percentage">Percentage (%)</option>
              <option value="number">Number</option>
            </select>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowAddKPIModal(false)}
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
                onClick={handleSaveKPI}
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
                Save KPI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Cost Agility Component
const CostAgility = ({ activeSection, viewMode, user, onUpdateChartData, isInvestorView }) => {
  const [showModal, setShowModal] = useState(false)
  const [costDetails, setCostDetails] = useState({
    fixedCosts: Array(12).fill(""),
    variableCosts: Array(12).fill(""),
    discretionaryCosts: Array(12).fill(""),
    lockInDuration: Array(12).fill(""),
    notes: "",
  })
  const [firebaseChartData, setFirebaseChartData] = useState({})
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState("Jan")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedViewMode, setSelectedViewMode] = useState("month")
  const [expandedNotes, setExpandedNotes] = useState({})
  const [chartNotes, setChartNotes] = useState({})
  const [chartAnalysis, setChartAnalysis] = useState({})
  const [showAddKPIModal, setShowAddKPIModal] = useState(false)
  const [newKPI, setNewKPI] = useState({
    name: "",
    type: "bar",
    dataType: "currency",
  })
  const [customKPIs, setCustomKPIs] = useState({})

  useEffect(() => {
    if (user) {
      loadCostDataFromFirebase()
      loadCustomKPIs()
    }
  }, [user])

  const loadCostDataFromFirebase = async () => {
    if (!user) return

    setLoading(true)
    try {
      const costDoc = await getDoc(doc(db, "financialData", `${user.uid}_costAgility`))

      if (costDoc.exists()) {
        const firebaseData = costDoc.data()
        setCostDetails({
          fixedCosts: firebaseData.fixedCosts?.map(String) || Array(12).fill(""),
          variableCosts: firebaseData.variableCosts?.map(String) || Array(12).fill(""),
          discretionaryCosts: firebaseData.discretionaryCosts?.map(String) || Array(12).fill(""),
          lockInDuration: firebaseData.lockInDuration?.map(String) || Array(12).fill(""),
          notes: firebaseData.notes || "",
        })
        processFirebaseDataForCharts(firebaseData)
      }
    } catch (error) {
      console.error("Error loading cost data from Firebase:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadCustomKPIs = async () => {
    if (!user) return

    try {
      const kpiQuery = query(
        collection(db, "financialData"),
        where("userId", "==", user.uid),
        where("isCustomKPI", "==", true),
        where("section", "==", "cost-agility"),
      )
      const querySnapshot = await getDocs(kpiQuery)

      const kpis = {}
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        kpis[data.chartName] = data
      })

      setCustomKPIs(kpis)
    } catch (error) {
      console.error("Error loading custom KPIs:", error)
    }
  }

  const processFirebaseDataForCharts = (firebaseData) => {
    const fixedCosts = firebaseData.fixedCosts?.map((val) => Number.parseFloat(val) || 0) || Array(12).fill(0)
    const variableCosts = firebaseData.variableCosts?.map((val) => Number.parseFloat(val) || 0) || Array(12).fill(0)
    const discretionaryCosts =
      firebaseData.discretionaryCosts?.map((val) => Number.parseFloat(val) || 0) || Array(12).fill(0)
    const lockInDuration = firebaseData.lockInDuration?.map((val) => Number.parseFloat(val) || 0) || Array(12).fill(0)

    const chartData = {
      fixedCosts: { actual: fixedCosts.map((val) => val / 1000000) },
      variableCosts: { actual: variableCosts.map((val) => val / 1000000) },
      discretionaryCosts: { actual: discretionaryCosts.map((val) => val / 1000000) },
      lockInDuration: { actual: lockInDuration },
    }

    setFirebaseChartData(chartData)

    if (onUpdateChartData) {
      Object.keys(chartData).forEach((key) => {
        onUpdateChartData(key, chartData[key])
      })
    }
  }

  if (activeSection !== "cost-agility") return null

  const generateLabels = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
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
      return data
    } else if (selectedViewMode === "quarter") {
      const quarters = []
      for (let i = 0; i < 4; i++) {
        const sum = data.slice(i * 3, i * 3 + 3).reduce((acc, val) => acc + val, 0)
        quarters.push(sum)
      }
      return quarters
    } else {
      return [data.reduce((acc, val) => acc + val, 0)]
    }
  }

  const labels = generateLabels()

  const handleSaveCostDetails = async () => {
    if (!user) {
      alert("Please log in to save cost data")
      return
    }

    setLoading(true)
    try {
      const firebaseData = {
        userId: user.uid,
        chartName: "costAgility",
        fixedCosts: costDetails.fixedCosts.map((val) => Number.parseFloat(val) || 0),
        variableCosts: costDetails.variableCosts.map((val) => Number.parseFloat(val) || 0),
        discretionaryCosts: costDetails.discretionaryCosts.map((val) => Number.parseFloat(val) || 0),
        lockInDuration: costDetails.lockInDuration.map((val) => Number.parseFloat(val) || 0),
        notes: costDetails.notes,
        lastUpdated: new Date().toISOString(),
      }

      await setDoc(doc(db, "financialData", `${user.uid}_costAgility`), firebaseData)
      console.log("Cost data saved to Firebase")

      processFirebaseDataForCharts(firebaseData)
      setShowModal(false)
    } catch (error) {
      console.error("Error saving cost data:", error)
      alert("Error saving cost data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const createChartData = (dataKey) => {
    const data = firebaseChartData[dataKey] || { actual: [] }
    const actualData = aggregateDataForView(data.actual)
    return {
      labels,
      datasets: [
        {
          label: "Actual",
          data: actualData,
          backgroundColor: "rgba(93, 64, 55, 0.6)",
          borderColor: "rgb(93, 64, 55)",
          borderWidth: 2,
        },
      ],
    }
  }

  const createCustomKPIChartData = (kpiData) => {
    const actualData = aggregateDataForView(kpiData.actual || [])
    return {
      labels,
      datasets: [
        {
          type: kpiData.type === "line" ? "line" : "bar",
          label: "Actual",
          data: actualData,
          backgroundColor: kpiData.type === "line" ? "rgba(93, 64, 55, 0.1)" : "rgba(93, 64, 55, 0.6)",
          borderColor: "rgb(93, 64, 55)",
          borderWidth: 2,
          fill: kpiData.type === "line",
          tension: 0.1,
        },
      ],
    }
  }

  const chartOptions = (title) => ({
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: title,
        color: "#5d4037",
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  })

  const customKPIOptions = (title, dataType = "currency") => ({
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: title,
        color: "#5d4037",
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw
            if (dataType === "percentage") {
              return `${context.dataset.label}: ${value.toFixed(2)}%`
            } else if (dataType === "currency") {
              return `${context.dataset.label}: R${value.toFixed(2)}m`
            } else {
              return `${context.dataset.label}: ${value.toFixed(2)}`
            }
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  })

  const handleAddNotes = (chartName) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [chartName]: !prev[chartName],
    }))
  }

  const handleAIAnalysis = (chartName) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [`${chartName}_analysis`]: !prev[`${chartName}_analysis`],
    }))
  }

  const updateChartNote = (chartName, note) => {
    setChartNotes((prev) => ({
      ...prev,
      [chartName]: note,
    }))
  }

  const updateChartAnalysis = (chartName, analysis) => {
    setChartAnalysis((prev) => ({
      ...prev,
      [chartName]: analysis,
    }))
  }

  const renderMonthlyInputs = (category, label) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    return (
      <div style={{ marginBottom: "20px" }}>
        <h5 style={{ color: "#5d4037", marginBottom: "15px", fontWeight: "600" }}>{label}</h5>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "10px",
          }}
        >
          {months.map((month, index) => (
            <div key={month} style={{ display: "flex", flexDirection: "column" }}>
              <label
                style={{
                  fontSize: "12px",
                  color: "#8d6e63",
                  marginBottom: "5px",
                  fontWeight: "500",
                }}
              >
                {month}
              </label>
              <input
                type="number"
                value={costDetails[category][index] || ""}
                onChange={(e) => {
                  const newDetails = { ...costDetails }
                  newDetails[category][index] = e.target.value
                  setCostDetails(newDetails)
                }}
                placeholder="0"
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const handleAddKPI = async () => {
    if (!user || !newKPI.name.trim()) {
      alert("Please enter a name for the new KPI")
      return
    }

    try {
      const chartName = newKPI.name.toLowerCase().replace(/\s+/g, "_")
      const kpiData = {
        userId: user.uid,
        chartName: chartName,
        name: newKPI.name,
        type: newKPI.type,
        dataType: newKPI.dataType,
        actual: Array(12).fill(0),
        isCustomKPI: true,
        section: "cost-agility",
        lastUpdated: new Date().toISOString(),
      }

      await setDoc(doc(db, "financialData", `${user.uid}_${chartName}`), kpiData)
      console.log("New KPI saved to Firebase")

      setCustomKPIs((prev) => ({
        ...prev,
        [chartName]: kpiData,
      }))

      setNewKPI({
        name: "",
        type: "bar",
        dataType: "currency",
      })
      setShowAddKPIModal(false)
    } catch (error) {
      console.error("Error saving KPI:", error)
      alert("Error saving KPI. Please try again.")
    }
  }

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const years = Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i)

  return (
    <div style={{ paddingTop: "20px" }}>
      <KeyQuestionBox
        question="Can costs flex under pressure? If revenue Drops?"
        signals="Fixed vs variable rigidity"
        decisions="Restructure costs, delay scaling, Renegotiate contracts, Adjust capital strategy"
        section="cost-agility"
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
        <h2 style={{ color: "#5d4037", fontSize: "24px", fontWeight: "700" }}>Cost Agility</h2>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
              <span style={{ color: "#5d4037", fontSize: "14px" }}>Year:</span>
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
            
            <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
              <span style={{ color: "#5d4037", fontSize: "14px" }}>Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                  color: "#5d4037",
                  minWidth: "100px",
                }}
              >
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
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
            <>
              <button
                onClick={() => setShowModal(true)}
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
                Add Data
              </button>
              <button
                onClick={() => setShowAddKPIModal(true)}
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
                Add KPI
              </button>
            </>
          )}
        </div>
      </div>

      {/* Chart Grid - 2 per row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "30px" }}>
        <div
          style={{
            backgroundColor: "#fdfcfb",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <Bar data={createChartData("fixedCosts")} options={chartOptions("Fixed/Variable Ratio")} />
          
          {!isInvestorView && (
            <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
              <button
                onClick={() => handleAddNotes("fixedCosts")}
                style={{
                  padding: "8px 16px",
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
                onClick={() => handleAIAnalysis("fixedCosts")}
                style={{
                  padding: "8px 16px",
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
          )}

          {expandedNotes["fixedCosts"] && (
            <div style={{ marginTop: "15px" }}>
              <label
                style={{
                  fontSize: "12px",
                  color: "#5d4037",
                  fontWeight: "600",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Notes:
              </label>
              <textarea
                value={chartNotes["fixedCosts"] || ""}
                onChange={(e) => updateChartNote("fixedCosts", e.target.value)}
                placeholder="Add notes..."
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

          {expandedNotes["fixedCosts_analysis"] && (
            <div
              style={{
                backgroundColor: "#e3f2fd",
                padding: "15px",
                borderRadius: "6px",
                border: "1px solid #90caf9",
                marginTop: "15px",
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
                {chartAnalysis["fixedCosts"] ||
                  "AI analysis will be generated based on your data trends, comparing current performance against historical averages and industry benchmarks. This feature provides actionable insights for improving this metric."}
              </p>
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
          <Bar data={createChartData("discretionaryCosts")} options={chartOptions("% Discretionary Costs")} />
          
          {!isInvestorView && (
            <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
              <button
                onClick={() => handleAddNotes("discretionaryCosts")}
                style={{
                  padding: "8px 16px",
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
                onClick={() => handleAIAnalysis("discretionaryCosts")}
                style={{
                  padding: "8px 16px",
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
          )}

          {expandedNotes["discretionaryCosts"] && (
            <div style={{ marginTop: "15px" }}>
              <label
                style={{
                  fontSize: "12px",
                  color: "#5d4037",
                  fontWeight: "600",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Notes:
              </label>
              <textarea
                value={chartNotes["discretionaryCosts"] || ""}
                onChange={(e) => updateChartNote("discretionaryCosts", e.target.value)}
                placeholder="Add notes..."
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

          {expandedNotes["discretionaryCosts_analysis"] && (
            <div
              style={{
                backgroundColor: "#e3f2fd",
                padding: "15px",
                borderRadius: "6px",
                border: "1px solid #90caf9",
                marginTop: "15px",
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
                {chartAnalysis["discretionaryCosts"] ||
                  "AI analysis will be generated based on your data trends, comparing current performance against historical averages and industry benchmarks. This feature provides actionable insights for improving this metric."}
              </p>
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
          <Bar
            data={createChartData("lockInDuration")}
            options={chartOptions("Fixed Costs Lock-in Duration (months)")}
          />
          
          {!isInvestorView && (
            <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
              <button
                onClick={() => handleAddNotes("lockInDuration")}
                style={{
                  padding: "8px 16px",
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
                onClick={() => handleAIAnalysis("lockInDuration")}
                style={{
                  padding: "8px 16px",
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
          )}

          {expandedNotes["lockInDuration"] && (
            <div style={{ marginTop: "15px" }}>
              <label
                style={{
                  fontSize: "12px",
                  color: "#5d4037",
                  fontWeight: "600",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Notes:
              </label>
              <textarea
                value={chartNotes["lockInDuration"] || ""}
                onChange={(e) => updateChartNote("lockInDuration", e.target.value)}
                placeholder="Add notes..."
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

          {expandedNotes["lockInDuration_analysis"] && (
            <div
              style={{
                backgroundColor: "#e3f2fd",
                padding: "15px",
                borderRadius: "6px",
                border: "1px solid #90caf9",
                marginTop: "15px",
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
                {chartAnalysis["lockInDuration"] ||
                  "AI analysis will be generated based on your data trends, comparing current performance against historical averages and industry benchmarks. This feature provides actionable insights for improving this metric."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Custom KPIs */}
      {Object.keys(customKPIs).length > 0 && (
        <>
          <h3 style={{ color: "#5d4037", fontSize: "20px", fontWeight: "600", marginBottom: "15px" }}>Custom KPIs</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
            {Object.values(customKPIs).map((kpi) => (
              <div
                key={kpi.chartName}
                style={{
                  backgroundColor: "#fdfcfb",
                  padding: "20px",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                {kpi.type === "line" ? (
                  <Line data={createCustomKPIChartData(kpi)} options={customKPIOptions(kpi.name, kpi.dataType)} />
                ) : (
                  <Bar data={createCustomKPIChartData(kpi)} options={customKPIOptions(kpi.name, kpi.dataType)} />
                )}
                
                {!isInvestorView && (
                  <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => handleAddNotes(kpi.chartName)}
                      style={{
                        padding: "8px 16px",
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
                      onClick={() => handleAIAnalysis(kpi.chartName)}
                      style={{
                        padding: "8px 16px",
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
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Details Modal */}
      {showModal && (
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
              maxWidth: "1200px",
              maxHeight: "90vh",
              overflow: "auto",
              width: "95%",
            }}
          >
            <h3 style={{ color: "#5d4037", marginBottom: "20px" }}>Add Cost Agility Data</h3>

            {renderMonthlyInputs("fixedCosts", "Fixed Costs (R m)")}
            {renderMonthlyInputs("variableCosts", "Variable Costs (R m)")}
            {renderMonthlyInputs("discretionaryCosts", "Discretionary Costs (R m)")}
            {renderMonthlyInputs("lockInDuration", "Lock-in Duration (months)")}

            <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
              Notes:
            </label>
            <textarea
              value={costDetails.notes}
              onChange={(e) => setCostDetails({ ...costDetails, notes: e.target.value })}
              placeholder="Add any additional notes..."
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "20px",
                borderRadius: "4px",
                border: "1px solid #e8ddd4",
                minHeight: "100px",
              }}
            />

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowModal(false)}
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
                onClick={handleSaveCostDetails}
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
      )}

      {/* Add KPI Modal */}
      {showAddKPIModal && (
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
              maxWidth: "500px",
              width: "90%",
            }}
          >
            <h3 style={{ color: "#5d4037", marginBottom: "20px" }}>Add KPI</h3>

            <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
              KPI Name:
            </label>
            <input
              type="text"
              value={newKPI.name}
              onChange={(e) => setNewKPI({ ...newKPI, name: e.target.value })}
              placeholder="e.g., Customer Acquisition Cost"
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "20px",
                borderRadius: "4px",
                border: "1px solid #e8ddd4",
              }}
            />

            <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
              Chart Type:
            </label>
            <select
              value={newKPI.type}
              onChange={(e) => setNewKPI({ ...newKPI, type: e.target.value })}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "20px",
                borderRadius: "4px",
                border: "1px solid #e8ddd4",
              }}
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
            </select>

            <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
              Data Type:
            </label>
            <select
              value={newKPI.dataType}
              onChange={(e) => setNewKPI({ ...newKPI, dataType: e.target.value })}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "20px",
                borderRadius: "4px",
                border: "1px solid #e8ddd4",
              }}
            >
              <option value="currency">Currency (R m)</option>
              <option value="percentage">Percentage (%)</option>
              <option value="number">Number</option>
            </select>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowAddKPIModal(false)}
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
                onClick={handleAddKPI}
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
                Save KPI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Liquidity Survival Component
const LiquiditySurvival = ({ activeSection, viewMode, user, onUpdateChartData, isInvestorView }) => {
  const [showModal, setShowModal] = useState(false)
  const [liquidityDetails, setLiquidityDetails] = useState({
    currentRatio: Array(12).fill(""),
    burnRate: Array(12).fill(""),
    cashCover: Array(12).fill(""),
    cashflow: Array(12).fill(""),
    loanRepayments: Array(12).fill(""),
    notes: "",
  })
  const [firebaseChartData, setFirebaseChartData] = useState({})
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState("Jan")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedViewMode, setSelectedViewMode] = useState("month")
  const [expandedNotes, setExpandedNotes] = useState({})
  const [chartNotes, setChartNotes] = useState({})
  const [chartAnalysis, setChartAnalysis] = useState({})
  const [showAddKPIModal, setShowAddKPIModal] = useState(false)
  const [newKPI, setNewKPI] = useState({
    name: "",
    type: "bar",
    dataType: "currency",
  })
  const [customKPIs, setCustomKPIs] = useState({})

  useEffect(() => {
    if (user) {
      loadLiquidityDataFromFirebase()
      loadCustomKPIs()
    }
  }, [user])

  const loadLiquidityDataFromFirebase = async () => {
    if (!user) return

    setLoading(true)
    try {
      const liquidityDoc = await getDoc(doc(db, "financialData", `${user.uid}_liquiditySurvival`))

      if (liquidityDoc.exists()) {
        const firebaseData = liquidityDoc.data()
        setLiquidityDetails({
          currentRatio: firebaseData.currentRatio?.map(String) || Array(12).fill(""),
          burnRate: firebaseData.burnRate?.map(String) || Array(12).fill(""),
          cashCover: firebaseData.cashCover?.map(String) || Array(12).fill(""),
          cashflow: firebaseData.cashflow?.map(String) || Array(12).fill(""),
          loanRepayments: firebaseData.loanRepayments?.map(String) || Array(12).fill(""),
          notes: firebaseData.notes || "",
        })
        processFirebaseDataForCharts(firebaseData)
      }
    } catch (error) {
      console.error("Error loading liquidity data from Firebase:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadCustomKPIs = async () => {
    if (!user) return

    try {
      const kpiQuery = query(
        collection(db, "financialData"),
        where("userId", "==", user.uid),
        where("isCustomKPI", "==", true),
        where("section", "==", "liquidity-survival"),
      )
      const querySnapshot = await getDocs(kpiQuery)

      const kpis = {}
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        kpis[data.chartName] = data
      })

      setCustomKPIs(kpis)
    } catch (error) {
      console.error("Error loading custom KPIs:", error)
    }
  }

  const processFirebaseDataForCharts = (firebaseData) => {
    const currentRatio = firebaseData.currentRatio?.map((val) => Number.parseFloat(val) || 0) || Array(12).fill(0)
    const burnRate = firebaseData.burnRate?.map((val) => Number.parseFloat(val) || 0) || Array(12).fill(0)
    const cashCover = firebaseData.cashCover?.map((val) => Number.parseFloat(val) || 0) || Array(12).fill(0)
    const cashflow = firebaseData.cashflow?.map((val) => Number.parseFloat(val) || 0) || Array(12).fill(0)
    const loanRepayments = firebaseData.loanRepayments?.map((val) => Number.parseFloat(val) || 0) || Array(12).fill(0)

    const chartData = {
      currentRatio: { actual: currentRatio },
      burnRate: { actual: burnRate.map((val) => val / 1000000) },
      cashCover: { actual: cashCover },
      cashflow: { actual: cashflow.map((val) => val / 1000000) },
      loanRepayments: { actual: loanRepayments.map((val) => val / 1000000) },
    }

    setFirebaseChartData(chartData)

    if (onUpdateChartData) {
      Object.keys(chartData).forEach((key) => {
        onUpdateChartData(key, chartData[key])
      })
    }
  }

  if (activeSection !== "liquidity-survival") return null

  const generateLabels = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
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
      return data
    } else if (selectedViewMode === "quarter") {
      const quarters = []
      for (let i = 0; i < 4; i++) {
        const sum = data.slice(i * 3, i * 3 + 3).reduce((acc, val) => acc + val, 0)
        quarters.push(sum)
      }
      return quarters
    } else {
      return [data.reduce((acc, val) => acc + val, 0)]
    }
  }

  const labels = generateLabels()

  const handleSaveLiquidityDetails = async () => {
    if (!user) {
      alert("Please log in to save liquidity data")
      return
    }

    setLoading(true)
    try {
      const firebaseData = {
        userId: user.uid,
        chartName: "liquiditySurvival",
        currentRatio: liquidityDetails.currentRatio.map((val) => Number.parseFloat(val) || 0),
        burnRate: liquidityDetails.burnRate.map((val) => Number.parseFloat(val) || 0),
        cashCover: liquidityDetails.cashCover.map((val) => Number.parseFloat(val) || 0),
        cashflow: liquidityDetails.cashflow.map((val) => Number.parseFloat(val) || 0),
        loanRepayments: liquidityDetails.loanRepayments.map((val) => Number.parseFloat(val) || 0),
        notes: liquidityDetails.notes,
        lastUpdated: new Date().toISOString(),
      }

      await setDoc(doc(db, "financialData", `${user.uid}_liquiditySurvival`), firebaseData)
      console.log("Liquidity data saved to Firebase")

      processFirebaseDataForCharts(firebaseData)
      setShowModal(false)
    } catch (error) {
      console.error("Error saving liquidity data:", error)
      alert("Error saving liquidity data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const createChartData = (dataKey) => {
    const data = firebaseChartData[dataKey] || { actual: [] }
    const actualData = aggregateDataForView(data.actual)
    return {
      labels,
      datasets: [
        {
          label: "Actual",
          data: actualData,
          backgroundColor: "rgba(93, 64, 55, 0.6)",
          borderColor: "rgb(93, 64, 55)",
          borderWidth: 2,
        },
      ],
    }
  }

  const createCustomKPIChartData = (kpiData) => {
    const actualData = aggregateDataForView(kpiData.actual || [])
    return {
      labels,
      datasets: [
        {
          type: kpiData.type === "line" ? "line" : "bar",
          label: "Actual",
          data: actualData,
          backgroundColor: kpiData.type === "line" ? "rgba(93, 64, 55, 0.1)" : "rgba(93, 64, 55, 0.6)",
          borderColor: "rgb(93, 64, 55)",
          borderWidth: 2,
          fill: kpiData.type === "line",
          tension: 0.1,
        },
      ],
    }
  }

  const chartOptions = (title) => ({
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: title,
        color: "#5d4037",
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  })

  const customKPIOptions = (title, dataType = "currency") => ({
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: title,
        color: "#5d4037",
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw
            if (dataType === "percentage") {
              return `${context.dataset.label}: ${value.toFixed(2)}%`
            } else if (dataType === "currency") {
              return `${context.dataset.label}: R${value.toFixed(2)}m`
            } else {
              return `${context.dataset.label}: ${value.toFixed(2)}`
            }
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  })

  const handleAddNotes = (chartName) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [chartName]: !prev[chartName],
    }))
  }

  const handleAIAnalysis = (chartName) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [`${chartName}_analysis`]: !prev[`${chartName}_analysis`],
    }))
  }

  const updateChartNote = (chartName, note) => {
    setChartNotes((prev) => ({
      ...prev,
      [chartName]: note,
    }))
  }

  const updateChartAnalysis = (chartName, analysis) => {
    setChartAnalysis((prev) => ({
      ...prev,
      [chartName]: analysis,
    }))
  }

  const renderMonthlyInputs = (category, label) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    return (
      <div style={{ marginBottom: "20px" }}>
        <h5 style={{ color: "#5d4037", marginBottom: "15px", fontWeight: "600" }}>{label}</h5>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "10px",
          }}
        >
          {months.map((month, index) => (
            <div key={month} style={{ display: "flex", flexDirection: "column" }}>
              <label
                style={{
                  fontSize: "12px",
                  color: "#8d6e63",
                  marginBottom: "5px",
                  fontWeight: "500",
                }}
              >
                {month}
              </label>
              <input
                type="number"
                value={liquidityDetails[category][index] || ""}
                onChange={(e) => {
                  const newDetails = { ...liquidityDetails }
                  newDetails[category][index] = e.target.value
                  setLiquidityDetails(newDetails)
                }}
                placeholder="0"
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                }}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const handleAddKPI = async () => {
    if (!user || !newKPI.name.trim()) {
      alert("Please enter a name for the new KPI")
      return
    }

    try {
      const chartName = newKPI.name.toLowerCase().replace(/\s+/g, "_")
      const kpiData = {
        userId: user.uid,
        chartName: chartName,
        name: newKPI.name,
        type: newKPI.type,
        dataType: newKPI.dataType,
        actual: Array(12).fill(0),
        isCustomKPI: true,
        section: "liquidity-survival",
        lastUpdated: new Date().toISOString(),
      }

      await setDoc(doc(db, "financialData", `${user.uid}_${chartName}`), kpiData)
      console.log("New KPI saved to Firebase")

      setCustomKPIs((prev) => ({
        ...prev,
        [chartName]: kpiData,
      }))

      setNewKPI({
        name: "",
        type: "bar",
        dataType: "currency",
      })
      setShowAddKPIModal(false)
    } catch (error) {
      console.error("Error saving KPI:", error)
      alert("Error saving KPI. Please try again.")
    }
  }

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const years = Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i)

  return (
    <div style={{ paddingTop: "20px" }}>
      <KeyQuestionBox
        question="Will the business survive a shock?"
        signals="Cash runway, burn risk"
        decisions="Cut burn, raise capital, slow growth"
        section="liquidity-survival"
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
        <h2 style={{ color: "#5d4037", fontSize: "24px", fontWeight: "700" }}>Liquidity & Survival</h2>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
              <span style={{ color: "#5d4037", fontSize: "14px" }}>Year:</span>
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
            
            <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
              <span style={{ color: "#5d4037", fontSize: "14px" }}>Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                  color: "#5d4037",
                  minWidth: "100px",
                }}
              >
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
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
            <>
              <button
                onClick={() => setShowModal(true)}
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
                Add Data
              </button>
              <button
                onClick={() => setShowAddKPIModal(true)}
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
                Add KPI
              </button>
            </>
          )}
        </div>
      </div>

      {/* Chart Grid - 2 per row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "30px" }}>
        <div
          style={{
            backgroundColor: "#fdfcfb",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <Bar data={createChartData("currentRatio")} options={chartOptions("Current Ratio")} />
          
          {!isInvestorView && (
            <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
              <button
                onClick={() => handleAddNotes("currentRatio")}
                style={{
                  padding: "8px 16px",
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
                onClick={() => handleAIAnalysis("currentRatio")}
                style={{
                  padding: "8px 16px",
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
          )}

          {expandedNotes["currentRatio"] && (
            <div style={{ marginTop: "15px" }}>
              <label
                style={{
                  fontSize: "12px",
                  color: "#5d4037",
                  fontWeight: "600",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Notes:
              </label>
              <textarea
                value={chartNotes["currentRatio"] || ""}
                onChange={(e) => updateChartNote("currentRatio", e.target.value)}
                placeholder="Add notes..."
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

          {expandedNotes["currentRatio_analysis"] && (
            <div
              style={{
                backgroundColor: "#e3f2fd",
                padding: "15px",
                borderRadius: "6px",
                border: "1px solid #90caf9",
                marginTop: "15px",
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
                {chartAnalysis["currentRatio"] ||
                  "AI analysis will be generated based on your data trends, comparing current performance against historical averages and industry benchmarks. This feature provides actionable insights for improving this metric."}
              </p>
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
          <Bar data={createChartData("burnRate")} options={chartOptions("Burn Rate")} />
          
          {!isInvestorView && (
            <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
              <button
                onClick={() => handleAddNotes("burnRate")}
                style={{
                  padding: "8px 16px",
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
                onClick={() => handleAIAnalysis("burnRate")}
                style={{
                  padding: "8px 16px",
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
          )}

          {expandedNotes["burnRate"] && (
            <div style={{ marginTop: "15px" }}>
              <label
                style={{
                  fontSize: "12px",
                  color: "#5d4037",
                  fontWeight: "600",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Notes:
              </label>
              <textarea
                value={chartNotes["burnRate"] || ""}
                onChange={(e) => updateChartNote("burnRate", e.target.value)}
                placeholder="Add notes..."
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

          {expandedNotes["burnRate_analysis"] && (
            <div
              style={{
                backgroundColor: "#e3f2fd",
                padding: "15px",
                borderRadius: "6px",
                border: "1px solid #90caf9",
                marginTop: "15px",
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
                {chartAnalysis["burnRate"] ||
                  "AI analysis will be generated based on your data trends, comparing current performance against historical averages and industry benchmarks. This feature provides actionable insights for improving this metric."}
              </p>
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
          <Bar data={createChartData("cashCover")} options={chartOptions("Cash Cover")} />
          
          {!isInvestorView && (
            <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
              <button
                onClick={() => handleAddNotes("cashCover")}
                style={{
                  padding: "8px 16px",
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
                onClick={() => handleAIAnalysis("cashCover")}
                style={{
                  padding: "8px 16px",
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
          )}

          {expandedNotes["cashCover"] && (
            <div style={{ marginTop: "15px" }}>
              <label
                style={{
                  fontSize: "12px",
                  color: "#5d4037",
                  fontWeight: "600",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Notes:
              </label>
              <textarea
                value={chartNotes["cashCover"] || ""}
                onChange={(e) => updateChartNote("cashCover", e.target.value)}
                placeholder="Add notes..."
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

          {expandedNotes["cashCover_analysis"] && (
            <div
              style={{
                backgroundColor: "#e3f2fd",
                padding: "15px",
                borderRadius: "6px",
                border: "1px solid #90caf9",
                marginTop: "15px",
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
                {chartAnalysis["cashCover"] ||
                  "AI analysis will be generated based on your data trends, comparing current performance against historical averages and industry benchmarks. This feature provides actionable insights for improving this metric."}
              </p>
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
          <Line data={createChartData("cashflow")} options={chartOptions("Free Cashflow")} />
          
          {!isInvestorView && (
            <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
              <button
                onClick={() => handleAddNotes("cashflow")}
                style={{
                  padding: "8px 16px",
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
                onClick={() => handleAIAnalysis("cashflow")}
                style={{
                  padding: "8px 16px",
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
          )}

          {expandedNotes["cashflow"] && (
            <div style={{ marginTop: "15px" }}>
              <label
                style={{
                  fontSize: "12px",
                  color: "#5d4037",
                  fontWeight: "600",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Notes:
              </label>
              <textarea
                value={chartNotes["cashflow"] || ""}
                onChange={(e) => updateChartNote("cashflow", e.target.value)}
                placeholder="Add notes..."
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

          {expandedNotes["cashflow_analysis"] && (
            <div
              style={{
                backgroundColor: "#e3f2fd",
                padding: "15px",
                borderRadius: "6px",
                border: "1px solid #90caf9",
                marginTop: "15px",
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
                {chartAnalysis["cashflow"] ||
                  "AI analysis will be generated based on your data trends, comparing current performance against historical averages and industry benchmarks. This feature provides actionable insights for improving this metric."}
              </p>
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
          <Bar data={createChartData("loanRepayments")} options={chartOptions("Loan Repayments")} />
          
          {!isInvestorView && (
            <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
              <button
                onClick={() => handleAddNotes("loanRepayments")}
                style={{
                  padding: "8px 16px",
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
                onClick={() => handleAIAnalysis("loanRepayments")}
                style={{
                  padding: "8px 16px",
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
          )}

          {expandedNotes["loanRepayments"] && (
            <div style={{ marginTop: "15px" }}>
              <label
                style={{
                  fontSize: "12px",
                  color: "#5d4037",
                  fontWeight: "600",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Notes:
              </label>
              <textarea
                value={chartNotes["loanRepayments"] || ""}
                onChange={(e) => updateChartNote("loanRepayments", e.target.value)}
                placeholder="Add notes..."
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

          {expandedNotes["loanRepayments_analysis"] && (
            <div
              style={{
                backgroundColor: "#e3f2fd",
                padding: "15px",
                borderRadius: "6px",
                border: "1px solid #90caf9",
                marginTop: "15px",
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
                {chartAnalysis["loanRepayments"] ||
                  "AI analysis will be generated based on your data trends, comparing current performance against historical averages and industry benchmarks. This feature provides actionable insights for improving this metric."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Custom KPIs */}
      {Object.keys(customKPIs).length > 0 && (
        <>
          <h3 style={{ color: "#5d4037", fontSize: "20px", fontWeight: "600", marginBottom: "15px" }}>Custom KPIs</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
            {Object.values(customKPIs).map((kpi) => (
              <div
                key={kpi.chartName}
                style={{
                  backgroundColor: "#fdfcfb",
                  padding: "20px",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                {kpi.type === "line" ? (
                  <Line data={createCustomKPIChartData(kpi)} options={customKPIOptions(kpi.name, kpi.dataType)} />
                ) : (
                  <Bar data={createCustomKPIChartData(kpi)} options={customKPIOptions(kpi.name, kpi.dataType)} />
                )}
                
                {!isInvestorView && (
                  <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => handleAddNotes(kpi.chartName)}
                      style={{
                        padding: "8px 16px",
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
                      onClick={() => handleAIAnalysis(kpi.chartName)}
                      style={{
                        padding: "8px 16px",
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
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Details Modal */}
      {showModal && (
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
              maxWidth: "1200px",
              maxHeight: "90vh",
              overflow: "auto",
              width: "95%",
            }}
          >
            <h3 style={{ color: "#5d4037", marginBottom: "20px" }}>Add Liquidity & Survival Data</h3>

            {renderMonthlyInputs("currentRatio", "Current Ratio")}
            {renderMonthlyInputs("burnRate", "Burn Rate (R m)")}
            {renderMonthlyInputs("cashCover", "Cash Cover (months)")}
            {renderMonthlyInputs("cashflow", "Free Cashflow (R m)")}
            {renderMonthlyInputs("loanRepayments", "Loan Repayments (R m)")}

            <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
              Notes:
            </label>
            <textarea
              value={liquidityDetails.notes}
              onChange={(e) => setLiquidityDetails({ ...liquidityDetails, notes: e.target.value })}
              placeholder="Add any additional notes..."
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "20px",
                borderRadius: "4px",
                border: "1px solid #e8ddd4",
                minHeight: "100px",
              }}
            />

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowModal(false)}
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
                onClick={handleSaveLiquidityDetails}
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
      )}

      {/* Add KPI Modal */}
      {showAddKPIModal && (
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
              maxWidth: "500px",
              width: "90%",
            }}
          >
            <h3 style={{ color: "#5d4037", marginBottom: "20px" }}>Add KPI</h3>

            <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
              KPI Name:
            </label>
            <input
              type="text"
              value={newKPI.name}
              onChange={(e) => setNewKPI({ ...newKPI, name: e.target.value })}
              placeholder="e.g., Customer Acquisition Cost"
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "20px",
                borderRadius: "4px",
                border: "1px solid #e8ddd4",
              }}
            />

            <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
              Chart Type:
            </label>
            <select
              value={newKPI.type}
              onChange={(e) => setNewKPI({ ...newKPI, type: e.target.value })}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "20px",
                borderRadius: "4px",
                border: "1px solid #e8ddd4",
              }}
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
            </select>

            <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
              Data Type:
            </label>
            <select
              value={newKPI.dataType}
              onChange={(e) => setNewKPI({ ...newKPI, dataType: e.target.value })}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "20px",
                borderRadius: "4px",
                border: "1px solid #e8ddd4",
              }}
            >
              <option value="currency">Currency (R m)</option>
              <option value="percentage">Percentage (%)</option>
              <option value="number">Number</option>
            </select>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowAddKPIModal(false)}
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
                onClick={handleAddKPI}
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
                Save KPI
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
  const [activeSection, setActiveSection] = useState("capital-structure")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [financialYearStart, setFinancialYearStart] = useState("Jan")
  const [chartData, setChartData] = useState({})
  const [balanceSheetData, setBalanceSheetData] = useState(null)
  const [pnlData, setPnLData] = useState(null)
  const [currentMonth, setCurrentMonth] = useState("Jan")
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
        loadUserData(viewingSMEId)
      } else {
        setUser(currentUser)
        if (currentUser) {
          loadUserData(currentUser.uid)
        } else {
          setChartData({})
          setBalanceSheetData(null)
        }
      }
    })

    return () => unsubscribe()
  }, [isInvestorView, viewingSMEId])

  const loadUserData = async (userId) => {
    try {
      console.log("Loading financial data for user ID:", userId)
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
    { id: "capital-structure", label: "Capital Structure" },
    { id: "performance-engine", label: "Performance Engine" },
    { id: "cost-agility", label: "Cost Agility" },
    { id: "liquidity-survival", label: "Liquidity & Survival" },
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

  const handleExitInvestorView = () => {
    sessionStorage.removeItem("viewingSMEId")
    sessionStorage.removeItem("viewingSMEName")
    sessionStorage.removeItem("investorViewMode")
    window.location.href = "/my-cohorts"
  }

  const handleViewModeToggle = (newViewMode) => {
    // This is handled within each component now
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" , padding: "14px", paddingLeft: "40px" }}>
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
                Investor View: Viewing {viewingSMEName}'s Financial Performance
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
      Financial Performance
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

  {/* Financial Performance Description */}
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
              <li>Assesses solvency, liquidity, and financial survivability</li>
              <li>Evaluates capital structure quality and financial risk</li>
              <li>Monitors cash runway and burn rate for survival planning</li>
              <li>Tests cost agility and ability to flex under pressure</li>
              <li>Measures performance engine health and margin sustainability</li>
            </ul>
          </div>

          <div>
            <h3 style={{ color: "#7d5a50", marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>
              What this dashboard does NOT do
            </h3>
            <ul style={{ color: "#4a352f", fontSize: "14px", lineHeight: "1.7", margin: 0, paddingLeft: "20px" }}>
              <li>Bookkeeping, invoicing, or payments processing</li>
              <li>Payroll management or accounting automation</li>
              <li>Tax compliance or audit preparation</li>
              <li>Regulatory reporting or statutory filings</li>
              <li>Operational transaction processing</li>
            </ul>
          </div>
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

        {activeSection === "capital-structure" && (
          <CapitalStructure
            activeSection={activeSection}
            viewMode="month"
            user={user}
            isInvestorView={isInvestorView}
            isEmbedded={true}
          />
        )}

        <PerformanceEngine
          activeSection={activeSection}
          viewMode="month"
          financialYearStart={financialYearStart}
          pnlData={pnlData}
          user={user}
          onUpdateChartData={handleUpdateChartData}
          isInvestorView={isInvestorView}
        />

        <CostAgility
          activeSection={activeSection}
          viewMode="month"
          user={user}
          onUpdateChartData={handleUpdateChartData}
          isInvestorView={isInvestorView}
        />

        <LiquiditySurvival
          activeSection={activeSection}
          viewMode="month"
          user={user}
          onUpdateChartData={handleUpdateChartData}
          isInvestorView={isInvestorView}
        />
      </div>
    </div>
  )
}

export default FinancialPerformance