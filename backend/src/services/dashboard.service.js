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
 * Cho phép truy vấn theo khoảng thời gian (from/to theo NgayLap hóa đơn) và theo cơ quan.
 */
export async function getRevenueReport({ from, to, agencyId } = {}) {
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
  if (agencyId) {
    where.donHang = {
      ...(where.donHang || {}),
      hopDong: { MaCoQuan: parseInt(agencyId, 10) }
    };
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
  let cancelledInvoiceCount = 0;
  let cancelledRevenue = 0;
  let overdueInvoiceCount = 0;
  let overdueRevenue = 0;
  let paidOnTimeCount = 0;
  let paidOnTimeRevenue = 0;

  const byAgency = new Map();
  const byMonth = new Map();
  const byContract = new Map();

  for (const invoice of invoices) {
    const amount = Number(invoice.TongTien);
    totalRevenue += amount;

    if (invoice.TrangThai === 'DaThanhToan') {
      paidRevenue += amount;
      paidOnTimeCount++;
      paidOnTimeRevenue += amount;
    }
    if (invoice.TrangThai === 'ChoThanhToan') pendingRevenue += amount;
    if (invoice.TrangThai === 'Huy') {
      cancelledInvoiceCount++;
      cancelledRevenue += amount;
    }
    if (invoice.TrangThai === 'QuaHan') {
      overdueInvoiceCount++;
      overdueRevenue += amount;
    }

    // Group by agency
    const agencyName = invoice.donHang?.hopDong?.coQuan?.Ten || 'Khác';
    if (!byAgency.has(agencyName)) {
      byAgency.set(agencyName, { Ten: agencyName, TongTien: 0, SoLuongHoaDon: 0, SoLuongDaThanhToan: 0 });
    }
    const agencyEntry = byAgency.get(agencyName);
    agencyEntry.TongTien += amount;
    agencyEntry.SoLuongHoaDon++;
    if (invoice.TrangThai === 'DaThanhToan') agencyEntry.SoLuongDaThanhToan++;

    // Group by month
    const monthKey = new Date(invoice.NgayLap).toISOString().slice(0, 7); // YYYY-MM
    byMonth.set(monthKey, (byMonth.get(monthKey) || 0) + amount);

    // Group by contract
    const contractId = invoice.donHang?.hopDong?.MaHopDong;
    const contractKey = contractId ? `HD-${contractId}` : 'Khác';
    if (!byContract.has(contractKey)) {
      byContract.set(contractKey, {
        MaHopDong: contractId || null,
        TenHopDong: contractId ? `Hợp đồng #${contractId}` : 'Không có hợp đồng',
        TongTien: 0,
        SoLuongHoaDon: 0
      });
    }
    const contractEntry = byContract.get(contractKey);
    contractEntry.TongTien += amount;
    contractEntry.SoLuongHoaDon++;
  }

  const rows = invoices.map((invoice) => ({
    MaHoaDon: invoice.MaHoaDon,
    MaDonHang: invoice.MaDonHang,
    NgayLap: invoice.NgayLap,
    TongTien: Number(invoice.TongTien),
    TrangThai: invoice.TrangThai,
    coQuan: invoice.donHang?.hopDong?.coQuan?.Ten || '-'
  }));

  const adjustedTotal = totalRevenue - cancelledRevenue;
  const onTimePaymentRate = adjustedTotal > 0
    ? Math.round((paidOnTimeRevenue / adjustedTotal) * 100)
    : 0;

  return {
    summary: {
      invoiceCount: invoices.length,
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      cancelledInvoiceCount,
      cancelledRevenue,
      overdueInvoiceCount,
      overdueRevenue,
      paidOnTimeCount,
      onTimePaymentRate
    },
    byAgency: [...byAgency.values()].sort((a, b) => b.TongTien - a.TongTien),
    byMonth: [...byMonth.entries()].map(([Thang, TongTien]) => ({ Thang, TongTien })).sort((a, b) => a.Thang.localeCompare(b.Thang)),
    byContract: [...byContract.values()].sort((a, b) => b.TongTien - a.TongTien),
    topAgencies: [...byAgency.values()]
      .sort((a, b) => b.TongTien - a.TongTien)
      .slice(0, 5)
      .map(({ Ten, TongTien }) => ({ Ten, TongTien })),
    rows
  };
}

/**
 * Lấy danh sách cơ quan cho dropdown filter.
 */
export async function getAgencies() {
  return prisma.coQuanChinhPhu.findMany({
    orderBy: { Ten: 'asc' }
  });
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
