import React, { useState } from 'react';
import {
  Building2,
  Users,
  FileCheck,
  Table,
  Shield,
  ScrollText,
  AlertTriangle,
  ClipboardList,
  UserCheck,
  Scale,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminGovernance = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('board-matters');
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Navigation structure
  const navigationItems = [
    { id: 'board-matters', label: 'Board Matters', icon: <Building2 size={18} />, hasSubItems: false },
    { id: 'shareholding-equity', label: 'Shareholding Equity', icon: <Users size={18} />, hasSubItems: false },
    { id: 'safe-notes', label: 'SAFE Notes / Convertible', icon: <FileCheck size={18} />, hasSubItems: false },
    { id: 'cap-table', label: 'Cap Table', icon: <Table size={18} />, hasSubItems: false },
    { id: 'governance-framework', label: 'Governance Framework', icon: <Shield size={18} />, hasSubItems: false },
    { id: 'policies-master', label: 'Policies Master', icon: <ScrollText size={18} />, hasSubItems: false },
    { id: 'risk-register', label: 'Risk Register', icon: <AlertTriangle size={18} />, hasSubItems: false },
    { id: 'decisions-log', label: 'Decisions Log', icon: <ClipboardList size={18} />, hasSubItems: false },
    { id: 'hr', label: 'HR', icon: <UserCheck size={18} />, hasSubItems: false },
    {
      id: 'legal-compliance',
      label: 'Legal & Compliance',
      icon: <Scale size={18} />,
      hasSubItems: true,
      subItems: [
        { id: 'company-registration', label: 'Company Registration' },
        { id: 'contracts-templates', label: 'Contracts Templates' },
        { id: 'ndas', label: 'NDAs' },
        { id: 'popia-data-privacy', label: 'POPIA Data Privacy' },
        { id: 'terms-conditions', label: 'Terms & Conditions' },
        { id: 'platform-disclaimers', label: 'Platform Disclaimers' }
      ]
    }
  ];

  // Sample content data (use your existing content)
  const contentData = {
    'board-matters': { title: 'Board Matters', description: 'Manage board meetings, resolutions, and related documents', items: [] },
    'shareholding-equity': { title: 'Shareholding Equity', description: 'Track shareholder information and equity distribution', items: [] },
    'safe-notes': { title: 'SAFE Notes / Convertible', description: 'Manage SAFE notes and convertible instruments', items: [] },
    'cap-table': { title: 'Cap Table', description: 'Capitalization table and ownership structure', items: [] },
    'governance-framework': { title: 'Governance Framework', description: 'Corporate governance policies and frameworks', items: [] },
    'policies-master': { title: 'Policies Master', description: 'Central repository of all company policies', items: [] },
    'risk-register': { title: 'Risk Register', description: 'Track and manage organizational risks', items: [] },
    'decisions-log': { title: 'Decisions Log', description: 'Record of key organizational decisions', items: [] },
    'hr': { title: 'HR', description: 'Human resources documentation and records', items: [] },
    'company-registration': { title: 'Company Registration', description: 'Company registration documents and certificates', items: [] },
    'contracts-templates': { title: 'Contracts Templates', description: 'Standard contract templates for various purposes', items: [] },
    'ndas': { title: 'NDAs', description: 'Non-disclosure agreements', items: [] },
    'popia-data-privacy': { title: 'POPIA Data Privacy', description: 'POPIA compliance and data privacy documentation', items: [] },
    'terms-conditions': { title: 'Terms & Conditions', description: 'Terms of service and usage conditions', items: [] },
    'platform-disclaimers': { title: 'Platform Disclaimers', description: 'Legal disclaimers and liability notices', items: [] }
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedSubCategory(null);
  };

  const handleSubCategoryClick = (categoryId, subCategoryId) => {
    setSelectedCategory(categoryId);
    setSelectedSubCategory(subCategoryId);
  };

  const getCurrentContent = () => {
    if (selectedSubCategory) return contentData[selectedSubCategory] || { title: 'No Content', items: [] };
    return contentData[selectedCategory] || { title: 'No Content', items: [] };
  };

  const filteredContent = getCurrentContent();

  // Styles
  const styles = {
    container: { display: 'flex', height: '100vh', fontFamily: 'sans-serif' },
    sidebar: { width: '280px', background: '#fff', borderRight: '1px solid #ccc', display: 'flex', flexDirection: 'column', overflowY: 'auto', marginLeft: '5px' },
    sidebarHeader: { padding: '24px', borderBottom: '1px solid #ccc', backgroundColor: '#f0e6d9' },
    sidebarTitle: { fontSize: '20px', fontWeight: '600', margin: 0 },
    sidebarNav: { padding: '12px 0', flex: 1 },
    navItemWrapper: { marginBottom: '4px' },
    navItem: (isActive) => ({ padding: '12px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: isActive ? '3px solid #a67c52' : '3px solid transparent', backgroundColor: isActive ? '#e6d7c3' : 'transparent' }),
    navItemContent: { display: 'flex', alignItems: 'center', gap: '12px' },
    navChevron: { display: 'flex', alignItems: 'center' },
    subItems: { backgroundColor: '#f0e6d9', borderLeft: '3px solid #c8b6a6', marginLeft: '20px' },
    subItem: (isActive) => ({ padding: '10px 20px 10px 40px', cursor: 'pointer', borderLeft: isActive ? '2px solid #7d5a50' : '2px solid transparent', backgroundColor: isActive ? '#c8b6a6' : 'transparent' }),
    mainContent: { flex: 1, padding: '4px' },
    headerTitle: { fontSize: '28px', fontWeight: '600', marginBottom: '12px' }
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>Admin Governance</h2>
        </div>
        <nav style={styles.sidebarNav}>
          {navigationItems.map(item => (
            <div key={item.id} style={styles.navItemWrapper}>
              <div
                style={styles.navItem(selectedCategory === item.id && !selectedSubCategory)}
                onClick={() => !item.hasSubItems ? handleCategoryClick(item.id) : toggleCategory(item.id)}
              >
                <div style={styles.navItemContent}>
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.hasSubItems && (
                  <span style={styles.navChevron}>{expandedCategories[item.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
                )}
              </div>
              {item.hasSubItems && expandedCategories[item.id] && (
                <div style={styles.subItems}>
                  {item.subItems.map(sub => (
                    <div
                      key={sub.id}
                      style={styles.subItem(selectedSubCategory === sub.id)}
                      onClick={() => handleSubCategoryClick(item.id, sub.id)}
                    >
                      {sub.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main style={styles.mainContent}>
        <h1 style={styles.headerTitle}>{filteredContent.title}</h1>
        <p>{filteredContent.description}</p>
      </main>
    </div>
  );
};

export default AdminGovernance;
