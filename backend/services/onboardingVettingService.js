/**
 * onboardingVettingService.js
 * 
 * Centralized email notification service for SME Onboarding & Vetting.
 * Covers Sprint 8 tasks:
 * - SP8.17: SME Profile Approved – Marketplace Activated
 * - SP8.18: SME Profile Rejected – Next Steps + How to Fix
 * - SP8.24: Vetting Status Update (queued / in progress / completed)
 * - SP8.25: Evidence/Proof Requested (supporting docs)
 * - SP8.30: Vetting Rejection – Detailed Reason + Reapplication Date
 * 
 * Replicates the canonical BigMarketplace HTML/CSS email design system from EmailService.js.
 * Built as pure, decoupled functions ready for Firebase Cloud Functions deployment.
 */

const emailService = require("./EmailService");

class OnboardingVettingService {
  constructor() {
    // Canonical color tokens matching EmailService.js & BigMarketplace branding
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
      lightGray: "#e5e7eb",
    };

    this.defaultDashboardUrl = process.env.FRONTEND_URL || "https://bigmarketplace.africa";
  }

  /**
   * Generates standard BigMarketplace email footer
   */
  getFooter(actionNote = "Keep this email for your business records.") {
    return `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
        <p style="color: #666; font-size: 12px; margin: 0; line-height: 1.6;">
          This is an automated communication from BigMarketplace.<br>
          ${actionNote}<br>
          Need assistance? Reach our support team at <a href="mailto:support@bigmarketplace.africa" style="color: ${this.colors.primary}; text-decoration: none;">support@bigmarketplace.africa</a>
        </p>
      </div>
    `;
  }

  /**
   * 1. SME: PROFILE APPROVED – MARKETPLACE ACTIVATED (SP8.17)
   */
  async sendProfileApprovedEmail({
    to,
    recipientName = "Valued Business Leader",
    companyName = "Your Business",
    approvalDate = null,
    bigScore = null,
    marketplaceUrl = null,
    profileUrl = null,
  }) {
    if (!to) throw new Error("Recipient email (to) is required");

    const subject = `Congratulations! Your Profile is Approved – Marketplace Activated 🎉`;
    const appMarketplaceUrl = marketplaceUrl || `${this.defaultDashboardUrl}/marketplace`;
    const appProfileUrl = profileUrl || `${this.defaultDashboardUrl}/profile-universal`;
    const formattedDate = approvalDate ? new Date(approvalDate).toLocaleDateString() : new Date().toLocaleDateString();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: ${this.colors.text};">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${this.colors.primary}; margin: 0; font-size: 26px;">Profile Approved! 🎉</h1>
          <p style="color: ${this.colors.text}; font-size: 17px; margin: 10px 0;">Marketplace is officially activated for <strong>${companyName}</strong></p>
        </div>

        <div style="background: ${this.colors.background}; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${this.colors.success};">
          <h2 style="color: ${this.colors.text}; margin-top: 0; margin-bottom: 16px; font-size: 18px;">Activation Summary</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 9px 0; font-weight: bold; color: ${this.colors.text};">Business Entity:</td>
              <td style="padding: 9px 0; color: ${this.colors.dark}; font-weight: 600;">${companyName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 9px 0; font-weight: bold; color: ${this.colors.text};">Approval Status:</td>
              <td style="padding: 9px 0; color: ${this.colors.success}; font-weight: bold;">Verified & Approved ✅</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 9px 0; font-weight: bold; color: ${this.colors.text};">Marketplace Listing:</td>
              <td style="padding: 9px 0; color: ${this.colors.dark}; font-weight: 600;">Live & Searchable</td>
            </tr>
            ${bigScore ? `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 9px 0; font-weight: bold; color: ${this.colors.text};">BIG Score:</td>
              <td style="padding: 9px 0; color: ${this.colors.primary}; font-weight: bold;">${bigScore}/100</td>
            </tr>
            ` : ""}
            <tr>
              <td style="padding: 9px 0; font-weight: bold; color: ${this.colors.text};">Date Activated:</td>
              <td style="padding: 9px 0; color: ${this.colors.dark};">${formattedDate}</td>
            </tr>
          </table>
        </div>

        <div style="background: ${this.colors.pale}; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: ${this.colors.dark}; margin-top: 0; margin-bottom: 12px; font-size: 16px;">What Happens Next?</h3>
          <ul style="margin: 0; padding-left: 20px; color: ${this.colors.text}; font-size: 14px; line-height: 1.6;">
            <li><strong>Investor & Funder Matching:</strong> Funders and enterprise buyers can now discover your validated profile and offerings.</li>
            <li><strong>Apply for Funding Opportunities:</strong> Unlock fast-track applications with your pre-vetted BIG Score.</li>
            <li><strong>Marketplace Showcasing:</strong> Your catalog of products and services is accessible to commercial buyers.</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${appMarketplaceUrl}" 
             style="background: ${this.colors.primary}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block; margin-right: 10px;">
            Go to Marketplace →
          </a>
          <a href="${appProfileUrl}" 
             style="background: transparent; color: ${this.colors.dark}; border: 1.5px solid ${this.colors.dark}; padding: 13px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
            View Live Profile
          </a>
        </div>

        ${this.getFooter("Welcome to the active BigMarketplace trading ecosystem!")}
      </div>
    `;

    console.log(`📧 [OnboardingVettingService] Sending Profile Approved email to ${to} (${companyName})`);
    return emailService.sendEmail(to, subject, html);
  }

  /**
   * 2. SME: PROFILE REJECTED – NEXT STEPS + HOW TO FIX (SP8.18)
   */
  async sendProfileRejectedEmail({
    to,
    recipientName = "Valued Business Leader",
    companyName = "Your Business",
    issues = [],
    generalReason = "Some required verification details or compliance documents require revision.",
    reeditUrl = null,
  }) {
    if (!to) throw new Error("Recipient email (to) is required");

    const subject = `Action Required: Universal Profile Revision Needed for ${companyName} ⚠️`;
    const appReeditUrl = reeditUrl || `${this.defaultDashboardUrl}/profile-universal`;

    const defaultIssues = issues.length > 0 ? issues : [
      "Company registration document (CIPC) is expired or unreadable",
      "Financial overview requires latest financial statements or turnover verification",
      "Director identification details incomplete",
    ];

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: ${this.colors.text};">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${this.colors.warning}; margin: 0; font-size: 26px;">Profile Needs Revision ⚠️</h1>
          <p style="color: ${this.colors.text}; font-size: 17px; margin: 10px 0;">Next steps to complete verification for <strong>${companyName}</strong></p>
        </div>

        <div style="background: ${this.colors.background}; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${this.colors.warning};">
          <p style="margin: 0 0 15px 0; font-size: 14px; line-height: 1.6; color: ${this.colors.text};">
            Dear ${recipientName},<br><br>
            Thank you for submitting your Universal Profile. During our verification review, our compliance team identified a few items that require your attention before your profile and marketplace listing can be fully activated:
          </p>

          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #e5e7eb;">
            <strong style="color: ${this.colors.dark}; font-size: 14px; display: block; margin-bottom: 8px;">Review Feedback:</strong>
            <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.5;">${generalReason}</p>
          </div>

          <h3 style="color: ${this.colors.dark}; margin-top: 15px; margin-bottom: 10px; font-size: 15px;">Required Corrections Checklist:</h3>
          <ul style="margin: 0; padding-left: 20px; color: ${this.colors.text}; font-size: 14px; line-height: 1.6;">
            ${defaultIssues.map(issue => `<li style="margin-bottom: 6px;">${issue}</li>`).join("")}
          </ul>
        </div>

        <div style="background: ${this.colors.pale}; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: ${this.colors.dark}; margin-top: 0; margin-bottom: 10px; font-size: 15px;">How to Fix and Resubmit</h3>
          <ol style="margin: 0; padding-left: 20px; color: ${this.colors.text}; font-size: 14px; line-height: 1.6;">
            <li>Log into your BigMarketplace SME dashboard.</li>
            <li>Click <strong>"Edit Profile"</strong> on the sections flagged above.</li>
            <li>Upload updated documentation or correct entries and click <strong>"Resubmit Profile"</strong>.</li>
          </ol>
          <p style="margin: 12px 0 0 0; font-size: 13px; color: #666;">
            Your existing entries have been safely preserved so you only need to update the flagged sections.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${appReeditUrl}" 
             style="background: ${this.colors.primary}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
            ✏️ Review & Fix Profile Now
          </a>
        </div>

        ${this.getFooter("Our compliance team is ready to re-review as soon as you resubmit.")}
      </div>
    `;

    console.log(`📧 [OnboardingVettingService] Sending Profile Rejected email to ${to} (${companyName})`);
    return emailService.sendEmail(to, subject, html);
  }

  /**
   * 3. VETTING STATUS UPDATE (queued / in progress / completed - SP8.24)
   */
  async sendVettingStatusUpdateEmail({
    to,
    recipientName = "Valued Business Leader",
    companyName = "Your Business",
    vettingStage = "in_progress", // "queued" | "in_progress" | "completed"
    estimatedDaysRemaining = 3,
    analystNotes = null,
    dashboardUrl = null,
  }) {
    if (!to) throw new Error("Recipient email (to) is required");

    const stageConfig = {
      queued: {
        title: "Vetting Application Queued 📋",
        badge: "Queued for Review",
        color: this.colors.info,
        barWidth: "33%",
        description: "Your vetting application has been received and added to our verification queue. An analyst will be assigned shortly.",
      },
      in_progress: {
        title: "Vetting In Progress 🔍",
        badge: "Under Active Review",
        color: this.colors.warning,
        barWidth: "66%",
        description: "Our verification team is actively conducting desktop pre-vetting, compliance background checks, and BIG Score evaluation.",
      },
      completed: {
        title: "Vetting Review Completed ✅",
        badge: "Vetting Completed",
        color: this.colors.success,
        barWidth: "100%",
        description: "Your vetting review is complete! Your BIG Score and verification tier have been officially updated.",
      },
    };

    const currentStage = stageConfig[vettingStage] || stageConfig.in_progress;
    const subject = `Vetting Status Update: ${currentStage.badge} - ${companyName}`;
    const appDashboardUrl = dashboardUrl || `${this.defaultDashboardUrl}/dashboard`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: ${this.colors.text};">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${this.colors.primary}; margin: 0; font-size: 26px;">${currentStage.title}</h1>
          <p style="color: ${this.colors.text}; font-size: 16px; margin: 10px 0;">Verification progress for <strong>${companyName}</strong></p>
        </div>

        <!-- Progress Bar -->
        <div style="background: #e5e7eb; border-radius: 10px; height: 12px; margin: 25px 0; overflow: hidden;">
          <div style="background: ${currentStage.color}; width: ${currentStage.barWidth}; height: 100%; border-radius: 10px; transition: width 0.5s;"></div>
        </div>

        <div style="background: ${this.colors.background}; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${currentStage.color};">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <span style="font-weight: bold; color: ${this.colors.dark}; font-size: 15px;">Current Status:</span>
            <span style="background: ${currentStage.color}20; color: ${currentStage.color}; padding: 4px 12px; border-radius: 9999px; font-weight: bold; font-size: 13px;">
              ${currentStage.badge}
            </span>
          </div>

          <p style="margin: 0 0 15px 0; font-size: 14px; line-height: 1.6; color: ${this.colors.text};">
            ${currentStage.description}
          </p>

          ${estimatedDaysRemaining && vettingStage !== "completed" ? `
          <div style="font-size: 13px; color: #666; margin-top: 10px;">
            ⏱️ <strong>Estimated Turnaround:</strong> Typically ${estimatedDaysRemaining} business days.
          </div>
          ` : ""}

          ${analystNotes ? `
          <div style="background: white; padding: 14px; border-radius: 8px; margin-top: 15px; border: 1px solid #e5e7eb;">
            <strong style="color: ${this.colors.dark}; font-size: 13px; display: block; margin-bottom: 4px;">Analyst Notes:</strong>
            <p style="margin: 0; font-size: 13px; color: #555;">${analystNotes}</p>
          </div>
          ` : ""}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${appDashboardUrl}" 
             style="background: ${this.colors.primary}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
            View Vetting Dashboard →
          </a>
        </div>

        ${this.getFooter("We keep you informed at every step of your verification journey.")}
      </div>
    `;

    console.log(`📧 [OnboardingVettingService] Sending Vetting Status Update (${vettingStage}) to ${to}`);
    return emailService.sendEmail(to, subject, html);
  }

  /**
   * 4. EVIDENCE/PROOF REQUESTED (supporting docs - SP8.25)
   */
  async sendEvidenceRequestedEmail({
    to,
    recipientName = "Valued Business Leader",
    companyName = "Your Business",
    requestedDocuments = [],
    deadlineDays = 7,
    submissionDeadline = null,
    instructions = "Please upload certified, clear copies to proceed with your verification.",
    uploadUrl = null,
  }) {
    if (!to) throw new Error("Recipient email (to) is required");

    const subject = `Action Required: Supporting Evidence Requested for ${companyName} 📄`;
    const appUploadUrl = uploadUrl || `${this.defaultDashboardUrl}/my-documents`;
    const computedDeadline = submissionDeadline || `${deadlineDays} business days from today`;

    const docList = requestedDocuments.length > 0 ? requestedDocuments : [
      "Latest 6 months business bank statements (PDF)",
      "Valid CIPC Registration Certificate (COR14.3)",
      "SARS Tax Compliance Pin Letter",
      "Certified copies of Directors' ID documents",
    ];

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: ${this.colors.text};">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${this.colors.primary}; margin: 0; font-size: 26px;">Supporting Proof Requested 📄</h1>
          <p style="color: ${this.colors.text}; font-size: 16px; margin: 10px 0;">Additional documentation needed for <strong>${companyName}</strong></p>
        </div>

        <div style="background: ${this.colors.background}; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${this.colors.warning};">
          <p style="margin: 0 0 15px 0; font-size: 14px; line-height: 1.6; color: ${this.colors.text};">
            Dear ${recipientName},<br><br>
            To complete the vetting and validation of your business on BigMarketplace, our verification team requires the following supporting evidence:
          </p>

          <div style="background: white; padding: 18px; border-radius: 8px; margin: 15px 0; border: 1px solid #e5e7eb;">
            <h3 style="color: ${this.colors.dark}; margin-top: 0; margin-bottom: 12px; font-size: 15px;">Requested Documents:</h3>
            <ul style="margin: 0; padding-left: 20px; color: ${this.colors.text}; font-size: 14px; line-height: 1.8;">
              ${docList.map(doc => `<li><strong>${doc}</strong></li>`).join("")}
            </ul>
          </div>

          <div style="background: #fffbeb; border: 1px solid #fef3c7; padding: 12px 16px; border-radius: 8px; font-size: 13px; color: #92400e; margin-top: 15px;">
            ⚠️ <strong>Submission Deadline:</strong> Please upload within <strong>${computedDeadline}</strong> to maintain your position in the review queue.
          </div>

          <p style="margin: 15px 0 0 0; font-size: 13px; color: #666; line-height: 1.5;">
            ${instructions}
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUploadUrl}" 
             style="background: ${this.colors.primary}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
            📤 Upload Requested Documents Now
          </a>
        </div>

        ${this.getFooter("Prompt document upload ensures faster marketplace activation and funding readiness.")}
      </div>
    `;

    console.log(`📧 [OnboardingVettingService] Sending Evidence Requested email to ${to} (${companyName})`);
    return emailService.sendEmail(to, subject, html);
  }

  /**
   * 5. VETTING REJECTION – DETAILED REASON + REAPPLICATION DATE (SP8.30)
   */
  async sendVettingRejectionEmail({
    to,
    recipientName = "Valued Business Leader",
    companyName = "Your Business",
    rejectionReasons = [],
    reapplicationDate = null,
    cooldownDays = 60,
    recommendations = [],
    feedbackUrl = null,
  }) {
    if (!to) throw new Error("Recipient email (to) is required");

    const subject = `Vetting Outcome & Feedback for ${companyName}`;
    const appFeedbackUrl = feedbackUrl || `${this.defaultDashboardUrl}/dashboard`;

    let calculatedReapplyDate = reapplicationDate;
    if (!calculatedReapplyDate) {
      const date = new Date();
      date.setDate(date.getDate() + cooldownDays);
      calculatedReapplyDate = date.toLocaleDateString();
    }

    const reasons = rejectionReasons.length > 0 ? rejectionReasons : [
      "Company operational history is under the minimum required threshold for this verification tier",
      "Financial documentation does not demonstrate necessary solvency or turnover levels",
      "Outstanding statutory compliance matters with regulatory authorities",
    ];

    const recs = recommendations.length > 0 ? recommendations : [
      "Maintain clean monthly financial statements and bank records",
      "Complete statutory filings and maintain an active Tax Compliance Status",
      "Access our SME Growth Tools to strengthen governance and operational readiness",
    ];

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: ${this.colors.text};">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${this.colors.dark}; margin: 0; font-size: 26px;">Vetting Review Outcome</h1>
          <p style="color: ${this.colors.text}; font-size: 16px; margin: 10px 0;">Detailed assessment for <strong>${companyName}</strong></p>
        </div>

        <div style="background: ${this.colors.background}; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${this.colors.error};">
          <p style="margin: 0 0 15px 0; font-size: 14px; line-height: 1.6; color: ${this.colors.text};">
            Dear ${recipientName},<br><br>
            Thank you for participating in the BigMarketplace vetting process. Following a comprehensive review of your business documentation and pre-vetting metrics, we regret to inform you that your application does not currently meet our full validation criteria for this cycle.
          </p>

          <div style="background: white; padding: 18px; border-radius: 8px; margin: 15px 0; border: 1px solid #e5e7eb;">
            <h3 style="color: ${this.colors.error}; margin-top: 0; margin-bottom: 12px; font-size: 15px;">Specific Findings & Reasons:</h3>
            <ul style="margin: 0; padding-left: 20px; color: ${this.colors.text}; font-size: 13px; line-height: 1.6;">
              ${reasons.map(r => `<li style="margin-bottom: 6px;">${r}</li>`).join("")}
            </ul>
          </div>

          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 15px 0;">
            <h3 style="color: ${this.colors.dark}; margin-top: 0; margin-bottom: 10px; font-size: 14px;">Recommendations for Next Steps:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #166534; font-size: 13px; line-height: 1.6;">
              ${recs.map(rec => `<li style="margin-bottom: 4px;">${rec}</li>`).join("")}
            </ul>
          </div>

          <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 14px 18px; border-radius: 8px; margin-top: 15px;">
            📅 <strong>Eligible to Re-apply on:</strong> <span style="color: ${this.colors.dark}; font-weight: bold;">${calculatedReapplyDate}</span>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">
              You can use this period to address the findings above and strengthen your BIG Score metrics.
            </p>
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${appFeedbackUrl}" 
             style="background: ${this.colors.primary}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
            View Detailed Vetting Report →
          </a>
        </div>

        ${this.getFooter("Our team is committed to helping South African SMEs become funding-ready.")}
      </div>
    `;

    console.log(`📧 [OnboardingVettingService] Sending Vetting Rejection email to ${to} (${companyName})`);
    return emailService.sendEmail(to, subject, html);
  }
}

module.exports = new OnboardingVettingService();
