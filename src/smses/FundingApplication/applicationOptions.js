import "./FundingApplication.css";

export const applicationType = [
  { 
    value: "Funding", 
    label: "Funding (grants, loans, equity, etc.)",
    tooltip: "Financial support through grants (non-repayable), loans (repayable with interest), or equity (investor ownership)"
  },
  { 
    value: "Incubation Programme", 
    label: "Incubation Programme (early-stage business development)",
    tooltip: "Long-term support (1-3 years) for startups: workspace, mentoring, business basics, and early growth"
  },
  { 
    value: "Acceleration Programme", 
    label: "Acceleration Programme (short-term growth-focused support)",
    tooltip: "Short-term (3-6 months) intensive program for scaling companies: mentorship, investor access, rapid growth"
  },
  { 
    value: "Enterprise Supplier Development", 
    label: "Enterprise Supplier Development (ESD)",
    tooltip: "South African program developing black/women/youth-owned businesses through procurement and support"
  },
  { 
    value: "Technical Assistance", 
    label: "Technical Assistance",
    tooltip: "Expert support for specific business areas: financial modeling, legal advice, engineering, or technical expertise"
  },
  { 
    value: "Mentorship or Coaching", 
    label: "Mentorship or Coaching",
    tooltip: "One-on-one guidance from experienced entrepreneurs or industry experts for leadership and strategy"
  },
  { 
    value: "Training & Skills Development", 
    label: "Training & Skills Development",
    tooltip: "Workshops and courses for employee skills: management, technical skills, sales, or operations"
  },
  { 
    value: "Market Access Support", 
    label: "Market Access Support",
    tooltip: "Help entering new markets: export assistance, distribution channels, buyer connections, market research"
  },
  { 
    value: "Other", 
    label: "Other (please specify)",
    tooltip: "Select if you need a different type of support not listed above"
  },
];

export const businessFundingStage = [
  { 
    value: "Pre-seed", 
    label: "Pre-seed",
    tooltip: "Earliest stage: Idea development, prototypes, market validation"
  },
  { 
    value: "Seed", 
    label: "Seed",
    tooltip: "First equity funding: Complete product, initial customers"
  },
  { 
    value: "Series A", 
    label: "Series A",
    tooltip: "Scale proven products, optimize, grow customer base"
  },
  { 
    value: "Series B", 
    label: "Series B",
    tooltip: "Expand market reach, scale operations, meet demand"
  },
  { 
    value: "Series C+", 
    label: "Series C+",
    tooltip: "Dominate markets, acquire competitors, prepare for IPO"
  },
  { 
    value: "Growth/PE", 
    label: "Growth/PE",
    tooltip: "Private equity for mature companies: Expansion, restructuring"
  },
  { 
    value: "MBO", 
    label: "MBO",
    tooltip: "Management Buyout: Existing team buys the business"
  },
  { 
    value: "MBI", 
    label: "MBI",
    tooltip: "Management Buy-in: External team takes over business"
  },
  { 
    value: "LBO", 
    label: "LBO",
    tooltip: "Leveraged Buyout: Purchase financed mostly through debt"
  },
];

export const urgencyOptions = [
  { 
    value: "Immediate", 
    label: "Immediate",
    tooltip: "Need support within 30 days or less"
  },
  { 
    value: "1-3 months", 
    label: "1-3 months",
    tooltip: "Can start support within 1 to 3 months"
  },
  { 
    value: "6-12 months", 
    label: "6-12 months",
    tooltip: "Planning for support in 6 to 12 months"
  },
];

export const supportFormatOptions = [
  { 
    value: "Incubation", 
    label: "Incubation",
    tooltip: "Early-stage support with workspace, mentoring, resources"
  },
  { 
    value: "Governance Support", 
    label: "Governance Support",
    tooltip: "Board development, compliance, corporate governance"
  },
  { 
    value: "Network Access", 
    label: "Network Access",
    tooltip: "Connections to investors, partners, industry experts"
  },
  { 
    value: "None", 
    label: "None",
    tooltip: "No additional support required beyond funding"
  },
  { 
    value: "Other", 
    label: "Other (please specify)",
    tooltip: "Select if you need a different support format not listed"
  },
];

export const fundingInstrumentOptions = [
  { 
    value: "Working Capital Loans", 
    label: "Working Capital Loans",
    tooltip: "Loans for daily operations, inventory, and short-term needs"
  },
  { 
    value: "Venture Capital", 
    label: "Venture Capital", 
    tooltip: "Equity investment for high-growth startups"
  },
  { 
    value: "Invoice Discounting", 
    label: "Invoice Discounting", 
    tooltip: "Sell unpaid invoices for immediate cash"
  },
  { 
    value: "Mezzanine Finance", 
    label: "Mezzanine Finance", 
    tooltip: "Hybrid debt-equity that can convert to equity"
  },
  { 
    value: "Common Shares", 
    label: "Common Shares", 
    tooltip: "Standard equity shares with voting rights"
  },
  { 
    value: "Preferred Shares", 
    label: "Preferred Shares", 
    tooltip: "Priority dividend shares, usually no voting rights"
  },
  { 
    value: "SAFE", 
    label: "SAFE (Simple Agreement for Future Equity)", 
    tooltip: "Converts to equity in future financing round"
  },
  { 
    value: "Convertible Note", 
    label: "Convertible Note", 
    tooltip: "Short-term debt that converts to equity"
  },
  { 
    value: "Equity Warrant", 
    label: "Equity Warrant", 
    tooltip: "Right to purchase shares at set price"
  },
  { 
    value: "Innovation Grant", 
    label: "Innovation Grant",
    tooltip: "Non-repayable funding for innovative projects or research"
  },
  { 
    value: "Matching Grant", 
    label: "Matching Grant", 
    tooltip: "Requires matching funds from recipient"
  },
  { 
    value: "Milestone-Based Grant", 
    label: "Milestone-Based Grant", 
    tooltip: "Paid upon achieving specific milestones"
  },
  { 
    value: "Technical Assistance Grant", 
    label: "Technical Assistance Grant", 
    tooltip: "Funding for expertise, training, advisory services"
  }
];

