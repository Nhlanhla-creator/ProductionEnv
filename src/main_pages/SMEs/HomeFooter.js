import React from 'react';
import { FaFacebook, FaTwitter, FaLinkedin, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

const HomeFooter = () => {
  return (
      <footer style={styles.footer} id="footer-contact">
        <div style={styles.footerContent}>
          <div style={styles.footerSection}>
            <h3 style={styles.footerHeading}>Contact Us</h3>
            <div style={styles.contactItem}>
              <FaPhone style={styles.contactIcon} />
              <span>+27 87 265 4893</span>
            </div>
            <div style={styles.contactItem}>
              <FaEnvelope style={styles.contactIcon} />
              <a href="mailto:hello@bigmarketplace.africa" style={styles.emailLink}>
                hello@bigmarketplace.africa
              </a>
            </div>
            <div style={styles.contactItem}>
              <FaMapMarkerAlt style={styles.contactIcon} />
              <span>2040 Broadacres Dr, Fourways, Gauteng, South Africa</span>
            </div>
          </div>
  
          <div style={styles.footerSection}>
            <h3 style={styles.footerHeading}>Follow Us</h3>
            <div style={styles.socialIcons}>
              <a href="https://facebook.com" style={styles.socialLink} target="_blank" rel="noopener noreferrer"><FaFacebook /></a>
              <a href="https://twitter.com" style={styles.socialLink} target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
              <a href="https://www.linkedin.com/company/big-marketplace/?viewAsMember=true" style={styles.socialLink} target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
            </div>
          </div>
  
          <div style={styles.footerSection}>
            <h3 style={styles.footerHeading}>Quick Links</h3>
            <a href="/" style={styles.footerLink}>Home</a>
            <a href="/HowItWorks" style={styles.footerLink}>How it works</a>
            <a href="/BigScorePage" style={styles.footerLink}>BIG score</a>
            <a href="#footer-contact" style={styles.footerLink}>Contact</a>
          </div>
        </div>
  
        <div style={styles.footerBottom}>
          <p>&copy; {new Date().getFullYear()} BIG Marketplace. All rights reserved.</p>
        </div>
      </footer>
    );
  };

const styles = {
  footer: {
    backgroundColor: '#372C27',
    color: '#fff',
    padding: '3rem 2rem 1rem',
    width: '80%',
    float: 'right',
    boxSizing: 'border-box'
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem',
    marginBottom: '2rem',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: '1.5rem'
    }
  },
  footerSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  footerHeading: {
    fontSize: '1.2rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    borderBottom: '1px solid #9E6E3C',
    paddingBottom: '0.5rem',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
    fontSize: '1rem',
    lineHeight: '1.5'
  },
  contactIcon: {
    color: '#9E6E3C',
    fontSize: '1.2rem',
    minWidth: '20px'
  },
  emailLink: {
    color: '#fff',
    textDecoration: 'none',
    transition: 'color 0.3s ease',
    ':hover': {
      color: '#BCAE9C',
    },
  },
  socialIcons: {
    display: 'flex',
    gap: '1.5rem',
  },
  socialLink: {
    color: '#fff',
    fontSize: '1.5rem',
    textDecoration: 'none',
    transition: 'color 0.3s ease',
    ':hover': {
      color: '#BCAE9C',
    },
  },
  footerLink: {
    color: '#fff',
    textDecoration: 'none',
    transition: 'color 0.3s ease',
    fontSize: '1rem',
    marginBottom: '0.5rem',
    display: 'block',
    ':hover': {
      color: '#BCAE9C',
    },
  },
  footerBottom: {
    textAlign: 'center',
    borderTop: '1px solid #9E6E3C',
    paddingTop: '1.5rem',
    fontSize: '0.9rem',
    maxWidth: '1200px',
    margin: '0 auto',
    clear: 'both'
  }
};

export default HomeFooter;