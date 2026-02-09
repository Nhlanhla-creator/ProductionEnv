"use client"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  Ban,
  X,
  User,
  FileText,
  Building2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  GraduationCap,
  Briefcase,
  Save,
  Check,
  File,
  Award,
  TrendingUp,
} from "lucide-react"
import styles from "./all-profiles.module.css"
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"
// import { db, auth } from "../../firebaseConfig"
import databaseService from "../../services/databaseService"
import * as XLSX from 'xlsx';


function AllInterns() {
  const navigate = useNavigate()

    const [currentDatabase, setCurrentDatabase] = useState(
      databaseService.getCurrentDatabase())
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedIntern, setSelectedIntern] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editFormData, setEditFormData] = useState({})
  const [addFormData, setAddFormData] = useState({
    username: "",
    email: "",
    fullName: "",
    status: "pending",
    profile: {
      university: "",
      degree: "",
      fieldOfStudy: "",
      yearOfStudy: "",
      expectedGraduation: "",
      phone: "",
      location: "",
      skills: "",
    },
    internship: {
      department: "",
      supervisor: "",
      startDate: "",
      endDate: "",
      position: "",
    }
  })
  const [activeTab, setActiveTab] = useState("profile")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
const [internData, setInternData] = useState([]);

  const getCurrentDb = () => {
    return databaseService.getFirestore();
  }

  // ADD this effect to listen for database changes
  useEffect(() => {
    const handleDatabaseChange = () => {
      const newDatabase = databaseService.getCurrentDatabase();
      setCurrentDatabase(newDatabase);
      // Refresh data when database changes
      fetchInterns();
    };

    // Listen for storage changes
    window.addEventListener('storage', handleDatabaseChange);
    
    // Listen for custom event
    window.addEventListener('databaseChanged', handleDatabaseChange);

    return () => {
      window.removeEventListener('storage', handleDatabaseChange);
      window.removeEventListener('databaseChanged', handleDatabaseChange);
    };
  }, []);


  const fetchInterns = async () => {
    try {
      setLoading(true);
    
      const db = getCurrentDb();

      const internsRef = collection(db, 'internProfiles');
      const querySnapshot = await getDocs(internsRef);
      
      // DEBUG: Log the first document to see structure
      if (querySnapshot.docs.length > 0) {
        console.log("First Firestore document:", querySnapshot.docs[0].data());
        console.log("formData:", querySnapshot.docs[0].data().formData);
      }
      
      const fetchedInterns = querySnapshot.docs.map((doc, index) => {
        const data = doc.data();
        const formData = data.formData || {};
        
        // DEBUG: Log each document structure
        console.log(`Document ${index} formData keys:`, Object.keys(formData));
        
        // Format the date from Firestore
        const formatFirestoreDate = (timestamp) => {
          if (timestamp && timestamp.toDate) {
            return timestamp.toDate().toISOString().split('T')[0];
          }
          return timestamp || "2024-01-01";
        };
        
        const fullName = formData.fullName || 
                        formData.personalOverview?.fullName || 
                        formData.name || 
                        "Not Provided";
        
        // Get academic data
        const academicOverview = formData.academicOverview || {};
        
        const personalOverview = formData.personalOverview || {};
        return {
          id: index + 1,
          firestoreId: doc.id, 
          username: fullName.toLowerCase().replace(/\s+/g, '_') + "_2024" || `intern_${index + 1}`,
          email: data.userEmail || formData.email || 'N/A', 
          fullName: fullName,
          created: formatFirestoreDate(data.createdAt) || "2024-01-01",
          lastEdited: formatFirestoreDate(data.lastEdited) || formatFirestoreDate(data.createdAt) || "2024-01-01",
          status: data.status || formData.status || "active",
          profileImage: null,
          profile: {
            university: academicOverview.institution || 
                       academicOverview.university || 
                       formData.university || 
                       "Not Provided",
            degree: academicOverview.degree || 
                   formData.degree || 
                   "Bachelor's Degree",
            fieldOfStudy: academicOverview.fieldOfStudy || 
                         academicOverview.major || 
                         formData.fieldOfStudy || 
                         "Not Specified",
            yearOfStudy: academicOverview.yearOfStudy || 
                        formData.yearOfStudy || 
                        "Not Specified",
            expectedGraduation: academicOverview.expectedGraduation || 
                               formData.expectedGraduation || 
                               "2025-06",
            phone: personalOverview.phone || 
                   formData.phoneNumber || 
                   formData.contactNumber || 
                   "+27 XX XXX XXXX",
            location: formData.location || 
                     formData.city || 
                     formData.address || 
                     "South Africa",
            skills: formData.skills || "Not Specified",
          },
          internship: {
            department: formData.department || 
                       academicOverview.department || 
                       "To be assigned",
            supervisor: formData.supervisor || "Not assigned",
            startDate: formatFirestoreDate(formData.startDate) || 
                      formatFirestoreDate(data.createdAt) || 
                      "2024-01-01",
            endDate: formatFirestoreDate(formData.endDate) || "2024-12-31",
            position: formData.position || "Intern",
            hoursCompleted: formData.hoursCompleted || 0,
            hoursRequired: formData.hoursRequired || 600,
          },
          documents: {
            cv: { uploaded: formData.cvUploaded || false, date: formatFirestoreDate(formData.cvUploadDate) },
            transcript: { uploaded: formData.transcriptUploaded || false, date: formatFirestoreDate(formData.transcriptUploadDate) },
            applicationLetter: { uploaded: formData.applicationLetterUploaded || false, date: formatFirestoreDate(formData.applicationLetterUploadDate) },
            idDocument: { uploaded: formData.idDocumentUploaded || false, date: formatFirestoreDate(formData.idDocumentUploadDate) },
            totalUploads: formData.totalUploads || 0,
          },
          performance: {
            tasksCompleted: formData.tasksCompleted || 0,
            totalTasks: formData.totalTasks || 0,
            evaluationScore: formData.evaluationScore || 0,
            attendance: formData.attendance || 0,
            lastEvaluation: formatFirestoreDate(formData.lastEvaluation),
          },
        };
      });
      
      console.log("Fetched interns:", fetchedInterns);
      setInternData(fetchedInterns);
    } catch (error) {
      console.error("Error fetching intern data:", error);
      setInternData([]);
    } finally {
      setLoading(false);
    }
  };

    // UPDATE your useEffect
    useEffect(() => {
      fetchInterns();
    }, []); // Keep empty dependencies


