// routes/tenders.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

// Tender scraping cache
let tenderCache = {
  data: null,
  lastScraped: null,
  stats: null
};

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache
const ETENDERS_URL = 'https://www.etenders.gov.za/Home/opportunities?id=1';

// ==================== HELPER FUNCTIONS ====================

/**
 * Scrape tenders from eTenders website
 */
async function scrapeEtendersTenders() {
  try {
    console.log('🔍 Scraping eTenders website...');
    
    // Fetch the HTML content
    const { data } = await axios.get(ETENDERS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 60000
    });
    
    const $ = cheerio.load(data);
    const tenders = [];
    
    // Extract data from the table rows
    $('tbody tr').each((index, element) => {
      const row = $(element);
      
      // Skip rows without data
      if (row.find('td').length < 5) return;
      
      // Extract basic information from the table
      const category = row.find('td:nth-child(2)').text().trim() || 'Uncategorized';
      const description = row.find('td:nth-child(3)').text().trim();
      const eSubmission = row.find('td:nth-child(4) span').hasClass('fa-times') ? 'No' : 'Yes';
      const advertised = row.find('td:nth-child(5)').text().trim();
      const closing = row.find('td:nth-child(6)').text().trim();
      
      // Skip if no description
      if (!description || description.length < 10) return;
      
      // Extract tender number from description
      const tenderNumberMatch = description.match(/(?:Tender|Bid|RFQ|RFP)\s*(?:No\.?|Number)?\s*[:]?\s*([A-Z0-9\/\-]+)/i) 
        || description.match(/([A-Z]{2,}\d+\/\d+\/[A-Z0-9\-]+)/i)
        || description.match(/(SCM-\d{4}-\d+)/i);
      
      const tenderNumber = tenderNumberMatch ? tenderNumberMatch[1] : `ET-${Date.now()}-${index}`;
      
      // Extract issuing entity
      let issuingEntity = 'Government Department';
      const entityPatterns = [
        /(?:Eastern Cape|Western Cape|Gauteng|KwaZulu-Natal|Limpopo|Mpumalanga|North West|Northern Cape|Free State)/,
        /(?:Department of|Ministry of|Municipality of|Metropolitan|City of|Eskom|Transnet|SANRAL|Telkom|SAA|SABC)/i,
        /(eThekwini|Johannesburg|Cape Town|Pretoria|Durban|Port Elizabeth)/i
      ];
      
      for (const pattern of entityPatterns) {
        const match = description.match(pattern);
        if (match) {
          issuingEntity = match[0];
          break;
        }
      }
      
      // Extract closing date
      const closingDate = parseClosingDate(closing, advertised);
      
      // Determine tender type
      const tenderType = determineTenderType(description);
      
      // Determine province
      const province = determineProvince(description, issuingEntity);
      
      // Create tender object
      const tender = {
        id: `tender_${Date.now()}_${index}`,
        tenderNumber,
        title: description.length > 100 ? description.substring(0, 100) + '...' : description,
        description,
        category,
        issuingEntity,
        province,
        tenderType,
        eSubmission,
        advertisedDate: advertised,
        closingDate: closingDate.formatted,
        closingInDays: closingDate.days,
        status: 'open',
        sourceUrl: ETENDERS_URL,
        sourceChannel: 'etenders_portal',
        scrapedAt: new Date().toISOString(),
        entity_type: getEntityType(issuingEntity),
        estimated_value_min: null,
        estimated_value_max: null,
        currency: 'ZAR',
        sme_fit_tags: ['government', 'public_sector'],
        submission_method: eSubmission === 'Yes' ? 'portal' : 'physical'
      };
      
      tenders.push(tender);
    });
    
    console.log(`✅ Successfully scraped ${tenders.length} tenders`);
    return tenders;
    
  } catch (error) {
    console.error('❌ Error scraping eTenders:', error.message);
    
    // Return sample data if scraping fails
    return getSampleTenders();
  }
}

/**
 * Parse closing date from text
 */
