// src/smses/MyGrowthTools/shared/csvUploadUtils.js
/**
 * Shared CSV Utility Module for Growth Suite Tools
 * Supports:
 * - Environment detection (test vs production)
 * - CSV template generation for active frequencies (Monthly, Weekly, Daily)
 * - Robust CSV parsing with quoted strings and metadata comments
 * - KPI resolution (by ID first, fallback to exact Name)
 * - Auto-calculated KPI detection and skipping
 * - Automatic variance column detection and skipping
 * - Contextual numeric validation
 * - Non-destructive preservation of blank cells
 */

// ── 1. Environment Detection ──────────────────────────────────────────────────
export const isTestEnvironment = () => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname || "";
  // Explicitly disallow production domains
  if (
    host === "www.bigmarketplace.africa" ||
    host === "bigmarketplace.africa" ||
    host === "production-environment-cf7da.firebaseapp.com" ||
    host.endsWith(".africa")
  ) {
    return false;
  }
  // Allow localhost, local IPs, and .biz test/demo domains
  return host === "localhost" || host.includes(".biz") || host === "127.0.0.1";
};

// ── 2. CSV String Helpers ────────────────────────────────────────────────────
export const escapeCsvField = (v) => {
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

export const downloadBlob = (content, filename, mimeType = "text/csv;charset=utf-8;") => {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ── 3. CSV Template Generator ────────────────────────────────────────────────
/**
 * Generates pre-formatted CSV template matching the selected section, frequency, and columns
 */
export const generateKpiCsvTemplate = ({
  tabName = "Section",
  yearLabel = "",
  frequency = "Monthly",
  columns = [],
  kpiRows = [],
}) => {
  const lines = [];

  // Metadata comments for self-documenting templates
  lines.push(`# Section: ${tabName}`);
  lines.push(`# Financial Year: ${yearLabel}`);
  lines.push(`# Frequency: ${frequency}`);
  lines.push(`# Instructions: Fill in numeric columns only. Leave blank to preserve existing data. Variance columns are ignored.`);

  // Headers: KPI ID, KPI Name, Category, Type, <Date columns...>
  const headerCols = ["KPI ID", "KPI Name", "Category", "Type", ...columns.map((c) => c.label)];
  lines.push(headerCols.map(escapeCsvField).join(","));

  // Rows for each editable KPI
  kpiRows.forEach(({ kpi, category }) => {
    const hasBudget = !!kpi.field?.b || kpi.custom || frequency !== "Monthly";

    if (hasBudget) {
      const budgetRow = [kpi.id, kpi.name, category, "Budget", ...columns.map(() => "")];
      lines.push(budgetRow.map(escapeCsvField).join(","));
    }

    const actualRow = [kpi.id, kpi.name, category, "Actual", ...columns.map(() => "")];
    lines.push(actualRow.map(escapeCsvField).join(","));
  });

  return lines.join("\r\n");
};

// ── 4. CSV Line / Field Tokenizer ────────────────────────────────────────────
export const parseCsvLines = (text) => {
  const result = [];
  let row = [];
  let curr = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        curr += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      row.push(curr.trim());
      curr = "";
    } else if ((ch === "\r" || ch === "\n") && !inQuotes) {
      if (ch === "\r" && next === "\n") i++; // skip \r\n
      row.push(curr.trim());
      curr = "";
      if (row.length > 0 && row.some((c) => c.length > 0)) {
        result.push(row);
      }
      row = [];
    } else {
      curr += ch;
    }
  }

  if (curr.length > 0 || row.length > 0) {
    row.push(curr.trim());
    if (row.some((c) => c.length > 0)) {
      result.push(row);
    }
  }

  return result;
};

// ── 5. CSV Parser & Validator ────────────────────────────────────────────────
/**
 * Parses and validates uploaded CSV text.
 *
 * @param {string} csvText
 * @param {object} options
 * @param {Array} options.columns - Array of UI date column objects { key, label, long, year, month }
 * @param {Array} options.editableKpis - List of KPIs that accept direct numeric input
 * @param {Array} options.allKpis - Complete list of KPIs (including calculated) to identify skipped metrics
 * @param {string} options.currentTabName - Name of current tab/section
 * @param {string} options.currentYear - Financial year currently active
 */
