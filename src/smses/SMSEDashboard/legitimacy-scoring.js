// ─────────────────────────────────────────────────────────────────────────
// LEGITIMACY — SCORING
//
// Where each answer comes from:
//
//   DOCUMENTS — already decided. validateMyDocument read the actual file
//   with Gemini at upload time: document type, company name, expiry date.
//   That verdict is stored on the profile, so this reads it and nothing
//   else. Verified → full points. Rejected or expired → no points, with
//   the reason the user already saw in My Documents. No second opinion,
//   no filename guessing, no "unchecked" caveat.
//
//   FREE TEXT — website, email, address, social handles, client names,
//   brands. Nothing has ever checked these, so a small AI ballot returns
//   one of five verdicts per entry, cached against a fingerprint of the
//   exact value so the same entry always scores the same.
//
//   ARITHMETIC — always the code. Verdict → credit → item points →
//   category percentage → stage weight → final score. No model touches a
//   number, which is what makes "+5.6%" a promise rather than a guess.
// ─────────────────────────────────────────────────────────────────────────

export const CATEGORY_LABELS = {
  foundational: "Foundational business identity",
  digital: "Digital presence & discoverability",
  track: "Track record indicators",
  thirdParty: "Third-party validations",
}
export const CATEGORY_HEADINGS = {
  foundational: "Identity Markers",
  digital: "Digital Presence",
  track: "Track Record",
  thirdParty: "Third-Party Validation",
}
export const CATEGORY_COLORS = {
  foundational: "#8D6E63",
  digital: "#6D4C41",
  track: "#A67C52",
  thirdParty: "#D7CCC8",
}

export const weightingsByStage = {
  startup:    { foundational: 35, digital: 25, track: 15, thirdParty: 25 },
  growth:     { foundational: 28, digital: 22, track: 25, thirdParty: 25 },
  scaling:    { foundational: 22, digital: 20, track: 30, thirdParty: 28 },
  turnaround: { foundational: 30, digital: 18, track: 28, thirdParty: 24 },
  mature:     { foundational: 18, digital: 17, track: 30, thirdParty: 35 },
}

export const STAGE_LABELS = {
  startup: "Startup (0–3 years)",
  growth: "Growth (3–6 years)",
  scaling: "Scaling",
  turnaround: "Turnaround",
  mature: "Mature",
}

const mapStageToCategory = (stage) => {
  const s = (stage || "").toLowerCase().trim()
  if (["startup", "seed", "ideation", "early"].includes(s)) return "startup"
  if (s === "growth") return "growth"
  if (s === "scaling" || s === "scale") return "scaling"
  if (s === "turnaround") return "turnaround"
  if (s === "mature" || s === "established") return "mature"
  return "startup"
}

const CLIENT_TARGET = { startup: 2, growth: 3, scaling: 5, turnaround: 3, mature: 6 }

// ─────────────────────────────────────────────────────────────────────────
// ROUTING
//
// WHAT WAS WRONG
//
//   Every item carried a display string — "Contact Details → add website" —
//   and parseWhere reverse-engineered a route out of it by splitting on the
//   arrow and matching the left half against a lookup table. So the route
//   depended on the prose. Change "Contact Details" to "Your contact
//   details" and the lookup misses, parseWhere returns route: null, and the
//   button silently disables. Every document item also resolved to the same
//   bare /my-documents, so a business told "your B-BBEE certificate expired"
//   landed on a page of forty rows with no idea which one.
//
//   Routes are now declared per item, in the same shape the other four
//   cards use: /profile?section=<camelCaseKey>, and documents deep-link to
//   the row for that document type. The display string is display only.
//
//   TWO VALUES TO CONFIRM AGAINST YOUR ROUTER: the documents page path, and
//   the query parameter its row-scroll reads. Both are here, once.
// ─────────────────────────────────────────────────────────────────────────

export const PROFILE_ROUTE = "/profile"
export const DOCUMENTS_ROUTE = "/my-documents"
const DOCUMENT_PARAM = "document"

// The profile page renders every section from one route via `activeSection`,
// so a section link is ?section=<key> rather than a path per section.
export const profileRoute = (sectionKey) => `${PROFILE_ROUTE}?section=${sectionKey}`
export const documentRoute = (documentId) =>
  documentId ? `${DOCUMENTS_ROUTE}?${DOCUMENT_PARAM}=${documentId}` : DOCUMENTS_ROUTE

export const SECTIONS = {
  contactDetails: { key: "contactDetails", label: "Contact Details" },
  entityOverview: { key: "entityOverview", label: "Entity Overview" },
  productsServices: { key: "productsServices", label: "Products & Services" },
  financialOverview: { key: "financialOverview", label: "Financial Overview" },
}
const S = (name) => SECTIONS[name]

