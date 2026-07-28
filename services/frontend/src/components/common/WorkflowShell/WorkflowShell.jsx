import { LuPlus } from 'react-icons/lu'
import Button from '../Button/Button'
import RemarksModal from '../RemarksModal/RemarksModal'
import './WorkflowShell.css'

export default function WorkflowShell({
  stages = [],
  activeStage,
  onStageChange,
  createLabel = '+ Register',
  onCreate,
  view,
  renderList,
  renderForm,
  remarksModal,
  remarksTitle,
  history = [],
  historyTitle = 'History',
}) {
  const isFormView = view === 'form'

  return (
    <div className="workflow-shell">
      {!isFormView ? (
        <div className="workflow-shell__tabs">
          <nav className="workflow-shell__tab-list" aria-label="Workflow stages">
            {stages.map((stage) => (
              <button
                key={stage.key}
                type="button"
                className={`workflow-shell__tab workflow-shell__tab--${stage.tone || 'neutral'} ${activeStage === stage.key ? 'is-active' : ''}`}
                onClick={() => onStageChange?.(stage.key)}
              >
                {stage.label}
              </button>
            ))}
          </nav>

          {onCreate ? (
            <Button variant="primary" onClick={onCreate}>
              <LuPlus /> {createLabel}
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="workflow-shell__body">
        {isFormView ? renderForm?.() : renderList?.()}
      </div>

      {isFormView && history.length > 0 ? (
        <div className="workflow-shell__history">
          <h3>{historyTitle}</h3>
          <ul>
            {history.map((entry, index) => (
              <li key={index}>
                <span className="workflow-shell__history-label">{entry.label}</span>
                {entry.actor ? <span> by <strong>{entry.actor}</strong></span> : null}
                {entry.at ? <span className="workflow-shell__history-time"> · {new Date(entry.at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span> : null}
                {entry.note ? <p className="workflow-shell__history-note">{entry.note}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {remarksModal ? (
        <RemarksModal
          open={remarksModal.open}
          onClose={remarksModal.close}
          verb={remarksModal.verb}
          submitting={remarksModal.submitting}
          onConfirm={remarksModal.submit}
          title={remarksTitle?.(remarksModal.verb, remarksModal.record) ||
            (remarksModal.verb === 'revert' ? 'Reject' : 'Approve')}
        />
      ) : null}
    </div>
  )
}
