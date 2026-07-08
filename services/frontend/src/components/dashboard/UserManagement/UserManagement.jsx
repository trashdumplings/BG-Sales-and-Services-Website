import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../stores/AuthProvider';
import { LuFilter, LuPlus, LuUserCheck } from 'react-icons/lu';
import { FiEdit } from 'react-icons/fi';
import DashboardTable from '../../common/DashboardTable/DashboardTable';
import './UserManagement.css';

const userColumns = [
  { key: 'name', label: 'Name', width: '18%' },
  { key: 'employeeId', label: 'CID (Emp ID)', width: '14%' },
  { key: 'email', label: 'Email', width: '18%' },
  { key: 'phone', label: 'Phone', width: '12%' },
  { key: 'department', label: 'Department', width: '14%' },
  { key: 'position', label: 'Position', width: '14%' },
  { key: 'status', label: 'Status', width: '6%' },
  { key: 'actions', label: 'Actions', align: 'right', width: '4%' },
];

const UserManagement = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activeTab, setActiveTab] = useState('superadmin');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    employee_id: '',
    first_name: '',
    last_name: '',
    phone: '',
    department: '',
    position: '',
    salary: '',
    hire_date: new Date().toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);

  const roles = [
    { id: 'superadmin', label: 'Super Admin', color: 'orange' },
    { id: 'admin', label: 'Admin', color: 'yellow' },
    { id: 'hr', label: 'HR', color: 'green' },
    { id: 'employee', label: 'Employee', color: 'blue' }
  ];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Auto fill name if first and last change
    if (name === 'first_name' || name === 'last_name') {
      const newFirst = name === 'first_name' ? value : formData.first_name;
      const newLast = name === 'last_name' ? value : formData.last_name;
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        name: `${newFirst} ${newLast}`.trim()
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          salary: formData.salary ? parseFloat(formData.salary) : null,
          hire_date: new Date(formData.hire_date).toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add user');
      }

      await fetchUsers();
      setShowModal(false);
      setFormData({
        name: '', email: '', password: '', role: 'employee',
        employee_id: '', first_name: '', last_name: '', phone: '',
        department: '', position: '', salary: '', 
        hire_date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user => user.role === activeTab);

  if (loading) return <div className="loading-state">Loading users...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;

  return (
    <div className="user-mgmt-container">
      <div className="list-controls">
        <div className="role-tabs">
          {roles.map(r => (
            <button 
              key={r.id} 
              className={`role-tab ${r.color} ${activeTab === r.id ? 'active' : ''}`}
              onClick={() => setActiveTab(r.id)}
            >
              <LuUserCheck className="tab-icon" />
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="table-controls">
        <div className="search-box">
          <LuFilter className="filter-icon" />
        </div>
        <button className="add-btn" onClick={() => setShowModal(true)}>
          <LuPlus /> Add User
        </button>
      </div>

      <div className="table-wrapper">
        <DashboardTable
          columns={userColumns}
          rows={filteredUsers}
          rowKey="id"
          minWidth={1080}
          emptyTitle="No users found for this role"
          emptyDescription="Switch role tabs or add a new user to see records here."
          renderCell={(user, column) => {
            switch (column.key) {
              case 'name':
                return <span className="font-medium">{user.name}</span>;
              case 'employeeId':
                return user.employee_id || '-';
              case 'email':
                return user.email;
              case 'phone':
                return user.phone || '-';
              case 'department':
                return user.department || '-';
              case 'position':
                return user.position || '-';
              case 'status':
                return (
                  <div className={`status-toggle ${user.is_active ? 'active' : ''}`}>
                    <div className="toggle-slider"></div>
                  </div>
                );
              case 'actions':
                return (
                  <button className="action-btn edit" title="Edit User">
                    <FiEdit />
                  </button>
                );
              default:
                return null;
            }
          }}
        />
        <div className="table-footer">
          <span>Total: {filteredUsers.length} items</span>
          <div className="pagination">
            <button disabled>Prev</button>
            <button disabled>Next</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content large" style={{maxWidth: '800px'}}>
            <div className="modal-header">
              <h2>Add New User</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddSubmit} className="employee-form" style={{textAlign: 'left'}}>
              <h3 className="section-title" style={{color: 'var(--color-primary-blue)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem'}}>Login Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Email (Login)</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" name="password" value={formData.password} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select name="role" value={formData.role} onChange={handleInputChange}>
                    <option value="superadmin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="hr">HR</option>
                    <option value="employee">Employee</option>
                  </select>
                </div>
              </div>

              <h3 className="section-title" style={{color: 'var(--color-primary-blue)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '1rem'}}>Employee Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>CID (Employee ID)</label>
                  <input name="employee_id" value={formData.employee_id} onChange={handleInputChange} required placeholder="CID/EMP001" />
                </div>
                <div className="form-group">
                  <label>First Name</label>
                  <input name="first_name" value={formData.first_name} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input name="last_name" value={formData.last_name} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input name="phone" value={formData.phone} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input name="department" value={formData.department} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Position</label>
                  <input name="position" value={formData.position} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Salary (Optional)</label>
                  <input type="number" name="salary" value={formData.salary} onChange={handleInputChange} step="0.01" />
                </div>
                <div className="form-group">
                  <label>Hire Date</label>
                  <input type="date" name="hire_date" value={formData.hire_date} onChange={handleInputChange} required />
                </div>
              </div>
              
              <div className="form-actions" style={{marginTop: '2rem'}}>
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
