import prisma from '../config/prisma.js';
import { createNotifications } from './notifications.service.js';
import { emitOrderEvent } from '../realtime/orderEvents.js';

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

  return prisma.$transaction(async (tx) => {
    const delivery = await tx.giaoHang.create({
      data: {
        MaDonHang: order.MaDonHang,
        MaTaiKhoan_NVKho: userId,
        NgayGiao: data.NgayGiao ? new Date(data.NgayGiao) : new Date(),
        DonViVanChuyen: data.DonViVanChuyen || null,
        TrangThai: 'DangGiao'
      },
      include: {
        donHang: { include: { hopDong: { include: { coQuan: true } }, chiTiet: { include: { hangHoa: true } } } },
        nhanVienKho: true
      }
    });

    await tx.donDatHang.update({
      where: { MaDonHang: order.MaDonHang },
      data: { TrangThai: 'DangGiao' }
    });

    await createNotifications([{
      MaTaiKhoan: order.MaTaiKhoan_NVMS,
      NoiDung: `Đơn hàng #${order.MaDonHang} đang được giao${data.DonViVanChuyen ? ` bởi ${data.DonViVanChuyen}` : ''}.`,
      Loai: 'DangGiao',
      MaDonHang: order.MaDonHang
    }], tx);

    return delivery;
  }).then((delivery) => {
    emitOrderEvent({ type: 'delivery-created', orderId: delivery.MaDonHang, status: 'DangGiao' });
    return delivery;
  });
}

export async function confirmDelivered(deliveryId) {
  let orderId = null;

  return prisma.$transaction(async (tx) => {
    const delivery = await tx.giaoHang.findUnique({
      where: { MaGiaoHang: Number(deliveryId) },
      include: {
        donHang: { include: { chiTiet: { include: { hangHoa: true } }, hoaDons: true } }
      }
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

    orderId = delivery.MaDonHang;

    // Tự động lập hóa đơn nếu chưa có
    if (delivery.donHang.hoaDons.length === 0) {
      const total = delivery.donHang.chiTiet.reduce((sum, item) => {
        return sum + item.SoLuongGiao * Number(item.hangHoa.Gia);
      }, 0);

      if (total > 0) {
        const invoice = await tx.hoaDonThanhToan.create({
          data: { MaDonHang: delivery.MaDonHang, TongTien: total }
        });

        // Thông báo cho TaiKhoanCoQuan và toàn bộ quản lý
        const managers = await tx.taiKhoan.findMany({
          where: { VaiTro: 'QuanLy', TrangThai: 'HoatDong' },
          select: { MaTaiKhoan: true }
        });

        const soTien = total.toLocaleString('vi-VN');
        const recipients = [
          {
            MaTaiKhoan: delivery.donHang.MaTaiKhoan_NVMS,
            NoiDung: `Đơn hàng #${delivery.MaDonHang} đã giao thành công. Hóa đơn #${invoice.MaHoaDon} trị giá ${soTien} đ đã được lập, vui lòng tiến hành thanh toán.`,
            Loai: 'HoaDon', MaDonHang: delivery.MaDonHang, MaHoaDon: invoice.MaHoaDon
          },
          ...managers.map((m) => ({
            MaTaiKhoan: m.MaTaiKhoan,
            NoiDung: `Đơn hàng #${delivery.MaDonHang} đã giao xong. Hóa đơn #${invoice.MaHoaDon} (${soTien} đ) đã được lập tự động.`,
            Loai: 'HoaDon', MaDonHang: delivery.MaDonHang, MaHoaDon: invoice.MaHoaDon
          }))
        ];

        await createNotifications(recipients, tx);
      }
    }

    return updatedDelivery;
  }).then((updatedDelivery) => {
    if (orderId !== null) {
      emitOrderEvent({ type: 'delivery-confirmed', orderId, status: 'DaGiao' });
    }

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
