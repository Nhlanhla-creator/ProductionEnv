// Use confirmed CorpFinSA product rules here. A null value leaves the
// corresponding check pending lender confirmation.
export const loanPolicy = {
  maxLoanToValuePercent: null,
  loanToValueBasis: "combined",
  minimumTrustees: null,
  minimumAnnualTurnover: null,
  minimumAnnualNetProfit: null,
}

const optionalLoanCategories = [
  "Any", "Hybrid / Structured Finance", "Special Strategies", "Other",
]

export const canIncludeLoan = (useOfFunds = {}) =>
  optionalLoanCategories.includes(useOfFunds.fundingCategory)

export const requiresLoanDetails = (useOfFunds = {}) => {
  const category = useOfFunds?.fundingCategory
  if (typeof category === "string" && category.trim()) {
    return category.trim().toLowerCase() === "debt" ||
      (canIncludeLoan(useOfFunds) && useOfFunds.includesLoan === "yes")
  }

  const instruments = useOfFunds?.fundingInstruments
  return [useOfFunds?.fundingInstrument, ...(Array.isArray(instruments) ? instruments : [])]
    .some((instrument) => /\b(loan|debt|bridging finance)\b/i.test(instrument || ""))
}

export const yesNo = { yes: "Yes", no: "No" }

export const loanFields = [
  { id: "loanTermMonths", label: "Loan term (months)", type: "months" },
  { id: "fundsAvailabilityDate", label: "Date funds are needed", type: "date" },
  { id: "repaymentSource", label: "How will the loan be repaid?", type: "textarea" },
  { id: "monthlyInterestAffordable", label: "Can the business afford monthly interest payments?", options: yesNo },
  { id: "interestAffordabilityDetails", label: "How will you cover the monthly interest shortfall?", type: "textarea", when: { monthlyInterestAffordable: "no" } },
  { id: "projectDurationMonths", label: "Project duration (months)", type: "months" },
  { id: "projectValue", label: "Total project value (ZAR)", type: "positiveMoney" },
  { id: "expectedProjectProfit", label: "Expected project profit or loss (ZAR)", type: "signedMoney" },
]

export const eligibilityFields = [
  { id: "taxStanding", label: "Is the applicant in good standing with SARS?", options: yesNo },
  { id: "taxStandingDetails", label: "Explain the applicant’s current tax position", type: "textarea", when: { taxStanding: "no" } },
  { id: "annualTurnover", label: "Latest annual turnover (ZAR)", type: "money" },
  { id: "annualNetProfit", label: "Latest annual net profit or loss (ZAR)", type: "signedMoney" },
  { id: "trusteeCount", label: "Number of appointed trustees", type: "count", when: { legalStructure: "trust" } },
  { id: "rescueOrLiquidation", label: "Has the applicant or a related entity ever been in business rescue or liquidation?", options: yesNo },
  { id: "rescueOrLiquidationDetails", label: "List each entity, the dates and the outcome", type: "textarea", when: { rescueOrLiquidation: "yes" } },
  { id: "legalMatters", label: "Are there any threatened, current, pending or historical legal matters involving the applicant or a related entity?", options: yesNo },
  { id: "legalMatterDetails", label: "List the entities, matters, dates and status or outcome", type: "textarea", when: { legalMatters: "yes" } },
  { id: "historicalJudgments", label: "Have any judgments been entered against the applicant or a related entity?", options: yesNo },
  { id: "historicalJudgmentDetails", label: "List the judgments, affected entities and outcomes", type: "textarea", when: { historicalJudgments: "yes" } },
]

export const premisesFields = [
  { id: "premisesLeased", label: "Does the applicant lease its operating premises?", options: yesNo },
  { id: "landlordName", label: "Landlord name", when: { premisesLeased: "yes" } },
  { id: "landlordContact", label: "Landlord phone or email", when: { premisesLeased: "yes" } },
  { id: "annualRent", label: "Annual premises rent (ZAR)", type: "money", when: { premisesLeased: "yes" } },
]

