import { Router } from 'express';
import { confirmDelivered, createDelivery, listDeliveries, listDeliveryReadyOrders } from '../controllers/delivery.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { verifyRole } from '../middleware/verifyRole.js';

const router = Router();

router.get('/', authenticateToken, verifyRole('NhanVienKho', 'QuanLy'), listDeliveries);
router.get('/ready-orders', authenticateToken, verifyRole('NhanVienKho', 'QuanLy'), listDeliveryReadyOrders);
router.post('/', authenticateToken, verifyRole('NhanVienKho'), createDelivery);
router.patch('/:id/confirm-delivered', authenticateToken, verifyRole('NhanVienKho'), confirmDelivered);

export default router;
