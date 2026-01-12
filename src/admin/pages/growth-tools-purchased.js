"use client"
import { useState, useEffect } from "react"
import { 
  collection, query, where, getDocs, doc, updateDoc, 
  serverTimestamp, getFirestore, deleteDoc 
} from "firebase/firestore"
import { 
  getStorage, ref, uploadBytes, getDownloadURL
} from "firebase/storage"
import { getAuth } from "firebase/auth"
import {
  Package, Upload, Send, Check, Clock, FileText, X, Eye,
  Download, Search, Calendar, ShoppingCart, Trash2, Edit,
  Image as ImageIcon, File, Archive, MessageSquare, Paperclip,
  User, Mail, CreditCard, Clock as ClockIcon
} from "lucide-react"
import emailjs from '@emailjs/browser'

const GrowthToolsAdmin = () => {
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

  useEffect(() => {
    loadPurchases()
  }, [])

  useEffect(() => {
    filterAndSortPurchases()
  }, [purchases, searchTerm, statusFilter, dateFilter, sortBy])

  const loadPurchases = async () => {
    try {
      const purchasesRef = collection(db, "growthToolsPurchases")
      const q = query(purchasesRef, where("status", "==", "Success"))
      const querySnapshot = await getDocs(q)
      
      const purchasesData = []
      querySnapshot.forEach((doc) => {
        purchasesData.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          deliveredAt: doc.data().deliveredAt?.toDate()
        })
      })

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
      filtered = filtered.filter(p => p.deliveryStatus === statusFilter)
    }

    if (dateFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()
      
      switch(dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          filtered = filtered.filter(p => p.createdAt >= filterDate)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          filtered = filtered.filter(p => p.createdAt >= filterDate)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          filtered = filtered.filter(p => p.createdAt >= filterDate)
          break
      }
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p =>
        p.userName?.toLowerCase().includes(term) ||
        p.userEmail?.toLowerCase().includes(term) ||
        p.packageName?.toLowerCase().includes(term) ||
        p.transactionRef?.toLowerCase().includes(term)
      )
    }

    filtered.sort((a, b) => {
      switch(sortBy) {
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
    const newFiles = selectedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }))
    setFiles([...files, ...newFiles])
  }

  const removeFile = (fileId) => {
    setFiles(files.filter(f => f.id !== fileId))
  }

  const editFileName = (fileId, newName) => {
    setFiles(files.map(f => 
      f.id === fileId ? { ...f, name: newName } : f
    ))
  }

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <ImageIcon size={18} color={colors.accentGold} />
    if (fileType === 'application/pdf') return <FileText size={18} color="#DC2626" />
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) 
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
          uploadedAt: new Date().toISOString()
        })
      }

      const purchaseRef = doc(db, "growthToolsPurchases", selectedPurchase.id)
      await updateDoc(purchaseRef, {
        deliverables: uploadedFiles,
        deliveryStatus: "delivered",
        deliveredAt: serverTimestamp(),
        processedBy: auth.currentUser?.email || "admin"
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
        .join('<br>')

      const templateParams = {
        to_email: purchase.userEmail,
        to_name: purchase.userName || 'Valued Customer',
        package_name: purchase.packageName,
        transaction_id: purchase.transactionRef,
        files_count: uploadedFiles.length,
        files_list: filesListHTML,
        delivery_date: new Date().toLocaleDateString('en-ZA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }

      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_DELIVERY_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      )

      console.log('✅ Delivery email sent:', response)
      return { success: true }
    } catch (error) {
      console.error('❌ Delivery email failed:', error)
      return { success: false, error }
    }
  }

  const statsData = {
    processing: purchases.filter(p => p.deliveryStatus === "processing").length,
    delivered: purchases.filter(p => p.deliveryStatus === "delivered").length,
    total: purchases.length,
    pendingValue: purchases
      .filter(p => p.deliveryStatus === "processing")
      .reduce((sum, p) => sum + (p.totalAmount || 0), 0),
  }

  if (isLoading) {
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
          <h1>Growth Tools Admin</h1>
          <p>Manage and deliver growth tool purchases</p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {[
            { label: "Processing", value: statsData.processing, icon: <ClockIcon size={20} /> },
            { label: "Delivered", value: statsData.delivered, icon: <Check size={20} /> },
            { label: "Total Orders", value: statsData.total, icon: <Package size={20} /> },
            { label: "Pending Value", value: `R${statsData.pendingValue.toLocaleString()}`, icon: <CreditCard size={20} /> },
          ].map((stat, idx) => (
            <div key={idx} className="stat-card">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-number">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="filters-container">
          <div className="search-box">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, or transaction..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="processing">Processing</option>
              <option value="delivered">Delivered</option>
            </select>

            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last Month</option>
            </select>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount-high">Highest Amount</option>
              <option value="amount-low">Lowest Amount</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>

        {/* Purchases */}
        {filteredPurchases.length === 0 ? (
          <div className="empty-state">
            <Package size={64} />
            <h3>No purchases found</h3>
            <p>Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div className="purchases-grid">
            {filteredPurchases.map((purchase) => (
              <div key={purchase.id} className="purchase-card">
                <div className="card-header">
                  <div className="customer-info">
                    <User size={16} />
                    <div>
                      <div className="customer-name">{purchase.userName || "No Name"}</div>
                      <div className="customer-email">{purchase.userEmail}</div>
                    </div>
                  </div>
                  <div className={`status-badge ${purchase.deliveryStatus}`}>
                    {purchase.deliveryStatus === "delivered" ? (
                      <><Check size={12} /> Delivered</>
                    ) : (
                      <><Clock size={12} /> Processing</>
                    )}
                  </div>
                </div>

                <div className="package-info">
                  <div className="package-name">{purchase.packageName}</div>
                  <div className="items-count">
                    {purchase.selectedCount || purchase.items?.length || 0} item{purchase.selectedCount !== 1 ? 's' : ''}
                  </div>
                </div>

                <div className="meta-grid">
                  <div className="meta-item">
                    <Calendar size={14} />
                    <span className="meta-label">Date:</span>
                    <span className="meta-value">{purchase.createdAt?.toLocaleDateString('en-ZA')}</span>
                  </div>
                  <div className="meta-item">
                    <ShoppingCart size={14} />
                    <span className="meta-label">Amount:</span>
                    <span className="meta-value">R{purchase.totalAmount?.toLocaleString()}</span>
                  </div>
                  <div className="meta-item full-width">
                    <FileText size={14} />
                    <span className="meta-label">Transaction:</span>
                    <span className="meta-value truncate">{purchase.transactionRef}</span>
                  </div>
                </div>

                <div className="action-buttons">
                  <button className="btn-view" onClick={() => setViewDetailsModal(purchase)}>
                    <Eye size={14} /> Details
                  </button>
                  {purchase.deliveryStatus === "processing" ? (
                    <button className="btn-deliver" onClick={() => setSelectedPurchase(purchase)}>
                      <Upload size={14} /> Deliver
                    </button>
                  ) : (
                    <>
                      <button className="btn-edit" onClick={() => setSelectedPurchase(purchase)}>
                        <Edit size={14} /> Edit
                      </button>
                      <button className="btn-resend" onClick={() => handleResendFiles(purchase)}>
                        <Send size={14} /> Resend
                      </button>
                    </>
                  )}
                  <button className="btn-delete" onClick={() => handleDeletePurchase(purchase.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {selectedPurchase && (
        <div className="modal-overlay" onClick={() => { setSelectedPurchase(null); setFiles([]) }}>
          <div className="modal-content wide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedPurchase.deliveryStatus === "delivered" ? "Edit Deliverables" : "Upload Deliverables"}</h2>
              <button className="close-btn" onClick={() => { setSelectedPurchase(null); setFiles([]) }}>
                <X size={22} />
              </button>
            </div>

            <div className="modal-body">
              <div className="purchase-summary">
                <div className="summary-item">
                  <User size={18} />
                  <div>
                    <div className="summary-label">Customer</div>
                    <div className="summary-value">{selectedPurchase.userName}</div>
                  </div>
                </div>
                <div className="summary-item">
                  <Mail size={18} />
                  <div>
                    <div className="summary-label">Email</div>
                    <div className="summary-value">{selectedPurchase.userEmail}</div>
                  </div>
                </div>
                <div className="summary-item">
                  <Package size={18} />
                  <div>
                    <div className="summary-label">Package</div>
                    <div className="summary-value">{selectedPurchase.packageName}</div>
                  </div>
                </div>
                <div className="summary-item">
                  <ShoppingCart size={18} />
                  <div>
                    <div className="summary-label">Amount</div>
                    <div className="summary-value">R{selectedPurchase.totalAmount?.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Customer Specifications */}
              {(selectedPurchase.customerSpecifications || (selectedPurchase.specificationFiles && selectedPurchase.specificationFiles.length > 0)) && (
                <div className="specs-section">
                  <h3>
                    <MessageSquare size={18} />
                    Customer Specifications
                  </h3>
                  
                  {selectedPurchase.customerSpecifications && (
                    <div className="specs-text">
                      {selectedPurchase.customerSpecifications}
                    </div>
                  )}
                  
                  {selectedPurchase.specificationFiles && selectedPurchase.specificationFiles.length > 0 && (
                    <div className="reference-files">
                      <div className="section-header">
                        <Paperclip size={16} />
                        <span>Reference Files ({selectedPurchase.specificationFiles.length})</span>
                      </div>
                      <div className="files-grid">
                        {selectedPurchase.specificationFiles.map((file, idx) => (
                          <div key={idx} className="reference-file-item" onClick={() => window.open(file.url, '_blank')}>
                            {getFileIcon(file.type)}
                            <div className="file-details">
                              <div className="file-name">{file.name}</div>
                              <div className="file-size">{file.size}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="upload-section">
                <div className="upload-area" onClick={() => document.getElementById('fileInput').click()}>
                  <Upload size={40} />
                  <p>Click to upload files</p>
                  <p className="subtext">Images, PDFs, ZIP, and all file types</p>
                  <input
                    id="fileInput"
                    type="file"
                    multiple
                    accept="*/*"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />
                </div>

                {files.length > 0 && (
                  <div className="files-list">
                    <h4>Selected Files ({files.length})</h4>
                    <div className="files-container">
                      {files.map((fileData) => (
                        <div key={fileData.id} className="file-item">
                          <div className="file-icon">
                            {fileData.preview ? (
                              <img src={fileData.preview} alt="" />
                            ) : (
                              getFileIcon(fileData.type)
                            )}
                          </div>
                          <div className="file-info">
                            <input
                              type="text"
                              value={fileData.name}
                              onChange={(e) => editFileName(fileData.id, e.target.value)}
                              className="file-name-input"
                            />
                            <div className="file-meta">
                              <span>{(fileData.size / 1024 / 1024).toFixed(2)} MB</span>
                              <button onClick={() => removeFile(fileData.id)}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                className="deliver-btn"
                onClick={handleUploadAndDeliver}
                disabled={uploadingFiles || files.length === 0}
              >
                {uploadingFiles ? (
                  <>
                    <div className="spinner-small"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    {selectedPurchase.deliveryStatus === "delivered" 
                      ? "Update & Resend"
                      : "Upload & Deliver"
                    }
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewDetailsModal && (
        <div className="modal-overlay" onClick={() => setViewDetailsModal(null)}>
          <div className="modal-content wide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Purchase Details</h2>
              <button className="close-btn" onClick={() => setViewDetailsModal(null)}>
                <X size={22} />
              </button>
            </div>

            <div className="modal-body">
              <div className="purchase-summary">
                <div className="summary-item">
                  <User size={18} />
                  <div>
                    <div className="summary-label">Customer</div>
                    <div className="summary-value">{viewDetailsModal.userName}</div>
                  </div>
                </div>
                <div className="summary-item">
                  <Mail size={18} />
                  <div>
                    <div className="summary-label">Email</div>
                    <div className="summary-value">{viewDetailsModal.userEmail}</div>
                  </div>
                </div>
                <div className="summary-item">
                  <Package size={18} />
                  <div>
                    <div className="summary-label">Package</div>
                    <div className="summary-value">{viewDetailsModal.packageName}</div>
                  </div>
                </div>
                <div className="summary-item">
                  <ShoppingCart size={18} />
                  <div>
                    <div className="summary-label">Amount</div>
                    <div className="summary-value">R{viewDetailsModal.totalAmount?.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="details-grid">
                <div className="detail-item">
                  <div className="detail-label">Transaction ID</div>
                  <div className="detail-value code">{viewDetailsModal.transactionRef}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Purchase Date</div>
                  <div className="detail-value">{viewDetailsModal.createdAt?.toLocaleString('en-ZA')}</div>
                </div>
                {viewDetailsModal.deliveredAt && (
                  <div className="detail-item">
                    <div className="detail-label">Delivered Date</div>
                    <div className="detail-value">{viewDetailsModal.deliveredAt?.toLocaleString('en-ZA')}</div>
                  </div>
                )}
                <div className="detail-item">
                  <div className="detail-label">Status</div>
                  <div className={`status-indicator ${viewDetailsModal.deliveryStatus}`}>
                    {viewDetailsModal.deliveryStatus === "delivered" ? "✅ Delivered" : "⏳ Processing"}
                  </div>
                </div>
              </div>

              {/* Customer Specifications */}
              {(viewDetailsModal.customerSpecifications || (viewDetailsModal.specificationFiles && viewDetailsModal.specificationFiles.length > 0)) && (
                <div className="specs-section">
                  <h3>
                    <MessageSquare size={18} />
                    Customer Specifications
                  </h3>
                  
                  {viewDetailsModal.customerSpecifications && (
                    <div className="specs-text">
                      {viewDetailsModal.customerSpecifications}
                    </div>
                  )}
                  
                  {viewDetailsModal.specificationFiles && viewDetailsModal.specificationFiles.length > 0 && (
                    <div className="reference-files">
                      <div className="section-header">
                        <Paperclip size={16} />
                        <span>Reference Files ({viewDetailsModal.specificationFiles.length})</span>
                      </div>
                      <div className="files-grid">
                        {viewDetailsModal.specificationFiles.map((file, idx) => (
                          <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="reference-file-item">
                            {getFileIcon(file.type)}
                            <div className="file-details">
                              <div className="file-name">{file.name}</div>
                              <div className="file-size">{file.size}</div>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Purchased Items */}
              {viewDetailsModal.items && viewDetailsModal.items.length > 0 && (
                <div className="items-section">
                  <h3>Purchased Items ({viewDetailsModal.items.length})</h3>
                  <div className="items-list">
                    {viewDetailsModal.items.map((item, idx) => (
                      <div key={idx} className="item-row">
                        <span className="item-number">{idx + 1}.</span>
                        <span className="item-name">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivered Files */}
              {viewDetailsModal.deliverables && viewDetailsModal.deliverables.length > 0 && (
                <div className="delivered-section">
                  <h3>Delivered Files ({viewDetailsModal.deliverables.length})</h3>
                  <div className="files-grid">
                    {viewDetailsModal.deliverables.map((file, idx) => (
                      <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="delivered-file-item">
                        {getFileIcon(file.type)}
                        <div className="file-details">
                          <div className="file-name">{file.name}</div>
                          <div className="file-meta">
                            <span className="file-size">{file.size}</span>
                            <Download size={14} />
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .growth-tools-container {
          padding: 1rem;
          width: calc(100vw - 250px);
          min-height: 100vh;
          background: ${colors.offWhite};
          box-sizing: border-box;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          margin-left: 250px;
        }

        @media (max-width: 1024px) {
          .growth-tools-container {
            width: 100vw;
            margin-left: 0;
          }
        }

        .header {
          margin-bottom: 1.5rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, ${colors.cream}, ${colors.offWhite});
          border-radius: 16px;
          border: 2px solid ${colors.lightTan};
        }

        .header h1 {
          font-size: 1.8rem;
          font-weight: 800;
          background: linear-gradient(135deg, ${colors.darkBrown}, ${colors.mediumBrown});
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 0.5rem 0;
        }

        .header p {
          font-size: 0.95rem;
          color: ${colors.mediumBrown};
          margin: 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .stat-card {
          background: ${colors.cream};
          padding: 1.25rem;
          border-radius: 12px;
          border: 2px solid ${colors.lightTan};
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-icon {
          color: ${colors.accentGold};
          background: ${colors.accentGold}15;
          padding: 0.75rem;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-number {
          font-size: 1.5rem;
          font-weight: 800;
          color: ${colors.accentGold};
        }

        .stat-label {
          font-size: 0.75rem;
          color: ${colors.mediumBrown};
          text-transform: uppercase;
          font-weight: 600;
          margin-top: 0.25rem;
        }

        .filters-container {
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .search-box {
          position: relative;
          flex: 1;
        }

        .search-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: ${colors.accentGold};
          pointer-events: none;
        }

        .search-box input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border: 2px solid ${colors.lightTan};
          border-radius: 10px;
          font-size: 0.9rem;
          background: ${colors.cream};
          box-sizing: border-box;
          outline: none;
        }

        .filter-group {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .filter-group select {
          padding: 0.75rem;
          border: 2px solid ${colors.lightTan};
          border-radius: 10px;
          font-size: 0.85rem;
          background: ${colors.cream};
          cursor: pointer;
          min-width: 160px;
          flex: 1;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: ${colors.mediumBrown};
        }

        .empty-state svg {
          color: ${colors.lightTan};
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          color: ${colors.darkBrown};
        }

        .purchases-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1rem;
        }

        .purchase-card {
          background: ${colors.cream};
          padding: 1.25rem;
          border-radius: 16px;
          border: 2px solid ${colors.lightTan};
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .customer-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
        }

        .customer-info svg {
          color: ${colors.accentGold};
        }

        .customer-name {
          font-size: 1rem;
          font-weight: 700;
          color: ${colors.darkBrown};
          margin-bottom: 0.25rem;
        }

        .customer-email {
          font-size: 0.8rem;
          color: ${colors.mediumBrown};
        }

        .status-badge {
          padding: 0.4rem 0.75rem;
          border-radius: 16px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          white-space: nowrap;
        }

        .status-badge.delivered {
          background: #D1FAE5;
          color: #065F46;
          border: 2px solid #6EE7B7;
        }

        .status-badge.processing {
          background: #FEF3C7;
          color: #92400E;
          border: 2px solid #FCD34D;
        }

        .package-info {
          margin-bottom: 1rem;
        }

        .package-name {
          font-size: 0.95rem;
          font-weight: 600;
          color: ${colors.darkBrown};
          margin-bottom: 0.25rem;
        }

        .items-count {
          font-size: 0.8rem;
          color: ${colors.mediumBrown};
        }

        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
        }

        .meta-item.full-width {
          grid-column: 1 / -1;
        }

        .meta-item svg {
          color: ${colors.accentGold};
          flex-shrink: 0;
        }

        .meta-label {
          color: ${colors.mediumBrown};
          font-weight: 500;
        }

        .meta-value {
          color: ${colors.darkBrown};
          font-weight: 600;
        }

        .truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }

        button {
          font-family: inherit;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.6rem 0.75rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          transition: all 0.2s;
          flex: 1;
        }

        .btn-view {
          background: ${colors.offWhite};
          color: ${colors.mediumBrown};
          border: 2px solid ${colors.lightTan};
        }

        .btn-deliver {
          background: linear-gradient(135deg, ${colors.accentGold}, ${colors.mediumBrown});
          color: ${colors.offWhite};
        }

        .btn-edit {
          background: ${colors.offWhite};
          color: ${colors.mediumBrown};
          border: 2px solid ${colors.lightTan};
        }

        .btn-resend {
          background: linear-gradient(135deg, ${colors.accentGold}, ${colors.mediumBrown});
          color: ${colors.offWhite};
        }

        .btn-delete {
          background: #FEE2E2;
          color: #DC2626;
          border: 2px solid #FCA5A5;
          flex: 0.5;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-content {
          background: ${colors.offWhite};
          padding: 1.5rem;
          border-radius: 20px;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .wide-modal {
          max-width: 800px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .modal-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: ${colors.darkBrown};
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: ${colors.mediumBrown};
          padding: 0.5rem;
        }

        .modal-body {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .purchase-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
          padding: 1rem;
          background: ${colors.cream};
          border-radius: 12px;
          border: 2px solid ${colors.lightTan};
        }

        .summary-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .summary-item svg {
          color: ${colors.accentGold};
          background: ${colors.accentGold}15;
          padding: 0.5rem;
          border-radius: 8px;
        }

        .summary-label {
          font-size: 0.75rem;
          color: ${colors.mediumBrown};
          font-weight: 600;
          text-transform: uppercase;
        }

        .summary-value {
          font-size: 0.95rem;
          color: ${colors.darkBrown};
          font-weight: 700;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          padding: 1rem;
          background: ${colors.cream};
          border-radius: 12px;
          border: 2px solid ${colors.lightTan};
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .detail-label {
          font-size: 0.75rem;
          color: ${colors.mediumBrown};
          font-weight: 600;
          text-transform: uppercase;
        }

        .detail-value {
          font-size: 0.9rem;
          color: ${colors.darkBrown};
          font-weight: 600;
          word-break: break-all;
        }

        .detail-value.code {
          font-family: monospace;
          font-size: 0.8rem;
          background: ${colors.offWhite};
          padding: 0.5rem;
          border-radius: 6px;
          border: 1px solid ${colors.lightTan};
        }

        .status-indicator {
          padding: 0.4rem 0.75rem;
          border-radius: 16px;
          font-size: 0.8rem;
          font-weight: 700;
          display: inline-block;
          width: fit-content;
        }

        .status-indicator.delivered {
          background: #D1FAE5;
          color: #065F46;
          border: 2px solid #6EE7B7;
        }

        .status-indicator.processing {
          background: #FEF3C7;
          color: #92400E;
          border: 2px solid #FCD34D;
        }

        .specs-section {
          background: ${colors.accentGold}15;
          padding: 1.25rem;
          border-radius: 12px;
          border: 2px solid ${colors.accentGold}40;
        }

        .specs-section h3 {
          font-size: 1.1rem;
          font-weight: 700;
          color: ${colors.darkBrown};
          margin: 0 0 1rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .specs-section h3 svg {
          color: ${colors.accentGold};
        }

        .specs-text {
          padding: 1rem;
          background: ${colors.cream};
          border-radius: 8px;
          font-size: 0.9rem;
          color: ${colors.darkBrown};
          line-height: 1.6;
          white-space: pre-wrap;
          margin-bottom: 1rem;
        }

        .reference-files {
          margin-top: 1rem;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: ${colors.darkBrown};
          margin-bottom: 0.75rem;
        }

        .section-header svg {
          color: ${colors.accentGold};
        }

        .files-grid {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .reference-file-item,
        .delivered-file-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: ${colors.offWhite};
          border-radius: 8px;
          border: 1px solid ${colors.lightTan};
          text-decoration: none;
          color: inherit;
          transition: all 0.2s;
        }

        .reference-file-item:hover,
        .delivered-file-item:hover {
          background: ${colors.cream};
          border-color: ${colors.accentGold};
        }

        .file-details {
          flex: 1;
          min-width: 0;
        }

        .file-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: ${colors.darkBrown};
          margin-bottom: 0.25rem;
          word-break: break-all;
        }

        .file-size {
          font-size: 0.75rem;
          color: ${colors.mediumBrown};
        }

        .upload-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .upload-area {
          border: 2px dashed ${colors.lightTan};
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
          background: ${colors.cream};
          cursor: pointer;
          transition: all 0.2s;
        }

        .upload-area:hover {
          border-color: ${colors.accentGold};
          background: ${colors.offWhite};
        }

        .upload-area svg {
          color: ${colors.accentGold};
          margin-bottom: 0.75rem;
        }

        .upload-area p {
          font-size: 1rem;
          font-weight: 600;
          color: ${colors.darkBrown};
          margin: 0 0 0.25rem 0;
        }

        .subtext {
          font-size: 0.85rem;
          color: ${colors.mediumBrown};
          margin: 0;
        }

        .files-list h4 {
          font-size: 1rem;
          font-weight: 600;
          color: ${colors.darkBrown};
          margin: 0 0 1rem 0;
        }

        .files-container {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 200px;
          overflow-y: auto;
        }

        .file-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: ${colors.offWhite};
          border-radius: 8px;
          border: 1px solid ${colors.lightTan};
        }

        .file-icon {
          flex-shrink: 0;
        }

        .file-icon img {
          width: 40px;
          height: 40px;
          object-fit: cover;
          border-radius: 6px;
          border: 2px solid ${colors.lightTan};
        }

        .file-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .file-name-input {
          padding: 0.5rem;
          border: 1px solid ${colors.lightTan};
          border-radius: 6px;
          font-size: 0.85rem;
          background: ${colors.cream};
          outline: none;
        }

        .file-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          color: ${colors.mediumBrown};
        }

        .file-meta button {
          padding: 0.25rem;
          background: #FEE2E2;
          color: #DC2626;
          border-radius: 4px;
        }

        .deliver-btn {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, ${colors.accentGold}, ${colors.mediumBrown});
          color: ${colors.offWhite};
          border: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }

        .deliver-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px ${colors.accentGold}40;
        }

        .deliver-btn:disabled {
          background: ${colors.lightTan};
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spinner-small {
          width: 18px;
          height: 18px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .items-section {
          padding: 1.25rem;
          background: ${colors.cream};
          border-radius: 12px;
          border: 2px solid ${colors.lightTan};
        }

        .items-section h3 {
          font-size: 1.1rem;
          font-weight: 700;
          color: ${colors.darkBrown};
          margin: 0 0 1rem 0;
        }

        .items-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 200px;
          overflow-y: auto;
        }

        .item-row {
          display: flex;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: ${colors.darkBrown};
        }

        .item-number {
          font-weight: 600;
          color: ${colors.accentGold};
        }

        .delivered-section {
          padding: 1.25rem;
          background: ${colors.cream};
          border-radius: 12px;
          border: 2px solid ${colors.lightTan};
        }

        .delivered-section h3 {
          font-size: 1.1rem;
          font-weight: 700;
          color: ${colors.darkBrown};
          margin: 0 0 1rem 0;
        }

        .delivered-file-item .file-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.25rem;
        }

        .delivered-file-item .file-meta svg {
          color: ${colors.accentGold};
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .growth-tools-container {
            padding: 0.75rem;
          }

          .purchases-grid {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }

          .filter-group {
            flex-direction: column;
          }

          .filter-group select {
            min-width: 100%;
          }

          .action-buttons {
            flex-wrap: wrap;
          }

          button {
            min-width: calc(50% - 0.25rem);
          }

          .btn-delete {
            flex: 1;
          }

          .modal-content,
          .wide-modal {
            padding: 1rem;
          }

          .purchase-summary,
          .details-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  )
}

export default GrowthToolsAdmin