import React from 'react';
import { createPortal } from 'react-dom';
import { LuCircleAlert, LuCircleCheck, LuInfo, LuTriangleAlert, LuX } from 'react-icons/lu';
import './SystemFeedback.css';

const FeedbackContext = React.createContext(null);
const icons = { error: LuCircleAlert, success: LuCircleCheck, warning: LuTriangleAlert, info: LuInfo };

export function SystemFeedbackProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);
  const [dialog, setDialog] = React.useState(null);
  const cancelRef = React.useRef(null);

  const dismiss = React.useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = React.useCallback((message, options = {}) => {
    const id = `${Date.now()}-${Math.random()}`;
    const type = options.type || 'error';
    setToasts((current) => [...current.slice(-2), {
      id,
      message,
      type,
      title: options.title || (type === 'success' ? 'Success' : type === 'warning' ? 'Attention' : type === 'info' ? 'Information' : 'Something went wrong'),
    }]);
    window.setTimeout(() => dismiss(id), options.duration || 5000);
  }, [dismiss]);

  const confirm = React.useCallback((options) => new Promise((resolve) => {
    const config = typeof options === 'string' ? { message: options } : options;
    setDialog({
      title: config.title || 'Confirm action',
      message: config.message,
      confirmLabel: config.confirmLabel || 'Confirm',
      cancelLabel: config.cancelLabel || 'Cancel',
      tone: config.tone || 'danger',
      resolve,
    });
  }), []);

  const closeDialog = React.useCallback((result) => {
    setDialog((current) => {
      current?.resolve(result);
      return null;
    });
  }, []);

  React.useEffect(() => {
    if (!dialog) return undefined;
    const previouslyFocused = document.activeElement;
    cancelRef.current?.focus();
    const handleKeyDown = (event) => event.key === 'Escape' && closeDialog(false);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [dialog, closeDialog]);

  const value = React.useMemo(() => ({ notify, confirm }), [notify, confirm]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' ? createPortal(
        <>
          <div className="system-toast-region" aria-live="polite" aria-label="System notifications">
            {toasts.map((toast) => {
              const Icon = icons[toast.type] || icons.info;
              return (
                <div key={toast.id} className={`system-toast is-${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}>
                  <Icon className="system-toast__icon" aria-hidden="true" />
                  <div><strong>{toast.title}</strong><p>{toast.message}</p></div>
                  <button type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification"><LuX /></button>
                </div>
              );
            })}
          </div>
          {dialog ? (
            <div className="system-dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && closeDialog(false)}>
              <section className="system-dialog" role="alertdialog" aria-modal="true" aria-labelledby="system-dialog-title" aria-describedby="system-dialog-description">
                <div className={`system-dialog__symbol is-${dialog.tone}`}><LuTriangleAlert aria-hidden="true" /></div>
                <div className="system-dialog__copy">
                  <span>Confirmation required</span>
                  <h2 id="system-dialog-title">{dialog.title}</h2>
                  <p id="system-dialog-description">{dialog.message}</p>
                </div>
                <div className="system-dialog__actions">
                  <button ref={cancelRef} type="button" className="is-secondary" onClick={() => closeDialog(false)}>{dialog.cancelLabel}</button>
                  <button type="button" className={`is-${dialog.tone}`} onClick={() => closeDialog(true)}>{dialog.confirmLabel}</button>
                </div>
              </section>
            </div>
          ) : null}
        </>,
        document.body,
      ) : null}
    </FeedbackContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSystemFeedback() {
  const context = React.useContext(FeedbackContext);
  if (!context) throw new Error('useSystemFeedback must be used inside SystemFeedbackProvider');
  return context;
}
