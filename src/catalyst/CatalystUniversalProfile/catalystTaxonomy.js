// catalystTaxonomy.js
// Standard controlled dictionaries for Catalyst Universal Profile as defined in BIG Catalyst Developer Brief v1

export const CATALYST_ACTIVITIES = [
  {
    id: "incubation",
    label: "Incubation",
    description: "Establishes and stabilises viable early-stage businesses.",
  },
  {
    id: "acceleration",
    label: "Acceleration",
    description: "Helps businesses with a working foundation progress faster towards growth, operations, markets, or investment readiness.",
  },
  {
    id: "esd",
    label: "ESD (Enterprise & Supplier Development)",
    description: "Strengthens enterprises, commercial readiness, and develops existing or prospective suppliers towards buyer opportunities.",
  },
]

export const PLATFORM_OBJECTIVES = [
  {
    id: "find_businesses",
    label: "Find suitable businesses",
    description: "Discover and recruit SMEs matching your programme mandates and eligibility criteria.",
  },
  {
    id: "onboard_participants",
    label: "Onboard existing participants",
    description: "Bring current cohort members onto the platform to streamline baseline assessments.",
  },
  {
    id: "diagnose_needs",
    label: "Diagnose support needs",
    description: "Identify binding constraints across the 5Cs to focus developmental interventions.",
  },
  {
    id: "manage_actions",
    label: "Manage actions",
    description: "Agree upon implementation roadmaps and monitor milestone delivery.",
  },
  {
    id: "track_outcomes",
    label: "Track outcomes",
    description: "Measure economic impact, job creation, revenue changes, and graduation results.",
  },
  {
    id: "connect_opportunities",
    label: "Connect businesses to next opportunities",
    description: "Elevate graduates to buyers, investors, funders, and commercial pipelines.",
  },
]

export const ORGANISATION_TYPES = [
  { value: "independent_provider", label: "Independent enterprise-support provider" },
  { value: "corporate_business", label: "Corporate / Business" },
  { value: "university_higher_ed", label: "University / Higher education" },
  { value: "other_education", label: "Other education / Training" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "government_public", label: "Government / Public institution" },
  { value: "other", label: "Other (specify)" },
]

export const ORGANISATIONAL_ARRANGEMENTS = [
  { value: "standalone", label: "Standalone Organisation" },
  { value: "unit_within_parent", label: "Unit / Department / Initiative within a Parent Organisation" },
]

export const LEGAL_ENTITIES_SA = [
  { value: "pty_ltd", label: "Private Company ((Pty) Ltd)" },
  { value: "public_ltd", label: "Public Company (Ltd)" },
  { value: "npc", label: "Nonprofit Company (NPC)" },
  { value: "close_corporation", label: "Close Corporation (CC - Legacy)" },
  { value: "sole_proprietor", label: "Sole Proprietor" },
  { value: "partnership", label: "Partnership" },
  { value: "cooperative", label: "Cooperative" },
  { value: "trust", label: "Trust" },
  { value: "statutory_institution", label: "Statutory / Public Institution" },
  { value: "other", label: "Other (specify)" },
]

export const REGISTRATION_IDENTIFIER_TYPES = [
  { value: "company_cc", label: "Company / Close Corporation Number" },
  { value: "cooperative", label: "Cooperative Number" },
  { value: "trust", label: "Trust Reference Number" },
  { value: "statutory", label: "Statutory Reference / Act" },
  { value: "other", label: "Other Official Identifier" },
  { value: "no_identifier", label: "No Separate Identifier (Hosted Unit / Exempt)" },
]

export const COMPANY_SIZES = [
  { value: "1", label: "1 (Solo Lead)" },
  { value: "2-10", label: "2–10 staff" },
  { value: "11-50", label: "11–50 staff" },
  { value: "51-200", label: "51–200 staff" },
  { value: "201-500", label: "201–500 staff" },
  { value: "501+", label: "501+ staff" },
  { value: "undisclosed", label: "Prefer not to disclose" },
]

