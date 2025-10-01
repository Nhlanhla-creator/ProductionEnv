"use client"

import { useState, useEffect, useRef } from "react"
import "./Messages.css"
import { collection, query, where, onSnapshot, doc, getDoc, addDoc, updateDoc } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { db } from "../../firebaseConfig"
import { Search, Plus, Reply, Forward, Trash2, Paperclip, X, Download, FileText, ImageIcon } from "lucide-react"

const Messages = () => {
  const [activeTab, setActiveTab] = useState("inbox")
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isComposing, setIsComposing] = useState(false)
  const [newMessage, setNewMessage] = useState({
    to: "",
    toName: "",
    subject: "",
    content: "",
    attachments: [],
  })
  const [messages, setMessages] = useState([])
  const [senderName, setSenderName] = useState("")
  const [unreadCount, setUnreadCount] = useState(0)
  const [attachmentFiles, setAttachmentFiles] = useState([])
  const [previousRecipients, setPreviousRecipients] = useState([])
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const fileInputRef = useRef(null)

  // Add sidebar detection
  useEffect(() => {
    const checkSidebarState = () => {
      setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"))
    }

    // Check initial state
    checkSidebarState()

    // Watch for changes
    const observer = new MutationObserver(checkSidebarState)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  const formatDate = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const filteredMessages = messages
    .filter(
      (msg) =>
        msg.type === activeTab &&
        (searchQuery === "" ||
          msg.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.sender?.toLowerCase().includes(searchQuery.toLowerCase())),
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort newest to oldest

  useEffect(() => {
    const auth = getAuth()
    const user = auth.currentUser
    if (!user) return

    const q = query(collection(db, "messages"), where("to", "==", user.uid))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const inboxMessages = []
      querySnapshot.forEach((doc) => {
        inboxMessages.push({ id: doc.id, ...doc.data() })
      })

      setMessages((prevMessages) => {
        const sentMessages = prevMessages.filter((msg) => msg.type === "sent")
        return [...inboxMessages, ...sentMessages]
      })
      setUnreadCount(inboxMessages.filter((msg) => !msg.read).length)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const auth = getAuth()
    const user = auth.currentUser
    if (!user) return

    const q = query(collection(db, "messages"), where("from", "==", user.uid))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const sentMessages = []
      querySnapshot.forEach((doc) => {
        sentMessages.push({ id: doc.id, ...doc.data(), type: "sent" })
      })

      setMessages((prevMessages) => {
        const inboxMessages = prevMessages.filter((msg) => msg.type === "inbox")
        return [...inboxMessages, ...sentMessages]
      })
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const auth = getAuth()
    const user = auth.currentUser
    if (!user) return

    // Get all unique recipients from sent messages
    const sentMessages = messages.filter(msg => msg.type === "sent")
    const uniqueRecipients = [...new Set(sentMessages.map(msg => msg.to))]

    // Fetch recipient names
    const fetchRecipientNames = async () => {
      const recipientsWithNames = await Promise.all(
        uniqueRecipients.map(async (recipientId) => {
          try {
            const docRef = await getDoc(doc(db, "MyuniversalProfiles", recipientId))
            if (docRef.exists()) {
              const data = docRef.data()
              const name =
                data?.formData?.fundManageOverview?.tradingName ||
                data?.formData?.fundManageOverview?.registeredName ||
                data?.formData?.fundDetails?.funds?.[0]?.name ||
                data?.formData?.contactDetails?.primaryContactName||
                "Unnamed User"
              return { id: recipientId, name }
            }
          } catch (error) {
            console.error("Error fetching recipient:", error)
          }
          return { id: recipientId, name: "Unknown" }
        })
      )
      setPreviousRecipients(recipientsWithNames.filter(r => r))
    }

    if (sentMessages.length > 0) {
      fetchRecipientNames()
    }
  }, [messages])

 const handleMessageSelect = async (msg) => {
  setSelectedMessage(msg)
  if (!msg.read) {
    await updateDoc(doc(db, "messages", msg.id), { read: true })
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, read: true } : m)))
  }

  if (msg.from === "BIG Fundability System") {
    setSenderName("BIG Fundability System")
    return
  }

  if (msg.from) {
    try {
      // Helper function to extract name from profile data
      const extractNameFromProfile = (data, profileType) => {
        switch (profileType) {
          case 'MyuniversalProfiles':
            return data?.formData?.fundManageOverview?.tradingName ||
                   data?.formData?.fundManageOverview?.registeredName ||
                   data?.formData?.fundDetails?.funds?.[0]?.name ||
                   data?.formData?.contactDetails?.primaryContactName ||
                   null

          case 'advisorProfiles':
            return data?.formData?.personalInfo?.fullName ||
                   data?.formData?.personalInfo?.firstName + ' ' + data?.formData?.personalInfo?.lastName ||
                   data?.formData?.contactInfo?.email ||
                   data?.formData?.professionalInfo?.companyName ||
                   null

          case 'catalystProfiles':
            return data?.formData?.personalInfo?.fullName ||
                   data?.formData?.personalInfo?.firstName + ' ' + data?.formData?.personalInfo?.lastName ||
                   data?.formData?.contactInfo?.email ||
                   data?.formData?.organizationInfo?.organizationName ||
                   null

          case 'internProfiles':
            return data?.formData?.personalInfo?.fullName ||
                   data?.formData?.personalInfo?.firstName + ' ' + data?.formData?.personalInfo?.lastName ||
                   data?.formData?.contactInfo?.email ||
                   data?.formData?.academicInfo?.university ||
                   null

          default:
            return null
        }
      }

      // List of profile collections to search through
      const profileCollections = [
        'MyuniversalProfiles',
        'advisorProfiles', 
        'catalystProfiles',
        'internProfiles'
      ]

      let senderName = null

      // Search through each profile collection
      for (const collection of profileCollections) {
        try {
          const senderDoc = await getDoc(doc(db, collection, msg.from))
          if (senderDoc.exists()) {
            const data = senderDoc.data()
            senderName = extractNameFromProfile(data, collection)
            
            if (senderName) {
              console.log(`Found sender in ${collection}:`, senderName)
              break // Exit loop once we find a valid name
            }
          }
        } catch (error) {
          console.error(`Error checking ${collection}:`, error)
          continue // Continue to next collection if this one fails
        }
      }

      // Set the sender name or fallback
      setSenderName(senderName || "Unknown Sender")

    } catch (error) {
      console.error("Error in handleMessageSelect:", error)
      setSenderName("Unknown Sender")
    }
  } else {
    setSenderName("No Sender Info")
  }
}


  const handleReply = async () => {
  if (!selectedMessage) return

  // Helper function to extract name from profile data (same as above)
  const extractNameFromProfile = (data, profileType) => {
    switch (profileType) {
      case 'MyuniversalProfiles':
        return data?.formData?.fundManageOverview?.tradingName ||
               data?.formData?.fundManageOverview?.registeredName ||
               data?.formData?.fundDetails?.funds?.[0]?.name ||
               data?.formData?.contactDetails?.primaryContactName ||
               null

      case 'advisorProfiles':
        return data?.formData?.personalInfo?.fullName ||
               data?.formData?.personalInfo?.firstName + ' ' + data?.formData?.personalInfo?.lastName ||
               data?.formData?.contactInfo?.email ||
               data?.formData?.professionalInfo?.companyName ||
               null

      case 'catalystProfiles':
        return data?.formData?.personalInfo?.fullName ||
               data?.formData?.personalInfo?.firstName + ' ' + data?.formData?.personalInfo?.lastName ||
               data?.formData?.contactInfo?.email ||
               data?.formData?.organizationInfo?.organizationName ||
               null

      case 'internProfiles':
        return data?.formData?.personalInfo?.fullName ||
               data?.formData?.personalInfo?.firstName + ' ' + data?.formData?.personalInfo?.lastName ||
               data?.formData?.contactInfo?.email ||
               data?.formData?.academicInfo?.university ||
               null

      default:
        return null
    }
  }

  const profileCollections = [
    'MyuniversalProfiles',
    'advisorProfiles',
    'catalystProfiles', 
    'internProfiles'
  ]

  let name = "Unknown User"

  // Search through each profile collection
  for (const collection of profileCollections) {
    try {
      const docRef = await getDoc(doc(db, collection, selectedMessage.from))
      if (docRef.exists()) {
        const data = docRef.data()
        name = extractNameFromProfile(data, collection)
        
        if (name) {
          break // Exit loop once we find a valid name
        }
      }
    } catch (error) {
      console.error(`Error checking ${collection}:`, error)
      continue
    }
  }

  setNewMessage({
    to: selectedMessage.from,
    toName: name,
    subject: `Re: ${selectedMessage.subject}`,
    content: "",
    attachments: [],
  })
  setAttachmentFiles([])
  setIsComposing(true)
}

  const handleForward = () => {
    if (!selectedMessage) return
    setNewMessage({
      to: "",
      toName: "",
      subject: `Fwd: ${selectedMessage.subject}`,
      content: `\n\n---- Forwarded Message ----\nFrom: ${selectedMessage.sender}\nDate: ${formatDate(selectedMessage.date)}\n\n${selectedMessage.content}`,
      attachments: selectedMessage.attachments || [],
    })
    setAttachmentFiles([])
    setIsComposing(true)
  }

  const handleFileAttachment = (event) => {
    const files = Array.from(event.target.files)
    setAttachmentFiles((prev) => [...prev, ...files])
    setNewMessage((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...files.map((file) => file.name)],
    }))
  }

  const removeAttachment = (index) => {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== index))
    setNewMessage((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }))
  }

  const handleSend = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    if (!newMessage.subject || !newMessage.content.trim()) {
      alert("Please fill in subject and message");
      return;
    }

    // Format attachments consistently
    const formattedAttachments = attachmentFiles.map(file => ({
      name: file.name,
      type: file.type,
      size: file.size,
      url: "" // You'll need to upload and get URL in a real implementation
    }));

    const base = {
      from: user.uid,
      to: newMessage.to,
      toName: newMessage.toName,
      subject: newMessage.subject,
      content: newMessage.content,
      attachments: formattedAttachments,
      date: new Date().toISOString(),
      read: false,
    };

    try {
      await addDoc(collection(db, "messages"), { ...base, type: "inbox" });
      await addDoc(collection(db, "messages"), { ...base, read: true, type: "sent" });

      setIsComposing(false);
      setNewMessage({ to: "", toName: "", subject: "", content: "", attachments: [] });
      setAttachmentFiles([]);
      setActiveTab("sent");
      alert("Message sent successfully!");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    }
  };

  const handleDelete = (id) => {
    setMessages(messages.filter((msg) => msg.id !== id))
    if (selectedMessage?.id === id) setSelectedMessage(null)
  }

  const handleSaveDraft = () => {
    const draft = {
      id: `draft-${Date.now()}`,
      subject: newMessage.subject || "(No subject)",
      content: newMessage.content,
      attachments: newMessage.attachments,
      date: new Date().toISOString(),
      read: true,
      type: "drafts",
    }
    setMessages([draft, ...messages])
    setIsComposing(false)
    setActiveTab("drafts")
  }

  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase()
    if (["jpg", "jpeg", "png", "gif", "bmp", "svg"].includes(extension)) {
      return <ImageIcon size={16} />
    } else {
      return <FileText size={16} />
    }
  }

  const handleFileDownload = (fileName, fileData) => {
    // Create a blob URL for the file
    const blob = new Blob([fileData], { type: "application/octet-stream" })
    const url = window.URL.createObjectURL(blob)

    // Create a temporary link element and trigger download
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const handleFileView = (fileName) => {
    // For images, open in new tab
    const extension = fileName.split(".").pop().toLowerCase()
    if (["jpg", "jpeg", "png", "gif", "bmp", "svg"].includes(extension)) {
      // In a real app, you'd have the actual file URL
      window.open(`/files/${fileName}`, "_blank")
    } else {
      // For other files, trigger download
      alert(`Viewing ${fileName} - In a real app, this would open the file viewer`)
    }
  }

  // Responsive container styles
  const getContainerStyles = () => ({
    width: "100%",
    minHeight: "100vh",
    maxWidth: "100vw",
    overflowX: "hidden",
    padding: `80px 20px 20px ${isSidebarCollapsed ? "100px" : "290px"}`,
    margin: "0",
    boxSizing: "border-box",
    position: "relative",
    transition: "padding 0.3s ease"
  })

  return (
    <div className="messages-page" style={getContainerStyles()}>
      <div className="messages-header">
        <h2>Messages {unreadCount > 0 && <span className="notification-dot">{unreadCount}</span>}</h2>
        <div className="search-bar">
          <div className="search-input-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className="new-message-btn"
            onClick={() => {
              setIsComposing(true)
              setSelectedMessage(null)
            }}
          >
            <Plus size={16} />
            New Message
          </button>
        </div>
      </div>

      <div className="messages-container">
        <div className="messages-sidebar">
          <div className="messages-tabs">
            <button
              className={`tab-btn ${activeTab === "inbox" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("inbox")
                setSelectedMessage(null)
              }}
            >
              Inbox ({messages.filter((msg) => msg.type === "inbox" && !msg.read).length})
            </button>
            <button
              className={`tab-btn ${activeTab === "sent" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("sent")
                setSelectedMessage(null)
              }}
            >
              Sent
            </button>
            <button
              className={`tab-btn ${activeTab === "drafts" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("drafts")
                setSelectedMessage(null)
              }}
            >
              Drafts ({messages.filter((msg) => msg.type === "drafts").length})
            </button>
          </div>

          <div className="messages-list">
            {filteredMessages.length > 0 ? (
              filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`message-item ${!message.read ? "unread" : ""} ${selectedMessage?.id === message.id ? "selected" : ""}`}
                  onClick={() => handleMessageSelect(message)}
                >
                  <div className="message-item-content">
                    <div className="message-sender-line">
                      <span className="message-sender">{message.sender}</span>
                      <span className="message-date">{formatDate(message.date)}</span>
                    </div>
                    <div className="message-subject-line">{message.subject}</div>
                    <div className="message-preview">{message.content.substring(0, 80).replace(/\n/g, " ")}...</div>
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="attachment-indicator">
                        <Paperclip size={14} />
                        <span>
                          {message.attachments.length} attachment{message.attachments.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-messages">{searchQuery ? "No messages match your search" : "No messages found"}</div>
            )}
          </div>
        </div>

        <div className="message-content">
          {isComposing ? (
            <div className="compose-message">
              <div className="compose-header">
                <h3>{selectedMessage ? "Reply to Message" : "New Message"}</h3>
                <button className="close-compose" onClick={() => setIsComposing(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="compose-form">
                <div className="form-group">
                  <label>To:</label>
                  <div className="recipient-select">
                    <input
                      type="text"
                      value={newMessage.toName}
                      onChange={(e) => {
                        const selected = previousRecipients.find(r => r.name === e.target.value)
                        setNewMessage({
                          ...newMessage,
                          toName: e.target.value,
                          to: selected ? selected.id : ""
                        })
                      }}
                      list="previousRecipients"
                      placeholder="Select or enter recipient"
                    />
                    <datalist id="previousRecipients">
                      {previousRecipients.map((recipient, index) => (
                        <option key={index} value={recipient.name} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div className="form-group">
                  <label>Subject:</label>
                  <input
                    type="text"
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                  />
                </div>
                <div className="form-group message-textarea">
                  <label>Message:</label>
                  <textarea
                    value={newMessage.content}
                    onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                    rows="12"
                    placeholder="Write your message here..."
                  />
                </div>

                {attachmentFiles.length > 0 && (
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
                          <button className="remove-attachment" onClick={() => removeAttachment(index)}>
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
                    <button className="save-draft-btn" onClick={handleSaveDraft}>
                      Save Draft
                    </button>
                  </div>
                  <div className="secondary-actions">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileAttachment}
                      multiple
                      style={{ display: "none" }}
                    />
                    <button className="attach-btn" onClick={() => fileInputRef.current?.click()}>
                      <Paperclip size={16} />
                      Attach Files
                    </button>
                    <button className="cancel-btn" onClick={() => setIsComposing(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedMessage ? (
            <>
              <div className="message-header">
                <h3>{selectedMessage.subject}</h3>
                <div className="message-meta">
                  <div>
                    <span className="meta-label">From:</span> <span className="sender">{senderName}</span>
                  </div>
                  {selectedMessage.recipient && (
                    <div>
                      <span className="meta-label">To:</span>{" "}
                      <span className="recipient">{selectedMessage.recipient}</span>
                    </div>
                  )}
                  <div>
                    <span className="meta-label">Date:</span>{" "}
                    <span className="date">{formatDate(selectedMessage.date)}</span>
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
                    const parts = selectedMessage.content.split("\n\nMeeting Details:")
                    const details = parts[1]
                    if (!details) return null

                    const timeMatch = details.match(/Time:\s*(.+)/)
                    const locationMatch = details.match(/Location:\s*(.+)/)
                    const timeText = timeMatch ? timeMatch[1].trim() : "Not specified"
                    const rsvpLink = timeText.includes("http") ? timeText.match(/$$(.*?)$$/)?.[1] : null

                    return (
                      <div className="meeting-details-box">
                        <h4>Meeting Details</h4>
                        <p>
                          <strong>Time:</strong>{" "}
                          {rsvpLink ? (
                            <a href={rsvpLink} target="_blank" rel="noopener noreferrer">
                              click to RSVP
                            </a>
                          ) : (
                            timeText
                          )}
                        </p>
                        <p>
                          <strong>Location:</strong> {locationMatch ? locationMatch[1].trim() : "Not specified"}
                        </p>
                      </div>
                    )
                  })()}

                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                  <div className="attachments">
                    <h4>Attachments ({selectedMessage.attachments.length}):</h4>
                    <div className="attachment-list">
                      {selectedMessage.attachments.map((file, index) => {
                        // Handle both string URLs and file objects
                        const fileName = typeof file === 'string'
                          ? file.split("/").pop().split("?")[0]
                          : file.name || "Unnamed file";
                        const fileUrl = typeof file === 'string' ? file : file.url || "#";

                        return (
                          <div key={index} className="attachment-item">
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="attachment-name"
                            >
                              {fileName}
                            </a>
                            <button
                              className="download-btn"
                              onClick={() => window.open(fileUrl)}
                              title="Download"
                            >
                              <Download size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="message-actions">
                <button className="reply-btn" onClick={handleReply}>
                  <Reply size={16} />
                  Reply
                </button>
                <button className="forward-btn" onClick={handleForward}>
                  <Forward size={16} />
                  Forward
                </button>
                <button className="delete-btn" onClick={() => handleDelete(selectedMessage.id)}>
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </>
          ) : (
            <div className="no-message-selected">
              <div className="empty-state-icon">✉️</div>
              <h3>Select a message to read</h3>
              <p>Choose a message from the list to view its contents</p>
              <button className="new-message-btn" onClick={() => setIsComposing(true)}>
                <Plus size={16} />
                New Message
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Messages