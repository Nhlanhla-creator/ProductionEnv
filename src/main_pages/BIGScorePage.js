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
            seed: { value: "25%", description: "Focus on basic legal compliance" },
            growth: { value: "20%", description: "Expanded regulatory requirements" },
            maturity: { value: "20%", description: "Full compliance expected" }
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
            seed: { value: "30%", description: "Basic legitimacy checks" },
            growth: { value: "25%", description: "Expanded track record evaluation" },
            maturity: { value: "20%", description: "Comprehensive reputation analysis" }
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
          title: "Fundability Score",
          description: <p><span style={{ fontWeight: 'bold' , color:'#754A2D'}}>What it tells us</span>: Whether your business has the traction, financials, and narrative to attract and secure capital.</p>,
          image: "https://img.icons8.com/ios-filled/100/754A2D/money-bag.png",
          detailedDescription: "📊 This isn't about size — it's about investment readiness.",
          calculationMethod: "Financial statements are analyzed using machine learning models that compare your metrics with industry benchmarks. We assess growth trends, revenue models, and market potential.",
          weightings: {
            seed: { value: "40%", description: "Basic financial viability" },
            growth: { value: "45%", description: "Detailed financial analysis" },
            maturity: { value: "50%", description: "Comprehensive investment readiness" }
          },
          subComponents: [
            {
              title: "Leadership Strength",
              description: "Experience and diversity of leadership team",
              detailedDescription: "Evaluation of leadership experience, diversity, and coachability.",
              calculationMethod: "AI evaluation of uploaded leadership profiles",
              weightings: {
                seed: { value: "15%", description: "Founding team evaluation" },
                growth: { value: "10%", description: "Developing leadership" },
                maturity: { value: "5%", description: "Professional leadership" }
              }
            },
            {
              title: "Financial Readiness",
              description: "Accounting system, up-to-date books, tax compliance",
              detailedDescription: "Assessment of existence of accounting/ERP system, books being up-to-date and clean, and tax and VAT compliance results.",
              calculationMethod: "From company profile fields and AI evaluation of financial records",
              weightings: {
                seed: { value: "10%", description: "Basic systems" },
                growth: { value: "15%", description: "Established systems" },
                maturity: { value: "20%", description: "Professional systems" }
              }
            },
            {
              title: "Financial Strength",
              description: "Profitability and revenue growth",
              detailedDescription: "Evaluation of profitability and revenue growth trends.",
              calculationMethod: "AI evaluation of financial statements",
              weightings: {
                seed: { value: "5%", description: "Early metrics" },
                growth: { value: "10%", description: "Growing metrics" },
                maturity: { value: "15%", description: "Strong metrics" }
              }
            },
            {
              title: "Operational Strength",
              description: "Operating model clarity and strength",
              detailedDescription: "Assessment of operational strength and operating model clarity.",
              calculationMethod: "AI evaluation of operating model documents",
              weightings: {
                seed: { value: "15%", description: "Basic model" },
                growth: { value: "15%", description: "Developing model" },
                maturity: { value: "10%", description: "Mature model" }
              }
            },
            {
              title: "Pitch and Business Plan",
              description: "Problem clarity, solution fit, market analysis, competitive landscape",
              detailedDescription: "Evaluation of problem clarity, solution fit, market analysis (TAM, SAM), competitive landscape and advantage, revenue streams, financial projections, traction, MVP maturity, and investor IRR potential.",
              calculationMethod: "AI evaluation of uploaded pitch deck and business plan",
              weightings: {
                seed: { value: "20%", description: "Early stage focus" },
                growth: { value: "15%", description: "Growth stage focus" },
                maturity: { value: "10%", description: "Mature stage focus" }
              },
              items: [
                { name: "Problem Clarity", weight: "3% (Seed), 2% (Growth), 1% (Maturity)" },
                { name: "Solution Fit", weight: "3% (Seed), 2% (Growth), 1% (Maturity)" },
                { name: "Market Analysis", weight: "2% (Seed), 2% (Growth), 1% (Maturity)" },
                { name: "Competitive Landscape", weight: "2% (Seed), 2% (Growth), 1% (Maturity)" },
                { name: "Revenue Streams", weight: "2% (Seed), 2% (Growth), 1% (Maturity)" },
                { name: "Financial Projections", weight: "2% (Seed), 2% (Growth), 2% (Maturity)" },
                { name: "Traction", weight: "2% (Seed), 1% (Growth), 1% (Maturity)" },
                { name: "MVP Maturity", weight: "3% (Seed), 1% (Growth), 1% (Maturity)" },
                { name: "Investor IRR", weight: "1% (Seed), 1% (Growth), 1% (Maturity)" }
              ]
            },
            {
              title: "Guarantees",
              description: "Forward contracts, payment guarantees, government support",
              detailedDescription: "Evaluation of forward contracts (revenue guarantees), payment of credit guarantees, government or institutional support, asset-backed guarantees, export credit or trade insurance cover, factoring or receivables finance agreements, and personal or third-party guarantees.",
              calculationMethod: "AI evaluation of uploaded contracts and guarantee documents",
              weightings: {
                seed: { value: "10%", description: "Limited guarantees" },
                growth: { value: "15%", description: "Some guarantees" },
                maturity: { value: "20%", description: "Strong guarantees" }
              }
            },
            {
              title: "Impact Proof",
              description: "Job creation, HDG impact, environmental responsibility",
              detailedDescription: "Assessment of job creation (number and quality), HDG impact (youth, women, disability inclusion), environmental responsibility (waste management, emissions, sustainability), CSR/CSI investment, and local value creation.",
              calculationMethod: "Analysis of uploaded impact documentation",
              weightings: {
                seed: { value: "10%", description: "Early impact" },
                growth: { value: "10%", description: "Growing impact" },
                maturity: { value: "10%", description: "Mature impact" }
              }
            },
            {
              title: "Governance",
              description: "Decision-making clarity, policies, conflict resolution",
              detailedDescription: "Evaluation of decision-making clarity, policies & controls, conflict resolution / ethics, and separation of duties.",
              calculationMethod: "AI evaluation of governance documents",
              weightings: {
                seed: { value: "15%", description: "Basic governance" },
                growth: { value: "10%", description: "Developing governance" },
                maturity: { value: "10%", description: "Mature governance" }
              }
            }
          ]
        },
        {
          title: "PIS Score (Public Interest Score)",
          description: <p><span style={{ fontWeight: 'bold' , color:'#754A2D'}}>What it tells us</span>: How well-governed and structured your business is for long-term scale — even if you're early-stage.</p>,
          image: "https://img.icons8.com/ios-filled/100/754A2D/conference-call.png",
          detailedDescription: "🏗  This score tracks your journey from founder-led to board-ready...                                                                                              This score reflects how visible and accountable your business is to regulators, investors, and stakeholders. It's a measure of your companys's size, complexity, and impact-helping you understand when to scale from informal governance to a more insitutional structure. As your PIS increases, your governance needs evolve. A higher PIS signals when it's time to move from relying on advisors to building a formal board of directors and parnters trust your business is ready for growth.",
          calculationMethod: "We assess team qualifications, governance structures, and sustainability practices. Our algorithms quantify both direct and indirect governance metrics.",
          weightings: {
            seed: { value: "5%", description: "Basic governance evaluation" },
            growth: { value: "10%", description: "Expanded governance measurement" },
            maturity: { value: "10%", description: "Comprehensive governance assessment" }
          },
          subComponents: [
            {
              title: "Board Existence",
              description: "Presence of external advisors providing strategic input",
              detailedDescription: "Evaluation of whether the business has external advisors providing strategic input.",
              calculationMethod: "Review of advisor bios, org chart, and strategic meeting notes",
              weightings: {
                seed: { value: "40%", description: "Basic advisory" },
                growth: { value: "15%", description: "Developing advisory" },
                maturity: { value: "5%", description: "Mature advisory" }
              }
            },
            {
              title: "Board Existence & Composition",
              description: "Existence and structure of board of directors",
              detailedDescription: "Assessment of whether the business has a board of directors and its structure.",
              calculationMethod: "Review of org chart, board charter, and minutes",
              weightings: {
                seed: { value: "0%", description: "Basic board" },
                growth: { value: "30%", description: "Developing board" },
                maturity: { value: "30%", description: "Mature board" }
              }
            },
            {
              title: "Board Committees",
              description: "Oversight through committees (Audit, Risk, Remuneration)",
              detailedDescription: "Evaluation of whether the business has board committees for key oversight functions.",
              calculationMethod: "Review of committee charters and meeting records",
              weightings: {
                seed: { value: "10%", description: "Basic committees" },
                growth: { value: "15%", description: "Developing committees" },
                maturity: { value: "25%", description: "Mature committees" }
              }
            },
            {
              title: "Ownership & Accountability",
              description: "Defined responsibilities, delegation, role clarity",
              detailedDescription: "Assessment of whether responsibilities are clearly defined with proper delegation and role clarity.",
              calculationMethod: "Review of RACI, DoA, and job descriptions",
              weightings: {
                seed: { value: "0%", description: "Basic structure" },
                growth: { value: "5%", description: "Developing structure" },
                maturity: { value: "20%", description: "Mature structure" }
              }
            },
            {
              title: "Transparency & Reporting",
              description: "Reporting to stakeholders, performance review, compliance",
              detailedDescription: "Evaluation of reporting to stakeholders, performance review processes, and compliance reporting.",
              calculationMethod: "Review of board packs, impact reports, and KPIs",
              weightings: {
                seed: { value: "30%", description: "Basic reporting" },
                growth: { value: "20%", description: "Developing reporting" },
                maturity: { value: "15%", description: "Mature reporting" }
              }
            },
            {
              title: "Policy Framework",
              description: "Focused on governance policies (not reporting) to avoid overlap.",
              detailedDescription: "Evaluation of reporting to stakeholders, performance review processes, and compliance reporting.",
              calculationMethod: "Review of board packs, impact reports, and KPIs",
              weightings: {
                seed: { value: "10%", description: "Basic reporting" },
                growth: { value: "10%", description: "Developing reporting" },
                maturity: { value: "10%", description: "Mature reporting" }
              }
            }
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
      "Fundability Score": "https://c0.wallpaperflare.com/preview/98/565/296/gosclf0t64k3vi9o2podgkh1ev.jpg",
      "PIS Score (Public Interest Score)": "https://media.istockphoto.com/id/639198068/photo/business-people-finding-solution-together-at-office.jpg?s=612x612&w=0&k=20&c=apxfQgMQ4KfWvTxdtyefbxIRiK0DVk7lFr4GbGSniR8="
    };

    // Extract the short name for the button text
    const getShortName = (title) => {
      if (title.includes("Compliance")) return "Compliance";
      if (title.includes("Legitimacy")) return "Legitimacy";
      if (title.includes("Fundability")) return "Fundability";
      if (title.includes("PIS")) return "PIS";
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
        transition: 'all 0.3s ease',
        ':hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 12px 35px rgba(117, 74, 45, 0.15)'
        }
      }}>
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
              minWidth: '100px',
              ':hover': {
                backgroundColor: '#9E6E3C',
                color: 'white'
              }
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
              minWidth: '100px',
              ':hover': {
                backgroundColor: '#E0D8C8',
                borderColor: '#E0D8C8'
              }
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
                transition: 'all 0.3s ease',
                ':hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                  backgroundColor: '#754A2D'
                }
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
                  transition: 'transform 0.3s ease',
                  ':hover': {
                    transform: 'translateY(-5px)'
                  }
                }}>
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
              Our AI-powered framework scores every SME across <strong>four core dimensions</strong> — giving funders, partners, and programs a complete view of business readiness.
            </p>
            
            {/* Top Row - 2 Cards */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '30px',
              marginBottom: '30px'
            }}>
              {scoreData.bigScore.components.slice(0, 2).map((component, index) => (
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
              {scoreData.bigScore.components.slice(2, 4).map((component, index) => (
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
                  boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
                  ':hover': {
                    backgroundColor: '#1E1915',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
                  }
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
                boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                ':hover': {
                  backgroundColor: '#E0D8C8',
                  transform: 'translateY(-3px)',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
                }
              }}>
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
                transition: 'all 0.3s ease',
                ':hover': {
                  transform: 'rotate(90deg)',
                  color: '#754A2D'
                }
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
                            backgroundColor: index % 2 === 0 ? 'white' : '#F9F9F9',
                            transition: 'background-color 0.3s ease',
                            ':hover': {
                              backgroundColor: '#F2F0E6'
                            }
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