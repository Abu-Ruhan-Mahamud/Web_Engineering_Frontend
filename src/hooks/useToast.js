import { useState, useCallback, useRef } from 'react';

let _toastId = 0;

/**
 * Lightweight toast-notification hook.
 *
 * Usage:
 *   const { toasts, addToast, removeToast } = useToast();
 *
 * addToast({ title, message, type })   — type: 'medication' | 'appointment' | 'lab_result' | 'system'
 * removeToast(id)                      — dismiss early
 *
 * Each toast auto-dismisses after `duration` ms (default 8 000).
 */
export default function useToast(duration = 8000) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ title, message, type = 'system' }) => {
      const id = ++_toastId;
      setToasts((prev) => [...prev, { id, title, message, type }]);

      // Auto-dismiss
      timersRef.current[id] = setTimeout(() => removeToast(id), duration);

      return id;
    },
    [duration, removeToast],
  );

  return { toasts, addToast, removeToast };
}
