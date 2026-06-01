import { Router } from 'express';
import { createContract, extendContract, listActiveContracts, adjustContract, signContract } from '../controllers/contracts.controller.js';
import { downloadContractPdf } from '../controllers/contracts-pdf.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { verifyRole } from '../middleware/verifyRole.js';

const router = Router();

router.get('/', authenticateToken, verifyRole('NhanVienHopDong', 'TaiKhoanCoQuan', 'QuanLy'), listActiveContracts);
router.post('/', authenticateToken, verifyRole('NhanVienHopDong'), createContract);
router.patch('/:id/extend', authenticateToken, verifyRole('NhanVienHopDong'), extendContract);
// Contract staff can adjust contract: extend date and/or update/add item limits
router.patch('/:id/adjust', authenticateToken, verifyRole('NhanVienHopDong'), adjustContract);
// Nhân viên cơ quan chính phủ xác nhận ký hợp đồng
router.post('/:id/sign', authenticateToken, verifyRole('TaiKhoanCoQuan'), signContract);
// Download contract as PDF (available to all authenticated users)
router.get('/:id/pdf', authenticateToken, downloadContractPdf);

export default router;
