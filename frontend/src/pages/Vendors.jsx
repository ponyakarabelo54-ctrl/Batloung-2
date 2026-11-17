import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import Modal from '../components/Modal.jsx';
import SearchBox from '../components/SearchBox.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useToast } from '../components/ToastProvider.jsx';
import useLoad from '../hooks/useLoad.js';
import useDebounce from '../hooks/useDebounce.js';
import { api } from '../services/api.js';
import { money, dateOnly } from '../utils/format.js';
import { buildDirectionsUrl, buildGoogleMapsUrl, getLocationDistance } from '../utils/location.js';

const emptyForm = { vendor_name: '', phone_number: '', location: '', registration_date: '' };

export default function Vendors() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const { data: vendors, loading, reload } = useLoad(() => api.getVendors(debouncedSearch), [debouncedSearch]);
  const [distanceByVendor, setDistanceByVendor] = useState({});

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function resolveDistances() {
      if (!Array.isArray(vendors) || vendors.length === 0) {
        setDistanceByVendor({});
        return;
      }

      const results = await Promise.all(vendors.map(async (vendor) => {
        const distance = await getLocationDistance(vendor.location);
        return [vendor.vendor_id, distance];
      }));

      if (active) setDistanceByVendor(Object.fromEntries(results));
    }

    resolveDistances();
    return () => { active = false; };
  }, [vendors]);

  function openForm(vendor) {
    setForm(vendor ? {
      vendor_name: vendor.vendor_name, phone_number: vendor.phone_number,
      location: vendor.location, registration_date: dateOnly(vendor.registration_date),
    } : emptyForm);
    setEditing(vendor || {});
    setFormError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editing.vendor_id) {
        await api.updateVendor(editing.vendor_id, form);
        toast.success('Vendor updated');
      } else {
        await api.createVendor(form);
        toast.success('Vendor registered');
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

  const setField = (name) => (event) => setForm({ ...form, [name]: event.target.value });

  return (
    <>
      <PageHeader title="Vendors" subtitle="Street vendors and small retailers we sell to">
        <SearchBox value={search} onChange={setSearch} placeholder="Search by name or phone" />
        <button className="btn btn-primary" onClick={() => openForm(null)}>Register vendor</button>
      </PageHeader>

      <div className="table-wrap">
        {vendors.length === 0 ? <EmptyState loading={loading} message="No vendors found." /> : (
          <table>
            <thead><tr><th>ID</th><th>Vendor</th><th>Phone</th><th>Location</th><th>Registered</th><th className="num">Owes us</th><th>Actions</th></tr></thead>
            <tbody>
              {vendors.map((v) => {
                const meta = distanceByVendor[v.vendor_id] || {};
                const mapQuery = `${v.location}, Lesotho`;
                return (
                  <tr key={v.vendor_id}>
                    <td>{v.vendor_id}</td>
                    <td><strong>{v.vendor_name}</strong></td>
                    <td>{v.phone_number}</td>
                    <td>
                      <div className="map-cell">
                        <span>{v.location}</span>
                        <div className="map-meta">
                          <a href={buildGoogleMapsUrl(mapQuery)} target="_blank" rel="noreferrer" className="map-link">View location in Lesotho</a>
                          <a href={buildDirectionsUrl(mapQuery)} target="_blank" rel="noreferrer" className="map-link">Driving route from Batloung Farm</a>
                          {meta.distanceText && <span className="map-distance">{meta.distanceText} straight-line</span>}
                        </div>
                      </div>
                    </td>
                    <td>{dateOnly(v.registration_date)}</td>
                    <td className={`num ${v.outstanding_balance > 0 ? 'text-danger' : ''}`}>{money(v.outstanding_balance)}</td>
                    <td><button className="btn btn-secondary btn-small" onClick={() => openForm(v)}>Edit</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <Modal title={editing.vendor_id ? 'Edit vendor' : 'Register vendor'} onClose={() => setEditing(null)}>
          <form onSubmit={handleSubmit}>
            {formError && <div className="form-error">{formError}</div>}
            <div className="form-grid">
              <label className="field full">Vendor name
                <input value={form.vendor_name} onChange={setField('vendor_name')} required maxLength={100} />
              </label>
              <label className="field">Phone number
                <input value={form.phone_number} onChange={setField('phone_number')} required placeholder="+266 5801 0009" />
              </label>
              <label className="field">Registration date (optional)
                <input type="date" value={form.registration_date} onChange={setField('registration_date')} />
              </label>
              <label className="field full">Location
                <input value={form.location} onChange={setField('location')} required maxLength={150} placeholder="Maseru - Main Bus Rank" />
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save vendor'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
