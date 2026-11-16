// Business logic for sale totals and payments.
const AppError = require('./AppError');
const { toCents, fromCents } = require('./money');

// Total of a sale = sum of (quantity x unit price) for every item.
// The administrator never types the total - it is always calculated here.
function calculateSaleTotal(items) {
  const totalCents = items.reduce((sum, item) => sum + item.quantity * toCents(item.unit_price), 0);
  return fromCents(totalCents);
}

// Works out amount paid and the payment status (PAID / PARTIALLY_PAID / UNPAID).
//   CASH, MOBILE_MONEY : paid now (full amount unless a smaller amount is given)
//   CREDIT             : nothing paid now (unless a deposit is given)
function determinePayment(paymentMethod, totalAmount, amountPaidInput) {
  const totalCents = toCents(totalAmount);
  const given = amountPaidInput !== undefined && amountPaidInput !== null && amountPaidInput !== '';
  let paidCents;

  if (given) {
    const number = Number(amountPaidInput);
    if (!Number.isFinite(number) || number < 0) {
      throw new AppError(400, 'amount_paid must be a number that is 0 or more');
    }
    paidCents = toCents(number);
  } else {
    paidCents = paymentMethod === 'CREDIT' ? 0 : totalCents;
  }

  if (paidCents > totalCents) {
    throw new AppError(400, `amount_paid (${fromCents(paidCents)}) can not be more than the total (${fromCents(totalCents)})`);
  }
  if (paymentMethod !== 'CREDIT' && paidCents === 0) {
    throw new AppError(400, `A ${paymentMethod} sale must have a payment greater than 0. Use CREDIT if the vendor pays later`);
  }

  return { amount_paid: fromCents(paidCents), payment_status: statusFor(paidCents, totalCents) };
}

function statusFor(paidCents, totalCents) {
  if (paidCents >= totalCents) return 'PAID';
  if (paidCents === 0) return 'UNPAID';
  return 'PARTIALLY_PAID';
}

// Used when a vendor pays off part of a balance later.
function applyLaterPayment(sale, paymentAmount) {
  const totalCents = toCents(sale.total_amount);
  const newPaidCents = toCents(sale.amount_paid) + toCents(paymentAmount);
  if (newPaidCents > totalCents) {
    throw new AppError(400, `Payment is more than the outstanding balance of ${fromCents(totalCents - toCents(sale.amount_paid))}`);
  }
  return { amount_paid: fromCents(newPaidCents), payment_status: statusFor(newPaidCents, totalCents) };
}

module.exports = { calculateSaleTotal, determinePayment, applyLaterPayment };