export const INDUSTRY_SECTORS_CATALYST = [
  { value: "enterprise_support", label: "Enterprise Support & Incubation" },
  { value: "education_research", label: "Education & Research / Higher Ed" },
  { value: "professional_services", label: "Professional Services & Consulting" },
  { value: "public_admin", label: "Public Administration & Government" },
  { value: "nonprofit_sector", label: "Nonprofit & Social Development" },
  { value: "agriculture", label: "Agriculture, Forestry & Agribusiness" },
  { value: "banking_finance", label: "Banking, Finance & Insurance" },
  { value: "construction", label: "Construction & Infrastructure" },
  { value: "energy", label: "Energy, Renewables & Utilities" },
  { value: "healthcare", label: "Healthcare & Life Sciences" },
  { value: "information_tech", label: "Information Technology (IT) & Digital" },
  { value: "logistics_supply_chain", label: "Logistics & Supply Chain" },
  { value: "manufacturing", label: "Manufacturing & Engineering" },
  { value: "mining", label: "Mining & Resources" },
  { value: "retail_wholesale", label: "Retail & Wholesale" },
  { value: "other", label: "Other" },
]

export const HOW_DID_YOU_HEAR = [
  { value: "referral", label: "Referral / Word of mouth" },
  { value: "search", label: "Search engine" },
  { value: "social_media", label: "Social media" },
  { value: "event", label: "Conference / Event" },
  { value: "partner", label: "Partner organisation" },
  { value: "other", label: "Other (specify)" },
]

export const SALUTATION_TITLES = [
  { value: "Mr", label: "Mr" },
  { value: "Ms", label: "Ms" },
  { value: "Mrs", label: "Mrs" },
  { value: "Dr", label: "Dr" },
  { value: "Prof", label: "Prof" },
  { value: "Other", label: "Other" },
  { value: "undisclosed", label: "Prefer not to specify" },
]

export const CONTACT_RESPONSIBILITIES = [
  { id: "account_admin", label: "Account administration" },
  { id: "leadership", label: "Leadership & Strategy" },
  { id: "partnerships", label: "Partnerships & Funder relations" },
  { id: "programme_coord", label: "Programme coordination" },
  { id: "monitoring_reporting", label: "Monitoring & reporting" },
  { id: "finance", label: "Finance & Contracting" },
  { id: "other", label: "Other" },
]

export const PREFERRED_CONTACT_METHODS = [
  { value: "email", label: "Email" },
  { value: "telephone", label: "Telephone" },
  { value: "whatsapp", label: "WhatsApp" },
]

export const PUBLIC_ENQUIRY_OPTIONS = [
  { value: "general", label: "General organisation enquiry contact" },
  { value: "primary", label: "Primary contact" },
  { value: "another", label: "Another designated contact" },
  { value: "none", label: "No public contact (Private)" },
]

export const PUBLIC_LOCATION_VISIBILITY = [
  { value: "country_only", label: "Country only" },
  { value: "city_region", label: "City / Region (Default Recommended)" },
  { value: "full_address", label: "Full physical address" },
  { value: "hidden", label: "Hidden" },
]

export const SOUTH_AFRICAN_PROVINCES = [
  { value: "Eastern Cape", label: "Eastern Cape" },
  { value: "Free State", label: "Free State" },
  { value: "Gauteng", label: "Gauteng" },
  { value: "KwaZulu-Natal", label: "KwaZulu-Natal" },
  { value: "Limpopo", label: "Limpopo" },
  { value: "Mpumalanga", label: "Mpumalanga" },
  { value: "Northern Cape", label: "Northern Cape" },
  { value: "North West", label: "North West" },
  { value: "Western Cape", label: "Western Cape" },
]

// ─── Programme Setup Taxonomies (Package 3) ───────────────────────────────────

