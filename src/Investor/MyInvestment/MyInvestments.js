// MyInvestments.js
import React, { useState, useEffect, useRef } from 'react';
import {
  FiPieChart,
  FiDollarSign,
  FiUsers,
  FiAlertTriangle,
  FiMap,
  FiTrendingUp,
  FiEye,
  FiPieChart as FiComposition,
  FiBarChart2,
  FiGlobe,
  FiTarget,
  FiDollarSign as FiLiquidity,
  FiHeart,
  FiActivity,
  FiShield,
  FiClock,
  FiCheckCircle,
  FiArrowUp,
  FiArrowDown,
  FiCalendar,
  FiDownload,
  FiTrendingUp as FiTrendingUpIcon,
  FiInfo,
  FiX
} from 'react-icons/fi';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Import all tab components
import PortfolioOverview from './PortfolioOverview';
import PortfolioComposition from './PortfolioComposition';
import ExitLiquidityMetrics from './ExitLiquidityMetrics';
import FunderHealthEfficiency from './FunderHealthEfficiency';
import PerformanceRiskDashboard from './PerformanceRiskDashboard';
import ESGImpactPerformance from './ESGImpactPerformance';
import DataIntegrityTrustLayer from './DataIntegrityTrustLayer';
import InsightsAIRecommendations from './InsightsAIRecommendations';
import PipelineFutureOpportunities from './PipelineFutureOpportunities';

