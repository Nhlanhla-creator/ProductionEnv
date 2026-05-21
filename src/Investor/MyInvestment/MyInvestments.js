// MyInvestments.js
import React, { useState, useEffect, useRef } from 'react';
import {
  FiEye,
  FiBarChart2,
  FiShield,
  FiDollarSign as FiLiquidity,
  FiDownload,
  FiX
} from 'react-icons/fi';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Subscription gating
import { db, auth } from "../../firebaseConfig"
import Upsell from "../../components/Upsell/Upsell"
import useSubscriptionPlan from "../../hooks/useSubscriptionPlan"

// Import all tab components
import PortfolioOverview from './PortfolioOverview';
import PerformanceRiskDashboard from './PerformanceRiskDashboard';
import DataIntegrityTrustLayer from './DataIntegrityTrustLayer';
import ExitLiquidityMetrics from './ExitLiquidityMetrics';

// Styles for MyInvestments
const styles = `
/* Main container */
.investments-container {
  padding: 20px;
  min-height: 100vh;
  background-color: #f9f9f9;
}

/* Content area */
.investments-content {
  max-width: 1400px;
  margin: 0 auto;
}

/* Page title */
.investments-title {
  font-size: 24px;
  font-weight: 700;
  color: #5e3f26;
  margin-bottom: 25px;
  padding-left: 10px;
}

/* Tabs container */
.tabs-container {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  background-color: white;
  border-radius: 12px;
  padding: 6px;
  border: 1px solid #d4bca8;
  box-shadow: 0 2px 8px rgba(59, 36, 9, 0.06);
  margin-bottom: 0;
}

/* Tab button */
.tab-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 18px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  flex: 1;
  justify-content: center;
  transition: all 0.15s ease;
  background-color: transparent;
  color: #7d5a36;
}

.tab-btn:hover {
  background-color: rgba(125, 90, 54, 0.1);
}

.tab-btn.active {
  background-color: #7d5a36;
  color: white;
  font-weight: 600;
  box-shadow: 0 3px 10px rgba(166, 124, 82, 0.3);
}

.tab-icon {
  font-size: 14px;
}

/* Tab underline */
.tab-underline {
  height: 3px;
  background-color: #7d5a36;
  border-radius: 0 0 4px 4px;
  margin-bottom: 20px;
}

/* Purpose section */
.purpose-section {
  background-color: white;
  border-left: 4px solid #7d5a36;
  border-radius: 0 8px 8px 0;
  padding: 12px 16px;
  margin-bottom: 20px;
  font-size: 13px;
  color: #5e3f26;
  box-shadow: 0 1px 4px rgba(59, 36, 9, 0.05);
}

.purpose-label {
  font-weight: 700;
  color: #3d2a1f;
}

/* Section header */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 20px;
  padding: 0 10px;
}

.section-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-shrink: 0;
}

/* Download button */
.download-section-btn {
  background: #7d5a36;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: all 0.15s ease;
}

.download-section-btn:hover {
  background: #5e3f26;
}

/* Download Options */
.download-options {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.download-options-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90%;
}

.download-options-content h4 {
  margin: 0 0 20px 0;
  color: #5e3f26;
  font-size: 18px;
  text-align: center;
}

.download-options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.download-options-list button {
  padding: 12px 20px;
  border: 2px solid #7d5a36;
  background: white;
  color: #7d5a36;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  text-align: left;
}

.download-options-list button:hover {
  background: #7d5a36;
  color: white;
}

.close-download {
  width: 100%;
  padding: 12px;
  border: 2px solid #666;
  background: white;
  color: #666;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.close-download:hover {
  background: #666;
  color: white;
}

/* Popup Styles */
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.popup-container {
  background: white;
  border-radius: 12px;
  padding: 30px;
  max-width: 90%;
  max-height: 90%;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.popup-close {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 20px;
  color: #666;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
}

.popup-close:hover {
  background: #f0f0f0;
  color: #333;
}

.popup-content {
  width: 100%;
}

/* Section content */
.section-content {
  width: 100%;
  min-height: 600px;
}

/* Responsive design */
@media (max-width: 768px) {
  .investments-container {
    padding: 15px;
  }
  
  .tabs-container {
    gap: 4px;
    padding: 4px;
  }
  
  .tab-btn {
    padding: 8px 12px;
    font-size: 11px;
  }
  
  .tab-icon {
    font-size: 12px;
  }
  
  .section-header {
    flex-direction: column;
    gap: 15px;
  }
  
  .section-controls {
    width: 100%;
    justify-content: flex-end;
  }
  
  .download-section-btn {
    padding: 8px 16px;
    font-size: 12px;
  }
}

@media (max-width: 576px) {
  .investments-title {
    font-size: 20px;
    margin-bottom: 15px;
  }
  
  .tab-btn {
    padding: 6px 10px;
    font-size: 10px;
  }
  
  .purpose-section {
    font-size: 11px;
    padding: 10px 12px;
  }
}
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

const MyInvestments = () => {
  const [activeTab, setActiveTab] = useState('portfolio-overview');
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [popupContent, setPopupContent] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const { currentPlan, subscriptionLoading } = useSubscriptionPlan(currentUser?.uid);
  const sectionRef = useRef(null);

  // Tab configuration matching portfolio.js design
  const MY_PORTFOLIO_TABS = [
    { id: "portfolio-overview", label: "Portfolio Overview", icon: FiEye, purpose: "Track portfolio composition, funder health efficiency, and overall portfolio performance across your investment ecosystem." },
    { id: "performance-risk",    label: "Performance & Risk Dashboard", icon: FiBarChart2, purpose: "Track financial growth, revenue, profitability, default rates, and ESG impact performance across the portfolio." },
    { id: "data-integrity",     label: "Data Integrity & Trust Layer", icon: FiShield, purpose: "Ensure transparency, compliance, and auditability with AI-driven insights and recommendations." },
    { id: "liquidity-exits",    label: "Exit & Liquidity Metrics", icon: FiLiquidity, purpose: "Monitor exit activity, returns, time to exit, and liquidity flow across sectors." },
  ];

  // Get current user from Firebase auth
  useEffect(() => {
    const getCurrentUser = () => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          setCurrentUser(user);
        }
      });
      return unsubscribe;
    };

    getCurrentUser();
  }, []);

  // Popup functionality
  const openPopup = (content) => {
    setPopupContent(content);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupContent(null);
  };

  // Download functionality
  const downloadSectionAsPDF = async (sectionName = 'all') => {
    try {
      const originalTab = activeTab;
      
      if (sectionName === 'all') {
        const pdf = new jsPDF('landscape', 'mm', 'a4');
        let currentPage = 1;
        
        for (const tab of MY_PORTFOLIO_TABS) {
          setActiveTab(tab.id);
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const element = document.querySelector('.section-content');
          if (!element) continue;

          const canvas = await html2canvas(element, {
            scale: 1.5,
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#ffffff',
            scrollY: -window.scrollY,
            height: element.scrollHeight,
            windowHeight: element.scrollHeight
          });

          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pdf.internal.pageSize.getWidth() - 20;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          if (currentPage > 1) {
            pdf.addPage();
          }
          
          pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
          currentPage++;
        }
        
        setActiveTab(originalTab);
        pdf.save('MyInvestments_Complete_Report.pdf');
      } else {
        setActiveTab(sectionName);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const element = document.querySelector('.section-content');
        if (!element) return;

        const canvas = await html2canvas(element, {
          scale: 1.5,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          scrollY: -window.scrollY,
          height: element.scrollHeight,
          windowHeight: element.scrollHeight
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('landscape', 'mm', 'a4');
        const imgWidth = pdf.internal.pageSize.getWidth() - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        
        const tabLabel = MY_PORTFOLIO_TABS.find(t => t.id === sectionName)?.label || sectionName;
        const fileName = `MyInvestments_${tabLabel.replace(/\s+/g, '_')}.pdf`;
        pdf.save(fileName);
        
        setActiveTab(originalTab);
      }
      setShowDownloadOptions(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  // Purpose Component
  const PurposeSection = ({ purpose }) => (
    <div className="purpose-section">
      <span className="purpose-label">Purpose: </span>
      {purpose}
    </div>
  );

  // Download Options Component
  const DownloadOptions = () => (
    <div className="download-options">
      <div className="download-options-content">
        <h4>Download Report</h4>
        <div className="download-options-list">
          <button onClick={() => downloadSectionAsPDF('all')}>All Sections</button>
          {MY_PORTFOLIO_TABS.map(tab => (
            <button key={tab.id} onClick={() => downloadSectionAsPDF(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>
        <button className="close-download" onClick={() => setShowDownloadOptions(false)}>
          Close
        </button>
      </div>
    </div>
  );

  // Popup Component
  const Popup = () => {
    if (!showPopup) return null;

    return (
      <div className="popup-overlay" onClick={closePopup}>
        <div className="popup-container" onClick={(e) => e.stopPropagation()}>
          <button className="popup-close" onClick={closePopup}>
            <FiX />
          </button>
          {popupContent}
        </div>
      </div>
    );
  };

  // Render the active tab component
  const renderTabContent = () => {
    switch (activeTab) {
      case 'portfolio-overview':
        return <PortfolioOverview openPopup={openPopup} downloadSectionAsPDF={downloadSectionAsPDF} currentUser={currentUser} />;
      case 'performance-risk':
        return <PerformanceRiskDashboard openPopup={openPopup} downloadSectionAsPDF={downloadSectionAsPDF} currentUser={currentUser} />;
      case 'data-integrity':
        return <DataIntegrityTrustLayer openPopup={openPopup} downloadSectionAsPDF={downloadSectionAsPDF} currentUser={currentUser} />;
      case 'liquidity-exits':
        return <ExitLiquidityMetrics openPopup={openPopup} downloadSectionAsPDF={downloadSectionAsPDF} currentUser={currentUser} />;
      default:
        return <PortfolioOverview openPopup={openPopup} downloadSectionAsPDF={downloadSectionAsPDF} currentUser={currentUser} />;
    }
  };

  const currentTab = MY_PORTFOLIO_TABS.find(t => t.id === activeTab);

  // Container styles
  const getContainerStyles = () => ({
    width: "100%",
    minHeight: "100vh",
    maxWidth: "100vw",
    overflowX: "hidden",
    padding: "20px",
    margin: "0",
    boxSizing: "border-box",
    position: "relative",
    transition: "padding 0.3s ease",
    backgroundColor: "#f8f9fa",
  });

  // Subscription gating render guards
  if (subscriptionLoading) {
    return (
      <div className="investments-container" style={getContainerStyles()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div style={{ textAlign: "center", color: "#6d4c41" }}>
            <h2>Checking subscription...</h2>
          </div>
        </div>
      </div>
    );
  }

  // Uncomment for subscription gating
  // if (currentPlan === "basic") {
  //   return (
  //     <Upsell
  //       title={"My Portfolio"}
  //       subtitle={"Access portfolio analytics, AI insights, and exportable reports on our Engage & Partner plans."}
  //       features={["Portfolio & Cohort analytics", "AI recommendations & alerts", "Exportable reports & PDFs", "Priority support and account setup"]}
  //       variant={"center"}
  //       plans={["Partner"]}
  //       upgradeMessage={"Upgrade your subscription to unlock comprehensive portfolio analytics, AI-driven insights, and exportable reports to optimize your investment strategy."}
  //       primaryLabel={"View Available Plans"}
  //     />
  //   );
  // }

  return (
    <div className="investments-container" style={getContainerStyles()}>
      <div className="investments-content">
        <h2 className="investments-title">My Portfolio</h2>

        {/* Tabs container - matching portfolio.js design */}
        <div className="tabs-container">
          {MY_PORTFOLIO_TABS.map(tab => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-btn ${active ? 'active' : ''}`}
              >
                <Icon className="tab-icon" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab underline */}
        <div className="tab-underline" />

        {/* Purpose section */}
        <PurposeSection purpose={currentTab?.purpose} />

        {/* Section content */}
        <div className="section-header">
          <div style={{ flex: 1 }} />
          <div className="section-controls">
            <button 
              className="download-section-btn"
              onClick={() => setShowDownloadOptions(!showDownloadOptions)}
            >
              <FiDownload /> Download
            </button>
          </div>
        </div>

        <div className="section-content" ref={sectionRef}>
          {renderTabContent()}
        </div>
      </div>

      {showDownloadOptions && <DownloadOptions />}
      <Popup />
    </div>
  );
};

export default MyInvestments;