export const PROGRAMME_TYPES = [
  {
    id: "incubator",
    label: "Incubator",
    badgeColor: "#8d6e63",
    description: "Establishes and stabilises viable early-stage businesses.",
  },
  {
    id: "accelerator",
    label: "Accelerator",
    badgeColor: "#6d4c41",
    description: "Helps businesses with a working foundation progress faster towards growth, markets, or investment readiness.",
  },
  {
    id: "ed",
    label: "Enterprise Development (ED)",
    badgeColor: "#5d4037",
    description: "Strengthens enterprises and commercial readiness, including businesses not yet ready for a particular supply chain.",
  },
  {
    id: "sd",
    label: "Supplier Development (SD)",
    badgeColor: "#4e342e",
    description: "Develops existing or prospective suppliers towards a defined buyer procurement opportunity.",
  },
  {
    id: "esd",
    label: "Combined ESD",
    badgeColor: "#3e2723",
    description: "Combines ED and SD pathways using sequential progression or parallel specialized tracks.",
  },
]

export const PRIMARY_MANDATES_BY_TYPE = {
  incubator: [
    { value: "business_formation", label: "Business formation & launch" },
    { value: "survival_stabilisation", label: "Survival & operational stabilisation" },
    { value: "local_development", label: "Local / Regional community development" },
    { value: "inclusion", label: "Inclusion & underserved founder enablement" },
    { value: "tech_commercialisation", label: "Technology & research commercialisation" },
    { value: "other", label: "Other (specify)" },
  ],
  accelerator: [
    { value: "commercial_growth", label: "Commercial revenue growth" },
    { value: "product_market_fit", label: "Product-market validation" },
    { value: "market_expansion", label: "Market & geographic expansion" },
    { value: "operational_scaling", label: "Operational scaling & systems" },
    { value: "investment_readiness", label: "Investment & equity readiness" },
    { value: "other", label: "Other (specify)" },
  ],
  ed: [
    { value: "enterprise_strengthening", label: "Enterprise strengthening & formalisation" },
    { value: "commercial_readiness", label: "Commercial compliance & readiness" },
    { value: "market_access", label: "Broad market access" },
    { value: "early_supplier_pipeline", label: "Early supplier-readiness pipeline" },
    { value: "local_industrial_development", label: "Local industrial & community development" },
    { value: "other", label: "Other (specify)" },
  ],
  sd: [
    { value: "existing_supplier_perf", label: "Existing supplier performance improvement" },
    { value: "prospective_supplier_dev", label: "Prospective supplier development for confirmed opportunity" },
    { value: "capacity_expansion", label: "Capacity & volume expansion" },
    { value: "category_development", label: "Target procurement category development" },
    { value: "supply_chain_resilience", label: "Supply chain resilience & diversification" },
    { value: "other", label: "Other (specify)" },
  ],
  esd: [
    { value: "ed_to_sd_pipeline", label: "ED-to-SD sequential progression pipeline" },
    { value: "parallel_ed_sd", label: "Parallel ED and SD specialised tracks" },
    { value: "other", label: "Other combined pathway (specify)" },
  ],
}

export const ESD_TRACK_STRUCTURES = [
  { value: "sequential", label: "Sequential: Progression from ED to SD track upon meeting milestones" },
  { value: "parallel", label: "Parallel: Concurrent distinct tracks with independent criteria" },
]

export const SPONSOR_SOURCES = [
  { id: "corporate", label: "Corporate Sponsor / Enterprise Client" },
  { id: "government", label: "Government / Public Agency" },
  { id: "university", label: "University / Academic Institution" },
  { id: "donor", label: "Donor / Philanthropic Foundation" },
  { id: "investor", label: "Private Investor / Fund" },
  { id: "participant_funded", label: "Participant-funded (Self-funded)" },
  { id: "operator_funded", label: "Operator-funded (Internal budget)" },
  { id: "other", label: "Other funding source" },
]

export const SPONSOR_REPORTING_PRIORITIES = [
  { id: "participation", label: "Participation & attendance metrics" },
  { id: "support_delivered", label: "Support hours & services delivered" },
  { id: "spend", label: "Budget allocation & spend efficiency" },
  { id: "jobs", label: "Job retention & new jobs created" },
  { id: "inclusion", label: "Transformation & diversity metrics (B-BBEE / Youth / Women)" },
  { id: "growth", label: "Revenue growth & commercial traction" },
  { id: "supplier_perf", label: "Supplier delivery performance & SLA compliance" },
  { id: "research_comm", label: "Research commercialisation & IP outputs" },
  { id: "esg", label: "ESG & environmental sustainability outcomes" },
  { id: "other", label: "Other customized metrics" },
]

