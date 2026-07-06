import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserTie, FaClipboardList, FaHandshake, FaChartLine, FaArrowRight, FaRocket, FaCheckCircle, FaClock, FaShieldAlt, FaLock, FaDatabase, FaUserSecret, FaRegClock, FaGlobeAfrica, FaFileContract, FaComments, FaStar } from 'react-icons/fa';
import Header from './Header';
import Footer from './Footer';

const HowItWorksAdvisors = () => {
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
            backgroundImage: 'url(https://images.unsplash.com/photo-1552664730-d307ca884978?w=1400&h=500&fit=crop&crop=center)',
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
                For Advisors & Service Providers
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
              for Advisors
            </h1>
            
            <p style={{
              fontSize: '1.05rem',
              color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.7,
              margin: '0 0 28px',
              maxWidth: '500px',
            }}>
              Guide. Mentor. Transform Businesses. Connect with high-potential businesses and grow your advisory practice.
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
                Join as Advisor
                <FaArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* Steps Section - 4 steps for Advisors */}
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
              Your Advisory Journey
            </p>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: 0,
              letterSpacing: '-0.01em',
            }}>
              Make an Impact in <span style={{ color: colors.primary }}>4 Simple Steps</span>
            </h2>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px',
          }}>
            {[
              {
                icon: <FaUserTie size={26} />,
                number: '01',
                title: 'Create Profile',
                description: 'Build your advisor profile with expertise and credentials.',
                details: ['Complete profile', 'Upload credentials', 'Define focus areas', 'Get verified'],
                subtext: '🛡 Build your professional reputation',
                color: colors.primary,
              },
              {
                icon: <FaClipboardList size={26} />,
                number: '02',
                title: 'Set Your Terms',
                description: 'Define your advisory style and engagement model.',
                details: ['Choose domains', 'Select growth stages', 'Set rates', 'Indicate availability'],
                subtext: '🧩 Flexible engagement models',
                color: colors.secondary,
              },
              {
                icon: <FaHandshake size={26} />,
                number: '03',
                title: 'Connect with Businesses',
                description: 'Receive requests from vetted businesses.',
                details: ['Receive requests', 'Review BIG Score', 'Accept engagements', 'Use platform tools'],
                subtext: '🔍 Work with aligned businesses',
                color: colors.amber,
              },
              {
                icon: <FaChartLine size={26} />,
                number: '04',
                title: 'Track Impact',
                description: 'See business progress and grow your network.',
                details: ['See business progress', 'Get visibility', 'Access opportunities', 'Build portfolio'],
                subtext: '📈 Grow your professional network',
                color: colors.green,
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
            Ready to Make a Difference?
          </h2>
          <p style={{
            fontSize: '1rem',
            color: 'rgba(255,255,255,0.85)',
            margin: '0 0 24px',
            maxWidth: '500px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Join the community of advisors transforming businesses through BIG.
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
              How Advisors Make <span style={{ color: colors.primary }}>a Difference</span>
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
                poster="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop&crop=center"
              >
                <source src="/Advisors.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </section>

        {/* 🛡️ ADVISOR SECURITY SECTION - 4 blocks in one row */}
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
              <FaComments size={14} color={colors.blue} />
              <span style={{
                color: colors.blue,
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                Your Advisory Data Is Protected
              </span>
            </div>
            
            <h2 style={{
              fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: '0 0 8px',
              letterSpacing: '-0.01em',
            }}>
              How <span style={{ color: colors.blue }}>BIG Protects</span> Your Advisory Practice
            </h2>
            <p style={{
              fontSize: '0.95rem',
              color: colors.muted,
              maxWidth: '600px',
              margin: '0 auto',
            }}>
              We protect your professional reputation, client data, and advisory work with enterprise-grade security.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px',
          }}>
            {/* Block 1: Credential Protection */}
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
                Credential Protection
              </h4>
              <p style={{
                fontSize: '0.82rem',
                color: colors.muted,
                lineHeight: 1.6,
                margin: 0,
              }}>
                Your credentials and professional documents are encrypted using enterprise-grade standards and protected during transmission.
              </p>
            </div>

            {/* Block 2: Client Confidentiality */}
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
                <FaUserSecret size={22} />
              </div>
              <h4 style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: colors.dark,
                margin: '0 0 6px',
              }}>
                Client Confidentiality
              </h4>
              <p style={{
                fontSize: '0.82rem',
                color: colors.muted,
                lineHeight: 1.6,
                margin: 0,
              }}>
                Your client engagements and communications remain confidential with role-based access controls.
              </p>
            </div>

            {/* Block 3: Reputation Protection */}
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
                <FaStar size={22} />
              </div>
              <h4 style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: colors.dark,
                margin: '0 0 6px',
              }}>
                Reputation Protection
              </h4>
              <p style={{
                fontSize: '0.82rem',
                color: colors.muted,
                lineHeight: 1.6,
                margin: 0,
              }}>
                Your ratings and reviews are securely verified. Only authenticated clients can leave feedback.
              </p>
            </div>

            {/* Block 4: You Own Your Data */}
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
                Request full deletion of your profile and advisory data. Removed within 7 business days. You're always in control.
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
              <FaLock size={16} color={colors.blue} />
              <span style={{ fontSize: '0.8rem', color: colors.muted }}>Multi-Factor Authentication</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaGlobeAfrica size={16} color={colors.green} />
              <span style={{ fontSize: '0.8rem', color: colors.muted }}>POPIA Compliant</span>
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

export default HowItWorksAdvisors;