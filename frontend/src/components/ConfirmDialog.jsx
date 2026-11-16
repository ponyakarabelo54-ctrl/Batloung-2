import Modal from './Modal.jsx';

export default function ConfirmDialog({ title, message, confirmText = 'Delete', busy, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p>{message}</p>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy}>
          {busy ? 'Please wait...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}
