import React from 'react';
import { FaUserEdit, FaChartLine, FaHandshake, FaChartBar, FaArrowRight, FaRocket, FaCheckCircle, FaClock, FaShieldAlt, FaLock, FaDatabase, FaUserSecret, FaRegClock, FaGlobeAfrica, FaFileContract, FaBuilding, FaCreditCard } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const HowItWorksSMSE = () => {
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
    blue: '#1D5FAA'
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
            backgroundImage: 'url(https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1400&h=500&fit=crop&crop=center)',
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
                For African SMSEs
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
              for SMSEs
            </h1>
            
            <p style={{
              fontSize: '1.05rem',
              color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.7,
              margin: '0 0 28px',
              maxWidth: '500px',
            }}>
              Get Scored. Get Matched. Grow. Join thousands of African SMEs unlocking funding and opportunities through our AI-powered platform.
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
                Get Your BIG Score Now
                <FaArrowRight size={14} />
              </button>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.85rem',
              }}>
                <FaClock size={14} /> 5 minutes • Free
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
                  Trusted by 500+ SMEs
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaShieldAlt size={14} color={colors.amber} />
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                  Verified & Secure
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
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=240&h=240&fit=crop&crop=face"
                alt="African entrepreneur smiling"
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
              ⭐ 4.8/5 Rating
            </div>
          </div>
        </section>

        {/* Steps Section - 4 steps */}
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
              Your Growth Journey
            </p>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: 0,
              letterSpacing: '-0.01em',
            }}>
              Your Path to Funding in <span style={{ color: colors.primary }}>4 Simple Steps</span>
            </h2>
            <p style={{
              fontSize: '0.95rem',
              color: colors.muted,
              marginTop: '8px',
            }}>
              From Score to Success — A transparent path to unlocking your business potential
            </p>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px',
          }}>
            {[
              {
                icon: <FaUserEdit size={26} />,
                number: '01',
                title: 'Create & Verify',
                description: 'Complete your universal profile in under 5 minutes. Upload documents and get verified.',
                details: ['Complete profile in 5 min', 'Upload key documents', 'Automated review', 'Verified in hours'],
                subtext: '🔒 Secure. Simple. Fast.',
                color: colors.primary,
              },
              {
                icon: <FaChartLine size={26} />,
                number: '02',
                title: 'Get Your BIG Score',
                description: 'Our AI evaluates your business across compliance, growth potential, and pitch quality.',
                details: ['Compliance & docs check', 'Growth potential', 'Pitch quality', 'Score 0-100 + feedback'],
                subtext: '🎯 Actionable insights to strengthen your business',
                color: colors.secondary,
              },
              {
                icon: <FaHandshake size={26} />,
                number: '03',
                title: 'Unlock Opportunities',
                description: 'Get matched with funders, advisors, accelerators, and programs that fit your stage.',
                details: ['Matched funders', 'Advisors & mentors', 'Accelerators', 'Apply once, match many'],
                subtext: '🔗 Apply once. Match many.',
                color: colors.amber,
              },
              {
                icon: <FaChartBar size={26} />,
                number: '04',
                title: 'Track & Grow',
                description: 'Improve your score, access tools, and build visibility with top partners.',
                details: ['Improve your BIG Score', 'Exclusive tools', 'Boost visibility', 'Monitor progress'],
                subtext: '📈 Built for businesses serious about scale.',
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
            Ready to Grow Your Business?
          </h2>
          <p style={{
            fontSize: '1rem',
            color: 'rgba(255,255,255,0.85)',
            margin: '0 0 24px',
            maxWidth: '500px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Join thousands of African SMSEs already using BIG to unlock funding and opportunities.
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

        {/* Videos Section */}
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
              Learn More
            </p>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: 0,
            }}>
              See <span style={{ color: colors.primary }}>BIG</span> in Action
            </h2>
            <p style={{
              fontSize: '0.9rem',
              color: colors.muted,
              marginTop: '6px',
            }}>
              Watch these short videos to understand how we help SMSEs grow
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
          }}>
            {[
              {
                title: 'Apply For Funding',
                description: 'Discover how to connect with the right funders for your business stage.',
                video: '/SMSE_Funders.mp4',
                poster: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=225&fit=crop',
              },
              {
                title: 'Apply for Products & Services',
                description: 'Learn how to offer and find products and services through the platform.',
                video: '/SMSE_Products&Services.mp4',
                poster: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=225&fit=crop',
              },
              {
                title: 'Apply for Advisors',
                description: 'Connect with expert advisors who can accelerate your business growth.',
                video: '/SMSE_Advisors.mp4',
                poster: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=225&fit=crop',
              },
            ].map((item, index) => (
              <div
                key={index}
                style={{
                  background: colors.white,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
                }}
              >
                <div style={{
                  backgroundColor: colors.primary,
                  color: colors.white,
                  padding: '15px',
                  textAlign: 'center',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                }}>
                  {item.title}
                </div>
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
                    poster={item.poster}
                  >
                    <source src={item.video} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div style={{ padding: '16px 20px' }}>
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
                Your Business Data Is Protected
              </span>
            </div>
            
            <h2 style={{
              fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: '0 0 8px',
              letterSpacing: '-0.01em',
            }}>
              How <span style={{ color: colors.blue }}>BIG Keeps</span> Your Business Safe
            </h2>
            <p style={{
              fontSize: '0.95rem',
              color: colors.muted,
              maxWidth: '600px',
              margin: '0 auto',
            }}>
              We protect your business information with enterprise-grade security while helping you grow.
            </p>
          </div>

          {/* 4 blocks in one row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px',
          }}>
            {/* Block 1: Business Document Encryption */}
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
                Business Document Encryption
              </h4>
              <p style={{
                fontSize: '0.82rem',
                color: colors.muted,
                lineHeight: 1.6,
                margin: 0,
              }}>
                All documents and data encrypted with <strong>AES-256</strong> at rest and <strong>TLS 1.3</strong> in transit.
              </p>
            </div>

            {/* Block 2: POPIA Compliance */}
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
                POPIA Compliant
              </h4>
              <p style={{
                fontSize: '0.82rem',
                color: colors.muted,
                lineHeight: 1.6,
                margin: 0,
              }}>
                Fully compliant with <strong>POPIA 4 of 2013</strong>. Data stored securely in South African data centers.
              </p>
            </div>

            {/* Block 3: Payment Security */}
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
                <FaCreditCard size={22} />
              </div>
              <h4 style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: colors.dark,
                margin: '0 0 6px',
              }}>
                Payment Security
              </h4>
              <p style={{
                fontSize: '0.82rem',
                color: colors.muted,
                lineHeight: 1.6,
                margin: 0,
              }}>
                Payments via <strong>Peach Payments</strong> with bank-grade encryption. We never store your payment details.
              </p>
            </div>

            {/* Block 4: Data Ownership */}
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
                <FaUserSecret size={22} />
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
                Request full deletion anytime. Removed within <strong>7 business days</strong>. No data retained without consent.
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
              <FaShieldAlt size={16} color={colors.green} />
              <span style={{ fontSize: '0.8rem', color: colors.muted }}>Strict Access Controls</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaRegClock size={16} color={colors.amber} />
              <span style={{ fontSize: '0.8rem', color: colors.muted }}>24/7 Security Monitoring</span>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default HowItWorksSMSE;