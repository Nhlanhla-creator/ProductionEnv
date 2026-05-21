"use client";

import { useState, useEffect } from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
  Info,
  ChevronDown,
  ChevronUp,
  Upload,
  X,
  TrendingUp,
  TrendingDown,
  Settings,
  Check,
} from "lucide-react";
import {
  DateRangePicker,
  EyeIcon,
  CalculationModal,
  KeyQuestionBox,
  TrendModal,
  SectionControlsBar,
  KpiGrid3,
  KpiGrid2,
} from "./financial/components/SharedComponents";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

// ==================== HELPER FUNCTIONS ====================

const getMonthsForYear = (year, financialYearStart = "Jan") => {
  const allMonths = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const startIndex = allMonths.indexOf(financialYearStart);
  if (startIndex === -1) return allMonths;
  return [...allMonths.slice(startIndex), ...allMonths.slice(0, startIndex)];
};

const formatNumber = (value) => {
  const num = Number.parseFloat(value) || 0;
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return num.toFixed(2);
};

const formatCurrency = (value) => {
  const num = Number.parseFloat(value) || 0;
  if (num >= 1e9) return `R${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `R${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `R${(num / 1e3).toFixed(2)}K`;
  return `R${num.toFixed(2)}`;
};

const formatPercentage = (value) => {
  const num = Number.parseFloat(value) || 0;
  return `${num.toFixed(1)}%`;
};

const getMonthIndex = (month) => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months.indexOf(month);
};

