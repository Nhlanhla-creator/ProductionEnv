import React from 'react';
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
  FaGlobeAfrica
} from 'react-icons/fa';
import Header from '../Header';
import Footer from '../Footer';

const SolutionsSMSEs = () => {
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
    green: '#1E7A47',
    orange: '#E8831A',
    blue: '#1D5FAA',
    red: '#BE3B2A',
  };

  const keySolutions = [
    {
      icon: <FaAward size={24} />,
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=400&h=300&q=80',
      title: 'BIG Score',
      description: 'Get your business scored and benchmarked against industry standards.',
      color: colors.primary,
    },
    {
      icon: <FaFileContract size={24} />,
      image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&h=300&q=80',
      title: 'Compliance Vault',
      description: 'Store and manage all your compliance documents in one secure place.',
      color: colors.secondary,
    },
    {
      icon: <FaSearchDollar size={24} />,
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&h=300&q=80',
      title: 'Funding Matchmaking',
      description: 'Get matched with funders and investors looking for businesses like yours.',
      color: colors.amber,
    },
    {
      icon: <FaHandshake size={24} />,
      image: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=400&h=300&q=80',
      title: 'Procurement Matchmaking',
      description: 'Connect with corporates looking for suppliers and vendors.',
      color: colors.blue,
    },
    {
      icon: <FaChartBar size={24} />,
      image: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=400&h=300&q=80',
      title: 'Growth Suite',
      description: 'Track and improve your performance across strategy, finance, operations and ESG.',
      color: colors.green,
    },
    {
      icon: <FaUserTie size={24} />,
      image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=400&h=300&q=80',
      title: 'Advisor Marketplace',
      description: 'Connect with expert advisors who can help you grow your business.',
      color: colors.orange,
    },
    {
      icon: <FaGraduationCap size={24} />,
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=400&h=300&q=80',
      title: 'Internship Marketplace',
      description: 'Recruit interns and graduates to build your talent pipeline.',
      color: colors.accent,
    },
  ];

  const whatYouCanDo = [
    'Build a verified business profile',
    'Obtain a BIG Score',
    'Improve compliance and investment readiness',
    'Access funding opportunities',
    'Access procurement opportunities',
    'Connect with advisors and service providers',
    'Recruit interns and graduates',
    'Use the Growth Suite to improve performance',
    'Track strategy, finance, operations and ESG progress',
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
        {/* Hero Section with Image on the Right */}
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
            backgroundImage: 'url(https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1400&h=400&fit=crop&crop=center)',
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
                  Solutions for African Businesses
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
                Build Credibility. <br />
                <span style={{ color: colors.amber }}>Access Opportunities.</span> <br />
                Grow with Confidence.
              </h1>
              
              <p style={{
                fontSize: '1rem',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.7,
                margin: '0 0 24px',
                maxWidth: '500px',
              }}>
                Businesses use BIG Marketplace to build verified profiles, get scored, and unlock funding, procurement, and growth opportunities.
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
                Get Started Today
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
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=600&h=400&q=80"
                alt="African Business Growth"
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

        {/* What You Can Do Section with Side Image */}
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
                  Everything You Need to <span style={{ color: colors.primary }}>Grow</span>
                </h2>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
              }}>
                {whatYouCanDo.map((item, index) => (
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
                      e.currentTarget.style.borderColor = colors.primary;
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.border;
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <FaCheckCircle size={14} color={colors.primary} />
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
              height: '320px',
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
              Tools to <span style={{ color: colors.primary }}>Accelerate</span> Your Growth
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
                {/* Solution Image */}
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
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '50%',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.2))',
                  }} />
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

      

        {/* CTA Section with Image Background */}
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
            backgroundImage: 'url(https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1400&h=400&q=80)',
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
              Ready to Build Your BIG Profile?
            </h2>
            <p style={{
              fontSize: '1rem',
              color: 'rgba(255,255,255,0.85)',
              margin: '0 0 24px',
              maxWidth: '450px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              Join thousands of African businesses already growing with BIG Marketplace.
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
              Register Now <FaArrowRight size={14} />
            </button>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default SolutionsSMSEs;