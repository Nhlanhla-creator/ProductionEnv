import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HeaderAdvisor = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleRegisterClick = () => {
    navigate('/BetaForm');
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

  // Styles
  const styles = {
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 1.5rem',
      backgroundColor: '#FFFFFF',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      width: '100%',
    },
    logoContainer: {
      flex: '0 0 auto',
      marginRight: '0.5rem',
      zIndex: 101
    },
    logo: {
      width: '250px',
      height: 'auto',
      maxHeight: '80px',
      cursor: 'pointer'
    },
    navContainer: {
      display: 'flex',
      flex: '1 1 auto',
      justifyContent: 'center',
      margin: '0 1rem'
    },
    nav: {
      display: 'flex',
      gap: '0.8rem', // Increased gap between tabs
      alignItems: 'center' // Align items vertically
    },
    navButton: {
      minWidth: '100px',
      padding: '0.5rem 0',
      textAlign: 'center',
      fontSize: '0.95rem'
    },
    authContainer: {
      display: 'flex',
      flex: '0 0 auto',
      marginLeft: '1rem' // Moved slightly more to the left
    },
    loginButton: {
      minWidth: '140px', // Slightly wider button
      padding: '0.5rem 0',
      textAlign: 'center',
      fontSize: '0.95rem',
      backgroundColor: '#A78B71',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      marginLeft: '8rem' 
    },
    mobileMenuButton: {
      display: 'none',
      background: 'none',
      border: 'none',
      fontSize: '1.5rem',
      cursor: 'pointer',
      zIndex: 101
    },
    mobileMenu: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'white',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s ease-in-out'
    },
    mobileNavButton: {
      width: '100%',
      padding: '1rem',
      margin: '0.5rem 0',
      textAlign: 'center',
      fontSize: '1.1rem',
      backgroundColor: '#5D432C',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      fontWeight: '600',
      cursor: 'pointer'
    },
    mobileLoginButton: {
      width: '100%',
      padding: '1rem',
      margin: '0.5rem 0',
      textAlign: 'center',
      fontSize: '1.1rem',
      backgroundColor: '#A78B71',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      fontWeight: '600',
      cursor: 'pointer'
    },
    closeButton: {
      position: 'absolute',
      top: '1rem',
      right: '1rem',
      background: 'none',
      border: 'none',
      fontSize: '1.5rem',
      cursor: 'pointer'
    }
  };

  return (
    <>
      <header style={styles.header}>
        {/* Logo */}
        <div style={styles.logoContainer}>
          <picture onClick={() => handleNavigation('/HomePage')}>
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

        {/* Desktop Navigation */}
        <div style={styles.navContainer} className="desktop-nav">
          <nav style={styles.nav}>
            <button 
              className="nav-button"
              onClick={() => handleNavigation('/HomePageAdvisor')}
              style={styles.navButton}
            >
              Home
            </button>
            
            <button 
              className="nav-button"
              onClick={() => handleNavigation('/HowWorksAdvisors')}
              style={styles.navButton}
            >
              How it works
            </button>
            
            <button 
              className="nav-button"
              onClick={() => handleNavigation('/BIGscoreAdvisor')}
              style={styles.navButton}
            >
              BIG score
            </button>
            
            <button 
              className="nav-button"
              onClick={() => handleNavigation('/InsightsAdvisor')}
              style={styles.navButton}
            >
              Insights
            </button>
            
            <button 
              className="nav-button"
              onClick={() => handleNavigation('/FAQsAdvisor')}
              style={styles.navButton}
            >
              FAQs
            </button>

            <button 
              className="nav-button"
              onClick={() => handleNavigation('/ContactAdvisor')}
              style={styles.navButton}
            >
              Contact Us
            </button>

           
          </nav>
        </div>

        {/* Mobile Menu Button */}
        <button 
          style={styles.mobileMenuButton}
          className="mobile-menu-button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          ☰
        </button>

        {/* CSS Styles */}
        <style>{`
          .nav-button {
            background-color: #5D432C;
            color: white;
            border: none;
            border-radius: 5px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          }
          
          .nav-button:hover {
            background-color: #372C27;
            transform: translateY(-1px);
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          .login-button:hover {
            background-color: #8a6d52;
            transform: translateY(-1px);
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          @media (max-width: 1200px) {
            .nav-button, .login-button {
              min-width: 90px;
              font-size: 0.9rem;
            }
          }
          
          @media (max-width: 1024px) {
            .nav-button, .login-button {
              min-width: 85px;
              font-size: 0.85rem;
              padding: 0.4rem 0;
            }
            
            .logo {
              width: 220px;
            }
          }
          
          @media (max-width: 768px) {
            .desktop-nav {
              display: none;
            }
            
            header {
              padding: 0.8rem 1rem;
              justify-content: space-between;
            }
            
            .logo-container {
              margin-right: 0;
            }
            
            .logo {
              width: 180px;
              max-height: 60px;
            }
            
            .mobile-menu-button {
              display: block;
            }
          }

          @media (max-width: 480px) {
            .logo {
              width: 150px;
              max-height: 50px;
            }
          }
        `}</style>
      </header>

      {/* Mobile Menu */}
      <div style={styles.mobileMenu}>
        <button 
          style={styles.closeButton}
          onClick={() => setIsMobileMenuOpen(false)}
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
          onClick={() => handleNavigation('/HowWorksAdvisor')}
        >
          How it works
        </button>
        
        <button 
          style={styles.mobileNavButton}
          onClick={() => handleNavigation('/BIGscoreAdvisor')}
        >
          BIG score
        </button>
        
        <button 
          style={styles.mobileNavButton}
          onClick={() => handleNavigation('/InsightsAdvisor')}
        >
          Insights
        </button>
        
        <button 
          style={styles.mobileNavButton}
          onClick={() => handleNavigation('/FAQsAdvisor')}
        >
          FAQs
        </button>
        
        <button 
          style={styles.mobileNavButton}
          onClick={() => handleNavigation('/ContactAdvisor')}
        >
          Contact Us
        </button>
        
      </div>
    </>
  );
};

export default HeaderAdvisor;