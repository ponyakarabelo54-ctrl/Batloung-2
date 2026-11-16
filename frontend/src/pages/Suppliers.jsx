import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import SearchBox from '../components/SearchBox.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useToast } from '../components/ToastProvider.jsx';
import useLoad from '../hooks/useLoad.js';
import useDebounce from '../hooks/useDebounce.js';
import { api } from '../services/api.js';
import { PROVINCES } from '../utils/format.js';
import { getLocationDistance } from '../utils/location.js';

const emptyForm = { business_name: '', contact_person: '', phone: '', province: PROVINCES[0], address: '' };

export default function Suppliers() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const { data: suppliers, loading, reload } = useLoad(() => api.getSuppliers(debouncedSearch), [debouncedSearch]);
  const [distanceBySupplier, setDistanceBySupplier] = useState({});

  const [editing, setEditing] = useState(null);   // null = closed, {} = new, {supplier_id} = edit
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    let active = true;

    async function resolveDistances() {
      if (!Array.isArray(suppliers) || suppliers.length === 0) {
        setDistanceBySupplier({});
        return;
      }

      const results = await Promise.all(suppliers.map(async (supplier) => {
        const distance = await getLocationDistance(supplier.address);
        return [supplier.supplier_id, distance];
      }));

      if (active) setDistanceBySupplier(Object.fromEntries(results));
    }

    resolveDistances();
    return () => { active = false; };
  }, [suppliers]);

  function openForm(supplier) {
    setForm(supplier ? { ...supplier } : emptyForm);
    setEditing(supplier || {});
    setFormError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editing.supplier_id) {
        await api.updateSupplier(editing.supplier_id, form);
        toast.success('Supplier updated');
      } else {
        await api.createSupplier(form);
        toast.success('Supplier registered');
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

  async function handleDelete() {
    setSaving(true);
    try {
      await api.deleteSupplier(toDelete.supplier_id);
      toast.success('Supplier deleted');
      setToDelete(null);
      reload();
    } catch (error) {
      toast.error(error.message);
      setToDelete(null);
    } finally {
      setSaving(false);
    }
  }

  const setField = (name) => (event) => setForm({ ...form, [name]: event.target.value });

  return (
    <>
      <PageHeader title="Suppliers" subtitle="Businesses in South Africa that supply our fruit">
        <SearchBox value={search} onChange={setSearch} placeholder="Search name, contact, phone, province" />
        <button className="btn btn-primary" onClick={() => openForm(null)}>Add supplier</button>
      </PageHeader>

      <div className="table-wrap">
        {suppliers.length === 0 ? <EmptyState loading={loading} message="No suppliers found." /> : (
          <table>
            <thead><tr><th>ID</th><th>Business</th><th>Contact person</th><th>Phone</th><th>Province</th><th>Address</th><th>Actions</th></tr></thead>
            <tbody>
              {suppliers.map((s) => {
                const meta = distanceBySupplier[s.supplier_id] || {};
                return (
                  <tr key={s.supplier_id}>
                    <td>{s.supplier_id}</td>
                    <td><strong>{s.business_name}</strong></td>
                    <td>{s.contact_person}</td>
                    <td>{s.phone}</td>
                    <td>{s.province}</td>
                    <td>
                      <div className="map-cell">
                        <span>{s.address}</span>
                        <div className="map-meta">
                          <a href={meta.googleMapUrl || '#'} target="_blank" rel="noreferrer" className="map-link">Open map</a>
                          {meta.distanceText && <span className="map-distance">{meta.distanceText}</span>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-secondary btn-small" onClick={() => openForm(s)}>Edit</button>
                        <button className="btn btn-danger btn-small" onClick={() => setToDelete(s)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <Modal title={editing.supplier_id ? 'Edit supplier' : 'Register supplier'} onClose={() => setEditing(null)}>
          <form onSubmit={handleSubmit}>
            {formError && <div className="form-error">{formError}</div>}
            <div className="form-grid">
              <label className="field full">Business name
                <input value={form.business_name} onChange={setField('business_name')} required maxLength={100} />
              </label>
              <label className="field">Contact person
                <input value={form.contact_person} onChange={setField('contact_person')} required maxLength={100} />
              </label>
              <label className="field">Phone
                <input value={form.phone} onChange={setField('phone')} required placeholder="+27 11 555 0101" />
              </label>
              <label className="field">Province
                <select value={form.province} onChange={setField('province')}>
                  {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </label>
              <label className="field full">Address
                <input value={form.address} onChange={setField('address')} required maxLength={255} />
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save supplier'}</button>
            </div>
          </form>
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete supplier"
          message={`Delete "${toDelete.business_name}"? A supplier that already has purchases can not be deleted.`}
          busy={saving}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </>
  );
}
