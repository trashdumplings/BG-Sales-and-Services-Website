import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../stores/AuthProvider';
import {
  approveWorkLog,
  createWorkLog,
  deleteWorkLog,
  getWorkLogReviewQueue,
  getWorkLogs,
  rejectWorkLog,
  resubmitWorkLog,
  submitWorkLog,
  updateWorkLog,
} from '../../../utils/api';
import {
  LuCircleCheck,
  LuClock,
  LuEye,
  LuFileText,
  LuPencil,
  LuPlus,
  LuSend,
  LuTrash2,
  LuX,
} from 'react-icons/lu';
import DashboardTable from '../../common/DashboardTable/DashboardTable';
import './WorkLogs.css';

const employeeColumns = [
  { key: 'date', label: 'Date', width: '14%' },
  { key: 'task', label: 'Task', width: '32%' },
  { key: 'hours', label: 'Hours', align: 'right', width: '10%' },
  { key: 'status', label: 'Status', width: '14%' },
  { key: 'updated', label: 'Updated', width: '14%' },
  { key: 'actions', label: 'Actions', align: 'right', width: '16%' },
];

const reviewColumns = [
  { key: 'submitted', label: 'Submitted', width: '14%' },
  { key: 'employee', label: 'Employee', width: '18%' },
  { key: 'task', label: 'Task', width: '30%' },
  { key: 'hours', label: 'Hours', align: 'right', width: '10%' },
  { key: 'status', label: 'Status', width: '12%' },
  { key: 'review', label: 'Review', align: 'right', width: '16%' },
];

const emptyForm = {
  date: new Date().toISOString().split('T')[0],
  task_name: '',
  hours: '',
  description: '',
  challenges_faced: '',
};

