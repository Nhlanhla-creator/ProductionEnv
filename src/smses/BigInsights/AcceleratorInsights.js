"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth: the Catalyst / Accelerator Insights implementation
// lives in `src/catalyst/CatalystInsights/catalystInsights.js`. Both the SMSE
// `/insights` route (Catalyst tab) and the catalyst `/support-insights` route
// render the exact same component, so charts and data stay identical with no
// drift. `PortfolioProvider` is mounted at the app root in `src/index.js`, so
// `usePortfolio()` is available wherever this component is rendered.
// ─────────────────────────────────────────────────────────────────────────────

export { AcceleratorInsights } from "../../catalyst/CatalystInsights/catalystInsights";
export { AcceleratorInsights as default } from "../../catalyst/CatalystInsights/catalystInsights";
