import React, { useState, useEffect } from 'react';
import { getLeaves, getLeaveBalance, createLeave, approveLeave, rejectLeave } from '../../../utils/api';
import { useAuth } from '../../../stores/AuthProvider';
import { LuCalendar, LuCircleCheck, LuCircleX, LuClock, LuInfo, LuPlus, LuList } from 'react-icons/lu';
import LeaveCalendar from '../LeaveCalendar/LeaveCalendar';
import './LeaveManagement.css';

const LeaveManagement = () => {
  const { token, user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leavesData, balanceData] = await Promise.all([
        getLeaves(token),
        getLeaveBalance(token).catch(() => null) // Balance might fail if not an employee
      ]);
      setLeaves(leavesData);
      setBalance(balanceData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createLeave(token, formData);
      await fetchData();
      setShowModal(false);
      setFormData({ leave_type: 'annual', start_date: '', end_date: '', reason: '' });
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      if (action === 'approve') {
        await approveLeave(token, id);
      } else {
        const reason = prompt('Please enter rejection reason:');
        if (reason === null) return;
        await rejectLeave(token, id, reason);
      }
      await fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="loading-state">Loading leave data...</div>;

  const isManagement = ['admin', 'superadmin', 'hr'].includes(user?.role);

  return (
    <div className="leave-mgmt-container">
      <div className="leave-header-grid">
        {balance && (
          <div className="balance-card">
            <div className="balance-info">
              <span className="balance-label">Annual Leave Balance</span>
              <span className="balance-value">{balance.annual_remaining} Days</span>
            </div>
            <div className="balance-stats">
              <span>Used: {balance.annual_used}</span>
              <span>Total: {balance.annual_entitlement}</span>
            </div>
          </div>
        )}
        <div className="action-card-simple">
           <div className="view-toggle">
              <button 
                className={viewMode === 'list' ? 'active' : ''} 
                onClick={() => setViewMode('list')}
              >
                <LuList /> List
              </button>
              <button 
                className={viewMode === 'calendar' ? 'active' : ''} 
                onClick={() => setViewMode('calendar')}
              >
                <LuCalendar /> Calendar
              </button>
           </div>
           <button className="request-btn" onClick={() => setShowModal(true)}>
             <LuPlus /> Request Leave
           </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <LeaveCalendar leaves={leaves} />
      ) : (
        <div className="leave-table-section">
          <h2 className="section-title">{isManagement ? 'All Leave Requests' : 'My Leave History'}</h2>
        <div className="inventory-table-wrap">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Status</th>
                <th>Reason</th>
                {isManagement && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {leaves.map(leave => (
                <tr key={leave.id}>
                  <td className="type-cell">
                    <span className={`type-tag ${leave.leave_type}`}>{leave.leave_type}</span>
                  </td>
                  <td>
                    <div className="date-range">
                      {leave.start_date} to {leave.end_date}
                    </div>
                  </td>
                  <td>{leave.total_days}</td>
                  <td>
                    <span className={`status-badge ${leave.status}`}>
                      {leave.status === 'pending' && <LuClock className="status-icon" />}
                      {leave.status === 'approved' && <LuCircleCheck className="status-icon" />}
                      {leave.status === 'rejected' && <LuCircleX className="status-icon" />}
                      {leave.status}
                    </span>
                  </td>
                  <td>
                    <div className="reason-cell" title={leave.reason}>
                      {leave.reason || '-'}
                      {leave.rejection_reason && (
                        <div className="rejection-box">
                          <LuInfo className="info-icon" /> {leave.rejection_reason}
                        </div>
                      )}
                    </div>
                  </td>
                  {isManagement && (
                    <td>
                      {leave.status === 'pending' ? (
                        <div className="action-buttons">
                          <button className="approve-btn" onClick={() => handleAction(leave.id, 'approve')}>Approve</button>
                          <button className="reject-btn" onClick={() => handleAction(leave.id, 'reject')}>Reject</button>
                        </div>
                      ) : (
                        <span className="action-completed">-</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {leaves.length === 0 && (
                <tr>
                   <td colSpan={isManagement ? 6 : 5} className="no-data">No leave requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Request New Leave</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="employee-form">
              <div className="form-group">
                <label>Leave Type</label>
                <select name="leave_type" value={formData.leave_type} onChange={handleInputChange}>
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input type="date" name="start_date" value={formData.start_date} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input type="date" name="end_date" value={formData.end_date} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="form-group">
                <label>Reason</label>
                <textarea 
                  name="reason" 
                  value={formData.reason} 
                  onChange={handleInputChange} 
                  rows="3" 
                  style={{ background: 'var(--surface-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--body-text)', padding: '10px' }}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
