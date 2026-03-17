"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Building, MapPin, DollarSign, BarChart3, FileText, TrendingUp, Users, Award, X, ExternalLink, Check } from "lucide-react"

const InvestorSMEDetailsModal = ({ sme, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState("overview")
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    if (!isOpen || !sme || !mounted) return null

    const entity   = sme.entityOverview        || {}
    const appOvw   = sme.applicationOverview   || {}
    const useOfFunds = sme.useOfFunds          || {}
    const financial  = sme.financialOverview   || {}
    const enterprise = sme.enterpriseReadiness || {}
    const growth     = sme.growthPotential     || {}
    const social     = sme.socialImpact        || {}

    const formatLabel = (v) => {
        if (!v) return "Not specified"
        if (Array.isArray(v)) return v.join(", ")
        return v.toString().split(",").map(s => s.trim())
            .map(w => w.split(/[_\s-]+/).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" "))
            .join(", ")
    }

    const tabs = [
        { id: "overview",   label: "Overview",   icon: Building },
        { id: "application",label: "Application", icon: FileText },
        { id: "financial",  label: "Financial",   icon: DollarSign },
        { id: "growth",     label: "Growth",      icon: TrendingUp },
        { id: "documents",  label: "Documents",   icon: Award },
    ]

    return createPortal(
        <div style={overlayStyle}>
            <div style={contentStyle}>
                {/* Header */}
                <div style={headerStyle}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"24px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
                            {entity.companyLogo?.[0] ? (
                                <img src={entity.companyLogo[0]} alt="Logo"
                                    style={{ width:"60px", height:"60px", objectFit:"contain", borderRadius:"8px", background:"white", padding:"6px" }} />
                            ) : (
                                <div style={{ width:"60px", height:"60px", borderRadius:"8px", background:"rgba(255,255,255,0.2)",
                                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:"24px", fontWeight:"800", color:"white" }}>
                                    {sme.smeName?.charAt(0).toUpperCase() || "S"}
                                </div>
                            )}
                            <div>
                                <h2 style={{ margin:"0 0 8px 0", fontSize:"22px", fontWeight:"700" }}>
                                    {entity.tradingName || entity.registeredName || sme.smeName}
                                </h2>
                                <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
                                    {entity.location && (
                                        <span style={metaBadgeStyle}><MapPin size={13} />{formatLabel(entity.location)}</span>
                                    )}
                                    {sme.matchPercentage !== undefined && (
                                        <span style={metaBadgeStyle}>{sme.matchPercentage}% Match</span>
                                    )}
                                    {entity.operationStage && (
                                        <span style={metaBadgeStyle}>{formatLabel(entity.operationStage)}</span>
                                    )}
                                    {sme.pipelineStage && (
                                        <span style={metaBadgeStyle}>{sme.pipelineStage}</span>
                                    )}
                                </div>
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
                                    <Icon size={15} />{tab.label}
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
                                    <h3 style={cardTitleStyle}><Building size={17} />Entity Overview</h3>
                                    <InfoItem label="Registered Name"   value={entity.registeredName} />
                                    <InfoItem label="Trading Name"      value={entity.tradingName} />
                                    <InfoItem label="Registration No."  value={entity.registrationNumber} />
                                    <InfoItem label="Entity Type"       value={formatLabel(entity.entityType)} />
                                    <InfoItem label="Entity Size"       value={formatLabel(entity.entitySize)} />
                                    <InfoItem label="Employees"         value={entity.employeeCount} />
                                    <InfoItem label="Years in Operation" value={entity.yearsInOperation} />
                                    <InfoItem label="Financial Year End" value={entity.financialYearEnd} />
                                    <InfoItem label="Operation Stage"   value={formatLabel(entity.operationStage)} />
                                    <InfoItem label="Location"          value={formatLabel(entity.location)} />
                                    <InfoItem label="Province"          value={formatLabel(entity.province)} />
                                    <InfoItem label="Economic Sectors"  value={formatLabel(entity.economicSectors?.join(", "))} />
                                </div>
                                <div style={cardStyle}>
                                    <h3 style={cardTitleStyle}><Users size={17} />Enterprise Readiness</h3>
                                    <BoolItem label="Business Plan"         value={enterprise.hasBusinessPlan} />
                                    <BoolItem label="Pitch Deck"            value={enterprise.hasPitchDeck} />
                                    <BoolItem label="MVP / Prototype"       value={enterprise.hasMVPPrototype} />
                                    <BoolItem label="Has Traction"          value={enterprise.hasTraction} />
                                    <BoolItem label="Audited Financials"    value={enterprise.hasAuditedFinancials} />
                                    <BoolItem label="Has Mentor"            value={enterprise.hasMentor} />
                                    <BoolItem label="Advisors / Board"      value={enterprise.hasAdvisorsBoard} />
                                    <InfoItem label="Current Customers"     value={enterprise.currentPayingCustomers} />
                                    <InfoItem label="Previous Support"      value={enterprise.supportPreviouslyReceived} />
                                    <InfoItem label="Barriers to Growth"    value={formatLabel(enterprise.mainBarriersToGrowth?.join(", "))} />
                                </div>
                            </div>
                            {entity.businessDescription && (
                                <div style={{ ...cardStyle, marginTop:"16px" }}>
                                    <h3 style={cardTitleStyle}>Business Description</h3>
                                    <p style={{ margin:0, fontSize:"0.85rem", color:"#5D2A0A", lineHeight:"1.6" }}>
                                        {entity.businessDescription}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── APPLICATION ── */}
                    {activeTab === "application" && (
                        <div style={tabContentStyle}>
                            <div style={gridStyle}>
                                <div style={cardStyle}>
                                    <h3 style={cardTitleStyle}><FileText size={17} />Application Overview</h3>
                                    <InfoItem label="Application Date"     value={appOvw.applicationDate} />
                                    <InfoItem label="Application Type"     value={appOvw.applicationType} />
                                    <InfoItem label="Funding Stage"        value={formatLabel(appOvw.fundingStage)} />
                                    <InfoItem label="Preferred Start Date" value={appOvw.preferredStartDate} />
                                    <InfoItem label="Submission Channel"   value={appOvw.submissionChannel} />
                                    <InfoItem label="Support Format"       value={formatLabel(appOvw.supportFormat)} />
                                    <InfoItem label="Urgency"              value={formatLabel(appOvw.urgency)} />
                                </div>
                                <div style={cardStyle}>
                                    <h3 style={cardTitleStyle}><DollarSign size={17} />Use of Funds</h3>
                                    <InfoItem label="Amount Requested"         value={useOfFunds.amountRequested} />
                                    <InfoItem label="Personal Equity"          value={useOfFunds.personalEquityContributed} />
                                    <InfoItem label="Funding Instruments"      value={formatLabel(useOfFunds.fundingInstrumentsPreferred?.join(", "))} />
                                    <InfoItem label="Preferred Funder Type"    value={formatLabel(useOfFunds.typeOfFunderPreferred?.join(", "))} />
                                </div>
                            </div>
                            {useOfFunds.fundingItems?.length > 0 && (
                                <div style={{ ...cardStyle, marginTop:"16px" }}>
                                    <h3 style={cardTitleStyle}>Purpose of Funds</h3>
                                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.8rem" }}>
                                        <thead>
                                            <tr style={{ background:"#F5EBE0" }}>
                                                {["Category","Sub-area","Description","Amount"].map(h => (
                                                    <th key={h} style={{ padding:"8px", textAlign:"left", color:"#5D2A0A", fontWeight:"600", borderBottom:"2px solid #E8D5C4" }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {useOfFunds.fundingItems.map((item, i) => (
                                                <tr key={i} style={{ borderBottom:"1px solid #f0e6dd" }}>
                                                    <td style={{ padding:"8px", color:"#5D2A0A" }}>{formatLabel(item.category)}</td>
                                                    <td style={{ padding:"8px", color:"#5D2A0A" }}>{formatLabel(item.subArea)}</td>
                                                    <td style={{ padding:"8px", color:"#5D2A0A" }}>{item.description}</td>
                                                    <td style={{ padding:"8px", color:"#5D2A0A", fontWeight:"600" }}>{item.amount}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── FINANCIAL ── */}
                    {activeTab === "financial" && (
                        <div style={tabContentStyle}>
                            <div style={gridStyle}>
                                <div style={cardStyle}>
                                    <h3 style={cardTitleStyle}><BarChart3 size={17} />Financial Overview</h3>
                                    <BoolItem label="Generates Revenue"   value={financial.generatesRevenue} />
                                    <InfoItem label="Annual Revenue"      value={financial.annualRevenue ? `R${Number(financial.annualRevenue).toLocaleString()}` : null} />
                                    <InfoItem label="Current Valuation"   value={financial.currentValuation ? `R${Number(financial.currentValuation).toLocaleString()}` : null} />
                                    <InfoItem label="Profitability"       value={formatLabel(financial.profitabilityStatus)} />
                                    <InfoItem label="Existing Debt"       value={financial.existingDebtOrLoans ? `R${Number(financial.existingDebtOrLoans).toLocaleString()}` : null} />
                                    <InfoItem label="Fundraising History" value={financial.fundraisingHistory} />
                                </div>
                                <div style={cardStyle}>
                                    <h3 style={cardTitleStyle}><Award size={17} />Score Summary</h3>
                                    <InfoItem label="Match %"         value={sme.matchPercentage ? `${sme.matchPercentage}%` : null} />
                                    <InfoItem label="Pipeline Stage"  value={sme.pipelineStage} />
                                    <InfoItem label="Application Date" value={sme.applicationDate} />
                                    <InfoItem label="Support Required" value={formatLabel(sme.supportRequired)} />
                                    <InfoItem label="Investment Type"  value={formatLabel(sme.investmentType)} />
                                    <InfoItem label="Team Size"        value={sme.teamSize} />
                                    <InfoItem label="Revenue"          value={sme.revenue} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── GROWTH ── */}
                    {activeTab === "growth" && (
                        <div style={tabContentStyle}>
                            <div style={gridStyle}>
                                <div style={cardStyle}>
                                    <h3 style={cardTitleStyle}><TrendingUp size={17} />Growth Potential</h3>
                                    <InfoItem label="Market Share"       value={growth.marketShare} />
                                    <InfoItem label="Quality Improvement" value={growth.qualityImprovement} />
                                    <InfoItem label="Green Technology"   value={growth.greenTechnology} />
                                    <InfoItem label="Localisation"       value={growth.localisation} />
                                    <InfoItem label="Regional Spread"    value={growth.regionalSpread} />
                                    <InfoItem label="Personal Risk"      value={growth.personalRisk} />
                                    <InfoItem label="Empowerment"        value={growth.empowerment} />
                                    <InfoItem label="Employment Increase" value={growth.employmentIncrease} />
                                </div>
                                <div style={cardStyle}>
                                    <h3 style={cardTitleStyle}><Users size={17} />Social Impact</h3>
                                    <InfoItem label="Jobs to Create"       value={social.jobsToBeCreated} />
                                    <InfoItem label="Youth Ownership %"    value={social.youthOwnership} />
                                    <InfoItem label="Women Ownership %"    value={social.womenOwnership} />
                                    <InfoItem label="Black Ownership %"    value={social.blackOwnership} />
                                    <InfoItem label="Env/Community Impact" value={social.environmentalCommunityImpact} />
                                    <InfoItem label="SDG Alignment"        value={social.alignmentWithSDGs} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── DOCUMENTS ── */}
                    {activeTab === "documents" && (
                        <div style={tabContentStyle}>
                            <div style={cardStyle}>
                                <h3 style={cardTitleStyle}><FileText size={17} />Required Documents</h3>
                                {sme.investorRequiredDocuments && Object.keys(sme.investorRequiredDocuments).length > 0 ? (
                                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginTop:"8px" }}>
                                        {Object.entries(sme.investorRequiredDocuments).map(([key, url]) => (
                                            <div key={key} style={{ padding:"12px", background:"#F8F5F3", borderRadius:"8px", border:"1px solid #E8D5C4" }}>
                                                <p style={{ margin:"0 0 6px 0", fontSize:"0.75rem", fontWeight:"600", color:"#8D6E63" }}>
                                                    {key.replace(/_/g," ").replace(/\b\w/g, c => c.toUpperCase())}
                                                </p>
                                                {typeof url === "string" && url.startsWith("http") ? (
                                                    <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                                                        <Check size={14} color="#388e3c" />
                                                        <span style={{ fontSize:"0.8rem", color:"#333" }}>Submitted</span>
                                                        <a href={url} target="_blank" rel="noopener noreferrer"
                                                            style={{ fontSize:"0.75rem", color:"#a67c52", textDecoration:"underline", display:"flex", alignItems:"center", gap:"3px", marginLeft:"4px" }}>
                                                            View <ExternalLink size={11} />
                                                        </a>
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize:"0.8rem", color:"#999" }}>Not submitted</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color:"#999", fontSize:"0.85rem", marginTop:"8px" }}>No required documents on record.</p>
                                )}
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
    <div style={{ display:"flex", justifyContent:"space-between", gap:"16px", padding:"5px 0", borderBottom:"1px solid #f0e6dd" }}>
        <strong style={{ fontSize:"0.78rem", color:"#8D6E63", minWidth:"140px", flexShrink:0 }}>{label}</strong>
        <span style={{ fontSize:"0.78rem", color:"#5D2A0A", textAlign:"right" }}>{value || "Not specified"}</span>
    </div>
)

const BoolItem = ({ label, value }) => {
    const isYes = typeof value === "string" ? value.toLowerCase() === "yes" : !!value
    return (
        <div style={{ display:"flex", justifyContent:"space-between", gap:"16px", padding:"5px 0", borderBottom:"1px solid #f0e6dd" }}>
            <strong style={{ fontSize:"0.78rem", color:"#8D6E63", minWidth:"140px", flexShrink:0 }}>{label}</strong>
            <span style={{ fontSize:"0.78rem", fontWeight:"600", color: isYes ? "#388E3C" : value ? "#D32F2F" : "#999" }}>
                {value ? (isYes ? "✓ Yes" : "✗ No") : "Not specified"}
            </span>
        </div>
    )
}

const overlayStyle = { position:"fixed",top:0,left:0,right:0,bottom:0,backgroundColor:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"20px" }
const contentStyle = { background:"white",borderRadius:"12px",width:"100%",maxWidth:"960px",maxHeight:"90vh",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }
const headerStyle = { background:"linear-gradient(135deg, #4e2106 0%, #372c27 100%)",color:"white" }
const metaBadgeStyle = { display:"flex",alignItems:"center",gap:"4px",background:"rgba(255,255,255,0.2)",padding:"3px 10px",borderRadius:"20px",fontSize:"13px" }
const closeButtonStyle = { background:"rgba(255,255,255,0.2)",border:"none",borderRadius:"8px",padding:"8px",color:"white",cursor:"pointer",display:"flex",alignItems:"center",flexShrink:0 }
const tabsContainerStyle = { display:"flex",background:"rgba(255,255,255,0.1)",padding:"0 24px",overflowX:"auto" }
const tabStyle = { display:"flex",alignItems:"center",gap:"7px",padding:"11px 14px",background:"none",border:"none",color:"rgba(255,255,255,0.8)",cursor:"pointer",fontSize:"13px",fontWeight:"500",borderBottom:"3px solid transparent",transition:"all 0.2s ease",whiteSpace:"nowrap" }
const activeTabStyle = { color:"white",borderBottomColor:"white",background:"rgba(255,255,255,0.1)" }
const bodyStyle = { padding:"0",maxHeight:"calc(90vh - 145px)",overflowY:"auto" }
const tabContentStyle = { padding:"24px" }
const gridStyle = { display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px" }
const cardStyle = { background:"#FEFCFA",border:"1px solid #E8D5C4",borderRadius:"8px",padding:"18px" }
const cardTitleStyle = { display:"flex",alignItems:"center",gap:"8px",margin:"0 0 14px 0",fontSize:"15px",fontWeight:"600",color:"#5D2A0A" }

export default InvestorSMEDetailsModal