// ─────────────────────────────────────────────────────────────────────────
// DOCUMENT VERDICTS — read straight from what validateMyDocument stored
//
// Two storage locations, because MyDocuments has two upload paths:
//   Single upload → uploadDocumentWithSync → verification.{documentId}
//   Multi upload  → documents.{documentId}_multiple[i]
// Both are read. Several id spellings are tried so this keeps working
// whatever getDocumentId returns.
// ─────────────────────────────────────────────────────────────────────────

// validateMyDocument's own status vocabulary. Only these two are a pass.
const PASS_STATUSES = new Set(["verified", "verified:not_audited"])

// What each failure means, in the same words the user saw in My Documents.
const DOC_FAIL = {
  expired: {
    reason: "This document has expired.",
    fix: "Upload a current copy — My Documents → find the row → Update.",
  },
  incomplete: {
    reason: "This is the right document, but required details could not be found on it.",
    fix: "Check every page is included, then re-upload it in My Documents.",
  },
  name_mismatch: {
    reason: "The company name on this document does not match your registered name.",
    fix: "Upload the copy issued in your registered company name, or correct the registered name under Entity Overview.",
  },
  wrong_type: {
    reason: "The file uploaded is not this document.",
    fix: "Upload the correct document in My Documents.",
  },
  rejected: {
    reason: "This document could not be verified.",
    fix: "Re-upload a clear, complete copy in My Documents.",
  },
}

// The FIRST id in each list is the canonical one — it is what the documents
// page uses as its row key, so it is what the deep link carries.
export const DOC_SOURCES = {
  proofOfAddress: ["proof_of_address", "proofOfAddress"],
  bbbee: ["bbbee_certificate", "bbbeeCert", "bbbee"],
  companyReg: ["company_registration", "registrationCertificate", "companyRegistration"],
  taxClearance: ["tax_clearance", "taxClearanceCert", "taxClearance"],
  accreditation: ["industry_accreditations", "industryAccreditationDocs", "industryAccreditations"],
  supportLetters: ["client_references", "clientReferencesAndSupportLetters", "Client References & Support Letters"],
  companyProfile: ["business_profile", "companyProfile"],
}

const cleanStr = (v) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim())

const urlOf = (v) => {
  if (!v) return ""
  if (typeof v === "string") return cleanStr(v)
  if (typeof v === "object") return cleanStr(v.url)
  return ""
}

// Every stored copy of a document, from either upload path.
const collectCopies = (data, ids) => {
  const out = []
  const docs = data?.documents || {}
  const legal = data?.legalCompliance || {}
  const entity = data?.entityOverview || {}
  const contact = data?.contactDetails || {}

  ids.forEach((id) => {
    // Multi-upload array
    const arr = docs[`${id}_multiple`]
    if (Array.isArray(arr)) {
      arr.filter((d) => urlOf(d)).forEach((d) =>
        out.push({
          url: urlOf(d),
          status: cleanStr(d.status) || "verified",   // pre-validation uploads count
          message: cleanStr(d.message),
          name: d.customName || null,
        })
      )
    }

    // Single upload: the file lives in documents/legalCompliance/etc,
    // the verdict lives in verification.{id}
    const single = urlOf(docs[id]) || urlOf(legal[id]) || urlOf(entity[id]) || urlOf(contact[id])
    const verification = data?.verification?.[id]
    if (single || verification?.status) {
      out.push({
        url: single,
        status: cleanStr(verification?.status) || "verified",
        message: cleanStr(verification?.message),
        extractedCompanyName: verification?.extractedCompanyName || null,
      })
    }
  })

  // De-duplicate on url
  const seen = new Set()
  return out.filter((d) => {
    const k = d.url || `${d.status}|${d.message}`
    return seen.has(k) ? false : seen.add(k)
  })
}

// One document item's answer: present, and does it count?
// The BEST copy wins — a valid certificate sitting next to an old expired
// one is a business with a valid certificate.
const readDocVerdict = (data, itemKey) => {
  const copies = collectCopies(data, DOC_SOURCES[itemKey] || [itemKey])
  if (!copies.length) return { present: false, credit: 0, copies: 0, verified: 0 }

  const passing = copies.filter((d) => PASS_STATUSES.has(d.status))
  if (passing.length) {
    return {
      present: true, credit: 1, status: "verified",
      copies: copies.length, verified: passing.length,
      note: copies.length > passing.length
        ? `${copies.length - passing.length} older cop${copies.length - passing.length === 1 ? "y is" : "ies are"} still on file with a failed status; the verified copy is what counts.`
        : null,
    }
  }

  // Nothing passed — report the least-bad failure
  const worst = copies[0]
  const fail = DOC_FAIL[worst.status] || DOC_FAIL.rejected
  return {
    present: true, credit: 0, status: worst.status,
    copies: copies.length, verified: 0,
    reason: worst.message && worst.message !== "Document verified" ? worst.message : fail.reason,
    fix: fail.fix,
    extractedCompanyName: worst.extractedCompanyName || null,
  }
}

