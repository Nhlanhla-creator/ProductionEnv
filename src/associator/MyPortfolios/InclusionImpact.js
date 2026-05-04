import React, { useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, LineElement, PointElement } from "chart.js";
import { usePortfolio } from "../../context/PortfolioContext";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, LineElement, PointElement);

// Mixed color palette - brown, grey, cream, black, white
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

// Mixed color array for charts - combines browns, greys, creams
const MIXED_COLORS = [
  "#5c3d2e", // dark brown
  "#4a4a4a", // dark grey
  "#8b694e", // medium brown
  "#7a7a7a", // medium grey
  "#b8957a", // light brown
  "#c4c4c4", // light grey
  "#d4bca8", // pale brown
  "#9e9e9e", // warm grey
  "#3d2a1f", // deepest brown
  "#e0d6c8", // cream
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
      <div
        style={{
          marginTop: "12px",
          paddingTop: "10px",
          borderTop: `1px solid ${B.offwhite}`,
          fontSize: "11px",
          color: B.warmGrey,
        }}
      >
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

const doughnutOpts = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: { color: B.darkGrey, font: { size: 9 }, boxWidth: 8 },
    },
  },
};

const hBarOpts = () => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  indexAxis: "y",
  plugins: { legend: { display: false } },
  scales: {
    x: {
      beginAtZero: true,
      grid: { display: true, color: B.lightGrey },
      ticks: { color: B.darkGrey, font: { size: 9 } },
    },
    y: {
      grid: { display: false },
      ticks: { color: B.darkGrey, font: { size: 10 } },
    },
  },
});

const vBarOpts = (yCb, xTitle) => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      title: { display: true, text: xTitle || "Range", color: B.darkGrey },
      grid: { display: false },
      ticks: { color: B.darkGrey, font: { size: 8 } },
    },
    y: {
      title: { display: true, text: "Number of SMEs", color: B.darkGrey },
      beginAtZero: true,
      grid: { color: B.lightGrey },
      ticks: { color: B.darkGrey, callback: yCb || ((v) => v) },
    },
  },
});

const lineOpts = () => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: { color: B.darkGrey, font: { size: 9 } },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: B.lightGrey },
      ticks: { color: B.darkGrey },
    },
    x: {
      ticks: { color: B.darkGrey },
    },
  },
});

const EmptyState = () => (
  <div
    style={{
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: B.warmGrey,
      fontSize: "12px",
      fontStyle: "italic",
    }}
  >
    No data yet
  </div>
);

