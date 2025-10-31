"use client"
import { useState } from "react"
import { Users, ArrowRight, CheckCircle, Clock, Shield, FileText } from "lucide-react"

const ComplianceTab = () => {
  const colors = {
    darkBrown: "#372C27",
    mediumBrown: "#5D4037",
    lightBrown: "#8D6E63",
    accentGold: "#A67C52",
    offWhite: "#F5F2F0",
    cream: "#EFEBE9",
    lightTan: "#D7CCC8",
    darkText: "#2C2927",
    lightText: "#F5F2F0",
  }

  const styles = {
    container: {
      padding: "2rem 0",
    },
    header: {
      textAlign: "center",
      marginBottom: "3rem",
    },
    title: {
      fontSize: "clamp(2rem, 4vw, 2.5rem)",
      fontWeight: "800",
      background: `linear-gradient(135deg, ${colors.darkBrown} 0%, ${colors.mediumBrown} 100%)`,
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      color: "transparent",
      margin: "0 0 1rem 0",
      letterSpacing: "-1px",
    },
    subtitle: {
      fontSize: "clamp(1rem, 2vw, 1.2rem)",
      color: colors.mediumBrown,
      fontStyle: "italic",
      marginBottom: "1rem",
      fontWeight: 500,
    },
    description: {
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      color: colors.mediumBrown,
      lineHeight: "1.6",
      maxWidth: "800px",
      margin: "0 auto 2rem auto",
    },
    heroSection: {
      background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`,
      borderRadius: "1.5rem",
      padding: "3rem 2rem",
      marginBottom: "3rem",
      border: `2px solid ${colors.accentGold}`,
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
    },
    heroTitle: {
      fontSize: "clamp(1.5rem, 3vw, 2rem)",
      fontWeight: "700",
      color: colors.darkBrown,
      marginBottom: "1rem",
      textAlign: "center",
    },
    heroDescription: {
      fontSize: "clamp(1rem, 1.5vw, 1.1rem)",
      color: colors.mediumBrown,
      lineHeight: "1.7",
      maxWidth: "700px",
      margin: "0 auto 2rem auto",
      textAlign: "center",
    },
    benefitsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "1.5rem",
      marginTop: "2rem",
    },
    benefitCard: {
      background: colors.offWhite,
      padding: "1.5rem",
      borderRadius: "1rem",
      border: `1px solid ${colors.lightTan}`,
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
    },
    benefitIcon: {
      width: "48px",
      height: "48px",
      borderRadius: "12px",
      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: colors.lightText,
    },
    benefitTitle: {
      fontSize: "1.1rem",
      fontWeight: "700",
      color: colors.darkBrown,
      margin: 0,
    },
    benefitDescription: {
      fontSize: "0.95rem",
      color: colors.mediumBrown,
      lineHeight: "1.5",
      margin: 0,
    },
    servicesSection: {
      background: colors.offWhite,
      borderRadius: "1.5rem",
      padding: "2.5rem 2rem",
      marginBottom: "2rem",
      border: `1px solid ${colors.lightTan}`,
    },
    servicesTitle: {
      fontSize: "clamp(1.3rem, 2.5vw, 1.7rem)",
      fontWeight: "700",
      color: colors.darkBrown,
      marginBottom: "1.5rem",
      textAlign: "center",
    },
    servicesList: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "1rem",
      marginTop: "1.5rem",
    },
    serviceItem: {
      display: "flex",
      alignItems: "flex-start",
      gap: "1rem",
      padding: "1rem",
      background: colors.cream,
      borderRadius: "0.75rem",
      border: `1px solid ${colors.lightTan}`,
    },
    serviceIcon: {
      flexShrink: 0,
      color: colors.accentGold,
    },
    serviceText: {
      fontSize: "0.95rem",
      color: colors.darkText,
      lineHeight: "1.5",
      margin: 0,
    },
    ctaSection: {
      background: `linear-gradient(135deg, ${colors.darkBrown} 0%, ${colors.mediumBrown} 100%)`,
      borderRadius: "1.5rem",
      padding: "3rem 2rem",
      textAlign: "center",
      color: colors.lightText,
      boxShadow: "0 12px 40px rgba(0, 0, 0, 0.3)",
    },
    ctaTitle: {
      fontSize: "clamp(1.5rem, 3vw, 2rem)",
      fontWeight: "700",
      marginBottom: "1rem",
    },
    ctaDescription: {
      fontSize: "clamp(1rem, 1.5vw, 1.1rem)",
      marginBottom: "2rem",
      opacity: 0.95,
      maxWidth: "600px",
      margin: "0 auto 2rem auto",
    },
    ctaButton: {
      background: colors.offWhite,
      color: colors.darkBrown,
      border: "none",
      padding: "1.25rem 2.5rem",
      borderRadius: "0.75rem",
      fontWeight: "700",
      fontSize: "1.1rem",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: "0.75rem",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
  }

  const benefits = [
    {
      icon: <Shield size={24} />,
      title: "Verified Credentials",
      description: "Professional verification of all your business registrations and compliance documentation",
    },
    {
      icon: <FileText size={24} />,
      title: "Complete Profile",
      description: "Build a comprehensive business profile that funders and corporates want to see",
    },
    {
      icon: <Clock size={24} />,
      title: "Fast Processing",
      description: "Quick verification process to get your compliance score up and running",
    },
    {
      icon: <CheckCircle size={24} />,
      title: "Funder Ready",
      description: "Meet the compliance standards that funders and corporates require",
    },
  ]

  const requirements = [
    "CIPC business registration",
    "SARS tax compliance status",
    "VAT registration (where applicable)",
    "Verified business address & Director IDs",
    "Ownership and shareholding structure",
    "B-BBEE certification",
    "UIF & COIDA registration (for growth/mature businesses)",
    "POPIA compliance documentation",
    "Complete business profile",
  ]

  const handleApply = () => {
    window.location.href = "/applications/product/request-overview"
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Boost Compliance Score</h2>
        <p style={styles.subtitle}>Get all your essential business requirements verified</p>
        <p style={styles.description}>
          Funders and corporates want to see that you're playing by the rules — legally registered, tax compliant, and
          aligned with South Africa's regulatory requirements. Get your compliance verified and boost your score.
        </p>
      </div>

      <div style={styles.heroSection}>
        <h3 style={styles.heroTitle}>Why Verify Your Compliance?</h3>
        <p style={styles.heroDescription}>
          A strong compliance score opens doors to funding opportunities and corporate partnerships. Our verification
          process ensures all your essential business requirements are in order and properly documented.
        </p>
        
        <div style={styles.benefitsGrid}>
          {benefits.map((benefit, index) => (
            <div key={index} style={styles.benefitCard}>
              <div style={styles.benefitIcon}>
                {benefit.icon}
              </div>
              <div>
                <h4 style={styles.benefitTitle}>{benefit.title}</h4>
                <p style={styles.benefitDescription}>{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.servicesSection}>
        <h3 style={styles.servicesTitle}>Essential Requirements Verified</h3>
        <div style={styles.servicesList}>
          {requirements.map((requirement, index) => (
            <div key={index} style={styles.serviceItem}>
              <CheckCircle size={20} style={styles.serviceIcon} />
              <p style={styles.serviceText}>{requirement}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.ctaSection}>
        <Users size={48} style={{ margin: "0 auto 1.5rem auto" }} />
        <h3 style={styles.ctaTitle}>Ready to Boost Your Compliance Score?</h3>
        <p style={styles.ctaDescription}>
          Complete your compliance verification and unlock access to funders and corporate partners who value businesses that meet all regulatory requirements.
        </p>
        <button
          style={styles.ctaButton}
          onClick={handleApply}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-3px)"
            e.target.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.3)"
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)"
            e.target.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.2)"
          }}
        >
          Apply for Verification
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  )
}

export default ComplianceTab