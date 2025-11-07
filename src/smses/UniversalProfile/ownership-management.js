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
  cv: null,
};

export default function OwnershipManagement({ data = { shareholders: [], directors: [] }, updateData }) {
  const [formData, setFormData] = useState({ shareholders: [], directors: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Helper functions
  const updateFormData = (newData) => {
    setFormData(newData);
    updateData(newData);
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
    newShareholders[index] = { ...newShareholders[index], [field]: value };
    updateFormData({ ...formData, shareholders: newShareholders });
  };

  const removeShareholder = (index) => {
    const newShareholders = formData.shareholders.filter((_, i) => i !== index);
    updateFormData({ ...formData, shareholders: newShareholders });
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
    
    updateFormData({ ...formData, directors: newDirectors });
  };

  const removeDirector = (index) => {
    const newDirectors = formData.directors.filter((_, i) => i !== index);
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
    { label: "Name", style: { width: "30%", minWidth: "200px" } },
    { label: "Country", style: { width: "20%", minWidth: "150px" } },
    { label: "LinkedIn", style: { width: "35%", minWidth: "200px" } },
    { label: "%Shareholding", style: { width: "12%" } },
    { label: "Race", style: { width: "100px" } },
    { label: "Gender", style: { width: "10%" } },
    { label: "Is Youth?", style: { width: "80px" } },
    { label: "Is Disabled?", style: { width: "80px" } },
    { label: "Actions", style: { width: "60px" } },
  ];

  const directorColumns = [
    { label: "Name", style: { width: "25%", minWidth: "180px" } },
    { label: "Position", style: { width: "18%", minWidth: "130px" } },
    { label: "Nationality", style: { width: "12%" } },
    { label: "LinkedIn & CV", style: { width: "30%", minWidth: "200px" } },
    { label: "Exec/Non-Exec", style: { width: "90px" } },
    { label: "Race", style: { width: "8%" } },
    { label: "Gender", style: { width: "90px" } },
    { label: "Is Youth?", style: { width: "70px" } },
    { label: "Is Disabled?", style: { width: "70px" } },
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
          <h3 className="text-lg font-semibold text-brown-700">Directors Table</h3>
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
                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-brown-50"}>
                  <td className="px-4 py-2 border-b">
                    <input
                      type="text"
                      value={director.name || ""}
                      onChange={(e) => updateDirector(index, "name", e.target.value)}
                      className="w-full px-2 py-1 border border-brown-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brown-500"
                    />
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
                    />
                  </td>
                  <td className="px-4 py-2 border-b text-center">
                    <input
                      type="checkbox"
                      checked={director.isDisabled || false}
                      onChange={(e) => updateDirector(index, "isDisabled", e.target.checked)}
                      className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300 rounded"
                    />
                  </td>
                  <td className="px-4 py-2 border-b">
                    <button
                      type="button"
                      onClick={() => removeDirector(index)}
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
    </div>
  );
}