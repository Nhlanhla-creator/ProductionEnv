"use client";

import { useState, useEffect } from "react"
import { Bar, Pie } from "react-chartjs-2"
import { doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, deleteDoc } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"
import { onAuthStateChanged } from "firebase/auth"
import { Info, ChevronDown, ChevronUp, Upload, X, TrendingUp, TrendingDown } from "lucide-react"
import {
  DateRangePicker,
  EyeIcon,
  CalculationModal,
  KeyQuestionBox,
  TrendModal,
  SectionControlsBar,
  KpiGrid3,
  KpiGrid2,
} from "./financial/components/SharedComponents"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend);

// ==================== HELPER FUNCTIONS ====================

const getMonthsForYear = (year, financialYearStart = "Jan") => {
  const allMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const startIndex = allMonths.indexOf(financialYearStart)
  if (startIndex === -1) return allMonths
  return [...allMonths.slice(startIndex), ...allMonths.slice(0, startIndex)]
}

const formatNumber = (value) => {
  const num = Number.parseFloat(value) || 0;
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(0);
};

const formatCurrency = (value) => {
  const num = Number.parseFloat(value) || 0;
  if (num >= 1e9) return `R${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `R${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `R${(num / 1e3).toFixed(2)}K`;
  return `R${num.toFixed(0)}`;
};

const formatDays = (value) => {
  const num = Number.parseFloat(value) || 0;
  return `${num.toFixed(0)} days`;
};

const formatPercentage = (value) => {
  const num = Number.parseFloat(value) || 0;
  return `${num.toFixed(1)}%`;
};

const getMonthIndex = (month) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.indexOf(month);
};

// Returns [{year, monthIdx (0-based), label "Mon YYYY"}] for every month in a YYYY-MM range
const getRangeMonths = (fromYM, toYM) => {
  const SHORTS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  const result = []
  let [y, m] = fromYM.split("-").map(Number)
  const [toY, toM] = toYM.split("-").map(Number)
  while (y < toY || (y === toY && m <= toM)) {
    result.push({ year: y, monthIdx: m - 1, label: `${SHORTS[m - 1]} ${y}` })
    m++
    if (m > 12) { m = 1; y++ }
  }
  return result
}

const circleColors = [
  { border: "#FF8C00", background: "#FFB347", text: "#663d00" },
  { border: "#32CD32", background: "#90EE90", text: "#1e4d1e" },
  { border: "#FFA500", background: "#FFD700", text: "#664d00" },
  { border: "#228B22", background: "#98FB98", text: "#145214" },
  { border: "#FF6347", background: "#FFA07A", text: "#8b3a2b" },
  { border: "#2E8B57", background: "#66CDAA", text: "#1e4d33" },
  { border: "#FF8C69", background: "#FFB6C1", text: "#8b4d39" },
  { border: "#006400", background: "#ADFF2F", text: "#003300" },
]

// ==================== COMPONENTS ====================

// ==================== UNIVERSAL ADD DATA MODAL ====================

