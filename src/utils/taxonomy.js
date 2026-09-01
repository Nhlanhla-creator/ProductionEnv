// src/utils/taxonomy.js

import { taxonomyData, leafCategories, depthRules } from "../components/applicationOptions"

/**
 * Get a category by its ID
 */
export const getCategoryById = (id) => {
  if (!id) return null
  
  // Search in leaf categories
  const leaf = leafCategories.find(c => c.id === id)
  if (leaf) return leaf
  
  // Search in taxonomy tree
  for (const domain of taxonomyData) {
    for (const child of domain.children) {
      if (child.id === id) return child
    }
  }
  return null
}

/**
 * Get the breadcrumb path for a category
 */
export const getCategoryBreadcrumb = (categoryId) => {
  if (!categoryId) return null
  
  const category = getCategoryById(categoryId)
  if (!category) return null
  
  // Find the parent domain
  for (const domain of taxonomyData) {
    for (const child of domain.children) {
      if (child.id === category.parent || child.id === categoryId) {
        return {
          domain: domain.name,
          parent: child.id === categoryId ? null : child.name,
          leaf: category.name,
          fullPath: child.id === categoryId 
            ? `${domain.name} > ${child.name}`
            : `${domain.name} > ${child.name} > ${category.name}`
        }
      }
    }
  }
  return null
}

/**
 * Get the depth rule for a category
 */
export const getDepthRule = (categoryId) => {
  if (!categoryId) return { depth: 0, label: "None" }
  return depthRules[categoryId] || { depth: 0, label: "None" }
}

/**
 * Get depth label for display
 */
export const getDepthLabel = (categoryId) => {
  const rule = getDepthRule(categoryId)
  return rule.label
}

/**
 * Search taxonomy with ranking
 */
export const searchTaxonomy = (query, offeringType = "both", industries = [], description = "") => {
  if (!query || query.length < 2) return []
  
  const searchTerm = query.toLowerCase().trim()
  const results = []
  const seen = new Set()
  
  // Search leaf categories
  for (const leaf of leafCategories) {
    let score = 0
    
    // Name match
    if (leaf.name.toLowerCase().includes(searchTerm)) {
      score += 100
    }
    
    // Alias match
    if ((leaf.aliases || []).some(a => a.toLowerCase().includes(searchTerm))) {
      score += 80
    }
    
    // Partial word match in name
    const nameWords = leaf.name.toLowerCase().split(/\s+/)
    const searchWords = searchTerm.split(/\s+/)
    for (const sw of searchWords) {
      if (nameWords.some(nw => nw.includes(sw) || sw.includes(nw))) {
        score += 30
      }
    }
    
    if (score > 0) {
      const breadcrumb = getCategoryBreadcrumb(leaf.id)
      results.push({
        ...leaf,
        breadcrumb,
        matchType: score >= 100 ? "name" : score >= 80 ? "alias" : "partial",
        score,
      })
    }
  }
  
  // Search parent categories (if no leaf matches found)
  if (results.length === 0 || results.every(r => r.score < 30)) {
    for (const domain of taxonomyData) {
      for (const child of domain.children) {
        let score = 0
        
        if (child.name.toLowerCase().includes(searchTerm)) {
          score += 60
        }
        if ((child.aliases || []).some(a => a.toLowerCase().includes(searchTerm))) {
          score += 50
        }
        
        if (score > 0) {
          const leafChildren = leafCategories.filter(l => l.parent === child.id)
          const exampleLeaves = leafChildren.slice(0, 3).map(l => ({
            ...l,
            breadcrumb: getCategoryBreadcrumb(l.id),
          }))
          
          results.push({
            id: child.id,
            name: child.name,
            parent: child.parent || domain.id,
            aliases: child.aliases || [],
            breadcrumb: {
              domain: domain.name,
              parent: null,
              leaf: child.name,
              fullPath: `${domain.name} > ${child.name}`,
            },
            matchType: "parent",
            score: score + 20,
            examples: exampleLeaves,
            isParent: true,
          })
        }
      }
    }
  }
  
  // Deduplicate and sort
  const uniqueResults = results.filter(r => {
    const key = r.id
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  
  uniqueResults.sort((a, b) => b.score - a.score)
  
  return uniqueResults.slice(0, 8)
}

/**
 * Get all leaf categories for a parent
 */
export const getLeafCategoriesForParent = (parentId) => {
  return leafCategories.filter(l => l.parent === parentId)
}

/**
 * Check if a category has leaf children
 */
export const hasLeafChildren = (categoryId) => {
  return leafCategories.some(l => l.parent === categoryId)
}

/**
 * Get industry label from value
 */
export const getIndustryLabel = (value) => {
  const { industryOptions } = require("../components/applicationOptions")
  const option = industryOptions.find(o => o.value === value)
  return option ? option.label : value
}

/**
 * Get delivery model label from value
 */
export const getDeliveryModelLabel = (value, type = "product") => {
  const { productDeliveryRoles, serviceOperatingModels } = require("../components/applicationOptions")
  const models = type === "product" ? productDeliveryRoles : serviceOperatingModels
  const option = models.find(o => o.value === value)
  return option ? option.label : value
}