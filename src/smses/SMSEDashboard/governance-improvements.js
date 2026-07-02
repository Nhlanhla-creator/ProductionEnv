// ============================================================
// IMPROVED GOVERNANCE SCORING SYSTEM
// Fixes: hallucination, score ceiling, data-bound recommendations
// ============================================================
const lookup = (map, value, fallback = 0) => map[value] ?? fallback;
 
const pct5 = (raw) => Math.round((raw / 5) * 100); // 0-5 score → 0-100 %
 
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
const scoreStrategicPlanning = (profileData) => {
  const sc = profileData?.governance?.strategicClarity || {};
 
  // strategicDirection: "documented_shared" | "informal" | "none"
  const dirScore = lookup(
    { documented_shared: 5, informal: 2, none: 0 },
    sc.strategicDirection
  );
 
  // planningDepth: "3_4_selected" | "1_2_selected" | "none"
  const planScore = lookup(
    { "3_4_selected": 5, "1_2_selected": 3, none: 0 },
    sc.planningDepth
  );
 
  // marketStrategy: "clearly_defined" | "partially_defined" | "unclear"
  const mktScore = lookup(
    { clearly_defined: 5, partially_defined: 3, unclear: 0 },
    sc.marketStrategy
  );
 
  // executionRoadmap: "detailed_roadmap" | "high_level_plan" | "no_roadmap"
  const roadScore = lookup(
    { detailed_roadmap: 5, high_level_plan: 3, no_roadmap: 0 },
    sc.executionRoadmap
  );
 
  // decisionMaking: "structured_data_driven" | "semi_structured" | "informal_reactive"
  const decScore = lookup(
    { structured_data_driven: 5, semi_structured: 3, informal_reactive: 0 },
    sc.decisionMaking
  );
 
  // adaptability: "structured_review" | "some_adjustment" | "reactive_none"
  const adaptScore = lookup(
    { structured_review: 5, some_adjustment: 3, reactive_none: 0 },
    sc.adaptability
  );
 
  const raw = (dirScore + planScore + mktScore + roadScore + decScore + adaptScore) / 6;
  return { score: pct5(raw), max: 100 };
};

const scoreRiskManagement = (profileData) => {
  const rm = profileData?.governance?.riskManagement || {};
 
  // riskIdentification: "documented_risk_register" | "informal_awareness" | "no_structured_identification"
  const identScore = lookup(
    { documented_risk_register: 5, informal_awareness: 2, no_structured_identification: 0 },
    rm.riskIdentification
  );
 
  // riskAssessment: "structured_assessment" | "basic_informal" | "no_formal_assessment"
  const assessScore = lookup(
    { structured_assessment: 5, basic_informal: 2, no_formal_assessment: 0 },
    rm.riskAssessment
  );
 
  // riskMitigation: "defined_mitigation_plans" | "some_mitigation_actions" | "no_clear_approach"
  const mitScore = lookup(
    { defined_mitigation_plans: 5, some_mitigation_actions: 2, no_clear_approach: 0 },
    rm.riskMitigation
  );
 
  // businessContinuity: "formal_documented_plan" | "partial_informal_plan" | "none"
  const bcpScore = lookup(
    { formal_documented_plan: 5, partial_informal_plan: 2, none: 0 },
    rm.businessContinuity
  );
 
  // crisisPreparedness: "clear_response_protocols" | "some_readiness" | "reactive_unprepared"
  const crisisScore = lookup(
    { clear_response_protocols: 5, some_readiness: 2, reactive_unprepared: 0 },
    rm.crisisPreparedness
  );
 
  // riskOwnership: "clear_ownership" | "shared_unclear" | "no_ownership_defined"
  const ownScore = lookup(
    { clear_ownership: 5, shared_unclear: 2, no_ownership_defined: 0 },
    rm.riskOwnership
  );

  // Legal & reputational risk — adverseListings / courtNotices live at the top
  // level of profileData.governance (set in the "Risk & Legal" section of the
  // Governance form), not inside the riskManagement sub-object. "Yes" on
  // either is an active, unresolved risk signal, so it pulls this score down;
  // "No" on both is a clean bill; unanswered is treated as neutral (not
  // penalized, since silence isn't evidence either way).
  const gov = profileData?.governance || {};
  let legalRiskScore = 2.5; // neutral default when unanswered
  if (gov.adverseListings === "No" && gov.courtNotices === "No") legalRiskScore = 5;
  else if (gov.adverseListings === "Yes" || gov.courtNotices === "Yes") legalRiskScore = 0;
  else if (gov.adverseListings === "No" || gov.courtNotices === "No") legalRiskScore = 3.5;

  const raw = (identScore + assessScore + mitScore + bcpScore + crisisScore + ownScore + legalRiskScore) / 7;
  return { score: pct5(raw), max: 100 };
};
 
