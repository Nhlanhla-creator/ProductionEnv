import React from "react";
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

const GraduateCount = () => {
  const { metrics } = usePortfolio();
  const ex    = metrics?.exit || {};
  const total = metrics?.totalSMEs || 0;
  const grad  = ex.graduates   || 0;
  const active = ex.active     || 0;
  const rate  = ex.graduationRate || 0;

  return (
    <Card title="# Graduates / Deal Closed" subLabel="KPI Card — SMEs that reached Deal Closed stage">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px" }}>
        <div style={{ fontSize: "72px", fontWeight: "800", color: B.darkest, lineHeight: 1 }}>{grad}</div>
        <div style={{ fontSize: "15px", color: B.medium, fontWeight: 600 }}>deal closed to date</div>
        <div style={{ display: "flex", gap: "20px", marginTop: "14px" }}>
          {[["Active", active, B.dark], ["Total Portfolio", total, B.medium], ["Target", Math.max(total, 10), B.warm]].map(([l, v, col]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: B.light, marginBottom: "3px" }}>{l}</div>
              <div style={{ fontSize: "18px", fontWeight: "700", color: col }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "14px", width: "100%", background: B.offwhite, borderRadius: "8px", padding: "12px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "11px", color: B.dark, fontWeight: 600 }}>Graduation Rate</span>
            <span style={{ fontSize: "11px", color: B.medium, fontWeight: 700 }}>{rate}%</span>
          </div>
          <div style={{ background: B.pale, borderRadius: "4px", height: "8px", overflow: "hidden" }}>
            <div style={{ width: `${rate}%`, background: B.medium, height: "100%", borderRadius: "4px" }} />
          </div>
        </div>
      </div>
    </Card>
  );
};

const AverageTimeInProgram = () => {
  const { metrics } = usePortfolio();
  const ex        = metrics?.exit || {};
  const AVG_MONTHS = ex.avgMonths || 0;
  const TARGET     = 12;
  const R = 54, CIRC = 2 * Math.PI * R;
  const offset = CIRC - (CIRC * Math.min(AVG_MONTHS, 24)) / 24;

  return (
    <Card title="Average Time in Programme" subLabel="Months from application date to latest update (active + closed SMEs)">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
        {AVG_MONTHS > 0 ? (
          <>
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r={R} stroke={B.pale} strokeWidth="11" fill="none" />
              <circle cx="80" cy="80" r={R} stroke={AVG_MONTHS <= TARGET ? B.medium : B.dark}
                strokeWidth="11" fill="none" strokeLinecap="round"
                strokeDasharray={CIRC} strokeDashoffset={offset} transform="rotate(-90 80 80)" />
              <text x="80" y="72" textAnchor="middle" fill={B.darkest} fontSize="28" fontWeight="800">{AVG_MONTHS}</text>
              <text x="80" y="92" textAnchor="middle" fill={B.warm} fontSize="12">months</text>
            </svg>
            <div style={{ display: "flex", gap: "24px" }}>
              {[["Avg", AVG_MONTHS + "mo", B.dark], ["Target", TARGET + "mo", B.medium]].map(([l, v, col]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: B.warm, marginBottom: "3px" }}>{l}</div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: col }}>{v}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ color: B.light, fontSize: "12px", fontStyle: "italic", textAlign: "center", padding: "1rem" }}>
            Time-in-programme data will appear once SMEs reach Active Support or Deal Closed stages.
          </div>
        )}
      </div>
    </Card>
  );
};

const Exit = () => {
  const { loading } = usePortfolio();
  if (loading) return <div style={{ padding: "2rem", textAlign: "center", color: B.warm }}>Loading exit data…</div>;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
      <GraduateCount />
      <AverageTimeInProgram />
    </div>
  );
};

export default Exit;