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
  FaIndustry
} from 'react-icons/fa';
import HomeHeader from './HeaderCatalysts';
import Footer from '../SMEs/HomeFooter';
import Sidebar from '../../catalyst/CatalystSidebar/AcceleratorSidebar';

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

const ContentWrapper = styled.div`
  display: flex;
  flex: 1;
 margin-left: -300px; 
`;

const SidebarContainer = styled.div`
  width: 300px;
  min-width: 300px;
  background-color: #f5f5f5;
  border-right: 1px solid #D3D2CE;
  position: sticky;
  top: 80px;
  height: calc(100vh - 80px);
  overflow-y: auto;
  padding: 20px 0;

  @media (max-width: 768px) {
    display: none;
  }
`;

const MainContent = styled.main`
  flex: 1;
  animation: ${fadeIn} 0.6s ease-out;
  padding: 4rem 40px;
  box-sizing: border-box;
  overflow-y: auto;

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

const FAQsCatalysts = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [openQuestion, setOpenQuestion] = useState(null);

  const faqData = {
    general: [
      {
        question: "What is this platform for?",
        answer: "This platform helps SMEs find funding, connect with service providers, or offer their services to other businesses in need.",
        icon: <FaQuestionCircle />
      },
      {
        question: "Who can register?",
        answer: "Any legally registered SME or business operating in South Africa or selected African countries.",
        icon: <FaShieldAlt />
      },
      {
        question: "Is registration free?",
        answer: "Yes, basic registration is completely free. There may be premium or verified listings available for a fee.",
        icon: <FaMoneyBillWave />
      },
      {
        question: "Can I update my profile later?",
        answer: "Yes. You can edit your business profile, update your documents, or change your funding and service preferences anytime.",
        icon: <FaCogs />
      },
      {
        question: "Is my data secure?",
        answer: "Absolutely. The platform uses encryption and privacy best practices to protect all your personal and business information.",
        icon: <FaShieldAlt />
      }
    ],
    funding: [
      {
        question: "What type of funding can I apply for?",
        answer: "You can apply for the following:\n• Equity Investment\n• Debt Financing\n• Grants\n• Growth Enablers (like accelerators, incubators, mentorship)",
        icon: <FaMoneyBillWave />
      },
      {
        question: "How long does it take to get feedback on funding applications?",
        answer: "Usually 2–4 weeks, depending on how complete your profile and documents are.",
        icon: <FaChartLine />
      },
      {
        question: "What documents do I need for funding?",
        answer: "Investors usually want:\n• A pitch deck\n• Registration certificate\n• Financial summary or revenue reports\n• A clear business model or growth plan",
        icon: <FaShieldAlt />
      },
      {
        question: "How does the BIG Score impact the success rate of SMEs on your platform?",
        answer: "The BIG Score impacts the success rate of SMEs on your platform by providing a data-driven legitimacy and fundability assessment that enhances access to capital and support, reduces transaction friction, and improves investor confidence.",
        icon: <FaStar />
      },
      {
        question: "How does the BIG Score correlate with revenue growth for SMEs?",
        answer: "The BIG Score correlates positively with revenue growth for SMEs by serving as an objective, data-driven indicator of their legitimacy, fundability, and operational readiness, which in turn facilitates access to capital, customers, and support services that drive growth.",
        icon: <FaChartLine />
      }
    ],
    service: [
      {
        question: "Can I register as a service provider?",
        answer: "Yes. If you offer services like legal support, accounting, marketing, IT, logistics, or business development, you can join the platform as a service provider.",
        icon: <FaTools />
      },
      {
        question: "How do SMEs find my services?",
        answer: "Through searches, filters, and matchmaking based on service type, location, and business needs — similar to how dating apps match profiles.",
        icon: <FaHandshake />
      },
      {
        question: "What specific digital tools contribute most to improving the BIG Score?",
        answer: "The specific digital tools that contribute most to improving the BIG Score are those that enable real-time data collection, interactive feedback, AI-driven analysis, and SME engagement to enhance legitimacy, fundability, and readiness.",
        icon: <FaCogs />
      },
      {
        question: "How does the BIG Score impact the ability of SMEs to reach international markets?",
        answer: "The BIG Score impacts SMEs' ability to reach international markets by serving as a comprehensive indicator of their legitimacy, fundability, and operational readiness—key factors that influence export propensity, participation, and success.",
        icon: <FaGlobe />
      },
      {
        question: "Are there any industry-specific strategies to enhance the BIG Score?",
        answer: "Industry-specific strategies to enhance the BIG Score focus on tailoring compliance, readiness, and fundability improvements to the unique requirements, risks, and opportunities within each sector.",
        icon: <FaIndustry />
      }
    ],
    bigScore: [
      {
        question: "How does the BIG Score influence the ability of SMEs to diversify their customer base?",
        answer: "The BIG Score influences SMEs' ability to diversify their customer base by enhancing their legitimacy, fundability, and operational readiness, which are critical factors for building trust, meeting quality standards, and accessing new markets and customers.",
        icon: <FaUsers />
      },
      {
        question: "How does the BIG Score affect SMEs' ability to innovate?",
        answer: "The BIG Score positively influences SMEs' ability to innovate by enhancing their legitimacy, fundability, and operational readiness—critical factors that enable SMEs to invest in and manage innovation processes effectively.",
        icon: <FaLightbulb />
      },
      {
        question: "How does the BIG Score impact SMEs' access to external innovation resources?",
        answer: "The BIG Score positively impacts SMEs' ability to access external innovation resources by enhancing their legitimacy, fundability, and readiness, which are critical factors for overcoming common barriers to innovation collaboration and support.",
        icon: <FaLightbulb />
      },
      {
        question: "What specific digital tools contribute most to improving the BIG Score?",
        answer: "The digital tools that contribute most to improving the BIG Score are those that enable comprehensive data collection, real-time feedback, AI-driven analysis, and SME engagement to enhance legitimacy, fundability, and readiness.",
        icon: <FaCogs />
      },
      {
        question: "How does the BIG Score impact the success rate of SMEs on your platform?",
        answer: "The BIG Score significantly enhances the success rate of SMEs on your platform by leveraging data-driven insights and digital tools to improve their fundability, legitimacy, and growth potential.",
        icon: <FaStar />
      }
    ]
  };

  const toggleQuestion = (index) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };

  return (
    <PageWrapper>
      <HomeHeader />
      
      <ContentWrapper>
        <SidebarContainer>
          <Sidebar />
        </SidebarContainer>
        
        <MainContent>
          <FAQContainer>
            <Title>
              <FaQuestionCircle /> Help Center
            </Title>
            <Subtitle>
              <FaInfoCircle /> Find answers to common questions about our platform, funding opportunities, services, and how the BIG Score works to empower your business growth.
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
                active={activeTab === 'service'} 
                onClick={() => {
                  setActiveTab('service');
                  setOpenQuestion(null);
                }}
              >
                <FaTools /> Service
              </Tab>
              <Tab 
                active={activeTab === 'bigScore'} 
                onClick={() => {
                  setActiveTab('bigScore');
                  setOpenQuestion(null);
                }}
              >
                <FaHandshake /> BIG Score
              </Tab>
            </TabsContainer>

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
          </FAQContainer>
        </MainContent>
      </ContentWrapper>
      
      <Footer />
    </PageWrapper>
  );
};

export default FAQsCatalysts;