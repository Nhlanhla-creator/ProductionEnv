"use client";

import { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import {
  TrendingUp, DollarSign, Users, Clock,
  Rocket, Target, Award, Activity
} from "lucide-react";
import { Bar, Doughnut } from "react-chartjs-2";

Chart.register(...registerables);

const parseAmt = (s) => {
  if (!s) return 0;
  var n = parseFloat(s.toString().replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
};

function isEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

function useDeepCompareMemo(value) {
  var ref = useRef();
  if (!isEqual(value, ref.current)) ref.current = value;
  return ref.current;
}

var BP = {
  darkest: "#3b2409", dark: "#5e3f26", medium: "#7d5a36",
  warm: "#9c7c54", light: "#b8a082", pale: "#d4c4b0", offwhite: "#f0e8de",
};
var BCOLORS = ["#3b2409","#5e3f26","#7d5a36","#9c7c54","#b8a082","#c2a882","#d4c4b0","#a08060"];
var PORTFOLIO_LINE_COLOR = "#c17d3c";
var CS_CARD_H = "460px";
var CS_CHART_H = "260px";

var csHistogramOpts = function(yCb, xTitle) {
  return {
    responsive: true, maintainAspectRatio: false, animation: false,
    plugins: {
      legend: { display: false },
      datalabels: { display: false },
    },
    scales: {
      x: {
        title: { display: true, text: xTitle, color: BP.dark },
        grid: { display: false },
        ticks: { color: BP.dark, font: { size: 10 } },
      },
      y: {
        title: { display: true, text: "Number of SMEs", color: BP.dark },
        beginAtZero: true,
        grid: { color: BP.offwhite },
        ticks: { color: BP.dark, callback: yCb || function(v) { return v; }, stepSize: 1 },
      },
    },
  };
};

var csHBarOpts = function(integralOnly) {
  return {
    responsive: true, maintainAspectRatio: false, animation: false,
    indexAxis: "y",
    plugins: { legend: { display: false }, datalabels: { display: false } },
    scales: {
      x: {
        beginAtZero: true,
        grid: { display: true, color: BP.offwhite },
        ticks: {
          color: BP.dark, font: { size: 10 },
          callback: integralOnly ? function(v) { return Number.isInteger(v) ? v : ""; } : undefined,
        },
      },
      y: { grid: { display: false }, ticks: { color: BP.dark, font: { size: 11 } } },
    },
  };
};

var csDoughnutOpts = {
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: {
    legend: { position: "bottom", labels: { color: BP.dark, font: { size: 11 }, boxWidth: 12 } },
    datalabels: { color: BP.offwhite },
  },
};

var CsCard = function(props) {
  var title = props.title;
  var footer = props.footer;
  var children = props.children;
  return (
    <div style={{
      background: "#fff", borderRadius: "10px", padding: "20px",
      height: CS_CARD_H,
      boxShadow: "0 2px 10px rgba(59,36,9,0.07)", border: "1px solid " + BP.pale,
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ paddingBottom: "10px", borderBottom: "1px solid " + BP.offwhite, marginBottom: "8px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "700", color: BP.dark, margin: 0 }}>{title}</h3>
      </div>
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
      {footer && (
        <div style={{ marginTop: "8px", padding: "7px 10px", background: BP.offwhite, borderRadius: "6px", flexShrink: 0 }}>
          {footer}
        </div>
      )}
    </div>
  );
};

var CsPill = function(props) {
  return (
    <button
      onClick={props.onClick}
      style={{
        padding: "5px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "11px",
        border: "1.5px solid " + (props.active ? BP.medium : BP.pale),
        fontWeight: props.active ? 700 : 500,
        background: props.active ? BP.medium : "#fff",
        color: props.active ? "#fff" : BP.medium,
      }}
    >
      {props.label}
    </button>
  );
};

var CsEmpty = function() {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: BP.light, fontSize: "12px", fontStyle: "italic" }}>
      No data yet
    </div>
  );
};

var CsScoreRangeView = function(props) {
  var min = props.min;
  var pipelineAvg = props.pipelineAvg;
  var max = props.max;
  var target = props.target;
  var ecoSystemAvg = props.ecoSystemAvg;
  var suffix = props.suffix || "%";

  if (!min && !pipelineAvg && !max) return <CsEmpty />;

  var clamp = function(v) { return Math.min(Math.max(v || 0, 0), 100); };
  var mn = clamp(min);
  var pa = clamp(pipelineAvg);
  var mx = clamp(max);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
      <div style={{ fontSize: "64px", fontWeight: "800", color: BP.darkest, lineHeight: 1, marginTop: "-4px" }}>
        {ecoSystemAvg}<span style={{ fontSize: "32px" }}>{suffix}</span>
      </div>
      <div style={{ fontSize: "14px", color: BP.medium, fontWeight: 600 }}>Target: {target}{suffix}</div>
      <div style={{ width: "100%", marginTop: "4px" }}>
        <div style={{ position: "relative", width: "100%", height: "12px", background: BP.pale, borderRadius: "6px", overflow: "visible" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: mx + "%", height: "100%", background: BP.light, borderRadius: "6px" }} />
          <div style={{ position: "absolute", left: 0, top: 0, width: pa + "%", height: "100%", background: BP.medium, borderRadius: "6px" }} />
          <div style={{ position: "absolute", left: 0, top: 0, width: mn + "%", height: "100%", background: BP.dark, borderRadius: "6px" }} />
        </div>
        <div style={{ display: "flex", gap: "16px", marginTop: "12px", flexWrap: "wrap" }}>
          {[
            { label: "Min", val: mn, color: BP.dark },
            { label: "Ecosystem Avg", val: pa, color: BP.medium },
            { label: "Max", val: mx, color: BP.light },
          ].map(function(item) {
            return (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "6px", background: item.color }} />
                <div style={{ fontSize: "11px", color: item.color }}>{item.label}: {item.val}{suffix}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

var buildHistogramData = function(ecosystemDist, portfolioDist) {
  return {
    labels: Object.keys(ecosystemDist),
    datasets: [
      {
        type: "bar", label: "Ecosystem",
        data: Object.values(ecosystemDist),
        backgroundColor: BCOLORS.slice(0, Object.keys(ecosystemDist).length),
        order: 2,
      },
      {
        type: "line", label: "My Cohort",
        data: Object.keys(ecosystemDist).map(function(k) { return (portfolioDist && portfolioDist[k]) || 0; }),
        borderColor: PORTFOLIO_LINE_COLOR,
        backgroundColor: "transparent",
        tension: 0.4,
        pointBackgroundColor: PORTFOLIO_LINE_COLOR,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        order: 1,
      },
    ],
  };
};

var CsAverageMatchStrength = function(props) {
  var metrics = props.metrics;
  var portfolioMetrics = props.portfolioMetrics;
  var viewState = useState("range");
  var view = viewState[0];
  var setView = viewState[1];
  var m = (metrics && metrics.match) || {};
  var ecosystemDist = (metrics && metrics.match && metrics.match.dist) || {};
  var portfolioDist = (portfolioMetrics && portfolioMetrics.match && portfolioMetrics.match.dist) || {};
  var hasData = m.min > 0 || m.avg > 0;
  return (
    <CsCard title="Average Match Strength (%)">
      <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexShrink: 0 }}>
        <CsPill label="Range" active={view === "range"} onClick={function() { setView("range"); }} />
        <CsPill label="Histogram" active={view === "histogram"} onClick={function() { setView("histogram"); }} />
      </div>
      {hasData ? (
        view === "range"
          ? <CsScoreRangeView min={m.min} pipelineAvg={m.avg} max={m.max} target={75} ecoSystemAvg={m.avg} />
          : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ height: CS_CHART_H }}>
                <Bar options={csHistogramOpts(function(v) { return v; }, "Average Match Strength (%)")} data={buildHistogramData(ecosystemDist, portfolioDist)} />
              </div>
            </div>
          )
      ) : <CsEmpty />}
    </CsCard>
  );
};

