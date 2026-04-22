"use client";
import React, { useState } from 'react';
import { FileText, Image, File, Download, Trash2, Upload, FolderOpen } from 'lucide-react';

const AssociatorDocuments = () => {
  const [documents, setDocuments] = useState([
    { id: 1, name: 'Partnership Agreement.pdf', type: 'pdf', size: '2.4 MB', date: '2024-12-01' },
    { id: 2, name: 'Profile Image.jpg', type: 'image', size: '1.2 MB', date: '2024-11-28' },
    { id: 3, name: 'Ecosystem Report.docx', type: 'doc', size: '856 KB', date: '2024-11-25' },
    { id: 4, name: 'Collaboration Proposal.pdf', type: 'pdf', size: '3.1 MB', date: '2024-11-20' },
  ]);

  const getFileIcon = (type) => {
    switch(type) {
      case 'pdf': return <FileText size={20} />;
      case 'image': return <Image size={20} />;
      default: return <File size={20} />;
    }
  };

  return (
    <div className="associator-documents">
      <div className="documents-header">
        <div>
          <h1>My Documents</h1>
          <p>Manage your files and important documents</p>
        </div>
        <button className="upload-btn">
          <Upload size={16} />
          Upload Document
        </button>
      </div>

      <div className="documents-stats">
        <div className="stat-card">
          <FolderOpen size={24} />
          <div>
            <h3>{documents.length}</h3>
            <p>Total Documents</p>
          </div>
        </div>
        <div className="stat-card">
          <FileText size={24} />
          <div>
            <h3>{documents.filter(d => d.type === 'pdf').length}</h3>
            <p>PDF Files</p>
          </div>
        </div>
        <div className="stat-card">
          <Image size={24} />
          <div>
            <h3>{documents.filter(d => d.type === 'image').length}</h3>
            <p>Images</p>
          </div>
        </div>
      </div>

      <div className="documents-list">
        <div className="list-header">
          <div>Name</div>
          <div>Size</div>
          <div>Date Uploaded</div>
          <div>Actions</div>
        </div>
        {documents.map((doc) => (
          <div key={doc.id} className="document-item">
            <div className="doc-info">
              {getFileIcon(doc.type)}
              <span>{doc.name}</span>
            </div>
            <div className="doc-size">{doc.size}</div>
            <div className="doc-date">{doc.date}</div>
            <div className="doc-actions">
              <button className="action-btn" title="Download">
                <Download size={16} />
              </button>
              <button className="action-btn delete" title="Delete">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssociatorDocuments;