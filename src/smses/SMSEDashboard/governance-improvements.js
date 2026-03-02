// ============================================================
// IMPROVED GOVERNANCE SCORING SYSTEM
// Fixes: hallucination, score ceiling, data-bound recommendations
// ============================================================

// ─────────────────────────────────────────────────────────────
// 1. EXTRACT ALL AVAILABLE DATA FROM YOUR UNIVERSAL PROFILE
//    This becomes the "source of truth" for the AI prompt
// ─────────────────────────────────────────────────────────────
const buildProfileSummary = (profileData) => {
  const gov = profileData?.governance || {};
  const legal = profileData?.legalCompliance || {};
  const enterprise = profileData?.enterpriseReadiness || {};
  const ownership = profileData?.ownershipManagement || {};
  const financial = profileData?.financialOverview || {};
  const entity = profileData?.entityOverview || {};
  const social = profileData?.socialImpact || {};
  const growth = profileData?.growthPotential || {};
  const useOfFunds = profileData?.useOfFunds || {};
  const docs = profileData?.documents || {};
  const verification = profileData?.verification || {};

  // ── Policies (17 tracked items) ──
  const POLICY_KEYS = [
    "employmentContract", "nda", "mou", "suppliercontract",
    "codeOfConduct", "leavePolicy", "disciplinaryPolicy",
    "healthSafetyPolicy", "privacyPolicy", "remoteWorkPolicy",
    "conflictInterestPolicy", "ipProtection", "socialMediaPolicy",
    "expensePolicy", "overtimePolicy", "terminationPolicy", "performancePolicy"
  ];
  const checklist = legal?.complianceChecklist || {};
  const policiesCompleted = POLICY_KEYS.filter(k => checklist[k] === true);
  const policiesMissing = POLICY_KEYS.filter(k => !checklist[k]);

  // ── Document verification statuses ──
  const docStatuses = {
    bbbeeCert: verification?.["B-BBEE Certificate"]?.status,
    taxClearance: verification?.taxClearanceCert?.status,
    companyProfile: verification?.companyProfile?.status,
    shareRegister: verification?.shareRegister?.status,
    registrationCert: verification?.registrationCertificate?.status,
    auditedFinancials: verification?.auditedFinancials?.status,
    financialStatements: verification?.financialStatements?.status,
    proofOfAddress: verification?.proofOfAddress?.status,
    pitchDeck: verification?.pitchDeck?.status,
    businessPlan: verification?.businessPlan?.status,
    guaranteeContract: verification?.guaranteeContract?.status,
    vatCertificate: verification?.vatCertificate?.status,
    coida: verification?.["COIDA Letter of Good Standing"]?.status,
    companyLetterhead: verification?.companyLetterhead?.status,
    certifiedIds: verification?.certifiedIds?.status,
    idPassport: verification?.["IDs of Directors & Shareholders"]?.status,
  };

  // ── Directors ──
  const directors = ownership?.directors || [];
  const directorSummary = directors.map((d, i) => ({
    index: i,
    name: d.name,
    position: d.position,
    cvStatus: d.cv?.status || "not_uploaded",
    gender: d.gender,
    race: d.race,
    isYouth: d.isYouth,
    isDisabled: d.isDisabled,
    nationality: d.nationality,
    execType: d.execType,
  }));

  // ── Growth potential (8 flags) ──
  const growthFlags = {
    employment: growth?.employment === "yes",
    empowerment: growth?.empowerment === "yes",
    greenTech: growth?.greenTech === "yes",
    localisation: growth?.localisation === "yes",
    marketShare: growth?.marketShare === "yes",
    personalRisk: growth?.personalRisk === "yes",
    qualityImprovement: growth?.qualityImprovement === "yes",
    regionalSpread: growth?.regionalSpread === "yes",
  };

  // ── Governance checklist (19 items from governance section) ──
  const govChecklist = gov?.governanceChecklist || {};
// Helper: checklist value takes priority over standalone field
const fromChecklist = (checklistKey, fallbackField) => 
  govChecklist[checklistKey] === true ? "Yes" : 
  govChecklist[checklistKey] === false ? "No" : 
  fallbackField;
  return {
    // Entity basics
    entity: {
      name: entity?.registeredName,
      type: entity?.entityType,
      legalStructure: entity?.legalStructure,
      operationStage: entity?.operationStage,
      sector: entity?.economicSectors?.[0],
      yearsInOperation: entity?.yearsInOperation,
      employeeCount: entity?.employeeCount,
      province: entity?.province,
    },

    // Financial overview
    financial: {
      annualRevenue: financial?.annualRevenue,
      existingDebt: financial?.existingDebt,
      profitabilityStatus: financial?.profitabilityStatus,
      financialsAudited: financial?.financialsAudited,
      booksUpToDate: financial?.booksUpToDate,
      hasAccountingSoftware: financial?.hasAccountingSoftware,
      hasCreditReport: financial?.hasCreditReport,
      generatesRevenue: financial?.generatesRevenue,
    },

    // Legal & compliance
    legal: {
      cipcStatus: legal?.cipcStatus,
      bbbeeLevel: legal?.bbbeeLevel,
      bbbeeCertRenewalDate: legal?.bbbeeCertRenewalDate,
      taxNumber: legal?.taxNumber,
      vatNumber: legal?.vatNumber,
      uifStatus: legal?.uifStatus,
      coidaNumber: legal?.coidaNumber,
      payeNumber: legal?.payeNumber,
      pinExpiryDate: legal?.pinExpiryDate,
      hasEthicsPolicy: legal?.hasEthicsPolicy,
      hasConflictResolution: legal?.hasConflictResolution,
      hasAdvisoryStructure: legal?.hasAdvisoryStructure,
      hasPolicyControls: legal?.hasPolicyControls,
      ethicsTrainingFrequency: legal?.ethicsTrainingFrequency,
      lastEthicsTrainingDate: legal?.lastEthicsTrainingDate,
      industryAccreditations: legal?.industryAccreditations,
    },

    // Governance section
    governance: {
  // These appear in BOTH checklist and standalone — checklist wins
  hasWhistleblowingPolicy: fromChecklist('whistleblowingPolicy', gov?.hasWhistleblowingPolicy),
  hasEthicsPolicy: fromChecklist('ethicsPolicy', gov?.hasEthicsPolicy),
  hasConflictResolution: fromChecklist('conflictInterestPolicy', gov?.hasConflictResolution),

  // These only appear as standalone fields
  hasAdvisoryStructure: gov?.hasAdvisoryStructure,
  hasPolicyControls: gov?.hasPolicyControls,
  ethicsTrainingFrequency: gov?.ethicsTrainingFrequency,
  lastEthicsTrainingDate: gov?.lastEthicsTrainingDate,
  complianceProcedures: gov?.complianceProcedures,
  performanceReviewCycle: gov?.performanceReviewCycle?.[0] || gov?.performanceReviewCycle,
  stakeholderReportingFrequency: gov?.stakeholderReportingFrequency,
 stakeholderCommunicationMethods: gov?.stakeholderCommunicationMethods || 
    profileData?.ownershipManagement?.shareholders?.[0]?.stakeholderCommunicationMethods || 
    "Not provided",

  performanceReviewProcess: gov?.performanceReviewProcess || 
    profileData?.ownershipManagement?.performanceReviewProcess || 
    "Not provided",

  performanceReviewCycle: gov?.performanceReviewCycle?.[0] || 
    gov?.performanceReviewCycle || 
    profileData?.ownershipManagement?.performanceReviewCycle || 
    "Not provided",

  dataManagementPolicies: gov?.dataManagementPolicies || 
    profileData?.ownershipManagement?.dataManagementPolicies || 
    "Not provided",

  complianceProcedures: gov?.complianceProcedures || 
    profileData?.ownershipManagement?.complianceProcedures || 
    "Not provided",
  // Checklist totals (all 19 items)
  governanceChecklistCompleted: Object.values(govChecklist).filter(Boolean).length,
  governanceChecklistTotal: Object.keys(govChecklist).length,
},

    // Enterprise readiness
    enterprise: {
      hasAdvisors: enterprise?.hasAdvisors,
      advisorsMeetRegularly: enterprise?.advisorsMeetRegularly,
      advisorsMeetingFrequency: enterprise?.advisorsMeetingFrequency,
      hasMentor: enterprise?.hasMentor,
      hasBusinessPlan: enterprise?.hasBusinessPlan,
      hasPitchDeck: enterprise?.hasPitchDeck,
      hasFinancials: enterprise?.hasFinancials,
      hasAuditedFinancials: enterprise?.hasAuditedFinancials,
      hasGuarantees: enterprise?.hasGuarantees,
      hasMvp: enterprise?.hasMvp,
      hasPayingCustomers: enterprise?.hasPayingCustomers,
      hasTraction: enterprise?.hasTraction,
      previousSupport: enterprise?.previousSupport,
      barriers: enterprise?.barriers,
      financialsPeriod: enterprise?.financialsPeriod,
    },

    // Ownership & management
    ownership: {
      directors: directorSummary,
      directorCount: directors.length,
      shareholderCount: ownership?.shareholders?.length || 0,
      performanceReviewCycle: ownership?.performanceReviewCycle,
      performanceReviewProcess: ownership?.performanceReviewProcess,
      dataManagementPolicies: ownership?.dataManagementPolicies,
      complianceProcedures: ownership?.complianceProcedures,
      hasShareRegister: !!ownership?.shareRegister,
      hasCertifiedIds: !!ownership?.certifiedIds,
    },

    // Social impact
    social: {
      womenOwnership: social?.womenOwnership,
      youthOwnership: social?.youthOwnership,
      blackOwnership: social?.blackOwnership,
      disabledOwnership: social?.disabledOwnership,
      jobsToCreate: social?.jobsToCreate,
      localEmployeesHired: social?.localEmployeesHired,
      numberOfBeneficiaries: social?.numberOfBeneficiaries,
      communityInvestmentAmount: social?.communityInvestmentAmount,
      csiCsrSpend: social?.csiCsrSpend,
      csrFocusAreas: social?.csrFocusAreas,
      sdgAlignment: social?.sdgAlignment,
      environmentalImpact: social?.environmentalImpact,
    },

    // Growth potential
    growth: {
      flags: growthFlags,
      activeCount: Object.values(growthFlags).filter(Boolean).length,
      total: 8,
    },

    // Policies
    policies: {
      completed: policiesCompleted,
      missing: policiesMissing,
      score: Math.round((policiesCompleted.length / POLICY_KEYS.length) * 100),
      completedCount: policiesCompleted.length,
      total: POLICY_KEYS.length,
    },

    // Document verification
    docStatuses,

    // Use of funds
    funding: {
      amountRequested: useOfFunds?.amountRequested,
      fundingInstruments: useOfFunds?.fundingInstruments,
      funderTypes: useOfFunds?.funderTypes,
      equityType: useOfFunds?.equityType,
    },
  };
};


