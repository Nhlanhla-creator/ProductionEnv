"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, RefreshCw, AlertCircle, CheckCircle, Target, Flag } from "lucide-react"
import { db, auth } from "../../firebaseConfig"
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore"
import { getFunctions, httpsCallable } from "firebase/functions"

// ─────────────────────────────────────────────────────────────────────────
// LEGITIMACY
//
// Where each answer comes from:
//
//   DOCUMENTS — already decided. validateMyDocument read the actual file
//   with Gemini at upload time: document type, company name, expiry date.
//   That verdict is stored on the profile, so this card reads it and
//   nothing else. Verified → full points. Rejected or expired → no points,
//   with the reason the user already saw in My Documents. No second
//   opinion, no filename guessing, no "unchecked" caveat.
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

const CATEGORY_LABELS = {
  foundational: "Foundational business identity",
  digital: "Digital presence & discoverability",
  track: "Track record indicators",
  thirdParty: "Third-party validations",
}
const CATEGORY_HEADINGS = {
  foundational: "Identity Markers",
  digital: "Digital Presence",
  track: "Track Record",
  thirdParty: "Third-Party Validation",
}
const CATEGORY_COLORS = {
  foundational: "#8D6E63",
  digital: "#6D4C41",
  track: "#A67C52",
  thirdParty: "#D7CCC8",
}

const weightingsByStage = {
  startup:    { foundational: 35, digital: 25, track: 15, thirdParty: 25 },
  growth:     { foundational: 28, digital: 22, track: 25, thirdParty: 25 },
  scaling:    { foundational: 22, digital: 20, track: 30, thirdParty: 28 },
  turnaround: { foundational: 30, digital: 18, track: 28, thirdParty: 24 },
  mature:     { foundational: 18, digital: 17, track: 30, thirdParty: 35 },
}

