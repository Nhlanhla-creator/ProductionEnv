

"use client"
import {auth} from "../../firebaseConfig"
import { useState } from "react"
import RegistrationSummary from "./registration-summary"
import "./UniversalProfile.css"

export default function DeclarationConsent({ data = {}, updateData, allFormData, onComplete }) {
  const [showSummary, setShowSummary] = useState(false)

  const handleChange = (e) => {
    const { name, checked } = e.target
    updateData({ [name]: checked })
  }

  const handleFileChange = (name, files) => {
    updateData({ [name]: files })
  }

  const handleSubmit = () => {
    // Show the summary when the form is submitted
    setShowSummary(true)
  }
  const user = auth.currentUser

  return (
    <div>
      <h2 className="text-2xl font-bold text-brown-800 mb-6">Declaration & Consent</h2>

      <div className="max-w-5xl mx-left">
        <div className="bg-brown-50 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold text-brown-700 mb-4">Declaration of Accuracy</h3>
          <p className="text-brown-700 mb-4">
            I hereby declare that all information provided in this Universal Profile is true, accurate, and complete to
            the best of my knowledge. I understand that any false or misleading information may result in the rejection
            of my profile or termination of any agreements that may arise from this profile.
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
                I confirm that all information provided is accurate and complete
              </span>
            </label>
          </div>
        </div>

        <div className="bg-brown-50 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold text-brown-700 mb-4">Consent for Data Processing</h3>
          <p className="text-brown-700 mb-4">
            I consent to the collection, processing, and storage of the personal and business information provided in
            this Universal Profile. I understand that this information will be used for the purposes of business
            verification, matching with relevant opportunities, and providing personalized recommendations and support.
          </p>
          <p className="text-brown-700 mb-4">
            I understand that my information may be shared with third parties for the purposes of verification and
            matching, but only with my explicit consent for each specific instance of sharing.
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
                I consent to the collection and processing of my data as described
              </span>
            </label>
          </div>
        </div>

        <div className="bg-brown-50 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold text-brown-700 mb-4">Opt-in for Promotional Visibility(optional)</h3>
          <p className="text-brown-700 mb-4">
           By opting in, you agree to allow us to highlight your profile, project, or contribution across our promotional channels, including newsletters, social media, and featured listings. This is a great opportunity to increase your visibility within the community and attract more engagement or collaboration. Participation is entirely optional and can be withdrawn at any time.{" "}
           

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
              <span className="ml-2 text-brown-700">  We consent to our program being listed publicity</span>
            </label>
          </div>

        </div>

      </div>

      {/* Registration Summary Modal */}
      <RegistrationSummary
        data={allFormData || data}
        open={showSummary}
        onClose={() => setShowSummary(false)}
        onComplete={onComplete}
      />
    </div>
  )
}