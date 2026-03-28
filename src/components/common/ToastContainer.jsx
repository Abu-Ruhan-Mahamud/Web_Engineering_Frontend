import { useEffect, useRef } from 'react';
import '../../styles/toast.css';

/* ── Icon per notification type ── */
const ICONS = {
  medication: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.22 11.29l4.95-4.95a3.5 3.5 0 014.95 0l4.95 4.95a3.5 3.5 0 010 4.95l-4.95 4.95a3.5 3.5 0 01-4.95 0l-4.95-4.95a3.5 3.5 0 010-4.95z"/>
      <path d="M12 8v8M8 12h8"/>
    </svg>
  ),
  appointment: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  ),
  lab_result: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3v8l-4 7a2 2 0 001.74 3h10.52A2 2 0 0019 18l-4-7V3"/>
      <path d="M8 3h8"/>
    </svg>
  ),
  system: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 8v4M12 16h.01"/>
    </svg>
  ),
};

const TYPE_LABELS = {
  medication: 'Medication Reminder',
  appointment: 'Appointment',
  lab_result: 'Lab Result',
  system: 'Notification',
  prescription: 'Prescription',
};

/**
 * Renders a stack of toast popups in the top-right corner.
 *
 * Props:
 *   toasts      — array of { id, title, message, type }
 *   removeToast — fn(id) to dismiss
 */
export default function ToastContainer({ toasts, removeToast }) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="assertive" aria-atomic="true">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  const ref = useRef(null);

  // Progress bar countdown handled via CSS animation
  useEffect(() => {
    // Accessibility: focus the toast briefly so screen readers announce it
    ref.current?.focus();
  }, []);

  const icon = ICONS[toast.type] || ICONS.system;
  const label = TYPE_LABELS[toast.type] || 'Notification';

  return (
    <div
      className={`toast-item toast-type-${toast.type || 'system'}`}
      role="alert"
      tabIndex={-1}
      ref={ref}
    >
      <div className="toast-icon">{icon}</div>
      <div className="toast-body">
        <span className="toast-label">{label}</span>
        <p className="toast-title">{toast.title}</p>
        {toast.message && <p className="toast-message">{toast.message}</p>}
      </div>
      <button className="toast-close" onClick={onClose} aria-label="Dismiss">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
      <div className="toast-progress" />
    </div>
  );
}
