import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserTie, FaClipboardList, FaHandshake, FaChartLine } from 'react-icons/fa';
import Header from './Header';
import Footer from './Footer';

const HowItWorksAdvisors = () => {
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
            <h1 style={styles.mainTitle}>How BIG Works for Advisors</h1>
            <p style={styles.subTitle}>Guide. Mentor. Transform Businesses.</p>
          </div>
        </section>

        {/* Steps Section */}
        <div style={styles.contentContainer}>
          <h2 style={styles.contentTitle}>Make an Impact in 4 Steps</h2>
          <p style={styles.videoTitle}>Explainer Video: "Shaping Africa's Business Future"</p>
          
          <div style={styles.stepsContainer}>
            {/* Step 1 */}
            <div style={styles.stepCard}>
              <div style={styles.stepCircle}>
                <div style={styles.stepNumber}>1</div>
                <div style={styles.stepIcon}><FaUserTie size={32} /></div>
              </div>
              <h3 style={styles.stepTitle}>Create Your Profile</h3>
              <ul style={styles.stepDetails}>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Complete your advisor profile with expertise</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Upload credentials and certifications</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Define your advisory focus areas</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Get verified within 24 hours</span>
                </li>
              </ul>
              <p style={styles.stepSubtext}>🛡 Build your professional reputation</p>
            </div>

            {/* Step 2 */}
            <div style={styles.stepCard}>
              <div style={styles.stepCircle}>
                <div style={styles.stepNumber}>2</div>
                <div style={styles.stepIcon}><FaClipboardList size={32} /></div>
              </div>
              <h3 style={styles.stepTitle}>Set Your Terms</h3>
              <ul style={styles.stepDetails}>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Choose domains (finance, strategy, operations)</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Select SME growth stages you work with</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Set hourly rate or equity preferences</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Indicate pro bono availability</span>
                </li>
              </ul>
              <p style={styles.stepSubtext}>🧩 Flexible engagement models</p>
            </div>

            {/* Step 3 */}
            <div style={styles.stepCard}>
              <div style={styles.stepCircle}>
                <div style={styles.stepNumber}>3</div>
                <div style={styles.stepIcon}><FaHandshake size={32} /></div>
              </div>
              <h3 style={styles.stepTitle}>Connect with SMEs</h3>
              <ul style={styles.stepDetails}>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Receive requests from vetted businesses</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Review their BIG Score and needs</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Accept engagements that match your expertise</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Use platform tools for communication</span>
                </li>
              </ul>
              <p style={styles.stepSubtext}>🔍 Work with aligned businesses</p>
            </div>

            {/* Step 4 */}
            <div style={styles.stepCard}>
              <div style={styles.stepCircle}>
                <div style={styles.stepNumber}>4</div>
                <div style={styles.stepIcon}><FaChartLine size={32} /></div>
              </div>
              <h3 style={styles.stepTitle}>Track Your Impact</h3>
              <ul style={styles.stepDetails}>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>See SME progress after your engagement</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Get visibility across BIG ecosystem</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Access exclusive opportunities</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Build your advisory portfolio</span>
                </li>
              </ul>
              <p style={styles.stepSubtext}>📈 Grow your professional network</p>
            </div>
          </div>

          {/* Video Section */}
          <div style={styles.videosContainer}>
            <h2 style={styles.videosTitle}>Watch Our Advisor Introduction</h2>
            <div style={styles.videoWrapper}>
              <video 
                controls 
                style={styles.videoElement}
                poster="/video-thumbnail-advisors.jpg" // Optional thumbnail
              >
                <source src="/Advisors.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          <button 
            style={styles.ctaButton}
            onClick={handleButtonClick}
          >
            Join as an Advisor
            <div style={styles.ctaSubtext}>Start making a difference today</div>
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
    backgroundImage: 'linear-gradient(rgba(55, 44, 39, 0.8), rgba(55, 44, 39, 0.8)), url(https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80)',
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
    flex: '0 0 calc(25% - 20px)',
    minWidth: '250px',
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
  // Video Styles
  videosContainer: {
    margin: '40px 0',
    padding: '20px 0',
    borderTop: `1px solid ${colors.lightGray}`,
    borderBottom: `1px solid ${colors.lightGray}`,
    textAlign: 'center'
  },
  videosTitle: {
    fontSize: '1.8rem',
    color: colors.mediumBrown,
    marginBottom: '20px',
    fontWeight: '600'
  },
  videoWrapper: {
    width: '80%',
    maxWidth: '600px',
    margin: '0 auto',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
  },
  videoElement: {
    width: '100%',
    height: 'auto',
    display: 'block'
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

export default HowItWorksAdvisors;