"use client"

const FormFieldCustom = ({ label, type, value, onChange, placeholder, rows = 3, options = [], required = false, error = null, ...props }) => {
  const handleChange = (e) => {
    onChange(e.target.value)
  }

  // Common styles
  const baseInputStyles = {
    width: "100%",
    padding: "12px 16px",
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "inherit",
    backgroundColor: "#ffffff",
    transition: "border-color 0.2s ease",
    outline: "none",
    boxSizing: "border-box",
  }

  const focusStyles = {
    borderColor: "#a67c52",
    boxShadow: "0 0 0 3px rgba(166, 124, 82, 0.1)"
  }

  const blurStyles = {
    borderColor: "#e5e7eb",
    boxShadow: "none"
  }

  const labelStyles = {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: "#4a352f",
    marginBottom: "8px",
  }

  if (type === "dropdown" || type === "select") {
    return (
      <div style={{ marginBottom: "16px" }}>
        {label && (
          <label style={labelStyles}>
            {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
          </label>
        )}
        <select
          value={value || ""}
          onChange={handleChange}
          required={required}
          style={{
            ...baseInputStyles,
            cursor: "pointer",
            // Add some padding for the dropdown arrow
            paddingRight: "40px",
            appearance: "none",
            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            backgroundSize: "16px",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = focusStyles.borderColor
            e.target.style.boxShadow = focusStyles.boxShadow
          }}
          onBlur={(e) => {
            e.target.style.borderColor = blurStyles.borderColor
            e.target.style.boxShadow = blurStyles.boxShadow
          }}
          {...props}
        >
          {options.map((option, index) => (
            <option key={index} value={option}>
              {option === "" ? "Select an option..." : option}
            </option>
          ))}
        </select>
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
    )
  }

  if (type === "textarea") {
    return (
      <div style={{ marginBottom: "16px" }}>
        {label && (
          <label style={labelStyles}>
            {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
          </label>
        )}
        <textarea
          value={value || ""}
          onChange={handleChange}
          placeholder={placeholder}
          rows={rows}
          required={required}
          style={{
            ...baseInputStyles,
            minHeight: `${rows * 24}px`,
            lineHeight: "1.5",
            resize: "vertical",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = focusStyles.borderColor
            e.target.style.boxShadow = focusStyles.boxShadow
          }}
          onBlur={(e) => {
            e.target.style.borderColor = blurStyles.borderColor
            e.target.style.boxShadow = blurStyles.boxShadow
          }}
          {...props}
        />
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
    )
  }

  // For other input types (text, email, number, etc.)
  return (
    <div style={{ marginBottom: "16px" }}>
      {label && (
        <label style={labelStyles}>
          {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
        </label>
      )}
      <input
        type={type}
        value={value || ""}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        style={baseInputStyles}
        onFocus={(e) => {
          e.target.style.borderColor = focusStyles.borderColor
          e.target.style.boxShadow = focusStyles.boxShadow
        }}
        onBlur={(e) => {
          e.target.style.borderColor = blurStyles.borderColor
          e.target.style.boxShadow = blurStyles.boxShadow
        }}
        {...props}
      />
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
  )
}

export default FormFieldCustom