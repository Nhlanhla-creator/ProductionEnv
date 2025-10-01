import React, { useState } from 'react';
import { FaPaperPlane, FaCircle, FaRegDotCircle, FaCheck } from 'react-icons/fa';
import Header from './HeaderProgram';
import Footer from '../SMEs/HomeFooter';
import Sidebar from '../../program_sponsor/sidebar/ProgramSponsorSidebar';
import styled from 'styled-components';
import emailjs from '@emailjs/browser';
import { API_KEYS } from "../../API.js"

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-image: linear-gradient(rgba(242, 240, 230, 0.38), rgba(242, 240, 230, 0.09)), url(/background10.jpg);
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  font-family: "'Neue Haas Grotesk Text Pro', sans-serif";
`;

const ContentWrapper = styled.div`
  display: flex;
  flex: 1;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  overflow-y: auto;
`;

const FormContainer = styled.div`
  max-width: 800px;
  width: 100%;
  margin: 2rem 0;
  padding: 3rem;
  background-color: rgba(242, 240, 230, 0.85);
  border-radius: 20px;
  border: 2px dashed #9E6E3C;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(55, 44, 39, 0.15);
  backdrop-filter: blur(2px);
`;

const DecorativeShape1 = styled.div`
  position: absolute;
  top: -30px;
  right: -30px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 2px solid #754A2D;
  opacity: 0.3;
`;

const DecorativeShape2 = styled.div`
  position: absolute;
  bottom: -20px;
  left: -20px;
  width: 80px;
  height: 80px;
  border: 2px dashed #BCAE9C;
  transform: rotate(45deg);
  opacity: 0.4;
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: 600;
  color: #372C27;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  z-index: 1;
  text-align: center;
`;

const IntroMessage = styled.div`
  color: #372C27;
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  text-align: center;
  position: relative;
  z-index: 1;
  background-color: rgba(242, 240, 230, 0.7);
  padding: 1.5rem;
  border-radius: 12px;
  border-left: 4px solid #9E6E3C;
`;

const FormGroup = styled.div`
  margin-bottom: 1.8rem;
  position: relative;
  z-index: 1;
