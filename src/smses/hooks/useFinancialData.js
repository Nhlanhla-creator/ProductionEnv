"use client"
import { useState, useCallback } from "react"
import { db } from "../../firebaseConfig"
import { collection, getDocs, getDoc, doc, query, where, orderBy } from "firebase/firestore"
import {
  processPnlFromFirebase,
  computePnlChartData,
  computeCostChartData,
  computeLiquidityChartData,
} from "../MyGrowthTools/financial/financialUtils"
import { EMPTY_BALANCE_SHEET, EMPTY_PNL } from "../MyGrowthTools/financial/financialConstants"

export const useCapitalStructureData = (user) => {
  const [balanceSheetData, setBalanceSheetData] = useState(EMPTY_BALANCE_SHEET)
  const [solvencyData, setSolvencyData]   = useState({ debtToEquity: Array(12).fill("0"), debtToAssets: Array(12).fill("0"), equityRatio: Array(12).fill("0"), interestCoverage: Array(12).fill("0"), debtServiceCoverage: Array(12).fill("0"), nav: Array(12).fill("0") })
  const [leverageData, setLeverageData]   = useState({ totalDebtRatio: Array(12).fill("0"), longTermDebtRatio: Array(12).fill("0"), equityMultiplier: Array(12).fill("0") })
  const [equityData, setEquityData]       = useState({ returnOnEquity: Array(12).fill("0"), bookValuePerShare: Array(12).fill("0"), equityRatio: Array(12).fill("0") })
  const [dividendHistory, setDividendHistory] = useState([])
  const [kpiNotes, setKpiNotes]           = useState({})
  const [kpiAnalysis, setKpiAnalysis]     = useState({})
  const [loading, setLoading]             = useState(false)

  const loadCapitalStructureData = useCallback(async (year = new Date().getFullYear()) => {
    if (!user) return
    setLoading(true)
    try {
      // Try year-keyed doc first, fall back to legacy key for migration
      let snap = await getDoc(doc(db, "financialData", `${user.uid}_capitalStructure_${year}`))
      if (!snap.exists()) snap = await getDoc(doc(db, "financialData", `${user.uid}_capitalStructure`))
      if (snap.exists()) {
        const d = snap.data()
        if (d.balanceSheetData) setBalanceSheetData(d.balanceSheetData)
        if (d.solvencyData)     setSolvencyData(d.solvencyData)
        if (d.leverageData)     setLeverageData(d.leverageData)
        if (d.equityData)       setEquityData(d.equityData)
        if (d.kpiNotes)         setKpiNotes(d.kpiNotes)
        if (d.kpiAnalysis)      setKpiAnalysis(d.kpiAnalysis)
      }
    } catch (e) { console.error("Error loading capital structure:", e) }
    finally { setLoading(false) }
  }, [user])

  const loadDividendHistory = useCallback(async () => {
    if (!user) return
    try {
      const q = query(
        collection(db, "financialData", `${user.uid}_dividends`, "dividendHistory"),
        orderBy("date", "desc")
      )
      const snap = await getDocs(q)
      setDividendHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) { console.error("Error loading dividends:", e) }
  }, [user])

  return {
    balanceSheetData, setBalanceSheetData,
    solvencyData, setSolvencyData,
    leverageData, setLeverageData,
    equityData, setEquityData,
    dividendHistory, setDividendHistory,
    kpiNotes, setKpiNotes,
    kpiAnalysis,
    loading,
    loadCapitalStructureData,
    loadDividendHistory,
  }
}

export const usePerformanceEngineData = (user) => {
  const [pnlDetails, setPnlDetails] = useState(EMPTY_PNL)
  const [firebaseChartData, setFirebaseChartData] = useState({})
  const [chartNotes, setChartNotes]   = useState({})
  const [chartAnalysis, setChartAnalysis] = useState({})
  const [customKPIs, setCustomKPIs]   = useState({})
  const [loading, setLoading]         = useState(false)

  const loadPnLData = useCallback(async (onUpdateChartData, year = new Date().getFullYear()) => {
    if (!user) return
    setLoading(true)
    try {
      // Try year-keyed doc first, fall back to legacy key for migration
      let snap = await getDoc(doc(db, "financialData", `${user.uid}_pnlManual_${year}`))
      if (!snap.exists()) snap = await getDoc(doc(db, "financialData", `${user.uid}_pnlManual`))
      if (snap.exists()) {
        const d = snap.data()
        setPnlDetails(processPnlFromFirebase(d))
        if (d.chartNotes)   setChartNotes(d.chartNotes)
        if (d.chartAnalysis) setChartAnalysis(d.chartAnalysis)
        const chartData = computePnlChartData(d)
        setFirebaseChartData(chartData)
        if (onUpdateChartData) Object.keys(chartData).forEach(k => onUpdateChartData(k, chartData[k]))
      }
    } catch (e) { console.error("Error loading PnL:", e) }
    finally { setLoading(false) }
  }, [user])

  const loadCustomKPIs = useCallback(async (setVisibleCharts) => {
    if (!user) return
    try {
      const q = query(
        collection(db, "financialData"),
        where("userId", "==", user.uid),
        where("isCustomKPI", "==", true),
        where("section", "==", "performance-engine")
      )
      const snap = await getDocs(q)
      const kpis = {}
      snap.forEach(d => {
        const data = d.data()
        kpis[data.chartName] = data
        if (setVisibleCharts) setVisibleCharts(prev => ({ ...prev, [data.chartName]: true }))
      })
      setCustomKPIs(kpis)
    } catch (e) { console.error("Error loading custom KPIs:", e) }
  }, [user])

  return {
    pnlDetails, setPnlDetails,
    firebaseChartData, setFirebaseChartData,
    chartNotes, setChartNotes,
    chartAnalysis,
    customKPIs,
    loading,
    loadPnLData,
    loadCustomKPIs,
  }
}

