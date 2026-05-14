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
  AlertTriangle,
} from "lucide-react";
import * as XLSX from 'xlsx';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';

// ---------- ADVISOR DETAILS MODAL ----------
const AdvisorDetailsModal = ({ advisor, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !advisor || !mounted) return null;

  const formatLabel = (value) => {
    if (!value) return "Not provided";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return value;
  };

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
    if (status === "Active Partner" || status === "Active Member") {
      return { background: "#e8f5e8", color: "#2e7d32" };
    } else if (status === "Pending Approval") {
      return { background: "#fff3e0", color: "#ed6c02" };
    }
    return { background: "#fdeaea", color: "#c62828" };
  };

  return createPortal(
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <div style={modalHeaderStyle}>
          <div style={headerContentStyle}>
            <div style={advisorHeaderStyle}>
              <h2 style={advisorNameStyle}>{advisor.fullName}</h2>
              <div style={advisorMetaStyle}>
                <span style={firmTypeBadgeStyle}>{advisor.firmType || "Advisor"}</span>
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

          <div style={tabsContainerStyle}>
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{ ...tabStyle, ...(activeTab === tab.id ? activeTabStyle : {}) }}
                >
                  <IconComponent size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={modalBodyStyle}>
          {activeTab === "overview" && (
            <div style={tabContentStyle}>
              <div style={gridStyle}>
                <div style={infoCardStyle}>
                  <h3 style={cardTitleStyle}><Building2 size={18} />Professional Information</h3>
                  <div style={infoGridStyle}>
                    <InfoItem label="Full Name" value={advisor.fullName} />
                    <InfoItem label="Title" value={advisor.title} />
                    <InfoItem label="Experience" value={advisor.experience} />
                    <InfoItem label="Status" value={advisor.status?.charAt(0).toUpperCase() + advisor.status?.slice(1)} />
                  </div>
                  {advisor.bio && (
                    <div style={descriptionStyle}>
                      <strong>Bio:</strong>
                      <p>{advisor.bio}</p>
                    </div>
                  )}
                </div>

                <div style={infoCardStyle}>
                  <h3 style={cardTitleStyle}><Award size={18} />Qualifications & Rating</h3>
                  <div style={infoGridStyle}>
                    <InfoItem label="Qualifications" value={advisor.qualifications?.join(" • ") || "Not specified"} />
                    <div style={infoItemStyle}>
                      <strong style={{ color: "#7d5a50" }}>Rating:</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {renderStars(advisor.rating || 0)}
                        <span style={{ color: "#4a352f" }}>({advisor.reviews || 0} reviews)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={infoCardStyle}>
                  <h3 style={cardTitleStyle}><Globe size={18} />Location & Contact</h3>
                  <div style={infoGridStyle}>
                    <InfoItem label="Location" value={advisor.headOfficeLocation || advisor.location} />
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

          {activeTab === "expertise" && (
            <div style={tabContentStyle}>
              <div style={gridStyle}>
                <div style={infoCardStyle}>
                  <h3 style={cardTitleStyle}><Target size={18} />Areas of Expertise</h3>
                  <div style={tagsContainerStyle}>
                    {advisor.expertise?.map((exp, idx) => (
                      <span key={idx} style={tagStyle}>{exp}</span>
                    ))}
                  </div>
                </div>

                <div style={infoCardStyle}>
                  <h3 style={cardTitleStyle}><Briefcase size={18} />Industries Served</h3>
                  <div style={tagsContainerStyle}>
                    {advisor.industries?.map((ind, idx) => (
                      <span key={idx} style={tagStyle}>{ind}</span>
                    ))}
                  </div>
                </div>

                {advisor.keyClients && advisor.keyClients.length > 0 && (
                  <div style={infoCardStyle}>
                    <h3 style={cardTitleStyle}><CheckCircle size={18} />Key Clients</h3>
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

          {activeTab === "contact" && (
            <div style={tabContentStyle}>
              <div style={gridStyle}>
                <div style={infoCardStyle}>
                  <h3 style={cardTitleStyle}><Mail size={18} />Contact Details</h3>
                  <div style={infoGridStyle}>
                    <InfoItem label="Email" value={advisor.email} />
                    <InfoItem label="Phone" value={advisor.phone} />
                    <InfoItem label="Location" value={advisor.headOfficeLocation || advisor.location} />
                  </div>
                </div>

                <div style={infoCardStyle}>
                  <h3 style={cardTitleStyle}><Globe size={18} />Online Presence</h3>
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

          {activeTab === "documents" && (
            <div style={tabContentStyle}>
              <div style={infoCardStyle}>
                <h3 style={cardTitleStyle}><FileText size={18} />Public Documents</h3>
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

// ---------- MAIN ADVISOR ECOSYSTEM COMPONENT (For Associations to see Advisors) ----------
function AdvisorEcosystem() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expertiseFilter, setExpertiseFilter] = useState("all");
  const [selectedAdvisor, setSelectedAdvisor] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [advisorData, setAdvisorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [associationName, setAssociationName] = useState("");
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState("");
  const [allExpertise, setAllExpertise] = useState([]);

  // Fetch current association's profile to get their name
  useEffect(() => {
    const fetchAssociationProfile = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setError("Please log in to view advisors");
          setLoading(false);
          return;
        }

        const profileDocRef = doc(db, "universalProfiles", currentUser.uid);
        const profileDoc = await getDoc(profileDocRef);
        
        if (profileDoc.exists()) {
          const profileData = profileDoc.data();
          const assocName = profileData.entityOverview?.industryAssociation;
          if (assocName) {
            setAssociationName(assocName);
            console.log("Association name found:", assocName);
          } else {
            setError("Your association profile does not have an industry association selected. Please complete your profile first.");
            setLoading(false);
          }
        } else {
          setError("Association profile not found. Please complete your profile first.");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching association profile:", err);
        setError("Failed to load association profile. Please try again.");
        setLoading(false);
      }
    };

    fetchAssociationProfile();
  }, []);

  // Fetch Advisors that selected this association from advisorProfiles collection
  useEffect(() => {
    const fetchMatchingAdvisors = async () => {
      if (!associationName) return;
      
      setLoading(true);
      setDebugInfo("Searching for advisors...");
      try {
        const profilesRef = collection(db, "advisorProfiles");
        const querySnapshot = await getDocs(profilesRef);
        
        console.log(`Found ${querySnapshot.docs.length} total advisor profiles`);
        setDebugInfo(`Found ${querySnapshot.docs.length} total advisor profiles. Looking for association: ${associationName}`);
        
        const matchingAdvisors = [];
        const expertiseSet = new Set();
        
        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          const formData = data.formData || {};
          const personalOverview = formData.personalProfessionalOverview || {};
          
          const memberOfAssociation = personalOverview.memberOfAssociation;
          const industryAssociations = personalOverview.industryAssociations || [];
          
          console.log(`Advisor ${docSnap.id}: memberOfAssociation=${memberOfAssociation}, associations=${JSON.stringify(industryAssociations)}`);
          
          // Check if this advisor's associations include our association name
          if (memberOfAssociation === "yes" && industryAssociations.includes(associationName)) {
            console.log(`✅ MATCH FOUND: ${personalOverview.professionalHeadline || "Advisor"}`);
            
            const contactDetails = formData.contactDetails || {};
            const selectionCriteria = formData.selectionCriteria || {};
            const professionalCredentials = formData.professionalCredentials || {};
            
            // Collect expertise for filter
            const expertise = personalOverview.functionalExpertise || [];
            expertise.forEach(exp => expertiseSet.add(exp));
            
            matchingAdvisors.push({
              id: docSnap.id,
              fullName: `${contactDetails.name || ""} ${contactDetails.surname || ""}`.trim() || "Advisor",
              firmType: "Advisory",
              title: personalOverview.professionalHeadline || "Professional Advisor",
              expertise: expertise,
              industries: personalOverview.industryExperience || [],
              experience: personalOverview.yearsOfExperience || "Not specified",
              location: contactDetails.country || "Not specified",
              headOfficeLocation: contactDetails.country || "Not specified",
              membershipStatus: "Active Partner",
              phone: contactDetails.mobile || "",
              email: contactDetails.email || "",
              website: contactDetails.website || "",
              linkedin: contactDetails.linkedin || "",
              bio: personalOverview.briefBio || "",
              status: "active",
              rating: 0,
              reviews: 0,
              qualifications: professionalCredentials.qualifications || [],
              keyClients: [],
              documents: formData.requiredDocuments || {},
            });
          }
        }
        
        setAllExpertise(Array.from(expertiseSet));
        console.log(`Found ${matchingAdvisors.length} matching advisors`);
        setDebugInfo(`Found ${matchingAdvisors.length} advisors that selected "${associationName}"`);
        setAdvisorData(matchingAdvisors);
      } catch (err) {
        console.error("Error fetching advisors:", err);
        setError("Failed to load advisor data. Please try again.");
        setDebugInfo(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (associationName) {
      fetchMatchingAdvisors();
    }
  }, [associationName]);

  const stats = {
    total: advisorData.length,
    active: advisorData.filter(a => a.status === 'active').length,
    expertiseAreas: allExpertise.length,
    avgRating: advisorData.reduce((sum, a) => sum + (a.rating || 0), 0) / advisorData.length || 0
  };

  const filteredAdvisors = advisorData.filter((advisor) => {
    const matchesSearch = 
      advisor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      "Title": advisor.title,
      "Expertise": advisor.expertise.join(", "),
      "Industries": advisor.industries.join(", "),
      "Location": advisor.headOfficeLocation,
      "Membership Status": advisor.membershipStatus,
      "Email": advisor.email,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Advisors");
    XLSX.writeFile(workbook, `Advisors_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getMembershipStatusBadge = (status) => {
    const statusColors = {
      "Active Partner": { background: '#e8f5e8', color: '#2e7d32' },
      "Active Member": { background: '#e8f5e8', color: '#2e7d32' },
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
    companyAvatar: { width: '40px', height: '40px', background: 'linear-gradient(135deg, #a67c52, #7d5a50)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '18px' },
    companyName: { fontWeight: '600', color: '#4a352f' },
    companyEmail: { fontSize: '12px', color: '#7d5a50' },
    tags: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
    tag: { background: '#faf7f2', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', color: '#7d5a50' },
    viewBtn: { background: 'none', border: 'none', color: '#a67c52', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 12px', borderRadius: '6px' },
    pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' },
    paginationBtn: { background: 'white', border: '1px solid #e0d5c8', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#4a352f' },
    pageNumber: { color: '#7d5a50', fontSize: '14px' },
    loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', fontSize: '16px', color: '#7d5a50', flexDirection: 'column', gap: '16px' },
    errorContainer: { background: '#fdeaea', border: '1px solid #c62828', borderRadius: '8px', padding: '20px', textAlign: 'center', margin: '40px', color: '#c62828' },
    emptyContainer: { textAlign: 'center', padding: '60px', color: '#7d5a50', background: 'white', borderRadius: '12px' },
    debugContainer: { background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '8px', padding: '12px', margin: '20px', fontSize: '12px', color: '#333', fontFamily: 'monospace' },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid #e0d5c8', borderTop: '3px solid #a67c52', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <div>Loading advisors...</div>
          {debugInfo && <div style={{ fontSize: '12px', color: '#666' }}>{debugInfo}</div>}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <AlertTriangle size={48} style={{ marginBottom: '16px' }} />
          <h3>Error Loading Advisors</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Advisors in Ecosystem</h1>
          <p style={styles.subtitle}>Discover expert advisors and mentors connected through <strong>{associationName || "your association"}</strong></p>
        </div>
        {advisorData.length > 0 && (
          <button style={styles.exportButton} onClick={exportToExcel}>
            <Download size={16} /> Export to Excel
          </button>
        )}
      </div>

      {debugInfo && (
        <div style={styles.debugContainer}>
          <strong>Debug Info:</strong> {debugInfo}
          <br />
          <strong>Association Name:</strong> {associationName}
          <br />
          <strong>Total Advisors Found:</strong> {advisorData.length}
        </div>
      )}

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

      {advisorData.length === 0 ? (
        <div style={styles.emptyContainer}>
          <Users size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3>No advisors found</h3>
          <p>There are currently no advisors that have selected {associationName || "your association"}.</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>When advisors complete their profile and select your association, they will appear here.</p>
          <ul style={{ fontSize: '12px', color: '#999', textAlign: 'left', display: 'inline-block', marginTop: '16px' }}>
            <li>1. Select "Yes" for "Are you a member of any industry association?"</li>
            <li>2. Select "{associationName}" from the dropdown</li>
            <li>3. Click "Save" after making selections</li>
          </ul>
        </div>
      ) : (
        <>
          <div style={styles.controls}>
            <div style={styles.searchContainer}>
              <Search size={20} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by name or email..."
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
                  <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Name</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Title</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Industries</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Location</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Membership Status</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Actions</th>
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
                    <td style={{ padding: '16px', color: '#4a352f' }}>{advisor.title || "Not specified"}</td>
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
        </>
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