var CsAverageBIGScore = function(props) {
  var metrics = props.metrics;
  var portfolioMetrics = props.portfolioMetrics;
  var viewState = useState("range");
  var view = viewState[0];
  var setView = viewState[1];
  var b = (metrics && metrics.bigScore) || {};
  var ecosystemDist = (metrics && metrics.bigScore && metrics.bigScore.dist) || {};
  var portfolioDist = (portfolioMetrics && portfolioMetrics.bigScore && portfolioMetrics.bigScore.dist) || {};
  var hasData = b.min > 0 || b.avg > 0;
  return (
    <CsCard title="Average BIG Score (%)">
      <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexShrink: 0 }}>
        <CsPill label="Range" active={view === "range"} onClick={function() { setView("range"); }} />
        <CsPill label="Histogram" active={view === "histogram"} onClick={function() { setView("histogram"); }} />
      </div>
      {hasData ? (
        view === "range"
          ? <CsScoreRangeView min={b.min} pipelineAvg={b.avg} max={b.max} target={70} ecoSystemAvg={b.avg} />
          : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ height: CS_CHART_H }}>
                <Bar options={csHistogramOpts(function(v) { return v; }, "Average BIG Score (%)")} data={buildHistogramData(ecosystemDist, portfolioDist)} />
              </div>
            </div>
          )
      ) : <CsEmpty />}
    </CsCard>
  );
};

