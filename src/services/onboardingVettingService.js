/**
 * onboardingVettingService.js
 * 
 * Centralized Client-Side Onboarding & Vetting Notification Service.
 * Universal for SME Onboarding, Verification, and Vetting processes.
 * 
 * Multi-Channel Dispatch:
 * 1. Branded HTML Email via backend /api/email/* (or Firebase Cloud Functions)
 * 2. In-App Notification (dispatches role-specific events like `newSmeNotification`)
 * 3. Persistent Firestore `messages` collection record (synced with useMessages & useNotifications)
 */

import { collection, addDoc, getFirestore } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebaseConfig";

// Base API URL configuration
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "https://brown-ivory-website-h8srool38-big-league.vercel.app");

class ClientOnboardingVettingService {
  /**
   * Dispatches in-app notification events
   */
  dispatchInAppNotification({ message, type = "info", details = {} }) {
    if (typeof window === "undefined") return;

    // 1. SME Dashboard event & localStorage persistence
    const smeEvent = new CustomEvent("newSmeNotification", {
      detail: {
        message,
        type: type === "error" ? "error" : type === "warning" ? "warning" : "status_change",
        timestamp: new Date().toISOString(),
        ...details,
      },
    });
    window.dispatchEvent(smeEvent);

    try {
      const saved = JSON.parse(localStorage.getItem("smeNotifications") || "[]");
      const newNotif = {
        id: Date.now(),
        message,
        type: type === "error" ? "error" : type === "warning" ? "warning" : "status_change",
        timestamp: new Date().toISOString(),
        read: false,
        title: details.title || "Vetting & Verification",
      };
      localStorage.setItem("smeNotifications", JSON.stringify([newNotif, ...saved].slice(0, 50)));
    } catch (e) {
      console.warn("Could not write to smeNotifications localStorage", e);
    }

    // 2. Universal cross-dashboard event
    const universalEvent = new CustomEvent("newBillingNotification", {
      detail: {
        message,
        type,
        userType: "smse",
        timestamp: new Date().toISOString(),
        details,
      },
    });
    window.dispatchEvent(universalEvent);
  }

  /**
   * Persists message to Firestore `messages` and `notifications` collections
   */
  async persistToFirestoreMessages({ userId, subject, content, type = "vetting", metadata = {} }) {
    if (!userId) return;
    try {
      const firestore = db || getFirestore();

      // Write to 'messages' collection
      const messageDoc = {
        to: userId,
        from: "BigMarketplace Vetting Team",
        subject,
        content,
        date: new Date().toISOString(),
        read: false,
        type: "vetting",
        vettingType: type,
        ...metadata,
      };
      await addDoc(collection(firestore, "messages"), messageDoc);

      // Write to 'notifications' collection
      const notificationDoc = {
        userId,
        title: subject,
        message: content,
        type: type === "profile_rejected" || type === "vetting_rejected" ? "error" : type === "evidence_requested" ? "warning" : "status_change",
        read: false,
        createdAt: new Date().toISOString(),
        ...metadata,
      };
      await addDoc(collection(firestore, "notifications"), notificationDoc).catch(() => {});

      console.log(`✅ [OnboardingVetting] Message persisted to Firestore for user ${userId}`);
    } catch (err) {
      console.error("⚠️ [OnboardingVetting] Failed to save message to Firestore:", err);
    }
  }