`;

const Input = styled.input`
  width: 100%;
  padding: 1.2rem;
  border-radius: 12px;
  border: 2px solid #BCAE9C;
  background-color: rgba(255, 255, 255, 0.8);
  font-family: "'Neue Haas Grotesk Text Pro', sans-serif";
  font-size: 1rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #9E6E3C;
    box-shadow: 0 0 0 3px rgba(158, 110, 60, 0.2);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 1.2rem;
  border-radius: 12px;
  border: 2px solid #BCAE9C;
  background-color: rgba(255, 255, 255, 0.8);
  font-family: "'Neue Haas Grotesk Text Pro', sans-serif";
  font-size: 1rem;
  transition: all 0.3s ease;
  min-height: 180px;

  &:focus {
    outline: none;
    border-color: #9E6E3C;
    box-shadow: 0 0 0 3px rgba(158, 110, 60, 0.2);
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 1.2rem;
  border: none;
  border-radius: 12px;
  background-color: #9E6E3C;
  color: #F2F0E6;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    background-color: #754A2D;
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(117, 74, 45, 0.3);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const Dots = styled.div`
  position: absolute;
  right: 30px;
  top: 40px;
  color: #9E6E3C;
  opacity: 0.1;
  font-size: 1.5rem;
`;

const SuccessMessage = styled.div`
  background-color: rgba(158, 110, 60, 0.1);
  border: 2px solid #9E6E3C;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  text-align: center;
  color: #372C27;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const ErrorMessage = styled.div`
  background-color: rgba(231, 76, 60, 0.1);
  border: 2px solid #e74c3c;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
  color: #372C27;
`;

const SuccessIcon = styled(FaCheck)`
  color: #9E6E3C;
  font-size: 2.5rem;
`;

const SuccessText = styled.div`
  font-size: 1.2rem;
  font-weight: 500;
`;

const EmailNote = styled.div`
  font-size: 0.9rem;
  font-style: italic;
  opacity: 0.8;
`;

const AnotherMessageButton = styled.button`
  width: 100%;
  padding: 1.2rem;
  border: none;
  border-radius: 12px;
  background-color: #372C27;
  color: #F2F0E6;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;

  &:hover {
    background-color: #1a130e;
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(117, 74, 45, 0.3);
  }
`;

const ContactProgram = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  // EmailJS Configuration
  const emailjsConfig = {
    serviceId: API_KEYS.SERVICE_ID,
    templateId: API_KEYS.TEMPLATE_ID,
    autoReplyTemplateId: API_KEYS.AUTORESPONSE_TEMPLATE,
    publicKey: API_KEYS.PUBLIC_KEY
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setError(null);
    
    try {
      // Validate input
      if (!formData.name.trim()) throw new Error('Name is required');
      if (!formData.email.trim()) throw new Error('Email is required');
      if (!formData.message.trim()) throw new Error('Message is required');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Initialize EmailJS (if not already initialized)
      if (!emailjs.init) {
        emailjs.init(emailjsConfig.publicKey);
      }

      // Main email to business
      await emailjs.send(
        emailjsConfig.serviceId,
        emailjsConfig.templateId,
        {
          from_name: formData.name,
          from_email: formData.email,
          subject: formData.subject || 'No Subject',
          message: formData.message,
          to_email: 'hello@bigmarketplace.africa'
        },
        emailjsConfig.publicKey
      );

      // Auto-reply to user
      await emailjs.send(
        emailjsConfig.serviceId,
        emailjsConfig.autoReplyTemplateId,
        {
          to_email: formData.email,
          to_name: formData.name,
          subject: `Re: ${formData.subject || 'Your message'}`
        },
        emailjsConfig.publicKey
      );

      setIsSubmitted(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (err) {
      console.error('Email sending error:', err);
      setError(err.response?.text || err.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <PageWrapper>
      <Header />
      
      <ContentWrapper>
        <SidebarContainer>
          <Sidebar />
        </SidebarContainer>
        
        <MainContent>
          <FormContainer>
            <DecorativeShape1 />
            <DecorativeShape2 />
            <Dots>
              <FaCircle />
              <FaRegDotCircle />
              <FaCircle />
            </Dots>
            
            <Title>
              <FaPaperPlane />
              Send Us a Message
            </Title>

            <IntroMessage>
              At BIG Marketplace, your success is our priority. As your trusted partner, we are dedicated to helping your business grow, adapt, and thrive in an ever-changing landscape. Let's achieve greatness together. Get in touch with us today to start your journey toward sustainable success.
            </IntroMessage>
            
            {error && (
              <ErrorMessage>
                {error}
              </ErrorMessage>
            )}
            
            {isSubmitted ? (
              <SuccessMessage>
                <SuccessIcon />
                <SuccessText>Your message has been sent successfully!</SuccessText>
                <EmailNote>We've received your message and will respond to you at {formData.email || 'your email'} soon.</EmailNote>
                <AnotherMessageButton onClick={() => setIsSubmitted(false)}>
                  Send Another Message
                </AnotherMessageButton>
              </SuccessMessage>
            ) : (
              <form onSubmit={handleSubmit}>
                <FormGroup>
                  <Input 
                    type="text" 
                    name="name"
                    placeholder="Your Name" 
                    value={formData.name}
                    onChange={handleChange}
                    required 
                  />
                </FormGroup>
                
                <FormGroup>
                  <Input 
                    type="email" 
                    name="email"
                    placeholder="Your Email" 
                    value={formData.email}
                    onChange={handleChange}
                    required 
                  />
                </FormGroup>
                
                <FormGroup>
                  <Input 
                    type="text" 
                    name="subject"
                    placeholder="Subject" 
                    value={formData.subject}
                    onChange={handleChange}
                  />
                </FormGroup>
                
                <FormGroup>
                  <TextArea 
                    name="message"
                    placeholder="Your Message..." 
                    rows="6" 
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
                
                <SubmitButton type="submit" disabled={isSending}>
                  {isSending ? 'Sending...' : (
                    <>
                      <FaPaperPlane /> Send Message
                    </>
                  )}
                </SubmitButton>
              </form>
            )}
          </FormContainer>
        </MainContent>
      </ContentWrapper>
    
      <Footer />
    </PageWrapper>
  );
};

export default ContactProgram;