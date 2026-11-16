import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import StatCard from '../components/StatCard.jsx';
import { useToast } from '../components/ToastProvider.jsx';
import useLoad from '../hooks/useLoad.js';
import { api } from '../services/api.js';
import { money, number } from '../utils/format.js';

export default function Reports() {
  const toast = useToast();
  const { data: topFruits, loading: loadingFruits } = useLoad(() => api.getTopFruits(), []);
  const { data: topVendor } = useLoad(() => api.getTopVendor(), [], { top_vendor: null, ranking: [] });
  const { data: stock } = useLoad(() => api.getStockReport(), []);
  const { data: balances, reload: reloadBalances } = useLoad(() => api.getOutstandingBalances(), []);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [revenue, setRevenue] = useState(null);
  const [loadingRevenue, setLoadingRevenue] = useState(false);

  async function handleRevenue(event) {
    event.preventDefault();
    setLoadingRevenue(true);
    try {
      setRevenue((await api.getRevenue(from, to)).data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingRevenue(false);
    }
  }

  function clearRevenue() { setFrom(''); setTo(''); setRevenue(null); }

  const maxBoxes = Math.max(1, ...topFruits.map((f) => f.boxes_sold));
  const totalOutstanding = balances.reduce((sum, b) => sum + Number(b.outstanding_balance), 0);

  return (
    <>
      <PageHeader title="Reports" subtitle="Sales, stock and payment reports" />

      <div className="two-col">
        <div className="card">
          <h3>Top 5 most sold fruits</h3>
          {topFruits.length === 0 ? <EmptyState loading={loadingFruits} message="No sales yet." /> : topFruits.map((f) => (
            <div className="bar-row" key={f.fruit_id}>
              <strong>{f.fruit_name}</strong>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${(f.boxes_sold / maxBoxes) * 100}%` }} /></div>
              <span>{number(f.boxes_sold)} boxes</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h3>Vendor with the most boxes purchased</h3>
          {topVendor.top_vendor ? (
            <>
              <p style={{ fontSize: 20 }}><strong>{topVendor.top_vendor.vendor_name}</strong></p>
              <p className="text-muted">{topVendor.top_vendor.location}</p>
              <p style={{ margin: '8px 0 14px' }}><strong>{number(topVendor.top_vendor.total_boxes)}</strong> boxes in total</p>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Rank</th><th>Vendor</th><th className="num">Boxes</th></tr></thead>
                  <tbody>
                    {topVendor.ranking.map((v, index) => (
                      <tr key={v.vendor_id}><td>{index + 1}</td><td>{v.vendor_name}</td><td className="num">{number(v.total_boxes)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : <EmptyState message="No sales yet." />}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h3>Sales revenue for a date range</h3>
        <form className="inline-form" onSubmit={handleRevenue}>
          <label className="field">From
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} required />
          </label>
          <label className="field">To
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} required />
          </label>
          <button type="submit" className="btn btn-primary" disabled={loadingRevenue}>{loadingRevenue ? 'Loading...' : 'Show revenue'}</button>
          <button type="button" className="btn btn-secondary" onClick={clearRevenue}>Clear</button>
        </form>
        {revenue && (
          <div className="stat-grid" style={{ marginTop: 16, marginBottom: 0 }}>
            <StatCard label="Total revenue" value={money(revenue.total_revenue)} hint={`${revenue.from} to ${revenue.to}`} />
            <StatCard label="Number of sales" value={number(revenue.number_of_sales)} tone="blue" />
            <StatCard label="Amount collected" value={money(revenue.amount_collected)} tone="earth" />
            <StatCard label="Still outstanding" value={money(revenue.amount_outstanding)} tone="amber" />
          </div>
        )}
      </div>

      <div className="two-col">
        <div className="card">
          <h3>Outstanding balances per vendor</h3>
          <p className="text-muted" style={{ marginBottom: 10 }}>Total owed: <strong className="text-danger">{money(totalOutstanding)}</strong></p>
          {balances.length === 0 ? <EmptyState message="No vendor owes any money." /> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Vendor</th><th>Phone</th><th className="num">Billed</th><th className="num">Paid</th><th className="num">Owes</th></tr></thead>
                <tbody>
                  {balances.map((b) => (
                    <tr key={b.vendor_id}>
                      <td><strong>{b.vendor_name}</strong></td><td>{b.phone_number}</td>
                      <td className="num">{money(b.total_billed)}</td><td className="num">{money(b.total_paid)}</td>
                      <td className="num text-danger">{money(b.outstanding_balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="form-actions"><button className="btn btn-secondary btn-small" onClick={reloadBalances}>Refresh</button></div>
        </div>

        <div className="card">
          <h3>Current stock by fruit and size</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Fruit</th><th>Size</th><th className="num">Boxes</th></tr></thead>
              <tbody>
                {stock.map((r) => (
                  <tr key={r.stock_id}><td>{r.fruit_name}</td><td><StatusBadge value={r.packaging_size} /></td><td className="num">{number(r.available_quantity)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
