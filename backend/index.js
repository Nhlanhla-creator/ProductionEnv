/**
 * backend/index.js
 * 
 * Central Entry Point for BigMarketplace Firebase Cloud Functions (v2).
 * Conforms to the Firebase Functions 2nd Gen architecture (as in analyzeFundingMatches.js).
 */

const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Adapters
const billingAdapter = require("./services/billingFunctionsAdapter");
const onboardingAdapter = require("./services/onboardingFunctionsAdapter");
const verificationAdapter = require("./services/verificationFunctionsAdapter");
const communityAdapter = require("./services/communityFunctionsAdapter");
const app = require("./server");

/**
 * Standard v2 onCall wrapper matching analyzeFundingMatches.js:
 * - Uses onCall from firebase-functions/v2/https
 * - Standardized logging with firebase-functions/logger
 * - Wraps errors in HttpsError
 */
function createV2Callable(handlerName, handlerFn, options = {}) {
  return onCall(
    {
      timeoutSeconds: 60,
      memory: "256MiB",
      ...options,
    },
    async (req) => {
      logger.info(`🚀 ${handlerName} started`, {
        auth: req.auth?.uid,
        hasData: !!req.data,
      });

      try {
        const result = await handlerFn(req);
        logger.info(`✅ ${handlerName} completed successfully`);
        return result;
      } catch (error) {
        logger.error(`💥 ${handlerName} failed`, {
          error: error.message,
          stack: error.stack,
        });
        throw new HttpsError("internal", error.message);
      }
    }
  );
}

// ============================================================================
// 1. BILLING, PAYMENTS & SUBSCRIPTIONS (BATCH 1)
// ============================================================================

exports.onSubscriptionStarted = createV2Callable("onSubscriptionStarted", billingAdapter.onSubscriptionStartedHandler);
exports.onPaymentFailed = createV2Callable("onPaymentFailed", billingAdapter.onPaymentFailedHandler);
exports.onSubscriptionCancelled = createV2Callable("onSubscriptionCancelled", billingAdapter.onSubscriptionCancelledHandler);
exports.sendTaxInvoice = createV2Callable("sendTaxInvoice", billingAdapter.sendTaxInvoiceHandler);
exports.sendRenewalReminder = createV2Callable("sendRenewalReminder", billingAdapter.sendRenewalReminderHandler);
exports.sendPlanUpgrade = createV2Callable("sendPlanUpgrade", billingAdapter.sendPlanUpgradeHandler);
exports.sendRefundIssued = createV2Callable("sendRefundIssued", billingAdapter.sendRefundIssuedHandler);
exports.sendSuccessFeeTriggered = createV2Callable("sendSuccessFeeTriggered", billingAdapter.sendSuccessFeeTriggeredHandler);
exports.sendSuccessFeeReceipt = createV2Callable("sendSuccessFeeReceipt", billingAdapter.sendSuccessFeeReceiptHandler);

// Firestore Trigger: Auto-dispatch on new subscription creation
exports.onSubscriptionCreated = onDocumentCreated(
  "subscriptions/{subscriptionId}",
  async (event) => {
    logger.info("⚡ onSubscriptionCreated trigger fired", { id: event.params?.subscriptionId });
    try {
      return await billingAdapter.onSubscriptionCreatedTriggerHandler(event.data, { params: event.params });
    } catch (err) {
      logger.error("💥 onSubscriptionCreated trigger failed", { error: err.message });
    }
  }
);

// ============================================================================
// 2. SME ONBOARDING & VETTING SUITE (BATCH 2)
// ============================================================================

exports.onProfileApproved = createV2Callable("onProfileApproved", onboardingAdapter.onProfileApprovedHandler);
exports.onProfileRejected = createV2Callable("onProfileRejected", onboardingAdapter.onProfileRejectedHandler);
exports.onVettingStatusUpdate = createV2Callable("onVettingStatusUpdate", onboardingAdapter.onVettingStatusUpdateHandler);
exports.onEvidenceRequested = createV2Callable("onEvidenceRequested", onboardingAdapter.onEvidenceRequestedHandler);
exports.onVettingRejection = createV2Callable("onVettingRejection", onboardingAdapter.onVettingRejectionHandler);

// Firestore Trigger: Auto-dispatch on SME universal profile update
exports.onUniversalProfileUpdated = onDocumentUpdated(
  "universal_profiles/{userId}",
  async (event) => {
    logger.info("⚡ onUniversalProfileUpdated trigger fired", { id: event.params?.userId });
    try {
      return await onboardingAdapter.onUniversalProfileUpdatedTriggerHandler(event.data?.after, { params: event.params });
    } catch (err) {
      logger.error("💥 onUniversalProfileUpdated trigger failed", { error: err.message });
    }
  }
);

// ============================================================================
// 3. BADGES, DRAFTS & EXPIRY REMINDERS (BATCH 3)
// ============================================================================

exports.onVerifiedBadgeIssued = createV2Callable("onVerifiedBadgeIssued", verificationAdapter.onVerifiedBadgeIssuedHandler);
exports.onApplicationDraftSaved = createV2Callable("onApplicationDraftSaved", verificationAdapter.onApplicationDraftSavedHandler);
exports.onDocumentExpiryWarning = createV2Callable("onDocumentExpiryWarning", verificationAdapter.onDocumentExpiryWarningHandler);

// ============================================================================
// 4. COMMUNITY, MODERATION, DISPUTES & UPDATES (BATCH 4)
// ============================================================================

exports.sendMonthlyProductUpdate = createV2Callable("sendMonthlyProductUpdate", communityAdapter.sendMonthlyProductUpdateHandler);
exports.sendCommunityReportActioned = createV2Callable("sendCommunityReportActioned", communityAdapter.sendCommunityReportActionedHandler);
exports.sendDisputeFiled = createV2Callable("sendDisputeFiled", communityAdapter.sendDisputeFiledHandler);
exports.sendRatingSubmitted = createV2Callable("sendRatingSubmitted", communityAdapter.sendRatingSubmittedHandler);

// Firestore Trigger: Auto-dispatch on dispute creation
exports.onDisputeCreated = onDocumentCreated(
  "disputes/{disputeId}",
  async (event) => {
    logger.info("⚡ onDisputeCreated trigger fired", { id: event.params?.disputeId });
    try {
      return await communityAdapter.onDisputeCreatedTriggerHandler(event.data, { params: event.params });
    } catch (err) {
      logger.error("💥 onDisputeCreated trigger failed", { error: err.message });
    }
  }
);

// Firestore Trigger: Auto-dispatch on rating submission
exports.onRatingCreated = onDocumentCreated(
  "ratings/{ratingId}",
  async (event) => {
    logger.info("⚡ onRatingCreated trigger fired", { id: event.params?.ratingId });
    try {
      return await communityAdapter.onRatingCreatedTriggerHandler(event.data, { params: event.params });
    } catch (err) {
      logger.error("💥 onRatingCreated trigger failed", { error: err.message });
    }
  }
);

// ============================================================================
// 5. SERVERLESS EXPRESS API BRIDGE
// ============================================================================

exports.api = onRequest({ timeoutSeconds: 60, memory: "512MiB" }, app);
