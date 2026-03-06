import React, { useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);

const B = { darkest:'#3b2409', dark:'#5e3f26', medium:'#7d5a36', warm:'#9c7c54', light:'#b8a082', pale:'#d4c4b0', offwhite:'#f0e8de' };
const C = ['#3b2409','#5e3f26','#7d5a36','#9c7c54','#b8a082','#c2a882'];

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

const comboOpts = (yCb) => ({
  responsive:true, maintainAspectRatio:false, animation:false,
  plugins:{ legend:{ position:'bottom', labels:{ color:B.dark, font:{size:11}, boxWidth:12 } } },
  scales:{
    x:{ grid:{display:false}, ticks:{color:B.dark, font:{size:11}} },
    y:{ beginAtZero:true, grid:{color:B.offwhite}, ticks:{ color:B.dark, callback: yCb || (v=>v) } },
  },
});

const COHORTS = ['Cohort A','Cohort B','Cohort C','Cohort D','Cohort E'];

/* ── 1. Revenue Growth ── */
const RevenueGrowth = () => {
  const [view, setView] = useState('bar');
  const baseline = [820,640,1100,520,900];
  const actual   = [1250,980,1620,740,1380];
  const post     = [1540,1210,2050,890,1700];
  const barData = { labels:COHORTS, datasets:[
    { label:'Baseline (R\'000)', data:baseline, backgroundColor:C[4] },
    { label:'Actual (R\'000)',   data:actual,   backgroundColor:C[2] },
    { label:'Post (R\'000)',     data:post,     backgroundColor:C[0] },
  ]};
  const lineData = { labels:COHORTS, datasets:[
    { label:'Baseline', data:baseline, borderColor:C[4], backgroundColor:'transparent', tension:0.4, pointBackgroundColor:C[4] },
    { label:'Actual',   data:actual,   borderColor:C[2], backgroundColor:'transparent', tension:0.4, pointBackgroundColor:C[2] },
    { label:'Post',     data:post,     borderColor:C[0], backgroundColor:'transparent', tension:0.4, pointBackgroundColor:C[0] },
  ]};
  return (
    <Card title="Revenue Growth" subLabel="Baseline → Actual → Post-programme (R'000)">
      <div style={{ display:'flex', gap:'6px', marginBottom:'10px' }}>
        <Pill label="Bar" active={view==='bar'} onClick={()=>setView('bar')} />
        <Pill label="Line" active={view==='line'} onClick={()=>setView('line')} />
      </div>
      <div style={{ flex:1, minHeight:'210px' }}>
        {view==='bar'
          ? <Bar options={comboOpts(v=>'R'+v+'k')} data={barData} />
          : <Line options={comboOpts(v=>'R'+v+'k')} data={lineData} />}
      </div>
    </Card>
  );
};

/* ── 2. Profitability Growth ── */
const ProfitabilityGrowth = () => {
  const [view, setView] = useState('bar');
  const baseline = [12,8,18,6,14];
  const actual   = [19,14,26,10,21];
  const post     = [24,18,33,13,27];
  const barData = { labels:COHORTS, datasets:[
    { label:'Baseline (%)', data:baseline, backgroundColor:C[4] },
    { label:'Actual (%)',   data:actual,   backgroundColor:C[2] },
    { label:'Post (%)',     data:post,     backgroundColor:C[0] },
  ]};
  const lineData = { labels:COHORTS, datasets:[
    { label:'Baseline', data:baseline, borderColor:C[4], backgroundColor:'transparent', tension:0.4, pointBackgroundColor:C[4] },
    { label:'Actual',   data:actual,   borderColor:C[2], backgroundColor:'transparent', tension:0.4, pointBackgroundColor:C[2] },
    { label:'Post',     data:post,     borderColor:C[0], backgroundColor:'transparent', tension:0.4, pointBackgroundColor:C[0] },
  ]};
  return (
    <Card title="Profitability Growth" subLabel="Net margin % — baseline → actual → post-programme">
      <div style={{ display:'flex', gap:'6px', marginBottom:'10px' }}>
        <Pill label="Bar" active={view==='bar'} onClick={()=>setView('bar')} />
        <Pill label="Line" active={view==='line'} onClick={()=>setView('line')} />
      </div>
      <div style={{ flex:1, minHeight:'210px' }}>
        {view==='bar'
          ? <Bar options={comboOpts(v=>v+'%')} data={barData} />
          : <Line options={comboOpts(v=>v+'%')} data={lineData} />}
      </div>
    </Card>
  );
};

