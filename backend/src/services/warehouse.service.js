import prisma from '../config/prisma.js';

export async function approveOrderForWarehouse(orderId, items = []) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.donDatHang.findUnique({
      where: { MaDonHang: Number(orderId) },
      include: { chiTiet: { include: { hangHoa: true } } }
    });

    if (!order) {
      throw Object.assign(new Error('Không tìm thấy đơn hàng'), { statusCode: 404 });
    }

    if (order.TrangThai !== 'ChoDuyet') {
      throw Object.assign(new Error('Chỉ xử lý kho cho đơn hàng đang chờ duyệt'), { statusCode: 400 });
    }

    const deliveryMap = new Map(items.map((item) => [Number(item.MaHangHoa), Number(item.SoLuongGiao)]));
    let isPartial = false;

    for (const detail of order.chiTiet) {
      const available = detail.hangHoa.SoLuongTrongKho;
      const requestedDelivery = deliveryMap.has(detail.MaHangHoa)
        ? deliveryMap.get(detail.MaHangHoa)
        : Math.min(detail.SoLuongDat, available);

      if (!Number.isInteger(requestedDelivery) || requestedDelivery < 0) {
        throw Object.assign(new Error(`Số lượng giao của ${detail.hangHoa.Ten} không hợp lệ`), { statusCode: 400 });
      }

      if (requestedDelivery > detail.SoLuongDat) {
        throw Object.assign(new Error(`Số lượng giao của ${detail.hangHoa.Ten} vượt số lượng đặt`), { statusCode: 400 });
      }

      if (requestedDelivery > available) {
        throw Object.assign(new Error(`Số lượng giao của ${detail.hangHoa.Ten} vượt tồn kho hiện tại`), { statusCode: 400 });
      }

      if (requestedDelivery < detail.SoLuongDat) {
        isPartial = true;
      }

      await tx.chiTietDonHang.update({
        where: {
          MaDonHang_MaHangHoa: {
            MaDonHang: detail.MaDonHang,
            MaHangHoa: detail.MaHangHoa
          }
        },
        data: { SoLuongGiao: requestedDelivery }
      });

      await tx.hangHoa.update({
        where: { MaHangHoa: detail.MaHangHoa },
        data: { SoLuongTrongKho: available - requestedDelivery }
      });
    }

    return tx.donDatHang.update({
      where: { MaDonHang: Number(orderId) },
      data: { TrangThai: isPartial ? 'GiaoMotPhan' : 'SanSangGiao' },
      include: {
        hopDong: { include: { coQuan: true } },
        chiTiet: { include: { hangHoa: true } },
        giaoHangs: true,
        hoaDons: true
      }
    });
  });
}
