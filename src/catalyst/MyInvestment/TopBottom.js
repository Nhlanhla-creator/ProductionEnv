import React, { useState } from 'react';

const B = { darkest:'#3b2409', dark:'#5e3f26', medium:'#7d5a36', warm:'#9c7c54', light:'#b8a082', pale:'#d4c4b0', offwhite:'#f0e8de' };

const Card = ({ title, subLabel, children }) => (
  <div style={{ background:'#fff', borderRadius:'10px', padding:'20px', minHeight:'320px',
    boxShadow:'0 2px 10px rgba(59,36,9,0.07)', border:`1px solid ${B.pale}`, display:'flex', flexDirection:'column' }}>
    <div style={{ paddingBottom:'10px', borderBottom:`1px solid ${B.offwhite}`, marginBottom:'10px' }}>
      <h3 style={{ fontSize:'14px', fontWeight:'700', color:B.dark, margin:0 }}>{title}</h3>
    </div>
    {subLabel && <div style={{ fontSize:'11px', color:B.warm, background:B.offwhite, padding:'4px 9px',
      borderRadius:'4px', borderLeft:`3px solid ${B.medium}`, marginBottom:'12px', fontWeight:'500' }}>{subLabel}</div>}
    <div style={{ flex:1, display:'flex', flexDirection:'column' }}>{children}</div>
  </div>
);

const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding:'5px 14px', borderRadius:'20px', cursor:'pointer', fontSize:'11px',
    border:`1.5px solid ${active ? B.medium : B.pale}`, fontWeight: active ? 700 : 500,
    background: active ? B.medium : '#fff', color: active ? '#fff' : B.medium }}>
    {label}
  </button>
);

const MEDALS = ['🥇','🥈','🥉'];
const WARN   = ['⚠️','🔸','🔹'];

const RankedTable = ({ rows, isTop, metricLabel, unit='' }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:'8px', flex:1 }}>
    {rows.map((row, i) => (
      <div key={row.name} style={{
        display:'flex', alignItems:'center', gap:'10px',
        padding:'10px 12px', borderRadius:'8px',
        background: isTop ? (i===0 ? '#f5ede4' : B.offwhite) : (i===0 ? '#fdf0ec' : B.offwhite),
        border:`1px solid ${isTop ? B.pale : '#e8d4cc'}`,
      }}>
        <span style={{ fontSize:'18px', minWidth:'24px' }}>{isTop ? MEDALS[i] : WARN[i]}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:'13px', fontWeight:'700', color:B.darkest }}>{row.name}</div>
          <div style={{ fontSize:'11px', color:B.warm }}>{row.sector} · {row.cohort}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:'16px', fontWeight:'800', color: isTop ? B.dark : '#9b3a1a' }}>{row.value}{unit}</div>
          <div style={{ fontSize:'10px', color:B.light }}>{metricLabel}</div>
        </div>
      </div>
    ))}
  </div>
);

const InsightBox = ({ text }) => (
  <div style={{ marginTop:'12px', padding:'10px 12px', background:'#fdf8f4', borderRadius:'7px',
    border:`1px dashed ${B.pale}`, fontSize:'12px', color:B.dark, fontStyle:'italic', lineHeight:1.5 }}>
    💡 {text}
  </div>
);

/* ── TOP 3 ── */
const HighestBIGScore = () => (
  <Card title="Highest BIG Score" subLabel="Top 3 — ranked by BIG score">
    <RankedTable isTop rows={[
      { name:'Thabo Constructions', sector:'Construction', cohort:'Cohort C', value:94 },
      { name:'GreenLeaf Agri',      sector:'Agriculture',  cohort:'Cohort A', value:91 },
      { name:'TechBridge SA',       sector:'Technology',   cohort:'Cohort C', value:89 },
    ]} metricLabel="BIG Score" unit="%" />
    <InsightBox text="All top scorers are from Cohort C, suggesting strong pre-selection alignment. Consider replicating vetting criteria across other cohorts." />
  </Card>
);

const FastestRevenueGrowth = () => (
  <Card title="Fastest Revenue Growth" subLabel="Top 3 — revenue growth %">
    <RankedTable isTop rows={[
      { name:'Mzansi Tech Hub',     sector:'Technology',  cohort:'Cohort A', value:'+148' },
      { name:'Urban Harvest Co.',   sector:'Agri-retail', cohort:'Cohort C', value:'+122' },
      { name:'BrightPath Logistics',sector:'Logistics',   cohort:'Cohort E', value:'+98' },
    ]} metricLabel="Revenue Growth" unit="%" />
    <InsightBox text="Tech and agri-retail SMEs show the highest revenue growth. Pairing these SMEs as peer mentors could accelerate knowledge transfer." />
  </Card>
);