const STAGE_LABELS = {
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

// The profile page renders every section from one route via `activeSection`,
// so we deep-link with ?section=<id> instead of a path per section.
// Documents is the exception — it has its own page.
const PROFILE_ROUTE = "/profile"   // ← set to your actual route

const SECTION_TARGETS = {
  "Contact Details":      { path: `${PROFILE_ROUTE}?section=contactDetails` },
  "Entity Overview":      { path: `${PROFILE_ROUTE}?section=entityOverview` },
  "Products & Services":  { path: `${PROFILE_ROUTE}?section=productsServices` },
  "Financial Overview":   { path: `${PROFILE_ROUTE}?section=financialOverview` },
  "My Documents":         { path: "/my-documents" },
}

// "Contact Details → add professional website URL"
const parseWhere = (where) => {
  const parts = String(where || "").split("→")
  const section = cleanStr(parts[0])
  return {
    section,
    action: cleanStr(parts.slice(1).join("→")) || cleanStr(where),
    route: SECTION_TARGETS[section]?.path || null,
  }
}
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

const DOC_SOURCES = {
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

const STATE_STYLE = {
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

// ─────────────────────────────────────────────────────────────────────────
// DIGITAL PRESENCE — industry-relevant channels only
// ─────────────────────────────────────────────────────────────────────────
const DIGITAL_PROFILES = [
  {
    key: "agriculture", label: "Agriculture / farming / primary industry",
    test: /agri|farm|crop|livestock|poultry|forestr|fish|aquacult|mining|quarry/i,
    channels: [
      { key: "website", label: "Website", points: 40, where: "Contact Details → add professional website URL" },
      { key: "facebook", label: "Facebook page", points: 30, where: "Contact Details → add Facebook page" },
      { key: "whatsapp", label: "WhatsApp Business", points: 30, where: "Contact Details → add WhatsApp Business number" },
    ],
    bonus: ["linkedin", "instagram"], irrelevant: ["x", "youtube"],
  },
  {
    key: "construction", label: "Construction / trade / property",
    test: /construct|build|civil|engineer|electric|plumb|property|real estate|contract/i,
    channels: [
      { key: "website", label: "Website", points: 40, where: "Contact Details → add professional website URL" },
      { key: "linkedin", label: "LinkedIn profile", points: 30, where: "Contact Details → add LinkedIn profile" },
      { key: "facebook", label: "Facebook page", points: 30, where: "Contact Details → add Facebook page" },
    ],
    bonus: ["instagram", "whatsapp"], irrelevant: ["x", "youtube"],
  },
  {
    key: "consumer", label: "Retail / hospitality / consumer",
    test: /retail|shop|store|restaurant|hospitality|tourism|food|beverage|fashion|beauty|salon|cater/i,
    channels: [
      { key: "instagram", label: "Instagram account", points: 35, where: "Contact Details → add Instagram account" },
      { key: "facebook", label: "Facebook page", points: 35, where: "Contact Details → add Facebook page" },
      { key: "website", label: "Website", points: 30, where: "Contact Details → add professional website URL" },
    ],
    bonus: ["whatsapp", "youtube"], irrelevant: ["x", "linkedin"],
  },
  {
    key: "professional", label: "Professional services / consulting / technology",
    test: /consult|advisor|profession|account|legal|law|financ|insur|technolog|software|\bIT\b|digital|media|market|recruit|train|educat/i,
    channels: [
      { key: "linkedin", label: "LinkedIn profile", points: 40, where: "Contact Details → add LinkedIn profile" },
      { key: "website", label: "Website", points: 35, where: "Contact Details → add professional website URL" },
      { key: "x", label: "X (Twitter) account", points: 25, where: "Contact Details → add X/Twitter account" },
    ],
    bonus: ["facebook", "instagram", "youtube"], irrelevant: [],
  },
]

const DEFAULT_DIGITAL_PROFILE = {
  key: "general", label: "General business",
  channels: [
    { key: "website", label: "Website", points: 40, where: "Contact Details → add professional website URL" },
    { key: "linkedin", label: "LinkedIn profile", points: 30, where: "Contact Details → add LinkedIn profile" },
    { key: "facebook", label: "Facebook page", points: 30, where: "Contact Details → add Facebook page" },
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

// ─────────────────────────────────────────────────────────────────────────
// THE SCORER
//   credit     = min(tier1.credit, verdictCredit)
//   earned     = round(points × credit)
//   pointValue = (points − earned) ÷ categoryPossible × stageWeight
// ─────────────────────────────────────────────────────────────────────────
const buildLegitimacyAssessment = (data, verdicts = {}) => {
  const stage = mapStageToCategory(data?.entityOverview?.operationStage)
  const weights = weightingsByStage[stage]
  const industry = cleanStr(data?.entityOverview?.industry) || "Not specified"
  const c = data?.contactDetails || {}

  const mk = ({ key, label, points, where, guidance, present, evidence, tier1, judge, partialCredit, note }) => {
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
      key, label, points, where, guidance, present, evidence, note: note || null,
      judge: !!judge, fingerprint: fp, verdict: verdict || null,
      credit, earned, state, reason, fix, withheld: points - earned,
    }
  }

  // A document item: the verdict is already stored, so nothing is judged here.
  const mkDoc = ({ key, label, points, where, guidance }) => {
    const v = readDocVerdict(data, key)
    return mk({
      key, label, points, where, guidance,
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
      where: "Contact Details → add professional website URL",
      guidance: "A single-page site on your own domain satisfies this — the domain carries the credibility, not the page count.",
      present: !!website && !isPlaceholder(c.website), evidence: website,
      tier1: website ? TIER1.website(website) : null, judge: true,
    }),
    mk({
      key: "email", label: "Business email address", points: 20,
      where: "Contact Details → add business email address",
      present: !!email && !isPlaceholder(email), evidence: email,
      tier1: email ? TIER1.email(email) : null, judge: true,
    }),
    mk({
      key: "logo", label: "Company logo", points: 15,
      where: "Entity Overview → upload company logo",
      present: !!logoUrl, evidence: logoUrl ? "Uploaded" : "",
      tier1: logoUrl && !IMG_EXT.test(logoUrl)
        ? t1Fail("This file is not a readable image.", "Upload a PNG, JPG or WebP.")
        : null,
      judge: false,
    }),
    mk({
      key: "address", label: "Physical address", points: 20,
      where: "Contact Details → add physical address",
      present: !!address && !isPlaceholder(address), evidence: address,
      tier1: address ? TIER1.address(address) : null, judge: true,
    }),
    mkDoc({
      key: "proofOfAddress", label: "Proof of address", points: 20,
      where: "My Documents → upload proof of address",
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
      key: `digital_${ch.key}`, label: ch.label, points: ch.points, where: ch.where,
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
      where: "Entity Overview → update years in operation",
      present: !!yearsRaw && !isPlaceholder(yearsRaw), evidence: yearsRaw,
      tier1: yearsRaw ? TIER1.number(yearsRaw, 150) : null,
    }),
    mk({
      key: "clients",
      label: `Named clients (${clientsReal.length} of ${clientTarget} expected at ${STAGE_LABELS[stage].toLowerCase()})`,
      points: 35,
      where: clientsReal.length < clientTarget
        ? `Products & Services → add ${clientTarget - clientsReal.length} more named client${clientTarget - clientsReal.length === 1 ? "" : "s"} with industry and revenue contribution`
        : "Products & Services → key clients",
      guidance: "Named clients with a known industry are the strongest evidence of real commercial activity at any stage.",
      present: clientsReal.length > 0,
      evidence: clientsReal.map((x) => `${x.name}${x.industries?.length ? ` (${x.industries.join(", ")})` : ""}`).join("; "),
      partialCredit: clientCredit, judge: true,
    }),
    mk({
      key: "revenue", label: "Annual revenue figure", points: 20,
      where: "Financial Overview → update annual revenue",
      present: !!revenue && !isPlaceholder(revenue), evidence: revenue,
      tier1: revenue ? TIER1.number(revenue) : null,
    }),
    mk({
      key: "generatesRevenue", label: "Revenue generation confirmed", points: 10,
      where: "Financial Overview → confirm revenue generation status",
      present: generatesRevenue, evidence: "Yes",
    }),
    mk({
      key: "brandsOwned", label: "Brands owned", points: 10,
      where: "Entity Overview → add brands owned under Brand Assets",
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
    mkDoc({ key: "bbbee", label: "B-BBEE certificate", points: 20, where: "My Documents → upload B-BBEE certificate" }),
    mkDoc({ key: "companyReg", label: "Company registration certificate", points: 20, where: "My Documents → upload company registration certificate" }),
    mkDoc({
      key: "taxClearance", label: "Tax clearance certificate", points: 20,
      where: "My Documents → upload tax clearance certificate",
      guidance: "SARS issues a tax compliance status PIN online at no cost — usually within a day.",
    }),
    mkDoc({ key: "accreditation", label: "Industry accreditation", points: 15, where: "My Documents → upload industry accreditations" }),
    mkDoc({
      key: "supportLetters", label: "Client reference or support letter", points: 10,
      where: "My Documents → upload client references and support letters",
      guidance: "One letter on a client's letterhead confirming the work you did is enough to claim this.",
    }),
    mk({
      key: "association", label: "Industry association membership", points: 8,
      where: "Entity Overview → confirm membership and name the association under Business Details",
      guidance: "An external body reviewed and accepted you — validation in its own right, distinct from a compliance document.",
      present: isAssocMember && assocNames.length > 0, evidence: assocNames.join(", "),
      judge: true,
    }),
    mk({
      key: "externalMandate", label: "Brands represented / franchise / agency held", points: 7,
      where: "Entity Overview → add brands represented, franchises or agencies held under Brand Assets",
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

  return {
    stage, stageLabel: STAGE_LABELS[stage], weights, industry,
    digitalProfile, bonusPresent, irrelevantSkipped,
    clientTarget, clientCount: clientsReal.length,
    categories, allItems, outstanding, deducted, unverified,
    totalRaw, totalScore: Math.round(totalRaw),
    availablePoints: Math.round(outstanding.reduce((s, i) => s + i.pointValue, 0) * 10) / 10,
    deductedPoints: Math.round(deducted.reduce((s, i) => s + i.pointValue, 0) * 10) / 10,
  }
}

const fmtPts = (n) => `${n >= 0 ? "+" : ""}${(Math.round(n * 10) / 10).toFixed(1)}%`

// ─────────────────────────────────────────────────────────────────────────
// BALLOT PROMPT — free-text entries only. Documents never reach this.
// ─────────────────────────────────────────────────────────────────────────
const buildBallotPrompt = (items, ctx) => `You are verifying typed entries on a business profile. For EACH entry below, return one verdict. You are judging only whether the value typed is what the field asks for.

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

const parseBallot = (text) => {
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
// ─────────────────────────────────────────────────────────────────────────
const buildLegitimacyPrompt = (a) => {
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
**Points available:** [one bullet per outstanding item, as: - → Section: action — **+X.X%**. If none: "None — this category is complete."]

### 2. Digital Presence
[the same five labels]

### 3. Track Record
[the same five labels, judged against the ${a.stageLabel} stage]

### 4. Third-Party Validation
[the same five labels]

### Overall Assessment
**Total score:** ${a.totalScore}%
**Recoverable:** ${a.availablePoints}%
**Highest-value next step:** [the single top item, its section and exact value]
**Final analysis:** [short paragraph: where this business stands, and what the score becomes once the top three items are resolved]`
}

// ═════════════════════════════════════════════════════════════════════════

export function LegitimacyScoreCard({ styles, profileData, onScoreUpdate, apiKey, onNavigate }) {
  const [showModal, setShowModal] = useState(false)
  const [verdicts, setVerdicts] = useState({})
  const [verdictsLoaded, setVerdictsLoaded] = useState(false)
  const [assessment, setAssessment] = useState(null)
  const [legitimacyScore, setLegitimacyScore] = useState(0)
  const [aiEvaluationResult, setAiEvaluationResult] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluationError, setEvaluationError] = useState("")
  const [showAbout, setShowAbout] = useState(false)
const [showPotential, setShowPotential] = useState(true)
  const [openItem, setOpenItem] = useState(null)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const requestedRef = useRef(new Set())

  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : ""
    return () => (document.body.style.overflow = "")
  }, [showModal])

  // ── Free-text verdict cache ──
  useEffect(() => {
    const userId = auth?.currentUser?.uid
    if (!userId) return
    const ref = doc(db, "legitimacyVerdicts", userId)
    const unsub = onSnapshot(
      ref,
      (snap) => { setVerdicts(snap.exists() ? snap.data().verdicts || {} : {}); setVerdictsLoaded(true) },
      (e) => { console.error("Verdict cache error:", e); setVerdictsLoaded(true) }
    )
    return () => unsub()
  }, [auth?.currentUser?.uid])

  // ── Score — pure function of (profile, cached text verdicts) ──
  useEffect(() => {
    if (!profileData) return
    const a = buildLegitimacyAssessment(profileData, verdicts)
    setAssessment(a)
    setLegitimacyScore(a.totalScore)
    if (onScoreUpdate) onScoreUpdate(a.totalScore)
  }, [profileData, verdicts])

  const callAi = async (prompt) => {
    const functions = getFunctions()
    const fn = httpsCallable(functions, "generateLegitimacyAnalysis")
    const resp = await fn({ prompt })
    const content = resp?.data?.content
    if (!content) throw new Error("Invalid response format from server")
    return content
  }

  // ── Free-text verification pass ──
  const runVerification = async (force = false) => {
    const userId = auth?.currentUser?.uid
    if (!userId || !apiKey?.trim() || !profileData) return
    const a = buildLegitimacyAssessment(profileData, force ? {} : verdicts)
    const todo = a.allItems.filter(
      (i) => i.judge && i.present && i.fingerprint && (force || i.state === "pending")
    )
    if (!todo.length) return

    setIsVerifying(true)
    setEvaluationError("")
    try {
      const results = parseBallot(await callAi(buildBallotPrompt(todo, a)))
      const byKey = Object.fromEntries(results.map((r) => [r.key, r]))
      const next = { ...verdicts }
      todo.forEach((item) => {
        const r = byKey[item.key]
        if (!r) return
        next[item.fingerprint] = {
          itemKey: item.key, verdict: r.verdict,
          reason: cleanStr(r.reason), fix: cleanStr(r.fix),
          evidence: item.evidence, checkedAt: new Date().toISOString(),
        }
        requestedRef.current.add(item.fingerprint)
      })
      await setDoc(doc(db, "legitimacyVerdicts", userId), { verdicts: next, updatedAt: new Date() }, { merge: true })
      setVerdicts(next)
    } catch (e) {
      console.error("Verification error:", e)
      setEvaluationError(`The entry check could not finish: ${e.message}. Entries stay counted in full until it succeeds.`)
    } finally {
      setIsVerifying(false)
    }
  }

  useEffect(() => {
    if (!verdictsLoaded || !assessment || !apiKey || isVerifying) return
    const fresh = assessment.unverified.filter((i) => i.fingerprint && !requestedRef.current.has(i.fingerprint))
    if (!fresh.length) return
    fresh.forEach((i) => requestedRef.current.add(i.fingerprint))
    runVerification()
  }, [verdictsLoaded, assessment, apiKey])

  // ── Appeal — only applies to typed entries; documents are re-checked by
  // re-uploading them in My Documents. ──
  const appealVerdict = async (item) => {
    const userId = auth?.currentUser?.uid
    if (!userId || !item.fingerprint) return
    const next = { ...verdicts }
    delete next[item.fingerprint]
    requestedRef.current.delete(item.fingerprint)
    await setDoc(
      doc(db, "legitimacyVerdicts", userId),
      {
        verdicts: next,
        appeals: { [item.fingerprint]: { itemKey: item.key, evidence: item.evidence, at: new Date().toISOString() } },
        updatedAt: new Date(),
      },
      { merge: true }
    )
    setVerdicts(next)
  }

  const runAiEvaluation = async () => {
    if (!apiKey?.trim()) { setEvaluationError("AI analysis is not configured yet."); return }
    if (!profileData) { setEvaluationError("No profile data available to analyse."); return }
    setIsEvaluating(true)
    setEvaluationError("")
    try {
      const a = buildLegitimacyAssessment(profileData, verdicts)
      setAssessment(a)
      setLegitimacyScore(a.totalScore)
      const result = await callAi(buildLegitimacyPrompt(a))
      setAiEvaluationResult(result)
      setShowAnalysis(true)
      const userId = auth?.currentUser?.uid
      if (userId) {
        await setDoc(
          doc(db, "aiLegitimacyEvaluation", userId),
          { result, score: a.totalScore, timestamp: new Date(), profileSnapshot: profileData },
          { merge: true }
        )
      }
    } catch (e) {
      console.error("Legitimacy AI evaluation error:", e)
      setEvaluationError(`Analysis failed: ${e.message}`)
    } finally {
      setIsEvaluating(false)
    }
  }

  useEffect(() => {
    if (!auth?.currentUser?.uid) return
    const userId = auth.currentUser.uid
    const profileRef = doc(db, "universalProfiles", userId)
    const aiEvalRef = doc(db, "aiLegitimacyEvaluation", userId)
    const unsub = onSnapshot(profileRef, async (snap) => {
      if (snap.exists() && snap.data().triggerLegitimacyEvaluation === true && !isEvaluating && apiKey) {
        await runVerification()
        await runAiEvaluation()
        await updateDoc(profileRef, { triggerLegitimacyEvaluation: false })
        return
      }
      try {
        const s = await getDoc(aiEvalRef)
        if (s.exists() && s.data().result) setAiEvaluationResult(s.data().result)
      } catch (e) { console.error("Error loading saved analysis:", e) }
    })
    return () => unsub()
  }, [auth?.currentUser?.uid, apiKey])

  // ─────────────────────────────────────────────────────────────────────
  // Presentation
  // ─────────────────────────────────────────────────────────────────────
  const barColor = (s) => (s > 90 ? "#1B5E20" : s >= 81 ? "#4CAF50" : s >= 61 ? "#FF9800" : s >= 41 ? "#F44336" : "#B71C1C")

  const getScoreLevel = (score) => {
    if (score >= 91) return { level: "Market Leader", color: "#1B5E20" }
    if (score >= 81) return { level: "Trusted Brand", color: "#4CAF50" }
    if (score >= 61) return { level: "Emerging Force", color: "#FF9800" }
    if (score >= 41) return { level: "Building Credibility", color: "#F44336" }
    return { level: "Early Stage Identity", color: "#B71C1C" }
  }
  const scoreLevel = getScoreLevel(legitimacyScore)

  const HIGHLIGHT_LABELS = [
    "score", "evidence", "rationale", "assessment", "confidence", "points available",
    "points withheld", "withheld", "how to improve", "improvement", "improve",
    "recommendation", "recommendations", "finding", "findings", "verdict", "gap",
    "risk", "risks", "impact", "current state", "why this matters", "next steps",
    "action", "actions", "strengths", "weaknesses", "total score", "recoverable",
    "unclaimed", "highest-value next step", "final analysis", "funder view",
  ]
  const SUBHEADING_LINE = /^\s*(\d+\.\d+[\s.):-]+\S.{0,90})$/
  const LABEL_LINE = /^\s*(?:[-•*]\s*)?((?:\d+(?:\.\d+)*\s+)?[A-Za-z][A-Za-z0-9 /&'()–-]{1,44}):\s*(.*)$/
  const POINT_VALUE = /\+\d+(?:\.\d+)?%/g
  const stripMd = (s) => String(s || "").replace(/\*\*/g, "").trim()

  const renderInline = (text, keyPrefix) => {
    const src = String(text)
    const out = []
    let i = 0, last = 0, m
    const boldRe = /\*\*(.+?)\*\*/g
    const pushPlain = (chunk, kp) => {
      let lastP = 0, pm
      POINT_VALUE.lastIndex = 0
      while ((pm = POINT_VALUE.exec(chunk)) !== null) {
        if (pm.index > lastP) out.push(chunk.slice(lastP, pm.index))
        out.push(
          <span key={`${kp}-p${i++}`} style={{ backgroundColor: "#e8f5e9", color: "#1B5E20", border: "1px solid #c8e6c9", borderRadius: "4px", padding: "1px 6px", fontWeight: 800, fontSize: "11.5px", whiteSpace: "nowrap" }}>{pm[0]}</span>
        )
        lastP = pm.index + pm[0].length
      }
      if (lastP < chunk.length) out.push(chunk.slice(lastP))
    }
    while ((m = boldRe.exec(src)) !== null) {
      if (m.index > last) pushPlain(src.slice(last, m.index), `${keyPrefix}-t`)
      POINT_VALUE.lastIndex = 0
      if (POINT_VALUE.test(m[1])) { POINT_VALUE.lastIndex = 0; pushPlain(m[1], `${keyPrefix}-b`) }
      else out.push(<strong key={`${keyPrefix}-b${i++}`} style={{ color: "#4e342e", fontWeight: 700 }}>{m[1]}</strong>)
      last = m.index + m[0].length
    }
    if (last < src.length) pushPlain(src.slice(last), `${keyPrefix}-e`)
    return out.length ? out : src
  }

  const renderRichText = (text) =>
    String(text).split("\n").map((line, i) => {
      if (!line.trim()) return <div key={i} style={{ height: "7px" }} />
      const bare = stripMd(line)

      const sub = bare.match(SUBHEADING_LINE)
      if (sub && !/:/.test(bare.slice(0, 6))) {
        return (
          <div key={i} style={{ fontWeight: 800, color: "#4e342e", fontSize: "13.5px", margin: i === 0 ? "0 0 6px 0" : "16px 0 6px 0", paddingBottom: "5px", borderBottom: "2px solid #e6d3c4", letterSpacing: "0.2px" }}>{sub[1]}</div>
        )
      }

      const m = bare.match(LABEL_LINE)
      if (m) {
        const labelKey = m[1].toLowerCase().replace(/^\d+(\.\d+)*\s+/, "").trim()
        if (HIGHLIGHT_LABELS.some((l) => labelKey === l || labelKey.startsWith(l))) {
          const isWithheld = labelKey.startsWith("points withheld") || labelKey.startsWith("withheld")
          const isPoints = labelKey.startsWith("points available") || labelKey.startsWith("recoverable")
          const tone = isWithheld
            ? { fg: "#B71C1C", bg: "#fdecea", br: "#e6b8ac" }
            : isPoints
            ? { fg: "#1B5E20", bg: "#e8f5e9", br: "#c8e6c9" }
            : { fg: "#4e342e", bg: "#f3e8dc", br: "#e6d3c4" }
          return (
            <div key={i} style={{ margin: "10px 0 3px 0" }}>
              <span style={{ fontWeight: 800, color: tone.fg, backgroundColor: tone.bg, padding: "2px 8px", borderRadius: "4px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.6px", border: `1px solid ${tone.br}`, display: "inline-block" }}>{m[1]}</span>
              {m[2] ? <span style={{ marginLeft: "8px" }}>{renderInline(m[2], i)}</span> : null}
            </div>
          )
        }
      }

      if (/^\s*[-•*→]\s+/.test(line)) {
        return (
          <div key={i} style={{ display: "flex", gap: "8px", margin: "3px 0 3px 4px" }}>
            <span style={{ color: "#a1887f" }}>•</span>
            <span>{renderInline(line.replace(/^\s*[-•*]\s*/, "").replace(/^→\s*/, ""), i)}</span>
          </div>
        )
      }

      return <div key={i} style={{ margin: "3px 0" }}>{renderInline(line, i)}</div>
    })

  const formatAiResult = (text, injections = {}) => {
    if (!text) return null
    return String(text).split(/(?=###\s)/g).map((section, index) => {
      const trimmed = section.trim()
      if (!trimmed) return null
      const hm = trimmed.match(/^###\s*(.+?)(?=\n|$)/)
      const rawHeading = hm ? hm[1].trim() : null
      const heading = rawHeading ? stripMd(rawHeading) : null
      const rest = rawHeading
        ? trimmed.slice(trimmed.indexOf(rawHeading) + rawHeading.length).replace(/^###\s*/, "").trim()
        : trimmed.replace(/^###\s*/, "")
      const found = heading
        ? (Object.entries(injections).find(([k]) => heading.toLowerCase().includes(k.toLowerCase())) || [])[1]
        : undefined

      return (
        <div key={index} style={{ marginBottom: "15px" }}>
          {heading && (
            <div style={{ backgroundColor: "#8d6e63", color: "white", padding: "8px 14px", borderRadius: "8px 8px 0 0", fontWeight: 700, fontSize: "13px" }}>{heading}</div>
          )}
          {found && (
            <div style={{ backgroundColor: "#efebe9", border: "1px solid #e8d8cf", borderTop: heading ? "none" : "1px solid #e8d8cf", borderBottom: "1px dashed #d7ccc8", padding: "14px 16px", borderRadius: heading ? 0 : "8px 8px 0 0" }}>
              <div style={{ fontSize: "10px", color: "#8d6e63", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "10px" }}>Scored items</div>
              {found}
            </div>
          )}
          <div style={{ fontSize: "14px", lineHeight: 1.6, color: "#6d4c41", backgroundColor: "white", padding: "16px", borderRadius: heading ? "0 0 8px 8px" : "8px", border: "1px solid #e8d8cf", borderTop: heading || found ? "none" : "1px solid #e8d8cf" }}>
            {renderRichText(rest || trimmed)}
          </div>
        </div>
      )
    }).filter(Boolean)
  }

  const ItemRow = ({ item, showAppeal }) => {
    const st = STATE_STYLE[item.state] || STATE_STYLE.valid
    return (
      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "7px" }}>
        <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", marginTop: "6px", flexShrink: 0, backgroundColor: st.dot }} />
        <span style={{ flex: 1 }}>
          <strong style={{ color: "#4e342e" }}>{item.label}</strong>
          <span style={{ color: "#a1887f", fontSize: "11px" }}> · {item.earned}/{item.points} item points · {st.label}</span>
          <br />
          {item.present && <span style={{ color: "#6d4c41" }}>{item.evidence}</span>}
          {item.reason && <span style={{ display: "block", color: "#8d3a2e" }}>{item.reason}</span>}
          {item.withheld > 0 && <span style={{ display: "block", color: "#8d3a2e" }}>{item.fix || item.where}</span>}
          {item.note && <span style={{ display: "block", color: "#8d6e63", fontStyle: "italic", fontSize: "11.5px" }}>{item.note}</span>}
          {!item.reason && item.guidance && item.withheld > 0 && (
            <span style={{ display: "block", color: "#8d6e63", fontStyle: "italic", fontSize: "11.5px" }}>{item.guidance}</span>
          )}
          {showAppeal && item.judge && item.verdict && item.withheld > 0 && (
            <button onClick={() => appealVerdict(item)}
              style={{ marginTop: "5px", background: "none", border: "1px solid #e6b8ac", color: "#8d3a2e", borderRadius: "4px", padding: "2px 8px", fontSize: "11px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <Flag size={11} /> This is wrong — check it again
            </button>
          )}
        </span>
        {item.withheld > 0 && (
          <span style={{ backgroundColor: "#e8f5e9", color: "#1B5E20", border: "1px solid #c8e6c9", borderRadius: "4px", padding: "2px 7px", fontWeight: 800, fontSize: "11.5px", whiteSpace: "nowrap", marginTop: "2px" }}>
            {fmtPts(item.pointValue)}
          </span>
        )}
      </div>
    )
  }

  const a = assessment

  const goTo = (route) => {
    if (!route) return
    if (onNavigate) onNavigate(route)
    else window.location.assign(route)
  }

  const PotentialItem = ({ item, index }) => {
    const open = openItem === item.key
    const { section, action, route } = parseWhere(item.where)
    const projected = Math.round(a.totalRaw + item.pointValue)
    const chip = !item.present
      ? "Not added yet"
      : item.earned > 0
      ? "Partly counted — worth more"
      : "Ready to claim"

    return (
      <div style={{ border: `1px solid ${open ? "#c8e6c9" : "#f0e8e0"}`, background: "white", borderRadius: "10px", marginBottom: "8px", overflow: "hidden", transition: "border-color 0.2s ease" }}>
        <div onClick={() => setOpenItem(open ? null : item.key)}
          style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", cursor: "pointer", background: open ? "#f7fbf7" : "white" }}>
          <span style={{ color: "#a1887f", fontWeight: 800, fontSize: "12px", minWidth: "18px" }}>{index + 1}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: "#4e342e", fontSize: "13px" }}>{item.label}</div>
            <div style={{ fontSize: "11px", color: "#8d6e63" }}>{item.categoryHeading} · {chip}</div>
          </div>
          <span style={{ backgroundColor: "#e8f5e9", color: "#1B5E20", border: "1px solid #c8e6c9", borderRadius: "4px", padding: "3px 8px", fontWeight: 800, fontSize: "11.5px", whiteSpace: "nowrap" }}>
            {fmtPts(item.pointValue)}
          </span>
          <ChevronDown size={16} style={{ color: "#a1887f", flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
        </div>

        {open && (
          <div style={{ padding: "14px", borderTop: "1px dashed #e8d8cf", background: "#fcfbfa" }}>
            {/* Big score example */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", padding: "14px", background: "linear-gradient(135deg,#f1f8f1 0%,#e8f5e9 100%)", border: "1px solid #c8e6c9", borderRadius: "10px", marginBottom: "12px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "9.5px", color: "#6d4c41", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 700 }}>Now</div>
                <div style={{ fontSize: "26px", fontWeight: 800, color: "#8d6e63", lineHeight: 1.1 }}>{legitimacyScore}%</div>
              </div>
              <div style={{ fontSize: "22px", color: "#1B5E20", fontWeight: 800 }}>→</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "9.5px", color: "#1B5E20", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 700 }}>With this added</div>
                <div style={{ fontSize: "30px", fontWeight: 800, color: "#1B5E20", lineHeight: 1.1 }}>{projected}%</div>
                <div style={{ fontSize: "11px", color: "#2E7D32", fontWeight: 700 }}>{fmtPts(item.pointValue)}</div>
              </div>
            </div>

            {item.present && item.evidence && (
              <div style={{ fontSize: "12px", color: "#6d4c41", marginBottom: "8px" }}>
                <strong style={{ color: "#4e342e" }}>On file:</strong> {item.evidence}
              </div>
            )}
            {item.reason && (
              <div style={{ fontSize: "12.5px", color: "#8d3a2e", background: "#fdecea", border: "1px solid #e6b8ac", borderRadius: "8px", padding: "9px 11px", marginBottom: "10px", lineHeight: 1.6 }}>
                {item.reason}
              </div>
            )}
            {item.guidance && !item.reason && (
              <div style={{ fontSize: "12px", color: "#8d6e63", fontStyle: "italic", marginBottom: "10px", lineHeight: 1.6 }}>{item.guidance}</div>
            )}

            <div style={{ fontSize: "10px", color: "#8d6e63", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "6px" }}>
              What to do
            </div>
            <div style={{ fontSize: "12.5px", color: "#5d4037", marginBottom: "10px", lineHeight: 1.6 }}>
              {item.fix || action}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
              <button onClick={() => goTo(route)} disabled={!route}
                style={{ padding: "9px 16px", background: "linear-gradient(135deg,#5d4037 0%,#4a2c20 100%)", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "12px", cursor: route ? "pointer" : "not-allowed", opacity: route ? 1 : 0.55, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                Go to {section || "the form"} <span style={{ fontSize: "13px" }}>→</span>
              </button>
              {item.judge && item.verdict && (
                <button onClick={() => appealVerdict(item)}
                  style={{ background: "none", border: "1px solid #e6b8ac", color: "#8d3a2e", borderRadius: "8px", padding: "8px 12px", fontSize: "11.5px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <Flag size={11} /> This is wrong — check it again
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  const CategoryItems = ({ category }) => (
    <div style={{ fontSize: "12.5px", color: "#6d4c41", lineHeight: 1.7 }}>
      {category.items.map((item) => <ItemRow key={item.key} item={item} />)}
      {category.key === "digital" && a && (
        <div style={{ marginTop: "8px", fontSize: "11.5px", color: "#8d6e63", fontStyle: "italic" }}>
          Scored as {a.digitalProfile.label}.
          {a.irrelevantSkipped.length ? " Channels outside this profile are not scored, so missing them costs nothing." : ""}
        </div>
      )}
    </div>
  )

  const aiInjections = a ? {
    "identity markers": <CategoryItems category={a.categories[0]} />,
    "digital presence": <CategoryItems category={a.categories[1]} />,
    "track record": <CategoryItems category={a.categories[2]} />,
    "third-party": <CategoryItems category={a.categories[3]} />,
  } : {}

  const Section = ({ title, right, open, onToggle, children }) => (
    <div style={{ marginTop: "16px", border: "1px solid #d7ccc8", borderRadius: "8px", overflow: "hidden" }}>
      <div style={{ backgroundColor: "#8d6e63", color: "white", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontWeight: "bold" }} onClick={onToggle}>
        <span>{title}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {right && <span style={{ fontSize: "13px", fontWeight: 700 }}>{right}</span>}
          <ChevronDown size={18} style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
        </div>
      </div>
      {open && <div style={{ backgroundColor: "#f5f2f0", padding: "18px" }}>{children}</div>}
    </div>
  )

  return (
    <>
      {/* ── Card ── */}
      <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #faf8f6 100%)", borderRadius: "20px", boxShadow: "0 8px 32px rgba(141,110,99,0.15)", border: "1px solid #e8ddd6", overflow: "hidden", position: "relative", width: "100%", minWidth: "210px" }}>
        <div style={{ background: "linear-gradient(135deg, #8d6e63 0%, #6d4c41 100%)", padding: "24px 30px 20px 30px", color: "white", position: "relative" }}>
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, letterSpacing: "0.5px" }}>Legitimacy</h2>
          <p style={{ margin: 0, fontSize: "13px", opacity: 0.9 }}>Business credibility assessment</p>
          <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", background: "rgba(255,255,255,0.1)", borderRadius: "50%", opacity: 0.6 }} />
          <div style={{ position: "absolute", bottom: "-10px", left: "-10px", width: "60px", height: "60px", background: "rgba(255,255,255,0.05)", borderRadius: "50%" }} />
        </div>

        <div style={{ padding: "24px", background: "white", textAlign: "center" }}>
          <div style={{ position: "relative", display: "inline-block", marginBottom: "24px" }}>
            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "110px", height: "110px", border: `4px solid ${scoreLevel.color}`, borderRadius: "50%", background: "linear-gradient(135deg,#fff 0%,#f8fff8 100%)", boxShadow: `0 6px 20px ${scoreLevel.color}30`, color: "#2d2d2d", fontWeight: "bold" }}>
              <span style={{ fontSize: "26px", fontWeight: 800, lineHeight: 1 }}>{legitimacyScore}%</span>
              <div style={{ position: "absolute", top: "-6px", left: "-6px", right: "-6px", bottom: "-6px", border: `2px solid ${scoreLevel.color}20`, borderRadius: "50%", animation: "pulse 2s infinite" }} />
            </div>
            <div style={{ position: "absolute", bottom: "-12px", left: "50%", transform: "translateX(-50%)", backgroundColor: scoreLevel.color, color: "white", padding: "6px 16px", borderRadius: "20px", fontSize: "10px", fontWeight: 600, letterSpacing: "0.5px", boxShadow: `0 4px 12px ${scoreLevel.color}40`, border: "2px solid white", whiteSpace: "nowrap" }}>
              {scoreLevel.level}
            </div>
          </div>

          

          <button onClick={() => setShowModal(true)} style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", background: "linear-gradient(135deg,#5d4037 0%,#4a2c20 100%)", color: "white", marginTop: "12px", border: "none", fontWeight: 600, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", boxShadow: "0 4px 16px rgba(93,64,55,0.3)" }}>
            <span>Score breakdown</span><ChevronDown size={16} />
          </button>
        </div>

        <style>{`@keyframes pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.7; } }`}</style>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999, padding: "20px" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={{ position: "relative", backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto", width: "90%", maxWidth: "780px", border: "1px solid #ccc" }}
            onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} style={{ position: "absolute", top: "15px", right: "15px", background: "#fff", border: "2px solid #ddd", fontSize: "20px", cursor: "pointer", color: "#666", width: "35px", height: "35px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontWeight: "bold", zIndex: 2 }}>{"×"}</button>

            <div style={{ padding: "30px 20px 20px 20px" }}>
              <h3 style={{ margin: "0 0 20px 0", fontSize: "24px", fontWeight: 600, color: "#5d4037", textAlign: "center" }}>Legitimacy score breakdown</h3>

              <div style={{ textAlign: "center", padding: "20px", background: "linear-gradient(135deg,#fdf8f6 0%,#f3e8dc 100%)", borderRadius: "12px", border: "1px solid #d6b88a" }}>
                <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "120px", height: "120px", border: `4px solid ${scoreLevel.color}`, borderRadius: "50%", background: "white", boxShadow: "0 4px 12px rgba(139,69,19,0.2)", marginBottom: "12px" }}>
                  <span style={{ fontSize: "28px", fontWeight: 700, color: "#5d4037", lineHeight: 1 }}>{legitimacyScore}%</span>
                  <span style={{ color: scoreLevel.color, fontSize: "12px", fontWeight: 600, marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{scoreLevel.level}</span>
                </div>

                {a && (
                  <>
                    <div style={{ fontSize: "14px", color: "#6d4c41" }}>
                      Business stage: <strong style={{ color: "#5d4037" }}>{a.stageLabel}</strong>
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#8d6e63", marginTop: "4px" }}>
                      Weighting for this stage — Identity {a.weights.foundational}% · Digital {a.weights.digital}% · Track record {a.weights.track}% · Third-party {a.weights.thirdParty}%
                    </div>
                    {a.availablePoints > 0 && (
                      <div style={{ marginTop: "10px", display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 16px", background: "#e8f5e9", border: "1px solid #c8e6c9", borderRadius: "20px", color: "#1B5E20", fontWeight: 700, fontSize: "12px" }}>
                        <Target size={13} /> {fmtPts(a.availablePoints)} available · potential score {Math.round(a.totalRaw + a.availablePoints)}%
                      </div>
                    )}
                  </>
                )}

                {!aiEvaluationResult && (
                  <div style={{ marginTop: "14px" }}>
                    <button onClick={runAiEvaluation} disabled={isEvaluating || !apiKey}
                      style={{ padding: "10px 20px", backgroundColor: isEvaluating ? "#8d6e63" : "#5d4037", color: "white", border: "none", borderRadius: "6px", fontWeight: 600, cursor: isEvaluating || !apiKey ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", opacity: isEvaluating || !apiKey ? 0.7 : 1 }}>
                      <RefreshCw size={16} className={isEvaluating ? "spin" : ""} />
                      {isEvaluating ? "Loading analysis..." : "Load AI analysis"}
                    </button>
                    {!apiKey && (
                      <p style={{ fontSize: "12px", color: "#f44336", marginTop: "8px" }}>
                        <AlertCircle size={14} style={{ verticalAlign: "-2px" }} /> AI analysis requires API key configuration
                      </p>
                    )}
                  </div>
                )}
              </div>

{/* ── About ── */}
              <Section title="About the legitimacy score" open={showAbout} onToggle={() => setShowAbout(!showAbout)}>
                <div style={{ color: "#5d4037", fontSize: "13px", lineHeight: 1.6 }}>

                  <p style={{ marginBottom: "16px" }}>
                    The legitimacy score assesses how professionally and credibly a business presents itself in the
                    market — beyond just legal compliance. It focuses on brand presence, digital identity, and
                    operational transparency that help build trust with funders, partners, and clients.
                  </p>

                  <div style={{ backgroundColor: "#efebe9", padding: "16px", borderRadius: "8px", marginBottom: "16px", borderLeft: "4px solid #8d6e63" }}>
                    <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>
                      Four key assessment areas{a ? ` (weighted for a ${a.stageLabel.toLowerCase()} business)` : ""}:
                    </p>
                    <ul style={{ margin: 0, paddingLeft: "20px", color: "#5d4037" }}>
                      <li style={{ marginBottom: "6px" }}>
                        <strong>Foundational business identity ({a?.weights.foundational ?? 35}%):</strong> Professional
                        website, business email, logo, physical address and proof of address
                      </li>
                      <li style={{ marginBottom: "6px" }}>
                        <strong>Digital presence ({a?.weights.digital ?? 25}%):</strong> The social and web channels that
                        matter for your industry, and online discoverability
                      </li>
                      <li style={{ marginBottom: "6px" }}>
                        <strong>Track record ({a?.weights.track ?? 15}%):</strong> Years of operation, named clients,
                        revenue history, and brands owned
                      </li>
                      <li style={{ marginBottom: "6px" }}>
                        <strong>Third-party validations ({a?.weights.thirdParty ?? 25}%):</strong> Compliance certificates,
                        industry accreditations, support letters, industry association membership, and brands represented /
                        franchises / agencies held
                      </li>
                    </ul>
                  </div>

                  <div style={{ backgroundColor: "#efebe9", padding: "16px", borderRadius: "8px", marginBottom: "16px", borderLeft: "4px solid #8d6e63" }}>
                    <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>Score interpretation:</p>
                    <ul style={{ margin: 0, paddingLeft: "20px", color: "#5d4037" }}>
                      <li style={{ marginBottom: "4px" }}>
                        <strong>91-100% (Market Leader):</strong> Your business demonstrates exceptional credibility and a
                        strong, trusted market presence.
                      </li>
                      <li style={{ marginBottom: "4px" }}>
                        <strong>81-90% (Trusted Brand):</strong> Well-established with a professional identity and growing
                        influence in the market.
                      </li>
                      <li style={{ marginBottom: "4px" }}>
                        <strong>61-80% (Emerging Force):</strong> Good foundations in place; refining presence will
                        strengthen credibility further.
                      </li>
                      <li style={{ marginBottom: "4px" }}>
                        <strong>41-60% (Building Credibility):</strong> Key elements of professional identity exist, but
                        there are noticeable gaps to address.
                      </li>
                      <li style={{ marginBottom: "4px" }}>
                        <strong>0-40% (Early Stage Identity):</strong> Foundational improvements needed to build trust and
                        a visible, professional brand.
                      </li>
                    </ul>
                  </div>

                  <div style={{ backgroundColor: "#efebe9", padding: "16px", borderRadius: "8px", marginBottom: "16px", borderLeft: "4px solid #8d6e63" }}>
                    <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>Stage-adjusted weighting:</p>
                    <p style={{ margin: 0, color: "#5d4037" }}>
                      Early-stage companies are weighted more heavily on foundational elements like professional websites
                      and branding, while mature companies are assessed primarily on track record and third-party
                      validations.
                    </p>
                  </div>

                  <p style={{ marginBottom: "20px", lineHeight: 1.6, fontStyle: "italic", color: "#6d4c41" }}>
                    The stronger your public presence and brand signals, the higher your legitimacy score — helping your
                    business stand out as credible and trustworthy in a crowded marketplace.
                  </p>

                  <div style={{ borderTop: "1px solid #d7ccc8", paddingTop: "16px", marginBottom: "14px" }}>
                    <p style={{ fontWeight: "bold", margin: 0, color: "#6d4c41", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                      How each entry is scored
                    </p>
                  </div>

                  <p style={{ marginBottom: "14px" }}>
                    Each of the four areas is scored as a fixed checklist, and what an entry earns depends on whether it is
                    what the field asked for.
                  </p>

                  <div style={{ backgroundColor: "#efebe9", padding: "16px", borderRadius: "8px", marginBottom: "14px", borderLeft: "4px solid #8d6e63" }}>
                    <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>Uploaded documents</p>
                    <p style={{ margin: 0 }}>
                      Every document was checked when you uploaded it in My Documents — the file itself was read and its
                      type, company name and expiry date confirmed. A <strong>verified</strong> document counts in full
                      here. A document that was rejected or has expired counts for nothing, and the reason shown is the
                      same one on the My Documents page. Re-upload a corrected copy there and the points return.
                    </p>
                  </div>

                  <div style={{ backgroundColor: "#efebe9", padding: "16px", borderRadius: "8px", marginBottom: "14px", borderLeft: "4px solid #8d6e63" }}>
                    <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>Typed entries</p>
                    <p style={{ margin: "0 0 8px 0" }}>
                      Website, email, address, social links, client names and brands are checked separately, since no
                      document backs them. Each gets one of these:
                    </p>
                    <ul style={{ margin: 0, paddingLeft: "18px" }}>
                      <li><strong>Counted in full</strong> — it is what the field asked for.</li>
                      <li><strong>Counted at 60%</strong> — real, but a weaker form of it.</li>
                      <li><strong>Counted at 30%</strong> — probably counts, something is off.</li>
                      <li><strong>Not counted</strong> — it does not evidence what it claims to.</li>
                    </ul>
                    <p style={{ margin: "8px 0 0 0" }}>
                      The result is stored against the exact value that produced it, so the same entry always earns the
                      same amount. Change it and it is checked afresh.
                    </p>
                  </div>

                  <div style={{ backgroundColor: "#efebe9", padding: "16px", borderRadius: "8px", marginBottom: "14px", borderLeft: "4px solid #8d6e63" }}>
                    <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>How a point value is worked out</p>
                    <p style={{ margin: 0, fontFamily: "monospace", fontSize: "12px", backgroundColor: "white", padding: "8px 10px", borderRadius: "6px", border: "1px solid #e0d5c8" }}>
                      value = (item points withheld ÷ category points) × stage weight
                    </p>
                  </div>

                  <div style={{ backgroundColor: "#efebe9", padding: "16px", borderRadius: "8px", borderLeft: "4px solid #8d6e63" }}>
                    <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>Weighting by stage</p>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                        <thead>
                          <tr style={{ color: "#6d4c41" }}>
                            <th style={{ textAlign: "left", padding: "4px 6px" }}>Stage</th>
                            <th style={{ textAlign: "right", padding: "4px 6px" }}>Identity</th>
                            <th style={{ textAlign: "right", padding: "4px 6px" }}>Digital</th>
                            <th style={{ textAlign: "right", padding: "4px 6px" }}>Track</th>
                            <th style={{ textAlign: "right", padding: "4px 6px" }}>Third-party</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(weightingsByStage).map(([k, w]) => (
                            <tr key={k} style={{ backgroundColor: a && a.stage === k ? "#f3e8dc" : "transparent", fontWeight: a && a.stage === k ? 700 : 400, color: "#5d4037" }}>
                              <td style={{ padding: "4px 6px" }}>{STAGE_LABELS[k]}</td>
                              <td style={{ padding: "4px 6px", textAlign: "right" }}>{w.foundational}%</td>
                              <td style={{ padding: "4px 6px", textAlign: "right" }}>{w.digital}%</td>
                              <td style={{ padding: "4px 6px", textAlign: "right" }}>{w.track}%</td>
                              <td style={{ padding: "4px 6px", textAlign: "right" }}>{w.thirdParty}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </Section>

             {/* ── Potential points ── */}
              {a && (
                <Section
                  title="Potential points"
                  right={a.availablePoints > 0 ? `${fmtPts(a.availablePoints)} to claim` : "All claimed"}
                  open={showPotential}
                  onToggle={() => setShowPotential(!showPotential)}
                >
                  {a.outstanding.length === 0 ? (
                    <div style={{ padding: "14px", background: "#f1f8f1", border: "1px solid #c8e6c9", borderRadius: "8px", color: "#2E7D32", lineHeight: 1.7 }}>
                      <div style={{ fontWeight: 800, marginBottom: "4px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        <CheckCircle size={14} /> Nothing left to claim
                      </div>
                      Every scored item for a {a.stageLabel.toLowerCase()} business in {a.industry} is captured and counted in full.
                    </div>
                  ) : (
                    <>
                      <div style={{ padding: "16px", background: "linear-gradient(135deg,#fdf8f6 0%,#e8f5e9 100%)", border: "1px solid #c8e6c9", borderRadius: "10px", marginBottom: "14px", textAlign: "center" }}>
                        <div style={{ fontSize: "10px", color: "#1B5E20", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.7px" }}>
                          Your score could reach
                        </div>
                        <div style={{ fontSize: "34px", fontWeight: 800, color: "#1B5E20", lineHeight: 1.2 }}>
                          {Math.round(a.totalRaw + a.availablePoints)}%
                        </div>
                        <div style={{ fontSize: "12.5px", color: "#5d4037", lineHeight: 1.6 }}>
                          {legitimacyScore}% today · <strong style={{ color: "#1B5E20" }}>{fmtPts(a.availablePoints)}</strong> sitting in {a.outstanding.length} item{a.outstanding.length === 1 ? "" : "s"} below
                        </div>
                        <div style={{ fontSize: "11.5px", color: "#8d6e63", marginTop: "6px", fontStyle: "italic" }}>
                          Tap any item to see what it is worth and go straight to the form.
                        </div>
                      </div>

                      {a.outstanding.map((item, i) => (
                        <PotentialItem key={item.key} item={item} index={i} />
                      ))}

                      <div style={{ marginTop: "10px", padding: "10px 12px", background: "#f9f5f0", border: "1px solid #e6d3c4", borderRadius: "8px", fontSize: "11.5px", color: "#6d4c41", lineHeight: 1.6 }}>
                        Each figure is the exact amount the score moves when that item is resolved — the same function promises it and awards it.
                      </div>
                    </>
                  )}
                </Section>
              )}

              {/* ── Category breakdown ── */}
              {a && (
                <Section title="Score breakdown" right={`${legitimacyScore}%`} open={showBreakdown} onToggle={() => setShowBreakdown(!showBreakdown)}>
                  {a.categories.map((c) => (
                    <div key={c.key} style={{ background: "white", borderRadius: "8px", border: "1px solid #f0e8e0", padding: "14px", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                          <div style={{ backgroundColor: c.color, width: "12px", height: "12px", borderRadius: "50%", marginRight: "12px", flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 600, color: "#5d4037", fontSize: "14px" }}>{c.label}</div>
                            <div style={{ fontSize: "11.5px", color: "#8d6e63", fontStyle: "italic" }}>
                              {c.earned}/{c.possible} item points → {c.percent}% × {c.weight}% weight = {c.weightedScore} points
                              {c.headroom > 0 ? ` · ${fmtPts(c.headroom)} unclaimed here` : " · fully claimed"}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "80px", height: "8px", background: "#f3e8dc", borderRadius: "4px", overflow: "hidden", border: "1px solid #d6b88a" }}>
                            <div style={{ width: `${c.percent}%`, height: "100%", background: barColor(c.percent), borderRadius: "4px", transition: "width 0.3s ease" }} />
                          </div>
                          <span style={{ fontWeight: 600, color: "#5d4037", fontSize: "14px", minWidth: "35px", textAlign: "right" }}>{c.percent}%</span>
                        </div>
                      </div>
                      <div style={{ borderTop: "1px dashed #e8d8cf", paddingTop: "10px" }}>
                        <CategoryItems category={c} />
                      </div>
                    </div>
                  ))}
                </Section>
              )}

           

              {/* ── Detailed analysis ── */}
              <Section title="Detailed analysis" open={showAnalysis} onToggle={() => setShowAnalysis(!showAnalysis)}>
                {aiEvaluationResult ? (
                  <div style={{ backgroundColor: "white", padding: "16px", borderRadius: "8px", border: "1px solid #e8d8cf", maxHeight: "460px", overflowY: "auto" }}>
                    {formatAiResult(aiEvaluationResult, aiInjections)}
                  </div>
                ) : (
                  <div style={{ fontSize: "12.5px", color: "#8d6e63", fontStyle: "italic", display: "flex", alignItems: "center", gap: "6px" }}>
                    <AlertCircle size={14} /> No AI analysis yet — the score and point values above are already final and do not depend on it.
                  </div>
                )}
                {aiEvaluationResult && (
                  <div style={{ marginTop: "12px", textAlign: "right" }}>
                    <button onClick={runAiEvaluation} disabled={isEvaluating || !apiKey}
                      style={{ padding: "8px 14px", backgroundColor: "#5d4037", color: "white", border: "none", borderRadius: "6px", fontWeight: 600, fontSize: "12px", cursor: isEvaluating ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "6px", opacity: isEvaluating ? 0.7 : 1 }}>
                      <RefreshCw size={14} className={isEvaluating ? "spin" : ""} />
                      {isEvaluating ? "Refreshing..." : "Refresh analysis"}
                    </button>
                  </div>
                )}
                {evaluationError && (
                  <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "#f8d7da", color: "#721c24", border: "1px solid #f5c6cb", borderRadius: "6px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertCircle size={16} /> {evaluationError}
                  </div>
                )}
              </Section>
            </div>
          </div>
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </>
  )
}