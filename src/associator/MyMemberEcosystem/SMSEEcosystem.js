"use client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Download,
  Eye,
  X,
  DollarSign,
  Building2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  TrendingUp,
  Users,
  Award,
  Globe,
} from "lucide-react";
import * as XLSX from 'xlsx';
import styles from "./ecosystem.module.css";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";

function SMSEEcosystem() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [selectedSMSE, setSelectedSMSE] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [smseData, setSMseData] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, industries: 0, avgGrowth: 0 });

  const fetchSMSEs = async () => {
    try {
      setLoading(true);
      const profilesRef = collection(db, 'universalProfiles');
      const snapshot = await getDocs(profilesRef);
      const usersData = snapshot.docs.map((doc) => {
        const userData = doc.data();
        const entityOverview = userData.entityOverview || {};
        const contactDetails = userData.contactDetails || {};
        return {
          id: doc.id,
          username: userData.username || "N/A",
          email: contactDetails.email || userData.email || 'N/A',
          companyName: entityOverview.registeredName || entityOverview.companyName || "N/A",
          industry: entityOverview.economicSectors || entityOverview.sector || "Not specified",
          entitySize: entityOverview.entitySize || "Not specified",
          location: entityOverview.region || contactDetails.city || "South Africa",
          employees: entityOverview.employeeCount || "N/A",
          revenue: userData?.financialOverview?.annualRevenue || "N/A",
          founded: entityOverview.yearEstablished || "N/A",
          website: contactDetails.website || "N/A",
          phone: contactDetails.mobile || contactDetails.phone || "N/A",
          status: userData.status || "active",
          createdAt: userData.createdAt?.toDate() || new Date(),
          description: entityOverview.description || "No description provided",
        };
      });
      setSMseData(usersData);
      const activeCount = usersData.filter(s => s.status === 'active').length;
      const uniqueIndustries = new Set(usersData.map(s => s.industry).filter(i => i !== "Not specified"));
      setStats({ total: usersData.length, active: activeCount, industries: uniqueIndustries.size, avgGrowth: 23.5 });
    } catch (error) {
      console.error("Error fetching SMSEs:", error);
      setSMseData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSMSEs(); }, []);

  const filteredSMSEs = smseData.filter((smse) => {
    const matchesSearch =
      smse.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      smse.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      smse.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = industryFilter === "all" || smse.industry === industryFilter;
    const matchesSize = sizeFilter === "all" || smse.entitySize === sizeFilter;
    return matchesSearch && matchesIndustry && matchesSize;
  });

  const totalPages = Math.ceil(filteredSMSEs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSMSEs = filteredSMSEs.slice(startIndex, startIndex + itemsPerPage);

  const exportToExcel = () => {
    const dataToExport = filteredSMSEs.map(smse => ({
      "Company Name": smse.companyName, "Email": smse.email, "Industry": smse.industry,
      "Entity Size": smse.entitySize, "Location": smse.location, "Employees": smse.employees,
      "Revenue": smse.revenue, "Status": smse.status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SMSEs");
    XLSX.writeFile(workbook, `SMSEs_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getStatusBadge = (status) => {
    const statusStyles = { active: styles.statusActive, pending: styles.statusPending, blocked: styles.statusBlocked };
    return <span className={`${styles.statusBadge} ${statusStyles[status] || ""}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  if (loading) {
    return <div className={styles.loading}><div className={styles.loadingSpinner}></div><p>Loading SMSEs...</p></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>SMSEs in Ecosystem</h1>
          <p className={styles.subtitle}>Browse and connect with Small and Medium Enterprises</p>
        </div>
        <button className={styles.exportButton} onClick={exportToExcel}><Download size={16} />Export to Excel</button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}><Building2 size={24} className={styles.statIcon} /><div className={styles.statInfo}><h3>{stats.total}</h3><p>Total SMSEs</p></div></div>
        <div className={styles.statCard}><CheckCircle size={24} className={styles.statIcon} /><div className={styles.statInfo}><h3>{stats.active}</h3><p>Active Members</p></div></div>
        <div className={styles.statCard}><TrendingUp size={24} className={styles.statIcon} /><div className={styles.statInfo}><h3>{stats.industries}</h3><p>Industries</p></div></div>
        <div className={styles.statCard}><Award size={24} className={styles.statIcon} /><div className={styles.statInfo}><h3>{stats.avgGrowth}%</h3><p>Avg. Growth Rate</p></div></div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input type="text" placeholder="Search by company name, username, or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={styles.searchInput} />
        </div>
        <div className={styles.filters}>
          <select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)} className={styles.filterSelect}>
            <option value="all">All Industries</option>
            <option value="Technology">Technology</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Retail">Retail</option>
            <option value="Services">Services</option>
          </select>
          <select value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)} className={styles.filterSelect}>
            <option value="all">All Sizes</option>
            <option value="Micro">Micro (1-10)</option>
            <option value="Small">Small (11-50)</option>
            <option value="Medium">Medium (51-200)</option>
          </select>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead><tr><th>Company</th><th>Industry</th><th>Size</th><th>Location</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody>
            {currentSMSEs.map((smse) => (
              <tr key={smse.id}>
                <td><div className={styles.companyCell}><div className={styles.companyAvatar}>{smse.companyName.charAt(0).toUpperCase()}</div><div><div className={styles.companyName}>{smse.companyName}</div><div className={styles.companyEmail}>{smse.email}</div></div></div></td>
                <td>{smse.industry}</td><td>{smse.entitySize}</td><td>{smse.location}</td>
                <td>{getStatusBadge(smse.status)}</td><td>{formatDate(smse.createdAt)}</td>
                <td><button className={styles.viewBtn} onClick={() => { setSelectedSMSE(smse); setShowViewModal(true); }}><Eye size={16} /> View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className={styles.paginationBtn}><ChevronLeft size={16} /> Previous</button>
          <span className={styles.pageNumber}>Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className={styles.paginationBtn}>Next <ChevronRight size={16} /></button>
        </div>
      )}

      {showViewModal && selectedSMSE && (
        <div className={styles.modalOverlay} onClick={() => setShowViewModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}><h2>{selectedSMSE.companyName}</h2><p>{selectedSMSE.username}</p></div>
              <button className={styles.closeButton} onClick={() => setShowViewModal(false)}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailSection}>
                <h3>Company Information</h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}><Building2 size={16} /><span>Industry:</span><strong>{selectedSMSE.industry}</strong></div>
                  <div className={styles.detailItem}><Users size={16} /><span>Employees:</span><strong>{selectedSMSE.employees}</strong></div>
                  <div className={styles.detailItem}><DollarSign size={16} /><span>Revenue:</span><strong>{selectedSMSE.revenue}</strong></div>
                  <div className={styles.detailItem}><MapPin size={16} /><span>Location:</span><strong>{selectedSMSE.location}</strong></div>
                  <div className={styles.detailItem}><Calendar size={16} /><span>Founded:</span><strong>{selectedSMSE.founded}</strong></div>
                  <div className={styles.detailItem}><Globe size={16} /><span>Website:</span><a href={selectedSMSE.website} target="_blank" rel="noopener noreferrer">{selectedSMSE.website}</a></div>
                </div>
              </div>
              <div className={styles.detailSection}>
                <h3>Contact Information</h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}><Mail size={16} /><span>Email:</span><strong>{selectedSMSE.email}</strong></div>
                  <div className={styles.detailItem}><Phone size={16} /><span>Phone:</span><strong>{selectedSMSE.phone}</strong></div>
                </div>
              </div>
              <div className={styles.detailSection}><h3>Description</h3><p className={styles.description}>{selectedSMSE.description}</p></div>
              <div className={styles.modalActions}>
                <button className={styles.connectBtn}>Connect with SMSE</button>
                <button className={styles.messageBtn}>Send Message</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SMSEEcosystem;