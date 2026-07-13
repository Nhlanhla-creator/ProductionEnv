import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaShieldAlt, 
  FaNetworkWired, 
  FaChartLine, 
  FaCogs, 
  FaArrowRight, 
  FaCheckCircle,
  FaBuilding,
  FaRocket,
  FaHandshake,
  FaChartBar
} from 'react-icons/fa';
import Header from '../Header';
import Footer from '../Footer';

const InfrastructurePage = () => {
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

  const infrastructureItems = [
    {
      id: 'big-score',
      name: 'BIG Score™',
      category: 'Trust Infrastructure',
      question: 'Can I trust this business?',
      description: 'BIG Score helps businesses demonstrate credibility while giving corporates, funders and ecosystem partners greater confidence through verification, compliance, governance and commercial readiness.',
      outcome: 'Build trust before opportunity.',
      path: '/BigScorePage',
      icon: <FaShieldAlt size={32} />,
      color: colors.brown,
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=350&fit=crop'
    },
    {
      id: 'marketplace',
      name: 'BIG Marketplace™',
      category: 'Opportunity Infrastructure',
      question: 'Can the right organisations find each other?',
      description: 'BIG Marketplace intelligently connects businesses with customers, suppliers, investors, advisors, catalysts and strategic partners through verified profiles, AI-powered matching and ecosystem intelligence.',
      outcome: 'Create better opportunities through better connections.',
      path: '/matching-infrastructure',
      icon: <FaNetworkWired size={32} />,
      color: colors.secondary,
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=350&fit=crop'
    },
    {
      id: 'growth-suite',
      name: 'Growth Suite™',
      category: 'Growth Infrastructure',
      question: 'How do businesses scale sustainably?',
      description: 'Growth Suite is BIG\'s digital operating platform for growing businesses. It acts as a digital twin of the business, bringing together strategy, governance, performance, AI analysis and continuous improvement into one integrated environment.',
      outcome: 'Turn opportunity into sustainable growth.',
      path: '/growth-suite',
      icon: <FaChartLine size={32} />,
      color: colors.amber,
      image: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&h=350&fit=crop'
    },
    {
      id: 'supply-engine',
      name: 'Supply Engine™',
      category: 'Procurement Infrastructure',
      question: 'How do we build stronger future supply?',
      description: 'Supply Engine is a procurement-led supply development platform built on the Shared Supply Model™. It starts with future procurement demand and helps corporates collaboratively invest in businesses with the capabilities needed to create competitive, resilient procurement pipelines.',
      outcome: 'Build stronger procurement outcomes through stronger supply.',
      path: '/supply-engine',
      icon: <FaCogs size={32} />,
      color: colors.brownLight,
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=350&fit=crop'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          minHeight: '420px',
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
            backgroundImage: 'url(https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1400&h=500&fit=crop&crop=center)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.15,
            zIndex: 0,
          }} />
          
          <div style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.amber}15, transparent)`,
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            bottom: -100,
            left: -50,
            width: 350,
            height: 350,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.primary}15, transparent)`,
            pointerEvents: 'none',
          }} />

          <div style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: '750px',
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: `${colors.amber}20`,
              border: `1px solid ${colors.amber}40`,
              borderRadius: '30px',
              padding: '6px 16px 6px 10px',
              marginBottom: '24px',
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
                Building the Infrastructure Behind Better Business
              </span>
            </div>
            
            <h1 style={{
              fontSize: 'clamp(2.2rem, 4.5vw, 3.5rem)',
              fontWeight: 900,
              color: colors.white,
              margin: '0 0 20px',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}>
              Building the <br />
              <span style={{ color: colors.amber }}>Infrastructure</span> Behind <br />
              Better Business
            </h1>
            
            <p style={{
              fontSize: '1.1rem',
              color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.8,
              margin: '0 0 8px',
              maxWidth: '600px',
            }}>
              Businesses don't fail because opportunity doesn't exist.
            </p>
            <p style={{
              fontSize: '1.1rem',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.8,
              margin: '0 0 28px',
              maxWidth: '600px',
            }}>
              They fail because the infrastructure that converts opportunity into sustainable growth is fragmented.
            </p>
            
            <p style={{
              fontSize: '1rem',
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.7,
              margin: '0 0 30px',
              maxWidth: '550px',
              fontStyle: 'italic',
              borderLeft: `3px solid ${colors.amber}`,
              paddingLeft: '20px',
            }}>
              "Instead of building isolated tools, we are building connected infrastructure that enables businesses to earn trust, access opportunity, scale sustainably and strengthen future supply."
            </p>

            <button
              onClick={() => {
                document.getElementById('infrastructure-cards').scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                background: `linear-gradient(135deg, ${colors.amber}, ${colors.secondary})`,
                color: colors.white,
                border: 'none',
                borderRadius: '50px',
                padding: '14px 40px',
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
              Explore Our Infrastructure
              <FaArrowRight size={14} />
            </button>
          </div>
        </section>

        {/* Why Infrastructure Matters Section */}
        <section style={{
          marginBottom: '50px',
          padding: '50px 40px',
          background: colors.white,
          borderRadius: '16px',
          border: `1px solid ${colors.border}`,
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '50px',
            alignItems: 'center',
          }}>
            <div>
              <p style={{
                color: colors.secondary,
                fontWeight: 700,
                fontSize: '0.75rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}>
                Why Infrastructure Matters
              </p>
              <h2 style={{
                fontSize: 'clamp(1.5rem, 2.5vw, 2.2rem)',
                fontWeight: 800,
                color: colors.dark,
                margin: '0 0 16px',
                letterSpacing: '-0.01em',
              }}>
                Every Successful Economy <br />
                <span style={{ color: colors.primary }}>Relies on Shared Infrastructure</span>
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginTop: '16px',
              }}>
                {[
                  { label: 'Roads move goods', icon: '🚛' },
                  { label: 'Payment networks move money', icon: '💳' },
                  { label: 'Telecommunications move information', icon: '📡' },
                  { label: 'Credit bureaus move trust', icon: '🏦' },
                ].map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 16px',
                      background: colors.light,
                      borderRadius: '8px',
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                    <span style={{
                      fontSize: '0.85rem',
                      color: colors.dark,
                      fontWeight: 500,
                    }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
              <p style={{
                fontSize: '0.95rem',
                color: colors.muted,
                marginTop: '20px',
                lineHeight: 1.7,
              }}>
                Businesses compete using shared infrastructure — not by duplicating it.
                <br />
                <span style={{ color: colors.primary, fontWeight: 600 }}>
                  Business ecosystems should work the same way.
                </span>
              </p>
            </div>

            <div style={{
              background: `${colors.dark}08`,
              borderRadius: '12px',
              padding: '30px',
              border: `1px solid ${colors.border}`,
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
              }}>
                {[
                  { label: 'Trust', icon: <FaShieldAlt size={20} />, color: colors.primary },
                  { label: 'Opportunity', icon: <FaHandshake size={20} />, color: colors.amber },
                  { label: 'Growth', icon: <FaChartBar size={20} />, color: colors.secondary },
                  { label: 'Supply', icon: <FaCogs size={20} />, color: colors.brownLight },
                ].map((item, index) => (
                  <div
                    key={index}
                    style={{
                      background: colors.white,
                      borderRadius: '10px',
                      padding: '16px',
                      textAlign: 'center',
                      border: `1px solid ${colors.border}`,
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = item.color;
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.06)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.border;
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      color: item.color,
                      display: 'flex',
                      justifyContent: 'center',
                      marginBottom: '4px',
                    }}>
                      {item.icon}
                    </div>
                    <span style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: colors.dark,
                    }}>
                      {item.label}
                    </span>
                    <p style={{
                      fontSize: '0.65rem',
                      color: colors.muted,
                      margin: '4px 0 0',
                    }}>
                      Ecosystem Capability
                    </p>
                  </div>
                ))}
              </div>
              <p style={{
                fontSize: '0.8rem',
                color: colors.muted,
                textAlign: 'center',
                marginTop: '16px',
                fontStyle: 'italic',
              }}>
                These should be strengthened through shared infrastructure<br />
                rather than fragmented programmes.
              </p>
            </div>
          </div>
        </section>

        {/* Why Fragmented Ecosystems Fail */}
        <section style={{
          marginBottom: '50px',
          padding: '40px',
          background: `${colors.primary}06`,
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
              The Challenge
            </p>
            <h2 style={{
              fontSize: 'clamp(1.3rem, 2vw, 1.8rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: 0,
            }}>
              Why <span style={{ color: colors.primary }}>Fragmented Ecosystems</span> Fail
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
            gap: '12px',
            maxWidth: '900px',
            margin: '0 auto',
          }}>
            {[
              { label: 'One organisation\nprovides funding', emoji: '💰' },
              { label: 'Another develops\nsuppliers', emoji: '🔧' },
              { label: 'Another offers\nmentoring', emoji: '👨‍🏫' },
              { label: 'Another manages\nprocurement', emoji: '📋' },
              { label: 'Another measures\nimpact', emoji: '📊' },
            ].map((item, index) => (
              <div
                key={index}
                style={{
                  background: colors.white,
                  borderRadius: '10px',
                  padding: '16px 12px',
                  textAlign: 'center',
                  border: `1px solid ${colors.border}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>{item.emoji}</div>
                <p style={{
                  fontSize: '0.7rem',
                  color: colors.muted,
                  whiteSpace: 'pre-line',
                  lineHeight: 1.4,
                  margin: 0,
                }}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          <div style={{
            textAlign: 'center',
            marginTop: '24px',
            padding: '20px',
            background: `${colors.red}08`,
            borderRadius: '10px',
            border: `1px solid ${colors.red}20`,
          }}>
            <p style={{
              fontSize: '0.95rem',
              color: colors.muted,
              lineHeight: 1.7,
              margin: 0,
            }}>
              <span style={{ color: colors.red, fontWeight: 700 }}>✕</span> Each solves one problem.
              <br />
              <span style={{ color: colors.primary, fontWeight: 700 }}>✓</span> Few solve the whole journey.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '16px',
            marginTop: '20px',
          }}>
            {[
              'Businesses repeatedly submit the same information.',
              'Corporates independently develop similar suppliers.',
              'Support often ends before businesses achieve commercial competitiveness.'
            ].map((item, index) => (
              <div
                key={index}
                style={{
                  background: colors.white,
                  borderRadius: '8px',
                  padding: '14px 16px',
                  border: `1px solid ${colors.border}`,
                  textAlign: 'center',
                }}
              >
                <p style={{
                  fontSize: '0.8rem',
                  color: colors.muted,
                  lineHeight: 1.5,
                  margin: 0,
                }}>
                  {item}
                </p>
              </div>
            ))}
          </div>

          <p style={{
            textAlign: 'center',
            fontSize: '0.95rem',
            color: colors.primary,
            fontWeight: 600,
            marginTop: '20px',
          }}>
            BIG believes infrastructure should connect these journeys rather than separate them.
          </p>
        </section>

        {/* Infrastructure Cards */}
        <div id="infrastructure-cards" style={{ marginBottom: '50px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <p style={{
              color: colors.secondary,
              fontWeight: 700,
              fontSize: '0.75rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              Our Infrastructure
            </p>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 2.5vw, 2.2rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: 0,
              letterSpacing: '-0.01em',
            }}>
              Four Layers of <span style={{ color: colors.primary }}>Connected Infrastructure</span>
            </h2>
            <p style={{
              fontSize: '0.95rem',
              color: colors.muted,
              marginTop: '8px',
            }}>
              Each layer solves a fundamental business challenge. Together they create an integrated ecosystem.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '24px',
          }}>
            {infrastructureItems.map((item) => (
              <div
                key={item.id}
                style={{
                  background: colors.white,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: `1px solid ${colors.border}`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(28,20,16,0.08)';
                  e.currentTarget.style.borderColor = item.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = colors.border;
                }}
                onClick={() => handleNavigation(item.path)}
              >
                <div style={{
                  height: '180px',
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <img 
                    src={item.image}
                    alt={item.name}
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
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '50%',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.4))',
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: item.color,
                    color: colors.white,
                    padding: '4px 14px',
                    borderRadius: '20px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}>
                    {item.category}
                  </div>
                </div>

                <div style={{
                  padding: '24px 28px 28px',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px',
                  }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: `${item.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: item.color,
                    }}>
                      {item.icon}
                    </div>
                    <h3 style={{
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      color: colors.dark,
                      margin: 0,
                    }}>
                      {item.name}
                    </h3>
                  </div>

                  <p style={{
                    fontSize: '0.85rem',
                    color: colors.muted,
                    fontWeight: 500,
                    margin: '0 0 8px',
                    fontStyle: 'italic',
                  }}>
                    {item.question}
                  </p>

                  <p style={{
                    fontSize: '0.82rem',
                    color: colors.muted,
                    lineHeight: 1.6,
                    margin: '0 0 16px',
                  }}>
                    {item.description}
                  </p>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px',
                  }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: colors.primary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      Primary Outcome:
                    </span>
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: item.color,
                    }}>
                      {item.outcome}
                    </span>
                  </div>

                  <button
                    style={{
                      background: 'transparent',
                      color: item.color,
                      border: `2px solid ${item.color}`,
                      borderRadius: '8px',
                      padding: '8px 20px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      width: '100%',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = item.color;
                      e.currentTarget.style.color = colors.white;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = item.color;
                    }}
                  >
                    Explore {item.name.replace('™', '')}
                    <span style={{ marginLeft: '6px' }}>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ecosystem Diagram */}
        <section style={{
          marginBottom: '50px',
          padding: '50px 40px',
          background: colors.white,
          borderRadius: '16px',
          border: `1px solid ${colors.border}`,
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <p style={{
              color: colors.secondary,
              fontWeight: 700,
              fontSize: '0.75rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}>
              Connected Infrastructure
            </p>
            <h2 style={{
              fontSize: 'clamp(1.3rem, 2vw, 1.8rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: 0,
            }}>
              Every Infrastructure Layer <span style={{ color: colors.primary }}>Strengthens the Next</span>
            </h2>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            maxWidth: '700px',
            margin: '0 auto',
          }}>
            {[
              { label: 'Trust Infrastructure', color: colors.primary, desc: 'Trust enables opportunity' },
              { label: 'Opportunity Infrastructure', color: colors.amber, desc: 'Opportunity creates growth' },
              { label: 'Growth Infrastructure', color: colors.secondary, desc: 'Growth builds competitive supply' },
              { label: 'Procurement Infrastructure', color: colors.brownLight, desc: 'Competitive supply strengthens the wider business ecosystem' },
            ].map((item, index) => (
              <React.Fragment key={index}>
                <div style={{
                  background: `${item.color}10`,
                  border: `2px solid ${item.color}`,
                  borderRadius: '12px',
                  padding: '16px 24px',
                  width: '100%',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = `0 4px 20px ${item.color}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  <span style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: item.color,
                  }}>
                    {item.label}
                  </span>
                  <span style={{
                    fontSize: '0.8rem',
                    color: colors.muted,
                    marginLeft: '12px',
                  }}>
                    ↓ {item.desc}
                  </span>
                </div>
                {index < 3 && (
                  <div style={{
                    fontSize: '1.2rem',
                    color: colors.neutral,
                  }}>
                    ↓
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <p style={{
            textAlign: 'center',
            fontSize: '0.95rem',
            color: colors.muted,
            marginTop: '24px',
            fontStyle: 'italic',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Every infrastructure layer strengthens the next.
            <br />
            Trust enables opportunity. Opportunity creates growth.
            <br />
            Growth builds competitive supply. Competitive supply strengthens the wider business ecosystem.
          </p>
        </section>

        {/* Closing Section */}
        <section style={{
          position: 'relative',
          padding: '50px',
          background: `linear-gradient(135deg, ${colors.dark} 0%, ${colors.brownDark} 100%)`,
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
            backgroundImage: 'url(https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&h=400&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.06,
          }} />
          
          <div style={{
            position: 'relative',
            zIndex: 1,
          }}>
            <div style={{
              display: 'inline-block',
              padding: '4px 16px',
              background: `${colors.amber}20`,
              borderRadius: '30px',
              marginBottom: '16px',
            }}>
              <span style={{
                color: colors.amber,
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                One Connected Platform
              </span>
            </div>
            
            <h2 style={{
              fontSize: 'clamp(1.5rem, 2.5vw, 2.2rem)',
              fontWeight: 800,
              color: colors.white,
              margin: '0 0 16px',
            }}>
              BIG isn't a collection of products.
              <br />
              It is an <span style={{ color: colors.amber }}>integrated ecosystem platform</span>.
            </h2>
            <p style={{
              fontSize: '1rem',
              color: 'rgba(255,255,255,0.7)',
              margin: '0 0 8px',
              maxWidth: '600px',
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.7,
            }}>
              Each infrastructure layer is valuable on its own.
              <br />
              Together they create an environment where businesses can earn trust, access opportunity,
              grow sustainably and contribute to stronger, more resilient supply chains.
            </p>
            <p style={{
              fontSize: '1.1rem',
              color: colors.amber,
              fontWeight: 600,
              margin: '16px 0 28px',
            }}>
              This is the infrastructure behind better business.
            </p>
            <button
              onClick={() => handleNavigation('/solutions')}
              style={{
                background: `linear-gradient(135deg, ${colors.amber}, ${colors.secondary})`,
                color: colors.white,
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
                boxShadow: `0 4px 20px ${colors.amber}40`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `0 8px 30px ${colors.amber}50`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 20px ${colors.amber}40`;
              }}
            >
              Discover the BIG Platform <FaArrowRight size={14} />
            </button>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default InfrastructurePage;