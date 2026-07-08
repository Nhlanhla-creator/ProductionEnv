"use client"

import { useState, useEffect, useMemo } from "react"
import { collection, query, where, getDocs, orderBy, updateDoc, addDoc, doc, getDoc, serverTimestamp } from "firebase/firestore"
import { db, auth } from "../../firebaseConfig"
import { Hash, Calendar, DollarSign, RefreshCw, FileText } from "lucide-react"
import FundingMatchesTable from "./FundingMatchesTable"

/**
 * GroupedFundingMatches — renders funding matches grouped by application.
 *
 * For each of the current user's funding applications, it renders a divider
 * header with AppID, funding stage, match count, and amount, followed by an
 * embedded FundingMatchesTable that handles its own Firestore subscription.
 */
const GroupedFundingMatches = () => {
  const [applications, setApplications] = useState([])
  const [matchCounts, setMatchCounts] = useState({})
  const [smeProfile, setSmeProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) loadData(user.uid)
      else {
        setLoading(false)
        setError("Please log in to view matches")
      }
    })
    return () => unsubscribe()
  }, [])

  const loadData = async (userId) => {
    try {
      setLoading(true)
      setError(null)

      // Fetch applications
      let apps = []
      try {
        const q = query(
          collection(db, "fundingApplicationsV2"),
          where("userId", "==", userId),
          orderBy("lastUpdated", "desc")
        )
        const snapshot = await getDocs(q)
        snapshot.forEach((d) => apps.push(formatApp(d.id, d.data())))
      } catch {
        // Fallback without orderBy (index may not exist)
        const q = query(
          collection(db, "fundingApplicationsV2"),
          where("userId", "==", userId)
        )
        const snapshot = await getDocs(q)
        snapshot.forEach((d) => apps.push(formatApp(d.id, d.data())))
        apps.sort((a, b) => (b.lastUpdatedTs || 0) - (a.lastUpdatedTs || 0))
      }
      setApplications(apps)

      // Fetch SME universal profile for dealflow pipeline details
      try {
        const upSnap = await getDoc(doc(db, "universalProfiles", userId))
        if (upSnap.exists()) {
          setSmeProfile(upSnap.data())
        }
      } catch (err) {
        console.error("Failed to load SME profile:", err)
      }

      // Fetch match counts
      try {
        const mq = query(
          collection(db, "smseFundingMatches"),
          where("smeId", "==", userId),
          where("status", "==", "matched")
        )
        const mSnap = await getDocs(mq)
        const counts = {}
        mSnap.forEach((d) => {
          const appId = d.data().applicationId
          if (appId) counts[appId] = (counts[appId] || 0) + 1
        })
        setMatchCounts(counts)
      } catch (err) {
        console.error("Failed to fetch match counts:", err)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatApp = (docId, data) => {
    let lastUpdated = "N/A"
    let lastUpdatedTs = 0
    if (data.lastUpdated) {
      try {
        const date = data.lastUpdated.toDate
          ? data.lastUpdated.toDate()
          : new Date(data.lastUpdated)
        lastUpdatedTs = date.getTime()
        lastUpdated = date.toLocaleDateString("en-ZA", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      } catch {}
    }

    const overview = data.applicationOverview || {}
    const useOfFunds = data.useOfFunds || {}

    return {
      id: docId,
      shortId: docId?.slice(-8) || docId,
      fundingStage: overview.fundingStage || "",
      applicationType: overview.applicationType || "",
      supportFormat: overview.supportFormat || "",
      amount: useOfFunds.amountRequested || "",
      status: data.status || "draft",
      lastUpdated,
      lastUpdatedTs,
    }
  }

  const handleContactFunder = async (funderMatch, app) => {
    try {
      // 1. Fetch Funder's universal profile to get the contact email
      let funderEmail = "info@funder.com"
      try {
        const fSnap = await getDoc(doc(db, "MyuniversalProfiles", funderMatch.funderId))
        if (fSnap.exists()) {
          const fData = fSnap.data() || {}
          const contact = fData.formData?.contactDetails || {}
          funderEmail = contact.businessEmail || contact.email || funderEmail
        }
      } catch (err) {
        console.error("Failed to fetch funder email:", err)
      }

      // 2. Update status to 'contacted' in smseFundingMatches
      await updateDoc(doc(db, "smseFundingMatches", funderMatch.id), {
        status: "contacted",
        contactedAt: serverTimestamp(),
      })

      // 3. Create a deal/outreach document in 'smeApplications' to update the dealflow pipeline
      const applicationDate = new Date().toISOString().split("T")[0]
      const entityOverview = smeProfile?.entityOverview || {}
      const useOfFunds = smeProfile?.useOfFunds || {}

      const smeApplicationData = {
        smeId: auth.currentUser?.uid,
        submittedBy: auth.currentUser?.uid,
        submittedByRole: "owner",
        funderId: funderMatch.funderId,
        fundName: funderMatch.funderName || "Unnamed Funder",
        smeName: entityOverview.registeredName || entityOverview.tradingName || "Unnamed Business",
        investmentType: funderMatch.investmentFocus || "Not specified",
        entityType: useOfFunds.entityType || "Not specified",
        supportFormat: app.supportFormat || "Not specified",
        matchPercentage: funderMatch.finalScore || 0,
        location: entityOverview.province || entityOverview.location || "Not specified",
        stage: entityOverview.stage || app.fundingStage || "Not specified",
        sector: entityOverview.economicSectors?.join(", ") || "Not specified",
        fundingNeeded: app.amount || "Not specified",
        applicationDate,
        pipelineStage: "Application Sent",
        teamSize: entityOverview.teamSize || "Not specified",
        revenue: entityOverview.revenue || "Not specified",
        focusArea: entityOverview.businessDescription || "Not specified",
        createdAt: new Date().toISOString(),
        waitingTime: "unspecified",
      }

      await addDoc(collection(db, "smeApplications"), smeApplicationData)

      // 4. Dispatch a simulated notification / email to the funder
      console.log(`[Notification Sim] Email sent successfully to Funder: ${funderMatch.funderName} at ${funderEmail}`)

      const notificationMessage = `Application to ${funderMatch.funderName} submitted successfully`
      const event = new CustomEvent("newNotification", {
        detail: {
          message: notificationMessage,
          type: "success",
          timestamp: new Date().toISOString(),
        },
        bubbles: true,
        cancelable: true,
        composed: true,
      })
      window.dispatchEvent(event)

    } catch (err) {
      console.error("Failed to contact funder:", err)
      throw err
    }
  }

  const sortedApps = useMemo(() => {
    return [...applications].sort((a, b) => (b.lastUpdatedTs || 0) - (a.lastUpdatedTs || 0))
  }, [applications])

  // ── Loading state ──
  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#5D2A0A" }}>
        <div
          style={{
            display: "inline-block",
            width: 32,
            height: 32,
            border: "3px solid rgba(166,124,82,0.2)",
            borderTopColor: "#a67c52",
            borderRadius: "50%",
            animation: "gfm-spin 0.8s linear infinite",
            marginBottom: 12,
          }}
        />
        <p style={{ margin: 0, fontSize: 14 }}>Loading your matches…</p>
        <style>{`@keyframes gfm-spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // ── Error state ──
  if (error) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <p style={{ color: "#D32F2F", fontSize: "1rem", marginBottom: "1rem" }}>
          Failed to load matches: {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "0.6rem 1.2rem",
            background: "#5D2A0A",
            color: "white",
            border: "none",
            borderRadius: 6,
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    )
  }

  // ── Empty state ──
  if (!sortedApps.length) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <FileText size={42} style={{ color: "#c8b6a6", marginBottom: 12 }} />
        <h3 style={{ color: "#4a352f", marginBottom: 6, fontSize: 18, fontWeight: 700 }}>
          No Applications Yet
        </h3>
        <p style={{ color: "#6b7280", marginBottom: 20 }}>
          Submit a funding application to start receiving funder matches.
        </p>
      </div>
    )
  }

  // ── Grouped render ──
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <style>{`
        @keyframes gfm-fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {sortedApps.map((app) => {
        const count = matchCounts[app.id] || 0

        return (
          <section
            key={app.id}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              animation: "gfm-fadein 0.3s ease-out",
            }}
          >
            {/* ── Divider header ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 2px" }}>
              {/* AppID pill */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: "linear-gradient(135deg,#5d4037,#4a332a)",
                  color: "#FAF7F2",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  boxShadow: "0 2px 6px rgba(93,64,55,0.25)",
                  whiteSpace: "nowrap",
                }}
                title={`Full application ID: ${app.id}`}
              >
                <Hash size={13} />
                AppID&nbsp;{app.shortId}
              </div>

              {/* Gradient separator line */}
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "linear-gradient(90deg, rgba(200,182,166,0.6), rgba(200,182,166,0))",
                }}
              />

              {/* Meta badges */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  fontSize: 12,
                  color: "#7D5A50",
                  flexWrap: "wrap",
                }}
              >
                {/* Funding stage */}
                {app.fundingStage && (
                  <span
                    style={{
                      padding: "2px 8px",
                      background: "rgba(166,124,82,0.12)",
                      color: "#7D5A50",
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 500,
                    }}
                  >
                    {app.fundingStage}
                  </span>
                )}

                {/* Amount */}
                {app.amount && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <DollarSign size={12} />
                    {app.amount}
                  </span>
                )}

                {/* Match count */}
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <Calendar size={12} />
                  {count} {count === 1 ? "match" : "matches"}
                </span>

                {/* Status badge */}
                {app.status === "submitted" && (
                  <span
                    style={{
                      padding: "2px 8px",
                      background: "rgba(16,185,129,0.12)",
                      color: "#10b981",
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    Submitted
                  </span>
                )}
              </div>
            </div>

            {/* ── Matches table for this application ── */}
            <FundingMatchesTable
              applicationId={app.id}
              embedded={true}
              emptyMessage="No funder matches for this application yet."
              onContact={(funderMatch) => handleContactFunder(funderMatch, app)}
            />
          </section>
        )
      })}
    </div>
  )
}

export default GroupedFundingMatches
