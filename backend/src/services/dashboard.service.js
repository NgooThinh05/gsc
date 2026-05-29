import prisma from '../config/prisma.js';

export async function getDashboardStats() {
  const [orders, lowStockItems, invoices] = await Promise.all([
    prisma.donDatHang.count(),
    prisma.hangHoa.count({ where: { SoLuongTrongKho: { lte: 10 } } }),
    prisma.hoaDonThanhToan.findMany({ select: { TongTien: true } })
  ]);

  const revenue = invoices.reduce((sum, invoice) => sum + Number(invoice.TongTien), 0);

  return { orders, lowStockItems, revenue };
}
