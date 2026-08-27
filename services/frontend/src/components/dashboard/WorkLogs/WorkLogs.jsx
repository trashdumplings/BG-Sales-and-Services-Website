import React, { useMemo, useState } from 'react';
import { useAuth } from '../../../stores/AuthProvider';
import {
  approveWorkLog,
  createWorkLog,
  deleteWorkLog,
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
  LuSend,
  LuTrash2,
} from 'react-icons/lu';
import DashboardTable from '../../common/DashboardTable/DashboardTable';
import Modal from '../../common/Modal/Modal';
import Button from '../../common/Button/Button';
import StatusBadge from '../../common/StatusBadge/StatusBadge';
import WorkflowShell from '../../common/WorkflowShell/WorkflowShell';
import RemarksModal from '../../common/RemarksModal/RemarksModal';
import { useWorkflow } from '../../../composables/useWorkflow';
import { useSystemFeedback } from '../../common/SystemFeedback/SystemFeedback';
import './WorkLogs.css';

const employeeColumns = [
  { key: 'date', label: 'Date', width: '14%' },
  { key: 'task', label: 'Task', width: '34%' },
  { key: 'hours', label: 'Hours', align: 'right', width: '10%' },
  { key: 'status', label: 'Status', width: '14%' },
  { key: 'updated', label: 'Updated', width: '18%' },
  { key: 'actions', label: 'Actions', align: 'right', width: '10%' },
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

const stages = [
  { key: 'all', label: 'All', tone: 'neutral' },
  { key: 'draft', label: 'Draft', tone: 'muted' },
  { key: 'submitted', label: 'Submitted', tone: 'info' },
  { key: 'approved', label: 'Approved', tone: 'success' },
  { key: 'rejected', label: 'Rejected', tone: 'danger' },
];

const getStagesForRole = (role) => {
  if (role === 'hr') {
    return stages.filter((stage) => ['submitted', 'approved', 'rejected'].includes(stage.key));
  }
  return stages;
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '-');
const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '-';

const buildHistory = (log) => {
  if (!log) return [];
  return [
    log.created_at && { label: 'Draft created', at: log.created_at },
    log.submitted_at && { label: 'Submitted for review', at: log.submitted_at },
    log.reviewed_at && {
      label: log.workflow_status === 'approved' ? 'Approved' : 'Rejected',
      at: log.reviewed_at,
      actor: log.reviewed_by_id ? 'reviewer' : undefined,
      note: log.reviewer_comment || undefined,
    },
  ].filter(Boolean);
};

const WorkLogs = () => {
  const { confirm, notify } = useSystemFeedback();
  const { token, user } = useAuth();
  const isManagement = ['superadmin', 'hr'].includes(user?.role);
  const roleStages = useMemo(() => getStagesForRole(user?.role), [user?.role]);

  const [editingLog, setEditingLog] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [detailLog, setDetailLog] = useState(null);

  const workflow = useWorkflow({
    stages: roleStages,
    fetchList: async () => getWorkLogs(token),
    getStatus: (log) => log.workflow_status,
    getCanAct: (log) =>
      isManagement ? log.workflow_status === 'submitted' : ['draft', 'rejected'].includes(log.workflow_status),
    getCanRevert: (log) => isManagement && log.workflow_status === 'submitted',
    onForward: async (log, remarks) => {
      if (isManagement) return approveWorkLog(token, log.id, remarks);
      if (log.workflow_status === 'rejected') return resubmitWorkLog(token, log.id);
      return submitWorkLog(token, log.id);
    },
    onRevert: async (log, remarks) => rejectWorkLog(token, log.id, remarks),
    buildHistory,
    currentUser: user,
  });

  const employeeSummary = useMemo(() => ({
    totalHours: workflow.records.reduce((sum, log) => sum + Number(log.hours || 0), 0),
    approvedCount: workflow.records.filter((log) => log.workflow_status === 'approved').length,
    submittedCount: workflow.records.filter((log) => log.workflow_status === 'submitted').length,
  }), [workflow.records]);

  const filteredLogs = useMemo(() => {
    if (workflow.activeStage === 'all') return workflow.records;
    return workflow.records.filter((log) => log.workflow_status === workflow.activeStage);
  }, [workflow.activeStage, workflow.records]);

  const managementSummary = useMemo(() => ({
    submittedCount: workflow.records.filter((log) => log.workflow_status === 'submitted').length,
    approvedCount: workflow.records.filter((log) => log.workflow_status === 'approved').length,
    rejectedCount: workflow.records.filter((log) => log.workflow_status === 'rejected').length,
    totalHours: filteredLogs.reduce((sum, log) => sum + Number(log.hours || 0), 0),
  }), [filteredLogs, workflow.records]);

  const openCreateForm = () => {
    setEditingLog(null);
    setFormData(emptyForm);
    setFormError('');
    workflow.openCreate();
  };

  const openEditForm = (log) => {
    setEditingLog(log);
    setFormData({
      date: log.date,
      task_name: log.task_name,
      hours: String(log.hours ?? ''),
      description: log.description || '',
      challenges_faced: log.challenges_faced || '',
    });
    setFormError('');
    workflow.openRecord(log);
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
      setFormError('');
      setSaving(true);
      await persistDraft();
      workflow.openList();
      await workflow.reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    try {
      setFormError('');
      setSaving(true);
      const savedLog = await persistDraft();
      workflow.remarksModal.openFor(savedLog, 'forward');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (log) => {
    const confirmed = await confirm({
      title: 'Delete draft work log?',
      message: `The draft "${log.task_name}" will be permanently removed.`,
      confirmLabel: 'Delete draft',
    });
    if (!confirmed) return;
    try {
      await deleteWorkLog(token, log.id);
      await workflow.reload();
    } catch (err) {
      notify(err.message);
    }
  };

  const renderForm = () => (
    <div className="worklog-form-view">
      <p className="worklog-form-intro">Log what you worked on, then save a draft or submit it for review.</p>
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
          <div className="log-form__grid">
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

            <div className="form-group form-group--full">
              <label>Task Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Client deployment checklist"
                value={formData.task_name}
                onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
              />
            </div>

            <div className="form-group form-group--full">
              <label>Description</label>
              <textarea
                rows="4"
                placeholder="Summarize what you completed in this log."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="form-group form-group--full">
              <label>Challenges Faced</label>
              <textarea
                rows="3"
                placeholder="Mention any blockers, issues, or risks you faced."
                value={formData.challenges_faced}
                onChange={(e) => setFormData({ ...formData, challenges_faced: e.target.value })}
              />
            </div>
          </div>

          {formError ? <p className="worklog-form-error" role="alert">{formError}</p> : null}

          <div className="form-actions">
            <Button variant="secondary" disabled={saving} onClick={workflow.openList}>Cancel</Button>
            <Button variant="secondary" loading={saving} onClick={handleSaveDraft}>Save Draft</Button>
            <Button variant="primary" loading={saving} onClick={handleSubmitForReview}>
              {editingLog?.workflow_status === 'rejected' ? 'Resubmit' : 'Submit for Review'}
            </Button>
          </div>
        </form>
    </div>
  );

  const renderEmployeeList = () => (
    <>
      <div className="list-controls">
        <div className="summary-pills">
          <div className="pill"><LuClock /> {employeeSummary.totalHours.toFixed(1)}h Logged</div>
          <div className="pill"><LuSend /> {employeeSummary.submittedCount} Submitted</div>
          <div className="pill"><LuCircleCheck /> {employeeSummary.approvedCount} Approved</div>
        </div>
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
              return <StatusBadge status={log.workflow_status} />;
            case 'updated':
              return formatDateTime(log.updated_at);
            case 'actions':
              return (
                <div className="row-actions">
                  {log.workflow_status === 'draft' && (
                    <>
                      <button className="table-action" aria-label={`Edit ${log.task_name}`} title="Edit log" onClick={() => openEditForm(log)}><LuPencil aria-hidden="true" /></button>
                      <button className="table-action" aria-label={`Submit ${log.task_name} for review`} title="Submit for review" onClick={() => workflow.remarksModal.openFor(log, 'forward')}><LuSend aria-hidden="true" /></button>
                      <button className="table-action danger" aria-label={`Delete ${log.task_name}`} title="Delete draft" onClick={() => handleDelete(log)}><LuTrash2 aria-hidden="true" /></button>
                    </>
                  )}
                  {log.workflow_status === 'rejected' && (
                    <>
                      <button className="table-action" aria-label={`Edit ${log.task_name}`} title="Edit log" onClick={() => openEditForm(log)}><LuPencil aria-hidden="true" /></button>
                      <button className="table-action primary" aria-label={`View ${log.task_name}`} title="View details" onClick={() => setDetailLog(log)}><LuEye aria-hidden="true" /></button>
                    </>
                  )}
                  {(log.workflow_status === 'submitted' || log.workflow_status === 'approved') && (
                    <button className="table-action primary" aria-label={`View ${log.task_name}`} title="View details" onClick={() => setDetailLog(log)}><LuEye aria-hidden="true" /></button>
                  )}
                </div>
              );
            default:
              return null;
          }
        }}
      />
    </>
  );

  if (workflow.loading && workflow.records.length === 0) return <div className="loading-state">Loading work logs...</div>;
  if (workflow.error) return <div className="error-state">Error: {workflow.error}</div>;

  if (isManagement) {
    return (
      <div className="work-logs-container">
        <div className="workflow-shell__tabs worklog-tabs">
          <nav className="workflow-shell__tab-list" aria-label="Work log stages">
            {roleStages.map((stage) => (
              <button
                key={stage.key}
                type="button"
                className={`workflow-shell__tab workflow-shell__tab--${stage.tone || 'neutral'} ${workflow.activeStage === stage.key ? 'is-active' : ''}`}
                onClick={() => workflow.setActiveStage(stage.key)}
              >
                {stage.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="list-controls">
          <div className="summary-pills">
            <div className="pill"><LuClock /> {managementSummary.totalHours.toFixed(1)}h in view</div>
            <div className="pill"><LuSend /> {managementSummary.submittedCount} Submitted</div>
            <div className="pill"><LuCircleCheck /> {managementSummary.approvedCount} Approved</div>
            <div className="pill pill--danger"><LuFileText /> {managementSummary.rejectedCount} Rejected</div>
          </div>
        </div>

        <DashboardTable
          columns={reviewColumns}
          rows={filteredLogs}
          rowKey="id"
          minWidth={960}
          emptyTitle="No work logs found"
          emptyDescription="Work logs will appear here once they match the selected status."
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
                return <StatusBadge status={log.workflow_status} />;
              case 'review':
                return (
                  <button
                    className={`table-action ${log.workflow_status === 'submitted' ? 'primary' : ''}`}
                    aria-label={`${log.workflow_status === 'submitted' ? 'Review' : 'View'} ${log.task_name}`}
                    onClick={() => setDetailLog(log)}
                  >
                    {log.workflow_status === 'submitted' ? 'Review' : <LuEye />}
                  </button>
                );
              default:
                return null;
            }
          }}
        />

        <Modal
          open={Boolean(detailLog)}
          onClose={() => setDetailLog(null)}
          title="Review Work Log"
          size="lg"
        >
          {detailLog ? (
            <div className="review-grid-wrap">
              <div className="review-grid">
                <div className="review-meta"><span>Employee</span><strong>{detailLog.employee_name || 'Unknown employee'}</strong></div>
                <div className="review-meta"><span>Date</span><strong>{formatDate(detailLog.date)}</strong></div>
                <div className="review-meta"><span>Hours</span><strong>{Number(detailLog.hours).toFixed(1)}h</strong></div>
                <div className="review-meta"><span>Status</span><StatusBadge status={detailLog.workflow_status} /></div>
              </div>
              <div className="review-section"><span>Task</span><strong>{detailLog.task_name}</strong></div>
              <div className="review-section"><span>Description</span><p>{detailLog.description || 'No description provided.'}</p></div>
              <div className="review-section"><span>Challenges Faced</span><p>{detailLog.challenges_faced || 'No challenges recorded.'}</p></div>

              <div className="form-actions">
                <Button variant="secondary" onClick={() => setDetailLog(null)}>Close</Button>
                <Button
                  variant="danger"
                  disabled={!workflow.canRevert(detailLog)}
                  onClick={() => { workflow.remarksModal.openFor(detailLog, 'revert'); setDetailLog(null); }}
                >
                  Reject
                </Button>
                <Button
                  variant="success"
                  disabled={!workflow.canAct(detailLog)}
                  onClick={() => { workflow.remarksModal.openFor(detailLog, 'forward'); setDetailLog(null); }}
                >
                  Approve
                </Button>
              </div>
            </div>
          ) : null}
        </Modal>

        <RemarksModal
          open={workflow.remarksModal.open}
          onClose={workflow.remarksModal.close}
          verb={workflow.remarksModal.verb}
          submitting={workflow.remarksModal.submitting}
          onConfirm={workflow.remarksModal.submit}
          title={workflow.remarksModal.verb === 'revert' ? 'Reject work log' : 'Approve work log'}
        />
      </div>
    );
  }

  return (
    <div className="work-logs-container">
      <WorkflowShell
        stages={stages}
        activeStage={workflow.activeStage}
        onStageChange={workflow.setActiveStage}
        createLabel="New Log"
        onCreate={openCreateForm}
        view="list"
        renderList={renderEmployeeList}
        remarksModal={workflow.remarksModal}
        remarksTitle={(verb) => (verb === 'revert' ? 'Reject work log' : 'Submit work log')}
      />

      <Modal
        open={workflow.view === 'form'}
        onClose={workflow.openList}
        title={editingLog ? 'Update Work Log' : 'New Work Log'}
        size="lg"
      >
        {renderForm()}
        {workflow.history.length > 0 ? (
          <div className="worklog-modal-history">
            <h3>History</h3>
            <ul>
              {workflow.history.map((entry, index) => (
                <li key={index}>
                  <span>{entry.label}</span>
                  {entry.at ? <strong>{new Date(entry.at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</strong> : null}
                  {entry.note ? <p>{entry.note}</p> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(detailLog)}
        onClose={() => setDetailLog(null)}
        title="Work Log Details"
        size="lg"
      >
        {detailLog ? (
          <div className="review-grid-wrap">
            <div className="review-grid">
              <div className="review-meta"><span>Date</span><strong>{formatDate(detailLog.date)}</strong></div>
              <div className="review-meta"><span>Hours</span><strong>{Number(detailLog.hours).toFixed(1)}h</strong></div>
              <div className="review-meta"><span>Status</span><StatusBadge status={detailLog.workflow_status} /></div>
              <div className="review-meta"><span>Submitted</span><strong>{formatDateTime(detailLog.submitted_at)}</strong></div>
            </div>
            <div className="review-section"><span>Task</span><strong>{detailLog.task_name}</strong></div>
            <div className="review-section"><span>Description</span><p>{detailLog.description || 'No description provided.'}</p></div>
            <div className="review-section"><span>Challenges Faced</span><p>{detailLog.challenges_faced || 'No challenges recorded.'}</p></div>
            {detailLog.reviewer_comment ? (
              <div className="review-section feedback"><span>Reviewer feedback</span><p>{detailLog.reviewer_comment}</p></div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default WorkLogs;
