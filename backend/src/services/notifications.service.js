import prisma from '../config/prisma.js';

// Tạo nhiều thông báo cùng lúc (bỏ qua các MaTaiKhoan trùng / rỗng).
export async function createNotifications(items, tx = prisma) {
  const seen = new Set();
  const data = [];

  for (const item of items) {
    if (!item?.MaTaiKhoan || seen.has(item.MaTaiKhoan)) continue;
    seen.add(item.MaTaiKhoan);
    data.push({
      MaTaiKhoan: item.MaTaiKhoan,
      NoiDung: item.NoiDung,
      Loai: item.Loai || null,
      MaDonHang: item.MaDonHang ?? null,
      MaHoaDon: item.MaHoaDon ?? null
    });
  }

  if (data.length === 0) return { count: 0 };
  return tx.thongBao.createMany({ data });
}

export async function listNotifications(userId) {
  return prisma.thongBao.findMany({
    where: { MaTaiKhoan: userId },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
}

export async function markAsRead(userId, notificationId) {
  return prisma.thongBao.updateMany({
    where: { MaThongBao: Number(notificationId), MaTaiKhoan: userId },
    data: { DaDoc: true }
  });
}

export async function markAllAsRead(userId) {
  return prisma.thongBao.updateMany({
    where: { MaTaiKhoan: userId, DaDoc: false },
    data: { DaDoc: true }
  });
}

export async function deleteNotification(userId, notificationId) {
  return prisma.thongBao.deleteMany({
    where: { MaThongBao: Number(notificationId), MaTaiKhoan: userId }
  });
}

export async function deleteAllRead(userId) {
  return prisma.thongBao.deleteMany({
    where: { MaTaiKhoan: userId, DaDoc: true }
  });
}
