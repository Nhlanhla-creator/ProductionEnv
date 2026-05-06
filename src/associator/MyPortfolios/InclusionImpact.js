import React, { useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, LineElement, PointElement } from "chart.js";
import { usePortfolio } from "../../context/PortfolioContext";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, LineElement, PointElement);

const B = {
  black: "#1a1a1a",
  darkGrey: "#4a4a4a",
  mediumGrey: "#7a7a7a",
  warmGrey: "#9e9e9e",
  lightGrey: "#c4c4c4",
  cream: "#f5f0e8",
  offwhite: "#faf8f5",
  brownDark: "#5c3d2e",
  brownMedium: "#8b694e",
  brownLight: "#b8957a",
  brownPale: "#d4bca8",
  white: "#ffffff",
};

const MIXED_COLORS = [
  "#5c3d2e",
  "#4a4a4a",
  "#8b694e",
  "#7a7a7a",
  "#b8957a",
  "#c4c4c4",
  "#d4bca8",
  "#9e9e9e",
  "#3d2a1f",
  "#e0d6c8",
];

const Card = ({ title, children, footer }) => (
  <div
    style={{
      background: "#fff",
      borderRadius: "10px",
      padding: "20px",
      minHeight: "400px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      border: `1px solid ${B.lightGrey}`,
      display: "flex",
      flexDirection: "column",
    }}
  >
    <div style={{ paddingBottom: "10px", borderBottom: `1px solid ${B.offwhite}`, marginBottom: "10px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: "700", color: B.black, margin: 0 }}>{title}</h3>
    </div>
    <div style={{ flex: 1 }}>{children}</div>
    {footer && (
      <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: `1px solid ${B.offwhite}`, fontSize: "11px", color: B.warmGrey }}>
        {footer}
      </div>
    )}
  </div>
);

const Pill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: "4px 12px",
      borderRadius: "20px",
      cursor: "pointer",
      fontSize: "10px",
      border: `1.5px solid ${active ? B.brownMedium : B.lightGrey}`,
      fontWeight: active ? 700 : 500,
      background: active ? B.brownMedium : "#fff",
      color: active ? "#fff" : B.darkGrey,
    }}
  >
    {label}
  </button>
);

const SubTab = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: "6px 16px",
      borderRadius: "20px",
      cursor: "pointer",
      fontSize: "12px",
      border: `1.5px solid ${active ? B.brownMedium : B.lightGrey}`,
      fontWeight: active ? 700 : 500,
      background: active ? B.brownMedium : "#fff",
      color: active ? "#fff" : B.darkGrey,
    }}
  >
    {label}
  </button>
);

const Toggle = ({ options, value, onChange }) => (
  <div style={{ display: "inline-flex", borderRadius: "20px", border: `1.5px solid ${B.lightGrey}`, overflow: "hidden" }}>
    {options.map((opt, i) => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        style={{
          padding: "5px 16px",
          fontSize: "11px",
          fontWeight: value === opt.value ? 700 : 500,
          background: value === opt.value ? B.brownDark : "#fff",
          color: value === opt.value ? "#fff" : B.darkGrey,
          border: "none",
          cursor: "pointer",
          borderRight: i < options.length - 1 ? `1px solid ${B.lightGrey}` : "none",
        }}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

// Chart opts for doughnut with BLACK labels (so visible on white)
const doughnutOpts = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: {
    legend: { position: "bottom", labels: { color: B.black, font: { size: 10 }, boxWidth: 10 } },
  },
};

const hBarOpts = () => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  indexAxis: "y",
  plugins: { legend: { display: false } },
  scales: {
    x: { beginAtZero: true, grid: { display: true, color: B.lightGrey }, ticks: { color: B.black, font: { size: 9 } } },
    y: { grid: { display: false }, ticks: { color: B.black, font: { size: 10 } } },
  },
});

