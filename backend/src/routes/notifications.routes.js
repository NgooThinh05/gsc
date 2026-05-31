import { Router } from 'express';
import { listNotifications, markAsRead, markAllAsRead, deleteNotification, deleteAllRead } from '../controllers/notifications.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Thông báo cá nhân của tài khoản đang đăng nhập (mọi vai trò).
router.get('/', authenticateToken, listNotifications);
router.post('/read-all', authenticateToken, markAllAsRead);
router.delete('/read', authenticateToken, deleteAllRead);
router.post('/:id/read', authenticateToken, markAsRead);
router.delete('/:id', authenticateToken, deleteNotification);

export default router;
