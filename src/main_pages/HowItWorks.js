import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUserEdit, FaChartLine, FaHandshake, FaFilter, FaFileAlt, 
  FaMoneyBillWave, FaBullseye, FaUsers, FaHandHoldingUsd, 
  FaClipboardList, FaUserFriends, FaChartBar, FaUserTie, FaCheckCircle,
  FaGraduationCap 
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      when: "beforeChildren"
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10
    }
  }
};

const tabContentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: { opacity: 0, y: -20 }
};

const HowItWorks = () => {
  const [activeTab, setActiveTab] = useState('smes');
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const navigate = useNavigate();

  const handleTabChange = (tab) => {
    setIsImageLoaded(false);
    setActiveTab(tab);
  };

  const handleButtonClick = () => {
    navigate('/LoginRegister');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'funders':
        return <FundersContent isImageLoaded={isImageLoaded} setIsImageLoaded={setIsImageLoaded} onButtonClick={handleButtonClick} />;
      case 'corporates':
        return <CorporatesContent isImageLoaded={isImageLoaded} setIsImageLoaded={setIsImageLoaded} onButtonClick={handleButtonClick} />;
      case 'catalysts':
        return <CatalystsContent isImageLoaded={isImageLoaded} setIsImageLoaded={setIsImageLoaded} onButtonClick={handleButtonClick} />;
      case 'advisors':
        return <AdvisorsContent isImageLoaded={isImageLoaded} setIsImageLoaded={setIsImageLoaded} onButtonClick={handleButtonClick} />;
      case 'interns':
        return <InternsContent isImageLoaded={isImageLoaded} setIsImageLoaded={setIsImageLoaded} onButtonClick={handleButtonClick} />;
      default:
        return <SMESContent isImageLoaded={isImageLoaded} setIsImageLoaded={setIsImageLoaded} onButtonClick={handleButtonClick} />;
    }
  };

  return (
    <div style={styles.appContainer}>
      <motion.div 
        style={styles.fullPageBackground}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 1 }}
      />
      
      <Header />
      
      <div style={styles.contentContainer}>
        <motion.section 
          style={styles.heroSection}
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div style={styles.heroContent}>
            <motion.h1 
              style={styles.mainTitle}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              How BIG Marketplace Works
            </motion.h1>
            <motion.p 
              style={styles.subTitle}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              For Every Stakeholder in the SMSE Ecosystem
            </motion.p>
          </div>
        </motion.section>

        <motion.div 
          style={styles.mainContentArea}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <motion.div 
            style={styles.tabContainer}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {[
              { id: 'smes', label: 'For SMSEs', icon: <FaUserEdit style={styles.tabIcon} /> },
              { id: 'funders', label: 'For Funders', icon: <FaMoneyBillWave style={styles.tabIcon} /> },
              { id: 'corporates', label: 'For Corporates', icon: <FaBullseye style={styles.tabIcon} /> },
              { id: 'catalysts', label: 'For Catalysts', icon: <FaUsers style={styles.tabIcon} /> },
              { id: 'advisors', label: 'For Advisors', icon: <FaUserTie style={styles.tabIcon} /> },
              { id: 'interns', label: 'For Interns', icon: <FaGraduationCap style={styles.tabIcon} /> }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                style={activeTab === tab.id ? styles.activeTab : styles.tab}
                onClick={() => handleTabChange(tab.id)}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {tab.icon} {tab.label}
              </motion.button>
            ))}
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={tabContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

// SMSEs Content Component with Videos at Bottom
const SMESContent = ({ isImageLoaded, setIsImageLoaded, onButtonClick }) => {
  return (
    <div style={styles.contentSection}>
      <motion.h2 
        style={styles.contentTitle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Get Scored. Get Matched. Grow Your Enterprise.
      </motion.h2>

      <motion.div 
        style={styles.stepsContainer}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Step 1 */}
        <motion.div 
          style={styles.stepCard}
          variants={itemVariants}
          whileHover={{ y: -5 }}
        >
          <div style={styles.stepNumberCircle}>
            <span style={styles.stepNumber}>1</span>
          </div>
          <div style={styles.stepHeader}>
            <div style={styles.stepIcon}><FaUserEdit size={24} /></div>
            <h3 style={styles.stepTitle}>Create Your Profile & Get Verified</h3>
          </div>
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
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Get pre-vetted to unlock your BIG Score</span>
            </li>
          </ul>
          <p style={styles.stepSubtext}>🔒 Secure. Simple. Fast.</p>
        </motion.div>

        {/* Step 2 */}
        <motion.div 
          style={styles.stepCard}
          variants={itemVariants}
          whileHover={{ y: -5 }}
        >
          <div style={styles.stepNumberCircle}>
            <span style={styles.stepNumber}>2</span>
          </div>
          <div style={styles.stepHeader}>
            <div style={styles.stepIcon}><FaChartLine size={24} /></div>
            <h3 style={styles.stepTitle}>Get Your BIG Score</h3>
          </div>
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
              <span style={styles.listText}>You receive a dynamic score (0-100) + feedback on how to improve</span>
            </li>
          </ul>
          <p style={styles.stepSubtext}>🎯 Actionable insights to strengthen your business</p>
        </motion.div>

        {/* Step 3 */}
        <motion.div 
          style={styles.stepCard}
          variants={itemVariants}
          whileHover={{ y: -5 }}
        >
          <div style={styles.stepNumberCircle}>
            <span style={styles.stepNumber}>3</span>
          </div>
          <div style={styles.stepHeader}>
            <div style={styles.stepIcon}><FaHandshake size={24} /></div>
            <h3 style={styles.stepTitle}>Unlock Curated Opportunities</h3>
          </div>
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
              <span style={styles.listText}>Accelerators & Programs - based on stage, industry, and readiness</span>
            </li>
          </ul>
          <p style={styles.stepSubtext}>🔗 Apply once. Match many.</p>
        </motion.div>

        {/* Step 4 */}
        <motion.div 
          style={styles.stepCard}
          variants={itemVariants}
          whileHover={{ y: -5 }}
        >
          <div style={styles.stepNumberCircle}>
            <span style={styles.stepNumber}>4</span>
          </div>
          <div style={styles.stepHeader}>
            <div style={styles.stepIcon}><FaChartBar size={24} /></div>
            <h3 style={styles.stepTitle}>Track & Grow Your Business</h3>
          </div>
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
              <span style={styles.listText}>Boost your visibility with top funders and corporate partners</span>
            </li>
          </ul>
          <p style={styles.stepSubtext}>📈 Built for businesses that are serious about scale.</p>
        </motion.div>
      </motion.div>

      <motion.button 
        style={styles.ctaButton}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onButtonClick}
      >
        Get Your BIG Score Now
        <div style={styles.ctaSubtext}>It takes 5 minutes. No fees. No fluff.</div>
      </motion.button>

      {/* SMSE Videos Section */}
      <div style={styles.videosContainer}>
        <h2 style={styles.videosTitle}>Learn More About Our SMSE Solutions</h2>
        
        <div style={styles.videoGrid}>
          {/* Funders Video */}
          <div style={styles.videoCard}>
            <h3 style={styles.videoCardTitle}>Apply For Funding</h3>
            <div style={{...styles.videoWrapper, paddingBottom: '56.25%'}}>
              <video 
                controls 
                style={styles.videoElement}
                poster="/video-thumbnail-funders.jpg"
              >
                <source src="/SMSE_Funders.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
          
          {/* Products & Services Video */}
          <div style={styles.videoCard}>
            <h3 style={styles.videoCardTitle}>Apply for Products & Services</h3>
            <div style={{...styles.videoWrapper, paddingBottom: '56.25%'}}>
              <video 
                controls 
                style={styles.videoElement}
                poster="/video-thumbnail-products.jpg"
              >
                <source src="/SMSE_Products&Services.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
          
          {/* Advisors Video */}
          <div style={styles.videoCard}>
            <h3 style={styles.videoCardTitle}>Apply for Advisors</h3>
            <div style={{...styles.videoWrapper, paddingBottom: '56.25%'}}>
              <video 
                controls 
                style={styles.videoElement}
                poster="/video-thumbnail-advisors.jpg"
              >
                <source src="/SMSE_Advisors.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Funders Content Component with Video
const FundersContent = ({ isImageLoaded, setIsImageLoaded, onButtonClick }) => {
  return (
    <div style={styles.contentSection}>
      <motion.h2 
        style={styles.contentTitle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Discover. Verify. Invest with Confidence.
      </motion.h2>
      
      <motion.div 
        style={styles.stepsContainer}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Step 1 */}
        <motion.div 
          style={styles.stepCard}
          variants={itemVariants}
          whileHover={{ y: -5 }}
        >
          <div style={styles.stepNumberCircle}>
            <span style={styles.stepNumber}>1</span>
          </div>
          <div style={styles.stepHeader}>
            <div style={styles.stepIcon}><FaUserEdit size={24} /></div>
            <h3 style={styles.stepTitle}>Create Your Profile & Get Verified</h3>
          </div>
          <ul style={styles.stepDetails}>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Build your investor profile in minutes</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Submit basic documentation (accreditation, ID)</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Confirm your deal type, region, and stage focus</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Complete KYC</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Get verified in under 24 hours</span>
            </li>
          </ul>
          <p style={styles.stepSubtext}>🛡 Investor-side trust, secured.</p>
        </motion.div>

        {/* Step 2 */}
        <motion.div 
          style={styles.stepCard}
          variants={itemVariants}
          whileHover={{ y: -5 }}
        >
          <div style={styles.stepNumberCircle}>
            <span style={styles.stepNumber}>2</span>
          </div>
          <div style={styles.stepHeader}>
            <div style={styles.stepIcon}><FaFilter size={24} /></div>
            <h3 style={styles.stepTitle}>Set Your Investment Criteria</h3>
          </div>
          <ul style={styles.stepDetails}>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Choose industry focus, region, and growth stage</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Define preferred funding instrument (equity, debt, grants)</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Set risk appetite and deal ticket size</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Opt-in to auto-matching with vetted SMEs</span>
            </li>
          </ul>
          <p style={styles.stepSubtext}>🎯 Let BIG do the filtering, or search manually.</p>
        </motion.div>

        {/* Step 3 */}
        <motion.div 
          style={styles.stepCard}
          variants={itemVariants}
          whileHover={{ y: -5 }}
        >
          <div style={styles.stepNumberCircle}>
            <span style={styles.stepNumber}>3</span>
          </div>
          <div style={styles.stepHeader}>
            <div style={styles.stepIcon}><FaFileAlt size={24} /></div>
            <h3 style={styles.stepTitle}>Review Pre-Vetted SME Profiles</h3>
          </div>
          <ul style={styles.stepDetails}>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Filter SMEs by BIG Score</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Filter SMEs by Compliance readiness</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Filter SMEs by Growth potential</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>View pitch decks + detailed score breakdowns</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Access financials, traction metrics & readiness level</span>
            </li>
          </ul>
          <p style={styles.stepSubtext}>📊 Every SME is pre-screened — no cold leads.</p>
        </motion.div>

        {/* Step 4 */}
        <motion.div 
          style={styles.stepCard}
          variants={itemVariants}
          whileHover={{ y: -5 }}
        >
          <div style={styles.stepNumberCircle}>
            <span style={styles.stepNumber}>4</span>
          </div>
          <div style={styles.stepHeader}>
            <div style={styles.stepIcon}><FaMoneyBillWave size={24} /></div>
            <h3 style={styles.stepTitle}>Connect & Deploy Capital</h3>
          </div>
          <ul style={styles.stepDetails}>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Directly message SMEs or request intro via platform</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Track portfolio progress and score changes</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>View deal pipeline analytics and due diligence summaries</span>
            </li>
          </ul>
          <p style={styles.stepSubtext}>🚀 Fund faster. Fund smarter.</p>
        </motion.div>
      </motion.div>

      {/* Investor Video Section */}
      <div style={styles.videosContainer}>
        <h2 style={styles.videosTitle}>How It Works for Investors</h2>
        <div style={styles.videoWrapper}>
          <video 
            controls 
            style={styles.videoElement}
            poster="/video-thumbnail-investor.jpg"
          >
            <source src="/Investor.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      <motion.button 
        style={styles.ctaButton}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onButtonClick}
      >
        Start Matching
      </motion.button>
    </div>
  );
};

// Corporates Content Component (no video)
const CorporatesContent = ({ isImageLoaded, setIsImageLoaded, onButtonClick }) => {
  return (
    <div style={styles.contentSection}>
      <motion.h2 
        style={styles.contentTitle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Source Smart. Partner Deep. Amplify Real Impact.
      </motion.h2>
      <motion.p style={styles.contentSubtitle}>
        Connect with verified SMEs aligned to your ESD, supply chain, or CSI goals — with data you can trust.
      </motion.p>
      
      <motion.div 
        style={styles.mainImageContainer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <img 
          src="https://t4.ftcdn.net/jpg/09/68/60/71/360_F_968607179_NRf5x6HTsJIMTvWmmHAWnrTYqRegPZwd.jpg" 
          alt="Corporate partnership"
          style={styles.explainerImage}
          onLoad={() => setIsImageLoaded(true)}
        />
      </motion.div>
      
      <motion.div 
        style={styles.stepsContainer}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          style={styles.stepCard}
          variants={itemVariants}
          whileHover={{ y: -5 }}
        >
          <div style={styles.stepNumberCircle}>
            <span style={styles.stepNumber}>1</span>
          </div>
          <div style={styles.stepHeader}>
            <div style={styles.stepIcon}><FaUserEdit size={24} /></div>
            <h3 style={styles.stepTitle}>Create Profile & Verify</h3>
          </div>
          <ul style={styles.stepDetails}>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Register your corporate profile</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Submit verification and mandate documents</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Define your sourcing goals (e.g., ESD, CSI, local procurement)</span>
            </li>
          </ul>
          <p style={styles.stepSubtext}>🔐 Start building your pipeline of credible SMEs.</p>
        </motion.div>

        <motion.div 
          style={styles.stepCard}
          variants={itemVariants}
          whileHover={{ y: -5 }}
        >
          <div style={styles.stepNumberCircle}>
            <span style={styles.stepNumber}>2</span>
          </div>
          <div style={styles.stepHeader}>
            <div style={styles.stepIcon}><FaBullseye size={24} /></div>
            <h3 style={styles.stepTitle}>Define Strategic Objectives</h3>
          </div>
          <ul style={styles.stepDetails}>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Select impact focus areas (e.g., job creation, transformation)</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Set procurement, development, or incubation targets</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Choose supplier categories or enterprise types</span>
            </li>
          </ul>
          <p style={styles.stepSubtext}>🎯 Align internal goals with curated SME matching.</p>
        </motion.div>

        <motion.div 
          style={styles.stepCard}
          variants={itemVariants}
          whileHover={{ y: -5 }}
        >
          <div style={styles.stepNumberCircle}>
            <span style={styles.stepNumber}>3</span>
          </div>
          <div style={styles.stepHeader}>
            <div style={styles.stepIcon}><FaUsers size={24} /></div>
            <h3 style={styles.stepTitle}>Access Pre-Vetted SMEs</h3>
          </div>
          <ul style={styles.stepDetails}>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Filter SMEs by BIG Score (compliance + growth readiness)</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Filter SMEs by Industry and region</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Filter SMEs by Transformation or diversity indicators</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Track SME onboarding and impact metrics over time</span>
            </li>
          </ul>
          <p style={styles.stepSubtext}>📊 De-risk your supplier network with data-backed credibility.</p>
        </motion.div>

        <motion.div 
          style={styles.stepCard}
          variants={itemVariants}
          whileHover={{ y: -5 }}
        >
          <div style={styles.stepNumberCircle}>
            <span style={styles.stepNumber}>4</span>
          </div>
          <div style={styles.stepHeader}>
            <div style={styles.stepIcon}><FaHandHoldingUsd size={24} /></div>
            <h3 style={styles.stepTitle}>Partner, Fund, or Procure</h3>
          </div>
          <ul style={styles.stepDetails}>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Initiate direct supplier onboarding or ESD partnership</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Sponsor accelerators or create custom enterprise programs</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Offer funding, mentorship, or market access</span>
            </li>
          </ul>
          <p style={styles.stepSubtext}>🤝 Scale your impact — and meet your mandate.</p>
        </motion.div>
      </motion.div>

      <motion.button 
        style={styles.ctaButton}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onButtonClick}
      >
        Explore Verified SMEs
      </motion.button>
    </div>
  );
};

// Catalysts Content Component with Video
const CatalystsContent = ({ isImageLoaded, setIsImageLoaded, onButtonClick }) => {
  return (
    <div style={styles.contentSection}>
      <motion.h2 
        style={styles.contentTitle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Catalyse Growth. Curate Potential. Track Impact.
      </motion.h2>
      
      <motion.div 
        style={styles.stepsContainer}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          style={styles.stepCard}
          variants={itemVariants}
          whileHover={{ y: -5 }}
        >
          <div style={styles.stepNumberCircle}>
            <span style={styles.stepNumber}>1</span>
          </div>
          <div style={styles.stepHeader}>
            <div style={styles.stepIcon}><FaUserEdit size={24} /></div>
            <h3 style={styles.stepTitle}>Register & Verify Your Program</h3>
          </div>
          <ul style={styles.stepDetails}>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Set up your Catalyst profile (accelerator, incubator, or support hub)</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Submit mandate and verification documents</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Define your target SME stage and goals</span>
            </li>
          </ul>
          <p style={styles.stepSubtext}>🛡 Your profile unlocks curated SME access.</p>
        </motion.div>

        <motion.div 
          style={styles.stepCard}
          variants={itemVariants}
          whileHover={{ y: -5 }}
        >
          <div style={styles.stepNumberCircle}>
            <span style={styles.stepNumber}>2</span>
          </div>
          <div style={styles.stepHeader}>
            <div style={styles.stepIcon}><FaClipboardList size={24} /></div>
            <h3 style={styles.stepTitle}>List Your Program & Set Entry Criteria</h3>
          </div>
          <ul style={styles.stepDetails}>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Add eligibility requirements</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Set program details (duration, offering, industry focus)</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Define success metrics (e.g. job creation, funding readiness)</span>
            </li>
          </ul>
          <p style={styles.stepSubtext}>🎯 Ensure only aligned SMEs apply — no wasted capacity.</p>
        </motion.div>

        <motion.div 
          style={styles.stepCard}
          variants={itemVariants}
          whileHover={{ y: -5 }}
        >
          <div style={styles.stepNumberCircle}>
            <span style={styles.stepNumber}>3</span>
          </div>
          <div style={styles.stepHeader}>
            <div style={styles.stepIcon}><FaUserFriends size={24} /></div>
            <h3 style={styles.stepTitle}>Source from a Verified Pipeline</h3>
          </div>
          <ul style={styles.stepDetails}>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Filter SMEs by BIG Score</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Filter SMEs by Sector, geography, or lifecycle stage</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Filter SMEs by Compliance & funding readiness</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Review profiles, pitch decks & traction data</span>
            </li>
          </ul>
          <p style={styles.stepSubtext}>📂 From scouting to shortlisting — simplified.</p>
        </motion.div>

        <motion.div 
          style={styles.stepCard}
          variants={itemVariants}
          whileHover={{ y: -5 }}
        >
          <div style={styles.stepNumberCircle}>
            <span style={styles.stepNumber}>4</span>
          </div>
          <div style={styles.stepHeader}>
            <div style={styles.stepIcon}><FaChartBar size={24} /></div>
            <h3 style={styles.stepTitle}>Monitor, Report, Celebrate</h3>
          </div>
          <ul style={styles.stepDetails}>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Track SME progress during and after your program</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Get score updates, milestone tracking, and fundability shifts</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Showcase success stories and impact metrics</span>
            </li>
          </ul>
          <p style={styles.stepSubtext}>📊 Build credibility with data-backed outcomes.</p>
        </motion.div>
      </motion.div>

      {/* Catalysts Video Section */}
      <div style={styles.videosContainer}>
        <h2 style={styles.videosTitle}>How Catalysts Make an Impact</h2>
        <div style={styles.videoWrapper}>
          <video 
            controls 
            style={styles.videoElement}
            poster="/video-thumbnail-catalysts.jpg"
          >
            <source src="/Catalysts.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      <motion.button 
        style={styles.ctaButton}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onButtonClick}
      >
        List your Program
      </motion.button>
    </div>
  );
};

// Advisors Content Component with Video
const AdvisorsContent = ({ isImageLoaded, setIsImageLoaded, onButtonClick }) => {
  return (
    <div style={styles.contentSection}>
      <motion.h2 
        style={styles.contentTitle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Advise Bold Businesses. Lend Your Edge. Grow Your Influence.
      </motion.h2>
      
      <motion.div 
        style={styles.stepsContainer}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          style={styles.stepCard}
          variants={itemVariants}
          whileHover={{ y: -5 }}
        >
          <div style={styles.stepNumberCircle}>
            <span style={styles.stepNumber}>1</span>
          </div>
          <div style={styles.stepHeader}>
            <div style={styles.stepIcon}><FaUserTie size={24} /></div>
            <h3 style={styles.stepTitle}>Create Your Profile & Get Verified</h3>
          </div>
          <ul style={styles.stepDetails}>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Complete your advisor or board candidate profile</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Upload credentials (CVs, qualifications, experience)</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Define areas of expertise and advisory style (strategic, operational, technical)</span>
            </li>
          </ul>
          <p style={styles.stepSubtext}>🛡 We verify to maintain a high-trust ecosystem.</p>
        </motion.div>

        <motion.div 
          style={styles.stepCard}
          variants={itemVariants}
          whileHover={{ y: -5 }}
        >
          <div style={styles.stepNumberCircle}>
            <span style={styles.stepNumber}>2</span>
          </div>
          <div style={styles.stepHeader}>
            <div style={styles.stepIcon}><FaClipboardList size={24} /></div>
            <h3 style={styles.stepTitle}>Set Your Terms & Expertise</h3>
          </div>
          <ul style={styles.stepDetails}>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Select domains you want to advise in (finance, strategy, operations, legal, etc.)</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Choose SME growth stages (early, growth, scaling)</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Set hourly rate, equity preference, or pro bono availability</span>
            </li>
          </ul>
          <p style={styles.stepSubtext}>🧩 Flexible engagement models, based on your intent.</p>
        </motion.div>

        <motion.div 
          style={styles.stepCard}
          variants={itemVariants}
          whileHover={{ y: -5 }}
        >
          <div style={styles.stepNumberCircle}>
            <span style={styles.stepNumber}>3</span>
          </div>
          <div style={styles.stepHeader}>
            <div style={styles.stepIcon}><FaHandshake size={24} /></div>
            <h3 style={styles.stepTitle}>Connect with High-Potential SMEs</h3>
          </div>
          <ul style={styles.stepDetails}>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Receive advisor requests from vetted businesses</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Review their BIG Score and traction before accepting</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Track your impact through feedback, outcomes, or board invitations</span>
            </li>
          </ul>
          <p style={styles.stepSubtext}>🔍 Work only with SMEs aligned to your interest and values.</p>
        </motion.div>

        <motion.div 
          style={styles.stepCard}
          variants={itemVariants}
          whileHover={{ y: -5 }}
        >
          <div style={styles.stepNumberCircle}>
            <span style={styles.stepNumber}>4</span>
          </div>
          <div style={styles.stepHeader}>
            <div style={styles.stepIcon}><FaChartLine size={24} /></div>
            <h3 style={styles.stepTitle}>Grow Your Advisory Network</h3>
          </div>
          <ul style={styles.stepDetails}>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Get visibility across the BIG ecosystem (corporates, funders, catalysts)</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Access exclusive dealflow, pilot programs, and speaking opportunities</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Build your profile as a trusted voice in African enterprise growth</span>
            </li>
          </ul>
          <p style={styles.stepSubtext}>📣 Be seen. Be valued. Be BIG.</p>
        </motion.div>
      </motion.div>

      {/* Advisors Video Section */}
      <div style={styles.videosContainer}>
        <h2 style={styles.videosTitle}>How Advisors Make a Difference</h2>
        <div style={styles.videoWrapper}>
          <video 
            controls 
            style={styles.videoElement}
            poster="/video-thumbnail-advisors.jpg"
          >
            <source src="/Advisors.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      <motion.button 
        style={styles.ctaButton}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onButtonClick}
      >
        Join as an Advisor or Board Partner
      </motion.button>
    </div>
  );
};

// Interns Content Component with BIG Score Integration
const InternsContent = ({ isImageLoaded, setIsImageLoaded, onButtonClick }) => {
  return (
    <div style={styles.contentSection}>
      <motion.h2 
        style={styles.contentTitle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Empower Your Future. Build Your Experience. Get Matched with Purpose.
      </motion.h2>
      <motion.p style={styles.contentSubtitle}>
        Join a high-trust internship platform connecting talented graduates with real opportunities — powered by corporate sponsors, government sponsors, and Africa's most promising SMEs.
      </motion.p>
      
      <motion.div 
        style={styles.stepsContainer}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Step 1 */}
        <motion.div 
          style={styles.stepCard}
          variants={itemVariants}
          whileHover={{ y: -5 }}
        >
          <div style={styles.stepNumberCircle}>
            <span style={styles.stepNumber}>1</span>
          </div>
          <div style={styles.stepHeader}>
            <div style={styles.stepIcon}><FaUserEdit size={24} /></div>
            <h3 style={styles.stepTitle}>Create Your Profile & Get Verified</h3>
          </div>
          <ul style={styles.stepDetails}>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Register online and complete your universal intern profile</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Upload CV, qualifications, and required documents</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Indicate your preferred industries and career interests</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Get verified to enter the BIG Internship pool</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Receive your initial BIG Score based on your profile completeness and qualifications</span>
            </li>
          </ul>
          <p style={styles.stepSubtext}>✅ We verify to ensure safety, readiness, and high-impact matching.</p>
        </motion.div>

        {/* Step 2 */}
        <motion.div 
          style={styles.stepCard}
          variants={itemVariants}
          whileHover={{ y: -5 }}
        >
          <div style={styles.stepNumberCircle}>
            <span style={styles.stepNumber}>2</span>
          </div>
          <div style={styles.stepHeader}>
            <div style={styles.stepIcon}><FaChartLine size={24} /></div>
            <h3 style={styles.stepTitle}>Get Your BIG Score & Improve It</h3>
          </div>
          <ul style={styles.stepDetails}>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Your BIG Score evaluates your employability potential (0-100)</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>We assess your skills, qualifications, and profile completeness</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Receive personalized feedback on how to improve your score</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Complete additional certifications and training to boost your score</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Higher BIG Scores increase your visibility to top employers</span>
            </li>
          </ul>
          <p style={styles.stepSubtext}>📈 Your BIG Score grows as you do - track your progress!</p>
        </motion.div>

        {/* Step 3 */}
        <motion.div 
          style={styles.stepCard}
          variants={itemVariants}
          whileHover={{ y: -5 }}
        >
          <div style={styles.stepNumberCircle}>
            <span style={styles.stepNumber}>3</span>
          </div>
          <div style={styles.stepHeader}>
            <div style={styles.stepIcon}><FaHandshake size={24} /></div>
            <h3 style={styles.stepTitle}>Get Matched with Sponsors & Businesses</h3>
          </div>
          <ul style={styles.stepDetails}>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>We match you with sponsors (SETAs, corporates, government partners)</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Sponsors cover your internship stipend and Charm School training</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>You'll be matched with SMEs based on your skills, BIG Score, and goals</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Businesses review your profile and BIG Score before confirming</span>
            </li>
          </ul>
          <p style={styles.stepSubtext}>💡 Your BIG Score helps ensure the perfect match for your career growth.</p>
        </motion.div>

        {/* Step 4 */}
        <motion.div 
          style={styles.stepCard}
          variants={itemVariants}
          whileHover={{ y: -5 }}
        >
          <div style={styles.stepNumberCircle}>
            <span style={styles.stepNumber}>4</span>
          </div>
          <div style={styles.stepHeader}>
            <div style={styles.stepIcon}><FaChartBar size={24} /></div>
            <h3 style={styles.stepTitle}>Track Progress & Boost Your BIG Score</h3>
          </div>
          <ul style={styles.stepDetails}>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Use your dashboard to track stipends, sessions, and performance</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Attend Charm School sessions (skills, etiquette, communication)</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Receive employer feedback that impacts your BIG Score positively</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Complete internship milestones to increase your score</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.customBullet}>✓</span>
              <span style={styles.listText}>Higher BIG Scores unlock better future opportunities and references</span>
            </li>
          </ul>
          <p style={styles.stepSubtext}>🚀 Watch your BIG Score rise as you gain real-world experience!</p>
        </motion.div>
      </motion.div>

      <motion.div 
        style={styles.mainImageContainer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <img 
          src="https://img.freepik.com/free-photo/group-diverse-people-having-business-meeting_53876-25060.jpg" 
          alt="Internship program"
          style={styles.explainerImage}
          onLoad={() => setIsImageLoaded(true)}
        />
      </motion.div>

      {/* BIG Score Benefits for Interns */}
      <div style={styles.internshipBenefits}>
        <h3 style={styles.benefitsTitle}>🎯 Your BIG Score Advantage</h3>
        <div style={styles.bigScoreGrid}>
          <div style={styles.bigScoreCard}>
            <h4 style={styles.bigScoreCardTitle}>Dynamic Scoring</h4>
            <p style={styles.bigScoreCardText}>Your BIG Score updates in real-time as you complete training, receive feedback, and achieve milestones</p>
          </div>
          <div style={styles.bigScoreCard}>
            <h4 style={styles.bigScoreCardTitle}>Career Visibility</h4>
            <p style={styles.bigScoreCardText}>Higher scores make you more visible to top employers and increase your chances of permanent placement</p>
          </div>
          <div style={styles.bigScoreCard}>
            <h4 style={styles.bigScoreCardTitle}>Skill Validation</h4>
            <p style={styles.bigScoreCardText}>Your score validates your skills and readiness to potential employers across the BIG ecosystem</p>
          </div>
          <div style={styles.bigScoreCard}>
            <h4 style={styles.bigScoreCardTitle}>Growth Tracking</h4>
            <p style={styles.bigScoreCardText}>Monitor your professional development and see tangible proof of your improvement over time</p>
          </div>
        </div>
      </div>

      <div style={styles.internshipBenefits}>
        <h3 style={styles.benefitsTitle}>🚀 Join the BIG Internship Network</h3>
        <ul style={styles.benefitsList}>
          <li style={styles.benefitItem}>✅ Fully funded placements</li>
          <li style={styles.benefitItem}>✅ Matched with real businesses</li>
          <li style={styles.benefitItem}>✅ Soft skills training included</li>
          <li style={styles.benefitItem}>✅ Personal BIG Score tracking</li>
          <li style={styles.benefitItem}>✅ Dashboard tracking and growth support</li>
          <li style={styles.benefitItem}>✅ Improve your score for better opportunities</li>
        </ul>
        <p style={styles.benefitsFooter}>Build your BIG Score while building your career - it takes less than 10 minutes to apply.</p>
      </div>

      <motion.button 
        style={styles.ctaButton}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onButtonClick}
      >
        Start Your Internship Journey Now
      </motion.button>
    </div>
  );
};

// Color palette
const colors = {
  darkBrown: '#372C27',
  mediumBrown: '#754A2D',
  lightBrown: '#9E6E3C',
  cream: '#F8F5F0',
  lightGray: '#BCAE9C',
  warmGray: '#9E8D7B',
  white: '#FFFFFF',
  accent: '#E67E22',
  verificationBg: '#F5EFE6'
};

// Main Styles with Video Styles and BIG Score Styles
const styles = {
  appContainer: {
    position: 'relative',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundImage: 'linear-gradient(rgba(180, 168, 162, 0.85), rgba(148, 138, 133, 0.89)), url(https://wallcoveringsmart.com/cdn/shop/products/Floralivorypearloffwhitegoldmetallicappletreesbirdstexturedwallpaper.jpg?v=1674418164)',
    backgroundSize: 'cover',
  },
  fullPageBackground: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: 'url(https://static.vecteezy.com/system/resources/thumbnails/011/950/301/small_2x/abstract-brown-liquid-background-design-with-various-shapes-and-copy-space-area-suitable-for-posters-and-banners-free-vector.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    zIndex: -1,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px',
    position: 'relative'
  },
  heroSection: {
    position: 'relative',
    height: '350px',
    marginBottom: '40px',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(55, 44, 39, 0.12)',
    backgroundImage: 'linear-gradient(rgba(55, 44, 39, 0.85), rgba(55, 44, 39, 0.85)), url(https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center'
  },
  heroContent: {
    padding: '20px',
    maxWidth: '800px',
    zIndex: 2
  },
  mainTitle: {
    fontSize: '2.8rem',
    fontWeight: '800',
    color: colors.white,
    marginBottom: '20px',
    textShadow: '2px 2px 8px rgba(0,0,0,0.3)',
    lineHeight: '1.2'
  },
  subTitle: {
    fontSize: '1.4rem',
    color: colors.lightGray,
    marginBottom: '30px',
    lineHeight: '1.5',
    fontWeight: '400'
  },
  mainContentArea: {
    backgroundColor: 'rgba(248, 245, 240, 0.9)',
    borderRadius: '16px',
    padding: '40px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
    backdropFilter: 'blur(5px)',
    width: '100%'
  },
  tabContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '40px',
    flexWrap: 'wrap',
    gap: '15px',
  },
  tab: {
    padding: '15px 30px',
    backgroundColor: 'transparent',
    color: colors.darkBrown,
    border: `2px solid ${colors.lightBrown}`,
    borderRadius: '50px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    ':hover': {
      backgroundColor: colors.lightBrown,
      color: colors.white,
      transform: 'translateY(-2px)',
      boxShadow: `0 5px 15px rgba(158, 110, 60, 0.2)`
    }
  },
  activeTab: {
    padding: '15px 30px',
    backgroundColor: colors.lightBrown,
    color: colors.white,
    border: `2px solid ${colors.lightBrown}`,
    borderRadius: '50px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transform: 'translateY(-2px)',
    boxShadow: `0 5px 15px rgba(158, 110, 60, 0.3)`
  },
  tabIcon: {
    fontSize: '1.2rem'
  },
  contentSection: {
    marginBottom: '60px'
  },
  contentTitle: {
    fontSize: '2.2rem',
    fontWeight: '700',
    color: colors.mediumBrown,
    textAlign: 'center',
    marginBottom: '20px',
    position: 'relative',
    ':after': {
      content: '""',
      display: 'block',
      width: '80px',
      height: '4px',
      backgroundColor: colors.lightBrown,
      margin: '15px auto',
      borderRadius: '2px'
    }
  },
  contentSubtitle: {
    fontSize: '1.1rem',
    color: colors.warmGray,
    textAlign: 'center',
    marginBottom: '40px',
    fontStyle: 'italic'
  },
  mainImageContainer: {
    margin: '0 auto 40px',
    maxWidth: '800px',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 15px 30px rgba(0,0,0,0.1)',
    position: 'relative'
  },
  explainerImage: {
    width: '100%',
    height: 'auto',
    display: 'block',
    borderRadius: '12px'
  },
  stepsContainer: {
    display: 'flex',
    flexWrap: 'nowrap',
    gap: '20px',
    marginBottom: '50px',
    paddingBottom: '20px',
    width: '100%',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    ':-webkit-scrollbar': {
      display: 'none'
    },
    position: 'relative',
    paddingTop: '30px'
  },
  stepCard: {
    backgroundColor: colors.white,
    padding: '25px',
    borderRadius: '16px',
    boxShadow: '0 8px 30px rgba(55, 44, 39, 0.08)',
    borderTop: `4px solid ${colors.mediumBrown}`,
    position: 'relative',
    transition: 'all 0.3s ease',
    minWidth: '280px',
    flex: '0 0 calc(25% - 20px)',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    ':hover': {
      transform: 'translateY(-8px)',
      boxShadow: `0 15px 30px rgba(158, 110, 60, 0.15)`
    },
    '@media (max-width: 1200px)': {
      minWidth: '250px'
    }
  },
  stepNumberCircle: {
    position: 'absolute',
    top: '-25px',
    left: '30px',
    width: '40px',
    height: '40px',
    backgroundColor: colors.mediumBrown,
    color: colors.white,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '1.2rem',
    boxShadow: `0 4px 12px rgba(117, 74, 45, 0.3)`,
    zIndex: 3
  },
  stepNumber: {
    position: 'relative',
    zIndex: 1
  },
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
    gap: '15px'
  },
  stepIcon: {
    color: colors.lightBrown,
    fontSize: '1.5rem',
    marginBottom: '10px',
  },
  stepTitle: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: colors.mediumBrown,
    margin: 0
  },
  stepDetails: {
    paddingLeft: '0',
    color: colors.darkBrown,
    lineHeight: '1.8',
    listStyleType: 'none',
    marginBottom: '25px',
    flex: 1
  },
  stepSubtext: {
    fontSize: '0.9rem',
    color: colors.warmGray,
    fontStyle: 'italic',
    marginTop: 'auto',
    paddingLeft: '5px'
  },
  listItem: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '12px',
    paddingLeft: '5px'
  },
  customBullet: {
    color: colors.accent,
    marginRight: '10px',
    fontSize: '1.1rem',
    flexShrink: 0,
    paddingTop: '2px'
  },
  listText: {
    flex: 1,
    fontSize: '0.9rem'
  },
  nestedList: {
    listStyleType: 'none',
    paddingLeft: '20px',
    marginTop: '8px'
  },
  nestedListItem: {
    marginBottom: '6px',
    fontSize: '0.85rem',
    color: colors.darkBrown,
    position: 'relative',
    paddingLeft: '15px',
    ':before': {
      position: 'absolute',
      left: 0,
      color: colors.mediumBrown
    }
  },
  // Video Styles
  videosContainer: {
    margin: '40px 0',
    padding: '20px 0',
    borderTop: `1px solid ${colors.lightGray}`,
    borderBottom: `1px solid ${colors.lightGray}`,
    textAlign: 'center',
    width: '100%',
    overflow: 'hidden'
  },
  videoWrapper: {
    position: 'relative',
    paddingBottom: '45%',
    height: 0,
    overflow: 'hidden',
    maxWidth: '700px',
    margin: '0 auto'
  },
  videosTitle: {
    fontSize: '1.8rem',
    color: colors.mediumBrown,
    marginBottom: '20px',
    fontWeight: '600'
  },
  videoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(300px, 1fr))',
    gap: '20px',
    margin: '0 auto',
    width: '100%',
    maxWidth: '1200px',
    overflow: 'hidden'
  },
  videoCard: {
    backgroundColor: colors.white,
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s ease',
    width: '100%',
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
  videoElement: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: 'none'
  },
  // Internship Benefits Styles
  internshipBenefits: {
    backgroundColor: colors.verificationBg,
    borderRadius: '12px',
    padding: '25px',
    margin: '40px auto',
    maxWidth: '800px',
    textAlign: 'center',
    border: `1px solid ${colors.lightGray}`
  },
  benefitsTitle: {
    fontSize: '1.5rem',
    color: colors.mediumBrown,
    marginBottom: '20px',
    fontWeight: '600'
  },
  benefitsList: {
    listStyleType: 'none',
    padding: 0,
    margin: '0 auto 20px',
    maxWidth: '500px',
    textAlign: 'left'
  },
  benefitItem: {
    marginBottom: '10px',
    fontSize: '1rem',
    color: colors.darkBrown,
    display: 'flex',
    alignItems: 'center',
    ':before': {
      content: '"✓"',
      color: colors.accent,
      marginRight: '10px',
      fontWeight: 'bold'
    }
  },
  benefitsFooter: {
    fontSize: '0.9rem',
    color: colors.warmGray,
    fontStyle: 'italic',
    marginTop: '20px'
  },
  // BIG Score Grid Styles
  bigScoreGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    margin: '30px 0'
  },
  bigScoreCard: {
    backgroundColor: colors.white,
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    textAlign: 'center',
    border: `1px solid ${colors.lightGray}`
  },
  bigScoreCardTitle: {
    fontSize: '1.1rem',
    color: colors.mediumBrown,
    marginBottom: '10px',
    fontWeight: '600'
  },
  bigScoreCardText: {
    fontSize: '0.9rem',
    color: colors.darkBrown,
    lineHeight: '1.5'
  },
  ctaButton: {
    display: 'block',
    margin: '0 auto',
    padding: '16px 45px',
    backgroundColor: colors.lightBrown,
    color: colors.white,
    border: 'none',
    borderRadius: '50px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: `0 5px 20px rgba(158, 110, 60, 0.3)`,
    position: 'relative',
    ':hover': {
      backgroundColor: colors.mediumBrown,
      transform: 'translateY(-3px)',
      boxShadow: `0 8px 25px rgba(117, 74, 45, 0.4)`
    }
  },
  ctaSubtext: {
    fontSize: '0.8rem',
    fontStyle: 'italic',
    marginTop: '5px',
    fontWeight: 'normal'
  }
};

export default HowItWorks;