/* ── 3. Capital Raise ── */
const CapitalRaise = () => (
  <Card title="Capital Raise" subLabel="Total capital raised per cohort (R'000)">
    <div style={{ flex:1, minHeight:'240px' }}>
      <Bar options={comboOpts(v=>'R'+v+'k')} data={{ labels:COHORTS, datasets:[
        { label:"Capital Raised (R'000)", data:[3200,2400,4800,1800,3900], backgroundColor:C.slice(0,5) },
      ]}} />
    </div>
  </Card>
);

/* ── 4. ROI Gauge ── */
const ROI = () => {
  const ROI_VAL = 3.4;
  const R=54, CIRC=2*Math.PI*R;
  const offset = CIRC - (CIRC * Math.min(ROI_VAL, 10)) / 10;
  return (
    <Card title="ROI" subLabel="Blended return on investment across cohort">
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'12px' }}>
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={R} stroke={B.pale} strokeWidth="11" fill="none" />
          <circle cx="80" cy="80" r={R} stroke={B.dark} strokeWidth="11" fill="none" strokeLinecap="round"
            strokeDasharray={CIRC} strokeDashoffset={offset} transform="rotate(-90 80 80)" />
          <text x="80" y="72" textAnchor="middle" fill={B.darkest} fontSize="26" fontWeight="800">{ROI_VAL}x</text>
          <text x="80" y="92" textAnchor="middle" fill={B.warm} fontSize="12">return</text>
        </svg>
        <div style={{ display:'flex', gap:'24px' }}>
          {[['Portfolio Avg','3.4x',B.dark],['Best Cohort','4.8x',B.medium],['Worst Cohort','1.9x',B.warm]].map(([l,v,col])=>(
            <div key={l} style={{ textAlign:'center' }}>
              <div style={{ fontSize:'10px', color:B.warm, marginBottom:'3px' }}>{l}</div>
              <div style={{ fontSize:'16px', fontWeight:'700', color:col }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

/* ── 5. Client Count ── */
const ClientCount = () => (
  <Card title="# Clients" subLabel="Bar Chart — total clients per cohort">
    <div style={{ flex:1, minHeight:'240px' }}>
      <Bar options={comboOpts()} data={{ labels:COHORTS, datasets:[
        { label:'# Clients', data:[284,196,412,148,320], backgroundColor:C.slice(0,5) },
      ]}} />
    </div>
  </Card>
);

/* ── 6. Average Revenue Per Client ── */
const AverageRevenuePerClient = () => (
  <Card title="Average Revenue Per Client" subLabel="KPI Card — portfolio average">
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'10px' }}>
      <div style={{ fontSize:'48px', fontWeight:'800', color:B.darkest, lineHeight:1 }}>R 4 820</div>
      <div style={{ fontSize:'14px', color:B.medium, fontWeight:600 }}>per client / month</div>
      <div style={{ display:'flex', gap:'20px', marginTop:'12px' }}>
        {[['Highest','R8 400',B.dark],['Lowest','R1 200',B.warm],['Target','R5 500',B.medium]].map(([l,v,col])=>(
          <div key={l} style={{ textAlign:'center' }}>
            <div style={{ fontSize:'10px', color:B.light, marginBottom:'3px' }}>{l}</div>
            <div style={{ fontSize:'15px', fontWeight:'700', color:col }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  </Card>
);

/* ── Main Tab ── */
const SUBS = [
  { id:'financial',          label:'Financial' },
  { id:'market-penetration', label:'Market Penetration' },
];

const Performance = () => {
  const [sub, setSub] = useState('financial');
  return (
    <div style={{ width:'100%' }}>
      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'20px' }}>
        {SUBS.map(s => <Pill key={s.id} label={s.label} active={sub===s.id} onClick={()=>setSub(s.id)} />)}
      </div>

      {sub==='financial' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(380px, 1fr))', gap:'20px' }}>
          <RevenueGrowth /><ProfitabilityGrowth /><CapitalRaise /><ROI />
        </div>
      )}

      {sub==='market-penetration' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(380px, 1fr))', gap:'20px' }}>
          <ClientCount /><AverageRevenuePerClient />
        </div>
      )}
    </div>
  );
};

export default Performance;