export const PROGRAMME_DURATIONS = [
  { value: "fixed", label: "Fixed duration (Weeks / Months / Years)" },
  { value: "milestone_based", label: "Milestone-based (Exit upon milestone completion)" },
  { value: "open_ended", label: "Open-ended / Ongoing support" },
]

export const PROGRAMME_FORMATS = [
  { value: "fixed_cohort", label: "Fixed Cohort (Structured intake, joint curriculum)" },
  { value: "rolling_individual", label: "Rolling Individual (Continuous intake, bespoke pacing)" },
  { value: "open_incubation", label: "Open-ended Incubation (Resident hub participation)" },
  { value: "short_intervention", label: "Short Intensive Intervention (Bootcamp / Sprint)" },
  { value: "other", label: "Other format" },
]

export const DELIVERY_MODES = [
  { value: "hybrid", label: "Hybrid (In-person sessions + Digital tools)" },
  { value: "in_person", label: "In Person (On-site attendance required)" },
  { value: "online", label: "Online / Remote (Virtual delivery only)" },
]

export const INTAKE_METHODS = [
  { value: "open_applications", label: "Open Public Applications (Discoverable on BIG Marketplace)" },
  { value: "invitation", label: "By Invitation Only" },
  { value: "referral", label: "Partner / Buyer Referral" },
  { value: "existing_participants", label: "Existing Organisation Participants Only" },
  { value: "mixed", label: "Mixed (Open applications + Direct invitations)" },
]

export const INTAKE_STATUSES = [
  { value: "open", label: "Open for Applications", badgeColor: "#2e7d32" },
  { value: "upcoming", label: "Upcoming (Opening Soon)", badgeColor: "#1565c0" },
  { value: "waitlist", label: "Waitlist Only", badgeColor: "#ef6c00" },
  { value: "closed", label: "Applications Closed", badgeColor: "#757575" },
  { value: "not_recruiting", label: "Not Recruiting (Active Delivery)", badgeColor: "#424242" },
]

export const PARTICIPATION_COST_MODELS = [
  { value: "free_sponsored", label: "Free / Fully Sponsored (No financial cost to SME)" },
  { value: "subsidised", label: "Partially Subsidised (Co-payment required)" },
  { value: "fee_paying", label: "Fee-Paying (Standard commercial fee)" },
  { value: "equity", label: "Equity Consideration (Shares or SAFE)" },
  { value: "fee_plus_equity", label: "Fee plus Equity" },
  { value: "other", label: "Other arrangement" },
]

export const DIAGNOSTIC_APPROACHES = [
  { value: "big_diagnostic", label: "BIG Marketplace Standard Diagnostic (5Cs Framework)" },
  { value: "catalyst_diagnostic", label: "Proprietary Catalyst Diagnostic Assessment" },
  { value: "combined", label: "Combined: Baseline with BIG Diagnostic + Catalyst in-depth review" },
]

export const REVIEW_FREQUENCIES = [
  { value: "weekly", label: "Weekly check-ins" },
  { value: "fortnightly", label: "Fortnightly (Every two weeks)" },
  { value: "monthly", label: "Monthly milestone review" },
  { value: "quarterly", label: "Quarterly performance review" },
  { value: "milestone_based", label: "Milestone-triggered review" },
]

export const ACTION_ACCOUNTABILITIES = [
  { id: "founder", label: "Founder / Entrepreneur (Primary executor)" },
  { id: "manager", label: "Key Operational Manager" },
  { id: "mentor", label: "Assigned Mentor / Advisor" },
  { id: "catalyst_lead", label: "Catalyst Programme Lead" },
  { id: "corporate_sponsor", label: "Corporate Sponsor Category Specialist" },
]

