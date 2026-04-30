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
  Calendar,
  Target,
  Rocket,
  Award,
  FileText,
  ExternalLink,
  Clock,
  Briefcase,
  CheckCircle,
  Globe,
  Linkedin,
} from "lucide-react";
import * as XLSX from 'xlsx';

// ---------- MOCK DATA (Placeholder details - No Backend) ----------
const mockCatalysts = [
  {
    id: "1",
    username: "tech_innovators",
    email: "info@techinnovators.co.za",
    organizationName: "Tech Innovators Hub",
    programType: "Accelerator",
    firmType: "Non-Profit Organization",
    focusAreas: ["AI", "Fintech", "SaaS"],
    duration: "12 weeks",
    cohortSize: "15-20 companies",
    location: "Cape Town",
    headOfficeLocation: "Cape Town, Western Cape",
    membershipStatus: "Active Partner",
    phone: "+27 21 123 4567",
    website: "https://techinnovators.co.za",
    linkedin: "https://linkedin.com/company/techinnovators",
    description: "Leading technology accelerator focused on AI and fintech startups across Africa.",
    status: "active",
    createdAt: new Date("2023-06-15"),
    alumniCount: 87,
    successRate: "85%",
    programDetails: {
      applicationPeriod: "January - March",
      programFee: "R5,000",
      equityRequired: "5-7%",
      mentorship: "Yes, 20+ mentors",
      fundingProvided: "Up to R500k",
      demoDay: "Yes",
      virtualOption: "Yes",
    },
    teamSize: 12,
    keyContacts: [
      { name: "Sarah Johnson", role: "Program Director", email: "sarah@techinnovators.co.za" },
      { name: "Mike Peters", role: "Mentorship Coordinator", email: "mike@techinnovators.co.za" },
    ],
    successStories: [
      { company: "FinTech Startup X", achievement: "Raised R2M post-program" },
      { company: "AI Health Solutions", achievement: "Acquired by major healthcare provider" },
    ],
    documents: {
      brochure: "/docs/tech-innovators-brochure.pdf",
      applicationGuide: "/docs/tech-innovators-guide.pdf",
    },
  },
  {
    id: "2",
    username: "green_future",
    email: "hello@greenfuture.co.za",
    organizationName: "Green Future Incubator",
    programType: "Incubator",
    firmType: "Social Enterprise",
    focusAreas: ["CleanTech", "Renewable Energy", "Sustainability"],
    duration: "6 months",
    cohortSize: "10-12 companies",
    location: "Johannesburg",
    headOfficeLocation: "Johannesburg, Gauteng",
    membershipStatus: "Active Partner",
    phone: "+27 11 987 6543",
    website: "https://greenfuture.co.za",
    linkedin: "https://linkedin.com/company/greenfuture",
    description: "Incubator supporting cleantech and sustainable energy startups.",
    status: "active",
    createdAt: new Date("2023-08-22"),
    alumniCount: 45,
    successRate: "78%",
    programDetails: {
      applicationPeriod: "Rolling",
      programFee: "R2,500",
      equityRequired: "3-5%",
      mentorship: "Yes, industry experts",
      fundingProvided: "Up to R250k",
      demoDay: "Yes",
      virtualOption: "Yes",
    },
    teamSize: 8,
    keyContacts: [
      { name: "Lisa Green", role: "Program Manager", email: "lisa@greenfuture.co.za" },
    ],
    successStories: [
      { company: "SolarStart", achievement: "Secured R1.5M in seed funding" },
    ],
    documents: {
      brochure: "/docs/green-future-brochure.pdf",
    },
  },
  {
    id: "3",
    username: "retail_lab",
    email: "info@retaillab.co.za",
    organizationName: "Retail Innovation Lab",
    programType: "Hub",
    firmType: "For-Profit",
    focusAreas: ["Retail Tech", "E-commerce", "Logistics"],
    duration: "Ongoing",
    cohortSize: "25+ members",
    location: "Durban",
    headOfficeLocation: "Durban, KwaZulu-Natal",
    membershipStatus: "Pending Approval",
    phone: "+27 31 456 7890",
    website: "https://retaillab.co.za",
    description: "Innovation hub connecting retail startups with industry partners.",
    status: "pending",
    createdAt: new Date("2024-01-10"),
    alumniCount: 32,
    successRate: "N/A",
    programDetails: {
      applicationPeriod: "Quarterly",
      programFee: "R1,000/month",
      equityRequired: "None",
      mentorship: "Yes",
      fundingProvided: "Network access only",
      demoDay: "No",
      virtualOption: "Hybrid",
    },
    teamSize: 5,
    keyContacts: [
      { name: "David Chen", role: "Hub Manager", email: "david@retaillab.co.za" },
    ],
    successStories: [],
    documents: {},
  },
  {
    id: "4",
    username: "health_hub",
    email: "contact@healthhub.co.za",
    organizationName: "HealthTech Hub",
    programType: "Accelerator",
    firmType: "Non-Profit Organization",
    focusAreas: ["HealthTech", "MedTech", "Wellness"],
    duration: "10 weeks",
    cohortSize: "12-15 companies",
    location: "Pretoria",
    headOfficeLocation: "Pretoria, Gauteng",
    membershipStatus: "Active Partner",
    phone: "+27 12 345 6789",
    website: "https://healthhub.co.za",
    linkedin: "https://linkedin.com/company/healthhub",
    description: "Accelerator program for health technology and medical innovation startups.",
    status: "active",
    createdAt: new Date("2023-11-05"),
    alumniCount: 54,
    successRate: "82%",
    programDetails: {
      applicationPeriod: "February - April",
      programFee: "R3,000",
      equityRequired: "4-6%",
      mentorship: "Yes, medical professionals",
      fundingProvided: "Up to R350k",
      demoDay: "Yes",
      virtualOption: "Yes",
    },
    teamSize: 10,
    keyContacts: [
      { name: "Dr. Amanda Smith", role: "Clinical Advisor", email: "amanda@healthhub.co.za" },
      { name: "Paul Jacobs", role: "Program Lead", email: "paul@healthhub.co.za" },
    ],
    successStories: [
      { company: "MediApp", achievement: "Piloted in 5 hospitals" },
      { company: "WellnessConnect", achievement: "10,000+ active users" },
    ],
    documents: {
      brochure: "/docs/healthhub-brochure.pdf",
      applicationGuide: "/docs/healthhub-guide.pdf",
    },
  },
  {
    id: "5",
    username: "agri_growth",
    email: "info@agrigrowth.co.za",
    organizationName: "AgriGrowth Programme",
    programType: "Program",
    firmType: "Public Benefit Organization",
    focusAreas: ["AgriTech", "Farming", "Food Security"],
    duration: "8 weeks",
    cohortSize: "20 companies",
    location: "Stellenbosch",
    headOfficeLocation: "Stellenbosch, Western Cape",
    membershipStatus: "Active Partner",
    phone: "+27 21 876 5432",
    website: "https://agrigrowth.co.za",
    description: "Support program for agricultural technology and farming innovation.",
    status: "active",
    createdAt: new Date("2023-09-18"),
    alumniCount: 68,
    successRate: "75%",
    programDetails: {
      applicationPeriod: "August - October",
      programFee: "Free",
      equityRequired: "None",
      mentorship: "Yes, agricultural experts",
      fundingProvided: "Grant funding available",
      demoDay: "Yes",
      virtualOption: "Yes",
    },
    teamSize: 7,
    keyContacts: [
      { name: "Thabo Nkosi", role: "Program Director", email: "thabo@agrigrowth.co.za" },
    ],
    successStories: [
      { company: "FarmConnect", achievement: "Expanded to 500+ farmers" },
      { company: "CropSense", achievement: "Won national agritech award" },
    ],
    documents: {
      brochure: "/docs/agrigrowth-brochure.pdf",
      applicationGuide: "/docs/agrigrowth-guide.pdf",
    },
  },
];

