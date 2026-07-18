import { FileText, Upload, Folder } from "lucide-react"

export default function CMFDocuments() {
  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <Folder size={32} style={{ color: "#6366f1" }} />
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "700", color: "#1f2937" }}>My Documents</h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>Capital and Market Facilitator — Document Library</p>
        </div>
      </div>

      <div style={{ backgroundColor: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "12px", padding: "1.5rem", marginBottom: "2rem", display: "flex", alignItems: "flex-start", gap: "1rem" }}>
        <FileText size={24} style={{ color: "#0ea5e9", flexShrink: 0 }} />
        <div>
          <p style={{ margin: 0, fontWeight: "600", color: "#0c4a6e" }}>Document management coming soon</p>
          <p style={{ margin: "0.4rem 0 0", color: "#0369a1", fontSize: "0.9rem" }}>
            You can upload and manage your profile documents directly from your profile. Additional document management features will be available here shortly.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
        {[
          { icon: "📋", label: "CIPC Registration", category: "Required" },
          { icon: "🧾", label: "Tax Compliance PIN", category: "Required" },
          { icon: "🏢", label: "Company Profile", category: "Required" },
          { icon: "🖼️", label: "Company Logo", category: "Required" },
          { icon: "📬", label: "Proof of Address", category: "Required" },
          { icon: "📄", label: "Capability Statement", category: "Marketing" },
          { icon: "📊", label: "Case Studies", category: "Marketing" },
          { icon: "📑", label: "Service Catalogue", category: "Marketing" },
        ].map((item, idx) => (
          <div key={idx} style={{ border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.25rem", backgroundColor: "white", display: "flex", alignItems: "center", gap: "0.9rem" }}>
            <span style={{ fontSize: "1.75rem" }}>{item.icon}</span>
            <div>
              <p style={{ margin: 0, fontWeight: "600", color: "#1f2937", fontSize: "0.9rem" }}>{item.label}</p>
              <span style={{ fontSize: "0.75rem", color: item.category === "Required" ? "#dc2626" : "#059669", fontWeight: "600" }}>{item.category}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
