import { Router } from 'express';
import { listNotifications, markAsRead, markAllAsRead } from '../controllers/notifications.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Thông báo cá nhân của tài khoản đang đăng nhập (mọi vai trò).
router.get('/', authenticateToken, listNotifications);
router.post('/read-all', authenticateToken, markAllAsRead);
router.post('/:id/read', authenticateToken, markAsRead);

export default router;
