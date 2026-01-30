"use client"
import { useState } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom"
import "./App.css"
import HomeHeader from "./main_pages/SMEs/HomeHeader"
import { useAuth } from "./context/useAuth" // Import the auth hook
import ProtectedRoute from "./context/ProtectedRoute" // Import the ProtectedRoute component
import EmailVerification from "./EmailVerification"

// Admin Components
import AdminSidebar from "./admin/layout/AdminSidebar"
import AdminHeader from "./admin/layout/AdminHeader"
import AdminDashboard from "./admin/pages/AdminDashboard"
import AllSMEs from "./admin/pages/AllSMEs"
import AllInvestors from "./admin/pages/AllInvestors"
import AllCatalysts from "./admin/pages/AllCatalysts"
import AllAdvisors from "./admin/pages/AllAdvisors"
import DocumentManagement from "./admin/pages/growth-tools-purchased"
import AdminSettings from "./admin/pages/AdminSettings"

import AllInterns from "./admin/pages/AllInterns"
import AllSponsors from "./admin/pages/AllSponsors"
import Subscriptions from "./admin/pages/Subscriptions"
import QRCodes from "./admin/pages/QRCodes"
import CardLandingPage from "./admin/pages/CardLandingPage"
// Admin Settings Subcategory Components
import AdminUsers from "./admin/pages/AdminUserManagement"
import ApprovalWorkflows from "./admin/pages/ApprovalWorkflows"
import PaymentGateway from "./admin/pages/PaymentGatewaySettings"
import EmailTemplates from "./admin/pages/EmailTemplates"
import SystemConfig from "./admin/pages/SystemConfigurations"
import BackupExport from "./admin/pages/BackupExportData"
import InvestorSettings from "./Investor/Settings/Setttings"
import CatalystSettings from "./catalyst/CatalystSettings/supportSettings"

// Billing and Payment Components
import MySubscriptions from "./smses/BillingInformation/subscriptions"
import InvestorsSubscriptions from "./Investor/BillingAndPayments/subscriptions"
import BillingInfoInvestors from "./Investor/BillingAndPayments/billing-info"
import BillingHistoryInvestor from "./Investor/BillingAndPayments/billing-history"
import BillingHistorySMSE from "./smses/BillingInformation/billing-history"
import BillingInformationSMSE from "./smses/BillingInformation/billing-info"
import AdvisorDocuments from "./advisors/AdvisorDocuments/advisor-documents"
import CatalystDocuments from "./catalyst/CatalystDocuments/support-documents"

// Layout Components
import Sidebar from "./smses/Sidebar/Sidebar"
import InvestorSidebar from "./Investor/Sidebar/InvestorSidebar"
import SupportProgramSidebar from "./catalyst/CatalystSidebar/AcceleratorSidebar"
import SMSEHeader from "./smses/DashboardHeader/SMSEHeader"
import InvestorHeader from "./Investor/Header/InvestorHeader"
import SupportProgramHeader from "./catalyst/CatalystProgramHeader/CatalystHeader"
import AdvisorHeader from "./advisors/AdvisorHeader/advisorHeader"
import Documents from "./Investor/Documents"
import BetaSignupForm from "./BetaForm"

// Intern Components
// Intern Components - NEW
import InternSidebar from "./Interns/sidebar/sidebar"
import InternDashboard from "./Interns/InternDashboard/intern-dashboard"
import InternHeader from "./Interns/Header/header"
import InternCalendar from "./Interns/calender/calendar"
import InternMessages from "./Interns/messages/messages"
import InternDocuments from "./Interns/MyDocuments/intern-documents"
import InternMatches from "./Interns/MyMatches/matches"
import { InternDealflow } from "./Interns/MyMatches/intern-deal-flow-pipeline"
import { InternTable } from "./Interns/MyMatches/intern-table"
import Instructions from "./Interns/UniversalProfileIntern/Instructions"
// Intern Universal Profile Components - NEW
import InternUniversalProfile from "./Interns/UniversalProfileIntern/universalProfile"
import InternPersonalOverview from "./Interns/UniversalProfileIntern/PersonalOverview​"
import InternAcademicOverview from "./Interns/UniversalProfileIntern/AcademicOverview​"
import InternExperienceTrack from "./Interns/UniversalProfileIntern/Experience&TrackRecord"
import InternSkillsInterests from "./Interns/UniversalProfileIntern/Skills&Interests"
import InternProgramAffiliation from "./Interns/UniversalProfileIntern/ProgramAffiliation"
import InternRequiredDocuments from "./Interns/UniversalProfileIntern/RequiredDocuments"
import InternDeclarationConsent from "./Interns/UniversalProfileIntern/Declaration&Consent"
// Intern Application Components - NEW
import InternApplication from "./smses/InternApplication/internapplication"
import InternJobOverview from "./smses/InternApplication/JobOverview"
import InternInternshipRequest from "./smses/InternApplication/InternshipRequest"
import InternMatchingAgreement from "./smses/InternApplication/MatchingAgreement"
// Intern Matches Components - NEW
import InternMatchesPage from "./smses/MyInternMatch/match"
import { InternDealflowPage } from "./smses/MyInternMatch/intern-deal-flow-pipeline"
import { InternInsightsPage } from "./smses/MyInternMatch/intern-insights"
import { InternTablePage } from "./smses/MyInternMatch/intern-table"
// Program Sponsor Components - FIXED IMPORTS
import ProgramSponsorSidebar from "./program_sponsor/sidebar/ProgramSponsorSidebar"
import ProgramSponsorHeader from "./program_sponsor/header/ProgramSponsorHeader"
import ProgramSponsorCalendar from "./program_sponsor/Calender/calendar"
import ProgramSponsorMessages from "./program_sponsor/messages/message"
import ProgramSponsorSettings from "./program_sponsor/settings/settings"
import ProgramSponsorMatchesPage from "./program_sponsor/Matches/program-sponsor-matches"
import ProgramSponsorDocuments from "./program_sponsor/MyDocuments/program-sponsor-documents"
// Import all three match components separately
import { ProgramSponsorDealflow } from "./program_sponsor/Matches/program-sponsor-deal-flow-pipeline"
import { ProgramSponsorInsights } from "./program_sponsor/ProgramInsights/programInsights"
import { ProgramSponsorInternTable } from "./program_sponsor/Matches/program-sponsor-intern-table"
// Program Sponsor Universal Profile Components - FIXED IMPORTS
import ProgramSponsorUniversalProfile from "./program_sponsor/UniversalProfile/universalProfile"
import ProgramSponsorInstructions from "./program_sponsor/UniversalProfile/Instructions"
import ProgramSponsorContactDetails from "./program_sponsor/UniversalProfile/ContactDetails"
import ProgramSponsorDeclarationConsent from "./program_sponsor/UniversalProfile/DeclarationConsent"
import ProgramSponsorEntityOverview from "./program_sponsor/UniversalProfile/EntityOverview"
import ProgramSponsorProgramDetails from "./program_sponsor/UniversalProfile/ProgramDetails"
// Advisor Profile Components
import AdvisorProfile from "./advisors/AdvisorProfile/advisor-profile"
import ProfileTracker from "./advisors/AdvisorProfile/advisorTracker"
import PersonalProfessionalOverview from "./advisors/AdvisorProfile/PersonalProfessional"
import ContactDetails from "./advisors/AdvisorProfile/Contacts"
import SelectionCriteria from "./advisors/AdvisorProfile/SelectionCriteria"
import ProfessionalCredentials from "./advisors/AdvisorProfile/ProfessionalCredentialss"
import RequiredDocuments from "./advisors/AdvisorProfile/RequiredDocuments"
import DeclarationConsent from "./advisors/AdvisorProfile/Consent"

