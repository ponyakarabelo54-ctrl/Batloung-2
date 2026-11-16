// Simple end-to-end test of the API. Start the backend first (npm start), then:
//     npm run test:api
// NOTE: it creates a few test records. Re-import database/batloung_farm.sql to reset.
const BASE = process.env.API_URL || 'http://localhost:5000/api';
let passed = 0;
let failed = 0;

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

function check(name, condition, extra = '') {
  if (condition) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.log(`  FAIL  ${name} ${extra}`); }
}

async function stockOf(fruitId, size) {
  const r = await call('GET', `/stock?fruit_id=${fruitId}&packaging_size=${size}`);
  return r.body.data[0].available_quantity;
}

async function main() {
  console.log('\n== Basic reads ==');
  check('health 200', (await call('GET', '/health')).status === 200);
  const suppliers = await call('GET', '/suppliers');
  check('GET /suppliers 200 with data', suppliers.status === 200 && suppliers.body.data.length > 0);
  check('GET /suppliers/999999 -> 404', (await call('GET', '/suppliers/999999')).status === 404);
  check('GET /suppliers/abc -> 400', (await call('GET', '/suppliers/abc')).status === 400);
  check('GET /fruits has 5+ fruits', (await call('GET', '/fruits')).body.data.length >= 5);
  const search = await call('GET', '/vendors?search=Mamello');
  check('vendor search by name', search.body.data.length === 1);
  check('vendor search by phone', (await call('GET', '/vendors?search=5801 0002')).body.data.length === 1);

  console.log('\n== Validation ==');
  check('supplier with missing fields -> 400', (await call('POST', '/suppliers', { business_name: 'X' })).status === 400);
  check('supplier with bad province -> 400', (await call('POST', '/suppliers', { business_name: 'X', contact_person: 'Y', phone: '+27 11 000 0000', province: 'Narnia', address: 'Z' })).status === 400);
  check('duplicate vendor phone -> 409', (await call('POST', '/vendors', { vendor_name: 'Dup', phone_number: '+266 5801 0001', location: 'Maseru' })).status === 409);

  console.log('\n== Supplier CRUD ==');
  const stamp = String(Date.now()).slice(-8);
  const created = await call('POST', '/suppliers', { business_name: 'Test Supplier', contact_person: 'Tester', phone: `+27 99 ${stamp}`, province: 'Gauteng', address: '1 Test Road' });
  check('create supplier -> 201', created.status === 201);
  const sid = created.body.data.supplier_id;
  check('update supplier -> 200', (await call('PUT', `/suppliers/${sid}`, { ...created.body.data, contact_person: 'Changed' })).status === 200);
  check('delete supplier (no purchases) -> 200', (await call('DELETE', `/suppliers/${sid}`)).status === 200);
  check('delete supplier with purchases -> 409', (await call('DELETE', '/suppliers/1')).status === 409);

  console.log('\n== Purchases increase stock ==');
  const before = await stockOf(2, 'MEDIUM');
  const purchase = await call('POST', '/purchases', { supplier_id: 1, items: [
    { fruit_id: 2, packaging_size: 'MEDIUM', quantity: 10, unit_cost: 100 },
    { fruit_id: 1, packaging_size: 'LARGE', quantity: 5, unit_cost: 155.5 },
  ] });
  check('purchase -> 201', purchase.status === 201);
  check('purchase total auto-calculated (10*100 + 5*155.5 = 1777.5)', purchase.body.data && purchase.body.data.total_amount === 1777.5);
  check('stock increased by 10', (await stockOf(2, 'MEDIUM')) === before + 10);

  console.log('\n== Sales: totals, stock and rollback ==');
  const appleLarge = await stockOf(1, 'LARGE');
  const bananaSmall = await stockOf(2, 'SMALL');
  const salesBefore = (await call('GET', '/sales')).body.data.length;

  const tooMany = await call('POST', '/sales', { vendor_id: 1, payment_method: 'CASH', items: [{ fruit_id: 1, packaging_size: 'LARGE', quantity: appleLarge + 4 }] });
  check('sale with too little stock -> 400', tooMany.status === 400 && tooMany.body.details.code === 'INSUFFICIENT_STOCK');

  const mixed = await call('POST', '/sales', { vendor_id: 1, payment_method: 'CASH', items: [
    { fruit_id: 2, packaging_size: 'SMALL', quantity: 5 },                 // fine
    { fruit_id: 1, packaging_size: 'LARGE', quantity: appleLarge + 4 },    // fails
  ] });
  check('multi-item sale with one failing item -> 400', mixed.status === 400);
  check('good item stock NOT reduced (rolled back)', (await stockOf(2, 'SMALL')) === bananaSmall);
  check('failing item stock unchanged', (await stockOf(1, 'LARGE')) === appleLarge);
  check('no incomplete sale was saved', (await call('GET', '/sales')).body.data.length === salesBefore);

  const good = await call('POST', '/sales', { vendor_id: 1, payment_method: 'CASH', items: [
    { fruit_id: 2, packaging_size: 'SMALL', quantity: 5 },   // 5 * 120 = 600
    { fruit_id: 1, packaging_size: 'LARGE', quantity: 2 },   // 2 * 220 = 440
  ] });
  check('good sale -> 201', good.status === 201);
  check('sale total auto-calculated (1040) and PAID', good.body.data.total_amount === 1040 && good.body.data.payment_status === 'PAID');
  check('stock reduced for both items', (await stockOf(2, 'SMALL')) === bananaSmall - 5 && (await stockOf(1, 'LARGE')) === appleLarge - 2);
  check('unavailable vendor -> 404', (await call('POST', '/sales', { vendor_id: 99999, payment_method: 'CASH', items: [{ fruit_id: 1, packaging_size: 'SMALL', quantity: 1 }] })).status === 404);
  check('negative quantity -> 400', (await call('POST', '/sales', { vendor_id: 1, payment_method: 'CASH', items: [{ fruit_id: 1, packaging_size: 'SMALL', quantity: -3 }] })).status === 400);

  console.log('\n== Payments ==');
  const credit = await call('POST', '/sales', { vendor_id: 3, payment_method: 'CREDIT', items: [{ fruit_id: 3, packaging_size: 'SMALL', quantity: 5 }] });
  check('credit sale is UNPAID', credit.body.data.payment_status === 'UNPAID' && credit.body.data.balance === 600);
  const saleId = credit.body.data.sale_id;
  const part = await call('POST', `/sales/${saleId}/payments`, { amount: 200 });
  check('part payment -> PARTIALLY_PAID, balance 400', part.body.data.payment_status === 'PARTIALLY_PAID' && part.body.data.balance === 400);
  check('over-payment -> 400', (await call('POST', `/sales/${saleId}/payments`, { amount: 5000 })).status === 400);
  const full = await call('POST', `/sales/${saleId}/payments`, { amount: 400 });
  check('final payment -> PAID, balance 0', full.body.data.payment_status === 'PAID' && full.body.data.balance === 0);
  const mm = await call('POST', '/sales', { vendor_id: 2, payment_method: 'MOBILE_MONEY', amount_paid: 100, items: [{ fruit_id: 3, packaging_size: 'SMALL', quantity: 2 }] });
  check('mobile money part payment -> PARTIALLY_PAID', mm.body.data.payment_status === 'PARTIALLY_PAID');

  console.log('\n== Stock and reports ==');
  const low = await call('GET', '/stock/low');
  check('low stock list returns items', low.status === 200 && low.body.data.every((s) => s.available_quantity <= low.body.threshold));
  check('stock for one fruit has 3 sizes', (await call('GET', '/stock/fruit/1')).body.data.length === 3);
  check('top 5 fruits', (await call('GET', '/reports/top-fruits')).body.data.length === 5);
  const rev = await call('GET', '/reports/revenue?from=2026-09-01&to=2026-10-31');
  check('revenue report for Sep-Oct 2026', rev.status === 200 && rev.body.data.total_revenue > 0);
  check('revenue with bad dates -> 400', (await call('GET', '/reports/revenue?from=2026-10-31&to=2026-09-01')).status === 400);
  check('top vendor', (await call('GET', '/reports/top-vendor')).body.data.top_vendor !== null);
  check('stock report has 15+ rows', (await call('GET', '/reports/stock')).body.data.length >= 15);
  check('outstanding balances', (await call('GET', '/reports/outstanding-balances')).status === 200);
  check('dashboard', (await call('GET', '/reports/dashboard')).status === 200);
  check('unknown route -> 404', (await call('GET', '/nothing')).status === 404);

  console.log(`\nResult: ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => { console.error('Test run crashed:', error.message); process.exit(1); });
