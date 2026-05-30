import prisma from '../config/prisma.js';

export async function listDeliveryReadyOrders() {
  return prisma.donDatHang.findMany({
    where: { TrangThai: { in: ['SanSangGiao', 'GiaoMotPhan'] } },
    include: {
      hopDong: { include: { coQuan: true } },
      chiTiet: { include: { hangHoa: true } },
      giaoHangs: true
    },
    orderBy: { NgayDat: 'desc' }
  });
}

export async function createDelivery(userId, data) {
  const order = await prisma.donDatHang.findUnique({
    where: { MaDonHang: Number(data.MaDonHang) }
  });

  if (!order) {
    throw Object.assign(new Error('Không tìm thấy đơn hàng'), { statusCode: 404 });
  }

  if (!['SanSangGiao', 'GiaoMotPhan'].includes(order.TrangThai)) {
    throw Object.assign(new Error('Đơn hàng chưa sẵn sàng giao'), { statusCode: 400 });
  }

  const existingDelivery = await prisma.giaoHang.findFirst({
    where: { MaDonHang: order.MaDonHang }
  });

  if (existingDelivery) {
    throw Object.assign(new Error('Đơn hàng đã có phiếu giao hàng'), { statusCode: 400 });
  }

  return prisma.giaoHang.create({
    data: {
      MaDonHang: order.MaDonHang,
      MaTaiKhoan_NVKho: userId,
      NgayGiao: data.NgayGiao ? new Date(data.NgayGiao) : new Date(),
      DonViVanChuyen: data.DonViVanChuyen || null,
      TrangThai: data.TrangThai || 'DangGiao'
    },
    include: {
      donHang: { include: { hopDong: { include: { coQuan: true } }, chiTiet: { include: { hangHoa: true } } } },
      nhanVienKho: true
    }
  });
}

export async function confirmDelivered(deliveryId) {
  return prisma.$transaction(async (tx) => {
    const delivery = await tx.giaoHang.findUnique({
      where: { MaGiaoHang: Number(deliveryId) },
      include: { donHang: true }
    });

    if (!delivery) {
      throw Object.assign(new Error('Không tìm thấy phiếu giao hàng'), { statusCode: 404 });
    }

    const updatedDelivery = await tx.giaoHang.update({
      where: { MaGiaoHang: Number(deliveryId) },
      data: { TrangThai: 'DaGiao' },
      include: {
        donHang: { include: { hopDong: { include: { coQuan: true } }, chiTiet: { include: { hangHoa: true } } } },
        nhanVienKho: true
      }
    });

    await tx.donDatHang.update({
      where: { MaDonHang: delivery.MaDonHang },
      data: { TrangThai: 'DaGiao' }
    });

    return updatedDelivery;
  });
}

export async function listDeliveries() {
  return prisma.giaoHang.findMany({
    include: {
      donHang: { include: { hopDong: { include: { coQuan: true } }, chiTiet: { include: { hangHoa: true } } } },
      nhanVienKho: true
    },
    orderBy: { NgayGiao: 'desc' }
  });
}