// Public Pages
import LandingPage from "./main_pages/LandingPage"
import AboutPage from "./main_pages/About"
import HowItWorks from "./main_pages/HowItWorks"
import BigScorePage from "./main_pages/BIGScorePage"
import HowItWorksSMSE from "./main_pages/HowItWorksSMSE"
import HowItWorksCatalysts from "./main_pages/HowItWorksCatalysts"
import HowItWorksCorporates from "./main_pages/HowItWorksCoporate"
import HowItWorksInvestors from "./main_pages/HowItWorksInvestor"
import HowItWorksAdvisors from "./main_pages/HowItWorksAdvisor"
import HowItWorksInterns from "main_pages/HowItWorksInterns"
import HomeContactFormPage from "./main_pages/SMEs/HomeContact"
import FAQPage from "./main_pages/FAQs"
import HomePage from "./main_pages/SMEs/HomePage"
import ContactPage from "./main_pages/Contact"
import InsightsPage from "./main_pages/Insights"
import Article1 from "./main_pages/Articles/Article1"
import HomeBIGScorePage from "./main_pages/SMEs/HomeBIGscore"
import HomeHowItWorks from "./main_pages/SMEs/HomeHowItWorks"
import HomeInsightsPage from "./main_pages/SMEs/HomeInsights"
import HomeFAQPage from "./main_pages/SMEs/HomeFAQs"
import BIGScoreInvestor from "./main_pages/Investors/BIGScore"
import HomePageInvestor from "./main_pages/Investors/HomePage"
import ContactFormInvestor from "./main_pages/Investors/Contact"
import InsightsInvestor from "./main_pages/Investors/Insights"
import HowItWorksInvestor from "./main_pages/Investors/HowItWorks"
import FAQPageInvestor from "./main_pages/Investors/FAQInvestors"
import HeaderInvestor from "./main_pages/Investors/HeaderInvestors"
import FAQsAdvisor from "main_pages/Advisors/FAQsAdvisor"
import ContactAdvisor from "main_pages/Advisors/ContactAdvisor"
import InsightsAdvisor from "main_pages/Advisors/InsightsAdvisor"
import HowWorksAdvisors from "main_pages/Advisors/HowWorksAdvisor"
import BIGscoreAdvisor from "main_pages/Advisors/BIGscoreAdvisor"
import HeaderAdvisor from "main_pages/Advisors/HeaderAdvisor"
import HomePageInterns from "main_pages/Interns/HomePageInterns"
import FAQsInterns from "main_pages/Interns/FAQsInterns"
import ContactInterns from "main_pages/Interns/ContactInterns"
import InsightsInterns from "main_pages/Interns/InsightsInterns"
import HowWorksInterns from "main_pages/Interns/HowWorksInterns"
import BIGscoreInterns from "main_pages/Interns/BIGscoreInterns"
import HeaderInterns from "main_pages/Interns/HeaderInterns"
import HomePageCatalysts from "main_pages/Catalysts/HomePageCatalysts"
import FAQsCatalysts from "main_pages/Catalysts/FAQsCatalysts"
import ContactCatalysts from "main_pages/Catalysts/ContactCatalysts"
import InsightsCatalysts from "main_pages/Catalysts/InsightsCatalysts"
import HowWorksCatalysts from "main_pages/Catalysts/HowWorksCatalysts"
import BIGscoreCatalysts from "main_pages/Catalysts/BIGscoreCatalysts"
import HeaderCatalysts from "main_pages/Catalysts/HeaderCatalysts"
import HomePageProgram from "main_pages/ProgramSponsor/HomePageProgram"
import FAQsProgram from "main_pages/ProgramSponsor/FAQsProgram"
import ContactProgram from "main_pages/ProgramSponsor/ContactProgram"
import InsightsProgram from "main_pages/ProgramSponsor/InsightsProgram"
import HowWorksProgram from "main_pages/ProgramSponsor/HowWorksProgram"
import BIGscoreProgram from "main_pages/ProgramSponsor/BIGscoreProgram"
import HeaderProgram from "main_pages/ProgramSponsor/HeaderProgram"
import BookSession from "main_pages/BookSession"
import HomePageAdvisor from "main_pages/Advisors/HomePageAdvisor"
import CharmSchool from "main_pages/CSI"

// Auth Components
import AuthForm from "./smses/LoginRegister"
import LoginRegister from "./smses/LoginRegister"
import RetrieveAccount from "./smses/RetrieveAccount"
import { Dashboard as InvestorDashboard } from "./Investor/InvestorDashboard/InvestorDashboard"

// Protected Pages
import { Dashboard } from "./smses/SMSEDashboard/Dashboard"
import Profile from "./smses/UniversalProfile/UniversalProfile"
import FindMatches from "./smses/MyMatches/FindMatches"
import MyDocuments from "./smses/MyDocuments/myDocuments"
import GrowthEnabler from "./smses/MyGrowthTools/shop"
import Messages from "./smses/Messages/Messages"
import Calendar from "./smses/MyCalender/Calendar"
import Settings from "./smses/Settings/Settings"

// SME Universal Profile Components
import SMEProfileTracker from "./smses/UniversalProfile/profile-tracker"
import SMEInstructions from "./smses/UniversalProfile/instructions"
import SMEEntityOverview from "./smses/UniversalProfile/entity-overview"
import SMEOwnershipManagement from "./smses/UniversalProfile/ownership-management"
import SMEContactDetails from "./smses/UniversalProfile/contact-details"
import SMELegalCompliance from "./smses/UniversalProfile/legal-compliance"
import SMEProductsServices from "./smses/UniversalProfile/products-services"
import SMEHowDidYouHear from "./smses/UniversalProfile/how-did-you-hear"
import SMEDeclarationConsent from "./smses/UniversalProfile/declaration-consent"
import RegistrationSummary from "./smses/UniversalProfile/registration-summary"
import ProfileSummary from "./smses/Documents"

// Investor Universal Profile Components
import InvestorUniversalProfile from "./Investor/InvestorUniversalProfile/InvestorUniversalProfile"
import InvestorProfileTracker from "./Investor/InvestorUniversalProfile/ProfileTracker"
import InvestorInstructions from "./Investor/InvestorUniversalProfile/Instructions"
import InvestorEntityOverview from "./Investor/InvestorUniversalProfile/FundManageOverview"
import InvestorOwnershipManagement from "./Investor/InvestorUniversalProfile/GeneralInvestmentPreference​"
import InvestorContactDetails from "./Investor/InvestorUniversalProfile/ContactDetails"
import InvestorLegalCompliance from "./Investor/InvestorUniversalProfile/LegalCompliance"
import InvestorProductsServices from "./Investor/InvestorUniversalProfile/FundDetails​"
import InvestorHowDidYouHear from "./Investor/InvestorUniversalProfile/ApplicationBrief​"
import InvestorDeclarationConsent from "./Investor/InvestorUniversalProfile/DeclarationConsent"
import InvestorMessages from "Investor/InvestorMessages/Messages"
import InvestorCalendar from "./Investor/Calender/InvestorCalendar"
import MyInvestments from "Investor/MyInvestment/MyInvestments"

