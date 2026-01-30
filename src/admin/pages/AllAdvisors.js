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
  Target,
  Award,
  Briefcase,
  Star,
  File,
  Shield,
} from "lucide-react"
import styles from "./all-advisors.module.css"
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { auth } from "../../firebaseConfig"
import databaseService from "../../services/databaseService"

function AllAdvisors() {
  const navigate = useNavigate()

  
  const [currentDatabase, setCurrentDatabase] = useState(
          databaseService.getCurrentDatabase())
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedAdvisor, setSelectedAdvisor] = useState(null)
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
      fullName: "",
      jobTitle: "",
      company: "",
      expertiseAreas: "",
      industries: "",
      experienceLevel: "",
      advisoryServices: "",
      location: "",
      phone: "",
      website: "",
    }
  })
  const [activeTab, setActiveTab] = useState("profile")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)


// Remove the mock data and replace with:
const [advisorData, setAdvisorData] = useState([]);


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
          fetchAdvisors();
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

  const fetchAdvisors = async () => {
    try {
      setLoading(true);
      
       const db = getCurrentDb();
      // Fetch from Firestore collection 'advisorProfiles'
      const advisorsRef = collection(db, 'advisorProfiles');
      const querySnapshot = await getDocs(advisorsRef);
      
      // Map Firestore data to your expected format
      const fetchedAdvisors = querySnapshot.docs.map((doc, index) => {
        const data = doc.data();
        const formData = data.formData || {};
        const contactDetails = formData.contactDetails || {};
        
        // Format the date from Firestore
        const formatFirestoreDate = (timestamp) => {
          if (timestamp && timestamp.toDate) {
            return timestamp.toDate().toISOString().split('T')[0];
          }
          return timestamp || "2024-01-01";
        };
        
        const createdAt = formatFirestoreDate(data.createdAt);
        
        return {
          id: index + 1,
          firestoreId: doc.id, // Store for editing
          username: formData.username || 
                    contactDetails.email?.split('@')[0] || 
                    `advisor_${index + 1}`,
          email: contactDetails.email || '',
          companyName: contactDetails.company || "Not Provided",
          created: createdAt,
          lastEdited: formatFirestoreDate(data.updatedAt) || createdAt,
          status: data.status || "active",
          profileImage: null,

          profile: {
            fullName: contactDetails.primaryContactName || "Not Provided",
            jobTitle: contactDetails.jobTitle || "Not Provided",
            company: contactDetails.company || "Not Provided",
            expertiseAreas: formData.expertiseAreas || "Not Provided",
            industries: formData.industries || "Not Provided",
            experienceLevel: formData.experienceLevel || "Not Provided",
            advisoryServices: formData.advisoryServices || "Not Provided",
            location: contactDetails.location || "South Africa",
            phone: contactDetails.primaryContactMobile || "+27 xxx xxx xxx",
            website: contactDetails.website || "Not Provided",
          },
          documents: {
            nda: { signed: data.ndaSigned || false, date: formatFirestoreDate(data.ndaDate) },
            compliance: { 
              status: data.complianceStatus || "pending", 
              documents: data.complianceDocuments || 0 
            },
            uploads: data.totalUploads || 0,
          },
        };
      });
      
      setAdvisorData(fetchedAdvisors);
    } catch (error) {
      console.error("Error fetching advisor data:", error);
      setAdvisorData([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };
    // UPDATE your useEffect
    useEffect(() => {
      fetchAdvisors();
    }, []); // Keep empty dependencies
  
// Update the loading simulation to work with real data fetch
useEffect(() => {
  if (!loading) return;
  
  const timer = setTimeout(() => {
    // This acts as a fallback in case Firestore fetch takes too long
    if (advisorData.length === 0) {
      // Optionally keep showing loading or set empty data
      setLoading(false);
    }
  }, 3000);

  return () => clearTimeout(timer);
}, [loading, advisorData.length]);

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
    fetchAdvisors();
    
    // Show alert for production mode
    if (newDatabase === 'production') {
      alert('⚠️ WARNING: Switched to PRODUCTION database. All data is LIVE.');
    }
  };
  // Helper functions for documents
  const getAdvisorDocuments = (advisorId) => {
    // Mock advisor documents data
    return [
      {
        id: 1,
        fileName: "NDA_Agreement.pdf",
        type: "nda",
        status: "signed",
        uploadDate: "2024-02-01",
        reviewDate: "2024-02-02",
        expiryDate: "2026-02-01",
        fileSize: "245 KB",
        reviewer: "Legal Team",
      },
      {
        id: 2,
        fileName: "Advisor_Registration.zip",
        type: "advisor_registration",
        subType: "Company Registration Documents",
        status: "approved",
        uploadDate: "2024-01-30",
        reviewDate: "2024-02-05",
        expiryDate: null,
        fileSize: "1.9 MB",
        reviewer: "Compliance Team",
      },
      {
        id: 3,
        fileName: "Professional_CV.pdf",
        type: "advisor_cv",
        subType: "Curriculum Vitae & Professional Background",
        status: "approved",
        uploadDate: "2024-02-10",
        reviewDate: "2024-02-15",
        expiryDate: null,
        fileSize: "892 KB",
        reviewer: "HR Team",
      },
      {
        id: 4,
        fileName: "Professional_Certifications.zip",
        type: "advisor_certifications",
        subType: "Professional Certifications & Qualifications",
        status: "approved",
        uploadDate: "2024-02-12",
        reviewDate: "2024-02-17",
        expiryDate: "2025-12-31",
        fileSize: "3.4 MB",
        reviewer: "Credentials Team",
      },
      {
        id: 5,
        fileName: "Professional_References.pdf",
        type: "advisor_references",
        subType: "Professional References & Testimonials",
        status: "approved",
        uploadDate: "2024-02-15",
        reviewDate: "2024-02-20",
        expiryDate: null,
        fileSize: "1.2 MB",
        reviewer: "HR Team",
      },
      {
        id: 6,
        fileName: "Indemnity_Insurance_Certificate.pdf",
        type: "advisor_insurance",
        subType: "Professional Indemnity Insurance",
        status: "approved",
        uploadDate: "2024-03-01",
        reviewDate: "2024-03-05",
        expiryDate: "2025-03-01",
        fileSize: "567 KB",
        reviewer: "Insurance Team",
      },
      {
        id: 7,
        fileName: "Advisory_Agreement_Template.pdf",
        type: "advisor_agreement",
        subType: "Standard Advisory Agreement Template",
        status: "approved",
        uploadDate: "2024-03-10",
        reviewDate: "2024-03-15",
        expiryDate: null,
        fileSize: "934 KB",
        reviewer: "Legal Team",
      },
      {
        id: 8,
        fileName: "Fee_Structure_Schedule.pdf",
        type: "advisor_fees",
        subType: "Fee Structure & Billing Schedule",
        status: "approved",
        uploadDate: "2024-04-01",
        reviewDate: "2024-04-10",
        expiryDate: "2025-04-01",
        fileSize: "423 KB",
        reviewer: "Finance Team",
      },
      {
        id: 9,
        fileName: "Expertise_Portfolio.pdf",
        type: "advisor_portfolio",
        subType: "Advisory Portfolio & Case Studies",
        status: "pending",
        uploadDate: "2024-06-20",
        reviewDate: null,
        expiryDate: null,
        fileSize: "2.8 MB",
        reviewer: null,
      },
    ]
  }

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

  const getDocumentTypeBadge = (type, subType) => {
    const typeLabels = {
      nda: "NDA",
      advisor_registration: "Registration Documents",
      advisor_cv: "Professional CV",
      advisor_certifications: "Certifications",
      advisor_references: "Professional References",
      advisor_insurance: "Indemnity Insurance",
      advisor_agreement: "Advisory Agreement",
      advisor_fees: "Fee Structure",
      advisor_portfolio: "Expertise Portfolio",
    }
    
    return (
      <div className={styles.typeContainer}>
        <span className={`${styles.statusBadge} ${styles.statusPending}`}>
          {typeLabels[type] || type}
        </span>
      </div>
    )
  }

  const handleDocumentAction = (action, document) => {
    switch (action) {
      case "approve":
        alert(`Approving ${document.fileName}...`)
        break
      case "reject":
        if (window.confirm(`Are you sure you want to reject ${document.fileName}?`)) {
          alert(`Rejecting ${document.fileName}...`)
        }
        break
      case "download":
        alert(`Downloading ${document.fileName}...`)
        break
      case "view":
        alert(`Opening ${document.fileName} for preview...`)
        break
      case "delete":
        if (window.confirm(`Are you sure you want to delete ${document.fileName}?`)) {
          alert(`Deleting ${document.fileName}...`)
        }
        break
      default:
        break
    }
  }

  const filteredAdvisors = advisorData.filter((advisor) => {
    const matchesSearch = 
      advisor.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      advisor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      advisor.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      advisor.profile.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || advisor.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredAdvisors.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentAdvisors = filteredAdvisors.slice(startIndex, endIndex)

  const handleAction = (action, advisor) => {
    switch (action) {
      case "view":
        setSelectedAdvisor(advisor)
        setShowViewModal(true)
        setActiveTab("profile")
        break
      case "edit":
        setSelectedAdvisor(advisor)
        setEditFormData({
          username: advisor.username,
          email: advisor.email,
          companyName: advisor.companyName,
          status: advisor.status,
          profile: { ...advisor.profile }
        })
        setShowEditModal(true)
        break
      case "delete":
        if (window.confirm(`Are you sure you want to delete ${advisor.companyName}?`)) {
          setAdvisorData(advisorData.filter(a => a.id !== advisor.id))
        }
        break
      case "block":
        if (window.confirm(`Are you sure you want to block ${advisor.companyName}?`)) {
          setAdvisorData(advisorData.map(a => 
            a.id === advisor.id ? { ...a, status: "blocked" } : a
          ))
        }
        break
      default:
        break
    }
  }

  const handleEditSave = () => {
    setAdvisorData(advisorData.map(advisor => 
      advisor.id === selectedAdvisor.id 
        ? { 
            ...advisor, 
            ...editFormData,
            lastEdited: new Date().toISOString().split('T')[0]
          } 
        : advisor
    ))
    setShowEditModal(false)
    setSelectedAdvisor(null)
    setEditFormData({})
  }

  const handleAddAdvisor = () => {
    const newAdvisor = {
      id: Date.now(), // Simple ID generation
      ...addFormData,
      created: new Date().toISOString().split('T')[0],
      lastEdited: new Date().toISOString().split('T')[0],
      profileImage: null,
      documents: {
        nda: { signed: false, date: null },
        compliance: { status: "pending", documents: 0 },
        uploads: 0,
      },
    }
    
    setAdvisorData([...advisorData, newAdvisor])
    setShowAddModal(false)
    setAddFormData({
      username: "",
      email: "",
      companyName: "",
      status: "pending",
      profile: {
        fullName: "",
        jobTitle: "",
        company: "",
        expertiseAreas: "",
        industries: "",
        experienceLevel: "",
        advisoryServices: "",
        location: "",
        phone: "",
        website: "",
      }
    })
  }

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

  const TabContent = ({ tab, advisor }) => {
      console.log("Advisor data in TabContent:", advisor); // Debug log
    switch (tab) {
      case "profile":
        return (
          <div className={styles.tabContent}>
            <div className={styles.profileSection}>
              <h3>Advisor Information</h3>
              <div className={styles.profileGrid}>
                <div className={styles.profileItem}>
                  <User size={16} />
                  <span>Full Name:</span>
                  <span>{advisor.profile.fullName}</span>
                </div>
                <div className={styles.profileItem}>
                  <Briefcase size={16} />
                  <span>Job Title:</span>
                  <span>{advisor.profile.jobTitle}</span>
                </div>
                <div className={styles.profileItem}>
                  <Building2 size={16} />
                  <span>Company:</span>
                  <span>{advisor.profile.company}</span>
                </div>
                <div className={styles.profileItem}>
                  <Target size={16} />
                  <span>Expertise Areas:</span>
                  <span>{advisor.profile.expertiseAreas}</span>
                </div>
                <div className={styles.profileItem}>
                  <Award size={16} />
                  <span>Industries:</span>
                  <span>{advisor.profile.industries}</span>
                </div>
                <div className={styles.profileItem}>
                  <Star size={16} />
                  <span>Experience Level:</span>
                  <span>{advisor.profile.experienceLevel}</span>
                </div>
                <div className={styles.profileItem}>
                  <FileText size={16} />
                  <span>Advisory Services:</span>
                  <span>{advisor.profile.advisoryServices}</span>
                </div>
                <div className={styles.profileItem}>
                  <MapPin size={16} />
                  <span>Location:</span>
                  <span>{advisor.profile.location}</span>
                </div>
                <div className={styles.profileItem}>
                  <Phone size={16} />
                  <span>Phone:</span>
                  <span>{advisor.profile.phone}</span>
                </div>
                <div className={styles.profileItem}>
                  <Mail size={16} />
                  <span>Website:</span>
                  <span>{advisor.profile.website}</span>
                </div>
              </div>
            </div>
          </div>
        )
      case "documents":
        const advisorDocuments = getAdvisorDocuments(advisor.id)
        return (
          <div className={styles.tabContent}>
            <div className={styles.documentsSection}>
              <div className={styles.sectionHeader}>
                <h3>Documents & Credentials</h3>
                <div className={styles.documentStats}>
                  <span className={styles.statBadge}>
                    Total: {advisorDocuments.length}
                  </span>
                  <span className={styles.statBadge}>
                    Approved: {advisorDocuments.filter(doc => doc.status === 'approved' || doc.status === 'signed').length}
                  </span>
                  <span className={styles.statBadge}>
                    Pending: {advisorDocuments.filter(doc => doc.status === 'pending').length}
                  </span>
                </div>
              </div>
              
              <div className={styles.documentsTableContainer}>
                <table className={styles.documentsTable}>
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Upload Date</th>
                      <th>Review Date</th>
                      <th>Expiry</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advisorDocuments.map((document) => (
                      <tr key={document.id} className={
                        isExpired(document.expiryDate) ? styles.expiredRow :
                        isExpiringSoon(document.expiryDate) ? styles.expiringRow : ""
                      }>
                        <td>
                          <div className={styles.documentCell}>
                            <File size={16} className={styles.fileIcon} />
                            <div className={styles.documentInfo}>
                              <span className={styles.fileName}>{document.fileName}</span>
                              <span className={styles.fileSize}>{document.fileSize}</span>
                              {document.subType && (
                                <span className={styles.subType}>{document.subType}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{getDocumentTypeBadge(document.type, document.subType)}</td>
                        <td>{getDocumentStatusBadge(document.status)}</td>
                        <td>{formatDate(document.uploadDate)}</td>
                        <td>{formatDate(document.reviewDate)}</td>
                        <td>
                          {document.expiryDate && (
                            <span className={
                              isExpired(document.expiryDate) ? styles.expiredDate :
                              isExpiringSoon(document.expiryDate) ? styles.expiringDate : ""
                            }>
                              {formatDate(document.expiryDate)}
                            </span>
                          )}
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <button
                              className={styles.actionBtn}
                              onClick={() => handleDocumentAction("view", document)}
                              title="View Document"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              className={styles.actionBtn}
                              onClick={() => handleDocumentAction("download", document)}
                              title="Download"
                            >
                              <Download size={16} />
                            </button>
                            {document.status === "pending" && (
                              <>
                                <button
                                  className={styles.actionBtn}
                                  onClick={() => handleDocumentAction("approve", document)}
                                  title="Approve"
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button
                                  className={styles.actionBtn}
                                  onClick={() => handleDocumentAction("reject", document)}
                                  title="Reject"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            )}
                            <button
                              className={styles.actionBtn}
                              onClick={() => handleDocumentAction("delete", document)}
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
        <p>Loading Advisors...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>All Advisors</h1>
          <p className={styles.subtitle}>Manage and monitor all business advisors</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.actionButton} onClick={() => alert("Export functionality coming soon!")}>
            <Download size={16} />
            Export
          </button>
          <button className={styles.primaryButton} onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add Advisor
          </button>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by username, email, company, or advisor name..."
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
              <th>Email</th>
              <th>Company Name</th>
              <th>Created</th>
              <th>Last Edited</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentAdvisors.map((advisor) => (
              <tr key={advisor.id}>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.userAvatar}>
                      {advisor.profileImage ? (
                        <img src={advisor.profileImage} alt={advisor.username} />
                      ) : (
                        <span>{advisor.username.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span>{advisor.username}</span>
                  </div>
                </td>
                <td>{advisor.email}</td>
                <td className={styles.companyName}>{advisor.companyName}</td>
                <td>{formatDate(advisor.created)}</td>
                <td>{formatDate(advisor.lastEdited)}</td>
                <td>{getStatusBadge(advisor.status)}</td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("view", advisor)}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("edit", advisor)}
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("block", advisor)}
                      title="Block"
                    >
                      <Ban size={16} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("delete", advisor)}
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
          Showing {startIndex + 1} to {Math.min(endIndex, filteredAdvisors.length)} of {filteredAdvisors.length} results
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
      {showViewModal && selectedAdvisor && (
        <div className={styles.modalOverlay} onClick={() => setShowViewModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <h2>{selectedAdvisor.companyName}</h2>
                <p>{selectedAdvisor.profile.fullName} • {selectedAdvisor.email}</p>
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
                className={`${styles.tab} ${activeTab === "documents" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("documents")}
              >
                <FileText size={16} />
                Documents & NDAs
              </button>
            </div>

            <div className={styles.modalBody}>
              <TabContent tab={activeTab} advisor={selectedAdvisor} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedAdvisor && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <h2>Edit Advisor: {selectedAdvisor.companyName}</h2>
                <p>Update advisor information</p>
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
                  <h3>Advisor Profile</h3>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={editFormData.profile?.fullName || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, fullName: e.target.value}
                        })}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Job Title</label>
                      <input
                        type="text"
                        value={editFormData.profile?.jobTitle || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, jobTitle: e.target.value}
                        })}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Company</label>
                      <input
                        type="text"
                        value={editFormData.profile?.company || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, company: e.target.value}
                        })}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Expertise Areas</label>
                      <input
                        type="text"
                        value={editFormData.profile?.expertiseAreas || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, expertiseAreas: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="e.g., Business Strategy, Operations, Marketing"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Industries</label>
                      <input
                        type="text"
                        value={editFormData.profile?.industries || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, industries: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="e.g., Technology, Healthcare, Finance"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Experience Level</label>
                      <select
                        value={editFormData.profile?.experienceLevel || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, experienceLevel: e.target.value}
                        })}
                        className={styles.formSelect}
                      >
                        <option value="">Select experience</option>
                        <option value="3-5 years">3-5 years</option>
                        <option value="5-10 years">5-10 years</option>
                        <option value="10-15 years">10-15 years</option>
                        <option value="15+ years">15+ years</option>
                        <option value="20+ years">20+ years</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Advisory Services</label>
                      <input
                        type="text"
                        value={editFormData.profile?.advisoryServices || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, advisoryServices: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="e.g., Strategic Planning, Financial Advisory"
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
                <h2>Add New Advisor</h2>
                <p>Create a new business advisor account</p>
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
                        placeholder="Enter company/practice name"
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
                  <h3>Advisor Profile (Optional)</h3>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={addFormData.profile.fullName}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, fullName: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Job Title</label>
                      <input
                        type="text"
                        value={addFormData.profile.jobTitle}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, jobTitle: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="Enter job title"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Company</label>
                      <input
                        type="text"
                        value={addFormData.profile.company}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, company: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="Enter company name"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Expertise Areas</label>
                      <input
                        type="text"
                        value={addFormData.profile.expertiseAreas}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, expertiseAreas: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="e.g., Business Strategy, Operations, Marketing"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Industries</label>
                      <input
                        type="text"
                        value={addFormData.profile.industries}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, industries: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="e.g., Technology, Healthcare, Finance"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Experience Level</label>
                      <select
                        value={addFormData.profile.experienceLevel}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, experienceLevel: e.target.value}
                        })}
                        className={styles.formSelect}
                      >
                        <option value="">Select experience</option>
                        <option value="3-5 years">3-5 years</option>
                        <option value="5-10 years">5-10 years</option>
                        <option value="10-15 years">10-15 years</option>
                        <option value="15+ years">15+ years</option>
                        <option value="20+ years">20+ years</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Advisory Services</label>
                      <input
                        type="text"
                        value={addFormData.profile.advisoryServices}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, advisoryServices: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="e.g., Strategic Planning, Financial Advisory"
                      />
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
                    onClick={handleAddAdvisor}
                    disabled={!addFormData.username || !addFormData.email || !addFormData.companyName}
                  >
                    <Check size={16} />
                    Create Advisor
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

export default AllAdvisors