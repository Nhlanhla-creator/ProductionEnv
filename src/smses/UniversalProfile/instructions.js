

export default function Instructions({ isNGO = false }) {
  if (isNGO) {
    return (
      <div className="max-w-5xl mx-left">
        <h2 className="text-2xl font-bold text-brown-800 mb-6">NGO / Non-Profit Universal Profile Instructions</h2>

        <div className="bg-brown-50 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold text-brown-700 mb-4">How to complete your Non-Profit profile</h3>
          <ul className="list-disc pl-5 space-y-2 text-brown-700">
            <li>Complete all required fields marked with an asterisk (*)</li>
            <li>Capture your organisation's mission, target beneficiaries, and operating model accurately</li>
            <li>Ensure non-profit governance details (Governing Body, Trustees / Directors) and public benefit status (NPO, PBO Section 18A) are up to date</li>
            <li>Document your community programmes, delivery methods, and historic impact track record</li>
            <li>Upload foundational constitutional documents (Constitution, Trust Deed, or MOI) and compliance certificates</li>
            <li>You can save your progress and return at any time before final submission</li>
          </ul>
        </div>

        <div className="bg-brown-50 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold text-brown-700 mb-4">Purpose of data collection</h3>
          <p className="text-brown-700 mb-4">The information collected in this Universal Profile will be used to:</p>
          <ul className="list-disc pl-5 space-y-2 text-brown-700">
            <li>Create your comprehensive non-profit and social impact profile</li>
            <li>Match your organisation with grantmakers, CSI sponsors, philanthropic foundations, and corporate partners</li>
            <li>Verify public benefit compliance, governance standing, and tax-exemption status</li>
            <li>Highlight grant-readiness and showcase programme outcomes to funders</li>
            <li>Generate tailored capacity-building recommendations and reporting tools</li>
          </ul>
        </div>

        <div className="bg-brown-50 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold text-brown-700 mb-4">Understanding your funding & partnership pipeline</h3>
          <p className="text-brown-700 mb-4">
            Your funding pipeline tracks the progress of your engagement with donors, grantmakers, and CSI partners. As you interact with matches and submit applications, your opportunities move through various stages:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-brown-700">
            <li><strong>Primary Matches:</strong> Donors and grantmakers whose mandate aligns with your profile at 80% or higher.</li>
            <li><strong>Applications & Proposals:</strong> Funding proposals or grant applications you have submitted.</li>
            <li><strong>Under Due Diligence / Review:</strong> Proposals currently undergoing donor committee or due diligence evaluation.</li>
            <li><strong>Partnerships Initiated:</strong> Funders who have reached out with interest, requests for site visits, or collaboration terms.</li>
            <li><strong>Grants / Deals Awarded:</strong> Finalized grant agreements and funded partnerships.</li>
            <li><strong>Withdrawn / Unsuccessful:</strong> Opportunities either withdrawn by your organisation or declined by the funder.</li>
          </ul>
          <p className="text-brown-700 mt-4">
            You can monitor all your grant pipeline activity in real time on your dashboard.
          </p>
        </div>

        <div className="bg-brown-50 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold text-brown-700 mb-4">Terms & conditions</h3>
          <p className="text-brown-700 mb-4">
            By completing this profile, you agree to our platform's terms and conditions, including:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-brown-700">
            <li>Providing accurate, truthful information regarding your organisation's governance and activities</li>
            <li>Keeping your profile and compliance records up to date</li>
            <li>Allowing verification of public benefit registrations and submitted certificates</li>
            <li>Accepting that false representations may result in profile disqualification</li>
            <li>Understanding that profile approval and badge issuance are subject to due diligence</li>
          </ul>
        </div>

        <div className="bg-brown-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-brown-700 mb-4">Privacy & transparency disclaimer</h3>
          <p className="text-brown-700 mb-4">We protect your organisation's sensitive information:</p>
          <ul className="list-disc pl-5 space-y-2 text-brown-700">
            <li>Data is encrypted and stored securely using enterprise-grade cloud protection</li>
            <li>Detailed financial statements and confidential donor lists are only accessible to verified partners with your consent</li>
            <li>You can manage sharing permissions or update data anytime</li>
            <li>We comply with POPIA, GDPR, and relevant data protection legislation</li>
          </ul>
        </div>

        <div className="mt-8 text-center">
          <p className="text-brown-600 italic">
            Please proceed to the next section to begin completing your Universal Profile.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-left">
      <h2 className="text-2xl font-bold text-brown-800 mb-6">Instructions</h2>

      <div className="bg-brown-50 p-6 rounded-lg mb-8">
        <h3 className="text-lg font-semibold text-brown-700 mb-4">How to complete the form</h3>
        <ul className="list-disc pl-5 space-y-2 text-brown-700">
          <li>Complete all required fields marked with an asterisk (*)</li>
          <li>Navigate through sections using the tracker at the top</li>
          <li>You can save your progress and return later</li>
          <li>Upload all required documents in the specified formats</li>
          <li>Review your information before final submission</li>
          <li>Click on each section in the tracker to view specific instructions</li>
        </ul>
      </div>

      <div className="bg-brown-50 p-6 rounded-lg mb-8">
        <h3 className="text-lg font-semibold text-brown-700 mb-4">Purpose of data collection</h3>
        <p className="text-brown-700 mb-4">The information collected in this Universal Profile will be used to:</p>
        <ul className="list-disc pl-5 space-y-2 text-brown-700">
          <li>Create your comprehensive business profile</li>
          <li>Match you with relevant opportunities, investors, and partners</li>
          <li>Verify your business legitimacy and compliance status</li>
          <li>Provide personalized recommendations and support</li>
          <li>Generate insights to help improve your business performance</li>
        </ul>
      </div>
      <div className="bg-brown-50 p-6 rounded-lg mb-8">
        <h3 className="text-lg font-semibold text-brown-700 mb-4">Understanding your funding pipeline</h3>
        <p className="text-brown-700 mb-4">
          Your funding pipeline helps track the progress of your engagement with potential funders. As you interact with matches and submit applications, your opportunities move through various stages:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-brown-700">
          <li><strong>Primary Matches:</strong> Funders who align with your profile at a score of 80% or higher.</li>
          <li><strong>Applications:</strong> Opportunities you've actively applied to.</li>
          <li><strong>Under Review:</strong> Applications currently being evaluated by funders.</li>
          <li><strong>Deals Initiated:</strong> Funders who have responded with interest or feedback.</li>
          <li><strong>Deals Closed:</strong> Successful funding agreements that have been finalized.</li>
          <li><strong>Withdrawn / Declined:</strong> Applications that were either withdrawn by you or declined by funders.</li>
        </ul>
        <p className="text-brown-700 mt-4">
          You can view your pipeline progress in real time on your dashboard. This visual representation helps you stay organized and take timely action to move opportunities forward.
        </p>
      </div>

      <div className="bg-brown-50 p-6 rounded-lg mb-8">
        <h3 className="text-lg font-semibold text-brown-700 mb-4">Terms & conditions</h3>
        <p className="text-brown-700 mb-4">
          By completing this profile, you agree to our platform's terms and conditions, including:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-brown-700">
          <li>Providing accurate and truthful information</li>
          <li>Keeping your profile information up to date</li>
          <li>Allowing us to verify the information provided</li>
          <li>Accepting that incomplete or false information may result in profile rejection</li>
          <li>Understanding that profile approval is subject to verification</li>
        </ul>
      </div>

      <div className="bg-brown-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-brown-700 mb-4">Privacy disclaimer</h3>
        <p className="text-brown-700 mb-4">We take your privacy seriously. Here's how we handle your information:</p>
        <ul className="list-disc pl-5 space-y-2 text-brown-700">
          <li>Your data is stored securely and protected with industry-standard measures</li>
          <li>We only share your information with third parties with your explicit consent</li>
          <li>You can request access to, correction of, or deletion of your data at any time</li>
          <li>We retain your information only as long as necessary for the purposes described</li>
          <li>We comply with all applicable data protection regulations</li>
        </ul>
      </div>

      <div className="mt-8 text-center">
        <p className="text-brown-600 italic">
          Please proceed to the next section to begin completing your Universal Profile.
        </p>
      </div>
    </div>
  )
}