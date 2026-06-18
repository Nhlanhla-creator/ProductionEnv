"use client"
import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"
import {
  FaUsers, FaUserTie, FaHandHoldingHeart, FaChevronRight,
  FaChevronDown, FaChevronUp, FaLightbulb, FaHandshake,
  FaCheck, FaBullseye, FaShieldAlt, FaLock, FaRocket,
  FaStar, FaQuoteLeft, FaChartLine, FaBuilding, FaChartBar,
  FaTrophy, FaCommentDots, FaHome, FaUser, FaClipboardList,
  FaHeart, FaCog, FaFileAlt, FaEnvelope, FaCalendarAlt,
  FaBell, FaSearch, FaCreditCard, FaArrowUp
} from "react-icons/fa"
import { MdCorporateFare, MdVerified, MdSmartphone, MdDashboard, MdTrendingUp, MdGroup } from "react-icons/md"
import "./LandingPage.css"
import { useNavigate } from "react-router-dom"
import Chatbox from "./Chatbox"

const C = {
  dark:"#1C1410", sidebar:"#2E2218", primary:"#7C4D2A", secondary:"#A0703E",
  amber:"#D4894A", light:"#F5F0E8", cream:"#FAF7F2", white:"#FFFFFF",
  border:"#EAE2D8", muted:"#7A6A5E", neutral:"#CDC3B8", accent:"#C4B09A",
  green:"#1E7A47", greenBg:"#E4F4EB", orange:"#E8831A", orangeBg:"#FEF3E8",
  red:"#BE3B2A", redBg:"#FDE8E5", blue:"#1D5FAA", blueBg:"#E6EFF9",
  card:"#FFFFFF", pageBg:"#F0EBE2",
}

const CountdownTimer = ({ isMobile, onCountdownEnd }) => {
  const [t, setT] = useState({ d:0,h:0,m:0,s:0 })
  const calc = useCallback(() => {
    const diff = new Date("October 1, 2025 00:00:00") - new Date()
    if (diff > 0) setT({ d:Math.floor(diff/86400000),h:Math.floor((diff/3600000)%24),m:Math.floor((diff/60000)%60),s:Math.floor((diff/1000)%60) })
    else { setT({d:0,h:0,m:0,s:0}); onCountdownEnd?.() }
  }, [onCountdownEnd])
  useEffect(() => { calc(); const id=setInterval(calc,1000); return ()=>clearInterval(id) }, [calc])
  const Box=({val,lbl})=>(
    <div style={{textAlign:"center"}}>
      <div style={{background:"rgba(255,255,255,0.15)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.25)",color:"#fff",borderRadius:10,fontWeight:800,fontSize:isMobile?"1.1rem":"1.5rem",minWidth:isMobile?48:62,padding:"10px 12px",letterSpacing:"0.02em"}}>{String(val).padStart(2,"0")}</div>
      <div style={{fontSize:"0.58rem",marginTop:5,color:"rgba(255,255,255,0.6)",fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase"}}>{lbl}</div>
    </div>
  )
  return (
    <div style={{display:"flex",gap:10,alignItems:"flex-start",flexWrap:"wrap",justifyContent:"center"}}>
      <Box val={t.d} lbl="Days"/><span style={{color:"rgba(255,255,255,0.4)",fontSize:"1.5rem",marginTop:8}}>:</span>
      <Box val={t.h} lbl="Hrs"/><span style={{color:"rgba(255,255,255,0.4)",fontSize:"1.5rem",marginTop:8}}>:</span>
      <Box val={t.m} lbl="Min"/><span style={{color:"rgba(255,255,255,0.4)",fontSize:"1.5rem",marginTop:8}}>:</span>
      <Box val={t.s} lbl="Sec"/>
    </div>
  )
}

const RegModal = ({ onClose, isMobile }) => (
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,backdropFilter:"blur(4px)"}}>
    <div style={{background:C.white,borderRadius:20,padding:isMobile?"24px":"40px",maxWidth:480,width:"92%",boxShadow:"0 32px 80px rgba(0,0,0,0.3)",position:"relative"}}>
      <button onClick={onClose} style={{position:"absolute",top:16,right:18,background:"none",border:"none",fontSize:"1.4rem",cursor:"pointer",color:C.muted,lineHeight:1,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8}}>x</button>
      <div style={{width:56,height:56,borderRadius:16,background:C.orangeBg,border:`2px solid ${C.orange}40`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16}}><FaRocket size={22} color={C.orange}/></div>
      <h2 style={{fontSize:"1.35rem",fontWeight:800,color:C.dark,margin:"0 0 8px"}}>Launching October 1, 2025</h2>
      <p style={{fontSize:"0.88rem",color:C.muted,lineHeight:1.6,marginBottom:20}}>Join thousands of African businesses growing smarter on BIG Marketplace.</p>
      <CountdownTimer isMobile={isMobile}/>
      <div style={{display:"flex",gap:10,marginTop:24,flexDirection:isMobile?"column":"row"}}>
        <button onClick={onClose} style={{flex:1,background:"transparent",color:C.muted,border:`1.5px solid ${C.border}`,padding:"11px 20px",borderRadius:50,cursor:"pointer",fontSize:"0.87rem",fontWeight:600}}>Close</button>
        <Link to="/HowItWorks" onClick={onClose} style={{flex:1,background:C.primary,color:"#fff",padding:"11px 20px",borderRadius:50,fontSize:"0.87rem",fontWeight:700,textDecoration:"none",display:"inline-block",textAlign:"center"}}>Explore Demo</Link>
      </div>
    </div>
  </div>
)

const ScoreRing = ({ pct=61, size=110 }) => {
  const r=(size/2)-10, circ=2*Math.PI*r, dash=(pct/100)*circ
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={9}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.orange} strokeWidth={9} strokeLinecap="round" strokeDasharray={`${dash} ${circ-dash}`}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:"1.3rem",fontWeight:900,color:"#fff",lineHeight:1}}>{pct}%</span>
        <span style={{fontSize:"0.5rem",color:"rgba(255,255,255,0.55)",marginTop:2,textTransform:"uppercase",letterSpacing:"0.08em"}}>Score</span>
      </div>
    </div>
  )
}