function parseClosingDate(closingText, advertisedText) {
  try {
    // Parse "in X days" format
    const daysMatch = closingText.match(/in\s+(\d+)\s+days?/i);
    
    if (daysMatch) {
      const days = parseInt(daysMatch[1]);
      const closingDate = new Date();
      closingDate.setDate(closingDate.getDate() + days);
      
      return {
        formatted: closingDate.toISOString().split('T')[0],
        days: days
      };
    }
    
    // Try to parse date string (DD/MM/YYYY)
    const dateMatch = closingText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    if (dateMatch) {
      const [day, month, year] = dateMatch[1].split('/').map(Number);
      const closingDate = new Date(year, month - 1, day);
      const today = new Date();
      const daysDiff = Math.ceil((closingDate - today) / (1000 * 60 * 60 * 24));
      
      return {
        formatted: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
        days: daysDiff > 0 ? daysDiff : 0
      };
    }
    
    // Try MM/DD/YYYY format
    const dateMatch2 = closingText.match(/(\d{1,2}\-\d{1,2}\-\d{4})/);
    if (dateMatch2) {
      const [month, day, year] = dateMatch2[1].split('-').map(Number);
      const closingDate = new Date(year, month - 1, day);
      const today = new Date();
      const daysDiff = Math.ceil((closingDate - today) / (1000 * 60 * 60 * 24));
      
      return {
        formatted: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
        days: daysDiff > 0 ? daysDiff : 30
      };
    }
    
    // Fallback to advertised date + 30 days
    if (advertisedText) {
      const [day, month, year] = advertisedText.split('/').map(Number);
      if (day && month && year) {
        const closingDate = new Date(year, month - 1, day + 30);
        const today = new Date();
        const daysDiff = Math.ceil((closingDate - today) / (1000 * 60 * 60 * 24));
        
        return {
          formatted: closingDate.toISOString().split('T')[0],
          days: daysDiff > 0 ? daysDiff : 30
        };
      }
    }
    
    // Default fallback
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    
    return {
      formatted: defaultDate.toISOString().split('T')[0],
      days: 30
    };
    
  } catch (error) {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    
    return {
      formatted: defaultDate.toISOString().split('T')[0],
      days: 30
    };
  }
}

/**
 * Determine tender type from description
 */
function determineTenderType(description) {
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes('request for quotation') || lowerDesc.includes('rfq')) {
    return 'RFQ';
  } else if (lowerDesc.includes('request for proposal') || lowerDesc.includes('rfp')) {
    return 'RFP';
  } else if (lowerDesc.includes('expression of interest') || lowerDesc.includes('eoi')) {
    return 'EOI';
  } else if (lowerDesc.includes('bid invitation') || lowerDesc.includes('tender')) {
    return 'BID';
  } else if (lowerDesc.includes('request for information') || lowerDesc.includes('rfi')) {
    return 'RFI';
  } else if (lowerDesc.includes('quotation')) {
    return 'RFQ';
  }
  
  return 'BID';
}

/**
 * Determine province from description and issuing entity
 */
function determineProvince(description, issuingEntity) {
  const provinces = [
    'Eastern Cape', 'Western Cape', 'Gauteng', 'KwaZulu-Natal', 
    'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Free State'
  ];
  
  const lowerText = (description + ' ' + issuingEntity).toLowerCase();
  
  for (const province of provinces) {
    if (lowerText.includes(province.toLowerCase())) {
      return province;
    }
  }
  
  // Check for abbreviations and common terms
  const provinceMap = {
    'ec': 'Eastern Cape',
    'wc': 'Western Cape',
    'gp': 'Gauteng',
    'kzn': 'KwaZulu-Natal',
    'lp': 'Limpopo',
    'mp': 'Mpumalanga',
    'nw': 'North West',
    'nc': 'Northern Cape',
    'fs': 'Free State',
    'johannesburg': 'Gauteng',
    'pretoria': 'Gauteng',
    'cape town': 'Western Cape',
    'durban': 'KwaZulu-Natal',
    'port elizabeth': 'Eastern Cape',
    'bloemfontein': 'Free State',
    'kimberley': 'Northern Cape',
    'polokwane': 'Limpopo',
    'nelspruit': 'Mpumalanga',
    'mbombela': 'Mpumalanga'
  };
  
  for (const [key, province] of Object.entries(provinceMap)) {
    if (lowerText.includes(key.toLowerCase())) {
      return province;
    }
  }
  
  return 'National';
}

