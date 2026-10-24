import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getSettings);
router.put('/', updateSettings);

export default router;