const scoreTransparencyReporting = (profileData) => {
  const tr = profileData?.governance?.transparencyReporting || {};
 
  // reportingFrequency: "monthly" | "quarterly" | "ad_hoc_none"
  const freqScore = lookup(
    { monthly: 5, quarterly: 4, ad_hoc_none: 0 },
    tr.reportingFrequency
  );
 
  // performanceReviewCycle: "monthly" | "quarterly_biannual" | "ad_hoc_none"
  // STRING — read directly from transparencyReporting sub-object
  const perfScore = lookup(
    { monthly: 5, quarterly_biannual: 3, ad_hoc_none: 0 },
    tr.performanceReviewCycle
  );
 
  // kpiMonitoring: "defined_kpis_tracked" | "some_kpis_tracked" | "no_structured_tracking"
  const kpiScore = lookup(
    { defined_kpis_tracked: 5, some_kpis_tracked: 3, no_structured_tracking: 0 },
    tr.kpiMonitoring
  );
 
  // stakeholderCommunication: "structured_reports" | "informal_updates" | "minimal"
  const stakScore = lookup(
    { structured_reports: 5, informal_updates: 2, minimal: 0 },
    tr.stakeholderCommunication
  );
 
  // complianceAndRisk: "formal_risk_register_audits" | "partial_some_controls" | "none"
  const compScore = lookup(
    { formal_risk_register_audits: 5, partial_some_controls: 2, none: 0 },
    tr.complianceAndRisk
  );
 
  // dataGovernance: "formal_popia_aligned" | "basic_controls" | "no_formal_approach"
  const dataScore = lookup(
    { formal_popia_aligned: 5, basic_controls: 2, no_formal_approach: 0 },
    tr.dataGovernance
  );
 
  // auditAndAssurance: "regular_internal_external" | "occasional_audits" | "none"
  const auditScore = lookup(
    { regular_internal_external: 5, occasional_audits: 2, none: 0 },
    tr.auditAndAssurance
  );
 
  const raw = (freqScore + perfScore + kpiScore + stakScore + compScore + dataScore + auditScore) / 7;
  return { score: pct5(raw), max: 100 };
};
 
 
const POLICY_ITEMS = [
  // Agreements (5)
  "employmentContract", "nda", "mou", "suppliercontract", "customerAgreements",
  // Policy Essentials (8) — briberyCorruptionPolicy added
  "codeOfConduct", "ethicsPolicy", "whistleblowingPolicy", "leavePolicy",
  "disciplinaryPolicy", "healthSafetyPolicy", "privacyPolicy", "briberyCorruptionPolicy",
  // Specialised Policies (8)
  "remoteWorkPolicy", "conflictInterestPolicy", "ipProtection", "socialMediaPolicy",
  "expensePolicy", "overtimePolicy", "terminationPolicy", "performancePolicy",
];

const POLICY_LABELS = {
  employmentContract: "Employment Contracts",
  nda: "Non-Disclosure Agreements (NDA)",
  mou: "Memorandums of Understanding (MOU)",
  suppliercontract: "Supplier Contracts",
  customerAgreements: "Customer Agreements",
  codeOfConduct: "Code of Conduct",
  ethicsPolicy: "Ethics Policy",
  whistleblowingPolicy: "Whistleblowing Policy",
  leavePolicy: "Leave Policy",
  disciplinaryPolicy: "Disciplinary Policy",
  healthSafetyPolicy: "Health & Safety Policy",
  privacyPolicy: "Privacy Policy",
  briberyCorruptionPolicy: "Bribery and Corruption Policy",
  remoteWorkPolicy: "Remote Work Policy",
  conflictInterestPolicy: "Conflict of Interest Policy",
  ipProtection: "IP Protection Policy",
  socialMediaPolicy: "Social Media Policy",
  expensePolicy: "Expense Policy",
  overtimePolicy: "Overtime Policy",
  terminationPolicy: "Termination Policy",
  performancePolicy: "Performance Policy",
};
 


