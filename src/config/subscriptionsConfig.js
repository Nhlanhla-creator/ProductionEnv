// components/Subscriptions/subscriptionsConfig.js

// Investor Plans
export const investorPlans = {
  discover: {
    name: "Discover",
    price: { monthly: 0, annually: 0 },
    currency: "ZAR",
    description: "Essential features for getting started.",
    features: {
      "Access to BIG Score Profiles": "View public SME profiles",
      "Funder/Buyer Matching Tools": false,
      "Submit Funding/ESD Criteria": false,
      "Deal Room Participation": false,
      "Analytics Dashboard": false,
      "Custom Reporting": false,
      "Mentorship Participation": false,
      "Brand Visibility (on platform)": false,
      "Pilot Program Participation": false,
      "Priority Support": false,
      "Annual Event Access (BIG Pulse etc.)": false,
    },
    highlights: [
      "View public SME profiles",
      "Standard search functionality",
      "Email support",
    ],
  },
  engage: {
    name: "Engage",
    price: { monthly: 2000, annually: 20000 },
    currency: "ZAR",
    description: "Everything in Discover Plan + Engage Plan",
    features: {
      "Access to BIG Score Profiles": "Full profile access + filters",
      "Funder/Buyer Matching Tools": "Smart filters (stage, sector, score)",
      "Submit Funding/ESD Criteria": "Via smart intake form",
      "Deal Room Participation": "Join SME deal rooms by invite",
      "Analytics Dashboard": "Basic insights (SME profiles viewed)",
      "Custom Reporting": false,
      "Mentorship Participation": "Invite to mentor SMEs (opt-in)",
      "Brand Visibility (on platform)": "Logo in partner list",
      "Pilot Program Participation": "Invite only",
      "Priority Support": "Email",
      "Annual Event Access (BIG Pulse etc.)": "1 free ticket",
    },
    highlights: [
      "Full profile access + filters",
      "Smart filters (stage, sector, score)",
      "Join SME deal rooms by invite",
      "Basic insights dashboard",
    ],
  },
  partner: {
    name: "Partner",
    price: { monthly: 6500, annually: 65000 },
    currency: "ZAR",
    description: "Everything in Discover Plan + Partner",
    features: {
      "Access to BIG Score Profiles": "Full access + private deal room",
      "Funder/Buyer Matching Tools": "Priority-matching dashboard + alerts",
      "Submit Funding/ESD Criteria": "API integration + automated screening",
      "Deal Room Participation": "Create private deal rooms & invite SMEs",
      "Analytics Dashboard": "Full engagement metrics + conversion data",
      "Custom Reporting": "Quarterly impact or portfolio reports",
      "Mentorship Participation": "Featured mentor + visibility boost",
      "Brand Visibility (on platform)": "Logo + featured spotlight, homepage links",
      "Pilot Program Participation": "Guaranteed inclusion in funded pilots",
      "Priority Support": "Dedicated account manager",
      "Annual Event Access (BIG Pulse etc.)": "3 VIP tickets + speaking opportunities",
    },
    highlights: [
      "Full access + private deal room",
      "Priority-matching dashboard + alerts",
      "Create private deal rooms & invite SMEs",
      "Full engagement metrics + conversion data",
      "Dedicated account manager",
    ],
  },
};

export const investorFeatureOrder = [
  "Access to BIG Score Profiles",
  "Funder/Buyer Matching Tools",
  "Submit Funding/ESD Criteria",
  "Deal Room Participation",
  "Analytics Dashboard",
  "Custom Reporting",
  "Mentorship Participation",
  "Brand Visibility (on platform)",
  "Pilot Program Participation",
  "Priority Support",
  "Annual Event Access (BIG Pulse etc.)",
];

export const investorPlanOrder = { discover: 0, engage: 1, partner: 2 };

