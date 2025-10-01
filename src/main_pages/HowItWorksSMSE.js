import React from 'react';
import { FaUserEdit, FaChartLine, FaHandshake, FaChartBar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const HowItWorksSMSE = () => {
  const navigate = useNavigate();

  const handleGetScoreClick = () => {
    navigate('/LoginRegister');
  };

  return (
    <div style={styles.appContainer}>
      <Header />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.heroSection}>
          <div style={styles.heroContent}>
            <h1 style={styles.mainTitle}>How BIG Works for SMSEs</h1>
            <p style={styles.subTitle}>Get Scored. Get Matched. Grow.</p>
          </div>
        </section>

        {/* Steps Section */}
        <div style={styles.contentContainer}>
          <h2 style={styles.contentTitle}>Your Path to Funding in 4 Simple Steps</h2>
          <p style={styles.videoTitle}>Explainer Video: "From Score to Funding"</p>
          
          <div style={styles.stepsContainer}>
            {/* Step 1 */}
            <div style={styles.stepCard}>
              <div style={styles.stepCircle}>
                <div style={styles.stepNumber}>1</div>
                <div style={styles.stepIcon}><FaUserEdit size={32} /></div>
              </div>
              <h3 style={styles.stepTitle}>Create Your Profile & Get Verified</h3>
              <ul style={styles.stepDetails}>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Complete your universal profile in under 5 minutes</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Upload key documents</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Submit for automated & human review</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Identity & legitimacy checks within a few hours</span>
                </li>
              </ul>
              <p style={styles.stepSubtext}>🔒 Secure. Simple. Fast.</p>
            </div>

            {/* Step 2 */}
            <div style={styles.stepCard}>
              <div style={styles.stepCircle}>
                <div style={styles.stepNumber}>2</div>
                <div style={styles.stepIcon}><FaChartLine size={32} /></div>
              </div>
              <h3 style={styles.stepTitle}>Get Your BIG Score</h3>
              <ul style={styles.stepDetails}>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>We evaluate your compliance & documentation</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>We evaluate your growth potential & traction</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>We evaluate your pitch quality & positioning</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Receive dynamic score (0-100) + improvement feedback</span>
                </li>
              </ul>
              <p style={styles.stepSubtext}>🎯 Actionable insights to strengthen your business</p>
            </div>

            {/* Step 3 */}
            <div style={styles.stepCard}>
              <div style={styles.stepCircle}>
                <div style={styles.stepNumber}>3</div>
                <div style={styles.stepIcon}><FaHandshake size={32} /></div>
              </div>
              <h3 style={styles.stepTitle}>Unlock Curated Opportunities</h3>
              <ul style={styles.stepDetails}>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Matched Funders - grants, equity, and loan-ready options</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Advisors & Mentors - strategic connections</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Accelerators & Programs - based on stage and industry</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>One application reaches multiple opportunities</span>
                </li>
              </ul>
              <p style={styles.stepSubtext}>🔗 Apply once. Match many.</p>
            </div>

            {/* Step 4 */}
            <div style={styles.stepCard}>
              <div style={styles.stepCircle}>
                <div style={styles.stepNumber}>4</div>
                <div style={styles.stepIcon}><FaChartBar size={32} /></div>
              </div>
              <h3 style={styles.stepTitle}>Track & Grow Your Business</h3>
              <ul style={styles.stepDetails}>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Improve your BIG Score over time</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Access exclusive tools & resources</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Boost visibility with top funders and partners</span>
                </li>
                <li style={styles.listItem}>
                  <span style={styles.customBullet}>✓</span>
                  <span style={styles.listText}>Monitor your progress and impact</span>
                </li>
              </ul>
              <p style={styles.stepSubtext}>📈 Built for businesses serious about scale.</p>
            </div>
          </div>

          {/* Videos Section */}
          <div style={styles.videosContainer}>
            <h2 style={styles.videosTitle}>Learn More About Our SMSE Solutions</h2>
            
            <div style={styles.videoGrid}>
              {/* Video 1 */}
              <div style={styles.videoCard}>
                <h3 style={styles.videoCardTitle}>Funding</h3>
                <div style={styles.videoWrapper}>
                  <video 
                    controls 
                    style={styles.videoElement}
                    poster="/video-thumbnail-funders.jpg" // Optional thumbnail
                  >
                    <source src="/SMSE_Funders.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
              
              {/* Video 2 */}
              <div style={styles.videoCard}>
                <h3 style={styles.videoCardTitle}>Products & Services</h3>
                <div style={styles.videoWrapper}>
                  <video 
                    controls 
                    style={styles.videoElement}
                    poster="/video-thumbnail-products.jpg" // Optional thumbnail
                  >
                      <source src="/SMSE_Products&Services.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
              
              {/* Video 3 */}
              <div style={styles.videoCard}>
                <h3 style={styles.videoCardTitle}>Advisors</h3>
                <div style={styles.videoWrapper}>
                  <video 
                    controls 
                    style={styles.videoElement}
                    poster="/video-thumbnail-advisors.jpg" // Optional thumbnail
                  >
                    <source src="/SMSE_Advisors.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
          </div>

          <button 
            style={styles.ctaButton}
            onClick={handleGetScoreClick}
          >
            Get Your BIG Score Now
            <div style={styles.ctaSubtext}>It takes 5 minutes. No fees. No fluff.</div>
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
    backgroundImage: 'linear-gradient(rgba(55, 44, 39, 0.8), rgba(55, 44, 39, 0.8)), url(https://images.unsplash.com/photo-1556740738-b6a63e27c4df?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80)',
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
  // New styles for videos section
  videosContainer: {
    margin: '60px 0',
    padding: '20px 0',
    borderTop: `1px solid ${colors.lightGray}`,
    borderBottom: `1px solid ${colors.lightGray}`
  },
  videosTitle: {
    fontSize: '1.8rem',
    color: colors.mediumBrown,
    marginBottom: '30px',
    fontWeight: '600'
  },
  videoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '30px',
    margin: '0 auto',
    maxWidth: '1000px'
  },
  videoCard: {
    backgroundColor: colors.white,
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s ease',
    ':hover': {
      transform: 'translateY(-5px)'
    }
  },
  videoCardTitle: {
    backgroundColor: colors.mediumBrown,
    color: colors.white,
    padding: '15px',
    margin: 0,
    fontSize: '1.2rem'
  },
  videoWrapper: {
    position: 'relative',
    paddingBottom: '56.25%', // 16:9 aspect ratio
    height: 0,
    overflow: 'hidden'
  },
  videoElement: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: 'none'
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

export default HowItWorksSMSE;