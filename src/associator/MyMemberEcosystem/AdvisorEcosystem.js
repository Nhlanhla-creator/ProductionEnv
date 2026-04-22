"use client";
import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Eye,
  X,
  User,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Users,
  Award,
  Star,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import styles from "./ecosystem.module.css";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import * as XLSX from 'xlsx';

function AdvisorEcosystem() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expertiseFilter, setExpertiseFilter] = useState("all");
  const [selectedAdvisor, setSelectedAdvisor] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [advisorData, setAdvisorData] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expertiseAreas: 0,
    avgRating: 0
  });

  const fetchAdvisors = async () => {
    try {
      setLoading(true);
      const profilesRef = collection(db, 'advisorProfiles');
      const snapshot = await getDocs(profilesRef);
      
      const usersData = snapshot.docs.map((doc) => {
        const userData = doc.data();
        const personalInfo = userData.personalProfessionalOverview || {};
        const contactDetails = userData.contactDetails || {};
        const credentials = userData.professionalCredentials || {};
        
        return {
          id: doc.id,
          username: userData.username || "N/A",
          email: contactDetails.email || userData.email || 'N/A',
          fullName: personalInfo.fullName || "N/A",
          title: personalInfo.title || "Business Advisor",
          expertise: credentials.expertiseAreas || [],
          industries: credentials.industries || [],
          experience: credentials.yearsExperience || "N/A",
          location: personalInfo.location || contactDetails.city || "South Africa",
          phone: contactDetails.mobile || contactDetails.phone || "N/A",
          bio: personalInfo.bio || "No bio provided",
          status: userData.status || "active",
          createdAt: userData.createdAt?.toDate() || new Date(),
          rating: credentials.rating || 4.5,
          reviews: credentials.reviews || 0,
        };
      });
      
      setAdvisorData(usersData);
      
      const allExpertise = new Set();
      usersData.forEach(a => a.expertise.forEach(e => allExpertise.add(e)));
      
      setStats({
        total: usersData.length,
        active: usersData.filter(a => a.status === 'active').length,
        expertiseAreas: allExpertise.size,
        avgRating: usersData.reduce((sum, a) => sum + a.rating, 0) / usersData.length || 0
      });
      
    } catch (error) {
      console.error("Error fetching advisors:", error);
      setAdvisorData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvisors();
  }, []);

  const filteredAdvisors = advisorData.filter((advisor) => {
    const matchesSearch = 
      advisor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      advisor.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesExpertise = expertiseFilter === "all" || advisor.expertise.includes(expertiseFilter);
    
    return matchesSearch && matchesExpertise;
  });

  const totalPages = Math.ceil(filteredAdvisors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAdvisors = filteredAdvisors.slice(startIndex, endIndex);

  const exportToExcel = () => {
    const dataToExport = filteredAdvisors.map(advisor => ({
      "Name": advisor.fullName,
      "Email": advisor.email,
      "Title": advisor.title,
      "Expertise": advisor.expertise.join(", "),
      "Industries": advisor.industries.join(", "),
      "Experience": advisor.experience,
      "Rating": advisor.rating,
      "Status": advisor.status,
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Advisors");
    XLSX.writeFile(workbook, `Advisors_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star key={i} size={14} className={i <= rating ? styles.starFilled : styles.starEmpty} />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading Advisors...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Advisors in Ecosystem</h1>
          <p className={styles.subtitle}>Connect with expert advisors and mentors</p>
        </div>
        <button className={styles.exportButton} onClick={exportToExcel}>
          <Download size={16} />
          Export to Excel
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <Users size={24} className={styles.statIcon} />
          <div className={styles.statInfo}>
            <h3>{stats.total}</h3>
            <p>Total Advisors</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <Award size={24} className={styles.statIcon} />
          <div className={styles.statInfo}>
            <h3>{stats.expertiseAreas}</h3>
            <p>Expertise Areas</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <Star size={24} className={styles.statIcon} />
          <div className={styles.statInfo}>
            <h3>{stats.avgRating.toFixed(1)}</h3>
            <p>Avg. Rating</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <Briefcase size={24} className={styles.statIcon} />
          <div className={styles.statInfo}>
            <h3>{stats.active}</h3>
            <p>Active Members</p>
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by name or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <select
          value={expertiseFilter}
          onChange={(e) => setExpertiseFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Expertise</option>
          <option value="Strategy">Strategy</option>
          <option value="Finance">Finance</option>
          <option value="Marketing">Marketing</option>
          <option value="Operations">Operations</option>
          <option value="Legal">Legal</option>
        </select>
      </div>

      <div className={styles.cardGrid}>
        {currentAdvisors.map((advisor) => (
          <div key={advisor.id} className={styles.advisorCard}>
            <div className={styles.cardHeader}>
              <div className={styles.advisorAvatar}>
                {advisor.fullName.charAt(0).toUpperCase()}
              </div>
              <div className={styles.advisorInfo}>
                <h3>{advisor.fullName}</h3>
                <p>{advisor.title}</p>
                <div className={styles.rating}>
                  {renderStars(Math.floor(advisor.rating))}
                  <span>({advisor.reviews})</span>
                </div>
              </div>
            </div>
            <div className={styles.cardBody}>
              <p className={styles.advisorBio}>{advisor.bio.substring(0, 100)}...</p>
              <div className={styles.expertiseTags}>
                {advisor.expertise.slice(0, 3).map((exp, i) => (
                  <span key={i} className={styles.tag}>{exp}</span>
                ))}
              </div>
            </div>
            <div className={styles.cardFooter}>
              <button
                className={styles.viewBtn}
                onClick={() => {
                  setSelectedAdvisor(advisor);
                  setShowViewModal(true);
                }}
              >
                View Profile
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className={styles.paginationBtn}>
            <ChevronLeft size={16} /> Previous
          </button>
          <span className={styles.pageNumber}>Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className={styles.paginationBtn}>
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      {showViewModal && selectedAdvisor && (
        <div className={styles.modalOverlay} onClick={() => setShowViewModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <h2>{selectedAdvisor.fullName}</h2>
                <p>{selectedAdvisor.title}</p>
              </div>
              <button className={styles.closeButton} onClick={() => setShowViewModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailSection}>
                <h3>Professional Information</h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <Briefcase size={16} />
                    <span>Years Experience:</span>
                    <strong>{selectedAdvisor.experience}</strong>
                  </div>
                  <div className={styles.detailItem}>
                    <Award size={16} />
                    <span>Expertise:</span>
                    <div className={styles.tags}>
                      {selectedAdvisor.expertise.map((exp, i) => (
                        <span key={i} className={styles.tag}>{exp}</span>
                      ))}
                    </div>
                  </div>
                  <div className={styles.detailItem}>
                    <GraduationCap size={16} />
                    <span>Industries:</span>
                    <div className={styles.tags}>
                      {selectedAdvisor.industries.map((ind, i) => (
                        <span key={i} className={styles.tag}>{ind}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3>Contact Information</h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <Mail size={16} />
                    <span>Email:</span>
                    <strong>{selectedAdvisor.email}</strong>
                  </div>
                  <div className={styles.detailItem}>
                    <Phone size={16} />
                    <span>Phone:</span>
                    <strong>{selectedAdvisor.phone}</strong>
                  </div>
                  <div className={styles.detailItem}>
                    <MapPin size={16} />
                    <span>Location:</span>
                    <strong>{selectedAdvisor.location}</strong>
                  </div>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3>Bio</h3>
                <p className={styles.description}>{selectedAdvisor.bio}</p>
              </div>

              <div className={styles.modalActions}>
                <button className={styles.connectBtn}>Connect with Advisor</button>
                <button className={styles.messageBtn}>Send Message</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdvisorEcosystem;