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
import { CALCULATION_TEXTS } from "../financialConstants";
import {
  aggregateDataForView,
  makeFormatValue,
  getLast12MonthsLabels,
  getLast12MonthsComputed,
  computePnlChartData,
} from "../financialUtils";

const PerformanceEngine = ({
  activeSection,
  financialYearStart,
  user,
  onUpdateChartData,
  isInvestorView,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState("month");
  const [selectedYear] = useState(new Date().getFullYear());
  const [showVariance, setShowVariance] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});
  const [showTrendModal, setShowTrendModal] = useState(false);
  const [selectedTrendItem, setSelectedTrendItem] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [trendLoading, setTrendLoading] = useState(false);
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [selectedCalc, setSelectedCalc] = useState({
    title: "",
    calculation: "",
  });
  const [currencyUnit] = useState("zar_million");

  const {
    firebaseChartData,
    chartNotes,
    setChartNotes,
    customKPIs,
    loading,
    loadPnLData,
    loadCustomKPIs,
  } = usePerformanceEngineData(user);

  const formatValue = makeFormatValue(currencyUnit);

  useEffect(() => {
    if (user) {
      loadPnLData(onUpdateChartData);
      loadCustomKPIs();
    }
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
        docBase: "_pnlManual",
        chartKey: dataKey,
        financialYearStart,
        getDocFn: getDoc,
        docFn: doc,
        db,
        processor: computePnlChartData,
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
    const data = firebaseChartData[dataKey] || { actual: [], budget: [] };
    const chartArr = aggregateDataForView(data.actual, viewMode);
    const budgetArr = aggregateDataForView(data.budget || [], viewMode);
    const current = chartArr.at(-1) ?? 0;
    const budget = budgetArr.at(-1) ?? 0;
    const calc = CALCULATION_TEXTS.performance[dataKey] || "";
    return (
      <KPICard
        key={dataKey}
        title={title}
        actualValue={current}
        budgetValue={budget}
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
        // extraControls={extraControls}
      />

      {/* Revenue & Cost */}
      <KpiGrid3>
        {renderKPI("Revenue", "sales")}
        {renderKPI("COGS", "cogs")}
        {renderKPI("Operating Expenses", "opex")}
      </KpiGrid3>

      {/* Profitability — EBITDA and EBIT removed */}
      <SectionHeading>Profitability Analysis</SectionHeading>
      <KpiGrid2>
        {renderKPI("Gross Profit", "grossProfit")}
        {renderKPI("Net Profit", "netProfit")}
      </KpiGrid2>

      {/* Margins */}
      <SectionHeading>Margin Analysis</SectionHeading>
      <KpiGrid2>
        {renderKPI("Gross Profit Margin", "gpMargin", true)}
        {renderKPI("Net Profit Margin", "npMargin", true)}
      </KpiGrid2>

      {/* Custom KPIs */}
      {/* {Object.keys(customKPIs).length > 0 && (
        <>
          <SectionHeading>Custom KPIs</SectionHeading>
          <KpiGrid2>
            {Object.values(customKPIs).map((kpi) => {
              const data = firebaseChartData[kpi.chartName] || {
                actual: [],
                budget: [],
              };
              const chartArr = aggregateDataForView(data.actual, viewMode);
              const budgetArr = aggregateDataForView(
                data.budget || [],
                viewMode,
              );
              return (
                <KPICard
                  key={kpi.chartName}
                  title={kpi.name}
                  actualValue={chartArr.at(-1) ?? 0}
                  budgetValue={budgetArr.at(-1) ?? 0}
                  unit={currencyUnit}
                  isPercentage={kpi.dataType === "percentage"}
                  onEyeClick={() =>
                    openCalc(
                      kpi.name,
                      `Custom KPI: ${kpi.name}\n\nData Type: ${kpi.dataType}\nChart Type: ${kpi.type}`,
                    )
                  }
                  onAddNotes={(notes) =>
                    setChartNotes((p) => ({ ...p, [kpi.chartName]: notes }))
                  }
                  onAnalysis={() =>
                    setExpandedNotes((p) => ({
                      ...p,
                      [`${kpi.chartName}_analysis`]:
                        !p[`${kpi.chartName}_analysis`],
                    }))
                  }
                  onTrend={() =>
                    openTrend(
                      kpi.name,
                      kpi.chartName,
                      kpi.dataType === "percentage",
                    )
                  }
                  notes={chartNotes[kpi.chartName]}
                  formatValue={formatValue}
                />
              );
            })}
          </KpiGrid2>
        </>
      )} */}

      <UniversalAddDataModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentTab="performance-engine"
        user={user}
        onSave={() => {
          loadPnLData(onUpdateChartData);
          loadCustomKPIs();
        }}
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

export default PerformanceEngine;
