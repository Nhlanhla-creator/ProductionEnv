import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

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

const barOpts = () => ({
  responsive:true, maintainAspectRatio:false, animation:false,
  plugins:{ legend:{ position:'bottom', labels:{ color:B.dark, font:{size:11}, boxWidth:12 } } },
  scales:{
    x:{ grid:{display:false}, ticks:{color:B.dark} },
    y:{ beginAtZero:true, grid:{color:B.offwhite}, ticks:{color:B.dark} },
  },
});

const COHORTS = ['Cohort A','Cohort B','Cohort C','Cohort D','Cohort E'];

/* ── 1. Total Jobs Created ── */
const TotalJobsCreated = () => (
  <Card title="Total Number of Jobs Created" subLabel="KPI Card — cumulative across portfolio">
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'10px' }}>
      <div style={{ fontSize:'64px', fontWeight:'800', color:B.darkest, lineHeight:1 }}>1 248</div>
      <div style={{ fontSize:'14px', color:B.medium, fontWeight:600 }}>total jobs created</div>
      <div style={{ display:'flex', gap:'20px', marginTop:'14px' }}>
        {[['Full-time','784',B.dark],['Part-time','312',B.medium],['Contract','152',B.warm]].map(([l,v,col])=>(
          <div key={l} style={{ textAlign:'center' }}>
            <div style={{ fontSize:'10px', color:B.light, marginBottom:'3px' }}>{l}</div>
            <div style={{ fontSize:'18px', fontWeight:'700', color:col }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  </Card>
);

/* ── 2. Average Jobs Per SME ── */
const AvgJobsPerSME = () => (
  <Card title="Average Jobs Created per SME" subLabel="Bar Chart — by cohort">
    <div style={{ flex:1, minHeight:'240px' }}>
      <Bar options={barOpts()} data={{ labels:COHORTS, datasets:[
        { label:'Avg Jobs Created', data:[14,10,18,8,15], backgroundColor:C.slice(0,5) },
      ]}} />
    </div>
    <div style={{ display:'flex', justifyContent:'space-between', marginTop:'10px', padding:'8px 12px', background:B.offwhite, borderRadius:'6px' }}>
      <span style={{ fontSize:'12px', color:B.dark, fontWeight:600 }}>Portfolio Avg: <strong>12.1 jobs/SME</strong></span>
      <span style={{ fontSize:'12px', color:B.warm }}>Target: 15</span>
    </div>
  </Card>
);

/* ── Main Tab ── */
const Outcomes = () => (
  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(380px, 1fr))', gap:'20px' }}>
    <TotalJobsCreated />
    <AvgJobsPerSME />
  </div>
);

export default Outcomes;
