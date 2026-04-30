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
  TrendingUp,
  Building2,
  Globe,
  Target,
  Award,
  FileText,
  ExternalLink,
  DollarSign,
  Clock,
  CheckCircle,
  Linkedin,
} from "lucide-react";
import * as XLSX from 'xlsx';

// ---------- MOCK DATA (Placeholder details - No Backend) ----------
const mockInvestors = [
  {
    id: "1",
    username: "cape_capital",
    email: "info@capecapital.co.za",
    fundName: "Cape Capital Partners",
    firmType: "Venture Capital",
    focusAreas: ["Tech", "SaaS", "Fintech"],
    committedCapital: "R250,000,000",
    minFunding: "R5,000,000",
    maxFunding: "R20,000,000",
    stagePreference: "Seed to Series A",
    location: "Cape Town",
    headOfficeLocation: "Cape Town, Western Cape",
    membershipStatus: "Active Partner",
    phone: "+27 21 123 4567",
    website: "https://capecapital.co.za",
    linkedin: "https://linkedin.com/company/capecapital",
    status: "active",
    createdAt: new Date("2023-06-15"),
    portfolioCount: 24,
    totalInvested: "R150M",
    description: "Venture capital firm investing in early-stage technology companies across Africa.",
    teamSize: 8,
    keyContacts: [
      { name: "John Smith", role: "Managing Partner", email: "john@capecapital.co.za" },
      { name: "Lisa Moyo", role: "Investment Director", email: "lisa@capecapital.co.za" },
    ],
    investmentThesis: "We invest in disruptive technology companies solving real African problems.",
    documents: {
      profile: "/docs/cape-capital-profile.pdf",
      portfolioReport: "/docs/cape-capital-portfolio.pdf",
    },
  },
  {
    id: "2",
    username: "jhb_invest",
    email: "hello@jhbinvest.co.za",
    fundName: "Johannesburg Investment Group",
    firmType: "Private Equity",
    focusAreas: ["Manufacturing", "Logistics", "Healthcare"],
    committedCapital: "R500,000,000",
    minFunding: "R20,000,000",
    maxFunding: "R100,000,000",
    stagePreference: "Growth Stage",
    location: "Johannesburg",
    headOfficeLocation: "Johannesburg, Gauteng",
    membershipStatus: "Active Partner",
    phone: "+27 11 987 6543",
    website: "https://jhbinvest.co.za",
    linkedin: "https://linkedin.com/company/jhbinvest",
    status: "active",
    createdAt: new Date("2023-08-22"),
    portfolioCount: 18,
    totalInvested: "R450M",
    description: "Private equity firm focused on established businesses with growth potential.",
    teamSize: 12,
    keyContacts: [
      { name: "Thabo Nkosi", role: "Senior Partner", email: "thabo@jhbinvest.co.za" },
    ],
    investmentThesis: "Investing in market-leading businesses with strong management teams.",
    documents: {
      profile: "/docs/jhb-invest-profile.pdf",
    },
  },
  {
    id: "3",
    username: "angel_fund",
    email: "contact@angelfund.co.za",
    fundName: "Angel Investment Network",
    firmType: "Angel Investor",
    focusAreas: ["Tech", "E-commerce", "Mobile Apps"],
    committedCapital: "R50,000,000",
    minFunding: "R500,000",
    maxFunding: "R2,000,000",
    stagePreference: "Pre-seed to Seed",
    location: "Durban",
    headOfficeLocation: "Durban, KwaZulu-Natal",
    membershipStatus: "Pending Approval",
    phone: "+27 31 456 7890",
    website: "https://angelfund.co.za",
    status: "pending",
    createdAt: new Date("2024-01-10"),
    portfolioCount: 35,
    totalInvested: "R45M",
    description: "Angel investor network backing innovative tech startups.",
    teamSize: 4,
    keyContacts: [
      { name: "Sarah Chen", role: "Network Director", email: "sarah@angelfund.co.za" },
    ],
    investmentThesis: "Supporting early-stage founders with capital and mentorship.",
    documents: {},
  },
  {
    id: "4",
    username: "family_office_sa",
    email: "info@familyoffice.co.za",
    fundName: "Legacy Family Office",
    firmType: "Family Office",
    focusAreas: ["Real Estate", "Hospitality", "AgriTech"],
    committedCapital: "R300,000,000",
    minFunding: "R10,000,000",
    maxFunding: "R50,000,000",
    stagePreference: "Series A to Series B",
    location: "Pretoria",
    headOfficeLocation: "Pretoria, Gauteng",
    membershipStatus: "Active Partner",
    phone: "+27 12 345 6789",
    website: "https://familyoffice.co.za",
    linkedin: "https://linkedin.com/company/familyoffice",
    status: "active",
    createdAt: new Date("2023-11-05"),
    portfolioCount: 12,
    totalInvested: "R280M",
    description: "Family office investing in sustainable businesses across multiple sectors.",
    teamSize: 6,
    keyContacts: [
      { name: "William van der Merwe", role: "Investment Manager", email: "william@familyoffice.co.za" },
    ],
    investmentThesis: "Long-term value creation through sustainable investments.",
    documents: {
      profile: "/docs/family-office-profile.pdf",
    },
  },
  {
    id: "5",
    username: "eco_invest",
    email: "hello@ecoinvest.co.za",
    fundName: "Eco-Invest Fund",
    firmType: "Venture Capital",
    focusAreas: ["CleanTech", "Renewable Energy", "Sustainability"],
    committedCapital: "R120,000,000",
    minFunding: "R2,000,000",
    maxFunding: "R15,000,000",
    stagePreference: "Seed to Series A",
    location: "Stellenbosch",
    headOfficeLocation: "Stellenbosch, Western Cape",
    membershipStatus: "Active Partner",
    phone: "+27 21 876 5432",
    website: "https://ecoinvest.co.za",
    linkedin: "https://linkedin.com/company/ecoinvest",
    status: "active",
    createdAt: new Date("2023-09-18"),
    portfolioCount: 16,
    totalInvested: "R95M",
    description: "Venture capital fund focused on climate tech and renewable energy.",
    teamSize: 7,
    keyContacts: [
      { name: "Emma Watson", role: "Fund Manager", email: "emma@ecoinvest.co.za" },
    ],
    investmentThesis: "Funding the transition to a sustainable African economy.",
    documents: {
      profile: "/docs/eco-invest-profile.pdf",
      portfolioReport: "/docs/eco-invest-portfolio.pdf",
    },
  },
];

