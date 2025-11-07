"use client"
import { useState, useEffect } from "react"
import { CheckCircle } from "lucide-react"
import styles from "./InvestorUniversalProfile.module.css"

const sections = [
  { id: "instructions", label: "Instructions" },
  { id: "fundManageOverview", label: "Fund Manager Overview" },
  { id: "contactDetails", label: "Contact Details" },
  { id: "generalInvestmentPreference", label: "General Investment Preferences" },
  { id: "fundDetails", label: "Fund Details" },
  { id: "applicationBrief", label: "Application Brief" },
  { id: "documentUpload", label: "Document Upload" },
  { id: "declarationConsent", label: "Declaration & Consent" },
]

export default function ProfileTracker({ activeSection, setActiveSection, profileData }) {
  const [completedSections, setCompletedSections] = useState({});

  // Dynamically calculate completion status based on actual data
  useEffect(() => {
    if (profileData) {
      const completionStatus = {
        instructions: true, // Always completed
        fundManageOverview: checkFundManagerCompletion(profileData),
        contactDetails: checkContactDetailsCompletion(profileData),
        generalInvestmentPreference: checkInvestmentPreferenceCompletion(profileData),
        fundDetails: checkFundDetailsCompletion(profileData),
        applicationBrief: checkApplicationBriefCompletion(profileData),
        documentUpload: checkDocumentUploadCompletion(profileData),
        declarationConsent: checkDeclarationCompletion(profileData),
      };
      setCompletedSections(completionStatus);
    }
  }, [profileData]);

  // Completion check functions
  const checkFundManagerCompletion = (data) => {
    const overview = data?.fundManageOverview || {};
    return !!(overview.companyName && overview.registrationNumber && overview.taxNumber);
  };

  const checkContactDetailsCompletion = (data) => {
    const contact = data?.contactDetails || {};
    return !!(contact.businessEmail && contact.primaryContactMobile && contact.physicalAddress);
  };

  const checkInvestmentPreferenceCompletion = (data) => {
    const preferences = data?.generalInvestmentPreference || {};
    return !!(preferences.investmentStages && preferences.preferredIndustries);
  };

  const checkFundDetailsCompletion = (data) => {
    const funds = data?.fundDetails?.funds || [];
    return funds.length > 0 && funds.some(fund => 
      fund.fundName && fund.minimumTicket && fund.maximumTicket
    );
  };

  const checkApplicationBriefCompletion = (data) => {
    const brief = data?.applicationBrief || {};
    return !!(brief.dealFlowProcess && brief.investmentThesis);
  };

  const checkDocumentUploadCompletion = (data) => {
    const documents = data?.documentUpload || {};
    // Check if all required documents are uploaded
    const requiredDocs = ['registrationDocs', 'idOffund', 'fundMandate'];
    return requiredDocs.every(docId => {
      const doc = documents[docId];
      return doc && (Array.isArray(doc) ? doc.length > 0 : !!doc);
    });
  };

  const checkDeclarationCompletion = (data) => {
    const declaration = data?.declarationConsent || {};
    return !!(declaration.agreedToTerms && declaration.consentToDataProcessing);
  };

  return (
    <div className={`${styles.trackerContainer} w-full overflow-x-auto`}>
      <div className={`${styles.trackerInner} flex min-w-max space-x-2`}>
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`${styles.trackerButton} relative flex items-center justify-center px-4 py-3 rounded-md transition-all ${
              activeSection === section.id
                ? `${styles.activeSection} bg-brown-700 text-white shadow-lg`
                : completedSections[section.id]
                  ? `${styles.completedSection} bg-brown-100 text-brown-800 border border-brown-300`
                  : `${styles.pendingSection} bg-brown-600 text-white opacity-80 hover:opacity-100`
            }`}
          >
            <span className={`${styles.sectionLabel} text-sm font-medium whitespace-nowrap`}>{section.label}</span>
            {completedSections[section.id] && (
              <CheckCircle className={`${styles.checkIcon} w-4 h-4 ml-2 text-green-500`} />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}