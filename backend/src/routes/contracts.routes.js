import { Router } from 'express';
import { createContract, extendContract, listActiveContracts } from '../controllers/contracts.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { verifyRole } from '../middleware/verifyRole.js';

const router = Router();

router.get('/', authenticateToken, verifyRole('NhanVienHopDong', 'TaiKhoanCoQuan', 'QuanLy'), listActiveContracts);
router.post('/', authenticateToken, verifyRole('NhanVienHopDong', 'TaiKhoanCoQuan'), createContract);
router.patch('/:id/extend', authenticateToken, verifyRole('NhanVienHopDong'), extendContract);

export default router;