var CsFundingReadinessRate = function(props) {
  var metrics = props.metrics;
  var rate = (metrics && metrics.fundingReadinessRate) || 0;
  var total = (metrics && metrics.totalSMEs) || 0;
  var ready = Math.round((rate / 100) * total);
  return (
    <CsCard title="Funding Readiness Rate (%)">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", marginTop: "-8px" }}>
        <div style={{ fontSize: "64px", fontWeight: "800", color: BP.darkest, lineHeight: 1 }}>
          {rate}<span style={{ fontSize: "32px" }}>%</span>
        </div>
        <div style={{ fontSize: "14px", color: BP.medium, fontWeight: 600 }}>{ready} of {total} SMEs funding-ready</div>
        <div style={{ width: "100%", marginTop: "4px" }}>
          <div style={{ width: "100%", background: BP.pale, borderRadius: "6px", height: "12px", overflow: "hidden" }}>
            <div style={{ width: rate + "%", background: BP.medium, height: "100%", borderRadius: "6px" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: "4px" }}>
            <span style={{ fontSize: "14px", color: BP.warm }}>Current: {rate}%</span>
            <span style={{ fontSize: "14px", color: BP.warm }}>Target: 70%</span>
          </div>
        </div>
      </div>
    </CsCard>
  );
};

var CsAverageVettingTime = function(props) {
  var metrics = props.metrics;
  var ACTUAL = (metrics && metrics.vetting && metrics.vetting.avg) || 0;
  var TARGET = (metrics && metrics.vetting && metrics.vetting.target) || 10;
  var VARIANCE = ACTUAL - TARGET;
  var R = 54;
  var CIRC = 2 * Math.PI * R;
  var offset = CIRC - (CIRC * Math.min(ACTUAL, 60)) / 60;
  return (
    <CsCard title="Average Vetting Time (Days)">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {ACTUAL > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r={R} stroke={BP.pale} strokeWidth="11" fill="none" />
              <circle
                cx="80" cy="80" r={R}
                stroke={ACTUAL <= TARGET ? BP.medium : BP.dark}
                strokeWidth="11" fill="none" strokeLinecap="round"
                strokeDasharray={CIRC} strokeDashoffset={offset}
                transform="rotate(-90 80 80)"
              />
              <text x="80" y="74" textAnchor="middle" fill={BP.darkest} fontSize="30" fontWeight="800">{Math.round(ACTUAL)}</text>
              <text x="80" y="93" textAnchor="middle" fill={BP.warm} fontSize="13">days</text>
            </svg>
            <div style={{ display: "flex", gap: "24px" }}>
              {[
                ["Actual",   Math.round(ACTUAL) + "d",  BP.dark],
                ["Target",   TARGET + "d",               BP.medium],
                ["Variance", (VARIANCE > 0 ? "+" : "") + Math.round(VARIANCE) + "d", VARIANCE > 0 ? "#8b3a1a" : BP.medium],
              ].map(function(item) {
                return (
                  <div key={item[0]} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "14px", color: BP.warm, marginBottom: "3px" }}>{item[0]}</div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: item[2] }}>{item[1]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ color: BP.light, fontSize: "12px", fontStyle: "italic" }}>
            Not enough data to compute vetting time yet
          </div>
        )}
      </div>
    </CsCard>
  );
};

