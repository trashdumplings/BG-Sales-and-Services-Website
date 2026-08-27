import { useEffect, useState } from 'react'
import Modal from '../Modal/Modal'
import Button from '../Button/Button'
import './RemarksModal.css'

export default function RemarksModal({
  open,
  onClose,
  verb = 'forward',
  title,
  remarksRequired = false,
  submitting = false,
  onConfirm,
  confirmLabel,
  cancelLabel = 'Cancel',
  summary,
  error,
}) {
  const [remarks, setRemarks] = useState('')
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    if (open) {
      setRemarks('')
      setValidationError('')
    }
  }, [open])

  const handleConfirm = async () => {
    if (remarksRequired && !remarks.trim()) {
      setValidationError('Remarks are required for this action.')
      return
    }
    setValidationError('')
    await onConfirm?.(remarks.trim() || null)
  }

  const defaultLabel = verb === 'revert' ? 'Reject' : 'Confirm'

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="remarks-modal">
        {summary ? <div className="remarks-modal__summary">{summary}</div> : null}

        <label className="remarks-modal__label" htmlFor="remarks-modal-textarea">
          Remarks {remarksRequired ? '' : '(Optional)'}
        </label>
        <textarea
          id="remarks-modal-textarea"
          className="remarks-modal__textarea"
          rows={4}
          value={remarks}
          onChange={(event) => setRemarks(event.target.value)}
          placeholder="Add context for this action."
        />

        {(validationError || error) ? (
          <p className="remarks-modal__error" role="alert">{validationError || error}</p>
        ) : null}

        <div className="remarks-modal__actions">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            {cancelLabel}
          </Button>
          <Button
            variant={verb === 'revert' ? 'danger' : 'success'}
            loading={submitting}
            onClick={handleConfirm}
          >
            {confirmLabel || defaultLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
