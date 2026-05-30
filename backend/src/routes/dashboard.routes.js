import { Router } from 'express';
import { getDashboardStats, getRevenueReport, getInventoryReport } from '../controllers/dashboard.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { verifyRole } from '../middleware/verifyRole.js';

const router = Router();

router.get('/stats', authenticateToken, verifyRole('QuanLy', 'Admin'), getDashboardStats);
router.get('/revenue-report', authenticateToken, verifyRole('QuanLy', 'Admin'), getRevenueReport);
router.get('/inventory-report', authenticateToken, verifyRole('QuanLy', 'Admin'), getInventoryReport);

export default router;
