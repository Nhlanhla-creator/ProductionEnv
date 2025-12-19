
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, Calendar, Building, MapPin, FileText,
  Download, RefreshCw, AlertCircle, CheckCircle, Clock,
  TrendingUp, Users, Briefcase, ChevronRight, Star,
  ExternalLink, FilterX
} from 'lucide-react';
import './opportunity-matches.css';

// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const OpportunityMatchesPage = () => {
  const [tenders, setTenders] = useState([]);
  const [filteredTenders, setFilteredTenders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    provinces: [],
    types: [],
    entityTypes: []
  });

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    province: 'All',
    category: 'All',
    type: 'All',
    entityType: 'All',
    eSubmission: 'All',
    closingWithin: 'All',
    sortBy: 'closingInDays',
    sortOrder: 'asc'
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
    limit: 20
  });

  // Fetch tenders with filters
  const fetchTenders = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: page,
        limit: pagination.limit,
        sort: filters.sortBy,
        order: filters.sortOrder
      });

      if (filters.search) params.append('q', filters.search);
      if (filters.province !== 'All') params.append('province', filters.province);
      if (filters.category !== 'All') params.append('category', filters.category);
      if (filters.type !== 'All') params.append('type', filters.type);
      if (filters.entityType !== 'All') params.append('entity_type', filters.entityType);
      if (filters.eSubmission !== 'All') params.append('eSubmission', filters.eSubmission);
      if (filters.closingWithin !== 'All') params.append('closing_within', filters.closingWithin);

      const response = await fetch(`${API_BASE_URL}/tenders/search?${params}`);
      const data = await response.json();

      if (data.success) {
        setFilteredTenders(data.tenders);
        setPagination({
          page: data.page,
          total: data.total,
          totalPages: data.totalPages,
          limit: pagination.limit
        });
      } else {
        setError(data.error || 'Failed to fetch tenders');
      }
    } catch (err) {
      console.error('Error fetching tenders:', err);
      setError('Unable to connect to server. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tenders/stats`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tenders/filters/options`);
      const data = await response.json();
      
      if (data.success) {
        setFilterOptions(data.filters);
      }
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const initializeData = async () => {
      await fetchFilterOptions();
      await fetchStats();
      await fetchTenders(1);
    };
    initializeData();
  }, [fetchTenders, fetchStats, fetchFilterOptions]);

  // Apply filters
  const applyFilters = () => {
    fetchTenders(1);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      province: 'All',
      category: 'All',
      type: 'All',
      entityType: 'All',
      eSubmission: 'All',
      closingWithin: 'All',
      sortBy: 'closingInDays',
      sortOrder: 'asc'
    });
  };

  // Refresh data
  const handleRefresh = () => {
    fetchTenders(pagination.page);
    fetchStats();
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Tender Number', 'Title', 'Issuing Entity', 'Category', 'Province', 'Type', 'Closing Date', 'Closing In Days', 'eSubmission'];
    const csvData = filteredTenders.map(t => [
      t.tenderNumber,
      t.title,
      t.issuingEntity,
      t.category,
      t.province,
      t.tenderType,
      t.closingDate,
      t.closingInDays,
      t.eSubmission
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `big-bids-tenders-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Bookmark tender
  const handleBookmark = async (tenderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tenders/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'current-user-id', // Replace with actual user ID
          tenderId,
          tenderData: filteredTenders.find(t => t.id === tenderId)
        })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Tender bookmarked successfully!');
      }
    } catch (err) {
      console.error('Error bookmarking tender:', err);
      alert('Failed to bookmark tender');
    }
  };

  // Render status badge
  const renderStatusBadge = (days) => {
    if (days <= 1) return <span className="badge badge-urgent">Closing Today</span>;
    if (days <= 3) return <span className="badge badge-warning">Closing Soon</span>;
    if (days <= 7) return <span className="badge badge-info">This Week</span>;
    return <span className="badge badge-success">Open</span>;
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="opportunity-matches-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>
            <FileText size={28} className="header-icon" />
            BIG BIDS - Tender Opportunities
          </h1>
          <p className="subtitle">
            Discover and match with government and corporate tender opportunities
            {stats && ` • ${stats.total} opportunities available`}
          </p>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw size={18} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleExportCSV}
            disabled={filteredTenders.length === 0}
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon total">
              <FileText size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.total}</h3>
              <p>Total Tenders</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon urgent">
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.closingToday}</h3>
              <p>Closing Today</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon warning">
              <AlertCircle size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.closingSoon}</h3>
              <p>Closing This Week</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon success">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.withESubmission}</h3>
              <p>E-Submission</p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="filters-section">
        <div className="search-container">
          <div className="search-box">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search tenders by number, title, or entity..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="search-input"
              onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
            />
            <button 
              className="btn btn-search"
              onClick={applyFilters}
              disabled={loading}
            >
              Search
            </button>
          </div>
          
          <div className="filter-buttons">
            <button 
              className="btn btn-clear"
              onClick={resetFilters}
            >
              <FilterX size={16} />
              Clear All
            </button>
            <button 
              className="btn btn-apply"
              onClick={applyFilters}
              disabled={loading}
            >
              <Filter size={16} />
              Apply Filters
            </button>
          </div>
        </div>

        <div className="filter-grid">
          <div className="filter-group">
            <label><MapPin size={16} /> Province</label>
            <select 
              value={filters.province}
              onChange={(e) => setFilters({...filters, province: e.target.value})}
            >
              <option value="All">All Provinces</option>
              {filterOptions.provinces.map(province => (
                <option key={province} value={province}>{province}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Category</label>
            <select 
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
            >
              <option value="All">All Categories</option>
              {filterOptions.categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Tender Type</label>
            <select 
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
            >
              <option value="All">All Types</option>
              {filterOptions.types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Entity Type</label>
            <select 
              value={filters.entityType}
              onChange={(e) => setFilters({...filters, entityType: e.target.value})}
            >
              <option value="All">All Entities</option>
              {filterOptions.entityTypes.map(entity => (
                <option key={entity} value={entity}>{entity.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>E-Submission</label>
            <select 
              value={filters.eSubmission}
              onChange={(e) => setFilters({...filters, eSubmission: e.target.value})}
            >
              <option value="All">All</option>
              <option value="Yes">E-Submission Only</option>
              <option value="No">Physical Only</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Closing Within</label>
            <select 
              value={filters.closingWithin}
              onChange={(e) => setFilters({...filters, closingWithin: e.target.value})}
            >
              <option value="All">Any Time</option>
              <option value="1">Today</option>
              <option value="3">3 Days</option>
              <option value="7">7 Days</option>
              <option value="14">14 Days</option>
              <option value="30">30 Days</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Sort By</label>
            <select 
              value={filters.sortBy}
              onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
            >
              <option value="closingInDays">Closing Date</option>
              <option value="estimated_value_min">Value</option>
              <option value="advertisedDate">Advertised Date</option>
              <option value="title">Title</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Order</label>
            <select 
              value={filters.sortOrder}
              onChange={(e) => setFilters({...filters, sortOrder: e.target.value})}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="results-info">
        <p>
          Showing <strong>{filteredTenders.length}</strong> of <strong>{pagination.total}</strong> opportunities
          {filters.search && ` for "${filters.search}"`}
          {loading && ' (loading...)'}
        </p>
        {pagination.totalPages > 1 && (
          <div className="pagination-info">
            Page {pagination.page} of {pagination.totalPages}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && filteredTenders.length === 0 && (
        <div className="loading-skeleton">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="tender-skeleton">
              <div className="skeleton-line title"></div>
              <div className="skeleton-line description"></div>
              <div className="skeleton-line meta"></div>
            </div>
          ))}
        </div>
      )}

      {/* Tenders List */}
      <div className="tenders-list">
        {!loading && filteredTenders.length === 0 ? (
          <div className="no-results">
            <FileText size={48} />
            <h3>No tender opportunities found</h3>
            <p>Try adjusting your search criteria or filters</p>
            <button className="btn btn-secondary" onClick={resetFilters}>
              Clear All Filters
            </button>
          </div>
        ) : (
          filteredTenders.map((tender) => (
            <div key={tender.id} className="tender-card">
              <div className="tender-header">
                <div className="tender-title-section">
                  <div className="tender-meta-top">
                    <span className="tender-number">{tender.tenderNumber}</span>
                    {renderStatusBadge(tender.closingInDays)}
                    <span className={`esubmission-badge ${tender.eSubmission === 'Yes' ? 'active' : 'inactive'}`}>
                      {tender.eSubmission === 'Yes' ? '✓ E-Submission' : '✗ Physical'}
                    </span>
                  </div>
                  <h3 className="tender-title">{tender.title}</h3>
                </div>
                
                <div className="tender-actions">
                  <button 
                    className="btn btn-bookmark"
                    onClick={() => handleBookmark(tender.id)}
                    title="Bookmark this tender"
                  >
                    <Star size={16} />
                  </button>
                  <button className="btn btn-view">
                    View Details <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              
              <div className="tender-body">
                <p className="tender-description">{tender.description}</p>
                
                <div className="tender-details-grid">
                  <div className="detail-item">
                    <Building size={16} />
                    <div>
                      <span className="detail-label">Issuing Entity</span>
                      <span className="detail-value">{tender.issuingEntity}</span>
                    </div>
                  </div>
                  
                  <div className="detail-item">
                    <MapPin size={16} />
                    <div>
                      <span className="detail-label">Province</span>
                      <span className="detail-value">{tender.province}</span>
                    </div>
                  </div>
                  
                  <div className="detail-item">
                    <FileText size={16} />
                    <div>
                      <span className="detail-label">Category</span>
                      <span className="detail-value">{tender.category}</span>
                    </div>
                  </div>
                  
                  <div className="detail-item">
                    <Briefcase size={16} />
                    <div>
                      <span className="detail-label">Type</span>
                      <span className={`type-badge ${tender.tenderType.toLowerCase()}`}>
                        {tender.tenderType}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="tender-footer">
                <div className="closing-section">
                  <Calendar size={16} />
                  <div>
                    <span className="detail-label">Closes In</span>
                    <span className="closing-days">
                      <strong>{tender.closingInDays} days</strong> • {tender.closingDate}
                    </span>
                  </div>
                </div>
                
                <div className="value-section">
                  <TrendingUp size={16} />
                  <div>
                    <span className="detail-label">Estimated Value</span>
                    <span className="tender-value">
                      {formatCurrency(tender.estimated_value_min)}
                      {tender.estimated_value_max && ` - ${formatCurrency(tender.estimated_value_max)}`}
                    </span>
                  </div>
                </div>
                
                <a 
                  href={tender.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-external"
                >
                  <ExternalLink size={16} />
                  View on eTenders
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination-controls">
          <button 
            className="btn btn-pagination"
            onClick={() => fetchTenders(pagination.page - 1)}
            disabled={pagination.page === 1 || loading}
          >
            Previous
          </button>
          
          <div className="page-numbers">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  className={`btn btn-page ${pagination.page === pageNum ? 'active' : ''}`}
                  onClick={() => fetchTenders(pageNum)}
                  disabled={loading}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button 
            className="btn btn-pagination"
            onClick={() => fetchTenders(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages || loading}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default OpportunityMatchesPage;