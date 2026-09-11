import "./UniversalProfile.css"

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

// ==========================================================================
// The following additions implement Developer Brief v1 (29 July 2026),
// "Products & Services Taxonomy — Searchable Offering Category and Dynamic
// Capability Trigger". See Sections 9-13 for source specification.
// ==========================================================================

// Legacy field, retained: still valid for the generic / fallback delivery pattern
// (Section 10, "Facilities & Site Services" and other fallback domains).
export const deliveryModes = ["Onsite", "Virtual", "Hybrid"];

// Section 9.1 — Product delivery role (dropdown value | definition)
export const productDeliveryRoleOptions = [
  { value: "Grow, extract or produce", label: "Grow, extract or produce", definition: "The SME creates the primary raw or agricultural output." },
  { value: "Manufacture", label: "Manufacture", definition: "The SME manufactures the finished or intermediate product." },
  { value: "Fabricate or customise", label: "Fabricate or customise", definition: "The SME produces to drawing, specification or customer order." },
  { value: "Assemble or integrate", label: "Assemble or integrate", definition: "The SME combines components into a finished system." },
  { value: "Import", label: "Import", definition: "The SME imports the product into the market." },
  { value: "Authorised OEM distributor", label: "Authorised OEM distributor", definition: "The SME is formally appointed by the manufacturer." },
  { value: "Wholesale or distribute", label: "Wholesale or distribute", definition: "The SME holds and distributes stock to business customers." },
  { value: "Resell or retail", label: "Resell or retail", definition: "The SME buys and resells finished goods." },
  { value: "Supply and install", label: "Supply and install", definition: "The SME supplies the product and performs installation/commissioning." },
  { value: "Hire or lease", label: "Hire or lease", definition: "The SME retains ownership and provides temporary use." },
  { value: "Agent or broker", label: "Agent or broker", definition: "The SME facilitates supply without necessarily holding stock." },
];

// Section 9.2 — Service operating model (dropdown value | definition)
export const serviceOperatingModelOptions = [
  { value: "Mobile field-service team", label: "Mobile field-service team", definition: "Teams travel to the customer's operating location." },
  { value: "Fixed workshop or repair centre", label: "Fixed workshop or repair centre", definition: "Work is performed at the SME's facility." },
  { value: "Project-based workforce", label: "Project-based workforce", definition: "People and equipment are mobilised for defined projects." },
  { value: "Managed or outsourced service", label: "Managed or outsourced service", definition: "The SME takes responsibility for an ongoing function or SLA." },
  { value: "Professional or specialist team", label: "Professional or specialist team", definition: "Knowledge-led delivery by qualified personnel." },
  { value: "Equipment-enabled service", label: "Equipment-enabled service", definition: "Service output depends materially on owned or hired equipment." },
  { value: "Fixed service facility", label: "Fixed service facility", definition: "Clinic, laboratory, training centre or other service site." },
  { value: "Mobile service facility", label: "Mobile service facility", definition: "Mobile clinic, laboratory, workshop or temporary facility." },
  { value: "Digital platform or remote service", label: "Digital platform or remote service", definition: "Delivery is primarily through software or remote access." },
  { value: "Subcontractor or associate network", label: "Subcontractor or associate network", definition: "Capacity is extended through controlled external providers." },
];

// Section 9.3 — Contract / commercial delivery pattern (multi-select, all offering types)
export const commercialDeliveryPatternOptions = [
  "Once-off sale",
  "Made to stock",
  "Made to order",
  "Custom or project-based",
  "Call-off / purchase order",
  "Recurring service contract",
  "Service-level agreement",
  "Emergency / breakdown response",
  "Subscription",
  "Rental / lease",
  "Outcome- or performance-based contract",
];

// Section 10 — Delivery Standards: dynamic field driven by taxonomy leaf `deliveryPattern`.
// The current Preferred Delivery Mode (Onsite/Virtual/Hybrid) only applies to some services;
// this config swaps in the field label and options appropriate to the offering.
export const deliveryPatternConfig = {
  professional_digital_service: { fieldLabel: "Preferred service channel", options: ["Onsite", "Virtual", "Hybrid"] },
  field_technical_service: { fieldLabel: "Service delivery location", options: ["Customer site", "SME workshop", "Mobile unit", "Hybrid"] },
  physical_product: { fieldLabel: "Fulfilment method", options: ["Customer collection", "SME delivery", "Courier/3PL", "Direct from manufacturer", "Digital delivery"] },
  equipment_hire: { fieldLabel: "Hire arrangement", options: ["Dry hire", "Wet/operated hire", "Maintained hire", "Short-term", "Long-term"] },
  training: { fieldLabel: "Training mode", options: ["In-person at client", "In-person at provider", "Virtual live", "Self-paced", "Blended"] },
  medical_service: { fieldLabel: "Service setting", options: ["Onsite clinic", "Fixed clinic", "Mobile clinic", "Remote consultation", "Emergency response"] },
  construction_project: { fieldLabel: "Mobilisation model", options: ["Local team", "Project mobilisation", "Multi-site teams", "Subcontracted components"] },
  generic_onsite_virtual_hybrid: { fieldLabel: "Preferred Delivery Mode", options: ["Onsite", "Virtual", "Hybrid"] },
};

