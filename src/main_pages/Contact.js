import React, { useState, useEffect } from 'react';
import { 
  FaPaperPlane, 
  FaCircle, 
  FaRegDotCircle, 
  FaSpinner,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaWhatsapp,
  FaLinkedin,
  FaTwitter,
  FaInstagram,
  FaBuilding,
  FaQuestionCircle,
  FaShieldAlt,
  FaChartLine,
  FaUsers,
  FaCreditCard,
  FaFileContract,
  FaStar,
  FaUserTie,
  FaGraduationCap,
  FaRocket,
  FaTools,
  FaLock,
  FaReceipt,
  FaMoneyBillWave,
  FaSyncAlt,
  FaUserCheck,
  FaRocketchat,
  FaHandshake,
  FaCogs,
  FaInfoCircle,
  FaTruck
} from 'react-icons/fa';
import { 
  FiClock, 
  FiSend,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
import { MdAdd as PlusIcon, MdRemove as MinusIcon } from 'react-icons/md';
import Header from './Header'; 
import Footer from './Footer'; 
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

const ContactFormPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [openQuestion, setOpenQuestion] = useState(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setError(null);
    
    try {
      if (!formData.name.trim()) throw new Error('Name is required');
      if (!formData.email.trim()) throw new Error('Email is required');
      if (!formData.message.trim()) throw new Error('Message is required');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      const app = getApp();
      const functions = getFunctions(app);
      const submitContactForm = httpsCallable(functions, 'submitContactForm');
      
      const result = await submitContactForm({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim()
      });

      const { data } = result;
      
      if (data.success) {
        setIsSubmitted(true);
        setSuccessMessage(data.message || 'Message sent successfully! Check your email for confirmation.');
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (err) {
      console.error('Form submission error:', err);
      
      if (err.code === 'functions/internal') {
        setError('Server error: ' + (err.message || 'Please try again.'));
      } else if (err.code === 'functions/unavailable') {
        setError('Network error. Please check your connection.');
      } else if (err.code === 'functions/not-found') {
        setError('Contact service is currently unavailable. Please email us directly at hello@bigmarketplace.africa');
      } else if (err.code === 'functions/permission-denied') {
        setError('Permission denied. Please refresh the page.');
      } else {
        setError(err.message || 'Failed to send message. Please try again.');
      }
    } finally {
      setIsSending(false);
    }
  };

  const toggleQuestion = (index) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };

  // Complete FAQ Data - updated with business terminology
  const faqData = {
    general: [
      {
        question: "What is BIG Marketplace Africa?",
        answer: "BIG Marketplace Africa is a comprehensive platform that connects businesses with investors, advisors, catalysts, interns, and other businesses. We use our proprietary BIG Score to create intelligent matches between stakeholders, simplifying connections and driving business growth across Africa.",
        icon: <FaQuestionCircle />
      },
      {
        question: "Who can register on the platform?",
        answer: "The following stakeholders can register:\n• Businesses\n• Investors/Funders\n• Advisors (Experts and Consultants)\n• Interns & Internship Sponsors\n• Catalysts (Accelerators, Incubators)\n• Corporates\n• Suppliers and Service Providers",
        icon: <FaUserCheck />
      },
      {
        question: "Can businesses become advisors on the platform?",
        answer: "No, businesses cannot register as advisors. Businesses are the primary beneficiaries who receive advice, funding, and support. However, businesses can:\n• Register as suppliers to other businesses\n• Offer services to other businesses\n• Purchase from other businesses as customers\nThey receive guidance from dedicated professional advisors on the platform.",
        icon: <FaUserTie />
      },
      {
        question: "Is registration free?",
        answer: "Yes, we offer a free Basic plan for all users. We also have Standard and Premium subscription plans with additional features, plus various add-ons for specific needs.",
        icon: <FaMoneyBillWave />
      },
      {
        question: "Can I update my profile later?",
        answer: "Yes. You can edit your profile, update documents, and modify your preferences anytime through your dashboard.",
        icon: <FaCogs />
      },
      {
        question: "How do I contact support?",
        answer: "For all technical, billing, or policy-related inquiries:\n📧 support@bigmarketplace.africa",
        icon: <FaEnvelope />
      }
    ],
    funding: [
      {
        question: "How does funding matching work?",
        answer: "Our platform uses intelligent matching similar to dating apps:\n• Investors set their investment criteria\n• Businesses complete their profiles and get a BIG Score\n• Our algorithm matches investors with the most compatible businesses\n• Highest matches appear at the top of investor dashboards\n• We simplify the process by pre-screening and scoring all businesses",
        icon: <FaChartLine />
      },
      {
        question: "What type of funding can I apply for?",
        answer: "Businesses can apply for various funding types:\n• Equity Investment\n• Debt Financing\n• Grants\n• Growth funding opportunities",
        icon: <FaMoneyBillWave />
      },
      {
        question: "How long does funding matching take?",
        answer: "Initial matching happens instantly. Feedback on specific applications typically takes 2–4 weeks, depending on profile completeness and investor response times.",
        icon: <FaHandshake />
      },
      {
        question: "What documents do I need for funding applications?",
        answer: "Typically required:\n• Business registration documents\n• Financial summaries or revenue reports\n• Pitch deck or business plan\n• Compliance certificates\n• Growth strategy documentation",
        icon: <FaShieldAlt />
      },
      {
        question: "How does the BIG Score impact funding success?",
        answer: "The BIG Score significantly improves funding success by:\n• Providing data-driven legitimacy assessment\n• Enhancing investor confidence\n• Reducing due diligence time\n• Highlighting growth potential and compliance readiness",
        icon: <FaStar />
      }
    ],
    stakeholders: [
      {
        section: "Advisors",
        questions: [
          {
            question: "How do businesses connect with advisors?",
            answer: "Businesses can apply for advisory services through their dashboard. Our matching system connects them with qualified advisors based on business needs, industry expertise, and BIG Score compatibility.",
            icon: <FaUserTie />
          },
          {
            question: "What types of advisory services are available?",
            answer: "Advisors provide expertise in business strategy, financial management, marketing, operations, technology, legal matters, and more.",
            icon: <FaChartLine />
          },
          {
            question: "How are advisors selected and verified?",
            answer: "All advisors undergo rigorous verification including professional credential checks, experience validation, reference checks, and platform orientation.",
            icon: <FaShieldAlt />
          }
        ]
      },
      {
        section: "Interns & Internship Sponsors",
        questions: [
          {
            question: "How does the internship program work?",
            answer: "Interns apply and create profiles, program sponsors review candidates, businesses post opportunities, and our system matches interns with businesses based on skills and BIG Score.",
            icon: <FaGraduationCap />
          },
          {
            question: "Who can apply for internships?",
            answer: "Interns and students seeking practical experience can apply. They undergo verification and receive a BIG Score to ensure quality matching.",
            icon: <FaUserCheck />
          },
          {
            question: "What support do interns receive?",
            answer: "Interns receive comprehensive support including program sponsor funding, business mentorship, platform resources, and career development opportunities.",
            icon: <FaUsers />
          }
        ]
      },
      {
        section: "Catalysts",
        questions: [
          {
            question: "What are catalysts and what do they do?",
            answer: "Catalysts are growth enablers like accelerators and incubators who help businesses scale operations, provide strategic guidance, and facilitate partnerships.",
            icon: <FaRocket />
          },
          {
            question: "How do catalysts connect with businesses?",
            answer: "Our matching system connects catalysts with businesses based on growth stage, industry focus, and specific program criteria through the BIG Score system.",
            icon: <FaHandshake />
          }
        ]
      },
      {
        section: "Services & Suppliers",
        questions: [
          {
            question: "How do businesses offer or request services?",
            answer: "Businesses can both list and request products or services through their profiles. Our matching system connects businesses based on compatibility and specific needs.",
            icon: <FaTools />
          },
          {
            question: "What types of services can be offered?",
            answer: "Businesses can offer products like laptops and equipment, professional services, manufacturing, digital services, and logistics services.",
            icon: <FaTruck />
          },
          {
            question: "How are service deliveries handled?",
            answer: "Delivery terms are agreed directly between businesses. We facilitate connections but don't manage shipping or logistics directly.",
            icon: <FaHandshake />
          }
        ]
      }
    ],
    subscriptions: [
      {
        question: "What subscription plans are available?",
        answer: "We offer three main subscription tiers:\n• Basic Plan (Free)\n• Standard Plan\n• Premium Plan\nEach plan offers different features and capabilities to suit various business needs.",
        icon: <FaCreditCard />
      },
      {
        question: "What add-on services are available?",
        answer: "Additional services include:\n• API Access to BIG Score engine\n• Branded Business Portfolio Pages\n• Co-branded Calls for Applications\n• Custom BIG Score benchmarks\n• And other specialized services",
        icon: <FaCogs />
      },
      {
        question: "How do I manage my subscription?",
        answer: "You can easily manage your subscription through your account dashboard:\n• Upgrade or downgrade your plan\n• Cancel your subscription\n• Update payment methods\n• View billing history and invoices\n• Manage add-on services",
        icon: <FaSyncAlt />
      },
      {
        question: "What are BIG Growth Tools?",
        answer: "BIG Growth Tools are curated resources designed to boost your BIG Score:\n• Compliance toolkits (legal templates, policy essentials)\n• Legitimacy boosters (digital foundation, brand identity)\n• Capital appeal enhancers (financial readiness, investment packs)\n• Governance strengtheners (advisory readiness, board toolkits)\nAll tools are specifically designed to make your business more attractive to funders and investors.",
        icon: <FaRocketchat />
      }
    ],
    policy: [
      {
        section: "Privacy & Data Protection",
        questions: [
          {
            question: "How does Big Marketplace Africa protect my personal information?",
            answer: "We use industry-standard security measures including encryption, secure servers, and access controls to protect your personal information. All data is stored in secure environments with regular security audits.",
            icon: <FaLock />
          },
          {
            question: "Is my card information safe when I make a payment?",
            answer: "Yes, we use PCI-compliant payment processors and never store your full card details on our servers. All payment transactions are encrypted and processed through secure payment gateways.",
            icon: <FaCreditCard />
          },
          {
            question: "Do you share my data with third parties?",
            answer: "We do not sell your personal data. We only share information with trusted third parties when necessary for platform functionality (e.g., payment processing) or when required by law.",
            icon: <FaUsers />
          },
          {
            question: "What type of personal data do you collect from users and vendors?",
            answer: "We collect only necessary information including contact details, business information, verification documents, and platform usage data to provide and improve our services.",
            icon: <FaFileContract />
          },
          {
            question: "How can I request that my personal data be deleted or updated?",
            answer: "You can update most information through your account settings. For data deletion requests, please contact our support team at support@bigmarketplace.africa.",
            icon: <FaSyncAlt />
          },
          {
            question: "Is my information encrypted during transactions?",
            answer: "Yes, all data transmitted between your device and our servers is encrypted using SSL/TLS encryption protocols to ensure secure communication.",
            icon: <FaLock />
          },
          {
            question: "Do you store my payment information after I make a purchase?",
            answer: "We only store minimal payment information necessary for billing and subscription management. Full card details are handled by our secure payment processors.",
            icon: <FaCreditCard />
          }
        ]
      },
      {
        section: "Refund & Return Policy",
        questions: [
          {
            question: "What is your refund policy for digital subscriptions or plans?",
            answer: "Digital subscriptions can be refunded within 14 days of purchase if no services have been utilized. Refunds are processed on a case-by-case basis for exceptional circumstances.",
            icon: <FaReceipt />
          },
          {
            question: "Can I cancel my subscription and get a refund?",
            answer: "You can cancel your subscription at any time. Refunds for unused portions are available within the first 14 days of the billing cycle.",
            icon: <FaMoneyBillWave />
          },
          {
            question: "How long does it take to process a refund?",
            answer: "Refunds are typically processed within 7-10 business days after approval. The time to appear in your account depends on your financial institution.",
            icon: <FaSyncAlt />
          },
          {
            question: "Who do I contact if I haven't received my refund yet?",
            answer: "Contact our support team at support@bigmarketplace.africa with your transaction details if you haven't received your refund within 10 business days.",
            icon: <FaEnvelope />
          },
          {
            question: "Are refunds available for vendor fees or featured listings?",
            answer: "Vendor fees and featured listings are generally non-refundable once the service has been activated, except in cases of platform error or service failure.",
            icon: <FaUsers />
          },
          {
            question: "Do I need proof of payment to request a refund?",
            answer: "Yes, please have your transaction ID or receipt ready when requesting a refund to help us process your request quickly.",
            icon: <FaFileContract />
          },
          {
            question: "Can I change or downgrade my subscription after purchase?",
            answer: "Yes, you can upgrade or downgrade your subscription at any time through your account dashboard. Changes take effect at your next billing cycle.",
            icon: <FaCreditCard />
          }
        ]
      },
      {
        section: "Terms of Service & General Policies",
        questions: [
          {
            question: "What are the terms and conditions for using Big Marketplace Africa?",
            answer: "Our comprehensive Terms of Service govern platform usage, covering user responsibilities, prohibited activities, intellectual property, and dispute resolution. These are available on our website.",
            icon: <FaFileContract />
          },
          {
            question: "Are there any restrictions on what vendors can sell?",
            answer: "Yes, we prohibit illegal items, dangerous goods, counterfeit products, and services that violate local laws or our community guidelines. All listings must comply with our acceptable use policy.",
            icon: <FaShieldAlt />
          },
          {
            question: "How do I report a policy violation or fraudulent activity?",
            answer: "Use the 'Help' feature on any listing or profile, or contact our support team immediately at support@bigmarketplace.africa with details of the violation.",
            icon: <FaEnvelope />
          },
          {
            question: "What happens if a vendor fails to deliver as promised?",
            answer: "We encourage direct resolution between parties. If unresolved, our support team can mediate disputes according to our platform guidelines and dispute resolution process.",
            icon: <FaHandshake />
          },
          {
            question: "Do you have a dispute resolution process between buyers and sellers?",
            answer: "Yes, we provide a structured dispute resolution process including mediation and, if necessary, arbitration to resolve conflicts between platform users fairly.",
            icon: <FaUsers />
          }
        ]
      }
    ],
    bigScore: [
      {
        question: "What is the BIG Score?",
        answer: "The BIG Score is our proprietary scoring system that evaluates businesses and individuals based on multiple factors including legitimacy, growth potential, compliance, and readiness for opportunities.",
        icon: <FaStar />
      },
      {
        question: "How does the BIG Score improve matching?",
        answer: "The BIG Score enhances matching by:\n• Providing objective assessment of credibility\n• Identifying growth potential and readiness\n• Ensuring compatibility between stakeholders\n• Reducing risk for investors and partners",
        icon: <FaChartLine />
      },
      {
        question: "Do all users get a BIG Score?",
        answer: "Yes, all registered participants receive relevant scores:\n• Businesses get comprehensive business scores\n• Advisors receive credibility scores\n• Interns get performance metrics\n• All scores help ensure quality matches",
        icon: <FaUserCheck />
      },
      {
        question: "Can I improve my BIG Score?",
        answer: "Yes, your BIG Score is dynamic and can be improved by:\n• Completing your profile with accurate information\n• Using BIG Growth Tools to address specific areas\n• Maintaining good platform engagement\n• Building positive relationships with partners\n• Demonstrating growth and compliance",
        icon: <FaChartLine />
      },
      {
        question: "How do BIG Growth Tools help improve my score?",
        answer: "BIG Growth Tools are specifically designed to boost different aspects of your score:\n• Compliance tools address legal and policy requirements\n• Legitimacy tools enhance your professional presence\n• Capital appeal tools strengthen your funding readiness\n• Governance tools build proper business structure\nEach tool targets specific areas that funders and investors care about most.",
        icon: <FaRocketchat />
      }
    ]
  };

  const renderFAQContent = () => {
    const tabData = faqData[activeTab];
    
    if (!tabData) return null;

    // For stakeholders and policy which have sections
    if (activeTab === 'stakeholders') {
      return tabData.map((section, sectionIndex) => (
        <div key={sectionIndex} style={styles.faqSection}>
          <h4 style={styles.faqSectionTitle}>
            {section.section === "Advisors" && <FaUserTie />}
            {section.section === "Interns & Internship Sponsors" && <FaGraduationCap />}
            {section.section === "Catalysts" && <FaRocket />}
            {section.section === "Services & Suppliers" && <FaTools />}
            {section.section}
          </h4>
          {section.questions.map((item, index) => {
            const globalIndex = sectionIndex * 10 + index;
            return (
              <div key={globalIndex} style={styles.faqItem} className="faq-item">
                <button 
                  style={styles.faqQuestion} 
                  className="faq-question"
                  onClick={() => toggleQuestion(globalIndex)}
                  aria-expanded={openQuestion === globalIndex}
                >
                  <span style={styles.faqQuestionText}>
                    {item.icon}
                    {item.question}
                  </span>
                  <span style={isMobile ? {...styles.faqIconWrapper, width: '28px', height: '28px'} : styles.faqIconWrapper}>
                    {openQuestion === globalIndex ? <MinusIcon size={isMobile ? 16 : 20} /> : <PlusIcon size={isMobile ? 16 : 20} />}
                  </span>
                </button>
                <div style={{...styles.faqAnswer, maxHeight: openQuestion === globalIndex ? '500px' : '0'}}>
                  <p style={isMobile ? {...styles.faqAnswerText, padding: '0 0 1rem 0', fontSize: '0.9rem'} : styles.faqAnswerText}>{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      ));
    }

    if (activeTab === 'policy') {
      return tabData.map((section, sectionIndex) => (
        <div key={sectionIndex} style={styles.faqSection}>
          <h4 style={styles.faqSectionTitle}>
            {section.section === "Privacy & Data Protection" && <FaLock />}
            {section.section === "Refund & Return Policy" && <FaReceipt />}
            {section.section === "Terms of Service & General Policies" && <FaFileContract />}
            {section.section}
          </h4>
          {section.questions.map((item, index) => {
            const globalIndex = sectionIndex * 20 + index;
            return (
              <div key={globalIndex} style={styles.faqItem} className="faq-item">
                <button 
                  style={styles.faqQuestion} 
                  className="faq-question"
                  onClick={() => toggleQuestion(globalIndex)}
                  aria-expanded={openQuestion === globalIndex}
                >
                  <span style={styles.faqQuestionText}>
                    {item.icon}
                    {item.question}
                  </span>
                  <span style={isMobile ? {...styles.faqIconWrapper, width: '28px', height: '28px'} : styles.faqIconWrapper}>
                    {openQuestion === globalIndex ? <MinusIcon size={isMobile ? 16 : 20} /> : <PlusIcon size={isMobile ? 16 : 20} />}
                  </span>
                </button>
                <div style={{...styles.faqAnswer, maxHeight: openQuestion === globalIndex ? '500px' : '0'}}>
                  <p style={isMobile ? {...styles.faqAnswerText, padding: '0 0 1rem 0', fontSize: '0.9rem'} : styles.faqAnswerText}>{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      ));
    }

    // For general, funding, subscriptions, bigScore
    return tabData.map((item, index) => (
      <div key={index} style={styles.faqItem} className="faq-item">
        <button 
          style={styles.faqQuestion} 
          className="faq-question"
          onClick={() => toggleQuestion(index)}
          aria-expanded={openQuestion === index}
        >
          <span style={styles.faqQuestionText}>
            {item.icon}
            {item.question}
          </span>
          <span style={isMobile ? {...styles.faqIconWrapper, width: '28px', height: '28px'} : styles.faqIconWrapper}>
            {openQuestion === index ? <MinusIcon size={isMobile ? 16 : 20} /> : <PlusIcon size={isMobile ? 16 : 20} />}
          </span>
        </button>
        <div style={{...styles.faqAnswer, maxHeight: openQuestion === index ? '500px' : '0'}}>
          <p style={isMobile ? {...styles.faqAnswerText, padding: '0 0 1rem 0', fontSize: '0.9rem'} : styles.faqAnswerText}>{item.answer}</p>
        </div>
      </div>
    ));
  };

  // Responsive styles
  const responsiveStyles = {
    contactInfoGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
      gap: isMobile ? '1rem' : '1.5rem',
      width: '100%',
      marginBottom: isMobile ? '1.5rem' : '2.5rem',
    },
    formContainer: {
      maxWidth: '900px',
      width: '100%',
      marginBottom: isMobile ? '1.5rem' : '2.5rem',
      padding: isMobile ? '1.5rem' : '2.5rem 3rem',
      backgroundColor: 'rgba(255, 255, 255, 0.92)',
      borderRadius: '24px',
      border: '1px solid #EAE2D8',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 10px 40px rgba(28,20,16,0.08)',
      backdropFilter: 'blur(10px)',
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap: isMobile ? '0' : '1.5rem',
    },
    bottomSection: {
      width: '100%',
      maxWidth: '900px',
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
      gap: isMobile ? '1rem' : '1.5rem',
      backgroundColor: 'rgba(255,255,255,0.85)',
      borderRadius: '16px',
      padding: isMobile ? '1.25rem' : '1.5rem 2rem',
      border: '1px solid #EAE2D8',
      backdropFilter: 'blur(8px)',
      marginBottom: isMobile ? '1.5rem' : '2.5rem',
    },
    socialIcons: {
      display: 'flex',
      justifyContent: isMobile ? 'center' : 'center',
      gap: isMobile ? '0.75rem' : '1rem',
      flexWrap: 'wrap',
    },
    buildingInfo: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: isMobile ? 'center' : 'center',
      gap: '0.75rem',
      flexWrap: 'wrap',
      textAlign: isMobile ? 'center' : 'left',
    },
    faqContainer: {
      width: '100%',
      maxWidth: '900px',
      backgroundColor: 'rgba(255, 255, 255, 0.92)',
      borderRadius: '24px',
      padding: isMobile ? '1.5rem' : '2.5rem 3rem',
      border: '1px solid #EAE2D8',
      boxShadow: '0 10px 40px rgba(28,20,16,0.08)',
      backdropFilter: 'blur(10px)',
    },
  };

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .contact-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 40px rgba(117, 74, 45, 0.2);
        }
        .contact-card .icon-wrap {
          transition: all 0.3s ease;
        }
        .contact-card:hover .icon-wrap {
          transform: scale(1.1) rotate(-5deg);
        }
        .social-icon:hover {
          transform: translateY(-3px);
          color: #754A2D;
        }
        input:hover, textarea:hover {
          border-color: #BCAE9C;
        }
        input:focus, textarea:focus {
          border-color: #754A2D;
          box-shadow: 0 0 0 4px rgba(117, 74, 45, 0.08);
        }
        .faq-item:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          transform: translateY(-3px);
          border-color: #FFAB91;
        }
        .faq-question:hover {
          background: rgba(239, 235, 233, 0.5);
        }
        .faq-tab:hover {
          background: rgba(93, 64, 55, 0.08);
          transform: translateY(-2px);
        }
        .faq-tab-active {
          background: #5D4037 !important;
          color: white !important;
          box-shadow: 0 4px 12px rgba(93, 64, 55, 0.3);
        }
        @media (max-width: 768px) {
          .contact-card {
            padding: 1rem !important;
          }
          .contact-card .icon-wrap {
            width: 44px !important;
            height: 44px !important;
          }
          .contact-card .icon-wrap svg {
            width: 20px !important;
            height: 20px !important;
          }
          .contact-card h4 {
            font-size: 0.75rem !important;
          }
          .contact-card p {
            font-size: 0.85rem !important;
          }
        }
      `}</style>
      <Header />
      
      <div style={styles.content}>
        {/* Contact Info Cards - Top Section */}
        <div style={responsiveStyles.contactInfoGrid}>
          <div style={styles.contactInfoCard} className="contact-card">
            <div style={styles.contactIconWrap} className="icon-wrap">
              <FaPhoneAlt size={isMobile ? 20 : 24} color="#754A2D" />
            </div>
            <h4 style={styles.contactCardTitle}>Phone</h4>
            <p style={styles.contactCardText}>+27 87 265 4893</p>
            <p style={styles.contactCardSubtext}>Mon-Fri, 9am - 5pm</p>
          </div>

          <div style={styles.contactInfoCard} className="contact-card">
            <div style={styles.contactIconWrap} className="icon-wrap">
              <FaEnvelope size={isMobile ? 20 : 24} color="#754A2D" />
            </div>
            <h4 style={styles.contactCardTitle}>Email</h4>
            <p style={styles.contactCardText}>hello@bigmarketplace.africa</p>
            <p style={styles.contactCardSubtext}>We reply within 24 hours</p>
          </div>

          <div style={styles.contactInfoCard} className="contact-card">
            <div style={styles.contactIconWrap} className="icon-wrap">
              <FaMapMarkerAlt size={isMobile ? 20 : 24} color="#754A2D" />
            </div>
            <h4 style={styles.contactCardTitle}>Location</h4>
            <p style={styles.contactCardText}>2040 Broadacres Dr</p>
            <p style={styles.contactCardSubtext}>Fourways, Gauteng, South Africa</p>
          </div>
        </div>

        {/* Main Form Section */}
        <div style={responsiveStyles.formContainer}>
          <div style={styles.decorativeShape1}></div>
          <div style={styles.decorativeShape2}></div>
          <div style={styles.dots}>
            <FaCircle />
            <FaRegDotCircle />
            <FaCircle />
          </div>
          
          <div style={styles.headerSection}>
            <div style={styles.headerIconWrap}>
              <FaPaperPlane size={isMobile ? 24 : 28} color="#754A2D" />
            </div>
            <div>
              <h2 style={isMobile ? {...styles.title, fontSize: '1.5rem'} : styles.title}>Let's Connect</h2>
              <p style={isMobile ? {...styles.subtitle, fontSize: '0.85rem'} : styles.subtitle}>We'd love to hear from you</p>
            </div>
          </div>

          <div style={isMobile ? {...styles.introMessage, padding: '0.8rem 1rem', fontSize: '0.85rem'} : styles.introMessage}>
            <span style={styles.introIcon}>💡</span>
            <div>
              At BIG Marketplace, your success is our priority. As your trusted partner, we are dedicated to helping your business grow, adapt, and thrive in an ever-changing landscape. Let's achieve greatness together.
            </div>
          </div>
          
          {error && (
            <div style={isMobile ? {...styles.errorMessage, padding: '0.8rem 1rem', fontSize: '0.85rem'} : styles.errorMessage}>
              <FiAlertCircle size={isMobile ? 16 : 20} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}
          
          {isSubmitted ? (
            <div style={isMobile ? {...styles.successMessage, padding: '1.5rem 1rem'} : styles.successMessage}>
              <div style={isMobile ? {...styles.successIconWrap, width: '60px', height: '60px'} : styles.successIconWrap}>
                <FiCheckCircle size={isMobile ? 36 : 48} color="#754A2D" />
              </div>
              <h3 style={isMobile ? {...styles.successTitle, fontSize: '1.2rem'} : styles.successTitle}>Message Sent! 🎉</h3>
              <p style={isMobile ? {...styles.successText, fontSize: '0.9rem'} : styles.successText}>{successMessage}</p>
              <div style={styles.emailNote}>
                <FaEnvelope size={isMobile ? 14 : 16} color="#754A2D" />
                <span style={isMobile ? {fontSize: '0.8rem'} : {}}>We've sent a confirmation to <strong>{formData.email}</strong></span>
              </div>
              <div style={styles.emailNote}>
                <FiClock size={isMobile ? 14 : 16} color="#754A2D" />
                <span style={isMobile ? {fontSize: '0.8rem'} : {}}>Our team will respond within 24 hours</span>
              </div>
              <button 
                style={isMobile ? {...styles.newMessageButton, padding: '0.6rem 1.5rem', fontSize: '0.85rem'} : styles.newMessageButton}
                onClick={() => {
                  setIsSubmitted(false);
                  setError(null);
                  setFormData({
                    name: '',
                    email: '',
                    subject: '',
                    message: ''
                  });
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#5A3420';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#372C27';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <FaPaperPlane size={isMobile ? 14 : 16} />
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={responsiveStyles.formRow}>
                <div style={styles.formGroup}>
                  <label style={isMobile ? {...styles.label, fontSize: '0.8rem'} : styles.label}>Full Name *</label>
                  <input 
                    type="text" 
                    name="name"
                    placeholder="Enter your full name" 
                    style={isMobile ? {...styles.input, padding: '0.7rem 1rem', fontSize: '0.9rem'} : styles.input} 
                    value={formData.name}
                    onChange={handleChange}
                    required 
                    disabled={isSending}
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={isMobile ? {...styles.label, fontSize: '0.8rem'} : styles.label}>Email Address *</label>
                  <input 
                    type="email" 
                    name="email"
                    placeholder="you@example.com" 
                    style={isMobile ? {...styles.input, padding: '0.7rem 1rem', fontSize: '0.9rem'} : styles.input} 
                    value={formData.email}
                    onChange={handleChange}
                    required 
                    disabled={isSending}
                  />
                </div>
              </div>
              
              <div style={styles.formGroup}>
                <label style={isMobile ? {...styles.label, fontSize: '0.8rem'} : styles.label}>Subject</label>
                <input 
                  type="text" 
                  name="subject"
                  placeholder="What is this regarding?" 
                  style={isMobile ? {...styles.input, padding: '0.7rem 1rem', fontSize: '0.9rem'} : styles.input}
                  value={formData.subject}
                  onChange={handleChange}
                  disabled={isSending}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={isMobile ? {...styles.label, fontSize: '0.8rem'} : styles.label}>Message *</label>
                <textarea 
                  name="message"
                  placeholder="Tell us how we can help you..." 
                  rows={isMobile ? 4 : 5} 
                  style={isMobile ? {...styles.textarea, padding: '0.7rem 1rem', fontSize: '0.9rem', minHeight: '120px'} : styles.textarea} 
                  value={formData.message}
                  onChange={handleChange}
                  required
                  disabled={isSending}
                />
              </div>
              
              <button 
                type="submit" 
                style={isSending ? { ...styles.submitButton, opacity: 0.7, cursor: 'not-allowed', padding: isMobile ? '0.8rem' : '1rem' } : {...styles.submitButton, padding: isMobile ? '0.8rem' : '1rem'}}
                disabled={isSending}
                onMouseEnter={(e) => !isSending && Object.assign(e.currentTarget.style, { 
                  backgroundColor: '#5A3420',
                  transform: 'translateY(-3px)',
                  boxShadow: '0 8px 25px rgba(117, 74, 45, 0.35)',
                })}
                onMouseLeave={(e) => {
                  if (!isSending) {
                    e.currentTarget.style.backgroundColor = '#754A2D';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(117, 74, 45, 0.25)';
                  }
                }}
              >
                {isSending ? (
                  <>
                    <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                    Sending...
                  </>
                ) : (
                  <>
                    <FiSend size={isMobile ? 16 : 18} />
                    Send Message
                  </>
                )}
              </button>
              
              <div style={isMobile ? {...styles.formFooter, fontSize: '0.7rem', flexWrap: 'wrap', gap: '0.5rem'} : styles.formFooter}>
                <span>* Required fields</span>
                <span>|</span>
                <span>We'll respond within 24 hours</span>
              </div>
            </form>
          )}
        </div>

        {/* Social & Business Hours Section */}
        <div style={responsiveStyles.bottomSection}>
          <div style={isMobile ? {...styles.businessHours, justifyContent: 'center'} : styles.businessHours}>
            <div style={isMobile ? {...styles.businessHoursIcon, width: '36px', height: '36px'} : styles.businessHoursIcon}>
              <FiClock size={isMobile ? 20 : 24} color="#754A2D" />
            </div>
            <div>
              <h4 style={isMobile ? {...styles.businessHoursTitle, fontSize: '0.75rem'} : styles.businessHoursTitle}>Business Hours</h4>
              <p style={isMobile ? {...styles.businessHoursText, fontSize: '0.7rem'} : styles.businessHoursText}>Monday - Friday: 9:00 AM - 5:00 PM</p>
              <p style={isMobile ? {...styles.businessHoursText, fontSize: '0.7rem'} : styles.businessHoursText}>Saturday - Sunday: Closed</p>
            </div>
          </div>

          <div style={styles.socialLinks}>
            <h4 style={isMobile ? {...styles.socialTitle, fontSize: '0.75rem'} : styles.socialTitle}>Follow Us</h4>
            <div style={responsiveStyles.socialIcons}>
              <a href="#" style={isMobile ? {...styles.socialIcon, width: '36px', height: '36px'} : styles.socialIcon} className="social-icon">
                <FaWhatsapp size={isMobile ? 18 : 22} />
              </a>
              <a href="#" style={isMobile ? {...styles.socialIcon, width: '36px', height: '36px'} : styles.socialIcon} className="social-icon">
                <FaLinkedin size={isMobile ? 18 : 22} />
              </a>
              <a href="#" style={isMobile ? {...styles.socialIcon, width: '36px', height: '36px'} : styles.socialIcon} className="social-icon">
                <FaTwitter size={isMobile ? 18 : 22} />
              </a>
              <a href="#" style={isMobile ? {...styles.socialIcon, width: '36px', height: '36px'} : styles.socialIcon} className="social-icon">
                <FaInstagram size={isMobile ? 18 : 22} />
              </a>
            </div>
          </div>

          <div style={isMobile ? {...styles.buildingInfo, flexDirection: 'column', textAlign: 'center'} : styles.buildingInfo}>
            <FaBuilding size={isMobile ? 16 : 20} color="#754A2D" />
            <span style={isMobile ? {...styles.buildingText, fontSize: '0.75rem'} : styles.buildingText}>BIG Marketplace • 2040 Broadacres Dr, Fourways</span>
          </div>
        </div>

        {/* FAQ Section - Added after the form */}
        <div style={responsiveStyles.faqContainer}>
          <div style={styles.faqHeader}>
            <FaQuestionCircle size={isMobile ? 24 : 32} color="#754A2D" />
            <div>
              <h2 style={isMobile ? {...styles.faqTitle, fontSize: '1.5rem'} : styles.faqTitle}>Frequently Asked Questions</h2>
              <p style={isMobile ? {...styles.faqSubtitle, fontSize: '0.85rem'} : styles.faqSubtitle}>
                Find answers about our platform, matching system, BIG Score, subscriptions, and more
              </p>
            </div>
          </div>

          <div style={styles.faqTabsContainer}>
            {[
              { id: 'general', label: 'General', icon: <FaShieldAlt /> },
              { id: 'funding', label: 'Funding', icon: <FaChartLine /> },
              { id: 'stakeholders', label: 'Stakeholders', icon: <FaUsers /> },
              { id: 'subscriptions', label: 'Subscriptions', icon: <FaCreditCard /> },
              { id: 'policy', label: 'Policy', icon: <FaFileContract /> },
              { id: 'bigScore', label: 'BIG Score', icon: <FaStar /> },
            ].map(tab => (
              <button
                key={tab.id}
                className={`faq-tab ${activeTab === tab.id ? 'faq-tab-active' : ''}`}
                style={isMobile ? {...styles.faqTab, padding: '0.5rem 0.8rem', fontSize: '0.75rem'} : styles.faqTab}
                onClick={() => {
                  setActiveTab(tab.id);
                  setOpenQuestion(null);
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div style={styles.faqList}>
            {renderFAQContent()}
          </div>

          <div style={styles.faqFooter}>
            <FaInfoCircle color="#754A2D" />
            <span style={isMobile ? {fontSize: '0.85rem'} : {}}>Need more help? Contact our support team at <strong>support@bigmarketplace.africa</strong></span>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundImage: 'linear-gradient(rgba(242, 240, 230, 0.92), rgba(242, 240, 230, 0.85)), url(/background10.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem 1.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  
  // Contact Info Cards
  contactInfoCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '1.5rem',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(28,20,16,0.06)',
    border: '1px solid #EAE2D8',
    transition: 'all 0.3s ease',
    cursor: 'default',
  },
  contactIconWrap: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: 'rgba(117, 74, 45, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px',
    transition: 'all 0.3s ease',
  },
  contactCardTitle: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#7A6A5E',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '4px',
  },
  contactCardText: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1C1410',
    marginBottom: '2px',
  },
  contactCardSubtext: {
    fontSize: '0.8rem',
    color: '#7A6A5E',
    margin: 0,
  },

  // Form Container
  decorativeShape1: {
    position: 'absolute',
    top: '-60px',
    right: '-60px',
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    border: '2px solid #754A2D',
    opacity: '0.05',
  },
  decorativeShape2: {
    position: 'absolute',
    bottom: '-40px',
    left: '-40px',
    width: '100px',
    height: '100px',
    border: '2px dashed #BCAE9C',
    transform: 'rotate(45deg)',
    opacity: '0.06',
  },
  dots: {
    position: 'absolute',
    right: '30px',
    top: '30px',
    color: '#9E6E3C',
    opacity: '0.06',
    fontSize: '1.8rem',
    display: 'flex',
    gap: '4px',
  },
  headerSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  headerIconWrap: {
    width: '60px',
    height: '60px',
    borderRadius: '16px',
    backgroundColor: 'rgba(117, 74, 45, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#1C1410',
    margin: 0,
    letterSpacing: '-0.01em',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#7A6A5E',
    margin: 0,
  },
  introMessage: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    backgroundColor: 'rgba(117, 74, 45, 0.04)',
    padding: '1.2rem 1.5rem',
    borderRadius: '12px',
    borderLeft: '4px solid #754A2D',
    marginBottom: '2rem',
    fontSize: '0.95rem',
    lineHeight: '1.6',
    color: '#372C27',
  },
  introIcon: {
    fontSize: '1.5rem',
    flexShrink: 0,
  },
  
  // Form Elements
  formGroup: {
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#372C27',
    marginBottom: '0.4rem',
  },
  input: {
    width: '100%',
    padding: '0.9rem 1.2rem',
    borderRadius: '12px',
    border: '2px solid #EAE2D8',
    backgroundColor: 'white',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
    outline: 'none',
    color: '#1C1410',
  },
  textarea: {
    width: '100%',
    padding: '0.9rem 1.2rem',
    borderRadius: '12px',
    border: '2px solid #EAE2D8',
    backgroundColor: 'white',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
    outline: 'none',
    minHeight: '150px',
    resize: 'vertical',
    color: '#1C1410',
  },
  submitButton: {
    width: '100%',
    padding: '1rem',
    border: 'none',
    borderRadius: '12px',
    backgroundColor: '#754A2D',
    color: 'white',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.8rem',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(117, 74, 45, 0.25)',
    letterSpacing: '0.02em',
  },
  formFooter: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginTop: '1.2rem',
    fontSize: '0.8rem',
    color: '#7A6A5E',
  },
  
  // Error & Success
  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: 'rgba(190, 59, 42, 0.08)',
    border: '1px solid #BE3B2A',
    borderRadius: '12px',
    padding: '1rem 1.5rem',
    marginBottom: '1.5rem',
    color: '#BE3B2A',
    fontSize: '0.95rem',
  },
  successMessage: {
    textAlign: 'center',
    padding: '2rem 1.5rem',
  },
  successIconWrap: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'rgba(117, 74, 45, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1rem',
  },
  successTitle: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#1C1410',
    marginBottom: '0.5rem',
  },
  successText: {
    fontSize: '1rem',
    color: '#372C27',
    marginBottom: '1rem',
    lineHeight: '1.6',
  },
  emailNote: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    color: '#7A6A5E',
    marginBottom: '0.3rem',
  },
  newMessageButton: {
    marginTop: '1.5rem',
    padding: '0.8rem 2rem',
    backgroundColor: '#372C27',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.3s ease',
  },

  // Bottom Section
  businessHours: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  businessHoursIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: 'rgba(117, 74, 45, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  businessHoursTitle: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#1C1410',
    margin: 0,
  },
  businessHoursText: {
    fontSize: '0.8rem',
    color: '#7A6A5E',
    margin: 0,
  },
  socialLinks: {
    textAlign: 'center',
  },
  socialTitle: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#1C1410',
    marginBottom: '0.5rem',
  },
  socialIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'rgba(117, 74, 45, 0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#372C27',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
  },
  buildingInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
  },
  buildingText: {
    fontSize: '0.85rem',
    color: '#7A6A5E',
  },

  // FAQ Styles
  faqHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  faqTitle: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#1C1410',
    margin: 0,
    letterSpacing: '-0.01em',
  },
  faqSubtitle: {
    fontSize: '0.95rem',
    color: '#7A6A5E',
    margin: 0,
  },
  faqTabsContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
  },
  faqTab: {
    padding: '0.6rem 1.2rem',
    background: 'transparent',
    color: '#5D4037',
    border: '2px solid #D7CCC8',
    borderRadius: '50px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  faqList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
  },
  faqSection: {
    marginBottom: '1.5rem',
  },
  faqSectionTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#5D4037',
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '2px solid #FFAB91',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  faqItem: {
    border: '1px solid #D7CCC8',
    borderRadius: '12px',
    overflow: 'hidden',
    background: 'white',
    transition: 'all 0.3s ease',
    marginBottom: '0.8rem',
  },
  faqQuestion: {
    width: '100%',
    padding: '1.2rem 1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#3E2723',
    transition: 'all 0.3s ease',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  faqQuestionText: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  faqIconWrapper: {
    color: '#8D6E63',
    fontSize: '1.2rem',
    marginLeft: '1rem',
    flexShrink: 0,
    transition: 'all 0.3s ease',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
  },
  faqAnswer: {
    padding: '0 1.5rem',
    maxHeight: '0',
    overflow: 'hidden',
    transition: 'maxHeight 0.4s ease, padding 0.4s ease',
    background: 'rgba(239, 235, 233, 0.3)',
    borderTop: '0 solid transparent',
  },
  faqAnswerText: {
    padding: '0 0 1.5rem 0',
    margin: 0,
    color: '#3E2723',
    lineHeight: '1.7',
    whiteSpace: 'pre-line',
  },
  faqFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    marginTop: '1.5rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid #EAE2D8',
    color: '#7A6A5E',
    fontSize: '0.95rem',
    textAlign: 'center',
    flexWrap: 'wrap',
  },
};

export default ContactFormPage;