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
  TrendingUp,
  Users,
  Building2,
  Globe,
  Target,
} from "lucide-react";
import * as XLSX from 'xlsx';

// ---------- MOCK DATA ----------
const mockInvestors = [
  {
    id: "1",
    username: "cape_capital",
    email: "info@capecapital.co.za",
    fundName: "Cape Capital Partners",
    type: "Venture Capital",
    focusAreas: ["Tech", "SaaS", "Fintech"],
    ticketSize: "R5M - R20M",
    stagePreference: "Seed to Series A",
    location: "Cape Town",
    phone: "+27 21 123 4567",
    website: "https://capecapital.co.za",
    status: "active",
    createdAt: new Date("2023-06-15"),
    portfolioCount: 24,
    totalInvested: "R150M",
    description: "Venture capital firm investing in early-stage technology companies across Africa.",
  },
  {
    id: "2",
    username: "jhb_invest",
    email: "hello@jhbinvest.co.za",
    fundName: "Johannesburg Investment Group",
    type: "Private Equity",
    focusAreas: ["Manufacturing", "Logistics", "Healthcare"],
    ticketSize: "R20M - R100M",
    stagePreference: "Growth Stage",
    location: "Johannesburg",
    phone: "+27 11 987 6543",
    website: "https://jhbinvest.co.za",
    status: "active",
    createdAt: new Date("2023-08-22"),
    portfolioCount: 18,
    totalInvested: "R450M",
    description: "Private equity firm focused on established businesses with growth potential.",
  },
  {
    id: "3",
    username: "angel_fund",
    email: "contact@angelfund.co.za",
    fundName: "Angel Investment Network",
    type: "Angel Investor",
    focusAreas: ["Tech", "E-commerce", "Mobile Apps"],
    ticketSize: "R500K - R2M",
    stagePreference: "Pre-seed to Seed",
    location: "Durban",
    phone: "+27 31 456 7890",
    website: "https://angelfund.co.za",
    status: "pending",
    createdAt: new Date("2024-01-10"),
    portfolioCount: 35,
    totalInvested: "R45M",
    description: "Angel investor network backing innovative tech startups.",
  },
  {
    id: "4",
    username: "family_office_sa",
    email: "info@familyoffice.co.za",
    fundName: "Legacy Family Office",
    type: "Family Office",
    focusAreas: ["Real Estate", "Hospitality", "AgriTech"],
    ticketSize: "R10M - R50M",
    stagePreference: "Series A to Series B",
    location: "Pretoria",
    phone: "+27 12 345 6789",
    website: "https://familyoffice.co.za",
    status: "active",
    createdAt: new Date("2023-11-05"),
    portfolioCount: 12,
    totalInvested: "R280M",
    description: "Family office investing in sustainable businesses across multiple sectors.",
  },
  {
    id: "5",
    username: "eco_invest",
    email: "hello@ecoinvest.co.za",
    fundName: "Eco-Invest Fund",
    type: "Venture Capital",
    focusAreas: ["CleanTech", "Renewable Energy", "Sustainability"],
    ticketSize: "R2M - R15M",
    stagePreference: "Seed to Series A",
    location: "Stellenbosch",
    phone: "+27 21 876 5432",
    website: "https://ecoinvest.co.za",
    status: "active",
    createdAt: new Date("2023-09-18"),
    portfolioCount: 16,
    totalInvested: "R95M",
    description: "Venture capital fund focused on climate tech and renewable energy.",
  },
];

