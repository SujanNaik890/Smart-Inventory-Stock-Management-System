import { query, get, run } from '../config/db.js';
import bcrypt from 'bcryptjs';

export const getSettings = (req, res, next) => {
  try {
    const rawSettings = query('SELECT * FROM settings');
    const settingsObj = {};
    rawSettings.forEach(s => {
      settingsObj[s.key] = s.value;
    });

    const admin = req.admin;

    res.json({
      success: true,
      settings: settingsObj,
      adminProfile: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        avatar_url: admin.avatar_url
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = (req, res, next) => {
  try {
    const { settings, profile, newPassword } = req.body || {};

    if (newPassword !== undefined && newPassword !== null && newPassword !== '' &&
        (typeof newPassword !== 'string' || newPassword.length < 12)) {
      return res.status(400).json({ success: false, message: 'New password must be at least 12 characters long.' });
    }

    if (settings && typeof settings === 'object') {
      for (const [key, value] of Object.entries(settings)) {
        run('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)', [
          key,
          String(value)
        ]);
      }
    }

    if (profile && typeof profile === 'object' && req.admin) {
      const { name, avatar_url } = profile;
      run(`
        UPDATE admins
        SET name = COALESCE(?, name),
            avatar_url = COALESCE(?, avatar_url)
        WHERE id = ?
      `, [name || null, avatar_url !== undefined ? avatar_url : null, req.admin.id]);
    }

    if (newPassword && req.admin) {
      const salt = bcrypt.genSaltSync(12);
      const hash = bcrypt.hashSync(newPassword, salt);
      run('UPDATE admins SET password_hash = ? WHERE id = ?', [hash, req.admin.id]);
    }

    const updatedAdmin = get('SELECT id, name, email, role, avatar_url FROM admins WHERE id = ?', [req.admin.id]);

    res.json({
      success: true,
      message: 'Settings updated successfully',
      adminProfile: updatedAdmin
    });
  } catch (error) {
    next(error);
  }
};
