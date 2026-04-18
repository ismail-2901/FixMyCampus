// middleware/auth.js
const jwt = require('jsonwebtoken');
const db  = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer '))
      return res.status(401).json({ error: 'No token provided' });

    const token   = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await db.query(
      'SELECT user_id, name, email, role, is_banned, is_verified FROM Users WHERE user_id = ?',
      [decoded.userId]
    );
    if (!rows.length)   return res.status(401).json({ error: 'User not found' });
    if (rows[0].is_banned)    return res.status(403).json({ error: 'Account banned' });
    if (!rows[0].is_verified) return res.status(403).json({ error: 'Email not verified' });

    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: 'Insufficient permissions' });
  next();
};

module.exports = { authenticate, requireRole };
