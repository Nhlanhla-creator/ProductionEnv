import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClipboardList, FaUserFriends, FaChartBar, FaArrowRight, FaRocket, FaCheckCircle, FaClock, FaShieldAlt, FaLock, FaDatabase, FaUserSecret, FaRegClock, FaGlobeAfrica, FaFileContract, FaUsers, FaLightbulb } from 'react-icons/fa';
import Header from './Header';
import Footer from './Footer';

const HowItWorksCatalysts = () => {
  const navigate = useNavigate();

  const handleButtonClick = () => {
    navigate('/login');
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
    warmGray: '#9E8D7B'
  };

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
            backgroundImage: 'url(https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1400&h=500&fit=crop&crop=center)',
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
                For Catalysts & Business Associations
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
              for Catalysts
            </h1>
            
            <p style={{
              fontSize: '1.05rem',
              color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.7,
              margin: '0 0 28px',
              maxWidth: '500px',
            }}>
              Identify. Nurture. Track. Supercharge your cohort with verified, high-potential businesses.
            </p>

            <div style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
            }}>
              <button
                onClick={handleButtonClick}
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
                Join as Partner
                <FaArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* Steps Section - 3 steps for Catalysts */}
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
              Your Catalyst Journey
            </p>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: 0,
              letterSpacing: '-0.01em',
            }}>
              Supercharge Your Cohort in <span style={{ color: colors.primary }}>3 Simple Steps</span>
            </h2>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
          }}>
            {[
              {
                icon: <FaClipboardList size={26} />,
                number: '01',
                title: 'List Program',
                description: 'Set eligibility criteria and program structure.',
                details: ['Set criteria', 'Define focus areas', 'Establish timelines', 'Customize program'],
                subtext: '📋 Customize for your program\'s unique needs',
                color: colors.primary,
              },
              {
                icon: <FaUserFriends size={26} />,
                number: '02',
                title: 'Recruit Participants',
                description: 'Auto-matched applicants based on your criteria.',
                details: ['Auto-matched applicants', 'View score history', 'Assess potential', 'Comprehensive profiles'],
                subtext: '🔍 Find the perfect fit for your program',
                color: colors.secondary,
              },
              {
                icon: <FaChartBar size={26} />,
                number: '03',
                title: 'Monitor Progress',
                description: 'Track improvements and generate reports.',
                details: ['Track score improvements', 'Generate reports', 'Showcase success', 'Demonstrate impact'],
                subtext: '📈 Demonstrate your program\'s impact',
                color: colors.amber,
              },
            ].map((step, index) => (
              <div
                key={index}
                style={{
                  background: colors.white,
                  borderRadius: '16px',
                  padding: '24px 20px',
                  border: `1px solid ${colors.border}`,
                  transition: 'all 0.3s ease',
                  position: 'relative',
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
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '14px',
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '12px',
                    background: `${step.color}60`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: step.color,
                  }}>
                    {step.icon}
                  </div>
                  <span style={{
                    fontSize: '1.8rem',
                    fontWeight: 900,
                    color: `${step.color}60`,
                    lineHeight: 1,
                  }}>
                    {step.number}
                  </span>
                </div>
                
                <h3 style={{
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: colors.dark,
                  margin: '0 0 6px',
                  letterSpacing: '-0.01em',
                }}>
                  {step.title}
                </h3>
                
                <p style={{
                  fontSize: '0.82rem',
                  color: colors.muted,
                  lineHeight: 1.5,
                  margin: '0 0 14px',
                }}>
                  {step.description}
                </p>

                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 14px',
                  textAlign: 'left',
                }}>
                  {step.details.map((detail, i) => (
                    <li key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.8rem',
                      color: colors.muted,
                      padding: '3px 0',
                    }}>
                      <span style={{
                        color: step.color,
                        fontWeight: 700,
                      }}>✓</span>
                      {detail}
                    </li>
                  ))}
                </ul>

                <p style={{
                  fontSize: '0.78rem',
                  color: colors.muted,
                  fontStyle: 'italic',
                  margin: 0,
                  paddingTop: '10px',
                  borderTop: `1px solid ${colors.border}`,
                }}>
                  {step.subtext}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 🚀 REGISTER NOW CTA - BEFORE VIDEOS */}
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
            Ready to Supercharge Your Program?
          </h2>
          <p style={{
            fontSize: '1rem',
            color: 'rgba(255,255,255,0.85)',
            margin: '0 0 24px',
            maxWidth: '500px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Join the leading catalysts transforming business development through BIG.
          </p>
          <button
            onClick={handleButtonClick}
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

        {/* Video Section */}
        <section style={{
          marginBottom: '50px',
          padding: '40px 0',
          borderTop: `1px solid ${colors.border}`,
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <p style={{
              color: colors.secondary,
              fontWeight: 700,
              fontSize: '0.75rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              Watch & Learn
            </p>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: 0,
            }}>
              How Catalysts Make <span style={{ color: colors.primary }}>an Impact</span>
            </h2>
          </div>

          <div style={{
            maxWidth: '700px',
            margin: '0 auto',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}>
            <div style={{
              position: 'relative',
              paddingBottom: '56.25%',
              background: '#000',
            }}>
              <video 
                controls 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  backgroundColor: '#000',
                }}
                poster="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=400&fit=crop&crop=center"
              >
                <source src="/Catalysts.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </section>

        {/* 🛡️ CATALYST SECURITY SECTION - 4 blocks in one row */}
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
              <FaLightbulb size={14} color={colors.blue} />
              <span style={{
                color: colors.blue,
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                Program Data Is Protected
              </span>
            </div>
            
            <h2 style={{
              fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: '0 0 8px',
              letterSpacing: '-0.01em',
            }}>
              How <span style={{ color: colors.blue }}>BIG Secures</span> Your Program Data
            </h2>
            <p style={{
              fontSize: '0.95rem',
              color: colors.muted,
              maxWidth: '600px',
              margin: '0 auto',
            }}>
              We protect your program participants, data, and impact metrics with enterprise-grade security.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px',
          }}>
            {/* Block 1: Participant Data Protection */}
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
                <FaUsers size={22} />
              </div>
              <h4 style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: colors.dark,
                margin: '0 0 6px',
              }}>
                Participant Data Protection
              </h4>
              <p style={{
                fontSize: '0.82rem',
                color: colors.muted,
                lineHeight: 1.6,
                margin: 0,
              }}>
                All participant profiles and progress data are encrypted using enterprise-grade standards in transit and at rest.
              </p>
            </div>

            {/* Block 2: Program Confidentiality */}
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
                <FaLock size={22} />
              </div>
              <h4 style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: colors.dark,
                margin: '0 0 6px',
              }}>
                Program Confidentiality
              </h4>
              <p style={{
                fontSize: '0.82rem',
                color: colors.muted,
                lineHeight: 1.6,
                margin: 0,
              }}>
                Your program structure, criteria, and participant lists remain confidential with role-based access controls.
              </p>
            </div>

            {/* Block 3: Impact Data Integrity */}
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
                <FaChartBar size={22} />
              </div>
              <h4 style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: colors.dark,
                margin: '0 0 6px',
              }}>
                Impact Data Integrity
              </h4>
              <p style={{
                fontSize: '0.82rem',
                color: colors.muted,
                lineHeight: 1.6,
                margin: 0,
              }}>
                All impact metrics are securely tracked and verified. Generate auditable program reports.
              </p>
            </div>

            {/* Block 4: POPIA Compliance */}
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
                Fully compliant with the Protection of Personal Information Act (POPIA). Data is hosted on secure cloud infrastructure with regional data residency controls.
              </p>
            </div>
          </div>

          {/* Security Footer */}
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
              <FaShieldAlt size={16} color={colors.blue} />
              <span style={{ fontSize: '0.8rem', color: colors.muted }}>Participant Verification</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaFileContract size={16} color={colors.green} />
              <span style={{ fontSize: '0.8rem', color: colors.muted }}>Role-Based Access Controls</span>
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

export default HowItWorksCatalysts;