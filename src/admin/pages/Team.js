import React, { useState, useEffect } from 'react';
import { useAuth } from '../../smses/hooks/useAuth';
import { loadTeamMembers, saveTeamMembers, normalizeName } from './services/team';
import { Trash2, Edit2, Check, X, Plus, RefreshCw, CheckCircle, AlertCircle, GripVertical } from 'lucide-react';

const Team = () => {
  const { user, loading: authLoading } = useAuth();
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', role: '' });
  
  const [editingId, setEditingId] = useState(null);
  const [editFields, setEditFields] = useState({ name: '', role: '' });
  
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await loadTeamMembers(user);
        setMembers(data);
      } catch (err) {
        console.error('Failed to load team members:', err);
        showToast('error', 'Failed to load team members');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const isDuplicateName = (name, excludeId = null) => {
    const normalizedInput = normalizeName(name).toLowerCase();
    return members.some(m => {
      if (excludeId && m.id === excludeId) return false;
      return normalizeName(m.name).toLowerCase() === normalizedInput;
    });
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    const cleanName = newMember.name.trim();
    const cleanRole = newMember.role.trim() || 'Add role';

    if (!cleanName) {
      showToast('error', 'Name is required');
      return;
    }

    if (isDuplicateName(cleanName)) {
      showToast('error', `A team member named "${normalizeName(cleanName)}" already exists.`);
      return;
    }

    try {
      setIsSaving(true);
      const newId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const updatedMembers = [
        ...members,
        {
          id: newId,
          name: normalizeName(cleanName),
          role: cleanRole,
          avatar: '',
          isDerived: false
        }
      ];

      await saveTeamMembers(updatedMembers, user);
      setMembers(updatedMembers);
      setNewMember({ name: '', role: 'Add role' });
      setShowAddForm(false);
      showToast('success', 'Team member added successfully');
    } catch (err) {
      console.error('Failed to add team member:', err);
      showToast('error', 'Failed to add team member');
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (member) => {
    setEditingId(member.id);
    setEditFields({ name: member.name, role: member.role });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFields({ name: '', role: '' });
  };

  const handleSaveEdit = async (memberId) => {
    const cleanName = editFields.name.trim();
    const cleanRole = editFields.role.trim();

    if (!cleanName || !cleanRole) {
      showToast('error', 'Name and Role cannot be empty');
      return;
    }

    if (isDuplicateName(cleanName, memberId)) {
      showToast('error', `A team member named "${normalizeName(cleanName)}" already exists.`);
      return;
    }

    try {
      setIsSaving(true);
      const updatedMembers = members.map(m => {
        if (m.id === memberId) {
          return {
            ...m,
            name: normalizeName(cleanName),
            role: cleanRole
          };
        }
        return m;
      });

      await saveTeamMembers(updatedMembers, user);
      setMembers(updatedMembers);
      setEditingId(null);
      showToast('success', 'Team member updated successfully');
    } catch (err) {
      console.error('Failed to update team member:', err);
      showToast('error', 'Failed to update team member');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMember = async (memberId) => {
    const memberToDelete = members.find(m => m.id === memberId);
    if (!memberToDelete) return;

    if (!window.confirm(`Are you sure you want to remove ${memberToDelete.name} from the team?`)) {
      return;
    }

    try {
      setIsSaving(true);
      const updatedMembers = members.filter(m => m.id !== memberId);
      await saveTeamMembers(updatedMembers, user);
      setMembers(updatedMembers);
      showToast('success', `${memberToDelete.name} removed from the team`);
    } catch (err) {
      console.error('Failed to delete team member:', err);
      showToast('error', 'Failed to remove team member');
    } finally {
      setIsSaving(false);
    }
  };

  // Drag and Drop reordering handlers
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('dragging');
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
    setDraggedIndex(null);
  };

  const handleDrop = async (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updatedMembers = [...members];
    const [draggedItem] = updatedMembers.splice(draggedIndex, 1);
    updatedMembers.splice(index, 0, draggedItem);

    setMembers(updatedMembers);
    try {
      setIsSaving(true);
      await saveTeamMembers(updatedMembers, user);
      showToast('success', 'Team order updated');
    } catch (err) {
      console.error('Failed to save team card order:', err);
      showToast('error', 'Failed to save card order');
    } finally {
      setIsSaving(false);
    }
  };


  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getRandomGradient = (name) => {
    const gradients = [
      'linear-gradient(135deg, #a67c52 0%, #7d5a50 100%)',
      'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
      'linear-gradient(135deg, #10b981 0%, #047857 100%)',
      'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
      'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  if (authLoading || isLoading) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.spinner} />
        <p style={{ color: '#4a352f', marginTop: 16 }}>
          {authLoading ? 'Authenticating...' : 'Loading team members...'}
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.alertCard}>
          <AlertCircle size={48} color="#c8b6a6" style={{ marginBottom: 16 }} />
          <h2 style={{ color: '#4a352f', marginBottom: 8 }}>Authentication Required</h2>
          <p style={{ color: '#666' }}>Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .team-page-container {
          padding: 24px;
          min-height: 100vh;
          font-family: inherit;
        }
        .team-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .team-title {
          font-size: 24px;
          color: #4a352f;
          margin: 0;
          font-weight: 600;
          text-transform: uppercase;
        }
        .team-subtitle {
          font-size: 14px;
          color: #666;
          margin: 4px 0 0;
        }
        .header-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .btn-sync {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: #fff;
          color: #4a352f;
          border: 1px solid #e6d7c3;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
        }
        .btn-sync:hover:not(:disabled) {
          background: #faf7f2;
          border-color: #a67c52;
        }
        .btn-sync:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-add {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: #a67c52;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          box-shadow: 0 2px 4px rgba(166, 124, 82, 0.2);
        }
        .btn-add:hover {
          background: #8e653d;
          transform: translateY(-1px);
        }
        .btn-add:active {
          transform: translateY(0);
        }
        .add-form-card {
          background: #fff;
          border: 1px solid #e6d7c3;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 32px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
          animation: slideDown 0.3s ease-out;
          max-width: 600px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        @media (max-width: 576px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-label {
          font-size: 12px;
          font-weight: 600;
          color: #4a352f;
        }
        .form-input {
          padding: 10px 12px;
          border: 1px solid #e6d7c3;
          border-radius: 6px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-input:focus {
          border-color: #a67c52;
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .btn-cancel {
          padding: 8px 16px;
          background: #f3f4f6;
          color: #4b5563;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-cancel:hover {
          background: #e5e7eb;
        }
        .btn-save {
          padding: 8px 16px;
          background: #a67c52;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-save:hover {
          background: #8e653d;
        }
        .members-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }
        .member-card {
          background: #fff;
          border: 1px solid #e6d7c3;
          border-radius: 12px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 4px rgba(0,0,0,0.01);
        }
        .member-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 15px rgba(166, 124, 82, 0.08);
          border-color: #c8b6a6;
        }
        .member-card.dragging {
          opacity: 0.4;
          border: 2px dashed #a67c52;
          background: #faf7f2;
        }
        .member-card:not(.editing) {
          cursor: grab;
        }
        .member-card:not(.editing):active {
          cursor: grabbing;
        }
        .card-actions {
          position: absolute;
          top: 12px;
          right: 12px;
          display: flex;
          gap: 4px;
        }
        .action-icon-btn {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 6px;
          border-radius: 50%;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .action-icon-btn.delete:hover {
          color: #ef4444;
          background: #fee2e2;
        }
        .action-icon-btn.edit:hover {
          color: #3b82f6;
          background: #dbeafe;
        }
        .avatar-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 16px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.06);
          position: relative;
        }
        .member-name {
          font-size: 18px;
          font-weight: 600;
          color: #4a352f;
          margin: 0 0 6px;
        }
        .member-role {
          font-size: 13px;
          font-weight: 500;
          color: #a67c52;
          background: #faf7f2;
          padding: 4px 12px;
          border-radius: 12px;
          border: 1px solid #f0e6d9;
          margin-bottom: 12px;
        }
        .inline-edit-input {
          width: 100%;
          padding: 6px 10px;
          border: 1px solid #e6d7c3;
          border-radius: 6px;
          font-size: 14px;
          text-align: center;
          outline: none;
          margin-bottom: 8px;
        }
        .inline-edit-input:focus {
          border-color: #a67c52;
        }
        .inline-edit-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        .inline-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .inline-action-btn.save {
          background: #10b981;
          color: white;
        }
        .inline-action-btn.save:hover {
          background: #059669;
        }
        .inline-action-btn.cancel {
          background: #6b7280;
          color: white;
        }
        .inline-action-btn.cancel:hover {
          background: #4b5563;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="team-page-container">
        <div className="team-header">
          <div>
            <h1 className="team-title">Team Management</h1>
            <p className="team-subtitle">View, add, and update team members</p>
          </div>
          <div className="header-actions">
            <button onClick={() => setShowAddForm(!showAddForm)} className="btn-add">
              <Plus size={16} /> Add Team Member
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="add-form-card">
            <h3 style={{ color: '#4a352f', margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>New Team Member</h3>
            <form onSubmit={handleAddMember}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    placeholder="e.g. Nhlanhla Msomi"
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <input
                    type="text"
                    value={newMember.role}
                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                    placeholder="e.g. UI/UX Designer"
                    className="form-input"
                    required
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowAddForm(false)} className="btn-cancel" disabled={isSaving}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Member'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="members-grid">
          {members.map((member, index) => {
            const isEditing = editingId === member.id;

            return (
              <div 
                key={member.id} 
                className={`member-card ${isEditing ? 'editing' : ''}`}
                draggable={!isEditing && !isSaving}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index)}
              >
                {!isEditing && (
                  <div 
                    style={{ position: 'absolute', top: 12, left: 12, color: '#c8b6a6', cursor: 'grab' }}
                    title="Drag to reorder"
                  >
                    <GripVertical size={16} />
                  </div>
                )}
                {!isEditing && (
                  <div className="card-actions">
                    <button 
                      onClick={() => startEdit(member)} 
                      className="action-icon-btn edit"
                      title="Edit team member"
                      disabled={isSaving}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteMember(member.id)} 
                      className="action-icon-btn delete"
                      title="Remove team member"
                      disabled={isSaving}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                <div 
                  className="avatar-circle" 
                  style={{ background: getRandomGradient(member.name) }}
                >
                  {getInitials(member.name)}
                </div>

                {isEditing ? (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="inline-edit-input"
                      value={editFields.name}
                      onChange={(e) => setEditFields({ ...editFields, name: e.target.value })}
                      placeholder="Name"
                      required
                    />
                    <input
                      type="text"
                      className="inline-edit-input"
                      value={editFields.role}
                      onChange={(e) => setEditFields({ ...editFields, role: e.target.value })}
                      placeholder="Role"
                      required
                    />
                    <div className="inline-edit-actions">
                      <button 
                        onClick={() => handleSaveEdit(member.id)} 
                        className="inline-action-btn save"
                        title="Save changes"
                        disabled={isSaving}
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        onClick={cancelEdit} 
                        className="inline-action-btn cancel"
                        title="Cancel editing"
                        disabled={isSaving}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="member-name">{member.name}</h3>
                    <span className="member-role">{member.role}</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            padding: '12px 16px',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 2000,
            backgroundColor: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#3b82f6',
            color: '#fff',
            fontSize: 14,
            fontWeight: 500,
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </>
  );
};

const styles = {
  centerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: 24
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #f0e6d9',
    borderTopColor: '#a67c52',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  alertCard: {
    textAlign: 'center',
    padding: 40,
    background: 'white',
    borderRadius: 8,
    border: '1px solid #e6d7c3',
    maxWidth: 400
  }
};

export default Team;
