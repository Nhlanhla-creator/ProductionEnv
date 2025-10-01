"use client"

import { useState, useEffect } from "react"
import { ChevronDown, X, Check } from 'lucide-react'
import "./compliance.css"

export function ComplianceScoreCard({ styles = {}, profileData }) {
  const [showModal, setShowModal] = useState(false)
  const [complianceScore, setComplianceScore] = useState(0)
  const [complianceDocuments, setComplianceDocuments] = useState([])

  // Define default fallback styles
  const defaultStyles = {
    backgroundBrown: "#f5f5dc",
    accentBrown: "#8d6e63",
    primaryBrown: "#5d4037"
  }

  const mergedStyles = {
    ...defaultStyles,
    ...styles
  }

  useEffect(() => {
    if (profileData) {
      const { score, documents } = calculateComplianceStatus(profileData)
      setComplianceScore(score)
      setComplianceDocuments(documents)
    }
  }, [profileData])

  const calculateComplianceStatus = (data) => {
    const documentMapping = [
      {
        path: "entityOverview.registrationCertificate",
        displayName: "Business registration verified",
        description: "Company Registration Certificate"
      },
      {
        path: "legalCompliance.taxClearanceCert",
        displayName: "Tax compliance confirmed",
        description: "Tax Clearance Certificate"
      },
      {
        path: "legalCompliance.bbbeeCert",
        displayName: "Industry certifications valid",
        description: "B-BBEE Certificate"
      },
      {
        path: "entityOverview.proofOfAddress",
        displayName: "Company address verified",
        description: "Proof of Operating Address"
      },
      {
        path: "ownershipManagement.certifiedIds",
        displayName: "Owner identities verified",
        description: "Certified IDs"
      },
      {
        path: "ownershipManagement.shareRegister",
        displayName: "Ownership structure verified",
        description: "Share Register"
      },
      {
        path: "declarationConsent.signedDocument",
        displayName: "Legal declarations signed",
        description: "Signed Declaration/Consent Form"
      }
    ]

    let presentCount = 0
    const documents = documentMapping.map(doc => {
      const isPresent = checkDocumentExists(data, doc.path)
      if (isPresent) presentCount++
      return {
        ...doc,
        verified: isPresent
      }
    })

    const score = Math.round((presentCount / documentMapping.length) * 100)
    return { score, documents }
  }

  const checkDocumentExists = (data, path) => {
    const parts = path.split('.')
    let value = data
    for (const part of parts) {
      value = value?.[part]
      if (value === undefined || value === null || value === "") {
        return false
      }
    }

    if (typeof value === 'object') {
      if ('url' in value || 'fileName' in value) {
        return Boolean(value.url || value.fileName)
      }
    }

    return Boolean(value)
  }

  return (
    <>
      <div className={`readiness-card fun-card ${showModal ? "blurred" : ""}`}>
        <div
          style={{
            padding: '30px',
            borderBottom: '1px solid var(--medium-brown)',
            backgroundColor: 'white',
            fontSize: '12px',
            color: 'var(--dark-brown)'
          }}
        >
          <h2>BIG Compliance Score</h2>
        </div>

        <div className="score-wrapper">
          <div
            className="score-circle"
            style={{
              backgroundColor: mergedStyles.backgroundBrown,
              color: "black",
              fontWeight: "bold",
              borderColor: mergedStyles.accentBrown
            }}
          >
            {complianceScore}%
          </div>
        </div>

        <div className="text-center">
          <button
            className="fun-button"
            onClick={() => setShowModal(true)}
            style={{ backgroundColor: '#8d6e63', color: 'white' }}
          >
            View More
            <ChevronDown className="ml-1 inline-block" size={16} />
          </button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content fun-popup">
            <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            <h3 className="popup-title">Compliance Verification</h3>
            <ul className="summary-list">
              {complianceDocuments.map((doc) => (
                <li key={doc.path} className="summary-item">
                  <div className="summary-label" title={doc.description}>
                    <div className="summary-bullet" style={{ backgroundColor: mergedStyles.accentBrown }}></div>
                    <span>{doc.displayName}</span>
                  </div>
                  <span
                    className="status-indicator"
                    style={{ color: doc.verified ? mergedStyles.primaryBrown : '#ccc' }}
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
