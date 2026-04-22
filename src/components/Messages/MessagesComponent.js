"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../firebaseConfig";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Download,
  FileText,
  ImageIcon,
  X,
  Paperclip,
  Search,
  Trash2,
  CheckSquare,
  Square,
  RefreshCw,
  Inbox,
  Send,
  File,
} from "lucide-react";
import "./MessagesComponent.css";

const MessagesComponent = ({ config = {} }) => {
  const {
    supportAttachments,
    showSearchIcon,
    hasRecipientDropdown,
    recipientsLoader = null,
  } = config;

  const [activeTab, setActiveTab] = useState("inbox");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [newMessage, setNewMessage] = useState({
    to: "",
    toName: "",
    subject: "",
    content: "",
    attachments: [],
  });
  const [messages, setMessages] = useState([]);
  const [senderName, setSenderName] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [trashCount, setTrashCount] = useState(0);
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selection state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Pagination - load 20 at a time
  const [visibleCount, setVisibleCount] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messagesListRef = useRef(null);

  // Advisor-specific state
  const [recipients, setRecipients] = useState([]);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [filteredRecipients, setFilteredRecipients] = useState([]);

  const fileInputRef = useRef(null);
  const storage = getStorage();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      // Reset visible count when search changes
      setVisibleCount(20);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load recipients (Advisors only)
  useEffect(() => {
    if (!hasRecipientDropdown || !recipientsLoader) return;
    recipientsLoader().then(setRecipients);
  }, [hasRecipientDropdown, recipientsLoader]);

  const getContainerStyles = () => {
    return {
      minHeight: "calc(100vh - 80px)",
      maxWidth: "100vw",
      overflowX: "hidden",
      boxSizing: "border-box",
      position: "relative",
      transition: "margin-left 0.3s ease",
      backgroundColor: "#f8f9fa",
    };
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper to check if a message is in trash (deleted within 30 days)
  const isInTrash = useCallback((msg) => {
    if (!msg.deleted) return false;
    if (!msg.deletedAt) return true;
    const deletedDate = new Date(msg.deletedAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return deletedDate > thirtyDaysAgo;
  }, []);

  // SINGLE COMBINED FETCH - Fixes the Firestore assertion error
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    let isMounted = true;

    // Query for messages TO the user
    const toQuery = query(collection(db, "messages"), where("to", "==", user.uid));
    
    // Query for messages FROM the user
    const fromQuery = query(collection(db, "messages"), where("from", "==", user.uid));

    const unsubscribeTo = onSnapshot(toQuery, (snapshot) => {
      if (!isMounted) return;
      const toMessages = [];
      snapshot.forEach((doc) => {
        toMessages.push({ id: doc.id, ...doc.data(), type: "inbox" });
      });

      setMessages((prev) => {
        const fromMessages = prev.filter((msg) => msg.type === "sent");
        const drafts = prev.filter((msg) => msg.type === "drafts");
        return [...toMessages, ...fromMessages, ...drafts];
      });
      
      const unread = toMessages.filter((msg) => !msg.read && !msg.deleted).length;
      setUnreadCount(unread);
      setLoading(false);
    });

    const unsubscribeFrom = onSnapshot(fromQuery, (snapshot) => {
      if (!isMounted) return;
      const fromMessages = [];
      snapshot.forEach((doc) => {
        fromMessages.push({ id: doc.id, ...doc.data(), type: "sent" });
      });

      setMessages((prev) => {
        const toMessages = prev.filter((msg) => msg.type === "inbox");
        const drafts = prev.filter((msg) => msg.type === "drafts");
        return [...toMessages, ...fromMessages, ...drafts];
      });
    });

    return () => {
      isMounted = false;
      unsubscribeTo();
      unsubscribeFrom();
    };
  }, []);

  // Update trash count whenever messages change
  useEffect(() => {
    const count = messages.filter(msg => isInTrash(msg)).length;
    setTrashCount(count);
  }, [messages, isInTrash]);

  // Filtered messages
  const filteredMessages = useMemo(() => {
    return messages
      .filter((msg) => {
        if (activeTab === "trash") {
          return isInTrash(msg);
        }
        return msg.type === activeTab && !msg.deleted;
      })
      .filter((msg) =>
        debouncedSearch === "" ||
        msg.subject?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        msg.sender?.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [messages, activeTab, debouncedSearch, isInTrash]);

  // Visible messages for pagination
  const visibleMessages = useMemo(() => {
    return filteredMessages.slice(0, visibleCount);
  }, [filteredMessages, visibleCount]);

  // Check if there are more messages to load
  const hasMoreMessages = visibleCount < filteredMessages.length;

  // Load more messages
  const loadMoreMessages = useCallback(() => {
    if (isLoadingMore || !hasMoreMessages) return;
    
    setIsLoadingMore(true);
    // Simulate loading delay for better UX
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + 20, filteredMessages.length));
      setIsLoadingMore(false);
    }, 500);
  }, [isLoadingMore, hasMoreMessages, filteredMessages.length]);

  // Infinite scroll listener
  useEffect(() => {
    const messagesList = messagesListRef.current;
    if (!messagesList) return;
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = messagesList;
      if (scrollTop + clientHeight >= scrollHeight - 100 && hasMoreMessages && !isLoadingMore) {
        loadMoreMessages();
      }
    };
    
    messagesList.addEventListener('scroll', handleScroll);
    return () => messagesList.removeEventListener('scroll', handleScroll);
  }, [hasMoreMessages, isLoadingMore, loadMoreMessages]);

  // Reset visible count when tab or search changes
  useEffect(() => {
    setVisibleCount(20);
  }, [activeTab, debouncedSearch]);

  // Update selectAll when selection changes
  useEffect(() => {
    if (visibleMessages.length > 0 && selectedMessages.size === visibleMessages.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedMessages, visibleMessages]);

  const handleMessageSelect = async (msg) => {
    if (selectMode) {
      setSelectedMessages((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(msg.id)) {
          newSet.delete(msg.id);
        } else {
          newSet.add(msg.id);
        }
        return newSet;
      });
      return;
    }

    setSelectedMessage(msg);
    if (!msg.read && !msg.deleted) {
      await updateDoc(doc(db, "messages", msg.id), { read: true });
      // Update local state immediately
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, read: true } : m))
      );
    }

    if (msg.from) {
      try {
        const senderDoc = await getDoc(doc(db, "universalProfiles", msg.from));
        if (senderDoc.exists()) {
          const data = senderDoc.data();
          const senderName =
            data?.smeName ||
            data?.formData?.entityOverview?.tradingName ||
            data?.formData?.entityOverview?.registeredName ||
            data?.formData?.contactDetails?.contactName ||
            msg.fromName ||
            "Unknown Sender";
          setSenderName(senderName);
        } else {
          setSenderName(msg.fromName || "Unknown Sender");
        }
      } catch (error) {
        console.error("Error fetching sender name:", error);
        setSenderName(msg.fromName || "Unknown Sender");
      }
    } else {
      setSenderName(msg.fromName || "Unknown Sender");
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedMessages(new Set());
      setSelectAll(false);
    } else {
      const newSet = new Set();
      visibleMessages.forEach((msg) => newSet.add(msg.id));
      setSelectedMessages(newSet);
      setSelectAll(true);
    }
  };

  // Soft delete selected messages (move to trash)
  const handleDeleteSelected = async () => {
    if (selectedMessages.size === 0) {
      alert("No messages selected");
      return;
    }

    const confirmDelete = window.confirm(
      `Move ${selectedMessages.size} selected message(s) to trash? They will be automatically deleted after 30 days.`
    );
    if (!confirmDelete) return;

    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();
      for (const messageId of selectedMessages) {
        const messageRef = doc(db, "messages", messageId);
        batch.update(messageRef, { deleted: true, deletedAt: now });
      }
      await batch.commit();

      // Update local state immediately
      setMessages(prev => prev.map(msg => 
        selectedMessages.has(msg.id) ? { ...msg, deleted: true, deletedAt: now } : msg
      ));
      
      setSelectedMessages(new Set());
      setSelectMode(false);
      setSelectAll(false);
      
      if (selectedMessage && selectedMessages.has(selectedMessage.id)) {
        setSelectedMessage(null);
      }
      
      alert(`${selectedMessages.size} message(s) moved to trash`);
    } catch (error) {
      console.error("Error deleting messages:", error);
      alert("Failed to delete messages. Please try again.");
    }
  };

 // Update the handlePermanentDeleteSelected function
