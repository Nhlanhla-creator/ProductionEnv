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
  KpiGrid3,
} from "../components/SharedComponents";
import UniversalAddDataModal from "../components/UniversalAddDataModal";
import { useCostAgilityData } from "../../../hooks/useFinancialData";
import { CALCULATION_TEXTS } from "../data_utils/financialConstants";
import {
  makeFormatValue,
  getRangeLabels,
  getRangeComputed,
  computeCostChartData,
} from "../data_utils/financialUtils";

const _now        = new Date();
const _defaultTo  = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, "0")}`;
const _defaultFrom = (() => {
  const d = new Date(_now.getFullYear(), _now.getMonth() - 11, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
})();

const CostAgility = ({ activeSection, user, isInvestorView }) => {
  const [showModal, setShowModal]             = useState(false);
  const [expandedNotes, setExpandedNotes]     = useState({});
  const [showTrendModal, setShowTrendModal]   = useState(false);
  const [selectedTrendItem, setSelectedTrendItem] = useState(null);
  const [trendData, setTrendData]             = useState(null);
  const [trendLoading, setTrendLoading]       = useState(false);
  const [showCalcModal, setShowCalcModal]     = useState(false);
  const [selectedCalc, setSelectedCalc]       = useState({ title: "", calculation: "" });
  const [currencyUnit]                        = useState("zar_million");

  // Date range — default to last 12 months
  const [fromDate, setFromDate] = useState(_defaultFrom);
  const [toDate, setToDate]     = useState(_defaultTo);

  const {
    firebaseChartData,
    chartNotes,
    setChartNotes,
    loading,
    firstDataMonth,
    loadCostData,
  } = useCostAgilityData(user);

  const formatValue = makeFormatValue(currencyUnit);

  // Reload when user or range changes
  useEffect(() => {
    if (user) loadCostData(fromDate, toDate);
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
        docBase: "_costAgility",
        chartKey: dataKey,
        fromYM: fromDate,
        toYM: toDate,
        getDocFn: getDoc,
        docFn: doc,
        db,
        processor: computeCostChartData,
      });

      // Build smart y-axis formatting
      // Cost Agility KPIs: fixedVariableRatio & discretionaryPercentage are %,
      // lockInDuration is in months — treat as unitless scalar.
      let trendFormatValue, yAxisLabel, yTickFmt;
      if (isPercentage) {
        trendFormatValue = (v) => `${parseFloat(v).toFixed(2)}%`;
        yAxisLabel       = "Percentage (%)";
        yTickFmt         = (v) => `${parseFloat(v).toFixed(1)}%`;
      } else if (dataKey === "lockInDuration") {
        trendFormatValue = (v) => `${parseFloat(v).toFixed(1)} months`;
        yAxisLabel       = "Months";
        yTickFmt         = (v) => parseFloat(v).toFixed(1);
      } else {
        // Currency values stored in millions
        const allVals    = [...(actual || []), ...(budget || [])].filter((v) => v !== null && !isNaN(v));
        const maxAbs     = allVals.length ? Math.max(...allVals.map(Math.abs)) : 0;
        const scaleUnit    = maxAbs >= 1_000 ? "R bn" : maxAbs >= 1 ? "R m" : "R k";
        const scaleDivisor = maxAbs >= 1_000 ? 1_000   : maxAbs >= 1 ? 1    : 0.001;
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

  const KPI_CONFIG = [
    {
      dataKey:      "fixedVariableRatio",
      title:        "Fixed/Variable Ratio",
      unitLabel:    "%",
      formatCircle: (v) => parseFloat(v).toFixed(2),
    },
    {
      dataKey:      "discretionaryPercentage",
      title:        "Discretionary Spend",
      unitLabel:    "%",
      formatCircle: (v) => parseFloat(v).toFixed(2),
    },
    {
      dataKey:      "lockInDuration",
      title:        "Cost Lock-in",
      unitLabel:    "months",
      formatCircle: (v) => parseFloat(v).toFixed(1),
    },
  ];

  const renderKPI = ({ dataKey, title, unitLabel, formatCircle }) => {
    const data    = firebaseChartData[dataKey] || { actual: [] };
    const current = data.actual?.at(-1) ?? 0;
    const calc    = CALCULATION_TEXTS.costAgility?.[dataKey] || "";
    return (
      <KPICard
        key={dataKey}
        title={title}
        actualValue={current}
        budgetValue={0}
        unit={currencyUnit}
        unitLabel={unitLabel}
        singleCircle
        formatCircleValue={formatCircle}
        onEyeClick={() => openCalc(title, calc)}
        onAddNotes={(notes) => setChartNotes((p) => ({ ...p, [dataKey]: notes }))}
        onAnalysis={() =>
          setExpandedNotes((p) => ({ ...p, [`${dataKey}_analysis`]: !p[`${dataKey}_analysis`] }))
        }
        onTrend={() => openTrend(title, dataKey, unitLabel === "%")}
        notes={chartNotes[dataKey]}
        formatValue={formatValue}
      />
    );
  };

  if (activeSection !== "cost-agility") return null;

  return (
    <div className="pt-5">
      <KeyQuestionBox
        question="Can costs flex under pressure? If revenue drops, can the business adapt quickly?"
        signals="Discretionary spending capacity, fixed cost lock-in duration"
        decisions="Restructure costs, delay scaling, renegotiate contracts, adjust capital strategy"
      />

      <SectionControlsBar
        title="Cost Agility"
        onAddData={!isInvestorView ? () => setShowModal(true) : null}
        showAddData={!isInvestorView}
        showViewMode={false}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        minDate={firstDataMonth ?? "2023-01"}
        maxDate={_defaultTo}
      />

      <KpiGrid3>
        {KPI_CONFIG.map(renderKPI)}
      </KpiGrid3>

      <UniversalAddDataModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentTab="cost-agility"
        user={user}
        onSave={() => loadCostData(fromDate, toDate)}
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

export default CostAgility;