// Accelerator Programs Universal Profile Components
import CatalystUniversalProfile from "./catalyst/CatalystUniversalProfile/catalyst-universal-profile"
import CatalystInstructions from "./catalyst/CatalystUniversalProfile/catalyst-instructions"
import CatalystEntityOverview from "./catalyst/CatalystUniversalProfile/catalyst-entity-overview"
import CatalystProgramDetails from "./catalyst/CatalystUniversalProfile/catalyst-program-details"
import CatalystContactDetails from "./catalyst/CatalystUniversalProfile/catalyst-contact-details"
import CatalystApplicationBrief from "./catalyst/CatalystUniversalProfile/catalyst-application-brief"
import CatalystMatchingPreference from "./catalyst/CatalystUniversalProfile/catalyst-matching-preference"
import CatalystDeclarationConsent from "./catalyst/CatalystUniversalProfile/catalyst-declaration-consent"
import CatalystCohorts from "./catalyst/MyCohorts/MyCohorts"
import CatalystInvestments from "./catalyst/MyInvestment/MyInvestments"

// Application Components
import FundingApplication from "./smses/FundingApplication/FundingApplication"
import ProductApplication from "./smses/ProductApplication/ProductApplication"
import AdvisoryApplication from "./smses/AdvisorApplication/AdvisorApplication"

// Matches Components
import CustomerMatchesPage from "./smses/MyCustomerMatches/customer-matches"
import FundingMatchesPage from "./smses/MyFunderMatches/funders-matches"
import SupplierMatchesPage from "./smses/MySupplierMatches/supplier-matches"
import SupportProgramMatchesPage from "./smses/MyAccelatorMatches/accelearator-matches"
import MatchesPage from "./Investor/MyMatches/investor-matches"
import SMSEAdvisorMatchesPage from "./smses/MyAdvisorMatches/advisor-matches"
import OpportunityMatchesPage from "./smses/MyOpportunityMatches/opportunity-matches"

// Growth Tools Components
import GrowthSuiteLanding from "./smses/MyGrowthTools/Growthsuitelanding"
import OverallCompanyHealth from "./smses/MyGrowthTools/OverallCompanyHealth"
import ShopToolsPage from "./smses/MyGrowthTools/shop"
import MyToolsPage from "./smses/MyGrowthTools/my-tools"
import Strategy from "./smses/MyGrowthTools/Strategy"
import FinancialPerformance from "./smses/MyGrowthTools/FinancialPerformance"
import CapitalStructure from "./smses/MyGrowthTools/CapitalStructure"
import OperationalStrength from "./smses/MyGrowthTools/OperationalStrength"
import People from "./smses/MyGrowthTools/People"
import SocialImpact from "./smses/MyGrowthTools/SocialImpact"
import MarketingSales from "./smses/MyGrowthTools/MarketingSale"
import RiskManagement from "./smses/MyGrowthTools/RiskManagement"

// Advisor Components
import AdvisorSettings from "./advisors/AdvisorSettings/advisor-settings"
import AdvisorSidebar from "./advisors/AdvisorSidebar/advisorSidebar"
import AdvisorDashboardPage from "./advisors/AdvisorMatches/advisor-dashboard-page"
import SupportMatchesPage from "./catalyst/CatalystMatches/support-dashboard-page"
import AdvisorMessages from "./advisors/AdvisorMessages/Messages"

// Program Sponsor Billing Components
import ProgramSponsorBillingHistory from "./program_sponsor/BillingPayments/billing-history-program-sponsor"
import ProgramSponsorBillingInfo from "./program_sponsor/BillingPayments/billing-info-program-sponsor"
import ProgramSponsorSubscription from "./program_sponsor/BillingPayments/program-sponsor-subscription"

// Insights Components
import BigInsights from "./smses/BigInsights/BigInsights"
import { AdvisorInsights } from "./advisors/AdvisorInsights/AdvisorInsights"
import { Insights as InternInsights } from "./Interns/InternInsights/internInsights"
import { AcceleratorInsights as CatalystInsights } from "./catalyst/CatalystInsights/catalystInsights"
import { InvestorInsights } from "./Investor/InvestorInsights/investorInsights"
import MyCohorts from "./Investor/MyCohorts/MyCohorts"

// Initial Data States
const initialFormData = {
  entityOverview: {},
  ownershipManagement: {
    shareholders: [
      {
        name: "",
        idRegNo: "",
        country: "",
        shareholding: "",
        race: "",
        gender: "",
        isYouth: false,
        isDisabled: false,
      },
    ],
    directors: [{ name: "", id: "", position: "", nationality: "", isExec: false }],
  },
  contactDetails: { sameAsPhysical: false },
  legalCompliance: {},
  productsServices: {
    entityType: "smse",
    productCategories: [],
    serviceCategories: [],
    keyClients: [],
    fundTypes: [],
    investmentInstruments: [],
    targetStages: [],
    sectorFocus: [],
    geographicFocus: [],
    supportOffered: [],
    programTypes: [],
    targetEnterpriseTypes: [],
    supportOfferings: [],
  },
  howDidYouHear: {},
  declarationConsent: { accuracy: false, dataProcessing: false, termsConditions: false },
  advisorProfile: {
    personalProfessionalOverview: {},
    contactDetails: {},
    selectionCriteria: {},
    professionalCredentials: {},
    requiredDocuments: {},
    declarationConsent: {},
  },
  // Intern Profile Data
  internProfile: {
    personalOverview: {},
    academicOverview: {},
    experienceTrackRecord: {},
    skillsInterests: {},
    programAffiliation: {},
    requiredDocuments: {},
    declarationConsent: {},
  },
  // Program Sponsor Profile Data
  programSponsorProfile: {
    entityOverview: {},
    contactDetails: {},
    programDetails: {},
    declarationConsent: {},
  },
  // Catalyst Profile Data
  catalystProfile: {
    instructions: {},
    entityOverview: {},
    contactDetails: {},
    programmeDetails: {},
    applicationBrief: {},
    generalMatchingPreference: {},
    declarationConsent: {},
  },
}