  /**
   * Helper: Dispatches via Firebase Cloud Function callable primarily, with backend API fallback
   */
  async callEmailEndpoint(endpoint, payload, functionName = null) {
    // 1. Primary: Dispatch via Firebase Cloud Function callable
    if (functionName) {
      try {
        const callable = httpsCallable(functions, functionName);
        const fnResult = await callable(payload);
        console.log(`✅ [OnboardingVetting] Dispatched via Firebase Cloud Function (${functionName}):`, fnResult.data);
        return fnResult.data;
      } catch (fnError) {
        console.warn(`⚠️ [OnboardingVetting] Cloud Function (${functionName}) unavailable, falling back to backend API:`, fnError.message);
      }
    }

    // 2. Fallback: Dispatch via backend API endpoint
    try {
      const response = await fetch(`${API_BASE_URL}/api/email/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ [OnboardingVetting] Email sent via API fallback (${endpoint}):`, result);
        return result;
      }
      throw new Error(`API responded with status ${response.status}`);
    } catch (apiError) {
      console.error(`❌ [OnboardingVetting] API fallback also failed (${endpoint}):`, apiError.message);
      return { success: false, error: apiError.message };
    }
  }

  /**
   * 1. NOTIFY SME PROFILE APPROVED – MARKETPLACE ACTIVATED (SP8.17)
   */
  async notifyProfileApproved({
    user,
    companyName = "Your Business",
    bigScore = null,
    recipientName = null,
  }) {
    const recipientEmail = user?.email;
    const name = recipientName || user?.displayName || user?.email?.split("@")[0] || "Valued Business Leader";
    const userId = user?.uid;

    const notificationMessage = `🎉 Congratulations! Your profile has been approved and your Marketplace listing for ${companyName} is now active!`;

    // 1. In-app notification
    this.dispatchInAppNotification({
      message: notificationMessage,
      type: "status_change",
      details: { companyName, bigScore, title: "Marketplace Activated" },
    });

    // 2. Persistent Firestore message
    if (userId) {
      await this.persistToFirestoreMessages({
        userId,
        subject: `Profile Approved – Marketplace Activated! 🎉`,
        content: `Your Universal Profile for ${companyName} has passed compliance verification. Your marketplace listing is now active and discoverable by commercial buyers and institutional funders.`,
        type: "profile_approved",
        metadata: { companyName, bigScore, status: "approved" },
      });
    }

    // 3. Branded HTML Email
    if (recipientEmail) {
      return this.callEmailEndpoint(
        "profile-approved",
        {
          to: recipientEmail,
          recipientName: name,
          companyName,
          bigScore,
        },
        "onProfileApproved"
      );
    }

    return { success: true };
  }

  /**
   * 2. NOTIFY SME PROFILE REJECTED – NEXT STEPS + HOW TO FIX (SP8.18)
   */
  async notifyProfileRejected({
    user,
    companyName = "Your Business",
    issues = [],
    generalReason = "Some required verification details or compliance documents require revision.",
    recipientName = null,
  }) {
    const recipientEmail = user?.email;
    const name = recipientName || user?.displayName || user?.email?.split("@")[0] || "Valued Business Leader";
    const userId = user?.uid;

    const notificationMessage = `⚠️ Profile Action Required: Universal Profile for ${companyName} needs revision before it can be activated.`;

    // 1. In-app notification
    this.dispatchInAppNotification({
      message: notificationMessage,
      type: "warning",
      details: { companyName, issues, title: "Profile Revision Needed" },
    });

    // 2. Persistent Firestore message
    if (userId) {
      await this.persistToFirestoreMessages({
        userId,
        subject: `Profile Revision Required: Next Steps & How to Fix ⚠️`,
        content: `During review of your Universal Profile, our team identified items needing correction: ${generalReason}. Please update the flagged sections in your profile and resubmit.`,
        type: "profile_rejected",
        metadata: { companyName, issues, generalReason, requiresAction: true },
      });
    }

    // 3. Branded HTML Email
    if (recipientEmail) {
      return this.callEmailEndpoint(
        "profile-rejected",
        {
          to: recipientEmail,
          recipientName: name,
          companyName,
          issues,
          generalReason,
        },
        "onProfileRejected"
      );
    }

    return { success: true };
  }

  /**
   * 3. NOTIFY VETTING STATUS UPDATE (queued / in progress / completed - SP8.24)
   */
  async notifyVettingStatusUpdate({
    user,
    companyName = "Your Business",
    vettingStage = "in_progress",
    estimatedDaysRemaining = 3,
    analystNotes = null,
    recipientName = null,
  }) {
    const recipientEmail = user?.email;
    const name = recipientName || user?.displayName || user?.email?.split("@")[0] || "Valued Business Leader";
    const userId = user?.uid;

    const stageLabel = vettingStage === "queued" ? "Queued for Review" : vettingStage === "completed" ? "Vetting Completed" : "Under Active Review";
    const notificationMessage = `🔍 Vetting Status Update: Your application is now ${stageLabel}.`;

    // 1. In-app notification
    this.dispatchInAppNotification({
      message: notificationMessage,
      type: vettingStage === "completed" ? "status_change" : "info",
      details: { companyName, vettingStage, stageLabel, title: "Vetting Status" },
    });

    // 2. Persistent Firestore message
    if (userId) {
      await this.persistToFirestoreMessages({
        userId,
        subject: `Vetting Status Update: ${stageLabel}`,
        content: `Your business verification status for ${companyName} has moved to "${stageLabel}". ${analystNotes ? `Notes: ${analystNotes}` : ""}`,
        type: "vetting_status",
        metadata: { companyName, vettingStage, estimatedDaysRemaining, analystNotes },
      });
    }

    // 3. Branded HTML Email
    if (recipientEmail) {
      return this.callEmailEndpoint(
        "vetting-status",
        {
          to: recipientEmail,
          recipientName: name,
          companyName,
          vettingStage,
          estimatedDaysRemaining,
          analystNotes,
        },
        "onVettingStatusUpdate"
      );
    }

    return { success: true };
  }

  /**
   * 4. NOTIFY EVIDENCE/PROOF REQUESTED (supporting docs - SP8.25)
   */
  async notifyEvidenceRequested({
    user,
    companyName = "Your Business",
    requestedDocuments = [],
    deadlineDays = 7,
    submissionDeadline = null,
    instructions = null,
    recipientName = null,
  }) {
    const recipientEmail = user?.email;
    const name = recipientName || user?.displayName || user?.email?.split("@")[0] || "Valued Business Leader";
    const userId = user?.uid;

    const notificationMessage = `📄 Supporting Documents Requested: Please upload required evidence for ${companyName} within ${deadlineDays} days.`;

    // 1. In-app notification
    this.dispatchInAppNotification({
      message: notificationMessage,
      type: "warning",
      details: { companyName, requestedDocuments, deadlineDays, title: "Documents Requested" },
    });

    // 2. Persistent Firestore message
    if (userId) {
      const docSummary = requestedDocuments.length > 0 ? requestedDocuments.join(", ") : "additional compliance documents";
      await this.persistToFirestoreMessages({
        userId,
        subject: `Action Required: Supporting Documents Requested 📄`,
        content: `To complete vetting for ${companyName}, please upload: ${docSummary}. Please submit within ${deadlineDays} business days via My Documents.`,
        type: "evidence_requested",
        metadata: { companyName, requestedDocuments, deadlineDays, requiresAction: true },
      });
    }

    // 3. Branded HTML Email
    if (recipientEmail) {
      return this.callEmailEndpoint(
        "evidence-requested",
        {
          to: recipientEmail,
          recipientName: name,
          companyName,
          requestedDocuments,
          deadlineDays,
          submissionDeadline,
          instructions,
        },
        "onEvidenceRequested"
      );
    }

    return { success: true };
  }

  /**
   * 5. NOTIFY VETTING REJECTION – DETAILED REASON + REAPPLICATION DATE (SP8.30)
   */
  async notifyVettingRejection({
    user,
    companyName = "Your Business",
    rejectionReasons = [],
    reapplicationDate = null,
    cooldownDays = 60,
    recommendations = [],
    recipientName = null,
  }) {
    const recipientEmail = user?.email;
    const name = recipientName || user?.displayName || user?.email?.split("@")[0] || "Valued Business Leader";
    const userId = user?.uid;

    const notificationMessage = `ℹ️ Vetting Assessment Completed for ${companyName}. View detailed feedback and your future reapplication date.`;

    // 1. In-app notification
    this.dispatchInAppNotification({
      message: notificationMessage,
      type: "error",
      details: { companyName, reapplicationDate, title: "Vetting Outcome" },
    });

    // 2. Persistent Firestore message
    if (userId) {
      await this.persistToFirestoreMessages({
        userId,
        subject: `Vetting Review Outcome & Recommendations`,
        content: `Your vetting assessment for ${companyName} has concluded. Detailed feedback and actionable recommendations have been prepared. You are eligible to re-apply on ${reapplicationDate || 'in ' + cooldownDays + ' days'}.`,
        type: "vetting_rejected",
        metadata: { companyName, rejectionReasons, reapplicationDate, cooldownDays, recommendations },
      });
    }

    // 3. Branded HTML Email
    if (recipientEmail) {
      return this.callEmailEndpoint(
        "vetting-rejected",
        {
          to: recipientEmail,
          recipientName: name,
          companyName,
          rejectionReasons,
          reapplicationDate,
          cooldownDays,
          recommendations,
        },
        "onVettingRejection"
      );
    }

    return { success: true };
  }
}

const onboardingVettingService = new ClientOnboardingVettingService();
export default onboardingVettingService;
