"use client";
import React, { useEffect, useState, useRef } from 'react';
import { Plus, Trash2 } from 'lucide-react'
import FormField from "./form-field"
import FileUpload from "./file-upload"
import './UniversalProfile.css';
import { db, auth, storage } from '../../firebaseConfig';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, addDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { validateCV } from '../../services/documentValidationService';

import {
  uploadDocumentWithSync,
  deleteDocumentWithSync,
  getSyncConfig
} from '../../utils/documentSyncService';
import { getFunctions, httpsCallable } from "firebase/functions";

const raceOptions = [
  { value: "black", label: "Black African" },
  { value: "coloured", label: "Coloured" },
  { value: "indian", label: "Indian/Asian" },
  { value: "white", label: "White" },
  { value: "other", label: "Other" },
];

const directorRoleOptions = [
  "Chairman", "Vice-President", "Board of Directors", "Chief Executive Officer",
  "Chief Financial Officer", "Chief Operating Officer", "Managing Director",
  "Executive Director", "Non-Executive Director", "Independent Director",
  "General Manager", "Regional Manager", "Supervisor", "Office Manager",
  "Team Leader", "Other",
];

const executivePositions = [
  "Chief Executive Officer", "Chief Financial Officer", "Chief Operating Officer",
  "Chief Technology Officer", "Chief Marketing Officer", "Chief Human Resources Officer",
  "Chief Information Officer", "Chief Strategy Officer", "Managing Director",
  "General Manager", "Operations Manager", "Financial Manager", "HR Manager",
  "Marketing Manager", "IT Manager", "Sales Manager", "Other",
];

const genderOptions = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
  { value: "Prefer not to say", label: "Prefer not to say" },
];

const execOptions = [
  { value: "Executive", label: "Executive" },
  { value: "Non-Executive", label: "Non-Executive" },
];

const africanCountries = [
  { value: "Algeria", label: "Algeria" }, { value: "Angola", label: "Angola" },
  { value: "Benin", label: "Benin" }, { value: "Botswana", label: "Botswana" },
  { value: "Burkina Faso", label: "Burkina Faso" }, { value: "Burundi", label: "Burundi" },
  { value: "Cabo Verde", label: "Cabo Verde" }, { value: "Cameroon", label: "Cameroon" },
  { value: "Central African Republic", label: "Central African Republic" }, { value: "Chad", label: "Chad" },
  { value: "Comoros", label: "Comoros" }, { value: "Congo", label: "Congo" },
  { value: "Côte d'Ivoire", label: "Côte d'Ivoire" }, { value: "Djibouti", label: "Djibouti" },
  { value: "DR Congo", label: "DR Congo" }, { value: "Egypt", label: "Egypt" },
  { value: "Equatorial Guinea", label: "Equatorial Guinea" }, { value: "Eritrea", label: "Eritrea" },
  { value: "Eswatini", label: "Eswatini" }, { value: "Ethiopia", label: "Ethiopia" },
  { value: "Gabon", label: "Gabon" }, { value: "Gambia", label: "Gambia" },
  { value: "Ghana", label: "Ghana" }, { value: "Guinea", label: "Guinea" },
  { value: "Guinea-Bissau", label: "Guinea-Bissau" }, { value: "Kenya", label: "Kenya" },
  { value: "Lesotho", label: "Lesotho" }, { value: "Liberia", label: "Liberia" },
  { value: "Libya", label: "Libya" }, { value: "Madagascar", label: "Madagascar" },
  { value: "Malawi", label: "Malawi" }, { value: "Mali", label: "Mali" },
  { value: "Mauritania", label: "Mauritania" }, { value: "Mauritius", label: "Mauritius" },
  { value: "Morocco", label: "Morocco" }, { value: "Mozambique", label: "Mozambique" },
  { value: "Namibia", label: "Namibia" }, { value: "Niger", label: "Niger" },
  { value: "Nigeria", label: "Nigeria" }, { value: "Rwanda", label: "Rwanda" },
  { value: "São Tomé and Príncipe", label: "São Tomé and Príncipe" }, { value: "Senegal", label: "Senegal" },
  { value: "Seychelles", label: "Seychelles" }, { value: "Sierra Leone", label: "Sierra Leone" },
  { value: "Somalia", label: "Somalia" }, { value: "South Africa", label: "South Africa" },
  { value: "South Sudan", label: "South Sudan" }, { value: "Sudan", label: "Sudan" },
  { value: "Tanzania", label: "Tanzania" }, { value: "Togo", label: "Togo" },
  { value: "Tunisia", label: "Tunisia" }, { value: "Uganda", label: "Uganda" },
  { value: "Zambia", label: "Zambia" }, { value: "Zimbabwe", label: "Zimbabwe" },
];

const committeeMembershipOptions = [
  { value: "Audit Committee", label: "Audit Committee" },
  { value: "Risk Committee", label: "Risk Committee" },
  { value: "Audit & Risk Committee", label: "Audit & Risk Committee" },
  { value: "Remuneration Committee", label: "Remuneration Committee" },
  { value: "Nomination Committee", label: "Nomination Committee" },
  { value: "Remuneration & Nomination Committee", label: "Remuneration & Nomination Committee" },
  { value: "Social & Ethics Committee", label: "Social & Ethics Committee (SA-critical)" },
  { value: "Investment Committee", label: "Investment Committee" },
  { value: "Strategy Committee", label: "Strategy Committee" },
  { value: "Technology / IT Committee", label: "Technology / IT Committee" },
  { value: "ESG / Sustainability Committee", label: "ESG / Sustainability Committee" },
  { value: "Other", label: "Other (specify)" },
];

const qualificationRoleMap = {
  "BCom Accounting": ["Accountant", "Financial Manager", "CFO", "Finance Director", "Auditor"],
  "CA(SA)": ["CFO", "Financial Director", "Audit Partner", "Finance Manager", "Accountant"],
  "MBA": ["CEO", "Managing Director", "General Manager", "Strategy Manager", "Business Development"],
  "BSc Engineering": ["Engineer", "Project Manager", "Technical Director", "Operations Manager"],
  "LLB": ["Legal Advisor", "Company Secretary", "Compliance Officer", "Legal Manager"],
  "BCom Marketing": ["Marketing Manager", "Brand Manager", "Sales Manager", "Marketing Director"],
  "BSc Computer Science": ["IT Manager", "CTO", "Software Developer", "Systems Analyst"],
  "Human Resources": ["HR Manager", "HR Director", "Talent Manager", "Recruitment Manager"],
  "Supply Chain Management": ["Logistics Manager", "Supply Chain Manager", "Procurement Manager", "Operations Manager"],
  "Project Management": ["Project Manager", "Program Manager", "PMO Manager", "Operations Manager"],
  "Other": []
};

