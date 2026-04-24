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
  TrendingUp,
  Building2,
  Calendar,
  Target,
  Rocket,
} from "lucide-react";
import * as XLSX from 'xlsx';

// ---------- MOCK DATA ----------
const mockCatalysts = [
  {
    id: "1",
    username: "tech_innovators",
    email: "info@techinnovators.co.za",
    organizationName: "Tech Innovators Hub",
    programType: "Accelerator",
    focusAreas: ["AI", "Fintech", "SaaS"],
    duration: "12 weeks",
    cohortSize: "15-20 companies",
    location: "Cape Town",
    phone: "+27 21 123 4567",
    website: "https://techinnovators.co.za",
    description: "Leading technology accelerator focused on AI and fintech startups across Africa.",
    status: "active",
    createdAt: new Date("2023-06-15"),
    alumniCount: 87,
    successRate: "85%",
  },
  {
    id: "2",
    username: "green_future",
    email: "hello@greenfuture.co.za",
    organizationName: "Green Future Incubator",
    programType: "Incubator",
    focusAreas: ["CleanTech", "Renewable Energy", "Sustainability"],
    duration: "6 months",
    cohortSize: "10-12 companies",
    location: "Johannesburg",
    phone: "+27 11 987 6543",
    website: "https://greenfuture.co.za",
    description: "Incubator supporting cleantech and sustainable energy startups.",
    status: "active",
    createdAt: new Date("2023-08-22"),
    alumniCount: 45,
    successRate: "78%",
  },
  {
    id: "3",
    username: "retail_lab",
    email: "info@retaillab.co.za",
    organizationName: "Retail Innovation Lab",
    programType: "Hub",
    focusAreas: ["Retail Tech", "E-commerce", "Logistics"],
    duration: "Ongoing",
    cohortSize: "25+ members",
    location: "Durban",
    phone: "+27 31 456 7890",
    website: "https://retaillab.co.za",
    description: "Innovation hub connecting retail startups with industry partners.",
    status: "pending",
    createdAt: new Date("2024-01-10"),
    alumniCount: 32,
    successRate: "N/A",
  },
  {
    id: "4",
    username: "health_hub",
    email: "contact@healthhub.co.za",
    organizationName: "HealthTech Hub",
    programType: "Accelerator",
    focusAreas: ["HealthTech", "MedTech", "Wellness"],
    duration: "10 weeks",
    cohortSize: "12-15 companies",
    location: "Pretoria",
    phone: "+27 12 345 6789",
    website: "https://healthhub.co.za",
    description: "Accelerator program for health technology and medical innovation startups.",
    status: "active",
    createdAt: new Date("2023-11-05"),
    alumniCount: 54,
    successRate: "82%",
  },
  {
    id: "5",
    username: "agri_growth",
    email: "info@agrigrowth.co.za",
    organizationName: "AgriGrowth Programme",
    programType: "Program",
    focusAreas: ["AgriTech", "Farming", "Food Security"],
    duration: "8 weeks",
    cohortSize: "20 companies",
    location: "Stellenbosch",
    phone: "+27 21 876 5432",
    website: "https://agrigrowth.co.za",
    description: "Support program for agricultural technology and farming innovation.",
    status: "active",
    createdAt: new Date("2023-09-18"),
    alumniCount: 68,
    successRate: "75%",
  },
];

