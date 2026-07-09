import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaBuilding, 
  FaChartLine, 
  FaHandshake, 
  FaArrowRight, 
  FaCheckCircle,
  FaShieldAlt,
  FaAward,
  FaFileContract,
  FaSearchDollar,
  FaUserTie,
  FaClipboardList,
  FaChartBar,
  FaGraduationCap,
  FaRocket,
  FaRegClock,
  FaGlobeAfrica,
  FaUsers,
  FaNetworkWired,
  FaCog,
  FaLayerGroup,
  FaTrophy,
  FaBullseye,
  FaLink,
  FaUserPlus,
  FaWallet,
  FaChartPie
} from 'react-icons/fa';
import Header from '../Header';
import Footer from '../Footer';

const SolutionsCapitalMarket = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('intelligent-matching');

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
    blue: '#1D5FAA',
    red: '#BE3B2A',
    purple: '#6C3B8A'
  };

  const tabContent = {
    'intelligent-matching': {
      title: 'Intelligent Matching',
      icon: <FaBullseye size={22} />,
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=350&fit=crop',
      description: 'Our AI-powered matching engine helps identify the best opportunities for each SME based on:',
      items: [
        'BIG Score',
        'Industry',
        'Business stage',
        'Funding requirements',
        'Procurement capability',
        'Geographic location',
        'Sector alignment',
        'Opportunity criteria'
      ],
      color: colors.blue,
      bgColor: `${colors.blue}15`
    },
    'manage-referrals': {
      title: 'Manage Referrals',
      icon: <FaLink size={22} />,
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=350&fit=crop',
      description: 'Track every introduction from beginning to end. Know exactly:',
      items: [
        'which SMEs were referred',
        'where they are in the pipeline',
        'conversion rates',
        'funding outcomes',
        'procurement outcomes',
        'programme placements'
      ],
      color: colors.green,
      bgColor: `${colors.green}15`
    },
    'earn-success-fees': {
      title: 'Earn Success Fees',
      icon: <FaWallet size={22} />,
      image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=350&fit=crop',
      description: 'BIG helps you manage referral-based business models. Track:',
      items: [
        'introductions',
        'successful placements',
        'funding approvals',
        'procurement awards',
        'programme enrolments',
        'commissions',
        'success fees'
      ],
      color: colors.amber,
      bgColor: `${colors.amber}15`
    },
    'real-time-intelligence': {
      title: 'Real-Time Portfolio Intelligence',
      icon: <FaChartPie size={22} />,
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=350&fit=crop',
      description: 'View:',
      items: [
        'Active SMEs',
        'Active Opportunities',
        'Matches Created',
        'Referrals Submitted',
        'Success Rates',
        'Capital Facilitated',
        'Opportunities Won',
        'Revenue Generated'
      ],
      color: colors.purple,
      bgColor: `${colors.purple}15`
    }
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
          minHeight: '320px',
          background: `linear-gradient(135deg, ${colors.dark} 0%, rgba(28,20,16,0.95) 100%)`,
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
            backgroundImage: 'url(https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1400&h=400&fit=crop&crop=center)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.15,
            zIndex: 0,
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
              maxWidth: '550px',
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                background: `${colors.amber}25`,
                border: `1px solid ${colors.amber}40`,
                borderRadius: '30px',
                padding: '6px 18px 6px 12px',
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
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}>
                  Solutions for Capital & Market Facilitators
                </span>
              </div>
              
              <h1 style={{
                fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
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
                fontSize: '1rem',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.7,
                margin: '0 0 24px',
                maxWidth: '500px',
              }}>
                Whether you're connecting businesses to funding, procurement opportunities, government programmes or strategic partnerships, BIG Marketplace gives you the tools to manage your pipeline, facilitate introductions, and grow your impact — all from one platform.
              </p>

              <p style={{
                fontSize: '0.95rem',
                color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.6,
                margin: '0 0 24px',
                maxWidth: '500px',
              }}>
                Instead of juggling spreadsheets, emails and disconnected databases, manage your entire opportunity ecosystem through a secure, AI-powered workspace.
              </p>

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
                Become a Facilitator
                <FaArrowRight size={14} />
              </button>
            </div>

            {/* Hero Image */}
            <div style={{
              flex: '0 0 300px',
              height: '240px',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${colors.amber}30`,
            }}>
              <img 
                src="https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=600&h=400&q=80"
                alt="Business facilitation and networking"
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

        {/* Who Is This For Section */}
        <section style={{
          marginBottom: '50px',
          padding: '40px',
          background: colors.white,
          borderRadius: '16px',
          border: `1px solid ${colors.border}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '20px',
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
            }}>
              <FaUsers size={22} />
            </div>
            <div>
              <p style={{
                color: colors.secondary,
                fontWeight: 700,
                fontSize: '0.75rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                margin: 0,
              }}>
                Who Is This For
              </p>
              <h2 style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: colors.dark,
                margin: 0,
              }}>
                Designed for <span style={{ color: colors.primary }}>Opportunity Connectors</span>
              </h2>
            </div>
          </div>
          
          <p style={{
            fontSize: '0.95rem',
            color: colors.muted,
            marginBottom: '16px',
            lineHeight: 1.6,
          }}>
            This solution is designed for organisations that help businesses access opportunities rather than owning those opportunities themselves.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
          }}>
            {[
              'Funding facilitators',
              'Capital advisors',
              'Corporate finance boutiques',
              'Deal facilitators',
              'Procurement intermediaries',
              'Market access specialists',
              'Supplier sourcing firms',
              'Government programme facilitators',
              'Business development intermediaries',
              'Enterprise ecosystem connectors'
            ].map((item, index) => (
              <div
                key={index}
                style={{
                  padding: '10px 14px',
                  background: colors.light,
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                  fontSize: '0.8rem',
                  color: colors.dark,
                  fontWeight: 500,
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.primary;
                  e.currentTarget.style.background = colors.white;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.border;
                  e.currentTarget.style.background = colors.light;
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* What You Can Do Section - Build Your SME Portfolio & Opportunity Pipeline */}
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
                  What You Can Do
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

              {/* Build Your SME Portfolio */}
              <div style={{
                background: colors.white,
                borderRadius: '12px',
                padding: '20px',
                border: `1px solid ${colors.border}`,
                marginBottom: '16px',
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: colors.dark,
                  margin: '0 0 8px',
                }}>
                  Build Your SME Portfolio
                </h3>
                <p style={{
                  fontSize: '0.85rem',
                  color: colors.muted,
                  margin: '0 0 12px',
                  lineHeight: 1.6,
                }}>
                  Onboard and manage the businesses you support in one central workspace.
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px',
                }}>
                  {[
                    'Create and manage SME profiles',
                    'Track BIG Scores',
                    'Monitor funding and procurement readiness',
                    'Store compliance documentation',
                    'Monitor progress over time'
                  ].map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 0',
                      }}
                    >
                      <FaCheckCircle size={12} color={colors.primary} />
                      <span style={{
                        fontSize: '0.75rem',
                        color: colors.dark,
                      }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Build Your Opportunity Pipeline */}
              <div style={{
                background: colors.white,
                borderRadius: '12px',
                padding: '20px',
                border: `1px solid ${colors.border}`,
                marginBottom: '16px',
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: colors.dark,
                  margin: '0 0 8px',
                }}>
                  Build Your Opportunity Pipeline
                </h3>
                <p style={{
                  fontSize: '0.85rem',
                  color: colors.muted,
                  margin: '0 0 12px',
                  lineHeight: 1.6,
                }}>
                  Manage relationships with:
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px',
                }}>
                  {[
                    'Banks',
                    'Investors',
                    'DFIs',
                    'Government programmes',
                    'Corporate procurement teams',
                    'Grant providers',
                    'Development agencies'
                  ].map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 0',
                      }}
                    >
                      <FaCheckCircle size={12} color={colors.secondary} />
                      <span style={{
                        fontSize: '0.75rem',
                        color: colors.dark,
                      }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
                <p style={{
                  fontSize: '0.85rem',
                  color: colors.muted,
                  margin: '8px 0 0',
                  lineHeight: 1.6,
                }}>
                  Track available opportunities and match them with the right businesses.
                </p>
              </div>
            </div>

            {/* Side Image */}
            <div style={{
              borderRadius: '16px',
              overflow: 'hidden',
              height: '400px',
              boxShadow: '0 8px 40px rgba(28,20,16,0.1)',
            }}>
              <img 
                src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&h=500&q=80"
                alt="Business Growth Workspace"
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

        {/* Tabs Section - Intelligent Matching, Manage Referrals, Earn Success Fees, Real-Time Portfolio Intelligence */}
        <section style={{
          marginBottom: '50px',
          padding: '40px',
          background: colors.white,
          borderRadius: '16px',
          border: `1px solid ${colors.border}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <p style={{
              color: colors.secondary,
              fontWeight: 700,
              fontSize: '0.75rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}>
              Key Capabilities
            </p>
            <h2 style={{
              fontSize: 'clamp(1.3rem, 2vw, 1.8rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: 0,
            }}>
              Everything You Need to <span style={{ color: colors.primary }}>Manage Your Ecosystem</span>
            </h2>
          </div>

          {/* Tab Buttons */}
          <div style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '30px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            {Object.keys(tabContent).map((key) => {
              const tab = tabContent[key];
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 24px',
                    background: isActive ? tab.color : colors.light,
                    color: isActive ? colors.white : colors.dark,
                    border: isActive ? 'none' : `1px solid ${colors.border}`,
                    borderRadius: '50px',
                    fontSize: '0.85rem',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: isActive ? `0 4px 15px ${tab.color}40` : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = tab.color;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = colors.border;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <span style={{ color: isActive ? colors.white : tab.color }}>
                    {tab.icon}
                  </span>
                  {tab.title}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {Object.keys(tabContent).map((key) => {
            const tab = tabContent[key];
            if (activeTab !== key) return null;
            return (
              <div
                key={key}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '30px',
                  alignItems: 'center',
                  animation: 'fadeIn 0.3s ease',
                }}
              >
                {/* Image */}
                <div style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  height: '280px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                }}>
                  <img 
                    src={tab.image}
                    alt={tab.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    loading="lazy"
                  />
                </div>

                {/* Content */}
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px',
                  }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: tab.bgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: tab.color,
                    }}>
                      {tab.icon}
                    </div>
                    <h3 style={{
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: colors.dark,
                      margin: 0,
                    }}>
                      {tab.title}
                    </h3>
                  </div>

                  <p style={{
                    fontSize: '0.9rem',
                    color: colors.muted,
                    lineHeight: 1.6,
                    margin: '0 0 16px',
                  }}>
                    {tab.description}
                  </p>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                  }}>
                    {tab.items.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 10px',
                          background: colors.light,
                          borderRadius: '6px',
                          border: `1px solid ${colors.border}`,
                        }}
                      >
                        <FaCheckCircle size={12} color={tab.color} />
                        <span style={{
                          fontSize: '0.78rem',
                          color: colors.dark,
                        }}>
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* CTA Section */}
        <section style={{
          position: 'relative',
          padding: '50px',
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
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
            backgroundImage: 'url(https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1400&h=400&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.08,
          }} />
          
          <div style={{
            position: 'relative',
            zIndex: 1,
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
              maxWidth: '450px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              Become a Capital and Market Facilitator today.
            </p>
            <button
              onClick={() => navigate('/LoginRegister')}
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
              Become a Facilitator Today <FaArrowRight size={14} />
            </button>
          </div>
        </section>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <Footer />
    </div>
  );
};

export default SolutionsCapitalMarket;