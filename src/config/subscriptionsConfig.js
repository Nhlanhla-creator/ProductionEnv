// components/Subscriptions/subscriptionConfig.js

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
      "Brand Visibility (on platform)":
        "Logo + featured spotlight, homepage links",
      "Pilot Program Participation": "Guaranteed inclusion in funded pilots",
      "Priority Support": "Dedicated account manager",
      "Annual Event Access (BIG Pulse etc.)":
        "3 VIP tickets + speaking opportunities",
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
  basic: {
    name: "Basic",
    price: { monthly: 0, annually: 0 },
    currency: "ZAR",
    description: "Essential features for getting started.",
    features: {
      "BIG Score (Initial Assessment)": "1 free score",
      "BIG Score Improvement Tools": "Paid separately",
      "SME Discovery (Visible to others)": true,
      "SME-to-SME Matching": "On success-fee basis (5-10%)",
      "Advisor Matching": false,
      "Intern Matching": false,
      "Marketplace Tools (Growth Suite)": "Buy individually (R50-R200/tool)",
      "Funders & Investors Access": false,
      "Funder Deal Room & Smart Application": false,
      "Data Room & Investor Reports": false,
      "Success Fee (on closed deals)": "5-10%",
      Support: "Community forum only",
    },
    highlights: [
      "1 free BIG Score",
      "Basic SME discovery",
      "Community support",
      "Success-fee matching",
    ],
  },
  standard: {
    name: "Standard",
    price: { monthly: 450, annually: 4500 },
    currency: "ZAR",
    description: "Everything in Free Plan + Standard",
    features: {
      "BIG Score (Initial Assessment)": "Auto-updates quarterly",
      "BIG Score Improvement Tools": "Included basic tools",
      "SME Discovery (Visible to others)": "Enhanced profile & tagging",
      "SME-to-SME Matching": "Priority access",
      "Advisor Matching": "Free for pre-seed SMEs",
      "Intern Matching": "For early-stage projects",
      "Marketplace Tools (Growth Suite)": "Selected tools included",
      "Funders & Investors Access": false,
      "Funder Deal Room & Smart Application": false,
      "Data Room & Investor Reports": false,
      "Success Fee (on closed deals)": "3-5%",
      Support: "Email support",
    },
    highlights: [
      "Quarterly BIG Score updates",
      "Basic improvement tools",
      "Enhanced profile",
      "Priority matching access",
    ],
  },
  premium: {
    name: "Premium",
    price: { monthly: 1200, annually: 12000 },
    currency: "ZAR",
    description: "Everything in Standard Plan + Premium Plan",
    features: {
      "BIG Score (Initial Assessment)":
        "Auto-updates + funder-ready PDF report",
      "BIG Score Improvement Tools": "Full toolkit + custom benchmarking",
      "SME Discovery (Visible to others)":
        "Premium placement (top of directory)",
      "SME-to-SME Matching": "Dedicated deal facilitation support",
      "Advisor Matching": "Priority access + flat fee per placement",
      "Intern Matching": "Fast-track & curated intern teams",
      "Marketplace Tools (Growth Suite)":
        "Full access (all toolkits & templates)",
      "Funders & Investors Access": "Direct match + warm intros",
      "Funder Deal Room & Smart Application":
        "Application routing + real-time tracking",
      "Data Room & Investor Reports":
        "Auto-generated updates & compliance tools",
      "Success Fee (on closed deals)": "1-2% or capped flat fee",
      Support: "Dedicated support + quarterly check-in",
    },
    highlights: [
      "Full BIG Score toolkit",
      "Premium placement",
      "Funder access",
      "Dedicated support",
    ],
  },
};

export const smseFeatureOrder = [
  "BIG Score (Initial Assessment)",
  "BIG Score Improvement Tools",
  "SME Discovery (Visible to others)",
  "SME-to-SME Matching",
  "Advisor Matching",
  "Intern Matching",
  "Marketplace Tools (Growth Suite)",
  "Funders & Investors Access",
  "Funder Deal Room & Smart Application",
  "Data Room & Investor Reports",
  "Success Fee (on closed deals)",
  "Support",
];

export const smsePlanOrder = { basic: 0, standard: 1, premium: 2 };

