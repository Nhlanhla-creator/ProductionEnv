"use client"

import { useState, useEffect } from "react"
import { ChevronDown, Check } from 'lucide-react'
import styles from "./legitimacy.module.css"
import { db, auth } from "../../firebaseConfig"
import { doc, getDoc, setDoc } from "firebase/firestore"

export function LegitimacyScoreCard({ profileData }) {
  const [showModal, setShowModal] = useState(false)
  const [verificationScore, setVerificationScore] = useState(0)
  const [complianceDocuments, setComplianceDocuments] = useState([])
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) setUserId(user.uid)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const processScore = async () => {
      if (!profileData || !userId) return

      const { score, documents } = calculateVerificationScore(profileData)
      setVerificationScore(score)
      setComplianceDocuments(documents)

      // Save to Firestore
      const profileRef = doc(db, "MyuniversalProfiles", userId)
      await setDoc(profileRef, { verificationScore: score }, { merge: true })
    }

    processScore()
  }, [profileData, userId])

  useEffect(() => {
    const fetchSavedScore = async () => {
      if (!userId) return
      const snap = await getDoc(doc(db, "MyuniversalProfiles", userId))
      if (snap.exists() && snap.data().verificationScore !== undefined) {
        setVerificationScore(snap.data().verificationScore)
      }
    }

    fetchSavedScore()
  }, [userId])

  const calculateVerificationScore = (data) => {
    const documentMapping = [
      { path: "ownershipManagement.certifiedIDs", displayName: "Owner identities verified" },
      { path: "ownershipManagement.registrationDocs", displayName: "Entity registration docs uploaded" },
      { path: "ownershipManagement.shareRegister", displayName: "Ownership structure verified" },
      { path: "documentUpload.fundMandate", displayName: "Investment mandate submitted" },
      { path: "productsServices.ticketMin", displayName: "Minimum ticket size specified" },
      { path: "productsServices.ticketMax", displayName: "Maximum ticket size specified" },
      { path: "productsServices.sectors", displayName: "Sector focus defined" },
      { path: "productsServices.portfolioCompanies", displayName: "Past investments listed" },
      { path: "productsServices.successStory", displayName: "Success stories shared" },
      { path: "productsServices.investmentsToDate", displayName: "Recent deals recorded" }
    ]

    let presentCount = 0
    const verifiedDocs = documentMapping.map(doc => {
      const isPresent = checkDocumentExists(data, doc.path)
      if (isPresent) presentCount++
      return {
        ...doc,
        verified: isPresent
      }
    })

    const score = Math.round((presentCount / documentMapping.length) * 100)
    return { score, documents: verifiedDocs }
  }

  const checkDocumentExists = (data, path) => {
    const parts = path.split('.')
    let value = data
    for (const part of parts) {
      value = value?.[part]
      if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
        return false
      }
    }
    return true
  }

  return (
    <>
      <div className={`${styles.readinessCard} ${styles.funCard} ${showModal ? styles.blurred : ""}`}>
        <div className={styles.funCardHeader}>
          <h2>Verification Score</h2>
        </div>

        <div className={styles.scoreWrapper}>
          <div className={styles.scoreCircle}>
            {verificationScore}%
          </div>
        </div>

        <div className={styles.textCenter}>
          <button className={styles.funButton} onClick={() => setShowModal(true)}>
            View More
            <ChevronDown className={styles.ml1} size={16} />
          </button>
        </div>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${styles.funPopup}`}>
            <button className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
            <h3 className={styles.popupTitle}>Verification Breakdown</h3>
            <ul className={styles.summaryList}>
              {complianceDocuments.map((doc, i) => (
                <li key={i} className={styles.summaryItem}>
                  <div className={styles.summaryLabel}>
                    <div className={styles.summaryBullet}></div>
                    <span>{doc.displayName}</span>
                  </div>
                  <span
                    className={styles.statusIndicator}
                    style={{ color: doc.verified ? 'var(--primary-brown)' : '#ccc' }}
                  >
                    {doc.verified ? <Check size={16} /> : '✕'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
