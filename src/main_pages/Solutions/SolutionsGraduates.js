import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaGraduationCap, 
  FaUserGraduate, 
  FaArrowRight, 
  FaCheckCircle,
  FaBuilding,
  FaClipboardList,
  FaChartBar,
  FaRegClock,
  FaGlobeAfrica,
  FaNetworkWired,
  FaLightbulb,
  FaUserTie,
  FaBriefcase,
  FaSearchDollar,
  FaShieldAlt
} from 'react-icons/fa';
import Header from '../Header';
import Footer from '../Footer';

const SolutionsGraduates = () => {
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
    accentBright: '#D4C0B0',
    brown: '#5D432C',
    brownLight: '#8A6D52',
    brownDark: '#372C27',
    gold: '#C9A96E',
    orange: '#E8831A',
    blue: '#1D5FAA',
  };

  const keySolutions = [
    {
      icon: <FaBriefcase size={24} />,
      title: 'Internship Marketplace',
      description: 'Find and apply to internship opportunities with vetted SMEs.',
      color: colors.accent,
    },
    {
      icon: <FaUserGraduate size={24} />,
      title: 'Skills Profiles',
      description: 'Create a verified profile showcasing your skills and experience.',
      color: colors.primary,
    },
    {
      icon: <FaSearchDollar size={24} />,
      title: 'Opportunity Matching',
      description: 'Get matched with opportunities that fit your skills and career goals.',
      color: colors.secondary,
    },
  ];

  const benefits = [
    'Create verified profiles',
    'Showcase skills and experience',
    'Access internship opportunities',
    'Match with SMEs and growth businesses',
    'Build work experience portfolios',
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
        {/* Hero Section - More visible accent color */}
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
            backgroundImage: 'url(https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1400&h=500&fit=crop&crop=center)',
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
            background: `radial-gradient(circle, ${colors.accent}20, transparent)`,
            pointerEvents: 'none',
          }} />
          
          <div style={{
            position: 'absolute',
            top: -80,
            right: -30,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.amber}15, transparent)`,
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
              background: `${colors.accent}35`,
              border: `1px solid ${colors.accent}60`,
              borderRadius: '30px',
              padding: '8px 20px 8px 14px',
              marginBottom: '24px',
            }}>
              <span style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: colors.accent,
                display: 'inline-block',
                animation: 'pulse 2s infinite',
              }} />
              <span style={{
                color: colors.accent,
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}>
                For Graduates
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
              Experience Should Not <br />
              Depend on <span style={{ color: colors.accent }}>Who You</span> <br />
              Know.
            </h1>
            
            <p style={{
              fontSize: '1.1rem',
              color: 'rgba(255,255,255,0.8)',
              lineHeight: 1.8,
              margin: '0 0 30px',
              maxWidth: '550px',
            }}>
              BIG helps graduates create verified profiles, showcase skills, and access 
              internship opportunities with growth businesses across Africa.
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
                  background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentBright})`,
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
                  boxShadow: `0 4px 25px ${colors.accent}50`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = `0 8px 35px ${colors.accent}60`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 4px 25px ${colors.accent}50`;
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
                <FaCheckCircle size={14} color={colors.accent} />
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                  Free for graduates
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaShieldAlt size={14} color={colors.accent} />
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                  Verified profiles
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaGlobeAfrica size={14} color={colors.accent} />
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                  Pan-African opportunities
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
              background: `linear-gradient(135deg, ${colors.accent}30, ${colors.accentBright}20)`,
              border: `2px solid ${colors.accent}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              padding: '20px',
            }}>
              <div style={{ fontSize: '3rem', color: colors.accent, marginBottom: '8px' }}>🎓</div>
              <div style={{ color: colors.white, fontSize: '0.9rem', fontWeight: 700, textAlign: 'center' }}>
                Launch Your <br />Career
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', marginTop: '4px' }}>
                Powered by BIG
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
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
              Why Graduates Choose BIG
            </p>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: 0,
            }}>
              <span style={{ color: colors.accent }}>Build</span> Your Career
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
          }}>
            {benefits.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  background: colors.white,
                  borderRadius: '10px',
                  border: `1px solid ${colors.border}`,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.accent;
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.border;
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <FaCheckCircle size={16} color={colors.accent} />
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
              Tools for <span style={{ color: colors.accent }}>Career</span> Success
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
          background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentBright})`,
          borderRadius: '20px',
          textAlign: 'center',
        }}>
          <h2 style={{
            fontSize: 'clamp(1.3rem, 2vw, 1.8rem)',
            fontWeight: 800,
            color: colors.white,
            margin: '0 0 12px',
          }}>
            Ready to Launch Your Career?
          </h2>
          <p style={{
            fontSize: '1rem',
            color: 'rgba(255,255,255,0.85)',
            margin: '0 0 24px',
            maxWidth: '450px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Join BIG Marketplace and connect with opportunities that will kickstart your career.
          </p>
          <button
            onClick={() => navigate('/LoginRegister')}
            style={{
              background: colors.white,
              color: colors.accent,
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

export default SolutionsGraduates;