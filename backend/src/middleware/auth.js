const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware: Verifies JWT token on protected endpoints.
 * Returns 401 if missing, invalid, or expired.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'support_ticket_secret_key_2026');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Role Authorization Middleware: Enforces user role (e.g., 'agent').
 * Returns 403 Forbidden if user does not possess required role.
 */
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
