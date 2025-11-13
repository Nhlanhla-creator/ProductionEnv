"use client"

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

// P&L Snapshot Component - Now Primary (moved to first position)
const PnLSnapshot = ({
  activeSection,
  viewMode,
  financialYearStart,
  pnlData,
  user,
  onUpdateChartData,
  isInvestorView,
}) => {
  const [chartViewMode, setChartViewMode] = useState("data")
  const [visibleCharts, setVisibleCharts] = useState({
    sales: true,
    cogs: true,
    opex: true,
    grossProfit: true,
    netProfit: true,
    ebitda: true,
    gpMargin: true,
    npMargin: true,
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
        where("isCustomKPI", "==", true)
      )
      const querySnapshot = await getDocs(kpiQuery)
      
      const kpis = {}
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        kpis[data.chartName] = data
        // Add to visible charts
        setVisibleCharts(prev => ({
          ...prev,
          [data.chartName]: true
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
      sales: { actual: sales.map(val => val / 1000000), budget: salesBudget.map(val => val / 1000000) },
      cogs: { actual: cogs.map(val => val / 1000000), budget: cogsBudget.map(val => val / 1000000) },
      opex: { actual: opex.map(val => val / 1000000), budget: opexBudget.map(val => val / 1000000) },
      grossProfit: { actual: grossProfit.map(val => val / 1000000), budget: grossProfitBudget.map(val => val / 1000000) },
      ebitda: { actual: ebitda.map(val => val / 1000000), budget: ebitdaBudget.map(val => val / 1000000) },
      netProfit: { actual: netProfit.map(val => val / 1000000), budget: netProfitBudget.map(val => val / 1000000) },
      gpMargin: { actual: gpMargin, budget: gpMarginBudget },
      npMargin: { actual: npMargin, budget: npMarginBudget },
    }

    setFirebaseChartData(chartData)

    if (onUpdateChartData) {
      Object.keys(chartData).forEach((key) => {
        onUpdateChartData(key, chartData[key])
      })
    }
  }

  if (activeSection !== "pnl-snapshot") return null

  const generateLabels = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const startMonthIndex = months.indexOf(selectedFinancialYearStart)
    const orderedMonths = [...months.slice(startMonthIndex), ...months.slice(0, startMonthIndex)]

    if (viewMode === "month") {
      return orderedMonths
    } else if (viewMode === "quarter") {
      return ["Q1", "Q2", "Q3", "Q4"]
    } else {
      // Fixed: Use the selected year for yearly view instead of hardcoded years
      return [selectedYear.toString()]
    }
  }

  const aggregateDataForView = (data) => {
    if (viewMode === "month") {
      return data
    } else if (viewMode === "quarter") {
      const quarters = []
      for (let i = 0; i < 4; i++) {
        const sum = data.slice(i * 3, i * 3 + 3).reduce((acc, val) => acc + val, 0)
        quarters.push(sum)
      }
      return quarters
    } else {
      // For yearly view, return the annual total
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

  const toggleChartVisibility = (chartName) => {
    setVisibleCharts((prev) => ({
      ...prev,
      [chartName]: !prev[chartName],
    }))
  }

  const toggleNotes = (chartName) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [chartName]: !prev[chartName],
    }))
  }

  const updateChartNote = (chartName, note) => {
    setChartNotes((prev) => ({
      ...prev,
      [chartName]: note,
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
            backgroundColor: varianceData.map((v) => (v >= 0 ? "rgba(139, 105, 20, 0.6)" : "rgba(160, 82, 45, 0.6)")),
            borderColor: varianceData.map((v) => (v >= 0 ? "rgb(139, 105, 20)" : "rgb(160, 82, 45)")),
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
          borderColor: "#8b6914",
          backgroundColor: "rgba(139, 105, 20, 0.1)",
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
            backgroundColor: varianceData.map((v) => (v >= 0 ? "rgba(139, 105, 20, 0.6)" : "rgba(160, 82, 45, 0.6)")),
            borderColor: varianceData.map((v) => (v >= 0 ? "rgb(139, 105, 20)" : "rgb(160, 82, 45)")),
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
          borderColor: "#8b6914",
          backgroundColor: "rgba(139, 105, 20, 0.1)",
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

  // Generate year options (current year ± 10 years)
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push(i)
    }
    return years
  }

  const updatePnlDetailValue = (category, monthIndex, value) => {
    setPnlDetails(prev => ({
      ...prev,
      [category]: prev[category].map((val, idx) => idx === monthIndex ? value : val)
    }))
  }

  const renderMonthlyInputs = (category, label) => {
    const startMonthIndex = months.indexOf(selectedFinancialYearStart)
    const orderedMonths = [...months.slice(startMonthIndex), ...months.slice(0, startMonthIndex)]
    
    return (
      <div style={{ marginBottom: "20px" }}>
        <h5 style={{ color: "#5d4037", marginBottom: "15px", fontWeight: "600" }}>{label}</h5>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
          gap: "10px" 
        }}>
          {orderedMonths.map((month, displayIndex) => {
            const actualIndex = months.indexOf(month)
            return (
              <div key={month} style={{ display: "flex", flexDirection: "column" }}>
                <label style={{ 
                  fontSize: "12px", 
                  color: "#72542b", 
                  marginBottom: "5px", 
                  fontWeight: "500" 
                }}>
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
      const chartName = newKPI.name.toLowerCase().replace(/\s+/g, '_')
      const kpiData = {
        userId: user.uid,
        chartName: chartName,
        name: newKPI.name,
        type: newKPI.type,
        dataType: newKPI.dataType,
        actual: Array(12).fill(0),
        budget: Array(12).fill(0),
        isCustomKPI: true,
        lastUpdated: new Date().toISOString(),
      }

      await setDoc(doc(db, "financialData", `${user.uid}_${chartName}`), kpiData)
      console.log("New KPI saved to Firebase")

      // Add the new KPI to visible charts and custom KPIs
      setCustomKPIs(prev => ({
        ...prev,
        [chartName]: kpiData
      }))

      setVisibleCharts(prev => ({
        ...prev,
        [chartName]: true
      }))

      setShowAddKPIModal(false)
      setNewKPI({
        name: "",
        type: "bar",
        dataType: "currency",
      })

      alert(`KPI "${newKPI.name}" added successfully!`)
    } catch (error) {
      console.error("Error saving new KPI:", error)
      alert("Error saving new KPI. Please try again.")
    }
  }

  const handleYearChange = (year) => {
    setSelectedYear(year)
    // Clear the form when year changes
    setPnlDetails({
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
    setChartNotes({
      sales: "",
      cogs: "",
      opex: "",
      grossProfit: "",
      netProfit: "",
      ebitda: "",
      gpMargin: "",
      npMargin: "",
    })
  }

  const handleFinancialYearStartChange = (month) => {
    setSelectedFinancialYearStart(month)
    // Clear the form when financial year start changes
    setPnlDetails({
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
  }

  const handleEditKPI = (kpiName) => {
    // Navigate to KPI edit modal or page
    alert(`Edit functionality for ${kpiName} would go here`)
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
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "15px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
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
              }}
            >
              Add P&L Details
            </button>
          )}
          
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <label style={{ color: "#5d4037", fontWeight: "600", fontSize: "14px" }}>
              Data Year:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(parseInt(e.target.value))}
              style={{
                padding: "8px 12px",
                borderRadius: "4px",
                border: "1px solid #e8ddd4",
                backgroundColor: "#fdfcfb",
                color: "#5d4037",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              {generateYearOptions().map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={() => setShowVariance(!showVariance)}
            style={{
              padding: "8px 16px",
              backgroundColor: showVariance ? "#5d4037" : "#e8ddd4",
              color: showVariance ? "#fdfcfb" : "#5d4037",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "500",
              fontSize: "14px",
            }}
          >
            {showVariance ? "Show Actual vs Budget" : "Show Variance"}
          </button>
          
          {!isInvestorView && (
            <button
              onClick={handleAddKPI}
              style={{
                padding: "10px 20px",
                backgroundColor: "#8b6914",
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
          )}
        </div>

        {!isInvestorView && (
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              padding: "10px",
              backgroundColor: "#f7f3f0",
              borderRadius: "6px",
            }}
          >
            <span style={{ fontWeight: "600", color: "#5d4037", marginRight: "10px" }}>Chart Visibility:</span>
            {Object.keys(visibleCharts).map((chart) => (
              <label key={chart} style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={visibleCharts[chart]}
                  onChange={() => toggleChartVisibility(chart)}
                  style={{ cursor: "pointer" }}
                />
                <span style={{ fontSize: "14px", color: "#5d4037" }}>
                  {chart.charAt(0).toUpperCase() + chart.slice(1).replace(/([A-Z])/g, " $1")}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "20px",
        }}
      >
        {visibleCharts.sales && (
          <div>
            <div style={{ height: "300px", padding: "15px", backgroundColor: "#f7f3f0", borderRadius: "6px" }}>
              <Bar
                data={createChartData("sales")}
                options={chartOptions("Sales Revenue (R m)")}
              />
            </div>
            <button
              onClick={() => toggleNotes("sales")}
              style={{
                marginTop: "10px",
                padding: "6px 12px",
                backgroundColor: "#e8ddd4",
                color: "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              {expandedNotes.sales ? "Hide Notes" : "Show Notes"}
            </button>
            {expandedNotes.sales && (
              <textarea
                value={chartNotes.sales}
                onChange={(e) => updateChartNote("sales", e.target.value)}
                placeholder="Add notes/comments for Sales Revenue..."
                style={{
                  width: "100%",
                  marginTop: "10px",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  minHeight: "80px",
                }}
              />
            )}
          </div>
        )}

        {visibleCharts.cogs && (
          <div>
            <div style={{ height: "300px", padding: "15px", backgroundColor: "#f7f3f0", borderRadius: "6px" }}>
              <Bar
                data={createChartData("cogs")}
                options={chartOptions("Cost of Goods Sold (R m)")}
              />
            </div>
            <button
              onClick={() => toggleNotes("cogs")}
              style={{
                marginTop: "10px",
                padding: "6px 12px",
                backgroundColor: "#e8ddd4",
                color: "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              {expandedNotes.cogs ? "Hide Notes" : "Show Notes"}
            </button>
            {expandedNotes.cogs && (
              <textarea
                value={chartNotes.cogs}
                onChange={(e) => updateChartNote("cogs", e.target.value)}
                placeholder="Add notes/comments for COGS..."
                style={{
                  width: "100%",
                  marginTop: "10px",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  minHeight: "80px",
                }}
              />
            )}
          </div>
        )}

        {visibleCharts.opex && (
          <div>
            <div style={{ height: "300px", padding: "15px", backgroundColor: "#f7f3f0", borderRadius: "6px" }}>
              <Bar
                data={createChartData("opex")}
                options={chartOptions("Operating Expenses (R m)")}
              />
            </div>
            <button
              onClick={() => toggleNotes("opex")}
              style={{
                marginTop: "10px",
                padding: "6px 12px",
                backgroundColor: "#e8ddd4",
                color: "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              {expandedNotes.opex ? "Hide Notes" : "Show Notes"}
            </button>
            {expandedNotes.opex && (
              <textarea
                value={chartNotes.opex}
                onChange={(e) => updateChartNote("opex", e.target.value)}
                placeholder="Add notes/comments for OPEX..."
                style={{
                  width: "100%",
                  marginTop: "10px",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  minHeight: "80px",
                }}
              />
            )}
          </div>
        )}

        {visibleCharts.grossProfit && (
          <div>
            <div style={{ height: "300px", padding: "15px", backgroundColor: "#f7f3f0", borderRadius: "6px" }}>
              <Bar
                data={createChartData("grossProfit")}
                options={chartOptions("Gross Profit (R m)")}
              />
            </div>
            <button
              onClick={() => toggleNotes("grossProfit")}
              style={{
                marginTop: "10px",
                padding: "6px 12px",
                backgroundColor: "#e8ddd4",
                color: "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              {expandedNotes.grossProfit ? "Hide Notes" : "Show Notes"}
            </button>
            {expandedNotes.grossProfit && (
              <textarea
                value={chartNotes.grossProfit}
                onChange={(e) => updateChartNote("grossProfit", e.target.value)}
                placeholder="Add notes/comments for Gross Profit..."
                style={{
                  width: "100%",
                  marginTop: "10px",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  minHeight: "80px",
                }}
              />
            )}
          </div>
        )}

        {visibleCharts.ebitda && (
          <div>
            <div style={{ height: "300px", padding: "15px", backgroundColor: "#f7f3f0", borderRadius: "6px" }}>
              <Bar
                data={createChartData("ebitda")}
                options={chartOptions("EBITDA (R m)")}
              />
            </div>
            <button
              onClick={() => toggleNotes("ebitda")}
              style={{
                marginTop: "10px",
                padding: "6px 12px",
                backgroundColor: "#e8ddd4",
                color: "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              {expandedNotes.ebitda ? "Hide Notes" : "Show Notes"}
            </button>
            {expandedNotes.ebitda && (
              <textarea
                value={chartNotes.ebitda}
                onChange={(e) => updateChartNote("ebitda", e.target.value)}
                placeholder="Add notes/comments for EBITDA..."
                style={{
                  width: "100%",
                  marginTop: "10px",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  minHeight: "80px",
                }}
              />
            )}
          </div>
        )}

        {visibleCharts.netProfit && (
          <div>
            <div style={{ height: "300px", padding: "15px", backgroundColor: "#f7f3f0", borderRadius: "6px" }}>
              <Bar
                data={createChartData("netProfit")}
                options={chartOptions("Net Profit (R m)")}
              />
            </div>
            <button
              onClick={() => toggleNotes("netProfit")}
              style={{
                marginTop: "10px",
                padding: "6px 12px",
                backgroundColor: "#e8ddd4",
                color: "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              {expandedNotes.netProfit ? "Hide Notes" : "Show Notes"}
            </button>
            {expandedNotes.netProfit && (
              <textarea
                value={chartNotes.netProfit}
                onChange={(e) => updateChartNote("netProfit", e.target.value)}
                placeholder="Add notes/comments for Net Profit..."
                style={{
                  width: "100%",
                  marginTop: "10px",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  minHeight: "80px",
                }}
              />
            )}
          </div>
        )}

        {visibleCharts.gpMargin && (
          <div>
            <div style={{ height: "300px", padding: "15px", backgroundColor: "#f7f3f0", borderRadius: "6px" }}>
              <Bar
                data={createChartData("gpMargin", true)}
                options={chartOptions("GP Margin (%)", true)}
              />
            </div>
            <button
              onClick={() => toggleNotes("gpMargin")}
              style={{
                marginTop: "10px",
                padding: "6px 12px",
                backgroundColor: "#e8ddd4",
                color: "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              {expandedNotes.gpMargin ? "Hide Notes" : "Show Notes"}
            </button>
            {expandedNotes.gpMargin && (
              <textarea
                value={chartNotes.gpMargin}
                onChange={(e) => updateChartNote("gpMargin", e.target.value)}
                placeholder="Add notes/comments for GP Margin..."
                style={{
                  width: "100%",
                  marginTop: "10px",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  minHeight: "80px",
                }}
              />
            )}
          </div>
        )}

        {visibleCharts.npMargin && (
          <div>
            <div style={{ height: "300px", padding: "15px", backgroundColor: "#f7f3f0", borderRadius: "6px" }}>
              <Bar
                data={createChartData("npMargin", true)}
                options={chartOptions("NP Margin (%)", true)}
              />
            </div>
            <button
              onClick={() => toggleNotes("npMargin")}
              style={{
                marginTop: "10px",
                padding: "6px 12px",
                backgroundColor: "#e8ddd4",
                color: "#5d4037",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              {expandedNotes.npMargin ? "Hide Notes" : "Show Notes"}
            </button>
            {expandedNotes.npMargin && (
              <textarea
                value={chartNotes.npMargin}
                onChange={(e) => updateChartNote("npMargin", e.target.value)}
                placeholder="Add notes/comments for NP Margin..."
                style={{
                  width: "100%",
                  marginTop: "10px",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  minHeight: "80px",
                }}
              />
            )}
          </div>
        )}

        {/* Custom KPI Charts */}
        {Object.keys(customKPIs).map((kpiName) => {
          if (!visibleCharts[kpiName]) return null
          
          const kpiData = customKPIs[kpiName]
          return (
            <div key={kpiName}>
              <div style={{ height: "300px", padding: "15px", backgroundColor: "#f7f3f0", borderRadius: "6px" }}>
                {kpiData.type === "line" ? (
                  <Line
                    data={createCustomKPIChartData(kpiData)}
                    options={customKPIOptions(`${kpiData.name} (${kpiData.dataType === "currency" ? "R m" : kpiData.dataType === "percentage" ? "%" : ""})`, kpiData.dataType)}
                  />
                ) : (
                  <Bar
                    data={createCustomKPIChartData(kpiData)}
                    options={customKPIOptions(`${kpiData.name} (${kpiData.dataType === "currency" ? "R m" : kpiData.dataType === "percentage" ? "%" : ""})`, kpiData.dataType)}
                  />
                )}
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  onClick={() => toggleNotes(kpiName)}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#e8ddd4",
                    color: "#5d4037",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  {expandedNotes[kpiName] ? "Hide Notes" : "Show Notes"}
                </button>
                {!isInvestorView && (
                  <button
                    onClick={() => handleEditKPI(kpiData.name)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#8b6914",
                      color: "#fdfcfb",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Edit KPI
                  </button>
                )}
              </div>
              {expandedNotes[kpiName] && (
                <textarea
                  value={chartNotes[kpiName] || ""}
                  onChange={(e) => updateChartNote(kpiName, e.target.value)}
                  placeholder={`Add notes/comments for ${kpiData.name}...`}
                  style={{
                    width: "100%",
                    marginTop: "10px",
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #e8ddd4",
                    minHeight: "80px",
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

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
            <h3 style={{ color: "#5d4037", marginBottom: "20px" }}>Add P&L Details</h3>
            
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr", 
              gap: "20px", 
              marginBottom: "25px" 
            }}>
              <div>
                <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                  Financial Year Start:
                </label>
                <select
                  value={selectedFinancialYearStart}
                  onChange={(e) => handleFinancialYearStartChange(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #e8ddd4",
                    fontSize: "14px",
                    backgroundColor: "#fdfcfb",
                    color: "#5d4037",
                    cursor: "pointer",
                  }}
                >
                  {months.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                  Data Year:
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => handleYearChange(parseInt(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #e8ddd4",
                    fontSize: "14px",
                    backgroundColor: "#fdfcfb",
                    color: "#5d4037",
                    cursor: "pointer",
                  }}
                >
                  {generateYearOptions().map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "30px" }}>
              <h4 style={{ color: "#5d4037", marginBottom: "20px", fontSize: "18px" }}>Actual Data</h4>
              
              {renderMonthlyInputs("sales", "Sales Revenue")}
              {renderMonthlyInputs("cogs", "Cost of Goods Sold")}
              {renderMonthlyInputs("opex", "Operating Expenses")}
              {renderMonthlyInputs("tax", "Tax")}
              {renderMonthlyInputs("interestExpense", "Interest Expense")}
              {renderMonthlyInputs("depreciation", "Depreciation")}
            </div>

            <div style={{ marginBottom: "30px" }}>
              <h4 style={{ color: "#5d4037", marginBottom: "20px", fontSize: "18px" }}>Budget Data</h4>
              
              {renderMonthlyInputs("salesBudget", "Sales Revenue Budget")}
              {renderMonthlyInputs("cogsBudget", "COGS Budget")}
              {renderMonthlyInputs("opexBudget", "OPEX Budget")}
              {renderMonthlyInputs("taxBudget", "Tax Budget")}
              {renderMonthlyInputs("interestExpenseBudget", "Interest Expense Budget")}
              {renderMonthlyInputs("depreciationBudget", "Depreciation Budget")}
            </div>

            <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
              General Notes:
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
                disabled={loading}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "6px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: "600",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Saving..." : "Save Details"}
              </button>
            </div>
          </div>
        </div>
      )}

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
            <h3 style={{ color: "#5d4037", marginBottom: "20px" }}>Add New KPI</h3>
            
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                KPI Name:
              </label>
              <input
                type="text"
                value={newKPI.name}
                onChange={(e) => setNewKPI({ ...newKPI, name: e.target.value })}
                placeholder="Enter KPI name (e.g., Customer Acquisition Cost)"
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
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Chart Type:
              </label>
              <select
                value={newKPI.type}
                onChange={(e) => setNewKPI({ ...newKPI, type: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                  backgroundColor: "#fdfcfb",
                  color: "#5d4037",
                  cursor: "pointer",
                }}
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
              </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Data Type:
              </label>
              <select
                value={newKPI.dataType}
                onChange={(e) => setNewKPI({ ...newKPI, dataType: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  fontSize: "14px",
                  backgroundColor: "#fdfcfb",
                  color: "#5d4037",
                  cursor: "pointer",
                }}
              >
                <option value="currency">Currency (R m)</option>
                <option value="percentage">Percentage (%)</option>
                <option value="number">Number</option>
              </select>
            </div>

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
                Create KPI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Cashflow Trends Component - Second position
const CashflowTrends = ({ activeSection, viewMode, financialYearStart, balanceSheetData, currentMonth }) => {
  if (activeSection !== "cashflow-trends") return null

  const generateMonths = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const startMonthIndex = months.indexOf(financialYearStart)
    return [...months.slice(startMonthIndex), ...months.slice(0, startMonthIndex)]
  }

  const months = generateMonths()

  const exampleCashflowData = [1.2, 1.1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.35, 0.3, 0.25, 0.2]
  const exampleBurnRateData = [0.1, 0.1, 0.2, 0.1, 0.1, 0.1, 0.1, 0.05, 0.05, 0.05, 0.05, 0.05]

  const cashflowData = months.map((month, index) => {
    const balanceData = balanceSheetData?.[month]
    return balanceData ? Number.parseFloat(balanceData.cash) / 1000000 : exampleCashflowData[index]
  })

  const burnRateData = months.map((month, index) => {
    const balanceData = balanceSheetData?.[month]
    if (!balanceData) return exampleBurnRateData[index]

    const sales = Number.parseFloat(balanceData.sales) || 0
    const cogs = Number.parseFloat(balanceData.cogs) || 0
    const opex = Number.parseFloat(balanceData.opex) || 0

    const burnRate = (cogs + opex - sales) / 1000000
    return Math.max(burnRate, 0)
  })

  const aggregateDataForView = (data) => {
    if (viewMode === "month") {
      return data
    } else if (viewMode === "quarter") {
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

  const getLabelsForView = () => {
    if (viewMode === "month") {
      return months
    } else if (viewMode === "quarter") {
      return ["Q1", "Q2", "Q3", "Q4"]
    } else {
      return ["2025"]
    }
  }

  const displayLabels = getLabelsForView()
  const displayCashflow = aggregateDataForView(cashflowData)
  const displayBurnRate = aggregateDataForView(burnRateData)

  const currentCashBalance = cashflowData[months.indexOf(currentMonth)] || cashflowData[0]
  const avgBurnRate =
    burnRateData.reduce((sum, rate) => sum + rate, 0) / burnRateData.filter((rate) => rate > 0).length || 1
  const runwayMonths = avgBurnRate > 0 ? Math.round(currentCashBalance / avgBurnRate) : 999

  const cashflowOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Cashflow (R m)",
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
  }

  const burnRateOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Burn Rate (R m)",
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
          display: false,
        },
      },
      x: {
        title: {
          display: false,
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
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "20px",
        }}
      >
        <div style={{ height: "300px", padding: "15px", backgroundColor: "#f7f3f0", borderRadius: "6px" }}>
          <Line
            data={{
              labels: displayLabels,
              datasets: [
                {
                  label: "Cashflow",
                  data: displayCashflow,
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
              labels: displayLabels,
              datasets: [
                {
                  label: "Burn Rate",
                  data: displayBurnRate,
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

// Balance Sheet Component - Third position with sub-tabs
const BalanceSheet = ({
  activeSection,
  viewMode,
  onUpdateBalanceSheet,
  balanceSheetData,
  currentMonth,
  onMonthChange,
  user,
  onUpdateChartData,
  chartData,
  isInvestorView,
}) => {
  const [balanceSheetTab, setBalanceSheetTab] = useState("snapshot")
  const [showModal, setShowModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showHealthModal, setShowHealthModal] = useState(false)
  const [balanceSheetDetails, setBalanceSheetDetails] = useState({
    cash: "",
    inventory: "",
    prepaidExpenses: "",
    accountsReceivable: "",
    deposits: "",
    propertyPlantEquipment: "",
    intangibleAssets: "",
    accumulatedDepreciation: "",
    accountsPayable: "",
    currentBorrowing: "",
    nonCurrentLiabilities: "",
    longTermLiabilities: "",
    ownersEquity: "",
    sales: "",
    cogs: "",
    opex: "",
    month: currentMonth,
    notes: "",
  })
  const [healthDetails, setHealthDetails] = useState({
    receivables: Array(12).fill(""),
    payables: Array(12).fill(""),
    receivablesDays: Array(12).fill(""),
    payablesDays: Array(12).fill(""),
    inventory: Array(12).fill(""),
    inventoryDays: Array(12).fill(""),
    date: "",
    notes: "",
  })

  if (activeSection !== "balance-sheet") return null

  const currentData = balanceSheetData?.[currentMonth] || {}

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
      },
    }
    onUpdateBalanceSheet(updatedData)

    if (user) {
      try {
        await setDoc(doc(db, "financialData", `${user.uid}_balanceSheet`), {
          userId: user.uid,
          chartName: "balanceSheet",
          data: updatedData,
          lastUpdated: new Date().toISOString(),
        })
        console.log("Balance sheet data saved to Firebase")
      } catch (error) {
        console.error("Error saving balance sheet data:", error)
      }
    }

    setShowModal(false)
  }

  const handleUploadBalanceSheet = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target.result
      const lines = text.split("\n")
      const data = {}

      lines.forEach((line) => {
        const [key, value] = line.split(",")
        if (key && value) {
          const cleanKey = key.trim().toLowerCase().replace(/\s+/g, "")
          const cleanValue = value.trim()
          if (!isNaN(cleanValue)) {
            data[cleanKey] = cleanValue
          }
        }
      })

      const updatedData = {
        ...balanceSheetData,
        [currentMonth]: {
          ...balanceSheetData?.[currentMonth],
          ...data,
        },
      }
      onUpdateBalanceSheet(updatedData)
      setShowUploadModal(false)
    }
    reader.readAsText(file)
  }

  const handleAddHealthDetails = () => {
    setShowHealthModal(true)
    const receivablesData = chartData.receivables?.actual || []
    const payablesData = chartData.payables?.actual || []
    const receivablesDaysData = chartData.receivablesDays?.actual || []
    const payablesDaysData = chartData.payablesDays?.actual || []
    const inventoryData = chartData.inventory?.actual || []
    const inventoryDaysData = chartData.inventoryDays?.actual || []

    setHealthDetails({
      receivables: receivablesData.length > 0 ? receivablesData.map(String) : Array(12).fill(""),
      payables: payablesData.length > 0 ? payablesData.map(String) : Array(12).fill(""),
      receivablesDays: receivablesDaysData.length > 0 ? receivablesDaysData.map(String) : Array(12).fill(""),
      payablesDays: payablesDaysData.length > 0 ? payablesDaysData.map(String) : Array(12).fill(""),
      inventory: inventoryData.length > 0 ? inventoryData.map(String) : Array(12).fill(""),
      inventoryDays: inventoryDaysData.length > 0 ? inventoryDaysData.map(String) : Array(12).fill(""),
      date: chartData.balanceSheetHealth?.date || "",
      notes: chartData.balanceSheetHealth?.notes || "",
    })
  }

  const handleSaveHealthDetails = async () => {
    const updatedData = {
      receivables: { actual: healthDetails.receivables.map((val) => Number.parseFloat(val) || 0) },
      payables: { actual: healthDetails.payables.map((val) => Number.parseFloat(val) || 0) },
      receivablesDays: { actual: healthDetails.receivablesDays.map((val) => Number.parseFloat(val) || 0) },
      payablesDays: { actual: healthDetails.payablesDays.map((val) => Number.parseFloat(val) || 0) },
      inventory: { actual: healthDetails.inventory.map((val) => Number.parseFloat(val) || 0) },
      inventoryDays: { actual: healthDetails.inventoryDays.map((val) => Number.parseFloat(val) || 0) },
      balanceSheetHealth: {
        date: healthDetails.date,
        notes: healthDetails.notes,
      },
    }

    Object.keys(updatedData).forEach((key) => {
      if (key !== "balanceSheetHealth") {
        onUpdateChartData(key, updatedData[key])
      }
    })
    onUpdateChartData("balanceSheetHealth", updatedData.balanceSheetHealth)

    if (user) {
      try {
        for (const [key, data] of Object.entries(updatedData)) {
          if (key !== "balanceSheetHealth") {
            await setDoc(doc(db, "financialData", `${user.uid}_${key}`), {
              userId: user.uid,
              chartName: key,
              ...data,
              lastUpdated: new Date().toISOString(),
            })
          }
        }
        await setDoc(doc(db, "financialData", `${user.uid}_balanceSheetHealth`), {
          userId: user.uid,
          chartName: "balanceSheetHealth",
          ...updatedData.balanceSheetHealth,
          lastUpdated: new Date().toISOString(),
        })
        console.log("Balance sheet health data saved to Firebase")
      } catch (error) {
        console.error("Error saving balance sheet health data:", error)
      }
    }

    setShowHealthModal(false)
  }

  const generateMonths = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return months
  }

  const months = generateMonths()

  const receivablesData = chartData.receivables?.actual || []
  const payablesData = chartData.payables?.actual || []
  const receivablesDaysData = chartData.receivablesDays?.actual || []
  const payablesDaysData = chartData.payablesDays?.actual || []
  const inventoryData = chartData.inventory?.actual || []
  const inventoryDaysData = chartData.inventoryDays?.actual || []

  const aggregateDataForView = (data) => {
    if (viewMode === "month") {
      return data
    } else if (viewMode === "quarter") {
      const quarters = []
      for (let i = 0; i < 4; i++) {
        const sum = data.slice(i * 3, i * 3 + 3).reduce((acc, val) => acc + val, 0)
        quarters.push(sum / 3)
      }
      return quarters
    } else {
      return [data.reduce((acc, val) => acc + val, 0) / 12]
    }
  }

  const getLabelsForView = () => {
    if (viewMode === "month") {
      return months
    } else if (viewMode === "quarter") {
      return ["Q1", "Q2", "Q3", "Q4"]
    } else {
      return ["2025"]
    }
  }

  const displayLabels = getLabelsForView()

  const receivablesPayablesOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      title: {
        display: true,
        text: "Receivables & Payables (R m)",
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
          display: false,
        },
      },
      x: {
        title: {
          display: false,
        },
      },
    },
  }

  const daysOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
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
          display: false,
        },
      },
      x: {
        title: {
          display: false,
        },
      },
    },
  }

  const inventoryOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
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
          display: false,
        },
        position: "left",
      },
      y1: {
        beginAtZero: true,
        title: {
          display: false,
        },
        position: "right",
        grid: {
          drawOnChartArea: false,
        },
      },
      x: {
        title: {
          display: false,
        },
      },
    },
  }

  const updateHealthDetailValue = (category, monthIndex, value) => {
    setHealthDetails(prev => ({
      ...prev,
      [category]: prev[category].map((val, idx) => idx === monthIndex ? value : val)
    }))
  }

  const renderHealthMonthlyInputs = (category, label) => {
    return (
      <div style={{ marginBottom: "20px" }}>
        <h5 style={{ color: "#5d4037", marginBottom: "15px", fontWeight: "600" }}>{label}</h5>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
          gap: "10px" 
        }}>
          {months.map((month, index) => (
            <div key={month} style={{ display: "flex", flexDirection: "column" }}>
              <label style={{ 
                fontSize: "12px", 
                color: "#72542b", 
                marginBottom: "5px", 
                fontWeight: "500" 
              }}>
                {month}
              </label>
              <input
                type="number"
                value={healthDetails[category][index] || ""}
                onChange={(e) => updateHealthDetailValue(category, index, e.target.value)}
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
          gap: "15px",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={() => setBalanceSheetTab("snapshot")}
          style={{
            padding: "10px 20px",
            backgroundColor: balanceSheetTab === "snapshot" ? "#5d4037" : "#e8ddd4",
            color: balanceSheetTab === "snapshot" ? "#fdfcfb" : "#5d4037",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
          }}
        >
          BS Snapshot
        </button>
        <button
          onClick={() => setBalanceSheetTab("health")}
          style={{
            padding: "10px 20px",
            backgroundColor: balanceSheetTab === "health" ? "#5d4037" : "#e8ddd4",
            color: balanceSheetTab === "health" ? "#fdfcfb" : "#5d4037",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
          }}
        >
          BS Health
        </button>
      </div>

      {balanceSheetTab === "snapshot" && (
        <>
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
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <label style={{ color: "#5d4037", fontWeight: "600" }}>Select Month:</label>
              <select
                value={currentMonth}
                onChange={(e) => onMonthChange(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                  backgroundColor: "#fdfcfb",
                  color: "#5d4037",
                  cursor: "pointer",
                }}
              >
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              {!isInvestorView && (
                <>
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
                    }}
                  >
                    Add Balance Sheet Details
                  </button>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#8b6914",
                      color: "#fdfcfb",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "14px",
                    }}
                  >
                    Upload CSV
                  </button>
                  <button
                    onClick={handleDownloadBalanceSheet}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#8b6914",
                      color: "#fdfcfb",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "14px",
                    }}
                  >
                    Download CSV
                  </button>
                </>
              )}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "30px",
            }}
          >
            <div
              style={{
                backgroundColor: "#f7f3f0",
                padding: "20px",
                borderRadius: "6px",
              }}
            >
              <h3 style={{ color: "#5d4037", marginBottom: "15px" }}>Assets</h3>

              <div style={{ marginBottom: "15px" }}>
                <h4 style={{ color: "#72542b", marginBottom: "10px" }}>Current Assets</h4>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span style={{ color: "#5d4037" }}>Cash</span>
                  <span style={{ color: "#5d4037", fontWeight: "600" }}>R{cash.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span style={{ color: "#5d4037" }}>Inventory</span>
                  <span style={{ color: "#5d4037", fontWeight: "600" }}>R{inventory.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span style={{ color: "#5d4037" }}>Prepaid Expenses</span>
                  <span style={{ color: "#5d4037", fontWeight: "600" }}>R{prepaidExpenses.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span style={{ color: "#5d4037" }}>Accounts Receivable</span>
                  <span style={{ color: "#5d4037", fontWeight: "600" }}>R{accountsReceivable.toLocaleString()}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "10px",
                    paddingTop: "10px",
                    borderTop: "2px solid #e8ddd4",
                  }}
                >
                  <span style={{ color: "#5d4037", fontWeight: "700" }}>Total Current Assets</span>
                  <span style={{ color: "#5d4037", fontWeight: "700" }}>R{totalCurrentAssets.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span style={{ color: "#5d4037" }}>Deposits</span>
                  <span style={{ color: "#5d4037", fontWeight: "600" }}>R{deposits.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <h4 style={{ color: "#72542b", marginBottom: "10px" }}>Non-Current Assets</h4>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span style={{ color: "#5d4037" }}>Property, Plant & Equipment</span>
                  <span style={{ color: "#5d4037", fontWeight: "600" }}>
                    R{propertyPlantEquipment.toLocaleString()}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span style={{ color: "#5d4037" }}>Intangible Assets</span>
                  <span style={{ color: "#5d4037", fontWeight: "600" }}>R{intangibleAssets.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span style={{ color: "#5d4037" }}>Accumulated Depreciation</span>
                  <span style={{ color: "#5d4037", fontWeight: "600" }}>
                    -R{accumulatedDepreciation.toLocaleString()}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "10px",
                    paddingTop: "10px",
                    borderTop: "2px solid #e8ddd4",
                  }}
                >
                  <span style={{ color: "#5d4037", fontWeight: "700" }}>Total Non-Current Assets</span>
                  <span style={{ color: "#5d4037", fontWeight: "700" }}>R{totalNonCurrentAssets.toLocaleString()}</span>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "20px",
                  paddingTop: "15px",
                  borderTop: "3px solid #5d4037",
                }}
              >
                <span style={{ color: "#5d4037", fontWeight: "800", fontSize: "18px" }}>Total Assets</span>
                <span style={{ color: "#5d4037", fontWeight: "800", fontSize: "18px" }}>
                  R{totalAssets.toLocaleString()}
                </span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#f7f3f0",
                padding: "20px",
                borderRadius: "6px",
              }}
            >
              <h3 style={{ color: "#5d4037", marginBottom: "15px" }}>Liabilities and Equity</h3>

              <div style={{ marginBottom: "15px" }}>
                <h4 style={{ color: "#72542b", marginBottom: "10px" }}>Current Liabilities</h4>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span style={{ color: "#5d4037" }}>Accounts Payable</span>
                  <span style={{ color: "#5d4037", fontWeight: "600" }}>R{accountsPayable.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span style={{ color: "#5d4037" }}>Current Borrowing</span>
                  <span style={{ color: "#5d4037", fontWeight: "600" }}>R{currentBorrowing.toLocaleString()}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "10px",
                    paddingTop: "10px",
                    borderTop: "2px solid #e8ddd4",
                  }}
                >
                  <span style={{ color: "#5d4037", fontWeight: "700" }}>Total Current Liabilities</span>
                  <span style={{ color: "#5d4037", fontWeight: "700" }}>
                    R{totalCurrentLiabilities.toLocaleString()}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span style={{ color: "#5d4037" }}>Non-Current Liabilities</span>
                  <span style={{ color: "#5d4037", fontWeight: "600" }}>R{nonCurrentLiabilities.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span style={{ color: "#5d4037" }}>Long-term Liabilities</span>
                  <span style={{ color: "#5d4037", fontWeight: "600" }}>R{longTermLiabilities.toLocaleString()}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "10px",
                    paddingTop: "10px",
                    borderTop: "2px solid #e8ddd4",
                  }}
                >
                  <span style={{ color: "#5d4037", fontWeight: "700" }}>Total Liabilities</span>
                  <span style={{ color: "#5d4037", fontWeight: "700" }}>R{totalLiabilities.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <h4 style={{ color: "#72542b", marginBottom: "10px" }}>Equity</h4>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span style={{ color: "#5d4037" }}>Owners Equity</span>
                  <span style={{ color: "#5d4037", fontWeight: "600" }}>R{ownersEquity.toLocaleString()}</span>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "20px",
                  paddingTop: "15px",
                  borderTop: "3px solid #5d4037",
                }}
              >
                <span style={{ color: "#5d4037", fontWeight: "800", fontSize: "18px" }}>
                  Total Liabilities and Capital
                </span>
                <span style={{ color: "#5d4037", fontWeight: "800", fontSize: "18px" }}>
                  R{totalLiabilitiesAndCapital.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {balanceSheetTab === "health" && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "20px",
            }}
          >
            {!isInvestorView && (
              <button
                onClick={handleAddHealthDetails}
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
                Add Balance Sheet Health Details
              </button>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: "20px",
              justifyContent: "space-between",
            }}
          >
            <div style={{ flex: 1, height: "300px", padding: "15px", backgroundColor: "#f7f3f0", borderRadius: "6px" }}>
              <Bar
                data={{
                  labels: displayLabels,
                  datasets: [
                    {
                      label: "Receivables",
                      data: aggregateDataForView(receivablesData),
                      backgroundColor: "rgba(93, 64, 55, 0.6)",
                      borderColor: "rgb(93, 64, 55)",
                      borderWidth: 2,
                    },
                    {
                      label: "Payables",
                      data: aggregateDataForView(payablesData),
                      backgroundColor: "rgba(139, 105, 20, 0.6)",
                      borderColor: "rgb(139, 105, 20)",
                      borderWidth: 2,
                    },
                  ],
                }}
                options={receivablesPayablesOptions}
              />
            </div>

            <div style={{ flex: 1, height: "300px", padding: "15px", backgroundColor: "#f7f3f0", borderRadius: "6px" }}>
              <Bar
                data={{
                  labels: displayLabels,
                  datasets: [
                    {
                      label: "Receivables Days",
                      data: aggregateDataForView(receivablesDaysData),
                      backgroundColor: "rgba(114, 84, 43, 0.6)",
                      borderColor: "rgb(114, 84, 43)",
                      borderWidth: 2,
                    },
                    {
                      label: "Payables Days",
                      data: aggregateDataForView(payablesDaysData),
                      backgroundColor: "rgba(156, 124, 95, 0.6)",
                      borderColor: "rgb(156, 124, 95)",
                      borderWidth: 2,
                    },
                  ],
                }}
                options={daysOptions}
              />
            </div>

            <div style={{ flex: 1, height: "300px", padding: "15px", backgroundColor: "#f7f3f0", borderRadius: "6px" }}>
              <Bar
                data={{
                  labels: displayLabels,
                  datasets: [
                    {
                      label: "Inventory",
                      data: aggregateDataForView(inventoryData),
                      backgroundColor: "rgba(76, 175, 80, 0.6)",
                      borderColor: "rgb(76, 175, 80)",
                      borderWidth: 2,
                      yAxisID: "y",
                    },
                    {
                      label: "Inventory Days",
                      data: aggregateDataForView(inventoryDaysData),
                      backgroundColor: "rgba(139, 105, 20, 0.6)",
                      borderColor: "rgb(139, 105, 20)",
                      borderWidth: 2,
                      yAxisID: "y1",
                    },
                  ],
                }}
                options={inventoryOptions}
              />
            </div>
          </div>
        </>
      )}

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
              maxWidth: "800px",
              maxHeight: "90vh",
              overflow: "auto",
              width: "90%",
            }}
          >
            <h3 style={{ color: "#5d4037", marginBottom: "20px" }}>Add Balance Sheet Details - {currentMonth}</h3>

            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ color: "#5d4037", marginBottom: "10px" }}>Assets</h4>

              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Cash:
              </label>
              <input
                type="number"
                value={balanceSheetDetails.cash}
                onChange={(e) => setBalanceSheetDetails({ ...balanceSheetDetails, cash: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "15px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                }}
              />

              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Inventory:
              </label>
              <input
                type="number"
                value={balanceSheetDetails.inventory}
                onChange={(e) => setBalanceSheetDetails({ ...balanceSheetDetails, inventory: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "15px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                }}
              />

              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Prepaid Expenses:
              </label>
              <input
                type="number"
                value={balanceSheetDetails.prepaidExpenses}
                onChange={(e) => setBalanceSheetDetails({ ...balanceSheetDetails, prepaidExpenses: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "15px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                }}
              />

              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Accounts Receivable:
              </label>
              <input
                type="number"
                value={balanceSheetDetails.accountsReceivable}
                onChange={(e) => setBalanceSheetDetails({ ...balanceSheetDetails, accountsReceivable: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "15px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                }}
              />

              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Deposits:
              </label>
              <input
                type="number"
                value={balanceSheetDetails.deposits}
                onChange={(e) => setBalanceSheetDetails({ ...balanceSheetDetails, deposits: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "15px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                }}
              />

              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Property, Plant & Equipment:
              </label>
              <input
                type="number"
                value={balanceSheetDetails.propertyPlantEquipment}
                onChange={(e) =>
                  setBalanceSheetDetails({ ...balanceSheetDetails, propertyPlantEquipment: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "15px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                }}
              />

              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Intangible Assets:
              </label>
              <input
                type="number"
                value={balanceSheetDetails.intangibleAssets}
                onChange={(e) => setBalanceSheetDetails({ ...balanceSheetDetails, intangibleAssets: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "15px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                }}
              />

              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Accumulated Depreciation:
              </label>
              <input
                type="number"
                value={balanceSheetDetails.accumulatedDepreciation}
                onChange={(e) =>
                  setBalanceSheetDetails({ ...balanceSheetDetails, accumulatedDepreciation: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "15px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ color: "#5d4037", marginBottom: "10px" }}>Liabilities</h4>

              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Accounts Payable:
              </label>
              <input
                type="number"
                value={balanceSheetDetails.accountsPayable}
                onChange={(e) => setBalanceSheetDetails({ ...balanceSheetDetails, accountsPayable: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "15px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                }}
              />

              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Current Borrowing:
              </label>
              <input
                type="number"
                value={balanceSheetDetails.currentBorrowing}
                onChange={(e) => setBalanceSheetDetails({ ...balanceSheetDetails, currentBorrowing: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "15px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                }}
              />

              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Non-Current Liabilities:
              </label>
              <input
                type="number"
                value={balanceSheetDetails.nonCurrentLiabilities}
                onChange={(e) =>
                  setBalanceSheetDetails({ ...balanceSheetDetails, nonCurrentLiabilities: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "15px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                }}
              />

              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Long-term Liabilities:
              </label>
              <input
                type="number"
                value={balanceSheetDetails.longTermLiabilities}
                onChange={(e) =>
                  setBalanceSheetDetails({ ...balanceSheetDetails, longTermLiabilities: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "15px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ color: "#5d4037", marginBottom: "10px" }}>Equity</h4>

              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Owners Equity:
              </label>
              <input
                type="number"
                value={balanceSheetDetails.ownersEquity}
                onChange={(e) => setBalanceSheetDetails({ ...balanceSheetDetails, ownersEquity: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "15px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ color: "#5d4037", marginBottom: "10px" }}>P&L Data (for Cashflow)</h4>

              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                Sales:
              </label>
              <input
                type="number"
                value={balanceSheetDetails.sales}
                onChange={(e) => setBalanceSheetDetails({ ...balanceSheetDetails, sales: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "15px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                }}
              />

              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                COGS:
              </label>
              <input
                type="number"
                value={balanceSheetDetails.cogs}
                onChange={(e) => setBalanceSheetDetails({ ...balanceSheetDetails, cogs: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "15px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                }}
              />

              <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
                OPEX:
              </label>
              <input
                type="number"
                value={balanceSheetDetails.opex}
                onChange={(e) => setBalanceSheetDetails({ ...balanceSheetDetails, opex: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "15px",
                  borderRadius: "4px",
                  border: "1px solid #e8ddd4",
                }}
              />
            </div>

            <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
              Notes:
            </label>
            <textarea
              value={balanceSheetDetails.notes}
              onChange={(e) => setBalanceSheetDetails({ ...balanceSheetDetails, notes: e.target.value })}
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
                onClick={handleSaveDetails}
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
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}

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
              backgroundColor: "#fdfcfb",
              padding: "30px",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "90%",
            }}
          >
            <h3 style={{ color: "#5d4037", marginBottom: "20px" }}>Upload Balance Sheet CSV</h3>
            <p style={{ color: "#5d4037", marginBottom: "20px", fontSize: "14px" }}>
              Upload a CSV file with your balance sheet data. The file should have two columns: field name and value.
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleUploadBalanceSheet}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "20px",
                borderRadius: "4px",
                border: "1px solid #e8ddd4",
              }}
            />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowUploadModal(false)}
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
            </div>
          </div>
        </div>
      )}

      {showHealthModal && !isInvestorView && (
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
            <h3 style={{ color: "#5d4037", marginBottom: "20px" }}>Add Balance Sheet Health Details</h3>

            {renderHealthMonthlyInputs("receivables", "Receivables")}
            {renderHealthMonthlyInputs("payables", "Payables")}
            {renderHealthMonthlyInputs("receivablesDays", "Receivables Days")}
            {renderHealthMonthlyInputs("payablesDays", "Payables Days")}
            {renderHealthMonthlyInputs("inventory", "Inventory")}
            {renderHealthMonthlyInputs("inventoryDays", "Inventory Days")}

            <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>Date:</label>
            <input
              type="date"
              value={healthDetails.date}
              onChange={(e) => setHealthDetails({ ...healthDetails, date: e.target.value })}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "15px",
                borderRadius: "4px",
                border: "1px solid #e8ddd4",
              }}
            />

            <label style={{ display: "block", marginBottom: "10px", color: "#5d4037", fontWeight: "600" }}>
              Notes:
            </label>
            <textarea
              value={healthDetails.notes}
              onChange={(e) => setHealthDetails({ ...healthDetails, notes: e.target.value })}
              placeholder="Enter any additional notes"
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
                onClick={() => setShowHealthModal(false)}
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
                onClick={handleSaveHealthDetails}
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
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const FinancialPerformance = () => {
  const [activeSection, setActiveSection] = useState("pnl-snapshot")
  const [viewMode, setViewMode] = useState("month")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [financialYearStart, setFinancialYearStart] = useState("Jan")
  const [chartData, setChartData] = useState({})
  const [balanceSheetData, setBalanceSheetData] = useState(null)
  const [pnlData, setPnLData] = useState(null)
  const [currentMonth, setCurrentMonth] = useState("Jan")
  const [user, setUser] = useState(null)

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
    { id: "pnl-snapshot", label: "P&L Snapshot" },
    { id: "cashflow-trends", label: "Cashflow Trends" },
    { id: "balance-sheet", label: "Balance Sheet" },
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
          </div>

          <PnLSnapshot
            activeSection={activeSection}
            viewMode={viewMode}
            financialYearStart={financialYearStart}
            pnlData={pnlData}
            user={user}
            onUpdateChartData={handleUpdateChartData}
            isInvestorView={isInvestorView}
          />

          <CashflowTrends
            activeSection={activeSection}
            viewMode={viewMode}
            financialYearStart={financialYearStart}
            balanceSheetData={balanceSheetData}
            currentMonth={currentMonth}
          />

          <BalanceSheet
            activeSection={activeSection}
            viewMode={viewMode}
            onUpdateBalanceSheet={handleUpdateBalanceSheet}
            balanceSheetData={balanceSheetData}
            currentMonth={currentMonth}
            onMonthChange={handleMonthChange}
            user={user}
            onUpdateChartData={handleUpdateChartData}
            chartData={chartData}
            isInvestorView={isInvestorView}
          />
        </div>
      </div>
    </div>
  )
}

export default FinancialPerformance