import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBullseye, FaUsers, FaHandHoldingUsd, FaArrowRight } from 'react-icons/fa';
import Header from './Header';
import Footer from './Footer';

const HowItWorksCorporates = () => {
  const navigate = useNavigate();

  const handleButtonClick = () => {
    navigate('/login');
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
    warmGray: '#9E8D7B'
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
        {/* Hero Section - Stretched Image */}
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
            backgroundImage: 'url(https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1400&h=500&fit=crop&crop=center)',
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
                For Corporates
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
              for Corporates
            </h1>
            
            <p style={{
              fontSize: '1.05rem',
              color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.7,
              margin: '0 0 28px',
              maxWidth: '500px',
            }}>
              Source Smart. Partner Deep. Amplify Real Impact. Connect with verified SMEs aligned to your ESD and CSI goals.
            </p>

            <div style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
            }}>
              <button
                onClick={handleButtonClick}
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
                Explore SMEs
                <FaArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* Rest of the content stays the same... */}
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
              Your Corporate Journey
            </p>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: 0,
              letterSpacing: '-0.01em',
            }}>
              Meet Your CSI Goals in <span style={{ color: colors.primary }}>3 Simple Steps</span>
            </h2>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
          }}>
            {[
              {
                icon: <FaBullseye size={26} />,
                number: '01',
                title: 'Define Goals',
                description: 'Set your strategic objectives and impact targets.',
                details: ['Select focus areas', 'Set measurable targets', 'Choose industries', 'Align with objectives'],
                subtext: '🎯 Strategic clarity for maximum impact',
                color: colors.primary,
              },
              {
                icon: <FaUsers size={26} />,
                number: '02',
                title: 'Access Vetted SMEs',
                description: 'Find verified businesses aligned with your goals.',
                details: ['BIG Score verification', 'Impact alignment', 'Track progress', 'Filter by indicators'],
                subtext: '🔍 Find your perfect SME partners',
                color: colors.secondary,
              },
              {
                icon: <FaHandHoldingUsd size={26} />,
                number: '03',
                title: 'Partner or Fund',
                description: 'Deploy capital and track impact metrics.',
                details: ['Sponsor accelerators', 'Direct contracts', 'Supplier development', 'Track ROI'],
                subtext: '🤝 Scale your impact sustainably',
                color: colors.amber,
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
                    background: `${step.color}15`,
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
                    color: `${step.color}20`,
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

       
      </div>

      <Footer />
    </div>
  );
};

export default HowItWorksCorporates;