/**
 * billingNotificationService.js
 * 
 * Centralized email notification service for Subscriptions, Payments, and Invoicing.
 * Replicates the established BigMarketplace HTML/CSS email design system from EmailService.js.
 * Built as pure, decoupled functions to ensure seamless migration to Firebase Cloud Functions.
 */

const emailService = require("./EmailService");

class BillingNotificationService {
  constructor() {
    // Replicate canonical color tokens from EmailService.js
    this.colors = {
      primary: "#a67c52",
      dark: "#7d5a50",
      text: "#4a352f",
      background: "#faf7f2",
      pale: "#f0e6d9",
      success: "#22c55e",
      error: "#ef4444",
      warning: "#f59e0b",
      lightGray: "#e5e7eb",
    };

    this.defaultDashboardUrl = process.env.FRONTEND_URL || "https://bigmarketplace.africa";
  }

  /**
   * Generates standard BigMarketplace email footer
   */
  getFooter(actionNote = "Keep this email for your records.") {
    return `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
        <p style="color: #666; font-size: 12px; margin: 0; line-height: 1.6;">
          This is an automated email from BigMarketplace.<br>
          ${actionNote}<br>
          Questions? Contact our team at <a href="mailto:hello@bigmarketplace.africa" style="color: ${this.colors.primary}; text-decoration: none;">hello@bigmarketplace.africa</a>
        </p>
      </div>
    `;
  }

