"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Building, MapPin, DollarSign, FileText, Award, BarChart3, Globe, X } from "lucide-react"

/* Same modal as the SME-side FunderDetailsModal — identical tabs, cards and
   styling. Every field falls back through: full profile → flat CMF row field →
   "Not specified", so it renders correctly whether the row carries a whole
   funder profile or just the matched summary. */
const CMFFunderDetailsModal = ({ funder, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState("overview")
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    if (!isOpen || !funder || !mounted) return null

    const fp = funder.fullProfile || funder.rawFormData || {}
    const overview   = fp.fundManageOverview          || {}
    const prefs      = fp.generalInvestmentPreference || {}
    const brief      = fp.applicationBrief            || {}
    const funds      = fp.fundDetails?.fundDetails?.funds || fp.fundDetails?.funds || funder.funds || []

    const tabs = [
        { id: "overview",    label: "Overview",    icon: Building },
        { id: "fund",        label: "Fund Details", icon: DollarSign },
        { id: "preferences", label: "Preferences",  icon: BarChart3 },
        { id: "application", label: "Application",  icon: FileText },
    ]

    const formatArr = (v) => Array.isArray(v) ? v.join(", ") : (v || "Not specified")

    return createPortal(
        <div style={overlayStyle} onClick={onClose}>
            <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={headerStyle}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"24px" }}>
                        <div>
                            <h2 style={{ margin:"0 0 8px 0", fontSize:"24px", fontWeight:"700" }}>
                                {funder.anonymous ? "Anonymous Funder" : funder.name}
                            </h2>
                            <div style={{ display:"flex", gap:"12px", flexWrap:"wrap" }}>
                                {(funder.geographicFocus || funder.location) && (
                                    <span style={metaBadgeStyle}><MapPin size={14} />{funder.geographicFocus || funder.location}</span>
                                )}
                                {funder.matchPercentage !== undefined && (
                                    <span style={metaBadgeStyle}>{funder.matchPercentage}% Match</span>
                                )}
                                {(funder.investmentType || funder.type) && (
                                    <span style={metaBadgeStyle}>{funder.investmentType || funder.type}</span>
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
                                    <h3 style={cardTitleStyle}><Building size={18} />General Information</h3>
                                    <InfoItem label="Firm Type"           value={overview.firmType || funder.type} />
                                    <InfoItem label="Legal Entity Type"   value={overview.legalEntityType} />
                                    <InfoItem label="Registered Name"     value={funder.anonymous ? "Anonymous" : (overview.registeredName || funder.name)} />
                                    <InfoItem label="Trading Name"        value={overview.tradingName} />
                                    <InfoItem label="Registration No."    value={overview.registrationNumber} />
                                    <InfoItem label="Tax Number"          value={overview.taxNumber} />
                                    <InfoItem label="VAT Number"          value={overview.vatRegistrationNumbers} />
                                    <InfoItem label="Years in Operation"  value={overview.yearsInOperation} />
                                    <InfoItem label="Contact Person"      value={funder.contactPerson} />
                                    <InfoItem label="Email"               value={funder.email} />
                                </div>
                                <div style={cardStyle}>
                                    <h3 style={cardTitleStyle}><Award size={18} />Fund Management</h3>
                                    <InfoItem label="Brief Description"     value={overview.briefDescription || funder.description} />
                                    <InfoItem label="Investor Role"         value={overview.investorRole} />
                                    <InfoItem label="No. of Investments"    value={overview.numberOfInvestments} />
                                    <InfoItem label="Value Deployed"        value={overview.valueDeployed} />
                                    <InfoItem label="No. of Executives"     value={overview.numberOfInvestmentExecutives} />
                                    <InfoItem label="Portfolio Companies"   value={overview.portfolioCompanies} />
                                    <InfoItem label="Additional Services"   value={formatArr(overview.additionalServices)} />
                                    <InfoItem label="Additional Support"    value={formatArr(overview.additionalSupport || funder.supportOffered)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── FUND DETAILS ── */}
                    {activeTab === "fund" && (
                        <div style={tabContentStyle}>
                            {funds.length === 0 ? (
                                <div style={cardStyle}>
                                    <h3 style={cardTitleStyle}><DollarSign size={18} />Fund Summary</h3>
                                    <InfoItem label="Ticket Size" value={funder.fundingRange || funder.ticketSize} />
                                    <InfoItem label="Investment Type" value={funder.investmentType || funder.type} />
                                    <p style={{ color:"#8D6E63", fontSize:"0.85rem", marginTop:"12px" }}>
                                        No individual fund records were shared for this funder.
                                    </p>
                                </div>
                            ) : funds.map((fund, i) => (
                                <div key={i} style={{ ...cardStyle, marginBottom:"16px" }}>
                                    <h3 style={cardTitleStyle}>
                                        <DollarSign size={18} />
                                        {fund.name || `Fund ${i + 1}`}
                                    </h3>
                                    <div style={gridStyle}>
                                        <div>
                                            <InfoItem label="Fund Size"         value={fund.size} />
                                            <InfoItem label="Fund Structure"    value={fund.fundStructure} />
                                            <InfoItem label="Legal Structure"   value={fund.fundLegalStructure} />
                                            <InfoItem label="Minimum Ticket"    value={fund.minimumTicket} />
                                            <InfoItem label="Maximum Ticket"    value={fund.maximumTicket} />
                                            <InfoItem label="Average Deal Size" value={fund.averageDealSize} />
                                            <InfoItem label="Revenue Threshold" value={fund.revenueThreshold} />
                                        </div>
                                        <div>
                                            <InfoItem label="Follow-on %"         value={fund.followOnPercentage ? `${fund.followOnPercentage}%` : null} />
                                            <InfoItem label="Pro Rata Rights"     value={fund.proRataRights ? "Yes" : "No"} />
                                            <InfoItem label="Reserves Follow-on"  value={fund.reservesForFollowOn ? "Yes" : "No"} />
                                            <InfoItem label="Captive Fund"        value={fund.captiveFund ? "Yes" : "No"} />
                                            <InfoItem label="LP Composition"      value={fund.lpComposition} />
                                            <InfoItem label="Target Investor Type" value={fund.targetInvestorType} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── PREFERENCES ── */}
                    {activeTab === "preferences" && (
                        <div style={tabContentStyle}>
                            <div style={gridStyle}>
                                <div style={cardStyle}>
                                    <h3 style={cardTitleStyle}><BarChart3 size={18} />Investment Preferences</h3>
                                    <InfoItem label="Investment Focus"  value={prefs.investmentFocus || funder.focus} />
                                    <InfoItem label="Investment Stage"  value={formatArr(prefs.investmentStage || funder.targetStage)} />
                                    <InfoItem label="Sector Focus"      value={formatArr(prefs.sectorFocus || funder.sectors)} />
                                    <InfoItem label="Geographic Focus"  value={formatArr(prefs.geographicFocus || funder.location)} />
                                    <InfoItem label="Risk Appetite"     value={prefs.riskAppetite} />
                                    <InfoItem label="Legal Entity Fit"  value={prefs.legalEntityFit} />
                                </div>
                                <div style={cardStyle}>
                                    <h3 style={cardTitleStyle}><Globe size={18} />Match Summary</h3>
                                    <InfoItem label="Match %"         value={funder.matchPercentage != null ? `${funder.matchPercentage}%` : null} />
                                    <InfoItem label="Sector Focus"    value={formatArr(funder.sectorFocus || funder.sectors)} />
                                    <InfoItem label="Target Stage"    value={funder.targetStage} />
                                    <InfoItem label="Ticket Size"     value={funder.ticketSize || funder.fundingRange} />
                                    <InfoItem label="Pipeline Stage"  value={funder.pipelineStage} />
                                    <InfoItem label="Support Offered" value={formatArr(funder.supportOffered)} />
                                    <InfoItem label="Deadline"        value={funder.deadline} />
                                    <InfoItem label="Waiting Time"    value={funder.waitingTime} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── APPLICATION ── */}
                    {activeTab === "application" && (
                        <div style={tabContentStyle}>
                            <div style={cardStyle}>
                                <h3 style={cardTitleStyle}><FileText size={18} />Application Process</h3>
                                <InfoItem label="Application Window"       value={brief.applicationWindow || funder.deadline} />
                                <InfoItem label="Typical Deal Close Time"  value={brief.typicalDealClosingTime} />
                                <InfoItem label="Estimated Review Time"    value={brief.estimatedReviewTime || funder.waitingTime} />
                                <InfoItem label="Overview & Objectives"    value={brief.overviewObjectives || funder.description} />
                                <InfoItem label="Evaluation Criteria"      value={brief.evaluationCriteria} />
                                <InfoItem label="Impact Alignment"         value={brief.impactAlignment} />
                                <InfoItem label="Instructions for Applying" value={brief.instructionsForApplying} />
                            </div>
                            {brief.coreDocuments?.length > 0 && (
                                <div style={{ ...cardStyle, marginTop:"16px" }}>
                                    <h3 style={cardTitleStyle}><FileText size={18} />Required Documents</h3>
                                    {brief.coreDocuments.map((doc, i) => (
                                        <div key={i} style={{ padding:"6px 0", borderBottom:"1px solid #f0e6dd", fontSize:"0.8rem", color:"#5D2A0A" }}>
                                            • {doc}
                                        </div>
                                    ))}
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
    <div style={{ display:"flex", justifyContent:"space-between", gap:"16px", padding:"6px 0", borderBottom:"1px solid #f0e6dd" }}>
        <strong style={{ fontSize:"0.8rem", color:"#8D6E63", minWidth:"160px", flexShrink:0 }}>{label}</strong>
        <span style={{ fontSize:"0.8rem", color:"#5D2A0A", textAlign:"right" }}>{value || "Not specified"}</span>
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

export default CMFFunderDetailsModal