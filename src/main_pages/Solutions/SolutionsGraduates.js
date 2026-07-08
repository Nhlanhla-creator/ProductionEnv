import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaGraduationCap, 
  FaUserGraduate, 
  FaArrowRight, 
  FaCheckCircle,
  FaBuilding,
  FaClipboardList,
  FaChartBar,
  FaChartLine,
  FaRegClock,
  FaGlobeAfrica,
  FaNetworkWired,
  FaLightbulb,
  FaUserTie,
  FaBriefcase,
  FaSearchDollar,
  FaShieldAlt,
  FaUserCheck,
  FaMoneyBillWave,
  FaUniversity,
  FaLandmark,
  FaDonate,
  FaHandshake,
  FaClipboardCheck
} from 'react-icons/fa';
import Header from '../Header';
import Footer from '../Footer';

const SolutionsGraduates = () => {
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
    accentBright: '#D4C0B0',
    brown: '#5D432C',
    brownLight: '#8A6D52',
    brownDark: '#372C27',
    gold: '#C9A96E',
    orange: '#E8831A',
    blue: '#1D5FAA',
  };

  const tabs = [
    { id: 'interns', label: 'Interns', icon: <FaUserGraduate size={18} />, color: colors.accent },
    { id: 'sponsors', label: 'Intern Sponsors', icon: <FaHandshake size={18} />, color: colors.primary },
  ];

  const keySolutions = [
    {
      icon: <FaBriefcase size={24} />,
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&h=250&q=80',
      title: 'Internship Marketplace',
      description: 'Find and apply to internship opportunities with vetted businesses.',
      color: colors.accent,
    },
    {
      icon: <FaUserGraduate size={24} />,
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=400&h=250&q=80',
      title: 'Skills Profiles',
      description: 'Create a verified profile showcasing your skills and experience.',
      color: colors.primary,
    },
    {
      icon: <FaSearchDollar size={24} />,
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&h=250&q=80',
      title: 'Opportunity Matching',
      description: 'Get matched with opportunities that fit your skills and career goals.',
      color: colors.secondary,
    },
  ];

  const benefits = [
    'Create verified profiles',
    'Showcase skills and experience',
    'Access internship opportunities',
    'Match with businesses and growth organisations',
    'Build work experience portfolios',
  ];

  const additionalFeatures = [
    'Profile verification and credibility building',
    'Skill assessment and matching intelligence',
    'Sponsor dashboards for talent visibility',
    'Progress tracking and feedback loops',
    'Talent pipeline analytics'
  ];

  // Intern Sponsors content
  const sponsorSolutions = [
    {
      icon: <FaSearchDollar size={24} />,
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&h=250&q=80',
      title: 'Smarter Intern Matching',
      description: 'We match interns to SMEs based on qualifications, location, career interests, role requirements and workplace readiness.',
      color: colors.primary,
    },
    {
      icon: <FaUserCheck size={24} />,
      image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=400&h=250&q=80',
      title: 'Verified SME Hosts',
      description: 'SMEs are profiled and assessed so interns are placed into businesses that can offer meaningful experience and proper supervision.',
      color: colors.secondary,
    },
    {
      icon: <FaUserGraduate size={24} />,
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=400&h=250&q=80',
      title: 'Intern Readiness Support',
      description: 'Interns can receive readiness guidance before placement, including CV quality, professionalism, workplace behaviour and communication support.',
      color: colors.accent,
    },
    {
      icon: <FaMoneyBillWave size={24} />,
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&h=250&q=80',
      title: 'Stipend & Placement Visibility',
      description: 'Sponsors can track funded interns, placement status, progress updates, SME feedback and programme outcomes from one dashboard.',
      color: colors.brown,
    },
    {
      icon: <FaChartLine size={24} />,
      image: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=400&h=250&q=80',
      title: 'Real-Time Programme Intelligence',
      description: 'BIG gives sponsors visibility into placement rates, absorption potential, regional activity, SME demand, intern progress and programme performance.',
      color: colors.brownDark,
    },
  ];

  const sponsorProblems = [
    'Interns wait too long for placement.',
    'SMEs need capacity but struggle to access suitable young talent.',
    'Sponsors fund programmes but lack real-time visibility into whether interns are placed, supported and absorbed into meaningful work.',
    'The result is a system that too often measures activity, not impact.',
  ];

  const builtFor = [
    {
      icon: <FaBuilding size={22} />,
      title: 'Corporates',
      description: 'For companies funding internships through transformation, ESG, HR, supplier development or CSI initiatives.',
      color: colors.primary,
    },
    {
      icon: <FaUniversity size={22} />,
      title: 'SETAs',
      description: 'For sector education and training authorities that need better placement tracking, reporting, stipend visibility and measurable employment outcomes.',
      color: colors.secondary,
    },
    {
      icon: <FaLandmark size={22} />,
      title: 'Public Institutions',
      description: 'For government departments, municipalities and development agencies supporting youth employment and SME growth.',
      color: colors.brown,
    },
    {
      icon: <FaDonate size={22} />,
      title: 'Foundations and Donors',
      description: 'For funders who want to know whether internship funding is creating real pathways into work.',
      color: colors.brownDark,
    },
  ];

  const howItWorks = [
    {
      title: 'Sponsor creates a programme profile',
      description: 'The sponsor defines funded intern slots, stipend structure, target sectors, regions, reporting needs and programme objectives.',
    },
    {
      title: 'Interns create universal profiles',
      description: 'Graduates capture qualifications, skills, location, interests, documents and work readiness information once.',
    },
    {
      title: 'SMEs register host opportunities',
      description: 'SMEs define the roles they need, supervision capacity, location, industry and required skills.',
    },
    {
      title: 'BIG matches interns to SMEs',
      description: 'The platform recommends suitable matches based on fit, readiness and programme criteria.',
    },
    {
      title: 'Placement progress is tracked',
      description: 'Sponsors, SMEs and interns can monitor onboarding, activity, feedback, attendance, performance and outcomes.',
    },
    {
      title: 'Impact is reported',
      description: 'Dashboards show placement performance, absorption indicators, stipend accountability, SME participation and programme ROI.',
    },
  ];

  const sponsorGains = [
    'Faster intern placement',
    'Better SME-host matching',
    'Reduced admin burden',
    'Clear stipend and placement visibility',
    'Real-time reporting',
    'Stronger audit trail',
    'Better intern absorption potential',
    'Measurable transformation and employment impact',
  ];

  const smeGains = [
    'Access to funded young talent',
    'Extra capacity without carrying full stipend cost',
    'Better-matched interns',
    'Tools to become better hosts',
    'Potential future employees',
  ];

  const internGains = [
    'Real work experience',
    'Better placement fit',
    'Workplace readiness support',
    'Feedback and progress tracking',
    'A stronger pathway into employment',
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
            backgroundImage: 'url(https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1400&h=500&fit=crop&crop=center)',
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
            background: `radial-gradient(circle, ${colors.accent}20, transparent)`,
            pointerEvents: 'none',
          }} />
          
          <div style={{
            position: 'absolute',
            top: -80,
            right: -30,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.amber}15, transparent)`,
            pointerEvents: 'none',
          }} />
          
          <div style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            gap: '40px',
          }}>
            <div style={{
              maxWidth: '600px',
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                background: `${colors.accent}35`,
                border: `1px solid ${colors.accent}60`,
                borderRadius: '30px',
                padding: '8px 20px 8px 14px',
                marginBottom: '24px',
              }}>
                <span style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: colors.accent,
                  display: 'inline-block',
                  animation: 'pulse 2s infinite',
                }} />
                <span style={{
                  color: colors.accent,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}>
                  For Interns & Internship Sponsors
                </span>
              </div>
              
              <h1 style={{
                fontSize: 'clamp(2rem, 4vw, 3.2rem)',
                fontWeight: 900,
                color: colors.white,
                margin: '0 0 20px',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}>
                Experience Should Not <br />
                Depend on <span style={{ color: colors.accent }}>Who You</span> <br />
                Know.
              </h1>
              
              <p style={{
                fontSize: '1.1rem',
                color: 'rgba(255,255,255,0.8)',
                lineHeight: 1.8,
                margin: '0 0 30px',
                maxWidth: '550px',
              }}>
                BIG helps interns create verified profiles, showcase skills, and access 
                opportunities with growth businesses across Africa. Sponsors build sustainable talent pipelines.
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
                    background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentBright})`,
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
                    boxShadow: `0 4px 25px ${colors.accent}50`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = `0 8px 35px ${colors.accent}60`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 4px 25px ${colors.accent}50`;
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
                  <FaCheckCircle size={14} color={colors.accent} />
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                    Free for interns
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaShieldAlt size={14} color={colors.accent} />
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                    Verified profiles
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaGlobeAfrica size={14} color={colors.accent} />
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                    Pan-African opportunities
                  </span>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div style={{
              flex: '0 0 320px',
              height: '260px',
              borderRadius: '16px',
              overflow: 'hidden',
              border: `2px solid ${colors.accent}30`,
            }}>
              <img 
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&h=400&q=80"
                alt="Interns Learning"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <section style={{ marginBottom: '40px' }}>
          <div style={{
            display: 'flex',
            gap: '4px',
            background: colors.white,
            borderRadius: '14px',
            padding: '6px',
            border: `1px solid ${colors.border}`,
            maxWidth: '480px',
            margin: '0 auto',
          }}>
            {tabs.map((tab, index) => (
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
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                  flex: '1',
                  justifyContent: 'center',
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
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* ===================== INTERNS TAB ===================== */}
        <div style={{ display: activeTab === 0 ? 'block' : 'none' }}>
          {/* Benefits Section */}
          <section style={{ marginBottom: '50px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '40px',
              alignItems: 'center',
            }}>
              <div>
                <div style={{
                  marginBottom: '16px',
                }}>
                  <p style={{
                    color: colors.secondary,
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}>
                    Why Interns & Sponsors Choose BIG
                  </p>
                  <h2 style={{
                    fontSize: 'clamp(1.3rem, 2vw, 1.8rem)',
                    fontWeight: 800,
                    color: colors.dark,
                    margin: 0,
                  }}>
                    <span style={{ color: colors.accent }}>Build</span> Your Career & Talent Pipeline
                  </h2>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                }}>
                  {benefits.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 14px',
                        background: colors.white,
                        borderRadius: '10px',
                        border: `1px solid ${colors.border}`,
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = colors.accent;
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = colors.border;
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <FaCheckCircle size={14} color={colors.accent} />
                      <span style={{
                        fontSize: '0.78rem',
                        color: colors.dark,
                        fontWeight: 500,
                      }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Side Image */}
              <div style={{
                borderRadius: '16px',
                overflow: 'hidden',
                height: '280px',
                boxShadow: '0 8px 40px rgba(28,20,16,0.1)',
              }}>
                <img 
                  src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&h=500&q=80"
                  alt="Intern Workspace"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  loading="lazy"
                />
              </div>
            </div>
          </section>

          {/* Key Solutions Section with Images */}
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
                Key Solutions
              </p>
              <h2 style={{
                fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
                fontWeight: 800,
                color: colors.dark,
                margin: 0,
              }}>
                Tools for <span style={{ color: colors.accent }}>Career</span> Success
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
                    overflow: 'hidden',
                    border: `1px solid ${colors.border}`,
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(28,20,16,0.1)';
                    e.currentTarget.style.borderColor = solution.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = colors.border;
                  }}
                >
                  <div style={{
                    height: '140px',
                    overflow: 'hidden',
                    position: 'relative',
                  }}>
                    <img 
                      src={solution.image}
                      alt={solution.title}
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
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>

                  <div style={{
                    padding: '16px 20px 20px',
                  }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: `${solution.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: solution.color,
                      marginBottom: '10px',
                    }}>
                      {solution.icon}
                    </div>
                    <h4 style={{
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      color: colors.dark,
                      margin: '0 0 4px',
                    }}>
                      {solution.title}
                    </h4>
                    <p style={{
                      fontSize: '0.82rem',
                      color: colors.muted,
                      lineHeight: 1.6,
                      margin: 0,
                    }}>
                      {solution.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Additional Features Section */}
          <section style={{ marginBottom: '50px' }}>
            <div style={{
              background: colors.white,
              borderRadius: '16px',
              padding: '40px',
              border: `1px solid ${colors.border}`,
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '40px',
                alignItems: 'center',
              }}>
                <div>
                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: colors.dark,
                    margin: '0 0 16px',
                  }}>
                    Comprehensive <span style={{ color: colors.accent }}>Talent</span> Solutions
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                  }}>
                    {additionalFeatures.map((item, index) => (
                      <div
                        key={index}
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
                        <FaCheckCircle size={12} color={colors.accent} />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  height: '200px',
                }}>
                  <img 
                    src="https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=600&h=400&q=80"
                    alt="Talent Placement Partnership"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </section>

         
        </div>

        {/* ===================== INTERN SPONSORS TAB ===================== */}
        <div style={{ display: activeTab === 1 ? 'block' : 'none' }}>
          {/* Intro Section */}
          <section style={{ marginBottom: '50px' }}>
            <div style={{
              background: colors.white,
              borderRadius: '16px',
              padding: '40px',
              border: `1px solid ${colors.border}`,
            }}>
              <p style={{
                color: colors.secondary,
                fontWeight: 700,
                fontSize: '0.75rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}>
                Intern Sponsors
              </p>
              <h2 style={{
                fontSize: 'clamp(1.3rem, 2vw, 1.8rem)',
                fontWeight: 800,
                color: colors.dark,
                margin: '0 0 16px',
              }}>
                Turn Internship Funding into Measurable <span style={{ color: colors.primary }}>Youth Employment</span> Impact
              </h2>
              <p style={{
                fontSize: '1rem',
                color: colors.muted,
                lineHeight: 1.8,
                marginBottom: '12px',
              }}>
                BIG Marketplace helps corporates, SETAs, public institutions and programme sponsors place funded 
                interns into SMEs where they gain real work experience — not admin busywork.
              </p>
              <p style={{
                fontSize: '1rem',
                color: colors.muted,
                lineHeight: 1.8,
                margin: 0,
              }}>
                We connect intern sponsors, graduates and SMEs through one platform designed for placement quality, 
                stipend accountability and measurable outcomes.
              </p>
            </div>
          </section>

          {/* The Problem Section */}
          <section style={{ marginBottom: '50px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '40px',
              alignItems: 'center',
            }}>
              <div>
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
                    background: `${colors.primary}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.primary,
                  }}>
                    <FaClipboardList size={20} />
                  </div>
                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: colors.dark,
                    margin: 0,
                  }}>
                    The Problem
                  </h3>
                </div>
                <p style={{
                  fontSize: '0.95rem',
                  color: colors.dark,
                  lineHeight: 1.7,
                  marginBottom: '16px',
                  fontWeight: 600,
                }}>
                  Internship funding often exists. The real problem is execution.
                </p>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}>
                  {sponsorProblems.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '12px 16px',
                        background: colors.white,
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        color: colors.dark,
                        lineHeight: 1.5,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <span style={{
                        color: colors.primary,
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        lineHeight: 1,
                      }}>•</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Side Image */}
              <div style={{
                borderRadius: '16px',
                overflow: 'hidden',
                height: '280px',
                boxShadow: '0 8px 40px rgba(28,20,16,0.1)',
              }}>
                <img 
                  src="https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=800&h=500&q=80"
                  alt="Intern Sponsor Partnership"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  loading="lazy"
                />
              </div>
            </div>
          </section>

          {/* BIG Solution - Key Solutions with Images */}
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
                The BIG Solution
              </p>
              <h2 style={{
                fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
                fontWeight: 800,
                color: colors.dark,
                margin: 0,
              }}>
                From Funding to <span style={{ color: colors.primary }}>Measurable</span> Placement
              </h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '20px',
            }}>
              {sponsorSolutions.map((solution, index) => (
                <div
                  key={index}
                  style={{
                    background: colors.white,
                    borderRadius: '14px',
                    overflow: 'hidden',
                    border: `1px solid ${colors.border}`,
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(28,20,16,0.1)';
                    e.currentTarget.style.borderColor = solution.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = colors.border;
                  }}
                >
                  <div style={{
                    height: '140px',
                    overflow: 'hidden',
                    position: 'relative',
                  }}>
                    <img 
                      src={solution.image}
                      alt={solution.title}
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
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>

                  <div style={{
                    padding: '16px 20px 20px',
                  }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: `${solution.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: solution.color,
                      marginBottom: '10px',
                    }}>
                      {solution.icon}
                    </div>
                    <h4 style={{
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      color: colors.dark,
                      margin: '0 0 4px',
                    }}>
                      {solution.title}
                    </h4>
                    <p style={{
                      fontSize: '0.82rem',
                      color: colors.muted,
                      lineHeight: 1.6,
                      margin: 0,
                    }}>
                      {solution.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Built For Section */}
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
                  fontSize: 'clamp(1.3rem, 2vw, 1.8rem)',
                  fontWeight: 800,
                  color: colors.dark,
                  margin: 0,
                }}>
                  Built <span style={{ color: colors.primary }}>For</span>
                </h2>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
              }}>
                {builtFor.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      background: colors.white,
                      borderRadius: '12px',
                      padding: '20px 18px',
                      border: `1px solid ${colors.border}`,
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 30px rgba(28,20,16,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: `${item.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: item.color,
                      marginBottom: '10px',
                    }}>
                      {item.icon}
                    </div>
                    <h4 style={{
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      color: colors.dark,
                      margin: '0 0 6px',
                    }}>
                      {item.title}
                    </h4>
                    <p style={{
                      fontSize: '0.78rem',
                      color: colors.muted,
                      lineHeight: 1.5,
                      margin: 0,
                    }}>
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How It Works Section */}
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
                How It Works
              </p>
              <h2 style={{
                fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
                fontWeight: 800,
                color: colors.dark,
                margin: 0,
              }}>
                From <span style={{ color: colors.primary }}>Programme Profile</span> to Reported Impact
              </h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
            }}>
              {howItWorks.map((step, index) => (
                <div
                  key={index}
                  style={{
                    background: colors.white,
                    borderRadius: '12px',
                    padding: '20px',
                    border: `1px solid ${colors.border}`,
                    display: 'flex',
                    gap: '14px',
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: colors.primary,
                    color: colors.white,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    flexShrink: 0,
                  }}>
                    {index + 1}
                  </div>
                  <div>
                    <h4 style={{
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: colors.dark,
                      margin: '0 0 6px',
                    }}>
                      {step.title}
                    </h4>
                    <p style={{
                      fontSize: '0.8rem',
                      color: colors.muted,
                      lineHeight: 1.5,
                      margin: 0,
                    }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* What You Gain Section */}
          <section style={{ marginBottom: '50px' }}>
            <div style={{
              background: colors.white,
              borderRadius: '16px',
              padding: '40px',
              border: `1px solid ${colors.border}`,
            }}>
              <div style={{
                textAlign: 'center',
                marginBottom: '28px',
              }}>
                <h2 style={{
                  fontSize: 'clamp(1.3rem, 2vw, 1.8rem)',
                  fontWeight: 800,
                  color: colors.dark,
                  margin: 0,
                }}>
                  What Everyone <span style={{ color: colors.primary }}>Gains</span>
                </h2>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '24px',
              }}>
                <div>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: colors.primary,
                    margin: '0 0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <FaHandshake size={16} /> What Sponsors Gain
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sponsorGains.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaCheckCircle size={12} color={colors.primary} />
                        <span style={{ fontSize: '0.82rem', color: colors.dark }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: colors.secondary,
                    margin: '0 0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <FaBuilding size={16} /> What SMEs Gain
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {smeGains.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaCheckCircle size={12} color={colors.secondary} />
                        <span style={{ fontSize: '0.82rem', color: colors.dark }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: colors.accent,
                    margin: '0 0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <FaUserGraduate size={16} /> What Interns Gain
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {internGains.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaCheckCircle size={12} color={colors.accent} />
                        <span style={{ fontSize: '0.82rem', color: colors.dark }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Why BIG Marketplace Section */}
          <section style={{ marginBottom: '50px' }}>
            <div style={{
              background: `linear-gradient(135deg, ${colors.dark}, ${colors.brownDark})`,
              borderRadius: '16px',
              padding: '40px',
              textAlign: 'center',
            }}>
              <div style={{ marginBottom: '16px' }}>
                <FaClipboardCheck size={40} color={colors.amber} />
              </div>
              <h2 style={{
                fontSize: 'clamp(1.3rem, 2vw, 1.8rem)',
                fontWeight: 800,
                color: colors.white,
                margin: '0 0 16px',
              }}>
                Why BIG Marketplace
              </h2>
              <p style={{
                fontSize: '1rem',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.8,
                maxWidth: '650px',
                margin: '0 auto 16px',
              }}>
                Because internship sponsorship should not end at "we paid stipends." It should answer: Did the 
                intern get placed? Was the placement meaningful? Did the SME benefit? Did the intern become more 
                employable? Can we prove the impact?
              </p>
              <p style={{
                fontSize: '0.95rem',
                color: colors.amber,
                fontWeight: 700,
                margin: 0,
              }}>
                BIG Marketplace turns internship sponsorship into visible, trackable and outcome-driven youth employment infrastructure.
              </p>
            </div>
          </section>
        </div>

        {/* CTA Section (shared) */}
        <section style={{
          position: 'relative',
          padding: '50px',
          background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentBright})`,
          borderRadius: '20px',
          textAlign: 'center',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&h=400&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.08,
          }} />
          
          <div style={{
            position: 'relative',
            zIndex: 1,
          }}>
            <h2 style={{
              fontSize: 'clamp(1.3rem, 2vw, 1.8rem)',
              fontWeight: 800,
              color: colors.white,
              margin: '0 0 12px',
            }}>
              Ready to Launch Your Career or Build Your Talent Pipeline?
            </h2>
            <p style={{
              fontSize: '1rem',
              color: 'rgba(255,255,255,0.85)',
              margin: '0 0 24px',
              maxWidth: '450px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              Join BIG Marketplace and connect with opportunities that will kickstart your career or help you find the right talent.
            </p>
            <button
              onClick={() => navigate('/LoginRegister')}
              style={{
                background: colors.white,
                color: colors.accent,
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
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default SolutionsGraduates;