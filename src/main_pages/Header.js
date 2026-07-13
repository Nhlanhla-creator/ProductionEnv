import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = ({ onLoginClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // Single source of truth for which desktop dropdown is open.
  // Values: 'howItWorks' | 'solutions' | 'infrastructure' | null
  const [openDropdown, setOpenDropdown] = useState(null);
  const howItWorksRef = useRef(null);
  const solutionsRef = useRef(null);
  const infrastructureRef = useRef(null);
  const timeoutRef = useRef(null);

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInsideAny =
        (howItWorksRef.current && howItWorksRef.current.contains(event.target)) ||
        (solutionsRef.current && solutionsRef.current.contains(event.target)) ||
        (infrastructureRef.current && infrastructureRef.current.contains(event.target));

      if (!clickedInsideAny) {
        setOpenDropdown(null);
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
    setOpenDropdown(null);
    if (onLoginClick) {
      onLoginClick();
    } else {
      navigate('/loginRegister');
      // Scroll to top after navigation
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNavigation = (path) => {
    // Close all dropdowns
    setOpenDropdown(null);
    setIsMobileMenuOpen(false);

    if (path.startsWith('#')) {
      const element = document.getElementById(path.substring(1));
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(path);
      // Scroll to top after navigation
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // BIG Infrastructure dropdown items - Updated: removed Market Intelligence, added Infrastructure landing page
  const bigInfrastructureItems = [
    { label: 'Our Infrastructure', path: '/infrastructure' },
    { label: 'BIG Score', path: '/BigScorePage' },
    { label: 'Matching Infrastructure', path: '/matching-infrastructure' },
    { label: 'Growth Suite', path: '/growth-suite' },
    { label: 'Supply Engine', path: '/supply-engine' },
  ];

  // How It Works dropdown items
  const howItWorksItems = [
    { label: 'For Businesses', path: '/HowItWorksSMSE' },
    { label: 'For Corporates', path: '/HowItWorksCorporates' },
    { label: 'For Investors', path: '/HowItWorksInvestors' },
    { label: 'For Catalysts', path: '/HowItWorksCatalysts' },
    { label: 'For Capital and Market Facilitators', path: '/HowItWorksCapitalMarket' },
    { label: 'For Associations & Member Organisations', path: '/HowItWorksAssociations' },
    { label: 'For Advisors', path: '/HowItWorksAdvisors' },
    { label: 'For Interns', path: '/HowItWorksInterns' },
  ];

  // Solutions dropdown items
  const solutionsItems = [
    { label: 'Overview', path: '/solutions' },
    { label: 'For Businesses', path: '/solutions/smes' },
    { label: 'For Corporates', path: '/solutions/corporates' },
    { label: 'For Investors', path: '/solutions/investors' },
    { label: 'For Catalysts', path: '/solutions/catalysts' },
    { label: 'For Capital and Market Facilitators', path: '/solutions/capital-market' },
    { label: 'For Associations & Member Organisations', path: '/solutions/associations' },
    { label: 'For Advisors', path: '/solutions/advisors' },
    { label: 'For Interns', path: '/solutions/graduates' },
  ];

  const styles = {
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: isMobile ? '0.6rem 1rem' : '0.7rem 2rem',
      backgroundColor: '#FFFFFF',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      width: '100%',
      minHeight: isMobile ? '56px' : '68px',
    },
    logoContainer: {
      flex: '0 0 auto',
      zIndex: 101,
    },
    logo: {
      width: isMobile ? (window.innerWidth <= 480 ? '120px' : '140px') : '190px',
      height: 'auto',
      maxHeight: isMobile ? (window.innerWidth <= 480 ? '34px' : '40px') : '58px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    desktopNavContainer: {
      display: isMobile ? 'none' : 'flex',
      flex: '1 1 auto',
      justifyContent: 'center',
      alignItems: 'center',
      margin: '0 1.2rem',
    },
    nav: {
      display: 'flex',
      gap: window.innerWidth <= 1024 ? '0.3rem' : '0.6rem',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'nowrap',
    },
    navButton: {
      minWidth: window.innerWidth <= 1024 ? '70px' : '90px',
      padding: window.innerWidth <= 1024 ? '0.35rem 0.5rem' : '0.45rem 0.9rem',
      textAlign: 'center',
      fontSize: window.innerWidth <= 1024 ? '0.7rem' : '0.82rem',
      whiteSpace: 'nowrap',
      backgroundColor: '#5D432C',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      letterSpacing: '0.2px',
    },
    dropdownButton: {
      minWidth: window.innerWidth <= 1024 ? '70px' : '90px',
      padding: window.innerWidth <= 1024 ? '0.35rem 0.5rem' : '0.45rem 0.9rem',
      textAlign: 'center',
      fontSize: window.innerWidth <= 1024 ? '0.7rem' : '0.82rem',
      whiteSpace: 'nowrap',
      backgroundColor: '#5D432C',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
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
      fontSize: '0.5rem',
      transition: 'transform 0.3s ease',
    },
    dropdownArrowOpen: {
      transform: 'rotate(180deg)',
    },
    dropdownMenu: {
      position: 'absolute',
      top: 'calc(100% + 8px)',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#FFFFFF',
      borderRadius: '10px',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
      padding: '6px 0',
      minWidth: '260px',
      zIndex: 200,
      display: 'none',  // FIXED: Hide completely when closed to prevent click interception
      opacity: 0,
      visibility: 'hidden',
      transition: 'opacity 0.25s ease, visibility 0.25s ease',
      border: '1px solid #EAE2D8',
      pointerEvents: 'none',
    },
    dropdownMenuOpen: {
      display: 'block',  // FIXED: Show when open
      opacity: 1,
      visibility: 'visible',
      pointerEvents: 'auto',
    },
    dropdownItem: {
      padding: '8px 20px',
      fontSize: '0.8rem',
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
      borderRadius: '4px',
    },
    desktopLoginContainer: {
      display: isMobile ? 'none' : 'flex',
      flex: '0 0 auto',
      alignItems: 'center',
    },
    loginButton: {
      minWidth: '100px',
      padding: '0.45rem 1.2rem',
      textAlign: 'center',
      fontSize: '0.82rem',
      backgroundColor: '#A78B71',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
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
      borderRadius: '6px',
      fontSize: '1.2rem',
      cursor: 'pointer',
      zIndex: 101,
      width: '38px',
      height: '38px',
      transition: 'all 0.3s',
    },
    mobileMenuOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
      width: '85%',
      maxWidth: '320px',
      backgroundColor: '#FFFFFF',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      padding: '1rem',
      paddingTop: '3.5rem',
      transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s ease-in-out',
      boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.08)',
      overflowY: 'auto',
    },
    mobileNavButton: {
      width: '100%',
      padding: '0.6rem 1rem',
      margin: '0.15rem 0',
      textAlign: 'center',
      fontSize: '0.9rem',
      backgroundColor: '#5D432C',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      letterSpacing: '0.2px',
    },
    mobileDropdownHeader: {
      width: '100%',
      padding: '0.6rem 1rem',
      margin: '0.15rem 0',
      textAlign: 'center',
      fontSize: '0.9rem',
      backgroundColor: '#5D432C',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '8px',
      fontFamily: 'inherit',
      letterSpacing: '0.2px',
    },
    mobileDropdownItems: {
      paddingLeft: '0',
      overflow: 'hidden',
      maxHeight: 0,
      transition: 'max-height 0.3s ease',
    },
    mobileDropdownItemsOpen: {
      maxHeight: '500px',
    },
    mobileDropdownItem: {
      width: '100%',
      padding: '0.45rem 1rem',
      margin: '0.05rem 0',
      textAlign: 'center',
      fontSize: '0.82rem',
      backgroundColor: '#F5F0E8',
      color: '#372C27',
      border: 'none',
      borderRadius: '4px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      fontFamily: 'inherit',
      letterSpacing: '0.2px',
    },
    mobileLoginButton: {
      width: '100%',
      padding: '0.6rem 1rem',
      margin: '0.3rem 0',
      marginTop: '0.6rem',
      textAlign: 'center',
      fontSize: '0.9rem',
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
      fontSize: '1.3rem',
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
    dropdownWrapper: {
      position: 'relative',
    },
  };

  // Handle mouse enter with delay to prevent accidental closing.
  // Opening a dropdown always closes whichever one was open before it,
  // because openDropdown can only hold a single value at a time.
  const handleMouseEnter = (name) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setOpenDropdown(name);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
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
              width="190"
              height="58"
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

            {/* BIG Infrastructure Dropdown - Second */}
            <div
              ref={infrastructureRef}
              style={styles.dropdownWrapper}
              onMouseEnter={() => handleMouseEnter('infrastructure')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className="nav-btn dropdown-btn"
                style={{
                  ...styles.dropdownButton,
                  backgroundColor: openDropdown === 'infrastructure' ? '#372C27' : '#5D432C',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#372C27';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  if (openDropdown !== 'infrastructure') {
                    e.currentTarget.style.backgroundColor = '#5D432C';
                  }
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                BIG Infrastructure
                <span style={{
                  ...styles.dropdownArrow,
                  transform: openDropdown === 'infrastructure' ? 'rotate(180deg)' : 'rotate(0deg)',
                }}>▼</span>
              </button>

              <div style={{
                ...styles.dropdownMenu,
                ...(openDropdown === 'infrastructure' ? styles.dropdownMenuOpen : {}),
              }}>
                {bigInfrastructureItems.map((item) => (
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

            {/* Solutions Dropdown - Third */}
            <div
              ref={solutionsRef}
              style={styles.dropdownWrapper}
              onMouseEnter={() => handleMouseEnter('solutions')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className="nav-btn dropdown-btn"
                style={{
                  ...styles.dropdownButton,
                  backgroundColor: openDropdown === 'solutions' ? '#372C27' : '#5D432C',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#372C27';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  if (openDropdown !== 'solutions') {
                    e.currentTarget.style.backgroundColor = '#5D432C';
                  }
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Solutions
                <span style={{
                  ...styles.dropdownArrow,
                  transform: openDropdown === 'solutions' ? 'rotate(180deg)' : 'rotate(0deg)',
                }}>▼</span>
              </button>

              {/* FIXED: Solutions dropdown aligned to the right to prevent overlapping login button */}
              <div style={{
                ...styles.dropdownMenu,
                ...(openDropdown === 'solutions' ? styles.dropdownMenuOpen : {}),
                left: 'auto',
                right: '0',
                transform: 'none',
              }}>
                {solutionsItems.map((item) => (
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

            {/* How It Works Dropdown - Fourth */}
            <div
              ref={howItWorksRef}
              style={styles.dropdownWrapper}
              onMouseEnter={() => handleMouseEnter('howItWorks')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className="nav-btn dropdown-btn"
                style={{
                  ...styles.dropdownButton,
                  backgroundColor: openDropdown === 'howItWorks' ? '#372C27' : '#5D432C',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#372C27';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  if (openDropdown !== 'howItWorks') {
                    e.currentTarget.style.backgroundColor = '#5D432C';
                  }
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                How It Works
                <span style={{
                  ...styles.dropdownArrow,
                  transform: openDropdown === 'howItWorks' ? 'rotate(180deg)' : 'rotate(0deg)',
                }}>▼</span>
              </button>

              {/* FIXED: How It Works dropdown aligned to the right to prevent overlapping login button */}
              <div style={{
                ...styles.dropdownMenu,
                ...(openDropdown === 'howItWorks' ? styles.dropdownMenuOpen : {}),
                left: 'auto',
                right: '0',
                transform: 'none',
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

            {/* BIG Pulse - Fifth */}
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

            {/* BIG Academy - Sixth */}
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

            {/* Contact Us - Seventh */}
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
      <div style={{ height: isMobile ? '56px' : '68px' }} />

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

        {/* BIG Infrastructure - Second in mobile */}
        <div>
          <button
            style={styles.mobileDropdownHeader}
            onClick={() => {
              const items = document.getElementById('mobileInfrastructureDropdownItems');
              if (items) {
                const isOpen = items.style.maxHeight === '500px';
                items.style.maxHeight = isOpen ? '0' : '500px';
              }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#372C27';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#5D432C';
            }}
          >
            BIG Infrastructure ▼
          </button>
          <div id="mobileInfrastructureDropdownItems" style={styles.mobileDropdownItems}>
            {bigInfrastructureItems.map((item) => (
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

        {/* Solutions - Third in mobile */}
        <div>
          <button
            style={styles.mobileDropdownHeader}
            onClick={() => {
              const items = document.getElementById('mobileSolutionsDropdownItems');
              if (items) {
                const isOpen = items.style.maxHeight === '500px';
                items.style.maxHeight = isOpen ? '0' : '500px';
              }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#372C27';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#5D432C';
            }}
          >
            Solutions ▼
          </button>
          <div id="mobileSolutionsDropdownItems" style={styles.mobileDropdownItems}>
            {solutionsItems.map((item) => (
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

        {/* How It Works - Fourth in mobile */}
        <div>
          <button
            style={styles.mobileDropdownHeader}
            onClick={() => {
              const items = document.getElementById('mobileHowItWorksDropdownItems');
              if (items) {
                const isOpen = items.style.maxHeight === '500px';
                items.style.maxHeight = isOpen ? '0' : '500px';
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
          <div id="mobileHowItWorksDropdownItems" style={styles.mobileDropdownItems}>
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

        {/* BIG Pulse - Fifth in mobile */}
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

        {/* BIG Academy - Sixth in mobile */}
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

        {/* Contact Us - Seventh in mobile */}
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
        #mobileHowItWorksDropdownItems,
        #mobileSolutionsDropdownItems,
        #mobileInfrastructureDropdownItems {
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
            padding: 0.8rem 3rem !important;
          }

          .nav-btn {
            padding: 0.5rem 1.2rem !important;
            font-size: 0.9rem !important;
            min-width: 100px !important;
          }

          .login-btn {
            padding: 0.5rem 1.4rem !important;
            font-size: 0.9rem !important;
            min-width: 130px !important;
          }
        }

        /* Small desktop screens */
        @media (max-width: 1024px) {
          .nav-btn {
            font-size: 0.68rem !important;
            padding: 0.3rem 0.45rem !important;
            min-width: 62px !important;
          }

          .login-btn {
            font-size: 0.75rem !important;
            padding: 0.3rem 0.9rem !important;
            min-width: 95px !important;
          }
        }

        @media (max-width: 480px) {
          header {
            padding: 0.5rem 0.8rem !important;
          }
        }

        @media (max-width: 360px) {
          header {
            padding: 0.4rem 0.6rem !important;
          }
        }
      `}</style>
    </>
  );
};

export default Header;