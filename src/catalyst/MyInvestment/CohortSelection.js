import React, { useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const B = { darkest:'#3b2409', dark:'#5e3f26', medium:'#7d5a36', warm:'#9c7c54', light:'#b8a082', pale:'#d4c4b0', offwhite:'#f0e8de' };
const C = ['#3b2409','#5e3f26','#7d5a36','#9c7c54','#b8a082','#c2a882','#d4c4b0','#a08060'];

const barOpts = (yCb) => ({
  responsive:true, maintainAspectRatio:false, animation:false,
  plugins:{ legend:{ position:'bottom', labels:{ color:B.dark, font:{size:11}, boxWidth:12 } } },
  scales:{
    x:{ grid:{display:false}, ticks:{color:B.dark, font:{size:11}} },
    y:{ beginAtZero:true, grid:{color:B.offwhite}, ticks:{ color:B.dark, callback: yCb || (v=>v) } },
  },
});
const pieOpts = { responsive:true, maintainAspectRatio:false, animation:false,
  plugins:{ legend:{ position:'bottom', labels:{ color:B.dark, font:{size:11}, boxWidth:12 } } } };

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

const COHORTS = ['Cohort A','Cohort B','Cohort C','Cohort D','Cohort E'];

const AverageMatchStrength = () => (
  <Card title="Average Match Strength (%)" subLabel="Range Bar Chart — min, avg, max">
    <div style={{ flex:1, minHeight:'220px' }}>
      <Bar options={barOpts(v=>v+'%')} data={{ labels:COHORTS, datasets:[
        { label:'Min', data:[55,48,70,40,60], backgroundColor:C[4] },
        { label:'Avg', data:[72,65,81,58,76], backgroundColor:C[2] },
        { label:'Max', data:[88,79,95,72,90], backgroundColor:C[0] },
      ]}} />
    </div>
    <div style={{ display:'flex', justifyContent:'space-between', marginTop:'10px', padding:'8px 12px', background:B.offwhite, borderRadius:'6px' }}>
      <span style={{ fontSize:'12px', color:B.dark, fontWeight:600 }}>Overall Avg: <strong>70.4%</strong></span>
      <span style={{ fontSize:'12px', color:B.warm }}>Target: 75%</span>
    </div>
  </Card>
);

const AverageBIGScore = () => {
  const [view, setView] = useState('range');
  return (
    <Card title="Average BIG Score (%)" subLabel={view==='range' ? 'Range Bar — min, avg, max' : 'Histogram — score bands'}>
      <div style={{ display:'flex', gap:'6px', marginBottom:'10px' }}>
        <Pill label="Range" active={view==='range'} onClick={()=>setView('range')} />
        <Pill label="Histogram" active={view==='histogram'} onClick={()=>setView('histogram')} />
      </div>
      <div style={{ flex:1, minHeight:'210px' }}>
        <Bar options={barOpts(v=>v+'%')} data={view==='range' ? {
          labels:COHORTS, datasets:[
            { label:'Min', data:[52,45,68,38,57], backgroundColor:C[4] },
            { label:'Avg', data:[74,66,82,59,77], backgroundColor:C[2] },
            { label:'Max', data:[90,81,97,75,93], backgroundColor:C[0] },
          ]} : {
          labels:['0–15','50–60','60–70','70–80','80–100'],
          datasets:[{ label:'# SMEs', data:[3,12,28,41,19], backgroundColor:C.slice(0,5) }],
        }} />
      </div>
    </Card>
  );
};

const FundingReadinessRate = () => (
  <Card title="Funding Readiness Rate (%)" subLabel="SMEs with BIG score > 85% — Range Bar (min, avg, max)">
    <div style={{ flex:1, minHeight:'220px' }}>
      <Bar options={barOpts(v=>v+'%')} data={{ labels:COHORTS, datasets:[
        { label:'Min', data:[48,40,62,35,52], backgroundColor:C[4] },
        { label:'Avg', data:[68,58,79,52,71], backgroundColor:C[2] },
        { label:'Max', data:[85,74,94,68,88], backgroundColor:C[0] },
      ]}} />
    </div>
    <div style={{ display:'flex', justifyContent:'space-between', marginTop:'10px', padding:'8px 12px', background:B.offwhite, borderRadius:'6px' }}>
      <span style={{ fontSize:'12px', color:B.dark, fontWeight:600 }}>Portfolio Avg: <strong>65.6%</strong></span>
      <span style={{ fontSize:'12px', color:B.warm }}>Target: 70%</span>
    </div>
  </Card>
);

const AverageVettingTime = () => {
  const ACTUAL=14, TARGET=10, VARIANCE=ACTUAL-TARGET;
  const R=54, CIRC=2*Math.PI*R;
  const offset = CIRC - (CIRC * Math.min(ACTUAL,30)) / 30;
  return (
    <Card title="Average Vetting Time (Days)" subLabel="Gauge — actual vs target vs variance">
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'16px' }}>
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={R} stroke={B.pale} strokeWidth="11" fill="none" />
          <circle cx="80" cy="80" r={R} stroke={ACTUAL<=TARGET ? B.medium : B.dark}
            strokeWidth="11" fill="none" strokeLinecap="round"
            strokeDasharray={CIRC} strokeDashoffset={offset} transform="rotate(-90 80 80)" />
          <text x="80" y="74" textAnchor="middle" fill={B.darkest} fontSize="30" fontWeight="800">{ACTUAL}</text>
          <text x="80" y="93" textAnchor="middle" fill={B.warm} fontSize="13">days</text>
        </svg>
        <div style={{ display:'flex', gap:'24px' }}>
          {[['Actual',ACTUAL+'d',B.dark],['Target',TARGET+'d',B.medium],['Variance',(VARIANCE>0?'+':'')+VARIANCE+'d',VARIANCE>0?'#8b3a1a':B.medium]].map(([l,v,col])=>(
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

const SMEPipelineProgress = () => {
  const [view, setView] = useState('stage');
  const STAGES=['Application','Under Review','Due Diligence','Term Sheet','Deal Close'];
  const COUNTS=[120,84,52,28,18];
  return (
    <Card title="SME Pipeline Progress" subLabel="Stage distribution + conversion funnel">
      <div style={{ display:'flex', gap:'6px', marginBottom:'10px' }}>
        <Pill label="Stage Dist." active={view==='stage'} onClick={()=>setView('stage')} />
        <Pill label="Funnel" active={view==='funnel'} onClick={()=>setView('funnel')} />
      </div>
      <div style={{ flex:1, minHeight:'200px' }}>
        {view==='stage'
          ? <Bar options={barOpts()} data={{ labels:STAGES, datasets:[{ label:'# SMEs', data:COUNTS, backgroundColor:C.slice(0,5) }] }} />
          : <Doughnut options={pieOpts} data={{ labels:STAGES, datasets:[{ data:COUNTS, backgroundColor:C.slice(0,5), borderWidth:2, borderColor:'#fff' }] }} />}
      </div>
      <div style={{ display:'flex', gap:'5px', marginTop:'10px', flexWrap:'wrap' }}>
        {STAGES.map((s,i)=>(
          <span key={s} style={{ fontSize:'10px', color:B.dark, background:B.offwhite, padding:'3px 7px', borderRadius:'10px' }}>
            {s}: <strong>{COUNTS[i]}</strong>
          </span>
        ))}
      </div>
    </Card>
  );
};

const CohortSelection = () => (
  <div style={{ width:'100%' }}>
    <div style={{ display:'flex', gap:'8px', marginBottom:'20px' }}>
      <Pill label="Big Score" active onClick={()=>{}} />
    </div>
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(380px, 1fr))', gap:'20px' }}>
      <AverageMatchStrength />
      <AverageBIGScore />
      <FundingReadinessRate />
      <AverageVettingTime />
      <SMEPipelineProgress />
    </div>
  </div>
);

export default CohortSelection;
