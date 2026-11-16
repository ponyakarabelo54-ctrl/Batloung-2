import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import Modal from '../components/Modal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useToast } from '../components/ToastProvider.jsx';
import useLoad from '../hooks/useLoad.js';
import { api } from '../services/api.js';

const emptyForm = { fruit_name: '', description: '', status: 'AVAILABLE' };

export default function Fruits() {
  const toast = useToast();
  const { data: fruits, loading, reload } = useLoad(() => api.getFruits(), []);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  function openForm(fruit) {
    setForm(fruit ? { fruit_name: fruit.fruit_name, description: fruit.description || '', status: fruit.status } : emptyForm);
    setEditing(fruit || {});
    setFormError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editing.fruit_id) {
        await api.updateFruit(editing.fruit_id, form);
        toast.success('Fruit updated');
      } else {
        await api.createFruit(form);
        toast.success('Fruit added with SMALL, MEDIUM and LARGE stock rows');
      }
      setEditing(null);
      reload();
    } catch (error) {
      setFormError(error.message);
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(fruit) {
    const newStatus = fruit.status === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';
    try {
      await api.changeFruitStatus(fruit.fruit_id, newStatus);
      toast.success(`${fruit.fruit_name} is now ${newStatus.toLowerCase()}`);
      reload();
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <>
      <PageHeader title="Fruits" subtitle="Fruit types we distribute. Unavailable fruit can not be sold.">
        <button className="btn btn-primary" onClick={() => openForm(null)}>Add fruit</button>
      </PageHeader>

      <div className="table-wrap">
        {fruits.length === 0 ? <EmptyState loading={loading} message="No fruits yet." /> : (
          <table>
            <thead><tr><th>ID</th><th>Fruit</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {fruits.map((f) => (
                <tr key={f.fruit_id}>
                  <td>{f.fruit_id}</td>
                  <td><strong>{f.fruit_name}</strong></td>
                  <td>{f.description}</td>
                  <td><StatusBadge value={f.status} /></td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-secondary btn-small" onClick={() => openForm(f)}>Edit</button>
                      <button className="btn btn-secondary btn-small" onClick={() => toggleStatus(f)}>
                        {f.status === 'AVAILABLE' ? 'Mark unavailable' : 'Mark available'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <Modal title={editing.fruit_id ? 'Edit fruit' : 'Add fruit'} onClose={() => setEditing(null)}>
          <form onSubmit={handleSubmit}>
            {formError && <div className="form-error">{formError}</div>}
            <div className="form-grid">
              <label className="field">Fruit name
                <input value={form.fruit_name} onChange={(e) => setForm({ ...form, fruit_name: e.target.value })} required maxLength={50} />
              </label>
              <label className="field">Status
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="UNAVAILABLE">UNAVAILABLE</option>
                </select>
              </label>
              <label className="field full">Description
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={255} />
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save fruit'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