// ─────────────────────────────────────────────────────────────────────────
// FREE-TEXT VERDICTS — the only thing the AI still judges
// ─────────────────────────────────────────────────────────────────────────
export const VERDICT_CREDIT = {
  valid: 1,
  weak: 0.6,
  questionable: 0.3,
  invalid: 0,
  unverifiable: 1,
}

export const STATE_STYLE = {
  valid:        { dot: "#4CAF50", label: "Counted in full" },
  verified:     { dot: "#4CAF50", label: "Verified at upload" },
  weak:         { dot: "#FFC107", label: "Counted at 60%" },
  questionable: { dot: "#FF9800", label: "Counted at 30%" },
  invalid:      { dot: "#B71C1C", label: "Not counted" },
  expired:      { dot: "#B71C1C", label: "Not counted — expired" },
  wrong_type:   { dot: "#B71C1C", label: "Not counted — wrong document" },
  name_mismatch:{ dot: "#B71C1C", label: "Not counted — name mismatch" },
  incomplete:   { dot: "#B71C1C", label: "Not counted — incomplete" },
  rejected:     { dot: "#B71C1C", label: "Not counted — rejected" },
  unverifiable: { dot: "#4CAF50", label: "Counted in full" },
  pending:      { dot: "#90A4AE", label: "Counted — check queued" },
  failed:       { dot: "#B71C1C", label: "Not counted — failed format check" },
  partial:      { dot: "#FF9800", label: "Partly counted" },
  missing:      { dot: "#F44336", label: "Not provided" },
}

// A failed document is a different problem from a blank field, and it is the
// one worth putting on the front page.
export const DOC_FAIL_STATES = new Set(["expired", "wrong_type", "name_mismatch", "incomplete", "rejected"])

// ─────────────────────────────────────────────────────────────────────────
// DIGITAL PRESENCE — industry-relevant channels only
// ─────────────────────────────────────────────────────────────────────────
const DIGITAL_PROFILES = [
  {
    key: "agriculture", label: "Agriculture / farming / primary industry",
    test: /agri|farm|crop|livestock|poultry|forestr|fish|aquacult|mining|quarry/i,
    channels: [
      { key: "website", label: "Website", points: 40, where: "add professional website URL" },
      { key: "facebook", label: "Facebook page", points: 30, where: "add Facebook page" },
      { key: "whatsapp", label: "WhatsApp Business", points: 30, where: "add WhatsApp Business number" },
    ],
    bonus: ["linkedin", "instagram"], irrelevant: ["x", "youtube"],
  },
  {
    key: "construction", label: "Construction / trade / property",
    test: /construct|build|civil|engineer|electric|plumb|property|real estate|contract/i,
    channels: [
      { key: "website", label: "Website", points: 40, where: "add professional website URL" },
      { key: "linkedin", label: "LinkedIn profile", points: 30, where: "add LinkedIn profile" },
      { key: "facebook", label: "Facebook page", points: 30, where: "add Facebook page" },
    ],
    bonus: ["instagram", "whatsapp"], irrelevant: ["x", "youtube"],
  },
  {
    key: "consumer", label: "Retail / hospitality / consumer",
    test: /retail|shop|store|restaurant|hospitality|tourism|food|beverage|fashion|beauty|salon|cater/i,
    channels: [
      { key: "instagram", label: "Instagram account", points: 35, where: "add Instagram account" },
      { key: "facebook", label: "Facebook page", points: 35, where: "add Facebook page" },
      { key: "website", label: "Website", points: 30, where: "add professional website URL" },
    ],
    bonus: ["whatsapp", "youtube"], irrelevant: ["x", "linkedin"],
  },
  {
    key: "professional", label: "Professional services / consulting / technology",
    test: /consult|advisor|profession|account|legal|law|financ|insur|technolog|software|\bIT\b|digital|media|market|recruit|train|educat/i,
    channels: [
      { key: "linkedin", label: "LinkedIn profile", points: 40, where: "add LinkedIn profile" },
      { key: "website", label: "Website", points: 35, where: "add professional website URL" },
      { key: "x", label: "X (Twitter) account", points: 25, where: "add X/Twitter account" },
    ],
    bonus: ["facebook", "instagram", "youtube"], irrelevant: [],
  },
]

const DEFAULT_DIGITAL_PROFILE = {
  key: "general", label: "General business",
  channels: [
    { key: "website", label: "Website", points: 40, where: "add professional website URL" },
    { key: "linkedin", label: "LinkedIn profile", points: 30, where: "add LinkedIn profile" },
    { key: "facebook", label: "Facebook page", points: 30, where: "add Facebook page" },
  ],
  bonus: ["instagram", "whatsapp"], irrelevant: ["x", "youtube"],
}

const pickDigitalProfile = (industry) =>
  DIGITAL_PROFILES.find((p) => p.test.test(String(industry || ""))) || DEFAULT_DIGITAL_PROFILE

