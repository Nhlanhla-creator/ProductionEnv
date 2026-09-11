// src/components/MultiSelect.js
"use client"

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function MultiSelect({ options, selected = [], onChange, label, placeholder, required = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef(null)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })

  const toggleDropdown = () => setIsOpen(!isOpen)
  const closeDropdown = () => setIsOpen(false)

  const handleSelect = (value) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value]
    onChange(newSelected)
  }

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }, [isOpen])

  useEffect(() => {
    const updateCoords = () => {
      if (isOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        setCoords({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
        })
      }
    }
    window.addEventListener('resize', updateCoords)
    window.addEventListener('scroll', updateCoords, true)
    return () => {
      window.removeEventListener('resize', updateCoords)
      window.removeEventListener('scroll', updateCoords, true)
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && triggerRef.current && !triggerRef.current.contains(event.target)) {
        if (event.target.closest('[data-multiselect-portal="true"]')) {
          return
        }
        closeDropdown()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const getLabel = (value) => {
    const option = options.find(o => o.value === value)
    return option ? option.label : value
  }

  return (
    <div ref={triggerRef} style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={toggleDropdown}
        style={{
          border: '1px solid #d6c4a8',
          borderRadius: '6px',
          padding: '10px 14px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '44px',
          backgroundColor: 'white',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#8B4513'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#d6c4a8'}
      >
        {selected && selected.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flex: 1 }}>
            {selected.slice(0, 4).map((value) => (
              <span
                key={value}
                style={{ 
                  backgroundColor: '#f0e8d8', 
                  padding: '4px 12px', 
                  borderRadius: '14px', 
                  fontSize: '13px',
                  color: '#5c3a1e',
                  fontWeight: '500',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {getLabel(value)}
              </span>
            ))}
            {selected.length > 4 && (
              <span style={{
                padding: '4px 12px',
                borderRadius: '14px',
                fontSize: '12px',
                color: '#8B6F47',
                fontWeight: '500',
              }}>
                +{selected.length - 4} more
              </span>
            )}
          </div>
        ) : (
          <span style={{ color: '#999', fontSize: '14px' }}>{placeholder || `Select ${label}`}</span>
        )}
        {isOpen ? <ChevronUp size={20} color="#5c3a1e" /> : <ChevronDown size={20} color="#5c3a1e" />}
      </div>

      {isOpen && createPortal(
        <div 
          data-multiselect-portal="true"
          style={{
            position: 'absolute', 
            top: `${coords.top + 4}px`, 
            left: `${coords.left}px`, 
            width: `${coords.width}px`,
            backgroundColor: 'white', 
            border: '1px solid #d6c4a8', 
            borderRadius: '6px',
            zIndex: 99999, 
            maxHeight: '280px',  
            overflow: 'auto',    
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            minWidth: '250px'
          }}
        >
          <div style={{ padding: '4px' }}>
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                style={{
                  padding: '10px 14px', 
                  cursor: 'pointer',
                  backgroundColor: selected.includes(option.value) ? '#fdf6ed' : 'white',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  borderBottom: '1px solid #f5f0e8',
                  fontSize: '14px',
                  borderRadius: '4px',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={(e) => {
                  if (!selected.includes(option.value)) {
                    e.currentTarget.style.backgroundColor = '#faf5ef'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selected.includes(option.value)) {
                    e.currentTarget.style.backgroundColor = 'white'
                  }
                }}
              >
                <div style={{
                  width: '20px', 
                  height: '20px', 
                  borderRadius: '4px',
                  border: `2px solid ${selected.includes(option.value) ? '#8B4513' : '#d1d5db'}`,
                  backgroundColor: selected.includes(option.value) ? '#8B4513' : 'white',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {selected.includes(option.value) && (
                    <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>✓</span>
                  )}
                </div>
                <span style={{ color: '#3d2b1f' }}>{option.label}</span>
              </div>
            ))}
          </div>
          <div style={{ 
            padding: '10px', 
            borderTop: '1px solid #d6c4a8',
            backgroundColor: '#fdfaf5',
            borderRadius: '0 0 6px 6px',
            position: 'sticky',
            bottom: 0
          }}>
            <button 
              type="button" 
              onClick={closeDropdown} 
              style={{
                width: '100%', 
                padding: '10px',
                backgroundColor: '#8B4513',
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5c3a1e'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8B4513'}
            >
              Done
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}