function InvestorEcosystem() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [investorData] = useState(mockInvestors);

  const investorTypes = [...new Set(mockInvestors.map(i => i.type))];
  const stats = {
    total: investorData.length,
    active: investorData.filter(i => i.status === 'active').length,
    totalCapital: 500000000,
    avgInvestment: 25000000
  };

  const filteredInvestors = investorData.filter((investor) => {
    const matchesSearch = investor.fundName.toLowerCase().includes(searchTerm.toLowerCase()) || investor.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || investor.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredInvestors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentInvestors = filteredInvestors.slice(startIndex, startIndex + itemsPerPage);

  const formatCurrency = (value) => {
    if (typeof value === 'number') return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 0 }).format(value);
    return value;
  };

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
    const colors = status === 'active' ? { background: '#e8f5e8', color: '#2e7d32' } : { background: '#fff3e0', color: '#ed6c02' };
    return <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', background: colors.background, color: colors.color }}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
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
          <h1 style={styles.title}>Investors in Ecosystem</h1>
          <p style={styles.subtitle}>Discover funding partners and investment firms</p>
        </div>
        <button style={styles.exportButton} onClick={exportToExcel}><Download size={16} /> Export to Excel</button>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}><TrendingUp size={24} style={styles.statIcon} /><div style={styles.statInfo}><h3 style={{ margin: 0, fontSize: '24px' }}>{stats.total}</h3><p style={{ margin: 0, color: '#7d5a50' }}>Total Investors</p></div></div>
        <div style={styles.statCard}><Building2 size={24} style={styles.statIcon} /><div style={styles.statInfo}><h3 style={{ margin: 0, fontSize: '24px' }}>{formatCurrency(stats.totalCapital)}</h3><p style={{ margin: 0, color: '#7d5a50' }}>Total Capital Available</p></div></div>
        <div style={styles.statCard}><Target size={24} style={styles.statIcon} /><div style={styles.statInfo}><h3 style={{ margin: 0, fontSize: '24px' }}>{formatCurrency(stats.avgInvestment)}</h3><p style={{ margin: 0, color: '#7d5a50' }}>Avg. Investment Size</p></div></div>
        <div style={styles.statCard}><Users size={24} style={styles.statIcon} /><div style={styles.statInfo}><h3 style={{ margin: 0, fontSize: '24px' }}>{stats.active}</h3><p style={{ margin: 0, color: '#7d5a50' }}>Active Members</p></div></div>
      </div>

      <div style={styles.controls}>
        <div style={styles.searchContainer}>
          <Search size={20} style={styles.searchIcon} />
          <input type="text" placeholder="Search by fund name or username..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={styles.filterSelect}>
          <option value="all">All Types</option>
          {investorTypes.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead><tr style={{ borderBottom: '1px solid #f0e6d9', background: '#faf7f2' }}><th style={{ padding: '16px', textAlign: 'left' }}>Investor/Fund</th><th style={{ padding: '16px', textAlign: 'left' }}>Type</th><th style={{ padding: '16px', textAlign: 'left' }}>Focus Areas</th><th style={{ padding: '16px', textAlign: 'left' }}>Ticket Size</th><th style={{ padding: '16px', textAlign: 'left' }}>Location</th><th style={{ padding: '16px', textAlign: 'left' }}>Status</th><th style={{ padding: '16px', textAlign: 'left' }}>Actions</th></tr></thead>
          <tbody>
            {currentInvestors.map((investor) => (
              <tr key={investor.id} style={{ borderBottom: '1px solid #f0e6d9' }}>
                <td style={{ padding: '16px' }}><div style={styles.companyCell}><div style={styles.companyAvatar}>{investor.fundName.charAt(0).toUpperCase()}</div><div><div style={styles.companyName}>{investor.fundName}</div><div style={styles.companyEmail}>{investor.email}</div></div></div></td>
                <td style={{ padding: '16px' }}>{investor.type}</td>
                <td style={{ padding: '16px' }}><div style={styles.tags}>{investor.focusAreas.slice(0, 2).map((area, i) => (<span key={i} style={styles.tag}>{area}</span>))}{investor.focusAreas.length > 2 && <span style={styles.tag}>+{investor.focusAreas.length - 2}</span>}</div></td>
                <td style={{ padding: '16px' }}>{investor.ticketSize}</td>
                <td style={{ padding: '16px' }}>{investor.location}</td>
                <td style={{ padding: '16px' }}>{getStatusBadge(investor.status)}</td>
                <td style={{ padding: '16px' }}><button style={styles.viewBtn} onClick={() => { setSelectedInvestor(investor); setShowViewModal(true); }}><Eye size={16} /> View</button></td>
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

      {showViewModal && selectedInvestor && (
        <div style={styles.modalOverlay} onClick={() => setShowViewModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}><h2 style={{ margin: 0 }}>{selectedInvestor.fundName}</h2><p style={{ margin: '4px 0 0', color: '#7d5a50' }}>{selectedInvestor.username}</p></div>
              <button style={styles.closeButton} onClick={() => setShowViewModal(false)}><X size={20} /></button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.detailSection}>
                <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>Investment Profile</h3>
                <div style={styles.detailGrid}>
                  <div style={styles.detailItem}><Target size={16} color="#a67c52" /><span>Focus Areas:</span><div style={styles.tags}>{selectedInvestor.focusAreas.map((area, i) => (<span key={i} style={styles.tag}>{area}</span>))}</div></div>
                  <div style={styles.detailItem}><TrendingUp size={16} color="#a67c52" /><span>Ticket Size:</span><strong>{selectedInvestor.ticketSize}</strong></div>
                  <div style={styles.detailItem}><Building2 size={16} color="#a67c52" /><span>Stage Preference:</span><strong>{selectedInvestor.stagePreference}</strong></div>
                  <div style={styles.detailItem}><Users size={16} color="#a67c52" /><span>Portfolio Companies:</span><strong>{selectedInvestor.portfolioCount}</strong></div>
                </div>
              </div>
              <div style={styles.detailSection}>
                <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>Contact Information</h3>
                <div style={styles.detailGrid}>
                  <div style={styles.detailItem}><Mail size={16} color="#a67c52" /><span>Email:</span><strong>{selectedInvestor.email}</strong></div>
                  <div style={styles.detailItem}><Phone size={16} color="#a67c52" /><span>Phone:</span><strong>{selectedInvestor.phone}</strong></div>
                  <div style={styles.detailItem}><MapPin size={16} color="#a67c52" /><span>Location:</span><strong>{selectedInvestor.location}</strong></div>
                  <div style={styles.detailItem}><Globe size={16} color="#a67c52" /><span>Website:</span><a href={selectedInvestor.website} target="_blank" rel="noopener noreferrer" style={{ color: '#a67c52', textDecoration: 'none' }}>{selectedInvestor.website}</a></div>
                </div>
              </div>
              <div style={styles.detailSection}>
                <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>Description</h3>
                <p style={styles.description}>{selectedInvestor.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvestorEcosystem;