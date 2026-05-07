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
  AlertTriangle,
} from "lucide-react";
import * as XLSX from 'xlsx';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';

// ---------- INVESTOR DETAILS MODAL (same as yours, kept for brevity) ----------
// ... (keep your existing InvestorDetailsModal component here)

// ---------- MAIN INVESTOR ECOSYSTEM COMPONENT ----------
function InvestorEcosystem() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [investorData, setInvestorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [associationName, setAssociationName] = useState("");
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState("");

  const investorTypes = ["Venture Capital", "Private Equity", "Angel Investor", "Family Office"];

  // Fetch current association's profile to get their name
  useEffect(() => {
    const fetchAssociationProfile = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setError("Please log in to view investors");
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

  // Fetch Investors that selected this association
  useEffect(() => {
    const fetchMatchingInvestors = async () => {
      if (!associationName) return;
      
      setLoading(true);
      setDebugInfo("Searching for investors...");
      try {
        const profilesRef = collection(db, "MyuniversalProfiles");
        const querySnapshot = await getDocs(profilesRef);
        
        console.log(`Found ${querySnapshot.docs.length} total investor profiles`);
        setDebugInfo(`Found ${querySnapshot.docs.length} total investor profiles. Looking for association: ${associationName}`);
        
        const matchingInvestors = [];
        
        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          // The data structure: data.formData.fundManageOverview
          const formData = data.formData || {};
          const fundManageOverview = formData.fundManageOverview || {};
          
          const memberOfAssociation = fundManageOverview.memberOfAssociation;
          const industryAssociations = fundManageOverview.industryAssociations || [];
          
          console.log(`Investor ${docSnap.id}: memberOfAssociation=${memberOfAssociation}, associations=${JSON.stringify(industryAssociations)}`);
          
          // Check if this investor's associations include our association name
          if (memberOfAssociation === "yes" && industryAssociations.includes(associationName)) {
            console.log(`✅ MATCH FOUND: ${fundManageOverview.registeredName}`);
            
            const contactDetails = formData.contactDetails || {};
            
            matchingInvestors.push({
              id: docSnap.id,
              fundName: fundManageOverview.registeredName || fundManageOverview.tradingName || "Unnamed Fund",
              firmType: fundManageOverview.firmType || "Not specified",
              focusAreas: fundManageOverview.industrySector ? [fundManageOverview.industrySector] : [],
              committedCapital: fundManageOverview.valueDeployed || "Not specified",
              minFunding: "Contact for details",
              maxFunding: "Contact for details",
              stagePreference: formData.generalInvestmentPreference?.investmentStage?.join(", ") || "Not specified",
              location: contactDetails.physicalAddress || "Not specified",
              headOfficeLocation: contactDetails.physicalAddress || "Not specified",
              membershipStatus: "Active Partner",
              phone: contactDetails.businessTel || "",
              email: contactDetails.businessEmail || "",
              website: contactDetails.website || "",
              linkedin: contactDetails.linkedin || "",
              description: fundManageOverview.briefDescription || "",
              status: "active",
              portfolioCount: parseInt(fundManageOverview.numberOfInvestments) || 0,
              totalInvested: fundManageOverview.valueDeployed || "Not specified",
              teamSize: parseInt(fundManageOverview.numberOfInvestmentExecutives) || 0,
              investmentThesis: formData.applicationBrief?.overviewObjectives || "",
              keyContacts: [
                { name: contactDetails.primaryContactName || "", role: contactDetails.primaryContactPosition || "", email: contactDetails.primaryContactEmail || "" },
                { name: contactDetails.secondaryContactName || "", role: contactDetails.secondaryContactPosition || "", email: contactDetails.secondaryContactEmail || "" }
              ].filter(c => c.name),
              documents: formData.documentUpload || {},
            });
          }
        }
        
        console.log(`Found ${matchingInvestors.length} matching investors`);
        setDebugInfo(`Found ${matchingInvestors.length} investors that selected "${associationName}"`);
        setInvestorData(matchingInvestors);
      } catch (err) {
        console.error("Error fetching investors:", err);
        setError("Failed to load investor data. Please try again.");
        setDebugInfo(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (associationName) {
      fetchMatchingInvestors();
    }
  }, [associationName]);

  const stats = {
    total: investorData.length,
    active: investorData.filter(i => i.status === 'active').length,
    totalCapital: investorData.reduce((sum, i) => sum + (parseInt(String(i.committedCapital).replace(/[^0-9]/g, '')) || 0), 0),
    avgInvestment: investorData.length ? (investorData.reduce((sum, i) => sum + (parseInt(String(i.committedCapital).replace(/[^0-9]/g, '')) || 0), 0) / investorData.length) : 0
  };

  const formatCurrency = (value) => {
    if (typeof value === 'number') return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 0 }).format(value);
    return value;
  };

  const filteredInvestors = investorData.filter((investor) => {
    const matchesSearch = investor.fundName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || investor.firmType === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredInvestors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentInvestors = filteredInvestors.slice(startIndex, startIndex + itemsPerPage);

  const exportToExcel = () => {
    const dataToExport = filteredInvestors.map(investor => ({
      "Fund Name": investor.fundName,
      "Firm Type": investor.firmType,
      "Committed Capital": investor.committedCapital,
      "Head Office Location": investor.headOfficeLocation,
      "Membership Status": investor.membershipStatus,
      "Email": investor.email,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Investors");
    XLSX.writeFile(workbook, `Investors_${new Date().toISOString().split('T')[0]}.xlsx`);
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
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '1000px' },
    companyCell: { display: 'flex', alignItems: 'center', gap: '12px' },
    companyAvatar: { width: '40px', height: '40px', background: 'linear-gradient(135deg, #a67c52, #7d5a50)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' },
    companyName: { fontWeight: '600', color: '#4a352f' },
    companyEmail: { fontSize: '12px', color: '#7d5a50' },
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
          <div>Loading investors...</div>
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
          <h3>Error Loading Investors</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Investors in Ecosystem</h1>
          <p style={styles.subtitle}>Discover funding partners connected through <strong>{associationName || "your association"}</strong></p>
        </div>
        {investorData.length > 0 && (
          <button style={styles.exportButton} onClick={exportToExcel}>
            <Download size={16} /> Export to Excel
          </button>
        )}
      </div>

      {/* Debug Info - Remove after testing */}
      {debugInfo && (
        <div style={styles.debugContainer}>
          <strong>Debug Info:</strong> {debugInfo}
          <br />
          <strong>Association Name:</strong> {associationName}
          <br />
          <strong>Total Investors Found:</strong> {investorData.length}
        </div>
      )}

      <div style={styles.statsGrid}>
        <div style={styles.statCard}><TrendingUp size={24} style={styles.statIcon} /><div style={styles.statInfo}><h3 style={{ margin: 0, fontSize: '24px', color: '#4a352f' }}>{stats.total}</h3><p style={{ margin: 0, color: '#7d5a50' }}>Total Investors</p></div></div>
        <div style={styles.statCard}><Building2 size={24} style={styles.statIcon} /><div style={styles.statInfo}><h3 style={{ margin: 0, fontSize: '24px', color: '#4a352f' }}>{formatCurrency(stats.totalCapital)}</h3><p style={{ margin: 0, color: '#7d5a50' }}>Total Capital Available</p></div></div>
        <div style={styles.statCard}><Target size={24} style={styles.statIcon} /><div style={styles.statInfo}><h3 style={{ margin: 0, fontSize: '24px', color: '#4a352f' }}>{formatCurrency(stats.avgInvestment)}</h3><p style={{ margin: 0, color: '#7d5a50' }}>Avg. Capital per Firm</p></div></div>
        <div style={styles.statCard}><Users size={24} style={styles.statIcon} /><div style={styles.statInfo}><h3 style={{ margin: 0, fontSize: '24px', color: '#4a352f' }}>{stats.active}</h3><p style={{ margin: 0, color: '#7d5a50' }}>Active Partners</p></div></div>
      </div>

      {investorData.length === 0 ? (
        <div style={styles.emptyContainer}>
          <Users size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3>No investors found</h3>
          <p>There are currently no investors that have selected {associationName || "your association"}.</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>When investors complete their profile and select your association, they will appear here.</p>
          <p style={{ fontSize: '12px', marginTop: '16px', color: '#999' }}>Make sure investors have:</p>
          <ul style={{ fontSize: '12px', color: '#999', textAlign: 'left', display: 'inline-block' }}>
            <li>1. Selected "Yes" for "Are you a member of any industry association?"</li>
            <li>2. Selected "{associationName}" from the dropdown</li>
            <li>3. Clicked "Save" after making selections</li>
          </ul>
        </div>
      ) : (
        <>
          <div style={styles.controls}>
            <div style={styles.searchContainer}>
              <Search size={20} style={styles.searchIcon} />
              <input type="text" placeholder="Search by fund name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
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
                  <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Fund Name</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Firm Type</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Committed Capital</th>
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
                    <td style={{ padding: '16px', color: '#4a352f' }}>{investor.headOfficeLocation}</td>
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
        </>
      )}
    </div>
  );
}

export default InvestorEcosystem;