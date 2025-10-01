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
  TrendingUp,
  File,
  Shield,
} from "lucide-react"
import styles from "./all-investors.module.css"

function AllInvestors() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedInvestor, setSelectedInvestor] = useState(null)
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
      firmName: "",
      investorType: "",
      investmentFocus: "",
      minInvestment: "",
      maxInvestment: "",
      location: "",
      phone: "",
      website: "",
    }
  })
  const [activeTab, setActiveTab] = useState("profile")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Mock Investor data - replace with real API calls
  const [investorData, setInvestorData] = useState([
    {
      id: 1,
      username: "capitalventures",
      email: "info@capitalventures.com",
      companyName: "Capital Ventures",
      created: "2024-01-20",
      lastEdited: "2024-06-22",
      status: "active",
      profileImage: null,
      profile: {
        firmName: "Capital Ventures Investment Fund",
        investorType: "Venture Capital",
        investmentFocus: "Technology, Healthcare",
        minInvestment: "$100,000",
        maxInvestment: "$5,000,000",
        location: "Cape Town, South Africa",
        phone: "+27 21 555 0123",
        website: "www.capitalventures.com",
      },
      documents: {
        nda: { signed: true, date: "2024-01-25" },
        compliance: { status: "approved", documents: 12 },
        uploads: 18,
      },
      payments: {
        subscription: "Premium",
        status: "paid",
        amount: "$499/month",
        nextBilling: "2024-07-20",
      },
    },
    {
      id: 2,
      username: "innovatefund",
      email: "contact@innovatefund.co.za",
      companyName: "Innovate Fund",
      created: "2024-03-15",
      lastEdited: "2024-06-18",
      status: "active",
      profileImage: null,
      profile: {
        firmName: "Innovate Fund Management",
        investorType: "Private Equity",
        investmentFocus: "Fintech, Manufacturing",
        minInvestment: "$500,000",
        maxInvestment: "$10,000,000",
        location: "Johannesburg, South Africa",
        phone: "+27 11 444 0987",
        website: "www.innovatefund.co.za",
      },
      documents: {
        nda: { signed: true, date: "2024-03-20" },
        compliance: { status: "approved", documents: 15 },
        uploads: 25,
      },
      payments: {
        subscription: "Enterprise",
        status: "paid",
        amount: "$899/month",
        nextBilling: "2024-08-15",
      },
    },
    {
      id: 3,
      username: "futureangels",
      email: "team@futureangels.com",
      companyName: "Future Angels",
      created: "2024-05-10",
      lastEdited: "2024-06-20",
      status: "pending",
      profileImage: null,
      profile: {
        firmName: "Future Angels Network",
        investorType: "Angel Network",
        investmentFocus: "Early Stage, AI, CleanTech",
        minInvestment: "$25,000",
        maxInvestment: "$500,000",
        location: "Durban, South Africa",
        phone: "+27 31 333 1234",
        website: "www.futureangels.com",
      },
      documents: {
        nda: { signed: false, date: null },
        compliance: { status: "pending", documents: 5 },
        uploads: 8,
      },
      payments: {
        subscription: "Basic",
        status: "pending",
        amount: "$199/month",
        nextBilling: "2024-07-10",
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
  const getInvestorDocuments = (investorId) => {
    // Mock investor documents data
    return [
      {
        id: 1,
        fileName: "NDA_Agreement.pdf",
        type: "nda",
        status: "signed",
        uploadDate: "2024-01-25",
        reviewDate: "2024-01-26",
        expiryDate: "2026-01-25",
        fileSize: "245 KB",
        reviewer: "Legal Team",
      },
      {
        id: 2,
        fileName: "Fund_Registration_Documents.zip",
        type: "investor_registration",
        subType: "Company Registration Documents",
        status: "approved",
        uploadDate: "2024-01-30",
        reviewDate: "2024-02-05",
        expiryDate: null,
        fileSize: "2.8 MB",
        reviewer: "Compliance Team",
      },
      {
        id: 3,
        fileName: "Fund_Lead_ID.pdf",
        type: "investor_id",
        subType: "ID of Fund Lead",
        status: "approved",
        uploadDate: "2024-01-31",
        reviewDate: "2024-02-06",
        expiryDate: null,
        fileSize: "567 KB",
        reviewer: "Compliance Team",
      },
      {
        id: 4,
        fileName: "Investment_Mandate_2024.pdf",
        type: "investor_mandate",
        subType: "Investment Mandate or Programme Brochures",
        status: "approved",
        uploadDate: "2024-02-01",
        reviewDate: "2024-02-07",
        expiryDate: null,
        fileSize: "3.2 MB",
        reviewer: "Investment Committee",
      },
      {
        id: 5,
        fileName: "Fund_Performance_Report_2023.pdf",
        type: "investor_performance",
        subType: "Fund Performance Reports",
        status: "approved",
        uploadDate: "2024-02-15",
        reviewDate: "2024-02-20",
        expiryDate: null,
        fileSize: "1.9 MB",
        reviewer: "Investment Committee",
      },
      {
        id: 6,
        fileName: "Investment_Policy_Statement.pdf",
        type: "investor_policy",
        subType: "Investment Policy & Guidelines",
        status: "approved",
        uploadDate: "2024-03-01",
        reviewDate: "2024-03-05",
        expiryDate: "2025-03-01",
        fileSize: "1.1 MB",
        reviewer: "Compliance Team",
      },
      {
        id: 7,
        fileName: "Due_Diligence_Framework.pdf",
        type: "investor_dd_framework",
        subType: "Due Diligence Framework & Process",
        status: "approved",
        uploadDate: "2024-03-10",
        reviewDate: "2024-03-15",
        expiryDate: null,
        fileSize: "892 KB",
        reviewer: "Investment Committee",
      },
      {
        id: 8,
        fileName: "Fund_Terms_Sheet_Template.pdf",
        type: "investor_terms",
        subType: "Standard Terms Sheet Template",
        status: "pending",
        uploadDate: "2024-06-20",
        reviewDate: null,
        expiryDate: null,
        fileSize: "654 KB",
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
      investor_registration: "Fund Registration",
      investor_id: "Fund Lead ID",
      investor_mandate: "Investment Mandate",
      investor_performance: "Performance Report",
      investor_policy: "Investment Policy",
      investor_dd_framework: "DD Framework",
      investor_terms: "Terms Sheet Template",
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

  const filteredInvestors = investorData.filter((investor) => {
    const matchesSearch = 
      investor.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || investor.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredInvestors.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentInvestors = filteredInvestors.slice(startIndex, endIndex)

  const handleAction = (action, investor) => {
    switch (action) {
      case "view":
        setSelectedInvestor(investor)
        setShowViewModal(true)
        setActiveTab("profile")
        break
      case "edit":
        setSelectedInvestor(investor)
        setEditFormData({
          username: investor.username,
          email: investor.email,
          companyName: investor.companyName,
          status: investor.status,
          profile: { ...investor.profile }
        })
        setShowEditModal(true)
        break
      case "delete":
        if (window.confirm(`Are you sure you want to delete ${investor.companyName}?`)) {
          setInvestorData(investorData.filter(i => i.id !== investor.id))
        }
        break
      case "block":
        if (window.confirm(`Are you sure you want to block ${investor.companyName}?`)) {
          setInvestorData(investorData.map(i => 
            i.id === investor.id ? { ...i, status: "blocked" } : i
          ))
        }
        break
      default:
        break
    }
  }

  const handleEditSave = () => {
    setInvestorData(investorData.map(investor => 
      investor.id === selectedInvestor.id 
        ? { 
            ...investor, 
            ...editFormData,
            lastEdited: new Date().toISOString().split('T')[0]
          } 
        : investor
    ))
    setShowEditModal(false)
    setSelectedInvestor(null)
    setEditFormData({})
  }

  const handleAddInvestor = () => {
    const newInvestor = {
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
      payments: {
        subscription: "Basic",
        status: "pending",
        amount: "$199/month",
        nextBilling: null,
      },
    }
    
    setInvestorData([...investorData, newInvestor])
    setShowAddModal(false)
    setAddFormData({
      username: "",
      email: "",
      companyName: "",
      status: "pending",
      profile: {
        firmName: "",
        investorType: "",
        investmentFocus: "",
        minInvestment: "",
        maxInvestment: "",
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

  const TabContent = ({ tab, investor }) => {
    switch (tab) {
      case "profile":
        return (
          <div className={styles.tabContent}>
            <div className={styles.profileSection}>
              <h3>Investment Firm Information</h3>
              <div className={styles.profileGrid}>
                <div className={styles.profileItem}>
                  <Building2 size={16} />
                  <span>Firm Name:</span>
                  <span>{investor.profile.firmName}</span>
                </div>
                <div className={styles.profileItem}>
                  <TrendingUp size={16} />
                  <span>Investor Type:</span>
                  <span>{investor.profile.investorType}</span>
                </div>
                <div className={styles.profileItem}>
                  <User size={16} />
                  <span>Investment Focus:</span>
                  <span>{investor.profile.investmentFocus}</span>
                </div>
                <div className={styles.profileItem}>
                  <DollarSign size={16} />
                  <span>Min Investment:</span>
                  <span>{investor.profile.minInvestment}</span>
                </div>
                <div className={styles.profileItem}>
                  <DollarSign size={16} />
                  <span>Max Investment:</span>
                  <span>{investor.profile.maxInvestment}</span>
                </div>
                <div className={styles.profileItem}>
                  <MapPin size={16} />
                  <span>Location:</span>
                  <span>{investor.profile.location}</span>
                </div>
                <div className={styles.profileItem}>
                  <Phone size={16} />
                  <span>Phone:</span>
                  <span>{investor.profile.phone}</span>
                </div>
                <div className={styles.profileItem}>
                  <Mail size={16} />
                  <span>Website:</span>
                  <span>{investor.profile.website}</span>
                </div>
              </div>
            </div>
          </div>
        )
      case "documents":
        const investorDocuments = getInvestorDocuments(investor.id)
        return (
          <div className={styles.tabContent}>
            <div className={styles.documentsSection}>
              <div className={styles.sectionHeader}>
                <h3>Documents & Compliance</h3>
                <div className={styles.documentStats}>
                  <span className={styles.statBadge}>
                    Total: {investorDocuments.length}
                  </span>
                  <span className={styles.statBadge}>
                    Approved: {investorDocuments.filter(doc => doc.status === 'approved' || doc.status === 'signed').length}
                  </span>
                  <span className={styles.statBadge}>
                    Pending: {investorDocuments.filter(doc => doc.status === 'pending').length}
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
                    {investorDocuments.map((document) => (
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
      case "payments":
        return (
          <div className={styles.tabContent}>
            <div className={styles.paymentsSection}>
              <h3>Payment Information</h3>
              <div className={styles.paymentCard}>
                <div className={styles.paymentHeader}>
                  <h4>{investor.payments.subscription} Subscription</h4>
                  {getStatusBadge(investor.payments.status)}
                </div>
                <div className={styles.paymentDetails}>
                  <p><strong>Amount:</strong> {investor.payments.amount}</p>
                  <p><strong>Next Billing:</strong> {investor.payments.nextBilling ? formatDate(investor.payments.nextBilling) : "N/A"}</p>
                  <p><strong>Status:</strong> {investor.payments.status}</p>
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
        <p>Loading Investors...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>All Investors</h1>
          <p className={styles.subtitle}>Manage and monitor all investor accounts</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.actionButton} onClick={() => alert("Export functionality coming soon!")}>
            <Download size={16} />
            Export
          </button>
          <button className={styles.primaryButton} onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add Investor
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
            {currentInvestors.map((investor) => (
              <tr key={investor.id}>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.userAvatar}>
                      {investor.profileImage ? (
                        <img src={investor.profileImage} alt={investor.username} />
                      ) : (
                        <span>{investor.username.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span>{investor.username}</span>
                  </div>
                </td>
                <td>{investor.email}</td>
                <td className={styles.companyName}>{investor.companyName}</td>
                <td>{formatDate(investor.created)}</td>
                <td>{formatDate(investor.lastEdited)}</td>
                <td>{getStatusBadge(investor.status)}</td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("view", investor)}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("edit", investor)}
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("block", investor)}
                      title="Block"
                    >
                      <Ban size={16} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("delete", investor)}
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
          Showing {startIndex + 1} to {Math.min(endIndex, filteredInvestors.length)} of {filteredInvestors.length} results
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
      {showViewModal && selectedInvestor && (
        <div className={styles.modalOverlay} onClick={() => setShowViewModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <h2>{selectedInvestor.companyName}</h2>
                <p>{selectedInvestor.email}</p>
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
              <button
                className={`${styles.tab} ${activeTab === "payments" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("payments")}
              >
                <DollarSign size={16} />
                Payments
              </button>
            </div>

            <div className={styles.modalBody}>
              <TabContent tab={activeTab} investor={selectedInvestor} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedInvestor && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <h2>Edit Investor: {selectedInvestor.companyName}</h2>
                <p>Update investor information</p>
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
                  <h3>Investment Firm Profile</h3>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Firm Name</label>
                      <input
                        type="text"
                        value={editFormData.profile?.firmName || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, firmName: e.target.value}
                        })}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Investor Type</label>
                      <select
                        value={editFormData.profile?.investorType || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, investorType: e.target.value}
                        })}
                        className={styles.formSelect}
                      >
                        <option value="">Select type</option>
                        <option value="Angel Investor">Angel Investor</option>
                        <option value="Angel Network">Angel Network</option>
                        <option value="Venture Capital">Venture Capital</option>
                        <option value="Private Equity">Private Equity</option>
                        <option value="Family Office">Family Office</option>
                        <option value="Corporate VC">Corporate VC</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Investment Focus</label>
                      <input
                        type="text"
                        value={editFormData.profile?.investmentFocus || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, investmentFocus: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="e.g., Technology, Healthcare, Fintech"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Min Investment</label>
                      <input
                        type="text"
                        value={editFormData.profile?.minInvestment || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, minInvestment: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="e.g., $25,000"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Max Investment</label>
                      <input
                        type="text"
                        value={editFormData.profile?.maxInvestment || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, maxInvestment: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="e.g., $5,000,000"
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
                <h2>Add New Investor</h2>
                <p>Create a new investor account</p>
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
                  <h3>Investment Firm Profile (Optional)</h3>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Firm Name</label>
                      <input
                        type="text"
                        value={addFormData.profile.firmName}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, firmName: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="Enter firm name"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Investor Type</label>
                      <select
                        value={addFormData.profile.investorType}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, investorType: e.target.value}
                        })}
                        className={styles.formSelect}
                      >
                        <option value="">Select type</option>
                        <option value="Angel Investor">Angel Investor</option>
                        <option value="Angel Network">Angel Network</option>
                        <option value="Venture Capital">Venture Capital</option>
                        <option value="Private Equity">Private Equity</option>
                        <option value="Family Office">Family Office</option>
                        <option value="Corporate VC">Corporate VC</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Investment Focus</label>
                      <input
                        type="text"
                        value={addFormData.profile.investmentFocus}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, investmentFocus: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="e.g., Technology, Healthcare, Fintech"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Min Investment</label>
                      <input
                        type="text"
                        value={addFormData.profile.minInvestment}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, minInvestment: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="e.g., $25,000"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Max Investment</label>
                      <input
                        type="text"
                        value={addFormData.profile.maxInvestment}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, maxInvestment: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="e.g., $5,000,000"
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
                    onClick={handleAddInvestor}
                    disabled={!addFormData.username || !addFormData.email || !addFormData.companyName}
                  >
                    <Check size={16} />
                    Create Investor
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

export default AllInvestors