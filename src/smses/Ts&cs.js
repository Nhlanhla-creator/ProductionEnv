// TermsConditions.js
import React, { useState } from 'react';
import { FileText, X } from 'lucide-react';
import './TermsConditions.css';

// Terms & Conditions Modal Component
const TermsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  const today = new Date().toLocaleDateString();
  
  return (
    <div className="terms-modal-overlay" onClick={onClose}>
      <div className="terms-modal" onClick={(e) => e.stopPropagation()}>
        <div className="terms-header">
          <h2>BIG Marketplace – Platform Terms & Conditions and Mutual NDA</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="terms-content">
          <div className="terms-section">
            <p><strong>Effective Date:</strong> [{today}]</p>
            <p><strong>Applies To:</strong> All Registered Users (SMEs, Funders, Service Providers, Corporates, Accelerators, and Interns)</p>

            {/* NDA SECTION - ADDED */}
            <div className="nda-section">
              <h2>PART A: MUTUAL NON-DISCLOSURE AGREEMENT (NDA)</h2>
              
              <h3>1. Purpose</h3>
              <p>This Mutual NDA governs the protection and non-disclosure of Confidential Information exchanged between BIG Marketplace users and between each user and Brown Ivory Group Proprietary Limited ("BIG").</p>

              <h3>2. Definition of Confidential Information</h3>
              <p>"Confidential Information" includes, but is not limited to: business plans, financial information, funding requirements, investment terms, product/service data, IP, customer data, documents, and any non-public business or personal data disclosed via the platform or through follow-up communications.</p>

              <h3>3. Mutual Obligations</h3>
              <p>All parties agree to:</p>
              <ul>
                <li>Keep Confidential Information strictly confidential.</li>
                <li>Use it solely for evaluation or engagement within the BIG Marketplace platform.</li>
                <li>Not disclose it to third parties except employees or advisors who are bound by similar confidentiality obligations.</li>
              </ul>

              <h3>4. Permitted Disclosures</h3>
              <p>Information may be disclosed:</p>
              <ul>
                <li>To advisors who have a need to know.</li>
                <li>As required by law or legal process (with notice to the disclosing party).</li>
                <li>If already in the public domain or lawfully obtained from another source.</li>
              </ul>

              <h3>5. Duration</h3>
              <p>This NDA is valid:</p>
              <ul>
                <li>For <strong>two years from date of last disclosure</strong> on the platform, or</li>
                <li>Until the Confidential Information becomes publicly available through no fault of the receiving party.</li>
              </ul>

              <h3>6. Data Protection</h3>
              <p>All users agree to comply with applicable data protection laws, including POPIA. Personal Information may not be misused, shared, or processed outside the intended platform purpose without explicit consent.</p>

              <h3>7. Return or Destruction</h3>
              <p>Upon written request, users must return or delete any Confidential Information shared with them via the platform.</p>

              <h3>8. No License or IP Rights</h3>
              <p>No rights to Confidential Information or underlying IP are granted by this NDA.</p>

              <h3>9. Breach & Enforcement</h3>
              <p>Violation of this NDA may result in:</p>
              <ul>
                <li>Removal from the BIG Marketplace platform,</li>
                <li>Legal action and damages, and</li>
                <li>Blacklisting from the ecosystem.</li>
              </ul>
            </div>

            {/* PLATFORM TERMS SECTION */}
            <div className="platform-terms-section">
              <h2>PART B: PLATFORM TERMS & CONDITIONS</h2>

              <h3>1. Introduction & Acceptance</h3>
              <p>1.1. By registering on BIG Marketplace, you agree to these Terms & Conditions and the accompanying Mutual NDA.</p>
              <p>1.2. These terms govern the use of the BIG Marketplace platform, a trust-based ecosystem designed to match high-impact businesses with funders, service providers, and growth enablers.</p>
              <p>1.3. All users agree to act in good faith and uphold the integrity, confidentiality, and accountability standards of the platform.</p>

              <h3>2. Universal User Responsibilities</h3>
              <p>2.1. Maintain complete, truthful, and current profile information.</p>
              <p>2.2. Acknowledge and respect the platform's deal flow lifecycle by updating the status of every interaction (e.g., matched, declined, in negotiation, term sheet signed).</p>
              <p>2.3. Do not engage with any party introduced via BIG Marketplace outside the platform in order to avoid fees or visibility.</p>
              <p>2.4. Accept that BIG Marketplace reserves the right to audit usage logs and communication records where misconduct or circumvention is suspected.</p>

              <h3>3. SMEs (Small & Medium Enterprises)</h3>
              <p>3.1. Undergo BIG Score pre-vetting based on financials, operations, governance, and growth potential.</p>
              <p>3.2. Upload necessary documentation (e.g., CIPC docs, tax clearance, financials).</p>
              <p>3.3. Accurately update deal status, including:</p>
              <ul>
                <li>"Declined" with reason</li>
                <li>"Term Sheet Signed" with supporting document</li>
                <li>"Deal Finalized"</li>
              </ul>
              <p>3.4. Acknowledge that participation in funded engagements or provider relationships may be subject to verification.</p>

              <h3>4. Funders / Investors</h3>
              <p>4.1. Agree to a standard 3% commission fee on all funding deals concluded with SMEs introduced via the platform.</p>
              <p>4.2. Fee Triggers:</p>
              <ul>
                <li>Triggered upon term sheet signing or equivalent contractual commitment.</li>
                <li>Payable within 30 days of deal finalisation.</li>
                <li>Applies to all funding types (grants, equity, loans, convertible notes).</li>
              </ul>
              <p>4.3. Obligations:</p>
              <ul>
                <li>Update all deal statuses throughout the lifecycle.</li>
                <li>Upload executed term sheets.</li>
                <li>Refrain from bypassing platform communication or execution.</li>
              </ul>

              <h3>5. Service Providers</h3>
              <p>5.1. May be listed on the platform following vetting (as applicable).</p>
              <p>5.2. Agree to pay a referral or success fee on new SME engagements sourced through BIG Marketplace, if and when a commercial transaction occurs.</p>
              <p>5.3. Commit to:</p>
              <ul>
                <li>Delivering services aligned with scope and professional ethics</li>
                <li>Participating in quality reviews and satisfaction ratings</li>
                <li>Not circumventing the platform once matched with a business</li>
              </ul>

              <h3>6. Corporates / Accelerators / Incubators</h3>
              <p>6.1. May access the SME database via:</p>
              <ul>
                <li>Monthly or annual enterprise subscription</li>
                <li>API integration (where technically feasible and contractually agreed)</li>
              </ul>
              <p>6.2. Agree to:</p>
              <ul>
                <li>Mark all SME engagements with outcomes (e.g., shortlisted, accepted into program, declined).</li>
                <li>Participate in platform usage reviews and engagement tracking.</li>
              </ul>
              <p>6.3. Fees:</p>
              <ul>
                <li>No success-based commission is charged unless separately agreed upon.</li>
                <li>Customized pricing and licensing may apply for premium features (e.g., scoring access, custom filters, analytics dashboards).</li>
              </ul>
              <p>6.4. Corporates engaging SMEs for ESD/CSR/Procurement purposes must:</p>
              <ul>
                <li>Respect the pre-vetting system</li>
                <li>Provide updates on funded or contracted SMEs</li>
                <li>Use data only for permitted sourcing activities (no data scraping, resale, or off-platform marketing)</li>
              </ul>

              <h3>7. Data Usage, Privacy & Confidentiality</h3>
              <p>7.1. All users are bound by the Mutual Non-Disclosure Agreement (Part A) and data privacy regulations (POPIA/GDPR compliant).</p>
              <p>7.2. BIG Marketplace will not share confidential user data without consent, except to facilitate matchmaking or regulatory compliance.</p>
              <p>7.3. The platform may use anonymized or aggregated data to improve AI matching, user experience, and market insights.</p>

              <h3>8. Breach & Dispute Resolution</h3>
              <p>8.1. Any form of circumvention, data misuse, or failure to pay applicable fees constitutes a material breach.</p>
              <p>8.2. Breaches may result in:</p>
              <ul>
                <li>Immediate account suspension</li>
                <li>Legal action to recover fees or damages</li>
                <li>Blacklisting from the platform</li>
              </ul>
              <p>8.3. Disputes shall be resolved first via internal mediation. If unresolved, disputes will be referred to arbitration under South African commercial law.</p>

              <h3>9. Amendments & Acceptance</h3>
              <p>9.1. BIG Marketplace may amend these terms periodically.</p>
              <p>9.2. Users will be notified of changes and must accept updated terms to continue using the platform.</p>
            </div>

            <div className="final-acknowledgement">
              <h3>✅ Final Acknowledgement</h3>
              <p>By using this platform, you confirm that you:</p>
              <ul>
                <li>Have read and understood these Terms & Conditions and the Mutual NDA</li>
                <li>Agree to be bound by them</li>
                <li>Agree to maintain confidentiality of all information shared on the platform</li>
                <li>Acknowledge the fee structures and responsibilities applicable to your stakeholder category</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Terms & Conditions Checkbox Component
const TermsConditionsCheckbox = ({ 
  agreeToTerms, 
  setAgreeToTerms, 
  error,
  onAcceptanceTimestampChange // NEW: callback to pass timestamp to parent
}) => {
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleAgreementChange = (e) => {
    const isChecked = e.target.checked;
    setAgreeToTerms(isChecked);
    
    if (isChecked) {
      const timestamp = new Date().toISOString();
      if (onAcceptanceTimestampChange) {
        onAcceptanceTimestampChange(timestamp);
      }
    } else {
      if (onAcceptanceTimestampChange) {
        onAcceptanceTimestampChange(null);
      }
    }
  };
  
  return (
    <>
      <div className={`terms-checkbox-group ${error ? 'input-error' : ''}`}>
        <label className="checkbox-container">
          <input
            type="checkbox"
            checked={agreeToTerms}
            onChange={handleAgreementChange}
          />
          <span className="checkmark"></span>
          <span className="checkbox-text">
            I agree to the{' '}
            <button
              type="button"
              className="terms-link"
              onClick={() => setShowTermsModal(true)}
            >
              <FileText size={14} />
              Terms & Conditions and Mutual NDA
            </button>
          </span>
        </label>
      </div>
      {error && <p className="error-text">{error}</p>}

      <TermsModal 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
      />
    </>
  );
};

export default TermsConditionsCheckbox;