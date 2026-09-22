/**
 * verificationNudgeService.js
 * 
 * Centralized Client-Side Verification & Nudge Notification Service.
 * Universal for BIG Score Verified Badges, Application Draft Nudges, and Document Expiry Warnings.
 * 
 * Multi-Channel Dispatch:
 * 1. Branded HTML Email via backend /api/email/* (or Firebase Cloud Functions)
 * 2. In-App Notification (dispatches role-specific events like `newSmeNotification` and universal `newBillingNotification`)
 * 3. Persistent Firestore `messages` and `notifications` collections
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

class ClientVerificationNudgeService {
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
        title: details.title || "Verification & Compliance",
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
  async persistToFirestoreMessages({ userId, subject, content, type = "verification", metadata = {} }) {
    if (!userId) return;
    try {
      const firestore = db || getFirestore();

      // Write to 'messages' collection
      const messageDoc = {
        to: userId,
        from: "BigMarketplace Compliance Desk",
        subject,
        content,
        date: new Date().toISOString(),
        read: false,
        type: "verification",
        verificationType: type,
        ...metadata,
      };
      await addDoc(collection(firestore, "messages"), messageDoc);

      // Write to 'notifications' collection
      const notificationDoc = {
        userId,
        title: subject,
        message: content,
        type: type === "document_expired" ? "error" : type === "document_expiring" ? "warning" : "status_change",
        read: false,
        createdAt: new Date().toISOString(),
        ...metadata,
      };
      await addDoc(collection(firestore, "notifications"), notificationDoc).catch(() => {});

      console.log(`✅ [VerificationNudge] Message saved to Firestore for user ${userId}`);
    } catch (err) {
      console.error("⚠️ [VerificationNudge] Failed to save message to Firestore:", err);
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
        console.log(`✅ [VerificationNudge] Dispatched via Firebase Cloud Function (${functionName}):`, fnResult.data);
        return fnResult.data;
      } catch (fnError) {
        console.warn(`⚠️ [VerificationNudge] Cloud Function (${functionName}) unavailable, falling back to backend API:`, fnError.message);
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
        console.log(`✅ [VerificationNudge] Email sent via API fallback (${endpoint}):`, result);
        return result;
      }
      throw new Error(`API responded with status ${response.status}`);
    } catch (apiError) {
      console.error(`❌ [VerificationNudge] API fallback also failed (${endpoint}):`, apiError.message);
      return { success: false, error: apiError.message };
    }
  }

  /**
   * 1. NOTIFY BIG SCORE VERIFIED BADGE ISSUED (SP8.29)
   */
  async notifyVerifiedBadgeIssued({
    user,
    companyName = "Your Business",
    bigScore = 85,
    tierName = "Verified Business Partner",
    issueDate = null,
    recipientName = null,
  }) {
    const recipientEmail = user?.email;
    const name = recipientName || user?.displayName || user?.email?.split("@")[0] || "Valued Business Leader";
    const userId = user?.uid;

    const notificationMessage = `🏅 BIG Score Verified Badge Issued! Congratulations, ${companyName} has earned the official Verified trust seal!`;

    // 1. In-app notification
    this.dispatchInAppNotification({
      message: notificationMessage,
      type: "status_change",
      details: { companyName, bigScore, tierName, title: "Verified Badge Issued" },
    });

    // 2. Persistent Firestore message
    if (userId) {
      await this.persistToFirestoreMessages({
        userId,
        subject: `🏅 BIG Score Verified Badge Issued: ${companyName}`,
        content: `Your business has been awarded the official BIG Score Verified Badge (${bigScore}/100 - ${tierName}). Your verified badge is now displayed publicly on all marketplace listings and funder deals.`,
        type: "verified_badge_issued",
        metadata: { companyName, bigScore, tierName, issueDate: issueDate || new Date().toISOString() },
      });
    }

    // 3. Branded HTML Email
    if (recipientEmail) {
      return this.callEmailEndpoint(
        "verified-badge-issued",
        {
          to: recipientEmail,
          recipientName: name,
          companyName,
          bigScore,
          tierName,
          issueDate,
        },
        "onVerifiedBadgeIssued"
      );
    }

    return { success: true };
  }

  /**
   * 2. NOTIFY APPLICATION DRAFT SAVED – NUDGE TO SUBMIT (SP8.20)
   */
  async notifyApplicationDraftSaved({
    user,
    companyName = "Your Business",
    applicationType = "Universal Profile",
    completedSectionsCount = 8,
    totalSectionsCount = 12,
    remainingSections = [],
    recipientName = null,
  }) {
    const recipientEmail = user?.email;
    const name = recipientName || user?.displayName || user?.email?.split("@")[0] || "Valued Business Leader";
    const userId = user?.uid;

    const percent = Math.round((completedSectionsCount / totalSectionsCount) * 100);
    const notificationMessage = `📝 Draft Saved: You're ${percent}% of the way to completing your ${applicationType}!`;

    // 1. In-app notification
    this.dispatchInAppNotification({
      message: notificationMessage,
      type: "info",
      details: { companyName, applicationType, completedSectionsCount, totalSectionsCount, title: "Draft Saved" },
    });

    // 2. Persistent Firestore message
    if (userId) {
      await this.persistToFirestoreMessages({
        userId,
        subject: `Draft Saved: ${applicationType} (${percent}% Complete)`,
        content: `Your progress on your ${applicationType} has been saved (${completedSectionsCount}/${totalSectionsCount} sections complete). Finish submitting to activate your marketplace visibility.`,
        type: "draft_saved",
        metadata: { applicationType, completedSectionsCount, totalSectionsCount, remainingSections },
      });
    }

    // 3. Branded HTML Email
    if (recipientEmail) {
      return this.callEmailEndpoint(
        "application-draft-nudge",
        {
          to: recipientEmail,
          recipientName: name,
          companyName,
          applicationType,
          completedSectionsCount,
          totalSectionsCount,
          remainingSections,
        },
        "onApplicationDraftSaved"
      );
    }

    return { success: true };
  }

  /**
   * 3. NOTIFY DOCUMENT EXPIRY WARNING (30d / 7d / expired - SP8.41)
   */
  async notifyDocumentExpiryWarning({
    user,
    companyName = "Your Business",
    documentName = "Tax Clearance Certificate",
    warningType = "30_days", // "30_days" | "7_days" | "expired"
    expiryDate = null,
    daysRemaining = 30,
    recipientName = null,
  }) {
    const recipientEmail = user?.email;
    const name = recipientName || user?.displayName || user?.email?.split("@")[0] || "Valued Business Leader";
    const userId = user?.uid;

    const notificationMessage = warningType === "expired"
      ? `❌ Document Expired: Your ${documentName} has expired. Please upload an updated copy to keep your Verified badge.`
      : `⚠️ Compliance Alert: Your ${documentName} expires in ${daysRemaining} days.`;

    // 1. In-app notification
    this.dispatchInAppNotification({
      message: notificationMessage,
      type: warningType === "expired" ? "error" : "warning",
      details: { companyName, documentName, warningType, daysRemaining, title: "Document Expiry Alert" },
    });

    // 2. Persistent Firestore message
    if (userId) {
      await this.persistToFirestoreMessages({
        userId,
        subject: warningType === "expired" ? `Action Required: ${documentName} Expired` : `Compliance Alert: ${documentName} Expiring in ${daysRemaining} Days`,
        content: warningType === "expired"
          ? `Your ${documentName} for ${companyName} has passed its validity date. Please upload a renewed document to maintain full compliance status.`
          : `Your ${documentName} will expire on ${expiryDate ? new Date(expiryDate).toLocaleDateString() : 'soon'}. Request a renewal now to avoid verification interruptions.`,
        type: warningType === "expired" ? "document_expired" : "document_expiring",
        metadata: { documentName, warningType, expiryDate, daysRemaining },
      });
    }

    // 3. Branded HTML Email
    if (recipientEmail) {
      return this.callEmailEndpoint(
        "document-expiry-warning",
        {
          to: recipientEmail,
          recipientName: name,
          companyName,
          documentName,
          warningType,
          expiryDate,
          daysRemaining,
        },
        "onDocumentExpiryWarning"
      );
    }

    return { success: true };
  }
}

const verificationNudgeService = new ClientVerificationNudgeService();
export default verificationNudgeService;
