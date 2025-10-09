import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { MdAdd as PlusIcon, MdRemove as MinusIcon } from 'react-icons/md';
import { 
  FaHandshake, 
  FaChartLine, 
  FaTools, 
  FaShieldAlt, 
  FaQuestionCircle, 
  FaMoneyBillWave, 
  FaCogs, 
  FaStar,
  FaInfoCircle,
  FaGlobe,
  FaLightbulb,
  FaUsers,
  FaIndustry,
  FaUserTie,
  FaRocket,
  FaGraduationCap,
  FaTruck,
  FaUniversity,
  FaSyncAlt,
  FaUserCheck,
  FaLock,
  FaCreditCard,
  FaEnvelope,
  FaRocketchat
} from 'react-icons/fa';
import Header from './Header';
import Footer from './Footer';

// Color palette
const colors = {
  primary: '#5D4037',
  secondary: '#8D6E63',
  accent: '#D7CCC8',
  light: '#EFEBE9',
  highlight: '#FFAB91',
  textDark: '#3E2723',
  textLight: '#FFFFFF',
};

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// Background image URL
const backgroundImageUrl = 'https://media.istockphoto.com/id/2153478836/photo/digital-technology-internet-network-connection-big-data-digital-marketing-iot-internet-of.jpg?s=1024x1024&w=is&k=20&c=ZLIKNbPQbEMb07-eQK1u-j180Q2Nk3zAh6mR3D1U0ZQ=';

// Styled components
const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(
      to bottom,
      rgba(245, 240, 235, 0.42),
      rgba(245, 240, 235, 0.56)
    ),
    url(${backgroundImageUrl});
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const MainContent = styled.main`
  flex: 1;
  animation: ${fadeIn} 0.6s ease-out;
  margin: 0 auto;
  width: 100%;
  max-width: 1200px;
  padding: 4rem 40px;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 2rem 20px;
  }
`;

const FAQContainer = styled.section`
  background: rgba(255, 255, 255, 0.92);
  border-radius: 24px;
  box-shadow: 0 12px 36px rgba(0,0,0,0.08);
  padding: 3rem;
  height: 100%;
  border: 1px solid rgba(0,0,0,0.05);
  transition: transform 0.3s ease;
  backdrop-filter: blur(2px);

  &:hover {
    transform: translateY(-5px);
  }

  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
    backdrop-filter: none;
  }
`;

const Title = styled.h1`
  color: ${colors.primary};
  text-align: center;
  margin-bottom: 3rem;
  font-size: 2.75rem;
  font-weight: 700;
  position: relative;
  padding-bottom: 1.5rem;
  line-height: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;

  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 120px;
    height: 5px;
    background: linear-gradient(90deg, ${colors.highlight}, ${colors.secondary});
    border-radius: 3px;
  }

  @media (max-width: 768px) {
    font-size: 2rem;
    margin-bottom: 2rem;
  }
`;

const Subtitle = styled.p`
  text-align: center;
  color: ${colors.secondary};
  font-size: 1.1rem;
  margin-bottom: 3rem;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const TabsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 3rem;
  flex-wrap: wrap;
`;

const Tab = styled.button`
  padding: 0.9rem 2rem;
  background: ${props => props.active ? colors.primary : 'transparent'};
  color: ${props => props.active ? colors.textLight : colors.primary};
  border: 2px solid ${props => props.active ? colors.primary : colors.accent};
  border-radius: 50px;
  cursor: pointer;
  font-weight: ${props => props.active ? '600' : '500'};
  transition: all 0.3s ease;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: ${props => props.active ? `0 6px 12px rgba(93, 64, 55, 0.2)` : 'none'};
  min-width: 120px;
  justify-content: center;

  &:hover {
    background: ${props => props.active ? colors.secondary : colors.light};
    transform: translateY(-2px);
    box-shadow: ${props => props.active ? `0 8px 16px rgba(93, 64, 55, 0.3)` : `0 4px 8px rgba(0,0,0,0.1)`};
  }

  svg {
    font-size: 1.1rem;
  }

  @media (max-width: 768px) {
    padding: 0.7rem 1.2rem;
    font-size: 0.9rem;
  }
`;

const FAQList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FAQItem = styled.div`
  border: 1px solid ${colors.accent};
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  background: ${colors.textLight};
  transition: all 0.4s ease;

  &:hover {
    box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    transform: translateY(-3px);
    border-color: ${colors.highlight};
  }
`;