function CatalystEcosystem() {
  const [searchTerm, setSearchTerm] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [selectedCatalyst, setSelectedCatalyst] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [catalystData] = useState(mockCatalysts);

  const programTypes = [...new Set(mockCatalysts.map(c => c.programType))];
  const stats = {
    total: catalystData.length,
    active: catalystData.filter(c => c.status === 'active').length,
    programs: programTypes.length,
    alumniCount: catalystData.reduce((sum, c) => sum + (c.alumniCount || 0), 0)
  };

  const filteredCatalysts = catalystData.filter((catalyst) => {
    const matchesSearch = catalyst.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) || catalyst.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProgram = programFilter === "all" || catalyst.programType === programFilter;
    return matchesSearch && matchesProgram;
  });

  const totalPages = Math.ceil(filteredCatalysts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCatalysts = filteredCatalysts.slice(startIndex, startIndex + itemsPerPage);

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
    description: { marginTop: '12px', lineHeight: '1.6', color: '#4a352f' },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Catalysts in Ecosystem</h1>
          <p style={styles.subtitle}>Discover accelerators, incubators, and support programs</p>
        </div>
        <button style={styles.exportButton} onClick={exportToExcel}><Download size={16} /> Export to Excel</button>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}><Building2 size={24} style={styles.statIcon} /><div style={styles.statInfo}><h3 style={{ margin: 0, fontSize: '24px' }}>{stats.total}</h3><p style={{ margin: 0, color: '#7d5a50' }}>Total Catalysts</p></div></div>
        <div style={styles.statCard}><Rocket size={24} style={styles.statIcon} /><div style={styles.statInfo}><h3 style={{ margin: 0, fontSize: '24px' }}>{stats.programs}</h3><p style={{ margin: 0, color: '#7d5a50' }}>Program Types</p></div></div>
        <div style={styles.statCard}><Users size={24} style={styles.statIcon} /><div style={styles.statInfo}><h3 style={{ margin: 0, fontSize: '24px' }}>{stats.alumniCount}</h3><p style={{ margin: 0, color: '#7d5a50' }}>Alumni Companies</p></div></div>
        <div style={styles.statCard}><TrendingUp size={24} style={styles.statIcon} /><div style={styles.statInfo}><h3 style={{ margin: 0, fontSize: '24px' }}>{stats.active}</h3><p style={{ margin: 0, color: '#7d5a50' }}>Active Programs</p></div></div>
      </div>

      <div style={styles.controls}>
        <div style={styles.searchContainer}>
          <Search size={20} style={styles.searchIcon} />
          <input type="text" placeholder="Search by organization name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
        </div>
        <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)} style={styles.filterSelect}>
          <option value="all">All Programs</option>
          {programTypes.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead><tr style={{ borderBottom: '1px solid #f0e6d9', background: '#faf7f2' }}><th style={{ padding: '16px', textAlign: 'left' }}>Organization</th><th style={{ padding: '16px', textAlign: 'left' }}>Program Type</th><th style={{ padding: '16px', textAlign: 'left' }}>Focus Areas</th><th style={{ padding: '16px', textAlign: 'left' }}>Duration</th><th style={{ padding: '16px', textAlign: 'left' }}>Location</th><th style={{ padding: '16px', textAlign: 'left' }}>Alumni</th><th style={{ padding: '16px', textAlign: 'left' }}>Actions</th></tr></thead>
          <tbody>
            {currentCatalysts.map((catalyst) => (
              <tr key={catalyst.id} style={{ borderBottom: '1px solid #f0e6d9' }}>
                <td style={{ padding: '16px' }}><div style={styles.companyCell}><div style={styles.companyAvatar}>{catalyst.organizationName.charAt(0).toUpperCase()}</div><div><div style={styles.companyName}>{catalyst.organizationName}</div><div style={styles.companyEmail}>{catalyst.email}</div></div></div></td>
                <td style={{ padding: '16px' }}>{catalyst.programType}</td>
                <td style={{ padding: '16px' }}><div style={styles.tags}>{catalyst.focusAreas.slice(0, 2).map((area, i) => (<span key={i} style={styles.tag}>{area}</span>))}</div></td>
                <td style={{ padding: '16px' }}>{catalyst.duration}</td>
                <td style={{ padding: '16px' }}>{catalyst.location}</td>
                <td style={{ padding: '16px' }}>{catalyst.alumniCount}</td>
                <td style={{ padding: '16px' }}><button style={styles.viewBtn} onClick={() => { setSelectedCatalyst(catalyst); setShowViewModal(true); }}><Eye size={16} /> View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} style={{ ...styles.paginationBtn, opacity: currentPage === 1 ? 0.5 : 1 }}><ChevronLeft size={16} /> Previous</button>
          <span style={styles.pageNumber}>Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} style={{ ...styles.paginationBtn, opacity: currentPage === totalPages ? 0.5 : 1 }}>Next <ChevronRight size={16} /></button>
        </div>
      )}

      {showViewModal && selectedCatalyst && (
        <div style={styles.modalOverlay} onClick={() => setShowViewModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}><h2 style={{ margin: 0 }}>{selectedCatalyst.organizationName}</h2><p style={{ margin: '4px 0 0', color: '#7d5a50' }}>{selectedCatalyst.programType} Program</p></div>
              <button style={styles.closeButton} onClick={() => setShowViewModal(false)}><X size={20} /></button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.detailSection}>
                <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>Program Information</h3>
                <div style={styles.detailGrid}>
                  <div style={styles.detailItem}><Target size={16} color="#a67c52" /><span>Focus Areas:</span><div style={styles.tags}>{selectedCatalyst.focusAreas.map((area, i) => (<span key={i} style={styles.tag}>{area}</span>))}</div></div>
                  <div style={styles.detailItem}><Calendar size={16} color="#a67c52" /><span>Duration:</span><strong>{selectedCatalyst.duration}</strong></div>
                  <div style={styles.detailItem}><Users size={16} color="#a67c52" /><span>Cohort Size:</span><strong>{selectedCatalyst.cohortSize}</strong></div>
                  <div style={styles.detailItem}><TrendingUp size={16} color="#a67c52" /><span>Success Rate:</span><strong>{selectedCatalyst.successRate}</strong></div>
                </div>
              </div>
              <div style={styles.detailSection}>
                <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>Contact Information</h3>
                <div style={styles.detailGrid}>
                  <div style={styles.detailItem}><Mail size={16} color="#a67c52" /><span>Email:</span><strong>{selectedCatalyst.email}</strong></div>
                  <div style={styles.detailItem}><Phone size={16} color="#a67c52" /><span>Phone:</span><strong>{selectedCatalyst.phone}</strong></div>
                  <div style={styles.detailItem}><MapPin size={16} color="#a67c52" /><span>Location:</span><strong>{selectedCatalyst.location}</strong></div>
                </div>
              </div>
              <div style={styles.detailSection}>
                <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>Description</h3>
                <p style={styles.description}>{selectedCatalyst.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CatalystEcosystem;