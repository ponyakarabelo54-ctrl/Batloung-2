import { label } from '../utils/format.js';

const tones = {
  PAID: 'green', AVAILABLE: 'green',
  PARTIALLY_PAID: 'amber',
  UNPAID: 'red', UNAVAILABLE: 'red',
  CASH: 'blue', MOBILE_MONEY: 'purple', CREDIT: 'amber',
  SMALL: 'gray', MEDIUM: 'gray', LARGE: 'gray',
};

export default function StatusBadge({ value }) {
  return <span className={`badge badge-${tones[value] || 'gray'}`}>{label(value)}</span>;
}