const FAQQuestion = styled.button`
  width: 100%;
  padding: 1.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 1.15rem;
  font-weight: 600;
  color: ${colors.primary};
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    background: rgba(239, 235, 233, 0.5);
  }

  @media (max-width: 768px) {
    padding: 1.25rem;
    font-size: 1.05rem;
  }
`;

const QuestionText = styled.span`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const FAQAnswer = styled.div`
  padding: 0 1.75rem;
  max-height: ${props => props.isOpen ? '1000px' : '0'};
  overflow: hidden;
  transition: max-height 0.6s cubic-bezier(0.22, 1, 0.36, 1), padding 0.5s ease;
  background: rgba(239, 235, 233, 0.3);
  color: ${colors.textDark};
  line-height: 1.8;
  border-top: ${props => props.isOpen ? `1px solid ${colors.accent}` : '0 solid transparent'};

  p {
    padding: ${props => props.isOpen ? '0 0 1.75rem 0' : '0'};
    transition: padding 0.5s ease;
    margin: 0;
    white-space: pre-line;
    display: flex;
    gap: 0.75rem;

    &:before {
      content: '•';
      color: ${colors.highlight};
      font-weight: bold;
      display: inline-block;
      width: 1em;
      margin-left: -1em;
    }
  }

  @media (max-width: 768px) {
    padding: 0 1.25rem;
    
    p {
      padding: ${props => props.isOpen ? '0 0 1.25rem 0' : '0'};
    }
  }
`;

const IconWrapper = styled.span`
  color: ${props => props.isOpen ? colors.highlight : colors.secondary};
  font-size: 1.5rem;
  margin-left: 1rem;
  flex-shrink: 0;
  transition: all 0.4s ease;
  transform: ${props => props.isOpen ? 'rotate(180deg)' : 'rotate(0)'};
  background: ${props => props.isOpen ? 'rgba(255, 171, 145, 0.1)' : 'transparent'};
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;

  ${FAQQuestion}:hover & {
    animation: ${pulse} 1s ease infinite;
  }
