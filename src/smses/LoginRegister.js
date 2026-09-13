"use client";
import { useState, useEffect, useRef, useLayoutEffect } from "react";

import { createPortal } from "react-dom";
import "./LoginRegister.css";
import RetrieveAccount from "./RetrieveAccount.js";
import {
  Mail,
  Lock,
  CheckCircle,
  Rocket,
  Smile,
  User,
  Briefcase,
  HeartHandshake,
  Loader2,
  Building2,
  TrendingUp,
  Users,
  GraduationCap,
  Award,
  X,
  AlertTriangle,
  Eye,
  EyeOff,
  Building,
  Globe,
  Landmark,
  ChevronDown,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "../firebaseConfig";
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

import { db } from "../firebaseConfig";
import { onAuthStateChanged, deleteUser } from "firebase/auth";
import NDASignupPopup from "../NDAsign";
import TermsConditionsCheckbox from "./Ts&cs";
import FormInput from "./FormInput";
import RoleCard from "./RoleCard";
import AdvisorCriteriaModal from "./AdvisorCriteriaModal";

// Set to false if you have not deployed the optional recoverIncompleteSignup
// Cloud Function. When false (or when the function is missing) the app simply
// falls back to the "reset your password" recovery path.
const SERVER_RECOVERY_ENABLED = true;

// Role cards configuration — outcome-first roles from the "BIG Marketplace
// Role-Based User Journey Developer Brief". `id` values match Firestore's
// roleArray/role fields and the routing maps below.
const ROLE_CARDS = [
  {
    id: "Business",
    title: "Business",
    icon: <Briefcase size={20} />,
    hoverInfo: "Commercial businesses seeking growth, markets, suppliers, funding, partnerships, etc.",
  },
  {
    id: "NonProfit",
    title: "NPOs",
    icon: <HeartHandshake size={20} />,
    hoverInfo: "NGOs/NPOs that are not primarily operating as catalysts.",
  },
  {
    id: "Corporate",
    title: "Corporate",
    icon: <Building size={20} />,
    hoverInfo: "Large companies looking for suppliers, innovation, partnerships, or ESD opportunities.",
  },
  {
    id: "Investor",
    title: "Investor/Funder",
    icon: <TrendingUp size={20} />,
    hoverInfo: "Banks, VCs, angel investors, DFIs, grant makers.",
  },
  {
    id: "Catalyst",
    title: "Catalyst",
    icon: <Rocket size={20} />,
    hoverInfo: "Organisations that enable business growth (ESD programmes, incubators, accelerators, development agencies, industry associations, universities, consultants, etc.).",
  },
  {
    id: "CapitalMarketFacilitators",
    title: "Capital and Market Facilitators",
    icon: <Landmark size={20} />,
    hoverInfo: "Organisations that help connect businesses to capital and market opportunities.",
  },
  {
    id: "BusinessAssociation",
    title: "Association and Member Organisations",
    icon: <Globe size={20} />,
    hoverInfo: "Network, collaborate, and build meaningful partnerships across the business ecosystem.",
  },
  {
    id: "Advisors",
    title: "Advisor",
    icon: <Users size={20} />,
    hoverInfo: "Offer your expertise to growing businesses.",
  },
  {
    id: "Interns",
    title: "Intern",
    icon: <GraduationCap size={20} />,
    hoverInfo: "Gain valuable experience, learn from industry experts.",
  },
  {
    id: "InternSponsor",
    title: "Intern Sponsor",
    icon: <Award size={20} />,
    hoverInfo: "Sponsor internship programs and build talent pipelines.",
  },
];

// Objective catalogue — outcome-first per role, from the brief §4.2. `service`
// is the internal BIG-service route shown once an objective is selected.
const ROLE_OBJECTIVES = {
  Business: [
    { id: "readiness", title: "Build my credibility and understand how ready we are", service: "BIG Score" },
    { id: "compliance-fix", title: "Get our compliance, licences and accreditations right", service: "Compliance & Accreditation Support + Compliance Vault" },
    { id: "compliance-maintain", title: "Keep our compliance documents organised, current and shareable", service: "Compliance Vault" },
    { id: "funding", title: "Find funding or investment", service: "Funding Matchmaking + BIG Score" },
    { id: "corporate-customers", title: "Win corporate customers and become supplier-ready", service: "Procurement Matchmaking + Supplier Readiness + Compliance Support" },
    { id: "sell-b2b", title: "Sell products or services to other businesses on BIG", service: "Procurement Matchmaking" },
    { id: "find-suppliers", title: "Find suppliers, partners or subcontractors", service: "Procurement Matchmaking" },
    { id: "improve-execution", title: "Improve our strategy, finance, operations, ESG and execution", service: "Growth Suite + Advisor Marketplace" },
    { id: "find-advisor", title: "Find an advisor, mentor or board member", service: "Advisor Marketplace" },
    { id: "recruit-intern", title: "Recruit an intern or graduate", service: "Internship Marketplace" },
    { id: "join-programme", title: "Join an ESD, incubator, accelerator or development programme", service: "Programme Matching + BIG Score + Growth Suite" },
    { id: "offer-services", title: "Offer professional or advisory services", service: "Business Marketplace + Advisor Marketplace" },
  ],
  Corporate: [
    { id: "find-suppliers", title: "Find and verify capable suppliers", service: "Procurement Matchmaking + Supplier Intelligence + BIG Score" },
    { id: "supplier-pipeline", title: "Build a pre-vetted supplier pipeline for a category or opportunity", service: "Procurement Matchmaking + Supplier Readiness" },
    { id: "help-compliance", title: "Help suppliers close compliance and accreditation gaps", service: "Compliance & Accreditation Support + Compliance Vault" },
    { id: "run-esd", title: "Run or monitor an ESD/Transformation programme", service: "ESD Platform + Programme Intelligence + Growth Suite" },
    { id: "sponsor-support", title: "Sponsor business-development support", service: "ESD Platform + Growth Suite" },
    { id: "sponsor-internships", title: "Sponsor or manage internships and graduate placements", service: "Internship Management + Internship Marketplace" },
    { id: "find-partners", title: "Find innovation, implementation or strategic partners", service: "Procurement Matchmaking" },
    { id: "monitor-portfolio", title: "Monitor supplier, cohort or portfolio performance", service: "Portfolio Intelligence" },
  ],
  Investor: [
    { id: "find-investable", title: "Find investment-ready or finance-ready businesses", service: "Funding Matchmaking + BIG Score" },
    { id: "invite-apply", title: "Invite businesses to apply for a funding opportunity", service: "Funding Pipeline" },
    { id: "screen-dd", title: "Screen opportunities and conduct due diligence", service: "BIG Score + Due Diligence" },
    { id: "manage-pipeline", title: "Manage a deal pipeline", service: "Funding Pipeline" },
    { id: "monitor-portfolio", title: "Monitor and support an existing portfolio", service: "Portfolio Intelligence + Growth Suite" },
    { id: "co-invest", title: "Refer or co-invest with other capital providers", service: "Funding Matchmaking + Referral Engine" },
  ],
  Catalyst: [
    { id: "recruit-cohort", title: "Recruit or onboard a new cohort", service: "Cohort Management" },
    { id: "assess-participants", title: "Assess and select programme participants", service: "BIG Score + Programme Assessment" },
    { id: "help-compliance", title: "Help participants fix compliance and accreditation gaps", service: "Compliance & Accreditation Support + Compliance Vault" },
    { id: "deliver-support", title: "Deliver and track business-development support", service: "Growth Suite + Programme Intelligence" },
    { id: "match-participants", title: "Match participants to markets, capital, advisors or interns", service: "Marketplace Matching" },
    { id: "manage-providers", title: "Manage service providers and interventions", service: "Cohort Management + Growth Suite" },
    { id: "report-outcomes", title: "Report outcomes to a corporate, funder or public sponsor", service: "Programme Intelligence + Portfolio Intelligence" },
  ],
  CapitalMarketFacilitators: [
    { id: "onboard-clients", title: "Onboard and manage SME clients", service: "Client & Portfolio Management" },
    { id: "prepare-capital", title: "Prepare clients for capital", service: "BIG Score + Growth Suite + Compliance Support" },
    { id: "match-funders", title: "Match clients to funders", service: "Funding Matchmaking" },
    { id: "prepare-markets", title: "Prepare clients for markets or corporate supply chains", service: "Supplier Readiness + Compliance Support" },
    { id: "match-customers", title: "Match clients to customers and commercial opportunities", service: "Procurement Matchmaking" },
    { id: "track-referrals", title: "Track referrals, deals, success fees and client progress", service: "Referral Engine + Portfolio Intelligence" },
  ],
  BusinessAssociation: [
    { id: "member-directory", title: "Onboard and maintain a member directory", service: "Member & Portfolio Management" },
    { id: "verify-members", title: "Verify and segment member capabilities", service: "BIG Score + Supplier Intelligence" },
    { id: "help-compliance", title: "Help members improve compliance and accreditations", service: "Compliance & Accreditation Support + Compliance Vault" },
    { id: "share-opportunities", title: "Share market, funding or programme opportunities", service: "Marketplace Matching" },
    { id: "coordinate-support", title: "Provide or coordinate member support", service: "Growth Suite + Advisor Marketplace" },
    { id: "connect-members", title: "Connect members to buyers, funders, advisors or talent", service: "Marketplace Matching" },
    { id: "report-member-needs", title: "Understand and report on member needs and performance", service: "Portfolio Intelligence" },
  ],
  Advisors: [
    { id: "offer-advisory", title: "Offer advisory, mentoring or coaching services", service: "Advisor Marketplace" },
    { id: "board-roles", title: "Find board or governance roles", service: "Advisor Marketplace" },
    { id: "receive-leads", title: "Receive qualified leads from businesses", service: "Advisor Marketplace + Referral Engine" },
    { id: "join-cohort", title: "Join a programme or cohort as an expert", service: "Advisor Marketplace + Programme Matching" },
    { id: "build-profile", title: "Build a visible, verified expertise profile", service: "Advisor Verification" },
  ],
  Interns: [
    { id: "find-placement", title: "Find an internship or workplace placement", service: "Internship Marketplace" },
    { id: "skills-profile", title: "Build a verified skills and interests profile", service: "Skills Profile" },
    { id: "readiness-dev", title: "Complete workplace-readiness development", service: "Workplace Readiness / Charm School" },
    { id: "get-matched", title: "Be matched to SMEs or corporate opportunities", service: "Internship Marketplace" },
    { id: "track-progress", title: "Track applications, placement and experience", service: "Internship Management" },
  ],
};

// Legacy role ids (kept for backward compatibility) reuse the nearest brief role's objective set
const getObjectivesForRole = (roleId) => {
  if (ROLE_OBJECTIVES[roleId]) return ROLE_OBJECTIVES[roleId];
  if (roleId === "NonProfit") return ROLE_OBJECTIVES.Business;
  if (roleId === "InternSponsor") return ROLE_OBJECTIVES.Corporate;
  if (roleId === "SMSEs" || roleId === "SMSE" || roleId === "SMEs") return ROLE_OBJECTIVES.Business;
  if (roleId === "Accelerators") return ROLE_OBJECTIVES.Catalyst;
  if (roleId === "ProgramSponsor") return ROLE_OBJECTIVES.Corporate;
  if (roleId === "Association") return ROLE_OBJECTIVES.BusinessAssociation;
  return [];
};

// Copy-ready role definitions — used for the dropdown's "typically used by /
// what you can do" panel and the "Help me choose" quiz recommendation cards.
const ROLE_DEFINITIONS = {
  Business: {
    roleType: "Organisation",
    chooseIf: "Choose this if your organisation wants to grow, sell, buy, raise funding, strengthen readiness or access business support.",
    typicallyUsedBy: "SMEs, start-ups, scale-ups, social enterprises, co-operatives and NPOs seeking markets, capital or organisational growth.",
    whatYouCanDo: [
      "Build a trusted business profile",
      "Get compliance and accreditations right",
      "Find customers, suppliers, funders and programmes",
      "Use the BIG Score, Growth Suite and matching tools relevant to your goals",
    ],
  },
  NonProfit: {
    roleType: "Organisation",
    chooseIf: "For NGOs/NPOs whose main goal is funding, customers or growth. If you run programmes for others, choose Catalyst instead; if you represent a membership base, choose Association.",
    typicallyUsedBy: "NGOs and NPOs seeking markets, capital or organisational growth in the same way an SME would.",
    whatYouCanDo: [
      "Build a trusted organisation profile",
      "Get compliance and accreditations right",
      "Find funders, partners and programmes",
      "Use the BIG Score and matching tools relevant to your goals",
    ],
  },
  Corporate: {
    roleType: "Organisation",
    chooseIf: "Choose this if your organisation wants to source, develop, sponsor or monitor businesses, suppliers, programmes or talent.",
    typicallyUsedBy: "Large companies, state-owned entities, government departments and other institutional buyers or sponsors.",
    whatYouCanDo: [
      "Discover and assess suppliers",
      "Manage procurement, ESD/Transformation or CSI pipelines",
      "Sponsor SMEs or internships",
      "Monitor programme and portfolio outcomes",
    ],
  },
  Investor: {
    roleType: "Organisation or verified individual",
    chooseIf: "Choose this if you provide debt, equity, grants or other capital and want to find, assess or support opportunities.",
    typicallyUsedBy: "Banks, DFIs, VC and PE funds, impact investors, grant makers, family offices and verified angel investors.",
    whatYouCanDo: [
      "Access pre-vetted deal flow",
      "Configure investment criteria",
      "Screen and manage a pipeline",
      "Use BIG Score, due-diligence and portfolio intelligence",
    ],
  },
  Catalyst: {
    roleType: "Organisation",
    chooseIf: "Choose this if your organisation designs or delivers structured business-development support.",
    typicallyUsedBy: "ESD programme providers, incubators, accelerators, development agencies, universities and specialist business-support organisations.",
    whatYouCanDo: [
      "Onboard and assess cohorts",
      "Manage interventions and progress",
      "Connect participants to markets, capital, advisors and talent",
      "Report outcomes to sponsors",
    ],
  },
  CapitalMarketFacilitators: {
    roleType: "Organisation",
    chooseIf: "Choose this if your organisation actively helps businesses secure capital, customers or commercial opportunities.",
    typicallyUsedBy: "Capital-raising advisers, market-access firms, transaction advisers, deal originators and specialist SME facilitators.",
    whatYouCanDo: [
      "Onboard SME clients",
      "Prepare and match them to capital and markets",
      "Manage capital and market pipelines",
      "Track referrals, opportunities and shared commercial outcomes",
    ],
  },
  BusinessAssociation: {
    roleType: "Organisation",
    chooseIf: "Choose this if your organisation represents, organises or serves a defined membership base.",
    typicallyUsedBy: "Industry bodies, chambers, professional associations, federations, clusters and member networks.",
    whatYouCanDo: [
      "Onboard and segment members",
      "Verify capabilities",
      "Share opportunities and support",
      "Connect members to buyers, funders, advisors and programmes",
    ],
  },
  Advisors: {
    roleType: "Individual",
    chooseIf: "Choose this if you personally want to advise, mentor, coach, serve on a board or deliver specialist expertise to businesses.",
    typicallyUsedBy: "Experienced executives, independent professionals, board candidates, mentors, coaches and technical specialists.",
    whatYouCanDo: [
      "Create a trusted expertise profile",
      "Receive relevant advisory or board opportunities",
      "Connect with qualified businesses",
      "Manage engagements and referrals",
    ],
  },
  Interns: {
    roleType: "Individual",
    chooseIf: "Choose this if you are seeking practical work experience, workplace readiness or an internship placement.",
    typicallyUsedBy: "Students, final-year learners, recent graduates and work-seeking early-career talent.",
    whatYouCanDo: [
      "Build a skills profile",
      "Complete readiness activities",
      "Discover and apply for placements",
      "Match with businesses and track your development journey",
    ],
  },
  InternSponsor: {
    roleType: "Organisation",
    chooseIf: "For an organisation sponsoring or managing internship placements. Register as Corporate or Catalyst and choose \"Sponsor or manage internship placements\" as your objective.",
    typicallyUsedBy: "Corporates and Catalysts running structured internship or graduate programmes.",
    whatYouCanDo: [
      "Sponsor internship placements",
      "Track intern applications and outcomes",
      "Build a talent pipeline",
    ],
  },
};

// Error message mapping
const ERROR_MESSAGES = {
  "auth/invalid-credential": "❌ Invalid email or password. Please try again.",
  "auth/wrong-password": "❌ Invalid email or password. Please try again.",
  "auth/user-not-found": "❌ Invalid email or password. Please try again.",
  "auth/email-already-in-use":
    "📧 This email is already registered. Try logging in or resetting your password.",
  "auth/weak-password": "🔒 Password should be at least 6 characters.",
  "auth/invalid-email": "📧 Please enter a valid email address.",
  "auth/user-disabled":
    "🚫 This account has been disabled. Please contact support.",
  "auth/too-many-requests": "⏳ Too many attempts. Please try again later.",
  "auth/network-request-failed":
    "📡 Network error. Please check your connection.",
  "auth/operation-not-allowed":
    "⚙️ This operation is not allowed. Please contact support.",
  "auth/requires-recent-login":
    "🔐 Please log in again to complete this action.",
  "permission-denied": "🚫 You don't have permission to perform this action.",
  "not-found": "🔍 Requested data not found.",
  unavailable: "🔄 Service temporarily unavailable. Please try again.",
};

// Shown when Firestore is unreachable — almost always an ad blocker or
// privacy extension killing firestore.googleapis.com (ERR_BLOCKED_BY_CLIENT).
const BLOCKED_HINT =
  "🚫 We couldn't save your profile, so nothing was created and your email is still free to use. If you use an ad blocker, privacy extension, or strict browser shields, disable them for this site (they block firestore.googleapis.com) and try again.";

const TERMS_VERSION = "2.0";

// Full T&Cs and NDA text content — module level so registration and the
// NDA flow can both reference exactly the same document.
const buildTermsAndNDAContent = () => `
BIG MARKETPLACE – PLATFORM TERMS & CONDITIONS AND MUTUAL NDA

Effective Date: ${new Date().toLocaleDateString()}
Applies To: All Registered Users (SMEs, Funders, Service Providers, Corporates, Accelerators, and Interns)

PART A: MUTUAL NON-DISCLOSURE AGREEMENT (NDA)

1. Purpose
This Mutual NDA governs the protection and non-disclosure of Confidential Information exchanged between BIG Marketplace users and between each user and Brown Ivory Group Proprietary Limited ("BIG").

2. Definition of Confidential Information
"Confidential Information" includes, but is not limited to: business plans, financial information, funding requirements, investment terms, product/service data, IP, customer data, documents, and any non-public business or personal data disclosed via the platform or through follow-up communications.

3. Mutual Obligations
All parties agree to:
- Keep Confidential Information strictly confidential.
- Use it solely for evaluation or engagement within the BIG Marketplace platform.
- Not disclose it to third parties except employees or advisors who are bound by similar confidentiality obligations.

4. Permitted Disclosures
Information may be disclosed:
- To advisors who have a need to know.
- As required by law or legal process (with notice to the disclosing party).
- If already in the public domain or lawfully obtained from another source.

5. Duration
This NDA is valid:
- For two years from date of last disclosure on the platform, or
- Until the Confidential Information becomes publicly available through no fault of the receiving party.

6. Data Protection
All users agree to comply with applicable data protection laws, including POPIA. Personal Information may not be misused, shared, or processed outside the intended platform purpose without explicit consent.

7. Return or Destruction
Upon written request, users must return or delete any Confidential Information shared with them via the platform.

8. No License or IP Rights
No rights to Confidential Information or underlying IP are granted by this NDA.

9. Breach & Enforcement
Violation of this NDA may result in:
- Removal from the BIG Marketplace platform,
- Legal action and damages, and
- Blacklisting from the ecosystem.

PART B: PLATFORM TERMS & CONDITIONS

1. Introduction & Acceptance
1.1. By registering on BIG Marketplace, you agree to these Terms & Conditions and the accompanying Mutual NDA.
1.2. These terms govern the use of the BIG Marketplace platform, a trust-based ecosystem designed to match high-impact businesses with funders, service providers, and growth enablers.
1.3. All users agree to act in good faith and uphold the integrity, confidentiality, and accountability standards of the platform.

2. Universal User Responsibilities
2.1. Maintain complete, truthful, and current profile information.
2.2. Acknowledge and respect the platform's deal flow lifecycle by updating the status of every interaction (e.g., matched, declined, in negotiation, term sheet signed).
2.3. Do not engage with any party introduced via BIG Marketplace outside the platform in order to avoid fees or visibility.
2.4. Accept that BIG Marketplace reserves the right to audit usage logs and communication records where misconduct or circumvention is suspected.

3. SMEs (Small & Medium Enterprises)
3.1. Undergo BIG Score pre-vetting based on financials, operations, governance, and growth potential.
3.2. Upload necessary documentation (e.g., CIPC docs, tax clearance, financials).
3.3. Accurately update deal status, including:
- "Declined" with reason
- "Term Sheet Signed" with supporting document
- "Deal Finalized"
3.4. Acknowledge that participation in funded engagements or provider relationships may be subject to verification.

4. Funders / Investors
4.1. Agree to a standard 3% commission fee on all funding deals concluded with SMEs introduced via the platform.
4.2. Fee Triggers:
- Triggered upon term sheet signing or equivalent contractual commitment.
- Payable within 30 days of deal finalisation.
- Applies to all funding types (grants, equity, loans, convertible notes).
4.3. Obligations:
- Update all deal statuses throughout the lifecycle.
- Upload executed term sheets.
- Refrain from bypassing platform communication or execution.

5. Service Providers
5.1. May be listed on the platform following vetting (as applicable).
5.2. Agree to pay a referral or success fee on new SME engagements sourced through BIG Marketplace, if and when a commercial transaction occurs.
5.3. Commit to:
- Delivering services aligned with scope and professional ethics
- Participating in quality reviews and satisfaction ratings
- Not circumventing the platform once matched with a business

6. Corporates / Accelerators / Incubators
6.1. May access the SME database via:
- Monthly or annual enterprise subscription
- API integration (where technically feasible and contractually agreed)
6.2. Agree to:
- Mark all SME engagements with outcomes (e.g., shortlisted, accepted into program, declined).
- Participate in platform usage reviews and engagement tracking.
6.3. Fees:
- No success-based commission is charged unless separately agreed upon.
- Customized pricing and licensing may apply for premium features (e.g., scoring access, custom filters, analytics dashboards).
6.4. Corporates engaging SMEs for ESD/CSR/Procurement purposes must:
- Respect the pre-vetting system
- Provide updates on funded or contracted SMEs
- Use data only for permitted sourcing activities (no data scraping, resale, or off-platform marketing)

7. Data Usage, Privacy & Confidentiality
7.1. All users are bound by the Mutual Non-Disclosure Agreement (Part A) and data privacy regulations (POPIA/GDPR compliant).
7.2. BIG Marketplace will not share confidential user data without consent, except to facilitate matchmaking or regulatory compliance.
7.3. The platform may use anonymized or aggregated data to improve AI matching, user experience, and market insights.

8. Breach & Dispute Resolution
8.1. Any form of circumvention, data misuse, or failure to pay applicable fees constitutes a material breach.
8.2. Breaches may result in:
- Immediate account suspension
- Legal action to recover fees or damages
- Blacklisting from the platform
8.3. Disputes shall be resolved first via internal mediation. If unresolved, disputes will be referred to arbitration under South African commercial law.

9. Amendments & Acceptance
9.1. BIG Marketplace may amend these terms periodically.
9.2. Users will be notified of changes and must accept updated terms to continue using the platform.

FINAL ACKNOWLEDGEMENT
By using this platform, you confirm that you:
- Have read and understood these Terms & Conditions and the Mutual NDA
- Agree to be bound by them
- Agree to maintain confidentiality of all information shared on the platform
- Acknowledge the fee structures and responsibilities applicable to your stakeholder category
`.trim();

export default function LoginRegister() {
  const navigate = useNavigate();
  const location = useLocation();

  // State declarations
  const [isRegistering, setIsRegistering] = useState(
    new URLSearchParams(location.search).get("mode") === "login"
  );
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [roles, setRoles] = useState([]);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [showNDA, setShowNDA] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);
  const [ndaComplete, setNdaComplete] = useState(false);
  const [showAdvisorCriteria, setShowAdvisorCriteria] = useState(false);
  const [roleSelectionModal, setRoleSelectionModal] = useState({
    show: false,
    roles: [],
  });
  const [resumingRegistration, setResumingRegistration] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [termsAcceptanceTimestamp, setTermsAcceptanceTimestamp] = useState(null);

  // NEW: role dropdown open/close + positioning (portaled menu, replaces the
  // old card grid so it can't get clipped by parent overflow)
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef(null); // wraps the trigger button
  const roleDropdownMenuRef = useRef(null); // the portaled menu itself
  const [roleDropdownPos, setRoleDropdownPos] = useState({
    top: 0,
    bottom: undefined,
    left: 0,
    width: 0,
    maxHeight: 320,
  });

  // NEW: which dropdown row's "typically used by / what you can do" panel is expanded
  const [expandedRoleId, setExpandedRoleId] = useState(null);

  // NEW: primary role + objective tracking (pre-signup role/objective sequence)
  const [primaryRole, setPrimaryRole] = useState("");
  const [selectedObjectives, setSelectedObjectives] = useState([]); // objective ids, scoped to primaryRole
  const [primaryObjective, setPrimaryObjective] = useState("");

  // NEW: per-role objectives cache so switching roles doesn't lose earlier
  // picks — { [roleId]: { selected: [...], primary: "id" } }
  const [objectivesByRole, setObjectivesByRole] = useState({});

  // NEW: objectives popup — opens right after a role is selected, instead of
  // an inline list sitting on the login screen
  const [showObjectiveModal, setShowObjectiveModal] = useState(false);

  // NEW: "Help me choose" guided role quiz
  const [showRoleQuiz, setShowRoleQuiz] = useState(false);
  const [quizStep, setQuizStep] = useState(1);
  const [quizJoiningAs, setQuizJoiningAs] = useState(""); // "individual" | "organisation" | "both"
  const [quizOrgNeed, setQuizOrgNeed] = useState("");
  const [quizIndividualGoal, setQuizIndividualGoal] = useState("");

  // True while an account is mid-creation, so background watchers never
  // mistake an in-flight signup for an abandoned one.
  const registrationInFlight = useRef(false);

  // ---------------------------------------------------------------------------
  // Recovery helpers
  // ---------------------------------------------------------------------------

  // A profile only counts as complete if the doc exists AND has real data
 // A profile only counts as complete if the doc exists AND has real data
const isProfileComplete = (snap) => {
  if (!snap || !snap.exists()) return false;
  const data = snap.data();
  const hasRoles =
    (Array.isArray(data.roleArray) && data.roleArray.length > 0) ||
    (typeof data.role === "string" && data.role.trim() !== "") ||
    (data.roles && Object.keys(data.roles).length > 0) ||
    (typeof data.currentRole === "string" && data.currentRole.trim() !== "");

  // Any role selection means someone actually signed up — this is the one
  // signal we trust unconditionally. Never let a partial/racy read of the
  // other fields (registrationCompleted, username) purge an account that
  // has real role data sitting in it.
  if (hasRoles) return true;

  return data.registrationCompleted === true && !!data.username;
};

  const resetRegistrationForm = (keepEmail = "") => {
    setEmail(keepEmail);
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setRoles([]);
    setAgreeToTerms(false);
    setTermsAcceptanceTimestamp(null);
    setCodeSent(false);
    setIsEmailVerified(false);
    setRegistrationData(null);
    setResumingRegistration(false);
    setErrors({});
    // NEW: reset role/objective state too
    setPrimaryRole("");
    setSelectedObjectives([]);
    setPrimaryObjective("");
    setObjectivesByRole({});
    setRoleDropdownOpen(false);
    setShowObjectiveModal(false);
    setExpandedRoleId(null);
  };

  // Caller MUST have just signed in as this user (satisfies recent-login requirement)
  const purgeIncompleteAccount = async (user) => {
    try {
      await Promise.allSettled([
        deleteDoc(doc(db, "users", user.uid)),
        deleteDoc(doc(db, "termsAcceptance", user.uid)),
      ]);
      await deleteUser(user);
      return { ok: true };
    } catch (error) {
      console.error("Failed to purge incomplete account:", error);
      try {
        await auth.signOut();
      } catch (_) {}
      return { ok: false, error };
    }
  };

  // Returns: "recovered" | "complete" | "wrong-password" | "failed"
  const recoverOrphanedEmail = async (targetEmail, targetPassword) => {
    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        targetEmail,
        targetPassword
      );
      let snap;
      try {
        snap = await getDoc(doc(db, "users", cred.user.uid));
      } catch (readError) {
        console.error("Profile read failed:", readError);
        await auth.signOut();
        return "failed"; // never delete on a failed read
      }
      if (isProfileComplete(snap)) {
        await auth.signOut();
        return "complete";
      }
      const res = await purgeIncompleteAccount(cred.user);
      return res.ok ? "recovered" : "failed";
    } catch (error) {
      if (
        [
          "auth/wrong-password",
          "auth/invalid-credential",
          "auth/user-not-found",
        ].includes(error.code)
      ) {
        return "wrong-password";
      }
      console.error("Recovery attempt failed:", error);
      return "failed";
    }
  };

  // Last resort when the user is signed out and cannot remember the password
  // they used. Requires the optional recoverIncompleteSignup Cloud Function.
  // Returns: "recovered" | "protected" | "no-account" | "failed"
  const recoverWhenSignedOut = async (targetEmail) => {
    if (!SERVER_RECOVERY_ENABLED) return "failed";
    try {
      const fn = httpsCallable(getFunctions(), "recoverIncompleteSignup");
      const res = await fn({ email: targetEmail });
      return res?.data?.status || "failed";
    } catch (error) {
      console.warn("Server-side recovery unavailable:", error?.code || error);
      return "failed";
    }
  };

  // Utility functions
  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const getCustomErrorMessage = (error) => {
    if (!error?.code)
      return "🔧 An unexpected error occurred. Please try again.";
    return (
      ERROR_MESSAGES[error.code] || "❌ Something went wrong. Please try again."
    );
  };

  const getRoleIcon = (roleValue) => {
    const iconMap = {
      "Business": <Briefcase size={16} />,
      "Non-Profit": <HeartHandshake size={16} />,
      "NPOs": <HeartHandshake size={16} />,
      "NonProfit": <HeartHandshake size={16} />,
      "Investor/Funder": <Rocket size={16} />,
      "Corporate": <Building size={16} />,
      "Catalyst": <Building2 size={16} />,
      "CapitalMarketFacilitators": <Landmark size={16} />,
      "Capital and Market Facilitators": <Landmark size={16} />,
      "Advisor": <Users size={16} />,
      "Intern": <GraduationCap size={16} />,
      "Intern Sponsor": <Award size={16} />,
      "InternSponsor": <Award size={16} />,
      "Business Association": <Globe size={16} />,
      "BusinessAssociation": <Globe size={16} />,
      "Association and Member Organisations": <Globe size={16} />,
      // Backward compatibility with older stored role ids
      "Small and Medium Social Enterprises": <Briefcase size={16} />,
      SMSEs: <Briefcase size={16} />,
      SMSE: <Briefcase size={16} />,
      SMEs: <Briefcase size={16} />,
      Investor: <Rocket size={16} />,
      Advisors: <Users size={16} />,
      Accelerators: <Building2 size={16} />,
      Catalyst: <Building2 size={16} />,
      Interns: <GraduationCap size={16} />,
      ProgramSponsor: <Award size={16} />,
      Association: <Globe size={16} />,
      Admin: <TrendingUp size={16} />,
    };
    return iconMap[roleValue] || <Smile size={16} />;
  };

  const navigateToRoleDashboard = (role) => {
    const routeMap = {
      "Business": "/profile",
      "Non-Profit": "/profile",
      "NonProfit": "/profile",
      "Investor/Funder": "/investor-profile",
      "Corporate": "/corporate-profile",
      "Catalyst": "/support-profile",
      "CapitalMarketFacilitators": "/cmf-profile",
      "Advisor": "/advisor-profile",
      "Intern": "/intern-profile",
      "Intern Sponsor": "/intern-sponsor-profile",
      "InternSponsor": "/intern-sponsor-profile",
      "Business Association": "/associator-profile",
      "BusinessAssociation": "/associator-profile",
      // Backward compatibility with older stored role ids
      Investor: "/investor-profile",
      INVESTOR: "/investor-profile",
      "Small and Medium Social Enterprises": "/profile",
      SMSEs: "/profile",
      SMSE: "/profile",
      SMEs: "/profile",
      "SME/BUSINESS": "/profile",
      Advisors: "/advisor-profile",
      ADVISOR: "/advisor-profile",
      Accelerators: "/support-profile",
      Interns: "/intern-profile",
      INTERN: "/intern-profile",
      ProgramSponsor: "/intern-sponsor-profile",
      PROGRAM_SPONSOR: "/intern-sponsor-profile",
      Association: "/associator-profile",
      Admin: "/admin/dashboard",
      admin: "/admin/dashboard",
      ADMIN: "/admin/dashboard",
    };
    navigate(routeMap[role] || "/auth");
  };

  // Event handlers
  // UPDATED: opens the objectives popup right after a role with objectives is
  // added, loading any previously cached picks for that role, and closes the
  // popup if that same role gets unselected.
  const handleRoleSelect = (roleId) => {
    if (roleId === "Advisors") {
      setShowAdvisorCriteria(true);
      return;
    }

    const isAdding = !roles.includes(roleId);

    setRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((r) => r !== roleId)
        : [...prev, roleId]
    );
    setErrors((prev) => ({ ...prev, role: "" }));

    if (isAdding) {
      const objectives = getObjectivesForRole(roleId);
      if (objectives.length > 0) {
        const cached = objectivesByRole[roleId];
        setPrimaryRole(roleId);
        setSelectedObjectives(cached?.selected || []);
        setPrimaryObjective(cached?.primary || "");
        setRoleDropdownOpen(false); // close the role list — show only this role's popup
        setShowObjectiveModal(true);
      }
    } else if (primaryRole === roleId) {
      setShowObjectiveModal(false);
    }
  };

  const handleAdvisorCriteriaAccept = () => {
    setShowAdvisorCriteria(false);

    const isAdding = !roles.includes("Advisors");

    setRoles((prev) =>
      prev.includes("Advisors")
        ? prev.filter((r) => r !== "Advisors")
        : [...prev, "Advisors"]
    );
    setErrors((prev) => ({ ...prev, role: "" }));

    if (isAdding) {
      const objectives = getObjectivesForRole("Advisors");
      if (objectives.length > 0) {
        const cached = objectivesByRole["Advisors"];
        setPrimaryRole("Advisors");
        setSelectedObjectives(cached?.selected || []);
        setPrimaryObjective(cached?.primary || "");
        setRoleDropdownOpen(false);
        setShowObjectiveModal(true);
      }
    }
  };

  // NEW: sync primaryRole with the current roles selection
  useEffect(() => {
    if (roles.length === 0) {
      setPrimaryRole("");
      setSelectedObjectives([]);
      setPrimaryObjective("");
      return;
    }
    if (!roles.includes(primaryRole)) {
      const fallback = roles[0];
      const cached = objectivesByRole[fallback];
      setPrimaryRole(fallback);
      setSelectedObjectives(cached?.selected || []);
      setPrimaryObjective(cached?.primary || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles]);

  // NEW: mirror the active role's objective picks into the cache on every change
  useEffect(() => {
    if (!primaryRole) return;
    setObjectivesByRole((prev) => ({
      ...prev,
      [primaryRole]: { selected: selectedObjectives, primary: primaryObjective },
    }));
  }, [primaryRole, selectedObjectives, primaryObjective]);

  // NEW: objective picker handlers
  const handleObjectiveToggle = (objectiveId) => {
    setSelectedObjectives((prev) => {
      const next = prev.includes(objectiveId)
        ? prev.filter((o) => o !== objectiveId)
        : [...prev, objectiveId];
      if (!next.includes(primaryObjective)) setPrimaryObjective("");
      return next;
    });
    setErrors((prev) => ({ ...prev, objective: "" }));
  };

  const handleSetPrimaryObjective = (objectiveId) => {
    setPrimaryObjective(objectiveId);
    setErrors((prev) => ({ ...prev, objective: "" }));
  };

  // NEW: expand/collapse a role's "typically used by / what you can do" panel
  const toggleRoleInfo = (roleId, e) => {
    e.stopPropagation(); // don't toggle selection when opening the info panel
    setExpandedRoleId((prev) => (prev === roleId ? null : roleId));
  };

  // NEW: "Help me choose" guided quiz handlers
  const openRoleQuiz = () => {
    setQuizStep(1);
    setQuizJoiningAs("");
    setQuizOrgNeed("");
    setQuizIndividualGoal("");
    setShowRoleQuiz(true);
  };

  const closeRoleQuiz = () => setShowRoleQuiz(false);

  const handleQuizJoiningAs = (value) => {
    setQuizJoiningAs(value);
    setQuizStep(2);
  };

  const handleQuizOrgNeed = (value) => {
    setQuizOrgNeed(value);
    if (quizJoiningAs === "both") {
      setQuizStep(3);
    } else {
      setQuizStep(4); // straight to recommendation
    }
  };

  const handleQuizIndividualGoal = (value) => {
    setQuizIndividualGoal(value);
    setQuizStep(4); // recommendation
  };

  const getQuizRecommendation = () => {
    const orgRoleMap = {
      grow_sell_fund: "Business",
      source_sponsor: "Corporate",
      provide_capital: "Investor",
      deliver_programmes: "Catalyst",
      help_others_capital: "CapitalMarketFacilitators",
      represent_members: "BusinessAssociation",
    };
    const individualRoleMap = {
      advise: "Advisors",
      internship: "Interns",
    };

    const recommended = [];
    if (quizJoiningAs === "individual") {
      if (individualRoleMap[quizIndividualGoal]) recommended.push(individualRoleMap[quizIndividualGoal]);
    } else if (quizJoiningAs === "organisation") {
      if (orgRoleMap[quizOrgNeed]) recommended.push(orgRoleMap[quizOrgNeed]);
    } else if (quizJoiningAs === "both") {
      if (orgRoleMap[quizOrgNeed]) recommended.push(orgRoleMap[quizOrgNeed]);
      if (individualRoleMap[quizIndividualGoal]) recommended.push(individualRoleMap[quizIndividualGoal]);
    }
    return recommended;
  };

  const applyQuizRecommendation = () => {
    const recommended = getQuizRecommendation();
    recommended.forEach((roleId) => {
      if (!roles.includes(roleId)) handleRoleSelect(roleId);
    });
    setShowRoleQuiz(false);
    setRoleDropdownOpen(true); // open the dropdown so they see the selection land
  };

  const handleForgotPassword = async () => {
    setResetMessage("");
    setResetError("");

    if (!validateEmail(resetEmail)) {
      setResetError("Enter a valid email address.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage("✅ Reset link sent! Check your inbox.");
      setResetEmail("");
    } catch (error) {
      console.error("Reset error:", error);
      setResetError(getCustomErrorMessage(error));
    }
  };

  // ---------------------------------------------------------------------------
  // Registration — the profile is written IMMEDIATELY after the auth user is
  // created, while the user is still signed in. After this succeeds, the only
  // outstanding step is clicking the email link, so an interrupted signup can
  // always be resumed with a resend instead of starting over.
  // ---------------------------------------------------------------------------

  const writeProfileDocuments = async (user, profile) => {
    const acceptedAt =
      profile.acceptedAt || termsAcceptanceTimestamp || new Date().toISOString();

    await setDoc(doc(db, "users", user.uid), {
      email: profile.email,
      username: profile.username,
      role: profile.roleString,
      roleArray: profile.roleArray,
      // NEW: outcome-first objectives captured on this screen
      roleObjectives: profile.roleObjectives || [],
      primaryObjective: profile.primaryObjective || "",
      currentRole: profile.currentRole || profile.roleArray?.[0] || "",
      termsAccepted: true,
      termsAcceptedDate: acceptedAt,
      termsVersion: TERMS_VERSION,
      termsContent:
        "BIG Marketplace Platform Terms & Conditions and Mutual NDA",
      ndaAccepted: true,
      ndaAcceptedDate: acceptedAt,
      createdAt: new Date(),
      registrationCompleted: true,
      status: "pending_verification",
      emailVerifiedAt: null,
    });

    // Save complete T&Cs acceptance document with full text
    await setDoc(doc(db, "termsAcceptance", user.uid), {
      userInfo: {
        email: profile.email,
        username: profile.username,
        role: profile.roleString,
        roleArray: profile.roleArray,
      },
      termsAccepted: true,
      ndaAccepted: true,
      acceptanceDate: acceptedAt,
      termsVersion: TERMS_VERSION,
      fullTermsContent: buildTermsAndNDAContent(),
      ipAddress: null, // Can be added if needed
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  };

  // Returns one of:
  // "created" | "created-no-email" | "rolled-back" | "rollback-failed"
  // "email-in-use" | { status: "error", error }
  const createAccountAndSaveProfile = async () => {
    let createdUser = null;
    let profileSaved = false;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      createdUser = userCredential.user;

      await writeProfileDocuments(createdUser, {
        email,
        username: username.trim(),
        roleString: roles.join(","),
        roleArray: roles,
        // NEW: objectives captured on this screen
        roleObjectives: selectedObjectives,
        primaryObjective: primaryObjective,
        currentRole: primaryRole,
      });
      profileSaved = true;

      await sendEmailVerification(createdUser);
      return { status: "created" };
    } catch (error) {
      // Profile is safe — only the verification email failed to send.
      // Do NOT roll back; the user just needs to hit "Resend".
      if (profileSaved) {
        console.error("Verification email failed to send:", error);
        return { status: "created-no-email", error };
      }

      // Auth user exists but the profile never saved. Roll it back so the
      // email address is released and the user can simply try again.
      if (createdUser) {
        console.error("Profile write failed, rolling back account:", error);
        const res = await purgeIncompleteAccount(createdUser);
        return { status: res.ok ? "rolled-back" : "rollback-failed", error };
      }

      if (error.code === "auth/email-already-in-use") {
        return { status: "email-in-use", error };
      }

      return { status: "error", error };
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    const newErrors = {};

    if (!validateEmail(email)) newErrors.email = "Enter your email";
    if (username.trim() === "") newErrors.username = "Enter your username";
    if (password.length < 6)
      newErrors.password = "Password should be (at least 6 characters)";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match!";
    if (roles.length === 0) {
      newErrors.role = "Please select at least one role.";
    } else if (getObjectivesForRole(primaryRole).length > 0 && !primaryObjective) {
      newErrors.objective = "Please select your primary objective";
    }
    if (!agreeToTerms)
      newErrors.terms = "Please agree to the Terms & Conditions and Mutual NDA";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    setErrors({});
    setAuthError("");
    registrationInFlight.current = true;

    try {
      let result = await createAccountAndSaveProfile();

      // A leftover account from an abandoned signup is blocking this email.
      // Clear it out (only ever possible when the profile is incomplete)
      // and run the signup again exactly once.
      if (result.status === "email-in-use") {
        setAuthError("⏳ Found a previous signup with this email — checking it...");

        let outcome = await recoverOrphanedEmail(email, password);

        // Signed-out / forgotten-password case: ask the server to clean up.
        if (outcome === "wrong-password") {
          const serverOutcome = await recoverWhenSignedOut(email);
          if (serverOutcome === "recovered") outcome = "recovered";
          else if (serverOutcome === "protected") outcome = "complete";
        }

        if (outcome === "recovered") {
          setAuthError("");
          result = await createAccountAndSaveProfile();
        } else if (outcome === "complete") {
          setAuthError(
            "📧 This email already has an account. Please log in instead — if you never verified it, logging in will take you straight to the resend screen."
          );
          return;
        } else if (outcome === "wrong-password") {
          setAuthError(
            '📧 This email is already registered. Use "Forgot your password?" to reset it, then log in once — we\'ll pick your signup back up automatically.'
          );
          return;
        } else {
          setAuthError(
            "🔧 We couldn't check that email's status. Please try again in a moment or contact support."
          );
          return;
        }
      }

      if (result.status === "created") {
        setAuthError("");
        setCodeSent(true);
        return;
      }

      if (result.status === "created-no-email") {
        setCodeSent(true);
        setAuthError(
          '⚠️ Your account and profile were saved, but the verification email didn\'t send. Tap "Resend verification email" below.'
        );
        return;
      }

      if (result.status === "rolled-back") {
        setAuthError(BLOCKED_HINT);
        return;
      }

      if (result.status === "rollback-failed") {
        setAuthError(
          "🔧 Something went wrong part-way through signup and we couldn't clean it up automatically. Please contact support before retrying with this email."
        );
        return;
      }

      console.error("Registration error:", result.error);
      setAuthError(getCustomErrorMessage(result.error));
    } finally {
      registrationInFlight.current = false;
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Login — checks the profile BEFORE the verification gate so an unverified
  // user with a complete profile is offered a resend instead of being locked
  // out, and a profile-less account is cleared instead of blocking the email.
  // ---------------------------------------------------------------------------

  const handleLogin = async () => {
    setIsLoading(true);
    setErrors({});
    setAuthError("");

    if (!validateEmail(email)) {
      setErrors({ email: "Enter your email!" });
      setIsLoading(false);
      return;
    }
    if (!password) {
      setErrors({ password: "Enter your password!" });
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await new Promise((resolve) => setTimeout(resolve, 100));
      await user.reload();
      const refreshedUser = auth.currentUser || user;

      const userDocRef = doc(db, "users", refreshedUser.uid);
      let userDocSnap;
      try {
        userDocSnap = await getDoc(userDocRef);
      } catch (readError) {
        // Never destroy an account because we simply couldn't read it.
        console.error("Could not read profile:", readError);
        setAuthError(
          "🔄 We couldn't load your profile — this is usually an ad blocker or privacy extension blocking firestore.googleapis.com. Disable it for this site and try again."
        );
        await auth.signOut();
        setIsLoading(false);
        return;
      }

      // Orphaned account: signup never saved a profile, so nothing is lost
      // by clearing it and letting them start fresh with the same email.
      if (!isProfileComplete(userDocSnap)) {
         await new Promise((r) => setTimeout(r, 800));
  const recheck = await getDoc(doc(db, "users", user.uid));
  if (isProfileComplete(recheck)) return;

  const res = await purgeIncompleteAccount(user);
       
        if (res.ok) {
          resetRegistrationForm(email);
          setIsRegistering(true);
          setAuthError(
            "⚠️ Your previous signup never finished, so no profile was saved. We've cleared it — please create your account again with this email."
          );
        } else {
          setAuthError(
            "🔧 Your registration is incomplete and we couldn't reset it automatically. Please contact support."
          );
        }
        setIsLoading(false);
        return;
      }

      // Profile is complete — the only thing missing is the email link.
      // Keep them signed in and drop them on the verification screen so
      // "Resend verification email" works.
      if (!refreshedUser.emailVerified) {
        setIsRegistering(true);
        setCodeSent(true);
        setIsEmailVerified(false);
        setAuthError(
          "📧 Your account is saved but your email isn't verified yet. Check your inbox (and spam), or resend the link below."
        );
        setIsLoading(false);
        return;
      }

      // Verified: make sure the stored status reflects that.
      const userData = userDocSnap.data();
      if (userData.status !== "active") {
        try {
          await updateDoc(userDocRef, {
            status: "active",
            emailVerifiedAt: userData.emailVerifiedAt || new Date().toISOString(),
          });
        } catch (statusError) {
          console.warn("Could not update account status:", statusError);
        }
      }

      let activeRoles = [];
      let deletedRoles = [];

      if (userData.roles && typeof userData.roles === "object") {
        Object.keys(userData.roles).forEach((r) => {
          const roleObj = userData.roles[r];
          if (roleObj.deletedStatus === true) {
            deletedRoles.push({
              name: r,
              deletedStatus: true,
              deletedAt: roleObj.deletedAt,
            });
          } else {
            activeRoles.push({ name: r });
          }
        });
      }

      if (Array.isArray(userData.roleArray)) {
        userData.roleArray.forEach((r) => {
          if (!activeRoles.find((ar) => ar.name === r)) {
            activeRoles.push({ name: r });
          }
        });
      }

      if (typeof userData.role === "string") {
        userData.role.split(",").forEach((r) => {
          const roleName = r.trim();
          if (roleName && !activeRoles.find((ar) => ar.name === roleName)) {
            activeRoles.push({ name: roleName });
          }
        });
      }

      const allRoles = [...activeRoles, ...deletedRoles];
      setRoleSelectionModal({ show: true, roles: allRoles });

      if (activeRoles.length === 1) {
        setRoleSelectionModal({ show: false, roles: [] });
        navigateToRoleDashboard(activeRoles[0].name);
      }

      if (activeRoles.length === 0 && deletedRoles.length > 0) {
        navigate("/RetrieveAccount", {
          state: { roleToRetrieve: deletedRoles[0].name },
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      setAuthError(getCustomErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Verification — the profile already exists, so this only flips the status
  // flag and routes the user. Nothing is lost if it never runs.
  // ---------------------------------------------------------------------------

  const handleVerify = async () => {
    setCheckingVerification(true);
    setErrors({});

    try {
      if (!auth.currentUser) {
        setErrors({
          verificationCode:
            "Your session expired. Please log in with the email and password you just used — your details are saved.",
        });
        return;
      }

      await auth.currentUser.reload();
      const user = auth.currentUser;

      if (!user) {
        setErrors({
          verificationCode:
            "Not verified yet. Open the link in your inbox (check your spam folder), then tap this button again.",
        });
        return;
      }

      setIsEmailVerified(true);

            const userDocRef = doc(db, "users", user.uid);
      let snap;
      try {
        snap = await getDoc(userDocRef);
      } catch (readError) {
        console.error("Could not read profile after verification:", readError);
        setErrors({
          verificationCode:
            "We couldn't reach the database. Disable any ad blocker for this site and try again.",
        });
        return;
      }

      // Should not happen now that the profile is written at signup, but if
      // the doc is somehow missing, clear the account instead of locking them out.
      if (!isProfileComplete(snap)) {
        const res = await purgeIncompleteAccount(user);
        const savedEmail = email || user.email || "";
        resetRegistrationForm(savedEmail);
        setIsRegistering(true);
        setAuthError(
          res.ok
            ? "⚠️ Your profile wasn't saved, so we've cleared the account. Please sign up again — it will only take a moment."
            : "🔧 Please contact support so we can reset this email for you."
        );
        return;
      }

      try {
        await updateDoc(userDocRef, {
          status: "active",
          emailVerifiedAt: new Date().toISOString(),
        });
      } catch (statusError) {
        console.warn("Could not update account status:", statusError);
      }

      // Route using the roles that were actually saved, not local state —
      // this still works if the user verified in a fresh tab.
      const savedData = snap.data();
      const savedRoles =
        (Array.isArray(savedData.roleArray) && savedData.roleArray.length > 0
          ? savedData.roleArray
          : String(savedData.role || "")
              .split(",")
              .map((r) => r.trim())
              .filter(Boolean)) || [];

      if (savedRoles.length > 1) {
        setRoleSelectionModal({ show: true, roles: savedRoles });
      } else if (savedRoles.length === 1) {
        navigateToRoleDashboard(savedRoles[0]);
      } else {
        navigate("/auth");
      }
    } catch (error) {
      console.error("Verification check error:", error);
      setErrors({
        verificationCode:
          "Error checking verification status. Please try again.",
      });
    } finally {
      setCheckingVerification(false);
    }
  };

  const resendVerificationEmail = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setAuthError("✅ Verification email sent! Please check your inbox.");
      } else {
        // Session was lost (tab closed, token expired). The profile is safe —
        // logging back in returns them to this exact screen.
        setIsRegistering(false);
        setCodeSent(false);
        setAuthError(
          "🔐 Your session expired, so we can't resend from here. Log in with the same email and password and we'll bring you straight back to verification."
        );
      }
    } catch (error) {
      console.error("Error resending verification:", error);
      setAuthError(getCustomErrorMessage(error));
    }
  };

  // Escape hatch on the verification screen — wrong email address typed, or
  // the user simply wants to start again. Clears the account cleanly.
  const handleAbandonRegistration = async () => {
    setCheckingVerification(true);
    try {
      if (!auth.currentUser) {
        resetRegistrationForm();
        setAuthError("");
        return;
      }
      const res = await purgeIncompleteAccount(auth.currentUser);
      resetRegistrationForm();
      setIsRegistering(true);
      setAuthError(
        res.ok
          ? "🔄 Signup cancelled and cleared. You can register again with any email."
          : "⚠️ We couldn't fully clear that account. If you can't re-register with the same email, please contact support."
      );
    } finally {
      setCheckingVerification(false);
    }
  };

  // Add these helper functions at the end of the file

const getRoleDashboardName = (role) => {
  const dashboardMap = {
    "Business": "Business Dashboard",
    "Non-Profit": "NPOs Dashboard",
    "NonProfit": "NPOs Dashboard",
    "Investor/Funder": "Investor Dashboard",
    "Corporate": "Corporate Dashboard",
    "Catalyst": "Catalyst Dashboard",
    "CapitalMarketFacilitators": "Capital and Market Facilitators Dashboard",
    "Advisor": "Advisor Dashboard",
    "Intern": "Intern Dashboard",
    "Intern Sponsor": "Intern Sponsor Dashboard",
    "InternSponsor": "Intern Sponsor Dashboard",
    "Business Association": "Association and Member Organisations Dashboard",
    "BusinessAssociation": "Association and Member Organisations Dashboard",
    // Backward compatibility
    "Small and Medium Social Enterprises": "SMSEs Dashboard",
    SMSEs: "SMSEs Dashboard",
    SMSE: "SMSEs Dashboard",
    SME: "SMSEs Dashboard",
    "SME/BUSINESS": "SMSEs Dashboard",
    Investor: "Investor Dashboard",
    Advisors: "Advisor Dashboard",
    Accelerators: "Catalyst Dashboard",
    Interns: "Intern Dashboard",
    ProgramSponsor: "Program Sponsor Dashboard",
    Association: "Association Dashboard",
    Admin: "Admin Dashboard",
    admin: "Admin Dashboard",
    ADMIN: "Admin Dashboard",
  };
  return dashboardMap[role] || role;
};

const getRoleDescription = (role) => {
  const descriptionMap = {
    "Business": "Access funding, growth tools, and partnerships",
    "Non-Profit": "Access resources and partnerships for social impact",
    "NonProfit": "Access resources and partnerships for social impact",
    "Investor/Funder": "Discover investment opportunities and manage portfolio",
    "Corporate": "Source suppliers, innovation, and ESD opportunities",
    "Catalyst": "Support business growth and drive innovation",
    "CapitalMarketFacilitators": "Connect businesses to capital and market opportunities",
    "Advisor": "Connect with businesses and offer expertise",
    "Intern": "Access internship opportunities and career development",
    "Intern Sponsor": "Sponsor internship programs and build talent pipelines",
    "InternSponsor": "Sponsor internship programs and build talent pipelines",
    "Business Association": "Network, collaborate, and build meaningful partnerships",
    "BusinessAssociation": "Network, collaborate, and build meaningful partnerships",
    // Backward compatibility
    "Small and Medium Social Enterprises":
      "Access funding, growth tools, and partnerships",
    SMSEs: "Access funding, growth tools, and partnerships",
    SMSE: "Access funding, growth tools, and partnerships",
    SME: "Access funding, growth tools, and partnerships",
    Investor: "Discover investment opportunities and manage portfolio",
    Advisors: "Connect with businesses and offer expertise",
    Accelerators: "Support startups and drive innovation",
    Interns: "Access internship opportunities and career development",
    ProgramSponsor: "Manage intern programs and track placements",
    Association: "Network, collaborate, and build meaningful partnerships",
    Admin: "Manage platform users, settings, and analytics",
    admin: "Manage platform users, settings, and analytics",
  };
  return descriptionMap[role] || "Access your dashboard";
};

// Add handleRegistrationComplete function
const handleRegistrationComplete = async (ndaData) => {
  if (ndaData.cancelled) {
    setShowNDA(false);
    if (auth.currentUser) {
      const res = await purgeIncompleteAccount(auth.currentUser);
      resetRegistrationForm();
      setAuthError(
        res.ok
          ? "Registration cancelled. Your account has been removed."
          : "Registration cancelled, but there was an error cleaning up. Please contact support."
      );
    }
    return;
  }

  try {
    if (!auth.currentUser) {
      setAuthError("User authentication lost. Please try again.");
      return;
    }

    const finalUsername = registrationData?.username || username.trim();
    const finalRoles = registrationData?.roleArray || roles;
    const finalRoleString = registrationData?.role || roles.join(",");

    if (!finalUsername || finalUsername === "") {
      setAuthError("Please provide a username to complete registration.");
      setShowNDA(false);
      return;
    }

    if (!finalRoles || finalRoles.length === 0) {
      setAuthError("Please select at least one role to complete registration.");
      setShowNDA(false);
      return;
    }

    if (!agreeToTerms) {
      setAuthError("Please agree to the Terms & Conditions to complete registration.");
      setShowNDA(false);
      return;
    }

    // Save user data with agreement info
    await setDoc(
      doc(db, "users", auth.currentUser.uid),
      {
        email: registrationData?.email || email,
        username: finalUsername,
        role: finalRoleString,
        roleArray: finalRoles,
        // NEW: objectives captured on this screen
        roleObjectives: selectedObjectives,
        primaryObjective: primaryObjective,
        currentRole: primaryRole && finalRoles.includes(primaryRole) ? primaryRole : finalRoles[0],
        ndaAgreed: true,
        ndaAgreedDate: new Date().toISOString(),
        ndaAccepted: true,
        termsAccepted: agreeToTerms,
        termsAcceptedDate: new Date().toISOString(),
        createdAt: new Date(),
        termsVersion: TERMS_VERSION,
        termsContent: "BIG Marketplace Platform Terms & Conditions",
        registrationCompleted: true,
        status: auth.currentUser.emailVerified
          ? "active"
          : "pending_verification",
      },
      { merge: true }
    );

    setNdaComplete(true);
    setShowNDA(false);

    // Navigate to dashboard
    if (finalRoles.length > 1) {
      setRoleSelectionModal({ show: true, roles: finalRoles });
    } else {
      navigateToRoleDashboard(finalRoles[0]);
    }
  } catch (error) {
    console.error("Error saving user data:", error);
    setAuthError(getCustomErrorMessage(error));
  }
};

const handleAdvisorCriteriaCancel = () => {
  setShowAdvisorCriteria(false);
};

  // Effects
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsEmailVerified(user.emailVerified);
      } else {
        setIsEmailVerified(false);
      }
    });
    return () => unsubscribe();
  }, [isRegistering]);

  // Background watcher for accounts that reached this page in a broken state.
  // It NEVER signs anyone out mid-signup and it never fires while an account
  // is being created — it only cleans up genuinely abandoned accounts.
  useEffect(() => {
    let cancelled = false;

    const checkIncompleteRegistration = async () => {
      const user = auth.currentUser;
      if (!user) return;
      if (registrationInFlight.current) return; // signup in progress
      if (codeSent) return; // sitting on the verification screen legitimately

      let userDocSnap;
      try {
        userDocSnap = await getDoc(doc(db, "users", user.uid));
      } catch (readError) {
        // Offline or blocked — do nothing rather than punish the user.
        console.warn("Incomplete-registration check skipped:", readError);
        return;
      }

      if (cancelled) return;

      if (!isProfileComplete(userDocSnap)) {
        const res = await purgeIncompleteAccount(user);
        if (cancelled) return;
        resetRegistrationForm(user.email || "");
        setIsRegistering(true);
        setAuthError(
          res.ok
            ? "⚠️ Your previous signup was never completed, so nothing was saved. Please register again — your email is free to use."
            : "🔧 Your registration is incomplete. Please contact support so we can reset it."
        );
      }
    };

    checkIncompleteRegistration();
    return () => {
      cancelled = true;
    };
  }, [auth.currentUser, codeSent]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter" && !isLoading) {
        if (!isRegistering) {
          handleLogin();
        } else if (!codeSent) {
          handleRegister();
        } else if (codeSent && !isEmailVerified) {
          handleVerify();
        }
      }

      if (e.key === "Escape") {
        if (showForgotPasswordModal) setShowForgotPasswordModal(false);
        if (showAdvisorCriteria) setShowAdvisorCriteria(false);
        if (roleSelectionModal.show)
          setRoleSelectionModal({ show: false, roles: [] });
        if (roleDropdownOpen) setRoleDropdownOpen(false);
        if (showRoleQuiz) setShowRoleQuiz(false);
        if (showObjectiveModal) setShowObjectiveModal(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isRegistering, codeSent, isLoading, roleDropdownOpen, showRoleQuiz, showObjectiveModal]);

  // NEW: close the role dropdown when clicking outside the trigger AND
  // outside the portaled menu (the menu lives in document.body).
  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedTrigger =
        roleDropdownRef.current && roleDropdownRef.current.contains(e.target);
      const clickedMenu =
        roleDropdownMenuRef.current &&
        roleDropdownMenuRef.current.contains(e.target);

      if (!clickedTrigger && !clickedMenu) {
        setRoleDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // NEW: recompute the portaled menu's position whenever it opens, and keep
  // it pinned to the trigger button while the page scrolls or resizes.
  useLayoutEffect(() => {
    if (!roleDropdownOpen) return;

    const updatePosition = () => {
      if (!roleDropdownRef.current) return;
      const rect = roleDropdownRef.current.getBoundingClientRect();
      const estimatedMenuHeight = 320;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const shouldFlipUp =
        spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow;

      const gap = 6;
      setRoleDropdownPos({
        top: shouldFlipUp ? undefined : rect.bottom + gap,
        bottom: shouldFlipUp
          ? window.innerHeight - rect.top + gap
          : undefined,
        left: rect.left,
        width: rect.width,
        maxHeight: shouldFlipUp
          ? Math.max(spaceAbove - gap - 12, 120)
          : Math.max(spaceBelow - gap - 12, 120),
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [roleDropdownOpen]);

  // Render functions
  const renderRoleSelectionModal = () => {
    if (!roleSelectionModal.show) return null;

    return (
      <div className="modal-overlay">
        <div className="dashboard-selection-modal">
          <button
            className="modal-close"
            onClick={() => setRoleSelectionModal({ show: false, roles: [] })}
          >
            <X size={20} />
          </button>

          <div className="modal-header">
            <div className="modal-icon">
              <Users size={28} color="white" />
            </div>
            <h3>Choose Dashboard</h3>
            <p>
              You have multiple roles. Select which dashboard you'd like to
              access.
            </p>
          </div>

          <div className="role-options">
            {roleSelectionModal.roles.map((r, index) => {
              const roleObj =
                typeof r === "string" ? { name: r, deletedStatus: false } : r;
              const isDeleted = roleObj.deletedStatus || false;
              const daysAgo =
                isDeleted && roleObj.deletedAt
                  ? Math.floor(
                      (Date.now() - roleObj.deletedAt) / (1000 * 60 * 60 * 24)
                    )
                  : null;

              return (
                <button
                  key={roleObj.name || index}
                  className={`role-option ${isDeleted ? "deleted" : ""}`}
                  onClick={() => {
                    if (isDeleted) {
                      localStorage.setItem(
                        "selectedDeletedRole",
                        JSON.stringify(roleObj)
                      );
                      window.location.href = "/RetrieveAccount";
                    } else {
                      navigateToRoleDashboard(roleObj.name);
                    }
                  }}
                >
                  <div className="role-option-icon">
                    {getRoleIcon(roleObj.name)}
                  </div>
                  <div className="role-option-info">
                    <div className="role-option-name">
                      {getRoleDashboardName(roleObj.name)}
                    </div>
                    <div className="role-option-description">
                      {isDeleted
                        ? `Deleted ${daysAgo} day${
                            daysAgo !== 1 ? "s" : ""
                          } ago`
                        : getRoleDescription(roleObj.name)}
                    </div>
                  </div>
                  <div className="role-option-arrow">→</div>
                </button>
              );
            })}
          </div>

          <div className="info-note">
            <div className="info-icon">i</div>
            <p>
              <strong>Tip:</strong> You can always switch between dashboards by
              clicking your profile picture in the header.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderForgotPasswordModal = () => {
    if (!showForgotPasswordModal) return null;

    return (
      <div className="modal-overlay">
        <div className="forgot-password-modal">
          <h3>Reset Your Password</h3>
          <p>Enter your registered email and we'll send you a reset link.</p>

          <input
            type="email"
            placeholder="Enter your email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleForgotPassword()}
          />

          {resetError && <p className="error-text">{resetError}</p>}
          {resetMessage && <p className="success-text">{resetMessage}</p>}

          <div className="modal-actions">
            <button className="primary-btn" onClick={handleForgotPassword}>
              Send Reset Link
            </button>
            <button
              className="secondary-btn"
              onClick={() => setShowForgotPasswordModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderVerificationStep = () => (
    <div className="form-step">
      <div className="verification-message">
        <p>✨ We sent a verification link to your email! ✨</p>
        <p>
          All that's left is confirming your
          email. Click the link in your inbox, then tap "I've verified my email"
          below.
        </p>
        <p className="verification-hint">
          If you close this page, just log in again with the same email and
          password and you'll come straight back here.
        </p>
      </div>

      {errors.verificationCode && (
        <p className="error-text">{errors.verificationCode}</p>
      )}

      <button
        className="primary-btn verify-btn"
        onClick={handleVerify}
        disabled={checkingVerification}
      >
        {checkingVerification ? (
          <>
            <Loader2 className="animate-spin" size={16} />
            Checking...
          </>
        ) : (
          <>
            <CheckCircle size={16} />
            I've verified my email
          </>
        )}
      </button>

      <button
        className="secondary-btn"
        onClick={resendVerificationEmail}
        disabled={checkingVerification}
      >
        Resend verification email
      </button>

      <button
        className="secondary-btn"
        onClick={handleAbandonRegistration}
        disabled={checkingVerification}
      >
        Wrong email? Start over
      </button>
    </div>
  );

  // NEW: guided "Help me choose" quiz modal
  const renderRoleQuizModal = () => {
    if (!showRoleQuiz) return null;
    const recommended = quizStep === 4 ? getQuizRecommendation() : [];

    return (
      <div className="modal-overlay">
        <div className="role-quiz-modal">
          <button className="modal-close" onClick={closeRoleQuiz}>
            <X size={20} />
          </button>

          <div className="modal-header">
            <h3>Help me choose a role</h3>
            <p>A couple of quick questions and we'll point you to the right role.</p>
          </div>

          {quizStep === 1 && (
            <div className="quiz-options">
              <button className="quiz-option" onClick={() => handleQuizJoiningAs("individual")}>
                I'm joining as an individual
              </button>
              <button className="quiz-option" onClick={() => handleQuizJoiningAs("organisation")}>
                I represent an organisation
              </button>
              <button className="quiz-option" onClick={() => handleQuizJoiningAs("both")}>
                Both — I represent an organisation and I want a personal role too
              </button>
            </div>
          )}

          {quizStep === 2 && quizJoiningAs === "individual" && (
            <div className="quiz-options">
              <button className="quiz-option" onClick={() => handleQuizIndividualGoal("advise")}>
                I want to advise, mentor, coach or serve on a board
              </button>
              <button className="quiz-option" onClick={() => handleQuizIndividualGoal("internship")}>
                I'm looking for an internship or workplace placement
              </button>
            </div>
          )}

          {quizStep === 2 && quizJoiningAs !== "individual" && (
            <div className="quiz-options">
              <button className="quiz-option" onClick={() => handleQuizOrgNeed("grow_sell_fund")}>
                Grow, sell, raise funding, or strengthen readiness
              </button>
              <button className="quiz-option" onClick={() => handleQuizOrgNeed("source_sponsor")}>
                Source suppliers, sponsor programmes, or manage procurement
              </button>
              <button className="quiz-option" onClick={() => handleQuizOrgNeed("provide_capital")}>
                Provide debt, equity, grants or other capital
              </button>
              <button className="quiz-option" onClick={() => handleQuizOrgNeed("deliver_programmes")}>
                Design or deliver structured business-support programmes
              </button>
              <button className="quiz-option" onClick={() => handleQuizOrgNeed("help_others_capital")}>
                Actively help other businesses secure capital or markets
              </button>
              <button className="quiz-option" onClick={() => handleQuizOrgNeed("represent_members")}>
                Represent or serve a defined membership base
              </button>
            </div>
          )}

          {quizStep === 3 && (
            <div className="quiz-options">
              <button className="quiz-option" onClick={() => handleQuizIndividualGoal("advise")}>
                I want to advise, mentor, coach or serve on a board
              </button>
              <button className="quiz-option" onClick={() => handleQuizIndividualGoal("internship")}>
                I'm looking for an internship or workplace placement
              </button>
            </div>
          )}

          {quizStep === 4 && (
            <div className="quiz-recommendation">
              {recommended.length === 0 ? (
                <p>We couldn't work out a match — try the role list directly, or contact us.</p>
              ) : (
                <>
                  <p className="quiz-recommendation-label">
                    {recommended.length > 1 ? "Recommended roles:" : "Recommended role:"}
                  </p>
                  {recommended.map((roleId) => {
                    const card = ROLE_CARDS.find((c) => c.id === roleId);
                    const def = ROLE_DEFINITIONS[roleId];
                    return (
                      <div key={roleId} className="quiz-recommended-card">
                        <div className="quiz-recommended-card-title">
                          {card?.icon}
                          {card?.title}
                        </div>
                        {def && <p className="quiz-recommended-card-text">{def.chooseIf}</p>}
                      </div>
                    );
                  })}
                  <button type="button" className="primary-btn" onClick={applyQuizRecommendation}>
                    Use {recommended.length > 1 ? "these roles" : "this role"}
                  </button>
                </>
              )}
              <button type="button" className="secondary-btn" onClick={openRoleQuiz}>
                Start over
              </button>
            </div>
          )}

          <style>{`
            .role-quiz-modal { background: #fff; border-radius: 16px; padding: 28px; width: 440px; max-width: 100%; position: relative; }
            .quiz-options { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
            .quiz-option { text-align: left; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 10px; background: #fff; font-size: 14px; cursor: pointer; }
            .quiz-option:hover { background: #f8fafc; border-color: #6366f1; }
            .quiz-recommendation { margin-top: 16px; display: flex; flex-direction: column; gap: 10px; }
            .quiz-recommendation-label { font-size: 13px; font-weight: 600; color: #374151; }
            .quiz-recommended-card { border: 1px solid #c7d2fe; background: #eef2ff; border-radius: 10px; padding: 12px; }
            .quiz-recommended-card-title { display: flex; align-items: center; gap: 8px; font-weight: 600; color: #4338ca; margin-bottom: 4px; }
            .quiz-recommended-card-text { font-size: 13px; color: #4b5563; margin: 0; }
          `}</style>
        </div>
      </div>
    );
  };

  // NEW: objectives popup — opens automatically right after a role (with
  // objectives) is selected, so the login screen itself stays minimal.
  const renderObjectiveModal = () => {
    if (!showObjectiveModal || !primaryRole) return null;
    const objectives = getObjectivesForRole(primaryRole);
    if (objectives.length === 0) return null;
    const primaryRoleTitle = ROLE_CARDS.find((c) => c.id === primaryRole)?.title || primaryRole;

    return (
      <div className="modal-overlay">
        <div className="objective-modal">
          <button className="modal-close" onClick={() => setShowObjectiveModal(false)}>
            <X size={20} />
          </button>

          <div className="modal-header">
            <h3>What do you want to achieve first as a {primaryRoleTitle}?</h3>
            <p>Pick everything relevant, then mark your top priority.</p>
          </div>

          <div className="objective-options">
            {objectives.map((obj) => {
              const isSelected = selectedObjectives.includes(obj.id);
              const isPrimary = primaryObjective === obj.id;
              return (
                <div key={obj.id} className={`objective-option ${isSelected ? "selected" : ""}`}>
                  <label className="objective-option-main">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleObjectiveToggle(obj.id)}
                    />
                    <span className="objective-option-text">{obj.title}</span>
                  </label>
                  {isSelected && (
                    <button
                      type="button"
                      className={`objective-primary-btn ${isPrimary ? "active" : ""}`}
                      onClick={() => handleSetPrimaryObjective(obj.id)}
                    >
                      {isPrimary ? "★ Primary" : "Set as primary"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {errors.objective && <p className="error-text">{errors.objective}</p>}

          <button
            type="button"
            className="primary-btn"
            style={{ width: "100%", marginTop: "16px" }}
            onClick={() => setShowObjectiveModal(false)}
          >
            Done
          </button>

          <style>{`
            .objective-modal { background: #fff; border-radius: 16px; padding: 28px; width: 480px; max-width: 100%; position: relative; max-height: 85vh; overflow-y: auto; }
            .objective-options { display: flex; flex-direction: column; gap: 6px; margin-top: 16px; }
            .objective-option { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 8px; }
            .objective-option.selected { background: #f8fafc; border-color: #c7d2fe; }
            .objective-option-main { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; cursor: pointer; flex: 1; }
            .objective-primary-btn { flex-shrink: 0; font-size: 11px; padding: 4px 8px; border-radius: 6px; border: 1px solid #d1d5db; background: #fff; cursor: pointer; white-space: nowrap; }
            .objective-primary-btn.active { background: #4f46e5; border-color: #4f46e5; color: #fff; }
          `}</style>
        </div>
      </div>
    );
  };

  // NEW: multi-select dropdown for role selection (replaces the card grid),
  // with expandable "typically used by / what you can do" panels and a
  // "Help me choose" link.
  const renderRoleDropdown = () => {
    const selectedCards = ROLE_CARDS.filter((c) => roles.includes(c.id));

    const menu =
      roleDropdownOpen &&
      createPortal(
        <ul
          className="role-dropdown-menu"
          role="listbox"
          ref={roleDropdownMenuRef}
          style={{
            top: roleDropdownPos.top,
            bottom: roleDropdownPos.bottom,
            left: roleDropdownPos.left,
            width: roleDropdownPos.width,
            maxHeight: roleDropdownPos.maxHeight,
          }}
        >
          {ROLE_CARDS.map((card) => {
            const isSelected = roles.includes(card.id);
            const isExpanded = expandedRoleId === card.id;
            const def = ROLE_DEFINITIONS[card.id];
            return (
              <li
                key={card.id}
                className={`role-dropdown-option ${isSelected ? "selected" : ""}`}
                role="option"
                aria-selected={isSelected}
              >
                <div
                  className="role-dropdown-option-row"
                  onClick={() => handleRoleSelect(card.id)}
                >
                  <span className="role-dropdown-option-checkbox">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      tabIndex={-1}
                    />
                  </span>
                  <span className="role-dropdown-option-icon">{card.icon}</span>
                  <span className="role-dropdown-option-main">
                    <span className="role-dropdown-option-text">{card.title}</span>
                    {def && (
                      <span className="role-dropdown-option-subtext">{def.chooseIf}</span>
                    )}
                  </span>
                  {def && (
                    <button
                      type="button"
                      className={`role-info-toggle ${isExpanded ? "open" : ""}`}
                      onClick={(e) => toggleRoleInfo(card.id, e)}
                      aria-label={`More about ${card.title}`}
                    >
                      <ChevronDown size={16} />
                    </button>
                  )}
                </div>

                {isExpanded && def && (
                  <div className="role-dropdown-option-details">
                    <p className="role-detail-label">Typically used by</p>
                    <p className="role-detail-text">{def.typicallyUsedBy}</p>
                    <p className="role-detail-label">What you can do on BIG</p>
                    <ul className="role-detail-list">
                      {def.whatYouCanDo.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>,
        document.body
      );

    return (
      <div className="role-dropdown-wrapper" ref={roleDropdownRef}>
        <button type="button" className="help-me-choose-link" onClick={openRoleQuiz}>
          Not sure yet? Help me choose →
        </button>

        <button
          type="button"
          className={`role-dropdown-trigger ${errors.role ? "has-error" : ""}`}
          onClick={() => setRoleDropdownOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={roleDropdownOpen}
        >
          <span className="role-dropdown-trigger-content">
            {selectedCards.length === 0 ? (
              <span className="role-dropdown-placeholder">Select role(s)</span>
            ) : (
              selectedCards.map((card) => (
                <span key={card.id} className="role-dropdown-chip">
                  {card.icon}
                  {card.title}
                </span>
              ))
            )}
          </span>
          <ChevronDown
            size={18}
            className={`role-dropdown-chevron ${roleDropdownOpen ? "open" : ""}`}
          />
        </button>

        {menu}

        <style>{`
          .role-dropdown-wrapper {
            position: relative;
            width: 100%;
          }
          .help-me-choose-link {
            background: none;
            border: none;
            padding: 0 0 8px;
            font-size: 12px;
            color: #4f46e5;
            cursor: pointer;
            text-decoration: underline;
            display: block;
          }
          .role-dropdown-trigger {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 10px 14px;
            border: 1px solid #d1d5db;
            border-radius: 10px;
            background: #fff;
            cursor: pointer;
            min-height: 46px;
            font-size: 14px;
            text-align: left;
          }
          .role-dropdown-trigger.has-error {
            border-color: #e11d48;
          }
          .role-dropdown-trigger-content {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            flex: 1;
          }
          .role-dropdown-placeholder {
            color: #9ca3af;
          }
          .role-dropdown-chip {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: #f1f5f9;
            border-radius: 999px;
            padding: 3px 10px;
            font-size: 12px;
            color: #1f2937;
            white-space: nowrap;
          }
          .role-dropdown-chevron {
            flex-shrink: 0;
            transition: transform 0.15s ease;
            color: #6b7280;
          }
          .role-dropdown-chevron.open {
            transform: rotate(180deg);
          }
          .role-dropdown-menu {
            position: fixed;
            z-index: 9999;
            overflow-y: auto;
            background: #fff;
            border: 1px solid #d1d5db;
            border-radius: 10px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.18);
            list-style: none;
            margin: 0;
            padding: 6px;
            -webkit-overflow-scrolling: touch;
          }
          .role-dropdown-option {
            border-radius: 8px;
          }
          .role-dropdown-option-row {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 9px 10px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
          }
          .role-dropdown-option-row:hover {
            background: #f3f4f6;
          }
          .role-dropdown-option.selected .role-dropdown-option-row {
            background: #eef2ff;
          }
          .role-dropdown-option-checkbox input {
            pointer-events: none;
            width: 16px;
            height: 16px;
            margin-top: 2px;
          }
          .role-dropdown-option-icon {
            display: flex;
            align-items: center;
            color: #4b5563;
            margin-top: 1px;
          }
          .role-dropdown-option-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .role-dropdown-option-subtext {
            font-size: 11px;
            color: #9ca3af;
            line-height: 1.3;
          }
          .role-info-toggle {
            flex-shrink: 0;
            background: none;
            border: none;
            cursor: pointer;
            color: #9ca3af;
            padding: 2px;
            transition: transform 0.15s ease;
          }
          .role-info-toggle.open {
            transform: rotate(180deg);
            color: #4f46e5;
          }
          .role-dropdown-option-details {
            padding: 4px 10px 12px 40px;
          }
          .role-detail-label {
            font-size: 11px;
            font-weight: 600;
            color: #6b7280;
            margin: 6px 0 2px;
            text-transform: uppercase;
            letter-spacing: 0.02em;
          }
          .role-detail-text {
            font-size: 12px;
            color: #4b5563;
            margin: 0 0 4px;
          }
          .role-detail-list {
            margin: 0;
            padding-left: 16px;
            font-size: 12px;
            color: #4b5563;
          }
          .role-detail-list li {
            margin-bottom: 2px;
          }
        `}</style>
      </div>
    );
  };

  // NEW: single row of clickable role chips — doubles as the "currently
  // editing" indicator (active chip highlighted) and the switcher between
  // roles' cached objective sets. Only rendered when 2+ roles are selected.
  const renderPrimaryRoleSelector = () => {
    if (roles.length < 2) return null;
    const selectedCards = ROLE_CARDS.filter((c) => roles.includes(c.id));

    return (
      <div className="primary-role-selection">
        <label>Editing objectives for:</label>
        <div className="primary-role-options">
          {selectedCards.map((card) => (
            <button
              type="button"
              key={card.id}
              className={`primary-role-chip ${primaryRole === card.id ? "selected" : ""}`}
              onClick={() => {
                const cached = objectivesByRole[card.id];
                setPrimaryRole(card.id);
                setSelectedObjectives(cached?.selected || []);
                setPrimaryObjective(cached?.primary || "");
                setShowObjectiveModal(true);
              }}
            >
              {card.icon}
              {card.title}
            </button>
          ))}
        </div>

        <style>{`
          .primary-role-selection { margin-top: 10px; }
          .primary-role-selection label { font-size: 12px; font-weight: 600; color: #6b7280; display: block; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.02em; }
          .primary-role-options { display: flex; flex-wrap: wrap; gap: 8px; }
          .primary-role-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; border: 1px solid #d1d5db; background: #fff; font-size: 13px; cursor: pointer; transition: all 0.15s ease; }
          .primary-role-chip:hover { border-color: #a5b4fc; background: #f8fafc; }
          .primary-role-chip.selected { background: #eef2ff; border-color: #6366f1; color: #4338ca; font-weight: 600; }
        `}</style>
      </div>
    );
  };

  // NEW: compact summary shown inline in the form instead of the full
  // objectives list — keeps the login/register screen minimal, with a
  // button to reopen the objectives popup for the current primary role.
  const renderObjectiveSummary = () => {
    if (!primaryRole) return null;
    const objectives = getObjectivesForRole(primaryRole);
    if (objectives.length === 0) return null;
    const primaryRoleTitle = ROLE_CARDS.find((c) => c.id === primaryRole)?.title || primaryRole;
    const primaryObjTitle = objectives.find((o) => o.id === primaryObjective)?.title;

    return (
      <div className="objective-summary">
        <div className="objective-summary-text">
          {selectedObjectives.length === 0 ? (
            <span className="objective-summary-placeholder">
              No objectives selected for {primaryRoleTitle} yet
            </span>
          ) : (
            <>
              <strong>{selectedObjectives.length}</strong> objective
              {selectedObjectives.length !== 1 ? "s" : ""} selected
              {primaryObjTitle && <> — Primary: {primaryObjTitle}</>}
            </>
          )}
        </div>
        <button
          type="button"
          className="objective-summary-edit"
          onClick={() => setShowObjectiveModal(true)}
        >
          {selectedObjectives.length === 0 ? "Select objectives" : "Edit"}
        </button>

        {errors.objective && <p className="error-text">{errors.objective}</p>}

        <style>{`
          .objective-summary { margin-top: 8px; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 10px; background: #f8fafc; flex-wrap: wrap; }
          .objective-summary-text { font-size: 13px; color: #374151; }
          .objective-summary-placeholder { color: #9ca3af; }
          .objective-summary-edit { flex-shrink: 0; font-size: 12px; padding: 6px 12px; border-radius: 8px; border: 1px solid #6366f1; background: #fff; color: #4f46e5; cursor: pointer; font-weight: 600; }
        `}</style>
      </div>
    );
  };

  const renderRegisterForm = () => (
    <form
      className="form-step"
      onSubmit={(e) => {
        e.preventDefault();
        handleRegister();
      }}
    >
      <FormInput
        type="text"
        placeholder="Your username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        icon={User}
        error={errors.username}
      />

      <FormInput
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        icon={Mail}
        error={errors.email}
      />

      <FormInput
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        icon={Lock}
        error={errors.password}
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword(!showPassword)}
      />

      <FormInput
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        icon={Lock}
        error={errors.confirmPassword}
        showPassword={showConfirmPassword}
        onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
      />

      <div className="role-selection">
        <label>I am a:</label>
        {renderRoleDropdown()}
        {errors.role && <p className="error-text">{errors.role}</p>}
      </div>

      {renderPrimaryRoleSelector()}
      {renderObjectiveSummary()}

      <TermsConditionsCheckbox
        agreeToTerms={agreeToTerms}
        setAgreeToTerms={setAgreeToTerms}
        error={errors.terms}
        onAcceptanceTimestampChange={setTermsAcceptanceTimestamp}
      />

      <button type="submit" className="primary-btn" disabled={isLoading}>
        {isLoading ? (
          <span className="loading-button">
            <Loader2 className="animate-spin" size={16} />
            Creating Account...
          </span>
        ) : (
          <>
            Create Account <Rocket size={16} />
          </>
        )}
      </button>
    </form>
  );

  const renderLoginForm = () => (
    <form
      className="form-step"
      onSubmit={(e) => {
        e.preventDefault();
        handleLogin();
      }}
    >
      <FormInput
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        icon={Mail}
        error={errors.email}
      />

      <FormInput
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        icon={Lock}
        error={errors.password}
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword(!showPassword)}
      />

      <button type="submit" className="primary-btn" disabled={isLoading}>
        {isLoading ? (
          <span className="loading-button">
            <Loader2 className="animate-spin" size={16} />
            Logging in...
          </span>
        ) : (
          <>
            Login! <Smile size={16} />
          </>
        )}
      </button>
    </form>
  );

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="form-side">
          <div className="form-header">
            <h2>{isRegistering ? "Create Your Account!" : "Welcome Back!"}</h2>
            <div
              className={`icon-container ${
                isRegistering ? "register" : "login"
              }`}
            >
              {isRegistering ? <Rocket size={24} /> : <Smile size={24} />}
            </div>
          </div>

          {authError && <div className="auth-error">{authError}</div>}

          <div className="form-box">
            {isRegistering
              ? codeSent
                ? renderVerificationStep()
                : renderRegisterForm()
              : renderLoginForm()}
          </div>

          <p className="switch-link">
            {isRegistering ? (
              <>
                "Already a member of the BIG Circle"?{" "}
                <span onClick={() => setIsRegistering(false)}>Login</span>
              </>
            ) : (
              <>
                New to the family?{" "}
                <span onClick={() => setIsRegistering(true)}>Join us!</span>
              </>
            )}
          </p>

          {!isRegistering && (
            <p
              className="forgot-password-link"
              onClick={() => setShowForgotPasswordModal(true)}
            >
              Forgot your password?
            </p>
          )}
        </div>

        {/* Welcome Side */}
        <div className={`welcome-side ${isRegistering ? "top-aligned" : ""}`}>
          <div className="welcome-content">
            <h1>Welcome Home!</h1>
            <p>
              Delivering integrated solutions through expert consulting, market
              access, investor connections, and impactful community engagement.
            </p>
            <div className="welcome-features">
              <div className="welcome-feature">
                <Rocket size={20} className="feature-icon" />
                <span>BIG on Ideas</span>
              </div>
              <div className="welcome-feature">
                <HeartHandshake size={20} className="feature-icon" />
                <span>BIG on Growth</span>
              </div>
              <div className="welcome-feature">
                <Briefcase size={20} className="feature-icon" />
                <span>BIG on Impact</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAdvisorCriteria && (
        <AdvisorCriteriaModal
          onAccept={handleAdvisorCriteriaAccept}
          onCancel={handleAdvisorCriteriaCancel}
        />
      )}

      {renderForgotPasswordModal()}
      {renderRoleSelectionModal()}
      {renderRoleQuizModal()}
      {renderObjectiveModal()}

      {/* NDA Popup */}
      {/* {showNDA && registrationData && (
        <NDASignupPopup
          registrationData={registrationData}
          onRegistrationComplete={handleRegistrationComplete}
        />
      )} */}
    </div>
  );
}