export const propertyFields = [
  { id: "propertyAddress", label: "Property address", type: "textarea" },
  { id: "registeredOwner", label: "Registered owner / title holder" },
  { id: "purchasePrice", label: "Purchase price (ZAR)", type: "money" },
  { id: "currentValuation", label: "Current market valuation (ZAR)", type: "positiveMoney" },
  { id: "outstandingBond", label: "Total outstanding bond balance (ZAR)", type: "money" },
  { id: "bondLender", label: "Bond lender(s)", when: { hasBond: true } },
  { id: "encumbered", label: "Is the property encumbered?", options: yesNo },
  { id: "encumbranceDetails", label: "Describe the bond or other encumbrance", type: "textarea", when: { encumbered: "yes" } },
  { id: "propertyLeased", label: "Is the property leased to a tenant?", options: yesNo },
  { id: "occupants", label: "Who occupies the property? Enter vacant if applicable." },
  { id: "tenants", label: "Tenant names and lease details", type: "textarea", when: { propertyLeased: "yes" } },
  { id: "annualRentalIncome", label: "Annual rental income (ZAR)", type: "money", when: { propertyLeased: "yes" } },
]

export const principalRoles = {
  director: "Director",
  member: "Member",
  trustee: "Trustee",
  owner: "Owner",
  signatory: "Authorised signatory",
}

export const principalFields = [
  { id: "fullName", label: "Full legal name" },
  { id: "role", label: "Role", options: principalRoles },
  { id: "idNumber", label: "ID or passport number" },
  { id: "residentialAddress", label: "Residential address", type: "textarea" },
  { id: "personalEmail", label: "Personal email", type: "email" },
  { id: "personalPhone", label: "Personal phone", type: "tel" },
  { id: "debtReview", label: "Is this person under debt review?", options: yesNo },
  { id: "debtReviewDetails", label: "Provide debt-review details", type: "textarea", when: { debtReview: "yes" } },
  {
    id: "maritalStatus", label: "Marital status (where required)",
    options: { single: "Single", married: "Married", civilUnion: "Civil union", divorced: "Divorced", widowed: "Widowed" },
    optional: true,
  },
  { id: "maritalRegime", label: "Matrimonial property regime", when: { marriedOrInCivilUnion: true } },
]

export const bankFields = [
  { id: "bankName", label: "Bank name" },
  { id: "accountHolder", label: "Account holder" },
  { id: "accountNumber", label: "Account number", inputMode: "numeric" },
  { id: "branchCode", label: "Branch code", inputMode: "numeric" },
  { id: "accountType", label: "Account type" },
]

export const declarationFields = [
  { id: "repaymentDeclaration", label: "I confirm the applicant can meet the proposed loan repayments when due.", type: "confirmation" },
  { id: "historyDeclaration", label: "I have disclosed the applicable judgments, legal matters, business rescue and liquidation history.", type: "confirmation" },
  { id: "authorityDeclaration", label: "I confirm I am authorised to sign this application on behalf of the applicant.", type: "confirmation" },
  { id: "creditCheckConsent", label: "I consent to the lender carrying out credit checks for this loan application and confirm I have permission to provide the details of the other people listed.", type: "confirmation" },
  { id: "updatedFinancialsConsent", label: "I agree to provide updated financial information on request and authorise the lender to use it to assess this application.", type: "confirmation" },
  { id: "signature", label: "Signature (type your full legal name)" },
  { id: "signaturePlace", label: "Place of signature" },
  { id: "signatureDate", label: "Date signed", type: "date" },
]

export const loanDocuments = [
  { id: "bankStatements", label: "Bank statements" },
  { id: "debtorAgeing", label: "Debtor ageing analysis" },
  { id: "creditorAgeing", label: "Creditor ageing analysis" },
  { id: "fixedAssetRegister", label: "Fixed-asset register" },
  { id: "shareCertificates", label: "Share certificates", when: { shareCertificatesRequired: "yes" }, required: true },
]

export const propertyDocuments = [
  { id: "titleDeed", label: "Title deed" },
  { id: "valuationReport", label: "Valuation report" },
  { id: "ratesAndTax", label: "Rates and tax statements" },
  { id: "utilityStatements", label: "Utility statements" },
  { id: "zoningCertificate", label: "Zoning certificate" },
  { id: "rentRoll", label: "Rent roll or tenant details", when: { propertyLeased: "yes" } },
]

export const signingAuthority = { id: "signingAuthority", label: "Proof of signing authority (for example, a resolution)", required: true }
export const propertyOffered = { id: "propertyOffered", label: "Is property being offered as security?", options: yesNo }
export const shareCertificatesRequired = { id: "shareCertificatesRequired", label: "Are share certificates required for this loan?", options: yesNo }

