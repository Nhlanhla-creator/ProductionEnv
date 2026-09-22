/**
 * communityFunctionsAdapter.js
 * 
 * Firebase Cloud Functions Adapter for Monthly Updates, Community Moderation Reports, Disputes, and Ratings.
 * Prepares these communication services for seamless migration to Firebase Cloud Functions.
 * 
 * WHEN MIGRATING TO FIREBASE CLOUD FUNCTIONS:
 * 1. In your functions index.js:
 *      const communityFunctions = require('./services/communityFunctionsAdapter');
 *      exports.sendMonthlyProductUpdate = communityFunctions.sendMonthlyProductUpdate;
 *      exports.sendCommunityReportActioned = communityFunctions.sendCommunityReportActioned;
 *      exports.sendDisputeFiled = communityFunctions.sendDisputeFiled;
 *      exports.sendRatingSubmitted = communityFunctions.sendRatingSubmitted;
 *      exports.onDisputeCreated = communityFunctions.onDisputeCreated;
 *      exports.onRatingCreated = communityFunctions.onRatingCreated;
 */

const communityDisputeService = require("./communityDisputeService");

/**
 * Callable Firebase Function: sendMonthlyProductUpdate (SP8.13)
 * Payload: { to, recipientName, updateMonth, headline, highlights, newFeaturesUrl, changelogUrl }
 */
const sendMonthlyProductUpdateHandler = async (data, context) => {
  try {
    const payload = (data && data.data) ? data.data : (data || {});
    if (!payload.to) {
      return { success: false, error: "Recipient email is required" };
    }
    const result = await communityDisputeService.sendMonthlyProductUpdateEmail(payload);
    return { success: true, result };
  } catch (error) {
    console.error("[CloudFunction:sendMonthlyProductUpdate] Error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Callable Firebase Function: sendCommunityReportActioned (SP8.58)
 * Payload: { to, recipientName, reportId, itemType, itemTitle, actionTaken, resolutionNotes, appealsUrl }
 */
const sendCommunityReportActionedHandler = async (data, context) => {
  try {
    const payload = (data && data.data) ? data.data : (data || {});
    if (!payload.to) {
      return { success: false, error: "Recipient email is required" };
    }
    const result = await communityDisputeService.sendCommunityReportActionedEmail(payload);
    return { success: true, result };
  } catch (error) {
    console.error("[CloudFunction:sendCommunityReportActioned] Error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Callable Firebase Function: sendDisputeFiled (SP8.57)
 * Payload: { to, recipientName, disputeNumber, filedByRole, filerName, opponentName, dealTitle, disputeReason, disputeDetails, claimAmount, viewDisputeUrl, isFiler }
 */
const sendDisputeFiledHandler = async (data, context) => {
  try {
    const payload = (data && data.data) ? data.data : (data || {});
    if (!payload.to) {
      return { success: false, error: "Recipient email is required" };
    }
    const result = await communityDisputeService.sendDisputeFiledEmail(payload);
    return { success: true, result };
  } catch (error) {
    console.error("[CloudFunction:sendDisputeFiled] Error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Callable Firebase Function: sendRatingSubmitted (SP8.57)
 * Payload: { to, recipientName, raterName, dealTitle, ratingScore, categoryBreakdown, reviewComments, viewRatingUrl }
 */
const sendRatingSubmittedHandler = async (data, context) => {
  try {
    const payload = (data && data.data) ? data.data : (data || {});
    if (!payload.to) {
      return { success: false, error: "Recipient email is required" };
    }
    const result = await communityDisputeService.sendRatingSubmittedEmail(payload);
    return { success: true, result };
  } catch (error) {
    console.error("[CloudFunction:sendRatingSubmitted] Error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Firestore Trigger Schema: onDisputeCreated
 * Listens for new documents in 'disputes/{disputeId}' and automatically fires confirmation & counterparty notice.
 */
const onDisputeCreatedTrigger = async (snap, context) => {
  const disputeData = snap.data();
  if (!disputeData) return;

  const disputeNumber = disputeData.disputeNumber || `DSP-${context.params.disputeId.slice(0, 6)}`;

  // 1. Notify filer
  if (disputeData.filedByEmail) {
    await communityDisputeService.sendDisputeFiledEmail({
      to: disputeData.filedByEmail,
      recipientName: disputeData.filedByName || "Valued User",
      disputeNumber,
      filedByRole: disputeData.filedByRole || "User",
      filerName: disputeData.filedByName,
      opponentName: disputeData.respondentName || "Counterparty",
      dealTitle: disputeData.dealTitle || "Commercial Agreement",
      disputeReason: disputeData.disputeReason,
      disputeDetails: disputeData.disputeDetails,
      claimAmount: disputeData.claimAmount,
      isFiler: true,
    }).catch(err => console.error("Error sending filer dispute email:", err));
  }

  // 2. Notify respondent
  if (disputeData.respondentEmail) {
    await communityDisputeService.sendDisputeFiledEmail({
      to: disputeData.respondentEmail,
      recipientName: disputeData.respondentName || "Valued User",
      disputeNumber,
      filedByRole: disputeData.filedByRole || "User",
      filerName: disputeData.filedByName,
      opponentName: disputeData.respondentName || "Counterparty",
      dealTitle: disputeData.dealTitle || "Commercial Agreement",
      disputeReason: disputeData.disputeReason,
      disputeDetails: disputeData.disputeDetails,
      claimAmount: disputeData.claimAmount,
      isFiler: false,
    }).catch(err => console.error("Error sending respondent dispute email:", err));
  }
};

/**
 * Firestore Trigger Schema: onRatingCreated
 * Listens for new documents in 'ratings/{ratingId}' and automatically fires rating notification to ratee.
 */
const onRatingCreatedTrigger = async (snap, context) => {
  const ratingData = snap.data();
  if (!ratingData) return;

  if (ratingData.targetUserEmail) {
    await communityDisputeService.sendRatingSubmittedEmail({
      to: ratingData.targetUserEmail,
      recipientName: ratingData.targetUserName || "Valued User",
      raterName: ratingData.raterName || "Verified Buyer",
      dealTitle: ratingData.dealTitle || "Commercial Agreement",
      ratingScore: ratingData.score || 5,
      categoryBreakdown: ratingData.categoryBreakdown || {},
      reviewComments: ratingData.comments || "",
    }).catch(err => console.error("Error sending rating email:", err));
  }
};

module.exports = {
  sendMonthlyProductUpdate: sendMonthlyProductUpdateHandler,
  sendCommunityReportActioned: sendCommunityReportActionedHandler,
  sendDisputeFiled: sendDisputeFiledHandler,
  sendRatingSubmitted: sendRatingSubmittedHandler,
  onDisputeCreated: onDisputeCreatedTrigger,
  onRatingCreated: onRatingCreatedTrigger,
};
