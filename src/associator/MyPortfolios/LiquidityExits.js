import React, { useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { usePortfolio } from "../../context/PortfolioContext";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const B = {
  darkest: "#3b2409", dark: "#5e3f26", medium: "#7d5a36",
  warm: "#9c7c54", light: "#b8a082", pale: "#d4c4b0", offwhite: "#f0e8de",
};
const C = ["#3b2409", "#5e3f26", "#7d5a36", "#9c7c54", "#b8a082", "#c2a882", "#d4c4b0", "#a08060"];

// All charts sit on WHITE cards — axis labels must be DARK to be visible
const TICK = "#4a352f";   // dark brown tick/label colour
const GRID = "#e8ddd5";   // subtle grid line

const Card = ({ title, children }) => (
  <div style={{ background: "#fff", borderRadius: "10px", padding: "20px", minHeight: "400px", boxShadow: "0 2px 10px rgba(59,36,9,0.07)", border: `1px solid ${B.pale}`, display: "flex", flexDirection: "column" }}>
    <div style={{ paddingBottom: "10px", borderBottom: `1px solid ${B.offwhite}`, marginBottom: "10px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: "700", color: B.dark, margin: 0 }}>{title}</h3>
    </div>
    <div style={{ flex: 1 }}>{children}</div>
  </div>
);

// Manual legend — dark text on white card
const ManualLegend = ({ labels, colors, values }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: "10px" }}>
    {labels.map((label, i) => (
      <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: colors[i % colors.length], flexShrink: 0 }} />
        <span style={{ fontSize: "11px", color: TICK, fontWeight: 500 }}>
          {label}{values ? ` (${values[i]}%)` : ""}
        </span>
      </div>
    ))}
  </div>
);

const ViewTrendButton = ({ show, onClick }) => (
  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
    <button
      onClick={onClick}
      style={{
        padding: "4px 12px", borderRadius: "20px", cursor: "pointer", fontSize: "10px",
        border: `1.5px solid ${show ? B.darkest : B.pale}`,
        fontWeight: show ? 700 : 500,
        background: show ? B.darkest : "#fff",
        color: show ? "#fff" : B.dark,
      }}
    >
      {show ? "Hide Trend ▲" : "View Trend ▼"}
    </button>
  </div>
);

const TrendChart = ({ trendData, colors }) => {
  const keys = Object.keys(trendData).filter((k) => k !== "years");
  const datasets = keys.map((key, i) => ({
    label: key, data: trendData[key], backgroundColor: colors[i % colors.length],
  }));
  return (
    <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${B.offwhite}` }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginBottom: "8px" }}>
        {keys.map((key, i) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: colors[i % colors.length], flexShrink: 0 }} />
            <span style={{ fontSize: "10px", color: TICK, fontWeight: 500 }}>{key}</span>
          </div>
        ))}
      </div>
      <div style={{ height: "140px" }}>
        <Bar
          options={{
            responsive: true, maintainAspectRatio: false, animation: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { stacked: true, ticks: { color: TICK, font: { size: 8 } }, grid: { display: false } },
              y: { stacked: true, beginAtZero: true, grid: { color: GRID }, ticks: { color: TICK, font: { size: 8 }, callback: (v) => v } },
            },
          }}
          data={{ labels: trendData.years, datasets }}
        />
      </div>
    </div>
  );
};

// Doughnut — no built-in legend (manual below)
const doughnutOpts = {
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed}%` } },
  },
};

// Vertical bar — dark labels (sits on white card)
const vBarOpts = (yTitle, yCb) => ({
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      title: { display: true, text: "Range", color: TICK, font: { size: 11 } },
      grid: { display: false },
      ticks: { color: TICK, font: { size: 10 } },
    },
    y: {
      title: { display: true, text: yTitle || "Number of Exits", color: TICK, font: { size: 11 } },
      beginAtZero: true,
      grid: { color: GRID },
      ticks: { color: TICK, font: { size: 10 }, callback: yCb || ((v) => v) },
    },
  },
});

// Horizontal bar — dark labels (sits on white card)
const hBarOpts = () => ({
  responsive: true, maintainAspectRatio: false, animation: false, indexAxis: "y",
  plugins: { legend: { display: false } },
  scales: {
    x: {
      beginAtZero: true,
      grid: { display: true, color: GRID },
      ticks: { color: TICK, font: { size: 10 } },
    },
    y: {
      grid: { display: false },
      ticks: { color: TICK, font: { size: 11 } },
    },
  },
});

