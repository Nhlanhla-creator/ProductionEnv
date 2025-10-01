import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HomeHeader from './SMEs/HomeHeader';
import Footer from './Footer';
import Sidebar from '../Investor/Sidebar/InvestorSidebar';
import { 
  FaArrowRight, FaUsers, FaUserTie, FaHandHoldingHeart,
  FaChartLine, FaGlobe, FaChevronRight, FaShieldAlt,
  FaLightbulb, FaHandshake, FaTimes, FaPaperPlane, FaCheck,
  FaComments, FaLightbulb as FaPromise, FaBullseye, FaChartBar,
  FaExclamationTriangle
} from 'react-icons/fa';
import { MdCorporateFare, MdTrendingUp } from 'react-icons/md';
import './LandingPage.css';
import { useNavigate } from 'react-router-dom';

const images = {
  pathway: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  africaMap: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  testimonial1: "https://randomuser.me/api/portraits/women/44.jpg",
  testimonial2: "https://randomuser.me/api/portraits/men/32.jpg",
  testimonial3: "https://randomuser.me/api/portraits/women/68.jpg",
  bigScore: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  heroBg: "https://www.shutterstock.com/image-photo/group-business-people-outlines-lit-600nw-2145032061.jpg"
};

const colors = {
  primary: '#754A2D',
  secondary: '#9E6E3C',
  dark: '#372C27',
  light: '#F2F0E6',
  neutral: '#D3D2CE',
  accent: '#BCAE9C',
  scoreBg: '#F8F4EF'
};

const DisclaimerModal = ({ onClose, navigate }) => {
  const handleUnderstand = () => {
    onClose();
    navigate('/LoginRegister?mode=register');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        maxWidth: '600px',
        width: '90%',
        boxShadow: '0 5px 20px rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: colors.dark
          }}
        >
          <FaTimes />
        </button>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <FaExclamationTriangle 
            size={32} 
            color={colors.secondary} 
            style={{ marginRight: '15px' }}
          />
          <h2 style={{
            fontSize: '1.5rem',
            color: colors.primary,
            margin: 0
          }}>
            Important Notice
          </h2>
        </div>
        
        <div style={{
          backgroundColor: `${colors.light}80`,
          padding: '15px',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <p style={{
            margin: 0,
            fontSize: '0.95rem',
            lineHeight: '1.6',
            color: colors.dark
          }}>
            <strong>This is a meta-testing environment</strong> - The BIG Marketplace platform is currently in development and undergoing testing. 
            All features, content, and functionality are subject to change and not final. 
            Any data entered may not be retained in the final production version.
          </p>
        </div>
        
        <p style={{
          fontSize: '0.9rem',
          lineHeight: '1.6',
          color: colors.dark,
          marginBottom: '25px'
        }}>
          Your participation in this testing phase is greatly appreciated and will help us improve the platform. 
          Please report any issues or provide feedback through our official channels.
        </p>
        
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px'
        }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              color: colors.dark,
              border: `1px solid ${colors.dark}`,
              padding: '10px 25px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              ':hover': {
                backgroundColor: colors.neutral
              }
            }}
          >
            Close
          </button>
          <button
            onClick={handleUnderstand}
            style={{
              backgroundColor: colors.primary,
              color: 'white',
              border: 'none',
              padding: '10px 25px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              ':hover': {
                backgroundColor: colors.secondary
              }
            }}
          >
            I Understand & Continue to Register
          </button>
        </div>
      </div>
    </div>
  );
};