// ─────────────────────────────────────────────────────────────
// 2. IMPROVED SCORING FUNCTIONS
//    Each category scores ONLY what you actually collect
// ─────────────────────────────────────────────────────────────
const scoreStrategicPlanning = (summary) => {
  let score = 0;
  const maxScore = 100;
  const breakdown = [];

  // Business plan exists (25 pts)
  if (summary.enterprise.hasBusinessPlan === "yes") { 
    score += 25; breakdown.push("✓ Business plan"); 
  } else breakdown.push("✗ Business plan missing");

  // Stakeholder Communication Methods - governance.stakeholderCommunicationMethods (15 pts)
  const stakeholderComms = summary.governance.stakeholderCommunicationMethods;
  if (stakeholderComms && stakeholderComms.trim().length > 3) { 
    score += 15; breakdown.push("✓ Stakeholder communication methods defined"); 
  } else breakdown.push("✗ Stakeholder communication methods not provided");

  // Performance Review & KPI Process - governance.performanceReviewProcess + performanceReviewCycle (15 pts)
  const perfProcess = summary.governance.performanceReviewProcess;
  const perfCycle = summary.governance.performanceReviewCycle;
  if (perfProcess && perfProcess.trim().length > 3) { 
    score += 10; breakdown.push("✓ Performance review process defined"); 
  } else breakdown.push("✗ Performance review process missing");
  if (perfCycle && perfCycle !== "Not provided") { 
    score += 5; breakdown.push(`✓ Review cycle: ${perfCycle}`); 
  } else breakdown.push("✗ Review cycle not set");

  // Compliance Monitoring & Risk Management - governance.complianceProcedures (20 pts)
  const compliance = summary.governance.complianceProcedures;
  if (compliance && compliance.trim().length > 10) { 
    score += 20; breakdown.push("✓ Compliance & risk procedures documented"); 
  } else breakdown.push("✗ Compliance procedures not documented");

  // Data Management & Privacy Policies - governance.dataManagementPolicies (15 pts)
  const dataPolicy = summary.governance.dataManagementPolicies;
  if (dataPolicy && dataPolicy.trim().length > 3) { 
    score += 15; breakdown.push("✓ Data management policies defined"); 
  } else breakdown.push("✗ Data management policies missing");

  // Growth potential flags active (10 pts)
  const growthPct = summary.growth.activeCount / summary.growth.total;
  const growthPts = Math.round(growthPct * 10);
  score += growthPts;
  breakdown.push(`Growth potential: ${summary.growth.activeCount}/${summary.growth.total} flags (${growthPts}/10 pts)`);

  return { score: Math.min(score, maxScore), maxScore, breakdown };
};

