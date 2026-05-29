import { Router } from 'express';
import { approveOrder } from '../controllers/warehouse.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { verifyRole } from '../middleware/verifyRole.js';

const router = Router();

router.post('/orders/:id/approve', authenticateToken, verifyRole('NhanVienKho'), approveOrder);

export default router;
