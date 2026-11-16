import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import useLoad from '../hooks/useLoad.js';
import { api } from '../services/api.js';
import { number, SIZES } from '../utils/format.js';

export default function Stock() {
  const [fruitId, setFruitId] = useState('');
  const [size, setSize] = useState('');
  const [threshold, setThreshold] = useState(20);
  const [lowOnly, setLowOnly] = useState(false);

  const { data: fruits } = useLoad(() => api.getFruits(), []);
  const { data: allStock, loading, reload } = useLoad(() => api.getStock(), []);
  const { data: filtered } = useLoad(() => api.getStock({ fruit_id: fruitId, packaging_size: size }), [fruitId, size]);
  const { data: low } = useLoad(() => api.getLowStock(threshold === '' ? 20 : threshold), [threshold]);

  const lowKeys = new Set(low.map((item) => item.stock_id));
  const rows = lowOnly ? filtered.filter((r) => lowKeys.has(r.stock_id)) : filtered;

  // Group the stock rows by fruit so each fruit card shows SMALL / MEDIUM / LARGE
  const byFruit = allStock.reduce((groups, row) => {
    (groups[row.fruit_name] = groups[row.fruit_name] || {})[row.packaging_size] = row;
    return groups;
  }, {});

  function clearFilters() {
    setFruitId(''); setSize(''); setLowOnly(false); setThreshold(20);
  }

  return (
    <>
      <PageHeader title="Stock" subtitle="Boxes available for each fruit and packaging size">
        <button className="btn btn-secondary" onClick={reload}>Refresh</button>
      </PageHeader>

      <div className="stock-grid">
        {Object.keys(byFruit).length === 0 && <div className="card"><EmptyState loading={loading} message="No stock data." /></div>}
        {Object.entries(byFruit).map(([fruitName, sizes]) => (
          <div key={fruitName} className="card stock-card">
            <h3>{fruitName}</h3>
            {SIZES.map((s) => {
              const row = sizes[s];
              const qty = row ? row.available_quantity : 0;
              const isLow = lowKeys.has(row && row.stock_id);
              return (
                <div key={s} className={`stock-size ${isLow ? 'low' : ''}`}>
                  <span>{s}</span>
                  <strong>{number(qty)} boxes {isLow && '(Low stock)'}</strong>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Stock details</h3>
        <div className="filter-bar">
          <label className="field">Fruit
            <select value={fruitId} onChange={(e) => setFruitId(e.target.value)}>
              <option value="">All fruits</option>
              {fruits.map((f) => <option key={f.fruit_id} value={f.fruit_id}>{f.fruit_name}</option>)}
            </select>
          </label>
          <label className="field">Packaging size
            <select value={size} onChange={(e) => setSize(e.target.value)}>
              <option value="">All sizes</option>
              {SIZES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="field">Low-stock limit (boxes)
            <input type="number" min="0" value={threshold} onChange={(e) => setThreshold(e.target.value === '' ? '' : Number(e.target.value))} />
          </label>
          <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" style={{ width: 'auto' }} checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
            Show low stock only
          </label>
          <button className="btn btn-secondary" onClick={clearFilters}>Clear filters</button>
        </div>

        {rows.length === 0 ? <EmptyState message="No stock rows match the filters." /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Fruit</th><th>Packaging size</th><th className="num">Available boxes</th><th>Level</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.stock_id} className={lowKeys.has(r.stock_id) ? 'row-low' : ''}>
                    <td><strong>{r.fruit_name}</strong></td>
                    <td><StatusBadge value={r.packaging_size} /></td>
                    <td className="num">{number(r.available_quantity)}</td>
                    <td>{lowKeys.has(r.stock_id) ? <span className="badge badge-red">LOW STOCK</span> : <span className="badge badge-green">OK</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
