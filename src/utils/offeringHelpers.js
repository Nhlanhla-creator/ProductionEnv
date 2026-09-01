// src/utils/offeringHelpers.js

import { getCategoryBreadcrumb, getCategoryById } from './taxonomy'

/**
 * Get display breadcrumb for an offering
 */
export const getOfferingBreadcrumb = (offering) => {
  if (!offering || !offering.taxonomyId) return null
  const breadcrumb = getCategoryBreadcrumb(offering.taxonomyId)
  return breadcrumb ? breadcrumb.fullPath : null
}

/**
 * Check if offering is complete enough for matching
 */
export const isOfferingReadyForMatching = (offering) => {
  return (
    offering.taxonomyId &&
    offering.name && offering.name.trim().length >= 2 &&
    offering.description && offering.description.trim().length >= 20 &&
    offering.deliveryModels && offering.deliveryModels.length > 0 &&
    offering.industries && offering.industries.length > 0
  )
}

/**
 * Get completion percentage for an offering
 */
export const getOfferingCompletionPercentage = (offering) => {
  const fields = [
    'offeringType',
    'taxonomyId',
    'name',
    'description',
    'deliveryModels',
    'industries',
  ]
  
  let completed = 0
  for (const field of fields) {
    if (field === 'deliveryModels' || field === 'industries') {
      if (offering[field] && offering[field].length > 0) completed++
    } else if (offering[field]) {
      if (field === 'name' && offering[field].trim().length < 2) continue
      if (field === 'description' && offering[field].trim().length < 20) continue
      completed++
    }
  }
  
  return Math.round((completed / fields.length) * 100)
}

/**
 * Get display name for delivery model type
 */
export const getDeliveryModelTypeLabel = (offeringType) => {
  if (offeringType === 'product') return 'Product Delivery Role'
  if (offeringType === 'service') return 'Service Operating Model'
  return 'Delivery Model'
}

/**
 * Get default industries from profile
 */
export const getDefaultIndustries = (profileIndustries = []) => {
  return profileIndustries
}

/**
 * Get default customer types from profile
 */
export const getDefaultCustomerTypes = (profileCustomerTypes = []) => {
  return profileCustomerTypes
}