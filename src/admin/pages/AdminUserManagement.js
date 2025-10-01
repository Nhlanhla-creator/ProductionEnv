"use client"
import { useState, useEffect } from "react"
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Key,
  Search,
  Save,
  X,
  Check,
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react"
import styles from "./admin-settings.module.css"

function AdminUserManagement() {
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [showPassword, setShowPassword] = useState({})

  const [adminUsers, setAdminUsers] = useState([
    {
      id: 1,
      name: "John Smith",
      email: "john@platform.co.za",
      role: "Super Admin",
      permissions: ["all"],
      lastLogin: "2024-06-24",
      status: "active",
      twoFaEnabled: true,
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah@platform.co.za",
      role: "Moderator",
      permissions: ["approve_applications", "manage_users"],
      lastLogin: "2024-06-23",
      status: "active",
      twoFaEnabled: false,
    },
    {
      id: 3,
      name: "Mike Wilson",
      email: "mike@platform.co.za",
      role: "Viewer",
      permissions: ["view_only"],
      lastLogin: "2024-06-20",
      status: "inactive",
      twoFaEnabled: true,
    },
  ])

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "Viewer",
    password: "",
    confirmPassword: "",
  })

  const [permissions, setPermissions] = useState({
    approve_applications: { superadmin: true, moderator: true, viewer: false },
    manage_payments: { superadmin: true, moderator: false, viewer: false },
    system_settings: { superadmin: true, moderator: false, viewer: false },
    manage_users: { superadmin: true, moderator: true, viewer: false },
    export_data: { superadmin: true, moderator: true, viewer: false },
    view_analytics: { superadmin: true, moderator: true, viewer: true },
  })

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const filteredUsers = adminUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert("Please fill in all required fields")
      return
    }
    if (newUser.password !== newUser.confirmPassword) {
      alert("Passwords do not match")
      return
    }

    const user = {
      id: Math.max(...adminUsers.map(u => u.id)) + 1,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      permissions: getPermissionsForRole(newUser.role),
      lastLogin: "Never",
      status: "active",
      twoFaEnabled: false,
    }

    setAdminUsers([...adminUsers, user])
    setNewUser({ name: "", email: "", role: "Viewer", password: "", confirmPassword: "" })
    setShowAddModal(false)
  }

  const handleEditUser = (user) => {
    setEditingUser({ ...user })
    setShowEditModal(true)
  }

  const handleUpdateUser = () => {
    setAdminUsers(adminUsers.map(user => 
      user.id === editingUser.id ? editingUser : user
    ))
    setShowEditModal(false)
    setEditingUser(null)
  }

  const handleDeleteUser = (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setAdminUsers(adminUsers.filter(user => user.id !== userId))
    }
  }

  const handleResetPassword = (user) => {
    if (window.confirm(`Send password reset email to ${user.email}?`)) {
      alert(`Password reset email sent to ${user.email}`)
    }
  }

  const handleToggle2FA = (userId) => {
    setAdminUsers(adminUsers.map(user =>
      user.id === userId 
        ? { ...user, twoFaEnabled: !user.twoFaEnabled }
        : user
    ))
  }

  const handleToggleStatus = (userId) => {
    setAdminUsers(adminUsers.map(user =>
      user.id === userId 
        ? { ...user, status: user.status === "active" ? "inactive" : "active" }
        : user
    ))
  }

  const getPermissionsForRole = (role) => {
    switch (role) {
      case "Super Admin": return ["all"]
      case "Moderator": return ["approve_applications", "manage_users", "export_data", "view_analytics"]
      case "Viewer": return ["view_analytics"]
      default: return ["view_analytics"]
    }
  }

  const handlePermissionChange = (permission, role, value) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: {
        ...prev[permission],
        [role]: value
      }
    }))
  }

  const togglePassword = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading Admin User Management...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Admin User Management</h1>
          <p className={styles.subtitle}>Manage administrator accounts, roles, and permissions</p>
        </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.primaryButton}
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            Add Admin User
          </button>
        </div>
      </div>

      <div className={styles.settingsContent}>
        {/* Current Admin Users */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <h3>Current Admin Users ({adminUsers.length})</h3>
            <div className={styles.searchContainer}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search admin users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.settingsTable}>
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Role</th>
                  <th>Last Login</th>
                  <th>2FA</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className={styles.userDetails}>
                        <strong>{user.name}</strong>
                        <span className={styles.userEmail}>{user.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.roleBadge} ${styles[user.role.replace(' ', '').toLowerCase()]}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{user.lastLogin}</td>
                    <td>
                      <button
                        className={`${styles.toggleBtn} ${user.twoFaEnabled ? styles.enabled : styles.disabled}`}
                        onClick={() => handleToggle2FA(user.id)}
                      >
                        {user.twoFaEnabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                    <td>
                      <button
                        className={`${styles.toggleBtn} ${user.status === 'active' ? styles.active : styles.inactive}`}
                        onClick={() => handleToggleStatus(user.id)}
                      >
                        {user.status}
                      </button>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button 
                          className={styles.actionBtn} 
                          title="Edit User"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          className={styles.actionBtn} 
                          title="Reset Password"
                          onClick={() => handleResetPassword(user)}
                        >
                          <Key size={14} />
                        </button>
                        <button 
                          className={styles.actionBtn} 
                          title="Delete User"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Role Permissions Matrix */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <h3>Role Permissions</h3>
            <button className={styles.secondaryButton}>
              <Save size={16} />
              Save Permissions
            </button>
          </div>
          
          <div className={styles.permissionMatrix}>
            {Object.entries(permissions).map(([permission, roles]) => (
              <div key={permission} className={styles.permissionRow}>
                <span className={styles.permissionLabel}>
                  {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <div className={styles.permissionControls}>
                  <label>
                    <input 
                      type="checkbox" 
                      checked={roles.superadmin}
                      onChange={(e) => handlePermissionChange(permission, 'superadmin', e.target.checked)}
                    />
                    Super Admin
                  </label>
                  <label>
                    <input 
                      type="checkbox" 
                      checked={roles.moderator}
                      onChange={(e) => handlePermissionChange(permission, 'moderator', e.target.checked)}
                    />
                    Moderator
                  </label>
                  <label>
                    <input 
                      type="checkbox" 
                      checked={roles.viewer}
                      onChange={(e) => handlePermissionChange(permission, 'viewer', e.target.checked)}
                    />
                    Viewer
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Add New Admin User</h3>
              <button 
                className={styles.modalClose}
                onClick={() => setShowAddModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className={styles.formInput}
                    placeholder="Enter full name"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className={styles.formInput}
                    placeholder="Enter email address"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className={styles.formSelect}
                  >
                    <option value="Viewer">Viewer</option>
                    <option value="Moderator">Moderator</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Password *</label>
                  <div className={styles.passwordInput}>
                    <input
                      type={showPassword.newPassword ? "text" : "password"}
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className={styles.formInput}
                      placeholder="Enter password"
                    />
                    <button 
                      type="button" 
                      onClick={() => togglePassword('newPassword')}
                      className={styles.passwordToggle}
                    >
                      {showPassword.newPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Confirm Password *</label>
                  <div className={styles.passwordInput}>
                    <input
                      type={showPassword.confirmPassword ? "text" : "password"}
                      value={newUser.confirmPassword}
                      onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                      className={styles.formInput}
                      placeholder="Confirm password"
                    />
                    <button 
                      type="button" 
                      onClick={() => togglePassword('confirmPassword')}
                      className={styles.passwordToggle}
                    >
                      {showPassword.confirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.secondaryButton}
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.primaryButton}
                onClick={handleAddUser}
              >
                <Plus size={16} />
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Edit Admin User</h3>
              <button 
                className={styles.modalClose}
                onClick={() => setShowEditModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                    className={styles.formSelect}
                  >
                    <option value="Viewer">Viewer</option>
                    <option value="Moderator">Moderator</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.secondaryButton}
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.primaryButton}
                onClick={handleUpdateUser}
              >
                <Save size={16} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUserManagement