"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  Building2,
  Globe,
  Linkedin,
  FileText,
  ExternalLink,
  Target,
  Clock,
  CheckCircle,
} from "lucide-react";
import * as XLSX from 'xlsx';

// ---------- MOCK DATA (Placeholder details - No Backend) ----------
const mockAdvisors = [
  {
    id: "1",
    username: "strategic_partners",
    email: "contact@strategicpartners.co.za",
    fullName: "Dr. Sarah Johnson",
    firmType: "Strategic Advisory Firm",
    title: "Strategic Business Advisor",
    expertise: ["Strategy", "Growth Planning", "Business Modeling"],
    industries: ["Technology", "Finance", "Retail"],
    experience: "15+ years",
    location: "Cape Town",
    headOfficeLocation: "Cape Town, Western Cape",
    membershipStatus: "Active Partner",
    phone: "+27 21 123 4567",
    website: "https://strategicpartners.co.za",
    linkedin: "https://linkedin.com/in/sarahjohnson",
    bio: "Strategic business advisor with over 15 years of experience helping SMEs scale their operations and achieve sustainable growth.",
    status: "active",
    createdAt: new Date("2023-06-15"),
    rating: 4.8,
    reviews: 127,
    hourlyRate: "R1,500 - R2,500",
    qualifications: ["MBA (UCT)", "Certified Business Advisor"],
    keyClients: ["Tech Startup A", "Retail Chain B"],
    documents: {
      profile: "/docs/sarah-johnson-profile.pdf",
    },
  },
  {
    id: "2",
    username: "finance_guru",
    email: "info@financeguru.co.za",
    fullName: "Michael Chen",
    firmType: "Financial Advisory",
    title: "Financial Advisor",
    expertise: ["Finance", "Investment", "Financial Planning"],
    industries: ["Finance", "Real Estate", "Manufacturing"],
    experience: "12+ years",
    location: "Johannesburg",
    headOfficeLocation: "Johannesburg, Gauteng",
    membershipStatus: "Active Partner",
    phone: "+27 11 987 6543",
    website: "https://financeguru.co.za",
    linkedin: "https://linkedin.com/in/michaelchen",
    bio: "Specializing in financial strategy, investment planning, and capital raising for growing businesses.",
    status: "active",
    createdAt: new Date("2023-08-22"),
    rating: 4.6,
    reviews: 89,
    hourlyRate: "R1,200 - R2,000",
    qualifications: ["CFA", "Financial Planning Certificate"],
    keyClients: ["Growing SME Fund", "Real Estate Group"],
    documents: {},
  },
  {
    id: "3",
    username: "marketing_pro",
    email: "hello@marketingpro.co.za",
    fullName: "Thabo Nkosi",
    firmType: "Marketing Consultancy",
    title: "Marketing Strategist",
    expertise: ["Marketing", "Digital Strategy", "Brand Building"],
    industries: ["Retail", "E-commerce", "Services"],
    experience: "10+ years",
    location: "Durban",
    headOfficeLocation: "Durban, KwaZulu-Natal",
    membershipStatus: "Pending Approval",
    phone: "+27 31 456 7890",
    website: "https://marketingpro.co.za",
    bio: "Digital marketing expert helping businesses build strong brands and acquire customers online.",
    status: "pending",
    createdAt: new Date("2024-01-10"),
    rating: 4.5,
    reviews: 56,
    hourlyRate: "R800 - R1,500",
    qualifications: ["Digital Marketing Certified"],
    keyClients: ["E-commerce Startup", "Local Brand"],
    documents: {},
  },
  {
    id: "4",
    username: "legal_eagle",
    email: "info@legaleagle.co.za",
    fullName: "Priya Patel",
    firmType: "Legal Practice",
    title: "Legal Advisor",
    expertise: ["Legal", "Compliance", "Contract Law"],
    industries: ["Legal", "Technology", "Healthcare"],
    experience: "8+ years",
    location: "Pretoria",
    headOfficeLocation: "Pretoria, Gauteng",
    membershipStatus: "Active Partner",
    phone: "+27 12 345 6789",
    website: "https://legaleagle.co.za",
    linkedin: "https://linkedin.com/in/priyapatel",
    bio: "Corporate lawyer specializing in startup legal frameworks, intellectual property, and compliance.",
    status: "active",
    createdAt: new Date("2023-11-05"),
    rating: 4.9,
    reviews: 203,
    hourlyRate: "R2,000 - R3,500",
    qualifications: ["LLB", "Certificate in Corporate Law"],
    keyClients: ["Tech Startups", "Healthcare Providers"],
    documents: {
      profile: "/docs/priya-patel-profile.pdf",
    },
  },
  {
    id: "5",
    username: "ops_expert",
    email: "contact@opsexpert.co.za",
    fullName: "James Wilson",
    firmType: "Operations Advisory",
    title: "Operations Advisor",
    expertise: ["Operations", "Supply Chain", "Process Improvement"],
    industries: ["Manufacturing", "Logistics", "Retail"],
    experience: "18+ years",
    location: "Port Elizabeth",
    headOfficeLocation: "Port Elizabeth, Eastern Cape",
    membershipStatus: "Active Partner",
    phone: "+27 41 123 4567",
    website: "https://opsexpert.co.za",
    linkedin: "https://linkedin.com/in/jameswilson",
    bio: "Operations expert focused on efficiency, cost reduction, and supply chain optimization.",
    status: "active",
    createdAt: new Date("2023-09-18"),
    rating: 4.7,
    reviews: 142,
    hourlyRate: "R1,500 - R2,800",
    qualifications: ["Six Sigma Black Belt", "Supply Chain Management"],
    keyClients: ["Manufacturing Corp", "Logistics Company"],
    documents: {
      profile: "/docs/james-wilson-profile.pdf",
    },
  },
];