var CsSMEPipelineProgress = function(props) {
  var metrics = props.metrics;
  var viewState = useState("stage");
  var view = viewState[0];
  var setView = viewState[1];
  var dist = (metrics && metrics.stageDist) || {};
  var nonZeroEntries = Object.entries(dist).filter(function(e) { return e[1] > 0; });
  var sortedEntries = nonZeroEntries.slice().sort(function(a, b) { return b[1] - a[1]; });
  var hbarLabels = sortedEntries.map(function(e) { return e[0]; });
  var hbarValues = sortedEntries.map(function(e) { return e[1]; });
  var doughnutLabels = nonZeroEntries.map(function(e) { return e[0]; });
  var doughnutValues = nonZeroEntries.map(function(e) { return e[1]; });
  var hasData = nonZeroEntries.length > 0;
  var innerH = Math.max(parseInt(CS_CHART_H), hbarLabels.length * 36);
  return (
    <CsCard title="SME Pipeline Progress">
      <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexShrink: 0 }}>
        <CsPill label="Stage Dist." active={view === "stage"} onClick={function() { setView("stage"); }} />
        <CsPill label="Funnel" active={view === "funnel"} onClick={function() { setView("funnel"); }} />
      </div>
      {hasData ? (
        <div style={{ flex: 1, overflow: "hidden" }}>
          {view === "stage" ? (
            <div style={{ height: innerH + "px" }}>
              <Bar
                options={csHBarOpts(true)}
                data={{
                  labels: hbarLabels,
                  datasets: [{ label: "# SMEs", data: hbarValues, backgroundColor: BCOLORS.slice(0, hbarLabels.length) }],
                }}
              />
            </div>
          ) : (
            <div style={{ height: CS_CHART_H }}>
              <Doughnut
                options={csDoughnutOpts}
                data={{
                  labels: doughnutLabels,
                  datasets: [{ data: doughnutValues, backgroundColor: BCOLORS.slice(0, doughnutLabels.length), borderWidth: 2, borderColor: "#fff" }],
                }}
              />
            </div>
          )}
        </div>
      ) : <CsEmpty />}
    </CsCard>
  );
};

var placeholderUniversalMetrics = {
  match: { min: 45, avg: 68, max: 92, dist: { "0-20": 2, "21-40": 5, "41-60": 12, "61-80": 18, "81-100": 8 } },
  bigScore: { min: 38, avg: 62, max: 88, dist: { "0-20": 3, "21-40": 7, "41-60": 14, "61-80": 15, "81-100": 6 } },
  fundingReadinessRate: 58,
  totalSMEs: 45,
  vetting: { avg: 8.5, target: 10 },
  stageDist: { "Application": 45, "Vetting": 28, "Due Diligence": 18, "Deal Close": 12, "Post-Investment": 8 },
  lifecycle: { "Idea Stage": 15, "Startup": 22, "Growth": 18, "Expansion": 8, "Mature": 5 },
};

var placeholderPortfolioMetrics = {
  match: { dist: { "0-20": 1, "21-40": 3, "41-60": 6, "61-80": 8, "81-100": 4 } },
  bigScore: { dist: { "0-20": 2, "21-40": 4, "41-60": 7, "61-80": 6, "81-100": 3 } },
};

var CohortSelectionTabContent = function() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
      <CsAverageMatchStrength metrics={placeholderUniversalMetrics} portfolioMetrics={placeholderPortfolioMetrics} />
      <CsAverageBIGScore metrics={placeholderUniversalMetrics} portfolioMetrics={placeholderPortfolioMetrics} />
      <CsFundingReadinessRate metrics={placeholderUniversalMetrics} />
      <CsAverageVettingTime metrics={placeholderUniversalMetrics} />
      <CsSMEPipelineProgress metrics={placeholderUniversalMetrics} />
    </div>
  );
};

