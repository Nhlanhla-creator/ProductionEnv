// tabs/DataIntegrityTrustLayer.js
import React, { useState, useEffect } from 'react';
import { FiEye } from 'react-icons/fi';
import { Loader } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

// Styles for DataIntegrityTrustLayer
const styles = `
.data-integrity {
  width: 100%;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 16px;
}

.loading-text {
  color: #7d5a50;
  font-size: 16px;
}

.data-integrity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  padding: 0 10px;
}

.chart-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: 420px;
  position: relative;
  overflow: hidden;
  transition: none !important;
  animation: none !important;
  transform: none !important;
}

.chart-container:hover {
  transform: none !important;
  animation: none !important;
  transition: none !important;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.chart-container.full-width {
  grid-column: 1 / -1;
  height: 450px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.chart-title {
  margin: 0 0 10px 0;
  color: #5e3f26;
  font-size: 16px;
  font-weight: 600;
  padding-bottom: 10px;
  border-bottom: 1px solid #ede4d8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  line-height: 1.3;
  min-height: 40px;
}

.breakdown-icon-btn {
  background: none;
  border: none;
  color: #7d5a36;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: none !important;
  animation: none !important;
  transform: none !important;
}

.breakdown-icon-btn:hover {
  background: #f0f0f0;
  transform: none !important;
  animation: none !important;
}

/* Table Styles */
.table-container {
  overflow-x: auto;
  margin-top: 10px;
  height: 300px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th {
  background-color: #f5f5f5;
  color: #5e3f26;
  font-weight: 600;
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid #ede4d8;
}

.data-table td {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.data-table tr:hover {
  background-color: #f9f9f9;
  transform: none !important;
  animation: none !important;
  transition: none !important;
}

.verification-table tr:hover {
  background-color: #f9f9f9;
  transform: none !important;
  animation: none !important;
  transition: none !important;
}

/* Status badges */
.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  display: inline-block;
  text-align: center;
  min-width: 60px;
}

.status-badge.verified {
  background-color: #4CAF50;
  color: white;
}

.status-badge.partial {
  background-color: #FF9800;
  color: white;
}

.status-badge.unverified {
  background-color: #f44336;
  color: white;
}

.status-badge.pending {
  background-color: #9E9E9E;
  color: white;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #7d5a50;
  text-align: center;
  padding: 20px;
}

.empty-state-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state-text {
  font-size: 14px;
  line-height: 1.5;
}

/* Summary Stats */
.compliance-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #ede4d8;
}

.summary-stat {
  text-align: center;
}

.summary-stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #5e3f26;
  margin-bottom: 4px;
}

.summary-stat-label {
  font-size: 12px;
  color: #7d5a50;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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

.popup-content h3 {
  margin: 0 0 20px 0;
  color: #5e3f26;
  font-size: 24px;
  text-align: center;
  border-bottom: 2px solid #ede4d8;
  padding-bottom: 15px;
}

.popup-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
  text-align: center;
  line-height: 1.5;
  font-style: italic;
  background: #f8f9fa;
  padding: 12px 15px;
  border-radius: 6px;
  border-left: 3px solid #7d5a36;
}

.table-container-popup {
  overflow-x: auto;
  margin-top: 15px;
}

/* Responsive Design */
@media (max-width: 992px) {
  .data-integrity-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    height: 380px;
  }
}

@media (max-width: 768px) {
  .chart-container {
    height: 350px;
    padding: 15px;
  }
  
  .compliance-summary {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
  .chart-container {
    padding: 15px;
    height: 320px;
  }
  
  .data-integrity-grid {
    padding: 0 5px;
  }
  
  .data-table {
    font-size: 12px;
  }
  
  .data-table th,
  .data-table td {
    padding: 8px;
  }
  
  .status-badge {
    font-size: 10px;
    padding: 3px 6px;
    min-width: 50px;
  }
  
  .compliance-summary {
    grid-template-columns: 1fr;
  }
  
  .summary-stat-value {
    font-size: 20px;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

const DataIntegrityTrustLayer = ({ openPopup }) => {
  const [loading, setLoading] = useState(true);
  const [complianceData, setComplianceData] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalSMEs: 0,
    fullyCompliant: 0,
    partiallyCompliant: 0,
    nonCompliant: 0,
    complianceRate: 0
  });

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.log("No authenticated user");
        setLoading(false);
        return;
      }

      // Fetch investor's portfolio SMEs
      const applicationsQuery = query(
        collection(db, "investorApplications"),
        where("funderId", "==", currentUser.uid)
      );

      const applicationsSnapshot = await getDocs(applicationsQuery);
      console.log("Found applications for compliance check:", applicationsSnapshot.docs.length);

      // Process each SME's compliance data
      const compliancePromises = applicationsSnapshot.docs.map(async (appDoc) => {
        const appData = appDoc.data();
        
        try {
          let profileData = {};
          let complianceScore = 0;

          // Fetch SME profile
          if (appData.smeId) {
            const profileRef = doc(db, "universalProfiles", appData.smeId);
            const profileSnap = await getDoc(profileRef);

            if (profileSnap.exists()) {
              profileData = profileSnap.data();
              complianceScore = profileData.complianceScore || 0;
            }
          }

          const smeName =
            profileData.entityOverview?.tradingName ||
            profileData.entityOverview?.registeredName ||
            appData.companyName ||
            appData.smeName ||
            "Unnamed Business";

          // Extract compliance verification data from actual profile structure
          const documentUpload = profileData.documents || {};
          const fundingDocuments = profileData.fundingDocuments || {};
          const legalCompliance = profileData.legalCompliance || {};
          const entityOverview = profileData.entityOverview || {};
          const ownershipManagement = profileData.ownershipManagement || {};
          const financialOverview = profileData.financialOverview || {};
          
          // Check CIPC verification (registrationCertificate)
          const cipcStatus = determineVerificationStatus(
            documentUpload.registrationCertificate || entityOverview.registrationCertificate,
            legalCompliance.cipcVerified,
            'entityOverview.registrationCertificate',
            profileData
          );

          // Check Tax verification (taxClearanceCert)
          const taxStatus = determineVerificationStatus(
            documentUpload.taxClearanceCert || legalCompliance.taxClearanceCert,
            legalCompliance.taxCompliant,
            'legalCompliance.taxClearanceCert',
            profileData
          );

          // Check KYC verification (certifiedIds and proof of address)
          const hasIdDocs = documentUpload.certifiedIds || ownershipManagement.certifiedIds;
          const hasProofOfAddress = documentUpload.proofOfAddress || ownershipManagement.proofOfAddress;
          const kycComplete = (hasIdDocs && (Array.isArray(hasIdDocs) ? hasIdDocs.length > 0 : true)) &&
                             (hasProofOfAddress && (Array.isArray(hasProofOfAddress) ? hasProofOfAddress.length > 0 : true));
          
          const kycStatus = determineVerificationStatus(
            kycComplete ? hasIdDocs : null,
            profileData.kycVerified,
            null,
            profileData
          );

          // Check B-BBEE verification
          const bbbeeStatus = determineVerificationStatus(
            documentUpload.bbbeeCert || legalCompliance.bbbeeCert,
            legalCompliance.bbbeeVerified,
            'legalCompliance.bbbeeCert',
            profileData
          );

          // Check VAT registration (if applicable)
          const annualRevenue = parseFloat(financialOverview?.annualRevenue?.replace(/[^0-9.]/g, '') || '0');
          const vatApplicable = annualRevenue > 1000000;
          const vatStatus = vatApplicable ? determineVerificationStatus(
            legalCompliance.vatNumber,
            legalCompliance.vatRegistered,
            'legalCompliance.vatNumber',
            profileData
          ) : 'not-applicable';

          // Check UIF & COIDA
          const hasUIF = legalCompliance?.uifNumber?.trim()?.length > 0;
          const hasCOIDA = legalCompliance?.coidaNumber?.trim()?.length > 0;
          const hasUifCoidaDocs = documentUpload.uifCoida;
          const uifCoidaComplete = (hasUIF && hasCOIDA) || 
                                    (hasUifCoidaDocs && (Array.isArray(hasUifCoidaDocs) ? hasUifCoidaDocs.length > 0 : true));
          
          const uifCoidaStatus = determineVerificationStatus(
            uifCoidaComplete ? (hasUifCoidaDocs || legalCompliance.uifNumber) : null,
            legalCompliance.uifCoidaVerified,
            null,
            profileData
          );

          // Check Bank Account verification
          const hasBankConfirmation = documentUpload.bankConfirmation || 
                                      fundingDocuments.bankConfirmation ||
                                      financialOverview.bankAccount;
          const bankStatus = determineVerificationStatus(
            hasBankConfirmation,
            financialOverview.bankVerified,
            'financialOverview.bankAccount',
            profileData
          );

          // Check Share Register
          const shareRegisterStatus = determineVerificationStatus(
            documentUpload.shareRegister || ownershipManagement.shareRegister,
            ownershipManagement.shareRegisterVerified,
            'ownershipManagement.shareRegister',
            profileData
          );

          // Check Sector-Specific Licenses
          const hasIndustryDocs = documentUpload.industryAccreditationDocs || 
                                  legalCompliance.industryAccreditations;
          const sectorLicenseStatus = determineVerificationStatus(
            hasIndustryDocs,
            legalCompliance.industryAccreditationsVerified,
            'legalCompliance.industryAccreditations',
            profileData
          );

          // Get last audit/update date
          const auditStamp = profileData.lastComplianceCheck || 
                            profileData.updatedAt || 
                            profileData.createdAt || 
                            new Date().toISOString();

          return {
            id: appDoc.id,
            smeId: appData.smeId,
            smeName,
            complianceScore,
            cipcStatus,
            taxStatus,
            kycStatus,
            bbbeeStatus,
            vatStatus,
            uifCoidaStatus,
            bankStatus,
            shareRegisterStatus,
            sectorLicenseStatus,
            auditStamp: formatDate(auditStamp),
            overallCompliance: calculateOverallCompliance(cipcStatus, taxStatus, kycStatus, bbbeeStatus),
            pipelineStage: appData.pipelineStage,
            // Store additional details for comprehensive view
            details: {
              vatApplicable,
              annualRevenue: financialOverview?.annualRevenue || 'Not specified',
              businessStage: entityOverview?.operationStage || 'Not specified'
            }
          };
        } catch (error) {
          console.error("Error processing SME compliance:", error);
          return null;
        }
      });

      const allComplianceData = (await Promise.all(compliancePromises))
        .filter(data => data !== null)
        .sort((a, b) => b.complianceScore - a.complianceScore); // Sort by compliance score

      console.log("Processed compliance data:", allComplianceData.length);

      // Calculate summary statistics
      const stats = calculateSummaryStats(allComplianceData);
      
      setComplianceData(allComplianceData);
      setSummaryStats(stats);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching compliance data:", error);
      setLoading(false);
    }
  };

  const determineVerificationStatus = (documentData, verificationFlag, fieldPath = null, smeProfile = null) => {
    // SIMPLIFIED LOGIC TO MATCH ComplianceScoreCard
    // Check if document exists (not if it's verified by authorities)
    
    let hasDocument = false;
    
    // Priority 1: Check if document is uploaded
    if (documentData && (Array.isArray(documentData) ? documentData.length > 0 : documentData)) {
      hasDocument = true;
    }
    
    // Priority 2: Check field path in profile if provided
    if (!hasDocument && fieldPath && smeProfile) {
      const parts = fieldPath.split('.');
      let current = smeProfile;
      
      for (const part of parts) {
        if (!current || !(part in current)) {
          current = null;
          break;
        }
        current = current[part];
      }
      
      if (current) {
        if (Array.isArray(current)) {
          hasDocument = current.length > 0;
        } else if (typeof current === 'string') {
          hasDocument = current.trim().length > 0;
        } else {
          hasDocument = !!current;
        }
      }
    }
    
    // Return status based on document existence
    // "verified" = document exists (matches ComplianceScoreCard logic)
    // "pending" = document doesn't exist
    return hasDocument ? 'verified' : 'pending';
  };

  const calculateOverallCompliance = (cipc, tax, kyc, bbbee) => {
    // Core compliance requirements: CIPC, Tax, KYC, B-BBEE
    const coreStatuses = [cipc, tax, kyc, bbbee].filter(s => s !== 'not-applicable');
    const verifiedCount = coreStatuses.filter(s => s === 'verified').length;
    const totalRequired = coreStatuses.length;
    
    // Calculate compliance percentage
    const compliancePercentage = totalRequired > 0 ? (verifiedCount / totalRequired) * 100 : 0;
    
    // Fully compliant: All core documents verified (100%)
    if (compliancePercentage === 100) return 'fully-compliant';
    
    // Partially compliant: At least 50% verified
    if (compliancePercentage >= 50) return 'partially-compliant';
    
    // Non-compliant: Less than 50%
    return 'non-compliant';
  };

  const calculateSummaryStats = (data) => {
    const total = data.length;
    const fullyCompliant = data.filter(d => d.overallCompliance === 'fully-compliant').length;
    const partiallyCompliant = data.filter(d => d.overallCompliance === 'partially-compliant').length;
    const nonCompliant = data.filter(d => d.overallCompliance === 'non-compliant').length;
    const complianceRate = total > 0 ? Math.round((fullyCompliant / total) * 100) : 0;

    return {
      totalSMEs: total,
      fullyCompliant,
      partiallyCompliant,
      nonCompliant,
      complianceRate
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'verified': { className: 'verified', label: 'Verified' },
      'pending': { className: 'pending', label: 'Pending' },
      'not-applicable': { className: 'pending', label: 'N/A' }
    };

    const statusInfo = statusMap[status] || statusMap['pending'];
    return (
      <span className={`status-badge ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="data-integrity">
        <div className="loading-container">
          <Loader size={48} style={{ color: "#a67c52", animation: "spin 1s linear infinite" }} />
          <p className="loading-text">Loading compliance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="data-integrity">
      <div className="data-integrity-grid">
        <div className="chart-container full-width">
          <div className="chart-header">
            <h3 className="chart-title">Portfolio Compliance Verification Status</h3>
            <button 
              className="breakdown-icon-btn"
              onClick={() => openPopup(
                <div className="popup-content">
                  <h3>Compliance Verification Status</h3>
                  <div className="popup-description">
                    Detailed compliance verification status across all regulatory requirements for your portfolio
                  </div>
                  
                  {/* Summary in popup */}
                  <div className="compliance-summary">
                    <div className="summary-stat">
                      <div className="summary-stat-value">{summaryStats.totalSMEs}</div>
                      <div className="summary-stat-label">Total SMEs</div>
                    </div>
                    <div className="summary-stat">
                      <div className="summary-stat-value" style={{ color: '#4CAF50' }}>
                        {summaryStats.fullyCompliant}
                      </div>
                      <div className="summary-stat-label">Fully Compliant</div>
                    </div>
                    <div className="summary-stat">
                      <div className="summary-stat-value" style={{ color: '#FF9800' }}>
                        {summaryStats.partiallyCompliant}
                      </div>
                      <div className="summary-stat-label">Partial</div>
                    </div>
                    <div className="summary-stat">
                      <div className="summary-stat-value" style={{ color: '#f44336' }}>
                        {summaryStats.nonCompliant}
                      </div>
                      <div className="summary-stat-label">Non-Compliant</div>
                    </div>
                  </div>

                  {complianceData.length > 0 ? (
                    <div className="table-container-popup">
                      <table className="data-table verification-table">
                        <thead>
                          <tr>
                            <th>SME</th>
                            <th>CIPC</th>
                            <th>Tax</th>
                            <th>B-BBEE</th>
                            <th>KYC</th>
                            <th>Last Check</th>
                            <th>Overall</th>
                          </tr>
                        </thead>
                        <tbody>
                          {complianceData.map((sme, idx) => (
                            <tr key={idx}>
                              <td>{sme.smeName}</td>
                              <td>{getStatusBadge(sme.cipcStatus)}</td>
                              <td>{getStatusBadge(sme.taxStatus)}</td>
                              <td>{getStatusBadge(sme.bbbeeStatus)}</td>
                              <td>{getStatusBadge(sme.kycStatus)}</td>
                              <td>{sme.auditStamp}</td>
                              <td>
                                <span style={{ 
                                  fontWeight: '600',
                                  color: sme.overallCompliance === 'fully-compliant' ? '#4CAF50' : 
                                         sme.overallCompliance === 'partially-compliant' ? '#FF9800' : '#f44336'
                                }}>
                                  {sme.overallCompliance === 'fully-compliant' ? '✓ Compliant' :
                                   sme.overallCompliance === 'partially-compliant' ? '⚠ Partial' : '✗ Non-Compliant'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <div className="empty-state-text">
                        No compliance data available
                      </div>
                    </div>
                  )}
                </div>
              )}
              title="View details"
            >
              <FiEye />
            </button>
          </div>

          {/* Summary Statistics */}
          {complianceData.length > 0 && (
            <div className="compliance-summary">
              <div className="summary-stat">
                <div className="summary-stat-value">{summaryStats.complianceRate}%</div>
                <div className="summary-stat-label">Compliance Rate</div>
              </div>
              <div className="summary-stat">
                <div className="summary-stat-value" style={{ color: '#4CAF50' }}>
                  {summaryStats.fullyCompliant}
                </div>
                <div className="summary-stat-label">Fully Compliant</div>
              </div>
              <div className="summary-stat">
                <div className="summary-stat-value" style={{ color: '#FF9800' }}>
                  {summaryStats.partiallyCompliant}
                </div>
                <div className="summary-stat-label">Partial</div>
              </div>
              <div className="summary-stat">
                <div className="summary-stat-value" style={{ color: '#f44336' }}>
                  {summaryStats.nonCompliant}
                </div>
                <div className="summary-stat-label">Non-Compliant</div>
              </div>
            </div>
          )}

          {/* Compliance Table */}
          <div className="table-container">
            {complianceData.length > 0 ? (
              <table className="data-table verification-table">
                <thead>
                  <tr>
                    <th>SME</th>
                    <th>CIPC</th>
                    <th>Tax</th>
                    <th>B-BBEE</th>
                    <th>KYC</th>
                    <th>Last Check</th>
                    <th>Overall</th>
                  </tr>
                </thead>
                <tbody>
                  {complianceData.map((sme, idx) => (
                    <tr key={idx}>
                      <td>{sme.smeName}</td>
                      <td>{getStatusBadge(sme.cipcStatus)}</td>
                      <td>{getStatusBadge(sme.taxStatus)}</td>
                      <td>{getStatusBadge(sme.bbbeeStatus)}</td>
                      <td>{getStatusBadge(sme.kycStatus)}</td>
                      <td>{sme.auditStamp}</td>
                      <td>
                        <span style={{ 
                          fontWeight: '600',
                          fontSize: '12px',
                          color: sme.overallCompliance === 'fully-compliant' ? '#4CAF50' : 
                                 sme.overallCompliance === 'partially-compliant' ? '#FF9800' : '#f44336'
                        }}>
                          {sme.overallCompliance === 'fully-compliant' ? '✓ Compliant' :
                           sme.overallCompliance === 'partially-compliant' ? '⚠ Partial' : '✗ Non-Compliant'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-text">
                  No compliance data available yet.<br/>
                  Compliance information will appear here as SMEs complete their verification.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataIntegrityTrustLayer;