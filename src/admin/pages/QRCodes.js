"use client"
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  QrCode,
  Search,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
  Save,
  User,
  Mail,
  Phone,
  Building,
  Globe,
  MapPin,
  Briefcase,
  Palette,
  Camera,
  Upload,
  Smartphone,
  PhoneCall,
  Linkedin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  RefreshCw,
} from "lucide-react"
import QRCodeStyling from "qr-code-styling"
import styles from "./qr-codes.module.css"
import { db, storage } from "../../firebaseConfig"
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, query, where, setDoc } from "firebase/firestore"
import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage"
import { auth } from "../../firebaseConfig"

function QRCodesManager() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [showGenerator, setShowGenerator] = useState(false)
  const [businessCards, setBusinessCards] = useState([])
  const [editingCard, setEditingCard] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [logoPreview, setLogoPreview] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    title: "",
    company: "",
    email: "",
    mobile: "",
    telephone: "",
    website: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    notes: "",
    linkedin: "",
    facebook: "",
    instagram: "",
    twitter: "",
    youtube: "",
    logo: "",
  })

  const [cardDesign, setCardDesign] = useState({
    backgroundColor: "#9e6e3c",
    textColor: "#ffffff",
    accentColor: "#f8f7f3",
    logoUrl: "",
  })

  useEffect(() => {
    const loadCardsFromFirestore = async (user) => {
      try {
        if (!user) {
          console.log('No user logged in')
          setBusinessCards([])
          setLoading(false)
          return
        }

        console.log('Loading cards for user:', user.uid)
        const cardsRef = collection(db, "businessCards")
        const q = query(cardsRef, where("userId", "==", user.uid))
        const querySnapshot = await getDocs(q)
        
        const loadedCards = []
        querySnapshot.forEach((doc) => {
          loadedCards.push({
            id: doc.id,
            ...doc.data()
          })
        })
        
        setBusinessCards(loadedCards)
        console.log(`Loaded ${loadedCards.length} cards from Firestore`)
      } catch (error) {
        console.error("Error loading cards from Firestore:", error)
        alert("Error loading business cards. Please refresh the page.")
      } finally {
        setLoading(false)
      }
    }

    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('Auth state changed:', user ? 'Logged in' : 'Logged out')
      setLoading(true)
      loadCardsFromFirestore(user)
    })

    // Cleanup listener on unmount
    return () => unsubscribe()
  }, [])

  // Firebase Firestore handles persistence - no need for localStorage sync

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 500000) {
        alert("Logo file is too large. Please use an image smaller than 500KB. Large logos make QR codes very long.")
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result
        console.log('Logo uploaded, size:', base64String.length, 'characters')
        
        setLogoPreview(base64String)
        setCardDesign((prev) => ({
          ...prev,
          logoUrl: base64String,
        }))
        setFormData((prev) => ({
          ...prev,
          logo: base64String,
        }))
      }
      reader.onerror = () => {
        console.error('Error reading logo file')
        alert('Error reading logo file. Please try again.')
      }
      reader.readAsDataURL(file)
    }
  }

  const generateVCard = (data) => {
    const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${data.firstName} ${data.lastName}
N:${data.lastName};${data.firstName};;;
TITLE:${data.title}
ORG:${data.company}
TEL;TYPE=CELL:${data.mobile}
${data.telephone ? `TEL;TYPE=WORK,VOICE:${data.telephone}` : ''}
EMAIL;TYPE=INTERNET:${data.email}
${data.website ? `URL:${data.website}` : ''}
${data.address ? `ADR;TYPE=WORK:;;${data.address};${data.city};${data.state};${data.zipCode};${data.country}` : ''}
${data.notes ? `NOTE:${data.notes}` : ''}
END:VCARD`
    return vCard
  }

  const generateQRCode = async (cardUrl, design) => {
    const qrCode = new QRCodeStyling({
      width: 400,
      height: 400,
      data: cardUrl,
      margin: 10,
      qrOptions: {
        typeNumber: 0,
        mode: "Byte",
        errorCorrectionLevel: "H",
      },
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: 0.4,
        margin: 5,
      },
      dotsOptions: {
        color: design.backgroundColor,
        type: "rounded",
      },
      backgroundOptions: {
        color: "#ffffff",
      },
      cornersSquareOptions: {
        color: design.backgroundColor,
        type: "extra-rounded",
      },
      cornersDotOptions: {
        color: design.accentColor !== "#ffffff" ? design.accentColor : design.backgroundColor,
        type: "dot",
      },
    })

    return qrCode
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleDesignChange = (field, value) => {
    setCardDesign((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (isSubmitting) {
      console.log('Already submitting...')
      return
    }

    setIsSubmitting(true)

    try {
      console.log('Starting card creation with Firebase...')
      
      if (!auth.currentUser) {
        alert('You must be logged in to create business cards')
        setIsSubmitting(false)
        return
      }

      // Create a document reference to get the ID FIRST
      const cardsRef = collection(db, "businessCards")
      const newCardRef = editingCard ? doc(db, "businessCards", editingCard.id) : doc(cardsRef)
      const cardId = newCardRef.id  // This is the Firestore document ID!
      
      console.log('Card ID:', cardId)
      
      // Prepare card data
      const cardData = {
        userId: auth.currentUser.uid,
        firstName: formData.firstName,
        lastName: formData.lastName,
        title: formData.title,
        company: formData.company,
        mobile: formData.mobile,
        telephone: formData.telephone,
        email: formData.email,
        website: formData.website,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        linkedin: formData.linkedin,
        facebook: formData.facebook,
        instagram: formData.instagram,
        twitter: formData.twitter,
        youtube: formData.youtube,
        notes: formData.notes,
        design: cardDesign,
        logo: formData.logo,
        createdAt: editingCard ? editingCard.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      console.log('Card data prepared')

      // Generate the URL that the QR code will point to (using Firestore document ID!)
      const baseUrl = window.location.hostname === 'localhost' 
        ? window.location.origin 
        : 'https://www.bigmarketplace.africa'
      const cardUrl = `${baseUrl}/card/${cardId}`
      
      console.log('Card URL:', cardUrl)

      // Generate vCard data
      const vCardData = generateVCard(formData)
      console.log('vCard generated')

      // Generate QR code
      console.log('Generating QR code...')
      const qrCode = await generateQRCode(cardUrl, cardDesign)

      console.log('Getting QR code image data...')
      await qrCode.getRawData("png").then(async (qrBlob) => {
        const reader = new FileReader()
        reader.onloadend = async () => {
          try {
            console.log('QR code image ready, uploading to Firebase...')
            
            const qrCodeDataUrl = reader.result
            
            // Upload QR code to Firebase Storage
            const qrStorageRef = ref(storage, `qr-codes/${auth.currentUser.uid}/${cardId}.png`)
            await uploadString(qrStorageRef, qrCodeDataUrl, 'data_url')
            const qrCodeUrl = await getDownloadURL(qrStorageRef)
            console.log('QR code uploaded to Storage:', qrCodeUrl)

            // Prepare final card object
            const finalCardData = {
              ...cardData,
              qrCodeData: qrCodeUrl,
              vCardData: vCardData,
              cardUrl: cardUrl,
            }

            // Save to Firestore using setDoc (not addDoc) with our specific ID
            await setDoc(newCardRef, finalCardData)
            console.log('Card saved to Firestore with ID:', cardId)
            
            if (editingCard) {
              // Update local state
              setBusinessCards((prev) =>
                prev.map((card) => (card.id === editingCard.id ? { ...finalCardData, id: cardId } : card))
              )
              console.log('Card updated successfully')
            } else {
              // Add to local state
              setBusinessCards((prev) => [...prev, { ...finalCardData, id: cardId }])
              console.log('New card added successfully')
            }

            resetForm()
            setShowGenerator(false)
            setIsSubmitting(false)
            
            alert(`Business card created successfully! ✅\nCard ID: ${cardId}`)
          } catch (firebaseError) {
            console.error('Error saving to Firebase:', firebaseError)
            setIsSubmitting(false)
            alert(`Error saving business card: ${firebaseError.message}`)
          }
        }
        reader.onerror = (error) => {
          console.error('Error reading QR code blob:', error)
          setIsSubmitting(false)
          alert('Error creating QR code image')
        }
        reader.readAsDataURL(qrBlob)
      }).catch(error => {
        console.error('Error getting QR code data:', error)
        setIsSubmitting(false)
        alert('Error generating QR code')
      })
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      setIsSubmitting(false)
      alert(`Error creating business card: ${error.message}`)
    }
  }

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true)
      console.log('Manual refresh triggered')
      
      if (!auth.currentUser) {
        console.log('No user logged in')
        setBusinessCards([])
        setIsRefreshing(false)
        return
      }

      const cardsRef = collection(db, "businessCards")
      const q = query(cardsRef, where("userId", "==", auth.currentUser.uid))
      const querySnapshot = await getDocs(q)
      
      const loadedCards = []
      querySnapshot.forEach((doc) => {
        loadedCards.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      setBusinessCards(loadedCards)
      console.log(`Refreshed: Loaded ${loadedCards.length} cards`)
    } catch (error) {
      console.error("Error refreshing cards:", error)
      alert("Error refreshing cards. Please try again.")
    } finally {
      setIsRefreshing(false)
    }
  }

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      title: "",
      company: "",
      email: "",
      mobile: "",
      telephone: "",
      website: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      notes: "",
      linkedin: "",
      facebook: "",
      instagram: "",
      twitter: "",
      youtube: "",
      logo: "",
    })
    setCardDesign({
      backgroundColor: "#9e6e3c",
      textColor: "#ffffff",
      accentColor: "#f8f7f3",
      logoUrl: "",
    })
    setLogoPreview(null)
    setEditingCard(null)
  }

  const handleEdit = (card) => {
    setFormData({
      firstName: card.firstName,
      lastName: card.lastName,
      title: card.title,
      company: card.company,
      email: card.email,
      mobile: card.mobile,
      telephone: card.telephone || "",
      website: card.website || "",
      address: card.address || "",
      city: card.city || "",
      state: card.state || "",
      zipCode: card.zipCode || "",
      country: card.country || "",
      notes: card.notes || "",
      linkedin: card.linkedin || "",
      facebook: card.facebook || "",
      instagram: card.instagram || "",
      twitter: card.twitter || "",
      youtube: card.youtube || "",
      logo: card.logo || card.design?.logoUrl || "",
    })
    setCardDesign(card.design)
    setLogoPreview(card.design?.logoUrl || card.logo)
    setEditingCard(card)
    setShowGenerator(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this business card?")) {
      try {
        // Delete from Firestore
        await deleteDoc(doc(db, "businessCards", id))
        
        // Delete QR code image from Storage
        try {
          const qrStorageRef = ref(storage, `qr-codes/${auth.currentUser.uid}/${id}.png`)
          await deleteObject(qrStorageRef)
        } catch (storageError) {
          console.warn('QR code image not found in storage or already deleted:', storageError)
        }
        
        // Update local state
        setBusinessCards((prev) => prev.filter((card) => card.id !== id))
        console.log('Card deleted successfully')
      } catch (error) {
        console.error('Error deleting card:', error)
        alert('Error deleting business card. Please try again.')
      }
    }
  }

  const downloadQRCode = (card) => {
    const link = document.createElement("a")
    link.download = `${card.firstName}_${card.lastName}_QR.png`
    link.href = card.qrCodeData
    link.click()
  }

  const viewCard = (cardId) => {
    // Find the card and use its cardUrl which includes the data parameter
    const card = businessCards.find(c => c.id === cardId)
    if (card && card.cardUrl) {
      // Extract the path and query params from the full URL
      const url = new URL(card.cardUrl)
      const path = url.pathname + url.search
      window.open(path, '_blank')
    } else {
      // Fallback to simple navigation for old cards
      navigate(`/card/${cardId}`)
    }
  }

  const downloadVCard = (card) => {
    const blob = new Blob([card.vCardData], { type: 'text/vcard' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${card.firstName}_${card.lastName}.vcf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const exportAllCards = () => {
    const dataStr = JSON.stringify(businessCards, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `business-cards-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const filteredCards = businessCards.filter(
    (card) =>
      card.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading QR Codes...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Business Card QR Codes</h1>
          <p className={styles.subtitle}>
            Create digital business cards with landing pages & QR codes
          </p>
        </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.actionButton} 
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{ opacity: isRefreshing ? 0.6 : 1 }}
            title="Refresh cards"
          >
            <RefreshCw size={16} className={isRefreshing ? styles.spinning : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          {businessCards.length > 0 && (
            <button className={styles.actionButton} onClick={exportAllCards}>
              <Download size={16} />
              Export All
            </button>
          )}
          <button
            className={styles.primaryButton}
            onClick={() => {
              resetForm()
              setShowGenerator(true)
            }}
          >
            <Plus size={16} />
            Create Business Card
          </button>
        </div>
      </div>

      {businessCards.length > 0 && (
        <div className={styles.searchBar}>
          <div className={styles.searchInput}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Search business cards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}

      {businessCards.length > 0 ? (
        <div className={styles.cardsGrid}>
          {filteredCards.map((card) => (
            <div key={card.id} className={styles.businessCard}>
              <div
                className={styles.cardPreview}
                style={{
                  backgroundColor: card.design.backgroundColor,
                  color: card.design.textColor,
                }}
              >
                <div className={styles.cardContent}>
                  {card.design.logoUrl && (
                    <div className={styles.miniLogo}>
                      <img src={card.design.logoUrl} alt="Logo" />
                    </div>
                  )}
                  <h3>
                    {card.firstName} {card.lastName}
                  </h3>
                  <p className={styles.cardTitle}>{card.title}</p>
                  <p className={styles.cardCompany}>{card.company}</p>
                  <div className={styles.cardContact}>
                    <span>📱 {card.mobile}</span>
                    <span>✉️ {card.email}</span>
                  </div>
                </div>
                <div className={styles.cardQR}>
                  <img src={card.qrCodeData} alt="QR Code" />
                </div>
              </div>
              <div className={styles.cardActions}>
                <button
                  onClick={() => viewCard(card.id)}
                  className={styles.iconButton}
                  title="Preview Page"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => handleEdit(card)}
                  className={styles.iconButton}
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => downloadQRCode(card)}
                  className={styles.iconButton}
                  title="Download QR"
                >
                  <QrCode size={16} />
                </button>
                <button
                  onClick={() => downloadVCard(card)}
                  className={styles.iconButton}
                  title="Download vCard"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => handleDelete(card.id)}
                  className={styles.iconButton}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : !showGenerator ? (
        <div className={styles.placeholderContainer}>
          <div className={styles.placeholderIcon}>
            <QrCode size={80} />
          </div>
          <h2 className={styles.placeholderTitle}>Create Your First Business Card</h2>
          <p className={styles.placeholderText}>
            Generate professional digital business cards with beautiful landing pages and QR codes
          </p>
          <p className={styles.placeholderSubtext}>
            Add logo, social media links, and create a mobile-optimized contact page
          </p>

          <div className={styles.placeholderFeatures}>
            <div className={styles.featureItem}>
              <Camera size={20} />
              <span>Add Logo</span>
            </div>
            <div className={styles.featureItem}>
              <QrCode size={20} />
              <span>QR Code</span>
            </div>
            <div className={styles.featureItem}>
              <Smartphone size={20} />
              <span>Landing Page</span>
            </div>
            <div className={styles.featureItem}>
              <Linkedin size={20} />
              <span>Social Links</span>
            </div>
          </div>

          <button
            className={styles.primaryButton}
            style={{ marginTop: "32px" }}
            onClick={() => setShowGenerator(true)}
          >
            <Plus size={16} />
            Get Started
          </button>
        </div>
      ) : null}

      {showGenerator && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{editingCard ? "Edit Business Card" : "Create Business Card"}</h2>
              <button
                className={styles.closeButton}
                onClick={() => {
                  setShowGenerator(false)
                  resetForm()
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formLayout}>
                <div className={styles.formColumn}>
                  <h3>Personal Information</h3>

                  <div className={styles.formGroup}>
                    <label>
                      <Camera size={16} />
                      Logo / Photo
                    </label>
                    <div className={styles.logoUpload}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLogoUpload}
                        accept="image/*"
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        className={styles.uploadButton}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload size={20} />
                        {logoPreview ? 'Change Logo' : 'Upload Logo'}
                      </button>
                      {logoPreview && (
                        <div className={styles.logoPreviewContainer}>
                          <img src={logoPreview} alt="Logo preview" />
                          <button
                            type="button"
                            className={styles.removeButton}
                            onClick={() => {
                              setLogoPreview(null)
                              setCardDesign(prev => ({ ...prev, logoUrl: '' }))
                            }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>
                        <User size={16} />
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>
                        <User size={16} />
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      <Briefcase size={16} />
                      Job Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      <Building size={16} />
                      Company *
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <h3>Contact Information</h3>

                  <div className={styles.formGroup}>
                    <label>
                      <Smartphone size={16} />
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      placeholder="+27 71 360 2744"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      <PhoneCall size={16} />
                      Telephone (Office)
                    </label>
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleInputChange}
                      placeholder="+27 87 265 4893"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      <Mail size={16} />
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      <Globe size={16} />
                      Website
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://www.bigmarketplace.africa"
                    />
                  </div>

                  <h3>Address (Optional)</h3>

                  <div className={styles.formGroup}>
                    <label>
                      <MapPin size={16} />
                      Street Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>State/Province</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Zip/Postal Code</label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Country</label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <h3>Social Media Links</h3>

                  <div className={styles.formGroup}>
                    <label>
                      <Linkedin size={16} />
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      <Facebook size={16} />
                      Facebook
                    </label>
                    <input
                      type="url"
                      name="facebook"
                      value={formData.facebook}
                      onChange={handleInputChange}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      <Instagram size={16} />
                      Instagram
                    </label>
                    <input
                      type="url"
                      name="instagram"
                      value={formData.instagram}
                      onChange={handleInputChange}
                      placeholder="https://instagram.com/yourprofile"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      <Twitter size={16} />
                      Twitter / X
                    </label>
                    <input
                      type="url"
                      name="twitter"
                      value={formData.twitter}
                      onChange={handleInputChange}
                      placeholder="https://twitter.com/yourhandle"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      <Youtube size={16} />
                      YouTube
                    </label>
                    <input
                      type="url"
                      name="youtube"
                      value={formData.youtube}
                      onChange={handleInputChange}
                      placeholder="https://youtube.com/@yourchannel"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Additional information..."
                    />
                  </div>
                </div>

                <div className={styles.previewColumn}>
                  <h3>Design Customization</h3>

                  <div className={styles.colorPickers}>
                    <div className={styles.colorPicker}>
                      <label>
                        <Palette size={16} />
                        Background Color
                      </label>
                      <div className={styles.colorInputGroup}>
                        <input
                          type="color"
                          value={cardDesign.backgroundColor}
                          onChange={(e) =>
                            handleDesignChange("backgroundColor", e.target.value)
                          }
                        />
                        <input
                          type="text"
                          value={cardDesign.backgroundColor}
                          onChange={(e) =>
                            handleDesignChange("backgroundColor", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className={styles.colorPicker}>
                      <label>Text Color</label>
                      <div className={styles.colorInputGroup}>
                        <input
                          type="color"
                          value={cardDesign.textColor}
                          onChange={(e) => handleDesignChange("textColor", e.target.value)}
                        />
                        <input
                          type="text"
                          value={cardDesign.textColor}
                          onChange={(e) => handleDesignChange("textColor", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className={styles.colorPicker}>
                      <label>Accent Color</label>
                      <div className={styles.colorInputGroup}>
                        <input
                          type="color"
                          value={cardDesign.accentColor}
                          onChange={(e) => handleDesignChange("accentColor", e.target.value)}
                        />
                        <input
                          type="text"
                          value={cardDesign.accentColor}
                          onChange={(e) => handleDesignChange("accentColor", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles.presetColors}>
                    <p>Color Presets:</p>
                    <div className={styles.presetGrid}>
                      <button
                        type="button"
                        onClick={() =>
                          setCardDesign({
                            ...cardDesign,
                            backgroundColor: "#9e6e3c",
                            textColor: "#ffffff",
                            accentColor: "#f8f7f3",
                          })
                        }
                        style={{ backgroundColor: "#9e6e3c" }}
                        title="Warm Brown"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setCardDesign({
                            ...cardDesign,
                            backgroundColor: "#2c3e50",
                            textColor: "#ffffff",
                            accentColor: "#3498db",
                          })
                        }
                        style={{ backgroundColor: "#2c3e50" }}
                        title="Professional Blue"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setCardDesign({
                            ...cardDesign,
                            backgroundColor: "#1a1a1a",
                            textColor: "#ffffff",
                            accentColor: "#ffd700",
                          })
                        }
                        style={{ backgroundColor: "#1a1a1a" }}
                        title="Elegant Black"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setCardDesign({
                            ...cardDesign,
                            backgroundColor: "#27ae60",
                            textColor: "#ffffff",
                            accentColor: "#ecf0f1",
                          })
                        }
                        style={{ backgroundColor: "#27ae60" }}
                        title="Fresh Green"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setCardDesign({
                            ...cardDesign,
                            backgroundColor: "#8e44ad",
                            textColor: "#ffffff",
                            accentColor: "#f39c12",
                          })
                        }
                        style={{ backgroundColor: "#8e44ad" }}
                        title="Royal Purple"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setCardDesign({
                            ...cardDesign,
                            backgroundColor: "#c0392b",
                            textColor: "#ffffff",
                            accentColor: "#ecf0f1",
                          })
                        }
                        style={{ backgroundColor: "#c0392b" }}
                        title="Bold Red"
                      />
                    </div>
                  </div>

                  <h3>Mobile Preview</h3>
                  <div className={styles.mobilePreview}>
                    <div
                      className={styles.cardPreviewLarge}
                      style={{
                        backgroundColor: cardDesign.backgroundColor,
                        color: cardDesign.textColor,
                      }}
                    >
                      {(logoPreview || formData.firstName) && (
                        <div className={styles.previewLogo}>
                          {logoPreview ? (
                            <img src={logoPreview} alt="Logo" />
                          ) : (
                            <div className={styles.previewInitials}>
                              {formData.firstName.charAt(0)}{formData.lastName.charAt(0)}
                            </div>
                          )}
                        </div>
                      )}
                      <div className={styles.previewContent}>
                        <h4>
                          {formData.firstName || "First"} {formData.lastName || "Last"}
                        </h4>
                        <p>{formData.title || "Job Title"}</p>
                        <p style={{ fontWeight: "bold" }}>{formData.company || "Company"}</p>
                        <div className={styles.previewContact}>
                          <small>📱 {formData.mobile || "+27 71 360 2744"}</small>
                          {formData.telephone && <small>☎️ {formData.telephone}</small>}
                          <small>✉️ {formData.email || "email@example.com"}</small>
                          {formData.website && <small>🌐 {formData.website}</small>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowGenerator(false)
                    resetForm()
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.primaryButton}
                  disabled={isSubmitting}
                  style={{ opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'wait' : 'pointer' }}
                >
                  <Save size={16} />
                  {isSubmitting 
                    ? 'Creating...' 
                    : editingCard ? "Update Business Card" : "Create Business Card"
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default QRCodesManager