const scoreRiskManagement = (summary) => {
  let score = 0;
  const maxScore = 100;
  const breakdown = [];

  // Has advisors + meeting frequency (20 pts)
  if (summary.enterprise.hasAdvisors === "yes") {
    score += 10; breakdown.push("✓ Has advisors");
    if (["weekly", "monthly", "bi-weekly"].includes(summary.enterprise.advisorsMeetingFrequency?.toLowerCase())) {
      score += 10; breakdown.push("✓ Advisors meet regularly");
    } else breakdown.push("✗ Advisor meeting frequency not set");
  } else breakdown.push("✗ No advisors");

  // Compliance procedures documented (15 pts)
  if (summary.governance.complianceProcedures) { score += 15; breakdown.push("✓ Compliance procedures documented"); }
  else breakdown.push("✗ Compliance procedures missing");

  // Has guarantees (15 pts)
  if (summary.enterprise.hasGuarantees === "yes") { score += 15; breakdown.push("✓ Guarantees in place"); }
  else breakdown.push("✗ No guarantees");

  // Conflict resolution (15 pts)
  if (summary.governance.hasConflictResolution === "Yes") { score += 15; breakdown.push("✓ Conflict resolution policy"); }
  else breakdown.push("✗ No conflict resolution policy");

  // Whistleblowing policy (10 pts)
  if (summary.governance.hasWhistleblowingPolicy === "Yes") { score += 10; breakdown.push("✓ Whistleblowing policy"); }
  else breakdown.push("✗ No whistleblowing policy");

  // Data management policies documented (10 pts)
  if (summary.ownership.dataManagementPolicies) { score += 10; breakdown.push("✓ Data management policies"); }
  else breakdown.push("✗ Data management policies missing");

  // Credit report available (15 pts)
  if (summary.financial.hasCreditReport === "yes") { score += 15; breakdown.push("✓ Credit report available"); }
  else breakdown.push("✗ No credit report");

  return { score: Math.min(score, maxScore), maxScore, breakdown };
};

