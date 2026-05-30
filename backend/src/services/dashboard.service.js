import prisma from '../config/prisma.js';

const LOW_STOCK_THRESHOLD = 10;

export async function getDashboardStats() {
  const [orders, lowStockItems, invoices] = await Promise.all([
    prisma.donDatHang.count(),
    prisma.hangHoa.count({ where: { SoLuongTrongKho: { lte: LOW_STOCK_THRESHOLD } } }),
    prisma.hoaDonThanhToan.findMany({ select: { TongTien: true } })
  ]);

  const revenue = invoices.reduce((sum, invoice) => sum + Number(invoice.TongTien), 0);

  return { orders, lowStockItems, revenue };
}

/**
 * 6.1 Tạo báo cáo tổng hợp + 6.4 Truy vấn báo cáo doanh thu.
 * Cho phép truy vấn theo khoảng thời gian (from/to theo NgayLap hóa đơn).
 */
export async function getRevenueReport({ from, to } = {}) {
  const where = {};
  if (from || to) {
    where.NgayLap = {};
    if (from) where.NgayLap.gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      where.NgayLap.lte = end;
    }
  }

  const invoices = await prisma.hoaDonThanhToan.findMany({
    where,
    include: {
      donHang: { include: { hopDong: { include: { coQuan: true } } } }
    },
    orderBy: { NgayLap: 'desc' }
  });

  let totalRevenue = 0;
  let paidRevenue = 0;
  let pendingRevenue = 0;
  const byAgency = new Map();
  const byMonth = new Map();

  for (const invoice of invoices) {
    const amount = Number(invoice.TongTien);
    totalRevenue += amount;
    if (invoice.TrangThai === 'DaThanhToan') paidRevenue += amount;
    if (invoice.TrangThai === 'ChoThanhToan') pendingRevenue += amount;

    const agencyName = invoice.donHang?.hopDong?.coQuan?.Ten || 'Khác';
    byAgency.set(agencyName, (byAgency.get(agencyName) || 0) + amount);

    const monthKey = new Date(invoice.NgayLap).toISOString().slice(0, 7); // YYYY-MM
    byMonth.set(monthKey, (byMonth.get(monthKey) || 0) + amount);
  }

  const rows = invoices.map((invoice) => ({
    MaHoaDon: invoice.MaHoaDon,
    MaDonHang: invoice.MaDonHang,
    NgayLap: invoice.NgayLap,
    TongTien: Number(invoice.TongTien),
    TrangThai: invoice.TrangThai,
    coQuan: invoice.donHang?.hopDong?.coQuan?.Ten || '-'
  }));

  return {
    summary: {
      invoiceCount: invoices.length,
      totalRevenue,
      paidRevenue,
      pendingRevenue
    },
    byAgency: [...byAgency.entries()].map(([Ten, TongTien]) => ({ Ten, TongTien })).sort((a, b) => b.TongTien - a.TongTien),
    byMonth: [...byMonth.entries()].map(([Thang, TongTien]) => ({ Thang, TongTien })).sort((a, b) => a.Thang.localeCompare(b.Thang)),
    rows
  };
}

/**
 * 6.1 Tạo báo cáo tổng hợp tồn kho (báo cáo kho cho Quản lý).
 */
export async function getInventoryReport() {
  const products = await prisma.hangHoa.findMany({ orderBy: { SoLuongTrongKho: 'asc' } });

  let totalStockValue = 0;
  let outOfStock = 0;
  let lowStock = 0;

  const rows = products.map((product) => {
    const stockValue = product.SoLuongTrongKho * Number(product.Gia);
    totalStockValue += stockValue;
    if (product.SoLuongTrongKho === 0) outOfStock += 1;
    else if (product.SoLuongTrongKho <= LOW_STOCK_THRESHOLD) lowStock += 1;

    return {
      MaHangHoa: product.MaHangHoa,
      Ten: product.Ten,
      SoLuongTrongKho: product.SoLuongTrongKho,
      Gia: Number(product.Gia),
      ViTriKho: product.ViTriKho,
      TrangThai: product.TrangThai,
      GiaTriTon: stockValue
    };
  });

  return {
    summary: {
      productCount: products.length,
      totalStockValue,
      lowStock,
      outOfStock,
      lowStockThreshold: LOW_STOCK_THRESHOLD
    },
    rows
  };
}