export const fundingCategoryOptions = [
  { 
    value: "Set-Up", 
    label: "Set-Up", 
    tooltip: "Initial costs to establish business operations"
  },
  { 
    value: "Capex", 
    label: "Capex", 
    tooltip: "Long-term assets: equipment, property"
  },
  { 
    value: "Upgrade", 
    label: "Upgrade", 
    tooltip: "Improve existing equipment, systems, capabilities"
  },
  { 
    value: "Expansion", 
    label: "Expansion", 
    tooltip: "Grow into new markets, locations, products"
  },
  { 
    value: "Working Capital", 
    label: "Working Capital", 
    tooltip: "Day-to-day operational expenses"
  },
  { 
    value: "Acquisition", 
    label: "Acquisition", 
    tooltip: "Purchase businesses, franchises, major assets"
  },
  { 
    value: "Business Development", 
    label: "Business Development", 
    tooltip: "Growth opportunities and strategic initiatives"
  },
];

export const subAreaOptions = {
  setup: [{ 
    value: "Feasibility", 
    label: "Feasibility",
    tooltip: "Studies to determine if business idea is viable"
  }],
  upgrade: [
   { 
     value: "Upgrade", 
     label: "Upgrade",
     tooltip: "Modernize current equipment or systems"
   },
    { 
      value: "Expansion", 
      label: "Expansion",
      tooltip: "Increase capacity or capabilities"
    },
  ],
  workingCapital:[{ 
    value: "Bridging Finance", 
    label: "Bridging Finance", 
    tooltip: "Short-term financing for cash flow gaps"
  }],
  acquisition: [
    { 
      value: "Franchise", 
      label: "Franchise",
      tooltip: "Purchase franchise rights and setup"
    },
    { 
      value: "Asset Acquisition", 
      label: "Asset Acquisition",
      tooltip: "Buy specific assets or equipment"
    },
  ],
  businessDevelopment: [
    { 
      value: "Product Design & Development", 
      label: "Product Design & Development",
      tooltip: "Create or improve products and services"
    },
    { 
      value: "Packaging Design & Development", 
      label: "Packaging Design & Development",
      tooltip: "Design and create product packaging"
    },
    { 
      value: "Conformity Assessment Certification", 
      label: "Conformity Assessment Certification", 
      tooltip: "Certification for regulatory standards compliance"
    },
    { 
      value: "IT Systems", 
      label: "IT Systems",
      tooltip: "Computer systems, software, and technology infrastructure"
    },
    { 
      value: "Process Optimisation", 
      label: "Process Optimisation", 
      tooltip: "Improve business process efficiency"
    },
    { 
      value: "Patents", 
      label: "Patents",
      tooltip: "Legal protection for inventions and intellectual property"
    },
    { 
      value: "Logistics", 
      label: "Logistics",
      tooltip: "Supply chain, transportation, and distribution"
    },
    { 
      value: "Sales and Marketing", 
      label: "Sales and Marketing",
      tooltip: "Customer acquisition, advertising, and promotional activities"
    },
    { 
      value: "Post-investment Support", 
      label: "Post-investment Support", 
      tooltip: "Ongoing advisory after investment"
    },
  ],
};

export const barrierOptions = [
  { 
    value: "Skills", 
    label: "Skills",
    tooltip: "Lack of necessary skills or expertise in team"
  },
  { 
    value: "Access to Capital", 
    label: "Access to Capital",
    tooltip: "Difficulty obtaining funding or investment"
  },
  { 
    value: "Market Access", 
    label: "Market Access",
    tooltip: "Challenges reaching customers or entering markets"
  },
  { 
    value: "Systems", 
    label: "Systems",
    tooltip: "Inadequate business systems, processes, or technology"
  },
];

export const profitabilityOptions = [
  { 
    value: "Profitable", 
    label: "Profitable",
    tooltip: "Business is making profit (revenue exceeds expenses)"
  },
  { 
    value: "Breakeven", 
    label: "Breakeven",
    tooltip: "Business covers all costs but makes no profit (revenue = expenses)"
  },
  { 
    value: "Loss-making", 
    label: "Loss-making",
    tooltip: "Business is losing money (expenses exceed revenue)"
  },
];