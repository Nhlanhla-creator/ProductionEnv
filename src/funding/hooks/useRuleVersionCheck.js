"use client"

import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../../firebaseConfig"

/**
 * Detects when a published opportunity's rule version changed after an
 * unsent draft was captured against it.
 *
 * Brief §5, acceptance #7:
 *   "A published requirement changes while a draft is open: the SME sees
 *    the difference and must review. A submitted PDF, score and rules
 *    remain frozen."
 *
 * Compares draft.ruleVersionAtSave against the live opportunity's
 * publishedVersion + ruleVersion snapshot.
 *
 * The live version is read from the fundingOpportunityIndex mirror doc
 * (maintained by the investor publication workflow). If the mirror does
 * not exist, the check is skipped — no false positives.
 */

export default function useRuleVersionCheck({ requestId, opportunityId, draft }) {
  const [status, setStatus] = useState({
    checked: false,
    changed: false,
    live: null,
    draftVersion: null,
  })

  useEffect(() => {
    if (!requestId || !opportunityId || !draft) return
    let cancelled = false

    ;(async () => {
      try {
        const idxRef = doc(db, "fundingOpportunityIndex", opportunityId)
        const idxSnap = await getDoc(idxRef)

        if (!idxSnap.exists()) {
          if (!cancelled) {
            setStatus({
              checked: true,
              changed: false,
              live: null,
              draftVersion: draft.ruleVersionAtSave || null,
            })
          }
          return
        }

        const live = idxSnap.data()
        const draftVersion = draft.ruleVersionAtSave || null

        const changed =
          !!draftVersion &&
          (live.ruleVersion !== draftVersion.ruleVersion ||
            live.publishedVersion !== draftVersion.publishedVersion)

        if (!cancelled) {
          setStatus({ checked: true, changed, live, draftVersion })
        }
      } catch (err) {
        console.warn("[useRuleVersionCheck] failed:", err?.message)
        if (!cancelled) {
          setStatus({
            checked: true,
            changed: false,
            live: null,
            draftVersion: null,
          })
        }
      }
    })()

    return () => { cancelled = true }
  }, [requestId, opportunityId, draft])

  return status
}