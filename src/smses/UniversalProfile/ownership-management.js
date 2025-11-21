"use client";
import { Plus, Trash2 } from 'lucide-react'
import FormField from "./form-field"
import FileUpload from "./file-upload"
import './UniversalProfile.css';
import { useEffect, useState } from 'react';
import { db, auth, storage } from '../../firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Constants
const raceOptions = [
  { value: "black", label: "Black African" },
  { value: "coloured", label: "Coloured" },
  { value: "indian", label: "Indian/Asian" },
  { value: "white", label: "White" },
  { value: "other", label: "Other" },
];

const positionOptions = [
  "Chairman",
  "Vice-President",
  "Board of Directors",
  "Chief Executive Officer",
  "General Manager",
  "Regional Manager",
  "Supervisor",
  "Office Manager",
  "Team Leader",
  "Other",
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
  { value: "Algeria", label: "Algeria" },
  { value: "Angola", label: "Angola" },
  { value: "Benin", label: "Benin" },
  { value: "Botswana", label: "Botswana" },
  { value: "Burkina Faso", label: "Burkina Faso" },
  { value: "Burundi", label: "Burundi" },
  { value: "Cabo Verde", label: "Cabo Verde" },
  { value: "Cameroon", label: "Cameroon" },
  { value: "Central African Republic", label: "Central African Republic" },
  { value: "Chad", label: "Chad" },
  { value: "Comoros", label: "Comoros" },
  { value: "Congo", label: "Congo" },
  { value: "Côte d'Ivoire", label: "Côte d'Ivoire" },
  { value: "Djibouti", label: "Djibouti" },
  { value: "DR Congo", label: "DR Congo" },
  { value: "Egypt", label: "Egypt" },
  { value: "Equatorial Guinea", label: "Equatorial Guinea" },
  { value: "Eritrea", label: "Eritrea" },
  { value: "Eswatini", label: "Eswatini" },
  { value: "Ethiopia", label: "Ethiopia" },
  { value: "Gabon", label: "Gabon" },
  { value: "Gambia", label: "Gambia" },
  { value: "Ghana", label: "Ghana" },
  { value: "Guinea", label: "Guinea" },
  { value: "Guinea-Bissau", label: "Guinea-Bissau" },
  { value: "Kenya", label: "Kenya" },
  { value: "Lesotho", label: "Lesotho" },
  { value: "Liberia", label: "Liberia" },
  { value: "Libya", label: "Libya" },
  { value: "Madagascar", label: "Madagascar" },
  { value: "Malawi", label: "Malawi" },
  { value: "Mali", label: "Mali" },
  { value: "Mauritania", label: "Mauritania" },
  { value: "Mauritius", label: "Mauritius" },
  { value: "Morocco", label: "Morocco" },
  { value: "Mozambique", label: "Mozambique" },
  { value: "Namibia", label: "Namibia" },
  { value: "Niger", label: "Niger" },
  { value: "Nigeria", label: "Nigeria" },
  { value: "Rwanda", label: "Rwanda" },
  { value: "São Tomé and Príncipe", label: "São Tomé and Príncipe" },
  { value: "Senegal", label: "Senegal" },
  { value: "Seychelles", label: "Seychelles" },
  { value: "Sierra Leone", label: "Sierra Leone" },
  { value: "Somalia", label: "Somalia" },
  { value: "South Africa", label: "South Africa" },
  { value: "South Sudan", label: "South Sudan" },
  { value: "Sudan", label: "Sudan" },
  { value: "Tanzania", label: "Tanzania" },
  { value: "Togo", label: "Togo" },
  { value: "Tunisia", label: "Tunisia" },
  { value: "Uganda", label: "Uganda" },
  { value: "Zambia", label: "Zambia" },
  { value: "Zimbabwe", label: "Zimbabwe" },
];

const DEFAULT_SHAREHOLDER = {
  name: "",
  country: "",
  linkedin: "",
  shareholding: "",
  race: "",
  gender: "",
  isYouth: false,
  isDisabled: false,
  isAlsoDirector: false,
  directorId: null,
  idDocument: null,
};