// Score Range View Component
const ScoreRangeView = ({ min, pipelineAvg, max, cohortAvg, target, suffix = "%" }) => {
  const clamp = (v) => Math.min(Math.max(v || 0, 0), 100);
  const mn = clamp(min);
  const pa = clamp(pipelineAvg);
  const mx = clamp(max);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
      <div style={{ fontSize: "64px", fontWeight: "800", color: B.black, lineHeight: 1 }}>
        {cohortAvg}
        <span style={{ fontSize: "32px" }}>{suffix}</span>
      </div>
      <div style={{ fontSize: "14px", color: B.mediumGrey, fontWeight: 600 }}>Target: {target}
        {suffix}</div>
      <div style={{ width: "100%", marginTop: "4px" }}>
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "12px",
            background: B.lightGrey,
            borderRadius: "6px",
            overflow: "visible",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: `${mx}%`,
              height: "100%",
              background: MIXED_COLORS[4],
              borderRadius: "6px",
              overflow: "hidden",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: `${pa}%`,
              height: "100%",
              background: MIXED_COLORS[2],
              borderRadius: "6px",
              overflow: "hidden",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: `${mn}%`,
              height: "100%",
              background: MIXED_COLORS[0],
              borderRadius: "6px",
              overflow: "hidden",
            }}
          />
        </div>
        <div style={{ position: "relative", width: "95%", height: "38px", marginTop: "6px" }}>
          {[
            { val: mn, label: "Min", color: MIXED_COLORS[0] },
            { val: pa, label: "Matches Avg", color: MIXED_COLORS[2] },
            { val: mx, label: "Max", color: MIXED_COLORS[4] },
          ].map(({ val, label, color }) => (
            <div
              key={label}
              style={{
                position: "absolute",
                left: `${val}%`,
                transform: "translateX(-50%)",
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
            >
              <div style={{ fontSize: "14px", fontWeight: 700, color }}>{val}
                {suffix}</div>
            </div>
          ))}
        </div>
        <div style={{ position: "relative", width: "95%", height: "20px", marginTop: "6px" }}>
          {[
            { label: "Min", color: MIXED_COLORS[0] },
            { label: "Cohort Avg", color: MIXED_COLORS[2] },
            { label: "Max", color: MIXED_COLORS[4] },
          ].map(({ label, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "4px", marginRight: "16px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "6px", background: color }} />
              <span style={{ fontSize: "11px", color }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Sub-components

// 1. InclusionImpact - Beneficiary Demographics & Support Offered
const InclusionImpactSection = () => {
  const { marketPulse } = usePortfolio();
  const [beneficiaryType, setBeneficiaryType] = useState("female");

  const beneficiaries = marketPulse?.marketStructure?.inclusionImpact?.beneficiaries || {
    female: { zarPct: 32, countPct: 35, trend: [28, 30, 32, 35] },
    youth: { zarPct: 28, countPct: 30, trend: [22, 25, 28, 30] },
    hdi: { zarPct: 52, countPct: 55, trend: [45, 48, 52, 55] },
    disabled: { zarPct: 4, countPct: 6, trend: [2, 3, 3, 4] },
  };
  const supportOffered = marketPulse?.marketStructure?.inclusionImpact?.supportOffered || {
    "Strategic Guidance": 45,
    "Networks/Access": 38,
    "Financial Advisory": 32,
    "Legal Support": 25,
    "Marketing Support": 28,
    Operations: 20,
  };
  const topRequests = marketPulse?.marketStructure?.inclusionImpact?.topRequests || [
    "Strategic Guidance",
    "Networks/Access",
    "Financial Advisory",
  ];
  const bottomRequests = marketPulse?.marketStructure?.inclusionImpact?.bottomRequests || [
    "Legal Support",
    "Operations",
    "Marketing Support",
  ];

  const beneficiaryLabels = { female: "Female", youth: "Youth", hdi: "HDI", disabled: "Disabled" };
  const current = beneficiaries[beneficiaryType];

  const sortedSupport = Object.entries(supportOffered).sort((a, b) => b[1] - a[1]);
  const topSupport = sortedSupport.slice(0, 3);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
      <Card title="Beneficiary Demographics">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
            <Pill label="Female" active={beneficiaryType === "female"} onClick={() => setBeneficiaryType("female")} />
            <Pill label="Youth" active={beneficiaryType === "youth"} onClick={() => setBeneficiaryType("youth")} />
            <Pill label="HDI" active={beneficiaryType === "hdi"} onClick={() => setBeneficiaryType("hdi")} />
            <Pill label="Disabled" active={beneficiaryType === "disabled"} onClick={() => setBeneficiaryType("disabled")} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
            <div>
              <div style={{ fontSize: "11px", color: B.warmGrey }}>By ZAR</div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: B.black }}>{current.zarPct}%</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: B.warmGrey }}>By Count</div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: B.black }}>{current.countPct}%</div>
            </div>
          </div>
          <div style={{ height: "160px" }}>
            <Line
              options={lineOpts()}
              data={{
                labels: ["2022", "2023", "2024", "2025"],
                datasets: [
                  {
                    label: `${beneficiaryLabels[beneficiaryType]} Beneficiaries (%)`,
                    data: current.trend,
                    borderColor: MIXED_COLORS[2],
                    backgroundColor: "transparent",
                    tension: 0.3,
                    fill: false,
                  },
                ],
              }}
            />
          </div>
        </div>
      </Card>

      <Card
        title="Additional Support / Advice Offered"
        footer={
          <div style={{ fontSize: "11px", color: B.warmGrey }}>
            Top requested: {topSupport.map((s) => s[0]).join(", ")}
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
          <div style={{ height: "200px" }}>
            <Bar
              options={hBarOpts()}
              data={{
                labels: Object.keys(supportOffered),
                datasets: [
                  {
                    label: "% of SMEs",
                    data: Object.values(supportOffered),
                    backgroundColor: MIXED_COLORS[2],
                  },
                ],
              }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "10px" }}>
            <div style={{ background: B.cream, padding: "8px", borderRadius: "6px", color: B.darkGrey }}>
              <strong>Top 3 Most Requested:</strong>
              <br />
              {topRequests.map((r, i) => `${i + 1}. ${r}`).join("\n")}
            </div>
            <div style={{ background: B.cream, padding: "8px", borderRadius: "6px", color: B.darkGrey }}>
              <strong>Bottom 3 Most Requested:</strong>
              <br />
              {bottomRequests.map((r, i) => `${i + 1}. ${r}`).join("\n")}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// 2. Outcomes - Jobs Created
const OutcomesSection = () => {
  const [view, setView] = useState("sme");

  // Placeholder data - would come from context in real implementation
  const placeholderJobs = {
    total: 385,
    direct: 245,
    indirect: 140,
    perSME: [
      { name: "TechSolve", jobs: 45, sector: "Fintech" },
      { name: "GreenEnergy", jobs: 32, sector: "Clean Energy" },
      { name: "HealthPlus", jobs: 28, sector: "Healthtech" },
      { name: "EduTech", jobs: 24, sector: "Edtech" },
      { name: "LogiSync", jobs: 18, sector: "Logistics" },
      { name: "AgriGrow", jobs: 15, sector: "Agritech" },
    ],
    perSector: [
      { sector: "Fintech", jobs: 78 },
      { sector: "Clean Energy", jobs: 65 },
      { sector: "Healthtech", jobs: 52 },
      { sector: "Edtech", jobs: 48 },
      { sector: "Logistics", jobs: 42 },
      { sector: "Agritech", jobs: 38 },
    ],
  };

  const perSME = [...placeholderJobs.perSME].sort((a, b) => b.jobs - a.jobs);
  const perSector = [...placeholderJobs.perSector].sort((a, b) => b.jobs - a.jobs);
  const totalSMEs = 45;
  const avgJobs = perSME.length > 0 ? (perSME.reduce((a, b) => a + b.jobs, 0) / totalSMEs).toFixed(1) : 0;

  const footer =
    view === "sme"
      ? {
          left: `Portfolio Avg: ${avgJobs} jobs/SME`,
          right: "Target: 15",
        }
      : {
          left: `Total: ${perSector.reduce((a, b) => a + b.jobs, 0)} jobs`,
          right: `${perSector.length} active sectors`,
        };

  const isEmpty = view === "sme" ? perSME.length === 0 : perSector.length === 0;
  const innerH = Math.max(280, (view === "sme" ? perSME.length : perSector.length) * 36);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
      <Card title="Total Number of Jobs Created / Projected">
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <div style={{ fontSize: "64px", fontWeight: "800", color: B.black, lineHeight: 1 }}>
            {placeholderJobs.total}
          </div>
          <div style={{ display: "flex", gap: "20px", marginTop: "14px" }}>
            {[
              ["Direct", placeholderJobs.direct, MIXED_COLORS[0]],
              ["Indirect", placeholderJobs.indirect, MIXED_COLORS[2]],
            ].map(([l, v, col]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: B.warmGrey, marginBottom: "3px" }}>{l}</div>
                <div style={{ fontSize: "18px", fontWeight: "700", color: col }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card
        title="Jobs Created"
        footer={
          !isEmpty ? (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", color: B.black, fontWeight: 600 }}>{footer.left}</span>
              <span style={{ fontSize: "12px", color: B.warmGrey }}>{footer.right}</span>
            </div>
          ) : undefined
        }
      >
        <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexShrink: 0 }}>
          <Pill label="Per SME" active={view === "sme"} onClick={() => setView("sme")} />
          <Pill label="Per Sector" active={view === "sector"} onClick={() => setView("sector")} />
        </div>
        {isEmpty ? (
          <EmptyState />
        ) : view === "sme" ? (
          <div style={{ flex: 1, overflowY: perSME.length > 7 ? "auto" : "visible" }}>
            <div style={{ height: `${innerH}px` }}>
              <Bar
                options={hBarOpts()}
                data={{
                  labels: perSME.map((s) => s.name),
                  datasets: [
                    {
                      label: "Jobs",
                      data: perSME.map((s) => s.jobs),
                      backgroundColor: MIXED_COLORS.slice(0, perSME.length),
                    },
                  ],
                }}
              />
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: perSector.length > 7 ? "auto" : "visible" }}>
            <div style={{ height: `${innerH}px` }}>
              <Bar
                options={hBarOpts()}
                data={{
                  labels: perSector.map((s) => s.sector),
                  datasets: [
                    {
                      label: "Jobs (direct + indirect)",
                      data: perSector.map((s) => s.jobs),
                      backgroundColor: MIXED_COLORS.slice(0, perSector.length),
                    },
                  ],
                }}
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

// 3. CohortSelection - Match Strength, BIG Score, Readiness, Vetting, Pipeline
const CohortSelectionSection = () => {
  const [matchView, setMatchView] = useState("range");
  const [bigView, setBigView] = useState("range");
  const [pipelineView, setPipelineView] = useState("stage");

  // Placeholder data
  const placeholderData = {
    match: {
      min: 45,
      avg: 68,
      max: 92,
      cohortAvg: 68,
      dist: { "0-20": 2, "21-40": 5, "41-60": 12, "61-80": 18, "81-100": 8 },
    },
    bigScore: {
      min: 38,
      avg: 62,
      max: 88,
      cohortAvg: 62,
      dist: { "0-20": 3, "21-40": 7, "41-60": 14, "61-80": 15, "81-100": 6 },
    },
    fundingReadinessRate: 58,
    totalSMEs: 45,
    vetting: { avg: 8.5, target: 10 },
    stageDist: {
      Application: 45,
      Vetting: 28,
      "Due Diligence": 18,
      "Deal Close": 12,
      "Post-Investment": 8,
    },
  };

  const matchDist = placeholderData.match.dist;
  const bigDist = placeholderData.bigScore.dist;
  const stageDist = placeholderData.stageDist;

  const stageEntries = Object.entries(stageDist).filter(([, v]) => v > 0);
  const sortedStage = [...stageEntries].sort((a, b) => b[1] - a[1]);
  const hbarLabels = sortedStage.map(([k]) => k);
  const hbarValues = sortedStage.map(([, v]) => v);
  const innerH = Math.max(280, hbarLabels.length * 36);

  const R = 54;
  const CIRC = 2 * Math.PI * R;
  const offset = CIRC - (CIRC * Math.min(placeholderData.vetting.avg, 60)) / 60;
  const variance = placeholderData.vetting.avg - placeholderData.vetting.target;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
      <Card title="Average Match Strength (%)">
        <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexShrink: 0 }}>
          <Pill label="Range" active={matchView === "range"} onClick={() => setMatchView("range")} />
          <Pill label="Histogram" active={matchView === "histogram"} onClick={() => setMatchView("histogram")} />
        </div>
        {matchView === "range" ? (
          <ScoreRangeView
            min={placeholderData.match.min}
            pipelineAvg={placeholderData.match.avg}
            max={placeholderData.match.max}
            cohortAvg={placeholderData.match.cohortAvg}
            target={75}
          />
        ) : (
          <div style={{ height: "280px" }}>
            <Bar
              options={vBarOpts((v) => v, "Average Match Strength (%)")}
              data={{
                labels: Object.keys(matchDist),
                datasets: [{ label: "SMEs", data: Object.values(matchDist), backgroundColor: MIXED_COLORS[0] }],
              }}
            />
          </div>
        )}
      </Card>

      <Card title="Average BIG Score (%)">
        <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexShrink: 0 }}>
          <Pill label="Range" active={bigView === "range"} onClick={() => setBigView("range")} />
          <Pill label="Histogram" active={bigView === "histogram"} onClick={() => setBigView("histogram")} />
        </div>
        {bigView === "range" ? (
          <ScoreRangeView
            min={placeholderData.bigScore.min}
            pipelineAvg={placeholderData.bigScore.avg}
            max={placeholderData.bigScore.max}
            cohortAvg={placeholderData.bigScore.cohortAvg}
            target={70}
          />
        ) : (
          <div style={{ height: "280px" }}>
            <Bar
              options={vBarOpts((v) => v, "Average BIG Score (%)")}
              data={{
                labels: Object.keys(bigDist),
                datasets: [{ label: "SMEs", data: Object.values(bigDist), backgroundColor: MIXED_COLORS[2] }],
              }}
            />
          </div>
        )}
      </Card>

      <Card title="Funding Readiness Rate (%)">
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          <div style={{ fontSize: "64px", fontWeight: "800", color: B.black, lineHeight: 1 }}>
            {placeholderData.fundingReadinessRate}
            <span style={{ fontSize: "32px" }}>%</span>
          </div>
          <div style={{ fontSize: "14px", color: B.mediumGrey, fontWeight: 600 }}>
            {Math.round((placeholderData.fundingReadinessRate / 100) * placeholderData.totalSMEs)} of{" "}
            {placeholderData.totalSMEs} SMEs funding-ready
          </div>
          <div style={{ width: "100%", marginTop: "4px" }}>
            <div
              style={{
                width: "100%",
                background: B.lightGrey,
                borderRadius: "6px",
                height: "12px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${placeholderData.fundingReadinessRate}%`,
                  background: MIXED_COLORS[2],
                  height: "100%",
                  borderRadius: "6px",
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: "4px" }}>
              <span style={{ fontSize: "14px", color: B.warmGrey }}>Current: {placeholderData.fundingReadinessRate}%</span>
              <span style={{ fontSize: "14px", color: B.warmGrey }}>Target: 70%</span>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Average Vetting Time (Days)">
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <svg width="260" height="260" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r={R} stroke={B.lightGrey} strokeWidth="11" fill="none" />
            <circle
              cx="80"
              cy="80"
              r={R}
              stroke={placeholderData.vetting.avg <= placeholderData.vetting.target ? MIXED_COLORS[2] : MIXED_COLORS[0]}
              strokeWidth="11"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={offset}
              transform="rotate(-90 80 80)"
            />
            <text x="80" y="74" textAnchor="middle" fill={B.black} fontSize="30" fontWeight="800">
              {placeholderData.vetting.avg.toFixed(0)}
            </text>
            <text x="80" y="93" textAnchor="middle" fill={B.warmGrey} fontSize="13">
              days
            </text>
          </svg>
          <div style={{ display: "flex", gap: "24px" }}>
            {[
              ["Actual", Math.round(placeholderData.vetting.avg) + "d", MIXED_COLORS[0]],
              ["Target", placeholderData.vetting.target + "d", MIXED_COLORS[2]],
              [
                "Variance",
                (variance > 0 ? "+" : "") + Math.round(variance) + "d",
                variance > 0 ? "#c62828" : MIXED_COLORS[2],
              ],
            ].map(([l, v, col]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "14px", color: B.warmGrey, marginBottom: "3px" }}>{l}</div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: col }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card title="SME Pipeline Progress">
        <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexShrink: 0 }}>
          <Pill label="Stage Dist." active={pipelineView === "stage"} onClick={() => setPipelineView("stage")} />
          <Pill label="Funnel" active={pipelineView === "funnel"} onClick={() => setPipelineView("funnel")} />
        </div>
        {stageEntries.length === 0 ? (
          <EmptyState />
        ) : pipelineView === "stage" ? (
          <div style={{ flex: 1, overflowY: hbarLabels.length > 7 ? "auto" : "visible" }}>
            <div style={{ height: `${innerH}px` }}>
              <Bar
                options={hBarOpts()}
                data={{
                  labels: hbarLabels,
                  datasets: [{ label: "# SMEs", data: hbarValues, backgroundColor: MIXED_COLORS.slice(0, hbarLabels.length) }],
                }}
              />
            </div>
          </div>
        ) : (
          <div style={{ height: "280px" }}>
            <Doughnut
              options={doughnutOpts}
              data={{
                labels: stageEntries.map(([k]) => k),
                datasets: [
                  {
                    data: stageEntries.map(([, v]) => v),
                    backgroundColor: MIXED_COLORS.slice(0, stageEntries.length),
                    borderWidth: 2,
                    borderColor: "#fff",
                  },
                ],
              }}
            />
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "5px",
            marginTop: "10px",
            flexWrap: "wrap",
            flexShrink: 0,
          }}
        >
          {stageEntries.map(([s, v], i) => (
            <span key={s} style={{ fontSize: "10px", color: B.darkGrey, padding: "3px 7px", borderRadius: "10px" }}>
              {s}: <strong>{v}</strong>
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
};

// 4. Learnings - Support Areas & Capability Gaps
const LearningsSection = () => {
  // Placeholder data
  const placeholderLearnings = {
    support: {
      "Strategic Guidance": 28,
      "Financial Advisory": 22,
      "Networks/Access": 18,
      "Legal Support": 12,
      "Marketing Support": 10,
      Operations: 8,
    },
    services: {
      "Business Planning": 25,
      "Financial Modelling": 20,
      "Legal Compliance": 15,
      "Marketing Strategy": 12,
      "Tech Support": 8,
    },
    barriers: {
      "Access to Capital": 32,
      "Market Access": 25,
      "Skills Gap": 18,
      "Regulatory Hurdles": 12,
      Infrastructure: 8,
    },
  };

  // Combine support and services
  const combined = {};
  Object.entries(placeholderLearnings.support).forEach(([k, v]) => {
    combined[k] = (combined[k] || 0) + v;
  });
  Object.entries(placeholderLearnings.services).forEach(([k, v]) => {
    combined[k] = (combined[k] || 0) + v;
  });

  const sortedCombined = Object.entries(combined).sort((a, b) => b[1] - a[1]);
  const sortedBarriers = Object.entries(placeholderLearnings.barriers).sort((a, b) => b[1] - a[1]);

  const combinedInnerH = Math.max(280, sortedCombined.length * 36);
  const barriersInnerH = Math.max(280, sortedBarriers.length * 36);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: "20px" }}>
      <Card
        title="Most Requested Support / Services"
        footer={
          <div style={{ fontSize: "11px", color: B.warmGrey }}>
            Top need: {sortedCombined[0]?.[0]} — {sortedCombined[0]?.[1]} application
            {sortedCombined[0]?.[1] !== 1 ? "s" : ""}
          </div>
        }
      >
        <div style={{ flex: 1, overflowY: sortedCombined.length > 7 ? "auto" : "visible" }}>
          <div style={{ height: `${combinedInnerH}px` }}>
            <Bar
              options={hBarOpts()}
              data={{
                labels: sortedCombined.map(([k]) => k),
                datasets: [
                  {
                    label: "# SMEs",
                    data: sortedCombined.map(([, v]) => v),
                    backgroundColor: MIXED_COLORS.slice(0, sortedCombined.length),
                  },
                ],
              }}
            />
          </div>
        </div>
      </Card>

      <Card
        title="Capability Gap Distribution"
        footer={
          <div style={{ fontSize: "11px", color: B.warmGrey }}>
            Biggest gap: {sortedBarriers[0]?.[0]} — {sortedBarriers[0]?.[1]} SME
            {sortedBarriers[0]?.[1] !== 1 ? "s" : ""} affected
          </div>
        }
      >
        <div style={{ flex: 1, overflowY: sortedBarriers.length > 7 ? "auto" : "visible" }}>
          <div style={{ height: `${barriersInnerH}px` }}>
            <Bar
              options={hBarOpts()}
              data={{
                labels: sortedBarriers.map(([k]) => k),
                datasets: [
                  {
                    label: "# SMEs",
                    data: sortedBarriers.map(([, v]) => v),
                    backgroundColor: MIXED_COLORS.slice(0, sortedBarriers.length),
                  },
                ],
              }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

// Main InclusionImpact Component
const InclusionImpact = () => {
  const [activeTab, setActiveTab] = useState("beneficiaries");

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
          borderBottom: `1px solid ${B.lightGrey}`,
          paddingBottom: "12px",
        }}
      >
        <SubTab label="Beneficiaries & Support" active={activeTab === "beneficiaries"} onClick={() => setActiveTab("beneficiaries")} />
        <SubTab label="Jobs & Outcomes" active={activeTab === "outcomes"} onClick={() => setActiveTab("outcomes")} />
        <SubTab label="Cohort Selection" active={activeTab === "cohort"} onClick={() => setActiveTab("cohort")} />
        <SubTab label="Learnings" active={activeTab === "learnings"} onClick={() => setActiveTab("learnings")} />
      </div>

      {activeTab === "beneficiaries" && <InclusionImpactSection />}
      {activeTab === "outcomes" && <OutcomesSection />}
      {activeTab === "cohort" && <CohortSelectionSection />}
      {activeTab === "learnings" && <LearningsSection />}
    </div>
  );
};

// Reusable SubTab component
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

export default InclusionImpact;