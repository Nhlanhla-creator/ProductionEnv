// BIG Score Scoring Methodology v3.0, 29 September 2026.
// These are published weights, not approval probabilities or item-level rubrics.
export const METHODOLOGY_VERSION = "3.0";
export const STAGES = ["startup", "growth", "scaling", "turnaround", "mature"];
export const roundDisplay = n => Math.round(n * 10) / 10;
export function resolveStage(profile = {}) {
  const e = profile.entityOverview || profile;
  const raw = String(e.baseMaturityStage || e.operationStage || "").trim().toLowerCase();
  const aliases = { seed: "startup", ideation: "startup", early: "startup", "pre-seed": "startup", established: "mature", scale: "scaling", "scale-up": "scaling" };
  const base = aliases[raw] || raw;
  const turnaround = e.turnaroundFlag === true || String(e.turnaroundFlag).toLowerCase() === "yes" || raw === "turnaround";
  if (turnaround) return { stage: "turnaround", baseMaturityStage: base === "turnaround" ? null : base, turnaroundFlag: true, status: "assessed" };
  if (STAGES.includes(base)) return { stage: base, baseMaturityStage: base, turnaroundFlag: false, status: "assessed" };
  const years = Number(e.yearsInOperation);
  if (e.yearsInOperation !== "" && e.yearsInOperation != null && Number.isFinite(years) && years >= 0 && years < 6) {
    const stage = years < 3 ? "startup" : "growth";
    return { stage, baseMaturityStage: stage, turnaroundFlag: false, status: "assessed" };
  }
  return { stage: null, baseMaturityStage: null, turnaroundFlag: false, status: "Not assessed", reason: "Record a stage assessment; Scaling and Mature cannot be inferred from age." };
}
// Compatibility lookup only. Consumers must retain resolveStage().status.
export const getStage = p => resolveStage(p).stage || "startup";
const table = (keys, rows) => Object.fromEntries(STAGES.map((s, i) => [s, Object.fromEntries(keys.map((k,j) => [k, rows[i][j]]))]));
export const COMPONENT_WEIGHTS = table(["compliance", "legitimacy", "governanceLeadership", "operational", "capitalAppeal"], [
 [25,25,20,15,15], [20,20,20,18,22], [15,15,22,23,25], [20,12,28,25,15], [15,12,25,23,25]]);
export const COMPLIANCE_WEIGHTS = table(["companyReg","taxClearance","directorIds","bbbee","shareRegister","proofOfAddress","bankLetter","profileCompletion","vat","coida","accreditation"], [
 [20,20,10,10,10,10,10,10,0,0,0], [16,19,9,13,9,7,8,8,6,5,0], [13,16,6,13,9,5,6,6,9,9,8], [13,19,6,13,9,5,7,6,9,9,4], [11,17,6,13,9,6,6,6,9,9,8]]);
export const LEGITIMACY_WEIGHTS = table(["foundational","digital","track","thirdParty"], [
 [35,25,15,25], [28,22,25,25], [22,20,30,28], [20,15,30,35], [18,17,30,35]]);
