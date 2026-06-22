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
  FaClipboardCheck
} from 'react-icons/fa';

const BIGScorePage = () => {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [popupContent, setPopupContent] = useState(null);
  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    const timer = setTimeout(() => setBannerLoaded(true), 300);
    return () => clearTimeout(timer);
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

  const scoreData = {
    bigScore: {
      title: "The BIG SCORE",
      description: "The Score That Earns You Trust — Before You Even Pitch",
      components: [
        {
          id: 'compliance',
          title: "Compliance Score",
          icon: <FaShieldAlt size={24} />,
          color: colors.primary,
          description: "Whether a business meets core legal, regulatory, and tax requirements.",
          detailedDescription: "🧱 This is the foundation of your BIG Score — no compliance, no credibility.",
          calculationMethod: "Our AI analyzes official documents, government records, and compliance certifications to verify your business's legal standing.",
          weightings: {
            seed: { value: "20%", description: "Focus on basic legal compliance" },
            growth: { value: "15%", description: "Expanded regulatory requirements" },
            maturity: { value: "15%", description: "Full compliance expected" }
          },
          subComponents: [
            {
              title: "Document Uploads",
              description: "Verification of required business documents",
              items: [
                "Business Registration Verified",
                "Tax Compliance confirmed",
                "VAT compliance verified",
                "Proof of Business Address",
                "Director identities verified",
                "Ownership structure verified",
                "BBBEE certificate valid",
                "Bank Account valid",
                "Company Letterhead",
                "COID"
              ]
            },
            {
              title: "Profile Completion",
              description: "Completeness of business profile information"
            }
          ]
        },
        {
          id: 'legitimacy',
          title: "Legitimacy Score",
          icon: <FaCheckCircle size={24} />,
          color: colors.secondary,
          description: "How professionally and credibly your business presents itself.",
          detailedDescription: "🎯 Funders look beyond paperwork. This score shows you mean business.",
          calculationMethod: "We evaluate digital footprint, customer reviews, media presence, and partnership history.",
          weightings: {
            seed: { value: "20%", description: "Basic legitimacy checks" },
            growth: { value: "15%", description: "Expanded track record evaluation" },
            maturity: { value: "15%", description: "Comprehensive reputation analysis" }
          },
          subComponents: [
            {
              title: "Foundational Business Identity",
              description: "Professional website, domain email, branded materials",
              items: ["Professional Website", "Domain Email", "Branded Materials", "Registered Address"]
            },
            {
              title: "Digital Presence & Discoverability",
              description: "Website, social media, searchability",
              items: ["Website Presence", "Social Media Activity", "Search Visibility"]
            },
            {
              title: "Track Record Indicators",
              description: "Years in operation, client portfolio, repeat clients",
              items: ["Years in Operation", "Client Portfolio", "Repeat Clients", "Turnover History"]
            },
            {
              title: "Third-Party Validations",
              description: "Accreditations, memberships, awards, media features",
              items: ["Accreditations", "Professional Memberships", "Awards", "Media Features"]
            },
            {
              title: "Reputation and Social Proof",
              description: "Online reviews, testimonials, press mentions",
              items: ["Online Reviews", "Testimonials", "Press Mentions"]
            },
            {
              title: "Team & Leadership",
              description: "Visible leadership team, LinkedIn presence, team growth",
              items: ["Leadership Visibility", "LinkedIn Presence", "Team Growth"]
            }
          ]
        },
        {
          id: 'leadership',
          title: "Leadership Score",
          icon: <FaUserTie size={24} />,
          color: colors.amber,
          description: "The leadership capabilities and experience of business owners and key executives.",
          detailedDescription: "👑 This score assesses readiness to lead teams, attract investment, and scale operations effectively.",
          calculationMethod: "We analyze leadership profiles, management experience, team composition, and professional credentials.",
          weightings: {
            seed: { value: "15%", description: "Founding team evaluation" },
            growth: { value: "20%", description: "Developing leadership structure" },
            maturity: { value: "20%", description: "Professional leadership expected" }
          },
          subComponents: [
            {
              title: "Leadership Experience",
              description: "Years of management experience, positions held",
              items: ["Management Tenure", "Leadership Roles", "Organizational Complexity"]
            },
            {
              title: "Team Management",
              description: "Scale of teams led, organizational structure",
              items: ["Team Size Managed", "Organizational Structure", "Revenue Responsibility"]
            },
            {
              title: "Recognition & Education",
              description: "Educational qualifications, certifications, awards",
              items: ["Formal Education", "Professional Certifications", "Industry Awards"]
            },
            {
              title: "Team & Leadership Visibility",
              description: "Professional profiles, leadership visibility",
              items: ["Professional Profiles", "Leadership Visibility", "Team Composition"]
            }
          ],
          scoreInterpretation: [
            { range: "91-100%", level: "Visionary Leadership", description: "Proven ability to lead complex organizations" },
            { range: "81-90%", level: "Seasoned Leadership", description: "Excellent management strength" },
            { range: "61-80%", level: "Rising Leadership", description: "Strong foundations with clear potential" },
            { range: "41-60%", level: "Developing Leadership", description: "Growing experience" },
            { range: "0-40%", level: "Foundational Leadership", description: "Building capabilities" }
          ]
        },
        {
          id: 'governance',
          title: "Governance Score",
          icon: <FaBuilding size={24} />,
          color: colors.green,
          description: "Whether a business is ready to establish or improve its governance structures.",
          detailedDescription: "🏛️ This score combines Public Interest Score with governance maturity assessment.",
          calculationMethod: "We assess board structure, strategic planning, risk management, transparency practices, and policy frameworks.",
          weightings: {
            seed: { value: "15%", description: "Basic governance evaluation" },
            growth: { value: "20%", description: "Developing governance structures" },
            maturity: { value: "20%", description: "Mature governance expected" }
          },
          subComponents: [
            {
              title: "Board Structure & Functionality",
              description: "Composition, roles, and effectiveness",
              items: ["Board Composition", "Role Clarity", "Meeting Effectiveness"]
            },
            {
              title: "Strategic Planning",
              description: "Long-term vision, business plans",
              items: ["Strategic Direction", "Business Planning", "Performance Review"]
            },
            {
              title: "Risk Management",
              description: "Risk identification, assessment, mitigation",
              items: ["Risk Framework", "Business Continuity", "Crisis Preparedness"]
            },
            {
              title: "Transparency & Reporting",
              description: "Financial reporting, stakeholder communication",
              items: ["Financial Reporting", "Stakeholder Communications", "Disclosure Standards"]
            },
            {
              title: "Policies & Documentation",
              description: "Essential business policies, employment contracts",
              items: ["Policy Framework", "Employment Contracts", "Compliance Documentation"]
            }
          ],
          scoreInterpretation: [
            { range: "91-100%", level: "Governance Excellence", description: "Exceptional governance maturity" },
            { range: "81-90%", level: "Strong Governance", description: "Well-established governance framework" },
            { range: "61-80%", level: "Developing Governance", description: "Good foundations with room for refinement" },
            { range: "41-60%", level: "Emerging Governance", description: "Basic elements with significant gaps" },
            { range: "0-40%", level: "Foundational Stage", description: "Structures require substantial development" }
          ]
        },
        {
          id: 'capital',
          title: "Capital Appeal Score",
          icon: <FaMoneyBillWave size={24} />,
          color: colors.orange,
          description: "How attractive a business is to potential investors and lenders.",
          detailedDescription: "💰 This score evaluates investment readiness and risk profile.",
          calculationMethod: "Financial statements are analyzed using machine learning models that compare your metrics with industry benchmarks.",
          weightings: {
            seed: { value: "30%", description: "Early-stage investment appeal" },
            growth: { value: "30%", description: "Growth-stage funding potential" },
            maturity: { value: "30%", description: "Mature-stage investment readiness" }
          },
          subComponents: [
            {
              title: "Financial Readiness",
              description: "Accounting systems, compliance, up-to-date records",
              items: ["Accounting Systems", "Financial Compliance", "Record Keeping"]
            },
            {
              title: "Financial Strength",
              description: "Revenue growth, profitability, audited financials",
              items: ["Revenue Growth", "Profitability", "Audited Financials"]
            },
            {
              title: "Operational Strength",
              description: "Business processes, infrastructure, operational maturity",
              items: ["Operational Efficiency", "Business Model Strength", "Infrastructure"]
            },
            {
              title: "Impact Proof",
              description: "Job creation, HDG inclusion, environmental responsibility",
              items: ["Job Creation", "HDG Inclusion", "Environmental Impact"]
            },
            {
              title: "Pitch & Business Plan Quality",
              description: "Investment narrative clarity, market analysis",
              items: ["Business Plan Quality", "Market Analysis", "Competitive Advantage"]
            },
            {
              title: "Guarantees & Security",
              description: "Forward contracts, payment guarantees, asset-backed security",
              items: ["Forward Contracts", "Payment Guarantees", "Asset Security"]
            }
          ],
          scoreInterpretation: [
            { range: "91-100%", level: "Highly Fundable", description: "Exceptional investment opportunity" },
            { range: "81-90%", level: "Strong Investment Case", description: "Very attractive to funders" },
            { range: "61-80%", level: "Moderate Potential", description: "Shows promise with some improvements" },
            { range: "41-60%", level: "Basic Potential", description: "Significant improvements needed" },
            { range: "0-40%", level: "Needs Development", description: "Fundamental changes required" }
          ]
        }
      ]
    }
  };

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
          padding: '20px 18px',
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
          gap: '10px',
          marginBottom: '10px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
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
            fontSize: '0.85rem',
            fontWeight: 700,
            color: colors.dark,
            margin: 0,
            lineHeight: 1.2,
          }}>
            {component.title}
          </h3>
        </div>

        <p style={{
          fontSize: '0.78rem',
          color: colors.muted,
          lineHeight: 1.5,
          margin: '0 0 12px 0',
          flex: 1,
        }}>
          {component.description}
        </p>

        <div style={{
          display: 'flex',
          gap: '4px',
          flexWrap: 'wrap',
          marginBottom: '12px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: `${component.color}10`,
            padding: '3px 8px',
            borderRadius: '16px',
            fontSize: '0.6rem',
            fontWeight: 600,
            color: component.color,
          }}>
            <span>Seed: {component.weightings.seed.value}</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: `${component.color}10`,
            padding: '3px 8px',
            borderRadius: '16px',
            fontSize: '0.6rem',
            fontWeight: 600,
            color: component.color,
          }}>
            <span>Growth: {component.weightings.growth.value}</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: `${component.color}10`,
            padding: '3px 8px',
            borderRadius: '16px',
            fontSize: '0.6rem',
            fontWeight: 600,
            color: component.color,
          }}>
            <span>Mature: {component.weightings.maturity.value}</span>
          </div>
        </div>

        <button
          style={{
            marginTop: 'auto',
            background: `linear-gradient(135deg, ${component.color}, ${component.color}dd)`,
            color: colors.white,
            border: 'none',
            borderRadius: '8px',
            padding: '8px 14px',
            fontSize: '0.75rem',
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

  return (
    <div style={{
      background: colors.light,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      minHeight: '100vh',
    }}>
      <Header />

      {/* Hero Banner */}
      <section style={{
        position: 'relative',
        padding: '80px 20px 60px',
        background: `linear-gradient(135deg, ${colors.dark} 0%, ${colors.primary} 100%)`,
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1400&h=600&fit=crop&crop=center)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.15,
        }} />
        
        <div style={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.amber}30, transparent)`,
          pointerEvents: 'none',
        }} />
        
        <div style={{
          position: 'absolute',
          bottom: -80,
          left: -80,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.secondary}30, transparent)`,
          pointerEvents: 'none',
        }} />

        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
          opacity: bannerLoaded ? 1 : 0,
          transform: bannerLoaded ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            background: `${colors.amber}25`,
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
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Your Business Credibility Score
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
            fontWeight: 900,
            color: colors.white,
            margin: '0 0 16px',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
          }}>
            The <span style={{ color: colors.amber }}>BIG Score</span>
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 1.5vw, 1.2rem)',
            color: 'rgba(255,255,255,0.7)',
            maxWidth: '600px',
            lineHeight: 1.7,
            margin: '0 0 32px',
          }}>
            The Score That Earns You Trust — Before You Even Pitch. 
            One number that tells funders, partners, and programs everything they need to know about your business readiness.
          </p>

          <div style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
          }}>
            <button
              onClick={() => navigate('/LoginRegister')}
              style={{
                background: `linear-gradient(135deg, ${colors.amber}, ${colors.secondary})`,
                color: colors.white,
                border: 'none',
                borderRadius: '50px',
                padding: '14px 36px',
                fontSize: '0.95rem',
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
              Get Your BIG Score Now <FaArrowRight size={14} />
            </button>
            <button
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: colors.white,
                border: `1px solid rgba(255,255,255,0.2)`,
                borderRadius: '50px',
                padding: '14px 36px',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(8px)',
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
            gap: '32px',
            marginTop: '32px',
            flexWrap: 'wrap',
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
                Trusted by 500+ SMEs
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '40px 20px 60px',
      }}>

        {/* What is BIG Score Section - With Real Images */}
        <section style={{
          backgroundColor: colors.white,
          borderRadius: '20px',
          padding: '40px',
          marginBottom: '40px',
          boxShadow: '0 4px 20px rgba(28,20,16,0.06)',
        }}>
          <h2 style={{
            fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
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
            fontSize: '0.95rem',
            maxWidth: '600px',
            margin: '0 auto 32px',
            lineHeight: 1.6,
          }}>
            A standardized score that validates your business's readiness and trustworthiness — across compliance, governance, and legitimacy.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
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
                  height: '180px',
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
                  padding: '24px',
                  textAlign: 'center',
                }}>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: colors.dark,
                    marginBottom: '8px',
                  }}>
                    {item.title}
                  </h3>
                  <p style={{
                    fontSize: '0.85rem',
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
            padding: '24px',
            marginTop: '24px',
            borderLeft: `4px solid ${colors.amber}`,
          }}>
            <p style={{
              fontSize: '0.95rem',
              lineHeight: 1.7,
              color: colors.dark,
              margin: 0,
              textAlign: 'center',
            }}>
              <strong>Consumer finance has TransUnion and Experian</strong> — global systems that measure personal creditworthiness.<br />
              <strong>Corporates have Moody's, Fitch, and S&P</strong> — rating frameworks that measure institutional risk.<br />
              <strong>SMEs have "The BIG Score"</strong> — a shared metric that lets funders, corporates, and partners speak the same language of readiness and reliability.
            </p>
          </div>
        </section>

        {/* Score Components Section - 5 cards in one row */}
        <section style={{
          backgroundColor: colors.dark,
          borderRadius: '20px',
          padding: '40px',
          marginBottom: '40px',
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(160,112,62,0.15) 0%, transparent 70%)',
        }}>
          <h2 style={{
            fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
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
            fontSize: '0.95rem',
            maxWidth: '600px',
            margin: '0 auto 32px',
            lineHeight: 1.6,
          }}>
            Our AI-powered framework scores every SME across five core dimensions — giving funders, partners, and programs a complete view of business readiness.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '16px',
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
          padding: '40px',
          marginBottom: '40px',
          boxShadow: '0 4px 20px rgba(28,20,16,0.06)',
        }}>
          <h2 style={{
            fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
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
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '24px',
          }}>
            {/* Problems */}
            <div style={{
              background: colors.redBg,
              borderRadius: '16px',
              padding: '24px',
              border: `1px solid ${colors.red}30`,
            }}>
              <h3 style={{
                fontSize: '1.1rem',
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
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.6)',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    fontSize: '0.85rem',
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
              padding: '24px',
              border: `1px solid ${colors.green}30`,
            }}>
              <h3 style={{
                fontSize: '1.1rem',
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
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.6)',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    fontSize: '0.85rem',
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

      
      </div>

      <Footer />

      {/* Popup Modal */}
      {showPopup && popupContent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(28,20,16,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: colors.white,
            borderRadius: '20px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '40px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            position: 'relative',
            animation: 'fadeInUp 0.3s ease-out',
          }}>
            <button
              onClick={closePopup}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
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
            }}>
              <div style={{
                width: '56px',
                height: '56px',
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
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: colors.dark,
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}>
                  {popupContent.title}
                </h2>
                <p style={{
                  fontSize: '0.9rem',
                  color: colors.muted,
                  margin: '4px 0 0',
                }}>
                  {popupContent.description}
                </p>
              </div>
            </div>

            <p style={{
              fontSize: '1rem',
              lineHeight: 1.7,
              color: colors.dark,
              marginBottom: '24px',
              padding: '16px',
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
                fontSize: '1rem',
                fontWeight: 700,
                color: colors.dark,
                marginBottom: '12px',
              }}>
                Weightings by Business Stage
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
              }}>
                <div style={{
                  background: colors.light,
                  borderRadius: '10px',
                  padding: '16px',
                  textAlign: 'center',
                  borderLeft: `3px solid ${colors.primary}`,
                }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.primary }}>
                    {popupContent.weightings.seed.value}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: colors.muted }}>
                    {popupContent.weightings.seed.description}
                  </div>
                </div>
                <div style={{
                  background: colors.light,
                  borderRadius: '10px',
                  padding: '16px',
                  textAlign: 'center',
                  borderLeft: `3px solid ${colors.secondary}`,
                }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.secondary }}>
                    {popupContent.weightings.growth.value}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: colors.muted }}>
                    {popupContent.weightings.growth.description}
                  </div>
                </div>
                <div style={{
                  background: colors.light,
                  borderRadius: '10px',
                  padding: '16px',
                  textAlign: 'center',
                  borderLeft: `3px solid ${colors.amber}`,
                }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.amber }}>
                    {popupContent.weightings.maturity.value}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: colors.muted }}>
                    {popupContent.weightings.maturity.description}
                  </div>
                </div>
              </div>
            </div>

            {/* Sub Components */}
            {popupContent.subComponents && popupContent.subComponents.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: colors.dark,
                  marginBottom: '12px',
                }}>
                  What We Evaluate
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                }}>
                  {popupContent.subComponents.map((sub, index) => (
                    <div
                      key={index}
                      style={{
                        background: colors.light,
                        borderRadius: '10px',
                        padding: '16px',
                        borderTop: `2px solid ${popupContent.color || colors.primary}`,
                      }}
                    >
                      <h4 style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: colors.dark,
                        marginBottom: '4px',
                      }}>
                        {sub.title}
                      </h4>
                      <p style={{
                        fontSize: '0.75rem',
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
                          {sub.items.slice(0, 4).map((item, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: '0.65rem',
                                background: `${popupContent.color || colors.primary}15`,
                                color: popupContent.color || colors.primary,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontWeight: 500,
                              }}
                            >
                              {item}
                            </span>
                          ))}
                          {sub.items.length > 4 && (
                            <span style={{
                              fontSize: '0.65rem',
                              color: colors.muted,
                            }}>
                              +{sub.items.length - 4} more
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
                  fontSize: '1rem',
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
                    fontSize: '0.85rem',
                  }}>
                    <thead>
                      <tr style={{
                        background: colors.dark,
                        color: colors.white,
                      }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left' }}>Score Range</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left' }}>Level</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left' }}>Description</th>
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
                          <td style={{ padding: '10px 14px', fontWeight: 600 }}>{item.range}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: popupContent.color || colors.primary }}>
                            {item.level}
                          </td>
                          <td style={{ padding: '10px 14px', color: colors.muted }}>{item.description}</td>
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
              padding: '16px',
            }}>
              <h3 style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: colors.dark,
                marginBottom: '4px',
              }}>
                Calculation Method
              </h3>
              <p style={{
                fontSize: '0.85rem',
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
      `}</style>
    </div>
  );
};

export default BIGScorePage;