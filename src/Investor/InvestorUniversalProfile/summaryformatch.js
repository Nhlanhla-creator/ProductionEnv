"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Edit, Printer, ExternalLink, FileText, Mail, MapPin, Calendar, Briefcase, User, Heart, Share2, MessageSquare, X } from "lucide-react"

const InvestorProfileSummary = ({ data = {}, match = 85, onEdit = () => {} }) => {
  const [expandedSections, setExpandedSections] = useState({
    entityOverview: false,
    productsServices: true, // Show investment offerings by default
    ownershipManagement: false,
    contactDetails: false,
    legalCompliance: false,
    howDidYouHear: false,
    declarationConsent: false,
  })

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const renderDocumentLink = (url, label = "View Document") => {
    if (!url) return <span style={{ color: '#a67c52' }}>No document</span>
    
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer" 
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          color: '#a67c52',
          textDecoration: 'none',
          fontSize: '14px',
          transition: 'color 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.color = '#7d5a50'}
        onMouseLeave={(e) => e.target.style.color = '#a67c52'}
      >
        <FileText size={14} />
        <span>{label}</span>
        <ExternalLink size={12} />
      </a>
    )
  }

  const formatArray = (arr) => {
    if (!arr || !arr.length) return "Not specified"
    return arr.join(", ")
  }

  const handlePrint = () => {
    window.print()
  }

  // Sample data for demo
  const sampleData = {
    entityOverview: {
      tradingName: "Venture Capital Partners",
      registeredName: "VCP Investment Holdings Ltd",
      registrationNumber: "12345678",
      entityType: "Private Investment Fund",
      entitySize: "Large",
      employeeCount: "50-100",
      yearsInOperation: "12",
      location: "Cape Town, South Africa",
      investmentType: "Venture Capital",
      businessDescription: "Leading venture capital firm focused on technology startups in emerging markets with a track record of successful exits and portfolio companies.",
      economicSectors: ["Technology", "Healthcare", "Fintech", "E-commerce"]
    },
    productsServices: {
      funds: [
        {
          name: "Tech Innovation Fund I",
          size: "R500M",
          type: ["Venture Capital"],
          stages: ["Series A", "Series B"],
          ticketMin: "R5M",
          ticketMax: "R50M",
          sectors: ["AI/ML", "Fintech", "SaaS", "Mobility"],
          support: ["Strategic Guidance", "Network Access", "Board Participation", "Follow-on Funding"]
        },
        {
          name: "Healthcare Growth Fund",
          size: "R300M",
          type: ["Growth Capital"],
          stages: ["Growth", "Expansion"],
          ticketMin: "R10M",
          ticketMax: "R75M",
          sectors: ["Digital Health", "Biotech", "Medical Devices"],
          support: ["Operational Support", "Market Access", "Regulatory Guidance"]
        }
      ],
      fundMandate: "https://example.com/mandate.pdf",
      fundProspectus: "https://example.com/prospectus.pdf"
    }
  }

  const profileData = { ...sampleData, ...data }