`;

const SectionHeader = styled.h3`
  color: ${colors.primary};
  font-size: 1.5rem;
  margin: 2rem 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid ${colors.highlight};
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const FAQPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [openQuestion, setOpenQuestion] = useState(null);

  const faqData = {
    general: [
      {
        question: "What is BIG Marketplace Africa?",
        answer: "BIG Marketplace Africa is a comprehensive platform that connects SMEs with investors, advisors, catalysts, interns, and other businesses. We use our proprietary BIG Score to create intelligent matches between stakeholders, simplifying connections and driving business growth across Africa.",
        icon: <FaQuestionCircle />
      },
      {
        question: "Who can register on the platform?",
        answer: "The following stakeholders can register:\n• SMEs (Small and Medium Enterprises)\n• Investors/Funders\n• Advisors (Experts and Consultants)\n• Graduates (for Internship roles)\n• Catalysts (Accelerators, Incubators)\n• Program Sponsors\n• Corporates\n• Suppliers and Service Providers",
        icon: <FaUserCheck />
      },
      {
        question: "Can SMEs become advisors on the platform?",
        answer: "No, SMEs cannot register as advisors. SMEs are the primary beneficiaries who receive advice, funding, and support. However, SMEs can:\n• Register as suppliers to other businesses\n• Offer services to other SMEs\n• Purchase from other SMEs as customers\nThey receive guidance from dedicated professional advisors on the platform.",
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
        answer: "For all technical, billing, or privacy-related inquiries:\n📧 support@bigmarketplace.africa",
        icon: <FaEnvelope />
      }
    ],
    funding: [
      {
        question: "How does funding matching work?",
        answer: "Our platform uses intelligent matching similar to dating apps:\n• Investors set their investment criteria\n• SMEs complete their profiles and get a BIG Score\n• Our algorithm matches investors with the most compatible SMEs\n• Highest matches appear at the top of investor dashboards\n• We simplify the process by pre-screening and scoring all SMEs",
        icon: <FaChartLine />
      },
      {
        question: "What type of funding can I apply for?",
        answer: "SMEs can apply for various funding types:\n• Equity Investment\n• Debt Financing\n• Grants\n• Growth funding opportunities",
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
            question: "How do SMEs connect with advisors?",
            answer: "SMEs can apply for advisory services through their dashboard. Our matching system connects them with qualified advisors based on business needs, industry expertise, and BIG Score compatibility.",
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
        section: "Interns & Graduates",
        questions: [
          {
            question: "How does the internship program work?",
            answer: "Graduates apply and create profiles, program sponsors review candidates, SMEs post opportunities, and our system matches graduates with SMEs based on skills and BIG Score.",
            icon: <FaGraduationCap />
          },
          {
            question: "Who can apply for internships?",
            answer: "Graduates and students seeking practical experience can apply. They undergo verification and receive a BIG Score to ensure quality matching.",
            icon: <FaUserCheck />
          },
          {
            question: "What support do interns receive?",
            answer: "Interns receive comprehensive support including program sponsor funding, SME mentorship, platform resources, and career development opportunities.",
            icon: <FaUsers />
          }
        ]
      },
      {
        section: "Catalysts",
        questions: [
          {
            question: "What are catalysts and what do they do?",
            answer: "Catalysts are growth enablers like accelerators and incubators who help SMEs scale operations, provide strategic guidance, and facilitate partnerships.",
            icon: <FaRocket />
          },
          {
            question: "How do catalysts connect with SMEs?",
            answer: "Our matching system connects catalysts with SMEs based on growth stage, industry focus, and specific program criteria through the BIG Score system.",
            icon: <FaHandshake />
          }
        ]
      },
      {
        section: "Services & Suppliers",
        questions: [
          {
            question: "How do SMEs offer or request services?",
            answer: "SMEs can both list and request products or services through their profiles. Our matching system connects businesses based on compatibility and specific needs.",
            icon: <FaTools />
          },
          {
            question: "What types of services can be offered?",
            answer: "SMEs can offer products like laptops and equipment, professional services, manufacturing, digital services, and logistics services.",
            icon: <FaTruck />
          },
          {
            question: "How are service deliveries handled?",
            answer: "Delivery terms are agreed directly between SMEs. We facilitate connections but don't manage shipping or logistics directly.",
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
        answer: "Additional services include:\n• API Access to BIG Score engine\n• Branded SME Portfolio Pages\n• Co-branded Calls for Applications\n• Custom BIG Score benchmarks\n• And other specialized services",
        icon: <FaCogs />
      },
      {
        question: "How do I manage my subscription?",
        answer: "You can easily manage your subscription through your account dashboard:\n• Upgrade or downgrade your plan\n• Cancel your subscription\n• Update payment methods\n• View billing history and invoices\n• Manage add-on services",
        icon: <FaSyncAlt />
      },
      {
        question: "What is your refund policy?",
        answer: "Refund Policy:\n• Digital products and tools: Non-refundable once accessed\n• Subscription fees: Refundable within 14 days if no services utilized\n• Service fees: Case-by-case basis depending on service delivery\n• All refund requests must be submitted in writing\n• Refunds processed within 7-10 business days",
        icon: <FaMoneyBillWave />
      },
      {
        question: "What are BIG Growth Tools?",
        answer: "BIG Growth Tools are curated resources designed to boost your BIG Score:\n• Compliance toolkits (legal templates, policy essentials)\n• Legitimacy boosters (digital foundation, brand identity)\n• Capital appeal enhancers (financial readiness, investment packs)\n• Governance strengtheners (advisory readiness, board toolkits)\nAll tools are specifically designed to make your business more attractive to funders and investors.",
        icon: <FaRocketchat />
      }
    ],
    privacy: [
      {
        question: "How is my personal and business data protected?",
        answer: "Your privacy is important to us. We collect and process only the data needed to create your profile, match you with opportunities, and improve your experience on the platform.",
        icon: <FaLock />
      },
      {
        question: "Who can view my information?",
        answer: "Only authorized members of our team and relevant verified users (e.g., investors matched with SMEs) can view the information required for engagement. Sensitive details are kept strictly confidential.",
        icon: <FaShieldAlt />
      },
      {
        question: "Is my information shared with third parties?",
        answer: "We do not sell or rent personal data. Limited information may be shared only where required for functionality (e.g., when an SME connects with an investor, or when an intern applies for a position).",
        icon: <FaUsers />
      },
      {
        question: "How is my data kept safe?",
        answer: "All user data is stored on secure servers with encryption, secure access controls, and regular system audits to ensure compliance with data protection standards.",
        icon: <FaLock />
      },
      {
        question: "What laws govern your data protection policies?",
        answer: "Our operations comply with applicable African data protection and e-commerce laws, including South Africa's Protection of Personal Information Act (POPIA) and related standards.",
        icon: <FaGlobe />
      },
      {
        question: "Is Big Marketplace Africa responsible for partnership outcomes?",
        answer: "No. We facilitate connections but are not responsible for outcomes, business decisions, or financial losses that occur between users. All partnerships are entered into directly between users.",
        icon: <FaHandshake />
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
        answer: "Yes, all registered participants receive relevant scores:\n• SMEs get comprehensive business scores\n• Advisors receive credibility scores\n• Graduates/interns get performance metrics\n• All scores help ensure quality matches",
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

  const toggleQuestion = (index) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };

  const renderStakeholdersContent = () => {
    return faqData.stakeholders.map((section, sectionIndex) => (
      <div key={sectionIndex}>
        <SectionHeader>
          {section.section === "Advisors" && <FaUserTie />}
          {section.section === "Interns & Graduates" && <FaGraduationCap />}
          {section.section === "Catalysts" && <FaRocket />}
          {section.section === "Services & Suppliers" && <FaTools />}
          {section.section}
        </SectionHeader>
        {section.questions.map((item, index) => {
          const globalIndex = sectionIndex * 10 + index;
          return (
            <FAQItem key={globalIndex}>
              <FAQQuestion onClick={() => toggleQuestion(globalIndex)} aria-expanded={openQuestion === globalIndex}>
                <QuestionText>
                  {item.icon}
                  {item.question}
                </QuestionText>
                <IconWrapper isOpen={openQuestion === globalIndex}>
                  {openQuestion === globalIndex ? <MinusIcon /> : <PlusIcon />}
                </IconWrapper>
              </FAQQuestion>
              <FAQAnswer isOpen={openQuestion === globalIndex} aria-hidden={!openQuestion === globalIndex}>
                <p>{item.answer}</p>
              </FAQAnswer>
            </FAQItem>
          );
        })}
      </div>
    ));
  };

  const renderContent = () => {
    if (activeTab === 'stakeholders') {
      return <FAQList>{renderStakeholdersContent()}</FAQList>;
    }

    return (
      <FAQList>
        {faqData[activeTab].map((item, index) => (
          <FAQItem key={index}>
            <FAQQuestion onClick={() => toggleQuestion(index)} aria-expanded={openQuestion === index}>
              <QuestionText>
                {item.icon}
                {item.question}
              </QuestionText>
              <IconWrapper isOpen={openQuestion === index}>
                {openQuestion === index ? <MinusIcon /> : <PlusIcon />}
              </IconWrapper>
            </FAQQuestion>
            <FAQAnswer isOpen={openQuestion === index} aria-hidden={!openQuestion === index}>
              <p>{item.answer}</p>
            </FAQAnswer>
          </FAQItem>
        ))}
      </FAQList>
    );
  };

  return (
    <PageWrapper>
      <Header />
      
      <MainContent>
        <FAQContainer>
          <Title>
            <FaQuestionCircle /> Help Center
          </Title>
          <Subtitle>
            <FaInfoCircle /> Find answers about our platform, matching system, BIG Score, subscriptions, and how we connect SMEs with growth opportunities across Africa.
          </Subtitle>
          
          <TabsContainer>
            <Tab 
              active={activeTab === 'general'} 
              onClick={() => {
                setActiveTab('general');
                setOpenQuestion(null);
              }}
            >
              <FaShieldAlt /> General
            </Tab>
            <Tab 
              active={activeTab === 'funding'} 
              onClick={() => {
                setActiveTab('funding');
                setOpenQuestion(null);
              }}
            >
              <FaChartLine /> Funding
            </Tab>
            <Tab 
              active={activeTab === 'stakeholders'} 
              onClick={() => {
                setActiveTab('stakeholders');
                setOpenQuestion(null);
              }}
            >
              <FaUsers /> Stakeholders
            </Tab>
            <Tab 
              active={activeTab === 'subscriptions'} 
              onClick={() => {
                setActiveTab('subscriptions');
                setOpenQuestion(null);
              }}
            >
              <FaCreditCard /> Subscriptions
            </Tab>
            <Tab 
              active={activeTab === 'privacy'} 
              onClick={() => {
                setActiveTab('privacy');
                setOpenQuestion(null);
              }}
            >
              <FaLock /> Privacy
            </Tab>
            <Tab 
              active={activeTab === 'bigScore'} 
              onClick={() => {
                setActiveTab('bigScore');
                setOpenQuestion(null);
              }}
            >
              <FaStar /> BIG Score
            </Tab>
          </TabsContainer>

          {renderContent()}
        </FAQContainer>
      </MainContent>
      
      <Footer />
    </PageWrapper>
  );
};

export default FAQPage;