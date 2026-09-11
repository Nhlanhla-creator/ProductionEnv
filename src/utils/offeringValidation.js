// src/utils/offeringValidation.js

export const validateOffering = (offering) => {
  const errors = []
  const warnings = []
  
  // Required fields
  if (!offering.offeringType) {
    errors.push('offeringType')
  }
  
  if (!offering.taxonomyId) {
    errors.push('taxonomyId')
  }
  
  if (!offering.name || offering.name.trim().length < 2) {
    errors.push('name')
  } else if (offering.name.length > 120) {
    warnings.push('Name exceeds 120 characters')
  }
  
  if (!offering.description || offering.description.trim().length < 20) {
    errors.push('description')
  } else if (offering.description.length > 1000) {
    warnings.push('Description exceeds 1000 characters')
  }
  
  if (!offering.deliveryModels || offering.deliveryModels.length === 0) {
    errors.push('deliveryModels')
  }
  
  if (!offering.industries || offering.industries.length === 0) {
    errors.push('industries')
  }
  
  // Lead time validation
  if (offering.minLeadTime && offering.maxLeadTime) {
    const minNum = parseFloat(offering.minLeadTime)
    const maxNum = parseFloat(offering.maxLeadTime)
    if (minNum > maxNum) {
      warnings.push('Minimum lead time cannot exceed maximum lead time')
    }
  }
  
  // Check if complete
  const isComplete = errors.length === 0
  
  return {
    valid: isComplete,
    errors,
    warnings,
    isComplete,
    status: isComplete ? 'complete' : 'incomplete',
  }
}

export const getOfferingStatus = (offering) => {
  const result = validateOffering(offering)
  return result.status
}

export const getRequiredFields = () => {
  return [
    'offeringType',
    'taxonomyId', 
    'name',
    'description',
    'deliveryModels',
    'industries',
  ]
}

export const getFieldLabel = (field) => {
  const labels = {
    offeringType: 'Offering Type',
    taxonomyId: 'Category',
    name: 'Offering Name',
    description: 'Description',
    deliveryModels: 'Delivery Models',
    industries: 'Industries Served',
    customerTypes: 'Customer Types',
    minLeadTime: 'Minimum Lead Time',
    maxLeadTime: 'Maximum Lead Time',
  }
  return labels[field] || field
}