// Your existing useEffect for loading simulation (remove or modify):
useEffect(() => {
  if (!loading) return; // Only run if still loading
  
  const timer = setTimeout(() => {
    // This will be overridden by the Firestore fetch, but keeps loading state
    setLoading(false);
  }, 1000);

  return () => clearTimeout(timer);
}, [loading]);

  const toggleDatabase = () => {
    // Get the new database
    const newDatabase = databaseService.toggleDatabase();
    
    // Update local state
    setCurrentDatabase(newDatabase);
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('databaseChanged', {
      detail: { database: newDatabase }
    }));
    
    // Refresh data
    fetchInterns();
    
    // Show alert for production mode
    if (newDatabase === 'production') {
      alert('⚠️ WARNING: Switched to PRODUCTION database. All data is LIVE.');
    }
  };

  const getInternDocuments = (internId) => {
    return [
      {
        id: 1,
        fileName: "CV_Resume.pdf",
        type: "cv",
        status: "approved",
        uploadDate: "2024-01-10",
        reviewDate: "2024-01-12",
        fileSize: "345 KB",
        reviewer: "HR Team",
      },
      {
        id: 2,
        fileName: "Academic_Transcript.pdf",
        type: "transcript",
        status: "approved",
        uploadDate: "2024-01-10",
        reviewDate: "2024-01-12",
        fileSize: "567 KB",
        reviewer: "HR Team",
      },
      {
        id: 3,
        fileName: "Application_Letter.pdf",
        type: "application",
        status: "approved",
        uploadDate: "2024-01-10",
        reviewDate: "2024-01-12",
        fileSize: "234 KB",
        reviewer: "HR Team",
      },
      {
        id: 4,
        fileName: "ID_Document.pdf",
        type: "id",
        status: "approved",
        uploadDate: "2024-01-10",
        reviewDate: "2024-01-12",
        fileSize: "189 KB",
        reviewer: "HR Team",
      },
    ]
  }

  const handleDocumentAction = (action, document) => {
    switch (action) {
      case "approve":
        alert(`Approving ${document.fileName}...`)
        break
      case "reject":
        if (window.confirm(`Are you sure you want to reject ${document.fileName}?`)) {
          alert(`Rejecting ${document.fileName}...`)
        }
        break
      case "download":
        alert(`Downloading ${document.fileName}...`)
        break
      case "view":
        alert(`Opening ${document.fileName} for preview...`)
        break
      case "delete":
        if (window.confirm(`Are you sure you want to delete ${document.fileName}?`)) {
          alert(`Deleting ${document.fileName}...`)
        }
        break
      default:
        break
    }
  }

  const filteredInterns = internData.filter((intern) => {
    const matchesSearch = 
      intern.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intern.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intern.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || intern.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredInterns.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentInterns = filteredInterns.slice(startIndex, endIndex)

  const handleAction = (action, intern) => {
   setSelectedIntern(intern);
  
  if (action === "view") {
    setShowViewModal(true);
    setActiveTab("profile");
  } else if (action === "edit") {
    setShowEditModal(true);
    // Set edit form data with all intern data
    setEditFormData({
      username: intern.username || "",
      email: intern.email || "",
      fullName: intern.fullName || "",
      status: intern.status || "active",
      profile: {
        university: intern.profile?.university || "",
        degree: intern.profile?.degree || "",
        fieldOfStudy: intern.profile?.fieldOfStudy || "",
        yearOfStudy: intern.profile?.yearOfStudy || "",
        phone: intern.profile?.phone || "",
        location: intern.profile?.location || "",
        skills: intern.profile?.skills || "",
      },
      internship: {
        position: intern.internship?.position || "",
        department: intern.internship?.department || "",
        supervisor: intern.internship?.supervisor || "",
        startDate: intern.internship?.startDate || "",
        endDate: intern.internship?.endDate || "",
        hoursCompleted: intern.internship?.hoursCompleted || 0,
        hoursRequired: intern.internship?.hoursRequired || 600,
      }
    });
  
  } else if (action === "block") {
    // Handle block action
    handleBlock(intern);
  } else if (action === "delete") {
    // Handle delete action
    handleDelete(intern);
  }
};

 const handleEditSave = async () => {
  try {
    if (!selectedIntern) {
      console.error("No intern selected for editing");
      setShowEditModal(false);
      return;
    }

    if (!selectedIntern.firestoreId) {
      console.error("No Firestore document ID found for intern:", selectedIntern.id);
      alert("Cannot save changes: Missing document reference. Please refresh and try again.");
      setShowEditModal(false);
      setSelectedIntern(null);
      setEditFormData({});
      return;
    }

    // Prepare the update data
    const updateData = {};
    
    // Update basic fields if changed
    if (editFormData.email && editFormData.email !== selectedIntern.email) {
      updateData.userEmail = editFormData.email;
    }
    
    // Update formData fields using dot notation
    // Basic information
    if (editFormData.fullName && editFormData.fullName !== selectedIntern.fullName) {
      updateData['formData.fullName'] = editFormData.fullName;
    }
    
    if (editFormData.status && editFormData.status !== selectedIntern.status) {
      updateData.status = editFormData.status;
    }
    
    // Academic profile
    if (editFormData.profile) {
      if (editFormData.profile.university && editFormData.profile.university !== selectedIntern.profile?.university) {
        updateData['formData.academicOverview.institution'] = editFormData.profile.university;
      }
      
      if (editFormData.profile.degree && editFormData.profile.degree !== selectedIntern.profile?.degree) {
        updateData['formData.academicOverview.degree'] = editFormData.profile.degree;
      }
      
      if (editFormData.profile.fieldOfStudy && editFormData.profile.fieldOfStudy !== selectedIntern.profile?.fieldOfStudy) {
        updateData['formData.academicOverview.fieldOfStudy'] = editFormData.profile.fieldOfStudy;
      }
      
      if (editFormData.profile.yearOfStudy && editFormData.profile.yearOfStudy !== selectedIntern.profile?.yearOfStudy) {
        updateData['formData.academicOverview.yearOfStudy'] = editFormData.profile.yearOfStudy;
      }
      
      if (editFormData.profile.phone && editFormData.profile.phone !== selectedIntern.profile?.phone) {
        updateData['formData.phone'] = editFormData.profile.phone;
      }
      
      if (editFormData.profile.location && editFormData.profile.location !== selectedIntern.profile?.location) {
        updateData['formData.location'] = editFormData.profile.location;
      }
    }
    
    // Internship details
    if (editFormData.internship) {
      if (editFormData.internship.position && editFormData.internship.position !== selectedIntern.internship?.position) {
        updateData['formData.position'] = editFormData.internship.position;
      }
      
      if (editFormData.internship.department && editFormData.internship.department !== selectedIntern.internship?.department) {
        updateData['formData.department'] = editFormData.internship.department;
      }
      
      if (editFormData.internship.supervisor && editFormData.internship.supervisor !== selectedIntern.internship?.supervisor) {
        updateData['formData.supervisor'] = editFormData.internship.supervisor;
      }
      
      if (editFormData.internship.startDate && editFormData.internship.startDate !== selectedIntern.internship?.startDate) {
        updateData['formData.startDate'] = editFormData.internship.startDate;
      }
      
      if (editFormData.internship.endDate && editFormData.internship.endDate !== selectedIntern.internship?.endDate) {
        updateData['formData.endDate'] = editFormData.internship.endDate;
      }
    }
    
    // Always update the lastEdited timestamp
    updateData.lastEdited = new Date().toISOString();
    
    // Check if there are any changes to save
    if (Object.keys(updateData).length === 1 && updateData.lastEdited) {
      console.log("No changes detected");
      setShowEditModal(false);
      setSelectedIntern(null);
      setEditFormData({});
      return;
    }
    
    // Show loading state (optional)
    setIsSaving(true);
    
    // Update in Firestore
    const db = getCurrentDb();
    const internRef = doc(db, 'internProfiles', selectedIntern.firestoreId);
    await updateDoc(internRef, updateData);
    
    // Update local state for immediate UI feedback
    const updatedInternData = internData.map(intern => {
      if (intern.id === selectedIntern.id) {
        const updatedIntern = {
          ...intern,
          // Update basic fields
          ...(editFormData.email && { email: editFormData.email }),
          ...(editFormData.fullName && { fullName: editFormData.fullName }),
          ...(editFormData.status && { status: editFormData.status }),
          lastEdited: new Date().toISOString().split('T')[0],
        };
        
        // Update profile fields
        if (editFormData.profile) {
          updatedIntern.profile = {
            ...intern.profile,
            ...(editFormData.profile.university && { university: editFormData.profile.university }),
            ...(editFormData.profile.degree && { degree: editFormData.profile.degree }),
            ...(editFormData.profile.fieldOfStudy && { fieldOfStudy: editFormData.profile.fieldOfStudy }),
            ...(editFormData.profile.yearOfStudy && { yearOfStudy: editFormData.profile.yearOfStudy }),
            ...(editFormData.profile.phone && { phone: editFormData.profile.phone }),
            ...(editFormData.profile.location && { location: editFormData.profile.location }),
          };
        }
        
        // Update internship fields
        if (editFormData.internship) {
          updatedIntern.internship = {
            ...intern.internship,
            ...(editFormData.internship.position && { position: editFormData.internship.position }),
            ...(editFormData.internship.department && { department: editFormData.internship.department }),
            ...(editFormData.internship.supervisor && { supervisor: editFormData.internship.supervisor }),
            ...(editFormData.internship.startDate && { startDate: editFormData.internship.startDate }),
            ...(editFormData.internship.endDate && { endDate: editFormData.internship.endDate }),
          };
        }
        
        return updatedIntern;
      }
      return intern;
    });
    
    setInternData(updatedInternData);
    
    // Show success message (optional)
    console.log("Intern updated successfully!");
    
    // Optional: Show a toast notification
    // toast.success("Intern details updated successfully!");
    
  } catch (error) {
    console.error("Error updating intern in Firestore:", error);
    
    // Detailed error handling
    if (error.code === 'permission-denied') {
      alert("Permission denied: You don't have permission to update this intern.");
    } else if (error.code === 'not-found') {
      alert("Intern not found: The document may have been deleted.");
    } else if (error.code === 'unavailable') {
      alert("Network error: Please check your internet connection and try again.");
    } else {
      alert(`Failed to save changes: ${error.message}`);
    }
    
    // Optionally refetch data to ensure UI consistency
    // await fetchInterns();
    
  } finally {
    // Always clean up
    setShowEditModal(false);
    setSelectedIntern(null);
    setEditFormData({});
    setIsSaving(false);
  }
};

const handleDelete = async (intern) => {
  if (window.confirm(`Are you sure you want to delete ${intern.fullName}? This action cannot be undone.`)) {
    try {
      // Remove from Firestore
      const db = getCurrentDb();
      const docRef = doc(db, 'internProfiles', intern.firestoreId);
      await deleteDoc(docRef);
      
      // Update local state
      setInternData(prev => prev.filter(i => i.id !== intern.id));
      
      alert(`${intern.fullName} has been deleted successfully.`);
    } catch (error) {
      console.error("Error deleting intern:", error);
      alert(`Failed to delete intern: ${error.message}`);
    }
  }
};

const handleBlock = async (intern) => {
  if (window.confirm(`Are you sure you want to ${intern.status === 'blocked' ? 'unblock' : 'block'} ${intern.fullName}?`)) {
    try {
      const newStatus = intern.status === 'blocked' ? 'active' : 'blocked';
      
      // Update in Firestore
      const db = getCurrentDb();
      const docRef = doc(db, 'internProfiles', intern.firestoreId);
      await updateDoc(docRef, {
        status: newStatus,
        lastEdited: new Date().toISOString()
      });
      
      // Update local state
      setInternData(prev => prev.map(i => 
        i.id === intern.id 
          ? { ...i, status: newStatus, lastEdited: new Date().toISOString().split('T')[0] }
          : i
      ));
      
      alert(`${intern.fullName} has been ${newStatus === 'blocked' ? 'blocked' : 'unblocked'} successfully.`);
    } catch (error) {
      console.error("Error blocking/unblocking intern:", error);
      alert(`Failed to update status: ${error.message}`);
    }
  }
};

  const handleAddIntern = () => {
    const newIntern = {
      id: Date.now(),
      ...addFormData,
      created: new Date().toISOString().split('T')[0],
      lastEdited: new Date().toISOString().split('T')[0],
      profileImage: null,
      documents: {
        cv: { uploaded: false, date: null },
        transcript: { uploaded: false, date: null },
        applicationLetter: { uploaded: false, date: null },
        idDocument: { uploaded: false, date: null },
        totalUploads: 0,
      },
      performance: {
        tasksCompleted: 0,
        totalTasks: 0,
        evaluationScore: 0,
        attendance: 0,
        lastEvaluation: null,
      },
    }
    
    setInternData([...internData, newIntern])
    setShowAddModal(false)
    setAddFormData({
      username: "",
      email: "",
      fullName: "",
      status: "pending",
      profile: {
        university: "",
        degree: "",
        fieldOfStudy: "",
        yearOfStudy: "",
        expectedGraduation: "",
        phone: "",
        location: "",
        skills: "",
      },
      internship: {
        department: "",
        supervisor: "",
        startDate: "",
        endDate: "",
        position: "",
      }
    })
  }

   const exportToExcel = () => {
    try {
      // Use whatever data is currently filtered/shown
      const dataToExport = filteredInterns;
      
      if (dataToExport.length === 0) {
        alert("No data to export!");
        return;
      }
      
      // Simple format - just basic data
      const excelData = dataToExport.map(intern => ({
        Username: intern.username,
        Email: intern.email,
        "Company Name": intern.companyName,
        Created: intern.created,
        Status: intern.status,
        Industry: intern.profile.industry,
        Employees: intern.profile.employees,
        Revenue: intern.profile.revenue,
      }));
      
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "SMEs");
      
      // Download
      const fileName = `SMEs_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      alert(`Exported ${dataToExport.length} records!`);
      
    } catch (error) {
      console.error("Export error:", error);
      alert("Export failed: " + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      active: styles.statusActive,
      pending: styles.statusPending,
      blocked: styles.statusBlocked,
      completed: styles.statusCompleted,
    }
    
    return (
      <span className={`${styles.statusBadge} ${statusStyles[status] || ""}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getDocumentStatusBadge = (status) => {
    const statusStyles = {
      approved: `${styles.statusBadge} ${styles.statusActive}`,
      pending: `${styles.statusBadge} ${styles.statusPending}`,
      rejected: `${styles.statusBadge} ${styles.statusBlocked}`,
    }
    
    return (
      <span className={statusStyles[status] || `${styles.statusBadge}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const TabContent = ({ tab, intern }) => {
    switch (tab) {
      case "profile":
        return (
          <div className={styles.tabContent}>
            <div className={styles.profileSection}>
              <h3>Personal Information</h3>
              <div className={styles.profileGrid}>
                <div className={styles.profileItem}>
                  <User size={16} />
                  <span>Full Name:</span>
                  <span>{intern.fullName}</span>
                </div>
                <div className={styles.profileItem}>
                  <Mail size={16} />
                  <span>Email:</span>
                  <span>{intern.email}</span>
                </div>
                <div className={styles.profileItem}>
                  <Phone size={16} />
                  <span>Phone:</span>
                  <span>{intern.profile.phone}</span>
                </div>
                <div className={styles.profileItem}>
                  <MapPin size={16} />
                  <span>Location:</span>
                  <span>{intern.profile.location}</span>
                </div>
              </div>

              <h3 style={{marginTop: '24px'}}>Academic Information</h3>
              <div className={styles.profileGrid}>
                <div className={styles.profileItem}>
                  <GraduationCap size={16} />
                  <span>University:</span>
                  <span>{intern.profile.university}</span>
                </div>
                <div className={styles.profileItem}>
                  <GraduationCap size={16} />
                  <span>Degree:</span>
                  <span>{intern.profile.degree}</span>
                </div>
                <div className={styles.profileItem}>
                  <FileText size={16} />
                  <span>Field of Study:</span>
                  <span>{intern.profile.fieldOfStudy}</span>
                </div>
                <div className={styles.profileItem}>
                  <Calendar size={16} />
                  <span>Year of Study:</span>
                  <span>{intern.profile.yearOfStudy}</span>
                </div>
                <div className={styles.profileItem}>
                  <Calendar size={16} />
                  <span>Expected Graduation:</span>
                  <span>{formatDate(intern.profile.expectedGraduation)}</span>
                </div>
                <div className={styles.profileItem}>
                  <Award size={16} />
                  <span>Skills:</span>
                  <span>{intern.profile.skills}</span>
                </div>
              </div>
            </div>
          </div>
        )
      case "internship":
        return (
          <div className={styles.tabContent}>
            <div className={styles.applicationSection}>
              <h3>Internship Details</h3>
              <div className={styles.applicationCard}>
                <div className={styles.applicationDetails}>
                  <p><strong>Position:</strong> {intern.internship.position}</p>
                  <p><strong>Department:</strong> {intern.internship.department}</p>
                  <p><strong>Supervisor:</strong> {intern.internship.supervisor}</p>
                  <p><strong>Start Date:</strong> {formatDate(intern.internship.startDate)}</p>
                  <p><strong>End Date:</strong> {formatDate(intern.internship.endDate)}</p>
                  <p><strong>Hours Progress:</strong> {intern.internship.hoursCompleted} / {intern.internship.hoursRequired} hours</p>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill} 
                      style={{width: `${(intern.internship.hoursCompleted / intern.internship.hoursRequired) * 100}%`}}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      case "performance":
        return (
          <div className={styles.tabContent}>
            <div className={styles.applicationSection}>
              <h3>Performance Metrics</h3>
              <div className={styles.applicationCard}>
                <div className={styles.applicationDetails}>
                  <p><strong>Tasks Completed:</strong> {intern.performance.tasksCompleted} / {intern.performance.totalTasks}</p>
                  <p><strong>Evaluation Score:</strong> {intern.performance.evaluationScore} / 5.0</p>
                  <p><strong>Attendance:</strong> {intern.performance.attendance}%</p>
                  <p><strong>Last Evaluation:</strong> {intern.performance.lastEvaluation ? formatDate(intern.performance.lastEvaluation) : "Not evaluated yet"}</p>
                </div>
                <div className={styles.performanceStats}>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{intern.performance.tasksCompleted}</div>
                    <div className={styles.statLabel}>Tasks Completed</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{intern.performance.evaluationScore}</div>
                    <div className={styles.statLabel}>Evaluation Score</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{intern.performance.attendance}%</div>
                    <div className={styles.statLabel}>Attendance</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      case "documents":
        const internDocuments = getInternDocuments(intern.id)
        return (
          <div className={styles.tabContent}>
            <div className={styles.documentsSection}>
              <div className={styles.sectionHeader}>
                <h3>Documents</h3>
                <div className={styles.documentStats}>
                  <span className={styles.statBadge}>
                    Total: {internDocuments.length}
                  </span>
                  <span className={styles.statBadge}>
                    Approved: {internDocuments.filter(doc => doc.status === 'approved').length}
                  </span>
                </div>
              </div>
              
              <div className={styles.documentsTableContainer}>

                <table className={styles.documentsTable}>
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Upload Date</th>
                      <th>Review Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {internDocuments.map((document) => (
                      <tr key={document.id}>
                        <td>
                          <div className={styles.documentCell}>
                            <File size={16} className={styles.fileIcon} />
                            <div className={styles.documentInfo}>
                              <span className={styles.fileName}>{document.fileName}</span>
                              <span className={styles.fileSize}>{document.fileSize}</span>
                            </div>
                          </div>
                        </td>
                        <td>{document.type.toUpperCase()}</td>
                        <td>{getDocumentStatusBadge(document.status)}</td>
                        <td>{formatDate(document.uploadDate)}</td>
                        <td>{formatDate(document.reviewDate)}</td>
                        <td>
                          <div className={styles.actions}>
                            <button
                              className={styles.actionBtn}
                              onClick={() => handleDocumentAction("view", document)}
                              title="View Document"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              className={styles.actionBtn}
                              onClick={() => handleDocumentAction("download", document)}
                              title="Download"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              className={styles.actionBtn}
                              onClick={() => handleDocumentAction("delete", document)}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      default:
        return <div>Content not found</div>
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading Interns...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>All Interns</h1>
          <p className={styles.subtitle}>Manage and monitor all intern accounts</p>
        </div>
         <div className={styles.headerActions}>
                 <button className={styles.actionButton} onClick={exportToExcel}>
                 <Download size={16} />
                 Export to Excel
               </button>
          <button className={styles.primaryButton} onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add Intern
          </button>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by username, email, or full name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterContainer}>
          <Filter size={16} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      <div className={styles.tableContainer}>
         <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '80px',
                    backgroundColor: currentDatabase === 'testing' ? '#4CAF50' : '#f44336',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    zIndex: 1000,
                    cursor: 'pointer'
                  }} onClick={toggleDatabase}>
                    {currentDatabase === 'testing' ? '🟢 TESTING' : '🔴 PRODUCTION'}
                  </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>Institution</th>
              <th>Field Of Study</th>
              <th>Start Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentInterns.map((intern) => (
              <tr key={intern.id}>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.userAvatar}>
                      {intern.profileImage ? (
                        <img src={intern.profileImage} alt={intern.fullName} />
                      ) : (
                        <span>{intern.fullName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span>{intern.fullName}</span>
                  </div>
                </td>
                <td>{intern.email}</td>
                <td>{intern.profile.university}</td>
                <td>{intern.profile.fieldOfStudy}</td>
                <td>{formatDate(intern.internship.startDate)}</td>
                <td>{getStatusBadge(intern.status)}</td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("view", intern)}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("edit", intern)}
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("block", intern)}
                      title="Block"
                    >
                      <Ban size={16} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("delete", intern)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className={styles.pagination}>
        <div className={styles.paginationInfo}>
          Showing {startIndex + 1} to {Math.min(endIndex, filteredInterns.length)} of {filteredInterns.length} results
        </div>
        <div className={styles.paginationControls}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={styles.paginationBtn}
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <span className={styles.pageNumber}>
            {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={styles.paginationBtn}
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && selectedIntern && (
        <div className={styles.modalOverlay} onClick={() => setShowViewModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <h2>{selectedIntern.fullName}</h2>
                <p>{selectedIntern.email}</p>
              </div>
              <button
                className={styles.closeButton}
                onClick={() => setShowViewModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalTabs}>
              <button
                className={`${styles.tab} ${activeTab === "profile" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("profile")}
              >
                <User size={16} />
                Profile
              </button>
              <button
                className={`${styles.tab} ${activeTab === "internship" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("internship")}
              >
                <Briefcase size={16} />
                Internship Details
              </button>
              <button
                className={`${styles.tab} ${activeTab === "performance" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("performance")}
              >
                <TrendingUp size={16} />
                Performance
              </button>
              <button
                className={`${styles.tab} ${activeTab === "documents" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("documents")}
              >
                <FileText size={16} />
                Documents
              </button>
            </div>

            <div className={styles.modalBody}>
              <TabContent tab={activeTab} intern={selectedIntern} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedIntern && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <h2>Edit Intern: {selectedIntern.fullName}</h2>
                <p>Update intern information</p>
              </div>
              <button
                className={styles.closeButton}
                onClick={() => setShowEditModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.editForm}>
                <div className={styles.formSection}>
                  <h3>Basic Information</h3>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Username</label>
                      <input
                        type="text"
                        value={editFormData.username || ""}
                        onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Email</label>
                      <input
                        type="email"
                        value={editFormData.email || ""}
                        onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={editFormData.fullName || ""}
                        onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Status</label>
                      <select
                        value={editFormData.status || ""}
                        onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                        className={styles.formSelect}
                      >
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h3>Academic Profile</h3>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>University</label>
                      <input
                        type="text"
                        value={editFormData.profile?.university || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, university: e.target.value}
                        })}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Degree</label>
                      <input
                        type="text"
                        value={editFormData.profile?.degree || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, degree: e.target.value}
                        })}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Field of Study</label>
                      <input
                        type="text"
                        value={editFormData.profile?.fieldOfStudy || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, fieldOfStudy: e.target.value}
                        })}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Year of Study</label>
                      <input
                        type="text"
                        value={editFormData.profile?.yearOfStudy || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, yearOfStudy: e.target.value}
                        })}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Phone</label>
                      <input
                        type="text"
                        value={editFormData.profile?.phone || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, phone: e.target.value}
                        })}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Location</label>
                      <input
                        type="text"
                        value={editFormData.profile?.location || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          profile: {...editFormData.profile, location: e.target.value}
                        })}
                        className={styles.formInput}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h3>Internship Details</h3>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Position</label>
                      <input
                        type="text"
                        value={editFormData.internship?.position || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          internship: {...editFormData.internship, position: e.target.value}
                        })}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Department</label>
                      <input
                        type="text"
                        value={editFormData.internship?.department || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          internship: {...editFormData.internship, department: e.target.value}
                        })}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Supervisor</label>
                      <input
                        type="text"
                        value={editFormData.internship?.supervisor || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          internship: {...editFormData.internship, supervisor: e.target.value}
                        })}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Start Date</label>
                      <input
                        type="date"
                        value={editFormData.internship?.startDate || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          internship: {...editFormData.internship, startDate: e.target.value}
                        })}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>End Date</label>
                      <input
                        type="date"
                        value={editFormData.internship?.endDate || ""}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          internship: {...editFormData.internship, endDate: e.target.value}
                        })}
                        className={styles.formInput}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.saveButton}
                    onClick={handleEditSave}
                  >
                    <Save size={16} />
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <h2>Add New Intern</h2>
                <p>Create a new intern account</p>
              </div>
              <button
                className={styles.closeButton}
                onClick={() => setShowAddModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.editForm}>
                <div className={styles.formSection}>
                  <h3>Basic Information</h3>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Username *</label>
                      <input
                        type="text"
                        value={addFormData.username}
                        onChange={(e) => setAddFormData({...addFormData, username: e.target.value})}
                        className={styles.formInput}
                        placeholder="Enter username"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Email *</label>
                      <input
                        type="email"
                        value={addFormData.email}
                        onChange={(e) => setAddFormData({...addFormData, email: e.target.value})}
                        className={styles.formInput}
                        placeholder="Enter email"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Full Name *</label>
                      <input
                        type="text"
                        value={addFormData.fullName}
                        onChange={(e) => setAddFormData({...addFormData, fullName: e.target.value})}
                        className={styles.formInput}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Status</label>
                      <select
                        value={addFormData.status}
                        onChange={(e) => setAddFormData({...addFormData, status: e.target.value})}
                        className={styles.formSelect}
                      >
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h3>Academic Profile (Optional)</h3>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>University</label>
                      <input
                        type="text"
                        value={addFormData.profile.university}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, university: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="Enter university"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Degree</label>
                      <input
                        type="text"
                        value={addFormData.profile.degree}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, degree: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="Enter degree"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Field of Study</label>
                      <input
                        type="text"
                        value={addFormData.profile.fieldOfStudy}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, fieldOfStudy: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="Enter field of study"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Year of Study</label>
                      <input
                        type="text"
                        value={addFormData.profile.yearOfStudy}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, yearOfStudy: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="e.g., 3rd Year"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Phone</label>
                      <input
                        type="text"
                        value={addFormData.profile.phone}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, phone: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Location</label>
                      <input
                        type="text"
                        value={addFormData.profile.location}
                        onChange={(e) => setAddFormData({
                          ...addFormData, 
                          profile: {...addFormData.profile, location: e.target.value}
                        })}
                        className={styles.formInput}
                        placeholder="Enter location"
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.saveButton}
                    onClick={handleAddIntern}
                    disabled={!addFormData.username || !addFormData.email || !addFormData.fullName}
                  >
                    <Check size={16} />
                    Create Intern
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AllInterns