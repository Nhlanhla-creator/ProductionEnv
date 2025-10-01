import React from 'react';
import FormField from './FormField';
import FileUpload from './FileUpload';
import { productCategories } from './applicationOptions';
import "./ProductApplication.css";

const ProductsServices = ({ data = {}, updateData }) => {
  const formData = {
    categories: [],
    keywords: '',
    scopeOfWorkFiles: [],
    ...data
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateData({ ...formData, [name]: value });
  };

  const handleCategoryChange = (category) => {
    const currentValues = formData.categories || [];
    const updatedCategories = currentValues.includes(category)
      ? currentValues.filter(c => c !== category)
      : [...currentValues, category];
    
    updateData({ ...formData, categories: updatedCategories });
  };

  const handleFileUpload = (files) => {
    updateData({ ...formData, scopeOfWorkFiles: files });
  };

  return (
    <div className="products-services-form">
      <h2>Required Products or Services</h2>
      
      <FormField label="Product/Service Category" >
        <div className="checkbox-grid">
          {productCategories.map(category => (
            <label key={category} className="checkbox-item">
              <input
                type="checkbox"
                checked={formData.categories?.includes(category) || false}
                onChange={() => handleCategoryChange(category)}
              />
              {category}
            </label>
          ))}
        </div>
      </FormField>

      <FormField label="Keywords / Specific Needs" >
        <textarea
          name="keywords"
          value={formData.keywords || ''}
          onChange={handleChange}
          className="form-textarea"
          rows={3}
        />
      </FormField>

      <FormField label="Upload Scope of Work" >
        <FileUpload
          files={formData.scopeOfWorkFiles || []}
          onChange={handleFileUpload}
        />
      </FormField>
    </div>
  );
};

export default ProductsServices;