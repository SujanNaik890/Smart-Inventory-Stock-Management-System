import express from 'express';
import {
  getStats,
  getStockOverview,
  getCategoryDistribution,
  getRecentTransactions,
  getLowStockAlerts
} from '../controllers/dashboardController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/stats', getStats);
router.get('/stock-overview', getStockOverview);
router.get('/category-distribution', getCategoryDistribution);
router.get('/recent-transactions', getRecentTransactions);
router.get('/low-stock', getLowStockAlerts);

export default router;