const qualificationOptions = Object.keys(qualificationRoleMap);

const leadershipOptions = {
  ownerLed: [
    { value: "founder_led",               label: "Founder-led" },
    { value: "founder_plus_management",   label: "Founder + management team" },
    { value: "professionally_managed",    label: "Professionally managed (owner not active)" },
  ],
  primaryMotivation: [
    { value: "secure_income",             label: "Secure income for myself and my family" },
    { value: "stable_long_term",          label: "Build a stable long-term company" },
    { value: "scale_nationally",          label: "Build a business that can scale nationally/internationally" },
    { value: "build_to_sell",             label: "Build a valuable company to sell in future" },
    { value: "procurement_contracts",     label: "Access procurement or contract opportunities" },
  ],
  growthAmbition: [
    { value: "maintain_current",          label: "Maintain current scale" },
    { value: "moderate_growth",           label: "Moderate growth" },
    { value: "significant_expansion",     label: "Significant expansion" },
    { value: "build_to_sell_investors",   label: "Build to sell or attract investors" },
  ],
  founderFullTime: [
    { value: "yes_full_time",             label: "Yes, full-time" },
    { value: "yes_multiple_businesses",   label: "Yes, but also runs other businesses" },
    { value: "no_not_daily",              label: "No, founder is not involved in daily operations" },
  ],
  opennessToAdvice: [
    { value: "very_open",                 label: "Very open – actively seek expert advice" },
    { value: "open_evaluate",             label: "Open but evaluate carefully" },
    { value: "sometimes_open",            label: "Sometimes open" },
    { value: "prefer_own",                label: "Prefer own approach" },
  ],
  decisionGovernance: [
    { value: "founder_all",               label: "Founder makes all decisions" },
    { value: "founder_with_team",         label: "Founder with management team" },
    { value: "management_founder_oversight", label: "Management team with founder oversight" },
    { value: "board_led",                 label: "Board-led governance" },
  ],
};

const DEFAULT_SHAREHOLDER = {
  name: "", country: "", shareholding: "", issuedShares: "", race: "",
  gender: "", isYouth: false, isDisabled: false, isAlsoDirector: false, directorId: null,
  idDocument: null, linkedin: "", doa: "", activeInterestsCount: 0, previousInterestsCount: 0,
};

const DEFAULT_INTEREST = {
  companyName: "", registrationNo: "", businessStatus: "", assignedTo: ""
};

const DEFAULT_DIRECTOR = {
  name: "", roles: [], customRole: "", nationality: "", linkedin: "",
  execType: "", race: "", gender: "", isYouth: false, isDisabled: false,
  linkedShareholderId: null, cv: null, committeeMembership: [], customCommittee: "",
  doa: "", activeInterestsCount: 0, previousInterestsCount: 0,
};

const DEFAULT_EXECUTIVE = {
  name: "", position: "", customPosition: "", department: "", nationality: "",
  linkedin: "", race: "", gender: "", isYouth: false, isDisabled: false, cv: null,
  doa: "", activeInterestsCount: 0, previousInterestsCount: 0,
};

const DEFAULT_EMPLOYEE = {
  name: "", qualification: "", role: "", customRole: "", isCertificationCompulsory: "no",
};

const DEFAULT_BUSINESS_LEADERSHIP = {
  ownerLed: "",
  primaryMotivation: "",
  growthAmbition: "",
  founderFullTime: "",
  opennessToAdvice: "",
  decisionGovernance: "",
};