const scorePoliciesDocumentation = (profileData) => {
  const checklist = profileData?.governance?.governanceChecklist || {};
  const completed = POLICY_ITEMS.filter((k) => checklist[k] === true).length;
  const score = Math.round((completed / POLICY_ITEMS.length) * 100);
 
  // Conflict-of-interest disclosure quality — replaces the old
  // "hasConflictResolution" field, which isn't part of the Governance form
  // at all (it doesn't exist in profileData.governance) and always silently
  // evaluated to 0. The real signal is membersHaveMultipleBusinesses +
  // whether those interests were actually disclosed in conflictOfInterest.
  const membersHaveMultipleBusinesses = profileData?.governance?.membersHaveMultipleBusinesses;
  const conflictEntries = profileData?.governance?.conflictOfInterest || [];
  const hasDisclosedConflicts = conflictEntries.some((e) => e?.personName && e?.companyName);
  let conflictBonus;
  if (membersHaveMultipleBusinesses === "No") conflictBonus = 5; // no conflicts to disclose
  else if (membersHaveMultipleBusinesses === "Yes" && hasDisclosedConflicts) conflictBonus = 5; // disclosed transparently
  else if (membersHaveMultipleBusinesses === "Yes" && !hasDisclosedConflicts) conflictBonus = 0; // conflict exists, undisclosed — red flag
  else conflictBonus = 2; // not answered — unknown
  // ethicsTrainingFrequency: "Weekly"|"Monthly"|"Quarterly"|"Bi-annually"|"Annually"|"As needed"|"None"
  const ethicsBonus = lookup(
    { Weekly: 5, Monthly: 5, Quarterly: 4, "Bi-annually": 3, Annually: 2, "As needed": 1, None: 0 },
    profileData?.governance?.ethicsTrainingFrequency,
    0
  );
 
  // Blend: 80% policy checklist + 10% conflict resolution + 10% ethics training
  const blended = Math.round(score * 0.8 + conflictBonus * 0.1 * 20 + ethicsBonus * 0.1 * 20);
 
  return {
    score: Math.min(100, blended),
    max: 100,
    completed,
    total: POLICY_ITEMS.length,
  };
};