var AssociationInsights = function() {
  var tabState = useState("cohort-selection");
  var activeTab = tabState[0];
  var setActiveTab = tabState[1];
  var charts = useRef([]);

  var universalMetrics = placeholderUniversalMetrics;
  var loading = false;

  var fmtLabel = function(l) {
    return l.split("_").map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(" ");
  };

  var insightsData = {
    matchRate: (universalMetrics && universalMetrics.match && universalMetrics.match.avg) || 68,
    averageFundingAmount: 5200000,
    activeFundersCount: 24,
    averageProcessingTime: (universalMetrics && universalMetrics.vetting && universalMetrics.vetting.avg) || 8.5,
    supportTypeBreakdown: { grant_based: 12, mentorship: 8, training_education: 10, incubator: 6, accelerator: 5, hybrid: 4 },
    activeProgramsByStage: (universalMetrics && universalMetrics.lifecycle) || { "Idea Stage": 15, "Startup": 22, "Growth": 18, "Expansion": 8, "Mature": 5 },
    longestRunningPrograms: [
      { name: "TechSolutions", daysSinceSubmission: 245 },
      { name: "GreenEnergy", daysSinceSubmission: 198 },
      { name: "HealthPlus", daysSinceSubmission: 156 },
    ],
    programsBySector: { funding_support: 25, market_access: 18, technology: 15, capacity_building: 12, social_impact: 8 },
    smeIndustryMatchDistribution: {
      "Health & Social Services": { matched: 12, unmatched: 8 },
      "Business": { matched: 18, unmatched: 10 },
      "Finance": { matched: 8, unmatched: 5 },
      "Law": { matched: 4, unmatched: 3 },
      "Technology & Engineering": { matched: 15, unmatched: 12 },
      "Science, Research & Education": { matched: 10, unmatched: 6 },
      "Other": { matched: 6, unmatched: 4 },
    },
    avgIntakeByIndustry: {
      "Health & Social Services": 20, "Business": 28, "Finance": 13,
      "Law": 7, "Technology & Engineering": 27, "Science, Research & Education": 16, "Other": 10,
    },
    bigScoreComparison: { "With Catalyst Support": 72, "In Pipeline": 48 },
    avgFundingSecuredByProgramType: { mentorship: 5, grant_based: 12, training_education: 8, incubator: 15, accelerator: 25, hybrid: 10 },
    completionRateByProgramType: [
      { type: "mentorship", rate: 85 }, { type: "grant_based", rate: 80 },
      { type: "training_education", rate: 70 }, { type: "incubator", rate: 75 },
      { type: "accelerator", rate: 65 }, { type: "hybrid", rate: 60 },
    ],
    applicationVolumeOverTime: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(function(month, i) {
      return { month: month, applications: [12,15,18,14,20,22,25,28,24,30,26,22][i] };
    }),
    timeToAcceptanceData: {
      applied:   { Jan:12,Feb:15,Mar:18,Apr:14,May:20,Jun:22,Jul:25,Aug:28,Sep:24,Oct:30,Nov:26,Dec:22 },
      accepted:  { Jan:8, Feb:10,Mar:12,Apr:10,May:14,Jun:16,Jul:18,Aug:20,Sep:18,Oct:22,Nov:20,Dec:16 },
    },
    rejectedVsAcceptedApplicants: { Accepted: 68, Rejected: 32 },
  };

  var memoizedInsights = useDeepCompareMemo(insightsData);

  var chartRefs = {
    supportTypeBreakdown:           useRef(null),
    activeProgramsByStage:          useRef(null),
    programsBySector:               useRef(null),
    smeIndustryMatchDistribution:   useRef(null),
    avgIntakeByIndustry:            useRef(null),
    bigScoreComparison:             useRef(null),
    avgFundingSecuredByProgramType: useRef(null),
    completionRateByProgramType:    useRef(null),
    applicationVolumeOverTime:      useRef(null),
    timeToAcceptanceByMonth:        useRef(null),
    rejectedVsAcceptedApplicants:   useRef(null),
  };

  useEffect(function() {
    if (loading) return;
    charts.current.forEach(function(c) { c.destroy(); });
    charts.current = [];

    var bp = {
      primary: "#6d4c41", secondary: "#8d6e63", tertiary: "#a1887f",
      light: "#bcaaa4", lighter: "#d7ccc8", lightest: "#efebe9",
      accent1: "#5d4037", accent2: "#4e342e",
    };

    var createChart = function(ref, config) {
      if (!ref.current) return;
      var ctx = ref.current.getContext("2d");
      if (ctx) charts.current.push(new Chart(ctx, config));
    };

    var yScale = function(title) {
      return {
        beginAtZero: true, max: 50,
        title: { display: true, text: title, color: bp.primary },
        ticks: { color: bp.primary, font: { size: 10 }, stepSize: 10 },
        grid: { color: bp.lighter },
      };
    };
    var xBase = { ticks: { color: bp.primary, font: { size: 10 } }, grid: { color: bp.lighter } };

    if (activeTab === "program-types") {
      createChart(chartRefs.supportTypeBreakdown, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.supportTypeBreakdown).map(fmtLabel),
          datasets: [{ label: "Programs", data: Object.values(memoizedInsights.supportTypeBreakdown), backgroundColor: bp.primary, borderColor: bp.accent1, borderWidth: 1 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { title: { display: true, text: "Support Type Breakdown", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } },
          scales: { x: Object.assign({}, xBase, { title: { display: true, text: "Support Type", color: bp.primary }, ticks: Object.assign({}, xBase.ticks, { maxRotation: 45 }) }), y: yScale("Number of SMEs") },
        },
      });
      createChart(chartRefs.activeProgramsByStage, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.activeProgramsByStage),
          datasets: [{ label: "SMEs", data: Object.values(memoizedInsights.activeProgramsByStage), backgroundColor: bp.secondary, borderColor: bp.primary, borderWidth: 1 }],
        },
        options: {
          indexAxis: "y", responsive: true, maintainAspectRatio: false,
          plugins: { title: { display: true, text: "SMEs by Operation Stage", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } },
          scales: { x: yScale("Number of SMEs"), y: Object.assign({}, xBase, { title: { display: true, text: "Stage", color: bp.primary } }) },
        },
      });
    }

    if (activeTab === "sector-focus") {
      createChart(chartRefs.programsBySector, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.programsBySector).map(fmtLabel),
          datasets: [{ label: "SMEs", data: Object.values(memoizedInsights.programsBySector), backgroundColor: bp.accent1, borderColor: bp.primary, borderWidth: 1 }],
        },
        options: {
          indexAxis: "y", responsive: true, maintainAspectRatio: false,
          plugins: { title: { display: true, text: "Support Focus Distribution", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } },
          scales: { x: yScale("Number of SMEs"), y: Object.assign({}, xBase, { title: { display: true, text: "Support Focus", color: bp.primary } }) },
        },
      });
      createChart(chartRefs.smeIndustryMatchDistribution, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.smeIndustryMatchDistribution),
          datasets: [
            { label: "Approved", data: Object.values(memoizedInsights.smeIndustryMatchDistribution).map(function(d) { return d.matched; }), backgroundColor: bp.primary },
            { label: "In Pipeline", data: Object.values(memoizedInsights.smeIndustryMatchDistribution).map(function(d) { return d.unmatched; }), backgroundColor: bp.lighter },
          ],
        },
        options: {
          indexAxis: "y", responsive: true, maintainAspectRatio: false,
          plugins: { title: { display: true, text: "SME Industry Match Distribution", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { position: "top", labels: { color: bp.primary, font: { size: 10 } } } },
          scales: {
            x: { stacked: true, beginAtZero: true, max: 100, title: { display: true, text: "SME Count", color: bp.primary }, ticks: { color: bp.primary, font: { size: 10 }, stepSize: 20 }, grid: { color: bp.lighter } },
            y: { stacked: true, ticks: { color: bp.primary, font: { size: 10 } }, grid: { color: bp.lighter }, title: { display: true, text: "Industry", color: bp.primary } },
          },
        },
      });
      createChart(chartRefs.avgIntakeByIndustry, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.avgIntakeByIndustry),
          datasets: [{ label: "SMEs", data: Object.values(memoizedInsights.avgIntakeByIndustry), backgroundColor: bp.tertiary, borderColor: bp.primary, borderWidth: 1 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { title: { display: true, text: "SME Intake by Industry", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } },
          scales: { x: Object.assign({}, xBase, { title: { display: true, text: "Industry", color: bp.primary }, ticks: Object.assign({}, xBase.ticks, { maxRotation: 45 }) }), y: yScale("Number of SMEs") },
        },
      });
    }

    if (activeTab === "outcomes-effectiveness") {
      createChart(chartRefs.bigScoreComparison, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.bigScoreComparison),
          datasets: [{ label: "Average BIG Score", data: Object.values(memoizedInsights.bigScoreComparison), backgroundColor: [bp.lighter, bp.primary], borderColor: bp.accent1, borderWidth: 1 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { title: { display: true, text: "BIG Score: Approved vs In Pipeline", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } },
          scales: { x: Object.assign({}, xBase, { title: { display: true, text: "Catalyst Stage", color: bp.primary } }), y: { beginAtZero: true, max: 100, title: { display: true, text: "Average BIG Score", color: bp.primary }, ticks: { color: bp.primary, font: { size: 10 }, stepSize: 20 }, grid: { color: bp.lighter } } },
        },
      });
      createChart(chartRefs.avgFundingSecuredByProgramType, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.avgFundingSecuredByProgramType).map(fmtLabel),
          datasets: [{ label: "Avg Funding (ZAR)", data: Object.values(memoizedInsights.avgFundingSecuredByProgramType), backgroundColor: bp.light, borderColor: bp.primary, borderWidth: 1 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { title: { display: true, text: "Avg. Funding Required by Program Type", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } },
          scales: { x: Object.assign({}, xBase, { title: { display: true, text: "Program Type", color: bp.primary }, ticks: Object.assign({}, xBase.ticks, { maxRotation: 45 }) }), y: { beginAtZero: true, max: 50, title: { display: true, text: "Avg Funding (Millions ZAR)", color: bp.primary }, ticks: { color: bp.primary, font: { size: 10 }, callback: function(v) { return v + "M"; }, stepSize: 10 }, grid: { color: bp.lighter } } },
        },
      });
      createChart(chartRefs.completionRateByProgramType, {
        type: "bar",
        data: {
          labels: memoizedInsights.completionRateByProgramType.map(function(d) { return fmtLabel(d.type); }),
          datasets: [{ label: "Approval Rate (%)", data: memoizedInsights.completionRateByProgramType.map(function(d) { return d.rate; }), backgroundColor: bp.primary, borderColor: bp.accent1, borderWidth: 1 }],
        },
        options: {
          indexAxis: "y", responsive: true, maintainAspectRatio: false,
          plugins: { title: { display: true, text: "Approval Rate by Program Type", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } },
          scales: { x: { beginAtZero: true, max: 100, title: { display: true, text: "Approval Rate (%)", color: bp.primary }, ticks: { color: bp.primary, font: { size: 10 }, callback: function(v) { return v + "%"; }, stepSize: 20 }, grid: { color: bp.lighter } }, y: Object.assign({}, xBase, { title: { display: true, text: "Program Type", color: bp.primary } }) },
        },
      });
    }

    if (activeTab === "engagement-patterns") {
      var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      createChart(chartRefs.applicationVolumeOverTime, {
        type: "line",
        data: {
          labels: memoizedInsights.applicationVolumeOverTime.map(function(d) { return d.month; }),
          datasets: [{ label: "Applications", data: memoizedInsights.applicationVolumeOverTime.map(function(d) { return d.applications; }), borderColor: bp.primary, backgroundColor: bp.lighter, tension: 0.4, fill: true, pointBackgroundColor: bp.primary, pointRadius: 4 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { title: { display: true, text: "Application Volume Over Time", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } },
          scales: { x: Object.assign({}, xBase, { title: { display: true, text: "Month", color: bp.primary } }), y: yScale("Applications") },
        },
      });
      createChart(chartRefs.rejectedVsAcceptedApplicants, {
        type: "doughnut",
        data: {
          labels: Object.keys(memoizedInsights.rejectedVsAcceptedApplicants),
          datasets: [{ data: Object.values(memoizedInsights.rejectedVsAcceptedApplicants), backgroundColor: [bp.primary, bp.lighter], borderWidth: 1 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { title: { display: true, text: "Rejected vs Accepted Applicants", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { position: "bottom", labels: { color: bp.primary, boxWidth: 8, padding: 8, font: { size: 9 } } } },
        },
      });
      createChart(chartRefs.timeToAcceptanceByMonth, {
        type: "line",
        data: {
          labels: months,
          datasets: [
            { label: "Applications Submitted", data: months.map(function(m) { return memoizedInsights.timeToAcceptanceData.applied[m] || 0; }), borderColor: bp.primary, backgroundColor: "transparent", tension: 0.4, pointBackgroundColor: bp.primary, pointRadius: 4 },
            { label: "Applications Accepted",  data: months.map(function(m) { return memoizedInsights.timeToAcceptanceData.accepted[m] || 0; }), borderColor: bp.secondary, backgroundColor: "transparent", tension: 0.4, pointBackgroundColor: bp.secondary, pointRadius: 4 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { title: { display: true, text: "Applications vs Acceptances by Month", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { position: "top", labels: { color: bp.primary, font: { size: 10 } } } },
          scales: { x: Object.assign({}, xBase, { title: { display: true, text: "Month", color: bp.primary } }), y: yScale("Number of Applications") },
        },
      });
    }

    return function() { charts.current.forEach(function(c) { c.destroy(); }); };
  }, [activeTab, memoizedInsights, loading]);

  var tabs = [
    { id: "cohort-selection",       label: "Ecosystem Selection",      icon: Users    },
    { id: "program-types",          label: "Catalyst Types & Reach",   icon: Rocket   },
    { id: "sector-focus",           label: "Sector Focus",             icon: Target   },
    { id: "outcomes-effectiveness", label: "Outcomes & Effectiveness", icon: Award    },
    { id: "engagement-patterns",    label: "Engagement Patterns",      icon: Activity },
  ];

  var statCards = [
    { icon: TrendingUp, value: memoizedInsights.matchRate + "%",                                        label: "Ecosystem Match Rate"  },
    { icon: DollarSign, value: "R" + (memoizedInsights.averageFundingAmount / 1000000).toFixed(1) + "M", label: "Avg. Funding Required" },
    { icon: Users,      value: "" + memoizedInsights.activeFundersCount,                                label: "Active Catalysts"      },
    { icon: Clock,      value: memoizedInsights.averageProcessingTime + "d",                            label: "Avg. Vetting Time"     },
  ];

  return (
    <div className="min-h-screen bg-backgroundBrown px-5 py-6 box-border">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-mediumBrown mt-0 mb-1">My Association Insights</h1>
        <p className="text-lg text-lightBrown m-0 font-normal">
          Comprehensive analytics and insights across all your Catalyst programs
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        {statCards.map(function(card) {
          var Icon = card.icon;
          return (
            <div key={card.label} className="flex items-center gap-3 bg-cream rounded-xl p-4 flex-1 min-w-[140px] shadow-sm border border-lightTan">
              <div className="w-10 h-10 rounded-lg bg-mediumBrown/10 flex items-center justify-center text-mediumBrown flex-shrink-0">
                <Icon size={18} />
              </div>
              <div>
                <div className="text-2xl font-bold text-darkBrown leading-tight">{card.value}</div>
                <div className="text-xs text-lightBrown mt-0.5">{card.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 flex-wrap mb-5">
        {tabs.map(function(tab) {
          var Icon = tab.icon;
          var active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={function() { setActiveTab(tab.id); }}
              className={
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 cursor-pointer " +
                (active
                  ? "bg-mediumBrown text-white border-mediumBrown shadow-md"
                  : "bg-white text-textBrown border-lightTan hover:border-mediumBrown hover:text-mediumBrown")
              }
            >
              <Icon size={13} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className={activeTab === "cohort-selection" ? "" : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"}>

        {activeTab === "cohort-selection" && (
          <CohortSelectionTabContent />
        )}

        {activeTab === "program-types" && (
          <div style={{ display: "contents" }}>
            <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
              <canvas ref={chartRefs.supportTypeBreakdown} />
            </div>
            <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
              <canvas ref={chartRefs.activeProgramsByStage} />
            </div>
            <div className="bg-white rounded-2xl border border-lightTan p-5 shadow-sm flex flex-col">
              <h3 className="text-sm font-bold text-mediumBrown mb-4 m-0">Top 3 Longest Active SMEs</h3>
              <div className="flex flex-col gap-0 flex-1">
                {memoizedInsights.longestRunningPrograms.map(function(prog, i) {
                  return (
                    <div key={i} className="flex items-center gap-3 py-3 border-b border-lightTan last:border-0">
                      <span className={"w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 " + (i === 0 ? "bg-accentGold" : i === 1 ? "bg-lightBrown" : "bg-lightTan text-textBrown")}>
                        {"#" + (i + 1)}
                      </span>
                      <span className="flex-1 text-sm text-textBrown font-medium truncate">{prog.name}</span>
                      <span className="text-xs text-lightBrown whitespace-nowrap">{prog.daysSinceSubmission}d ago</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "sector-focus" && (
          <div style={{ display: "contents" }}>
            <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
              <canvas ref={chartRefs.programsBySector} />
            </div>
            <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
              <canvas ref={chartRefs.smeIndustryMatchDistribution} />
            </div>
            <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
              <canvas ref={chartRefs.avgIntakeByIndustry} />
            </div>
          </div>
        )}

        {activeTab === "outcomes-effectiveness" && (
          <div style={{ display: "contents" }}>
            <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
              <canvas ref={chartRefs.bigScoreComparison} />
            </div>
            <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
              <canvas ref={chartRefs.avgFundingSecuredByProgramType} />
            </div>
            <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
              <canvas ref={chartRefs.completionRateByProgramType} />
            </div>
          </div>
        )}

        {activeTab === "engagement-patterns" && (
          <div style={{ display: "contents" }}>
            <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
              <canvas ref={chartRefs.applicationVolumeOverTime} />
            </div>
            <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
              <canvas ref={chartRefs.rejectedVsAcceptedApplicants} />
            </div>
            <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
              <canvas ref={chartRefs.timeToAcceptanceByMonth} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AssociationInsights;