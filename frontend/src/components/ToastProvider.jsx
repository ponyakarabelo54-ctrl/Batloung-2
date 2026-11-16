import { createContext, useCallback, useContext, useState } from 'react';

// Success / error notifications shown in the top-right corner.
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const show = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list, { id, type, message }]);
    setTimeout(() => remove(id), type === 'error' ? 6000 : 3500);
  }, [remove]);

  const toast = {
    success: (message) => show('success', message),
    error: (message) => show('error', message),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} role="status">
            <p>{t.message}</p>
            <button type="button" onClick={() => remove(t.id)}>Dismiss</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
