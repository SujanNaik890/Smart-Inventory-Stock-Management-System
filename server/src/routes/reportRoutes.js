import express from 'express';
import {
  getInventorySummaryReport,
  getLowStockReport,
  getStockMovementReport,
  getCategoryReport
} from '../controllers/reportController.js';
import { getTransactions } from '../controllers/stockController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/inventory', getInventorySummaryReport);
router.get('/low-stock', getLowStockReport);
router.get('/stock-movement', getStockMovementReport);
router.get('/categories', getCategoryReport);
router.get('/transactions', getTransactions);

export default router;