const scoreTransparencyReporting = (summary) => {
  let score = 0;
  const maxScore = 100;
  const breakdown = [];

  // Audited financials (20 pts)
  if (summary.financial.financialsAudited === "yes") { score += 20; breakdown.push("✓ Financials audited"); }
  else breakdown.push("✗ Financials not audited");

  // Books up to date (15 pts)
  if (summary.financial.booksUpToDate === "yes") { score += 15; breakdown.push("✓ Books up to date"); }
  else breakdown.push("✗ Books not up to date");

  // Accounting software (10 pts)
  if (summary.financial.hasAccountingSoftware === "yes") { score += 10; breakdown.push("✓ Accounting software"); }
  else breakdown.push("✗ No accounting software");

  // Stakeholder reporting frequency (15 pts)
  const freq = summary.governance.stakeholderReportingFrequency?.[0];
  if (["monthly", "quarterly", "bi-annually", "annually"].includes(freq)) {
    score += 15; breakdown.push(`✓ Stakeholder reporting: ${freq}`);
  } else breakdown.push("✗ Stakeholder reporting frequency not set");

  // Performance review cycle documented (10 pts)
  if (summary.ownership.performanceReviewCycle) { score += 10; breakdown.push("✓ Performance review cycle"); }
  else breakdown.push("✗ No performance review cycle");

  // Ethics training (15 pts)
  if (summary.governance.lastEthicsTrainingDate) { score += 10; breakdown.push("✓ Ethics training recorded"); }
  if (summary.governance.ethicsTrainingFrequency) { score += 5; breakdown.push("✓ Ethics training frequency set"); }

  // Company profile verified (15 pts)
  if (summary.docStatuses.companyProfile === "verified") { score += 15; breakdown.push("✓ Company profile verified"); }
  else breakdown.push("✗ Company profile not verified");

  return { score: Math.min(score, maxScore), maxScore, breakdown };
};