// SME Plans
export const smsePlans = {
  free: {
    name: "Free",
    price: { monthly: 0, annually: 0 },
    currency: "ZAR",
    description: "Get started with an initial BIG Score snapshot and a basic profile.",
    features: {
      "BIG Score": "Initial BIG Score Snapshot (static)",
      "Verification Status": false,
      "Document Vault": "Basic upload only",
      "Compliance Alerts": false,
      "Profile Visibility": "Limited",
      "SME Discovery (Visible to others)": "Limited",
      "SME-to-SME Matching": false,
      "Advisor Matching": false,
      "Intern Matching": false,
      "Marketplace Tools (Growth Suite)": false,
      "Funder Access": false,
      "Deal Room & Applications": false,
      "Data Room & Reports": false,
      "BIG Score Updates": false,
      "Support": "Community forum only",
    },
    highlights: [
      "Initial BIG Score Snapshot",
      "Basic profile",
      "Limited visibility",
    ],
    scoreState: {
      score_status: "snapshot",
      is_verified: false,
    },
  },
  verified: {
    name: "Verified",
    price: { monthly: 120, annually: 1200 },
    currency: "ZAR",
    description: "Maintain a trusted, up-to-date business profile.",
    features: {
      "BIG Score": "Live BIG Score (dynamic, auto-updated)",
      "Verification Status": "Verified & Active",
      "Document Vault": "Full vault + expiry tracking",
      "Compliance Alerts": "Expiry + missing docs alerts",
      "Profile Visibility": "Standard visibility",
      "SME Discovery (Visible to others)": true,
      "SME-to-SME Matching": "Basic access",
      "Advisor Matching": false,
      "Intern Matching": false,
      "Marketplace Tools (Growth Suite)": false,
      "Funder Access": false,
      "Deal Room & Applications": false,
      "Data Room & Reports": false,
      "BIG Score Updates": "Included",
      "Support": "Email support",
    },
    highlights: [
      "Live BIG Score",
      "Verification status",
      "Document vault + alerts",
      "Compliance tracking",
    ],
    scoreState: {
      score_status: "active",
      is_verified: true,
    },
    expiryMessage: "Verification expired — update required",
  },
  standard: {
    name: "Standard",
    price: { monthly: 450, annually: 4500 },
    currency: "ZAR",
    description: "Access opportunities and grow your business.",
    features: {
      "BIG Score": "Dynamic (priority visibility)",
      "Verification Status": "Verified & Active",
      "Document Vault": "Full vault + alerts",
      "Compliance Alerts": true,
      "Profile Visibility": "Enhanced profile + tagging",
      "SME Discovery (Visible to others)": "Priority",
      "SME-to-SME Matching": "Priority access",
      "Advisor Matching": "Basic access",
      "Intern Matching": "Early-stage access",
      "Marketplace Tools (Growth Suite)": "Selected tools included",
      "Funder Access": false,
      "Deal Room & Applications": false,
      "Data Room & Reports": false,
      "BIG Score Updates": "Included",
      "Support": "Priority email support",
    },
    highlights: [
      "Everything in Verified",
      "Marketplace visibility",
      "Matching access",
      "Basic tools",
    ],
    requiresVerified: true,
    scoreState: {
      score_status: "active",
      is_verified: true,
    },
  },
  premium: {
    name: "Premium",
    price: { monthly: 1200, annually: 12000 },
    currency: "ZAR",
    description: "Scale with capital, tools, and full ecosystem access.",
    features: {
      "BIG Score": "Dynamic + Funder-ready PDF report",
      "Verification Status": "Verified & Active",
      "Document Vault": "Full vault + compliance reporting",
      "Compliance Alerts": "Advanced alerts + reporting",
      "Profile Visibility": "Premium placement (top of directory)",
      "SME Discovery (Visible to others)": "Premium",
      "SME-to-SME Matching": "Dedicated deal facilitation support",
      "Advisor Matching": "Priority + placement support",
      "Intern Matching": "Fast-track + curated intern teams",
      "Marketplace Tools (Growth Suite)": "Full toolkit access",
      "Funder Access": "Direct matching + warm intros",
      "Deal Room & Applications": "Multi-funder applications + tracking",
      "Data Room & Reports": "Investor reports + compliance exports",
      "BIG Score Updates": "Included",
      "Support": "Dedicated support + check-ins",
    },
    highlights: [
      "Everything in Standard",
      "Funder access",
      "Deal room",
      "Full Growth Suite",
      "Priority placement",
    ],
    requiresVerified: true,
    scoreState: {
      score_status: "active",
      is_verified: true,
    },
  },
};