// ─────────────────────────────────────────────────────────────────────────
// Readers and format checks for free-text fields
// ─────────────────────────────────────────────────────────────────────────
const SOCIAL_BASE = {
  facebook: "https://facebook.com/", x: "https://x.com/", twitter: "https://twitter.com/",
  linkedin: "https://www.linkedin.com/in/", instagram: "https://instagram.com/",
  youtube: "https://youtube.com/", website: "",
}

const normalizeSocial = (platform, value) => {
  const v = cleanStr(value)
  if (!v) return ""
  if (/^https?:\/\//i.test(v)) return v
  const handle = v.replace(/^@/, "")
  if (platform === "website") return `https://${handle}`
  const base = SOCIAL_BASE[platform] ?? ""
  return base ? `${base}${handle}` : handle
}

const PLACEHOLDER = /^(n\/?a|na|none|nil|null|tbc|tba|test+|todo|xxx+|unknown|not applicable|[-._\s]*|0+)$/i
const isPlaceholder = (v) => {
  const s = cleanStr(v)
  if (!s) return true
  if (PLACEHOLDER.test(s)) return true
  if (/^(.)\1{2,}$/.test(s.replace(/\s/g, ""))) return true
  if (/^(asdf|qwerty|abcd)/i.test(s)) return true
  return false
}

const SOCIAL_HOSTS = /(facebook|fb)\.com|instagram\.com|linkedin\.com|twitter\.com|x\.com|tiktok\.com|wa\.me|whatsapp\.com|youtube\.com|youtu\.be|linktr\.ee/i
const FREE_MAIL = /@(gmail|yahoo|hotmail|outlook|live|icloud|aol|webmail|mail|protonmail|zoho|yandex|mweb|telkomsa|vodamail)\./i
const IMG_EXT = /\.(png|jpe?g|webp|svg|heic|gif)(\?|$)/i
const hostOf = (url) => { try { return new URL(url).hostname.toLowerCase() } catch { return "" } }

const T1_OK = { credit: 1, reason: null, fix: null }
const t1Fail = (reason, fix) => ({ credit: 0, reason, fix, hardFail: true })

const TIER1 = {
  website: (v) => {
    const url = /^https?:\/\//i.test(v) ? v : `https://${v}`
    const host = hostOf(url)
    if (!host || !/\.[a-z]{2,}$/i.test(host))
      return t1Fail("This is not a working web address.", "Enter the full URL including the domain, e.g. https://yourbusiness.co.za")
    if (SOCIAL_HOSTS.test(host))
      return t1Fail(
        "This is a social page, not a website. It already counts under Digital Presence, so counting it here would credit the same asset twice.",
        "Add a site on your own domain — a single page is enough."
      )
    return T1_OK
  },
  email: (v) => {
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v))
      return t1Fail("This is not a valid email address.", "Enter a working address in the form name@yourbusiness.co.za")
    if (FREE_MAIL.test(v))
      return { credit: 0.6, reason: "A free mailbox rather than an address on your own domain.", fix: "Set up an address on your website domain — it usually comes free with the domain." }
    return T1_OK
  },
  address: (v) => {
    if (v.length < 12 || !/\d/.test(v))
      return t1Fail("Too short to be a physical address — a funder cannot locate the business from it.", "Enter street number, street, suburb, city and postal code.")
    return T1_OK
  },
  number: (v, max = 1e15) => {
    const n = parseFloat(String(v).replace(/[^\d.]/g, ""))
    if (!Number.isFinite(n) || n <= 0 || n > max)
      return t1Fail("No usable figure could be read from this entry.", "Enter it as a number.")
    return T1_OK
  },
  text: (v, min = 2) => (v.length < min ? t1Fail("Too short to mean anything to a reader.", "Write it out in full.") : T1_OK),
}

export const fingerprint = (key, evidence) => {
  const basis = `${key}|${cleanStr(evidence).toLowerCase()}`
  let h = 5381
  for (let i = 0; i < basis.length; i++) h = ((h << 5) + h + basis.charCodeAt(i)) >>> 0
  return `${key}_${h.toString(36)}`
}

export const fmtPts = (n) => `${n >= 0 ? "+" : ""}${(Math.round(n * 10) / 10).toFixed(1)}%`

