"use client"
import { useState, useEffect } from "react"
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  getFirestore,
  getDoc,
} from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { getAuth } from "firebase/auth"
import {
  Package,
  Upload,
  Send,
  Check,
  Clock,
  FileText,
  X,
  Eye,
  Download,
  Search,
  Calendar,
  Trash2,
  Edit,
  ImageIcon,
  File,
  Archive,
  User,
  Mail,
  CreditCard,
  ClockIcon,
  FolderOpen,
  ChevronDown,
} from "lucide-react"
import emailjs from "@emailjs/browser"

const PRODUCT_CATALOG = {
  governance: {
    "Legal Boost": [
      "Employment Contract (Basic)",
      "NDA (Non-Disclosure Agreement)",
      "MOU (Memorandum of Understanding)",
    ],
    "Policy Boost": [
      "Employee Code of Conduct",
      "Leave Policy",
      "Disciplinary & Grievance Policy",
      "Health & Safety Policy",
      "Privacy & Data Protection Policy",
      "Remote Work Policy",
      "Conflict of Interest Policy",
      "Intellectual Property Protection",
      "Social Media Use Policy",
      "Expense Reimbursement Policy",
      "Overtime & Compensation Policy",
      "Termination Policy",
      "Performance Review Policy",
    ],
    "Board Boost": [
      "Advisory Readiness Pack",
      "Board Starter Toolkit",
      "Governance Policy Pack",
      "Governance Guide (FREE)",
    ],
  },
  "Capital Appeal": {
    "Financial Readiness Pack": [
      "Financial Model Template",
      "KPI Dashboard",
      "Budgeting Guide",
      "Baseline Establishment Course",
    ],
    "Business Strategy Toolkit": [
      "Business Plan Template",
      "Business Model Canvas",
      "Operational Checklist",
      "Performance Management Course",
    ],
    "Investment Readiness Pack": [
      "Pitch Deck Template",
      "Investor Narrative Guide",
      "Crafting Your Investor Narrative Course",
    ],
    "Risk Management Essentials": [
      "Risk Register Template",
      "Business Continuity Template",
      "Contingency Planning Mini-Course",
    ],
    "Full Capital Appeal Booster": ["Complete Toolkit Bundle"],
  },
}

