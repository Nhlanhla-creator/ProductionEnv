"use client";
import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Eye,
  X,
  User,
  DollarSign,
  Building2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  Users,
  Award,
  Globe,
  PieChart,
  Target,
} from "lucide-react";
import styles from "./ecosystem.module.css";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import * as XLSX from 'xlsx';

function InvestorEcosystem() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [investorData, setInvestorData] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalCapital: 0,
    avgInvestment: 0
  });

  const fetchInvestors = async () => {
    try {
      setLoading(true);
      const profilesRef = collection(db, 'MyuniversalProfiles');
      const snapshot = await getDocs(profilesRef);
      
      const usersData = snapshot.docs.map((doc) => {
        const userData = doc.data();
        const entityOverview = userData.entityOverview || {};
        const contactDetails = userData.contactDetails || {};
        const investmentPrefs = userData.generalInvestmentPreference || {};
        
        return {
          id: doc.id,
          username: userData.username || "N/A",
          email: contactDetails.email || userData.email || 'N/A',
          fundName: entityOverview.fundName || entityOverview.registeredName || "N/A",
          type: entityOverview.fundType || "Investment Fund",
          focusAreas: investmentPrefs.focusAreas || [],
          ticketSize: investmentPrefs.ticketSize || "Not specified",
          stagePreference: investmentPrefs.stagePreference || "All stages",
          location: entityOverview.region || contactDetails.city || "South Africa",
          phone: contactDetails.mobile || contactDetails.phone || "N/A",
          website: contactDetails.website || "N/A",
          status: userData.status || "active",
          createdAt: userData.createdAt?.toDate() || new Date(),
          description: entityOverview.description || "No description provided",
          portfolioCount: investmentPrefs.portfolioCount || 0,
          totalInvested: investmentPrefs.totalInvested || "N/A",
        };
      });
      
      setInvestorData(usersData);
      
      setStats({
        total: usersData.length,
        active: usersData.filter(i => i.status === 'active').length,
        totalCapital: 500000000,
        avgInvestment: 25000000
      });
      
    } catch (error) {
      console.error("Error fetching investors:", error);
      setInvestorData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestors();
  }, []);

  const filteredInvestors = investorData.filter((investor) => {
    const matchesSearch = 
      investor.fundName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || investor.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredInvestors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInvestors = filteredInvestors.slice(startIndex, endIndex);

  const exportToExcel = () => {
    const dataToExport = filteredInvestors.map(investor => ({
      "Fund Name": investor.fundName,
      "Email": investor.email,
      "Type": investor.type,
      "Focus Areas": investor.focusAreas.join(", "),
      "Ticket Size": investor.ticketSize,
      "Location": investor.location,
      "Portfolio Count": investor.portfolioCount,
      "Status": investor.status,
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Investors");
    XLSX.writeFile(workbook, `Investors_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getStatusBadge = (status) => {
    return (
      <span className={`${styles.statusBadge} ${status === 'active' ? styles.statusActive : styles.statusPending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatCurrency = (value) => {
    if (value === "N/A") return value;
    return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 0 }).format(value);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading Investors...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Investors in Ecosystem</h1>
          <p className={styles.subtitle}>Discover funding partners and investment firms</p>
        </div>
        <button className={styles.exportButton} onClick={exportToExcel}>
          <Download size={16} />
          Export to Excel
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <TrendingUp size={24} className={styles.statIcon} />
          <div className={styles.statInfo}>
            <h3>{stats.total}</h3>
            <p>Total Investors</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <DollarSign size={24} className={styles.statIcon} />
          <div className={styles.statInfo}>
            <h3>{formatCurrency(stats.totalCapital)}</h3>
            <p>Total Capital Available</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <PieChart size={24} className={styles.statIcon} />
          <div className={styles.statInfo}>
            <h3>{formatCurrency(stats.avgInvestment)}</h3>
            <p>Avg. Investment Size</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <Users size={24} className={styles.statIcon} />
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
            placeholder="Search by fund name or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Types</option>
          <option value="Venture Capital">Venture Capital</option>
          <option value="Private Equity">Private Equity</option>
          <option value="Angel Investor">Angel Investor</option>
          <option value="Family Office">Family Office</option>
        </select>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Investor/Fund</th>
              <th>Type</th>
              <th>Focus Areas</th>
              <th>Ticket Size</th>
              <th>Location</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentInvestors.map((investor) => (
              <tr key={investor.id}>
                <td>
                  <div className={styles.companyCell}>
                    <div className={styles.companyAvatar}>
                      {investor.fundName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className={styles.companyName}>{investor.fundName}</div>
                      <div className={styles.companyEmail}>{investor.email}</div>
                    </div>
                  </div>
                </td>
                <td>{investor.type}</td>
                <td>
                  <div className={styles.tags}>
                    {investor.focusAreas.slice(0, 2).map((area, i) => (
                      <span key={i} className={styles.tag}>{area}</span>
                    ))}
                    {investor.focusAreas.length > 2 && <span className={styles.tag}>+{investor.focusAreas.length - 2}</span>}
                  </div>
                </td>
                <td>{investor.ticketSize}</td>
                <td>{investor.location}</td>
                <td>{getStatusBadge(investor.status)}</td>
                <td>
                  <button
                    className={styles.viewBtn}
                    onClick={() => {
                      setSelectedInvestor(investor);
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

      {showViewModal && selectedInvestor && (
        <div className={styles.modalOverlay} onClick={() => setShowViewModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <h2>{selectedInvestor.fundName}</h2>
                <p>{selectedInvestor.username}</p>
              </div>
              <button className={styles.closeButton} onClick={() => setShowViewModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailSection}>
                <h3>Investment Profile</h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <Target size={16} />
                    <span>Focus Areas:</span>
                    <div className={styles.tags}>
                      {selectedInvestor.focusAreas.map((area, i) => (
                        <span key={i} className={styles.tag}>{area}</span>
                      ))}
                    </div>
                  </div>
                  <div className={styles.detailItem}>
                    <DollarSign size={16} />
                    <span>Ticket Size:</span>
                    <strong>{selectedInvestor.ticketSize}</strong>
                  </div>
                  <div className={styles.detailItem}>
                    <TrendingUp size={16} />
                    <span>Stage Preference:</span>
                    <strong>{selectedInvestor.stagePreference}</strong>
                  </div>
                  <div className={styles.detailItem}>
                    <Building2 size={16} />
                    <span>Portfolio Companies:</span>
                    <strong>{selectedInvestor.portfolioCount}</strong>
                  </div>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3>Contact Information</h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <Mail size={16} />
                    <span>Email:</span>
                    <strong>{selectedInvestor.email}</strong>
                  </div>
                  <div className={styles.detailItem}>
                    <Phone size={16} />
                    <span>Phone:</span>
                    <strong>{selectedInvestor.phone}</strong>
                  </div>
                  <div className={styles.detailItem}>
                    <MapPin size={16} />
                    <span>Location:</span>
                    <strong>{selectedInvestor.location}</strong>
                  </div>
                  <div className={styles.detailItem}>
                    <Globe size={16} />
                    <span>Website:</span>
                    <a href={selectedInvestor.website} target="_blank" rel="noopener noreferrer">{selectedInvestor.website}</a>
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button className={styles.connectBtn}>Connect with Investor</button>
                <button className={styles.messageBtn}>Send Message</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvestorEcosystem;