import React from 'react';
import { 
  FaBuilding, 
  FaChartLine, 
  FaHandshake, 
  FaArrowRight, 
  FaCheckCircle, 
  FaClock, 
  FaShieldAlt, 
  FaLock, 
  FaDatabase, 
  FaUserSecret, 
  FaRegClock, 
  FaGlobeAfrica, 
  FaFileContract, 
  FaUserTie, 
  FaSearchDollar,
  FaUsers,
  FaNetworkWired,
  FaRocket,
  FaChartBar,
  FaUserPlus,
  FaLink,
  FaBullseye,
  FaTrophy,
  FaCog,
  FaLayerGroup,
  FaClipboardList,
  FaDoorOpen,
  FaWifi,
  FaWhatsapp,
  FaEnvelope,
  FaAddressBook,
  FaWallet,
  FaChartPie,
  FaUserFriends,
  FaBriefcase,
  FaHandshake as FaHandshakeIcon
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const HowItWorksCapitalMarket = () => {
  const navigate = useNavigate();

  const handleGetStartedClick = () => {
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
    purple: '#6C3B8A'
  };

  const steps = [
    {
      number: '01',
      title: 'Step 1',
      description: 'Create your Capital and Market Facilitator workspace.',
      image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=250&fit=crop',
      icon: <FaUserPlus size={24} />,
      color: colors.primary
    },
    {
      number: '02',
      title: 'Step 2',
      description: 'Invite your SMEs to join BIG Marketplace.',
      image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=250&fit=crop',
      icon: <FaUsers size={24} />,
      color: colors.secondary
    },
    {
      number: '03',
      title: 'Step 3',
      description: 'Add your funding, procurement and programme partners.',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop',
      icon: <FaLink size={24} />,
      color: colors.amber
    },
    {
      number: '04',
      title: 'Step 4',
      description: 'Use BIG Scores and intelligent matching to identify suitable opportunities.',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
      icon: <FaBullseye size={24} />,
      color: colors.blue
    },
    {
      number: '05',
      title: 'Step 5',
      description: 'Facilitate introductions and manage the process from referral to outcome.',
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=250&fit=crop',
      icon: <FaHandshake size={24} />,
      color: colors.green
    },
    {
      number: '06',
      title: 'Step 6',
      description: 'Track conversions, measure impact and grow your business.',
      image: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&h=250&fit=crop',
      icon: <FaChartBar size={24} />,
      color: colors.orange
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
            backgroundImage: 'url(https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1400&h=500&fit=crop&crop=center)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.2,
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
                For Capital & Market Facilitators
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
              Turn Your Network <br />
              Into a <span style={{ color: colors.amber }}>Scalable Business</span>
            </h1>
            
            <p style={{
              fontSize: '1.05rem',
              color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.7,
              margin: '0 0 28px',
              maxWidth: '500px',
            }}>
              Stop juggling spreadsheets and emails. Manage your entire opportunity ecosystem through a secure, AI-powered workspace designed for facilitators.
            </p>

            <div style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
            }}>
              <button
                onClick={handleGetStartedClick}
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
                Get Started Today
                <FaArrowRight size={14} />
              </button>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.85rem',
              }}>
                <FaClock size={14} /> 10 minutes • Free Trial
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
                  Trusted by 200+ Facilitators
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaShieldAlt size={14} color={colors.amber} />
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                  Enterprise Security
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
                src="https://images.unsplash.com/photo-1556761175-4b46a572b786?w=240&h=240&fit=crop&crop=center"
                alt="Business facilitation and networking"
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

        {/* Steps Section - 6 steps in one row with images */}
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
              How It Works
            </p>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: 0,
              letterSpacing: '-0.01em',
            }}>
              Your Path to <span style={{ color: colors.primary }}>Scalable Impact</span>
            </h2>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
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
                  height: '120px',
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
                    fontSize: '0.7rem',
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
                    gap: '8px',
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
                      fontSize: '0.75rem',
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
                    fontSize: '0.72rem',
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
        </div>

        {/* Why BIG Section */}
        <section style={{
          marginBottom: '50px',
          padding: '40px 50px',
          background: colors.white,
          borderRadius: '20px',
          border: `1px solid ${colors.border}`,
          boxShadow: '0 4px 30px rgba(0,0,0,0.04)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <p style={{
              color: colors.secondary,
              fontWeight: 700,
              fontSize: '0.75rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              Why BIG
            </p>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: 0,
            }}>
              Transform How You <span style={{ color: colors.primary }}>Manage Opportunities</span>
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
          }}>
            {/* Traditional Approach */}
            <div style={{
              padding: '24px',
              background: `${colors.red}08`,
              borderRadius: '14px',
              border: `1px solid ${colors.red}30`,
            }}>
              <h4 style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: colors.red,
                margin: '0 0 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <span>❌</span> Traditional intermediary businesses rely on:
              </h4>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
              }}>
                {[
                  'Spreadsheets',
                  'WhatsApp',
                  'Email',
                  'Personal networks',
                  'Manual tracking'
                ].map((item, i) => (
                  <li key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 0',
                    fontSize: '0.85rem',
                    color: colors.muted,
                    borderBottom: i < 4 ? `1px solid ${colors.border}` : 'none',
                  }}>
                    <span style={{ color: colors.red }}>✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* BIG Approach */}
            <div style={{
              padding: '24px',
              background: `${colors.green}08`,
              borderRadius: '14px',
              border: `1px solid ${colors.green}30`,
            }}>
              <h4 style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: colors.green,
                margin: '0 0 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <span>✅</span> BIG transforms your business into a scalable opportunity management platform.
              </h4>
              <p style={{
                fontSize: '0.85rem',
                color: colors.dark,
                lineHeight: 1.6,
                margin: 0,
              }}>
                Instead of managing relationships manually, you manage an intelligent ecosystem.
              </p>
            </div>
          </div>
        </section>

        {/* Key Features Section */}
        <section style={{
          marginBottom: '50px',
          padding: '40px',
          background: colors.white,
          borderRadius: '16px',
          border: `1px solid ${colors.border}`,
        }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <p style={{
              color: colors.secondary,
              fontWeight: 700,
              fontSize: '0.75rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}>
              Key Features
            </p>
            <h2 style={{
              fontSize: 'clamp(1.3rem, 2vw, 1.8rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: 0,
            }}>
              Everything You Need to <span style={{ color: colors.primary }}>Scale</span>
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '14px',
          }}>
            {[
              'Dedicated Facilitator Workspace',
              'Unlimited SME Portfolio Management',
              'Opportunity Management',
              'Funder & Buyer Database',
              'AI-Powered Matching',
              'BIG Score Integration',
              'Referral Tracking',
              'Success Fee Tracking',
              'Portfolio Dashboards',
              'Secure Document Management',
              'Collaboration Tools',
              'Performance Analytics'
            ].map((feature, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  background: colors.light,
                  borderRadius: '10px',
                  border: `1px solid ${colors.border}`,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.primary;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.border;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <FaCheckCircle size={14} color={colors.green} />
                <span style={{
                  fontSize: '0.78rem',
                  color: colors.dark,
                  fontWeight: 500,
                }}>
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Perfect For Section */}
        <section style={{
          marginBottom: '50px',
          padding: '40px',
          background: `linear-gradient(135deg, ${colors.dark} 0%, rgba(28,20,16,0.95) 100%)`,
          borderRadius: '16px',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              display: 'inline-block',
              padding: '4px 16px',
              background: `${colors.amber}20`,
              borderRadius: '30px',
              marginBottom: '8px',
            }}>
              <span style={{
                color: colors.amber,
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                Perfect For
              </span>
            </div>
            <h2 style={{
              fontSize: 'clamp(1.3rem, 2vw, 1.8rem)',
              fontWeight: 800,
              color: colors.white,
              margin: 0,
            }}>
              Who Can <span style={{ color: colors.amber }}>Benefit</span>
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
          }}>
            {[
              'Capital Introducers',
              'Funding Facilitators',
              'Government Programme Partners',
              'Procurement Facilitators',
              'Supplier Development Intermediaries',
              'Corporate Finance Advisors',
              'Business Development Firms',
              'Market Access Specialists'
            ].map((item, index) => (
              <div
                key={index}
                style={{
                  padding: '14px 18px',
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: '0.85rem',
                  color: 'rgba(255,255,255,0.85)',
                  fontWeight: 500,
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                  e.currentTarget.style.borderColor = colors.amber;
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* The BIG Difference Section */}
        <section style={{
          marginBottom: '50px',
          padding: '40px 50px',
          background: colors.white,
          borderRadius: '16px',
          border: `1px solid ${colors.border}`,
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <p style={{
              color: colors.secondary,
              fontWeight: 700,
              fontSize: '0.75rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}>
              The BIG Difference
            </p>
            <h2 style={{
              fontSize: 'clamp(1.3rem, 2vw, 1.8rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: 0,
            }}>
              BIG Doesn't Replace Your Relationships — <span style={{ color: colors.primary }}>It Amplifies Them</span>
            </h2>
          </div>

          <p style={{
            fontSize: '1rem',
            color: colors.muted,
            textAlign: 'center',
            maxWidth: '700px',
            margin: '0 auto',
            lineHeight: 1.7,
          }}>
            You continue to build trusted relationships with SMEs, funders and opportunity providers while 
            BIG provides the technology, intelligence and workflow infrastructure to help you scale.
          </p>
        </section>

        {/* 🚀 REGISTER NOW CTA */}
        <section style={{
          marginBottom: '50px',
          padding: '40px',
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
          borderRadius: '20px',
          textAlign: 'center',
        }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 16px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '30px',
            marginBottom: '12px',
          }}>
            <span style={{
              color: colors.white,
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Build More Connections. Create More Opportunities. Deliver More Impact.
            </span>
          </div>
          
          <h2 style={{
            fontSize: 'clamp(1.3rem, 2vw, 1.8rem)',
            fontWeight: 800,
            color: colors.white,
            margin: '0 0 12px',
          }}>
            Transform Your Network Into a Scalable Opportunity Ecosystem
          </h2>
          <p style={{
            fontSize: '1rem',
            color: 'rgba(255,255,255,0.85)',
            margin: '0 0 24px',
            maxWidth: '500px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Become a Capital and Market Facilitator today.
          </p>
          <button
            onClick={handleGetStartedClick}
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
            Get Started Today <FaArrowRight size={14} />
          </button>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default HowItWorksCapitalMarket;