export const INTENDED_BUSINESS_OUTCOMES = [
  { id: "first_sales", label: "First Commercial Sales" },
  { id: "revenue_growth", label: "Accelerated Monthly Revenue" },
  { id: "gross_margin", label: "Improved Gross & Operating Margins" },
  { id: "repeat_customers", label: "Customer Retention & Repeat Orders" },
  { id: "job_creation", label: "Sustainable Job Creation" },
  { id: "statutory_compliance", label: "Statutory & Tax Compliance Readiness" },
  { id: "quality_systems", label: "Quality, Safety & Operational Standards" },
  { id: "contract_delivery", label: "Supply Chain Contract Delivery & Fulfillment" },
  { id: "capital_raised", label: "Equity or Debt Financing Secured" },
  { id: "commercialised_ip", label: "Patented / Commercialised Technology" },
]

export const NEXT_STAGE_DESTINATIONS = [
  { id: "independent_trading", label: "Sustained Independent Trading" },
  { id: "accelerator", label: "Advanced Growth Accelerator" },
  { id: "ed_track", label: "Enterprise Development (ED) Pipeline" },
  { id: "sd_procurement", label: "Supplier Development (SD) / Corporate Procurement" },
  { id: "funding_round", label: "External Equity / Debt Funding Round" },
  { id: "export_markets", label: "Cross-Border / Export Market Expansion" },
]

// ─── 5Cs Service Catalogue ───────────────────────────────────────────────────

export const FIVE_CS_SERVICE_CATALOGUE = {
  credibility: {
    label: "Credibility",
    description: "Formalisation, statutory compliance, corporate governance, and verification readiness.",
    subtypes: [
      { id: "registration_support", label: "CIPC & Entity Formalisation Support" },
      { id: "tax_compliance", label: "Tax Compliance & PIN PIN Readiness" },
      { id: "bbbee_verification", label: "B-BBEE Affidavit / Certificate Preparation" },
      { id: "governance_policies", label: "Board, Governance & Operating Policies" },
      { id: "bookkeeping_records", label: "Accounting Software & Recordkeeping Setup" },
      { id: "pitch_capability", label: "Capability Statement & Profile Polish" },
      { id: "audit_prep", label: "Financial Statement & Audit Preparation" },
    ],
  },
  customers: {
    label: "Customers",
    description: "Market validation, sales pipeline, buyer introductions, and procurement readiness.",
    subtypes: [
      { id: "customer_validation", label: "Problem-Solution & Customer Discovery Interviews" },
      { id: "sales_process", label: "B2B Sales Process & Funnel Optimization" },
      { id: "buyer_introductions", label: "Direct Corporate Buyer Introductions" },
      { id: "procurement_tenders", label: "Tender / RFP Preparation & Bid Support" },
      { id: "market_expansion", label: "Regional / Export Market Distribution Channels" },
      { id: "offtake_agreements", label: "Commercial Contracts & Offtake Structuring" },
    ],
  },
  capability: {
    label: "Capability",
    description: "Operating procedures, digital tools, quality standards, and product engineering.",
    subtypes: [
      { id: "sops_processes", label: "Standard Operating Procedures (SOPs)" },
      { id: "digital_systems", label: "Digital Tools & ERP / CRM Implementation" },
      { id: "quality_standards", label: "Quality Standards (ISO, SABS, HACCP)" },
      { id: "product_dev", label: "Product Engineering & Prototyping" },
      { id: "facility_access", label: "Specialised Lab / Incubation Facility Access" },
      { id: "equipment_access", label: "Shared Machinery & Equipment Provision" },
    ],
  },
  capacity: {
    label: "Capacity",
    description: "Founder leadership skills, management depth, specialized advice, and workforce readiness.",
    subtypes: [
      { id: "founder_skills", label: "Entrepreneurial Executive Leadership Training" },
      { id: "management_dev", label: "Middle Management Leadership Development" },
      { id: "specialist_advisory", label: "Specialist Functional Advisory (Legal, Tax, IP)" },
      { id: "talent_interns", label: "Student Interns & Talent Placement" },
      { id: "workforce_upskilling", label: "Frontline Workforce Technical Upskilling" },
    ],
  },
  capital: {
    label: "Capital",
    description: "Financial modeling, funding readiness, funder matchmaking, and direct capital deployment.",
    subtypes: [
      { id: "financial_modeling", label: "Financial Modeling & Cash Flow Forecasting" },
      { id: "investment_readiness", label: "Due Diligence Data Vault & Investment Teaser" },
      { id: "funder_introductions", label: "Curated Investor & DFIs Introductions" },
      { id: "grant_application", label: "Grant Application & Proposal Writing" },
      { id: "direct_grant", label: "Direct Grant / Seed Capital Disbursed" },
      { id: "direct_debt", label: "Direct Working Capital / PO Loan Financing" },
      { id: "direct_equity", label: "Direct Equity / Convertible Investment" },
    ],
  },
}

