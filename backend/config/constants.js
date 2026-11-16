// Fixed values shared by the whole backend.

const PACKAGING_SIZES = ['SMALL', 'MEDIUM', 'LARGE'];
const PAYMENT_METHODS = ['CASH', 'MOBILE_MONEY', 'CREDIT'];
const PAYMENT_STATUSES = ['PAID', 'PARTIALLY_PAID', 'UNPAID'];
const FRUIT_STATUSES = ['AVAILABLE', 'UNAVAILABLE'];

const PROVINCES = [
  'Gauteng',
  'Free State',
  'KwaZulu-Natal',
  'Western Cape',
  'Eastern Cape',
  'Limpopo',
  'Mpumalanga',
  'North West',
];

// Default selling price (Maloti) per box. Each packaging size has a different
// price. The administrator may override the price for an individual sale line.
const DEFAULT_SELLING_PRICES = {
  SMALL: 120,
  MEDIUM: 170,
  LARGE: 220,
};

// A stock row with this many boxes (or fewer) is "low stock".
const LOW_STOCK_THRESHOLD = 20;

module.exports = {
  PACKAGING_SIZES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  FRUIT_STATUSES,
  PROVINCES,
  DEFAULT_SELLING_PRICES,
  LOW_STOCK_THRESHOLD,
};
