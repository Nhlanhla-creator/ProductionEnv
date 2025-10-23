import React, { useState } from "react";
import FormField from "./FormField";
import FileUpload from "./FileUpload";
import { engagementTypes, deliveryModes, africanCountries, productCategories } from "./applicationOptions";
import "./ProductApplication.css";

// Currency formatter function
const formatCurrency = (value) => {
  if (!value) return '';
  const numericValue = value.replace(/[^\d]/g, '');
  if (!numericValue) return '';
  return `R ${parseInt(numericValue).toLocaleString()}`;
};

// Comprehensive subcategories mapping from your synonyms data
const subcategories = {
  "Agriculture": [
    "Farming", "Agribusiness", "Crop Production", "Livestock", "Agricultural Services",
    "Farming Operations", "Cultivation", "Harvesting", "Agricultural Production",
    "Farm Management", "Agricultural Development", "Agro-processing", "Agricultural Consulting",
    "Farm Services", "Crop Farming", "Animal Husbandry", "Agricultural Equipment",
    "Farm Supplies", "Agricultural Inputs", "Agronomy", "Horticulture", "Viticulture",
    "Aquaculture", "Poultry Farming", "Dairy Farming"
  ],
  "Alternative Medicine": [
    "Holistic Medicine", "Complementary Medicine", "Natural Medicine", "Traditional Medicine",
    "Integrative Medicine", "Non-conventional Medicine", "Herbal Medicine", "Homeopathy",
    "Acupuncture", "Chiropractic", "Ayurveda", "Naturopathy", "Traditional Healing",
    "Energy Healing", "Reiki", "Reflexology", "Aromatherapy", "Functional Medicine",
    "Complementary Therapies", "Alternative Therapies", "Natural Healing"
  ],
  "Art": [
    "Fine Art", "Visual Arts", "Creative Arts", "Artwork", "Artistic Works", "Crafts",
    "Artistic Creations", "Creative Works", "Artistic Expression", "Visual Expression",
    "Artistic Services", "Art Creation", "Art Production", "Artistic Design",
    "Creative Design", "Artistic Craftsmanship", "Artisan Work", "Creative Work"
  ],
  "Attorneys & Legal Services": [
    "Lawyers", "Legal Practitioners", "Advocates", "Legal Attorneys", "Counsel",
    "Legal Counsel", "Barristers", "Solicitors", "Legal Representatives",
    "Legal Advisors", "Jurists", "Legal Professionals", "Law Services",
    "Legal Assistance", "Legal Help", "Legal Representation", "Legal Advice",
    "Legal Consultancy", "Legal Support", "Legal Guidance", "Legal Counseling"
  ],
  "Automotive": [
    "Vehicle Services", "Car Services", "Auto Services", "Automobile Services",
    "Motor Vehicle Services", "Car Repair", "Auto Repair", "Vehicle Repair",
    "Automotive Repair", "Car Maintenance", "Auto Maintenance", "Vehicle Maintenance",
    "Mechanic Services", "Auto Mechanics", "Car Mechanics", "Automotive Mechanics",
    "Auto Body Repair", "Car Detailing", "Auto Detailing", "Vehicle Detailing",
    "Tire Services", "Auto Parts", "Car Parts", "Vehicle Parts"
  ],
  "Beauty & Fitness": [
    "Cosmetics", "Aesthetics", "Beauty Care", "Beauty Treatments", "Beauty Services",
    "Cosmetic Services", "Aesthetic Services", "Beauty Therapy", "Beauty Salon",
    "Spa Services", "Wellness Beauty", "Personal Care", "Grooming Services",
    "Beauty Products", "Cosmetic Products", "Skincare", "Haircare", "Makeup",
    "Beauty Enhancements", "Fitness", "Exercise", "Workout", "Physical Fitness",
    "Gym Services", "Fitness Training", "Personal Training", "Exercise Programs",
    "Fitness Classes", "Health Fitness", "Wellness Fitness", "Bodybuilding",
    "Cardio Training", "Strength Training", "Fitness Coaching", "Fitness Instruction"
  ],
  "Business accelerators": [
    "Startup Accelerators", "Business Incubators", "Venture Accelerators",
    "Growth Accelerators", "Entrepreneurship Accelerators", "Startup Programs",
    "Business Growth Programs", "Accelerator Programs", "Incubation Programs",
    "Venture Programs", "Startup Support", "Business Development Programs",
    "Entrepreneur Support", "Scale-up Programs", "Growth Programs",
    "Business Mentorship Programs"
  ],
  "Business and Professional Services": [
    "Corporate Services", "Commercial Services", "Enterprise Services",
    "Professional Services", "Business Support Services", "Corporate Support",
    "Business Consulting", "Business Advisory", "Professional Consulting",
    "Management Services", "Administrative Services", "Office Services",
    "Business Solutions", "Corporate Solutions", "Expert Services",
    "Specialized Services", "Consulting Services", "Expert Consulting",
    "Specialist Services", "Professional Advice", "Expert Advice"
  ],
  "Cellphone services": [
    "Mobile Services", "Cellular Services", "Mobile Phone Services",
    "Smartphone Services", "Mobile Telecommunications", "Cellular Telecommunications",
    "Mobile Network Services", "Cellular Network Services", "Mobile Communication Services",
    "Wireless Services", "Mobile Solutions", "Cellular Solutions",
    "Mobile Phone Repair", "Smartphone Repair", "Cellphone Repair",
    "Mobile Accessories", "Cellular Accessories"
  ],
  "Clothing and Textiles": [
    "Apparel", "Garments", "Fashion", "Wear", "Attire", "Clothes", "Outfits",
    "Dress", "Garment Manufacturing", "Apparel Production", "Clothing Manufacturing",
    "Fashion Production", "Clothing Design", "Fashion Design", "Apparel Design",
    "Clothing Retail", "Fashion Retail", "Apparel Retail", "Textiles", "Fabrics",
    "Cloth", "Material", "Textile Products", "Fabric Products", "Textile Manufacturing",
    "Fabric Manufacturing", "Cloth Production", "Textile Materials", "Fabric Materials"
  ],
  "Computers & Internet": [
    "Computer Systems", "Computing Devices", "PCs", "Desktops", "Laptops",
    "Computer Hardware", "Computer Equipment", "Computing Equipment",
    "Computer Services", "IT Equipment", "Technology Equipment", "Computer Repair",
    "IT Repair", "Computer Maintenance", "IT Maintenance", "Internet", "Web Services",
    "Online Services", "Digital Services", "Internet Services", "Web Connectivity",
    "Online Connectivity", "Internet Connectivity", "Broadband", "Internet Access",
    "Web Access", "Online Access", "Internet Solutions", "Web Solutions"
  ],
  "Construction": [
    "Building", "Construction Services", "Building Services", "Construction Work",
    "Building Work", "Construction Projects", "Building Projects", "Construction Development",
    "Building Development", "Construction Contracting", "Building Contracting",
    "General Contracting", "Construction Management", "Building Management",
    "Construction Engineering", "Building Engineering", "Civil Construction",
    "Building Construction", "Property Development", "Infrastructure Development"
  ],
  "Education": [
    "Learning", "Teaching", "Instruction", "Training", "Educational Services",
    "Learning Services", "Teaching Services", "Instructional Services", "Training Services",
    "Educational Programs", "Learning Programs", "Training Programs", "Educational Courses",
    "Learning Courses", "Training Courses", "Educational Institutions", "Learning Institutions",
    "Training Institutions", "Academic Services", "Scholastic Services"
  ],
  "Entertainment": [
    "Recreation", "Leisure", "Amusement", "Entertainment Services", "Recreation Services",
    "Leisure Services", "Amusement Services", "Entertainment Production",
    "Recreation Activities", "Leisure Activities", "Entertainment Events",
    "Recreation Events", "Performance Entertainment", "Media Entertainment",
    "Digital Entertainment", "Live Entertainment"
  ],
  "Events": [
    "Event Planning", "Event Management", "Event Organization", "Event Coordination",
    "Event Services", "Event Planning Services", "Event Management Services",
    "Event Organization Services", "Corporate Events", "Social Events", "Special Events",
    "Functions", "Occasions", "Celebrations", "Event Production", "Event Hosting",
    "Event Facilitation"
  ],
  "Financial services": [
    "Banking Services", "Finance Services", "Financial Solutions", "Financial Products",
    "Financial Advice", "Financial Consulting", "Financial Planning", "Wealth Management",
    "Investment Services", "Banking Products", "Financial Institutions", "Financial Companies",
    "Financial Advisory", "Financial Consultancy", "Money Services", "Capital Services",
    "Funding Services"
  ],
  "Food and hospitality": [
    "Food Services", "Food Products", "Food Production", "Food Manufacturing",
    "Food Processing", "Culinary Services", "Catering", "Food Preparation",
    "Food Distribution", "Food Retail", "Food Supply", "Food and Beverage", "F&B",
    "Culinary Products", "Hospitality", "Hotel Services", "Accommodation Services",
    "Lodging Services", "Hospitality Industry", "Tourism Services", "Guest Services",
    "Hospitality Management", "Hotel Management", "Accommodation Management"
  ],
  "Funeral services": [
    "Funeral Care", "Funeral Arrangements", "Funeral Planning", "Burial Services",
    "Cremation Services", "Memorial Services", "Funeral Homes", "Mortuary Services",
    "Death Care Services", "Funeral Directors", "Funeral Parlors", "Bereavement Services",
    "Funeral Ceremonies", "Burial Arrangements", "Cremation Arrangements",
    "Memorial Arrangements"
  ],
  "Health and Wellness": [
    "Healthcare", "Medical Services", "Health Services", "Medical Care",
    "Healthcare Services", "Medical Treatment", "Health Treatment", "Wellness Services",
    "Healthcare Solutions", "Medical Solutions", "Health Solutions", "Preventive Health",
    "Health Maintenance", "Health Improvement", "Wellbeing", "Holistic Health",
    "Preventive Wellness", "Lifestyle Wellness", "Wellness Programs", "Health Programs",
    "Wellness Solutions", "Wellness Care"
  ],
  "Home & Garden": [
    "Household", "Residential", "Domestic", "Home Services", "Household Services",
    "Residential Services", "Home Improvement", "Home Maintenance", "Home Repair",
    "Household Maintenance", "Residential Maintenance", "Home Care", "Household Care",
    "Garden", "Gardening", "Landscaping", "Horticulture Services", "Garden Services",
    "Landscape Services", "Garden Maintenance", "Landscape Maintenance", "Garden Design",
    "Landscape Design", "Garden Care", "Landscape Care", "Outdoor Services"
  ],
  "Insurance": [
    "Insurance Services", "Insurance Products", "Insurance Coverage", "Insurance Policies",
    "Insurance Solutions", "Risk Management", "Insurance Protection", "Insurance Plans",
    "Insurance Brokerage", "Insurance Advisory", "Insurance Consulting", "Insurance Agency",
    "Insurance Providers", "Cover Services", "Assurance Services"
  ],
  "Logistics": [
    "Logistics Services", "Supply Chain", "Supply Chain Management", "Logistics Management",
    "Transportation Services", "Shipping Services", "Delivery Services", "Freight Services",
    "Distribution Services", "Warehousing", "Storage Services", "Inventory Management",
    "Logistics Solutions", "Supply Chain Solutions", "Transport Solutions",
    "Shipping Solutions", "Distribution Solutions"
  ],
  "Marketing": [
    "Marketing Services", "Advertising", "Promotion", "Branding", "Digital Marketing",
    "Online Marketing", "Marketing Strategy", "Marketing Campaigns", "Marketing Solutions",
    "Advertising Services", "Promotional Services", "Branding Services", "Marketing Consulting",
    "Marketing Advisory", "Market Research", "Consumer Research", "Sales Promotion",
    "Marketing Communications"
  ],
  "Online shopping": [
    "E-commerce", "Electronic Commerce", "Online Retail", "Internet Shopping",
    "Web Shopping", "Digital Shopping", "Online Stores", "E-stores", "Virtual Shopping",
    "Online Marketplace", "E-marketplace", "Digital Marketplace", "Online Purchasing",
    "Internet Purchasing", "Web Purchasing", "Online Buying", "E-tailing"
  ],
  "Pets": [
    "Pet Services", "Animal Services", "Pet Care", "Animal Care", "Pet Products",
    "Animal Products", "Pet Supplies", "Animal Supplies", "Pet Grooming", "Animal Grooming",
    "Pet Boarding", "Animal Boarding", "Pet Training", "Animal Training", "Veterinary Services",
    "Pet Health", "Animal Health", "Pet Accessories", "Animal Accessories"
  ],
  "Photography": [
    "Photo Services", "Photographic Services", "Imaging Services", "Photo Shoots",
    "Photography Sessions", "Photographic Work", "Photo Production", "Photographic Production",
    "Commercial Photography", "Portrait Photography", "Event Photography", "Wedding Photography",
    "Product Photography", "Photo Editing", "Photographic Editing", "Camera Services",
    "Photography Equipment"
  ],
  "Property": [
    "Real Estate", "Property Services", "Real Estate Services", "Property Management",
    "Real Estate Management", "Property Development", "Real Estate Development",
    "Property Sales", "Real Estate Sales", "Property Rental", "Real Estate Rental",
    "Property Investment", "Real Estate Investment", "Property Consulting",
    "Real Estate Consulting", "Property Brokerage", "Real Estate Brokerage"
  ],
  "Reseller": [
    "Reselling", "Distribution", "Wholesale Distribution", "Retail Distribution",
    "Reseller Services", "Distribution Services", "Reseller Business", "Distribution Business",
    "Product Reselling", "Merchandise Reselling", "Inventory Reselling", "Supply Reselling",
    "Authorized Reseller", "Certified Reseller", "Value-added Reseller"
  ],
  "Sports & Recreation": [
    "Athletics", "Sporting Activities", "Sports Services", "Athletic Services",
    "Sports Facilities", "Athletic Facilities", "Sports Equipment", "Athletic Equipment",
    "Sports Training", "Athletic Training", "Sports Coaching", "Athletic Coaching",
    "Sports Events", "Athletic Events", "Sports Management", "Athletic Management",
    "Recreation", "Leisure Activities", "Recreational Activities"
  ],
  "Technology": [
    "Tech", "IT", "Information Technology", "Tech Services", "Technology Services",
    "IT Services", "Technology Solutions", "IT Solutions", "Tech Products",
    "Technology Products", "IT Products", "Tech Consulting", "Technology Consulting",
    "IT Consulting", "Tech Support", "Technology Support", "IT Support", "Tech Development",
    "Technology Development", "IT Development"
  ],
  "Travel & Transport": [
    "Travel Services", "Travel Agency", "Travel Planning", "Travel Arrangements",
    "Tourism", "Tourist Services", "Travel Tourism", "Travel Solutions", "Travel Consulting",
    "Travel Advisory", "Travel Management", "Corporate Travel", "Business Travel",
    "Leisure Travel", "Vacation Planning", "Transport", "Transportation",
    "Transport Services", "Transportation Services", "Moving Services", "Transport Solutions",
    "Transportation Solutions", "Passenger Transport", "Goods Transport", "Freight Transport"
  ],
  "Waste and Recycling": [
    "Waste Management", "Waste Services", "Garbage Services", "Refuse Services",
    "Trash Services", "Waste Disposal", "Garbage Disposal", "Refuse Disposal",
    "Trash Disposal", "Waste Collection", "Garbage Collection", "Refuse Collection",
    "Trash Collection", "Waste Solutions", "Waste Handling", "Recycling",
    "Recycling Services", "Reclamation", "Reprocessing", "Recycling Solutions",
    "Waste Recycling", "Material Recycling", "Resource Recovery", "Recycling Management"
  ],
  "Wholesale": [
    "Wholesaling", "Wholesale Distribution", "Bulk Sales", "Mass Distribution",
    "Wholesale Trade", "Wholesale Business", "Wholesale Services", "Bulk Distribution",
    "Mass Sales", "Wholesale Supply", "Bulk Supply", "Wholesale Products", "Bulk Products",
    "Wholesale Goods", "Bulk Goods", "Wholesale Pricing", "Bulk Pricing"
  ]
};