// Role Multi-Select with fixed positioning
const RoleMultiSelect = ({ selected = [], onChange, onCustomChange, customValue = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const safeSelected = Array.isArray(selected) ? selected : [];
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value) => {
    const newSelected = safeSelected.includes(value)
      ? safeSelected.filter((item) => item !== value)
      : [...safeSelected, value];
    onChange(newSelected);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', zIndex: isOpen ? 100 : 1 }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          border: '1px solid #d6c4a8',
          borderRadius: '4px',
          padding: '4px 8px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '32px',
          backgroundColor: 'white',
          fontSize: '12px',
        }}
      >
        {safeSelected.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', flex: 1, overflow: 'hidden' }}>
            {safeSelected.slice(0, 3).map((val) => (
              <span key={val} style={{ backgroundColor: '#f0e8d8', padding: '1px 6px', borderRadius: '10px', fontSize: '10px', whiteSpace: 'nowrap' }}>
                {val === "Other" ? (customValue || "Other") : val}
              </span>
            ))}
            {safeSelected.length > 3 && <span style={{ fontSize: '10px', color: '#8B4513' }}>+{safeSelected.length - 3} more</span>}
          </div>
        ) : (
          <span style={{ color: '#999', fontSize: '12px' }}>Select roles</span>
        )}
        <span style={{ fontSize: '10px', marginLeft: '4px' }}>{isOpen ? '▲' : '▼'}</span>
      </div>
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: dropdownRef.current?.getBoundingClientRect().bottom + 4 || 'auto',
          left: dropdownRef.current?.getBoundingClientRect().left || 'auto',
          width: dropdownRef.current?.offsetWidth || 250,
          backgroundColor: 'white',
          border: '1px solid #d6c4a8',
          borderRadius: '4px',
          zIndex: 9999,
          maxHeight: '250px',
          overflow: 'auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}>
          <div style={{ padding: '4px' }}>
            {directorRoleOptions.map((role) => (
              <div
                key={role}
                onClick={() => toggleOption(role)}
                style={{
                  padding: '6px 8px', cursor: 'pointer', fontSize: '12px',
                  backgroundColor: safeSelected.includes(role) ? '#fdf6ed' : 'white',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  borderBottom: '1px solid #f5f0e8',
                }}
              >
                <input type="checkbox" checked={safeSelected.includes(role)} onChange={() => {}} style={{ cursor: 'pointer' }} />
                <span>{role}</span>
              </div>
            ))}
          </div>
          {safeSelected.includes("Other") && (
            <div style={{ padding: '6px 8px', borderTop: '1px solid #d6c4a8' }}>
              <input
                type="text"
                placeholder="Specify role"
                value={customValue}
                onChange={(e) => onCustomChange(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', border: '1px solid #d6c4a8', borderRadius: '4px', fontSize: '12px' }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Committee Multi-Select with fixed positioning
const CommitteeMultiSelect = ({ selected = [], onChange, onCustomChange, customValue = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const safeSelected = Array.isArray(selected) ? selected : [];
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value) => {
    const newSelected = safeSelected.includes(value)
      ? safeSelected.filter((item) => item !== value)
      : [...safeSelected, value];
    onChange(newSelected);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', zIndex: isOpen ? 100 : 1 }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          border: '1px solid #d6c4a8',
          borderRadius: '4px',
          padding: '4px 8px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '32px',
          backgroundColor: 'white',
          fontSize: '12px',
        }}
      >
        {safeSelected.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', flex: 1, overflow: 'hidden' }}>
            {safeSelected.slice(0, 3).map((val) => (
              <span key={val} style={{ backgroundColor: '#f0e8d8', padding: '1px 6px', borderRadius: '10px', fontSize: '10px', whiteSpace: 'nowrap' }}>
                {val === "Other" ? (customValue || "Other") : committeeMembershipOptions.find(o => o.value === val)?.label || val}
              </span>
            ))}
            {safeSelected.length > 3 && <span style={{ fontSize: '10px', color: '#8B4513' }}>+{safeSelected.length - 3} more</span>}
          </div>
        ) : (
          <span style={{ color: '#999', fontSize: '12px' }}>Select committees</span>
        )}
        <span style={{ fontSize: '10px', marginLeft: '4px' }}>{isOpen ? '▲' : '▼'}</span>
      </div>
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: dropdownRef.current?.getBoundingClientRect().bottom + 4 || 'auto',
          left: dropdownRef.current?.getBoundingClientRect().left || 'auto',
          width: dropdownRef.current?.offsetWidth || 250,
          backgroundColor: 'white',
          border: '1px solid #d6c4a8',
          borderRadius: '4px',
          zIndex: 9999,
          maxHeight: '300px',
          overflow: 'auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}>
          <div style={{ padding: '4px' }}>
            {committeeMembershipOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => toggleOption(option.value)}
                style={{
                  padding: '6px 8px', cursor: 'pointer', fontSize: '12px',
                  backgroundColor: safeSelected.includes(option.value) ? '#fdf6ed' : 'white',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  borderBottom: '1px solid #f5f0e8',
                }}
              >
                <input type="checkbox" checked={safeSelected.includes(option.value)} onChange={() => {}} style={{ cursor: 'pointer' }} />
                <span>{option.label}</span>
              </div>
            ))}
          </div>
          {safeSelected.includes("Other") && (
            <div style={{ padding: '6px 8px', borderTop: '1px solid #d6c4a8' }}>
              <input
                type="text"
                placeholder="Specify committee"
                value={customValue}
                onChange={(e) => onCustomChange(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', border: '1px solid #d6c4a8', borderRadius: '4px', fontSize: '12px' }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Interests Management Component (dropdown for person assignment)
const InterestsManager = ({ title, people, interests = [], onChange }) => {
  const personNames = people.map(p => p.name).filter(Boolean);

  const addInterest = () => {
    onChange([...interests, { ...DEFAULT_INTEREST }]);
  };

  const updateInterest = (index, field, value) => {
    const newInterests = [...interests];
    newInterests[index] = { ...newInterests[index], [field]: value };
    onChange(newInterests);
  };

  const removeInterest = (index) => {
    onChange(interests.filter((_, i) => i !== index));
  };

  return (
    <div style={{ padding: '16px', backgroundColor: '#fdfaf5', borderRadius: '8px', border: '1px solid #d6c4a8' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h5 style={{ color: '#8B4513', fontSize: '14px', fontWeight: '700', margin: 0 }}>{title}</h5>
        <button type="button" onClick={addInterest} style={{ display: 'flex', alignItems: 'center', padding: '6px 14px', backgroundColor: '#8B4513', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>
          <Plus className="w-3 h-3 mr-1" /> Add Interest
        </button>
      </div>
      {interests.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', backgroundColor: 'white' }}>
            <thead>
              <tr style={{ backgroundColor: '#5c3a1e' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', color: '#ffffff', fontWeight: '600', fontSize: '11px', borderBottom: '2px solid #3d2b1f' }}>Assigned Person</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', color: '#ffffff', fontWeight: '600', fontSize: '11px', borderBottom: '2px solid #3d2b1f' }}>Company Name</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', color: '#ffffff', fontWeight: '600', fontSize: '11px', borderBottom: '2px solid #3d2b1f' }}>Registration No.</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', color: '#ffffff', fontWeight: '600', fontSize: '11px', borderBottom: '2px solid #3d2b1f' }}>Business Status</th>
                <th style={{ padding: '8px 10px', width: '40px', borderBottom: '2px solid #3d2b1f' }}></th>
              </tr>
            </thead>
            <tbody>
              {interests.map((interest, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e0d5c0' }}>
                  <td style={{ padding: '6px 10px' }}>
                    <select
                      value={interest.assignedTo || ""}
                      onChange={(e) => updateInterest(idx, "assignedTo", e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #d6c4a8', borderRadius: '3px', fontSize: '12px' }}
                    >
                      <option value="">Unassigned</option>
                      {personNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '6px 10px' }}>
                    <input type="text" value={interest.companyName || ""} onChange={(e) => updateInterest(idx, "companyName", e.target.value)} style={{ width: '100%', padding: '6px 8px', border: '1px solid #d6c4a8', borderRadius: '3px', fontSize: '12px' }} placeholder="Company name" />
                  </td>
                  <td style={{ padding: '6px 10px' }}>
                    <input type="text" value={interest.registrationNo || ""} onChange={(e) => updateInterest(idx, "registrationNo", e.target.value)} style={{ width: '100%', padding: '6px 8px', border: '1px solid #d6c4a8', borderRadius: '3px', fontSize: '12px' }} placeholder="Reg No." />
                  </td>
                  <td style={{ padding: '6px 10px' }}>
                    <select value={interest.businessStatus || ""} onChange={(e) => updateInterest(idx, "businessStatus", e.target.value)} style={{ width: '100%', padding: '6px 8px', border: '1px solid #d6c4a8', borderRadius: '3px', fontSize: '12px' }}>
                      <option value="">Select</option>
                      <option value="Active">Active</option>
                      <option value="Dormant">Dormant</option>
                      <option value="Closed">Closed</option>
                      <option value="In Liquidation">In Liquidation</option>
                    </select>
                  </td>
                  <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                    <button type="button" onClick={() => removeInterest(idx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 className="w-3 h-3" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {interests.length === 0 && (
        <p style={{ color: '#999', fontSize: '12px', textAlign: 'center', padding: '16px' }}>No interests added yet. Click "Add Interest" to begin.</p>
      )}
    </div>
  );
};

export default function OwnershipManagement({ data = { shareholders: [], directors: [], executives: [] }, updateData }) {
  const [formData, setFormData] = useState({
    shareholders: [],
    directors: [],
    executives: [],
    employees: [],
    businessLeadership: DEFAULT_BUSINESS_LEADERSHIP,
    totalEmployees: "",
    activeInterests: [],
    previousInterests: [],
  });
  const [uploadingCVs, setUploadingCVs] = useState({ director: {}, executive: {} });
  const [isUploadOverlayVisible, setIsUploadOverlayVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const functions = getFunctions();

  const updateFormData = (newData) => {
    setFormData(newData);
    updateData(newData);
    syncToGrowthSuite(newData.directors || []);
  };

  const syncToGrowthSuite = async (directors) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      const boardMembers = directors.map(director => ({
        name: director.name,
        roles: director.roles || [],
        nationality: director.nationality,
        execType: director.execType,
        race: director.race,
        gender: director.gender,
        isYouth: director.isYouth,
        isDisabled: director.isDisabled,
        committeeMembership: director.committeeMembership || [],
        doa: director.doa || "",
      }));
      const growthSuiteRef = doc(db, "growthSuite", userId);
      await setDoc(growthSuiteRef, { boardOfDirectors: boardMembers, lastUpdated: new Date().toISOString() }, { merge: true });
    } catch (error) {
      console.error("Error syncing to Growth Suite:", error);
    }
  };

  // Load data
  useEffect(() => {
    const loadOwnershipManagement = async () => {
      try {
        setIsLoading(true);
        const userId = auth.currentUser?.uid;
        if (!userId) { setIsLoading(false); return; }
        const docRef = doc(db, "universalProfiles", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const profileData = docSnap.data();
          if (profileData.ownershipManagement) {
            updateFormData({
              ...profileData.ownershipManagement,
              businessLeadership: profileData.ownershipManagement.businessLeadership || DEFAULT_BUSINESS_LEADERSHIP,
              employees: profileData.ownershipManagement.employees || [],
              totalEmployees: profileData.ownershipManagement.totalEmployees || "",
              activeInterests: profileData.ownershipManagement.activeInterests || [],
              previousInterests: profileData.ownershipManagement.previousInterests || [],
            });
          } else {
            const initData = {
              ...data,
              businessLeadership: data.businessLeadership || DEFAULT_BUSINESS_LEADERSHIP,
              employees: data.employees || [],
              totalEmployees: data.totalEmployees || "",
              activeInterests: data.activeInterests || [],
              previousInterests: data.previousInterests || [],
            };
            if (!initData.shareholders?.length) initData.shareholders = [DEFAULT_SHAREHOLDER];
            if (!initData.directors?.length) initData.directors = [DEFAULT_DIRECTOR];
            if (!initData.executives?.length) initData.executives = [DEFAULT_EXECUTIVE];
            updateFormData(initData);
          }
        } else {
          const initData = {
            shareholders: [DEFAULT_SHAREHOLDER],
            directors: [DEFAULT_DIRECTOR],
            executives: [DEFAULT_EXECUTIVE],
            employees: [],
            businessLeadership: DEFAULT_BUSINESS_LEADERSHIP,
            totalEmployees: "",
            activeInterests: [],
            previousInterests: [],
          };
          updateFormData(initData);
        }
      } catch (error) {
        console.error("Error loading ownership management:", error);
        const fallbackData = {
          shareholders: [DEFAULT_SHAREHOLDER],
          directors: [DEFAULT_DIRECTOR],
          executives: [DEFAULT_EXECUTIVE],
          employees: [],
          businessLeadership: DEFAULT_BUSINESS_LEADERSHIP,
          totalEmployees: "",
          activeInterests: [],
          previousInterests: [],
        };
        updateFormData(fallbackData);
      } finally {
        setIsLoading(false);
      }
    };
    loadOwnershipManagement();
  }, []);

  // CV upload handlers (kept for brevity - same as before)
  const handleDeleteCV = async (type, index) => {
    try {
      const item = type === 'director' ? formData.directors[index] : formData.executives[index];
      if (!item?.cv?.path) return;
      setIsUploadOverlayVisible(true);
      await deleteDocumentWithSync(
        storage,
        item.cv.path,
        auth.currentUser?.uid,
        type,
        item.name,
        type === 'director' ? 'Board Member' : 'Executive'
      );
      if (type === 'director') {
        const newDirectors = [...formData.directors];
        newDirectors[index].cv = null;
        updateFormData({ ...formData, directors: newDirectors });
      } else {
        const newExecutives = [...formData.executives];
        newExecutives[index].cv = null;
        updateFormData({ ...formData, executives: newExecutives });
      }
    } catch (error) {
      console.error("Error deleting CV:", error);
    } finally {
      setIsUploadOverlayVisible(false);
    }
  };

  const handleDirectorCVUpload = async (index, file) => {
    try {
      setIsUploadOverlayVisible(true);
      const director = formData.directors[index];
      const userId = auth.currentUser?.uid;
      const storagePath = `cv_documents/${userId}/directors/${director.name}_${Date.now()}_${file.name}`;
      const uploaded = await uploadDocumentWithSync(
        storage,
        file,
        userId,
        'director',
        director.name,
        'Board Member',
        storagePath
      );
      const newDirectors = [...formData.directors];
      newDirectors[index].cv = { name: file.name, url: uploaded.url, path: storagePath };
      updateFormData({ ...formData, directors: newDirectors });
    } catch (error) {
      console.error("Director CV upload failed:", error);
    } finally {
      setIsUploadOverlayVisible(false);
    }
  };

  const handleExecutiveCVUpload = async (index, file) => {
    try {
      setIsUploadOverlayVisible(true);
      const executive = formData.executives[index];
      const userId = auth.currentUser?.uid;
      const storagePath = `cv_documents/${userId}/executives/${executive.name}_${Date.now()}_${file.name}`;
      const uploaded = await uploadDocumentWithSync(
        storage,
        file,
        userId,
        'executive',
        executive.name,
        'Executive',
        storagePath
      );
      const newExecutives = [...formData.executives];
      newExecutives[index].cv = { name: file.name, url: uploaded.url, path: storagePath };
      updateFormData({ ...formData, executives: newExecutives });
    } catch (error) {
      console.error("Executive CV upload failed:", error);
    } finally {
      setIsUploadOverlayVisible(false);
    }
  };

  const addShareholder = () => updateFormData({ ...formData, shareholders: [...formData.shareholders, DEFAULT_SHAREHOLDER] });

  const updateShareholder = (index, field, value) => {
    const newShareholders = [...formData.shareholders];
    const shareholder = newShareholders[index];
    if (field === "isAlsoDirector") {
      if (value === true) {
        const newDirector = { ...DEFAULT_DIRECTOR, name: shareholder.name, nationality: shareholder.country, linkedin: shareholder.linkedin, race: shareholder.race, gender: shareholder.gender, isYouth: shareholder.isYouth, isDisabled: shareholder.isDisabled, linkedShareholderId: index };
        const newDirectors = [...formData.directors, newDirector];
        newShareholders[index] = { ...shareholder, isAlsoDirector: true, directorId: newDirectors.length - 1 };
        updateFormData({ ...formData, shareholders: newShareholders, directors: newDirectors });
        return;
      } else {
        if (shareholder.directorId !== null) {
          const newDirectors = formData.directors.filter((_, i) => i !== shareholder.directorId);
          newShareholders[index] = { ...shareholder, isAlsoDirector: false, directorId: null };
          updateFormData({ ...formData, shareholders: newShareholders, directors: newDirectors });
          return;
        }
      }
    }
    newShareholders[index] = { ...shareholder, [field]: value };
    if (shareholder.isAlsoDirector && shareholder.directorId !== null) {
      const newDirectors = [...formData.directors];
      const di = shareholder.directorId;
      if (di < newDirectors.length) {
        if (field === "name") newDirectors[di].name = value;
        if (field === "country") newDirectors[di].nationality = value;
        if (field === "linkedin") newDirectors[di].linkedin = value;
        if (field === "race") newDirectors[di].race = value;
        if (field === "gender") newDirectors[di].gender = value;
        if (field === "isYouth") newDirectors[di].isYouth = value;
        if (field === "isDisabled") newDirectors[di].isDisabled = value;
        updateFormData({ ...formData, shareholders: newShareholders, directors: newDirectors });
        return;
      }
    }
    updateFormData({ ...formData, shareholders: newShareholders });
  };

  const removeShareholder = (index) => {
    const shareholder = formData.shareholders[index];
    let newDirectors = [...formData.directors];
    if (shareholder.isAlsoDirector && shareholder.directorId !== null) newDirectors = newDirectors.filter((_, i) => i !== shareholder.directorId);
    updateFormData({ ...formData, shareholders: formData.shareholders.filter((_, i) => i !== index), directors: newDirectors });
  };

  const addDirector = () => updateFormData({ ...formData, directors: [...formData.directors, DEFAULT_DIRECTOR] });

  const updateDirector = (index, field, value) => {
    const newDirectors = [...formData.directors];
    newDirectors[index] = { ...newDirectors[index], [field]: value };
    if (field === "roles" && !value.includes("Other")) newDirectors[index].customRole = "";
    const linkedShareholderId = newDirectors[index].linkedShareholderId;
    if (linkedShareholderId !== null) {
      const newShareholders = [...formData.shareholders];
      if (linkedShareholderId < newShareholders.length) {
        if (field === "name") newShareholders[linkedShareholderId].name = value;
        if (field === "nationality") newShareholders[linkedShareholderId].country = value;
        if (field === "linkedin") newShareholders[linkedShareholderId].linkedin = value;
        if (field === "race") newShareholders[linkedShareholderId].race = value;
        if (field === "gender") newShareholders[linkedShareholderId].gender = value;
        if (field === "isYouth") newShareholders[linkedShareholderId].isYouth = value;
        if (field === "isDisabled") newShareholders[linkedShareholderId].isDisabled = value;
        updateFormData({ ...formData, directors: newDirectors, shareholders: newShareholders });
        return;
      }
    }
    updateFormData({ ...formData, directors: newDirectors });
  };

  const removeDirector = (index) => {
    const director = formData.directors[index];
    if (director.linkedShareholderId !== null) {
      alert("To remove this director, uncheck 'Also Director' in the shareholder table.");
      return;
    }
    if (director.cv) handleDeleteCV('director', index);
    const newDirectors = formData.directors.filter((_, i) => i !== index);
    updateFormData({ ...formData, directors: newDirectors });
  };

  const addExecutive = () => updateFormData({ ...formData, executives: [...(formData.executives || []), DEFAULT_EXECUTIVE] });

  const updateExecutive = (index, field, value) => {
    const newExecutives = [...(formData.executives || [])];
    newExecutives[index] = { ...newExecutives[index], [field]: value };
    if (field === "position" && value !== "Other") newExecutives[index].customPosition = "";
    updateFormData({ ...formData, executives: newExecutives });
  };

  const removeExecutive = (index) => {
    const executive = formData.executives[index];
    if (executive.cv) handleDeleteCV('executive', index);
    updateFormData({ ...formData, executives: (formData.executives || []).filter((_, i) => i !== index) });
  };

  const addEmployee = () => updateFormData({ ...formData, employees: [...(formData.employees || []), DEFAULT_EMPLOYEE] });

  const updateEmployee = (index, field, value) => {
    const newEmployees = [...(formData.employees || [])];
    newEmployees[index] = { ...newEmployees[index], [field]: value };
    if (field === "qualification") {
      newEmployees[index].role = "";
      newEmployees[index].customRole = "";
    }
    if (field === "isCertificationCompulsory" && value === "no") {
      newEmployees[index].qualification = "";
    }
    updateFormData({ ...formData, employees: newEmployees });
  };

  const removeEmployee = (index) => {
    updateFormData({ ...formData, employees: (formData.employees || []).filter((_, i) => i !== index) });
  };

  const getRolesForQualification = (qualification) => {
    return qualificationRoleMap[qualification] || [];
  };

  const updateBusinessLeadership = (field, value) => {
    const updated = { ...formData, businessLeadership: { ...(formData.businessLeadership || DEFAULT_BUSINESS_LEADERSHIP), [field]: value } };
    updateFormData(updated);
  };

  const bl = formData.businessLeadership || DEFAULT_BUSINESS_LEADERSHIP;

  const leadershipQuestions = [
    { field: "ownerLed", question: "Q1 – Is the business owner-led?", options: leadershipOptions.ownerLed },
    { field: "primaryMotivation", question: "Q2 – What best describes the primary motivation for building this business?", options: leadershipOptions.primaryMotivation },
    { field: "growthAmbition", question: "Q3 – Growth ambition (next 5 years)", options: leadershipOptions.growthAmbition },
    { field: "founderFullTime", question: "Q4 – Is the founder working in the business full-time?", options: leadershipOptions.founderFullTime },
    { field: "opennessToAdvice", question: "Q5 – Openness to advice", options: leadershipOptions.opennessToAdvice },
    { field: "decisionGovernance", question: "Q6 – Decision governance", options: leadershipOptions.decisionGovernance },
  ];

  // Collect all people for interests assignment
  const allPeople = [
    ...(formData.shareholders || []).map(s => ({ name: s.name, type: 'Shareholder' })),
    ...(formData.directors || []).map(d => ({ name: d.name, type: 'Director' })),
    ...(formData.executives || []).map(e => ({ name: e.name, type: 'Executive' })),
  ].filter(p => p.name);

  // Styles
  const thStyle = {
    padding: '10px 12px',
    textAlign: 'left',
    color: '#ffffff',
    fontWeight: '600',
    fontSize: '11px',
    borderBottom: '2px solid #3d2b1f',
    backgroundColor: '#5c3a1e',
    whiteSpace: 'nowrap'
  };

  if (isLoading) {
    return (
      <div className="ownership-management-loading">
        <h2 className="text-2xl font-bold text-brown-800 mb-6">Ownership & Management</h2>
        <p>Loading your information...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-brown-800 mb-6">Ownership & Management</h2>

      {/* Total Authorised Shares & Total Issued Shares */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Total Authorised Shares" required>
            <input type="number" name="totalAuthorisedShares" value={formData.totalAuthorisedShares || formData.totalShares || ""} onChange={(e) => updateFormData({ ...formData, totalAuthorisedShares: e.target.value })} className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500" required />
          </FormField>
          <FormField label="Total Issued Shares" required>
            <input type="number" name="totalIssuedShares" value={formData.totalIssuedShares || ""} onChange={(e) => updateFormData({ ...formData, totalIssuedShares: e.target.value })} className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500" required />
          </FormField>
        </div>
      </div>

      {/* Shareholder Table */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-brown-700">Shareholder Table</h3>
          <button type="button" onClick={addShareholder} className="flex items-center px-3 py-1 bg-brown-100 text-brown-700 rounded-md hover:bg-brown-200"><Plus className="w-4 h-4 mr-1" /> Add Shareholder</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-brown-200 rounded-lg">
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Country</th>
                <th style={thStyle}>% Shareholding</th>
                <th style={thStyle}>Issued Shares</th>
                <th style={thStyle}>Race</th>
                <th style={thStyle}>Gender</th>
                <th style={thStyle}>DOA</th>
                <th style={thStyle}>LinkedIn</th>
                <th style={thStyle}>Youth?</th>
                <th style={thStyle}>Disabled?</th>
                <th style={thStyle}>Also Director?</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {formData.shareholders?.map((shareholder, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-brown-50/30"}>
                  <td className="px-3 py-2 border-b"><input type="text" value={shareholder.name || ""} onChange={(e) => updateShareholder(index, "name", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brown-500" /></td>
                  <td className="px-3 py-2 border-b"><select value={shareholder.country || ""} onChange={(e) => updateShareholder(index, "country", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brown-500"><option value="">Select</option>{africanCountries.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></td>
                  <td className="px-3 py-2 border-b"><input type="number" value={shareholder.shareholding || ""} onChange={(e) => updateShareholder(index, "shareholding", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brown-500" min="0" max="100" step="0.01" style={{width:'70px'}} /></td>
                  <td className="px-3 py-2 border-b"><input type="number" value={shareholder.issuedShares || ""} onChange={(e) => updateShareholder(index, "issuedShares", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brown-500" min="0" style={{width:'70px'}} /></td>
                  <td className="px-3 py-2 border-b"><select value={shareholder.race || ""} onChange={(e) => updateShareholder(index, "race", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brown-500"><option value="">Select</option>{raceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></td>
                  <td className="px-3 py-2 border-b"><select value={shareholder.gender || ""} onChange={(e) => updateShareholder(index, "gender", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brown-500"><option value="">Select</option>{genderOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></td>
                  <td className="px-3 py-2 border-b"><input type="date" value={shareholder.doa || ""} onChange={(e) => updateShareholder(index, "doa", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brown-500" style={{width:'110px'}} /></td>
                  <td className="px-3 py-2 border-b"><input type="text" value={shareholder.linkedin || ""} onChange={(e) => updateShareholder(index, "linkedin", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brown-500" placeholder="URL" style={{width:'120px'}} /></td>
                  <td className="px-3 py-2 border-b text-center"><input type="checkbox" checked={shareholder.isYouth || false} onChange={(e) => updateShareholder(index, "isYouth", e.target.checked)} className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300 rounded" /></td>
                  <td className="px-3 py-2 border-b text-center"><input type="checkbox" checked={shareholder.isDisabled || false} onChange={(e) => updateShareholder(index, "isDisabled", e.target.checked)} className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300 rounded" /></td>
                  <td className="px-3 py-2 border-b text-center"><div className="flex flex-col items-center"><input type="checkbox" checked={shareholder.isAlsoDirector || false} onChange={(e) => updateShareholder(index, "isAlsoDirector", e.target.checked)} className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300 rounded" />{shareholder.isAlsoDirector && <span className="text-xs text-green-600 mt-1">✓ Linked</span>}</div></td>
                  <td className="px-3 py-2 border-b"><button type="button" onClick={() => removeShareholder(index)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Business Leadership – Profile Assessment (3 per row) ─── */}
      <div className="mb-8">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-brown-700">Business Leadership – Profile Assessment</h3>
          <p className="text-xs text-brown-500 mt-1">Help us understand how the business is led and where it is headed.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {leadershipQuestions.map((item) => (
            <div key={item.field} style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #d6c4a8' }}>
              <label className="block text-sm font-semibold text-brown-700 mb-2" style={{ fontSize: '12px' }}>{item.question}</label>
              <select value={bl[item.field] || ""} onChange={(e) => updateBusinessLeadership(item.field, e.target.value)} className="w-full px-3 py-2 border border-brown-300 rounded-md text-xs text-brown-800 focus:outline-none focus:ring-2 focus:ring-brown-500 bg-white">
                <option value="">— Select —</option>
                {item.options.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Directors Table (LinkedIn & CV moved before Youth?) */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div><h3 className="text-lg font-semibold text-brown-700">Directors Table</h3><p className="text-xs text-brown-500 mt-1">Directors automatically sync to Growth Suite "Board of Directors"</p></div>
          <button type="button" onClick={addDirector} className="flex items-center px-3 py-1 bg-brown-100 text-brown-700 rounded-md hover:bg-brown-200"><Plus className="w-4 h-4 mr-1" /> Add Director</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-brown-200 rounded-lg">
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Roles</th>
                <th style={thStyle}>Nationality</th>
                <th style={thStyle}>DOA</th>
                <th style={thStyle}>Committee Membership</th>
                <th style={thStyle}>Exec/Non-Exec</th>
                <th style={thStyle}>Race</th>
                <th style={thStyle}>Gender</th>
                <th style={thStyle}>LinkedIn & CV</th>
                <th style={thStyle}>Youth?</th>
                <th style={thStyle}>Disabled?</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {formData.directors?.map((director, index) => (
                <tr key={index} className={`${index % 2 === 0 ? "bg-white" : "bg-brown-50/30"} ${director.linkedShareholderId !== null ? "border-l-4 border-l-blue-400" : ""}`}>
                  <td className="px-3 py-2 border-b"><div className="flex items-center space-x-2"><input type="text" value={director.name || ""} onChange={(e) => updateDirector(index, "name", e.target.value)} className="flex-1 px-2 py-1 border border-brown-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brown-500" disabled={director.linkedShareholderId !== null} />{director.linkedShareholderId !== null && <span className="text-xs text-blue-600" title="Linked to shareholder">🔗</span>}</div></td>
                  <td className="px-3 py-2 border-b" style={{minWidth:'170px'}}><RoleMultiSelect selected={director.roles || []} onChange={(val) => updateDirector(index, "roles", val)} onCustomChange={(val) => updateDirector(index, "customRole", val)} customValue={director.customRole || ""} /></td>
                  <td className="px-3 py-2 border-b"><select value={director.nationality || ""} onChange={(e) => updateDirector(index, "nationality", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brown-500" disabled={director.linkedShareholderId !== null}><option value="">Select</option>{africanCountries.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></td>
                  <td className="px-3 py-2 border-b"><input type="date" value={director.doa || ""} onChange={(e) => updateDirector(index, "doa", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brown-500" style={{width:'110px'}} /></td>
                  <td className="px-3 py-2 border-b" style={{minWidth:'170px'}}><CommitteeMultiSelect selected={director.committeeMembership || []} onChange={(val) => updateDirector(index, "committeeMembership", val)} onCustomChange={(val) => updateDirector(index, "customCommittee", val)} customValue={director.customCommittee || ""} /></td>
                  <td className="px-3 py-2 border-b"><select value={director.execType || ""} onChange={(e) => updateDirector(index, "execType", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brown-500"><option value="">Select</option>{execOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></td>
                  <td className="px-3 py-2 border-b"><select value={director.race || ""} onChange={(e) => updateDirector(index, "race", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brown-500" disabled={director.linkedShareholderId !== null}><option value="">Select</option>{raceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></td>
                  <td className="px-3 py-2 border-b"><select value={director.gender || ""} onChange={(e) => updateDirector(index, "gender", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brown-500" disabled={director.linkedShareholderId !== null}><option value="">Select</option>{genderOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></td>
                  <td className="px-3 py-2 border-b"><div className="space-y-2"><input type="text" placeholder="LinkedIn URL" value={director.linkedin || ""} onChange={(e) => updateDirector(index, "linkedin", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brown-500" disabled={director.linkedShareholderId !== null} /><div className="flex items-center space-x-2">{director.cv ? (<><a href={director.cv.url} target="_blank" rel="noopener noreferrer" className={`flex-1 text-brown-600 hover:text-brown-800 text-xs truncate ${uploadingCVs.director[index] ? 'opacity-50' : ''}`} title={`View ${director.cv.name}`}>CV: {director.cv.name}</a></>) : (<span className={`flex-1 text-xs ${uploadingCVs.director[index] ? 'text-brown-400' : 'text-gray-400'}`}>{uploadingCVs.director[index] ? 'Uploading...' : 'No CV'}</span>)}<label className={`cursor-pointer ${uploadingCVs.director[index] ? 'opacity-50 pointer-events-none' : ''}`}><input type="file" accept=".pdf,.doc,.docx" onChange={(e) => { const file = e.target.files[0]; if (file) handleDirectorCVUpload(index, file); }} className="hidden" disabled={uploadingCVs.director[index]} /><span className="text-xs text-brown-600 hover:text-brown-800 underline">{uploadingCVs.director[index] ? '...' : director.cv ? 'Replace' : 'Upload'}</span></label></div></div></td>
                  <td className="px-3 py-2 border-b text-center"><input type="checkbox" checked={director.isYouth || false} onChange={(e) => updateDirector(index, "isYouth", e.target.checked)} className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300 rounded" disabled={director.linkedShareholderId !== null} /></td>
                  <td className="px-3 py-2 border-b text-center"><input type="checkbox" checked={director.isDisabled || false} onChange={(e) => updateDirector(index, "isDisabled", e.target.checked)} className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300 rounded" disabled={director.linkedShareholderId !== null} /></td>
                  <td className="px-3 py-2 border-b"><button type="button" onClick={() => removeDirector(index)} className={`text-red-500 hover:text-red-700 ${director.linkedShareholderId !== null ? 'opacity-30 cursor-not-allowed' : ''}`} disabled={director.linkedShareholderId !== null}><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Executive Management Table (LinkedIn & CV moved before Youth?) */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div><h3 className="text-lg font-semibold text-brown-700">Executive Management Table</h3><p className="text-xs text-brown-500 mt-1">Track day-to-day management and operations team</p></div>
          <button type="button" onClick={addExecutive} className="flex items-center px-3 py-1 bg-brown-100 text-brown-700 rounded-md hover:bg-brown-200"><Plus className="w-4 h-4 mr-1" /> Add Executive</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-brown-200 rounded-lg">
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Position</th>
                <th style={thStyle}>Nationality</th>
                <th style={thStyle}>DOA</th>
                <th style={thStyle}>Race</th>
                <th style={thStyle}>Gender</th>
                <th style={thStyle}>LinkedIn & CV</th>
                <th style={thStyle}>Youth?</th>
                <th style={thStyle}>Disabled?</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(formData.executives || []).map((executive, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-brown-50/30"}>
                  <td className="px-3 py-2 border-b"><input type="text" value={executive.name || ""} onChange={(e) => updateExecutive(index, "name", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brown-500" placeholder="Full Name" /></td>
                  <td className="px-3 py-2 border-b"><div className="space-y-1"><select value={executive.position || ""} onChange={(e) => updateExecutive(index, "position", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brown-500"><option value="">Select Position</option>{executivePositions.map((pos) => <option key={pos} value={pos}>{pos}</option>)}</select>{executive.position === "Other" && <input type="text" placeholder="Specify" value={executive.customPosition || ""} onChange={(e) => updateExecutive(index, "customPosition", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brown-500" />}</div></td>
                  <td className="px-3 py-2 border-b"><select value={executive.nationality || ""} onChange={(e) => updateExecutive(index, "nationality", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brown-500"><option value="">Select</option>{africanCountries.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></td>
                  <td className="px-3 py-2 border-b"><input type="date" value={executive.doa || ""} onChange={(e) => updateExecutive(index, "doa", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brown-500" style={{width:'110px'}} /></td>
                  <td className="px-3 py-2 border-b"><select value={executive.race || ""} onChange={(e) => updateExecutive(index, "race", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brown-500"><option value="">Select</option>{raceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></td>
                  <td className="px-3 py-2 border-b"><select value={executive.gender || ""} onChange={(e) => updateExecutive(index, "gender", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brown-500"><option value="">Select</option>{genderOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></td>
                  <td className="px-3 py-2 border-b"><div className="space-y-2"><input type="text" placeholder="LinkedIn URL" value={executive.linkedin || ""} onChange={(e) => updateExecutive(index, "linkedin", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brown-500" /><div className="flex items-center space-x-2">{executive.cv ? (<><a href={executive.cv.url} target="_blank" rel="noopener noreferrer" className={`flex-1 text-brown-600 hover:text-brown-800 text-xs truncate ${uploadingCVs.executive[index] ? 'opacity-50' : ''}`}>CV: {executive.cv.name}</a></>) : (<span className={`flex-1 text-xs ${uploadingCVs.executive[index] ? 'text-brown-400' : 'text-gray-400'}`}>{uploadingCVs.executive[index] ? 'Uploading...' : 'No CV'}</span>)}<label className={`cursor-pointer ${uploadingCVs.executive[index] ? 'opacity-50 pointer-events-none' : ''}`}><input type="file" accept=".pdf,.doc,.docx" onChange={(e) => { const file = e.target.files[0]; if (file) handleExecutiveCVUpload(index, file); }} className="hidden" disabled={uploadingCVs.executive[index]} /><span className="text-xs text-brown-600 hover:text-brown-800 underline">{uploadingCVs.executive[index] ? '...' : executive.cv ? 'Replace' : 'Upload'}</span></label></div></div></td>
                  <td className="px-3 py-2 border-b text-center"><input type="checkbox" checked={executive.isYouth || false} onChange={(e) => updateExecutive(index, "isYouth", e.target.checked)} className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300 rounded" /></td>
                  <td className="px-3 py-2 border-b text-center"><input type="checkbox" checked={executive.isDisabled || false} onChange={(e) => updateExecutive(index, "isDisabled", e.target.checked)} className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300 rounded" /></td>
                  <td className="px-3 py-2 border-b"><button type="button" onClick={() => removeExecutive(index)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active & Previous Interests - Unified Tables with dropdown assignment */}
      <div className="mb-8">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-brown-700">Interests Declaration</h3>
          <p className="text-xs text-brown-500 mt-1">Add active and previous business interests and assign them to relevant people</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <InterestsManager
            title="Active Interests"
            people={allPeople}
            interests={formData.activeInterests || []}
            onChange={(val) => updateFormData({ ...formData, activeInterests: val })}
          />
          <InterestsManager
            title="Previous Interests"
            people={allPeople}
            interests={formData.previousInterests || []}
            onChange={(val) => updateFormData({ ...formData, previousInterests: val })}
          />
        </div>
      </div>

      {/* Employee Qualification and Clearance */}
      <div className="mb-8">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-brown-700">Employee Qualification & Clearance</h3>
          <p className="text-xs text-brown-500 mt-1">Record employee details, qualifications, and roles</p>
        </div>
        <FormField label="How many employees do you have?" required>
          <input type="number" value={formData.totalEmployees || ""} onChange={(e) => updateFormData({ ...formData, totalEmployees: e.target.value })} className="w-full max-w-xs px-3 py-2 border border-brown-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brown-500" placeholder="Enter total number" min="0" />
        </FormField>
        <div className="flex justify-between items-center mt-6 mb-4">
          <h4 className="text-md font-semibold text-brown-600">Employee List</h4>
          <button type="button" onClick={addEmployee} className="flex items-center px-3 py-1 bg-brown-100 text-brown-700 rounded-md hover:bg-brown-200"><Plus className="w-4 h-4 mr-1" /> Add Employee</button>
        </div>
        {(formData.employees || []).length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-brown-200 rounded-lg">
              <thead>
                <tr>
                  <th style={thStyle}>Employee Name</th>
                  <th style={thStyle}>Certification Compulsory?</th>
                  <th style={thStyle}>Qualification</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(formData.employees || []).map((employee, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-brown-50/30"}>
                    <td className="px-3 py-2 border-b"><input type="text" value={employee.name || ""} onChange={(e) => updateEmployee(index, "name", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brown-500" placeholder="Employee name" /></td>
                    <td className="px-3 py-2 border-b"><select value={employee.isCertificationCompulsory || "no"} onChange={(e) => updateEmployee(index, "isCertificationCompulsory", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brown-500"><option value="yes">Yes</option><option value="no">No</option></select></td>
                    <td className="px-3 py-2 border-b">{employee.isCertificationCompulsory === "yes" ? (<select value={employee.qualification || ""} onChange={(e) => updateEmployee(index, "qualification", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brown-500"><option value="">Select Qualification</option>{qualificationOptions.map((qual) => <option key={qual} value={qual}>{qual}</option>)}</select>) : (<span className="text-xs text-gray-400">N/A</span>)}</td>
                    <td className="px-3 py-2 border-b">{employee.qualification && employee.isCertificationCompulsory === "yes" ? (<div className="space-y-1"><select value={employee.role || ""} onChange={(e) => updateEmployee(index, "role", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brown-500"><option value="">Select Role</option>{getRolesForQualification(employee.qualification).map((role) => <option key={role} value={role}>{role}</option>)}<option value="Other">Other</option></select>{employee.role === "Other" && <input type="text" placeholder="Specify role" value={employee.customRole || ""} onChange={(e) => updateEmployee(index, "customRole", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brown-500" />}</div>) : (<input type="text" value={employee.role || ""} onChange={(e) => updateEmployee(index, "role", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brown-500" placeholder="Enter role" />)}</td>
                    <td className="px-3 py-2 border-b"><button type="button" onClick={() => removeEmployee(index)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload overlay */}
      {isUploadOverlayVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brown-600 mb-4"></div>
              <h3 className="text-lg font-semibold text-brown-800 mb-2">Processing CV</h3>
              <p className="text-brown-600 text-center">Uploading and validating your CV with AI...<br /><span className="text-sm text-brown-500">This may take a moment</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}