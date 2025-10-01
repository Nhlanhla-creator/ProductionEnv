"use client"

import { useState,useEffect } from "react"
import { ChevronDown, ChevronUp, Edit ,FileText,ExternalLink} from 'lucide-react'
import "./UniversalProfile/UniversalProfile.css"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { auth, db, storage } from "../firebaseConfig"

const ProfileSummary = () => {
const [data, setData] = useState({})
const [onEdit, setOnEdit] = useState("")
 const renderDocumentLink = (url, label = "View Document") => {
    if (!url) return "No document uploaded";
    
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="document-link">
        <FileText size={16} />
        <span>{label}</span>
        <ExternalLink size={14} />
      </a>
    );
  };
  
    useEffect(() => {
      const fetchProfileData = async () => {
        try {
          setLoading(true)
          const userId = auth.currentUser?.uid
  
          if (!userId) {
            throw new Error("User not logged in")
          }
  
          const docRef = doc(db, "universalProfiles", userId)
          const docSnap = await getDoc(docRef)
  
          if (docSnap.exists()) {
            setProfileData(docSnap.data())
            setData(docSnap.data())
          } else {
            setError("No profile found. Please complete your Universal Profile first.")
          }
        } catch (err) {
          console.error("Error fetching profile data:", err)
          setError("Failed to load profile data. Please try again later.")
        } finally {
          setLoading(false)
        }
      }
  
      fetchProfileData()
    }, [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [profileData, setProfileData] = useState(null)

  const [expandedSections, setExpandedSections] = useState({
    entityOverview: true,
    ownershipManagement: false,
    contactDetails: false,
    legalCompliance: false,
    productsServices: false,
    howDidYouHear: false,
    declarationConsent: false,
  })

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Helper function to format file names from arrays
  const formatFiles = (files) => {
    if (!files || !files.length) return "None"
    return files.map((file) => (typeof file === "string" ? file : file.name)).join(", ")
  }

  // Helper function to format arrays
  const formatArray = (arr) => {
    if (!arr || !arr.length) return "None"
    return arr.join(", ")
  }

  // Helper function to format boolean values
  const formatBoolean = (value) => (value ? "Yes" : "No")

  // Helper function to get label from value using options array
  const getLabelFromValue = (value, options) => {
    if (!value) return "Not specified"
    const option = options.find((opt) => opt.value === value)
    return option ? option.label : value
  }

  return (
    <div className="profileDetails">
      <div className="summary-header">
        <h1>Documents</h1>
        <button className="btn btn-primary" onClick={onEdit}>
          <Edit size={16} /> Edit Profile
        </button>
      </div>

      {/* Entity Overview Section */}
      <div className="summary-section">
        <div className="summary-section-header" onClick={() => toggleSection("entityOverview")}>
          <h2>Entity Overview</h2>
       
        </div>
        {expandedSections.entityOverview && (
          <div className="summary-content">
            <div className="summary-grid">
              
              <div className="summary-item">
                <span className="summary-label">Registration Certificate:</span>
                <span className="summary-value">
                  {renderDocumentLink(data.entityOverview?.registrationCertificate, "ID Document")}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ownership & Management Section */}
      <div className="summary-section">
        <div className="summary-section-header" onClick={() => toggleSection("ownershipManagement")}>
          <h2>Ownership & Management</h2>
       
        </div>
        {expandedSections.ownershipManagement && (
          <div className="summary-content">
         

            <div className="summary-item mt-6">
              <span className="summary-label">Documents:</span>
              <span className="summary-value">
                <div>Certified IDs:  {renderDocumentLink(data.ownershipManagement?.certifiedIds, "ID Document")}</div>
                <div>Share Register: {renderDocumentLink(data.ownershipManagement?.shareRegister, "ID Document")}</div>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Contact Details Section */}
      <div className="summary-section">
        <div className="summary-section-header" onClick={() => toggleSection("contactDetails")}>
          <h2>Contact Details</h2>
     
        </div>
        {expandedSections.contactDetails && (
          <div className="summary-content">
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Postal Address:</span>
                <span className="summary-value">
                  {data.contactDetails?.sameAsPhysical 
                    ? "Same as physical address"
                    :  renderDocumentLink(data.contactDetails?.postalAddress, "PostalAdress Document") || "Not provided"}
                </span>
              </div>
            </div>

            <h3 className="summary-subheading mt-6">Social Media Links</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">LinkedIn:</span>
                <span className="summary-value"> {renderDocumentLink(data.contactDetails?.linkedin, "Linkedin Link")} </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Other Social Media:</span>
                <span className="summary-value">{renderDocumentLink(data.contactDetails?.otherSocial, "Socials Link")}</span>
              </div>
            </div>

            <div className="summary-item mt-6">
              <span className="summary-label">Documents:</span>
              <span className="summary-value">
                <div>Proof of Address: {renderDocumentLink(data.contactDetails?.proofOfAddress, "Address Document")}</div>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Legal & Compliance Section */}
      <div className="summary-section">
        <div className="summary-section-header" onClick={() => toggleSection("legalCompliance")}>
          <h2>Legal & Compliance</h2>
       
        </div>
        {expandedSections.legalCompliance && (
          <div className="summary-content">
            <div className="summary-grid">
              
            <div className="summary-item mt-6">
              <span className="summary-label">Documents:</span>
              <span className="summary-value">
                <div>Tax Clearance Certificate: {renderDocumentLink(data.legalCompliance?.taxClearanceCert, "Certificate Document")}</div>
                <div>B-BBEE Certificate: {renderDocumentLink(data.legalCompliance?.bbbeeCert, "Certificate Document")}</div>
                <div>Other Certificates:  {renderDocumentLink(data.legalCompliance?.otherCerts, "Certificate Document")}</div>
                <div>Industry Accreditations:   {renderDocumentLink(data.legalCompliance?.industryAccreditationDocs, "Accreditations Document")}</div>
              </span>
            </div>
            </div>
          </div>
        )}
      </div>

      {/* Products & Services Section */}
      <div className="summary-section">
        <div className="summary-section-header" onClick={() => toggleSection("productsServices")}>
          <h2>Products & Services</h2>
        
        </div>
        {expandedSections.productsServices && (
          <div className="summary-content">
            <div className="summary-item mt-6">
              <span className="summary-label">Documents:</span>
              <span className="summary-value">
                <div>Company Profile/Brochure: {renderDocumentLink(data.productsServices?.companyProfile, "Brochure Document")}</div>
                <div>Client References:  {renderDocumentLink(data.productsServices?.clientReferences, "References Document")}</div>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* How Did You Hear Section */}


      {/* Declaration & Consent Section */}
     
      
    </div>
  )
}

export default ProfileSummary
