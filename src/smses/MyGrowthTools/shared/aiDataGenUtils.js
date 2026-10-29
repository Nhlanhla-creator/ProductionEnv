/**
 * AI-Powered Realistic KPI Data Generator Utilities
 *
 * For Test & Demo environments (localhost and .biz domains).
 * Uses SME profile context (industry, age, turnover, headcount) and chosen business scenario
 * to prompt OpenAI (gpt-4o-mini) and generate coherent, realistic KPI figures.
 */

import { functions } from "../../../firebaseConfig";
import { httpsCallable } from "firebase/functions";

export const SCENARIOS = [
  {
    id: "healthy",
    name: "Healthy & Steady Growth",
    badge: "Balanced",
    description: "Positive operating margins (~15–22%), sustainable 4–8% MoM revenue growth, actuals closely aligned with budgets.",
  },
  {
    id: "high_growth",
    name: "High-Growth Scaleup",
    badge: "Aggressive",
    description: "Fast 12–20% MoM revenue acceleration, higher opex/acquisition spend, tighter cash, occasional budget variances.",
  },
  {
    id: "seasonal",
    name: "Seasonal Business",
    badge: "Cyclical",
    description: "Pronounced high-demand cycle (peaks up to +60%) with quiet off-peak periods and proportional inventory/cost shifts.",
  },
  {
    id: "stressed",
    name: "Turnaround / Stressed",
    badge: "Recovery",
    description: "Challenging H1 with margin compression and missed budgets (-15%), followed by cost controls and H2 gradual recovery.",
  },
];

/**
 * Resolve OpenAI API key from available environment bindings.
 */
export const resolveOpenAiKey = () => {
  return (
    process.env.REACT_APP_OPENAI ||
    process.env.REACT_APP_OPENAI_API_KEY ||
    ""
  );
};

/**
 * Extract clean SME profile context for the AI prompt from the SME Universal Profile.
 * Supports registeredName, tradingName, economicSectors, entitySize, yearsInOperation,
 * operationStage, businessDescription, productsServices.offerings, and ownershipManagement.
 */
export const extractProfileContext = (profileData) => {
  if (!profileData) {
    return {
      companyName: "Commercial SME",
      tradingName: null,
      industry: "Retail & Commercial Services",
      entitySize: "Small",
      turnoverRange: "R1M - R10M annual turnover",
      businessAge: "3-5 years",
      operationStage: "Growth",
      employeeCount: "5-20 team members",
      offerings: "",
      description: "",
      anchorMonthlyRevenue: 250000,
      recommendedScenario: "healthy",
      isDerivedFromProfile: false,
    };
  }

  const eo = profileData.entityOverview || {};
  const om = profileData.ownershipManagement || {};
  const ps = profileData.productsServices || {};

  // 1. Company Name & Trading Name
  const companyName =
    eo.registeredName ||
    eo.tradingName ||
    eo.registeredEntityName ||
    eo.organisationName ||
    profileData.companyName ||
    "Commercial SME";

  const tradingName =
    eo.tradingName && eo.tradingName.trim() !== companyName.trim()
      ? eo.tradingName.trim()
      : null;

  // 2. Industry / Economic Sectors
  let industry = "";
  if (Array.isArray(eo.economicSectors) && eo.economicSectors.length > 0) {
    industry = eo.economicSectors.join(" • ");
  } else if (typeof eo.economicSectors === "string" && eo.economicSectors.trim()) {
    industry = eo.economicSectors.trim();
  } else if (eo.industry || profileData.industry) {
    industry = eo.industry || profileData.industry;
  } else if (eo.operatingSector) {
    industry = eo.operatingSector;
  } else {
    industry = "General Commercial";
  }

  // 3. Entity Size & Turnover Anchor
  const entitySize = eo.entitySize || profileData.entitySize || "Small";
  let turnoverRange = "Small (R1M - R10M annual turnover)";
  let anchorMonthlyRevenue = 290000;

  if (entitySize === "Micro" || entitySize.toLowerCase().includes("micro")) {
    turnoverRange = "Micro (< R1M annual turnover)";
    anchorMonthlyRevenue = 50000;
  } else if (entitySize === "Small" || entitySize.toLowerCase().includes("small")) {
    turnoverRange = "Small (R1M - R10M annual turnover)";
    anchorMonthlyRevenue = 300000;
  } else if (entitySize === "Medium" || entitySize.toLowerCase().includes("medium")) {
    turnoverRange = "Medium (R10M - R50M annual turnover)";
    anchorMonthlyRevenue = 1800000;
  } else if (entitySize === "Large" || entitySize.toLowerCase().includes("large")) {
    turnoverRange = "Large (> R50M annual turnover)";
    anchorMonthlyRevenue = 5000000;
  } else if (eo.turnoverRange || profileData.turnoverRange) {
    turnoverRange = eo.turnoverRange || profileData.turnoverRange;
    const numMatches = turnoverRange.replace(/,/g, "").match(/\d+/g);
    if (numMatches && numMatches.length > 0) {
      const parsedNums = numMatches.map(Number);
      const avgTurnover = parsedNums.reduce((a, b) => a + b, 0) / parsedNums.length;
      if (avgTurnover < 1000) {
        anchorMonthlyRevenue = Math.round((avgTurnover * 1000000) / 12);
      } else {
        anchorMonthlyRevenue = Math.round(avgTurnover / 12);
      }
    }
  }

  // 4. Business Age & Stage
  let businessAge = "3-5 years";
  if (eo.yearsInOperation !== undefined && eo.yearsInOperation !== "") {
    businessAge = `${eo.yearsInOperation} years in operation`;
  } else if (eo.registrationYear) {
    const years = Math.max(1, new Date().getFullYear() - Number(eo.registrationYear));
    businessAge = `${years} years (founded ${eo.registrationYear})`;
  }

  const operationStage = eo.operationStage || "Growth";

  // 5. Headcount / Staffing
  let employeeCount = "5-20 team members";
  const perm = Number(om.permanentEmployees || 0);
  const cont = Number(om.contractEmployees || 0);
  if (perm > 0 || cont > 0) {
    employeeCount = `${perm + cont} staff (${perm} permanent${cont > 0 ? `, ${cont} contract` : ""})`;
  } else if (om.totalEmployees) {
    employeeCount = `${om.totalEmployees} employees`;
  } else if (eo.employeeCount || profileData.employeeCount) {
    employeeCount = eo.employeeCount || profileData.employeeCount;
  }

  // 6. Offerings & Description
  let offerings = "";
  if (Array.isArray(ps.offerings) && ps.offerings.length > 0) {
    offerings = ps.offerings
      .map((o) => o?.name)
      .filter(Boolean)
      .slice(0, 3)
      .join(", ");
  } else if (ps.coreBusiness) {
    offerings = ps.coreBusiness;
  }

  const description = (eo.businessDescription || "").trim();

  // 7. Scenario Recommendation
  let recommendedScenario = "healthy";
  const stageLower = operationStage.toLowerCase();
  const indLower = industry.toLowerCase();

  if (stageLower === "scaling" || stageLower === "startup") {
    recommendedScenario = "high_growth";
  } else if (stageLower === "turnaround") {
    recommendedScenario = "stressed";
  } else if (
    indLower.includes("agri") ||
    indLower.includes("touris") ||
    indLower.includes("hospitality") ||
    indLower.includes("retail")
  ) {
    recommendedScenario = "seasonal";
  }

  const isDerivedFromProfile = Boolean(
    eo.registeredName ||
      eo.tradingName ||
      (Array.isArray(eo.economicSectors) && eo.economicSectors.length > 0) ||
      eo.entitySize ||
      eo.businessDescription
  );

  return {
    companyName,
    tradingName,
    industry,
    entitySize,
    turnoverRange,
    businessAge,
    operationStage,
    employeeCount,
    offerings,
    description,
    anchorMonthlyRevenue: Math.max(20000, anchorMonthlyRevenue),
    recommendedScenario,
    isDerivedFromProfile,
  };
};

