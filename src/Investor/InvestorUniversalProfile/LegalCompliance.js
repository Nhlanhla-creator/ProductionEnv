"use client"
import FormField from "./FormField"
import FileUpload from "./FileUpload"
const bbbeeOptions = [
  { value: "1", label: "Level 1" },
  { value: "2", label: "Level 2" },
  { value: "3", label: "Level 3" },
  { value: "4", label: "Level 4" },
  { value: "5", label: "Level 5" },
  { value: "6", label: "Level 6" },
  { value: "7", label: "Level 7" },
  { value: "8", label: "Level 8" },
  { value: "Exempt", label: "Exempt" },
  { value: "None", label: "None" },
]

const cipcStatusOptions = [
   { value: "Current", label: "Current" },
  { value: "Pending", label: "Pending" },
  { value: "Overdue", label: "Overdue" },
  { value: "N/A", label: "Not Applicable" },
]

export default function LegalCompliance({ data = {}, updateData }) {
  const handleChange = (e) => {
    const { name, value } = e.target
    updateData({ [name]: value })
  }

  const handleFileChange = (name, files) => {
    updateData({ [name]: files })
  }

  const handleDateChange = (e) => {
    const { name, value } = e.target
    updateData({ [name]: value })
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-brown-800 mb-6">Legal & Compliance</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <FormField label="Tax Number" required>
            <input
              type="text"
              name="taxNumber"
              value={data.taxNumber || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Pin Number" required>
              <input
                type="text"
                name="taxClearanceNumber"
                value={data.taxClearanceNumber || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                required
              />
            </FormField>

            <FormField label="Pin Expiry Date" required>
              <input
                type="date"
                name="taxClearanceDate"
                value={data.taxClearanceDate || ""}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                required
              />
            </FormField>
          </div>

          <FormField label="VAT Number">
            <input
              type="text"
              name="vatNumber"
              value={data.vatNumber || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
            />
          </FormField>

        </div>

        <div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="UIF Number">
              <input
                type="text"
                name="uifNumber"
                value={data.uifNumber || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              />
            </FormField>

            <FormField label="PAYE Number">
              <input
                type="text"
                name="payeNumber"
                value={data.payeNumber || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="B-BBEE Level" required>
              <select
                name="bbbeeLevel"
                value={data.bbbeeLevel || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                required
              >
                <option value="">Select Level</option>
                {bbbeeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Certificate Renewal Date"
              required={data.bbbeeLevel && data.bbbeeLevel !== "none" && data.bbbeeLevel !== "exempt"}
            >
              <input
                type="date"
                name="bbbeeCertRenewalDate"
                value={data.bbbeeCertRenewalDate || ""}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                required={data.bbbeeLevel && data.bbbeeLevel !== "none" && data.bbbeeLevel !== "exempt"}
              />
            </FormField>
          </div>

          <FormField label="CIPC Returns Status" required>
            <select
              name="cipcStatus"
              value={data.cipcStatus || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              required
            >
              <option value="">Select Status</option>
              {cipcStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="POPIA Compliance" required>
            <div className="flex space-x-4 mt-1">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="popiaCompliance"
                  value="yes"
                  checked={data.popiaCompliance === "yes"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span>Yes</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="popiaCompliance"
                  value="no"
                  checked={data.popiaCompliance === "no"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span>No</span>
              </label>
            </div>
          </FormField>

          <FormField label="AML/KYC Policy in Place" required>
            <div className="flex space-x-4 mt-1">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="amlKycPolicy"
                  value="yes"
                  checked={data.amlKycPolicy === "yes"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span>Yes</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="amlKycPolicy"
                  value="no"
                  checked={data.amlKycPolicy === "no"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span>No</span>
              </label>
            </div>
          </FormField>

          <FormField label="COIDA No. (if applicable)">
            <input
              type="number"
              name="coidaNumber"
              value={data.coidaNumber || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
            />
          </FormField>

          <FormField label="Industry Accreditations (optional)">
            <textarea
              name="industryAccreditations"
              value={data.industryAccreditations || ""}
              onChange={handleChange}
              rows={2}
              placeholder="List any industry-specific accreditations"
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
            ></textarea>
          </FormField>
        </div>
      </div>

      <div className="mt-8 border-t border-brown-200 pt-6">
        {/* <h3 className="text-lg font-semibold text-brown-700 mb-4">Required Documents</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileUpload
            label="Tax Clearance Certificate"
            accept=".pdf,.jpg,.jpeg,.png"
            required
            onChange={(files) => handleFileChange("taxClearanceCert", files)}
            value={data.taxClearanceCert || []}
          />

          <FileUpload
            label="B-BBEE Certificate"
            accept=".pdf,.jpg,.jpeg,.png"
            required={data.bbbeeLevel && data.bbbeeLevel !== "none" && data.bbbeeLevel !== "exempt"}
            onChange={(files) => handleFileChange("bbbeeCert", files)}
            value={data.bbbeeCert || []}
          />

     
          <FileUpload
            label="Industry Accreditations (optional)"
            accept=".pdf,.jpg,.jpeg,.png"
            multiple
            onChange={(files) => handleFileChange("industryAccreditationDocs", files)}
            value={data.industryAccreditationDocs || []}
          />
        </div> */}
      </div>

      <div className="mt-8 flex justify-end"></div>
    </div>
  )
}