export const smseFeatureOrder = [
  "BIG Score",
  "Verification Status",
  "Document Vault",
  "Compliance Alerts",
  "Profile Visibility",
  "SME Discovery (Visible to others)",
  "SME-to-SME Matching",
  "Advisor Matching",
  "Intern Matching",
  "Marketplace Tools (Growth Suite)",
  "Funder Access",
  "Deal Room & Applications",
  "Data Room & Reports",
  "BIG Score Updates",
  "Support",
];

// Catalyst Plans
export const catalystPlans = {
  core: {
    name: "Core Programme",
    price: { monthly: 0, annually: 0 },
    currency: "ZAR",
    platformFee: "R250k – R400k",
    annualCostPerSme: "R140k – R180k",
    targetCohort: "10–20 SMEs",
    contractTerm: "12 months",
    description: "Structured governance and monitoring for emerging ESD programmes.",
    plan_type: "catalyst",
    billing_model: "cohort_based",
    payment_required: false,
    subscription_activation: "manual",
    lead_capture: true,
    features: {
      "Structured Intake Portal": true,
      "SME Onboarding & Data Capture": true,
      "BIG Score Pre-Vetting": "Initial + periodic",
      "SME Digital Profiles": true,
      "Deal Flow Management": "Basic tracking",
      "Growth Suite Tracking": "Basic",
      "KPI Tracking": "Standard",
      "Milestone Tracking": true,
      "SME Progress Tracking": "Basic",
      "Consultant Commentary": "Optional",
      "Compliance Monitoring": "Monthly",
      "Governance Calendar": "Standard",
      "Audit Trail": "Basic",
      "Risk Indicators": false,
      "Dashboard Access": "Basic",
      "Portfolio Reporting": "Quarterly",
      "Benchmarking": false,
      "Executive Reports": false,
      "Corporate Users": "2–5 users",
      "Multi-Division Support": false,
      "Support Level": "Standard",
    },
    highlights: [
      "10–20 SME cohort size",
      "Structured Intake Portal",
      "BIG Score Pre-Vetting (initial + periodic)",
      "Basic Deal Flow Management",
      "Basic Growth Suite Tracking",
      "Standard KPI Tracking",
      "Monthly Compliance Monitoring",
      "Basic Dashboard Access",
      "Quarterly Portfolio Reporting",
      "2–5 Corporate Users",
      "Standard Support",
    ],
  },
  scaled: {
    name: "Scaled Programme",
    price: { monthly: 0, annually: 0 },
    currency: "ZAR",
    platformFee: "R400k – R700k",
    annualCostPerSme: "R130k – R150k",
    targetCohort: "20–50 SMEs",
    contractTerm: "12–36 months",
    description: "Enhanced infrastructure for growing accelerators and incubators.",
    plan_type: "catalyst",
    billing_model: "cohort_based",
    payment_required: false,
    subscription_activation: "manual",
    lead_capture: true,
    isPopular: true,
    features: {
      "Structured Intake Portal": true,
      "SME Onboarding & Data Capture": true,
      "BIG Score Pre-Vetting": "Continuous",
      "SME Digital Profiles": true,
      "Deal Flow Management": "Structured pipeline",
      "Growth Suite Tracking": "Full",
      "KPI Tracking": "Custom per cohort",
      "Milestone Tracking": true,
      "SME Progress Tracking": "Full lifecycle",
      "Consultant Commentary": "Included",
      "Compliance Monitoring": "Monthly + alerts",
      "Governance Calendar": "Structured programme calendar",
      "Audit Trail": "Full",
      "Risk Indicators": "Basic",
      "Dashboard Access": "Cohort dashboards",
      "Portfolio Reporting": "Monthly + quarterly",
      "Benchmarking": "Basic",
      "Executive Reports": "Optional",
      "Corporate Users": "5–15 users",
      "Multi-Division Support": "Limited",
      "Support Level": "Priority",
    },
    highlights: [
      "20–50 SME cohort size",
      "SME Onboarding & Data Capture",
      "Continuous BIG Score Pre-Vetting",
      "Structured Deal Flow Pipeline",
      "Full Growth Suite Tracking",
      "Custom KPI Tracking per cohort",
      "Monthly Compliance + Alerts",
      "Cohort Dashboards",
      "Monthly + Quarterly Reporting",
      "5–15 Corporate Users",
      "Priority Support",
    ],
  },
  enterprise: {
    name: "Enterprise Portfolio",
    price: { monthly: 0, annually: 0 },
    currency: "ZAR",
    platformFee: "R700k – R1.5m+",
    annualCostPerSme: "R95k – R130k",
    targetCohort: "50–100+ SMEs",
    contractTerm: "24–36 months",
    description: "Full-suite enterprise infrastructure with advanced analytics and multi-division support.",
    plan_type: "catalyst",
    billing_model: "cohort_based",
    payment_required: false,
    subscription_activation: "manual",
    lead_capture: true,
    features: {
      "Structured Intake Portal": "Multi-division",
      "SME Onboarding & Data Capture": "Advanced",
      "BIG Score Pre-Vetting": "Advanced + segmentation",
      "SME Digital Profiles": true,
      "Deal Flow Management": "Advanced workflows",
      "Growth Suite Tracking": "Advanced analytics",
      "KPI Tracking": "Multi-layer KPI mapping",
      "Milestone Tracking": "Advanced",
      "SME Progress Tracking": "Full + predictive insights",
      "Consultant Commentary": "Fully integrated",
      "Compliance Monitoring": "Real-time",
      "Governance Calendar": "Multi-layer (group + division)",
      "Audit Trail": "Full + historical",
      "Risk Indicators": "Advanced modelling",
      "Dashboard Access": "Executive dashboards",
      "Portfolio Reporting": "Custom + board-ready",
      "Benchmarking": "Advanced",
      "Executive Reports": "Included",
      "Corporate Users": "Unlimited (role-based)",
      "Multi-Division Support": true,
      "Support Level": "Dedicated + strategic",
    },
    highlights: [
      "50–100+ SME cohort size",
      "Multi-division Onboarding",
      "Advanced BIG Score + Segmentation",
      "Advanced Deal Flow Workflows",
      "Advanced Growth Analytics",
      "Multi-layer KPI Mapping",
      "Real-time Compliance Monitoring",
      "Executive Dashboards",
      "Custom + Board-ready Reporting",
      "Unlimited Users (role-based)",
      "Dedicated + Strategic Support",
    ],
  },
};