const HighestMarketPenetration = () => (
  <Card title="Highest Market Penetration" subLabel="Top 3 — client count growth">
    <RankedTable isTop rows={[
      { name:'SunRise Retail',      sector:'Retail',      cohort:'Cohort B', value:'+312' },
      { name:'Mzansi Tech Hub',     sector:'Technology',  cohort:'Cohort A', value:'+284' },
      { name:'Cape Fresh Foods',    sector:'FMCG',        cohort:'Cohort E', value:'+196' },
    ]} metricLabel="New Clients" unit="" />
    <InsightBox text="Retail and FMCG SMEs dominate market penetration. Digital sales channels adopted early appear to be the key differentiator." />
  </Card>
);

const BiggestBIGScoreImprovement = () => (
  <Card title="Biggest BIG Score Improvement" subLabel="Top 3 — score change from intake to exit">
    <RankedTable isTop rows={[
      { name:'Nomvula Beauty Co.',  sector:'Beauty',      cohort:'Cohort D', value:'+34' },
      { name:'SunRise Retail',      sector:'Retail',      cohort:'Cohort B', value:'+29' },
      { name:'InnoBuild Pty',       sector:'Construction',cohort:'Cohort A', value:'+26' },
    ]} metricLabel="BIG Score Δ" unit="pts" />
    <InsightBox text="SMEs with the most improvement entered with low scores but high coachability. Early intervention with intensive coaching seems to drive the largest gains." />
  </Card>
);

/* ── BOTTOM 3 ── */
const LowestBIGScore = () => (
  <Card title="Lowest BIG Score" subLabel="Bottom 3 — require immediate support">
    <RankedTable isTop={false} rows={[
      { name:'Delta Services',      sector:'Services',    cohort:'Cohort D', value:38 },
      { name:'Sunrise Catering',    sector:'F&B',         cohort:'Cohort B', value:42 },
      { name:'Metro Cleaners',      sector:'Services',    cohort:'Cohort D', value:46 },
    ]} metricLabel="BIG Score" unit="%" />
    <InsightBox text="Two of the bottom three are from Cohort D in the services sector. A targeted capability-building intervention is recommended before the next assessment." />
  </Card>
);

const LowestComplianceScore = () => (
  <Card title="Lowest Compliance Score" subLabel="Bottom 3 — compliance risk flagged">
    <RankedTable isTop={false} rows={[
      { name:'Metro Cleaners',      sector:'Services',    cohort:'Cohort D', value:31 },
      { name:'Sunrise Catering',    sector:'F&B',         cohort:'Cohort B', value:37 },
      { name:'Rapid Build Co.',     sector:'Construction',cohort:'Cohort A', value:44 },
    ]} metricLabel="Compliance Score" unit="%" />
    <InsightBox text="Non-compliance is concentrated in service and F&B SMEs. A compliance clinic focused on tax, CIPC and labour law is recommended for these businesses." />
  </Card>
);

const WeakestFinancialHealth = () => (
  <Card title="Weakest Financial Health" subLabel="Bottom 3 — financial health composite score">
    <RankedTable isTop={false} rows={[
      { name:'Delta Services',      sector:'Services',    cohort:'Cohort D', value:28 },
      { name:'Kwezi Fashion',       sector:'Retail',      cohort:'Cohort B', value:33 },
      { name:'Metro Cleaners',      sector:'Services',    cohort:'Cohort D', value:39 },
    ]} metricLabel="Financial Health" unit="/100" />
    <InsightBox text="Delta Services and Metro Cleaners appear in multiple bottom-3 lists — these SMEs need urgent, multi-disciplinary support or consideration for exit management." />
  </Card>
);

const SlowestRevenueGrowth = () => (
  <Card title="Slowest Revenue Growth" subLabel="Bottom 3 — lowest revenue growth %">
    <RankedTable isTop={false} rows={[
      { name:'Kwezi Fashion',       sector:'Retail',      cohort:'Cohort B', value:'+4' },
      { name:'Delta Services',      sector:'Services',    cohort:'Cohort D', value:'+6' },
      { name:'Rapid Build Co.',     sector:'Construction',cohort:'Cohort A', value:'+9' },
    ]} metricLabel="Revenue Growth" unit="%" />
    <InsightBox text="Slow-growing SMEs share a common gap: limited access to new markets. Market linkage workshops and B2B matchmaking events should be prioritised for these businesses." />
  </Card>
);

/* ── Main Tab ── */
const SUBS = [
  { id:'top-3',    label:'Top 3' },
  { id:'bottom-3', label:'Bottom 3' },
];

const TopBottom = () => {
  const [sub, setSub] = useState('top-3');
  return (
    <div style={{ width:'100%' }}>
      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'20px' }}>
        {SUBS.map(s => <Pill key={s.id} label={s.label} active={sub===s.id} onClick={()=>setSub(s.id)} />)}
      </div>

      {sub==='top-3' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(380px, 1fr))', gap:'20px' }}>
          <HighestBIGScore /><FastestRevenueGrowth /><HighestMarketPenetration /><BiggestBIGScoreImprovement />
        </div>
      )}

      {sub==='bottom-3' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(380px, 1fr))', gap:'20px' }}>
          <LowestBIGScore /><LowestComplianceScore /><WeakestFinancialHealth /><SlowestRevenueGrowth />
        </div>
      )}
    </div>
  );
};

export default TopBottom;
