/**
 * AI-Powered Realistic KPI Data Generator Utilities
 *
 * For Test & Demo environments (localhost and .biz domains).
 * Uses SME profile context (industry, age, turnover, headcount) and chosen business scenario
 * to prompt OpenAI (gpt-4o-mini) and generate coherent, realistic KPI figures.
 */

import { functions } from "../../../firebaseConfig";
import { httpsCallable } from "firebase/functions";

// ============================================================================
// 🔑 LOCAL TESTING API KEY (Paste your "sk-..." OpenAI key below to test locally)
// When set, AI generation runs directly in the browser without needing Cloud Function deploy.
// Clear back to "" before pushing to git so production uses the Cloud Function.
// ============================================================================
export const LOCAL_OPENAI_API_KEY = "";

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

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Resolve OpenAI API key from LOCAL_OPENAI_API_KEY or environment bindings.
 */
export const resolveOpenAiKey = () => {
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  const key = String(LOCAL_OPENAI_API_KEY || "").trim();
  return isLocalhost && key.startsWith("sk-") && key.length > 20 ? key : "";
};

/**
 * Parses "YYYY-MM-DD" into a local Date.
 */
const parseLocalDate = (str) => {
  if (!str) return null;
  const parts = String(str).split("-").map(Number);
  if (parts.length < 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) return null;
  return new Date(parts[0], parts[1] - 1, parts[2] || 1);
};

const startOfWeekMonday = (d) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
};

const addDays = (d, n) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
};

/**
 * Builds period keys & labels for a given { from, to } date range and frequency ("monthly" | "weekly" | "daily").
 * Includes touched months/weeks so partial date ranges never result in 0 periods.
 */
export const buildPeriodsForRange = (fromStr, toStr, frequency = "monthly") => {
  const fromDate = parseLocalDate(fromStr);
  const toDate = parseLocalDate(toStr);
  if (!fromDate || !toDate || fromDate > toDate) return [];

  const freq = String(frequency || "monthly").toLowerCase();

  if (freq === "daily") {
    const days = [];
    let cursor = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    const end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
    while (cursor <= end) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, "0");
      const d = String(cursor.getDate()).padStart(2, "0");
      days.push({
        key: `D:${y}-${m}-${d}`,
        label: `${d} ${MONTHS_SHORT[cursor.getMonth()]} ${String(y).slice(2)}`,
      });
      cursor = addDays(cursor, 1);
    }
    return days;
  }

  if (freq === "weekly") {
    const weeks = [];
    let cursor = startOfWeekMonday(fromDate);
    const end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
    while (cursor <= end) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, "0");
      const d = String(cursor.getDate()).padStart(2, "0");
      weeks.push({
        key: `W:${y}-${m}-${d}`,
        label: `${d} ${MONTHS_SHORT[cursor.getMonth()]} ${String(y).slice(2)}`,
      });
      cursor = addDays(cursor, 7);
    }
    return weeks;
  }

  // Default: monthly (includes every calendar month touched by [fromDate, toDate])
  const months = [];
  let cursor = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
  const endMonth = new Date(toDate.getFullYear(), toDate.getMonth(), 1);
  while (cursor <= endMonth) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    months.push({
      key: `M:${y}-${m}`,
      label: `${MONTHS_SHORT[cursor.getMonth()]} ${String(y).slice(2)}`,
    });
    cursor = new Date(y, cursor.getMonth() + 1, 1);
  }
  return months;
};

/**
 * Returns { monthly, weekly, daily } period arrays for a { from, to } date range.
 */
export const buildPeriodsByFrequency = (fromStr, toStr) => ({
  monthly: buildPeriodsForRange(fromStr, toStr, "monthly"),
  weekly: buildPeriodsForRange(fromStr, toStr, "weekly"),
  daily: buildPeriodsForRange(fromStr, toStr, "daily"),
});

/**
 * Extract clean SME profile context for the AI prompt from the SME Universal Profile.
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

  let businessAge = "3-5 years";
  if (eo.yearsInOperation !== undefined && eo.yearsInOperation !== "") {
    businessAge = `${eo.yearsInOperation} years in operation`;
  } else if (eo.registrationYear) {
    const years = Math.max(1, new Date().getFullYear() - Number(eo.registrationYear));
    businessAge = `${years} years (founded ${eo.registrationYear})`;
  }

  const operationStage = eo.operationStage || "Growth";

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
 * leaving formulas (Gross Profit, EBITDA, Net Margin, Solvency ratios) to calculate naturally.
 */