const HeroScoreWidget = () => (
  <div style={{background:"rgba(255,255,255,0.06)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.14)",borderRadius:20,padding:"24px",minWidth:320,maxWidth:360,flexShrink:0}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
      <div>
        <div style={{fontSize:"0.7rem",color:"rgba(255,255,255,0.55)",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>Your BIG Score</div>
        <div style={{fontSize:"2.2rem",fontWeight:900,color:"#fff",lineHeight:1}}>61<span style={{fontSize:"1rem",fontWeight:500,color:"rgba(255,255,255,0.5)"}}>/100</span></div>
        <div style={{marginTop:6,display:"inline-flex",alignItems:"center",gap:5,background:C.orange+"33",border:`1px solid ${C.orange}55`,borderRadius:20,padding:"3px 10px"}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:C.orange,display:"inline-block"}}/>
          <span style={{fontSize:"0.68rem",fontWeight:700,color:C.orange}}>Progressing</span>
        </div>
      </div>
      <ScoreRing pct={61} size={100}/>
    </div>
    {[
      {label:"Compliance",  pct:29, color:C.red},
      {label:"Legitimacy",  pct:90, color:C.green},
      {label:"Leadership",  pct:72, color:C.orange},
      {label:"Governance",  pct:90, color:C.green},
      {label:"Capital Appeal",pct:65,color:C.orange},
    ].map(d=>(
      <div key={d.label} style={{marginBottom:9}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
          <span style={{fontSize:"0.72rem",color:"rgba(255,255,255,0.7)",fontWeight:500}}>{d.label}</span>
          <span style={{fontSize:"0.72rem",fontWeight:700,color:d.color}}>{d.pct}%</span>
        </div>
        <div style={{height:5,background:"rgba(255,255,255,0.1)",borderRadius:3,overflow:"hidden"}}>
          <div style={{width:`${d.pct}%`,height:"100%",background:d.color,borderRadius:3}}/>
        </div>
      </div>
    ))}
  </div>
)

const SMSESidebar = ({ active="score" }) => {
  const items=[
    {id:"home",   icon:<FaHome size={14}/>,          label:"Home"},
    {id:"profile",icon:<FaUser size={14}/>,           label:"My Profile"},
    {id:"score",  icon:<FaChartBar size={14}/>,       label:"My BIG Score"},
    {id:"apps",   icon:<FaClipboardList size={14}/>,  label:"My Applications"},
    {id:"matches",icon:<FaHeart size={14}/>,           label:"My Matches"},
    {id:"growth", icon:<MdTrendingUp size={14}/>,     label:"My Growth Suite"},
    {id:"insights",icon:<FaChartLine size={14}/>,     label:"BIG Insights"},
    {id:"docs",   icon:<FaFileAlt size={14}/>,        label:"My Documents"},
    {id:"msgs",   icon:<FaEnvelope size={14}/>,       label:"My Messages"},
    {id:"cal",    icon:<FaCalendarAlt size={14}/>,    label:"My Calendar"},
  ]
  return (
    <div style={{width:200,flexShrink:0,background:C.sidebar,borderRadius:"12px 0 0 12px",padding:"16px 10px",display:"flex",flexDirection:"column",gap:2}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",marginBottom:12}}>
        <div style={{width:34,height:34,borderRadius:10,background:C.primary,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#fff",fontSize:"0.9rem"}}>A</div>
        <div>
          <div style={{color:"#fff",fontWeight:700,fontSize:"0.82rem",lineHeight:1.2}}>Amara Holdings</div>
          <div style={{color:C.accent,fontSize:"0.63rem",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>SMSE Dashboard</div>
        </div>
      </div>
      {items.map(it=>(
        <div key={it.id} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:8,background:it.id===active?"rgba(255,255,255,0.12)":"transparent",color:it.id===active?"#fff":C.accent,fontSize:"0.78rem",fontWeight:it.id===active?700:500,cursor:"pointer",transition:"background 0.15s"}}>
          <span style={{opacity:it.id===active?1:0.7}}>{it.icon}</span>{it.label}
        </div>
      ))}
    </div>
  )
}

const InvestorSidebar = ({ active="matches" }) => {
  const items=[
    {id:"home",     icon:<FaHome size={14}/>,         label:"Home"},
    {id:"profile",  icon:<FaUser size={14}/>,          label:"My Profile"},
    {id:"matches",  icon:<FaHeart size={14}/>,          label:"My Matches"},
    {id:"cohorts",  icon:<MdGroup size={14}/>,          label:"My Cohorts"},
    {id:"portfolio",icon:<FaChartBar size={14}/>,      label:"My Portfolio"},
    {id:"insights", icon:<FaChartLine size={14}/>,     label:"BIG Insights"},
    {id:"docs",     icon:<FaFileAlt size={14}/>,       label:"My Documents"},
    {id:"msgs",     icon:<FaEnvelope size={14}/>,      label:"My Messages"},
    {id:"cal",      icon:<FaCalendarAlt size={14}/>,   label:"My Calendar"},
    {id:"billing",  icon:<FaCreditCard size={14}/>,    label:"Billing & Payments"},
  ]
  return (
    <div style={{width:200,flexShrink:0,background:C.sidebar,borderRadius:"12px 0 0 12px",padding:"16px 10px",display:"flex",flexDirection:"column",gap:2}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",marginBottom:12}}>
        <div style={{width:34,height:34,borderRadius:10,background:C.green,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#fff",fontSize:"0.9rem"}}>N</div>
        <div>
          <div style={{color:"#fff",fontWeight:700,fontSize:"0.82rem",lineHeight:1.2}}>Nomvula Capital</div>
          <div style={{color:C.accent,fontSize:"0.63rem",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>Investor Portal</div>
        </div>
      </div>
      {items.map(it=>(
        <div key={it.id} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:8,background:it.id===active?"rgba(255,255,255,0.12)":"transparent",color:it.id===active?"#fff":C.accent,fontSize:"0.78rem",fontWeight:it.id===active?700:500,cursor:"pointer",transition:"background 0.15s"}}>
          <span style={{opacity:it.id===active?1:0.7}}>{it.icon}</span>{it.label}
        </div>
      ))}
    </div>
  )
}

const SMSEDashboard = () => {
  const [bdOpen,setBdOpen]=useState(false)
  const subScores=[
    {label:"Compliance score",  dot:C.red,   pct:29, weight:32,color:C.red},
    {label:"Legitimacy score",  dot:C.green, pct:90, weight:13,color:C.green},
    {label:"Leadership score",  dot:C.orange,pct:72, weight:10,color:C.orange},
    {label:"Governance score",  dot:C.green, pct:90, weight:13,color:C.green},
    {label:"Capital appeal score",dot:C.orange,pct:65,weight:32,color:C.orange},
  ]
  return (
    <div style={{display:"flex",borderRadius:14,overflow:"hidden",boxShadow:"0 8px 40px rgba(28,20,16,0.18)",border:`1px solid ${C.border}`,width:"100%"}}>
      <SMSESidebar active="score"/>
      <div style={{flex:1,background:"#F5F0E8",minWidth:0}}>
        <div style={{background:C.white,borderBottom:`1px solid ${C.border}`,padding:"10px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <div style={{width:28,height:28,borderRadius:8,background:C.primary,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#fff",fontSize:"0.85rem"}}>B</div>
              <div style={{fontWeight:800,fontSize:"0.9rem",color:C.dark,letterSpacing:"-0.01em"}}>BIG <span style={{color:C.primary}}>Marketplace</span></div>
            </div>
            <div style={{width:1,height:20,background:C.border}}/>
            <div>
              <span style={{fontSize:"0.8rem",color:C.muted}}>Welcome back, <strong style={{color:C.dark}}>Amara Holdings</strong></span>
              <div style={{fontSize:"0.65rem",color:C.muted}}>Monday, June 15, 2026</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button style={{background:C.amber+"22",color:C.secondary,border:`1px solid ${C.amber}44`,borderRadius:20,padding:"5px 12px",fontSize:"0.7rem",fontWeight:700,cursor:"pointer"}}>Feedback</button>
            <button style={{background:C.primary,color:"#fff",border:"none",borderRadius:20,padding:"5px 12px",fontSize:"0.7rem",fontWeight:700,cursor:"pointer"}}>Book Session</button>
            <FaBell size={14} color={C.muted}/>
          </div>
        </div>
        <div style={{display:"flex",gap:0,borderBottom:`1px solid ${C.border}`}}>
          <button style={{flex:1,padding:"10px",background:C.sidebar,color:"#fff",border:"none",fontSize:"0.8rem",fontWeight:700,cursor:"pointer"}}>BIG Score</button>
          <button style={{flex:1,padding:"10px",background:"transparent",color:C.muted,border:"none",fontSize:"0.8rem",fontWeight:500,cursor:"pointer",borderLeft:`1px solid ${C.border}`}}>Improve My BIG Score</button>
        </div>
        <div style={{padding:"14px 16px",background:C.white,borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontSize:"0.85rem",fontWeight:700,color:C.dark,borderBottom:`2px solid ${C.amber}`,paddingBottom:2}}>Application Tracker</span>
            <span style={{fontSize:"0.68rem",color:C.muted}}>Track your application status across different opportunities</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
            {[{label:"Funding & Support",ok:true},{label:"Products & Services",ok:true},{label:"Advisory/Board Member",ok:false},{label:"Intern",ok:true}].map(item=>(
              <div key={item.label} style={{background:item.ok?C.greenBg:C.redBg,border:`1px solid ${item.ok?C.green:C.red}30`,borderRadius:8,padding:"10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:"0.69rem",fontWeight:600,color:C.dark,lineHeight:1.3,flex:1}}>{item.label}</span>
                <div style={{flexShrink:0,textAlign:"center"}}>
                  <div style={{width:18,height:18,borderRadius:"50%",background:item.ok?C.green:C.red,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 2px"}}>{item.ok?<FaCheck size={8} color="#fff"/>:<span style={{color:"#fff",fontSize:"0.6rem",fontWeight:900}}>x</span>}</div>
                  <span style={{fontSize:"0.58rem",fontWeight:700,color:item.ok?C.green:C.red,whiteSpace:"nowrap"}}>{item.ok?"Applied":"Not Applied"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,padding:"14px 16px"}}>
          <div style={{background:C.white,borderRadius:12,padding:"16px",boxShadow:`0 2px 8px rgba(0,0,0,0.06)`,border:`1px solid ${C.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{fontSize:"0.75rem",color:C.muted,fontWeight:700,marginBottom:4}}>BIG Score</div>
                <div style={{fontSize:"0.68rem",color:C.muted}}>Overall business assessment</div>
              </div>
              <button style={{background:C.sidebar+"18",color:C.muted,border:"none",borderRadius:6,padding:"3px 8px",fontSize:"0.62rem",cursor:"pointer",display:"flex",alignItems:"center",gap:3}}><FaCommentDots size={9}/> Help</button>
            </div>
            <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>
              <div style={{position:"relative",width:80,height:80}}>
                <svg width={80} height={80} style={{transform:"rotate(-90deg)"}}>
                  <circle cx={40} cy={40} r={32} fill="none" stroke="#ECE5DE" strokeWidth={8}/>
                  <circle cx={40} cy={40} r={32} fill="none" stroke={C.orange} strokeWidth={8} strokeLinecap="round" strokeDasharray={`${0.61*2*Math.PI*32} ${2*Math.PI*32}`}/>
                </svg>
                <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:"1.1rem",fontWeight:900,color:C.dark,lineHeight:1}}>61%</span>
                </div>
              </div>
            </div>
            <div style={{textAlign:"center",marginBottom:12}}>
              <span style={{background:C.orange,color:"#fff",fontSize:"0.6rem",fontWeight:800,padding:"3px 10px",borderRadius:20,letterSpacing:"0.05em"}}>PROGRESSING</span>
            </div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>setBdOpen(o=>!o)} style={{flex:1,background:C.sidebar,color:"#fff",border:"none",borderRadius:7,padding:"7px 0",fontSize:"0.65rem",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:3}}>Score breakdown {bdOpen?<FaChevronUp size={8}/>:<FaChevronDown size={8}/>}</button>
              <button style={{flex:1,background:C.orangeBg,color:C.orange,border:`1px solid ${C.orange}44`,borderRadius:7,padding:"7px 0",fontSize:"0.65rem",fontWeight:700,cursor:"pointer"}}>Improve score</button>
            </div>
            {bdOpen&&(
              <div style={{marginTop:10,borderTop:`1px solid ${C.border}`,paddingTop:10}}>
                {subScores.map((s,i)=>(
                  <div key={s.label} style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                      <div style={{display:"flex",alignItems:"center",gap:5}}>
                        <span style={{width:7,height:7,borderRadius:"50%",background:s.dot,flexShrink:0}}/>
                        <span style={{fontSize:"0.65rem",fontWeight:600,color:C.dark}}>{s.label}</span>
                      </div>
                      <span style={{fontSize:"0.62rem",color:s.color,fontWeight:700}}>{s.pct}%</span>
                    </div>
                    <div style={{height:4,background:"#EDE8E3",borderRadius:3,overflow:"hidden"}}><div style={{width:`${s.pct}%`,height:"100%",background:s.color,borderRadius:3}}/></div>
                    <div style={{fontSize:"0.58rem",color:C.muted,marginTop:1}}>{s.pct}% x {s.weight}% wt = {Math.round(s.pct*s.weight/100)}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{background:C.white,borderRadius:12,padding:"16px",boxShadow:`0 2px 8px rgba(0,0,0,0.06)`,border:`1px solid ${C.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div><div style={{fontSize:"0.75rem",color:C.muted,fontWeight:700,marginBottom:2}}>Customer Reviews</div><div style={{fontSize:"0.65rem",color:C.muted}}>Client Feedback and Ratings</div></div>
              <FaCommentDots size={14} color={C.muted}/>
            </div>
            <div style={{background:C.cream,borderRadius:10,padding:"14px",marginBottom:12,display:"flex",alignItems:"center",gap:14}}>
              <span style={{fontSize:"2rem",fontWeight:900,color:C.dark}}>2</span>
              <div>
                <div style={{display:"flex",gap:2,marginBottom:4}}>{[1,2,3,4].map(i=><FaStar key={i} size={12} color="#F59E0B"/>)}<FaStar size={12} color={C.border}/></div>
                <div style={{fontSize:"0.7rem",fontWeight:700,color:C.secondary}}>4.0 Commended</div>
                <div style={{fontSize:"0.6rem",color:C.muted}}>Reviews</div>
              </div>
            </div>
            <button style={{width:"100%",background:C.green,color:"#fff",border:"none",borderRadius:8,padding:"8px",fontSize:"0.7rem",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><FaStar size={10}/> Great Feedback</button>
          </div>
          <div style={{background:C.sidebar,borderRadius:12,padding:"16px",boxShadow:`0 2px 8px rgba(0,0,0,0.06)`}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <FaFileAlt size={14} color={C.accent}/>
              <div><div style={{color:"#fff",fontWeight:700,fontSize:"0.78rem"}}>BIG Score Summary Analysis</div><div style={{color:C.accent,fontSize:"0.62rem"}}>05/06/2026</div></div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:"#FF6B9D"}}/>
              <span style={{color:"#fff",fontSize:"0.7rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>Top 3 Priorities</span>
            </div>
            {[{t:"Overall Readiness",d:"Address fundamental business readiness..."},{t:"Leadership Development",d:"Enhance leadership team capabilities..."},{t:"Governance Structure",d:"Strengthen your governance framew..."}].map(p=>(
              <div key={p.t} style={{background:"rgba(255,255,255,0.1)",borderRadius:8,padding:"8px",marginBottom:6}}>
                <div style={{color:"#fff",fontSize:"0.7rem",fontWeight:700,marginBottom:2}}>{p.t}</div>
                <div style={{color:C.accent,fontSize:"0.62rem",lineHeight:1.4}}>{p.d}</div>
              </div>
            ))}
            <button style={{width:"100%",background:"rgba(255,255,255,0.12)",color:"#fff",border:"none",borderRadius:8,padding:"8px",fontSize:"0.7rem",fontWeight:700,cursor:"pointer",marginTop:4,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><FaFileAlt size={10}/> View Full Summary</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const InvestorDashboard = () => {
  const stages=[
    {label:"Matches",n:27,bg:C.primary},{label:"Application",n:4,bg:C.sidebar},
    {label:"Evaluation",n:0,bg:C.sidebar},{label:"Due Diligence",n:0,bg:C.sidebar},
    {label:"Decision",n:0,bg:C.sidebar},{label:"Terms Issue",n:1,bg:C.sidebar},
    {label:"Deals Closed",n:2,bg:C.green},{label:"Withdrawn/Declined",n:1,bg:C.red},
  ]
  const rows=[
    {name:"yale",  loc:"South Africa",sector:"Banking, Finance & Insurance",stage:"Growth/pe",funding:"R10,000,000",equity:"Equity",support:"Network Access",date:"2025-09-22",match:80,score:21},
    {name:"ivory", loc:"South Africa",sector:"Information Technology (it)",  stage:"Growth/pe",funding:"R800,000",  equity:"Equity",support:"Network Access",date:"2025-10-03",match:99,score:69},
    {name:"CO_OPS",loc:"South Africa",sector:"Information Technology (it)",  stage:"Growth/pe",funding:"R5,000,000",equity:"Conv. Notes, Grants, Debt",support:"Incubation",date:"2026-03-23",match:100,score:61},
  ]
  const Bar=({pct,color})=>(
    <div style={{display:"flex",alignItems:"center",gap:5}}>
      <div style={{width:44,height:5,background:"#EDE8E3",borderRadius:3,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:3}}/></div>
      <span style={{fontSize:"0.68rem",fontWeight:800,color}}>{pct}%</span>
    </div>
  )
  return (
    <div style={{display:"flex",borderRadius:14,overflow:"hidden",boxShadow:"0 8px 40px rgba(28,20,16,0.18)",border:`1px solid ${C.border}`,width:"100%"}}>
      <InvestorSidebar active="matches"/>
      <div style={{flex:1,background:"#F5F0E8",minWidth:0}}>
        <div style={{background:C.white,borderBottom:`1px solid ${C.border}`,padding:"10px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <div style={{width:28,height:28,borderRadius:8,background:C.primary,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#fff",fontSize:"0.85rem"}}>B</div>
              <div style={{fontWeight:800,fontSize:"0.9rem",color:C.dark,letterSpacing:"-0.01em"}}>BIG <span style={{color:C.primary}}>Marketplace</span></div>
            </div>
            <div style={{width:1,height:20,background:C.border}}/>
            <div>
              <span style={{fontSize:"0.8rem",color:C.muted}}>Welcome back, <strong style={{color:C.dark}}>Nomvula Capital</strong></span>
              <div style={{fontSize:"0.65rem",color:C.muted}}>Monday, June 15, 2026</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button style={{background:C.amber+"22",color:C.secondary,border:`1px solid ${C.amber}44`,borderRadius:20,padding:"5px 12px",fontSize:"0.7rem",fontWeight:700,cursor:"pointer"}}>Feedback</button>
            <button style={{background:C.primary,color:"#fff",border:"none",borderRadius:20,padding:"5px 12px",fontSize:"0.7rem",fontWeight:700,cursor:"pointer"}}>Book Session</button>
            <div style={{position:"relative"}}><FaBell size={14} color={C.muted}/><div style={{position:"absolute",top:-4,right:-4,width:14,height:14,background:C.red,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.5rem",color:"#fff",fontWeight:900}}>5</div></div>
          </div>
        </div>
        <div style={{padding:"14px 16px 0"}}>
          <h3 style={{fontSize:"1rem",fontWeight:800,color:C.dark,margin:"0 0 12px"}}>DealFlow Pipeline</h3>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
            {stages.map(s=>(
              <div key={s.label} style={{background:s.bg,borderRadius:10,padding:"8px 12px",textAlign:"center",minWidth:72,flex:"0 0 auto"}}>
                <div style={{color:"rgba(255,255,255,0.6)",fontSize:"0.58rem",fontWeight:700,marginBottom:3,whiteSpace:"nowrap"}}>{s.label}</div>
                <div style={{color:"#fff",fontSize:"1.2rem",fontWeight:900}}>{s.n}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,marginBottom:0}}>
            <div style={{padding:"8px 14px",background:C.primary,color:"#fff",fontSize:"0.78rem",fontWeight:700,display:"flex",alignItems:"center",gap:6,cursor:"pointer",borderRadius:"8px 8px 0 0"}}><FaUsers size={11}/> My Matches</div>
            <div style={{padding:"8px 14px",color:C.muted,fontSize:"0.78rem",fontWeight:600,display:"flex",alignItems:"center",gap:5,cursor:"pointer"}}><FaTrophy size={11} color={C.amber}/> Successful Deals <span style={{background:C.green,color:"#fff",fontSize:"0.58rem",borderRadius:20,padding:"1px 6px",fontWeight:900}}>2</span></div>
          </div>
          <div style={{background:C.white,borderRadius:"0 8px 8px 8px",border:`1px solid ${C.border}`,overflowX:"auto",marginBottom:14}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.68rem",tableLayout:"auto"}}>
              <thead><tr style={{background:C.cream}}>
                {["SMSE Name","Location","Sector","Stage","Funding Required","Equity Offered","Guarantees","Support Required","Application Date","% Match","Big Score"].map(h=>(
                  <th key={h} style={{padding:"8px 9px",textAlign:"left",color:C.muted,fontWeight:700,borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap",fontSize:"0.63rem"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{rows.map((row,i)=>(
                <tr key={row.name} style={{background:i%2===0?C.white:C.cream,borderBottom:`1px solid ${C.border}`}}>
                  <td style={{padding:"8px 9px"}}><span style={{color:C.primary,fontWeight:700,cursor:"pointer",textDecoration:"underline",textUnderlineOffset:2}}>{row.name}</span></td>
                  <td style={{padding:"8px 9px",color:C.dark,whiteSpace:"nowrap"}}>{row.loc}</td>
                  <td style={{padding:"8px 9px",color:C.dark}}>{row.sector}</td>
                  <td style={{padding:"8px 9px",color:C.dark,whiteSpace:"nowrap"}}>{row.stage}</td>
                  <td style={{padding:"8px 9px",color:C.dark,whiteSpace:"nowrap"}}>{row.funding}</td>
                  <td style={{padding:"8px 9px",color:C.dark}}>{row.equity}</td>
                  <td style={{padding:"8px 9px"}}><span style={{color:C.primary,textDecoration:"underline",cursor:"pointer",fontSize:"0.65rem"}}>View guarantees</span></td>
                  <td style={{padding:"8px 9px",color:C.dark}}>{row.support}</td>
                  <td style={{padding:"8px 9px",color:C.dark,whiteSpace:"nowrap"}}>{row.date}</td>
                  <td style={{padding:"8px 9px"}}><Bar pct={row.match} color={C.green}/></td>
                  <td style={{padding:"8px 9px"}}><Bar pct={row.score} color={C.primary}/></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

const LandingPage = () => {
  const navigate=useNavigate()
  const [showScroll,setShowScroll]=useState(false)
  const [showModal,setShowModal]=useState(false)
  const [winW,setWinW]=useState(window.innerWidth)
  const [regOpen,setRegOpen]=useState(false)
  const [activeTab,setActiveTab]=useState("smse")

  useEffect(()=>{ const r=()=>setWinW(window.innerWidth); window.addEventListener("resize",r); return ()=>window.removeEventListener("resize",r) },[])
  useEffect(()=>{ const s=()=>setShowScroll(window.scrollY>400); window.addEventListener("scroll",s); return ()=>window.removeEventListener("scroll",s) },[])

  const mobile=winW<=768
  const go=()=>regOpen?navigate("/loginRegister"):setShowModal(true)

  const benefits=[
    {title:"SMSEs",     icon:<FaUsers size={18}/>,             color:C.primary,   tagline:"Be Seen. Be Matched. Grow.",        desc:"Get matched with funders, service providers, and strategic support through one universal profile.",   link:"/HowItWorksSMSE",      tip:"Small, Medium and Social Enterprises."},
    {title:"Investors", icon:<FaUserTie size={18}/>,           color:C.secondary, tagline:"Discover. Verify. Invest.",          desc:"Access verified, investment-ready SMEs with transparent scoring and predictive insights.",              link:"/HowItWorksInvestors", tip:"VCs, angel investors, and impact investors."},
    {title:"Corporates",icon:<MdCorporateFare size={18}/>,     color:"#4A3728",   tagline:"Source. Partner. Amplify Impact.",   desc:"Accelerate CSI and ESD impact by sourcing verified SMSEs that align with your strategic goals.",          link:"/HowItWorksCorporates",tip:"Large companies sourcing via CSI or ESD."},
    {title:"Catalysts", icon:<FaHandHoldingHeart size={18}/>,  color:"#8B6914",   tagline:"Accelerate. Mentor. Fund. Track.",   desc:"Support high-potential SMEs and monitor cohort outcomes via the BIG Score.",                            link:"/HowItWorksCatalysts", tip:"Incubators, accelerators, and development agencies."},
    {title:"Advisors",  icon:<FaUserTie size={18}/>,           color:"#5A5A5A",   tagline:"Guide. Mentor. Get Recognised.",     desc:"Connect with businesses that need your expertise and grow your advisory practice.",                       link:"/HowItWorksAdvisors",  tip:"Strategic advisors matched to businesses."},
    {title:"Interns",   icon:<FaUsers size={18}/>,             color:"#8A8A8A",   tagline:"Learn. Grow. Get Experience.",       desc:"Gain practical experience working with high-potential SMEs and build your professional network.",          link:"/HowItWorksInterns",   tip:"Students and graduates seeking practical experience."},
  ]
  const steps=[
    {n:"01",icon:<FaUser size={18}/>,     title:"Create Your Profile",    desc:"Sign up, upload your business details, and get verified across all key areas."},
    {n:"02",icon:<FaChartBar size={18}/>, title:"Receive Your BIG Score", desc:"Our AI evaluates your business across five weighted dimensions."},
    {n:"03",icon:<FaHandshake size={18}/>,title:"Unlock Opportunities",   desc:"Connect with funders, partners, and support programmes matched to your stage."},
    {n:"04",icon:<FaChartLine size={18}/>,title:"Grow Your Business",     desc:"Track progress, improve your score, and scale with expert support."},
  ]
  const testimonials=[
    {name:"Sipho M.", role:"Manufacturing Business", img:"https://randomuser.me/api/portraits/men/45.jpg",   stars:5, quote:"BIG Marketplace gave us credibility and connected us with the right investors. It is a complete game changer for African SMEs."},
    {name:"Lebo K.",  role:"Agri Business Founder",  img:"https://randomuser.me/api/portraits/women/32.jpg", stars:5, quote:"The BIG Score helped us understand our strengths and gave us the confidence to grow and apply for funding."},
    {name:"Thabo D.", role:"Impact Investor",         img:"https://randomuser.me/api/portraits/men/68.jpg",   stars:5, quote:"As an investor, I trust the data. BIG helps me find businesses with real verified potential."},
  ]
  const partners=["ABSA","Seda","SANBI","Standard Bank","AWS","Google for Startups"]

  const css=`
    *{box-sizing:border-box}
    .lp-a{background:linear-gradient(135deg,${C.amber},${C.secondary});color:#fff;border:none;border-radius:12px;padding:14px 32px;font-size:0.95rem;font-weight:800;cursor:pointer;font-family:inherit;transition:opacity 0.2s,transform 0.14s;letter-spacing:0.01em;box-shadow:0 4px 16px rgba(200,132,58,0.35)}
    .lp-a:hover{opacity:0.9;transform:translateY(-1px)}
    .lp-w{background:${C.white};color:${C.dark};border:2px solid ${C.dark};border-radius:12px;padding:14px 32px;font-size:0.95rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.2s;text-decoration:none;display:inline-block}
    .lp-w:hover{background:${C.dark};color:${C.white};border-color:${C.dark}}
    .lp-b{background:${C.primary};color:#fff;border:none;border-radius:12px;padding:13px 30px;font-size:0.93rem;font-weight:700;cursor:pointer;font-family:inherit;transition:background 0.2s,transform 0.14s}
    .lp-b:hover{background:#5A3420;transform:translateY(-1px)}
    .lp-g{background:${C.green};color:#fff;border:none;border-radius:12px;padding:13px 30px;font-size:0.93rem;font-weight:700;cursor:pointer;font-family:inherit;transition:background 0.2s,transform 0.14s}
    .lp-g:hover{background:#155A34;transform:translateY(-1px)}
    .ben-card{background:${C.card};border-radius:16px;padding:22px 18px;border:1px solid ${C.border};display:flex;flex-direction:column;transition:transform 0.22s,box-shadow 0.22s,border-color 0.22s;position:relative;overflow:hidden}
    .ben-card:hover{transform:translateY(-6px);box-shadow:0 20px 48px rgba(28,20,16,0.14);border-color:${C.neutral}}
    .ben-card .tip{visibility:hidden;opacity:0;position:absolute;bottom:calc(100%+8px);left:50%;transform:translateX(-50%);background:${C.dark};color:#fff;font-size:0.72rem;padding:7px 12px;border-radius:10px;transition:opacity 0.18s;z-index:30;pointer-events:none;max-width:200px;white-space:normal;text-align:center;line-height:1.4}
    .ben-card:hover .tip{visibility:visible;opacity:1}
    .step-card{background:${C.card};border-radius:20px;padding:28px 22px;border:1px solid ${C.border};position:relative;transition:box-shadow 0.2s,transform 0.2s}
    .step-card:hover{box-shadow:0 12px 32px rgba(28,20,16,0.1);transform:translateY(-3px)}
    .tc{background:${C.card};border-radius:16px;padding:24px;border:1px solid ${C.border};transition:transform 0.22s,box-shadow 0.22s}
    .tc:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(28,20,16,0.1)}
    .pb{background:${C.card};border:1.5px solid ${C.border};border-radius:10px;padding:10px 20px;font-size:0.8rem;font-weight:700;color:${C.dark};transition:all 0.2s;cursor:default}
    .pb:hover{border-color:${C.secondary};color:${C.primary};background:${C.cream}}
    .tab-b{flex:1;padding:11px 14px;border:none;font-size:0.85rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.2s;border-radius:0}
    .stat-chip{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:16px 20px;backdrop-filter:blur(8px)}
    .vm-card{background:${C.white};border-radius:8px;padding:25px;text-align:center;box-shadow:0 5px 20px rgba(0,0,0,0.1);transition:transform 0.3s ease,box-shadow 0.3s ease}
    .vm-card:hover{transform:translateY(-3px);box-shadow:0 8px 30px rgba(0,0,0,0.15)}
    .vm-icon-wrap{width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 15px;border:2px solid}
    @media(max-width:768px){.hero-r{flex-direction:column!important}.g2,.g3,.g4,.g6{grid-template-columns:1fr!important}}
    @media(prefers-reduced-motion:reduce){*{transition-duration:0.01ms!important}}
  `

  return (
    <div style={{background:C.light,fontFamily:"'Inter','Neue Haas Grotesk Text Pro',sans-serif",overflowX:"hidden"}}>
      <style>{css}</style>
      {showModal&&<RegModal onClose={()=>setShowModal(false)} isMobile={mobile}/>}
      {mobile&&<div style={{background:C.primary,color:"#fff",padding:"8px 16px",textAlign:"center",fontSize:"0.74rem",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><MdSmartphone/> Best viewed on a desktop or laptop.</div>}
      <Header onLoginClick={go}/>

      {/* HERO SECTION */}
      <section style={{background:`linear-gradient(105deg, rgba(28,20,16,0.94) 0%, rgba(61,42,26,0.88) 50%, rgba(28,20,16,0.75) 100%), url("https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1600&q=80")`,backgroundSize:"cover",backgroundPosition:"center top",padding:mobile?"44px 20px 52px":"68px 40px 76px",color:"#fff",position:"relative",overflow:"hidden",minHeight:mobile?"auto":520,display:"flex",alignItems:"center"}}>
        <div style={{position:"absolute",top:"-15%",right:"0%",width:"400px",height:"400px",borderRadius:"50%",background:"rgba(212,137,74,0.07)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:"-8%",left:"25%",width:"260px",height:"260px",borderRadius:"50%",background:"rgba(124,77,42,0.1)",pointerEvents:"none"}}/>
        <div style={{maxWidth:1200,margin:"0 auto",width:"100%",position:"relative",zIndex:1}}>
          <div className="hero-r" style={{display:"flex",gap:mobile?40:64,alignItems:"center",justifyContent:"space-between"}}>
            <div style={{flex:"1 1 520px",maxWidth:mobile?"100%":580}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(212,137,74,0.18)",border:"1px solid rgba(212,137,74,0.35)",borderRadius:30,padding:"6px 16px 6px 10px",marginBottom:24,fontSize:"0.75rem",fontWeight:700,color:C.amber}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:C.amber,animation:"pulse 2s infinite"}}/>
                {regOpen?"Registration Open — Join Now":"Platform Launching October 1, 2025"}
              </div>
              <h1 style={{fontSize:mobile?"clamp(2.2rem,9vw,3rem)":"3.8rem",fontWeight:900,lineHeight:1.08,margin:"0 0 20px",letterSpacing:"-0.02em"}}>
                Africa's Trust<br/>
                <span style={{background:`linear-gradient(90deg, ${C.amber}, #E8A060)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>Infrastructure</span>
                <br/>for Growth.
              </h1>
              <p style={{fontSize:mobile?"1rem":"1.15rem",margin:"0 0 32px",color:"rgba(255,255,255,0.72)",lineHeight:1.7,maxWidth:500}}>
                BIG Marketplace connects African SMEs to funders, partners, and opportunities through one AI-powered credibility score.
              </p>
              <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:40}}>
                <button className="lp-a" onClick={go}>{regOpen?"Join Now — It's Free":"Get Your BIG Score"}</button>
                <Link to="/HowItWorks" className="lp-w">See How It Works</Link>
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                {[[<MdVerified size={15}/>,"AI-Powered Scoring"],[<FaShieldAlt size={13}/>,"Verified Businesses"],[<FaLock size={12}/>,"POPIA Compliant"]].map(([ic,tx])=>(
                  <div key={tx} style={{display:"flex",alignItems:"center",gap:7,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.14)",borderRadius:10,padding:"7px 14px"}}>
                    <span style={{color:C.amber,display:"flex"}}>{ic}</span>
                    <span style={{fontSize:"0.76rem",color:"rgba(255,255,255,0.8)",fontWeight:600}}>{tx}</span>
                  </div>
                ))}
              </div>
              {!regOpen&&<div style={{marginTop:28}}><p style={{fontSize:"0.75rem",color:"rgba(255,255,255,0.5)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>Launching in</p><CountdownTimer isMobile={mobile} onCountdownEnd={()=>setRegOpen(true)}/></div>}
            </div>
            <div style={{flex:"0 0 auto",width:mobile?"100%":"380px"}}>
              {mobile?null:<HeroScoreWidget/>}
            </div>
          </div>

        </div>
      </section>

      {/* VISION MISSION SECTION - Redesigned to match the design from the second code */}
      <section style={{padding:mobile?"48px 20px":"72px 40px",background:C.pageBg,position:"relative"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:"20px",background:`linear-gradient(to right, ${C.primary}, ${C.secondary})`,clipPath:"polygon(0 0, 100% 0, 100% 70%, 0 100%)"}}/>
        <div style={{maxWidth:1100,margin:"0 auto",position:"relative",zIndex:1}}>
          <h2 style={{fontSize:mobile?"1.8rem":"2.2rem",fontWeight:700,marginBottom:"40px",textAlign:"center",color:C.dark,textTransform:"uppercase"}}>
            OUR PURPOSE: BUILDING AFRICA'S TRUST ECONOMY
          </h2>
          <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(auto-fit, minmax(300px, 1fr))",gap:"25px",marginBottom:"30px"}}>
            {/* Vision */}
            <div className="vm-card" style={{borderTop:`4px solid ${C.primary}`}}>
              <div className="vm-icon-wrap" style={{backgroundColor:`${C.primary}20`,borderColor:C.primary}}>
                <FaBullseye size={24} color={C.primary} />
              </div>
              <h3 style={{fontSize:"1.3rem",fontWeight:700,marginBottom:"12px",color:C.dark,textTransform:"uppercase"}}>
                Our Vision
              </h3>
              <p style={{fontSize:"0.9rem",lineHeight:"1.6",color:C.dark}}>
                <strong>To corporatise Africa's boldest SMEs.</strong>
              </p>
            </div>

            {/* Mission */}
            <div className="vm-card" style={{borderTop:`4px solid ${C.secondary}`}}>
              <div className="vm-icon-wrap" style={{backgroundColor:`${C.secondary}20`,borderColor:C.secondary}}>
                <FaHandshake size={24} color={C.secondary} />
              </div>
              <h3 style={{fontSize:"1.3rem",fontWeight:700,marginBottom:"12px",color:C.dark,textTransform:"uppercase"}}>
                Our Mission
              </h3>
              <p style={{fontSize:"0.9rem",lineHeight:"1.6",color:C.dark}}>
                <strong>To give Africa's boldest businesses the credibility, connections, and capital they need — and a seat at every table that matters.</strong>
              </p>
            </div>

            {/* Promise */}
            <div className="vm-card" style={{borderTop:`4px solid ${C.accent}`}}>
              <div className="vm-icon-wrap" style={{backgroundColor:`${C.accent}20`,borderColor:C.accent}}>
                <FaLightbulb size={24} color={C.accent} />
              </div>
              <h3 style={{fontSize:"1.3rem",fontWeight:700,marginBottom:"12px",color:C.dark,textTransform:"uppercase"}}>
                Our Promise
              </h3>
              <p style={{fontSize:"0.9rem",lineHeight:"1.6",color:C.dark}}>
                <strong>To make growth accessible — not accidental — for Africa's most promising enterprises.</strong>
              </p>
            </div>
          </div>

          <div style={{textAlign:"center"}}>
            <p style={{fontSize:mobile?"1rem":"1.1rem",fontWeight:600,marginBottom:"25px",color:C.primary,textTransform:"uppercase"}}>
              We're building a continent-wide trust economy. Join us.
            </p>
            <button className="lp-b" onClick={go}>{regOpen?"Register Now":"Be BIG. Join the Movement"}</button>
          </div>
        </div>
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:"20px",background:`linear-gradient(to right, ${C.primary}, ${C.secondary})`,clipPath:"polygon(0 30%, 100% 0, 100% 100%, 0 100%)"}}/>
      </section>

      {/* WHO BENEFITS FROM BIG SECTION */}
      <section style={{padding:mobile?"48px 20px":"72px 40px",background:C.dark}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <p style={{color:C.accent,fontWeight:700,fontSize:"0.74rem",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>Multi-sided ecosystem</p>
            <h2 style={{fontSize:mobile?"1.7rem":"2.2rem",fontWeight:800,color:"#fff",margin:0,letterSpacing:"-0.01em"}}>Who benefits from <span style={{color:C.amber}}>BIG</span>?</h2>
          </div>
          <div className="g6" style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(3,1fr)",gap:14}}>
            {benefits.map((c,i)=>(
              <div key={i} className="ben-card" style={{borderLeft:`3px solid ${c.color}`}}>
                <div className="tip">{c.tip}</div>
                <div style={{width:40,height:40,borderRadius:12,background:`${c.color}1A`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12,color:c.color}}>{c.icon}</div>
                <h3 style={{fontSize:"0.92rem",fontWeight:800,color:C.dark,margin:"0 0 4px"}}>{c.title}</h3>
                <p style={{fontSize:"0.7rem",fontWeight:700,color:c.color,textTransform:"uppercase",margin:"0 0 10px",letterSpacing:"0.04em"}}>{c.tagline}</p>
                <p style={{fontSize:"0.78rem",color:C.muted,margin:"0 0 16px",lineHeight:1.55,flexGrow:1}}>{c.desc}</p>
                <div style={{marginTop:"auto",display:"flex",gap:8}}>
                  <Link to={c.link} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",background:`${c.color}12`,color:c.color,fontWeight:700,textDecoration:"none",fontSize:"0.72rem",padding:"8px 10px",borderRadius:8,gap:4,border:`1px solid ${c.color}28`}}>How It Works <FaChevronRight size={9}/></Link>
                  <button onClick={go} style={{flex:1,background:c.color,color:"#fff",border:"none",borderRadius:8,padding:"8px 10px",fontSize:"0.72rem",fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"opacity 0.2s"}} onMouseOver={e=>{e.currentTarget.style.opacity="0.85"}} onMouseOut={e=>{e.currentTarget.style.opacity="1"}}>{regOpen?"Join Now":"Get Started"}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOUR STEPS TO UNLOCKING GROWTH SECTION */}
      <section style={{padding:mobile?"48px 20px":"72px 40px",background:C.white}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:52}}>
            <p style={{color:C.secondary,fontWeight:700,fontSize:"0.74rem",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>Simple by design</p>
            <h2 style={{fontSize:mobile?"1.7rem":"2.2rem",fontWeight:800,color:C.dark,margin:0,letterSpacing:"-0.01em"}}>Four steps to unlocking growth</h2>
          </div>
          <div className="g4" style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(4,1fr)",gap:20}}>
            {steps.map((s,i)=>(
              <div key={s.n} className="step-card">
                {i<3&&!mobile&&<div style={{position:"absolute",top:38,right:-14,fontSize:"1.2rem",color:C.neutral,zIndex:1,fontWeight:300}}>→</div>}
                <div style={{fontSize:"2.2rem",fontWeight:900,color:C.primary,lineHeight:1,marginBottom:16,letterSpacing:"-0.03em",opacity:0.35}}>{s.n}</div>
                <div style={{width:44,height:44,borderRadius:14,background:`${C.primary}12`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14,color:C.primary}}>{s.icon}</div>
                <h3 style={{fontSize:"0.95rem",fontWeight:800,color:C.dark,margin:"0 0 8px",letterSpacing:"-0.01em"}}>{s.title}</h3>
                <p style={{fontSize:"0.82rem",color:C.muted,lineHeight:1.6,margin:0}}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section style={{padding:mobile?"48px 20px":"72px 40px",background:C.pageBg}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:44}}>
            <p style={{color:C.secondary,fontWeight:700,fontSize:"0.74rem",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>Proven across Africa</p>
            <h2 style={{fontSize:mobile?"1.7rem":"2.2rem",fontWeight:800,color:C.dark,margin:0,letterSpacing:"-0.01em"}}>Trusted by founders and investors</h2>
          </div>
          <div className="g3" style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(3,1fr)",gap:20,marginBottom:40}}>
            {testimonials.map(t=>(
              <div key={t.name} className="tc">
                <div style={{display:"flex",gap:2,marginBottom:14}}>{Array(t.stars).fill(0).map((_,i)=><FaStar key={i} size={14} color="#F59E0B"/>)}</div>
                <p style={{fontSize:"0.88rem",color:C.dark,lineHeight:1.7,margin:"0 0 20px"}}>"{t.quote}"</p>
                <div style={{display:"flex",alignItems:"center",gap:12,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
                  <img src={t.img} alt={t.name} style={{width:40,height:40,borderRadius:12,objectFit:"cover",border:`2px solid ${C.border}`}}/>
                  <div><div style={{fontSize:"0.86rem",fontWeight:700,color:C.dark}}>{t.name}</div><div style={{fontSize:"0.74rem",color:C.muted}}>{t.role}</div></div>
                </div>
              </div>
            ))}
          </div>
          <div style={{textAlign:"center"}}>
            <p style={{fontSize:"0.72rem",color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:16}}>Our Partners</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:10,justifyContent:"center"}}>{partners.map(p=><div key={p} className="pb">{p}</div>)}</div>
          </div>
        </div>
      </section>

      {/* WHY TRUST BIG SECTION */}
      <section style={{padding:mobile?"48px 20px":"72px 40px",background:C.white}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:44}}>
            <h2 style={{fontSize:mobile?"1.7rem":"2.2rem",fontWeight:800,color:C.dark,margin:0,letterSpacing:"-0.01em"}}>Why trust <span style={{color:C.primary}}>BIG</span> Marketplace</h2>
          </div>
          <div className="g3" style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(3,1fr)",gap:20}}>
            {[
              {icon:<FaUsers size={18}/>,    color:C.primary,   title:"Built With, Not Just For",  body:"Before writing code, we consulted 30+ stakeholders to design a platform grounded in African entrepreneurs realities."},
              {icon:<FaBuilding size={18}/>, color:C.secondary, title:"Decades of Expertise",       body:"Our team brings decades of combined experience in SME growth, finance, and innovation across Africa."},
              {icon:<FaHandshake size={18}/>,color:C.amber,     title:"Solving for More",           body:"We are not just solving for access — we are solving for readiness, trust, and scale across the continent."},
            ].map(c=>(
              <div key={c.title} style={{background:C.cream,borderRadius:18,padding:"24px 20px",border:`1px solid ${C.border}`}}>
                <div style={{width:44,height:44,borderRadius:14,background:`${c.color}14`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14,color:c.color}}>{c.icon}</div>
                <h3 style={{fontSize:"0.94rem",fontWeight:800,color:C.dark,margin:"0 0 8px"}}>{c.title}</h3>
                <p style={{fontSize:"0.84rem",color:C.muted,lineHeight:1.6,margin:0}}>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section style={{padding:mobile?"56px 20px":"80px 40px",background:`linear-gradient(135deg, ${C.dark} 0%, #3D2A1A 100%)`,textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"-30%",left:"50%",transform:"translateX(-50%)",width:"600px",height:"600px",borderRadius:"50%",background:"rgba(212,137,74,0.06)",pointerEvents:"none"}}/>
        <div style={{maxWidth:600,margin:"0 auto",position:"relative",zIndex:1}}>
          <h2 style={{fontSize:mobile?"1.7rem":"2.4rem",fontWeight:900,color:"#fff",margin:"0 0 14px",letterSpacing:"-0.02em",lineHeight:1.15}}>Ready to build your<br/>business credibility?</h2>
          <p style={{fontSize:"0.95rem",color:"rgba(255,255,255,0.6)",lineHeight:1.7,marginBottom:32}}>Join a trusted ecosystem designed to help African businesses grow, connect, and succeed.</p>
          <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
            <button className="lp-a" onClick={go}>{regOpen?"Get Started — It's Free":"Join the Movement"}</button>
            <Link to="/HowItWorks" className="lp-w">See the Platform</Link>
          </div>
        </div>
      </section>

      {showScroll&&(
        <button onClick={()=>window.scrollTo({top:0,behavior:"smooth"})} style={{position:"fixed",bottom:mobile?20:28,right:mobile?20:28,width:44,height:44,borderRadius:12,background:C.primary,color:"#fff",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 20px rgba(28,20,16,0.28)",zIndex:100,fontSize:"1.1rem",transition:"background 0.2s"}} onMouseOver={e=>{e.currentTarget.style.background="#5A3420"}} onMouseOut={e=>{e.currentTarget.style.background=C.primary}}>
          <FaArrowUp size={15}/>
        </button>
      )}
      <Chatbox/>
      <Footer/>
    </div>
  )
}
export default LandingPage