export const catalystFeatureOrder = [
  "Structured Intake Portal",
  "SME Onboarding & Data Capture",
  "BIG Score Pre-Vetting",
  "SME Digital Profiles",
  "Deal Flow Management",
  "Growth Suite Tracking",
  "KPI Tracking",
  "Milestone Tracking",
  "SME Progress Tracking",
  "Consultant Commentary",
  "Compliance Monitoring",
  "Governance Calendar",
  "Audit Trail",
  "Risk Indicators",
  "Dashboard Access",
  "Portfolio Reporting",
  "Benchmarking",
  "Executive Reports",
  "Corporate Users",
  "Multi-Division Support",
  "Support Level",
];

export const catalystPlanOrder = { core: 0, scaled: 1, enterprise: 2 };

// Add-ons
export const catalystAddOns = [
  {
    id: "reporting-customisation",
    name: "Reporting Customisation",
    price: "R250,000 (once-off)",
    amount: 250000,
    description: "Custom templates, KPI mapping, executive formatting, QA + testing.",
    items: ["Custom templates", "KPI mapping", "Executive formatting", "QA + testing"],
    requires_separate_contract: true,
  },
  {
    id: "advanced-analytics",
    name: "Advanced Analytics & Intelligence",
    price: "R450k – R600k / year",
    amount: 450000,
    description: "Executive dashboards, benchmarking, risk modelling, board packs.",
    items: ["Executive dashboards", "Benchmarking", "Risk modelling", "Board packs"],
    requires_separate_contract: true,
  },
  {
    id: "integration-build",
    name: "Integration / Custom Build",
    price: "R150k – R500k+ (once-off, scoped)",
    amount: 150000,
    description: "API integrations, ERP / procurement integration, custom workflows.",
    items: ["API integrations", "ERP / procurement integration", "Custom workflows"],
    requires_separate_contract: true,
  },
];

