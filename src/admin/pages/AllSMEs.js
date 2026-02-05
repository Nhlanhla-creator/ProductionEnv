"use client"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  Ban,
  MoreHorizontal,
  X,
  User,
  FileText,
  DollarSign,
  Building2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  AlertTriangle,
  Save,
  Check,
  File,
  Shield,
  LockKeyhole,
} from "lucide-react"
import styles from "./all-smes.module.css"
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from "firebase/firestore"
import * as XLSX from 'xlsx';
import databaseService from "../../services/databaseService"

function AllSMEs() {
  const navigate = useNavigate()
  
  const [currentDatabase, setCurrentDatabase] = useState(
    databaseService.getCurrentDatabase()
  )
  
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedSME, setSelectedSME] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editFormData, setEditFormData] = useState({})
  const [addFormData, setAddFormData] = useState({
    username: "",
    email: "",
    companyName: "",
    status: "pending",
    profile: {
      registeredName: "",
      industry: "",
      employees: "",
      revenue: "",
      location: "",
      phone: "",
      website: "",
    }
  })
  const [activeTab, setActiveTab] = useState("profile")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [smeData, setSMEData] = useState([])

  // ADD this function to get the current database instance
  const getCurrentDb = () => {
    return databaseService.getFirestore();
  }

  // ADD this effect to listen for database changes
  useEffect(() => {
    const handleDatabaseChange = () => {
      const newDatabase = databaseService.getCurrentDatabase();
      setCurrentDatabase(newDatabase);
      // Refresh data when database changes
      fetchSMEs();
    };

    // Listen for storage changes
    window.addEventListener('storage', handleDatabaseChange);
    
    // Listen for custom event
    window.addEventListener('databaseChanged', handleDatabaseChange);

    return () => {
      window.removeEventListener('storage', handleDatabaseChange);
      window.removeEventListener('databaseChanged', handleDatabaseChange);
    };
  }, []);

const fetchSMEs = async () => {
  try {
    setLoading(true);
    
    const db = getCurrentDb();
    const usersRef = collection(db, 'universalProfiles');
    const usersSnapshot = await getDocs(usersRef);
    
    const usersData = usersSnapshot.docs.map((doc, index) => {
      const userData = doc.data();
      const entityOverview = userData.entityOverview || {};
      const contactDetails = userData.contactDetails || {};
      
      // Get verification data exactly as stored
      const verificationData = userData.verification || {};
      
      const formatFirestoreDate = (timestamp) => {
        if (timestamp && timestamp.toDate) {
          return timestamp.toDate().toISOString().split('T')[0];
        }
        return timestamp || "2024-01-01";
      };
      
      const createdAt = formatFirestoreDate(userData.createdAt);
      
      return {
        id: index + 1,
        firestoreId: doc.id,
        username: userData.username || "N/A",
        email: contactDetails.email || userData.email || 'N/A',
        companyName: entityOverview.registeredName || entityOverview.companyName || "N/A",
        created: createdAt,
        lastEdited: formatFirestoreDate(userData.updatedAt) || createdAt,
        status: userData.status || "active",
        authStatus: userData.authStatus || "enabled",
        profileImage: null,
        profile: {
          registeredName: entityOverview.registeredName || "N/A",
          industry: entityOverview.economicSectors || entityOverview.sector || "N/A",
          employees: entityOverview.employeeCount || entityOverview.numberOfEmployees || "N/A",
          revenue: userData?.financialOverview?.annualRevenue || "N/A",
          location: entityOverview.region || contactDetails.city || "South Africa",
          phone: contactDetails.mobile || "+27 XXX XXX XXX",
          website: contactDetails.website || "N/A",
          entitySize: entityOverview.entitySize || "N/A"

        },
        // Store verification data as-is
        verification: verificationData,
        // ... rest of your data
      };
    });
    
    setSMEData(usersData);
  } catch (error) {
    console.error("Error fetching SME data:", error);
    setSMEData([]);
  } finally {
    setLoading(false);
  }
};
  // UPDATE your useEffect
  useEffect(() => {
    fetchSMEs();
  }, []); // Keep empty dependencies

  // Your existing loading simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])
  
  // ADD this toggle function
  const toggleDatabase = () => {
    // Get the new database
    const newDatabase = databaseService.toggleDatabase();
    
    // Update local state
    setCurrentDatabase(newDatabase);
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('databaseChanged', {
      detail: { database: newDatabase }
    }));
    
    // Refresh data
    fetchSMEs();
    
    // Show alert for production mode
    if (newDatabase === 'production') {
      alert('⚠️ WARNING: Switched to PRODUCTION database. All data is LIVE.');
    }
  };

  // Helper functions for documents
