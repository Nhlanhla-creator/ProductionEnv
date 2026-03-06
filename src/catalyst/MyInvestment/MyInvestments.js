import React, { useState, useEffect } from 'react';
import { FiSearch, FiActivity, FiTrendingUp, FiTarget, FiLogOut, FiAward, FiBookOpen } from 'react-icons/fi';
import CohortSelection from './CohortSelection';
import PortfolioHealth from './PortfolioHealth';
import Performance from './Performance';
import Outcomes from './Outcomes';
import Exit from './Exit';
import TopBottom from './TopBottom';
import Learnings from './Learnings';

const TABS = [
  { id:'cohort-selection', label:'Cohort Selection',  icon:FiSearch,     purpose:'Assess and select SMEs based on BIG score, match strength, vetting time and pipeline progress.' },
  { id:'portfolio-health', label:'Portfolio Health',  icon:FiActivity,   purpose:'Understand composition, demographics and support focus across your active cohort.' },
  { id:'performance',      label:'Performance',       icon:FiTrendingUp, purpose:'Track financial growth, market penetration and capital raised by cohort SMEs.' },
  { id:'outcomes',         label:'Outcomes',          icon:FiTarget,     purpose:'Measure social and economic impact including jobs created across the cohort.' },
  { id:'exit',             label:'Exit',              icon:FiLogOut,     purpose:'Monitor graduation numbers and average time SMEs spend in the programme.' },
  { id:'top-bottom',       label:'Top & Bottom',      icon:FiAward,      purpose:'Surface the top 3 and bottom 3 performers across key metrics for targeted support.' },
  { id:'learnings',        label:'Learnings',         icon:FiBookOpen,   purpose:'Identify the support areas and capability gaps most frequently requested by cohort SMEs.' },
];

const MyPortfolio = () => {
  const [activeTab, setActiveTab] = useState('cohort-selection');
  const [collapsed, setCollapsed] = useState(false);

  // Watch sidebar state via body class
  useEffect(() => {
    const check = () => setCollapsed(document.body.classList.contains('sidebar-collapsed'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.body, { attributes:true, attributeFilter:['class'] });
    return () => obs.disconnect();
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case 'cohort-selection': return <CohortSelection />;
      case 'portfolio-health': return <PortfolioHealth />;
      case 'performance':      return <Performance />;
      case 'outcomes':         return <Outcomes />;
      case 'exit':             return <Exit />;
      case 'top-bottom':       return <TopBottom />;
      case 'learnings':        return <Learnings />;
      default:                 return null;
    }
  };

  const current = TABS.find(t => t.id === activeTab);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#faf6f1',
      paddingTop: '70px',
      paddingLeft: collapsed ? '100px' : '270px',
      paddingRight: '24px',
      paddingBottom: '32px',
      transition: 'padding-left 0.3s ease',
      boxSizing: 'border-box',
      width: '100%',
    }}>

      {/* Header */}
      <div style={{ marginBottom:'20px' }}>
        <h1 style={{ fontSize:'22px', fontWeight:'800', color:'#3b2409', margin:'0 0 3px 0' }}>My Portfolio</h1>
        <p style={{ fontSize:'13px', color:'#8a6a4a', margin:0 }}>Catalyst deal flow &amp; cohort analytics</p>
      </div>

      {/* Tab bar */}
      <div style={{
        display:'flex', gap:'5px', flexWrap:'wrap',
        background:'#fff', borderRadius:'10px', padding:'6px',
        border:'1px solid #e8ddd0', boxShadow:'0 2px 8px rgba(59,36,9,0.06)',
        marginBottom:'0',
      }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display:'flex', alignItems:'center', gap:'7px',
              padding:'9px 15px', borderRadius:'7px', border:'none', cursor:'pointer',
              fontSize:'13px', whiteSpace:'nowrap', flex:'1 1 auto', justifyContent:'center',
              fontWeight: active ? 700 : 500,
              background: active ? '#7d5a36' : 'transparent',
              color: active ? '#fff' : '#7d5a36',
              boxShadow: active ? '0 3px 10px rgba(125,90,54,0.3)' : 'none',
              transition: 'all 0.15s',
            }}>
              <tab.icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active accent line */}
      <div style={{ height:'3px', background:'#7d5a36', borderRadius:'0 0 4px 4px', marginBottom:'16px' }} />

      {/* Purpose bar */}
      <div style={{
        background:'#fff', borderLeft:'4px solid #7d5a36',
        borderRadius:'0 8px 8px 0', padding:'11px 16px',
        marginBottom:'20px', fontSize:'13px', color:'#5e3f26',
        boxShadow:'0 1px 4px rgba(59,36,9,0.05)',
      }}>
        <strong style={{ color:'#3b2409' }}>Purpose: </strong>{current?.purpose}
      </div>

      {/* Tab content */}
      {renderTab()}
    </div>
  );
};

export default MyPortfolio;