const LiquidityExits = () => {
  const { marketPulse } = usePortfolio();
  const [showExitTypeTrend, setShowExitTypeTrend] = useState(false);

  const exitsData = marketPulse?.liquidityExits || {
    totalExits: { zar: 185, count: 24 },
    exitsBySector: { Fintech: 6, Healthtech: 4, Agritech: 3, Edtech: 3, Logistics: 4, Others: 4 },
    avgTimeToExit: { avg: 5.8, distribution: ["<2y", "2-3y", "3-4y", "4-5y", "5y+"], counts: [2, 5, 8, 6, 3] },
    exitTypes: { "Trade Sale": 45, "Secondary Sale": 30, IPO: 10, Buyback: 15 },
    exitSize: { mean: 32.5, median: 18.2, distribution: ["<R10M", "R10-25M", "R25-50M", "R50-100M", "R100M+"], counts: [3, 7, 6, 5, 3] },
    returnDistribution: { "<1x": 8, "1-2x": 25, "2-3x": 32, "3-5x": 20, "5x+": 15 },
  };

  const exitTypeTrends = marketPulse?.liquidityExits?.exitTypeTrends || {
    years: ["2022", "2023", "2024", "2025"],
    "Trade Sale": [38, 40, 43, 45],
    "Secondary Sale": [24, 27, 29, 30],
    IPO: [8, 9, 9, 10],
    Buyback: [12, 13, 14, 15],
  };

  const exitTypeLabels = Object.keys(exitsData.exitTypes);
  const exitTypeValues = Object.values(exitsData.exitTypes);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>

      {/* Card 1: Total Exits by Sector */}
      <Card title="Total Exits (by Sector)">
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "20px", height: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
            <div>
              <div style={{ fontSize: "11px", color: B.warm }}>Total Exit Value</div>
              <div style={{ fontSize: "36px", fontWeight: 800, color: B.darkest }}>R {exitsData.totalExits.zar}M</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: B.warm }}>Number of Exits</div>
              <div style={{ fontSize: "36px", fontWeight: 800, color: B.darkest }}>{exitsData.totalExits.count}</div>
            </div>
          </div>
          <div style={{ height: "200px" }}>
            <Bar
              options={hBarOpts()}
              data={{
                labels: Object.keys(exitsData.exitsBySector),
                datasets: [{ label: "Exits by Sector", data: Object.values(exitsData.exitsBySector), backgroundColor: C }],
              }}
            />
          </div>
        </div>
      </Card>

      {/* Card 2: Average Time to Exit */}
      <Card title="Average Time to Exit">
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "16px", height: "100%" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "40px", fontWeight: 800, color: B.darkest }}>{exitsData.avgTimeToExit.avg} years</div>
            <div style={{ fontSize: "11px", color: B.warm }}>Average Time to Exit</div>
          </div>
          <div style={{ height: "220px" }}>
            <Bar
              options={vBarOpts("Number of Exits")}
              data={{
                labels: exitsData.avgTimeToExit.distribution,
                datasets: [{ label: "Number of Exits", data: exitsData.avgTimeToExit.counts, backgroundColor: B.darkest }],
              }}
            />
          </div>
        </div>
      </Card>

      {/* Card 3: Exit Type (doughnut + View Trend) & Exit Size */}
      <Card title="Exit Type & Exit Size">
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", height: "100%" }}>
          <div style={{ height: "160px" }}>
            <Doughnut
              options={doughnutOpts}
              data={{ labels: exitTypeLabels, datasets: [{ data: exitTypeValues, backgroundColor: C }] }}
            />
          </div>
          <ManualLegend labels={exitTypeLabels} colors={C} values={exitTypeValues} />
          <ViewTrendButton show={showExitTypeTrend} onClick={() => setShowExitTypeTrend((p) => !p)} />
          {showExitTypeTrend && <TrendChart trendData={exitTypeTrends} colors={C} />}

          <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center", paddingTop: "10px", borderTop: `1px solid ${B.offwhite}` }}>
            <div>
              <div style={{ fontSize: "11px", color: B.warm }}>Mean Exit Size</div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: B.dark }}>R{exitsData.exitSize.mean}M</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: B.warm }}>Median Exit Size</div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: B.dark }}>R{exitsData.exitSize.median}M</div>
            </div>
          </div>

          <div style={{ height: "110px" }}>
            <Bar
              options={vBarOpts("Number of Exits", (v) => `R${v}`)}
              data={{
                labels: exitsData.exitSize.distribution,
                datasets: [{ label: "Number of Exits", data: exitsData.exitSize.counts, backgroundColor: B.light }],
              }}
            />
          </div>
        </div>
      </Card>

      {/* Card 4: Return Distribution */}
      <Card title="Return Distribution">
        <div style={{ height: "320px" }}>
          <Bar
            options={vBarOpts("% of Exits", (v) => `${v}%`)}
            data={{
              labels: Object.keys(exitsData.returnDistribution),
              datasets: [{ label: "% of Exits", data: Object.values(exitsData.returnDistribution), backgroundColor: B.darkest }],
            }}
          />
        </div>
      </Card>

    </div>
  );
};

export default LiquidityExits;