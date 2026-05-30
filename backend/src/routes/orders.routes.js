import { Router } from 'express';
import { createOrder, getOrder, listOrders, rejectOrder } from '../controllers/orders.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { verifyRole } from '../middleware/verifyRole.js';


const router = Router();

router.get('/', authenticateToken, verifyRole('NhanVienHopDong', 'TaiKhoanCoQuan', 'NhanVienKho', 'QuanLy'), listOrders);
router.get('/:id', authenticateToken, verifyRole('NhanVienHopDong', 'TaiKhoanCoQuan', 'NhanVienKho', 'NhanVienThanhToan', 'QuanLy'), getOrder);
router.post('/', authenticateToken, verifyRole('TaiKhoanCoQuan'), createOrder);
router.post('/:orderId/reject', authenticateToken, verifyRole('NhanVienHopDong'), rejectOrder);

export default router;