// ─────────────────────────────────────────────────────────────────────────
// THE SCORER
//   credit     = min(tier1.credit, verdictCredit)
//   earned     = round(points × credit)
//   pointValue = (points − earned) ÷ categoryPossible × stageWeight
// ─────────────────────────────────────────────────────────────────────────
export const buildLegitimacyAssessment = (data, verdicts = {}) => {
  const stage = mapStageToCategory(data?.entityOverview?.operationStage)
  const weights = weightingsByStage[stage]
  const industry = cleanStr(data?.entityOverview?.industry) || "Not specified"
  const c = data?.contactDetails || {}

  // section is now a declared object, not a parsed string.
  const mk = ({ key, label, points, section, action, route, guidance, present, evidence, tier1, judge, partialCredit, note }) => {
    const t1 = present ? (tier1 || T1_OK) : { credit: 0, reason: null, fix: null }
    const fp = present && judge ? fingerprint(key, evidence) : null
    const verdict = fp ? verdicts[fp] : null

    let state, credit, reason, fix
    if (!present) {
      state = "missing"; credit = 0; reason = null; fix = null
    } else if (t1.hardFail) {
      state = t1.state || "failed"; credit = 0; reason = t1.reason; fix = t1.fix
    } else if (judge && !verdict) {
      state = "pending"; credit = t1.credit; reason = t1.reason; fix = t1.fix
    } else if (judge && verdict) {
      credit = Math.min(t1.credit, VERDICT_CREDIT[verdict.verdict] ?? 1)
      state = credit === 0 ? "invalid" : verdict.verdict
      reason = verdict.reason || t1.reason
      fix = verdict.fix || t1.fix
    } else {
      credit = partialCredit != null ? Math.min(t1.credit, partialCredit) : t1.credit
      state = t1.state || (credit >= 1 ? "valid" : credit > 0 ? "partial" : "failed")
      reason = t1.reason; fix = t1.fix
    }

    const earned = Math.round(points * credit)
    return {
      key, label, points, guidance, present, evidence, note: note || null,
      sectionLabel: section?.label || "My Documents",
      section: section?.label || "My Documents",
      route: route || (section ? profileRoute(section.key) : DOCUMENTS_ROUTE),
      action,
      where: `${section?.label || "My Documents"} → ${action}`,
      judge: !!judge, fingerprint: fp, verdict: verdict || null,
      credit, earned, state, reason, fix, withheld: points - earned,
      claimable: true,
    }
  }

  // A document item: the verdict is already stored, so nothing is judged
  // here — and the route carries the document id so the page can open on
  // the right row rather than the top of a list.
  const mkDoc = ({ key, label, points, action, guidance }) => {
    const v = readDocVerdict(data, key)
    return mk({
      key, label, points, action, guidance,
      section: null,
      route: documentRoute((DOC_SOURCES[key] || [])[0]),
      present: v.present,
      evidence: v.present
        ? `${v.copies} on file${v.verified ? ` · ${v.verified} verified` : ` · ${STATE_STYLE[v.status]?.label || "not counted"}`}`
        : "",
      note: v.note,
      tier1: v.present
        ? { credit: v.credit, reason: v.reason || null, fix: v.fix || null, hardFail: v.credit === 0, state: v.status }
        : null,
      judge: false,
    })
  }

  // ── 1. Foundational ──
  const website = normalizeSocial("website", c.website)
  const email = cleanStr(c.email)
  const logoUrl = urlOf(data?.documents?.companyLogo) || urlOf(data?.entityOverview?.companyLogo)
  const address = cleanStr(c.physicalAddress)

  const foundationalItems = [
    mk({
      key: "website", label: "Professional website", points: 25,
      section: S("contactDetails"), action: "add professional website URL",
      guidance: "A single-page site on your own domain satisfies this — the domain carries the credibility, not the page count.",
      present: !!website && !isPlaceholder(c.website), evidence: website,
      tier1: website ? TIER1.website(website) : null, judge: true,
    }),
    mk({
      key: "email", label: "Business email address", points: 20,
      section: S("contactDetails"), action: "add business email address",
      present: !!email && !isPlaceholder(email), evidence: email,
      tier1: email ? TIER1.email(email) : null, judge: true,
    }),
    mk({
      key: "logo", label: "Company logo", points: 15,
      section: S("entityOverview"), action: "upload company logo",
      present: !!logoUrl, evidence: logoUrl ? "Uploaded" : "",
      tier1: logoUrl && !IMG_EXT.test(logoUrl)
        ? t1Fail("This file is not a readable image.", "Upload a PNG, JPG or WebP.")
        : null,
      judge: false,
    }),
    mk({
      key: "address", label: "Physical address", points: 20,
      section: S("contactDetails"), action: "add physical address",
      present: !!address && !isPlaceholder(address), evidence: address,
      tier1: address ? TIER1.address(address) : null, judge: true,
    }),
    mkDoc({
      key: "proofOfAddress", label: "Proof of address", points: 20,
      action: "upload proof of address",
      guidance: "A municipal bill or signed lease in the company name, dated within three months.",
    }),
  ]

  // ── 2. Digital presence ──
  const rawSocial = {
    website,
    facebook: normalizeSocial("facebook", c.facebook),
    linkedin: normalizeSocial("linkedin", c.linkedin),
    instagram: normalizeSocial("instagram", c.instagram),
    x: normalizeSocial("x", c.x || c.twitter),
    youtube: normalizeSocial("youtube", c.youtube),
    whatsapp: cleanStr(c.businessWhatsApp || c.whatsApp),
  }
  const digitalProfile = pickDigitalProfile(industry)
  const digitalItems = digitalProfile.channels.map((ch) =>
    mk({
      key: `digital_${ch.key}`, label: ch.label, points: ch.points,
      section: S("contactDetails"), action: ch.where,
      present: !!rawSocial[ch.key] && !isPlaceholder(rawSocial[ch.key]),
      evidence: rawSocial[ch.key],
      judge: ch.key !== "whatsapp",
      tier1: ch.key === "website" && website ? TIER1.website(website) : null,
    })
  )
  const bonusPresent = (digitalProfile.bonus || []).filter((k) => !!rawSocial[k])
  const irrelevantSkipped = digitalProfile.irrelevant || []

  // ── 3. Track record ──
  const yearsRaw = cleanStr(data?.entityOverview?.yearsInOperation)
  const clientsReal = (data?.productsServices?.keyClients || [])
    .filter((x) => cleanStr(x?.name) && !isPlaceholder(x.name) && cleanStr(x.name).length >= 2)
  const clientTarget = CLIENT_TARGET[stage]
  const clientCredit = Math.min(clientsReal.length / clientTarget, 1)
  const revenue = cleanStr(data?.financialOverview?.annualRevenue)
  const generatesRevenue = /^yes$/i.test(cleanStr(data?.financialOverview?.generatesRevenue))
  const brandsOwned = cleanStr(data?.entityOverview?.brandsOwned)

  const trackItems = [
    mk({
      key: "years", label: "Years in operation", points: 25,
      section: S("entityOverview"), action: "update years in operation",
      present: !!yearsRaw && !isPlaceholder(yearsRaw), evidence: yearsRaw,
      tier1: yearsRaw ? TIER1.number(yearsRaw, 150) : null,
    }),
    mk({
      key: "clients",
      label: `Named clients (${clientsReal.length} of ${clientTarget} expected at ${STAGE_LABELS[stage].toLowerCase()})`,
      points: 35,
      section: S("productsServices"),
      action: clientsReal.length < clientTarget
        ? `add ${clientTarget - clientsReal.length} more named client${clientTarget - clientsReal.length === 1 ? "" : "s"} with industry and revenue contribution`
        : "key clients",
      guidance: "Named clients with a known industry are the strongest evidence of real commercial activity at any stage.",
      present: clientsReal.length > 0,
      evidence: clientsReal.map((x) => `${x.name}${x.industries?.length ? ` (${x.industries.join(", ")})` : ""}`).join("; "),
      partialCredit: clientCredit, judge: true,
    }),
    mk({
      key: "revenue", label: "Annual revenue figure", points: 20,
      section: S("financialOverview"), action: "update annual revenue",
      present: !!revenue && !isPlaceholder(revenue), evidence: revenue,
      tier1: revenue ? TIER1.number(revenue) : null,
    }),
    mk({
      key: "generatesRevenue", label: "Revenue generation confirmed", points: 10,
      section: S("financialOverview"), action: "confirm revenue generation status",
      present: generatesRevenue, evidence: "Yes",
    }),
    mk({
      key: "brandsOwned", label: "Brands owned", points: 10,
      section: S("entityOverview"), action: "add brands owned under Brand Assets",
      present: !!brandsOwned && !isPlaceholder(brandsOwned), evidence: brandsOwned,
      tier1: brandsOwned ? TIER1.text(brandsOwned) : null, judge: true,
    }),
  ]

  // ── 4. Third-party validation ──
  const isAssocMember = /^yes$/i.test(cleanStr(data?.entityOverview?.memberOfAssociation))
  const assocNames = [
    ...(data?.entityOverview?.industryAssociations || []).filter((x) => x && x !== "Other"),
    cleanStr(data?.entityOverview?.industryAssociationsOther),
  ].filter(Boolean)
  const brandsRep = cleanStr(data?.entityOverview?.brandsRepresented)
  const franchises = /^yes$/i.test(cleanStr(data?.entityOverview?.holdsFranchises))
  const agencies = /^yes$/i.test(cleanStr(data?.entityOverview?.holdsAgencies))

  const thirdPartyItems = [
    mkDoc({ key: "bbbee", label: "B-BBEE certificate", points: 20, action: "upload B-BBEE certificate" }),
    mkDoc({ key: "companyReg", label: "Company registration certificate", points: 20, action: "upload company registration certificate" }),
    mkDoc({
      key: "taxClearance", label: "Tax clearance certificate", points: 20,
      action: "upload tax clearance certificate",
      guidance: "SARS issues a tax compliance status PIN online at no cost — usually within a day.",
    }),
    mkDoc({ key: "accreditation", label: "Industry accreditation", points: 15, action: "upload industry accreditations" }),
    mkDoc({
      key: "supportLetters", label: "Client reference or support letter", points: 10,
      action: "upload client references and support letters",
      guidance: "One letter on a client's letterhead confirming the work you did is enough to claim this.",
    }),
    mk({
      key: "association", label: "Industry association membership", points: 8,
      section: S("entityOverview"), action: "confirm membership and name the association under Business Details",
      guidance: "An external body reviewed and accepted you — validation in its own right, distinct from a compliance document.",
      present: isAssocMember && assocNames.length > 0, evidence: assocNames.join(", "),
      judge: true,
    }),
    mk({
      key: "externalMandate", label: "Brands represented / franchise / agency held", points: 7,
      section: S("entityOverview"), action: "add brands represented, franchises or agencies held under Brand Assets",
      guidance: "Another established company staked its name on you. If that applies, record it.",
      present: !!brandsRep || franchises || agencies,
      evidence: [brandsRep, franchises ? "holds franchises" : "", agencies ? "holds agencies" : ""].filter(Boolean).join("; "),
      judge: true,
    }),
  ]

  // ── Assemble ──
  const groups = { foundational: foundationalItems, digital: digitalItems, track: trackItems, thirdParty: thirdPartyItems }
  let totalRaw = 0

  const categories = Object.entries(groups).map(([key, items]) => {
    const possible = items.reduce((s, i) => s + i.points, 0) || 1
    const earned = items.reduce((s, i) => s + i.earned, 0)
    const percent = (earned / possible) * 100
    const weight = weights[key]
    totalRaw += percent * (weight / 100)

    const scored = items.map((i) => ({
      ...i,
      pointValue: (i.withheld / possible) * weight,
      maxPointValue: (i.points / possible) * weight,
      category: key,
      categoryHeading: CATEGORY_HEADINGS[key],
    }))

    return {
      key, label: CATEGORY_LABELS[key], heading: CATEGORY_HEADINGS[key], color: CATEGORY_COLORS[key], weight,
      items: scored, earned, possible,
      percent: Math.round(percent),
      rawScore: Math.round((percent / 20) * 10) / 10,
      weightedScore: Math.round(percent * (weight / 100) * 10) / 10,
      headroom: Math.round((100 - percent) * (weight / 100) * 10) / 10,
    }
  })

  const allItems = categories.flatMap((c) => c.items)
  const outstanding = allItems.filter((i) => i.withheld > 0).sort((x, y) => y.pointValue - x.pointValue)
  const deducted = outstanding.filter((i) => i.present)
  const unverified = allItems.filter((i) => i.state === "pending")
  const failedDocs = allItems.filter((i) => DOC_FAIL_STATES.has(i.state))

  return {
    stage, stageLabel: STAGE_LABELS[stage], weights, industry,
    digitalProfile, bonusPresent, irrelevantSkipped,
    clientTarget, clientCount: clientsReal.length,
    categories, allItems, outstanding, deducted, unverified, failedDocs,
    totalRaw, totalScore: Math.round(totalRaw),
    availablePoints: Math.round(outstanding.reduce((s, i) => s + i.pointValue, 0) * 10) / 10,
    deductedPoints: Math.round(deducted.reduce((s, i) => s + i.pointValue, 0) * 10) / 10,
  }
}