const workflowFilters = ['all', 'draft', 'submitted', 'approved', 'rejected'];

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '—');
const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const WorkLogs = () => {
  const { token, user } = useAuth();
  const isManagement = ['admin', 'superadmin', 'hr'].includes(user?.role);

  const [logs, setLogs] = useState([]);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [editingLog, setEditingLog] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [reviewComment, setReviewComment] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (isManagement) {
        setReviewQueue(await getWorkLogReviewQueue(token));
      } else {
        setLogs(await getWorkLogs(token));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, isManagement]);

  const employeeSummary = useMemo(() => ({
    totalHours: logs.reduce((sum, log) => sum + Number(log.hours || 0), 0),
    approvedCount: logs.filter((log) => log.workflow_status === 'approved').length,
    submittedCount: logs.filter((log) => log.workflow_status === 'submitted').length,
  }), [logs]);

  const filteredLogs = useMemo(() => {
    if (activeFilter === 'all') return logs;
    return logs.filter((log) => log.workflow_status === activeFilter);
  }, [activeFilter, logs]);

  const openCreateModal = () => {
    setEditingLog(null);
    setFormData(emptyForm);
    setShowFormModal(true);
  };

  const openEditModal = (log) => {
    setEditingLog(log);
    setFormData({
      date: log.date,
      task_name: log.task_name,
      hours: String(log.hours ?? ''),
      description: log.description || '',
      challenges_faced: log.challenges_faced || '',
    });
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingLog(null);
    setFormData(emptyForm);
  };

  const openDetailModal = (log) => {
    setSelectedLog(log);
    setReviewComment(log.reviewer_comment || '');
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setSelectedLog(null);
    setReviewComment('');
    setShowDetailModal(false);
  };

  const buildPayload = () => {
    const hoursNum = parseFloat(formData.hours);
    if (Number.isNaN(hoursNum) || hoursNum <= 0) {
      throw new Error('Please enter a valid number of hours.');
    }

    return {
      date: formData.date,
      task_name: formData.task_name.trim(),
      hours: hoursNum,
      description: formData.description.trim() || null,
      challenges_faced: formData.challenges_faced.trim() || null,
      status: 'completed',
    };
  };

  const persistDraft = async () => {
    const payload = buildPayload();
    if (editingLog) {
      return updateWorkLog(token, editingLog.id, payload);
    }
    return createWorkLog(token, payload);
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      await persistDraft();
      closeFormModal();
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    try {
      setSaving(true);
      const savedLog = await persistDraft();

      if (editingLog?.workflow_status === 'rejected') {
        await resubmitWorkLog(token, savedLog.id);
      } else {
        await submitWorkLog(token, savedLog.id);
      }

      closeFormModal();
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (log) => {
    if (!window.confirm(`Delete draft "${log.task_name}"?`)) return;
    try {
      await deleteWorkLog(token, log.id);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReviewAction = async (action) => {
    if (!selectedLog) return;
    try {
      setSaving(true);
      if (action === 'approve') {
        await approveWorkLog(token, selectedLog.id, reviewComment);
      } else {
        await rejectWorkLog(token, selectedLog.id, reviewComment);
      }
      closeDetailModal();
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-state">Loading work logs...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;

  return (
    <div className="work-logs-container">
      {isManagement ? (
        <>
          <div className="list-controls">
            <div className="summary-pills">
              <div className="pill">
                <LuClock /> {reviewQueue.length} Pending review
              </div>
              <div className="pill">
                <LuFileText /> Individual log approvals for HR/Admin
              </div>
            </div>
          </div>

          <DashboardTable
            columns={reviewColumns}
            rows={reviewQueue}
            rowKey="id"
            minWidth={960}
            emptyTitle="No work logs waiting for review"
            emptyDescription="Submitted work logs will appear here for HR/Admin review."
            renderCell={(log, column) => {
              switch (column.key) {
                case 'submitted':
                  return formatDateTime(log.submitted_at);
                case 'employee':
                  return (
                    <div className="task-cell">
                      <strong>{log.employee_name || 'Unknown employee'}</strong>
                      <p>{log.employee_code || 'No employee code'}</p>
                    </div>
                  );
                case 'task':
                  return (
                    <div className="task-cell">
                      <strong>{log.task_name}</strong>
                      <p>{log.description || 'No description provided.'}</p>
                    </div>
                  );
                case 'hours':
                  return <span className="hours-cell">{Number(log.hours).toFixed(1)}h</span>;
                case 'status':
                  return <span className={`workflow-tag ${log.workflow_status}`}>{log.workflow_status}</span>;
                case 'review':
                  return (
                    <button className="table-action primary" onClick={() => openDetailModal(log)}>
                      Review
                    </button>
                  );
                default:
                  return null;
              }
            }}
          />
        </>
      ) : (
        <>
          <div className="list-controls">
            <div className="summary-pills">
              <div className="pill">
                <LuClock /> {employeeSummary.totalHours.toFixed(1)}h Logged
              </div>
              <div className="pill">
                <LuSend /> {employeeSummary.submittedCount} Submitted
              </div>
              <div className="pill">
                <LuCircleCheck /> {employeeSummary.approvedCount} Approved
              </div>
            </div>
            <button className="add-btn" onClick={openCreateModal}>
              <LuPlus /> New Log
            </button>
          </div>

          <div className="worklog-filter-bar">
            {workflowFilters.map((filter) => (
              <button
                key={filter}
                className={`worklog-filter ${activeFilter === filter ? 'is-active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <DashboardTable
            columns={employeeColumns}
            rows={filteredLogs}
            rowKey="id"
            minWidth={980}
            emptyTitle="No work logs found"
            emptyDescription="Create a draft work log, then submit it when you are ready."
            renderCell={(log, column) => {
              switch (column.key) {
                case 'date':
                  return formatDate(log.date);
                case 'task':
                  return (
                    <div className="task-cell">
                      <strong>{log.task_name}</strong>
                      <p>{log.description || 'No description provided.'}</p>
                    </div>
                  );
                case 'hours':
                  return <span className="hours-cell">{Number(log.hours).toFixed(1)}h</span>;
                case 'status':
                  return <span className={`workflow-tag ${log.workflow_status}`}>{log.workflow_status}</span>;
                case 'updated':
                  return formatDateTime(log.updated_at);
                case 'actions':
                  return (
                    <div className="row-actions">
                      {log.workflow_status === 'draft' && (
                        <>
                          <button className="table-action" onClick={() => openEditModal(log)}><LuPencil /></button>
                          <button className="table-action" onClick={async () => {
                            try {
                              await submitWorkLog(token, log.id);
                              await loadData();
                            } catch (err) {
                              alert(err.message);
                            }
                          }}><LuSend /></button>
                          <button className="table-action danger" onClick={() => handleDelete(log)}><LuTrash2 /></button>
                        </>
                      )}
                      {log.workflow_status === 'rejected' && (
                        <>
                          <button className="table-action" onClick={() => openEditModal(log)}><LuPencil /></button>
                          <button className="table-action primary" onClick={() => openDetailModal(log)}><LuEye /></button>
                        </>
                      )}
                      {(log.workflow_status === 'submitted' || log.workflow_status === 'approved') && (
                        <button className="table-action primary" onClick={() => openDetailModal(log)}><LuEye /></button>
                      )}
                    </div>
                  );
                default:
                  return null;
              }
            }}
          />
        </>
      )}

      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-content worklog-modal">
            <div className="modal-header">
              <h2>{editingLog ? 'Update Work Log' : 'New Work Log'}</h2>
              <button className="close-btn" onClick={closeFormModal}><LuX /></button>
            </div>

            {editingLog?.workflow_status === 'rejected' && editingLog.reviewer_comment ? (
              <div className="worklog-feedback-banner">
                <LuFileText />
                <div>
                  <strong>Previous feedback</strong>
                  <p>{editingLog.reviewer_comment}</p>
                </div>
              </div>
            ) : null}

            <form className="log-form" onSubmit={(event) => event.preventDefault()}>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Task Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Client deployment checklist"
                  value={formData.task_name}
                  onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
                />
              </div>

              <div className="form-group half">
                <label>Hours Worked</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  placeholder="e.g. 4.5"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="4"
                  placeholder="Summarize what you completed in this log."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Challenges Faced</label>
                <textarea
                  rows="3"
                  placeholder="Mention any blockers, issues, or risks you faced."
                  value={formData.challenges_faced}
                  onChange={(e) => setFormData({ ...formData, challenges_faced: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-v2" onClick={closeFormModal}>Cancel</button>
                <button type="button" className="draft-v2" disabled={saving} onClick={handleSaveDraft}>
                  {saving ? 'Saving...' : 'Save Draft'}
                </button>
                <button type="button" className="submit-v2" disabled={saving} onClick={handleSubmitForReview}>
                  {saving ? 'Submitting...' : editingLog?.workflow_status === 'rejected' ? 'Resubmit' : 'Submit for Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedLog && (
        <div className="modal-overlay">
          <div className="modal-content worklog-modal review-modal">
            <div className="modal-header">
              <h2>{isManagement ? 'Review Work Log' : 'Work Log Details'}</h2>
              <button className="close-btn" onClick={closeDetailModal}><LuX /></button>
            </div>

            <div className="review-grid">
              {isManagement ? (
                <div className="review-meta"><span>Employee</span><strong>{selectedLog.employee_name || 'Unknown employee'}</strong></div>
              ) : null}
              <div className="review-meta"><span>Date</span><strong>{formatDate(selectedLog.date)}</strong></div>
              <div className="review-meta"><span>Hours</span><strong>{Number(selectedLog.hours).toFixed(1)}h</strong></div>
              <div className="review-meta"><span>Status</span><strong className={`workflow-tag ${selectedLog.workflow_status}`}>{selectedLog.workflow_status}</strong></div>
              <div className="review-meta"><span>Submitted</span><strong>{formatDateTime(selectedLog.submitted_at)}</strong></div>
              <div className="review-meta"><span>Reviewed</span><strong>{formatDateTime(selectedLog.reviewed_at)}</strong></div>
            </div>

            <div className="review-section">
              <span>Task</span>
              <strong>{selectedLog.task_name}</strong>
            </div>

            <div className="review-section">
              <span>Description</span>
              <p>{selectedLog.description || 'No description provided.'}</p>
            </div>

            <div className="review-section">
              <span>Challenges Faced</span>
              <p>{selectedLog.challenges_faced || 'No challenges recorded.'}</p>
            </div>

            {selectedLog.reviewer_comment ? (
              <div className="review-section feedback">
                <span>Previous feedback</span>
                <p>{selectedLog.reviewer_comment}</p>
              </div>
            ) : null}

            {isManagement ? (
              <>
                <div className="form-group">
                  <label>Reviewer Comment (Optional)</label>
                  <textarea
                    rows="4"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Add context for approval or rejection."
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="cancel-v2" onClick={closeDetailModal}>Close</button>
                  <button type="button" className="submit-v2 reject" disabled={saving} onClick={() => handleReviewAction('reject')}>
                    {saving ? 'Saving...' : 'Reject'}
                  </button>
                  <button type="button" className="submit-v2 approve" disabled={saving} onClick={() => handleReviewAction('approve')}>
                    {saving ? 'Saving...' : 'Approve'}
                  </button>
                </div>
              </>
            ) : (
              <div className="form-actions">
                <button type="button" className="cancel-v2" onClick={closeDetailModal}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkLogs;
