"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import {
    Building, Users, Mail, MapPin, Shield,
    Award, Calendar, DollarSign, Globe, X, ExternalLink
} from "lucide-react"

const AdvisorDetailsModal = ({ advisor, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState("overview")
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    if (!isOpen || !advisor || !mounted) return null

    const formatLabel = (value) => {
        if (!value) return "Not specified"
        if (Array.isArray(value)) return value.join(" • ")
        return value.toString().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    }

    const tabs = [
        { id: "overview",  label: "Overview",   icon: Building },
        { id: "expertise", label: "Expertise",   icon: Award },
        { id: "engagement",label: "Engagement",  icon: DollarSign },
        { id: "contact",   label: "Contact",     icon: Mail },
    ]

    return createPortal(
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                {/* Header */}
                <div style={modalHeaderStyle}>
                    <div style={headerContentStyle}>
                        <div style={advisorHeaderStyle}>
                            <h2 style={advisorNameStyle}>{advisor.name}</h2>
                            <div style={advisorMetaStyle}>
                                {advisor.headline && (
                                    <span style={entityTypeStyle}>{advisor.headline}</span>
                                )}
                                {advisor.location && (
                                    <span style={locationStyle}>
                                        <MapPin size={14} />
                                        {advisor.location}
                                    </span>
                                )}
                                {advisor.matchPercentage !== undefined && (
                                    <span style={entityTypeStyle}>
                                        {advisor.matchPercentage}% Match
                                    </span>
                                )}
                            </div>
                        </div>
                        <button onClick={onClose} style={closeButtonStyle}><X size={20} /></button>
                    </div>

                    <div style={tabsContainerStyle}>
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{ ...tabStyle, ...(activeTab === tab.id ? activeTabStyle : {}) }}
                                >
                                    <Icon size={16} />{tab.label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Body */}
                <div style={modalBodyStyle}>

                    {/* ── OVERVIEW ── */}
                    {activeTab === "overview" && (
                        <div style={tabContentStyle}>
                            <div style={gridStyle}>
                                <div style={infoCardStyle}>
                                    <h3 style={cardTitleStyle}><Building size={18} />Professional Information</h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem label="Full Name"         value={advisor.name} />
                                        <InfoItem label="Professional Role" value={advisor.headline} />
                                        <InfoItem label="Location"          value={advisor.location} />
                                        <InfoItem label="Sector Focus"      value={formatLabel(advisor.sectorFocus)} />
                                    </div>
                                </div>

                                <div style={infoCardStyle}>
                                    <h3 style={cardTitleStyle}><Calendar size={18} />Availability</h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem label="Start Date"        value={advisor.startDate} />
                                        <InfoItem label="Availability"      value={advisor.availability} />
                                        <InfoItem label="Engagement Type"   value={formatLabel(advisor.engagementType)} />
                                        <InfoItem label="Compensation Model" value={formatLabel(advisor.compensationModel)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── EXPERTISE ── */}
                    {activeTab === "expertise" && (
                        <div style={tabContentStyle}>
                            <div style={gridStyle}>
                                <div style={infoCardStyle}>
                                    <h3 style={cardTitleStyle}><Award size={18} />Areas of Expertise</h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem label="Sector Focus"          value={formatLabel(advisor.sectorFocus)} />
                                        <InfoItem label="Functional Expertise"  value={formatLabel(advisor.functionalExpertise)} />
                                        <InfoItem label="Funding Stage Focus"   value={formatLabel(advisor.fundingStage)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── ENGAGEMENT ── */}
                    {activeTab === "engagement" && (
                        <div style={tabContentStyle}>
                            <div style={gridStyle}>
                                <div style={infoCardStyle}>
                                    <h3 style={cardTitleStyle}><DollarSign size={18} />Engagement Details</h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem label="Engagement Type"    value={formatLabel(advisor.engagementType)} />
                                        <InfoItem label="Compensation Model" value={formatLabel(advisor.compensationModel)} />
                                        <InfoItem label="Availability"       value={advisor.availability} />
                                        <InfoItem label="Start Date"         value={advisor.startDate} />
                                        <InfoItem label="Match Score"        value={`${advisor.matchPercentage || 0}%`} />
                                        <InfoItem label="Current Status"     value={advisor.status} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── CONTACT ── */}
                    {activeTab === "contact" && (
                        <div style={tabContentStyle}>
                            <div style={gridStyle}>
                                <div style={infoCardStyle}>
                                    <h3 style={cardTitleStyle}><Users size={18} />Contact Information</h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem label="Name"     value={advisor.name} />
                                        <InfoItem label="Location" value={advisor.location} />
                                    </div>
                                    <div style={noteStyle}>
                                        Contact details are shared after a connection is confirmed.
                                    </div>
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
    <div style={infoItemStyle}>
        <strong>{label}:</strong>
        <span>{value || "Not specified"}</span>
    </div>
)

const modalOverlayStyle = { position:"fixed",top:0,left:0,right:0,bottom:0,backgroundColor:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"20px" }
const modalContentStyle = { background:"white",borderRadius:"12px",width:"100%",maxWidth:"900px",maxHeight:"90vh",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }
const modalHeaderStyle = { background:"linear-gradient(135deg, #4e2106 0%, #372c27 100%)",color:"white",padding:"0" }
const headerContentStyle = { display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"24px" }
const advisorHeaderStyle = { flex:1 }
const advisorNameStyle = { margin:"0 0 8px 0",fontSize:"24px",fontWeight:"700" }
const advisorMetaStyle = { display:"flex",gap:"16px",alignItems:"center",flexWrap:"wrap" }
const entityTypeStyle = { background:"rgba(255,255,255,0.2)",padding:"4px 12px",borderRadius:"20px",fontSize:"14px",fontWeight:"500" }
const locationStyle = { display:"flex",alignItems:"center",gap:"4px",fontSize:"14px" }
const closeButtonStyle = { background:"rgba(255,255,255,0.2)",border:"none",borderRadius:"8px",padding:"8px",color:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }
const tabsContainerStyle = { display:"flex",background:"rgba(255,255,255,0.1)",padding:"0 24px" }
const tabStyle = { display:"flex",alignItems:"center",gap:"8px",padding:"12px 16px",background:"none",border:"none",color:"rgba(255,255,255,0.8)",cursor:"pointer",fontSize:"14px",fontWeight:"500",borderBottom:"3px solid transparent",transition:"all 0.2s ease" }
const activeTabStyle = { color:"white",borderBottomColor:"white",background:"rgba(255,255,255,0.1)" }
const modalBodyStyle = { padding:"0",maxHeight:"calc(90vh - 140px)",overflowY:"auto" }
const tabContentStyle = { padding:"24px" }
const gridStyle = { display:"grid",gap:"20px" }
const infoCardStyle = { background:"#FEFCFA",border:"1px solid #E8D5C4",borderRadius:"8px",padding:"20px" }
const cardTitleStyle = { display:"flex",alignItems:"center",gap:"8px",margin:"0 0 16px 0",fontSize:"18px",fontWeight:"600",color:"#5D2A0A" }
const infoGridStyle = { display:"flex",flexDirection:"column",gap:"12px" }
const infoItemStyle = { display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"16px" }
const noteStyle = { marginTop:"16px",padding:"12px",background:"rgba(166,124,82,0.05)",borderRadius:"6px",border:"1px solid #E8D5C4",fontSize:"0.8rem",color:"#8D6E63",fontStyle:"italic" }

export default AdvisorDetailsModal