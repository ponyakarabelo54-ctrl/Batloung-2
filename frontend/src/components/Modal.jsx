import { useEffect } from 'react';

// A pop-up window. Closes with the close button, the Escape key or a click outside.
export default function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button type="button" className="btn btn-secondary btn-small" onClick={onClose}>Close</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