export const useCostAgilityData = (user) => {
  const [costDetails, setCostDetails]   = useState({ fixedCosts: Array(12).fill(""), variableCosts: Array(12).fill(""), discretionaryCosts: Array(12).fill(""), semiVariableCosts: Array(12).fill(""), lockInDuration: Array(12).fill(""), notes: "" })
  const [firebaseChartData, setFirebaseChartData] = useState({})
  const [chartNotes, setChartNotes]     = useState({})
  const [chartAnalysis, setChartAnalysis] = useState({})
  const [loading, setLoading]           = useState(false)

  const loadCostData = useCallback(async (year = new Date().getFullYear()) => {
    if (!user) return
    setLoading(true)
    try {
      let snap = await getDoc(doc(db, "financialData", `${user.uid}_costAgility_${year}`))
      if (!snap.exists()) snap = await getDoc(doc(db, "financialData", `${user.uid}_costAgility`))
      if (snap.exists()) {
        const d = snap.data()
        setCostDetails({
          fixedCosts:         d.fixedCosts?.map(v => v.toFixed(2))    ?? Array(12).fill(""),
          variableCosts:      d.variableCosts?.map(v => v.toFixed(2)) ?? Array(12).fill(""),
          discretionaryCosts: d.discretionaryCosts?.map(v => v.toFixed(2)) ?? Array(12).fill(""),
          semiVariableCosts:  d.semiVariableCosts?.map(v => v.toFixed(2))  ?? Array(12).fill(""),
          lockInDuration:     d.lockInDuration?.map(v => v.toFixed(0))     ?? Array(12).fill(""),
          notes: d.notes || "",
        })
        setFirebaseChartData(computeCostChartData(d))
      }
    } catch (e) { console.error("Error loading cost data:", e) }
    finally { setLoading(false) }
  }, [user])

  return {
    costDetails, setCostDetails,
    firebaseChartData,
    chartNotes, setChartNotes,
    chartAnalysis,
    loading,
    loadCostData,
  }
}

export const useLiquidityData = (user) => {
  const emptyArr = () => Array(12).fill("")
  const [liquidityDetails, setLiquidityDetails] = useState({
    currentRatio: emptyArr(), quickRatio: emptyArr(), cashRatio: emptyArr(),
    burnRate: emptyArr(), cashCover: emptyArr(), cashflow: emptyArr(),
    operatingCashflow: emptyArr(), investingCashflow: emptyArr(), financingCashflow: emptyArr(),
    loanRepayments: emptyArr(), cashBalance: emptyArr(), workingCapital: emptyArr(), notes: "",
  })
  const [firebaseChartData, setFirebaseChartData] = useState({})
  const [chartNotes, setChartNotes]   = useState({})
  const [chartAnalysis, setChartAnalysis] = useState({})
  const [loans, setLoans]             = useState([])
  const [loading, setLoading]         = useState(false)

  const loadLiquidityData = useCallback(async (year = new Date().getFullYear()) => {
    if (!user) return
    setLoading(true)
    try {
      let snap = await getDoc(doc(db, "financialData", `${user.uid}_liquiditySurvival_${year}`))
      if (!snap.exists()) snap = await getDoc(doc(db, "financialData", `${user.uid}_liquiditySurvival`))
      if (snap.exists()) {
        const d = snap.data()
        setLiquidityDetails({
          currentRatio: d.currentRatio?.map(v => v.toFixed(2))   ?? emptyArr(),
          quickRatio:   d.quickRatio?.map(v => v.toFixed(2))     ?? emptyArr(),
          cashRatio:    d.cashRatio?.map(v => v.toFixed(2))      ?? emptyArr(),
          burnRate:     d.burnRate?.map(v => v.toFixed(2))       ?? emptyArr(),
          cashCover:    d.cashCover?.map(v => v.toFixed(1))      ?? emptyArr(),
          cashflow:     d.cashflow?.map(v => v.toFixed(2))       ?? emptyArr(),
          operatingCashflow:  d.operatingCashflow?.map(v => v.toFixed(2))  ?? emptyArr(),
          investingCashflow:  d.investingCashflow?.map(v => v.toFixed(2))  ?? emptyArr(),
          financingCashflow:  d.financingCashflow?.map(v => v.toFixed(2))  ?? emptyArr(),
          loanRepayments: d.loanRepayments?.map(v => v.toFixed(2)) ?? emptyArr(),
          cashBalance:    d.cashBalance?.map(v => v.toFixed(2))    ?? emptyArr(),
          workingCapital: d.workingCapital?.map(v => v.toFixed(2)) ?? emptyArr(),
          notes: d.notes || "",
        })
        setFirebaseChartData(computeLiquidityChartData(d))
      }
    } catch (e) { console.error("Error loading liquidity:", e) }
    finally { setLoading(false) }
  }, [user])

  const loadLoans = useCallback(async () => {
    if (!user) return
    try {
      const q = query(
        collection(db, "financialData"),
        where("userId", "==", user.uid),
        where("type", "==", "loan"),
        where("section", "==", "liquidity-survival")
      )
      const snap = await getDocs(q)
      setLoans(snap.docs.map(d => d.data()))
    } catch (e) { console.error("Error loading loans:", e) }
  }, [user])

  return {
    liquidityDetails, setLiquidityDetails,
    firebaseChartData,
    chartNotes, setChartNotes,
    chartAnalysis,
    loans,
    loading,
    loadLiquidityData,
    loadLoans,
  }
}