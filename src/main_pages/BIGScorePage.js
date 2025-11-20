import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const BIGScorePage = () => {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [popupContent, setPopupContent] = useState(null);
  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [popupMode, setPopupMode] = useState('weightings');

  useEffect(() => {
    const timer = setTimeout(() => setBannerLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const colors = {
    primary: '#754A2D',
    secondary: '#9E6E3C',
    accent: '#D3C1B2',
    light: '#F2F0E6',
    dark: '#372C27',
    text: '#372C27',
    textLight: '#5A4E47'
  };

  const scoreData = {
    bigScore: {
      title: "The BIG SCORE",
      description: "The Score That Earns You Trust — Before You Even Pitch",
      components: [
        {
          title: "Compliance Score",
          description: <p><span style={{ fontWeight: 'bold' , color:'#754A2D'}}>What it tells us</span>:Whether a business meets core legal, regulatory, and tax requirements. </p>,
          image: "https://img.icons8.com/ios-filled/100/754A2D/documents.png",
          detailedDescription: "🧱 This is the foundation of your BIG Score — no compliance, no credibility.",
          calculationMethod: "Our AI analyzes official documents, government records, and compliance certifications to verify your business's legal standing. We cross-reference multiple data sources to ensure accuracy and up-to-date information.",
          weightings: {
            seed: { value: "20%", description: "Focus on basic legal compliance" },
            growth: { value: "15%", description: "Expanded regulatory requirements" },
            maturity: { value: "15%", description: "Full compliance expected" }
          },
          subComponents: [
            {
              title: "Document Uploads",
              description: "Verification of required business documents",
              detailedDescription: "We check for what is typically required for vendor registration, including CIPC registration, SARS tax compliance, VAT (if applicable), proof of business address, ownership documents, B-BBEE certification, bank account confirmation, and completion of the BIG profile.",
              calculationMethod: "Automated verification with government registries and document validation",
              weightings: {
                seed: { value: "100%", description: "All documents weighted by importance" },
                growth: { value: "100%", description: "All documents weighted by importance" },
                maturity: { value: "100%", description: "All documents weighted by importance" }
              },
              items: [
                { name: "Business Registration Verified", weight: "13.3% (Seed), 16.6% (Growth), 16% (Maturity)" },
                { name: "Tax Compliance confirmed", weight: "19% (Seed), 22.2% (Growth), 19% (Maturity)" },
                { name: "VAT compliance verified", weight: "9.5% (Seed), 7.4% (Growth), 9.5% (Maturity)" },
                { name: "Proof of Business Address", weight: "4.8% (Seed), 3.7% (Growth), 4.8% (Maturity)" },
                { name: "Director identities verified", weight: "9.5% (Seed), 7.4% (Growth), 4.8% (Maturity)" },
                { name: "Ownership structure verified", weight: "9.5% (Seed), 7.4% (Growth), 4.8% (Maturity)" },
                { name: "BBBEE certificate valid", weight: "14.3% (Seed), 14.8% (Growth), 19% (Maturity)" },
                { name: "Bank Account valid", weight: "9.5% (Seed), 11.1% (Growth), 9.5% (Maturity)" },
                { name: "Company Letterhead", weight: "4.8% (Seed), 3.7% (Growth), 4.8% (Maturity)" },
                { name: "COID", weight: "1% (Seed), 2% (Growth), 3% (Maturity)" }
              ]
            },
            {
              title: "Profile Completion",
              description: "Completeness of business profile information",
              detailedDescription: "Assessment of how fully the business has completed all mandatory fields in the universal profile.",
              calculationMethod: "Automated checks of profile completion percentage",
              weightings: {
                seed: { value: "4.8%", description: "Basic profile required" },
                growth: { value: "3.7%", description: "More detailed profile" },
                maturity: { value: "4.8%", description: "Complete profile expected" }
              }
            }
          ]
        },
        {
          title: "Legitimacy Score",
          description: <p><span style={{ fontWeight: 'bold' , color:'#754A2D'}}>What it tells us</span>:How professionally and credibly your business presents itself — from governance signals to digital presence and leadership transparency. </p>,
          image: "https://img.icons8.com/ios-filled/100/754A2D/verified-account.png",
          detailedDescription: "🎯 Funders look beyond paperwork. This score shows you mean business.",
          calculationMethod: "We evaluate digital footprint, customer reviews, media presence, and partnership history. Our natural language processing analyzes sentiment and consistency across multiple platforms.",
          weightings: {
            seed: { value: "20%", description: "Basic legitimacy checks" },
            growth: { value: "15%", description: "Expanded track record evaluation" },
            maturity: { value: "15%", description: "Comprehensive reputation analysis" }
          },
          subComponents: [
            {
              title: "Foundational Business Identity",
              description: "Professional website, domain email, branded materials, registered address",
              detailedDescription: "Evaluation of professional website (active, secure, mobile-friendly), domain email (vs Gmail), branded materials (logo, pitch deck, business profile), and registered business address that matches compliance docs.",
              calculationMethod: "Automated checks and manual review where needed",
              weightings: {
                seed: { value: "25%", description: "Basic identity required" },
                growth: { value: "20%", description: "More professional identity" },
                maturity: { value: "15%", description: "Full professional identity" }
              }
            },
            {
              title: "Digital Presence & Discoverability",
              description: "Website, social media, searchability",
              detailedDescription: "Assessment of digital presence and how easily the business can be found online through searches.",
              calculationMethod: "Automated web scraping and search engine analysis",
              weightings: {
                seed: { value: "20%", description: "Basic digital presence" },
                growth: { value: "15%", description: "Established digital presence" },
                maturity: { value: "10%", description: "Strong digital presence" }
              }
            },
            {
              title: "Track Record Indicators",
              description: "Years in operation, client portfolio, repeat clients, turnover history",
              detailedDescription: "Evaluation of years in operation, past client/project portfolio, repeat clients or retainer contracts, and turnover history or financials.",
              calculationMethod: "Analysis of business history and client references",
              weightings: {
                seed: { value: "15%", description: "Limited history acceptable" },
                growth: { value: "20%", description: "Some track record expected" },
                maturity: { value: "25%", description: "Proven track record required" }
              }
            },
            {
              title: "Third-Party Validations",
              description: "Accreditations, memberships, awards, media features",
              detailedDescription: "Assessment of accreditations or certifications, membership in professional bodies, business awards or media features, and reference letters or testimonials.",
              calculationMethod: "Verification through third-party databases and manual review",
              weightings: {
                seed: { value: "10%", description: "Not required" },
                growth: { value: "15%", description: "Some validation helpful" },
                maturity: { value: "20%", description: "Validation expected" }
              }
            },
            {
              title: "Reputation and Social Proof",
              description: "Online reviews, testimonials, press mentions",
              detailedDescription: "Evaluation of positive online reviews, testimonials or case studies from clients, and mentions in press, awards, or recognitions.",
              calculationMethod: "Sentiment analysis across review platforms",
              weightings: {
                seed: { value: "10%", description: "Limited reviews acceptable" },
                growth: { value: "15%", description: "Some positive reputation" },
                maturity: { value: "15%", description: "Strong reputation" }
              }
            },
            {
              title: "Team & Leadership",
              description: "Visible leadership team, LinkedIn presence, team growth",
              detailedDescription: "Assessment of visible leadership team (bios on website/LinkedIn), LinkedIn presence for founders/key staff, and active hiring or team growth.",
              calculationMethod: "Analysis of leadership profiles and team growth metrics",
              weightings: {
                seed: { value: "20%", description: "Founding team visibility" },
                growth: { value: "15%", description: "Developing team structure" },
                maturity: { value: "15%", description: "Professional team expected" }
              }
            }
          ]
        },
        {
          title: "Leadership Score",
          description: <p><span style={{ fontWeight: 'bold' , color:'#754A2D'}}>What it tells us</span>: The leadership capabilities and experience of business owners and key executives.</p>,
          image: "https://img.icons8.com/ios-filled/100/754A2D/conference.png",
          detailedDescription: "👑 This score assesses readiness to lead teams, attract investment, and scale operations effectively.",
          calculationMethod: "We analyze leadership profiles, management experience, team composition, and professional credentials using advanced AI assessment of leadership capabilities.",
          weightings: {
            seed: { value: "15%", description: "Founding team evaluation" },
            growth: { value: "20%", description: "Developing leadership structure" },
            maturity: { value: "20%", description: "Professional leadership expected" }
          },
          subComponents: [
            {
              title: "Leadership Experience",
              description: "Years of management experience, positions held, business complexity managed",
              detailedDescription: "Evaluation of leadership tenure, roles and responsibilities, and complexity of organizations managed.",
              calculationMethod: "Analysis of leadership profiles and career history",
              weightings: {
                seed: { value: "32%", description: "Founder experience focus" },
                growth: { value: "32%", description: "Management experience" },
                maturity: { value: "32%", description: "Executive experience" }
              }
            },
            {
              title: "Team Management",
              description: "Scale of teams led, organizational structure, revenue management success",
              detailedDescription: "Assessment of team size management, organizational complexity, and revenue responsibility.",
              calculationMethod: "Evaluation of management scope and team leadership",
              weightings: {
                seed: { value: "28%", description: "Small team management" },
                growth: { value: "28%", description: "Growing team management" },
                maturity: { value: "28%", description: "Large team management" }
              }
            },
            {
              title: "Recognition & Education",
              description: "Educational qualifications, certifications, awards, industry recognition",
              detailedDescription: "Assessment of formal education, professional certifications, industry awards, and recognition.",
              calculationMethod: "Verification of credentials and achievements",
              weightings: {
                seed: { value: "20%", description: "Basic qualifications" },
                growth: { value: "20%", description: "Professional development" },
                maturity: { value: "20%", description: "Advanced credentials" }
              }
            },
            {
              title: "Team & Leadership Visibility",
              description: "Professional profiles, leadership visibility, team composition credibility",
              detailedDescription: "Evaluation of leadership team visibility, professional online presence, and team composition.",
              calculationMethod: "Analysis of leadership visibility and team structure",
              weightings: {
                seed: { value: "20%", description: "Founder visibility" },
                growth: { value: "20%", description: "Leadership team visibility" },
                maturity: { value: "20%", description: "Executive team credibility" }
              }
            }
          ],
          scoreInterpretation: [
            { range: "91-100%", level: "Visionary Leadership", description: "Proven ability to lead complex organizations with strategic foresight" },
            { range: "81-90%", level: "Seasoned Leadership", description: "Excellent management strength and inspiring organizational leadership" },
            { range: "61-80%", level: "Rising Leadership", description: "Strong foundations with clear potential for scaling influence and impact" },
            { range: "41-60%", level: "Developing Leadership", description: "Growing experience with opportunities to strengthen leadership depth" },
            { range: "0-40%", level: "Foundational Stage Leadership", description: "Building the capabilities and credibility needed to inspire teams and investors" }
          ]
        },
        {
          title: "Governance Score",
          description: <p><span style={{ fontWeight: 'bold' , color:'#754A2D'}}>What it tells us</span>: Whether a business is ready to establish or improve its governance structures.</p>,
          image: "https://img.icons8.com/ios-filled/100/754A2D/government-building.png",
          detailedDescription: "🏛️ This score combines Public Interest Score with governance maturity assessment for comprehensive oversight evaluation.",
          calculationMethod: "We assess board structure, strategic planning, risk management, transparency practices, and policy frameworks using AI analysis of governance documentation.",
          weightings: {
            seed: { value: "15%", description: "Basic governance evaluation" },
            growth: { value: "20%", description: "Developing governance structures" },
            maturity: { value: "20%", description: "Mature governance expected" }
          },
          subComponents: [
            {
              title: "Board Structure & Functionality",
              description: "Composition, roles, and effectiveness of board or advisory structure",
              detailedDescription: "Evaluation of governance oversight suitable for business size and complexity.",
              calculationMethod: "Review of board composition, charters, and meeting effectiveness",
              weightings: {
                seed: { value: "25%", description: "Advisory stage governance" },
                growth: { value: "25%", description: "Emerging board stage" },
                maturity: { value: "25%", description: "Full board stage" }
              }
            },
            {
              title: "Strategic Planning",
              description: "Long-term vision, business plans, decision-making processes",
              detailedDescription: "Assessment of strategic direction clarity and performance review processes.",
              calculationMethod: "Analysis of business plans and strategic documentation",
              weightings: {
                seed: { value: "20%", description: "Basic planning" },
                growth: { value: "20%", description: "Developing strategy" },
                maturity: { value: "20%", description: "Mature planning" }
              }
            },
            {
              title: "Risk Management",
              description: "Risk identification, assessment, mitigation, and crisis preparedness",
              detailedDescription: "Evaluation of business risk management and continuity planning.",
              calculationMethod: "Review of risk frameworks and business continuity plans",
              weightings: {
                seed: { value: "20%", description: "Basic risk awareness" },
                growth: { value: "20%", description: "Developing risk management" },
                maturity: { value: "20%", description: "Comprehensive risk framework" }
              }
            },
            {
              title: "Transparency & Reporting",
              description: "Financial reporting, stakeholder communication, disclosure standards",
              detailedDescription: "Assessment of reporting quality and frequency to stakeholders.",
              calculationMethod: "Evaluation of reporting practices and stakeholder communications",
              weightings: {
                seed: { value: "20%", description: "Basic reporting" },
                growth: { value: "20%", description: "Developing transparency" },
                maturity: { value: "20%", description: "Advanced reporting" }
              }
            },
            {
              title: "Policies & Documentation",
              description: "Essential business policies, employment contracts, compliance documentation",
              detailedDescription: "Review of policy framework completeness and legal protection measures.",
              calculationMethod: "Analysis of policy documentation and legal frameworks",
              weightings: {
                seed: { value: "15%", description: "Basic policies" },
                growth: { value: "15%", description: "Developing policy framework" },
                maturity: { value: "15%", description: "Comprehensive policies" }
              }
            }
          ],
          scoreInterpretation: [
            { range: "91-100%", level: "Governance Excellence", description: "Exceptional governance maturity with comprehensive structures and robust oversight" },
            { range: "81-90%", level: "Strong Governance", description: "Well-established governance framework with effective oversight mechanisms" },
            { range: "61-80%", level: "Developing Governance", description: "Good governance foundations with room for refinement in oversight structures" },
            { range: "41-60%", level: "Emerging Governance", description: "Basic governance elements with significant gaps needing addressing" },
            { range: "0-40%", level: "Foundational Stage", description: "Governance structures require substantial development and implementation" }
          ]
        },
        {
          title: "Capital Appeal Score",
          description: <p><span style={{ fontWeight: 'bold' , color:'#754A2D'}}>What it tells us</span>: How attractive a business is to potential investors and lenders.</p>,
          image: "https://img.icons8.com/ios-filled/100/754A2D/money-bag.png",
          detailedDescription: "💰 This score evaluates investment readiness and risk profile across critical funding decision factors.",
          calculationMethod: "Financial statements are analyzed using machine learning models that compare your metrics with industry benchmarks. We assess growth trends, revenue models, and market potential.",
          weightings: {
            seed: { value: "30%", description: "Early-stage investment appeal" },
            growth: { value: "30%", description: "Growth-stage funding potential" },
            maturity: { value: "30%", description: "Mature-stage investment readiness" }
          },
          subComponents: [
            {
              title: "Financial Readiness",
              description: "Accounting systems, compliance, up-to-date financial records",
              detailedDescription: "Assessment of financial management systems and compliance status.",
              calculationMethod: "Evaluation of accounting systems and financial compliance",
              weightings: {
                seed: { value: "25%", description: "Basic systems" },
                growth: { value: "20%", description: "Established systems" },
                maturity: { value: "15%", description: "Professional systems" }
              }
            },
            {
              title: "Financial Strength",
              description: "Revenue growth, profitability, audited financials",
              detailedDescription: "Evaluation of financial performance and stability metrics.",
              calculationMethod: "Analysis of financial statements and growth trends",
              weightings: {
                seed: { value: "20%", description: "Early metrics" },
                growth: { value: "25%", description: "Growing metrics" },
                maturity: { value: "30%", description: "Strong metrics" }
              }
            },
            {
              title: "Operational Strength",
              description: "Business processes, infrastructure, operational maturity",
              detailedDescription: "Assessment of operational efficiency and business model strength.",
              calculationMethod: "Evaluation of operational systems and processes",
              weightings: {
                seed: { value: "20%", description: "Basic operations" },
                growth: { value: "20%", description: "Developing operations" },
                maturity: { value: "15%", description: "Mature operations" }
              }
            },
            {
              title: "Impact Proof",
              description: "Job creation, HDG inclusion, environmental responsibility, CSR investment",
              detailedDescription: "Assessment of social and environmental impact metrics.",
              calculationMethod: "Analysis of impact documentation and sustainability practices",
              weightings: {
                seed: { value: "15%", description: "Early impact" },
                growth: { value: "15%", description: "Growing impact" },
                maturity: { value: "20%", description: "Mature impact" }
              }
            },
            {
              title: "Pitch & Business Plan Quality",
              description: "Investment narrative clarity, market analysis, competitive advantage",
              detailedDescription: "Evaluation of business plan quality and investment pitch effectiveness.",
              calculationMethod: "AI assessment of business plans and pitch materials",
              weightings: {
                seed: { value: "10%", description: "Basic pitch" },
                growth: { value: "10%", description: "Developing pitch" },
                maturity: { value: "10%", description: "Professional pitch" }
              }
            },
            {
              title: "Guarantees & Security",
              description: "Forward contracts, payment guarantees, asset-backed security",
              detailedDescription: "Assessment of financial guarantees and security arrangements.",
              calculationMethod: "Evaluation of guarantee documentation and security arrangements",
              weightings: {
                seed: { value: "10%", description: "Limited guarantees" },
                growth: { value: "10%", description: "Some guarantees" },
                maturity: { value: "10%", description: "Strong guarantees" }
              }
            }
          ],
          scoreInterpretation: [
            { range: "91-100%", level: "Highly Fundable", description: "Exceptional investment opportunity with strong financials and operations" },
            { range: "81-90%", level: "Strong Investment Case", description: "Very attractive to funders with solid performance metrics" },
            { range: "61-80%", level: "Moderate Potential", description: "Some areas need strengthening but shows promise" },
            { range: "41-60%", level: "Basic Potential", description: "Significant improvements needed across multiple areas" },
            { range: "0-40%", level: "Needs Development", description: "Fundamental changes required to attract investment" }
          ]
        }
      ]
    }
  };

  const openPopup = (content, mode = 'weightings') => {
    setPopupContent(content);
    setPopupMode(mode);
    setShowPopup(true);
    document.body.style.overflow = 'hidden';
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupContent(null);
    document.body.style.overflow = 'auto';
  };

  const ScoreBox = ({ component, index, openPopup }) => {
    const componentImages = {
      "Compliance Score": "https://thumbs.dreamstime.com/b/compliance-rules-law-regulation-policy-business-technology-concept-compliance-rules-law-regulation-policy-business-technology-112471593.jpg",
      "Legitimacy Score": "https://thekyb.com/wp-content/uploads/Business-Verification_-Navigating-the-Path-to-Ensure-Company-Legitimacy.jpg",
      "Leadership Score": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmaC4ABRZh3z2sU4tvYq8TTcVv-l0-xAGtXQ&s",
      "Governance Score": "https://media.istockphoto.com/id/639198068/photo/business-people-finding-solution-together-at-office.jpg?s=612x612&w=0&k=20&c=apxfQgMQ4KfWvTxdtyefbxIRiK0DVk7lFr4GbGSniR8=",
      "Capital Appeal Score": "https://c0.wallpaperflare.com/preview/98/565/296/gosclf0t64k3vi9o2podgkh1ev.jpg"
    };

    // Extract the short name for the button text
    const getShortName = (title) => {
      if (title.includes("Compliance")) return "Compliance";
      if (title.includes("Legitimacy")) return "Legitimacy";
      if (title.includes("Leadership")) return "Leadership";
      if (title.includes("Governance")) return "Governance";
      if (title.includes("Capital")) return "Capital";
      return title;
    };

    const shortName = getShortName(component.title);

    return (
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 8px 30px rgba(117, 74, 45, 0.1)',
        borderTop: '5px solid #9E6E3C',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease'
      }}
      onMouseOver={(e) => {
        e.target.style.transform = 'translateY(-5px)';
        e.target.style.boxShadow = '0 12px 35px rgba(117, 74, 45, 0.15)';
      }}
      onMouseOut={(e) => {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = '0 8px 30px rgba(117, 74, 45, 0.1)';
      }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '15px',
          marginBottom: '15px',
          flex: 1
        }}>
          <img
            src={component.image}
            alt={component.title}
            style={{
              width: '40px',
              height: '40px',
              objectFit: 'contain'
            }}
            onError={(e) => {
              // Fallback if image fails to load
              e.target.src = "https://img.icons8.com/ios-filled/100/754A2D/image.png";
            }}
          />
          <div>
            <h4 style={{ 
              color: '#754A2D',
              fontSize: '1.1rem',
              fontWeight: '700',
              margin: '0 0 8px 0'
            }}>
              {component.title}
            </h4>
            <p style={{ 
              color: '#555',
              lineHeight: '1.5',
              fontSize: '0.9rem'
            }}>
              {component.description}
            </p>
          </div>
        </div>
        
        <div style={{
          borderTop: '1px solid #D3C1B2',
          paddingTop: '12px',
          marginBottom: '15px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <img 
            src={componentImages[component.title]} 
            alt={component.title}
            style={{
              width: '100%',
              height: '120px',
              objectFit: 'cover',
              borderRadius: '8px'
            }}
            onError={(e) => {
              // Fallback if image fails to load
              e.target.src = "https://via.placeholder.com/300x120/754A2D/FFFFFF?text=" + component.title;
            }}
          />
          <p style={{
            fontSize: '0.85rem',
            color: '#666',
            lineHeight: '1.5'
          }}>
            {component.detailedDescription.split('. ')[0] + '.'}
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <button 
            onClick={() => openPopup({
              ...component,
              scoreTitle: "BIG Score Components",
              rubric: [
                { score: "Seed/Pre-seed", criteria: component.weightings.seed.value + " weighting" },
                { score: "Growth Stage", criteria: component.weightings.growth.value + " weighting" },
                { score: "Mature Stage", criteria: component.weightings.maturity.value + " weighting" }
              ],
              weightings: component.weightings
            }, 'weightings')}
            style={{
              backgroundColor: 'transparent',
              color: '#9E6E3C',
              border: '2px solid #9E6E3C',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              flex: 1,
              minWidth: '100px'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#9E6E3C';
              e.target.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#9E6E3C';
            }}
          >
            View Weightings
          </button>
          <button 
            onClick={() => openPopup({
              ...component,
              scoreTitle: "BIG Score Components",
              calculationMethod: component.calculationMethod,
              subComponents: component.subComponents,
              rubric: [
                { score: "Seed/Pre-seed", criteria: component.weightings.seed.value + " weighting" },
                { score: "Growth Stage", criteria: component.weightings.growth.value + " weighting" },
                { score: "Mature Stage", criteria: component.weightings.maturity.value + " weighting" }
              ],
              weightings: component.weightings
            }, 'calculation')}
            style={{
              backgroundColor: '#F2F0E6',
              color: '#754A2D',
              border: '2px solid #F2F0E6',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              flex: 1,
              minWidth: '100px'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#E0D8C8';
              e.target.style.borderColor = '#E0D8C8';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#F2F0E6';
              e.target.style.borderColor = '#F2F0E6';
            }}
          >
            See How {shortName} is Calculated
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      background: 'linear-gradient(#F2F0E6, #AA9889, #754A2D)',
      backgroundSize: 'cover',
      backgroundAttachment: 'fixed',
      fontFamily: "'Poppins', sans-serif",
      color: '#372C27',
      lineHeight: 1.6,
      letterSpacing: '0.3px'
    }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      
      <div style={{ minHeight: '100vh' }}>
        <Header />
        
        {/* Hero Banner */}
        <div style={{
          backgroundImage: 'linear-gradient(rgba(117, 74, 45, 0.85), rgba(55, 44, 39, 0.85)), url("https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '100px 20px',
          textAlign: 'center',
          color: '#F2F0E6',
          marginBottom: '60px',
          position: 'relative',
          overflow: 'hidden',
          clipPath: 'polygon(0 0, 100% 0, 100% 90%, 0 100%)'
        }}>
          <div style={{
            position: 'relative',
            zIndex: 2,
            opacity: bannerLoaded ? 1 : 0,
            transform: bannerLoaded ? 'translateY(0)' : 'translateY(50px)',
            transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            <h1 style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: '800',
              marginBottom: '25px',
              letterSpacing: '1px',
              textShadow: '2px 2px 8px rgba(0,0,0,0.3)',
              lineHeight: 1.2
            }}>
              <span style={{ 
                display: 'inline-block',
                background: 'linear-gradient(90deg, #F2F0E6, #D3C1B2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                The BIG SCORE
              </span>
            </h1>
            <p style={{
              fontSize: 'clamp(1rem, 2vw, 1.5rem)',
              maxWidth: '800px',
              margin: '0 auto 40px',
              lineHeight: '1.6',
              textShadow: '1px 1px 3px rgba(0,0,0,0.3)'
            }}>
              The Score That Earns You Trust — Before You Even Pitch
            </p>
            <button
              onClick={() => navigate('/LoginRegister')}
              style={{
                backgroundColor: '#9E6E3C',
                color: 'white',
                border: 'none',
                padding: '16px 50px',
                borderRadius: '30px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
                e.target.style.backgroundColor = '#754A2D';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                e.target.style.backgroundColor = '#9E6E3C';
              }}
            >
              Get your score now
            </button>
          </div>
        </div>
        
        <div style={{ 
          width: '90%', 
          maxWidth: '1400px',
          margin: '0 auto', 
          paddingBottom: '60px' 
        }}>
          
          {/* What is BIG Score Section */}
          <div style={{ 
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            marginBottom: '40px'
          }}>
            <h2 style={{ 
              color: '#754A2D', 
              fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
              fontWeight: '700',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              What Makes the BIG Score... BIG?
            </h2>
            
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
              flexWrap: 'wrap',
              marginBottom: '20px'
            }}>
              {[
                {
                  icon: '🧱',
                  title: "Business Credibility Score",
                  description: "A standardized score that validates your business's readiness and trustworthiness — across compliance, governance, and legitimacy."
                },
                {
                  icon: '📈',
                  title: "Growth Roadmap",
                  description: "Highlights strengths, flags risks, and reveals what you need to improve to unlock capital, customers, or partners."
                },
                {
                  icon: '🛡',
                  title: "Risk Assessment for Funders",
                  description: "Enables investors and partners to filter out unqualified businesses — and make data-backed decisions with confidence."
                }
              ].map((item, index) => (
                <div key={index} style={{
                  backgroundColor: '#F2F0E6',
                  padding: '20px',
                  borderRadius: '12px',
                  width: '250px',
                  textAlign: 'center',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
                  borderTop: '3px solid #9E6E3C',
                  transition: 'transform 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-5px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                }}
                >
                  <div style={{
                    width: '50px',
                    height: '50px',
                    backgroundColor: '#754A2D',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 15px',
                    color: '#F2F0E6',
                    fontSize: '1.3rem'
                  }}>
                    {item.icon}
                  </div>
                  <h3 style={{
                    fontWeight: '600',
                    color: '#372C27',
                    fontSize: '1rem',
                    marginBottom: '8px'
                  }}>{item.title}</h3>
                  <p style={{ 
                    color: '#555',
                    fontSize: '0.9rem'
                  }}>{item.description}</p>
                </div>
              ))}
            </div>
            
            <p style={{ 
              fontSize: '1rem',
              lineHeight: '1.6',
              maxWidth: '800px',
              margin: '20px auto 0',
              textAlign: 'center',
              fontStyle: 'italic',
              color: '#754A2D'
            }}>
              The BIG Score is more than a number — it's your passport to funders, partners, and opportunity
            </p>

            <div style={{
              backgroundColor: '#F2F0E6',
              padding: '25px',
              borderRadius: '12px',
              marginTop: '30px',
              borderLeft: '4px solid #9E6E3C'
            }}>
              <p style={{
                fontSize: '1rem',
                lineHeight: '1.7',
                color: '#372C27',
                textAlign: 'center',
                margin: 0
              }}>
                <strong>Consumer finance has TransUnion and Experian</strong> — global systems (like FICO in the US) that measure personal creditworthiness.<br />
                <strong>Corporates have Moody's, Fitch, and S&P</strong> — rating frameworks that measure institutional risk<br />
                <strong>SMEs have "The BIG Score"</strong> — a shared metric that lets funders, corporates, and partners speak the same language of readiness and reliability
              </p>
            </div>
          </div>

          {/* BIG Score Components Section */}
          <div style={{ 
            backgroundColor: '#754A2D',
            padding: '60px',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            marginBottom: '60px',
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(158, 110, 60, 0.8) 0%, rgba(117, 74, 45, 0.9) 100%)'
          }}>
            <h2 style={{ 
              color: '#F2F0E6', 
              fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
              fontWeight: '700',
              marginBottom: '25px',
              textAlign: 'center'
            }}>
              What Makes Up Your BIG Score?
            </h2>
            <p style={{
              fontSize: '1.1rem',
              lineHeight: '1.6',
              maxWidth: '800px',
              margin: '0 auto 40px',
              textAlign: 'center',
              color: '#F2F0E6'
            }}>
              Our AI-powered framework scores every SME across <strong>five core dimensions</strong> — giving funders, partners, and programs a complete view of business readiness.
            </p>
            
            {/* Top Row - 3 Cards */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '30px',
              marginBottom: '30px'
            }}>
              {scoreData.bigScore.components.slice(0, 3).map((component, index) => (
                <ScoreBox 
                  key={index}
                  component={component}
                  index={index}
                  openPopup={openPopup}
                />
              ))}
            </div>
            
            {/* Bottom Row - 2 Cards */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '30px'
            }}>
              {scoreData.bigScore.components.slice(3, 5).map((component, index) => (
                <ScoreBox 
                  key={index}
                  component={component}
                  index={index}
                  openPopup={openPopup}
                />
              ))}
            </div>
            
          </div>

          {/* Why BIG Score Works Section */}
          <div style={{ 
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            marginBottom: '40px'
          }}>
            <h2 style={{ 
              color: '#372C27', 
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: '30px'
            }}>
              Why the BIG Score Works
            </h2>
            
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
              flexWrap: 'wrap'
            }}>
              {/* Problems Column */}
              <div style={{ 
                backgroundColor: '#F2F0E6',
                padding: '20px',
                borderRadius: '16px',
                width: '48%',
                minWidth: '300px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  <img 
                    src="https://img.icons8.com/ios-filled/100/9E6E3C/warning-shield.png" 
                    alt="Problems" 
                    style={{ width: '40px' }}
                  />
                  <h3 style={{ 
                    fontSize: '1.2rem',
                    fontWeight: '700',
                    color: '#754A2D',
                    margin: 0
                  }}>Traditional Challenges</h3>
                </div>
                
                <div style={{ display: 'grid', gap: '15px' }}>
                  {[
                    {
                      icon: '❌',
                      title: "Subjective Judgement",
                      desc: "Unstructured interviews. Inconsistent criteria. Unconscious bias."
                    },
                    {
                      icon: '❌',
                      title: "Static Reports",
                      desc: "PDF-based. Instantly outdated. No live progress tracking."
                    },
                    {
                      icon: '❌',
                      title: "Opaque Criteria",
                      desc: "No visibility into what's being scored — or why."
                    },
                    {
                      icon: '❌',
                      title: "Manual Admin",
                      desc: "Slow. Inconsistent. Prone to error and reviewer fatigue."
                    }
                  ].map((item, index) => (
                    <div key={index} style={{ 
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '15px',
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      borderRadius: '12px'
                    }}>
                      <span style={{ 
                        color: '#9E6E3C', 
                        fontSize: '1.2rem',
                        marginTop: '2px'
                      }}>{item.icon}</span>
                      <div>
                        <h4 style={{ 
                          color: '#754A2D',
                          fontSize: '1rem',
                          fontWeight: '600',
                          marginBottom: '5px'
                        }}>{item.title}</h4>
                        <p style={{ 
                          color: '#555',
                          fontSize: '0.9rem',
                          lineHeight: '1.5'
                        }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Solutions Column */}
              <div style={{ 
                backgroundColor: '#9E6E3C',
                padding: '20px',
                borderRadius: '16px',
                width: '48%',
                minWidth: '300px',
                color: '#F2F0E6'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  <img 
                    src="https://img.icons8.com/ios-filled/100/FFFFFF/artificial-intelligence.png" 
                    alt="Solutions" 
                    style={{ width: '40px' }}
                  />
                  <h3 style={{ 
                    fontSize: '1.2rem',
                    fontWeight: '700',
                    margin: 0
                  }}>BIG Score Solutions</h3>
                </div>
                
                <div style={{ display: 'grid', gap: '15px' }}>
                  {[
                    {
                      icon: '✅',
                      title: "AI-Driven Objectivity",
                      desc: "Removes bias. Uses consistent, validated metrics."
                    },
                    {
                      icon: '✅',
                      title: "Live Score Tracking",
                      desc: "See performance evolve over time — not just once."
                    },
                    {
                      icon: '✅',
                      title: "Transparent Weightings",
                      desc: "Know what matters. Know what to improve."
                    },
                    {
                      icon: '✅',
                      title: "Automated Verification",
                      desc: "Fast, consistent, and auditable vetting process."
                    }
                  ].map((item, index) => (
                    <div key={index} style={{ 
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '15px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px'
                    }}>
                      <span style={{ 
                        color: '#F2F0E6', 
                        fontSize: '1.2rem',
                        marginTop: '2px'
                      }}>{item.icon}</span>
                      <div>
                        <h4 style={{ 
                          fontSize: '1rem',
                          fontWeight: '600',
                          marginBottom: '5px'
                        }}>{item.title}</h4>
                        <p style={{ 
                          fontSize: '0.9rem',
                          lineHeight: '1.5'
                        }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Get Your BIG Score Today */}
          <div style={{ 
            backgroundColor: '#754A2D',
            padding: '60px 40px',
            borderRadius: '20px',
            textAlign: 'center',
            color: '#F2F0E6',
            boxShadow: '0 15px 40px rgba(117, 74, 45, 0.3)',
            marginBottom: '40px',
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(158, 110, 60, 0.8) 0%, rgba(117, 74, 45, 0.9) 100%)'
          }}>
            <h2 style={{ 
              fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
              fontWeight: '800',
              marginBottom: '20px'
            }}>Get Your BIG Score Today</h2>
            
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
              marginBottom: '40px',
              flexWrap: 'wrap'
            }}>
              {[
                { 
                  number: 1, 
                  title: "Onboard", 
                  desc: "Create your profile. Upload documents. Takes less than 10 minutes." 
                },
                { 
                  number: 2, 
                  title: "Evaluate", 
                  desc: "Our AI + analyst engine calculates your BIG Score — instantly." 
                },
                { 
                  number: 3, 
                  title: "Improve", 
                  desc: "Get a personalized improvement plan to boost fundability." 
                },
                { 
                  number: 4, 
                  title: "Connect", 
                  desc: "Unlock funders, advisors, corporates, and programs aligned to your score." 
                }
              ].map((step, index) => (
                <div key={index} style={{
                  width: '22%',
                  minWidth: '200px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: '#F2F0E6',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 15px',
                    color: '#754A2D',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
                  }}>
                    {step.number}
                  </div>
                  <h3 style={{ 
                    fontWeight: '700',
                    fontSize: '1.1rem',
                    marginBottom: '10px'
                  }}>{step.title}</h3>
                  <p style={{ 
                    fontSize: '0.95rem',
                    lineHeight: '1.5'
                  }}>{step.desc}</p>
                </div>
              ))}
            </div>
            
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
              marginBottom: '20px',
              flexWrap: 'wrap'
            }}>
              <button 
                onClick={() => navigate('/LoginRegister')}
                style={{ 
                  backgroundColor: '#372C27',
                  color: 'white',
                  border: 'none',
                  padding: '15px 40px',
                  borderRadius: '30px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#1E1915';
                  e.target.style.transform = 'translateY(-3px)';
                  e.target.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#372C27';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
                }}
              >
                Get Started Now
              </button>
              <button style={{ 
                backgroundColor: '#F2F0E6',
                color: '#372C27',
                border: 'none',
                padding: '15px 40px',
                borderRadius: '30px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#E0D8C8';
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#F2F0E6';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
              }}
              >
                See Sample Report
              </button>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>

      {/* Popup Modal */}
      {showPopup && popupContent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(55, 44, 39, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            width: '90%',
            maxWidth: popupMode === 'calculation' ? '1000px' : '800px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '40px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            position: 'relative',
            animation: 'fadeInUp 0.5s ease-out'
          }}>
            <button 
              onClick={closePopup}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#9E6E3C',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'rotate(90deg)';
                e.target.style.color = '#754A2D';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'rotate(0)';
                e.target.style.color = '#9E6E3C';
              }}
            >
              ×
            </button>
            
            <h2 style={{ 
              color: '#754A2D',
              fontSize: '1.8rem',
              fontWeight: '700',
              marginBottom: '10px'
            }}>
              {popupContent.scoreTitle} - {popupContent.title}
            </h2>
            
            <p style={{ 
              fontSize: '1.1rem',
              lineHeight: '1.8',
              marginBottom: '30px',
              color: '#555'
            }}>
              {popupContent.detailedDescription}
            </p>
            
            {popupMode === 'calculation' && popupContent.subComponents ? (
              <div>
                <h3 style={{ 
                  color: '#9E6E3C',
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  marginBottom: '20px'
                }}>
                  Component Details
                </h3>
                
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '20px',
                  marginBottom: '30px'
                }}>
                  {popupContent.subComponents.map((component, index) => (
                    <div key={index} style={{
                      backgroundColor: '#F9F9F9',
                      borderRadius: '12px',
                      padding: '20px',
                      borderLeft: '4px solid #9E6E3C'
                    }}>
                      <h4 style={{ 
                        color: '#754A2D',
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        marginBottom: '10px'
                      }}>
                        {component.title}
                      </h4>
                      <p style={{ 
                        color: '#555',
                        marginBottom: '15px',
                        fontSize: '0.95rem'
                      }}>
                        {component.description}
                      </p>
                      
                      <div style={{ 
                        backgroundColor: '#F2F0E6',
                        padding: '15px',
                        borderRadius: '8px'
                      }}>
                        <div style={{ 
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '8px'
                        }}>
                          <span style={{ fontWeight: '600' }}>Early Stage:</span>
                          <span>{component.weightings.seed.value}</span>
                        </div>
                        <div style={{ 
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '8px'
                        }}>
                          <span style={{ fontWeight: '600' }}>Growth Stage:</span>
                          <span>{component.weightings.growth.value}</span>
                        </div>
                        <div style={{ 
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}>
                          <span style={{ fontWeight: '600' }}>Mature Stage:</span>
                          <span>{component.weightings.maturity.value}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Score Interpretation Section for Leadership, Governance, and Capital Appeal */}
                {(popupContent.title === "Leadership Score" || popupContent.title === "Governance Score" || popupContent.title === "Capital Appeal Score") && popupContent.scoreInterpretation && (
                  <div style={{ 
                    backgroundColor: '#F2F0E6',
                    padding: '25px',
                    borderRadius: '12px',
                    marginBottom: '30px'
                  }}>
                    <h3 style={{ 
                      color: '#754A2D',
                      fontSize: '1.3rem',
                      fontWeight: '600',
                      marginBottom: '15px'
                    }}>
                      Score Interpretation
                    </h3>
                    <div style={{ 
                      overflowX: 'auto'
                    }}>
                      <table style={{ 
                        width: '100%',
                        borderCollapse: 'collapse',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                      }}>
                        <thead>
                          <tr style={{ 
                            backgroundColor: '#9E6E3C',
                            color: 'white'
                          }}>
                            <th style={{ padding: '12px 15px', textAlign: 'left' }}>Score Range</th>
                            <th style={{ padding: '12px 15px', textAlign: 'left' }}>Level</th>
                            <th style={{ padding: '12px 15px', textAlign: 'left' }}>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {popupContent.scoreInterpretation.map((item, index) => (
                            <tr key={index} style={{ 
                              backgroundColor: index % 2 === 0 ? 'white' : '#F9F9F9'
                            }}>
                              <td style={{ 
                                padding: '12px 15px',
                                fontWeight: '500',
                                borderBottom: '1px solid #eee'
                              }}>
                                {item.range}
                              </td>
                              <td style={{ 
                                padding: '12px 15px',
                                fontWeight: '600',
                                borderBottom: '1px solid #eee'
                              }}>
                                {item.level}
                              </td>
                              <td style={{ 
                                padding: '12px 15px',
                                borderBottom: '1px solid #eee'
                              }}>
                                {item.description}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                <div style={{ 
                  backgroundColor: '#F2F0E6',
                  padding: '25px',
                  borderRadius: '12px',
                  marginBottom: '30px'
                }}>
                  <h3 style={{ 
                    color: '#754A2D',
                    fontSize: '1.3rem',
                    fontWeight: '600',
                    marginBottom: '15px'
                  }}>
                    Calculation Method
                  </h3>
                  <p style={{ 
                    fontSize: '1rem',
                    lineHeight: '1.7',
                    color: '#555'
                  }}>
                    {popupContent.calculationMethod}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ 
                    color: '#9E6E3C',
                    fontSize: '1.3rem',
                    fontWeight: '600',
                    marginBottom: '15px'
                  }}>
                    Scoring Criteria
                  </h3>
                  <div style={{ 
                    overflowX: 'auto',
                    marginBottom: '20px'
                  }}>
                    <table style={{ 
                      width: '100%',
                      borderCollapse: 'collapse',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                    }}>
                      <thead>
                        <tr style={{ 
                          backgroundColor: '#9E6E3C',
                          color: 'white'
                        }}>
                          <th style={{ padding: '12px 15px', textAlign: 'left' }}>Score</th>
                          <th style={{ padding: '12px 15px', textAlign: 'left' }}>Criteria</th>
                        </tr>
                      </thead>
                      <tbody>
                        {popupContent.rubric.map((item, index) => (
                          <tr key={index} style={{ 
                            backgroundColor: index % 2 === 0 ? 'white' : '#F9F9F9'
                          }}>
                            <td style={{ 
                              padding: '12px 15px',
                              fontWeight: '500',
                              borderBottom: '1px solid #eee'
                            }}>
                              {item.score}
                            </td>
                            <td style={{ 
                              padding: '12px 15px',
                              borderBottom: '1px solid #eee'
                            }}>
                              {item.criteria}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div style={{ 
                  backgroundColor: '#F2F0E6',
                  padding: '20px',
                  borderRadius: '12px',
                  marginBottom: '30px',
                  border: '1px solid #D3D2CE'
                }}>
                  <h3 style={{ 
                    color: '#754A2D',
                    fontSize: '1.3rem',
                    fontWeight: '600',
                    marginBottom: '15px'
                  }}>
                    Weightings by Business Stage
                  </h3>
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '15px'
                  }}>
                    <div style={{ 
                      backgroundColor: 'white',
                      padding: '20px',
                      borderRadius: '8px',
                      flex: '1',
                      minWidth: '150px',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                      borderLeft: '3px solid #9E6E3C'
                    }}>
                      <h4 style={{ 
                        color: '#9E6E3C',
                        fontWeight: '600',
                        marginBottom: '5px'
                      }}>Early Stage: {popupContent.weightings.seed.value}</h4>
                      <p style={{ fontSize: '0.9rem' }}>{popupContent.weightings.seed.description}</p>
                    </div>
                    <div style={{ 
                      backgroundColor: 'white',
                      padding: '20px',
                      borderRadius: '8px',
                      flex: '1',
                      minWidth: '150px',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                      borderLeft: '3px solid #754A2D'
                    }}>
                      <h4 style={{ 
                        color: '#754A2D',
                        fontWeight: '600',
                        marginBottom: '5px'
                      }}>Growth Stage: {popupContent.weightings.growth.value}</h4>
                      <p style={{ fontSize: '0.9rem' }}>{popupContent.weightings.growth.description}</p>
                    </div>
                    <div style={{ 
                      backgroundColor: 'white',
                      padding: '20px',
                      borderRadius: '8px',
                      flex: '1',
                      minWidth: '150px',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                      borderLeft: '3px solid #372C27'
                    }}>
                      <h4 style={{ 
                        color: '#372C27',
                        fontWeight: '600',
                        marginBottom: '5px'
                      }}>Mature Stage: {popupContent.weightings.maturity.value}</h4>
                      <p style={{ fontSize: '0.9rem' }}>{popupContent.weightings.maturity.description}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BIGScorePage;