export const LIFECYCLE_STAGES_CATALYST = [
  { id: "idea", label: "Idea Stage", description: "Concept development and market hypothesis" },
  { id: "prototype_pre_launch", label: "Prototype / Pre-Launch", description: "MVP or prototype built, testing with pilot users" },
  { id: "early_trading", label: "Early Trading", description: "First commercial sales with early paying customers" },
  { id: "established", label: "Established", description: "Consistent operating history and proven product-market fit" },
  { id: "scaling", label: "Scaling", description: "Rapid growth, expanding operations, and multiple market channels" },
]

export const MATCHING_RULES = [
  { value: "must_meet", label: "Must meet at entry (Hard requirement)", badgeColor: "#c62828" },
  { value: "preferred", label: "Preferred (Improves fit, not disqualifying)", badgeColor: "#1565c0" },
  { value: "we_help_achieve", label: "We help achieve this (Development outcome)", badgeColor: "#2e7d32" },
  { value: "not_relevant", label: "Not relevant (Ignored)", badgeColor: "#757575" },
]

export const SELECTION_STAGES = [
  { id: "screening", label: "Initial Eligibility Screening" },
  { id: "profile_review", label: "Universal Profile & Vault Review" },
  { id: "diagnostic", label: "5Cs Diagnostic & Binding Constraint Assessment" },
  { id: "interview", label: "Leadership & Founder Interview" },
  { id: "pitch", label: "Commercial Pitch Presentation" },
  { id: "site_visit", label: "Physical Facility / Operational Site Visit" },
  { id: "technical_assessment", label: "Technical & Quality Capability Review" },
  { id: "panel", label: "Selection Panel / Committee Evaluation" },
  { id: "other", label: "Other Custom Stage" },
]

export const REQUIRED_DOCUMENT_TYPES = [
  { id: "profile_summary", label: "Verified Universal Profile Snapshot" },
  { id: "registration_cipc", label: "CIPC Company Registration / Constitution" },
  { id: "proof_of_address", label: "Proof of Business Physical Address" },
  { id: "tax_clearance", label: "SARS Tax Compliance Status PIN" },
  { id: "bbbee_evidence", label: "B-BBEE Affidavit or Verification Certificate" },
  { id: "financial_statements", label: "Annual Financial Statements / Management Accounts" },
  { id: "bank_confirmation", label: "Bank Confirmation Letter" },
  { id: "pitch_deck", label: "Pitch Deck / Capability Presentation" },
  { id: "commercial_contracts", label: "Customer Orders / Supplier Contracts Track Record" },
  { id: "technical_permits", label: "Sector Regulatory Permits / Licenses" },
  { id: "leadership_cvs", label: "Founders & Key Personnel CVs" },
  { id: "safeguarding_policy", label: "Safeguarding & Governance Policy" },
]

export const DOCUMENT_TIMING = [
  { value: "application", label: "At Application Submission" },
  { value: "shortlisting", label: "Upon Shortlisting" },
  { value: "admission", label: "Prior to Final Admission" },
  { value: "before_support", label: "Before Specific Disbursal / Support Action" },
]

export const EVIDENCE_RULES = [
  { value: "required", label: "Required (Blocks stage advancement)" },
  { value: "optional", label: "Optional (Supplementary)" },
  { value: "conditional", label: "Conditional on declared trigger" },
]

// ─── Default BIG Score 5 Components per Stage ─────────────────────────────────

