// src/components/OfferingCategorySearch.js
"use client"

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Search, X, Plus, ChevronDown } from 'lucide-react'
import { searchTaxonomy, getCategoryBreadcrumb, getDepthLabel } from '../utils/taxonomy'

export default function OfferingCategorySearch({ 
  value, 
  onChange, 
  offeringType = "both", 
  profileIndustries = [],
  onCustomCategory,
  placeholder = "Start typing what your business provides...",
  required = false,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customCategoryName, setCustomCategoryName] = useState('')
  const [customCategoryParent, setCustomCategoryParent] = useState('')
  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const debounceTimer = useRef(null)

  // Load selected category on mount or when value changes
  useEffect(() => {
    if (value) {
      const cat = getCategoryById(value)
      if (cat) {
        const breadcrumb = getCategoryBreadcrumb(value)
        setSelectedCategory({ ...cat, breadcrumb })
        setSearchTerm(cat.name)
      }
    } else {
      setSelectedCategory(null)
      setSearchTerm('')
    }
  }, [value])

  // Handle search with debounce
  const handleSearchChange = (e) => {
    const term = e.target.value
    setSearchTerm(term)
    
    if (selectedCategory) {
      setSelectedCategory(null)
      onChange(null)
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    if (term.length >= 2) {
      debounceTimer.current = setTimeout(() => {
        const results = searchTaxonomy(term, offeringType, profileIndustries, '')
        setSearchResults(results)
        setIsOpen(true)
      }, 200)
    } else {
      setSearchResults([])
      setIsOpen(false)
    }
  }

  // Select a category
  const handleSelectCategory = (category) => {
    const breadcrumb = getCategoryBreadcrumb(category.id)
    setSelectedCategory({ ...category, breadcrumb })
    setSearchTerm(category.name)
    onChange(category.id)
    setIsOpen(false)
    setSearchResults([])
  }

  // Clear selection
  const handleClear = () => {
    setSelectedCategory(null)
    setSearchTerm('')
    onChange(null)
    setIsOpen(false)
    inputRef.current?.focus()
  }

  // Handle custom category submission
  const handleSubmitCustom = () => {
    if (customCategoryName.trim()) {
      if (onCustomCategory) {
        onCustomCategory({
          name: customCategoryName.trim(),
          parent: customCategoryParent || null
        })
      }
      setShowCustomForm(false)
      setCustomCategoryName('')
      setCustomCategoryParent('')
      setIsOpen(false)
      // Show success feedback
      alert(`Category suggestion "${customCategoryName.trim()}" submitted for review.`)
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Helper to get category by ID
  const getCategoryById = (id) => {
    const { getCategoryById: getCat } = require('../utils/taxonomy')
    return getCat(id)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => {
            if (searchTerm.length >= 2 && searchResults.length > 0) {
              setIsOpen(true)
            }
          }}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '12px 40px 12px 44px',
            border: selectedCategory ? '2px solid #8B4513' : '1px solid #d6c4a8',
            borderRadius: '8px',
            fontSize: '14px',
            backgroundColor: selectedCategory ? '#fdf6ed' : 'white',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            color: '#3d2b1f',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#8B4513'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,69,19,0.1)'
          }}
          onBlur={(e) => {
            if (!selectedCategory) {
              e.currentTarget.style.borderColor = '#d6c4a8'
            }
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
        <Search 
          size={18} 
          style={{ 
            position: 'absolute', 
            left: '12px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: selectedCategory ? '#8B4513' : '#999'
          }} 
        />
        {selectedCategory && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#999',
              padding: '4px',
            }}
          >
            <X size={16} />
          </button>
        )}
        {required && !selectedCategory && (
          <span style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#dc2626',
            fontSize: '14px',
          }}>*</span>
        )}
      </div>

      {/* Selected category display */}
      {selectedCategory && selectedCategory.breadcrumb && (
        <div style={{ 
          marginTop: '10px', 
          padding: '12px 16px',
          backgroundColor: '#fdf6ed',
          borderRadius: '8px',
          border: '1px solid #d6c4a8',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            flexWrap: 'wrap',
          }}>
            <span style={{ 
              fontSize: '12px', 
              color: '#8B6F47',
              fontWeight: '500',
            }}>
              {selectedCategory.breadcrumb.fullPath}
            </span>
            <span style={{
              fontSize: '10px',
              padding: '2px 10px',
              borderRadius: '12px',
              backgroundColor: '#8B4513',
              color: 'white',
              fontWeight: '600',
            }}>
              Depth: {getDepthLabel(selectedCategory.id)}
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory(null)
                setSearchTerm('')
                onChange(null)
                inputRef.current?.focus()
              }}
              style={{
                marginLeft: 'auto',
                padding: '4px 12px',
                backgroundColor: 'transparent',
                border: '1px solid #d6c4a8',
                borderRadius: '4px',
                color: '#5c3a1e',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
              }}
            >
              Change
            </button>
          </div>
          {selectedCategory.description && (
            <p style={{ 
              fontSize: '12px', 
              color: '#5c3a1e',
              marginTop: '4px',
              marginBottom: 0,
            }}>
              {selectedCategory.description}
            </p>
          )}
        </div>
      )}

      {/* Search results dropdown */}
      {isOpen && searchResults.length > 0 && createPortal(
        <div
          style={{
            position: 'fixed',
            zIndex: 9999,
            backgroundColor: 'white',
            border: '1px solid #d6c4a8',
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            maxHeight: '400px',
            overflow: 'auto',
            minWidth: '320px',
            maxWidth: '560px',
          }}
          ref={(el) => {
            if (el && containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect()
              el.style.top = `${rect.bottom + 4}px`
              el.style.left = `${Math.min(rect.left, window.innerWidth - 400)}px`
              el.style.width = `${Math.min(rect.width, 560)}px`
            }
          }}
        >
          <div style={{ padding: '8px' }}>
            {searchResults.map((result, index) => (
              <div
                key={result.id}
                onClick={() => {
                  if (result.isParent) {
                    // If it's a parent category, find the first leaf child
                    const { leafCategories } = require('../components/applicationOptions')
                    const leafChild = leafCategories.find(l => l.parent === result.id)
                    if (leafChild) {
                      handleSelectCategory(leafChild)
                    }
                  } else {
                    handleSelectCategory(result)
                  }
                }}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  borderBottom: index < searchResults.length - 1 ? '1px solid #f5f0e8' : 'none',
                  transition: 'background-color 0.15s',
                  borderRadius: '4px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#faf5ef'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '600', color: '#3d2b1f', fontSize: '13px' }}>
                        {result.name}
                      </span>
                      {result.isParent && (
                        <span style={{
                          fontSize: '9px',
                          padding: '1px 8px',
                          borderRadius: '10px',
                          backgroundColor: '#e8e0d8',
                          color: '#5c3a1e',
                          fontWeight: '500',
                        }}>
                          Category
                        </span>
                      )}
                      {result.matchType === 'alias' && (
                        <span style={{
                          fontSize: '9px',
                          padding: '1px 8px',
                          borderRadius: '10px',
                          backgroundColor: '#e8f0fe',
                          color: '#4a6fa5',
                          fontWeight: '500',
                        }}>
                          Alias
                        </span>
                      )}
                    </div>
                    {result.breadcrumb && (
                      <div style={{ 
                        fontSize: '11px', 
                        color: '#8B6F47',
                        marginTop: '2px',
                      }}>
                        {result.breadcrumb.fullPath}
                      </div>
                    )}
                    {result.examples && result.examples.length > 0 && (
                      <div style={{ 
                        fontSize: '11px', 
                        color: '#999',
                        marginTop: '4px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px',
                      }}>
                        <span style={{ color: '#8B6F47' }}>Examples:</span>
                        {result.examples.map((ex, i) => (
                          <span key={i} style={{
                            padding: '1px 8px',
                            backgroundColor: '#f5f0e8',
                            borderRadius: '10px',
                            fontSize: '10px',
                          }}>
                            {ex.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* "Can't find it?" link */}
          <div style={{
            padding: '10px 14px',
            borderTop: '1px solid #f5f0e8',
            backgroundColor: '#faf8f5',
            borderRadius: '0 0 8px 8px',
          }}>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                setShowCustomForm(true)
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#8B4513',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 0',
              }}
            >
              <Plus size={14} />
              Can't find it? Suggest a category
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Custom category form */}
      {showCustomForm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px',
        }} onClick={() => setShowCustomForm(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '700', 
              color: '#3d2b1f',
              margin: '0 0 4px 0',
            }}>
              Suggest a Category
            </h3>
            <p style={{ 
              fontSize: '13px', 
              color: '#8B6F47',
              margin: '0 0 16px 0',
            }}>
              If you can't find the right category, suggest a new one and we'll review it.
            </p>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#5c3a1e',
                marginBottom: '4px',
              }}>
                Category Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                value={customCategoryName}
                onChange={(e) => setCustomCategoryName(e.target.value)}
                placeholder="e.g., Industrial Sandblasting"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #d6c4a8',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#8B4513'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d6c4a8'}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#5c3a1e',
                marginBottom: '4px',
              }}>
                Parent Category (optional)
              </label>
              <select
                value={customCategoryParent}
                onChange={(e) => setCustomCategoryParent(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #d6c4a8',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  outline: 'none',
                }}
              >
                <option value="">Select a parent category...</option>
                {(() => {
                  const { taxonomyData } = require('./applicationOptions')
                  return taxonomyData.map(domain => (
                    <optgroup key={domain.id} label={domain.name}>
                      {domain.children.map(child => (
                        <option key={child.id} value={child.id}>
                          {child.name}
                        </option>
                      ))}
                    </optgroup>
                  ))
                })()}
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowCustomForm(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#f5f0e8',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#5c3a1e',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitCustom}
                disabled={!customCategoryName.trim()}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#8B4513',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'white',
                  cursor: customCategoryName.trim() ? 'pointer' : 'not-allowed',
                  opacity: customCategoryName.trim() ? 1 : 0.5,
                }}
              >
                Submit Suggestion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}