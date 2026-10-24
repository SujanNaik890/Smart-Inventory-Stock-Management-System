import jwt from 'jsonwebtoken';
import { get } from '../config/db.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = typeof authHeader === 'string' && /^Bearer ([^\s]+)$/i.exec(authHeader)?.[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No authentication token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (!decoded || typeof decoded !== 'object' || !Number.isSafeInteger(decoded.id)) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
    }

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
