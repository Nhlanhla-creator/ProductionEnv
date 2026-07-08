import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaUserTie, 
  FaHandshake, 
  FaArrowRight, 
  FaCheckCircle,
  FaBuilding,
  FaChartLine,
  FaClipboardList,
  FaChartBar,
  FaRegClock,
  FaGlobeAfrica,
  FaNetworkWired,
  FaLightbulb,
  FaUsers,
  FaSearchDollar,
  FaBriefcase,
  FaShieldAlt
} from 'react-icons/fa';
import Header from '../Header';
import Footer from '../Footer';

const SolutionsAdvisors = () => {
  const navigate = useNavigate();

  const colors = {
    dark: '#1C1410',
    primary: '#7C4D2A',
    secondary: '#A0703E',
    amber: '#D4894A',
    amberBright: '#E8A85A',
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
      icon: <FaUsers size={24} />,
      image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=400&h=250&q=80',
      title: 'Advisor Marketplace',
      description: 'Connect with businesses that are serious about growth and ready for support.',
      color: colors.amber,
    },
    {
      icon: <FaNetworkWired size={24} />,
      image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=400&h=250&q=80',
      title: 'Referral Engine',
      description: 'Get qualified referrals and reduce your client acquisition costs.',
      color: colors.primary,
    },
    {
      icon: <FaChartBar size={24} />,
      image: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=400&h=250&q=80',
      title: 'Growth Suite Integration',
      description: 'Support businesses more effectively using shared intelligence and insights.',
      color: colors.secondary,
    },
  ];

  const audiences = [
    'Accountants',
    'Lawyers',
    'Consultants',
    'Coaches',
    'HR specialists',
    'Technology providers',
  ];

  const benefits = [
    'Access qualified leads',
    'Reduce acquisition costs',
    'Build long-term client relationships',
    'Support businesses more effectively using shared intelligence',
  ];

  const additionalFeatures = [
    'Credibility building through verified profiles',
    'Client matching based on needs and expertise',
    'Shared intelligence for better outcomes',
    'Long-term relationship development',
    'Referral network and ecosystem connections'
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
        {/* Hero Section with Image */}
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
            backgroundImage: 'url(https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1400&h=500&fit=crop&crop=center)',
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
            background: `radial-gradient(circle, ${colors.amber}25, transparent)`,
            pointerEvents: 'none',
          }} />
          
          <div style={{
            position: 'absolute',
            bottom: -60,
            left: -40,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.gold}20, transparent)`,
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
                background: `${colors.amber}35`,
                border: `1px solid ${colors.amber}60`,
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
                  For Advisors & Service Providers
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
                Work with Businesses <br />
                That Are <span style={{ color: colors.amber }}>Serious</span> <br />
                About Growth.
              </h1>
              
              <p style={{
                fontSize: '1.1rem',
                color: 'rgba(255,255,255,0.8)',
                lineHeight: 1.8,
                margin: '0 0 30px',
                maxWidth: '550px',
              }}>
                BIG helps advisors access qualified leads, reduce acquisition costs, and 
                build long-term client relationships with businesses ready to grow.
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
                    background: `linear-gradient(135deg, ${colors.amber}, ${colors.amberBright})`,
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
                    Trusted by top advisors
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaShieldAlt size={14} color={colors.amber} />
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                    Qualified leads
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaGlobeAfrica size={14} color={colors.amber} />
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                    African business ecosystem
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
              border: `2px solid ${colors.amber}30`,
            }}>
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&h=400&q=80"
                alt="Advisor at Work"
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

        {/* Audiences Section */}
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
                  Who We Serve
                </p>
                <h2 style={{
                  fontSize: 'clamp(1.3rem, 2vw, 1.8rem)',
                  fontWeight: 800,
                  color: colors.dark,
                  margin: 0,
                }}>
                  For <span style={{ color: colors.amber }}>Every</span> Type of Advisor
                </h2>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
              }}>
                {audiences.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 16px',
                      background: colors.white,
                      borderRadius: '10px',
                      border: `1px solid ${colors.border}`,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colors.amber;
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.boxShadow = `0 4px 15px ${colors.amber}20`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.border;
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <FaCheckCircle size={14} color={colors.amber} />
                    <span style={{
                      fontSize: '0.82rem',
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
                src="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&h=500&q=80"
                alt="Professional Services Meeting"
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

        {/* Benefits Section */}
        <section style={{ marginBottom: '50px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '40px',
            alignItems: 'center',
          }}>
            <div style={{
              order: '2',
            }}>
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
                  Why Advisors Choose BIG
                </p>
                <h2 style={{
                  fontSize: 'clamp(1.3rem, 2vw, 1.8rem)',
                  fontWeight: 800,
                  color: colors.dark,
                  margin: 0,
                }}>
                  <span style={{ color: colors.amber }}>Grow</span> Your Practice
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
                      e.currentTarget.style.borderColor = colors.amber;
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.border;
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <FaCheckCircle size={14} color={colors.amber} />
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

            {/* Side Image - Left */}
            <div style={{
              order: '1',
              borderRadius: '16px',
              overflow: 'hidden',
              height: '280px',
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
              Tools for <span style={{ color: colors.amber }}>Advisor</span> Success
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
            background: `linear-gradient(135deg, ${colors.amber}08, ${colors.gold}08)`,
            borderRadius: '16px',
            padding: '40px',
            border: `1px solid ${colors.amber}20`,
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
                Comprehensive <span style={{ color: colors.amber }}>Advisor</span> Solutions
              </h2>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
            }}>
              {additionalFeatures.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '14px 18px',
                    background: colors.white,
                    borderRadius: '10px',
                    border: `1px solid ${colors.border}`,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = colors.amber;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 4px 15px ${colors.amber}15`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.border;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <FaCheckCircle size={14} color={colors.amber} />
                  <span style={{
                    fontSize: '0.85rem',
                    color: colors.dark,
                    fontWeight: 500,
                  }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={{
          position: 'relative',
          padding: '50px',
          background: `linear-gradient(135deg, ${colors.amber}, ${colors.amberBright})`,
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
            backgroundImage: 'url(https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&h=400&q=80)',
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
              Ready to Grow Your Practice?
            </h2>
            <p style={{
              fontSize: '1rem',
              color: 'rgba(255,255,255,0.85)',
              margin: '0 0 24px',
              maxWidth: '450px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              Join BIG Marketplace and connect with businesses that are serious about growth.
            </p>
            <button
              onClick={() => navigate('/LoginRegister')}
              style={{
                background: colors.white,
                color: colors.amber,
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

export default SolutionsAdvisors;