const UniversalAddDataModal = ({ isOpen, onClose, currentTab, user, onSave, loading, initialData = {}, fromDate, toDate }) => {
  const [activeTab, setActiveTab] = useState(currentTab)

  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

  // Derive year tabs and per-year visible month indices from the date range
  const rangeMonths = (fromDate && toDate) ? getRangeMonths(fromDate, toDate) : null
  const rangeYears = rangeMonths
    ? [...new Set(rangeMonths.map(r => r.year))]
    : [toDate ? parseInt(toDate.split("-")[0]) : new Date().getFullYear()]
  const monthIndicesForYear = (year) => rangeMonths
    ? rangeMonths.filter(r => r.year === year).map(r => r.monthIdx)
    : [0,1,2,3,4,5,6,7,8,9,10,11]

  const [selectedYear, setSelectedYear] = useState(rangeYears[rangeYears.length - 1])

  // Reset selectedYear when range changes
  useEffect(() => {
    setSelectedYear(rangeYears[rangeYears.length - 1])
  }, [fromDate, toDate])

  const tabs = [
    { id: "pipeline-visibility", label: "Pipeline Visibility" },
    { id: "pipeline-sufficiency", label: "Pipeline Sufficiency" },
    { id: "revenue-concentration", label: "Revenue Concentration" },
    { id: "demand-sustainability", label: "Demand Sustainability" },
    { id: "pipeline-table", label: "Pipeline Table" }
  ]

  // Pipeline visibility: keyed by year so multi-year ranges work
  const emptyVisYear = () => ({
    newLeads: Array(12).fill(""), newLeadsBudget: Array(12).fill(0),
    salesVelocity: Array(12).fill(""), salesVelocityBudget: Array(12).fill(0),
    conversionRates: Array(12).fill(""), conversionRatesBudget: Array(12).fill(0),
    notes: ""
  })
  const [visibilityByYear, setVisibilityByYear] = useState(() => Object.fromEntries(rangeYears.map(y => [y, emptyVisYear()])))

  const [pipelineSufficiencyData, setPipelineSufficiencyData] = useState({ totalPipelineValue: "", probability: "", targetRevenue: "", notes: "" })
  const [revenueConcentrationData, setRevenueConcentrationData] = useState({
    revenueChannels: [
      { name: "Social Media", revenue: "", spend: "" }, { name: "Email", revenue: "", spend: "" },
      { name: "PPC", revenue: "", spend: "" }, { name: "SEO", revenue: "", spend: "" },
      { name: "Referral", revenue: "", spend: "" }, { name: "Direct", revenue: "", spend: "" }
    ],
    customerSegments: [
      { name: "Enterprise", revenue: "", customerCount: "" }, { name: "SMB", revenue: "", customerCount: "" },
      { name: "Startup", revenue: "", customerCount: "" }, { name: "Non-Profit", revenue: "", customerCount: "" },
      { name: "Education", revenue: "", customerCount: "" }
    ],
    revenueByCustomer: [], notes: "",
  })
  const [demandSustainabilityData, setDemandSustainabilityData] = useState({
    repeatCustomerRate: "", churnRate: "",
    campaigns: [
      { name: "Q1 Campaign", cost: "", revenue: "" }, { name: "Q2 Campaign", cost: "", revenue: "" },
      { name: "Summer Sale", cost: "", revenue: "" }, { name: "Holiday Campaign", cost: "", revenue: "" }
    ],
    notes: "",
  })
  const [pipelineDealData, setPipelineDealData] = useState({
    clientName: "", segment: "", stage: "initial-contact", probability: "", expectedClose: "",
    dealValue: "", source: "", owner: "", establishedStartDate: "", expectedOnboardingDate: "", signedDate: "",
  })

  // Helper: safely coerce a Firestore field to a 12-string array
  // Safely extract the actual values array from a Firestore field.
  // Handles plain arrays AND the {actual:[...], budget:[...]} shape.
  const toStrArray = (val) => {
    if (!val) return Array(12).fill("")
    const arr = Array.isArray(val) ? val : (Array.isArray(val?.actual) ? val.actual : null)
    if (!arr) return Array(12).fill("")
    return arr.map(String)
  }
  // Keep the budget array when it exists so we don't overwrite it on save
  const toBudgetArray = (val) => {
    if (!val) return Array(12).fill(0)
    return Array.isArray(val?.budget) ? val.budget : Array(12).fill(0)
  }

  useEffect(() => {
    if (isOpen && user) loadDataForTab(activeTab)
  }, [isOpen, activeTab, user, selectedYear])

  const loadDataForTab = async (tabId) => {
    try {
      switch(tabId) {
        case "pipeline-visibility":
          // Load all years in range, merge into visibilityByYear
          const updates = {}
          await Promise.all(rangeYears.map(async (yr) => {
            const snap = await getDoc(doc(db, "pipelineData", `${user.uid}_visibility_${yr}`))
            if (snap.exists()) {
              const d = snap.data()
              updates[yr] = {
                newLeads: toStrArray(d.newLeads), newLeadsBudget: toBudgetArray(d.newLeads),
                salesVelocity: toStrArray(d.salesVelocity), salesVelocityBudget: toBudgetArray(d.salesVelocity),
                conversionRates: toStrArray(d.conversionRates), conversionRatesBudget: toBudgetArray(d.conversionRates),
                notes: d.notes || ""
              }
            } else {
              updates[yr] = emptyVisYear()
            }
          }))
          setVisibilityByYear(prev => ({ ...prev, ...updates }))
          break
        case "pipeline-sufficiency":
          const suffDoc = await getDoc(doc(db, "pipelineData", `${user.uid}_sufficiency_${selectedYear}`))
          if (suffDoc.exists()) {
            const d = suffDoc.data()
            setPipelineSufficiencyData({ totalPipelineValue: d.totalPipelineValue?.toString() || "", probability: d.probability?.toString() || "", targetRevenue: d.targetRevenue?.toString() || "", notes: d.notes || "" })
          }
          break;
        case "revenue-concentration":
          const concDoc = await getDoc(doc(db, "pipelineData", `${user.uid}_concentration_${selectedYear}`))
          if (concDoc.exists()) {
            const d = concDoc.data()
            setRevenueConcentrationData({
              revenueChannels: d.revenueChannels || revenueConcentrationData.revenueChannels,
              customerSegments: d.customerSegments || revenueConcentrationData.customerSegments,
              revenueByCustomer: d.revenueByCustomer || [],
              notes: d.notes || "",
            })
          }
          break;
        case "demand-sustainability":
          const sustDoc = await getDoc(doc(db, "pipelineData", `${user.uid}_sustainability_${selectedYear}`))
          if (sustDoc.exists()) {
            const d = sustDoc.data()
            setDemandSustainabilityData({
              repeatCustomerRate: d.repeatCustomerRate?.toString() || "", churnRate: d.churnRate?.toString() || "",
              campaigns: d.campaigns || demandSustainabilityData.campaigns,
              notes: d.notes || "",
            })
          }
          break;
      }
    } catch (error) {
      console.error(`Error loading data for ${tabId}:`, error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) { alert("Please log in to save data"); return }
    try {
      switch(activeTab) {
        case "pipeline-visibility":
          // Save each year in the range separately, preserving budget arrays
          await Promise.all(rangeYears.map(async (yr) => {
            const yd = visibilityByYear[yr] || emptyVisYear()
            await setDoc(doc(db, "pipelineData", `${user.uid}_visibility_${yr}`), {
              userId: user.uid, year: yr,
              newLeads: { actual: yd.newLeads.map(v => Number.parseFloat(v) || 0), budget: yd.newLeadsBudget },
              salesVelocity: { actual: yd.salesVelocity.map(v => Number.parseFloat(v) || 0), budget: yd.salesVelocityBudget },
              conversionRates: { actual: yd.conversionRates.map(v => Number.parseFloat(v) || 0), budget: yd.conversionRatesBudget },
              notes: yd.notes, lastUpdated: new Date().toISOString(),
            })
          }))
          break
        case "pipeline-sufficiency":
          await setDoc(doc(db, "pipelineData", `${user.uid}_sufficiency_${selectedYear}`), {
            userId: user.uid, year: selectedYear,
            totalPipelineValue: Number.parseFloat(pipelineSufficiencyData.totalPipelineValue) || 0,
            probability: Number.parseFloat(pipelineSufficiencyData.probability) || 0,
            targetRevenue: Number.parseFloat(pipelineSufficiencyData.targetRevenue) || 0,
            notes: pipelineSufficiencyData.notes, lastUpdated: new Date().toISOString(),
          })
          break
        case "revenue-concentration":
          await setDoc(doc(db, "pipelineData", `${user.uid}_concentration_${selectedYear}`), {
            userId: user.uid, year: selectedYear,
            revenueChannels: revenueConcentrationData.revenueChannels.map(c => ({ name: c.name, revenue: Number.parseFloat(c.revenue) || 0, spend: Number.parseFloat(c.spend) || 0 })),
            customerSegments: revenueConcentrationData.customerSegments.map(s => ({ name: s.name, revenue: Number.parseFloat(s.revenue) || 0, customerCount: Number.parseFloat(s.customerCount) || 0 })),
            revenueByCustomer: revenueConcentrationData.revenueByCustomer,
            notes: revenueConcentrationData.notes, lastUpdated: new Date().toISOString(),
          })
          break
        case "demand-sustainability":
          await setDoc(doc(db, "pipelineData", `${user.uid}_sustainability_${selectedYear}`), {
            userId: user.uid, year: selectedYear,
            repeatCustomerRate: Number.parseFloat(demandSustainabilityData.repeatCustomerRate) || 0,
            churnRate: Number.parseFloat(demandSustainabilityData.churnRate) || 0,
            campaigns: demandSustainabilityData.campaigns.map(c => ({ name: c.name, cost: Number.parseFloat(c.cost) || 0, revenue: Number.parseFloat(c.revenue) || 0 })),
            notes: demandSustainabilityData.notes, lastUpdated: new Date().toISOString(),
          })
          break
        case "pipeline-table":
          if (!pipelineDealData.clientName || !pipelineDealData.dealValue) { alert("Please fill in required fields"); return }
          const riskAdjustedValue = (Number.parseFloat(pipelineDealData.dealValue) * Number.parseFloat(pipelineDealData.probability) / 100) || 0
          const dealsRef = collection(db, "users", user.uid, "pipelineDeals")
          await addDoc(dealsRef, { year: selectedYear, ...pipelineDealData, probability: Number.parseFloat(pipelineDealData.probability) || 0, dealValue: Number.parseFloat(pipelineDealData.dealValue) || 0, riskAdjustedValue, createdAt: new Date().toISOString() })
          break
      }
      if (onSave) onSave()
      alert("Data saved successfully!")
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Error saving data. Please try again.");
    }
  };

  const inputCls = "w-full p-2 rounded border border-[#e8ddd4] text-sm"
  const labelCls = "text-xs text-mediumBrown font-semibold"

  // Renders only the months visible in the current range for the active year tab
  const renderMonthlyInputs = (dataArray, setDataArray, options = {}) => {
    const { step = "0.01" } = options
    const visibleIndices = monthIndicesForYear(selectedYear)
    return (
      <div className="mb-5 grid gap-1" style={{ gridTemplateColumns: `repeat(${visibleIndices.length}, minmax(0, 1fr))` }}>
        {visibleIndices.map(idx => (
          <div key={idx}>
            <label className="text-[10px] text-lightBrown block mb-0.5">{MONTH_NAMES[idx] + " " + selectedYear}</label>
            <input
              type="number" step={step}
              value={dataArray[idx] || ""}
              onChange={(e) => { const a = [...dataArray]; a[idx] = e.target.value; setDataArray(a) }}
              placeholder="0"
              className="w-full p-1.5 rounded border border-[#e8ddd4] text-xs"
            />
          </div>
        ))}
      </div>
    )
  }

  if (!isOpen) return null

  // Year tab bar — shown for all tabs when range spans multiple years, or for visibility always
  const showYearTabs = rangeYears.length > 1 || activeTab === "pipeline-visibility"

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]">
      <div className="bg-[#fdfcfb] p-5 rounded-lg max-w-[1400px] max-h-[90vh] overflow-auto w-[95%]">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-mediumBrown m-0">Add Marketing & Sales Data</h3>
          <button onClick={onClose} className="bg-transparent border-0 text-2xl text-mediumBrown cursor-pointer p-0 leading-none">×</button>
        </div>

        {/* Section tab navigation */}
        <div className="flex gap-1 mb-5 flex-wrap border-b-2 border-[#e8ddd4] pb-2.5">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 border-0 rounded-t-md cursor-pointer font-semibold text-sm transition-all duration-300 -mb-0.5 ${activeTab === tab.id ? "bg-mediumBrown text-[#fdfcfb] border-b-2 border-mediumBrown" : "bg-[#e8ddd4] text-mediumBrown border-b-2 border-transparent"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Year tabs — one per year in the selected date range */}
        {showYearTabs && (
          <div className="flex gap-2 mb-5 flex-wrap items-center">
            <span className="text-mediumBrown text-sm font-semibold mr-1">Year:</span>
            {rangeYears.map(yr => (
              <button key={yr} onClick={() => setSelectedYear(yr)}
                className={`px-4 py-1.5 border-0 rounded-md cursor-pointer font-semibold text-sm ${selectedYear === yr ? "bg-mediumBrown text-[#fdfcfb]" : "bg-[#e8ddd4] text-mediumBrown hover:bg-[#d4c4b8]"}`}>
                {yr}
              </button>
            ))}
            <span className="text-xs text-lightBrown ml-2">
              Showing {MONTH_NAMES[monthIndicesForYear(selectedYear)[0]]}–{MONTH_NAMES[monthIndicesForYear(selectedYear).at(-1)]} {selectedYear}
            </span>
          </div>
        )}

        {/* Pipeline Visibility */}
        {activeTab === "pipeline-visibility" && (() => {
          const yd = visibilityByYear[selectedYear] || emptyVisYear()
          const setYd = (patch) => setVisibilityByYear(prev => ({ ...prev, [selectedYear]: { ...(prev[selectedYear] || emptyVisYear()), ...patch } }))
          return (
            <div>
              <h4 className="text-mediumBrown mb-5">Pipeline Visibility Data</h4>
              <h5 className="text-mediumBrown mb-[15px] font-semibold">New Leads</h5>
              {renderMonthlyInputs(yd.newLeads, (val) => setYd({ newLeads: val }), { step: "1" })}
              <h5 className="text-mediumBrown mb-[15px] font-semibold">Sales Velocity (Days to Close)</h5>
              {renderMonthlyInputs(yd.salesVelocity, (val) => setYd({ salesVelocity: val }), { step: "1" })}
              <h5 className="text-mediumBrown mb-[15px] font-semibold">Conversion Rates (%)</h5>
              {renderMonthlyInputs(yd.conversionRates, (val) => setYd({ conversionRates: val }), { step: "0.1" })}
              <div className="mb-5">
                <label className="block mb-2.5 text-mediumBrown font-semibold">Notes:</label>
                <textarea value={yd.notes} onChange={(e) => setYd({ notes: e.target.value })} placeholder="Add any additional notes..." className="w-full p-2.5 rounded border border-[#e8ddd4] min-h-[80px] text-[13px]" />
              </div>
            </div>
          )
        })()}

        {/* Pipeline Sufficiency */}
        {activeTab === "pipeline-sufficiency" && (
          <div>
            <h4 className="text-mediumBrown mb-5">Pipeline Sufficiency Data</h4>
            <div className="grid grid-cols-3 gap-[15px] mb-7">
              <div>
                <label className={labelCls}>Total Pipeline Value (R)</label>
                <input type="number" value={pipelineSufficiencyData.totalPipelineValue} onChange={(e) => setPipelineSufficiencyData({...pipelineSufficiencyData, totalPipelineValue: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Overall Probability (%)</label>
                <input type="number" value={pipelineSufficiencyData.probability} onChange={(e) => setPipelineSufficiencyData({...pipelineSufficiencyData, probability: e.target.value})} className={inputCls} min="0" max="100" />
              </div>
              <div>
                <label className={labelCls}>Target Revenue (R)</label>
                <input type="number" value={pipelineSufficiencyData.targetRevenue} onChange={(e) => setPipelineSufficiencyData({...pipelineSufficiencyData, targetRevenue: e.target.value})} className={inputCls} />
              </div>
            </div>
            <div className="mb-5">
              <label className="block mb-2.5 text-mediumBrown font-semibold">Notes:</label>
              <textarea value={pipelineSufficiencyData.notes} onChange={(e) => setPipelineSufficiencyData({...pipelineSufficiencyData, notes: e.target.value})} placeholder="Add any additional notes..." className="w-full p-2.5 rounded border border-[#e8ddd4] min-h-[80px] text-[13px]" />
            </div>
          </div>
        )}

        {/* Revenue Concentration */}
        {activeTab === "revenue-concentration" && (
          <div>
            <h4 className="text-mediumBrown mb-5">Revenue Concentration Data</h4>
            <h5 className="text-mediumBrown mb-[15px] font-semibold">Revenue by Channel</h5>
            {revenueConcentrationData.revenueChannels.map((channel, index) => (
              <div key={index} className="grid grid-cols-[2fr_1fr_1fr] gap-2.5 mb-2.5">
                <input type="text" value={channel.name} onChange={(e) => { const n = [...revenueConcentrationData.revenueChannels]; n[index].name = e.target.value; setRevenueConcentrationData({...revenueConcentrationData, revenueChannels: n}) }} className="p-2 rounded border border-[#e8ddd4]" />
                <input type="number" value={channel.revenue} onChange={(e) => { const n = [...revenueConcentrationData.revenueChannels]; n[index].revenue = e.target.value; setRevenueConcentrationData({...revenueConcentrationData, revenueChannels: n}) }} placeholder="Revenue (R)" className="p-2 rounded border border-[#e8ddd4]" />
                <input type="number" value={channel.spend} onChange={(e) => { const n = [...revenueConcentrationData.revenueChannels]; n[index].spend = e.target.value; setRevenueConcentrationData({...revenueConcentrationData, revenueChannels: n}) }} placeholder="Marketing Spend (R)" className="p-2 rounded border border-[#e8ddd4]" />
              </div>
            ))}
            <h5 className="text-mediumBrown mt-7 mb-[15px] font-semibold">Customer Segments</h5>
            {revenueConcentrationData.customerSegments.map((segment, index) => (
              <div key={index} className="grid grid-cols-[2fr_1fr_1fr] gap-2.5 mb-2.5">
                <input type="text" value={segment.name} onChange={(e) => { const n = [...revenueConcentrationData.customerSegments]; n[index].name = e.target.value; setRevenueConcentrationData({...revenueConcentrationData, customerSegments: n}) }} className="p-2 rounded border border-[#e8ddd4]" />
                <input type="number" value={segment.revenue} onChange={(e) => { const n = [...revenueConcentrationData.customerSegments]; n[index].revenue = e.target.value; setRevenueConcentrationData({...revenueConcentrationData, customerSegments: n}) }} placeholder="Revenue (R)" className="p-2 rounded border border-[#e8ddd4]" />
                <input type="number" value={segment.customerCount} onChange={(e) => { const n = [...revenueConcentrationData.customerSegments]; n[index].customerCount = e.target.value; setRevenueConcentrationData({...revenueConcentrationData, customerSegments: n}) }} placeholder="# Customers" className="p-2 rounded border border-[#e8ddd4]" />
              </div>
            ))}
            <div className="mb-5 mt-7">
              <label className="block mb-2.5 text-mediumBrown font-semibold">Notes:</label>
              <textarea value={revenueConcentrationData.notes} onChange={(e) => setRevenueConcentrationData({...revenueConcentrationData, notes: e.target.value})} placeholder="Add any additional notes..." className="w-full p-2.5 rounded border border-[#e8ddd4] min-h-[80px] text-[13px]" />
            </div>
          </div>
        )}

        {/* Demand Sustainability */}
        {activeTab === "demand-sustainability" && (
          <div>
            <h4 className="text-mediumBrown mb-5">Demand Sustainability Data</h4>
            <div className="grid grid-cols-2 gap-[15px] mb-7">
              <div>
                <label className={labelCls}>Repeat Customer Rate (%)</label>
                <input type="number" value={demandSustainabilityData.repeatCustomerRate} onChange={(e) => setDemandSustainabilityData({...demandSustainabilityData, repeatCustomerRate: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Churn Rate (%)</label>
                <input type="number" value={demandSustainabilityData.churnRate} onChange={(e) => setDemandSustainabilityData({...demandSustainabilityData, churnRate: e.target.value})} className={inputCls} />
              </div>
            </div>
            <h5 className="text-mediumBrown mb-[15px] font-semibold">Campaigns</h5>
            {demandSustainabilityData.campaigns.map((campaign, index) => (
              <div key={index} className="grid grid-cols-[2fr_1fr_1fr] gap-2.5 mb-2.5">
                <input type="text" value={campaign.name} onChange={(e) => { const n = [...demandSustainabilityData.campaigns]; n[index].name = e.target.value; setDemandSustainabilityData({...demandSustainabilityData, campaigns: n}) }} className="p-2 rounded border border-[#e8ddd4]" />
                <input type="number" value={campaign.cost} onChange={(e) => { const n = [...demandSustainabilityData.campaigns]; n[index].cost = e.target.value; setDemandSustainabilityData({...demandSustainabilityData, campaigns: n}) }} placeholder="Cost (R)" className="p-2 rounded border border-[#e8ddd4]" />
                <input type="number" value={campaign.revenue} onChange={(e) => { const n = [...demandSustainabilityData.campaigns]; n[index].revenue = e.target.value; setDemandSustainabilityData({...demandSustainabilityData, campaigns: n}) }} placeholder="Revenue (R)" className="p-2 rounded border border-[#e8ddd4]" />
              </div>
            ))}
            <div className="mb-5">
              <label className="block mb-2.5 text-mediumBrown font-semibold">Notes:</label>
              <textarea value={demandSustainabilityData.notes} onChange={(e) => setDemandSustainabilityData({...demandSustainabilityData, notes: e.target.value})} placeholder="Add any additional notes..." className="w-full p-2.5 rounded border border-[#e8ddd4] min-h-[80px] text-[13px]" />
            </div>
          </div>
        )}

        {/* Pipeline Table */}
        {activeTab === "pipeline-table" && (
          <div className="p-5">
            <h4 className="text-mediumBrown mb-5">Add New Deal</h4>
            <div className="grid grid-cols-2 gap-[15px]">
              <div>
                <label className={labelCls}>Client / Deal *</label>
                <input type="text" value={pipelineDealData.clientName} onChange={(e) => setPipelineDealData({...pipelineDealData, clientName: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Customer Segment</label>
                <input type="text" value={pipelineDealData.segment} onChange={(e) => setPipelineDealData({...pipelineDealData, segment: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Stage</label>
                <select value={pipelineDealData.stage} onChange={(e) => setPipelineDealData({...pipelineDealData, stage: e.target.value})} className={inputCls}>
                  <option value="initial-contact">Initial Contact</option>
                  <option value="qualification">Qualification</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="closed-won">Closed Won</option>
                  <option value="closed-lost">Closed Lost</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Probability (%)</label>
                <input type="number" value={pipelineDealData.probability} onChange={(e) => setPipelineDealData({...pipelineDealData, probability: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Expected Close</label>
                <input type="date" value={pipelineDealData.expectedClose} onChange={(e) => setPipelineDealData({...pipelineDealData, expectedClose: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Deal Value (R) *</label>
                <input type="number" value={pipelineDealData.dealValue} onChange={(e) => setPipelineDealData({...pipelineDealData, dealValue: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Source</label>
                <input type="text" value={pipelineDealData.source} onChange={(e) => setPipelineDealData({...pipelineDealData, source: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Owner</label>
                <input type="text" value={pipelineDealData.owner} onChange={(e) => setPipelineDealData({...pipelineDealData, owner: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Established Start Date</label>
                <input type="date" value={pipelineDealData.establishedStartDate} onChange={(e) => setPipelineDealData({...pipelineDealData, establishedStartDate: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Expected Onboarding</label>
                <input type="date" value={pipelineDealData.expectedOnboardingDate} onChange={(e) => setPipelineDealData({...pipelineDealData, expectedOnboardingDate: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Signed Date</label>
                <input type="date" value={pipelineDealData.signedDate} onChange={(e) => setPipelineDealData({...pipelineDealData, signedDate: e.target.value})} className={inputCls} />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2.5 justify-end mt-5">
          <button onClick={onClose} className="px-5 py-2.5 bg-[#e8ddd4] text-mediumBrown border-0 rounded-md cursor-pointer font-semibold">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className={`px-5 py-2.5 bg-mediumBrown text-[#fdfcfb] border-0 rounded-md font-semibold ${loading ? "opacity-70 cursor-wait" : "cursor-pointer"}`}>
            {loading ? "Saving..." : "Save Data"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== PIPELINE TABLE COMPONENT ====================

const PipelineTable = ({ currentUser, isInvestorView, selectedYear, onAddData }) => {
  const [deals, setDeals] = useState([])
  const [filteredDeals, setFilteredDeals] = useState([])
  const [loading, setLoading] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState({ show: false, dealId: null })
  const [filters, setFilters] = useState({ clientName: "", segment: "", stage: "", source: "", owner: "", minValue: "", maxValue: "" })

  const stageOptions = [
    { value: "initial-contact", label: "Initial Contact" },
    { value: "qualification", label: "Qualification" },
    { value: "proposal", label: "Proposal" },
    { value: "negotiation", label: "Negotiation" },
    { value: "closed-won", label: "Closed Won" },
    { value: "closed-lost", label: "Closed Lost" },
  ];

  useEffect(() => { if (currentUser) loadDeals() }, [currentUser, selectedYear])
  useEffect(() => { applyFilters() }, [deals, filters])

  const loadDeals = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const dealsRef = collection(db, "users", currentUser.uid, "pipelineDeals")
      const q = query(dealsRef, where("year", "==", selectedYear))
      const querySnapshot = await getDocs(q)
      const dealsData = []
      querySnapshot.forEach((doc) => { dealsData.push({ id: doc.id, ...doc.data() }) })
      setDeals(dealsData)
      setFilteredDeals(dealsData)
    } catch (error) {
      console.error("Error loading deals:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...deals]
    if (filters.clientName) filtered = filtered.filter(deal => deal.clientName?.toLowerCase().includes(filters.clientName.toLowerCase()))
    if (filters.segment) filtered = filtered.filter(deal => deal.segment?.toLowerCase().includes(filters.segment.toLowerCase()))
    if (filters.stage) filtered = filtered.filter(deal => deal.stage === filters.stage)
    if (filters.source) filtered = filtered.filter(deal => deal.source?.toLowerCase().includes(filters.source.toLowerCase()))
    if (filters.owner) filtered = filtered.filter(deal => deal.owner?.toLowerCase().includes(filters.owner.toLowerCase()))
    if (filters.minValue) filtered = filtered.filter(deal => (deal.dealValue || 0) >= parseFloat(filters.minValue))
    if (filters.maxValue) filtered = filtered.filter(deal => (deal.dealValue || 0) <= parseFloat(filters.maxValue))
    setFilteredDeals(filtered)
  }

  const deleteDeal = async (dealId) => {
    if (!currentUser || isInvestorView) { alert("You cannot delete deals in this mode."); return }
    setConfirmDialog({ show: true, dealId })
  }

  const handleConfirmDelete = async () => {
    try {
      const dealsRef = collection(db, "users", currentUser.uid, "pipelineDeals");
      await deleteDoc(doc(dealsRef, confirmDialog.dealId));
      loadDeals();
    } catch (error) {
      console.error("Error deleting deal:", error);
      alert("Error deleting deal");
    } finally {
      setConfirmDialog({ show: false, dealId: null });
    }
  };

  const clearFilters = () => setFilters({ clientName: "", segment: "", stage: "", source: "", owner: "", minValue: "", maxValue: "" })

  const totalPipelineValue = filteredDeals.reduce((sum, deal) => sum + (deal.dealValue || 0), 0)
  const totalRiskAdjusted = filteredDeals.reduce((sum, deal) => sum + (deal.riskAdjustedValue || 0), 0)
  const filterInputCls = "w-full p-2 rounded border border-[#e8ddd4] text-[13px]"

  return (
    <div className="mt-7">
      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[2000]">
          <div className="bg-[#fdfcfb] p-7 rounded-lg max-w-[400px] w-[90%]">
            <h3 className="text-mediumBrown mt-0 mb-[15px]">Confirm Deletion</h3>
            <p className="text-mediumBrown mb-6">Are you sure you want to delete this deal? This action cannot be undone.</p>
            <div className="flex gap-2.5 justify-end">
              <button onClick={() => setConfirmDialog({ show: false, dealId: null })} className="px-4 py-2 bg-[#e8ddd4] text-mediumBrown border-0 rounded cursor-pointer">Cancel</button>
              <button onClick={handleConfirmDelete} className="px-4 py-2 bg-red-600 text-[#fdfcfb] border-0 rounded cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-5 flex-wrap gap-[15px]">
        <h3 className="text-mediumBrown text-lg font-bold m-0">Pipeline Deals</h3>
        {!isInvestorView && (
          <button onClick={onAddData} className="px-4 py-2 bg-mediumBrown text-[#fdfcfb] border-0 rounded cursor-pointer font-semibold text-sm">Add Deal</button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-[#f5f0eb] p-5 rounded-lg mb-5 border border-[#e8ddd4]">
        <div className="flex justify-between items-center mb-[15px]">
          <h4 className="text-mediumBrown text-base font-semibold m-0">Filters</h4>
          <button onClick={clearFilters} className="px-3 py-1.5 bg-[#e8ddd4] text-mediumBrown border-0 rounded cursor-pointer text-xs font-semibold">Clear Filters</button>
        </div>
        <div className="grid grid-cols-4 gap-[15px]">
          {[
            { label: "Client Name", key: "clientName", placeholder: "Search client...", type: "text" },
            { label: "Segment", key: "segment", placeholder: "Filter by segment...", type: "text" },
            { label: "Source", key: "source", placeholder: "Filter by source...", type: "text" },
            { label: "Owner", key: "owner", placeholder: "Filter by owner...", type: "text" },
            { label: "Min Value (R)", key: "minValue", placeholder: "Min amount...", type: "number" },
            { label: "Max Value (R)", key: "maxValue", placeholder: "Max amount...", type: "number" },
          ].map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <label className="text-xs text-mediumBrown block mb-1">{label}</label>
              <input type={type} value={filters[key]} onChange={(e) => setFilters({...filters, [key]: e.target.value})} placeholder={placeholder} className={filterInputCls} />
            </div>
          ))}
          <div>
            <label className="text-xs text-mediumBrown block mb-1">Stage</label>
            <select value={filters.stage} onChange={(e) => setFilters({...filters, stage: e.target.value})} className={filterInputCls}>
              <option value="">All Stages</option>
              {stageOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Deals Table */}
      <div className="overflow-x-auto bg-[#f5f0eb] rounded-lg p-5 mb-7">
        {filteredDeals.length === 0 ? (
          <div className="text-center p-10 text-lightBrown">
            {deals.length === 0 ? "No deals found. Click 'Add Deal' to get started." : "No deals match the current filters."}
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-mediumBrown text-[#fdfcfb]">
                {["Client", "Segment", "Stage", "Probability", "Value", "Risk Adj", "Source", "Owner", "Expected Close"].map((h, i) => (
                  <th key={h} className={`p-3 text-[13px] ${i >= 3 && i <= 5 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
                {!isInvestorView && <th className="p-3 text-center text-[13px]">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredDeals.map((deal, index) => {
                const stageLabel = stageOptions.find(option => option.value === deal.stage)?.label || deal.stage;
                return (
                  <tr key={deal.id} className={`border-b border-[#e8ddd4] ${index % 2 === 0 ? "bg-[#fdfcfb]" : "bg-[#f5f0eb]"}`}>
                    <td className="p-2.5 text-[13px] text-mediumBrown">{deal.clientName}</td>
                    <td className="p-2.5 text-[13px] text-mediumBrown">{deal.segment}</td>
                    <td className="p-2.5 text-[13px] text-mediumBrown">{stageLabel}</td>
                    <td className="p-2.5 text-[13px] text-mediumBrown text-right">{deal.probability}%</td>
                    <td className="p-2.5 text-[13px] text-mediumBrown text-right">{formatCurrency(deal.dealValue)}</td>
                    <td className="p-2.5 text-[13px] text-mediumBrown text-right">{formatCurrency(deal.riskAdjustedValue)}</td>
                    <td className="p-2.5 text-[13px] text-mediumBrown">{deal.source}</td>
                    <td className="p-2.5 text-[13px] text-mediumBrown">{deal.owner}</td>
                    <td className="p-2.5 text-[13px] text-mediumBrown">{deal.expectedClose}</td>
                    {!isInvestorView && (
                      <td className="p-2.5 text-center">
                        <button onClick={() => deleteDeal(deal.id)} className="px-3 py-1.5 bg-red-600 text-[#fdfcfb] border-0 rounded cursor-pointer text-xs">Delete</button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-[15px] mb-5">
        {[
          { label: "Total Deals (Filtered)", value: filteredDeals.length },
          { label: "Pipeline Value", value: formatCurrency(totalPipelineValue) },
          { label: "Risk Adjusted", value: formatCurrency(totalRiskAdjusted) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#f5f0eb] p-5 rounded-md text-center">
            <div className="text-sm text-mediumBrown mb-2 font-semibold">{label}</div>
            <div className="text-[28px] text-mediumBrown font-bold">{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==================== KPI CARD COMPONENTS ====================

const formatDays = (value) => {
  const num = Number.parseFloat(value) || 0
  return `${num.toFixed(0)} days`
}

const TrendArrow = ({ value, goodDirection = "up" }) => {
  const isPositive = value > 0
  const isGood = (goodDirection === "up" && isPositive) || (goodDirection === "down" && !isPositive)
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      {isPositive
        ? <TrendingUp size={16} color={isGood ? "#16a34a" : "#dc2626"} />
        : <TrendingDown size={16} color={isGood ? "#16a34a" : "#dc2626"} />}
      <span style={{ color: isGood ? "#16a34a" : "#dc2626", fontSize: "12px", fontWeight: "600" }}>
        {Math.abs(value).toFixed(1)}%
      </span>
    </div>
  )
}

const KPITripleCard = ({ title, actualValue, budgetValue, unit = "number", isPercentage = false, goodDirection = "up", onEyeClick, onAddNotes, onAnalysis, onTrend, notes }) => {
  const [expanded, setExpanded] = useState(false)
  const variance = actualValue - budgetValue
  const variancePercent = budgetValue !== 0 ? (variance / Math.abs(budgetValue)) * 100 : 0
  const colors = circleColors
  const formatValue = (val) => {
    if (unit === "currency") return formatCurrency(val)
    if (unit === "days") return formatDays(val)
    if (unit === "percentage" || isPercentage) return formatPercentage(val)
    return formatNumber(val)
  }
  return (
    <div style={{ backgroundColor: "#fdfcfb", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: "20px", position: "relative", border: "1px solid #e8ddd4" }}>
      {/* Eye icon */}
      <div onClick={onEyeClick} style={{ position: "absolute", top: "10px", right: "10px", cursor: "pointer", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", backgroundColor: "#fdfcfb", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", border: `2px solid ${colors[0].border}`, zIndex: 10 }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#e8ddd4"; e.currentTarget.style.transform = "scale(1.1)" }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fdfcfb"; e.currentTarget.style.transform = "scale(1)" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors[0].border} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="2"></circle>
          <circle cx="12" cy="12" r="5" strokeOpacity="0.5"></circle>
          <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z"></path>
        </svg>
      </div>
      {/* Title */}
      <h4 style={{ color: "#5d4037", marginBottom: "20px", fontSize: "16px", textAlign: "center", fontWeight: "600" }}>{title}</h4>
      {/* Three circles */}
      <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", border: `4px solid ${colors[0].border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", backgroundColor: colors[0].background }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: colors[0].text }}>{formatValue(actualValue)}</div>
          </div>
          <div style={{ fontSize: "11px", color: "#5d4037", fontWeight: "500" }}>Actual</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", border: `4px solid ${colors[1].border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", backgroundColor: colors[1].background }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: colors[1].text }}>{formatValue(budgetValue)}</div>
          </div>
          <div style={{ fontSize: "11px", color: "#5d4037", fontWeight: "500" }}>Budget</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", border: `4px solid ${colors[2].border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", backgroundColor: colors[2].background }}>
            <TrendArrow value={variancePercent} goodDirection={goodDirection} />
          </div>
          <div style={{ fontSize: "11px", color: "#5d4037", fontWeight: "500" }}>Variance</div>
        </div>
      </div>
      {/* Action buttons */}
      <div style={{ borderTop: "1px solid #e8ddd4", paddingTop: "15px" }}>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "10px" }}>
          <button onClick={() => setExpanded(!expanded)} style={{ padding: "6px 12px", backgroundColor: "#e8ddd4", color: "#5d4037", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600", fontSize: "12px" }}>Add notes</button>
          <button onClick={onAnalysis} style={{ padding: "6px 12px", backgroundColor: "#e8ddd4", color: "#5d4037", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600", fontSize: "12px" }}>AI analysis</button>
          <button onClick={onTrend} style={{ padding: "6px 12px", backgroundColor: "#e8ddd4", color: "#5d4037", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600", fontSize: "12px" }}>View trend</button>
        </div>
        {expanded && (
          <div style={{ marginBottom: "10px" }}>
            <label style={{ fontSize: "12px", color: "#5d4037", fontWeight: "600", display: "block", marginBottom: "5px" }}>Notes / Comments:</label>
            <textarea value={notes || ""} onChange={(e) => onAddNotes(e.target.value)} placeholder="Add notes or comments..." style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #e8ddd4", minHeight: "60px", fontSize: "13px" }} />
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== PIPELINE VISIBILITY COMPONENT ====================

const PipelineVisibility = ({ activeSection, currentUser, isInvestorView, onAddData, fromDate, toDate }) => {
  const [loading, setLoading] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState({})
  const [kpiNotes, setKpiNotes] = useState({})
  const [kpiAnalysis, setKpiAnalysis] = useState({})
  const [showCalculationModal, setShowCalculationModal] = useState(false)
  const [selectedCalculation, setSelectedCalculation] = useState({ title: "", calculation: "" })
  const [showTrendModal, setShowTrendModal] = useState(false)
  const [selectedTrendItem, setSelectedTrendItem] = useState(null)
  // rangeData stores arrays aligned to the exact range months
  const [rangeData, setRangeData] = useState({ newLeads: [], salesVelocity: [], conversionRates: [], labels: [] })

  useEffect(() => {
    if (currentUser && activeSection === "pipeline-visibility") loadData()
  }, [currentUser, activeSection, fromDate, toDate])

  const loadData = async () => {
    if (!currentUser || !fromDate || !toDate) return
    setLoading(true)
    try {
      const rangeMonths = getRangeMonths(fromDate, toDate)
      // Fetch one doc per unique year in range
      const years = [...new Set(rangeMonths.map(r => r.year))]
      const docsByYear = {}
      await Promise.all(years.map(async (yr) => {
        const snap = await getDoc(doc(db, "pipelineData", `${currentUser.uid}_visibility_${yr}`))
        if (snap.exists()) docsByYear[yr] = snap.data()
      }))
      // Build per-month arrays for exactly the range — handle {actual,budget} and plain array shapes
      const getActual = (field) => Array.isArray(field) ? field : (Array.isArray(field?.actual) ? field.actual : [])
      const getBudget = (field) => Array.isArray(field?.budget) ? field.budget : []
      const newLeads = [], salesVelocity = [], conversionRates = []
      const newLeadsBudget = [], salesVelocityBudget = [], conversionRatesBudget = []
      rangeMonths.forEach(({ year, monthIdx }) => {
        const d = docsByYear[year]
        newLeads.push(getActual(d?.newLeads)[monthIdx] ?? 0)
        salesVelocity.push(getActual(d?.salesVelocity)[monthIdx] ?? 0)
        conversionRates.push(getActual(d?.conversionRates)[monthIdx] ?? 0)
        newLeadsBudget.push(getBudget(d?.newLeads)[monthIdx] ?? 0)
        salesVelocityBudget.push(getBudget(d?.salesVelocity)[monthIdx] ?? 0)
        conversionRatesBudget.push(getBudget(d?.conversionRates)[monthIdx] ?? 0)
      })
      setRangeData({ newLeads, salesVelocity, conversionRates, newLeadsBudget, salesVelocityBudget, conversionRatesBudget, labels: rangeMonths.map(r => r.label) })
    } catch (error) { console.error("Error loading pipeline visibility data:", error) }
    finally { setLoading(false) }
  }

  const openTrendModal = (itemName, dataArray, isPercentage = false) => {
    setSelectedTrendItem({ name: itemName, data: dataArray, labels: rangeData.labels, isPercentage })
    setShowTrendModal(true)
  }

  const handleCalculationClick = (title, calculation) => { setSelectedCalculation({ title, calculation }); setShowCalculationModal(true) }

  const renderKPICard = (title, dataKey, calculation = "", unit = "number", goodDirection = "up") => {
    const actualArr = rangeData[dataKey] || []
    const budgetArr = rangeData[`${dataKey}Budget`] || []
    const actualValue = actualArr.length > 0 ? (actualArr[actualArr.length - 1] || 0) : 0
    const budgetValue = budgetArr.length > 0 ? (budgetArr[budgetArr.length - 1] || 0) : 0
    return (
      <KPITripleCard
        key={dataKey}
        title={title}
        actualValue={actualValue}
        budgetValue={budgetValue}
        unit={unit}
        goodDirection={goodDirection}
        onEyeClick={() => handleCalculationClick(title, calculation)}
        onAddNotes={(val) => setKpiNotes(prev => ({ ...prev, [dataKey]: val }))}
        onAnalysis={() => setExpandedNotes(prev => ({ ...prev, [`${dataKey}_analysis`]: !prev[`${dataKey}_analysis`] }))}
        onTrend={() => openTrendModal(title, actualArr, unit === "percentage")}
        notes={kpiNotes[dataKey]}
      />
    )
  }

  if (activeSection !== "pipeline-visibility") return null

  const calculationTexts = {
    newLeads: "New Leads: Number of new leads generated in the period.\n\nCalculation: Count of new leads added to CRM.",
    salesVelocity: "Sales Velocity = (Number of Opportunities × Deal Value × Win Rate) ÷ Sales Cycle Length\n\nMeasures how quickly deals move through the pipeline.",
    conversionRates: "Conversion Rate = (Number of Converted Leads ÷ Total Leads) × 100%\n\nMeasures how effectively leads are converted to customers.",
    riskAdjustedValue: "Risk Adjusted Value = Sum of (Deal Value × Probability %) for all deals\n\nShows expected value accounting for win probability.",
  };

  return (
    <div>
      <KeyQuestionBox question="Do we have enough quality demand, at the right risk, to hit revenue?" signals="Forecast clarity, pipeline coverage, conversion rates" decisions="Formalise sales process, improve lead quality, adjust targets" section="pipeline-visibility" />
      <SectionControlsBar
        title="Pipeline Visibility"
        onAddData={!isInvestorView ? onAddData : null}
        showAddData={!isInvestorView}
        showViewMode={false}
      />
      <KpiGrid2>
        {renderKPICard("New Leads", "newLeads", calculationTexts.newLeads, "number", "up")}
        {renderKPICard("Sales Velocity", "salesVelocity", calculationTexts.salesVelocity, "days", "down")}
        {renderKPICard("Conversion Rates", "conversionRates", calculationTexts.conversionRates, "percentage", "up")}
      </KpiGrid2>
      <CalculationModal isOpen={showCalculationModal} onClose={() => setShowCalculationModal(false)} title={selectedCalculation.title} calculation={selectedCalculation.calculation} />
      {showTrendModal && selectedTrendItem && (
        <TrendModal
          isOpen={showTrendModal}
          onClose={() => { setShowTrendModal(false); setSelectedTrendItem(null) }}
          item={{ name: selectedTrendItem.name, isPercentage: selectedTrendItem.isPercentage }}
          trendData={{ labels: selectedTrendItem.labels, actual: selectedTrendItem.data, budget: null }}
          currencyUnit="zar"
          formatValue={(v) => formatCurrency(v)}
        />
      )}
    </div>
  );
};

// ==================== PIPELINE SUFFICIENCY COMPONENT ====================

const PipelineSufficiency = ({ activeSection, currentUser, isInvestorView, onAddData, fromDate, toDate }) => {
  const [loading, setLoading] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState({})
  const [kpiNotes, setKpiNotes] = useState({})
  const [kpiAnalysis, setKpiAnalysis] = useState({})
  const [showCalculationModal, setShowCalculationModal] = useState(false)
  const [selectedCalculation, setSelectedCalculation] = useState({ title: "", calculation: "" })
  const [showTrendModal, setShowTrendModal] = useState(false)
  const [selectedTrendItem, setSelectedTrendItem] = useState(null)
  const [pipelineData, setPipelineData] = useState({ totalPipelineValue: 0, probability: 0, targetRevenue: 0, notes: "" })

  // toDate year = most recent year in range — this is what we display
  const toYear = toDate ? parseInt(toDate.split("-")[0]) : new Date().getFullYear()

  useEffect(() => {
    if (currentUser && activeSection === "pipeline-sufficiency") loadData()
  }, [currentUser, activeSection, toDate])

  const loadData = async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const docSnap = await getDoc(doc(db, "pipelineData", `${currentUser.uid}_sufficiency_${toYear}`))
      if (docSnap.exists()) {
        const data = docSnap.data()
        setPipelineData({ totalPipelineValue: data.totalPipelineValue || 0, probability: data.probability || 0, targetRevenue: data.targetRevenue || 0, notes: data.notes || "" })
      } else {
        setPipelineData({ totalPipelineValue: 0, probability: 0, targetRevenue: 0, notes: "" })
      }
    } catch (error) { console.error("Error loading pipeline sufficiency data:", error) }
    finally { setLoading(false) }
  }

  const openTrendModal = (itemName, currentValue, isPercentage = false) => {
    // Repeat the per-year value for every month in range (data stored per-year not per-month)
    const rangeMonths = getRangeMonths(fromDate, toDate)
    setSelectedTrendItem({
      name: itemName,
      data: rangeMonths.map(() => currentValue),
      labels: rangeMonths.map(r => r.label),
      isPercentage,
    })
    setShowTrendModal(true)
  }

  const handleCalculationClick = (title, calculation) => { setSelectedCalculation({ title, calculation }); setShowCalculationModal(true) }

  const renderKPICard = (title, dataKey, calculation = "", unit = "number", goodDirection = "up") => {
    let actualValue = 0
    if (dataKey === "riskAdjustedValue") actualValue = (pipelineData.totalPipelineValue * pipelineData.probability) / 100
    else if (dataKey === "pipelineCoverage") actualValue = pipelineData.targetRevenue > 0 ? (pipelineData.totalPipelineValue / pipelineData.targetRevenue) * 100 : 0
    return (
      <KPITripleCard
        key={dataKey}
        title={title}
        actualValue={actualValue}
        budgetValue={0}
        unit={unit}
        goodDirection={goodDirection}
        onEyeClick={() => handleCalculationClick(title, calculation)}
        onAddNotes={(val) => setKpiNotes(prev => ({ ...prev, [dataKey]: val }))}
        onAnalysis={() => setExpandedNotes(prev => ({ ...prev, [`${dataKey}_analysis`]: !prev[`${dataKey}_analysis`] }))}
        onTrend={() => openTrendModal(title, actualValue, unit === "percentage")}
        notes={kpiNotes[dataKey]}
      />
    )
  }

  if (activeSection !== "pipeline-sufficiency") return null

  const calculationTexts = {
    totalDeals: "Total Deals: Number of active deals in the pipeline.\n\nShows pipeline volume.",
    pipelineCoverage: "Pipeline Coverage = (Pipeline Value ÷ Target Revenue) × 100%\n\nMeasures if pipeline is sufficient to meet revenue targets.",
    salesVelocity: "Sales Velocity = (Number of Opportunities × Deal Value × Win Rate) ÷ Sales Cycle Length\n\nMeasures how quickly deals move through the pipeline.",
    conversionRates: "Conversion Rate = (Number of Won Deals ÷ Total Deals) × 100%\n\nMeasures sales effectiveness.",
  };

  return (
    <div>
      <KeyQuestionBox question="Is pipeline big enough?" signals="Coverage ratio, lead volume trends" decisions="Increase lead generation, adjust targets" section="pipeline-sufficiency" />
      <SectionControlsBar
        title="Pipeline Sufficiency"
        onAddData={!isInvestorView ? onAddData : null}
        showAddData={!isInvestorView}
        showViewMode={false}
      />
      <KpiGrid2>
        {renderKPICard("Risk Adjusted Value", "riskAdjustedValue", calculationTexts.riskAdjustedValue, "currency", "up")}
        {renderKPICard("Pipeline Coverage", "pipelineCoverage", calculationTexts.pipelineCoverage, "percentage", "up")}
      </KpiGrid2>
      <PipelineTable currentUser={currentUser} isInvestorView={isInvestorView} selectedYear={toYear} onAddData={onAddData} />
      <CalculationModal isOpen={showCalculationModal} onClose={() => setShowCalculationModal(false)} title={selectedCalculation.title} calculation={selectedCalculation.calculation} />
      {showTrendModal && selectedTrendItem && (
        <TrendModal
          isOpen={showTrendModal}
          onClose={() => { setShowTrendModal(false); setSelectedTrendItem(null) }}
          item={{ name: selectedTrendItem.name, isPercentage: selectedTrendItem.isPercentage }}
          trendData={{ labels: selectedTrendItem.labels, actual: selectedTrendItem.data, budget: null }}
          currencyUnit="zar"
          formatValue={(v) => formatCurrency(v)}
        />
      )}
    </div>
  );
};

// ==================== REVENUE CONCENTRATION COMPONENT ====================

const RevenueConcentration = ({ activeSection, currentUser, isInvestorView, onAddData, fromDate, toDate }) => {
  const [loading, setLoading] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState({})
  const [kpiNotes, setKpiNotes] = useState({})
  const [kpiAnalysis, setKpiAnalysis] = useState({})
  const [showCalculationModal, setShowCalculationModal] = useState(false)
  const [selectedCalculation, setSelectedCalculation] = useState({ title: "", calculation: "" })
  const [showTrendModal, setShowTrendModal] = useState(false)
  const [selectedTrendItem, setSelectedTrendItem] = useState(null)
  const [activeTab, setActiveTab] = useState("channel")
  const [concentrationData, setConcentrationData] = useState({
    revenueChannels: [
      { name: "Social Media", revenue: 0, spend: 0 }, { name: "Email", revenue: 0, spend: 0 },
      { name: "PPC", revenue: 0, spend: 0 }, { name: "SEO", revenue: 0, spend: 0 },
      { name: "Referral", revenue: 0, spend: 0 }, { name: "Direct", revenue: 0, spend: 0 }
    ],
    customerSegments: [
      { name: "Enterprise", revenue: 0, customerCount: 0 }, { name: "SMB", revenue: 0, customerCount: 0 },
      { name: "Startup", revenue: 0, customerCount: 0 }, { name: "Non-Profit", revenue: 0, customerCount: 0 },
      { name: "Education", revenue: 0, customerCount: 0 }
    ],
    revenueByCustomer: [
      { name: "Customer A", revenue: 0 }, { name: "Customer B", revenue: 0 },
      { name: "Customer C", revenue: 0 }, { name: "Customer D", revenue: 0 },
      { name: "Customer E", revenue: 0 },
    ],
    notes: "",
  });

  const toYear = toDate ? parseInt(toDate.split("-")[0]) : new Date().getFullYear()

  useEffect(() => {
    if (currentUser && activeSection === "revenue-concentration") loadData()
  }, [currentUser, activeSection, toDate])

  const loadData = async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const docSnap = await getDoc(doc(db, "pipelineData", `${currentUser.uid}_concentration_${toYear}`))
      if (docSnap.exists()) {
        const data = docSnap.data();
        setConcentrationData({
          revenueChannels: data.revenueChannels || concentrationData.revenueChannels,
          customerSegments: data.customerSegments || concentrationData.customerSegments,
          revenueByCustomer: data.revenueByCustomer || concentrationData.revenueByCustomer,
          notes: data.notes || "",
        })
      } else {
        setConcentrationData(prev => ({ ...prev, revenueChannels: prev.revenueChannels.map(c => ({...c, revenue: 0, spend: 0})) }))
      }
    } catch (error) { console.error("Error loading revenue concentration data:", error) }
    finally { setLoading(false) }
  }

  const openTrendModal = (itemName, currentValue, isPercentage = false) => {
    const rangeMonths = getRangeMonths(fromDate, toDate)
    setSelectedTrendItem({
      name: itemName,
      data: rangeMonths.map(() => currentValue),
      labels: rangeMonths.map(r => r.label),
      isPercentage,
    })
    setShowTrendModal(true)
  }

  const handleCalculationClick = (title, calculation) => { setSelectedCalculation({ title, calculation }); setShowCalculationModal(true) }

  const renderKPICard = (title, dataKey, calculation = "", unit = "number", goodDirection = "up") => {
    let actualValue = 0
    if (dataKey === "totalMarketingSpend") actualValue = concentrationData.revenueChannels.reduce((sum, c) => sum + c.spend, 0)
    else if (dataKey === "totalROI") {
      const totalRevenue = concentrationData.revenueChannels.reduce((sum, c) => sum + c.revenue, 0)
      const totalSpend = concentrationData.revenueChannels.reduce((sum, c) => sum + c.spend, 0)
      actualValue = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0
    }
    return (
      <KPITripleCard
        key={dataKey}
        title={title}
        actualValue={actualValue}
        budgetValue={0}
        unit={unit}
        goodDirection={goodDirection}
        onEyeClick={() => handleCalculationClick(title, calculation)}
        onAddNotes={(val) => setKpiNotes(prev => ({ ...prev, [dataKey]: val }))}
        onAnalysis={() => setExpandedNotes(prev => ({ ...prev, [`${dataKey}_analysis`]: !prev[`${dataKey}_analysis`] }))}
        onTrend={() => openTrendModal(title, actualValue, unit === "percentage")}
        notes={kpiNotes[dataKey]}
      />
    )
  }

  if (activeSection !== "revenue-concentration") return null

  const totalMarketingSpend = concentrationData.revenueChannels.reduce((sum, c) => sum + c.spend, 0)
  const totalRevenue = concentrationData.revenueChannels.reduce((sum, c) => sum + c.revenue, 0)
  const totalROI = totalMarketingSpend > 0 ? ((totalRevenue - totalMarketingSpend) / totalMarketingSpend) * 100 : 0
  const sortedChannels = [...concentrationData.revenueChannels].sort((a, b) => b.revenue - a.revenue)
  const top3Channels = sortedChannels.slice(0, 3)
  const top3Revenue = top3Channels.reduce((sum, c) => sum + c.revenue, 0)
  const top3Percentage = totalRevenue > 0 ? (top3Revenue / totalRevenue) * 100 : 0
  const sortedSegments = [...concentrationData.customerSegments].sort((a, b) => b.revenue - a.revenue)
  const top3Segments = sortedSegments.slice(0, 3)
  const sortedCustomers = [...concentrationData.revenueByCustomer].sort((a, b) => b.revenue - a.revenue)
  const top3Customers = sortedCustomers.slice(0, 3)

  const calculationTexts = {
    totalMarketingSpend: "Total Marketing Spend: Sum of marketing spend across all channels.\n\nShows total marketing investment.",
    totalROI: "Return on Investment = (Revenue - Spend) ÷ Spend × 100%\n\nMeasures marketing efficiency.",
  }

  const thCls = (align = "left") => `p-2 text-${align} text-xs`
  const tdCls = (align = "left") => `p-2 text-xs text-mediumBrown text-${align}`

  return (
    <div>
      <KeyQuestionBox question="Where does revenue actually come from? Are we over-dependent?" signals="Channel concentration, segment dependency" decisions="Diversify channels, reduce reliance on top clients" section="revenue-concentration" />
      <SectionControlsBar
        title="Revenue Concentration"
        onAddData={!isInvestorView ? onAddData : null}
        showAddData={!isInvestorView}
        showViewMode={false}
        extraControls={
          <div className="flex gap-2.5 items-center">
            {["channel", "customer", "segment"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 border-0 rounded cursor-pointer font-medium text-sm ${activeTab === tab ? "bg-mediumBrown text-[#fdfcfb]" : "bg-[#e8ddd4] text-mediumBrown hover:bg-[#d4c4b8]"}`}>
                By {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        }
      />

      <KpiGrid2>
        {renderKPICard("Total Marketing Spend", "totalMarketingSpend", calculationTexts.totalMarketingSpend, "currency", "down")}
        {renderKPICard("Overall ROI", "totalROI", calculationTexts.totalROI, "percentage", "up")}
      </KpiGrid2>

      {/* Top 3 Concentration Table */}
      <div className="bg-[#f5f0eb] p-5 rounded-lg mb-7">
        <h3 className="text-mediumBrown mt-0 mb-[15px] text-base">Top 3 Concentration</h3>
        <div className="grid grid-cols-3 gap-5">
          {[
            { label: "Top 3 Channels", data: top3Channels, nameKey: "name" },
            { label: "Top 3 Customers", data: top3Customers, nameKey: "name" },
            { label: "Top 3 Segments", data: top3Segments, nameKey: "name" },
          ].map(({ label, data }) => (
            <div key={label}>
              <h4 className="text-mediumBrown text-sm mb-2.5">{label}</h4>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-mediumBrown text-[#fdfcfb]">
                    <th className={thCls("left")}>{label.split(' ')[2]}</th>
                    <th className={thCls("right")}>Revenue</th>
                    <th className={thCls("right")}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={index} className="border-b border-[#e8ddd4]">
                      <td className={tdCls("left")}>{item.name}</td>
                      <td className={tdCls("right")}>{formatCurrency(item.revenue)}</td>
                      <td className={tdCls("right")}>{totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100).toFixed(1) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-[#f5f0eb] p-5 rounded-lg mb-7">
        <h3 className="text-mediumBrown mt-0 mb-[15px] text-base">
          {activeTab === "channel" ? "Revenue by Channel" : activeTab === "customer" ? "Revenue by Customer" : "Revenue by Segment"}
        </h3>
        <div className="h-[300px]">
          <Bar
            data={{
              labels: activeTab === "channel" ? concentrationData.revenueChannels.map(c => c.name) : activeTab === "customer" ? concentrationData.revenueByCustomer.map(c => c.name) : concentrationData.customerSegments.map(s => s.name),
              datasets: [
                { label: "Revenue", data: activeTab === "channel" ? concentrationData.revenueChannels.map(c => c.revenue) : activeTab === "customer" ? concentrationData.revenueByCustomer.map(c => c.revenue) : concentrationData.customerSegments.map(s => s.revenue), backgroundColor: "#5d4037", borderRadius: 4 },
                ...(activeTab === "channel" ? [{ label: "Marketing Spend", data: concentrationData.revenueChannels.map(c => c.spend), backgroundColor: "#8d6e63", borderRadius: 4 }] : []),
              ],
            }}
            options={{ responsive: true, maintainAspectRatio: false, plugins: { datalabels: { display: false }, legend: { display: activeTab === "channel" }, tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${formatCurrency(context.raw)}` } } }, scales: { y: { beginAtZero: true, ticks: { callback: (value) => formatCurrency(value) } } } }}
          />
        </div>
      </div>

      {/* Channel Performance Table */}
      <div className="bg-[#f5f0eb] p-5 rounded-lg mb-7">
        <h3 className="text-mediumBrown mt-0 mb-[15px] text-base">Channel Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-mediumBrown text-[#fdfcfb]">
                {["Channel", "Revenue", "Marketing Spend", "Net Profit", "ROI %", "% of Revenue"].map((h, i) => (
                  <th key={h} className={`p-3 text-[13px] ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {concentrationData.revenueChannels.sort((a, b) => b.revenue - a.revenue).map((channel, index) => {
                const netProfit = channel.revenue - channel.spend
                const roi = channel.spend > 0 ? (netProfit / channel.spend) * 100 : 0
                const revenuePercentage = totalRevenue > 0 ? (channel.revenue / totalRevenue) * 100 : 0
                return (
                  <tr key={index} className={`border-b border-[#e8ddd4] ${index % 2 === 0 ? "bg-[#fdfcfb]" : "bg-[#f5f0eb]"}`}>
                    <td className="p-2.5 text-[13px] text-mediumBrown font-semibold">{channel.name}</td>
                    <td className="p-2.5 text-[13px] text-mediumBrown text-right">{formatCurrency(channel.revenue)}</td>
                    <td className="p-2.5 text-[13px] text-mediumBrown text-right">{formatCurrency(channel.spend)}</td>
                    <td className={`p-2.5 text-[13px] text-right font-semibold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(netProfit)}</td>
                    <td className={`p-2.5 text-[13px] text-right font-semibold ${roi >= 0 ? "text-green-600" : "text-red-600"}`}>{roi.toFixed(1)}%</td>
                    <td className="p-2.5 text-[13px] text-mediumBrown text-right">{revenuePercentage.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Concentration Risk Analysis */}
      <div className="bg-[#f5f0eb] p-[15px] rounded-md">
        <h4 className="text-mediumBrown mt-0 mb-2.5">Concentration Risk Analysis</h4>
        <div>
          <div className="text-[13px] text-mediumBrown font-semibold mb-1">Channel Concentration Risk</div>
          <div className="flex items-center mb-2.5">
            <div className="w-full bg-[#e8ddd4] h-5 rounded-full overflow-hidden">
              <div className="h-full" style={{ width: `${top3Percentage}%`, backgroundColor: top3Percentage > 70 ? "#dc2626" : top3Percentage > 50 ? "#f59e0b" : "#16a34a" }} />
            </div>
            <div className="ml-2.5 text-sm text-mediumBrown font-semibold min-w-[40px]">{top3Percentage.toFixed(1)}%</div>
          </div>
          <div className="text-xs text-lightBrown">
            Top 3 channels generate {top3Percentage.toFixed(1)}% of total revenue
            {top3Percentage > 70 && " - High risk: Over-dependent on few channels"}
            {top3Percentage <= 70 && top3Percentage > 50 && " - Moderate risk"}
            {top3Percentage <= 50 && " - Low risk: Well diversified"}
          </div>
        </div>
      </div>

      <CalculationModal isOpen={showCalculationModal} onClose={() => setShowCalculationModal(false)} title={selectedCalculation.title} calculation={selectedCalculation.calculation} />
      {showTrendModal && selectedTrendItem && (
        <TrendModal
          isOpen={showTrendModal}
          onClose={() => { setShowTrendModal(false); setSelectedTrendItem(null) }}
          item={{ name: selectedTrendItem.name, isPercentage: selectedTrendItem.isPercentage }}
          trendData={{ labels: selectedTrendItem.labels, actual: selectedTrendItem.data, budget: null }}
          currencyUnit="zar"
          formatValue={(v) => formatCurrency(v)}
        />
      )}
    </div>
  );
};

// ==================== DEMAND SUSTAINABILITY COMPONENT ====================

const DemandSustainability = ({ activeSection, currentUser, isInvestorView, onAddData, fromDate, toDate }) => {
  const [loading, setLoading] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState({})
  const [kpiNotes, setKpiNotes] = useState({})
  const [kpiAnalysis, setKpiAnalysis] = useState({})
  const [showCalculationModal, setShowCalculationModal] = useState(false)
  const [selectedCalculation, setSelectedCalculation] = useState({ title: "", calculation: "" })
  const [showTrendModal, setShowTrendModal] = useState(false)
  const [selectedTrendItem, setSelectedTrendItem] = useState(null)
  const [sustainabilityData, setSustainabilityData] = useState({
    repeatCustomerRate: 0, churnRate: 0,
    campaigns: [
      { name: "Q1 Campaign", cost: 0, revenue: 0 }, { name: "Q2 Campaign", cost: 0, revenue: 0 },
      { name: "Summer Sale", cost: 0, revenue: 0 }, { name: "Holiday Campaign", cost: 0, revenue: 0 }
    ],
    notes: "",
  });

  const toYear = toDate ? parseInt(toDate.split("-")[0]) : new Date().getFullYear()

  useEffect(() => {
    if (currentUser && activeSection === "demand-sustainability") loadData()
  }, [currentUser, activeSection, toDate])

  const loadData = async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const docSnap = await getDoc(doc(db, "pipelineData", `${currentUser.uid}_sustainability_${toYear}`))
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSustainabilityData({
          repeatCustomerRate: data.repeatCustomerRate || 0, churnRate: data.churnRate || 0,
          campaigns: data.campaigns || sustainabilityData.campaigns,
          notes: data.notes || "",
        })
      } else {
        setSustainabilityData(prev => ({ ...prev, repeatCustomerRate: 0, churnRate: 0 }))
      }
    } catch (error) { console.error("Error loading demand sustainability data:", error) }
    finally { setLoading(false) }
  }

  const handleCalculationClick = (title, calculation) => { setSelectedCalculation({ title, calculation }); setShowCalculationModal(true) }

  const openTrendModal = (itemName, dataArray, isPercentage = false) => {
    const rangeMonths = getRangeMonths(fromDate, toDate)
    // dataArray is already aligned to range months (or campaign count); pad/trim to range
    const labels = rangeMonths.map(r => r.label)
    const data = rangeMonths.map((_, i) => dataArray[i] ?? dataArray[dataArray.length - 1] ?? 0)
    setSelectedTrendItem({ name: itemName, data, labels, isPercentage })
    setShowTrendModal(true)
  }

  const renderKPICard = (title, dataKey, calculation = "", unit = "percentage", goodDirection = "up") => {
    let actualValue = 0
    if (dataKey === "repeatCustomerRate") actualValue = sustainabilityData.repeatCustomerRate
    else if (dataKey === "churnRate") actualValue = sustainabilityData.churnRate
    else if (dataKey === "netRetention") actualValue = sustainabilityData.repeatCustomerRate - sustainabilityData.churnRate
    else if (dataKey === "campaignROI") {
      const totalCost = sustainabilityData.campaigns.reduce((sum, c) => sum + c.cost, 0)
      const totalRevenue = sustainabilityData.campaigns.reduce((sum, c) => sum + c.revenue, 0)
      actualValue = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0
    }

    const onTrend = () => {
      const rangeMonths = getRangeMonths(fromDate, toDate)
      if (dataKey === "campaignROI") {
        const roiData = rangeMonths.map((_, i) => {
          const c = sustainabilityData.campaigns[i % sustainabilityData.campaigns.length]
          return c.cost > 0 ? ((c.revenue - c.cost) / c.cost) * 100 : 0
        })
        openTrendModal(title, roiData, true)
      } else {
        openTrendModal(title, rangeMonths.map(() => actualValue), true)
      }
    }

    return (
      <KPITripleCard
        key={dataKey}
        title={title}
        actualValue={actualValue}
        budgetValue={0}
        unit={unit}
        goodDirection={goodDirection}
        onEyeClick={() => handleCalculationClick(title, calculation)}
        onAddNotes={(val) => setKpiNotes(prev => ({ ...prev, [dataKey]: val }))}
        onAnalysis={() => setExpandedNotes(prev => ({ ...prev, [`${dataKey}_analysis`]: !prev[`${dataKey}_analysis`] }))}
        onTrend={onTrend}
        notes={kpiNotes[dataKey]}
      />
    )
  }

  if (activeSection !== "demand-sustainability") return null

  const netRetention = sustainabilityData.repeatCustomerRate - sustainabilityData.churnRate
  const totalCampaignCost = sustainabilityData.campaigns.reduce((sum, c) => sum + c.cost, 0)
  const totalCampaignRevenue = sustainabilityData.campaigns.reduce((sum, c) => sum + c.revenue, 0)
  const campaignROI = totalCampaignCost > 0 ? ((totalCampaignRevenue - totalCampaignCost) / totalCampaignCost) * 100 : 0

  const calculationTexts = {
    repeatCustomerRate: "Repeat Customer Rate = (Repeat Customers ÷ Total Customers) × 100%\n\nMeasures customer loyalty and satisfaction.",
    churnRate: "Churn Rate = (Customers Lost ÷ Total Customers) × 100%\n\nMeasures customer retention.",
    netRetention: "Net Retention Rate = Repeat Customer Rate - Churn Rate\n\nIndicates overall customer retention health.",
    campaignROI: "Campaign ROI = (Revenue - Cost) ÷ Cost × 100%\n\nMeasures marketing campaign effectiveness.",
  };

  return (
    <div>
      <KeyQuestionBox question="Is demand repeatable? Will demand persist without constant spend?" signals="Referral rates, repeat customers, CAC trends" decisions="Build demand engine, focus on retention, optimize campaigns" section="demand-sustainability" />
      <SectionControlsBar
        title="Demand Sustainability"
        onAddData={!isInvestorView ? onAddData : null}
        showAddData={!isInvestorView}
        showViewMode={false}
      />
      <KpiGrid2>
        {renderKPICard("Repeat Customer Rate", "repeatCustomerRate", calculationTexts.repeatCustomerRate, "percentage", "up")}
        {renderKPICard("Churn Rate", "churnRate", calculationTexts.churnRate, "percentage", "down")}
        {renderKPICard("Net Retention", "netRetention", calculationTexts.netRetention, "percentage", "up")}
        {renderKPICard("Campaign ROI", "campaignROI", calculationTexts.campaignROI, "percentage", "up")}
      </KpiGrid2>

      {/* Campaign Table */}
      <div className="bg-[#f5f0eb] p-[15px] rounded-md mb-5">
        <h4 className="text-mediumBrown mt-0 mb-2.5">Campaign Performance</h4>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-mediumBrown text-[#fdfcfb]">
                <th className="p-3 text-left text-[13px]">Campaign</th>
                <th className="p-3 text-right text-[13px]">Cost</th>
                <th className="p-3 text-right text-[13px]">Revenue</th>
                <th className="p-3 text-right text-[13px]">ROI %</th>
              </tr>
            </thead>
            <tbody>
              {sustainabilityData.campaigns.map((campaign, index) => {
                const roi = campaign.cost > 0 ? ((campaign.revenue - campaign.cost) / campaign.cost) * 100 : 0;
                return (
                  <tr key={index} className={`border-b border-[#e8ddd4] ${index % 2 === 0 ? "bg-[#fdfcfb]" : "bg-[#f5f0eb]"}`}>
                    <td className="p-2.5 text-[13px] text-mediumBrown font-semibold">{campaign.name}</td>
                    <td className="p-2.5 text-[13px] text-mediumBrown text-right">{formatCurrency(campaign.cost)}</td>
                    <td className="p-2.5 text-[13px] text-mediumBrown text-right">{formatCurrency(campaign.revenue)}</td>
                    <td className={`p-2.5 text-[13px] text-right font-semibold ${roi >= 0 ? "text-green-600" : "text-red-600"}`}>{roi.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <CalculationModal isOpen={showCalculationModal} onClose={() => setShowCalculationModal(false)} title={selectedCalculation.title} calculation={selectedCalculation.calculation} />
      {showTrendModal && selectedTrendItem && (
        <TrendModal
          isOpen={showTrendModal}
          onClose={() => { setShowTrendModal(false); setSelectedTrendItem(null) }}
          item={{ name: selectedTrendItem.name, isPercentage: selectedTrendItem.isPercentage }}
          trendData={{ labels: selectedTrendItem.labels, actual: selectedTrendItem.data, budget: null }}
          currencyUnit="zar"
          formatValue={(v) => formatCurrency(v)}
        />
      )}
    </div>
  );
};

// ==================== MAIN MARKETING SALES COMPONENT ====================

export default function MarketingSales() {
  const [activeSection, setActiveSection] = useState("pipeline-visibility")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [user, setUser] = useState(null)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [isInvestorView, setIsInvestorView] = useState(false)
  const [viewingSMEId, setViewingSMEId] = useState(null)
  const [viewingSMEName, setViewingSMEName] = useState("")
  const [showAddDataModal, setShowAddDataModal] = useState(false)
  const [loading, setLoading] = useState(false)

  // Date range — YYYY-MM strings, default = last 12 months ending today
  const _now = new Date()
  const _toYM = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, "0")}`
  const _fromD = new Date(_now.getFullYear(), _now.getMonth() - 11, 1)
  const _fromYM = `${_fromD.getFullYear()}-${String(_fromD.getMonth() + 1).padStart(2, "0")}`
  const [filterMode, setFilterMode] = useState("range")
  const [fromDate, setFromDate] = useState(_fromYM)
  const [toDate, setToDate] = useState(_toYM)

  useEffect(() => {
    const investorViewMode = sessionStorage.getItem("investorViewMode")
    const smeId = sessionStorage.getItem("viewingSMEId")
    const smeName = sessionStorage.getItem("viewingSMEName")
    if (investorViewMode === "true" && smeId) { setIsInvestorView(true); setViewingSMEId(smeId); setViewingSMEName(smeName || "SME") }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(isInvestorView && viewingSMEId ? { uid: viewingSMEId } : currentUser)
    })
    return () => unsubscribe()
  }, [isInvestorView, viewingSMEId])

  useEffect(() => {
    const checkSidebarState = () => setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"))
    checkSidebarState()
    const observer = new MutationObserver(checkSidebarState)
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  const handleExitInvestorView = () => {
    sessionStorage.removeItem("viewingSMEId")
    sessionStorage.removeItem("viewingSMEName")
    sessionStorage.removeItem("investorViewMode")
    window.location.href = "/my-cohorts"
  }

  const sectionButtons = [
    { id: "pipeline-visibility", label: "Pipeline Visibility" },
    { id: "pipeline-sufficiency", label: "Pipeline Sufficiency" },
    { id: "revenue-concentration", label: "Revenue Concentration" },
    { id: "demand-sustainability", label: "Demand Sustainability" },
  ]

  return (
    <div className="flex min-h-screen">
      <div style={{ width: "100%", marginLeft: 0, minHeight: "100vh", padding: `70px 20px 20px ${isSidebarCollapsed ? "100px" : "270px"}`, transition: "padding 0.3s ease", boxSizing: "border-box" }}>
        {isInvestorView && (
          <div className="bg-[#e8f5e9] px-5 py-4 mt-[50px] mb-5 rounded-lg border-2 border-[#4caf50] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-xl">👁️</span>
              <span className="text-[#2e7d32] font-semibold text-[15px]">Investor View: Viewing {viewingSMEName}'s Marketing & Sales Data</span>
            </div>
            <button onClick={handleExitInvestorView} className="px-4 py-2 bg-[#4caf50] text-white border-0 rounded-md cursor-pointer font-semibold text-sm">Back to My Cohorts</button>
          </div>
        )}

        <div className="p-5 pt-10 ml-5">
          <div className="flex justify-between items-center mb-5">
            <h1 className="text-mediumBrown text-[32px] font-bold m-0">Marketing & Pipeline Performance</h1>
          </div>

          {/* About Dashboard */}
          <div className="bg-[#fdfcfb] p-5 rounded-lg shadow-sm mb-7 border border-mediumBrown">
            <div onClick={() => setShowFullDescription(!showFullDescription)} className="cursor-pointer flex justify-between items-center text-mediumBrown font-semibold">
              <span>About this Dashboard</span>
              <span>{showFullDescription ? "▼" : "▶"}</span>
            </div>
            {showFullDescription && (
              <div className="mt-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <h3 className="text-warmBrown mt-0 mb-3 text-base">What this dashboard DOES</h3>
                    <ul className="text-textBrown text-sm leading-7 m-0 pl-5">
                      <li>Assesses pipeline visibility, quality, and concentration</li>
                      <li>Evaluates demand risk and market exposure</li>
                      <li>Monitors lead generation effectiveness and conversion rates</li>
                      <li>Measures customer acquisition cost and marketing ROI</li>
                      <li>Tracks sales cycle efficiency and pipeline velocity</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-warmBrown mt-0 mb-3 text-base">What this dashboard does NOT do</h3>
                    <ul className="text-textBrown text-sm leading-7 m-0 pl-5">
                      <li>Run marketing campaigns or ad management</li>
                      <li>Manage CRM or customer relationship tracking</li>
                      <li>Track social media engagement or content scheduling</li>
                      <li>Email marketing automation or lead nurturing</li>
                      <li>SEO optimization or website analytics management</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Date Range Picker */}
          <div className="mb-7">
            <DateRangePicker
              filterMode={filterMode}
              setFilterMode={setFilterMode}
              fromDate={fromDate}
              setFromDate={setFromDate}
              toDate={toDate}
              setToDate={setToDate}
            />
          </div>

          {/* Section Buttons */}
          <div className="flex gap-[15px] mb-7 p-[15px] bg-[#fdfcfb] rounded-lg shadow-sm flex-wrap">
            {sectionButtons.map((button) => (
              <button
                key={button.id}
                onClick={() => setActiveSection(button.id)}
                className={`px-6 py-3 border-0 rounded-md cursor-pointer font-semibold text-[15px] transition-all duration-300 shadow min-w-[180px] text-center ${activeSection === button.id ? "bg-mediumBrown text-[#fdfcfb]" : "bg-[#e8ddd4] text-mediumBrown"}`}
              >
                {button.label}
              </button>
            ))}
          </div>

          {/* Section Components */}
          <PipelineVisibility activeSection={activeSection} currentUser={user} isInvestorView={isInvestorView} onAddData={() => setShowAddDataModal(true)} fromDate={fromDate} toDate={toDate} />
          <PipelineSufficiency activeSection={activeSection} currentUser={user} isInvestorView={isInvestorView} onAddData={() => setShowAddDataModal(true)} fromDate={fromDate} toDate={toDate} />
          <RevenueConcentration activeSection={activeSection} currentUser={user} isInvestorView={isInvestorView} onAddData={() => setShowAddDataModal(true)} fromDate={fromDate} toDate={toDate} />
          <DemandSustainability activeSection={activeSection} currentUser={user} isInvestorView={isInvestorView} onAddData={() => setShowAddDataModal(true)} fromDate={fromDate} toDate={toDate} />
        </div>
      </div>

      <UniversalAddDataModal
        isOpen={showAddDataModal}
        onClose={() => setShowAddDataModal(false)}
        currentTab={activeSection}
        user={user}
        onSave={() => { setLoading(true); setTimeout(() => setLoading(false), 1000) }}
        loading={loading}
        fromDate={fromDate}
        toDate={toDate}
      />
    </div>
  );
}