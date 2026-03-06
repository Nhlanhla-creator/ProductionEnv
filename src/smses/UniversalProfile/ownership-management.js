"use client";
import { Plus, Trash2 } from 'lucide-react'
import FormField from "./form-field"
import FileUpload from "./file-upload"
import './UniversalProfile.css';
import { useEffect, useState } from 'react';
import { db, auth, storage } from '../../firebaseConfig';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
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

const positionOptions = [
  "Chairman", "Vice-President", "Board of Directors", "Chief Executive Officer",
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

// ─── Business Leadership options ─────────────────────────────────────────────
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
  name: "", country: "", linkedin: "", shareholding: "", race: "",
  gender: "", isYouth: false, isDisabled: false, isAlsoDirector: false, directorId: null, idDocument: null,
};

const DEFAULT_DIRECTOR = {
  name: "", position: "", customPosition: "", nationality: "", linkedin: "",
  execType: "", race: "", gender: "", isYouth: false, isDisabled: false,
  linkedShareholderId: null, cv: null,
};

const DEFAULT_EXECUTIVE = {
  name: "", position: "", customPosition: "", department: "", nationality: "",
  linkedin: "", race: "", gender: "", isYouth: false, isDisabled: false, cv: null,
};

const DEFAULT_BUSINESS_LEADERSHIP = {
  ownerLed: "",
  primaryMotivation: "",
  growthAmbition: "",
  founderFullTime: "",
  opennessToAdvice: "",
  decisionGovernance: "",
};

