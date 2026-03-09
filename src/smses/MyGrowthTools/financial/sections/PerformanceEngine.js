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
  KpiGrid3,
  KpiGrid2,
} from "../components/SharedComponents";
import UniversalAddDataModal from "../components/UniversalAddDataModal";
import { usePerformanceEngineData } from "../../../hooks/useFinancialData";
import { CALCULATION_TEXTS } from "../data_utils/financialConstants";
import {
  aggregateDataForView,
  makeFormatValue,
  getRangeLabels,
  getRangeComputed,
  computePnlChartData,
  formatSmartNumber,
  getSmartUnit,
  getDefaultRange,
} from "../data_utils/financialUtils";

// Default range helpers (same as other sections)
const _now        = new Date();
const _defaultTo  = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, "0")}`;
const _defaultFrom = (() => {
  const d = new Date(_now.getFullYear(), _now.getMonth() - 11, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
})();

const PerformanceEngine = ({
  activeSection,
  user,
  onUpdateChartData,
  isInvestorView,
}) => {
  const [showModal, setShowModal]         = useState(false);
  const [viewMode, setViewMode]           = useState("month");
  const [showVariance, setShowVariance]   = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});
  const [showTrendModal, setShowTrendModal]       = useState(false);
  const [selectedTrendItem, setSelectedTrendItem] = useState(null);
  const [trendData, setTrendData]                 = useState(null);
  const [trendLoading, setTrendLoading]           = useState(false);
  const [showCalcModal, setShowCalcModal]   = useState(false);
  const [selectedCalc, setSelectedCalc]     = useState({ title: "", calculation: "" });
  const [currencyUnit] = useState("zar_million");

  // Date range — default to last 12 months
  const [fromDate, setFromDate] = useState(_defaultFrom);
  const [toDate, setToDate]     = useState(_defaultTo);

  const {
    firebaseChartData,
    chartNotes,
    setChartNotes,
    customKPIs,
    loading,
    firstDataMonth,
    loadPnLData,
    loadCustomKPIs,
  } = usePerformanceEngineData(user);

  const formatValue = makeFormatValue(currencyUnit);

  // Reload when user or range changes
  useEffect(() => {
    if (user) {
      loadPnLData(fromDate, toDate, onUpdateChartData);
      loadCustomKPIs();
    }
  }, [user, fromDate, toDate]);

  const openTrend = async (name, dataKey, isPercentage = false) => {
    setSelectedTrendItem({ name, isPercentage });
    setTrendData(null);
    setTrendLoading(true);
    setShowTrendModal(true);
    try {
      const labels = getRangeLabels(fromDate, toDate);
      const { actual, budget } = await getRangeComputed({
        uid: user.uid,
        docBase: "_pnlManual",
        chartKey: dataKey,
        fromYM: fromDate,
        toYM: toDate,
        getDocFn: getDoc,
        docFn: doc,
        db,
        processor: computePnlChartData,
      });

      // Build smart y-axis formatting (values are in millions)
      let trendFormatValue, yAxisLabel, yTickFmt;
      if (isPercentage) {
        trendFormatValue = (v) => `${parseFloat(v).toFixed(2)}%`;
        yAxisLabel       = "Percentage (%)";
        yTickFmt         = (v) => `${parseFloat(v).toFixed(1)}%`;
      } else {
        const allVals    = [...(actual || []), ...(budget || [])].filter((v) => v !== null && !isNaN(v));
        const maxAbs     = allVals.length ? Math.max(...allVals.map(Math.abs)) : 0;
        const scaleUnit    = maxAbs >= 1_000 ? "R bn" : maxAbs >= 1 ? "R m" : "R k";
        const scaleDivisor = maxAbs >= 1_000 ? 1_000   : maxAbs >= 1 ? 1      : 0.001;
        const fmtDecimals  = maxAbs >= 1_000 ? 2       : maxAbs >= 1 ? 2      : 2;
        trendFormatValue = (v) => {
          const num = parseFloat(v) || 0;
          const abs = Math.abs(num);
          if (abs >= 1_000) return `R${(num / 1_000).toFixed(2)}bn`;
          if (abs >= 1)     return `R${num.toFixed(2)}m`;
          return `R${(num * 1_000).toFixed(2)}k`;
        };
        yAxisLabel = `Value (${scaleUnit})`;
        yTickFmt   = (v) => (v / scaleDivisor).toFixed(fmtDecimals);
      }

      setSelectedTrendItem({ name, isPercentage, trendFormatValue, yAxisLabel, yTickFmt });
      setTrendData({ labels, actual, budget });
    } catch (e) {
      console.error("Trend load error:", e);
      setTrendData({
        labels: getRangeLabels(fromDate, toDate),
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
    const data      = firebaseChartData[dataKey] || { actual: [], budget: [] };
    const chartArr  = aggregateDataForView(data.actual,        viewMode, isPercentage);
    const budgetArr = aggregateDataForView(data.budget || [],  viewMode, isPercentage);
    const current   = chartArr.at(-1)  ?? 0;
    const budget    = budgetArr.at(-1) ?? 0;
    const calc      = CALCULATION_TEXTS.performance[dataKey] || "";

    const unitLabel        = isPercentage ? "%" : getSmartUnit(current);
    const formatCircleValue = isPercentage
      ? (v) => parseFloat(v).toFixed(2)
      : (v) => formatSmartNumber(v);

    return (
      <KPICard
        key={dataKey}
        title={title}
        actualValue={current}
        budgetValue={budget}
        unit={currencyUnit}
        isPercentage={isPercentage}
        unitLabel={unitLabel}
        formatCircleValue={formatCircleValue}
        onEyeClick={() => openCalc(title, calc)}
        onAddNotes={(notes) => setChartNotes((p) => ({ ...p, [dataKey]: notes }))}
        onAnalysis={() =>
          setExpandedNotes((p) => ({ ...p, [`${dataKey}_analysis`]: !p[`${dataKey}_analysis`] }))
        }
        onTrend={() => openTrend(title, dataKey, isPercentage)}
        notes={chartNotes[dataKey]}
        formatValue={formatValue}
      />
    );
  };

  if (activeSection !== "performance-engine") return null;

  const extraControls = (
    <button
      onClick={() => setShowVariance((v) => !v)}
      className={`px-4 py-2 border-0 rounded cursor-pointer font-medium text-sm ${
        showVariance
          ? "bg-mediumBrown text-[#fdfcfb]"
          : "bg-[#e8ddd4] text-mediumBrown hover:bg-[#d4c4b8]"
      }`}
    >
      {showVariance ? "Show Actual/Budget" : "Show Variance"}
    </button>
  );

  return (
    <div className="pt-5">
      <KeyQuestionBox
        question="Is the business economically working? Are margins healthy and sustainable?"
        signals="Margin trends, profitability direction, revenue growth"
        decisions="Fix pricing, cost control, optimize product mix, growth pacing"
      />

      <SectionControlsBar
        title="Performance Engine"
        viewMode={viewMode}
        setViewMode={setViewMode}
        onAddData={!isInvestorView ? () => setShowModal(true) : null}
        showAddData={!isInvestorView}
        extraControls={extraControls}
        // Range picker props forwarded so SectionControlsBar can render it if desired;
        // for now the section inherits its own range state managed above.
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        minDate={firstDataMonth ?? "2023-01"}
        maxDate={_defaultTo}
      />

      {/* Revenue & Cost */}
      <KpiGrid3>
        {renderKPI("Revenue",            "sales")}
        {renderKPI("COGS",               "cogs")}
        {renderKPI("Operating Expenses", "opex")}
      </KpiGrid3>

      {/* Profitability */}
      <SectionHeading>Profitability Analysis</SectionHeading>
      <KpiGrid2>
        {renderKPI("Gross Profit", "grossProfit")}
        {renderKPI("Net Profit",   "netProfit")}
      </KpiGrid2>

      {/* Margins */}
      <SectionHeading>Margin Analysis</SectionHeading>
      <KpiGrid2>
        {renderKPI("Gross Profit Margin", "gpMargin", true)}
        {renderKPI("Net Profit Margin",   "npMargin", true)}
      </KpiGrid2>

      <UniversalAddDataModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentTab="performance-engine"
        user={user}
        onSave={() => loadPnLData(fromDate, toDate, onUpdateChartData)}
        loading={loading}
        fromDate={fromDate}
        toDate={toDate}
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
          onClose={() => { setShowTrendModal(false); setTrendData(null); }}
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

export default PerformanceEngine;