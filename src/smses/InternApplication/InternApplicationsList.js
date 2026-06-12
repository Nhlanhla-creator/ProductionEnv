"use client"

import { Fragment, useState, useEffect } from "react"
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from "firebase/firestore"
import { db, auth } from "../../firebaseConfig"
import { Eye, FileText, Brain, Calendar, Plus, RefreshCw, Trash2, CheckCircle, Clock, AlertCircle, Zap, Hash, ChevronDown, ChevronUp, UserCheck } from "lucide-react"
import InternMatchesTable from "../MyInternMatch/InternMatchesTable"

/**
 * InternApplicationsList Component
 * 
 * Displays all user's internship applications in a data table with:
 * - Application details (name, purpose, match count)
 * - Status indicators (Draft, Ready, Submitted)
 * - Actions: View (summary), Edit, View Matches, Delete
 * 
 * Props:
 * - onViewSummary: (applicationId, applicationData) => void
 * - onEditApplication: (applicationId) => void
 * - onCreateNew: () => void
 * - embedded: boolean
 */
const InternApplicationsList = ({ onViewSummary, onEditApplication, onCreateNew, embedded = false, refreshTrigger }) => {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [expandedAppId, setExpandedAppId] = useState(null)

  const [matchCounts, setMatchCounts] = useState({})

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchApplications(user.uid)
      else { setLoading(false); setError("Please log in") }
    })
    return () => unsubscribe()
  }, [])

  // Re-fetch when refreshTrigger changes (e.g., after submitting an application)
  useEffect(() => {
    const user = auth.currentUser
    if (user) fetchApplications(user.uid)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger])

  const fetchMatchCounts = async (userId, appIds) => {
    try {
      const q = query(
        collection(db, "internMatchResults"),
        where("smeId", "==", userId),
        where("status", "==", "matched")
      )
      const snapshot = await getDocs(q)
      const counts = {}
      snapshot.forEach(d => {
        const appId = d.data().applicationId
        if (appId) counts[appId] = (counts[appId] || 0) + 1
      })
      setMatchCounts(counts)
    } catch (err) {
      console.error("Failed to fetch match counts:", err)
    }
  }

  const fetchApplications = async (userId) => {
    try {
      setLoading(true); setError(null)
      let apps = []
      try {
        const q = query(collection(db, "internApplicationsV2"), where("userId", "==", userId), orderBy("lastUpdated", "desc"))
        const snapshot = await getDocs(q)
        snapshot.forEach((d) => apps.push(formatAppData(d.id, d.data())))
      } catch {
        const q = query(collection(db, "internApplicationsV2"), where("userId", "==", userId))
        const snapshot = await getDocs(q)
        snapshot.forEach((d) => apps.push(formatAppData(d.id, d.data())))
        apps.sort((a, b) => (b.lastUpdatedTimestamp || 0) - (a.lastUpdatedTimestamp || 0))
      }
      setApplications(apps)
      await fetchMatchCounts(userId, apps.map(a => a.id))
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const formatAppData = (docId, data) => {
    let lastUpdatedFormatted = "N/A", lastUpdatedTimestamp = 0
    if (data.lastUpdated) {
      try {
        const date = data.lastUpdated.toDate ? data.lastUpdated.toDate() : new Date(data.lastUpdated)
        lastUpdatedTimestamp = date.getTime()
        lastUpdatedFormatted = date.toLocaleDateString("en-ZA", { year:"numeric", month:"short", day:"numeric" })
      } catch {}
    }
    // Flattened structure - all fields are now at top level
    const completedSections = data.completedSections || {}
    const sectionsArr = Object.values(completedSections)
    const isComplete = sectionsArr.length > 0 && sectionsArr.every((v) => v === true)
    
    // Use internshipTitle for the name, default to "Internship Application"
    let name = "Internship Application"
    const jobOverview = data.jobOverview || {}
    if (jobOverview.internshipTitle?.trim()) name = jobOverview.internshipTitle.trim()
    
    return { 
      id: docId, 
      appId: docId?.slice(-8) || docId, 
      name: name, 
      purpose: data.briefDescription || (jobOverview.briefDescription || ""),
      lastUpdatedFormatted, 
      lastUpdatedTimestamp, 
      isComplete, 
      status: data.status || (isComplete ? "complete" : "draft") 
    }
  }

  const handleDelete = async (appId) => {
    try { setDeleting(true); await deleteDoc(doc(db,"internApplicationsV2",appId)); setApplications((p) => p.filter((a) => a.id !== appId)); setShowDeleteConfirm(null) }
    catch { alert("Failed to delete. Please try again.") }
    finally { setDeleting(false) }
  }

  const getStatusBadge = (app) => {
    if (app.status === "submitted") return { label:"Submitted", color:"#10b981", bg:"#d1fae5", Icon:CheckCircle }
    if (app.isComplete)             return { label:"Ready",     color:"#f59e0b", bg:"#fef3c7", Icon:AlertCircle }
    return                                 { label:"Draft",     color:"#6b7280", bg:"#f3f4f6", Icon:Clock }
  }

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh" }}>
      <div style={{ width:44, height:44, border:"3px solid rgba(166,124,82,0.15)", borderTopColor:"#a67c52", borderRadius:"50%", animation:"al-spin 0.8s linear infinite" }} />
      <p style={{ marginTop:14, color:"#7d5a50", fontSize:15 }}>Loading your applications…</p>
      <style>{`@keyframes al-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (error && applications.length === 0) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", padding:40 }}>
      <div style={{ fontSize:44, marginBottom:16 }}>⚠️</div>
      <h3 style={{ color:"#4a352f", marginBottom:8 }}>Error Loading Applications</h3>
      <p style={{ color:"#dc2626", marginBottom:20 }}>{error}</p>
      <button onClick={() => auth.currentUser && fetchApplications(auth.currentUser.uid)}
        style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"10px 22px", background:"linear-gradient(135deg,#a67c52,#7d5a50)", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer" }}>
        <RefreshCw size={15} /> Retry
      </button>
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes al-fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes al-spin   { to{transform:rotate(360deg)} }

        .al-wrap {
          width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch;
          border-radius:14px; border:1px solid rgba(200,182,166,0.3);
          box-shadow:0 10px 26px rgba(74,53,47,0.08);
          background:linear-gradient(135deg,rgba(250,247,242,0.97),rgba(245,240,225,0.97));
          animation:al-fadein 0.35s ease-out;
        }

        .al-tbl { width:100%; min-width:860px; border-collapse:collapse; table-layout:fixed; }

        .al-expand-row > td { padding:0 !important; background:rgba(250,247,242,0.6); border-bottom:1px solid rgba(200,182,166,0.2); }
        .al-expand-wrap { padding:14px 18px 20px; animation:al-fadein 0.25s ease-out; }
        .al-expand-title { display:flex; align-items:center; gap:8px; margin-bottom:10px; font-size:12px; font-weight:700; color:#4a352f; text-transform:uppercase; letter-spacing:0.5px; }

        .al-appid { display:inline-flex; align-items:center; gap:5px; padding:3px 9px; background:linear-gradient(135deg,#5d4037,#4a332a); color:#FAF7F2; border-radius:999px; font-size:10.5px; font-weight:700; letter-spacing:0.5px; white-space:nowrap; font-family:'SF Mono','Monaco','Consolas',monospace; }

        .al-tbl col.c0 { width:9%;  }
        .al-tbl col.c1 { width:24%; }
        .al-tbl col.c2 { width:13%; }
        .al-tbl col.c3 { width:13%; }
        .al-tbl col.c4 { width:10%; }
        .al-tbl col.c5 { width:19%; }

        .al-tbl th {
          padding:13px 15px; text-align:left;
          font-size:11px; font-weight:700; color:#4a352f;
          text-transform:uppercase; letter-spacing:0.55px; white-space:nowrap;
          border-bottom:2px solid rgba(166,124,82,0.2);
          color: rgba(250,247,242,0.9);
        }
        .al-tbl th.r { text-align:center; }
        .al-tbl td { padding:12px 15px; vertical-align:middle; overflow:hidden; }
        .al-tbl tbody tr { border-bottom:1px solid rgba(200,182,166,0.15); transition:background 0.15s; }
        .al-tbl tbody tr:last-child { border-bottom:none; }
        .al-tbl tbody tr:hover { background:rgba(166,124,82,0.04); }

        .ell { display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }

        .al-acts { display:flex; gap:6px; justify-content:center; align-items:center; flex-wrap:nowrap; }
        .al-btn {
          display:inline-flex; align-items:center; gap:4px;
          padding:6px 11px; border-radius:7px;
          font-size:12px; font-weight:500; cursor:pointer;
          white-space:nowrap; flex-shrink:0;
          border:1px solid transparent;
          transition:transform 0.15s, box-shadow 0.15s; line-height:1;
        }
        .al-btn:hover { transform:translateY(-1px); box-shadow:0 3px 8px rgba(0,0,0,0.12); }
        .ab-view    { background:rgba(250,247,242,0.9); color:#4a352f; border-color:rgba(200,182,166,0.4); }
        .ab-matches { background:linear-gradient(135deg,#a67c52,#7d5a50); color:#faf7f2; box-shadow:0 2px 6px rgba(166,124,82,0.3); }
        .ab-matches:hover { box-shadow:0 4px 12px rgba(166,124,82,0.45) !important; }
        .ab-del     { background:rgba(250,247,242,0.9); color:#dc2626; border-color:rgba(220,38,38,0.2); padding:6px 8px; }
      `}</style>

      <div style={{ width:"100%", boxSizing:"border-box", padding: embedded ? "14px" : "22px", fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

        {/* HEADER */}
        <div style={{ background:"linear-gradient(135deg,rgba(250,247,242,0.97),rgba(245,240,225,0.97))", borderRadius:14, padding:"16px 20px", marginBottom:18, border:"1px solid rgba(200,182,166,0.3)", boxShadow:"0 8px 22px rgba(74,53,47,0.08)", display:"flex", justifyContent:"space-between", alignItems:"center", gap:14, flexWrap:"wrap" }}>
          <div>
            <h1 style={{ background:"linear-gradient(135deg,#4a352f,#7d5a50)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", fontSize:"clamp(20px,3vw,30px)", fontWeight:800, margin:"0 0 5px", letterSpacing:"-0.02em" }}>My Applications</h1>
            <p style={{ color:"#7d5a50", fontSize:13, margin:0, fontWeight:500 }}>
              Internship Applications &bull; {applications.length} {applications.length === 1 ? "Application" : "Applications"}
            </p>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <button onClick={onCreateNew} style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 20px", background:"linear-gradient(135deg,#a67c52,#7d5a50)", color:"#faf7f2", border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", boxShadow:"0 4px 14px rgba(166,124,82,0.3)", transition:"all 0.22s" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 7px 20px rgba(166,124,82,0.4)" }}
              onMouseLeave={(e) => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="0 4px 14px rgba(166,124,82,0.3)" }}
            >
              <Plus size={16} /> Create New Internship
            </button>
            {/* <button
              onClick={async () => {
                if (!window.confirm("⚠️ Clear ALL match results? This cannot be undone.")) return
                try {
                  const res = await fetch("http://localhost:8000/api/interns/clear-matches", { method: "DELETE" })
                  const data = await res.json()
                  alert(`Cleared ${data.deletedCount || 0} match result(s)`)
                  const user = auth.currentUser
                  if (user) fetchApplications(user.uid)
                } catch (err) {
                  alert("Failed to clear: " + err.message)
                }
              }}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", background:"#dc2626", color:"#fff", border:"none", borderRadius:8, fontSize:11, fontWeight:600, cursor:"pointer", opacity:0.85 }}
              title="TEMP: Clear all match results"
            >
              🗑 Clear Matches
            </button> */}
          </div>
        </div>

        {/* EMPTY */}
        {applications.length === 0 ? (
          <div style={{ background:"linear-gradient(135deg,rgba(250,247,242,0.97),rgba(245,240,225,0.97))", borderRadius:14, padding:"64px 32px", textAlign:"center", border:"1px solid rgba(200,182,166,0.3)", boxShadow:"0 10px 24px rgba(74,53,47,0.07)" }}>
            <FileText size={42} style={{ color:"#c8b6a6", margin:"0 auto 12px" }} />
            <h3 style={{ color:"#4a352f", marginBottom:6, fontSize:18, fontWeight:700 }}>No Applications Yet</h3>
            <p style={{ color:"#6b7280", marginBottom:20 }}>Create your first internship application to get started.</p>
            <button onClick={onCreateNew} style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"10px 24px", background:"linear-gradient(135deg,#a67c52,#7d5a50)", color:"#faf7f2", border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", boxShadow:"0 4px 14px rgba(166,124,82,0.3)" }}>
              <Plus size={16} /> Create Application
            </button>
          </div>
        ) : (
          <div className="al-wrap">
            <table className="al-tbl">
              <colgroup>
                <col className="c0"/><col className="c1"/><col className="c2"/>
                <col className="c3"/><col className="c4"/><col className="c5"/>
              </colgroup>
              <thead>
                <tr>
                  <th>AppID</th>
                  <th>Application</th>
                  <th>Matches</th>
                  <th>Last Updated</th>
                  <th>Status</th>
                  <th className="r">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const { label, color, bg, Icon } = getStatusBadge(app)
                  const isExpanded = expandedAppId === app.id
                  
                  return (
                    <Fragment key={app.id}>
                      <tr>
                        {/* AppID */}
                        <td>
                          <span className="al-appid uppercase" title={`Full application id: ${app.id}`}>
                            <Hash size={10} /> {app.appId}
                          </span>
                        </td>

                        {/* Application */}
                        <td>
                          <div style={{ display:"flex", alignItems:"center", gap:9, minWidth:0 }}>
                            <div style={{ width:32, height:32, flexShrink:0, background:"rgba(166,124,82,0.1)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
                              <Brain size={15} color="#a67c52" />
                            </div>
                            <div style={{ minWidth:0, flex:1 }}>
                              <span className="ell" style={{ fontWeight:600, color:"#4a352f", fontSize:13, marginBottom:2 }} title={app.name}>{app.name}</span>
                              <span className="ell" style={{ fontSize:11, color:"#6b7280" }} title={app.purpose}>{app.purpose}</span>
                            </div>
                          </div>
                        </td>

                        {/* Matches */}
                        <td>
                          {matchCounts[app.id] > 0 ? (
                            <span className="ell" style={{ display:"inline-block", maxWidth:"100%", padding:"3px 9px", background:"rgba(166,124,82,0.1)", borderRadius:20, fontSize:11, fontWeight:500, color:"#7d5a50" }}>
                              {matchCounts[app.id]} {matchCounts[app.id] === 1 ? "match" : "matches"}
                            </span>
                          ) : (
                            <span style={{ fontSize:11, color:"#9ca3af" }}>—</span>
                          )}
                        </td>

                        {/* Last Updated */}
                        <td>
                          <div style={{ display:"flex", alignItems:"center", gap:5, color:"#6b7280", fontSize:11, whiteSpace:"nowrap" }}>
                            <Calendar size={12} style={{ flexShrink:0 }} /> {app.lastUpdatedFormatted}
                          </div>
                        </td>

                        {/* Status */}
                        <td>
                          <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 9px", background:bg, color, borderRadius:20, fontSize:11, fontWeight:600, whiteSpace:"nowrap" }}>
                            <Icon size={10} /> {label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="al-acts">
                            <button
                              className="al-btn ab-matches"
                              onClick={() => setExpandedAppId((prev) => (prev === app.id ? null : app.id))}
                              aria-expanded={isExpanded}
                              title={isExpanded ? "Hide matches" : "Show matches for this application"}
                            >
                              <UserCheck size={12} />
                              {matchCounts[app.id] > 0 ? ` (${matchCounts[app.id]})` : ""}
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                            <button className="al-btn ab-view" onClick={() => onEditApplication(app.id, app)} title="Edit application">
                              <Eye size={12} />
                            </button>
                            <button className="al-btn ab-del" onClick={() => setShowDeleteConfirm(app.id)} title="Delete">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="al-expand-row">
                          <td colSpan={6}>
                            <div className="al-expand-wrap">
                              <div className="al-expand-title">
                                <Brain size={13} color="#a67c52" />
                                <span>Intern Matches for</span>
                                <span className="al-appid"><Hash size={10} /> {app.appId}</span>
                              </div>
                              <InternMatchesTable 
                                applicationId={app.id} 
                                embedded={true} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DELETE MODAL */}
      {showDeleteConfirm && (
        <div style={{ position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, padding:20, backdropFilter:"blur(4px)" }}
          onClick={() => setShowDeleteConfirm(null)}>
          <div style={{ background:"linear-gradient(135deg,rgba(250,247,242,0.99),rgba(245,240,225,0.99))", borderRadius:16, padding:28, maxWidth:360, width:"100%", boxShadow:"0 28px 56px rgba(0,0,0,0.18)", border:"1px solid rgba(200,182,166,0.3)" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ width:52, height:52, margin:"0 auto 16px", background:"#fee2e2", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Trash2 size={26} color="#dc2626" />
            </div>
            <h3 style={{ textAlign:"center", fontSize:18, fontWeight:700, color:"#4a352f", marginBottom:8 }}>Delete Application?</h3>
            <p style={{ textAlign:"center", color:"#6b7280", marginBottom:20, lineHeight:1.6 }}>This action cannot be undone.</p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setShowDeleteConfirm(null)} style={{ flex:1, padding:10, background:"#f3f4f6", color:"#4a352f", border:"none", borderRadius:9, fontSize:14, fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <button onClick={() => handleDelete(showDeleteConfirm)} disabled={deleting} style={{ flex:1, padding:10, background:"#dc2626", color:"#fff", border:"none", borderRadius:9, fontSize:14, fontWeight:600, cursor:"pointer", opacity: deleting ? 0.7 : 1 }}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default InternApplicationsList