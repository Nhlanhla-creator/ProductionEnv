"use client";
import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Users,
  TrendingUp,
  Building2,
  Calendar,
  Target,
  Rocket,
} from "lucide-react";
import styles from "./ecosystem.module.css";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import * as XLSX from 'xlsx';

function CatalystEcosystem() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [selectedCatalyst, setSelectedCatalyst] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [catalystData, setCatalystData] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    programs: 0,
    alumniCount: 0
  });

  const fetchCatalysts = async () => {
    try {
      setLoading(true);
      const profilesRef = collection(db, 'catalystProfiles');
      const snapshot = await getDocs(profilesRef);
      
      const usersData = snapshot.docs.map((doc) => {
        const userData = doc.data();
        const entityOverview = userData.entityOverview || {};
        const contactDetails = userData.contactDetails || {};
        const programDetails = userData.programmeDetails || {};
        
        return {
          id: doc.id,
          username: userData.username || "N/A",
          email: contactDetails.email || userData.email || 'N/A',
          organizationName: entityOverview.organizationName || entityOverview.registeredName || "N/A",
          programType: programDetails.programType || "Accelerator",
          focusAreas: programDetails.focusAreas || [],
          duration: programDetails.duration || "N/A",
          cohortSize: programDetails.cohortSize || "N/A",
          location: entityOverview.region || contactDetails.city || "South Africa",
          phone: contactDetails.mobile || contactDetails.phone || "N/A",
          website: contactDetails.website || "N/A",
          description: entityOverview.description || "No description provided",
          status: userData.status || "active",
          createdAt: userData.createdAt?.toDate() || new Date(),
          alumniCount: programDetails.alumniCount || 0,
          successRate: programDetails.successRate || "N/A",
        };
      });
      
      setCatalystData(usersData);
      
      setStats({
        total: usersData.length,
        active: usersData.filter(c => c.status === 'active').length,
        programs: new Set(usersData.map(c => c.programType)).size,
        alumniCount: usersData.reduce((sum, c) => sum + (c.alumniCount || 0), 0)
      });
      
    } catch (error) {
      console.error("Error fetching catalysts:", error);
      setCatalystData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalysts();
  }, []);

  const filteredCatalysts = catalystData.filter((catalyst) => {
    const matchesSearch = 
      catalyst.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      catalyst.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProgram = programFilter === "all" || catalyst.programType === programFilter;
    
    return matchesSearch && matchesProgram;
  });

  const totalPages = Math.ceil(filteredCatalysts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCatalysts = filteredCatalysts.slice(startIndex, endIndex);

  const exportToExcel = () => {
    const dataToExport = filteredCatalysts.map(catalyst => ({
      "Organization": catalyst.organizationName,
      "Email": catalyst.email,
      "Program Type": catalyst.programType,
      "Focus Areas": catalyst.focusAreas.join(", "),
      "Duration": catalyst.duration,
      "Location": catalyst.location,
      "Alumni Count": catalyst.alumniCount,
      "Status": catalyst.status,
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Catalysts");
    XLSX.writeFile(workbook, `Catalysts_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading Catalysts...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Catalysts in Ecosystem</h1>
          <p className={styles.subtitle}>Discover accelerators, incubators, and support programs</p>
        </div>
        <button className={styles.exportButton} onClick={exportToExcel}>
          <Download size={16} />
          Export to Excel
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <Building2 size={24} className={styles.statIcon} />
          <div className={styles.statInfo}>
            <h3>{stats.total}</h3>
            <p>Total Catalysts</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <Rocket size={24} className={styles.statIcon} />
          <div className={styles.statInfo}>
            <h3>{stats.programs}</h3>
            <p>Program Types</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <Users size={24} className={styles.statIcon} />
          <div className={styles.statInfo}>
            <h3>{stats.alumniCount}</h3>
            <p>Alumni Companies</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <TrendingUp size={24} className={styles.statIcon} />
          <div className={styles.statInfo}>
            <h3>{stats.active}</h3>
            <p>Active Programs</p>
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by organization name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <select
          value={programFilter}
          onChange={(e) => setProgramFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Programs</option>
          <option value="Accelerator">Accelerator</option>
          <option value="Incubator">Incubator</option>
          <option value="Hub">Innovation Hub</option>
          <option value="Program">Support Program</option>
        </select>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Organization</th>
              <th>Program Type</th>
              <th>Focus Areas</th>
              <th>Duration</th>
              <th>Location</th>
              <th>Alumni</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentCatalysts.map((catalyst) => (
              <tr key={catalyst.id}>
                <td>
                  <div className={styles.companyCell}>
                    <div className={styles.companyAvatar}>
                      {catalyst.organizationName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className={styles.companyName}>{catalyst.organizationName}</div>
                      <div className={styles.companyEmail}>{catalyst.email}</div>
                    </div>
                  </div>
                </td>
                <td>{catalyst.programType}</td>
                <td>
                  <div className={styles.tags}>
                    {catalyst.focusAreas.slice(0, 2).map((area, i) => (
                      <span key={i} className={styles.tag}>{area}</span>
                    ))}
                  </div>
                </td>
                <td>{catalyst.duration}</td>
                <td>{catalyst.location}</td>
                <td>{catalyst.alumniCount}</td>
                <td>
                  <button
                    className={styles.viewBtn}
                    onClick={() => {
                      setSelectedCatalyst(catalyst);
                      setShowViewModal(true);
                    }}
                  >
                    <Eye size={16} />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

      {showViewModal && selectedCatalyst && (
        <div className={styles.modalOverlay} onClick={() => setShowViewModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <h2>{selectedCatalyst.organizationName}</h2>
                <p>{selectedCatalyst.programType} Program</p>
              </div>
              <button className={styles.closeButton} onClick={() => setShowViewModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailSection}>
                <h3>Program Information</h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <Target size={16} />
                    <span>Focus Areas:</span>
                    <div className={styles.tags}>
                      {selectedCatalyst.focusAreas.map((area, i) => (
                        <span key={i} className={styles.tag}>{area}</span>
                      ))}
                    </div>
                  </div>
                  <div className={styles.detailItem}>
                    <Calendar size={16} />
                    <span>Duration:</span>
                    <strong>{selectedCatalyst.duration}</strong>
                  </div>
                  <div className={styles.detailItem}>
                    <Users size={16} />
                    <span>Cohort Size:</span>
                    <strong>{selectedCatalyst.cohortSize}</strong>
                  </div>
                  <div className={styles.detailItem}>
                    <TrendingUp size={16} />
                    <span>Success Rate:</span>
                    <strong>{selectedCatalyst.successRate}</strong>
                  </div>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3>Contact Information</h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <Mail size={16} />
                    <span>Email:</span>
                    <strong>{selectedCatalyst.email}</strong>
                  </div>
                  <div className={styles.detailItem}>
                    <Phone size={16} />
                    <span>Phone:</span>
                    <strong>{selectedCatalyst.phone}</strong>
                  </div>
                  <div className={styles.detailItem}>
                    <MapPin size={16} />
                    <span>Location:</span>
                    <strong>{selectedCatalyst.location}</strong>
                  </div>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3>Description</h3>
                <p className={styles.description}>{selectedCatalyst.description}</p>
              </div>

              <div className={styles.modalActions}>
                <button className={styles.connectBtn}>Connect with Catalyst</button>
                <button className={styles.messageBtn}>Send Message</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CatalystEcosystem;