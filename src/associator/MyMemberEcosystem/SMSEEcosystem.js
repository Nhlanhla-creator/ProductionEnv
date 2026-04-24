"use client";
import { useState } from "react";
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

// ---------- MOCK DATA (No Backend) ----------
const mockSMSEs = [
  {
    id: "1",
    username: "tech_solutions",
    email: "contact@techsolutions.co.za",
    companyName: "Tech Solutions SA",
    industry: "Technology",
    entitySize: "Small",
    location: "Cape Town",
    employees: "25",
    revenue: "R5.2M",
    founded: "2018",
    website: "https://techsolutions.co.za",
    phone: "+27 21 123 4567",
    status: "active",
    createdAt: new Date("2023-06-15"),
    description: "Leading software development company specializing in web and mobile applications for businesses across South Africa.",
  },
  {
    id: "2",
    username: "green_energy",
    email: "info@greenenergy.co.za",
    companyName: "Green Energy Solutions",
    industry: "Manufacturing",
    entitySize: "Medium",
    location: "Johannesburg",
    employees: "85",
    revenue: "R12.8M",
    founded: "2015",
    website: "https://greenenergy.co.za",
    phone: "+27 11 987 6543",
    status: "active",
    createdAt: new Date("2023-08-22"),
    description: "Manufacturing solar panels and renewable energy solutions for residential and commercial properties.",
  },
  {
    id: "3",
    username: "retail_hub",
    email: "hello@retailhub.co.za",
    companyName: "Retail Hub",
    industry: "Retail",
    entitySize: "Small",
    location: "Durban",
    employees: "15",
    revenue: "R2.1M",
    founded: "2020",
    website: "https://retailhub.co.za",
    phone: "+27 31 456 7890",
    status: "pending",
    createdAt: new Date("2024-01-10"),
    description: "Online retail platform connecting local artisans with customers across South Africa.",
  },
  {
    id: "4",
    username: "consult_pro",
    email: "info@consultpro.co.za",
    companyName: "Consult Pro",
    industry: "Services",
    entitySize: "Micro",
    location: "Pretoria",
    employees: "8",
    revenue: "R980K",
    founded: "2021",
    website: "https://consultpro.co.za",
    phone: "+27 12 345 6789",
    status: "active",
    createdAt: new Date("2023-11-05"),
    description: "Business consulting services specializing in SME growth strategies and operational efficiency.",
  },
  {
    id: "5",
    username: "agri_fresh",
    email: "sales@agrifresh.co.za",
    companyName: "Agri Fresh",
    industry: "Services",
    entitySize: "Small",
    location: "Stellenbosch",
    employees: "32",
    revenue: "R7.5M",
    founded: "2017",
    website: "https://agrifresh.co.za",
    phone: "+27 21 876 5432",
    status: "active",
    createdAt: new Date("2023-09-18"),
    description: "Fresh produce distributor serving restaurants and retailers across the Western Cape.",
  },
  {
    id: "6",
    username: "innovate_tech",
    email: "hello@innovatetech.co.za",
    companyName: "Innovate Tech",
    industry: "Technology",
    entitySize: "Medium",
    location: "Cape Town",
    employees: "55",
    revenue: "R15.3M",
    founded: "2014",
    website: "https://innovatetech.co.za",
    phone: "+27 21 555 1234",
    status: "active",
    createdAt: new Date("2023-07-30"),
    description: "AI and machine learning solutions for enterprise clients across Africa.",
  },
  {
    id: "7",
    username: "fashion_house",
    email: "info@fashionhouse.co.za",
    companyName: "Fashion House",
    industry: "Retail",
    entitySize: "Micro",
    location: "Johannesburg",
    employees: "6",
    revenue: "R650K",
    founded: "2022",
    website: "https://fashionhouse.co.za",
    phone: "+27 11 888 9999",
    status: "pending",
    createdAt: new Date("2024-02-28"),
    description: "Sustainable fashion brand creating eco-friendly clothing for the modern consumer.",
  },
  {
    id: "8",
    username: "build_masters",
    email: "info@buildmasters.co.za",
    companyName: "Build Masters",
    industry: "Manufacturing",
    entitySize: "Small",
    location: "Port Elizabeth",
    employees: "42",
    revenue: "R9.2M",
    founded: "2016",
    website: "https://buildmasters.co.za",
    phone: "+27 41 123 4567",
    status: "active",
    createdAt: new Date("2023-10-12"),
    description: "Construction materials manufacturer supplying building products across the Eastern Cape.",
  },
  {
    id: "9",
    username: "digital_agency",
    email: "hello@digitalagency.co.za",
    companyName: "Digital Agency",
    industry: "Services",
    entitySize: "Micro",
    location: "Cape Town",
    employees: "12",
    revenue: "R1.8M",
    founded: "2019",
    website: "https://digitalagency.co.za",
    phone: "+27 21 444 5678",
    status: "active",
    createdAt: new Date("2023-12-03"),
    description: "Full-service digital marketing agency specializing in SEO, social media, and content creation.",
  },
  {
    id: "10",
    username: "logistics_pro",
    email: "info@logisticspro.co.za",
    companyName: "Logistics Pro",
    industry: "Services",
    entitySize: "Small",
    location: "Johannesburg",
    employees: "28",
    revenue: "R4.5M",
    founded: "2018",
    website: "https://logisticspro.co.za",
    phone: "+27 11 777 8888",
    status: "blocked",
    createdAt: new Date("2023-11-20"),
    description: "Logistics and supply chain management solutions for businesses across South Africa.",
  },
];

