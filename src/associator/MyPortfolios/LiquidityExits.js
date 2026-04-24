import React from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { usePortfolio } from "../../context/PortfolioContext";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const B = { darkest: "#3b2409", dark: "#5e3f26", medium: "#7d5a36", warm: "#9c7c54", light: "#b8a082", pale: "#d4c4b0", offwhite: "#f0e8de" };
const C = ["#3b2409", "#5e3f26", "#7d5a36", "#9c7c54", "#b8a082", "#c2a882", "#d4c4b0", "#a08060"];

const Card = ({ title, children }) => (
  <div style={{ background: "#fff", borderRadius: "10px", padding: "20px", minHeight: "400px", boxShadow: "0 2px 10px rgba(59,36,9,0.07)", border: `1px solid ${B.pale}`, display: "flex", flexDirection: "column" }}>
    <div style={{ paddingBottom: "10px", borderBottom: `1px solid ${B.offwhite}`, marginBottom: "10px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: "700", color: B.dark, margin: 0 }}>{title}</h3>
    </div>
    <div style={{ flex: 1 }}>{children}</div>
  </div>
);

const doughnutOpts = {
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: { legend: { position: "bottom", labels: { color: B.dark, font: { size: 10 }, boxWidth: 10 } } },
};

const vBarOpts = (yCb) => ({
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { title: { display: true, text: "Range", color: B.dark }, grid: { display: false }, ticks: { color: B.dark, font: { size: 9 } } },
    y: { title: { display: true, text: "Number of Exits", color: B.dark }, beginAtZero: true, grid: { color: B.offwhite }, ticks: { color: B.dark, callback: yCb || (v => v) } },
  },
});

const hBarOpts = () => ({
  responsive: true, maintainAspectRatio: false, animation: false, indexAxis: "y",
  plugins: { legend: { display: false } },
  scales: {
    x: { beginAtZero: true, grid: { display: true, color: B.offwhite }, ticks: { color: B.dark, font: { size: 9 } } },
    y: { grid: { display: false }, ticks: { color: B.dark, font: { size: 10 } } },
  },
});

const LiquidityExits = () => {
  const { marketPulse } = usePortfolio();

  const exitsData = marketPulse?.liquidityExits || {
    totalExits: { zar: 185, count: 24 },
    exitsBySector: { Fintech: 6, Healthtech: 4, Agritech: 3, Edtech: 3, Logistics: 4, Others: 4 },
    avgTimeToExit: { avg: 5.8, distribution: ["<2y", "2-3y", "3-4y", "4-5y", "5y+"], counts: [2, 5, 8, 6, 3] },
    exitTypes: { "Trade Sale": 45, "Secondary Sale": 30, IPO: 10, Buyback: 15 },
    exitSize: { mean: 32.5, median: 18.2, distribution: ["<R10M", "R10-25M", "R25-50M", "R50-100M", "R100M+"], counts: [3, 7, 6, 5, 3] },
    returnDistribution: { "<1x": 8, "1-2x": 25, "2-3x": 32, "3-5x": 20, "5x+": 15 }
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
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
            <div style={{ height: "180px" }}>
              <Bar options={hBarOpts()} data={{ labels: Object.keys(exitsData.exitsBySector), datasets: [{ label: "Exits by Sector", data: Object.values(exitsData.exitsBySector), backgroundColor: C }] }} />
            </div>
          </div>
        </Card>

        <Card title="Average Time to Exit">
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "16px", height: "100%" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "40px", fontWeight: 800, color: B.darkest }}>{exitsData.avgTimeToExit.avg} years</div>
              <div style={{ fontSize: "11px", color: B.warm }}>Average Time to Exit</div>
            </div>
            <div style={{ height: "200px" }}>
              <Bar options={vBarOpts()} data={{ labels: exitsData.avgTimeToExit.distribution, datasets: [{ label: "Number of Exits", data: exitsData.avgTimeToExit.counts, backgroundColor: B.darkest }] }} />
            </div>
          </div>
        </Card>

        <Card title="Exit Type & Exit Size">
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", height: "100%" }}>
            <div style={{ height: "140px" }}>
              <Doughnut options={doughnutOpts} data={{ labels: Object.keys(exitsData.exitTypes), datasets: [{ data: Object.values(exitsData.exitTypes), backgroundColor: C }] }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center", paddingTop: "8px", borderTop: `1px solid ${B.offwhite}` }}>
              <div>
                <div style={{ fontSize: "11px", color: B.warm }}>Mean Exit Size</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: B.dark }}>R{exitsData.exitSize.mean}M</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: B.warm }}>Median Exit Size</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: B.dark }}>R{exitsData.exitSize.median}M</div>
              </div>
            </div>
            <div style={{ height: "100px", marginTop: "8px" }}>
              <Bar options={vBarOpts(v => `R${v}`)} data={{ labels: exitsData.exitSize.distribution, datasets: [{ label: "Number of Exits", data: exitsData.exitSize.counts, backgroundColor: B.light }] }} />
            </div>
          </div>
        </Card>

        <Card title="Return Distribution">
          <div style={{ height: "320px" }}>
            <Bar options={vBarOpts(v => `${v}x`)} data={{ labels: Object.keys(exitsData.returnDistribution), datasets: [{ label: "% of Exits", data: Object.values(exitsData.returnDistribution), backgroundColor: B.darkest }] }} />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LiquidityExits;