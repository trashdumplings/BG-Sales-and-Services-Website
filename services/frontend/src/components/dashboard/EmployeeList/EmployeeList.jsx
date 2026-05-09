import React, { useState, useEffect } from 'react';
import { getEmployees } from '../../../utils/api';
import { useAuth } from '../../../stores/AuthProvider';
import { LuSearch, LuFilter, LuPlus, LuUser, LuMail, LuPhone, LuBriefcase } from 'react-icons/lu';
import './EmployeeList.css';

const EmployeeList = () => {
  const { token } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    salary: '',
    hire_date: new Date().toISOString().split('T')[0],
    status: 'active'
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await getEmployees(token);
      setEmployees(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchEmployees();
    }
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/api/employees`, {
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
        throw new Error(errorData.detail || 'Failed to add employee');
      }

      await fetchEmployees();
      setShowModal(false);
      setFormData({
        employee_id: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        salary: '',
        hire_date: new Date().toISOString().split('T')[0],
        status: 'active'
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = deptFilter === '' || emp.department === deptFilter;
    
    return matchesSearch && matchesDept;
  });

  const departments = [...new Set(employees.map(emp => emp.department))];

  if (loading) return <div className="loading-state">Loading employees...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;

  return (
    <div className="employee-list-container">
      <div className="list-controls">
        <div className="search-box">
          <LuSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search employees..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <div className="filter-select">
            <LuFilter className="filter-icon" />
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <button className="add-btn" onClick={() => setShowModal(true)}>
            <LuPlus />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      <div className="employee-grid">
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map(emp => (
            <div key={emp.id} className="employee-card">
              <div className="emp-header">
                <div className="emp-avatar">
                  {emp.first_name.charAt(0)}{emp.last_name.charAt(0)}
                </div>
                <div className="emp-basic-info">
                  <h3>{emp.first_name} {emp.last_name}</h3>
                  <p className="emp-id">{emp.employee_id}</p>
                </div>
                <span className={`status-badge ${emp.status}`}>{emp.status}</span>
              </div>
              
              <div className="emp-details">
                <div className="detail-item">
                  <LuBriefcase className="detail-icon" />
                  <span>{emp.position} • {emp.department}</span>
                </div>
                <div className="detail-item">
                  <LuMail className="detail-icon" />
                  <span>{emp.email}</span>
                </div>
                {emp.phone && (
                  <div className="detail-item">
                    <LuPhone className="detail-icon" />
                    <span>{emp.phone}</span>
                  </div>
                )}
              </div>
              
              <div className="card-actions">
                <button className="view-link">View Profile</button>
                <button className="edit-btn">Edit</button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">No employees found matching your criteria.</div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Employee</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddSubmit} className="employee-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Employee ID</label>
                  <input name="employee_id" value={formData.employee_id} onChange={handleInputChange} required placeholder="EMP001" />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
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
                  <label>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input name="phone" value={formData.phone} onChange={handleInputChange} />
                </div>
              </div>
              <div className="form-row">
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
                  <label>Salary</label>
                  <input type="number" name="salary" value={formData.salary} onChange={handleInputChange} step="0.01" />
                </div>
                <div className="form-group">
                  <label>Hire Date</label>
                  <input type="date" name="hire_date" value={formData.hire_date} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