const styles = {
  profileContainer: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#faf7f2',
    minHeight: '100vh'
  },
  profileHeaderCard: {
    backgroundColor: 'white',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(125, 90, 80, 0.1)',
    marginBottom: '24px',
    border: '1px solid #f0e6d9'
  },
  profileBanner: {
    height: '200px',
    background: 'linear-gradient(135deg, #a67c52 0%, #7d5a50 50%, #c8b6a6 100%)',
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: '60px'
  },
  profileAvatar: {
    position: 'relative'
  },
  avatarPlaceholder: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    backgroundColor: '#7d5a50',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '4px solid white',
    boxShadow: '0 4px 16px rgba(125, 90, 80, 0.2)'
  },
  matchBadge: {
    position: 'absolute',
    top: '-10px',
    right: '-10px',
    backgroundColor: '#22c55e',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)'
  },
  profileInfo: {
    padding: '30px',
    textAlign: 'center'
  },
  profileTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#4a352f',
    marginBottom: '12px',
    margin: '0 0 12px 0'
  },
  profileMeta: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    marginBottom: '16px',
    flexWrap: 'wrap'
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#7d5a50',
    fontSize: '14px'
  },
  profileBio: {
    color: '#4a352f',
    fontSize: '16px',
    lineHeight: '1.6',
    marginBottom: '24px',
    maxWidth: '600px',
    margin: '0 auto 24px auto'
  },
  profileStats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '40px',
    flexWrap: 'wrap'
  },
  statItem: {
    textAlign: 'center'
  },
  statValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: '700',
    color: '#a67c52',
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: '14px',
    color: '#7d5a50',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  profileContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(125, 90, 80, 0.08)',
    border: '1px solid #f0e6d9'
  },
  sectionHeader: {
    padding: '20px 24px',
    backgroundColor: '#f0e6d9',
    borderBottom: '1px solid #c8b6a6',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  sectionHeaderExpanded: {
    backgroundColor: '#c8b6a6'
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '20px',
    fontWeight: '600',
    color: '#4a352f',
    margin: 0
  },
  sectionContent: {
    padding: '24px'
  },
  fundsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '20px'
  },
  fundCard: {
    border: '2px solid #f0e6d9',
    borderRadius: '12px',
    padding: '20px',
    backgroundColor: '#faf7f2',
    transition: 'all 0.3s ease'
  },
  fundHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  fundName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#4a352f',
    margin: 0
  },
  fundSize: {
    backgroundColor: '#a67c52',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500'
  },
  fundDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px'
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  detailLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#7d5a50'
  },
  detailValue: {
    fontSize: '14px',
    color: '#4a352f'
  },
  sectorsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px'
  },
  sectorsTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '4px'
  },
  sectorTag: {
    backgroundColor: '#c8b6a6',
    color: '#4a352f',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500'
  },
  supportTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '4px'
  },
  supportTag: {
    backgroundColor: '#a67c52',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500'
  },
  fundActions: {
    display: 'flex',
    gap: '12px'
  },
  fundActionBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    border: `2px solid #a67c52`,
    backgroundColor: 'transparent',
    color: '#a67c52',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flex: 1
  },
  fundActionBtnPrimary: {
    backgroundColor: '#a67c52',
    color: 'white'
  },
  documentsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px'
  },
  documentItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#faf7f2',
    borderRadius: '8px',
    border: '1px solid #f0e6d9'
  },
  documentTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#4a352f',
    margin: '0 0 4px 0'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#7d5a50'
  },
  profileFooterActions: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    marginTop: '32px',
    flexWrap: 'wrap'
  },
  footerBtn: {
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  footerBtnSecondary: {
    backgroundColor: 'transparent',
    color: '#7d5a50',
    border: '2px solid #c8b6a6'
  },
  footerBtnPrimary: {
    backgroundColor: '#a67c52',
    color: 'white',
    border: '2px solid #7d5a50'
  }
}

  return (
    <div style={styles.profileContainer}>
      {/* Profile Header Card (Tinder-like) */}
      <div style={styles.profileHeaderCard}>
        <div style={styles.profileBanner}>
          <div style={styles.profileAvatar}>
            <div style={styles.avatarPlaceholder}>
              <User size={40} color="white" />
            </div>
            <div style={styles.matchBadge}>
              {match}% Match
            </div>
          </div>
        </div>

        <div style={styles.profileInfo}>
          <h1 style={styles.profileTitle}>
            {profileData.entityOverview?.tradingName || profileData.entityOverview?.registeredName || "Investor Profile"}
          </h1>
          
          <div style={styles.profileMeta}>
            <span style={styles.metaItem}>
              <Briefcase size={14} />
              {profileData.entityOverview?.entityType || "Investment Firm"}
            </span>
            <span style={styles.metaItem}>
              <MapPin size={14} />
              {profileData.entityOverview?.location || "Location not specified"}
            </span>
          </div>

          <p style={styles.profileBio}>
            {profileData.entityOverview?.businessDescription || "No description provided"}
          </p>

          <div style={styles.profileStats}>
            <div style={styles.statItem}>
              <span style={styles.statValue}>
                {profileData.productsServices?.funds?.length || 0}
              </span>
              <span style={styles.statLabel}>Funds</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>
                {profileData.entityOverview?.yearsInOperation || "N/A"}
              </span>
              <span style={styles.statLabel}>Years Active</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>
                {profileData.entityOverview?.employeeCount || "N/A"}
              </span>
              <span style={styles.statLabel}>Team</span>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Offerings (Main Content) */}
      <div style={styles.profileContent}>
        <div style={styles.sectionCard}>
          <div 
            style={{
              ...styles.sectionHeader,
              ...(expandedSections.productsServices ? styles.sectionHeaderExpanded : {})
            }}
            onClick={() => toggleSection("productsServices")}
          >
            <h2 style={styles.sectionTitle}>
              <Briefcase size={18} style={{ marginRight: '8px' }} />
              Investment Offerings
            </h2>
            {expandedSections.productsServices ? <ChevronUp size={20} color="#4a352f" /> : <ChevronDown size={20} color="#4a352f" />}
          </div>

          {expandedSections.productsServices && (
            <div style={styles.sectionContent}>
              {profileData.productsServices?.funds?.length > 0 ? (
                <div style={styles.fundsGrid}>
                  {profileData.productsServices.funds.map((fund, index) => (
                    <div 
                      key={index} 
                      style={styles.fundCard}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(166, 124, 82, 0.15)'
                        e.currentTarget.style.borderColor = '#a67c52'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                        e.currentTarget.style.borderColor = '#f0e6d9'
                      }}
                    >
                      <div style={styles.fundHeader}>
                        <h3 style={styles.fundName}>{fund.name || `Fund ${index + 1}`}</h3>
                        <span style={styles.fundSize}>{fund.size || "Size not specified"}</span>
                      </div>

                      <div style={styles.fundDetails}>
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>Type:</span>
                          <span style={styles.detailValue}>{formatArray(fund.type)}</span>
                        </div>
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>Stages:</span>
                          <span style={styles.detailValue}>{formatArray(fund.stages)}</span>
                        </div>
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>Ticket Size:</span>
                          <span style={styles.detailValue}>
                            {fund.ticketMin || "N/A"} - {fund.ticketMax || "N/A"}
                          </span>
                        </div>
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>Sectors:</span>
                          <div style={styles.sectorsTags}>
                            {fund.sectors?.map((sector, i) => (
                              <span key={i} style={styles.sectorTag}>{sector}</span>
                            )) || <span style={styles.detailValue}>Not specified</span>}
                          </div>
                        </div>
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>Support Offered:</span>
                          <div style={styles.supportTags}>
                            {fund.support?.map((item, i) => (
                              <span key={i} style={styles.supportTag}>{item}</span>
                            )) || <span style={styles.detailValue}>Not specified</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <p>No investment offerings listed</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Entity Overview Section */}
        <div style={styles.sectionCard}>
          <div 
            style={{
              ...styles.sectionHeader,
              ...(expandedSections.entityOverview ? styles.sectionHeaderExpanded : {})
            }}
            onClick={() => toggleSection("entityOverview")}
          >
            <h2 style={styles.sectionTitle}>
              <User size={18} style={{ marginRight: '8px' }} />
              Company Details
            </h2>
            {expandedSections.entityOverview ? <ChevronUp size={20} color="#4a352f" /> : <ChevronDown size={20} color="#4a352f" />}
          </div>

          {expandedSections.entityOverview && (
            <div style={styles.sectionContent}>
              <div style={styles.sectorsGrid}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Registered Name:</span>
                  <span style={styles.detailValue}>{profileData.entityOverview?.registeredName || "Not provided"}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Registration Number:</span>
                  <span style={styles.detailValue}>{profileData.entityOverview?.registrationNumber || "Not provided"}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Entity Type:</span>
                  <span style={styles.detailValue}>{profileData.entityOverview?.entityType || "Not provided"}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Entity Size:</span>
                  <span style={styles.detailValue}>{profileData.entityOverview?.entitySize || "Not provided"}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Employees:</span>
                  <span style={styles.detailValue}>{profileData.entityOverview?.employeeCount || "Not provided"}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Years Active:</span>
                  <span style={styles.detailValue}>{profileData.entityOverview?.yearsInOperation || "Not provided"}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Location:</span>
                  <span style={styles.detailValue}>{profileData.entityOverview?.location || "Not provided"}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Investment Type:</span>
                  <span style={styles.detailValue}>{profileData.entityOverview?.investmentType || "Not provided"}</span>
                </div>
                <div style={{...styles.detailItem, gridColumn: '1 / -1'}}>
                  <span style={styles.detailLabel}>Economic Sectors:</span>
                  <div style={styles.sectorsTags}>
                    {profileData.entityOverview?.economicSectors?.map((sector, i) => (
                      <span key={i} style={styles.sectorTag}>{sector}</span>
                    )) || <span style={styles.detailValue}>Not provided</span>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Documents Section */}
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <FileText size={18} style={{ marginRight: '8px' }} />
              Key Documents
            </h2>
          </div>
          <div style={styles.sectionContent}>
            <div style={styles.documentsGrid}>
              <div style={styles.documentItem}>
                <FileText size={24} color="#a67c52" />
                <div>
                  <h4 style={styles.documentTitle}>Fund Mandate</h4>
                  {renderDocumentLink(profileData.productsServices?.fundMandate)}
                </div>
              </div>
              <div style={styles.documentItem}>
                <FileText size={24} color="#a67c52" />
                <div>
                  <h4 style={styles.documentTitle}>Prospectus</h4>
                  {renderDocumentLink(profileData.productsServices?.fundProspectus)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={styles.profileFooterActions}>
          <button 
            style={{
              ...styles.footerBtn,
              ...styles.footerBtnSecondary
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f0e6d9'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent'
            }}
            onClick={handlePrint}
          >
            <Printer size={16} />
            Print Profile
          </button>
          <button 
            style={{
              ...styles.footerBtn,
              ...styles.footerBtnPrimary
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#7d5a50'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#a67c52'
            }}
            onClick={onEdit}
          >
            <MessageSquare size={16} />
            Contact Investor
          </button>
        </div>
      </div>
    </div>
  )
}

export default InvestorProfileSummary