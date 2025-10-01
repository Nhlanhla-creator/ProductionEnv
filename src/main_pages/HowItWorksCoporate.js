import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBullseye, FaUsers, FaHandHoldingUsd } from 'react-icons/fa';
import Header from './Header';
import Footer from './Footer';

const HowItWorksCorporates = () => {
  const navigate = useNavigate();

  const handleButtonClick = () => {
    navigate('/login');
  };

  return (
    <div style={styles.appContainer}>
      <Header />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.heroSection}>
          <div style={styles.heroContent}>
            <h1 style={styles.mainTitle}>How BIG Works for Corporates</h1>
            <p style={styles.subTitle}>Source. Partner. Amplify Impact.</p>
          </div>
        </section>

        {/* Steps Section */}
        <div style={styles.contentContainer}>
          <h2 style={styles.contentTitle}>Meet Your CSI Goals in 3 Steps</h2>
          <p style={styles.videoTitle}>Explainer Video: "Strategic Partnerships"</p>
          
          <div style={styles.stepsContainer}>
            {/* Step 1 */}
            <div style={styles.stepCard}>
              <div style={styles.stepCircle}>
                <div style={styles.stepNumber}>1</div>
                <div style={styles.stepIcon}><FaBullseye size={32} /></div>
              </div>
              <h3 style={styles.stepTitle}>Define Goals</h3>
              <ul style={styles.stepDetails}>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Select focus areas (women-led, green businesses, etc.)</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Set measurable impact targets</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Choose priority industries</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Align with your corporate objectives</span>
                </li>
              </ul>
              <p style={styles.stepSubtext}>🎯 Strategic clarity for maximum impact</p>
            </div>

            {/* Step 2 */}
            <div style={styles.stepCard}>
              <div style={styles.stepCircle}>
                <div style={styles.stepNumber}>2</div>
                <div style={styles.stepIcon}><FaUsers size={32} /></div>
              </div>
              <h3 style={styles.stepTitle}>Access Vetted SMEs</h3>
              <ul style={styles.stepDetails}>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>BIG Score verification for compliance and potential</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Impact alignment with your corporate objectives</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Dashboard for tracking SME progress and metrics</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Filter by transformation indicators</span>
                </li>
              </ul>
              <p style={styles.stepSubtext}>🔍 Find your perfect SME partners</p>
            </div>

            {/* Step 3 */}
            <div style={styles.stepCard}>
              <div style={styles.stepCircle}>
                <div style={styles.stepNumber}>3</div>
                <div style={styles.stepIcon}><FaHandHoldingUsd size={32} /></div>
              </div>
              <h3 style={styles.stepTitle}>Partner or Fund</h3>
              <ul style={styles.stepDetails}>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Sponsor accelerator programs for high-potential SMEs</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Direct contracts with qualified suppliers</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Supplier development initiatives</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Track impact metrics and ROI</span>
                </li>
              </ul>
              <p style={styles.stepSubtext}>🤝 Scale your impact sustainably</p>
            </div>
          </div>

          <button 
            style={styles.ctaButton}
            onClick={handleButtonClick}
          >
            Explore SMEs
            <div style={styles.ctaSubtext}>Connect with verified businesses today</div>
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

// Color palette matching header/footer
const colors = {
  darkBrown: '#372C27',
  mediumBrown: '#754A2D',
  lightBrown: '#9E6E3C',
  cream: '#F2F0E6',
  lightGray: '#BCAE9C',
  white: '#FFFFFF',
  accent: '#E8A87C',
  warmGray: '#9E8D7B'
};

const styles = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundImage: 'linear-gradient(rgba(55, 44, 39, 0.21), rgba(55, 44, 39, 0.36)), url(/background10.jpg)',
    backgroundSize: 'cover',
  },
  container: {
    fontFamily: "'Arial', sans-serif",
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: colors.cream,
    color: colors.darkBrown,
    flex: '1',
  },
  heroSection: {
    height: '300px',
    marginBottom: '40px',
    borderRadius: '10px',
    overflow: 'hidden',
    backgroundImage: 'linear-gradient(rgba(55, 44, 39, 0.8), rgba(55, 44, 39, 0.8)), url(https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  },
  heroContent: {
    padding: '20px',
    maxWidth: '800px'
  },
  mainTitle: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: '20px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
  },
  subTitle: {
    fontSize: '1.3rem',
    color: colors.lightGray,
    marginBottom: '30px',
    textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
  },
  contentContainer: {
    marginBottom: '60px',
    textAlign: 'center'
  },
  contentTitle: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: colors.mediumBrown,
    marginBottom: '20px',
    position: 'relative',
    paddingBottom: '15px',
    ':after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '80px',
      height: '3px',
      backgroundColor: colors.accent,
      borderRadius: '3px'
    }
  },
  videoTitle: {
    fontSize: '1.2rem',
    color: colors.lightBrown,
    marginBottom: '40px',
    fontStyle: 'italic'
  },
  stepsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    gap: '20px',
    marginBottom: '50px',
    overflowX: 'auto',
    paddingBottom: '20px',
    scrollbarWidth: 'none',
    ':-webkit-scrollbar': {
      display: 'none'
    }
  },
  stepCard: {
    flex: '0 0 calc(33.33% - 20px)',
    minWidth: '300px',
    backgroundColor: colors.white,
    padding: '25px',
    borderRadius: '15px',
    boxShadow: '0 5px 20px rgba(0,0,0,0.08)',
    textAlign: 'center',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    ':hover': {
      transform: 'translateY(-10px)',
      boxShadow: '0 15px 30px rgba(0,0,0,0.15)'
    }
  },
  stepCircle: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    backgroundColor: colors.mediumBrown,
    margin: '0 auto 25px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: colors.white,
    position: 'relative',
    boxShadow: '0 5px 15px rgba(117, 74, 45, 0.3)',
    transition: 'all 0.3s ease'
  },
  stepNumber: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  stepIcon: {
    color: colors.white
  },
  stepTitle: {
    fontSize: '1.3rem',
    color: colors.mediumBrown,
    marginBottom: '20px',
    fontWeight: '600',
    minHeight: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepDetails: {
    textAlign: 'left',
    paddingLeft: '0',
    listStyleType: 'none',
    marginBottom: '20px',
    minHeight: '220px'
  },
  listItem: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '12px',
    lineHeight: '1.5'
  },
  customBullet: {
    color: colors.accent,
    marginRight: '10px',
    fontSize: '1.1rem',
    flexShrink: 0
  },
  listText: {
    flex: 1,
    fontSize: '0.9rem'
  },
  stepSubtext: {
    fontSize: '0.9rem',
    color: colors.warmGray,
    fontStyle: 'italic',
    textAlign: 'left',
    paddingLeft: '20px'
  },
  ctaButton: {
    padding: '15px 40px',
    backgroundColor: colors.lightBrown,
    color: colors.white,
    border: 'none',
    borderRadius: '50px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 8px rgba(158, 110, 60, 0.3)',
    ':hover': {
      backgroundColor: colors.mediumBrown,
      transform: 'translateY(-3px)',
      boxShadow: '0 6px 12px rgba(117, 74, 45, 0.4)'
    },
    ':active': {
      transform: 'translateY(1px)'
    }
  },
  ctaSubtext: {
    fontSize: '0.8rem',
    fontStyle: 'italic',
    marginTop: '5px',
    fontWeight: 'normal'
  }
};

export default HowItWorksCorporates;