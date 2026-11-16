// An error that carries an HTTP status code, so controllers can say
// "this is a 404" or "this is a 400" and the error middleware does the rest.
class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

module.exports = AppError;
