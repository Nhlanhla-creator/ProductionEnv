import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const B = { darkest:'#3b2409', dark:'#5e3f26', medium:'#7d5a36', warm:'#9c7c54', light:'#b8a082', pale:'#d4c4b0', offwhite:'#f0e8de' };
const C = ['#3b2409','#5e3f26','#7d5a36','#9c7c54','#b8a082','#c2a882','#d4c4b0','#a08060'];

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

const hBarOpts = () => ({
  responsive:true, maintainAspectRatio:false, animation:false, indexAxis:'y',
  plugins:{ legend:{ display:false } },
  scales:{
    x:{ beginAtZero:true, grid:{color:B.offwhite}, ticks:{color:B.dark, font:{size:11}} },
    y:{ grid:{display:false}, ticks:{color:B.dark, font:{size:11}} },
  },
});

/* ── 1. Most Requested Support Area ── */
const MostRequestedSupportArea = () => {
  const labels = ['Financial Management','Market Access & Sales','Technology Adoption','HR & Labour Compliance','Product Development','Leadership & Strategy','Networking & Linkages','Export Readiness'];
  const values = [68,61,54,48,42,38,30,22];
  return (
    <Card title="Most Requested Support Area" subLabel="Horizontal Bar Chart — # SMEs requesting each area">
      <div style={{ flex:1, minHeight:'280px' }}>
        <Bar options={hBarOpts()} data={{ labels, datasets:[{
          label:'# SMEs', data:values,
          backgroundColor: values.map((_,i) => C[Math.min(i, C.length-1)]),
        }]}} />
      </div>
      <div style={{ marginTop:'10px', padding:'8px 12px', background:B.offwhite, borderRadius:'6px', fontSize:'12px', color:B.dark }}>
        <strong>Top need:</strong> Financial Management — 68 SMEs (66% of cohort)
      </div>
    </Card>
  );
};

/* ── 2. Capability Gap Distribution ── */
const CapabilityGapDistribution = () => {
  const labels = ['Financial Literacy','Digital Skills','Sales & Marketing','Operational Efficiency','People Management','Regulatory Knowledge','Strategic Planning','Data & Reporting'];
  const values = [74,62,58,51,44,40,35,28];
  return (
    <Card title="Capability Gap Distribution" subLabel="Horizontal Bar Chart — # SMEs with identified gap">
      <div style={{ flex:1, minHeight:'280px' }}>
        <Bar options={hBarOpts()} data={{ labels, datasets:[{
          label:'# SMEs with gap', data:values,
          backgroundColor: values.map((_,i) => C[Math.min(i, C.length-1)]),
        }]}} />
      </div>
      <div style={{ marginTop:'10px', padding:'8px 12px', background:B.offwhite, borderRadius:'6px', fontSize:'12px', color:B.dark }}>
        <strong>Biggest gap:</strong> Financial Literacy — 74 SMEs (72% of cohort)
      </div>
    </Card>
  );
};

/* ── Main Tab ── */
const SUBS = [
  { id:'support',      label:'Support Most Needed' },
  { id:'capabilities', label:'Capabilities Most Missing' },
];

const Learnings = () => {
  const [sub, setSub] = useState('support');
  return (
    <div style={{ width:'100%' }}>
      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'20px' }}>
        {SUBS.map(s => <Pill key={s.id} label={s.label} active={sub===s.id} onClick={()=>setSub(s.id)} />)}
      </div>

      {sub==='support' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(420px, 1fr))', gap:'20px' }}>
          <MostRequestedSupportArea />
        </div>
      )}

      {sub==='capabilities' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(420px, 1fr))', gap:'20px' }}>
          <CapabilityGapDistribution />
        </div>
      )}
    </div>
  );
};

export default Learnings;
