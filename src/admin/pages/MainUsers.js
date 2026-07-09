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
  LockOpen,
  RefreshCw,
} from "lucide-react"
import styles from "./all-profiles.module.css"
import { collection, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore"
import * as XLSX from 'xlsx';
import databaseService from "../../services/databaseService"
import { auth } from "../../firebaseConfig"

function MainUsers() {
  const navigate = useNavigate()
  
  const [currentDatabase, setCurrentDatabase] = useState(
    databaseService.getCurrentDatabase()
  )
  
  const [loading, setLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editFormData, setEditFormData] = useState({})
  const [addFormData, setAddFormData] = useState({
    username: "",
    email: "",
    companyName: "",
    status: "pending",
  })
  const [activeTab, setActiveTab] = useState("profile")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [usersData, setUsersData] = useState([])

  const getCurrentDb = () => {
    return databaseService.getFirestore();
  }

  useEffect(() => {
    const handleDatabaseChange = () => {
      const newDatabase = databaseService.getCurrentDatabase();
      setCurrentDatabase(newDatabase);
      fetchMainUsers();
    };

    window.addEventListener('storage', handleDatabaseChange);
    window.addEventListener('databaseChanged', handleDatabaseChange);

    return () => {
      window.removeEventListener('storage', handleDatabaseChange);
      window.removeEventListener('databaseChanged', handleDatabaseChange);
    };
  }, []);

  const fetchMainUsers = async () => {
    try {
      setLoading(true);
      
      const db = getCurrentDb();
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      const users = usersSnapshot.docs.map((doc, index) => {
        const userData = doc.data();
        const contactDetails = userData.contactDetails || {};
        
        const formatFirestoreDate = (timestamp) => {
          if (timestamp && timestamp.toDate) {
            return timestamp.toDate().toISOString().split('T')[0];
          }
          return timestamp || new Date().toISOString().split('T')[0];
        };
        
        const createdAt = formatFirestoreDate(userData.createdAt);
        
        return {
          id: index + 1,
          firestoreId: doc.id,
          username: userData.username || "N/A",
          email: contactDetails.email || userData.email || 'N/A',
          companyName: userData.companyName || "N/A",
          created: createdAt,
          lastEdited: formatFirestoreDate(userData.updatedAt) || createdAt,
          status: userData.status || "active",
          authStatus: userData.authStatus || "enabled",
        };
      });
      
      setUsersData(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsersData([]);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  useEffect(() => {
    fetchMainUsers();
  }, []);

  const toggleDatabase = () => {
    const newDatabase = databaseService.toggleDatabase();
    setCurrentDatabase(newDatabase);
    window.dispatchEvent(new CustomEvent('databaseChanged', {
      detail: { database: newDatabase }
    }));
    fetchMainUsers();
    
    if (newDatabase === 'production') {
      alert('⚠️ WARNING: Switched to PRODUCTION database. All data is LIVE.');
    }
  };

  const deleteUser = async (userId, userData) => {
    try {
      const db = getCurrentDb();
      
      if (currentDatabase === 'production') {
        const confirmProduction = window.confirm(
          `⚠️ WARNING: You are about to delete from PRODUCTION database.\n\n` +
          `This will permanently delete ${userData.companyName} from the live database.\n\n` +
          `Are you absolutely sure?`
        );
        if (!confirmProduction) return;
      }
      
      if (!window.confirm(`Are you sure you want to delete ${userData.companyName}? This action cannot be undone.`)) {
        return;
      }
      
      const firestoreId = userData.firestoreId;
      
      if (!firestoreId) {
        console.error("No Firestore ID found for this user");
        alert("Error: Unable to delete. No valid document ID found.");
        return;
      }
      
      const userRef = doc(db, 'users', firestoreId);
      await deleteDoc(userRef);
      
      setUsersData(prevData => prevData.filter(u => u.firestoreId !== firestoreId));
      alert(`Successfully deleted ${userData.companyName}`);
      
    } catch (error) {
      console.error("Error deleting user:", error);
      alert(`Error deleting user: ${error.message}`);
    }
  };

  const handleAction = async (action, user) => {
    switch (action) {
      case "view":
        setSelectedUser(user);
        setShowViewModal(true);
        break;
      case "edit":
        setSelectedUser(user);
        setEditFormData({
          username: user.username,
          email: user.email,
          companyName: user.companyName,
          status: user.status,
        });
        setShowEditModal(true);
        break;
      case "delete":
        await deleteUser(user.id, user);
        break;
      case "block":
        if (window.confirm(`Are you sure you want to suspend ${user.companyName}? They will not be able to log in.`)) {
          try {
            setLoading(true);
            setLoadingMessage("Suspending user account...");
            
            const reason = prompt("Reason for suspension (optional):") || "No reason provided";
            
            const currentUser = auth.currentUser;
            if (!currentUser) {
              throw new Error("No authenticated user found");
            }
            
            const idToken = await currentUser.getIdToken();
            
            setLoadingMessage("Calling suspension API...");
            const response = await fetch('https://us-central1-tuts-7ea8c.cloudfunctions.net/suspendUserAccount', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
              },
              body: JSON.stringify({
                data: {
                  userId: user.firestoreId,
                  reason: reason
                }
              })
            });
            
            const result = await response.json();
            
            if (result.success === true || result.data?.success === true) {
              setLoadingMessage("Updating local data...");
              // Update Firestore status locally
              const db = getCurrentDb();
              const userRef = doc(db, 'users', user.firestoreId);
              await updateDoc(userRef, { status: 'suspended' });
              
              // Refresh the data
              await fetchMainUsers();
              alert(`${user.companyName} has been suspended successfully.`);
            } else {
              throw new Error(result.message || "Suspension failed");
            }
          } catch (error) {
            console.error("Suspension failed:", error);
            alert(`Failed to suspend user: ${error.message}`);
          } finally {
            setLoading(false);
            setLoadingMessage("");
          }
        }
        break;
      case "unblock":
        if (window.confirm(`Are you sure you want to unblock ${user.companyName}?`)) {
          try {
            setLoading(true);
            setLoadingMessage("Reactivating user account...");
            
            const currentUser = auth.currentUser;
            if (!currentUser) {
              throw new Error("No authenticated user found");
            }
            
            const idToken = await currentUser.getIdToken();
            
            setLoadingMessage("Calling reactivation API...");
            const response = await fetch('https://us-central1-tuts-7ea8c.cloudfunctions.net/reactivateUserAccount', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
              },
              body: JSON.stringify({
                data: {
                  userId: user.firestoreId
                }
              })
            });
            
            const result = await response.json();
            
            if (result.success === true || result.data?.success === true) {
              setLoadingMessage("Updating local data...");
              // Update Firestore status locally
              const db = getCurrentDb();
              const userRef = doc(db, 'users', user.firestoreId);
              await updateDoc(userRef, { status: 'active' });
              
              // Refresh the data
              await fetchMainUsers();
              alert(`${user.companyName} has been unblocked successfully.`);
            } else {
              throw new Error(result.message || "Unblock failed");
            }
          } catch (error) {
            console.error("Unblock failed:", error);
            alert(`Failed to unblock user: ${error.message}`);
          } finally {
            setLoading(false);
            setLoadingMessage("");
          }
        }
        break;
      default:
        break;
    }
  };

  const handleEditSave = async () => {
    try {
      setLoading(true);
      const db = getCurrentDb();
      const userRef = doc(db, 'users', selectedUser.firestoreId);
      await updateDoc(userRef, {
        username: editFormData.username,
        email: editFormData.email,
        companyName: editFormData.companyName,
        status: editFormData.status,
        updatedAt: new Date()
      });
      
      await fetchMainUsers();
      setShowEditModal(false);
      setSelectedUser(null);
      setEditFormData({});
      alert("User updated successfully!");
    } catch (error) {
      console.error("Error updating user:", error);
      alert(`Error updating user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      setLoading(true);
      // Note: This just adds to Firestore, not to Firebase Auth
      const db = getCurrentDb();
      const usersRef = collection(db, 'users');
      const newUserRef = doc(usersRef);
      
      await updateDoc(newUserRef, {
        username: addFormData.username,
        email: addFormData.email,
        companyName: addFormData.companyName,
        status: addFormData.status,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await fetchMainUsers();
      setShowAddModal(false);
      setAddFormData({
        username: "",
        email: "",
        companyName: "",
        status: "pending",
      });
      alert("User created successfully!");
    } catch (error) {
      console.error("Error creating user:", error);
      alert(`Error creating user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    try {
      const dataToExport = filteredUsers;
      
      if (dataToExport.length === 0) {
        alert("No data to export!");
        return;
      }
      
      const excelData = dataToExport.map(user => ({
        Username: user.username,
        Email: user.email,
        "Company Name": user.companyName,
        Created: user.created,
        Status: user.status,
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      const calculateColumnWidths = (data) => {
        const widths = [];
        const keys = Object.keys(data[0] || {});
        
        keys.forEach((key, colIndex) => {
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
      
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const headerCell = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!worksheet[headerCell]) continue;
        worksheet[headerCell].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "E0E0E0" } }
        };
      }
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "MainUsers");
      
      const fileName = `MainUsers_${new Date().toISOString().split('T')[0]}.xlsx`;
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
    };
    
    return (
      <span className={`${styles.statusBadge} ${statusStyles[status] || ""}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Create sorter function to push "N/A" usernames to the end
  const createNALastSorter = (getValue) => (a, b) => {
    const aValue = getValue(a);
    const bValue = getValue(b);
    
    const aIsNA = aValue === "N/A" || aValue?.toLowerCase() === "n/a";
    const bIsNA = bValue === "N/A" || bValue?.toLowerCase() === "n/a";
    
    if (aIsNA === bIsNA) {
      // For non-N/A items, sort alphabetically
      if (!aIsNA && !bIsNA) {
        return String(aValue).localeCompare(String(bValue));
      }
      return 0;
    }
    
    // Push N/A items to the end
    return aIsNA ? 1 : -1;
  };

  // Filter and sort users - push "N/A" usernames to the end
  const filteredUsers = usersData
    .filter((user) => {
      const matchesSearch = 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.companyName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort(createNALastSorter(user => user.username));

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

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
          <p>Loading users...</p>
        )}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Main Users</h1>
          <p className={styles.subtitle}>Manage and monitor authentication users</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.actionButton} onClick={fetchMainUsers}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className={styles.actionButton} onClick={exportToExcel}>
            <Download size={16} />
            Export to Excel
          </button>
          <button className={styles.primaryButton} onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add User
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
              <th>Email</th>
              <th>Created</th>
              <th>Last Edited</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <tr key={user.firestoreId || user.id}>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.userAvatar}>
                      <span>{user.username.charAt(0).toUpperCase()}</span>
                    </div>
                    <span>{user.username}</span>
                  </div>
                </td>
                <td>
                  <div className={styles.emailCell}>
                    <span>{user.email}</span>
                  </div>
                </td>
                <td>{formatDate(user.created)}</td>
                <td>{formatDate(user.lastEdited)}</td>
                <td>{getStatusBadge(user.status)}</td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("view", user)}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("edit", user)}
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    {user.status === "suspended" ? (
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleAction("unblock", user)}
                        title="Unblock User"
                        style={{ color: "#4CAF50" }}
                      >
                        <LockOpen size={16} />
                      </button>
                    ) : (
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleAction("block", user)}
                        title="Block User"
                        style={{ color: "#f44336" }}
                      >
                        <LockKeyhole size={16} />
                      </button>
                    )}
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("delete", user)}
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
          Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} results
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

      {/* View Modal - Simplified */}
      {showViewModal && selectedUser && (
        <div className={styles.modalOverlay} onClick={() => setShowViewModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <h2>{selectedUser.companyName}</h2>
                <p>{selectedUser.email}</p>
              </div>
              <button
                className={styles.closeButton}
                onClick={() => setShowViewModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.profileSection}>
                <h3>User Information</h3>
                <div className={styles.profileGrid}>
                  <div className={styles.profileItem}>
                    <User size={16} />
                    <span>Username:</span>
                    <span>{selectedUser.username}</span>
                  </div>
                  <div className={styles.profileItem}>
                    <Mail size={16} />
                    <span>Email:</span>
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className={styles.profileItem}>
                    <Building2 size={16} />
                    <span>Company:</span>
                    <span>{selectedUser.companyName}</span>
                  </div>
                  <div className={styles.profileItem}>
                    <CheckCircle size={16} />
                    <span>Status:</span>
                    <span>{getStatusBadge(selectedUser.status)}</span>
                  </div>
                  <div className={styles.profileItem}>
                    <Calendar size={16} />
                    <span>Created:</span>
                    <span>{formatDate(selectedUser.created)}</span>
                  </div>
                  <div className={styles.profileItem}>
                    <Calendar size={16} />
                    <span>Last Edited:</span>
                    <span>{formatDate(selectedUser.lastEdited)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <h2>Edit User: {selectedUser.companyName}</h2>
                <p>Update user information</p>
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
                  <h3>User Information</h3>
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

      {/* Add User Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <h2>Add New User</h2>
                <p>Create a new authentication user</p>
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
                  <h3>User Information</h3>
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
                    onClick={handleAddUser}
                    disabled={!addFormData.username || !addFormData.email || !addFormData.companyName}
                  >
                    <Check size={16} />
                    Create User
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

export default MainUsers