const handlePermanentDeleteSelected = async () => {
  if (selectedMessages.size === 0) {
    alert("No messages selected");
    return;
  }

  const confirmDelete = window.confirm(
    `⚠️ Permanently delete ${selectedMessages.size} selected message(s)? This action cannot be undone.`
  );
  if (!confirmDelete) return;

  try {
    const batch = writeBatch(db);
    for (const messageId of selectedMessages) {
      const messageRef = doc(db, "messages", messageId);
      batch.delete(messageRef);
    }
    await batch.commit();

    setMessages(prev => prev.filter(msg => !selectedMessages.has(msg.id)));
    setSelectedMessages(new Set());
    setSelectMode(false);
    setSelectAll(false);
    
    if (selectedMessage && selectedMessages.has(selectedMessage.id)) {
      setSelectedMessage(null);
    }
    
    alert(`${selectedMessages.size} message(s) permanently deleted`);
  } catch (error) {
    console.error("Error permanently deleting messages:", error);
    alert("Failed to delete messages. Please try again.");
  }
};


  // Update the handleRestoreSelected function
const handleRestoreSelected = async () => {
  if (selectedMessages.size === 0) {
    alert("No messages selected");
    return;
  }

  const confirmRestore = window.confirm(
    `Restore ${selectedMessages.size} selected message(s) to inbox?`
  );
  if (!confirmRestore) return;

  try {
    const batch = writeBatch(db);
    for (const messageId of selectedMessages) {
      const messageRef = doc(db, "messages", messageId);
      batch.update(messageRef, { deleted: false, deletedAt: null });
    }
    await batch.commit();

    setMessages(prev => prev.map(msg => 
      selectedMessages.has(msg.id) ? { ...msg, deleted: false, deletedAt: null } : msg
    ));
    
    setSelectedMessages(new Set());
    setSelectMode(false);
    setSelectAll(false);
    
    alert(`${selectedMessages.size} message(s) restored to inbox`);
  } catch (error) {
    console.error("Error restoring messages:", error);
    alert("Failed to restore messages. Please try again.");
  }
};

  // Single message delete (soft delete)
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Move this message to trash? It will be automatically deleted after 30 days.");
    if (!confirmDelete) return;

    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, "messages", id), { 
        deleted: true, 
        deletedAt: now 
      });
      // Update local state immediately
      setMessages(prev => prev.map(msg => 
        msg.id === id ? { ...msg, deleted: true, deletedAt: now } : msg
      ));
      if (selectedMessage?.id === id) setSelectedMessage(null);
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message. Please try again.");
    }
  };

  // Single message permanent delete from trash
  // Replace the handlePermanentDelete function with confirmation
