import express from 'express';
import { stockIn, stockOut, getTransactions } from '../controllers/stockController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/in', stockIn);
router.post('/out', stockOut);
router.get('/transactions', getTransactions);

export default router;
