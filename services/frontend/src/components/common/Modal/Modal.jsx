import { useEffect } from 'react'
import { LuX } from 'react-icons/lu'
import './Modal.css'

export default function Modal({
  open,
  onClose,
  title,
  size = 'md',
  closeOnBackdrop = true,
  footer,
  children,
}) {
  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="modal-overlay"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        className={`modal-panel modal-panel--${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-panel__header">
          <h2>{title}</h2>
          <button type="button" className="modal-panel__close" onClick={onClose} aria-label="Close">
            <LuX />
          </button>
        </div>

        <div className="modal-panel__body">{children}</div>

        {footer ? <div className="modal-panel__footer">{footer}</div> : null}
      </div>
    </div>
  )
}