/**
 * Determine entity type for BIG BIDS schema
 */
function getEntityType(issuingEntity) {
  const lowerEntity = issuingEntity.toLowerCase();
  
  if (lowerEntity.includes('municipality') || lowerEntity.includes('city')) {
    return 'municipality';
  } else if (lowerEntity.includes('province') || lowerEntity.includes('provincial')) {
    return 'provincial';
  } else if (lowerEntity.includes('national') || lowerEntity.includes('department')) {
    return 'national_gov';
  } else if (lowerEntity.includes('eskom') || lowerEntity.includes('transnet') || 
             lowerEntity.includes('sanral') || lowerEntity.includes('telkom')) {
    return 'soe';
  }
  
  return 'other';
}

/**
 * Get sample tenders for fallback
 */
function getSampleTenders() {
  return [
    {
      id: 'sample_1',
      tenderNumber: 'SCM-2025-001',
      title: 'Supply of Office Furniture for Provincial Departments',
      description: 'Supply and delivery of ergonomic office chairs and desks for various provincial government departments for a period of 24 months',
      category: 'Supplies: General',
      issuingEntity: 'Gauteng Provincial Government',
      province: 'Gauteng',
      tenderType: 'RFQ',
      eSubmission: 'Yes',
      advertisedDate: '15/12/2025',
      closingDate: '2025-01-15',
      closingInDays: 30,
      status: 'open',
      sourceUrl: ETENDERS_URL,
      sourceChannel: 'etenders_portal',
      scrapedAt: new Date().toISOString(),
      entity_type: 'provincial',
      estimated_value_min: 500000,
      estimated_value_max: 1500000,
      currency: 'ZAR',
      sme_fit_tags: ['government', 'sme_friendly', 'b-bbee'],
      submission_method: 'portal'
    },
    {
      id: 'sample_2',
      tenderNumber: 'ICT-2025-045',
      title: 'Network Infrastructure Upgrade and Maintenance',
      description: 'Upgrade of LAN/WAN infrastructure for national department headquarters including installation, configuration and 24-month maintenance',
      category: 'Information and communication',
      issuingEntity: 'Department of Communications and Digital Technologies',
      province: 'National',
      tenderType: 'RFP',
      eSubmission: 'Yes',
      advertisedDate: '14/12/2025',
      closingDate: '2025-01-10',
      closingInDays: 25,
      status: 'open',
      sourceUrl: ETENDERS_URL,
      sourceChannel: 'etenders_portal',
      scrapedAt: new Date().toISOString(),
      entity_type: 'national_gov',
      estimated_value_min: 2500000,
      estimated_value_max: 5000000,
      currency: 'ZAR',
      sme_fit_tags: ['ict', 'sme_friendly', 'youth_owned'],
      submission_method: 'portal'
    }
  ];
}

/**
 * Calculate statistics from tenders
 */
function calculateTenderStats(tenders) {
  const stats = {
    total: tenders.length,
    byProvince: {},
    byCategory: {},
    byType: {},
    byEntityType: {},
    closingSoon: 0,
    closingToday: 0,
    withESubmission: 0,
    totalEstimatedValue: 0
  };
  
  tenders.forEach(tender => {
    // Count by province
    stats.byProvince[tender.province] = (stats.byProvince[tender.province] || 0) + 1;
    
    // Count by category
    const category = tender.category || 'Uncategorized';
    stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    
    // Count by type
    stats.byType[tender.tenderType] = (stats.byType[tender.tenderType] || 0) + 1;
    
    // Count by entity type
    stats.byEntityType[tender.entity_type] = (stats.byEntityType[tender.entity_type] || 0) + 1;
    
    // Count closing soon/today
    if (tender.closingInDays <= 7) stats.closingSoon++;
    if (tender.closingInDays <= 1) stats.closingToday++;
    
    // Count e-submissions
    if (tender.eSubmission === 'Yes') stats.withESubmission++;
    
    // Sum estimated values
    if (tender.estimated_value_min) {
      stats.totalEstimatedValue += tender.estimated_value_min;
    }
  });
  
  return stats;
}

/**
 * Refresh tender cache
 */
