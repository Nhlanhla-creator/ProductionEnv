"use client"

import styles from "./InvestorUniversalProfile.module.css"
export default function Instructions() {
  return (
    <div className={styles.instructionsWrapper}>
      <h2 className={styles.sectionTitle}>Instructions</h2>

      <div className={styles.card}>
        <h3 className={styles.cardHeading}>How to complete the form</h3>
        <ul className={styles.bulletList}>
          <li>Complete all required fields marked with an asterisk (*)</li>
          <li>Navigate through sections using the tracker at the top</li>
          <li>You can save your progress and return later</li>
          <li>Upload all required documents in the specified formats</li>
          <li>Review your information before final submission</li>
          <li>Click on each section in the tracker to view specific instructions</li>
        </ul>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardHeading}>Purpose of data collection</h3>
        <p className={styles.paragraph}>The information collected in this Universal Profile will be used to:</p>
        <ul className={styles.bulletList}>
          <li>Create your comprehensive business profile</li>
          <li>Match you with relevant opportunities, investors, and partners</li>
          <li>Verify your business legitimacy and compliance status</li>
          <li>Provide personalized recommendations and support</li>
          <li>Generate insights to help improve your business performance</li>
        </ul>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardHeading}>Terms & conditions</h3>
        <p className={styles.paragraph}>
          By completing this profile, you agree to our platform's terms and conditions, including:
        </p>
        <ul className={styles.bulletList}>
          <li>Providing accurate and truthful information</li>
          <li>Keeping your profile information up to date</li>
          <li>Allowing us to verify the information provided</li>
          <li>Accepting that incomplete or false information may result in profile rejection</li>
          <li>Understanding that profile approval is subject to verification</li>
        </ul>
    
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardHeading}>Privacy disclaimer</h3>
        <p className={styles.paragraph}>We take your privacy seriously. Here's how we handle your information:</p>
        <ul className={styles.bulletList}>
          <li>Your data is stored securely and protected with industry-standard measures</li>
          <li>We only share your information with third parties with your explicit consent</li>
          <li>You can request access to, correction of, or deletion of your data at any time</li>
          <li>We retain your information only as long as necessary for the purposes described</li>
          <li>We comply with all applicable data protection regulations</li>
        </ul>
    
      </div>

      <div className={styles.instructionsFooter}>
        <p className={styles.instructionsNote}>
          Please proceed to the next section to begin completing your Universal Profile.
        </p>
      </div>
    </div>
  )
}
