import "./FundingApplication.css";

export const applicationType = [
  { value: "Funding", label: "Funding (grants, loans, equity, etc.)" },
  { value: "Incubation Programme", label: "Incubation Programme (early-stage business development)" },
  { value: "Acceleration Programme", label: "Acceleration Programme (short-term growth-focused support)" },
  { value: "Enterprise Supplier Development", label: "Enterprise Supplier Development (ESD)" },
  { value: "Technical Assistance", label: "Technical Assistance" },
  { value: "Mentorship or Coaching", label: "Mentorship or Coaching" },
  { value: "Training & Skills Development", label: "Training & Skills Development" },
  { value: "Market Access Support", label: "Market Access Support" },
  { value: "Other", label: "Other (please specify)" },
];

export const businessFundingStage = [
  { value: "Pre-seed", label: "Pre-seed" },
  { value: "Seed", label: "Seed" },
  { value: "Series A", label: "Series A" },
  { value: "Series B", label: "Series B" },
  { value: "Series C+", label: "Series C+" },
  { value: "Growth/PE", label: "Growth/PE" },
  { value: "MBO", label: "MBO" },
  { value: "MBI", label: "MBI" },
  { value: "LBO", label: "LBO" },
];

export const urgencyOptions = [
  { value: "Immediate", label: "Immediate" },
  { value: "1-3 months", label: "1-3 months" },
  { value: "6-12 months", label: "6-12 months" },
];

export const supportFormatOptions = [
  { value: "Incubation", label: "Incubation" },
  { value: "Governance Support", label: "Governance Support" },
  { value: "Network Access", label: "Network Access" },
  { value: "None", label: "None" },
  { value: "Other", label: "Other (please specify)" },
];

export const fundingInstrumentOptions = [
  { value: "Working Capital Loans", label: "Working Capital Loans" },
  { value: "Venture Capital", label: "Venture Capital" },
  { value: "Invoice Discounting", label: "Invoice Discounting" },
  { value: "Mezzanine Finance", label: "Mezzanine Finance" },
  { value: "Common Shares", label: "Common Shares" },
  { value: "Preferred Shares", label: "Preferred Shares" },
  { value: "SAFE", label: "SAFE (Simple Agreement for Future Equity)" },
  { value: "Convertible Note", label: "Convertible Note" },
  { value: "Equity Warrant", label: "Equity Warrant" },
  { value: "Innovation Grant", label: "Innovation Grant" },
  { value: "Matching Grant", label: "Matching Grant" },
  { value: "Milestone-Based Grant", label: "Milestone-Based Grant" },
  { value: "Technical Assistance Grant", label: "Technical Assistance Grant" }
];

export const fundingCategoryOptions = [
  { value: "Set-Up", label: "Set-Up" },
  { value: "Capex", label: "Capex" },
  { value: "Upgrade", label: "Upgrade" },
  { value: "Expansion", label: "Expansion" },
  { value: "Working Capital", label: "Working Capital" },
  { value: "Acquisition", label: "Acquisition" },
  { value: "Business Development", label: "Business Development" },
];

export const subAreaOptions = {
  setup: [{ value: "Feasibility", label: "Feasibility" }],
  upgrade: [
   { value: "Upgrade", label: "Upgrade" },
    { value: "Expansion", label: "Expansion" },
  ],
  workingCapital:[{ value: "Bridging Finance", label: "Bridging Finance" }],
  acquisition: [
    { value: "Franchise", label: "Franchise" },
    { value: "Asset Acquisition", label: "Asset Acquisition" },
  ],
  businessDevelopment: [
    { value: "Product Design & Development", label: "Product Design & Development" },
    { value: "Packaging Design & Development", label: "Packaging Design & Development" },
    { value: "Conformity Assessment Certification", label: "Conformity Assessment Certification" },
    { value: "IT Systems", label: "IT Systems" },
    { value: "Process Optimisation", label: "Process Optimisation" },
    { value: "Patents", label: "Patents" },
    { value: "Logistics", label: "Logistics" },
    { value: "Sales and Marketing", label: "Sales and Marketing" },
    { value: "Post-investment Support", label: "Post-investment Support" },
  ],
};

export const barrierOptions = [
  { value: "Skills", label: "Skills" },
  { value: "Access to Capital", label: "Access to Capital" },
  { value: "Market Access", label: "Market Access" },
  { value: "Systems", label: "Systems" },
];

export const profitabilityOptions = [
  { value: "Profitable", label: "Profitable" },
  { value: "Breakeven", label: "Breakeven" },
  { value: "Loss-making", label: "Loss-making" },
];