import express from 'express';
import {
  getAiRecommendations,
  handleAiChat,
  generateComprehensiveReportData
} from '../controllers/aiController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/recommendations', getAiRecommendations);
router.post('/recommendations', getAiRecommendations);
router.post('/chat', handleAiChat);
router.get('/report-data', generateComprehensiveReportData);

export default router;