async function refreshTenderCache() {
  try {
    console.log('🔄 Refreshing tender cache...');
    const tenders = await scrapeEtendersTenders();
    const stats = calculateTenderStats(tenders);
    
    tenderCache = {
      data: tenders,
      lastScraped: new Date().toISOString(),
      stats: stats
    };
    
    console.log(`✅ Cache refreshed with ${tenders.length} tenders`);
    return tenderCache;
  } catch (error) {
    console.error('❌ Failed to refresh cache:', error);
    return tenderCache;
  }
}

// ==================== ROUTE HANDLERS ====================

/**
 * GET /api/tenders/scrape - Scrape fresh tenders
 */
router.get('/scrape', async (req, res) => {
  try {
    const useCache = req.query.cache !== 'false';
    
    // Check cache if requested
    if (useCache && tenderCache.data && tenderCache.lastScraped) {
      const cacheAge = Date.now() - new Date(tenderCache.lastScraped).getTime();
      if (cacheAge < CACHE_DURATION) {
        return res.json({
          success: true,
          cached: true,
          count: tenderCache.data.length,
          tenders: tenderCache.data,
          stats: tenderCache.stats,
          scrapedAt: tenderCache.lastScraped,
          cacheAge: Math.round(cacheAge / 60000) + ' minutes'
        });
      }
    }
    
    // Scrape fresh data
    const cache = await refreshTenderCache();
    
    res.json({
      success: true,
      cached: false,
      count: cache.data.length,
      tenders: cache.data,
      stats: cache.stats,
      scrapedAt: cache.lastScraped
    });
    
  } catch (error) {
    console.error('❌ Scrape error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to scrape tenders',
      message: error.message
    });
  }
});

/**
 * GET /api/tenders/search - Search and filter tenders
 */
router.get('/search', async (req, res) => {
  try {
    const { 
      q, // search query
      province, 
      category, 
      type,
      entity_type,
      eSubmission,
      closing_within,
      min_value,
      max_value,
      sort = 'closingInDays',
      order = 'asc',
      page = 1,
      limit = 20
    } = req.query;
    
    // Ensure cache is populated
    if (!tenderCache.data || !tenderCache.lastScraped) {
      await refreshTenderCache();
    }
    
    let filteredTenders = [...tenderCache.data];
    
    // Apply search query
    if (q) {
      const query = q.toLowerCase();
      filteredTenders = filteredTenders.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tenderNumber.toLowerCase().includes(query) ||
        t.issuingEntity.toLowerCase().includes(query) ||
        (t.sme_fit_tags && t.sme_fit_tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }
    
    // Apply filters
    if (province && province !== 'All') {
      filteredTenders = filteredTenders.filter(t => 
        t.province === province
      );
    }
    
    if (category && category !== 'All') {
      filteredTenders = filteredTenders.filter(t => 
        t.category === category
      );
    }
    
    if (type && type !== 'All') {
      filteredTenders = filteredTenders.filter(t => 
        t.tenderType === type
      );
    }
    
    if (entity_type && entity_type !== 'All') {
      filteredTenders = filteredTenders.filter(t => 
        t.entity_type === entity_type
      );
    }
    
    if (eSubmission && eSubmission !== 'All') {
      filteredTenders = filteredTenders.filter(t => 
        (eSubmission === 'Yes' && t.eSubmission === 'Yes') ||
        (eSubmission === 'No' && t.eSubmission === 'No')
      );
    }
    
    if (closing_within) {
      const days = parseInt(closing_within);
      filteredTenders = filteredTenders.filter(t => 
        t.closingInDays <= days
      );
    }
    
    if (min_value) {
      const min = parseFloat(min_value);
      filteredTenders = filteredTenders.filter(t => 
        t.estimated_value_min && t.estimated_value_min >= min
      );
    }
    
    if (max_value) {
      const max = parseFloat(max_value);
      filteredTenders = filteredTenders.filter(t => 
        t.estimated_value_max && t.estimated_value_max <= max
      );
    }
    
    // Apply sorting
    filteredTenders.sort((a, b) => {
      let aVal, bVal;
      
      switch(sort) {
        case 'closingInDays':
          aVal = a.closingInDays;
          bVal = b.closingInDays;
          break;
        case 'estimated_value_min':
          aVal = a.estimated_value_min || 0;
          bVal = b.estimated_value_min || 0;
          break;
        case 'advertisedDate':
          aVal = new Date(a.advertisedDate);
          bVal = new Date(b.advertisedDate);
          break;
        default:
          aVal = a[sort] || 0;
          bVal = b[sort] || 0;
      }
      
      if (order === 'desc') {
        return bVal - aVal;
      }
      return aVal - bVal;
    });
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTenders = filteredTenders.slice(startIndex, endIndex);
    
    // Get unique values for filter options
    const uniqueCategories = [...new Set(tenderCache.data.map(t => t.category))].filter(Boolean);
    const uniqueProvinces = [...new Set(tenderCache.data.map(t => t.province))].filter(Boolean);
    const uniqueTypes = [...new Set(tenderCache.data.map(t => t.tenderType))].filter(Boolean);
    const uniqueEntityTypes = [...new Set(tenderCache.data.map(t => t.entity_type))].filter(Boolean);
    
    res.json({
      success: true,
      total: filteredTenders.length,
      count: paginatedTenders.length,
      page: parseInt(page),
      totalPages: Math.ceil(filteredTenders.length / limit),
      tenders: paginatedTenders,
      filters: {
        categories: uniqueCategories,
        provinces: uniqueProvinces,
        types: uniqueTypes,
        entityTypes: uniqueEntityTypes
      },
      appliedFilters: req.query
    });
    
  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error.message
    });
  }
});

