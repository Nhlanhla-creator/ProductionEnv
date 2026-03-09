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
  DateRangePicker,
} from "../components/SharedComponents";
import UniversalAddDataModal from "../components/UniversalAddDataModal";
import { useLiquidityData } from "../../../hooks/useFinancialData";
import { CALCULATION_TEXTS, getYearsRange } from "../data_utils/financialConstants";
import {
  makeFormatValue,
  getRangeLabels,
  getRangeComputed,
  computeLiquidityChartData,
  formatSmartNumber,
  getSmartUnit,
  formatCurrency,
} from "../data_utils/financialUtils";

const _now        = new Date();
const _defaultTo  = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, "0")}`;
const _defaultFrom = (() => {
  const d = new Date(_now.getFullYear(), _now.getMonth() - 11, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
})();

const LiquiditySurvival = ({ activeSection, user, isInvestorView }) => {
  const [showModal, setShowModal]               = useState(false);
  const [selectedYear, setSelectedYear]         = useState(_now.getFullYear());
  const [filterMode, setFilterMode]             = useState("range");
  const [fromDate, setFromDate]                 = useState(_defaultFrom);
  const [toDate, setToDate]                     = useState(_defaultTo);
  const [expandedNotes, setExpandedNotes]       = useState({});
  const [showTrendModal, setShowTrendModal]     = useState(false);
  const [selectedTrendItem, setSelectedTrendItem] = useState(null);
  const [trendData, setTrendData]               = useState(null);
  const [trendLoading, setTrendLoading]         = useState(false);
  const [showCalcModal, setShowCalcModal]       = useState(false);
  const [selectedCalc, setSelectedCalc]         = useState({ title: "", calculation: "" });
  const [currencyUnit]                          = useState("zar_million");

  const {
    firebaseChartData,
    chartNotes,
    setChartNotes,
    loans,
    loading,
    firstDataMonth,
    loadLiquidityData,
    loadLoans,
  } = useLiquidityData(user);

  const formatValue = makeFormatValue(currencyUnit);
  const years = getYearsRange(2021, 2030);

  // Reload when user or range changes
  useEffect(() => {
    if (user) {
      loadLiquidityData(fromDate, toDate);
      loadLoans();
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
        docBase: "_liquiditySurvival",
        chartKey: dataKey,
        fromYM: fromDate,
        toYM: toDate,
        getDocFn: getDoc,
        docFn: doc,
        db,
        processor: computeLiquidityChartData,
      });

      const RATIO_KEYS   = new Set(["currentRatio", "quickRatio", "cashRatio"]);
      const MONTH_KEYS   = new Set(["cashCover", "monthsRunway"]);

      let trendFormatValue, yAxisLabel, yTickFmt;
      if (isPercentage) {
        trendFormatValue = (v) => `${parseFloat(v).toFixed(2)}%`;
        yAxisLabel       = "Percentage (%)";
        yTickFmt         = (v) => `${parseFloat(v).toFixed(1)}%`;
      } else if (RATIO_KEYS.has(dataKey)) {
        trendFormatValue = (v) => `${parseFloat(v).toFixed(2)}×`;
        yAxisLabel       = "Ratio (×)";
        yTickFmt         = (v) => parseFloat(v).toFixed(2);
      } else if (MONTH_KEYS.has(dataKey)) {
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

  const KPI_TYPE = {
    currentRatio:   { unitLabel: "×",      fmt: (v) => parseFloat(v).toFixed(2) },
    quickRatio:     { unitLabel: "×",      fmt: (v) => parseFloat(v).toFixed(2) },
    cashRatio:      { unitLabel: "×",      fmt: (v) => parseFloat(v).toFixed(2) },
    cashCover:      { unitLabel: "months", fmt: (v) => parseFloat(v).toFixed(1) },
    monthsRunway:   { unitLabel: "months", fmt: (v) => parseFloat(v).toFixed(1) },
    burnRate:       { unitLabel: null, fmt: null },
    cashflow:       { unitLabel: null, fmt: null },
    cashBalance:    { unitLabel: null, fmt: null },
    workingCapital: { unitLabel: null, fmt: null },
  };

  const renderKPI = (title, dataKey, isPercentage = false) => {
    const type    = KPI_TYPE[dataKey] || {};
    const data    = firebaseChartData[dataKey] || { actual: [] };
    const current = data.actual?.at(-1) ?? 0;
    const calc    = CALCULATION_TEXTS.liquidity?.[dataKey] || "";

    const isCurrency    = !type.unitLabel && !isPercentage;
    const unitLabel     = type.unitLabel ?? (isPercentage ? "%" : getSmartUnit(current));
    const formatCircle  = type.fmt ?? (isCurrency ? (v) => formatSmartNumber(v) : (v) => parseFloat(v).toFixed(2));

    return (
      <KPICard
        key={dataKey}
        title={title}
        actualValue={current}
        budgetValue={0}
        unit={currencyUnit}
        isPercentage={isPercentage}
        unitLabel={unitLabel}
        singleCircle
        formatCircleValue={formatCircle}
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

  if (activeSection !== "liquidity-survival") return null;

  // Loan table uses raw ZAR values — format as actual amounts e.g. R420,000.00
  const fvRaw = (v) => {
    const num = parseFloat(v) || 0;
    return `R${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

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
        years={years}
        minDate={firstDataMonth ?? "2023-01"}
        maxDate={_defaultTo}
      />
    </div>
  );

  return (
    <div className="pt-5">
      <KeyQuestionBox
        question="Will the business survive a shock? Do we have enough liquidity to weather a downturn?"
        signals="Cash runway, burn rate, current ratio"
        decisions="Cut burn rate, raise capital, slow growth, optimize working capital"
      />

      <SectionControlsBar
        title="Liquidity & Survival"
        onAddData={!isInvestorView ? () => setShowModal(true) : null}
        showAddData={!isInvestorView}
        showViewMode={false}
        extraControls={extraControls}
      />

      <KpiGrid3>
        {renderKPI("Current Ratio",   "currentRatio")}
        {renderKPI("Burn Rate",       "burnRate")}
        {renderKPI("Cash Cover",      "cashCover")}
        {renderKPI("Free Cashflow",   "cashflow")}
        {renderKPI("Months Runway",   "monthsRunway")}
        {renderKPI("Working Capital", "workingCapital")}
      </KpiGrid3>

      {/* Loan Repayments Schedule */}
      <div className="mt-7">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-mediumBrown text-xl font-semibold">Loan Repayments Schedule</h3>
          {!isInvestorView && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-mediumBrown text-[#fdfcfb] border-0 rounded cursor-pointer font-semibold text-sm hover:bg-[#4a3027]"
            >
              + Add Loan
            </button>
          )}
        </div>

        {loans.length === 0 ? (
          <div className="bg-[#fdfcfb] p-10 rounded-lg text-center border-2 border-dashed border-[#e8ddd4]">
            <p className="text-lightBrown">No loans added yet.</p>
          </div>
        ) : (
          <div className="bg-[#fdfcfb] p-5 rounded-lg shadow-md overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-[#e8ddd4]">
                  {["Loan Name","Amount","Interest Rate","Start Date","Term","Monthly Payment","Status"].map((h) => (
                    <th key={h} className="text-left p-3 text-mediumBrown font-semibold text-sm">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loans.map((loan, i) => (
                  <tr key={loan.id || i} className={`border-b border-[#e8ddd4] ${i % 2 === 0 ? "bg-[#f9f5f2]" : ""}`}>
                    <td className="p-3 text-mediumBrown text-sm">{loan.name}</td>
                    <td className="p-3 text-mediumBrown text-sm">{fvRaw(loan.amount)}</td>
                    <td className="p-3 text-mediumBrown text-sm">{loan.interestRate}%</td>
                    <td className="p-3 text-mediumBrown text-sm">{loan.startDate}</td>
                    <td className="p-3 text-mediumBrown text-sm">{loan.term} months</td>
                    <td className="p-3 text-mediumBrown text-sm">{fvRaw(loan.monthlyPayment)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        loan.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {loan.status === "active" ? "Active" : "Paid Off"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-5 p-4 bg-[#f5f0eb] rounded-md grid grid-cols-3 gap-4">
              {[
                ["Total Loans", loans.length],
                ["Total Outstanding",  fvRaw(loans.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0))],
                ["Monthly Payments",   fvRaw(loans.reduce((s, l) => s + (parseFloat(l.monthlyPayment) || 0), 0))],
              ].map(([label, val]) => (
                <div key={label}>
                  <div className="text-xs text-lightBrown mb-1">{label}</div>
                  <div className="text-base font-semibold text-mediumBrown">{val}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <UniversalAddDataModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentTab="liquidity-survival"
        user={user}
        onSave={() => { loadLiquidityData(fromDate, toDate); loadLoans(); }}
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

export default LiquiditySurvival;