  /**
   * 1. SUBSCRIPTION STARTED EMAIL
   * Replicates EmailService.sendSubscriptionConfirmation with enhanced role benefits and invoice details
   */
  async sendSubscriptionStartedEmail({
    to,
    customerName = "Valued Member",
    planName = "Premium Plan",
    billingCycle = "monthly",
    amount = 0,
    currency = "ZAR",
    transactionId = `TXN-${Date.now()}`,
    invoiceNumber = `INV-${Date.now().toString().slice(-6)}`,
    isTrialPeriod = false,
    trialEndDate = null,
    userType = "investor",
    nextBillingDate = null,
    dashboardUrl = null,
  }) {
    if (!to) throw new Error("Recipient email (to) is required");

    const appUrl = dashboardUrl || `${this.defaultDashboardUrl}/${userType === "investor" ? "investor-dashboard" : "dashboard"}`;
    const subject = isTrialPeriod
      ? `🎉 Welcome to ${planName} (3 Months Free Trial Activated) - BigMarketplace`
      : `Subscription Activated - ${planName}`;

    // Role-specific unlocked feature list
    const roleBenefits = userType === "investor"
      ? [
          "Curated investment deal flow matching your thesis",
          "Direct messaging with founders and portfolio leadership",
          "Full access to verified BIG Score analytics & governance audits",
          "Priority syndicate co-investment opportunities"
        ]
      : [
          "Real-time BIG Score evaluation and ecosystem badge",
          "Automated matching with verified funders and accelerators",
          "Full growth tools library & compliance readiness checklists",
          "Direct pipeline visibility to active angel & VC investors"
        ];

    const cycleDisplay = billingCycle === "annually" ? "Annual" : "Monthly";
    const amountDisplay = isTrialPeriod
      ? `FREE (First 3 Months Free, then ${currency} ${amount}/${billingCycle === "annually" ? "year" : "month"})`
      : amount === 0
      ? "FREE"
      : `${currency} ${Number(amount).toFixed(2)}`;

    const nextBillingDisplay = trialEndDate
      ? new Date(trialEndDate).toLocaleDateString()
      : nextBillingDate
      ? new Date(nextBillingDate).toLocaleDateString()
      : billingCycle === "annually"
      ? "1 Year from activation"
      : "1 Month from activation";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: ${this.colors.text};">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${this.colors.primary}; margin: 0; font-size: 26px;">Subscription Activated! 🚀</h1>
          <p style="color: ${this.colors.text}; font-size: 17px; margin: 10px 0;">Welcome to ${planName}, ${customerName}</p>
        </div>

        <!-- Success Banner -->
        <div style="background: ${this.colors.success}; color: white; padding: 18px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h3 style="margin: 0 0 6px 0; font-size: 18px;">🎉 Your ${planName} plan is now active</h3>
          <p style="margin: 0; opacity: 0.95; font-size: 14px;">${isTrialPeriod ? "Enjoy your first 3 months free with unlimited access!" : "You have full access to all tier features and deal workflows."}</p>
        </div>

        <!-- Subscription Details Card -->
        <div style="background: ${this.colors.background}; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${this.colors.primary};">
          <h2 style="color: ${this.colors.text}; margin-top: 0; margin-bottom: 18px; font-size: 18px;">Subscription Details</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Plan:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark}; font-weight: bold;">${planName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Billing Cycle:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark};">${cycleDisplay}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Amount:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark}; font-size: 16px; font-weight: bold;">${amountDisplay}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Invoice / Reference:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark}; font-family: monospace;">${invoiceNumber}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Transaction ID:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark}; font-family: monospace;">${transactionId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Start Date:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark};">${new Date().toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">${isTrialPeriod ? "Trial Ends (First Billing):" : "Next Renewal Date:"}</td>
              <td style="padding: 10px 0; color: ${this.colors.dark}; font-weight: 600;">${nextBillingDisplay}</td>
            </tr>
          </table>
        </div>

        <!-- Unlocked Benefits Box -->
        <div style="background: ${this.colors.pale}; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: ${this.colors.text}; margin-top: 0; margin-bottom: 10px; font-size: 16px;">✨ What's Unlocked in Your Account:</h4>
          <ul style="color: ${this.colors.dark}; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
            ${roleBenefits.map((benefit) => `<li>${benefit}</li>`).join("")}
          </ul>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}" style="background: ${this.colors.primary}; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
            Open Your Dashboard →
          </a>
        </div>

        ${this.getFooter("Subscription activated on " + new Date().toString())}
      </div>
    `;

    console.log(`📧 [BillingNotificationService] Sending Subscription Started to ${to} (${planName})`);
    return emailService.sendEmail(to, subject, html);
  }

  /**
   * 2. PAYMENT FAILED EMAIL (with Retry + Update Card CTAs)
   */
  async sendPaymentFailedEmail({
    to,
    customerName = "Valued Member",
    planName = "Subscription",
    billingCycle = "monthly",
    amount = 0,
    currency = "ZAR",
    failureReason = "Card transaction declined by issuing bank",
    transactionId = `FAILED-${Date.now()}`,
    userType = "investor",
    gracePeriodDays = 3,
    retryUrl = null,
    updateCardUrl = null,
  }) {
    if (!to) throw new Error("Recipient email (to) is required");

    const subject = `Action Required: Payment Failed for ${planName} Subscription ⚠️`;
    const billingPortalUrl = updateCardUrl || `${this.defaultDashboardUrl}/${userType === "investor" ? "investor-billing" : "billing-info"}`;
    const paymentRetryUrl = retryUrl || `${this.defaultDashboardUrl}/${userType === "investor" ? "investor-subscriptions" : "subscriptions"}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: ${this.colors.text};">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${this.colors.error}; margin: 0; font-size: 26px;">Payment Failed ⚠️</h1>
          <p style="color: ${this.colors.text}; font-size: 17px; margin: 10px 0;">We were unable to process your payment, ${customerName}</p>
        </div>

        <!-- Failure Alert Banner -->
        <div style="background: ${this.colors.error}; color: white; padding: 18px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h3 style="margin: 0 0 6px 0; font-size: 18px;">Payment of ${currency} ${Number(amount).toFixed(2)} could not be processed</h3>
          <p style="margin: 0; opacity: 0.95; font-size: 14px;"><strong>Reason:</strong> ${failureReason}</p>
        </div>

        <!-- Details Card -->
        <div style="background: ${this.colors.background}; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${this.colors.error};">
          <h2 style="color: ${this.colors.text}; margin-top: 0; margin-bottom: 18px; font-size: 18px;">Payment Details</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Plan:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark}; font-weight: bold;">${planName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Cycle:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark};">${billingCycle}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Amount Due:</td>
              <td style="padding: 10px 0; color: ${this.colors.error}; font-size: 16px; font-weight: bold;">${currency} ${Number(amount).toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Attempt Date:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark};">${new Date().toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Grace Period:</td>
              <td style="padding: 10px 0; color: ${this.colors.warning}; font-weight: bold;">${gracePeriodDays} days remaining before feature downgrade</td>
            </tr>
          </table>
        </div>

        <!-- What to do box -->
        <div style="background: ${this.colors.pale}; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: ${this.colors.text}; margin-top: 0; margin-bottom: 10px; font-size: 16px;">🛠️ How to resolve this issue:</h4>
          <ol style="color: ${this.colors.dark}; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
            <li>Check with your bank that online e-commerce transactions are authorized.</li>
            <li>Ensure adequate funds are available on your primary card.</li>
            <li>Update your card details or retry the payment below.</li>
          </ol>
        </div>

        <!-- Dual Action Buttons: Retry + Update Card -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${paymentRetryUrl}" style="background: ${this.colors.primary}; color: #ffffff; padding: 13px 26px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; margin: 6px;">
            🔄 Retry Payment
          </a>
          <a href="${billingPortalUrl}" style="background: ${this.colors.dark}; color: #ffffff; padding: 13px 26px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; margin: 6px;">
            💳 Update Payment Method
          </a>
        </div>

        ${this.getFooter("Payment attempt recorded on " + new Date().toString())}
      </div>
    `;

    console.log(`📧 [BillingNotificationService] Sending Payment Failed notice to ${to}`);
    return emailService.sendEmail(to, subject, html);
  }

  /**
   * 3. SUBSCRIPTION CANCELLED EMAIL (with Access Changes Explained)
   */
  async sendSubscriptionCancelledEmail({
    to,
    customerName = "Valued Member",
    planName = "Premium Plan",
    effectiveDate = null,
    freePlanName = "Basic Free",
    userType = "investor",
    reactivationUrl = null,
    accessChanges = null,
  }) {
    if (!to) throw new Error("Recipient email (to) is required");

    const subject = `Subscription Cancelled - ${planName} Access Changes Confirmed`;
    const reactivateUrl = reactivationUrl || `${this.defaultDashboardUrl}/${userType === "investor" ? "investor-subscriptions" : "subscriptions"}`;
    const endDateDisplay = effectiveDate ? new Date(effectiveDate).toLocaleDateString() : "the end of your current billing cycle";

    const defaultAccessChanges = userType === "investor"
      ? [
          `Your premium access remains active until <strong>${endDateDisplay}</strong>.`,
          `After this date, your account transitions to the <strong>${freePlanName}</strong> plan.`,
          "Direct founder messaging and priority deal alerts will be paused.",
          "Verified BIG Score badges will transition to static view.",
          "<strong>Your historical deals, messages, and profile remain 100% saved and secure.</strong>"
        ]
      : [
          `Your premium features remain active until <strong>${endDateDisplay}</strong>.`,
          `After this date, your account transitions to the <strong>${freePlanName}</strong> plan.`,
          "Live BIG Scoring updates will pause (scores will reflect static snapshots).",
          "Automated funder and supplier matches will be restricted to basic tier limits.",
          "<strong>Your business profile, documents, and historical invoices remain safe.</strong>"
        ];

    const changeList = accessChanges || defaultAccessChanges;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: ${this.colors.text};">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${this.colors.dark}; margin: 0; font-size: 26px;">Subscription Cancelled</h1>
          <p style="color: ${this.colors.text}; font-size: 17px; margin: 10px 0;">Confirmation for ${planName}, ${customerName}</p>
        </div>

        <!-- Warning/Status Banner -->
        <div style="background: ${this.colors.warning}; color: white; padding: 18px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h3 style="margin: 0 0 6px 0; font-size: 18px;">Your auto-renewal has been stopped</h3>
          <p style="margin: 0; opacity: 0.95; font-size: 14px;">You will not be billed again for this subscription.</p>
        </div>

        <!-- Access Changes Explained Box -->
        <div style="background: ${this.colors.background}; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${this.colors.warning};">
          <h2 style="color: ${this.colors.text}; margin-top: 0; margin-bottom: 14px; font-size: 18px;">📋 Access Changes Explained</h2>
          <ul style="color: ${this.colors.dark}; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.7;">
            ${changeList.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </div>

        <!-- Reactivation Box -->
        <div style="background: ${this.colors.pale}; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h4 style="color: ${this.colors.text}; margin-top: 0; margin-bottom: 8px; font-size: 16px;">Changed your mind?</h4>
          <p style="color: ${this.colors.dark}; font-size: 14px; margin: 0 0 16px 0;">
            You can reactivate your ${planName} subscription anytime to restore full ecosystem access without losing any data.
          </p>
          <a href="${reactivateUrl}" style="background: ${this.colors.primary}; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
            Reactivate Subscription Anytime →
          </a>
        </div>

        ${this.getFooter("Cancellation processed on " + new Date().toString())}
      </div>
    `;

    console.log(`📧 [BillingNotificationService] Sending Subscription Cancelled notice to ${to}`);
    return emailService.sendEmail(to, subject, html);
  }

  /**
   * 4. TAX INVOICE & RECEIPT EMAIL
   * Replicates EmailService.sendPaymentReceipt with full tax breakdown and banking details
   */
  async sendInvoiceEmail({
    to,
    customerName = "Valued Customer",
    companyName = "",
    address = "South Africa",
    invoiceNumber = `INV-${Date.now().toString().slice(-6)}`,
    items = [],
    subtotal = 0,
    vat = 0,
    total = 0,
    currency = "ZAR",
    paymentMethod = "Credit Card / Peach Payments",
    transactionId = `TXN-${Date.now()}`,
    invoiceDate = new Date().toLocaleDateString(),
    dueDate = "Paid",
    userType = "investor",
  }) {
    if (!to) throw new Error("Recipient email (to) is required");

    const subject = `Tax Invoice & Payment Receipt #${invoiceNumber} - BigMarketplace`;
    const finalSubtotal = Number(subtotal) || Number(total) / 1.15 || 0;
    const finalVat = Number(vat) || Number(total) - finalSubtotal || 0;
    const finalTotal = Number(total) || finalSubtotal + finalVat || 0;

    const defaultItems = items.length > 0 ? items : [
      {
        description: "Subscription / Platform Access",
        qty: 1,
        rate: finalSubtotal,
        amount: finalSubtotal,
      }
    ];

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: ${this.colors.text};">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${this.colors.primary}; padding-bottom: 15px; margin-bottom: 25px;">
          <div>
            <h1 style="color: ${this.colors.primary}; margin: 0; font-size: 24px;">TAX INVOICE</h1>
            <p style="color: ${this.colors.dark}; margin: 5px 0 0 0; font-size: 13px;">BigMarketplace (Pty) Ltd</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-weight: bold; color: ${this.colors.text}; font-size: 15px;">#${invoiceNumber}</p>
            <p style="margin: 3px 0 0 0; color: #666; font-size: 12px;">Date: ${invoiceDate}</p>
          </div>
        </div>

        <!-- Bill To Section -->
        <div style="background: ${this.colors.background}; padding: 18px; border-radius: 8px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="width: 50%; vertical-align: top;">
                <strong style="color: ${this.colors.primary}; font-size: 12px; text-transform: uppercase;">Billed To:</strong><br>
                <strong>${customerName}</strong><br>
                ${companyName ? `<span>${companyName}</span><br>` : ""}
                <span style="color: #666;">${address}</span>
              </td>
              <td style="width: 50%; vertical-align: top; text-align: right;">
                <strong style="color: ${this.colors.primary}; font-size: 12px; text-transform: uppercase;">Payment Details:</strong><br>
                <span>Method: ${paymentMethod}</span><br>
                <span>Ref: <code style="background: #e5e7eb; padding: 2px 4px; border-radius: 4px;">${transactionId}</code></span><br>
                <span style="color: ${this.colors.success}; font-weight: bold;">Status: ${dueDate}</span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Itemized Table -->
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
          <thead>
            <tr style="background: ${this.colors.pale}; color: ${this.colors.dark};">
              <th style="padding: 10px; text-align: left; border-radius: 6px 0 0 6px;">Description</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Rate</th>
              <th style="padding: 10px; text-align: right; border-radius: 0 6px 6px 0;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${defaultItems.map((item) => `
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; color: ${this.colors.text}; font-weight: 600;">${item.description}</td>
                <td style="padding: 10px; text-align: center; color: ${this.colors.dark};">${item.qty || 1}</td>
                <td style="padding: 10px; text-align: right; color: ${this.colors.dark};">${currency} ${Number(item.rate || item.amount).toFixed(2)}</td>
                <td style="padding: 10px; text-align: right; color: ${this.colors.dark}; font-weight: 600;">${currency} ${Number(item.amount).toFixed(2)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <!-- Totals Breakdown -->
        <div style="margin-left: auto; width: 260px; margin-bottom: 25px; font-size: 13px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: ${this.colors.text};">Subtotal:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600;">${currency} ${finalSubtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: ${this.colors.text};">VAT (15%):</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600;">${currency} ${finalVat.toFixed(2)}</td>
            </tr>
            <tr style="border-top: 2px solid ${this.colors.primary};">
              <td style="padding: 10px 0; font-size: 16px; font-weight: bold; color: ${this.colors.primary};">Total:</td>
              <td style="padding: 10px 0; text-align: right; font-size: 16px; font-weight: bold; color: ${this.colors.primary};">${currency} ${finalTotal.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <!-- Banking Information (matching BillingHistory.js) -->
        <div style="background: ${this.colors.pale}; padding: 15px; border-radius: 8px; font-size: 12px; color: ${this.colors.dark}; margin-bottom: 25px;">
          <strong style="color: ${this.colors.text};">Official Banking Records:</strong><br>
          Bank: Rivonia Branch | Branch Code: 19630500 | Account: 1145498108<br>
          Send proof of payment inquiries to: <a href="mailto:hello@bigmarketplace.africa" style="color: ${this.colors.primary};">hello@bigmarketplace.africa</a>
        </div>

        ${this.getFooter("Payment processed and verified. Thank you for your business!")}
      </div>
    `;

    console.log(`📧 [BillingNotificationService] Sending Tax Invoice #${invoiceNumber} to ${to}`);
    return emailService.sendEmail(to, subject, html);
  }

  /**
   * 5. SUBSCRIPTION RENEWAL REMINDER (3 Days Before Renewal - SP8.47)
   */
  async sendSubscriptionRenewalReminderEmail({
    to,
    customerName = "Valued Member",
    planName = "Premium Plan",
    billingCycle = "monthly",
    amount = 0,
    currency = "ZAR",
    renewalDate = null,
    userType = "investor",
    manageUrl = null,
  }) {
    if (!to) throw new Error("Recipient email (to) is required");

    const subject = `Upcoming Subscription Renewal - ${planName} in 3 Days 🔔`;
    const appManageUrl = manageUrl || `${this.defaultDashboardUrl}/${userType === "investor" ? "investor-subscriptions" : "subscriptions"}`;
    const formattedRenewalDate = renewalDate ? new Date(renewalDate).toLocaleDateString() : "in 3 days";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: ${this.colors.text};">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${this.colors.primary}; margin: 0; font-size: 26px;">Upcoming Renewal 🔔</h1>
          <p style="color: ${this.colors.text}; font-size: 17px; margin: 10px 0;">Friendly reminder for your ${planName} subscription, ${customerName}</p>
        </div>

        <div style="background: ${this.colors.background}; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${this.colors.primary};">
          <h2 style="color: ${this.colors.text}; margin-top: 0; margin-bottom: 18px; font-size: 18px;">Renewal Details</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Plan:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark}; font-weight: bold;">${planName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Billing Cycle:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark};">${billingCycle === "annually" ? "Annual" : "Monthly"}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Renewal Amount:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark}; font-size: 16px; font-weight: bold;">${currency} ${Number(amount).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Scheduled Renewal Date:</td>
              <td style="padding: 10px 0; color: ${this.colors.primary}; font-weight: bold;">${formattedRenewalDate}</td>
            </tr>
          </table>
        </div>

        <div style="background: ${this.colors.pale}; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: ${this.colors.text}; margin-top: 0; margin-bottom: 8px; font-size: 15px;">No action needed if you wish to continue:</h4>
          <p style="color: ${this.colors.dark}; font-size: 13px; margin: 0; line-height: 1.6;">
            Your account will automatically renew using your saved payment method. If you need to update your payment card or make changes to your plan, you can do so in your dashboard anytime before ${formattedRenewalDate}.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${appManageUrl}" style="background: ${this.colors.primary}; color: #ffffff; padding: 13px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
            Manage Subscription & Payment Method →
          </a>
        </div>

        ${this.getFooter("Automated renewal reminder generated on " + new Date().toString())}
      </div>
    `;

    console.log(`📧 [BillingNotificationService] Sending Renewal Reminder to ${to} (${planName})`);
    return emailService.sendEmail(to, subject, html);
  }

  /**
   * 6. PRICING PLAN UPGRADE CONFIRMATION (SP8.51)
   */
  async sendPlanUpgradeConfirmationEmail({
    to,
    customerName = "Valued Member",
    previousPlan = "Basic Plan",
    newPlanName = "Verified Plan",
    billingCycle = "monthly",
    amount = 0,
    currency = "ZAR",
    transactionId = `UPG-${Date.now()}`,
    userType = "investor",
    dashboardUrl = null,
  }) {
    if (!to) throw new Error("Recipient email (to) is required");

    const subject = `Plan Upgraded! 🚀 Welcome to ${newPlanName} - BigMarketplace`;
    const appUrl = dashboardUrl || `${this.defaultDashboardUrl}/${userType === "investor" ? "investor-dashboard" : "dashboard"}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: ${this.colors.text};">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${this.colors.primary}; margin: 0; font-size: 26px;">Plan Upgraded! 🚀</h1>
          <p style="color: ${this.colors.text}; font-size: 17px; margin: 10px 0;">You are now on ${newPlanName}, ${customerName}</p>
        </div>

        <div style="background: ${this.colors.success}; color: white; padding: 18px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h3 style="margin: 0 0 6px 0; font-size: 18px;">Upgrade Successful</h3>
          <p style="margin: 0; opacity: 0.95; font-size: 14px;">Your account has been upgraded from <strong>${previousPlan}</strong> to <strong>${newPlanName}</strong>.</p>
        </div>

        <div style="background: ${this.colors.background}; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${this.colors.primary};">
          <h2 style="color: ${this.colors.text}; margin-top: 0; margin-bottom: 18px; font-size: 18px;">Upgrade Summary</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Previous Plan:</td>
              <td style="padding: 10px 0; color: #888;">${previousPlan}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">New Active Plan:</td>
              <td style="padding: 10px 0; color: ${this.colors.primary}; font-weight: bold;">${newPlanName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">New Rate:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark}; font-weight: bold;">${currency} ${Number(amount).toFixed(2)} / ${billingCycle === "annually" ? "year" : "month"}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Transaction Ref:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark}; font-family: monospace;">${transactionId}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Effective Date:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark};">${new Date().toLocaleDateString()} (Immediate)</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}" style="background: ${this.colors.primary}; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
            Explore Upgraded Features →
          </a>
        </div>

        ${this.getFooter("Plan upgrade processed on " + new Date().toString())}
      </div>
    `;

    console.log(`📧 [BillingNotificationService] Sending Plan Upgrade Confirmation to ${to} (${newPlanName})`);
    return emailService.sendEmail(to, subject, html);
  }

  /**
   * 7. REFUND ISSUED EMAIL (SP8.48)
   */
  async sendRefundIssuedEmail({
    to,
    customerName = "Valued Member",
    amount = 0,
    currency = "ZAR",
    refundNumber = `REF-${Date.now().toString().slice(-6)}`,
    originalTransactionId = "N/A",
    reason = "Customer refund request / adjustment",
    itemName = "Subscription / Service",
    userType = "investor",
  }) {
    if (!to) throw new Error("Recipient email (to) is required");

    const subject = `Refund Processed - ${currency} ${Number(amount).toFixed(2)} [${refundNumber}] ↩️`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: ${this.colors.text};">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${this.colors.dark}; margin: 0; font-size: 26px;">Refund Processed ↩️</h1>
          <p style="color: ${this.colors.text}; font-size: 17px; margin: 10px 0;">Confirmation for ${customerName}</p>
        </div>

        <div style="background: ${this.colors.background}; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${this.colors.dark};">
          <h2 style="color: ${this.colors.text}; margin-top: 0; margin-bottom: 18px; font-size: 18px;">Refund Details</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Refund Reference:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark}; font-family: monospace;">${refundNumber}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Item / Service:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark};">${itemName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Original Transaction:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark}; font-family: monospace;">${originalTransactionId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Refund Amount:</td>
              <td style="padding: 10px 0; color: ${this.colors.primary}; font-size: 16px; font-weight: bold;">${currency} ${Number(amount).toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Reason:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark};">${reason}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Estimated Clearance:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark};">3–5 business days (depending on your bank)</td>
            </tr>
          </table>
        </div>

        <div style="background: ${this.colors.pale}; padding: 18px; border-radius: 8px; margin: 20px 0; font-size: 13px; color: ${this.colors.dark};">
          <p style="margin: 0; line-height: 1.6;">
            The refunded amount will appear on your card or bank statement under the original payment reference. If you have any questions or require further assistance, please contact our support team.
          </p>
        </div>

        ${this.getFooter("Refund processed on " + new Date().toString())}
      </div>
    `;

    console.log(`📧 [BillingNotificationService] Sending Refund confirmation to ${to} (${refundNumber})`);
    return emailService.sendEmail(to, subject, html);
  }

  /**
   * 8. SUCCESS FEE TRIGGERED (Admin Invoiced - SP8.49)
   */
  async sendSuccessFeeTriggeredEmail({
    to,
    customerName = "Valued Partner",
    companyName = "",
    dealTitle = "Funding Agreement / Commercial Contract",
    dealReference = `DEAL-${Date.now().toString().slice(-6)}`,
    dealValue = 0,
    feeRate = 3.0,
    feeAmount = 0,
    vatAmount = 0,
    totalDue = 0,
    currency = "ZAR",
    dueDate = null,
    invoiceNumber = `SF-${Date.now().toString().slice(-6)}`,
    userType = "investor",
  }) {
    if (!to) throw new Error("Recipient email (to) is required");

    const subject = `Success Fee Invoice Triggered - Deal #${dealReference} [${invoiceNumber}] 🤝`;
    const formattedDueDate = dueDate ? new Date(dueDate).toLocaleDateString() : "Net 30 Days";

    const calcFee = Number(feeAmount) || (Number(dealValue) * (Number(feeRate) / 100));
    const calcVat = Number(vatAmount) || (calcFee * 0.15);
    const calcTotal = Number(totalDue) || (calcFee + calcVat);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: ${this.colors.text};">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${this.colors.primary}; margin: 0; font-size: 26px;">Success Fee Invoice 🤝</h1>
          <p style="color: ${this.colors.text}; font-size: 17px; margin: 10px 0;">Deal Completed: ${dealTitle}</p>
        </div>

        <div style="background: ${this.colors.background}; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${this.colors.primary};">
          <h2 style="color: ${this.colors.text}; margin-top: 0; margin-bottom: 18px; font-size: 18px;">Deal & Success Fee Summary</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Invoice #:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark}; font-family: monospace;">${invoiceNumber}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Deal Reference:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark}; font-family: monospace;">${dealReference}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Client / Partner:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark};">${customerName} ${companyName ? `(${companyName})` : ""}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Completed Deal Value:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark}; font-weight: bold;">${currency} ${Number(dealValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Agreed Success Fee Rate:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark}; font-weight: bold;">${feeRate}%</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Subtotal (Excl. VAT):</td>
              <td style="padding: 10px 0; color: ${this.colors.dark};">${currency} ${calcFee.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">VAT (15%):</td>
              <td style="padding: 10px 0; color: ${this.colors.dark};">${currency} ${calcVat.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.primary}; font-size: 16px;">Total Fee Due:</td>
              <td style="padding: 10px 0; color: ${this.colors.primary}; font-size: 16px; font-weight: bold;">${currency} ${calcTotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Payment Due Date:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark}; font-weight: 600;">${formattedDueDate}</td>
            </tr>
          </table>
        </div>

        <!-- Banking Details for Settlement -->
        <div style="background: ${this.colors.pale}; padding: 18px; border-radius: 8px; margin: 20px 0; font-size: 13px; color: ${this.colors.dark};">
          <strong style="color: ${this.colors.text};">Banking Details for EFT Settlement:</strong><br>
          Bank: Rivonia Branch | Branch Code: 19630500 | Account: 1145498108<br>
          Reference: <strong>${invoiceNumber}</strong><br>
          Send proof of payment to: <a href="mailto:hello@bigmarketplace.africa" style="color: ${this.colors.primary};">hello@bigmarketplace.africa</a>
        </div>

        ${this.getFooter("Success Fee invoice issued on " + new Date().toString())}
      </div>
    `;

    console.log(`📧 [BillingNotificationService] Sending Success Fee Invoice to ${to} (${invoiceNumber})`);
    return emailService.sendEmail(to, subject, html);
  }

  /**
   * 9. SUCCESS FEE RECEIPT (SP8.50)
   */
  async sendSuccessFeeReceiptEmail({
    to,
    customerName = "Valued Partner",
    companyName = "",
    receiptNumber = `REC-${Date.now().toString().slice(-6)}`,
    invoiceNumber = "SF-001",
    dealReference = "DEAL-001",
    amountPaid = 0,
    currency = "ZAR",
    paymentDate = new Date().toLocaleDateString(),
    paymentMethod = "EFT / Bank Transfer",
    userType = "investor",
  }) {
    if (!to) throw new Error("Recipient email (to) is required");

    const subject = `Payment Receipt: Success Fee #${receiptNumber} - Confirmed ✅`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: ${this.colors.text};">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${this.colors.success}; margin: 0; font-size: 26px;">Payment Received! ✅</h1>
          <p style="color: ${this.colors.text}; font-size: 17px; margin: 10px 0;">Official Receipt for Success Fee #${receiptNumber}</p>
        </div>

        <div style="background: ${this.colors.success}; color: white; padding: 18px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h3 style="margin: 0 0 6px 0; font-size: 18px;">Settlement Cleared</h3>
          <p style="margin: 0; opacity: 0.95; font-size: 14px;">The success fee for Deal #${dealReference} has been paid in full.</p>
        </div>

        <div style="background: ${this.colors.background}; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${this.colors.success};">
          <h2 style="color: ${this.colors.text}; margin-top: 0; margin-bottom: 18px; font-size: 18px;">Receipt Details</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Receipt #:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark}; font-family: monospace;">${receiptNumber}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Original Invoice:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark}; font-family: monospace;">${invoiceNumber}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Deal Reference:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark}; font-family: monospace;">${dealReference}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Paid By:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark}; font-weight: 600;">${customerName} ${companyName ? `(${companyName})` : ""}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Amount Paid:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark}; font-size: 16px; font-weight: bold;">${currency} ${Number(amountPaid).toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Payment Method:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark};">${paymentMethod}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold; color: ${this.colors.text};">Date Cleared:</td>
              <td style="padding: 10px 0; color: ${this.colors.dark};">${paymentDate}</td>
            </tr>
          </table>
        </div>

        <div style="background: ${this.colors.pale}; padding: 18px; border-radius: 8px; margin: 20px 0; text-align: center; font-size: 13px; color: ${this.colors.dark};">
          <p style="margin: 0; line-height: 1.6;">
            🎉 Congratulations on the successful transaction! Thank you for your partnership with BigMarketplace.
          </p>
        </div>

        ${this.getFooter("Official receipt generated on " + new Date().toString())}
      </div>
    `;

    console.log(`📧 [BillingNotificationService] Sending Success Fee Receipt to ${to} (${receiptNumber})`);
    return emailService.sendEmail(to, subject, html);
  }
}

module.exports = new BillingNotificationService();