// ─────────────────────────────────────────────────────────────────────────
// BALLOT PROMPT — free-text entries only. Documents never reach this.
// ─────────────────────────────────────────────────────────────────────────
export const buildBallotPrompt = (items, ctx) => `You are verifying typed entries on a business profile. For EACH entry below, return one verdict. You are judging only whether the value typed is what the field asks for.

Uploaded documents are NOT in this list — they were already verified when they were uploaded. Every entry here is free text a person typed in.

You are not told any scores and must not mention any. Return JSON only.

BUSINESS CONTEXT
Industry: ${ctx.industry}
Stage: ${ctx.stageLabel}

VERDICTS — use exactly one of these five strings:
"valid"         — the value is what the field asks for.
"weak"          — real and usable, but a weaker form of what was asked for (e.g. a personal profile where a company page was asked for).
"questionable"  — probably counts, but something is off: a name that does not match the business, a value that does not fit the industry.
"invalid"       — does not evidence what the field asks for at all: a placeholder, nonsense text, plainly the wrong thing, or a link to a different platform than the field asks for.
"unverifiable"  — you cannot tell from what you were given. It costs the business nothing, and is the right answer whenever you are unsure.

RULES
- Judge only against the field's own purpose. Never mark something down for being small, new, informal, or for a reason belonging to a different field.
- reason: one sentence in plain English, addressed to the business owner, naming the specific problem. Empty string when the verdict is "valid".
- fix: one sentence saying exactly what to change. Empty string when the verdict is "valid".

ENTRIES
${items.map((i) => `- key: ${i.key}
  field asks for: ${i.label}
  value typed: ${i.evidence || "(empty)"}`).join("\n")}

Return ONLY a JSON array, no prose, no markdown fences:
[{"key":"...","verdict":"valid","reason":"","fix":""}]`

