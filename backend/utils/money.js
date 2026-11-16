// Money helpers. We work in whole cents internally to avoid rounding errors
// such as 0.1 + 0.2 = 0.30000000000000004.
function toCents(amount) {
  return Math.round(Number(amount) * 100);
}

function fromCents(cents) {
  return cents / 100;
}

module.exports = { toCents, fromCents };