export const parseKpiCsv = (csvText, {
  columns = [],
  editableKpis = [],
  allKpis = [],
  currentTabName = "",
  currentYear = "",
}) => {
  const errors = [];
  const warnings = [];
  const info = [];
  const metadata = {
    section: currentTabName,
    year: currentYear,
  };

  if (!csvText || typeof csvText !== "string") {
    return {
      isValid: false,
      validCount: 0,
      updates: [],
      errors: ["The uploaded file is empty or unreadable."],
      warnings: [],
      info: [],
      metadata,
    };
  }

  const rawRows = parseCsvLines(csvText);
  if (!rawRows.length) {
    return {
      isValid: false,
      validCount: 0,
      updates: [],
      errors: ["No valid data rows found in CSV."],
      warnings: [],
      info: [],
      metadata,
    };
  }

  // Separate metadata comments (# ...) from table rows
  const dataRows = [];
  rawRows.forEach((r, idx) => {
    if (r.length > 0 && r[0].startsWith("#")) {
      const line = r.join(" ");
      const sectionMatch = line.match(/#\s*Section:\s*(.+)/i);
      if (sectionMatch) metadata.section = sectionMatch[1].trim();
      const yearMatch = line.match(/#\s*Financial\s*Year:\s*(.+)/i);
      if (yearMatch) metadata.year = yearMatch[1].trim();
      return;
    }
    dataRows.push({ rowIndex: idx + 1, row: r });
  });

  if (!dataRows.length) {
    return {
      isValid: false,
      validCount: 0,
      updates: [],
      errors: ["CSV contains only metadata comments, no data headers found."],
      warnings,
      info,
      metadata,
    };
  }

  // Header row
  const headerObj = dataRows[0];
  const headers = headerObj.row;
  const headerLower = headers.map((h) => h.toLowerCase().trim());

  // Detect key column indices
  let idIdx = headerLower.findIndex((h) => h === "kpi id" || h === "id" || h === "kpi_id");
  let nameIdx = headerLower.findIndex((h) => h === "kpi name" || h === "kpi" || h === "name" || h === "metric");
  let catIdx = headerLower.findIndex((h) => h === "category" || h === "cat");
  let typeIdx = headerLower.findIndex((h) => h === "type" || h === "mode" || h === "budget/actual" || h === "kind");

  if (nameIdx === -1 && idIdx === -1) {
    return {
      isValid: false,
      validCount: 0,
      updates: [],
      errors: [`Header row (line ${headerObj.rowIndex}) is missing a 'KPI Name' or 'KPI ID' column.`],
      warnings,
      info,
      metadata,
    };
  }

  if (typeIdx === -1) {
    return {
      isValid: false,
      validCount: 0,
      updates: [],
      errors: [`Header row (line ${headerObj.rowIndex}) is missing a 'Type' column (must specify 'Budget' or 'Actual').`],
      warnings,
      info,
      metadata,
    };
  }

  // Identify Date Columns and map them to UI column keys
  const dateColMap = []; // { colIdx, colHeader, uiCol: { key, label } }
  headers.forEach((h, cIdx) => {
    if (cIdx === idIdx || cIdx === nameIdx || cIdx === catIdx || cIdx === typeIdx) return;
    const cleanH = h.trim();
    if (!cleanH) return;

    // Detect variance columns and safely ignore
    if (/variance/i.test(cleanH)) {
      info.push(`Column "${cleanH}" detected as Variance — ignored during upload (calculated automatically).`);
      return;
    }

    // Match column to active UI columns
    const matchedUiCol = columns.find((c) => {
      const cLabel = c.label.toLowerCase().trim();
      const colNorm = cleanH.toLowerCase().trim();
      if (cLabel === colNorm) return true;
      if (c.key && c.key.toLowerCase().trim() === colNorm) return true;
      if (c.long && c.long.toLowerCase().trim() === colNorm) return true;
      // Partial matching for formats like "Jan 26" vs "Jan 2026" or "01 Jan"
      const simplified1 = cLabel.replace(/[\s\-_]/g, "");
      const simplified2 = colNorm.replace(/[\s\-_]/g, "");
      return simplified1 === simplified2;
    });

    if (matchedUiCol) {
      dateColMap.push({ colIdx: cIdx, colHeader: cleanH, uiCol: matchedUiCol });
    } else {
      info.push(`Column "${cleanH}" does not match any period in the active view — ignored.`);
    }
  });

  if (!dateColMap.length) {
    return {
      isValid: false,
      validCount: 0,
      updates: [],
      errors: [`No matching period date columns found in header row (line ${headerObj.rowIndex}). Expected columns like ${columns.slice(0, 3).map((c) => `"${c.label}"`).join(", ")}`],
      warnings,
      info,
      metadata,
    };
  }

  // Fast lookup maps for KPIs
  const editableById = new Map();
  const editableByName = new Map();
  editableKpis.forEach((k) => {
    if (k.id) editableById.set(k.id.trim(), k);
    if (k.name) editableByName.set(k.name.trim().toLowerCase(), k);
  });

  const allById = new Map();
  const allByName = new Map();
  allKpis.forEach((k) => {
    if (k.id) allById.set(k.id.trim(), k);
    if (k.name) allByName.set(k.name.trim().toLowerCase(), k);
  });

  const updates = []; // Array of { kpi, which, periodKey, value, raw, colLabel, rowIndex }

  // Process data rows
  for (let r = 1; r < dataRows.length; r++) {
    const { rowIndex, row } = dataRows[r];
    const rawId = idIdx !== -1 && row[idIdx] ? row[idIdx].trim() : "";
    const rawName = nameIdx !== -1 && row[nameIdx] ? row[nameIdx].trim() : "";
    const rawType = typeIdx !== -1 && row[typeIdx] ? row[typeIdx].trim().toLowerCase() : "";

    // Skip empty rows
    if (!rawId && !rawName && (!row.some((cell, i) => i !== idIdx && i !== nameIdx && cell.trim().length > 0))) {
      continue;
    }

    // 1. KPI Resolution
    let matchedKpi = null;
    let matchMethod = null;

    if (rawId && editableById.has(rawId)) {
      matchedKpi = editableById.get(rawId);
      matchMethod = "id";
    } else if (rawName && editableByName.has(rawName.toLowerCase())) {
      matchedKpi = editableByName.get(rawName.toLowerCase());
      matchMethod = "name";
      if (!rawId) {
        warnings.push(`Row ${rowIndex}: Matched KPI "${matchedKpi.name}" by name (KPI ID was blank).`);
      }
    } else {
      // Check if it's a known calculated KPI
      const isCalculated = (rawId && allById.has(rawId)) || (rawName && allByName.has(rawName.toLowerCase()));
      if (isCalculated) {
        const calcKpi = (rawId && allById.get(rawId)) || allByName.get(rawName.toLowerCase());
        info.push(`Row ${rowIndex}: "${calcKpi.name || rawName}" is an auto-calculated metric and was safely skipped.`);
        continue;
      }

      // If unresolved, flag as error
      const missingIdentifier = rawName || rawId || `Row ${rowIndex}`;
      errors.push(`Row ${rowIndex}: Unknown KPI "${missingIdentifier}". Could not match to any editable KPI in this section.`);
      continue;
    }

    // 2. Type Resolution (Budget vs Actual)
    let which = null;
    if (rawType === "budget" || rawType === "target" || rawType === "b") {
      which = "budget";
    } else if (rawType === "actual" || rawType === "act" || rawType === "a") {
      which = "actual";
    } else {
      errors.push(`Row ${rowIndex} for "${matchedKpi.name}": Invalid Type "${row[typeIdx] || ""}". Must be "Budget" or "Actual".`);
      continue;
    }

    // Check if KPI supports budget
    if (which === "budget" && !matchedKpi.field?.b && !matchedKpi.custom && matchedKpi.frequency === "Monthly") {
      warnings.push(`Row ${rowIndex}: "${matchedKpi.name}" does not take a Budget entry — Budget values skipped.`);
      continue;
    }

    // 3. Process Date Column Values
    let rowValuesCount = 0;
    for (const { colIdx, colHeader, uiCol } of dateColMap) {
      const cellRaw = row[colIdx];
      if (cellRaw === undefined || cellRaw === null) continue;
      const trimmed = String(cellRaw).trim();

      // Blank cells are preserved (non-destructive)
      if (trimmed === "" || trimmed === "—" || trimmed === "-") {
        continue;
      }

      // Clean numeric string
      const sanitized = trimmed
        .replace(/^[R$€£]/, "") // strip leading currency
        .replace(/%$/, "")      // strip trailing percentage
        .replace(/,/g, "")      // strip comma thousands separators
        .trim();

      const numVal = Number(sanitized);
      if (!Number.isFinite(numVal)) {
        errors.push(`Row ${rowIndex}, Column "${colHeader}": "${trimmed}" is not a valid number for ${matchedKpi.name} (${which}).`);
        continue;
      }

      // Optional contextual sanity checks
      if (matchedKpi.units === "%" && (numVal < -500 || numVal > 1000)) {
        warnings.push(`Row ${rowIndex}, Column "${colHeader}": Value ${numVal}% for "${matchedKpi.name}" is unusually high or low.`);
      }

      updates.push({
        kpi: matchedKpi,
        which,
        periodKey: uiCol.key,
        value: numVal,
        raw: String(numVal),
        colLabel: uiCol.label,
        rowIndex,
      });
      rowValuesCount++;
    }
  }

  const isValid = errors.length === 0 && updates.length > 0;

  return {
    isValid,
    validCount: updates.length,
    updates,
    errors,
    warnings,
    info,
    metadata,
  };
};
