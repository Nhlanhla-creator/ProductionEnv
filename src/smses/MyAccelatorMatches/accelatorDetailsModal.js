"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import {
    Building, Users, Mail, Phone, MapPin, Shield,
    Package, FileText, Award, Calendar, DollarSign, Globe, X, ExternalLink
} from "lucide-react"

const CatalystDetailsModal = ({ catalyst, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState("overview")
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    if (!isOpen || !catalyst || !mounted) return null

    // The catalyst data lives under formData (from catalystProfiles)
    // But in AcceleratorTable the row object is a flattened version,
    // so we read both the flat fields AND the raw formData if present.
    const formData = catalyst.rawFormData || {}
    const overview = formData.entityOverview || {}
    const contact = formData.contactDetails || {}
    const matchPrefs = formData.generalMatchingPreference || {}
    const appBrief = formData.applicationBrief || {}
    const programs = formData.programmeDetails?.programs || []

    const formatLabel = (value) => {
        if (!value) return "Not specified"
        if (Array.isArray(value)) return value.join(" • ")
        return value.toString().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    }

    const tabs = [
        { id: "overview",  label: "Overview",         icon: Building },
        { id: "programs",  label: "Programs",          icon: Package },
        { id: "matching",  label: "Matching Criteria", icon: Award },
        { id: "contact",   label: "Contact",           icon: Mail },
    ]

    return createPortal(
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                {/* Header */}
                <div style={modalHeaderStyle}>
                    <div style={headerContentStyle}>
                        <div style={supplierHeaderStyle}>
                            <h2 style={supplierNameStyle}>{catalyst.name}</h2>
                            <div style={supplierMetaStyle}>
                                {catalyst.location && (
                                    <span style={locationStyle}>
                                        <MapPin size={14} />
                                        {catalyst.location}
                                    </span>
                                )}
                                {catalyst.matchPercentage !== undefined && (
                                    <span style={entityTypeStyle}>
                                        {catalyst.matchPercentage}% Match
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
                                    <h3 style={cardTitleStyle}><Building size={18} />Organisation Information</h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem label="Registered Name"   value={overview.registeredName   || catalyst.name} />
                                        <InfoItem label="Province / Location" value={overview.province       || catalyst.location} />
                                        <InfoItem label="Geographic Focus"   value={formatLabel(catalyst.geographicFocus)} />
                                        <InfoItem label="Sector Focus"       value={formatLabel(catalyst.sectorFocus)} />
                                    </div>
                                </div>

                                <div style={infoCardStyle}>
                                    <h3 style={cardTitleStyle}><Calendar size={18} />Application Details</h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem label="Application Window" value={appBrief.applicationWindow || catalyst.deadline} />
                                        <InfoItem label="Estimated Review"   value={appBrief.estimatedReviewTime || catalyst.speed} />
                                        <InfoItem label="Funding Stage"      value={formatLabel(catalyst.fundingStage)} />
                                        <InfoItem label="Funding Type"       value={formatLabel(catalyst.fundingType)} />
                                        <InfoItem label="Ticket Size"        value={catalyst.ticketSize} />
                                    </div>
                                </div>

                                <div style={infoCardStyle}>
                                    <h3 style={cardTitleStyle}><DollarSign size={18} />Support Overview</h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem label="Support Offered"   value={formatLabel(catalyst.supportOffered)} />
                                        <InfoItem label="Services Offered"  value={formatLabel(catalyst.servicesOffered)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── PROGRAMS ── */}
                    {activeTab === "programs" && (
                        <div style={tabContentStyle}>
                            {programs.length > 0 ? (
                                <div style={categoriesGridStyle}>
                                    {programs.map((program, i) => (
                                        <div key={i} style={categoryCardStyle}>
                                            <h4 style={categoryTitleStyle}>Program {i + 1}: {program.name || "Unnamed"}</h4>
                                            <div style={infoGridStyle}>
                                                <InfoItem label="Support Type"     value={formatLabel(program.supportType)} />
                                                <InfoItem label="Min Support"      value={program.minimumSupport} />
                                                <InfoItem label="Max Support"      value={program.maximumSupport} />
                                                <InfoItem label="Budget"           value={program.budget} />
                                                <InfoItem label="Support Offered"  value={formatLabel(program.supportOffered)} />
                                                <InfoItem label="Services Offered" value={formatLabel(program.servicesOffered)} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={emptyStateStyle}>No program details available</div>
                            )}
                        </div>
                    )}

                    {/* ── MATCHING CRITERIA ── */}
                    {activeTab === "matching" && (
                        <div style={tabContentStyle}>
                            <div style={gridStyle}>
                                <div style={infoCardStyle}>
                                    <h3 style={cardTitleStyle}><Award size={18} />General Matching Preferences</h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem label="Geographic Focus"      value={formatLabel(matchPrefs.geographicFocus)} />
                                        <InfoItem label="Sector Focus"          value={formatLabel(matchPrefs.sectorFocus)} />
                                        <InfoItem label="Program Stage"         value={formatLabel(matchPrefs.programStage)} />
                                        <InfoItem label="Support Focus"         value={formatLabel(matchPrefs.supportFocus)} />
                                        <InfoItem label="Support Focus Subtype" value={formatLabel(matchPrefs.supportFocusSubtype)} />
                                        <InfoItem label="Legal Entity Fit"      value={formatLabel(matchPrefs.legalEntityFit)} />
                                        <InfoItem label="Selected Countries"    value={formatLabel(matchPrefs.selectedCountries)} />
                                        <InfoItem label="Selected Provinces"    value={formatLabel(matchPrefs.selectedProvinces)} />
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
                                    <h3 style={cardTitleStyle}><Users size={18} />Primary Contact</h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem label="Contact Name"   value={contact.contactName} />
                                        <InfoItem label="Business Email" value={contact.businessEmail} />
                                        <InfoItem label="Phone"          value={contact.businessPhone || contact.phone} />
                                    </div>
                                </div>
                                <div style={infoCardStyle}>
                                    <h3 style={cardTitleStyle}><Globe size={18} />Online Presence</h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem label="Website" value={contact.website} />
                                        {contact.linkedin && (
                                            <div style={linkItemStyle}>
                                                <strong>LinkedIn:</strong>
                                                <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                                                    View Profile <ExternalLink size={12} />
                                                </a>
                                            </div>
                                        )}
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

// ── Styles (identical to SupplierDetailsModal) ──
const modalOverlayStyle = { position:"fixed",top:0,left:0,right:0,bottom:0,backgroundColor:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"20px" }
const modalContentStyle = { background:"white",borderRadius:"12px",width:"100%",maxWidth:"900px",maxHeight:"90vh",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }
const modalHeaderStyle = { background:"linear-gradient(135deg, #4e2106 0%, #372c27 100%)",color:"white",padding:"0" }
const headerContentStyle = { display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"24px" }
const supplierHeaderStyle = { flex:1 }
const supplierNameStyle = { margin:"0 0 8px 0",fontSize:"24px",fontWeight:"700" }
const supplierMetaStyle = { display:"flex",gap:"16px",alignItems:"center",flexWrap:"wrap" }
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
const categoriesGridStyle = { display:"grid",gap:"16px" }
const categoryCardStyle = { background:"#FEFCFA",border:"1px solid #E8D5C4",borderRadius:"8px",padding:"16px" }
const categoryTitleStyle = { margin:"0 0 12px 0",fontSize:"16px",fontWeight:"600",color:"#5D2A0A" }
const emptyStateStyle = { textAlign:"center",color:"#999",fontStyle:"italic",padding:"40px",background:"#F9F9F9",borderRadius:"8px",border:"1px dashed #E8D5C4" }
const linkItemStyle = { display:"flex",justifyContent:"space-between",alignItems:"center",gap:"16px" }
const linkStyle = { color:"#5D2A0A",textDecoration:"none",display:"flex",alignItems:"center",gap:"4px",fontWeight:"500" }

export default CatalystDetailsModal