// components/BillingHistory/ReusableBillingHistory.js
"use client";
import { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { getBillingHistoryStyles } from "./Styles";
import { colors } from "../../shared/theme";

// Import mock data from a separate file (create this file)
import {
  mockSuccessFeeData,
  mockGrowthToolsData,
} from "../../config/billingHistoryConfig";

const ReusableBillingHistory = ({
  userType = "investor",
  email: initialEmail = "",
  fullName: initialFullName = "",
  companyName: initialCompanyName = "",
  setEmail: setParentEmail = () => {},
  setFullName: setParentFullName = () => {},
  setCompanyName: setParentCompanyName = () => {},
}) => {
  const [activeTab, setActiveTab] = useState("billing-history");
  const [firebaseData, setFirebaseData] = useState({});
  const [email, setEmail] = useState(initialEmail);
  const [fullName, setFullName] = useState(initialFullName);
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [growthTools, setGrowthTools] = useState([]);
  const [loadingGrowthTools, setLoadingGrowthTools] = useState(true);
  
  const successFeeData =
    mockSuccessFeeData[userType] || mockSuccessFeeData.investor;
  const growthToolsData = userType === "sme" ? mockGrowthToolsData : [];

  // Get styles based on user type and sidebar state
  const styles = getBillingHistoryStyles(userType);
  const { userConfig } = styles;

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

  // Utility to convert hex color to RGB array for jsPDF
  const hexToRgbArray = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };

  // 2. Update all PDF generation functions to use correct jsPDF color methods
  function generateInvoicePDF(transaction) {
    const doc = new jsPDF();

    // Header - FIXED: Use spread operator for RGB values
    doc.setFontSize(16);
    doc.setTextColor(...hexToRgbArray(colors.mediumBrown)); // Spread the array
    doc.text("INVOICE", 14, 20);

    doc.setFontSize(10);
    doc.text("2040 Broadacres Drive", 14, 30);
    doc.text("Dainfern", 14, 35);
    doc.text("Sandton, GP, 2055", 14, 40);

    // Invoice details
    doc.setFontSize(10);
    doc.setFont("Helvetica", "bold");
    doc.text("Invoice Date:", 140, 30);
    doc.text("Invoice:", 140, 35);
    doc.setFont("Helvetica", "normal");
    doc.text(
      transaction.createdAt
        ? new Date(transaction.createdAt).toLocaleDateString()
        : "-",
      165,
      30
    );

    const invoiceId = transaction.invoiceNumber || transaction.id || "N/A";
    doc.setFontSize(9);
    doc.text(doc.splitTextToSize(invoiceId, 30), 165, 35);

    // BILL TO
    doc.setFont("Helvetica", "bold");
    doc.text("BILL TO:", 14, 50);
    doc.setFont("Helvetica", "normal");
    doc.text(transaction.fullName || fullName || "Customer Name", 14, 55);
    doc.text(transaction.companyName || companyName || "-", 14, 60);
    doc.text(
      firebaseData.contactDetails?.physicalAddress ||
        "11 Crescent Drive, Melrose Arch",
      14,
      65
    );
    doc.text(
      firebaseData.contactDetails?.postalAddress || "Johannesburg, GP, 2196",
      14,
      70
    );

    // Table header - FIXED: setFillColor also needs spread operator
    doc.setFillColor(...hexToRgbArray(colors.cream)); // Spread for setFillColor too
    doc.rect(14, 80, 182, 8, "F");
    doc.setTextColor(...hexToRgbArray(colors.mediumBrown));
    doc.setFontSize(10);
    doc.text("DESCRIPTION", 16, 85);
    doc.text("QUANTITY", 96, 85);
    doc.text("RATE", 136, 85);
    doc.text("AMOUNT", 176, 85);

    // Table content
    doc.setTextColor(...hexToRgbArray(colors.darkBrown));
    doc.text(transaction.plan + " Subscription", 16, 95);
    doc.text("1.00", 98, 95);
    doc.text(`R${transaction.amount?.toFixed(2) || "0.00"}`, 136, 95);
    doc.text(`R${transaction.amount?.toFixed(2) || "0.00"}`, 176, 95);

    // Calculations
    const subtotal = transaction.amount || 0;
    const taxRate = 0.15;
    const vat = subtotal * taxRate;
    const total = subtotal + vat;

    doc.line(14, 105, 196, 105); // separator
    doc.setFont("Helvetica", "normal");
    doc.text("SUBTOTAL", 150, 112);
    doc.text(`R${subtotal.toFixed(2)}`, 180, 112, { align: "right" });
    doc.text("TAX RATE", 150, 118);
    doc.text("15.00%", 180, 118, { align: "right" });
    doc.text("VAT", 150, 124);
    doc.text(`R${vat.toFixed(2)}`, 180, 124, { align: "right" });

    // Total section - FIXED
    doc.setFillColor(...hexToRgbArray(colors.lightBrown));
    doc.rect(14, 130, 182, 8, "F");
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(...hexToRgbArray(colors.darkBrown));
    doc.text("TOTAL", 150, 136);
    doc.text(`R${total.toFixed(2)}`, 180, 136, { align: "right" });

    // Terms & Banking
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(...hexToRgbArray(colors.mediumBrown));
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
    doc.setTextColor(...hexToRgbArray(colors.darkBrown));
    doc.text("THANK YOU FOR YOUR BUSINESS!", 105, 190, { align: "center" });

    return doc;
  }

  // Enhanced invoice generation for Success Fee transactions
  function generateSuccessFeeInvoicePDF(transaction) {
    const doc = new jsPDF();
    // Header
    doc.setFontSize(20);
    doc.setTextColor(...hexToRgbArray(colors.darkBrown));
    doc.text("SUCCESS FEE INVOICE", 14, 25);

    // Company details
    doc.setFontSize(10);
    doc.setTextColor(...hexToRgbArray(colors.mediumBrown));
    doc.text("MyUniversal Business Intelligence", 14, 35);
    doc.text("2040 Broadacres Drive", 14, 40);
    doc.text("Dainfern, Sandton, GP, 2055", 14, 45);
    doc.text("South Africa", 14, 50);

    // Invoice details
    doc.setFont("Helvetica", "bold");
    doc.text("Invoice Date:", 140, 35);
    doc.text("Invoice ID:", 140, 40);
    doc.text("Transaction ID:", 140, 45);
    doc.setFont("Helvetica", "normal");
    doc.text(transaction.date || new Date().toLocaleDateString(), 175, 35);
    doc.text(transaction.invoiceId || transaction.id || "SF-001", 175, 40);
    doc.text(transaction.transactionId || transaction.id || "TXN-001", 175, 45);

    // Bill to
    doc.setFont("Helvetica", "bold");
    doc.text("BILL TO:", 14, 65);
    doc.setFont("Helvetica", "normal");
    doc.text(
      transaction.companyName || companyName || "Client Company",
      14,
      70
    );
    doc.text(transaction.fullName || fullName || "Client Name", 14, 75);
    doc.text("Business Address", 14, 80);
    doc.text("City, Province, Postal Code", 14, 85);

    // Table header
    doc.setFillColor(...hexToRgbArray(colors.cream));
    doc.rect(14, 95, 182, 10, "F");
    doc.setTextColor(...hexToRgbArray(colors.darkBrown));
    doc.setFont("Helvetica", "bold");
    doc.text("DESCRIPTION", 16, 102);
    doc.text("DEAL VALUE", 80, 102);
    doc.text("FEE RATE", 120, 102);
    doc.text("AMOUNT", 160, 102);

    // Table content
    doc.setFont("Helvetica", "normal");
    const counterpartyLabel = userType === "sme" ? "Investor" : "SMSE";
    doc.text(
      `Success Fee - ${transaction[counterpartyLabel.toLowerCase()] || "Deal"}`,
      16,
      112
    );
    doc.text(`ZAR ${transaction.dealValue || "0.00"}`, 80, 112);
    doc.text("3%", 120, 112);
    doc.text(`ZAR ${transaction.successFeeAmount || "0.00"}`, 160, 112);

    // Totals
    const amount = parseFloat(
      transaction.successFeeAmount?.replace(/[^\d.]/g, "") || "0"
    );
    const vat = amount * 0.15;
    const total = amount + vat;

    doc.line(14, 125, 196, 125);
    doc.text("SUBTOTAL", 130, 135);
    doc.text(`ZAR ${amount.toFixed(2)}`, 170, 135);
    doc.text("VAT (15%)", 130, 142);
    doc.text(`ZAR ${vat.toFixed(2)}`, 170, 142);

    doc.setFillColor(...hexToRgbArray(colors.lightBrown));
    doc.rect(14, 150, 182, 10, "F");
    doc.setFont("Helvetica", "bold");
    doc.text("TOTAL", 130, 157);
    doc.text(`ZAR ${total.toFixed(2)}`, 170, 157);

    // Footer
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Payment Terms: Net 30 days", 14, 175);
    doc.text("Thank you for your business!", 14, 185);

    return doc;
  }

  // Enhanced invoice generation for Growth Tools (SME only)
  function generateGrowthToolInvoicePDF(transaction) {
    const doc = new jsPDF();
    // Header
    doc.setFontSize(20);
    doc.setTextColor(...hexToRgbArray(colors.darkBrown));
    doc.text("GROWTH TOOLS INVOICE", 14, 25);

    // Company details
    doc.setFontSize(10);
    doc.setTextColor(...hexToRgbArray(colors.mediumBrown));
    doc.text("MyUniversal Business Intelligence", 14, 35);
    doc.text("2040 Broadacres Drive", 14, 40);
    doc.text("Dainfern, Sandton, GP, 2055", 14, 45);
    doc.text("South Africa", 14, 50);

    // Invoice details
    doc.setFont("Helvetica", "bold");
    doc.text("Invoice Date:", 140, 35);
    doc.text("Invoice ID:", 140, 40);
    doc.setFont("Helvetica", "normal");
    doc.text(transaction.date || new Date().toLocaleDateString(), 175, 35);
    doc.text(transaction.invoiceId || transaction.id || "GT-001", 175, 40);

    // Bill to
    doc.setFont("Helvetica", "bold");
    doc.text("BILL TO:", 14, 65);
    doc.setFont("Helvetica", "normal");
    doc.text(
      transaction.companyName || companyName || "Client Company",
      14,
      70
    );
    doc.text(transaction.fullName || fullName || "Client Name", 14, 75);
    doc.text("Business Address", 14, 80);
    doc.text("City, Province, Postal Code", 14, 85);

    // Table header
    doc.setFillColor(...hexToRgbArray(colors.cream));
    doc.rect(14, 95, 182, 10, "F");
    doc.setTextColor(...hexToRgbArray(colors.darkBrown));
    doc.setFont("Helvetica", "bold");
    doc.text("DESCRIPTION", 16, 102);
    doc.text("TIER", 100, 102);
    doc.text("QTY", 130, 102);
    doc.text("AMOUNT", 160, 102);

    // Table content
    doc.setFont("Helvetica", "normal");
    doc.text(transaction.package || "Growth Tool Package", 16, 112);
    doc.text(transaction.tier || "Premium", 100, 112);
    doc.text("1", 130, 112);
    doc.text(`ZAR ${transaction.price || "0.00"}`, 160, 112);

    // Totals
    const amount = parseFloat(transaction.price?.replace(/[^\d.]/g, "") || "0");
    const vat = amount * 0.15;
    const total = amount + vat;

    doc.line(14, 125, 196, 125);
    doc.text("SUBTOTAL", 130, 135);
    doc.text(`ZAR ${amount.toFixed(2)}`, 170, 135);
    doc.text("VAT (15%)", 130, 142);
    doc.text(`ZAR ${vat.toFixed(2)}`, 170, 142);

    doc.setFillColor(...hexToRgbArray(colors.lightBrown));
    doc.rect(14, 150, 182, 10, "F");
    doc.setFont("Helvetica", "bold");
    doc.text("TOTAL", 130, 157);
    doc.text(`ZAR ${total.toFixed(2)}`, 170, 157);

    // Footer
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Payment Terms: Immediate", 14, 175);
    doc.text("Thank you for your business!", 14, 185);

    return doc;
  }

  // Download functions
  function downloadInvoice(transaction) {
    const doc = generateInvoicePDF(transaction);
    doc.save(
      `Invoice_${transaction.invoiceNumber || transaction.id || "unknown"}.pdf`
    );
  }

  function downloadSuccessFeeInvoice(transaction) {
    const doc = generateSuccessFeeInvoicePDF(transaction);
    doc.save(
      `SuccessFee_Invoice_${
        transaction.invoiceId || transaction.id || "unknown"
      }.pdf`
    );
  }

  function downloadGrowthToolInvoice(transaction) {
    const doc = generateGrowthToolInvoicePDF(transaction);
    doc.save(
      `GrowthTool_Invoice_${
        transaction.invoiceId || transaction.id || "unknown"
      }.pdf`
    );
  }

  // Load subscription history from Firebase
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

        // Get user profile data
        const userDocRef = doc(db, "MyuniversalProfiles", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setFirebaseData(userDocSnap.data().formData || {});
        }

        // Get subscription history
        const subscriptionsRef = collection(db, "subscriptions");
        const q = query(subscriptionsRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        const transactions = [];
        const invoiceNumbers = {};

        // First pass: collect existing invoice numbers
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const base = (data.companyName || data.fullName || "USR")
            .substring(0, 3)
            .toUpperCase();
          if (!invoiceNumbers[base]) invoiceNumbers[base] = [];
          if (data.invoiceNumber) {
            const match = data.invoiceNumber.match(
              new RegExp(`^${base}(\\d{3})$`)
            );
            if (match) {
              invoiceNumbers[base].push(Number(match[1]));
            }
          }
        });

        // Second pass: assign missing invoice numbers
        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          const base = (data.companyName || data.fullName || "USR")
            .substring(0, 3)
            .toUpperCase();

          if (!data.invoiceNumber) {
            let nextNum = 1;
            if (invoiceNumbers[base] && invoiceNumbers[base].length > 0) {
              nextNum = Math.max(...invoiceNumbers[base]) + 1;
            }
            const invoiceNumber = `${base}${String(nextNum).padStart(3, "0")}`;

            // Save to Firestore
            const docRef = doc(db, "subscriptions", docSnap.id);
            await updateDoc(docRef, { invoiceNumber });
            data.invoiceNumber = invoiceNumber;

            // Update tracker
            if (!invoiceNumbers[base]) invoiceNumbers[base] = [];
            invoiceNumbers[base].push(nextNum);
          }

          transactions.push({ id: docSnap.id, ...data });
        }

        // Sort by date descending
        transactions.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setHistory(transactions);
      } catch (error) {
        console.error("Error loading history:", error);
        setHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    };

    unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      fetchHistory(user);
    });

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  // Load growth tools purchases (SME only)
  useEffect(() => {
    const fetchGrowthTools = async () => {
      if (userType !== "sme") return;

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

        purchases.sort(
          (a, b) =>
            new Date(b.createdAt?.toDate?.() || b.createdAt) -
            new Date(a.createdAt?.toDate?.() || a.createdAt)
        );
        setGrowthTools(purchases);
      } catch (error) {
        console.error("Error loading growth tools:", error);
        setGrowthTools([]);
      } finally {
        setLoadingGrowthTools(false);
      }
    };

    fetchGrowthTools();
  }, [userType]);

  return (
    <div>
      <style>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .billing-container {
            margin: 1rem !important;
          }
        }
      `}</style>

      <div style={styles.billingContainer}>
        {/* Tab Navigation */}
        <div style={styles.tabNavigation}>
          {userConfig.tabKeys.map((tabKey, index) => (
            <button
              key={tabKey}
              style={{
                ...styles.tabButton,
                ...(activeTab === tabKey
                  ? styles.tabButtonActive
                  : styles.tabButtonInactive),
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tabKey) {
                  Object.assign(e.target.style, styles.tabButtonInactiveHover);
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tabKey) {
                  Object.assign(e.target.style, styles.tabButtonInactive);
                }
              }}
              onClick={() => setActiveTab(tabKey)}
            >
              {userConfig.tabLabels[index]}
            </button>
          ))}
        </div>

        <div style={styles.tabContent}>
          {/* Success Fee History Tab */}
          {activeTab === "billing-info" && (
            <div>
              <h2 style={styles.sectionTitle}>Success Fee History</h2>
              <div style={styles.tableResponsive}>
                <table style={styles.transactionTable}>
                  <thead>
                    <tr>
                      <th
                        style={{
                          ...styles.transactionThTd,
                          ...styles.transactionTh,
                        }}
                      >
                        {userConfig.successFeeColumnNames.transactionId}
                      </th>
                      <th
                        style={{
                          ...styles.transactionThTd,
                          ...styles.transactionTh,
                        }}
                      >
                        {userConfig.successFeeColumnNames.counterparty}
                      </th>
                      <th
                        style={{
                          ...styles.transactionThTd,
                          ...styles.transactionTh,
                        }}
                      >
                        {userConfig.successFeeColumnNames.dealValue}
                      </th>
                      <th
                        style={{
                          ...styles.transactionThTd,
                          ...styles.transactionTh,
                        }}
                      >
                        {userConfig.successFeeColumnNames.successFeeAmount}
                      </th>
                      <th
                        style={{
                          ...styles.transactionThTd,
                          ...styles.transactionTh,
                        }}
                      >
                        Date & Time
                      </th>
                      <th
                        style={{
                          ...styles.transactionThTd,
                          ...styles.transactionTh,
                        }}
                      >
                        Invoice
                      </th>
                      <th
                        style={{
                          ...styles.transactionThTd,
                          ...styles.transactionTh,
                        }}
                      >
                        Payment Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {successFeeData.map((transaction) => (
                      <tr key={transaction.id}>
                        <td style={styles.transactionThTd}>
                          <span style={styles.transactionId}>
                            {transaction.transactionId}
                          </span>
                        </td>
                        <td style={styles.transactionThTd}>
                          <span style={{ fontWeight: 600 }}>
                            {transaction[
                              userConfig.successFeeColumnNames.counterparty.toLowerCase()
                            ] || "N/A"}
                          </span>
                        </td>
                        <td style={styles.transactionThTd}>
                          <span style={styles.amountPaid}>
                            ZAR {transaction.dealValue}
                          </span>
                        </td>
                        <td style={styles.transactionThTd}>
                          <span style={styles.amountPaid}>
                            ZAR {transaction.successFeeAmount}
                          </span>
                        </td>
                        <td style={styles.transactionThTd}>
                          <div style={styles.datetimeCell}>
                            <span>{transaction.date}</span>
                            <span
                              style={{
                                fontSize: "0.85em",
                                color: colors.mediumBrown,
                              }}
                            >
                              {transaction.time}
                            </span>
                          </div>
                        </td>
                        <td style={styles.transactionThTd}>
                          {transaction.status === "Paid" ? (
                            <div style={styles.actionButtons}>
                              <button
                                style={styles.downloadBtn}
                                onMouseEnter={(e) =>
                                  Object.assign(
                                    e.target.style,
                                    styles.downloadBtnHover
                                  )
                                }
                                onMouseLeave={(e) =>
                                  Object.assign(
                                    e.target.style,
                                    styles.downloadBtn
                                  )
                                }
                                onClick={() =>
                                  downloadSuccessFeeInvoice(transaction)
                                }
                              >
                                📄 Download
                              </button>
                              <button
                                style={styles.viewBtn}
                                onMouseEnter={(e) =>
                                  Object.assign(
                                    e.target.style,
                                    styles.viewBtnHover
                                  )
                                }
                                onMouseLeave={(e) =>
                                  Object.assign(e.target.style, styles.viewBtn)
                                }
                                onClick={() => {
                                  try {
                                    const doc =
                                      generateSuccessFeeInvoicePDF(transaction);
                                    doc.output("dataurlnewwindow");
                                  } catch {
                                    alert(
                                      "Preview failed, please download instead."
                                    );
                                  }
                                }}
                              >
                                👁️ View
                              </button>
                            </div>
                          ) : (
                            <span
                              style={{
                                color: colors.mediumBrown,
                                fontWeight: 600,
                                fontSize: "0.95em",
                              }}
                            >
                              Awaiting Payment
                            </span>
                          )}
                        </td>
                        <td style={styles.transactionThTd}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              ...(transaction.status === "Paid"
                                ? styles.statusSuccess
                                : styles.statusCancelled),
                            }}
                          >
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Growth Tools Tab (SME only) */}
          {activeTab === "payment-methods" && userConfig.showGrowthTools && (
            <div>
              <h2 style={styles.sectionTitle}>Growth Tools Purchases</h2>
              <div style={styles.tableResponsive}>
                <table style={styles.transactionTable}>
                  <thead>
                    <tr>
                      <th
                        style={{
                          ...styles.transactionThTd,
                          ...styles.transactionTh,
                        }}
                      >
                        Invoice ID
                      </th>
                      <th
                        style={{
                          ...styles.transactionThTd,
                          ...styles.transactionTh,
                        }}
                      >
                        Package
                      </th>
                      <th
                        style={{
                          ...styles.transactionThTd,
                          ...styles.transactionTh,
                        }}
                      >
                        Tier
                      </th>
                      <th
                        style={{
                          ...styles.transactionThTd,
                          ...styles.transactionTh,
                        }}
                      >
                        Price
                      </th>
                      <th
                        style={{
                          ...styles.transactionThTd,
                          ...styles.transactionTh,
                        }}
                      >
                        Date
                      </th>
                      <th
                        style={{
                          ...styles.transactionThTd,
                          ...styles.transactionTh,
                        }}
                      >
                        Invoice
                      </th>
                      <th
                        style={{
                          ...styles.transactionThTd,
                          ...styles.transactionTh,
                        }}
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockGrowthToolsData.map((tool) => (
                      <tr key={tool.id}>
                        <td style={styles.transactionThTd}>
                          <span style={styles.transactionId}>
                            {tool.invoiceId}
                          </span>
                        </td>
                        <td style={styles.transactionThTd}>
                          <span style={{ fontWeight: 600 }}>
                            {tool.package}
                          </span>
                        </td>
                        <td style={styles.transactionThTd}>
                          <span
                            style={{
                              ...styles.tierBadge,
                              ...(tool.tier === "Premium"
                                ? styles.tierPremium
                                : tool.tier === "Gold"
                                ? styles.tierGold
                                : styles.tierSilver),
                            }}
                          >
                            {tool.tier}
                          </span>
                        </td>
                        <td style={styles.transactionThTd}>
                          <span style={styles.amountPaid}>
                            ZAR {tool.price}
                          </span>
                        </td>
                        <td style={styles.transactionThTd}>
                          <span>{tool.date}</span>
                        </td>
                        <td style={styles.transactionThTd}>
                          {tool.status === "Paid" ? (
                            <div style={styles.actionButtons}>
                              <button
                                style={styles.downloadBtn}
                                onMouseEnter={(e) =>
                                  Object.assign(
                                    e.target.style,
                                    styles.downloadBtnHover
                                  )
                                }
                                onMouseLeave={(e) =>
                                  Object.assign(
                                    e.target.style,
                                    styles.downloadBtn
                                  )
                                }
                                onClick={() => downloadGrowthToolInvoice(tool)}
                              >
                                📄 Download
                              </button>
                              <button
                                style={styles.viewBtn}
                                onMouseEnter={(e) =>
                                  Object.assign(
                                    e.target.style,
                                    styles.viewBtnHover
                                  )
                                }
                                onMouseLeave={(e) =>
                                  Object.assign(e.target.style, styles.viewBtn)
                                }
                                onClick={() => {
                                  try {
                                    const doc =
                                      generateGrowthToolInvoicePDF(tool);
                                    doc.output("dataurlnewwindow");
                                  } catch {
                                    alert(
                                      "Preview failed, please download instead."
                                    );
                                  }
                                }}
                              >
                                👁️ View
                              </button>
                            </div>
                          ) : (
                            <span
                              style={{
                                color: colors.mediumBrown,
                                fontWeight: 600,
                                fontSize: "0.95em",
                              }}
                            >
                              Processing
                            </span>
                          )}
                        </td>
                        <td style={styles.transactionThTd}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              ...(tool.status === "Paid"
                                ? styles.statusSuccess
                                : styles.statusCancelled),
                            }}
                          >
                            {tool.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Subscription History Tab */}
          {activeTab === "billing-history" && (
            <div>
              <h2 style={styles.sectionTitle}>Subscription History</h2>
              {loadingHistory ? (
                <div
                  style={{
                    ...styles.emptyState,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "1rem",
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      border: `2px solid ${colors.lightTan}`,
                      borderTop: `2px solid ${colors.accentGold}`,
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  ></div>
                  <span>Loading...</span>
                </div>
              ) : (
                <div style={styles.tableResponsive}>
                  <table style={styles.transactionTable}>
                    <thead>
                      <tr>
                        <th
                          style={{
                            ...styles.transactionThTd,
                            ...styles.transactionTh,
                          }}
                        >
                          Invoice ID
                        </th>
                        <th
                          style={{
                            ...styles.transactionThTd,
                            ...styles.transactionTh,
                          }}
                        >
                          Plan
                        </th>
                        <th
                          style={{
                            ...styles.transactionThTd,
                            ...styles.transactionTh,
                          }}
                        >
                          Cycle
                        </th>
                        <th
                          style={{
                            ...styles.transactionThTd,
                            ...styles.transactionTh,
                          }}
                        >
                          Amount
                        </th>
                        <th
                          style={{
                            ...styles.transactionThTd,
                            ...styles.transactionTh,
                          }}
                        >
                          Date & Time
                        </th>
                        <th
                          style={{
                            ...styles.transactionThTd,
                            ...styles.transactionTh,
                          }}
                        >
                          Invoice
                        </th>
                        <th
                          style={{
                            ...styles.transactionThTd,
                            ...styles.transactionTh,
                          }}
                        >
                          Payment Status
                        </th>
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
                              <td style={styles.transactionThTd}>
                                <span style={styles.transactionId}>
                                  {entry.invoiceNumber ||
                                    entry.id?.slice(0, 8) + "..." ||
                                    "N/A"}
                                </span>
                              </td>
                              <td style={styles.transactionThTd}>
                                <div>
                                  <span style={{ fontWeight: 600 }}>
                                    {entry.plan}
                                  </span>
                                  {entry.action && (
                                    <div
                                      style={{
                                        padding: "0.25rem 0.6rem",
                                        backgroundColor: colors.cream,
                                        color: colors.accentGold,
                                        borderRadius: "0.375rem",
                                        fontSize: "0.7rem",
                                        fontWeight: 600,
                                        marginTop: "0.25rem",
                                        display: "inline-block",
                                      }}
                                    >
                                      {entry.action}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td style={styles.transactionThTd}>
                                <span
                                  style={{
                                    padding: "0.35rem 0.8rem",
                                    backgroundColor: colors.accentGold,
                                    color: colors.lightText,
                                    borderRadius: "9999px",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                  }}
                                >
                                  {entry.cycle}
                                </span>
                              </td>
                              <td style={styles.transactionThTd}>
                                <span
                                  style={
                                    entry.amount === 0
                                      ? styles.amountFree
                                      : styles.amountPaid
                                  }
                                >
                                  {entry.amount === 0
                                    ? "Free"
                                    : `ZAR ${entry.amount}.00`}
                                </span>
                              </td>
                              <td style={styles.transactionThTd}>
                                <div style={styles.datetimeCell}>
                                  <span>{date}</span>
                                  <span
                                    style={{
                                      fontSize: "0.85em",
                                      color: colors.mediumBrown,
                                    }}
                                  >
                                    {time}
                                  </span>
                                </div>
                              </td>
                              <td style={styles.transactionThTd}>
                                <div style={styles.actionButtons}>
                                  {["Success", "Paid", "Active"].includes(
                                    entry.status
                                  ) && entry.amount > 0 ? (
                                    <>
                                      <button
                                        style={styles.downloadBtn}
                                        onMouseEnter={(e) =>
                                          Object.assign(
                                            e.target.style,
                                            styles.downloadBtnHover
                                          )
                                        }
                                        onMouseLeave={(e) =>
                                          Object.assign(
                                            e.target.style,
                                            styles.downloadBtn
                                          )
                                        }
                                        onClick={() => downloadInvoice(entry)}
                                      >
                                        📄 <span>Download</span>
                                      </button>
                                      <button
                                        style={styles.viewBtn}
                                        onMouseEnter={(e) =>
                                          Object.assign(
                                            e.target.style,
                                            styles.viewBtnHover
                                          )
                                        }
                                        onMouseLeave={(e) =>
                                          Object.assign(
                                            e.target.style,
                                            styles.viewBtn
                                          )
                                        }
                                        onClick={() => {
                                          try {
                                            const doc =
                                              generateInvoicePDF(entry);
                                            doc.output("dataurlnewwindow");
                                          } catch {
                                            alert(
                                              "Preview failed, please download instead."
                                            );
                                          }
                                        }}
                                      >
                                        👁️ <span>View</span>
                                      </button>
                                    </>
                                  ) : entry.status === "Cancelled" ? (
                                    <span style={styles.cancelledText}>
                                      No Invoice
                                    </span>
                                  ) : (
                                    <span style={styles.freeText}>
                                      Free Plan
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={styles.transactionThTd}>
                                <span style={styles.statusBadgeSuccess}>
                                  {entry.status === "Success"
                                    ? "Paid"
                                    : entry.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} style={styles.emptyState}>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "1rem",
                              }}
                            >
                              <div style={{ fontSize: "3rem" }}>📄</div>
                              <span>
                                No subscription history available yet.
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <div
                    style={{
                      ...styles.formLabel,
                      marginTop: "1.5rem",
                      padding: "1rem",
                      backgroundColor: colors.cream,
                      borderRadius: "0.5rem",
                      border: `1px solid ${colors.lightTan}`,
                    }}
                  >
                    💡 <strong>Note:</strong> Invoices are available for
                    successful payments only.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReusableBillingHistory;