export const catalystLeadStatuses = [
  "new_lead",
  "in_discussion",
  "proposal_sent",
  "negotiation",
  "closed_won",
  "closed_lost",
];

export const catalystBackendConfig = {
  plan_type: "catalyst",
  billing_model: "cohort_based",
  payment_required: false,
  subscription_activation: "manual",
  lead_capture: true,
  crm_required: true,
  pricing_formula: "(number_of_smes * price_per_sme) + platform_fee",
  billing_cycle: "annual",
  user_roles: ["catalyst_admin", "catalyst_user", "sme_member"],
  feature_access_rules: {
    core_programme: ["basic_features"],
    scaled_programme: ["enhanced_features"],
    enterprise_portfolio: ["full_features"],
  },
  customisation: {
    included_in_base: false,
    requires_separate_contract: true,
    requires_quote: true,
  },
};

export const catalystUICopy = {
  header: "Catalyst Plans – SME Programme Infrastructure",
  subtext: "Structured governance, monitoring, and reporting infrastructure for ESD programmes, accelerators, and enterprise development initiatives.",
  footerNote: "Customisation, integrations, and advanced analytics are scoped separately based on programme requirements.",
  ctaLabel: "Request Proposal",
  formTitle: "Request Programme Proposal",
  successTitle: "Request Received",
  successMessage: "Thank you for your interest in BIG Marketplace.\nOur team will review your requirements and be in touch to structure a tailored proposal based on your programme scope, cohort size, and reporting needs.",
};

export const smsePlanOrder = { free: 0, verified: 1, standard: 2, premium: 3 };
export const investorAddOns = [
  {
    id: "api-access",
    name: "API Access to BIG Score engine",
    price: "From R1,500/month",
    amount: 1500,
    description: "Integrate BIG Score directly into your systems with our comprehensive API access.",
  },
  {
    id: "branded-portfolio",
    name: "Branded SME Portfolio Pages",
    price: "R2,000 setup + R500/month",
    amount: 2500,
    description: "Custom branded pages for your SME portfolio with your company's branding and styling.",
  },
  {
    id: "cobranded-calls",
    name: "Co-branded Calls for Applications",
    price: "R5,000 per campaign",
    amount: 5000,
    description: "Joint marketing campaigns for funding opportunities with co-branded materials and outreach.",
  },
  {
    id: "funder-benchmarks",
    name: "Funder-specific BIG Score benchmarks",
    price: "R3,500 per report",
    amount: 3500,
    description: "Customized scoring benchmarks tailored to specific funder requirements and criteria.",
  },
];

export const smseAddOns = [
  {
    id: "api-access",
    name: "API Access to BIG Score engine",
    price: "From R1,500/month",
    amount: 1500,
    description: "Integrate BIG Score directly into your systems with our comprehensive API access.",
  },
  {
    id: "branded-portfolio",
    name: "Branded SME Portfolio Pages",
    price: "R2,000 setup + R500/month",
    amount: 2500,
    description: "Custom branded pages for your SME portfolio with your company's branding and styling.",
  },
  {
    id: "cobranded-calls",
    name: "Co-branded Calls for Applications",
    price: "R5,000 per campaign",
    amount: 5000,
    description: "Joint marketing campaigns for funding opportunities with co-branded materials and outreach.",
  },
  {
    id: "funder-benchmarks",
    name: "Funder-specific BIG Score benchmarks",
    price: "R3,500 per report",
    amount: 3500,
    description: "Customized scoring benchmarks tailored to specific funder requirements and criteria.",
  },
];

