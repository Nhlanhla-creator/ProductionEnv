/**
 * onboardingFunctionsAdapter.js
 * 
 * Firebase Cloud Functions Adapter for SME Onboarding & Vetting.
 * Prepares the onboarding & vetting notification services for Firebase Cloud Functions deployment.
 * 
 * WHEN MIGRATING TO FIREBASE CLOUD FUNCTIONS:
 * 1. In your functions index.js:
 *      const onboardingFunctions = require('./services/onboardingFunctionsAdapter');
 *      exports.onProfileApproved = onboardingFunctions.onProfileApproved;
 *      exports.onProfileRejected = onboardingFunctions.onProfileRejected;
 *      exports.onVettingStatusUpdate = onboardingFunctions.onVettingStatusUpdate;
 *      exports.onEvidenceRequested = onboardingFunctions.onEvidenceRequested;
 *      exports.onVettingRejection = onboardingFunctions.onVettingRejection;
 *      exports.onUniversalProfileUpdatedTrigger = onboardingFunctions.onUniversalProfileUpdatedTrigger;
 */

const onboardingVettingService = require("./onboardingVettingService");

/**
 * Callable Firebase Function: onProfileApproved (SP8.17)
 * Payload: { to, recipientName, companyName, approvalDate, bigScore, marketplaceUrl, profileUrl }
 */
const onProfileApprovedHandler = async (data, context) => {
  try {
    const payload = (data && data.data) ? data.data : (data || {});
    if (!payload.to) {
      return { success: false, error: "Recipient email is required" };
    }
    const result = await onboardingVettingService.sendProfileApprovedEmail(payload);
    return { success: true, result };
  } catch (error) {
    console.error("[CloudFunction:onProfileApproved] Error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Callable Firebase Function: onProfileRejected (SP8.18)
 * Payload: { to, recipientName, companyName, issues, generalReason, reeditUrl }
 */
const onProfileRejectedHandler = async (data, context) => {
  try {
    const payload = (data && data.data) ? data.data : (data || {});
    if (!payload.to) {
      return { success: false, error: "Recipient email is required" };
    }
    const result = await onboardingVettingService.sendProfileRejectedEmail(payload);
    return { success: true, result };
  } catch (error) {
    console.error("[CloudFunction:onProfileRejected] Error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Callable Firebase Function: onVettingStatusUpdate (SP8.24)
 * Payload: { to, recipientName, companyName, vettingStage, estimatedDaysRemaining, analystNotes, dashboardUrl }
 */
const onVettingStatusUpdateHandler = async (data, context) => {
  try {
    const payload = (data && data.data) ? data.data : (data || {});
    if (!payload.to) {
      return { success: false, error: "Recipient email is required" };
    }
    const result = await onboardingVettingService.sendVettingStatusUpdateEmail(payload);
    return { success: true, result };
  } catch (error) {
    console.error("[CloudFunction:onVettingStatusUpdate] Error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Callable Firebase Function: onEvidenceRequested (SP8.25)
 * Payload: { to, recipientName, companyName, requestedDocuments, deadlineDays, submissionDeadline, instructions, uploadUrl }
 */
const onEvidenceRequestedHandler = async (data, context) => {
  try {
    const payload = (data && data.data) ? data.data : (data || {});
    if (!payload.to) {
      return { success: false, error: "Recipient email is required" };
    }
    const result = await onboardingVettingService.sendEvidenceRequestedEmail(payload);
    return { success: true, result };
  } catch (error) {
    console.error("[CloudFunction:onEvidenceRequested] Error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Callable Firebase Function: onVettingRejection (SP8.30)
 * Payload: { to, recipientName, companyName, rejectionReasons, reapplicationDate, cooldownDays, recommendations, feedbackUrl }
 */
const onVettingRejectionHandler = async (data, context) => {
  try {
    const payload = (data && data.data) ? data.data : (data || {});
    if (!payload.to) {
      return { success: false, error: "Recipient email is required" };
    }
    const result = await onboardingVettingService.sendVettingRejectionEmail(payload);
    return { success: true, result };
  } catch (error) {
    console.error("[CloudFunction:onVettingRejection] Error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Firestore Document Trigger: onUniversalProfileUpdatedTrigger
 * Triggers automatically when a universalProfiles document status is changed:
 * universalProfiles/{userId}
 */
const onUniversalProfileUpdatedTriggerHandler = async (change, context) => {
  try {
    const before = change.before ? change.before.data() : null;
    const after = change.after ? change.after.data() : null;
    if (!after) return null;

    const email = after.contactDetails?.email || after.email;
    const name = after.contactDetails?.contactName || after.entityOverview?.registeredName || "Valued SME";
    const company = after.entityOverview?.registeredName || "Your Business";

    if (!email) return null;

    // Trigger profile approval when status switches to approved or verified
    if (after.status === "approved" && before?.status !== "approved") {
      return await onboardingVettingService.sendProfileApprovedEmail({
        to: email,
        recipientName: name,
        companyName: company,
        bigScore: after.bigScore || after.complianceScore,
      });
    }

    // Trigger profile rejection when status switches to rejected
    if (after.status === "rejected" && before?.status !== "rejected") {
      return await onboardingVettingService.sendProfileRejectedEmail({
        to: email,
        recipientName: name,
        companyName: company,
        issues: after.rejectionIssues || [],
        generalReason: after.rejectionReason,
      });
    }

    // Trigger vetting status change
    if (after.vettingStatus && after.vettingStatus !== before?.vettingStatus) {
      return await onboardingVettingService.sendVettingStatusUpdateEmail({
        to: email,
        recipientName: name,
        companyName: company,
        vettingStage: after.vettingStatus,
        analystNotes: after.analystNotes,
      });
    }

    return null;
  } catch (error) {
    console.error("[Trigger:onUniversalProfileUpdated] Error:", error);
    return null;
  }
};

module.exports = {
  onProfileApprovedHandler,
  onProfileRejectedHandler,
  onVettingStatusUpdateHandler,
  onEvidenceRequestedHandler,
  onVettingRejectionHandler,
  onUniversalProfileUpdatedTriggerHandler,
};