export const parseBallot = (text) => {
  const cleaned = String(text || "").replace(/```json|```/g, "").trim()
  const start = cleaned.indexOf("[")
  const end = cleaned.lastIndexOf("]")
  if (start === -1 || end === -1) throw new Error("the check returned no readable result")
  const arr = JSON.parse(cleaned.slice(start, end + 1))
  if (!Array.isArray(arr)) throw new Error("the check returned an unexpected shape")
  return arr.filter((x) => x && typeof x.key === "string" && VERDICT_CREDIT[x.verdict] !== undefined)
}

// ─────────────────────────────────────────────────────────────────────────
// NARRATIVE PROMPT — finished numbers in, explanation out.
//
// One section per category, with the heading text copied exactly, so each
// finding can be filed against the element it describes and read on its own
// screen rather than as one continuous document.
// ─────────────────────────────────────────────────────────────────────────
export const buildLegitimacyPrompt = (a) => {
  const line = (i) => {
    const status = i.state === "missing" ? "NOT PROVIDED"
      : i.withheld === 0 ? "COUNTED IN FULL"
      : `${i.earned}/${i.points} item points — ${i.withheld} withheld`
    return `  - ${i.label}: ${status}${i.present ? ` — on file: ${i.evidence}` : ""}${i.reason ? ` — ${i.reason}` : ""}${i.withheld > 0 ? ` — recoverable ${fmtPts(i.pointValue)} via ${i.where}` : ""}`
  }
  const block = (c) => `
### ${c.heading}
Score: ${c.rawScore}/5 (${c.percent}%), weighted ${c.weight}% for a ${a.stageLabel} business = ${c.weightedScore} points of the final score. Unclaimed here: ${c.headroom}%.
${c.items.map(line).join("\n")}`

  return `You are writing the legitimacy section of a funding-readiness report.

EVERY NUMBER BELOW IS FINAL. You do not calculate, adjust or re-derive anything. Your job is to explain what was counted, what was withheld and why, and what to do next. Stating a different number is an error.

HOW DOCUMENTS WERE ASSESSED: every uploaded document was checked at the point of upload — the file itself was read and its document type, company name and expiry date confirmed. A verified document counts in full. A document that failed counts for nothing, and the reason above is the finding from that check. Never describe an uploaded document as unverified or unchecked, and never suggest a business "should verify" a document that already passed.

WRITE ONE SECTION PER HEADING BELOW, WITH THE HEADING TEXT COPIED EXACTLY. Each is read on its own screen, so each must stand alone and must be short.

CONTEXT
Stage: ${a.stageLabel} · Industry: ${a.industry}
Digital scoring profile: ${a.digitalProfile.label} — only ${a.digitalProfile.channels.map((ch) => ch.label).join(", ")} are scored.${a.irrelevantSkipped.length ? " Channels outside that list cost nothing and must never be described as a gap." : ""}
Stage weighting: Identity ${a.weights.foundational}%, Digital ${a.weights.digital}%, Track record ${a.weights.track}%, Third-party ${a.weights.thirdParty}%.

FINAL SCORE: ${a.totalScore}%
Recoverable in total: ${a.availablePoints}%
Of that, ${a.deductedPoints}% sits on entries that WERE supplied but were not counted in full.
${block(a.categories[0])}
${block(a.categories[1])}
${block(a.categories[2])}
${block(a.categories[3])}

RULES
- Where points were withheld on something the business DID supply, lead with that — it is more useful than listing what is absent. Name the item, the points withheld, the reason given, and the fix.
- Every recommendation must be an item above and must carry its exact recoverable value.
- Never invent an improvement that is not on the list — it cannot earn anything.
- Do not soften a withheld verdict and do not add reasons of your own to it.
- Plain business English. Short sentences.

OUTPUT FORMAT — follow exactly, including bold labels:

### 1. Identity Markers
**Score:** ${a.categories[0].rawScore}/5 (${a.categories[0].percent}%) · weighted ${a.categories[0].weight}%
**Evidence:** [what was counted]
**Points withheld:** [one bullet per item with points withheld, as: - Item — reason — **+X.X%** to recover via Section. If none: "None — everything supplied was counted in full."]
**Rationale:** [2–3 sentences on what this means to a funder]
**Points available:** [one bullet per outstanding item, as: - Section: action — **+X.X%**. If none: "None — this category is complete."]

### 2. Digital Presence
[the same five labels]

### 3. Track Record
[the same five labels, judged against the ${a.stageLabel} stage]

### 4. Third-Party Validation
[the same five labels]

### Overall Assessment
**Total score:** ${a.totalScore}%
**Recoverable:** ${a.availablePoints}%
**Strongest section:** [name it and say in one line why it stands out to a funder]
**Weakest section:** [name it and say what it costs]
**Highest-value next step:** [the single top item, its section and exact value]
**Final analysis:** [short paragraph: where this business stands, and what the score becomes once the top three items are resolved]`
}