export const fieldApplies = (field, context) =>
  Object.entries(field.when || {}).every(([key, value]) => context[key] === value)

const text = (value) => String(value ?? "").trim()
const normalizeName = (value) => text(value).replace(/\s+/g, " ").toLowerCase()

function parseMoney(value) {
  const amount = text(value).replace(/^R\s*/i, "").replace(/[\s,]/g, "")
  if (!/^-?\d+(\.\d{1,2})?$/.test(amount)) return NaN
  const parsed = Number(amount)
  return Number.isFinite(parsed) ? parsed : NaN
}

export function getLoanProfile(profile = {}) {
  const legalStructure = text(profile.entityOverview?.legalStructure).toLowerCase()
  const ownership = profile.ownershipManagement || {}
  let role = "director"
  let people = ownership.directors || ownership.governingBody || []
  if (legalStructure === "cc" || legalStructure.includes("close corporation")) {
    role = "member"
    people = ownership.members || ownership.shareholders || []
  } else if (legalStructure === "trust") {
    role = "trustee"
    people = ownership.trustees || people
  } else if (legalStructure === "sole proprietor" || legalStructure === "partnership") {
    role = "owner"
    people = ownership.shareholders || []
  }
  return {
    legalStructure,
    principals: people.filter((row) => text(row?.name)).map((row) => ({ fullName: text(row.name), role })),
  }
}

export const samePrincipal = (first, second) =>
  first.role === second.role && normalizeName(first.fullName) === normalizeName(second.fullName)

export const principalContext = (principal) => ({
  ...principal,
  marriedOrInCivilUnion: ["married", "civilUnion"].includes(principal.maritalStatus),
})

export const propertyContext = (property) => ({
  ...property,
  hasBond: parseMoney(property.outstandingBond) > 0,
})

export function getLoanToValue(loan, amountRequested) {
  const requested = parseMoney(amountRequested)
  const properties = loan.properties || []
  if (loan.propertyOffered !== "yes" || !(requested > 0) || !properties.length) return null

  const values = properties.map((property) => parseMoney(property.currentValuation))
  const bonds = properties.map((property) => parseMoney(property.outstandingBond))
  if (values.some((value) => !(value > 0)) || bonds.some((value) => !(value >= 0))) return null

  const totalValue = values.reduce((total, value) => total + value, 0)
  const totalBonds = bonds.reduce((total, value) => total + value, 0)
  return { requested: (requested / totalValue) * 100, combined: ((requested + totalBonds) / totalValue) * 100 }
}

