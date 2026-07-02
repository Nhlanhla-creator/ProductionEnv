import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaHandshake, 
  FaBuilding, 
  FaArrowRight, 
  FaCheckCircle,
  FaShieldAlt,
  FaSearchDollar,
  FaClipboardList,
  FaChartBar,
  FaRegClock,
  FaGlobeAfrica,
  FaFileContract,
  FaNetworkWired,
  FaUsers,
  FaUserTie,
  FaGraduationCap,
  FaRocket,
  FaDatabase,
  FaLightbulb
} from 'react-icons/fa';
import Header from '../Header';
import Footer from '../Footer';

const SolutionsCorporates = () => {
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
  };

  const keySolutions = [
    {
      icon: <FaNetworkWired size={24} />,
      title: 'ESD Platform',
      description: 'Manage enterprise and supplier development programs end-to-end.',
      color: colors.brown,
    },
    {
      icon: <FaSearchDollar size={24} />,
      title: 'Supplier Intelligence',
      description: 'Access pre-vetted supplier pipelines with full visibility and risk assessment.',
      color: colors.primary,
    },
    {
      icon: <FaDatabase size={24} />,
      title: 'Portfolio Intelligence',
      description: 'Track supplier performance and development outcomes across your portfolio.',
      color: colors.secondary,
    },
    {
      icon: <FaGraduationCap size={24} />,
      title: 'Internship Management',
      description: 'Manage internship programs and build talent pipelines efficiently.',
      color: colors.brownDark,
    },
    {
      icon: <FaLightbulb size={24} />,
      title: 'Market Intelligence',
      description: 'Stay informed with real-time market trends and ecosystem insights.',
      color: colors.amber,
    },
  ];

  const areas = [
    {
      title: 'Procurement & Supply Chain',
      items: ['Pre-vetted supplier pipeline', 'Supplier risk visibility', 'Compliance management', 'Supplier performance intelligence'],
      color: colors.brown,
    },
    {
      title: 'Enterprise & Supplier Development',
      items: ['SME onboarding', 'Cohort management', 'Development tracking', 'Impact reporting', 'Post-programme support'],
      color: colors.primary,
    },
    {
      title: 'CSI & CSR',
      items: ['Beneficiary onboarding', 'Programme intelligence', 'Outcomes tracking', 'ESG reporting'],
      color: colors.brownDark,
    },
    {
      title: 'HR & Talent',
      items: ['Internship management', 'Graduate placement', 'SME talent pipelines'],
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
        {/* Hero Section - Improved */}
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
            backgroundImage: 'url(https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&h=500&fit=crop&crop=center)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.12,
            zIndex: 0,
          }} />
          
          <div style={{
            position: 'absolute',
            bottom: -60,
            left: -40,
            width: 350,
            height: 350,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.amber}15, transparent)`,
            pointerEvents: 'none',
          }} />
          
          <div style={{
            position: 'absolute',
            top: -80,
            right: -30,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.brown}20, transparent)`,
            pointerEvents: 'none',
          }} />
          
          <div style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: '700px',
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
                For Corporates
              </span>
            </div>
            
            <h1 style={{
              fontSize: 'clamp(2.2rem, 4.5vw, 3.2rem)',
              fontWeight: 900,
              color: colors.white,
              margin: '0 0 20px',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}>
              Build Stronger Suppliers. <br />
              <span style={{ color: colors.amber }}>Build Stronger</span> <br />
              Ecosystems.
            </h1>
            
            <p style={{
              fontSize: '1.1rem',
              color: 'rgba(255,255,255,0.8)',
              lineHeight: 1.8,
              margin: '0 0 30px',
              maxWidth: '550px',
            }}>
              BIG supports procurement, supplier development, and transformation teams 
              with intelligent, data-driven solutions for sustainable growth.
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
                  Trusted by leading corporates
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaShieldAlt size={14} color={colors.amber} />
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                  Verified suppliers
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaGlobeAfrica size={14} color={colors.amber} />
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                  African supply chain focus
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
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${colors.amber}30, ${colors.gold}20)`,
              border: `2px solid ${colors.amber}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              padding: '20px',
            }}>
              <div style={{ fontSize: '3rem', color: colors.amber, marginBottom: '8px' }}>🏢</div>
              <div style={{ color: colors.white, fontSize: '0.9rem', fontWeight: 700, textAlign: 'center' }}>
                Stronger <br />Ecosystems
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', marginTop: '4px' }}>
                Powered by BIG
              </div>
            </div>
          </div>
        </section>

        {/* Areas Section */}
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
              What We Support
            </p>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: 0,
            }}>
              End-to-End <span style={{ color: colors.brown }}>Corporate</span> Solutions
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
          }}>
            {areas.map((area, index) => (
              <div
                key={index}
                style={{
                  background: colors.white,
                  borderRadius: '14px',
                  padding: '24px',
                  border: `1px solid ${colors.border}`,
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(28,20,16,0.08)';
                  e.currentTarget.style.borderColor = area.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = colors.border;
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '12px',
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: `${area.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: area.color,
                  }}>
                    {area.title.includes('Procurement') ? <FaHandshake size={18} /> :
                     area.title.includes('Enterprise') ? <FaBuilding size={18} /> :
                     area.title.includes('CSI') ? <FaGlobeAfrica size={18} /> :
                     <FaUsers size={18} />}
                  </div>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: colors.dark,
                    margin: 0,
                  }}>
                    {area.title}
                  </h4>
                </div>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                }}>
                  {area.items.map((item, idx) => (
                    <li
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '4px 0',
                        fontSize: '0.85rem',
                        color: colors.muted,
                      }}
                    >
                      <FaCheckCircle size={12} color={area.color} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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
              Key Solutions
            </p>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: 0,
            }}>
              Powerful Tools for <span style={{ color: colors.brown }}>Corporate</span> Success
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
                  padding: '24px 20px',
                  border: `1px solid ${colors.border}`,
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(28,20,16,0.08)';
                  e.currentTarget.style.borderColor = solution.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = colors.border;
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: `${solution.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: solution.color,
                  marginBottom: '12px',
                }}>
                  {solution.icon}
                </div>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: colors.dark,
                  margin: '0 0 6px',
                }}>
                  {solution.title}
                </h4>
                <p style={{
                  fontSize: '0.85rem',
                  color: colors.muted,
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  {solution.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section style={{
          padding: '40px',
          background: `linear-gradient(135deg, ${colors.brown}, ${colors.brownLight})`,
          borderRadius: '20px',
          textAlign: 'center',
        }}>
          <h2 style={{
            fontSize: 'clamp(1.3rem, 2vw, 1.8rem)',
            fontWeight: 800,
            color: colors.white,
            margin: '0 0 12px',
          }}>
            Ready to Build Stronger Supplier Ecosystems?
          </h2>
          <p style={{
            fontSize: '1rem',
            color: 'rgba(255,255,255,0.85)',
            margin: '0 0 24px',
            maxWidth: '450px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Join leading corporates already using BIG to transform their supply chains.
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
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default SolutionsCorporates;