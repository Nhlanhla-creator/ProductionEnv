"use client";
import { useState, useEffect } from "react";
import { db } from "../../../../firebaseConfig";
import { getDoc, doc } from "firebase/firestore";
import {
  KeyQuestionBox,
  KPICard,
  TrendModal,
  CalculationModal,
  SectionControlsBar,
  SectionHeading,
  KpiGrid2,
  YearMonthSelector,
  DateRangePicker,
} from "../components/SharedComponents";
import UniversalAddDataModal from "../components/UniversalAddDataModal";
import { useCostAgilityData } from "../../../hooks/useFinancialData";
import {
  CALCULATION_TEXTS,
  getMonthsForYear,
  getYearsRange,
} from "../financialConstants";
import {
  aggregateDataForView,
  makeFormatValue,
  getLast12MonthsLabels,
  getLast12MonthsComputed,
  computeCostChartData,
} from "../financialUtils";

// Default From-To: last 12 months
const now = new Date()
const defaultTo   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
const defaultFrom = (() => { const d = new Date(now.getFullYear(), now.getMonth() - 11, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` })()

const CostAgility = ({ activeSection, user, isInvestorView, financialYearStart }) => {
  const [showModal, setShowModal]   = useState(false)
  const [viewMode, setViewMode]     = useState("month")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(financialYearStart)
  // Date filter state — default to From-To (last 12 months)
  const [filterMode, setFilterMode] = useState("range")
  const [fromDate, setFromDate]     = useState(defaultFrom)
  const [toDate, setToDate]         = useState(defaultTo)
  const [expandedNotes, setExpandedNotes] = useState({})
  const [showTrendModal, setShowTrendModal] = useState(false)
  const [selectedTrendItem, setSelectedTrendItem] = useState(null)
  const [trendData, setTrendData] = useState(null)
  const [trendLoading, setTrendLoading] = useState(false)
  const [showCalcModal, setShowCalcModal] = useState(false)
  const [selectedCalc, setSelectedCalc]   = useState({ title: "", calculation: "" })
  const [currencyUnit] = useState("zar_million")

  const {
    firebaseChartData,
    chartNotes,
    setChartNotes,
    loading,
    loadCostData,
  } = useCostAgilityData(user);

  const formatValue = makeFormatValue(currencyUnit);
  const months = getMonthsForYear(selectedYear, financialYearStart);
  const years = getYearsRange(2021, 2030);

  useEffect(() => {
    if (user) loadCostData();
  }, [user]);

  const openTrend = async (name, dataKey, isPercentage = false) => {
    setSelectedTrendItem({ name, isPercentage });
    setTrendData(null);
    setTrendLoading(true);
    setShowTrendModal(true);
    try {
      const labels = getLast12MonthsLabels(financialYearStart);
      const { actual, budget } = await getLast12MonthsComputed({
        uid: user.uid,
        docBase: "_costAgility",
        chartKey: dataKey,
        financialYearStart,
        getDocFn: getDoc,
        docFn: doc,
        db,
        processor: computeCostChartData,
      });
      setTrendData({ labels, actual, budget });
    } catch (e) {
      console.error("Trend load error:", e);
      setTrendData({
        labels: getLast12MonthsLabels(financialYearStart),
        actual: Array(12).fill(null),
        budget: null,
      });
    } finally {
      setTrendLoading(false);
    }
  };

  const openCalc = (title, calculation) => {
    setSelectedCalc({ title, calculation });
    setShowCalcModal(true);
  };

  const renderKPI = (title, dataKey, isPercentage = false) => {
    const data = firebaseChartData[dataKey] || { actual: [] };
    const chartArr = aggregateDataForView(data.actual, viewMode);
    const current = chartArr.at(-1) ?? 0;
    const calc = CALCULATION_TEXTS.costAgility?.[dataKey] || "";
    return (
      <KPICard
        key={dataKey}
        title={title}
        actualValue={current}
        budgetValue={0}
        unit={currencyUnit}
        isPercentage={isPercentage}
        onEyeClick={() => openCalc(title, calc)}
        onAddNotes={(notes) =>
          setChartNotes((p) => ({ ...p, [dataKey]: notes }))
        }
        onAnalysis={() =>
          setExpandedNotes((p) => ({
            ...p,
            [`${dataKey}_analysis`]: !p[`${dataKey}_analysis`],
          }))
        }
        onTrend={() => openTrend(title, dataKey, isPercentage)}
        notes={chartNotes[dataKey]}
        formatValue={formatValue}
      />
    );
  };

  if (activeSection !== "cost-agility") return null;

  // Controls: YearMonth + DateRange together
  const extraControls = (
    <div className="flex gap-4 items-center flex-wrap">
      <DateRangePicker
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        years={years}
        months={months}
      />
    </div>
  );

  return (
    <div className="pt-5">
      <KeyQuestionBox
        question="Can costs flex under pressure? If revenue drops, can the business adapt quickly?"
        signals="Discretionary spending capacity, fixed cost lock-in duration"
        decisions="Restructure costs, delay scaling, renegotiate contracts, adjust capital strategy"
      />

      <SectionControlsBar
        title="Cost Agility"
        viewMode={viewMode}
        setViewMode={setViewMode}
        onAddData={!isInvestorView ? () => setShowModal(true) : null}
        showAddData={!isInvestorView}
        extraControls={extraControls}
      />

      {/* Only Discretionary Costs and Lock-in Duration */}
      <KpiGrid2>
        {renderKPI("Discretionary Costs", "discretionaryCosts")}
        {renderKPI("Lock-in Duration", "lockInDuration")}
      </KpiGrid2>

      <UniversalAddDataModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentTab="cost-agility"
        user={user}
        onSave={loadCostData}
        loading={loading}
        financialYearStart={financialYearStart}
      />

      <CalculationModal
        isOpen={showCalcModal}
        onClose={() => setShowCalcModal(false)}
        title={selectedCalc.title}
        calculation={selectedCalc.calculation}
      />

      {showTrendModal && (
        <TrendModal
          isOpen={showTrendModal}
          onClose={() => {
            setShowTrendModal(false);
            setTrendData(null);
          }}
          item={selectedTrendItem}
          trendData={trendData}
          currencyUnit={currencyUnit}
          formatValue={formatValue}
          loading={trendLoading}
        />
      )}
    </div>
  );
};

export default CostAgility;