const HomePageInvestor = () => {
  const navigate = useNavigate();
  
  const [showScroll, setShowScroll] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! I'm BIG Marketplace assistant. How can I help you today?", sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [expandedAbout, setExpandedAbout] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerSeen, setDisclaimerSeen] = useState(false);

  const checkScrollTop = () => {
    if (!showScroll && window.pageYOffset > 400) {
      setShowScroll(true);
    } else if (showScroll && window.pageYOffset <= 400) {
      setShowScroll(false);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', checkScrollTop);
    return () => window.removeEventListener('scroll', checkScrollTop);
  }, []);

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;
    
    const userMessage = { text: inputValue, sender: 'user' };
    setMessages([...messages, userMessage]);
    setInputValue('');
    
    setTimeout(() => {
      const responses = [
        "That's a great question! Our platform connects SMSEs with investors and corporate partners.",
        "To get started, simply click on the 'Get Started' button and create your profile.",
        "The BIG Score evaluates businesses across financial health, market potential, management quality, and innovation.",
        "Our matching algorithm considers your business profile and needs to find the best partners for you.",
        "You can learn more by visiting our 'How It Works' pages for each user type."
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setMessages(prev => [...prev, { text: randomResponse, sender: 'bot' }]);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleGetStartedClick = () => {
    setShowDisclaimer(true);
  };

  const handleDisclaimerClose = () => {
    setShowDisclaimer(false);
    setDisclaimerSeen(true);
  };

  return (
    <div className="landing-page" style={{ 
      backgroundColor: colors.light,
      fontFamily: "'Poppins', sans-serif",
      overflowX: 'hidden',
      position: 'relative'
    }}>
      {showDisclaimer && <DisclaimerModal onClose={handleDisclaimerClose} navigate={navigate} />}
      
      <HomeHeader/>
      
      {/* Main Content Container */}
      <div style={{
        display: 'flex',
        minHeight: 'calc(100vh - 120px)'
      }}>
        {/* Sidebar - Takes 30% of screen */}
        <div style={{
          width: '10%',
          minWidth: '300px',
          backgroundColor: '#f5f5f5',
          borderRight: `1px solid ${colors.neutral}`,
          padding: '10px',
          position: 'sticky',
          top: '80px',
          height: 'calc(100vh - 80px)',
          overflowY: 'auto'
        }}>
          <Sidebar />
        </div>
        
        {/* Main Content - Takes 70% of screen */}
        <div style={{
          flex: 1,
          padding: '10px 9px',
          overflowY: 'auto'
        }}>
          {/* Hero Section */}
          <section style={{ 
            background: `linear-gradient(90deg, ${colors.dark} 0%, rgba(55, 44, 39, 0.7) 50%, rgba(55, 44, 39, 0.3) 100%), url(${images.heroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: '40px 20px',
            textAlign: 'left',
            color: colors.light,
            position: 'relative',
            minHeight: '400px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            marginBottom: '50px'
          }}>
  {/* Disclaimer Box in Bottom Corner of Hero Section */}
<div style={{
  position: 'absolute',
  bottom: '110px',
  right: '5px',
  backgroundColor: 'rgba(255, 0, 0, 0.9)', // Changed to red with 90% opacity
  padding: '10px 15px',
  borderRadius: '6px',
  maxWidth: '250px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  borderLeft: `3px solid #ff4d4d` // Brighter red border
}}>
  <div style={{
    display: 'flex',
    alignItems: 'center',
    marginBottom: '5px'
  }}>
    <FaExclamationTriangle style={{ 
      color: 'white', // Changed to white for better contrast
      marginRight: '8px',
      fontSize: '1rem'
    }} />
    <span style={{
      color: 'white', // Changed to white for better contrast
      fontSize: '0.9rem',
      fontWeight: '600'
    }}>
      Development Preview
    </span>
  </div>
  <p style={{
    margin: 0,
    color: 'white', // Changed to white for better contrast
    fontSize: '0.8rem',
    lineHeight: '1.3'
  }}>
    This is a testing environment. Features may change.
  </p>
</div>

            <div style={{ 
              maxWidth: '800px',
              margin: '0 auto',
              width: '100%'
            }}>
              <h1 style={{ 
                fontSize: '2.5rem',
                fontWeight: '800',
                lineHeight: '1.2',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                marginBottom: '20px'
              }}>
                <span style={{ color: colors.secondary }}>BIG</span> on ideas. <span style={{ color: colors.secondary }}>BIG</span> on growth. <span style={{ color: colors.secondary }}>BIG</span> on impact.
              </h1>
              
              <p style={{ 
                fontSize: '1.2rem',
                margin: '0 0 20px 0',
                opacity: 0.9
              }}>
                Holistic solutions designed to propel high-impact enterprises forward — because scaling success requires strategy, insight, and the right partnerships.
              </p>
              <p style={{ 
                fontSize: '1rem',
                margin: '0 0 25px 0',
                fontWeight: '500'
              }}>
                We're closing the Small, Medium, and Social Enterprises (SMSEs) funding gap in Africa — with the tools, trust, and pathways to grow your business.
              </p>
              <p style={{
                fontSize: '0.9rem',
                fontStyle: 'italic',
                marginBottom: '25px'
              }}>
                Trusted by 500+ SMSEs and 50+ funders across Africa
              </p>
              <div style={{ 
                display: 'flex',
                gap: '15px',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={handleGetStartedClick}
                  style={{
                    backgroundColor: colors.secondary,
                    color: colors.light,
                    padding: '12px 30px',
                    borderRadius: '50px',
                    fontWeight: '700',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                    border: 'none',
                    cursor: 'pointer',
                    ':hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
                    }
                  }}
                >
                  Get Started
                </button>
                <Link to="/HowItWorks" style={{
                  backgroundColor: 'transparent',
                  color: colors.light,
                  border: `2px solid ${colors.secondary}`,
                  padding: '12px 30px',
                  borderRadius: '50px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  ':hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}>
                  See Demo
                </Link>
              </div>
            </div>
          </section>

          {/* Who Benefits Section */}
          <section style={{ 
            padding: '50px 0',
            position: 'relative',
            backgroundColor: colors.light
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '20px',
              background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
              clipPath: 'polygon(0 0, 100% 0, 100% 70%, 0 100%)'
            }}></div>
            
            <div>
              <h2 style={{ 
                textAlign: 'center',
                fontSize: '2.2rem',
                fontWeight: '700',
                marginBottom: '50px',
                color: colors.dark
              }}>
                Who benefits from <span style={{ color: colors.primary }}>BIG</span>?
              </h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '25px'
              }}>
                {/* SMSEs Card */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '25px',
                  textAlign: 'center',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
                  borderTop: `4px solid ${colors.primary}`,
                  transition: 'transform 0.3s ease',
                  ':hover': {
                    transform: 'translateY(-5px)'
                  }
                }}>
                  <div style={{
                    backgroundColor: `${colors.primary}10`,
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 15px',
                    border: `2px solid ${colors.primary}`
                  }}>
                    <FaUsers size={24} color={colors.primary} />
                  </div>
                  <h3 style={{ 
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    marginBottom: '12px',
                    color: colors.dark
                  }}>SMSEs</h3>
                  <p style={{ 
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: colors.primary,
                    marginBottom: '12px'
                  }}>Get visibility. Get scored. Get matched.</p>
                  <p style={{
                    fontSize: '0.85rem',
                    color: colors.dark,
                    marginBottom: '15px'
                  }}>
                    Small, Medium and Social Enterprises gain access to funding, partnerships, and growth opportunities through our platform.
                  </p>
                  
                  <div style={{ textAlign: 'left', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <FaCheck style={{ color: colors.primary, marginRight: '8px', flexShrink: 0, marginTop: '3px' }} />
                      <span style={{ fontSize: '0.8rem' }}>Access to verified investors and funders</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <FaCheck style={{ color: colors.primary, marginRight: '8px', flexShrink: 0, marginTop: '3px' }} />
                      <span style={{ fontSize: '0.8rem' }}>Comprehensive BIG Score assessment</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <FaCheck style={{ color: colors.primary, marginRight: '8px', flexShrink: 0, marginTop: '3px' }} />
                      <span style={{ fontSize: '0.8rem' }}>Matching with corporate partners</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <FaCheck style={{ color: colors.primary, marginRight: '8px', flexShrink: 0, marginTop: '3px' }} />
                      <span style={{ fontSize: '0.8rem' }}>Guidance to improve your score</span>
                    </div>
                  </div>
                  
                  <Link to="/HowItWorksSMEs" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    color: colors.primary,
                    fontWeight: '600',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                    marginBottom: '12px',
                    fontSize: '0.8rem'
                  }}>
                    How it works <FaChevronRight style={{ marginLeft: '5px' }} />
                  </Link>
                  <button
                    onClick={handleGetStartedClick}
                    style={{
                      backgroundColor: colors.primary,
                      color: colors.light,
                      padding: '8px 20px',
                      borderRadius: '50px',
                      fontWeight: '600',
                      textDecoration: 'none',
                      display: 'inline-block',
                      transition: 'all 0.3s ease',
                      fontSize: '0.8rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Get Started
                  </button>
                </div>

                {/* Investors Card */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '25px',
                  textAlign: 'center',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
                  borderTop: `4px solid ${colors.secondary}`,
                  transition: 'transform 0.3s ease',
                  ':hover': {
                    transform: 'translateY(-5px)'
                  }
                }}>
                  <div style={{
                    backgroundColor: `${colors.secondary}10`,
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 15px',
                    border: `2px solid ${colors.secondary}`
                  }}>
                    <FaUserTie size={24} color={colors.secondary} />
                  </div>
                  <h3 style={{ 
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    marginBottom: '12px',
                    color: colors.dark
                  }}>Investors</h3>
                  <p style={{ 
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: colors.secondary,
                    marginBottom: '12px'
                  }}>Discover. Verify. Invest.</p>
                  <p style={{
                    fontSize: '0.85rem',
                    color: colors.dark,
                    marginBottom: '15px'
                  }}>
                    Investors gain access to pre-vetted, investment-ready SMSEs with verified compliance and growth potential.
                  </p>
                  
                  <div style={{ textAlign: 'left', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <FaCheck style={{ color: colors.secondary, marginRight: '8px', flexShrink: 0, marginTop: '3px' }} />
                      <span style={{ fontSize: '0.8rem' }}>Access to pre-screened SMSEs</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <FaCheck style={{ color: colors.secondary, marginRight: '8px', flexShrink: 0, marginTop: '3px' }} />
                      <span style={{ fontSize: '0.8rem' }}>Comprehensive BIG Score insights</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <FaCheck style={{ color: colors.secondary, marginRight: '8px', flexShrink: 0, marginTop: '3px' }} />
                      <span style={{ fontSize: '0.8rem' }}>Reduced due diligence costs</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <FaCheck style={{ color: colors.secondary, marginRight: '8px', flexShrink: 0, marginTop: '3px' }} />
                      <span style={{ fontSize: '0.8rem' }}>Impact measurement tools</span>
                    </div>
                  </div>
                  
                  <Link to="/HowItWorksInvestors" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    color: colors.secondary,
                    fontWeight: '600',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                    marginBottom: '12px',
                    fontSize: '0.8rem'
                  }}>
                    How it works <FaChevronRight style={{ marginLeft: '5px' }} />
                  </Link>
                  <button
                    onClick={handleGetStartedClick}
                    style={{
                      backgroundColor: colors.secondary,
                      color: colors.light,
                      padding: '8px 20px',
                      borderRadius: '50px',
                      fontWeight: '600',
                      textDecoration: 'none',
                      display: 'inline-block',
                      transition: 'all 0.3s ease',
                      fontSize: '0.8rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Get Started
                  </button>
                </div>

                {/* Corporates Card */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '25px',
                  textAlign: 'center',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
                  borderTop: `4px solid ${colors.dark}`,
                  transition: 'transform 0.3s ease',
                  ':hover': {
                    transform: 'translateY(-5px)'
                  }
                }}>
                  <div style={{
                    backgroundColor: `${colors.dark}10`,
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 15px',
                    border: `2px solid ${colors.dark}`
                  }}>
                    <MdCorporateFare size={24} color={colors.dark} />
                  </div>
                  <h3 style={{ 
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    marginBottom: '12px',
                    color: colors.dark
                  }}>Corporates</h3>
                  <p style={{ 
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: colors.dark,
                    marginBottom: '12px'
                  }}>Source. Partner. Amplify impact.</p>
                  <p style={{
                    fontSize: '0.85rem',
                    color: colors.dark,
                    marginBottom: '15px'
                  }}>
                    Corporates can identify and partner with SMSEs that align with their ESD, CSI and supply chain objectives.
                  </p>
                  
                  <div style={{ textAlign: 'left', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <FaCheck style={{ color: colors.dark, marginRight: '8px', flexShrink: 0, marginTop: '3px' }} />
                      <span style={{ fontSize: '0.8rem' }}>Verified SMSEs for ESD/CSI programs</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <FaCheck style={{ color: colors.dark, marginRight: '8px', flexShrink: 0, marginTop: '3px' }} />
                      <span style={{ fontSize: '0.8rem' }}>Supply chain diversification</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <FaCheck style={{ color: colors.dark, marginRight: '8px', flexShrink: 0, marginTop: '3px' }} />
                      <span style={{ fontSize: '0.8rem' }}>Impact measurement and reporting</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <FaCheck style={{ color: colors.dark, marginRight: '8px', flexShrink: 0, marginTop: '3px' }} />
                      <span style={{ fontSize: '0.8rem' }}>Strategic partnership opportunities</span>
                    </div>
                  </div>
                  
                  <Link to="/HowItWorksCorporate" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    color: colors.dark,
                    fontWeight: '600',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                    marginBottom: '12px',
                    fontSize: '0.8rem'
                  }}>
                    How it works <FaChevronRight style={{ marginLeft: '5px' }} />
                  </Link>
                  <button
                    onClick={handleGetStartedClick}
                    style={{
                      backgroundColor: colors.dark,
                      color: colors.light,
                      padding: '8px 20px',
                      borderRadius: '50px',
                      fontWeight: '600',
                      textDecoration: 'none',
                      display: 'inline-block',
                      transition: 'all 0.3s ease',
                      fontSize: '0.8rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Get Started
                  </button>
                </div>

                {/* Support Partners Card */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '25px',
                  textAlign: 'center',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
                  borderTop: `4px solid ${colors.accent}`,
                  transition: 'transform 0.3s ease',
                  ':hover': {
                    transform: 'translateY(-5px)'
                  }
                }}>
                  <div style={{
                    backgroundColor: `${colors.accent}10`,
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 15px',
                    border: `2px solid ${colors.accent}`
                  }}>
                    <FaHandHoldingHeart size={24} color={colors.accent} />
                  </div>
                  <h3 style={{ 
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    marginBottom: '12px',
                    color: colors.dark
                  }}>Support Partners</h3>
                  <p style={{ 
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: colors.accent,
                    marginBottom: '12px'
                  }}>Identify. Nurture. Track.</p>
                  <p style={{
                    fontSize: '0.85rem',
                    color: colors.dark,
                    marginBottom: '15px'
                  }}>
                    Incubators, accelerators and development agencies can enhance their programs with our tools and network.
                  </p>
                  
                  <div style={{ textAlign: 'left', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <FaCheck style={{ color: colors.accent, marginRight: '8px', flexShrink: 0, marginTop: '3px' }} />
                      <span style={{ fontSize: '0.8rem' }}>Enhanced program effectiveness</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <FaCheck style={{ color: colors.accent, marginRight: '8px', flexShrink: 0, marginTop: '3px' }} />
                      <span style={{ fontSize: '0.8rem' }}>Access to funding opportunities</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <FaCheck style={{ color: colors.accent, marginRight: '8px', flexShrink: 0, marginTop: '3px' }} />
                      <span style={{ fontSize: '0.8rem' }}>Graduate tracking and impact measurement</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <FaCheck style={{ color: colors.accent, marginRight: '8px', flexShrink: 0, marginTop: '3px' }} />
                      <span style={{ fontSize: '0.8rem' }}>Partnership opportunities</span>
                    </div>
                  </div>
                  
                  <Link to="/HowItWorksAccelerators" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    color: colors.accent,
                    fontWeight: '600',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                    marginBottom: '12px',
                    fontSize: '0.8rem'
                  }}>
                    How it works <FaChevronRight style={{ marginLeft: '5px' }} />
                  </Link>
                  <button
                    onClick={handleGetStartedClick}
                    style={{
                      backgroundColor: colors.accent,
                      color: colors.dark,
                      padding: '8px 20px',
                      borderRadius: '50px',
                      fontWeight: '600',
                      textDecoration: 'none',
                      display: 'inline-block',
                      transition: 'all 0.3s ease',
                      fontSize: '0.8rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>

            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '20px',
              background: `linear-gradient(to right, ${colors.accent}, ${colors.neutral})`,
              clipPath: 'polygon(0 30%, 100% 0, 100% 100%, 0 100%)'
            }}></div>
          </section>

          {/* What is BIG Marketplace Section */}
          <section style={{ 
            padding: '50px 0',
            position: 'relative',
            background: `linear-gradient(135deg, ${colors.neutral} 0%, ${colors.light} 100%)`
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '20px',
              background: `linear-gradient(to right, ${colors.secondary}, ${colors.primary})`,
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 70%)'
            }}></div>
            
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '40px',
                alignItems: 'center'
              }}>
                <div>
                  <h2 style={{ 
                    fontSize: '2.2rem',
                    fontWeight: '700',
                    marginBottom: '15px',
                    color: colors.dark
                  }}>
                    What is <span style={{ color: colors.primary }}>BIG</span> Marketplace?
                  </h2>
                  <p style={{ 
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    marginBottom: '15px',
                    color: colors.primary
                  }}>
                    The trust layer for business in Africa.
                  </p>
                  <p style={{ 
                    fontSize: '1.1rem',
                    marginBottom: '25px',
                    color: colors.dark
                  }}>
                    One profile. One score. Many doors.
                  </p>
                  
                  <div style={{ marginBottom: '25px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                      <FaCheck style={{ color: colors.primary, marginRight: '10px' }} />
                      <span style={{ color: colors.dark }}>Get matched to funders, services, and impact opportunities.</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                      <FaCheck style={{ color: colors.primary, marginRight: '10px' }} />
                      <span style={{ color: colors.dark }}>Track your BIG Score and see exactly what's missing.</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                      <FaCheck style={{ color: colors.primary, marginRight: '10px' }} />
                      <span style={{ color: colors.dark }}>Grow your credibility with verified compliance.</span>
                    </div>
                  </div>
                  
                  <p style={{ 
                    fontSize: '1rem',
                    marginBottom: '25px',
                    color: colors.dark
                  }}>
                    Whether you're an entrepreneur, investor, or corporate champion — BIG connects you to who (and what) you need to grow.
                  </p>
                  
                  {!expandedAbout && (
                    <button 
                      onClick={() => setExpandedAbout(true)}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: colors.primary,
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontSize: '0.9rem'
                      }}
                    >
                      Learn more <FaChevronRight style={{ marginLeft: '5px' }} />
                    </button>
                  )}
                  
                  {expandedAbout && (
                    <div style={{ 
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      padding: '15px',
                      borderRadius: '8px',
                      marginBottom: '15px'
                    }}>
                      <p style={{ 
                        fontSize: '0.9rem',
                        lineHeight: '1.6',
                        color: colors.dark,
                        marginBottom: '12px'
                      }}>
                        BIG Marketplace was founded to solve one problem: Africa's SMEs lack trust, not potential. We combine data, partnerships, and technology to create a fair, transparent ecosystem where:
                      </p>
                      <ul style={{ 
                        listStyleType: 'disc',
                        paddingLeft: '20px',
                        marginBottom: '12px'
                      }}>
                        <li style={{ marginBottom: '6px' }}>SMSEs prove their credibility.</li>
                        <li style={{ marginBottom: '6px' }}>Funders find verified opportunities.</li>
                        <li>Corporates maximize impact.</li>
                      </ul>
                    </div>
                  )}
                </div>
                
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '15px',
                  boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
                  textAlign: 'center'
                }}>
                  <img 
                    src={images.bigScore} 
                    alt="BIG Marketplace Ecosystem" 
                    style={{ 
                      width: '100%',
                      height: 'auto',
                      borderRadius: '4px'
                    }} 
                  />
                  <p style={{ 
                    fontSize: '0.8rem',
                    color: colors.dark,
                    marginTop: '10px',
                    fontStyle: 'italic'
                  }}>
                    The BIG Marketplace ecosystem connects SMSEs with funders, support partners, and customers.
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '20px',
              background: `linear-gradient(to right, ${colors.dark}, ${colors.accent})`,
              clipPath: 'polygon(0 0, 100% 30%, 100% 100%, 0 100%)'
            }}></div>
          </section>

          {/* BIG Score Section */}
          <section style={{ 
            padding: '60px 0',
            position: 'relative',
            backgroundColor: colors.scoreBg,
            backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(188, 174, 156, 0.1) 0%, rgba(188, 174, 156, 0.05) 90%)'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '20px',
              background: `linear-gradient(to right, ${colors.accent}, ${colors.neutral})`,
              clipPath: 'polygon(0 0, 100% 0, 100% 70%, 0 100%)'
            }}></div>
            
            <div>
              <div style={{
                textAlign: 'center',
                marginBottom: '40px'
              }}>
                <h2 style={{ 
                  fontSize: '2.2rem',
                  fontWeight: '700',
                  marginBottom: '15px',
                  color: colors.dark
                }}>
                  Introducing the <span style={{ color: colors.primary }}>BIG</span> Score
                </h2>
                <p style={{ 
                  fontSize: '1rem',
                  color: colors.dark,
                  maxWidth: '800px',
                  margin: '0 auto'
                }}>
                  A comprehensive assessment that evaluates your business across multiple dimensions
                </p>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '30px',
                marginBottom: '30px'
              }}>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '25px',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
                  borderTop: `4px solid ${colors.primary}`,
                  textAlign: 'center'
                }}>
                  <div style={{
                    backgroundColor: `${colors.primary}20`,
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 15px',
                    border: `2px solid ${colors.primary}`
                  }}>
                    <FaChartBar size={24} color={colors.primary} />
                  </div>
                  <h3 style={{ 
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    marginBottom: '12px',
                    color: colors.dark
                  }}>How it works</h3>
                  <p style={{ 
                    fontSize: '0.9rem',
                    color: colors.dark,
                    marginBottom: '15px'
                  }}>
                    Our proprietary BIG Score evaluates your financial health, operational maturity, compliance status, and growth potential.
                  </p>
                  <ul style={{ 
                    listStyleType: 'none',
                    padding: 0,
                    margin: '0 0 15px 0',
                    textAlign: 'left'
                  }}>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'flex-start' }}>
                      <FaCheck style={{ color: colors.primary, marginRight: '8px', flexShrink: 0, marginTop: '3px' }} />
                      <span style={{ fontSize: '0.85rem' }}>Financial health: Revenue trends, profitability</span>
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'flex-start' }}>
                      <FaCheck style={{ color: colors.primary, marginRight: '8px', flexShrink: 0, marginTop: '3px' }} />
                      <span style={{ fontSize: '0.85rem' }}>Operational maturity: Systems, processes</span>
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'flex-start' }}>
                      <FaCheck style={{ color: colors.primary, marginRight: '8px', flexShrink: 0, marginTop: '3px' }} />
                      <span style={{ fontSize: '0.85rem' }}>Compliance status: Legal, regulatory</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <FaCheck style={{ color: colors.primary, marginRight: '8px', flexShrink: 0, marginTop: '3px' }} />
                      <span style={{ fontSize: '0.85rem' }}>Growth potential: Market opportunity</span>
                    </li>
                  </ul>
                </div>
                
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '25px',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
                  borderTop: `4px solid ${colors.secondary}`,
                  textAlign: 'center'
                }}>
                  <div style={{
                    backgroundColor: `${colors.secondary}20`,
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 15px',
                    border: `2px solid ${colors.secondary}`
                  }}>
                    <MdTrendingUp size={24} color={colors.secondary} />
                  </div>
                  <h3 style={{ 
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    marginBottom: '12px',
                    color: colors.dark
                  }}>What it unlocks</h3>
                  <p style={{ 
                    fontSize: '0.9rem',
                    color: colors.dark,
                    marginBottom: '15px'
                  }}>
                    Your BIG Score opens doors to opportunities matched to your business's current stage and potential.
                  </p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    marginBottom: '15px'
                  }}>
                    <div style={{
                      backgroundColor: `${colors.primary}10`,
                      padding: '10px',
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        color: colors.primary,
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}>
                        Funding
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: `${colors.secondary}10`,
                      padding: '10px',
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        color: colors.secondary,
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}>
                        Partnerships
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: `${colors.accent}10`,
                      padding: '10px',
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        color: colors.accent,
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}>
                        Compliance
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: `${colors.dark}10`,
                      padding: '10px',
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        color: colors.dark,
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}>
                        Guidance
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ 
                textAlign: 'center',
                marginTop: '20px'
              }}>
                <Link to="/bigscore" style={{
                  backgroundColor: colors.primary,
                  color: colors.light,
                  padding: '12px 30px',
                  borderRadius: '50px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  display: 'inline-block',
                  transition: 'all 0.3s ease'
                }}>
                  Learn more about BIG Score
                </Link>
              </div>
            </div>

            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '20px',
              background: `linear-gradient(to right, ${colors.secondary}, ${colors.primary})`,
              clipPath: 'polygon(0 30%, 100% 0, 100% 100%, 0 100%)'
            }}></div>
          </section>

          {/* Don't Qualify Section */}
          <section style={{ 
            padding: '50px 0',
            position: 'relative',
            backgroundColor: colors.light
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '20px',
              background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 70%)'
            }}></div>
            
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '40px',
                alignItems: 'center'
              }}>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '15px',
                  boxShadow: '0 5px 20px rgba(0,0,0,0.1)'
                }}>
                  <img 
                    src={images.pathway} 
                    alt="Pathway to Success" 
                    style={{ 
                      width: '100%',
                      height: 'auto'
                    }} 
                  />
                </div>
                
                <div>
                  <h2 style={{ 
                    fontSize: '2.2rem',
                    fontWeight: '700',
                    marginBottom: '15px',
                    color: colors.dark
                  }}>
                    Don't qualify yet? We've got you.
                  </h2>
                  <p style={{ 
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    marginBottom: '15px',
                    color: colors.primary
                  }}>
                    BIG doesn't shut doors — it shows you where to go.
                  </p>
                  <p style={{ 
                    fontSize: '1rem',
                    lineHeight: '1.6',
                    marginBottom: '15px',
                    color: colors.dark
                  }}>
                    If your score is low, we'll guide you to:
                  </p>
                  <ul style={{ 
                    listStyleType: 'disc',
                    paddingLeft: '20px',
                    marginBottom: '15px'
                  }}>
                    <li style={{ marginBottom: '6px' }}>Accelerators to refine your model.</li>
                    <li style={{ marginBottom: '6px' }}>Mentors to fix compliance gaps.</li>
                    <li style={{ marginBottom: '6px' }}>Incubators to prep for funding.</li>
                  </ul>
                  <p style={{ 
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: colors.primary,
                    marginBottom: '25px'
                  }}>
                    BIG is more than a marketplace. It's a pathway.
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '20px',
              background: `linear-gradient(to right, ${colors.accent}, ${colors.neutral})`,
              clipPath: 'polygon(0 0, 100% 30%, 100% 100%, 0 100%)'
            }}></div>
          </section>

          {/* Vision, Mission & Promise Section */}
          <section style={{ 
            padding: '50px 0',
            position: 'relative',
            background: `linear-gradient(135deg, ${colors.dark} 0%, ${colors.primary} 100%), url(${images.africaMap})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: colors.light
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '20px',
              background: `linear-gradient(to right, ${colors.secondary}, ${colors.accent})`,
              clipPath: 'polygon(0 0, 100% 0, 100% 70%, 0 100%)'
            }}></div>
            
            <div>
              <h2 style={{ 
                fontSize: '2.2rem',
                fontWeight: '700',
                marginBottom: '40px',
                textAlign: 'center'
              }}>
                Our <span style={{ color: colors.secondary }}>Purpose</span>
              </h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '25px',
                marginBottom: '30px'
              }}>
                {/* Vision */}
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  borderRadius: '8px',
                  padding: '25px',
                  textAlign: 'center',
                  boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
                  borderTop: `4px solid ${colors.primary}`
                }}>
                  <div style={{
                    backgroundColor: `${colors.primary}20`,
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 15px',
                    border: `2px solid ${colors.primary}`
                  }}>
                    <FaBullseye size={24} color={colors.primary} />
                  </div>
                  <h3 style={{ 
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    marginBottom: '12px',
                    color: colors.dark
                  }}>Our Vision</h3>
                  <p style={{ 
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    color: colors.dark
                  }}>
                    We believe SMEs are the backbone of Africa's economy — and deserve access, tools, and a seat at the table. BIG Marketplace is how we make that real.
                  </p>
                </div>
                
                {/* Mission */}
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  borderRadius: '8px',
                  padding: '25px',
                  textAlign: 'center',
                  boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
                  borderTop: `4px solid ${colors.secondary}`
                }}>
                  <div style={{
                    backgroundColor: `${colors.secondary}20`,
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 15px',
                    border: `2px solid ${colors.secondary}`
                  }}>
                    <FaHandshake size={24} color={colors.secondary} />
                  </div>
                  <h3 style={{ 
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    marginBottom: '12px',
                    color: colors.dark
                  }}>Our Mission</h3>
                  <p style={{ 
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    color: colors.dark
                  }}>
                    To close the $330B SME funding gap in Africa by making growth accessible, not accidental.
                  </p>
                </div>
                
                {/* Promise */}
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  borderRadius: '8px',
                  padding: '25px',
                  textAlign: 'center',
                  boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
                  borderTop: `4px solid ${colors.accent}`
                }}>
                  <div style={{
                    backgroundColor: `${colors.accent}20`,
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 15px',
                    border: `2px solid ${colors.accent}`
                  }}>
                    <FaPromise size={24} color={colors.accent} />
                  </div>
                  <h3 style={{ 
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    marginBottom: '12px',
                    color: colors.dark
                  }}>Our Promise</h3>
                  <p style={{ 
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    color: colors.dark
                  }}>
                    To build a continent-wide trust economy where every SME has a fair chance to grow and every investor finds quality opportunities.
                  </p>
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <p style={{ 
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  marginBottom: '25px',
                  color: colors.secondary
                }}>
                  We're building a continent-wide trust economy. Join us.
                </p>
                
                <button
                  onClick={handleGetStartedClick}
                  style={{
                    backgroundColor: colors.primary,
                    color: colors.light,
                    padding: '12px 30px',
                    borderRadius: '50px',
                    fontWeight: '700',
                    textDecoration: 'none',
                    display: 'inline-block',
                    transition: 'all 0.3s ease',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Get Started
                </button>
              </div>
            </div>

            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '20px',
              background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
              clipPath: 'polygon(0 30%, 100% 0, 100% 100%, 0 100%)'
            }}></div>
          </section>
        </div>
      </div>

      {/* Scroll to top button */}
      {showScroll && 
        <button onClick={scrollTop} style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          backgroundColor: colors.primary,
          color: 'white',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          zIndex: 100,
          transition: 'all 0.3s ease',
          ':hover': {
            transform: 'scale(1.1)'
          }
        }}>
          <FaArrowRight style={{ transform: 'rotate(-90deg)' }} />
        </button>
      }

      {/* Chatbot Button */}
      <button 
        onClick={() => setChatbotOpen(!chatbotOpen)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '100px',
          backgroundColor: colors.primary,
          color: 'white',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 5px 25px rgba(0,0,0,0.3)',
          zIndex: 100,
          transition: 'all 0.3s ease',
          ':hover': {
            transform: 'scale(1.1)'
          }
        }}
      >
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Robot Head Design */}
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: 'white',
            borderRadius: '50%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            {/* Eyes */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-around',
              width: '100%',
              marginBottom: '5px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: colors.primary,
                borderRadius: '50%'
              }}></div>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: colors.primary,
                borderRadius: '50%'
              }}></div>
            </div>
            {/* Mouth */}
            <div style={{
              width: '16px',
              height: '6px',
              backgroundColor: colors.primary,
              borderRadius: '0 0 8px 8px'
            }}></div>
          </div>
          <div style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            backgroundColor: colors.secondary,
            color: 'white',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
          }}>
            1
          </div>
        </div>
      </button>

      {/* Chatbot Window with Robot Head */}
      {chatbotOpen && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          right: '100px',
          width: '350px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          zIndex: 101,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transform: chatbotOpen ? 'translateY(0)' : 'translateY(20px)',
          opacity: chatbotOpen ? 1 : 0,
          transition: 'all 0.3s ease'
        }}>
          {/* Chatbot Header with Robot Head */}
          <div style={{
            backgroundColor: colors.primary,
            color: 'white',
            padding: '15px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {/* Robot Head Icon */}
              <div style={{
                marginRight: '10px',
                width: '30px',
                height: '30px',
                backgroundColor: 'white',
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                {/* Eyes */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  width: '100%',
                  marginBottom: '3px'
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: colors.primary,
                    borderRadius: '50%'
                  }}></div>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: colors.primary,
                    borderRadius: '50%'
                  }}></div>
                </div>
                {/* Mouth */}
                <div style={{
                  width: '12px',
                  height: '4px',
                  backgroundColor: colors.primary,
                  borderRadius: '0 0 6px 6px'
                }}></div>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                BIG Marketplace Assistant
              </h3>
            </div>
            <button 
              onClick={() => setChatbotOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1.2rem'
              }}
            >
              <FaTimes />
            </button>
          </div>
          
          {/* Chat Messages */}
          <div style={{
            flex: 1,
            padding: '20px',
            height: '300px',
            overflowY: 'auto',
            backgroundColor: '#f9f9f9'
          }}>
            {messages.map((message, index) => (
              <div 
                key={index}
                style={{
                  marginBottom: '15px',
                  textAlign: message.sender === 'user' ? 'right' : 'left'
                }}
              >
                <div style={{
                  display: 'inline-block',
                  padding: '10px 15px',
                  borderRadius: message.sender === 'user' 
                    ? '18px 18px 0 18px' 
                    : '18px 18px 18px 0',
                  backgroundColor: message.sender === 'user' 
                    ? colors.primary 
                    : '#e5e5ea',
                  color: message.sender === 'user' ? 'white' : 'black',
                  maxWidth: '80%'
                }}>
                  {message.text}
                </div>
              </div>
            ))}
          </div>
          
          {/* Chat Input */}
          <div style={{
            display: 'flex',
            padding: '15px',
            borderTop: '1px solid #eee',
            backgroundColor: 'white'
          }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              style={{
                flex: 1,
                padding: '10px 15px',
                borderRadius: '20px',
                border: `1px solid ${colors.neutral}`,
                outline: 'none',
                fontSize: '0.9rem'
              }}
            />
            <button
              onClick={handleSendMessage}
              style={{
                backgroundColor: colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                marginLeft: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                ':hover': {
                  backgroundColor: colors.secondary
                }
              }}
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default HomePageInvestor;