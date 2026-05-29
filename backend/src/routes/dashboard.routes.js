import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { verifyRole } from '../middleware/verifyRole.js';

const router = Router();

router.get('/stats', authenticateToken, verifyRole('QuanLy', 'Admin'), getDashboardStats);

export default router;