const allExpertise = [...new Set(mockAdvisors.flatMap(a => a.expertise))];

// ---------- ADVISOR DETAILS MODAL (With Tabs) ----------
const AdvisorDetailsModal = ({ advisor, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !advisor || !mounted) return null;

  // Helper functions
  const formatLabel = (value) => {
    if (!value) return "Not provided";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return value;
  };

  // Tabs configuration
  const tabs = [
    { id: "overview", label: "Overview", icon: Building2 },
    { id: "expertise", label: "Expertise & Industries", icon: Target },
    { id: "contact", label: "Contact", icon: Globe },
    { id: "documents", label: "Documents", icon: FileText },
  ];

  const renderDocumentLink = (url, label) => {
    if (!url) return null;
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 16px",
          background: "linear-gradient(135deg, #a67c52, #7d5a50)",
          color: "#faf7f2",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "500",
          cursor: "pointer",
          maxWidth: "fit-content",
        }}
        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      >
        <FileText size={16} />
        <span>{label}</span>
        <ExternalLink size={14} />
      </div>
    );
  };

  const renderLinkedInLink = (url) => {
    if (!url) return null;
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          background: "linear-gradient(135deg, #0077b5, #005582)",
          color: "#ffffff",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: "500",
          cursor: "pointer",
          maxWidth: "fit-content",
        }}
        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      >
        <Linkedin size={14} />
        <span>LinkedIn</span>
        <ExternalLink size={11} />
      </div>
    );
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

  const getMembershipBadgeStyle = (status) => {
    if (status === "Active Partner") {
      return { background: "#e8f5e8", color: "#2e7d32" };
    } else if (status === "Pending Approval") {
      return { background: "#fff3e0", color: "#ed6c02" };
    }
    return { background: "#fdeaea", color: "#c62828" };
  };

  return createPortal(
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        {/* Header */}
        <div style={modalHeaderStyle}>
          <div style={headerContentStyle}>
            <div style={advisorHeaderStyle}>
              <h2 style={advisorNameStyle}>{advisor.fullName}</h2>
              <div style={advisorMetaStyle}>
                <span style={firmTypeBadgeStyle}>{advisor.firmType}</span>
                <span style={titleBadgeStyle}>{advisor.title}</span>
                <span style={locationStyle}>
                  <MapPin size={14} />
                  {advisor.headOfficeLocation || advisor.location}
                </span>
                <span style={{ ...membershipStatusStyle, ...getMembershipBadgeStyle(advisor.membershipStatus) }}>
                  {advisor.membershipStatus || "Status Unknown"}
                </span>
              </div>
            </div>
            <button onClick={onClose} style={closeButtonStyle}>
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div style={tabsContainerStyle}>
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    ...tabStyle,
                    ...(activeTab === tab.id ? activeTabStyle : {}),
                  }}
                >
                  <IconComponent size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div style={modalBodyStyle}>
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div style={tabContentStyle}>
              <div style={gridStyle}>
                <div style={infoCardStyle}>
                  <h3 style={cardTitleStyle}>
                    <Building2 size={18} />
                    Professional Information
                  </h3>
                  <div style={infoGridStyle}>
                    <InfoItem label="Full Name" value={advisor.fullName} />
                    <InfoItem label="Firm Type" value={advisor.firmType} />
                    <InfoItem label="Title" value={advisor.title} />
                    <InfoItem label="Experience" value={advisor.experience} />
                    <InfoItem label="Status" value={advisor.status.charAt(0).toUpperCase() + advisor.status.slice(1)} />
                  </div>
                  {advisor.bio && (
                    <div style={descriptionStyle}>
                      <strong>Bio:</strong>
                      <p>{advisor.bio}</p>
                    </div>
                  )}
                </div>

                <div style={infoCardStyle}>
                  <h3 style={cardTitleStyle}>
                    <Award size={18} />
                    Qualifications & Rating
                  </h3>
                  <div style={infoGridStyle}>
                    <InfoItem label="Qualifications" value={advisor.qualifications?.join(" • ") || "Not specified"} />
                    <InfoItem label="Hourly Rate" value={advisor.hourlyRate || "Not specified"} />
                    <div style={infoItemStyle}>
                      <strong style={{ color: "#7d5a50" }}>Rating:</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {renderStars(advisor.rating)}
                        <span style={{ color: "#4a352f" }}>({advisor.reviews} reviews)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={infoCardStyle}>
                  <h3 style={cardTitleStyle}>
                    <Globe size={18} />
                    Location & Contact
                  </h3>
                  <div style={infoGridStyle}>
                    <InfoItem label="Head Office" value={advisor.headOfficeLocation || advisor.location} />
                    <InfoItem label="Phone" value={advisor.phone} />
                    <InfoItem label="Email" value={advisor.email} />
                    {advisor.website && (
                      <div style={linkItemStyle}>
                        <strong>Website:</strong>
                        <a href={advisor.website} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                          Visit Website <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                    {advisor.linkedin && renderLinkedInLink(advisor.linkedin)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Expertise & Industries Tab */}
          {activeTab === "expertise" && (
            <div style={tabContentStyle}>
              <div style={gridStyle}>
                <div style={infoCardStyle}>
                  <h3 style={cardTitleStyle}>
                    <Target size={18} />
                    Areas of Expertise
                  </h3>
                  <div style={tagsContainerStyle}>
                    {advisor.expertise.map((exp, idx) => (
                      <span key={idx} style={tagStyle}>{exp}</span>
                    ))}
                  </div>
                </div>

                <div style={infoCardStyle}>
                  <h3 style={cardTitleStyle}>
                    <Briefcase size={18} />
                    Industries Served
                  </h3>
                  <div style={tagsContainerStyle}>
                    {advisor.industries.map((ind, idx) => (
                      <span key={idx} style={tagStyle}>{ind}</span>
                    ))}
                  </div>
                </div>

                {advisor.keyClients && advisor.keyClients.length > 0 && (
                  <div style={infoCardStyle}>
                    <h3 style={cardTitleStyle}>
                      <CheckCircle size={18} />
                      Key Clients
                    </h3>
                    <div style={tagsContainerStyle}>
                      {advisor.keyClients.map((client, idx) => (
                        <span key={idx} style={tagStyle}>{client}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === "contact" && (
            <div style={tabContentStyle}>
              <div style={gridStyle}>
                <div style={infoCardStyle}>
                  <h3 style={cardTitleStyle}>
                    <Mail size={18} />
                    Contact Details
                  </h3>
                  <div style={infoGridStyle}>
                    <InfoItem label="Email" value={advisor.email} />
                    <InfoItem label="Phone" value={advisor.phone} />
                    <InfoItem label="Office Location" value={advisor.headOfficeLocation || advisor.location} />
                  </div>
                </div>

                <div style={infoCardStyle}>
                  <h3 style={cardTitleStyle}>
                    <Globe size={18} />
                    Online Presence
                  </h3>
                  <div style={infoGridStyle}>
                    {advisor.website && (
                      <div style={linkItemStyle}>
                        <strong>Website:</strong>
                        <a href={advisor.website} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                          Visit Website <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                    {advisor.linkedin && renderLinkedInLink(advisor.linkedin)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div style={tabContentStyle}>
              <div style={infoCardStyle}>
                <h3 style={cardTitleStyle}>
                  <FileText size={18} />
                  Public Documents
                </h3>
                <div style={documentsGridStyle}>
                  {renderDocumentLink(advisor.documents?.profile, "Professional Profile")}
                  {(!advisor.documents || Object.keys(advisor.documents).length === 0) && (
                    <div style={emptyStateStyle}>No documents available</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// Helper Components for Modal
const InfoItem = ({ label, value }) => (
  <div style={infoItemStyle}>
    <strong style={{ color: "#7d5a50" }}>{label}:</strong>
    <span style={{ color: "#4a352f" }}>{value || "Not provided"}</span>
  </div>
);

// Modal Styles
const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: "20px",
};

const modalContentStyle = {
  background: "white",
  borderRadius: "12px",
  width: "100%",
  maxWidth: "900px",
  maxHeight: "90vh",
  overflow: "hidden",
  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
};

const modalHeaderStyle = {
  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
  color: "white",
  padding: "0",
};

const headerContentStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  padding: "24px",
};

const advisorHeaderStyle = {
  flex: 1,
};

const advisorNameStyle = {
  margin: "0 0 8px 0",
  fontSize: "24px",
  fontWeight: "700",
};

const advisorMetaStyle = {
  display: "flex",
  gap: "12px",
  alignItems: "center",
  flexWrap: "wrap",
};

const firmTypeBadgeStyle = {
  background: "rgba(255, 255, 255, 0.2)",
  padding: "4px 12px",
  borderRadius: "20px",
  fontSize: "14px",
  fontWeight: "600",
};

const titleBadgeStyle = {
  background: "rgba(255, 255, 255, 0.15)",
  padding: "4px 12px",
  borderRadius: "20px",
  fontSize: "14px",
  fontWeight: "500",
};

const membershipStatusStyle = {
  padding: "4px 12px",
  borderRadius: "20px",
  fontSize: "14px",
  fontWeight: "500",
};

const locationStyle = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  fontSize: "14px",
};

const closeButtonStyle = {
  background: "rgba(255, 255, 255, 0.2)",
  border: "none",
  borderRadius: "8px",
  padding: "8px",
  color: "white",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const tabsContainerStyle = {
  display: "flex",
  background: "rgba(255, 255, 255, 0.1)",
  padding: "0 24px",
  flexWrap: "wrap",
};

const tabStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "12px 16px",
  background: "none",
  border: "none",
  color: "rgba(255, 255, 255, 0.8)",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "500",
  borderBottom: "3px solid transparent",
  transition: "all 0.2s ease",
};

const activeTabStyle = {
  color: "white",
  borderBottomColor: "white",
  background: "rgba(255, 255, 255, 0.1)",
};

const modalBodyStyle = {
  padding: "0",
  maxHeight: "calc(90vh - 140px)",
  overflowY: "auto",
};

const tabContentStyle = {
  padding: "24px",
};

const gridStyle = {
  display: "grid",
  gap: "20px",
};

const infoCardStyle = {
  background: "#FEFCFA",
  border: "1px solid #E8D5C4",
  borderRadius: "8px",
  padding: "20px",
};

const cardTitleStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  margin: "0 0 16px 0",
  fontSize: "18px",
  fontWeight: "600",
  color: "#5D2A0A",
};

const infoGridStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const infoItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  flexWrap: "wrap",
  borderBottom: "1px solid #f0e6d9",
  paddingBottom: "8px",
};

const descriptionStyle = {
  marginTop: "16px",
  padding: "12px",
  background: "rgba(166, 124, 82, 0.05)",
  borderRadius: "6px",
  border: "1px solid #E8D5C4",
};

const tagsContainerStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
};

const tagStyle = {
  background: "rgba(166, 124, 82, 0.1)",
  padding: "6px 14px",
  borderRadius: "20px",
  fontSize: "13px",
  fontWeight: "500",
  color: "#5D2A0A",
};

const linkItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
  borderBottom: "1px solid #f0e6d9",
  paddingBottom: "8px",
};

const linkStyle = {
  color: "#a67c52",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  fontWeight: "500",
};

const emptyStateStyle = {
  textAlign: "center",
  color: "#999",
  fontStyle: "italic",
  padding: "40px",
  background: "#F9F9F9",
  borderRadius: "8px",
  border: "1px dashed #E8D5C4",
};

const documentsGridStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

// ---------- MAIN ADVISOR ECOSYSTEM COMPONENT ----------
function AdvisorEcosystem() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expertiseFilter, setExpertiseFilter] = useState("all");
  const [selectedAdvisor, setSelectedAdvisor] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [advisorData] = useState(mockAdvisors);

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
      "Business Name": advisor.fullName,
      "Firm Type": advisor.firmType,
      "Industries": advisor.industries.join(", "),
      "Head Office Location": advisor.headOfficeLocation,
      "Membership Status": advisor.membershipStatus,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Advisors");
    XLSX.writeFile(workbook, `Advisors_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getMembershipStatusBadge = (status) => {
    const statusColors = {
      "Active Partner": { background: '#e8f5e8', color: '#2e7d32' },
      "Pending Approval": { background: '#fff3e0', color: '#ed6c02' },
    };
    const colors = statusColors[status] || { background: '#fdeaea', color: '#c62828' };
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '500',
        background: colors.background,
        color: colors.color,
      }}>
        {status || "Unknown"}
      </span>
    );
  };

  const styles = {
    container: { padding: '24px', background: '#f5f7fa', minHeight: '100vh' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
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
    filterSelect: { padding: '10px 12px', border: '1px solid #e0d5c8', borderRadius: '8px', fontSize: '14px', background: 'white', cursor: 'pointer', color: '#4a352f' },
    tableContainer: { background: 'white', borderRadius: '12px', overflow: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '800px' },
    companyCell: { display: 'flex', alignItems: 'center', gap: '12px' },
    companyAvatar: { width: '40px', height: '40px', background: 'linear-gradient(135deg, #a67c52, #7d5a50)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' },
    companyName: { fontWeight: '600', color: '#4a352f' },
    companyEmail: { fontSize: '12px', color: '#7d5a50' },
    tags: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
    tag: { background: '#faf7f2', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', color: '#7d5a50' },
    viewBtn: { background: 'none', border: 'none', color: '#a67c52', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 12px', borderRadius: '6px' },
    pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' },
    paginationBtn: { background: 'white', border: '1px solid #e0d5c8', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#4a352f' },
    pageNumber: { color: '#7d5a50', fontSize: '14px' },
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
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Business Name</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Firm Type</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Industries</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Head Office Location</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Membership Status</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Actions</th>
            </tr>          </thead>
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
                <td style={{ padding: '16px', color: '#4a352f' }}>{advisor.firmType || "Not specified"}</td>
                <td style={{ padding: '16px' }}>
                  <div style={styles.tags}>
                    {advisor.industries.slice(0, 2).map((ind, i) => (
                      <span key={i} style={styles.tag}>{ind}</span>
                    ))}
                    {advisor.industries.length > 2 && (
                      <span style={styles.tag}>+{advisor.industries.length - 2}</span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '16px', color: '#4a352f' }}>{advisor.headOfficeLocation || advisor.location || "Not specified"}</td>
                <td style={{ padding: '16px' }}>{getMembershipStatusBadge(advisor.membershipStatus)}</td>
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
        <AdvisorDetailsModal 
          advisor={selectedAdvisor} 
          isOpen={showViewModal} 
          onClose={() => setShowViewModal(false)} 
        />
      )}
    </div>
  );
}

export default AdvisorEcosystem;