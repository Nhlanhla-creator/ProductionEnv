/**
 * verificationFunctionsAdapter.js
 * 
 * Firebase Cloud Functions Adapter for Verification Badges, Draft Nudges, and Document Expiry.
 * Prepares the verification notification services for Firebase Cloud Functions deployment.
 * 
 * WHEN MIGRATING TO FIREBASE CLOUD FUNCTIONS:
 * 1. In your functions index.js:
 *      const verificationFunctions = require('./services/verificationFunctionsAdapter');
 *      exports.onVerifiedBadgeIssued = verificationFunctions.onVerifiedBadgeIssued;
 *      exports.onApplicationDraftSaved = verificationFunctions.onApplicationDraftSaved;
 *      exports.onDocumentExpiryWarning = verificationFunctions.onDocumentExpiryWarning;
 *      exports.checkExpiringDocumentsCron = verificationFunctions.checkExpiringDocumentsCron;
 */

const verificationNudgeService = require("./verificationNudgeService");

/**
 * Callable Firebase Function: onVerifiedBadgeIssued (SP8.29)
 * Payload: { to, recipientName, companyName, bigScore, tierName, issueDate, profileUrl }
 */
const onVerifiedBadgeIssuedHandler = async (data, context) => {
  try {
    const payload = (data && data.data) ? data.data : (data || {});
    if (!payload.to) {
      return { success: false, error: "Recipient email is required" };
    }
    const result = await verificationNudgeService.sendVerifiedBadgeIssuedEmail(payload);
    return { success: true, result };
  } catch (error) {
    console.error("[CloudFunction:onVerifiedBadgeIssued] Error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Callable Firebase Function: onApplicationDraftSaved (SP8.20)
 * Payload: { to, recipientName, companyName, applicationType, completedSectionsCount, totalSectionsCount, remainingSections, resumeUrl }
 */
const onApplicationDraftSavedHandler = async (data, context) => {
  try {
    const payload = (data && data.data) ? data.data : (data || {});
    if (!payload.to) {
      return { success: false, error: "Recipient email is required" };
    }
    const result = await verificationNudgeService.sendApplicationDraftSavedNudgeEmail(payload);
    return { success: true, result };
  } catch (error) {
    console.error("[CloudFunction:onApplicationDraftSaved] Error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Callable Firebase Function: onDocumentExpiryWarning (SP8.41)
 * Payload: { to, recipientName, companyName, documentName, warningType, expiryDate, daysRemaining, renewUrl }
 */
const onDocumentExpiryWarningHandler = async (data, context) => {
  try {
    const payload = (data && data.data) ? data.data : (data || {});
    if (!payload.to) {
      return { success: false, error: "Recipient email is required" };
    }
    const result = await verificationNudgeService.sendDocumentExpiryWarningEmail(payload);
    return { success: true, result };
  } catch (error) {
    console.error("[CloudFunction:onDocumentExpiryWarning] Error:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  onVerifiedBadgeIssuedHandler,
  onApplicationDraftSavedHandler,
  onDocumentExpiryWarningHandler,
};
