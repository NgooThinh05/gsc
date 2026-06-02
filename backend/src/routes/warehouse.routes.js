import { Router } from 'express';
import { approveOrder, receiveStock } from '../controllers/warehouse.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { verifyRole } from '../middleware/verifyRole.js';

const router = Router();

router.post('/orders/:id/approve', authenticateToken, verifyRole('NhanVienKho'), approveOrder);
router.post('/receive', authenticateToken, verifyRole('NhanVienKho'), receiveStock);

export default router;
