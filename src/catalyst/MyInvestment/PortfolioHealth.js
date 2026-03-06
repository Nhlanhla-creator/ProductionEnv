import React, { useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const B = { darkest:'#3b2409', dark:'#5e3f26', medium:'#7d5a36', warm:'#9c7c54', light:'#b8a082', pale:'#d4c4b0', offwhite:'#f0e8de' };
const C = ['#3b2409','#5e3f26','#7d5a36','#9c7c54','#b8a082','#c2a882','#d4c4b0','#a08060','#6b4c2a','#8a6340'];

const barOpts = (yCb, horizontal) => ({
  responsive:true, maintainAspectRatio:false, animation:false,
  indexAxis: horizontal ? 'y' : 'x',
  plugins:{ legend:{ position:'bottom', labels:{ color:B.dark, font:{size:11}, boxWidth:12 } } },
  scales:{
    x:{ grid:{ display: horizontal }, ticks:{ color:B.dark, font:{size:11}, callback: horizontal ? yCb : undefined } },
    y:{ beginAtZero:true, grid:{ color: horizontal ? 'transparent' : B.offwhite }, ticks:{ color:B.dark, callback: horizontal ? undefined : yCb } },
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

const KPICard = ({ title, subLabel, value, unit, note }) => (
  <Card title={title} subLabel={subLabel}>
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'8px' }}>
      <div style={{ fontSize:'52px', fontWeight:'800', color:B.darkest, lineHeight:1 }}>{value}</div>
      {unit && <div style={{ fontSize:'16px', color:B.medium, fontWeight:600 }}>{unit}</div>}
      {note && <div style={{ fontSize:'12px', color:B.warm, marginTop:'8px', textAlign:'center' }}>{note}</div>}
    </div>
  </Card>
);

const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding:'5px 14px', borderRadius:'20px', cursor:'pointer', fontSize:'11px',
    border:`1.5px solid ${active ? B.medium : B.pale}`, fontWeight: active ? 700 : 500,
    background: active ? B.medium : '#fff', color: active ? '#fff' : B.medium }}>
    {label}
  </button>
);

const SUBS = [
  { id:'composition',   label:'Portfolio Composition' },
  { id:'demographics',  label:'Beneficiary Demographics' },
  { id:'support',       label:'Support Focus' },
];

/* ── COMPOSITION ── */
const TotalSMEsCount = () => {
  const ACTUAL=103, TARGET=120;
  const R=54, CIRC=2*Math.PI*R;
  const offset = CIRC - (CIRC * Math.min(ACTUAL,TARGET)) / TARGET;
  return (
    <Card title="Total Number of SMEs" subLabel="Gauge — actual vs target">
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'12px' }}>
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={R} stroke={B.pale} strokeWidth="11" fill="none" />
          <circle cx="80" cy="80" r={R} stroke={B.medium} strokeWidth="11" fill="none" strokeLinecap="round"
            strokeDasharray={CIRC} strokeDashoffset={offset} transform="rotate(-90 80 80)" />
          <text x="80" y="74" textAnchor="middle" fill={B.darkest} fontSize="30" fontWeight="800">{ACTUAL}</text>
          <text x="80" y="93" textAnchor="middle" fill={B.warm} fontSize="12">SMEs</text>
        </svg>
        <div style={{ fontSize:'12px', color:B.warm }}>Target: <strong style={{color:B.dark}}>{TARGET}</strong></div>
      </div>
    </Card>
  );
};

const PieChart = ({ title, subLabel, labels, values }) => (
  <Card title={title} subLabel={subLabel}>
    <div style={{ flex:1, minHeight:'220px' }}>
      <Pie options={pieOpts} data={{ labels, datasets:[{ data:values, backgroundColor:C.slice(0,labels.length), borderWidth:2, borderColor:'#fff' }] }} />
    </div>
  </Card>
);

const SMEsByHeadcount   = () => <PieChart title="SMEs by Headcount (#)"               subLabel="Pie chart — % and value" labels={['1–5','6–20','21–50','51–100','100+']} values={[28,35,22,12,6]} />;
const SMEsBySector      = () => <PieChart title="SMEs by Sector (#)"                  subLabel="Pie chart — % and value" labels={['Agri','Tech','Retail','Manufacturing','Services','Other']} values={[18,24,20,15,16,10]} />;
const SMEsByLifecycle   = () => <PieChart title="SMEs by Business Lifecycle Stage (#)" subLabel="Pie chart — % and value" labels={['Startup','Early Growth','Growth','Mature','Decline']} values={[22,31,27,14,9]} />;
const SMEsByGeography   = () => <PieChart title="SMEs by Geography (#)"               subLabel="Pie chart — % and value" labels={['Gauteng','WC','KZN','EC','LP','Other']} values={[34,22,19,12,8,8]} />;

