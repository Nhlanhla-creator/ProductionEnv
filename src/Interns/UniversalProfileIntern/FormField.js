"use client"

const FormFieldCustom = ({ label, type, value, onChange, placeholder, rows = 3, ...props }) => {
  const handleChange = (e) => {
    onChange(e.target.value)
  }

  if (type === "textarea") {
    return (
      <div style={{ marginBottom: "16px" }}>
        {label && (
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "600",
              color: "#4a352f",
              marginBottom: "8px",
            }}
          >
            {label}
          </label>
        )}
        <textarea
          value={value || ""}
          onChange={handleChange}
          placeholder={placeholder}
          rows={rows}
          style={{
            width: "100%",
            minHeight: `${rows * 24}px`,
            padding: "12px 16px",
            border: "2px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "14px",
            fontFamily: "inherit",
            lineHeight: "1.5",
            resize: "vertical",
            backgroundColor: "#ffffff",
            transition: "border-color 0.2s ease",
            outline: "none",
            boxSizing: "border-box",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#a67c52"
            e.target.style.boxShadow = "0 0 0 3px rgba(166, 124, 82, 0.1)"
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#e5e7eb"
            e.target.style.boxShadow = "none"
          }}
          {...props}
        />
      </div>
    )
  }

  // For other input types, use regular styling
  return (
    <div style={{ marginBottom: "16px" }}>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: "14px",
            fontWeight: "600",
            color: "#4a352f",
            marginBottom: "8px",
          }}
        >
          {label}
        </label>
      )}
      <input
        type={type}
        value={value || ""}
        onChange={handleChange}
        placeholder={placeholder}
        style={{
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
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#a67c52"
          e.target.style.boxShadow = "0 0 0 3px rgba(166, 124, 82, 0.1)"
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#e5e7eb"
          e.target.style.boxShadow = "none"
        }}
        {...props}
      />
    </div>
  )
}

export default FormFieldCustom