const scorePoliciesDocumentation = (summary) => {
  // This one is straightforward: % of 17 policies completed
  const score = summary.policies.score;
  const maxScore = 100;
  const breakdown = [
    `Completed ${summary.policies.completedCount}/${summary.policies.total} policies`,
    ...(summary.policies.missing.length > 0
      ? [`Missing: ${summary.policies.missing.join(", ")}`]
      : ["✓ All policies complete"])
  ];
  return { score, maxScore, breakdown, completed: summary.policies.completedCount, total: summary.policies.total };
};

const calculateGovernanceScore = (profileData) => {
  const summary = buildProfileSummary(profileData);
  
  // Calculate PIS for board score
  const pisCalc = (() => {
    const employees = parseInt(profileData?.entityOverview?.employeeCount) || 0;
    const turnoverRaw = profileData?.financialOverview?.annualRevenue || '0';
    const turnover = parseFloat(turnoverRaw.toString().replace(/[R,\s]/g, '')) || 0;
    const liabilitiesRaw = profileData?.financialOverview?.existingDebt || '0';
    const liabilities = parseFloat(liabilitiesRaw.toString().replace(/[R,\s]/g, '')) || 0;
    const shareholders = profileData?.ownershipManagement?.shareholders?.length || 1;
    return {
      totalPIS: employees + (turnover/1000000) + (liabilities/1000000) + shareholders
    };
  })();
  
  const strategic = scoreStrategicPlanning(summary);
  const risk = scoreRiskManagement(summary);
  const transparency = scoreTransparencyReporting(summary);
  const policies = scorePoliciesDocumentation(summary);
  const board = scoreBoardStructure(profileData, pisCalc);
  
  // All categories now have equal weight (20% each since we have 5 categories)
  const overall = Math.round(
    (strategic.score + risk.score + transparency.score + policies.score + board.score) / 5
  );

  return {
    overall,
    categories: [
      { name: "Strategic Planning", ...strategic, color: "#8D6E63", weight: 20 },
      { name: "Risk Management", ...risk, color: "#6D4C41", weight: 20 },
      { name: "Transparency and Reporting", ...transparency, color: "#A67C52", weight: 20 },
      { name: "Policies & Documentation", ...policies, color: "#5D4037", weight: 20 },
      { name: "Board Structure", ...board, color: "#4E342E", weight: 20 },
    ],
    summary,
  };
};


// ─────────────────────────────────────────────────────────────
// 3. IMPROVED AI PROMPT
//    Tightly constrained to YOUR data fields, zero hallucination
// ─────────────────────────────────────────────────────────────
/**
 * buildGovernancePrompt — updated with:
 *  - Confidence level (High / Medium / Low) per category
 *  - Evidence citation per category
 *  - Platform-specific improvement actions
 *  - Perfect-score maintenance messages
 *  - Anti-hallucination strict data rules
 */

