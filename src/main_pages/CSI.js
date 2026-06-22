import React, { useState } from 'react';
import Header from "./Header";
import Footer from "./Footer";
import { 
  FiCalendar, 
  FiMapPin, 
  FiClock, 
  FiMail, 
  FiBook,
  FiCheckCircle,
  FiArrowRight,
  FiUserPlus,
  FiPlus,
  FiMinus,
  FiTarget,
  FiTrendingUp,
  FiHeart,
  FiZap,
  FiAward
} from 'react-icons/fi';
import { 
  FaGraduationCap, 
  FaBuilding, 
  FaHandshake, 
  FaRocket,
  FaMedal,
  FaUsers,
  FaBriefcase,
  FaCertificate
} from 'react-icons/fa';

const CharmSchool = () => {
  const [openAccordion, setOpenAccordion] = useState(null);
  const [activeTab, setActiveTab] = useState('graduates');

  const toggleAccordion = (index) => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

  // FAQ Data
  const faqData = {
    graduates: [
      { 
        q: "What is the duration of the Charm School programme?", 
        a: "The Charm School is a comprehensive 2-day immersive programme designed to transform your professional presence and soft skills." 
      },
      { 
        q: "Will I receive a certificate after completion?", 
        a: "Yes, all participants receive a Charm School Certificate — Your Degree in Charm, which enhances your professional profile." 
      },
      { 
        q: "How will this help me get a job?", 
        a: "The programme makes you stand out in interviews, helps you make strong first impressions, and positions you as a standout candidate for SME placement through BIG Marketplace." 
      },
      { 
        q: "What kind of support will I receive after the programme?", 
        a: "You'll receive ongoing access to our networking directory, mentorship opportunities, and priority placement support through BIG Marketplace." 
      },
      { 
        q: "Is there any cost to attend?", 
        a: "The Charm School is offered as part of our CSI initiative. Please contact us for specific details about programme fees and sponsorship opportunities." 
      },
    ],
    smes: [
      { 
        q: "How are Charm School graduates different?", 
        a: "Charm School graduates arrive polished, confident, and ready to contribute immediately. They have professional communication skills, emotional intelligence, and workplace readiness that reduces onboarding time." 
      },
      { 
        q: "How can I access Charm-Certified graduates?", 
        a: "SMEs registered on BIG Marketplace can select from pre-trained graduates, sponsor specific candidates, or participate in our talent matching programme." 
      },
      { 
        q: "What is the cost benefit for my SME?", 
        a: "By hiring Charm-Certified graduates, you reduce onboarding costs, improve team productivity, and gain professionally trained staff who integrate faster and require less hand-holding." 
      },
      { 
        q: "Can I request specific training for graduates?", 
        a: "Yes, we offer customised training packages for SMEs looking to develop graduates with specific skill sets aligned with their business needs." 
      },
      { 
        q: "How quickly can graduates start adding value?", 
        a: "Charm-Certified graduates are designed to add value from Day One, with most businesses reporting noticeable contributions within the first week of employment." 
      },
    ],
    sponsors: [
      { 
        q: "What are the sponsorship tiers available?", 
        a: "We offer various sponsorship packages tailored to different budget levels and impact goals. Contact us for detailed information about our Bronze, Silver, Gold, and Platinum sponsorship tiers." 
      },
      { 
        q: "How is my sponsorship impact measured?", 
        a: "We provide comprehensive impact reports showing graduate employment rates, SME growth metrics, and social return on investment. You'll see exactly how your contribution creates change." 
      },
      { 
        q: "Can I sponsor specific graduates or regions?", 
        a: "Yes, we offer targeted sponsorship options where you can support graduates from specific regions, universities, or demographic backgrounds based on your CSI objectives." 
      },
      { 
        q: "What branding opportunities are included?", 
        a: "Sponsors receive branding on all Charm School materials, recognition during events, inclusion in PR campaigns, and opportunities for employee engagement through mentorship programmes." 
      },
      { 
        q: "How does sponsorship strengthen SMEs?", 
        a: "Your sponsorship creates a pipeline of work-ready talent that SMEs can access, helping them scale faster while reducing their recruitment and training costs." 
      },
    ],
  };

  // What You'll Learn Data
  const learnTopics = {
    graduates: [
      'Executive Presence & Personal Branding - Carry yourself with professionalism and confidence',
      'Public Speaking & Confident Communication - Never shy away from voicing your thoughts or presenting your ideas',
      'Emotional Intelligence & Leadership Skills - Manage pressure, collaborate well, and handle conflict effectively',
      'Networking & Relationship Building - Learn how to build meaningful professional connections',
      'Professional Etiquette & Workplace Readiness - Understand the expectations and behaviours that employers value'
    ],
    smes: [
      'Executive Presence - Represent your SME with confidence',
      'Communication & Public Speaking - Handle clients, suppliers, and internal teams professionally',
      'Leadership Skills & EI - Show maturity and initiative in a small, agile team',
      'Professional Conduct - Understand workplace behaviour, expectations, and accountability',
      'Problem-Solving & Collaboration - Work well with others and manage pressure effectively'
    ],
    sponsors: [
      'Direct, measurable social impact aligned with CSI/CSR objectives',
      'Strengthen high-growth SMEs with work-ready talent',
      'Create employment pathways for young professionals',
      'Brand visibility & social good credibility',
      'Access to BIG Marketplace\'s talent ecosystem',
      'Impact reports showing outcomes, employment, and SME placements'
    ]
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#F5F0E8',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    
    // Partnership Section
    partnershipSection: {
      width: '100%',
      backgroundColor: 'white',
      padding: '2rem 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderTop: '1px solid #EAE2D8',
    },
    partnershipContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2rem',
      maxWidth: '1200px',
      width: '100%',
      padding: '0 1rem',
      flexWrap: 'wrap',
    },
    partnershipLabel: {
      fontSize: '0.9rem',
      fontWeight: '700',
      color: '#7C4D2A',
      textTransform: 'uppercase',
      letterSpacing: '0.15em',
    },
    floconsultLogo: {
      height: '80px',
      width: 'auto',
      maxWidth: '200px',
    },
    
    // Hero Section
    heroSection: {
      position: 'relative',
      minHeight: '70vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      background: `linear-gradient(135deg, #1C1410 0%, #3D2A1A 100%)`,
    },
    heroBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: "url('/backgroundNew.avif')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      opacity: 0.15,
    },
    heroOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    heroContent: {
      position: 'relative',
      zIndex: 10,
      textAlign: 'left',
      color: 'white',
      padding: '0 1.5rem',
      maxWidth: '1200px',
      width: '100%',
      margin: '0 auto',
    },
    heroBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      background: 'rgba(212,137,74,0.2)',
      border: '1px solid rgba(212,137,74,0.3)',
      borderRadius: '30px',
      padding: '6px 16px 6px 10px',
      marginBottom: '20px',
    },
    heroBadgeDot: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: '#D4894A',
      display: 'inline-block',
    },
    heroBadgeText: {
      color: '#D4894A',
      fontSize: '0.75rem',
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
    heroTitle: {
      fontSize: 'clamp(2.5rem, 5vw, 4rem)',
      fontWeight: 900,
      marginBottom: '1.5rem',
      lineHeight: '1.1',
      letterSpacing: '-0.02em',
    },
    heroTitleAccent: {
      color: '#D4894A',
    },
    heroSubtitle: {
      fontSize: 'clamp(1.2rem, 2vw, 1.8rem)',
      marginBottom: '1rem',
      lineHeight: '1.4',
      fontWeight: 600,
      color: '#D3C1B2',
    },
    heroDescription: {
      fontSize: 'clamp(1rem, 1.2vw, 1.2rem)',
      marginBottom: '2rem',
      lineHeight: '1.7',
      maxWidth: '650px',
      color: 'rgba(255,255,255,0.7)',
    },
    heroButtons: {
      display: 'flex',
      gap: '1rem',
      flexWrap: 'wrap',
    },
    heroButtonPrimary: {
      backgroundColor: '#D4894A',
      color: 'white',
      padding: '1rem 2rem',
      borderRadius: '50px',
      fontSize: '1rem',
      fontWeight: 700,
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.75rem',
      boxShadow: '0 4px 20px rgba(212, 137, 74, 0.3)',
    },
    heroButtonSecondary: {
      backgroundColor: 'transparent',
      color: 'white',
      padding: '1rem 2rem',
      borderRadius: '50px',
      fontSize: '1rem',
      fontWeight: 600,
      border: '1px solid rgba(255,255,255,0.2)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.75rem',
      backdropFilter: 'blur(8px)',
    },
    
    // Section Wrapper
    section: {
      padding: '4rem 1.5rem',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    sectionDark: {
      padding: '4rem 1.5rem',
      backgroundColor: '#1C1410',
    },
    sectionLight: {
      padding: '4rem 1.5rem',
      backgroundColor: '#F5F0E8',
    },
    sectionWhite: {
      padding: '4rem 1.5rem',
      backgroundColor: '#FFFFFF',
    },
    sectionTitle: {
      fontSize: 'clamp(1.8rem, 3vw, 2.8rem)',
      fontWeight: 800,
      textAlign: 'center',
      marginBottom: '0.5rem',
      letterSpacing: '-0.01em',
      color: '#1C1410',
    },
    sectionTitleWhite: {
      fontSize: 'clamp(1.8rem, 3vw, 2.8rem)',
      fontWeight: 800,
      textAlign: 'center',
      marginBottom: '0.5rem',
      letterSpacing: '-0.01em',
      color: 'white',
    },
    sectionSubtitle: {
      textAlign: 'center',
      color: '#7A6A5E',
      fontSize: '1.1rem',
      maxWidth: '700px',
      margin: '0 auto 2.5rem',
      lineHeight: '1.7',
    },
    sectionSubtitleWhite: {
      textAlign: 'center',
      color: 'rgba(255,255,255,0.6)',
      fontSize: '1.1rem',
      maxWidth: '700px',
      margin: '0 auto 2.5rem',
      lineHeight: '1.7',
    },
    
    // What Is Charm School
    whatIsGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '3rem',
      alignItems: 'center',
    },
    whatIsImage: {
      width: '100%',
      height: '400px',
      objectFit: 'cover',
      borderRadius: '16px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    },
    whatIsContent: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.2rem',
    },
    whatIsText: {
      fontSize: '1.05rem',
      lineHeight: '1.8',
      color: '#372C27',
    },
    whatIsHighlight: {
      backgroundColor: 'rgba(212, 137, 74, 0.08)',
      borderLeft: '4px solid #D4894A',
      padding: '1.2rem 1.5rem',
      borderRadius: '0 8px 8px 0',
      fontSize: '1.05rem',
      lineHeight: '1.7',
      color: '#1C1410',
    },
    
    // Stats
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '1.5rem',
      marginTop: '2rem',
    },
    statCard: {
      textAlign: 'center',
      padding: '1.5rem',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    },
    statNumber: {
      fontSize: '2.5rem',
      fontWeight: 800,
      color: '#7C4D2A',
    },
    statLabel: {
      fontSize: '0.9rem',
      color: '#7A6A5E',
      marginTop: '0.3rem',
    },
    
    // Tab Navigation
    tabNavigation: {
      display: 'flex',
      gap: '1rem',
      justifyContent: 'center',
      marginBottom: '2.5rem',
      flexWrap: 'wrap',
    },
    tabButton: {
      padding: '0.75rem 1.5rem',
      backgroundColor: 'white',
      color: '#7C4D2A',
      border: '2px solid #EAE2D8',
      borderRadius: '50px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.9rem',
    },
    tabButtonActive: {
      padding: '0.75rem 1.5rem',
      backgroundColor: '#7C4D2A',
      color: 'white',
      border: '2px solid #7C4D2A',
      borderRadius: '50px',
      fontWeight: 600,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.9rem',
      boxShadow: '0 4px 15px rgba(124, 77, 42, 0.25)',
    },
    
    // Tab Content
    tabContent: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '2.5rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    },
    tabTitle: {
      fontSize: '1.5rem',
      fontWeight: 700,
      color: '#1C1410',
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
    },
    tabDescription: {
      fontSize: '1rem',
      color: '#7A6A5E',
      lineHeight: '1.7',
      marginBottom: '1.5rem',
    },
    benefitList: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '0.8rem',
    },
    benefitItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
      fontSize: '0.95rem',
      color: '#372C27',
      padding: '0.5rem 0',
      lineHeight: '1.5',
    },
    benefitIcon: {
      width: '20px',
      height: '20px',
      backgroundColor: '#7C4D2A',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '0.6rem',
      flexShrink: 0,
      marginTop: '2px',
    },
    tabHighlight: {
      marginTop: '1.5rem',
      padding: '1rem 1.5rem',
      background: '#F5F0E8',
      borderRadius: '8px',
      borderLeft: '4px solid #7C4D2A',
    },
    tabHighlightText: {
      margin: 0,
      fontSize: '0.95rem',
      color: '#372C27',
    },
    
    // Toolkit Section
    toolkitSection: {
      marginTop: '2rem',
      padding: '1.5rem',
      backgroundColor: '#FAF7F2',
      borderRadius: '12px',
      border: '1px solid #EAE2D8',
    },
    toolkitTitle: {
      fontSize: '1.1rem',
      fontWeight: 700,
      color: '#1C1410',
      marginBottom: '0.8rem',
    },
    toolkitList: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '0.5rem',
    },
    toolkitItem: {
      fontSize: '0.95rem',
      color: '#372C27',
      padding: '0.3rem 0',
    },
    
    // Event Info
    eventCard: {
      backgroundColor: '#f3f4f6',
      padding: '1.5rem',
      borderRadius: '12px',
      marginTop: '1.5rem',
    },
    eventTitle: {
      fontSize: '1.2rem',
      fontWeight: '700',
      color: '#1C1410',
      marginBottom: '0.8rem',
    },
    eventDetail: {
      fontSize: '1rem',
      marginBottom: '0.5rem',
      color: '#372C27',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    eventLabel: {
      fontWeight: '600',
    },
    
    // CTA Section
    ctaSection: {
      background: `linear-gradient(135deg, #7C4D2A, #D4894A)`,
      borderRadius: '16px',
      padding: '3rem 2.5rem',
      textAlign: 'center',
      marginTop: '2rem',
    },
    ctaTitle: {
      fontSize: 'clamp(1.5rem, 2.5vw, 2.2rem)',
      fontWeight: 800,
      color: 'white',
      marginBottom: '0.5rem',
    },
    ctaText: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: '1.05rem',
      maxWidth: '600px',
      margin: '0 auto 1.5rem',
      lineHeight: '1.7',
    },
    ctaButton: {
      backgroundColor: 'white',
      color: '#7C4D2A',
      padding: '1rem 2.5rem',
      borderRadius: '50px',
      fontSize: '1rem',
      fontWeight: 700,
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.75rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    },
    
    // FAQ
    faqGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '2rem',
      marginTop: '2rem',
    },
    faqColumn: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.8rem',
    },
    faqHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      marginBottom: '0.5rem',
    },
    faqTitle: {
      fontSize: '1.1rem',
      fontWeight: 700,
      color: '#1C1410',
    },
    accordionItem: {
      backgroundColor: 'white',
      borderRadius: '10px',
      border: '1px solid #EAE2D8',
      overflow: 'hidden',
    },
    accordionButton: {
      width: '100%',
      padding: '1rem 1.2rem',
      backgroundColor: 'transparent',
      color: '#1C1410',
      border: 'none',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      cursor: 'pointer',
      fontSize: '0.95rem',
      fontWeight: 600,
      textAlign: 'left',
      transition: 'all 0.3s ease',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    accordionContent: {
      padding: '0 1.2rem 1.2rem',
      color: '#7A6A5E',
      fontSize: '0.95rem',
      lineHeight: '1.7',
    },
    accordionIcon: {
      fontSize: '1.2rem',
      color: '#7C4D2A',
      flexShrink: 0,
    },
    
    // Sponsors FAQ - Full width
    sponsorsFaq: {
      marginTop: '2rem',
    },
    sponsorsFaqGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1rem',
    },

    // Button Group
    buttonGroup: {
      display: 'flex',
      gap: '1rem',
      flexWrap: 'wrap',
      marginTop: '1rem',
    },
    primaryButton: {
      backgroundColor: '#7C4D2A',
      color: 'white',
      padding: '0.75rem 1.5rem',
      borderRadius: '8px',
      fontWeight: '600',
      border: '2px solid #7C4D2A',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
  };

  return (
    <div style={styles.container}>
      <Header />
      
      {/* HERO SECTION */}
      <section style={styles.heroSection}>
        <div style={styles.heroBackground}></div>
        <div style={styles.heroOverlay}></div>
        <div style={styles.heroContent}>
          <div style={styles.heroBadge}>
            <span style={styles.heroBadgeDot} />
            <span style={styles.heroBadgeText}>Charm School</span>
          </div>
          
          <h1 style={styles.heroTitle}>
            Charm. Confidence. <br /><span style={styles.heroTitleAccent}>Competence.</span>
          </h1>
          
          <p style={styles.heroSubtitle}>
            Preparing Work-Ready Talent to Power South Africa's SMEs
          </p>
          
          <p style={styles.heroDescription}>
            The Charm School develops confident, capable graduates who are ready to contribute from Day One — 
            strengthening SMEs, empowering young professionals, and enabling sponsors to drive real economic impact.
          </p>
          
          <div style={styles.heroButtons}>
            <button 
              style={styles.heroButtonPrimary}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#C07A3A';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#D4894A';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <FiUserPlus size={18} />
              Register Now
            </button>
            <button 
              style={styles.heroButtonSecondary}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <FiBook size={18} />
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* WHAT IS CHARM SCHOOL */}
      <section style={styles.sectionLight}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>What is <span style={{ color: '#7C4D2A' }}>Charm School</span>?</h2>
          <p style={styles.sectionSubtitle}>
            A high-impact CSI programme that bridges the gap between education and employability
          </p>
          
          <div style={styles.whatIsGrid}>
            <div>
              <img 
                src="/image1.avif" 
                alt="Charm School" 
                style={styles.whatIsImage}
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=400&fit=crop&crop=center";
                }}
              />
            </div>
            <div style={styles.whatIsContent}>
              <p style={styles.whatIsText}>
                <strong>Charm School is more than training — it's an ecosystem solution</strong> for talent development, SME capacity, and social impact.
              </p>
              <p style={styles.whatIsText}>
                By equipping graduates with essential soft skills, professional presence, and workplace readiness, 
                we create a pipeline of polished, confident young professionals prepared to thrive in fast-paced SME environments.
              </p>
              <div style={styles.whatIsHighlight}>
                <strong>💡 The BIG Charm School</strong> — graduates gain employability, SMEs gain ready-to-perform talent, 
                and sponsors play a vital role in building stronger businesses, reducing youth unemployment, and 
                accelerating South Africa's economic growth.
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={styles.statsGrid}>
            {[
              { number: '500+', label: 'Graduates Trained' },
              { number: '200+', label: 'SMEs Matched' },
              { number: '85%', label: 'Employability Rate' },
              { number: '50+', label: 'Sponsors & Partners' },
            ].map((stat, index) => (
              <div key={index} style={styles.statCard}>
                <div style={styles.statNumber}>{stat.number}</div>
                <div style={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Event Info - Important */}
          <div style={styles.eventCard}>
            <h3 style={styles.eventTitle}>📅 Upcoming Charm School Event</h3>
            <p style={styles.eventDetail}>
              <FiCalendar size={18} />
              <span><span style={styles.eventLabel}>Date:</span> Coming Soon</span>
            </p>
            <p style={styles.eventDetail}>
              <FiMapPin size={18} />
              <span><span style={styles.eventLabel}>Location:</span> Johannesburg, South Africa</span>
            </p>
            <p style={styles.eventDetail}>
              <FiClock size={18} />
              <span><span style={styles.eventLabel}>Duration:</span> 2-Day Immersive Programme</span>
            </p>
            <div style={styles.buttonGroup}>
              <button 
                style={styles.primaryButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#5A3420';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#7C4D2A';
                }}
              >
                <FiUserPlus size={18} />
                Register Now
              </button>
              <button 
                style={{...styles.primaryButton, backgroundColor: 'transparent', color: '#7C4D2A'}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F5F0E8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <FiMail size={18} />
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR - TAB SECTION */}
      <section style={styles.sectionWhite}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Who Is <span style={{ color: '#7C4D2A' }}>Charm School</span> For?</h2>
          <p style={styles.sectionSubtitle}>
            Whether you're a graduate looking to stand out, an SME seeking talent, or a sponsor wanting to make an impact — Charm School is for you.
          </p>

          <div style={styles.tabNavigation}>
            <button 
              style={activeTab === 'graduates' ? styles.tabButtonActive : styles.tabButton}
              onClick={() => setActiveTab('graduates')}
            >
              <FaGraduationCap size={16} />
              For Graduates
            </button>
            <button 
              style={activeTab === 'smes' ? styles.tabButtonActive : styles.tabButton}
              onClick={() => setActiveTab('smes')}
            >
              <FaBuilding size={16} />
              For SMEs
            </button>
            <button 
              style={activeTab === 'sponsors' ? styles.tabButtonActive : styles.tabButton}
              onClick={() => setActiveTab('sponsors')}
            >
              <FaHandshake size={16} />
              For Sponsors
            </button>
          </div>

          <div style={styles.tabContent}>
            {/* GRADUATES TAB */}
            {activeTab === 'graduates' && (
              <>
                <h3 style={styles.tabTitle}>
                  <FaGraduationCap size={24} color="#7C4D2A" />
                  Unlock Confidence & Career Readiness
                </h3>
                <p style={styles.tabDescription}>
                  The BIG Charm School helps you stand out, show up with confidence, and thrive in any professional setting. 
                  Whether you're entering the job market or stepping into the next phase of your career, this programme gives you 
                  the soft skills and personal power that set you apart.
                </p>
                
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1C1410', marginBottom: '0.8rem' }}>
                  What You Will Learn:
                </h4>
                <div style={styles.benefitList}>
                  {learnTopics.graduates.map((item, index) => (
                    <div key={index} style={styles.benefitItem}>
                      <div style={styles.benefitIcon}>✓</div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div style={styles.toolkitSection}>
                  <h4 style={styles.toolkitTitle}>🎓 Your Exclusive Charm School Toolkit</h4>
                  <p style={{ fontSize: '0.95rem', color: '#7A6A5E', marginBottom: '0.8rem' }}>
                    Every participant receives:
                  </p>
                  <div style={styles.toolkitList}>
                    <div style={styles.toolkitItem}>• Digital Handbook</div>
                    <div style={styles.toolkitItem}>• Networking Directory</div>
                    <div style={styles.toolkitItem}>• Customisable Templates</div>
                    <div style={styles.toolkitItem}>• Mentorship 101 Guide</div>
                    <div style={styles.toolkitItem}>• Charm School Certificate</div>
                  </div>
                </div>

                <div style={styles.tabHighlight}>
                  <p style={styles.tabHighlightText}>
                    <strong>Why Join?</strong> Stand out in interviews • Make strong first impressions • 
                    Build confidence in workplace settings • Position yourself for SME placement • 
                    Gain a prestigious certification
                  </p>
                </div>
              </>
            )}

            {/* SMEs TAB */}
            {activeTab === 'smes' && (
              <>
                <h3 style={styles.tabTitle}>
                  <FaBuilding size={24} color="#7C4D2A" />
                  Access Work-Ready Graduates
                </h3>
                <p style={styles.tabDescription}>
                  Growing SMEs don't just need talent — they need graduates who arrive polished, confident, and ready to contribute immediately. 
                  Charm School prepares young professionals to thrive in fast-paced SME environments.
                </p>
                
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1C1410', marginBottom: '0.8rem' }}>
                  A Charm-Certified Graduate Brings:
                </h4>
                <div style={styles.benefitList}>
                  {[
                    'Professional communication & executive presence',
                    'Emotional intelligence & adaptability',
                    'Customer service mindset & leadership readiness',
                    'Strong work ethic & confidence with clients',
                    'Reduced onboarding time & costs',
                    'Stronger team cohesion & productivity'
                  ].map((item, index) => (
                    <div key={index} style={styles.benefitItem}>
                      <div style={styles.benefitIcon}>✓</div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div style={styles.tabHighlight}>
                  <p style={styles.tabHighlightText}>
                    <strong>💼 They integrate faster.</strong> They need less hand-holding. 
                    They embody professionalism from the very first day.
                  </p>
                </div>

                <div style={styles.toolkitSection}>
                  <h4 style={styles.toolkitTitle}>🏢 Get Access to the Charm-Certified Talent Pool</h4>
                  <p style={{ fontSize: '0.95rem', color: '#7A6A5E', marginBottom: '0.5rem' }}>
                    SMEs on BIG Marketplace can:
                  </p>
                  <div style={styles.toolkitList}>
                    <div style={styles.toolkitItem}>• Select pre-trained graduates</div>
                    <div style={styles.toolkitItem}>• Sponsor specific candidates</div>
                    <div style={styles.toolkitItem}>• Participate in workshops</div>
                    <div style={styles.toolkitItem}>• Build stronger teams</div>
                  </div>
                </div>
              </>
            )}

            {/* SPONSORS TAB */}
            {activeTab === 'sponsors' && (
              <>
                <h3 style={styles.tabTitle}>
                  <FaHandshake size={24} color="#7C4D2A" />
                  Drive Measurable CSI/ESD Impact
                </h3>
                <p style={styles.tabDescription}>
                  Sponsor a graduate. Strengthen SMEs. Create real impact. Your sponsorship helps a graduate gain confidence, 
                  professionalism, and skills that dramatically increase their employability — funding a career, not just training.
                </p>
                
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1C1410', marginBottom: '0.8rem' }}>
                  Why Sponsor Charm School?
                </h4>
                <div style={styles.benefitList}>
                  {learnTopics.sponsors.map((item, index) => (
                    <div key={index} style={styles.benefitItem}>
                      <div style={styles.benefitIcon}>✓</div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div style={styles.toolkitSection}>
                  <h4 style={styles.toolkitTitle}>📊 What Your Sponsorship Funds</h4>
                  <p style={{ fontSize: '0.95rem', color: '#7A6A5E', marginBottom: '0.5rem' }}>
                    Each sponsored graduate receives:
                  </p>
                  <div style={styles.toolkitList}>
                    <div style={styles.toolkitItem}>• 2-day immersive training</div>
                    <div style={styles.toolkitItem}>• Graduation certification</div>
                    <div style={styles.toolkitItem}>• Digital handbook & templates</div>
                    <div style={styles.toolkitItem}>• Professional development toolkit</div>
                    <div style={styles.toolkitItem}>• Access to BIG Marketplace</div>
                    <div style={styles.toolkitItem}>• Priority SME placement support</div>
                  </div>
                </div>

                <div style={styles.tabHighlight}>
                  <p style={styles.tabHighlightText}>
                    <strong>🎯 Sponsorship = Impact at Three Levels:</strong> 
                    The Graduate (confidence & employability) • The SME (work-ready talent) • 
                    The Economy (job creation & stronger SMEs)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

    
      {/* FAQ SECTION */}
      <section style={styles.sectionLight}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Frequently Asked <span style={{ color: '#7C4D2A' }}>Questions</span></h2>
          <p style={styles.sectionSubtitle}>
            Find answers to the most common questions about Charm School
          </p>

          {/* Graduates & SMEs FAQ */}
          <div style={styles.faqGrid}>
            {/* Graduates FAQ */}
            <div>
              <div style={styles.faqHeader}>
                <FaGraduationCap size={22} color="#7C4D2A" />
                <h3 style={styles.faqTitle}>For Graduates</h3>
              </div>
              {faqData.graduates.map((item, index) => (
                <div key={index} style={styles.accordionItem}>
                  <button 
                    style={styles.accordionButton}
                    onClick={() => toggleAccordion(`grad-${index}`)}
                  >
                    <span>{item.q}</span>
                    <span style={styles.accordionIcon}>
                      {openAccordion === `grad-${index}` ? <FiMinus size={18} /> : <FiPlus size={18} />}
                    </span>
                  </button>
                  {openAccordion === `grad-${index}` && (
                    <div style={styles.accordionContent}>{item.a}</div>
                  )}
                </div>
              ))}
            </div>

            {/* SMEs FAQ */}
            <div>
              <div style={styles.faqHeader}>
                <FaBuilding size={22} color="#7C4D2A" />
                <h3 style={styles.faqTitle}>For SMEs</h3>
              </div>
              {faqData.smes.map((item, index) => (
                <div key={index} style={styles.accordionItem}>
                  <button 
                    style={styles.accordionButton}
                    onClick={() => toggleAccordion(`sme-${index}`)}
                  >
                    <span>{item.q}</span>
                    <span style={styles.accordionIcon}>
                      {openAccordion === `sme-${index}` ? <FiMinus size={18} /> : <FiPlus size={18} />}
                    </span>
                  </button>
                  {openAccordion === `sme-${index}` && (
                    <div style={styles.accordionContent}>{item.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sponsors FAQ - Full Width */}
          <div style={styles.sponsorsFaq}>
            <div style={styles.faqHeader}>
              <FaHandshake size={22} color="#7C4D2A" />
              <h3 style={styles.faqTitle}>For Sponsors</h3>
            </div>
            <div style={styles.sponsorsFaqGrid}>
              {faqData.sponsors.map((item, index) => (
                <div key={index} style={styles.accordionItem}>
                  <button 
                    style={styles.accordionButton}
                    onClick={() => toggleAccordion(`sponsor-${index}`)}
                  >
                    <span>{item.q}</span>
                    <span style={styles.accordionIcon}>
                      {openAccordion === `sponsor-${index}` ? <FiMinus size={18} /> : <FiPlus size={18} />}
                    </span>
                  </button>
                  {openAccordion === `sponsor-${index}` && (
                    <div style={styles.accordionContent}>{item.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Section */}
      <section style={styles.partnershipSection}>
        <div style={styles.partnershipContainer}>
          <span style={styles.partnershipLabel}>IN PARTNERSHIP WITH</span>
          <img 
            src="./flo.png" 
            alt="Floconsult" 
            style={styles.floconsultLogo}
          />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CharmSchool;