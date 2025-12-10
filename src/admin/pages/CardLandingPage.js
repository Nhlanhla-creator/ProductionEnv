import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { 
  Phone, 
  Mail, 
  Globe, 
  Briefcase, 
  MapPin, 
  UserPlus, 
  Smartphone,
  Linkedin,
  Facebook,
  Instagram,
  Twitter,
  Youtube
} from "lucide-react"
import styles from "./card-landing.module.css"
import { db } from "../../firebaseConfig"
import { doc, getDoc } from "firebase/firestore"

function CardLandingPage() {
  const { cardId } = useParams()
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCardFromFirestore = async () => {
      try {
        console.log('Fetching card from Firestore:', cardId)
        
        const cardDocRef = doc(db, "businessCards", cardId)
        const cardDocSnap = await getDoc(cardDocRef)
        
        if (cardDocSnap.exists()) {
          const cardData = cardDocSnap.data()
          console.log('Card found in Firestore:', cardData)
          setCard(cardData)
        } else {
          console.error('Card not found in Firestore')
          setError('Card not found')
        }
      } catch (err) {
        console.error('Error fetching card from Firestore:', err)
        setError('Error loading card')
      } finally {
        setLoading(false)
      }
    }

    fetchCardFromFirestore()
  }, [cardId])

  const addToContacts = () => {
    if (!card) return

    const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${card.firstName} ${card.lastName}
N:${card.lastName};${card.firstName};;;
TITLE:${card.title}
ORG:${card.company}
TEL;TYPE=CELL:${card.mobile}
${card.telephone ? `TEL;TYPE=WORK,VOICE:${card.telephone}` : ''}
EMAIL;TYPE=INTERNET:${card.email}
${card.website ? `URL:${card.website}` : ''}
${card.address ? `ADR;TYPE=WORK:;;${card.address};${card.city};${card.state};${card.zipCode};${card.country}` : ''}
${card.notes ? `NOTE:${card.notes}` : ''}
END:VCARD`

    const blob = new Blob([vCard], { type: 'text/vcard' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${card.firstName}_${card.lastName}.vcf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading business card...</p>
      </div>
    )
  }

  if (error || !card) {
    return (
      <div className={styles.notFound}>
        <h1>Card Not Found</h1>
        <p>This business card doesn't exist or has been removed.</p>
        <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
          Card ID: {cardId}
        </p>
      </div>
    )
  }

  const socialLinks = []
  if (card.linkedin) socialLinks.push({ name: 'LinkedIn', url: card.linkedin, Icon: Linkedin, color: '#0077b5' })
  if (card.facebook) socialLinks.push({ name: 'Facebook', url: card.facebook, Icon: Facebook, color: '#1877f2' })
  if (card.instagram) socialLinks.push({ name: 'Instagram', url: card.instagram, Icon: Instagram, color: '#e4405f' })
  if (card.twitter) socialLinks.push({ name: 'Twitter', url: card.twitter, Icon: Twitter, color: '#1da1f2' })
  if (card.youtube) socialLinks.push({ name: 'YouTube', url: card.youtube, Icon: Youtube, color: '#ff0000' })

  return (
    <div className={styles.pageContainer}>
      {/* Header with Logo, Name, Title */}
      <div 
        className={styles.header}
        style={{ backgroundColor: card.design.backgroundColor }}
      >
        <div className={styles.logoContainer}>
          {card.design.logoUrl ? (
            <img src={card.design.logoUrl} alt="Logo" className={styles.logo} />
          ) : (
            <div 
              className={styles.logoPlaceholder}
              style={{ backgroundColor: 'white', color: card.design.backgroundColor }}
            >
              {card.firstName.charAt(0)}{card.lastName.charAt(0)}
            </div>
          )}
        </div>
        <h1 className={styles.name} style={{ color: card.design.textColor }}>
          {card.firstName} {card.lastName}
        </h1>
        <p className={styles.title} style={{ color: card.design.textColor }}>
          {card.title}
        </p>
      </div>

      {/* Call and Email Buttons */}
      <div className={styles.actionRow}>
        <a 
          href={`tel:${card.mobile}`}
          className={styles.actionButton}
          style={{ backgroundColor: card.design.backgroundColor }}
        >
          <Phone size={20} style={{ color: card.design.textColor }} />
          <span style={{ color: card.design.textColor }}>CALL</span>
        </a>
        <a 
          href={`mailto:${card.email}`}
          className={styles.actionButton}
          style={{ backgroundColor: card.design.backgroundColor }}
        >
          <Mail size={20} style={{ color: card.design.textColor }} />
          <span style={{ color: card.design.textColor }}>EMAIL</span>
        </a>
      </div>

      {/* Contact Details */}
      <div className={styles.contactList}>
        {card.mobile && (
          <a href={`tel:${card.mobile}`} className={styles.contactItem}>
            <div className={styles.iconWrapper}>
              <Smartphone size={20} color="#999" />
            </div>
            <div className={styles.contactInfo}>
              <div className={styles.contactValue}>{card.mobile}</div>
              <div className={styles.contactLabel}>Mobile</div>
            </div>
          </a>
        )}

        {card.telephone && (
          <a href={`tel:${card.telephone}`} className={styles.contactItem}>
            <div className={styles.iconWrapper}>
              <Phone size={20} color="#999" />
            </div>
            <div className={styles.contactInfo}>
              <div className={styles.contactValue}>{card.telephone}</div>
              <div className={styles.contactLabel}>Telephone</div>
            </div>
          </a>
        )}

        {card.email && (
          <a href={`mailto:${card.email}`} className={styles.contactItem}>
            <div className={styles.iconWrapper}>
              <Mail size={20} color="#999" />
            </div>
            <div className={styles.contactInfo}>
              <div className={styles.contactValue}>{card.email}</div>
              <div className={styles.contactLabel}>Email</div>
            </div>
          </a>
        )}

        {card.company && (
          <div className={styles.contactItem}>
            <div className={styles.iconWrapper}>
              <Briefcase size={20} color="#999" />
            </div>
            <div className={styles.contactInfo}>
              <div className={styles.contactValue}>{card.company}</div>
              <div className={styles.contactLabel}>{card.title}</div>
            </div>
          </div>
        )}

        {card.website && (
          <a href={card.website} target="_blank" rel="noopener noreferrer" className={styles.contactItem}>
            <div className={styles.iconWrapper}>
              <Globe size={20} color="#999" />
            </div>
            <div className={styles.contactInfo}>
              <div className={styles.contactValue}>{card.website}</div>
              <div className={styles.contactLabel}>Website</div>
            </div>
          </a>
        )}

        {card.address && (
          <div className={styles.contactItem}>
            <div className={styles.iconWrapper}>
              <MapPin size={20} color="#999" />
            </div>
            <div className={styles.contactInfo}>
              <div className={styles.contactValue}>
                {card.address}
                {card.city && `, ${card.city}`}
                {card.state && `, ${card.state}`}
              </div>
              <div className={styles.contactLabel}>Address</div>
            </div>
          </div>
        )}
      </div>

      {/* Social Media Links */}
      {socialLinks.length > 0 && (
        <div className={styles.socialSection}>
          <div className={styles.socialGrid}>
            {socialLinks.map((social, index) => {
              const IconComponent = social.Icon
              return (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                >
                  <div className={styles.socialIconVector}>
                    <IconComponent size={24} color={social.color} />
                  </div>
                  <div className={styles.socialName}>{social.name}</div>
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* Floating Add to Contacts Button */}
      <button 
        className={styles.floatingButton}
        onClick={addToContacts}
        style={{ backgroundColor: card.design.backgroundColor }}
        title="Add to Contacts"
      >
        <UserPlus size={24} color={card.design.textColor} />
      </button>
    </div>
  )
}

export default CardLandingPage