const buildGovernancePrompt = (profileData, pisCalc, stage, recommendation) => {
  const gov = profileData?.governance || {};
  const govChecklist = gov?.governanceChecklist || {};
  const enterprise = profileData?.enterpriseReadiness || {};
  const ownership = profileData?.ownershipManagement || {};
  const financial = profileData?.financialOverview || {};
  const legal = profileData?.legalCompliance || {};

  // ── Policies count ────────────────────────────────────────────────────────
  const policyItems = [
    "employmentContract", "nda", "mou", "suppliercontract",
    "codeOfConduct", "leavePolicy", "disciplinaryPolicy", "healthSafetyPolicy",
    "privacyPolicy", "remoteWorkPolicy", "conflictInterestPolicy", "ipProtection",
    "socialMediaPolicy", "expensePolicy", "overtimePolicy", "terminationPolicy",
    "performancePolicy", "ethicsPolicy", "whistleblowingPolicy",
  ];
  const completedPolicies = policyItems.filter(p => govChecklist[p] === true).length;
  const totalPolicies = policyItems.length;

  // ── Director count ────────────────────────────────────────────────────────
  const directorCount = ownership?.directors?.length || 0;

  // ── Helper: fromChecklist ─────────────────────────────────────────────────
  const fromChecklist = (checklistKey, fallbackField) =>
    govChecklist[checklistKey] === true ? "Yes" :
    govChecklist[checklistKey] === false ? "No" :
    fallbackField || "Not provided";

  // ── Build data block ──────────────────────────────────────────────────────
  const dataBlock = `
=== PIS CALCULATION ===
Employees: ${pisCalc.employees}
Annual Turnover: R ${pisCalc.turnover?.toLocaleString() || 0}
Liabilities: R ${pisCalc.liabilities?.toLocaleString() || 0}
Shareholders: ${pisCalc.shareholders}
Total PIS: ${pisCalc.totalPIS}
Stage: ${stage}
Recommendation: ${recommendation}

=== STRATEGIC PLANNING ===
Has Business Plan: ${enterprise.hasBusinessPlan === "yes" ? "Yes" : "No"}
Has Pitch Deck: ${enterprise.hasPitchDeck === "yes" ? "Yes" : "No"}
Has MVP: ${enterprise.hasMvp === "yes" ? "Yes" : "No"}
Has Traction: ${enterprise.hasTraction === "yes" ? "Yes" : "No"}
Has Paying Customers: ${enterprise.hasPayingCustomers === "yes" ? "Yes" : "No"}
Funding Strategy Defined: ${profileData?.useOfFunds?.amountRequested ? "Yes" : "No"}
Stakeholder Communication Methods: ${gov.stakeholderCommunicationMethods || ownership.shareholders?.[0]?.stakeholderCommunicationMethods || "Not provided"}
Performance Review Process: ${gov.performanceReviewProcess || ownership.performanceReviewProcess || "Not provided"}
Performance Review Cycle: ${Array.isArray(gov.performanceReviewCycle) ? gov.performanceReviewCycle[0] : gov.performanceReviewCycle || ownership.performanceReviewCycle || "Not provided"}

=== RISK MANAGEMENT ===
Has Advisors: ${enterprise.hasAdvisors === "yes" ? "Yes" : "No"}
Advisors Meeting Frequency: ${enterprise.advisorsMeetingFrequency || "Not specified"}
Compliance Procedures: ${gov.complianceProcedures || ownership.complianceProcedures || "Not provided"}
Has Conflict Resolution: ${fromChecklist("conflictInterestPolicy", legal.hasConflictResolution)}
Whistleblowing Policy: ${fromChecklist("whistleblowingPolicy", gov.hasWhistleblowingPolicy)}
Data Management Policies: ${gov.dataManagementPolicies || ownership.dataManagementPolicies || "Not provided"}
Has Credit Report: ${financial.hasCreditReport === "yes" ? "Yes" : "No"}
Guarantees Present: ${profileData?.guarantees ? Object.values(profileData.guarantees).filter(v => v === "yes").length + " types confirmed" : "Not provided"}

=== TRANSPARENCY & REPORTING ===
Audited Financials: ${enterprise.hasAuditedFinancials === "yes" ? "Yes" : "No"}
Books Up To Date: ${financial.booksUpToDate === "yes" ? "Yes" : "No"}
Has Accounting Software: ${financial.hasAccountingSoftware === "yes" ? "Yes" : "No"}
Stakeholder Reporting Frequency: ${Array.isArray(gov.stakeholderReportingFrequency) ? gov.stakeholderReportingFrequency[0] : gov.stakeholderReportingFrequency || "Not provided"}
Performance Review Cycle: ${Array.isArray(gov.performanceReviewCycle) ? gov.performanceReviewCycle[0] : gov.performanceReviewCycle || "Not provided"}
Ethics Training Frequency: ${gov.ethicsTrainingFrequency || "Not provided"}
Company Profile Document: ${profileData?.documents?.companyProfile ? "Uploaded" : "Not uploaded"}

=== POLICIES & DOCUMENTATION ===
Policies Completed: ${completedPolicies}/${totalPolicies}
Ethics Policy: ${fromChecklist("ethicsPolicy", gov.hasEthicsPolicy)}
Code of Conduct: ${govChecklist.codeOfConduct ? "Yes" : "No"}
Privacy Policy: ${govChecklist.privacyPolicy ? "Yes" : "No"}
Health & Safety Policy: ${govChecklist.healthSafetyPolicy ? "Yes" : "No"}
Employment Contract: ${govChecklist.employmentContract ? "Yes" : "No"}
NDA: ${govChecklist.nda ? "Yes" : "No"}
Conflict of Interest Policy: ${govChecklist.conflictInterestPolicy ? "Yes" : "No"}
Disciplinary Policy: ${govChecklist.disciplinaryPolicy ? "Yes" : "No"}
IP Protection: ${govChecklist.ipProtection ? "Yes" : "No"}
Leave Policy: ${govChecklist.leavePolicy ? "Yes" : "No"}

=== BOARD STRUCTURE ===
Director Count: ${directorCount}
Has Advisory Structure: ${fromChecklist("advisoryStructure", legal.hasAdvisoryStructure || gov.hasAdvisoryStructure)}
PIS Total: ${pisCalc.totalPIS}
Stage: ${stage}
`.trim();

  // ── System rules block ────────────────────────────────────────────────────
  const systemRules = `
STRICT DATA RULES — FOLLOW WITHOUT EXCEPTION:
- Only reference data explicitly provided in the INPUT DATA below
- If a field says "Not provided" or "Not specified" — state this in your evidence and reduce confidence to Low
- NEVER invent, assume, or infer missing operational details
- NEVER fabricate benchmarks, comparisons, or market data
- For every score you give, cite the exact field(s) from the input that justify it
- If data is insufficient to score a category fairly, state "Insufficient data" and score conservatively
`.trim();

  // ── Scoring rubric ────────────────────────────────────────────────────────
  const scoringRubric = `
SCORING RUBRIC (apply strictly, 0–100 per category):
- 0–20   = No evidence or critically missing data
- 21–40  = Minimal evidence, major gaps
- 41–60  = Partial — some elements present but significant gaps remain
- 61–80  = Good — most elements present, minor improvements needed
- 81–100 = Strong — comprehensive evidence, well-documented
`.trim();

  // ── Improvement rules ─────────────────────────────────────────────────────
  const improvementRules = `
IMPROVEMENT ACTIONS FORMAT — CRITICAL:

For each category, split improvements into TWO parts:

PART 1 — PLATFORM ACTIONS (always list first, format as):
→ [Section Name]: [specific action to take on the platform]

PLATFORM SECTION MAPPINGS:
Strategic Planning:
  → Governance section: update stakeholder communication methods, performance review process
  → Enterprise Readiness section: confirm business plan, pitch deck, MVP, paying customers
  → Use of Funds section: define funding strategy and instruments

Risk Management:
  → Governance section: document compliance procedures, data management policies
  → Enterprise Readiness section: add advisor details, set meeting frequency
  → Legal & Compliance section: add conflict resolution procedures
  → Financial Overview section: confirm credit report status

Transparency & Reporting:
  → Governance section: set stakeholder reporting frequency, ethics training frequency
  → Financial Overview section: enable accounting software, mark books as up to date
  → Enterprise Readiness section: confirm audited financials, upload audited financials doc
  → Document Uploads section: upload company profile

Policies & Documentation:
  → Governance section → Governance Checklist: tick off missing policies
    (focus on: ${policyItems.filter(p => !govChecklist[p]).slice(0, 5).join(", ") || "all policies completed"})

Board Structure:
  → Ownership & Management section: add additional directors to meet governance requirements
  → Legal & Compliance section: formalise advisory structure

PART 2 — GENERAL GUIDANCE (after platform actions, max 2 tips):
Format: 💡 [real-world guidance sentence]

PERFECT SCORE RULE:
If a category scores 81–100: write ONLY:
✅ This area is well covered — keep records current and maintain what you have.
Then add ONE optional 💡 maintenance tip only if genuinely useful. Do NOT list platform actions.
`.trim();

  // ── Output format ─────────────────────────────────────────────────────────
  const outputFormat = `
OUTPUT FORMAT — follow exactly:

### 1. Strategic Planning
**Score:** [0–100]
**Evidence:** [Cite exact fields: e.g., "Business Plan = Yes, Pitch Deck = Yes, Stakeholder Communication = [value]"]
**Confidence:** [High | Medium | Low]
**Confidence Rationale:** [One sentence explaining why this confidence level was chosen based on data completeness]
**Rationale:** [2–3 sentences explaining how the provided data justifies this score]
**How to Improve:**
[Platform actions and/or maintenance message per the rules above]

### 2. Risk Management
**Score:** [0–100]
**Evidence:** [Cite exact fields]
**Confidence:** [High | Medium | Low]
**Confidence Rationale:** [One sentence]
**Rationale:** [2–3 sentences]
**How to Improve:**
[Platform actions and/or maintenance message]

### 3. Transparency & Reporting
**Score:** [0–100]
**Evidence:** [Cite exact fields]
**Confidence:** [High | Medium | Low]
**Confidence Rationale:** [One sentence]
**Rationale:** [2–3 sentences]
**How to Improve:**
[Platform actions and/or maintenance message]

### 4. Policies & Documentation
**Score:** ${completedPolicies >= totalPolicies ? "100 (calculated from checklist)" : `[calculated from ${completedPolicies}/${totalPolicies} policies completed]`}
**Evidence:** Policies completed: ${completedPolicies}/${totalPolicies}
**Confidence:** ${completedPolicies === totalPolicies ? "High" : completedPolicies >= totalPolicies * 0.7 ? "Medium" : "Low"}
**Confidence Rationale:** [One sentence based on checklist completeness]
**Rationale:** [2–3 sentences]
**How to Improve:**
[Platform actions and/or maintenance message]

### 5. Board Structure
**Score:** [0–100 — calculated from Director Count = ${directorCount} and PIS = ${pisCalc.totalPIS}]
**Evidence:** Director Count = ${directorCount}, PIS = ${pisCalc.totalPIS}, Stage = ${stage}
**Confidence:** ${directorCount > 0 ? "High" : "Low"}
**Confidence Rationale:** [One sentence]
**Rationale:** [2–3 sentences referencing PIS stage thresholds]
**How to Improve:**
[Platform actions and/or maintenance message]

### Overall Governance Assessment
**Overall Governance Score = (Score1 × 0.20) + (Score2 × 0.20) + (Score3 × 0.20) + (Score4 × 0.20) + (Score5 × 0.20) = [X]%
**Overall Confidence:** [High | Medium | Low]
**Evidence Summary:** [2–3 sentences summarising the key data points that most influenced the overall score]
**Governance Stage:** ${stage}
**Recommendation:** ${recommendation}
**Final Analysis:** [3–4 sentence overall summary referencing specific data points. End with the single most impactful action this business should take.]
`.trim();

  // ── Final assembled prompt ────────────────────────────────────────────────
  return `You are a senior governance analyst evaluating a South African business for investment and funder readiness.

${systemRules}

${scoringRubric}

${improvementRules}

INPUT DATA:
${dataBlock}

INSTRUCTIONS:
Evaluate this business across 5 governance categories. Use ONLY the data provided.
Each category is weighted equally at 20%.

${outputFormat}`;
};