export const getBaseEditableKpis = (kpiRows = []) => {
  return kpiRows.filter(({ kpi }) => {
    if (!kpi) return false;
    const freq = kpi.frequency || "Monthly";
    // Must be an editable field, a custom KPI, or a non-monthly (Daily/Weekly) direct entry KPI
    if (!kpi.field && !kpi.custom && freq === "Monthly") return false;
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
 * Builds the structured prompt for OpenAI (matches backend Cloud Function prompt).
 */
const buildLocalAiPrompt = ({
  profileContext = {},
  tabName = "Profit & Costs",
  categoryName = "All Categories",
  activeSection = "monthly",
  kpiList = [],
  periodList = [],
  selectedScenario = { name: "Healthy & Steady Growth", description: "" },
  targetMonthlyRevenue = 250000,
}) => {
  const periodKeys = periodList.map((p) => p.key || p.label);
  const periodLabels = periodList.map((p) => `${p.key || p.label} (${p.label || p.key})`);

  return `
You are a senior financial analyst and management accountant generating realistic demo/test data for an African SME business.

BUSINESS PROFILE (Derived from Universal Profile):
- Enterprise: ${profileContext.companyName || "Commercial SME"}${profileContext.tradingName ? ` (Trading as: "${profileContext.tradingName}")` : ""}
- Sector / Economic Industries: ${profileContext.industry || "General Commercial"}
- Entity Scale: ${profileContext.turnoverRange || "Small"} (Classification: ${profileContext.entitySize || "Small"})
- Operational Stage & Age: ${profileContext.operationStage || "Growth"} stage • ${profileContext.businessAge || "3-5 years"}
- Workforce / Headcount: ${profileContext.employeeCount || "5-20 team members"}
${profileContext.offerings ? `- Core Offerings & Services: ${profileContext.offerings}` : ""}
${profileContext.description ? `- Business Summary / Activity: ${profileContext.description}` : ""}
- Target Monthly Revenue Anchor: ZAR ${Number(targetMonthlyRevenue || 250000).toLocaleString()}

TARGET FINANCIAL MODULE & SCOPE:
- Module / Section: "${tabName}"
- Target Category Scope: "${categoryName}"
- Frequency: ${activeSection}

SCENARIO: "${selectedScenario.name || "Healthy Growth"}"
${selectedScenario.description || ""}

KPIS TO POPULATE (${kpiList.length} KPIs — Do NOT omit any KPI):
${JSON.stringify(kpiList, null, 2)}

ORDERED TIME PERIODS (${periodKeys.length} periods in exact chronological order):
Period Keys: ${JSON.stringify(periodKeys)}
Period Labels: ${JSON.stringify(periodLabels)}

ACCOUNTING & COHERENCE RULES:
1. All figures must be contextually realistic for the company's sector and scale.
2. Direct costs / Cost of Goods Sold (COGS) must remain reasonably lower than Sales/Revenue (e.g. standard 30% to 65% gross margins depending on industry).
3. Operating expenses (salaries, rent, utilities, marketing) must reflect reasonable operational proportions.
4. For percentage/ratio/days/headcount KPIs (check "units" and "name"), generate realistic values in those units (e.g. percentages between 0 and 100, days between 15 and 90, etc.), NOT currency figures.
5. "budget" values represent forward planned projections; "actual" values reflect operational reality (with realistic small variances of -15% to +10%).
6. Return ONLY whole rounded numbers (no cents, no currency symbols, no string formatting).
7. For every KPI in KPIS TO POPULATE, provide "budget" and "actual" arrays of length ${periodKeys.length} matching the exact order of Period Keys.

RESPONSE FORMAT:
Return a valid JSON object matching this exact schema:
{
  "kpis": [
    {
      "kpiId": "exact_kpi_id_from_list",
      "budget": [${periodKeys.slice(0, 6).map((_, idx) => 150000 + idx * 5000).join(", ")}],
      "actual": [${periodKeys.slice(0, 6).map((_, idx) => 145000 + idx * 5200).join(", ")}]
    }
  ]
}
`.trim();
};

/**
 * Normalizes any JSON structure returned by OpenAI into flat { kpiId, which, periodKey, value } items.
 */
const normalizeAiResponseToUpdates = (parsed, periodList = []) => {
  const periodKeys = periodList.map((p) => p.key || p.label);
  const flatItems = [];
  if (!parsed) return flatItems;

  const pushEntry = (kpiId, which, periodKey, value) => {
    if (!kpiId || !periodKey || !which) return;
    const numVal = Math.round(Number(value));
    if (!Number.isFinite(numVal)) return;
    flatItems.push({
      kpiId: String(kpiId),
      which: String(which).toLowerCase() === "budget" ? "budget" : "actual",
      periodKey: String(periodKey),
      value: numVal,
    });
  };

  const expandSeries = (kpiId, which, series) => {
    if (Array.isArray(series)) {
      series.forEach((val, idx) => {
        const pk = periodKeys[idx];
        if (pk !== undefined) pushEntry(kpiId, which, pk, val);
      });
    } else if (series && typeof series === "object") {
      Object.entries(series).forEach(([pk, val]) => pushEntry(kpiId, which, pk, val));
    }
  };

  const processArray = (arr) => {
    arr.forEach((item) => {
      if (!item || typeof item !== "object") return;
      const kpiId = item.kpiId || item.id;
      if (!kpiId) return;
      if (item.periodKey !== undefined && item.which !== undefined && item.value !== undefined) {
        pushEntry(kpiId, item.which, item.periodKey, item.value);
        return;
      }
      if (item.budget !== undefined) expandSeries(kpiId, "budget", item.budget);
      if (item.actual !== undefined) expandSeries(kpiId, "actual", item.actual);
    });
  };

  if (Array.isArray(parsed)) {
    processArray(parsed);
    return flatItems;
  }

  if (typeof parsed === "object") {
    const candidateArray =
      parsed.kpis ||
      parsed.updates ||
      parsed.items ||
      parsed.data ||
      parsed.results ||
      Object.values(parsed).find((v) => Array.isArray(v));

    if (Array.isArray(candidateArray)) {
      processArray(candidateArray);
      return flatItems;
    }

    Object.entries(parsed).forEach(([kpiId, val]) => {
      if (val && typeof val === "object") {
        if (val.budget !== undefined) expandSeries(kpiId, "budget", val.budget);
        if (val.actual !== undefined) expandSeries(kpiId, "actual", val.actual);
      }
    });
  }

  return flatItems;
};

/**
 * Guarantees 100% of requested periods for every requested KPI have both budget and actual values.
 */
const ensureFullPeriodCoverage = (flatItems = [], kpiList = [], periodList = []) => {
  const periodKeys = periodList.map((p) => String(p.key || p.label)).filter(Boolean);
  if (!periodKeys.length || !kpiList.length) return flatItems;

  const byKpiAndWhich = new Map();
  flatItems.forEach((item) => {
    if (!item || !item.kpiId || !item.periodKey || !item.which) return;
    const w = String(item.which).toLowerCase() === "budget" ? "budget" : "actual";
    const mapKey = `${item.kpiId}|${w}`;
    if (!byKpiAndWhich.has(mapKey)) byKpiAndWhich.set(mapKey, new Map());
    byKpiAndWhich.get(mapKey).set(String(item.periodKey), Math.round(Number(item.value) || 0));
  });

  const completeItems = [];
  kpiList.forEach((kpi) => {
    const kpiId = String(kpi.id || kpi.kpiId || "");
    if (!kpiId) return;

    ["budget", "actual"].forEach((which) => {
      const seriesMap = byKpiAndWhich.get(`${kpiId}|${which}`) || new Map();
      const knownValues = Array.from(seriesMap.values()).filter((v) => Number.isFinite(v));
      const fallbackBase = knownValues.length > 0 ? knownValues[knownValues.length - 1] : 100;

      let lastVal = knownValues.length > 0 ? knownValues[0] : fallbackBase;
      periodKeys.forEach((pk, idx) => {
        if (seriesMap.has(pk)) {
          lastVal = seriesMap.get(pk);
          completeItems.push({ kpiId, which, periodKey: pk, value: lastVal });
        } else {
          const wave = 1 + (((idx % 7) - 3) * 0.015);
          const filledVal = Math.max(0, Math.round(lastVal * wave));
          lastVal = filledVal;
          completeItems.push({ kpiId, which, periodKey: pk, value: filledVal });
        }
      });
    });
  });

  return completeItems;
};

/**
 * Local direct OpenAI call (used when LOCAL_OPENAI_API_KEY or REACT_APP_OPENAI_API_KEY is set).
 */
const runLocalOpenAiBatch = async ({
  apiKey,
  profileContext,
  tabName,
  categoryName,
  activeSection,
  kpiList,
  periodList,
  selectedScenario,
  targetMonthlyRevenue,
}) => {
  const prompt = buildLocalAiPrompt({
    profileContext,
    tabName,
    categoryName,
    activeSection,
    kpiList,
    periodList,
    selectedScenario,
    targetMonthlyRevenue,
  });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a strict financial demo data generator. Return valid JSON only matching the requested schema. No markdown formatting, no commentary.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 16000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    let errorMsg = `OpenAI API HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      errorMsg = errJson?.error?.message || errorMsg;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  const responseJson = await response.json();
  const rawText = responseJson?.choices?.[0]?.message?.content?.trim() || "";
  if (!rawText) throw new Error("Empty response received from OpenAI.");

  const cleanJsonText = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(cleanJsonText);
  const normalized = normalizeAiResponseToUpdates(parsed, periodList);
  return ensureFullPeriodCoverage(normalized, kpiList, periodList);
};

/**
 * Executes a single-frequency batch via Local API Key (if configured) or Firebase Cloud Function.
 */
const runSingleFrequencyBatch = async ({
  profileContext,
  tabName,
  categoryName,
  activeSection,
  kpiList,
  periodList,
  selectedScenario,
  targetMonthlyRevenue,
}) => {
  const localKey = resolveOpenAiKey();

  // If a local OpenAI API key is provided, run directly in browser for instant testing
  if (localKey) {
    return await runLocalOpenAiBatch({
      apiKey: localKey,
      profileContext,
      tabName,
      categoryName,
      activeSection,
      kpiList,
      periodList,
      selectedScenario,
      targetMonthlyRevenue,
    });
  }

  // Otherwise call the Firebase Cloud Function
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
  return ensureFullPeriodCoverage(rawUpdates, kpiList, periodList);
};

/**
 * Main AI Data Generation Function.
 * Automatically groups KPIs by their capture frequency (Monthly / Weekly / Daily)
 * and populates all entries across the selected date range in a single click.
 */
export const generateRealisticKpiData = async ({
  profileData,
  tabName = "Profit & Costs",
  categoryName = "All Categories",
  activeSection = "monthly",
  activeKpiRows = [],
  periods = [],
  dateRange = null, // { from: "YYYY-MM-DD", to: "YYYY-MM-DD" }
  scenarioId = "healthy",
  customMonthlyRevenue = null,
}) => {
  const baseRows = getBaseEditableKpis(activeKpiRows);
  if (!baseRows.length) {
    throw new Error("No editable input KPIs found in this section to generate data for.");
  }

  const profileContext = extractProfileContext(profileData);
  const selectedScenario = SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0];
  const targetMonthlyRevenue = customMonthlyRevenue || profileContext.anchorMonthlyRevenue;

  // Group KPIs by their frequency ("monthly", "weekly", "daily")
  const rowsByFreq = { monthly: [], weekly: [], daily: [] };
  baseRows.forEach((row) => {
    const freq = String(row.kpi.frequency || "Monthly").toLowerCase();
    if (freq === "daily") rowsByFreq.daily.push(row);
    else if (freq === "weekly") rowsByFreq.weekly.push(row);
    else rowsByFreq.monthly.push(row);
  });

  const rangePeriodsByFreq =
    dateRange?.from && dateRange?.to
      ? buildPeriodsByFrequency(dateRange.from, dateRange.to)
      : null;

  const kpiMap = new Map();
  baseRows.forEach((row) => kpiMap.set(row.kpi.id, row.kpi));

  const batchPromises = Object.entries(rowsByFreq).map(async ([freqKey, groupRows]) => {
    if (!groupRows.length) return [];

    const freqPeriods =
      rangePeriodsByFreq && rangePeriodsByFreq[freqKey]?.length
        ? rangePeriodsByFreq[freqKey]
        : periods;

    if (!freqPeriods.length) return [];

    const kpiList = groupRows.map(({ kpi, category }) => ({
      id: kpi.id,
      name: kpi.name,
      category: category || "General",
      units: kpi.units || "currency",
      frequency: kpi.frequency || "Monthly",
    }));

    const periodList = freqPeriods.map((p) => ({
      key: p.key || p.label,
      label: p.label || p.key,
    }));

    return await runSingleFrequencyBatch({
      profileContext,
      tabName,
      categoryName,
      activeSection: freqKey,
      kpiList,
      periodList,
      selectedScenario,
      targetMonthlyRevenue,
    });
  });

  const batchResults = await Promise.all(batchPromises);
  const combinedRawUpdates = batchResults.flat();

  const validUpdates = [];
  combinedRawUpdates.forEach((item) => {
    if (!item || !item.kpiId || !item.periodKey || !item.which) return;
    const kpi = kpiMap.get(item.kpiId);
    if (!kpi) return;

    const which = String(item.which).toLowerCase() === "budget" ? "budget" : "actual";
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
    rawCount: combinedRawUpdates.length,
    validCount: validUpdates.length,
    usedLocalKey: Boolean(resolveOpenAiKey()),
  };
};
