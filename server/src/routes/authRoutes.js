import express from 'express';
import rateLimit from 'express-rate-limit';
import { login, getMe, logout } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again later.' }
});

router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.get('/me', authenticateToken, getMe);

export default router;
