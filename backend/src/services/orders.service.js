import prisma from '../config/prisma.js';

export async function createOrder(userId, data) {
  const { MaHopDong, items } = data;

  if (!Array.isArray(items) || items.length === 0) {
    throw Object.assign(new Error('Đơn hàng phải có ít nhất một sản phẩm'), { statusCode: 400 });
  }

  return prisma.$transaction(async (tx) => {
    const contract = await tx.hopDong.findUnique({
      where: { MaHopDong: Number(MaHopDong) },
      include: { chiTiet: { include: { hangHoa: true } } }
    });

    if (!contract || contract.TrangThai !== 'HieuLuc' || contract.NgayHetHan < new Date()) {
      throw Object.assign(new Error('Hợp đồng không tồn tại, hết hạn hoặc không còn hiệu lực'), { statusCode: 400 });
    }

    const purchaser = await tx.nhanVienMuaSamCoQuan.findUnique({
      where: { MaTaiKhoan: userId }
    });

    if (!purchaser) {
      throw Object.assign(new Error('Không tìm thấy thông tin cơ quan của nhân viên mua sắm'), { statusCode: 403 });
    }

    if (purchaser.MaCoQuan !== contract.MaCoQuan) {
      throw Object.assign(new Error('Bạn chỉ được đặt hàng theo hợp đồng của cơ quan mình'), { statusCode: 403 });
    }

    const contractItems = new Map(contract.chiTiet.map((item) => [item.MaHangHoa, item]));
    let total = 0;

    const detailRows = items.map((item) => {
      const MaHangHoa = Number(item.MaHangHoa);
      const SoLuongDat = Number(item.SoLuongDat);
      const contractItem = contractItems.get(MaHangHoa);

      if (!contractItem) {
        throw Object.assign(new Error(`Hàng hóa ${MaHangHoa} không thuộc hợp đồng`), { statusCode: 400 });
      }

      if (SoLuongDat <= 0 || SoLuongDat > contractItem.SoLuongToiDa) {
        throw Object.assign(new Error(`Số lượng đặt của hàng hóa ${MaHangHoa} vượt giới hạn hợp đồng`), { statusCode: 400 });
      }

      total += SoLuongDat * Number(contractItem.hangHoa.Gia);
      return { MaHangHoa, SoLuongDat };
    });

    return tx.donDatHang.create({
      data: {
        MaHopDong: contract.MaHopDong,
        MaTaiKhoan_NVMS: userId,
        TongTien: total,
        TrangThai: 'ChoDuyet',
        chiTiet: { create: detailRows }
      },
      include: { chiTiet: { include: { hangHoa: true } }, hopDong: true }
    });
  });
}

export async function listOrders(user) {
  const where = {};

  if (user?.VaiTro === 'NhanVienMuaSamCoQuan') {
    where.MaTaiKhoan_NVMS = user.MaTaiKhoan;
  }

  if (user?.VaiTro === 'NhanVienKho') {
    where.TrangThai = 'ChoDuyet';
  }

  return prisma.donDatHang.findMany({
    where,
    include: {
      hopDong: { include: { coQuan: true } },
      chiTiet: { include: { hangHoa: true } },
      giaoHangs: true,
      hoaDons: true
    },
    orderBy: { NgayDat: 'desc' }
  });
}

export async function getOrder(orderId) {
  const order = await prisma.donDatHang.findUnique({
    where: { MaDonHang: Number(orderId) },
    include: {
      hopDong: { include: { coQuan: true } },
      chiTiet: { include: { hangHoa: true } },
      giaoHangs: true,
      hoaDons: true
    }
  });

  if (!order) {
    throw Object.assign(new Error('Không tìm thấy đơn hàng'), { statusCode: 404 });
  }

  return order;
}
