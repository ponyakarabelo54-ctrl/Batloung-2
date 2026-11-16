// Validates and tidies the "items" array sent for purchases and sales.
const AppError = require('./AppError');
const { PACKAGING_SIZES } = require('../config/constants');
const { cleanId, cleanEnum, cleanPositiveInteger, cleanPositiveMoney } = require('./validators');

// priceField is 'unit_cost' (purchase) or 'unit_price' (sale).
// defaultPrices lets sales fall back to the default price for a packaging size.
function cleanItems(rawItems, priceField, defaultPrices) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new AppError(400, 'items must be a list with at least one fruit');
  }
  if (rawItems.length > 50) throw new AppError(400, 'A single transaction can have at most 50 items');

  const merged = new Map(); // key: fruit + size, so duplicates are combined
  rawItems.forEach((raw, index) => {
    const label = `Item ${index + 1}`;
    if (!raw || typeof raw !== 'object') throw new AppError(400, `${label} is not valid`);
    const item = {
      fruit_id: cleanId(raw.fruit_id, `${label}: fruit_id`),
      packaging_size: cleanEnum(raw.packaging_size, PACKAGING_SIZES, `${label}: packaging_size`),
      quantity: cleanPositiveInteger(raw.quantity, `${label}: quantity`),
    };
    const hasPrice = raw[priceField] !== undefined && raw[priceField] !== null && raw[priceField] !== '';
    if (hasPrice) {
      item[priceField] = cleanPositiveMoney(raw[priceField], `${label}: ${priceField}`);
    } else if (defaultPrices) {
      item[priceField] = defaultPrices[item.packaging_size];
    } else {
      throw new AppError(400, `${label}: ${priceField} is required`);
    }

    const key = `${item.fruit_id}-${item.packaging_size}-${item[priceField]}`;
    if (merged.has(key)) merged.get(key).quantity += item.quantity;
    else merged.set(key, item);
  });
  return [...merged.values()];
}

module.exports = { cleanItems };
