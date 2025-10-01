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
} from "lucide-react"
import styles from "./all-smes.module.css"

function AllSMEs() {
  const navigate = useNavigate()
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

  // Mock SME data - replace with real API calls
  const [smeData, setSMEData] = useState([
    {
      id: 1,
      username: "techstart2024",
      email: "john@techstart.com",
      companyName: "TechStart Solutions",
      created: "2024-01-15",
      lastEdited: "2024-06-20",
      status: "active",
      profileImage: null,
      profile: {
        registeredName: "TechStart Solutions Pty Ltd",
        industry: "Technology",
        employees: "10-50",
        revenue: "$500K - $1M",
        location: "Cape Town, South Africa",
        phone: "+27 21 123 4567",
        website: "www.techstart.com",
      },
      applications: {
        funding: { status: "approved", amount: "$250,000", date: "2024-05-15" },
        advisory: { status: "pending", type: "Business Strategy", date: "2024-06-10" },
        product: { status: "approved", category: "SaaS Platform", date: "2024-04-20" },
      },
      documents: {
        nda: { signed: true, date: "2024-01-20" },
        compliance: { status: "approved", documents: 8 },
        uploads: 15,
      },
      payments: {
        subscription: "Premium",
        status: "paid",
        amount: "$299/month",
        nextBilling: "2024-07-15",
      },
    },
    {
      id: 2,
      username: "greentech_sa",
      email: "sarah@greentech.co.za",
      companyName: "GreenTech Industries",
      created: "2024-02-28",
      lastEdited: "2024-06-18",
      status: "active",
      profileImage: null,
      profile: {
        registeredName: "GreenTech Industries Ltd",
        industry: "Clean Energy",
        employees: "50-100",
        revenue: "$1M - $5M",
        location: "Johannesburg, South Africa",
        phone: "+27 11 987 6543",
        website: "www.greentech.co.za",
      },
      applications: {
        funding: { status: "approved", amount: "$500,000", date: "2024-04-10" },
        advisory: { status: "approved", type: "Financial Planning", date: "2024-03-15" },
        product: { status: "pending", category: "Solar Solutions", date: "2024-06-01" },
      },
      documents: {
        nda: { signed: true, date: "2024-03-05" },
        compliance: { status: "approved", documents: 12 },
        uploads: 23,
      },
      payments: {
        subscription: "Enterprise",
        status: "paid",
        amount: "$599/month",
        nextBilling: "2024-07-28",
      },
    },
    {
      id: 3,
      username: "innovate_corp",
      email: "mike@innovate.com",
      companyName: "InnovateCorp",
      created: "2024-03-10",
      lastEdited: "2024-06-15",
      status: "pending",
      profileImage: null,
      profile: {
        registeredName: "InnovateCorp Pty Ltd",
        industry: "Manufacturing",
        employees: "20-50",
        revenue: "$500K - $1M",
        location: "Durban, South Africa",
        phone: "+27 31 456 7890",
        website: "www.innovatecorp.com",
      },
      applications: {
        funding: { status: "pending", amount: "$150,000", date: "2024-06-01" },
        advisory: { status: "not_applied", type: null, date: null },
        product: { status: "rejected", category: "Manufacturing Tools", date: "2024-05-20" },
      },
      documents: {
        nda: { signed: false, date: null },
        compliance: { status: "pending", documents: 3 },
        uploads: 7,
      },
      payments: {
        subscription: "Basic",
        status: "overdue",
        amount: "$99/month",
        nextBilling: "2024-06-10",
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
  const getSMEDocuments = (smeId) => {
    // Mock compliance documents data
    return [
      {
        id: 1,
        fileName: "NDA_Agreement.pdf",
        type: "nda",
        status: "signed",
        uploadDate: "2024-01-20",
        reviewDate: "2024-01-22",
        expiryDate: "2026-01-20",
        fileSize: "245 KB",
        reviewer: "Legal Team",
      },
      {
        id: 2,
        fileName: "Company_Registration_Certificate.pdf",
        type: "compliance_business_registration",
        subType: "Company registration certificate",
        weight: "15%",
        status: "approved",
        uploadDate: "2024-02-15",
        reviewDate: "2024-02-18",
        expiryDate: null,
        fileSize: "890 KB",
        reviewer: "Compliance Team",
      },
      {
        id: 3,
        fileName: "Tax_Clearance_Certificate.pdf",
        type: "compliance_tax",
        subType: "Tax clearance certificate",
        weight: "22%",
        status: "approved",
        uploadDate: "2024-02-16",
        reviewDate: "2024-02-19",
        expiryDate: "2025-02-16",
        fileSize: "567 KB",
        reviewer: "Compliance Team",
      },
      {
        id: 4,
        fileName: "Business_Address_Proof.pdf",
        type: "compliance_address",
        subType: "Utility bill or lease agreement",
        weight: "6%",
        status: "approved",
        uploadDate: "2024-02-17",
        reviewDate: "2024-02-20",
        expiryDate: null,
        fileSize: "234 KB",
        reviewer: "Compliance Team",
      },
      {
        id: 5,
        fileName: "Directors_ID_Documents.zip",
        type: "compliance_directors_id",
        subType: "ID documents uploaded",
        weight: "11%",
        status: "approved",
        uploadDate: "2024-02-18",
        reviewDate: "2024-02-21",
        expiryDate: null,
        fileSize: "1.2 MB",
        reviewer: "Compliance Team",
      },
      {
        id: 6,
        fileName: "Share_Register.pdf",
        type: "compliance_ownership",
        subType: "Share register uploaded",
        weight: "11%",
        status: "approved",
        uploadDate: "2024-02-19",
        reviewDate: "2024-02-22",
        expiryDate: null,
        fileSize: "445 KB",
        reviewer: "Compliance Team",
      },
      {
        id: 7,
        fileName: "BBBEE_Certificate.pdf",
        type: "compliance_bbbee",
        subType: "B-BBEE certificate uploaded",
        weight: "16%",
        status: "approved",
        uploadDate: "2024-02-20",
        reviewDate: "2024-02-23",
        expiryDate: "2025-02-20",
        fileSize: "678 KB",
        reviewer: "Compliance Team",
      },
      {
        id: 8,
        fileName: "Company_Profile.pdf",
        type: "compliance_profile",
        subType: "Company brochure or profile uploaded",
        weight: "6%",
        status: "approved",
        uploadDate: "2024-02-21",
        reviewDate: "2024-02-24",
        expiryDate: null,
        fileSize: "2.1 MB",
        reviewer: "Compliance Team",
      },
      {
        id: 9,
        fileName: "COID_Registration.pdf",
        type: "compliance_coid",
        subType: "COID registration certificate",
        weight: "13%",
        status: "pending",
        uploadDate: "2024-06-22",
        reviewDate: null,
        expiryDate: null,
        fileSize: "389 KB",
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

  const handleAction = (action, sme) => {
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
        if (window.confirm(`Are you sure you want to delete ${sme.companyName}?`)) {
          setSMEData(smeData.filter(s => s.id !== sme.id))
        }
        break
      case "block":
        if (window.confirm(`Are you sure you want to block ${sme.companyName}?`)) {
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
                    {smeDocuments.map((document) => (
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
                        <td>{getDocumentTypeBadge(document.type, document.subType, document.weight)}</td>
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
          <button className={styles.actionButton} onClick={() => alert("Export functionality coming soon!")}>
            <Download size={16} />
            Export
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
                    <span>{sme.username}</span>
                  </div>
                </td>
                <td>{sme.email}</td>
                <td className={styles.companyName}>{sme.companyName}</td>
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
                      <Ban size={16} />
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