/**
 * Filters out calculated KPIs so the AI only generates primary input cells,
 * leaving formulas (Gross Profit, EBITDA, Net Margin) to calculate naturally.
 */
export const getBaseEditableKpis = (kpiRows = []) => {
  return kpiRows.filter(({ kpi }) => {
    if (!kpi) return false;
    if (kpi.calculated || kpi.isCalculated || kpi.computed) return false;
    const name = (kpi.name || "").toLowerCase();
    const id = (kpi.id || "").toLowerCase();
    if (
      name.includes("gross profit") ||
      name.includes("ebitda") ||
      name.includes("operating profit") ||
      name.includes("net profit") ||
      name.includes("variance") ||
      id.includes("ebitda") ||
      id.includes("grossprofit")
    ) {
      return false;
    }
    return true;
  });
};

/**
 * Main AI Data Generation Function
 */
export const generateRealisticKpiData = async ({
  profileData,
  tabName = "Profit & Costs",
  categoryName = "All Categories",
  activeSection = "monthly",
  activeKpiRows = [],
  periods = [],
  scenarioId = "healthy",
  customMonthlyRevenue = null,
}) => {
  const baseRows = getBaseEditableKpis(activeKpiRows);
  if (!baseRows.length) {
    throw new Error("No editable input KPIs found in this section to generate data for.");
  }

  if (!periods.length) {
    throw new Error("No periods available for data generation.");
  }

  const profileContext = extractProfileContext(profileData);
  const selectedScenario = SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0];
  const targetMonthlyRevenue = customMonthlyRevenue || profileContext.anchorMonthlyRevenue;

  const kpiList = baseRows.map(({ kpi, category }) => ({
    id: kpi.id,
    name: kpi.name,
    category: category || "General",
    units: kpi.units || "currency",
    frequency: kpi.frequency || "Monthly",
  }));

  const periodList = periods.map((p) => ({
    key: p.key || p.label,
    label: p.label,
  }));

  // Dispatch to Firebase Cloud Function (runs securely with process.env.OPENAI_API_KEY)
  const callGenerateAiData = httpsCallable(functions, "generateGrowthSuiteAiData");
  const callResult = await callGenerateAiData({
    profileContext,
    tabName,
    categoryName,
    activeSection,
    kpiList,
    periodList,
    selectedScenario,
    targetMonthlyRevenue,
  });

  const responseData = callResult?.data || {};
  const rawUpdates = Array.isArray(responseData.updates) ? responseData.updates : [];

  // Map returned raw updates back to internal table format for preview and batch saving
  const kpiMap = new Map();
  baseRows.forEach((row) => kpiMap.set(row.kpi.id, row.kpi));

  const validUpdates = [];
  rawUpdates.forEach((item) => {
    if (!item || !item.kpiId || !item.periodKey || !item.which) return;
    const kpi = kpiMap.get(item.kpiId);
    if (!kpi) return;

    const which = item.which.toLowerCase() === "budget" ? "budget" : "actual";
    const numVal = Math.round(Number(item.value));
    if (!Number.isFinite(numVal)) return;

    validUpdates.push({
      kpi,
      which,
      periodKey: item.periodKey,
      value: numVal,
      raw: String(numVal),
    });
  });

  return {
    success: true,
    scenario: selectedScenario,
    profileContext,
    targetMonthlyRevenue,
    updates: validUpdates,
    rawCount: responseData.rawCount || validUpdates.length,
    validCount: validUpdates.length,
  };
};