/* ── DEMOGRAPHICS ── */
const SMEsByGender      = () => <PieChart title="SMEs by Gender (#)"            subLabel="Pie chart — % and value" labels={['Female','Male','Non-binary']} values={[52,45,6]} />;
const SMEsByDisability  = () => <PieChart title="SMEs by Disability Status (#)" subLabel="Pie chart — % and value" labels={['No disability','Disability disclosed']} values={[88,15]} />;
const SMEsByAge         = () => <PieChart title="SMEs by Age (#)"               subLabel="Pie chart — % and value" labels={['18–25','26–35','36–45','46–55','55+']} values={[11,37,30,17,8]} />;
const SMEsByHDIOwnership= () => <PieChart title="SMEs by HDI Ownership (#)"     subLabel="Pie chart — % and value" labels={['HDI Owned','Non-HDI']} values={[74,29]} />;

const SMEsByRevenue = () => {
  const [view, setView] = useState('pie');
  const labels = ['<R500k','R500k–1M','R1M–5M','R5M–10M','R10M+'];
  return (
    <Card title="SMEs by Revenue (#) & Avg Revenue per SME" subLabel={view==='pie' ? 'Pie chart — distribution' : 'Range Bar — avg, min, max'}>
      <div style={{ display:'flex', gap:'6px', marginBottom:'10px' }}>
        <Pill label="Distribution" active={view==='pie'} onClick={()=>setView('pie')} />
        <Pill label="Range" active={view==='range'} onClick={()=>setView('range')} />
      </div>
      <div style={{ flex:1, minHeight:'200px' }}>
        {view==='pie'
          ? <Pie options={pieOpts} data={{ labels, datasets:[{ data:[30,28,24,12,9], backgroundColor:C.slice(0,5), borderWidth:2, borderColor:'#fff' }] }} />
          : <Bar options={barOpts(v=>'R'+v+'k')} data={{ labels, datasets:[
              { label:'Min', data:[120,520,1050,5100,10500], backgroundColor:C[4] },
              { label:'Avg', data:[280,740,2800,7200,14800], backgroundColor:C[2] },
              { label:'Max', data:[490,980,4900,9800,28000], backgroundColor:C[0] },
            ]}} />
        }
      </div>
    </Card>
  );
};

/* ── SUPPORT FOCUS ── */
const SMEsBySupportFocus = () => (
  <Card title="SMEs by Support Focus (#)" subLabel="Horizontal Bar Chart">
    <div style={{ flex:1, minHeight:'240px' }}>
      <Bar options={barOpts(undefined, true)} data={{ labels:['Financial Mgmt','Market Access','Tech Adoption','HR & Compliance','Product Dev','Leadership'], datasets:[
        { label:'# SMEs', data:[42,38,35,29,24,18], backgroundColor:C[2] },
      ]}} />
    </div>
  </Card>
);

const SMEsByFundingType = () => (
  <Card title="SMEs by Funding Type / Instrument" subLabel="Horizontal Bar Chart">
    <div style={{ flex:1, minHeight:'240px' }}>
      <Bar options={barOpts(undefined, true)} data={{ labels:['Grant','Equity','Debt','Blended Finance','Revenue Share'], datasets:[
        { label:'# SMEs', data:[48,22,18,10,5], backgroundColor:C[1] },
      ]}} />
    </div>
  </Card>
);

const FundingAllocationBySector = () => (
  <PieChart title="Funding Allocation (ZAR) by Sector" subLabel="Pie chart — % and value"
    labels={['Agri','Tech','Retail','Manufacturing','Services','Other']}
    values={[2800000,3200000,1900000,2100000,1500000,900000]} />
);

const AverageFundingPerSME = () => (
  <Card title="Average Funding per SME" subLabel="Range Bar Chart — min, avg, max">
    <div style={{ flex:1, minHeight:'220px' }}>
      <Bar options={barOpts(v=>'R'+v+'k')} data={{ labels:['Cohort A','Cohort B','Cohort C','Cohort D','Cohort E'], datasets:[
        { label:'Min (R)', data:[50,40,65,35,55], backgroundColor:C[4] },
        { label:'Avg (R)', data:[120,105,148,92,135], backgroundColor:C[2] },
        { label:'Max (R)', data:[220,190,280,175,250], backgroundColor:C[0] },
      ]}} />
    </div>
  </Card>
);

/* ── Main Tab ── */
const PortfolioHealth = () => {
  const [sub, setSub] = useState('composition');
  return (
    <div style={{ width:'100%' }}>
      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'20px' }}>
        {SUBS.map(s => <Pill key={s.id} label={s.label} active={sub===s.id} onClick={()=>setSub(s.id)} />)}
      </div>

      {sub==='composition' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(380px, 1fr))', gap:'20px' }}>
          <TotalSMEsCount /><SMEsByHeadcount /><SMEsBySector /><SMEsByLifecycle /><SMEsByGeography />
        </div>
      )}

      {sub==='demographics' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(380px, 1fr))', gap:'20px' }}>
          <SMEsByGender /><SMEsByDisability /><SMEsByAge /><SMEsByHDIOwnership /><SMEsByRevenue />
        </div>
      )}

      {sub==='support' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(380px, 1fr))', gap:'20px' }}>
          <SMEsBySupportFocus /><SMEsByFundingType /><FundingAllocationBySector /><AverageFundingPerSME />
        </div>
      )}
    </div>
  );
};

export default PortfolioHealth;
