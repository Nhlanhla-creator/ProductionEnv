import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { 
  FaShieldAlt, 
  FaCheckCircle, 
  FaUserTie, 
  FaBuilding, 
  FaMoneyBillWave, 
  FaChartLine, 
  FaArrowRight, 
  FaRocket,
  FaStar,
  FaUsers,
  FaFileAlt,
  FaSearch,
  FaGlobe,
  FaAward,
  FaLightbulb,
  FaChevronDown,
  FaChevronUp,
  FaTimes,
  FaCertificate,
  FaHandshake,
  FaClipboardCheck,
  FaCrown,
  FaBriefcase,
  FaBalanceScale,
  FaInfoCircle,
  FaTrendingUp,
  FaAlertCircle,
  FaPalette,
  FaFileContract,
  FaCalculator,
  FaClipboardList,
  FaUserCog,
  FaToolbox,
  FaUsersCog,
  FaExternalLinkAlt,
  FaDesktop,
  FaMobileAlt,
  FaChartPie,
  FaBook,
  FaPenFancy,
  FaSitemap,
  FaCogs,
  FaUserGraduate,
  FaHandHoldingUsd,
  FaLayerGroup
} from 'react-icons/fa';

const BIGScorePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('score');
  const [showPopup, setShowPopup] = useState(false);
  const [popupContent, setPopupContent] = useState(null);
  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [showSampleReport, setShowSampleReport] = useState(false);
  const [showAboutScore, setShowAboutScore] = useState(false);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setBannerLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const colors = {
    primary: '#7C4D2A',
    secondary: '#A0703E',
    amber: '#D4894A',
    light: '#F5F0E8',
    cream: '#FAF7F2',
    white: '#FFFFFF',
    border: '#EAE2D8',
    muted: '#7A6A5E',
    dark: '#1C1410',
    brown: '#5D432C',
    brownLight: '#8A6D52',
    brownDark: '#372C27',
    green: '#1E7A47',
    greenBg: '#E4F4EB',
    orange: '#E8831A',
    orangeBg: '#FEF3E8',
    red: '#BE3B2A',
    redBg: '#FDE8E5',
    blue: '#1D5FAA',
    blueBg: '#E6EFF9',
  };

  const toggleSection = (id) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getScoreLevel = (score) => {
    if (!score && score !== 0) return { level: "Calculating...", color: "#9E9E9E", description: "" };
    if (score >= 91) return { level: "Exceptional", color: "#1B5E20", description: "Your business is highly prepared for major opportunities" };
    if (score >= 81) return { level: "Strong", color: "#4CAF50", description: "Well-positioned for scaling and funding" };
    if (score >= 61) return { level: "Progressing", color: "#D4894A", description: "On track with solid foundations" };
    if (score >= 41) return { level: "Foundational", color: "#BE3B2A", description: "Core building blocks are in place" };
    return { level: "Emerging", color: "#B71C1C", description: "Early stages of readiness" };
  };

  const getProgressBarColor = (score) => {
    if (score > 90) return "#1B5E20";
    if (score >= 81) return "#4CAF50";
    if (score >= 61) return "#D4894A";
    if (score >= 41) return "#BE3B2A";
    return "#B71C1C";
  };

  const scoreData = {
    bigScore: {
      title: "The BIG SCORE",
      description: "The Score That Earns You Trust — Before You Even Pitch",
      overall: {
        components: [
          { label: "Compliance score", pct: 29, weight: 28, color: colors.red },
          { label: "Legitimacy score", pct: 90, weight: 13, color: colors.green },
          { label: "Leadership & Governance score", pct: 58, weight: 10, color: colors.orange },
          { label: "Operational Strength score", pct: 70, weight: 14, color: colors.primary },
          { label: "Capital appeal score", pct: 45, weight: 35, color: colors.amber },
        ],
        total: 52
      },
      components: [
        {
          id: 'compliance',
          title: "Compliance Score",
          icon: <FaShieldAlt size={24} />,
          color: colors.red,
          description: "Whether a business meets core legal, regulatory, and tax requirements.",
          detailedDescription: "🧱 This is the foundation of your BIG Score — no compliance, no credibility.",
          calculationMethod: "Our AI analyzes official documents, government records, and compliance certifications to verify your business's legal standing.",
          score: 29,
          weight: 28,
          weightedScore: 8,
          weightings: {
            seed: { value: "20%", description: "Focus on basic legal compliance" },
            growth: { value: "15%", description: "Expanded regulatory requirements" },
            maturity: { value: "15%", description: "Full compliance expected" }
          },
          scoreInterpretation: [
            { range: "91-100%", level: "Fully Compliant", description: "Ready for all opportunities" },
            { range: "81-90%", level: "Highly Compliant", description: "Minor gaps to address" },
            { range: "61-80%", level: "Mostly Compliant", description: "Some documentation needed" },
            { range: "41-60%", level: "Partially Compliant", description: "Significant gaps present" },
            { range: "0-40%", level: "Non-Compliant", description: "Substantial work required" }
          ],
          subComponents: [
            {
              title: "Required Documents",
              description: "Documents verified",
              items: [
                { label: "Company Registration Certificate", weight: "15%", status: "missing" },
                { label: "SARS Tax Clearance", weight: "15%", status: "missing" },
                { label: "B-BBEE Certification", weight: "15%", status: "verified" },
                { label: "COIDA Registration", weight: "5%", status: "missing" },
                { label: "Business Bank Account", weight: "15%", status: "missing" },
                { label: "Share Register", weight: "10%", status: "missing" },
                { label: "Director IDs", weight: "10%", status: "verified" },
                { label: "Proof of Address", weight: "5%", status: "missing" },
                { label: "Industry Licenses", weight: "5%", status: "missing" },
                { label: "Complete business profile", weight: "10%", status: "verified" }
              ]
            }
          ]
        },
        {
          id: 'legitimacy',
          title: "Legitimacy Score",
          icon: <FaCheckCircle size={24} />,
          color: colors.green,
          description: "How professionally and credibly your business presents itself in the market.",
          detailedDescription: "🎯 The legitimacy score assesses how professionally and credibly a business presents itself in the market — beyond just legal compliance. It focuses on brand presence, digital identity, and operational transparency that help build trust with funders, partners, and clients.",
          calculationMethod: "We evaluate professional website presence, digital identity, track record, and third-party validations.",
          score: 90,
          weight: 13,
          weightedScore: 12,
          weightings: {
            seed: { value: "36%", description: "Foundational business identity" },
            growth: { value: "29%", description: "Digital presence & discoverability" },
            maturity: { value: "21%", description: "Track record indicators" }
          },
          scoreInterpretation: [
            { range: "91-100%", level: "Market Leader", description: "Exceptional credibility and strong market presence" },
            { range: "81-90%", level: "Trusted Brand", description: "Well-established professional identity" },
            { range: "61-80%", level: "Emerging Force", description: "Good foundations with room for refinement" },
            { range: "41-60%", level: "Building Credibility", description: "Key elements exist but gaps remain" },
            { range: "0-40%", level: "Early Stage Identity", description: "Foundational improvements needed" }
          ],
          subComponents: [
            {
              title: "Foundational Business Identity",
              weight: "28%",
              description: "Professional website, business email, logo, and company materials",
              items: ["Professional Website", "Domain Email", "Branded Materials", "Registered Address"]
            },
            {
              title: "Digital Presence & Discoverability",
              weight: "22%",
              description: "Social media presence and online discoverability",
              items: ["Website Presence", "Social Media Activity", "Search Visibility"]
            },
            {
              title: "Track Record Indicators",
              weight: "25%",
              description: "Years of operation, client portfolio, revenue history",
              items: ["Years in Operation", "Client Portfolio", "Revenue History"]
            },
            {
              title: "Third-Party Validations",
              weight: "25%",
              description: "Industry certifications, accreditations, and memberships",
              items: ["Industry Certifications", "Accreditations", "Compliance Certificates", "Industry Memberships"]
            }
          ]
        },
        {
          id: 'leadershipGovernance',
          title: "Leadership & Governance Score",
          icon: <FaUserTie size={24} />,
          color: colors.orange,
          description: "Can we trust the people and decision-making structures behind this business?",
          detailedDescription: "Leadership & Governance answers one question for a funder: can we trust the people and decision-making structures behind this business? It combines ownership structure, leadership quality, and governance maturity into a single comprehensive view.",
          calculationMethod: "We assess ownership structure, leadership credentials and behavior, and governance maturity across strategic planning, risk management, and policy frameworks.",
          score: 58,
          weight: 10,
          weightedScore: 6,
          weightings: {
            seed: { value: "25%", description: "Ownership & Structure" },
            growth: { value: "40%", description: "Leadership Quality" },
            maturity: { value: "35%", description: "Governance Maturity" }
          },
          scoreInterpretation: [
            { range: "91-100%", level: "Exceptional Governance", description: "Trusted people and robust decision-making structures" },
            { range: "81-90%", level: "Strong Leadership", description: "Well-established leadership and governance" },
            { range: "61-80%", level: "Developing", description: "Good foundations with room for growth" },
            { range: "41-60%", level: "Building", description: "Key elements exist but gaps remain" },
            { range: "0-40%", level: "Emerging", description: "Foundational improvements needed" }
          ],
          subComponents: [
            {
              title: "Ownership & Structure",
              weight: "25%",
              description: "Directors, shareholders and succession readiness",
              items: ["Board Composition", "Executive/Non-Executive Mix", "Decision Governance", "Advisory Structure", "Succession Readiness"]
            },
            {
              title: "Leadership Quality",
              weight: "40%",
              description: "Leadership credentials, structure, and behavior",
              items: [
                "Leadership Credentials (40%) - Founder experience, qualifications, industry expertise",
                "Leadership Structure (30%) - Team composition and hierarchy",
                "Leadership Behavior (30%) - Ambition, learning mindset, execution capability"
              ]
            },
            {
              title: "Governance Maturity",
              weight: "35%",
              description: "Board structure, policies, reporting, and risk management",
              items: [
                "Strategic Planning (25%) - Long-term vision and business plans",
                "Risk Management (15%) - Risk identification and mitigation",
                "Transparency and Reporting (15%) - Financial reporting and stakeholder communication",
                "Policies & Documentation (20%) - Essential business policies and frameworks"
              ]
            }
          ]
        },
        {
          id: 'operationalStrength',
          title: "Operational Strength Score",
          icon: <FaBuilding size={24} />,
          color: colors.primary,
          description: "Can this business reliably execute and deliver?",
          detailedDescription: "Operational Strength measures whether this business can reliably execute and deliver — supplier & continuity risk, premises & facilities, delivery reliability, and safety/compliance, drawn entirely from the Operations Overview form.",
          calculationMethod: "We assess supplier continuity risk, delivery reliability, safety compliance, and premises/facilities quality.",
          score: 70,
          weight: 14,
          weightedScore: 10,
          weightings: {
            seed: { value: "25%", description: "Supplier & Continuity Risk" },
            growth: { value: "30%", description: "Delivery (Productivity & Reliability)" },
            maturity: { value: "20%", description: "Safety (Risk & Compliance)" }
          },
          scoreInterpretation: [
            { range: "91-100%", level: "Operational Excellence", description: "Highly reliable and efficient operations" },
            { range: "81-90%", level: "Strong Operations", description: "Well-established operational capacity" },
            { range: "61-80%", level: "Developing Operations", description: "Good foundations with room for improvement" },
            { range: "41-60%", level: "Building Operations", description: "Key elements exist but gaps remain" },
            { range: "0-40%", level: "Emerging Operations", description: "Substantial operational improvements needed" }
          ],
          subComponents: [
            {
              title: "Supplier & Continuity Risk",
              weight: "25%",
              description: "Supplier reliability and business continuity",
              items: ["Supplier Diversity", "Continuity Planning", "Supply Chain Resilience"]
            },
            {
              title: "Delivery (Productivity & Reliability)",
              weight: "30%",
              description: "Productivity metrics and delivery reliability",
              items: ["Productivity Metrics", "Delivery Track Record", "Quality Control"]
            },
            {
              title: "Safety (Risk & Compliance)",
              weight: "20%",
              description: "Safety protocols and compliance",
              items: ["Safety Protocols", "Compliance Records", "Risk Mitigation"]
            },
            {
              title: "Premises & Facilities",
              weight: "25%",
              description: "Physical infrastructure and facilities",
              items: ["Facility Quality", "Infrastructure", "Operational Capacity"]
            }
          ]
        },
        {
          id: 'capitalAppeal',
          title: "Capital Appeal Score",
          icon: <FaMoneyBillWave size={24} />,
          color: colors.amber,
          description: "A business's ability to absorb, deploy, and return capital.",
          detailedDescription: "The Capital Appeal Score measures a business's ability to absorb, deploy, and return capital. It assesses financial strength and fundability. The fundability sub-component weights adapt automatically to your funding type (tier).",
          calculationMethod: "Financial statements are analyzed using machine learning models that compare your metrics with industry benchmarks. Fundability is assessed based on investment case strength, pitch readiness, and impact alignment.",
          score: 45,
          weight: 35,
          weightedScore: 16,
          weightings: {
            seed: { value: "40%", description: "Financial Strength" },
            growth: { value: "60%", description: "Fundability (when seeking funding)" },
            maturity: { value: "30%", description: "Financial Resilience & Efficiency (for serious funding)" }
          },
          scoreInterpretation: [
            { range: "91-100%", level: "Highly Fundable", description: "Exceptional investment opportunity" },
            { range: "81-90%", level: "Strong Investment Case", description: "Very attractive to funders" },
            { range: "61-80%", level: "Adequate Financial Base", description: "Moderate potential with some improvements" },
            { range: "41-60%", level: "Financial Vulnerabilities", description: "Significant improvements needed" },
            { range: "0-40%", level: "Weak Financial Foundation", description: "Fundamental changes required" }
          ],
          subComponents: [
            {
              title: "Financial Strength (40%)",
              weight: "40%",
              description: "Core signal of viability",
              items: [
                "Revenue & Profitability (30%) - Income statement trends",
                "Balance Sheet Strength (20%) - Assets, liabilities, and equity",
                "Financial Management & Systems (20%) - Accounting software and bookkeeping",
                "Financial Credibility & Compliance (20%) - Audits and insurance",
                "Debt & Liabilities Profile (10%) - Hidden risk exposure"
              ]
            },
            {
              title: "Fundability (60% - when seeking funding)",
              weight: "60%",
              description: "Trust + investor confidence (activated on funding application)",
              items: [
                "Investment Case Strength (25%) - Foundation of funding decision",
                "Pitch Readiness (10%) - Communication and presentation",
                "Impact & Mandate Alignment (10%) - ESG/SA funding alignment",
                "Creditworthiness (25%) - Risk filter",
                "Guarantees/Collateral (15%) - Debt funding collateral",
                "Financial Resilience & Efficiency (15%) - Solvency, liquidity, leverage"
              ]
            }
          ]
        }
      ]
    }
  };

  // Improvement Tools Data
  const improvementTools = [
    {
      category: "Legitimacy Tools",
      icon: <FaCheckCircle size={20} />,
      color: colors.secondary,
      description: "Build trust with professional branding and digital presence.",
      examples: "Logo design, Brand Board, Business Card Template, Email Signature, Company Brochure, Letterhead Design, Professional Website",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop&crop=center"
    },
    {
      category: "Compliance Templates",
      icon: <FaFileContract size={20} />,
      color: colors.red,
      description: "Meet legal and regulatory requirements with professional templates.",
      examples: "CIPC Registration, Ownership Structure, SARS Tax Registration, Director's Register, Labour Compliance, POPIA Compliance, B-BBEE Certification",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=200&fit=crop&crop=center"
    },
    {
      category: "Capital Appeal Tools",
      icon: <FaMoneyBillWave size={20} />,
      color: colors.amber,
      description: "Make your business attractive to investors and funders.",
      examples: "Financial Model Template, KPI Dashboard, Budgeting Guide, Baseline Establishment Course, Business Plan Template, Business Model Canvas",
      image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop&crop=center"
    },
    {
      category: "Leadership & Governance Tools",
      icon: <FaUserTie size={20} />,
      color: colors.orange,
      description: "Build proper structures and leadership frameworks.",
      examples: "Employee Code of Conduct, Leave Policy, Disciplinary Policy, Health & Safety Policy, Privacy Policy, Remote Work Policy, Conflict of Interest Policy, IP Protection, Performance Review Policy",
      image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=200&fit=crop&crop=center"
    },
    {
      category: "Operational Strength Tools",
      icon: <FaBuilding size={20} />,
      color: colors.primary,
      description: "Strengthen your ability to execute and deliver reliably.",
      examples: "Operational Checklist, Supplier Management Template, Quality Control Checklist, Business Continuity Plan, Performance Management Course",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=200&fit=crop&crop=center"
    },
    {
      category: "HR Templates",
      icon: <FaUsersCog size={20} />,
      color: colors.brown,
      description: "Streamline human resources with professional templates.",
      examples: "Employment Contract (Basic), NDA (Non-Disclosure Agreement), MOU (Memorandum of Understanding)",
      image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=200&fit=crop&crop=center"
    }
  ];

  const openPopup = (content) => {
    setPopupContent(content);
    setShowPopup(true);
    document.body.style.overflow = 'hidden';
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupContent(null);
    document.body.style.overflow = 'auto';
  };

  const ScoreCard = ({ component }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div
        style={{
          backgroundColor: colors.white,
          borderRadius: '16px',
          padding: isMobile ? '16px 14px' : '20px 18px',
          boxShadow: isHovered 
            ? '0 12px 40px rgba(28,20,16,0.15)' 
            : '0 4px 20px rgba(28,20,16,0.06)',
          borderTop: `4px solid ${component.color}`,
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => openPopup(component)}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '8px' : '10px',
          marginBottom: '8px'
        }}>
          <div style={{
            width: isMobile ? '36px' : '40px',
            height: isMobile ? '36px' : '40px',
            borderRadius: '10px',
            background: `${component.color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: component.color,
            flexShrink: 0,
          }}>
            {component.icon}
          </div>
          <h3 style={{
            fontSize: isMobile ? '0.78rem' : '0.85rem',
            fontWeight: 700,
            color: colors.dark,
            margin: 0,
            lineHeight: 1.2,
          }}>
            {component.title}
          </h3>
        </div>

        <p style={{
          fontSize: isMobile ? '0.72rem' : '0.78rem',
          color: colors.muted,
          lineHeight: 1.5,
          margin: '0 0 10px 0',
          flex: 1,
        }}>
          {component.description}
        </p>

        <div style={{
          display: 'flex',
          gap: '4px',
          flexWrap: 'wrap',
          marginBottom: '10px',
        }}>
          {Object.entries(component.weightings || {}).map(([key, val]) => (
            <div key={key} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: `${component.color}10`,
              padding: '2px 6px',
              borderRadius: '16px',
              fontSize: '0.55rem',
              fontWeight: 600,
              color: component.color,
            }}>
              <span>{key.charAt(0).toUpperCase() + key.slice(1)}: {val.value}</span>
            </div>
          ))}
        </div>

        <button
          style={{
            marginTop: 'auto',
            background: `linear-gradient(135deg, ${component.color}, ${component.color}dd)`,
            color: colors.white,
            border: 'none',
            borderRadius: '8px',
            padding: isMobile ? '6px 12px' : '8px 14px',
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 4px 15px ${component.color}40`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onClick={(e) => {
            e.stopPropagation();
            openPopup(component);
          }}
        >
          Learn More <FaArrowRight size={10} />
        </button>
      </div>
    );
  };

  // Sample Report Modal
  const SampleReportModal = () => {
    const scoreLevel = getScoreLevel(52);
    const breakdown = [
      { name: "Compliance score", score: 29, weight: 28, weightedScore: 8, color: colors.red },
      { name: "Legitimacy score", score: 90, weight: 13, weightedScore: 12, color: colors.green },
      { name: "Leadership & Governance score", score: 58, weight: 10, weightedScore: 6, color: colors.orange },
      { name: "Operational Strength score", score: 70, weight: 14, weightedScore: 10, color: colors.primary },
      { name: "Capital appeal score", score: 45, weight: 35, weightedScore: 16, color: colors.amber },
    ];

    return (
      <div
        style={{
          position: "fixed",
          top: "0",
          left: "0",
          right: "0",
          bottom: "0",
          backgroundColor: "rgba(28,20,16,0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: "999999",
          padding: "20px",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowSampleReport(false);
            document.body.style.overflow = 'auto';
          }
        }}
      >
        <div
          style={{
            position: "relative",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
            zIndex: "999999",
            maxHeight: "90vh",
            overflowY: "auto",
            width: "90%",
            maxWidth: "600px",
            border: "1px solid #EAE2D8",
            animation: "fadeInUp 0.3s ease-out",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setShowSampleReport(false);
              document.body.style.overflow = 'auto';
            }}
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              background: "transparent",
              border: "none",
              fontSize: "22px",
              cursor: "pointer",
              color: "#7A6A5E",
              zIndex: "999999",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#F5F0E8";
              e.currentTarget.style.color = "#1C1410";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#7A6A5E";
            }}
          >
            {"×"}
          </button>
          <div style={{ padding: "30px 24px 24px 24px" }}>
            <h3
              style={{
                margin: "0 0 20px 0",
                fontSize: "24px",
                fontWeight: "700",
                color: "#7C4D2A",
                textAlign: "center",
              }}
            >
              BIG Score Breakdown
            </h3>
            <div
              style={{
                textAlign: "center",
                marginBottom: "30px",
                padding: "20px",
                background: "linear-gradient(135deg, #FAF7F2 0%, #F5F0E8 100%)",
                borderRadius: "12px",
                border: "1px solid #EAE2D8",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "120px",
                  height: "120px",
                  border: `4px solid ${scoreLevel.color}`,
                  borderRadius: "50%",
                  background: "white",
                  boxShadow: "0 4px 12px rgba(139, 69, 19, 0.2)",
                  marginBottom: "15px",
                }}
              >
                <span
                  style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    color: "#1C1410",
                    lineHeight: "1",
                  }}
                >
                  52%
                </span>
                <span
                  style={{
                    color: scoreLevel.color,
                    fontSize: "12px",
                    fontWeight: "600",
                    marginTop: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {scoreLevel.level}
                </span>
              </div>
              <div
                style={{
                  fontSize: "16px",
                  color: "#7A6A5E",
                }}
              >
                <span>Business stage: </span>
                <span
                  style={{
                    fontWeight: "600",
                    color: "#7C4D2A",
                    textTransform: "capitalize",
                  }}
                >
                  Growth
                </span>
              </div>
            </div>

            {/* About the BIG Score section */}
            <div
              style={{
                marginTop: "20px",
                border: "1px solid #EAE2D8",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  backgroundColor: "#7C4D2A",
                  color: "white",
                  padding: "12px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  fontWeight: "700",
                }}
                onClick={() => setShowAboutScore(!showAboutScore)}
              >
                <span>About the BIG score</span>
                <FaChevronDown
                  size={18}
                  style={{
                    transform: showAboutScore ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
              </div>
              {showAboutScore && (
                <div
                  style={{
                    backgroundColor: "#FAF7F2",
                    padding: "20px",
                    color: "#1C1410",
                  }}
                >
                  <p style={{ marginBottom: "16px", lineHeight: "1.6" }}>
                    The BIG score combines your compliance, legitimacy, leadership &amp; governance, operational
                    strength, and capital appeal scores into one comprehensive business readiness metric that
                    reflects your overall organizational maturity and market readiness.
                  </p>
                  <div
                    style={{
                      backgroundColor: "white",
                      padding: "16px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      borderLeft: "4px solid #7C4D2A",
                    }}
                  >
                    <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#7C4D2A" }}>Five key components:</p>
                    <ul style={{ margin: "0", paddingLeft: "20px", color: "#7A6A5E" }}>
                      <li style={{ marginBottom: "6px" }}>
                        <strong>Compliance score:</strong> Legal and regulatory documentation and compliance status
                      </li>
                      <li style={{ marginBottom: "6px" }}>
                        <strong>Legitimacy score:</strong> Business credibility, professionalism, and market presence
                      </li>
                      <li style={{ marginBottom: "6px" }}>
                        <strong>Leadership &amp; Governance score:</strong> Ownership and board structure, founder
                        and leadership quality, and governance maturity — can we trust the people and
                        decision-making structures?
                      </li>
                      <li style={{ marginBottom: "6px" }}>
                        <strong>Operational Strength score:</strong> Supplier &amp; continuity risk, delivery
                        reliability, and safety/compliance — can this business reliably execute?
                      </li>
                      <li style={{ marginBottom: "6px" }}>
                        <strong>Capital Appeal score:</strong> Investment readiness, financial health, and growth
                        potential
                      </li>
                    </ul>
                  </div>
                  <div
                    style={{
                      backgroundColor: "white",
                      padding: "16px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      borderLeft: "4px solid #D4894A",
                    }}
                  >
                    <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#D4894A" }}>Score interpretation:</p>
                    <ul style={{ margin: "0", paddingLeft: "20px", color: "#7A6A5E" }}>
                      <li style={{ marginBottom: "4px" }}>
                        <strong>91-100%:</strong> Exceptional - Your business is highly prepared for major opportunities
                      </li>
                      <li style={{ marginBottom: "4px" }}>
                        <strong>81-90%:</strong> Strong - Well-positioned for scaling, funding, and strategic partnerships
                      </li>
                      <li style={{ marginBottom: "4px" }}>
                        <strong>61-80%:</strong> Progressing - On track with solid foundations
                      </li>
                      <li style={{ marginBottom: "4px" }}>
                        <strong>41-60%:</strong> Foundational - Core building blocks are in place
                      </li>
                      <li style={{ marginBottom: "4px" }}>
                        <strong>0-40%:</strong> Emerging - Early stages of readiness
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Score Breakdown Section */}
            <div
              style={{
                marginTop: "16px",
                border: "1px solid #EAE2D8",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  backgroundColor: "#7C4D2A",
                  color: "white",
                  padding: "12px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  fontWeight: "700",
                }}
                onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
              >
                <span>Score breakdown</span>
                <FaChevronDown
                  size={18}
                  style={{
                    transform: showScoreBreakdown ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
              </div>
              {showScoreBreakdown && (
                <div
                  style={{
                    backgroundColor: "#FAF7F2",
                    padding: "20px",
                    color: "#1C1410",
                  }}
                >
                  {breakdown.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        padding: "15px",
                        borderBottom: index < breakdown.length - 1 ? "1px solid #EAE2D8" : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "white",
                        marginBottom: "5px",
                        borderRadius: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          flex: "1",
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: item.color,
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            marginRight: "12px",
                            flexShrink: "0",
                          }}
                        ></div>
                        <div>
                          <div
                            style={{
                              fontWeight: "600",
                              color: "#1C1410",
                              fontSize: "14px",
                              marginBottom: "2px",
                            }}
                          >
                            {item.name}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#7A6A5E",
                              fontStyle: "italic",
                            }}
                          >
                            {item.score}% × {item.weight}% weight = {item.weightedScore}%
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            width: "80px",
                            height: "8px",
                            background: "#F5F0E8",
                            borderRadius: "4px",
                            overflow: "hidden",
                            border: "1px solid #EAE2D8",
                          }}
                        >
                          <div
                            style={{
                              width: `${item.score}%`,
                              backgroundColor: getProgressBarColor(item.score),
                              height: "100%",
                              borderRadius: "4px",
                              transition: "width 0.3s ease",
                            }}
                          ></div>
                        </div>
                        <span
                          style={{
                            fontWeight: "600",
                            color: "#1C1410",
                            fontSize: "14px",
                            minWidth: "35px",
                            textAlign: "right",
                          }}
                        >
                          {item.score}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Detailed Analysis Section */}
            <div
              style={{
                marginTop: "16px",
                border: "1px solid #EAE2D8",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  backgroundColor: "#7C4D2A",
                  color: "white",
                  padding: "12px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  fontWeight: "700",
                }}
                onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
              >
                <span>Detailed analysis</span>
                <FaChevronDown
                  size={18}
                  style={{
                    transform: showDetailedAnalysis ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
              </div>
              {showDetailedAnalysis && (
                <div
                  style={{
                    backgroundColor: "#FAF7F2",
                    padding: "20px",
                    color: "#1C1410",
                  }}
                >
                  <div style={{ color: "#1C1410", lineHeight: "1.6" }}>
                    <p style={{ margin: "0 0 12px 0" }}>
                      <strong>Fair business readiness with improvement opportunities.</strong> While you have
                      established foundations in several areas, significant gaps remain that may limit access to
                      premium opportunities. Focus on strengthening your weakest scores - particularly compliance
                      and capital appeal - to improve your overall market position.
                    </p>
                    <div
                      style={{
                        backgroundColor: "white",
                        padding: "16px",
                        borderRadius: "8px",
                        marginTop: "12px",
                        borderLeft: "4px solid #D4894A",
                      }}
                    >
                      <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#7C4D2A" }}>
                        Key recommendations:
                      </p>
                      <ul style={{ margin: "0", paddingLeft: "20px", color: "#7A6A5E" }}>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>Compliance (29%):</strong> Upload missing documents like Company Registration and SARS Tax Clearance
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>Capital Appeal (45%):</strong> Strengthen your investment case and financial documentation
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>Leadership & Governance (58%):</strong> Build governance structures and document policies
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>Operational Strength (70%):</strong> Enhance supplier reliability and delivery processes
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: "24px", textAlign: "center" }}>
              <button
                onClick={() => navigate('/LoginRegister')}
                style={{
                  width: "100%",
                  padding: "14px 24px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #7C4D2A 0%, #A0703E 100%)",
                  color: "white",
                  border: "none",
                  fontWeight: "700",
                  fontSize: "15px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 6px 20px rgba(124, 77, 42, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(124, 77, 42, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(124, 77, 42, 0.4)";
                }}
              >
                <span>Get Your Actual BIG Score</span>
                <FaArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      background: colors.light,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      minHeight: '100vh',
    }}>
      <Header />

      {/* Main Content Container */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        flex: '1',
        width: '100%',
      }}>
        {/* Hero Section - Now contained within the page */}
        <section style={{
          position: 'relative',
          borderRadius: '20px',
          overflow: 'hidden',
          marginBottom: '50px',
          minHeight: isMobile ? '380px' : '420px',
          background: `linear-gradient(135deg, ${colors.dark} 0%, ${colors.brown} 100%)`,
          display: 'flex',
          alignItems: 'center',
          padding: isMobile ? '40px 24px' : '50px 60px',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1400&h=500&fit=crop&crop=center)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.12,
            zIndex: 0,
          }} />
          
          <div style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.amber}15, transparent)`,
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            bottom: -100,
            left: -50,
            width: 350,
            height: 350,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.primary}15, transparent)`,
            pointerEvents: 'none',
          }} />

          <div style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: '750px',
            opacity: bannerLoaded ? 1 : 0,
            transform: bannerLoaded ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: `${colors.amber}20`,
              border: `1px solid ${colors.amber}40`,
              borderRadius: '30px',
              padding: '6px 16px 6px 10px',
              marginBottom: '20px',
            }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: colors.amber,
                display: 'inline-block',
              }} />
              <span style={{
                color: colors.amber,
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}>
                Trust Infrastructure
              </span>
            </div>

            <h1 style={{
              fontSize: isMobile ? 'clamp(2rem, 8vw, 2.8rem)' : 'clamp(2.2rem, 4.5vw, 3.5rem)',
              fontWeight: 900,
              color: colors.white,
              margin: '0 0 16px',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}>
              The <span style={{ color: colors.amber }}>BIG Score</span>
            </h1>

            <p style={{
              fontSize: isMobile ? 'clamp(0.9rem, 4vw, 1rem)' : 'clamp(1rem, 1.5vw, 1.2rem)',
              color: 'rgba(255,255,255,0.7)',
              maxWidth: '600px',
              lineHeight: 1.7,
              margin: '0 0 28px',
            }}>
              The Score That Earns You Trust — Before You Even Pitch. 
              One number that tells funders, partners, and programs everything they need to know about your business readiness.
            </p>

            <div style={{
              display: 'flex',
              gap: isMobile ? '12px' : '16px',
              flexWrap: 'wrap',
            }}>
              <button
                onClick={() => navigate('/LoginRegister')}
                style={{
                  background: `linear-gradient(135deg, ${colors.amber}, ${colors.secondary})`,
                  color: colors.white,
                  border: 'none',
                  borderRadius: '50px',
                  padding: isMobile ? '12px 24px' : '14px 36px',
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: `0 4px 20px ${colors.amber}40`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  flex: isMobile ? '1 1 100%' : 'auto',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 8px 30px ${colors.amber}50`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 4px 20px ${colors.amber}40`;
                }}
              >
                Get Your BIG Score Now <FaArrowRight size={14} />
              </button>
              <button
                onClick={() => {
                  setShowSampleReport(true);
                  document.body.style.overflow = 'hidden';
                }}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: colors.white,
                  border: `1px solid rgba(255,255,255,0.2)`,
                  borderRadius: '50px',
                  padding: isMobile ? '12px 24px' : '14px 36px',
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(8px)',
                  flex: isMobile ? '1 1 100%' : 'auto',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                }}
              >
                See Sample Report
              </button>
            </div>

            <div style={{
              display: 'flex',
              gap: isMobile ? '16px' : '32px',
              marginTop: '28px',
              flexWrap: 'wrap',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'flex-start' : 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaCheckCircle size={16} color={colors.amber} />
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                  AI-Powered Assessment
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaStar size={16} color={colors.amber} />
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                  5 Key Dimensions
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaUsers size={16} color={colors.amber} />
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                  Trusted by 500+ Businesses
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Sample Report Modal */}
        {showSampleReport && <SampleReportModal />}

        {/* Tabs */}
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: isMobile ? '0 16px' : '0 20px',
          marginTop: isMobile ? '20px' : '40px',
          position: 'relative',
          zIndex: 2,
        }}>
          <div style={{
            display: 'flex',
            background: colors.white,
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(28,20,16,0.08)',
            border: `1px solid ${colors.border}`,
          }}>
            <button
              onClick={() => setActiveTab('score')}
              style={{
                flex: 1,
                padding: isMobile ? '14px 12px' : '18px 24px',
                background: activeTab === 'score' ? colors.primary : 'transparent',
                color: activeTab === 'score' ? colors.white : colors.muted,
                border: 'none',
                fontSize: isMobile ? '0.8rem' : '0.95rem',
                fontWeight: activeTab === 'score' ? 700 : 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'score') {
                  e.currentTarget.style.background = colors.light;
                  e.currentTarget.style.color = colors.dark;
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'score') {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = colors.muted;
                }
              }}
            >
              <FaChartLine size={isMobile ? 14 : 18} />
              The BIG Score
            </button>
            <button
              onClick={() => setActiveTab('improve')}
              style={{
                flex: 1,
                padding: isMobile ? '14px 12px' : '18px 24px',
                background: activeTab === 'improve' ? colors.primary : 'transparent',
                color: activeTab === 'improve' ? colors.white : colors.muted,
                border: 'none',
                fontSize: isMobile ? '0.8rem' : '0.95rem',
                fontWeight: activeTab === 'improve' ? 700 : 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'improve') {
                  e.currentTarget.style.background = colors.light;
                  e.currentTarget.style.color = colors.dark;
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'improve') {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = colors.muted;
                }
              }}
            >
              <FaRocket size={isMobile ? 14 : 18} />
              How to Improve Your BIG Score
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: isMobile ? '24px 16px 40px' : '40px 20px 60px',
        }}>

          {activeTab === 'score' ? (
            <>
              {/* What is BIG Score Section */}
              <section style={{
                backgroundColor: colors.white,
                borderRadius: '20px',
                padding: isMobile ? '24px 16px' : '40px',
                marginBottom: '40px',
                boxShadow: '0 4px 20px rgba(28,20,16,0.06)',
              }}>
                <h2 style={{
                  fontSize: isMobile ? 'clamp(1.3rem, 5vw, 1.8rem)' : 'clamp(1.5rem, 2.5vw, 2rem)',
                  fontWeight: 800,
                  color: colors.dark,
                  textAlign: 'center',
                  marginBottom: '12px',
                  letterSpacing: '-0.01em',
                }}>
                  What Makes the <span style={{ color: colors.primary }}>BIG Score</span>... BIG?
                </h2>
                <p style={{
                  textAlign: 'center',
                  color: colors.muted,
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  maxWidth: '600px',
                  margin: '0 auto 32px',
                  lineHeight: 1.6,
                }}>
                  A standardized score that validates your business's readiness and trustworthiness — across compliance, governance, and legitimacy.
                </p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                  gap: '20px',
                }}>
                  {[
                    {
                      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop&crop=center',
                      title: 'Business Credibility',
                      description: 'Validates your business readiness and trustworthiness across all key dimensions.',
                      color: colors.primary,
                    },
                    {
                      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&crop=center',
                      title: 'Growth Roadmap',
                      description: 'Highlights strengths, flags risks, and reveals what you need to improve.',
                      color: colors.secondary,
                    },
                    {
                      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop&crop=center',
                      title: 'Risk Assessment',
                      description: 'Enables investors and partners to make data-backed decisions with confidence.',
                      color: colors.amber,
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      style={{
                        background: colors.white,
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(28,20,16,0.08)',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        borderTop: `4px solid ${item.color}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-6px)';
                        e.currentTarget.style.boxShadow = '0 12px 40px rgba(28,20,16,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(28,20,16,0.08)';
                      }}
                    >
                      <div style={{
                        height: isMobile ? '160px' : '180px',
                        overflow: 'hidden',
                      }}>
                        <img
                          src={item.image}
                          alt={item.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.5s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        />
                      </div>
                      <div style={{
                        padding: isMobile ? '16px' : '24px',
                        textAlign: 'center',
                      }}>
                        <h3 style={{
                          fontSize: isMobile ? '1rem' : '1.1rem',
                          fontWeight: 700,
                          color: colors.dark,
                          marginBottom: '8px',
                        }}>
                          {item.title}
                        </h3>
                        <p style={{
                          fontSize: isMobile ? '0.8rem' : '0.85rem',
                          color: colors.muted,
                          lineHeight: 1.5,
                          margin: 0,
                        }}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  background: colors.light,
                  borderRadius: '12px',
                  padding: isMobile ? '16px' : '24px',
                  marginTop: '24px',
                  borderLeft: `4px solid ${colors.amber}`,
                }}>
                  <p style={{
                    fontSize: isMobile ? '0.85rem' : '0.95rem',
                    lineHeight: 1.7,
                    color: colors.dark,
                    margin: 0,
                    textAlign: 'center',
                  }}>
                    <strong>Consumer finance has TransUnion and Experian</strong> — global systems that measure personal creditworthiness.<br />
                    <strong>Corporates have Moody's, Fitch, and S&P</strong> — rating frameworks that measure institutional risk.<br />
                    <strong>Businesses have "The BIG Score"</strong> — a shared metric that lets funders, corporates, and partners speak the same language of readiness and reliability.
                  </p>
                </div>
              </section>

              {/* Score Components Section */}
              <section style={{
                backgroundColor: colors.dark,
                borderRadius: '20px',
                padding: isMobile ? '24px 16px' : '40px',
                marginBottom: '40px',
                backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(160,112,62,0.15) 0%, transparent 70%)',
              }}>
                <h2 style={{
                  fontSize: isMobile ? 'clamp(1.3rem, 5vw, 1.8rem)' : 'clamp(1.5rem, 2.5vw, 2rem)',
                  fontWeight: 800,
                  color: colors.white,
                  textAlign: 'center',
                  marginBottom: '8px',
                  letterSpacing: '-0.01em',
                }}>
                  What Makes Up Your <span style={{ color: colors.amber }}>BIG Score</span>?
                </h2>
                <p style={{
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  maxWidth: '600px',
                  margin: '0 auto 32px',
                  lineHeight: 1.6,
                }}>
                  Our AI-powered framework scores every business across five core dimensions — giving funders, partners, and programs a complete view of business readiness.
                </p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, 1fr)',
                  gap: isMobile ? '12px' : '16px',
                }}>
                  {scoreData.bigScore.components.map((component, index) => (
                    <ScoreCard key={index} component={component} />
                  ))}
                </div>
              </section>

              {/* Why BIG Score Works Section */}
              <section style={{
                backgroundColor: colors.white,
                borderRadius: '20px',
                padding: isMobile ? '24px 16px' : '40px',
                marginBottom: '40px',
                boxShadow: '0 4px 20px rgba(28,20,16,0.06)',
              }}>
                <h2 style={{
                  fontSize: isMobile ? 'clamp(1.3rem, 5vw, 1.8rem)' : 'clamp(1.5rem, 2.5vw, 2rem)',
                  fontWeight: 800,
                  color: colors.dark,
                  textAlign: 'center',
                  marginBottom: '32px',
                  letterSpacing: '-0.01em',
                }}>
                  Why the <span style={{ color: colors.primary }}>BIG Score</span> Works
                </h2>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                  gap: '24px',
                }}>
                  {/* Problems */}
                  <div style={{
                    background: colors.redBg,
                    borderRadius: '16px',
                    padding: isMobile ? '16px' : '24px',
                    border: `1px solid ${colors.red}30`,
                  }}>
                    <h3 style={{
                      fontSize: isMobile ? '1rem' : '1.1rem',
                      fontWeight: 700,
                      color: colors.red,
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <span style={{ fontSize: '1.3rem' }}>✕</span> Traditional Challenges
                    </h3>
                    {[
                      'Subjective Judgement — Unstructured interviews, inconsistent criteria',
                      'Static Reports — PDF-based, instantly outdated',
                      'Opaque Criteria — No visibility into what\'s being scored',
                      'Manual Admin — Slow, inconsistent, prone to error'
                    ].map((item, index) => (
                      <div
                        key={index}
                        style={{
                          padding: isMobile ? '10px 12px' : '12px 16px',
                          background: 'rgba(255,255,255,0.6)',
                          borderRadius: '8px',
                          marginBottom: '8px',
                          fontSize: isMobile ? '0.8rem' : '0.85rem',
                          color: colors.dark,
                          lineHeight: 1.4,
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>

                  {/* Solutions */}
                  <div style={{
                    background: colors.greenBg,
                    borderRadius: '16px',
                    padding: isMobile ? '16px' : '24px',
                    border: `1px solid ${colors.green}30`,
                  }}>
                    <h3 style={{
                      fontSize: isMobile ? '1rem' : '1.1rem',
                      fontWeight: 700,
                      color: colors.green,
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <span style={{ fontSize: '1.3rem' }}>✓</span> BIG Score Solutions
                    </h3>
                    {[
                      'AI-Driven Objectivity — Removes bias, uses consistent validated metrics',
                      'Live Score Tracking — See performance evolve over time',
                      'Transparent Weightings — Know what matters and what to improve',
                      'Automated Verification — Fast, consistent, and auditable process'
                    ].map((item, index) => (
                      <div
                        key={index}
                        style={{
                          padding: isMobile ? '10px 12px' : '12px 16px',
                          background: 'rgba(255,255,255,0.6)',
                          borderRadius: '8px',
                          marginBottom: '8px',
                          fontSize: isMobile ? '0.8rem' : '0.85rem',
                          color: colors.dark,
                          lineHeight: 1.4,
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          ) : (
            // Improve Your BIG Score Tab
            <>
              {/* Introduction */}
              <section style={{
                backgroundColor: colors.white,
                borderRadius: '20px',
                padding: isMobile ? '24px 16px' : '40px',
                marginBottom: '40px',
                boxShadow: '0 4px 20px rgba(28,20,16,0.06)',
              }}>
                <h2 style={{
                  fontSize: isMobile ? 'clamp(1.3rem, 5vw, 1.8rem)' : 'clamp(1.5rem, 2.5vw, 2rem)',
                  fontWeight: 800,
                  color: colors.dark,
                  textAlign: 'center',
                  marginBottom: '12px',
                  letterSpacing: '-0.01em',
                }}>
                  Boost Your <span style={{ color: colors.primary }}>BIG Score</span>
                </h2>
                <p style={{
                  textAlign: 'center',
                  color: colors.muted,
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  maxWidth: '650px',
                  margin: '0 auto 24px',
                  lineHeight: 1.6,
                }}>
                  Use these targeted growth tools to improve specific areas of your BIG Score. 
                  Higher scores lead to better funding opportunities, stronger corporate partnerships, and accelerated business growth.
                </p>

                <div style={{
                  background: colors.light,
                  borderRadius: '12px',
                  padding: isMobile ? '16px' : '24px',
                  borderLeft: `4px solid ${colors.amber}`,
                }}>
                  <p style={{
                    fontSize: isMobile ? '0.85rem' : '0.95rem',
                    lineHeight: 1.7,
                    color: colors.dark,
                    margin: 0,
                    textAlign: 'center',
                  }}>
                    <strong>💡 How to use this guide:</strong> Each category below shows tools that can help you improve a specific area of your BIG Score. 
                    Choose the tools that address your weakest scores first.
                  </p>
                </div>
              </section>

              {/* Improvement Tools Table */}
              <section style={{
                backgroundColor: colors.white,
                borderRadius: '20px',
                padding: isMobile ? '16px' : '32px',
                marginBottom: '40px',
                boxShadow: '0 4px 20px rgba(28,20,16,0.06)',
                overflow: 'hidden',
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: isMobile ? '20px' : '24px',
                }}>
                  {improvementTools.map((tool, index) => (
                    <div
                      key={index}
                      style={{
                        background: colors.white,
                        borderRadius: '16px',
                        overflow: 'hidden',
                        border: `1px solid ${colors.border}`,
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 30px rgba(28,20,16,0.1)';
                        e.currentTarget.style.borderColor = tool.color;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.borderColor = colors.border;
                      }}
                    >
                      {/* Image */}
                      <div style={{
                        height: isMobile ? '140px' : '160px',
                        overflow: 'hidden',
                        position: 'relative',
                      }}>
                        <img 
                          src={tool.image}
                          alt={tool.category}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          loading="lazy"
                        />
                        <div style={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: `${tool.color}dd`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: colors.white,
                        }}>
                          {tool.icon}
                        </div>
                      </div>

                      {/* Content */}
                      <div style={{
                        padding: isMobile ? '16px 18px' : '20px 24px',
                      }}>
                        <h3 style={{
                          fontSize: isMobile ? '1rem' : '1.1rem',
                          fontWeight: 700,
                          color: tool.color,
                          margin: '0 0 4px',
                        }}>
                          {tool.category}
                        </h3>
                        <p style={{
                          fontSize: isMobile ? '0.8rem' : '0.85rem',
                          color: colors.muted,
                          margin: '0 0 10px',
                          lineHeight: 1.5,
                        }}>
                          {tool.description}
                        </p>
                        <div style={{
                          background: colors.light,
                          borderRadius: '8px',
                          padding: isMobile ? '10px 12px' : '12px 16px',
                        }}>
                          <p style={{
                            fontSize: isMobile ? '0.7rem' : '0.75rem',
                            color: colors.muted,
                            margin: 0,
                            fontWeight: 500,
                          }}>
                            <span style={{ fontWeight: 600, color: tool.color }}>Includes:</span> {tool.examples}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Find Help Section */}
              <section style={{
                backgroundColor: colors.dark,
                borderRadius: '20px',
                padding: isMobile ? '32px 20px' : '50px 40px',
                marginBottom: '40px',
                textAlign: 'center',
                backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(160,112,62,0.15) 0%, transparent 70%)',
              }}>
                <h2 style={{
                  fontSize: isMobile ? 'clamp(1.3rem, 5vw, 1.8rem)' : 'clamp(1.5rem, 2.5vw, 2rem)',
                  fontWeight: 800,
                  color: colors.white,
                  marginBottom: '12px',
                  letterSpacing: '-0.01em',
                }}>
                  We're Here to <span style={{ color: colors.amber }}>Help You Grow</span>
                </h2>
                <p style={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  color: 'rgba(255,255,255,0.7)',
                  maxWidth: '650px',
                  margin: '0 auto 24px',
                  lineHeight: 1.6,
                }}>
                  The tools above are offered by us to help you improve your BIG Score. 
                  Need assistance implementing them? Our expert advisors and service providers are ready to guide you every step of the way.
                </p>
                <div style={{
                  display: 'flex',
                  gap: isMobile ? '12px' : '16px',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}>
                  <button
                    onClick={() => navigate('/find-advisors')}
                    style={{
                      background: `linear-gradient(135deg, ${colors.amber}, ${colors.secondary})`,
                      color: colors.white,
                      border: 'none',
                      borderRadius: '50px',
                      padding: isMobile ? '12px 24px' : '14px 36px',
                      fontSize: isMobile ? '0.85rem' : '0.95rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: `0 4px 20px ${colors.amber}40`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 8px 30px ${colors.amber}50`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = `0 4px 20px ${colors.amber}40`;
                    }}
                  >
                    Find an Advisor <FaArrowRight size={14} />
                  </button>
                  <button
                    onClick={() => navigate('/find-service-providers')}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      color: colors.white,
                      border: `1px solid rgba(255,255,255,0.2)`,
                      borderRadius: '50px',
                      padding: isMobile ? '12px 24px' : '14px 36px',
                      fontSize: isMobile ? '0.85rem' : '0.95rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(8px)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    }}
                  >
                    Find a Service Provider <FaArrowRight size={14} />
                  </button>
                  <button
                    onClick={() => navigate('/find-catalysts')}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      color: colors.white,
                      border: `1px solid rgba(255,255,255,0.2)`,
                      borderRadius: '50px',
                      padding: isMobile ? '12px 24px' : '14px 36px',
                      fontSize: isMobile ? '0.85rem' : '0.95rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(8px)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    }}
                  >
                    Find a Catalyst <FaArrowRight size={14} />
                  </button>
                </div>
              </section>
            </>
          )}
        </div>

        {/* Popup Modal */}
        {showPopup && popupContent && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(28,20,16,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
            padding: isMobile ? '12px' : '20px',
          }}>
            <div style={{
              backgroundColor: colors.white,
              borderRadius: '20px',
              width: '100%',
              maxWidth: '900px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: isMobile ? '24px 16px' : '40px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              position: 'relative',
              animation: 'fadeInUp 0.3s ease-out',
            }}>
              <button
                onClick={closePopup}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: colors.muted,
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.light;
                  e.currentTarget.style.color = colors.dark;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = colors.muted;
                }}
              >
                <FaTimes size={20} />
              </button>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '16px',
                flexWrap: 'wrap',
              }}>
                <div style={{
                  width: isMobile ? '48px' : '56px',
                  height: isMobile ? '48px' : '56px',
                  borderRadius: '14px',
                  background: `${popupContent.color || colors.primary}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: popupContent.color || colors.primary,
                  fontSize: '1.5rem',
                }}>
                  {popupContent.icon}
                </div>
                <div>
                  <h2 style={{
                    fontSize: isMobile ? '1.2rem' : '1.5rem',
                    fontWeight: 800,
                    color: colors.dark,
                    margin: 0,
                    letterSpacing: '-0.01em',
                  }}>
                    {popupContent.title}
                  </h2>
                  <p style={{
                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                    color: colors.muted,
                    margin: '4px 0 0',
                  }}>
                    {popupContent.description}
                  </p>
                </div>
              </div>

              <p style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                lineHeight: 1.7,
                color: colors.dark,
                marginBottom: '24px',
                padding: isMobile ? '12px' : '16px',
                background: colors.light,
                borderRadius: '10px',
              }}>
                {popupContent.detailedDescription}
              </p>

              {/* Weightings */}
              <div style={{
                marginBottom: '24px',
              }}>
                <h3 style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: colors.dark,
                  marginBottom: '12px',
                }}>
                  Weightings by Business Stage
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                  gap: isMobile ? '8px' : '12px',
                }}>
                  {Object.entries(popupContent.weightings || {}).map(([key, val]) => (
                    <div key={key} style={{
                      background: colors.light,
                      borderRadius: '10px',
                      padding: isMobile ? '12px' : '16px',
                      textAlign: 'center',
                      borderLeft: `3px solid ${popupContent.color || colors.primary}`,
                    }}>
                      <div style={{ fontSize: isMobile ? '1rem' : '1.2rem', fontWeight: 800, color: popupContent.color || colors.primary }}>
                        {val.value}
                      </div>
                      <div style={{ fontSize: isMobile ? '0.7rem' : '0.8rem', color: colors.muted }}>
                        {val.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub Components */}
              {popupContent.subComponents && popupContent.subComponents.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: colors.dark,
                    marginBottom: '12px',
                  }}>
                    What We Evaluate
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                    gap: isMobile ? '8px' : '12px',
                  }}>
                    {popupContent.subComponents.map((sub, index) => (
                      <div
                        key={index}
                        style={{
                          background: colors.light,
                          borderRadius: '10px',
                          padding: isMobile ? '12px' : '16px',
                          borderTop: `2px solid ${popupContent.color || colors.primary}`,
                        }}
                      >
                        <h4 style={{
                          fontSize: isMobile ? '0.8rem' : '0.85rem',
                          fontWeight: 700,
                          color: colors.dark,
                          marginBottom: '4px',
                        }}>
                          {sub.title}
                          {sub.weight && (
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              color: popupContent.color || colors.primary,
                              marginLeft: '8px',
                            }}>
                              ({sub.weight})
                            </span>
                          )}
                        </h4>
                        <p style={{
                          fontSize: isMobile ? '0.7rem' : '0.75rem',
                          color: colors.muted,
                          margin: '0 0 8px',
                          lineHeight: 1.4,
                        }}>
                          {sub.description}
                        </p>
                        {sub.items && sub.items.length > 0 && (
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px',
                          }}>
                            {sub.items.slice(0, isMobile ? 3 : 4).map((item, i) => {
                              if (typeof item === 'object' && item !== null) {
                                const statusColor = item.status === 'verified' ? colors.green : colors.red;
                                return (
                                  <span
                                    key={i}
                                    style={{
                                      fontSize: '0.6rem',
                                      background: `${statusColor}15`,
                                      color: statusColor,
                                      padding: '2px 8px',
                                      borderRadius: '12px',
                                      fontWeight: 500,
                                      border: `1px solid ${statusColor}30`,
                                    }}
                                  >
                                    {item.label} ({item.weight})
                                  </span>
                                );
                              }
                              return (
                                <span
                                  key={i}
                                  style={{
                                    fontSize: '0.6rem',
                                    background: `${popupContent.color || colors.primary}15`,
                                    color: popupContent.color || colors.primary,
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontWeight: 500,
                                  }}
                                >
                                  {item}
                                </span>
                              );
                            })}
                            {sub.items.length > (isMobile ? 3 : 4) && (
                              <span style={{
                                fontSize: '0.6rem',
                                color: colors.muted,
                              }}>
                                +{sub.items.length - (isMobile ? 3 : 4)} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Score Interpretation */}
              {popupContent.scoreInterpretation && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: colors.dark,
                    marginBottom: '12px',
                  }}>
                    Score Interpretation
                  </h3>
                  <div style={{
                    overflowX: 'auto',
                  }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: isMobile ? '0.75rem' : '0.85rem',
                      minWidth: isMobile ? '500px' : 'auto',
                    }}>
                      <thead>
                        <tr style={{
                          background: colors.dark,
                          color: colors.white,
                        }}>
                          <th style={{ padding: isMobile ? '8px 10px' : '10px 14px', textAlign: 'left' }}>Score Range</th>
                          <th style={{ padding: isMobile ? '8px 10px' : '10px 14px', textAlign: 'left' }}>Level</th>
                          <th style={{ padding: isMobile ? '8px 10px' : '10px 14px', textAlign: 'left' }}>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {popupContent.scoreInterpretation.map((item, index) => (
                          <tr
                            key={index}
                            style={{
                              background: index % 2 === 0 ? colors.white : colors.light,
                              borderBottom: `1px solid ${colors.border}`,
                            }}
                          >
                            <td style={{ padding: isMobile ? '8px 10px' : '10px 14px', fontWeight: 600 }}>{item.range}</td>
                            <td style={{ padding: isMobile ? '8px 10px' : '10px 14px', fontWeight: 600, color: popupContent.color || colors.primary }}>
                              {item.level}
                            </td>
                            <td style={{ padding: isMobile ? '8px 10px' : '10px 14px', color: colors.muted }}>{item.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Calculation Method */}
              <div style={{
                background: colors.light,
                borderRadius: '10px',
                padding: isMobile ? '12px' : '16px',
              }}>
                <h3 style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: colors.dark,
                  marginBottom: '4px',
                }}>
                  Calculation Method
                </h3>
                <p style={{
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  color: colors.muted,
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  {popupContent.calculationMethod}
                </p>
              </div>
            </div>
          </div>
        )}

        <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 6px;
          }
          ::-webkit-scrollbar-track {
            background: ${colors.light};
            borderRadius: 3px;
          }
          ::-webkit-scrollbar-thumb {
            background: ${colors.secondary};
            borderRadius: 3px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: ${colors.primary};
          }

          /* Mobile styles */
          @media (max-width: 768px) {
            .table-container {
              overflow-x: auto;
            }
          }
        `}</style>
      </div>

      <Footer />
    </div>
  );
};

export default BIGScorePage;