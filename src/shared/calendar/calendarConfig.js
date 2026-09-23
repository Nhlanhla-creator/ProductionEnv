// One configuration per dashboard. Paths and collection names use your current Firestore schema.
// Only SME and Investor are enabled here; verify other dashboards' schemas before enabling them.
const SME_EVENTS = "smeCalendarEvents";

export const calendarConfigs = {
  sme: {
    role: "sme",
    label: "SME",
    route: "/calendar", // change if your actual SME route differs
    eventCollection: SME_EVENTS,
    ownerField: "smeId",
    ownerNameField: "smeName",
    eventSources: [
      { collection: SME_EVENTS, field: "ownerUid" },
      { collection: SME_EVENTS, field: "smeId" },
      { collection: "supplierCalendarEvents", field: "supplierId" },
    ],
    profileCollections: ["MyuniversalProfiles", "universalProfiles", "users"],
    profileNamePaths: [
      "formData.entityOverview.tradingName",
      "formData.entityOverview.registeredName",
      "entityOverview.tradingName",
      "entityOverview.registeredName",
      "formData.contactDetails.primaryContactName",
      "contactDetails.contactName",
      "name", "fullName", "displayName", "email",
    ],
    recipientSources: [
      { collection: "supplierApplications", ownerField: "customerId", counterpartField: "supplierId", nameFields: ["supplierName"], type: "Supplier" },
      { collection: "supplierApplications", ownerField: "supplierId", counterpartField: "customerId", nameFields: ["customerName"], type: "Customer" },
      { collection: "SmeAdvisorApplications", ownerField: "smeId", counterpartField: "advisorId", nameFields: ["advisorName"], type: "Advisor" },
      { collection: "smeApplications", ownerField: "smeId", counterpartField: "funderId", nameFields: ["fundName", "funderName"], type: "Investor" },
      { collection: "smeCatalystApplications", ownerField: "smeId", counterpartField: "catalystId", nameFields: ["acceleratorName", "catalystName"], type: "Catalyst" },
      { collection: "internshipApplications", ownerField: "sponsorId", counterpartField: "applicantId", nameFields: ["internName", "applicantName", "applicantEmail"], type: "Intern" },
      { collection: "internshipApplications", ownerField: "applicantId", counterpartField: "sponsorId", nameFields: ["sponsorName"], type: "Sponsor" },
    ],
  },
  investor: {
    role: "investor",
    label: "Investor",
    route: "/investor-calendar",
    eventCollection: SME_EVENTS, // preserve current collection; no data migration needed
    ownerField: "funderId",
    ownerNameField: "funderName",
    eventSources: [
      { collection: SME_EVENTS, field: "ownerUid" },
      { collection: SME_EVENTS, field: "funderId" },
      // Some invitations from the first SME calendar were copied with smeId=invitee uid.
      { collection: SME_EVENTS, field: "smeId", legacyInviteOnly: true },
    ],
    profileCollections: ["MyuniversalProfiles", "universalProfiles", "users"],
    profileNamePaths: [
      "formData.fundManageOverview.registeredName",
      "fundManageOverview.registeredName",
      "formData.entityOverview.tradingName",
      "formData.entityOverview.registeredName",
      "entityOverview.tradingName",
      "entityOverview.registeredName",
      "formData.contactDetails.primaryContactName",
      "contactDetails.contactName",
      "name", "fullName", "displayName", "email",
    ],
    recipientSources: [
      // SME->Funder applications are the inverse of the SME calendar's funder lookup.
      { collection: "smeApplications", ownerField: "funderId", counterpartField: "smeId", nameFields: ["smeName", "businessName", "registeredName"], type: "SME" },
      // Keep this source only if your investorApplications records use investorId/smeId.
      { collection: "investorApplications", ownerField: "investorId", counterpartField: "smeId", nameFields: ["smeName", "businessName"], type: "SME" },
    ],
  },
};

export const calendarRoleByRecipientType = {
  SME: "sme", Investor: "investor", Funder: "investor",
  // Register advisor, supplier, customer, intern and other roles only after
  // specifying their real route and event-owner field. Do not mislabel them SME.
};

export const getCalendarConfig = (role) => {
  const config = calendarConfigs[role];
  if (!config) throw new Error(`Unknown calendar role: ${role}`);
  return config;
};
