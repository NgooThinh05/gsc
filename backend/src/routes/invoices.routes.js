import { Router } from 'express';
import { createInvoice, listBillableOrders, listInvoices, payInvoice, requestCashPayment } from '../controllers/invoices.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { verifyRole } from '../middleware/verifyRole.js';

const router = Router();

router.get('/', authenticateToken, verifyRole('NhanVienKho', 'NhanVienHopDong', 'TaiKhoanCoQuan', 'QuanLy'), listInvoices);
router.get('/billable-orders', authenticateToken, verifyRole('NhanVienKho', 'NhanVienHopDong'), listBillableOrders);
router.post('/', authenticateToken, verifyRole('NhanVienKho'), createInvoice);
// TaiKhoanCoQuan khai báo thanh toán tiền mặt — chờ NV HĐ xác nhận.
router.patch('/:invoiceId/request-cash', authenticateToken, verifyRole('TaiKhoanCoQuan'), requestCashPayment);
// TaiKhoanCoQuan quét QR (tự xác nhận) hoặc NV HĐ xác nhận đã nhận tiền mặt.
router.post('/:invoiceId/pay', authenticateToken, verifyRole('TaiKhoanCoQuan', 'NhanVienHopDong'), payInvoice);

export default router;
