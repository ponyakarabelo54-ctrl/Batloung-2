// All communication with the Express backend lives in this file.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Sends a request and returns the parsed JSON. Throws an Error whose
// message is shown to the user in a notification.
async function request(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    throw new Error('Cannot reach the server. Check that the backend is running (npm start in the backend folder).');
  }

  let json = null;
  try {
    json = await response.json();
  } catch (parseError) {
    // the response had no JSON body
  }

  if (!response.ok) {
    const error = new Error((json && json.message) || `Request failed (${response.status})`);
    error.status = response.status;
    error.details = json && json.details;
    throw error;
  }
  return json;
}

const query = (params) => {
  const clean = Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null);
  return clean.length ? `?${new URLSearchParams(clean).toString()}` : '';
};

export const api = {
  // Suppliers
  getSuppliers: (search = '') => request(`/suppliers${query({ search })}`),
  createSupplier: (data) => request('/suppliers', { method: 'POST', body: data }),
  updateSupplier: (id, data) => request(`/suppliers/${id}`, { method: 'PUT', body: data }),
  deleteSupplier: (id) => request(`/suppliers/${id}`, { method: 'DELETE' }),

  // Fruits
  getFruits: () => request('/fruits'),
  createFruit: (data) => request('/fruits', { method: 'POST', body: data }),
  updateFruit: (id, data) => request(`/fruits/${id}`, { method: 'PUT', body: data }),
  changeFruitStatus: (id, status) => request(`/fruits/${id}/status`, { method: 'PATCH', body: { status } }),

  // Vendors
  getVendors: (search = '') => request(`/vendors${query({ search })}`),
  createVendor: (data) => request('/vendors', { method: 'POST', body: data }),
  updateVendor: (id, data) => request(`/vendors/${id}`, { method: 'PUT', body: data }),

  // Purchases
  getPurchases: () => request('/purchases'),
  getPurchase: (id) => request(`/purchases/${id}`),
  createPurchase: (data) => request('/purchases', { method: 'POST', body: data }),

  // Sales
  getSales: () => request('/sales'),
  getSale: (id) => request(`/sales/${id}`),
  getDefaultPrices: () => request('/sales/prices'),
  createSale: (data) => request('/sales', { method: 'POST', body: data }),
  addPayment: (id, amount) => request(`/sales/${id}/payments`, { method: 'POST', body: { amount } }),

  // Stock
  getStock: (filters = {}) => request(`/stock${query(filters)}`),
  getLowStock: (threshold) => request(`/stock/low${query({ threshold })}`),

  // Reports
  getDashboard: () => request('/reports/dashboard'),
  getTopFruits: () => request('/reports/top-fruits'),
  getRevenue: (from, to) => request(`/reports/revenue${query({ from, to })}`),
  getTopVendor: () => request('/reports/top-vendor'),
  getStockReport: () => request('/reports/stock'),
  getOutstandingBalances: () => request('/reports/outstanding-balances'),
};
