import jwt from 'jsonwebtoken';
import { get } from '../config/db.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No authentication token provided.' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'stocksmart_super_secret_jwt_key_2026';
    const decoded = jwt.verify(token, secret);

    const admin = get('SELECT id, name, email, role, avatar_url FROM admins WHERE id = ?', [decoded.id]);
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid token: administrator account not found.' });
    }

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
  }
};
