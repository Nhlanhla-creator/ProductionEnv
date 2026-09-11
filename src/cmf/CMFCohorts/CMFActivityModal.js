"use client"

import React, { useState, useEffect } from "react"
import {
  X, Activity, Sparkles, Send, CheckCircle2, Clock,
  Building, Trophy, DollarSign, Filter, Search, RotateCcw,
  ArrowRight, ShieldCheck, Ticket, StickyNote
} from "lucide-react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db, auth } from "../../firebaseConfig"

export default function CMFActivityModal({ onClose }) {
  const currentUser = auth.currentUser
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchAllActivities = async () => {
      if (!currentUser?.uid) return
      setLoading(true)
      try {
        const events = []

        // 1. Fetch direct cmfActivities logs
        try {
          const actSnap = await getDocs(
            query(collection(db, "cmfActivities"), where("facilitatorId", "==", currentUser.uid))
          )
          actSnap.forEach((docSnap) => {
            const d = docSnap.data()
            events.push({
              id: docSnap.id,
              type: d.type || "application",
              title: d.title || "CMF Action",
              smeName: d.smeName || "Cohort Member",
              partnerName: d.partnerName || "Partner",
              details: d.details || "",
              timestamp: d.timestamp || (d.createdAt ? new Date(d.createdAt).getTime() : Date.now()),
              source: "log"
            })
          })
        } catch (e) {
          console.warn("cmfActivities fetch warning:", e)
        }

        // 2. Fetch SME applications submitted by CMF
        try {
          const smeAppsSnap = await getDocs(
            query(collection(db, "smeApplications"), where("submittedBy", "==", currentUser.uid))
          )
          smeAppsSnap.forEach((docSnap) => {
            const d = docSnap.data()
            events.push({
              id: docSnap.id,
              type: "application",
              title: `Submitted Funder Application`,
              smeName: d.smeName || "Cohort SME",
              partnerName: d.fundName || "Funder",
              details: `Application submitted to ${d.fundName || "Funder"} for ${d.fundingNeeded || "growth capital"}`,
              timestamp: d.createdAt ? new Date(d.createdAt).getTime() : Date.now(),
              source: "smeApplications"
            })
          })
        } catch (e) {
          console.warn("smeApplications fetch warning:", e)
        }

        // 3. Fetch Catalyst applications submitted by CMF
        try {
          const catAppsSnap = await getDocs(
            query(collection(db, "catalystApplications"), where("submittedBy", "==", currentUser.uid))
          )
          catAppsSnap.forEach((docSnap) => {
            const d = docSnap.data()
            events.push({
              id: docSnap.id,
              type: "application",
              title: `Submitted Catalyst Application`,
              smeName: d.smeName || "Cohort SME",
              partnerName: d.programName || "Catalyst Program",
              details: `Application sent to ${d.programName || "Catalyst"} for accelerator admission`,
              timestamp: d.createdAt ? new Date(d.createdAt).getTime() : Date.now(),
              source: "catalystApplications"
            })
          })
        } catch (e) {
          console.warn("catalystApplications fetch warning:", e)
        }

        // 4. Fetch CMF Vouchers generated
        try {
          const vouchersSnap = await getDocs(
            query(collection(db, "vouchers"), where("createdBy", "==", currentUser.uid))
          )
          vouchersSnap.forEach((docSnap) => {
            const d = docSnap.data()
            events.push({
              id: docSnap.id,
              type: "voucher",
              title: `Generated Voucher (${d.planName || d.type || "Boost"})`,
              smeName: d.smeName || "Cohort SME",
              partnerName: `${d.seats || 1} Seat(s)`,
              details: `Issued voucher code ${d.code} (${d.planName || "Growth Suite Boost"})`,
              timestamp: d.createdAtTimestamp || (d.createdAt ? new Date(d.createdAt).getTime() : Date.now()),
              source: "vouchers"
            })
          })
        } catch (e) {
          console.warn("vouchers fetch warning:", e)
        }

        // 5. Fetch CMF Notes created
        try {
          const notesSnap = await getDocs(
            query(collection(db, "cmfNotes"), where("userId", "==", currentUser.uid))
          )
          notesSnap.forEach((docSnap) => {
            const d = docSnap.data()
            events.push({
              id: docSnap.id,
              type: "note",
              title: `Added Cohort Note`,
              smeName: d.smeName || "Cohort SME",
              partnerName: "Facilitator Log",
              details: d.note ? (d.note.length > 80 ? d.note.slice(0, 80) + "..." : d.note) : "Note recorded",
              timestamp: d.createdAtMs || Date.now(),
              source: "cmfNotes"
            })
          })
        } catch (e) {
          console.warn("cmfNotes fetch warning:", e)
        }

        // Deduplicate events by id and sort descending
        const uniqueMap = new Map()
        events.forEach((ev) => {
          if (!uniqueMap.has(ev.id)) uniqueMap.set(ev.id, ev)
        })

        const sorted = Array.from(uniqueMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        setActivities(sorted)
      } catch (err) {
        console.error("Error loading CMF activities:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchAllActivities()
  }, [currentUser])

  // Filter and search
  const filteredActivities = activities.filter((act) => {
    if (activeFilter !== "all" && act.type !== activeFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchSme = (act.smeName || "").toLowerCase().includes(q)
      const matchPartner = (act.partnerName || "").toLowerCase().includes(q)
      const matchDetails = (act.details || "").toLowerCase().includes(q)
      const matchTitle = (act.title || "").toLowerCase().includes(q)
      return matchSme || matchPartner || matchDetails || matchTitle
    }
    return true
  })

  const formatTimestamp = (ts) => {
    if (!ts) return "Recently"
    const date = new Date(ts)
    if (isNaN(date.getTime())) return "Recently"
    return date.toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case "application":
        return <Send size={14} className="text-blue-600" />
      case "stage":
        return <ArrowRight size={14} className="text-emerald-600" />
      case "onboarding":
        return <Building size={14} className="text-[#a67c52]" />
      case "voucher":
        return <Ticket size={14} className="text-purple-600" />
      case "note":
        return <StickyNote size={14} className="text-amber-600" />
      default:
        return <Activity size={14} className="text-[#7d5a50]" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-[#e6d7c3] overflow-hidden flex flex-col my-8 max-h-[88vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#4a352f] to-[#241a14] text-white p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Activity className="text-[#d9b98a]" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold m-0 leading-tight">
                CMF Facilitator Activity
              </h2>
              <p className="text-xs text-[#d9c4b0] m-0">
                Timeline of onboardings, applications, stage transitions, and cohort engagements
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-4 bg-[#f5f0e1] border-b border-[#e6d7c3] flex items-center justify-between gap-3 flex-wrap flex-shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "All Activity" },
              { id: "application", label: "Applications" },
              { id: "stage", label: "Stage Changes" },
              { id: "onboarding", label: "Onboarding" },
              { id: "voucher", label: "Vouchers" },
              { id: "note", label: "Notes" }
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveFilter(id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeFilter === id
                    ? "bg-[#7d5a50] text-white shadow-sm"
                    : "bg-white text-[#7d5a50] hover:bg-[#e6d7c3] border border-[#c8b6a6]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7d5a50]" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#c8b6a6] rounded-xl text-xs text-[#4a352f] focus:outline-none focus:border-[#7d5a50]"
            />
          </div>
        </div>

        {/* Timeline Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-[#faf7f2]">
          {loading ? (
            <div className="p-12 text-center text-[#7d5a50]">
              <div className="inline-block w-7 h-7 border-2 border-[#7d5a50] border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs font-semibold m-0">Loading facilitator activity logs...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-[#e6d7c3] space-y-2">
              <Activity size={32} className="mx-auto text-[#a89482]" />
              <h4 className="text-sm font-bold text-[#4a352f] m-0">No Activities Found</h4>
              <p className="text-xs text-[#7d5a50] m-0">
                {searchQuery || activeFilter !== "all"
                  ? "No activities match your current search or filter."
                  : "Activity events will be logged here as you submit applications and manage cohorts."}
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-[#d9c4b0] ml-4 pl-6 space-y-5">
              {filteredActivities.map((act) => (
                <div key={act.id} className="relative group">
                  {/* Timeline bullet icon */}
                  <div className="absolute -left-[35px] top-1.5 w-6 h-6 rounded-full bg-white border-2 border-[#7d5a50] flex items-center justify-center shadow-sm">
                    {getTypeIcon(act.type)}
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-[#e6d7c3] shadow-sm hover:shadow transition-shadow">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#4a352f]">
                          {act.title}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f5f0e1] text-[#7d5a50]">
                          {act.smeName}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#a89482] font-medium flex items-center gap-1">
                        <Clock size={12} /> {formatTimestamp(act.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs text-[#5d4037] m-0 leading-relaxed">
                      {act.details}
                    </p>

                    {act.partnerName && (
                      <div className="mt-2 pt-2 border-t border-[#f0e6d9] flex items-center justify-between text-[11px] text-[#7d5a50]">
                        <span>Target: <strong className="text-[#4a352f]">{act.partnerName}</strong></span>
                        <span className="capitalize font-semibold text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {act.type}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white p-4 border-t border-[#e6d7c3] flex items-center justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#7d5a50] hover:bg-[#6b4c43] transition-colors cursor-pointer"
          >
            Close Activity
          </button>
        </div>
      </div>
    </div>
  )
}
