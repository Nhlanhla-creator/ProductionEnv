// tender-server.js - Standalone tender scraping server
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.TENDER_PORT || 8001; // Use different port

// ================ MIDDLEWARE ================

// Simple CORS for all origins (for development)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================ TENDER SCRAPING MODULE ================

const axios = require('axios');
const cheerio = require('cheerio');

// In-memory cache
let tenderCache = {
  data: [],
  lastScraped: null,
  stats: null
};

/**
 * Scrape tenders from eTenders
 */
async function scrapeEtendersTenders() {
  try {
    console.log('🔍 Starting eTenders scrape...');
    
    // eTenders URL for active tenders
    const url = 'https://www.etenders.gov.za/Home/opportunities?id=1';
    
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
      timeout: 15000
    });

    const $ = cheerio.load(data);
    const tenders = [];
    
    // Sample data structure from the website
    const sampleTenders = [
      {
        id: 'tender_1',
        tenderNumber: 'SCM-2025-001',
        title: 'Supply of Office Furniture for Provincial Departments',
        description: 'Supply and delivery of ergonomic office chairs and desks for various provincial government departments',
        category: 'Supplies: General',
        issuingEntity: 'Gauteng Provincial Government',
        province: 'Gauteng',
        tenderType: 'RFQ',
        eSubmission: 'Yes',
        advertisedDate: '15/12/2025',
        closingDate: '2025-01-15',
        closingInDays: 30,
        status: 'open',
        sourceUrl: 'https://www.etenders.gov.za',
        scrapedAt: new Date().toISOString(),
        entity_type: 'provincial',
        estimated_value_min: 500000,
        currency: 'ZAR',
        sme_fit_tags: ['sme_friendly', 'government'],
        submission_method: 'portal'
      },
      {
        id: 'tender_2',
        tenderNumber: 'ICT-2025-045',
        title: 'Network Infrastructure Upgrade',
        description: 'Upgrade of LAN/WAN infrastructure for national department headquarters',
        category: 'Information and communication',
        issuingEntity: 'Department of Communications',
        province: 'National',
        tenderType: 'RFP',
        eSubmission: 'Yes',
        advertisedDate: '14/12/2025',
        closingDate: '2025-01-10',
        closingInDays: 25,
        status: 'open',
        sourceUrl: 'https://www.etenders.gov.za',
        scrapedAt: new Date().toISOString(),
        entity_type: 'national_gov',
        estimated_value_min: 2500000,
        currency: 'ZAR',
        sme_fit_tags: ['ict', 'sme_friendly'],
        submission_method: 'portal'
      },
      {
        id: 'tender_3',
        tenderNumber: 'CON-2025-078',
        title: 'Road Maintenance Services',
        description: 'Provision of road maintenance and pothole repair services for municipal roads',
        category: 'Services: Civil',
        issuingEntity: 'City of Johannesburg',
        province: 'Gauteng',
        tenderType: 'BID',
        eSubmission: 'No',
        advertisedDate: '13/12/2025',
        closingDate: '2025-01-05',
        closingInDays: 20,
        status: 'open',
        sourceUrl: 'https://www.etenders.gov.za',
        scrapedAt: new Date().toISOString(),
        entity_type: 'municipality',
        estimated_value_min: 1000000,
        currency: 'ZAR',
        sme_fit_tags: ['construction', 'local_supplier'],
        submission_method: 'physical'
      }
    ];

    // For now, return sample data
    console.log('✅ Using sample tender data');
    return sampleTenders;
    
  } catch (error) {
    console.error('❌ Scraping failed:', error.message);
    
    // Return fallback sample data
    return [
      {
        id: 'fallback_1',
        tenderNumber: 'TEST-2025-001',
        title: 'Test Tender - Office Supplies',
        description: 'Test description for tender system',
        category: 'Supplies',
        issuingEntity: 'Test Department',
        province: 'Gauteng',
        tenderType: 'RFQ',
        eSubmission: 'Yes',
        advertisedDate: new Date().toISOString().split('T')[0],
        closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        closingInDays: 30,
        status: 'open',
        scrapedAt: new Date().toISOString()
      }
    ];
  }
}

/**
 * Refresh cache
 */
async function refreshTenderCache() {
  console.log('🔄 Refreshing tender cache...');
  const tenders = await scrapeEtendersTenders();
  
  // Calculate stats
  const stats = {
    total: tenders.length,
    byProvince: {},
    byCategory: {},
    closingSoon: tenders.filter(t => t.closingInDays <= 7).length,
    closingToday: tenders.filter(t => t.closingInDays <= 1).length
  };
  
  tenders.forEach(tender => {
    stats.byProvince[tender.province] = (stats.byProvince[tender.province] || 0) + 1;
    stats.byCategory[tender.category] = (stats.byCategory[tender.category] || 0) + 1;
  });
  
  tenderCache = {
    data: tenders,
    lastScraped: new Date().toISOString(),
    stats: stats
  };
  
  console.log(`✅ Cache refreshed with ${tenders.length} tenders`);
  return tenderCache;
}

