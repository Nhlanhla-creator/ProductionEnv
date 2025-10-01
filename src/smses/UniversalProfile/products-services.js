"use client"
import { Plus, Trash2 } from 'lucide-react'
import FormField from "./form-field"
import FileUpload from "./file-upload"
import './UniversalProfile.css';

// Updated category options for Products and Services
const categoryOptions = [
  { value: "Agriculture", label: "Agriculture" },
  { value: "Alternative Medicine", label: "Alternative Medicine" },
  { value: "Art", label: "Art" },
  { value: "Attorneys & Legal Services", label: "Attorneys & Legal Services" },
  { value: "Automotive", label: "Automotive" },
  { value: "Beauty & Fitness", label: "Beauty & Fitness" },
  { value: "Business accelerators", label: "Business accelerators" },
  { value: "Business and Professional Services", label: "Business and Professional Services" },
  { value: "Cellphone services", label: "Cellphone services" },
  { value: "Clothing and Textiles", label: "Clothing and Textiles" },
  { value: "Computers & Internet", label: "Computers & Internet" },
  { value: "Construction", label: "Construction" },
  { value: "Education", label: "Education" },
  { value: "Entertainment", label: "Entertainment" },
  { value: "Events", label: "Events" },
  { value: "Financial services", label: "Financial services" },
  { value: "Food and hospitality", label: "Food and hospitality" },
  { value: "Funeral services", label: "Funeral services" },
  { value: "Health and Wellness", label: "Health and Wellness" },
  { value: "Home & Garden", label: "Home & Garden" },
  { value: "Insurance", label: "Insurance" },
  { value: "Logistics", label: "Logistics" },
  { value: "Marketing", label: "Marketing" },
  { value: "Online shopping", label: "Online shopping" },
  { value: "Pets", label: "Pets" },
  { value: "Photography", label: "Photography" },
  { value: "Property", label: "Property" },
  { value: "Reseller", label: "Reseller" },
  { value: "Sports & Recreation", label: "Sports & Recreation" },
  { value: "Technology", label: "Technology" },
  { value: "Travel & Transport", label: "Travel & Transport" },
  { value: "Waste and Recycling", label: "Waste and Recycling" },
  { value: "Wholesale", label: "Wholesale" }
]

// Industry options for Key Clients/Customers (keeping the original ones)
const industryOptions = [
  { value: "Generalist", label: "Generalist" },
  { value: "Agriculture", label: "Agriculture" },
  { value: "Automotive", label: "Automotive" },
  { value: "Banking, Finance & Insurance", label: "Banking, Finance & Insurance" },
  { value: "Beauty / Cosmetics / Personal Care", label: "Beauty / Cosmetics / Personal Care" },
  { value: "Construction", label: "Construction" },
  { value: "Consulting", label: "Consulting" },
  { value: "Creative Arts / Design", label: "Creative Arts / Design" },
  { value: "Customer Service", label: "Customer Service" },
  { value: "Education & Training", label: "Education & Training" },
  { value: "Engineering", label: "Engineering" },
  { value: "Environmental / Natural Sciences", label: "Environmental / Natural Sciences" },
  { value: "Government / Public Sector", label: "Government / Public Sector" },
  { value: "Healthcare / Medical", label: "Healthcare / Medical" },
  { value: "Hospitality / Tourism", label: "Hospitality / Tourism" },
  { value: "Human Resources", label: "Human Resources" },
  { value: "Information Technology (IT)", label: "Information Technology (IT)" },
  { value: "Infrastructure", label: "Infrastructure" },
  { value: "Legal / Law", label: "Legal / Law" },
  { value: "Logistics / Supply Chain", label: "Logistics / Supply Chain" },
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "Marketing / Advertising / PR", label: "Marketing / Advertising / PR" },
  { value: "Media / Journalism / Broadcasting", label: "Media / Journalism / Broadcasting" },
  { value: "Mining", label: "Mining" },
  { value: "Energy", label: "Energy" },
  { value: "Oil & Gas", label: "Oil & Gas" },
  { value: "Non-Profit / NGO", label: "Non-Profit / NGO" },
  { value: "Property / Real Estate", label: "Property / Real Estate" },
  { value: "Retail / Wholesale", label: "Retail / Wholesale" },
  { value: "Safety & Security / Police / Defence", label: "Safety & Security / Police / Defence" },
  { value: "Sales", label: "Sales" },
  { value: "Science & Research", label: "Science & Research" },
  { value: "Social Services / Social Work", label: "Social Services / Social Work" },
  { value: "Sports / Recreation / Fitness", label: "Sports / Recreation / Fitness" },
  { value: "Telecommunications", label: "Telecommunications" },
  { value: "Transport", label: "Transport" },
  { value: "Utilities (Water, Electricity, Waste)", label: "Utilities (Water, Electricity, Waste)" },
]