export const DOMAIN_WEIGHTS = table(["leadership","governance"], [[65,35],[55,45],[45,55],[55,45],[35,65]]);
export const GOVERNANCE_SPLITS = table(["ownership","maturity"], [[55,45],[48,52],[42,58],[45,55],[40,60]]);
export function sectionWeights(stage) {
 const d = DOMAIN_WEIGHTS[stage], g = GOVERNANCE_SPLITS[stage];
 return { leadership: d.leadership, ownership: d.governance * g.ownership / 100, maturity: d.governance * g.maturity / 100 };
}
export const LEADERSHIP_WEIGHTS = table(["credentials","structure","behaviour"], [[50,20,30],[44,28,28],[38,36,26],[40,34,26],[32,42,26]]);
export const MATURITY_WEIGHTS = table(["board","strategic","policies","transparency","risk"], [[10,30,25,20,15],[20,27,22,18,13],[28,24,20,16,12],[30,25,15,15,15],[35,20,15,15,15]]);
export const OWNERSHIP_WEIGHTS = table(["shareholders","directors","executives","advisors","baseline"], [[30,34,22,9,5],[30,32,22,11,5],[28,32,22,13,5],[30,33,22,10,5],[29,32,23,11,5]]);
export const OPERATIONAL_WEIGHTS = table(["delivery","supplierContinuity","premises","safety"], [[30,25,25,20],[30,25,23,22],[30,30,20,20],[35,30,15,20],[30,25,20,25]]);
export const FINANCIAL_WEIGHTS = table(["revenue","records","balanceSheet","debt","credit"], [[25,35,20,10,10],[30,25,20,15,10],[30,15,25,20,10],[20,15,25,30,10],[30,10,25,20,15]]);
export const CAPITAL_SPLITS = table(["financialStrength","fundability"], [[40,60],[50,50],[55,45],[55,45],[65,35]]);
export const FUNDABILITY_WEIGHTS = table(["businessPlan","growthPotential","pitchDeck","impactMandate","financialResilience","creditworthiness","guarantees"], [[26,18,16,12,12,10,6],[22,12,12,11,16,17,10],[18,8,9,9,19,23,14],[24,4,7,9,18,20,18],[14,7,5,8,21,28,17]]);
const FACTORS = ["businessPlan","growthPotential","pitchDeck","impactMandate","financialResilience","creditworthiness","guarantees"];
export const INSTRUMENT_MATRIX = {
 grant: ["Y","C","C","Y","C","—","—"],
 po_contract: ["Y","C","—","C","Y","Y","Y"],
 invoice_receivable: ["C","—","—","C","Y","Y","Y"],
 asset_lease: ["Y","C","—","C","Y","Y","Y"],
 term_revolving_bridge: ["Y","C","C","C","Y","Y","C"],
 equity: ["Y","Y","Y","C","Y","—","—"],
 convertible_revenue_mezzanine: ["Y","C","C","C","Y","C","C"],
};
// Explicit supported codes/labels only: never derive applicability from amount,
// broad category, support focus or preferred funder. Unknown codes stay unknown.
export function resolveInstrument(value) {
 const code = String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
 const aliases = { grants:"grant", purchase_order:"po_contract", purchase_order_finance:"po_contract", contract_finance:"po_contract", po_finance:"po_contract", invoice_finance:"invoice_receivable", invoice_discounting:"invoice_receivable", receivables_finance:"invoice_receivable", asset_finance:"asset_lease", leasing:"asset_lease", term_loan:"term_revolving_bridge", revolving_credit:"term_revolving_bridge", bridge_finance:"term_revolving_bridge", convertible_note:"convertible_revenue_mezzanine", revenue_based_finance:"convertible_revenue_mezzanine", mezzanine:"convertible_revenue_mezzanine" };
 return INSTRUMENT_MATRIX[code] ? code : aliases[code] || null;
}
export function fundabilityWeights(stage, instrument, conditionalRules = {}) {
 const matrix = INSTRUMENT_MATRIX[instrument];
 if (!matrix) return null;
 const weights = {}, excluded = {}, active = [];
 FACTORS.forEach((key,i) => {
   const rule = conditionalRules[key];
   const enabled = matrix[i] === "Y" || (matrix[i] === "C" && rule?.approved === true && !!rule.version && !!rule.reason);
   weights[key] = enabled ? FUNDABILITY_WEIGHTS[stage][key] : 0;
   if (enabled) active.push(key);
   else excluded[key] = matrix[i] === "C" ? "Conditional: no approved versioned activation rule with a reason." : "Outside scope for this instrument.";
 });
 const denominator = active.reduce((s,k) => s + weights[k],0);
 if (!denominator) return null;
 active.forEach(k => { weights[k] = 100 * weights[k] / denominator; });
 return { ...weights, _excluded: excluded, _reduced: {}, _instrument: instrument, _active: active };
}
// Largest-remainder display allocation; internal weights retain full precision.
export function displayWeights(weights) {
 const rows = Object.entries(weights).filter(([,v]) => Number.isFinite(v));
 const scaled = rows.map(([key,value]) => ({ key, value: Math.floor(value*10 + 1e-9), fraction: value*10 - Math.floor(value*10 + 1e-9) }));
 const remaining = 1000 - scaled.reduce((s,r) => s+r.value,0);
 scaled.slice().sort((a,b) => b.fraction-a.fraction).slice(0,Math.max(0,remaining)).forEach(r => r.value++);
 return Object.fromEntries(scaled.map(r => [r.key,r.value/10]));
}
export function universalGate(items = []) {
 const caps = { companyReg:40, taxClearance:50, directorIds:60 };
 const pending = items.filter(i => caps[i.key] && i.present && ["pending","unverified","uploaded","unverifiable","unknown"].includes(i.state));
 const failed = items.filter(i => caps[i.key] && !pending.includes(i) && (!i.present || i.credit === 0));
 return { status:pending.length ? "Provisional" : "assessed", pending:pending.map(i => i.key), cap: failed.length ? Math.min(...failed.map(i => caps[i.key])) : 100, reasons: failed.map(i => i.key) };
}
export function calculateOriginalBIG({ profileData, scores, complianceItems = [], status = "assessed" }) {
 const stageInfo = resolveStage(profileData);
 const missing = Object.keys(COMPONENT_WEIGHTS.startup).filter(k => !Number.isFinite(scores[k]) || scores[k] < 0 || scores[k] > 100);
 // Gate evidence is mandatory; an absent evidence array must not imply a pass.
 if (!stageInfo.stage || stageInfo.status !== "assessed" || missing.length || status !== "assessed" || !["companyReg","taxClearance","directorIds"].every(k => complianceItems.some(i => i.key === k)))
   return { status: "Not assessed", stageInfo, missing, methodologyVersion:METHODOLOGY_VERSION };
 const weights = COMPONENT_WEIGHTS[stageInfo.stage];
 const contributions = Object.fromEntries(Object.entries(weights).map(([k,w]) => [k,scores[k]*w/100]));
 const preCap = Object.values(contributions).reduce((s,v) => s+v,0), gate = universalGate(complianceItems);
 if (gate.status !== "assessed") return { status:"Provisional", stageInfo,gate,methodologyVersion:METHODOLOGY_VERSION };
 return { status:"assessed", stageInfo, weights, contributions, preCap, gate, final:Math.min(preCap,gate.cap), display:roundDisplay(Math.min(preCap,gate.cap)), methodologyVersion:METHODOLOGY_VERSION };
}
