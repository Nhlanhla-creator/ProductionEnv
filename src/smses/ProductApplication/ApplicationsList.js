"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from "firebase/firestore"
import { db, auth } from "../../firebaseConfig"
import { Eye, Edit, FileText, Package, Calendar, Plus, RefreshCw, Trash2, CheckCircle, Clock, AlertCircle } from "lucide-react"

const ApplicationsList = ({ onViewSummary, onEditApplication, onCreateNew, embedded = false }) => {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchApplications(user.uid)
      } else {
        setLoading(false)
        setError("Please log in")
      }
    })
    return () => unsubscribe()
  }, [])

  const fetchApplications = async (userId) => {
    try {
      setLoading(true)
      setError(null)

      try {
        const q = query(
          collection(db, "productApplications"),
          where("userId", "==", userId),
          orderBy("lastUpdated", "desc")
        )
        
        const snapshot = await getDocs(q)
        const apps = []
        snapshot.forEach((doc) => {
          apps.push(formatAppData(doc.id, doc.data()))
        })
        
        setApplications(apps)
      } catch (indexErr) {
        const q = query(
          collection(db, "productApplications"),
          where("userId", "==", userId)
        )
        
        const snapshot = await getDocs(q)
        const apps = []
        snapshot.forEach((doc) => {
          apps.push(formatAppData(doc.id, doc.data()))
        })
        
        apps.sort((a, b) => (b.lastUpdatedTimestamp || 0) - (a.lastUpdatedTimestamp || 0))
        setApplications(apps)
      }
    } catch (err) {
      console.error("Error:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatAppData = (docId, data) => {
    let lastUpdatedFormatted = 'N/A'
    let lastUpdatedTimestamp = 0
    
    if (data.lastUpdated) {
      try {
        const date = data.lastUpdated.toDate()
        lastUpdatedTimestamp = date.getTime()
        lastUpdatedFormatted = date.toLocaleDateString('en-ZA', {
          year: 'numeric', month: 'short', day: 'numeric'
        })
      } catch (e) {
        try {
          const date = new Date(data.lastUpdated)
          lastUpdatedTimestamp = date.getTime()
          lastUpdatedFormatted = date.toLocaleDateString('en-ZA', {
            year: 'numeric', month: 'short', day: 'numeric'
          })
        } catch (e2) {}
      }
    }
    
    // Get data from various possible structures
    const matchingPrefs = data.matchingPreferences || {}
    const requestOverview = data.requestOverview || {}
    
    const categories = requestOverview.categories || data.categories || []
    const primaryCategory = categories[0] || 'Uncategorized'
    const purpose = requestOverview.purpose || data.purpose || ''
    
    // Check completion
    const completedSections = data.completedSections || {}
    const sectionsArray = Object.values(completedSections)
    const isComplete = sectionsArray.length > 0 && sectionsArray.every(v => v === true)
    
    // Format budget
    const minBudget = matchingPrefs.minBudget || ''
    const maxBudget = matchingPrefs.maxBudget || ''
    let budgetDisplay = 'Not specified'
    
    if (minBudget || maxBudget) {
      const fmt = (v) => {
        if (!v) return null
        const clean = v.toString().replace(/[^\d]/g, '')
        const n = parseInt(clean)
        if (isNaN(n)) return null
        if (n >= 1000000) return `R ${(n/1000000).toFixed(1)}M`
        if (n >= 1000) return `R ${(n/1000).toFixed(0)}K`
        return `R ${n.toLocaleString()}`
      }
      
      const minFmt = fmt(minBudget)
      const maxFmt = fmt(maxBudget)
      
      if (minFmt && maxFmt) {
        budgetDisplay = `${minFmt} - ${maxFmt}`
      } else if (minFmt) {
        budgetDisplay = `From ${minFmt}`
      } else if (maxFmt) {
        budgetDisplay = `Up to ${maxFmt}`
      }
    }
    
    // Generate name
    let name = 'Product Request'
    if (purpose && purpose.trim()) {
      const words = purpose.trim().split(/\s+/).slice(0, 3).join(' ')
      name = words || 'Product Request'
    } else if (primaryCategory !== 'Uncategorized') {
      name = `${primaryCategory} Request`
    }
    
    return {
      id: docId,
      name,
      primaryCategory,
      categories,
      purposePreview: purpose.slice(0, 50) + (purpose.length > 50 ? '...' : ''),
      budgetDisplay,
      lastUpdatedFormatted,
      lastUpdatedTimestamp,
      isComplete,
      status: data.status || (isComplete ? 'complete' : 'draft'),
    }
  }

  const handleDelete = async (appId) => {
    try {
      setDeleting(true)
      await deleteDoc(doc(db, "productApplications", appId))
      setApplications(prev => prev.filter(app => app.id !== appId))
      setShowDeleteConfirm(null)
    } catch (err) {
      console.error("Error deleting:", err)
      alert("Failed to delete application. Please try again.")
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = (app) => {
    if (app.status === 'submitted') {
      return { label: 'Submitted', color: '#10b981', bgColor: '#d1fae5', icon: CheckCircle }
    }
    if (app.isComplete) {
      return { label: 'Ready', color: '#f59e0b', bgColor: '#fef3c7', icon: AlertCircle }
    }
    return { label: 'Draft', color: '#6b7280', bgColor: '#f3f4f6', icon: Clock }
  }

  // Loading State
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #faf7f2 0%, #f5f0e1 50%, #f0e6d9 100%)'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid rgba(166, 124, 82, 0.1)',
          borderTopColor: '#a67c52',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ marginTop: '20px', color: '#7d5a50', fontSize: '16px' }}>Loading your applications...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // Error State
  if (error && applications.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '40px',
        background: 'linear-gradient(135deg, #faf7f2 0%, #f5f0e1 50%, #f0e6d9 100%)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
        <h3 style={{ color: '#4a352f', marginBottom: '12px' }}>Error Loading Applications</h3>
        <p style={{ color: '#dc2626', marginBottom: '20px' }}>{error}</p>
        <button 
          onClick={() => auth.currentUser && fetchApplications(auth.currentUser.uid)} 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #a67c52, #7d5a50)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(166, 124, 82, 0.3)',
          }}
        >
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .table-row:hover {
          background: rgba(166, 124, 82, 0.04) !important;
        }
        .action-btn {
          transition: all 0.2s ease;
        }
        .action-btn:hover {
          transform: scale(1.05);
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        width: "100%",
        background: "linear-gradient(135deg, #faf7f2 0%, #f5f0e1 50%, #f0e6d9 100%)",
        padding: embedded ? "20px" : "24px",
        boxSizing: "border-box",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
            backdropFilter: "blur(20px)",
            borderRadius: "16px",
            padding: "20px 24px",
            marginBottom: "24px",
            boxShadow: "0 20px 40px rgba(74, 53, 47, 0.1)",
            border: "1px solid rgba(200, 182, 166, 0.3)",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute",
              top: "-50%",
              right: "-20%",
              width: "400px",
              height: "400px",
              background: "radial-gradient(circle, rgba(166, 124, 82, 0.1) 0%, transparent 70%)",
              borderRadius: "50%",
              pointerEvents: "none",
            }} />
            
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "relative",
              zIndex: 2,
              gap: "16px",
              flexWrap: "wrap",
            }}>
              <div>
                <h1 style={{
                  background: "linear-gradient(135deg, #4a352f, #7d5a50)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontSize: "clamp(24px, 4vw, 36px)",
                  fontWeight: "800",
                  margin: "0 0 8px 0",
                  letterSpacing: "-0.02em",
                }}>
                  My Applications
                </h1>
                <p style={{
                  color: "#7d5a50",
                  fontSize: "clamp(14px, 2vw, 16px)",
                  margin: 0,
                  fontWeight: "500",
                }}>
                  Product & Service Requests • {applications.length} {applications.length === 1 ? 'Application' : 'Applications'}
                </p>
              </div>
              
              <button
                onClick={() => onCreateNew()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  background: "linear-gradient(135deg, #a67c52, #7d5a50)",
                  color: "#faf7f2",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 16px rgba(166, 124, 82, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)"
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(166, 124, 82, 0.4)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(166, 124, 82, 0.3)"
                }}
              >
                <Plus size={18} /> Create New Application
              </button>
            </div>
          </div>

          {/* Empty State */}
          {applications.length === 0 ? (
            <div style={{
              background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
              backdropFilter: "blur(20px)",
              borderRadius: "16px",
              padding: "80px 40px",
              textAlign: "center",
              border: "1px solid rgba(200, 182, 166, 0.3)",
              boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
            }}>
              <FileText size={48} style={{ color: '#c8b6a6', marginBottom: '16px' }} />
              <h3 style={{ color: '#4a352f', marginBottom: '8px', fontSize: '20px', fontWeight: '700' }}>No Applications Yet</h3>
              <p style={{ color: '#6b7280', marginBottom: '24px' }}>Create your first product/service request application to get started.</p>
              <button
                onClick={() => onCreateNew()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 28px",
                  background: "linear-gradient(135deg, #a67c52, #7d5a50)",
                  color: "#faf7f2",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(166, 124, 82, 0.3)",
                }}
              >
                <Plus size={18} /> Create Application
              </button>
            </div>
          ) : (
            /* Table */
            <div style={{
              background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
              backdropFilter: "blur(20px)",
              borderRadius: "16px",
              overflow: "auto",
              border: "1px solid rgba(200, 182, 166, 0.3)",
              boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
              animation: "fadeIn 0.4s ease-out",
            }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "1000px",
              }}>
                <thead>
                  <tr style={{
                    background: "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                    borderBottom: "2px solid rgba(166, 124, 82, 0.2)",
                  }}>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "13px", fontWeight: "700", color: "#4a352f", textTransform: "uppercase", letterSpacing: "0.5px" }}>Application</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "13px", fontWeight: "700", color: "#4a352f", textTransform: "uppercase", letterSpacing: "0.5px" }}>Category</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "13px", fontWeight: "700", color: "#4a352f", textTransform: "uppercase", letterSpacing: "0.5px" }}>Budget</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "13px", fontWeight: "700", color: "#4a352f", textTransform: "uppercase", letterSpacing: "0.5px" }}>Last Updated</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "13px", fontWeight: "700", color: "#4a352f", textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</th>
                    <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "13px", fontWeight: "700", color: "#4a352f", textTransform: "uppercase", letterSpacing: "0.5px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => {
                    const statusBadge = getStatusBadge(app)
                    const StatusIcon = statusBadge.icon
                    
                    return (
                      <tr key={app.id} className="table-row" style={{
                        borderBottom: "1px solid rgba(200, 182, 166, 0.15)",
                      }}>
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                            <div style={{
                              width: "36px",
                              height: "36px",
                              background: "rgba(166, 124, 82, 0.1)",
                              borderRadius: "10px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}>
                              <Package size={18} color="#a67c52" />
                            </div>
                            <div>
                              <div style={{ fontWeight: "600", color: "#4a352f", marginBottom: "4px", fontSize: "15px" }}>
                                {app.name}
                              </div>
                              <div style={{ fontSize: "12px", color: "#6b7280", maxWidth: "250px" }}>
                                {app.purposePreview}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <span style={{
                            display: "inline-block",
                            padding: "4px 12px",
                            background: "rgba(166, 124, 82, 0.1)",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "500",
                            color: "#7d5a50",
                          }}>
                            {app.primaryCategory}
                          </span>
                        </td>
                        <td style={{ padding: "16px 20px", fontWeight: "500", color: "#4a352f" }}>
                          {app.budgetDisplay}
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#6b7280", fontSize: "13px" }}>
                            <Calendar size={14} />
                            {app.lastUpdatedFormatted}
                          </div>
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 12px",
                            background: statusBadge.bgColor,
                            color: statusBadge.color,
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "600",
                          }}>
                            <StatusIcon size={12} />
                            {statusBadge.label}
                          </span>
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                            <button
                              className="action-btn"
                              onClick={() => onViewSummary(app.id, app)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "8px 14px",
                                background: "rgba(250, 247, 242, 0.8)",
                                color: "#4a352f",
                                border: "1px solid rgba(200, 182, 166, 0.3)",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: "500",
                                cursor: "pointer",
                              }}
                            >
                              <Eye size={14} /> View
                            </button>
                            <button
                              className="action-btn"
                              onClick={() => onEditApplication(app.id)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "8px 14px",
                                background: "#fef3c7",
                                color: "#92400e",
                                border: "1px solid #fde68a",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: "500",
                                cursor: "pointer",
                              }}
                            >
                              <Edit size={14} /> Edit
                            </button>
                            <button
                              className="action-btn"
                              onClick={() => setShowDeleteConfirm(app.id)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "8px",
                                background: "rgba(250, 247, 242, 0.8)",
                                color: "#4a352f",
                                border: "1px solid rgba(200, 182, 166, 0.3)",
                                borderRadius: "8px",
                                fontSize: "12px",
                                cursor: "pointer",
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
          backdropFilter: 'blur(4px)',
        }} onClick={() => setShowDeleteConfirm(null)}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(250, 247, 242, 0.98), rgba(245, 240, 225, 0.98))',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 40px 80px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(200, 182, 166, 0.3)',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 20px',
              background: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Trash2 size={30} color="#dc2626" />
            </div>
            <h3 style={{ textAlign: 'center', fontSize: '20px', fontWeight: '700', color: '#4a352f', marginBottom: '12px' }}>
              Delete Application?
            </h3>
            <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '24px', lineHeight: '1.6' }}>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f3f4f6',
                  color: '#4a352f',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ApplicationsList
