import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaBuilding, 
  FaChartLine, 
  FaHandshake, 
  FaRocket, 
  FaUsers, 
  FaGraduationCap,
  FaArrowRight,
  FaCheckCircle,
  FaShieldAlt,
  FaAward,
  FaGlobeAfrica,
  FaBriefcase,
  FaFileContract,
  FaSearchDollar,
  FaNetworkWired,
  FaUserTie,
  FaClipboardList,
  FaChartBar,
  FaUserGraduate,
  FaLightbulb
} from 'react-icons/fa';
import Header from '../Header';
import Footer from '../Footer';

const SolutionsOverview = () => {
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
    orange: '#E8831A',
    blue: '#1D5FAA',
    gold: '#C9A96E',
  };

  const stakeholderCards = [
    {
      id: 'businesses',
      icon: <FaBuilding size={32} />,
      image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=400&h=250&q=80',
      title: 'For Businesses & NPOs',
      subtitle: 'Build credibility. Access opportunities. Grow with confidence.',
      description: 'Commercial businesses seeking growth, markets, suppliers, funding, partnerships, etc. and NGOs/NPOs that are not primarily operating as catalysts.',
      path: '/solutions/businesses',
      gradient: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
      color: colors.primary,
      features: ['BIG Score', 'Compliance Vault', 'Funding Matchmaking', 'Growth Suite'],
    },
    {
      id: 'investors',
      icon: <FaChartLine size={32} />,
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&h=250&q=80',
      title: 'For Investors',
      subtitle: 'Better deal flow. Better decisions. Better outcomes.',
      description: 'Access pre-vetted opportunities and reduce screening time with data-driven insights.',
      path: '/solutions/investors',
      gradient: `linear-gradient(135deg, ${colors.brown}, ${colors.brownLight})`,
      color: colors.brown,
      features: ['Pre-Vetted Pipeline', 'BIG Score', 'Portfolio Intelligence', 'Due Diligence'],
    },
    {
      id: 'corporates',
      icon: <FaHandshake size={32} />,
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&h=250&q=80',
      title: 'For Corporates',
      subtitle: 'Build stronger suppliers and stronger ecosystems.',
      description: 'Large companies looking for suppliers, innovation, partnerships, or ESD opportunities.',
      path: '/solutions/corporates',
      gradient: `linear-gradient(135deg, ${colors.brownDark}, ${colors.brown})`,
      color: colors.brownDark,
      features: ['ESD Platform', 'Supplier Intelligence', 'Portfolio Intelligence', 'Internship Management'],
    },
    {
      id: 'catalysts',
      icon: <FaRocket size={32} />,
      image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=400&h=250&q=80',
      title: 'For Catalysts,Associations & Member Organisations',
      subtitle: 'Move from program management to ecosystem intelligence.',
      description: 'Catalyst and Business Association Organisations that enable business growth (ESD programmes, incubators, accelerators, development agencies, industry associations, universities, consultants, etc.).',
      path: '/solutions/catalysts',
      gradient: `linear-gradient(135deg, ${colors.orange}, ${colors.amber})`,
      color: colors.orange,
      features: ['Programme Intelligence', 'Cohort Management', 'Growth Suite', 'Portfolio Intelligence'],
    },
    {
      id: 'interns',
      icon: <FaUserGraduate size={32} />,
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=400&h=250&q=80',
      title: 'For Interns & Internship Sponsors',
      subtitle: 'Experience should not depend on who you know.',
      description: 'Connect interns with businesses for experiential learning and create sustainable talent pipelines. Interns gain practical experience while sponsors build future-ready workforces.',
      path: '/solutions/interns',
      gradient: `linear-gradient(135deg, ${colors.accent}, ${colors.brownLight})`,
      color: colors.accent,
      features: ['Internship Marketplace', 'Skills Profiles', 'Opportunity Matching', 'Talent Pipelines'],
    },
    {
      id: 'advisors',
      icon: <FaUserTie size={32} />,
      image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=400&h=250&q=80',
      title: 'For Advisors & Service Providers',
      subtitle: 'Work with businesses that are serious about growth.',
      description: 'Access qualified leads and build long-term client relationships.',
      path: '/solutions/advisors',
      gradient: `linear-gradient(135deg, ${colors.amber}, ${colors.gold})`,
      color: colors.amber,
      features: ['Advisor Marketplace', 'Referral Engine', 'Growth Suite Integration'],
    },
  ];

  const handleCardClick = (path) => {
    navigate(path);
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
            backgroundImage: 'url(https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1400&h=400&fit=crop&crop=center)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.2,
            zIndex: 0,
          }} />
          
          <div style={{
            position: 'absolute',
            top: -80,
            right: -30,
            width: 350,
            height: 350,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.amber}15, transparent)`,
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            bottom: -100,
            left: -40,
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.primary}15, transparent)`,
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
                One Ecosystem. Multiple Stakeholders. Shared Growth.
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
              Solutions for <span style={{ color: colors.amber }}>Every</span> Stakeholder
            </h1>
            
            <p style={{
              fontSize: '1.05rem',
              color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.7,
              margin: '0 0 20px',
              maxWidth: '550px',
            }}>
              BIG Marketplace provides trust infrastructure, intelligence and growth support for every participant in the business ecosystem.
            </p>

            <div style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.85rem',
              }}>
                <FaCheckCircle size={14} color={colors.amber} />
                Trusted Infrastructure
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.85rem',
              }}>
                <FaShieldAlt size={14} color={colors.amber} />
                Verified Intelligence
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.85rem',
              }}>
                <FaGlobeAfrica size={14} color={colors.amber} />
                Shared Growth
              </div>
            </div>
          </div>
        </section>

        {/* Stakeholder Cards Grid */}
        <section style={{ marginBottom: '50px' }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '40px',
          }}>
            <p style={{
              color: colors.secondary,
              fontWeight: 700,
              fontSize: '0.75rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              Who We Serve
            </p>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: 0,
              letterSpacing: '-0.01em',
            }}>
              Solutions for <span style={{ color: colors.primary }}>Every Stakeholder</span>
            </h2>
            <p style={{
              fontSize: '0.95rem',
              color: colors.muted,
              marginTop: '8px',
            }}>
              Choose your role to see how BIG Marketplace can help you achieve your goals
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
          }}>
            {stakeholderCards.map((card) => (
              <div
                key={card.id}
                onClick={() => handleCardClick(card.path)}
                style={{
                  background: colors.white,
                  borderRadius: '16px',
                  padding: '28px 24px',
                  border: `1px solid ${colors.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 16px 48px rgba(28,20,16,0.12)';
                  e.currentTarget.style.borderColor = card.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = colors.border;
                }}
              >
                {/* Card Image */}
                <div style={{
                  width: '100%',
                  height: '160px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  marginBottom: '16px',
                  position: 'relative',
                }}>
                  <img 
                    src={card.image} 
                    alt={card.title}
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
                      // Show fallback icon
                      const fallback = e.target.parentElement.querySelector('.fallback-icon');
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="fallback-icon" style={{
                    display: 'none',
                    width: '100%',
                    height: '100%',
                    background: `${card.color}15`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '3rem',
                    color: card.color,
                  }}>
                    {card.icon}
                  </div>
                </div>

                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: `${card.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: card.color,
                  marginBottom: '12px',
                }}>
                  {card.icon}
                </div>

                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: colors.dark,
                  margin: '0 0 4px',
                }}>
                  {card.title}
                </h3>

                <p style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: card.color,
                  margin: '0 0 10px',
                  letterSpacing: '-0.01em',
                }}>
                  {card.subtitle}
                </p>

                <p style={{
                  fontSize: '0.85rem',
                  color: colors.muted,
                  lineHeight: 1.6,
                  margin: '0 0 14px',
                }}>
                  {card.description}
                </p>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  marginBottom: '14px',
                }}>
                  {card.features.map((feature, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: `${card.color}10`,
                        color: card.color,
                        padding: '2px 10px',
                        borderRadius: '50px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: card.color,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}>
                  Learn More <FaArrowRight size={12} />
                </div>

                <div style={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: `${card.color}08`,
                  pointerEvents: 'none',
                }} />
              </div>
            ))}
          </div>
        </section>

        {/* The BIG Difference Section */}
        <section style={{
          marginBottom: '50px',
          padding: '50px 40px',
          background: colors.white,
          borderRadius: '20px',
          border: `1px solid ${colors.border}`,
          boxShadow: '0 4px 30px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '32px',
          }}>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 2.5vw, 2.2rem)',
              fontWeight: 800,
              color: colors.dark,
              margin: '0 0 8px',
            }}>
              The <span style={{ color: colors.primary }}>BIG</span> Difference
            </h2>
            <p style={{
              fontSize: '0.95rem',
              color: colors.muted,
              maxWidth: '600px',
              margin: '0 auto',
            }}>
              Most ecosystems operate in silos. BIG Marketplace connects them all.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
          }}>
            {[
              {
                icon: <FaBuilding size={22} color={colors.primary} />,
                problem: 'Businesses cannot find capital.',
                solution: 'BIG connects them to funders.',
              },
              {
                icon: <FaSearchDollar size={22} color={colors.brown} />,
                problem: 'Investors cannot find credible businesses.',
                solution: 'BIG provides verified opportunities.',
              },
              {
                icon: <FaNetworkWired size={22} color={colors.brownDark} />,
                problem: 'Corporates cannot find ready suppliers.',
                solution: 'BIG matches them with vetted vendors.',
              },
              {
                icon: <FaUserGraduate size={22} color={colors.accent} />,
                problem: 'Interns cannot find experience.',
                solution: 'BIG connects them to businesses.',
              },
              {
                icon: <FaClipboardList size={22} color={colors.orange} />,
                problem: 'Support programmes lose visibility once businesses leave.',
                solution: 'BIG provides ongoing intelligence.',
              },
              {
                icon: <FaLightbulb size={22} color={colors.amber} />,
                problem: 'Ecosystems operate in silos.',
                solution: 'BIG brings everyone together.',
              },
            ].map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '16px 20px',
                  background: colors.light,
                  borderRadius: '12px',
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  {item.icon}
                  <span style={{
                    fontWeight: 600,
                    color: colors.dark,
                    fontSize: '0.85rem',
                  }}>
                    {item.problem}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  paddingLeft: '32px',
                }}>
                  <span style={{
                    color: colors.brown,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                  }}>
                    ✓
                  </span>
                  <span style={{
                    fontSize: '0.82rem',
                    color: colors.muted,
                  }}>
                    {item.solution}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '28px',
            padding: '20px',
            textAlign: 'center',
            background: `linear-gradient(135deg, ${colors.primary}08, ${colors.secondary}08)`,
            borderRadius: '12px',
            border: `1px solid ${colors.primary}20`,
          }}>
            <p style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: colors.dark,
              margin: 0,
              letterSpacing: '-0.01em',
            }}>
              One Profile. <span style={{ color: colors.primary }}>One BIG Score.</span> Many Doors.
            </p>
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
            fontSize: 'clamp(1.3rem, 2.2vw, 2rem)',
            fontWeight: 800,
            color: colors.white,
            margin: '0 0 12px',
          }}>
            Ready to Join the BIG Ecosystem?
          </h2>
          <p style={{
            fontSize: '1rem',
            color: 'rgba(255,255,255,0.85)',
            margin: '0 0 24px',
            maxWidth: '500px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Whether you're a business, investor, corporate, catalyst, intern, or advisor — there's a place for you.
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
            Get Started Today <FaArrowRight size={14} />
          </button>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default SolutionsOverview;