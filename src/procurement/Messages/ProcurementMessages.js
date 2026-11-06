"use client"

import React, { useEffect, useState } from "react"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import {
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore"
import { db } from "../../firebaseConfig"
import MessagesComponent from "../../components/Messages/MessagesComponent"

export default function ProcurementMessages() {
  const [recipientsList, setRecipientsList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getAuth()

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRecipientsList([])
        setLoading(false)
        return
      }

      try {
        const recipientsMap = new Map()

        // 1. Gather suppliers from cohort memberships
        try {
          const cohortsSnap = await getDocs(
            query(collection(db, "esdCohorts"), where("buyerId", "==", user.uid))
          )
          cohortsSnap.forEach((docSnap) => {
            const data = docSnap.data()
            const members = data.members || []
            members.forEach((m) => {
              const id = m.id || m.supplierId || m.smeId
              const name = m.name || m.businessName || "Cohort Supplier"
              if (id && !recipientsMap.has(id)) {
                recipientsMap.set(id, { id, name })
              }
            })
          })
        } catch (err) {
          console.warn("Cohort suppliers query warning:", err)
        }

        // 2. Gather suppliers from RFI interactions
        try {
          const rfiSnap = await getDocs(
            query(collection(db, "procurementInteractions"), where("buyerId", "==", user.uid))
          )
          rfiSnap.forEach((docSnap) => {
            const data = docSnap.data()
            const id = data.supplierId || data.smeId
            const name = data.supplierName || data.businessName || "Supplier"
            if (id && !recipientsMap.has(id)) {
              recipientsMap.set(id, { id, name })
            }
          })
        } catch (err) {
          console.warn("RFI query warning:", err)
        }

        // 3. Fallback: also pull verified universalProfiles to ensure directory availability
        if (recipientsMap.size < 10) {
          try {
            const profileSnap = await getDocs(
              query(collection(db, "universalProfiles"), limit(30))
            )
            profileSnap.forEach((docSnap) => {
              const data = docSnap.data()
              const id = docSnap.id
              const name =
                data.entityOverview?.registeredName ||
                data.entityOverview?.tradingName ||
                data.businessName ||
                data.name ||
                "Registered Supplier"
              if (id && !recipientsMap.has(id)) {
                recipientsMap.set(id, { id, name })
              }
            })
          } catch (err) {
            console.warn("Universal profiles query warning:", err)
          }
        }

        setRecipientsList(Array.from(recipientsMap.values()))
      } catch (error) {
        console.error("Error loading Procurement recipients:", error)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const config = {
    showSidebarOffset: false,
    supportAttachments: true,
    showSearchIcon: true,
    hasRecipientDropdown: true,
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
          fontFamily: "'Inter', sans-serif",
          color: "#4A352F",
        }}
      >
        Loading messages...
      </div>
    )
  }

  return <MessagesComponent config={config} recipientsList={recipientsList} />
}

