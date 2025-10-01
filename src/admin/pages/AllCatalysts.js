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
  Zap,
  Users,
  Target,
  File,
  Shield,
} from "lucide-react"
import styles from "./all-catalysts.module.css"

function AllCatalysts() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedCatalyst, setSelectedCatalyst] = useState(null)
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
      organizationName: "",
      programType: "",
      focusAreas: "",
      programDuration: "",
      supportOffered: "",
      location: "",
      phone: "",
      website: "",
    }
  })
  const [activeTab, setActiveTab] = useState("profile")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Mock Catalyst data - replace with real API calls
  const [catalystData, setCatalystData] = useState([
    {
      id: 1,
      username: "techaccelerator",
      email: "info@techaccelerator.co.za",
      companyName: "TechAccelerator",
      created: "2024-02-10",
      lastEdited: "2024-06-20",
      status: "active",
      profileImage: null,
      profile: {
        organizationName: "TechAccelerator Innovation Hub",
        programType: "Accelerator",
        focusAreas: "Technology, Fintech, AI",
        programDuration: "3-6 months",
        supportOffered: "Mentorship, Funding, Office Space, Legal Support",
        location: "Cape Town, South Africa",
        phone: "+27 21 789 0123",
        website: "www.techaccelerator.co.za",
      },
      documents: {
        nda: { signed: true, date: "2024-02-15" },
        compliance: { status: "approved", documents: 10 },
        uploads: 20,
      },
    },
    {
      id: 2,
      username: "startupincubator",
      email: "hello@startupincubator.com",
      companyName: "Startup Incubator SA",
      created: "2024-03-05",
      lastEdited: "2024-06-18",
      status: "active",
      profileImage: null,
      profile: {
        organizationName: "Startup Incubator South Africa",
        programType: "Incubator",
        focusAreas: "Early Stage, Healthcare, CleanTech",
        programDuration: "6-12 months",
        supportOffered: "Mentorship, Market Access, Product Development",
        location: "Johannesburg, South Africa",
        phone: "+27 11 654 3210",
        website: "www.startupincubator.com",
      },
      documents: {
        nda: { signed: true, date: "2024-03-10" },
        compliance: { status: "approved", documents: 15 },
        uploads: 28,
      },
    },
    {
      id: 3,
      username: "innovationlab",
      email: "contact@innovationlab.co.za",
      companyName: "Innovation Lab",
      created: "2024-04-20",
      lastEdited: "2024-06-15",
      status: "pending",
      profileImage: null,
      profile: {
        organizationName: "Innovation Lab Research Center",
        programType: "Research & Development",
        focusAreas: "Manufacturing, AgriTech, IoT",
        programDuration: "12+ months",
        supportOffered: "Research Facilities, Technical Expertise, IP Support",
        location: "Durban, South Africa",
        phone: "+27 31 987 6543",
        website: "www.innovationlab.co.za",
      },
      documents: {
        nda: { signed: false, date: null },
        compliance: { status: "pending", documents: 3 },
        uploads: 5,
      },
    },
  ])

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Helper functions for documents
  const getCatalystDocuments = (catalystId) => {
    // Mock catalyst documents data
    return [
      {
        id: 1,
        fileName: "NDA_Agreement.pdf",
        type: "nda",
        status: "signed",
        uploadDate: "2024-02-15",
        reviewDate: "2024-02-16",
        expiryDate: "2026-02-15",
        fileSize: "245 KB",
        reviewer: "Legal Team",
      },
      {
        id: 2,
        fileName: "Catalyst_Registration.zip",
        type: "catalyst_registration",
        subType: "Company Registration Documents",
        status: "approved",
        uploadDate: "2024-02-10",
        reviewDate: "2024-02-15",
        expiryDate: null,
        fileSize: "2.1 MB",
        reviewer: "Compliance Team",
      },
      {
        id: 3,
        fileName: "Catalyst_Lead_ID.pdf",
        type: "catalyst_id",
        subType: "ID of Program Lead",
        status: "approved",
        uploadDate: "2024-02-11",
        reviewDate: "2024-02-16",
        expiryDate: null,
        fileSize: "445 KB",
        reviewer: "Compliance Team",
      },
      {
        id: 4,
        fileName: "Program_Brochures_2024.zip",
        type: "catalyst_programmes",
        subType: "Program Details & Brochures",
        status: "approved",
        uploadDate: "2024-02-12",
        reviewDate: "2024-02-17",
        expiryDate: null,
        fileSize: "4.8 MB",
        reviewer: "Program Committee",
      },
      {
        id: 5,
        fileName: "Mentorship_Framework.pdf",
        type: "catalyst_mentorship",
        subType: "Mentorship Framework & Guidelines",
        status: "approved",
        uploadDate: "2024-02-20",
        reviewDate: "2024-02-25",
        expiryDate: null,
        fileSize: "1.3 MB",
        reviewer: "Program Committee",
      },
      {
        id: 6,
        fileName: "Selection_Criteria_2024.pdf",
        type: "catalyst_selection",
        subType: "SME Selection Criteria & Process",
        status: "approved",
        uploadDate: "2024-03-01",
        reviewDate: "2024-03-05",
        expiryDate: "2025-03-01",
        fileSize: "987 KB",
        reviewer: "Program Committee",
      },
      {
        id: 7,
        fileName: "Program_Curriculum.pdf",
        type: "catalyst_curriculum",
        subType: "Training Curriculum & Modules",
        status: "approved",
        uploadDate: "2024-03-10",
        reviewDate: "2024-03-15",
        expiryDate: null,
        fileSize: "2.4 MB",
        reviewer: "Program Committee",
      },
      {
        id: 8,
        fileName: "Partnership_Agreements.zip",
        type: "catalyst_partnerships",
        subType: "Strategic Partnership Agreements",
        status: "approved",
        uploadDate: "2024-04-01",
        reviewDate: "2024-04-10",
        expiryDate: "2025-04-01",
        fileSize: "3.1 MB",
        reviewer: "Legal Team",
      },
      {
        id: 9,
        fileName: "Performance_Metrics_Framework.pdf",
        type: "catalyst_metrics",
        subType: "Performance Tracking & KPIs",
        status: "pending",
        uploadDate: "2024-06-20",
        reviewDate: null,
        expiryDate: null,
        fileSize: "754 KB",
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
      catalyst_registration: "Organization Registration",
      catalyst_id: "Program Lead ID",
      catalyst_programmes: "Program Brochures",
      catalyst_mentorship: "Mentorship Framework",
      catalyst_selection: "Selection Criteria",
      catalyst_curriculum: "Training Curriculum",
      catalyst_partnerships: "Partnership Agreements",
      catalyst_metrics: "Performance Metrics",
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

  const filteredCatalysts = catalystData.filter((catalyst) => {
    const matchesSearch = 
      catalyst.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      catalyst.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      catalyst.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || catalyst.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredCatalysts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentCatalysts = filteredCatalysts.slice(startIndex, endIndex)

  const handleAction = (action, catalyst) => {
    switch (action) {
      case "view":
        setSelectedCatalyst(catalyst)
        setShowViewModal(true)
        setActiveTab("profile")
        break
      case "edit":
        setSelectedCatalyst(catalyst)
        setEditFormData({
          username: catalyst.username,
          email: catalyst.email,
          companyName: catalyst.companyName,
          status: catalyst.status,
          profile: { ...catalyst.profile }
        })
        setShowEditModal(true)
        break
      case "delete":
        if (window.confirm(`Are you sure you want to delete ${catalyst.companyName}?`)) {
          setCatalystData(catalystData.filter(c => c.id !== catalyst.id))
        }
        break
      case "block":
        if (window.confirm(`Are you sure you want to block ${catalyst.companyName}?`)) {
          setCatalystData(catalystData.map(c => 
            c.id === catalyst.id ? { ...c, status: "blocked" } : c
          ))
        }
        break
      default:
        break
    }
  }

  const handleEditSave = () => {
    setCatalystData(catalystData.map(catalyst => 
      catalyst.id === selectedCatalyst.id 
        ? { 
            ...catalyst, 
            ...editFormData,
            lastEdited: new Date().toISOString().split('T')[0]
          } 
        : catalyst
    ))
    setShowEditModal(false)
    setSelectedCatalyst(null)
    setEditFormData({})
  }

  const handleAddCatalyst = () => {
    const newCatalyst = {
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
    
    setCatalystData([...catalystData, newCatalyst])
    setShowAddModal(false)
    setAddFormData({
      username: "",
      email: "",
      companyName: "",
      status: "pending",
      profile: {
        organizationName: "",
        programType: "",
        focusAreas: "",
        programDuration: "",
        supportOffered: "",
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

  const TabContent = ({ tab, catalyst }) => {
    switch (tab) {
      case "profile":
        return (
          <div className={styles.tabContent}>
            <div className={styles.profileSection}>
              <h3>Organization Information</h3>
              <div className={styles.profileGrid}>
                <div className={styles.profileItem}>
                  <Building2 size={16} />
                  <span>Organization Name:</span>
                  <span>{catalyst.profile.organizationName}</span>
                </div>
                <div className={styles.profileItem}>
                  <Zap size={16} />
                  <span>Program Type:</span>
                  <span>{catalyst.profile.programType}</span>
                </div>
                <div className={styles.profileItem}>
                  <Target size={16} />
                  <span>Focus Areas:</span>
                  <span>{catalyst.profile.focusAreas}</span>
                </div>
                <div className={styles.profileItem}>
                  <Clock size={16} />
                  <span>Program Duration:</span>
                  <span>{catalyst.profile.programDuration}</span>
                </div>
                <div className={styles.profileItem}>
                  <Users size={16} />
                  <span>Support Offered:</span>
                  <span>{catalyst.profile.supportOffered}</span>
                </div>
                <div className={styles.profileItem}>
                  <MapPin size={16} />
                  <span>Location:</span>
                  <span>{catalyst.profile.location}</span>
                </div>
                <div className={styles.profileItem}>
                  <Phone size={16} />
                  <span>Phone:</span>
                  <span>{catalyst.profile.phone}</span>
                </div>
                <div className={styles.profileItem}>
                  <Mail size={16} />
                  <span>Website:</span>
                  <span>{catalyst.profile.website}</span>
                </div>
              </div>
            </div>
          </div>
        )
      case "documents":
        const catalystDocuments = getCatalystDocuments(catalyst.id)
        return (
          <div className={styles.tabContent}>
            <div className={styles.documentsSection}>
              <div className={styles.sectionHeader}>
                <h3>Documents & Compliance</h3>
                <div className={styles.documentStats}>
                  <span className={styles.statBadge}>
                    Total: {catalystDocuments.length}
                  </span>
                  <span className={styles.statBadge}>
                    Approved: {catalystDocuments.filter(doc => doc.status === 'approved' || doc.status === 'signed').length}
                  </span>
                  <span className={styles.statBadge}>
                    Pending: {catalystDocuments.filter(doc => doc.status === 'pending').length}
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
                    {catalystDocuments.map((document) => (
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
        <p>Loading Catalysts...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>All Catalysts</h1>
          <p className={styles.subtitle}>Manage and monitor all catalyst organizations</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.actionButton} onClick={() => alert("Export functionality coming soon!")}>
            <Download size={16} />
            Export
          </button>
          <button className={styles.primaryButton} onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add Catalyst
          </button>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by username, email, or organization name..."
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
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Organization Name</th>
              <th>Created</th>
              <th>Last Edited</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentCatalysts.map((catalyst) => (
              <tr key={catalyst.id}>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.userAvatar}>
                      {catalyst.profileImage ? (
                        <img src={catalyst.profileImage} alt={catalyst.username} />
                      ) : (
                        <span>{catalyst.username.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span>{catalyst.username}</span>
                  </div>
                </td>
                <td>{catalyst.email}</td>
                <td className={styles.companyName}>{catalyst.companyName}</td>
                <td>{formatDate(catalyst.created)}</td>
                <td>{formatDate(catalyst.lastEdited)}</td>
                <td>{getStatusBadge(catalyst.status)}</td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("view", catalyst)}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("edit", catalyst)}
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("block", catalyst)}
                      title="Block"
                    >
                      <Ban size={16} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("delete", catalyst)}
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
          Showing {startIndex + 1} to {Math.min(endIndex, filteredCatalysts.length)} of {filteredCatalysts.length} results
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
      {showViewModal && selectedCatalyst && (
        <div className={styles.modalOverlay} onClick={() => setShowViewModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <h2>{selectedCatalyst.companyName}</h2>
                <p>{selectedCatalyst.email}</p>
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
              <TabContent tab={activeTab} catalyst={selectedCatalyst} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedCatalyst && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <h2>Edit Catalyst: {selectedCatalyst.companyName}</h2>
                <p>Update catalyst organization information</p>
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
                      <label>Organization Name</label>
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
                  <h3>Organization Profile</h3>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Organization Name</label>
                      <input
                        type="text"
                        value={editFormData.profile?.organizationName || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, organizationName: e.target.value}
                        })}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Program Type</label>
                      <select
                        value={editFormData.profile?.programType || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, programType: e.target.value}
                        })}
                        className={styles.formSelect}
                      >
                        <option value="">Select type</option>
                        <option value="Accelerator">Accelerator</option>
                        <option value="Incubator">Incubator</option>
                        <option value="Research & Development">Research & Development</option>
                        <option value="Innovation Hub">Innovation Hub</option>
                        <option value="Technology Park">Technology Park</option>
                        <option value="Startup Studio">Startup Studio</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Focus Areas</label>
                      <input
                        type="text"
                        value={editFormData.profile?.focusAreas || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, focusAreas: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="e.g., Technology, Healthcare, Fintech"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Program Duration</label>
                      <select
                        value={editFormData.profile?.programDuration || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, programDuration: e.target.value}
                        })}
                        className={styles.formSelect}
                      >
                        <option value="">Select duration</option>
                        <option value="1-3 months">1-3 months</option>
                        <option value="3-6 months">3-6 months</option>
                        <option value="6-12 months">6-12 months</option>
                        <option value="12+ months">12+ months</option>
                        <option value="Ongoing">Ongoing</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Support Offered</label>
                      <input
                        type="text"
                        value={editFormData.profile?.supportOffered || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, supportOffered: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="e.g., Mentorship, Funding, Office Space"
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
                <h2>Add New Catalyst</h2>
                <p>Create a new catalyst organization</p>
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
                      <label>Organization Name *</label>
                      <input
                        type="text"
                        value={addFormData.companyName}
                        onChange={(e) => setAddFormData({...addFormData, companyName: e.target.value})}
                        className={styles.formInput}
                        placeholder="Enter organization name"
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
                  <h3>Organization Profile (Optional)</h3>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Organization Name</label>
                      <input
                        type="text"
                        value={addFormData.profile.organizationName}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, organizationName: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="Enter full organization name"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Program Type</label>
                      <select
                        value={addFormData.profile.programType}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, programType: e.target.value}
                        })}
                        className={styles.formSelect}
                      >
                        <option value="">Select type</option>
                        <option value="Accelerator">Accelerator</option>
                        <option value="Incubator">Incubator</option>
                        <option value="Research & Development">Research & Development</option>
                        <option value="Innovation Hub">Innovation Hub</option>
                        <option value="Technology Park">Technology Park</option>
                        <option value="Startup Studio">Startup Studio</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Focus Areas</label>
                      <input
                        type="text"
                        value={addFormData.profile.focusAreas}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, focusAreas: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="e.g., Technology, Healthcare, Fintech"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Program Duration</label>
                      <select
                        value={addFormData.profile.programDuration}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, programDuration: e.target.value}
                        })}
                        className={styles.formSelect}
                      >
                        <option value="">Select duration</option>
                        <option value="1-3 months">1-3 months</option>
                        <option value="3-6 months">3-6 months</option>
                        <option value="6-12 months">6-12 months</option>
                        <option value="12+ months">12+ months</option>
                        <option value="Ongoing">Ongoing</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Support Offered</label>
                      <input
                        type="text"
                        value={addFormData.profile.supportOffered}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, supportOffered: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="e.g., Mentorship, Funding, Office Space"
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
                    onClick={handleAddCatalyst}
                    disabled={!addFormData.username || !addFormData.email || !addFormData.companyName}
                  >
                    <Check size={16} />
                    Create Catalyst
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

export default AllCatalysts