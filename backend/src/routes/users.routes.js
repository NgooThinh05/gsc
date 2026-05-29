import { Router } from 'express';
import { createGovernmentAgency, createUser, deleteUser, listGovernmentAgencies, listUsers } from '../controllers/users.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { verifyRole } from '../middleware/verifyRole.js';

const router = Router();

router.get('/', authenticateToken, verifyRole('Admin'), listUsers);
router.post('/', authenticateToken, verifyRole('Admin'), createUser);
router.delete('/:id', authenticateToken, verifyRole('Admin'), deleteUser);
router.get('/government-agencies', authenticateToken, verifyRole('Admin', 'NhanVienHopDong', 'NhanVienMuaSamCoQuan', 'QuanLy'), listGovernmentAgencies);
router.post('/government-agencies', authenticateToken, verifyRole('Admin'), createGovernmentAgency);

export default router;
