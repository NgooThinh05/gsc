import { Router } from 'express';
import { createGovernmentAgency, createUser, deleteUser, listGovernmentAgencies, listUsers, updateUser } from '../controllers/users.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { verifyRole } from '../middleware/verifyRole.js';

const router = Router();

router.get('/', authenticateToken, verifyRole('Admin'), listUsers);
router.post('/', authenticateToken, verifyRole('Admin'), createUser);
router.patch('/:id', authenticateToken, verifyRole('Admin'), updateUser);
router.delete('/:id', authenticateToken, verifyRole('Admin'), deleteUser);
router.get('/government-agencies', authenticateToken, verifyRole('Admin', 'NhanVienHopDong', 'TaiKhoanCoQuan', 'QuanLy'), listGovernmentAgencies);
router.post('/government-agencies', authenticateToken, verifyRole('Admin'), createGovernmentAgency);

export default router;
