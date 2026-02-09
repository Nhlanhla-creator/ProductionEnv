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
  X,
  User,
  FileText,
  Building2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  TrendingUp,
  Award,
  Users,
  Target,
  Save,
  Check,
  File,
  Globe,
  Briefcase,
} from "lucide-react"
import styles from "./all-profiles.module.css"

function AllSponsors() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedSponsor, setSelectedSponsor] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editFormData, setEditFormData] = useState({})
  const [addFormData, setAddFormData] = useState({
    username: "",
    email: "",
    companyName: "",
    contactPerson: "",
    status: "pending",
    profile: {
      industry: "",
      companySize: "",
      website: "",
      phone: "",
      location: "",
      description: "",
    },
    sponsorship: {
      tier: "",
      amount: "",
      duration: "",
      startDate: "",
      endDate: "",
      benefits: "",
    }
  })
  const [activeTab, setActiveTab] = useState("profile")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Mock Sponsor data
  const [sponsorData, setSponsorData] = useState([
    {
      id: 1,
      username: "techcorp_sponsor",
      email: "partnerships@techcorp.com",
      companyName: "TechCorp International",
      contactPerson: "Michael Johnson",
      created: "2024-01-15",
      lastEdited: "2024-06-20",
      status: "active",
      profileImage: null,
      profile: {
        industry: "Technology",
        companySize: "500-1000 employees",
        website: "www.techcorp.com",
        phone: "+27 21 555 0123",
        location: "Cape Town, South Africa",
        description: "Leading technology solutions provider specializing in enterprise software and cloud services.",
      },
      sponsorship: {
        tier: "Platinum",
        amount: "$50,000",
        duration: "12 months",
        startDate: "2024-01-15",
        endDate: "2025-01-14",
        benefits: "Logo placement, Speaking opportunities, VIP access to all events",
        eventsSponsored: 8,
        smesSupported: 15,
      },
      documents: {
        agreement: { signed: true, date: "2024-01-12" },
        invoices: { total: 4, paid: 4 },
        receipts: { total: 4 },
        totalUploads: 12,
      },
      impact: {
        eventsSponsored: 8,
        smesSupported: 15,
        totalInvestment: "$50,000",
        visibility: "High",
      },
    },
    {
      id: 2,
      username: "greenbank_sponsor",
      email: "csr@greenbank.co.za",
      companyName: "GreenBank South Africa",
      contactPerson: "Sarah Williams",
      created: "2024-02-01",
      lastEdited: "2024-06-18",
      status: "active",
      profileImage: null,
      profile: {
        industry: "Financial Services",
        companySize: "1000+ employees",
        website: "www.greenbank.co.za",
        phone: "+27 11 555 0456",
        location: "Johannesburg, South Africa",
        description: "Major financial institution committed to supporting SME development and entrepreneurship.",
      },
      sponsorship: {
        tier: "Gold",
        amount: "$30,000",
        duration: "12 months",
        startDate: "2024-02-01",
        endDate: "2025-01-31",
        benefits: "Logo placement, Event participation, Monthly reports",
        eventsSponsored: 5,
        smesSupported: 10,
      },
      documents: {
        agreement: { signed: true, date: "2024-01-28" },
        invoices: { total: 3, paid: 3 },
        receipts: { total: 3 },
        totalUploads: 9,
      },
      impact: {
        eventsSponsored: 5,
        smesSupported: 10,
        totalInvestment: "$30,000",
        visibility: "High",
      },
    },
    {
      id: 3,
      username: "innovate_sponsor",
      email: "marketing@innovategroup.com",
      companyName: "Innovate Group",
      contactPerson: "David Chen",
      created: "2024-03-10",
      lastEdited: "2024-06-15",
      status: "pending",
      profileImage: null,
      profile: {
        industry: "Consulting",
        companySize: "100-500 employees",
        website: "www.innovategroup.com",
        phone: "+27 12 555 0789",
        location: "Pretoria, South Africa",
        description: "Strategic consulting firm focused on business transformation and innovation.",
      },
      sponsorship: {
        tier: "Silver",
        amount: "$15,000",
        duration: "6 months",
        startDate: "2024-07-01",
        endDate: "2024-12-31",
        benefits: "Logo placement, Quarterly reports",
        eventsSponsored: 0,
        smesSupported: 0,
      },
      documents: {
        agreement: { signed: false, date: null },
        invoices: { total: 0, paid: 0 },
        receipts: { total: 0 },
        totalUploads: 2,
      },
      impact: {
        eventsSponsored: 0,
        smesSupported: 0,
        totalInvestment: "$0",
        visibility: "Pending",
      },
    },
  ])

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  const getSponsorDocuments = (sponsorId) => {
    return [
      {
        id: 1,
        fileName: "Sponsorship_Agreement_2024.pdf",
        type: "agreement",
        status: "signed",
        uploadDate: "2024-01-12",
        reviewDate: "2024-01-12",
        fileSize: "567 KB",
        reviewer: "Legal Team",
      },
      {
        id: 2,
        fileName: "Invoice_Q1_2024.pdf",
        type: "invoice",
        status: "paid",
        uploadDate: "2024-01-15",
        reviewDate: "2024-01-15",
        fileSize: "234 KB",
        reviewer: "Finance Team",
      },
      {
        id: 3,
        fileName: "Receipt_Q1_2024.pdf",
        type: "receipt",
        status: "approved",
        uploadDate: "2024-01-20",
        reviewDate: "2024-01-20",
        fileSize: "189 KB",
        reviewer: "Finance Team",
      },
      {
        id: 4,
        fileName: "Invoice_Q2_2024.pdf",
        type: "invoice",
        status: "paid",
        uploadDate: "2024-04-15",
        reviewDate: "2024-04-15",
        fileSize: "245 KB",
        reviewer: "Finance Team",
      },
    ]
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

  const filteredSponsors = sponsorData.filter((sponsor) => {
    const matchesSearch = 
      sponsor.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sponsor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sponsor.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sponsor.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || sponsor.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredSponsors.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentSponsors = filteredSponsors.slice(startIndex, endIndex)

  const handleAction = (action, sponsor) => {
    switch (action) {
      case "view":
        setSelectedSponsor(sponsor)
        setShowViewModal(true)
        setActiveTab("profile")
        break
      case "edit":
        setSelectedSponsor(sponsor)
        setEditFormData({
          username: sponsor.username,
          email: sponsor.email,
          companyName: sponsor.companyName,
          contactPerson: sponsor.contactPerson,
          status: sponsor.status,
          profile: { ...sponsor.profile },
          sponsorship: { ...sponsor.sponsorship }
        })
        setShowEditModal(true)
        break
      case "delete":
        if (window.confirm(`Are you sure you want to delete ${sponsor.companyName}?`)) {
          setSponsorData(sponsorData.filter(s => s.id !== sponsor.id))
        }
        break
      case "block":
        if (window.confirm(`Are you sure you want to block ${sponsor.companyName}?`)) {
          setSponsorData(sponsorData.map(s => 
            s.id === sponsor.id ? { ...s, status: "blocked" } : s
          ))
        }
        break
      default:
        break
    }
  }

  const handleEditSave = () => {
    setSponsorData(sponsorData.map(sponsor => 
      sponsor.id === selectedSponsor.id 
        ? { 
            ...sponsor, 
            ...editFormData,
            lastEdited: new Date().toISOString().split('T')[0]
          } 
        : sponsor
    ))
    setShowEditModal(false)
    setSelectedSponsor(null)
    setEditFormData({})
  }

  const handleAddSponsor = () => {
    const newSponsor = {
      id: Date.now(),
      ...addFormData,
      created: new Date().toISOString().split('T')[0],
      lastEdited: new Date().toISOString().split('T')[0],
      profileImage: null,
      documents: {
        agreement: { signed: false, date: null },
        invoices: { total: 0, paid: 0 },
        receipts: { total: 0 },
        totalUploads: 0,
      },
      impact: {
        eventsSponsored: 0,
        smesSupported: 0,
        totalInvestment: "$0",
        visibility: "Pending",
      },
    }
    
    setSponsorData([...sponsorData, newSponsor])
    setShowAddModal(false)
    setAddFormData({
      username: "",
      email: "",
      companyName: "",
      contactPerson: "",
      status: "pending",
      profile: {
        industry: "",
        companySize: "",
        website: "",
        phone: "",
        location: "",
        description: "",
      },
      sponsorship: {
        tier: "",
        amount: "",
        duration: "",
        startDate: "",
        endDate: "",
        benefits: "",
      }
    })
  }

  const getStatusBadge = (status) => {
    const statusStyles = {
      active: styles.statusActive,
      pending: styles.statusPending,
      blocked: styles.statusBlocked,
      expired: styles.statusExpired,
    }
    
    return (
      <span className={`${styles.statusBadge} ${statusStyles[status] || ""}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getTierBadge = (tier) => {
    const tierStyles = {
      platinum: styles.tierPlatinum,
      gold: styles.tierGold,
      silver: styles.tierSilver,
      bronze: styles.tierBronze,
    }
    
    return (
      <span className={`${styles.tierBadge} ${tierStyles[tier?.toLowerCase()] || ""}`}>
        {tier}
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

  const getDocumentStatusBadge = (status) => {
    const statusStyles = {
      approved: `${styles.statusBadge} ${styles.statusActive}`,
      pending: `${styles.statusBadge} ${styles.statusPending}`,
      rejected: `${styles.statusBadge} ${styles.statusBlocked}`,
      signed: `${styles.statusBadge} ${styles.statusActive}`,
      paid: `${styles.statusBadge} ${styles.statusActive}`,
    }
    
    return (
      <span className={statusStyles[status] || `${styles.statusBadge}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const TabContent = ({ tab, sponsor }) => {
    switch (tab) {
      case "profile":
        return (
          <div className={styles.tabContent}>
            <div className={styles.profileSection}>
              <h3>Company Information</h3>
              <div className={styles.profileGrid}>
                <div className={styles.profileItem}>
                  <Building2 size={16} />
                  <span>Company Name:</span>
                  <span>{sponsor.companyName}</span>
                </div>
                <div className={styles.profileItem}>
                  <User size={16} />
                  <span>Contact Person:</span>
                  <span>{sponsor.contactPerson}</span>
                </div>
                <div className={styles.profileItem}>
                  <Mail size={16} />
                  <span>Email:</span>
                  <span>{sponsor.email}</span>
                </div>
                <div className={styles.profileItem}>
                  <Phone size={16} />
                  <span>Phone:</span>
                  <span>{sponsor.profile.phone}</span>
                </div>
                <div className={styles.profileItem}>
                  <MapPin size={16} />
                  <span>Location:</span>
                  <span>{sponsor.profile.location}</span>
                </div>
                <div className={styles.profileItem}>
                  <Globe size={16} />
                  <span>Website:</span>
                  <span>{sponsor.profile.website}</span>
                </div>
                <div className={styles.profileItem}>
                  <Briefcase size={16} />
                  <span>Industry:</span>
                  <span>{sponsor.profile.industry}</span>
                </div>
                <div className={styles.profileItem}>
                  <Users size={16} />
                  <span>Company Size:</span>
                  <span>{sponsor.profile.companySize}</span>
                </div>
              </div>
              {sponsor.profile.description && (
                <>
                  <h3 style={{marginTop: '24px'}}>Description</h3>
                  <p style={{color: '#624635', lineHeight: '1.6'}}>{sponsor.profile.description}</p>
                </>
              )}
            </div>
          </div>
        )
      case "sponsorship":
        return (
          <div className={styles.tabContent}>
            <div className={styles.applicationSection}>
              <h3>Sponsorship Details</h3>
              <div className={styles.applicationCard}>
                <div className={styles.tierHeader}>
                  {getTierBadge(sponsor.sponsorship.tier)}
                  <span className={styles.amount}>{sponsor.sponsorship.amount}</span>
                </div>
                <div className={styles.applicationDetails}>
                  <p><strong>Duration:</strong> {sponsor.sponsorship.duration}</p>
                  <p><strong>Start Date:</strong> {formatDate(sponsor.sponsorship.startDate)}</p>
                  <p><strong>End Date:</strong> {formatDate(sponsor.sponsorship.endDate)}</p>
                  <p><strong>Benefits:</strong> {sponsor.sponsorship.benefits}</p>
                  <p><strong>Events Sponsored:</strong> {sponsor.sponsorship.eventsSponsored}</p>
                  <p><strong>SMEs Supported:</strong> {sponsor.sponsorship.smesSupported}</p>
                </div>
              </div>
            </div>
          </div>
        )
      case "impact":
        return (
          <div className={styles.tabContent}>
            <div className={styles.applicationSection}>
              <h3>Impact & Metrics</h3>
              <div className={styles.impactStats}>
                <div className={styles.impactCard}>
                  <div className={styles.impactIcon}>
                    <Calendar size={24} />
                  </div>
                  <div className={styles.impactValue}>{sponsor.impact.eventsSponsored}</div>
                  <div className={styles.impactLabel}>Events Sponsored</div>
                </div>
                <div className={styles.impactCard}>
                  <div className={styles.impactIcon}>
                    <Building2 size={24} />
                  </div>
                  <div className={styles.impactValue}>{sponsor.impact.smesSupported}</div>
                  <div className={styles.impactLabel}>SMEs Supported</div>
                </div>
                <div className={styles.impactCard}>
                  <div className={styles.impactIcon}>
                    <DollarSign size={24} />
                  </div>
                  <div className={styles.impactValue}>{sponsor.impact.totalInvestment}</div>
                  <div className={styles.impactLabel}>Total Investment</div>
                </div>
                <div className={styles.impactCard}>
                  <div className={styles.impactIcon}>
                    <TrendingUp size={24} />
                  </div>
                  <div className={styles.impactValue}>{sponsor.impact.visibility}</div>
                  <div className={styles.impactLabel}>Visibility Level</div>
                </div>
              </div>
            </div>
          </div>
        )
      case "documents":
        const sponsorDocuments = getSponsorDocuments(sponsor.id)
        return (
          <div className={styles.tabContent}>
            <div className={styles.documentsSection}>
              <div className={styles.sectionHeader}>
                <h3>Documents & Contracts</h3>
                <div className={styles.documentStats}>
                  <span className={styles.statBadge}>
                    Total: {sponsorDocuments.length}
                  </span>
                  <span className={styles.statBadge}>
                    Approved: {sponsorDocuments.filter(doc => doc.status === 'approved' || doc.status === 'signed' || doc.status === 'paid').length}
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
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sponsorDocuments.map((document) => (
                      <tr key={document.id}>
                        <td>
                          <div className={styles.documentCell}>
                            <File size={16} className={styles.fileIcon} />
                            <div className={styles.documentInfo}>
                              <span className={styles.fileName}>{document.fileName}</span>
                              <span className={styles.fileSize}>{document.fileSize}</span>
                            </div>
                          </div>
                        </td>
                        <td>{document.type.toUpperCase()}</td>
                        <td>{getDocumentStatusBadge(document.status)}</td>
                        <td>{formatDate(document.uploadDate)}</td>
                        <td>{formatDate(document.reviewDate)}</td>
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
        <p>Loading Program Sponsors...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>All Program Sponsors</h1>
          <p className={styles.subtitle}>Manage and monitor all program sponsor accounts</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.actionButton} onClick={() => alert("Export functionality coming soon!")}>
            <Download size={16} />
            Export
          </button>
          <button className={styles.primaryButton} onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add Sponsor
          </button>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by company name, contact person, or email..."
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
            <option value="expired">Expired</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Contact Person</th>
              <th>Email</th>
              <th>Sponsorship Tier</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentSponsors.map((sponsor) => (
              <tr key={sponsor.id}>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.userAvatar}>
                      {sponsor.profileImage ? (
                        <img src={sponsor.profileImage} alt={sponsor.companyName} />
                      ) : (
                        <span>{sponsor.companyName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span className={styles.companyName}>{sponsor.companyName}</span>
                  </div>
                </td>
                <td>{sponsor.contactPerson}</td>
                <td>{sponsor.email}</td>
                <td>{getTierBadge(sponsor.sponsorship.tier)}</td>
                <td className={styles.amount}>{sponsor.sponsorship.amount}</td>
                <td>{getStatusBadge(sponsor.status)}</td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("view", sponsor)}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("edit", sponsor)}
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("block", sponsor)}
                      title="Block"
                    >
                      <Ban size={16} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("delete", sponsor)}
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
          Showing {startIndex + 1} to {Math.min(endIndex, filteredSponsors.length)} of {filteredSponsors.length} results
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
      {showViewModal && selectedSponsor && (
        <div className={styles.modalOverlay} onClick={() => setShowViewModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <h2>{selectedSponsor.companyName}</h2>
                <p>{selectedSponsor.contactPerson}</p>
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
                <Building2 size={16} />
                Company Profile
              </button>
              <button
                className={`${styles.tab} ${activeTab === "sponsorship" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("sponsorship")}
              >
                <Award size={16} />
                Sponsorship Details
              </button>
              <button
                className={`${styles.tab} ${activeTab === "impact" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("impact")}
              >
                <Target size={16} />
                Impact & Metrics
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
              <TabContent tab={activeTab} sponsor={selectedSponsor} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedSponsor && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <h2>Edit Sponsor: {selectedSponsor.companyName}</h2>
                <p>Update sponsor information</p>
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
                      <label>Contact Person</label>
                      <input
                        type="text"
                        value={editFormData.contactPerson || ""}
                        onChange={(e) => setEditFormData({...editFormData, contactPerson: e.target.value})}
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
                        <option value="expired">Expired</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h3>Company Profile</h3>
                  <div className={styles.formGrid}>
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
                      <label>Company Size</label>
                      <select
                        value={editFormData.profile?.companySize || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, companySize: e.target.value}
                        })}
                        className={styles.formSelect}
                      >
                        <option value="">Select size</option>
                        <option value="1-50 employees">1-50 employees</option>
                        <option value="50-100 employees">50-100 employees</option>
                        <option value="100-500 employees">100-500 employees</option>
                        <option value="500-1000 employees">500-1000 employees</option>
                        <option value="1000+ employees">1000+ employees</option>
                      </select>
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
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h3>Sponsorship Details</h3>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Sponsorship Tier</label>
                      <select
                        value={editFormData.sponsorship?.tier || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          sponsorship: {...editFormData.sponsorship, tier: e.target.value}
                        })}
                        className={styles.formSelect}
                      >
                        <option value="">Select tier</option>
                        <option value="Platinum">Platinum</option>
                        <option value="Gold">Gold</option>
                        <option value="Silver">Silver</option>
                        <option value="Bronze">Bronze</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Amount</label>
                      <input
                        type="text"
                        value={editFormData.sponsorship?.amount || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          sponsorship: {...editFormData.sponsorship, amount: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="$50,000"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Duration</label>
                      <input
                        type="text"
                        value={editFormData.sponsorship?.duration || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          sponsorship: {...editFormData.sponsorship, duration: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="12 months"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Start Date</label>
                      <input
                        type="date"
                        value={editFormData.sponsorship?.startDate || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          sponsorship: {...editFormData.sponsorship, startDate: e.target.value}
                        })}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>End Date</label>
                      <input
                        type="date"
                        value={editFormData.sponsorship?.endDate || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          sponsorship: {...editFormData.sponsorship, endDate: e.target.value}
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
                <h2>Add New Sponsor</h2>
                <p>Create a new program sponsor account</p>
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
                      <label>Contact Person *</label>
                      <input
                        type="text"
                        value={addFormData.contactPerson}
                        onChange={(e) => setAddFormData({...addFormData, contactPerson: e.target.value})}
                        className={styles.formInput}
                        placeholder="Enter contact person"
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
                        <option value="expired">Expired</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h3>Company Profile (Optional)</h3>
                  <div className={styles.formGrid}>
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
                      <label>Company Size</label>
                      <select
                        value={addFormData.profile.companySize}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, companySize: e.target.value}
                        })}
                        className={styles.formSelect}
                      >
                        <option value="">Select size</option>
                        <option value="1-50 employees">1-50 employees</option>
                        <option value="50-100 employees">50-100 employees</option>
                        <option value="100-500 employees">100-500 employees</option>
                        <option value="500-1000 employees">500-1000 employees</option>
                        <option value="1000+ employees">1000+ employees</option>
                      </select>
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
                        placeholder="www.example.com"
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
                    onClick={handleAddSponsor}
                    disabled={!addFormData.username || !addFormData.email || !addFormData.companyName || !addFormData.contactPerson}
                  >
                    <Check size={16} />
                    Create Sponsor
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

export default AllSponsors