// Catalyst Plans (same as Investor for now, but can be customized)
export const catalystPlans = {
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
      "Brand Visibility (on platform)":
        "Logo + featured spotlight, homepage links",
      "Pilot Program Participation": "Guaranteed inclusion in funded pilots",
      "Priority Support": "Dedicated account manager",
      "Annual Event Access (BIG Pulse etc.)":
        "3 VIP tickets + speaking opportunities",
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

export const catalystFeatureOrder = [
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

export const catalystPlanOrder = { discover: 0, engage: 1, partner: 2 };

// Card Backgrounds
export const cardBackgrounds = {
  investor: {
    discover: "linear-gradient(160deg, #8D6E63 0%, #6D4C41 100%)",
    engage: "linear-gradient(160deg, #5D4037 0%, #4A352F 100%)",
    partner: "linear-gradient(160deg, #A67C52 0%, #8D6E63 100%)",
  },
  smse: {
    basic: "linear-gradient(160deg, #8D6E63 0%, #6D4C41 100%)",
    standard: "linear-gradient(160deg, #5D4037 0%, #4A352F 100%)",
    premium: "linear-gradient(160deg, #A67C52 0%, #8D6E63 100%)",
  },
  catalyst: {
    discover: "linear-gradient(160deg, #8D6E63 0%, #6D4C41 100%)",
    engage: "linear-gradient(160deg, #5D4037 0%, #4A352F 100%)",
    partner: "linear-gradient(160deg, #A67C52 0%, #8D6E63 100%)",
  },
};

// Default User Data
export const defaultUserData = {
  investor: {
    email: "nhlanhlamsomi2024@gmail.com",
    fullName: "Nhlanhla Msomi",
  },
  smse: {
    email: "nhlanhlamsomi2024@gmail.com",
    fullName: "Nhlanhla Msomi",
  },
  catalyst: {
    email: "nhlanhlamsomi2024@gmail.com",
    fullName: "Nhlanhla Msomi",
  },
};

// Add-ons for different user types
export const investorAddOns = [
  {
    id: "api-access",
    name: "API Access to BIG Score engine",
    price: "From R1,500/month",
    amount: 1500,
    description:
      "Integrate BIG Score directly into your systems with our comprehensive API access.",
  },
  {
    id: "branded-portfolio",
    name: "Branded SME Portfolio Pages",
    price: "R2,000 setup + R500/month",
    amount: 2500,
    description:
      "Custom branded pages for your SME portfolio with your company's branding and styling.",
  },
  {
    id: "cobranded-calls",
    name: "Co-branded Calls for Applications",
    price: "R5,000 per campaign",
    amount: 5000,
    description:
      "Joint marketing campaigns for funding opportunities with co-branded materials and outreach.",
  },
  {
    id: "funder-benchmarks",
    name: "Funder-specific BIG Score benchmarks",
    price: "R3,500 per report",
    amount: 3500,
    description:
      "Customized scoring benchmarks tailored to specific funder requirements and criteria.",
  },
];

const smseAddOns = [
  {
    id: "api-access",
    name: "API Access to BIG Score engine",
    price: "From R1,500/month",
    amount: 1500,
    description:
      "Integrate BIG Score directly into your systems with our comprehensive API access.",
  },
  {
    id: "branded-portfolio",
    name: "Branded SME Portfolio Pages",
    price: "R2,000 setup + R500/month",
    amount: 2500,
    description:
      "Custom branded pages for your SME portfolio with your company's branding and styling.",
  },
  {
    id: "cobranded-calls",
    name: "Co-branded Calls for Applications",
    price: "R5,000 per campaign",
    amount: 5000,
    description:
      "Joint marketing campaigns for funding opportunities with co-branded materials and outreach.",
  },
  {
    id: "funder-benchmarks",
    name: "Funder-specific BIG Score benchmarks",
    price: "R3,500 per report",
    amount: 3500,
    description:
      "Customized scoring benchmarks tailored to specific funder requirements and criteria.",
  },
];

export const catalystAddOns = [
  {
    id: "custom-integration",
    name: "Custom Platform Integration",
    price: "From R3,000/month",
    amount: 3000,
    description: "Custom integration with your existing systems and workflows.",
  },
  {
    id: "whitelabel-portal",
    name: "White-label Portal",
    price: "R5,000 setup + R2,000/month",
    amount: 7000,
    description:
      "Completely white-labeled portal with your branding for client access.",
  },
  {
    id: "dedicated-support",
    name: "Dedicated Account Manager",
    price: "R3,500/month",
    amount: 3500,
    description:
      "Get a dedicated account manager for personalized support and guidance.",
  },
  {
    id: "custom-training",
    name: "Custom Training Sessions",
    price: "R2,500 per session",
    amount: 2500,
    description:
      "Custom training sessions for your team on using the platform effectively.",
  },
];

// Main export functions
export const getPlanData = (userType) => {
  switch (userType) {
    case "investor":
      return investorPlans;
    case "smse":
      return smsePlans;
    case "catalyst":
      return catalystPlans;
    default:
      return investorPlans;
  }
};

export const getFeatureOrder = (userType) => {
  switch (userType) {
    case "investor":
      return investorFeatureOrder;
    case "smse":
      return smseFeatureOrder;
    case "catalyst":
      return catalystFeatureOrder;
    default:
      return investorFeatureOrder;
  }
};

export const getPlanOrder = (userType) => {
  switch (userType) {
    case "investor":
      return investorPlanOrder;
    case "smse":
      return smsePlanOrder;
    case "catalyst":
      return catalystPlanOrder;
    default:
      return investorPlanOrder;
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
    case "investor":
      return "engage";
    case "smse":
      return "standard";
    case "catalyst":
      return "engage";
    default:
      return "engage";
  }
};

export const isPopularPlan = (userType, planKey) => {
  return planKey === getPopularPlanKey(userType);
};

// Get add-ons based on user type
export const getAddOns = (userType) => {
  switch (userType) {
    case "investor":
      return investorAddOns;
    case "smse":
      return smseAddOns;
    case "catalyst":
      return catalystAddOns;
    default:
      return investorAddOns;
  }
};
