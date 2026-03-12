"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Building, Users, Mail, MapPin, BookOpen, FileText, Award, X, ExternalLink } from "lucide-react"

const InternDetailsModal = ({ intern, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState("overview")
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    if (!isOpen || !intern || !mounted) return null

    const renderDocLink = (url, label) => {
        if (!url) return <span style={{ color: "#999", fontSize: "0.8rem" }}>Not uploaded</span>
        return (
            <a href={url} target="_blank" rel="noopener noreferrer"
                style={{ color: "#a67c52", textDecoration: "underline", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "4px" }}>
                {label} <ExternalLink size={12} />
            </a>
        )
    }

    const tabs = [
        { id: "overview",   label: "Overview",   icon: Building },
        { id: "education",  label: "Education",  icon: BookOpen },
        { id: "documents",  label: "Documents",  icon: FileText },
        { id: "match",      label: "Match Info", icon: Award },
    ]

    const getScoreColor = (score) => {
        if (score >= 80) return "#22c55e"
        if (score >= 60) return "#f59e0b"
        return "#ef4444"
    }

    return createPortal(
        <div style={overlayStyle}>
            <div style={contentStyle}>
                {/* Header */}
                <div style={headerStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "24px" }}>
                        <div>
                            <h2 style={{ margin: "0 0 8px 0", fontSize: "24px", fontWeight: "700" }}>{intern.internName}</h2>
                            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                                {intern.location && (
                                    <span style={metaBadgeStyle}><MapPin size={14} />{intern.location}</span>
                                )}
                                {intern.status && (
                                    <span style={metaBadgeStyle}>{intern.status}</span>
                                )}
                                {intern.matchPercentage !== undefined && (
                                    <span style={metaBadgeStyle}>{intern.matchPercentage}% Match</span>
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
                                    <h3 style={cardTitleStyle}><Users size={18} />Personal Information</h3>
                                    <InfoItem label="Full Name"    value={intern.internName} />
                                    <InfoItem label="Location"     value={intern.location} />
                                    <InfoItem label="Phone"        value={intern.phone} />
                                    <InfoItem label="National ID"  value={intern.nationalId} />
                                    <InfoItem label="Email"        value={intern.profileEmail} />
                                </div>
                                <div style={cardStyle}>
                                    <h3 style={cardTitleStyle}><Building size={18} />Internship Details</h3>
                                    <InfoItem label="Role"              value={intern.role} />
                                    <InfoItem label="Start Date"        value={intern.startDate} />
                                    <InfoItem label="Availability Start" value={intern.availabilityStart} />
                                    <InfoItem label="Available Hours"   value={intern.availableHours} />
                                    <InfoItem label="Location Flexibility" value={intern.locationFlexibility} />
                                </div>
                            </div>
                            <div style={{ ...cardStyle, marginTop: "16px" }}>
                                <h3 style={cardTitleStyle}><Award size={18} />Skills & Interests</h3>
                                <InfoItem label="Technical Skills"   value={intern.technicalSkills?.join(", ")} />
                                <InfoItem label="Industry Interests" value={intern.industryInterests?.join(", ")} />
                                <InfoItem label="Career Goals"       value={intern.careerGoals} />
                                <InfoItem label="Languages Spoken"   value={intern.languagesSpoken?.join(", ")} />
                            </div>
                        </div>
                    )}

                    {/* ── EDUCATION ── */}
                    {activeTab === "education" && (
                        <div style={tabContentStyle}>
                            <div style={gridStyle}>
                                <div style={cardStyle}>
                                    <h3 style={cardTitleStyle}><BookOpen size={18} />Academic Background</h3>
                                    <InfoItem label="Institution"    value={intern.institution} />
                                    <InfoItem label="Degree"         value={intern.degree} />
                                    <InfoItem label="Field of Study" value={intern.field} />
                                    <InfoItem label="Intern Type"    value={intern.internType} />
                                </div>
                                <div style={cardStyle}>
                                    <h3 style={cardTitleStyle}><Building size={18} />Program Affiliation</h3>
                                    <InfoItem label="Sponsor Name"        value={intern.sponsorName} />
                                    <InfoItem label="Funding Program Type" value={intern.fundingProgramType} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── DOCUMENTS ── */}
                    {activeTab === "documents" && (
                        <div style={tabContentStyle}>
                            <div style={cardStyle}>
                                <h3 style={cardTitleStyle}><FileText size={18} />Uploaded Documents</h3>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "8px" }}>
                                    <DocItem label="CV / Resume"         node={renderDocLink(intern.cvUrl, "View CV")} />
                                    <DocItem label="ID Document"         node={renderDocLink(intern.idDocumentUrl, "View ID")} />
                                    <DocItem label="Academic Transcript" node={renderDocLink(intern.transcriptUrl, "View Transcript")} />
                                    <DocItem label="Motivation Letter"   node={renderDocLink(intern.motivationLetterUrl, "View Letter")} />
                                    <DocItem label="Portfolio"           node={renderDocLink(intern.portfolioFileUrl, "View Portfolio")} />
                                    <DocItem label="Proof of Study"      node={renderDocLink(intern.proofOfStudyUrl, "View Proof")} />
                                    <DocItem label="References"          node={renderDocLink(intern.referencesUrl, "View References")} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── MATCH INFO ── */}
                    {activeTab === "match" && (
                        <div style={tabContentStyle}>
                            <div style={gridStyle}>
                                <div style={cardStyle}>
                                    <h3 style={cardTitleStyle}><Award size={18} />Scores</h3>
                                    <ScoreItem label="Match Score" value={intern.matchPercentage} color={getScoreColor(intern.matchPercentage)} />
                                    <ScoreItem label="BIG Score"   value={intern.bigScore}        color={getScoreColor(intern.bigScore)} />
                                </div>
                                <div style={cardStyle}>
                                    <h3 style={cardTitleStyle}><Building size={18} />Pipeline</h3>
                                    <InfoItem label="Current Status"  value={intern.status} />
                                    <InfoItem label="Pipeline Stage"  value={intern.pipelineStage} />
                                    <InfoItem label="Application ID"  value={intern.applicationId || "Profile Match"} />
                                </div>
                            </div>
                            {intern.matchAnalysis?.matchSummary && (
                                <div style={{ ...cardStyle, marginTop: "16px" }}>
                                    <h3 style={cardTitleStyle}>Match Assessment</h3>
                                    <p style={{ margin: "0 0 12px 0", fontWeight: "600", color: "#5D2A0A" }}>
                                        {intern.matchAnalysis.matchSummary.overallAssessment}
                                    </p>
                                    {intern.matchAnalysis.matchSummary.strongPoints?.length > 0 && (
                                        <div style={{ marginBottom: "12px" }}>
                                            <strong style={{ color: "#388E3C", fontSize: "0.85rem" }}>✓ Strengths</strong>
                                            {intern.matchAnalysis.matchSummary.strongPoints.map((pt, i) => (
                                                <p key={i} style={{ margin: "4px 0 0 12px", fontSize: "0.8rem", color: "#555" }}>• {pt}</p>
                                            ))}
                                        </div>
                                    )}
                                    {intern.matchAnalysis.matchSummary.weakPoints?.length > 0 && (
                                        <div>
                                            <strong style={{ color: "#D32F2F", fontSize: "0.85rem" }}>✗ Areas to Note</strong>
                                            {intern.matchAnalysis.matchSummary.weakPoints.map((pt, i) => (
                                                <p key={i} style={{ margin: "4px 0 0 12px", fontSize: "0.8rem", color: "#555" }}>• {pt}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    )
}

const InfoItem = ({ label, value }) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", padding: "6px 0", borderBottom: "1px solid #f0e6dd" }}>
        <strong style={{ fontSize: "0.8rem", color: "#8D6E63", minWidth: "130px" }}>{label}</strong>
        <span style={{ fontSize: "0.8rem", color: "#5D2A0A", textAlign: "right" }}>{value || "Not specified"}</span>
    </div>
)

const DocItem = ({ label, node }) => (
    <div style={{ padding: "12px", background: "#FEFCFA", border: "1px solid #E8D5C4", borderRadius: "6px" }}>
        <p style={{ margin: "0 0 6px 0", fontSize: "0.75rem", fontWeight: "600", color: "#8D6E63" }}>{label}</p>
        {node}
    </div>
)

const ScoreItem = ({ label, value, color }) => (
    <div style={{ padding: "8px 0", borderBottom: "1px solid #f0e6dd" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <strong style={{ fontSize: "0.8rem", color: "#8D6E63" }}>{label}</strong>
            <span style={{ fontSize: "0.8rem", fontWeight: "700", color }}>{value || 0}%</span>
        </div>
        <div style={{ height: "6px", background: "#E8D5C4", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${value || 0}%`, background: color, borderRadius: "3px" }} />
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

export default InternDetailsModal