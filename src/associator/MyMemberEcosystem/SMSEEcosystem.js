"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  Building,
  Shield,
  Package,
  FileText,
  ExternalLink,
  FileCheck,
  Briefcase,
  Layers,
  Truck,
  Target,
  Linkedin,
  AlertTriangle,
  Clock
} from "lucide-react";
import * as XLSX from 'xlsx';
import { db, auth } from '../../firebaseConfig';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';

// ---------- CUSTOMER DETAILS MODAL (same as before) ----------
const CustomerDetailsModal = ({ customer, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState("overview")
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!isOpen || !customer || !mounted) return null

    const formatLabel = (value) => {
        if (!value) return "Not provided"
        if (typeof value === "boolean") return value ? "Yes" : "No"
        return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    }

    const formatArray = (arr) => {
        if (!arr) return "None"
        if (!Array.isArray(arr)) {
            if (typeof arr === 'string') return arr
            if (typeof arr === 'object') {
                try {
                    const values = Object.values(arr)
                    return values.length > 0 ? values.join(" • ") : "None"
                } catch {
                    return "None"
                }
            }
            return "None"
        }
        if (arr.length === 0) return "None"
        if (typeof arr[0] === 'object') {
            const names = arr.map(item => item.name || item.value || JSON.stringify(item)).filter(Boolean)
            return names.length > 0 ? names.join(" • ") : "None"
        }
        return arr.join(" • ")
    }

    const getOfferingTypeLabel = () => {
        const type = customer.productsServices?.offeringType
        if (type === "products") return "Products only"
        if (type === "services") return "Services only"
        if (type === "both") return "Both products and services"
        return "Not specified"
    }

    const tabs = [
        { id: "overview", label: "Overview", icon: Building },
        { id: "products", label: "Products & Services", icon: Package },
        { id: "financial", label: "Financial", icon: DollarSign },
        { id: "documents", label: "Documents", icon: FileText },
    ]

    const renderDocumentLink = (url, label) => {
        if (!url) return null
        return (
            <div
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "linear-gradient(135deg, #a67c52, #7d5a50)", color: "#faf7f2", borderRadius: "8px", fontSize: "14px", fontWeight: "500", cursor: "pointer", maxWidth: "fit-content" }}
                onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
            >
                <FileText size={16} /><span>{label}</span><ExternalLink size={14} />
            </div>
        )
    }

    return createPortal(
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                <div style={modalHeaderStyle}>
                    <div style={headerContentStyle}>
                        <div style={customerHeaderStyle}>
                            <h2 style={customerNameStyle}>{customer.companyName || customer.entityOverview?.registeredName || "Business"}</h2>
                            <div style={customerMetaStyle}>
                                <span style={entityTypeStyle}>{customer.entityOverview?.entityType || "Not specified"}</span>
                                <span style={locationStyle}><MapPin size={14} />{customer.entityOverview?.location || "Location not specified"}</span>
                                <span style={membershipStatusStyle("Active Member")}>Active Member</span>
                            </div>
                        </div>
                        <button onClick={onClose} style={closeButtonStyle}><X size={20} /></button>
                    </div>
                    <div style={tabsContainerStyle}>
                        {tabs.map((tab) => {
                            const IconComponent = tab.icon
                            return (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ ...tabStyle, ...(activeTab === tab.id ? activeTabStyle : {}) }}>
                                    <IconComponent size={16} />{tab.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
                <div style={modalBodyStyle}>
                    {activeTab === "overview" && (
                        <div style={tabContentStyle}>
                            <div style={gridStyle}>
                                <div style={infoCardStyle}>
                                    <h3 style={cardTitleStyle}><Building size={18} />Business Information</h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem label="Registered Name" value={customer.entityOverview?.registeredName} />
                                        <InfoItem label="Trading Name" value={customer.entityOverview?.tradingName} />
                                        <InfoItem label="Registration Number" value={customer.entityOverview?.registrationNumber} />
                                        <InfoItem label="Entity Type" value={customer.entityOverview?.entityType} />
                                        <InfoItem label="Entity Size" value={customer.entityOverview?.entitySize} />
                                        <InfoItem label="Years in Operation" value={customer.entityOverview?.yearsInOperation} />
                                        <InfoItem label="Employee Count" value={customer.entityOverview?.fullTimeEmployees || customer.entityOverview?.employeeCount} />
                                        <InfoItem label="Location" value={customer.entityOverview?.location} />
                                    </div>
                                    {customer.entityOverview?.businessDescription && (
                                        <div style={descriptionStyle}><strong>Business Description:</strong><p>{customer.entityOverview.businessDescription}</p></div>
                                    )}
                                </div>
                                <div style={infoCardStyle}>
                                    <h3 style={cardTitleStyle}><Award size={18} />Sector & Specialization</h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem label="Economic Sectors" value={formatArray(customer.entityOverview?.economicSectors)} />
                                        <InfoItem label="Target Market" value={customer.productsServices?.targetMarket} />
                                    </div>
                                </div>
                                <div style={infoCardStyle}>
                                    <h3 style={cardTitleStyle}><Clock size={18} />Operational Details</h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem label="Financial Year End" value={customer.entityOverview?.financialYearEnd} />
                                        <InfoItem label="Operation Stage" value={formatLabel(customer.entityOverview?.operationStage)} />
                                        <InfoItem label="Delivery Modes" value={formatArray(customer.productsServices?.deliveryModes)} />
                                    </div>
                                </div>
                                <div style={infoCardStyle}>
                                    <h3 style={cardTitleStyle}><Users size={18} />Contact Details</h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem label="Contact Name" value={customer.contactDetails?.contactName} />
                                        <InfoItem label="Email" value={customer.contactDetails?.email} />
                                        <InfoItem label="Phone" value={customer.contactDetails?.businessPhone} />
                                        {customer.contactDetails?.website && (
                                            <div style={linkItemStyle}><strong>Website:</strong><a href={customer.contactDetails.website} target="_blank" rel="noopener noreferrer" style={linkStyle}>Visit Website <ExternalLink size={12} /></a></div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === "products" && (
                        <div style={tabContentStyle}>
                            <div style={infoCardStyle}>
                                <h3 style={cardTitleStyle}><Package size={18} />Offering Type</h3>
                                <div style={infoGridStyle}><InfoItem label="Type" value={getOfferingTypeLabel()} /></div>
                            </div>
                            {customer.productsServices?.productCategories?.length > 0 && (
                                <div style={sectionStyle}>
                                    <h3 style={sectionTitleStyle}><Layers size={18} style={{ display: "inline", marginRight: "8px" }} />Product Categories</h3>
                                    <div style={categoriesGridStyle}>
                                        {customer.productsServices.productCategories.map((category, index) => (
                                            <div key={index} style={categoryCardStyle}>
                                                <h4 style={categoryTitleStyle}>{category.categories?.length > 0 ? category.categories.map(c => formatLabel(c)).join(" • ") : "Not specified"}</h4>
                                                {category.products?.length > 0 && (
                                                    <div style={productsListStyle}>
                                                        {category.products.map((product, idx) => (
                                                            <div key={idx} style={productItemStyle}><strong>{product.name}</strong>{product.description && <p style={productDescriptionStyle}>{product.description}</p>}</div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {customer.productsServices?.serviceCategories?.length > 0 && (
                                <div style={sectionStyle}>
                                    <h3 style={sectionTitleStyle}><Briefcase size={18} style={{ display: "inline", marginRight: "8px" }} />Service Categories</h3>
                                    <div style={categoriesGridStyle}>
                                        {customer.productsServices.serviceCategories.map((category, index) => (
                                            <div key={index} style={categoryCardStyle}>
                                                <h4 style={categoryTitleStyle}>{category.categories?.length > 0 ? category.categories.map(c => formatLabel(c)).join(" • ") : "Not specified"}</h4>
                                                {category.services?.length > 0 && (
                                                    <div style={productsListStyle}>
                                                        {category.services.map((service, idx) => (
                                                            <div key={idx} style={productItemStyle}><strong>{service.name}</strong>{service.description && <p style={productDescriptionStyle}>{service.description}</p>}</div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === "financial" && (
                        <div style={tabContentStyle}>
                            <div style={gridStyle}>
                                <div style={infoCardStyle}>
                                    <h3 style={cardTitleStyle}><DollarSign size={18} />Financial Overview</h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem label="Generates Revenue" value={formatLabel(customer.financialOverview?.generatesRevenue)} />
                                        <InfoItem label="Annual Revenue" value={customer.financialOverview?.annualRevenue} />
                                        <InfoItem label="Profitability Status" value={formatLabel(customer.financialOverview?.profitabilityStatus)} />
                                        <InfoItem label="Revenue Trend" value={formatLabel(customer.financialOverview?.revenueTrend)} />
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
                                    {renderDocumentLink(customer.documents?.companyProfile, "Company Profile")}
                                    {renderDocumentLink(customer.documents?.bbbeeCertificate, "B-BBEE Certificate")}
                                    {renderDocumentLink(customer.documents?.taxClearance, "Tax Clearance Certificate")}
                                    {!customer.documents || Object.keys(customer.documents).length === 0 ? <div style={emptyStateStyle}>No documents available</div> : null}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    )
}

const InfoItem = ({ label, value }) => (
    <div style={infoItemStyle}><strong>{label}:</strong><span>{value || "Not provided"}</span></div>
)

// Styles (same as before)
const modalOverlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }
const modalContentStyle = { background: "white", borderRadius: "12px", width: "100%", maxWidth: "900px", maxHeight: "90vh", overflow: "hidden", boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)" }
const modalHeaderStyle = { background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)", color: "white", padding: "0" }
const headerContentStyle = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "24px" }
const customerHeaderStyle = { flex: 1 }
const customerNameStyle = { margin: "0 0 8px 0", fontSize: "24px", fontWeight: "700" }
const customerMetaStyle = { display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }
const entityTypeStyle = { background: "rgba(255, 255, 255, 0.2)", padding: "4px 12px", borderRadius: "20px", fontSize: "14px", fontWeight: "500" }
const membershipStatusStyle = (status) => ({ background: "rgba(76, 175, 80, 0.2)", padding: "4px 12px", borderRadius: "20px", fontSize: "14px", fontWeight: "500" })
const locationStyle = { display: "flex", alignItems: "center", gap: "4px", fontSize: "14px" }
const closeButtonStyle = { background: "rgba(255, 255, 255, 0.2)", border: "none", borderRadius: "8px", padding: "8px", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }
const tabsContainerStyle = { display: "flex", background: "rgba(255, 255, 255, 0.1)", padding: "0 24px", flexWrap: "wrap" }
const tabStyle = { display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", background: "none", border: "none", color: "rgba(255, 255, 255, 0.8)", cursor: "pointer", fontSize: "14px", fontWeight: "500", borderBottom: "3px solid transparent", transition: "all 0.2s ease" }
const activeTabStyle = { color: "white", borderBottomColor: "white", background: "rgba(255, 255, 255, 0.1)" }
const modalBodyStyle = { padding: "0", maxHeight: "calc(90vh - 140px)", overflowY: "auto" }
const tabContentStyle = { padding: "24px" }
const gridStyle = { display: "grid", gap: "20px" }
const infoCardStyle = { background: "#FEFCFA", border: "1px solid #E8D5C4", borderRadius: "8px", padding: "20px" }
const cardTitleStyle = { display: "flex", alignItems: "center", gap: "8px", margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600", color: "#5D2A0A" }
const infoGridStyle = { display: "flex", flexDirection: "column", gap: "12px" }
const infoItemStyle = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }
const sectionStyle = { marginBottom: "24px" }
const sectionTitleStyle = { fontSize: "18px", fontWeight: "600", color: "#5D2A0A", margin: "0 0 16px 0", paddingBottom: "8px", borderBottom: "2px solid #E8D5C4" }
const categoriesGridStyle = { display: "grid", gap: "16px" }
const categoryCardStyle = { background: "#FEFCFA", border: "1px solid #E8D5C4", borderRadius: "8px", padding: "16px" }
const categoryTitleStyle = { margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600", color: "#5D2A0A" }
const productsListStyle = { display: "flex", flexDirection: "column", gap: "8px" }
const productItemStyle = { padding: "8px", background: "rgba(166, 124, 82, 0.05)", borderRadius: "4px" }
const productDescriptionStyle = { margin: "4px 0 0 0", fontSize: "14px", color: "#666", lineHeight: "1.4" }
const descriptionStyle = { marginTop: "16px", padding: "12px", background: "rgba(166, 124, 82, 0.05)", borderRadius: "6px", border: "1px solid #E8D5C4" }
const emptyStateStyle = { textAlign: "center", color: "#999", fontStyle: "italic", padding: "40px", background: "#F9F9F9", borderRadius: "8px", border: "1px dashed #E8D5C4" }
const linkItemStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }
const linkStyle = { color: "#5D2A0A", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px", fontWeight: "500" }
const documentsGridStyle = { display: "flex", flexDirection: "column", gap: "12px" }

// ---------- MAIN SMSE ECOSYSTEM COMPONENT (with Firestore integration) ----------
function SMSEEcosystem() {
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [selectedSMSE, setSelectedSMSE] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [smseData, setSmseData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [associationName, setAssociationName] = useState("");
  const [error, setError] = useState(null);

  // Fetch current association's profile to get their name
  useEffect(() => {
    const fetchAssociationProfile = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setError("Please log in to view members");
          setLoading(false);
          return;
        }

        const profileDocRef = doc(db, "universalProfiles", currentUser.uid);
        const profileDoc = await getDoc(profileDocRef);
        
        if (profileDoc.exists()) {
          const profileData = profileDoc.data();
          // Get the association name from entityOverview.industryAssociation
          const assocName = profileData.entityOverview?.industryAssociation;
          if (assocName) {
            setAssociationName(assocName);
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

  // Fetch SMEs that selected this association
  useEffect(() => {
    const fetchMatchingSMEs = async () => {
      if (!associationName) return;
      
      setLoading(true);
      try {
        // Query all universalProfiles where entity type is SME or similar
        const profilesRef = collection(db, "universalProfiles");
        const q = query(
          profilesRef,
          // Note: You may want to add a filter for entityType === "SME" if you store that
          where("entityOverview.memberOfAssociation", "==", "yes")
        );
        
        const querySnapshot = await getDocs(q);
        const matchingSMEs = [];
        
        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          const industryAssociations = data.entityOverview?.industryAssociations || [];
          
          // Check if this SME's associations include our association name
          if (industryAssociations.includes(associationName)) {
            // Build a clean SME object for display
            matchingSMEs.push({
              id: docSnap.id,
              username: data.username || "",
              email: data.contactDetails?.email || "",
              companyName: data.entityOverview?.tradingName || data.entityOverview?.registeredName || "Unnamed Business",
              industry: data.entityOverview?.economicSectors?.[0] || "Not specified",
              entitySize: data.entityOverview?.entitySize || "Not specified",
              location: data.entityOverview?.operatingCountries?.[0] || "Not specified",
              employees: data.entityOverview?.fullTimeEmployees || "0",
              revenue: data.financialOverview?.annualRevenue || "Not specified",
              founded: data.entityOverview?.yearsInOperation ? `${data.entityOverview.yearsInOperation} years` : "Not specified",
              website: data.contactDetails?.website || "",
              phone: data.contactDetails?.businessPhone || "",
              status: "active",
              createdAt: data.createdAt || new Date(),
              description: data.entityOverview?.businessDescription || "",
              firmType: data.entityOverview?.legalStructure || "Not specified",
              headOfficeLocation: data.contactDetails?.physicalAddress || "Not specified",
              membershipStatus: "Active Member",
              // Store all sections for the modal
              entityOverview: data.entityOverview || {},
              productsServices: data.productsServices || {},
              financialOverview: data.financialOverview || {},
              contactDetails: data.contactDetails || {},
              documents: data.documents || {},
            });
          }
        }
        
        setSmseData(matchingSMEs);
      } catch (err) {
        console.error("Error fetching SMEs:", err);
        setError("Failed to load member data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (associationName) {
      fetchMatchingSMEs();
    }
  }, [associationName]);

  // Calculate stats
  const activeCount = smseData.filter(s => s.status === 'active').length;
  const uniqueIndustries = new Set(smseData.map(s => s.industry).filter(i => i !== "Not specified"));
  const stats = { 
    total: smseData.length, 
    active: activeCount, 
    industries: uniqueIndustries.size, 
    avgGrowth: 23.5 
  };

  // Get unique industries for filter
  const industries = [...new Set(smseData.map(s => s.industry).filter(i => i !== "Not specified"))];

  // Filtering
  const filteredSMSEs = smseData.filter((smse) => {
    const matchesSearch =
      smse.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      "Business Name": smse.companyName,
      "Firm Type": smse.firmType,
      "Head Office Location": smse.headOfficeLocation,
      "Membership Status": smse.membershipStatus,
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

  const getMembershipStatusBadge = (status) => {
    const statusColors = {
      "Active Member": { background: '#e8f5e8', color: '#2e7d32' },
      "Pending Approval": { background: '#fff3e0', color: '#ed6c02' },
      "Suspended": { background: '#fdeaea', color: '#c62828' }
    };
    const colors = statusColors[status] || statusColors["Active Member"];
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
    exportButton: { background: '#a67c52', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' },
    statCard: { background: 'white', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    statIcon: { color: '#a67c52' },
    statInfo: { flex: 1 },
    controls: { display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' },
    searchContainer: { flex: 1, position: 'relative' },
    searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#7d5a50' },
    searchInput: { width: '100%', padding: '10px 12px 10px 40px', border: '1px solid #e0d5c8', borderRadius: '8px', fontSize: '14px', outline: 'none' },
    filters: { display: 'flex', gap: '12px' },
    filterSelect: { padding: '10px 12px', border: '1px solid #e0d5c8', borderRadius: '8px', fontSize: '14px', background: 'white', cursor: 'pointer' },
    tableContainer: { background: 'white', borderRadius: '12px', overflow: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '700px' },
    companyCell: { display: 'flex', alignItems: 'center', gap: '12px' },
    companyAvatar: { width: '40px', height: '40px', background: 'linear-gradient(135deg, #a67c52, #7d5a50)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' },
    companyName: { fontWeight: '600', color: '#4a352f' },
    companyEmail: { fontSize: '12px', color: '#7d5a50' },
    viewBtn: { background: 'none', border: 'none', color: '#a67c52', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 12px', borderRadius: '6px', transition: 'background 0.2s' },
    pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' },
    paginationBtn: { background: 'white', border: '1px solid #e0d5c8', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' },
    pageNumber: { color: '#7d5a50', fontSize: '14px' },
    loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', fontSize: '16px', color: '#7d5a50' },
    errorContainer: { background: '#fdeaea', border: '1px solid #c62828', borderRadius: '8px', padding: '20px', textAlign: 'center', margin: '40px', color: '#c62828' },
    emptyContainer: { textAlign: 'center', padding: '60px', color: '#7d5a50', background: 'white', borderRadius: '12px' },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid #e0d5c8', borderTop: '3px solid #a67c52', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '12px' }}></div>
          Loading members...
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
          <h3>Error Loading Members</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>SMSEs in Ecosystem</h1>
          <p style={styles.subtitle}>Browse and view Small and Medium Enterprises that are members of <strong>{associationName || "your association"}</strong></p>
        </div>
        {smseData.length > 0 && (
          <button style={styles.exportButton} onClick={exportToExcel}>
            <Download size={16} />
            Export to Excel
          </button>
        )}
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <Building2 size={24} style={styles.statIcon} />
          <div style={styles.statInfo}>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#4a352f' }}>{stats.total}</h3>
            <p style={{ margin: 0, color: '#7d5a50', fontSize: '14px' }}>Total Members</p>
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

      {smseData.length === 0 ? (
        <div style={styles.emptyContainer}>
          <Users size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3>No members found</h3>
          <p>There are currently no SMEs that have selected {associationName || "your association"} as their industry association.</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>When SMEs complete their profile and select your association, they will appear here.</p>
        </div>
      ) : (
        <>
          <div style={styles.controls}>
            <div style={styles.searchContainer}>
              <Search size={20} style={styles.searchIcon} />
              <input type="text" placeholder="Search by company name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
            </div>
            <div style={styles.filters}>
              <select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)} style={styles.filterSelect}>
                <option value="all">All Industries</option>
                {industries.map(industry => <option key={industry} value={industry}>{industry}</option>)}
              </select>
              <select value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)} style={styles.filterSelect}>
                <option value="all">All Sizes</option>
                <option value="Micro">Micro</option>
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
              </select>
            </div>
          </div>

          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f0e6d9', background: '#faf7f2' }}>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Business Name</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Firm Type</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Head Office Location</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Membership Status</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentSMSEs.map((smse) => (
                  <tr key={smse.id} style={{ borderBottom: '1px solid #f0e6d9' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={styles.companyCell}>
                        <div style={styles.companyAvatar}>{smse.companyName.charAt(0).toUpperCase()}</div>
                        <div><div style={styles.companyName}>{smse.companyName}</div><div style={styles.companyEmail}>{smse.email}</div></div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: '#4a352f' }}>{smse.firmType}</td>
                    <td style={{ padding: '16px', color: '#4a352f' }}>{smse.headOfficeLocation}</td>
                    <td style={{ padding: '16px' }}>{getMembershipStatusBadge(smse.membershipStatus)}</td>
                    <td style={{ padding: '16px' }}>
                      <button style={styles.viewBtn} onClick={() => { setSelectedSMSE(smse); setShowViewModal(true); }} onMouseEnter={(e) => e.currentTarget.style.background = '#faf7f2'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
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
        </>
      )}

      {showViewModal && selectedSMSE && <CustomerDetailsModal customer={selectedSMSE} isOpen={showViewModal} onClose={() => setShowViewModal(false)} />}
    </div>
  );
}

export default SMSEEcosystem;