import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Building, MapPin, BarChart3, DollarSign, FileText, Award, X } from "lucide-react"

const CMFSMEDetailsModal = ({ sme, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState("overview")
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    if (!isOpen || !sme || !mounted) return null

    const getScoreColor = (score) => {
        if (score >= 80) return "#22c55e"
        if (score >= 60) return "#f59e0b"
        return "#ef4444"
    }

    const tabs = [
        { id: "overview",  label: "Overview",   icon: Building },
        { id: "financial", label: "Financial",   icon: DollarSign },
        { id: "support",   label: "Support",     icon: FileText },
        { id: "scores",    label: "Scores",      icon: Award },
    ]

    return createPortal(
        <div style={overlayStyle}>
            <div style={contentStyle}>
                {/* Header */}
                <div style={headerStyle}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"24px" }}>
                        <div>
                            <h2 style={{ margin:"0 0 8px 0", fontSize:"24px", fontWeight:"700" }}>{sme.name}</h2>
                            <div style={{ display:"flex", gap:"12px", flexWrap:"wrap" }}>
                                {sme.location && sme.location !== "N/A" && (
                                    <span style={metaBadgeStyle}><MapPin size={14} />{sme.location}</span>
                                )}
                                {sme.currentStatus && (
                                    <span style={metaBadgeStyle}>{sme.currentStatus}</span>
                                )}
                                {sme.matchPercentage !== undefined && (
                                    <span style={metaBadgeStyle}>{sme.matchPercentage}% Match</span>
                                )}
                            </div>
                        </div>
                        <button onClick={onClose} style={closeButtonStyle}><X size={20} /></button>
                    </div>
                    <div style={tabsContainerStyle}>
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            return (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    style={{ ...tabStyle, ...(activeTab === tab.id ? activeTabStyle : {}) }}>
                                    <Icon size={16} />{tab.label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Body */}
                <div style={bodyStyle}>

                    {/* ── OVERVIEW ── */}
                    {activeTab === "overview" && (
                        <div style={tabContentStyle}>
                            <div style={gridStyle}>
                                <div style={cardStyle}>
                                    <h3 style={cardTitleStyle}><Building size={18} />Business Information</h3>
                                    <InfoItem label="Registered Name" value={sme.name} />
                                    <InfoItem label="Location"        value={sme.location} />
                                    <InfoItem label="Sector"          value={sme.sector} />
                                    <InfoItem label="Funding Stage"   value={sme.fundingStage} />
                                    <InfoItem label="Application Date" value={sme.applicationDate} />
                                </div>
                                <div style={cardStyle}>
                                    <h3 style={cardTitleStyle}><BarChart3 size={18} />Pipeline Status</h3>
                                    <InfoItem label="Current Status"  value={sme.currentStatus} />
                                    <InfoItem label="Pipeline Stage"  value={sme.pipelineStage} />
                                    <InfoItem label="Next Stage"      value={sme.nextStage} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── FINANCIAL ── */}
                    {activeTab === "financial" && (
                        <div style={tabContentStyle}>
                            <div style={gridStyle}>
                                <div style={cardStyle}>
                                    <h3 style={cardTitleStyle}><DollarSign size={18} />Funding Details</h3>
                                    <InfoItem label="Funding Required" value={sme.fundingRequired} />
                                    <InfoItem label="Equity Offered"   value={sme.equityOffered} />
                                    <InfoItem label="Guarantees"       value={sme.guarantees} />
                                </div>
                                <div style={cardStyle}>
                                    <h3 style={cardTitleStyle}><Award size={18} />Match Score</h3>
                                    <ScoreItem label="Match %" value={sme.matchPercentage} color={getScoreColor(sme.matchPercentage)} />
                                    <ScoreItem label="BIG Score" value={sme.bigScore} color={getScoreColor(sme.bigScore)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── SUPPORT ── */}
                    {activeTab === "support" && (
                        <div style={tabContentStyle}>
                            <div style={cardStyle}>
                                <h3 style={cardTitleStyle}><FileText size={18} />Support Requirements</h3>
                                <InfoItem label="Support Required"  value={sme.supportRequired} />
                                <InfoItem label="Services Required" value={sme.servicesRequired} />
                            </div>
                        </div>
                    )}

                    {/* ── SCORES ── */}
                    {activeTab === "scores" && (
                        <div style={tabContentStyle}>
                            <div style={gridStyle}>
                                <div style={cardStyle}>
                                    <h3 style={cardTitleStyle}><Award size={18} />BIG Score Breakdown</h3>
                                    <ScoreItem label="Overall BIG Score" value={sme.bigScore}    color={getScoreColor(sme.bigScore)} />
                                    <ScoreItem label="Compliance"        value={sme.compliance}  color={getScoreColor(sme.compliance)} />
                                    <ScoreItem label="Legitimacy"        value={sme.legitimacy}  color={getScoreColor(sme.legitimacy)} />
                                    <ScoreItem label="Fundability"       value={sme.fundability} color={getScoreColor(sme.fundability)} />
                                    <ScoreItem label="PIS"               value={sme.pis}         color={getScoreColor(sme.pis)} />
                                </div>
                                <div style={cardStyle}>
                                    <h3 style={cardTitleStyle}><BarChart3 size={18} />Match Score</h3>
                                    <ScoreItem label="Match %" value={sme.matchPercentage} color={getScoreColor(sme.matchPercentage)} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    )
}

const InfoItem = ({ label, value }) => (
    <div style={{ display:"flex", justifyContent:"space-between", gap:"16px", padding:"6px 0", borderBottom:"1px solid #f0e6dd" }}>
        <strong style={{ fontSize:"0.8rem", color:"#8D6E63", minWidth:"130px" }}>{label}</strong>
        <span style={{ fontSize:"0.8rem", color:"#5D2A0A", textAlign:"right" }}>{value || "Not specified"}</span>
    </div>
)

const ScoreItem = ({ label, value, color }) => (
    <div style={{ padding:"8px 0", borderBottom:"1px solid #f0e6dd" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
            <strong style={{ fontSize:"0.8rem", color:"#8D6E63" }}>{label}</strong>
            <span style={{ fontSize:"0.8rem", fontWeight:"700", color }}>{value || 0}%</span>
        </div>
        <div style={{ height:"6px", background:"#E8D5C4", borderRadius:"3px", overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${value || 0}%`, background:color, borderRadius:"3px", transition:"width 0.3s ease" }} />
        </div>
    </div>
)

const overlayStyle = { position:"fixed",top:0,left:0,right:0,bottom:0,backgroundColor:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"20px" }
const contentStyle = { background:"white",borderRadius:"12px",width:"100%",maxWidth:"900px",maxHeight:"90vh",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }
const headerStyle = { background:"linear-gradient(135deg, #4e2106 0%, #372c27 100%)",color:"white" }
const metaBadgeStyle = { display:"flex",alignItems:"center",gap:"4px",background:"rgba(255,255,255,0.2)",padding:"4px 12px",borderRadius:"20px",fontSize:"14px" }
const closeButtonStyle = { background:"rgba(255,255,255,0.2)",border:"none",borderRadius:"8px",padding:"8px",color:"white",cursor:"pointer",display:"flex",alignItems:"center" }
const tabsContainerStyle = { display:"flex",background:"rgba(255,255,255,0.1)",padding:"0 24px" }
const tabStyle = { display:"flex",alignItems:"center",gap:"8px",padding:"12px 16px",background:"none",border:"none",color:"rgba(255,255,255,0.8)",cursor:"pointer",fontSize:"14px",fontWeight:"500",borderBottom:"3px solid transparent",transition:"all 0.2s ease" }
const activeTabStyle = { color:"white",borderBottomColor:"white",background:"rgba(255,255,255,0.1)" }
const bodyStyle = { padding:"0",maxHeight:"calc(90vh - 140px)",overflowY:"auto" }
const tabContentStyle = { padding:"24px" }
const gridStyle = { display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px" }
const cardStyle = { background:"#FEFCFA",border:"1px solid #E8D5C4",borderRadius:"8px",padding:"20px" }
const cardTitleStyle = { display:"flex",alignItems:"center",gap:"8px",margin:"0 0 16px 0",fontSize:"16px",fontWeight:"600",color:"#5D2A0A" }

export default CMFSMEDetailsModal
