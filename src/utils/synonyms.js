// Comprehensive synonyms and related terms mapping for semantic matching
export const SEMANTIC_SYNONYMS = {
  // Agriculture
  'agriculture': ['farming', 'agribusiness', 'crop production', 'livestock', 'agricultural services', 'farming operations', 'agri-business', 'cultivation', 'harvesting', 'agricultural production', 'farm management', 'agricultural development', 'agro-processing', 'agricultural consulting', 'farm services', 'crop farming', 'animal husbandry', 'agricultural equipment', 'farm supplies', 'agricultural inputs', 'agronomy', 'horticulture', 'viticulture', 'aquaculture', 'poultry farming', 'dairy farming'],
  'farming': ['agriculture', 'cultivation', 'crop production', 'livestock farming', 'agribusiness', 'farm operations', 'agricultural activities', 'harvesting', 'planting', 'agricultural work'],
  'agribusiness': ['agricultural business', 'farm business', 'agricultural enterprise', 'agri-enterprise', 'farming business'],

  // Alternative Medicine
  'alternative medicine': ['holistic medicine', 'complementary medicine', 'natural medicine', 'traditional medicine', 'integrative medicine', 'non-conventional medicine', 'herbal medicine', 'homeopathy', 'acupuncture', 'chiropractic', 'ayurveda', 'naturopathy', 'traditional healing', 'energy healing', 'reiki', 'reflexology', 'aromatherapy', 'functional medicine', 'wholistic medicine', 'complementary therapies', 'alternative therapies', 'natural healing'],
  'holistic medicine': ['alternative medicine', 'wholistic medicine', 'integrated medicine', 'comprehensive medicine', 'whole-person medicine'],
  'traditional medicine': ['indigenous medicine', 'folk medicine', 'ethnic medicine', 'cultural medicine', 'ancestral medicine'],

  // Art
  'art': ['fine art', 'visual arts', 'creative arts', 'artwork', 'artistic works', 'crafts', 'artistic creations', 'creative works', 'artistic expression', 'visual expression', 'artistic services', 'art creation', 'art production', 'artistic design', 'creative design', 'artistic craftsmanship', 'artisan work', 'creative work', 'artistic endeavors'],
  'visual arts': ['fine arts', 'graphic arts', 'plastic arts', 'artistic visuals', 'visual creations'],
  'creative arts': ['artistic arts', 'expressive arts', 'imaginative arts', 'inventive arts'],

  // Attorneys & Legal Services
  'attorneys': ['lawyers', 'legal practitioners', 'advocates', 'legal attorneys', 'counsel', 'legal counsel', 'barristers', 'solicitors', 'legal representatives', 'legal advisors', 'jurists', 'legal professionals'],
  'legal services': ['law services', 'legal assistance', 'legal help', 'legal representation', 'legal advice', 'legal consultancy', 'legal support', 'legal guidance', 'legal counseling', 'legal consultation', 'law practice', 'legal practice', 'attorney services', 'lawyer services', 'legal aid', 'legal solutions'],
  'lawyers': ['attorneys', 'legal practitioners', 'counsel', 'advocates', 'legal professionals', 'jurists', 'solicitors', 'barristers'],

  // Automotive
  'automotive': ['vehicle services', 'car services', 'auto services', 'automobile services', 'motor vehicle services', 'car repair', 'auto repair', 'vehicle repair', 'automotive repair', 'car maintenance', 'auto maintenance', 'vehicle maintenance', 'mechanic services', 'auto mechanics', 'car mechanics', 'automotive mechanics', 'auto body repair', 'car detailing', 'auto detailing', 'vehicle detailing', 'tire services', 'auto parts', 'car parts', 'vehicle parts'],
  'vehicle services': ['automotive services', 'auto services', 'car services', 'transport services', 'motor services'],
  'auto repair': ['car repair', 'vehicle repair', 'automotive repair', 'mechanic services', 'auto fixing'],

  // Beauty & Fitness
  'beauty': ['cosmetics', 'aesthetics', 'beauty care', 'beauty treatments', 'beauty services', 'cosmetic services', 'aesthetic services', 'beauty therapy', 'beauty salon', 'spa services', 'wellness beauty', 'personal care', 'grooming services', 'beauty products', 'cosmetic products', 'skincare', 'haircare', 'makeup', 'beauty enhancements'],
  'fitness': ['exercise', 'workout', 'physical fitness', 'gym services', 'fitness training', 'personal training', 'exercise programs', 'fitness classes', 'health fitness', 'wellness fitness', 'bodybuilding', 'cardio training', 'strength training', 'fitness coaching', 'fitness instruction'],
  'beauty & fitness': ['health and beauty', 'wellness and aesthetics', 'cosmetics and exercise', 'personal care and fitness'],

  // Business accelerators
  'business accelerators': ['startup accelerators', 'business incubators', 'venture accelerators', 'growth accelerators', 'entrepreneurship accelerators', 'startup programs', 'business growth programs', 'accelerator programs', 'incubation programs', 'venture programs', 'startup support', 'business development programs', 'entrepreneur support', 'scale-up programs', 'growth programs', 'business mentorship programs'],
  'startup accelerators': ['business accelerators', 'venture accelerators', 'entrepreneurship accelerators', 'startup incubators'],

  // Business and Professional Services
  'business services': ['corporate services', 'commercial services', 'enterprise services', 'professional services', 'business support services', 'corporate support', 'business consulting', 'business advisory', 'professional consulting', 'management services', 'administrative services', 'office services', 'business solutions', 'corporate solutions'],
  'professional services': ['expert services', 'specialized services', 'consulting services', 'professional consulting', 'expert consulting', 'specialist services', 'professional advice', 'expert advice', 'professional support', 'specialized support'],
  'business and professional services': ['corporate and consulting services', 'enterprise and expert services', 'commercial and specialized services'],

  // Cellphone services
  'cellphone services': ['mobile services', 'cellular services', 'mobile phone services', 'smartphone services', 'mobile telecommunications', 'cellular telecommunications', 'mobile network services', 'cellular network services', 'mobile communication services', 'wireless services', 'mobile solutions', 'cellular solutions', 'mobile phone repair', 'smartphone repair', 'cellphone repair', 'mobile accessories', 'cellular accessories'],
  'mobile services': ['cellphone services', 'cellular services', 'wireless services', 'mobile telecom', 'mobile communication'],

  // Clothing and Textiles
  'clothing': ['apparel', 'garments', 'fashion', 'wear', 'attire', 'clothes', 'outfits', 'dress', 'garment manufacturing', 'apparel production', 'clothing manufacturing', 'fashion production', 'clothing design', 'fashion design', 'apparel design', 'clothing retail', 'fashion retail', 'apparel retail'],
  'textiles': ['fabrics', 'cloth', 'material', 'textile products', 'fabric products', 'textile manufacturing', 'fabric manufacturing', 'cloth production', 'textile materials', 'fabric materials', 'woven goods', 'textile goods', 'fabric goods'],
  'clothing and textiles': ['apparel and fabrics', 'garments and materials', 'fashion and textiles', 'clothes and fabrics'],

  // Computers & Internet
  'computers': ['computer systems', 'computing devices', 'PCs', 'desktops', 'laptops', 'computer hardware', 'computer equipment', 'computing equipment', 'computer services', 'IT equipment', 'technology equipment', 'computer repair', 'IT repair', 'computer maintenance', 'IT maintenance'],
  'internet': ['web services', 'online services', 'digital services', 'internet services', 'web connectivity', 'online connectivity', 'internet connectivity', 'broadband', 'internet access', 'web access', 'online access', 'internet solutions', 'web solutions', 'digital connectivity'],
  'computers & internet': ['IT and web services', 'technology and online services', 'computing and internet', 'digital technology services'],

  // Construction
  'construction': ['building', 'construction services', 'building services', 'construction work', 'building work', 'construction projects', 'building projects', 'construction development', 'building development', 'construction contracting', 'building contracting', 'general contracting', 'construction management', 'building management', 'construction engineering', 'building engineering', 'civil construction', 'building construction', 'property development', 'infrastructure development'],
  'building': ['construction', 'erection', 'structure building', 'property building', 'development construction'],

  // Education
  'education': ['learning', 'teaching', 'instruction', 'training', 'educational services', 'learning services', 'teaching services', 'instructional services', 'training services', 'educational programs', 'learning programs', 'training programs', 'educational courses', 'learning courses', 'training courses', 'educational institutions', 'learning institutions', 'training institutions', 'academic services', 'scholastic services'],
  'training': ['education', 'instruction', 'coaching', 'teaching', 'skills development', 'professional development', 'vocational training'],

  // Entertainment
  'entertainment': ['recreation', 'leisure', 'amusement', 'entertainment services', 'recreation services', 'leisure services', 'amusement services', 'entertainment production', 'recreation activities', 'leisure activities', 'entertainment events', 'recreation events', 'performance entertainment', 'media entertainment', 'digital entertainment', 'live entertainment'],
  'recreation': ['entertainment', 'leisure', 'amusement', 'pastime', 'diversion'],

  // Events
  'events': ['event planning', 'event management', 'event organization', 'event coordination', 'event services', 'event planning services', 'event management services', 'event organization services', 'corporate events', 'social events', 'special events', 'functions', 'occasions', 'celebrations', 'event production', 'event hosting', 'event facilitation'],
  'event planning': ['event management', 'event organization', 'event coordination', 'function planning'],

  // Financial services
  'financial services': ['banking services', 'finance services', 'financial solutions', 'financial products', 'financial advice', 'financial consulting', 'financial planning', 'wealth management', 'investment services', 'banking products', 'financial institutions', 'financial companies', 'financial advisory', 'financial consultancy', 'money services', 'capital services', 'funding services'],
  'banking': ['financial services', 'monetary services', 'finance services', 'bank services'],

  // Food and hospitality
  'food': ['food services', 'food products', 'food production', 'food manufacturing', 'food processing', 'culinary services', 'catering', 'food preparation', 'food distribution', 'food retail', 'food supply', 'food and beverage', 'F&B', 'culinary products'],
  'hospitality': ['hotel services', 'accommodation services', 'lodging services', 'hospitality industry', 'tourism services', 'guest services', 'hospitality management', 'hotel management', 'accommodation management', 'lodging management', 'hospitality solutions'],
  'food and hospitality': ['culinary and accommodation', 'food service and lodging', 'F&B and hospitality', 'catering and tourism'],

  // Funeral services
  'funeral services': ['funeral care', 'funeral arrangements', 'funeral planning', 'burial services', 'cremation services', 'memorial services', 'funeral homes', 'mortuary services', 'death care services', 'funeral directors', 'funeral parlors', 'bereavement services', 'funeral ceremonies', 'burial arrangements', 'cremation arrangements', 'memorial arrangements'],
  'burial services': ['funeral services', 'interment services', 'grave services', 'cemetery services'],

  // Health and Wellness
  'health': ['healthcare', 'medical services', 'health services', 'medical care', 'healthcare services', 'medical treatment', 'health treatment', 'wellness services', 'healthcare solutions', 'medical solutions', 'health solutions', 'preventive health', 'health maintenance', 'health improvement'],
  'wellness': ['wellbeing', 'health wellness', 'holistic health', 'preventive wellness', 'lifestyle wellness', 'wellness programs', 'health programs', 'wellness solutions', 'health and wellbeing', 'wellness care'],
  'health and wellness': ['healthcare and wellbeing', 'medical and wellness', 'health and wellbeing services'],

  // Home & Garden
  'home': ['household', 'residential', 'domestic', 'home services', 'household services', 'residential services', 'home improvement', 'home maintenance', 'home repair', 'household maintenance', 'residential maintenance', 'home care', 'household care'],
  'garden': ['gardening', 'landscaping', 'horticulture services', 'garden services', 'landscape services', 'garden maintenance', 'landscape maintenance', 'garden design', 'landscape design', 'garden care', 'landscape care', 'outdoor services'],
  'home & garden': ['household and gardening', 'residential and landscaping', 'domestic and horticulture'],

  // Insurance
  'insurance': ['insurance services', 'insurance products', 'insurance coverage', 'insurance policies', 'insurance solutions', 'risk management', 'insurance protection', 'insurance plans', 'insurance brokerage', 'insurance advisory', 'insurance consulting', 'insurance agency', 'insurance providers', 'cover services', 'assurance services'],
  'insurance services': ['coverage services', 'protection services', 'assurance services', 'risk coverage'],

  // Logistics
  'logistics': ['logistics services', 'supply chain', 'supply chain management', 'logistics management', 'transportation services', 'shipping services', 'delivery services', 'freight services', 'distribution services', 'warehousing', 'storage services', 'inventory management', 'logistics solutions', 'supply chain solutions', 'transport solutions', 'shipping solutions', 'distribution solutions'],
  'supply chain': ['logistics chain', 'distribution chain', 'supply network', 'logistics network'],

  // Marketing
  'marketing': ['marketing services', 'advertising', 'promotion', 'branding', 'digital marketing', 'online marketing', 'marketing strategy', 'marketing campaigns', 'marketing solutions', 'advertising services', 'promotional services', 'branding services', 'marketing consulting', 'marketing advisory', 'market research', 'consumer research', 'sales promotion', 'marketing communications'],
  'advertising': ['marketing', 'promotion', 'publicity', 'ad campaigns', 'marketing ads'],

  // Online shopping
  'online shopping': ['e-commerce', 'electronic commerce', 'online retail', 'internet shopping', 'web shopping', 'digital shopping', 'online stores', 'e-stores', 'virtual shopping', 'online marketplace', 'e-marketplace', 'digital marketplace', 'online purchasing', 'internet purchasing', 'web purchasing', 'online buying', 'e-tailing'],
  'e-commerce': ['online commerce', 'electronic business', 'digital commerce', 'internet commerce'],

  // Pets
  'pets': ['pet services', 'animal services', 'pet care', 'animal care', 'pet products', 'animal products', 'pet supplies', 'animal supplies', 'pet grooming', 'animal grooming', 'pet boarding', 'animal boarding', 'pet training', 'animal training', 'veterinary services', 'pet health', 'animal health', 'pet accessories', 'animal accessories'],
  'pet services': ['animal services', 'pet care services', 'animal care services', 'companion animal services'],

  // Photography
  'photography': ['photo services', 'photographic services', 'imaging services', 'photo shoots', 'photography sessions', 'photographic work', 'photo production', 'photographic production', 'commercial photography', 'portrait photography', 'event photography', 'wedding photography', 'product photography', 'photo editing', 'photographic editing', 'camera services', 'photography equipment'],
  'photo services': ['photography services', 'imaging services', 'camera services', 'photographic work'],

  // Property
  'property': ['real estate', 'property services', 'real estate services', 'property management', 'real estate management', 'property development', 'real estate development', 'property sales', 'real estate sales', 'property rental', 'real estate rental', 'property investment', 'real estate investment', 'property consulting', 'real estate consulting', 'property brokerage', 'real estate brokerage'],
  'real estate': ['property', 'real property', 'realty', 'land and buildings', 'property assets'],

  // Reseller
  'reseller': ['reselling', 'distribution', 'wholesale distribution', 'retail distribution', 'reseller services', 'distribution services', 'reseller business', 'distribution business', 'product reselling', 'merchandise reselling', 'inventory reselling', 'supply reselling', 'authorized reseller', 'certified reseller', 'value-added reseller'],
  'reselling': ['redistribution', 'retail distribution', 'wholesale redistribution', 'product distribution'],

  // Sports & Recreation
  'sports': ['athletics', 'sporting activities', 'sports services', 'athletic services', 'sports facilities', 'athletic facilities', 'sports equipment', 'athletic equipment', 'sports training', 'athletic training', 'sports coaching', 'athletic coaching', 'sports events', 'athletic events', 'sports management', 'athletic management'],
  'recreation': ['leisure activities', 'recreational activities', 'sports and games', 'pastime activities'],
  'sports & recreation': ['athletics and leisure', 'sporting and recreational', 'athletic and leisure activities'],

  // Technology
  'technology': ['tech', 'IT', 'information technology', 'tech services', 'technology services', 'IT services', 'technology solutions', 'IT solutions', 'tech products', 'technology products', 'IT products', 'tech consulting', 'technology consulting', 'IT consulting', 'tech support', 'technology support', 'IT support', 'tech development', 'technology development', 'IT development'],
  'IT': ['information technology', 'tech', 'computer technology', 'digital technology'],

  // Travel & Transport
  'travel': ['travel services', 'travel agency', 'travel planning', 'travel arrangements', 'tourism', 'tourist services', 'travel tourism', 'travel solutions', 'travel consulting', 'travel advisory', 'travel management', 'corporate travel', 'business travel', 'leisure travel', 'vacation planning'],
  'transport': ['transportation', 'transport services', 'transportation services', 'moving services', 'transport solutions', 'transportation solutions', 'passenger transport', 'goods transport', 'freight transport', 'logistics transport', 'vehicle transport'],
  'travel & transport': ['tourism and transportation', 'travel and moving services', 'journey and transport'],

  // Waste and Recycling
  'waste': ['waste management', 'waste services', 'garbage services', 'refuse services', 'trash services', 'waste disposal', 'garbage disposal', 'refuse disposal', 'trash disposal', 'waste collection', 'garbage collection', 'refuse collection', 'trash collection', 'waste solutions', 'waste handling'],
  'recycling': ['recycling services', 'reclamation', 'reprocessing', 'recycling solutions', 'waste recycling', 'material recycling', 'resource recovery', 'recycling management', 'recycling processing'],
  'waste and recycling': ['waste management and recycling', 'garbage and reclamation', 'refuse and reprocessing'],

  // Wholesale
  'wholesale': ['wholesaling', 'wholesale distribution', 'bulk sales', 'mass distribution', 'wholesale trade', 'wholesale business', 'wholesale services', 'bulk distribution', 'mass sales', 'wholesale supply', 'bulk supply', 'wholesale products', 'bulk products', 'wholesale goods', 'bulk goods', 'wholesale pricing', 'bulk pricing'],
  'wholesaling': ['wholesale distribution', 'bulk selling', 'mass merchandising', 'volume selling']
};

// Function to find synonyms for a given term
export function findSynonyms(term) {
  const normalizedTerm = term.toLowerCase().trim();
  return SEMANTIC_SYNONYMS[normalizedTerm] || [term];
}

// Function to expand search terms with synonyms
export function expandSearchTerms(terms) {
  const expandedTerms = new Set();
  
  terms.forEach(term => {
    expandedTerms.add(term);
    const synonyms = findSynonyms(term);
    synonyms.forEach(synonym => expandedTerms.add(synonym));
  });
  
  return Array.from(expandedTerms);
}

// Function to check if text contains any of the terms or their synonyms
export function containsTermOrSynonyms(text, terms) {
  const normalizedText = text.toLowerCase();
  const expandedTerms = expandSearchTerms(terms.map(t => t.toLowerCase()));
  
  return expandedTerms.some(term => normalizedText.includes(term));
}