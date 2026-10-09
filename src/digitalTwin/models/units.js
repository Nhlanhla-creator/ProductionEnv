/**
 * digitalTwin/models/units.js
 *
 * Canonical unit library and conversion helpers (Section 5.1, Appendix A4).
 * Only ONE canonical unit per quantity type is stored on measurements. All
 * other units convert to/from it at the ingestion boundary.
 */

// ── Quantity types ────────────────────────────────────────────────────────
export const QUANTITY_TYPE = Object.freeze({
  TIME:       "time",
  MASS:       "mass",
  DISTANCE:   "distance",
  VOLUME:     "volume",
  SPEED:      "speed",
  MONEY:      "money",
  RATIO:      "ratio",
  COUNT:      "count",
  ENERGY:     "energy",
  POWER:      "power",
  TEMPERATURE: "temperature",
  PRESSURE:   "pressure",
  FLOW:       "flow",
  AREA:       "area",
});

// ── Canonical units (one per quantity type) ───────────────────────────────
export const CANONICAL_UNIT = Object.freeze({
  time:        "hours",
  mass:        "tonnes",
  distance:    "metres",
  volume:      "cubic_metres",
  speed:       "km_per_hour",
  money:       "ZAR",
  ratio:       "percent",
  count:       "count",
  energy:      "kilowatt_hours",
  power:       "kilowatts",
  temperature: "celsius",
  pressure:    "kilopascals",
  flow:        "cubic_metres_per_hour",
  area:        "square_metres",
});

// ── Full unit registry ────────────────────────────────────────────────────
// `factor` converts a value IN this unit TO the canonical unit for its type.
// Example: 1 minute = 1/60 hours → factor: 1/60
export const UNITS = Object.freeze({
  // time — canonical: hours
  hours:  { type: "time", label: "hours",  factor: 1 },
  minutes: { type: "time", label: "minutes", factor: 1 / 60 },
  seconds: { type: "time", label: "seconds", factor: 1 / 3600 },
  days:    { type: "time", label: "days",    factor: 24 },
  weeks:   { type: "time", label: "weeks",   factor: 168 },
  months:  { type: "time", label: "months",  factor: 730 }, // average month; explicit calendar uses effective dates

  // mass — canonical: tonnes
  tonnes:    { type: "mass", label: "tonnes",    factor: 1 },
  kilograms: { type: "mass", label: "kilograms", factor: 0.001 },
  grams:     { type: "mass", label: "grams",     factor: 0.000001 },

  // distance — canonical: metres
  metres:     { type: "distance", label: "metres",     factor: 1 },
  kilometres: { type: "distance", label: "kilometres", factor: 1000 },
  centimetres: { type: "distance", label: "centimetres", factor: 0.01 },
  feet:        { type: "distance", label: "feet",        factor: 0.3048 },
  miles:       { type: "distance", label: "miles",       factor: 1609.344 },

  // volume — canonical: cubic metres
  cubic_metres: { type: "volume", label: "m³", factor: 1 },
  litres:       { type: "volume", label: "litres", factor: 0.001 },

  // speed — canonical: km/h
  km_per_hour: { type: "speed", label: "km/h", factor: 1 },
  m_per_sec:   { type: "speed", label: "m/s",  factor: 3.6 },

  // money — canonical: ZAR
  ZAR: { type: "money", label: "ZAR", factor: 1 },
  USD: { type: "money", label: "USD", factor: 18.5 },  // seeded FX; overridden by tenant config
  EUR: { type: "money", label: "EUR", factor: 20.0 },
  GBP: { type: "money", label: "GBP", factor: 23.5 },

  // ratio — canonical: percent
  percent:   { type: "ratio", label: "%",   factor: 1 },
  ratio:     { type: "ratio", label: "ratio", factor: 100 },
  per_tonne: { type: "ratio", label: "/t",  factor: 1 },

  // count — canonical: count
  count:    { type: "count", label: "#",      factor: 1 },
  units:    { type: "count", label: "units",  factor: 1 },
  cycles:   { type: "count", label: "cycles", factor: 1 },
  trips:    { type: "count", label: "trips",  factor: 1 },
  holes:    { type: "count", label: "holes",  factor: 1 },
  events:   { type: "count", label: "events", factor: 1 },

  // energy — canonical: kWh
  kilowatt_hours: { type: "energy", label: "kWh", factor: 1 },
  megawatt_hours: { type: "energy", label: "MWh", factor: 1000 },
  gigajoules:     { type: "energy", label: "GJ",  factor: 277.778 },

  // power — canonical: kW
  kilowatts: { type: "power", label: "kW", factor: 1 },
  megawatts: { type: "power", label: "MW", factor: 1000 },

  // temperature
  celsius:    { type: "temperature", label: "°C", factor: 1 },
  fahrenheit: { type: "temperature", label: "°F", factor: 1 }, // non-linear; use convertTemperature

  // pressure
  kilopascals: { type: "pressure", label: "kPa", factor: 1 },
  bar:         { type: "pressure", label: "bar", factor: 100 },

  // flow
  cubic_metres_per_hour: { type: "flow", label: "m³/h", factor: 1 },
  litres_per_minute:     { type: "flow", label: "L/min", factor: 0.06 },

  // area
  square_metres:     { type: "area", label: "m²", factor: 1 },
  square_kilometres: { type: "area", label: "km²", factor: 1_000_000 },
  hectares:          { type: "area", label: "ha",   factor: 10_000 },

  // special — informational only
  index:        { type: "ratio", label: "index", factor: 1 },
  months_cover: { type: "time", label: "months", factor: 730 },
});