function App() {
  const [profileImage, setProfileImage] = useState(null)
  const [formData, setFormData] = useState(initialFormData)
  const [showSummary, setShowSummary] = useState(false)
  const companyName = "Acme Inc"
  const { user, loading } = useAuth();

  const updateFormData = (section, data) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...data,
      },
    }))
  }

  const updateAdvisorData = (section, data) => {
    setFormData((prev) => ({
      ...prev,
      advisorProfile: {
        ...prev.advisorProfile,
        [section]: data,
      },
    }))
  }

  // Update Intern Data
  const updateInternData = (section, data) => {
    setFormData((prev) => ({
      ...prev,
      internProfile: {
        ...prev.internProfile,
        [section]: data,
      },
    }))
  }

  // Update Program Sponsor Data
  const updateProgramSponsorData = (section, data) => {
    setFormData((prev) => ({
      ...prev,
      programSponsorProfile: {
        ...prev.programSponsorProfile,
        [section]: data,
      },
    }))
  }

  // Update Catalyst Data
  const updateCatalystData = (section, data) => {
    setFormData((prev) => ({
      ...prev,
      catalystProfile: {
        ...prev.catalystProfile,
        [section]: data,
      },
    }))
  }

  const handleFormSubmit = () => {
    setShowSummary(true)
  }

  const withProtection = (Component, props = {}, layoutFn = renderSMERoute) => {
    return (
      <ProtectedRoute>
        {layoutFn(Component, props)}
      </ProtectedRoute>
    );
  };

  const withAdminProtection = (Component, props = {}) => {
    return (
      <ProtectedRoute allowedRoles={['Admin', 'admin']}>
        {renderAdminRoute(Component, props)}
      </ProtectedRoute>
    );
  };

  // Admin Protected Layout
  const AdminLayout = ({ children }) => {
    const location = useLocation()
    return (
      <div className="app-layout">
        <AdminSidebar />
        <div className="main-content">
          <AdminHeader />
          <div className="page-content">{children}</div>
        </div>
      </div>
    )
  }

  // SME Protected Layout
  const SMELayout = ({ children }) => {
    const location = useLocation()
    return (
      <div className="app-layout">
        <Sidebar companyName={companyName} />
        <div className="main-content">
          <SMSEHeader companyName={companyName} profileImage={profileImage} setProfileImage={setProfileImage} />
          <div className="page-content">{children}</div>
        </div>
        <RegistrationSummary data={formData} open={showSummary} onClose={() => setShowSummary(false)} />
      </div>
    )
  }

  // Investor Protected Layout
  const InvestorLayout = ({ children }) => {
    const location = useLocation()
    return (
      <div className="app-layout">
        <InvestorSidebar companyName={companyName} />
        <div className="main-content">
          <InvestorHeader companyName={companyName} profileImage={profileImage} setProfileImage={setProfileImage} />
          <div className="page-content">{children}</div>
        </div>
      </div>
    )
  }

  // Support Program Protected Layout
  const SupportProgramLayout = ({ children }) => {
    const location = useLocation()
    return (
      <div className="app-layout">
        <SupportProgramSidebar companyName={companyName} />
        <div className="main-content">
          <SupportProgramHeader
            companyName={companyName}
            profileImage={profileImage}
            setProfileImage={setProfileImage}
          />
          <div className="page-content">{children}</div>
        </div>
      </div>
    )
  }

  // Advisor Protected Layout
  const AdvisorLayout = ({ children }) => {
    const location = useLocation()
    return (
      <div className="app-layout">
        <AdvisorSidebar companyName={companyName} />
        <div className="main-content">
          <AdvisorHeader companyName={companyName} profileImage={profileImage} setProfileImage={setProfileImage} />
          <div className="page-content">{children}</div>
        </div>
      </div>
    )
  }

  // Intern Protected Layout
  const InternLayout = ({ children }) => {
    const location = useLocation()
    return (
      <div className="app-layout">
        <InternSidebar companyName={companyName} />
        <div className="main-content">
          <InternHeader companyName={companyName} profileImage={profileImage} setProfileImage={setProfileImage} />
          <div className="page-content">{children}</div>
        </div>
      </div>
    )
  }

  // Program Sponsor Protected Layout
  const ProgramSponsorLayout = ({ children }) => {
    const location = useLocation()
    return (
      <div className="app-layout">
        <ProgramSponsorSidebar companyName={companyName} />
        <div className="main-content">
          <ProgramSponsorHeader
            companyName={companyName}
            profileImage={profileImage}
            setProfileImage={setProfileImage}
          />
          <div className="page-content">{children}</div>
        </div>
      </div>
    )
  }

  // Render functions
  const renderAdminRoute = (Component, props = {}) => (
    <AdminLayout>
      <Component {...props} />
    </AdminLayout>
  )

  const renderSMERoute = (Component, props = {}) => (
    <SMELayout>
      <Component {...props} />
    </SMELayout>
  )

  const renderInvestorRoute = (Component, props = {}) => (
    <InvestorLayout>
      <Component {...props} />
    </InvestorLayout>
  )

  const renderSupportProgramRoute = (Component, props = {}) => (
    <SupportProgramLayout>
      <Component {...props} />
    </SupportProgramLayout>
  )

  const renderAdvisorRoute = (Component, props = {}) => (
    <AdvisorLayout>
      <Component {...props} />
    </AdvisorLayout>
  )

  const renderInternRoute = (Component, props = {}) => (
    <InternLayout>
      <Component {...props} />
    </InternLayout>
  )

  const renderProgramSponsorRoute = (Component, props = {}) => (
    <ProgramSponsorLayout>
      <Component {...props} />
    </ProgramSponsorLayout>
  )

  const renderSMEProfileSection = (Component, section) => (
    <SMELayout>
      <h1 className="text-3xl font-bold text-brown-800 mb-8">My Universal Profile</h1>
      <SMEProfileTracker activeSection={section} />
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        {formData[section] ? (
          <Component
            data={formData[section]}
            updateData={(data) => updateFormData(section, data)}
            onSubmit={section === "declarationConsent" ? handleFormSubmit : undefined}
          />
        ) : (
          <p>Loading data...</p>
        )}
      </div>
    </SMELayout>
  )

  const renderInvestorProfileSection = (Component, section) => (
    <InvestorLayout>
      <h1 className="text-3xl font-bold text-brown-800 mb-8">My Universal Profile</h1>
      <InvestorProfileTracker activeSection={section} />
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        {formData[section] ? (
          <Component data={formData[section]} updateData={(data) => updateFormData(section, data)} />
        ) : (
          <p>Loading data...</p>
        )}
      </div>
    </InvestorLayout>
  )

  const renderSupportProfileSection = (Component, section) => (
    <SupportProgramLayout>
      <h1 className="text-3xl font-bold text-brown-800 mb-8">My Universal Profile</h1>
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        {formData.catalystProfile[section] !== undefined ? (
          <Component
            data={formData.catalystProfile[section]}
            updateData={(data) => updateCatalystData(section, data)}
          />
        ) : (
          <p>Loading data...</p>
        )}
      </div>
    </SupportProgramLayout>
  )

  const renderAdvisorProfileSection = (Component, section) => (
    <AdvisorLayout>
      <h1 className="text-3xl font-bold text-brown-800 mb-8">Advisor Profile</h1>
      <ProfileTracker
        sections={[
          { id: "personal-professional-overview", title: "Personal & Professional Overview" },
          { id: "contact-details", title: "Contact Details" },
          { id: "selection-criteria", title: "Selection Criteria" },
          { id: "professional-credentials", title: "Professional Credentials" },
          { id: "required-documents", title: "Required Documents" },
          { id: "declaration-consent", title: "Declaration & Consent" },
        ]}
        currentSection={section}
        completedSections={new Set()}
        onSectionChange={() => {}}
      />
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        {formData.advisorProfile[section] !== undefined ? (
          <Component data={formData.advisorProfile[section]} updateData={(data) => updateAdvisorData(section, data)} />
        ) : (
          <p>Loading data...</p>
        )}
      </div>
    </AdvisorLayout>
  )

  const renderInternProfileSection = (Component, section) => (
    <InternLayout>
      <h1 className="text-3xl font-bold text-brown-800 mb-8">Intern Profile</h1>
      <ProfileTracker
        sections={[
          { id: "instructions", title: "Instructions" },
          { id: "personal-overview", title: "Personal Overview" },
          { id: "academic-overview", title: "Academic Overview" },
          { id: "experience-track-record", title: "Experience & Track Record" },
          { id: "skills-interests", title: "Skills & Interests" },
          { id: "program-affiliation", title: "Program Affiliation" },
          { id: "required-documents", title: "Required Documents" },
          { id: "declaration-consent", title: "Declaration & Consent" },
        ]}
        currentSection={section}
        completedSections={new Set()}
        onSectionChange={() => {}}
      />
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        {formData.internProfile[section] !== undefined ? (
          <Component data={formData.internProfile[section]} updateData={(data) => updateInternData(section, data)} />
        ) : (
          <p>Loading data...</p>
        )}
      </div>
    </InternLayout>
  )

  const renderProgramSponsorProfileSection = (Component, section) => (
    <ProgramSponsorLayout>
      <h1 className="text-3xl font-bold text-brown-800 mb-8">Program Sponsor Profile</h1>
      <ProfileTracker
        sections={[
          { id: "instructions", title: "Instructions" },
          { id: "entity-overview", title: "Entity Overview" },
          { id: "contact-details", title: "Contact Details" },
          { id: "program-details", title: "Program Details" },
          { id: "declaration-consent", title: "Declaration & Consent" },
        ]}
        currentSection={section}
        completedSections={new Set()}
        onSectionChange={() => {}}
      />
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        {formData.programSponsorProfile[section] !== undefined ? (
          <Component
            data={formData.programSponsorProfile[section]}
            updateData={(data) => updateProgramSponsorData(section, data)}
          />
        ) : (
          <p>Loading data...</p>
        )}
      </div>
    </ProgramSponsorLayout>
  )

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthForm />} />
        <Route path="/HowItWorks" element={<HowItWorks />} />
        <Route path="/BigScorePage" element={<BigScorePage />} />
        <Route path="/HowItWorksSMSE" element={<HowItWorksSMSE />} />
        <Route path="/HowItWorksCatalysts" element={<HowItWorksCatalysts />} />
        <Route path="/HowItWorksCorporates" element={<HowItWorksCorporates />} />
        <Route path="/HowItWorksInvestors" element={<HowItWorksInvestors />} />
        <Route path="/HowItWorksAdvisors" element={<HowItWorksAdvisors />} />
        <Route path="/HowItWorksInterns" element={<HowItWorksInterns />} />
        <Route path="/LoginRegister" element={<LoginRegister />} />
        <Route path="/RetrieveAccount" element={<RetrieveAccount />} />
        <Route path="/AboutPage" element={<AboutPage />} />
        <Route path="/FAQPage" element={<FAQPage />} />
        <Route path="/HomePage" element={<HomePage />} />
        <Route path="/ContactPage" element={<ContactPage />} />
        <Route path="/InsightsPage" element={<InsightsPage />} />
        <Route path="/Article1" element={<Article1 />} />
        <Route path="/HomeHowItWorks" element={<HomeHowItWorks />} />
        <Route path="/HomeBIGScorePage" element={<HomeBIGScorePage />} />
        <Route path="/HomeHeader" element={<HomeHeader />} />
        <Route path="/HomeInsightsPage" element={<HomeInsightsPage />} />
        <Route path="/HomeFAQPage" element={<HomeFAQPage />} />
        <Route path="/HomePageInvestor" element={<HomePageInvestor />} />
        <Route path="/HomeContactFormPage" element={<HomeContactFormPage />} />
        <Route path="/BetaForm" element={<BetaSignupForm />} />
        <Route path="/BIGScoreInvestor" element={<BIGScoreInvestor />} />
        <Route path="/ContactFormInvestor" element={<ContactFormInvestor />} />
        <Route path="/InsightsInvestor" element={<InsightsInvestor />} />
        <Route path="/FAQPageInvestor" element={<FAQPageInvestor />} />
        <Route path="/HeaderInvestor" element={<HeaderInvestor />} />
        <Route path="/BIGscoreAdvisor" element={<BIGscoreAdvisor />} />
        <Route path="/HowWorksAdvisors" element={<HowWorksAdvisors />} />
        <Route path="/InsightsAdvisor" element={<InsightsAdvisor />} />
        <Route path="/FAQsAdvisor" element={<FAQsAdvisor />} />
        <Route path="/ContactAdvisor" element={<ContactAdvisor />} />
        <Route path="/HeaderAdvisor" element={<HeaderAdvisor />} />
        <Route path="/HomePageInterns" element={<HomePageInterns />} />
        <Route path="/BIGscoreInterns" element={<BIGscoreInterns />} />
        <Route path="/InsightsInterns" element={<InsightsInterns />} />
        <Route path="/ContactInterns" element={<ContactInterns />} />
        <Route path="/FAQsInterns" element={<FAQsInterns />} />
        <Route path="/HowWorksInterns" element={<HowWorksInterns />} />
        <Route path="/HeaderInterns" element={<HeaderInterns />} />
        <Route path="/HomePageCatalysts" element={<HomePageCatalysts />} />
        <Route path="/BIGscoreCatalysts" element={<BIGscoreCatalysts />} />
        <Route path="/InsightsCatalysts" element={<InsightsCatalysts />} />
        <Route path="/ContactCatalysts" element={<ContactCatalysts />} />
        <Route path="/FAQsCatalysts" element={<FAQsCatalysts />} />
        <Route path="/HowWorksCatalysts" element={<HowWorksCatalysts />} />
        <Route path="/HeaderCatalysts" element={<HeaderCatalysts />} />
        <Route path="/HomePageProgram" element={<HomePageProgram />} />
        <Route path="/BIGscoreProgram" element={<BIGscoreProgram />} />
        <Route path="/InsightsProgram" element={<InsightsProgram />} />
        <Route path="/ContactProgram" element={<ContactProgram />} />
        <Route path="/FAQsProgram" element={<FAQsProgram />} />
        <Route path="/HowWorksProgram" element={<HowWorksProgram />} />
        <Route path="/HeaderProgram" element={<HeaderProgram />} />
        <Route path="/BookSession" element={<BookSession />} />
        <Route path="/HomePageAdvisor" element={<HomePageAdvisor />} />
        <Route path="/CharmSchool" element={<CharmSchool />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/card/:cardId" element={<CardLandingPage />} />

        {/* Admin Dashboard Routes */}
        <Route path="/admin" element={<Navigate to="/Auth" replace />} />
        <Route path="/admin/dashboard" element={withAdminProtection(AdminDashboard)} />
        <Route path="/admin/smes" element={withAdminProtection(AllSMEs)} />
        <Route path="/admin/investors" element={withAdminProtection(AllInvestors)} />
        <Route path="/admin/catalysts" element={withAdminProtection(AllCatalysts)} />
        <Route path="/admin/advisors" element={withAdminProtection(AllAdvisors)} />
        <Route path="/admin/documents" element={withAdminProtection(DocumentManagement)} />
        <Route path="/admin/settings" element={withAdminProtection(AdminSettings)} />
        <Route path="/admin/interns" element={withAdminProtection(AllInterns)} />
        <Route path="/admin/sponsors" element={withAdminProtection(AllSponsors)} />
        <Route path="/admin/qr-codes" element={withAdminProtection(QRCodes)} />
        <Route path="/admin/subscriptions" element={withAdminProtection(Subscriptions)} />
        
        {/* Admin Settings Subcategory Routes */}
        <Route path="/admin/settings/admin-users" element={withAdminProtection(AdminUsers)} />
        <Route path="/admin/settings/approval-workflows" element={withAdminProtection(ApprovalWorkflows)} />
        <Route path="/admin/settings/payment-gateway" element={withAdminProtection(PaymentGateway)} />
        <Route path="/admin/settings/email-templates" element={withAdminProtection(EmailTemplates)} />
        <Route path="/admin/settings/system-config" element={withAdminProtection(SystemConfig)} />
        <Route path="/admin/settings/backup-export" element={withAdminProtection(BackupExport)} />

        {/* Protected SME Dashboard Routes */}
        <Route path="/dashboard" element={withProtection(Dashboard, {}, renderSMERoute)} />
        <Route path="/profile" element={withProtection(Profile, {}, renderSMERoute)} />
        <Route path="/find-matches" element={withProtection(FindMatches, {}, renderSMERoute)} />
        <Route path="/my-documents" element={withProtection(MyDocuments, {}, renderSMERoute)} />
        <Route path="/growth" element={withProtection(GrowthSuiteLanding, {}, renderSMERoute)} />
        <Route path="/messages" element={withProtection(Messages, {}, renderSMERoute)} />
        <Route path="/calendar" element={withProtection(Calendar, {}, renderSMERoute)} />
        <Route path="/settings" element={withProtection(Settings, {}, renderSMERoute)} />
        <Route path="/documents" element={withProtection(ProfileSummary, {}, renderSMERoute)} />
        <Route path="/billing/subscriptions" element={withProtection(MySubscriptions, {}, renderSMERoute)} />
        <Route path="/billing/info" element={withProtection(BillingInformationSMSE, {}, renderSMERoute)} />
        <Route path="/billing/growth-tools-orders" element={withProtection(BillingHistorySMSE, {}, renderSMERoute)} />
        
        {/* Growth Tools Sub-Routes */}
        <Route path="/growth/my-tools" element={withProtection(MyToolsPage, {}, renderSMERoute)} />
        <Route path="/growth/shop" element={withProtection(ShopToolsPage, {}, renderSMERoute)} />

        {/* Growth Suite Routes - NEW */}
        <Route path="/growth-suite-landing" element={withProtection(GrowthSuiteLanding, {}, renderSMERoute)} />
        <Route path="/overall-company-health" element={withProtection(OverallCompanyHealth, {}, renderSMERoute)} />
        <Route path="/Strategy" element={withProtection(Strategy, {}, renderSMERoute)} />
        <Route path="/FinancialPerformance" element={withProtection(FinancialPerformance, {}, renderSMERoute)} />
        <Route path="/OperationalStrength" element={withProtection(OperationalStrength, {}, renderSMERoute)} />
        <Route path="/People" element={withProtection(People, {}, renderSMERoute)} />
        <Route path="/SocialImpact" element={withProtection(SocialImpact, {}, renderSMERoute)} />
        <Route path="/MarketingSales" element={withProtection(MarketingSales, {}, renderSMERoute)} />
        
        {/* Investor Billing and Payments Routes */}
        <Route path="/investor/billing/subscriptions" element={withProtection(InvestorsSubscriptions, {}, renderInvestorRoute)} />
        <Route path="/investor/billing/info" element={withProtection(BillingInfoInvestors, {}, renderInvestorRoute)} />
        <Route path="/investor/billing/history" element={withProtection(BillingHistoryInvestor, {}, renderInvestorRoute)} />

        {/* Protected Investor Dashboard Routes */}
        <Route path="/investor-documents" element={withProtection(Documents, {}, renderInvestorRoute)} />
        <Route path="/investor-dashboard" element={withProtection(InvestorDashboard, {}, renderInvestorRoute)} />
        <Route path="/investor-profile" element={withProtection(InvestorUniversalProfile, {}, renderInvestorRoute)} />
        <Route path="/investor-opportunities" element={withProtection(FindMatches, {}, renderInvestorRoute)} />
        <Route path="/investor-portfolio" element={<div>Coming Soon</div>} />
        <Route path="/investor-messages" element={withProtection(InvestorMessages, {}, renderInvestorRoute)} />
        <Route path="/investor-calendar" element={withProtection(InvestorCalendar, {}, renderInvestorRoute)} />
        <Route path="/investor-settings" element={withProtection(InvestorSettings, {}, renderInvestorRoute)} />
        <Route path="/my-investments" element={withProtection(MyInvestments, {}, renderInvestorRoute)} />
        <Route path="/my-cohorts" element={withProtection(MyCohorts, {}, renderInvestorRoute)} />

        {/* Protected Intern Dashboard Routes */}
        <Route path="/intern-dashboard" element={withProtection(InternDashboard, {}, renderInternRoute)} />
        <Route path="/intern-profile" element={withProtection(InternUniversalProfile, {}, renderInternRoute)} />
        <Route path="/intern-matches" element={withProtection(InternMatches, {}, renderInternRoute)} />
        <Route path="/intern-dealflow" element={withProtection(InternDealflow, {}, renderInternRoute)} />
        <Route path="/intern-table" element={withProtection(InternTable, {}, renderInternRoute)} />
        <Route path="/intern-messages" element={withProtection(InternMessages, {}, renderInternRoute)} />
        <Route path="/intern-documents" element={withProtection(InternDocuments, {}, renderInternRoute)} />
        <Route path="/intern-calendar" element={withProtection(InternCalendar, {}, renderInternRoute)} />
        <Route path="/intern-settings" element={withProtection(Settings, {}, renderInternRoute)} />

        {/* Protected Program Sponsor Dashboard Routes */}
        <Route path="/program-sponsor-dashboard" element={withProtection(ProgramSponsorDealflow, {}, renderProgramSponsorRoute)} />
        <Route path="/program-sponsor-profile" element={withProtection(ProgramSponsorUniversalProfile, {}, renderProgramSponsorRoute)} />
        <Route path="/program-sponsor-matches" element={withProtection(ProgramSponsorMatchesPage, {}, renderProgramSponsorRoute)} />
        <Route path="/program-sponsor-insights" element={withProtection(ProgramSponsorInsights, {}, renderProgramSponsorRoute)} />
        <Route path="/program-sponsor-table" element={withProtection(ProgramSponsorInternTable, {}, renderProgramSponsorRoute)} />
        <Route path="/program-sponsor-documents" element={withProtection(ProgramSponsorDocuments, {}, renderProgramSponsorRoute)} />
        <Route path="/program-sponsor-messages" element={withProtection(ProgramSponsorMessages, {}, renderProgramSponsorRoute)} />
        <Route path="/program-sponsor-calendar" element={withProtection(ProgramSponsorCalendar, {}, renderProgramSponsorRoute)} />
        <Route path="/program-sponsor-settings" element={withProtection(ProgramSponsorSettings, {}, renderProgramSponsorRoute)} />
        
        {/* Program Sponsor Billing Routes */}
        <Route path="/program-sponsor/billing/info" element={withProtection(ProgramSponsorBillingInfo, {}, renderProgramSponsorRoute)} />
        <Route path="/program-sponsor/billing/subscriptions" element={withProtection(ProgramSponsorSubscription, {}, renderProgramSponsorRoute)} />
        <Route path="/program-sponsor/billing/history" element={withProtection(ProgramSponsorBillingHistory, {}, renderProgramSponsorRoute)} />

        {/* Protected Support Program Dashboard Routes */}
        <Route path="/support-profile" element={withProtection(CatalystUniversalProfile, {}, renderSupportProgramRoute)} />
        <Route path="/support-beneficiaries" element={withProtection(FindMatches, {}, renderSupportProgramRoute)} />
        <Route path="/support-matches" element={withProtection(SupportMatchesPage, {}, renderSupportProgramRoute)} />
        <Route path="/support-documents" element={withProtection(CatalystDocuments, {}, renderSupportProgramRoute)} />
        <Route path="/support-messages" element={withProtection(Messages, {}, renderSupportProgramRoute)} />
        <Route path="/support-calendar" element={withProtection(Calendar, {}, renderSupportProgramRoute)} />
        <Route path="/support-analytics" element={withProtection(GrowthEnabler, {}, renderSupportProgramRoute)} />
        <Route path="/support-settings" element={withProtection(CatalystSettings, {}, renderSupportProgramRoute)} />
        <Route path="/catalyst/cohorts" element={withProtection(CatalystCohorts, {}, renderSupportProgramRoute)} />
        <Route path="/catalyst/investments" element={withProtection(CatalystInvestments, {}, renderSupportProgramRoute)} />

        {/* Protected Advisor Routes */}
        <Route path="/advisor-dashboard" element={withProtection(AdvisorDashboardPage, {}, renderAdvisorRoute)} />
        <Route path="/advisor-profile" element={withProtection(AdvisorProfile, {}, renderAdvisorRoute)} />
        <Route path="/advisor-documents" element={withProtection(AdvisorDocuments, {}, renderAdvisorRoute)} />
        <Route path="/advisor-messages" element={withProtection(AdvisorMessages, {}, renderAdvisorRoute)} />
        <Route path="/advisor-calendar" element={withProtection(Calendar, {}, renderAdvisorRoute)} />
        <Route path="/advisor-settings" element={withProtection(AdvisorSettings, {}, renderAdvisorRoute)} />
        
        {/* Advisor Billing Routes */}
        <Route path="/advisor/billing/info" element={withProtection(BillingInformationSMSE, {}, renderAdvisorRoute)} />
        <Route path="/advisor/billing/subscriptions" element={withProtection(MySubscriptions, {}, renderAdvisorRoute)} />
        <Route path="/advisor/billing/history" element={withProtection(MyDocuments, {}, renderAdvisorRoute)} />

        {/* Advisor Profile Sub-Routes */}
        <Route path="/advisor-profile/personal-professional-overview" element={renderAdvisorProfileSection(PersonalProfessionalOverview, "personalProfessionalOverview")} />
        <Route path="/advisor-profile/contact-details" element={renderAdvisorProfileSection(ContactDetails, "contactDetails")} />
        <Route path="/advisor-profile/selection-criteria" element={renderAdvisorProfileSection(SelectionCriteria, "selectionCriteria")} />
        <Route path="/advisor-profile/professional-credentials" element={renderAdvisorProfileSection(ProfessionalCredentials, "professionalCredentials")} />
        <Route path="/advisor-profile/required-documents" element={renderAdvisorProfileSection(RequiredDocuments, "requiredDocuments")} />
        <Route path="/advisor-profile/declaration-consent" element={renderAdvisorProfileSection(DeclarationConsent, "declarationConsent")} />

        {/* Intern Profile Sub-Routes */}
        <Route path="/intern-profile/instructions" element={renderInternProfileSection(Instructions, "instructions")} />
        <Route path="/intern-profile/personal-overview" element={renderInternProfileSection(InternPersonalOverview, "personalOverview")} />
        <Route path="/intern-profile/academic-overview" element={renderInternProfileSection(InternAcademicOverview, "academicOverview")} />
        <Route path="/intern-profile/experience-track-record" element={renderInternProfileSection(InternExperienceTrack, "experienceTrackRecord")} />
        <Route path="/intern-profile/skills-interests" element={renderInternProfileSection(InternSkillsInterests, "skillsInterests")} />
        <Route path="/intern-profile/program-affiliation" element={renderInternProfileSection(InternProgramAffiliation, "programAffiliation")} />
        <Route path="/intern-profile/required-documents" element={renderInternProfileSection(InternRequiredDocuments, "requiredDocuments")} />
        <Route path="/intern-profile/declaration-consent" element={renderInternProfileSection(InternDeclarationConsent, "declarationConsent")} />

        {/* Program Sponsor Profile Sub-Routes */}
        <Route path="/program-sponsor-profile/instructions" element={renderProgramSponsorProfileSection(ProgramSponsorInstructions, "instructions")} />
        <Route path="/program-sponsor-profile/entity-overview" element={renderProgramSponsorProfileSection(ProgramSponsorEntityOverview, "entityOverview")} />
        <Route path="/program-sponsor-profile/contact-details" element={renderProgramSponsorProfileSection(ProgramSponsorContactDetails, "contactDetails")} />
        <Route path="/program-sponsor-profile/program-details" element={renderProgramSponsorProfileSection(ProgramSponsorProgramDetails, "programDetails")} />
        <Route path="/program-sponsor-profile/declaration-consent" element={renderProgramSponsorProfileSection(ProgramSponsorDeclarationConsent, "declarationConsent")} />

        {/* Application Routes */}
        <Route path="/applications/funding" element={withProtection(FundingApplication, {}, renderSMERoute)} />
        <Route path="/applications/funding/:section" element={withProtection(FundingApplication, {}, renderSMERoute)} />
        <Route path="/applications/product" element={withProtection(ProductApplication, {}, renderSMERoute)} />
        <Route path="/applications/product/:section" element={withProtection(ProductApplication, {}, renderSMERoute)} />
        <Route path="/applications/advisory" element={withProtection(AdvisoryApplication, {}, renderSMERoute)} />
        <Route path="/applications/advisory/:section" element={withProtection(AdvisoryApplication, {}, renderSMERoute)} />
        
        {/* Intern Application Routes */}
        <Route path="/applications/intern" element={withProtection(InternApplication, {}, renderSMERoute)} />
        <Route path="/applications/intern/:section" element={withProtection(InternApplication, {}, renderSMERoute)} />
        <Route path="/applications/intern/instructions" element={withProtection(Instructions, {}, renderSMERoute)} />
        <Route path="/applications/intern/job-overview" element={withProtection(InternJobOverview, {}, renderSMERoute)} />
        <Route path="/applications/intern/internship-request" element={withProtection(InternInternshipRequest, {}, renderSMERoute)} />
        <Route path="/applications/intern/matching-agreement" element={withProtection(InternMatchingAgreement, {}, renderSMERoute)} />

        {/* SME Universal Profile Sub-Routes */}
        <Route path="/profile/instructions" element={renderSMEProfileSection(SMEInstructions, "instructions")} />
        <Route path="/profile/entity-overview" element={renderSMEProfileSection(SMEEntityOverview, "entityOverview")} />
        <Route path="/profile/ownership-management" element={renderSMEProfileSection(SMEOwnershipManagement, "ownershipManagement")} />
        <Route path="/profile/contact-details" element={renderSMEProfileSection(SMEContactDetails, "contactDetails")} />
        <Route path="/profile/legal-compliance" element={renderSMEProfileSection(SMELegalCompliance, "legalCompliance")} />
        <Route path="/profile/products-services" element={renderSMEProfileSection(SMEProductsServices, "productsServices")} />
        <Route path="/profile/how-did-you-hear" element={renderSMEProfileSection(SMEHowDidYouHear, "howDidYouHear")} />
        <Route path="/profile/declaration-consent" element={renderSMEProfileSection(SMEDeclarationConsent, "declarationConsent")} />

        {/* Investor Universal Profile Sub-Routes */}
        <Route path="/investor-profile/instructions" element={renderInvestorProfileSection(InvestorInstructions, "instructions")} />
        <Route path="/investor-profile/entity-overview" element={renderInvestorProfileSection(InvestorEntityOverview, "entityOverview")} />
        <Route path="/investor-profile/ownership-management" element={renderInvestorProfileSection(InvestorOwnershipManagement, "ownershipManagement")} />
        <Route path="/investor-profile/contact-details" element={renderInvestorProfileSection(InvestorContactDetails, "contactDetails")} />
        <Route path="/investor-profile/legal-compliance" element={renderInvestorProfileSection(InvestorLegalCompliance, "legalCompliance")} />
        <Route path="/investor-profile/products-services" element={renderInvestorProfileSection(InvestorProductsServices, "productsServices")} />
        <Route path="/investor-profile/how-did-you-hear" element={renderInvestorProfileSection(InvestorHowDidYouHear, "howDidYouHear")} />
        <Route path="/investor-profile/declaration-consent" element={renderInvestorProfileSection(InvestorDeclarationConsent, "declarationConsent")} />

        {/* Support Program Universal Profile Sub-Routes */}
        <Route path="/support-profile/instructions" element={renderSupportProfileSection(CatalystInstructions, "instructions")} />
        <Route path="/support-profile/entity-overview" element={renderSupportProfileSection(CatalystEntityOverview, "entityOverview")} />
        <Route path="/support-profile/contact-details" element={renderSupportProfileSection(CatalystContactDetails, "contactDetails")} />
        <Route path="/support-profile/program-details" element={renderSupportProfileSection(CatalystProgramDetails, "programmeDetails")} />
        <Route path="/support-profile/application-brief" element={renderSupportProfileSection(CatalystApplicationBrief, "applicationBrief")} />
        <Route path="/support-profile/matching-preference" element={renderSupportProfileSection(CatalystMatchingPreference, "generalMatchingPreference")} />
        <Route path="/support-profile/declaration-consent" element={renderSupportProfileSection(CatalystDeclarationConsent, "declarationConsent")} />
        <Route path="/support-profile/summary" element={renderSupportProfileSection(CatalystUniversalProfile, "summary")} />

        {/* Matches Routes */}
        <Route path="/opportunity-matches" element={withProtection(OpportunityMatchesPage, {}, renderSMERoute)} />
        <Route path="/customer-matches" element={withProtection(CustomerMatchesPage, {}, renderSMERoute)} />
        <Route path="/funding-matches" element={withProtection(FundingMatchesPage, {}, renderSMERoute)} />
        <Route path="/supplier-matches" element={withProtection(SupplierMatchesPage, {}, renderSMERoute)} />
        <Route path="/support-program-matches" element={withProtection(SupportProgramMatchesPage, {}, renderSMERoute)} />
        <Route path="/find-advisors" element={withProtection(SMSEAdvisorMatchesPage, {}, renderSMERoute)} />
        <Route path="/investor-matches" element={withProtection(MatchesPage, {}, renderInvestorRoute)} />
        
        {/* Intern Matches Routes */}
        <Route path="/intern-matches-page" element={withProtection(InternMatchesPage, {}, renderSMERoute)} />
        <Route path="/intern-dealflow-page" element={withProtection(InternDealflowPage, {}, renderSMERoute)} />
        <Route path="/intern-insights-page" element={withProtection(InternInsightsPage, {}, renderSMERoute)} />
        <Route path="/intern-table-page" element={withProtection(InternTablePage, {}, renderSMERoute)} />

        {/* Insights Routes */}
        <Route path="/insights" element={withProtection(BigInsights, {}, renderSMERoute)} />
        <Route path="/investor-insights" element={withProtection(InvestorInsights, {}, renderInvestorRoute)} />
        <Route path="/advisor-insights" element={withProtection(AdvisorInsights, {}, renderAdvisorRoute)} />
        <Route path="/intern-insights" element={withProtection(InternInsights, {}, renderInternRoute)} />
        <Route path="/program-sponsor-insights" element={withProtection(ProgramSponsorInsights, {}, renderProgramSponsorRoute)} />
        <Route path="/support-insights" element={withProtection(CatalystInsights, {}, renderSupportProgramRoute)} />

        {/* Redirects */}
        <Route path="/universal-profile" element={<Navigate to="/investor-profile" replace />} />
        <Route path="/investor-universal-profile" element={<Navigate to="/investor-profile/instructions" replace />} />
        <Route path="/support-universal-profile" element={<Navigate to="/support-profile/instructions" replace />} />
        <Route path="/applications/funding-application" element={<Navigate to="/applications/funding" replace />} />
        <Route path="/applications/product-application" element={<Navigate to="/applications/product" replace />} />
        <Route path="/applications/advisory-application" element={<Navigate to="/applications/advisory" replace />} />
        <Route path="/advisor" element={<Navigate to="/advisor-profile" replace />} />
        <Route path="/advisor-profile-main" element={<Navigate to="/advisor-profile/personal-professional-overview" replace />} />
        <Route path="/advisor-matches" element={<Navigate to="/find-advisors" replace />} />
        <Route path="/intern" element={<Navigate to="/intern-profile" replace />} />
        <Route path="/intern-profile-main" element={<Navigate to="/intern-profile/instructions" replace />} />
        <Route path="/program-sponsor" element={<Navigate to="/program-sponsor-profile" replace />} />
        <Route path="/program-sponsor-profile-main" element={<Navigate to="/program-sponsor-profile/instructions" replace />} />
        <Route path="/applications/intern-application" element={<Navigate to="/applications/intern" replace />} />
      </Routes>
    </Router>
  )
}


export default App
