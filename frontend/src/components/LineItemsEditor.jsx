import { SIZES, money, number } from '../utils/format.js';

// Rows of "fruit + packaging size + quantity + price". Used by Purchases
// (priceField = 'unit_cost') and Sales (priceField = 'unit_price').
export function emptyItem() {
  return { fruit_id: '', packaging_size: 'MEDIUM', quantity: '', price: '' };
}

export function itemsTotal(items) {
  return items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
}

export default function LineItemsEditor({
  items, onChange, fruits, priceLabel, defaultPrices, stockLookup,
}) {
  function updateRow(index, changes) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...changes } : item)));
  }

  function changeSize(index, size) {
    // In sales the price follows the packaging size (each size has its own price).
    const changes = { packaging_size: size };
    if (defaultPrices) changes.price = defaultPrices[size];
    updateRow(index, changes);
  }

  function removeRow(index) {
    onChange(items.filter((_, i) => i !== index));
  }

  function addRow() {
    const row = emptyItem();
    if (defaultPrices) row.price = defaultPrices[row.packaging_size];
    onChange([...items, row]);
  }

  return (
    <div className="line-items">
      <div className="line-items-head">
        <span>Fruit</span><span>Size</span><span>Boxes</span><span>{priceLabel}</span><span>Line total</span><span />
      </div>
      {items.map((item, index) => {
        const available = stockLookup && item.fruit_id
          ? stockLookup(Number(item.fruit_id), item.packaging_size) : null;
        const tooMany = available !== null && Number(item.quantity) > available;
        return (
          <div key={index} className="line-item-row">
            <select value={item.fruit_id} onChange={(e) => updateRow(index, { fruit_id: e.target.value })} aria-label="Fruit">
              <option value="">Select fruit</option>
              {fruits.map((fruit) => (
                <option key={fruit.fruit_id} value={fruit.fruit_id}>{fruit.fruit_name}</option>
              ))}
            </select>
            <select value={item.packaging_size} onChange={(e) => changeSize(index, e.target.value)} aria-label="Packaging size">
              {SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
            <div>
              <input
                type="number" min="1" step="1" placeholder="0" value={item.quantity}
                className={tooMany ? 'input-error' : ''}
                onChange={(e) => updateRow(index, { quantity: e.target.value })} aria-label="Quantity in boxes"
              />
              {available !== null && (
                <small className={tooMany ? 'text-danger' : 'text-muted'}>In stock: {number(available)}</small>
              )}
            </div>
            <input
              type="number" min="0.01" step="0.01" placeholder="0.00" value={item.price}
              onChange={(e) => updateRow(index, { price: e.target.value })} aria-label={priceLabel}
            />
            <strong className="line-total">{money((Number(item.quantity) || 0) * (Number(item.price) || 0))}</strong>
            <button type="button" className="text-button danger" onClick={() => removeRow(index)}
              disabled={items.length === 1}>Remove</button>
          </div>
        );
      })}
      <button type="button" className="btn btn-secondary btn-small" onClick={addRow}>Add another fruit</button>
    </div>
  );
}