// ── Helpers ───────────────────────────────────────────────────────────────

/** Returns the canonical unit code for a given quantity type. */
export const canonicalUnitFor = (quantityType) => CANONICAL_UNIT[quantityType] || null;

/** Returns the quantity type of a given unit, or null. */
export const quantityTypeOf = (unitCode) => UNITS[unitCode]?.type || null;

/** Human label for a unit code (falls back to the code itself). */
export const unitLabel = (unitCode) => UNITS[unitCode]?.label || unitCode;

/**
 * Convert a value from one unit to its canonical unit.
 * Throws if quantity types don't match (Section 8.4 — reject incompatible units).
 */
export const toCanonical = (value, fromUnit) => {
  const entry = UNITS[fromUnit];
  if (!entry) throw new Error(`Unknown unit: ${fromUnit}`);
  if (entry.type === "temperature") return convertTemperature(value, fromUnit, "celsius");
  if (entry.type === "money") return value * entry.factor; // FX by convention
  return value * entry.factor;
};

/**
 * Convert a value from its canonical unit into a target unit.
 */
export const fromCanonical = (value, toUnit) => {
  const entry = UNITS[toUnit];
  if (!entry) throw new Error(`Unknown unit: ${toUnit}`);
  if (entry.type === "temperature") return convertTemperature(value, "celsius", toUnit);
  return value / entry.factor;
};

/** Temperature is non-linear — handle explicitly. */
export const convertTemperature = (value, fromUnit, toUnit) => {
  let c = value;
  if (fromUnit === "fahrenheit") c = (value - 32) * 5 / 9;
  if (toUnit === "fahrenheit") return c * 9 / 5 + 32;
  return c;
};

/**
 * Generic pairwise conversion. Rejects incompatible quantities.
 * Returns { ok: true, value } or { ok: false, reason }.
 */
export const convert = (value, fromUnit, toUnit) => {
  const from = UNITS[fromUnit];
  const to = UNITS[toUnit];
  if (!from || !to) return { ok: false, reason: `Unknown unit(s): ${fromUnit} → ${toUnit}` };
  if (from.type !== to.type) {
    return { ok: false, reason: `Incompatible quantity types: ${from.type} vs ${to.type}` };
  }
  const canonical = toCanonical(value, fromUnit);
  return { ok: true, value: fromCanonical(canonical, toUnit) };
};

/**
 * Format a numeric value with a unit label. Precision is per-unit:
 * money → 2dp, ratio → 1dp, everything else → trimmed.
 */
export const formatWithUnit = (value, unitCode, { signed = false } = {}) => {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  const entry = UNITS[unitCode];
  const sign = signed && n > 0 ? "+" : "";
  if (entry?.type === "money") {
    const abs = Math.abs(n);
    if (abs >= 1_000_000) return `${sign}R ${(n / 1_000_000).toFixed(2)}m`;
    if (abs >= 1_000) return `${sign}R ${(n / 1_000).toFixed(1)}k`;
    return `${sign}R ${n.toFixed(2)}`;
  }
  if (entry?.type === "ratio") return `${sign}${Number(n.toFixed(1))}%`;
  const abs = Math.abs(n);
  const dp = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  return `${sign}${Number(n.toFixed(dp)).toLocaleString("en-ZA")}${entry?.label ? " " + entry.label : ""}`;
};