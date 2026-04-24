import React, { useState } from "react";

const B = { darkest: "#3b2409", dark: "#5e3f26", medium: "#7d5a36", warm: "#9c7c54", light: "#b8a082", pale: "#d4c4b0", offwhite: "#f0e8de" };

const Card = ({ title, children }) => (
  <div style={{ background: "#fff", borderRadius: "10px", padding: "20px", minHeight: "320px", boxShadow: "0 2px 10px rgba(59,36,9,0.07)", border: `1px solid ${B.pale}`, display: "flex", flexDirection: "column" }}>
    <div style={{ paddingBottom: "10px", borderBottom: `1px solid ${B.offwhite}`, marginBottom: "10px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: "700", color: B.dark, margin: 0 }}>{title}</h3>
    </div>
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>{children}</div>
  </div>
);

const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding: "5px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "11px", border: `1.5px solid ${active ? B.medium : B.pale}`, fontWeight: active ? 700 : 500, background: active ? B.medium : "#fff", color: active ? "#fff" : B.medium }}>
    {label}
  </button>
);

const MEDALS = ["🥇", "🥈", "🥉"];
const WARN = ["⚠️", "🔸", "🔹"];

const RankedTable = ({ rows, isTop, metricLabel, unit = "", fmt }) => {
  if (!rows || rows.length === 0) {
    return <div style={{ color: B.light, fontSize: "12px", fontStyle: "italic", padding: "1rem" }}>Not enough data yet</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
      {rows.map((row, i) => (
        <div key={row.name + i} style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "10px 12px", borderRadius: "8px",
          background: isTop ? (i === 0 ? "#f5ede4" : B.offwhite) : (i === 0 ? "#fdf0ec" : B.offwhite),
          border: `1px solid ${isTop ? B.pale : "#e8d4cc"}`,
        }}>
          <span style={{ fontSize: "18px", minWidth: "24px" }}>{isTop ? MEDALS[i] : WARN[i]}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "13px", fontWeight: "700", color: B.darkest }}>{row.name}</div>
            <div style={{ fontSize: "11px", color: B.warm }}>{row.sector || "–"} · {row.stage || "–"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "16px", fontWeight: "800", color: isTop ? B.dark : "#9b3a1a" }}>
              {fmt ? fmt(row) : (row.value ?? "–")}{unit}
            </div>
            <div style={{ fontSize: "10px", color: B.light }}>{metricLabel}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

const InsightBox = ({ text }) => (
  <div style={{ marginTop: "12px", padding: "10px 12px", background: "#fdf8f4", borderRadius: "7px", border: `1px dashed ${B.pale}`, fontSize: "12px", color: B.dark, fontStyle: "italic", lineHeight: 1.5 }}>
    💡 {text}
  </div>
);

// Placeholder data
const placeholderData = {
  topBig: [
    { name: "TechSolve", sector: "Fintech", stage: "Growth", bigScore: 94, fundability: 88 },
    { name: "GreenEnergy", sector: "Clean Energy", stage: "Expansion", bigScore: 89, fundability: 85 },
    { name: "HealthPlus", sector: "Healthtech", stage: "Growth", bigScore: 86, fundability: 82 }
  ],
  topMatch: [
    { name: "TechSolve", sector: "Fintech", stage: "Growth", matchPct: 96 },
    { name: "FinWise", sector: "Fintech", stage: "Seed", matchPct: 92 },
    { name: "EduTech", sector: "Edtech", stage: "Growth", matchPct: 88 }
  ],
  bottomBig: [
    { name: "AgriGrow", sector: "Agritech", stage: "Startup", bigScore: 34 },
    { name: "RetailX", sector: "Retail", stage: "Seed", bigScore: 38 },
    { name: "LogiSync", sector: "Logistics", stage: "Startup", bigScore: 42 }
  ],
  bottomMatch: [
    { name: "RetailX", sector: "Retail", stage: "Seed", matchPct: 28 },
    { name: "AgriGrow", sector: "Agritech", stage: "Startup", matchPct: 32 },
    { name: "LogiSync", sector: "Logistics", stage: "Startup", matchPct: 38 }
  ],
  lowCompliance: [
    { name: "RetailX", sector: "Retail", stage: "Seed", compliance: 45 },
    { name: "AgriGrow", sector: "Agritech", stage: "Startup", compliance: 52 },
    { name: "QuickServe", sector: "Services", stage: "Startup", compliance: 58 }
  ],
  lowFundability: [
    { name: "AgriGrow", sector: "Agritech", stage: "Startup", fundability: 28 },
    { name: "RetailX", sector: "Retail", stage: "Seed", fundability: 32 },
    { name: "LogiSync", sector: "Logistics", stage: "Startup", fundability: 38 }
  ],
  revenuePerSME: [
    { name: "TechSolve", revenue: 18500000, sector: "Fintech", profitability: "Profitable" },
    { name: "GreenEnergy", revenue: 12200000, sector: "Clean Energy", profitability: "Profitable" },
    { name: "HealthPlus", revenue: 8900000, sector: "Healthtech", profitability: "Breakeven" }
  ]
};

const HighestBIGScore = () => {
  const rows = placeholderData.topBig;
  return (
    <Card title="Highest BIG Score">
      <RankedTable isTop rows={rows} metricLabel="BIG Score" unit="%" fmt={r => r.bigScore} />
      {rows.length > 0 && <InsightBox text={`Top BIG scorer is ${rows[0]?.name} at ${rows[0]?.bigScore}%. Highest-scoring SMEs are strongest candidates for Deal Close.`} />}
    </Card>
  );
};

const HighestMatchScore = () => {
  const rows = placeholderData.topMatch;
  return (
    <Card title="Highest Match %">
      <RankedTable isTop rows={rows} metricLabel="Match %" unit="%" fmt={r => r.matchPct} />
      {rows.length > 0 && <InsightBox text={`${rows[0]?.name} is the strongest programme fit at ${rows[0]?.matchPct}% match. Prioritise these SMEs for accelerated support.`} />}
    </Card>
  );
};

const HighestFundability = () => {
  const rows = placeholderData.topBig.filter(r => r.fundability > 0);
  return (
    <Card title="Highest Fundability Score">
      <RankedTable isTop rows={rows} metricLabel="Fundability" unit="%" fmt={r => r.fundability} />
      {rows.length > 0 && <InsightBox text="High fundability SMEs have the strongest case for external capital. Consider facilitating investor introductions." />}
    </Card>
  );
};

const HighestRevenue = () => {
  const perSME = placeholderData.revenuePerSME;
  const rows = perSME.map(s => ({ name: s.name, sector: s.sector, stage: s.profitability }));
  return (
    <Card title="Highest Revenue SMEs">
      <RankedTable isTop rows={rows} metricLabel="Annual Revenue" unit="" fmt={(_, i) => perSME[i] ? "R" + (perSME[i].revenue / 1000000).toFixed(1) + "M" : "–"} />
      {rows.length > 0 && <InsightBox text="Revenue leaders in the portfolio are likely the most investable. Use their traction as case studies for other SMEs." />}
    </Card>
  );
};

const LowestBIGScore = () => {
  const rows = placeholderData.bottomBig;
  return (
    <Card title="Lowest BIG Score">
      <RankedTable isTop={false} rows={rows} metricLabel="BIG Score" unit="%" fmt={r => r.bigScore} />
      {rows.length > 0 && <InsightBox text="SMEs with the lowest BIG scores need targeted capability-building before the next assessment cycle." />}
    </Card>
  );
};

const LowestMatchScore = () => {
  const rows = placeholderData.bottomMatch;
  return (
    <Card title="Lowest Match %">
      <RankedTable isTop={false} rows={rows} metricLabel="Match %" unit="%" fmt={r => r.matchPct} />
      {rows.length > 0 && <InsightBox text="Low-match SMEs may need re-evaluation of programme fit. Consider tailored support tracks or alternative referrals." />}
    </Card>
  );
};

const LowestComplianceScore = () => {
  const rows = placeholderData.lowCompliance;
  return (
    <Card title="Lowest Compliance Score">
      <RankedTable isTop={false} rows={rows} metricLabel="Compliance" unit="%" fmt={r => r.compliance} />
      {rows.length > 0 && <InsightBox text="Non-compliant SMEs pose reputational risk. A compliance clinic covering tax, CIPC and labour law is recommended." />}
    </Card>
  );
};

const LowestFundability = () => {
  const rows = placeholderData.lowFundability;
  return (
    <Card title="Lowest Fundability Score">
      <RankedTable isTop={false} rows={rows} metricLabel="Fundability" unit="%" fmt={r => r.fundability} />
      {rows.length > 0 && <InsightBox text="These SMEs need urgent financial structuring support before being introduced to investors or funders." />}
    </Card>
  );
};

const SUBS = [
  { id: "top-3", label: "Top 3" },
  { id: "bottom-3", label: "Bottom 3" },
];

const TopBottom = () => {
  const [sub, setSub] = useState("top-3");

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        {SUBS.map(s => <Pill key={s.id} label={s.label} active={sub === s.id} onClick={() => setSub(s.id)} />)}
      </div>

      {sub === "top-3" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <HighestBIGScore />
          <HighestMatchScore />
          <HighestFundability />
          <HighestRevenue />
        </div>
      )}

      {sub === "bottom-3" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <LowestBIGScore />
          <LowestMatchScore />
          <LowestComplianceScore />
          <LowestFundability />
        </div>
      )}
    </div>
  );
};

export default TopBottom;