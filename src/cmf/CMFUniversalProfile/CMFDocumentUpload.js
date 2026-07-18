import { useState, useRef } from "react"
import { Upload, X, FileText, CheckCircle, AlertCircle } from "lucide-react"

const CMF_DOCUMENT_CATEGORIES = {
  required: {
    label: "Required Documents",
    color: "#dc2626",
    documents: [
      { id: "cipcRegistration", label: "CIPC Registration Document", description: "Certificate of Incorporation or equivalent" },
      { id: "taxCompliancePin", label: "Tax Compliance PIN", description: "SARS Tax Compliance Certificate or PIN" },
      { id: "companyProfile", label: "Company Profile (PDF)", description: "Formal company overview document" },
      { id: "logo", label: "Company Logo", description: "High-resolution logo file (PNG, SVG or vector preferred)" },
      { id: "proofOfAddress", label: "Proof of Address", description: "Not older than 3 months" },
    ],
  },
  compliance: {
    label: "Compliance & Credentials",
    color: "#d97706",
    documents: [
      { id: "vatCertificate", label: "VAT Certificate", description: "If VAT registered" },
      { id: "bbbeeCertificate", label: "B-BBEE Certificate", description: "Current B-BBEE verification certificate" },
      { id: "fspLicence", label: "FSP Licence / FSP Partner Details", description: "Financial Services Provider licence or partnership agreement (if applicable)" },
      { id: "professionalIndemnityInsurance", label: "Professional Indemnity Insurance", description: "Current PI insurance schedule (if applicable)" },
      { id: "isoCertifications", label: "ISO Certifications", description: "Relevant ISO certification documents (if applicable)" },
      { id: "industryAccreditations", label: "Industry Accreditations", description: "Other relevant professional registrations or accreditations" },
    ],
  },
  capability: {
    label: "Marketing & Capability",
    color: "#059669",
    documents: [
      { id: "capabilityStatement", label: "Capability Statement", description: "Summary of your firm's core capabilities and track record" },
      { id: "caseStudies", label: "Case Studies", description: "Examples of past transactions or engagements" },
      { id: "clientReferences", label: "Client References", description: "Contact details or letters from key clients" },
      { id: "brochure", label: "Brochure", description: "Marketing or product brochure" },
      { id: "serviceCatalogue", label: "Service Catalogue", description: "Detailed listing of services offered" },
    ],
  },
}

const ACCEPTED_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.svg,.gif,.webp"
const MAX_FILE_SIZE_MB = 10

function FileUploadField({ docId, label, description, isRequired, files = [], onFilesChange }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState("")

  const handleFiles = (newFiles) => {
    setError("")
    const valid = []
    for (const f of newFiles) {
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`${f.name} exceeds ${MAX_FILE_SIZE_MB}MB limit.`)
        continue
      }
      valid.push(f)
    }
    if (valid.length > 0) onFilesChange([...files, ...valid])
  }

  const removeFile = (idx) => {
    const updated = files.filter((_, i) => i !== idx)
    onFilesChange(updated)
  }

  return (
    <div style={{ margin: 0, padding: "1rem", border: "1px solid #e5e7eb", borderRadius: "8px", backgroundColor: "#fafafa", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "220px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.5rem", width: "100%" }}>
        <div>
          <span style={{ fontWeight: "600", fontSize: "0.9rem", color: "#1f2937" }}>{label}</span>
          {isRequired && <span style={{ marginLeft: "0.4rem", color: "#dc2626", fontSize: "0.8rem", fontWeight: "700" }}>*Required</span>}
          {!isRequired && <span style={{ marginLeft: "0.4rem", color: "#6b7280", fontSize: "0.8rem" }}>Optional</span>}
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#6b7280" }}>{description}</p>
        </div>
        {files.length > 0 && <CheckCircle size={18} style={{ color: "#059669", flexShrink: 0 }} />}
      </div>

      <div
        style={{
          border: `2px dashed ${dragOver ? "#6366f1" : "#d1d5db"}`,
          borderRadius: "6px", padding: "0.75rem", textAlign: "center",
          cursor: "pointer", transition: "all 0.2s", backgroundColor: dragOver ? "#eef2ff" : "white"
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(Array.from(e.dataTransfer.files)) }}
      >
        <Upload size={16} style={{ color: "#9ca3af", marginBottom: "0.25rem" }} />
        <p style={{ margin: 0, fontSize: "0.8rem", color: "#6b7280" }}>
          Drop files here or <span style={{ color: "#6366f1", textDecoration: "underline" }}>browse</span>
        </p>
        <input ref={inputRef} type="file" multiple accept={ACCEPTED_TYPES} style={{ display: "none" }}
          onChange={(e) => handleFiles(Array.from(e.target.files))} />
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.4rem", color: "#dc2626", fontSize: "0.8rem" }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {files.length > 0 && (
        <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          {files.map((file, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.6rem", backgroundColor: "#f0fdf4", borderRadius: "4px", fontSize: "0.8rem" }}>
              <FileText size={14} style={{ color: "#059669", flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#1f2937" }}>
                {typeof file === "string" ? file.split("/").pop() : file.name}
              </span>
              <button type="button" onClick={() => removeFile(idx)} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: "#dc2626" }}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CMFDocumentUpload({ data = {}, updateData }) {
  const handleFilesChange = (docId, files) => {
    updateData({ ...data, [docId]: files })
  }

  return (
    <div style={{ width: "100%" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1f2937", marginBottom: "0.5rem" }}>
          Document Upload
        </h2>
        <p style={{ color: "#4b5563", fontSize: "0.95rem", lineHeight: "1.6" }}>
          Upload the required and optional documents that support your Capital and Market Facilitator profile.
          Required documents must be submitted before you can finalise your profile.
        </p>
      </div>

      {Object.entries(CMF_DOCUMENT_CATEGORIES).map(([catKey, category]) => (
        <div key={catKey} style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <div style={{ width: "4px", height: "28px", backgroundColor: category.color, borderRadius: "2px" }} />
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#1f2937" }}>
              {category.label}
            </h3>
            {catKey === "required" && (
              <span style={{ fontSize: "0.75rem", backgroundColor: "#fee2e2", color: "#dc2626", padding: "2px 8px", borderRadius: "9999px", fontWeight: "600" }}>
                All required
              </span>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
            {category.documents.map((doc) => (
              <FileUploadField
                key={doc.id}
                docId={doc.id}
                label={doc.label}
                description={doc.description}
                isRequired={catKey === "required"}
                files={data[doc.id] || []}
                onFilesChange={(files) => handleFilesChange(doc.id, files)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