const investorTypes = ["Venture Capital", "Private Equity", "Angel Investor", "Family Office"];

// ---------- INVESTOR DETAILS MODAL (With Tabs) ----------
const InvestorDetailsModal = ({ investor, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !investor || !mounted) return null;

  // Helper functions
  const formatLabel = (value) => {
    if (!value) return "Not provided";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return value;
  };

  // Tabs configuration
  const tabs = [
    { id: "overview", label: "Overview", icon: Building2 },
    { id: "investment", label: "Investment Profile", icon: Target },
    { id: "team", label: "Team & Contacts", icon: Users },
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
            <div style={investorHeaderStyle}>
              <h2 style={investorNameStyle}>{investor.fundName}</h2>
              <div style={investorMetaStyle}>
                <span style={firmTypeBadgeStyle}>{investor.firmType}</span>
                <span style={locationStyle}>
                  <MapPin size={14} />
                  {investor.headOfficeLocation || investor.location}
                </span>
                <span style={{ ...membershipStatusStyle, ...getMembershipBadgeStyle(investor.membershipStatus) }}>
                  {investor.membershipStatus || "Status Unknown"}
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
                    Organization Information
                  </h3>
                  <div style={infoGridStyle}>
                    <InfoItem label="Fund Name" value={investor.fundName} />
                    <InfoItem label="Firm Type" value={investor.firmType} />
                    <InfoItem label="Status" value={formatLabel(investor.status)} />
                    <InfoItem label="Founded / Started" value={investor.createdAt ? new Date(investor.createdAt).getFullYear() : "Not specified"} />
                    <InfoItem label="Portfolio Companies" value={investor.portfolioCount} />
                    <InfoItem label="Team Size" value={investor.teamSize || "Not specified"} />
                  </div>
                  {investor.description && (
                    <div style={descriptionStyle}>
                      <strong>Description:</strong>
                      <p>{investor.description}</p>
                    </div>
                  )}
                </div>

                <div style={infoCardStyle}>
                  <h3 style={cardTitleStyle}>
                    <Target size={18} />
                    Focus Areas
                  </h3>
                  <div style={tagsContainerStyle}>
                    {investor.focusAreas.map((area, idx) => (
                      <span key={idx} style={tagStyle}>{area}</span>
                    ))}
                  </div>
                </div>

                <div style={infoCardStyle}>
                  <h3 style={cardTitleStyle}>
                    <Globe size={18} />
                    Location & Contact
                  </h3>
                  <div style={infoGridStyle}>
                    <InfoItem label="Head Office" value={investor.headOfficeLocation || investor.location} />
                    <InfoItem label="Phone" value={investor.phone} />
                    <InfoItem label="Email" value={investor.email} />
                    {investor.website && (
                      <div style={linkItemStyle}>
                        <strong>Website:</strong>
                        <a href={investor.website} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                          Visit Website <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                    {investor.linkedin && renderLinkedInLink(investor.linkedin)}
                  </div>
                </div>

                <div style={infoCardStyle}>
                  <h3 style={cardTitleStyle}>
                    <DollarSign size={18} />
                    Financial Overview
                  </h3>
                  <div style={infoGridStyle}>
                    <InfoItem label="Committed Capital" value={investor.committedCapital} />
                    <InfoItem label="Min Funding" value={investor.minFunding} />
                    <InfoItem label="Max Funding" value={investor.maxFunding} />
                    <InfoItem label="Total Invested to Date" value={investor.totalInvested || "Not specified"} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Investment Profile Tab */}
          {activeTab === "investment" && (
            <div style={tabContentStyle}>
              <div style={gridStyle}>
                <div style={infoCardStyle}>
                  <h3 style={cardTitleStyle}>
                    <Target size={18} />
                    Investment Criteria
                  </h3>
                  <div style={infoGridStyle}>
                    <InfoItem label="Stage Preference" value={investor.stagePreference} />
                    <InfoItem label="Ticket Size Range" value={`${investor.minFunding} - ${investor.maxFunding}`} />
                    <InfoItem label="Focus Areas" value={investor.focusAreas.join(" • ")} />
                  </div>
                  {investor.investmentThesis && (
                    <div style={descriptionStyle}>
                      <strong>Investment Thesis:</strong>
                      <p>{investor.investmentThesis}</p>
                    </div>
                  )}
                </div>

                <div style={infoCardStyle}>
                  <h3 style={cardTitleStyle}>
                    <Award size={18} />
                    Track Record
                  </h3>
                  <div style={infoGridStyle}>
                    <InfoItem label="Portfolio Companies" value={investor.portfolioCount} />
                    <InfoItem label="Total Capital Deployed" value={investor.totalInvested || "Not specified"} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Team & Contacts Tab */}
          {activeTab === "team" && (
            <div style={tabContentStyle}>
              <div style={gridStyle}>
                <div style={infoCardStyle}>
                  <h3 style={cardTitleStyle}>
                    <Users size={18} />
                    Key Contacts
                  </h3>
                  {investor.keyContacts && investor.keyContacts.length > 0 ? (
                    <div style={contactsListStyle}>
                      {investor.keyContacts.map((contact, idx) => (
                        <div key={idx} style={contactCardStyle}>
                          <strong>{contact.name}</strong>
                          <span>{contact.role}</span>
                          <a href={`mailto:${contact.email}`} style={contactEmailStyle}>
                            <Mail size={12} /> {contact.email}
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={emptyStateStyle}>No key contacts listed</div>
                  )}
                </div>

                <div style={infoCardStyle}>
                  <h3 style={cardTitleStyle}>
                    <Users size={18} />
                    Team Overview
                  </h3>
                  <div style={infoGridStyle}>
                    <InfoItem label="Total Team Size" value={investor.teamSize || "Not specified"} />
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
                  {renderDocumentLink(investor.documents?.profile, "Firm Profile")}
                  {renderDocumentLink(investor.documents?.portfolioReport, "Portfolio Report")}
                  {(!investor.documents || Object.keys(investor.documents).length === 0) && (
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

const investorHeaderStyle = {
  flex: 1,
};

const investorNameStyle = {
  margin: "0 0 8px 0",
  fontSize: "24px",
  fontWeight: "700",
};

const investorMetaStyle = {
  display: "flex",
  gap: "16px",
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

const contactEmailStyle = {
  color: "#a67c52",
  textDecoration: "none",
  fontSize: "12px",
  display: "flex",
  alignItems: "center",
  gap: "4px",
};

const contactsListStyle = {
  display: "grid",
  gap: "12px",
};

const contactCardStyle = {
  background: "rgba(166, 124, 82, 0.05)",
  padding: "12px",
  borderRadius: "8px",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  border: "1px solid #E8D5C4",
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

// ---------- MAIN INVESTOR ECOSYSTEM COMPONENT ----------
function InvestorEcosystem() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [investorData] = useState(mockInvestors);

  const stats = {
    total: investorData.length,
    active: investorData.filter(i => i.status === 'active').length,
    totalCapital: 1220000000,
    avgInvestment: 24400000
  };

  const filteredInvestors = investorData.filter((investor) => {
    const matchesSearch = investor.fundName.toLowerCase().includes(searchTerm.toLowerCase()) || investor.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || investor.firmType === typeFilter;
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
      "Business Name": investor.fundName,
      "Firm Type": investor.firmType,
      "Committed Capital": investor.committedCapital,
      "Min Funding": investor.minFunding,
      "Max Funding": investor.maxFunding,
      "Head Office Location": investor.headOfficeLocation,
      "Membership Status": investor.membershipStatus,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Investors");
    XLSX.writeFile(workbook, `Investors_${new Date().toISOString().split('T')[0]}.xlsx`);
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
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '1000px' },
    companyCell: { display: 'flex', alignItems: 'center', gap: '12px' },
    companyAvatar: { width: '40px', height: '40px', background: 'linear-gradient(135deg, #a67c52, #7d5a50)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' },
    companyName: { fontWeight: '600', color: '#4a352f' },
    companyEmail: { fontSize: '12px', color: '#7d5a50' },
    viewBtn: { background: 'none', border: 'none', color: '#a67c52', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 12px', borderRadius: '6px' },
    pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' },
    paginationBtn: { background: 'white', border: '1px solid #e0d5c8', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#4a352f' },
    pageNumber: { color: '#7d5a50', fontSize: '14px' },
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
        <div style={styles.statCard}><TrendingUp size={24} style={styles.statIcon} /><div style={styles.statInfo}><h3 style={{ margin: 0, fontSize: '24px', color: '#4a352f' }}>{stats.total}</h3><p style={{ margin: 0, color: '#7d5a50' }}>Total Investors</p></div></div>
        <div style={styles.statCard}><Building2 size={24} style={styles.statIcon} /><div style={styles.statInfo}><h3 style={{ margin: 0, fontSize: '24px', color: '#4a352f' }}>{formatCurrency(stats.totalCapital)}</h3><p style={{ margin: 0, color: '#7d5a50' }}>Total Capital Available</p></div></div>
        <div style={styles.statCard}><Target size={24} style={styles.statIcon} /><div style={styles.statInfo}><h3 style={{ margin: 0, fontSize: '24px', color: '#4a352f' }}>{formatCurrency(stats.avgInvestment)}</h3><p style={{ margin: 0, color: '#7d5a50' }}>Avg. Investment Size</p></div></div>
        <div style={styles.statCard}><Users size={24} style={styles.statIcon} /><div style={styles.statInfo}><h3 style={{ margin: 0, fontSize: '24px', color: '#4a352f' }}>{stats.active}</h3><p style={{ margin: 0, color: '#7d5a50' }}>Active Members</p></div></div>
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
          <thead>
            <tr style={{ borderBottom: '1px solid #f0e6d9', background: '#faf7f2' }}>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Business Name</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Firm Type</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Committed Capital</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Min Funding</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Max Funding</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Head Office Location</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Membership Status</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentInvestors.map((investor) => (
              <tr key={investor.id} style={{ borderBottom: '1px solid #f0e6d9' }}>
                <td style={{ padding: '16px' }}>
                  <div style={styles.companyCell}>
                    <div style={styles.companyAvatar}>{investor.fundName.charAt(0).toUpperCase()}</div>
                    <div>
                      <div style={styles.companyName}>{investor.fundName}</div>
                      <div style={styles.companyEmail}>{investor.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px', color: '#4a352f' }}>{investor.firmType}</td>
                <td style={{ padding: '16px', color: '#4a352f', fontWeight: '500' }}>{investor.committedCapital}</td>
                <td style={{ padding: '16px', color: '#4a352f' }}>{investor.minFunding}</td>
                <td style={{ padding: '16px', color: '#4a352f' }}>{investor.maxFunding}</td>
                <td style={{ padding: '16px', color: '#4a352f' }}>{investor.headOfficeLocation || investor.location || "Not specified"}</td>
                <td style={{ padding: '16px' }}>{getMembershipStatusBadge(investor.membershipStatus)}</td>
                <td style={{ padding: '16px' }}>
                  <button 
                    style={styles.viewBtn} 
                    onClick={() => { setSelectedInvestor(investor); setShowViewModal(true); }}
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
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} style={{ ...styles.paginationBtn, opacity: currentPage === 1 ? 0.5 : 1 }}><ChevronLeft size={16} /> Previous</button>
          <span style={styles.pageNumber}>Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} style={{ ...styles.paginationBtn, opacity: currentPage === totalPages ? 0.5 : 1 }}>Next <ChevronRight size={16} /></button>
        </div>
      )}

      {showViewModal && selectedInvestor && (
        <InvestorDetailsModal 
          investor={selectedInvestor} 
          isOpen={showViewModal} 
          onClose={() => setShowViewModal(false)} 
        />
      )}
    </div>
  );
}

export default InvestorEcosystem;