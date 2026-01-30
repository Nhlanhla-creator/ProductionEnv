"use client";

import { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  updateDoc,
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
} from "lucide-react";
import "./MessagesComponent.css";

const MessagesComponent = ({ config = {} }) => {
  const {
    supportAttachments, // Whether to allow file attachments
    showSearchIcon, // Whether to wrap search input with icon
    hasRecipientDropdown, // For Advisors
    recipientsLoader = null, // Function to load recipients (for Advisors)
  } = config;

  const [activeTab, setActiveTab] = useState("inbox");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
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
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      if (typeof document !== "undefined" && document.body) {
        return document.body.classList.contains("sidebar-collapsed");
      }
      return localStorage.getItem("sidebarOpen") === "false";
    } catch (e) {
      return false;
    }
  });

  // Advisor-specific state
  const [recipients, setRecipients] = useState([]);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [filteredRecipients, setFilteredRecipients] = useState([]);

  const fileInputRef = useRef(null);
  const storage = getStorage();

  // Sidebar detection (if enabled)
  useEffect(() => {
    const update = () => {
      try {
        if (document && document.body) {
          setIsSidebarCollapsed(
            document.body.classList.contains("sidebar-collapsed")
          );
        } else {
          setIsSidebarCollapsed(
            localStorage.getItem("sidebarOpen") === "false"
          );
        }
      } catch (e) {
        setIsSidebarCollapsed(false);
      }
    };

    // MutationObserver watches body class changes like in MyInvestments
    let observer = null;
    try {
      if (document && document.body && window.MutationObserver) {
        observer = new MutationObserver(() => update());
        observer.observe(document.body, {
          attributes: true,
          attributeFilter: ["class"],
        });
      }
    } catch (e) {
      // noop
    }

    // Also listen to events used elsewhere in the app
    window.addEventListener("sidebarToggle", update);
    window.addEventListener("storage", update);

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener("sidebarToggle", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  // Load recipients (Advisors only)
  useEffect(() => {
    if (!hasRecipientDropdown || !recipientsLoader) return;
    recipientsLoader().then(setRecipients);
  }, [hasRecipientDropdown, recipientsLoader]);

  const getContainerStyles = () => {
    const expandedLeft = 280;
    const collapsedLeft = 80;

    return {
      minHeight: "calc(100vh - 80px)",
      maxWidth: "100vw",
      overflowX: "hidden",
      padding: "10px 0",
      marginLeft: isSidebarCollapsed
        ? `${collapsedLeft}px`
        : `${expandedLeft}px`,
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

  const filteredMessages = messages
    .filter(
      (msg) =>
        msg.type === activeTab &&
        (searchQuery === "" ||
          msg.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.sender?.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Fetch inbox messages
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, "messages"), where("to", "==", user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const inboxMessages = [];
      querySnapshot.forEach((doc) => {
        inboxMessages.push({ id: doc.id, ...doc.data() });
      });

      setMessages((prevMessages) => {
        const sentMessages = prevMessages.filter((msg) => msg.type === "sent");
        const draftMessages = prevMessages.filter(
          (msg) => msg.type === "drafts"
        );
        return [...inboxMessages, ...sentMessages, ...draftMessages];
      });
      setUnreadCount(inboxMessages.filter((msg) => !msg.read).length);
    });

    return () => unsubscribe();
  }, []);

  // Fetch sent messages
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, "messages"), where("from", "==", user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const sentMessages = [];
      querySnapshot.forEach((doc) => {
        sentMessages.push({ id: doc.id, ...doc.data(), type: "sent" });
      });

      setMessages((prevMessages) => {
        const inboxMessages = prevMessages.filter(
          (msg) => msg.type === "inbox"
        );
        const draftMessages = prevMessages.filter(
          (msg) => msg.type === "drafts"
        );
        return [...inboxMessages, ...sentMessages, ...draftMessages];
      });
    });

    return () => unsubscribe();
  }, []);

  const handleMessageSelect = async (msg) => {
    setSelectedMessage(msg);
    if (!msg.read) {
      await updateDoc(doc(db, "messages", msg.id), { read: true });
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
      content: `\n\n----- Forwarded Message -----\nFrom: ${
        senderName || selectedMessage.fromName
      }\nDate: ${formatDate(selectedMessage.date)}\n\n${
        selectedMessage.content
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

  const handleDelete = async (id) => {
    try {
      await updateDoc(doc(db, "messages", id), { deleted: true });
      setMessages(messages.filter((msg) => msg.id !== id));
      if (selectedMessage?.id === id) setSelectedMessage(null);
    } catch (error) {
      console.error("Error deleting message:", error);
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

  return (
    <div >
      <div className="messages-page" style={getContainerStyles()}>
        <div className="messages-header">
          <h2>
            Messages{" "}
            {unreadCount > 0 && (
              <span className="notification-dot">{unreadCount}</span>
            )}
          </h2>
          <div className="search-bar">
            {renderSearchInput()}
            <button
              className="new-message-btn"
              onClick={() => {
                setIsComposing(true);
                setSelectedMessage(null);
              }}
            >
              + New Message
            </button>
          </div>
        </div>

        <div className="messages-container">
          <div className="messages-sidebar">
            <div className="messages-tabs">
              <button
                className={`tab-btn ${activeTab === "inbox" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("inbox");
                  setSelectedMessage(null);
                }}
              >
                Inbox (
                {
                  messages.filter((msg) => msg.type === "inbox" && !msg.read)
                    .length
                }
                )
              </button>
              <button
                className={`tab-btn ${activeTab === "sent" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("sent");
                  setSelectedMessage(null);
                }}
              >
                Sent
              </button>
              <button
                className={`tab-btn ${activeTab === "drafts" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("drafts");
                  setSelectedMessage(null);
                }}
              >
                Drafts ({messages.filter((msg) => msg.type === "drafts").length}
                )
              </button>
            </div>

            <div className="messages-list">
              {filteredMessages.length > 0 ? (
                filteredMessages.map((message) => {
                  const displayName =
                    message.type === "inbox"
                      ? message.fromName || message.sender || "Investment Team"
                      : message.toName || "Unknown SME";

                  return (
                    <div
                      key={message.id}
                      className={`message-item ${
                        !message.read ? "unread" : ""
                      } ${
                        selectedMessage?.id === message.id ? "selected" : ""
                      }`}
                      onClick={() => handleMessageSelect(message)}
                    >
                      <div className="message-sender">{displayName}</div>
                      <div className="message-subject">{message.subject}</div>
                      <div className="message-preview">
                        {message.content.substring(0, 60)}...
                      </div>
                      <div className="message-meta">
                        <span className="message-date">
                          {formatDate(message.date)}
                        </span>
                        {message.attachments &&
                          message.attachments.length > 0 && (
                            <span className="attachment-indicator">📎</span>
                          )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-messages">
                  {searchQuery
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
                  {selectedMessage.content.split("\n\nMeeting Details:")[0] && (
                    <p style={{ whiteSpace: "pre-wrap", marginBottom: "1rem" }}>
                      {selectedMessage.content.split("\n\nMeeting Details:")[0]}
                    </p>
                  )}

                  {selectedMessage.content.includes("Meeting Details:") &&
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
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(selectedMessage.id)}
                  >
                    Delete
                  </button>
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
