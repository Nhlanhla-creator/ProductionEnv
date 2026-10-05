/**
 * Default demand criteria for procurement matching.
 * Reused when the buyer has not yet saved a custom demand context in their Universal Profile.
 */
export const DEFAULT_PROCUREMENT_DEMAND = {
  id: "procurement_default_demand",
  purpose: "Core Corporate Supplier Pipeline & Strategic Sourcing",
  requestOverview: {
    purpose: "Corporate supplier matching for facilities, professional services, logistics, industrial, and technology sourcing",
    categories: [
      "Information Technology",
      "Logistics",
      "Travel & Transport",
      "Facilities Management",
      "Construction",
      "Financial Services",
      "Consulting",
    ],
    keywords: "supply vetted compliant services equipment enterprise quality",
    location: "", // Any location
    minBudget: "R 100,000",
    maxBudget: "R 20,000,000",
    deliveryModes: ["On-site", "Hybrid", "Remote"],
    urgency: "Standard",
  },
  matchingPreferences: {
    bbeeLevel: "Level 4", // Baseline expectation: Level 4 or better
    location: "",
    minBudget: "R 100,000",
    maxBudget: "R 20,000,000",
    deliveryModes: ["On-site", "Hybrid", "Remote"],
    ownershipPrefs: ["Black-owned", "Women-owned"],
    sectorExperience: "Enterprise",
  },
  productsServices: {
    categories: [
      "Information Technology",
      "Logistics",
      "Travel & Transport",
      "Facilities Management",
      "Construction",
      "Financial Services",
    ],
  },
}
