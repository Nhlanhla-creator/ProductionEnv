import React, { useState, useEffect, useCallback } from 'react';
import { FileExplorer } from '../../shared/FileExplorer';
import { FileUploader } from '../../shared/FileUploader';
import { SURVEYS_STRUCTURE } from '../../structure/surveysStructure';
import { AlertCircle, Send, BarChart3, Users, Calendar } from 'lucide-react';

const Surveys = () => {
  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedPath, setSelectedPath] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentContent, setCurrentContent] = useState(null);
  const [contentStatus, setContentStatus] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState('manage');
  const [selectedSurvey, setSelectedSurvey] = useState(null);

  const surveyTemplates = [
    { id: 1, name: "Member Satisfaction Survey", questions: 10, sentTo: 245, responseRate: 68, lastSent: "2024-12-01" },
    { id: 2, name: "Program Feedback Survey", questions: 8, sentTo: 189, responseRate: 72, lastSent: "2024-11-15" },
    { id: 3, name: "Annual Member Survey", questions: 25, sentTo: 512, responseRate: 45, lastSent: "2024-10-01" },
    { id: 4, name: "Event Feedback Survey", questions: 6, sentTo: 156, responseRate: 82, lastSent: "2024-12-10" },
    { id: 5, name: "Partner Satisfaction Survey", questions: 12, sentTo: 78, responseRate: 65, lastSent: "2024-11-20" },
  ];

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 800);
  }, []);

  const handleToggleFolder = useCallback((path) => {
    const pathKey = path.join(" > ");
    setExpandedFolders(prev => ({ ...prev, [pathKey]: !prev[pathKey] }));
  }, []);

  const handleSelectItem = useCallback((path, item) => {
    setSelectedPath(path);
    setSelectedItem(item);
    setCurrentContent({ files: [] });
  }, []);

  const handleUploadFile = useCallback(async (file) => {
    if (!selectedPath) return;
    setIsUploading(true);
    setTimeout(() => {
      const pathKey = selectedPath.join(' > ');
      setContentStatus(prev => ({ ...prev, [pathKey]: true }));
      setIsUploading(false);
      alert(`Survey "${file.name}" uploaded successfully to Association Surveys!`);
    }, 1000);
  }, [selectedPath]);

  const handleDeleteFile = useCallback(async () => {
    if (!selectedPath) return;
    setTimeout(() => alert(`Survey deleted successfully from Association Surveys!`), 500);
  }, [selectedPath]);

  const handleCloseEditor = useCallback(() => {
    setSelectedPath(null);
    setSelectedItem(null);
    setCurrentContent(null);
  }, []);

  const handleSendSurvey = (survey) => {
    setSelectedSurvey(survey);
    setActiveView('send');
  };

  const handleSendToMembers = () => {
    alert(`Survey "${selectedSurvey?.name}" has been sent to all members!`);
    setActiveView('manage');
    setSelectedSurvey(null);
  };

  const handleViewResponses = (survey) => {
    setSelectedSurvey(survey);
    setActiveView('responses');
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '4px solid #f0e6d9', borderTopColor: '#a67c52', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#4a352f' }}>Loading Association Surveys...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        :root { --light-brown: #f5f0e1; --medium-brown: #e6d7c3; --accent-brown: #c8b6a6; --primary-brown: #a67c52; --dark-brown: #7d5a50; --text-brown: #4a352f; --background-brown: #faf7f2; --pale-brown: #f0e6d9; }
        .survey-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.1); }
      `}</style>

      <div style={{ padding: 24, minHeight: '100vh' }}>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 24, color: 'var(--text-brown)', margin: 0, fontWeight: 600 }}>ASSOCIATION SURVEYS</h2>
            <p style={{ fontSize: 14, color: '#666', margin: '4px 0 0 0' }}>Create, manage, and analyze member surveys</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setActiveView('manage')} style={{ padding: '8px 16px', background: activeView === 'manage' ? 'var(--primary-brown)' : 'white', color: activeView === 'manage' ? 'white' : 'var(--text-brown)', border: `1px solid var(--primary-brown)`, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={16} /> Manage Surveys
            </button>
            <button onClick={() => { setActiveView('templates'); setSelectedSurvey(null); }} style={{ padding: '8px 16px', background: activeView === 'templates' ? 'var(--primary-brown)' : 'white', color: activeView === 'templates' ? 'white' : 'var(--text-brown)', border: `1px solid var(--primary-brown)`, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Send size={16} /> Survey Templates
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selectedPath && activeView === 'manage' ? '350px 1fr' : '1fr', gap: 20, minHeight: 'calc(100vh - 160px)' }}>
          
          {activeView === 'manage' && (
            <FileExplorer
              structure={SURVEYS_STRUCTURE}
              expandedFolders={expandedFolders}
              selectedPath={selectedPath}
              onToggleFolder={handleToggleFolder}
              onSelectItem={handleSelectItem}
              contentStatus={contentStatus}
            />
          )}

          {activeView === 'templates' && (
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--medium-brown)', padding: 24 }}>
              <h3 style={{ color: 'var(--text-brown)', marginBottom: 20 }}>Survey Templates</h3>
              <div style={{ display: 'grid', gap: 16 }}>
                {surveyTemplates.map(survey => (
                  <div key={survey.id} className="survey-card" style={{ padding: 16, border: '1px solid var(--pale-brown)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s ease' }}>
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-brown)' }}>{survey.name}</h4>
                      <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#666' }}>
                        <span><Calendar size={12} style={{ marginRight: 4 }} />Last sent: {new Date(survey.lastSent).toLocaleDateString()}</span>
                        <span><Users size={12} style={{ marginRight: 4 }} />Sent to: {survey.sentTo} members</span>
                        <span>Response rate: {survey.responseRate}%</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={() => handleSendSurvey(survey)} style={{ padding: '6px 12px', background: 'var(--primary-brown)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Send size={14} />Send to Members</button>
                      <button onClick={() => handleViewResponses(survey)} style={{ padding: '6px 12px', background: 'white', color: 'var(--text-brown)', border: '1px solid var(--primary-brown)', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><BarChart3 size={14} />View Responses</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === 'send' && selectedSurvey && (
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--medium-brown)', padding: 24 }}>
              <button onClick={() => setActiveView('templates')} style={{ background: 'none', border: 'none', color: 'var(--primary-brown)', cursor: 'pointer', marginBottom: 20 }}>← Back to Templates</button>
              <h3 style={{ color: 'var(--text-brown)', marginBottom: 20 }}>Send Survey: {selectedSurvey.name}</h3>
              <div style={{ background: 'var(--light-brown)', padding: 20, borderRadius: 8, marginBottom: 20 }}>
                <p><strong>Survey Details:</strong></p>
                <p>• {selectedSurvey.questions} questions</p>
                <p>• Previously sent to {selectedSurvey.sentTo} members with {selectedSurvey.responseRate}% response rate</p>
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" defaultChecked /> Send to all members</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" /> Send to active members only</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" /> Send to new members</label>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={handleSendToMembers} style={{ padding: '10px 20px', background: 'var(--primary-brown)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><Send size={16} />Send Survey Now</button>
                <button onClick={() => setActiveView('templates')} style={{ padding: '10px 20px', background: 'white', color: 'var(--text-brown)', border: '1px solid var(--primary-brown)', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}

          {activeView === 'responses' && selectedSurvey && (
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--medium-brown)', padding: 24 }}>
              <button onClick={() => setActiveView('templates')} style={{ background: 'none', border: 'none', color: 'var(--primary-brown)', cursor: 'pointer', marginBottom: 20 }}>← Back to Templates</button>
              <h3 style={{ color: 'var(--text-brown)', marginBottom: 20 }}>Survey Responses: {selectedSurvey.name}</h3>
              <div style={{ marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <div style={{ background: 'var(--light-brown)', padding: 16, borderRadius: 8, textAlign: 'center' }}><div style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--primary-brown)' }}>{selectedSurvey.sentTo}</div><div style={{ fontSize: 12, color: '#666' }}>Sent To</div></div>
                <div style={{ background: 'var(--light-brown)', padding: 16, borderRadius: 8, textAlign: 'center' }}><div style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--primary-brown)' }}>{Math.round(selectedSurvey.sentTo * selectedSurvey.responseRate / 100)}</div><div style={{ fontSize: 12, color: '#666' }}>Responses Received</div></div>
                <div style={{ background: 'var(--light-brown)', padding: 16, borderRadius: 8, textAlign: 'center' }}><div style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--primary-brown)' }}>{selectedSurvey.responseRate}%</div><div style={{ fontSize: 12, color: '#666' }}>Response Rate</div></div>
              </div>
              <div style={{ borderTop: '1px solid var(--pale-brown)', paddingTop: 20 }}>
                <h4>Sample Response Data</h4>
                <div style={{ marginTop: 16 }}>
                  <p><strong>Overall Satisfaction Rating:</strong> 4.2 / 5.0</p>
                  <div style={{ background: 'var(--light-brown)', height: 8, borderRadius: 4, marginTop: 8, overflow: 'hidden' }}>
                    <div style={{ width: '84%', background: 'var(--primary-brown)', height: 8, borderRadius: 4 }}></div>
                  </div>
                  <p style={{ marginTop: 16 }}><strong>Would Recommend:</strong> 78% Yes, 22% No</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <div style={{ flex: 78, background: 'var(--primary-brown)', height: 8, borderRadius: 4 }}></div>
                    <div style={{ flex: 22, background: 'var(--pale-brown)', height: 8, borderRadius: 4 }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'manage' && selectedPath && selectedItem && (
            <FileUploader
              path={selectedPath}
              itemConfig={selectedItem}
              content={currentContent}
              onUpload={handleUploadFile}
              onDelete={handleDeleteFile}
              onClose={handleCloseEditor}
              isUploading={isUploading}
            />
          )}

          {activeView === 'manage' && !selectedPath && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: 8, border: '1px solid var(--medium-brown)' }}>
              <div style={{ textAlign: 'center', padding: 40 }}>
                <AlertCircle size={48} color="var(--accent-brown)" style={{ marginBottom: 16 }} />
                <h3 style={{ color: 'var(--text-brown)', marginBottom: 8 }}>No Survey Selected</h3>
                <p style={{ color: '#666', margin: 0 }}>Select a survey from the explorer to begin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Surveys;