// Card Backgrounds and Default User Data
const cardBackgrounds = {
  investor: {
    discover: "linear-gradient(135deg, #F5F2F0 0%, #EFEBE9 100%)",
    engage: "linear-gradient(135deg, #8D6E63 0%, #5D4037 100%)",
    partner: "linear-gradient(135deg, #A67C52 0%, #8D6E63 100%)",
  },
  smse: {
    free: "linear-gradient(135deg, #F5F2F0 0%, #EFEBE9 100%)",
    verified: "linear-gradient(135deg, #8D6E63 0%, #6D4C41 100%)",
    standard: "linear-gradient(135deg, #5D4037 0%, #4A352F 100%)",
    premium: "linear-gradient(135deg, #A67C52 0%, #8D6E63 100%)",
  },
  catalyst: {
    core: "linear-gradient(135deg, #F5F2F0 0%, #EFEBE9 100%)",
    scaled: "linear-gradient(135deg, #8D6E63 0%, #5D4037 100%)",
    enterprise: "linear-gradient(135deg, #A67C52 0%, #8D6E63 100%)",
  },
};

const defaultUserData = {
  investor: {
    name: "",
    company: "",
    email: "",
    role: "investor",
    fullName: "",
  },
  smse: {
    name: "",
    businessName: "",
    email: "",
    role: "smse",
    fullName: "",
  },
  catalyst: {
    name: "",
    organization: "",
    email: "",
    role: "catalyst",
    fullName: "",
  },
};

// Helper functions
export const getPlanData = (userType) => {
  switch (userType) {
    case "investor": return investorPlans;
    case "smse": return smsePlans;
    case "catalyst": return catalystPlans;
    default: return investorPlans;
  }
};

export const getFeatureOrder = (userType) => {
  switch (userType) {
    case "investor": return investorFeatureOrder;
    case "smse": return smseFeatureOrder;
    case "catalyst": return catalystFeatureOrder;
    default: return investorFeatureOrder;
  }
};

export const getPlanOrder = (userType) => {
  switch (userType) {
    case "investor": return investorPlanOrder;
    case "smse": return smsePlanOrder;
    case "catalyst": return catalystPlanOrder;
    default: return investorPlanOrder;
  }
};

export const getCardBackgrounds = (userType) => {
  return cardBackgrounds[userType] || cardBackgrounds.investor;
};

export const getDefaultUserData = (userType) => {
  return defaultUserData[userType] || defaultUserData.investor;
};

export const getFreePlanKey = (userType) => {
  const plans = getPlanData(userType);
  return Object.keys(plans)[0];
};

export const getPopularPlanKey = (userType) => {
  switch (userType) {
    case "investor": return "engage";
    case "smse": return "standard";
    case "catalyst": return "scaled";
    default: return "engage";
  }
};

export const isPopularPlan = (userType, planKey) => {
  return planKey === getPopularPlanKey(userType);
};

export const getAddOns = (userType) => {
  switch (userType) {
    case "investor": return investorAddOns;
    case "smse": return smseAddOns;
    case "catalyst": return catalystAddOns;
    default: return investorAddOns;
  }
};

export const getSmeScoreState = (planKey) => {
  const plan = smsePlans[planKey];
  return plan?.scoreState || { score_status: "snapshot", is_verified: false };
};

export const requiresVerifiedPlan = (planKey) => {
  return !!smsePlans[planKey]?.requiresVerified;
};

export const getSmeStaleState = () => ({
  score_status: "stale",
  is_verified: false,
  expiryMessage: smsePlans.verified.expiryMessage,
});