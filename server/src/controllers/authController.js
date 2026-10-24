import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { get } from '../config/db.js';

export const login = (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const admin = get('SELECT * FROM admins WHERE email = ?', [email.trim().toLowerCase()]);
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = bcrypt.compareSync(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    const userProfile = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatar_url: admin.avatar_url
    };

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userProfile
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = (req, res, next) => {
  try {
    return res.json({
      success: true,
      user: req.admin
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res) => {
  return res.json({
    success: true,
    message: 'Logged out successfully'
  });
};