const programTypes = ["Accelerator", "Incubator", "Hub", "Program"];

// ---------- CATALYST DETAILS MODAL (With Tabs) ----------
const CatalystDetailsModal = ({ catalyst, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !catalyst || !mounted) return null;

  // Helper functions
  const formatLabel = (value) => {
    if (!value) return "Not provided";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Tabs configuration
  const tabs = [
    { id: "overview", label: "Overview", icon: Building2 },
    { id: "program", label: "Program Details", icon: Rocket },
    { id: "team", label: "Team & Contacts", icon: Users },
    { id: "success", label: "Success Stories", icon: Award },
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
            <div style={catalystHeaderStyle}>
              <h2 style={catalystNameStyle}>{catalyst.organizationName}</h2>
              <div style={catalystMetaStyle}>
                <span style={programTypeBadgeStyle}>{catalyst.programType}</span>
                <span style={entityTypeStyle}>{catalyst.firmType || "Organization"}</span>
                <span style={locationStyle}>
                  <MapPin size={14} />
                  {catalyst.headOfficeLocation || catalyst.location}
                </span>
                <span style={{ ...membershipStatusStyle, ...getMembershipBadgeStyle(catalyst.membershipStatus) }}>
                  {catalyst.membershipStatus || "Status Unknown"}
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
                    <InfoItem label="Organization Name" value={catalyst.organizationName} />
                    <InfoItem label="Program Type" value={catalyst.programType} />
                    <InfoItem label="Firm Type" value={catalyst.firmType} />
                    <InfoItem label="Status" value={formatLabel(catalyst.status)} />
                    <InfoItem label="Founded / Started" value={catalyst.createdAt ? new Date(catalyst.createdAt).getFullYear() : "Not specified"} />
                  </div>
                  {catalyst.description && (
                    <div style={descriptionStyle}>
                      <strong>Description:</strong>
                      <p>{catalyst.description}</p>
                    </div>
                  )}
                </div>

                <div style={infoCardStyle}>
                  <h3 style={cardTitleStyle}>
                    <Target size={18} />
                    Focus Areas
                  </h3>
                  <div style={tagsContainerStyle}>
                    {catalyst.focusAreas.map((area, idx) => (
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
                    <InfoItem label="Head Office" value={catalyst.headOfficeLocation || catalyst.location} />
                    <InfoItem label="Phone" value={catalyst.phone} />
                    <InfoItem label="Email" value={catalyst.email} />
                    {catalyst.website && (
                      <div style={linkItemStyle}>
                        <strong>Website:</strong>
                        <a href={catalyst.website} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                          Visit Website <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                    {catalyst.linkedin && renderLinkedInLink(catalyst.linkedin)}
                  </div>
                </div>

                <div style={infoCardStyle}>
                  <h3 style={cardTitleStyle}>
                    <TrendingUp size={18} />
                    Impact Metrics
                  </h3>
                  <div style={infoGridStyle}>
                    <InfoItem label="Alumni Companies" value={catalyst.alumniCount} />
                    <InfoItem label="Success Rate" value={catalyst.successRate} />
                    <InfoItem label="Team Size" value={catalyst.teamSize || "Not specified"} />
                    <InfoItem label="Cohort Size" value={catalyst.cohortSize} />
                    <InfoItem label="Program Duration" value={catalyst.duration} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Program Details Tab */}
          {activeTab === "program" && catalyst.programDetails && (
            <div style={tabContentStyle}>
              <div style={gridStyle}>
                <div style={infoCardStyle}>
                  <h3 style={cardTitleStyle}>
                    <Rocket size={18} />
                    Program Information
                  </h3>
                  <div style={infoGridStyle}>
                    <InfoItem label="Application Period" value={catalyst.programDetails.applicationPeriod} />
                    <InfoItem label="Program Fee" value={catalyst.programDetails.programFee} />
                    <InfoItem label="Equity Required" value={catalyst.programDetails.equityRequired} />
                    <InfoItem label="Mentorship" value={catalyst.programDetails.mentorship} />
                    <InfoItem label="Funding Provided" value={catalyst.programDetails.fundingProvided} />
                    <InfoItem label="Demo Day" value={catalyst.programDetails.demoDay} />
                    <InfoItem label="Virtual Option" value={catalyst.programDetails.virtualOption} />
                  </div>
                </div>

                <div style={infoCardStyle}>
                  <h3 style={cardTitleStyle}>
                    <Clock size={18} />
                    Timeline & Commitment
                  </h3>
                  <div style={infoGridStyle}>
                    <InfoItem label="Duration" value={catalyst.duration} />
                    <InfoItem label="Cohort Size" value={catalyst.cohortSize} />
                    <InfoItem label="Expected Commitment" value="Full-time during program" />
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
                  {catalyst.keyContacts && catalyst.keyContacts.length > 0 ? (
                    <div style={contactsListStyle}>
                      {catalyst.keyContacts.map((contact, idx) => (
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
                    <InfoItem label="Total Team Size" value={catalyst.teamSize || "Not specified"} />
                    <InfoItem label="Mentors Network" value={catalyst.programDetails?.mentorship || "Not specified"} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success Stories Tab */}
          {activeTab === "success" && (
            <div style={tabContentStyle}>
              <div style={infoCardStyle}>
                <h3 style={cardTitleStyle}>
                  <Award size={18} />
                  Success Stories
                </h3>
                {catalyst.successStories && catalyst.successStories.length > 0 ? (
                  <div style={storiesListStyle}>
                    {catalyst.successStories.map((story, idx) => (
                      <div key={idx} style={storyCardStyle}>
                        <div style={storyCompanyStyle}>
                          <CheckCircle size={16} color="#2e7d32" />
                          <strong>{story.company}</strong>
                        </div>
                        <span style={storyAchievementStyle}>{story.achievement}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={emptyStateStyle}>No success stories available yet</div>
                )}
              </div>

              <div style={infoCardStyle}>
                <h3 style={cardTitleStyle}>
                  <TrendingUp size={18} />
                  Overall Impact
                </h3>
                <div style={infoGridStyle}>
                  <InfoItem label="Total Alumni Companies" value={catalyst.alumniCount} />
                  <InfoItem label="Success Rate" value={catalyst.successRate} />
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
                  {renderDocumentLink(catalyst.documents?.brochure, "Program Brochure")}
                  {renderDocumentLink(catalyst.documents?.applicationGuide, "Application Guide")}
                  {(!catalyst.documents || Object.keys(catalyst.documents).length === 0) && (
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

const catalystHeaderStyle = {
  flex: 1,
};

const catalystNameStyle = {
  margin: "0 0 8px 0",
  fontSize: "24px",
  fontWeight: "700",
};

const catalystMetaStyle = {
  display: "flex",
  gap: "16px",
  alignItems: "center",
  flexWrap: "wrap",
};

const programTypeBadgeStyle = {
  background: "rgba(255, 255, 255, 0.2)",
  padding: "4px 12px",
  borderRadius: "20px",
  fontSize: "14px",
  fontWeight: "600",
};

const entityTypeStyle = {
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

const storiesListStyle = {
  display: "grid",
  gap: "12px",
};

const storyCardStyle = {
  background: "rgba(166, 124, 82, 0.05)",
  padding: "12px",
  borderRadius: "8px",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  border: "1px solid #E8D5C4",
};

const storyCompanyStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontWeight: "600",
  color: "#5D2A0A",
};

const storyAchievementStyle = {
  fontSize: "13px",
  color: "#7d5a50",
  marginLeft: "24px",
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

// ---------- MAIN CATALYST ECOSYSTEM COMPONENT ----------
function CatalystEcosystem() {
  const [searchTerm, setSearchTerm] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [selectedCatalyst, setSelectedCatalyst] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [catalystData] = useState(mockCatalysts);

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
      "Business Name": catalyst.organizationName,
      "Programme Type": catalyst.programType,
      "Firm Type": catalyst.firmType,
      "Head Office Location": catalyst.headOfficeLocation,
      "Membership Status": catalyst.membershipStatus,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Catalysts");
    XLSX.writeFile(workbook, `Catalysts_${new Date().toISOString().split('T')[0]}.xlsx`);
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
    viewBtn: { background: 'none', border: 'none', color: '#a67c52', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 12px', borderRadius: '6px' },
    pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' },
    paginationBtn: { background: 'white', border: '1px solid #e0d5c8', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#4a352f' },
    pageNumber: { color: '#7d5a50', fontSize: '14px' },
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
        <div style={styles.statCard}><Building2 size={24} style={styles.statIcon} /><div style={styles.statInfo}><h3 style={{ margin: 0, fontSize: '24px', color: '#4a352f' }}>{stats.total}</h3><p style={{ margin: 0, color: '#7d5a50' }}>Total Catalysts</p></div></div>
        <div style={styles.statCard}><Rocket size={24} style={styles.statIcon} /><div style={styles.statInfo}><h3 style={{ margin: 0, fontSize: '24px', color: '#4a352f' }}>{stats.programs}</h3><p style={{ margin: 0, color: '#7d5a50' }}>Program Types</p></div></div>
        <div style={styles.statCard}><Users size={24} style={styles.statIcon} /><div style={styles.statInfo}><h3 style={{ margin: 0, fontSize: '24px', color: '#4a352f' }}>{stats.alumniCount}</h3><p style={{ margin: 0, color: '#7d5a50' }}>Alumni Companies</p></div></div>
        <div style={styles.statCard}><TrendingUp size={24} style={styles.statIcon} /><div style={styles.statInfo}><h3 style={{ margin: 0, fontSize: '24px', color: '#4a352f' }}>{stats.active}</h3><p style={{ margin: 0, color: '#7d5a50' }}>Active Programs</p></div></div>
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
          <thead>
            <tr style={{ borderBottom: '1px solid #f0e6d9', background: '#faf7f2' }}>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Business Name</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Programme Type</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Firm Type</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Head Office Location</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Membership Status</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentCatalysts.map((catalyst) => (
              <tr key={catalyst.id} style={{ borderBottom: '1px solid #f0e6d9' }}>
                <td style={{ padding: '16px' }}>
                  <div style={styles.companyCell}>
                    <div style={styles.companyAvatar}>{catalyst.organizationName.charAt(0).toUpperCase()}</div>
                    <div>
                      <div style={styles.companyName}>{catalyst.organizationName}</div>
                      <div style={styles.companyEmail}>{catalyst.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px', color: '#4a352f' }}>{catalyst.programType}</td>
                <td style={{ padding: '16px', color: '#4a352f' }}>{catalyst.firmType || "Not specified"}</td>
                <td style={{ padding: '16px', color: '#4a352f' }}>{catalyst.headOfficeLocation || catalyst.location || "Not specified"}</td>
                <td style={{ padding: '16px' }}>{getMembershipStatusBadge(catalyst.membershipStatus)}</td>
                <td style={{ padding: '16px' }}>
                  <button 
                    style={styles.viewBtn} 
                    onClick={() => { setSelectedCatalyst(catalyst); setShowViewModal(true); }}
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

      {showViewModal && selectedCatalyst && (
        <CatalystDetailsModal 
          catalyst={selectedCatalyst} 
          isOpen={showViewModal} 
          onClose={() => setShowViewModal(false)} 
        />
      )}
    </div>
  );
}

export default CatalystEcosystem;