export default function OwnershipManagement({ data = { shareholders: [], directors: [], executives: [] }, updateData }) {
  const [formData, setFormData] = useState({ shareholders: [], directors: [], executives: [], businessLeadership: DEFAULT_BUSINESS_LEADERSHIP });
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
        position: director.position === "Other" ? director.customPosition : director.position,
        nationality: director.nationality,
        execType: director.execType,
        race: director.race,
        gender: director.gender,
        isYouth: director.isYouth,
        isDisabled: director.isDisabled,
      }));
      const growthSuiteRef = doc(db, "growthSuite", userId);
      await setDoc(growthSuiteRef, { boardOfDirectors: boardMembers, lastUpdated: new Date().toISOString() }, { merge: true });
    } catch (error) {
      console.error("Error syncing to Growth Suite:", error);
    }
  };

  const handleDeleteCV = async (type, index) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete this ${type}'s CV?`);
    if (!confirmDelete) return;
    setUploadingCVs(prev => ({ ...prev, [type]: { ...prev[type], [index]: true } }));
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      const profileRef = doc(db, "universalProfiles", userId);
      const profileSnap = await getDoc(profileRef);
      const existingData = profileSnap.exists() ? profileSnap.data() : {};
      const existingCVs = existingData.documents?.cv_multiple || [];
      const updatedCVs = existingCVs.filter(cv => {
        if (type === 'director') return !(cv.directorIndex === index && cv.source === "ownership_management");
        if (type === 'executive') return !(cv.executiveIndex === index && cv.source === "ownership_management");
        return true;
      });
      await updateDoc(profileRef, {
        [`documents.cv_multiple`]: updatedCVs,
        [`documents.cv_multiple_updated`]: serverTimestamp(),
        [`documents.cv_count`]: updatedCVs.length
      });
      if (type === 'director') updateDirector(index, "cv", null);
      else if (type === 'executive') updateExecutive(index, "cv", null);
    } catch (error) {
      console.error("Error deleting CV:", error);
      alert('Failed to delete CV. Please try again.');
    } finally {
      setUploadingCVs(prev => ({ ...prev, [type]: { ...prev[type], [index]: false } }));
    }
  };

  const handleDirectorCVUpload = async (index, file) => {
    if (!file) return;
    setUploadingCVs(prev => ({ ...prev, director: { ...prev.director, [index]: true } }));
    setIsUploadOverlayVisible(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      const validationResult = await validateCV(file);
      if (!validationResult.isValid) { alert(`CV validation failed: ${validationResult.message}`); return; }
      const timestamp = Date.now();
      const storageRef = ref(storage, `directors/cv/${userId}/${index}_${timestamp}_${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);
      updateDirector(index, "cv", { name: file.name, url: downloadURL, uploadedAt: new Date().toISOString(), status: validationResult.status, message: validationResult.message, isValid: validationResult.isValid });
      const profileRef = doc(db, "universalProfiles", userId);
      const profileSnap = await getDoc(profileRef);
      const existingData = profileSnap.exists() ? profileSnap.data() : {};
      const existingCVs = existingData.documents?.cv_multiple || [];
      const cvData = { url: downloadURL, status: validationResult.status, message: validationResult.message, isValid: validationResult.isValid, uploadedAt: new Date().toISOString(), directorIndex: index, directorName: formData.directors[index]?.name || `Director ${index + 1}`, source: "ownership_management", documentType: "CV", role: "Director", roleLabel: `Director ${index + 1}`, personName: formData.directors[index]?.name || `Director ${index + 1}`, fileName: file.name };
      const existingIndex = existingCVs.findIndex(cv => cv.directorIndex === index && cv.source === "ownership_management");
      const updatedCVs = existingIndex >= 0 ? existingCVs.map((cv, i) => i === existingIndex ? cvData : cv) : [...existingCVs, cvData];
      await updateDoc(profileRef, { [`documents.cv_multiple`]: updatedCVs, [`documents.cv_multiple_updated`]: serverTimestamp(), [`documents.cv_count`]: updatedCVs.length });
      if (validationResult.message && validationResult.message !== "Document verified") alert(`CV uploaded: ${validationResult.message}`);
    } catch (error) {
      console.error("Error uploading director CV:", error);
      alert("Failed to upload CV. Please check your connection and try again.");
    } finally {
      setUploadingCVs(prev => ({ ...prev, director: { ...prev.director, [index]: false } }));
      setIsUploadOverlayVisible(false);
    }
  };

  const handleExecutiveCVUpload = async (index, file) => {
    if (!file) return;
    setUploadingCVs(prev => ({ ...prev, executive: { ...prev.executive, [index]: true } }));
    setIsUploadOverlayVisible(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      const validationResult = await validateCV(file);
      if (!validationResult.isValid) { alert(`CV validation failed: ${validationResult.message}`); return; }
      const timestamp = Date.now();
      const storageRef = ref(storage, `executives/cv/${userId}/${index}_${timestamp}_${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);
      updateExecutive(index, "cv", { name: file.name, url: downloadURL, uploadedAt: new Date().toISOString(), status: validationResult.status, message: validationResult.message, isValid: validationResult.isValid });
      const profileRef = doc(db, "universalProfiles", userId);
      const profileSnap = await getDoc(profileRef);
      const existingData = profileSnap.exists() ? profileSnap.data() : {};
      const existingCVs = existingData.documents?.cv_multiple || [];
      const cvData = { url: downloadURL, status: validationResult.status, message: validationResult.message, isValid: validationResult.isValid, uploadedAt: new Date().toISOString(), executiveIndex: index, executiveName: formData.executives[index]?.name || `Executive ${index + 1}`, source: "ownership_management", documentType: "CV", role: "Executive", roleLabel: `Executive ${index + 1}`, personName: formData.executives[index]?.name || `Executive ${index + 1}`, fileName: file.name };
      const existingIndex = existingCVs.findIndex(cv => cv.executiveIndex === index && cv.source === "ownership_management");
      const updatedCVs = existingIndex >= 0 ? existingCVs.map((cv, i) => i === existingIndex ? cvData : cv) : [...existingCVs, cvData];
      await updateDoc(profileRef, { [`documents.cv_multiple`]: updatedCVs, [`documents.cv_multiple_updated`]: serverTimestamp(), [`documents.cv_count`]: updatedCVs.length });
      if (validationResult.message && validationResult.message !== "Document verified") alert(`CV uploaded: ${validationResult.message}`);
    } catch (error) {
      console.error("Error uploading executive CV:", error);
      alert("Failed to upload CV. Please check your connection and try again.");
    } finally {
      setUploadingCVs(prev => ({ ...prev, executive: { ...prev.executive, [index]: false } }));
      setIsUploadOverlayVisible(false);
    }
  };

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
            });
          } else {
            const initData = data.shareholders?.length > 0 || data.directors?.length > 0 || data.executives?.length > 0
              ? { ...data, businessLeadership: data.businessLeadership || DEFAULT_BUSINESS_LEADERSHIP }
              : { shareholders: [DEFAULT_SHAREHOLDER], directors: [DEFAULT_DIRECTOR], executives: [DEFAULT_EXECUTIVE], businessLeadership: DEFAULT_BUSINESS_LEADERSHIP };
            updateFormData(initData);
          }
        } else {
          const initData = data.shareholders?.length > 0 || data.directors?.length > 0 || data.executives?.length > 0
            ? { ...data, businessLeadership: data.businessLeadership || DEFAULT_BUSINESS_LEADERSHIP }
            : { shareholders: [DEFAULT_SHAREHOLDER], directors: [DEFAULT_DIRECTOR], executives: [DEFAULT_EXECUTIVE], businessLeadership: DEFAULT_BUSINESS_LEADERSHIP };
          updateFormData(initData);
        }
      } catch (error) {
        console.error("Error loading ownership management:", error);
        const fallbackData = data.shareholders?.length > 0 || data.directors?.length > 0 || data.executives?.length > 0
          ? { ...data, businessLeadership: data.businessLeadership || DEFAULT_BUSINESS_LEADERSHIP }
          : { shareholders: [DEFAULT_SHAREHOLDER], directors: [DEFAULT_DIRECTOR], executives: [DEFAULT_EXECUTIVE], businessLeadership: DEFAULT_BUSINESS_LEADERSHIP };
        updateFormData(fallbackData);
      } finally {
        setIsLoading(false);
      }
    };
    loadOwnershipManagement();
  }, []);

  useEffect(() => {
    if (!isLoading && (!formData.shareholders?.length && !formData.directors?.length && !formData.executives?.length)) {
      setFormData({ ...data, businessLeadership: data.businessLeadership || DEFAULT_BUSINESS_LEADERSHIP });
    }
  }, [data, isLoading]);

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
    if (field === "position" && value !== "Other") newDirectors[index].customPosition = "";
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
    if (director.cv) handleDeleteCV('director', index);
    const newDirectors = formData.directors.filter((_, i) => i !== index);
    if (director.linkedShareholderId !== null) {
      const newShareholders = [...formData.shareholders];
      if (director.linkedShareholderId < newShareholders.length) {
        newShareholders[director.linkedShareholderId] = { ...newShareholders[director.linkedShareholderId], isAlsoDirector: false, directorId: null };
        updateFormData({ ...formData, directors: newDirectors, shareholders: newShareholders });
        return;
      }
    }
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

  // ─── Business Leadership handler ────────────────────────────────────────────
  const updateBusinessLeadership = (field, value) => {
    const updated = { ...formData, businessLeadership: { ...(formData.businessLeadership || DEFAULT_BUSINESS_LEADERSHIP), [field]: value } };
    updateFormData(updated);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateFormData({ ...formData, [name]: value });
  };

  const shareholderColumns = [
    { label: "Name", style: { width: "25%", minWidth: "180px" } },
    { label: "Country", style: { width: "15%", minWidth: "130px" } },
    { label: "LinkedIn", style: { width: "25%", minWidth: "180px" } },
    { label: "%Shareholding", style: { width: "10%" } },
    { label: "Race", style: { width: "10%" } },
    { label: "Gender", style: { width: "10%" } },
    { label: "Youth?", style: { width: "7%" } },
    { label: "Disabled?", style: { width: "7%" } },
    { label: "Also Director?", style: { width: "10%" } },
    { label: "Actions", style: { width: "60px" } },
  ];

  const directorColumns = [
    { label: "Name", style: { width: "20%", minWidth: "160px" } },
    { label: "Position", style: { width: "15%", minWidth: "120px" } },
    { label: "Nationality", style: { width: "10%" } },
    { label: "LinkedIn & CV", style: { width: "25%", minWidth: "180px" } },
    { label: "Exec/Non-Exec", style: { width: "10%" } },
    { label: "Race", style: { width: "8%" } },
    { label: "Gender", style: { width: "8%" } },
    { label: "Youth?", style: { width: "6%" } },
    { label: "Disabled?", style: { width: "6%" } },
    { label: "Actions", style: { width: "60px" } },
  ];

  const executiveColumns = [
    { label: "Name", style: { width: "20%", minWidth: "160px" } },
    { label: "Position", style: { width: "15%", minWidth: "120px" } },
    { label: "Nationality", style: { width: "12%" } },
    { label: "LinkedIn & CV", style: { width: "25%", minWidth: "180px" } },
    { label: "Race", style: { width: "8%" } },
    { label: "Gender", style: { width: "8%" } },
    { label: "Youth?", style: { width: "6%" } },
    { label: "Disabled?", style: { width: "6%" } },
    { label: "Actions", style: { width: "60px" } },
  ];

  if (isLoading) {
    return (
      <div className="ownership-management-loading">
        <h2 className="text-2xl font-bold text-brown-800 mb-6">Ownership & Management</h2>
        <p>Loading your information...</p>
      </div>
    );
  }

  const bl = formData.businessLeadership || DEFAULT_BUSINESS_LEADERSHIP;

  const leadershipQuestions = [
    {
      field: "ownerLed",
      question: "Q1 – Is the business owner-led?",
      options: leadershipOptions.ownerLed,
    },
    {
      field: "primaryMotivation",
      question: "Q2 – What best describes the primary motivation for building this business?",
      options: leadershipOptions.primaryMotivation,
    },
    {
      field: "growthAmbition",
      question: "Q3 – Growth ambition (next 5 years)",
      options: leadershipOptions.growthAmbition,
    },
    {
      field: "founderFullTime",
      question: "Q4 – Is the founder working in the business full-time?",
      options: leadershipOptions.founderFullTime,
    },
    {
      field: "opennessToAdvice",
      question: "Q5 – Openness to advice",
      options: leadershipOptions.opennessToAdvice,
    },
    {
      field: "decisionGovernance",
      question: "Q6 – Decision governance",
      options: leadershipOptions.decisionGovernance,
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-brown-800 mb-6">Ownership & Management</h2>

      <div className="mb-8">
        <FormField label="Total Shares" required>
          <input
            type="number"
            name="totalShares"
            value={formData.totalShares || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
            required
          />
        </FormField>
      </div>

      {/* Shareholder Table */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-brown-700">Shareholder Table</h3>
          <button type="button" onClick={addShareholder} className="flex items-center px-3 py-1 bg-brown-100 text-brown-700 rounded-md hover:bg-brown-200">
            <Plus className="w-4 h-4 mr-1" /> Add Shareholder
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-brown-200 rounded-lg">
            <thead>
              <tr className="bg-brown-50">
                {shareholderColumns.map((header, i) => (
                  <th key={i} className="px-4 py-2 text-left text-xs font-medium text-brown-700 uppercase tracking-wider border-b" style={header.style}>{header.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {formData.shareholders?.map((shareholder, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-brown-50"}>
                  <td className="px-4 py-2 border-b"><input type="text" value={shareholder.name || ""} onChange={(e) => updateShareholder(index, "name", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500" /></td>
                  <td className="px-4 py-2 border-b">
                    <select value={shareholder.country || ""} onChange={(e) => updateShareholder(index, "country", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500">
                      <option value="">Select</option>
                      {africanCountries.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2 border-b"><input type="text" value={shareholder.linkedin || ""} onChange={(e) => updateShareholder(index, "linkedin", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500" /></td>
                  <td className="px-4 py-2 border-b"><input type="number" value={shareholder.shareholding || ""} onChange={(e) => updateShareholder(index, "shareholding", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500" min="0" max="100" step="0.01" /></td>
                  <td className="px-4 py-2 border-b">
                    <select value={shareholder.race || ""} onChange={(e) => updateShareholder(index, "race", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500">
                      <option value="">Select</option>
                      {raceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2 border-b">
                    <select value={shareholder.gender || ""} onChange={(e) => updateShareholder(index, "gender", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500">
                      <option value="">Select</option>
                      {genderOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2 border-b text-center"><input type="checkbox" checked={shareholder.isYouth || false} onChange={(e) => updateShareholder(index, "isYouth", e.target.checked)} className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300 rounded" /></td>
                  <td className="px-4 py-2 border-b text-center"><input type="checkbox" checked={shareholder.isDisabled || false} onChange={(e) => updateShareholder(index, "isDisabled", e.target.checked)} className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300 rounded" /></td>
                  <td className="px-4 py-2 border-b text-center">
                    <div className="flex flex-col items-center">
                      <input type="checkbox" checked={shareholder.isAlsoDirector || false} onChange={(e) => updateShareholder(index, "isAlsoDirector", e.target.checked)} className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300 rounded" />
                      {shareholder.isAlsoDirector && <span className="text-xs text-green-600 mt-1">✓ Linked</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2 border-b"><button type="button" onClick={() => removeShareholder(index)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Directors Table */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-brown-700">Directors Table</h3>
            <p className="text-xs text-brown-500 mt-1">Directors automatically sync to Growth Suite "Board of Directors"</p>
          </div>
          <button type="button" onClick={addDirector} className="flex items-center px-3 py-1 bg-brown-100 text-brown-700 rounded-md hover:bg-brown-200">
            <Plus className="w-4 h-4 mr-1" /> Add Director
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-brown-200 rounded-lg">
            <thead>
              <tr className="bg-brown-50">
                {directorColumns.map((header, i) => (
                  <th key={i} className="px-4 py-2 text-left text-xs font-medium text-brown-700 uppercase tracking-wider border-b" style={header.style}>{header.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {formData.directors?.map((director, index) => (
                <tr key={index} className={`${index % 2 === 0 ? "bg-white" : "bg-brown-50"} ${director.linkedShareholderId !== null ? "border-l-4 border-l-blue-400" : ""}`}>
                  <td className="px-4 py-2 border-b">
                    <div className="flex items-center space-x-2">
                      <input type="text" value={director.name || ""} onChange={(e) => updateDirector(index, "name", e.target.value)} className="flex-1 px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500" disabled={director.linkedShareholderId !== null} />
                      {director.linkedShareholderId !== null && <span className="text-xs text-blue-600" title="Linked to shareholder">🔗</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2 border-b">
                    <div className="space-y-1">
                      <select value={director.position || ""} onChange={(e) => updateDirector(index, "position", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500">
                        <option value="">Select Position</option>
                        {positionOptions.map((pos) => <option key={pos} value={pos}>{pos}</option>)}
                      </select>
                      {director.position === "Other" && <input type="text" placeholder="Specify position" value={director.customPosition || ""} onChange={(e) => updateDirector(index, "customPosition", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500 text-sm" />}
                    </div>
                  </td>
                  <td className="px-4 py-2 border-b">
                    <select value={director.nationality || ""} onChange={(e) => updateDirector(index, "nationality", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500" disabled={director.linkedShareholderId !== null}>
                      <option value="">Select</option>
                      {africanCountries.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2 border-b">
                    <div className="space-y-2">
                      <input type="text" placeholder="LinkedIn URL" value={director.linkedin || ""} onChange={(e) => updateDirector(index, "linkedin", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500" disabled={director.linkedShareholderId !== null} />
                      <div className="flex items-center space-x-2">
                        {director.cv ? (
                          <>
                            <a href={director.cv.url} target="_blank" rel="noopener noreferrer" className={`flex-1 text-brown-600 hover:text-brown-800 text-xs truncate ${uploadingCVs.director[index] ? 'opacity-50' : ''}`} title={`View ${director.cv.name}`}>CV: {director.cv.name}</a>
                            {uploadingCVs.director[index] && <div className="ml-2 flex items-center"><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-brown-600"></div></div>}
                          </>
                        ) : (
                          <span className={`flex-1 text-xs ${uploadingCVs.director[index] ? 'text-brown-400' : 'text-gray-400'}`}>{uploadingCVs.director[index] ? 'Uploading...' : 'No CV uploaded'}</span>
                        )}
                        <label className={`cursor-pointer ${uploadingCVs.director[index] ? 'opacity-50 pointer-events-none' : ''}`}>
                          <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => { const file = e.target.files[0]; if (file) handleDirectorCVUpload(index, file); }} className="hidden" disabled={uploadingCVs.director[index]} />
                          <span className="text-xs text-brown-600 hover:text-brown-800 underline">{uploadingCVs.director[index] ? 'Uploading...' : director.cv ? 'Replace' : 'Upload CV'}</span>
                        </label>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 border-b">
                    <select value={director.execType || ""} onChange={(e) => updateDirector(index, "execType", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500">
                      <option value="">Select</option>
                      {execOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2 border-b">
                    <select value={director.race || ""} onChange={(e) => updateDirector(index, "race", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500" disabled={director.linkedShareholderId !== null}>
                      <option value="">Select</option>
                      {raceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2 border-b">
                    <select value={director.gender || ""} onChange={(e) => updateDirector(index, "gender", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500" disabled={director.linkedShareholderId !== null}>
                      <option value="">Select</option>
                      {genderOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2 border-b text-center"><input type="checkbox" checked={director.isYouth || false} onChange={(e) => updateDirector(index, "isYouth", e.target.checked)} className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300 rounded" disabled={director.linkedShareholderId !== null} /></td>
                  <td className="px-4 py-2 border-b text-center"><input type="checkbox" checked={director.isDisabled || false} onChange={(e) => updateDirector(index, "isDisabled", e.target.checked)} className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300 rounded" disabled={director.linkedShareholderId !== null} /></td>
                  <td className="px-4 py-2 border-b">
                    <button type="button" onClick={() => removeDirector(index)} className="text-red-500 hover:text-red-700" disabled={director.linkedShareholderId !== null} title={director.linkedShareholderId !== null ? "Uncheck 'Also Director' in shareholder table to remove" : "Remove director"}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Executive Management Table */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-brown-700">Executive Management Table</h3>
            <p className="text-xs text-brown-500 mt-1">Track day-to-day management and operations team</p>
          </div>
          <button type="button" onClick={addExecutive} className="flex items-center px-3 py-1 bg-brown-100 text-brown-700 rounded-md hover:bg-brown-200">
            <Plus className="w-4 h-4 mr-1" /> Add Executive
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-brown-200 rounded-lg">
            <thead>
              <tr className="bg-brown-50">
                {executiveColumns.map((header, i) => (
                  <th key={i} className="px-4 py-2 text-left text-xs font-medium text-brown-700 uppercase tracking-wider border-b" style={header.style}>{header.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(formData.executives || []).map((executive, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-brown-50"}>
                  <td className="px-4 py-2 border-b"><input type="text" value={executive.name || ""} onChange={(e) => updateExecutive(index, "name", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500" placeholder="Full Name" /></td>
                  <td className="px-4 py-2 border-b">
                    <div className="space-y-1">
                      <select value={executive.position || ""} onChange={(e) => updateExecutive(index, "position", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500">
                        <option value="">Select Position</option>
                        {executivePositions.map((pos) => <option key={pos} value={pos}>{pos}</option>)}
                      </select>
                      {executive.position === "Other" && <input type="text" placeholder="Specify position" value={executive.customPosition || ""} onChange={(e) => updateExecutive(index, "customPosition", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500 text-sm" />}
                    </div>
                  </td>
                  <td className="px-4 py-2 border-b">
                    <select value={executive.nationality || ""} onChange={(e) => updateExecutive(index, "nationality", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500">
                      <option value="">Select</option>
                      {africanCountries.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2 border-b">
                    <div className="space-y-2">
                      <input type="text" placeholder="LinkedIn URL" value={executive.linkedin || ""} onChange={(e) => updateExecutive(index, "linkedin", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500" />
                      <div className="flex items-center space-x-2">
                        {executive.cv ? (
                          <>
                            <a href={executive.cv.url} target="_blank" rel="noopener noreferrer" className={`flex-1 text-brown-600 hover:text-brown-800 text-xs truncate ${uploadingCVs.executive[index] ? 'opacity-50' : ''}`} title={`View ${executive.cv.name}`}>CV: {executive.cv.name}</a>
                            {uploadingCVs.executive[index] && <div className="ml-2 flex items-center"><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-brown-600"></div></div>}
                          </>
                        ) : (
                          <span className={`flex-1 text-xs ${uploadingCVs.executive[index] ? 'text-brown-400' : 'text-gray-400'}`}>{uploadingCVs.executive[index] ? 'Uploading...' : 'No CV uploaded'}</span>
                        )}
                        <label className={`cursor-pointer ${uploadingCVs.executive[index] ? 'opacity-50 pointer-events-none' : ''}`}>
                          <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => { const file = e.target.files[0]; if (file) handleExecutiveCVUpload(index, file); }} className="hidden" disabled={uploadingCVs.executive[index]} />
                          <span className="text-xs text-brown-600 hover:text-brown-800 underline">{uploadingCVs.executive[index] ? 'Uploading...' : executive.cv ? 'Replace' : 'Upload CV'}</span>
                        </label>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 border-b">
                    <select value={executive.race || ""} onChange={(e) => updateExecutive(index, "race", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500">
                      <option value="">Select</option>
                      {raceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2 border-b">
                    <select value={executive.gender || ""} onChange={(e) => updateExecutive(index, "gender", e.target.value)} className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500">
                      <option value="">Select</option>
                      {genderOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2 border-b text-center"><input type="checkbox" checked={executive.isYouth || false} onChange={(e) => updateExecutive(index, "isYouth", e.target.checked)} className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300 rounded" /></td>
                  <td className="px-4 py-2 border-b text-center"><input type="checkbox" checked={executive.isDisabled || false} onChange={(e) => updateExecutive(index, "isDisabled", e.target.checked)} className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300 rounded" /></td>
                  <td className="px-4 py-2 border-b"><button type="button" onClick={() => removeExecutive(index)} className="text-red-500 hover:text-red-700" title="Remove executive"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Business Leadership – Profile Assessment ─────────────────────────── */}
      <div className="mb-8">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-brown-700">Business Leadership – Profile Assessment</h3>
          <p className="text-xs text-brown-500 mt-1">
            Help us understand how the business is led and where it is headed.
          </p>
        </div>

        <div className="bg-white border border-brown-200 rounded-lg overflow-hidden">
          {leadershipQuestions.map((item, i) => (
            <div
              key={item.field}
              className={`px-6 py-5 ${i < leadershipQuestions.length - 1 ? "border-b border-brown-100" : ""} ${i % 2 === 0 ? "bg-white" : "bg-brown-50"}`}
            >
              <label className="block text-sm font-semibold text-brown-700 mb-2">
                {item.question}
              </label>
              <select
                value={bl[item.field] || ""}
                onChange={(e) => updateBusinessLeadership(item.field, e.target.value)}
                className="w-full max-w-xl px-3 py-2 border border-brown-300 rounded-md text-sm text-brown-800 focus:outline-none focus:ring-2 focus:ring-brown-500 bg-white"
              >
                <option value="">— Select an answer —</option>
                {item.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Upload overlay */}
      {isUploadOverlayVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brown-600 mb-4"></div>
              <h3 className="text-lg font-semibold text-brown-800 mb-2">Processing CV</h3>
              <p className="text-brown-600 text-center">
                Uploading and validating your CV with AI...
                <br />
                <span className="text-sm text-brown-500">This may take a moment</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}