import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../stores/AuthProvider';
import { getWorkLogs, createWorkLog, approveWorkLog } from '../../../utils/api';
import { LuPlus, LuClock, LuFileText, LuX, LuCircleCheck } from 'react-icons/lu';
import './WorkLogs.css';

const WorkLogs = () => {
  const { token, user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [logForApproval, setLogForApproval] = useState(null);
  const [approvalAction, setApprovalAction] = useState(true);
  const [mgrComment, setMgrComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const isManagement = ['admin', 'superadmin', 'hr'].includes(user?.role);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    task_name: '',
    hours: '',
    description: '',
    status: 'completed'
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await getWorkLogs(token);
      setLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchLogs();
  }, [token]);

  const handleApprovalSubmit = async (e) => {
    e.preventDefault();
    try {
      await approveWorkLog(token, logForApproval.id, approvalAction, mgrComment);
      fetchLogs();
      setShowApproveModal(false);
      setMgrComment('');
    } catch (err) { alert(err.message); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const hoursNum = parseFloat(formData.hours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      alert('Please enter a valid number of hours');
      setSubmitting(false);
      return;
    }

    try {
      await createWorkLog(token, {
        ...formData,
        hours: hoursNum
      });
      
      await fetchLogs();
      setShowModal(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        task_name: '',
        hours: '',
        description: '',
        status: 'completed'
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-state">Loading work logs...</div>;

  return (
    <div className="work-logs-container">
      <div className="list-controls">
        <div className="summary-pills">
           <div className="pill">
             <LuClock /> {logs.reduce((acc, log) => acc + log.hours, 0).toFixed(1)}h Total
           </div>
           <div className="pill">
             <LuCircleCheck /> {logs.filter(l => l.is_approved).length} Approved
           </div>
        </div>
        <button className="add-btn" onClick={() => setShowModal(true)}>
          <LuPlus /> New Log
        </button>
      </div>

      <div className="logs-table-wrapper">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Task Name</th>
              <th>Hours</th>
              <th>Status</th>
              <th>Approval</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.date).toLocaleDateString()}</td>
                <td>
                  <div className="task-cell">
                    <strong>{log.task_name}</strong>
                    <p>{log.description}</p>
                  </div>
                </td>
                <td className="hours-cell">{log.hours}h</td>
                <td>
                   <span className={`status-tag ${log.status}`}>{log.status}</span>
                </td>
                <td>
                   <div className="approval-cell">
                     <span className={`approval-tag ${log.is_approved ? 'approved' : 'pending'}`}>
                       {log.is_approved ? 'Approved' : 'Pending'}
                     </span>
                      {isManagement && !log.is_approved && (
                         <div className="mgr-actions">
                           <button className="mgr-btn approve" onClick={() => { 
                             setLogForApproval(log); 
                             setApprovalAction(true); 
                             setShowApproveModal(true); 
                           }}>Approve</button>
                           <button className="mgr-btn reject" onClick={() => { 
                             setLogForApproval(log); 
                             setApprovalAction(false); 
                             setShowApproveModal(true); 
                           }}>Reject</button>
                         </div>
                      )}
                     {log.manager_comment && (
                        <div className="manager-note" title={log.manager_comment}>
                          <LuFileText /> {log.manager_comment}
                        </div>
                     )}
                   </div>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-row">No work logs submitted yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add Daily Work Log</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}><LuX /></button>
            </div>
            <form onSubmit={handleSubmit} className="log-form">
              <div className="form-group">
                <label>Date</label>
                <input 
                  type="date" 
                  required 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Task Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Website Bug Fixing" 
                  required 
                  value={formData.task_name}
                  onChange={(e) => setFormData({...formData, task_name: e.target.value})}
                />
              </div>
              <div className="form-row">
                <div className="form-group half">
                  <label>Hours Worked</label>
                  <input 
                    type="number" 
                    step="0.5" 
                    required 
                    placeholder="e.g. 4.5"
                    value={formData.hours}
                    onChange={(e) => setFormData({...formData, hours: e.target.value})}
                  />
                </div>
                <div className="form-group half">
                  <label>Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea 
                  rows="3" 
                  placeholder="What did you achieve today?"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-v2" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="submit-v2" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Submit Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showApproveModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{approvalAction ? 'Approve' : 'Reject'} Work Log</h2>
              <button className="close-btn" onClick={() => setShowApproveModal(false)}><LuX /></button>
            </div>
            <form onSubmit={handleApprovalSubmit} className="log-form">
              <p style={{ margin: '0 0 1rem', color: 'var(--text-secondary)' }}>
                You are about to {approvalAction ? 'approve' : 'reject'} the log for: <strong>{logForApproval.task_name}</strong>
              </p>
              <div className="form-group">
                <label>Manager Comment (Optional)</label>
                <textarea 
                  rows="3" 
                  value={mgrComment}
                  onChange={(e) => setMgrComment(e.target.value)}
                  placeholder="Add feedback or notes..."
                ></textarea>
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-v2" onClick={() => setShowApproveModal(false)}>Cancel</button>
                <button type="submit" className={`submit-v2 ${approvalAction ? 'approve' : 'reject'}`}>
                   Confirm {approvalAction ? 'Approval' : 'Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkLogs;