const hasEvidence = (entries) => Array.isArray(entries) && entries.some((entry) =>
  (typeof entry === "string" && /^https?:\/\//i.test(entry)) ||
  (typeof File !== "undefined" && entry instanceof File)
)

const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(value)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function getLoanIssues(loan, useOfFunds, profile = {}, policy = loanPolicy) {
  if (!requiresLoanDetails(useOfFunds)) return []

  const issues = []
  const checkFields = (fields, values, context = values, prefix = "") => {
    fields.filter((field) => fieldApplies(field, context)).forEach((field) => {
      const value = values[field.id]
      const label = prefix + field.label
      if (field.type === "confirmation") {
        if (value !== true) issues.push(`Confirm: ${label}`)
      } else if (!text(value)) {
        if (!field.optional) issues.push(`Complete ${label}.`)
      } else if (field.options && !Object.prototype.hasOwnProperty.call(field.options, value)) {
        issues.push(`Select a valid answer for ${label}.`)
      } else if (["months", "count"].includes(field.type) && !/^[1-9]\d*$/.test(text(value))) {
        issues.push(`Enter a positive whole number for ${label}.`)
      } else if (["money", "positiveMoney", "signedMoney"].includes(field.type)) {
        const amount = parseMoney(value)
        if (!Number.isFinite(amount) || (field.type === "money" && amount < 0) ||
            (field.type === "positiveMoney" && amount <= 0)) {
          issues.push(`Enter a valid amount for ${label}.`)
        }
      } else if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(value))) {
        issues.push(`Enter a valid email for ${label}.`)
      } else if (field.type === "date" && !isValidDate(value)) {
        issues.push(`Enter a valid date for ${label}.`)
      }
    })
  }

  checkFields(loanFields, loan)
  checkFields(eligibilityFields, loan, { ...loan, legalStructure: profile.legalStructure })
  checkFields([...premisesFields, propertyOffered, shareCertificatesRequired], loan)
  checkFields(bankFields, loan)

  if (loan.propertyOffered === "yes") {
    const properties = loan.properties || []
    if (!properties.length) issues.push("Add at least one property offered as security.")
    properties.forEach((property, index) => {
      checkFields(propertyFields, property, propertyContext(property), `Property ${index + 1} — `)
      if (parseMoney(property.outstandingBond) > 0 && property.encumbered === "no") {
        issues.push(`Property ${index + 1} has an outstanding bond and must be marked encumbered.`)
      }
    })
    const ltv = getLoanToValue(loan, useOfFunds.amountRequested)
    const basis = policy.loanToValueBasis === "requested" ? "requested" : "combined"
    if (policy.maxLoanToValuePercent !== null && ltv && ltv[basis] > policy.maxLoanToValuePercent) {
      issues.push(`${basis === "requested" ? "Requested" : "Combined"} loan-to-value exceeds the lender’s ${policy.maxLoanToValuePercent}% limit.`)
    }
  }

  const principals = loan.principals || []
  if (!principals.length) issues.push("Add at least one principal or authorised signatory.")
  principals.forEach((principal, index) =>
    checkFields(principalFields, principal, principalContext(principal), `Person ${index + 1} — `)
  )
  const missingPeople = (profile.principals || []).filter((person) => !principals.some((row) => samePrincipal(person, row)))
  missingPeople.forEach((person) => issues.push(`Add ${person.fullName} from the Universal Profile.`))
  if (loan.allPrincipalsIncluded !== true) issues.push("Confirm that all relevant directors, members or trustees are listed.")

  if (profile.legalStructure === "trust") {
    const trusteeCount = Number(loan.trusteeCount)
    const trustees = new Set(principals.filter((person) => person.role === "trustee").map((person) => normalizeName(person.fullName)))
    trustees.delete("")
    if (trusteeCount > 0 && trusteeCount !== trustees.size) issues.push("List each appointed trustee so the count matches.")
    if (policy.minimumTrustees !== null && trusteeCount < policy.minimumTrustees) {
      issues.push(`At least ${policy.minimumTrustees} appointed trustees are required.`)
    }
  }

  for (const [field, minimum, label] of [
    ["annualTurnover", policy.minimumAnnualTurnover, "annual turnover"],
    ["annualNetProfit", policy.minimumAnnualNetProfit, "annual net profit"],
  ]) {
    if (minimum !== null && parseMoney(loan[field]) < minimum) {
      issues.push(`The lender requires a minimum ${label} of R ${minimum.toLocaleString("en-ZA")}.`)
    }
  }

  checkFields(declarationFields, loan)
  const signatory = principals.find((person) => person.id === loan.signatoryId)
  if (!signatory) issues.push("Select the person signing this loan application.")
  if (signatory && text(loan.signature) && normalizeName(loan.signature) !== normalizeName(signatory.fullName)) {
    issues.push("The signature must match the selected signatory’s full legal name.")
  }
  for (const document of [...loanDocuments, signingAuthority]) {
    if (document.required && fieldApplies(document, loan) && !hasEvidence(loan[document.id])) {
      issues.push(`Upload ${document.label.toLowerCase()}.`)
    }
  }
  return issues
}

export function loanDataForSave(loan, useOfFunds, profile) {
  if (!requiresLoanDetails(useOfFunds)) return null

  const clearHiddenFields = (fields, context) => Object.fromEntries(
    fields.filter((field) => !fieldApplies(field, context)).map((field) => [field.id, null])
  )
  const properties = loan.propertyOffered === "yes" ? (loan.properties || []).map((property) => ({
    ...property,
    ...clearHiddenFields([...propertyFields, ...propertyDocuments], propertyContext(property)),
  })) : []

  return {
    ...loan,
    ...clearHiddenFields(
      [...loanFields, ...eligibilityFields, ...premisesFields, ...loanDocuments],
      { ...loan, legalStructure: profile.legalStructure }
    ),
    legalStructure: profile.legalStructure || "",
    properties,
    principals: (loan.principals || []).map((person) => ({
      ...person,
      ...clearHiddenFields(principalFields, principalContext(person)),
    })),
  }
}