// MultiSelect Component
const MultiSelectField = ({ 
  label, 
  options, 
  selectedValues = [], 
  onChange, 
  error, 
  required,
  placeholder = "Select options..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div style={{ marginBottom: "20px", position: "relative" }}>
      <label style={{
        display: "block",
        fontSize: "14px",
        fontWeight: "600",
        color: "#4a352f",
        marginBottom: "8px",
      }}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      
      {/* Dropdown Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          border: "2px solid #e5e7eb",
          borderRadius: "8px",
          padding: "12px 16px",
          backgroundColor: "#ffffff",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: "48px",
          transition: "border-color 0.2s ease",
          borderColor: isOpen ? "#a67c52" : "#e5e7eb"
        }}
      >
        <div style={{ flex: 1 }}>
          {selectedValues && selectedValues.length > 0 ? (
            <div style={{ 
              display: "flex", 
              flexWrap: "wrap", 
              gap: "4px",
              alignItems: "center"
            }}>
              {selectedValues.slice(0, 3).map((value, index) => (
                <span
                  key={index}
                  style={{
                    backgroundColor: "#f3f4f6",
                    color: "#5d4037",
                    padding: "2px 6px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    border: "1px solid #e5e7eb"
                  }}
                >
                  {value}
                </span>
              ))}
              {selectedValues.length > 3 && (
                <span style={{
                  color: "#6b7280",
                  fontSize: "12px",
                  fontWeight: "500"
                }}>
                  +{selectedValues.length - 3} more
                </span>
              )}
            </div>
          ) : (
            <span style={{ color: "#9ca3af", fontSize: "14px" }}>
              {placeholder}
            </span>
          )}
        </div>
        
        {/* Dropdown Arrow */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            color: "#6b7280"
          }}
        >
          <path 
            d="M6 9l6 6 6-6" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
      
      {/* Dropdown Content */}
      {isOpen && (
        <div style={{
          position: "absolute",
          zIndex: 1000,
          width: "100%",
          maxHeight: "200px",
          overflowY: "auto",
          backgroundColor: "#ffffff",
          border: "2px solid #a67c52",
          borderRadius: "8px",
          marginTop: "2px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
        }}>
          {options.map((option) => (
            <label 
              key={option}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "8px",
                cursor: "pointer",
                fontSize: "14px",
                padding: "8px 12px",
                borderBottom: "1px solid #f3f4f6",
                transition: "background-color 0.1s ease"
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "#f9fafb"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
              onClick={(e) => {
                e.stopPropagation();
                onChange(option);
              }}
            >
              <input
                type="checkbox"
                checked={selectedValues?.includes(option) || false}
                onChange={() => {}} // Handled by label click
                style={{
                  width: "16px",
                  height: "16px",
                  accentColor: "#a67c52"
                }}
              />
              {option}
            </label>
          ))}
        </div>
      )}
      
      {/* Selection Summary */}
      {selectedValues && selectedValues.length > 0 && (
        <div style={{ 
          fontSize: "12px", 
          color: "#6b7280", 
          marginTop: "4px" 
        }}>
          {selectedValues.length} selected
        </div>
      )}
      
      {error && (
        <div style={{ 
          color: "#ef4444", 
          fontSize: "12px", 
          marginTop: "4px" 
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

const RequestOverview = ({ data = {}, updateData }) => {
  // Initialize with default values
  const [formData, setFormData] = useState({
    purpose: '',
    categories: [],
    subcategories: [],
    keywords: '',
    scopeOfWorkFiles: [],
    engagementType: '',
    engagementTypeOther: '',
    deliveryModes: [],
    startDate: '',
    endDate: '',
    location: '',
    minBudget: '',
    maxBudget: '',
    esdProgram: null,
    ...data
  });

  const handleInputChange = (field, value) => {
    const updatedData = { ...formData, [field]: value };
    
    // If categories change, reset subcategories
    if (field === 'categories') {
      updatedData.subcategories = [];
    }
    
    setFormData(updatedData);
    updateData(updatedData);
  };

  const handleMultiSelectChange = (field, option) => {
    const currentSelections = formData[field] || [];
    let updatedSelections;
    
    if (currentSelections.includes(option)) {
      updatedSelections = currentSelections.filter(item => item !== option);
    } else {
      updatedSelections = [...currentSelections, option];
    }
    
    handleInputChange(field, updatedSelections);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle currency formatting for budget fields
    if (name === 'minBudget' || name === 'maxBudget') {
      const formattedValue = formatCurrency(value);
      handleInputChange(name, formattedValue);
    } else {
      handleInputChange(name, value);
    }
  };

  const handleCheckboxChange = (field, value) => {
    const currentValues = formData[field] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    handleInputChange(field, newValues);
  };

  const handleRadioChange = (value) => {
    handleInputChange('esdProgram', value === 'yes');
  };

  const handleFileUpload = (files) => {
    handleInputChange('scopeOfWorkFiles', files);
  };

  // Check if "Other" is selected in engagement type
  const showEngagementTypeOther = formData.engagementType === 'Other';
  
  // Get available subcategories based on selected categories
  const availableSubcategories = formData.categories.flatMap(category => 
    subcategories[category] || []
  );

  // Check if any selected category has subcategories
  const hasSubcategories = formData.categories.some(category => 
    subcategories[category] && subcategories[category].length > 0
  );

  return (
    <div className="request-overview-form">
      <h2>Request Overview</h2>

      {/* Purpose Textarea */}
      <FormField label="Purpose of Request" >
        <textarea
          name="purpose"
          value={formData.purpose}
          onChange={handleChange}
          className="form-textarea large"
          rows={4}
          placeholder="Describe the purpose and objectives of your request..."
        />
      </FormField>

      {/* Product/Service Category - Multi-select Dropdown */}
      <MultiSelectField
        label="Product/Service Category *"
        options={productCategories}
        selectedValues={formData.categories}
        onChange={(option) => handleMultiSelectChange('categories', option)}
        placeholder="Select product/service categories..."
        required
      />

      {/* Subcategories - Conditional Multi-select */}
      {hasSubcategories && (
        <MultiSelectField
          label="Specific Subcategories"
          options={availableSubcategories}
          selectedValues={formData.subcategories}
          onChange={(option) => handleMultiSelectChange('subcategories', option)}
          placeholder="Select specific subcategories..."
        />
      )}

      {/* Keywords / Specific Needs */}
      <FormField label="Keywords / Specific Needs" >
        <textarea
          name="keywords"
          value={formData.keywords || ''}
          onChange={handleChange}
          className="form-textarea"
          rows={3}
          placeholder="Enter specific keywords, brands, or requirements..."
        />
      </FormField>

      {/* Upload Scope of Work */}
      <FormField label="Upload Scope of Work" >
        <FileUpload
          files={formData.scopeOfWorkFiles || []}
          onChange={handleFileUpload}
        />
      </FormField>

      <div className="grid-container">
        {/* Engagement Type Dropdown */}
        <FormField label="Type of Engagement" >
          <select
            name="engagementType"
            value={formData.engagementType}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">Select engagement type</option>
            {engagementTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </FormField>

        {/* Show specification field when "Other" is selected */}
        {showEngagementTypeOther && (
          <FormField label="Please specify engagement type" >
            <input
              type="text"
              name="engagementTypeOther"
              value={formData.engagementTypeOther}
              onChange={handleChange}
              className="form-input"
              placeholder="Please specify the type of engagement"
              required
            />
          </FormField>
        )}

        {/* Delivery Mode Checkboxes */}
        <FormField label="Preferred Delivery Mode" >
          <div className="checkbox-group">
            {deliveryModes.map(mode => (
              <label key={mode} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={formData.deliveryModes.includes(mode)}
                  onChange={() => handleCheckboxChange('deliveryModes', mode)}
                />
                {mode}
              </label>
            ))}
          </div>
        </FormField>

        {/* Date Inputs */}
        <FormField label="Start Date" >
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="form-input"
            min={new Date().toISOString().split('T')[0]}
          />
        </FormField>

        <FormField label="End Date" >
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="form-input"
            min={formData.startDate || new Date().toISOString().split('T')[0]}
          />
        </FormField>

        {/* Location Dropdown */}
        <FormField label="Location" >
          <select
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">Select country</option>
            {africanCountries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </FormField>

        {/* Budget Inputs with Currency Formatting */}
        <FormField label="Budget Range (ZAR)" >
          <div className="flex-row">
            <input
              type="text"
              name="minBudget"
              value={formData.minBudget}
              onChange={handleChange}
              placeholder="R 0"
              className="form-input"
              style={{ color: formData.minBudget ? 'black' : '#9CA3AF' }}
            />
            <span className="mx-2">to</span>
            <input
              type="text"
              name="maxBudget"
              value={formData.maxBudget}
              onChange={handleChange}
              placeholder="R 0"
              className="form-input"
              style={{ color: formData.maxBudget ? 'black' : '#9CA3AF' }}
            />
          </div>
        </FormField>

        {/* Radio Buttons */}
        <FormField label="Linked to ESD/CSR Program?">
          <div className="radio-group">
            <label className="radio-item">
              <input
                type="radio"
                name="esdProgram"
                checked={formData.esdProgram === true}
                onChange={() => handleRadioChange('yes')}
              />
              Yes
            </label>
            <label className="radio-item">
              <input
                type="radio"
                name="esdProgram"
                checked={formData.esdProgram === false}
                onChange={() => handleRadioChange('no')}
              />
              No
            </label>
          </div>
        </FormField>
      </div>
    </div>
  );
};

export default RequestOverview;