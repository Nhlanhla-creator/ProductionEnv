import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaUsers, 
  FaNetworkWired, 
  FaArrowRight, 
  FaCheckCircle,
  FaBuilding,
  FaChartLine,
  FaClipboardList,
  FaChartBar,
  FaRegClock,
  FaGlobeAfrica,
  FaShieldAlt,
  FaDatabase,
  FaLightbulb,
  FaUserTie,
  FaGraduationCap,
  FaHandshake,
  FaRocket,
  FaBriefcase,
  FaSearchDollar,
  FaFileContract,
  FaUserGraduate
} from 'react-icons/fa';
import Header from '../Header';
import Footer from '../Footer';

const SolutionsAssociations = () => {
  const navigate = useNavigate();

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
    green: '#1E7A47',
  };

  const keySolutions = [
    {
      icon: <FaUsers size={24} />,
      image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=400&h=250&q=80',
      title: 'Membership Management',
      description: 'Manage your members from one secure platform with online applications, approvals, renewals, and digital member profiles.',
      features: ['Online applications', 'Approval workflows', 'Member database', 'Renewals & subscriptions', 'Committee management', 'Member directories'],
      color: colors.primary,
    },
    {
      icon: <FaNetworkWired size={24} />,
      image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=400&h=250&q=80',
      title: 'Ecosystem Intelligence',
      description: 'Go beyond administration with member capability mapping, sector intelligence, industry benchmarking, and growth trends.',
      features: ['Member capability mapping', 'Sector intelligence', 'Industry benchmarking', 'Growth trends', 'Ecosystem analytics', 'Collaboration networks'],
      color: colors.brown,
    },
    {
      icon: <FaHandshake size={24} />,
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&h=250&q=80',
      title: 'Opportunity Marketplace',
      description: 'Help members discover customers, investors, procurement opportunities, advisors, service providers, interns, and strategic partners.',
      features: ['Customer connections', 'Investor matching', 'Procurement opportunities', 'Advisor access', 'Service providers', 'Strategic partnerships'],
      color: colors.amber,
    },
    {
      icon: <FaShieldAlt size={24} />,
      image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&h=250&q=80',
      title: 'Trust & Compliance',
      description: 'Build confidence across your network with business verification, compliance documents, certifications, and BIG Score management.',
      features: ['Business verification', 'Compliance documents', 'Certifications', 'Governance information', 'BIG Score', 'Expiry notifications'],
      color: colors.green,
    },
    {
      icon: <FaRocket size={24} />,
      image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=400&h=250&q=80',
      title: 'Programme Management',
      description: 'Run supplier development, incubation, accelerators, export programmes, and member initiatives from one platform.',
      features: ['Supplier development', 'Incubation programmes', 'Accelerators', 'Export programmes', 'Enterprise development', 'Awards & initiatives'],
      color: colors.orange,
    },
    {
      icon: <FaChartBar size={24} />,
      image: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=400&h=250&q=80',
      title: 'Portfolio & Impact Reporting',
      description: 'Track membership growth, engagement, programme outcomes, opportunity conversion, and economic impact with real evidence.',
      features: ['Membership growth', 'Engagement tracking', 'Programme outcomes', 'Opportunity conversion', 'Economic impact', 'Member satisfaction'],
      color: colors.blue,
    },
  ];

  const layerFeatures = [
    {
      title: 'Layer 1 — Association Management',
      description: 'Everything needed to operate your organisation.',
      items: ['Membership Management', 'Billing', 'Renewals', 'Communications', 'Events', 'Applications', 'Committees', 'Member Directory'],
      color: colors.primary,
    },
    {
      title: 'Layer 2 — Ecosystem Intelligence',
      description: 'Everything needed to create value for members.',
      items: ['BIG Score', 'Compliance', 'Matchmaking', 'Opportunities', 'Portfolio Management', 'Market Intelligence', 'AI Insights', 'Reporting'],
      color: colors.amber,
    },
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
            backgroundImage: 'url(https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1400&h=500&fit=crop&crop=center)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.12,
            zIndex: 0,
          }} />
          
          <div style={{
            position: 'absolute',
            top: -80,
            right: -30,
            width: 350,
            height: 350,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.amber}20, transparent)`,
            pointerEvents: 'none',
          }} />
          
          <div style={{
            position: 'absolute',
            bottom: -60,
            left: -40,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.brown}20, transparent)`,
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
                  For Associations & Member Organisations
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
                Solutions for <span style={{ color: colors.amber }}>Associations</span> <br />
                & Ecosystem <br />
                Organisations
              </h1>
              
              <p style={{
                fontSize: '1.1rem',
                color: 'rgba(255,255,255,0.8)',
                lineHeight: 1.8,
                margin: '0 0 30px',
                maxWidth: '550px',
              }}>
                BIG Marketplace is an all-in-one platform that helps associations manage their operations while unlocking intelligence, collaboration and measurable member value.
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
                    Trusted by leading associations
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaShieldAlt size={14} color={colors.amber} />
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                    Data-driven insights
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaGlobeAfrica size={14} color={colors.amber} />
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                    Ecosystem-wide impact
                  </span>
                </div>
              </div>
            </div>

            <div style={{
              flex: '0 0 320px',
              height: '260px',
              borderRadius: '16px',
              overflow: 'hidden',
              border: `2px solid ${colors.amber}30`,
            }}>
              <img 
                src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&h=400&q=80"
                alt="Association Collaboration"
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
              Everything You Need to Run Your Association
            </p>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: 0,
            }}>
              <span style={{ color: colors.brown }}>Complete</span> Association Solutions
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
                    margin: '0 0 12px',
                  }}>
                    {solution.description}
                  </p>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                  }}>
                    {solution.features.slice(0, 3).map((feature, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: `${solution.color}10`,
                          color: solution.color,
                          padding: '2px 8px',
                          borderRadius: '50px',
                          fontSize: '0.6rem',
                          fontWeight: 600,
                        }}
                      >
                        {feature}
                      </span>
                    ))}
                    {solution.features.length > 3 && (
                      <span
                        style={{
                          background: `${solution.color}10`,
                          color: solution.color,
                          padding: '2px 8px',
                          borderRadius: '50px',
                          fontSize: '0.6rem',
                          fontWeight: 600,
                        }}
                      >
                        +{solution.features.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Two Powerful Layers Section */}
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
              Two Powerful Layers
            </p>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: 0,
            }}>
              <span style={{ color: colors.brown }}>One</span> Platform
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
          }}>
            {layerFeatures.map((layer, index) => (
              <div
                key={index}
                style={{
                  background: colors.white,
                  borderRadius: '16px',
                  padding: '32px 28px',
                  border: `2px solid ${layer.color}30`,
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(28,20,16,0.08)';
                  e.currentTarget.style.borderColor = layer.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = `${layer.color}30`;
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px',
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: layer.color,
                    display: 'inline-block',
                  }} />
                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    color: layer.color,
                    margin: 0,
                  }}>
                    {layer.title}
                  </h3>
                </div>
                <p style={{
                  fontSize: '0.9rem',
                  color: colors.muted,
                  margin: '0 0 16px',
                }}>
                  {layer.description}
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                }}>
                  {layer.items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 10px',
                        background: colors.light,
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        color: colors.dark,
                      }}
                    >
                      <FaCheckCircle size={12} color={layer.color} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

       

        {/* CTA Section */}
        <section style={{
          position: 'relative',
          padding: '50px',
          background: `linear-gradient(135deg, ${colors.brown}, ${colors.brownLight})`,
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
            backgroundImage: 'url(https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1400&h=400&q=80)',
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
              Ready to Transform Your Association?
            </h2>
            <p style={{
              fontSize: '1rem',
              color: 'rgba(255,255,255,0.85)',
              margin: '0 0 24px',
              maxWidth: '450px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              Join leading associations already using BIG to streamline operations and grow their ecosystems.
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
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default SolutionsAssociations;