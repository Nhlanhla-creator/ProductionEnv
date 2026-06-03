"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import {
    Building, Users, Mail, MapPin, Shield,
    Award, Calendar, DollarSign, Globe, X, ExternalLink, Brain, Settings2, Percent
} from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../../firebaseConfig"

const AdvisorDetailsModal = ({ advisor, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState("overview")
    const [mounted, setMounted] = useState(false)
    const [fullProfile, setFullProfile] = useState(null)
    const [loadingProfile, setLoadingProfile] = useState(false)
    const bodyRef = useRef(null)

    useEffect(() => { setMounted(true) }, [])

    // Fetch full advisor profile when modal opens
    useEffect(() => {
        if (!isOpen || !advisor?.advisorId) return
        
        const fetchProfile = async () => {
            setLoadingProfile(true)
            try {
                const profileDoc = await getDoc(doc(db, "advisorProfiles", advisor.advisorId))
                if (profileDoc.exists()) {
                    const data = profileDoc.data()
                    const formData = data.formData || {}
                    const personal = formData.personalProfessionalOverview || {}
                    const contact = formData.contactDetails || {}
                    const selection = formData.selectionCriteria || {}
                    const credentials = formData.professionalCredentials || {}
                    
                    setFullProfile({
                        name: `${contact.name || ""} ${contact.surname || ""}`.trim() || advisor.advisorName,
                        headline: personal.professionalHeadline || "",
                        bio: personal.briefBio || "",
                        location: contact.province || contact.city || "Not specified",
                        email: contact.email || "",
                        phone: contact.phone || "",
                        yearsExperience: personal.yearsOfExperience || "",
                        functionalExpertise: personal.functionalExpertise || [],
                        industryExperience: personal.industryExperience || [],
                        preferredAdvisorRole: selection.preferredAdvisorRole || [],
                        advisorySupportType: selection.advisorySupportType || [],
                        compensationModel: selection.compensationModel || "",
                        timeCommitment: selection.timeCommitment || "",
                        preferredEngagementStyle: selection.preferredEngagementStyle || "",
                        remoteAvailable: contact.remoteVirtualAvailable || false,
                        keyAchievements: credentials.keyAchievements || "",
                    })
                } else {
                    setFullProfile({
                        name: advisor.advisorName,
                        headline: "",
                        bio: "",
                        location: "Not specified",
                        email: "",
                        phone: "",
                        yearsExperience: "",
                        functionalExpertise: [],
                        industryExperience: [],
                        preferredAdvisorRole: [],
                        advisorySupportType: [],
                        compensationModel: "",
                        timeCommitment: "",
                        preferredEngagementStyle: "",
                        remoteAvailable: false,
                        keyAchievements: "",
                    })
                }
            } catch (error) {
                console.error("Error fetching advisor profile:", error)
            } finally {
                setLoadingProfile(false)
            }
        }
        
        fetchProfile()
    }, [isOpen, advisor?.advisorId, advisor?.advisorName])

    if (!isOpen || !advisor || !mounted) return null

    const profile = fullProfile || {
        name: advisor.advisorName,
        headline: "",
        bio: "",
        location: "Not specified",
        email: "",
        phone: "",
        yearsExperience: "",
        functionalExpertise: [],
        industryExperience: [],
        preferredAdvisorRole: [],
        advisorySupportType: [],
        compensationModel: "",
        timeCommitment: "",
        preferredEngagementStyle: "",
        remoteAvailable: false,
        keyAchievements: "",
    }

    const formatArray = (arr) => {
        if (!arr || arr.length === 0) return "Not specified"
        return arr.join(" • ")
    }

    const tabs = [
        { id: "overview",  label: "Overview",   icon: Building },
        { id: "expertise", label: "Expertise",  icon: Award },
        { id: "engagement",label: "Engagement", icon: DollarSign },
        { id: "contact",   label: "Contact",    icon: Mail },
    ]

    return createPortal(
      <div style={modalOverlayStyle} onClick={onClose}>
        <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
          {/* Header - fixed */}
          <div style={modalHeaderStyle}>
            <div style={headerContentStyle}>
              <div style={advisorHeaderStyle}>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <h2 style={advisorNameStyle}>{profile.name}</h2>
                  {advisor.finalScore !== undefined && (
                    <span style={matchScoreStyle}>
                      {Math.round(advisor.finalScore)}% Match
                    </span>
                  )}
                </div>
                <div style={advisorMetaStyle}>
                  {profile.headline && (
                    <span style={entityTypeStyle}>{profile.headline}</span>
                  )}
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
                            Professional Information
                          </h3>
                          <div style={infoGridStyle}>
                            <InfoItem label="Full Name" value={profile.name} />
                            <InfoItem
                              label="Professional Role"
                              value={profile.headline}
                            />
                            <InfoItem
                              label="Location"
                              value={profile.location}
                            />
                            <InfoItem
                              label="Years of Experience"
                              value={profile.yearsExperience || "Not specified"}
                            />
                          </div>
                        </div>

                        {profile.bio && (
                          <div style={infoCardStyle}>
                            <h3 style={cardTitleStyle}>
                              <Users size={18} />
                              Bio
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
                              Key Achievements
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

                  {/* ── EXPERTISE ── */}
                  {activeTab === "expertise" && (
                    <div style={tabContentStyle}>
                      <div style={gridStyle}>
                        <div style={infoCardStyle}>
                          <h3 style={cardTitleStyle}>
                            <Award size={18} />
                            Areas of Expertise
                          </h3>
                          <div style={infoGridStyle}>
                            <InfoItem
                              label="Functional Expertise"
                              value={formatArray(profile.functionalExpertise)}
                            />
                            <InfoItem
                              label="Industry Experience"
                              value={formatArray(profile.industryExperience)}
                            />
                            <InfoItem
                              label="Preferred Advisory Role"
                              value={formatArray(profile.preferredAdvisorRole)}
                            />
                            <InfoItem
                              label="Support Focus"
                              value={formatArray(profile.advisorySupportType)}
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
                              value={
                                profile.compensationModel || "Not specified"
                              }
                            />
                            <InfoItem
                              label="Time Commitment"
                              value={profile.timeCommitment || "Not specified"}
                            />
                            <InfoItem
                              label="Engagement Style"
                              value={
                                profile.preferredEngagementStyle ||
                                "Not specified"
                              }
                            />
                            <InfoItem
                              label="Remote Available"
                              value={profile.remoteAvailable ? "Yes" : "No"}
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
                            <InfoItem label="Name" value={profile.name} />
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
const advisorHeaderStyle = { flex: 1 }
const advisorNameStyle = { fontSize: "24px", fontWeight: "700" }
const advisorMetaStyle = { display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }
const entityTypeStyle = { borderRadius: "20px", fontSize: "14px", fontWeight: "500" }
const locationStyle = { display: "flex", alignItems: "center", gap: "4px", fontSize: "14px" }
const matchScoreStyle = { display: "flex", alignItems: "center", gap: "4px", background: "#2E7D32", padding: "4px 12px", borderRadius: "20px", fontSize: "14px", fontWeight: "500" }
const closeButtonStyle = { background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "8px", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }
const tabsContainerStyle = { display: "flex", background: "rgba(255,255,255,0.1)", padding: "0 24px" }
const tabStyle = { display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", background: "none", border: "none", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: "14px", fontWeight: "500", borderBottom: "3px solid transparent", transition: "all 0.2s ease" }
const activeTabStyle = { color: "white", borderBottomColor: "white", background: "rgba(255,255,255,0.1)" }

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

export default AdvisorDetailsModal