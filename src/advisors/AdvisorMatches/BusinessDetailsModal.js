"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Building, Users, Mail, MapPin, Award, DollarSign, Package, Shield, X } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../../firebaseConfig"

/* ════════════════════════════════════════════════════════════════════════════
   Business Name pop-up.

   Deliberately a copy of AdvisorDetailsModal's structure and style objects —
   same overlay, same header gradient, same tab strip, same InfoItem rows — so
   the Business table's name pop-up and the Advisor table's name pop-up read as
   one component to a user moving between the two tables. Only the fetch and
   the tab contents differ.

   Props mirror AdvisorDetailsModal exactly:
     business  { businessId, businessName, finalScore? }
     isOpen    boolean
     onClose   () => void

   businessId is the universalProfiles document id — which on the advisor-side
   table is the row's `smeId`, not its `id`.
   ════════════════════════════════════════════════════════════════════════ */

const BusinessDetailsModal = ({ business, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("overview")
  const [mounted, setMounted] = useState(false)
  const [fullProfile, setFullProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const bodyRef = useRef(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Reset to the first tab each time a different business is opened, otherwise
  // the modal reopens on whichever tab was last used for a different row.
  useEffect(() => {
    if (isOpen) setActiveTab("overview")
  }, [isOpen, business?.businessId])

  useEffect(() => {
    if (!isOpen || !business?.businessId) return

    const fetchProfile = async () => {
      setLoadingProfile(true)
      try {
        const profileDoc = await getDoc(doc(db, "universalProfiles", business.businessId))
        if (profileDoc.exists()) {
          const data = profileDoc.data()
          const entity = data.entityOverview || {}
          const contact = data.contactDetails || {}
          const legal = data.legalCompliance || {}
          const ps = data.productsServices || {}
          const financial = data.financialOverview || {}

          const offeringLabels = {
            products: "Products only",
            services: "Services only",
            both: "Both products and services",
          }

          setFullProfile({
            name: entity.registeredName || business.businessName,
            tradingName: entity.tradingName || "",
            registrationNumber: entity.registrationNumber || "",
            entityType: entity.entityType || "",
            legalStructure: entity.legalStructure || "",
            entitySize: entity.entitySize || "",
            yearsInOperation: entity.yearsInOperation || "",
            operationStage: entity.operationStage || "",
            description: entity.businessDescription || "",
            sectors: entity.economicSectors || [],
            countries: entity.operatingCountries || [],
            provinces: entity.operatingProvinces || [],

            offeringType: offeringLabels[ps.offeringType] || "",
            targetMarket: ps.targetMarket || "",
            deliveryModes: ps.deliveryModes || [],
            productCategories: (ps.productCategories || []).flatMap((c) => c.categories || []),
            serviceCategories: (ps.serviceCategories || []).flatMap((c) => c.categories || []),

            taxNumber: legal.taxNumber || "",
            vatNumber: legal.vatNumber || "",
            bbbeeLevel: legal.bbbeeLevel || "",
            pendingLegalJudgments: legal.pendingLegalJudgments || "",
            seekingFunding: financial.seekingFunding || "",
            supportTypeNeeded: financial.supportTypeNeeded || [],

            contactName: `${contact.contactTitle || ""} ${contact.contactName || ""}`.trim(),
            position: contact.position || "",
            email: contact.email || "",
            phone: contact.businessPhone || contact.mobile || "",
            address: contact.physicalAddress || "",
          })
        } else {
          setFullProfile({ name: business.businessName })
        }
      } catch (error) {
        console.error("Error fetching business profile:", error)
      } finally {
        setLoadingProfile(false)
      }
    }

    fetchProfile()
  }, [isOpen, business?.businessId, business?.businessName])

  if (!isOpen || !business || !mounted) return null

  const profile = fullProfile || { name: business.businessName }

  const formatArray = (arr) => {
    if (!arr || arr.length === 0) return "Not specified"
    return arr.join(" • ")
  }

  const location = (() => {
    const parts = [...(profile.provinces || []), ...(profile.countries || [])]
    return parts.length ? parts.join(", ") : ""
  })()

  const tabs = [
    { id: "overview", label: "Overview", icon: Building },
    { id: "offering", label: "Products & Services", icon: Package },
    { id: "compliance", label: "Compliance", icon: Shield },
    { id: "contact", label: "Contact", icon: Mail },
  ]

  return createPortal(
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header - fixed */}
        <div style={modalHeaderStyle}>
          <div style={headerContentStyle}>
            <div style={businessHeaderStyle}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <h2 style={businessNameStyle}>{profile.name}</h2>
                {business.finalScore !== undefined && (
                  <span style={matchScoreStyle}>{Math.round(business.finalScore)}% Match</span>
                )}
              </div>
              <div style={businessMetaStyle}>
                {profile.entityType && <span style={entityTypeStyle}>{profile.entityType}</span>}
                {location && (
                  <span style={locationStyle}>
                    <MapPin size={14} />
                    {location}
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
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{ ...tabStyle, ...(activeTab === tab.id ? activeTabStyle : {}) }}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Body - scrollable */}
        <div ref={bodyRef} style={modalBodyStyle}>
          <div style={modalBodyInnerStyle}>
            {loadingProfile ? (
              <div style={{ textAlign: "center", padding: "40px" }}>Loading profile...</div>
            ) : (
              <>
                {/* ── OVERVIEW ── */}
                {activeTab === "overview" && (
                  <div style={tabContentStyle}>
                    <div style={gridStyle}>
                      <div style={infoCardStyle}>
                        <h3 style={cardTitleStyle}>
                          <Building size={18} />
                          Entity Information
                        </h3>
                        <div style={infoGridStyle}>
                          <InfoItem label="Registered Name" value={profile.name} />
                          <InfoItem label="Trading Name" value={profile.tradingName || "Same as registered name"} />
                          <InfoItem label="Registration Number" value={profile.registrationNumber} />
                          <InfoItem label="Entity Type" value={profile.entityType} />
                          <InfoItem label="Legal Structure" value={profile.legalStructure} />
                          <InfoItem label="Entity Size" value={profile.entitySize} />
                          <InfoItem label="Years in Operation" value={profile.yearsInOperation} />
                          <InfoItem label="Operation Stage" value={profile.operationStage} />
                          <InfoItem label="Economic Sectors" value={formatArray(profile.sectors)} />
                          <InfoItem label="Countries of Operation" value={formatArray(profile.countries)} />
                        </div>
                      </div>

                      {profile.description && (
                        <div style={infoCardStyle}>
                          <h3 style={cardTitleStyle}>
                            <Users size={18} />
                            Business Description
                          </h3>
                          <p style={{ margin: 0, lineHeight: 1.5, color: "#5D4037" }}>{profile.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── PRODUCTS & SERVICES ── */}
                {activeTab === "offering" && (
                  <div style={tabContentStyle}>
                    <div style={gridStyle}>
                      <div style={infoCardStyle}>
                        <h3 style={cardTitleStyle}>
                          <Package size={18} />
                          What the Business Offers
                        </h3>
                        <div style={infoGridStyle}>
                          <InfoItem label="Offering Type" value={profile.offeringType} />
                          <InfoItem label="Product Categories" value={formatArray(profile.productCategories)} />
                          <InfoItem label="Service Categories" value={formatArray(profile.serviceCategories)} />
                          <InfoItem label="Delivery Modes" value={formatArray(profile.deliveryModes)} />
                        </div>
                      </div>

                      {profile.targetMarket && (
                        <div style={infoCardStyle}>
                          <h3 style={cardTitleStyle}>
                            <Award size={18} />
                            Target Market
                          </h3>
                          <p style={{ margin: 0, lineHeight: 1.5, color: "#5D4037" }}>{profile.targetMarket}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── COMPLIANCE ── */}
                {activeTab === "compliance" && (
                  <div style={tabContentStyle}>
                    <div style={gridStyle}>
                      <div style={infoCardStyle}>
                        <h3 style={cardTitleStyle}>
                          <Shield size={18} />
                          Legal & Compliance
                        </h3>
                        <div style={infoGridStyle}>
                          <InfoItem label="Tax Number" value={profile.taxNumber} />
                          <InfoItem label="VAT Number" value={profile.vatNumber} />
                          <InfoItem label="B-BBEE Level" value={profile.bbbeeLevel} />
                          <InfoItem label="Pending Legal Judgments" value={profile.pendingLegalJudgments} />
                        </div>
                      </div>

                      <div style={infoCardStyle}>
                        <h3 style={cardTitleStyle}>
                          <DollarSign size={18} />
                          Support Intent
                        </h3>
                        <div style={infoGridStyle}>
                          <InfoItem label="Seeking Funding" value={profile.seekingFunding} />
                          <InfoItem label="Support Type Needed" value={formatArray(profile.supportTypeNeeded)} />
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
                          <InfoItem label="Primary Contact" value={profile.contactName} />
                          <InfoItem label="Position" value={profile.position} />
                          {profile.email && <InfoItem label="Email" value={profile.email} />}
                          {profile.phone && <InfoItem label="Phone" value={profile.phone} />}
                          <InfoItem label="Physical Address" value={profile.address} />
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
  )
}

const InfoItem = ({ label, value }) => (
  <div style={infoItemStyle}>
    <strong>{label}:</strong>
    <span>{value || "Not specified"}</span>
  </div>
)

/* ── Styles: copied verbatim from AdvisorDetailsModal so the two pop-ups are
   visually identical. Change one, change both. ─────────────────────────── */

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
  padding: "20px",
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
  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
}

const modalHeaderStyle = {
  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
  color: "white",
  flexShrink: 0,
}

const headerContentStyle = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "24px" }
const businessHeaderStyle = { flex: 1 }
const businessNameStyle = { fontSize: "24px", fontWeight: "700" }
const businessMetaStyle = { display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }
const entityTypeStyle = { borderRadius: "20px", fontSize: "14px", fontWeight: "500" }
const locationStyle = { display: "flex", alignItems: "center", gap: "4px", fontSize: "14px" }
const matchScoreStyle = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  background: "#2E7D32",
  padding: "4px 12px",
  borderRadius: "20px",
  fontSize: "14px",
  fontWeight: "500",
}
const closeButtonStyle = {
  background: "rgba(255,255,255,0.2)",
  border: "none",
  borderRadius: "8px",
  padding: "8px",
  color: "white",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}
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
  borderBottom: "3px solid transparent",
  transition: "all 0.2s ease",
}

const activeTabStyle = { color: "white", borderBottom: "3px solid white" }

const modalBodyStyle = { flex: 1, overflowY: "auto", minHeight: 0 }
const modalBodyInnerStyle = { padding: "24px 24px 40px 24px" }
const tabContentStyle = { width: "100%" }
const gridStyle = { display: "flex", flexDirection: "column", gap: "20px" }

const infoCardStyle = {
  background: "#FEFCFA",
  border: "1px solid #E8D5C4",
  borderRadius: "8px",
  padding: "20px",
}

const cardTitleStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  margin: "0 0 16px 0",
  fontSize: "18px",
  fontWeight: "600",
  color: "#5D2A0A",
}

const infoGridStyle = { display: "flex", flexDirection: "column", gap: "12px" }

const infoItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  borderBottom: "1px solid #F0E6DA",
  paddingBottom: "8px",
}

const noteStyle = {
  marginTop: "16px",
  padding: "12px",
  background: "rgba(166,124,82,0.05)",
  borderRadius: "6px",
  border: "1px solid #E8D5C4",
  fontSize: "0.8rem",
  color: "#8D6E63",
  fontStyle: "italic",
}

export default BusinessDetailsModal