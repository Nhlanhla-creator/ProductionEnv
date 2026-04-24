"use client";
import { useState } from "react";
import {
  Search,
  Download,
  Eye,
  X,
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
import * as XLSX from 'xlsx';

// ---------- MOCK DATA ----------
const mockAdvisors = [
  {
    id: "1",
    username: "strategic_partners",
    email: "contact@strategicpartners.co.za",
    fullName: "Dr. Sarah Johnson",
    title: "Strategic Business Advisor",
    expertise: ["Strategy", "Growth Planning", "Business Modeling"],
    industries: ["Technology", "Finance", "Retail"],
    experience: "15+ years",
    location: "Cape Town",
    phone: "+27 21 123 4567",
    bio: "Strategic business advisor with over 15 years of experience helping SMEs scale their operations and achieve sustainable growth.",
    status: "active",
    createdAt: new Date("2023-06-15"),
    rating: 4.8,
    reviews: 127,
  },
  {
    id: "2",
    username: "finance_guru",
    email: "info@financeguru.co.za",
    fullName: "Michael Chen",
    title: "Financial Advisor",
    expertise: ["Finance", "Investment", "Financial Planning"],
    industries: ["Finance", "Real Estate", "Manufacturing"],
    experience: "12+ years",
    location: "Johannesburg",
    phone: "+27 11 987 6543",
    bio: "Specializing in financial strategy, investment planning, and capital raising for growing businesses.",
    status: "active",
    createdAt: new Date("2023-08-22"),
    rating: 4.6,
    reviews: 89,
  },
  {
    id: "3",
    username: "marketing_pro",
    email: "hello@marketingpro.co.za",
    fullName: "Thabo Nkosi",
    title: "Marketing Strategist",
    expertise: ["Marketing", "Digital Strategy", "Brand Building"],
    industries: ["Retail", "E-commerce", "Services"],
    experience: "10+ years",
    location: "Durban",
    phone: "+27 31 456 7890",
    bio: "Digital marketing expert helping businesses build strong brands and acquire customers online.",
    status: "pending",
    createdAt: new Date("2024-01-10"),
    rating: 4.5,
    reviews: 56,
  },
  {
    id: "4",
    username: "legal_eagle",
    email: "info@legaleagle.co.za",
    fullName: "Priya Patel",
    title: "Legal Advisor",
    expertise: ["Legal", "Compliance", "Contract Law"],
    industries: ["Legal", "Technology", "Healthcare"],
    experience: "8+ years",
    location: "Pretoria",
    phone: "+27 12 345 6789",
    bio: "Corporate lawyer specializing in startup legal frameworks, intellectual property, and compliance.",
    status: "active",
    createdAt: new Date("2023-11-05"),
    rating: 4.9,
    reviews: 203,
  },
  {
    id: "5",
    username: "ops_expert",
    email: "contact@opsexpert.co.za",
    fullName: "James Wilson",
    title: "Operations Advisor",
    expertise: ["Operations", "Supply Chain", "Process Improvement"],
    industries: ["Manufacturing", "Logistics", "Retail"],
    experience: "18+ years",
    location: "Port Elizabeth",
    phone: "+27 41 123 4567",
    bio: "Operations expert focused on efficiency, cost reduction, and supply chain optimization.",
    status: "active",
    createdAt: new Date("2023-09-18"),
    rating: 4.7,
    reviews: 142,
  },
];

function AdvisorEcosystem() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expertiseFilter, setExpertiseFilter] = useState("all");
  const [selectedAdvisor, setSelectedAdvisor] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [advisorData] = useState(mockAdvisors);

  const allExpertise = [...new Set(mockAdvisors.flatMap(a => a.expertise))];
  const stats = {
    total: advisorData.length,
    active: advisorData.filter(a => a.status === 'active').length,
    expertiseAreas: allExpertise.length,
    avgRating: advisorData.reduce((sum, a) => sum + a.rating, 0) / advisorData.length || 0
  };

  const filteredAdvisors = advisorData.filter((advisor) => {
    const matchesSearch = 
      advisor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      advisor.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      advisor.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExpertise = expertiseFilter === "all" || advisor.expertise.includes(expertiseFilter);
    return matchesSearch && matchesExpertise;
  });

  const totalPages = Math.ceil(filteredAdvisors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAdvisors = filteredAdvisors.slice(startIndex, startIndex + itemsPerPage);

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

  const getStatusBadge = (status) => {
    const statusStyles = {
      active: { background: '#e8f5e8', color: '#2e7d32' },
      pending: { background: '#fff3e0', color: '#ed6c02' },
    };
    const style = statusStyles[status] || statusStyles.active;
    return (
      <span className={`${styles.statusBadge} ${status === 'active' ? styles.statusActive : styles.statusPending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star key={i} size={14} fill={i <= Math.floor(rating) ? "#f5b042" : "none"} stroke="#f5b042" />
      );
    }
    return <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>{stars}</div>;
  };

  const styles = {
    container: { padding: '24px', background: '#f5f7fa', minHeight: '100vh' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    headerContent: { flex: 1 },
    title: { fontSize: '24px', fontWeight: '600', color: '#4a352f', margin: '0 0 8px 0' },
    subtitle: { color: '#7d5a50', margin: 0 },
    exportButton: { background: '#a67c52', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' },
    statCard: { background: 'white', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    statIcon: { color: '#a67c52' },
    statInfo: { flex: 1 },
    controls: { display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' },
    searchContainer: { flex: 1, position: 'relative' },
    searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#7d5a50' },
    searchInput: { width: '100%', padding: '10px 12px 10px 40px', border: '1px solid #e0d5c8', borderRadius: '8px', fontSize: '14px', outline: 'none' },
    filterSelect: { padding: '10px 12px', border: '1px solid #e0d5c8', borderRadius: '8px', fontSize: '14px', background: 'white', cursor: 'pointer' },
    tableContainer: { background: 'white', borderRadius: '12px', overflow: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    companyCell: { display: 'flex', alignItems: 'center', gap: '12px' },
    companyAvatar: { width: '40px', height: '40px', background: 'linear-gradient(135deg, #a67c52, #7d5a50)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' },
    companyName: { fontWeight: '600', color: '#4a352f' },
    companyEmail: { fontSize: '12px', color: '#7d5a50' },
    tags: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
    tag: { background: '#faf7f2', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', color: '#7d5a50' },
    viewBtn: { background: 'none', border: 'none', color: '#a67c52', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 12px', borderRadius: '6px' },
    pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' },
    paginationBtn: { background: 'white', border: '1px solid #e0d5c8', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' },
    pageNumber: { color: '#7d5a50', fontSize: '14px' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { background: 'white', borderRadius: '12px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px', borderBottom: '1px solid #f0e6d9' },
    modalTitle: { flex: 1 },
    closeButton: { background: 'none', border: 'none', cursor: 'pointer', color: '#7d5a50' },
    modalBody: { padding: '20px' },
    detailSection: { marginBottom: '24px' },
    detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '12px' },
    detailItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', flexWrap: 'wrap' },
    statusBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', display: 'inline-block' },
    statusActive: { background: '#e8f5e8', color: '#2e7d32' },
    statusPending: { background: '#fff3e0', color: '#ed6c02' },
    description: { marginTop: '12px', lineHeight: '1.6', color: '#4a352f' },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Advisors in Ecosystem</h1>
          <p style={styles.subtitle}>Browse expert advisors and mentors</p>
        </div>
        <button style={styles.exportButton} onClick={exportToExcel}>
          <Download size={16} /> Export to Excel
        </button>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <Users size={24} style={styles.statIcon} />
          <div style={styles.statInfo}>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#4a352f' }}>{stats.total}</h3>
            <p style={{ margin: 0, color: '#7d5a50' }}>Total Advisors</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <Award size={24} style={styles.statIcon} />
          <div style={styles.statInfo}>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#4a352f' }}>{stats.expertiseAreas}</h3>
            <p style={{ margin: 0, color: '#7d5a50' }}>Expertise Areas</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <Star size={24} style={styles.statIcon} />
          <div style={styles.statInfo}>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#4a352f' }}>{stats.avgRating.toFixed(1)}</h3>
            <p style={{ margin: 0, color: '#7d5a50' }}>Avg. Rating</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <Briefcase size={24} style={styles.statIcon} />
          <div style={styles.statInfo}>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#4a352f' }}>{stats.active}</h3>
            <p style={{ margin: 0, color: '#7d5a50' }}>Active Members</p>
          </div>
        </div>
      </div>

      <div style={styles.controls}>
        <div style={styles.searchContainer}>
          <Search size={20} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by name, username, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <select
          value={expertiseFilter}
          onChange={(e) => setExpertiseFilter(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Expertise</option>
          {allExpertise.map(exp => <option key={exp} value={exp}>{exp}</option>)}
        </select>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f0e6d9', background: '#faf7f2' }}>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f', fontWeight: '600' }}>Advisor</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f', fontWeight: '600' }}>Title</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f', fontWeight: '600' }}>Expertise</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f', fontWeight: '600' }}>Experience</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f', fontWeight: '600' }}>Location</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f', fontWeight: '600' }}>Rating</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f', fontWeight: '600' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentAdvisors.map((advisor) => (
              <tr key={advisor.id} style={{ borderBottom: '1px solid #f0e6d9' }}>
                <td style={{ padding: '16px' }}>
                  <div style={styles.companyCell}>
                    <div style={styles.companyAvatar}>
                      {advisor.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={styles.companyName}>{advisor.fullName}</div>
                      <div style={styles.companyEmail}>{advisor.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px', color: '#4a352f' }}>{advisor.title}</td>
                <td style={{ padding: '16px' }}>
                  <div style={styles.tags}>
                    {advisor.expertise.slice(0, 2).map((exp, i) => (
                      <span key={i} style={styles.tag}>{exp}</span>
                    ))}
                    {advisor.expertise.length > 2 && (
                      <span style={styles.tag}>+{advisor.expertise.length - 2}</span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '16px', color: '#4a352f' }}>{advisor.experience}</td>
                <td style={{ padding: '16px', color: '#4a352f' }}>{advisor.location}</td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {renderStars(advisor.rating)}
                    <span style={{ fontSize: '12px', color: '#7d5a50' }}>({advisor.reviews})</span>
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <span className={`${styles.statusBadge} ${advisor.status === 'active' ? styles.statusActive : styles.statusPending}`}>
                    {advisor.status.charAt(0).toUpperCase() + advisor.status.slice(1)}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <button
                    style={styles.viewBtn}
                    onClick={() => {
                      setSelectedAdvisor(advisor);
                      setShowViewModal(true);
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#faf7f2'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <Eye size={16} /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{ ...styles.paginationBtn, opacity: currentPage === 1 ? 0.5 : 1 }}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span style={styles.pageNumber}>Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={{ ...styles.paginationBtn, opacity: currentPage === totalPages ? 0.5 : 1 }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      {showViewModal && selectedAdvisor && (
        <div style={styles.modalOverlay} onClick={() => setShowViewModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>
                <h2 style={{ margin: 0, color: '#4a352f' }}>{selectedAdvisor.fullName}</h2>
                <p style={{ margin: '4px 0 0', color: '#7d5a50' }}>{selectedAdvisor.title}</p>
              </div>
              <button style={styles.closeButton} onClick={() => setShowViewModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.detailSection}>
                <h3 style={{ margin: '0 0 12px', fontSize: '16px', color: '#4a352f' }}>Professional Information</h3>
                <div style={styles.detailGrid}>
                  <div style={styles.detailItem}>
                    <Briefcase size={16} color="#a67c52" />
                    <span style={{ color: '#7d5a50' }}>Experience:</span>
                    <strong style={{ color: '#4a352f' }}>{selectedAdvisor.experience}</strong>
                  </div>
                  <div style={styles.detailItem}>
                    <Award size={16} color="#a67c52" />
                    <span style={{ color: '#7d5a50' }}>Expertise:</span>
                    <div style={styles.tags}>
                      {selectedAdvisor.expertise.map((exp, i) => (
                        <span key={i} style={styles.tag}>{exp}</span>
                      ))}
                    </div>
                  </div>
                  <div style={styles.detailItem}>
                    <GraduationCap size={16} color="#a67c52" />
                    <span style={{ color: '#7d5a50' }}>Industries:</span>
                    <div style={styles.tags}>
                      {selectedAdvisor.industries.map((ind, i) => (
                        <span key={i} style={styles.tag}>{ind}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div style={styles.detailSection}>
                <h3 style={{ margin: '0 0 12px', fontSize: '16px', color: '#4a352f' }}>Contact Information</h3>
                <div style={styles.detailGrid}>
                  <div style={styles.detailItem}>
                    <Mail size={16} color="#a67c52" />
                    <span style={{ color: '#7d5a50' }}>Email:</span>
                    <strong style={{ color: '#4a352f' }}>{selectedAdvisor.email}</strong>
                  </div>
                  <div style={styles.detailItem}>
                    <Phone size={16} color="#a67c52" />
                    <span style={{ color: '#7d5a50' }}>Phone:</span>
                    <strong style={{ color: '#4a352f' }}>{selectedAdvisor.phone}</strong>
                  </div>
                  <div style={styles.detailItem}>
                    <MapPin size={16} color="#a67c52" />
                    <span style={{ color: '#7d5a50' }}>Location:</span>
                    <strong style={{ color: '#4a352f' }}>{selectedAdvisor.location}</strong>
                  </div>
                </div>
              </div>
              <div style={styles.detailSection}>
                <h3 style={{ margin: '0 0 12px', fontSize: '16px', color: '#4a352f' }}>Bio</h3>
                <p style={styles.description}>{selectedAdvisor.bio}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdvisorEcosystem;