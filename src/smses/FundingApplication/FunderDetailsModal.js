"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import {
    Building, Users, Mail, MapPin, 
    Award, DollarSign, X} from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../../firebaseConfig"

const FunderDetailsModal = ({ funder, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState("overview")
    const [mounted, setMounted] = useState(false)
    const [fullProfile, setFullProfile] = useState(null)
    const [loadingProfile, setLoadingProfile] = useState(false)
    const bodyRef = useRef(null)

    useEffect(() => { setMounted(true) }, [])

    // Fetch full funder profile when modal opens
    useEffect(() => {
        if (!isOpen || !funder?.funderId) return
        
        const fetchProfile = async () => {
            setLoadingProfile(true)
            try {
                const profileDoc = await getDoc(doc(db, "MyuniversalProfiles", funder.funderId))
                if (profileDoc.exists()) {
                    const data = profileDoc.data()
                    const formData = data.formData || {}
                    const fundManage = formData.fundManageOverview || {}
                    const contact = formData.contactDetails || {}
                    const generalPrefs = formData.generalInvestmentPreference || {}
                    const appBrief = formData.applicationBrief || {}
                    const funds = formData.fundDetails?.funds || []
                    
                    // Calculate min/max ticket range across the funds
                    let minTicket = 0
                    let maxTicket = 0
                    funds.forEach(f => {
                        const fMin = Number(String(f.minimumTicket || f.minTicket || "").replace(/[^\d.]/g, ""))
                        const fMax = Number(String(f.maximumTicket || f.maxTicket || "").replace(/[^\d.]/g, ""))
                        if (fMin > 0 && (minTicket === 0 || fMin < minTicket)) minTicket = fMin
                        if (fMax > 0 && fMax > maxTicket) maxTicket = fMax
                    })
                    const fundingAmount = minTicket > 0 || maxTicket > 0
                        ? `R ${minTicket.toLocaleString()} - R ${maxTicket.toLocaleString()}`
                        : "Flexible"

                    // Format physical address or general location
                    let location = "Not specified"
                    if (contact.physicalAddress) {
                        location = contact.physicalAddress
                    } else if (generalPrefs.geographicFocus) {
                        location = Array.isArray(generalPrefs.geographicFocus)
                            ? generalPrefs.geographicFocus.join(", ")
                            : generalPrefs.geographicFocus
                    }

                    // Map stage
                    const fundingStage = Array.isArray(generalPrefs.investmentStage)
                        ? generalPrefs.investmentStage
                        : generalPrefs.investmentStage ? [generalPrefs.investmentStage] : []
                    
                    setFullProfile({
                        name: fundManage.registeredName || fundManage.tradingName || contact.registeredName || funder.funderName,
                        headline: fundManage.firmType || "",
                        bio: fundManage.briefDescription || "",
                        location,
                        email: contact.businessEmail || contact.email || "",
                        phone: contact.businessTel || contact.phone || "",
                        yearsExperience: fundManage.yearsInOperation || "",
                        funderType: fundManage.firmType || "",
                        fundingStage,
                        fundingAmount,
                        sectorFocus: generalPrefs.sectorFocus || [],
                        geographicFocus: generalPrefs.geographicFocus || [],
                        compensationModel: generalPrefs.fundStructure || "",
                        keyAchievements: appBrief.overviewObjectives || "",
                        typicalDealClosingTime: appBrief.typicalDealClosingTime || "",
                        estimatedReviewTime: appBrief.estimatedReviewTime || "",
                    })
                } else {
                    setFullProfile({
                        name: funder.funderName,
                        headline: "",
                        bio: "",
                        location: "Not specified",
                        email: "",
                        phone: "",
                        yearsExperience: "",
                        funderType: "",
                        fundingStage: [],
                        fundingAmount: "",
                        sectorFocus: [],
                        geographicFocus: [],
                        compensationModel: "",
                        keyAchievements: "",
                        typicalDealClosingTime: "",
                        estimatedReviewTime: "",
                    })
                }
            } catch (error) {
                console.error("Error fetching funder profile:", error)
            } finally {
                setLoadingProfile(false)
            }
        }
        
        fetchProfile()
    }, [isOpen, funder?.funderId, funder?.funderName])

    if (!isOpen || !funder || !mounted) return null

    const profile = fullProfile || {
        name: funder.funderName,
        headline: "",
        bio: "",
        location: "Not specified",
        email: "",
        phone: "",
        yearsExperience: "",
        funderType: "",
        fundingStage: [],
        fundingAmount: "",
        sectorFocus: [],
        geographicFocus: [],
        compensationModel: "",
        keyAchievements: "",
        typicalDealClosingTime: "",
        estimatedReviewTime: "",
    }

    const cleanWord = (word) => {
        if (!word) return ""
        return String(word)
            .split(/[-_\s]+/)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(" ")
    }

    const formatArray = (arr) => {
        if (!arr) return "Not specified"
        const array = Array.isArray(arr) ? arr : [arr]
        if (array.length === 0) return "Not specified"
        return array.map(cleanWord).join(" • ")
    }

    const formatString = (str) => {
        if (!str) return "Not specified"
        return cleanWord(str)
    }

    const tabs = [
        { id: "overview",  label: "Overview",   icon: Building },
        { id: "focus", label: "Focus Areas",  icon: Award },
        { id: "engagement",label: "Engagement", icon: DollarSign },
        { id: "contact",   label: "Contact",    icon: Mail },
    ]

    return createPortal(
      <div style={modalOverlayStyle} onClick={onClose}>
        <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
          {/* Header - fixed */}
          <div style={modalHeaderStyle}>
            <div style={headerContentStyle}>
              <div style={funderHeaderStyle}>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <h2 style={funderNameStyle}>{profile.name}</h2>
                  {funder.finalScore !== undefined && (
                    <span style={matchScoreStyle}>
                      {Math.round(funder.finalScore)}% Match
                    </span>
                  )}
                </div>
                <div style={funderMetaStyle}>
                  {profile.headline && (
                    <span style={entityTypeStyle}>{formatString(profile.headline)}</span>
                  )}
                  {/* {profile.funderType && (
                    <span style={funderTypeStyle}>
                      {formatString(profile.funderType)}
                    </span>
                  )} */}
                  {profile.location && profile.location !== "Not specified" && (
                    <span style={locationStyle}>
                      <MapPin size={14} />
                      {profile.location}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={onClose} style={closeButtonStyle}>
                <X size={20} />
              </button>
            </div>

            <div style={tabsContainerStyle}>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      ...tabStyle,
                      ...(activeTab === tab.id ? activeTabStyle : {}),
                    }}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body - scrollable */}
          <div ref={bodyRef} style={modalBodyStyle}>
            <div style={modalBodyInnerStyle}>
              {loadingProfile ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  Loading profile...
                </div>
              ) : (
                <>
                  {/* ── OVERVIEW ── */}
                  {activeTab === "overview" && (
                    <div style={tabContentStyle}>
                      <div style={gridStyle}>
                        <div style={infoCardStyle}>
                          <h3 style={cardTitleStyle}>
                            <Building size={18} />
                            Funder Information
                          </h3>
                          <div style={infoGridStyle}>
                            <InfoItem label="Organization" value={profile.name} />
                            <InfoItem
                              label="Funder Type"
                              value={formatString(profile.funderType)}
                            />
                            <InfoItem
                              label="Location"
                              value={profile.location}
                            />
                            <InfoItem
                              label="Years of Operation"
                              value={profile.yearsExperience || "Not specified"}
                            />
                          </div>
                        </div>

                        {profile.bio && (
                          <div style={infoCardStyle}>
                            <h3 style={cardTitleStyle}>
                              <Users size={18} />
                              About
                            </h3>
                            <p
                              style={{
                                margin: 0,
                                lineHeight: 1.5,
                                color: "#5D4037",
                              }}
                            >
                              {profile.bio}
                            </p>
                          </div>
                        )}

                        {profile.keyAchievements && (
                          <div style={infoCardStyle}>
                            <h3 style={cardTitleStyle}>
                              <Award size={18} />
                              Key Focus Areas
                            </h3>
                            <p
                              style={{
                                margin: 0,
                                lineHeight: 1.5,
                                color: "#5D4037",
                              }}
                            >
                              {profile.keyAchievements}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── FOCUS AREAS ── */}
                  {activeTab === "focus" && (
                    <div style={tabContentStyle}>
                      <div style={gridStyle}>
                        <div style={infoCardStyle}>
                          <h3 style={cardTitleStyle}>
                            <Award size={18} />
                            Investment Focus
                          </h3>
                          <div style={infoGridStyle}>
                            <InfoItem
                              label="Funding Stage"
                              value={formatArray(profile.fundingStage)}
                            />
                            <InfoItem
                              label="Funding Amount"
                              value={profile.fundingAmount || "Not specified"}
                            />
                            <InfoItem
                              label="Sector Focus"
                              value={formatArray(profile.sectorFocus)}
                            />
                            <InfoItem
                              label="Geographic Focus"
                              value={formatArray(profile.geographicFocus)}
                            />
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
                          <h3 style={cardTitleStyle}>
                            <DollarSign size={18} />
                            Engagement Details
                          </h3>
                          <div style={infoGridStyle}>
                            <InfoItem
                              label="Compensation Model"
                              value={formatString(profile.compensationModel)}
                            />
                            <InfoItem
                              label="Estimated Review Time"
                              value={profile.estimatedReviewTime || "Not specified"}
                            />
                            <InfoItem
                              label="Typical Deal Closing Time"
                              value={profile.typicalDealClosingTime || "Not specified"}
                            />
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
                          <h3 style={cardTitleStyle}>
                            <Mail size={18} />
                            Contact Information
                          </h3>
                          <div style={infoGridStyle}>
                            <InfoItem label="Organization" value={profile.name} />
                            <InfoItem
                              label="Location"
                              value={profile.location}
                            />
                            {profile.email && (
                              <InfoItem label="Email" value={profile.email} />
                            )}
                            {profile.phone && (
                              <InfoItem label="Phone" value={profile.phone} />
                            )}
                          </div>
                          <div style={noteStyle}>
                            Contact details are shared after a connection is
                            confirmed.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>,
      document.body,
    );
}

const InfoItem = ({ label, value }) => (
    <div style={infoItemStyle}>
        <strong>{label}:</strong>
        <span>{value || "Not specified"}</span>
    </div>
)

const modalOverlayStyle = { 
    position: "fixed", 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: "rgba(0,0,0,0.7)", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    zIndex: 1000, 
    padding: "20px" 
}

const modalContentStyle = { 
    background: "white", 
    borderRadius: "12px", 
    width: "100%", 
    maxWidth: "900px", 
    maxHeight: "calc(100vh - 40px)", 
    display: "flex", 
    flexDirection: "column", 
    overflow: "hidden", 
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)" 
}

const modalHeaderStyle = { 
    background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)", 
    color: "white", 
    flexShrink: 0 
}

const headerContentStyle = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "24px" }
const funderHeaderStyle = { flex: 1 }
const funderNameStyle = { fontSize: "24px", fontWeight: "700" }
const funderMetaStyle = { display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }
const entityTypeStyle = { borderRadius: "20px", fontSize: "14px", fontWeight: "500" }
const funderTypeStyle = { display: "inline-block", padding: "4px 12px", background: "rgba(255,255,255,0.2)", borderRadius: "12px", fontSize: "12px", fontWeight: 500 }
const locationStyle = { display: "flex", alignItems: "center", gap: "4px", fontSize: "14px" }
const matchScoreStyle = { display: "flex", alignItems: "center", gap: "4px", background: "#2E7D32", padding: "4px 12px", borderRadius: "20px", fontSize: "14px", fontWeight: "500" }
const closeButtonStyle = { background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "8px", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }
const tabsContainerStyle = { display: "flex", background: "rgba(255,255,255,0.1)", padding: "0 24px" }

const tabStyle = { 
    display: "flex", 
    alignItems: "center", 
    gap: "8px", 
    padding: "12px 16px", 
    background: "none", 
    border: "none", 
    color: "rgba(255,255,255,0.6)",
    cursor: "pointer", 
    fontSize: "14px", 
    fontWeight: "500", 
    borderBottom: "3px solid transparent",  // Default: no underline
    transition: "all 0.2s ease" 
}

const activeTabStyle = { 
    color: "white",
    borderBottom: "3px solid white"  // Override with underline
}
const modalBodyStyle = { 
    flex: 1, 
    overflowY: "auto", 
    minHeight: 0 
}

const modalBodyInnerStyle = { 
    padding: "24px 24px 40px 24px" 
}

const tabContentStyle = { 
    width: "100%" 
}

const gridStyle = { 
    display: "flex", 
    flexDirection: "column", 
    gap: "20px" 
}

const infoCardStyle = { 
    background: "#FEFCFA", 
    border: "1px solid #E8D5C4", 
    borderRadius: "8px", 
    padding: "20px" 
}

const cardTitleStyle = { 
    display: "flex", 
    alignItems: "center", 
    gap: "8px", 
    margin: "0 0 16px 0", 
    fontSize: "18px", 
    fontWeight: "600", 
    color: "#5D2A0A" 
}

const infoGridStyle = { 
    display: "flex", 
    flexDirection: "column", 
    gap: "12px" 
}

const infoItemStyle = { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "flex-start", 
    gap: "16px", 
    borderBottom: "1px solid #F0E6DA", 
    paddingBottom: "8px" 
}

const noteStyle = { 
    marginTop: "16px", 
    padding: "12px", 
    background: "rgba(166,124,82,0.05)", 
    borderRadius: "6px", 
    border: "1px solid #E8D5C4", 
    fontSize: "0.8rem", 
    color: "#8D6E63", 
    fontStyle: "italic" 
}

export default FunderDetailsModal