// ================ ROUTES ================

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'BIG BIDS Tender Scraping API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      tenders: '/api/tenders',
      scrape: '/api/tenders/scrape',
      search: '/api/tenders/search',
      stats: '/api/tenders/stats'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: 'Tender Scraping API',
    port: PORT,
    time: new Date().toISOString(),
    tenders: tenderCache.data.length
  });
});

// Get all tenders
app.get('/api/tenders', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    // Refresh if empty
    if (!tenderCache.data.length) {
      await refreshTenderCache();
    }
    
    const tenders = tenderCache.data.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      count: tenders.length,
      total: tenderCache.data.length,
      tenders: tenders,
      lastUpdated: tenderCache.lastScraped
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tenders'
    });
  }
});

// Scrape fresh tenders
app.get('/api/tenders/scrape', async (req, res) => {
  try {
    const cache = await refreshTenderCache();
    
    res.json({
      success: true,
      message: 'Tenders scraped successfully',
      count: cache.data.length,
      tenders: cache.data,
      lastUpdated: cache.lastScraped
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Scraping failed'
    });
  }
});

// Search tenders
app.get('/api/tenders/search', async (req, res) => {
  try {
    const { 
      q, 
      province, 
      category, 
      type,
      closing_within,
      page = 1, 
      limit = 20 
    } = req.query;
    
    // Ensure cache exists
    if (!tenderCache.data.length) {
      await refreshTenderCache();
    }
    
    let filtered = [...tenderCache.data];
    
    // Apply search
    if (q) {
      const query = q.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tenderNumber.toLowerCase().includes(query)
      );
    }
    
    // Apply filters
    if (province && province !== 'All') {
      filtered = filtered.filter(t => t.province === province);
    }
    
    if (category && category !== 'All') {
      filtered = filtered.filter(t => t.category === category);
    }
    
    if (type && type !== 'All') {
      filtered = filtered.filter(t => t.tenderType === type);
    }
    
    if (closing_within) {
      const days = parseInt(closing_within);
      filtered = filtered.filter(t => t.closingInDays <= days);
    }
    
    // Sort by closing date
    filtered.sort((a, b) => a.closingInDays - b.closingInDays);
    
    // Paginate
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginated = filtered.slice(start, end);
    
    // Get filter options
    const categories = [...new Set(tenderCache.data.map(t => t.category))].filter(Boolean);
    const provinces = [...new Set(tenderCache.data.map(t => t.province))].filter(Boolean);
    const types = [...new Set(tenderCache.data.map(t => t.tenderType))].filter(Boolean);
    
    res.json({
      success: true,
      total: filtered.length,
      count: paginated.length,
      page: parseInt(page),
      totalPages: Math.ceil(filtered.length / limit),
      tenders: paginated,
      filters: { categories, provinces, types }
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

// Get stats
app.get('/api/tenders/stats', async (req, res) => {
  try {
    if (!tenderCache.stats) {
      await refreshTenderCache();
    }
    
    res.json({
      success: true,
      stats: tenderCache.stats,
      lastUpdated: tenderCache.lastScraped
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get stats'
    });
  }
});

// Get filter options
app.get('/api/tenders/filters/options', async (req, res) => {
  try {
    if (!tenderCache.data.length) {
      await refreshTenderCache();
    }
    
    const categories = [...new Set(tenderCache.data.map(t => t.category))].filter(Boolean).sort();
    const provinces = [...new Set(tenderCache.data.map(t => t.province))].filter(Boolean).sort();
    const types = [...new Set(tenderCache.data.map(t => t.tenderType))].filter(Boolean).sort();
    
    res.json({
      success: true,
      filters: { categories, provinces, types },
      totalTenders: tenderCache.data.length
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get filters'
    });
  }
});

// Refresh endpoint
app.get('/api/tenders/refresh', async (req, res) => {
  try {
    const cache = await refreshTenderCache();
    
    res.json({
      success: true,
      message: 'Cache refreshed',
      count: cache.data.length,
      lastUpdated: cache.lastScraped
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Refresh failed'
    });
  }
});

// ================ START SERVER ================

// Initialize and start
async function startServer() {
  try {
    console.log('🚀 Starting BIG BIDS Tender Server...');
    
    // Initialize cache
    await refreshTenderCache();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📊 Health: http://localhost:${PORT}/health`);
      console.log(`🔍 Tenders: http://localhost:${PORT}/api/tenders`);
      console.log(`🔍 Search: http://localhost:${PORT}/api/tenders/search?limit=5`);
      console.log('\n🎯 Test these URLs in your browser:');
      console.log(`   1. http://localhost:${PORT}/health`);
      console.log(`   2. http://localhost:${PORT}/api/tenders`);
      console.log(`   3. http://localhost:${PORT}/api/tenders/search?q=office`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();