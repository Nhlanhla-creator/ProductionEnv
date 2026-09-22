/**
 * verificationNudgeService.js
 * 
 * Centralized email notification service for Verification Badges, Application Nudges, and Document Expiry Warnings.
 * Covers Sprint 8 tasks:
 * - SP8.29: BIG Score Verified Badge Issued
 * - SP8.20: SME Application Draft Saved (nudge to submit)
 * - SP8.41: Document Expiry Warning (30d / 7d / expired)
 * 
 * Replicates the canonical BigMarketplace HTML/CSS email design system from EmailService.js.
 * Built as pure functions prepped for Firebase Cloud Functions.
 */

const emailService = require("./EmailService");

class VerificationNudgeService {
  constructor() {
    this.colors = {
      primary: "#a67c52",
      dark: "#7d5a50",
      text: "#4a352f",
      background: "#faf7f2",
      pale: "#f0e6d9",
      success: "#22c55e",
      error: "#ef4444",
      warning: "#f59e0b",
      info: "#0284c7",
      gold: "#d97706",
      lightGray: "#e5e7eb",
    };

    this.defaultDashboardUrl = process.env.FRONTEND_URL || "https://bigmarketplace.africa";
  }

  /**
   * Generates standard BigMarketplace email footer
   */
  getFooter(actionNote = "Keep this notification for your business records.") {
    return `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
        <p style="color: #666; font-size: 12px; margin: 0; line-height: 1.6;">
          This is an automated message from BigMarketplace.<br>
          ${actionNote}<br>
          Questions? Contact our verification desk at <a href="mailto:verify@bigmarketplace.africa" style="color: ${this.colors.primary}; text-decoration: none;">verify@bigmarketplace.africa</a>
        </p>
      </div>
    `;
  }

