import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaNetworkWired, 
  FaUsers, 
  FaHandshake, 
  FaSearchDollar,
  FaArrowRight, 
  FaCheckCircle,
  FaBuilding,
  FaRocket,
  FaShieldAlt,
  FaChartLine,
  FaCogs
} from 'react-icons/fa';
import Header from '../Header';
import Footer from '../Footer';

const MatchingInfrastructure = () => {
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
    gold: '#C9A96E',
    brown: '#5D432C',
    brownLight: '#8A6D52',
    brownDark: '#372C27'
  };

  const handleNavigation = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const relatedInfrastructure = [
    {
      name: 'BIG Score™',
      category: 'Trust Infrastructure',
      path: '/BigScorePage',
      icon: <FaShieldAlt size={24} />,
      color: colors.primary,
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop'
    },
    {
      name: 'Growth Suite™',
      category: 'Growth Infrastructure',
      path: '/growth-suite',
      icon: <FaChartLine size={24} />,
      color: colors.amber,
      image: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&h=250&fit=crop'
    },
    {
      name: 'Supply Engine™',
      category: 'Procurement Infrastructure',
      path: '/supply-engine',
      icon: <FaCogs size={24} />,
      color: colors.brownLight,
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=250&fit=crop'
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
          padding: '40px 50px',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1400&h=400&fit=crop&crop=center)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.15,
            zIndex: 0,
          }} />
          
          <div style={{
            position: 'relative',
            zIndex: 1,
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: `${colors.amber}20`,
              border: `1px solid ${colors.amber}40`,
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
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}>
                Opportunity Infrastructure
              </span>
            </div>
            
            <h1 style={{
              fontSize: 'clamp(2rem, 4vw, 3.2rem)',
              fontWeight: 900,
              color: colors.white,
              margin: '0 0 16px',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}>
              BIG Marketplace™
            </h1>
            <p style={{
              fontSize: '1.2rem',
              color: colors.amber,
              fontWeight: 600,
              margin: '0 0 8px',
            }}>
              Can the right organisations find each other?
            </p>
            <p style={{
              fontSize: '1rem',
              color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.7,
              margin: '0 0 24px',
              maxWidth: '550px',
            }}>
              BIG Marketplace intelligently connects businesses with customers, suppliers, investors, 
              advisors, catalysts and strategic partners through verified profiles, AI-powered matching 
              and ecosystem intelligence.
            </p>

            <div style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
            }}>
              <button
                onClick={() => handleNavigation('/LoginRegister')}
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
                Explore BIG Marketplace
                <FaArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* Primary Outcome Section */}
        <section style={{
          marginBottom: '50px',
          padding: '40px',
          background: colors.white,
          borderRadius: '16px',
          border: `1px solid ${colors.border}`,
          textAlign: 'center',
        }}>
          <p style={{
            color: colors.secondary,
            fontWeight: 700,
            fontSize: '0.75rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}>
            Primary Outcome
          </p>
          <h2 style={{
            fontSize: 'clamp(1.5rem, 2.5vw, 2.2rem)',
            fontWeight: 800,
            color: colors.dark,
            margin: 0,
          }}>
            Create Better Opportunities Through <span style={{ color: colors.amber }}>Better Connections</span>
          </h2>
          <p style={{
            fontSize: '1rem',
            color: colors.muted,
            maxWidth: '600px',
            margin: '12px auto 0',
            lineHeight: 1.7,
          }}>
            Verified profiles, AI-powered matching and ecosystem intelligence help the right organisations 
            find each other — faster and more efficiently than ever before.
          </p>
        </section>

        {/* Key Features with Images */}
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
              Key Capabilities
            </p>
            <h2 style={{
              fontSize: 'clamp(1.3rem, 2vw, 1.8rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: 0,
            }}>
              Everything You Need to <span style={{ color: colors.amber }}>Connect</span>
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
          }}>
            {[
              {
                icon: <FaUsers size={24} />,
                title: 'Verified Profiles',
                description: 'Businesses create verified profiles with compliance documents, certifications, and capabilities.',
                color: colors.primary,
                image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=250&fit=crop'
              },
              {
                icon: <FaSearchDollar size={24} />,
                title: 'AI-Powered Matching',
                description: 'Intelligent algorithms connect businesses with the right opportunities based on compatibility and needs.',
                color: colors.amber,
                image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop'
              },
              {
                icon: <FaHandshake size={24} />,
                title: 'Ecosystem Intelligence',
                description: 'Network insights help identify the most valuable connections across the entire ecosystem.',
                color: colors.secondary,
                image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=250&fit=crop'
              }
            ].map((feature, index) => (
              <div
                key={index}
                style={{
                  background: colors.white,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: `1px solid ${colors.border}`,
                  transition: 'all 0.3s ease',
                  textAlign: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.06)';
                  e.currentTarget.style.borderColor = feature.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = colors.border;
                }}
              >
                <div style={{
                  height: '120px',
                  overflow: 'hidden',
                }}>
                  <img 
                    src={feature.image}
                    alt={feature.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    loading="lazy"
                  />
                </div>
                <div style={{ padding: '16px 20px 20px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: `${feature.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: feature.color,
                    margin: '-28px auto 10px',
                    position: 'relative',
                    background: colors.white,
                    border: `2px solid ${colors.white}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}>
                    {feature.icon}
                  </div>
                  <h4 style={{
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: colors.dark,
                    margin: '0 0 6px',
                  }}>
                    {feature.title}
                  </h4>
                  <p style={{
                    fontSize: '0.82rem',
                    color: colors.muted,
                    lineHeight: 1.6,
                    margin: 0,
                  }}>
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
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
            backgroundImage: 'url(https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1400&h=400&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.06,
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
              Ready to Find the Right Connections?
            </h2>
            <p style={{
              fontSize: '1rem',
              color: 'rgba(255,255,255,0.85)',
              margin: '0 0 24px',
              maxWidth: '450px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              Join thousands of organisations already using BIG Marketplace to connect and grow.
            </p>
            <button
              onClick={() => handleNavigation('/LoginRegister')}
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
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default MatchingInfrastructure;