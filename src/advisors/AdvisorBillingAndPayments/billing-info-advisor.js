"use client"

import { useState, useEffect } from "react";
import { getFirestore, collection, query, where, getDocs,getDoc,doc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";


const BillingInfoInvestors = ({
  email: initialEmail = "",
  fullName: initialFullName = "",
  companyName: initialCompanyName = "",
  setEmail: setParentEmail = () => { },
  setFullName: setParentFullName = () => { },
  setCompanyName: setParentCompanyName = () => { },
}) => {
  const [activeTab, setActiveTab] = useState("billing-history");
const [firebaseData,setFirebaseData] =useState({});
  // Local editable state
  const [email, setEmail] = useState(initialEmail);
  const [fullName, setFullName] = useState(initialFullName);
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [country, setCountry] = useState("South Africa");
  const [stateRegion, setStateRegion] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [taxId, setTaxId] = useState("");
  const [emailInvoices, setEmailInvoices] = useState(false);
  const [errors, setErrors] = useState({});
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [growthTools, setGrowthTools] = useState([]);
  const [loadingGrowthTools, setLoadingGrowthTools] = useState(true);

  const billingStyles = {
    statusBadgeSuccess: {
  backgroundColor: "#dcfce7",
  color: "#15803d",
  padding: "0.25rem 0.6rem",
  borderRadius: "9999px",
  fontSize: "0.75rem",
  fontWeight: 600,
  textTransform: "capitalize",
},

    invoiceBtnGreen: {
  backgroundColor: "#10b981", // Tailwind's green-500
  color: "white",
  border: "none",
  padding: "0.4rem 0.75rem",
  fontSize: "0.75rem",
  borderRadius: "0.375rem",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "0.25rem",
  transition: "background-color 0.3s ease",
},

invoiceBtnGreenHover: {
  backgroundColor: "#059669", // Tailwind's green-600
},

    tableResponsive: {
    width: "100%",
    overflowX: "auto",
  },
  transactionTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.875rem",
    backgroundColor: "white",
    borderRadius: "0.5rem",
    overflow: "hidden",
    border: "1px solid #e0cec7",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  },
  transactionThTd: {
    padding: "0.75rem 1rem",
    border: "1px solid #e0cec7",
    textAlign: "left",
    verticalAlign: "middle",
  },
  transactionTh: {
    backgroundColor: "#f2e8e5",
    fontWeight: 600,
  },
  transactionId: {
    fontFamily: "monospace",
    fontSize: "0.75rem",
  },
  datetimeCell: {
    display: "flex",
    flexDirection: "column",
    fontSize: "0.875rem",
  },
  amountFree: {
    color: "#10b981",
    fontWeight: 600,
  },
  amountPaid: {
    color: "#1f2937",
    fontWeight: 500,
  },
  statusBadge: {
    display: "inline-block",
    padding: "0.25rem 0.6rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "capitalize",
  },
  statusSuccess: {
    backgroundColor: "#dcfce7",
    color: "#15803d",
  },
  statusCancelled: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  statusActive: {
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
  },
  actionButtons: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  downloadBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    backgroundColor: "#846358",
    color: "white",
    border: "none",
    padding: "0.4rem 0.75rem",
    fontSize: "0.75rem",
    borderRadius: "0.375rem",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
  downloadBtnHover: {
    backgroundColor: "#684d43",
  },
  cancelledText: {
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "#6b7280",
  },
  freeText: {
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "#6b7280",
  },
  billingContainer: {
    maxWidth: "70%",
    margin: "2rem auto",
    padding: "2rem 3rem",
    backgroundColor: "white",
    borderRadius: "0.75rem",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
  },
  sectionTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#1f2937",
    marginBottom: "1.5rem",
  },
  tabNavigation: {
    display: "flex",
    borderBottom: "1px solid #e0cec7",
    marginBottom: "1.5rem",
  },
  tabButton: {
    padding: "0.75rem 1.5rem",
    fontWeight: 500,
    textAlign: "center",
    transition: "background-color 0.3s, color 0.3s",
    borderTopLeftRadius: "0.5rem",
    borderTopRightRadius: "0.5rem",
    cursor: "pointer",
  },
  tabButtonActive: {
    backgroundColor: "#846358",
    color: "white",
  },
  
  tabButtonInactive: {
    backgroundColor: "#f2e8e5",
    color: "#684d43",
  },
  tabButtonInactiveHover: {
    backgroundColor: "#eaddd7",
  },
  tabContent: {
    padding: "2rem",
  },
  formGroup: {
    marginBottom: "1.5rem",
  },
  formLabel: {
    display: "block",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#503f37",
    marginBottom: "0.5rem",
  },
  formInput: {
    display: "block",
    width: "100%",
    padding: "0.75rem 1rem",
    marginBottom: "0.25rem",
    borderRadius: "0.375rem",
    border: "1px solid #d2bab0",
    transition: "border-color 0.3s, box-shadow 0.3s",
  },
  formError: {
    color: "#e53e3e",
    fontSize: "0.875rem",
    marginBottom: "0.75rem",
  },
  button: {
    display: "block",
    width: "100%",
    padding: "0.75rem 1rem",
    backgroundColor: "#846358",
    color: "white",
    borderRadius: "0.375rem",
    marginTop: "1.5rem",
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  buttonHover: {
    backgroundColor: "#684d43",
  },
  paymentMethodContainer: {
    padding: "1.5rem",
    backgroundColor: "#fdf8f6",
    borderRadius: "0.5rem",
    border: "1px solid #eaddd7",
    marginBottom: "1.5rem",
  },
  paymentMethodTitle: {
    fontSize: "1.125rem",
    fontWeight: 600,
    color: "#503f37",
    marginBottom: "0.5rem",
  },
  emptyState: {
    padding: "2rem",
    textAlign: "center",
    backgroundColor: "#fdf8f6",
    borderRadius: "0.5rem",
    border: "1px solid #eaddd7",
    color: "#6b7280",
    fontStyle: "italic",
    fontSize: "0.875rem",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(1, 1fr)",
    gap: "1rem",
    marginTop: "1.5rem",
  },
  summaryCard: {
    padding: "1rem",
    textAlign: "center",
    borderRadius: "0.5rem",
  },
  summaryCardSuccess: {
    backgroundColor: "#dcfce7",
    border: "1px solid #bbf7d0",
  },
  summaryCardFailed: {
    backgroundColor: "#fee2e2",
    border: "1px solid #fecaca",
  },
  summaryCardCancelled: {
    backgroundColor: "#fef3c7",
    border: "1px solid #fde68a",
  },
  summaryValue: {
    fontSize: "1.5rem",
    fontWeight: 700,
  },
  summaryValueSuccess: {
    color: "#16a34a",
  },
  summaryValueFailed: {
    color: "#b91c1c",
  },
  summaryValueCancelled: {
    color: "#92400e",
  },
  summaryLabel: {
    fontSize: "0.875rem",
    fontWeight: 500,
  },
  summaryLabelSuccess: {
    color: "#15803d",
  },
  summaryLabelFailed: {
    color: "#991b1b",
  },
  summaryLabelCancelled: {
    color: "#78350f",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "1rem",
  },
  "@media (min-width: 768px)": {
    formRow: {
      gridTemplateColumns: "repeat(2, 1fr)",
    },
    summaryGrid: {
      gridTemplateColumns: "repeat(4, 1fr)",
    },
  },
};


  // Sync local state with parent setters
  useEffect(() => {
    setParentEmail(email);
  }, [email, setParentEmail]);

  useEffect(() => {
    setParentFullName(fullName);
  }, [fullName, setParentFullName]);

  useEffect(() => {
    setParentCompanyName(companyName);
  }, [companyName, setParentCompanyName]);

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) newErrors.email = "Email is required";
    else if (!emailRegex.test(email)) newErrors.email = "Enter a valid email";

    if (!fullName) newErrors.fullName = "Full name is required";
    if (!companyName) newErrors.companyName = "Company name is required";
    if (!country) newErrors.country = "Country is required";
    if (!stateRegion) newErrors.stateRegion = "State/Region is required";
    if (!address) newErrors.address = "Address is required";
    if (!city) newErrors.city = "City is required";
    if (!postalCode) newErrors.postalCode = "Postal code is required";
    if (!taxId) newErrors.taxId = "Tax ID is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      alert("Billing information saved successfully!");
    }
  };

  // Utility to generate a simple invoice PDF
  function generateInvoicePDF(transaction) {
    const doc = new jsPDF();

    // Header Logo
    const logoImg = "./ourLogo.png"; // Replace with Base64 if inline
    //doc.addImage(logoImg, "PNG", 160, 10, 40, 12); // Optional

    doc.setFontSize(16);
    doc.setTextColor(100);
    doc.text("INVOICE", 14, 20);

    doc.setFontSize(10);
    doc.text("2040 Broadacres Drive", 14, 30);
    doc.text("Dainfern", 14, 35);
    doc.text("Sandton, GP, 2055", 14, 40);

    doc.setFontSize(10);
    doc.setFont("Helvetica", "bold");
    doc.text("Invoice Date:", 140, 30);
    doc.text("Invoice:", 140, 35);

    doc.setFont("Helvetica", "normal");
    doc.text(new Date(transaction.createdAt).toLocaleDateString(), 165, 30);
    const invoiceId = transaction.id || "N/A";
    doc.setFontSize(9);
    doc.text(doc.splitTextToSize(transaction.invoiceNumber||invoiceId, 30), 165, 35); // Wraps if it's long

    // BILL TO
    doc.setFont("Helvetica", "bold");
    doc.text("BILL TO:", 14, 50);
    doc.setFont("Helvetica", "normal");
    doc.text(transaction.fullName || "Customer Name", 14, 55);
    doc.text(transaction.companyName || "-", 14, 60);
    doc.text(firebaseData.contactDetails?.physicalAddress ||"11 Crescent Drive, Melrose Arch", 14, 65);
    doc.text(firebaseData.contactDetails?.postalAddress ||"Johannesburg, GP, 2196", 14, 70);

    // Table Header
    doc.setFillColor(228, 220, 214); // light beige
    doc.rect(14, 80, 182, 8, "F");
    doc.setTextColor(80);
    doc.setFontSize(10);
    doc.text("DESCRIPTION", 16, 85);
    doc.text("QUANTITY", 96, 85);
    doc.text("RATE", 136, 85);
    doc.text("AMOUNT", 176, 85);

    // Table Row
    doc.setTextColor(50);
    doc.text(transaction.plan + " Subscription", 16, 95);
    doc.text("1.00", 98, 95);
    doc.text(`R${transaction.amount.toFixed(2)}`, 136, 95);
    doc.text(`R${transaction.amount.toFixed(2)}`, 176, 95);

    // Summary
    let subtotal = transaction.amount;
    let taxRate = 0.15;
    let vat = subtotal * taxRate;
    let total = subtotal + vat;

    doc.line(14, 105, 196, 105); // separator

    doc.setFont("Helvetica", "normal");
    doc.text("SUBTOTAL", 150, 112);
    doc.text(`R${subtotal.toFixed(2)}`, 180, 112, { align: "right" });

    doc.text("TAX RATE", 150, 118);
    doc.text("15.00%", 180, 118, { align: "right" });

    doc.text("VAT", 150, 124);
    doc.text(`R${vat.toFixed(2)}`, 180, 124, { align: "right" });

    doc.setFillColor(200, 180, 160);
    doc.rect(14, 130, 182, 8, "F");
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(60);
    doc.text("TOTAL", 150, 136);
    doc.text(`R${total.toFixed(2)}`, 180, 136, { align: "right" });

    // Terms & Banking
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(100);
    doc.setFontSize(9);
    doc.text("Terms & Conditions", 14, 150);
    doc.text("Payment is due within 7 days", 150, 150);

    doc.text("BANKING DETAILS.", 14, 160);
    doc.text("BRANCH - Rivonia branch", 14, 165);
    doc.text("BRANCH CODE 19630500", 14, 170);
    doc.text("BANK ACCOUNT - 1145498108", 14, 175);

    doc.text("Send Proof of payment to", 150, 165);
    doc.text("hello@bigmarketplace.africa", 150, 170);

    doc.setFontSize(10);
    doc.setTextColor(50);
    doc.text("THANK YOU FOR YOUR BUSINESS!", 105, 190, { align: "center" });

    return doc;
  }

  // Utility to download the invoice PDF
  function downloadInvoice(transaction) {
    const doc = generateInvoicePDF(transaction);
    doc.save(`Invoice_${transaction.id || "unknown"}.pdf`);
  }

  useEffect(() => {
    const auth = getAuth();
    let unsubscribeAuth;

    const fetchHistory = async (user) => {
      setLoadingHistory(true);
      try {
        if (!user) {
          setHistory([]);
          setLoadingHistory(false);
          return;
        }
        
        const db = getFirestore();
        
          const docRef = doc(db, "MyuniversalProfiles", user.uid)
                const docSnap = await getDoc(docRef)
                
               
                let firebaseCompletedSections = null
                let firebaseSubmissionStatus = false
                
                if (docSnap.exists()) {
                  const data = docSnap.data()
                  setFirebaseData(data.formData)
                  firebaseCompletedSections = data.completedSections
                }
        const transactionsRef = collection(db, "subscriptions");
        const q = query(transactionsRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const transactions = [];
        querySnapshot.forEach((doc) => {
          transactions.push({ id: doc.id, ...doc.data() });
        });
        // Sort by date descending
        transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setHistory(transactions);
      } catch (error) {
        setHistory([]);
      }
      setLoadingHistory(false);
    };

    unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      fetchHistory(user);
    });

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  //  const GetuserName = async () => {
  //    const auth = getAuth();
  //      const db = getFirestore();
  //   try {
  //     if (!auth.currentUser) return;

  //     const userDocRef = doc(db, 'users', auth.currentUser.uid);
  //     const userDocSnap = await getDoc(userDocRef);

  //     if (userDocSnap.exists()) {
  //       setFullName(userDocSnap.data().username || userDocSnap.data().company || auth.currentUser.email.split('@')[0] || "Name Not Found/pre change profile");
  //     } else {
  //       console.log('User document not found!');
  //       setFullName("User");
  //     }
  //   } catch (error) {
  //     console.error('Error getting username:', error);
  //     setFullName("User");
  //   }
  // };

  useEffect(() => {
    const fetchGrowthTools = async () => {
      setLoadingGrowthTools(true);
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          setGrowthTools([]);
          setLoadingGrowthTools(false);
          return;
        }
        const db = getFirestore();
        const purchasesRef = collection(db, "growthToolsPurchases");
        const q = query(purchasesRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const purchases = [];
        querySnapshot.forEach((doc) => {
          purchases.push({ id: doc.id, ...doc.data() });
        });
        // Sort by date descending
        purchases.sort((a, b) => new Date(b.createdAt?.toDate?.() || b.createdAt) - new Date(a.createdAt?.toDate?.() || a.createdAt));
        setGrowthTools(purchases);
      } catch (error) {
        setGrowthTools([]);
      }
      setLoadingGrowthTools(false);
    };

    fetchGrowthTools();
  }, []);