const DEFAULT_DIRECTOR = {
  name: "",
  position: "",
  customPosition: "",
  nationality: "",
  linkedin: "",
  execType: "",
  race: "",
  gender: "",
  isYouth: false,
  isDisabled: false,
  linkedShareholderId: null,
  cv: null,
};

export default function OwnershipManagement({ data = { shareholders: [], directors: [] }, updateData }) {
  const [formData, setFormData] = useState({ shareholders: [], directors: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Helper functions
  const updateFormData = (newData) => {
    setFormData(newData);
    updateData(newData);
    
    // Sync to Growth Suite Board of Directors
    syncToGrowthSuite(newData.directors || []);
  };

  // Sync directors to Growth Suite
  const syncToGrowthSuite = async (directors) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      // Map directors to Growth Suite board format
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

      // Update Growth Suite document
      const growthSuiteRef = doc(db, "growthSuite", userId);
      await setDoc(growthSuiteRef, {
        boardOfDirectors: boardMembers,
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      console.log("Board of Directors synced to Growth Suite");
    } catch (error) {
      console.error("Error syncing to Growth Suite:", error);
    }
  };

  // File upload handler for director CVs
  const handleDirectorCVUpload = async (index, file) => {
    if (!file) return;

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.error("No user authenticated");
        return;
      }

      // Create a unique filename
      const timestamp = Date.now();
      const fileName = `directors/cv/${userId}/${index}_${timestamp}_${file.name}`;
      
      // Create storage reference
      const storageRef = ref(storage, fileName);
      
      // Upload file
      const uploadResult = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      // Update director with CV URL
      updateDirector(index, "cv", {
        name: file.name,
        url: downloadURL,
        uploadedAt: new Date().toISOString()
      });

      console.log("CV uploaded successfully:", downloadURL);
    } catch (error) {
      console.error("Error uploading CV:", error);
      alert("Failed to upload CV. Please try again.");
    }
  };

  // Data loading
  useEffect(() => {
    const loadOwnershipManagement = async () => {
      try {
        setIsLoading(true);
        const userId = auth.currentUser?.uid;
        
        if (!userId) {
          setIsLoading(false);
          return;
        }

        const docRef = doc(db, "universalProfiles", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const profileData = docSnap.data();
          
          if (profileData.ownershipManagement) {
            updateFormData(profileData.ownershipManagement);
          } else {
            const initData = data.shareholders?.length > 0 || data.directors?.length > 0 
              ? data 
              : {
                  shareholders: [DEFAULT_SHAREHOLDER],
                  directors: [DEFAULT_DIRECTOR],
                };
            updateFormData(initData);
          }
        } else {
          const initData = data.shareholders?.length > 0 || data.directors?.length > 0 
            ? data 
            : {
                shareholders: [DEFAULT_SHAREHOLDER],
                directors: [DEFAULT_DIRECTOR],
              };
          updateFormData(initData);
        }
      } catch (error) {
        console.error("Error loading ownership management:", error);
        const fallbackData = data.shareholders?.length > 0 || data.directors?.length > 0 
          ? data 
          : {
              shareholders: [DEFAULT_SHAREHOLDER],
              directors: [DEFAULT_DIRECTOR],
            };
        updateFormData(fallbackData);
      } finally {
        setIsLoading(false);
      }
    };

    loadOwnershipManagement();
  }, []);

  useEffect(() => {
    if (!isLoading && (!formData.shareholders?.length && !formData.directors?.length)) {
      setFormData(data);
    }
  }, [data, isLoading]);

  // Shareholder functions
  const addShareholder = () => {
    const newShareholders = [...formData.shareholders, DEFAULT_SHAREHOLDER];
    updateFormData({ ...formData, shareholders: newShareholders });
  };

  const updateShareholder = (index, field, value) => {
    const newShareholders = [...formData.shareholders];
    const shareholder = newShareholders[index];
    
    // Handle "Also a Director" checkbox
    if (field === "isAlsoDirector") {
      if (value === true) {
        // Add as director
        const newDirector = {
          ...DEFAULT_DIRECTOR,
          name: shareholder.name,
          nationality: shareholder.country,
          linkedin: shareholder.linkedin,
          race: shareholder.race,
          gender: shareholder.gender,
          isYouth: shareholder.isYouth,
          isDisabled: shareholder.isDisabled,
          linkedShareholderId: index,
        };
        
        const newDirectors = [...formData.directors, newDirector];
        newShareholders[index] = { 
          ...shareholder, 
          isAlsoDirector: true,
          directorId: newDirectors.length - 1
        };
        
        updateFormData({ 
          ...formData, 
          shareholders: newShareholders,
          directors: newDirectors 
        });
        return;
      } else {
        // Remove from directors if unchecked
        if (shareholder.directorId !== null) {
          const newDirectors = formData.directors.filter((_, i) => i !== shareholder.directorId);
          newShareholders[index] = { 
            ...shareholder, 
            isAlsoDirector: false,
            directorId: null
          };
          
          updateFormData({ 
            ...formData, 
            shareholders: newShareholders,
            directors: newDirectors 
          });
          return;
        }
      }
    }
    
    // Regular field update
    newShareholders[index] = { ...shareholder, [field]: value };
    
    // If this shareholder is also a director, update director info
    if (shareholder.isAlsoDirector && shareholder.directorId !== null) {
      const newDirectors = [...formData.directors];
      const directorIndex = shareholder.directorId;
      
      if (directorIndex < newDirectors.length) {
        // Sync relevant fields to director
        if (field === "name") newDirectors[directorIndex].name = value;
        if (field === "country") newDirectors[directorIndex].nationality = value;
        if (field === "linkedin") newDirectors[directorIndex].linkedin = value;
        if (field === "race") newDirectors[directorIndex].race = value;
        if (field === "gender") newDirectors[directorIndex].gender = value;
        if (field === "isYouth") newDirectors[directorIndex].isYouth = value;
        if (field === "isDisabled") newDirectors[directorIndex].isDisabled = value;
        
        updateFormData({ ...formData, shareholders: newShareholders, directors: newDirectors });
        return;
      }
    }
    
    updateFormData({ ...formData, shareholders: newShareholders });
  };

  const removeShareholder = (index) => {
    const shareholder = formData.shareholders[index];
    let newDirectors = [...formData.directors];
    
    // If this shareholder is also a director, remove from directors
    if (shareholder.isAlsoDirector && shareholder.directorId !== null) {
      newDirectors = newDirectors.filter((_, i) => i !== shareholder.directorId);
    }
    
    const newShareholders = formData.shareholders.filter((_, i) => i !== index);
    updateFormData({ ...formData, shareholders: newShareholders, directors: newDirectors });
  };

  // Director functions
  const addDirector = () => {
    const newDirectors = [...formData.directors, DEFAULT_DIRECTOR];
    updateFormData({ ...formData, directors: newDirectors });
  };

  const updateDirector = (index, field, value) => {
    const newDirectors = [...formData.directors];
    newDirectors[index] = { ...newDirectors[index], [field]: value };
    
    // If position is changed from "Other" to something else, clear customPosition
    if (field === "position" && value !== "Other") {
      newDirectors[index].customPosition = "";
    }
    
    // If this director is linked to a shareholder, sync changes back
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
    const newDirectors = formData.directors.filter((_, i) => i !== index);
    
    // If this director is linked to a shareholder, unlink
    if (director.linkedShareholderId !== null) {
      const newShareholders = [...formData.shareholders];
      if (director.linkedShareholderId < newShareholders.length) {
        newShareholders[director.linkedShareholderId] = {
          ...newShareholders[director.linkedShareholderId],
          isAlsoDirector: false,
          directorId: null
        };
        updateFormData({ ...formData, directors: newDirectors, shareholders: newShareholders });
        return;
      }
    }
    
    updateFormData({ ...formData, directors: newDirectors });
  };

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    updateFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (name, files) => {
    updateFormData({ ...formData, [name]: files });
  };

  // Table column configurations
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
          <button
            type="button"
            onClick={addShareholder}
            className="flex items-center px-3 py-1 bg-brown-100 text-brown-700 rounded-md hover:bg-brown-200"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Shareholder
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-brown-200 rounded-lg">
            <thead>
              <tr className="bg-brown-50">
                {shareholderColumns.map((header, i) => (
                  <th
                    key={i}
                    className="px-4 py-2 text-left text-xs font-medium text-brown-700 uppercase tracking-wider border-b"
                    style={header.style}
                  >
                    {header.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {formData.shareholders?.map((shareholder, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-brown-50"}>
                  <td className="px-4 py-2 border-b">
                    <input
                      type="text"
                      value={shareholder.name || ""}
                      onChange={(e) => updateShareholder(index, "name", e.target.value)}
                      className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500"
                    />
                  </td>
                  <td className="px-4 py-2 border-b">
                    <select
                      value={shareholder.country || ""}
                      onChange={(e) => updateShareholder(index, "country", e.target.value)}
                      className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500"
                    >
                      <option value="">Select</option>
                      {africanCountries.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 border-b">
                    <input
                      type="text"
                      value={shareholder.linkedin || ""}
                      onChange={(e) => updateShareholder(index, "linkedin", e.target.value)}
                      className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500"
                    />
                  </td>
                  <td className="px-4 py-2 border-b">
                    <input
                      type="number"
                      value={shareholder.shareholding || ""}
                      onChange={(e) => updateShareholder(index, "shareholding", e.target.value)}
                      className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </td>
                  <td className="px-4 py-2 border-b">
                    <select
                      value={shareholder.race || ""}
                      onChange={(e) => updateShareholder(index, "race", e.target.value)}
                      className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500"
                    >
                      <option value="">Select</option>
                      {raceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 border-b">
                    <select
                      value={shareholder.gender || ""}
                      onChange={(e) => updateShareholder(index, "gender", e.target.value)}
                      className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500"
                    >
                      <option value="">Select</option>
                      {genderOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 border-b text-center">
                    <input
                      type="checkbox"
                      checked={shareholder.isYouth || false}
                      onChange={(e) => updateShareholder(index, "isYouth", e.target.checked)}
                      className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300 rounded"
                    />
                  </td>
                  <td className="px-4 py-2 border-b text-center">
                    <input
                      type="checkbox"
                      checked={shareholder.isDisabled || false}
                      onChange={(e) => updateShareholder(index, "isDisabled", e.target.checked)}
                      className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300 rounded"
                    />
                  </td>
                  <td className="px-4 py-2 border-b text-center">
                    <div className="flex flex-col items-center">
                      <input
                        type="checkbox"
                        checked={shareholder.isAlsoDirector || false}
                        onChange={(e) => updateShareholder(index, "isAlsoDirector", e.target.checked)}
                        className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300 rounded"
                      />
                      {shareholder.isAlsoDirector && (
                        <span className="text-xs text-green-600 mt-1">✓ Linked</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 border-b">
                    <button
                      type="button"
                      onClick={() => removeShareholder(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
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
            <p className="text-xs text-brown-500 mt-1">
              Directors automatically sync to Growth Suite "Board of Directors"
            </p>
          </div>
          <button
            type="button"
            onClick={addDirector}
            className="flex items-center px-3 py-1 bg-brown-100 text-brown-700 rounded-md hover:bg-brown-200"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Director
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-brown-200 rounded-lg">
            <thead>
              <tr className="bg-brown-50">
                {directorColumns.map((header, i) => (
                  <th
                    key={i}
                    className="px-4 py-2 text-left text-xs font-medium text-brown-700 uppercase tracking-wider border-b"
                    style={header.style}
                  >
                    {header.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {formData.directors?.map((director, index) => (
                <tr 
                  key={index} 
                  className={`${index % 2 === 0 ? "bg-white" : "bg-brown-50"} ${director.linkedShareholderId !== null ? "border-l-4 border-l-blue-400" : ""}`}
                >
                  <td className="px-4 py-2 border-b">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={director.name || ""}
                        onChange={(e) => updateDirector(index, "name", e.target.value)}
                        className="flex-1 px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500"
                        disabled={director.linkedShareholderId !== null}
                      />
                      {director.linkedShareholderId !== null && (
                        <span className="text-xs text-blue-600" title="Linked to shareholder">🔗</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 border-b">
                    <div className="space-y-1">
                      <select
                        value={director.position || ""}
                        onChange={(e) => updateDirector(index, "position", e.target.value)}
                        className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500"
                      >
                        <option value="">Select Position</option>
                        {positionOptions.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        ))}
                      </select>
                      {director.position === "Other" && (
                        <input
                          type="text"
                          placeholder="Specify position"
                          value={director.customPosition || ""}
                          onChange={(e) => updateDirector(index, "customPosition", e.target.value)}
                          className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500 text-sm"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 border-b">
                    <select
                      value={director.nationality || ""}
                      onChange={(e) => updateDirector(index, "nationality", e.target.value)}
                      className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500"
                      disabled={director.linkedShareholderId !== null}
                    >
                      <option value="">Select</option>
                      {africanCountries.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 border-b">
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="LinkedIn URL"
                        value={director.linkedin || ""}
                        onChange={(e) => updateDirector(index, "linkedin", e.target.value)}
                        className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500"
                        disabled={director.linkedShareholderId !== null}
                      />
                      
                      <div className="flex items-center space-x-2">
                        {director.cv ? (
                          <a
                            href={director.cv.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-brown-600 hover:text-brown-800 text-xs truncate"
                            title={`View ${director.cv.name}`}
                          >
                            CV: {director.cv.name}
                          </a>
                        ) : (
                          <span className="flex-1 text-xs text-gray-400">No CV uploaded</span>
                        )}
                        
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                handleDirectorCVUpload(index, file);
                              }
                            }}
                            className="hidden"
                          />
                          <span className="text-xs text-brown-600 hover:text-brown-800 underline">
                            {director.cv ? 'Replace' : 'Upload CV'}
                          </span>
                        </label>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 border-b">
                    <select
                      value={director.execType || ""}
                      onChange={(e) => updateDirector(index, "execType", e.target.value)}
                      className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500"
                    >
                      <option value="">Select</option>
                      {execOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 border-b">
                    <select
                      value={director.race || ""}
                      onChange={(e) => updateDirector(index, "race", e.target.value)}
                      className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500"
                      disabled={director.linkedShareholderId !== null}
                    >
                      <option value="">Select</option>
                      {raceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 border-b">
                    <select
                      value={director.gender || ""}
                      onChange={(e) => updateDirector(index, "gender", e.target.value)}
                      className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500"
                      disabled={director.linkedShareholderId !== null}
                    >
                      <option value="">Select</option>
                      {genderOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 border-b text-center">
                    <input
                      type="checkbox"
                      checked={director.isYouth || false}
                      onChange={(e) => updateDirector(index, "isYouth", e.target.checked)}
                      className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300 rounded"
                      disabled={director.linkedShareholderId !== null}
                    />
                  </td>
                  <td className="px-4 py-2 border-b text-center">
                    <input
                      type="checkbox"
                      checked={director.isDisabled || false}
                      onChange={(e) => updateDirector(index, "isDisabled", e.target.checked)}
                      className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300 rounded"
                      disabled={director.linkedShareholderId !== null}
                    />
                  </td>
                  <td className="px-4 py-2 border-b">
                    <button
                      type="button"
                      onClick={() => removeDirector(index)}
                      className="text-red-500 hover:text-red-700"
                      disabled={director.linkedShareholderId !== null}
                      title={director.linkedShareholderId !== null ? "Uncheck 'Also Director' in shareholder table to remove" : "Remove director"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}