// Section 10.1 — Lead-time unit dropdown (replaces the previous hours/days/weeks/months list)
export const leadTimeUnitOptions = ["Hours", "Business days", "Calendar days", "Weeks", "Months"];

// Section 10.2 — Geographic delivery coverage
export const geographicCoverageOptions = [
  "Local / within municipality",
  "Provincial",
  "Multiple selected provinces",
  "National",
  "SADC",
  "Rest of Africa",
  "International",
  "Remote / location independent",
];

// Section 11.1 — Industries served. This replaces the old generic Category list from being
// used as an industry proxy (the core bug this brief corrects): Offering Category now
// describes what the SME provides, and this list describes where it can be applied.
export const industriesServedOptions = [
  "Agriculture, forestry & fishing",
  "Mining & quarrying",
  "Manufacturing",
  "Construction & infrastructure",
  "Energy & electricity",
  "Water, waste & environmental services",
  "Transport, logistics & warehousing",
  "Information & communications technology",
  "Financial & insurance services",
  "Real estate, property & facilities",
  "Professional, scientific & technical services",
  "Retail & wholesale",
  "Healthcare & life sciences",
  "Education & training",
  "Hospitality, tourism & leisure",
  "Government & public sector",
  "Non-profit & development sector",
  "General commercial / cross-sector",
  "Other",
];

// Section 11.2 — Customer type
export const customerTypeOptions = [
  "Consumers / individuals",
  "Micro and small businesses",
  "Medium and large corporates",
  "Mines, plants and industrial operators",
  "OEMs and equipment suppliers",
  "Main contractors and EPC/EPCM firms",
  "Distributors and retailers",
  "Government departments and municipalities",
  "State-owned entities",
  "Healthcare or education institutions",
  "Non-profits and development programmes",
  "Other",
];

// Section 11.3 — Mining client application (Application group | Dropdown values), also used
// generically as "Industry application" for the depth-2+ Technical/Process/Full categories.
export const applicationGroups = [
  {
    group: "Production value chain",
    values: ["Exploration", "Mine development", "Production drilling", "Blasting", "Loading", "Hauling", "Mechanical extraction", "Mineral processing", "Product handling"],
  },
  {
    group: "Plant and technical support",
    values: ["Processing plant", "Crushing and screening", "Workshop", "Laboratory", "Control room", "Shutdown/turnaround", "Mobile equipment maintenance"],
  },
  {
    group: "Infrastructure and utilities",
    values: ["Power", "Compressed air", "Water and dewatering", "Ventilation", "Pumping", "Roads", "Rail", "Communications", "Fire protection"],
  },
  {
    group: "People and facilities",
    values: ["Offices", "Stores/warehouse", "Change houses", "Accommodation", "Kitchen/canteen", "Clinic", "Training centre", "Security/access"],
  },
  {
    group: "Environment and closure",
    values: ["Waste", "Tailings", "Water treatment", "Dust control", "Rehabilitation", "Monitoring"],
  },
  {
    group: "General",
    values: ["Site-wide", "Multiple areas", "Not area-specific"],
  },
];

// Section 6.1 — Taxonomy depth rules (used for labelling only; the actual depth per leaf
// lives on the taxonomy node in taxonomyData.js)
export const depthRuleLabels = {
  0: "None — no client operational context adds value",
  1: "Basic — facility or customer setting affects suitability",
  2: "Technical — system, environment or standard affects suitability",
  3: "Process — client operation or process area affects matching",
  4: "Full — inherently part of the sector's production route",
};

// Section 13 — Key Clients / Customers field spec
export const clientTypeOptions = [
  "Private company",
  "Public company",
  "SME",
  "Government",
  "SOE",
  "Non-profit",
  "Individual",
  "Other",
];

export const referencePermissionOptions = [
  "May contact",
  "Ask me first",
  "Do not contact",
];

export const growthPotentialOptions = [
  "High",
  "Medium",
  "Low",
  "Unknown / not assessed",
];