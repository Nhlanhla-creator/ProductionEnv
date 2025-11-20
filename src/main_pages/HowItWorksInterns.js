import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserEdit, FaHandshake, FaUserFriends, FaChartBar, FaChartLine } from 'react-icons/fa';
import Header from './Header';
import Footer from './Footer';

const HowItWorksInterns = () => {
  const navigate = useNavigate();

  const handleButtonClick = () => {
    navigate('/loginRegister');
  };

  return (
    <div style={styles.appContainer}>
      <Header />

      {/* Main Content Container */}
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.heroSection}>
          <div style={styles.heroContent}>
            <h1 style={styles.mainTitle}>How BIG Works for Interns</h1>
            <p style={styles.subTitle}>Empower Your Future. Build Your Experience. Grow Your BIG Score.</p>
          </div>
        </section>

        {/* Content & Steps */}
        <div style={styles.contentContainer}>
          <h2 style={styles.contentTitle}>Launch Your Career in 4 Steps</h2>
          <p style={styles.videoTitle}>Explainer Video: "Building Future Leaders"</p>

          {/* Steps */}
          <div style={styles.stepsContainer}>
            {/* Step 1 */}
            <div style={styles.stepCard}>
              <div style={styles.stepCircle}>
                <div style={styles.stepNumber}>1</div>
                <div style={styles.stepIcon}><FaUserEdit size={32} /></div>
              </div>
              <h3 style={styles.stepTitle}>Create Profile & Get BIG Score</h3>
              <ul style={styles.stepDetails}>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Register online and complete your profile</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Upload CV, qualifications, and documents</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Indicate your preferred industries</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Get verified to enter the BIG Internship pool</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Receive your initial BIG Score based on profile completeness</span>
                </li>
              </ul>
              <p style={styles.stepSubtext}>✅ We verify to ensure safety and readiness</p>
            </div>

            {/* Step 2 */}
            <div style={styles.stepCard}>
              <div style={styles.stepCircle}>
                <div style={styles.stepNumber}>2</div>
                <div style={styles.stepIcon}><FaChartLine size={32} /></div>
              </div>
              <h3 style={styles.stepTitle}>Boost Your BIG Score</h3>
              <ul style={styles.stepDetails}>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Your BIG Score evaluates employability (0-100)</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Complete additional certifications to improve score</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Receive personalized feedback for improvement</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Higher scores increase visibility to top employers</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Track your progress with real-time score updates</span>
                </li>
              </ul>
              <p style={styles.stepSubtext}>📈 Watch your employability grow with your score</p>
            </div>

            {/* Step 3 */}
            <div style={styles.stepCard}>
              <div style={styles.stepCircle}>
                <div style={styles.stepNumber}>3</div>
                <div style={styles.stepIcon}><FaHandshake size={32} /></div>
              </div>
              <h3 style={styles.stepTitle}>Get Matched with Sponsors</h3>
              <ul style={styles.stepDetails}>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Matched with sponsors (SETA, corporates, government)</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Sponsors cover your stipend and training</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Notified once funding is confirmed</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Your BIG Score helps match you with ideal sponsors</span>
                </li>
              </ul>
              <p style={styles.stepSubtext}>💡 BIG handles the admin for you</p>
            </div>

            {/* Step 4 */}
            <div style={styles.stepCard}>
              <div style={styles.stepCircle}>
                <div style={styles.stepNumber}>4</div>
                <div style={styles.stepIcon}><FaChartBar size={32} /></div>
              </div>
              <h3 style={styles.stepTitle}>Track Progress & Grow BIG Score</h3>
              <ul style={styles.stepDetails}>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Dashboard to track stipends and sessions</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Attend Charm School soft skills training</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Receive employer feedback to boost your score</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Complete milestones to increase BIG Score</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Higher scores unlock better future opportunities</span>
                </li>
              </ul>
              <p style={styles.stepSubtext}>🚀 Your BIG Score rises with real-world experience</p>
            </div>
          </div>

          {/* BIG Score Benefits Section */}
          <div style={styles.bigScoreSection}>
            <h2 style={styles.bigScoreTitle}>🎯 Your BIG Score Advantage</h2>
            <div style={styles.bigScoreGrid}>
              <div style={styles.bigScoreCard}>
                <div style={styles.bigScoreIcon}>📊</div>
                <h3 style={styles.bigScoreCardTitle}>Dynamic Scoring</h3>
                <p style={styles.bigScoreCardText}>Your BIG Score updates in real-time as you complete training, receive feedback, and achieve milestones</p>
              </div>
              <div style={styles.bigScoreCard}>
                <div style={styles.bigScoreIcon}>👀</div>
                <h3 style={styles.bigScoreCardTitle}>Career Visibility</h3>
                <p style={styles.bigScoreCardText}>Higher scores make you more visible to top employers and increase chances of permanent placement</p>
              </div>
              <div style={styles.bigScoreCard}>
                <div style={styles.bigScoreIcon}>✅</div>
                <h3 style={styles.bigScoreCardTitle}>Skill Validation</h3>
                <p style={styles.bigScoreCardText}>Your score validates your skills and readiness to potential employers across the BIG ecosystem</p>
              </div>
              <div style={styles.bigScoreCard}>
                <div style={styles.bigScoreIcon}>📈</div>
                <h3 style={styles.bigScoreCardTitle}>Growth Tracking</h3>
                <p style={styles.bigScoreCardText}>Monitor your professional development and see tangible proof of your improvement over time</p>
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          <div style={styles.benefitsContainer}>
            <h2 style={styles.benefitsTitle}>Why Join BIG Internship?</h2>
            <div style={styles.benefitsGrid}>
              <div style={styles.benefitCard}>
                <div style={styles.benefitIcon}>💰</div>
                <h3 style={styles.benefitCardTitle}>Fully Funded</h3>
                <p style={styles.benefitText}>Stipends covered by sponsors</p>
              </div>
              <div style={styles.benefitCard}>
                <div style={styles.benefitIcon}>🏢</div>
                <h3 style={styles.benefitCardTitle}>Real Experience</h3>
                <p style={styles.benefitText}>Work with actual businesses</p>
              </div>
              <div style={styles.benefitCard}>
                <div style={styles.benefitIcon}>🎓</div>
                <h3 style={styles.benefitCardTitle}>Training Included</h3>
                <p style={styles.benefitText}>Charm School soft skills</p>
              </div>
              <div style={styles.benefitCard}>
                <div style={styles.benefitIcon}>📊</div>
                <h3 style={styles.benefitCardTitle}>BIG Score Tracking</h3>
                <p style={styles.benefitText}>Personal employability score</p>
              </div>
              <div style={styles.benefitCard}>
                <div style={styles.benefitIcon}>🚀</div>
                <h3 style={styles.benefitCardTitle}>Career Growth</h3>
                <p style={styles.benefitText}>Improve score for better opportunities</p>
              </div>
              <div style={styles.benefitCard}>
                <div style={styles.benefitIcon}>🤝</div>
                <h3 style={styles.benefitCardTitle}>Mentorship</h3>
                <p style={styles.benefitText}>Dashboard and growth support</p>
              </div>
            </div>
          </div>

          {/* Video Section */}
          <div style={styles.videosContainer}>
            <h2 style={styles.videosTitle}>See How Our Interns Grow</h2>
            <div style={styles.videoWrapper}>
              <video 
                controls 
                style={styles.videoElement}
                poster="/video-thumbnail-interns.jpg"
              >
                <source src="/Interns.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          {/* CTA Button */}
          <button 
            style={styles.ctaButton}
            onClick={handleButtonClick}
          >
            Start Your Internship Journey
            <div style={styles.ctaSubtext}>Build your BIG Score while building your career - Apply in 10 minutes</div>
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
  warmGray: '#9E8D7B',
  verificationBg: '#F5EFE6'
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
    backgroundImage: 'linear-gradient(rgba(55, 44, 39, 0.8), rgba(55, 44, 39, 0.8)), url(https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80)',
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
    minWidth: '280px',
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
    backgroundColor: colors.lightBrown,
    margin: '0 auto 25px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: colors.white,
    position: 'relative',
    boxShadow: '0 5px 15px rgba(158, 110, 60, 0.3)',
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
  // BIG Score Section Styles
  bigScoreSection: {
    margin: '40px 0',
    padding: '30px',
    backgroundColor: colors.verificationBg,
    borderRadius: '15px',
    border: `2px solid ${colors.lightBrown}`,
    boxShadow: '0 5px 15px rgba(158, 110, 60, 0.1)'
  },
  bigScoreTitle: {
    fontSize: '1.8rem',
    color: colors.mediumBrown,
    marginBottom: '30px',
    fontWeight: '600',
    textAlign: 'center'
  },
  bigScoreGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr'
    }
  },
  bigScoreCard: {
    backgroundColor: colors.white,
    padding: '25px',
    borderRadius: '10px',
    boxShadow: '0 3px 10px rgba(0,0,0,0.05)',
    transition: 'all 0.3s ease',
    textAlign: 'center',
    ':hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
    }
  },
  bigScoreIcon: {
    fontSize: '2.5rem',
    marginBottom: '15px'
  },
  bigScoreCardTitle: {
    fontSize: '1.2rem',
    color: colors.lightBrown,
    marginBottom: '10px',
    fontWeight: '600'
  },
  bigScoreCardText: {
    fontSize: '0.9rem',
    color: colors.darkBrown,
    lineHeight: '1.5'
  },
  // Benefits Styles
  benefitsContainer: {
    margin: '40px 0',
    padding: '30px',
    backgroundColor: 'rgba(158, 110, 60, 0.1)',
    borderRadius: '15px',
    border: `1px solid ${colors.lightGray}`
  },
  benefitsTitle: {
    fontSize: '1.8rem',
    color: colors.mediumBrown,
    marginBottom: '30px',
    fontWeight: '600'
  },
  benefitsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    '@media (max-width: 900px)': {
      gridTemplateColumns: 'repeat(2, 1fr)'
    },
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr'
    }
  },
  benefitCard: {
    backgroundColor: colors.white,
    padding: '25px',
    borderRadius: '10px',
    boxShadow: '0 3px 10px rgba(0,0,0,0.05)',
    transition: 'all 0.3s ease',
    textAlign: 'center',
    ':hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
    }
  },
  benefitIcon: {
    fontSize: '2rem',
    marginBottom: '15px',
    color: colors.lightBrown
  },
  benefitCardTitle: {
    fontSize: '1.2rem',
    color: colors.lightBrown,
    marginBottom: '10px',
    fontWeight: '600'
  },
  benefitText: {
    fontSize: '0.9rem',
    color: colors.darkBrown
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

export default HowItWorksInterns;