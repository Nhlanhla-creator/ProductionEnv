import React from "react";
import { Eye, EyeOff } from "lucide-react";

const FormInput = ({
  type = "text",
  placeholder,
  value,
  onChange,
  onKeyDown,
  icon: Icon,
  error,
  showPassword,
  onTogglePassword,
  disabled = false,
}) => {
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <>
      <div className={`input-field ${error ? "input-field-error" : ""}`}>
        <div className="input-icon">
          <Icon size={18} />
        </div>
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          disabled={disabled}
          className="input-text"
        />
        {isPassword && (
          <div className="password-toggle" onClick={onTogglePassword}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </div>
        )}
      </div>
      {error && <p className="error-text">{error}</p>}
    </>
  );
};

export default FormInput;