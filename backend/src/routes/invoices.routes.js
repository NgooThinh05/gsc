import { Router } from 'express';
import { createInvoice, listBillableOrders, listInvoices, payInvoice } from '../controllers/invoices.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { verifyRole } from '../middleware/verifyRole.js';
import {confirmInvoice } from '../controllers/invoices.controller.js';
const router = Router();

router.get('/', authenticateToken, verifyRole('NhanVienThanhToan', 'QuanLy'), listInvoices);
router.get('/billable-orders', authenticateToken, verifyRole('NhanVienThanhToan', 'QuanLy'), listBillableOrders);
router.post('/', authenticateToken, verifyRole('NhanVienThanhToan'), createInvoice);

// Mô phỏng quét QR thành công -> đánh dấu hóa đơn đã thanh toán + gửi thông báo.
router.post('/:invoiceId/pay', authenticateToken, verifyRole('TaiKhoanCoQuan', 'NhanVienThanhToan'), payInvoice);

router.post('/confirm/:invoiceId', authenticateToken, verifyRole('NhanVienThanhToan'), confirmInvoice);

export default router;
