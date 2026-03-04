"use client";
import { useState } from "react";
import { Bar } from "react-chartjs-2";
import { formatPercentage } from "../financialUtils";

// ==================== EYE ICON ====================
export const EyeIcon = ({ onClick }) => (
  <button
    onClick={onClick}
    className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center rounded-full bg-[#fdfcfb] shadow-md transition-all duration-200 hover:bg-[#e8ddd4] hover:scale-110 z-10 border-0 cursor-pointer"
  >
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#5d4037"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z" />
    </svg>
  </button>
);

// ==================== TREND ICON BUTTON ====================
export const TrendButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="bg-transparent border-0 cursor-pointer p-1 rounded flex items-center justify-center mx-auto hover:bg-[#e8ddd4]"
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#5d4037"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  </button>
);

// ==================== CALCULATION MODAL ====================
export const CalculationModal = ({ isOpen, onClose, title, calculation }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[2000]">
      <div className="bg-[#fdfcfb] p-7 rounded-lg max-w-lg w-[90%] max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-mediumBrown m-0 font-semibold">
            {title} – Calculation
          </h3>
          <button
            onClick={onClose}
            className="bg-transparent border-0 text-2xl text-mediumBrown cursor-pointer leading-none"
          >
            ×
          </button>
        </div>
        <div className="bg-[#f5f0eb] p-5 rounded-md">
          <p className="text-mediumBrown text-sm leading-relaxed m-0 whitespace-pre-wrap">
            {calculation}
          </p>
        </div>
      </div>
    </div>
  );
};

// ==================== KEY QUESTION BOX ====================
export const KeyQuestionBox = ({ question, signals, decisions }) => {
  const [showMore, setShowMore] = useState(false);
  const firstSentence =
    question.match(/^[^.!?]+[.!?]/)?.[0] ?? question.split(".")[0] + ".";
  const hasMore =
    question.length > firstSentence.length || signals || decisions;

  return (
    <div className="bg-[#DCDCDC] p-4 rounded-lg mb-5 border border-mediumBrown">
      <div className="mb-2">
        <strong className="text-mediumBrown text-sm">Key Question:</strong>
        <span className="text-mediumBrown text-sm ml-2">
          {showMore ? question : firstSentence}
        </span>
        {!showMore && hasMore && (
          <button
            onClick={() => setShowMore(true)}
            className="bg-transparent border-0 text-mediumBrown font-semibold cursor-pointer ml-1 underline text-sm"
          >
            See more
          </button>
        )}
      </div>
      {showMore && (
        <>
          <div className="mb-2">
            <strong className="text-mediumBrown text-sm">Key Signals:</strong>
            <span className="text-mediumBrown text-sm ml-2">{signals}</span>
          </div>
          <div>
            <strong className="text-mediumBrown text-sm">Key Decisions:</strong>
            <span className="text-mediumBrown text-sm ml-2">{decisions}</span>
          </div>
          <button
            onClick={() => setShowMore(false)}
            className="bg-transparent border-0 text-mediumBrown font-semibold cursor-pointer mt-2 underline text-sm"
          >
            See less
          </button>
        </>
      )}
    </div>
  );
};

// ==================== VARIANCE ARROW (Lucide-style SVG) ====================
// Green ↑ = actual > budget (favourable)
// Orange ↓ = ≤20% below budget (mild miss)
// Red ↓   = >20% below budget (significant miss)
// Yellow → = no difference
const VarianceArrow = ({ diff, variancePct }) => {
  if (diff > 0) {
    return (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#16a34a"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </svg>
    );
  }
  if (diff < 0) {
    const color = Math.abs(variancePct) <= 20 ? "#ea580c" : "#dc2626";
    return (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <polyline points="19 12 12 19 5 12" />
      </svg>
    );
  }
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ca8a04"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
};