const vBarOpts = (yCb, xTitle) => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { title: { display: true, text: xTitle || "Range", color: B.black }, grid: { display: false }, ticks: { color: B.black, font: { size: 8 } } },
    y: { title: { display: true, text: "Number of SMEs", color: B.black }, beginAtZero: true, grid: { color: B.lightGrey }, ticks: { color: B.black, callback: yCb || ((v) => v) } },
  },
});

const lineOpts = () => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        color: B.darkGrey,
        font: { size: 10 },
        boxWidth: 12,
        padding: 14,
      },
    },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y}%`,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: B.lightGrey },
      ticks: { color: B.darkGrey, font: { size: 10 }, callback: (v) => `${v}%` },
      title: { display: true, text: "% Beneficiaries", color: B.darkGrey, font: { size: 10 } },
    },
    x: {
      ticks: { color: B.darkGrey, font: { size: 10 } },
      grid: { display: false },
    },
  },
});

const ScoreRangeView = ({ min, pipelineAvg, max, cohortAvg, target, suffix = "%" }) => {
  const clamp = (v) => Math.min(Math.max(v || 0, 0), 100);
  const mn = clamp(min);
  const pa = clamp(pipelineAvg);
  const mx = clamp(max);
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
      <div style={{ fontSize: "64px", fontWeight: "800", color: B.black, lineHeight: 1 }}>
        {cohortAvg}<span style={{ fontSize: "32px" }}>{suffix}</span>
      </div>
      <div style={{ fontSize: "14px", color: B.mediumGrey, fontWeight: 600 }}>Target: {target}{suffix}</div>
      <div style={{ width: "100%", marginTop: "4px" }}>
        <div style={{ position: "relative", width: "100%", height: "12px", background: B.lightGrey, borderRadius: "6px" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: `${mx}%`, height: "100%", background: MIXED_COLORS[4], borderRadius: "6px" }} />
          <div style={{ position: "absolute", left: 0, top: 0, width: `${pa}%`, height: "100%", background: MIXED_COLORS[2], borderRadius: "6px" }} />
          <div style={{ position: "absolute", left: 0, top: 0, width: `${mn}%`, height: "100%", background: MIXED_COLORS[0], borderRadius: "6px" }} />
        </div>
        <div style={{ position: "relative", width: "95%", height: "38px", marginTop: "6px" }}>
          {[{ val: mn, label: "Min", color: MIXED_COLORS[0] }, { val: pa, label: "Avg", color: MIXED_COLORS[2] }, { val: mx, label: "Max", color: MIXED_COLORS[4] }].map(({ val, label, color }) => (
            <div key={label} style={{ position: "absolute", left: `${val}%`, transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color }}>{val}{suffix}</div>
              <div style={{ fontSize: "9px", color: B.mediumGrey }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── 1. Demographics ──────────────────────────────────────────────────────────
const DemographicsSection = () => {
  const { marketPulse } = usePortfolio();
  const [card1Type, setCard1Type] = useState("female");
  const [card2Type, setCard2Type] = useState("hdi");

  const beneficiaries = marketPulse?.marketStructure?.inclusionImpact?.beneficiaries || {
    female: { zarPct: 32, countPct: 35, trend: [28, 30, 32, 35] },
    youth:  { zarPct: 28, countPct: 30, trend: [22, 25, 28, 30] },
    hdi:    { zarPct: 52, countPct: 55, trend: [45, 48, 52, 55] },
    disabled: { zarPct: 4, countPct: 6, trend: [2, 3, 3, 4] },
  };

  const meta = {
    female:   { label: "Female-Led",  color: MIXED_COLORS[0] },
    youth:    { label: "Youth-Led",   color: MIXED_COLORS[2] },
    hdi:      { label: "HDI",         color: MIXED_COLORS[4] },
    disabled: { label: "Disabled",    color: MIXED_COLORS[6] },
  };

  const YEARS = ["2022", "2023", "2024", "2025"];

  const DemoCard = ({ typeA, typeB, activeType, setActiveType }) => {
    const dA = beneficiaries[typeA];
    const dB = beneficiaries[typeB];
    const mA = meta[typeA];
    const mB = meta[typeB];
    const active = activeType === typeA ? dA : dB;
    const activeMeta = activeType === typeA ? mA : mB;

    return (
      <Card title={`${mA.label} & ${mB.label} Beneficiaries`}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
          <Toggle
            options={[
              { label: mA.label, value: typeA },
              { label: mB.label, value: typeB },
            ]}
            value={activeType}
            onChange={setActiveType}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
          <div style={{ background: B.offwhite, border: `1px solid ${B.lightGrey}`, borderRadius: "8px", padding: "14px", textAlign: "center" }}>
            <div style={{ fontSize: "10px", color: B.warmGrey, marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>By ZAR</div>
            <div style={{ fontSize: "36px", fontWeight: "800", color: activeMeta.color, lineHeight: 1 }}>{active.zarPct}%</div>
            <div style={{ fontSize: "10px", color: B.mediumGrey, marginTop: "4px" }}>of total capital</div>
          </div>
          <div style={{ background: B.offwhite, border: `1px solid ${B.lightGrey}`, borderRadius: "8px", padding: "14px", textAlign: "center" }}>
            <div style={{ fontSize: "10px", color: B.warmGrey, marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>By Count</div>
            <div style={{ fontSize: "36px", fontWeight: "800", color: activeMeta.color, lineHeight: 1 }}>{active.countPct}%</div>
            <div style={{ fontSize: "10px", color: B.mediumGrey, marginTop: "4px" }}>of total SMEs</div>
          </div>
        </div>

        <div style={{ fontSize: "11px", fontWeight: 600, color: B.darkGrey, marginBottom: "6px" }}>Trend (%)</div>
        <div style={{ height: "180px" }}>
          <Line
            options={lineOpts()}
            data={{
              labels: YEARS,
              datasets: [
                {
                  label: `${mA.label} (%)`,
                  data: dA.trend,
                  borderColor: mA.color,
                  backgroundColor: mA.color + "22",
                  tension: 0.3,
                  fill: false,
                  pointBackgroundColor: mA.color,
                  pointRadius: 4,
                },
                {
                  label: `${mB.label} (%)`,
                  data: dB.trend,
                  borderColor: mB.color,
                  backgroundColor: mB.color + "22",
                  tension: 0.3,
                  fill: false,
                  pointBackgroundColor: mB.color,
                  pointRadius: 4,
                },
              ],
            }}
          />
        </div>
      </Card>
    );
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
      <DemoCard typeA="female" typeB="youth" activeType={card1Type} setActiveType={setCard1Type} />
      <DemoCard typeA="hdi" typeB="disabled" activeType={card2Type} setActiveType={setCard2Type} />
    </div>
  );
};

// ─── 2. Outcomes ──────────────────────────────────────────────────────────────
const OutcomesSection = () => {
  const [jobsView, setJobsView] = useState("total");
  const [supportView, setSupportView] = useState("distribution");

  const placeholderJobs = {
    total: 385, direct: 245, indirect: 140,
    perSME: [
      { name: "TechSolve", jobs: 45 }, { name: "GreenEnergy", jobs: 32 },
      { name: "HealthPlus", jobs: 28 }, { name: "EduTech", jobs: 24 },
      { name: "LogiSync", jobs: 18 },  { name: "AgriGrow", jobs: 15 },
    ],
    perSector: [
      { sector: "Fintech", jobs: 78 }, { sector: "Clean Energy", jobs: 65 },
      { sector: "Healthtech", jobs: 52 }, { sector: "Edtech", jobs: 48 },
      { sector: "Logistics", jobs: 42 }, { sector: "Agritech", jobs: 38 },
    ],
  };

  const supportOffered = { "Strategic Guidance": 45, "Networks/Access": 38, "Financial Advisory": 32, "Legal Support": 25, "Marketing Support": 28, Operations: 20 };
  const perSME = [...placeholderJobs.perSME].sort((a, b) => b.jobs - a.jobs);
  const perSector = [...placeholderJobs.perSector].sort((a, b) => b.jobs - a.jobs);
  const avgJobs = (perSME.reduce((a, b) => a + b.jobs, 0) / 45).toFixed(1);
  const supportData = Object.entries(supportOffered).sort((a, b) => b[1] - a[1]);
  const innerH = Math.max(280, supportData.length * 36);
  const jobsInnerH = Math.max(280, (jobsView === "sme" ? perSME.length : perSector.length) * 36);
  const jobsFooter = jobsView === "sme"
    ? { left: `Portfolio Avg: ${avgJobs} jobs/SME`, right: "Target: 15" }
    : { left: `Total: ${perSector.reduce((a, b) => a + b.jobs, 0)} jobs`, right: `${perSector.length} active sectors` };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
      <Card title="Total Number of Jobs Created / Projected">
        <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
          <Pill label="Total Jobs" active={jobsView === "total"} onClick={() => setJobsView("total")} />
          <Pill label="Per SME" active={jobsView === "sme"} onClick={() => setJobsView("sme")} />
          <Pill label="Per Sector" active={jobsView === "sector"} onClick={() => setJobsView("sector")} />
        </div>
        {jobsView === "total" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            <div style={{ fontSize: "64px", fontWeight: "800", color: B.black, lineHeight: 1 }}>{placeholderJobs.total}</div>
            <div style={{ display: "flex", gap: "20px", marginTop: "14px" }}>
              {[["Direct", placeholderJobs.direct, MIXED_COLORS[0]], ["Indirect", placeholderJobs.indirect, MIXED_COLORS[2]]].map(([l, v, col]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: B.warmGrey, marginBottom: "3px" }}>{l}</div>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: col }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {jobsView !== "total" && (
          <div style={{ flex: 1 }}>
            <div style={{ height: `${jobsInnerH}px` }}>
              <Bar
                options={hBarOpts()}
                data={{
                  labels: (jobsView === "sme" ? perSME : perSector).map((i) => jobsView === "sme" ? i.name : i.sector),
                  datasets: [{ label: "Jobs", data: (jobsView === "sme" ? perSME : perSector).map((i) => i.jobs), backgroundColor: MIXED_COLORS }],
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
              <span style={{ fontSize: "12px", color: B.black, fontWeight: 600 }}>{jobsFooter.left}</span>
              <span style={{ fontSize: "12px", color: B.warmGrey }}>{jobsFooter.right}</span>
            </div>
          </div>
        )}
      </Card>

      <Card title="Additional Support / Advice Offered">
        <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
          <Pill label="Distribution" active={supportView === "distribution"} onClick={() => setSupportView("distribution")} />
          <Pill label="By SME" active={supportView === "bySME"} onClick={() => setSupportView("bySME")} />
        </div>
        {supportView === "distribution" ? (
          <div style={{ height: "280px" }}>
            <Doughnut options={doughnutOpts} data={{ labels: supportData.map(([k]) => k), datasets: [{ data: supportData.map(([, v]) => v), backgroundColor: MIXED_COLORS }] }} />
          </div>
        ) : (
          <>
            <div style={{ height: `${innerH}px` }}>
              <Bar options={hBarOpts()} data={{ labels: supportData.map(([k]) => k), datasets: [{ label: "% of SMEs", data: supportData.map(([, v]) => v), backgroundColor: MIXED_COLORS }] }} />
            </div>
            <div style={{ marginTop: "12px", fontSize: "11px", color: B.warmGrey, display: "flex", justifyContent: "space-between" }}>
              <span>Most requested: {supportData[0]?.[0]}</span>
              <span>Least requested: {supportData[supportData.length - 1]?.[0]}</span>
            </div>
          </>
        )}
        {supportView === "distribution" && (
          <div style={{ marginTop: "12px", fontSize: "11px", color: B.warmGrey, display: "flex", justifyContent: "space-between" }}>
            <span>Most requested: {supportData[0]?.[0]}</span>
            <span>Least requested: {supportData[supportData.length - 1]?.[0]}</span>
          </div>
        )}
      </Card>
    </div>
  );
};

// ─── 3. CohortSelection ───────────────────────────────────────────────────────
// REMOVED the top tabs - now showing ALL charts together
// ─── 3. CohortSelection ───────────────────────────────────────────────────────
// REMOVED the top tabs - now showing ALL charts together, and removed the second row with Match Strength & BIG Score cards
const CohortSelectionSection = () => {
  const [historyView, setHistoryView] = useState("applications");
  const [scoreToggle, setScoreToggle] = useState("big");

  const placeholderData = {
    applied: 245, fitFunding: 128, approvals: 42,
    avgBIGScore: 62, fundingReadinessRate: 58,
    applicationHistory: [180, 210, 235, 245],
    fitFundingHistory: [85, 102, 118, 128],
    approvalsHistory: [28, 35, 40, 42],
    avgBIGScoreHistory: [48, 54, 59, 62],
    fundingReadinessHistory: [42, 48, 54, 58],
    match: { min: 45, avg: 68, max: 92, cohortAvg: 68 },
    bigScore: { min: 38, avg: 62, max: 88, cohortAvg: 62 },
    avgFundingRequired: { "Pre-seed": 0.5, Seed: 1.5, "Series A": 5, "Series B": 12 },
    approvalRate: { "Pre-seed": 65, Seed: 58, "Series A": 45, "Series B": 38 },
    vetting: { avg: 8.5, target: 10, history: [7.2, 7.8, 8.2, 8.5] },
    stageDist: { Application: 45, Vetting: 28, "Due Diligence": 18, "Deal Close": 12, "Post-Investment": 8 },
  };

  const stageEntries = Object.entries(placeholderData.stageDist).filter(([, v]) => v > 0);
  const sortedStage = [...stageEntries].sort((a, b) => b[1] - a[1]);
  const innerH = Math.max(280, sortedStage.length * 36);
  const fundingData = Object.entries(placeholderData.avgFundingRequired);
  const approvalData = Object.entries(placeholderData.approvalRate);

  const getHistoryData = () => {
    switch (historyView) {
      case "fitFunding": return { labels: ["2022","2023","2024","2025"], data: placeholderData.fitFundingHistory, color: MIXED_COLORS[2], label: "Fit for Funding" };
      case "approvals":  return { labels: ["2022","2023","2024","2025"], data: placeholderData.approvalsHistory, color: MIXED_COLORS[4], label: "Approvals" };
      default:           return { labels: ["2022","2023","2024","2025"], data: placeholderData.applicationHistory, color: MIXED_COLORS[0], label: "Applications" };
    }
  };
  const historyData = getHistoryData();

  const scoreData = scoreToggle === "big"
    ? { label: "Average BIG Score (%)", value: placeholderData.avgBIGScore, history: placeholderData.avgBIGScoreHistory, color: MIXED_COLORS[0], histLabel: "BIG Score" }
    : { label: "Funding Readiness Rate (%)", value: placeholderData.fundingReadinessRate, history: placeholderData.fundingReadinessHistory, color: MIXED_COLORS[2], histLabel: "Funding Readiness" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* First row - Pipeline Metrics charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
        <Card title="Pipeline Overview">
          <div style={{ display: "flex", gap: "16px", marginBottom: "20px", justifyContent: "space-around" }}>
            {[
              { label: "How Many Applied", value: placeholderData.applied, color: MIXED_COLORS[0] },
              { label: "Fit for Funding", value: placeholderData.fitFunding, color: MIXED_COLORS[2] },
              { label: "Approvals", value: placeholderData.approvals, color: MIXED_COLORS[4] },
            ].map((item) => (
              <div key={item.label} style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: "32px", fontWeight: "800", color: item.color }}>{item.value}</div>
                <div style={{ fontSize: "10px", color: B.warmGrey }}>{item.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "6px", marginBottom: "10px", justifyContent: "center" }}>
            <Pill label="Applications" active={historyView === "applications"} onClick={() => setHistoryView("applications")} />
            <Pill label="Fit for Funding" active={historyView === "fitFunding"} onClick={() => setHistoryView("fitFunding")} />
            <Pill label="Approvals" active={historyView === "approvals"} onClick={() => setHistoryView("approvals")} />
          </div>
          <div style={{ height: "200px" }}>
            <Bar options={vBarOpts((v) => v, "Year")} data={{ labels: historyData.labels, datasets: [{ label: historyData.label, data: historyData.data, backgroundColor: historyData.color }] }} />
          </div>
        </Card>

        <Card title="BIG Score & Funding Readiness">
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Toggle
                options={[{ label: "BIG Score", value: "big" }, { label: "Funding Readiness", value: "readiness" }]}
                value={scoreToggle}
                onChange={setScoreToggle}
              />
            </div>
            <div style={{ fontSize: "11px", color: B.warmGrey, textAlign: "center" }}>{scoreData.label}</div>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: "52px", fontWeight: "800", color: scoreData.color, lineHeight: 1 }}>{scoreData.value}%</span>
            </div>
            <div style={{ flex: 1 }}>
              <Bar options={vBarOpts((v) => `${v}%`, "Year")} data={{ labels: ["2022","2023","2024","2025"], datasets: [{ label: scoreData.histLabel, data: scoreData.history, backgroundColor: scoreData.color }] }} />
            </div>
          </div>
        </Card>

        <Card title="Average Vetting Time (Days)">
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: "64px", fontWeight: "800", color: B.black }}>
              {placeholderData.vetting.avg}<span style={{ fontSize: "24px" }}> days</span>
            </div>
            <div style={{ display: "flex", gap: "24px", marginTop: "10px" }}>
              {[
                ["Target", placeholderData.vetting.target + "d", MIXED_COLORS[2]],
                ["Variance", (placeholderData.vetting.avg - placeholderData.vetting.target > 0 ? "+" : "") + Math.round(placeholderData.vetting.avg - placeholderData.vetting.target) + "d",
                  placeholderData.vetting.avg > placeholderData.vetting.target ? "#c62828" : MIXED_COLORS[2]],
              ].map(([l, v, col]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: B.warmGrey, marginBottom: "3px" }}>{l}</div>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: col }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ height: "120px", width: "100%", marginTop: "15px" }}>
              <Bar options={vBarOpts((v) => `${v}d`, "Year")} data={{ labels: ["2022","2023","2024","2025"], datasets: [{ label: "Vetting Time", data: placeholderData.vetting.history, backgroundColor: MIXED_COLORS[4] }] }} />
            </div>
          </div>
        </Card>
      </div>

      {/* Second row - Additional charts (removed the Match Strength and BIG Score cards) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
        <Card title="Avg. Funding Required by Program Type (ZAR M)">
          <div style={{ height: "320px" }}>
            <Bar options={vBarOpts((v) => `R${v}M`, "Program Type")} data={{ labels: fundingData.map(([k]) => k), datasets: [{ label: "Avg Funding Required", data: fundingData.map(([, v]) => v), backgroundColor: MIXED_COLORS[0] }] }} />
          </div>
        </Card>
        <Card title="Approval Rate by Program Type (%)">
          <div style={{ height: "320px" }}>
            <Bar options={vBarOpts((v) => `${v}%`, "Program Type")} data={{ labels: approvalData.map(([k]) => k), datasets: [{ label: "Approval Rate", data: approvalData.map(([, v]) => v), backgroundColor: MIXED_COLORS[2] }] }} />
          </div>
        </Card>
        <Card title="SME Pipeline Progress">
          <div style={{ height: `${innerH}px` }}>
            <Bar options={hBarOpts()} data={{ labels: sortedStage.map(([k]) => k), datasets: [{ label: "# SMEs", data: sortedStage.map(([, v]) => v), backgroundColor: MIXED_COLORS }] }} />
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "5px", marginTop: "10px", flexWrap: "wrap" }}>
            {stageEntries.map(([s, v]) => (
              <span key={s} style={{ fontSize: "10px", color: B.darkGrey, padding: "3px 7px", borderRadius: "10px" }}>
                {s}: <strong>{v}</strong>
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ─── 4. Learnings ─────────────────────────────────────────────────────────────
const LearningsSection = () => {
  const placeholderLearnings = {
    support: { "Strategic Guidance": 28, "Financial Advisory": 22, "Networks/Access": 18, "Legal Support": 12, "Marketing Support": 10, Operations: 8 },
    services: { "Business Planning": 25, "Financial Modelling": 20, "Legal Compliance": 15, "Marketing Strategy": 12, "Tech Support": 8 },
    barriers: { "Access to Capital": 32, "Market Access": 25, "Skills Gap": 18, "Regulatory Hurdles": 12, Infrastructure: 8 },
  };

  const combined = {};
  Object.entries(placeholderLearnings.support).forEach(([k, v]) => { combined[k] = (combined[k] || 0) + v; });
  Object.entries(placeholderLearnings.services).forEach(([k, v]) => { combined[k] = (combined[k] || 0) + v; });
  const sortedCombined = Object.entries(combined).sort((a, b) => b[1] - a[1]);
  const sortedBarriers = Object.entries(placeholderLearnings.barriers).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: "20px" }}>
      <Card title="Most Requested Support / Services" footer={`Top need: ${sortedCombined[0]?.[0]} — ${sortedCombined[0]?.[1]} applications`}>
        <div style={{ height: `${Math.max(280, sortedCombined.length * 36)}px` }}>
          <Bar options={hBarOpts()} data={{ labels: sortedCombined.map(([k]) => k), datasets: [{ label: "# SMEs", data: sortedCombined.map(([, v]) => v), backgroundColor: MIXED_COLORS }] }} />
        </div>
      </Card>
      <Card title="Capability Gap Distribution" footer={`Biggest gap: ${sortedBarriers[0]?.[0]} — ${sortedBarriers[0]?.[1]} SMEs affected`}>
        <div style={{ height: `${Math.max(280, sortedBarriers.length * 36)}px` }}>
          <Bar options={hBarOpts()} data={{ labels: sortedBarriers.map(([k]) => k), datasets: [{ label: "# SMEs", data: sortedBarriers.map(([, v]) => v), backgroundColor: MIXED_COLORS }] }} />
        </div>
      </Card>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const InclusionImpact = () => {
  const [activeTab, setActiveTab] = useState("demographics");
  return (
    <div>
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", borderBottom: `1px solid ${B.lightGrey}`, paddingBottom: "12px" }}>
        <SubTab label="Demographics" active={activeTab === "demographics"} onClick={() => setActiveTab("demographics")} />
        <SubTab label="Outcomes" active={activeTab === "outcomes"} onClick={() => setActiveTab("outcomes")} />
        <SubTab label="Cohort Selection" active={activeTab === "cohort"} onClick={() => setActiveTab("cohort")} />
        <SubTab label="Learnings" active={activeTab === "learnings"} onClick={() => setActiveTab("learnings")} />
      </div>
      {activeTab === "demographics" && <DemographicsSection />}
      {activeTab === "outcomes" && <OutcomesSection />}
      {activeTab === "cohort" && <CohortSelectionSection />}
      {activeTab === "learnings" && <LearningsSection />}
    </div>
  );
};

export default InclusionImpact;