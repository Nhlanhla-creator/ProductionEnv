import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = ({ onLoginClick }) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  const handleRegisterClick = () => {
    if (onLoginClick) {
      onLoginClick();
    }
    setIsMobileMenuOpen(false);
  };

  const handleNavigation = (path) => {
    if (path.startsWith('#')) {
      const element = document.getElementById(path.substring(1));
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(path);
    }
    setIsMobileMenuOpen(false);
  };

  // Improved styles with proper desktop layout
  const styles = {
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: isMobile ? '0.8rem 1rem' : '1rem 2rem',
      backgroundColor: '#FFFFFF',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      width: '100%',
      minHeight: isMobile ? '60px' : '80px',
    },
    logoContainer: {
      flex: '0 0 auto',
      zIndex: 101,
    },
    logo: {
      width: isMobile ? (window.innerWidth <= 480 ? '140px' : '160px') : '250px',
      height: 'auto',
      maxHeight: isMobile ? (window.innerWidth <= 480 ? '40px' : '50px') : '80px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    // New desktop navigation container - takes up middle space
    desktopNavContainer: {
      display: isMobile ? 'none' : 'flex',
      flex: '1 1 auto',
      justifyContent: 'center',
      alignItems: 'center',
      margin: '0 2rem',
    },
    nav: {
      display: 'flex',
      gap: window.innerWidth <= 1024 ? '0.8rem' : '1.2rem',
      alignItems: 'center',
      justifyContent: 'center',
    },
    navButton: {
      minWidth: window.innerWidth <= 1024 ? '90px' : '110px',
      padding: window.innerWidth <= 1024 ? '0.5rem 0.8rem' : '0.6rem 1rem',
      textAlign: 'center',
      fontSize: window.innerWidth <= 1024 ? '0.9rem' : '1rem',
      whiteSpace: 'nowrap',
      backgroundColor: '#5D432C',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    // Separate container for login button on desktop
    desktopLoginContainer: {
      display: isMobile ? 'none' : 'flex',
      flex: '0 0 auto',
      alignItems: 'center',
    },
    loginButton: {
      minWidth: '140px',
      padding: '0.6rem 1.2rem',
      textAlign: 'center',
      fontSize: '1rem',
      backgroundColor: '#A78B71',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      whiteSpace: 'nowrap',
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
      padding: '0.8rem 1rem',
      margin: '0.3rem 0',
      textAlign: 'center',
      fontSize: '1rem',
      backgroundColor: '#5D432C',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
    mobileLoginButton: {
      width: '100%',
      padding: '0.8rem 1rem',
      margin: '0.5rem 0',
      marginTop: '1rem',
      textAlign: 'center',
      fontSize: '1rem',
      backgroundColor: '#A78B71',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
    closeButton: {
      position: 'absolute',
      top: '1rem',
      right: '1rem',
      background: 'none',
      border: 'none',
      fontSize: '1.5rem',
      cursor: 'pointer',
      color: '#5D432C',
      width: '30px',
      height: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }
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
              width="250"
              height="80"
              loading="lazy"
            />
          </picture>
        </div>

        {/* Desktop Navigation - Center */}
        <div style={styles.desktopNavContainer}>
          <nav style={styles.nav}>
            <button 
              className="nav-button"
              onClick={() => handleNavigation('/')}
              style={styles.navButton}
            >
              Home
            </button>
            
            <button 
              className="nav-button"
              onClick={() => handleNavigation('/HowItWorks')}
              style={styles.navButton}
            >
              How it works
            </button>
            
            <button 
              className="nav-button"
              onClick={() => handleNavigation('/BigScorePage')}
              style={styles.navButton}
            >
              BIG score
            </button>
            
            <button 
              className="nav-button"
              onClick={() => handleNavigation('/InsightsPage')}
              style={styles.navButton}
            >
              Insights
            </button>
            
            <button 
              className="nav-button"
              onClick={() => handleNavigation('/FAQPage')}
              style={styles.navButton}
            >
              FAQs
            </button>

            <button 
              className="nav-button"
              onClick={() => handleNavigation('/ContactPage')}
              style={styles.navButton}
            >
              Contact Us
            </button>
          </nav>
        </div>

        {/* Desktop Login Button - Right Side */}
        <div style={styles.desktopLoginContainer}>
          <button 
            className="login-button"
            onClick={handleRegisterClick}
            style={styles.loginButton}
          >
            Login/Register
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          style={styles.mobileMenuButton}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </header>

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
        >
          ✕
        </button>
        
        <button 
          style={styles.mobileNavButton}
          onClick={() => handleNavigation('/')}
        >
          Home
        </button>
        
        <button 
          style={styles.mobileNavButton}
          onClick={() => handleNavigation('/HowItWorks')}
        >
          How it works
        </button>
        
        <button 
          style={styles.mobileNavButton}
          onClick={() => handleNavigation('/BigScorePage')}
        >
          BIG score
        </button>
        
        <button 
          style={styles.mobileNavButton}
          onClick={() => handleNavigation('/InsightsPage')}
        >
          Insights
        </button>
        
        <button 
          style={styles.mobileNavButton}
          onClick={() => handleNavigation('/FAQPage')}
        >
          FAQs
        </button>
        
        <button 
          style={styles.mobileNavButton}
          onClick={() => handleNavigation('/ContactPage')}
        >
          Contact Us
        </button>
        
        <button 
          style={styles.mobileLoginButton}
          onClick={handleRegisterClick}
        >
          Login/Register
        </button>
      </div>

      {/* Enhanced CSS Styles */}
      <style jsx>{`
        .nav-button {
          background-color: #5D432C;
          color: white;
          border: none;
          border-radius: 5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .nav-button:hover {
          background-color: #372C27;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        
        .nav-button:active {
          transform: translateY(0);
        }
        
        .login-button:hover {
          background-color: #8a6d52;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        
        .login-button:active {
          transform: translateY(0);
        }

        /* Mobile menu button hover effect */
        button[aria-label="Toggle mobile menu"]:hover {
          background-color: #372C27;
          transform: scale(1.05);
        }

        /* Mobile menu items hover effects */
        button[style*="background-color: #5D432C"]:hover {
          background-color: #372C27;
          transform: scale(1.02);
        }

        button[style*="background-color: #A78B71"]:hover {
          background-color: #8a6d52;
          transform: scale(1.02);
        }

        /* Responsive breakpoints for better desktop layout */
        @media (max-width: 1200px) {
          .nav-button {
            font-size: 0.9rem;
            padding: 0.5rem 0.8rem;
            min-width: 90px;
          }
          
          .login-button {
            font-size: 0.9rem;
            padding: 0.5rem 1rem;
            min-width: 130px;
          }
        }
        
        @media (max-width: 1024px) {
          .nav-button {
            font-size: 0.85rem;
            padding: 0.45rem 0.7rem;
            min-width: 85px;
          }
          
          .login-button {
            font-size: 0.85rem;
            padding: 0.45rem 0.9rem;
            min-width: 120px;
          }
        }
        
        @media (max-width: 768px) {
          /* Mobile-specific styles are handled in JavaScript */
          body.menu-open {
            overflow: hidden;
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

        /* Smooth transitions for all interactive elements */
        * {
          -webkit-tap-highlight-color: transparent;
        }

        button {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
        }

        /* Accessibility improvements */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* Better spacing for larger screens */
        @media (min-width: 1400px) {
          header {
            padding: 1rem 3rem !important;
          }
          
          .nav-button {
            gap: 1.5rem;
            min-width: 120px;
            padding: 0.7rem 1.2rem;
            font-size: 1.1rem;
          }
          
          .login-button {
            min-width: 160px;
            padding: 0.7rem 1.5rem;
            font-size: 1.1rem;
          }
        }
      `}</style>
    </>
  );
};

export default Header;