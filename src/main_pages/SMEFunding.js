import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';

const HowItWorksSMSE = () => {
  const [activeTab, setActiveTab] = useState('smse');

  return (
    <div style={styles.container}>
      <Header />
      
      <div style={styles.content}>
        <h1 style={styles.title}>How BIG Marketplace Works</h1>
        <p style={styles.subtitle}>For Every Stakeholder</p>
        
        <div style={styles.tabContainer}>
          <button 
            style={activeTab === 'smse' ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab('smse')}
          >
            For SMSEs
          </button>
          <button 
            style={activeTab === 'investors' ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab('investors')}
          >
            For Investors
          </button>
          <button 
            style={activeTab === 'corporates' ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab('corporates')}
          >
            For Corporates
          </button>
          <button 
            style={activeTab === 'accelerators' ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab('accelerators')}
          >
            For Accelerators
          </button>
        </div>
        
        {activeTab === 'smse' && (
          <div style={styles.tabContent}>
            <h2 style={styles.sectionTitle}>Get Scored. Get Matched. Grow.</h2>
            <p style={styles.videoTitle}>Explainer Video: "From Score to Funding in 3 Steps"</p>
            
            <div style={styles.stepContainer}>
              <div style={styles.step}>
                <div style={styles.stepHeader}>
                  <h3>Step 1: Create Your Profile</h3>
                  <button style={styles.videoButton}>▶️ Watch</button>
                </div>
                <ul style={styles.stepList}>
                  <li>Takes 5 minutes.</li>
                  <li>Upload basic docs (tax, registration, pitch deck).</li>
                </ul>
              </div>
              
              <div style={styles.step}>
                <div style={styles.stepHeader}>
                  <h3>Step 2: Get Your BIG Score</h3>
                  <button style={styles.videoButton}>▶️ Watch</button>
                </div>
                <ul style={styles.stepList}>
                  <li>We analyze compliance, growth potential, and pitch quality.</li>
                  <li>Receive a score (0-100) + actionable feedback.</li>
                </ul>
              </div>
              
              <div style={styles.step}>
                <div style={styles.stepHeader}>
                  <h3>Step 3: Unlock Opportunities</h3>
                  <button style={styles.videoButton}>▶️ Watch</button>
                </div>
                <ul style={styles.stepList}>
                  <li>Funders: See matched investors/grants.</li>
                  <li>Mentors: Connect with advisors to improve weak areas.</li>
                  <li>Programs: Apply to accelerators if score is low.</li>
                </ul>
              </div>
            </div>
            
            <button style={styles.ctaButton}>Get Your Score Now</button>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#F2F0E6',
    color: '#372C27',
    fontFamily: 'Arial, sans-serif',
  },
  
  logo: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#9E6E3C',
  },
  nav: {
    display: 'flex',
    gap: '1rem',
  },
  navButton: {
    padding: '0.5rem 1rem',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#D3D2CE',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  navButtonActive: {
    padding: '0.5rem 1rem',
    backgroundColor: '#9E6E3C',
    border: 'none',
    color: '#F2F0E6',
    cursor: 'pointer',
    fontSize: '1rem',
    borderRadius: '4px',
  },
  content: {
    flex: 1,
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  title: {
    fontSize: '2.5rem',
    color: '#754A2D',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#9E6E3C',
    marginBottom: '2rem',
  },
  tabContainer: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '2rem',
  },
  tab: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#D3D2CE',
    border: 'none',
    borderRadius: '4px 4px 0 0',
    cursor: 'pointer',
    fontSize: '1rem',
    color: '#372C27',
  },
  activeTab: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#9E6E3C',
    border: 'none',
    borderRadius: '4px 4px 0 0',
    cursor: 'pointer',
    fontSize: '1rem',
    color: '#F2F0E6',
  },
  tabContent: {
    backgroundColor: '#FFFFFF',
    padding: '2rem',
    borderRadius: '0 4px 4px 4px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: '1.8rem',
    color: '#754A2D',
    marginBottom: '1rem',
  },
  videoTitle: {
    fontStyle: 'italic',
    color: '#9E6E3C',
    marginBottom: '1.5rem',
  },
  stepContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  step: {
    backgroundColor: '#F2F0E6',
    padding: '1.5rem',
    borderRadius: '4px',
  },
  stepHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  videoButton: {
    backgroundColor: '#754A2D',
    color: '#F2F0E6',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  stepList: {
    paddingLeft: '1.5rem',
    lineHeight: '1.6',
  },
  ctaButton: {
    backgroundColor: '#754A2D',
    color: '#F2F0E6',
    border: 'none',
    padding: '1rem 2rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
    marginTop: '1rem',
  },
};

export default HowItWorksSMSE;
