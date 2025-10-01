"use client"

import FormField from "./FormField"
import FileUpload from "./FileUpload"
import "./AdvisoryApplication.css"
export const renderDocumentUploads = (data, updateFormData) => {
  const handleFileChange = (name, files) => {
    updateFormData("documentUploads", { [name]: files })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    updateFormData("documentUploads", { [name]: value })
  }

  return (
    <>
      <h2>Uploads (Conditional)</h2>

      <div className="grid-container">
        <div>
          <FormField label="Business Plan (Required if revenue < R1M)" >
            <FileUpload
              label="Upload Business Plan"
              accept=".pdf,.doc,.docx"
              onChange={(files) => handleFileChange("businessPlan", files)}
              value={data.businessPlan || []}
            />
          </FormField>
        </div>

        <div>
          <FormField label="Latest Financials (Optional but boosts matching)">
            <FileUpload
              label="Upload Latest Financials"
              accept=".pdf,.xlsx,.xls,.doc,.docx"
              onChange={(files) => handleFileChange("latestFinancials", files)}
              value={data.latestFinancials || []}
            />
          </FormField>
        </div>
      </div>

      <div className="form-field">
        <FormField label="Current Board List (If any – else 'None')">
          <textarea
            name="currentBoardList"
            value={data.currentBoardList || ""}
            onChange={handleChange}
            className="form-textarea"
            placeholder="List your current board members and their roles, or enter 'None' if no board exists"
            rows={4}
          />
        </FormField>
      </div>
    </>
  )
}