// ==================== KPI CARD (3 circles: Actual / Budget / Variance  OR  1 circle: singleCircle mode) ====================
export const KPICard = ({
  title,
  actualValue,
  budgetValue,
  unit = "zar_million",
  isPercentage = false,
  unitLabel,            // shown in heading e.g. "R k", "%", "months", "×"
  singleCircle = false, // show only actual circle (no budget / variance)
  formatCircleValue,    // optional fn(v) → string override for circle display
  onEyeClick,
  onAddNotes,
  onAnalysis,
  onTrend,
  notes,
  formatValue,
  decimals = 2,
}) => {
  const [expanded, setExpanded] = useState(false);

  // Circle formatter: use override if provided, else existing behaviour
  const fmtCircle = formatCircleValue
    || ((v) => isPercentage
      ? formatPercentage(v, decimals)
      : formatValue(v, unit, decimals));

  const actualNum = parseFloat(actualValue) || 0;
  const budgetNum = parseFloat(budgetValue) || 0;
  const diff = actualNum - budgetNum;
  const variancePct = budgetNum !== 0 ? (diff / Math.abs(budgetNum)) * 100 : 0;

  // Variance circle style (only needed in 3-circle mode)
  let varBorder = "border-yellow-400", varBg = "bg-yellow-50",
      varLabelColor = "text-yellow-700", varPctColor = "text-yellow-600";
  if (!singleCircle) {
    if (diff > 0) {
      varBorder = "border-green-500"; varBg = "bg-green-50";
      varLabelColor = "text-green-700"; varPctColor = "text-green-600";
    } else if (diff < 0 && Math.abs(variancePct) <= 20) {
      varBorder = "border-orange-400"; varBg = "bg-orange-50";
      varLabelColor = "text-orange-700"; varPctColor = "text-orange-600";
    } else if (diff < 0) {
      varBorder = "border-red-500"; varBg = "bg-red-50";
      varLabelColor = "text-red-700"; varPctColor = "text-red-600";
    }
  }

  return (
    <div className="bg-[#fdfcfb] p-5 rounded-lg shadow-md mb-5 relative">
      <EyeIcon onClick={onEyeClick} />

      {/* Title + optional unit label */}
      <div className="text-center mb-4">
        <h4 className="text-mediumBrown m-0 text-base font-semibold">
          {title}
          {unitLabel && (
            <span className="text-xs font-normal text-lightBrown ml-1.5">
              ({unitLabel})
            </span>
          )}
        </h4>
      </div>

      {/* ── Single-circle mode ───────────────────────────────────────────── */}
      {singleCircle ? (
        <div className="flex justify-center mb-4">
          <div className="flex flex-col items-center gap-1">
            <div className="w-[90px] h-[90px] rounded-full border-4 border-mediumBrown flex items-center justify-center bg-[#fdfcfb]">
              <div className="text-sm font-bold text-mediumBrown leading-tight px-2 text-center break-all">
                {fmtCircle(actualValue)}
              </div>
            </div>
            <span className="text-[10px] text-lightBrown font-medium">Current</span>
          </div>
        </div>
      ) : (
        /* ── 3-circle mode ──────────────────────────────────────────────── */
        <div className="flex justify-around items-start mb-4">
          {/* Actual */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-[78px] h-[78px] rounded-full border-4 border-mediumBrown flex items-center justify-center bg-[#fdfcfb]">
              <div className="text-xs font-bold text-mediumBrown leading-tight px-1 text-center">
                {fmtCircle(actualValue)}
              </div>
            </div>
            <span className="text-[10px] text-lightBrown font-medium">Actual</span>
          </div>

          {/* Budget */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-[78px] h-[78px] rounded-full border-4 border-gray-400 flex items-center justify-center bg-gray-50">
              <div className="text-xs font-bold text-mediumBrown leading-tight px-1 text-center">
                {fmtCircle(budgetValue)}
              </div>
            </div>
            <span className="text-[10px] text-lightBrown font-medium">Budget</span>
          </div>

          {/* Variance */}
          <div className="flex flex-col items-center gap-1">
            <div className={`w-[78px] h-[78px] rounded-full border-4 ${varBorder} ${varBg} flex flex-col items-center justify-center gap-0.5`}>
              <VarianceArrow diff={diff} variancePct={variancePct} />
              <span className={`text-[10px] font-bold ${varPctColor} leading-none`}>
                {diff === 0 ? "0%" : `${Math.abs(variancePct).toFixed(1)}%`}
              </span>
            </div>
            <span className={`text-[10px] font-medium ${varLabelColor}`}>Variance</span>
          </div>
        </div>
      )}

      <div className="border-t border-[#e8ddd4] pt-4">
        <div className="flex gap-2 justify-center flex-wrap">
          {[
            { label: "Notes", onClick: () => setExpanded((e) => !e) },
            { label: "Analysis", onClick: onAnalysis },
            { label: "Trend", onClick: onTrend },
          ].map(({ label, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="px-3 py-1.5 bg-[#e8ddd4] text-mediumBrown border-0 rounded cursor-pointer font-semibold text-xs hover:bg-[#d4c4b8]"
            >
              {label}
            </button>
          ))}
        </div>
        {expanded && (
          <div className="mt-2.5">
            <textarea
              value={notes || ""}
              onChange={(e) => onAddNotes(e.target.value)}
              placeholder="Add notes or comments..."
              className="w-full p-2 rounded border border-[#e8ddd4] min-h-[60px] text-xs resize-y"
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== TREND MODAL (bar for actual, dashed line for budget) ====================
export const TrendModal = ({
  isOpen,
  onClose,
  item,
  trendData,
  currencyUnit,
  formatValue,
  activeSection,
  loading = false,
}) => {
  if (!isOpen || !item) return null;

  const labels = trendData?.labels || [];
  const actual = trendData?.actual || [];
  const budget = trendData?.budget || null;

  // Stats: include zeros, exclude nulls
  const validActual = actual.filter(
    (v) => v !== null && v !== undefined && !isNaN(v),
  );
  const current = validActual.at(-1) ?? 0;
  const average = validActual.length
    ? validActual.reduce((a, b) => a + b, 0) / validActual.length
    : 0;
  const trendDir =
    validActual.length >= 2
      ? validActual.at(-1) > validActual.at(-2)
        ? "↗ Increasing"
        : validActual.at(-1) < validActual.at(-2)
          ? "↘ Decreasing"
          : "→ Stable"
      : "N/A";

  const fmtVal = (v) =>
    item.trendFormatValue
      ? item.trendFormatValue(v)
      : item.isPercentage
        ? `${parseFloat(v).toFixed(2)}%`
        : formatValue(v, currencyUnit);
  const hasBudget = budget?.some((v) => v !== null && parseFloat(v) !== 0);

  // Bar colours: positive = brand brown, negative = red
  const barBg = actual.map((v) =>
    v === null
      ? "transparent"
      : v >= 0
        ? "rgba(93,64,55,0.82)"
        : "rgba(220,38,38,0.72)",
  );
  const barBorder = actual.map((v) =>
    v === null ? "transparent" : v >= 0 ? "#5d4037" : "#dc2626",
  );

  const chartData = {
    labels,
    datasets: [
      activeSection === "capital-structure"
        ? {
            type: "line",
            label: `${item.name} – Actual`,
            data: actual,
            borderColor: "#5d4037",
            backgroundColor: "transparent",
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: "#5d4037",
            pointBorderColor: "#fff",
            pointBorderWidth: 1.5,
            fill: false,
            tension: 0.3,
            spanGaps: true,
            order: 1,
          }
        : {
            type: "bar",
            label: `${item.name} – Actual`,
            data: actual,
            backgroundColor: barBg,
            borderColor: barBorder,
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false,
            order: 2,
          },
      ...(hasBudget
        ? [
            {
              type: "line",
              label: `${item.name} – Budget`,
              data: budget,
              borderColor: "#f9a825",
              backgroundColor: "transparent",
              borderWidth: 2,
              borderDash: [5, 5],
              pointRadius: 4,
              pointBackgroundColor: "#f9a825",
              pointBorderColor: "#fff",
              pointBorderWidth: 1.5,
              fill: false,
              tension: 0.3,
              spanGaps: true,
              order: 1,
            },
          ]
        : []),
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "top" },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            `${ctx.dataset.label}: ${ctx.raw !== null ? fmtVal(ctx.raw) : "No data"}`,
        },
      },
      datalabels: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: item.yAxisLabel
            ?? (item.isPercentage ? "Percentage (%)" : "Value"),
          color: "#5d4037",
        },
        grid: { color: "rgba(93,64,55,0.08)" },
        ticks: {
          color: "#5d4037",
          callback: item.yTickFmt
            ?? (item.isPercentage
              ? (v) => `${parseFloat(v).toFixed(1)}%`
              : undefined),
        },
      },
      x: {
        title: { display: true, text: "Last 12 Months", color: "#5d4037" },
        ticks: { maxRotation: 45, minRotation: 30, color: "#5d4037" },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1001]">
      <div className="bg-[#fdfcfb] p-7 rounded-lg max-w-[900px] w-[95%] max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-mediumBrown m-0">
              {item.name} – Trend Analysis
            </h3>
            <p className="text-xs text-lightBrown mt-1">
              Last 12 months — {labels[0]} to {labels.at(-1)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-transparent border-0 text-2xl text-mediumBrown cursor-pointer leading-none"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-mediumBrown text-sm animate-pulse">
              Loading trend data…
            </div>
          </div>
        ) : (
          <div className="h-[400px] mb-5">
            <Bar data={chartData} options={chartOptions} />
          </div>
        )}

        <div className="bg-[#f5f0eb] p-5 rounded-md mb-5">
          <h4 className="text-mediumBrown mb-4 text-base font-semibold">
            Trend Statistics
          </h4>
          <div className="grid grid-cols-4 gap-4">
            {[
              ["Current Value", fmtVal(current)],
              ["12-Month Avg", fmtVal(average)],
              ["Trend", trendDir],
              ["Data Points", validActual.length],
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

        {hasBudget && (
          <div className="bg-[#e8ddd4] p-5 rounded-md mb-5">
            <h4 className="text-mediumBrown mb-4 text-base font-semibold">
              Budget vs Actual (Current Month)
            </h4>
            <div className="grid grid-cols-3 gap-4">
              {[
                ["Actual", fmtVal(current)],
                ["Budget", fmtVal(budget?.at(-1) ?? 0)],
                ["Variance", fmtVal((current || 0) - (budget?.at(-1) ?? 0))],
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

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-mediumBrown text-[#fdfcfb] border-0 rounded-md cursor-pointer font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== SECTION CONTROLS BAR ====================
export const SectionControlsBar = ({
  title,
  viewMode,
  setViewMode,
  onAddData,
  showAddData = true,
  extraControls,
  showViewMode = true,
}) => (
  <div className="flex justify-between items-center mb-5 flex-wrap gap-4">
    {title && <h2 className="text-mediumBrown text-2xl font-bold">{title}</h2>}
    <div className="flex gap-2.5 items-center flex-wrap">
      {extraControls}
      {showViewMode && (
        <div className="flex gap-2.5 items-center">
          {["month", "quarter", "year"].map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-4 py-2 border-0 rounded cursor-pointer font-medium text-sm capitalize ${viewMode === m ? "bg-mediumBrown text-[#fdfcfb]" : "bg-[#e8ddd4] text-mediumBrown hover:bg-[#d4c4b8]"}`}
            >
              {m === "month"
                ? "Monthly"
                : m === "quarter"
                  ? "Quarterly"
                  : "Yearly"}
            </button>
          ))}
        </div>
      )}
      {showAddData && onAddData && (
        <button
          onClick={onAddData}
          className="px-4 py-2 bg-mediumBrown text-[#fdfcfb] border-0 rounded cursor-pointer font-semibold text-sm hover:bg-[#4a3027]"
        >
          Add Data
        </button>
      )}
    </div>
  </div>
);

// ==================== YEAR / MONTH SELECTORS ====================
export const YearMonthSelector = ({
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  years,
  months,
}) => (
  <div className="flex gap-5 flex-wrap items-center">
    <div className="flex gap-1.5 items-center">
      <span className="text-mediumBrown text-sm">Year:</span>
      <select
        value={selectedYear}
        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
        className="px-3 py-2 rounded border border-[#e8ddd4] text-sm text-mediumBrown min-w-[100px]"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
    <div className="flex gap-1.5 items-center">
      <span className="text-mediumBrown text-sm">Month:</span>
      <select
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        className="px-3 py-2 rounded border border-[#e8ddd4] text-sm text-mediumBrown min-w-[100px]"
      >
        {months.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  </div>
);

// ==================== DATE RANGE PICKER ====================
export const DateRangePicker = ({
  filterMode, setFilterMode,
  fromDate, setFromDate,
  toDate, setToDate,
}) => {
  const isRange = filterMode === "range";

  const inputCls = (active) =>
    `px-3 py-1.5 rounded border text-sm min-w-[130px] transition-opacity duration-150 ${
      active
        ? "border-mediumBrown text-mediumBrown bg-white opacity-100 cursor-pointer"
        : "border-[#e8ddd4] text-[#b0a098] bg-[#f5f1ee] opacity-50 cursor-not-allowed pointer-events-none"
    }`;

  const labelCls = (active) =>
    `text-sm font-medium transition-opacity duration-150 ${
      active ? "text-mediumBrown" : "text-[#b0a098] opacity-50"
    }`;

  const radioCls = "hidden accent-[#6b4c3b] w-3.5 h-3.5 cursor-pointer";

  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 items-center p-3 rounded-lg border border-[#e8ddd4] bg-[#faf7f5]">
      {/* ── From–To Range ── */}
      <div className="flex items-center gap-2">
        <input
          type="radio"
          id="filter-range"
          name="filterMode"
          value="range"
          checked={isRange}
          onChange={() => setFilterMode("range")}
          className={radioCls}
        />
        <label
          htmlFor="filter-range"
          className={`${labelCls(isRange)} cursor-pointer`}
        >
          From: 
        </label>
        <div
          className={`flex items-center gap-1.5 ${
            isRange ? "" : "pointer-events-none"
          }`}
        >
          <input
            type="month"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              if (e.target.value > toDate) setToDate(e.target.value);
            }}
            className={inputCls(isRange)}
            disabled={!isRange}
          />
          <span className={labelCls(isRange)}>To: </span>
          <input
            type="month"
            value={toDate}
            min={fromDate}
            onChange={(e) => setToDate(e.target.value)}
            className={inputCls(isRange)}
            disabled={!isRange}
          />
        </div>
      </div>
    </div>
  );
};


// ==================== KPI GRID WRAPPERS ====================
export const KpiGrid3 = ({ children }) => (
  <div className="grid grid-cols-3 gap-5 mb-7">{children}</div>
);
export const KpiGrid2 = ({ children }) => (
  <div className="grid grid-cols-2 gap-5 mb-7">{children}</div>
);

// ==================== SECTION HEADING ====================
export const SectionHeading = ({ children }) => (
  <h3 className="text-mediumBrown text-xl font-semibold mb-4 pb-2.5 border-b-2 border-[#e8ddd4]">
    {children}
  </h3>
);

const LightBone = ({ className = "" }) => (
  <div
    className={`rounded-md bg-shimmer-light bg-shimmer animate-shimmer ${className}`}
  />
);

const MidBone = ({ className = "" }) => (
  <div
    className={`rounded-md bg-shimmer-mid bg-shimmer animate-shimmer ${className}`}
  />
);

const DarkBone = ({ className = "" }) => (
  <div
    className={`rounded-md bg-shimmer-dark bg-shimmer animate-shimmer ${className}`}
  />
);

// Stagger helper — picks a delay variant class by index
const delayClass = (i) =>
  ["animate-shimmer", "animate-shimmer-d1", "animate-shimmer-d2",
   "animate-shimmer-d3", "animate-shimmer-d4", "animate-shimmer-d5"][i % 6];

export default function SkeletonLoader() {
  // Monthly data points (Mar 2025 - Feb 2026)
  const months = [
    "Mar", "Apr", "May", "Jun", "Jul", "Aug", 
    "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"
  ];
  
  // Approximate values from the image: 
  // 0.26, 0.29, 0.30, 0.31, 0.34, 0.35, 0.10, 0.12, 0.14, 0.16, 0.19, 0.21
  const chartValues = [26, 29, 30, 31, 34, 35, 10, 12, 14, 16, 19, 21];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-backgroundBrown font-serif">

      {/* ── SIDEBAR ── */}
      <aside className="flex flex-col items-center py-5 px-3 gap-5 w-16 shrink-0 bg-sidebar-gradient shadow-2xl z-10">
        {/* Logo mark */}
        <div className={`w-10 h-10 rounded-xl bg-shimmer-dark bg-shimmer ${delayClass(0)} mb-2`} />

        {/* Nav icons */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`w-10 h-10 rounded-xl bg-shimmer-dark bg-shimmer ${delayClass(i)}`}
          />
        ))}

        <div className="flex-1" />

        {/* Bottom utility icons */}
        <div className={`w-10 h-10 rounded-xl bg-shimmer-dark bg-shimmer ${delayClass(1)}`} />
        <div className={`w-10 h-10 rounded-xl bg-shimmer-dark bg-shimmer ${delayClass(2)}`} />
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* ── HEADER ── */}
        <header className="flex items-center justify-between px-8 py-4 shrink-0 bg-white border-b border-lightTan shadow-sm">
          {/* Logo text */}
          <LightBone className="w-28 h-9" />

          {/* Welcome block */}
          <div className="flex flex-col items-center gap-2">
            <LightBone className="w-56 h-[18px]" />
            <LightBone className="w-40 h-3.5" />
          </div>

          {/* Avatar + bell */}
          <div className="flex items-center gap-4">
            <LightBone className="w-9 h-9 rounded-full" />
            <LightBone className="w-9 h-9 rounded-full" />
          </div>
        </header>

        {/* ── CONTENT ── */}
        <div className="flex-1 overflow-auto p-6 flex flex-col gap-5">

          {/* Page title + date-filter button */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <LightBone className="w-48 h-7" />
              <LightBone className="w-60 h-3.5" />
            </div>
            <LightBone className="w-32 h-9 rounded-lg" />
          </div>

          {/* ── CHART CARD ── */}
          <div className="rounded-xl bg-white border border-paleBrown shadow-sm p-6">
            {/* Chart Header with Legend */}
            <div className="flex items-center justify-between mb-6">
              <LightBone className="w-40 h-5" />
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <DarkBone className="w-3 h-3 rounded-full" />
                  <LightBone className="w-20 h-4" />
                </div>
                <div className="flex items-center gap-2">
                  <MidBone className="w-3 h-3 rounded-full" />
                  <LightBone className="w-20 h-4" />
                </div>
              </div>
            </div>

            {/* Y-axis labels */}
            <div className="flex ml-8 mb-2">
              <div className="flex flex-col justify-between h-40 mr-3">
                <LightBone className="w-8 h-3" />
                <LightBone className="w-8 h-3" />
                <LightBone className="w-8 h-3" />
              </div>
            </div>

            {/* Chart Area - Dual Line/Bar Chart Representation */}
            <div className="relative">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="border-b border-dashed border-paleBrown/30 w-full h-0" />
                ))}
              </div>

              {/* Bars/Columns for each month */}
              <div className="flex items-end justify-around gap-1 h-40 ml-12 relative z-10">
                {chartValues.map((value, i) => (
                  <div key={i} className="flex flex-col items-center w-8">
                    {/* Bar */}
                    <div 
                      className={`w-6 bg-shimmer-mid bg-shimmer rounded-t-sm ${delayClass(i)}`}
                      style={{ height: `${value * 1.2}px` }}
                    />
                    {/* Data point marker (for line chart overlay) */}
                    <div className={`w-2 h-2 rounded-full bg-shimmer-dark bg-shimmer -mt-1 ${delayClass(i + 10)}`} />
                  </div>
                ))}
              </div>

              {/* Connection line (simulated with dots) */}
              <div className="flex justify-around gap-1 ml-12 mt-1">
                {chartValues.map((_, i) => (
                  <div key={i} className="w-8 flex justify-center">
                    <div className={`w-0.5 h-4 bg-shimmer-light/50 ${delayClass(i + 5)}`} />
                  </div>
                ))}
              </div>

              {/* X-axis labels (months) */}
              <div className="flex justify-around gap-1 ml-12 mt-4">
                {months.map((_, i) => (
                  <LightBone key={i} className={`w-8 h-3 ${delayClass(i + 8)}`} />
                ))}
              </div>
            </div>

            {/* Chart Footer with Stats */}
            <div className="flex justify-between mt-8 pt-4 border-t border-paleBrown/30">
              <div className="flex gap-6">
                <div>
                  <LightBone className="w-16 h-3 mb-1" />
                  <MidBone className="w-12 h-4" />
                </div>
                <div>
                  <LightBone className="w-16 h-3 mb-1" />
                  <MidBone className="w-12 h-4" />
                </div>
              </div>
              <LightBone className="w-24 h-8 rounded-lg" />
            </div>
          </div>

          {/* ── SECONDARY CHARTS / METRICS ── */}
          <div className="grid grid-cols-3 gap-4">
            {/* Mini trend card 1 */}
            <div className="rounded-xl bg-white border border-paleBrown p-4">
              <LightBone className="w-24 h-4 mb-3" />
              <div className="flex items-end gap-1 h-16">
                {[40, 55, 45, 60, 50, 65].map((h, i) => (
                  <div key={i} className="flex-1">
                    <div 
                      className={`w-full bg-shimmer-light bg-shimmer rounded-t-sm ${delayClass(i + 12)}`}
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Mini trend card 2 */}
            <div className="rounded-xl bg-white border border-paleBrown p-4">
              <LightBone className="w-24 h-4 mb-3" />
              <div className="flex items-end gap-1 h-16">
                {[35, 45, 55, 40, 50, 45].map((h, i) => (
                  <div key={i} className="flex-1">
                    <div 
                      className={`w-full bg-shimmer-mid bg-shimmer rounded-t-sm ${delayClass(i + 15)}`}
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Summary card */}
            <div className="rounded-xl bg-white border border-paleBrown p-4">
              <LightBone className="w-24 h-4 mb-3" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <LightBone className="w-16 h-3" />
                  <LightBone className="w-12 h-3" />
                </div>
                <div className="flex justify-between">
                  <LightBone className="w-16 h-3" />
                  <LightBone className="w-12 h-3" />
                </div>
                <div className="flex justify-between">
                  <LightBone className="w-16 h-3" />
                  <LightBone className="w-12 h-3" />
                </div>
              </div>
            </div>
          </div>

          {/* Data table alternative (compact) */}
          <div className="rounded-xl bg-white border border-paleBrown p-4">
            <LightBone className="w-32 h-4 mb-3" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <LightBone className={`w-16 h-3 ${delayClass(i + 18)}`} />
                  <MidBone className={`w-10 h-3 ${delayClass(i + 20)}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}