"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import {
    Building, Users, Mail, MapPin, Shield,
    Award, Calendar, DollarSign, Globe, X, ExternalLink, Brain, Settings2, Percent, GraduationCap, BookOpen, Briefcase
} from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../../firebaseConfig"

const InternDetailsModal = ({ intern, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState("overview")
    const [mounted, setMounted] = useState(false)
    const [fullProfile, setFullProfile] = useState(null)
    const [loadingProfile, setLoadingProfile] = useState(false)
    const bodyRef = useRef(null)

    useEffect(() => { setMounted(true) }, [])

    // Fetch full intern profile when modal opens
    useEffect(() => {
        if (!isOpen || !intern?.internId) return

        const fetchProfile = async () => {
            setLoadingProfile(true)
            try {
                const profileDoc = await getDoc(doc(db, "internProfiles", intern.internId))
                if (profileDoc.exists()) {
                    const data = profileDoc.data()
                    const formData = data.formData || {}
                    const personalOverview = formData.personalOverview || {}
                    const academic = formData.academicOverview || {}
                    const skills = formData.skillsInterests || {}
                    const experience = formData.experienceTrackRecord || {}
                    const program = formData.programAffiliation || {}

                    setFullProfile({
                        name: (personalOverview.fullName || intern.internName).split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "),
                        phone: personalOverview.phone || "",
                        email: personalOverview.email || "",
                        dateOfBirth: personalOverview.dateOfBirth || "",
                        provinces: personalOverview.provinces || [],
                        cities: personalOverview.cities || [],

                        // Academic
                        institution: academic.institution || "",
                        qualificationLevel: academic.qualificationLevel || "",
                        degree: academic.degree || "",
                        degreeOther: academic.degreeOther || "",
                        fieldOfStudy: academic.fieldOfStudy || "",
                        graduationYear: academic.graduationYear || "",
                        yearOfStudy: academic.yearOfStudy || "",
                        academicPerformance: academic.academicPerformance || "",
                        academicHonors: academic.academicHonors || "",
                        certifications: academic.certifications || [],
                        locationFlexibility: academic.locationFlexibility || [],

                        // Skills & Interests
                        technicalSkills: skills.technicalSkills || [],
                        passionAreas: skills.passionAreas || [],
                        availableHours: skills.availableHours || "",
                        availabilityStart: skills.availabilityStart || "",

                        // Experience
                        workExperiences: experience.workExperiences || [],
                        volunteerWork: experience.volunteerWork || [],
                        leadershipExperience: experience.leadershipExperience || [],
                        academicProjects: experience.academicProjects || [],
                        internshipExperience: experience.internshipExperience || "",
                        linkedInProfile: experience.linkedInProfile || "",
                        referenceContact: experience.referenceContact || "",

                        // Program
                        programType: program.programType || "",
                        fundingStatus: program.fundingStatus || "",
                        sponsorName: program.sponsorName || "",
                        requiresLogbook: program.requiresLogbook || false,
                        programStartDate: program.programStartDate || "",
                        duration: program.duration || "",
                    })
                } else {
                    setFullProfile({
                        name: intern.internName,
                        phone: "",
                        email: "",
                        dateOfBirth: "",
                        provinces: [],
                        cities: [],
                        institution: "",
                        qualificationLevel: "",
                        degree: "",
                        degreeOther: "",
                        fieldOfStudy: "",
                        graduationYear: "",
                        yearOfStudy: "",
                        academicPerformance: "",
                        academicHonors: "",
                        certifications: [],
                        locationFlexibility: [],
                        technicalSkills: [],
                        passionAreas: [],
                        availableHours: "",
                        availabilityStart: "",
                        workExperiences: [],
                        volunteerWork: [],
                        leadershipExperience: [],
                        academicProjects: [],
                        internshipExperience: "",
                        linkedInProfile: "",
                        referenceContact: "",
                        programType: "",
                        fundingStatus: "",
                        sponsorName: "",
                        requiresLogbook: false,
                        programStartDate: "",
                        duration: "",
                    })
                }
            } catch (error) {
                console.error("Error fetching intern profile:", error)
            } finally {
                setLoadingProfile(false)
            }
        }

        fetchProfile()
    }, [isOpen, intern?.internId, intern?.internName])

    if (!isOpen || !intern || !mounted) return null

    const profile = fullProfile || {
        name: intern.internName,
        phone: "",
        email: "",
        dateOfBirth: "",
        provinces: [],
        cities: [],
        institution: "",
        qualificationLevel: "",
        degree: "",
        degreeOther: "",
        fieldOfStudy: "",
        graduationYear: "",
        yearOfStudy: "",
        academicPerformance: "",
        academicHonors: "",
        certifications: [],
        locationFlexibility: [],
        technicalSkills: [],
        passionAreas: [],
        availableHours: "",
        availabilityStart: "",
        workExperiences: [],
        volunteerWork: [],
        leadershipExperience: [],
        academicProjects: [],
        internshipExperience: "",
        linkedInProfile: "",
        referenceContact: "",
        programType: "",
        fundingStatus: "",
        sponsorName: "",
        requiresLogbook: false,
        programStartDate: "",
        duration: "",
    }

    const formatArray = (arr) => {
        if (!arr || arr.length === 0) return "Not specified"
        return arr.join(" • ")
    }

    const formatListItems = (items) => {
        if (!items || items.length === 0) return null
        return items.map((item, i) => {
            if (typeof item === "string") return <li key={i}>{item}</li>
            if (typeof item === "object") {
                const label = item.title || item.role || item.position || item.type || item.description || ""
                const desc = item.description && !item.type ? ` — ${item.description}` : ""
                const company = item.company || item.organization ? ` at ${item.company || item.organization}` : ""
                return <li key={i}>{label}{desc}{company}</li>
            }
            return <li key={i}>{String(item)}</li>
        })
    }

    const tabs = [
        { id: "overview",  label: "Overview",   icon: Building },
        { id: "education", label: "Education",  icon: GraduationCap },
        { id: "skills",    label: "Skills",     icon: Brain },
        { id: "experience",label: "Experience", icon: Briefcase },
        { id: "contact",   label: "Contact",    icon: Mail },
    ]

    return createPortal(
      <div style={modalOverlayStyle} onClick={onClose}>
        <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
          {/* Header - fixed */}
          <div style={modalHeaderStyle}>
            <div style={headerContentStyle}>
              <div style={headerLeftStyle}>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <h2 style={modalTitleStyle}>{profile.name}</h2>
                  {intern.finalScore !== undefined && (
                    <span style={matchScoreStyle}>
                      {Math.round(intern.finalScore)}% Match
                    </span>
                  )}
                </div>
                <div style={metaRowStyle}>
                  {profile.institution && (
                    <span style={badgeStyle}>{profile.institution}</span>
                  )}
                  {profile.cities && profile.cities.length > 0 && (
                    <span style={locationBadgeStyle}>
                      <MapPin size={14} />
                      {profile.cities[0]}
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
                            <Users size={18} />
                            Personal Information
                          </h3>
                          <div style={infoGridStyle}>
                            <InfoItem label="Full Name" value={profile.name} />
                            <InfoItem label="Date of Birth" value={profile.dateOfBirth || "Not specified"} />
                            <InfoItem label="Provinces" value={formatArray(profile.provinces)} />
                            <InfoItem label="Cities" value={formatArray(profile.cities)} />
                          </div>
                        </div>

                        <div style={infoCardStyle}>
                          <h3 style={cardTitleStyle}>
                            <BookOpen size={18} />
                            Program Affiliation
                          </h3>
                          <div style={infoGridStyle}>
                            <InfoItem label="Program Type" value={profile.programType || "Not specified"} />
                            <InfoItem label="Funding Status" value={profile.fundingStatus || "Not specified"} />
                            <InfoItem label="Sponsor" value={profile.sponsorName || "Not specified"} />
                            <InfoItem label="Program Start" value={profile.programStartDate || "Not specified"} />
                            <InfoItem label="Duration" value={profile.duration || "Not specified"} />
                            <InfoItem label="Requires Logbook" value={profile.requiresLogbook ? "Yes" : "No"} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── EDUCATION ── */}
                  {activeTab === "education" && (
                    <div style={tabContentStyle}>
                      <div style={gridStyle}>
                        <div style={infoCardStyle}>
                          <h3 style={cardTitleStyle}>
                            <GraduationCap size={18} />
                            Academic Details
                          </h3>
                          <div style={infoGridStyle}>
                            <InfoItem label="Institution" value={profile.institution || "Not specified"} />
                            <InfoItem label="Qualification Level" value={profile.qualificationLevel || "Not specified"} />
                            <InfoItem label="Degree" value={profile.degree || profile.degreeOther || "Not specified"} />
                            <InfoItem label="Field of Study" value={profile.fieldOfStudy || "Not specified"} />
                            <InfoItem label="Year of Study" value={profile.yearOfStudy || "Not specified"} />
                            <InfoItem label="Graduation Year" value={profile.graduationYear || "Not specified"} />
                            <InfoItem label="Academic Performance" value={profile.academicPerformance || "Not specified"} />
                            <InfoItem label="Academic Honors" value={profile.academicHonors || "Not specified"} />
                            <InfoItem label="Location Flexibility" value={formatArray(profile.locationFlexibility)} />
                          </div>
                        </div>

                        {profile.certifications && profile.certifications.length > 0 && (
                          <div style={infoCardStyle}>
                            <h3 style={cardTitleStyle}>
                              <Award size={18} />
                              Certifications
                            </h3>
                            <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "#5D4037", lineHeight: 1.8 }}>
                              {formatListItems(profile.certifications)}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── SKILLS ── */}
                  {activeTab === "skills" && (
                    <div style={tabContentStyle}>
                      <div style={gridStyle}>
                        <div style={infoCardStyle}>
                          <h3 style={cardTitleStyle}>
                            <Brain size={18} />
                            Skills & Interests
                          </h3>
                          <div style={infoGridStyle}>
                            <InfoItem label="Technical Skills" value={formatArray(profile.technicalSkills)} />
                            <InfoItem label="Passion Areas" value={formatArray(profile.passionAreas)} />
                            <InfoItem label="Available Hours/Week" value={profile.availableHours || "Not specified"} />
                            <InfoItem label="Availability Start" value={profile.availabilityStart || "Not specified"} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── EXPERIENCE ── */}
                  {activeTab === "experience" && (
                    <div style={tabContentStyle}>
                      <div style={gridStyle}>
                        <div style={infoCardStyle}>
                          <h3 style={cardTitleStyle}>
                            <Briefcase size={18} />
                            Experience & Track Record
                          </h3>
                          <div style={infoGridStyle}>
                            <InfoItem label="Internship Experience" value={profile.internshipExperience || "Not specified"} />
                            <InfoItem label="LinkedIn Profile" value={profile.linkedInProfile || "Not specified"} />
                            <InfoItem label="Reference Contact" value={profile.referenceContact || "Not specified"} />
                          </div>
                        </div>

                        {profile.workExperiences && profile.workExperiences.length > 0 && (
                          <div style={infoCardStyle}>
                            <h3 style={cardTitleStyle}>
                              <Briefcase size={18} />
                              Work Experience
                            </h3>
                            <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "#5D4037", lineHeight: 1.8 }}>
                              {formatListItems(profile.workExperiences)}
                            </ul>
                          </div>
                        )}

                        {profile.volunteerWork && profile.volunteerWork.length > 0 && (
                          <div style={infoCardStyle}>
                            <h3 style={cardTitleStyle}>
                              <Users size={18} />
                              Volunteer Work
                            </h3>
                            <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "#5D4037", lineHeight: 1.8 }}>
                              {formatListItems(profile.volunteerWork)}
                            </ul>
                          </div>
                        )}

                        {profile.academicProjects && profile.academicProjects.length > 0 && (
                          <div style={infoCardStyle}>
                            <h3 style={cardTitleStyle}>
                              <BookOpen size={18} />
                              Academic Projects
                            </h3>
                            <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "#5D4037", lineHeight: 1.8 }}>
                              {formatListItems(profile.academicProjects)}
                            </ul>
                          </div>
                        )}
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
                            {profile.email && <InfoItem label="Email" value={profile.email} />}
                            {profile.phone && <InfoItem label="Phone" value={profile.phone} />}
                            <InfoItem label="Location" value={formatArray(profile.cities)} />
                          </div>
                          <div style={noteStyle}>
                            Contact details are shared after a connection is confirmed.
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
const headerLeftStyle = { flex: 1 }
const modalTitleStyle = { fontSize: "24px", fontWeight: "700", margin: 0 }
const metaRowStyle = { display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }
const badgeStyle = { borderRadius: "20px", fontSize: "14px", fontWeight: "500" }
const locationBadgeStyle = { display: "flex", alignItems: "center", gap: "4px", fontSize: "14px" }
const matchScoreStyle = { display: "flex", alignItems: "center", gap: "4px", background: "#2E7D32", padding: "4px 12px", borderRadius: "20px", fontSize: "14px", fontWeight: "500" }
const closeButtonStyle = { background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "8px", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }
const tabsContainerStyle = { display: "flex", background: "rgba(255,255,255,0.1)", padding: "0 24px" }
const tabStyle = { display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", background: "none", border: "none", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: "14px", fontWeight: "500", borderBottom: "3px solid transparent", transition: "all 0.2s ease" }
const activeTabStyle = { color: "white", borderBottom: "3px solid white", }

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

export default InternDetailsModal