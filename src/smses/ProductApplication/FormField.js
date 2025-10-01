import React from 'react';
import PropTypes from 'prop-types';
import "./ProductApplication.css";

const FormField = ({ 
  label, 
  required, 
  children, 
  error, 
  helperText, 
  className = '' 
}) => {
  const renderChildren = () => {
    if (!React.isValidElement(children)) {
      return children;
    }

    // Preserve all existing props
    const existingProps = {
      ...children.props,
      className: `${children.props?.className || ''} ${error ? 'error' : ''}`.trim() || undefined
    };

    return React.cloneElement(children, existingProps);
  };

  return (
    <div className={`form-field ${className}`}>
      <label className="form-field-label">
        {label}
        {required && <span className="required-asterisk">*</span>}
      </label>
      <div className="form-field-content">
        {renderChildren()}
        {helperText && (
          <div className={`helper-text ${error ? 'error-text' : ''}`}>
            {helperText}
          </div>
        )}
      </div>
    </div>
  );
};

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  required: PropTypes.bool,
  children: PropTypes.node.isRequired,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  className: PropTypes.string
};

export default FormField;