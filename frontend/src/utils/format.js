// Display helpers. Money is shown in Maloti (M), the currency of Lesotho.
export const SIZES = ['SMALL', 'MEDIUM', 'LARGE'];
export const PAYMENT_METHODS = ['CASH', 'MOBILE_MONEY', 'CREDIT'];
export const PROVINCES = [
  'Gauteng', 'Free State', 'KwaZulu-Natal', 'Western Cape',
  'Eastern Cape', 'Limpopo', 'Mpumalanga', 'North West',
];

export function money(value) {
  const number = Number(value) || 0;
  return `M\u00A0${number.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function number(value) {
  return (Number(value) || 0).toLocaleString('en-ZA');
}

export function dateTime(value) {
  return value ? String(value).slice(0, 16).replace('T', ' ') : '';
}

export function dateOnly(value) {
  return value ? String(value).slice(0, 10) : '';
}

export function label(value) {
  return String(value || '').replace(/_/g, ' ');
}

export function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}