return (
  <div style={billingStyles.billingContainer}>
    <div style={billingStyles.tabNavigation}>
      {["billing-history", "billing-info", "payment-methods"].map((tab) => (
        <button
          key={tab}
          style={{
            ...billingStyles.tabButton,
            ...(activeTab === tab
              ? billingStyles.tabButtonActive
              : billingStyles.tabButtonInactive),
          }}
          onClick={() => setActiveTab(tab)}
        >
          {tab === "billing-history"
            ? "Subscription History"
            : tab === "billing-info"
            ? "Success Fee History"
            : "Growth tools"}
        </button>
      ))}
    </div>

    <div style={billingStyles.tabContent}>
      {activeTab === "billing-info" && (
        <div>
          <h2 style={billingStyles.sectionTitle}>Success Fee History</h2>
       <div style={billingStyles.tableResponsive}>
  <table style={billingStyles.transactionTable}>
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Plan</th>
                  <th>Cycle</th>
                  <th>Amount</th>
                  <th>Date & Time</th>
                  <th>Reference</th>
                  <th>Actions</th>
                  <th>Payment Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={8} style={{ textAlign: "center" }}>
                    No transaction history available yet.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "payment-methods" && (
        <div>
          <h2 style={billingStyles.sectionTitle}>Growth Tools Purchases</h2>
          {loadingGrowthTools ? (
            <div>Loading...</div>
          ) : growthTools.length > 0 ? (
           <div style={billingStyles.tableResponsive}>
  <table style={billingStyles.transactionTable}>

                <thead>
                  <tr>
                    <th>Package</th>
                    <th>Tier</th>
                    <th>Price</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {growthTools.map((purchase) => {
                    const dateObj = purchase.createdAt?.toDate
                      ? purchase.createdAt.toDate()
                      : new Date(purchase.createdAt);
                    const date = dateObj
                      ? dateObj.toLocaleDateString()
                      : "N/A";
                    return (
                      <tr key={purchase.id}>
                         <td style={billingStyles.transactionThTd}>{purchase.packageTitle}</td>
                         <td style={billingStyles.transactionThTd}>{purchase.tierName}</td>
                         <td style={billingStyles.transactionThTd}>{purchase.price}</td>
                         <td style={billingStyles.transactionThTd}>{date}</td>
                         <td style={billingStyles.transactionThTd}>
                          <span className={`status-badge status-${purchase.status?.toLowerCase()}`}>
                            {purchase.status}
                          </span>
                        </td>
                         <td style={billingStyles.transactionThTd}>
                          {purchase.reference ? (
                            <span className="ref-link">{purchase.reference.slice(0, 12)}...</span>
                          ) : (
                            <span className="no-ref">N/A</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={billingStyles.emptyState}>
              <p>No growth tools purchases yet.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "billing-history" && (
        <div>
          <h2 style={billingStyles.sectionTitle}>Subscription History</h2>
          {loadingHistory ? (
            <div>Loading...</div>
          ) : (
       <div style={billingStyles.tableResponsive}>
  <table style={billingStyles.transactionTable}>
<thead>
  <tr>
    <th style={{ ...billingStyles.transactionThTd, ...billingStyles.transactionTh }}>Invoice ID</th>
    <th style={{ ...billingStyles.transactionThTd, ...billingStyles.transactionTh }}>Plan</th>
    <th style={{ ...billingStyles.transactionThTd, ...billingStyles.transactionTh }}>Cycle</th>
    <th style={{ ...billingStyles.transactionThTd, ...billingStyles.transactionTh }}>Amount</th>
    <th style={{ ...billingStyles.transactionThTd, ...billingStyles.transactionTh }}>Date & Time</th>

    
    <th style={{ ...billingStyles.transactionThTd, ...billingStyles.transactionTh }}>Invoice</th>
        <th style={{ ...billingStyles.transactionThTd, ...billingStyles.transactionTh }}>Payment Status</th>
  </tr>
</thead>
                <tbody>
                  {history.length > 0 ? (
                    history.map((entry) => {
                      const dateObj = new Date(entry.createdAt);
                      const date = dateObj.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      });
                      const time = dateObj.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      });
                      return (
                        <tr key={entry.id}>
                           <td style={billingStyles.transactionThTd}>
                            <span className="transaction-id">
                              {entry.invoiceNumber || entry.id}...
                            </span>
                          </td>
                           <td style={billingStyles.transactionThTd}>
                            <div className="plan-cell">
                              <span className="plan-name-normal">{entry.plan}</span>
                              {entry.action && (
                                <span className={`action-badge action-${entry.action}`}>
                                  {entry.action}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={billingStyles.transactionThTd}>
                            <span className="cycle-badge">{entry.cycle}</span>
                          </td>
                         <td style={billingStyles.transactionThTd}>
                            <span className={`amount ${entry.amount === 0 ? "free" : "paid"}`}>
                              {entry.amount === 0 ? "Free" : `ZAR ${entry.amount}.00`}
                            </span>
                          </td>
                          <td style={billingStyles.transactionThTd}>
                            <div className="datetime-cell">
                              <span className="date">{date}</span>
                              <span className="time">{time}</span>
                            </div>
                          </td>
                          
                           {/* <td style={billingStyles.transactionThTd}>
                            {entry.transactionRef ? (
                              <span className="ref-link">{entry.transactionRef.slice(0, 12)}...</span>
                            ) : (
                              <span className="no-ref">N/A</span>
                            )}
                          </td> */}
                           <td style={billingStyles.transactionThTd}>
                            <div className="action-buttons">
                              {["Success", "Paid", "Active"].includes(entry.status) &&
                              entry.amount > 0 ? (
                                <>
                                  <button
                                    className="download-btn"
                                    onClick={() => downloadInvoice(entry)}
                                  >
                                    📄 <span className="btn-text">Download</span>
                                  </button>
                                  <button
                                    className="view-btn"
                                    onClick={() => {
                                      try {
                                        const doc = generateInvoicePDF(entry);
                                        doc.output("dataurlnewwindow");
                                      } catch {
                                        alert("Preview failed, please download instead.");
                                      }
                                    }}
                                  >
                                    👁️ <span className="btn-text">View</span>
                                  </button>
                                </>
                              ) : entry.status === "Cancelled" ? (
                                <span className="cancelled-text">No Invoice</span>
                              ) : (
                                <span className="free-text">Free Plan</span>
                              )}
                            </div>
                          </td>
                           <td style={billingStyles.transactionThTd}>
                            <span style={billingStyles.statusBadgeSuccess}>
                              {entry.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center" }}>
                        No subscription history available yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {/* <p style={billingStyles.formLabel}>
                💡 <strong>Note:</strong> Invoices are available for successful payments only.
              </p> */}
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);
}


export default BillingInfoInvestors;