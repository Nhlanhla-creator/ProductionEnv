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
  CheckCircle,
  Clock,
  GraduationCap,
  Briefcase,
  Save,
  Check,
  File,
  Award,
  TrendingUp,
} from "lucide-react"
import styles from "./all-interns.module.css"

function AllInterns() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedIntern, setSelectedIntern] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editFormData, setEditFormData] = useState({})
  const [addFormData, setAddFormData] = useState({
    username: "",
    email: "",
    fullName: "",
    status: "pending",
    profile: {
      university: "",
      degree: "",
      fieldOfStudy: "",
      yearOfStudy: "",
      expectedGraduation: "",
      phone: "",
      location: "",
      skills: "",
    },
    internship: {
      department: "",
      supervisor: "",
      startDate: "",
      endDate: "",
      position: "",
    }
  })
  const [activeTab, setActiveTab] = useState("profile")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Mock Intern data
  const [internData, setInternData] = useState([
    {
      id: 1,
      username: "john_doe_2024",
      email: "john.doe@university.ac.za",
      fullName: "John Doe",
      created: "2024-01-15",
      lastEdited: "2024-06-20",
      status: "active",
      profileImage: null,
      profile: {
        university: "University of Cape Town",
        degree: "Bachelor of Commerce",
        fieldOfStudy: "Business Administration",
        yearOfStudy: "3rd Year",
        expectedGraduation: "2025-06",
        phone: "+27 72 123 4567",
        location: "Cape Town, South Africa",
        skills: "Excel, PowerPoint, Data Analysis, Project Management",
      },
      internship: {
        department: "Business Development",
        supervisor: "Sarah Johnson",
        startDate: "2024-01-15",
        endDate: "2024-06-30",
        position: "Business Development Intern",
        hoursCompleted: 480,
        hoursRequired: 600,
      },
      documents: {
        cv: { uploaded: true, date: "2024-01-10" },
        transcript: { uploaded: true, date: "2024-01-10" },
        applicationLetter: { uploaded: true, date: "2024-01-10" },
        idDocument: { uploaded: true, date: "2024-01-10" },
        totalUploads: 8,
      },
      performance: {
        tasksCompleted: 24,
        totalTasks: 30,
        evaluationScore: 4.2,
        attendance: 95,
        lastEvaluation: "2024-06-15",
      },
    },
    {
      id: 2,
      username: "sarah_williams",
      email: "sarah.williams@wits.ac.za",
      fullName: "Sarah Williams",
      created: "2024-02-01",
      lastEdited: "2024-06-18",
      status: "active",
      profileImage: null,
      profile: {
        university: "University of the Witwatersrand",
        degree: "Bachelor of Science",
        fieldOfStudy: "Computer Science",
        yearOfStudy: "4th Year",
        expectedGraduation: "2024-12",
        phone: "+27 71 987 6543",
        location: "Johannesburg, South Africa",
        skills: "Python, JavaScript, React, Database Management, UI/UX",
      },
      internship: {
        department: "Technology & Innovation",
        supervisor: "Michael Chen",
        startDate: "2024-02-01",
        endDate: "2024-07-31",
        position: "Software Development Intern",
        hoursCompleted: 520,
        hoursRequired: 600,
      },
      documents: {
        cv: { uploaded: true, date: "2024-01-25" },
        transcript: { uploaded: true, date: "2024-01-25" },
        applicationLetter: { uploaded: true, date: "2024-01-25" },
        idDocument: { uploaded: true, date: "2024-01-25" },
        totalUploads: 12,
      },
      performance: {
        tasksCompleted: 28,
        totalTasks: 32,
        evaluationScore: 4.7,
        attendance: 98,
        lastEvaluation: "2024-06-10",
      },
    },
    {
      id: 3,
      username: "thabo_mokoena",
      email: "thabo.mokoena@up.ac.za",
      fullName: "Thabo Mokoena",
      created: "2024-03-10",
      lastEdited: "2024-06-15",
      status: "pending",
      profileImage: null,
      profile: {
        university: "University of Pretoria",
        degree: "Bachelor of Engineering",
        fieldOfStudy: "Mechanical Engineering",
        yearOfStudy: "2nd Year",
        expectedGraduation: "2026-12",
        phone: "+27 73 456 7890",
        location: "Pretoria, South Africa",
        skills: "CAD, SolidWorks, Technical Drawing, Problem Solving",
      },
      internship: {
        department: "Engineering & Operations",
        supervisor: "David Smith",
        startDate: "2024-07-01",
        endDate: "2024-12-31",
        position: "Engineering Intern",
        hoursCompleted: 0,
        hoursRequired: 600,
      },
      documents: {
        cv: { uploaded: true, date: "2024-03-05" },
        transcript: { uploaded: false, date: null },
        applicationLetter: { uploaded: true, date: "2024-03-05" },
        idDocument: { uploaded: false, date: null },
        totalUploads: 2,
      },
      performance: {
        tasksCompleted: 0,
        totalTasks: 0,
        evaluationScore: 0,
        attendance: 0,
        lastEvaluation: null,
      },
    },
  ])

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  const getInternDocuments = (internId) => {
    return [
      {
        id: 1,
        fileName: "CV_Resume.pdf",
        type: "cv",
        status: "approved",
        uploadDate: "2024-01-10",
        reviewDate: "2024-01-12",
        fileSize: "345 KB",
        reviewer: "HR Team",
      },
      {
        id: 2,
        fileName: "Academic_Transcript.pdf",
        type: "transcript",
        status: "approved",
        uploadDate: "2024-01-10",
        reviewDate: "2024-01-12",
        fileSize: "567 KB",
        reviewer: "HR Team",
      },
      {
        id: 3,
        fileName: "Application_Letter.pdf",
        type: "application",
        status: "approved",
        uploadDate: "2024-01-10",
        reviewDate: "2024-01-12",
        fileSize: "234 KB",
        reviewer: "HR Team",
      },
      {
        id: 4,
        fileName: "ID_Document.pdf",
        type: "id",
        status: "approved",
        uploadDate: "2024-01-10",
        reviewDate: "2024-01-12",
        fileSize: "189 KB",
        reviewer: "HR Team",
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

  const filteredInterns = internData.filter((intern) => {
    const matchesSearch = 
      intern.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intern.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intern.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || intern.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredInterns.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentInterns = filteredInterns.slice(startIndex, endIndex)

  const handleAction = (action, intern) => {
    switch (action) {
      case "view":
        setSelectedIntern(intern)
        setShowViewModal(true)
        setActiveTab("profile")
        break
      case "edit":
        setSelectedIntern(intern)
        setEditFormData({
          username: intern.username,
          email: intern.email,
          fullName: intern.fullName,
          status: intern.status,
          profile: { ...intern.profile },
          internship: { ...intern.internship }
        })
        setShowEditModal(true)
        break
      case "delete":
        if (window.confirm(`Are you sure you want to delete ${intern.fullName}?`)) {
          setInternData(internData.filter(i => i.id !== intern.id))
        }
        break
      case "block":
        if (window.confirm(`Are you sure you want to block ${intern.fullName}?`)) {
          setInternData(internData.map(i => 
            i.id === intern.id ? { ...i, status: "blocked" } : i
          ))
        }
        break
      default:
        break
    }
  }

  const handleEditSave = () => {
    setInternData(internData.map(intern => 
      intern.id === selectedIntern.id 
        ? { 
            ...intern, 
            ...editFormData,
            lastEdited: new Date().toISOString().split('T')[0]
          } 
        : intern
    ))
    setShowEditModal(false)
    setSelectedIntern(null)
    setEditFormData({})
  }

  const handleAddIntern = () => {
    const newIntern = {
      id: Date.now(),
      ...addFormData,
      created: new Date().toISOString().split('T')[0],
      lastEdited: new Date().toISOString().split('T')[0],
      profileImage: null,
      documents: {
        cv: { uploaded: false, date: null },
        transcript: { uploaded: false, date: null },
        applicationLetter: { uploaded: false, date: null },
        idDocument: { uploaded: false, date: null },
        totalUploads: 0,
      },
      performance: {
        tasksCompleted: 0,
        totalTasks: 0,
        evaluationScore: 0,
        attendance: 0,
        lastEvaluation: null,
      },
    }
    
    setInternData([...internData, newIntern])
    setShowAddModal(false)
    setAddFormData({
      username: "",
      email: "",
      fullName: "",
      status: "pending",
      profile: {
        university: "",
        degree: "",
        fieldOfStudy: "",
        yearOfStudy: "",
        expectedGraduation: "",
        phone: "",
        location: "",
        skills: "",
      },
      internship: {
        department: "",
        supervisor: "",
        startDate: "",
        endDate: "",
        position: "",
      }
    })
  }

  const getStatusBadge = (status) => {
    const statusStyles = {
      active: styles.statusActive,
      pending: styles.statusPending,
      blocked: styles.statusBlocked,
      completed: styles.statusCompleted,
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

  const getDocumentStatusBadge = (status) => {
    const statusStyles = {
      approved: `${styles.statusBadge} ${styles.statusActive}`,
      pending: `${styles.statusBadge} ${styles.statusPending}`,
      rejected: `${styles.statusBadge} ${styles.statusBlocked}`,
    }
    
    return (
      <span className={statusStyles[status] || `${styles.statusBadge}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const TabContent = ({ tab, intern }) => {
    switch (tab) {
      case "profile":
        return (
          <div className={styles.tabContent}>
            <div className={styles.profileSection}>
              <h3>Personal Information</h3>
              <div className={styles.profileGrid}>
                <div className={styles.profileItem}>
                  <User size={16} />
                  <span>Full Name:</span>
                  <span>{intern.fullName}</span>
                </div>
                <div className={styles.profileItem}>
                  <Mail size={16} />
                  <span>Email:</span>
                  <span>{intern.email}</span>
                </div>
                <div className={styles.profileItem}>
                  <Phone size={16} />
                  <span>Phone:</span>
                  <span>{intern.profile.phone}</span>
                </div>
                <div className={styles.profileItem}>
                  <MapPin size={16} />
                  <span>Location:</span>
                  <span>{intern.profile.location}</span>
                </div>
              </div>

              <h3 style={{marginTop: '24px'}}>Academic Information</h3>
              <div className={styles.profileGrid}>
                <div className={styles.profileItem}>
                  <GraduationCap size={16} />
                  <span>University:</span>
                  <span>{intern.profile.university}</span>
                </div>
                <div className={styles.profileItem}>
                  <GraduationCap size={16} />
                  <span>Degree:</span>
                  <span>{intern.profile.degree}</span>
                </div>
                <div className={styles.profileItem}>
                  <FileText size={16} />
                  <span>Field of Study:</span>
                  <span>{intern.profile.fieldOfStudy}</span>
                </div>
                <div className={styles.profileItem}>
                  <Calendar size={16} />
                  <span>Year of Study:</span>
                  <span>{intern.profile.yearOfStudy}</span>
                </div>
                <div className={styles.profileItem}>
                  <Calendar size={16} />
                  <span>Expected Graduation:</span>
                  <span>{formatDate(intern.profile.expectedGraduation)}</span>
                </div>
                <div className={styles.profileItem}>
                  <Award size={16} />
                  <span>Skills:</span>
                  <span>{intern.profile.skills}</span>
                </div>
              </div>
            </div>
          </div>
        )
      case "internship":
        return (
          <div className={styles.tabContent}>
            <div className={styles.applicationSection}>
              <h3>Internship Details</h3>
              <div className={styles.applicationCard}>
                <div className={styles.applicationDetails}>
                  <p><strong>Position:</strong> {intern.internship.position}</p>
                  <p><strong>Department:</strong> {intern.internship.department}</p>
                  <p><strong>Supervisor:</strong> {intern.internship.supervisor}</p>
                  <p><strong>Start Date:</strong> {formatDate(intern.internship.startDate)}</p>
                  <p><strong>End Date:</strong> {formatDate(intern.internship.endDate)}</p>
                  <p><strong>Hours Progress:</strong> {intern.internship.hoursCompleted} / {intern.internship.hoursRequired} hours</p>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill} 
                      style={{width: `${(intern.internship.hoursCompleted / intern.internship.hoursRequired) * 100}%`}}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      case "performance":
        return (
          <div className={styles.tabContent}>
            <div className={styles.applicationSection}>
              <h3>Performance Metrics</h3>
              <div className={styles.applicationCard}>
                <div className={styles.applicationDetails}>
                  <p><strong>Tasks Completed:</strong> {intern.performance.tasksCompleted} / {intern.performance.totalTasks}</p>
                  <p><strong>Evaluation Score:</strong> {intern.performance.evaluationScore} / 5.0</p>
                  <p><strong>Attendance:</strong> {intern.performance.attendance}%</p>
                  <p><strong>Last Evaluation:</strong> {intern.performance.lastEvaluation ? formatDate(intern.performance.lastEvaluation) : "Not evaluated yet"}</p>
                </div>
                <div className={styles.performanceStats}>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{intern.performance.tasksCompleted}</div>
                    <div className={styles.statLabel}>Tasks Completed</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{intern.performance.evaluationScore}</div>
                    <div className={styles.statLabel}>Evaluation Score</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{intern.performance.attendance}%</div>
                    <div className={styles.statLabel}>Attendance</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      case "documents":
        const internDocuments = getInternDocuments(intern.id)
        return (
          <div className={styles.tabContent}>
            <div className={styles.documentsSection}>
              <div className={styles.sectionHeader}>
                <h3>Documents</h3>
                <div className={styles.documentStats}>
                  <span className={styles.statBadge}>
                    Total: {internDocuments.length}
                  </span>
                  <span className={styles.statBadge}>
                    Approved: {internDocuments.filter(doc => doc.status === 'approved').length}
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
                    {internDocuments.map((document) => (
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
        <p>Loading Interns...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>All Interns</h1>
          <p className={styles.subtitle}>Manage and monitor all intern accounts</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.actionButton} onClick={() => alert("Export functionality coming soon!")}>
            <Download size={16} />
            Export
          </button>
          <button className={styles.primaryButton} onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add Intern
          </button>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by username, email, or full name..."
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
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>University</th>
              <th>Department</th>
              <th>Start Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentInterns.map((intern) => (
              <tr key={intern.id}>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.userAvatar}>
                      {intern.profileImage ? (
                        <img src={intern.profileImage} alt={intern.fullName} />
                      ) : (
                        <span>{intern.fullName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span>{intern.fullName}</span>
                  </div>
                </td>
                <td>{intern.email}</td>
                <td>{intern.profile.university}</td>
                <td>{intern.internship.department}</td>
                <td>{formatDate(intern.internship.startDate)}</td>
                <td>{getStatusBadge(intern.status)}</td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("view", intern)}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("edit", intern)}
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("block", intern)}
                      title="Block"
                    >
                      <Ban size={16} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("delete", intern)}
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
          Showing {startIndex + 1} to {Math.min(endIndex, filteredInterns.length)} of {filteredInterns.length} results
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
      {showViewModal && selectedIntern && (
        <div className={styles.modalOverlay} onClick={() => setShowViewModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <h2>{selectedIntern.fullName}</h2>
                <p>{selectedIntern.email}</p>
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
                className={`${styles.tab} ${activeTab === "internship" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("internship")}
              >
                <Briefcase size={16} />
                Internship Details
              </button>
              <button
                className={`${styles.tab} ${activeTab === "performance" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("performance")}
              >
                <TrendingUp size={16} />
                Performance
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
              <TabContent tab={activeTab} intern={selectedIntern} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedIntern && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <h2>Edit Intern: {selectedIntern.fullName}</h2>
                <p>Update intern information</p>
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
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={editFormData.fullName || ""}
                        onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})}
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
                        <option value="completed">Completed</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h3>Academic Profile</h3>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>University</label>
                      <input
                        type="text"
                        value={editFormData.profile?.university || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, university: e.target.value}
                        })}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Degree</label>
                      <input
                        type="text"
                        value={editFormData.profile?.degree || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, degree: e.target.value}
                        })}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Field of Study</label>
                      <input
                        type="text"
                        value={editFormData.profile?.fieldOfStudy || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, fieldOfStudy: e.target.value}
                        })}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Year of Study</label>
                      <input
                        type="text"
                        value={editFormData.profile?.yearOfStudy || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, yearOfStudy: e.target.value}
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
                  <h3>Internship Details</h3>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Position</label>
                      <input
                        type="text"
                        value={editFormData.internship?.position || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          internship: {...editFormData.internship, position: e.target.value}
                        })}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Department</label>
                      <input
                        type="text"
                        value={editFormData.internship?.department || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          internship: {...editFormData.internship, department: e.target.value}
                        })}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Supervisor</label>
                      <input
                        type="text"
                        value={editFormData.internship?.supervisor || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          internship: {...editFormData.internship, supervisor: e.target.value}
                        })}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Start Date</label>
                      <input
                        type="date"
                        value={editFormData.internship?.startDate || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          internship: {...editFormData.internship, startDate: e.target.value}
                        })}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>End Date</label>
                      <input
                        type="date"
                        value={editFormData.internship?.endDate || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          internship: {...editFormData.internship, endDate: e.target.value}
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
                <h2>Add New Intern</h2>
                <p>Create a new intern account</p>
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
                      <label>Full Name *</label>
                      <input
                        type="text"
                        value={addFormData.fullName}
                        onChange={(e) => setAddFormData({...addFormData, fullName: e.target.value})}
                        className={styles.formInput}
                        placeholder="Enter full name"
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
                        <option value="completed">Completed</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h3>Academic Profile (Optional)</h3>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>University</label>
                      <input
                        type="text"
                        value={addFormData.profile.university}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, university: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="Enter university"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Degree</label>
                      <input
                        type="text"
                        value={addFormData.profile.degree}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, degree: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="Enter degree"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Field of Study</label>
                      <input
                        type="text"
                        value={addFormData.profile.fieldOfStudy}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, fieldOfStudy: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="Enter field of study"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Year of Study</label>
                      <input
                        type="text"
                        value={addFormData.profile.yearOfStudy}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, yearOfStudy: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="e.g., 3rd Year"
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
                    onClick={handleAddIntern}
                    disabled={!addFormData.username || !addFormData.email || !addFormData.fullName}
                  >
                    <Check size={16} />
                    Create Intern
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

export default AllInterns