const getRangeMonths = (fromYM, toYM) => {
  const SHORTS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const result = [];
  let [y, m] = fromYM.split("-").map(Number);
  const [toY, toM] = toYM.split("-").map(Number);
  while (y < toY || (y === toY && m <= toM)) {
    result.push({ year: y, monthIdx: m - 1, label: `${SHORTS[m - 1]} ${y}` });
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return result;
};

const circleColors = [
  { border: "#FF8C00", background: "#FFB347", text: "#663d00" },
  { border: "#32CD32", background: "#90EE90", text: "#1e4d1e" },
  { border: "#FFA500", background: "#FFD700", text: "#664d00" },
  { border: "#228B22", background: "#98FB98", text: "#145214" },
  { border: "#FF6347", background: "#FFA07A", text: "#8b3a2b" },
  { border: "#2E8B57", background: "#66CDAA", text: "#1e4d33" },
  { border: "#FF8C69", background: "#FFB6C1", text: "#8b4d39" },
  { border: "#006400", background: "#ADFF2F", text: "#003300" },
];

// ==================== AVAILABLE FIELDS FOR TABLE (added signedDate) ====================

const AVAILABLE_FIELDS = [
  {
    id: "tier",
    label: "Tier Category",
    type: "dropdown",
    options: [
      "Core anchor",
      "Land & expand",
      "Flagship",
      "Coopetition",
      "Capital corridor",
      "Provincial Multiplier",
    ],
  },
  { id: "accountWebsite", label: "Account Website", type: "text" },
  {
    id: "targetCategory",
    label: "Target Category",
    type: "dropdown",
    options: ["Strategic", "Tactical", "Operational"],
  },
  {
    id: "sector",
    label: "Sector",
    type: "dropdown",
    options: [
      "Generalist",
      "Agriculture",
      "Automotive",
      "Banking, Finance & Insurance",
      "Beauty / Cosmetics / Personal Care",
      "Construction",
      "Consulting",
      "Creative Arts / Design",
      "Customer Service",
      "Education & Training",
      "Engineering",
      "Environmental / Natural Sciences",
      "Government / Public Sector",
      "Healthcare / Medical",
      "Hospitality / Tourism",
      "Human Resources",
      "Information Technology (IT)",
      "Infrastructure",
      "Legal / Law",
      "Logistics / Supply Chain",
      "Manufacturing",
      "Marketing / Advertising / PR",
      "Media / Journalism / Broadcasting",
      "Mining",
      "Energy",
      "Oil & Gas",
      "Non-Profit / NGO",
      "Property / Real Estate",
      "Retail / Wholesale",
      "Safety & Security / Police / Defence",
      "Sales",
      "Science & Research",
      "Social Services / Social Work",
      "Sports / Recreation / Fitness",
      "Telecommunications",
      "Transport",
      "Utilities (Water, Electricity, Waste)",
      "Industry multiplier",
      "Provincial multiplier",
    ],
  },
  {
    id: "publicPrivate",
    label: "Public / Private",
    type: "dropdown",
    options: ["Public", "Private"],
  },
  {
    id: "channel",
    label: "Channel",
    type: "dropdown",
    options: ["Direct", "Partner", "Reseller", "Online", "Referral"],
  },
  { id: "bigHook", label: "BIG Hook", type: "text" },
  { id: "revPotential", label: "Rev potential", type: "currency" },
  { id: "fyEnd", label: "FY End", type: "text" },
  {
    id: "strategicSignal",
    label: "Strategic Signal",
    type: "dropdown",
    options: ["High", "Medium", "Low"],
  },
  {
    id: "targetModel",
    label: "Target Model",
    type: "dropdown",
    options: ["ICP", "Lookalike", "Niche", "Mass Market"],
  },
  { id: "compliance", label: "Compliance", type: "boolean" },
  {
    id: "esd",
    label: "ESD (incl compliance, intelligence)",
    type: "boolean",
  },
  {
    id: "prevettedSupplyChain",
    label: "Prevetted Supply Chain Pipeline",
    type: "boolean",
  },
  {
    id: "prevettedFunding",
    label: "Prevetted Funding Pipeline",
    type: "boolean",
  },
  {
    id: "postInvestmentSupport",
    label: "Post-Investment Support (Growth Suite)",
    type: "boolean",
  },
  {
    id: "portfolioIntelligence",
    label: "Portfolio Intelligence",
    type: "boolean",
  },
  {
    id: "marketIntelligence",
    label: "Market Intelligence",
    type: "boolean",
  },
  { id: "internSponsorship", label: "InTern Sponsorship", type: "boolean" },
  { id: "likelyBuyer", label: "Likely Buyer", type: "text" },
  {
    id: "keyContact",
    label: "Key Contact (Name & Surname)",
    type: "text",
  },
  {
    id: "keyContactRole",
    label: "Key Contact Role & Department",
    type: "text",
  },
  { id: "keyContactEmail", label: "Key Contact email", type: "text" },
  { id: "keyContactPhone", label: "Key Contact Phone", type: "text" },
  { id: "warmIntroPath", label: "Warm Intro Path", type: "text" },
  { id: "lastEngagement", label: "Last Engagement", type: "date" },
  { id: "probability", label: "Probability %", type: "number" },
  { id: "nextCta", label: "Next CTA", type: "text" },
  { id: "byWhom", label: "By Whom", type: "text" },
  { id: "byWhen", label: "By When", type: "date" },
  { id: "notes", label: "Notes", type: "text" },
  { id: "signedDate", label: "Signed Date", type: "date" }, // ADDED for sales velocity
];

const DEFAULT_VISIBLE_FIELDS = [
  "tier",
  "accountWebsite",
  "sector",
  "revPotential",
  "probability",
  "nextCta",
  "byWhen",
];

// ==================== COLUMN SELECTOR MODAL ====================

const ColumnSelector = ({ isOpen, onClose, visibleFields, onToggleField }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]">
      <div className="bg-[#fdfcfb] p-5 rounded-lg max-w-[600px] w-[90%] max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-mediumBrown text-lg font-semibold">
            Select Columns to Display
          </h3>
          <button
            onClick={onClose}
            className="text-mediumBrown hover:text-warmBrown"
          >
            <X size={20} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {AVAILABLE_FIELDS.map((field) => (
            <label
              key={field.id}
              className="flex items-center gap-2 text-sm text-mediumBrown cursor-pointer"
            >
              <input
                type="checkbox"
                checked={visibleFields.includes(field.id)}
                onChange={() => onToggleField(field.id)}
                className="w-4 h-4 rounded border-[#e8ddd4] accent-mediumBrown"
              />
              {field.label}
            </label>
          ))}
        </div>
        <div className="flex justify-end mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-mediumBrown text-white rounded-md text-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== CELL RENDERERS ====================

const BooleanCell = ({ value, onChange, isEditing }) => {
  if (isEditing) {
    return (
      <select
        value={value ? "yes" : "no"}
        onChange={(e) => onChange(e.target.value === "yes")}
        className="w-full p-1 rounded border border-[#e8ddd4] text-sm bg-white"
      >
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    );
  }
  return (
    <span
      className={`text-sm font-medium ${
        value ? "text-green-600" : "text-red-500"
      }`}
    >
      {value ? "✓ Yes" : "✗ No"}
    </span>
  );
};

const DropdownCell = ({ value, options, onChange, isEditing }) => {
  if (isEditing) {
    return (
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-1 rounded border border-[#e8ddd4] text-sm bg-white"
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }
  return <span className="text-sm text-mediumBrown">{value || "-"}</span>;
};

const TextCell = ({ value, onChange, isEditing, type }) => {
  if (isEditing) {
    if (type === "currency") {
      return (
        <input
          type="number"
          step="0.01"
          value={value || ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full p-1 rounded border border-[#e8ddd4] text-sm"
        />
      );
    }
    if (type === "number") {
      return (
        <input
          type="number"
          step="1"
          value={value || ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full p-1 rounded border border-[#e8ddd4] text-sm"
        />
      );
    }
    if (type === "date") {
      return (
        <input
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-1 rounded border border-[#e8ddd4] text-sm"
        />
      );
    }
    return (
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-1 rounded border border-[#e8ddd4] text-sm"
      />
    );
  }
  if (type === "currency") {
    return (
      <span className="text-sm text-mediumBrown">
        {formatCurrency(value)}
      </span>
    );
  }
  return <span className="text-sm text-mediumBrown">{value || "-"}</span>;
};

// ==================== PIPELINE TABLE COMPONENT ====================

const PipelineTable = ({ currentUser, isInvestorView, onDataChange }) => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [visibleFields, setVisibleFields] = useState(DEFAULT_VISIBLE_FIELDS);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [filters, setFilters] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const loadRecords = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const recordsRef = collection(
        db,
        "users",
        currentUser.uid,
        "pipelineRecords",
      );
      const querySnapshot = await getDocs(recordsRef);
      const recordsData = [];
      querySnapshot.forEach((doc) => {
        recordsData.push({ id: doc.id, ...doc.data() });
      });
      setRecords(recordsData);
      setFilteredRecords(recordsData);
      if (onDataChange) onDataChange(recordsData);
    } catch (error) {
      console.error("Error loading records:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) loadRecords();
  }, [currentUser]);

  useEffect(() => {
    let filtered = [...records];
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim() !== "") {
        filtered = filtered.filter((record) => {
          const recordValue = record[key];
          if (recordValue === undefined || recordValue === null) return false;
          return recordValue
            .toString()
            .toLowerCase()
            .includes(value.toLowerCase());
        });
      }
    });
    setFilteredRecords(filtered);
  }, [filters, records]);

  const handleAddRecord = async () => {
    if (!currentUser) return;
    const newRecord = {};
    AVAILABLE_FIELDS.forEach((field) => {
      if (field.type === "boolean") newRecord[field.id] = false;
      else if (field.type === "currency" || field.type === "number")
        newRecord[field.id] = 0;
      else newRecord[field.id] = "";
    });
    newRecord.createdAt = new Date().toISOString();
    try {
      const recordsRef = collection(
        db,
        "users",
        currentUser.uid,
        "pipelineRecords",
      );
      const docRef = await addDoc(recordsRef, newRecord);
      const updated = [{ id: docRef.id, ...newRecord }, ...records];
      setRecords(updated);
      if (onDataChange) onDataChange(updated);
      setEditingId(docRef.id);
      setEditData({ ...newRecord });
    } catch (error) {
      console.error("Error adding record:", error);
      alert("Failed to add record");
    }
  };

  const handleSaveEdit = async () => {
    if (!currentUser || !editingId) return;
    try {
      const recordRef = doc(
        db,
        "users",
        currentUser.uid,
        "pipelineRecords",
        editingId,
      );
      await updateDoc(recordRef, editData);
      const updated = records.map((r) =>
        r.id === editingId ? { ...r, ...editData } : r,
      );
      setRecords(updated);
      if (onDataChange) onDataChange(updated);
      setEditingId(null);
      setEditData({});
    } catch (error) {
      console.error("Error saving record:", error);
      alert("Failed to save changes");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDeleteRecord = async (id) => {
    if (!currentUser) return;
    try {
      const recordRef = doc(
        db,
        "users",
        currentUser.uid,
        "pipelineRecords",
        id,
      );
      await deleteDoc(recordRef);
      const updated = records.filter((r) => r.id !== id);
      setRecords(updated);
      if (onDataChange) onDataChange(updated);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("Failed to delete record");
    }
  };

  const handleEditChange = (fieldId, value) => {
    setEditData({ ...editData, [fieldId]: value });
  };

  const toggleField = (fieldId) => {
    if (visibleFields.includes(fieldId)) {
      setVisibleFields(visibleFields.filter((f) => f !== fieldId));
    } else {
      setVisibleFields([...visibleFields, fieldId]);
    }
  };

  const clearFilters = () => setFilters({});

  const getFieldConfig = (fieldId) =>
    AVAILABLE_FIELDS.find((f) => f.id === fieldId);

  const renderCell = (record, fieldId, isEditing) => {
    const fieldConfig = getFieldConfig(fieldId);
    if (!fieldConfig) return null;
    const value = isEditing ? editData[fieldId] : record[fieldId];
    if (fieldConfig.type === "boolean") {
      return (
        <BooleanCell
          value={value}
          onChange={(newVal) => handleEditChange(fieldId, newVal)}
          isEditing={isEditing}
        />
      );
    }
    if (fieldConfig.type === "dropdown") {
      return (
        <DropdownCell
          value={value}
          options={fieldConfig.options}
          onChange={(newVal) => handleEditChange(fieldId, newVal)}
          isEditing={isEditing}
        />
      );
    }
    return (
      <TextCell
        value={value}
        onChange={(newVal) => handleEditChange(fieldId, newVal)}
        isEditing={isEditing}
        type={fieldConfig.type}
      />
    );
  };

  return (
    <div className="mt-5">
      <ColumnSelector
        isOpen={showColumnSelector}
        onClose={() => setShowColumnSelector(false)}
        visibleFields={visibleFields}
        onToggleField={toggleField}
      />
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]">
          <div className="bg-[#fdfcfb] p-5 rounded-lg max-w-[400px] w-[90%]">
            <h3 className="text-mediumBrown text-lg mb-3">Confirm Delete</h3>
            <p className="text-mediumBrown mb-5">
              Are you sure you want to delete this record? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-[#e8ddd4] text-mediumBrown rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteRecord(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div className="flex gap-2">
          {!isInvestorView && (
            <button
              onClick={handleAddRecord}
              className="px-4 py-2 bg-mediumBrown text-white rounded-md text-sm font-semibold hover:bg-warmBrown transition"
            >
              + Add Record
            </button>
          )}
          <button
            onClick={() => setShowColumnSelector(true)}
            className="px-4 py-2 bg-[#e8ddd4] text-mediumBrown rounded-md text-sm font-semibold flex items-center gap-2 hover:bg-[#d4c4b8] transition"
          >
            <Settings size={16} /> Columns
          </button>
        </div>
      </div>
      <div className="bg-[#f5f0eb] p-3 rounded-lg mb-4 border border-[#e8ddd4] overflow-x-auto">
        <div className="flex gap-3 items-center flex-nowrap min-w-max">
          {visibleFields.map((fieldId) => {
            const fieldConfig = getFieldConfig(fieldId);
            if (!fieldConfig) return null;
            return (
              <div
                key={`filter-${fieldId}`}
                className="flex-shrink-0 min-w-[120px]"
              >
                <input
                  type="text"
                  placeholder={`Filter ${fieldConfig.label}`}
                  value={filters[fieldId] || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, [fieldId]: e.target.value })
                  }
                  className="w-full p-1.5 rounded border border-[#e8ddd4] text-xs bg-white"
                />
              </div>
            );
          })}
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 bg-mediumBrown text-white rounded-md text-xs font-semibold whitespace-nowrap"
          >
            Clear Filters
          </button>
        </div>
      </div>
      <div className="overflow-x-auto bg-[#fdfcfb] rounded-lg border border-[#e8ddd4]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-mediumBrown text-white">
              {visibleFields.map((fieldId) => {
                const fieldConfig = getFieldConfig(fieldId);
                return (
                  <th
                    key={fieldId}
                    className="p-3 text-left text-sm font-semibold whitespace-nowrap"
                  >
                    {fieldConfig?.label || fieldId}
                  </th>
                );
              })}
              {!isInvestorView && (
                <th className="p-3 text-center text-sm font-semibold whitespace-nowrap">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    visibleFields.length + (isInvestorView ? 0 : 1)
                  }
                  className="p-8 text-center text-lightBrown"
                >
                  {loading
                    ? "Loading..."
                    : "No records found. Click 'Add Record' to get started."}
                </td>
              </tr>
            ) : (
              filteredRecords.map((record, idx) => (
                <tr
                  key={record.id}
                  className={`border-b border-[#e8ddd4] ${
                    idx % 2 === 0 ? "bg-white" : "bg-[#faf8f5]"
                  }`}
                >
                  {visibleFields.map((fieldId) => (
                    <td key={fieldId} className="p-2.5 align-middle">
                      {renderCell(record, fieldId, editingId === record.id)}
                    </td>
                  ))}
                  {!isInvestorView && (
                    <td className="p-2.5 text-center whitespace-nowrap">
                      {editingId === record.id ? (
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={handleSaveEdit}
                            className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                            title="Save"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => {
                              setEditingId(record.id);
                              setEditData({ ...record });
                            }}
                            className="p-1 bg-mediumBrown text-white rounded hover:bg-warmBrown"
                            title="Edit"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M17 3l4 4-7 7H10v-4l7-7z" />
                              <path d="M4 20h16" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(record.id)}
                            className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                            title="Delete"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13" />
                              <path d="M9 4h6a1 1 0 0 1 1 1v2H8V5a1 1 0 0 1 1-1z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 bg-[#f5f0eb] p-3 rounded-lg text-sm text-mediumBrown">
        Showing {filteredRecords.length} of {records.length} records
      </div>
    </div>
  );
};

// ==================== UNIVERSAL ADD DATA MODAL (two tabs) ====================

const UniversalAddDataModal = ({
  isOpen,
  onClose,
  currentTab,
  user,
  onSave,
  loading,
  fromDate,
  toDate,
}) => {
  const [activeTab, setActiveTab] = useState(currentTab);
  const MONTH_NAMES = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const rangeMonths =
    fromDate && toDate ? getRangeMonths(fromDate, toDate) : null;
  const rangeYears = rangeMonths
    ? [...new Set(rangeMonths.map((r) => r.year))]
    : [
        toDate
          ? parseInt(toDate.split("-")[0])
          : new Date().getFullYear(),
      ];

  const [selectedYear, setSelectedYear] = useState(
    rangeYears[rangeYears.length - 1],
  );

  useEffect(() => {
    setSelectedYear(rangeYears[rangeYears.length - 1]);
  }, [fromDate, toDate]);

  const tabs = [
    { id: "revenue-concentration", label: "Revenue Concentration" },
    { id: "demand-sustainability", label: "Demand Sustainability" },
  ];

  const [revenueConcentrationData, setRevenueConcentrationData] = useState({
    revenueChannels: [
      { name: "Social Media", revenue: "", spend: "" },
      { name: "Email", revenue: "", spend: "" },
      { name: "PPC", revenue: "", spend: "" },
      { name: "SEO", revenue: "", spend: "" },
      { name: "Referral", revenue: "", spend: "" },
      { name: "Direct", revenue: "", spend: "" },
    ],
    customerSegments: [
      { name: "Enterprise", revenue: "", customerCount: "" },
      { name: "SMB", revenue: "", customerCount: "" },
      { name: "Startup", revenue: "", customerCount: "" },
      { name: "Non-Profit", revenue: "", customerCount: "" },
      { name: "Education", revenue: "", customerCount: "" },
    ],
    revenueByCustomer: [
      { name: "", revenue: "" },
      { name: "", revenue: "" },
      { name: "", revenue: "" },
      { name: "", revenue: "" },
      { name: "", revenue: "" },
    ],
    notes: "",
  });

  const [demandSustainabilityData, setDemandSustainabilityData] = useState({
    repeatCustomerRate: "",
    churnRate: "",
    campaigns: [
      { name: "Q1 Campaign", cost: "", revenue: "" },
      { name: "Q2 Campaign", cost: "", revenue: "" },
      { name: "Summer Sale", cost: "", revenue: "" },
      { name: "Holiday Campaign", cost: "", revenue: "" },
    ],
    notes: "",
  });

  useEffect(() => {
    if (isOpen && user) loadDataForTab(activeTab);
  }, [isOpen, activeTab, user, selectedYear]);

  const loadDataForTab = async (tabId) => {
    try {
      switch (tabId) {
        case "revenue-concentration":
          const concDoc = await getDoc(
            doc(
              db,
              "pipelineData",
              `${user.uid}_concentration_${selectedYear}`,
            ),
          );
          if (concDoc.exists()) {
            const d = concDoc.data();
            setRevenueConcentrationData({
              revenueChannels:
                d.revenueChannels ||
                revenueConcentrationData.revenueChannels,
              customerSegments:
                d.customerSegments ||
                revenueConcentrationData.customerSegments,
              revenueByCustomer:
                d.revenueByCustomer ||
                revenueConcentrationData.revenueByCustomer,
              notes: d.notes || "",
            });
          }
          break;
        case "demand-sustainability":
          const sustDoc = await getDoc(
            doc(
              db,
              "pipelineData",
              `${user.uid}_sustainability_${selectedYear}`,
            ),
          );
          if (sustDoc.exists()) {
            const d = sustDoc.data();
            setDemandSustainabilityData({
              repeatCustomerRate:
                d.repeatCustomerRate?.toString() || "",
              churnRate: d.churnRate?.toString() || "",
              campaigns: d.campaigns || demandSustainabilityData.campaigns,
              notes: d.notes || "",
            });
          }
          break;
      }
    } catch (error) {
      console.error(`Error loading data for ${tabId}:`, error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please log in to save data");
      return;
    }
    try {
      switch (activeTab) {
        case "revenue-concentration":
          const validCustomers = revenueConcentrationData.revenueByCustomer.filter(
            (c) => c.name.trim() !== "" || parseFloat(c.revenue) > 0,
          );
          await setDoc(
            doc(
              db,
              "pipelineData",
              `${user.uid}_concentration_${selectedYear}`,
            ),
            {
              userId: user.uid,
              year: selectedYear,
              revenueChannels: revenueConcentrationData.revenueChannels.map(
                (c) => ({
                  name: c.name,
                  revenue: Number.parseFloat(c.revenue) || 0,
                  spend: Number.parseFloat(c.spend) || 0,
                }),
              ),
              customerSegments: revenueConcentrationData.customerSegments.map(
                (s) => ({
                  name: s.name,
                  revenue: Number.parseFloat(s.revenue) || 0,
                  customerCount:
                    Number.parseFloat(s.customerCount) || 0,
                }),
              ),
              revenueByCustomer: validCustomers.map((c) => ({
                name: c.name,
                revenue: Number.parseFloat(c.revenue) || 0,
              })),
              notes: revenueConcentrationData.notes,
              lastUpdated: new Date().toISOString(),
            },
          );
          break;
        case "demand-sustainability":
          await setDoc(
            doc(
              db,
              "pipelineData",
              `${user.uid}_sustainability_${selectedYear}`,
            ),
            {
              userId: user.uid,
              year: selectedYear,
              repeatCustomerRate:
                Number.parseFloat(
                  demandSustainabilityData.repeatCustomerRate,
                ) || 0,
              churnRate:
                Number.parseFloat(demandSustainabilityData.churnRate) ||
                0,
              campaigns: demandSustainabilityData.campaigns.map((c) => ({
                name: c.name,
                cost: Number.parseFloat(c.cost) || 0,
                revenue: Number.parseFloat(c.revenue) || 0,
              })),
              notes: demandSustainabilityData.notes,
              lastUpdated: new Date().toISOString(),
            },
          );
          break;
      }
      if (onSave) onSave();
      alert("Data saved successfully!");
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Error saving data. Please try again.");
    }
  };

  const inputCls = "w-full p-2 rounded border border-[#e8ddd4] text-sm";
  const labelCls = "text-xs text-mediumBrown font-semibold";

  const updateCustomer = (index, field, value) => {
    const newList = [...revenueConcentrationData.revenueByCustomer];
    newList[index] = { ...newList[index], [field]: value };
    setRevenueConcentrationData({
      ...revenueConcentrationData,
      revenueByCustomer: newList,
    });
  };

  const addCustomerRow = () => {
    setRevenueConcentrationData((prev) => ({
      ...prev,
      revenueByCustomer: [
        ...prev.revenueByCustomer,
        { name: "", revenue: "" },
      ],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]">
      <div className="bg-[#fdfcfb] p-5 rounded-lg max-w-[1400px] max-h-[90vh] overflow-auto w-[95%]">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-mediumBrown m-0">
            Add Marketing & Sales Data
          </h3>
          <button
            onClick={onClose}
            className="bg-transparent border-0 text-2xl text-mediumBrown cursor-pointer p-0 leading-none"
          >
            ×
          </button>
        </div>
        <div className="flex gap-1 mb-5 flex-wrap border-b-2 border-[#e8ddd4] pb-2.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 border-0 rounded-t-md cursor-pointer font-semibold text-sm transition-all duration-300 -mb-0.5 ${
                activeTab === tab.id
                  ? "bg-mediumBrown text-[#fdfcfb] border-b-2 border-mediumBrown"
                  : "bg-[#e8ddd4] text-mediumBrown border-b-2 border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {rangeYears.length > 1 && (
          <div className="flex gap-2 mb-5 flex-wrap items-center">
            <span className="text-mediumBrown text-sm font-semibold mr-1">
              Year:
            </span>
            {rangeYears.map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-4 py-1.5 border-0 rounded-md cursor-pointer font-semibold text-sm ${
                  selectedYear === yr
                    ? "bg-mediumBrown text-[#fdfcfb]"
                    : "bg-[#e8ddd4] text-mediumBrown hover:bg-[#d4c4b8]"
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        )}

        {activeTab === "revenue-concentration" && (
          <div>
            <h4 className="text-mediumBrown mb-5">
              Revenue Concentration Data
            </h4>
            <h5 className="text-mediumBrown mb-3 font-semibold">
              Revenue by Channel
            </h5>
            {revenueConcentrationData.revenueChannels.map(
              (channel, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[2fr_1fr_1fr] gap-2.5 mb-2.5"
                >
                  <input
                    type="text"
                    value={channel.name}
                    onChange={(e) => {
                      const n = [
                        ...revenueConcentrationData.revenueChannels,
                      ];
                      n[index].name = e.target.value;
                      setRevenueConcentrationData({
                        ...revenueConcentrationData,
                        revenueChannels: n,
                      });
                    }}
                    className="p-2 rounded border border-[#e8ddd4]"
                  />
                  <input
                    type="number"
                    value={channel.revenue}
                    onChange={(e) => {
                      const n = [
                        ...revenueConcentrationData.revenueChannels,
                      ];
                      n[index].revenue = e.target.value;
                      setRevenueConcentrationData({
                        ...revenueConcentrationData,
                        revenueChannels: n,
                      });
                    }}
                    placeholder="Revenue (R)"
                    className="p-2 rounded border border-[#e8ddd4]"
                  />
                  <input
                    type="number"
                    value={channel.spend}
                    onChange={(e) => {
                      const n = [
                        ...revenueConcentrationData.revenueChannels,
                      ];
                      n[index].spend = e.target.value;
                      setRevenueConcentrationData({
                        ...revenueConcentrationData,
                        revenueChannels: n,
                      });
                    }}
                    placeholder="Marketing Spend (R)"
                    className="p-2 rounded border border-[#e8ddd4]"
                  />
                </div>
              ),
            )}
            <h5 className="text-mediumBrown mt-7 mb-3 font-semibold">
              Customer Segments
            </h5>
            {revenueConcentrationData.customerSegments.map(
              (segment, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[2fr_1fr_1fr] gap-2.5 mb-2.5"
                >
                  <input
                    type="text"
                    value={segment.name}
                    onChange={(e) => {
                      const n = [
                        ...revenueConcentrationData.customerSegments,
                      ];
                      n[index].name = e.target.value;
                      setRevenueConcentrationData({
                        ...revenueConcentrationData,
                        customerSegments: n,
                      });
                    }}
                    className="p-2 rounded border border-[#e8ddd4]"
                  />
                  <input
                    type="number"
                    value={segment.revenue}
                    onChange={(e) => {
                      const n = [
                        ...revenueConcentrationData.customerSegments,
                      ];
                      n[index].revenue = e.target.value;
                      setRevenueConcentrationData({
                        ...revenueConcentrationData,
                        customerSegments: n,
                      });
                    }}
                    placeholder="Revenue (R)"
                    className="p-2 rounded border border-[#e8ddd4]"
                  />
                  <input
                    type="number"
                    value={segment.customerCount}
                    onChange={(e) => {
                      const n = [
                        ...revenueConcentrationData.customerSegments,
                      ];
                      n[index].customerCount = e.target.value;
                      setRevenueConcentrationData({
                        ...revenueConcentrationData,
                        customerSegments: n,
                      });
                    }}
                    placeholder="# Customers"
                    className="p-2 rounded border border-[#e8ddd4]"
                  />
                </div>
              ),
            )}
            <h5 className="text-mediumBrown mt-7 mb-3 font-semibold">
              Revenue by Customer
            </h5>
            {revenueConcentrationData.revenueByCustomer.map(
              (cust, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_1fr] gap-2.5 mb-2.5"
                >
                  <input
                    type="text"
                    value={cust.name}
                    onChange={(e) =>
                      updateCustomer(index, "name", e.target.value)
                    }
                    placeholder="Customer name"
                    className="p-2 rounded border border-[#e8ddd4]"
                  />
                  <input
                    type="number"
                    value={cust.revenue}
                    onChange={(e) =>
                      updateCustomer(index, "revenue", e.target.value)
                    }
                    placeholder="Revenue (R)"
                    className="p-2 rounded border border-[#e8ddd4]"
                  />
                </div>
              ),
            )}
            <button
              type="button"
              onClick={addCustomerRow}
              className="mt-2 px-3 py-1.5 bg-[#e8ddd4] text-mediumBrown rounded text-sm"
            >
              + Add another customer
            </button>
            <div className="mb-5 mt-7">
              <label className="block mb-2.5 text-mediumBrown font-semibold">
                Notes:
              </label>
              <textarea
                value={revenueConcentrationData.notes}
                onChange={(e) =>
                  setRevenueConcentrationData({
                    ...revenueConcentrationData,
                    notes: e.target.value,
                  })
                }
                placeholder="Add any additional notes..."
                className="w-full p-2.5 rounded border border-[#e8ddd4] min-h-[80px] text-[13px]"
              />
            </div>
          </div>
        )}

        {activeTab === "demand-sustainability" && (
          <div>
            <h4 className="text-mediumBrown mb-5">
              Demand Sustainability Data
            </h4>
            <div className="grid grid-cols-2 gap-[15px] mb-7">
              <div>
                <label className={labelCls}>Repeat Customer Rate (%)</label>
                <input
                  type="number"
                  value={demandSustainabilityData.repeatCustomerRate}
                  onChange={(e) =>
                    setDemandSustainabilityData({
                      ...demandSustainabilityData,
                      repeatCustomerRate: e.target.value,
                    })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Churn Rate (%)</label>
                <input
                  type="number"
                  value={demandSustainabilityData.churnRate}
                  onChange={(e) =>
                    setDemandSustainabilityData({
                      ...demandSustainabilityData,
                      churnRate: e.target.value,
                    })
                  }
                  className={inputCls}
                />
              </div>
            </div>
            <h5 className="text-mediumBrown mb-3 font-semibold">
              Campaigns
            </h5>
            {demandSustainabilityData.campaigns.map((campaign, index) => (
              <div
                key={index}
                className="grid grid-cols-[2fr_1fr_1fr] gap-2.5 mb-2.5"
              >
                <input
                  type="text"
                  value={campaign.name}
                  onChange={(e) => {
                    const n = [...demandSustainabilityData.campaigns];
                    n[index].name = e.target.value;
                    setDemandSustainabilityData({
                      ...demandSustainabilityData,
                      campaigns: n,
                    });
                  }}
                  className="p-2 rounded border border-[#e8ddd4]"
                />
                <input
                  type="number"
                  value={campaign.cost}
                  onChange={(e) => {
                    const n = [...demandSustainabilityData.campaigns];
                    n[index].cost = e.target.value;
                    setDemandSustainabilityData({
                      ...demandSustainabilityData,
                      campaigns: n,
                    });
                  }}
                  placeholder="Cost (R)"
                  className="p-2 rounded border border-[#e8ddd4]"
                />
                <input
                  type="number"
                  value={campaign.revenue}
                  onChange={(e) => {
                    const n = [...demandSustainabilityData.campaigns];
                    n[index].revenue = e.target.value;
                    setDemandSustainabilityData({
                      ...demandSustainabilityData,
                      campaigns: n,
                    });
                  }}
                  placeholder="Revenue (R)"
                  className="p-2 rounded border border-[#e8ddd4]"
                />
              </div>
            ))}
            <div className="mb-5">
              <label className="block mb-2.5 text-mediumBrown font-semibold">
                Notes:
              </label>
              <textarea
                value={demandSustainabilityData.notes}
                onChange={(e) =>
                  setDemandSustainabilityData({
                    ...demandSustainabilityData,
                    notes: e.target.value,
                  })
                }
                placeholder="Add any additional notes..."
                className="w-full p-2.5 rounded border border-[#e8ddd4] min-h-[80px] text-[13px]"
              />
            </div>
          </div>
        )}

        <div className="flex gap-2.5 justify-end mt-5">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#e8ddd4] text-mediumBrown border-0 rounded-md cursor-pointer font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-5 py-2.5 bg-mediumBrown text-[#fdfcfb] border-0 rounded-md font-semibold ${
              loading ? "opacity-70 cursor-wait" : "cursor-pointer"
            }`}
          >
            {loading ? "Saving..." : "Save Data"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== KPI CARD ====================

const KPITripleCard = ({
  title,
  actualValue,
  budgetValue,
  unit = "number",
  isPercentage = false,
  goodDirection = "up",
  onEyeClick,
  onAddNotes,
  onTrend,
  notes,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const variance = actualValue - budgetValue;
  const variancePercent =
    budgetValue !== 0 ? (variance / Math.abs(budgetValue)) * 100 : 0;

  const getCurrencyScale = (val) => {
    const n = Math.abs(Number.parseFloat(val) || 0);
    if (n >= 1e9) return { label: "R b", divisor: 1e9 };
    if (n >= 1e6) return { label: "R m", divisor: 1e6 };
    if (n >= 1e3) return { label: "R k", divisor: 1e3 };
    return { label: "R", divisor: 1 };
  };
  const currencyScale = getCurrencyScale(
    Math.max(Math.abs(actualValue), Math.abs(budgetValue)),
  );

  const unitLabel =
    unit === "currency"
      ? currencyScale.label
      : unit === "days"
        ? "days"
        : unit === "percentage" || isPercentage
          ? "%"
          : null;

  const formatValue = (val) => {
    const n = Number.parseFloat(val) || 0;
    if (unit === "currency") return (n / currencyScale.divisor).toFixed(2);
    if (unit === "days") return n.toFixed(0);
    if (unit === "percentage" || isPercentage) return n.toFixed(1);
    return formatNumber(n);
  };

  return (
    <div className="bg-[#fdfcfb] p-5 rounded-lg shadow-md mb-5 border border-[#e8ddd4] relative">
      <div
        onClick={onEyeClick}
        className="absolute top-3 right-3 cursor-pointer w-8 h-8 flex items-center justify-center rounded-full bg-[#fdfcfb] shadow border-2 border-[#FF8C00] z-10 hover:bg-[#e8ddd4] hover:scale-110 transition"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FF8C00"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="12" r="5" strokeOpacity="0.5" />
          <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z" />
        </svg>
      </div>
      <h4 className="text-[#5d4037] mb-5 text-center font-semibold text-base">
        {title}
        {unitLabel && ` (${unitLabel})`}
      </h4>
      <div className="flex justify-around items-center mb-5">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full border-4 border-[#FF8C00] flex items-center justify-center mx-auto mb-2 bg-[#FFB347]">
            <span className="text-sm font-bold text-[#663d00]">
              {formatValue(actualValue)}
            </span>
          </div>
          <span className="text-[11px] text-[#5d4037] font-medium">
            Actual
          </span>
        </div>
        <div className="text-center">
          <div className="w-20 h-20 rounded-full border-4 border-[#32CD32] flex items-center justify-center mx-auto mb-2 bg-[#90EE90]">
            <span className="text-sm font-bold text-[#1e4d1e]">
              {formatValue(budgetValue)}
            </span>
          </div>
          <span className="text-[11px] text-[#5d4037] font-medium">
            Budget
          </span>
        </div>
        <div className="text-center">
          <div className="w-20 h-20 rounded-full border-4 border-[#FFA500] flex items-center justify-center mx-auto mb-2 bg-[#FFD700]">
            <div className="flex items-center gap-1">
              {variancePercent > 0 ? (
                <TrendingUp
                  size={16}
                  color={goodDirection === "up" ? "#16a34a" : "#dc2626"}
                />
              ) : (
                <TrendingDown
                  size={16}
                  color={goodDirection === "down" ? "#16a34a" : "#dc2626"}
                />
              )}
              <span
                className={`text-xs font-semibold ${
                  (goodDirection === "up" && variancePercent > 0) ||
                  (goodDirection === "down" && variancePercent < 0)
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {Math.abs(variancePercent).toFixed(1)}%
              </span>
            </div>
          </div>
          <span className="text-[11px] text-[#5d4037] font-medium">
            Variance
          </span>
        </div>
      </div>
      <div className="border-t border-[#e8ddd4] pt-4">
        <div className="flex gap-2 justify-center mb-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-1.5 bg-[#e8ddd4] text-[#5d4037] rounded font-semibold text-xs"
          >
            Add notes
          </button>
          <button
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="px-3 py-1.5 bg-[#e8ddd4] text-[#5d4037] rounded font-semibold text-xs"
          >
            AI analysis
          </button>
          <button
            onClick={onTrend}
            className="px-3 py-1.5 bg-[#e8ddd4] text-[#5d4037] rounded font-semibold text-xs"
          >
            View trend
          </button>
        </div>
        {expanded && (
          <div className="mb-2">
            <label className="text-xs text-[#5d4037] font-semibold block mb-1">
              Notes / Comments:
            </label>
            <textarea
              value={notes || ""}
              onChange={(e) => onAddNotes(e.target.value)}
              placeholder="Add notes or comments..."
              className="w-full p-2 rounded border border-[#e8ddd4] min-h-[60px] text-sm"
            />
          </div>
        )}
        {showAnalysis && (
          <div className="mt-2 p-3 bg-[#faf8f5] rounded border border-[#e8ddd4] text-xs text-[#5d4037]">
            <strong>AI Analysis:</strong> Based on current data,{" "}
            {title.toLowerCase()} is{" "}
            {actualValue > budgetValue ? "above" : "below"} budget.{" "}
            {actualValue > 0 && budgetValue > 0
              ? `This represents a variance of ${variancePercent.toFixed(1)}%.`
              : ""}{" "}
            Consider reviewing underlying metrics for deeper insights.
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== BUDGET MODALS ====================

const BudgetTargetModal = ({ isOpen, onClose, currentUser, onSave }) => {
  const [budgets, setBudgets] = useState({
    newLeads: 0,
    salesVelocity: 0,
    conversionRate: 0,
    pipelineValue: 0,
    riskValue: 0,
  });

  useEffect(() => {
    if (!isOpen || !currentUser) return;
    (async () => {
      const snap = await getDoc(
        doc(db, "pipelineData", `${currentUser.uid}_pipelineBudgets`),
      );
      if (snap.exists()) setBudgets(snap.data());
    })();
  }, [isOpen, currentUser]);

  const handleChange = (key, value) => {
    setBudgets((prev) => ({
      ...prev,
      [key]: parseFloat(value) || 0,
    }));
  };

  const handleSave = async () => {
    if (!currentUser) return;
    await setDoc(
      doc(db, "pipelineData", `${currentUser.uid}_pipelineBudgets`),
      budgets,
    );
    if (onSave) onSave();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]">
      <div className="bg-[#fdfcfb] p-5 rounded-lg max-w-[500px] w-[90%]">
        <h3 className="text-mediumBrown text-lg mb-4">
          Set Pipeline Budgets
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-mediumBrown font-semibold">
              New Leads
            </label>
            <input
              type="number"
              value={budgets.newLeads}
              onChange={(e) => handleChange("newLeads", e.target.value)}
              className="w-full p-2 rounded border border-[#e8ddd4] text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-mediumBrown font-semibold">
              Sales Velocity (days)
            </label>
            <input
              type="number"
              value={budgets.salesVelocity}
              onChange={(e) =>
                handleChange("salesVelocity", e.target.value)
              }
              className="w-full p-2 rounded border border-[#e8ddd4] text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-mediumBrown font-semibold">
              Conversion Rate (%)
            </label>
            <input
              type="number"
              value={budgets.conversionRate}
              onChange={(e) =>
                handleChange("conversionRate", e.target.value)
              }
              className="w-full p-2 rounded border border-[#e8ddd4] text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-mediumBrown font-semibold">
              Pipeline Value (R)
            </label>
            <input
              type="number"
              value={budgets.pipelineValue}
              onChange={(e) =>
                handleChange("pipelineValue", e.target.value)
              }
              className="w-full p-2 rounded border border-[#e8ddd4] text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-mediumBrown font-semibold">
              Risk Adjusted Value (R)
            </label>
            <input
              type="number"
              value={budgets.riskValue}
              onChange={(e) => handleChange("riskValue", e.target.value)}
              className="w-full p-2 rounded border border-[#e8ddd4] text-sm"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#e8ddd4] text-mediumBrown rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-mediumBrown text-white rounded-md"
          >
            Save Budgets
          </button>
        </div>
      </div>
    </div>
  );
};

const ConcentrationBudgetModal = ({
  isOpen,
  onClose,
  currentUser,
  onSave,
}) => {
  const [budgets, setBudgets] = useState({
    totalMarketingSpend: 0,
    overallROI: 0,
  });

  useEffect(() => {
    if (!isOpen || !currentUser) return;
    (async () => {
      const snap = await getDoc(
        doc(db, "pipelineData", `${currentUser.uid}_concentrationBudgets`),
      );
      if (snap.exists()) setBudgets(snap.data());
    })();
  }, [isOpen, currentUser]);

  const handleChange = (key, value) => {
    setBudgets((prev) => ({
      ...prev,
      [key]: parseFloat(value) || 0,
    }));
  };

  const handleSave = async () => {
    if (!currentUser) return;
    await setDoc(
      doc(db, "pipelineData", `${currentUser.uid}_concentrationBudgets`),
      budgets,
    );
    if (onSave) onSave();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]">
      <div className="bg-[#fdfcfb] p-5 rounded-lg max-w-[400px] w-[90%]">
        <h3 className="text-mediumBrown text-lg mb-4">
          Set Revenue Concentration Budgets
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-mediumBrown font-semibold">
              Total Marketing Spend (R)
            </label>
            <input
              type="number"
              value={budgets.totalMarketingSpend}
              onChange={(e) =>
                handleChange("totalMarketingSpend", e.target.value)
              }
              className="w-full p-2 rounded border border-[#e8ddd4] text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-mediumBrown font-semibold">
              Overall ROI (%)
            </label>
            <input
              type="number"
              value={budgets.overallROI}
              onChange={(e) => handleChange("overallROI", e.target.value)}
              className="w-full p-2 rounded border border-[#e8ddd4] text-sm"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#e8ddd4] text-mediumBrown rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-mediumBrown text-white rounded-md"
          >
            Save Budgets
          </button>
        </div>
      </div>
    </div>
  );
};

const SustainabilityBudgetModal = ({
  isOpen,
  onClose,
  currentUser,
  onSave,
}) => {
  const [budgets, setBudgets] = useState({
    repeatCustomerRate: 0,
    churnRate: 0,
    netRetention: 0,
    campaignROI: 0,
  });

  useEffect(() => {
    if (!isOpen || !currentUser) return;
    (async () => {
      const snap = await getDoc(
        doc(
          db,
          "pipelineData",
          `${currentUser.uid}_sustainabilityBudgets`,
        ),
      );
      if (snap.exists()) setBudgets(snap.data());
    })();
  }, [isOpen, currentUser]);

  const handleChange = (key, value) => {
    setBudgets((prev) => ({
      ...prev,
      [key]: parseFloat(value) || 0,
    }));
  };

  const handleSave = async () => {
    if (!currentUser) return;
    await setDoc(
      doc(
        db,
        "pipelineData",
        `${currentUser.uid}_sustainabilityBudgets`,
      ),
      budgets,
    );
    if (onSave) onSave();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]">
      <div className="bg-[#fdfcfb] p-5 rounded-lg max-w-[400px] w-[90%]">
        <h3 className="text-mediumBrown text-lg mb-4">
          Set Demand Sustainability Budgets
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-mediumBrown font-semibold">
              Repeat Customer Rate (%)
            </label>
            <input
              type="number"
              value={budgets.repeatCustomerRate}
              onChange={(e) =>
                handleChange("repeatCustomerRate", e.target.value)
              }
              className="w-full p-2 rounded border border-[#e8ddd4] text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-mediumBrown font-semibold">
              Churn Rate (%)
            </label>
            <input
              type="number"
              value={budgets.churnRate}
              onChange={(e) => handleChange("churnRate", e.target.value)}
              className="w-full p-2 rounded border border-[#e8ddd4] text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-mediumBrown font-semibold">
              Net Retention (%)
            </label>
            <input
              type="number"
              value={budgets.netRetention}
              onChange={(e) =>
                handleChange("netRetention", e.target.value)
              }
              className="w-full p-2 rounded border border-[#e8ddd4] text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-mediumBrown font-semibold">
              Campaign ROI (%)
            </label>
            <input
              type="number"
              value={budgets.campaignROI}
              onChange={(e) =>
                handleChange("campaignROI", e.target.value)
              }
              className="w-full p-2 rounded border border-[#e8ddd4] text-sm"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#e8ddd4] text-mediumBrown rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-mediumBrown text-white rounded-md"
          >
            Save Budgets
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== PIPELINE VISIBILITY ====================

const PipelineVisibility = ({
  activeSection,
  currentUser,
  isInvestorView,
  onDataChange,
}) => {
  if (activeSection !== "pipeline-visibility") return null;
  return (
    <div>
      <KeyQuestionBox
        question="Do we have enough quality demand, at the right risk, to hit revenue?"
        signals="Forecast clarity, pipeline coverage, conversion rates"
        decisions="Formalise sales process, improve lead quality, adjust targets"
        section="pipeline-visibility"
      />
      <SectionControlsBar
        title="Pipeline Visibility"
        showAddData={false}
        showViewMode={false}
      />
      <PipelineTable
        currentUser={currentUser}
        isInvestorView={isInvestorView}
        onDataChange={onDataChange}
      />
    </div>
  );
};

// ==================== PIPELINE SUFFICIENCY ====================

const PipelineSufficiency = ({
  activeSection,
  currentUser,
  fromDate,
  toDate,
  pipelineRecords,
}) => {
  const [kpiNotes, setKpiNotes] = useState({});
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [selectedCalculation, setSelectedCalculation] = useState({
    title: "",
    calculation: "",
  });
  const [showTrendModal, setShowTrendModal] = useState(false);
  const [selectedTrendItem, setSelectedTrendItem] = useState(null);
  const [targetRevenue, setTargetRevenue] = useState(0);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgets, setBudgets] = useState({
    newLeads: 0,
    salesVelocity: 0,
    conversionRate: 0,
    pipelineValue: 0,
    riskValue: 0,
  });

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      const snap = await getDoc(
        doc(db, "pipelineData", `${currentUser.uid}_targetRevenue`),
      );
      if (snap.exists()) setTargetRevenue(snap.data().value || 0);
      const budgetSnap = await getDoc(
        doc(db, "pipelineData", `${currentUser.uid}_pipelineBudgets`),
      );
      if (budgetSnap.exists()) setBudgets(budgetSnap.data());
    })();
  }, [currentUser]);

  const handleTargetSave = async () => {
    if (!currentUser) return;
    await setDoc(
      doc(db, "pipelineData", `${currentUser.uid}_targetRevenue`),
      { value: targetRevenue },
    );
    alert("Target revenue saved");
  };

  const aggregateTableData = (records) => {
    if (!fromDate || !toDate || !records) return null;
    const rangeMonths = getRangeMonths(fromDate, toDate);
    const monthlyNewLeads = Array(rangeMonths.length).fill(0);
    const monthlyPipelineValue = Array(rangeMonths.length).fill(0);
    const monthlyRiskValue = Array(rangeMonths.length).fill(0);
    const monthlySalesVelocityDays = Array(rangeMonths.length)
      .fill(0)
      .map(() => ({ sum: 0, count: 0 }));
    const monthlyConversionAttempts = Array(rangeMonths.length)
      .fill(0)
      .map(() => ({ total: 0, converted: 0 }));

    records.forEach((rec) => {
      const rev = parseFloat(rec.revPotential) || 0;
      const prob = parseFloat(rec.probability) || 0;
      const createdAt = rec.createdAt ? new Date(rec.createdAt) : null;
      const signedDate = rec.signedDate
        ? new Date(rec.signedDate)
        : null;
      const lastEngagement = rec.lastEngagement
        ? new Date(rec.lastEngagement)
        : null;
      const dateToUse = lastEngagement || createdAt;
      if (!dateToUse) return;
      const monthIdx = dateToUse.getMonth();
      const year = dateToUse.getFullYear();
      const idx = rangeMonths.findIndex(
        (r) => r.year === year && r.monthIdx === monthIdx,
      );
      if (idx < 0) return;

      monthlyNewLeads[idx] += 1;
      monthlyPipelineValue[idx] += rev;
      monthlyRiskValue[idx] += rev * (prob / 100);

      if (createdAt && signedDate) {
        const days = (signedDate - createdAt) / (1000 * 60 * 60 * 24);
        if (days >= 0) {
          monthlySalesVelocityDays[idx].sum += days;
          monthlySalesVelocityDays[idx].count += 1;
        }
      }

      const isConverted = prob >= 50 || !!signedDate;
      monthlyConversionAttempts[idx].total += 1;
      if (isConverted) monthlyConversionAttempts[idx].converted += 1;
    });

    return {
      labels: rangeMonths.map((r) => r.label),
      newLeads: monthlyNewLeads,
      pipelineValue: monthlyPipelineValue,
      riskValue: monthlyRiskValue,
      salesVelocity: monthlySalesVelocityDays.map((item) =>
        item.count > 0 ? item.sum / item.count : 0,
      ),
      conversionRate: monthlyConversionAttempts.map((item) =>
        item.total > 0 ? (item.converted / item.total) * 100 : 0,
      ),
    };
  };

  const aggregatedData = aggregateTableData(pipelineRecords);

  if (activeSection !== "pipeline-sufficiency") return null;

  const latest = {
    newLeads: aggregatedData?.newLeads.slice(-1)[0] || 0,
    salesVelocity: aggregatedData?.salesVelocity.slice(-1)[0] || 0,
    conversionRate: aggregatedData?.conversionRate.slice(-1)[0] || 0,
    pipelineValue: aggregatedData?.pipelineValue.slice(-1)[0] || 0,
    riskValue: aggregatedData?.riskValue.slice(-1)[0] || 0,
  };
  const coverage =
    targetRevenue > 0 ? (latest.riskValue / targetRevenue) * 100 : 0;

  const calculationTexts = {
    newLeads:
      "New Leads: Number of pipeline records whose Last Engagement (or Created At) falls in the period.",
    salesVelocity:
      "Sales Velocity = Average days between Created At and Signed Date for closed deals in the period.",
    conversionRate:
      "Conversion Rate = Percentage of deals with Probability ≥ 50% or having a Signed Date.",
    pipelineValue:
      "Total Pipeline Value = Sum of Rev Potential for all records in the period.",
    riskValue:
      "Risk Adjusted Value = Sum of (Rev Potential × Probability %) for all records.",
    coverage:
      "Pipeline Coverage = (Risk Adjusted Value ÷ Target Revenue) × 100%.",
  };

  const renderKPICard = (
    title,
    dataKey,
    calculation,
    unit,
    goodDirection,
    value,
    trendData,
    budgetVal,
  ) => (
    <KPITripleCard
      key={dataKey}
      title={title}
      actualValue={value}
      budgetValue={budgetVal}
      unit={unit}
      goodDirection={goodDirection}
      onEyeClick={() => {
        setSelectedCalculation({ title, calculation });
        setShowCalculationModal(true);
      }}
      onAddNotes={(val) =>
        setKpiNotes((prev) => ({ ...prev, [dataKey]: val }))
      }
      onTrend={() => {
        setSelectedTrendItem({
          name: title,
          data: trendData,
          labels: aggregatedData?.labels || [],
          isPercentage: unit === "percentage",
        });
        setShowTrendModal(true);
      }}
      notes={kpiNotes[dataKey]}
    />
  );

  return (
    <div>
      <KeyQuestionBox
        question="Is pipeline big enough?"
        signals="Coverage ratio, lead volume trends"
        decisions="Increase lead generation, adjust targets"
        section="pipeline-sufficiency"
      />
      <SectionControlsBar
        title="Pipeline Sufficiency"
        showAddData={false}
        showViewMode={false}
        extraControls={
          <button
            onClick={() => setShowBudgetModal(true)}
            className="px-3 py-1.5 bg-[#e8ddd4] text-mediumBrown rounded text-sm"
          >
            Set Budgets
          </button>
        }
      />

      <div className="bg-[#f5f0eb] p-4 rounded-lg mb-6 flex gap-3 items-center">
        <label className="text-sm font-semibold text-mediumBrown">
          Target Revenue (R):
        </label>
        <input
          type="number"
          step="0.01"
          value={targetRevenue}
          onChange={(e) =>
            setTargetRevenue(parseFloat(e.target.value) || 0)
          }
          className="p-2 rounded border border-[#e8ddd4] w-40"
        />
        <button
          onClick={handleTargetSave}
          className="px-3 py-1.5 bg-mediumBrown text-white rounded text-sm"
        >
          Update Target
        </button>
      </div>

      {aggregatedData ? (
        <KpiGrid2>
          {renderKPICard(
            "New Leads",
            "newLeads",
            calculationTexts.newLeads,
            "number",
            "up",
            latest.newLeads,
            aggregatedData.newLeads,
            budgets.newLeads,
          )}
          {renderKPICard(
            "Sales Velocity",
            "salesVelocity",
            calculationTexts.salesVelocity,
            "days",
            "down",
            latest.salesVelocity,
            aggregatedData.salesVelocity,
            budgets.salesVelocity,
          )}
          {renderKPICard(
            "Conversion Rate",
            "conversionRate",
            calculationTexts.conversionRate,
            "percentage",
            "up",
            latest.conversionRate,
            aggregatedData.conversionRate,
            budgets.conversionRate,
          )}
          {renderKPICard(
            "Total Pipeline Value",
            "pipelineValue",
            calculationTexts.pipelineValue,
            "currency",
            "up",
            latest.pipelineValue,
            aggregatedData.pipelineValue,
            budgets.pipelineValue,
          )}
          {renderKPICard(
            "Risk Adjusted Value",
            "riskValue",
            calculationTexts.riskValue,
            "currency",
            "up",
            latest.riskValue,
            aggregatedData.riskValue,
            budgets.riskValue,
          )}
          {renderKPICard(
            "Pipeline Coverage",
            "coverage",
            calculationTexts.coverage,
            "percentage",
            "up",
            coverage,
            aggregatedData.riskValue.map((r) =>
              targetRevenue > 0 ? (r / targetRevenue) * 100 : 0,
            ),
            0, // coverage budget
          )}
        </KpiGrid2>
      ) : (
        <p className="text-center text-mediumBrown">
          No pipeline records available. Add records under Pipeline
          Visibility.
        </p>
      )}

      <CalculationModal
        isOpen={showCalculationModal}
        onClose={() => setShowCalculationModal(false)}
        title={selectedCalculation.title}
        calculation={selectedCalculation.calculation}
      />
      {showTrendModal && selectedTrendItem && (
        <TrendModal
          isOpen={showTrendModal}
          onClose={() => {
            setShowTrendModal(false);
            setSelectedTrendItem(null);
          }}
          item={{
            name: selectedTrendItem.name,
            isPercentage: selectedTrendItem.isPercentage,
          }}
          trendData={{
            labels: selectedTrendItem.labels,
            actual: selectedTrendItem.data,
            budget: null,
          }}
          currencyUnit="zar"
          formatValue={(v) => formatCurrency(v)}
        />
      )}
      <BudgetTargetModal
        isOpen={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        currentUser={currentUser}
        onSave={() => {
          (async () => {
            const snap = await getDoc(
              doc(
                db,
                "pipelineData",
                `${currentUser.uid}_pipelineBudgets`,
              ),
            );
            if (snap.exists()) setBudgets(snap.data());
          })();
        }}
      />
    </div>
  );
};

// ==================== REVENUE CONCENTRATION ====================

const RevenueConcentration = ({
  activeSection,
  currentUser,
  isInvestorView,
  onAddData,
  fromDate,
  toDate,
}) => {
  const [loading, setLoading] = useState(false);
  const [kpiNotes, setKpiNotes] = useState({});
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [selectedCalculation, setSelectedCalculation] = useState({
    title: "",
    calculation: "",
  });
  const [showTrendModal, setShowTrendModal] = useState(false);
  const [selectedTrendItem, setSelectedTrendItem] = useState(null);
  const [activeTab, setActiveTab] = useState("channel");
  const [concentrationData, setConcentrationData] = useState({
    revenueChannels: [
      { name: "Social Media", revenue: 0, spend: 0 },
      { name: "Email", revenue: 0, spend: 0 },
      { name: "PPC", revenue: 0, spend: 0 },
      { name: "SEO", revenue: 0, spend: 0 },
      { name: "Referral", revenue: 0, spend: 0 },
      { name: "Direct", revenue: 0, spend: 0 },
    ],
    customerSegments: [
      { name: "Enterprise", revenue: 0, customerCount: 0 },
      { name: "SMB", revenue: 0, customerCount: 0 },
      { name: "Startup", revenue: 0, customerCount: 0 },
      { name: "Non-Profit", revenue: 0, customerCount: 0 },
      { name: "Education", revenue: 0, customerCount: 0 },
    ],
    revenueByCustomer: [
      { name: "Customer A", revenue: 0 },
      { name: "Customer B", revenue: 0 },
      { name: "Customer C", revenue: 0 },
      { name: "Customer D", revenue: 0 },
      { name: "Customer E", revenue: 0 },
    ],
    notes: "",
  });

  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgets, setBudgets] = useState({
    totalMarketingSpend: 0,
    overallROI: 0,
  });

  const toYear = toDate
    ? parseInt(toDate.split("-")[0])
    : new Date().getFullYear();

  useEffect(() => {
    if (currentUser && activeSection === "revenue-concentration") loadData();
  }, [currentUser, activeSection, toDate]);

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const docSnap = await getDoc(
        doc(
          db,
          "pipelineData",
          `${currentUser.uid}_concentration_${toYear}`,
        ),
      );
      if (docSnap.exists()) {
        const data = docSnap.data();
        setConcentrationData({
          revenueChannels:
            data.revenueChannels || concentrationData.revenueChannels,
          customerSegments:
            data.customerSegments ||
            concentrationData.customerSegments,
          revenueByCustomer:
            data.revenueByCustomer ||
            concentrationData.revenueByCustomer,
          notes: data.notes || "",
        });
      }
      // load budgets
      const budgetSnap = await getDoc(
        doc(
          db,
          "pipelineData",
          `${currentUser.uid}_concentrationBudgets`,
        ),
      );
      if (budgetSnap.exists()) setBudgets(budgetSnap.data());
    } catch (error) {
      console.error("Error loading revenue concentration data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculationClick = (title, calculation) => {
    setSelectedCalculation({ title, calculation });
    setShowCalculationModal(true);
  };

  const openTrendModal = (itemName, currentValue, isPercentage = false) => {
    const rangeMonths = getRangeMonths(fromDate, toDate);
    setSelectedTrendItem({
      name: itemName,
      data: rangeMonths.map(() => currentValue),
      labels: rangeMonths.map((r) => r.label),
      isPercentage,
    });
    setShowTrendModal(true);
  };

  const renderKPICard = (
    title,
    dataKey,
    calculation = "",
    unit = "number",
    goodDirection = "up",
  ) => {
    let actualValue = 0;
    if (dataKey === "totalMarketingSpend")
      actualValue = concentrationData.revenueChannels.reduce(
        (sum, c) => sum + (c.spend || 0),
        0,
      );
    else if (dataKey === "totalROI") {
      const totalRevenue = concentrationData.revenueChannels.reduce(
        (sum, c) => sum + (c.revenue || 0),
        0,
      );
      const totalSpend = concentrationData.revenueChannels.reduce(
        (sum, c) => sum + (c.spend || 0),
        0,
      );
      actualValue =
        totalSpend > 0
          ? ((totalRevenue - totalSpend) / totalSpend) * 100
          : 0;
    }
    const budgetVal =
      dataKey === "totalMarketingSpend"
        ? budgets.totalMarketingSpend
        : budgets.overallROI;
    return (
      <KPITripleCard
        key={dataKey}
        title={title}
        actualValue={actualValue}
        budgetValue={budgetVal}
        unit={unit}
        goodDirection={goodDirection}
        onEyeClick={() => handleCalculationClick(title, calculation)}
        onAddNotes={(val) =>
          setKpiNotes((prev) => ({ ...prev, [dataKey]: val }))
        }
        onTrend={() =>
          openTrendModal(title, actualValue, unit === "percentage")
        }
        notes={kpiNotes[dataKey]}
      />
    );
  };

  if (activeSection !== "revenue-concentration") return null;

  const totalRevenue = concentrationData.revenueChannels.reduce(
    (sum, c) => sum + (c.revenue || 0),
    0,
  );
  const top3Channels = [...concentrationData.revenueChannels]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3);
  const top3Customers = [...concentrationData.revenueByCustomer]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3);
  const top3Segments = [...concentrationData.customerSegments]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3);
  const top3ChannelRevenue = top3Channels.reduce(
    (sum, c) => sum + (c.revenue || 0),
    0,
  );
  const top3Percentage =
    totalRevenue > 0 ? (top3ChannelRevenue / totalRevenue) * 100 : 0;

  return (
    <div>
      <KeyQuestionBox
        question="Where does revenue actually come from? Are we over-dependent?"
        signals="Channel concentration, segment dependency"
        decisions="Diversify channels, reduce reliance on top clients"
        section="revenue-concentration"
      />
      <SectionControlsBar
        title="Revenue Concentration"
        onAddData={!isInvestorView ? onAddData : null}
        showAddData={!isInvestorView}
        showViewMode={false}
        extraControls={
          <button
            onClick={() => setShowBudgetModal(true)}
            className="px-3 py-1.5 bg-[#e8ddd4] text-mediumBrown rounded text-sm"
          >
            Set Budgets
          </button>
        }
      />

      <KpiGrid2>
        {renderKPICard(
          "Total Marketing Spend",
          "totalMarketingSpend",
          "Total Marketing Spend = Sum of all channel spends.",
          "currency",
          "down",
        )}
        {renderKPICard(
          "Overall ROI",
          "totalROI",
          "Overall ROI = (Total Revenue - Total Spend) / Total Spend × 100%",
          "percentage",
          "up",
        )}
      </KpiGrid2>

      {/* ... rest of RevenueConcentration JSX unchanged ... */}
      <div className="bg-[#f5f0eb] p-5 rounded-lg mb-7">
        <h3 className="text-mediumBrown mt-0 mb-[15px] text-base">
          Top 3 Concentration
        </h3>
        <div className="grid grid-cols-3 gap-5">
          {[
            { label: "Top 3 Channels", data: top3Channels, nameKey: "name" },
            {
              label: "Top 3 Customers",
              data: top3Customers,
              nameKey: "name",
            },
            {
              label: "Top 3 Segments",
              data: top3Segments,
              nameKey: "name",
            },
          ].map(({ label, data }) => (
            <div key={label}>
              <h4 className="text-mediumBrown text-sm mb-2.5">{label}</h4>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-mediumBrown text-[#fdfcfb]">
                    <th className="p-2 text-left text-xs">
                      {label.split(" ")[2]}
                    </th>
                    <th className="p-2 text-right text-xs">Revenue</th>
                    <th className="p-2 text-right text-xs">%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={index} className="border-b border-[#e8ddd4]">
                      <td className="p-2 text-xs text-mediumBrown">
                        {item.name}
                      </td>
                      <td className="p-2 text-xs text-mediumBrown text-right">
                        {formatCurrency(item.revenue)}
                      </td>
                      <td className="p-2 text-xs text-mediumBrown text-right">
                        {totalRevenue > 0
                          ? ((item.revenue / totalRevenue) * 100).toFixed(
                              1,
                            )
                          : 0}
                        %
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#f5f0eb] p-5 rounded-lg mb-7">
        <h3 className="text-mediumBrown mt-0 mb-[15px] text-base">
          {activeTab === "channel"
            ? "Revenue by Channel"
            : activeTab === "customer"
              ? "Revenue by Customer"
              : "Revenue by Segment"}
        </h3>
        <div className="h-[300px]">
          <Bar
            data={{
              labels:
                activeTab === "channel"
                  ? concentrationData.revenueChannels.map((c) => c.name)
                  : activeTab === "customer"
                    ? concentrationData.revenueByCustomer.map(
                        (c) => c.name,
                      )
                    : concentrationData.customerSegments.map(
                        (s) => s.name,
                      ),
              datasets: [
                {
                  label: "Revenue",
                  data:
                    activeTab === "channel"
                      ? concentrationData.revenueChannels.map(
                          (c) => c.revenue,
                        )
                      : activeTab === "customer"
                        ? concentrationData.revenueByCustomer.map(
                            (c) => c.revenue,
                          )
                        : concentrationData.customerSegments.map(
                            (s) => s.revenue,
                          ),
                  backgroundColor: "#5d4037",
                  borderRadius: 4,
                },
                ...(activeTab === "channel"
                  ? [
                      {
                        label: "Marketing Spend",
                        data: concentrationData.revenueChannels.map(
                          (c) => c.spend,
                        ),
                        backgroundColor: "#8d6e63",
                        borderRadius: 4,
                      },
                    ]
                  : []),
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                datalabels: { display: false },
                legend: { display: activeTab === "channel" },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => formatCurrency(value),
                  },
                },
              },
            }}
          />
        </div>
      </div>

      <div className="bg-[#f5f0eb] p-5 rounded-lg mb-7">
        <h3 className="text-mediumBrown mt-0 mb-[15px] text-base">
          Channel Performance
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-mediumBrown text-[#fdfcfb]">
                {[
                  "Channel",
                  "Revenue",
                  "Marketing Spend",
                  "Net Profit",
                  "ROI %",
                  "% of Revenue",
                ].map((h, i) => (
                  <th
                    key={h}
                    className={`p-3 text-[13px] ${
                      i === 0 ? "text-left" : "text-right"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {concentrationData.revenueChannels
                .sort((a, b) => b.revenue - a.revenue)
                .map((channel, index) => {
                  const netProfit = channel.revenue - channel.spend;
                  const roi =
                    channel.spend > 0
                      ? (netProfit / channel.spend) * 100
                      : 0;
                  const revenuePercentage =
                    totalRevenue > 0
                      ? (channel.revenue / totalRevenue) * 100
                      : 0;
                  return (
                    <tr
                      key={index}
                      className={`border-b border-[#e8ddd4] ${
                        index % 2 === 0 ? "bg-[#fdfcfb]" : "bg-[#f5f0eb]"
                      }`}
                    >
                      <td className="p-2.5 text-[13px] text-mediumBrown font-semibold">
                        {channel.name}
                      </td>
                      <td className="p-2.5 text-[13px] text-mediumBrown text-right">
                        {formatCurrency(channel.revenue)}
                      </td>
                      <td className="p-2.5 text-[13px] text-mediumBrown text-right">
                        {formatCurrency(channel.spend)}
                      </td>
                      <td
                        className={`p-2.5 text-[13px] text-right font-semibold ${
                          netProfit >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(netProfit)}
                      </td>
                      <td
                        className={`p-2.5 text-[13px] text-right font-semibold ${
                          roi >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {roi.toFixed(1)}%
                      </td>
                      <td className="p-2.5 text-[13px] text-mediumBrown text-right">
                        {revenuePercentage.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#f5f0eb] p-[15px] rounded-md">
        <h4 className="text-mediumBrown mt-0 mb-2.5">
          Concentration Risk Analysis
        </h4>
        <div className="text-[13px] text-mediumBrown font-semibold mb-1">
          Channel Concentration Risk
        </div>
        <div className="flex items-center mb-2.5">
          <div className="w-full bg-[#e8ddd4] h-5 rounded-full overflow-hidden">
            <div
              className="h-full"
              style={{
                width: `${top3Percentage}%`,
                backgroundColor:
                  top3Percentage > 70
                    ? "#dc2626"
                    : top3Percentage > 50
                      ? "#f59e0b"
                      : "#16a34a",
              }}
            />
          </div>
          <div className="ml-2.5 text-sm text-mediumBrown font-semibold min-w-[40px]">
            {top3Percentage.toFixed(1)}%
          </div>
        </div>
        <div className="text-xs text-lightBrown">
          Top 3 channels generate {top3Percentage.toFixed(1)}% of total revenue
          {top3Percentage > 70 &&
            " - High risk: Over-dependent on few channels"}
          {top3Percentage <= 70 &&
            top3Percentage > 50 &&
            " - Moderate risk"}
          {top3Percentage <= 50 && " - Low risk: Well diversified"}
        </div>
      </div>

      <CalculationModal
        isOpen={showCalculationModal}
        onClose={() => setShowCalculationModal(false)}
        title={selectedCalculation.title}
        calculation={selectedCalculation.calculation}
      />
      {showTrendModal && selectedTrendItem && (
        <TrendModal
          isOpen={showTrendModal}
          onClose={() => {
            setShowTrendModal(false);
            setSelectedTrendItem(null);
          }}
          item={{
            name: selectedTrendItem.name,
            isPercentage: selectedTrendItem.isPercentage,
          }}
          trendData={{
            labels: selectedTrendItem.labels,
            actual: selectedTrendItem.data,
            budget: null,
          }}
          currencyUnit="zar"
          formatValue={(v) => formatCurrency(v)}
        />
      )}
      <ConcentrationBudgetModal
        isOpen={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        currentUser={currentUser}
        onSave={loadData}
      />
    </div>
  );
};

// ==================== DEMAND SUSTAINABILITY ====================

const DemandSustainability = ({
  activeSection,
  currentUser,
  isInvestorView,
  onAddData,
  fromDate,
  toDate,
}) => {
  const [loading, setLoading] = useState(false);
  const [kpiNotes, setKpiNotes] = useState({});
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [selectedCalculation, setSelectedCalculation] = useState({
    title: "",
    calculation: "",
  });
  const [showTrendModal, setShowTrendModal] = useState(false);
  const [selectedTrendItem, setSelectedTrendItem] = useState(null);
  const [sustainabilityData, setSustainabilityData] = useState({
    repeatCustomerRate: 0,
    churnRate: 0,
    campaigns: [
      { name: "Q1 Campaign", cost: 0, revenue: 0 },
      { name: "Q2 Campaign", cost: 0, revenue: 0 },
      { name: "Summer Sale", cost: 0, revenue: 0 },
      { name: "Holiday Campaign", cost: 0, revenue: 0 },
    ],
    notes: "",
  });

  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgets, setBudgets] = useState({
    repeatCustomerRate: 0,
    churnRate: 0,
    netRetention: 0,
    campaignROI: 0,
  });

  const toYear = toDate
    ? parseInt(toDate.split("-")[0])
    : new Date().getFullYear();

  useEffect(() => {
    if (currentUser && activeSection === "demand-sustainability") loadData();
  }, [currentUser, activeSection, toDate]);

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const docSnap = await getDoc(
        doc(
          db,
          "pipelineData",
          `${currentUser.uid}_sustainability_${toYear}`,
        ),
      );
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSustainabilityData({
          repeatCustomerRate: data.repeatCustomerRate || 0,
          churnRate: data.churnRate || 0,
          campaigns: data.campaigns || sustainabilityData.campaigns,
          notes: data.notes || "",
        });
      }
      const budgetSnap = await getDoc(
        doc(
          db,
          "pipelineData",
          `${currentUser.uid}_sustainabilityBudgets`,
        ),
      );
      if (budgetSnap.exists()) setBudgets(budgetSnap.data());
    } catch (error) {
      console.error(
        "Error loading demand sustainability data:",
        error,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCalculationClick = (title, calculation) => {
    setSelectedCalculation({ title, calculation });
    setShowCalculationModal(true);
  };

  const openTrendModal = (
    itemName,
    currentValue,
    isPercentage = false,
  ) => {
    const rangeMonths = getRangeMonths(fromDate, toDate);
    setSelectedTrendItem({
      name: itemName,
      data: rangeMonths.map(() => currentValue),
      labels: rangeMonths.map((r) => r.label),
      isPercentage,
    });
    setShowTrendModal(true);
  };

  const renderKPICard = (
    title,
    dataKey,
    calculation = "",
    unit = "percentage",
    goodDirection = "up",
  ) => {
    let actualValue = 0;
    if (dataKey === "repeatCustomerRate")
      actualValue = sustainabilityData.repeatCustomerRate;
    else if (dataKey === "churnRate")
      actualValue = sustainabilityData.churnRate;
    else if (dataKey === "netRetention")
      actualValue =
        sustainabilityData.repeatCustomerRate -
        sustainabilityData.churnRate;
    else if (dataKey === "campaignROI") {
      const totalCost = sustainabilityData.campaigns.reduce(
        (sum, c) => sum + (c.cost || 0),
        0,
      );
      const totalRevenue = sustainabilityData.campaigns.reduce(
        (sum, c) => sum + (c.revenue || 0),
        0,
      );
      actualValue =
        totalCost > 0
          ? ((totalRevenue - totalCost) / totalCost) * 100
          : 0;
    }
    const budgetVal = budgets[dataKey] || 0;
    return (
      <KPITripleCard
        key={dataKey}
        title={title}
        actualValue={actualValue}
        budgetValue={budgetVal}
        unit={unit}
        goodDirection={goodDirection}
        onEyeClick={() =>
          handleCalculationClick(title, calculation)
        }
        onAddNotes={(val) =>
          setKpiNotes((prev) => ({ ...prev, [dataKey]: val }))
        }
        onTrend={() =>
          openTrendModal(
            title,
            actualValue,
            unit === "percentage",
          )
        }
        notes={kpiNotes[dataKey]}
      />
    );
  };

  if (activeSection !== "demand-sustainability") return null;

  const netRetention =
    sustainabilityData.repeatCustomerRate -
    sustainabilityData.churnRate;
  const totalCampaignCost = sustainabilityData.campaigns.reduce(
    (sum, c) => sum + (c.cost || 0),
    0,
  );
  const totalCampaignRevenue = sustainabilityData.campaigns.reduce(
    (sum, c) => sum + (c.revenue || 0),
    0,
  );
  const campaignROI =
    totalCampaignCost > 0
      ? ((totalCampaignRevenue - totalCampaignCost) /
          totalCampaignCost) *
        100
      : 0;

  const calculationTexts = {
    repeatCustomerRate:
      "Repeat Customer Rate = (Repeat Customers ÷ Total Customers) × 100%\n\nMeasures customer loyalty and satisfaction.",
    churnRate:
      "Churn Rate = (Customers Lost ÷ Total Customers) × 100%\n\nMeasures customer retention.",
    netRetention:
      "Net Retention Rate = Repeat Customer Rate - Churn Rate\n\nIndicates overall customer retention health.",
    campaignROI:
      "Campaign ROI = (Revenue - Cost) ÷ Cost × 100%\n\nMeasures marketing campaign effectiveness.",
  };

  return (
    <div>
      <KeyQuestionBox
        question="Is demand repeatable? Will demand persist without constant spend?"
        signals="Referral rates, repeat customers, CAC trends"
        decisions="Build demand engine, focus on retention, optimize campaigns"
        section="demand-sustainability"
      />
      <SectionControlsBar
        title="Demand Sustainability"
        onAddData={!isInvestorView ? onAddData : null}
        showAddData={!isInvestorView}
        showViewMode={false}
        extraControls={
          <button
            onClick={() => setShowBudgetModal(true)}
            className="px-3 py-1.5 bg-[#e8ddd4] text-mediumBrown rounded text-sm"
          >
            Set Budgets
          </button>
        }
      />
      <KpiGrid2>
        {renderKPICard(
          "Repeat Customer Rate",
          "repeatCustomerRate",
          calculationTexts.repeatCustomerRate,
          "percentage",
          "up",
        )}
        {renderKPICard(
          "Churn Rate",
          "churnRate",
          calculationTexts.churnRate,
          "percentage",
          "down",
        )}
        {renderKPICard(
          "Net Retention",
          "netRetention",
          calculationTexts.netRetention,
          "percentage",
          "up",
        )}
        {renderKPICard(
          "Campaign ROI",
          "campaignROI",
          calculationTexts.campaignROI,
          "percentage",
          "up",
        )}
      </KpiGrid2>

      <div className="bg-[#f5f0eb] p-[15px] rounded-md mb-5">
        <h4 className="text-mediumBrown mt-0 mb-2.5">
          Campaign Performance
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-mediumBrown text-[#fdfcfb]">
                <th className="p-3 text-left text-[13px]">Campaign</th>
                <th className="p-3 text-right text-[13px]">Cost</th>
                <th className="p-3 text-right text-[13px]">Revenue</th>
                <th className="p-3 text-right text-[13px]">ROI %</th>
              </tr>
            </thead>
            <tbody>
              {sustainabilityData.campaigns.map((campaign, index) => {
                const roi =
                  campaign.cost > 0
                    ? ((campaign.revenue - campaign.cost) /
                        campaign.cost) *
                      100
                    : 0;
                return (
                  <tr
                    key={index}
                    className={`border-b border-[#e8ddd4] ${
                      index % 2 === 0
                        ? "bg-[#fdfcfb]"
                        : "bg-[#f5f0eb]"
                    }`}
                  >
                    <td className="p-2.5 text-[13px] text-mediumBrown font-semibold">
                      {campaign.name}
                    </td>
                    <td className="p-2.5 text-[13px] text-mediumBrown text-right">
                      {formatCurrency(campaign.cost)}
                    </td>
                    <td className="p-2.5 text-[13px] text-mediumBrown text-right">
                      {formatCurrency(campaign.revenue)}
                    </td>
                    <td
                      className={`p-2.5 text-[13px] text-right font-semibold ${
                        roi >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {roi.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <CalculationModal
        isOpen={showCalculationModal}
        onClose={() => setShowCalculationModal(false)}
        title={selectedCalculation.title}
        calculation={selectedCalculation.calculation}
      />
      {showTrendModal && selectedTrendItem && (
        <TrendModal
          isOpen={showTrendModal}
          onClose={() => {
            setShowTrendModal(false);
            setSelectedTrendItem(null);
          }}
          item={{
            name: selectedTrendItem.name,
            isPercentage: selectedTrendItem.isPercentage,
          }}
          trendData={{
            labels: selectedTrendItem.labels,
            actual: selectedTrendItem.data,
            budget: null,
          }}
          currencyUnit="zar"
          formatValue={(v) => formatCurrency(v)}
        />
      )}
      <SustainabilityBudgetModal
        isOpen={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        currentUser={currentUser}
        onSave={loadData}
      />
    </div>
  );
};

// ==================== MAIN MARKETING SALES ====================

export default function MarketingSales() {
  const [activeSection, setActiveSection] = useState(
    "pipeline-visibility",
  );
  const [user, setUser] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isInvestorView, setIsInvestorView] = useState(false);
  const [viewingSMEId, setViewingSMEId] = useState(null);
  const [viewingSMEName, setViewingSMEName] = useState("");
  const [viewOrigin, setViewOrigin] = useState("investor");
  const [showAddDataModal, setShowAddDataModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pipelineRecords, setPipelineRecords] = useState([]);

  const _now = new Date();
  const _toYM = `${_now.getFullYear()}-${String(
    _now.getMonth() + 1,
  ).padStart(2, "0")}`;
  const _fromD = new Date(_now.getFullYear(), _now.getMonth() - 11, 1);
  const _fromYM = `${_fromD.getFullYear()}-${String(
    _fromD.getMonth() + 1,
  ).padStart(2, "0")}`;
  const [filterMode, setFilterMode] = useState("range");
  const [fromDate, setFromDate] = useState(_fromYM);
  const [toDate, setToDate] = useState(_toYM);

  useEffect(() => {
    const investorViewMode =
      sessionStorage.getItem("investorViewMode");
    const smeId = sessionStorage.getItem("viewingSMEId");
    const smeName = sessionStorage.getItem("viewingSMEName");
    const origin = sessionStorage.getItem("viewOrigin");
    if (investorViewMode === "true" && smeId) {
      setIsInvestorView(true);
      setViewingSMEId(smeId);
      setViewingSMEName(smeName || "SME");
      setViewOrigin(origin || "investor");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(
        isInvestorView && viewingSMEId
          ? { uid: viewingSMEId }
          : currentUser,
      );
    });
    return () => unsubscribe();
  }, [isInvestorView, viewingSMEId]);

  const handleExitInvestorView = () => {
    sessionStorage.removeItem("viewingSMEId");
    sessionStorage.removeItem("viewingSMEName");
    sessionStorage.removeItem("investorViewMode");
    sessionStorage.removeItem("viewOrigin");
    if (viewOrigin === "catalyst") {
      window.location.href = "/catalyst/cohorts";
    } else {
      window.location.href = "/my-cohorts";
    }
  };

  const handlePipelineRecordsChange = (records) =>
    setPipelineRecords(records);

  const sectionButtons = [
    {
      id: "pipeline-visibility",
      label: "Pipeline Visibility",
    },
    {
      id: "pipeline-sufficiency",
      label: "Pipeline Sufficiency",
    },
    {
      id: "revenue-concentration",
      label: "Revenue Concentration",
    },
    {
      id: "demand-sustainability",
      label: "Demand Sustainability",
    },
  ];

  return (
    <div className="flex min-h-screen">
      <div className="w-full min-h-screen box-border">
        {isInvestorView && (
          <div className="bg-[#e8f5e9] px-5 py-4 mt-[50px] mb-5 rounded-lg border-2 border-[#4caf50] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-xl">👁️</span>
              <span className="text-[#2e7d32] font-semibold text-[15px]">
                {viewOrigin === "catalyst"
                  ? `Catalyst View: Viewing ${viewingSMEName}'s Marketing & Sales Data`
                  : `Investor View: Viewing ${viewingSMEName}'s Marketing & Sales Data`}
              </span>
            </div>
            <button
              onClick={handleExitInvestorView}
              className="px-4 py-2 bg-[#4caf50] text-white rounded-md font-semibold text-sm flex items-center gap-2"
            >
              <span>←</span>
              {viewOrigin === "catalyst"
                ? "Back to Catalyst Cohorts"
                : "Back to My Cohorts"}
            </button>
          </div>
        )}

        <div>
          <div className="flex justify-between items-center mb-5">
            <h1 className="text-mediumBrown text-[32px] font-bold">
              Marketing & Pipeline Performance
            </h1>
          </div>

          <div className="bg-[#fdfcfb] p-5 rounded-lg shadow-sm mb-7 border border-mediumBrown">
            <div
              onClick={() =>
                setShowFullDescription(!showFullDescription)
              }
              className="cursor-pointer flex justify-between items-center text-mediumBrown font-semibold"
            >
              <span>About this Dashboard</span>
              <span>
                {showFullDescription ? "▼" : "▶"}
              </span>
            </div>
            {showFullDescription && (
              <div className="mt-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <h3 className="text-warmBrown mt-0 mb-3 text-base">
                      What this dashboard DOES
                    </h3>
                    <ul className="text-textBrown text-sm leading-7 m-0 pl-5">
                      <li>
                        Assesses pipeline visibility, quality, and
                        concentration
                      </li>
                      <li>
                        Evaluates demand risk and market exposure
                      </li>
                      <li>
                        Monitors lead generation effectiveness and
                        conversion rates
                      </li>
                      <li>
                        Measures customer acquisition cost and
                        marketing ROI
                      </li>
                      <li>
                        Tracks sales cycle efficiency and pipeline
                        velocity
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-warmBrown mt-0 mb-3 text-base">
                      What this dashboard does NOT do
                    </h3>
                    <ul className="text-textBrown text-sm leading-7 m-0 pl-5">
                      <li>
                        Run marketing campaigns or ad management
                      </li>
                      <li>
                        Manage CRM or customer relationship tracking
                      </li>
                      <li>
                        Track social media engagement or content
                        scheduling
                      </li>
                      <li>
                        Email marketing automation or lead nurturing
                      </li>
                      <li>
                        SEO optimization or website analytics
                        management
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mb-7">
            <DateRangePicker
              filterMode={filterMode}
              setFilterMode={setFilterMode}
              fromDate={fromDate}
              setFromDate={setFromDate}
              toDate={toDate}
              setToDate={setToDate}
            />
          </div>

          <div className="flex gap-[15px] mb-7 bg-[#fdfcfb] rounded-lg shadow-sm flex-wrap">
            {sectionButtons.map((button) => (
              <button
                key={button.id}
                onClick={() => setActiveSection(button.id)}
                className={`px-6 py-3 border-0 rounded-md cursor-pointer font-semibold text-[15px] transition-all duration-300 shadow min-w-[180px] text-center ${
                  activeSection === button.id
                    ? "bg-mediumBrown text-[#fdfcfb]"
                    : "bg-[#e8ddd4] text-mediumBrown"
                }`}
              >
                {button.label}
              </button>
            ))}
          </div>

          <PipelineVisibility
            activeSection={activeSection}
            currentUser={user}
            isInvestorView={isInvestorView}
            onDataChange={handlePipelineRecordsChange}
            fromDate={fromDate}
            toDate={toDate}
          />
          <PipelineSufficiency
            activeSection={activeSection}
            currentUser={user}
            fromDate={fromDate}
            toDate={toDate}
            pipelineRecords={pipelineRecords}
          />
          <RevenueConcentration
            activeSection={activeSection}
            currentUser={user}
            isInvestorView={isInvestorView}
            onAddData={() => setShowAddDataModal(true)}
            fromDate={fromDate}
            toDate={toDate}
          />
          <DemandSustainability
            activeSection={activeSection}
            currentUser={user}
            isInvestorView={isInvestorView}
            onAddData={() => setShowAddDataModal(true)}
            fromDate={fromDate}
            toDate={toDate}
          />
        </div>
      </div>

      <UniversalAddDataModal
        isOpen={showAddDataModal}
        onClose={() => setShowAddDataModal(false)}
        currentTab={activeSection}
        user={user}
        onSave={() => {
          setLoading(true);
          setTimeout(() => setLoading(false), 1000);
        }}
        loading={loading}
        fromDate={fromDate}
        toDate={toDate}
      />
    </div>
  );
}