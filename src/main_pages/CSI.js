import React, { useState } from 'react';
import Header from "./Header";
import Footer from "./Footer";

const CharmSchool = () => {
  const [openAccordion, setOpenAccordion] = useState(null);
  const [activeTab, setActiveTab] = useState('graduates');

  const toggleAccordion = (index) => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

  return (
    <div style={styles.container}>
      <Header />
      
      {/* Hero Section */}
      <section style={styles.heroSection}>
        <div style={styles.heroBackground}></div>
        <div style={styles.heroOverlay}></div>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>
            Charm. Confidence. Competence.
          </h1>
          <p style={styles.heroSubtitle}>
            Let Our Charm School equip graduates and professionals with the<br />
            confidence and charm to have presence and to thrive in any industry.
          </p>
          <button 
            style={styles.ctaButton}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.color = '#8B5A2B';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#8B5A2B';
              e.target.style.color = 'white';
            }}
          >
            Help cultivate charm, confidence, and success
          </button>
        </div>
      </section>

      {/* Section 1 - CHARM YOUR WAY TO SUCCESS */}
      <section style={styles.section1}>
        <div style={styles.section1Background}></div>
        <div style={styles.section1Overlay}></div>
        <div style={styles.sectionContent}>
          <h2 style={styles.sectionTitle}>
            CHARM YOUR WAY TO SUCCESS
          </h2>
          
          <div style={styles.twoColumnLayout}>
            <div style={styles.textContent}>
              <p style={styles.sectionText}>
                At Brown Ivory Group (BIG), we are committed to shaping the next generation of confident, 
                career-ready professionals. Through our flagship Corporate Social Investment (CSI) initiative—The 
                Charm School—we empower graduates and aspiring professionals with the soft skills, presence, 
                and confidence to thrive in any professional setting.
              </p>
              
              <div style={styles.eventCard}>
                <h3 style={styles.eventTitle}>NEXT EVENT</h3>
                <p style={styles.eventDetail}><span style={styles.eventLabel}>Date:</span> 10-11 July 2025</p>
                <p style={styles.eventDetail}><span style={styles.eventLabel}>Location:</span> Johannesburg, South Africa</p>
              </div>
              
              <div style={styles.buttonGroup}>
                <button 
                  style={styles.primaryButton}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#8B5A2B';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#8B5A2B';
                    e.target.style.color = 'white';
                  }}
                >
                  Register Now
                </button>
                <button 
                  style={styles.primaryButton}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#8B5A2B';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#8B5A2B';
                    e.target.style.color = 'white';
                  }}
                >
                  Contact us for more information
                </button>
              </div>
            </div>
            
            <div style={styles.imageContainer}>
              <img 
                src="/image1.avif" 
                alt="Professional setting" 
                style={styles.curvedImage}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 - THE SECRET TO STANDING OUT */}
      <section style={styles.section2}>
        <div style={styles.section2Background}></div>
        <div style={styles.section2Overlay}></div>
        <div style={styles.sectionContent}>
          <h2 style={styles.sectionTitleWhite}>
            THE SECRET TO STANDING OUT
          </h2>
          
          <p style={styles.sectionSubtitle}>
            Success goes beyond technical skills—it's about how you present yourself, 
            connect with others, and leave a lasting impression.
          </p>
          
          <div style={styles.twoColumnLayout}>
            <div style={styles.imageContainer}>
              <img 
                src="/image2.avif" 
                alt="Success concept" 
                style={styles.standardImage}
              />
            </div>

            <div style={styles.textContent}>
              <p style={styles.sectionTextWhite}>
                The Charm School is designed to bridge the gap between technical knowledge and 
                real-world success by equipping graduates with essential soft skills such as:
              </p>

              <div style={styles.checklist}>
                <div style={styles.checkItem}>
                  <div style={styles.checkIcon}>✓</div>
                  <span style={styles.checkText}>Executive Presence & Personal Branding</span>
                </div>
                
                <div style={styles.checkItem}>
                  <div style={styles.checkIcon}>✓</div>
                  <span style={styles.checkText}>Networking & Relationship Building</span>
                </div>
                
                <div style={styles.checkItem}>
                  <div style={styles.checkIcon}>✓</div>
                  <span style={styles.checkText}>Public Speaking & Confident Communication</span>
                </div>
                
                <div style={styles.checkItem}>
                  <div style={styles.checkIcon}>✓</div>
                  <span style={styles.checkText}>Emotional Intelligence & Leadership Skills</span>
                </div>
              </div>
              
              <p style={styles.sectionTextWhite}>
                Whether you're engaging with hiring managers, presenting to teams, or stepping into 
                leadership roles, this program ensures you stand out, inspire confidence, and advance your career.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 - CHARM YOUR COMPETITIVE EDGE */}
      <section style={styles.section3}>
        <div style={styles.sectionContent}>
          <h2 style={styles.sectionTitle}>
            CHARM YOUR COMPETITIVE EDGE
          </h2>
          
          <div style={styles.twoColumnLayout}>
            <div style={styles.textContent}>
              <p style={styles.introText}>
                In today's highly competitive job market, employers are looking for more than just 
                technical skills. They want candidates who can:
              </p>
              
              <div style={styles.featureList}>
                <div style={styles.featureItem}>
                  <div style={styles.featureCheck}>✓</div>
                  <div>
                    <h4 style={styles.featureTitle}>Impress Hiring Managers</h4>
                    <p style={styles.featureDescription}>Stand out in interviews with confidence and clarity.</p>
                  </div>
                </div>
                
                <div style={styles.featureItem}>
                  <div style={styles.featureCheck}>✓</div>
                  <div>
                    <h4 style={styles.featureTitle}>Win Over Colleagues</h4>
                    <p style={styles.featureDescription}>Build strong professional relationships through emotional intelligence.</p>
                  </div>
                </div>
                
                <div style={styles.featureItem}>
                  <div style={styles.featureCheck}>✓</div>
                  <div>
                    <h4 style={styles.featureTitle}>Inspire Leaders</h4>
                    <p style={styles.featureDescription}>Earn trust and credibility to step into leadership roles.</p>
                  </div>
                </div>
              </div>
              
              <div style={styles.ctaBox}>
                <div style={styles.awardIcon}>🏆</div>
                <p style={styles.ctaText}>
                  The Charm School equips you with the tools to stand out at every stage of your career.
                </p>
              </div>
            </div>
            
            <div style={styles.imageContainer}>
              <img 
                src="/image3.avif" 
                alt="Competitive edge" 
                style={styles.standardImage}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 - BUILDING CONFIDENCE, ONE WORKSHOP AT A TIME */}
      <section style={styles.section4}>
        <div style={styles.section4Background}></div>
        <div style={styles.section4Overlay}></div>
        <div style={styles.sectionContent}>
          <h2 style={styles.sectionTitleWhite}>
            BUILDING CONFIDENCE, ONE WORKSHOP AT A TIME
          </h2>
          
          <p style={styles.section4Subtitle}>
            The Charm School is an immersive, hands-on experience designed to develop key soft skills through 
            engaging workshops, interactive exercises, and expert-led sessions.
          </p>
          
          <div style={styles.faqGrid}>
            <div style={styles.faqColumn}>
              <div style={styles.faqHeader}>
                <h3 style={styles.faqTitle}>Frequently asked questions</h3>
                <div style={styles.searchBox}>
                  <input 
                    type="text" 
                    placeholder="Looking for something?" 
                    style={styles.searchInput}
                  />
                  <span style={styles.searchIcon}>🔍</span>
                </div>
              </div>

              <div style={styles.faqTabs}>
                <button style={styles.faqTab}>Exclusive Toolkit for Participants</button>
                <button style={styles.faqTabActive}>WHAT YOU'LL LEARN</button>
              </div>

              <div style={styles.accordionContainer}>
                <div style={styles.accordionItem}>
                  <button 
                    style={styles.accordionButton}
                    onClick={() => toggleAccordion(0)}
                  >
                    <span>Digital Handbook</span>
                    <span style={styles.accordionIcon}>{openAccordion === 0 ? '−' : '∨'}</span>
                  </button>
                  {openAccordion === 0 && (
                    <div style={styles.accordionContent}>
                      <p>A comprehensive guide packed with expert tips, best practices, and actionable insights.</p>
                      <div style={styles.socialIcons}>
                        <a href="#" style={styles.socialIconLink}>
                          <svg style={styles.socialIconSvg} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        </a>
                        <a href="#" style={styles.socialIconLink}>
                          <svg style={styles.socialIconSvg} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                          </svg>
                        </a>
                        <a href="#" style={styles.socialIconLink}>
                          <svg style={styles.socialIconSvg} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </a>
                        <a href="#" style={styles.socialIconLink}>
                          <svg style={styles.socialIconSvg} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L7.6 13.858l-2.97-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                          </svg>
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div style={styles.accordionItem}>
                  <button 
                    style={styles.accordionButton}
                    onClick={() => toggleAccordion(1)}
                  >
                    <span>Customizable Templates</span>
                    <span style={styles.accordionIcon}>{openAccordion === 1 ? '−' : '∨'}</span>
                  </button>
                  {openAccordion === 1 && (
                    <div style={styles.accordionContent}>
                      <p>Ready-to-use CV, cover letter, and email templates to help you present yourself professionally.</p>
                      <div style={styles.socialIcons}>
                        <a href="#" style={styles.socialIconLink}>
                          <svg style={styles.socialIconSvg} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        </a>
                        <a href="#" style={styles.socialIconLink}>
                          <svg style={styles.socialIconSvg} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                          </svg>
                        </a>
                        <a href="#" style={styles.socialIconLink}>
                          <svg style={styles.socialIconSvg} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </a>
                        <a href="#" style={styles.socialIconLink}>
                          <svg style={styles.socialIconSvg} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L7.6 13.858l-2.97-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                          </svg>
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div style={styles.accordionItem}>
                  <button 
                    style={styles.accordionButton}
                    onClick={() => toggleAccordion(2)}
                  >
                    <span>Networking Directory</span>
                    <span style={styles.accordionIcon}>{openAccordion === 2 ? '−' : '∨'}</span>
                  </button>
                  {openAccordion === 2 && (
                    <div style={styles.accordionContent}>
                      <p>Access to a curated list of industry professionals, mentors, and fellow participants.</p>
                      <div style={styles.socialIcons}>
                        <a href="#" style={styles.socialIconLink}>
                          <svg style={styles.socialIconSvg} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        </a>
                        <a href="#" style={styles.socialIconLink}>
                          <svg style={styles.socialIconSvg} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                          </svg>
                        </a>
                        <a href="#" style={styles.socialIconLink}>
                          <svg style={styles.socialIconSvg} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </a>
                        <a href="#" style={styles.socialIconLink}>
                          <svg style={styles.socialIconSvg} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L7.6 13.858l-2.97-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                          </svg>
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div style={styles.accordionItem}>
                  <button 
                    style={styles.accordionButton}
                    onClick={() => toggleAccordion(3)}
                  >
                    <span>Mentorship 101</span>
                    <span style={styles.accordionIcon}>{openAccordion === 3 ? '−' : '∨'}</span>
                  </button>
                  {openAccordion === 3 && (
                    <div style={styles.accordionContent}>
                      <p>A practical guide on how to find the right mentor, build a strong relationship, and leverage their guidance for career success.</p>
                      <div style={styles.socialIcons}>
                        <a href="#" style={styles.socialIconLink}>
                          <svg style={styles.socialIconSvg} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        </a>
                        <a href="#" style={styles.socialIconLink}>
                          <svg style={styles.socialIconSvg} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                          </svg>
                        </a>
                        <a href="#" style={styles.socialIconLink}>
                          <svg style={styles.socialIconSvg} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </a>
                        <a href="#" style={styles.socialIconLink}>
                          <svg style={styles.socialIconSvg} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L7.6 13.858l-2.97-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                          </svg>
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div style={styles.accordionItem}>
                  <button 
                    style={styles.accordionButton}
                    onClick={() => toggleAccordion(4)}
                  >
                    <span>Charm School Certification – Earn Your Degree in Charm</span>
                    <span style={styles.accordionIcon}>{openAccordion === 4 ? '−' : '∨'}</span>
                  </button>
                  {openAccordion === 4 && (
                    <div style={styles.accordionContent}>
                      <p>Climb the ranks from Bachelor of Charm to Doctorate in Philosophy of Charm as you complete sessions and master essential soft skills.</p>
                      <div style={styles.socialIcons}>
                        <a href="#" style={styles.socialIconLink}>
                          <svg style={styles.socialIconSvg} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        </a>
                        <a href="#" style={styles.socialIconLink}>
                          <svg style={styles.socialIconSvg} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                          </svg>
                        </a>
                        <a href="#" style={styles.socialIconLink}>
                          <svg style={styles.socialIconSvg} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </a>
                        <a href="#" style={styles.socialIconLink}>
                          <svg style={styles.socialIconSvg} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L7.6 13.858l-2.97-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                          </svg>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={styles.faqColumn}>
              <div style={styles.faqHeader}>
                <h3 style={styles.faqTitle}>Frequently asked questions</h3>
                <div style={styles.searchBox}>
                  <input 
                    type="text" 
                    placeholder="Looking for something?" 
                    style={styles.searchInput}
                  />
                  <span style={styles.searchIcon}>🔍</span>
                </div>
              </div>

              <div style={styles.faqTabs}>
                <button style={styles.faqTab}>Exclusive Toolkit for Participants</button>
                <button style={styles.faqTabActive}>WHAT YOU'LL LEARN</button>
              </div>

              <div style={styles.accordionContainer}>
                {[5, 6, 7, 8, 9].map((index) => {
                  const items = [
                    { 
                      title: "Digital Handbook",
                      content: "A comprehensive guide packed with expert tips, best practices, and actionable insights."
                    },
                    { 
                      title: "Customizable Templates",
                      content: "Ready-to-use CV, cover letter, and email templates to help you present yourself professionally."
                    },
                    { 
                      title: "Networking Directory",
                      content: "Access to a curated list of industry professionals, mentors, and fellow participants."
                    },
                    { 
                      title: "Mentorship 101",
                      content: "A practical guide on how to find the right mentor, build a strong relationship, and leverage their guidance for career success."
                    },
                    { 
                      title: "Charm School Certification – Earn Your Degree in Charm",
                      content: "Climb the ranks from Bachelor of Charm to Doctorate in Philosophy of Charm as you complete sessions and master essential soft skills."
                    }
                  ];
                  
                  const item = items[index - 5];
                  
                  return (
                    <div key={index} style={styles.accordionItem}>
                      <button 
                        style={styles.accordionButton}
                        onClick={() => toggleAccordion(index)}
                      >
                        <span>{item.title}</span>
                        <span style={styles.accordionIcon}>{openAccordion === index ? '−' : '∨'}</span>
                      </button>
                      {openAccordion === index && (
                        <div style={styles.accordionContent}>
                          <p>{item.content}</p>
                          <div style={styles.socialIcons}>
                            <a href="#" style={styles.socialIconLink}>
                              <svg style={styles.socialIconSvg} fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                              </svg>
                            </a>
                            <a href="#" style={styles.socialIconLink}>
                              <svg style={styles.socialIconSvg} fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                              </svg>
                            </a>
                            <a href="#" style={styles.socialIconLink}>
                              <svg style={styles.socialIconSvg} fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                              </svg>
                            </a>
                            <a href="#" style={styles.socialIconLink}>
                              <svg style={styles.socialIconSvg} fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L7.6 13.858l-2.97-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                              </svg>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5 - THE CHARM SCHOOL ADVANTAGE */}
      <section style={styles.section5}>
        <div style={styles.sectionContent}>
          <h2 style={styles.sectionTitle}>
            THE CHARM SCHOOL ADVANTAGE
          </h2>
          
          <div style={styles.tabNavigation}>
            <button 
              style={activeTab === 'graduates' ? styles.tabButtonActive : styles.tabButton}
              onClick={() => setActiveTab('graduates')}
              onMouseEnter={(e) => {
                if (activeTab !== 'graduates') {
                  e.target.style.backgroundColor = 'rgba(139, 90, 43, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'graduates') {
                  e.target.style.backgroundColor = 'white';
                }
              }}
            >
              For Graduates & Young Professionals
            </button>
            <button 
              style={activeTab === 'sponsors' ? styles.tabButtonActive : styles.tabButton}
              onClick={() => setActiveTab('sponsors')}
              onMouseEnter={(e) => {
                if (activeTab !== 'sponsors') {
                  e.target.style.backgroundColor = 'rgba(139, 90, 43, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'sponsors') {
                  e.target.style.backgroundColor = 'white';
                }
              }}
            >
              For Partners & Sponsors
            </button>
          </div>

          {activeTab === 'graduates' && (
            <div style={styles.advantageContent}>
              <h3 style={styles.advantageSubtitle}>For Graduates & Young Professionals</h3>
              
              <div style={styles.advantageList}>
                <div style={styles.bigLogo}>
                  <img 
                    src="/BIG.avif" 
                    alt="Brown Ivory Group" 
                    style={styles.bigLogoImage}
                  />
                </div>
                <ul style={styles.bulletList}>
                  <li style={styles.bulletItem}>Develop confidence and executive presence to stand out.</li>
                  <li style={styles.bulletItem}>Master career-building soft skills that complement technical expertise.</li>
                  <li style={styles.bulletItem}>Build lasting professional connections to accelerate career growth.</li>
                </ul>
              </div>

              <button 
                style={styles.advantageButton}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.color = '#8B5A2B';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#8B5A2B';
                  e.target.style.color = 'white';
                }}
              >
                Join us in building a workforce that is confident, capable, and career-ready
              </button>
            </div>
          )}

          {activeTab === 'sponsors' && (
            <div style={styles.advantageContent}>
              <h3 style={styles.advantageSubtitle}>For Partners & Sponsors</h3>
              
              <div style={styles.advantageList}>
                <div style={styles.bigLogo}>
                  <img 
                    src="/BIG.avif" 
                    alt="Brown Ivory Group" 
                    style={styles.bigLogoImage}
                  />
                </div>
                <ul style={styles.bulletList}>
                  <li style={styles.bulletItem}>Shape the next generation of career-ready professionals.</li>
                  <li style={styles.bulletItem}>Engage your employees as facilitators or mentors.</li>
                  <li style={styles.bulletItem}>Strengthen the local talent pipeline by supporting future business leaders.</li>
                </ul>
              </div>

              <button 
                style={styles.advantageButton}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.color = '#8B5A2B';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#8B5A2B';
                  e.target.style.color = 'white';
                }}
              >
                Partner with us to shape the future workforce
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Section 6 - THE UPCOMING CHARM SCHOOL EXPERIENCE */}
      <section style={styles.section6}>
        <div style={styles.section6Background}></div>
        <div style={styles.section6Overlay}></div>
        <div style={styles.sectionContent}>
          <h2 style={styles.sectionTitleWhite}>
            THE UPCOMING CHARM SCHOOL EXPERIENCE
          </h2>
          
          <p style={styles.section6Subtitle}>
            Success goes beyond technical skills—it's about how you present yourself, 
            connect with others, and leave a lasting impression.
          </p>

          <div style={styles.experienceLayout}>
            <div style={styles.experienceImageContainer}>
              <img 
                src="/image4.avif" 
                alt="Charm School Experience" 
                style={styles.experienceImage}
              />
            </div>

            <div style={styles.experienceDetails}>
              <div style={styles.eventInfo}>
                <p style={styles.eventInfoItem}>📅 <strong>DATE:</strong> 10-11 JULY 2025</p>
                <p style={styles.eventInfoItem}>🕐 <strong>TIME:</strong> 8:00 AM - 5:00 PM</p>
                <p style={styles.eventInfoItem}>📍 <strong>LOCATION:</strong> JOHANNESBURG, SOUTH AFRICA</p>
              </div>

              <h3 style={styles.expectTitle}>What To Expect:</h3>

              <div style={styles.expectList}>
                <div style={styles.expectItem}>
                  <div style={styles.expectCheck}>✓</div>
                  <div>
                    <h4 style={styles.expectItemTitle}>Engaging Sessions</h4>
                    <p style={styles.expectItemText}>Learn to make powerful first impressions and communicate with confidence.</p>
                  </div>
                </div>

                <div style={styles.expectItem}>
                  <div style={styles.expectCheck}>✓</div>
                  <div>
                    <h4 style={styles.expectItemTitle}>Interactive Networking</h4>
                    <p style={styles.expectItemText}>Participate in hands-on activities to refine networking & networking skills.</p>
                  </div>
                </div>

                <div style={styles.expectItem}>
                  <div style={styles.expectCheck}>✓</div>
                  <div>
                    <h4 style={styles.expectItemTitle}>Professional Storytelling</h4>
                    <p style={styles.expectItemText}>Connect with top professionals and ambitious peers.</p>
                  </div>
                </div>

                <div style={styles.expectItem}>
                  <div style={styles.expectCheck}>✓</div>
                  <div>
                    <h4 style={styles.expectItemTitle}>Career Readiness Toolkit</h4>
                    <p style={styles.expectItemText}>Receive practical tools for personal branding, resume building, and LinkedIn optimization.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7 - EVENT PROGRAMME */}
      <section style={styles.section7}>
        <div style={styles.sectionContent}>
          <h2 style={styles.sectionTitle}>
            EVENT PROGRAMME
          </h2>
          <p style={styles.programmeSubtitle}>
            (Subject to change based on speaker availability and updates)
          </p>

          <div style={styles.tabNavigation}>
            <button style={styles.tabButton}>Day 1</button>
            <button style={styles.tabButtonActive}>Day 2</button>
          </div>

          <div style={styles.programmeContent}>
            <h3 style={styles.programmeTitle}>Personal Branding & Professional Presence</h3>

            <div style={styles.scheduleList}>
              <div style={styles.scheduleItem}>
                <span style={styles.scheduleTime}>⏰ 8:00 AM – 10:30 AM |</span>
                <span style={styles.scheduleEvent}>Welcome & Keynote: The Power of Charm in Career Success</span>
              </div>

              <div style={styles.scheduleItem}>
                <span style={styles.scheduleTime}>🕐 10:30 AM – 12:00 PM |</span>
                <span style={styles.scheduleEvent}>Executive Presence & Professional Etiquette</span>
              </div>

              <div style={styles.scheduleItem}>
                <span style={styles.scheduleTime}>🍴 12:00 PM – 1:00 PM |</span>
                <span style={styles.scheduleEvent}>Lunch Break & Networking</span>
              </div>

              <div style={styles.scheduleItem}>
                <span style={styles.scheduleTime}>⏰ 1:00 PM – 2:30 PM |</span>
                <span style={styles.scheduleEvent}>Confident Communication & Public Speaking</span>
              </div>

              <div style={styles.scheduleItem}>
                <span style={styles.scheduleTime}>⏰ 2:30 PM – 4:00 PM |</span>
                <span style={styles.scheduleEvent}>Personal Branding & LinkedIn Optimization</span>
              </div>

              <div style={styles.scheduleItem}>
                <span style={styles.scheduleTime}>⏰ 4:00 PM – 5:30 PM |</span>
                <span style={styles.scheduleEvent}>Leadership & Emotional Intelligence</span>
              </div>

              <div style={styles.scheduleItem}>
                <span style={styles.scheduleTime}>⏰ 5:30 PM – 6:00 PM |</span>
                <span style={styles.scheduleEvent}>Wrap-up & Networking</span>
              </div>
            </div>

            <div style={styles.programmeButtons}>
              <button 
                style={styles.primaryButton}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.color = '#8B5A2B';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#8B5A2B';
                  e.target.style.color = 'white';
                }}
              >
                Register Now
              </button>
              <button 
                style={styles.secondaryButton}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#8B5A2B';
                  e.target.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.color = '#8B5A2B';
                }}
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 8 - BE PART OF THE CHARM */}
      <section style={styles.section8}>
        <div style={styles.section8Background}></div>
        <div style={styles.section8Overlay}></div>
        <div style={styles.sectionContent}>
          <h2 style={styles.sectionTitleWhite}>
            BE PART OF THE CHARM
          </h2>

          <div style={styles.bePartLayout}>
            <div style={styles.bePartImageContainer}>
              <img 
                src="/image5.avif" 
                alt="Join Us" 
                style={styles.bePartImage}
              />
            </div>

            <div style={styles.bePartContent}>
              <h3 style={styles.bePartSubtitle}>Ways To Get Involved:</h3>

              <div style={styles.bePartList}>
                <div style={styles.bePartItem}>
                  <div style={styles.bePartCheck}>✓</div>
                  <div>
                    <h4 style={styles.bePartItemTitle}>Become a Partner</h4>
                    <p style={styles.bePartItemText}>Support this transformative initiative and develop future-ready talent.</p>
                  </div>
                </div>

                <div style={styles.bePartItem}>
                  <div style={styles.bePartCheck}>✓</div>
                  <div>
                    <h4 style={styles.bePartItemTitle}>Facilitate a Workshop</h4>
                    <p style={styles.bePartItemText}>Share your expertise and mentor young professionals.</p>
                  </div>
                </div>

                <div style={styles.bePartItem}>
                  <div style={styles.bePartCheck}>✓</div>
                  <div>
                    <h4 style={styles.bePartItemTitle}>Join the Experience</h4>
                    <p style={styles.bePartItemText}>Participate and build your career advantage.</p>
                  </div>
                </div>
              </div>

              <p style={styles.bePartTagline}>
                "TOGETHER, WE'RE SHAPING A WORKFORCE THAT THRIVES."
              </p>

              <button 
                style={styles.bePartButton}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.color = '#8B5A2B';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#8B5A2B';
                  e.target.style.color = 'white';
                }}
              >
                Contact us to inquire about partnerships, sponsorships, or facilitation opportunities
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: 'white',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  
  // Hero Section - Fixed text alignment
  heroSection: {
    position: 'relative',
    height: '70vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: "url('/backgroundNew.avif')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  heroContent: {
    position: 'relative',
    zIndex: 10,
    textAlign: 'left',
    color: 'white',
    padding: '0 1rem',
    maxWidth: '1200px',
    width: '100%',
  },
  heroTitle: {
    fontSize: '3.5rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    lineHeight: '1.2',
  },
  heroSubtitle: {
    fontSize: '1.5rem',
    marginBottom: '1.5rem',
    lineHeight: '1.6',
  },
  ctaButton: {
    backgroundColor: '#8B5A2B',
    color: 'white',
    padding: '1rem 2rem',
    borderRadius: '0.75rem',
    fontSize: '1.125rem',
    fontWeight: '600',
    border: '2px solid #8B5A2B',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  
  // Common Section Styles
  sectionContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
    position: 'relative',
    zIndex: 10,
  },
  sectionTitle: {
    fontSize: '3rem',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '3rem',
    color: '#1f2937',
  },
  sectionTitleWhite: {
    fontSize: '3rem',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '1.5rem',
    color: 'white',
  },
  sectionSubtitle: {
    fontSize: '1.25rem',
    textAlign: 'center',
    marginBottom: '3rem',
    color: '#d1d5db',
    maxWidth: '800px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  
  // Two Column Layout
  twoColumnLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '3rem',
    alignItems: 'center',
  },
  textContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  imageContainer: {
    display: 'flex',
    justifyContent: 'center',
  },
  
  // Section 1 Styles
  section1: {
    position: 'relative',
    padding: '4rem 0',
  },
  section1Background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: "url('/section1.avif')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'brightness(1.8) contrast(0.9)',
  },
  section1Overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  sectionText: {
    fontSize: '1.125rem',
    lineHeight: '1.7',
    color: '#374151',
  },
  eventCard: {
    backgroundColor: '#f3f4f6',
    padding: '1.5rem',
    borderRadius: '0.5rem',
  },
  eventTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: '#1f2937',
  },
  eventDetail: {
    fontSize: '1.125rem',
    marginBottom: '0.5rem',
    color: '#374151',
  },
  eventLabel: {
    fontWeight: '600',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  primaryButton: {
    backgroundColor: '#8B5A2B',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    fontWeight: '600',
    border: '2px solid #8B5A2B',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'white',
    color: '#8B5A2B',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    fontWeight: '600',
    border: '2px solid #8B5A2B',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center',
  },
  curvedImage: {
    width: '100%',
    height: '400px',
    objectFit: 'cover',
    borderTopRightRadius: '50%',
    borderBottomRightRadius: '50%',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
  },
  
  // Section 2 Styles
  section2: {
    position: 'relative',
    padding: '4rem 0',
  },
  section2Background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: "url('/section1.avif')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'brightness(0.3) contrast(1.2)',
  },
  section2Overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  checklist: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  checkItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },
  checkIcon: {
    width: '24px',
    height: '24px',
    border: '2px solid white',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    flexShrink: 0,
    marginTop: '2px',
    color: 'white',
  },
  checkText: {
    fontSize: '1.125rem',
    color: 'white',
  },
  sectionTextWhite: {
    fontSize: '1.125rem',
    lineHeight: '1.7',
    color: '#d1d5db',
  },
  standardImage: {
    width: '100%',
    height: '400px',
    objectFit: 'cover',
    borderRadius: '0.5rem',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
  },
  
  // Section 3 Styles
  section3: {
    padding: '4rem 0',
    backgroundColor: '#fef7ed',
  },
  introText: {
    fontSize: '1.125rem',
    color: '#374151',
    marginBottom: '2rem',
    lineHeight: '1.7',
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },
  featureCheck: {
    width: '24px',
    height: '24px',
    backgroundColor: '#8B5A2B',
    color: 'white',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    flexShrink: 0,
    marginTop: '2px',
  },
  featureTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '0.25rem',
  },
  featureDescription: {
    color: '#6b7280',
    lineHeight: '1.6',
  },
  ctaBox: {
    border: '2px solid #8B5A2B',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    marginTop: '2rem',
  },
  awardIcon: {
    fontSize: '1.5rem',
    flexShrink: 0,
  },
  ctaText: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
    lineHeight: '1.6',
  },

  // Section 4 - Building Confidence
  section4: {
    position: 'relative',
    padding: '4rem 0',
    minHeight: '80vh',
  },
  section4Background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: "url('/section1.avif')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  section4Overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.90)',
  },
  section4Subtitle: {
    fontSize: '1.125rem',
    textAlign: 'center',
    marginBottom: '3rem',
    color: 'white',
    maxWidth: '900px',
    marginLeft: 'auto',
    marginRight: 'auto',
    lineHeight: '1.7',
  },

  // FAQ Grid
  faqGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
    marginTop: '2rem',
  },
  faqColumn: {
    backgroundColor: 'rgba(139, 90, 43, 0.3)',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    border: '1px solid rgba(139, 90, 43, 0.5)',
  },
  faqHeader: {
    marginBottom: '1.5rem',
  },
  faqTitle: {
    color: 'white',
    fontSize: '1.125rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
  },
  searchBox: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchInput: {
    width: '100%',
    padding: '0.5rem 2.5rem 0.5rem 1rem',
    borderRadius: '0.375rem',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    fontSize: '0.875rem',
  },
  searchIcon: {
    position: 'absolute',
    right: '0.75rem',
    fontSize: '1rem',
  },
  faqTabs: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
  },
  faqTab: {
    padding: '0.5rem 1rem',
    backgroundColor: 'transparent',
    color: '#d4a574',
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap',
  },
  faqTabActive: {
    padding: '0.5rem 1rem',
    backgroundColor: 'rgba(139, 90, 43, 0.6)',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  // Accordion
  accordionContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  accordionItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '0.375rem',
    border: '1px solid rgba(139, 90, 43, 0.4)',
    overflow: 'hidden',
  },
  accordionButton: {
    width: '100%',
    padding: '1rem',
    backgroundColor: 'transparent',
    color: 'white',
    border: 'none',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    textAlign: 'left',
    transition: 'all 0.3s ease',
  },
  accordionIcon: {
    fontSize: '1.25rem',
    marginLeft: '0.5rem',
    fontWeight: 'bold',
  },
  accordionContent: {
    padding: '1rem',
    borderTop: '1px solid rgba(139, 90, 43, 0.3)',
    color: '#d1d5db',
    fontSize: '0.875rem',
    lineHeight: '1.6',
  },
  socialIcons: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '1rem',
  },
  socialIconLink: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
  },
  socialIconSvg: {
    width: '20px',
    height: '20px',
    fill: 'white',
  },

  // Section 5 - The Charm School Advantage
  section5: {
    padding: '4rem 0',
    backgroundColor: '#fef7ed',
  },
  tabNavigation: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  },
  tabButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'white',
    color: '#8B5A2B',
    border: '2px solid #8B5A2B',
    borderRadius: '2rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  tabButtonActive: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#8B5A2B',
    color: 'white',
    border: '2px solid #8B5A2B',
    borderRadius: '2rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  advantageContent: {
    textAlign: 'center',
    maxWidth: '800px',
    margin: '0 auto',
  },
  advantageSubtitle: {
    fontSize: '1.75rem',
    fontWeight: '600',
    color: '#8B5A2B',
    marginBottom: '2rem',
  },
  advantageList: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '2rem',
    marginBottom: '2rem',
    textAlign: 'left',
  },
  bigLogo: {
    width: '60px',
    height: '60px',
    flexShrink: 0,
  },
  bigLogoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  bulletList: {
    listStyle: 'disc',
    paddingLeft: '1.5rem',
  },
  bulletItem: {
    fontSize: '1.125rem',
    color: '#374151',
    marginBottom: '1rem',
    lineHeight: '1.7',
  },
  advantageButton: {
    backgroundColor: '#8B5A2B',
    color: 'white',
    padding: '1rem 2rem',
    borderRadius: '0.5rem',
    fontWeight: '600',
    border: '2px solid #8B5A2B',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '1rem',
  },

  // Section 6 - The Upcoming Charm School Experience
  section6: {
    position: 'relative',
    padding: '4rem 0',
    minHeight: '70vh',
  },
  section6Background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: "url('/section1.avif')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  section6Overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(107, 70, 34, 0.9)',
  },
  section6Subtitle: {
    fontSize: '1.125rem',
    textAlign: 'center',
    marginBottom: '3rem',
    color: 'white',
    maxWidth: '800px',
    marginLeft: 'auto',
    marginRight: 'auto',
    lineHeight: '1.7',
  },
  experienceLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '3rem',
    alignItems: 'center',
  },
  experienceImageContainer: {
    display: 'flex',
    justifyContent: 'center',
  },
  experienceImage: {
    width: '100%',
    height: '400px',
    objectFit: 'cover',
    borderRadius: '0.5rem',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
  },
  experienceDetails: {
    color: 'white',
  },
  eventInfo: {
    marginBottom: '2rem',
  },
  eventInfoItem: {
    fontSize: '1rem',
    marginBottom: '0.5rem',
    fontWeight: '500',
  },
  expectTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
  },
  expectList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  expectItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
  },
  expectCheck: {
    width: '24px',
    height: '24px',
    backgroundColor: 'white',
    color: '#8B5A2B',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    flexShrink: 0,
    marginTop: '2px',
  },
  expectItemTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    marginBottom: '0.25rem',
  },
  expectItemText: {
    fontSize: '0.95rem',
    lineHeight: '1.6',
    opacity: 0.9,
  },

  // Section 7 - Event Programme
  section7: {
    padding: '4rem 0',
    backgroundColor: '#fef7ed',
  },
  programmeSubtitle: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: '-2rem',
    marginBottom: '2rem',
    fontSize: '0.95rem',
  },
  programmeContent: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  programmeTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#8B5A2B',
    marginBottom: '2rem',
    textAlign: 'center',
  },
  scheduleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '2rem',
  },
  scheduleItem: {
    fontSize: '1rem',
    color: '#374151',
    lineHeight: '1.7',
  },
  scheduleTime: {
    fontWeight: '600',
    marginRight: '0.5rem',
  },
  scheduleEvent: {
    fontWeight: '400',
  },
  programmeButtons: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },

  // Section 8 - Be Part of the Charm
  section8: {
    position: 'relative',
    padding: '4rem 0 0 0',
    minHeight: '70vh',
  },
  section8Background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: "url('/section1.avif')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  section8Overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(107, 70, 34, 0.9)',
  },
  bePartLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '3rem',
    alignItems: 'center',
    marginBottom: '3rem',
  },
  bePartImageContainer: {
    display: 'flex',
    justifyContent: 'center',
  },
  bePartImage: {
    width: '100%',
    maxWidth: '400px',
    height: 'auto',
    objectFit: 'contain',
  },
  bePartContent: {
    color: 'white',
  },
  bePartSubtitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
  },
  bePartList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  bePartItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
  },
  bePartCheck: {
    width: '24px',
    height: '24px',
    backgroundColor: 'white',
    color: '#8B5A2B',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    flexShrink: 0,
    marginTop: '2px',
  },
  bePartItemTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    marginBottom: '0.25rem',
  },
  bePartItemText: {
    fontSize: '0.95rem',
    lineHeight: '1.6',
    opacity: 0.9,
  },
  bePartTagline: {
    fontSize: '1rem',
    fontWeight: '600',
    marginBottom: '2rem',
    fontStyle: 'italic',
  },
  bePartButton: {
    backgroundColor: '#8B5A2B',
    color: 'white',
    padding: '1rem 2rem',
    borderRadius: '0.5rem',
    fontWeight: '600',
    border: '2px solid white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.95rem',
  },
};

export default CharmSchool;