const handlePermanentDelete = async (id) => {
  const confirmDelete = window.confirm("⚠️ Permanently delete this message? This action cannot be undone.");
  if (!confirmDelete) return;

  try {
    await deleteDoc(doc(db, "messages", id));
    setMessages(prev => prev.filter(msg => msg.id !== id));
    if (selectedMessage?.id === id) setSelectedMessage(null);
  } catch (error) {
    console.error("Error permanently deleting message:", error);
    alert("Failed to delete message. Please try again.");
  }
};

  // Replace the handleRestore function with confirmation
const handleRestore = async (id) => {
  const confirmRestore = window.confirm("Restore this message to inbox?");
  if (!confirmRestore) return;

  try {
    await updateDoc(doc(db, "messages", id), { deleted: false, deletedAt: null });
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, deleted: false, deletedAt: null } : msg
    ));
    if (selectedMessage?.id === id) {
      setSelectedMessage(null);
    }
  } catch (error) {
    console.error("Error restoring message:", error);
    alert("Failed to restore message. Please try again.");
  }
};

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedMessages(new Set());
    setSelectAll(false);
  };

  const uploadFilesAndGetURLs = async (files, senderId) => {
    const urls = [];
    for (const file of files) {
      const fileRef = ref(
        storage,
        `messages/${senderId}/${Date.now()}_${file.name}`
      );
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      urls.push(url);
    }
    return urls;
  };

  const handleReply = async () => {
    if (!selectedMessage) return;

    let name = "Unknown SME";
    try {
      const docRef = await getDoc(
        doc(db, "universalProfiles", selectedMessage.from)
      );
      if (docRef.exists()) {
        const data = docRef.data();
        name =
          data?.smeName ||
          data?.formData?.entityOverview?.tradingName ||
          data?.formData?.entityOverview?.registeredName ||
          selectedMessage.fromName ||
          "Unknown SME";
      }
    } catch (error) {
      console.error("Error fetching recipient name:", error);
    }

    setNewMessage({
      to: selectedMessage.from,
      toName: name,
      subject: `Re: ${selectedMessage.subject}`,
      content: "",
      attachments: [],
    });
    setAttachmentFiles([]);
    setIsComposing(true);
  };

  const handleForward = () => {
    if (!selectedMessage) return;
    setNewMessage({
      to: "",
      toName: "",
      subject: `Fwd: ${selectedMessage.subject}`,
      content: `\n\n----- Forwarded Message -----\nFrom: ${senderName || selectedMessage.fromName
        }\nDate: ${formatDate(selectedMessage.date)}\n\n${selectedMessage.content
        }`,
      attachments: [],
    });
    setAttachmentFiles([]);
    setIsComposing(true);
  };

  const handleSend = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    if (!newMessage.subject || !newMessage.content.trim()) {
      alert("Please fill in subject and message");
      return;
    }

    let fromName = "Investment Team";
    try {
      const userDoc = await getDoc(doc(db, "MyuniversalProfiles", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        fromName =
          data?.formData?.entityOverview?.tradingName ||
          data?.formData?.entityOverview?.registeredName ||
          data?.company ||
          "Investment Team";
      }
    } catch (error) {
      console.error("Error fetching sender profile:", error);
    }

    let attachmentURLs = [];
    if (supportAttachments && attachmentFiles.length > 0) {
      attachmentURLs = await uploadFilesAndGetURLs(attachmentFiles, user.uid);
    }

    const messagePayload = {
      from: user.uid,
      fromName: fromName,
      to: newMessage.to,
      toName: newMessage.toName,
      subject: newMessage.subject,
      content: newMessage.content,
      attachments: attachmentURLs,
      date: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, "messages"), {
        ...messagePayload,
        type: "inbox",
        read: false,
        sender: fromName,
      });

      await addDoc(collection(db, "messages"), {
        ...messagePayload,
        type: "sent",
        read: true,
        sender: "You",
      });

      setIsComposing(false);
      setNewMessage({
        to: "",
        toName: "",
        subject: "",
        content: "",
        attachments: [],
      });
      setAttachmentFiles([]);
      setActiveTab("sent");
      alert("Message sent!");
    } catch (error) {
      console.error("Send failed:", error);
      alert("Failed to send message.");
    }
  };

  const handleFileAttachment = (event) => {
    const files = Array.from(event.target.files);
    setAttachmentFiles((prev) => [...prev, ...files]);
    setNewMessage((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...files.map((file) => file.name)],
    }));
  };

  // Keep all your existing termsheet functions (they remain unchanged)
  const [uploadingDocument, setUploadingDocument] = useState(false);

  const handleSignedDocumentUpload = async (event, messageId) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const file = event.target.files[0];
    if (!file) return;

    setUploadingDocument(true);

    try {
      const storage = getStorage();
      const signedFileRef = ref(
        storage,
        `signed_documents/${user.uid}/${messageId}/${Date.now()}_${file.name}`
      );
      
      await uploadBytes(signedFileRef, file);
      const signedDocumentUrl = await getDownloadURL(signedFileRef);
      
      setSelectedMessage({
        ...selectedMessage,
        tempSignedDocument: {
          name: file.name,
          url: signedDocumentUrl,
          uploadedAt: new Date().toISOString()
        }
      });

      alert("Document uploaded successfully! You can now proceed with acceptance.");
      
    } catch (error) {
      console.error("Error uploading signed document:", error);
      alert("Failed to upload signed document. Please try again.");
    } finally {
      setUploadingDocument(false);
      event.target.value = '';
    }
  };

  const handleAcceptWithUploadedDocument = async (message) => {
    if (!message.tempSignedDocument) {
      alert("Please upload a signed document first.");
      return;
    }

    const confirmAccept = window.confirm(
      "Are you sure you want to accept this termsheet with the uploaded signed document?"
    );
    
    if (!confirmAccept) return;

    try {
      await handleTermsheetResponse(
        message.id,
        "accepted",
        message.attachments?.[0],
        null,
        message.tempSignedDocument.url
      );
    } catch (error) {
      console.error("Error accepting termsheet:", error);
      alert("Failed to accept termsheet. Please try again.");
    }
  };

  const handleTermsheetResponse = async (messageId, status, termsheetUrl, feedback = null, signedDocumentUrl = null) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    try {
      await updateDoc(doc(db, "messages", messageId), {
        termsheetResponse: {
          status: status,
          feedback: feedback,
          signedDocumentUrl: signedDocumentUrl,
          respondedAt: new Date().toISOString(),
          respondedBy: user.uid
        }
      });

      const messageDoc = await getDoc(doc(db, "messages", messageId));
      const messageData = messageDoc.data();

      if (messageData.applicationId) {
        try {
          const investorAppRef = doc(db, "investorApplications", messageData.applicationId);
          await updateDoc(investorAppRef, {
            termsheetStatus: status,
            termsheetFeedback: feedback,
            termsheetSignedDocument: signedDocumentUrl,
            termsheetRespondedAt: new Date().toISOString(),
          });
        } catch (e) {}

        try {
          const catalystAppRef = doc(db, "catalystApplications", messageData.applicationId);
          await updateDoc(catalystAppRef, {
            supportAgreementStatus: status,
            supportAgreementFeedback: feedback,
            supportAgreementSignedDocument: signedDocumentUrl,
            supportAgreementRespondedAt: new Date().toISOString(),
          });
        } catch (e) {}

        const smeQuery = query(
          collection(db, "smeApplications"),
          where("smeId", "==", user.uid),
          where("funderId", "==", messageData.from)
        );
        const smeSnapshot = await getDocs(smeQuery);
        if (!smeSnapshot.empty) {
          await updateDoc(smeSnapshot.docs[0].ref, {
            termsheetStatus: status,
            termsheetFeedback: feedback,
            termsheetSignedDocument: signedDocumentUrl,
            termsheetRespondedAt: new Date().toISOString(),
          });
        }

        try {
          const smeCatalystQuery = query(
            collection(db, "smeCatalystApplications"),
            where("smeId", "==", user.uid)
          );
          const smeCatalystSnap = await getDocs(smeCatalystQuery);
          if (!smeCatalystSnap.empty) {
            await updateDoc(smeCatalystSnap.docs[0].ref, {
              supportAgreementStatus: status,
              supportAgreementFeedback: feedback,
              supportAgreementSignedDocument: signedDocumentUrl,
              supportAgreementRespondedAt: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.warn("Could not update smeCatalystApplications:", e.message);
        }
      }

      let statusText = "";
      switch(status) {
        case "accepted":
          statusText = "Accepted with Signed Document";
          break;
        case "accepted_with_conditions":
          statusText = "Accepted with Conditions";
          break;
        case "declined":
          statusText = "Declined";
          break;
      }

      await addDoc(collection(db, "messages"), {
        from: user.uid,
        fromName: "SME",
        to: messageData.from,
        subject: `Termsheet ${statusText}: ${messageData.subject}`,
        content: `The termsheet has been ${status}.${feedback ? `\n\nFeedback: ${feedback}` : ''}${signedDocumentUrl ? '\n\nSigned document has been uploaded.' : ''}`,
        date: new Date().toISOString(),
        type: "inbox",
        read: false,
        applicationId: messageData.applicationId,
        termsheetResponse: {
          status: status,
          feedback: feedback,
          signedDocumentUrl: signedDocumentUrl,
          respondedAt: new Date().toISOString()
        }
      });

      alert(`Termsheet ${status === "accepted" ? 'accepted' : status === "accepted_with_conditions" ? 'accepted with conditions' : 'declined'} successfully!`);
      window.location.reload();
    } catch (error) {
      console.error("Error responding to termsheet:", error);
      alert("Failed to process termsheet response. Please try again.");
    }
  };

  const handleSaveDraft = () => {
    const draft = {
      id: `draft-${Date.now()}`,
      subject: newMessage.subject,
      content: newMessage.content,
      date: new Date().toISOString(),
      read: true,
      type: "drafts",
      fromName: "You",
    };
    setMessages([draft, ...messages]);
    setIsComposing(false);
    setActiveTab("drafts");
  };

  const handleFileDownload = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file. Please try again.");
    }
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();
    if (
      ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(extension)
    ) {
      return <ImageIcon size={16} className="file-icon" />;
    } else if (extension === "pdf") {
      return <FileText size={16} className="file-icon pdf-icon" />;
    } else if (["doc", "docx"].includes(extension)) {
      return <FileText size={16} className="file-icon doc-icon" />;
    } else if (["xls", "xlsx"].includes(extension)) {
      return <FileText size={16} className="file-icon excel-icon" />;
    } else {
      return <FileText size={16} className="file-icon" />;
    }
  };

  const handleFileView = (fileUrl, fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();

    if (
      ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(extension)
    ) {
      window.open(fileUrl, "_blank");
    } else if (extension === "pdf") {
      window.open(fileUrl, "_blank");
    } else {
      handleFileDownload(fileUrl, fileName);
    }
  };

  const removeAttachment = (index) => {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== index));
    setNewMessage((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleRecipientSearch = (e) => {
    const value = e.target.value;
    setNewMessage({ ...newMessage, toName: value });
    if (value.length > 0) {
      setFilteredRecipients(
        recipients.filter((r) =>
          r.name.toLowerCase().includes(value.toLowerCase())
        )
      );
      setShowRecipientDropdown(true);
    } else {
      setShowRecipientDropdown(false);
    }
  };

  const selectRecipient = (recipient) => {
    setNewMessage({
      ...newMessage,
      to: recipient.id,
      toName: recipient.name,
    });
    setShowRecipientDropdown(false);
  };

  const renderSearchInput = () => {
    if (!showSearchIcon) {
      return (
        <input
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      );
    }

    return (
      <div className="search-input-container">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="messages-page" style={getContainerStyles()}>
        <div style={{ textAlign: "center", padding: "50px", color: "var(--brown-6)" }}>
          Loading messages...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="messages-page" style={getContainerStyles()}>
        <div className="messages-header">
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <h2 style={{ margin: 0 }}>
              Messages{" "}
              {unreadCount > 0 && (
                <span className="notification-dot">{unreadCount}</span>
              )}
            </h2>
            {!selectMode && visibleMessages.length > 0 && activeTab !== "trash" && (
              <button
                onClick={() => setSelectMode(true)}
                className="select-mode-btn"
                style={{
                  background: "linear-gradient(to bottom right, var(--brown-5), var(--brown-6))",
                  color: "white",
                  border: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                }}
              >
                <CheckSquare size={14} />
                Select
              </button>
            )}
          </div>
          
          <div className="search-bar">
            {renderSearchInput()}
            
            {!selectMode && (
              <button
                className="new-message-btn"
                onClick={() => {
                  setIsComposing(true);
                  setSelectedMessage(null);
                }}
              >
                + New Message
              </button>
            )}
          </div>
        </div>

        {selectMode && (
          <div className="selection-bar" style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 20px",
            backgroundColor: "#e3f2fd",
            borderBottom: "1px solid #90caf9",
          }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button
                onClick={handleSelectAll}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#1976d2",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {selectAll ? <Square size={14} /> : <CheckSquare size={14} />}
                {selectAll ? "Deselect All" : "Select All"}
              </button>
              <span style={{ fontSize: "13px", color: "#333" }}>
                {selectedMessages.size} selected
              </span>
            </div>
            
            <div style={{ display: "flex", gap: "8px" }}>
              {activeTab === "trash" ? (
                <>
                  <button
                    onClick={handleRestoreSelected}
                    disabled={selectedMessages.size === 0}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: selectedMessages.size === 0 ? "#ccc" : "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: selectedMessages.size === 0 ? "not-allowed" : "pointer",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      opacity: selectedMessages.size === 0 ? 0.6 : 1,
                    }}
                  >
                    <RefreshCw size={14} />
                    Restore
                  </button>
                  <button
                    onClick={handlePermanentDeleteSelected}
                    disabled={selectedMessages.size === 0}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: selectedMessages.size === 0 ? "#ccc" : "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: selectedMessages.size === 0 ? "not-allowed" : "pointer",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      opacity: selectedMessages.size === 0 ? 0.6 : 1,
                    }}
                  >
                    <Trash2 size={14} />
                    Delete Forever
                  </button>
                </>
              ) : (
                <button
                  onClick={handleDeleteSelected}
                  disabled={selectedMessages.size === 0}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: selectedMessages.size === 0 ? "#ccc" : "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: selectedMessages.size === 0 ? "not-allowed" : "pointer",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    opacity: selectedMessages.size === 0 ? 0.6 : 1,
                  }}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              )}
              
              <button
                onClick={exitSelectMode}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="messages-container">
          <div className="messages-sidebar">
            <div className="messages-tabs">
              <button
                className={`tab-btn ${activeTab === "inbox" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("inbox");
                  setSelectedMessage(null);
                  exitSelectMode();
                }}
              >
                <Inbox size={14} />
                Inbox ({unreadCount})
              </button>
              <button
                className={`tab-btn ${activeTab === "sent" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("sent");
                  setSelectedMessage(null);
                  exitSelectMode();
                }}
              >
                <Send size={14} />
                Sent
              </button>
              <button
                className={`tab-btn ${activeTab === "drafts" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("drafts");
                  setSelectedMessage(null);
                  exitSelectMode();
                }}
              >
                <File size={14} />
                Drafts
              </button>
              <button
                className={`tab-btn ${activeTab === "trash" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("trash");
                  setSelectedMessage(null);
                  exitSelectMode();
                }}
              >
                <Trash2 size={14} />
                Trash ({trashCount})
              </button>
            </div>

            <div className="messages-list" ref={messagesListRef}>
              {visibleMessages.length > 0 ? (
                <>
                  {visibleMessages.map((message) => {
                    const displayName =
                      message.type === "inbox"
                        ? message.fromName || message.sender || "Investment Team"
                        : message.toName || "Unknown SME";
                    const isSelected = selectedMessages.has(message.id);

                    return (
                      <div
                        key={message.id}
                        className={`message-item ${!message.read && !message.deleted ? "unread" : ""
                          } ${selectedMessage?.id === message.id ? "selected" : ""
                          } ${selectMode ? "select-mode" : ""}`}
                        onClick={() => handleMessageSelect(message)}
                      >
                        {selectMode && (
                          <div className="message-checkbox" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleMessageSelect(message)}
                            />
                          </div>
                        )}
                        <div className="message-content-wrapper">
                          <div className="message-sender-line">
                            <span className="message-sender">{displayName}</span>
                            <span className="message-date">
                              {formatDate(message.date)}
                            </span>
                          </div>
                          <div className="message-subject-line">
                            {message.subject}
                          </div>
                          <div className="message-preview">
                            {message.content?.substring(0, 80)}...
                          </div>
                          <div className="message-meta">
                            {message.attachments &&
                              message.attachments.length > 0 && (
                                <span className="attachment-indicator">📎</span>
                              )}
                          </div>
                        </div>
                        {!selectMode && activeTab !== "trash" && (
                          <button
                            className="message-item-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(message.id);
                            }}
                            title="Move to trash"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        {!selectMode && activeTab === "trash" && (
                          <div className="message-item-actions">
                            <button
                              className="message-item-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestore(message.id);
                              }}
                              title="Restore to inbox"
                              style={{ color: "#28a745" }}
                            >
                              <RefreshCw size={14} />
                            </button>
                            <button
                              className="message-item-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePermanentDelete(message.id);
                              }}
                              title="Permanently delete"
                              style={{ color: "#dc3545" }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {hasMoreMessages && (
                    <div 
                      ref={(el) => {
                        if (el && !isLoadingMore) {
                          const observer = new IntersectionObserver(
                            (entries) => {
                              if (entries[0].isIntersecting && hasMoreMessages && !isLoadingMore) {
                                loadMoreMessages();
                              }
                            },
                            { threshold: 0.1 }
                          );
                          observer.observe(el);
                          return () => observer.disconnect();
                        }
                      }}
                      style={{ textAlign: "center", padding: "20px", color: "var(--brown-6)" }}
                    >
                      {isLoadingMore ? "Loading more..." : "Scroll for more"}
                    </div>
                  )}
                </>
              ) : (
                <div className="no-messages">
                  {activeTab === "trash" 
                    ? "No messages in trash" 
                    : debouncedSearch
                      ? "No messages match your search"
                      : "No messages found"}
                </div>
              )}
            </div>
          </div>

          <div className="message-content">
            {isComposing ? (
              <div className="compose-message">
                <div className="compose-header">
                  <h3>
                    {selectedMessage ? "Reply to Message" : "New Message"}
                  </h3>
                  <button
                    className="close-compose"
                    onClick={() => setIsComposing(false)}
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="compose-form">
                  <div className="form-group">
                    <label>To:</label>
                    {hasRecipientDropdown ? (
                      <div className="recipient-input-wrapper">
                        <input
                          type="text"
                          value={newMessage.toName}
                          onChange={handleRecipientSearch}
                          placeholder="Search recipient..."
                        />
                        {showRecipientDropdown &&
                          filteredRecipients.length > 0 && (
                            <div className="recipient-dropdown">
                              {filteredRecipients.map((recipient) => (
                                <div
                                  key={recipient.id}
                                  className="recipient-item"
                                  onClick={() => selectRecipient(recipient)}
                                >
                                  {recipient.name}
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={newMessage.toName}
                        disabled
                        placeholder="Recipient Name"
                      />
                    )}
                  </div>
                  <div className="form-group">
                    <label>Subject:</label>
                    <input
                      type="text"
                      value={newMessage.subject}
                      onChange={(e) =>
                        setNewMessage({
                          ...newMessage,
                          subject: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group message-textarea">
                    <label>Message:</label>
                    <textarea
                      value={newMessage.content}
                      onChange={(e) =>
                        setNewMessage({
                          ...newMessage,
                          content: e.target.value,
                        })
                      }
                      rows="12"
                      placeholder="Write your message here..."
                    />
                  </div>

                  {supportAttachments && attachmentFiles.length > 0 && (
                    <div className="attachments-preview">
                      <h4>Attachments:</h4>
                      <div className="attachment-list">
                        {attachmentFiles.map((file, index) => (
                          <div key={index} className="attachment-item">
                            {getFileIcon(file.name)}
                            <span className="attachment-name">{file.name}</span>
                            <button
                              className="view-attachment"
                              onClick={() => handleFileView(file.name)}
                              title="Preview file"
                            >
                              <ImageIcon size={12} />
                            </button>
                            <button
                              className="remove-attachment"
                              onClick={() => removeAttachment(index)}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="compose-actions">
                    <div className="primary-actions">
                      <button className="send-btn" onClick={handleSend}>
                        Send
                      </button>
                      <button
                        className="save-draft-btn"
                        onClick={handleSaveDraft}
                      >
                        Save Draft
                      </button>
                    </div>
                    {supportAttachments && (
                      <div className="secondary-actions">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileAttachment}
                          multiple
                          style={{ display: "none" }}
                        />
                        <button
                          className="attach-btn"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Paperclip size={16} />
                          Attach Files
                        </button>
                        <button
                          className="cancel-btn"
                          onClick={() => setIsComposing(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    {!supportAttachments && (
                      <div className="secondary-actions">
                        <button
                          className="cancel-btn"
                          onClick={() => setIsComposing(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : selectedMessage ? (
              <>
                <div className="message-header">
                  <h3>{selectedMessage.subject}</h3>
                  <div className="message-meta">
                    <div>
                      <span className="meta-label">From:</span>{" "}
                      <span className="sender">{senderName}</span>
                    </div>
                    {selectedMessage.recipient && (
                      <div>
                        <span className="meta-label">To:</span>{" "}
                        <span className="recipient">
                          {selectedMessage.recipient}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="meta-label">Date:</span>{" "}
                      <span className="date">
                        {formatDate(selectedMessage.date)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="message-body">
                  {selectedMessage.content?.split("\n\nMeeting Details:")[0] && (
                    <p style={{ whiteSpace: "pre-wrap", marginBottom: "1rem" }}>
                      {selectedMessage.content.split("\n\nMeeting Details:")[0]}
                    </p>
                  )}

                  {selectedMessage.content?.includes("Meeting Details:") &&
                    (() => {
                      const parts = selectedMessage.content.split(
                        "\n\nMeeting Details:"
                      );
                      const details = parts[1];
                      if (!details) return null;

                      const timeMatch = details.match(/Time:\s*(.+)/);
                      const locationMatch = details.match(/Location:\s*(.+)/);
                      const timeText = timeMatch
                        ? timeMatch[1].trim()
                        : "Not specified";
                      const rsvpLink = timeText.includes("http")
                        ? timeText.match(/\[(.*?)\]/)?.[1]
                        : null;

                      return (
                        <div className="meeting-details-box">
                          <h4>Meeting Details</h4>
                          <p>
                            <strong>Time:</strong>{" "}
                            {rsvpLink ? (
                              <a
                                href={rsvpLink}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                click to RSVP
                              </a>
                            ) : (
                              timeText
                            )}
                          </p>
                          <p>
                            <strong>Location:</strong>{" "}
                            {locationMatch
                              ? locationMatch[1].trim()
                              : "Not specified"}
                          </p>
                        </div>
                      );
                    })()}

                  {(selectedMessage.subject?.includes("Termsheet Shared") || 
                    selectedMessage.subject?.includes("Support Approved") ||
                    selectedMessage.subject?.includes("Support Agreement")) && 
                    !selectedMessage.termsheetResponse && (
                    <div className="termsheet-actions">
                      <h4>
                        {selectedMessage.subject?.includes("Support") 
                          ? "Support Agreement Response Required"
                          : "Termsheet Response Required"}
                      </h4>
                      <p>
                        {selectedMessage.subject?.includes("Support")
                          ? "Please review the attached support agreement and indicate your decision:"
                          : "Please review the attached termsheet and indicate your decision:"}
                      </p>

                      {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                        <div className="termsheet-document">
                          <a
                            href={selectedMessage.attachments[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="document-link"
                          >
                            <FileText size={20} />
                            {selectedMessage.subject?.includes("Support")
                              ? "View Support Agreement Document"
                              : "View Termsheet Document"}
                          </a>
                          
                          <button
                            className="download-doc-btn"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = selectedMessage.attachments[0];
                              link.download = selectedMessage.attachments[0].split('/').pop().split('?')[0] || 'document.pdf';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                          >
                            <Download size={16} />
                            Download
                          </button>
                        </div>
                      )}

                      <div className="termsheet-upload-section">
                        <p className="upload-instruction">
                          Please download the document, sign it, and upload the signed version here before accepting.
                        </p>
                        
                        <div className="upload-controls">
                          <input
                            type="file"
                            id="signed-document-upload"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            style={{ display: 'none' }}
                            onChange={(e) => handleSignedDocumentUpload(e, selectedMessage.id)}
                          />
                          <button
                            className="upload-btn"
                            onClick={() => document.getElementById('signed-document-upload')?.click()}
                          >
                            <Paperclip size={16} />
                            {selectedMessage.tempSignedDocument ? 'Replace Signed Document' : 'Upload Signed Document'}
                          </button>
                          
                          {selectedMessage.tempSignedDocument && (
                            <div className="uploaded-file-info">
                              <FileText size={16} />
                              <span>{selectedMessage.tempSignedDocument.name}</span>
                              <button
                                className="remove-file-btn"
                                onClick={() => {
                                  const updatedMessage = {...selectedMessage};
                                  delete updatedMessage.tempSignedDocument;
                                  setSelectedMessage(updatedMessage);
                                }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="termsheet-response-buttons three-options">
                        <button
                          className={`accept-btn ${!selectedMessage.tempSignedDocument ? 'disabled' : ''}`}
                          onClick={() => {
                            if (selectedMessage.tempSignedDocument) {
                              handleAcceptWithUploadedDocument(selectedMessage);
                            }
                          }}
                          disabled={!selectedMessage.tempSignedDocument}
                          title={!selectedMessage.tempSignedDocument ? 'Please upload signed document first' : ''}
                        >
                          <span className="btn-icon">✓</span>
                          Accept
                        </button>

                        <button
                          className="conditions-btn"
                          onClick={() => {
                            const conditions = prompt(
                              selectedMessage.subject?.includes("Support")
                                ? "Please outline your conditions for accepting the support agreement:"
                                : "Please outline your conditions for accepting the termsheet:"
                            );
                            if (conditions && conditions.trim() !== "") {
                              if (!selectedMessage.tempSignedDocument) {
                                alert("Please upload the signed document first.");
                                return;
                              }
                              handleTermsheetResponse(
                                selectedMessage.id,
                                "accepted_with_conditions",
                                selectedMessage.attachments?.[0],
                                conditions,
                                selectedMessage.tempSignedDocument.url
                              );
                            } else if (conditions !== null) {
                              alert("Please provide your conditions for acceptance.");
                            }
                          }}
                        >
                          <span className="btn-icon">⚡</span>
                          Accept with Conditions
                        </button>

                        <button
                          className="decline-btn"
                          onClick={() => {
                            const feedback = prompt(
                              selectedMessage.subject?.includes("Support")
                                ? "Please provide feedback on why you're declining the support agreement:"
                                : "Please provide feedback on why you're declining the termsheet:"
                            );
                            if (feedback && feedback.trim() !== "") {
                              handleTermsheetResponse(
                                selectedMessage.id,
                                "declined",
                                selectedMessage.attachments?.[0],
                                feedback
                              );
                            } else if (feedback !== null) {
                              alert("Please provide feedback for declining.");
                            }
                          }}
                        >
                          <span className="btn-icon">✗</span>
                          Decline
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedMessage.termsheetResponse && (
                    <div className={`termsheet-status ${selectedMessage.termsheetResponse.status === "accepted" ? "accepted" : 
                      selectedMessage.termsheetResponse.status === "accepted_with_conditions" ? "conditions" : "declined"}`}>
                      <h4>
                        {selectedMessage.termsheetResponse.status === "accepted" && 
                          "✓ " + (selectedMessage.subject?.includes("Support") ? "Agreement Accepted" : "Termsheet Accepted")}
                        {selectedMessage.termsheetResponse.status === "accepted_with_conditions" && 
                          "⚡ " + (selectedMessage.subject?.includes("Support") ? "Agreement Accepted with Conditions" : "Termsheet Accepted with Conditions")}
                        {selectedMessage.termsheetResponse.status === "declined" && 
                          "✗ " + (selectedMessage.subject?.includes("Support") ? "Agreement Declined" : "Termsheet Declined")}
                      </h4>
                      {selectedMessage.termsheetResponse.feedback && (
                        <p className="feedback-text">
                          <strong>Feedback:</strong> {selectedMessage.termsheetResponse.feedback}
                        </p>
                      )}
                      <p>Responded: {new Date(selectedMessage.termsheetResponse.respondedAt).toLocaleString()}</p>
                      {selectedMessage.termsheetResponse.signedDocumentUrl && (
                        <p className="signed-document-info">
                          <FileText size={16} />
                          <a 
                            href={selectedMessage.termsheetResponse.signedDocumentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            View Signed Document
                          </a>
                        </p>
                      )}
                    </div>
                  )}
                  
                  {supportAttachments &&
                    selectedMessage.attachments &&
                    selectedMessage.attachments.length > 0 && (
                      <div className="attachments">
                        <h4>
                          Attachments ({selectedMessage.attachments.length}):
                        </h4>
                        <div className="attachment-list">
                          {selectedMessage.attachments.map((file, index) => (
                            <div key={index} className="attachment-item">
                              <a
                                href={file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="attachment-name"
                              >
                                {file.split("/").pop().split("?")[0]}
                              </a>
                              <button
                                className="download-btn"
                                onClick={() => window.open(file)}
                                title="Download"
                              >
                                <Download size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                <div className="message-actions">
                  <button className="reply-btn" onClick={handleReply}>
                    Reply
                  </button>
                  <button className="forward-btn" onClick={handleForward}>
                    Forward
                  </button>
                  {activeTab !== "trash" ? (
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(selectedMessage.id)}
                    >
                      Delete
                    </button>
                  ) : (
                    <>
                      <button
                        className="restore-btn"
                        onClick={() => handleRestore(selectedMessage.id)}
                        style={{
                          background: "linear-gradient(to bottom right, #28a745, #20c997)",
                          color: "white",
                          border: "none",
                          padding: "0.6rem 1.2rem",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <RefreshCw size={14} />
                        Restore
                      </button>
                      <button
                        className="permanent-delete-btn"
                        onClick={() => handlePermanentDelete(selectedMessage.id)}
                        style={{
                          background: "linear-gradient(to bottom right, #dc3545, #c82333)",
                          color: "white",
                          border: "none",
                          padding: "0.6rem 1.2rem",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <Trash2 size={14} />
                        Delete Forever
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="no-message-selected">
                <div className="empty-state-icon">✉️</div>
                <h3>Select a message to read</h3>
                <p>Choose a message from the list to view its contents</p>
                <button
                  className="new-message-btn"
                  onClick={() => setIsComposing(true)}
                >
                  + New Message
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesComponent;