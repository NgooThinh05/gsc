import { Router } from 'express';
import { createProduct, listProducts } from '../controllers/products.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { verifyRole } from '../middleware/verifyRole.js';

const router = Router();

router.get('/', authenticateToken, verifyRole('NhanVienHopDong', 'TaiKhoanCoQuan', 'NhanVienKho', 'QuanLy', 'Admin'), listProducts);
router.post('/', authenticateToken, verifyRole('NhanVienKho', 'Admin'), createProduct);

export default router;
