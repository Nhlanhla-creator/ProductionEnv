import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './HomeHeader.module.css';

const HomeHeader = ({ 
  userType = 'home', // 'home' or 'investor'
  customRoutes = null, // optional custom routes array
  customLogoPath = null // optional custom logo navigation path
}) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      if (typeof document !== "undefined" && document.body) {
        return document.body.classList.contains("sidebar-collapsed");
      }
      return localStorage.getItem("sidebarOpen") === "false";
    } catch (e) {
      return false;
    }
  });

  // Default routes based on userType
  const defaultRoutes = {
    home: [
      { label: 'Home', path: '/HomePage' },
      { label: 'How it works', path: '/HomeHowItWorks' },
      { label: 'BIG score', path: '/HomeBigScorePage' },
      { label: 'Insights', path: '/HomeInsightsPage' },
      { label: 'FAQs', path: '/HomeFAQPage' },
      { label: 'Contact Us', path: '/HomeContactFormPage' },
    ],
    investor: [
      { label: 'Home', path: '/HomePageInvestor' },
      { label: 'How it works', path: '/HowItWorksInvestor' },
      { label: 'BIG score', path: '/BIGScoreInvestor' },
      { label: 'Insights', path: '/InsightsInvestor' },
      { label: 'FAQs', path: '/FAQPageInvestor' },
      { label: 'Contact Us', path: '/ContactFormInvestor' },
    ]
  };

  const routes = customRoutes || defaultRoutes[userType] || defaultRoutes.home;
  const logoPath = customLogoPath || (userType === 'investor' ? '/HomePageInvestor' : '/HomePage');

  const handleNavigation = (path) => {
    if (path.startsWith('#')) {
      const element = document.getElementById(path.substring(1));
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(path);
    }
    setIsMobileMenuOpen(false);
  };

  // Sidebar detection
  useEffect(() => {
    const update = () => {
      try {
        if (document && document.body) {
          setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"));
        } else {
          setIsSidebarCollapsed(localStorage.getItem("sidebarOpen") === "false");
        }
      } catch (e) {
        setIsSidebarCollapsed(false);
      }
    };

    let observer = null;
    try {
      if (document && document.body && window.MutationObserver) {
        observer = new MutationObserver(() => update());
        observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
      }
    } catch (e) {
      // noop
    }

    window.addEventListener("sidebarToggle", update);
    window.addEventListener("storage", update);

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener("sidebarToggle", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const headerStyle = {
    marginLeft: isSidebarCollapsed ? '80px' : '280px',
  };

  return (
    <>
      <header 
        className={`${styles.header} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}
        style={headerStyle}
      >
        {/* Logo */}
        <div className={styles.logoContainer}>
          <picture onClick={() => handleNavigation(logoPath)}>
            <source srcSet="/MainLogo.webp" type="image/webp" />
            <source srcSet="/MainLogo.png" type="image/png" />
            <img
              src="/logo.png"
              alt="Brown Ivory Group Logo"
              className={styles.logo}
              width="250"
              height="80"
              loading="lazy"
            />
          </picture>
        </div>

        {/* Desktop Navigation */}
        <div className={`${styles.navContainer} ${styles.desktopNav}`}>
          <nav className={styles.nav}>
            {routes.map((route, index) => (
              <button 
                key={index}
                className={styles.navButton}
                onClick={() => handleNavigation(route.path)}
              >
                {route.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className={styles.mobileMenuButton}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          ☰
        </button>
      </header>

      {/* Mobile Menu */}
      <div 
        className={styles.mobileMenu}
        style={{ transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(100%)' }}
      >
        <button 
          className={styles.closeButton}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          ✕
        </button>
        
        {routes.map((route, index) => (
          <button 
            key={index}
            className={styles.mobileNavButton}
            onClick={() => handleNavigation(route.path)}
          >
            {route.label}
          </button>
        ))}
      </div>
    </>
  );
};

export default HomeHeader;