/**
 * GET /api/tenders/stats - Get tender statistics
 */
router.get('/stats', async (req, res) => {
  try {
    if (!tenderCache.stats) {
      await refreshTenderCache();
    }
    
    res.json({
      success: true,
      stats: tenderCache.stats,
      lastUpdated: tenderCache.lastScraped,
      cacheAge: tenderCache.lastScraped ? 
        Math.round((Date.now() - new Date(tenderCache.lastScraped).getTime()) / 60000) + ' minutes' : 
        'Not cached'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get stats'
    });
  }
});

/**
 * GET /api/tenders/:id - Get specific tender
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!tenderCache.data) {
      await refreshTenderCache();
    }
    
    const tender = tenderCache.data.find(t => t.id === id);
    
    if (!tender) {
      return res.status(404).json({
        success: false,
        error: 'Tender not found'
      });
    }
    
    res.json({
      success: true,
      tender
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get tender'
    });
  }
});

/**
 * GET /api/tenders/refresh - Force refresh cache
 */
router.get('/refresh', async (req, res) => {
  try {
    const cache = await refreshTenderCache();
    
    res.json({
      success: true,
      message: 'Cache refreshed successfully',
      count: cache.data.length,
      scrapedAt: cache.lastScraped
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to refresh cache'
    });
  }
});

/**
 * GET /api/tenders/filters - Get available filter options
 */
router.get('/filters/options', async (req, res) => {
  try {
    if (!tenderCache.data) {
      await refreshTenderCache();
    }
    
    const categories = [...new Set(tenderCache.data.map(t => t.category))].filter(Boolean).sort();
    const provinces = [...new Set(tenderCache.data.map(t => t.province))].filter(Boolean).sort();
    const types = [...new Set(tenderCache.data.map(t => t.tenderType))].filter(Boolean).sort();
    const entityTypes = [...new Set(tenderCache.data.map(t => t.entity_type))].filter(Boolean).sort();
    
    res.json({
      success: true,
      filters: {
        categories,
        provinces,
        types,
        entityTypes
      },
      totalTenders: tenderCache.data.length
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get filter options'
    });
  }
});

/**
 * POST /api/tenders/bookmark - Bookmark a tender for user
 */
router.post('/bookmark', async (req, res) => {
  try {
    const { userId, tenderId, tenderData } = req.body;
    
    if (!userId || !tenderId) {
      return res.status(400).json({
        success: false,
        error: 'User ID and Tender ID are required'
      });
    }
    
    // In a real implementation, you would save this to your database
    // For now, we'll just return success
    
    res.json({
      success: true,
      message: 'Tender bookmarked successfully',
      bookmarkId: `bookmark_${userId}_${tenderId}_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to bookmark tender'
    });
  }
});

module.exports = {
  router,
  refreshTenderCache,
  getTenderCache: () => tenderCache
};