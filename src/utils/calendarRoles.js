// Per-role config for the shared Calendar's "Invite" recipient list.
// Each role lists the application collections that connect it to its
// counterparts. `myField` holds *this* role's uid on that collection;
// `counterpartField` holds the other party's uid; `nameFields` are checked
// in order for a name already stored on the doc — if none are set, the
// counterpart's own profile collection is looked up instead (see
// utils/counterpartProfile.js).
export const CALENDAR_ROLES = {
  sme: {
    label: "SME",
    matches: [
      { collection: "supplierApplications", myField: "customerId", counterpartField: "supplierId", nameFields: ["supplierName"], type: "Supplier" },
      { collection: "supplierApplications", myField: "supplierId", counterpartField: "customerId", nameFields: ["customerName"], type: "Customer" },
      { collection: "SmeAdvisorApplications", myField: "smeId", counterpartField: "advisorId", nameFields: ["advisorName"], type: "Advisor" },
      { collection: "smeApplications", myField: "smeId", counterpartField: "funderId", nameFields: ["fundName", "funderName"], type: "Funder" },
      { collection: "smeCatalystApplications", myField: "smeId", counterpartField: "catalystId", nameFields: ["acceleratorName", "catalystName"], type: "Catalyst" },
      { collection: "internshipApplications", myField: "sponsorId", counterpartField: "applicantId", nameFields: ["internName", "applicantName", "applicantEmail"], type: "Intern" },
      { collection: "internshipApplications", myField: "applicantId", counterpartField: "sponsorId", nameFields: ["sponsorName"], type: "Sponsor" },
    ],
  },

  // ── Below this line mirrors the SME entries from the counterpart's side.
  // Field names are inferred from your {role}Id / {role}Name dealflow
  // convention and NOT yet confirmed — verify against real docs before
  // trusting these dropdowns.
  advisor: {
    label: "Advisor",
    matches: [
      { collection: "SmeAdvisorApplications", myField: "advisorId", counterpartField: "smeId", nameFields: ["smeName"], type: "SME" },
    ],
  },
  investor: {
    label: "Investor",
    matches: [
      { collection: "smeApplications", myField: "funderId", counterpartField: "smeId", nameFields: ["smeName"], type: "SME" },
    ],
  },
  catalyst: {
    label: "Catalyst",
    matches: [
      { collection: "smeCatalystApplications", myField: "catalystId", counterpartField: "smeId", nameFields: ["smeName"], type: "SME" },
    ],
  },
  intern: {
    label: "Intern",
    matches: [
      { collection: "internshipApplications", myField: "applicantId", counterpartField: "sponsorId", nameFields: ["sponsorName"], type: "Sponsor" },
    ],
  },
  programSponsor: {
    label: "Program Sponsor",
    matches: [
      { collection: "internshipApplications", myField: "sponsorId", counterpartField: "applicantId", nameFields: ["internName", "applicantName", "applicantEmail"], type: "Intern" },
    ],
  },

  // No known application collection for these two — dropdown will just show
  // "No invitee — personal event" until you confirm where their matches live.
  associator: { label: "Associator", matches: [] },
  cmf: { label: "Capital Market Facilitator", matches: [] },
};