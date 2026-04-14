"use client"

import { useState, useEffect } from "react"
import {
  ChevronDown, ChevronUp, ChevronLeft, Edit,
  FileText, Package, Users, DollarSign, MapPin, Calendar,
} from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../../firebaseConfig"

const ApplicationSummary = ({ data: propData, onEdit, applicationId, onBack }) => {
  const [expandedSections, setExpandedSections] = useState({
    requestOverview: true,       // open first so user sees data immediately
    matchingPreferences: false,
  })
  const [loading, setLoading] = useState(true)
  const [applicationData, setApplicationData] = useState(null)
  const [editClicked, setEditClicked] = useState(false)

  useEffect(() => {
    // Always fetch the full document from Firestore when we have an ID.
    // Never rely on the lite preview object passed from the list — it only
    // has display fields (name, budgetDisplay, etc.) not the full form data.
    if (applicationId) {
      loadApplicationData(applicationId)
    } else if (propData) {
      setApplicationData(propData)
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [applicationId])

  const loadApplicationData = async (appId) => {
    try {
      setLoading(true)
      const docSnap = await getDoc(doc(db, "productApplications", appId))
      if (docSnap.exists()) setApplicationData(docSnap.data())
    } catch (err) {
      console.error("❌ Summary load error:", err)
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (key) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }))

  const formatArray  = (arr)   => (!arr || !arr.length ? "None specified" : arr.join(" • "))
  const formatFiles  = (files) => (!files || !files.length ? "None" : files.map((f) => (typeof f === "string" ? f : f.name)).join(", "))
  const formatBool   = (v)     => (v ? "✅ Confirmed" : "❌ Pending")
  const formatMoney  = (v) => {
    if (!v) return "R 0"
    const n = parseFloat(v.toString().replace(/R\s?/g, "").replace(/,/g, ""))
    if (isNaN(n)) return "R 0"
    return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 0 }).format(n)
  }

  // Guard against double-fire (icon child vs button parent)
  const handleEdit = () => {
    if (editClicked) return
    setEditClicked(true)
    onEdit?.()
    setTimeout(() => setEditClicked(false), 1500)
  }

  /* ── LOADING ── */
  if (loading) return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"400px", background:"linear-gradient(135deg,#faf7f2,#f5f0e1,#f0e6d9)" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:40, height:40, border:"3px solid rgba(166,124,82,0.1)", borderTopColor:"#a67c52", borderRadius:"50%", animation:"as-spin 0.8s linear infinite", margin:"0 auto 14px" }} />
        <p style={{ color:"#7d5a50" }}>Loading application summary…</p>
      </div>
      <style>{`@keyframes as-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  /* ── NO DATA ── */
  if (!applicationData) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"400px", background:"linear-gradient(135deg,#faf7f2,#f5f0e1,#f0e6d9)", padding:40, textAlign:"center" }}>
      <FileText size={48} style={{ color:"#c8b6a6", marginBottom:16 }} />
      <h3 style={{ color:"#4a352f", marginBottom:8 }}>No Application Data</h3>
      <p style={{ color:"#6b7280", marginBottom:20 }}>Unable to load application details.</p>
      {onBack && <button onClick={onBack} style={{ padding:"10px 20px", background:"#a67c52", color:"white", border:"none", borderRadius:8, cursor:"pointer" }}>Go Back</button>}
    </div>
  )

  /* ── HELPERS ── */
  const mp = applicationData?.matchingPreferences || {}
  const ro = applicationData?.requestOverview || {}

  const labelSt = { fontSize:11, color:"#7d5a50", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px" }
  const valueSt = { fontSize:14, color:"#4a352f", fontWeight:500, lineHeight:1.4 }

  const Field = ({ label, value, Icon }) => (
    <div
      style={{ background:"rgba(250,247,242,0.85)", borderRadius:12, padding:16, border:"1px solid rgba(200,182,166,0.2)", transition:"all 0.2s ease" }}
      onMouseEnter={(e) => { e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 4px 16px rgba(74,53,47,0.08)" }}
      onMouseLeave={(e) => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="none" }}
    >
      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
        {Icon && <Icon size={13} color="#a67c52" />}
        <span style={labelSt}>{label}</span>
      </div>
      <span style={valueSt}>{value}</span>
    </div>
  )

  const SectionHeader = ({ sectionKey, icon: Icon, title, activeColor }) => {
    const open = expandedSections[sectionKey]
    return (
      <div
        onClick={() => toggleSection(sectionKey)}
        style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"15px 20px", background: open ? activeColor : "linear-gradient(135deg,#e6d7c3,#c8b6a6)", cursor:"pointer", transition:"all 0.25s ease", userSelect:"none" }}
      >
        <div style={{ display:"flex", alignItems:"center", gap:11 }}>
          <Icon size={19} color={open ? "#faf7f2" : "#4a352f"} />
          <h2 style={{ margin:0, fontSize:"clamp(15px,2.5vw,19px)", fontWeight:700, color: open ? "#faf7f2" : "#4a352f" }}>{title}</h2>
        </div>
        {open ? <ChevronUp size={19} color="#faf7f2" /> : <ChevronDown size={19} color="#4a352f" />}
      </div>
    )
  }

  const sectionBox = {
    background:"linear-gradient(135deg,rgba(250,247,242,0.92),rgba(245,240,225,0.92))",
    backdropFilter:"blur(20px)", borderRadius:16, overflow:"hidden",
    border:"1px solid rgba(200,182,166,0.3)", boxShadow:"0 14px 30px rgba(74,53,47,0.08)",
  }

  return (
    <>
      <style>{`
        @keyframes as-spin   { to { transform:rotate(360deg); } }
        @keyframes as-fadein { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={{ fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", minHeight:"100vh", width:"100%", background:"linear-gradient(135deg,#faf7f2 0%,#f5f0e1 50%,#f0e6d9 100%)", boxSizing:"border-box", padding:"16px 20px" }}>

        {/* Back */}
        {onBack && (
          <button onClick={onBack}
            style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 0", marginBottom:14, background:"none", border:"none", color:"#a67c52", cursor:"pointer", fontSize:14, fontWeight:500 }}
            onMouseEnter={(e) => { e.currentTarget.style.color="#7d5a50" }}
            onMouseLeave={(e) => { e.currentTarget.style.color="#a67c52" }}
          >
            <ChevronLeft size={19} /> Back to Applications
          </button>
        )}

        {/* Header card */}
        <div style={{ background:"linear-gradient(135deg,rgba(250,247,242,0.92),rgba(245,240,225,0.92))", backdropFilter:"blur(20px)", borderRadius:16, padding:"18px 22px", marginBottom:20, boxShadow:"0 16px 36px rgba(74,53,47,0.1)", border:"1px solid rgba(200,182,166,0.3)", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:"-50%", right:"-20%", width:360, height:360, background:"radial-gradient(circle,rgba(166,124,82,0.1) 0%,transparent 70%)", borderRadius:"50%", pointerEvents:"none" }} />
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, flexWrap:"wrap", position:"relative", zIndex:2 }}>
            <div style={{ flex:1, minWidth:220 }}>
              <h1 style={{ background:"linear-gradient(135deg,#4a352f,#7d5a50)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", fontSize:"clamp(22px,4vw,34px)", fontWeight:800, margin:"0 0 6px", letterSpacing:"-0.02em" }}>
                Application Summary
              </h1>
              <p style={{ color:"#7d5a50", fontSize:"clamp(13px,2vw,16px)", margin:0, fontWeight:500 }}>
                Product &amp; Service Request Overview
              </p>
            </div>

            {/* Edit — uses currentTarget on hover so icon child doesn't cause double-fire */}
            <button
              onClick={handleEdit}
              disabled={editClicked}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 20px", background: editClicked ? "#c8b6a6" : "linear-gradient(135deg,#a67c52,#7d5a50)", color:"#faf7f2", border:"none", borderRadius:12, fontSize:14, fontWeight:600, cursor: editClicked ? "default" : "pointer", boxShadow:"0 4px 16px rgba(166,124,82,0.3)", transition:"all 0.25s ease", minWidth:140, justifyContent:"center", flexShrink:0, pointerEvents: editClicked ? "none" : "auto" }}
              onMouseEnter={(e) => { if (!editClicked) { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(166,124,82,0.4)" } }}
              onMouseLeave={(e) => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="0 4px 16px rgba(166,124,82,0.3)" }}
            >
              <Edit size={15} /> Edit Application
            </button>
          </div>
        </div>

        {/* ══ SECTIONS ══ */}
        <div style={{ display:"grid", gap:16 }}>

          {/* 1 ── REQUEST OVERVIEW (first) */}
          <div style={sectionBox}>
            <SectionHeader sectionKey="requestOverview" icon={FileText} title="Request Overview" activeColor="linear-gradient(135deg,#a67c52,#7d5a50)" />
            {expandedSections.requestOverview && (
              <div style={{ padding:20, background:"linear-gradient(135deg,rgba(250,247,242,0.8),rgba(240,230,217,0.6))", animation:"as-fadein 0.25s ease-out" }}>
                {/* Purpose */}
                <div style={{ background:"rgba(166,124,82,0.08)", borderRadius:12, padding:16, border:"1px solid rgba(166,124,82,0.18)", marginBottom:16 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <FileText size={15} color="#a67c52" />
                    <span style={labelSt}>Purpose of Request</span>
                  </div>
                  <p style={{ fontSize:14, color:"#4a352f", lineHeight:1.7, margin:0 }}>
                    {ro.purpose || "Not provided"}
                  </p>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:14 }}>
                  {[
                    { label:"Product/Service Categories", value:formatArray(ro.categories),   Icon:Package  },
                    { label:"Specific Subcategories",     value:formatArray(ro.subcategories), Icon:Package  },
                    { label:"Keywords / Specific Needs",  value:ro.keywords || "Not specified",Icon:FileText },
                    { label:"Scope of Work Files",        value:formatFiles(ro.scopeOfWorkFiles), Icon:FileText },
                  ].map((item, i) => <Field key={i} {...item} />)}
                </div>
              </div>
            )}
          </div>

          {/* 2 ── MATCHING PREFERENCES (second) */}
          <div style={sectionBox}>
            <SectionHeader sectionKey="matchingPreferences" icon={Users} title="Matching Preferences" activeColor="linear-gradient(135deg,#7d5a50,#4a352f)" />
            {expandedSections.matchingPreferences && (
              <div style={{ padding:20, background:"linear-gradient(135deg,rgba(250,247,242,0.8),rgba(240,230,217,0.6))", animation:"as-fadein 0.25s ease-out" }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:14 }}>
                  {[
                    { label:"Preferred B-BBEE Level",    value:mp.bbeeLevel || "Not specified", Icon:FileText },
                    { label:"Ownership Preferences",     value:formatArray(mp.ownershipPrefs),  Icon:Users    },
                    { label:"Sector Experience",         value:mp.sectorExperience || "Not specified", Icon:Package },
                    { label:"Type of Engagement",        value: mp.engagementType === "Other" ? mp.engagementTypeOther || "Other" : mp.engagementType || "Not specified", Icon:Users },
                    { label:"Preferred Delivery Mode",   value:formatArray(mp.deliveryModes),   Icon:Package  },
                    { label:"Start Date",                value:mp.startDate || "Not specified", Icon:Calendar },
                    { label:"End Date",                  value:mp.endDate   || "Not specified", Icon:Calendar },
                    { label:"Location",                  value:mp.location  || "Not specified", Icon:MapPin   },
                    { label:"Budget Range",              value:`${formatMoney(mp.minBudget)} – ${formatMoney(mp.maxBudget)}`, Icon:DollarSign },
                    { label:"Linked to ESD/CSR Program", value: mp.esdProgram === null ? "Not specified" : formatBool(mp.esdProgram), Icon:FileText },
                  ].map((item, i) => <Field key={i} {...item} />)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer CTA */}
        <div style={{ marginTop:24, textAlign:"center", background:"linear-gradient(135deg,rgba(250,247,242,0.92),rgba(245,240,225,0.92))", backdropFilter:"blur(20px)", borderRadius:16, padding:20, border:"1px solid rgba(200,182,166,0.3)", boxShadow:"0 14px 30px rgba(74,53,47,0.08)" }}>
          <button
            onClick={() => (window.location.href = "/supplier-matches")}
            style={{ padding:"13px 28px", background:"linear-gradient(135deg,#a67c52,#7d5a50)", color:"#faf7f2", border:"none", borderRadius:12, fontSize:"clamp(13px,2vw,15px)", fontWeight:600, cursor:"pointer", boxShadow:"0 6px 20px rgba(166,124,82,0.3)", minWidth:180, maxWidth:240, width:"100%", transition:"all 0.25s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 12px 32px rgba(166,124,82,0.4)" }}
            onMouseLeave={(e) => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="0 6px 20px rgba(166,124,82,0.3)" }}
          >
            🚀 View Supplier Matches
          </button>
        </div>

      </div>
    </>
  )
}

export default ApplicationSummary