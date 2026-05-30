import * as notificationsService from '../services/notifications.service.js';

export async function listNotifications(req, res, next) {
  try {
    const notifications = await notificationsService.listNotifications(req.user.MaTaiKhoan);
    return res.json(notifications);
  } catch (error) {
    return next(error);
  }
}

export async function markAsRead(req, res, next) {
  try {
    await notificationsService.markAsRead(req.user.MaTaiKhoan, req.params.id);
    return res.json({ message: 'Đã đánh dấu đã đọc' });
  } catch (error) {
    return next(error);
  }
}

export async function markAllAsRead(req, res, next) {
  try {
    await notificationsService.markAllAsRead(req.user.MaTaiKhoan);
    return res.json({ message: 'Đã đánh dấu tất cả đã đọc' });
  } catch (error) {
    return next(error);
  }
}