const GrowthToolsAdmin = () => {
  const [activeTab, setActiveTab] = useState("templates")

  // Template Management State
  const [templates, setTemplates] = useState([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [uploadingTemplate, setUploadingTemplate] = useState(false)
  const [showTemplateUpload, setShowTemplateUpload] = useState(false)
  const [templateForm, setTemplateForm] = useState({
    category: "governance",
    subcategory: "",
    itemName: "",
    file: null,
  })

  // Custom Tool Deliveries State (existing)
  const [purchases, setPurchases] = useState([])
  const [filteredPurchases, setFilteredPurchases] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPurchase, setSelectedPurchase] = useState(null)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [files, setFiles] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [viewDetailsModal, setViewDetailsModal] = useState(null)

  const db = getFirestore()
  const storage = getStorage()
  const auth = getAuth()

  const EMAILJS_SERVICE_ID = "service_yre12al"
  const EMAILJS_DELIVERY_TEMPLATE_ID = "template_xwhqiy1"
  const EMAILJS_PUBLIC_KEY = "BgSAQ2Dr5jEBCDtxW"

  const colors = {
    darkBrown: "#372C27",
    mediumBrown: "#5D4037",
    accentGold: "#A67C52",
    offWhite: "#F5F2F0",
    cream: "#EFEBE9",
    lightTan: "#D7CCC8",
  }

  const getAvailableSubcategories = () => {
    if (!templateForm.category) return []
    return Object.keys(PRODUCT_CATALOG[templateForm.category] || {})
  }

  const getAvailableItems = () => {
    if (!templateForm.category || !templateForm.subcategory) return []
    return PRODUCT_CATALOG[templateForm.category]?.[templateForm.subcategory] || []
  }

  useEffect(() => {
    if (activeTab === "templates") {
      loadTemplates()
    } else {
      loadPurchases()
    }
  }, [activeTab])

  useEffect(() => {
    filterAndSortPurchases()
  }, [purchases, searchTerm, statusFilter, dateFilter, sortBy])

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true)
      const templatesRef = collection(db, "adminTemplates")
      const querySnapshot = await getDocs(templatesRef)

      const templatesData = []
      querySnapshot.forEach((doc) => {
        templatesData.push({
          id: doc.id,
          ...doc.data(),
          uploadedAt: doc.data().uploadedAt?.toDate(),
        })
      })

      setTemplates(templatesData)
    } catch (error) {
      console.error("Error loading templates:", error)
      alert("Error loading templates: " + error.message)
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleTemplateUpload = async () => {
    if (!templateForm.file || !templateForm.itemName || !templateForm.subcategory) {
      alert("Please fill in all fields and select a file")
      return
    }

    setUploadingTemplate(true)

    try {
      // Upload file to storage
      const fileName = `${Date.now()}_${templateForm.file.name}`
      const storageRef = ref(storage, `templates/${templateForm.category}/${templateForm.subcategory}/${fileName}`)
      await uploadBytes(storageRef, templateForm.file)
      const downloadURL = await getDownloadURL(storageRef)

      // Save template metadata to Firestore
      const templateData = {
        category: templateForm.category,
        subcategory: templateForm.subcategory,
        itemName: templateForm.itemName,
        fileName: templateForm.file.name,
        fileURL: downloadURL,
        fileSize: (templateForm.file.size / 1024 / 1024).toFixed(2) + " MB",
        fileType: templateForm.file.type,
        uploadedAt: serverTimestamp(),
        uploadedBy: auth.currentUser?.email || "admin",
      }

      await setDoc(
        doc(db, "adminTemplates", `${templateForm.category}_${templateForm.subcategory}_${templateForm.itemName}`),
        templateData,
      )

      alert("✅ Template uploaded successfully!")
      setShowTemplateUpload(false)
      setTemplateForm({ category: "governance", subcategory: "", itemName: "", file: null })
      loadTemplates()
    } catch (error) {
      console.error("Error uploading template:", error)
      alert("❌ Failed to upload template: " + error.message)
    } finally {
      setUploadingTemplate(false)
    }
  }

  const handleDeleteTemplate = async (template) => {
    if (!window.confirm(`Are you sure you want to delete "${template.itemName}"?`)) {
      return
    }

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, "adminTemplates", template.id))

      // Delete from Storage
      const storageRef = ref(storage, `templates/${template.category}/${template.subcategory}/${template.fileName}`)
      await deleteObject(storageRef)

      alert("✅ Template deleted successfully!")
      loadTemplates()
    } catch (error) {
      console.error("Error deleting template:", error)
      alert("❌ Failed to delete template: " + error.message)
    }
  }

  const loadPurchases = async () => {
    try {
      const purchasesRef = collection(db, "growthToolsPurchases")
      const q = query(purchasesRef, where("status", "==", "Success"))
      const querySnapshot = await getDocs(q)

      const purchasesData = []
      for (const purchaseDoc of querySnapshot.docs) {
        const data = purchaseDoc.data()
        let userName = data.userName || "Valued Customer"

        // Try to fetch actual user name from MyuniversalProfiles
        if (data.userId) {
          try {
            const userDocRef = doc(db, "MyuniversalProfiles", data.userId)
            const userDoc = await getDoc(userDocRef)
            if (userDoc.exists()) {
              const userData = userDoc.data()
              userName = userData.name || userData.username || data.userName || "Valued Customer"
            }
          } catch (error) {
            console.log("Could not fetch user profile:", error)
          }
        }

        purchasesData.push({
          id: purchaseDoc.id,
          ...data,
          userName, // Use fetched name
          createdAt: data.createdAt?.toDate(),
          deliveredAt: data.deliveredAt?.toDate(),
        })
      }

      setPurchases(purchasesData)
    } catch (error) {
      console.error("Error loading purchases:", error)
      alert("Error loading purchases: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortPurchases = () => {
    let filtered = [...purchases]

    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.deliveryStatus === statusFilter)
    }

    if (dateFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          filtered = filtered.filter((p) => p.createdAt >= filterDate)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          filtered = filtered.filter((p) => p.createdAt >= filterDate)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          filtered = filtered.filter((p) => p.createdAt >= filterDate)
          break
      }
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.userName?.toLowerCase().includes(term) ||
          p.userEmail?.toLowerCase().includes(term) ||
          p.packageName?.toLowerCase().includes(term) ||
          p.transactionRef?.toLowerCase().includes(term),
      )
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return b.createdAt - a.createdAt
        case "oldest":
          return a.createdAt - b.createdAt
        case "amount-high":
          return (b.totalAmount || 0) - (a.totalAmount || 0)
        case "amount-low":
          return (a.totalAmount || 0) - (b.totalAmount || 0)
        case "name":
          return (a.userName || "").localeCompare(b.userName || "")
        default:
          return 0
      }
    })

    setFilteredPurchases(filtered)
  }

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    const newFiles = selectedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    }))
    setFiles([...files, ...newFiles])
  }

  const removeFile = (fileId) => {
    setFiles(files.filter((f) => f.id !== fileId))
  }

  const editFileName = (fileId, newName) => {
    setFiles(files.map((f) => (f.id === fileId ? { ...f, name: newName } : f)))
  }

  const getFileIcon = (fileType) => {
    if (fileType.startsWith("image/")) return <ImageIcon size={18} color={colors.accentGold} />
    if (fileType === "application/pdf") return <FileText size={18} color="#DC2626" />
    if (fileType.includes("zip") || fileType.includes("rar") || fileType.includes("7z"))
      return <Archive size={18} color={colors.mediumBrown} />
    return <File size={18} color={colors.mediumBrown} />
  }

  const handleUploadAndDeliver = async () => {
    if (!selectedPurchase || files.length === 0) {
      alert("Please select files to upload")
      return
    }

    setUploadingFiles(true)

    try {
      const uploadedFiles = []

      for (const fileData of files) {
        const storageRef = ref(storage, `deliverables/${selectedPurchase.id}/${fileData.name}`)
        await uploadBytes(storageRef, fileData.file)
        const downloadURL = await getDownloadURL(storageRef)

        uploadedFiles.push({
          name: fileData.name,
          url: downloadURL,
          size: (fileData.size / 1024 / 1024).toFixed(2) + " MB",
          type: fileData.type,
          uploadedAt: new Date().toISOString(),
        })
      }

      const purchaseRef = doc(db, "growthToolsPurchases", selectedPurchase.id)
      await updateDoc(purchaseRef, {
        deliverables: uploadedFiles,
        deliveryStatus: "delivered",
        deliveredAt: serverTimestamp(),
        processedBy: auth.currentUser?.email || "admin",
      })

      await sendDeliveryEmail(selectedPurchase, uploadedFiles)

      alert("✅ Files uploaded and delivered successfully!")
      setSelectedPurchase(null)
      setFiles([])
      loadPurchases()
    } catch (error) {
      console.error("Error uploading files:", error)
      alert("❌ Failed to upload files: " + error.message)
    } finally {
      setUploadingFiles(false)
    }
  }

  const handleResendFiles = async (purchase) => {
    if (!purchase.deliverables || purchase.deliverables.length === 0) {
      alert("No files to resend")
      return
    }

    try {
      await sendDeliveryEmail(purchase, purchase.deliverables)
      alert("✅ Files resent successfully!")
    } catch (error) {
      alert("❌ Failed to resend files: " + error.message)
    }
  }

  const handleDeletePurchase = async (purchaseId) => {
    if (!window.confirm("Are you sure you want to delete this purchase? This action cannot be undone.")) {
      return
    }

    try {
      await deleteDoc(doc(db, "growthToolsPurchases", purchaseId))
      alert("✅ Purchase deleted successfully!")
      loadPurchases()
    } catch (error) {
      alert("❌ Failed to delete purchase: " + error.message)
    }
  }

  const sendDeliveryEmail = async (purchase, uploadedFiles) => {
    try {
      const filesListHTML = uploadedFiles
        .map((file, index) => `${index + 1}. <a href="${file.url}">${file.name}</a> (${file.size})`)
        .join("<br>")

      const templateParams = {
        to_email: purchase.userEmail,
        to_name: purchase.userName || "Valued Customer",
        package_name: purchase.packageName,
        transaction_id: purchase.transactionRef,
        files_count: uploadedFiles.length,
        files_list: filesListHTML,
        delivery_date: new Date().toLocaleDateString("en-ZA", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      }

      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_DELIVERY_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY,
      )

      console.log("✅ Delivery email sent:", response)
      return { success: true }
    } catch (error) {
      console.error("❌ Delivery email failed:", error)
      return { success: false, error }
    }
  }

  const statsData = {
    processing: purchases.filter((p) => p.deliveryStatus === "processing").length,
    delivered: purchases.filter((p) => p.deliveryStatus === "delivered").length,
    total: purchases.length,
    pendingValue: purchases
      .filter((p) => p.deliveryStatus === "processing")
      .reduce((sum, p) => sum + (p.totalAmount || 0), 0),
  }

  const groupedTemplates = templates.reduce((acc, template) => {
    const key = `${template.category}_${template.subcategory}`
    if (!acc[key]) {
      acc[key] = {
        category: template.category,
        subcategory: template.subcategory,
        templates: [],
      }
    }
    acc[key].templates.push(template)
    return acc
  }, {})

  if (isLoading && activeTab === "deliveries") {
    return (
      <div className="growth-tools-loading">
        <div className="spinner"></div>
        <p>Loading purchases...</p>
        <style jsx>{`
          .growth-tools-loading {
            padding: 2rem;
            width: 100%;
            min-height: 100vh;
            background: ${colors.offWhite};
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            gap: 1.5rem;
          }
          .spinner {
            width: 80px;
            height: 80px;
            border: 4px solid ${colors.lightTan};
            border-top: 4px solid ${colors.accentGold};
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          .growth-tools-loading p {
            color: ${colors.mediumBrown};
            font-size: 1.25rem;
            font-weight: 600;
            margin: 0;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <>
      <div className="growth-tools-container">
        {/* Header */}
        <div className="header">
          <div className="header-content">
            <div className="header-text">
              <h1>Growth Tools Admin</h1>
              <p>Manage templates and deliver growth tool purchases</p>
            </div>
          </div>

          <div className="tab-navigation">
            <button
              className={`tab-btn ${activeTab === "templates" ? "active" : ""}`}
              onClick={() => setActiveTab("templates")}
            >
              <FolderOpen size={20} />
              <span className="tab-label">
                <span className="tab-title">Template Management</span>
                <span className="tab-subtitle">Auto-delivery templates</span>
              </span>
              <span className="tab-badge">{templates.length}</span>
            </button>
            <button
              className={`tab-btn ${activeTab === "deliveries" ? "active" : ""}`}
              onClick={() => setActiveTab("deliveries")}
            >
              <Package size={20} />
              <span className="tab-label">
                <span className="tab-title">Custom Tool Deliveries</span>
                <span className="tab-subtitle">Manual processing required</span>
              </span>
              <span className="tab-badge">{statsData.processing}</span>
            </button>
          </div>
        </div>

        {/* Template Management Tab */}
        {activeTab === "templates" && (
          <>
            <div className="section-header">
              <div>
                <h2>Template Library</h2>
                <p>
                  Upload and manage templates for Governance and Fundability tools. These are auto-delivered when users
                  purchase.
                </p>
              </div>
              <button className="btn-upload" onClick={() => setShowTemplateUpload(true)}>
                <Upload size={18} />
                Upload New Template
              </button>
            </div>

            {loadingTemplates ? (
              <div className="loading-state">
                <div className="spinner-small"></div>
                <p>Loading templates...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="empty-state">
                <FolderOpen size={64} />
                <h3>No templates uploaded yet</h3>
                <p>Upload your first template to start auto-delivering to customers.</p>
                <button className="btn-upload" onClick={() => setShowTemplateUpload(true)}>
                  <Upload size={16} />
                  Upload Template
                </button>
              </div>
            ) : (
              <div className="templates-container">
                {Object.values(groupedTemplates).map((group) => (
                  <div key={`${group.category}_${group.subcategory}`} className="template-group">
                    <div className="group-header">
                      <h3>
                        {group.category.charAt(0).toUpperCase() + group.category.slice(1)} - {group.subcategory}
                      </h3>
                      <span className="count-badge">{group.templates.length} templates</span>
                    </div>
                    <div className="templates-grid">
                      {group.templates.map((template) => (
                        <div key={template.id} className="template-card">
                          <div className="template-icon">{getFileIcon(template.fileType)}</div>
                          <div className="template-info">
                            <div className="template-name">{template.itemName}</div>
                            <div className="template-meta">
                              <span>{template.fileSize}</span>
                              <span>•</span>
                              <span>{template.uploadedAt?.toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="template-actions">
                            <button
                              className="btn-view-template"
                              onClick={() => window.open(template.fileURL, "_blank")}
                              title="View template"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              className="btn-download-template"
                              onClick={() => window.open(template.fileURL, "_blank")}
                              title="Download template"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              className="btn-delete-template"
                              onClick={() => handleDeleteTemplate(template)}
                              title="Delete template"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "deliveries" && (
          <>
            {/* Stats Cards */}
            <div className="stats-container">
              <div className="stat-card">
                <div className="stat-icon" style={{ background: `${colors.accentGold}20` }}>
                  <ClockIcon size={24} color={colors.accentGold} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{statsData.processing}</div>
                  <div className="stat-label">Processing</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: "#10B98120" }}>
                  <Check size={24} color="#10B981" />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{statsData.delivered}</div>
                  <div className="stat-label">Delivered</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: `${colors.mediumBrown}20` }}>
                  <Package size={24} color={colors.mediumBrown} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{statsData.total}</div>
                  <div className="stat-label">Total Orders</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: `${colors.darkBrown}20` }}>
                  <CreditCard size={24} color={colors.darkBrown} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">R{statsData.pendingValue.toLocaleString()}</div>
                  <div className="stat-label">Pending Value</div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="filters-container">
              <div className="filter-search">
                <Search size={18} color={colors.mediumBrown} />
                <input
                  type="text"
                  placeholder="Search by name, email, package..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-selects">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="processing">Processing</option>
                  <option value="delivered">Delivered</option>
                </select>
                <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="filter-select">
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="amount-high">Highest Amount</option>
                  <option value="amount-low">Lowest Amount</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>
            </div>

            {/* Orders Grid */}
            {filteredPurchases.length === 0 ? (
              <div className="empty-state">
                <Package size={64} />
                <h3>No orders found</h3>
                <p>Orders will appear here when users purchase legitimacy tools requiring manual delivery.</p>
              </div>
            ) : (
              <div className="orders-grid">
                {filteredPurchases.map((purchase) => (
                  <div key={purchase.id} className="order-card">
                    <div className="order-header">
                      <div className="order-customer">
                        <div className="customer-avatar">
                          <User size={18} color={colors.offWhite} />
                        </div>
                        <div className="customer-info">
                          <div className="customer-name">{purchase.userName}</div>
                          <div className="customer-email-row">
                            <div className="customer-email">{purchase.userEmail}</div>
                            <div className={`order-status ${purchase.deliveryStatus}`}>
                              {purchase.deliveryStatus === "processing" ? (
                                <>
                                  <Clock size={14} />
                                  Processing
                                </>
                              ) : (
                                <>
                                  <Check size={14} />
                                  Delivered
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="order-content">
                      <div className="order-package">
                        <Package size={16} color={colors.mediumBrown} />
                        <span>{purchase.packageName}</span>
                      </div>
                      {purchase.items && purchase.items.length > 0 && (
                        <div className="order-items">
                          <div className="items-label">{purchase.items.length} item(s):</div>
                          <ul className="items-list">
                            {purchase.items.slice(0, 2).map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                            {purchase.items.length > 2 && <li>+{purchase.items.length - 2} more</li>}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="order-meta">
                      <div className="meta-item">
                        <Calendar size={14} color={colors.mediumBrown} />
                        <span>{purchase.createdAt?.toLocaleDateString()}</span>
                      </div>
                      <div className="meta-item">
                        <CreditCard size={14} color={colors.mediumBrown} />
                        <span>R{(purchase.totalAmount || 0).toLocaleString()}</span>
                      </div>
                      <div className="meta-item transaction-ref">
                        <span title={purchase.transactionRef}>{purchase.transactionRef?.slice(0, 20)}...</span>
                      </div>
                    </div>

                    <div className="order-actions">
                      <button className="btn-details" onClick={() => setViewDetailsModal(purchase)}>
                        <Eye size={16} />
                        Details
                      </button>
                      {purchase.deliveryStatus === "processing" ? (
                        <button className="btn-deliver" onClick={() => setSelectedPurchase(purchase)}>
                          <Upload size={16} />
                          Deliver
                        </button>
                      ) : (
                        <>
                          <button className="btn-edit" onClick={() => setSelectedPurchase(purchase)}>
                            <Edit size={16} />
                            Edit
                          </button>
                          <button className="btn-resend" onClick={() => handleResendFiles(purchase)}>
                            <Send size={16} />
                            Resend
                          </button>
                        </>
                      )}
                      <button className="btn-delete-order" onClick={() => handleDeletePurchase(purchase.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showTemplateUpload && (
        <div className="modal-overlay" onClick={() => setShowTemplateUpload(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload New Template</h2>
              <button className="modal-close" onClick={() => setShowTemplateUpload(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-section">
                <label className="form-label">
                  Category
                  <span className="required">*</span>
                </label>
                <div className="select-wrapper">
                  <select
                    className="form-select"
                    value={templateForm.category}
                    onChange={(e) =>
                      setTemplateForm({
                        category: e.target.value,
                        subcategory: "",
                        itemName: "",
                        file: templateForm.file,
                      })
                    }
                  >
                    <option value="governance">Governance</option>
                    <option value="Capital Appeal">Capital Appeal</option>
                  </select>
                  <ChevronDown size={18} className="select-icon" />
                </div>
              </div>

              <div className="form-section">
                <label className="form-label">
                  Subcategory
                  <span className="required">*</span>
                </label>
                <div className="select-wrapper">
                  <select
                    className="form-select"
                    value={templateForm.subcategory}
                    onChange={(e) => setTemplateForm({ ...templateForm, subcategory: e.target.value, itemName: "" })}
                    disabled={!templateForm.category}
                  >
                    <option value="">Select subcategory</option>
                    {getAvailableSubcategories().map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="select-icon" />
                </div>
              </div>

              <div className="form-section">
                <label className="form-label">
                  Item Name
                  <span className="required">*</span>
                </label>
                <div className="select-wrapper">
                  <select
                    className="form-select"
                    value={templateForm.itemName}
                    onChange={(e) => setTemplateForm({ ...templateForm, itemName: e.target.value })}
                    disabled={!templateForm.subcategory}
                  >
                    <option value="">Select item name</option>
                    {getAvailableItems().map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="select-icon" />
                </div>
                <p className="form-help">Select the exact product name from your catalog</p>
              </div>

              <div className="form-section">
                <label className="form-label">
                  Template File
                  <span className="required">*</span>
                </label>
                <div className="file-upload-area">
                  <input
                    type="file"
                    id="template-file"
                    onChange={(e) => setTemplateForm({ ...templateForm, file: e.target.files[0] })}
                    accept=".pdf,.docx,.xlsx,.zip,.doc,.xls"
                    style={{ display: "none" }}
                  />
                  <label htmlFor="template-file" className="file-upload-label">
                    <Upload size={32} color={colors.accentGold} />
                    <div className="upload-text">
                      <span className="upload-title">Click to select template file</span>
                      <span className="upload-subtitle">PDF, DOCX, XLSX, ZIP, etc.</span>
                    </div>
                  </label>
                  {templateForm.file && (
                    <div className="selected-file">
                      <FileText size={18} color={colors.accentGold} />
                      <span>{templateForm.file.name}</span>
                      <span className="file-size">{(templateForm.file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowTemplateUpload(false)}>
                Cancel
              </button>
              <button
                className="btn-submit"
                onClick={handleTemplateUpload}
                disabled={uploadingTemplate || !templateForm.file || !templateForm.itemName}
              >
                {uploadingTemplate ? (
                  <>
                    <div className="btn-spinner"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Upload Template
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPurchase && (
        <div className="modal-overlay" onClick={() => setSelectedPurchase(null)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Upload Deliverables</h2>
                <p className="modal-subtitle">{selectedPurchase.packageName}</p>
              </div>
              <button className="modal-close" onClick={() => setSelectedPurchase(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="delivery-customer-info">
                <div className="info-row">
                  <User size={18} color={colors.mediumBrown} />
                  <span>{selectedPurchase.userName || "Valued Customer"}</span>
                </div>
                <div className="info-row">
                  <Mail size={18} color={colors.mediumBrown} />
                  <span>{selectedPurchase.userEmail}</span>
                </div>
                <div className="info-row">
                  <Package size={18} color={colors.mediumBrown} />
                  <span>{selectedPurchase.packageName}</span>
                </div>
              </div>

              {selectedPurchase.items && selectedPurchase.items.length > 0 && (
                <div className="delivery-items-section">
                  <h4>Ordered Items:</h4>
                  <ul className="delivery-items-list">
                    {selectedPurchase.items.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="form-section">
                <label className="form-label">Upload Files</label>
                <div className="file-upload-area">
                  <input
                    type="file"
                    id="delivery-files"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />
                  <label htmlFor="delivery-files" className="file-upload-label">
                    <Upload size={32} color={colors.accentGold} />
                    <div className="upload-text">
                      <span className="upload-title">Click to select files</span>
                      <span className="upload-subtitle">Select one or multiple files to deliver</span>
                    </div>
                  </label>
                </div>
              </div>

              {files.length > 0 && (
                <div className="files-list-section">
                  <h4>Selected Files ({files.length}):</h4>
                  <div className="files-list">
                    {files.map((fileData) => (
                      <div key={fileData.id} className="file-item">
                        <div className="file-preview">{getFileIcon(fileData.type)}</div>
                        <div className="file-info">
                          <input
                            type="text"
                            value={fileData.name}
                            onChange={(e) => editFileName(fileData.id, e.target.value)}
                            className="file-name-input"
                          />
                          <span className="file-size">{(fileData.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <button className="btn-remove-file" onClick={() => removeFile(fileData.id)}>
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setSelectedPurchase(null)}>
                Cancel
              </button>
              <button
                className="btn-submit"
                onClick={handleUploadAndDeliver}
                disabled={uploadingFiles || files.length === 0}
              >
                {uploadingFiles ? (
                  <>
                    <div className="btn-spinner"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Upload & Deliver
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewDetailsModal && (
        <div className="modal-overlay" onClick={() => setViewDetailsModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details</h2>
              <button className="modal-close" onClick={() => setViewDetailsModal(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="details-section">
                <h4>Customer Information</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{viewDetailsModal.userName || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{viewDetailsModal.userEmail}</span>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h4>Order Information</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Package:</span>
                    <span className="detail-value">{viewDetailsModal.packageName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Amount:</span>
                    <span className="detail-value">R{(viewDetailsModal.totalAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Transaction ID:</span>
                    <span className="detail-value">{viewDetailsModal.transactionRef}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Order Date:</span>
                    <span className="detail-value">{viewDetailsModal.createdAt?.toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className={`status-badge ${viewDetailsModal.deliveryStatus}`}>
                      {viewDetailsModal.deliveryStatus}
                    </span>
                  </div>
                  {viewDetailsModal.deliveredAt && (
                    <div className="detail-item">
                      <span className="detail-label">Delivered:</span>
                      <span className="detail-value">{viewDetailsModal.deliveredAt?.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {viewDetailsModal.items && viewDetailsModal.items.length > 0 && (
                <div className="details-section">
                  <h4>Items ({viewDetailsModal.items.length})</h4>
                  <ul className="details-items-list">
                    {viewDetailsModal.items.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {viewDetailsModal.specifications && (
                <div className="details-section">
                  <h4>Customer Specifications</h4>
                  <div className="specifications-box">{viewDetailsModal.specifications}</div>
                </div>
              )}

              {viewDetailsModal.deliverables && viewDetailsModal.deliverables.length > 0 && (
                <div className="details-section">
                  <h4>Delivered Files ({viewDetailsModal.deliverables.length})</h4>
                  <div className="deliverables-list">
                    {viewDetailsModal.deliverables.map((file, idx) => (
                      <a
                        key={idx}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="deliverable-item"
                      >
                        <FileText size={18} color={colors.accentGold} />
                        <span>{file.name}</span>
                        <span className="file-size">{file.size}</span>
                        <Download size={16} color={colors.mediumBrown} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setViewDetailsModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .growth-tools-container {
          min-height: 100vh;
          padding: 2rem;
          padding-top: 5rem;
        }

        .header {
          margin-bottom: 3rem;
        }

        .header-content {
          margin-bottom: 2rem;
        }

        .header-text h1 {
          font-size: clamp(2rem, 4vw, 2.5rem);
          font-weight: 800;
          color: ${colors.darkBrown};
          margin: 0 0 0.5rem 0;
        }

        .header-text p {
          font-size: 1.1rem;
          color: ${colors.mediumBrown};
          margin: 0;
        }

        /* Improved tab navigation */
        .tab-navigation {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .tab-btn {
          flex: 1;
          min-width: 280px;
          padding: 1.5rem 2rem;
          background: white;
          border: 2px solid ${colors.lightTan};
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 1rem;
          position: relative;
        }

        .tab-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px ${colors.lightTan}80;
          border-color: ${colors.accentGold};
        }

        .tab-btn.active {
          background: linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%);
          border-color: ${colors.mediumBrown};
          color: white;
          box-shadow: 0 8px 24px ${colors.accentGold}60;
        }

        .tab-label {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.25rem;
        }

        .tab-title {
          font-size: 1rem;
          font-weight: 700;
        }

        .tab-subtitle {
          font-size: 0.85rem;
          opacity: 0.85;
        }

        .tab-badge {
          background: ${colors.offWhite};
          color: ${colors.darkBrown};
          padding: 0.35rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 700;
        }

        .tab-btn.active .tab-badge {
          background: white;
          color: ${colors.darkBrown};
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .section-header h2 {
          font-size: 1.75rem;
          font-weight: 700;
          color: ${colors.darkBrown};
          margin: 0 0 0.5rem 0;
        }

        .section-header p {
          color: ${colors.mediumBrown};
          margin: 0;
          max-width: 600px;
        }

        .btn-upload {
          background: linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px ${colors.accentGold}40;
        }

        .btn-upload:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px ${colors.accentGold}60;
        }

        .loading-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 16px;
          border: 2px dashed ${colors.lightTan};
          color: ${colors.mediumBrown};
          text-align: center;
        }

        .empty-state h3 {
          font-size: 1.5rem;
          margin: 1rem 0 0.5rem 0;
          color: ${colors.darkBrown};
        }

        .empty-state p {
          margin: 0 0 1.5rem 0;
          max-width: 400px;
        }

        .spinner-small {
          width: 40px;
          height: 40px;
          border: 3px solid ${colors.lightTan};
          border-top: 3px solid ${colors.accentGold};
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .templates-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .template-group {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 2px 12px ${colors.lightTan}60;
        }

        .group-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid ${colors.lightTan};
        }

        .group-header h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: ${colors.darkBrown};
          margin: 0;
        }

        .count-badge {
          background: ${colors.cream};
          color: ${colors.mediumBrown};
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .templates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1rem;
        }

        .template-card {
          background: ${colors.offWhite};
          border: 1px solid ${colors.lightTan};
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.3s ease;
        }

        .template-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px ${colors.lightTan}80;
        }

        .template-icon {
          width: 48px;
          height: 48px;
          background: white;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .template-info {
          flex: 1;
          min-width: 0;
        }

        .template-name {
          font-size: 0.95rem;
          font-weight: 600;
          color: ${colors.darkBrown};
          margin-bottom: 0.25rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .template-meta {
          font-size: 0.8rem;
          color: ${colors.mediumBrown};
          display: flex;
          gap: 0.5rem;
        }

        .template-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-view-template,
        .btn-download-template,
        .btn-delete-template {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .btn-view-template {
          background: ${colors.cream};
          color: ${colors.mediumBrown};
        }

        .btn-view-template:hover {
          background: ${colors.lightTan};
        }

        .btn-download-template {
          background: ${colors.accentGold}20;
          color: ${colors.accentGold};
        }

        .btn-download-template:hover {
          background: ${colors.accentGold};
          color: white;
        }

        .btn-delete-template {
          background: #FEE2E2;
          color: #DC2626;
        }

        .btn-delete-template:hover {
          background: #DC2626;
          color: white;
        }

        /* Redesigned stats and filters */
        .stats-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 1.75rem;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          box-shadow: 0 2px 12px ${colors.lightTan}60;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px ${colors.lightTan}80;
        }

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 800;
          color: ${colors.darkBrown};
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.9rem;
          color: ${colors.mediumBrown};
          font-weight: 500;
        }

        .filters-container {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          box-shadow: 0 2px 12px ${colors.lightTan}60;
        }

        .filter-search {
          flex: 1;
          min-width: 280px;
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0 1rem;
          background: ${colors.offWhite};
          border-radius: 12px;
          border: 2px solid ${colors.lightTan};
        }

        .filter-search input {
          flex: 1;
          border: none;
          background: transparent;
          padding: 1rem 0;
          font-size: 0.95rem;
          color: ${colors.darkBrown};
        }

        .filter-search input:focus {
          outline: none;
        }

        .filter-search input::placeholder {
          color: ${colors.mediumBrown};
          opacity: 0.6;
        }

        .filter-selects {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .filter-select {
          padding: 1rem 1.25rem;
          border: 2px solid ${colors.lightTan};
          border-radius: 12px;
          background: ${colors.offWhite};
          color: ${colors.darkBrown};
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          min-width: 160px;
        }

        .filter-select:focus {
          outline: none;
          border-color: ${colors.accentGold};
        }

        /* Redesigned orders grid */
        .orders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 1.5rem;
        }

        .order-card {
          background: white;
          border-radius: 16px;
          padding: 1.75rem;
          box-shadow: 0 2px 12px ${colors.lightTan}60;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .order-card:hover {
          box-shadow: 0 8px 28px ${colors.lightTan}80;
          border-color: ${colors.accentGold}40;
        }

        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          /* Ensure header stays within card bounds */
          width: 100%;
        }

        .order-customer {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
          min-width: 0; /* Allow flex item to shrink */
        }

        .customer-avatar {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .customer-info {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .customer-name {
          font-size: 1rem;
          font-weight: 700;
          color: ${colors.darkBrown};
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        }

        /* New row for email and status badge */
        .customer-email-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          justify-content: space-between;
        }

        .customer-email {
          font-size: 0.85rem;
          color: ${colors.mediumBrown};
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
          min-width: 0;
        }

        .order-status {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.8rem;
          border-radius: 16px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
          flex-shrink: 0;
          /* Ensure status stays within card */
          align-self: flex-start;
        }

        .order-status.processing {
          background: ${colors.accentGold}20;
          color: ${colors.accentGold};
        }

        .order-status.delivered {
          background: #10B98120;
          color: #10B981;
        }

        .order-content {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .order-package {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: ${colors.cream};
          border-radius: 10px;
          font-weight: 600;
          color: ${colors.darkBrown};
          overflow: hidden;
        }

        .order-package span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .order-items {
          padding: 1rem;
          background: ${colors.offWhite};
          border-radius: 10px;
          border: 1px solid ${colors.lightTan};
        }

        .items-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: ${colors.mediumBrown};
          margin-bottom: 0.5rem;
        }

        .items-list {
          margin: 0;
          padding-left: 1.25rem;
        }

        .items-list li {
          font-size: 0.9rem;
          color: ${colors.darkBrown};
          margin-bottom: 0.25rem;
          word-break: break-word;
        }

        .order-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          padding-top: 0.75rem;
          border-top: 1px solid ${colors.lightTan};
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: ${colors.mediumBrown};
          flex: 0 1 auto;
        }

        .transaction-ref {
          flex: 1 1 100%;
          min-width: 0;
          font-family: monospace;
          font-size: 0.75rem;
          opacity: 0.7;
          overflow: hidden;
        }

        .transaction-ref span {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .order-actions {
          display: flex;
          gap: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid ${colors.lightTan};
        }

        .btn-details,
        .btn-deliver,
        .btn-edit,
        .btn-resend,
        .btn-delete-order {
          flex: 1;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          border: none;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
        }

        .btn-details {
          background: ${colors.cream};
          color: ${colors.darkBrown};
        }

        .btn-details:hover {
          background: ${colors.lightTan};
        }

        .btn-deliver {
          background: linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%);
          color: white;
        }

        .btn-deliver:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px ${colors.accentGold}40;
        }

        .btn-edit {
          background: ${colors.accentGold}20;
          color: ${colors.accentGold};
        }

        .btn-edit:hover {
          background: ${colors.accentGold};
          color: white;
        }

        .btn-resend {
          background: ${colors.mediumBrown}20;
          color: ${colors.mediumBrown};
        }

        .btn-resend:hover {
          background: ${colors.mediumBrown};
          color: white;
        }

        .btn-delete-order {
          flex: 0;
          padding: 0.75rem;
          background: #FEE2E2;
          color: #DC2626;
        }

        .btn-delete-order:hover {
          background: #DC2626;
          color: white;
        }

        /* Professional Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: ${colors.darkBrown}CC;
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .modal-content {
          background: white;
          border-radius: 24px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 24px 60px ${colors.darkBrown}40;
          animation: slideUp 0.3s ease;
        }

        .modal-content.large {
          max-width: 800px;
        }

        @keyframes slideUp {
          from {
            transform: translateY(40px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-header {
          padding: 2rem 2.5rem 1.5rem 2.5rem;
          border-bottom: 2px solid ${colors.lightTan};
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1.5rem;
        }

        .modal-header h2 {
          font-size: 1.75rem;
          font-weight: 800;
          color: ${colors.darkBrown};
          margin: 0;
        }

        .modal-subtitle {
          font-size: 0.95rem;
          color: ${colors.mediumBrown};
          margin: 0.5rem 0 0 0;
        }

        .modal-close {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: none;
          background: ${colors.cream};
          color: ${colors.mediumBrown};
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .modal-close:hover {
          background: ${colors.lightTan};
          transform: rotate(90deg);
        }

        .modal-body {
          padding: 2rem 2.5rem;
          overflow-y: auto;
          flex: 1;
        }

        .modal-body::-webkit-scrollbar {
          width: 8px;
        }

        .modal-body::-webkit-scrollbar-track {
          background: ${colors.cream};
          border-radius: 10px;
        }

        .modal-body::-webkit-scrollbar-thumb {
          background: ${colors.lightTan};
          border-radius: 10px;
        }

        .modal-body::-webkit-scrollbar-thumb:hover {
          background: ${colors.accentGold};
        }

        .form-section {
          margin-bottom: 1.75rem;
        }

        .form-label {
          display: block;
          font-size: 0.95rem;
          font-weight: 600;
          color: ${colors.darkBrown};
          margin-bottom: 0.75rem;
        }

        .required {
          color: #DC2626;
          margin-left: 0.25rem;
        }

        .select-wrapper {
          position: relative;
        }

        .form-select {
          width: 100%;
          padding: 1rem 3rem 1rem 1.25rem;
          border: 2px solid ${colors.lightTan};
          border-radius: 12px;
          background: ${colors.offWhite};
          color: ${colors.darkBrown};
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          appearance: none;
          transition: all 0.2s ease;
        }

        .form-select:focus {
          outline: none;
          border-color: ${colors.accentGold};
          background: white;
        }

        .form-select:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .select-icon {
          position: absolute;
          right: 1.25rem;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: ${colors.mediumBrown};
        }

        .form-help {
          margin: 0.5rem 0 0 0;
          font-size: 0.85rem;
          color: ${colors.mediumBrown};
        }

        .file-upload-area {
          border: 2px dashed ${colors.lightTan};
          border-radius: 16px;
          background: ${colors.offWhite};
          transition: all 0.3s ease;
        }

        .file-upload-area:hover {
          border-color: ${colors.accentGold};
          background: ${colors.cream};
        }

        .file-upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          gap: 1rem;
          cursor: pointer;
        }

        .upload-text {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .upload-title {
          font-size: 1rem;
          font-weight: 600;
          color: ${colors.darkBrown};
        }

        .upload-subtitle {
          font-size: 0.85rem;
          color: ${colors.mediumBrown};
        }

        .selected-file {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: white;
          border-top: 2px dashed ${colors.lightTan};
          font-size: 0.9rem;
          color: ${colors.darkBrown};
          font-weight: 500;
        }

        .file-size {
          margin-left: auto;
          font-size: 0.85rem;
          color: ${colors.mediumBrown};
        }

        .delivery-customer-info {
          background: ${colors.cream};
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .info-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.95rem;
          color: ${colors.darkBrown};
        }

        .delivery-items-section {
          background: ${colors.offWhite};
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          border: 2px solid ${colors.lightTan};
        }

        .delivery-items-section h4 {
          font-size: 1rem;
          font-weight: 600;
          color: ${colors.darkBrown};
          margin: 0 0 1rem 0;
        }

        .delivery-items-list {
          margin: 0;
          padding-left: 1.5rem;
        }

        .delivery-items-list li {
          font-size: 0.9rem;
          color: ${colors.mediumBrown};
          margin-bottom: 0.5rem;
        }

        .files-list-section {
          margin-top: 1.5rem;
        }

        .files-list-section h4 {
          font-size: 1rem;
          font-weight: 600;
          color: ${colors.darkBrown};
          margin: 0 0 1rem 0;
        }

        .files-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .file-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: ${colors.offWhite};
          border: 1px solid ${colors.lightTan};
          border-radius: 12px;
        }

        .file-preview {
          width: 44px;
          height: 44px;
          background: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .file-info {
          flex: 1;
          min-width: 0;
        }

        .file-name-input {
          width: 100%;
          border: none;
          background: transparent;
          font-size: 0.9rem;
          font-weight: 500;
          color: ${colors.darkBrown};
          padding: 0.25rem 0;
          margin-bottom: 0.25rem;
        }

        .file-name-input:focus {
          outline: none;
        }

        .btn-remove-file {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: none;
          background: #FEE2E2;
          color: #DC2626;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .btn-remove-file:hover {
          background: #DC2626;
          color: white;
        }

        .details-section {
          margin-bottom: 2rem;
        }

        .details-section h4 {
          font-size: 1.1rem;
          font-weight: 700;
          color: ${colors.darkBrown};
          margin: 0 0 1rem 0;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid ${colors.lightTan};
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .detail-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: ${colors.mediumBrown};
        }

        .detail-value {
          font-size: 0.95rem;
          color: ${colors.darkBrown};
          font-weight: 500;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.4rem 0.8rem;
          border-radius: 16px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
          text-transform: capitalize;
          flex-shrink: 0;
        }

        .status-badge.processing {
          background: ${colors.accentGold}20;
          color: ${colors.accentGold};
        }

        .status-badge.delivered {
          background: #10B98120;
          color: #10B981;
        }

        .details-items-list {
          margin: 0;
          padding-left: 1.5rem;
        }

        .details-items-list li {
          font-size: 0.95rem;
          color: ${colors.darkBrown};
          margin-bottom: 0.5rem;
        }

        .specifications-box {
          padding: 1.25rem;
          background: ${colors.offWhite};
          border: 2px solid ${colors.lightTan};
          border-radius: 12px;
          font-size: 0.95rem;
          color: ${colors.darkBrown};
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .deliverables-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .deliverable-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: ${colors.offWhite};
          border: 1px solid ${colors.lightTan};
          border-radius: 12px;
          text-decoration: none;
          color: ${colors.darkBrown};
          transition: all 0.2s ease;
        }

        .deliverable-item:hover {
          background: ${colors.cream};
          border-color: ${colors.accentGold};
        }

        .deliverable-item span {
          flex: 1;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .modal-footer {
          padding: 1.5rem 2.5rem 2rem 2.5rem;
          border-top: 2px solid ${colors.lightTan};
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          flex-wrap: wrap;
        }

        .btn-cancel,
        .btn-primary {
          padding: 1rem 2rem;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
          border: none;
          flex: 0 1 auto;
          min-width: 120px;
        }

        @media (max-width: 480px) {
          .btn-cancel,
          .btn-primary {
            flex: 1 1 100%;
          }
        }

        @media (max-width: 768px) {
          .growth-tools-container {
            margin-left: 0;
            padding: 1.5rem;
            padding-top: 6rem;
          }
        }
      `}</style>
    </>
  )
}

export default GrowthToolsAdmin
