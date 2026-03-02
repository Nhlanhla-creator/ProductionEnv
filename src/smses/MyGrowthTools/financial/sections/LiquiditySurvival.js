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
  YearMonthSelector,
  DateRangePicker,
} from "../components/SharedComponents";
import UniversalAddDataModal from "../components/UniversalAddDataModal";
import { useLiquidityData } from "../../../hooks/useFinancialData";
import {
  CALCULATION_TEXTS,
  getYearsRange,
} from "../financialConstants";
import {
  aggregateDataForView,
  makeFormatValue,
  getLast12MonthsLabels,
  getLast12MonthsComputed,
  computeLiquidityChartData,
  formatSmartNumber,
  getSmartUnit,
} from "../financialUtils";

// Default From-To: last 12 months
const _now = new Date()
const _defaultTo   = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, "0")}`
const _defaultFrom = (() => { const d = new Date(_now.getFullYear(), _now.getMonth() - 11, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` })()

const LiquiditySurvival = ({ activeSection, user, isInvestorView, financialYearStart }) => {
  const [showModal, setShowModal]   = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  // Date filter state — default to Year
  const [filterMode, setFilterMode] = useState("year")
  const [fromDate, setFromDate]     = useState(_defaultFrom)
  const [toDate, setToDate]         = useState(_defaultTo)
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
    loans,
    loading,
    loadLiquidityData,
    loadLoans,
  } = useLiquidityData(user);

  const formatValue = makeFormatValue(currencyUnit);
  const years = getYearsRange(2021, 2030);

  useEffect(() => {
    if (user) {
      loadLiquidityData();
      loadLoans();
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
        docBase: "_liquiditySurvival",
        chartKey: dataKey,
        financialYearStart,
        getDocFn: getDoc,
        docFn: doc,
        db,
        processor: computeLiquidityChartData,
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

  // Per-KPI display config: unitLabel + circle formatter
  // Currency KPIs (null unitLabel) get smart units derived from their live value
  const KPI_TYPE = {
    currentRatio:   { unitLabel: '×',      fmt: (v) => parseFloat(v).toFixed(2) },
    quickRatio:     { unitLabel: '×',      fmt: (v) => parseFloat(v).toFixed(2) },
    cashRatio:      { unitLabel: '×',      fmt: (v) => parseFloat(v).toFixed(2) },
    cashCover:      { unitLabel: 'months', fmt: (v) => parseFloat(v).toFixed(1) },
    monthsRunway:   { unitLabel: 'months', fmt: (v) => parseFloat(v).toFixed(1) },
    // monetary — smart unit resolved at render time from live value
    burnRate:       { unitLabel: null, fmt: null },
    cashflow:       { unitLabel: null, fmt: null },
    cashBalance:    { unitLabel: null, fmt: null },
    workingCapital: { unitLabel: null, fmt: null },
  };

  const renderKPI = (title, dataKey, isPercentage = false) => {
    const type    = KPI_TYPE[dataKey] || {};
    const data    = firebaseChartData[dataKey] || { actual: [] };
    // Most-recent value — no view-mode aggregation for this section
    const current = data.actual?.at(-1) ?? 0;
    const calc    = CALCULATION_TEXTS.liquidity?.[dataKey] || "";

    const isCurrency   = !type.unitLabel && !isPercentage;
    const unitLabel    = type.unitLabel ?? (isPercentage ? '%' : getSmartUnit(current));
    const formatCircle = type.fmt      ?? (isCurrency ? (v) => formatSmartNumber(v) : (v) => parseFloat(v).toFixed(2));

    return (
      <KPICard
        key={dataKey}
        title={title}
        actualValue={current}
        budgetValue={0}
        unit={currencyUnit}
        isPercentage={isPercentage}
        unitLabel={unitLabel}
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
        onTrend={() => openTrend(title, dataKey, isPercentage)}
        notes={chartNotes[dataKey]}
        formatValue={formatValue}
      />
    );
  };

  if (activeSection !== "liquidity-survival") return null;

  const fv = (v) => formatValue(v, currencyUnit);

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
        years={years}
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
        {renderKPI("Current Ratio", "currentRatio")}
        {/* {renderKPI("Quick Ratio", "quickRatio")}
        {renderKPI("Cash Ratio", "cashRatio")} */}
      {/* </KpiGrid3>

      <KpiGrid3> */}
        {renderKPI("Burn Rate", "burnRate")}
        {renderKPI("Cash Cover", "cashCover")}
        {renderKPI("Free Cashflow", "cashflow")}
        {/* {renderKPI("Cash Balance", "cashBalance")} */}
        {renderKPI("Months Runway", "monthsRunway")}
        {renderKPI("Working Capital", "workingCapital")}
      </KpiGrid3>

      {/* Loan Repayments Schedule */}
      <div className="mt-7">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-mediumBrown text-xl font-semibold">
            Loan Repayments Schedule
          </h3>
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
                  {[
                    "Loan Name",
                    "Amount",
                    "Interest Rate",
                    "Start Date",
                    "Term",
                    "Monthly Payment",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left p-3 text-mediumBrown font-semibold text-sm"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loans.map((loan, i) => (
                  <tr
                    key={loan.id || i}
                    className={`border-b border-[#e8ddd4] ${i % 2 === 0 ? "bg-[#f9f5f2]" : ""}`}
                  >
                    <td className="p-3 text-mediumBrown text-sm">
                      {loan.name}
                    </td>
                    <td className="p-3 text-mediumBrown text-sm">
                      {fv(loan.amount / 1_000_000)}
                    </td>
                    <td className="p-3 text-mediumBrown text-sm">
                      {loan.interestRate}%
                    </td>
                    <td className="p-3 text-mediumBrown text-sm">
                      {loan.startDate}
                    </td>
                    <td className="p-3 text-mediumBrown text-sm">
                      {loan.term} months
                    </td>
                    <td className="p-3 text-mediumBrown text-sm">
                      {fv(loan.monthlyPayment / 1_000_000)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          loan.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
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
                [
                  "Total Outstanding",
                  fv(loans.reduce((s, l) => s + l.amount, 0) / 1_000_000),
                ],
                [
                  "Monthly Payments",
                  fv(
                    loans.reduce((s, l) => s + l.monthlyPayment, 0) / 1_000_000,
                  ),
                ],
              ].map(([label, val]) => (
                <div key={label}>
                  <div className="text-xs text-lightBrown mb-1">{label}</div>
                  <div className="text-base font-semibold text-mediumBrown">
                    {val}
                  </div>
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
        onSave={() => {
          loadLiquidityData();
          loadLoans();
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

export default LiquiditySurvival;