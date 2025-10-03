import React, { useState, useRef, useEffect } from 'react';
import './signuppop.css';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadString, getDownloadURL, uploadBytes } from 'firebase/storage';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebaseConfig';
// Import jsPDF for PDF generation
import { jsPDF } from 'jspdf';

const NDASignupPopup = ({ onRegistrationComplete, registrationData }) => {
  // Extract registration data from props with default values to prevent undefined errors
  const initialUserInfo = {
    email: registrationData?.email || '',
    role: registrationData?.role || '',
    username: registrationData?.username || '',
    password: registrationData?.password || '', 
    uid: registrationData?.uid || '' 
  };

  const [showNDA, setShowNDA] = useState(true); // Start showing the NDA
  const [signatureData, setSignatureData] = useState(null);
  const [userInfo, setUserInfo] = useState(initialUserInfo);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [savedNDA, setSavedNDA] = useState(null);
  const [loading, setLoading] = useState(false);
  const [signedPdfUrl, setSignedPdfUrl] = useState(null);
  const canvasRef = useRef(null);
  const ndaContentRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfcXO4GbNdPFY7qGbjwH1z3A78FwXiFAE",
  authDomain: "tuts-7ea8c.firebaseapp.com",
  projectId: "tuts-7ea8c",
  storageBucket: "tuts-7ea8c.appspot.com",
  messagingSenderId: "546514581101",
  appId: "1:546514581101:web:a34e661b6cad46f01db164",
  measurementId: "G-LK13NE8TBS"
};

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const storage = getStorage(app);
  const db = getFirestore(app);
  const firebaseAuth = getAuth(app);

  // Handle data passed from registration screen
  useEffect(() => {
    if (registrationData && Object.keys(registrationData).length > 0) {
      // Make sure to properly set userInfo with valid data or defaults
      setUserInfo({
        email: registrationData.email || '',
        role: registrationData.role || '',
        username: registrationData.username || '',
        password: registrationData.password || '',
        uid: registrationData.uid || ''
      });
      
      // Only show NDA if we have the required data
      if (registrationData.email && registrationData.role && registrationData.username) {
        setShowNDA(true);
      }
    }
  }, [registrationData]);
  
  // Handle NDA content scroll
  const handleScroll = () => {
    if (ndaContentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = ndaContentRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setIsScrolledToBottom(true);
      }
    }
  };

  // Canvas signature handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  // For touch devices
  const handleTouchStart = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const handleTouchMove = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDrawing = () => {
    if (isDrawing) {
      const canvas = canvasRef.current;
      setSignatureData(canvas.toDataURL('image/png', 0.7)); // Compress the image
      setIsDrawing(false);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  };

  // Handle user registration and NDA submission
  const handleSubmitNDA = async () => {
    if (!signatureData) {
      alert('Please sign the document before submitting');
      return;
    }

    // Validate required fields before proceeding
    if (!userInfo.email || !userInfo.username || !userInfo.role) {
      setErrorMessage('Required information is missing. Please ensure all fields are filled.');
      return;
    }

    setLoading(true);
    
    try {
      let userId = userInfo.uid || null;
      
      // 1. If user already has a UID (from registration in parent component), use it
      // Otherwise create a new user account if registration data is provided
      if (!userId && userInfo.email && userInfo.password) {
        try {
          const userCredential = await createUserWithEmailAndPassword(
            firebaseAuth, 
            userInfo.email, 
            userInfo.password
          );
          
          userId = userCredential.user.uid;
          console.log("New user created with ID:", userId);
        } catch (error) {
          console.error("Error creating user:", error);
          setErrorMessage(`Registration failed: ${error.message}`);
          setLoading(false);
          return;
        }
      } else if (!userId) {
        // Use current authenticated user if available or generate temp ID
        userId = auth.currentUser?.uid || `temp_${Date.now()}`;
      }
      
      // 2. Create the signed document with user info and date
      const signedDate = new Date();
      const signedDocument = {
        userInfo: {
          email: userInfo.email,
          username: userInfo.username,
          role: userInfo.role
        },
        signature: signatureData, // Base64 data URL
        ndaContent: "BIG Marketplace Mutual NDA",
        dateSigned: signedDate.toISOString(),
      };

      // 3. Upload signature image to Storage
      const signatureRef = ref(storage, `ndas/${userId}/signature`);
      await uploadString(signatureRef, signatureData, 'data_url');
      
      // 4. Get the download URL for the signature
      const signatureUrl = await getDownloadURL(signatureRef);
      
      // 5. Save NDA document to Firestore with the signature URL
      const ndaDocData = {
        userInfo: {
          email: userInfo.email,
          username: userInfo.username,
          role: userInfo.role
        },
        signatureUrl,
        ndaContent: "BIG Marketplace Mutual NDA",
        dateSigned: signedDate.toISOString(),
      };
      
      await setDoc(doc(db, "ndas", userId), ndaDocData);
      
      // 6. Generate and save PDF
      signedDocument.signatureUrl = signatureUrl;
      setSavedNDA(signedDocument);
      
      // 7. Generate PDF immediately after signing
      const pdfBlob = await generateAndSavePDF(signedDocument, userId);
      
      // 8. Close NDA popup and complete registration
      setShowNDA(false);
      setRegistrationComplete(true);
      
      // 9. Notify parent component that registration is complete with PDF URL
      if (onRegistrationComplete && typeof onRegistrationComplete === 'function') {
        onRegistrationComplete({
          userId,
          userInfo: signedDocument.userInfo,
          ndaSigned: true,
          pdfUrl: signedPdfUrl,
          signatureUrl
        });
      }
    } catch (error) {
      console.error("Error saving NDA:", error);
      setErrorMessage(`Error saving NDA: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Improved function to create PDF from NDA content
  const generateAndSavePDF = async (ndaData, userId) => {
    setLoading(true);
    try {
      // Create new PDF with A4 dimensions
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // 10mm margin
      
      // Add a header to the PDF
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('BIG MARKETPLACE MUTUAL NON-DISCLOSURE AGREEMENT (NDA)', pageWidth / 2, margin + 10, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Effective Date: Upon registration', pageWidth / 2, margin + 20, { align: 'center' });
      
      pdf.text('Applies To: All users of BIG Marketplace, including SMEs, Funders,', pageWidth / 2, margin + 30, { align: 'center' });
      pdf.text('Service Providers, Corporates, and Accelerators.', pageWidth / 2, margin + 40, { align: 'center' });
      
      // Add content sections
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      let yPosition = margin + 55;
      
      // Section 1: Purpose
      pdf.text('1. Purpose', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      
      const purposeText = [
        "This Mutual NDA governs the protection and non-disclosure of Confidential Information exchanged",
        "between BIG Marketplace users and between each user and Brown Ivory Group Proprietary Limited (\"BIG\")."
      ];
      
      yPosition += 8;
      purposeText.forEach(line => {
        pdf.text(line, margin, yPosition);
        yPosition += 5;
      });
      
      // Section 2: Definition of Confidential Information
      yPosition += 8;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('2. Definition of Confidential Information', margin, yPosition);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const definitionText = [
        "\"Confidential Information\" includes, but is not limited to: business plans, financial information,",
        "funding requirements, investment terms, product/service data, IP, customer data, documents, and",
        "any non-public business or personal data disclosed via the platform or through follow-up communications."
      ];
      
      yPosition += 8;
      definitionText.forEach(line => {
        pdf.text(line, margin, yPosition);
        yPosition += 5;
      });
      
      // Section 3: Mutual Obligations
      yPosition += 8;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('3. Mutual Obligations', margin, yPosition);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const obligationsText = [
        "All parties agree to:",
        "• Keep Confidential Information strictly confidential.",
        "• Use it solely for evaluation or engagement within the BIG Marketplace platform.",
        "• Not disclose it to third parties except employees or advisors who are bound by similar",
        "  confidentiality obligations."
      ];
      
      yPosition += 8;
      obligationsText.forEach(line => {
        pdf.text(line, margin, yPosition);
        yPosition += 5;
      });
      
      // Section 4: Permitted Disclosures
      yPosition += 8;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('4. Permitted Disclosures', margin, yPosition);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const permittedText = [
        "Information may be disclosed:",
        "• To advisors who have a need to know.",
        "• As required by law or legal process (with notice to the disclosing party).",
        "• If already in the public domain or lawfully obtained from another source."
      ];
      
      yPosition += 8;
      permittedText.forEach(line => {
        pdf.text(line, margin, yPosition);
        yPosition += 5;
      });
      
      // Section 5: Duration
      yPosition += 8;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('5. Duration', margin, yPosition);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const durationText = [
        "This NDA is valid:",
        "• For two years from date of last disclosure on the platform, or",
        "• Until the Confidential Information becomes publicly available through no fault of the receiving party."
      ];
      
      yPosition += 8;
      durationText.forEach(line => {
        pdf.text(line, margin, yPosition);
        yPosition += 5;
      });
      
      // Check if we need a new page
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = margin + 10;
      }
      
      // Section 6: Data Protection
      yPosition += 8;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('6. Data Protection', margin, yPosition);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const dataProtectionText = [
        "All users agree to comply with applicable data protection laws, including POPIA. Personal Information",
        "may not be misused, shared, or processed outside the intended platform purpose without explicit consent."
      ];
      
      yPosition += 8;
      dataProtectionText.forEach(line => {
        pdf.text(line, margin, yPosition);
        yPosition += 5;
      });
      
      // Section 7: Return or Destruction
      yPosition += 8;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('7. Return or Destruction', margin, yPosition);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const returnText = [
        "Upon written request, users must return or delete any Confidential Information shared with them",
        "via the platform."
      ];
      
      yPosition += 8;
      returnText.forEach(line => {
        pdf.text(line, margin, yPosition);
        yPosition += 5;
      });
      
      // Section 8: No License or IP Rights
      yPosition += 8;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('8. No License or IP Rights', margin, yPosition);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('No rights to Confidential Information or underlying IP are granted by this NDA.', margin, yPosition + 8);
      
      // Section 9: Breach & Enforcement
      yPosition += 20;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('9. Breach & Enforcement', margin, yPosition);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const breachText = [
        "Violation of this NDA may result in:",
        "• Removal from the BIG Marketplace platform,",
        "• Legal action and damages, and",
        "• Blacklisting from the ecosystem."
      ];
      
      yPosition += 8;
      breachText.forEach(line => {
        pdf.text(line, margin, yPosition);
        yPosition += 5;
      });
      
      // Section 10: Acceptance
      yPosition += 8;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('10. Acceptance', margin, yPosition);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const acceptanceText = [
        "By using the platform, you agree to this Mutual NDA. This agreement is binding and enforceable",
        "under South African law without requiring a physical signature."
      ];
      
      yPosition += 8;
      acceptanceText.forEach(line => {
        pdf.text(line, margin, yPosition);
        yPosition += 5;
      });
      
      // Add a new page for signature if needed
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = margin + 10;
      } else {
        yPosition += 20;
      }
      
      // Add signature information
      pdf.setFont('helvetica', 'bold');
      pdf.text('Signed by:', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(ndaData.userInfo.email, margin + 40, yPosition);
      
      yPosition += 10;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Username:', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(ndaData.userInfo.username, margin + 40, yPosition);
      
      yPosition += 10;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Role:', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(ndaData.userInfo.role, margin + 40, yPosition);
      
      yPosition += 10;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Date Signed:', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(new Date(ndaData.dateSigned).toLocaleDateString(), margin + 40, yPosition);
      
      // Add signature image
      yPosition += 15;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Signature:', margin, yPosition);
      
      // Handle different signature sources
      const signatureSource = ndaData.signature || ndaData.signatureUrl;
      
      if (signatureSource) {
        yPosition += 5;
        try {
          // Draw signature on the PDF
          await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              try {
                // Calculate aspect ratio to fit signature within reasonable bounds
                const maxWidth = 80; // 80mm max width
                const aspectRatio = img.width / img.height;
                const width = Math.min(maxWidth, img.width / 4); // Adjust scale as needed
                const height = width / aspectRatio;
                
                // Add the image to the PDF
                pdf.addImage(img, 'PNG', margin, yPosition, width, height, null, 'FAST');
                resolve();
              } catch (e) {
                reject(e);
              }
            };
            img.onerror = reject;
            img.src = signatureSource;
          });
        } catch (err) {
          console.error("Error adding signature to PDF:", err);
        }
      }
      
      // Get the PDF as a blob with compression settings
      const pdfBlob = pdf.output('blob');
      
      // Store PDF in Firebase Storage
      // Create a reference to the PDF file location
      const pdfRef = ref(storage, `ndas/${userId}/signed_nda.pdf`);
      
      // Upload the PDF blob to Firebase Storage
      await uploadBytes(pdfRef, pdfBlob);
      
      // Get the download URL
      const pdfUrl = await getDownloadURL(pdfRef);
      
      // Update the NDA document in Firestore with the PDF URL
      await setDoc(doc(db, "ndas", userId), { 
        ...ndaData,
        pdfUrl,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      
      // Update local state
      const updatedNDA = { ...savedNDA, pdfUrl };
      setSavedNDA(updatedNDA);
      setSignedPdfUrl(pdfUrl);
      
      console.log("PDF saved to Firebase Storage:", pdfUrl);
      
      return pdfBlob;
    } catch (error) {
      console.error("Error generating and saving PDF:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toLocaleDateString();

  return (
    <div className="container">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Processing document...</p>
        </div>
      )}
    
      {/* {registrationComplete && savedNDA && (
        <div className="success-message">
          <h1>NDA Complete!</h1>
          <p>Thank you for signing the NDA agreement. Your document has been saved.</p>
          <div className="user-info-box">
            {/* Safely access user information */}
            {/* <p><strong>Email:</strong> {savedNDA.userInfo?.email || 'N/A'}</p>
            <p><strong>Username:</strong> {savedNDA.userInfo?.username || 'N/A'}</p>
            <p><strong>Role:</strong> {savedNDA.userInfo?.role || 'N/A'}</p>
            <p><strong>Date Signed:</strong> {savedNDA.dateSigned ? new Date(savedNDA.dateSigned).toLocaleDateString() : 'N/A'}</p>
          </div>
          <div className="button-group">
            {signedPdfUrl && (
              <a 
                href={signedPdfUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-primary"
              >
                View Signed NDA
              </a>
            )}
            <button 
              className="btn btn-success"
              onClick={() => { */}
                {/* // Call onRegistrationComplete one more time as a safety measure
                if (onRegistrationComplete && typeof onRegistrationComplete === 'function') {
                  onRegistrationComplete({
                    userInfo: savedNDA.userInfo,
                    ndaSigned: true,
                    pdfUrl: signedPdfUrl
                  });
                }
              }}
            >
              Continue to Dashboard
            </button>
          </div>
        </div> */}
      
      {/* NDA Popup Dialog - Always visible until registrationComplete is true */}
      {showNDA && !registrationComplete && (
        <div className="popup-overlay">
          <div className="popup-content">
            <div className="popup-header">
              <h3>BIG Marketplace Mutual Non-Disclosure Agreement (NDA)</h3>
            </div>
            
            {errorMessage && (
              <div className="error-message">
                {errorMessage}
              </div>
            )}
            
            <div 
              ref={ndaContentRef}
              onScroll={handleScroll}
              className="nda-content"
            >
              <div className="nda-title">
                <h3>BIG MARKETPLACE MUTUAL NON-DISCLOSURE AGREEMENT (NDA)</h3>
                <p><strong>Effective Date:</strong> Upon registration</p>
                <p><strong>Applies To:</strong> All users of BIG Marketplace, including SMEs, Funders, Service Providers, Corporates, and Accelerators.</p>
              </div>
              
              <h4>1. Purpose</h4>
              <p>This Mutual NDA governs the protection and non-disclosure of Confidential Information exchanged between BIG Marketplace users and between each user and Brown Ivory Group Proprietary Limited ("BIG").</p>
              
              <h4>2. Definition of Confidential Information</h4>
              <p>"Confidential Information" includes, but is not limited to: business plans, financial information, funding requirements, investment terms, product/service data, IP, customer data, documents, and any non-public business or personal data disclosed via the platform or through follow-up communications.</p>
              
              <h4>3. Mutual Obligations</h4>
              <p>All parties agree to:</p>
              <ul>
                <li>Keep Confidential Information strictly confidential.</li>
                <li>Use it solely for evaluation or engagement within the BIG Marketplace platform.</li>
                <li>Not disclose it to third parties except employees or advisors who are bound by similar confidentiality obligations.</li>
              </ul>
              
              <h4>4. Permitted Disclosures</h4>
              <p>Information may be disclosed:</p>
              <ul>
                <li>To advisors who have a need to know.</li>
                <li>As required by law or legal process (with notice to the disclosing party).</li>
                <li>If already in the public domain or lawfully obtained from another source.</li>
              </ul>
              
              <h4>5. Duration</h4>
              <p>This NDA is valid:</p>
              <ul>
                <li>For <strong>two years from date of last disclosure</strong> on the platform, or</li>
                <li>Until the Confidential Information becomes publicly available through no fault of the receiving party.</li>
              </ul>
              
              <h4>6. Data Protection</h4>
              <p>All users agree to comply with applicable data protection laws, including POPIA. Personal Information may not be misused, shared, or processed outside the intended platform purpose without explicit consent.</p>
              
              <h4>7. Return or Destruction</h4>
              <p>Upon written request, users must return or delete any Confidential Information shared with them via the platform.</p>
              
              <h4>8. No License or IP Rights</h4>
              <p>No rights to Confidential Information or underlying IP are granted by this NDA.</p>
              
              <h4>9. Breach & Enforcement</h4>
              <p>Violation of this NDA may result in:</p>
              <ul>
                <li>Removal from the BIG Marketplace platform,</li>
                <li>Legal action and damages, and</li>
                <li>Blacklisting from the ecosystem.</li>
              </ul>
              
              <h4>10. Acceptance</h4>
              <p>By using the platform, you agree to this Mutual NDA. This agreement is binding and enforceable under South African law without requiring a physical signature.</p>
              
              <p className="nda-note"><strong>Note:</strong> By signing below, you acknowledge that you have read and agree to the full terms and conditions of the BIG Marketplace Mutual Non-Disclosure Agreement.</p>
                       <div className="signature-section">
              <div className="signature-info">
                <p><strong>Date:</strong> {today}</p>
                <p><strong>Username:</strong> {userInfo.username || 'N/A'}</p>
                <p><strong>Email:</strong> {userInfo.email || 'N/A'}</p>
                <p><strong>Role:</strong> {userInfo.role || 'N/A'}</p>
                <p><strong>Signature:</strong></p>
                
                <div className="signature-canvas-container">
                  <canvas 
                    ref={canvasRef} 
                    width="400" 
                    height="100"
                    className="signature-canvas"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={endDrawing}
                    onMouseLeave={endDrawing}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={endDrawing}
                  />
                </div>
                
                <button 
                  onClick={clearSignature}
                  className="clear-signature-btn"
                >
                  Clear Signature
                </button>
              </div>
              
              <div className="button-group">
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    // If the user cancels, we should call onRegistrationComplete with a cancelled status
                    if (onRegistrationComplete && typeof onRegistrationComplete === 'function') {
                      onRegistrationComplete({
                        cancelled: true
                      });
                    }
                  }}
                >
                  Cancel
                </button>
                
                <button 
                  className={`btn ${isScrolledToBottom && signatureData ? 'btn-success' : 'btn-disabled'}`}
                  disabled={!isScrolledToBottom || !signatureData}
                  onClick={handleSubmitNDA}
                >
                  I Agree & Sign
                </button>
              </div>
            </div>
            
   
              
              {!isScrolledToBottom && (
                <p className="warning-text">Please scroll through the entire document before signing.</p>
              )}
              
              {!signatureData && isScrolledToBottom && (
                <p className="warning-text">Please sign the document.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NDASignupPopup;