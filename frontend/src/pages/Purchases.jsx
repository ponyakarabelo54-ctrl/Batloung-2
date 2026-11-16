import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import Modal from '../components/Modal.jsx';
import EmptyState from '../components/EmptyState.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import LineItemsEditor, { emptyItem, itemsTotal } from '../components/LineItemsEditor.jsx';
import { useToast } from '../components/ToastProvider.jsx';
import useLoad from '../hooks/useLoad.js';
import { api } from '../services/api.js';
import { money, number, dateTime } from '../utils/format.js';

export default function Purchases() {
  const toast = useToast();
  const { data: purchases, loading, reload } = useLoad(() => api.getPurchases(), []);
  const { data: suppliers } = useLoad(() => api.getSuppliers(), []);
  const { data: fruits } = useLoad(() => api.getFruits(), []);

  const [showForm, setShowForm] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState([emptyItem()]);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState(null);

  function openForm() {
    setSupplierId('');
    setItems([emptyItem()]);
    setFormError('');
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    if (!supplierId) return setFormError('Please select a supplier');
    if (items.some((i) => !i.fruit_id || !(Number(i.quantity) > 0) || !(Number(i.price) > 0))) {
      return setFormError('Every row needs a fruit, a quantity and a unit cost greater than 0');
    }
    setSaving(true);
    try {
      const response = await api.createPurchase({
        supplier_id: Number(supplierId),
        items: items.map((i) => ({
          fruit_id: Number(i.fruit_id), packaging_size: i.packaging_size,
          quantity: Number(i.quantity), unit_cost: Number(i.price),
        })),
      });
      toast.success(`Purchase #${response.data.purchase_id} recorded. Stock increased.`);
      setShowForm(false);
      reload();
    } catch (error) {
      setFormError(error.message);
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function viewPurchase(id) {
    try {
      setViewing((await api.getPurchase(id)).data);
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <>
      <PageHeader title="Purchases" subtitle="Fruit bought from suppliers. Recording a purchase increases stock.">
        <button className="btn btn-primary" onClick={openForm}>New purchase</button>
      </PageHeader>

      <div className="table-wrap">
        {purchases.length === 0 ? <EmptyState loading={loading} message="No purchases recorded." /> : (
          <table>
            <thead><tr><th>#</th><th>Date</th><th>Supplier</th><th>Province</th><th className="num">Boxes</th><th className="num">Total</th><th>Actions</th></tr></thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.purchase_id}>
                  <td>{p.purchase_id}</td>
                  <td>{dateTime(p.purchase_date)}</td>
                  <td><strong>{p.supplier_name}</strong></td>
                  <td>{p.province}</td>
                  <td className="num">{number(p.total_boxes)}</td>
                  <td className="num">{money(p.total_amount)}</td>
                  <td><button className="btn btn-secondary btn-small" onClick={() => viewPurchase(p.purchase_id)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <Modal title="Record purchase" onClose={() => setShowForm(false)} wide>
          <form onSubmit={handleSubmit}>
            {formError && <div className="form-error">{formError}</div>}
            <label className="field" style={{ maxWidth: 420, marginBottom: 16 }}>Supplier
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>
                <option value="">Select supplier</option>
                {suppliers.map((s) => <option key={s.supplier_id} value={s.supplier_id}>{s.business_name} ({s.province})</option>)}
              </select>
            </label>
            <LineItemsEditor items={items} onChange={setItems} fruits={fruits} priceLabel="Unit cost (M)" />
            <div className="total-box"><span>Total purchase amount</span><span>{money(itemsTotal(items))}</span></div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save purchase'}</button>
            </div>
          </form>
        </Modal>
      )}

      {viewing && (
        <Modal title={`Purchase #${viewing.purchase_id}`} onClose={() => setViewing(null)} wide>
          <div className="summary-list">
            <div><span>Supplier</span><strong>{viewing.supplier_name}</strong></div>
            <div><span>Province</span><strong>{viewing.province}</strong></div>
            <div><span>Date</span><strong>{dateTime(viewing.purchase_date)}</strong></div>
            <div><span>Total</span><strong>{money(viewing.total_amount)}</strong></div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Fruit</th><th>Size</th><th className="num">Boxes</th><th className="num">Unit cost</th><th className="num">Line total</th></tr></thead>
              <tbody>
                {viewing.items.map((i) => (
                  <tr key={i.purchase_detail_id}>
                    <td>{i.fruit_name}</td><td><StatusBadge value={i.packaging_size} /></td>
                    <td className="num">{number(i.quantity)}</td><td className="num">{money(i.unit_cost)}</td><td className="num">{money(i.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </>
  );
}
