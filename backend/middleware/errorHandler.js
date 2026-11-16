// Central error handling. Every controller passes its errors to next(error)
// and they end up here, so the API always answers with clear JSON.
const AppError = require('../utils/AppError');

// 404 for routes that do not exist
function notFound(req, res, next) {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(error, req, res, next) {
  // Our own validation / business errors
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    });
  }

  // Bad JSON in the request body
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Request body is not valid JSON' });
  }

  // MySQL errors
  switch (error.code) {
    case 'ER_DUP_ENTRY':
      return res.status(409).json({
        success: false,
        message: 'A record with the same unique value (for example phone number or name) already exists',
      });
    case 'ER_ROW_IS_REFERENCED_2':
      return res.status(409).json({
        success: false,
        message: 'This record is used by other records and can not be deleted',
      });
    case 'ER_NO_REFERENCED_ROW_2':
      return res.status(400).json({ success: false, message: 'A related record does not exist' });
    case 'ER_CHECK_CONSTRAINT_VIOLATED':
    case 'ER_CONSTRAINT_FAILED':
    case 'ER_DATA_TOO_LONG':
    case 'ER_TRUNCATED_WRONG_VALUE':
    case 'ER_WARN_DATA_OUT_OF_RANGE':
    case 'ER_BAD_NULL_ERROR':
      return res.status(400).json({ success: false, message: 'The data breaks a database rule', detail: error.sqlMessage });
    case 'ECONNREFUSED':
    case 'ETIMEDOUT':
    case 'ENOTFOUND':
    case 'PROTOCOL_CONNECTION_LOST':
    case 'ER_ACCESS_DENIED_ERROR':
    case 'ER_BAD_DB_ERROR':
    case 'ER_CON_COUNT_ERROR':
      console.error('Database unavailable:', error.code);
      return res.status(503).json({
        success: false,
        message: 'The database is not available. Check that MySQL is running and the .env settings are correct.',
      });
    default:
      break;
  }

  console.error('Unexpected error:', error);
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

module.exports = { notFound, errorHandler };
