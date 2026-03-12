import React, { useState } from "react";
import { usePortfolio } from "../../context/PortfolioContext";

const B = { darkest: "#3b2409", dark: "#5e3f26", medium: "#7d5a36", warm: "#9c7c54", light: "#b8a082", pale: "#d4c4b0", offwhite: "#f0e8de" };

const Card = ({ title, subLabel, children }) => (
  <div style={{ background: "#fff", borderRadius: "10px", padding: "20px", minHeight: "320px", boxShadow: "0 2px 10px rgba(59,36,9,0.07)", border: `1px solid ${B.pale}`, display: "flex", flexDirection: "column" }}>
    <div style={{ paddingBottom: "10px", borderBottom: `1px solid ${B.offwhite}`, marginBottom: "10px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: "700", color: B.dark, margin: 0 }}>{title}</h3>
    </div>
    {subLabel && <div style={{ fontSize: "11px", color: B.warm, background: B.offwhite, padding: "4px 9px", borderRadius: "4px", borderLeft: `3px solid ${B.medium}`, marginBottom: "12px", fontWeight: "500" }}>{subLabel}</div>}
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>{children}</div>
  </div>
);

const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding: "5px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "11px", border: `1.5px solid ${active ? B.medium : B.pale}`, fontWeight: active ? 700 : 500, background: active ? B.medium : "#fff", color: active ? "#fff" : B.medium }}>
    {label}
  </button>
);

const MEDALS = ["🥇", "🥈", "🥉"];
const WARN   = ["⚠️", "🔸", "🔹"];

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

// ── TOP 3 ─────────────────────────────────────────────────────────────────────
const HighestBIGScore = () => {
  const { metrics } = usePortfolio();
  const rows = metrics?.performers?.topBig || [];
  return (
    <Card title="Highest BIG Score" subLabel="Top 3 — ranked by BIG score">
      <RankedTable isTop rows={rows} metricLabel="BIG Score" unit="%" fmt={r => r.bigScore} />
      {rows.length > 0 && <InsightBox text={`Top BIG scorer is ${rows[0]?.name} at ${rows[0]?.bigScore}%. Highest-scoring SMEs are strongest candidates for Deal Close.`} />}
    </Card>
  );
};

const HighestMatchScore = () => {
  const { metrics } = usePortfolio();
  const rows = metrics?.performers?.topMatch || [];
  return (
    <Card title="Highest Match %" subLabel="Top 3 — ranked by programme match percentage">
      <RankedTable isTop rows={rows} metricLabel="Match %" unit="%" fmt={r => r.matchPct} />
      {rows.length > 0 && <InsightBox text={`${rows[0]?.name} is the strongest programme fit at ${rows[0]?.matchPct}% match. Prioritise these SMEs for accelerated support.`} />}
    </Card>
  );
};

const HighestFundability = () => {
  const { metrics } = usePortfolio();
  const rows = (metrics?.performers?.topBig || []).filter(r => r.fundability > 0);
  return (
    <Card title="Highest Fundability Score" subLabel="Top 3 — ranked by fundability sub-score">
      <RankedTable isTop rows={rows} metricLabel="Fundability" unit="%" fmt={r => r.fundability} />
      {rows.length > 0 && <InsightBox text="High fundability SMEs have the strongest case for external capital. Consider facilitating investor introductions." />}
    </Card>
  );
};

const HighestRevenue = () => {
  const { metrics } = usePortfolio();
  const perSME = (metrics?.revenue?.perSME || []).filter(s => s.revenue > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 3);
  const rows = perSME.map(s => ({ name: s.name, sector: s.sector, stage: s.profitability }));
  return (
    <Card title="Highest Revenue SMEs" subLabel="Top 3 — ranked by annual revenue">
      <RankedTable isTop rows={rows} metricLabel="Annual Revenue" unit="" fmt={(_, i) => perSME[i] ? "R" + (perSME[i].revenue / 1000000).toFixed(1) + "M" : "–"} />
      {rows.length > 0 && <InsightBox text="Revenue leaders in the portfolio are likely the most investable. Use their traction as case studies for other SMEs." />}
    </Card>
  );
};

// ── BOTTOM 3 ──────────────────────────────────────────────────────────────────
const LowestBIGScore = () => {
  const { metrics } = usePortfolio();
  const rows = metrics?.performers?.bottomBig || [];
  return (
    <Card title="Lowest BIG Score" subLabel="Bottom 3 — require immediate support">
      <RankedTable isTop={false} rows={rows} metricLabel="BIG Score" unit="%" fmt={r => r.bigScore} />
      {rows.length > 0 && <InsightBox text="SMEs with the lowest BIG scores need targeted capability-building before the next assessment cycle." />}
    </Card>
  );
};

const LowestMatchScore = () => {
  const { metrics } = usePortfolio();
  const rows = metrics?.performers?.bottomMatch || [];
  return (
    <Card title="Lowest Match %" subLabel="Bottom 3 — weakest programme fit">
      <RankedTable isTop={false} rows={rows} metricLabel="Match %" unit="%" fmt={r => r.matchPct} />
      {rows.length > 0 && <InsightBox text="Low-match SMEs may need re-evaluation of programme fit. Consider tailored support tracks or alternative referrals." />}
    </Card>
  );
};

const LowestComplianceScore = () => {
  const { metrics } = usePortfolio();
  const rows = (metrics?.performers?.lowCompliance || []).filter(r => r.compliance > 0);
  return (
    <Card title="Lowest Compliance Score" subLabel="Bottom 3 — compliance risk flagged">
      <RankedTable isTop={false} rows={rows} metricLabel="Compliance" unit="%" fmt={r => r.compliance} />
      {rows.length > 0 && <InsightBox text="Non-compliant SMEs pose reputational risk. A compliance clinic covering tax, CIPC and labour law is recommended." />}
    </Card>
  );
};

const LowestFundability = () => {
  const { metrics } = usePortfolio();
  const rows = (metrics?.performers?.lowFundability || []).filter(r => r.fundability > 0);
  return (
    <Card title="Lowest Fundability Score" subLabel="Bottom 3 — least investment-ready">
      <RankedTable isTop={false} rows={rows} metricLabel="Fundability" unit="%" fmt={r => r.fundability} />
      {rows.length > 0 && <InsightBox text="These SMEs need urgent financial structuring support before being introduced to investors or funders." />}
    </Card>
  );
};

const SUBS = [
  { id: "top-3",    label: "Top 3" },
  { id: "bottom-3", label: "Bottom 3" },
];

const TopBottom = () => {
  const [sub, setSub] = useState("top-3");
  const { loading } = usePortfolio();

  if (loading) return <div style={{ padding: "2rem", textAlign: "center", color: B.warm }}>Loading performer data…</div>;

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