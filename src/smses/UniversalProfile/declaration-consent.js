"use client"
import { auth } from "../../firebaseConfig"
import { useState } from "react"
import RegistrationSummary from "./registration-summary"
import HowDidYouHear from "./how-did-you-hear"
import "./UniversalProfile.css"
import { checkIsNGO } from "./ngoTaxonomy"

export default function DeclarationConsent({
  data = {},
  updateData,
  allFormData,
  howDidYouHearData = {},
  onHowDidYouHearUpdate,
  onComplete,
  isNGO: isNGOProp,
}) {
  const isNGO = isNGOProp ?? checkIsNGO(allFormData || data);
  const [showSummary, setShowSummary] = useState(false)

  const handleChange = (e) => {
    const { name, checked } = e.target
    updateData({ [name]: checked })
  }

  const handleFileChange = (name, files) => updateData({ [name]: files })
  const handleSubmit = () => setShowSummary(true)
  const user = auth.currentUser

  const fallbackHowData = data?.howDidYouHear || {}
  const effectiveHowData = onHowDidYouHearUpdate ? howDidYouHearData : fallbackHowData
  const effectiveHowUpdate = onHowDidYouHearUpdate
    ? onHowDidYouHearUpdate
    : (patch) => updateData({ howDidYouHear: { ...fallbackHowData, ...patch } })

  return (
    <div>
      <h2 className="text-2xl font-bold text-brown-800 mb-6">Declaration &amp; Consent</h2>

      <div className="max-w-5xl mx-left">
        {/* Declaration of Accuracy */}
        <div className="bg-brown-50 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold text-brown-700 mb-4">Declaration of Accuracy</h3>
          <p className="text-brown-700 mb-4">
            {isNGO ? (
              "I hereby declare that all information provided in this Universal Profile is true, accurate, and complete to the best of my knowledge. I understand that any false or misleading information may result in the rejection of this organisation profile or termination of any grant, subsidy, contract, or partnership agreements that may arise from this profile."
            ) : (
              "I hereby declare that all information provided in this Universal Profile is true, accurate, and complete to the best of my knowledge. I understand that any false or misleading information may result in the rejection of my profile or termination of any agreements that may arise from this profile."
            )}
          </p>
          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="accuracy"
                checked={data.accuracy || false}
                onChange={handleChange}
                className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300 rounded"
                required
              />
              <span className="ml-2 text-brown-700">
                {isNGO
                  ? "I confirm that all organisation information provided is accurate and complete"
                  : "I confirm that all information provided is accurate and complete"}
              </span>
            </label>
          </div>
        </div>

        {/* Authority Confirmation (NGO Specific) */}
        {isNGO && (
          <div className="bg-brown-50 p-6 rounded-lg mb-8">
            <h3 className="text-lg font-semibold text-brown-700 mb-4">Authority to Submit & Manage Profile</h3>
            <p className="text-brown-700 mb-4">
              I confirm that I am duly authorised by the governing body (Board of Directors, Board of Trustees, or Management Committee) to submit, maintain, and manage this Universal Profile on behalf of the organisation, and to provide the documents and information contained herein.
            </p>
            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="authorisedSubmitter"
                  checked={data.authorisedSubmitter || false}
                  onChange={handleChange}
                  className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300 rounded"
                  required
                />
                <span className="ml-2 text-brown-700 font-medium">
                  I confirm that I am authorised to submit and manage this profile on behalf of the organisation
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Consent for Data Processing */}
        <div className="bg-brown-50 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold text-brown-700 mb-4">Consent for Data Processing</h3>
          <p className="text-brown-700 mb-4">
            {isNGO ? (
              "I consent to the collection, processing, and storage of the organisation information provided in this Universal Profile. I understand that this information will be used for the purposes of organisation verification, due diligence matching with grant-makers, corporate CSI partners, public sector programmes, and providing institutional recommendations and support."
            ) : (
              "I consent to the collection, processing, and storage of the personal and business information provided in this Universal Profile. I understand that this information will be used for the purposes of business verification, matching with relevant opportunities, and providing personalized recommendations and support."
            )}
          </p>
          <p className="text-brown-700 mb-4">
            {isNGO ? (
              "I understand that confidential funder agreements, bank records, identity documents, and sensitive beneficiary information will be subject to strict role-based access controls and shared with third parties only with explicit consent."
            ) : (
              "I understand that my information may be shared with third parties for the purposes of verification and matching, but only with my explicit consent for each specific instance of sharing."
            )}
          </p>
          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="dataProcessing"
                checked={data.dataProcessing || false}
                onChange={handleChange}
                className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300 rounded"
                required
              />
              <span className="ml-2 text-brown-700">
                {isNGO
                  ? "I consent to the collection and processing of organisation data as described"
                  : "I consent to the collection and processing of my data as described"}
              </span>
            </label>
          </div>
        </div>

        {sessionStorage.getItem("isOnboarding") === "true" && (
          <div className="bg-brown-50 p-6 rounded-lg mb-8">
            <h3 className="text-lg font-semibold text-brown-700 mb-4">CMF Permission Agreement Form</h3>
            <p className="text-brown-700 mb-4">
              {isNGO
                ? "Please upload the signed permission agreement form confirming that the organisation has granted permission to be onboarded by the Capital and Market Facilitator (CMF)."
                : "Please upload the signed permission agreement form confirming that the business/partner has granted permission to be onboarded by the Capital and Market Facilitator (CMF)."}
            </p>
            <div className="mt-4">
              <input type="file" name="cmfPermissionAgreement" onChange={(e) => handleFileChange("cmfPermissionAgreement", e.target.files[0])} className="block w-full text-sm text-brown-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brown-50 file:text-brown-700 hover:file:bg-brown-100" required />
              {data.cmfPermissionAgreement && (
                <p className="text-sm text-green-600 mt-2 font-medium">✓ Form attached: {data.cmfPermissionAgreement.name || "Permission Document"}</p>
              )}
            </div>
          </div>
        )}

        <div className="bg-brown-50 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold text-brown-700 mb-4">
            {isNGO ? "Public Listing & Promotional Visibility (Optional)" : "Opt-in for Promotional Visibility (optional)"}
          </h3>
          <p className="text-brown-700 mb-4">
            {isNGO ? (
              "By opting in, you agree to allow us to highlight your organisation profile, programmes, and impact metrics across our promotional channels and the public BIG Marketplace Africa directory to connect with donors, funders, and community partners. Sensitive documents and beneficiary details remain protected. Participation is entirely optional and can be withdrawn at any time."
            ) : (
              "By opting in, you agree to allow us to highlight your profile, project, or contribution across our promotional channels, including newsletters, social media, and featured listings. This is a great opportunity to increase your visibility within the community and attract more engagement or collaboration. Participation is entirely optional and can be withdrawn at any time."
            )}
          </p>
          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="termsConditions"
                checked={data.termsConditions || false}
                onChange={handleChange}
                className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300 rounded"
                required
              />
              <span className="ml-2 text-brown-700">
                {isNGO
                  ? "We consent to our organisation and programmes being listed on the public marketplace directory"
                  : "We consent to our program being listed publicly"}
              </span>
            </label>
          </div>
        </div>

        {/* How Did You Hear About Us — MOVED TO THE END */}
        <div className="bg-brown-50 p-6 rounded-lg mb-8" style={{ backgroundColor: "#efebe9", border: "1px solid #d7ccc8" }}>
          <HowDidYouHear data={effectiveHowData} updateData={effectiveHowUpdate} />
        </div>
      </div>

      <RegistrationSummary
        data={allFormData || data}
        open={showSummary}
        onClose={() => setShowSummary(false)}
        onComplete={onComplete}
      />
    </div>
  )
}