export const DEFAULT_STAGE_WEIGHTS_CATALYST = {
  startup: {
    compliance: 30,
    legitimacy: 25,
    governanceLeadership: 20,
    operational: 15,
    valueCreation: 10,
  },
  growth: {
    compliance: 25,
    legitimacy: 20,
    governanceLeadership: 20,
    operational: 20,
    valueCreation: 15,
  },
  scaling: {
    compliance: 20,
    legitimacy: 15,
    governanceLeadership: 20,
    operational: 25,
    valueCreation: 20,
  },
  turnaround: {
    compliance: 25,
    legitimacy: 20,
    governanceLeadership: 25,
    operational: 20,
    valueCreation: 10,
  },
  mature: {
    compliance: 20,
    legitimacy: 15,
    governanceLeadership: 20,
    operational: 25,
    valueCreation: 20,
  },
}

export const SCORE_COMPONENTS_INFO = [
  {
    id: "compliance",
    label: "Compliance & Statutory",
    tooltip: "Legal structure, tax standing, regulatory licenses, and employment compliance.",
  },
  {
    id: "legitimacy",
    label: "Legitimacy & Market Standing",
    tooltip: "Operating history, brand assets, track record, and commercial authenticity.",
  },
  {
    id: "governanceLeadership",
    label: "Leadership & Governance",
    tooltip: "Management depth, executive decision-making rules, and board oversight.",
  },
  {
    id: "operational",
    label: "Operational Strength",
    tooltip: "Production capacity, systems, value chain risk, and delivery reliability.",
  },
  {
    id: "valueCreation",
    label: "Value Creation & Sustainability",
    tooltip: "Commercial model, gross margins, cash sustainability, and revenue durability.",
  },
]

// ─── Organisation Document Vault Taxonomies (Package 5) ─────────────────────

export const ORGANISATION_DOCUMENT_TYPES = [
  {
    id: "identity_evidence",
    label: "Legal Existence / Registration Evidence",
    category: "Legal & Incorporation",
    required: true,
    tooltip: "Official certificate proving legal incorporation (CIPC registration, Trust Deed, Statutory Act, or Cooperative certificate).",
    formats: ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  },
  {
    id: "parent_identity_evidence",
    label: "Parent Organisation Legal Evidence",
    category: "Hosted / Parent Affiliation",
    required: false,
    isConditionalHosted: true,
    tooltip: "Legal existence document for the parent institution (e.g. university or corporate parent) under which this unit operates.",
    formats: ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  },
  {
    id: "authority_representation",
    label: "Authority to Represent / Delegation Letter",
    category: "Leadership & Authority",
    required: false,
    isConditionalHosted: true,
    tooltip: "Official appointment letter, delegation of authority, or board resolution empowering hub leadership to act on behalf of the organisation.",
    formats: ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  },
  {
    id: "nonprofit_evidence",
    label: "Nonprofit / Public Benefit Organisation (PBO) Evidence",
    category: "Nonprofit Credentials",
    required: false,
    isConditionalNPO: true,
    tooltip: "Official NPO certificate, section 18A PBO approval letter from SARS, or NPC constitution.",
    formats: ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  },
  {
    id: "tax_clearance",
    label: "SARS Tax Compliance Status PIN / Certificate",
    category: "Statutory Compliance",
    required: true,
    tooltip: "Active Tax Compliance Status (TCS) PIN letter or valid Tax Clearance Certificate.",
    formats: ".pdf,.jpg,.jpeg,.png",
  },
  {
    id: "bbbee_evidence",
    label: "B-BBEE Certificate or Sworn Affidavit",
    category: "B-BBEE Transformation",
    required: false,
    tooltip: "Valid SANAS-accredited B-BBEE verification certificate or signed CIPC/DTI sworn affidavit.",
    formats: ".pdf,.jpg,.jpeg,.png",
  },
  {
    id: "capability_statement",
    label: "Organisation Capability Statement / Profile Deck",
    category: "Institutional Profile",
    required: false,
    tooltip: "Comprehensive overview deck or brochure detailing team credentials, track record, enterprise support capacity, and facilities.",
    formats: ".pdf,.doc,.docx,.ppt,.pptx",
  },
]

