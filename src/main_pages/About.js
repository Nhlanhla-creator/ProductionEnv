import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { FaUsers, FaLightbulb, FaHandshake, FaChartLine, FaGlobeAmericas } from 'react-icons/fa';
import { MdDiversity3 } from 'react-icons/md';

const AboutPage = () => {
  return (
    <div className="about-page">
      <Header />
      
      <main className="about-content">
        {/* Hero Section */}
        <section className="about-hero">
          <div className="hero-overlay">
            <h1>Who We Are</h1>
            <p className="hero-subtitle">Empowering businesses through innovative financial solutions and strategic partnerships</p>
          </div>
          <div className="curve-divider"></div>
        </section>

        {/* Mission Section */}
        <section className="mission-section">
          <div className="curve-divider-top"></div>
          <div className="container">
            <h2>Our Mission</h2>
            <div className="mission-grid">
              <div className="mission-card">
                <FaHandshake className="mission-icon" />
                <h3>Partnership</h3>
                <p>Building lasting relationships with our clients based on trust and mutual success.</p>
              </div>
              <div className="mission-card">
                <FaChartLine className="mission-icon" />
                <h3>Growth</h3>
                <p>Providing tools and resources to help businesses scale sustainably.</p>
              </div>
              <div className="mission-card">
                <FaLightbulb className="mission-icon" />
                <h3>Innovation</h3>
                <p>Developing cutting-edge financial solutions for modern challenges.</p>
              </div>
            </div>
          </div>
          <div className="curve-divider-bottom"></div>
        </section>

        {/* Values Section */}
        <section className="values-section">
          <div className="curve-divider-top"></div>
          <div className="container">
            <h2>Our Core Values</h2>
            <div className="values-grid">
              <div className="value-item">
                <MdDiversity3 className="value-icon" />
                <h3>Diversity</h3>
                <p>We celebrate diverse perspectives that drive innovation and creativity.</p>
              </div>
              <div className="value-item">
                <FaUsers className="value-icon" />
                <h3>Integrity</h3>
                <p>We conduct business with honesty, transparency, and ethical practices.</p>
              </div>
              <div className="value-item">
                <FaGlobeAmericas className="value-icon" />
                <h3>Sustainability</h3>
                <p>We're committed to solutions that benefit businesses and communities long-term.</p>
              </div>
            </div>
          </div>
          <div className="curve-divider-bottom"></div>
        </section>

        {/* Team Section */}
        <section className="team-section">
          <div className="curve-divider-top"></div>
          <div className="container">
            <h2>Our Leadership</h2>
            <div className="team-grid">
              <div className="team-member">
                <div className="member-image placeholder-1"></div>
                <h3>Alex Johnson</h3>
                <p className="position">CEO & Founder</p>
                <p className="bio">20+ years in financial services with a passion for SME growth.</p>
              </div>
              <div className="team-member">
                <div className="member-image placeholder-2"></div>
                <h3>Maria Garcia</h3>
                <p className="position">Chief Operations Officer</p>
                <p className="bio">Operations expert focused on scaling businesses efficiently.</p>
              </div>
              <div className="team-member">
                <div className="member-image placeholder-3"></div>
                <h3>David Kim</h3>
                <p className="position">Chief Technology Officer</p>
                <p className="bio">Fintech innovator building the platforms of tomorrow.</p>
              </div>
            </div>
          </div>
          <div className="curve-divider-bottom"></div>
        </section>
      </main>

      <Footer />

      {/* CSS Styles */}
      <style jsx>{`
        .about-page {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          overflow-x: hidden;
        }
        
        .about-content {
          flex: 1;
        }
        
        /* Hero Section */
        .about-hero {
          background: linear-gradient(rgba(42, 33, 29, 0.85), rgba(42, 33, 29, 0.85)), 
                      url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80');
          background-size: cover;
          background-position: center;
          height: 500px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: white;
          padding: 0 20px;
          position: relative;
        }
        
        .hero-overlay {
          max-width: 800px;
          z-index: 1;
        }
        
        .about-hero h1 {
          font-size: 4rem;
          margin-bottom: 1.5rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .hero-subtitle {
          font-size: 1.5rem;
          margin-bottom: 2rem;
          font-weight: 300;
          line-height: 1.6;
        }
        
        /* Curve Dividers */
        .curve-divider {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          overflow: hidden;
          line-height: 0;
          transform: rotate(180deg);
        }
        
        .curve-divider svg {
          position: relative;
          display: block;
          width: calc(100% + 1.3px);
          height: 100px;
        }
        
        .curve-divider .shape-fill {
          fill: #F9F7F0;
        }
        
        .curve-divider-top {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          overflow: hidden;
          line-height: 0;
        }
        
        .curve-divider-bottom {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          overflow: hidden;
          line-height: 0;
          transform: rotate(180deg);
        }
        
        .curve-divider-top svg,
        .curve-divider-bottom svg {
          position: relative;
          display: block;
          width: calc(100% + 1.3px);
          height: 100px;
        }
        
        .curve-divider-top .shape-fill {
          fill: #1E1A18;
        }
        
        .curve-divider-bottom .shape-fill {
          fill: #1E1A18;
        }
        
        /* Container */
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 20px;
          position: relative;
        }
        
        /* Mission Section */
        .mission-section {
          background-color: #F9F7F0;
          position: relative;
        }
        
        .mission-section h2 {
          text-align: center;
          margin-bottom: 50px;
          color: #2A211D;
          font-size: 2.5rem;
        }
        
        .mission-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
        }
        
        .mission-card {
          background: white;
          padding: 40px 30px;
          border-radius: 8px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.05);
          text-align: center;
          transition: all 0.3s ease;
        }
        
        .mission-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.1);
        }
        
        .mission-icon {
          font-size: 3rem;
          color: #754A2D;
          margin-bottom: 20px;
        }
        
        .mission-card h3 {
          color: #2A211D;
          margin-bottom: 15px;
          font-size: 1.5rem;
        }
        
        /* Values Section */
        .values-section {
          background-color: #1E1A18;
          position: relative;
        }
        
        .values-section h2 {
          text-align: center;
          margin-bottom: 50px;
          color: #F2F0E6;
          font-size: 2.5rem;
        }
        
        .values-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
        }
        
        .value-item {
          text-align: center;
          padding: 40px 30px;
          background: #2A211D;
          border-top: 4px solid #9E6E3C;
          border-bottom: 4px solid #9E6E3C;
          transition: all 0.3s ease;
        }
        
        .value-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        
        .value-icon {
          font-size: 3rem;
          color: #F2F0E6;
          margin-bottom: 20px;
        }
        
        .value-item h3 {
          color: #F2F0E6;
          margin-bottom: 15px;
          font-size: 1.5rem;
        }
        
        .value-item p {
          color: #D9D5CC;
        }
        
        /* Team Section */
        .team-section {
          background-color: #F9F7F0;
          position: relative;
        }
        
        .team-section h2 {
          text-align: center;
          margin-bottom: 50px;
          color: #2A211D;
          font-size: 2.5rem;
        }
        
        .team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
        }
        
        .team-member {
          background: white;
          padding: 40px 30px;
          border-radius: 8px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.05);
          text-align: center;
          transition: all 0.3s ease;
          border: 2px solid #D9D5CC;
        }
        
        .team-member:hover {
          transform: translateY(-5px);
          border-color: #9E6E3C;
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        
        .member-image {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          margin: 0 auto 20px;
          background-size: cover;
          background-position: center;
        }
        
        .placeholder-1 {
          background: linear-gradient(45deg, #F2F0E6, #9E6E3C);
        }
        
        .placeholder-2 {
          background: linear-gradient(45deg, #F2F0E6, #754A2D);
        }
        
        .placeholder-3 {
          background: linear-gradient(45deg, #F2F0E6, #5D432C);
        }
        
        .team-member h3 {
          color: #2A211D;
          margin-bottom: 5px;
          font-size: 1.5rem;
        }
        
        .position {
          color: #9E6E3C;
          font-weight: 600;
          margin-bottom: 15px;
        }
        
        .bio {
          color: #5D432C;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .about-hero h1 {
            font-size: 2.5rem;
          }
          
          .hero-subtitle {
            font-size: 1.2rem;
          }
          
          .container {
            padding: 60px 20px;
          }
        }
      `}</style>

      {/* SVG for curve dividers */}
      <svg className="curve-divider" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" className="shape-fill"></path>
        <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" className="shape-fill"></path>
        <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" className="shape-fill"></path>
      </svg>

      <svg className="curve-divider-top" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" className="shape-fill"></path>
        <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" className="shape-fill"></path>
        <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" className="shape-fill"></path>
      </svg>

      <svg className="curve-divider-bottom" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" className="shape-fill"></path>
        <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" className="shape-fill"></path>
        <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" className="shape-fill"></path>
      </svg>
    </div>
  );
};

export default AboutPage;
