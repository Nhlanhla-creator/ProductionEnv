/**
 * digitalTwin/utils/detectTwinRelevance.js
 *
 * Decides whether the Operations / Digital Twin module applies to a given
 * business, based on what they declared in their Universal Profile.
 *
 * The dashboard setup card is only shown when at least ONE signal says
 * "this business runs physical operations". Everyone else sees a clean
 * dashboard with no mention of the twin.
 *
 * Signals checked, in order:
 *   1. entityOverview.economicSectors  — the sectors they picked on signup
 *   2. productsServices.offerings[].industries — industries their offerings serve
 *   3. productsServices.offerings[].deliveryRole — asset-based delivery roles
 *   4. entityOverview.businessDescription — keyword fallback
 */

// Economic sectors (from entity-overview.js economicSectors list) that
// indicate a business is likely to run physical operations.
const HEAVY_INDUSTRY_SECTORS = [
  "Mining",
  "Construction",
  "Manufacturing",
  "Energy",
  "Oil & Gas",
  "Transport",
  "Logistics / Supply Chain",
  "Utilities (Water, Electricity, Waste)",
  "Engineering",
  "Infrastructure",
  "Automotive",
];

// Industry tags (from products-services.js industriesServedOptions) that
// indicate the business sells into a heavy-industry customer base.
const HEAVY_INDUSTRY_INDUSTRY_TAGS = [
  "Mining & quarrying",
  "Manufacturing",
  "Construction & infrastructure",
  "Energy & electricity",
  "Water, waste & environmental services",
  "Transport, logistics & warehousing",
];

// Delivery roles that mean the offering is delivered with physical assets.
const ASSET_BASED_DELIVERY_ROLES = [
  "Hire or lease",
  "Supply and install",
  "Equipment-enabled service",
  "Mobile field-service team",
];

// Free-text fallback — used only when the structured fields are empty.
const BUSINESS_DESCRIPTION_KEYWORDS = [
  "fleet", "truck", "excavator", "loader", "dozer", "grader", "drill",
  "haul", "crusher", "mine", "mining", "quarry", "equipment",
  "machinery", "heavy equipment", "logistics", "transport",
  "construction", "manufacturing", "pipeline", "rig",
];

const normalise = (s) => String(s || "").trim().toLowerCase();

const anyMatch = (values, targets) => {
  if (!Array.isArray(values) || values.length === 0) return false;
  const targetsLower = new Set(targets.map(normalise));
  return values.some((v) => targetsLower.has(normalise(v)));
};

export const shouldShowTwinCard = (profileData) => {
  if (!profileData) return false;
  const data = profileData.formData || profileData;

  // 1. Economic sectors
  const sectors = data?.entityOverview?.economicSectors || [];
  if (anyMatch(sectors, HEAVY_INDUSTRY_SECTORS)) return true;

  // 2. Offerings — industries served and delivery roles
  const offerings = data?.productsServices?.offerings || [];
  if (Array.isArray(offerings) && offerings.length > 0) {
    for (const o of offerings) {
      if (anyMatch(o.industries, HEAVY_INDUSTRY_INDUSTRY_TAGS)) return true;
      if (anyMatch(o.deliveryRole, ASSET_BASED_DELIVERY_ROLES)) return true;
    }
  }

  // 3. Business description keyword fallback
  const desc = normalise(data?.entityOverview?.businessDescription || "");
  if (desc && BUSINESS_DESCRIPTION_KEYWORDS.some((kw) => desc.includes(kw))) {
    return true;
  }

  return false;
};

export default shouldShowTwinCard;