const getSMEDocuments = (smeId) => {
  const sme = smeData.find(s => s.id === smeId);
  if (!sme || !sme.verification) {
    return []; // Return empty array if no verification data
  }
  
  // Convert verification map to array
  const documentsList = [];
  
  Object.entries(sme.verification).forEach(([docType, docData]) => {
    if (docData && typeof docData === 'object') {
      // Format dates if they exist
      const formatDateIfExists = (timestamp) => {
        if (!timestamp) return null;
        if (timestamp.toDate) {
          return timestamp.toDate();
        }
        try {
          return new Date(timestamp);
        } catch {
          return null;
        }
      };
      
      documentsList.push({
        id: `${smeId}_${docType}`,
        fileName: docType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        type: docType,
        status: docData.status || 'pending',
        message: docData.message || '',
        lastChecked: formatDateIfExists(docData.lastChecked),
        validatedAt: formatDateIfExists(docData.validatedAt),
      });
    }
  });
  
  return documentsList;
};

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false
    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
  }

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false
    const today = new Date()
    const expiry = new Date(expiryDate)
    return expiry < today
  }

  const getDocumentStatusBadge = (status) => {
    const statusStyles = {
      approved: `${styles.statusBadge} ${styles.statusActive}`,
      pending: `${styles.statusBadge} ${styles.statusPending}`,
      rejected: `${styles.statusBadge} ${styles.statusBlocked}`,
      signed: `${styles.statusBadge} ${styles.statusActive}`,
      expired: `${styles.statusBadge} ${styles.statusBlocked}`,
    }
    
    return (
      <span className={statusStyles[status] || `${styles.statusBadge}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getDocumentTypeBadge = (type, subType, weight) => {
    const typeLabels = {
      nda: "NDA",
      compliance_business_registration: "Business Registration",
      compliance_tax: "Tax Compliance",
      compliance_address: "Address Proof",
      compliance_directors_id: "Directors ID",
      compliance_ownership: "Ownership Structure",
      compliance_bbbee: "B-BBEE Certificate",
      compliance_profile: "Company Profile",
      compliance_coid: "COID Registration",
    }
    
    return (
      <div className={styles.typeContainer}>
        <span className={`${styles.statusBadge} ${styles.statusPending}`}>
          {typeLabels[type] || type}
        </span>
        {weight && (
          <span className={`${styles.statusBadge}`} style={{marginLeft: '4px', fontSize: '11px'}}>
            {weight}
          </span>
        )}
      </div>
    )
  }

  const handleDocumentAction = (action, document) => {
  if (action === "view") {
    // Simple view showing all document info
    const details = `
📄 ${document.fileName}

Status: ${document.status}
${document.message ? `Message: ${document.message}\n` : ''}
${document.lastChecked ? `Last Checked: ${formatDate(document.lastChecked)}\n` : ''}
${document.validatedAt ? `Validated At: ${formatDate(document.validatedAt)}\n` : ''}
    `.trim();
    
    alert(details);
  }
  // Remove other actions for now
};

  const filteredSMEs = smeData.filter((sme) => {
    const matchesSearch = 
      sme.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sme.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sme.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || sme.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredSMEs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentSMEs = filteredSMEs.slice(startIndex, endIndex)

  const deleteSME = async (smeId, smeData) => {
  try {
    const db = getCurrentDb();
    
     if (currentDatabase === 'production') {
    const confirmProduction = window.confirm(
      `⚠️ WARNING: You are about to delete from PRODUCTION database.\n\n` +
      `This will permanently delete ${smeData.companyName} from the live database.\n\n` +
      `Are you absolutely sure?`
    );
    if (!confirmProduction) return;
  }
    // Show confirmation dialog
    if (!window.confirm(`Are you sure you want to delete ${smeData.companyName}? This action cannot be undone.`)) {
      return;
    }
    
    // Get the Firestore document ID from your smeData
    const firestoreId = smeData.firestoreId;
    
    if (!firestoreId) {
      console.error("No Firestore ID found for this SME");
      alert("Error: Unable to delete. No valid document ID found.");
      return;
    }
    
    // Reference to the specific document
    const smeRef = doc(db, 'universalProfiles', firestoreId);
    
    // Delete the document
    await deleteDoc(smeRef);
    
    // Also delete any related documents in subcollections if needed
    // Example: delete subcollection documents
    // const subcollections = ['applications', 'documents', 'payments'];
    // for (const subcollection of subcollections) {
    //   const subRef = collection(db, 'universalProfiles', firestoreId, subcollection);
    //   const subSnapshot = await getDocs(subRef);
    //   const deletePromises = subSnapshot.docs.map(doc => deleteDoc(doc.ref));
    //   await Promise.all(deletePromises);
    // }
    
    // Update local state
    setSMEData(prevData => prevData.filter(s => s.firestoreId !== firestoreId));
    
    // Show success message
    alert(`Successfully deleted ${smeData.companyName}`);
    
  } catch (error) {
    console.error("Error deleting SME:", error);
    alert(`Error deleting SME: ${error.message}`);
  }
};

  const handleAction = async (action, sme) => {
  switch (action) {
    case "view":
      setSelectedSME(sme)
      setShowViewModal(true)
      setActiveTab("profile")
      break
    case "edit":
      setSelectedSME(sme)
      setEditFormData({
        username: sme.username,
        email: sme.email,
        companyName: sme.companyName,
        status: sme.status,
        profile: { ...sme.profile }
      })
      setShowEditModal(true)
      break
    case "delete":
      await deleteSME(sme.id, sme); // Use the new delete function
      break
    case "block":
      if (window.confirm(`Are you sure you want to block ${sme.companyName}?`)) {
        // You might want to update this in Firestore too
        // await updateSMEStatus(sme.firestoreId, "blocked");
        
        // Update local state for now
        setSMEData(smeData.map(s => 
          s.id === sme.id ? { ...s, status: "blocked" } : s
        ))
      }
      break
    default:
      break
  }
}

  const handleEditSave = () => {
    setSMEData(smeData.map(sme => 
      sme.id === selectedSME.id 
        ? { 
            ...sme, 
            ...editFormData,
            lastEdited: new Date().toISOString().split('T')[0]
          } 
        : sme
    ))
    setShowEditModal(false)
    setSelectedSME(null)
    setEditFormData({})
  }

  const handleAddSME = () => {
    const newSME = {
      id: Date.now(), // Simple ID generation
      ...addFormData,
      created: new Date().toISOString().split('T')[0],
      lastEdited: new Date().toISOString().split('T')[0],
      profileImage: null,
      applications: {
        funding: { status: "not_applied", amount: null, date: null },
        advisory: { status: "not_applied", type: null, date: null },
        product: { status: "not_applied", category: null, date: null },
      },
      documents: {
        nda: { signed: false, date: null },
        compliance: { status: "pending", documents: 0 },
        uploads: 0,
      },
      payments: {
        subscription: "Basic",
        status: "pending",
        amount: "$99/month",
        nextBilling: null,
      },
    }
    
    setSMEData([...smeData, newSME])
    setShowAddModal(false)
    setAddFormData({
      username: "",
      email: "",
      companyName: "",
      status: "pending",
      profile: {
        registeredName: "",
        industry: "",
        employees: "",
        revenue: "",
        location: "",
        phone: "",
        website: "",
      }
    })
  }

  const exportToExcel = () => {
  try {
    const dataToExport = filteredSMEs;
    
    if (dataToExport.length === 0) {
      alert("No data to export!");
      return;
    }
    
    const excelData = dataToExport.map(sme => ({
      Email: sme.email,
      "Company Name": sme.companyName,
      Created: sme.created,
      Status: sme.status,
      Industry: sme.profile.industry || "",
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Calculate dynamic column widths based on content
    const calculateColumnWidths = (data) => {
      const widths = [];
      const keys = Object.keys(data[0] || {});
      
      keys.forEach((key, colIndex) => {
        // Start with header width
        let maxLength = key.length;
        
        // Check all rows for this column
        data.forEach(row => {
          const cellValue = String(row[key] || '');
          if (cellValue.length > maxLength) {
            maxLength = cellValue.length;
          }
        });
        
        // Add some padding and set a reasonable max
        const width = Math.min(Math.max(maxLength + 2, 10), 50);
        widths.push({ wch: width });
      });
      
      return widths;
    };
    
    worksheet['!cols'] = calculateColumnWidths(excelData);
    
    // Optional: Format headers with bold text
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const headerCell = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[headerCell]) continue;
      worksheet[headerCell].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "E0E0E0" } } // Light gray background
      };
    }
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SMEs");
    
    const fileName = `SMEs_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    alert(`Exported ${dataToExport.length} records!`);
    
  } catch (error) {
    console.error("Export error:", error);
    alert("Export failed: " + error.message);
  }
};

  const getStatusBadge = (status) => {
    const statusStyles = {
      active: styles.statusActive,
      pending: styles.statusPending,
      blocked: styles.statusBlocked,
      suspended: styles.statusSuspended,
    }
    
    return (

      
      <span className={`${styles.statusBadge} ${statusStyles[status] || ""}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }


  const TabContent = ({ tab, sme }) => {
    switch (tab) {
      case "profile":
        return (
          <div className={styles.tabContent}>
            <div className={styles.profileSection}>
              <h3>Company Information</h3>
              <div className={styles.profileGrid}>
                <div className={styles.profileItem}>
                  <Building2 size={16} />
                  <span>Registered Name:</span>
                  <span>{sme.profile.registeredName}</span>
                </div>
                <div className={styles.profileItem}>
                  <User size={16} />
                  <span>Industry:</span>
                  <span>{sme.profile.industry}</span>
                </div>
                <div className={styles.profileItem}>
                  <User size={16} />
                  <span>Employees:</span>
                  <span>{sme.profile.employees}</span>
                </div>
                <div className={styles.profileItem}>
                  <DollarSign size={16} />
                  <span>Revenue:</span>
                  <span>{sme.profile.revenue}</span>
                </div>
                <div className={styles.profileItem}>
                  <MapPin size={16} />
                  <span>Location:</span>
                  <span>{sme.profile.location}</span>
                </div>
                <div className={styles.profileItem}>
                  <Phone size={16} />
                  <span>Phone:</span>
                  <span>{sme.profile.phone}</span>
                </div>
                <div className={styles.profileItem}>
                  <Mail size={16} />
                  <span>Website:</span>
                  <span>{sme.profile.website}</span>
                </div>
              </div>
            </div>
          </div>
        )
      case "funding":
        return (
          <div className={styles.tabContent}>
            <div className={styles.applicationSection}>
              <h3>Funding Application</h3>
              <div className={styles.applicationCard}>
                <div className={styles.applicationStatus}>
                  {getStatusBadge(sme.applications.funding.status)}
                  <span className={styles.applicationDate}>
                    Applied: {sme.applications.funding.date ? formatDate(sme.applications.funding.date) : "N/A"}
                  </span>
                </div>
                <div className={styles.applicationDetails}>
                  <p><strong>Amount Requested:</strong> {sme.applications.funding.amount || "N/A"}</p>
                  <p><strong>Status:</strong> {sme.applications.funding.status}</p>
                </div>
              </div>
            </div>
          </div>
        )
      case "advisory":
        return (
          <div className={styles.tabContent}>
            <div className={styles.applicationSection}>
              <h3>Advisory Application</h3>
              <div className={styles.applicationCard}>
                <div className={styles.applicationStatus}>
                  {getStatusBadge(sme.applications.advisory.status)}
                  <span className={styles.applicationDate}>
                    Applied: {sme.applications.advisory.date ? formatDate(sme.applications.advisory.date) : "N/A"}
                  </span>
                </div>
                <div className={styles.applicationDetails}>
                  <p><strong>Type:</strong> {sme.applications.advisory.type || "Not specified"}</p>
                  <p><strong>Status:</strong> {sme.applications.advisory.status}</p>
                </div>
              </div>
            </div>
          </div>
        )
      case "product":
        return (
          <div className={styles.tabContent}>
            <div className={styles.applicationSection}>
              <h3>Product & Service Application</h3>
              <div className={styles.applicationCard}>
                <div className={styles.applicationStatus}>
                  {getStatusBadge(sme.applications.product.status)}
                  <span className={styles.applicationDate}>
                    Applied: {sme.applications.product.date ? formatDate(sme.applications.product.date) : "N/A"}
                  </span>
                </div>
                <div className={styles.applicationDetails}>
                  <p><strong>Category:</strong> {sme.applications.product.category || "Not specified"}</p>
                  <p><strong>Status:</strong> {sme.applications.product.status}</p>
                </div>
              </div>
            </div>
          </div>
        )
      case "documents":
        const smeDocuments = getSMEDocuments(sme.id)
        return (
          <div className={styles.tabContent}>
            <div className={styles.documentsSection}>
              <div className={styles.sectionHeader}>
                <h3>Documents & Compliance</h3>
                <div className={styles.documentStats}>
                  <span className={styles.statBadge}>
                    Total: {smeDocuments.length}
                  </span>
                  <span className={styles.statBadge}>
                    Approved: {smeDocuments.filter(doc => doc.status === 'approved' || doc.status === 'signed').length}
                  </span>
                  <span className={styles.statBadge}>
                    Pending: {smeDocuments.filter(doc => doc.status === 'pending').length}
                  </span>
                </div>
              </div>
              
              <div className={styles.documentsTableContainer}>
                <table className={styles.documentsTable}>
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Type & Weight</th>
                      <th>Status</th>
                      <th>Upload Date</th>
                      <th>Review Date</th>
                      <th>Expiry</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                 <tbody>
  {getSMEDocuments(selectedSME.id).map((document) => (
    <tr key={document.id}>
      <td>
        <div className={styles.documentCell}>
          <File size={16} className={styles.fileIcon} />
          <div className={styles.documentInfo}>
            <span className={styles.fileName}>{document.fileName}</span>
            {document.message && (
              <span className={styles.documentMessage}>
              View Document
              </span>
            )}
          </div>
        </div>
      </td>
      <td>
        {/* Show document type */}
        <span className={`${styles.statusBadge} ${styles.statusPending}`}>
          {document.type}
        </span>
      </td>
      <td>
        {/* Show status from Firestore */}
        <span className={`${styles.statusBadge} ${
          document.status === 'verified' ? styles.statusActive :
          document.status === 'pending' ? styles.statusPending :
          document.status === 'rejected' ? styles.statusBlocked :
          styles.statusPending
        }`}>
          {document.status}
        </span>
      </td>
      <td>
        {document.lastChecked ? formatDate(document.lastChecked) : "Not checked"}
      </td>
      <td>
        {document.validatedAt ? formatDate(document.validatedAt) : "Not validated"}
      </td>
      <td>
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={() => handleDocumentAction("view", document)}
            title="View Document Details"
          >
            <Eye size={16} />
          </button>
        </div>
      </td>
    </tr>
  ))}
</tbody>
                </table>
              </div>
            </div>
          </div>
        )
      case "payments":
        return (
          <div className={styles.tabContent}>
            <div className={styles.paymentsSection}>
              <h3>Payment Information</h3>
              <div className={styles.paymentCard}>
                <div className={styles.paymentHeader}>
                  <h4>{sme.payments.subscription} Subscription</h4>
                  {getStatusBadge(sme.payments.status)}
                </div>
                <div className={styles.paymentDetails}>
                  <p><strong>Amount:</strong> {sme.payments.amount}</p>
                  <p><strong>Next Billing:</strong> {sme.payments.nextBilling ? formatDate(sme.payments.nextBilling) : "N/A"}</p>
                  <p><strong>Status:</strong> {sme.payments.status}</p>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return <div>Content not found</div>
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading SMEs...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>All SMEs</h1>
          <p className={styles.subtitle}>Manage and monitor all SME accounts</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.actionButton} onClick={exportToExcel}>
          <Download size={16} />
          Export to Excel
        </button>
          <button className={styles.primaryButton} onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add SME
          </button>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by username, email, or company name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterContainer}>
          <Filter size={16} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="blocked">Blocked</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div className={styles.tableContainer}>

        <div style={{
            position: 'fixed',
            top: '20px',
            right: '80px',
            backgroundColor: currentDatabase === 'testing' ? '#4CAF50' : '#f44336',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            zIndex: 1000,
            cursor: 'pointer'
          }} onClick={toggleDatabase}>
            {currentDatabase === 'testing' ? '🟢 TESTING' : '🔴 PRODUCTION'}
          </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Username</th>
              <th>Company Name</th>
             <th>Entity Size</th>
              <th>Created</th>
              <th>Last Edited</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentSMEs.map((sme) => (
              <tr key={sme.id}>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.userAvatar}>
                      {sme.profileImage ? (
                        <img src={sme.profileImage} alt={sme.username} />
                      ) : (
                        <span>{sme.username.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span>{sme.email}</span>
                  </div>
                </td>
                <td className={styles.companyName}>{sme.companyName}</td>
                <td className={styles.companyName}>{sme.profile.entitySize}</td>
                <td>{formatDate(sme.created)}</td>
                <td>{formatDate(sme.lastEdited)}</td>
                <td>{getStatusBadge(sme.status)}</td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("view", sme)}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("edit", sme)}
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("block", sme)}
                      title="Block"
                    >
                      <LockKeyhole size={16} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("delete", sme)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className={styles.pagination}>
        <div className={styles.paginationInfo}>
          Showing {startIndex + 1} to {Math.min(endIndex, filteredSMEs.length)} of {filteredSMEs.length} results
        </div>
        <div className={styles.paginationControls}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={styles.paginationBtn}
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <span className={styles.pageNumber}>
            {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={styles.paginationBtn}
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && selectedSME && (
        <div className={styles.modalOverlay} onClick={() => setShowViewModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <h2>{selectedSME.companyName}</h2>
                <p>{selectedSME.email}</p>
              </div>
              <button
                className={styles.closeButton}
                onClick={() => setShowViewModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalTabs}>
              <button
                className={`${styles.tab} ${activeTab === "profile" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("profile")}
              >
                <User size={16} />
                Universal Profile
              </button>
              <button
                className={`${styles.tab} ${activeTab === "funding" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("funding")}
              >
                <DollarSign size={16} />
                Funding Application
              </button>
              <button
                className={`${styles.tab} ${activeTab === "advisory" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("advisory")}
              >
                <FileText size={16} />
                Advisory Application
              </button>
              <button
                className={`${styles.tab} ${activeTab === "product" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("product")}
              >
                <Building2 size={16} />
                Product & Service
              </button>
              <button
                className={`${styles.tab} ${activeTab === "documents" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("documents")}
              >
                <FileText size={16} />
                Documents & NDAs
              </button>
              <button
                className={`${styles.tab} ${activeTab === "payments" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("payments")}
              >
                <DollarSign size={16} />
                Payments
              </button>
            </div>

            <div className={styles.modalBody}>
              <TabContent tab={activeTab} sme={selectedSME} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedSME && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <h2>Edit SME: {selectedSME.companyName}</h2>
                <p>Update SME information</p>
              </div>
              <button
                className={styles.closeButton}
                onClick={() => setShowEditModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.editForm}>
                <div className={styles.formSection}>
                  <h3>Basic Information</h3>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Username</label>
                      <input
                        type="text"
                        value={editFormData.username || ""}
                        onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Email</label>
                      <input
                        type="email"
                        value={editFormData.email || ""}
                        onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Company Name</label>
                      <input
                        type="text"
                        value={editFormData.companyName || ""}
                        onChange={(e) => setEditFormData({...editFormData, companyName: e.target.value})}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Status</label>
                      <select
                        value={editFormData.status || ""}
                        onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                        className={styles.formSelect}
                      >
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="blocked">Blocked</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h3>Company Profile</h3>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Registered Name</label>
                      <input
                        type="text"
                        value={editFormData.profile?.registeredName || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, registeredName: e.target.value}
                        })}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Industry</label>
                      <input
                        type="text"
                        value={editFormData.profile?.industry || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, industry: e.target.value}
                        })}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Employees</label>
                      <select
                        value={editFormData.profile?.employees || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, employees: e.target.value}
                        })}
                        className={styles.formSelect}
                      >
                        <option value="">Select range</option>
                        <option value="1-10">1-10</option>
                        <option value="10-50">10-50</option>
                        <option value="50-100">50-100</option>
                        <option value="100-500">100-500</option>
                        <option value="500+">500+</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Revenue</label>
                      <select
                        value={editFormData.profile?.revenue || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, revenue: e.target.value}
                        })}
                        className={styles.formSelect}
                      >
                        <option value="">Select range</option>
                        <option value="$0 - $100K">$0 - $100K</option>
                        <option value="$100K - $500K">$100K - $500K</option>
                        <option value="$500K - $1M">$500K - $1M</option>
                        <option value="$1M - $5M">$1M - $5M</option>
                        <option value="$5M+">$5M+</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Location</label>
                      <input
                        type="text"
                        value={editFormData.profile?.location || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, location: e.target.value}
                        })}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Phone</label>
                      <input
                        type="text"
                        value={editFormData.profile?.phone || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, phone: e.target.value}
                        })}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Website</label>
                      <input
                        type="text"
                        value={editFormData.profile?.website || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, website: e.target.value}
                        })}
                        className={styles.formInput}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.saveButton}
                    onClick={handleEditSave}
                  >
                    <Save size={16} />
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <h2>Add New SME</h2>
                <p>Create a new SME account</p>
              </div>
              <button
                className={styles.closeButton}
                onClick={() => setShowAddModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.editForm}>
                <div className={styles.formSection}>
                  <h3>Basic Information</h3>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Username *</label>
                      <input
                        type="text"
                        value={addFormData.username}
                        onChange={(e) => setAddFormData({...addFormData, username: e.target.value})}
                        className={styles.formInput}
                        placeholder="Enter username"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Email *</label>
                      <input
                        type="email"
                        value={addFormData.email}
                        onChange={(e) => setAddFormData({...addFormData, email: e.target.value})}
                        className={styles.formInput}
                        placeholder="Enter email"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Company Name *</label>
                      <input
                        type="text"
                        value={addFormData.companyName}
                        onChange={(e) => setAddFormData({...addFormData, companyName: e.target.value})}
                        className={styles.formInput}
                        placeholder="Enter company name"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Status</label>
                      <select
                        value={addFormData.status}
                        onChange={(e) => setAddFormData({...addFormData, status: e.target.value})}
                        className={styles.formSelect}
                      >
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="blocked">Blocked</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h3>Company Profile (Optional)</h3>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Registered Name</label>
                      <input
                        type="text"
                        value={addFormData.profile.registeredName}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, registeredName: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="Enter registered name"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Industry</label>
                      <input
                        type="text"
                        value={addFormData.profile.industry}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, industry: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="Enter industry"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Employees</label>
                      <select
                        value={addFormData.profile.employees}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, employees: e.target.value}
                        })}
                        className={styles.formSelect}
                      >
                        <option value="">Select range</option>
                        <option value="1-10">1-10</option>
                        <option value="10-50">10-50</option>
                        <option value="50-100">50-100</option>
                        <option value="100-500">100-500</option>
                        <option value="500+">500+</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Revenue</label>
                      <select
                        value={addFormData.profile.revenue}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, revenue: e.target.value}
                        })}
                        className={styles.formSelect}
                      >
                        <option value="">Select range</option>
                        <option value="$0 - $100K">$0 - $100K</option>
                        <option value="$100K - $500K">$100K - $500K</option>
                        <option value="$500K - $1M">$500K - $1M</option>
                        <option value="$1M - $5M">$1M - $5M</option>
                        <option value="$5M+">$5M+</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Location</label>
                      <input
                        type="text"
                        value={addFormData.profile.location}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, location: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="Enter location"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Phone</label>
                      <input
                        type="text"
                        value={addFormData.profile.phone}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, phone: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Website</label>
                      <input
                        type="text"
                        value={addFormData.profile.website}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, website: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="Enter website"
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.saveButton}
                    onClick={handleAddSME}
                    disabled={!addFormData.username || !addFormData.email || !addFormData.companyName}
                  >
                    <Check size={16} />
                    Create SME
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AllSMEs