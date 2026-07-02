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
      title: 'BIG Score',
      description: 'Get your business scored and benchmarked against industry standards.',
      color: colors.primary,
    },
    {
      icon: <FaFileContract size={24} />,
      title: 'Compliance Vault',
      description: 'Store and manage all your compliance documents in one secure place.',
      color: colors.secondary,
    },
    {
      icon: <FaSearchDollar size={24} />,
      title: 'Funding Matchmaking',
      description: 'Get matched with funders and investors looking for businesses like yours.',
      color: colors.amber,
    },
    {
      icon: <FaHandshake size={24} />,
      title: 'Procurement Matchmaking',
      description: 'Connect with corporates looking for suppliers and vendors.',
      color: colors.blue,
    },
    {
      icon: <FaChartBar size={24} />,
      title: 'Growth Suite',
      description: 'Track and improve your performance across strategy, finance, operations and ESG.',
      color: colors.green,
    },
    {
      icon: <FaUserTie size={24} />,
      title: 'Advisor Marketplace',
      description: 'Connect with expert advisors who can help you grow your business.',
      color: colors.orange,
    },
    {
      icon: <FaGraduationCap size={24} />,
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
        {/* Hero Section */}
        <section style={{
          position: 'relative',
          borderRadius: '20px',
          overflow: 'hidden',
          marginBottom: '50px',
          minHeight: '300px',
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
            maxWidth: '650px',
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
                Solutions for African SMSEs
              </span>
            </div>
            
            <h1 style={{
              fontSize: 'clamp(2rem, 4vw, 2.8rem)',
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
              SMSEs use BIG Marketplace to build verified profiles, get scored, and unlock funding, procurement, and growth opportunities.
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
        </section>

        {/* What You Can Do Section */}
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
              What You Can Do
            </p>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: 0,
            }}>
              Everything You Need to <span style={{ color: colors.primary }}>Grow</span>
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
          }}>
            {whatYouCanDo.map((item, index) => (
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
                  e.currentTarget.style.borderColor = colors.primary;
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.border;
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <FaCheckCircle size={16} color={colors.primary} />
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
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
          borderRadius: '20px',
          textAlign: 'center',
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
            Join thousands of African SMSEs already growing with BIG Marketplace.
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
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default SolutionsSMSEs;