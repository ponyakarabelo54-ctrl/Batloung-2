import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import useLoad from '../hooks/useLoad.js';
import { api } from '../services/api.js';
import { money, number, dateTime } from '../utils/format.js';

export default function Dashboard() {
  const { data, loading, error, reload } = useLoad(() => api.getDashboard(), [], null);

  if (!data) {
    return (
      <>
        <PageHeader title="Dashboard" subtitle="Overview of Batloung Farm operations" />
        <div className="card">
          <EmptyState loading={loading} message={error || 'No data'} />
          {!loading && <button className="btn btn-primary" onClick={reload}>Try again</button>}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of Batloung Farm operations">
        <button className="btn btn-secondary" onClick={reload}>Refresh</button>
      </PageHeader>

      <section className="hero-banner" aria-label="Farm overview">
        <div className="hero-copy">
          <span className="eyebrow">Live harvest</span>
          <h3>Fresh produce. Better decisions.</h3>
          <p>Track every supplier, shipment, and market movement across the Batloung farm network.</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/sales">View sales</Link>
            <Link className="btn btn-secondary" to="/stock">Check stock</Link>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="photo-card" />
          <div className="hero-badge">+18.4% yield this cycle</div>
        </div>
      </section>

      <div className="stat-grid">
        <StatCard label="Total suppliers" value={number(data.total_suppliers)} />
        <StatCard label="Registered vendors" value={number(data.total_vendors)} tone="blue" />
        <StatCard label="Fruit types" value={number(data.total_fruits)} tone="earth" />
        <StatCard label="Total sales" value={money(data.total_sales_amount)} hint={`${number(data.total_sales_count)} sales recorded`} />
        <StatCard label="Total purchases" value={money(data.total_purchases_amount)} hint={`${number(data.total_purchases_count)} purchases recorded`} tone="blue" />
        <StatCard label="Available stock" value={`${number(data.available_stock)} boxes`} tone="earth" />
        <StatCard label="Low-stock alerts" value={number(data.low_stock_items.length)} hint={`${data.low_stock_threshold} boxes or fewer`} tone={data.low_stock_items.length ? 'red' : 'green'} />
        <StatCard label="Outstanding payments" value={money(data.total_outstanding)} tone="amber" />
      </div>

      <div className="two-col">
        <div className="card">
          <h3>Low-stock alerts</h3>
          {data.low_stock_items.length === 0 ? (
            <p className="text-muted">All fruit and packaging sizes are well stocked.</p>
          ) : (
            <ul className="alert-list">
              {data.low_stock_items.map((item) => (
                <li key={item.stock_id}>
                  <span><strong>{item.fruit_name}</strong> - <StatusBadge value={item.packaging_size} /></span>
                  <strong className="text-danger">{number(item.available_quantity)} boxes left</strong>
                </li>
              ))}
            </ul>
          )}
          <div className="form-actions"><Link className="btn btn-secondary btn-small" to="/purchases">Record a purchase</Link></div>
        </div>

        <div className="card">
          <h3>Recent sales</h3>
          {data.recent_sales.length === 0 ? <EmptyState message="No sales yet." /> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Vendor</th><th>Date</th><th className="num">Total</th><th>Status</th></tr></thead>
                <tbody>
                  {data.recent_sales.map((sale) => (
                    <tr key={sale.sale_id}>
                      <td>{sale.sale_id}</td>
                      <td>{sale.vendor_name}</td>
                      <td>{dateTime(sale.sale_date)}</td>
                      <td className="num">{money(sale.total_amount)}</td>
                      <td><StatusBadge value={sale.payment_status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