const industries = ["Technology", "Manufacturing", "Retail", "Services"];

function SMSEEcosystem() {
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [selectedSMSE, setSelectedSMSE] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [smseData] = useState(mockSMSEs);

  const activeCount = smseData.filter(s => s.status === 'active').length;
  const uniqueIndustries = new Set(smseData.map(s => s.industry).filter(i => i !== "Not specified"));
  const stats = { 
    total: smseData.length, 
    active: activeCount, 
    industries: uniqueIndustries.size, 
    avgGrowth: 23.5 
  };

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
      "Company Name": smse.companyName,
      "Email": smse.email,
      "Industry": smse.industry,
      "Entity Size": smse.entitySize,
      "Location": smse.location,
      "Employees": smse.employees,
      "Revenue": smse.revenue,
      "Status": smse.status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SMSEs");
    XLSX.writeFile(workbook, `SMSEs_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      active: { background: '#e8f5e8', color: '#2e7d32' },
      pending: { background: '#fff3e0', color: '#ed6c02' },
      blocked: { background: '#fdeaea', color: '#c62828' }
    };
    const colors = statusColors[status] || statusColors.active;
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '500',
        background: colors.background,
        color: colors.color,
      }}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  // Styles
  const styles = {
    container: {
      padding: '24px',
      background: '#f5f7fa',
      minHeight: '100vh',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
    },
    headerContent: {
      flex: 1,
    },
    title: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#4a352f',
      margin: '0 0 8px 0',
    },
    subtitle: {
      color: '#7d5a50',
      margin: 0,
    },
    exportButton: {
      background: '#a67c52',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'background 0.2s',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '20px',
      marginBottom: '32px',
    },
    statCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    },
    statIcon: {
      color: '#a67c52',
    },
    statInfo: {
      flex: 1,
    },
    controls: {
      display: 'flex',
      gap: '16px',
      marginBottom: '24px',
      flexWrap: 'wrap',
    },
    searchContainer: {
      flex: 1,
      position: 'relative',
    },
    searchIcon: {
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#7d5a50',
    },
    searchInput: {
      width: '100%',
      padding: '10px 12px 10px 40px',
      border: '1px solid #e0d5c8',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
    },
    filters: {
      display: 'flex',
      gap: '12px',
    },
    filterSelect: {
      padding: '10px 12px',
      border: '1px solid #e0d5c8',
      borderRadius: '8px',
      fontSize: '14px',
      background: 'white',
      cursor: 'pointer',
    },
    tableContainer: {
      background: 'white',
      borderRadius: '12px',
      overflow: 'auto',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    companyCell: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    companyAvatar: {
      width: '40px',
      height: '40px',
      background: 'linear-gradient(135deg, #a67c52, #7d5a50)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
    },
    companyName: {
      fontWeight: '600',
      color: '#4a352f',
    },
    companyEmail: {
      fontSize: '12px',
      color: '#7d5a50',
    },
    viewBtn: {
      background: 'none',
      border: 'none',
      color: '#a67c52',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '13px',
      padding: '6px 12px',
      borderRadius: '6px',
      transition: 'background 0.2s',
    },
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '16px',
      marginTop: '24px',
    },
    paginationBtn: {
      background: 'white',
      border: '1px solid #e0d5c8',
      padding: '8px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '14px',
    },
    pageNumber: {
      color: '#7d5a50',
      fontSize: '14px',
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modal: {
      background: 'white',
      borderRadius: '12px',
      maxWidth: '600px',
      width: '90%',
      maxHeight: '80vh',
      overflow: 'auto',
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: '20px',
      borderBottom: '1px solid #f0e6d9',
    },
    modalTitle: {
      flex: 1,
    },
    closeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#7d5a50',
    },
    modalBody: {
      padding: '20px',
    },
    detailSection: {
      marginBottom: '24px',
    },
    detailGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '12px',
      marginTop: '12px',
    },
    detailItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
    },
    description: {
      marginTop: '12px',
      lineHeight: '1.6',
      color: '#4a352f',
    },
    statusBadge: {
      display: 'inline-block',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>SMSEs in Ecosystem</h1>
          <p style={styles.subtitle}>Browse and view Small and Medium Enterprises</p>
        </div>
        <button style={styles.exportButton} onClick={exportToExcel}>
          <Download size={16} />
          Export to Excel
        </button>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <Building2 size={24} style={styles.statIcon} />
          <div style={styles.statInfo}>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#4a352f' }}>{stats.total}</h3>
            <p style={{ margin: 0, color: '#7d5a50', fontSize: '14px' }}>Total SMSEs</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <CheckCircle size={24} style={styles.statIcon} />
          <div style={styles.statInfo}>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#4a352f' }}>{stats.active}</h3>
            <p style={{ margin: 0, color: '#7d5a50', fontSize: '14px' }}>Active Members</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <TrendingUp size={24} style={styles.statIcon} />
          <div style={styles.statInfo}>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#4a352f' }}>{stats.industries}</h3>
            <p style={{ margin: 0, color: '#7d5a50', fontSize: '14px' }}>Industries</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <Award size={24} style={styles.statIcon} />
          <div style={styles.statInfo}>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#4a352f' }}>{stats.avgGrowth}%</h3>
            <p style={{ margin: 0, color: '#7d5a50', fontSize: '14px' }}>Avg. Growth Rate</p>
          </div>
        </div>
      </div>

      <div style={styles.controls}>
        <div style={styles.searchContainer}>
          <Search size={20} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by company name, username, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.filters}>
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Industries</option>
            {industries.map(industry => (
              <option key={industry} value={industry}>{industry}</option>
            ))}
          </select>
          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Sizes</option>
            <option value="Micro">Micro (1-10)</option>
            <option value="Small">Small (11-50)</option>
            <option value="Medium">Medium (51-200)</option>
          </select>
        </div>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f0e6d9', background: '#faf7f2' }}>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Company</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Industry</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Size</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Location</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Status</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Joined</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentSMSEs.map((smse) => (
              <tr key={smse.id} style={{ borderBottom: '1px solid #f0e6d9' }}>
                <td style={{ padding: '16px' }}>
                  <div style={styles.companyCell}>
                    <div style={styles.companyAvatar}>
                      {smse.companyName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={styles.companyName}>{smse.companyName}</div>
                      <div style={styles.companyEmail}>{smse.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px', color: '#4a352f' }}>{smse.industry}</td>
                <td style={{ padding: '16px', color: '#4a352f' }}>{smse.entitySize}</td>
                <td style={{ padding: '16px', color: '#4a352f' }}>{smse.location}</td>
                <td style={{ padding: '16px' }}>{getStatusBadge(smse.status)}</td>
                <td style={{ padding: '16px', color: '#4a352f' }}>{formatDate(smse.createdAt)}</td>
                <td style={{ padding: '16px' }}>
                  <button
                    style={styles.viewBtn}
                    onClick={() => {
                      setSelectedSMSE(smse);
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
          <span style={styles.pageNumber}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={{ ...styles.paginationBtn, opacity: currentPage === totalPages ? 0.5 : 1 }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      {showViewModal && selectedSMSE && (
        <div style={styles.modalOverlay} onClick={() => setShowViewModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>
                <h2 style={{ margin: 0, color: '#4a352f' }}>{selectedSMSE.companyName}</h2>
                <p style={{ margin: '4px 0 0', color: '#7d5a50', fontSize: '14px' }}>{selectedSMSE.username}</p>
              </div>
              <button style={styles.closeButton} onClick={() => setShowViewModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.detailSection}>
                <h3 style={{ margin: '0 0 12px', color: '#4a352f', fontSize: '16px' }}>Company Information</h3>
                <div style={styles.detailGrid}>
                  <div style={styles.detailItem}>
                    <Building2 size={16} color="#a67c52" />
                    <span style={{ color: '#7d5a50' }}>Industry:</span>
                    <strong style={{ color: '#4a352f' }}>{selectedSMSE.industry}</strong>
                  </div>
                  <div style={styles.detailItem}>
                    <Users size={16} color="#a67c52" />
                    <span style={{ color: '#7d5a50' }}>Employees:</span>
                    <strong style={{ color: '#4a352f' }}>{selectedSMSE.employees}</strong>
                  </div>
                  <div style={styles.detailItem}>
                    <DollarSign size={16} color="#a67c52" />
                    <span style={{ color: '#7d5a50' }}>Revenue:</span>
                    <strong style={{ color: '#4a352f' }}>{selectedSMSE.revenue}</strong>
                  </div>
                  <div style={styles.detailItem}>
                    <MapPin size={16} color="#a67c52" />
                    <span style={{ color: '#7d5a50' }}>Location:</span>
                    <strong style={{ color: '#4a352f' }}>{selectedSMSE.location}</strong>
                  </div>
                  <div style={styles.detailItem}>
                    <Calendar size={16} color="#a67c52" />
                    <span style={{ color: '#7d5a50' }}>Founded:</span>
                    <strong style={{ color: '#4a352f' }}>{selectedSMSE.founded}</strong>
                  </div>
                  <div style={styles.detailItem}>
                    <Globe size={16} color="#a67c52" />
                    <span style={{ color: '#7d5a50' }}>Website:</span>
                    <a href={selectedSMSE.website} target="_blank" rel="noopener noreferrer" style={{ color: '#a67c52', textDecoration: 'none' }}>
                      {selectedSMSE.website}
                    </a>
                  </div>
                </div>
              </div>
              <div style={styles.detailSection}>
                <h3 style={{ margin: '0 0 12px', color: '#4a352f', fontSize: '16px' }}>Contact Information</h3>
                <div style={styles.detailGrid}>
                  <div style={styles.detailItem}>
                    <Mail size={16} color="#a67c52" />
                    <span style={{ color: '#7d5a50' }}>Email:</span>
                    <strong style={{ color: '#4a352f' }}>{selectedSMSE.email}</strong>
                  </div>
                  <div style={styles.detailItem}>
                    <Phone size={16} color="#a67c52" />
                    <span style={{ color: '#7d5a50' }}>Phone:</span>
                    <strong style={{ color: '#4a352f' }}>{selectedSMSE.phone}</strong>
                  </div>
                </div>
              </div>
              <div style={styles.detailSection}>
                <h3 style={{ margin: '0 0 12px', color: '#4a352f', fontSize: '16px' }}>Description</h3>
                <p style={styles.description}>{selectedSMSE.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SMSEEcosystem;