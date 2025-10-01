"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./use-auth"
import "./Dashboard.css"

export function useProfile() {
  const { user } = useAuth()
  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    // Simulate profile data loading
    const timer = setTimeout(() => {
      // Mock profile data
      setProfileData({
        entityOverview: {
          businessName: "Example Business",
          registrationCertificate: { url: "https://example.com/cert.pdf" },
          proofOfAddress: { url: "https://example.com/address.pdf" },
          operationStage: "growth",
          yearsInOperation: "5",
          employeeCount: "25",
          targetMarket: "B2B technology companies",
          businessDescription: "We provide innovative software solutions for businesses.",
          financialYearEnd: "December",
        },
        ownershipManagement: {
          certifiedIds: { url: "https://example.com/ids.pdf" },
          shareRegister: { url: "https://example.com/shares.pdf" },
          directors: [
            { name: "John Doe", position: "CEO" },
            { name: "Jane Smith", position: "CTO" },
          ],
        },
        legalCompliance: {
          taxClearanceCert: { url: "https://example.com/tax.pdf" },
          bbbeeCert: { url: "https://example.com/bbbee.pdf" },
          taxClearanceNumber: "TC12345",
          vatNumber: "VAT9876543",
        },
        productsServices: {
          annualTurnover: "R5,000,000",
          productCategories: {
            products: [
              { name: "Software A", description: "Enterprise solution" },
              { name: "Software B", description: "SME solution" },
            ],
          },
          serviceCategories: {
            services: [
              { name: "Implementation", description: "Software implementation" },
              { name: "Training", description: "User training" },
            ],
          },
          keyClients: ["Client A", "Client B", "Client C"],
        },
        contactDetails: {
          website: "https://example.com",
          email: "info@example.com",
          phone: "+27 123 456 789",
        },
        declarationConsent: {
          signedDocument: { url: "https://example.com/consent.pdf" },
          accuracy: true,
          dataProcessing: true,
        },
        howDidYouHear: {
          source: "Referral",
        },
      })
      setLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [user])

  return { profileData, loading }
}