export default function ProductsServices({ data = {}, updateData }) {
  const handleChange = (e) => {
    const { name, value } = e.target
    updateData({ [name]: value })
  }

  const handleFileChange = (name, files) => {
    updateData({ [name]: files })
  }

  const handleOfferingTypeChange = (e) => {
    const value = e.target.value
    updateData({ 
      offeringType: value,
      // Clear categories that are no longer relevant
      ...(!value.includes('products') && { productCategories: [] }),
      ...(!value.includes('services') && { serviceCategories: [] })
    })
  }

  const handleMultiSelect = (name, value) => {
    const currentValues = data[name] || []
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value]

    updateData({ [name]: newValues })
  }

  const addProductCategory = () => {
    const productCategories = data.productCategories || []
    updateData({ productCategories: [...productCategories, { name: "", products: [] }] })
  }

  const updateProductCategory = (index, field, value) => {
    const productCategories = [...(data.productCategories || [])]
    productCategories[index] = { ...productCategories[index], [field]: value }
    updateData({ productCategories })
  }

  const removeProductCategory = (index) => {
    const productCategories = [...(data.productCategories || [])]
    productCategories.splice(index, 1)
    updateData({ productCategories })
  }

  const addProduct = (categoryIndex) => {
    const productCategories = [...(data.productCategories || [])]
    const products = productCategories[categoryIndex].products || []
    productCategories[categoryIndex].products = [...products, { name: "", description: "" }]
    updateData({ productCategories })
  }

  const updateProduct = (categoryIndex, productIndex, field, value) => {
    const productCategories = [...(data.productCategories || [])]
    productCategories[categoryIndex].products[productIndex] = {
      ...productCategories[categoryIndex].products[productIndex],
      [field]: value,
    }
    updateData({ productCategories })
  }

  const removeProduct = (categoryIndex, productIndex) => {
    const productCategories = [...(data.productCategories || [])]
    productCategories[categoryIndex].products.splice(productIndex, 1)
    updateData({ productCategories })
  }

  const addServiceCategory = () => {
    const serviceCategories = data.serviceCategories || []
    updateData({ serviceCategories: [...serviceCategories, { name: "", services: [] }] })
  }

  const updateServiceCategory = (index, field, value) => {
    const serviceCategories = [...(data.serviceCategories || [])]
    serviceCategories[index] = { ...serviceCategories[index], [field]: value }
    updateData({ serviceCategories })
  }

  const removeServiceCategory = (index) => {
    const serviceCategories = [...(data.serviceCategories || [])]
    serviceCategories.splice(index, 1)
    updateData({ serviceCategories })
  }

  const addService = (categoryIndex) => {
    const serviceCategories = [...(data.serviceCategories || [])]
    const services = serviceCategories[categoryIndex].services || []
    serviceCategories[categoryIndex].services = [...services, { name: "", description: "" }]
    updateData({ serviceCategories })
  }

  const updateService = (categoryIndex, serviceIndex, field, value) => {
    const serviceCategories = [...(data.serviceCategories || [])]
    serviceCategories[categoryIndex].services[serviceIndex] = {
      ...serviceCategories[categoryIndex].services[serviceIndex],
      [field]: value,
    }
    updateData({ serviceCategories })
  }

  const removeService = (categoryIndex, serviceIndex) => {
    const serviceCategories = [...(data.serviceCategories || [])]
    serviceCategories[categoryIndex].services.splice(serviceIndex, 1)
    updateData({ serviceCategories })
  }

  const addClient = () => {
    const keyClients = data.keyClients || []
    updateData({ keyClients: [...keyClients, { name: "", industry: "" }] })
  }

  const updateClient = (index, field, value) => {
    const keyClients = [...(data.keyClients || [])]
    keyClients[index] = { ...keyClients[index], [field]: value }
    updateData({ keyClients })
  }

  const removeClient = (index) => {
    const keyClients = [...(data.keyClients || [])]
    keyClients.splice(index, 1)
    updateData({ keyClients })
  }

  const showProducts = data.offeringType === 'products' || data.offeringType === 'both'
  const showServices = data.offeringType === 'services' || data.offeringType === 'both'

  return (
    <div>
      <h2 className="text-2xl font-bold text-brown-800 mb-6">Products, Services & Offerings</h2>

      {/* Offering Type Selection */}
      <div className="mb-8">
        <FormField label="What does your business offer?" >
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="offeringType"
                value="products"
                checked={data.offeringType === 'products'}
                onChange={handleOfferingTypeChange}
                className="mr-3 h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300"
                required
              />
              <span className="text-brown-700">Products only</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="offeringType"
                value="services"
                checked={data.offeringType === 'services'}
                onChange={handleOfferingTypeChange}
                className="mr-3 h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300"
                required
              />
              <span className="text-brown-700">Services only</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="offeringType"
                value="both"
                checked={data.offeringType === 'both'}
                onChange={handleOfferingTypeChange}
                className="mr-3 h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300"
                required
              />
              <span className="text-brown-700">Both products and services</span>
            </label>
          </div>
        </FormField>
      </div>

      {/* Show guidance only after selection */}
      {data.offeringType && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">
            🛠️ {showProducts && showServices ? 'Product & Service' : showProducts ? 'Product' : 'Service'} Description – Guidance for Completion
          </h3>
          <p className="text-blue-700 mb-4">
            To help us <strong>match your business with the right funders, corporates, and service providers</strong>, 
            please provide clear and structured information about what your company offers. Accurate descriptions 
            improve your chances of being shortlisted.
          </p>
          <p className="text-blue-700 mb-4">
            You may list <strong>multiple {showProducts && showServices ? 'products and services' : showProducts ? 'products' : 'services'}</strong>, each with its own category.
          </p>

          <div className="space-y-4">
            {showProducts && (
              <>
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">
                    📦 1. Product Category (e.g. "Food and hospitality", "Technology", "Clothing and Textiles")
                  </h4>
                  <p className="text-blue-700 mb-2">
                    Select from our predefined categories that best describe the <strong>broad grouping</strong> your product(s) fall under.
                  </p>
                  <p className="text-blue-700 mb-1"><strong>Available Categories:</strong></p>
                  <ul className="text-blue-700 text-sm list-disc list-inside ml-4">
                    <li>Agriculture</li>
                    <li>Technology</li>
                    <li>Food and hospitality</li>
                    <li>Beauty & Fitness</li>
                    <li>Clothing and Textiles</li>
                    <li>Construction</li>
                    <li>And many more...</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">
                    📝 2. List of Products (under that category)
                  </h4>
                  <p className="text-blue-700 mb-2">
                    List your actual products or product types. Be specific where possible.
                  </p>
                  <p className="text-blue-700 mb-1"><strong>Examples (under Food and hospitality):</strong></p>
                  <ul className="text-blue-700 text-sm list-disc list-inside ml-4">
                    <li>Organic Spice Blends</li>
                    <li>Artisan Bread Products</li>
                    <li>Catering Equipment</li>
                    <li>Restaurant Management Software</li>
                  </ul>
                </div>
              </>
            )}

            {showServices && (
              <>
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">
                    🛎️ {showProducts ? '3' : '1'}. Service Category (e.g. "Marketing", "Business and Professional Services", "Technology")
                  </h4>
                  <p className="text-blue-700 mb-2">
                    Select from our predefined categories that best describe the <strong>type of services</strong> you offer.
                  </p>
                  <p className="text-blue-700 mb-1"><strong>Available Categories:</strong></p>
                  <ul className="text-blue-700 text-sm list-disc list-inside ml-4">
                    <li>Business and Professional Services</li>
                    <li>Marketing</li>
                    <li>Technology</li>
                    <li>Financial services</li>
                    <li>Education</li>
                    <li>Logistics</li>
                    <li>And many more...</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">
                    📋 {showProducts ? '4' : '2'}. List of Services (under that category)
                  </h4>
                  <p className="text-blue-700 mb-2">
                    Detail the services you provide within that category. Be clear and include niche specialties where applicable.
                  </p>
                  <p className="text-blue-700 mb-1"><strong>Examples (under Technology):</strong></p>
                  <ul className="text-blue-700 text-sm list-disc list-inside ml-4">
                    <li>Website Development</li>
                    <li>Mobile App Development</li>
                    <li>IT Support & Maintenance</li>
                    <li>Cloud Solutions</li>
                    <li>Cybersecurity Consulting</li>
                  </ul>
                </div>
              </>
            )}

            <div className="bg-blue-100 p-4 rounded-md">
              <h4 className="font-semibold text-blue-800 mb-2">🔍 Why It Matters</h4>
              <p className="text-blue-700 mb-2">We use your descriptions to:</p>
              <ul className="text-blue-700 text-sm list-disc list-inside ml-4">
                <li>Match you with <strong>corporates or buyers</strong> looking for your type of offering</li>
                <li>Connect you to <strong>relevant funding opportunities</strong></li>
                <li>Recommend <strong>service providers</strong> to support your growth</li>
              </ul>
              <p className="text-blue-700 mt-2">
                Please be detailed, honest, and professional — what you write here determines <strong>who sees you and what opportunities open up</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Target Market Section - Show only after offering type is selected */}
      {data.offeringType && (
        <div className="mb-8">
          <FormField label="Target Market" >
            <textarea
              name="targetMarket"
              value={data.targetMarket || ""}
              onChange={handleChange}
              rows={3}
              placeholder="Describe your primary customers or market segments (e.g., SMEs in manufacturing, individual consumers aged 25-45, government departments, etc.)"
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              required
            />
          </FormField>
        </div>
      )}

      {/* Products and Services Section - Show only relevant sections */}
      {data.offeringType && (
        <div className="bg-brown-50 p-6 rounded-lg mb-8">
          {/* Products Section */}
          {showProducts && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-brown-700">Product Categories & Products</h4>
                <button
                  type="button"
                  onClick={addProductCategory}
                  className="flex items-center px-3 py-1 bg-brown-100 text-brown-700 rounded-md hover:bg-brown-200"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Category
                </button>
              </div>

              {(data.productCategories || []).map((category, categoryIndex) => (
                <div key={categoryIndex} className="mb-4 p-4 bg-white rounded-md border border-brown-200">
                  <div className="flex justify-between items-center mb-2">
                    <FormField label="Category Name" className="flex-1 mr-4 mb-0">
                      <select
                        value={category.name || ""}
                        onChange={(e) => updateProductCategory(categoryIndex, "name", e.target.value)}
                        className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                        required
                      >
                        <option value="">Select Category</option>
                        {categoryOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <button
                      type="button"
                      onClick={() => removeProductCategory(categoryIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="ml-4 mt-2">
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="text-sm font-medium text-brown-600">Products</h5>
                      <button
                        type="button"
                        onClick={() => addProduct(categoryIndex)}
                        className="flex items-center px-2 py-1 text-xs bg-brown-100 text-brown-700 rounded-md hover:bg-brown-200"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Product
                      </button>
                    </div>

                    {(category.products || []).map((product, productIndex) => (
                      <div key={productIndex} className="flex items-start mb-2">
                        <div className="flex-1 mr-2">
                          <input
                            type="text"
                            value={product.name || ""}
                            onChange={(e) => updateProduct(categoryIndex, productIndex, "name", e.target.value)}
                            placeholder="Product Name"
                            className="w-full px-3 py-2 text-sm border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                          />
                        </div>
                        <div className="flex-1 mr-2">
                          <input
                            type="text"
                            value={product.description || ""}
                            onChange={(e) => updateProduct(categoryIndex, productIndex, "description", e.target.value)}
                            placeholder="Brief Description"
                            className="w-full px-3 py-2 text-sm border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeProduct(categoryIndex, productIndex)}
                          className="text-red-500 hover:text-red-700 mt-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Services Section */}
          {showServices && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-brown-700">Service Categories & Services</h4>
                <button
                  type="button"
                  onClick={addServiceCategory}
                  className="flex items-center px-3 py-1 bg-brown-100 text-brown-700 rounded-md hover:bg-brown-200"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Category
                </button>
              </div>

              {(data.serviceCategories || []).map((category, categoryIndex) => (
                <div key={categoryIndex} className="mb-4 p-4 bg-white rounded-md border border-brown-200">
                  <div className="flex justify-between items-center mb-2">
                    <FormField label="Category Name" required className="flex-1 mr-4 mb-0">
                      <select
                        value={category.name || ""}
                        onChange={(e) => updateServiceCategory(categoryIndex, "name", e.target.value)}
                        className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                        required
                      >
                        <option value="">Select Category</option>
                        {categoryOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <button
                      type="button"
                      onClick={() => removeServiceCategory(categoryIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="ml-4 mt-2">
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="text-sm font-medium text-brown-600">Services</h5>
                      <button
                        type="button"
                        onClick={() => addService(categoryIndex)}
                        className="flex items-center px-2 py-1 text-xs bg-brown-100 text-brown-700 rounded-md hover:bg-brown-200"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Service
                      </button>
                    </div>

                    {(category.services || []).map((service, serviceIndex) => (
                      <div key={serviceIndex} className="flex items-start mb-2">
                        <div className="flex-1 mr-2">
                          <input
                            type="text"
                            value={service.name || ""}
                            onChange={(e) => updateService(categoryIndex, serviceIndex, "name", e.target.value)}
                            placeholder="Service Name"
                            className="w-full px-3 py-2 text-sm border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                          />
                        </div>
                        <div className="flex-1 mr-2">
                          <input
                            type="text"
                            value={service.description || ""}
                            onChange={(e) => updateService(categoryIndex, serviceIndex, "description", e.target.value)}
                            placeholder="Brief Description"
                            className="w-full px-3 py-2 text-sm border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeService(categoryIndex, serviceIndex)}
                          className="text-red-500 hover:text-red-700 mt-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Key Clients Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-medium text-brown-700">Key Clients/Customers (optional)</h4>
              <button
                type="button"
                onClick={addClient}
                className="flex items-center px-3 py-1 bg-brown-100 text-brown-700 rounded-md hover:bg-brown-200"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Client
              </button>
            </div>

            {(data.keyClients || []).map((client, index) => (
              <div key={index} className="flex items-center mb-2">
                <div className="flex-1 mr-2">
                  <input
                    type="text"
                    value={client.name || ""}
                    onChange={(e) => updateClient(index, "name", e.target.value)}
                    placeholder="Client Name"
                    className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                  />
                </div>
                <div className="flex-1 mr-2">
                  <select
                    value={client.industry || ""}
                    onChange={(e) => updateClient(index, "industry", e.target.value)}
                    className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                  >
                    <option value="">Select Industry</option>
                    {industryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="button" onClick={() => removeClient(index)} className="text-red-500 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-end">
     
      </div>
    </div>
  )
}