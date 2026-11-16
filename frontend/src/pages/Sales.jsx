import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import Modal from '../components/Modal.jsx';
import EmptyState from '../components/EmptyState.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import LineItemsEditor, { emptyItem, itemsTotal } from '../components/LineItemsEditor.jsx';
import { useToast } from '../components/ToastProvider.jsx';
import useLoad from '../hooks/useLoad.js';
import { api } from '../services/api.js';
import { money, number, dateTime, PAYMENT_METHODS, label } from '../utils/format.js';

const FALLBACK_PRICES = { SMALL: 120, MEDIUM: 170, LARGE: 220 };

export default function Sales() {
  const toast = useToast();
  const { data: sales, loading, reload } = useLoad(() => api.getSales(), []);
  const { data: vendors } = useLoad(() => api.getVendors(), []);
  const { data: fruits } = useLoad(() => api.getFruits(), []);
  const { data: stockRows, reload: reloadStock } = useLoad(() => api.getStock(), []);
  const { data: prices } = useLoad(() => api.getDefaultPrices(), [], FALLBACK_PRICES);

  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [vendorId, setVendorId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountPaid, setAmountPaid] = useState('');
  const [items, setItems] = useState([]);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const sellableFruits = fruits.filter((f) => f.status === 'AVAILABLE');
  const total = itemsTotal(items);

  function stockLookup(fruitId, size) {
    const row = stockRows.find((s) => s.fruit_id === fruitId && s.packaging_size === size);
    return row ? row.available_quantity : 0;
  }

  function openForm() {
    reloadStock();
    setVendorId('');
    setPaymentMethod('CASH');
    setAmountPaid('');
    setItems([{ ...emptyItem(), price: prices.MEDIUM }]);
    setFormError('');
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    if (!vendorId) return setFormError('Please select a vendor');
    if (items.some((i) => !i.fruit_id || !(Number(i.quantity) > 0) || !(Number(i.price) > 0))) {
      return setFormError('Every row needs a fruit, a quantity and a price greater than 0');
    }
    setSaving(true);
    try {
      const body = {
        vendor_id: Number(vendorId),
        payment_method: paymentMethod,
        items: items.map((i) => ({
          fruit_id: Number(i.fruit_id), packaging_size: i.packaging_size,
          quantity: Number(i.quantity), unit_price: Number(i.price),
        })),
      };
      if (amountPaid !== '') body.amount_paid = Number(amountPaid);
      const response = await api.createSale(body);
      toast.success(`Sale #${response.data.sale_id} recorded (${response.data.payment_status.replace('_', ' ')}). Stock reduced.`);
      setShowForm(false);
      reload();
    } catch (error) {
      setFormError(error.message);   // e.g. insufficient stock - nothing was saved
      toast.error(error.message);
      reloadStock();
    } finally {
      setSaving(false);
    }
  }

  async function viewSale(id) {
    try {
      setViewing((await api.getSale(id)).data);
      setPaymentAmount('');
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handlePayment(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await api.addPayment(viewing.sale_id, Number(paymentAmount));
      setViewing(response.data);
      setPaymentAmount('');
      toast.success('Payment recorded');
      reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  const visibleSales = statusFilter ? sales.filter((s) => s.payment_status === statusFilter) : sales;

  return (
    <>
      <PageHeader title="Sales" subtitle="Fruit sold to vendors. Recording a sale reduces stock and calculates the total automatically.">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by payment status" style={{ width: 'auto' }}>
          <option value="">All payment statuses</option>
          <option value="PAID">Paid</option>
          <option value="PARTIALLY_PAID">Partially paid</option>
          <option value="UNPAID">Unpaid</option>
        </select>
        {statusFilter && <button className="btn btn-secondary" onClick={() => setStatusFilter('')}>Clear</button>}
        <button className="btn btn-primary" onClick={openForm}>New sale</button>
      </PageHeader>

      <div className="table-wrap">
        {visibleSales.length === 0 ? <EmptyState loading={loading} message="No sales found." /> : (
          <table>
            <thead><tr><th>#</th><th>Date</th><th>Vendor</th><th className="num">Boxes</th><th>Method</th><th className="num">Total</th><th className="num">Paid</th><th className="num">Balance</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {visibleSales.map((s) => (
                <tr key={s.sale_id}>
                  <td>{s.sale_id}</td>
                  <td>{dateTime(s.sale_date)}</td>
                  <td><strong>{s.vendor_name}</strong></td>
                  <td className="num">{number(s.total_boxes)}</td>
                  <td><StatusBadge value={s.payment_method} /></td>
                  <td className="num">{money(s.total_amount)}</td>
                  <td className="num">{money(s.amount_paid)}</td>
                  <td className={`num ${s.balance > 0 ? 'text-danger' : ''}`}>{money(s.balance)}</td>
                  <td><StatusBadge value={s.payment_status} /></td>
                  <td><button className="btn btn-secondary btn-small" onClick={() => viewSale(s.sale_id)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <Modal title="Record sale" onClose={() => setShowForm(false)} wide>
          <form onSubmit={handleSubmit}>
            {formError && <div className="form-error">{formError}</div>}
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <label className="field">Vendor
                <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} required>
                  <option value="">Select vendor</option>
                  {vendors.map((v) => <option key={v.vendor_id} value={v.vendor_id}>{v.vendor_name} - {v.location}</option>)}
                </select>
              </label>
              <label className="field">Payment method
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{label(m)}</option>)}
                </select>
              </label>
            </div>
            <LineItemsEditor items={items} onChange={setItems} fruits={sellableFruits}
              priceLabel="Price per box (M)" defaultPrices={prices} stockLookup={stockLookup} />
            <div className="total-box"><span>Total amount payable</span><span>{money(total)}</span></div>
            <label className="field" style={{ maxWidth: 360, marginTop: 14 }}>
              {paymentMethod === 'CREDIT' ? 'Deposit paid now (optional, M)' : 'Amount paid now (M) - leave empty for full payment'}
              <input type="number" min="0" step="0.01" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder={paymentMethod === 'CREDIT' ? '0.00' : money(total)} />
            </label>
            <small className="text-muted">Status is set automatically: PAID, PARTIALLY_PAID or UNPAID. If any item has too little stock the whole sale is rejected.</small>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Record sale'}</button>
            </div>
          </form>
        </Modal>
      )}

      {viewing && (
        <Modal title={`Sale #${viewing.sale_id}`} onClose={() => setViewing(null)} wide>
          <div className="summary-list">
            <div><span>Vendor</span><strong>{viewing.vendor_name}</strong></div>
            <div><span>Date</span><strong>{dateTime(viewing.sale_date)}</strong></div>
            <div><span>Payment method</span><strong>{label(viewing.payment_method)}</strong></div>
            <div><span>Status</span><StatusBadge value={viewing.payment_status} /></div>
            <div><span>Total</span><strong>{money(viewing.total_amount)}</strong></div>
            <div><span>Paid</span><strong>{money(viewing.amount_paid)}</strong></div>
            <div><span>Outstanding balance</span><strong className={viewing.balance > 0 ? 'text-danger' : ''}>{money(viewing.balance)}</strong></div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Fruit</th><th>Size</th><th className="num">Boxes</th><th className="num">Price</th><th className="num">Line total</th></tr></thead>
              <tbody>
                {viewing.items.map((i) => (
                  <tr key={i.sales_detail_id}>
                    <td>{i.fruit_name}</td><td><StatusBadge value={i.packaging_size} /></td>
                    <td className="num">{number(i.quantity)}</td><td className="num">{money(i.unit_price)}</td><td className="num">{money(i.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {viewing.balance > 0 && (
            <form className="inline-form" style={{ marginTop: 18 }} onSubmit={handlePayment}>
              <label className="field">Record a payment (M)
                <input type="number" min="0.01" step="0.01" max={viewing.balance} value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required />
              </label>
              <button type="button" className="btn btn-secondary" onClick={() => setPaymentAmount(String(viewing.balance))}>Pay full balance</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>Save payment</button>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