const scoreBoardStructure = (profileData, pisCalc) => {
  let score = 0;
  const maxScore = 100;
  const breakdown = [];
  
  const directors = profileData?.ownershipManagement?.directors || [];
  const directorCount = directors.length;
  
  // Calculate PIS if not provided
  const pisTotal = pisCalc?.totalPIS || (() => {
    const employees = parseInt(profileData?.entityOverview?.employeeCount) || 0;
    const turnoverRaw = profileData?.financialOverview?.annualRevenue || '0';
    const turnover = parseFloat(turnoverRaw.toString().replace(/[R,\s]/g, '')) || 0;
    const liabilitiesRaw = profileData?.financialOverview?.existingDebt || '0';
    const liabilities = parseFloat(liabilitiesRaw.toString().replace(/[R,\s]/g, '')) || 0;
    const shareholders = profileData?.ownershipManagement?.shareholders?.length || 1;
    return employees + (turnover/1000000) + (liabilities/1000000) + shareholders;
  })();
  
  breakdown.push(`Directors: ${directorCount}`);
  breakdown.push(`PIS Score: ${pisTotal.toFixed(2)}`);
  
  // Scoring logic based on your requirements
  if (directorCount >= 2) {
    score = 100;
    breakdown.push("✓ Full score: 2+ directors");
  } else if (pisTotal < 100) {
    score = 100;
    breakdown.push("✓ Full score: PIS < 100 (exempt from board requirements)");
  } else if (pisTotal > 350) {
    score = 0;
    breakdown.push("✗ 0 points: PIS > 350 requires formal board structure");
    breakdown.push("→ Recommendation: Appoint at least 2 directors");
  } else {
    // Between 100 and 350
    score = 50;
    breakdown.push("✓ Partial score: PIS between 100-350");
    breakdown.push("→ Recommendation: Consider appointing additional directors");
  }
  
  // Add director details for transparency
  if (directors.length > 0) {
    directors.forEach((director, index) => {
      breakdown.push(`  Director ${index + 1}: ${director.name} (${director.position || 'Position not specified'})`);
    });
  } else {
    breakdown.push("  No directors appointed");
  }
  
  return { 
    score, 
    maxScore, 
    breakdown,
    directorCount,
    pisTotal
  };
};

// ─────────────────────────────────────────────────────────────
// EXPORT — replace your existing functions with these
// ─────────────────────────────────────────────────────────────
export {
  buildProfileSummary,
  calculateGovernanceScore,
  buildGovernancePrompt,
  scoreStrategicPlanning,
  scoreRiskManagement,
  scoreTransparencyReporting,
  scorePoliciesDocumentation,
  scoreBoardStructure,
};