"use client"
import FormField from "./FormField";

import styles from "./AdvisorProfile.module.css"

const countryOptions = [
{ value: "Algeria", label: "Algeria" },
  { value: "Angola", label: "Angola" },
  { value: "Benin", label: "Benin" },
  { value: "Botswana", label: "Botswana" },
  { value: "Burkina Faso", label: "Burkina Faso" },
  { value: "Burundi", label: "Burundi" },
  { value: "Cabo Verde", label: "Cabo Verde" },
  { value: "Cameroon", label: "Cameroon" },
  { value: "Central African Republic", label: "Central African Republic" },
  { value: "Chad", label: "Chad" },
  { value: "Comoros", label: "Comoros" },
  { value: "Congo", label: "Congo" },
  { value: "Côte d'Ivoire", label: "Côte d'Ivoire" },
  { value: "Djibouti", label: "Djibouti" },
  { value: "DR Congo", label: "DR Congo" },
  { value: "Egypt", label: "Egypt" },
  { value: "Equatorial Guinea", label: "Equatorial Guinea" },
  { value: "Eritrea", label: "Eritrea" },
  { value: "Eswatini", label: "Eswatini" },
  { value: "Ethiopia", label: "Ethiopia" },
  { value: "Gabon", label: "Gabon" },
  { value: "Gambia", label: "Gambia" },
  { value: "Ghana", label: "Ghana" },
  { value: "Guinea", label: "Guinea" },
  { value: "Guinea-Bissau", label: "Guinea-Bissau" },
  { value: "Kenya", label: "Kenya" },
  { value: "Lesotho", label: "Lesotho" },
  { value: "Liberia", label: "Liberia" },
  { value: "Libya", label: "Libya" },
  { value: "Madagascar", label: "Madagascar" },
  { value: "Malawi", label: "Malawi" },
  { value: "Mali", label: "Mali" },
  { value: "Mauritania", label: "Mauritania" },
  { value: "Mauritius", label: "Mauritius" },
  { value: "Morocco", label: "Morocco" },
  { value: "Mozambique", label: "Mozambique" },
  { value: "Namibia", label: "Namibia" },
  { value: "Niger", label: "Niger" },
  { value: "Nigeria", label: "Nigeria" },
  { value: "Rwanda", label: "Rwanda" },
  { value: "São Tomé and Príncipe", label: "São Tomé and Príncipe" },
  { value: "Senegal", label: "Senegal" },
  { value: "Seychelles", label: "Seychelles" },
  { value: "Sierra Leone", label: "Sierra Leone" },
  { value: "Somalia", label: "Somalia" },
  { value: "South Africa", label: "South Africa" },
  { value: "South Sudan", label: "South Sudan" },
  { value: "Sudan", label: "Sudan" },
  { value: "Tanzania", label: "Tanzania" },
  { value: "Togo", label: "Togo" },
  { value: "Tunisia", label: "Tunisia" },
  { value: "Uganda", label: "Uganda" },
  { value: "Zambia", label: "Zambia" },
  { value: "Zimbabwe", label: "Zimbabwe" },
]

const southAfricaProvinces = [
  { value: "gauteng", label: "Gauteng" },
  { value: "western_cape", label: "Western Cape" },
  { value: "kwazulu_natal", label: "KwaZulu-Natal" },
  { value: "eastern_cape", label: "Eastern Cape" },
  { value: "free_state", label: "Free State" },
  { value: "limpopo", label: "Limpopo" },
  { value: "mpumalanga", label: "Mpumalanga" },
  { value: "northern_cape", label: "Northern Cape" },
  { value: "north_west", label: "North West" },
]

const preferredContactMethods = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "sms", label: "SMS" },
]

export default function ContactDetails({ data = {}, updateData }) {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    updateData({ [name]: type === "checkbox" ? checked : value })
  }

  const handleCountryChange = (e) => {
    const { value } = e.target
    updateData({ 
      country: value,
      province: "", // Reset province when country changes
      city: "" // Reset city when country changes
    })
  }

  const getProvinceOptions = () => {
    if (data.country === "South Africa") {
      return southAfricaProvinces
    }
    return []
  }

  return (
    <div className={styles.productApplicationContainer}>
      <h2 className={styles.productApplicationHeading}>Contact Information</h2>

      <div className={styles.formContent}>
        {/* Primary Contact */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
        
          </h3>

          <div className={styles.gridContainer}>
            <FormField label="Title">
              <select
                name="title"
                value={data.title || ""}
                onChange={handleChange}
                className={styles.formSelect}
              >
                <option value="">Select Title</option>
                <option value="mr">Mr</option>
                <option value="mrs">Mrs</option>
                <option value="ms">Ms</option>
                <option value="dr">Dr</option>
                <option value="prof">Prof</option>
              </select>
            </FormField>

            <FormField label="Name">
              <input
                type="text"
                name="name"
                value={data.name || ""}
                onChange={handleChange}
                className={styles.formInput}
              />
            </FormField>
          </div>

          <div className={styles.gridContainer}>
            <FormField label="Surname">
              <input
                type="text"
                name="surname"
                value={data.surname || ""}
                onChange={handleChange}
                className={styles.formInput}
              />
            </FormField>

            <FormField label="Position">
              <input
                type="text"
                name="position"
                value={data.position || ""}
                onChange={handleChange}
                className={styles.formInput}
              />
            </FormField>
          </div>

          <div className={styles.gridContainer}>
            <FormField label="Mobile">
              <input
                type="tel"
                name="mobile"
                value={data.mobile || ""}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="e.g., +27 82 123 4567"
              />
            </FormField>

            <FormField label="Email">
              <input
                type="email"
                name="email"
                value={data.email || ""}
                onChange={handleChange}
                className={styles.formInput}
              />
            </FormField>
          </div>

          <div className={styles.gridContainer}>
            <FormField label="Location - Country">
              <select
                name="country"
                value={data.country || ""}
                onChange={handleCountryChange}
                className={styles.formSelect}
              >
                <option value="">Select Country</option>
                {countryOptions.map((country) => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </select>
            </FormField>

            {data.country === "South Africa" && (
              <FormField label="Province">
                <select
                  name="province"
                  value={data.province || ""}
                  onChange={handleChange}
                  className={styles.formSelect}
                >
                  <option value="">Select Province</option>
                  {getProvinceOptions().map((province) => (
                    <option key={province.value} value={province.value}>
                      {province.label}
                    </option>
                  ))}
                </select>
              </FormField>
            )}
          </div>

          {data.country && (
            <FormField label="City">
              <input
                type="text"
                name="city"
                value={data.city || ""}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="Enter city"
              />
            </FormField>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="remoteVirtualAvailable"
                checked={data.remoteVirtualAvailable || false}
                onChange={handleChange}
                className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300 rounded mr-2"
              />
              <span className="text-sm text-gray-700">Remote/Virtual Available</span>
            </label>
          </div>

          <FormField label="LinkedIn Profile">
            <input
              type="url"
              name="linkedinProfile"
              value={data.linkedinProfile || ""}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="https://linkedin.com/in/..."
            />
          </FormField>

          <FormField label="Preferred contact method">
            <select
              name="preferredContactMethod"
              value={data.preferredContactMethod || ""}
              onChange={handleChange}
              className={styles.formSelect}
            >
              <option value="">Select Contact Method</option>
              {preferredContactMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </div>
    </div>
  )
}