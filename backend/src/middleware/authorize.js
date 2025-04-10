/**
 * Authorization middleware to restrict access based on user roles.
 *
 * @param {string[]} allowedRoles - Array of allowed user roles.
 * @returns {Function} Express middleware function.
 */
function authorize(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

module.exports = authorize;