// Styles for MyInvestments
const styles = `
/* Main container */
.investments-container {
  margin-left: 250px;
  padding: 20px;
  min-height: 100vh;
  background-color: #f9f9f9;
  margin-top: 60px;
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

/* Horizontal scrolling tabs */
.categories-scroll-container {
  width: 100%;
  overflow-x: auto;
  padding-bottom: 10px;
  margin-bottom: 25px;
  padding: 0 10px;
}

.categories-scroll-container::-webkit-scrollbar {
  height: 6px;
}

.categories-scroll-container::-webkit-scrollbar-thumb {
  background-color: #d4c4b0;
  border-radius: 3px;
}

.categories-grid {
  display: inline-flex;
  gap: 12px;
  padding: 5px 0;
  white-space: nowrap;
}

.category-btn {
  padding: 12px 20px;
  background-color: #ede4d8;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  color: #5e3f26;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  flex-shrink: 0;
  min-width: max-content;
  transition: none !important;
  animation: none !important;
  transform: none !important;
}

.category-btn:hover {
  background-color: #d4c4b0;
  transform: none !important;
  animation: none !important;
}

.category-btn.active {
  background-color: #7d5a36;
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 8px rgba(125, 90, 54, 0.3);
  transform: none !important;
  animation: none !important;
}

.btn-icon {
  font-size: 16px;
}

/* Section content */
.section-content {
  width: 100%;
  min-height: 600px;
}

/* Section Header */
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

/* Purpose */
.purpose {
  background: white;
  border-radius: 8px;
  padding: 15px 20px;
  margin-bottom: 20px;
  border-left: 4px solid #7d5a36;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  flex: 1;
  margin-left: 0;
}

.purpose-text {
  color: #5e3f26;
  font-size: 14px;
  line-height: 1.4;
}

/* Download Section Button */
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
  transition: none !important;
  animation: none !important;
  transform: none !important;
}

.download-section-btn:hover {
  background: #5e3f26;
  transform: none !important;
  animation: none !important;
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
  transition: none !important;
  animation: none !important;
  transform: none !important;
}

.download-options-list button:hover {
  background: #7d5a36;
  color: white;
  transform: none !important;
  animation: none !important;
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
  transition: none !important;
  animation: none !important;
  transform: none !important;
}

.close-download:hover {
  background: #666;
  color: white;
  transform: none !important;
  animation: none !important;
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
  transition: none !important;
  animation: none !important;
  transform: none !important;
}

.popup-close:hover {
  background: #f0f0f0;
  color: #333;
  transform: none !important;
  animation: none !important;
}

.popup-content {
  width: 100%;
}

/* Responsive design */
@media (max-width: 1200px) {
  .investments-container {
    margin-left: 200px;
  }
  
  .section-header {
    flex-direction: column;
    gap: 15px;
  }
  
  .section-controls {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 992px) {
  .categories-grid {
    gap: 8px;
  }
  
  .category-btn {
    padding: 10px 16px;
    font-size: 13px;
  }
}

@media (max-width: 768px) {
  .investments-container {
    margin-left: 0;
    padding-top: 70px;
  }
  
  .categories-grid {
    gap: 6px;
  }
  
  .category-btn {
    padding: 8px 12px;
    font-size: 12px;
  }
  
  .btn-icon {
    font-size: 14px;
  }
  
  .section-controls {
    flex-direction: column;
    gap: 10px;
  }
  
  .download-section-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 576px) {
  .investments-title {
    font-size: 22px;
  }
  
  .categories-scroll-container {
    padding-bottom: 5px;
  }
  
  .categories-grid {
    padding: 3px 0;
  }
  
  .purpose,
  .section-content {
    padding: 0 5px;
  }
}

/* Categories grid spacing */
.categories-scroll-container {
  margin-bottom: 15px;
}

.categories-scroll-container:last-of-type {
  margin-bottom: 25px;
}

/* Ensure all content areas have consistent padding */
.portfolio-overview,
.portfolio-composition,
.pipeline-opportunities,
.exit-liquidity,
.funder-efficiency,
.insights-ai,
.performance-risk,
.esg-impact,
.data-integrity {
  width: 100%;
}
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

const MyInvestments = () => {
  const [activeCategory, setActiveCategory] = useState('Portfolio Overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [popupContent, setPopupContent] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const checkSidebarState = () => {
      setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"));
    };

    checkSidebarState();

    const observer = new MutationObserver(checkSidebarState);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
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
      const originalCategory = activeCategory;
      
      if (sectionName === 'all') {
        const pdf = new jsPDF('landscape', 'mm', 'a4');
        let currentPage = 1;
        
        for (const category of allCategories) {
          setActiveCategory(category);
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
        
        setActiveCategory(originalCategory);
        pdf.save('MyInvestments_Complete_Report.pdf');
      } else {
        setActiveCategory(sectionName);
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
        
        const fileName = `MyInvestments_${sectionName.replace(/\s+/g, '_')}.pdf`;
        pdf.save(fileName);
        
        setActiveCategory(originalCategory);
      }
      setShowDownloadOptions(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  // Purpose Component
  const Purpose = ({ purpose }) => (
    <div className="purpose">
      <div className="purpose-text">
        <strong>Purpose:</strong> {purpose}
      </div>
    </div>
  );

  // Download Options Component
  const DownloadOptions = () => (
    <div className="download-options">
      <div className="download-options-content">
        <h4>Download Report</h4>
        <div className="download-options-list">
          <button onClick={() => downloadSectionAsPDF('all')}>All Sections</button>
          {allCategories.map(section => (
            <button key={section} onClick={() => downloadSectionAsPDF(section)}>
              {section}
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

  // Section data mapping
  const sectionData = {
    'Portfolio Overview': {
      icon: <FiEye />,
      purpose: 'Provide a high-level snapshot of overall performance and exposure at a glance',
      component: <PortfolioOverview openPopup={openPopup} downloadSectionAsPDF={downloadSectionAsPDF} />
    },
    'Portfolio Composition': {
      icon: <FiComposition />,
      purpose: 'Show diversification and concentration by sector, stage, location, etc.',
      component: <PortfolioComposition openPopup={openPopup} downloadSectionAsPDF={downloadSectionAsPDF} />
    },
    'Exit & Liquidity Metrics': {
      icon: <FiLiquidity />,
      purpose: 'Measure realized outcomes, repayments, and liquidity flow',
      component: <ExitLiquidityMetrics openPopup={openPopup} downloadSectionAsPDF={downloadSectionAsPDF} />
    },
    'Funder Health & Efficiency': {
      icon: <FiHeart />,
      purpose: 'Track funder/catalyst performance and operational efficiency',
      component: <FunderHealthEfficiency openPopup={openPopup} downloadSectionAsPDF={downloadSectionAsPDF} />
    },
    'Performance & Risk Dashboard': {
      icon: <FiBarChart2 />,
      purpose: 'Assess growth, risk, and inclusion performance of portfolio',
      component: <PerformanceRiskDashboard openPopup={openPopup} downloadSectionAsPDF={downloadSectionAsPDF} />
    },
    'ESG & Impact Performance': {
      icon: <FiGlobe />,
      purpose: 'Measure environmental, social, and governance outcomes',
      component: <ESGImpactPerformance openPopup={openPopup} downloadSectionAsPDF={downloadSectionAsPDF} />
    },
    'Data Integrity & Trust Layer': {
      icon: <FiShield />,
      purpose: 'Ensure transparency, compliance, and auditability',
      component: <DataIntegrityTrustLayer openPopup={openPopup} downloadSectionAsPDF={downloadSectionAsPDF} />
    },
    'Insights & AI Recommendations': {
      icon: <FiActivity />,
      purpose: 'Provide AI-driven opportunities, risks, and alerts',
      component: <InsightsAIRecommendations openPopup={openPopup} downloadSectionAsPDF={downloadSectionAsPDF} />
    },
    'Pipeline & Future Opportunities': {
      icon: <FiTarget />,
      purpose: 'Show pipeline strength and forecast future capital needs',
      component: <PipelineFutureOpportunities openPopup={openPopup} downloadSectionAsPDF={downloadSectionAsPDF} />
    }
  };

  const getContainerStyles = () => ({
    width: "100%",
    minHeight: "100vh",
    maxWidth: "100vw",
    overflowX: "hidden",
    padding: `70px 20px 20px ${isSidebarCollapsed ? "100px" : "270px"}`,
    margin: "0",
    boxSizing: "border-box",
    position: "relative",
    transition: "padding 0.3s ease",
    backgroundColor: "#f8f9fa",
  });

  const allCategories = [
    'Portfolio Overview',
    'Portfolio Composition', 
    'Exit & Liquidity Metrics',
    'Funder Health & Efficiency',
    'Performance & Risk Dashboard',
    'ESG & Impact Performance',
    'Data Integrity & Trust Layer',
    'Insights & AI Recommendations',
    'Pipeline & Future Opportunities'
  ];

  const topCategories = allCategories.slice(0, 5);
  const bottomCategories = allCategories.slice(5);

  return (
    <div className="investments-container" style={getContainerStyles()}>
      <div className="investments-content">
        <h2 className="investments-title">My Portfolio</h2>

        {/* Top Categories Row - 5 tabs */}
        <div className="categories-scroll-container">
          <div className="categories-grid">
            {topCategories.map((category) => (
              <button
                key={category}
                className={`category-btn ${activeCategory === category ? 'active' : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                <span className="btn-icon">{sectionData[category].icon}</span>
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Categories Row - 4 tabs */}
        <div className="categories-scroll-container">
          <div className="categories-grid">
            {bottomCategories.map((category) => (
              <button
                key={category}
                className={`category-btn ${activeCategory === category ? 'active' : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                <span className="btn-icon">{sectionData[category].icon}</span>
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="section-content" ref={sectionRef}>
          <div className="section-header">
            <Purpose purpose={sectionData[activeCategory].purpose} />
            <div className="section-controls">
              <button 
                className="download-section-btn"
                onClick={() => setShowDownloadOptions(!showDownloadOptions)}
              >
                <FiDownload /> Download
              </button>
            </div>
          </div>
          {sectionData[activeCategory].component}
        </div>
      </div>

      {showDownloadOptions && <DownloadOptions />}
      <Popup />
    </div>
  );
};

export default MyInvestments;