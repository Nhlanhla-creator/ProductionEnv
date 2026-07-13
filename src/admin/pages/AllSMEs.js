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
  LockKeyhole,
  LockOpen,
  RefreshCw,
  Briefcase,
} from "lucide-react"
import styles from "./all-profiles.module.css"
import { collection, getDocs, doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore"
import { db, auth } from "../../firebaseConfig"
import * as XLSX from 'xlsx';
import databaseService from "../../services/databaseService"

function AllSMEs() {
  const navigate = useNavigate()
  
  const [currentDatabase, setCurrentDatabase] = useState(
    databaseService.getCurrentDatabase()
  )
  
  const [loading, setLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedSME, setSelectedSME] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDisableReasonModal, setShowDisableReasonModal] = useState(false)
  const [disableReason, setDisableReason] = useState("")
  const [selectedSMEForAction, setSelectedSMEForAction] = useState(null)
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

  // Helper functions
  const getCurrentDb = () => {
    return databaseService.getFirestore();
  }

  // Listen for database changes
  useEffect(() => {
    const handleDatabaseChange = () => {
      const newDatabase = databaseService.getCurrentDatabase();
      setCurrentDatabase(newDatabase);
      fetchSMEs();
    };

    window.addEventListener('storage', handleDatabaseChange);
    window.addEventListener('databaseChanged', handleDatabaseChange);

    return () => {
      window.removeEventListener('storage', handleDatabaseChange);
      window.removeEventListener('databaseChanged', handleDatabaseChange);
    };
  }, []);

  // Fetch SMEs from universalProfiles
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
        const verificationData = userData.verification || {};
        
        const formatFirestoreDate = (timestamp) => {
          if (timestamp && timestamp.toDate) {
            return timestamp.toDate().toISOString().split('T')[0];
          }
          return timestamp || "2024-01-01";
        };
        
        const createdAt = formatFirestoreDate(userData.createdAt);
        
        // Check if SME role is disabled for this user
        const isSmeDisabled = userData.disabledRoles?.SMSEs?.disabled === true || 
                              userData.disabledRoles?.SME?.disabled === true ||
                              userData.disabledRoles?.SMSE?.disabled === true ||
                              userData.status === "suspended";
        const disabledReason = userData.disabledRoles?.SMSEs?.reason || 
                               userData.disabledRoles?.SME?.reason ||
                               userData.disabledRoles?.SMSE?.reason ||
                               userData.suspensionReason ||
                               null;
        
        return {
          id: index + 1,
          firestoreId: doc.id,
          username: userData.username || "N/A",
          email: contactDetails.email || userData.email || 'N/A',
          companyName: entityOverview.registeredName || entityOverview.companyName || "N/A",
          created: createdAt,
          lastEdited: formatFirestoreDate(userData.updatedAt) || createdAt,
          status: isSmeDisabled ? "suspended" : (userData.status || "active"),
          disabledReason: disabledReason,
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
          verification: verificationData,
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

  useEffect(() => {
    fetchSMEs();
  }, []);

  // Toggle database between testing and production
  const toggleDatabase = () => {
    const newDatabase = databaseService.toggleDatabase();
    setCurrentDatabase(newDatabase);
    window.dispatchEvent(new CustomEvent('databaseChanged', {
      detail: { database: newDatabase }
    }));
    fetchSMEs();
    
    if (newDatabase === 'production') {
      alert('⚠️ WARNING: Switched to PRODUCTION database. All data is LIVE.');
    }
  };

  // Check if user has other active roles
  const hasOtherActiveRoles = async (userId) => {
    try {
      const db = getCurrentDb();
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);
      
      if (!userDocSnap.exists()) {
        return false;
      }
      
      const userData = userDocSnap.data();
      
      // Get all roles
      let allRoles = [];
      if (userData.roleArray && Array.isArray(userData.roleArray)) {
        allRoles = userData.roleArray;
      } else if (typeof userData.role === "string") {
        allRoles = userData.role.split(",").map(r => r.trim());
      }
      
      // Get disabled roles
      const disabledRoles = userData.disabledRoles || {};
      const disabledRoleNames = Object.keys(disabledRoles);
      
      // Filter out SME role and disabled roles
      const otherActiveRoles = allRoles.filter(role => 
        role !== "SMSEs" && role !== "SME" && role !== "SMSE" && 
        !disabledRoleNames.includes(role)
      );
      
      return otherActiveRoles.length > 0;
    } catch (error) {
      console.error("Error checking other roles:", error);
      return false;
    }
  };

  // Disable SME role for a user
  const disableSMERole = async () => {
    if (!disableReason.trim()) {
      alert("Please provide a reason for disabling this role.");
      return;
    }
    
    try {
      setLoading(true);
      setLoadingMessage(`Disabling SME role...`);
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("No authenticated user found");
      }
      
      const db = getCurrentDb();
      const userId = selectedSMEForAction.firestoreId;
      
      // Check if user has other active roles
      const hasOtherRoles = await hasOtherActiveRoles(userId);
      
      // Get the user document
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);
      
      if (!userDocSnap.exists()) {
        throw new Error("User profile not found");
      }
      
      const userData = userDocSnap.data();
      
      // Get current roles
      let allRoles = [];
      if (userData.roleArray && Array.isArray(userData.roleArray)) {
        allRoles = userData.roleArray;
      } else if (typeof userData.role === "string") {
        allRoles = userData.role.split(",").map(r => r.trim());
      }
      
      // Remove SME role from roleArray
      let updatedRoleArray = allRoles.filter(role => role !== "SMSEs" && role !== "SME" && role !== "SMSE");
      
      // Remove SME role from role string
      let updatedRoleString = updatedRoleArray.join(",");
      
      // Add SME to disabledRoles with reason
      const updatedDisabledRoles = { ...(userData.disabledRoles || {}) };
      updatedDisabledRoles.SMSEs = {
        disabled: true,
        disabledAt: Date.now(),
        disabledBy: currentUser.uid,
        disabledByEmail: currentUser.email,
        reason: disableReason,
        originalStatus: "active"
      };
      
      // Update Firestore users collection
      await updateDoc(userDocRef, {
        roleArray: updatedRoleArray,
        role: updatedRoleString,
        disabledRoles: updatedDisabledRoles,
        lastEdited: new Date().toISOString()
      });
      
      // If this was the LAST active role, call suspendUserAccount cloud function
      if (!hasOtherRoles) {
        try {
          const idToken = await currentUser.getIdToken();
          const response = await fetch('https://us-central1-tuts-7ea8c.cloudfunctions.net/suspendUserAccount', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              data: {
                userId: userId,
                reason: disableReason
              }
            })
          });
          
          const result = await response.json();
          
          if (result.success === true || result.data?.success === true) {
            console.log("User account suspended successfully");
          } else {
            throw new Error(result.message || "Failed to suspend account");
          }
        } catch (authError) {
          console.error("Error calling suspendUserAccount:", authError);
          // Continue anyway - Firestore is updated
        }
      }
      
      // Update universalProfiles
      const profileRef = doc(db, 'universalProfiles', userId);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        await updateDoc(profileRef, {
          status: "suspended",
          suspendedReason: disableReason,
          suspendedAt: new Date().toISOString(),
          suspendedBy: currentUser.uid,
          suspendedByEmail: currentUser.email
        });
      }
      
      const message = !hasOtherRoles 
        ? `SME role was the last active role. The user's account has been fully suspended.`
        : `SME role has been disabled successfully. The user can still log in with other roles.`;
      
      alert(message);
      setShowDisableReasonModal(false);
      setDisableReason("");
      setSelectedSMEForAction(null);
      
      await fetchSMEs();
      
    } catch (error) {
      console.error("Error disabling SME role:", error);
      alert(`Failed to disable SME role: ${error.message}`);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  // Enable SME role for a user
  const enableSMERole = async (sme) => {
    try {
      setLoading(true);
      setLoadingMessage(`Reactivating SME role...`);
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("No authenticated user found");
      }
      
      const db = getCurrentDb();
      const userId = sme.firestoreId;
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);
      
      if (!userDocSnap.exists()) {
        throw new Error("User profile not found");
      }
      
      const userData = userDocSnap.data();
      
      // Add SME role back to roleArray
      let updatedRoleArray = [...(userData.roleArray || [])];
      if (!updatedRoleArray.includes("SMSEs")) {
        updatedRoleArray.push("SMSEs");
      }
      
      // Add SME role back to role string
      let updatedRoleString = userData.role || "";
      const currentRoles = updatedRoleString.split(",").map(r => r.trim()).filter(r => r);
      if (!currentRoles.includes("SMSEs")) {
        updatedRoleString = currentRoles.length > 0 
          ? `${updatedRoleString},SMSEs` 
          : "SMSEs";
      }
      
      // Remove from disabledRoles
      const updatedDisabledRoles = { ...(userData.disabledRoles || {}) };
      if (updatedDisabledRoles.SMSEs) {
        delete updatedDisabledRoles.SMSEs;
      }
      
      // Update Firestore users collection
      await updateDoc(userDocRef, {
        roleArray: updatedRoleArray,
        role: updatedRoleString,
        disabledRoles: updatedDisabledRoles,
        lastEdited: new Date().toISOString()
      });
      
      // Check if there are any remaining disabled roles
      const remainingDisabledRoles = Object.keys(updatedDisabledRoles).length;
      
      // If no more disabled roles, call reactivateUserAccount cloud function
      if (remainingDisabledRoles === 0) {
        try {
          const idToken = await currentUser.getIdToken();
          const response = await fetch('https://us-central1-tuts-7ea8c.cloudfunctions.net/reactivateUserAccount', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              data: {
                userId: userId
              }
            })
          });
          
          const result = await response.json();
          
          if (result.success === true || result.data?.success === true) {
            console.log("User account reactivated successfully");
          } else {
            throw new Error(result.message || "Failed to reactivate account");
          }
        } catch (authError) {
          console.error("Error calling reactivateUserAccount:", authError);
          // Continue anyway - Firestore is updated
        }
      }
      
      // Update universalProfiles
      const profileRef = doc(db, 'universalProfiles', userId);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        await updateDoc(profileRef, {
          status: "active",
          suspendedReason: null,
          reactivatedAt: new Date().toISOString(),
          reactivatedBy: currentUser.uid,
          reactivatedByEmail: currentUser.email
        });
      }
      
      alert(`SME role has been reactivated successfully.`);
      await fetchSMEs();
      
    } catch (error) {
      console.error("Error enabling SME role:", error);
      alert(`Failed to reactivate SME role: ${error.message}`);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  // Delete SME (full account deletion)
  const deleteSME = async (sme) => {
    try {
      const db = getCurrentDb();
      
      if (currentDatabase === 'production') {
        const confirmProduction = window.confirm(
          `⚠️ WARNING: You are about to delete from PRODUCTION database.\n\n` +
          `This will permanently delete ${sme.companyName} from the live database.\n\n` +
          `Are you absolutely sure?`
        );
        if (!confirmProduction) return;
      }
      
      if (!window.confirm(`Are you sure you want to delete ${sme.companyName}? This action cannot be undone.`)) {
        return;
      }
      
      const firestoreId = sme.firestoreId;
      
      if (!firestoreId) {
        console.error("No Firestore ID found for this SME");
        alert("Error: Unable to delete. No valid document ID found.");
        return;
      }
      
      const smeRef = doc(db, 'universalProfiles', firestoreId);
      await deleteDoc(smeRef);
      
      setSMEData(prevData => prevData.filter(s => s.firestoreId !== firestoreId));
      alert(`Successfully deleted ${sme.companyName}`);
      
    } catch (error) {
      console.error("Error deleting SME:", error);
      alert(`Error deleting SME: ${error.message}`);
    }
  };

  // Main action handler
  const handleAction = async (action, sme) => {
    switch (action) {
      case "view":
        setSelectedSME(sme);
        setShowViewModal(true);
        setActiveTab("profile");
        break;
      case "edit":
        setSelectedSME(sme);
        setEditFormData({
          username: sme.username,
          email: sme.email,
          companyName: sme.companyName,
          status: sme.status,
          profile: { ...sme.profile }
        });
        setShowEditModal(true);
        break;
      case "delete":
        await deleteSME(sme);
        break;
      case "block":
        setSelectedSMEForAction(sme);
        setDisableReason("");
        setShowDisableReasonModal(true);
        break;
      case "unblock":
        await enableSMERole(sme);
        break;
      default:
        break;
    }
  };

  // Edit save handler
  const handleEditSave = async () => {
    try {
      setLoading(true);
      const db = getCurrentDb();
      const userRef = doc(db, 'universalProfiles', selectedSME.firestoreId);
      
      await updateDoc(userRef, {
        username: editFormData.username,
        email: editFormData.email,
        entityOverview: {
          registeredName: editFormData.companyName,
          ...editFormData.profile
        },
        status: editFormData.status,
        updatedAt: new Date()
      });
      
      await fetchSMEs();
      setShowEditModal(false);
      setSelectedSME(null);
      setEditFormData({});
      alert("SME updated successfully!");
    } catch (error) {
      console.error("Error updating SME:", error);
      alert(`Error updating SME: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Add SME handler
  const handleAddSME = async () => {
    try {
      setLoading(true);
      const db = getCurrentDb();
      const usersRef = collection(db, 'universalProfiles');
      const newUserRef = doc(usersRef);
      
      await updateDoc(newUserRef, {
        username: addFormData.username,
        email: addFormData.email,
        entityOverview: {
          registeredName: addFormData.companyName,
          ...addFormData.profile
        },
        status: addFormData.status,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await fetchSMEs();
      setShowAddModal(false);
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
      });
      alert("SME created successfully!");
    } catch (error) {
      console.error("Error creating SME:", error);
      alert(`Error creating SME: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    try {
      const dataToExport = filteredSMEs;
      
      if (dataToExport.length === 0) {
        alert("No data to export!");
        return;
      }
      
      const excelData = dataToExport.map(sme => ({
        Username: sme.username,
        Email: sme.email,
        "Company Name": sme.companyName,
        Created: sme.created,
        "Last Edited": sme.lastEdited,
        Status: sme.status === "suspended" ? "SME Disabled" : sme.status,
        "Disable Reason": sme.disabledReason || "",
        Industry: sme.profile.industry || "",
        Employees: sme.profile.employees || "",
        Location: sme.profile.location || "",
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      const calculateColumnWidths = (data) => {
        const widths = [];
        const keys = Object.keys(data[0] || {});
        
        keys.forEach((key) => {
          let maxLength = key.length;
          data.forEach(row => {
            const cellValue = String(row[key] || '');
            if (cellValue.length > maxLength) {
              maxLength = cellValue.length;
            }
          });
          const width = Math.min(Math.max(maxLength + 2, 10), 50);
          widths.push({ wch: width });
        });
        
        return widths;
      };
      
      worksheet['!cols'] = calculateColumnWidths(excelData);
      
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

  // Get status badge styling
  const getStatusBadge = (status, disabledReason) => {
    const statusStyles = {
      active: styles.statusActive,
      pending: styles.statusPending,
      blocked: styles.statusBlocked,
      suspended: styles.statusSuspended,
    }
    
    if (status === "suspended" && disabledReason) {
      return (
        <span className={`${styles.statusBadge} ${styles.statusSuspended}`} title={`Reason: ${disabledReason}`}>
          SME Disabled
        </span>
      )
    }
    
    return (
      <span className={`${styles.statusBadge} ${statusStyles[status] || ""}`}>
        {status === "suspended" ? "SME Disabled" : (status.charAt(0).toUpperCase() + status.slice(1))}
      </span>
    )
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  };

  // Filter and sort - push N/A usernames to the end
  const filteredSMEs = (() => {
    const filtered = smeData.filter((sme) => {
      const matchesSearch = 
        sme.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sme.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sme.companyName.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || sme.status === statusFilter
      
      return matchesSearch && matchesStatus
    });
    
    return filtered.sort((a, b) => {
      const aIsNA = a.username === "N/A" || a.username?.toLowerCase() === "n/a";
      const bIsNA = b.username === "N/A" || b.username?.toLowerCase() === "n/a";
      
      if (aIsNA === bIsNA) {
        if (!aIsNA && !bIsNA) {
          return a.username.localeCompare(b.username);
        }
        return 0;
      }
      
      return aIsNA ? 1 : -1;
    });
  })();

  // Pagination
  const totalPages = Math.ceil(filteredSMEs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentSMEs = filteredSMEs.slice(startIndex, endIndex)

  // Loading state
  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        {loadingMessage ? (
          <>
            <p>{loadingMessage}</p>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>Please wait...</p>
          </>
        ) : (
          <p>Loading SMEs...</p>
        )}
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
          <button className={styles.actionButton} onClick={fetchSMEs}>
            <RefreshCw size={16} />
            Refresh
          </button>
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
            <option value="suspended">SME Disabled</option>
          </select>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div
          style={{
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
          }}
          onClick={toggleDatabase}
        >
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
              <tr key={sme.firestoreId || sme.id}>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.userAvatar}>
                      <span>{sme.username.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <div>{sme.username}</div>
                      <div style={{ fontSize: '11px', color: '#666' }}>{sme.email}</div>
                    </div>
                  </div>
                </td>
                <td className={styles.companyName}>{sme.companyName}</td>
                <td className={styles.companyName}>{sme.profile.entitySize}</td>
                <td>{formatDate(sme.created)}</td>
                <td>{formatDate(sme.lastEdited)}</td>
                <td>{getStatusBadge(sme.status, sme.disabledReason)}</td>
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
                    {sme.status === "suspended" ? (
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleAction("unblock", sme)}
                        title="Reactivate SME Role"
                        style={{ color: "#4CAF50" }}
                      >
                        <LockOpen size={16} />
                      </button>
                    ) : (
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleAction("block", sme)}
                        title="Disable SME Role"
                        style={{ color: "#f44336" }}
                      >
                        <LockKeyhole size={16} />
                      </button>
                    )}
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

      {/* Disable Reason Modal */}
      {showDisableReasonModal && selectedSMEForAction && (
        <div className={styles.modalOverlay} onClick={() => setShowDisableReasonModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <h2>Disable SME Role</h2>
                <p>For {selectedSMEForAction.companyName}</p>
              </div>
              <button
                className={styles.closeButton}
                onClick={() => {
                  setShowDisableReasonModal(false);
                  setSelectedSMEForAction(null);
                  setDisableReason("");
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Reason for disabling this SME role:</label>
                <textarea
                  value={disableReason}
                  onChange={(e) => setDisableReason(e.target.value)}
                  placeholder="Enter reason (e.g., Terms violation, Inappropriate behavior, Incomplete documentation, etc.)"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    minHeight: '100px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  autoFocus
                />
              </div>
              <div className={styles.warningNote} style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fff3e0', borderRadius: '8px', fontSize: '13px' }}>
                <AlertTriangle size={16} style={{ color: '#ff9800', marginRight: '8px', verticalAlign: 'middle' }} />
                <span style={{ color: '#666' }}>
                  Disabling the SME role will prevent this user from accessing SME features. 
                  If this is their only role, their entire account will be disabled.
                </span>
              </div>
            </div>
            
            <div className={styles.modalFooter} style={{ padding: '16px', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setShowDisableReasonModal(false);
                  setSelectedSMEForAction(null);
                  setDisableReason("");
                }}
              >
                Cancel
              </button>
              <button
                className={styles.saveButton}
                onClick={disableSMERole}
                disabled={!disableReason.trim()}
                style={{ backgroundColor: '#f44336', color: 'white' }}
              >
                Disable SME Role
              </button>
            </div>
          </div>
        </div>
      )}

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
                Profile
              </button>
              <button
                className={`${styles.tab} ${activeTab === "documents" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("documents")}
              >
                <FileText size={16} />
                Documents
              </button>
            </div>

            <div className={styles.modalBody}>
              {activeTab === "profile" && (
                <div className={styles.tabContent}>
                  <div className={styles.profileSection}>
                    <h3>Company Information</h3>
                    <div className={styles.profileGrid}>
                      <div className={styles.profileItem}>
                        <Building2 size={16} />
                        <span>Registered Name:</span>
                        <span>{selectedSME.profile.registeredName}</span>
                      </div>
                      <div className={styles.profileItem}>
                        <User size={16} />
                        <span>Industry:</span>
                        <span>{selectedSME.profile.industry}</span>
                      </div>
                      <div className={styles.profileItem}>
                        <User size={16} />
                        <span>Employees:</span>
                        <span>{selectedSME.profile.employees}</span>
                      </div>
                      <div className={styles.profileItem}>
                        <DollarSign size={16} />
                        <span>Revenue:</span>
                        <span>{selectedSME.profile.revenue}</span>
                      </div>
                      <div className={styles.profileItem}>
                        <MapPin size={16} />
                        <span>Location:</span>
                        <span>{selectedSME.profile.location}</span>
                      </div>
                      <div className={styles.profileItem}>
                        <Phone size={16} />
                        <span>Phone:</span>
                        <span>{selectedSME.profile.phone}</span>
                      </div>
                      <div className={styles.profileItem}>
                        <Mail size={16} />
                        <span>Website:</span>
                        <span>{selectedSME.profile.website}</span>
                      </div>
                      {selectedSME.disabledReason && (
                        <div className={styles.profileItem}>
                          <AlertTriangle size={16} />
                          <span>Disable Reason:</span>
                          <span style={{ color: '#f44336' }}>{selectedSME.disabledReason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "documents" && (
                <div className={styles.tabContent}>
                  <div className={styles.documentsSection}>
                    <h3>Documents & Compliance</h3>
                    <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
                      Document management coming soon...
                    </p>
                  </div>
                </div>
              )}
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