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
import CapitalStructure from "./CapitalStructure"

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend)

const PerformanceEngine = ({
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
        where("isCustomKPI", "==", true),
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
      ebitda: { actual: ebitda.map((val) => val / 1000000), budget: ebitdaBudget.map((val) => val / 1000000) },
      netProfit: { actual: netProfit.map((val) => val / 1000000), budget: netProfitBudget.map((val) => val / 1000000) },
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

  if (activeSection !== "performance-engine") return null

  const generateLabels = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const startMonthIndex = months.indexOf(selectedFinancialYearStart)
    const orderedMonths = [...months.slice(startMonthIndex), ...months.slice(0, startMonthIndex)]

    if (viewMode === "month") {
      return orderedMonths
    } else if (viewMode === "quarter") {
      return ["Q1", "Q2", "Q3", "Q4"]
    } else {
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
    { key: "netProfit", title: "NP & NP Margins", visible: visibleCharts.netProfit },
  ]

  const marginChartConfigs = [
    { key: "gpMargin", title: "GP Margin (%)", visible: visibleCharts.gpMargin, isPercentage: true },
    { key: "npMargin", title: "NP Margin (%)", visible: visibleCharts.npMargin, isPercentage: true },
  ]

  return (
    <div style={{ paddingTop: "20px" }}>
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
            Is the business economically working?
          </span>
        </div>
        <div style={{ marginBottom: "8px" }}>
          <strong style={{ color: "#5d4037", fontSize: "14px" }}>Key Signals:</strong>
          <span style={{ color: "#5d4037", fontSize: "14px", marginLeft: "8px" }}>
            Margin trends, profitability direction
          </span>
        </div>
        <div>
          <strong style={{ color: "#5d4037", fontSize: "14px" }}>Key Decisions:</strong>
          <span style={{ color: "#5d4037", fontSize: "14px", marginLeft: "8px" }}>
            Fix pricing, cost control, growth pacing
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ color: "#5d4037", fontSize: "24px", fontWeight: "700" }}>Performance Engine</h2>

        {!isInvestorView && (
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
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
              Add Details
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
                fontSize: "14px",
                transition: "all 0.3s ease",
              }}
            >
              Add Custom KPI
            </button>
          </div>
        )}
      </div>

      {/* Chart Grid - 3 per row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
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
                <div style={{ marginTop: "15px" }}>
                  <button
                    onClick={() => toggleNotes(config.key)}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#e8ddd4",
                      color: "#5d4037",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "12px",
                      marginBottom: "10px",
                    }}
                  >
                    {expandedNotes[config.key] ? "Hide Notes" : "Add Notes"}
                  </button>

                  {expandedNotes[config.key] && (
                    <textarea
                      value={chartNotes[config.key] || ""}
                      onChange={(e) => updateChartNote(config.key, e.target.value)}
                      placeholder="Add analysis notes..."
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        minHeight: "80px",
                        fontSize: "13px",
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Margin Charts */}
      <h3 style={{ color: "#5d4037", fontSize: "20px", fontWeight: "600", marginBottom: "15px" }}>Margin Analysis</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        {marginChartConfigs
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
              <Line
                data={createChartData(config.key, config.isPercentage)}
                options={chartOptions(config.title, config.isPercentage)}
              />

              {!isInvestorView && (
                <div style={{ marginTop: "15px" }}>
                  <button
                    onClick={() => toggleNotes(config.key)}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#e8ddd4",
                      color: "#5d4037",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "12px",
                      marginBottom: "10px",
                    }}
                  >
                    {expandedNotes[config.key] ? "Hide Notes" : "Add Notes"}
                  </button>

                  {expandedNotes[config.key] && (
                    <textarea
                      value={chartNotes[config.key] || ""}
                      onChange={(e) => updateChartNote(config.key, e.target.value)}
                      placeholder="Add analysis notes..."
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "4px",
                        border: "1px solid #e8ddd4",
                        minHeight: "80px",
                        fontSize: "13px",
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Custom KPIs */}
      {Object.keys(customKPIs).length > 0 && (
        <>
          <h3 style={{ color: "#5d4037", fontSize: "20px", fontWeight: "600", marginBottom: "15px" }}>Custom KPIs</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "20px" }}>
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
            <h3 style={{ color: "#5d4037", marginBottom: "20px" }}>Add Custom KPI</h3>

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

  useEffect(() => {
    if (user) {
      loadCostDataFromFirebase()
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
    return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
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
    return {
      labels,
      datasets: [
        {
          label: "Actual",
          data: data.actual,
          backgroundColor: "rgba(93, 64, 55, 0.6)",
          borderColor: "rgb(93, 64, 55)",
          borderWidth: 2,
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

  return (
    <div style={{ paddingTop: "20px" }}>
      {/* Tab Description */}
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
            Can costs flex under pressure? If revenue Drops?
          </span>
        </div>
        <div style={{ marginBottom: "8px" }}>
          <strong style={{ color: "#5d4037", fontSize: "14px" }}>Key Signals:</strong>
          <span style={{ color: "#5d4037", fontSize: "14px", marginLeft: "8px" }}>Fixed vs variable rigidity</span>
        </div>
        <div>
          <strong style={{ color: "#5d4037", fontSize: "14px" }}>Key Decisions:</strong>
          <span style={{ color: "#5d4037", fontSize: "14px", marginLeft: "8px" }}>
            Restructure costs, delay scaling, Renegotiate contracts, Adjust capital strategy
          </span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#5d4037", fontSize: "24px", fontWeight: "700" }}>Cost Agility</h2>

        {!isInvestorView && (
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
            Add Details
          </button>
        )}
      </div>

      {/* Chart Grid - 3 per row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "20px" }}>
        <div
          style={{
            backgroundColor: "#fdfcfb",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <Bar data={createChartData("fixedCosts")} options={chartOptions("Fixed/Variable Ratio")} />
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
        </div>
      </div>

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
    </div>
  )
}

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

  useEffect(() => {
    if (user) {
      loadLiquidityDataFromFirebase()
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
    return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
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
    return {
      labels,
      datasets: [
        {
          label: "Actual",
          data: data.actual,
          backgroundColor: "rgba(93, 64, 55, 0.6)",
          borderColor: "rgb(93, 64, 55)",
          borderWidth: 2,
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

  return (
    <div style={{ paddingTop: "20px" }}>
      {/* Tab Description */}
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
            Will the business survive a shock?
          </span>
        </div>
        <div style={{ marginBottom: "8px" }}>
          <strong style={{ color: "#5d4037", fontSize: "14px" }}>Key Signals:</strong>
          <span style={{ color: "#5d4037", fontSize: "14px", marginLeft: "8px" }}>Cash runway, burn risk</span>
        </div>
        <div>
          <strong style={{ color: "#5d4037", fontSize: "14px" }}>Key Decisions:</strong>
          <span style={{ color: "#5d4037", fontSize: "14px", marginLeft: "8px" }}>
            Cut burn, raise capital, slow growth
          </span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#5d4037", fontSize: "24px", fontWeight: "700" }}>Liquidity & Survival</h2>

        {!isInvestorView && (
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
            Add Details
          </button>
        )}
      </div>

      {/* Chart Grid - 3 per row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "20px" }}>
        <div
          style={{
            backgroundColor: "#fdfcfb",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <Bar data={createChartData("currentRatio")} options={chartOptions("Current Ratio")} />
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
        </div>
      </div>

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
    </div>
  )
}

const FinancialPerformance = () => {
  const [activeSection, setActiveSection] = useState("capital-structure")
  const [viewMode, setViewMode] = useState("month")
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
    setViewMode(newViewMode)
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
          <div style={{ marginBottom: "30px" }}>
            <h1 style={{ color: "#5d4037", fontSize: "32px", fontWeight: "700", marginBottom: "20px" }}>
              Financial Performance
            </h1>

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
                    Assesses solvency, liquidity, survivability, capital quality, and financial risk
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

              <div>
                <strong style={{ color: "#5d4037", fontSize: "16px", display: "block", marginBottom: "5px" }}>
                  What this dashboard, do
                </strong>
                <span style={{ color: "#5d4037", fontSize: "15px" }}>
                  Bookkeeping, invoicing, payments, payroll, accounting automation
                </span>
              </div>

              {showFullDescription && (
                <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #e8ddd4" }}>
                  <p style={{ color: "#5d4037", fontSize: "14px", lineHeight: "1.6", marginBottom: "12px" }}>
                    This dashboard provides a comprehensive view of your business's financial health across four key
                    dimensions:
                  </p>
                  <ul style={{ color: "#5d4037", fontSize: "14px", lineHeight: "1.8", paddingLeft: "20px" }}>
                    <li>
                      <strong>Capital Structure:</strong> Evaluate whether your business is financially solvent and
                      appropriately structured for its current stage
                    </li>
                    <li>
                      <strong>Performance Engine:</strong> Assess if your business model is economically viable through
                      margin trends and profitability direction
                    </li>
                    <li>
                      <strong>Cost Agility:</strong> Determine if your cost structure can flex under revenue pressure
                      and identify opportunities for restructuring
                    </li>
                    <li>
                      <strong>Liquidity & Survival:</strong> Monitor cash runway and burn risk to ensure your business
                      can survive unexpected shocks
                    </li>
                  </ul>
                  <p style={{ color: "#5d4037", fontSize: "14px", lineHeight: "1.6", marginTop: "12px" }}>
                    Each section provides key metrics, signals, and decision points to help you make informed strategic
                    choices about your business's financial future.
                  </p>
                </div>
              )}
            </div>
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

          {/* View mode buttons - show for Performance Engine only */}
          {activeSection === "performance-engine" && (
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
                  onClick={() => handleViewModeToggle("month")}
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
                  onClick={() => handleViewModeToggle("quarter")}
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
                  onClick={() => handleViewModeToggle("year")}
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
          )}

          {activeSection === "capital-structure" && (
            <CapitalStructure
              activeSection={activeSection}
              viewMode={viewMode}
              user={user}
              isInvestorView={isInvestorView}
              isEmbedded={true}
            />
          )}

          <PerformanceEngine
            activeSection={activeSection}
            viewMode={viewMode}
            financialYearStart={financialYearStart}
            pnlData={pnlData}
            user={user}
            onUpdateChartData={handleUpdateChartData}
            isInvestorView={isInvestorView}
          />

          <CostAgility
            activeSection={activeSection}
            viewMode={viewMode}
            user={user}
            onUpdateChartData={handleUpdateChartData}
            isInvestorView={isInvestorView}
          />

          <LiquiditySurvival
            activeSection={activeSection}
            viewMode={viewMode}
            user={user}
            onUpdateChartData={handleUpdateChartData}
            isInvestorView={isInvestorView}
          />
        </div>
      </div>
    </div>
  )
}

export default FinancialPerformance
