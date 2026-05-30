import prisma from '../config/prisma.js';

export async function createInvoice(userId, data) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.donDatHang.findUnique({
      where: { MaDonHang: Number(data.MaDonHang) },
      include: {
        chiTiet: { include: { hangHoa: true } },
        giaoHangs: true,
        hoaDons: true
      }
    });

    if (!order) {
      throw Object.assign(new Error('Không tìm thấy đơn hàng'), { statusCode: 404 });
    }

    if (order.giaoHangs.length === 0) {
      throw Object.assign(new Error('Đơn hàng chưa có phiếu giao hàng'), { statusCode: 400 });
    }

    if (order.hoaDons.length > 0) {
      throw Object.assign(new Error('Đơn hàng đã được lập hóa đơn'), { statusCode: 400 });
    }

    const total = order.chiTiet.reduce((sum, item) => {
      return sum + item.SoLuongGiao * Number(item.hangHoa.Gia);
    }, 0);

    if (total <= 0) {
      throw Object.assign(new Error('Không thể lập hóa đơn cho đơn chưa có số lượng giao'), { statusCode: 400 });
    }

    return tx.hoaDonThanhToan.create({
      data: {
        MaDonHang: order.MaDonHang,
        MaTaiKhoan_NVTT: userId,
        TongTien: total,
        NgayLap: data.NgayLap ? new Date(data.NgayLap) : new Date(),
        TrangThai: data.TrangThai || 'ChoThanhToan'
      },
      include: {
        donHang: { include: { chiTiet: { include: { hangHoa: true } } } }
      }
    });
  });
}

export async function listBillableOrders() {
  return prisma.donDatHang.findMany({
    where: {
      giaoHangs: { some: {} },
      hoaDons: { none: {} }
    },
    include: {
      hopDong: { include: { coQuan: true } },
      chiTiet: { include: { hangHoa: true } },
      giaoHangs: true
    },
    orderBy: { NgayDat: 'desc' }
  });
}

export async function listInvoices() {
  return prisma.hoaDonThanhToan.findMany({
    include: {
      donHang: { include: { hopDong: { include: { coQuan: true } }, chiTiet: { include: { hangHoa: true } }, giaoHangs: true } }
    },
    orderBy: { NgayLap: 'desc' }
  });
}
