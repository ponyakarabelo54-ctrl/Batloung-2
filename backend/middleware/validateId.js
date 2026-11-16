// Makes sure the :id in the URL is a positive whole number (otherwise 400).
const { cleanId } = require('../utils/validators');

function validateIdParam(paramName = 'id') {
  return (req, res, next) => {
    try {
      req.params[paramName] = cleanId(req.params[paramName], paramName);
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = validateIdParam;