export const DOCUMENT_REVIEW_STATES = {
  missing: {
    id: "missing",
    label: "Missing",
    color: "#757575",
    bg: "#f5f5f5",
    border: "#e0e0e0",
  },
  uploaded: {
    id: "uploaded",
    label: "Uploaded (Pending Review)",
    color: "#1565c0",
    bg: "#e3f2fd",
    border: "#90caf9",
  },
  under_review: {
    id: "under_review",
    label: "Under Review",
    color: "#e65100",
    bg: "#fff3e0",
    border: "#ffb74d",
  },
  accepted: {
    id: "accepted",
    label: "Accepted",
    color: "#2e7d32",
    bg: "#e8f5e9",
    border: "#81c784",
  },
  clarification_required: {
    id: "clarification_required",
    label: "Clarification Required",
    color: "#f57f17",
    bg: "#fffde7",
    border: "#fff59d",
  },
  rejected: {
    id: "rejected",
    label: "Rejected",
    color: "#c62828",
    bg: "#ffebee",
    border: "#ef9a9a",
  },
  expired: {
    id: "expired",
    label: "Expired",
    color: "#d84315",
    bg: "#fbe9e7",
    border: "#ffab91",
  },
  not_applicable: {
    id: "not_applicable",
    label: "Not Applicable",
    color: "#616161",
    bg: "#eeeeee",
    border: "#e0e0e0",
  },
}

export const AUTHORITY_DOCUMENT_TYPES = [
  { value: "authorisation_letter", label: "Official Authorisation Letter" },
  { value: "board_resolution", label: "Board / Executive Resolution" },
  { value: "delegation_appointment", label: "Delegation of Authority / Appointment Letter" },
  { value: "power_of_attorney", label: "Power of Attorney" },
  { value: "other", label: "Other Official Delegated Instrument" },
]

export const BBBEE_AFFIDAVIT_TYPES = [
  { value: "sworn_affidavit_eme", label: "Sworn Affidavit — Exempted Micro Enterprise (EME, Turnover ≤ R10m)" },
  { value: "sworn_affidavit_qse", label: "Sworn Affidavit — Qualifying Small Enterprise (QSE, Turnover R10m–R50m)" },
  { value: "sanas_certificate", label: "SANAS-Accredited Verification Certificate" },
  { value: "exempt", label: "Exempt / Non-Applicable" },
]

// ─── Declaration & Governance Taxonomies (Package 6) ────────────────────────

export const ORGANISATION_LISTING_VISIBILITY = [
  {
    value: "members",
    label: "Members Only (Visible to logged-in businesses & verified partners)",
    description: "Your hub and open programmes are discoverable by registered SMEs and platform members.",
  },
  {
    value: "public",
    label: "Public (Discoverable on open marketplace & search engines)",
    description: "Maximum visibility: public web profile, indexed in external search, and listed on open directories.",
  },
  {
    value: "private_invitation",
    label: "Private / Invitation Only (Unlisted profile)",
    description: "Profile is hidden from directories; applicants must be sent a direct invitation link.",
  },
]

export const ONBOARDING_RELATIONSHIPS = [
  {
    value: "self_managed",
    label: "Self-Managed (Internal Catalyst Team)",
    description: "Account and programmes are managed directly by authorized full-time hub staff.",
  },
  {
    value: "authorised_third_party",
    label: "Managed by Authorised Third Party (e.g. CMF or Advisory Partner)",
    description: "An accredited Capital Market Facilitator, sponsor manager, or advisory firm manages this profile on your behalf.",
  },
]

export const THIRD_PARTY_ACCESS_SCOPES = [
  {
    value: "profile_edits",
    label: "Organisation Profile & Entity Details",
    description: "Permission to edit legal descriptions, contacts, and public branding.",
  },
  {
    value: "verification_docs",
    label: "Verification Documents & Compliance Vault",
    description: "Permission to upload, renew, and manage institutional compliance files.",
  },
  {
    value: "programme_setup",
    label: "Programme Setup & Scoring Configuration",
    description: "Permission to create cohorts, modify 5Cs support catalogues, and customize scoring weights.",
  },
  {
    value: "applications",
    label: "Applicant Pipeline & Selection Reviews",
    description: "Permission to review incoming SME applications, scoring reports, and move applicants through pipeline stages.",
  },
]


