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
import { CALCULATION_TEXTS } from "../financialConstants";
import {
  makeFormatValue,
  getLast12MonthsLabels,
  getLast12MonthsComputed,
  computeCostChartData,
} from "../financialUtils";

const CostAgility = ({ activeSection, user, isInvestorView, financialYearStart }) => {
  const [showModal, setShowModal]             = useState(false);
  const [expandedNotes, setExpandedNotes]     = useState({});
  const [showTrendModal, setShowTrendModal]   = useState(false);
  const [selectedTrendItem, setSelectedTrendItem] = useState(null);
  const [trendData, setTrendData]             = useState(null);
  const [trendLoading, setTrendLoading]       = useState(false);
  const [showCalcModal, setShowCalcModal]     = useState(false);
  const [selectedCalc, setSelectedCalc]       = useState({ title: "", calculation: "" });
  const [currencyUnit]                        = useState("zar_million");

  const {
    firebaseChartData,
    chartNotes,
    setChartNotes,
    loading,
    loadCostData,
  } = useCostAgilityData(user);

  const formatValue = makeFormatValue(currencyUnit);

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

  // Single-source KPI config: dataKey, display title, unit label, circle formatter
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
    // Most-recent value only — no view-mode aggregation for this section
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
        onAddNotes={(notes) =>
          setChartNotes((p) => ({ ...p, [dataKey]: notes }))
        }
        onAnalysis={() =>
          setExpandedNotes((p) => ({
            ...p,
            [`${dataKey}_analysis`]: !p[`${dataKey}_analysis`],
          }))
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
      />

      <KpiGrid3>
        {KPI_CONFIG.map(renderKPI)}
      </KpiGrid3>

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