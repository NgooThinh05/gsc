import prisma from '../config/prisma.js';

export async function createContract(userId, data) {
  const { NgayKy, NgayHetHan, MaCoQuan, chiTiet } = data;

  if (!MaCoQuan || !NgayKy || !NgayHetHan) {
    throw Object.assign(new Error('Cơ quan, ngày ký và ngày hết hạn là bắt buộc'), { statusCode: 400 });
  }

  if (new Date(NgayHetHan) <= new Date(NgayKy)) {
    throw Object.assign(new Error('Ngày hết hạn phải sau ngày ký'), { statusCode: 400 });
  }

  if (!Array.isArray(chiTiet) || chiTiet.length === 0) {
    throw Object.assign(new Error('Hợp đồng phải có ít nhất một dòng chi tiết'), { statusCode: 400 });
  }

  const productIds = chiTiet.map((item) => Number(item.MaHangHoa));
  if (new Set(productIds).size !== productIds.length) {
    throw Object.assign(new Error('Không được chọn trùng hàng hóa trong cùng hợp đồng'), { statusCode: 400 });
  }

  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"HopDong"', 'MaHopDong'), COALESCE((SELECT MAX("MaHopDong") FROM "HopDong"), 1), true)`;

  return prisma.hopDong.create({
    data: {
      NgayKy: new Date(NgayKy),
      NgayHetHan: new Date(NgayHetHan),
      MaCoQuan: Number(MaCoQuan),
      MaTaiKhoan_NVHD: userId,
      TrangThai: data.TrangThai || 'HieuLuc',
      chiTiet: {
        create: chiTiet.map((item) => ({
          MaHangHoa: Number(item.MaHangHoa),
          SoLuongToiDa: Number(item.SoLuongToiDa),
          SoTienToiDa: item.SoTienToiDa
        }))
      }
    },
    include: {
      coQuan: true,
      chiTiet: { include: { hangHoa: true } }
    }
  });
}

export async function syncExpiredContracts() {
  await prisma.hopDong.updateMany({
    where: {
      TrangThai: 'HieuLuc',
      NgayHetHan: { lt: new Date() }
    },
    data: { TrangThai: 'HetHan' }
  });
}

export async function listActiveContracts(user) {
  await syncExpiredContracts();

  const where = {};

  if (user?.VaiTro === 'NhanVienMuaSamCoQuan') {
    const purchaser = await prisma.nhanVienMuaSamCoQuan.findUnique({
      where: { MaTaiKhoan: user.MaTaiKhoan }
    });

    if (!purchaser) {
      throw Object.assign(new Error('Không tìm thấy thông tin cơ quan của nhân viên mua sắm'), { statusCode: 403 });
    }

    where.MaCoQuan = purchaser.MaCoQuan;
    where.TrangThai = 'HieuLuc';
    where.NgayHetHan = { gte: new Date() };
  }

  return prisma.hopDong.findMany({
    where,
    include: {
      coQuan: true,
      chiTiet: { include: { hangHoa: true } }
    },
    orderBy: { NgayHetHan: 'asc' }
  });
}

export async function extendContract(contractId, data) {
  const { NgayHetHan } = data;

  if (!NgayHetHan) {
    throw Object.assign(new Error('Ngày hết hạn mới là bắt buộc'), { statusCode: 400 });
  }

  const contract = await prisma.hopDong.findUnique({
    where: { MaHopDong: Number(contractId) }
  });

  if (!contract) {
    throw Object.assign(new Error('Không tìm thấy hợp đồng'), { statusCode: 404 });
  }

  if (new Date(NgayHetHan) <= contract.NgayKy) {
    throw Object.assign(new Error('Ngày hết hạn mới phải sau ngày ký'), { statusCode: 400 });
  }

  return prisma.hopDong.update({
    where: { MaHopDong: Number(contractId) },
    data: {
      NgayHetHan: new Date(NgayHetHan),
      TrangThai: 'HieuLuc'
    },
    include: {
      coQuan: true,
      chiTiet: { include: { hangHoa: true } }
    }
  });
}