const calculateGovernanceScore = (profileData) => {
 
  // ── PIS ──────────────────────────────────────────────────────────────────
  const pisCalc = (() => {
    const employees   = parseInt(profileData?.entityOverview?.employeeCount) || 0;
    const turnover    = parseFloat((profileData?.financialOverview?.annualRevenue  || "0").toString().replace(/[R,\s]/g, "")) || 0;
    const liabilities = parseFloat((profileData?.financialOverview?.existingDebt   || "0").toString().replace(/[R,\s]/g, "")) || 0;
    const shareholders = profileData?.ownershipManagement?.shareholders?.length || 1;
    return { totalPIS: employees + turnover / 1_000_000 + liabilities / 1_000_000 + shareholders };
  })();
 
  // ── Stage normalisation ───────────────────────────────────────────────────
  // entityOverview.operationStage stores "Startup" (capital S) — always lowercase
  const rawStage = (profileData?.entityOverview?.operationStage || "startup").toLowerCase();
  const stage = ["startup","growth","scaling","turnaround","mature"].includes(rawStage)
    ? rawStage : "startup";
 
  // ── Rubric-aligned weights per stage ─────────────────────────────────────
  // Maps rubric columns to your 5 scorer categories:
  //   4.1 Advisory + 4.2 Board Comp → board
  //   4.3 Committees                → risk
  //   4.4 Ownership & Accountability→ strategic
  //   4.5 Transparency              → transparency
  //   (no rubric column)            → policies (flat 20%)
  const WEIGHTS = {
    startup:    { strategic: 25, risk: 10, transparency: 15, policies: 20, board: 30 },
    turnaround: { strategic: 25, risk: 10, transparency: 15, policies: 20, board: 30 },
    growth:     { strategic: 25, risk: 15, transparency: 15, policies: 20, board: 25 },
    scaling:    { strategic: 20, risk: 25, transparency: 15, policies: 20, board: 20 },
    mature:     { strategic: 20, risk: 25, transparency: 15, policies: 20, board: 20 },
  };
  const w = WEIGHTS[stage];
 
  // ── Run all scorers ───────────────────────────────────────────────────────
  const strategic    = scoreStrategicPlanning(profileData);
  const risk         = scoreRiskManagement(profileData);
  const transparency = scoreTransparencyReporting(profileData);
  const policies     = scorePoliciesDocumentation(profileData);
  const board        = scoreBoardStructure(profileData, pisCalc);
 
  // ── Weighted overall ──────────────────────────────────────────────────────
  const overall = Math.round(
    strategic.score    * (w.strategic    / 100) +
    risk.score         * (w.risk         / 100) +
    transparency.score * (w.transparency / 100) +
    policies.score     * (w.policies     / 100) +
    board.score        * (w.board        / 100)
  );
 
  return {
    overall,
    stage,
    pisTotal: parseFloat(pisCalc.totalPIS.toFixed(2)),
    categories: [
      { name: "Strategic Planning",         ...strategic,    color: "#8D6E63", weight: w.strategic    },
      { name: "Risk Management",            ...risk,         color: "#6D4C41", weight: w.risk         },
      { name: "Transparency and Reporting", ...transparency, color: "#A67C52", weight: w.transparency },
      { name: "Policies & Documentation",   ...policies,     color: "#5D4037", weight: w.policies     },
      { name: "Board Structure",            ...board,        color: "#4E342E", weight: w.board        },
    ],
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
  const sc  = profileData?.governance?.strategicClarity      || {};
  const rm  = profileData?.governance?.riskManagement        || {};
  const tr  = profileData?.governance?.transparencyReporting || {};
  const bl  = profileData?.ownershipManagement?.businessLeadership || {};
 
  const checklist = profileData?.governance?.governanceChecklist || {};
  const completedPolicies = POLICY_ITEMS.filter((k) => checklist[k] === true).length;
  const missingPolicyKeys = POLICY_ITEMS.filter((k) => checklist[k] !== true);
  const missingPolicyNames = missingPolicyKeys.map((k) => POLICY_LABELS[k] || k);

  // Conflict of Interest — Governance form's "Conflict of Interest" section
  const membersHaveMultipleBusinesses = profileData?.governance?.membersHaveMultipleBusinesses;
  const conflictEntries = profileData?.governance?.conflictOfInterest || [];
  const disclosedConflicts = conflictEntries.filter((e) => e?.personName && e?.companyName);
  const conflictSummary = disclosedConflicts.length > 0
    ? disclosedConflicts.map((e) => `${e.personName} — ${e.otherPositions || "role not specified"} at ${e.companyName}${e.businessType ? ` (${e.businessType})` : ""}`).join("; ")
    : (membersHaveMultipleBusinesses === "Yes"
        ? "NONE DISCLOSED despite indicating members have other businesses — undisclosed conflict of interest risk"
        : "None");

  // Risk & Legal — Governance form's "Risk & Legal" section
  const adverseListings = profileData?.governance?.adverseListings;
  const adverseListingsDetails = profileData?.governance?.adverseListingsDetails;
  const courtNotices = profileData?.governance?.courtNotices;
  const courtNoticesDetails = profileData?.governance?.courtNoticesDetails;
 
  const allDirs   = profileData?.ownershipManagement?.directors || [];
  const directors = allDirs.filter((d) => d?.name && d.name.trim() !== "");
  const committeeTypes = directors.flatMap((d) => d.committeeMembership || []);
 
  // Financial fields — correct option values
  const financialsAudited =
    profileData?.financialOverview?.financialsAudited === "audited_reviewed"
      ? "Audited / independently reviewed"
      : profileData?.financialOverview?.financialsAudited === "internally_prepared"
      ? "Internally prepared"
      : "None";
 
  const booksStatus = {
    fully_up_to_date: "Fully up to date",
    partially:        "Partially up to date",
    no:               "Not up to date",
  }[profileData?.financialOverview?.booksUpToDate] || "Unknown";
 
  const mgmtAccounts = {
    monthly:      "Monthly",
    occasionally: "Occasionally",
    none:         "None",
  }[profileData?.financialOverview?.hasManagementAccounts] || "None";
 
  const meetFreq = (profileData?.enterpriseReadiness?.advisorsMeetingFrequency || "").toLowerCase();
 
  return `
You are a senior governance analyst evaluating an SME for investment readiness.
Assess governance maturity across 5 categories. Use ONLY the data provided.
Respond strictly in the structured format below.
IMPORTANT: In the Risk Management section specifically, you MUST explain the
concrete business risk created by each policy listed as missing — don't just
note that it's absent, say what could go wrong because of it.
 
=== BUSINESS CONTEXT ===
Company: ${profileData?.entityOverview?.registeredName || "Unknown"}
Operation Stage: ${profileData?.entityOverview?.operationStage || "Unknown"}
Years in Operation: ${profileData?.entityOverview?.yearsInOperation || "Unknown"}
Sector: ${(profileData?.entityOverview?.economicSectors || []).join(", ") || "Unknown"}
Legal Structure: ${profileData?.entityOverview?.legalStructure || "Unknown"}
 
=== PUBLIC INTEREST SCORE (PIS) ===
Employees: ${pisCalc.employees ?? 0}
Annual Turnover (R millions): ${((pisCalc.turnover ?? 0) / 1_000_000).toFixed(2)}
Liabilities (R millions): ${((pisCalc.liabilities ?? 0) / 1_000_000).toFixed(2)}
Shareholders: ${pisCalc.shareholders ?? 1}
PIS Total: ${pisCalc.totalPIS?.toFixed(2) ?? 0}
Governance Stage: ${stage} — ${recommendation}
 
=== 1. STRATEGIC PLANNING ===
Strategic Direction: ${sc.strategicDirection || "none"}
Planning Depth: ${sc.planningDepth || "none"}
Market Strategy: ${sc.marketStrategy || "unclear"}
Execution Roadmap: ${sc.executionRoadmap || "no_roadmap"}
Decision-Making: ${sc.decisionMaking || "informal_reactive"}
Adaptability: ${sc.adaptability || "reactive_none"}
Has Business Plan: ${profileData?.enterpriseReadiness?.hasBusinessPlan === "yes" ? "Yes" : "No"}
Has Pitch Deck: ${profileData?.enterpriseReadiness?.hasPitchDeck === "yes" ? "Yes" : "No"}
Has MVP: ${profileData?.enterpriseReadiness?.hasMvp === "yes" ? "Yes" : "No"}
 
=== 2. RISK MANAGEMENT ===
Risk Identification: ${rm.riskIdentification || "none"}
Risk Assessment: ${rm.riskAssessment || "no_formal_assessment"}
Risk Mitigation: ${rm.riskMitigation || "no_clear_approach"}
Business Continuity: ${rm.businessContinuity || "none"}
Crisis Preparedness: ${rm.crisisPreparedness || "reactive_unprepared"}
Risk Ownership: ${rm.riskOwnership || "no_ownership_defined"}
Missing Policies (risk exposure factors — ${missingPolicyNames.length} of ${POLICY_ITEMS.length} not in place): ${missingPolicyNames.length > 0 ? missingPolicyNames.join(", ") : "None — full policy set in place"}
Adverse Listings: ${adverseListings || "Not specified"}${adverseListings === "Yes" ? ` — Details: ${adverseListingsDetails || "Not provided"}` : ""}
Court Notices / Legal Proceedings: ${courtNotices || "Not specified"}${courtNotices === "Yes" ? ` — Details: ${courtNoticesDetails || "Not provided"}` : ""}
 
=== 3. TRANSPARENCY & REPORTING ===
Reporting Frequency: ${tr.reportingFrequency || "ad_hoc_none"}
Performance Review Cycle: ${tr.performanceReviewCycle || "ad_hoc_none"}
KPI Monitoring: ${tr.kpiMonitoring || "no_structured_tracking"}
Stakeholder Communication: ${tr.stakeholderCommunication || "minimal"}
Compliance & Risk Processes: ${tr.complianceAndRisk || "none"}
Data Governance: ${tr.dataGovernance || "no_formal_approach"}
Audit & Assurance: ${tr.auditAndAssurance || "none"}
Has Audited Financials (Enterprise Readiness): ${profileData?.enterpriseReadiness?.hasAuditedFinancials === "yes" ? "Yes" : "No"}
Financials Preparation: ${financialsAudited}
Books Up To Date: ${booksStatus}
Management Accounts: ${mgmtAccounts}
 
=== 4. POLICIES & DOCUMENTATION ===
Governance Checklist: ${completedPolicies} of ${POLICY_ITEMS.length} policies in place
Members Have Other Business Interests (Conflict Potential): ${membersHaveMultipleBusinesses || "Not specified"}
Conflict of Interest Disclosures: ${conflictSummary}
Ethics Training Frequency: ${profileData?.governance?.ethicsTrainingFrequency || "None"}
Last Ethics Training: ${profileData?.governance?.lastEthicsTrainingDate || "Not recorded"}
 
=== 5. BOARD STRUCTURE ===
Directors (valid): ${directors.length}
Director Names: ${directors.map((d) => d.name).join(", ") || "None"}
Exec/Non-Exec Mix: ${directors.map((d) => `${d.name} (${d.execType || "Unknown"})`).join(", ") || "None"}
Committees: ${committeeTypes.length > 0 ? committeeTypes.join(", ") : "None"}
Has Advisors: ${profileData?.enterpriseReadiness?.hasAdvisors === "yes" ? "Yes" : "No"}
Advisor Meeting Regularity: ${profileData?.enterpriseReadiness?.advisorsMeetRegularly === "yes" ? "Yes" : "No"}
Advisor Meeting Frequency: ${meetFreq || "Not specified"}
Has Mentor: ${profileData?.enterpriseReadiness?.hasMentor === "yes" ? "Yes" : "No"}
Decision Governance: ${bl.decisionGovernance || "Unknown"}
Openness to Advice: ${bl.opennessToAdvice || "Unknown"}
BB-BEE Level: ${profileData?.legalCompliance?.bbbeeLevel || "Not provided"}
 
=== RESPONSE FORMAT (follow exactly) ===
 
### 1. Strategic Planning
Score: X/5
Confidence: High | Medium | Low
Confidence Rationale: (one sentence)
Evidence: (one sentence citing specific data)
Assessment: (2-3 sentences)
How to Improve:
- (action 1)
- (action 2)
 
### 2. Risk Management
Score: X/5
Confidence: High | Medium | Low
Confidence Rationale: (one sentence)
Evidence: (one sentence citing specific data)
Assessment: (2-3 sentences covering the 6 risk-management fields above)
Missing Policy Risk: For EVERY item listed under "Missing Policies" above, state in one short sentence the concrete business risk that gap creates (e.g. "No Health & Safety Policy → exposes the business to workplace-incident liability and possible regulatory penalties"; "No Whistleblowing Policy → misconduct or fraud may go unreported"). If no policies are missing, say so explicitly instead of listing risks.
Legal & Reputational Flags: If Adverse Listings or Court Notices above is "Yes", explain in one sentence per flag what risk this creates for funders/partners (e.g. "Active court proceedings create contingent liability and reputational risk for investors"). If both are "No", say so explicitly. If unanswered, say the risk is unverified rather than assuming it's clean.
How to Improve:
- (action 1)
- (action 2)
 
### 3. Transparency and Reporting
Score: X/5
Confidence: High | Medium | Low
Confidence Rationale: (one sentence)
Evidence: (one sentence)
Assessment: (2-3 sentences)
How to Improve:
- (action 1)
- (action 2)
 
### 4. Policies & Documentation
Score: X/5
Confidence: High | Medium | Low
Confidence Rationale: (one sentence)
Evidence: (one sentence)
Assessment: (2-3 sentences)
Conflict of Interest Flag: If "Members Have Other Business Interests" is Yes but no disclosures are listed, explicitly call this out as an undisclosed-conflict red flag and explain the risk it poses to trust and governance integrity. If disclosures are present, briefly note whether they appear adequately documented. If members have no other business interests, say so explicitly.
How to Improve:
- (action 1)
- (action 2)
 
### 5. Board Structure
Score: X/5
Confidence: High | Medium | Low
Confidence Rationale: (one sentence)
Evidence: (one sentence)
Assessment: (2-3 sentences)
How to Improve:
- (action 1)
- (action 2)
 
### Overall Assessment
PIS Score: ${pisCalc.totalPIS?.toFixed(2)}
Governance Stage: ${stage}
Governance Recommendation: ${recommendation}
Overall Governance Score: [weighted average]%
Summary: (3-4 sentences on overall governance maturity and investment readiness)
`;
};



 const scoreBoardStructure = (profileData, pisCalc) => {
  // Filter out the empty placeholder director at index 0
  const allDirs = profileData?.ownershipManagement?.directors || [];
  const directors = allDirs.filter((d) => d?.name && d.name.trim() !== "");
  const directorCount = directors.length;
 
  const bl = profileData?.ownershipManagement?.businessLeadership || {};
 
  // ── Advisory signals ─────────────────────────────────────────────────────
  // hasAdvisors: "yes" | "no"  ✅ confirmed correct format
  const hasAdvisors = profileData?.enterpriseReadiness?.hasAdvisors === "yes";
  // advisorsMeetRegularly: "yes" | "no" ✅
  const advisorsMeetRegularly = profileData?.enterpriseReadiness?.advisorsMeetRegularly === "yes";
  // advisorsMeetingFrequency: "Monthly" — MUST lowercase before test
  const meetFreq = (profileData?.enterpriseReadiness?.advisorsMeetingFrequency || "").toLowerCase();
  const advisorMeetScore = /monthly/.test(meetFreq) ? 5 : /quarterly/.test(meetFreq) ? 4 : /annually/.test(meetFreq) ? 2 : 0;
 
  // ── Committee signals ─────────────────────────────────────────────────────
  // committeeMembership is an array of strings on each director: ["Audit Committee", ...]
  const committeeTypes = directors.flatMap((d) => d.committeeMembership || []);
  const hasAnyCommittee = committeeTypes.length > 0;
  const hasAuditCommittee = committeeTypes.some((c) => c.includes("Audit"));
  const hasRiskCommittee = committeeTypes.some((c) => c.includes("Risk"));
  const committeeScore = (hasAuditCommittee ? 2 : 0) + (hasRiskCommittee ? 2 : 0) + (hasAnyCommittee ? 1 : 0);
 
  // ── exec/non-exec mix ─────────────────────────────────────────────────────
  // execType: "Executive" | "Non-Executive"  ← capital E/N from select
  const hasNonExec = directors.some((d) => d.execType === "Non-Executive");
  const hasExec = directors.some((d) => d.execType === "Executive");
  const mixScore = hasNonExec && hasExec ? 5 : hasNonExec || hasExec ? 3 : 0;
 
  // ── Business leadership ───────────────────────────────────────────────────
  // decisionGovernance: "founder_all"|"founder_with_team"|"management_founder_oversight"|"board_led"
  const decGovScore = lookup(
    { founder_all: 1, founder_with_team: 3, management_founder_oversight: 4, board_led: 5 },
    bl.decisionGovernance
  );
 
  // opennessToAdvice: "very_open"|"open_evaluate"|"sometimes_open"|"prefer_own"
  // NOTE: form stores "open_evaluate" NOT "open"
  const opennessScore = lookup(
    { very_open: 5, open_evaluate: 4, sometimes_open: 2, prefer_own: 0 },
    bl.opennessToAdvice
  );
 
  // ── PIS-stage board requirement ───────────────────────────────────────────
  const pis = pisCalc?.totalPIS ?? 0;
  let pisStageScore;
  if (pis < 100) {
    // Advisors Stage: having advisors is sufficient
    pisStageScore = hasAdvisors ? (advisorsMeetRegularly ? 5 : 3) : 0;
  } else if (pis < 350) {
    // Emerging Board Stage: needs directors + advisors
    pisStageScore =
      directorCount >= 2 ? 5 : directorCount === 1 ? 3 : hasAdvisors ? 2 : 0;
  } else {
    // Full Board Stage: needs formal board with committees
    pisStageScore =
      directorCount >= 4 && hasAnyCommittee
        ? 5
        : directorCount >= 3
        ? 4
        : directorCount >= 2
        ? 2
        : 1;
  }
 
  // ── Director count raw score ──────────────────────────────────────────────
  const dirCountScore =
    directorCount === 0 ? 0
    : directorCount === 1 ? 1
    : directorCount === 2 ? 2
    : directorCount === 3 ? 3
    : directorCount === 4 ? 4
    : 5;
 
  // ── Weighted composite (all sub-scores are 0-5) ───────────────────────────
  const composite =
    pisStageScore * 0.30 +
    dirCountScore * 0.15 +
    mixScore      * 0.15 +
    decGovScore   * 0.15 +
    committeeScore * 0.10 +  // max raw 5
    opennessScore  * 0.10 +
    (hasAdvisors ? advisorMeetScore : 0) * 0.05;
 
  return { score: pct5(composite), max: 100 };
};
 
 
// ─────────────────────────────────────────────────────────────────────────────
// 6. MAIN ENTRY: calculateGovernanceScore
//    Stage-aware weighted overall across 5 categories.
//    operationStage: "Startup"|"Growth"|"Scaling"|"Turnaround"|"Mature"
//    Normalised to lowercase before lookup.
// ─────────────────────────────────────────────────────────────────────────────
 
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