// Small input-validation helpers. Each one throws an AppError(400) when the
// value is not acceptable, otherwise it returns the cleaned value.
const AppError = require('./AppError');

function cleanText(value, fieldName, { required = true, maxLength = 255 } = {}) {
  if (value === undefined || value === null || String(value).trim() === '') {
    if (required) throw new AppError(400, `${fieldName} is required`);
    return null;
  }
  const text = String(value).trim();
  if (text.length > maxLength) {
    throw new AppError(400, `${fieldName} must be at most ${maxLength} characters`);
  }
  return text;
}

function cleanPhone(value, fieldName) {
  const phone = cleanText(value, fieldName, { maxLength: 20 });
  // digits, spaces, + and - only; at least 7 digits
  if (!/^[+0-9][0-9 \-]*$/.test(phone) || phone.replace(/\D/g, '').length < 7) {
    throw new AppError(400, `${fieldName} is not a valid phone number`);
  }
  return phone;
}

function cleanEnum(value, allowedValues, fieldName) {
  const text = String(value === undefined || value === null ? '' : value).trim();
  const match = allowedValues.find((item) => item.toLowerCase() === text.toLowerCase());
  if (!match) {
    throw new AppError(400, `${fieldName} must be one of: ${allowedValues.join(', ')}`);
  }
  return match;
}

function cleanId(value, fieldName) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new AppError(400, `${fieldName} must be a positive whole number`);
  }
  return number;
}

function cleanPositiveInteger(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    throw new AppError(400, `${fieldName} is required`);
  }
  return cleanId(value, fieldName);
}

function cleanPositiveMoney(value, fieldName) {
  const number = Number(value);
  if (value === undefined || value === null || value === '' || !Number.isFinite(number) || number <= 0) {
    throw new AppError(400, `${fieldName} must be a number greater than 0`);
  }
  return Math.round(number * 100) / 100;
}

function cleanDateOnly(value, fieldName) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) {
    throw new AppError(400, `${fieldName} must be in YYYY-MM-DD format`);
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new AppError(400, `${fieldName} is not a real date`);
  }
  return value;
}

module.exports = {
  cleanText,
  cleanPhone,
  cleanEnum,
  cleanId,
  cleanPositiveInteger,
  cleanPositiveMoney,
  cleanDateOnly,
};
