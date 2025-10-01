"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../../firebaseConfig";
import { ChevronDown, ChevronUp, FileText, ExternalLink, Loader } from "lucide-react";
import "./LindelanitestView.css";

export default function ProfileView() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    entityOverview: true,
    ownershipManagement: false,
    contactDetails: false,
    legalCompliance: false,
    productsServices: false,
    howDidYouHear: false,
    declarationConsent: false,
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const userId = auth.currentUser?.uid;
        
        if (!userId) {
          throw new Error("User not logged in");
        }

        const docRef = doc(db, "universalProfiles", userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfileData(docSnap.data());
        } else {
          setError("No profile found. Please complete your Universal Profile first.");
        }
      } catch (err) {
        console.error("Error fetching profile data:", err);
        setError("Failed to load profile data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    
    try {
      // Handle Firestore timestamps or string dates
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString();
    } catch (err) {
      return timestamp.toString();
    }
  };

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

  const renderShareholders = (shareholders) => {
    if (!shareholders || shareholders.length === 0) return <p>No shareholders listed</p>;
    
    return (
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>ID/Reg No</th>
              <th>Country</th>
              <th>Shareholding %</th>
              <th>Race</th>
              <th>Gender</th>
              <th>Youth</th>
              <th>Disabled</th>
              <th>ID Document</th>
            </tr>
          </thead>
          <tbody>
            {shareholders.map((shareholder, index) => (
              <tr key={index}>
                <td>{shareholder.name || "N/A"}</td>
                <td>{shareholder.idRegNo || "N/A"}</td>
                <td>{shareholder.country || "N/A"}</td>
                <td>{shareholder.shareholding || "N/A"}</td>
                <td>{shareholder.race || "N/A"}</td>
                <td>{shareholder.gender || "N/A"}</td>
                <td>{shareholder.isYouth ? "Yes" : "No"}</td>
                <td>{shareholder.isDisabled ? "Yes" : "No"}</td>
                <td>{renderDocumentLink(shareholder.idDocument, "ID Document")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderDirectors = (directors) => {
    if (!directors || directors.length === 0) return <p>No directors listed</p>;
    
    return (
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>ID Number</th>
              <th>Position</th>
              <th>Nationality</th>
              <th>Executive</th>
              <th>Document</th>
            </tr>
          </thead>
          <tbody>
            {directors.map((director, index) => (
              <tr key={index}>
                <td>{director.name || "N/A"}</td>
                <td>{director.id || "N/A"}</td>
                <td>{director.position || "N/A"}</td>
                <td>{director.nationality || "N/A"}</td>
                <td>{director.isExec ? "Yes" : "No"}</td>
                <td>{renderDocumentLink(director.doc, "Document")}
                  
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderKeyClients = (keyClients) => {
    if (!keyClients || keyClients.length === 0) return <p>No key clients listed</p>;
    
    return (
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Industry</th>
              <th>Relationship Duration</th>
            </tr>
          </thead>
          <tbody>
            {keyClients.map((client, index) => (
              <tr key={index}>
                <td>{client.name || "N/A"}</td>
                <td>{client.industry || "N/A"}</td>
                <td>{client.duration || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  
  const renderProducts = (products) => {
    if (!products || products.length === 0) return <p>No products listed</p>;
    
    return (
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Description</th>
            
            </tr>
          </thead>
          <tbody>
            {products.map((products, index) => (
              <tr key={index}>
                <td>{products.name || "N/A"}</td>
                <td>{products.description || "N/A"}</td>
             
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderCategoriesList = (categories) => {
    if (categories == null ) return <p>None selected</p>;
    
    return (
      <ul className="categories-list">
        {categories.map((category, index) => (
          <li key={index}>{category}</li>
        ))}
      </ul>
    );
  };

  if (loading) {
    return (
      <div className="profile-view-loading">
        <Loader className="spinner" />
        <p>Loading profile data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-view-error">
        <h1>Universal Profile View</h1>
        <div className="error-message">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-view-container">
      <h1>Universal Profile View</h1>
      
      <div className="profile-section">
        <div 
          className="section-header" 
          onClick={() => toggleSection("entityOverview")}
        >
          <h2>Entity Overview</h2>
          {expandedSections.entityOverview ? <ChevronUp /> : <ChevronDown />}
        </div>
        
        {expandedSections.entityOverview && (
          <div className="section-content">
            <div className="data-grid">
              <div className="data-row">
                <span className="data-label">Business Description:</span>
                <span className="data-value">{profileData?.entityOverview?.businessDescription || "N/A"}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Economic Sector:</span>
                <span className="data-value">{profileData?.entityOverview?.economicSector || "N/A"}</span>
              </div>
              <div className="data-row">
                <span className="data-label">employee Count:</span>
                <span className="data-value">{profileData?.entityOverview?.employeeCount || "N/A"}</span>
              </div>
              <div className="data-row">
                <span className="data-label">entity Size :</span>
                <span className="data-value">{formatDate(profileData?.entityOverview?.entitySize)}</span>
              </div>
              <div className="data-row">
                <span className="data-label">entity Type:</span>
                <span className="data-value">{profileData?.entityOverview?.entityType || "N/A"}</span>
              </div>
              <div className="data-row">
                <span className="data-label">financialYearEnd:</span>
                <span className="data-value">{profileData?.entityOverview?.financialYearEnd || "N/A"}</span>
              </div>
              <div className="data-row">
                <span className="data-label">location:</span>
                <span className="data-value">{profileData?.entityOverview?.location || "N/A"}</span>
              </div>
              <div className="data-row">
                <span className="data-label">operation Stage:</span>
                <span className="data-value">{profileData?.entityOverview?.operationStage || "N/A"}</span>
              </div>
              <div className="data-row">
                <span className="data-label">registeredName:</span>
                <span className="data-value">{profileData?.entityOverview?.registeredName || "N/A"}</span>
              </div>
              <div className="data-row">
                <span className="data-label">registrationNumber:</span>
                <span className="data-value">{profileData?.entityOverview?.registrationNumber || "N/A"}</span>
              </div>
              <div className="data-row">
                <span className="data-label">targetMarket:</span>
                <span className="data-value">{profileData?.entityOverview?.targetMarket || "N/A"}</span>
              </div>
              <div className="data-row">
                <span className="data-label">tradingName:</span>
                <span className="data-value">{profileData?.entityOverview?.tradingName || "N/A"}</span>
              </div>
              <div className="data-row">
                <span className="data-label">yearsInOperation:</span>
                <span className="data-value">{profileData?.entityOverview?.yearsInOperation || "N/A"}</span>
              </div>
             
              
              <div className="data-row">
                <span className="data-label">companyLogo</span>
                <span className="data-value">
                  {renderDocumentLink(profileData?.entityOverview?.companyLogo, "Company Logo")}
                </span>
              </div>
              <div className="data-row">
                <span className="data-label">proofOfAddress</span>
                <span className="data-value">
                  {renderDocumentLink(profileData?.entityOverview?.proofOfAddress, "proof Of Address")}
                </span>
              </div>
              <div className="data-row">
                <span className="data-label">registrationCertificate</span>
                <span className="data-value">
                  {renderDocumentLink(profileData?.entityOverview?.proofOfAddress, "registration Certificate")}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="profile-section">
        <div 
          className="section-header" 
          onClick={() => toggleSection("ownershipManagement")}
        >
          <h2>Ownership & Management</h2>
          {expandedSections.ownershipManagement ? <ChevronUp /> : <ChevronDown />}
        </div>
        
        {expandedSections.ownershipManagement && (
          <div className="section-content">
            <h3>Shareholders</h3>
            {renderShareholders(profileData?.ownershipManagement?.shareholders)}
            
            <h3>Directors</h3>
            {renderDirectors(profileData?.ownershipManagement?.directors)}

             <div className="data-row">
                <span className="data-label">certifiedIds</span>
                <span className="data-value">
                  {renderDocumentLink(profileData?.ownershipManagement?.certifiedIds || "N/A")}
                </span>

              </div>
                 <div className="data-row">
                <span className="data-label"> shareRegister</span>
                <span className="data-value">
                  {renderDocumentLink(profileData?.ownershipManagement?. shareRegister || "N/A")}
                </span>

              </div>
    <div className="data-row">
                <span className="data-label">certifiedIds:</span>
                <span className="data-value">{profileData?.ownershipManagement?.certifiedIds || "N/A"}</span>
              </div>
          </div>
          
        )}
         
    
      </div>
      
      <div className="profile-section">
        <div 
          className="section-header" 
          onClick={() => toggleSection("contactDetails")}
        >
          <h2>Contact Details</h2>
          {expandedSections.contactDetails ? <ChevronUp /> : <ChevronDown />}
        </div>
        
        {expandedSections.contactDetails && (
          <div className="section-content">
            <h3>Business Address</h3>
            <div className="data-grid">
              <div className="data-row">
                <span className="data-label">businessPhone:</span>
                <span className="data-value">
                  {profileData?.contactDetails?.businessPhone || "N/A"}
                </span>
              </div>
 <div className="data-row">
                <span className="data-label">contactId:</span>
                <span className="data-value">
                  {profileData?.contactDetails?.contactId || "N/A"}
                </span>
              </div> <div className="data-row">
                <span className="data-label">contactName:</span>
                <span className="data-value">
                  {profileData?.contactDetails?.contactName || "N/A"}
                </span>
              </div> <div className="data-row">
                <span className="data-label">contactTitle:</span>
                <span className="data-value">
                  {profileData?.contactDetails?.contactTitle || "N/A"}
                </span>
              </div>
               <div className="data-row">
                <span className="data-label">mobile:</span>
                <span className="data-value">
                  {profileData?.contactDetails?.mobile || "N/A"}
                </span>
              </div>
               <div className="data-row">
                <span className="data-label">otherSocial:</span>
                <span className="data-value">
                  {profileData?.contactDetails?.otherSocial || "N/A"}
                </span>
              </div>

                 <div className="data-row">
                <span className="data-label"> proofOfAddress:</span>
                <span className="data-value">
                  {renderDocumentLink(profileData?.ownershipManagement?. proofOfAddress || "N/A")}
                </span>

              </div>
              
              <div className="data-row">
                <span className="data-label">Physical Address:</span>
                <span className="data-value">
                  {profileData?.contactDetails?.physicalAddress || "N/A"}
                </span>
              </div>
             
            </div>
            
            <h3>Postal Address</h3>
            {profileData?.contactDetails?.sameAsPhysical ? (
              <p>Same as physical address</p>
            ) : (
              <div className="data-grid">
                <div className="data-row">
                  <span className="data-label">Postal Address:</span>
                  <span className="data-value">
                    {profileData?.contactDetails?.postalAddress || "N/A"}
                  </span>
                </div>
                <div className="data-row">
                  <span className="data-label">City:</span>
                  <span className="data-value">
                    {profileData?.contactDetails?.postalCity || "N/A"}
                  </span>
                </div>
                <div className="data-row">
                  <span className="data-label">Postal Code:</span>
                  <span className="data-value">
                    {profileData?.contactDetails?.postalCode || "N/A"}
                  </span>
                </div>
                <div className="data-row">
                  <span className="data-label">Province:</span>
                  <span className="data-value">
                    {profileData?.contactDetails?.postalProvince || "N/A"}
                  </span>
                </div>
              </div>
            )}
            
            <h3>Contact Information</h3>
            <div className="data-grid">
              <div className="data-row">
                <span className="data-label">Primary Contact:</span>
                <span className="data-value">
                  {profileData?.contactDetails?.primaryContact || "N/A"}
                </span>
              </div>
              <div className="data-row">
                <span className="data-label">Position:</span>
                <span className="data-value">
                  {profileData?.contactDetails?.position || "N/A"}
                </span>
              </div>
              <div className="data-row">
                <span className="data-label">Email:</span>
                <span className="data-value">
                  {profileData?.contactDetails?.email || "N/A"}
                </span>
              </div>
              <div className="data-row">
                <span className="data-label">Phone:</span>
                <span className="data-value">
                  {profileData?.contactDetails?.phone || "N/A"}
                </span>
              </div>
              <div className="data-row">
                <span className="data-label">Website:</span>
                <span className="data-value">
                  {profileData?.contactDetails?.website ? (
                    <a href={profileData.contactDetails.website} target="_blank" rel="noopener noreferrer">
                      {profileData.contactDetails.website}
                      <ExternalLink size={14} className="ml-1" />
                    </a>
                  ) : (
                    "N/A"
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="profile-section">
        <div 
          className="section-header" 
          onClick={() => toggleSection("legalCompliance")}
        >
          <h2>Legal & Compliance</h2>
          {expandedSections.legalCompliance ? <ChevronUp /> : <ChevronDown />}
        </div>
        
        {expandedSections.legalCompliance && (
          <div className="section-content">
            <div className="data-grid">

              <div className="data-row">
                <span className="data-label">taxClearanceDate:</span>
                <span className="data-value">
                  {profileData?.legalCompliance?.taxClearanceDate || "N/A"}
                </span>
              </div>
                <div className="data-row">
                <span className="data-label">taxClearanceNumber:</span>
                <span className="data-value">
                  {profileData?.legalCompliance?.taxClearanceNumber || "N/A"}
                </span>
              </div>
                <div className="data-row">
                <span className="data-label">uifNumber:</span>
                <span className="data-value">
                  {profileData?.legalCompliance?.uifNumber || "N/A"}
                </span>
              </div>
                <div className="data-row">
                <span className="data-label">licenseDoc:</span>
                <span className="data-value">
                  {profileData?.legalCompliance?.licenseDoc || "N/A"}
                </span>
              </div>

              
                 <div className="data-row">
                <span className="data-label"> taxClearanceCert:</span>
                <span className="data-value">
                  {renderDocumentLink(profileData?.ownershipManagement?. taxClearanceCert || "N/A")}
                </span>

              </div> 
                <div className="data-row">
                <span className="data-label"> otherCerts:</span>
                <span className="data-value">
                  {renderDocumentLink(profileData?.ownershipManagement?. otherCerts || "N/A")}
                </span>

              </div>
              <div className="data-row">
                <span className="data-label"> bbbeeCert:</span>
                <span className="data-value">
                  {renderDocumentLink(profileData?.ownershipManagement?. bbbeeCert || "N/A")}
                </span>

              </div>
              <div className="data-row">
                <span className="data-label"> industryAccreditationDocs:</span>
                <span className="data-value">
                  {renderDocumentLink(profileData?.ownershipManagement?. industryAccreditationDocs || "N/A")}
                </span>

              </div>
           

              
             
                <div className="data-row">
                  <span className="data-label">VAT Number:</span>
                  <span className="data-value">
                    {profileData?.legalCompliance?.vatNumber || "N/A"}
                  </span>
                </div>
              
              <div className="data-row">
                <span className="data-label">payeNumber:</span>
                <span className="data-value">
                  {profileData?.legalCompliance?.payeNumber || "N/A"}
                </span>
              </div>
              <div className="data-row">
                <span className="data-label">Tax Number:</span>
                <span className="data-value">
                  {profileData?.legalCompliance?.taxNumber || "N/A"}
                </span>
              </div>
              <div className="data-row">
                <span className="data-label">bbbeeCertRenewalDate:</span>
                <span className="data-value">
                  {profileData?.legalCompliance?.bbbeeCertRenewalDate || "N/A"}
                </span>
              </div>
               <div className="data-row">
                <span className="data-label">bbbeeLevel:</span>
                <span className="data-value">
                  {profileData?.legalCompliance?.bbbeeLevel || "N/A"}
                </span>
              </div>

               <div className="data-row">
                <span className="data-label">cipcStatus:</span>
                <span className="data-value">
                  {profileData?.legalCompliance?.cipcStatus || "N/A"}
                </span>
              </div>
               <div className="data-row">
                <span className="data-label">bbbeeCertRenewalDate:</span>
                <span className="data-value">
                  {profileData?.legalCompliance?.licenseRequired || "N/A"}
                </span>
              </div>

              
              {profileData?.legalCompliance?.licenseRequired && (
                <>
                  <div className="data-row">
                    <span className="data-label">License Type:</span>
                    <span className="data-value">
                      {profileData?.legalCompliance?.licenseType || "N/A"}
                    </span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">License Number:</span>
                    <span className="data-value">
                      {profileData?.legalCompliance?.licenseNumber || "N/A"}
                    </span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">License Document:</span>
                    <span className="data-value">
                      {renderDocumentLink(profileData?.legalCompliance?.licenseDoc, "License Document")}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="profile-section">
        <div 
          className="section-header" 
          onClick={() => toggleSection("productsServices")}
        >
          <h2>Products & Services</h2>
          {expandedSections.productsServices ? <ChevronUp /> : <ChevronDown />}
        </div>
        
        {expandedSections.productsServices && (
          <div className="section-content">
            <div className="data-grid">
              <div className="data-row">
                <span className="data-label">Entity Type:</span>
                <span className="data-value">
                  {profileData?.productsServices?.entityType === "smse" ? "SMSE (Small & Medium Service Enterprise)" : 
                   profileData?.productsServices?.entityType === "npo" ? "NPO (Non-Profit Organization)" : 
                   profileData?.productsServices?.entityType || "N/A"}
                </span>
              </div>
              <div className="data-row">
                <span className="data-label">Industry:</span>
                <span className="data-value">
                  {profileData?.productsServices?.industry || "N/A"}
                </span>
              </div>
              <div className="data-row">
                <span className="data-label">Company Size:</span>
                <span className="data-value">
                  {profileData?.productsServices?.companySize || "N/A"} employees
                </span>
              </div>
              <div className="data-row">
                <span className="data-label">Annual Turnover:</span>
                <span className="data-value">
                  {profileData?.productsServices?.annualTurnover || "N/A"}
                </span>
              </div>
              <div className="data-row">
                <span className="data-label">Years in Business:</span>
                <span className="data-value">
                  {profileData?.productsServices?.yearsInBusiness || "N/A"}
                </span>
              </div>
            </div>
            
            
            <h3>Products</h3>
            {renderProducts(profileData?.productsServices?.productCategories.products)}
            
            <h3>Services</h3>
            {renderCategoriesList(profileData?.productsServices?.serviceCategories.services)}
            
            <h3>Key Clients</h3>
            {renderKeyClients(profileData?.productsServices?.keyClients)}
          </div>
        )}
      </div>
      
      <div className="profile-section">
        <div 
          className="section-header" 
          onClick={() => toggleSection("howDidYouHear")}
        >
          <h2>How Did You Hear About Us</h2>
          {expandedSections.howDidYouHear ? <ChevronUp /> : <ChevronDown />}
        </div>
        
        {expandedSections.howDidYouHear && (
          <div className="section-content">
            <div className="data-grid">
              <div className="data-row">
                <span className="data-label">Source:</span>
                <span className="data-value">
                  {profileData?.howDidYouHear?.source || "N/A"}
                </span>
              </div>
              {profileData?.howDidYouHear?.referralName && (
                <div className="data-row">
                  <span className="data-label">Referral Name:</span>
                  <span className="data-value">
                    {profileData?.howDidYouHear?.referralName}
                  </span>
                </div>
              )}
              {profileData?.howDidYouHear?.otherSource && (
                <div className="data-row">
                  <span className="data-label">Other Source:</span>
                  <span className="data-value">
                    {profileData?.howDidYouHear?.otherSource}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="profile-section">
        <div 
          className="section-header" 
          onClick={() => toggleSection("declarationConsent")}
        >
          <h2>Declaration & Consent</h2>
          {expandedSections.declarationConsent ? <ChevronUp /> : <ChevronDown />}
        </div>
        
        {expandedSections.declarationConsent && (
          <div className="section-content">
            <div className="data-grid">
              <div className="data-row">
                <span className="data-label">Information Accuracy:</span>
                <span className="data-value">
                  {profileData?.declarationConsent?.accuracy ? "Confirmed" : "Not Confirmed"}
                </span>
              </div>
              <div className="data-row">
                <span className="data-label">Data Processing Consent:</span>
                <span className="data-value">
                  {profileData?.declarationConsent?.dataProcessing ? "Provided" : "Not Provided"}
                </span>
              </div>
              <div className="data-row">
                <span className="data-label">Terms & Conditions:</span>
                <span className="data-value">
                  {profileData?.declarationConsent?.termsConditions ? "Accepted" : "Not Accepted"}
                </span>
              </div>
              {profileData?.declarationConsent?.submissionDate && (
                <div className="data-row">
                  <span className="data-label">Submission Date:</span>
                  <span className="data-value">
                    {formatDate(profileData?.declarationConsent?.submissionDate)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="profile-view-actions">
        <button onClick={() => window.history.back()} className="btn btn-secondary">
          Back
        </button>
        <button 
          onClick={() => window.location.href = "/edit-profile"} 
          className="btn btn-primary"
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
}