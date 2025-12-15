import React, { useState } from 'react';
import Header from "./Header";
import Footer from "./Footer";

const CharmSchool = () => {
  const [openAccordion, setOpenAccordion] = useState(null);
  const [activeTab, setActiveTab] = useState('graduates');
  const [activeSponsorTab, setActiveSponsorTab] = useState('graduates');
  const [activeProgramTab, setActiveProgramTab] = useState('day1');

  const toggleAccordion = (index) => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

  // Tab content with images
  const tabContent = {
    graduates: {
      title: "Unlock confidence, executive presence, and workplace readiness to stand out and succeed in your career.",
      images: [
        "https://www.keg.com/hubfs/Keystone%20August%202018%20Folder/Images/52834_NAGAP_Thumbnail_2.jpg",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTywJXpneFrKGIm8n41FlTonZuuyGYRiq_UAg&s"
      ]
    },
    smes: {
      title: "Access polished, high-attitude, job-ready graduates who integrate quickly and add value from Day One.",
      images: [
        "https://theunagroup.co.uk/wp-content/uploads/2023/06/SMEs-workplace-The-Una-Group.jpg-1.jpg",
        "https://www.oecd.org/adobe/dynamicmedia/deliver/dm-aid--5a27b860-87ea-4ef9-9a69-0f5bc805dac6/sme-financing-new.jpg?quality=80&preferwebp=true"
      ]
    },
    sponsors: {
      title: "Drive measurable CSI/ESD impact by funding talent development that strengthens SMEs and creates employment pathways.",
      images: [
        "https://i2icenter.org/wp-content/uploads/2021/03/partnership-gears-pic.jpg",
        "https://worldfinancialreview.com/wp-content/uploads/2021/08/men-shaking-hands-800x534-1.jpg"
      ]
    }
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
            Preparing Work-Ready Talent to Power South Africa's SMEs.
          </p>
          <p style={styles.heroDescription}>
            The Charm School develops confident, capable graduates who are ready to contribute from Day One — 
            strengthening SMEs, empowering young professionals, and enabling sponsors to drive real economic impact.
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
                The BIG Charm School is a high-impact CSI programme designed to bridge the gap between education 
                and employability. By equipping graduates with essential soft skills, professional presence, and 
                workplace readiness, we create a pipeline of polished, confident young professionals prepared to 
                thrive in fast-paced SME environments.
              </p>
              <p style={styles.sectionText}>
                Through this initiative, graduates gain employability, SMEs gain ready-to-perform talent, and 
                sponsors play a vital role in building stronger businesses, reducing youth unemployment, and 
                accelerating South Africa's economic growth.
              </p>
              <p style={styles.sectionText}>
                <strong>Charm School is more than training — it's an ecosystem solution for talent development, SME capacity, and social impact.</strong>
              </p>
              
              <div style={styles.eventCard}>
                <h3 style={styles.eventTitle}>NEXT EVENT</h3>
                <p style={styles.eventDetail}><span style={styles.eventLabel}>Date:</span> Coming Soon</p>
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

      {/* Section 2 - THE CHARM SCHOOL ADVANTAGE */}
      <section style={styles.sectionAdvantage}>
        <div style={styles.sectionContent}>
          <h2 style={styles.sectionTitle}>
            THE CHARM SCHOOL ADVANTAGE
          </h2>
          
          <div style={styles.tabNavigation}>
            <button 
              style={activeSponsorTab === 'graduates' ? styles.tabButtonActive : styles.tabButton}
              onClick={() => setActiveSponsorTab('graduates')}
              onMouseEnter={(e) => {
                if (activeSponsorTab !== 'graduates') {
                  e.target.style.backgroundColor = 'rgba(139, 90, 43, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSponsorTab !== 'graduates') {
                  e.target.style.backgroundColor = 'white';
                }
              }}
            >
              FOR GRADUATES
            </button>
            <button 
              style={activeSponsorTab === 'smes' ? styles.tabButtonActive : styles.tabButton}
              onClick={() => setActiveSponsorTab('smes')}
              onMouseEnter={(e) => {
                if (activeSponsorTab !== 'smes') {
                  e.target.style.backgroundColor = 'rgba(139, 90, 43, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSponsorTab !== 'smes') {
                  e.target.style.backgroundColor = 'white';
                }
              }}
            >
              FOR SMEs
            </button>
            <button 
              style={activeSponsorTab === 'sponsors' ? styles.tabButtonActive : styles.tabButton}
              onClick={() => setActiveSponsorTab('sponsors')}
              onMouseEnter={(e) => {
                if (activeSponsorTab !== 'sponsors') {
                  e.target.style.backgroundColor = 'rgba(139, 90, 43, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSponsorTab !== 'sponsors') {
                  e.target.style.backgroundColor = 'white';
                }
              }}
            >
              FOR SPONSORS & PARTNERS
            </button>
          </div>

          {/* Tab Images */}
          <div style={styles.tabImagesContainer}>
            {tabContent[activeSponsorTab].images.map((img, index) => (
              <div key={index} style={styles.tabImageWrapper}>
                <img 
                  src={img} 
                  alt={`${activeSponsorTab} example ${index + 1}`}
                  style={styles.tabImage}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80";
                  }}
                />
              </div>
            ))}
          </div>

          {activeSponsorTab === 'graduates' && (
            <div style={styles.advantageContent}>
              <h3 style={styles.advantageSubtitle}>Unlock confidence, executive presence, and workplace readiness to stand out and succeed in your career.</h3>
              
              <div style={styles.advantageGrid}>
                <div style={styles.advantageText}>
                  <h4 style={styles.advantageHeading}>Charm. Confidence. Competence.<br />Become the kind of professional people remember.</h4>
                  <p style={styles.advantageParagraph}>
                    The BIG Charm School is designed to help you stand out, show up with confidence, and thrive in any professional setting. 
                    Whether you're entering the job market or stepping into the next phase of your career, this programme gives you the soft 
                    skills and personal power that set you apart.
                  </p>

                  <h4 style={styles.advantageSectionTitle}>CHARM YOUR WAY TO SUCCESS</h4>
                  <p style={styles.advantageParagraph}>
                    Technical skills get you the job — soft skills help you keep it, grow in it, and lead others.
                  </p>
                  <p style={styles.advantageParagraph}>
                    At Brown Ivory Group (BIG), we're committed to shaping the next generation of confident, capable, career-ready graduates. 
                    Through The Charm School, we empower you with the mindset, presence, and communication skills needed to shine in the workplace.
                  </p>
                  <p style={styles.advantageParagraph}>
                    Whether you're preparing for your first interview, presenting to a team, or stepping into leadership opportunities, 
                    this programme helps you stand out, inspire confidence, and grow in your career.
                  </p>

                  <h4 style={styles.advantageSectionTitle}>WHAT YOU WILL LEARN</h4>
                  <div style={styles.checklist}>
                    <div style={styles.checkItem}>
                      <div style={styles.checkIcon}>✓</div>
                      <span style={styles.checkText}>Executive Presence & Personal Branding - Carry yourself with professionalism and confidence.</span>
                    </div>
                    <div style={styles.checkItem}>
                      <div style={styles.checkIcon}>✓</div>
                      <span style={styles.checkText}>Public Speaking & Confident Communication - Never shy away from voicing your thoughts or presenting your ideas.</span>
                    </div>
                    <div style={styles.checkItem}>
                      <div style={styles.checkIcon}>✓</div>
                      <span style={styles.checkText}>Emotional Intelligence & Leadership Skills - Manage pressure, collaborate well, and handle conflict effectively.</span>
                    </div>
                    <div style={styles.checkItem}>
                      <div style={styles.checkIcon}>✓</div>
                      <span style={styles.checkText}>Networking & Relationship Building - Learn how to build meaningful professional connections.</span>
                    </div>
                    <div style={styles.checkItem}>
                      <div style={styles.checkIcon}>✓</div>
                      <span style={styles.checkText}>Professional Etiquette & Workplace Readiness - Understand the expectations and behaviours that employers value.</span>
                    </div>
                  </div>

                  <h4 style={styles.advantageSectionTitle}>YOUR EXCLUSIVE CHARM SCHOOL TOOLKIT</h4>
                  <p style={styles.advantageParagraph}>Every participant receives:</p>
                  <div style={styles.toolkitList}>
                    <div style={styles.toolkitItem}>• Digital Handbook</div>
                    <div style={styles.toolkitItem}>• Networking Directory</div>
                    <div style={styles.toolkitItem}>• Customisable Templates</div>
                    <div style={styles.toolkitItem}>• Mentorship 101 Guide</div>
                    <div style={styles.toolkitItem}>• Charm School Certificate — Your Degree in Charm</div>
                  </div>

                  <h4 style={styles.advantageSectionTitle}>CHARM SCHOOL EXPERIENCE</h4>
                  <p style={styles.advantageParagraph}>Dates: Coming Soon | Johannesburg, South Africa</p>
                  <p style={styles.advantageParagraph}>
                    A two-day immersive, interactive experience designed to help you unlock your confidence and walk into any workplace with impact.
                  </p>

                  <h4 style={styles.advantageSectionTitle}>WHY JOIN?</h4>
                  <ul style={styles.bulletList}>
                    <li style={styles.bulletItem}>Stand out in interviews</li>
                    <li style={styles.bulletItem}>Make strong first impressions</li>
                    <li style={styles.bulletItem}>Build confidence in both formal and informal workplace settings</li>
                    <li style={styles.bulletItem}>Position yourself as a standout candidate for SME placement through BIG Marketplace</li>
                    <li style={styles.bulletItem}>Gain a prestigious certification that enhances your professional profile</li>
                  </ul>

                  <p style={styles.advantageTagline}>
                    <strong>Become unforgettable.<br />Become career-ready.<br />Become charm-certified.</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSponsorTab === 'smes' && (
            <div style={styles.advantageContent}>
              <h3 style={styles.advantageSubtitle}>Access polished, high-attitude, job-ready graduates who integrate quickly and add value from Day One.</h3>
              
              <div style={styles.advantageGrid}>
                <div style={styles.advantageText}>
                  <h4 style={styles.advantageHeading}>FOR SMES: WORK-READY GRADUATES WHO ADD VALUE FROM DAY ONE</h4>
                  <p style={styles.advantageParagraph}>
                    Growing SMEs don't just need talent — they need graduates who arrive polished, confident, and ready to contribute immediately.
                  </p>
                  <p style={styles.advantageParagraph}>
                    The Charm School prepares young professionals to thrive in fast-paced SME environments, giving them the soft skills, 
                    work ethic, and emotional intelligence your business needs to scale.
                  </p>

                  <h4 style={styles.advantageSectionTitle}>WHY CHOOSE CHARM-CERTIFIED GRADUATES?</h4>
                  <p style={styles.advantageParagraph}>A Charm-Certified graduate brings:</p>
                  <div style={styles.checklist}>
                    <div style={styles.checkItem}>
                      <div style={styles.checkIcon}>✓</div>
                      <span style={styles.checkText}>Professional communication</span>
                    </div>
                    <div style={styles.checkItem}>
                      <div style={styles.checkIcon}>✓</div>
                      <span style={styles.checkText}>Executive presence</span>
                    </div>
                    <div style={styles.checkItem}>
                      <div style={styles.checkIcon}>✓</div>
                      <span style={styles.checkText}>Emotional intelligence</span>
                    </div>
                    <div style={styles.checkItem}>
                      <div style={styles.checkIcon}>✓</div>
                      <span style={styles.checkText}>Adaptability</span>
                    </div>
                    <div style={styles.checkItem}>
                      <div style={styles.checkIcon}>✓</div>
                      <span style={styles.checkText}>Customer service mindset</span>
                    </div>
                    <div style={styles.checkItem}>
                      <div style={styles.checkIcon}>✓</div>
                      <span style={styles.checkText}>Leadership readiness</span>
                    </div>
                    <div style={styles.checkItem}>
                      <div style={styles.checkIcon}>✓</div>
                      <span style={styles.checkText}>Strong work ethic</span>
                    </div>
                    <div style={styles.checkItem}>
                      <div style={styles.checkIcon}>✓</div>
                      <span style={styles.checkText}>Confidence with clients & teams</span>
                    </div>
                  </div>
                  <p style={styles.advantageParagraph}>
                    <strong>They integrate faster.<br />They need less hand-holding.<br />They embody professionalism from the very first day.</strong>
                  </p>

                  <h4 style={styles.advantageSectionTitle}>THE BUSINESS VALUE</h4>
                  <p style={styles.advantageParagraph}>Hiring a Charm-Certified graduate helps SMEs to:</p>
                  <ul style={styles.bulletList}>
                    <li style={styles.bulletItem}>Reduce onboarding time and costs</li>
                    <li style={styles.bulletItem}>Strengthen client-facing professionalism</li>
                    <li style={styles.bulletItem}>Build a more cohesive, reliable team</li>
                    <li style={styles.bulletItem}>Improve communication and conflict management</li>
                    <li style={styles.bulletItem}>Increase overall productivity</li>
                    <li style={styles.bulletItem}>Reduce HR risks associated with poor soft skills</li>
                  </ul>
                  <p style={styles.advantageParagraph}>
                    Your SME gets a graduate who is job-ready, confident, emotionally mature, and primed to deliver value.
                  </p>

                  <h4 style={styles.advantageSectionTitle}>SME-SPECIFIC CURRICULUM</h4>
                  <p style={styles.advantageParagraph}>
                    The Charm School is designed around what SMEs need most from junior talent:
                  </p>
                  <div style={styles.checklist}>
                    <div style={styles.checkItem}>
                      <div style={styles.checkIcon}>✓</div>
                      <span style={styles.checkText}>Executive Presence - Represent your SME with confidence.</span>
                    </div>
                    <div style={styles.checkItem}>
                      <div style={styles.checkIcon}>✓</div>
                      <span style={styles.checkText}>Communication & Public Speaking - Handle clients, suppliers, and internal teams professionally.</span>
                    </div>
                    <div style={styles.checkItem}>
                      <div style={styles.checkIcon}>✓</div>
                      <span style={styles.checkText}>Leadership Skills & EI - Show maturity and initiative in a small, agile team.</span>
                    </div>
                    <div style={styles.checkItem}>
                      <div style={styles.checkIcon}>✓</div>
                      <span style={styles.checkText}>Professional Conduct - Understand workplace behaviour, expectations, and accountability.</span>
                    </div>
                    <div style={styles.checkItem}>
                      <div style={styles.checkIcon}>✓</div>
                      <span style={styles.checkText}>Problem-Solving & Collaboration - Work well with others and manage pressure effectively.</span>
                    </div>
                  </div>

                  <h4 style={styles.advantageSectionTitle}>GET ACCESS TO THE CHARM-CERTIFIED TALENT POOL</h4>
                  <p style={styles.advantageParagraph}>SMEs on BIG Marketplace can:</p>
                  <ul style={styles.bulletList}>
                    <li style={styles.bulletItem}>Select graduates pre-trained for SME environments</li>
                    <li style={styles.bulletItem}>Sponsor specific graduates for tailored development</li>
                    <li style={styles.bulletItem}>Participate in workshops or mentorship</li>
                    <li style={styles.bulletItem}>Build stronger teams using BIG's CSI-developed talent pipeline</li>
                  </ul>

                  <p style={styles.advantageTagline}>
                    <strong>SMEs deserve talent that delivers.<br />Charm School prepares them for you.</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSponsorTab === 'sponsors' && (
            <div style={styles.advantageContent}>
              <h3 style={styles.advantageSubtitle}>Drive measurable CSI/ESD impact by funding talent development that strengthens SMEs and creates employment pathways.</h3>
              
              <div style={styles.advantageGrid}>
                <div style={styles.advantageText}>
                  <h4 style={styles.advantageHeading}>SPONSOR A GRADUATE. STRENGTHEN SMES. CREATE REAL IMPACT.</h4>
                  <p style={styles.advantageParagraph}>
                    Charm School isn't just a training programme — it's a high-impact talent development pipeline that helps 
                    young graduates build meaningful careers while empowering SMEs to grow.
                  </p>
                  <p style={styles.advantageParagraph}>
                    As a sponsor, you play a direct role in shaping the next generation of professionals who will contribute 
                    to South Africa's economic growth.
                  </p>

                  <h4 style={styles.advantageSectionTitle}>WHY SPONSOR CHARM SCHOOL?</h4>

                  <div style={styles.sponsorReason}>
                    <h5 style={styles.sponsorReasonTitle}>1. Direct, Measurable Social Impact (CSI / CSR Aligned)</h5>
                    <p style={styles.advantageParagraph}>
                      Your sponsorship helps a graduate gain confidence, professionalism, and skills that dramatically increase their employability.
                    </p>
                    <p style={styles.advantageParagraph}>
                      <strong>You're not just funding training — you're funding a career.</strong>
                    </p>
                  </div>

                  <div style={styles.sponsorReason}>
                    <h5 style={styles.sponsorReasonTitle}>2. Strengthen High-Growth SMEs</h5>
                    <p style={styles.advantageParagraph}>
                      Graduates trained in Charm School are matched with vetted SMEs on BIG Marketplace.
                    </p>
                    <p style={styles.advantageParagraph}>Your support helps SMEs gain:</p>
                    <ul style={styles.bulletList}>
                      <li style={styles.bulletItem}>Work-ready talent</li>
                      <li style={styles.bulletItem}>Improved capacity</li>
                      <li style={styles.bulletItem}>Professional client-facing staff</li>
                      <li style={styles.bulletItem}>Stronger internal communication</li>
                      <li style={styles.bulletItem}>Reduced training and onboarding burden</li>
                    </ul>
                    <p style={styles.advantageParagraph}>
                      <strong>You contribute to real economic development, not surface-level CSI.</strong>
                    </p>
                  </div>

                  <div style={styles.sponsorReason}>
                    <h5 style={styles.sponsorReasonTitle}>3. Create Employment Pathways</h5>
                    <p style={styles.advantageParagraph}>
                      South Africa's youth unemployment problem is massive.
                    </p>
                    <p style={styles.advantageParagraph}>Your sponsorship helps graduates:</p>
                    <ul style={styles.bulletList}>
                      <li style={styles.bulletItem}>Enter the workforce</li>
                      <li style={styles.bulletItem}>Build networks</li>
                      <li style={styles.bulletItem}>Gain confidence and EQ</li>
                      <li style={styles.bulletItem}>Secure SME placement</li>
                      <li style={styles.bulletItem}>Start careers with dignity</li>
                    </ul>
                  </div>

                  <div style={styles.sponsorReason}>
                    <h5 style={styles.sponsorReasonTitle}>4. GET BRAND VISIBILITY & SOCIAL GOOD CREDIBILITY</h5>
                    <p style={styles.advantageParagraph}>Sponsors receive:</p>
                    <div style={styles.checklist}>
                      <div style={styles.checkItem}>
                        <div style={styles.checkIcon}>✓</div>
                        <span style={styles.checkText}>Branding on Charm School materials</span>
                      </div>
                      <div style={styles.checkItem}>
                        <div style={styles.checkIcon}>✓</div>
                        <span style={styles.checkText}>Recognition during events</span>
                      </div>
                      <div style={styles.checkItem}>
                        <div style={styles.checkIcon}>✓</div>
                        <span style={styles.checkText}>Inclusion in publicity, PR & social media</span>
                      </div>
                      <div style={styles.checkItem}>
                        <div style={styles.checkIcon}>✓</div>
                        <span style={styles.checkText}>Option to host graduates for site visits or mentorship</span>
                      </div>
                      <div style={styles.checkItem}>
                        <div style={styles.checkIcon}>✓</div>
                        <span style={styles.checkText}>Impact reports showing outcomes, employment, and SME placements</span>
                      </div>
                    </div>
                  </div>

                  <div style={styles.sponsorReason}>
                    <h5 style={styles.sponsorReasonTitle}>5. Partner with BIG Marketplace's Talent Ecosystem</h5>
                    <p style={styles.advantageParagraph}>Sponsors gain early access to the talent pool and have the option to:</p>
                    <ul style={styles.bulletList}>
                      <li style={styles.bulletItem}>Offer internships</li>
                      <li style={styles.bulletItem}>Host workplace readiness sessions</li>
                      <li style={styles.bulletItem}>Upskill their own young employees</li>
                      <li style={styles.bulletItem}>Build custom pipelines for enterprise supplier development (ESD)</li>
                    </ul>
                  </div>

                  <h4 style={styles.advantageSectionTitle}>WHAT YOUR SPONSORSHIP FUNDS</h4>
                  <p style={styles.advantageParagraph}>Each sponsored graduate receives:</p>
                  <ul style={styles.bulletList}>
                    <li style={styles.bulletItem}>Charm School training (2-day immersive programme)</li>
                    <li style={styles.bulletItem}>Graduation certification</li>
                    <li style={styles.bulletItem}>Digital handbook & templates</li>
                    <li style={styles.bulletItem}>Professional development toolkit</li>
                    <li style={styles.bulletItem}>Access to the BIG Marketplace talent ecosystem</li>
                    <li style={styles.bulletItem}>Priority SME placement support</li>
                  </ul>
                  <p style={styles.advantageParagraph}>
                    <strong>You fund confidence, dignity, capability, and a future.</strong>
                  </p>

                  <div style={styles.impactLevels}>
                    <h4 style={styles.advantageSectionTitle}>SPONSORSHIP = IMPACT AT THREE LEVELS</h4>
                    <div style={styles.impactGrid}>
                      <div style={styles.impactItem}>
                        <h5 style={styles.impactTitle}>1. The Graduate</h5>
                        <p style={styles.impactText}>Confidence, employability, professionalism.</p>
                      </div>
                      <div style={styles.impactItem}>
                        <h5 style={styles.impactTitle}>2. The SME</h5>
                        <p style={styles.impactText}>Work-ready junior talent who improves productivity.</p>
                      </div>
                      <div style={styles.impactItem}>
                        <h5 style={styles.impactTitle}>3. The Economy</h5>
                        <p style={styles.impactText}>Job creation. Stronger SMEs. A skilled workforce.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Section 3 - THE SECRET TO STANDING OUT */}
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

      {/* Section 4 - CHARM YOUR COMPETITIVE EDGE */}
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

      {/* Section 5 - BECOME A CHAMPION FOR TALENT */}
      <section style={styles.section4}>
        <div style={styles.section4Background}></div>
        <div style={styles.section4Overlay}></div>
        <div style={styles.sectionContent}>
          <h2 style={styles.sectionTitleWhite}>
            BECOME A CHAMPION FOR TALENT
          </h2>
          
          <p style={styles.section4Subtitle}>
            Become a Sponsor of Charm School.<br />
            Contact us to discuss sponsorship packages, impact reporting, or partnership opportunities.
          </p>
          
          <p style={styles.contactEmail}>
            📧 hello@bigmarketplace.africa
          </p>
          
          <div style={styles.faqGrid}>
            {/* Graduates FAQ Column */}
            <div style={styles.faqColumn}>
              <div style={styles.faqHeader}>
                <h3 style={styles.faqTitle}>For Graduates</h3>
              </div>

              <div style={styles.accordionContainer}>
                {[
                  { title: "What is the duration of the Charm School programme?", content: "The Charm School is a comprehensive 2-day immersive programme designed to transform your professional presence and soft skills." },
                  { title: "Will I receive a certificate after completion?", content: "Yes, all participants receive a Charm School Certificate — Your Degree in Charm, which enhances your professional profile." },
                  { title: "How will this help me get a job?", content: "The programme makes you stand out in interviews, helps you make strong first impressions, and positions you as a standout candidate for SME placement through BIG Marketplace." },
                  { title: "What kind of support will I receive after the programme?", content: "You'll receive ongoing access to our networking directory, mentorship opportunities, and priority placement support through BIG Marketplace." },
                  { title: "Is there any cost to attend?", content: "The Charm School is offered as part of our CSI initiative. Please contact us for specific details about programme fees and sponsorship opportunities." }
                ].map((item, index) => (
                  <div key={index} style={styles.accordionItem}>
                    <button 
                      style={styles.accordionButton}
                      onClick={() => toggleAccordion(`grad-${index}`)}
                    >
                      <span>{item.title}</span>
                      <span style={styles.accordionIcon}>{openAccordion === `grad-${index}` ? '−' : '∨'}</span>
                    </button>
                    {openAccordion === `grad-${index}` && (
                      <div style={styles.accordionContent}>
                        <p>{item.content}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* SMEs FAQ Column */}
            <div style={styles.faqColumn}>
              <div style={styles.faqHeader}>
                <h3 style={styles.faqTitle}>For SMEs</h3>
              </div>

              <div style={styles.accordionContainer}>
                {[
                  { title: "How are Charm School graduates different?", content: "Charm School graduates arrive polished, confident, and ready to contribute immediately. They have professional communication skills, emotional intelligence, and workplace readiness that reduces onboarding time." },
                  { title: "How can I access Charm-Certified graduates?", content: "SMEs registered on BIG Marketplace can select from pre-trained graduates, sponsor specific candidates, or participate in our talent matching programme." },
                  { title: "What is the cost benefit for my SME?", content: "By hiring Charm-Certified graduates, you reduce onboarding costs, improve team productivity, and gain professionally trained staff who integrate faster and require less hand-holding." },
                  { title: "Can I request specific training for graduates?", content: "Yes, we offer customised training packages for SMEs looking to develop graduates with specific skill sets aligned with their business needs." },
                  { title: "How quickly can graduates start adding value?", content: "Charm-Certified graduates are designed to add value from Day One, with most businesses reporting noticeable contributions within the first week of employment." }
                ].map((item, index) => (
                  <div key={index} style={styles.accordionItem}>
                    <button 
                      style={styles.accordionButton}
                      onClick={() => toggleAccordion(`sme-${index}`)}
                    >
                      <span>{item.title}</span>
                      <span style={styles.accordionIcon}>{openAccordion === `sme-${index}` ? '−' : '∨'}</span>
                    </button>
                    {openAccordion === `sme-${index}` && (
                      <div style={styles.accordionContent}>
                        <p>{item.content}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Sponsors FAQ Column */}
            <div style={styles.faqColumn}>
              <div style={styles.faqHeader}>
                <h3 style={styles.faqTitle}>For Sponsors</h3>
              </div>

              <div style={styles.accordionContainer}>
                {[
                  { title: "What are the sponsorship tiers available?", content: "We offer various sponsorship packages tailored to different budget levels and impact goals. Contact us for detailed information about our Bronze, Silver, Gold, and Platinum sponsorship tiers." },
                  { title: "How is my sponsorship impact measured?", content: "We provide comprehensive impact reports showing graduate employment rates, SME growth metrics, and social return on investment. You'll see exactly how your contribution creates change." },
                  { title: "Can I sponsor specific graduates or regions?", content: "Yes, we offer targeted sponsorship options where you can support graduates from specific regions, universities, or demographic backgrounds based on your CSI objectives." },
                  { title: "What branding opportunities are included?", content: "Sponsors receive branding on all Charm School materials, recognition during events, inclusion in PR campaigns, and opportunities for employee engagement through mentorship programmes." },
                  { title: "How does sponsorship strengthen SMEs?", content: "Your sponsorship creates a pipeline of work-ready talent that SMEs can access, helping them scale faster while reducing their recruitment and training costs." }
                ].map((item, index) => (
                  <div key={index} style={styles.accordionItem}>
                    <button 
                      style={styles.accordionButton}
                      onClick={() => toggleAccordion(`sponsor-${index}`)}
                    >
                      <span>{item.title}</span>
                      <span style={styles.accordionIcon}>{openAccordion === `sponsor-${index}` ? '−' : '∨'}</span>
                    </button>
                    {openAccordion === `sponsor-${index}` && (
                      <div style={styles.accordionContent}>
                        <p>{item.content}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
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
                <p style={styles.eventInfoItem}>📅 <strong>DATE:</strong> Coming Soon</p>
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
            <button 
              style={activeProgramTab === 'day1' ? styles.tabButtonActive : styles.tabButton}
              onClick={() => setActiveProgramTab('day1')}
            >
              Day 1
            </button>
            <button 
              style={activeProgramTab === 'day2' ? styles.tabButtonActive : styles.tabButton}
              onClick={() => setActiveProgramTab('day2')}
            >
              Day 2
            </button>
          </div>

          <div style={styles.programmeContent}>
            {activeProgramTab === 'day1' && (
              <>
                <h3 style={styles.programmeTitle}>Day 1: Professional Foundations & Workplace Readiness</h3>

                <div style={styles.scheduleList}>
                  <div style={styles.scheduleItem}>
                    <span style={styles.scheduleTime}>⏰ 9:00 AM – 9:30 AM |</span>
                    <span style={styles.scheduleEvent}>Welcome & Opening Keynote</span>
                  </div>

                  <div style={styles.scheduleItem}>
                    <span style={styles.scheduleTime}>🕐 9:30 AM – 10:15 AM |</span>
                    <span style={styles.scheduleEvent}>Slot 1: Professional Etiquette, Time Management, Personal Branding</span>
                  </div>

                  <div style={styles.scheduleItem}>
                    <span style={styles.scheduleTime}>🕐 10:15 AM – 11:00 AM |</span>
                    <span style={styles.scheduleEvent}>Slot 2: Effective Business Writing, Networking, Presentation Skills</span>
                  </div>

                  <div style={styles.scheduleItem}>
                    <span style={styles.scheduleTime}>☕ 11:00 AM – 11:15 AM |</span>
                    <span style={styles.scheduleEvent}>Morning Break</span>
                  </div>

                  <div style={styles.scheduleItem}>
                    <span style={styles.scheduleTime}>🕐 11:15 AM – 12:00 PM |</span>
                    <span style={styles.scheduleEvent}>Slot 3: Financial Literacy, Feedback Skills, Professional Dress</span>
                  </div>

                  <div style={styles.scheduleItem}>
                    <span style={styles.scheduleTime}>🕐 12:00 PM – 12:45 PM |</span>
                    <span style={styles.scheduleEvent}>Slot 4: Emotional Intelligence, Stress Management, Problem-Solving</span>
                  </div>

                  <div style={styles.scheduleItem}>
                    <span style={styles.scheduleTime}>🍴 12:45 PM – 1:45 PM |</span>
                    <span style={styles.scheduleEvent}>Networking Lunch</span>
                  </div>

                  <div style={styles.scheduleItem}>
                    <span style={styles.scheduleTime}>🕐 1:45 PM – 2:30 PM |</span>
                    <span style={styles.scheduleEvent}>Slot 5: Job Search Strategies, Interview Success, Career Planning</span>
                  </div>

                  <div style={styles.scheduleItem}>
                    <span style={styles.scheduleTime}>🕐 2:30 PM – 3:15 PM |</span>
                    <span style={styles.scheduleEvent}>Slot 6: Cross-Cultural Communication, Office Politics, Entrepreneurial Mindset</span>
                  </div>

                  <div style={styles.scheduleItem}>
                    <span style={styles.scheduleTime}>☕ 3:15 PM – 3:30 PM |</span>
                    <span style={styles.scheduleEvent}>Afternoon Break</span>
                  </div>

                  <div style={styles.scheduleItem}>
                    <span style={styles.scheduleTime}>🕐 3:30 PM – 4:15 PM |</span>
                    <span style={styles.scheduleEvent}>Slot 7: Leadership Foundations, Strategic Thinking, Influence Skills</span>
                  </div>

                  <div style={styles.scheduleItem}>
                    <span style={styles.scheduleTime}>🕐 4:15 PM – 5:00 PM |</span>
                    <span style={styles.scheduleEvent}>Closing Workshop & Wrap-Up</span>
                  </div>

                  <div style={styles.scheduleItem}>
                    <span style={styles.scheduleTime}>🎉 5:00 PM – 6:00 PM |</span>
                    <span style={styles.scheduleEvent}>Networking Reception</span>
                  </div>
                </div>
              </>
            )}

            {activeProgramTab === 'day2' && (
              <>
                <h3 style={styles.programmeTitle}>Day 2: Advanced Professional Development</h3>

                <div style={styles.scheduleList}>
                  <div style={styles.scheduleItem}>
                    <span style={styles.scheduleTime}>⏰ 8:30 AM – 9:00 AM |</span>
                    <span style={styles.scheduleEvent}>Morning Welcome & Day 1 Recap</span>
                  </div>

                  <div style={styles.scheduleItem}>
                    <span style={styles.scheduleTime}>🕐 9:00 AM – 10:00 AM |</span>
                    <span style={styles.scheduleEvent}>Advanced Communication Masterclass</span>
                  </div>

                  <div style={styles.scheduleItem}>
                    <span style={styles.scheduleTime}>🕐 10:00 AM – 11:00 AM |</span>
                    <span style={styles.scheduleEvent}>Executive Presence & Leadership Simulation</span>
                  </div>

                  <div style={styles.scheduleItem}>
                    <span style={styles.scheduleTime}>☕ 11:00 AM – 11:15 AM |</span>
                    <span style={styles.scheduleEvent}>Morning Break</span>
                  </div>

                  <div style={styles.scheduleItem}>
                    <span style={styles.scheduleTime}>🕐 11:15 AM – 12:15 AM |</span>
                    <span style={styles.scheduleEvent}>Emotional Intelligence in Practice</span>
                  </div>

                  <div style={styles.scheduleItem}>
                    <span style={styles.scheduleTime}>🕐 12:15 AM – 1:15 AM |</span>
                    <span style={styles.scheduleEvent}>Networking Excellence & Relationship Building</span>
                  </div>

                  <div style={styles.scheduleItem}>
                    <span style={styles.scheduleTime}>🍴 1:15 AM – 2:15 AM |</span>
                    <span style={styles.scheduleEvent}>Lunch & Professional Networking</span>
                  </div>

                  <div style={styles.scheduleItem}>
                    <span style={styles.scheduleTime}>🕐 2:15 AM – 3:30 AM |</span>
                    <span style={styles.scheduleEvent}>Career Acceleration Workshop</span>
                  </div>

                  <div style={styles.scheduleItem}>
                    <span style={styles.scheduleTime}>🕐 3:30 AM – 4:30 AM |</span>
                    <span style={styles.scheduleEvent}>Personal Branding & Digital Presence</span>
                  </div>

                  <div style={styles.scheduleItem}>
                    <span style={styles.scheduleTime}>🕐 4:30 AM – 5:00 AM |</span>
                    <span style={styles.scheduleEvent}>Graduation Ceremony & Certificate Distribution</span>
                  </div>

                  <div style={styles.scheduleItem}>
                    <span style={styles.scheduleTime}>🎓 5:00 AM – 6:00 AM |</span>
                    <span style={styles.scheduleEvent}>Celebration & Final Networking</span>
                  </div>
                </div>
              </>
            )}

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

      {/* Partnership Section - Full Width White Background */}
      <section style={styles.partnershipSection}>
        <div style={styles.partnershipContent}>
          <div style={styles.partnershipContainer}>
            <span style={styles.partnershipLabel}>IN PARTNERSHIP WITH</span>
            <img 
              src="./flo.png" 
              alt="Floconsult" 
              style={styles.floconsultLogo}
            />
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
  
  // Partnership Section - Full Width White Background
  partnershipSection: {
    width: '100%',
    backgroundColor: 'white',
    padding: '3rem 0',
    borderTop: '1px solid #e5e7eb',
    height: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnershipContent: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnershipContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2.5rem',
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    padding: '0 1rem',
  },
  partnershipLabel: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#8B5A2B',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    whiteSpace: 'nowrap',
  },
  floconsultLogo: {
    height: '100px',
    width: 'auto',
    maxWidth: '250px',
  },
  
  // Hero Section
  heroSection: {
    position: 'relative',
    height: '80vh',
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
    fontSize: '1.8rem',
    marginBottom: '1rem',
    lineHeight: '1.4',
    fontWeight: '600',
  },
  heroDescription: {
    fontSize: '1.2rem',
    marginBottom: '2rem',
    lineHeight: '1.6',
    maxWidth: '800px',
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
  
  // Section Advantage Styles
  sectionAdvantage: {
    padding: '4rem 0',
    backgroundColor: '#fef7ed',
  },
  advantageContent: {
    textAlign: 'left',
  },
  advantageSubtitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#8B5A2B',
    marginBottom: '2rem',
    textAlign: 'center',
  },
  advantageGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  advantageText: {
    lineHeight: '1.7',
  },
  advantageHeading: {
    fontSize: '1.75rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '1.5rem',
  },
  advantageParagraph: {
    fontSize: '1.125rem',
    color: '#374151',
    marginBottom: '1.5rem',
  },
  advantageSectionTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#8B5A2B',
    margin: '2rem 0 1rem 0',
  },
  checklist: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  checkItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },
  checkIcon: {
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
  checkText: {
    fontSize: '1.125rem',
    color: '#374151',
  },
  toolkitList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  toolkitItem: {
    fontSize: '1.125rem',
    color: '#374151',
  },
  bulletList: {
    listStyle: 'disc',
    paddingLeft: '1.5rem',
    marginBottom: '1.5rem',
  },
  bulletItem: {
    fontSize: '1.125rem',
    color: '#374151',
    marginBottom: '0.5rem',
    lineHeight: '1.6',
  },
  advantageTagline: {
    fontSize: '1.25rem',
    color: '#1f2937',
    textAlign: 'center',
    marginTop: '2rem',
    fontStyle: 'italic',
  },
  sponsorReason: {
    marginBottom: '2rem',
  },
  sponsorReasonTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#8B5A2B',
    marginBottom: '0.5rem',
  },
  impactLevels: {
    marginTop: '2rem',
  },
  impactGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1.5rem',
    marginTop: '1rem',
  },
  impactItem: {
    textAlign: 'center',
    padding: '1.5rem',
    backgroundColor: 'rgba(139, 90, 43, 0.1)',
    borderRadius: '0.5rem',
  },
  impactTitle: {
    fontSize: '1.125rem',
    fontWeight: 'bold',
    color: '#8B5A2B',
    marginBottom: '0.5rem',
  },
  impactText: {
    fontSize: '1rem',
    color: '#374151',
  },
  
  // Tab Navigation
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
  
  // Tab Images
  tabImagesContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  tabImageWrapper: {
    borderRadius: '0.5rem',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  tabImage: {
    width: '100%',
    height: '250px',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
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

  // Section 4 - Become a Champion for Talent
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
    fontSize: '1.5rem',
    textAlign: 'center',
    marginBottom: '1rem',
    color: 'white',
    maxWidth: '900px',
    marginLeft: 'auto',
    marginRight: 'auto',
    lineHeight: '1.7',
  },
  contactEmail: {
    fontSize: '1.25rem',
    textAlign: 'center',
    marginBottom: '3rem',
    color: 'white',
    fontWeight: '600',
  },

  // FAQ Grid
  faqGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
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
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    textAlign: 'center',
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
    padding: '4rem 0',
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
    marginBottom: '2rem',
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
    opacity: '0.9',
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