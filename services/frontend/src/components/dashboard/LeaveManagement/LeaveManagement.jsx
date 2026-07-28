import React, { useState, useEffect, useCallback } from 'react';
import { getLeaves, getLeaveBalance, createLeave, approveLeave, rejectLeave } from '../../../utils/api';
import { useAuth } from '../../../stores/AuthProvider';
import { LuCalendar, LuCircleCheck, LuCircleX, LuClock, LuInfo, LuPlus, LuList } from 'react-icons/lu';
import LeaveCalendar from '../LeaveCalendar/LeaveCalendar';
import DashboardTable from '../../common/DashboardTable/DashboardTable';
import { useSystemFeedback } from '../../common/SystemFeedback/SystemFeedback';
import './LeaveManagement.css';

const leaveColumns = (isManagement) => [
  { key: 'type', label: 'Type', width: '14%' },
  { key: 'dates', label: 'Dates', width: '22%' },
  { key: 'days', label: 'Days', align: 'right', width: '10%' },
  { key: 'status', label: 'Status', width: '16%' },
  { key: 'reason', label: 'Reason', width: isManagement ? '24%' : '38%' },
  ...(isManagement ? [{ key: 'actions', label: 'Actions', align: 'right', width: '14%' }] : []),
];

const LeaveManagement = () => {
  const { notify } = useSystemFeedback();
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

  const fetchData = useCallback(async () => {
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
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [fetchData, token]);

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
      notify(err.message);
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
      notify(err.message);
    }
  };

  if (loading) return <div className="loading-state">Loading leave data...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;

  const isManagement = ['superadmin', 'hr'].includes(user?.role);

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
          <DashboardTable
            columns={leaveColumns(isManagement)}
            rows={leaves}
            rowKey="id"
            minWidth={isManagement ? 980 : 860}
            emptyTitle="No leave requests found"
            emptyDescription="Leave requests and approvals will appear here."
            renderCell={(leave, column) => {
              switch (column.key) {
                case 'type':
                  return <span className={`type-tag ${leave.leave_type}`}>{leave.leave_type}</span>;
                case 'dates':
                  return (
                    <div className="date-range">
                      {leave.start_date} to {leave.end_date}
                    </div>
                  );
                case 'days':
                  return leave.total_days;
                case 'status':
                  return (
                    <span className={`status-badge ${leave.status}`}>
                      {leave.status === 'pending' && <LuClock className="status-icon" />}
                      {leave.status === 'approved' && <LuCircleCheck className="status-icon" />}
                      {leave.status === 'rejected' && <LuCircleX className="status-icon" />}
                      {leave.status}
                    </span>
                  );
                case 'reason':
                  return (
                    <div className="reason-cell" title={leave.reason}>
                      {leave.reason || '-'}
                      {leave.rejection_reason && (
                        <div className="rejection-box">
                          <LuInfo className="info-icon" /> {leave.rejection_reason}
                        </div>
                      )}
                    </div>
                  );
                case 'actions':
                  return leave.status === 'pending' ? (
                    <div className="action-buttons">
                      <button className="approve-btn" onClick={() => handleAction(leave.id, 'approve')}>Approve</button>
                      <button className="reject-btn" onClick={() => handleAction(leave.id, 'reject')}>Reject</button>
                    </div>
                  ) : (
                    <span className="action-completed">-</span>
                  );
                default:
                  return null;
              }
            }}
          />
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
