import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = ({ onLoginClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Check if device is mobile on mount and resize
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsHowItWorksOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleLoginClick = () => {
    setIsMobileMenuOpen(false);
    setIsHowItWorksOpen(false);
    if (onLoginClick) {
      onLoginClick();
    } else {
      navigate('/loginRegister');
    }
  };

  const handleNavigation = (path) => {
    if (path.startsWith('#')) {
      const element = document.getElementById(path.substring(1));
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(path);
    }
    setIsMobileMenuOpen(false);
    setIsHowItWorksOpen(false);
  };

  // How It Works dropdown items - from Landing Page "Who benefits from BIG?"
  const howItWorksItems = [
    { label: 'For SMSEs', path: '/HowItWorksSMSE' },
    { label: 'For Investors', path: '/HowItWorksInvestors' },
    { label: 'For Corporates', path: '/HowItWorksCorporates' },
    { label: 'For Catalysts', path: '/HowItWorksCatalysts' },
    { label: 'For Advisors', path: '/HowItWorksAdvisors' },
    { label: 'For Interns', path: '/HowItWorksInterns' },
  ];

  // Navigation items - UPDATED: Home, BIG Score, How It Works, BIG Pulse, BIG Academy, Contact Us
  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'BIG Score', path: '/BigScorePage' },
    // How It Works is handled separately as a dropdown
    { label: 'BIG Pulse', path: '/InsightsPage' },  // Renamed from "Insights" to "BIG Pulse"
    { label: 'BIG Academy', path: '/CharmSchool' }, // Renamed from "CSI @BIG" to "BIG Academy"
    { label: 'Contact Us', path: '/ContactPage' },
  ];

  const styles = {
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: isMobile ? '0.7rem 1rem' : '0.85rem 2rem',
      backgroundColor: '#FFFFFF',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      width: '100%',
      minHeight: isMobile ? '60px' : '72px',
    },
    logoContainer: {
      flex: '0 0 auto',
      zIndex: 101,
    },
    logo: {
      width: isMobile ? (window.innerWidth <= 480 ? '130px' : '150px') : '210px',
      height: 'auto',
      maxHeight: isMobile ? (window.innerWidth <= 480 ? '38px' : '45px') : '65px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    desktopNavContainer: {
      display: isMobile ? 'none' : 'flex',
      flex: '1 1 auto',
      justifyContent: 'center',
      alignItems: 'center',
      margin: '0 1.5rem',
    },
    nav: {
      display: 'flex',
      gap: window.innerWidth <= 1024 ? '0.5rem' : '0.8rem',
      alignItems: 'center',
      justifyContent: 'center',
    },
    navButton: {
      minWidth: window.innerWidth <= 1024 ? '80px' : '95px',
      padding: window.innerWidth <= 1024 ? '0.4rem 0.7rem' : '0.5rem 1rem',
      textAlign: 'center',
      fontSize: window.innerWidth <= 1024 ? '0.82rem' : '0.9rem',
      whiteSpace: 'nowrap',
      backgroundColor: '#5D432C',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      letterSpacing: '0.2px',
    },
    dropdownButton: {
      minWidth: window.innerWidth <= 1024 ? '80px' : '95px',
      padding: window.innerWidth <= 1024 ? '0.4rem 0.7rem' : '0.5rem 1rem',
      textAlign: 'center',
      fontSize: window.innerWidth <= 1024 ? '0.82rem' : '0.9rem',
      whiteSpace: 'nowrap',
      backgroundColor: '#5D432C',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '5px',
      letterSpacing: '0.2px',
    },
    dropdownArrow: {
      fontSize: '0.55rem',
      transition: 'transform 0.3s ease',
    },
    dropdownArrowOpen: {
      transform: 'rotate(180deg)',
    },
    dropdownMenu: {
      position: 'absolute',
      top: 'calc(100% + 6px)',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#FFFFFF',
      borderRadius: '8px',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
      padding: '6px 0',
      minWidth: '200px',
      zIndex: 200,
      opacity: 0,
      visibility: 'hidden',
      transition: 'all 0.25s ease',
      border: '1px solid #EAE2D8',
    },
    dropdownMenuOpen: {
      opacity: 1,
      visibility: 'visible',
    },
    dropdownItem: {
      padding: '8px 18px',
      fontSize: '0.82rem',
      fontWeight: '500',
      color: '#372C27',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      border: 'none',
      background: 'transparent',
      width: '100%',
      textAlign: 'left',
      display: 'block',
      fontFamily: 'inherit',
      letterSpacing: '0.2px',
    },
    desktopLoginContainer: {
      display: isMobile ? 'none' : 'flex',
      flex: '0 0 auto',
      alignItems: 'center',
    },
    loginButton: {
      minWidth: '120px',
      padding: '0.5rem 1.2rem',
      textAlign: 'center',
      fontSize: '0.9rem',
      backgroundColor: '#A78B71',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      whiteSpace: 'nowrap',
      letterSpacing: '0.2px',
    },
    mobileMenuButton: {
      display: isMobile ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#5D432C',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      fontSize: '1.2rem',
      cursor: 'pointer',
      zIndex: 101,
      width: '40px',
      height: '40px',
      transition: 'all 0.3s',
    },
    mobileMenuOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 99,
      display: isMobileMenuOpen ? 'block' : 'none',
      opacity: isMobileMenuOpen ? 1 : 0,
      transition: 'opacity 0.3s ease-in-out',
    },
    mobileMenu: {
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '80%',
      maxWidth: '300px',
      backgroundColor: 'white',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      padding: '1rem',
      paddingTop: '4rem',
      transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s ease-in-out',
      boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.1)',
      overflowY: 'auto',
    },
    mobileNavButton: {
      width: '100%',
      padding: '0.7rem 1rem',
      margin: '0.25rem 0',
      textAlign: 'center',
      fontSize: '0.95rem',
      backgroundColor: '#5D432C',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      letterSpacing: '0.3px',
    },
    mobileDropdownHeader: {
      width: '100%',
      padding: '0.7rem 1rem',
      margin: '0.25rem 0',
      textAlign: 'center',
      fontSize: '0.95rem',
      backgroundColor: '#5D432C',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '6px',
      fontFamily: 'inherit',
      letterSpacing: '0.3px',
    },
    mobileDropdownItems: {
      paddingLeft: '0',
      overflow: 'hidden',
      maxHeight: 0,
      transition: 'max-height 0.3s ease',
    },
    mobileDropdownItemsOpen: {
      maxHeight: '400px',
    },
    mobileDropdownItem: {
      width: '100%',
      padding: '0.55rem 1rem',
      margin: '0.1rem 0',
      textAlign: 'center',
      fontSize: '0.88rem',
      backgroundColor: '#F5F0E8',
      color: '#372C27',
      border: 'none',
      borderRadius: '4px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontFamily: 'inherit',
      letterSpacing: '0.2px',
    },
    mobileLoginButton: {
      width: '100%',
      padding: '0.7rem 1rem',
      margin: '0.3rem 0',
      marginTop: '0.8rem',
      textAlign: 'center',
      fontSize: '0.95rem',
      backgroundColor: '#A78B71',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      letterSpacing: '0.3px',
    },
    closeButton: {
      position: 'absolute',
      top: '0.8rem',
      right: '0.8rem',
      background: 'none',
      border: 'none',
      fontSize: '1.4rem',
      cursor: 'pointer',
      color: '#5D432C',
      width: '30px',
      height: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    divider: {
      height: '1px',
      backgroundColor: '#EAE2D8',
      margin: '0.4rem 0',
    },
  };

  return (
    <>
      <header style={styles.header}>
        {/* Logo */}
        <div style={styles.logoContainer}>
          <picture onClick={() => handleNavigation('/')}>
            <source srcSet="/MainLogo.webp" type="image/webp" />
            <source srcSet="/MainLogo.png" type="image/png" />
            <img
              src="/logo.png"
              alt="Brown Ivory Group Logo"
              style={styles.logo}
              width="210"
              height="65"
              loading="lazy"
            />
          </picture>
        </div>

        {/* Desktop Navigation */}
        <div style={styles.desktopNavContainer}>
          <nav style={styles.nav}>
            {/* Home - First */}
            <button
              className="nav-btn"
              onClick={() => handleNavigation('/')}
              style={styles.navButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#372C27';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#5D432C';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Home
            </button>

            {/* BIG Score - Second */}
            <button
              className="nav-btn"
              onClick={() => handleNavigation('/BigScorePage')}
              style={styles.navButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#372C27';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#5D432C';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              BIG Score
            </button>

            {/* How It Works Dropdown - Third */}
            <div 
              ref={dropdownRef}
              style={{ position: 'relative' }}
              onMouseEnter={() => setIsHowItWorksOpen(true)}
              onMouseLeave={() => setIsHowItWorksOpen(false)}
            >
              <button
                className="nav-btn dropdown-btn"
                style={{
                  ...styles.dropdownButton,
                  backgroundColor: isHowItWorksOpen ? '#372C27' : '#5D432C',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#372C27';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  if (!isHowItWorksOpen) {
                    e.currentTarget.style.backgroundColor = '#5D432C';
                  }
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                How It Works
                <span style={{
                  ...styles.dropdownArrow,
                  transform: isHowItWorksOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}>▼</span>
              </button>

              <div style={{
                ...styles.dropdownMenu,
                ...(isHowItWorksOpen ? styles.dropdownMenuOpen : {}),
              }}>
                {howItWorksItems.map((item) => (
                  <button
                    key={item.label}
                    style={styles.dropdownItem}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F5F0E8';
                      e.currentTarget.style.color = '#754A2D';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#372C27';
                    }}
                    onClick={() => handleNavigation(item.path)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* BIG Pulse - Fourth (renamed from Insights) */}
            <button
              className="nav-btn"
              onClick={() => handleNavigation('/InsightsPage')}
              style={styles.navButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#372C27';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#5D432C';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              BIG Pulse
            </button>

            {/* BIG Academy - Fifth (renamed from CSI @BIG) */}
            <button
              className="nav-btn"
              onClick={() => handleNavigation('/CharmSchool')}
              style={styles.navButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#372C27';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#5D432C';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              BIG Academy
            </button>

            {/* Contact Us - Sixth */}
            <button
              className="nav-btn"
              onClick={() => handleNavigation('/ContactPage')}
              style={styles.navButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#372C27';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#5D432C';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Contact Us
            </button>
          </nav>
        </div>

        {/* Desktop Login Button */}
        <div style={styles.desktopLoginContainer}>
          <button
            className="login-btn"
            onClick={handleLoginClick}
            style={styles.loginButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#8a6d52';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#A78B71';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Login/Register
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          style={styles.mobileMenuButton}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#372C27';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#5D432C';
          }}
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Add padding to body to account for fixed header */}
      <div style={{ height: isMobile ? '60px' : '72px' }} />

      {/* Mobile Menu Overlay */}
      <div
        style={styles.mobileMenuOverlay}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Menu */}
      <div style={styles.mobileMenu}>
        <button
          style={styles.closeButton}
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Close mobile menu"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#754A2D';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#5D432C';
          }}
        >
          ✕
        </button>

        {/* Home - First in mobile */}
        <button
          style={styles.mobileNavButton}
          onClick={() => handleNavigation('/')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#372C27';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#5D432C';
          }}
        >
          Home
        </button>

        {/* BIG Score - Second in mobile */}
        <button
          style={styles.mobileNavButton}
          onClick={() => handleNavigation('/BigScorePage')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#372C27';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#5D432C';
          }}
        >
          BIG Score
        </button>

        {/* How It Works - Third in mobile */}
        <div>
          <button
            style={styles.mobileDropdownHeader}
            onClick={() => {
              const items = document.getElementById('mobileDropdownItems');
              if (items) {
                const isOpen = items.style.maxHeight === '400px';
                items.style.maxHeight = isOpen ? '0' : '400px';
              }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#372C27';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#5D432C';
            }}
          >
            How It Works ▼
          </button>
          <div id="mobileDropdownItems" style={styles.mobileDropdownItems}>
            {howItWorksItems.map((item) => (
              <button
                key={item.label}
                style={styles.mobileDropdownItem}
                onClick={() => handleNavigation(item.path)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#EAE2D8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F5F0E8';
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* BIG Pulse - Fourth in mobile (renamed from Insights) */}
        <button
          style={styles.mobileNavButton}
          onClick={() => handleNavigation('/InsightsPage')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#372C27';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#5D432C';
          }}
        >
          BIG Pulse
        </button>

        {/* BIG Academy - Fifth in mobile (renamed from CSI @BIG) */}
        <button
          style={styles.mobileNavButton}
          onClick={() => handleNavigation('/CharmSchool')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#372C27';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#5D432C';
          }}
        >
          BIG Academy
        </button>

        {/* Contact Us - Sixth in mobile */}
        <button
          style={styles.mobileNavButton}
          onClick={() => handleNavigation('/ContactPage')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#372C27';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#5D432C';
          }}
        >
          Contact Us
        </button>

        <div style={styles.divider} />

        <button
          style={styles.mobileLoginButton}
          onClick={handleLoginClick}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#8a6d52';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#A78B71';
          }}
        >
          Login/Register
        </button>
      </div>

      {/* CSS Styles */}
      <style>{`
        /* Header fixed at top */
        header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
        }

        /* Desktop nav button hover states */
        .nav-btn {
          transition: all 0.3s ease;
          font-family: 'Inter', 'Neue Haas Grotesk Text Pro', sans-serif;
        }

        .nav-btn:active {
          transform: scale(0.97);
        }

        /* Login button */
        .login-btn {
          transition: all 0.3s ease;
          font-family: 'Inter', 'Neue Haas Grotesk Text Pro', sans-serif;
        }

        .login-btn:active {
          transform: scale(0.97);
        }

        /* Mobile menu button */
        button[aria-label="Toggle mobile menu"] {
          transition: all 0.3s ease;
        }

        button[aria-label="Toggle mobile menu"]:active {
          transform: scale(0.95);
        }

        /* Dropdown items */
        .dropdown-item {
          transition: all 0.15s ease;
        }

        /* Mobile menu scroll */
        #mobileDropdownItems {
          transition: max-height 0.3s ease;
          overflow: hidden;
        }

        /* Mobile menu items */
        @media (max-width: 768px) {
          button[style*="mobileNavButton"]:active {
            transform: scale(0.97);
          }
          
          button[style*="mobileLoginButton"]:active {
            transform: scale(0.97);
          }
        }

        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* Large screens */
        @media (min-width: 1400px) {
          header {
            padding: 1rem 3rem !important;
          }
          
          .nav-btn {
            padding: 0.6rem 1.2rem !important;
            font-size: 1rem !important;
            min-width: 105px !important;
          }
          
          .login-btn {
            padding: 0.6rem 1.4rem !important;
            font-size: 1rem !important;
            min-width: 140px !important;
          }
        }

        /* Small desktop screens */
        @media (max-width: 1024px) {
          .nav-btn {
            font-size: 0.78rem !important;
            padding: 0.35rem 0.6rem !important;
            min-width: 75px !important;
          }
          
          .login-btn {
            font-size: 0.78rem !important;
            padding: 0.35rem 0.9rem !important;
            min-width: 110px !important;
          }
        }

        @media (max-width: 480px) {
          header {
            padding: 0.6rem 0.8rem !important;
          }
        }

        @media (max-width: 360px) {
          header {
            padding: 0.5rem 0.6rem !important;
          }
        }
      `}</style>
    </>
  );
};

export default Header;