import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaBuilding, 
  FaUsers, 
  FaHandshake, 
  FaRocket, 
  FaChartBar,
  FaArrowRight, 
  FaCheckCircle,
  FaRegClock,
  FaGlobeAfrica,
  FaShieldAlt,
  FaNetworkWired,
  FaClock,
  FaUserEdit,
  FaFileContract,
  FaLock,
  FaUserSecret,
  FaDatabase
} from 'react-icons/fa';
import Header from './Header';
import Footer from './Footer';

const HowItWorksAssociations = () => {
  const navigate = useNavigate();

  const handleGetScoreClick = () => {
    navigate('/LoginRegister');
  };

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
    green: '#1E7A47',
    orange: '#E8831A',
    red: '#BE3B2A',
    blue: '#1D5FAA',
    brown: '#5D432C',
    brownLight: '#8A6D52',
    brownDark: '#372C27',
    gold: '#C9A96E',
  };

  const steps = [
    {
      number: '01',
      title: 'Step 1',
      description: 'Configure membership categories, fees, approval workflows, committees, events, branding, and communications.',
      image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=250&fit=crop',
      icon: <FaBuilding size={22} />,
      color: colors.primary,
      details: ['Membership categories', 'Fees & billing', 'Approval workflows', 'Committees & Events', 'Branding & Communications'],
      subtext: '🔧 Fully digital administration'
    },
    {
      number: '02',
      title: 'Step 2',
      description: 'Members create rich profiles while BIG verifies key information. Upload compliance docs, certifications, and capabilities.',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=250&fit=crop',
      icon: <FaUsers size={22} />,
      color: colors.brown,
      details: ['Compliance documents', 'Certifications', 'Products & services', 'Industry capabilities', 'Funding & procurement interests'],
      subtext: '🔒 Verified & secure network'
    },
    {
      number: '03',
      title: 'Step 3',
      description: 'BIG intelligently connects members with customers, investors, procurement, advisors, interns, and strategic partners.',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop',
      icon: <FaHandshake size={22} />,
      color: colors.amber,
      details: ['Customers & Investors', 'Procurement opportunities', 'Advisors & Service providers', 'Interns & Graduates', 'Strategic partnerships'],
      subtext: '🤝 Data-driven connections'
    },
    {
      number: '04',
      title: 'Step 4',
      description: 'Support members with funding readiness, supplier readiness, AI-powered insights, growth support, and business tools.',
      image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=250&fit=crop',
      icon: <FaRocket size={22} />,
      color: colors.green,
      details: ['Funding readiness', 'Supplier readiness', 'AI-powered insights', 'Growth support', 'Business tools & knowledge'],
      subtext: '📈 Beyond event engagement'
    },
    {
      number: '05',
      title: 'Step 5',
      description: 'Monitor membership growth, renewal rates, engagement, programme participation, opportunity outcomes, and ecosystem health.',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
      icon: <FaChartBar size={22} />,
      color: colors.blue,
      details: ['Membership growth', 'Renewal rates', 'Engagement tracking', 'Programme outcomes', 'Ecosystem health insights'],
      subtext: '📊 Real-time analytics'
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
          minHeight: '380px',
          background: `linear-gradient(135deg, ${colors.dark} 0%, rgba(28,20,16,0.92) 100%)`,
          display: 'flex',
          alignItems: 'center',
          padding: '40px 50px',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1400&h=500&fit=crop&crop=center)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.25,
            zIndex: 0,
          }} />
          
          <div style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.amber}20, transparent)`,
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            bottom: -80,
            left: -30,
            width: 250,
            height: 250,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.primary}20, transparent)`,
            pointerEvents: 'none',
          }} />

          <div style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: '650px',
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: `${colors.amber}25`,
              border: `1px solid ${colors.amber}50`,
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
                For Associations & Member Organisations
              </span>
            </div>
            
            <h1 style={{
              fontSize: 'clamp(2rem, 4.5vw, 3rem)',
              fontWeight: 900,
              color: colors.white,
              margin: '0 0 16px',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}>
              How <span style={{ color: colors.amber }}>BIG</span> Works <br />
              for Associations
            </h1>
            
            <p style={{
              fontSize: '1.05rem',
              color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.7,
              margin: '0 0 28px',
              maxWidth: '500px',
            }}>
              Manage your association, activate your ecosystem, and measure your impact — all from one platform.
            </p>

            <div style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
            }}>
              <button
                onClick={handleGetScoreClick}
                style={{
                  background: `linear-gradient(135deg, ${colors.amber}, ${colors.secondary})`,
                  color: colors.white,
                  border: 'none',
                  borderRadius: '50px',
                  padding: '14px 36px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.3s ease',
                  boxShadow: `0 4px 20px ${colors.amber}40`,
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
                Get Started Now
                <FaArrowRight size={14} />
              </button>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.85rem',
              }}>
                <FaClock size={14} /> Quick setup • Free to join
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '24px',
              marginTop: '24px',
              flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaCheckCircle size={14} color={colors.amber} />
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                  Trusted by leading associations
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaShieldAlt size={14} color={colors.amber} />
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                  Data-driven insights
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
              width: '240px',
              height: '240px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: `3px solid ${colors.amber}40`,
              boxShadow: `0 20px 60px rgba(0,0,0,0.3)`,
            }}>
              <img
                src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=240&h=240&fit=crop&crop=center"
                alt="Association Collaboration"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
            <div style={{
              position: 'absolute',
              bottom: -5,
              right: -5,
              background: colors.amber,
              color: colors.white,
              padding: '6px 14px',
              borderRadius: '50px',
              fontSize: '0.7rem',
              fontWeight: 700,
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            }}>
              ⭐ 4.9/5 Rating
            </div>
          </div>
        </section>

        {/* Steps Section - 5 steps with images */}
        <div style={{ marginBottom: '50px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <p style={{
              color: colors.secondary,
              fontWeight: 700,
              fontSize: '0.75rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              Your Association Journey
            </p>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: 0,
              letterSpacing: '-0.01em',
            }}>
              Manage Your Association. <span style={{ color: colors.primary }}>Grow Your Ecosystem.</span>
            </h2>
            <p style={{
              fontSize: '0.95rem',
              color: colors.muted,
              marginTop: '8px',
            }}>
              From onboarding members to measuring impact — a complete platform for association success
            </p>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '16px',
          }}>
            {steps.map((step, index) => (
              <div
                key={index}
                style={{
                  background: colors.white,
                  borderRadius: '14px',
                  overflow: 'hidden',
                  border: `1px solid ${colors.border}`,
                  transition: 'all 0.3s ease',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(28,20,16,0.12)';
                  e.currentTarget.style.borderColor = step.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = colors.border;
                }}
              >
                {/* Step Image */}
                <div style={{
                  height: '130px',
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <img 
                    src={step.image}
                    alt={step.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.5s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '40%',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.3))',
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: step.color,
                    color: colors.white,
                    padding: '2px 10px',
                    borderRadius: '20px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                  }}>
                    {step.number}
                  </div>
                </div>

                <div style={{
                  padding: '12px 14px 16px',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '6px',
                  }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: `${step.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: step.color,
                      fontSize: '12px',
                    }}>
                      {step.icon}
                    </div>
                    <h4 style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: step.color,
                      margin: 0,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      {step.title}
                    </h4>
                  </div>
                  
                  <p style={{
                    fontSize: '0.7rem',
                    color: colors.muted,
                    lineHeight: 1.4,
                    margin: '0 0 8px',
                    minHeight: '40px',
                  }}>
                    {step.description}
                  </p>

                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '3px',
                    marginBottom: '8px',
                  }}>
                    {step.details.map((detail, i) => (
                      <span
                        key={i}
                        style={{
                          background: `${step.color}10`,
                          color: step.color,
                          padding: '1px 6px',
                          borderRadius: '50px',
                          fontSize: '0.5rem',
                          fontWeight: 600,
                        }}
                      >
                        {detail}
                      </span>
                    ))}
                  </div>

                  <p style={{
                    fontSize: '0.62rem',
                    color: colors.muted,
                    fontStyle: 'italic',
                    margin: 0,
                    paddingTop: '6px',
                    borderTop: `1px solid ${colors.border}`,
                  }}>
                    {step.subtext}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 🚀 REGISTER NOW CTA */}
        <section style={{
          marginBottom: '50px',
          padding: '40px',
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
          borderRadius: '20px',
          textAlign: 'center',
        }}>
          <h2 style={{
            fontSize: 'clamp(1.5rem, 2.5vw, 2.2rem)',
            fontWeight: 800,
            color: colors.white,
            margin: '0 0 12px',
          }}>
            Ready to Transform Your Association?
          </h2>
          <p style={{
            fontSize: '1rem',
            color: 'rgba(255,255,255,0.85)',
            margin: '0 0 24px',
            maxWidth: '500px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Join leading associations already using BIG to streamline operations and grow their ecosystems.
          </p>
          <button
            onClick={handleGetScoreClick}
            style={{
              background: colors.white,
              color: colors.primary,
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
            Register Now <FaArrowRight size={14} />
          </button>
        </section>

        {/* 🛡️ SECURITY SECTION - 4 blocks in one row */}
        <section style={{
          marginBottom: '50px',
          padding: '50px 30px',
          background: colors.white,
          borderRadius: '20px',
          boxShadow: '0 4px 30px rgba(0,0,0,0.05)',
          border: `1px solid ${colors.border}`,
        }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: `${colors.blue}15`,
              border: `1px solid ${colors.blue}30`,
              borderRadius: '30px',
              padding: '6px 18px 6px 12px',
              marginBottom: '14px',
            }}>
              <FaBuilding size={14} color={colors.blue} />
              <span style={{
                color: colors.blue,
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                Your Data Is Protected
              </span>
            </div>
            
            <h2 style={{
              fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: '0 0 8px',
              letterSpacing: '-0.01em',
            }}>
              How <span style={{ color: colors.blue }}>BIG Keeps</span> Your Association Safe
            </h2>
            <p style={{
              fontSize: '0.95rem',
              color: colors.muted,
              maxWidth: '600px',
              margin: '0 auto',
            }}>
              We protect your association and member data with enterprise-grade security.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px',
          }}>
            <div style={{
              background: colors.light,
              borderRadius: '14px',
              padding: '22px 18px',
              border: `1px solid ${colors.border}`,
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: `${colors.blue}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.blue,
                marginBottom: '14px',
              }}>
                <FaFileContract size={22} />
              </div>
              <h4 style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: colors.dark,
                margin: '0 0 6px',
              }}>
                Enterprise Encryption
              </h4>
              <p style={{
                fontSize: '0.82rem',
                color: colors.muted,
                lineHeight: 1.6,
                margin: 0,
              }}>
                All association and member data is encrypted both in transit and at rest using enterprise-grade security standards.
              </p>
            </div>

            <div style={{
              background: colors.light,
              borderRadius: '14px',
              padding: '22px 18px',
              border: `1px solid ${colors.border}`,
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: `${colors.green}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.green,
                marginBottom: '14px',
              }}>
                <FaGlobeAfrica size={22} />
              </div>
              <h4 style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: colors.dark,
                margin: '0 0 6px',
              }}>
                POPIA Compliance
              </h4>
              <p style={{
                fontSize: '0.82rem',
                color: colors.muted,
                lineHeight: 1.6,
                margin: 0,
              }}>
                Designed with privacy and compliance in mind, including consent management and secure handling of personal information in accordance with POPIA.
              </p>
            </div>

            <div style={{
              background: colors.light,
              borderRadius: '14px',
              padding: '22px 18px',
              border: `1px solid ${colors.border}`,
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: `${colors.amber}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.amber,
                marginBottom: '14px',
              }}>
                <FaUserSecret size={22} />
              </div>
              <h4 style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: colors.dark,
                margin: '0 0 6px',
              }}>
                Role-Based Access Controls
              </h4>
              <p style={{
                fontSize: '0.82rem',
                color: colors.muted,
                lineHeight: 1.6,
                margin: 0,
              }}>
                Sensitive information is only accessible to authorised users based on permissions and roles. Your data stays protected.
              </p>
            </div>

            <div style={{
              background: colors.light,
              borderRadius: '14px',
              padding: '22px 18px',
              border: `1px solid ${colors.border}`,
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: `${colors.orange}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.orange,
                marginBottom: '14px',
              }}>
                <FaDatabase size={22} />
              </div>
              <h4 style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: colors.dark,
                margin: '0 0 6px',
              }}>
                You Own Your Data
              </h4>
              <p style={{
                fontSize: '0.82rem',
                color: colors.muted,
                lineHeight: 1.6,
                margin: 0,
              }}>
                Your association data remains yours. You can export or request deletion of your data at any time.
              </p>
            </div>
          </div>

          <div style={{
            marginTop: '24px',
            padding: '16px 24px',
            background: `${colors.blue}08`,
            borderRadius: '12px',
            border: `1px solid ${colors.blue}20`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '24px',
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaLock size={16} color={colors.blue} />
              <span style={{ fontSize: '0.8rem', color: colors.muted }}>Multi-Factor Authentication</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaShieldAlt size={16} color={colors.green} />
              <span style={{ fontSize: '0.8rem', color: colors.muted }}>Strict Access Controls</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaRegClock size={16} color={colors.amber} />
              <span style={{ fontSize: '0.8rem', color: colors.muted }}>Continuous Monitoring</span>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default HowItWorksAssociations;