  /**
   * 1. BIG SCORE VERIFIED BADGE ISSUED (SP8.29)
   */
  async sendVerifiedBadgeIssuedEmail({
    to,
    recipientName = "Valued Business Leader",
    companyName = "Your Business",
    bigScore = 85,
    tierName = "Verified Business Partner",
    issueDate = null,
    badgeUrl = null,
    profileUrl = null,
  }) {
    if (!to) throw new Error("Recipient email (to) is required");

    const subject = `🏅 Congratulations! Your BIG Score Verified Badge has been Issued - ${companyName}`;
    const appProfileUrl = profileUrl || `${this.defaultDashboardUrl}/profile-universal`;
    const formattedDate = issueDate ? new Date(issueDate).toLocaleDateString() : new Date().toLocaleDateString();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: ${this.colors.text};">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="font-size: 40px; margin-bottom: 10px;">🏅</div>
          <h1 style="color: ${this.colors.primary}; margin: 0; font-size: 26px;">Verified Badge Issued!</h1>
          <p style="color: ${this.colors.text}; font-size: 17px; margin: 10px 0;">Official Trust & Verification Stamp for <strong>${companyName}</strong></p>
        </div>

        <div style="background: ${this.colors.background}; padding: 25px; border-radius: 12px; margin: 20px 0; border: 2px solid ${this.colors.gold}; text-align: center;">
          <div style="display: inline-block; background: ${this.colors.gold}15; border: 1.5px solid ${this.colors.gold}; padding: 8px 18px; border-radius: 9999px; margin-bottom: 15px;">
            <span style="color: ${this.colors.gold}; font-weight: bold; font-size: 14px;">BIG Score: ${bigScore}/100 • VERIFIED</span>
          </div>

          <h2 style="color: ${this.colors.dark}; margin: 0 0 10px 0; font-size: 20px;">${tierName}</h2>
          <p style="color: #666; font-size: 13px; margin: 0 0 15px 0;">Verified on ${formattedDate} • BigMarketplace Governance & Compliance</p>

          <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; margin-top: 15px; border-top: 1px solid #ddd;">
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px 0; font-weight: bold;">Trust Seal:</td>
              <td style="padding: 8px 0; color: ${this.colors.success}; font-weight: 600;">Active & Publicly Validated ✓</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px 0; font-weight: bold;">Funder Visibility:</td>
              <td style="padding: 8px 0; color: ${this.colors.dark};">Priority Search & Matchmaking</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Corporate Supplier Status:</td>
              <td style="padding: 8px 0; color: ${this.colors.dark};">Pre-Vetted Procurement Tier</td>
            </tr>
          </table>
        </div>

        <div style="background: ${this.colors.pale}; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: ${this.colors.dark}; margin-top: 0; margin-bottom: 10px; font-size: 15px;">What This Means For Your Business</h3>
          <ul style="margin: 0; padding-left: 20px; color: ${this.colors.text}; font-size: 13px; line-height: 1.6;">
            <li><strong>Reduced Due Diligence Time:</strong> Funders can fast-track applications knowing your statutory documentation is audited.</li>
            <li><strong>Verified Marketplace Seal:</strong> Your products and offerings now display the official gold badge.</li>
            <li><strong>Institutional Trust:</strong> Differentiate your business from unverified market participants.</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${appProfileUrl}" 
             style="background: ${this.colors.primary}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
            View Verified Profile & Badge →
          </a>
        </div>

        ${this.getFooter("Congratulations on demonstrating exceptional business governance!")}
      </div>
    `;

    console.log(`📧 [VerificationNudgeService] Sending Verified Badge email to ${to} (${companyName})`);
    return emailService.sendEmail(to, subject, html);
  }

  /**
   * 2. SME: APPLICATION DRAFT SAVED – NUDGE TO SUBMIT (SP8.20)
   */
  async sendApplicationDraftSavedNudgeEmail({
    to,
    recipientName = "Valued Business Leader",
    companyName = "Your Business",
    applicationType = "Universal Profile", // "Universal Profile" | "Funding Application" | "Products & Services"
    completedSectionsCount = 8,
    totalSectionsCount = 12,
    remainingSections = [],
    resumeUrl = null,
  }) {
    if (!to) throw new Error("Recipient email (to) is required");

    const subject = `You're almost there! Resume your ${applicationType} draft for ${companyName} 🚀`;
    const appResumeUrl = resumeUrl || `${this.defaultDashboardUrl}/profile-universal`;
    const percentComplete = Math.round((completedSectionsCount / totalSectionsCount) * 100);

    const defaultRemaining = remainingSections.length > 0 ? remainingSections : [
      "Document Upload",
      "Declaration & Consent",
    ];

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: ${this.colors.text};">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${this.colors.primary}; margin: 0; font-size: 26px;">Draft Saved 📝</h1>
          <p style="color: ${this.colors.text}; font-size: 16px; margin: 10px 0;">You're <strong>${percentComplete}% of the way</strong> to submitting your ${applicationType}</p>
        </div>

        <!-- Progress bar -->
        <div style="background: #e5e7eb; border-radius: 10px; height: 14px; margin: 20px 0; overflow: hidden;">
          <div style="background: ${this.colors.primary}; width: ${percentComplete}%; height: 100%; border-radius: 10px;"></div>
        </div>

        <div style="background: ${this.colors.background}; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${this.colors.primary};">
          <p style="margin: 0 0 15px 0; font-size: 14px; line-height: 1.6; color: ${this.colors.text};">
            Dear ${recipientName},<br><br>
            Great progress! Your latest entries for <strong>${companyName}</strong> have been safely saved. You have completed <strong>${completedSectionsCount} of ${totalSectionsCount} sections</strong>.
          </p>

          <div style="background: white; padding: 16px; border-radius: 8px; margin: 15px 0; border: 1px solid #e5e7eb;">
            <h3 style="color: ${this.colors.dark}; margin-top: 0; margin-bottom: 10px; font-size: 14px;">Remaining Sections to Complete:</h3>
            <ul style="margin: 0; padding-left: 20px; color: ${this.colors.text}; font-size: 13px; line-height: 1.6;">
              ${defaultRemaining.map(sec => `<li><strong>${sec}</strong></li>`).join("")}
            </ul>
          </div>

          <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">
            💡 Completing your submission activates your marketplace visibility and opens matching opportunities with qualified funders.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${appResumeUrl}" 
             style="background: ${this.colors.primary}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
            ▶️ Resume Application Now
          </a>
        </div>

        ${this.getFooter("Pick up right where you left off at any time.")}
      </div>
    `;

    console.log(`📧 [VerificationNudgeService] Sending Draft Nudge email to ${to} (${applicationType})`);
    return emailService.sendEmail(to, subject, html);
  }

  /**
   * 3. DOCUMENT EXPIRY WARNING (30d / 7d / expired - SP8.41)
   */
  async sendDocumentExpiryWarningEmail({
    to,
    recipientName = "Valued Business Leader",
    companyName = "Your Business",
    documentName = "Tax Clearance Certificate",
    warningType = "30_days", // "30_days" | "7_days" | "expired"
    expiryDate = null,
    daysRemaining = 30,
    renewUrl = null,
  }) {
    if (!to) throw new Error("Recipient email (to) is required");

    const warningConfig = {
      "30_days": {
        subject: `Heads Up: ${documentName} for ${companyName} expires in 30 days ⚠️`,
        headline: "Document Expiring in 30 Days 📅",
        color: this.colors.warning,
        urgencyText: "This is an early reminder to request or prepare your renewal document so your verified business status remains uninterrupted.",
        callToAction: "Upload Renewal Document",
      },
      "7_days": {
        subject: `Urgent: ${documentName} for ${companyName} expires in 7 days ⏰`,
        headline: "Urgent: Document Expiring in 7 Days ⏰",
        color: this.colors.gold,
        urgencyText: "Your document is nearing expiration. Please upload your updated file this week to maintain compliance with institutional funders and buyers.",
        callToAction: "Upload Renewal Immediately",
      },
      "expired": {
        subject: `Action Required: ${documentName} for ${companyName} has Expired ❌`,
        headline: "Document Expired – Action Required ❌",
        color: this.colors.error,
        urgencyText: "This document has expired. Your Verified BIG Score status and active marketplace badge may be temporarily suspended until a valid replacement is uploaded.",
        callToAction: "Upload Valid Document Now",
      },
    };

    const config = warningConfig[warningType] || warningConfig["30_days"];
    const appRenewUrl = renewUrl || `${this.defaultDashboardUrl}/my-documents`;
    const formattedExpiryDate = expiryDate ? new Date(expiryDate).toLocaleDateString() : (warningType === "expired" ? "Already expired" : `in ${daysRemaining} days`);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: ${this.colors.text};">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${config.color}; margin: 0; font-size: 24px;">${config.headline}</h1>
          <p style="color: ${this.colors.text}; font-size: 16px; margin: 10px 0;">Compliance alert for <strong>${companyName}</strong></p>
        </div>

        <div style="background: ${this.colors.background}; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${config.color};">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 15px;">
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0; font-weight: bold; color: ${this.colors.text};">Document:</td>
              <td style="padding: 8px 0; color: ${this.colors.dark}; font-weight: 600;">${documentName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0; font-weight: bold; color: ${this.colors.text};">Expiry Date:</td>
              <td style="padding: 8px 0; color: ${config.color}; font-weight: bold;">${formattedExpiryDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: ${this.colors.text};">Status Level:</td>
              <td style="padding: 8px 0; color: ${this.colors.dark};">${warningType === "expired" ? "Expired" : `${daysRemaining} Days Remaining`}</td>
            </tr>
          </table>

          <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; font-size: 13px; line-height: 1.6; color: #444;">
            ${config.urgencyText}
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${appRenewUrl}" 
             style="background: ${this.colors.primary}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
            📤 ${config.callToAction}
          </a>
        </div>

        ${this.getFooter("Keeping your document vault current ensures continuous verified status.")}
      </div>
    `;

    console.log(`📧 [VerificationNudgeService] Sending Document Expiry Warning (${warningType}) to ${to} (${documentName})`);
    return emailService.sendEmail(to, config.subject, html);
  }
}

module.exports = new VerificationNudgeService();
