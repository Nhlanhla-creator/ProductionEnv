import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaHandshake, 
  FaBuilding, 
  FaArrowRight, 
  FaCheckCircle,
  FaShieldAlt,
  FaSearchDollar,
  FaClipboardList,
  FaChartBar,
  FaRegClock,
  FaGlobeAfrica,
  FaFileContract,
  FaNetworkWired,
  FaUsers,
  FaUserTie,
  FaGraduationCap,
  FaRocket,
  FaDatabase,
  FaLightbulb,
  FaBriefcase,
  FaHeart,
  FaUserGraduate
} from 'react-icons/fa';
import Header from '../Header';
import Footer from '../Footer';

const SolutionsCorporates = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const colors = {
    dark: '#1C1410',
    primary: '#7C4D2A',
    secondary: '#A0703E',
    amber: '#D4894A',
    light: '#F5F0E8',
    cream: '#FAF7F2',
    white: '#FFFFFF',
    border: '#EAE2D8',
    muted: '#7A6A5E',
    neutral: '#CDC3B8',
    accent: '#C4B09A',
    brown: '#5D432C',
    brownLight: '#8A6D52',
    brownDark: '#372C27',
    gold: '#C9A96E',
    orange: '#E8831A',
    blue: '#1D5FAA',
  };

  const keySolutions = [
    {
      icon: <FaNetworkWired size={24} />,
      title: 'ESD Platform',
      description: 'Manage enterprise and supplier development programs end-to-end.',
      color: colors.brown,
    },
    {
      icon: <FaSearchDollar size={24} />,
      title: 'Supplier Intelligence',
      description: 'Access pre-vetted supplier pipelines with full visibility and risk assessment.',
      color: colors.primary,
    },
    {
      icon: <FaDatabase size={24} />,
      title: 'Portfolio Intelligence',
      description: 'Track supplier performance and development outcomes across your portfolio.',
      color: colors.secondary,
    },
    {
      icon: <FaGraduationCap size={24} />,
      title: 'Internship Management',
      description: 'Manage internship programs and build talent pipelines efficiently.',
      color: colors.brownDark,
    },
    {
      icon: <FaLightbulb size={24} />,
      title: 'Market Intelligence',
      description: 'Stay informed with real-time market trends and ecosystem insights.',
      color: colors.amber,
    },
  ];

  const tabData = [
    {
      id: 'procurement',
      label: 'Procurement & Supply Chain',
      icon: <FaHandshake size={18} />,
      color: colors.brown,
      description: 'Supplier Intelligence and Performance Infrastructure',
      intro: "Modern procurement teams don't suffer from a lack of suppliers. They suffer from a lack of trusted, procurement-ready suppliers.",
      questions: [
        'Can we shortlist them?',
        'Can we onboard them?',
        'Can we improve them?',
        'Can we create opportunities for them?'
      ],
      questionDetails: [
        'Using BIG Score, our AI-assisted supplier intelligence and desktop pre-vetting engine.',
        'Using BIG Verified, our enhanced validation process combining technology, verification partners, and due diligence expertise.',
        'Using Growth Suite to support supplier performance, operational maturity, governance, and scalability.',
        'Using Marketplace matching to align suppliers with procurement opportunities and sourcing requirements.'
      ],
      capabilities: [
        'Supplier pre-vetting and intelligence',
        'Compliance management and document vault',
        'Automated expiry tracking and reminders',
        'Supplier matching and discovery',
        'RFP and sourcing support',
        'Portfolio analytics and reporting',
        'Supplier performance monitoring',
        'Development and intervention tracking',
        'Supply chain risk visibility'
      ]
    },
    {
      id: 'esd',
      label: 'Enterprise & Supplier Development',
      icon: <FaBuilding size={18} />,
      color: colors.primary,
      description: 'From Programme Activity to Supplier Outcomes',
      intro: "Many supplier development programmes measure participation. Few measure outcomes. Attendance, workshops, and graduation rates are easy to report. Revenue growth, procurement conversion, business survival, and second customers are much harder.",
      questions: [
        'Who should enter the programme?',
        'Who is genuinely procurement or investment ready?',
        'Is the support actually working?',
        'What happens after graduation?'
      ],
      questionDetails: [
        'Using BIG Score to identify businesses with the highest potential and readiness.',
        'Using BIG Verified to validate claims and reduce programme risk.',
        'Using Growth Suite to measure operational, financial, and strategic progress over time.',
        'Using Marketplace and portfolio intelligence to maintain visibility and create ongoing opportunities.'
      ],
      capabilities: [
        'SME diagnostics and intake assessments',
        'Readiness and maturity scoring',
        'Compliance and legitimacy verification',
        'Development planning and tracking',
        'Post-programme monitoring',
        'Impact reporting',
        'Procurement pipeline integration',
        'Capital readiness tracking',
        'Longitudinal outcome measurement'
      ]
    },
    {
      id: 'csi',
      label: 'CSI, CSR & Impact',
      icon: <FaHeart size={18} />,
      color: colors.brownDark,
      description: 'Measuring Outcomes Beyond Spend',
      intro: "Most organisations can report how much money was spent. Far fewer can confidently report what changed. Impact teams increasingly need evidence of outcomes, sustainability, and long-term community value creation.",
      questions: [
        'Who are we supporting?',
        'Are interventions creating measurable change?',
        'Can we validate impact claims?',
        'What happens after funding ends?'
      ],
      questionDetails: [
        'Using BIG Score to understand baseline conditions and identify priorities.',
        'Using Growth Suite to track progress over time.',
        'Using BIG Verified and supporting evidence collection.',
        'Using Marketplace to connect beneficiaries to new opportunities and support ecosystems.'
      ],
      capabilities: [
        'Beneficiary onboarding and profiling',
        'Impact baseline assessments',
        'Outcome tracking',
        'Evidence collection',
        'Portfolio reporting',
        'Longitudinal impact measurement',
        'Community intelligence dashboards',
        'ESG and sustainability reporting support'
      ]
    },
    {
      id: 'talent',
      label: 'Graduate Placement & Talent',
      icon: <FaUserGraduate size={18} />,
      color: colors.amber,
      description: 'Turning Potential into Experience',
      intro: "Every year graduates struggle to gain experience. At the same time, SMEs struggle to access affordable talent. BIG connects graduates, SMEs, sponsors, and employers through a shared ecosystem designed around outcomes rather than placements alone.",
      questions: [
        'Who should we support?',
        'Where should they be placed?',
        'Are they developing?',
        'What happened afterwards?'
      ],
      questionDetails: [
        'Using profiles, assessments, and matching intelligence.',
        'Using capability and opportunity matching.',
        'Using Growth Suite and structured progress tracking.',
        'Using portfolio intelligence to measure long-term outcomes.'
      ],
      capabilities: [
        'Graduate profiling and onboarding',
        'Internship and placement matching',
        'Sponsor dashboards',
        'Progress tracking',
        'Skills development monitoring',
        'Outcome measurement',
        'Employer feedback loops',
        'Talent pipeline analytics'
      ]
    }
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: colors.light,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <Header />
      
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        flex: '1',
        width: '100%',
      }}>
        {/* Hero Section */}
        <section style={{
          position: 'relative',
          borderRadius: '20px',
          overflow: 'hidden',
          marginBottom: '50px',
          minHeight: '350px',
          background: `linear-gradient(135deg, ${colors.dark} 0%, ${colors.brownDark} 100%)`,
          display: 'flex',
          alignItems: 'center',
          padding: '50px 60px',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&h=500&fit=crop&crop=center)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.12,
            zIndex: 0,
          }} />
          
          <div style={{
            position: 'absolute',
            bottom: -60,
            left: -40,
            width: 350,
            height: 350,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.amber}15, transparent)`,
            pointerEvents: 'none',
          }} />
          
          <div style={{
            position: 'absolute',
            top: -80,
            right: -30,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.brown}20, transparent)`,
            pointerEvents: 'none',
          }} />
          
          <div style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: '700px',
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: `${colors.amber}30`,
              border: `1px solid ${colors.amber}50`,
              borderRadius: '30px',
              padding: '8px 20px 8px 14px',
              marginBottom: '24px',
            }}>
              <span style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: colors.amber,
                display: 'inline-block',
                animation: 'pulse 2s infinite',
              }} />
              <span style={{
                color: colors.amber,
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}>
                For Corporates
              </span>
            </div>
            
            <h1 style={{
              fontSize: 'clamp(2.2rem, 4.5vw, 3.2rem)',
              fontWeight: 900,
              color: colors.white,
              margin: '0 0 20px',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}>
              Building Better Suppliers, <br />
              <span style={{ color: colors.amber }}>Better Programmes</span> <br />
              and Better Outcomes
            </h1>
            
            <p style={{
              fontSize: '1.1rem',
              color: 'rgba(255,255,255,0.8)',
              lineHeight: 1.8,
              margin: '0 0 30px',
              maxWidth: '550px',
            }}>
              Corporates across Africa are investing billions into supplier development, transformation, 
              community impact, and talent programmes. BIG provides the trust infrastructure, intelligence, 
              and execution layer that connects these ecosystems together.
            </p>

            <div style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}>
              <button
                onClick={() => navigate('/LoginRegister')}
                style={{
                  background: `linear-gradient(135deg, ${colors.amber}, ${colors.gold})`,
                  color: colors.white,
                  border: 'none',
                  borderRadius: '50px',
                  padding: '16px 40px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.3s ease',
                  boxShadow: `0 4px 25px ${colors.amber}50`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = `0 8px 35px ${colors.amber}60`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 4px 25px ${colors.amber}50`;
                }}
              >
                Get Started Today
                <FaArrowRight size={14} />
              </button>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.85rem',
              }}>
                <FaRegClock size={14} /> Quick setup • Free to join
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '30px',
              marginTop: '28px',
              flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaCheckCircle size={14} color={colors.amber} />
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                  Trusted by leading corporates
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaShieldAlt size={14} color={colors.amber} />
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                  Verified suppliers
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaGlobeAfrica size={14} color={colors.amber} />
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                  African supply chain focus
                </span>
              </div>
            </div>
          </div>

          <div style={{
            position: 'relative',
            zIndex: 1,
            marginLeft: 'auto',
            display: 'none',
            '@media (min-width: 1024px)': {
              display: 'block',
            },
          }}>
            <div style={{
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${colors.amber}30, ${colors.gold}20)`,
              border: `2px solid ${colors.amber}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              padding: '20px',
            }}>
              <div style={{ fontSize: '3rem', color: colors.amber, marginBottom: '8px' }}>🏢</div>
              <div style={{ color: colors.white, fontSize: '0.9rem', fontWeight: 700, textAlign: 'center' }}>
                Stronger <br />Ecosystems
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', marginTop: '4px' }}>
                Powered by BIG
              </div>
            </div>
          </div>
        </section>

        {/* The Challenge Section */}
        <section style={{ marginBottom: '50px' }}>
          <div style={{
            background: colors.white,
            borderRadius: '16px',
            padding: '40px',
            border: `1px solid ${colors.border}`,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px',
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: `${colors.amber}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.amber,
              }}>
                <FaClipboardList size={20} />
              </div>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                color: colors.dark,
                margin: 0,
              }}>
                The Challenge
              </h3>
            </div>
            <p style={{
              fontSize: '1rem',
              color: colors.muted,
              lineHeight: 1.8,
              marginBottom: '16px',
            }}>
              Corporates across Africa are investing billions into supplier development, transformation, community impact, and talent programmes.
              Yet many face the same challenge:
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
            }}>
              {[
                'Suppliers remain difficult to assess and onboard.',
                'Development programmes struggle to produce procurement-ready businesses.',
                'Impact programmes struggle to measure long-term outcomes.',
                'Graduate programmes struggle to connect talent with meaningful opportunities.',
                'Data sits across spreadsheets, emails, portals, and disconnected systems.'
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '12px 16px',
                    background: `${colors.light}`,
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    color: colors.dark,
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{
                    color: colors.amber,
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    lineHeight: 1,
                  }}>•</span>
                  {item}
                </div>
              ))}
            </div>
            <p style={{
              fontSize: '1rem',
              color: colors.dark,
              lineHeight: 1.8,
              marginTop: '16px',
              fontWeight: 600,
            }}>
              BIG Marketplace provides the trust infrastructure, intelligence, and execution layer that connects these ecosystems together.
            </p>
          </div>
        </section>

        {/* Tabs Section */}
        <section style={{ marginBottom: '50px' }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '32px',
          }}>
            <p style={{
              color: colors.secondary,
              fontWeight: 700,
              fontSize: '0.75rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              Our Corporate Solutions
            </p>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: 0,
            }}>
              <span style={{ color: colors.brown }}>End-to-End</span> Solutions for Every Department
            </h2>
          </div>

          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            gap: '4px',
            background: colors.white,
            borderRadius: '14px',
            padding: '6px',
            border: `1px solid ${colors.border}`,
            marginBottom: '30px',
            overflowX: 'auto',
            flexWrap: 'nowrap',
          }}>
            {tabData.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(index)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === index ? tab.color : 'transparent',
                  color: activeTab === index ? colors.white : colors.muted,
                  fontWeight: activeTab === index ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                  flex: '1',
                  justifyContent: 'center',
                  minWidth: '120px',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== index) {
                    e.currentTarget.style.background = `${tab.color}10`;
                    e.currentTarget.style.color = tab.color;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== index) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = colors.muted;
                  }
                }}
              >
                <span style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {tabData.map((tab, index) => (
            <div
              key={tab.id}
              style={{
                display: activeTab === index ? 'block' : 'none',
                animation: 'fadeIn 0.4s ease',
              }}
            >
              <div style={{
                background: colors.white,
                borderRadius: '16px',
                padding: '40px',
                border: `1px solid ${colors.border}`,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  marginBottom: '8px',
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: `${tab.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: tab.color,
                  }}>
                    {tab.icon}
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: colors.dark,
                      margin: 0,
                    }}>
                      {tab.label}
                    </h3>
                    <p style={{
                      fontSize: '0.9rem',
                      color: colors.muted,
                      margin: '4px 0 0',
                    }}>
                      {tab.description}
                    </p>
                  </div>
                </div>

                <div style={{
                  borderTop: `1px solid ${colors.border}`,
                  marginTop: '20px',
                  paddingTop: '24px',
                }}>
                  <p style={{
                    fontSize: '1rem',
                    color: colors.dark,
                    lineHeight: 1.8,
                    marginBottom: '24px',
                  }}>
                    {tab.intro}
                  </p>

                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: colors.dark,
                    marginBottom: '16px',
                  }}>
                    Key Questions Answered:
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '16px',
                    marginBottom: '28px',
                  }}>
                    {tab.questions.map((question, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: `${tab.color}08`,
                          borderRadius: '10px',
                          padding: '16px 20px',
                          borderLeft: `4px solid ${tab.color}`,
                        }}
                      >
                        <p style={{
                          fontWeight: 700,
                          color: colors.dark,
                          fontSize: '0.95rem',
                          margin: '0 0 6px',
                        }}>
                          {question}
                        </p>
                        <p style={{
                          fontSize: '0.85rem',
                          color: colors.muted,
                          margin: 0,
                          lineHeight: 1.6,
                        }}>
                          {tab.questionDetails[idx]}
                        </p>
                      </div>
                    ))}
                  </div>

                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: colors.dark,
                    marginBottom: '14px',
                  }}>
                    Key Capabilities:
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px',
                  }}>
                    {tab.capabilities.map((capability, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 14px',
                          background: colors.light,
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          color: colors.dark,
                        }}
                      >
                        <FaCheckCircle size={12} color={tab.color} />
                        {capability}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Why BIG Section */}
        <section style={{ marginBottom: '50px' }}>
          <div style={{
            background: `linear-gradient(135deg, ${colors.light}, ${colors.cream})`,
            borderRadius: '16px',
            padding: '40px',
            border: `1px solid ${colors.border}`,
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '24px',
            }}>
              <h2 style={{
                fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
                fontWeight: 800,
                color: colors.dark,
                margin: 0,
              }}>
                Why <span style={{ color: colors.brown }}>BIG Marketplace</span>?
              </h2>
            </div>
            <p style={{
              fontSize: '1rem',
              color: colors.muted,
              lineHeight: 1.8,
              textAlign: 'center',
              maxWidth: '650px',
              margin: '0 auto 24px',
            }}>
              Most organisations already have systems. The problem is that those systems rarely talk to each other.
              BIG doesn't replace what works. BIG connects what exists.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
            }}>
              {[
                'Trust infrastructure',
                'Supplier intelligence',
                'Performance optimisation',
                'Portfolio visibility',
                'Opportunity creation',
                'Ecosystem analytics'
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: colors.white,
                    borderRadius: '10px',
                    padding: '16px 20px',
                    textAlign: 'center',
                    border: `1px solid ${colors.border}`,
                    fontWeight: 600,
                    color: colors.dark,
                    fontSize: '0.95rem',
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
            <p style={{
              fontSize: '0.95rem',
              color: colors.brown,
              textAlign: 'center',
              marginTop: '20px',
              fontWeight: 700,
            }}>
              Into a single, connected platform.
            </p>
          </div>
        </section>

        {/* Key Solutions Section */}
        <section style={{ marginBottom: '50px' }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '32px',
          }}>
            <p style={{
              color: colors.secondary,
              fontWeight: 700,
              fontSize: '0.75rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              The BIG Framework
            </p>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: 0,
            }}>
              Powerful Tools for <span style={{ color: colors.brown }}>Corporate</span> Success
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
          }}>
            {keySolutions.map((solution, index) => (
              <div
                key={index}
                style={{
                  background: colors.white,
                  borderRadius: '14px',
                  padding: '24px 20px',
                  border: `1px solid ${colors.border}`,
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(28,20,16,0.08)';
                  e.currentTarget.style.borderColor = solution.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = colors.border;
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: `${solution.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: solution.color,
                  marginBottom: '12px',
                }}>
                  {solution.icon}
                </div>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: colors.dark,
                  margin: '0 0 6px',
                }}>
                  {solution.title}
                </h4>
                <p style={{
                  fontSize: '0.85rem',
                  color: colors.muted,
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  {solution.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Building Africa's Trust Economy Section */}
        <section style={{ marginBottom: '50px' }}>
          <div style={{
            background: `linear-gradient(135deg, ${colors.dark}, ${colors.brownDark})`,
            borderRadius: '16px',
            padding: '40px',
            textAlign: 'center',
          }}>
            <div style={{ marginBottom: '16px' }}>
              <FaGlobeAfrica size={40} color={colors.amber} />
            </div>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
              fontWeight: 800,
              color: colors.white,
              margin: '0 0 16px',
            }}>
              Building Africa's Trust Economy
            </h2>
            <p style={{
              fontSize: '1rem',
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.8,
              maxWidth: '650px',
              margin: '0 auto 20px',
            }}>
              BIG Marketplace exists to help organisations move from fragmented processes and isolated interventions 
              toward connected ecosystems that create measurable outcomes.
            </p>
            <div style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              <div style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.9rem',
                fontStyle: 'italic',
              }}>
                "Because growth shouldn't be accidental."
              </div>
              <div style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.9rem',
                fontStyle: 'italic',
              }}>
                "And impact shouldn't disappear when the programme ends."
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={{
          padding: '40px',
          background: `linear-gradient(135deg, ${colors.brown}, ${colors.brownLight})`,
          borderRadius: '20px',
          textAlign: 'center',
        }}>
          <h2 style={{
            fontSize: 'clamp(1.3rem, 2vw, 1.8rem)',
            fontWeight: 800,
            color: colors.white,
            margin: '0 0 12px',
          }}>
            Ready to Build Stronger Supplier Ecosystems?
          </h2>
          <p style={{
            fontSize: '1rem',
            color: 'rgba(255,255,255,0.85)',
            margin: '0 0 24px',
            maxWidth: '450px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Join leading corporates already using BIG to transform their supply chains.
          </p>
          <button
            onClick={() => navigate('/LoginRegister')}
            style={{
              background: colors.white,
              color: colors.brown,
              border: 'none',
              borderRadius: '50px',
              padding: '16px 48px',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
            }}
          >
            Get Started <FaArrowRight size={14} />
          </button>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default SolutionsCorporates;