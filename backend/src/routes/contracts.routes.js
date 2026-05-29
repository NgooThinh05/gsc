import { Router } from 'express';
import { createContract, extendContract, listActiveContracts } from '../controllers/contracts.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { verifyRole } from '../middleware/verifyRole.js';

const router = Router();

router.get('/', authenticateToken, verifyRole('NhanVienHopDong', 'NhanVienMuaSamCoQuan', 'QuanLy'), listActiveContracts);
router.post('/', authenticateToken, verifyRole('NhanVienHopDong'), createContract);
router.patch('/:id/extend', authenticateToken, verifyRole('NhanVienHopDong'), extendContract);

export default router;
