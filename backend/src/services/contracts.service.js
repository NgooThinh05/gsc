import prisma from '../config/prisma.js';
import { createNotifications } from './notifications.service.js';

export async function createContract(user, data) {
  const { NgayKy, NgayHetHan, chiTiet, TenNguoiKy, ChucVuNguoiKy, DieuKhoan, MaCoQuan: contractAgency } = data;
  let MaCoQuan = contractAgency;

  // Tài khoản cơ quan: hợp đồng luôn gắn với đúng cơ quan của chính họ (1 tài khoản = 1 cơ quan)
  if (user.VaiTro === 'TaiKhoanCoQuan') {
    const account = await prisma.taiKhoanCoQuan.findUnique({
      where: { MaTaiKhoan: user.MaTaiKhoan }
    });
    if (!account) {
      throw Object.assign(new Error('Không tìm thấy thông tin cơ quan của tài khoản'), { statusCode: 403 });
    }
    MaCoQuan = account.MaCoQuan;
  }

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

  const contract = await prisma.hopDong.create({
    data: {
      NgayKy: new Date(NgayKy),
      NgayHetHan: new Date(NgayHetHan),
      MaCoQuan,
      MaTaiKhoan_NVHD: user.MaTaiKhoan,
      TrangThai: 'ChoKy',
      TenNguoiKy: TenNguoiKy || null,
      ChucVuNguoiKy: ChucVuNguoiKy || null,
      DieuKhoan: DieuKhoan || null,
      chiTiet: {
        create: chiTiet.map((item) => ({
          MaHangHoa: Number(item.MaHangHoa),
          SoTienToiDa: item.SoTienToiDa
        }))
      }
    },
    include: {
      coQuan: true,
      chiTiet: { include: { hangHoa: true } }
    }
  });

  // Thông báo cho nhân viên cơ quan chính phủ
  const agencyAccount = await prisma.taiKhoanCoQuan.findUnique({
    where: { MaCoQuan }
  });
  if (agencyAccount) {
    await createNotifications([{
      MaTaiKhoan: agencyAccount.MaTaiKhoan,
      NoiDung: `Hợp đồng #${contract.MaHopDong} từ ${contract.coQuan?.Ten || 'đơn vị cung cấp'} đang chờ bạn xác nhận ký.`,
      Loai: 'ChoKy'
    }]);
  }

  return contract;
}

export async function signContract(contractId, user) {
  const contract = await prisma.hopDong.findUnique({
    where: { MaHopDong: Number(contractId) },
    include: { coQuan: true }
  });

  if (!contract) {
    throw Object.assign(new Error('Không tìm thấy hợp đồng'), { statusCode: 404 });
  }

  if (contract.TrangThai !== 'ChoKy') {
    throw Object.assign(new Error('Hợp đồng không ở trạng thái chờ ký'), { statusCode: 400 });
  }

  // Xác minh nhân viên cơ quan thuộc đúng cơ quan của hợp đồng
  const purchaser = await prisma.taiKhoanCoQuan.findUnique({
    where: { MaTaiKhoan: user.MaTaiKhoan }
  });
  if (!purchaser || purchaser.MaCoQuan !== contract.MaCoQuan) {
    throw Object.assign(new Error('Bạn không có quyền ký hợp đồng này'), { statusCode: 403 });
  }

  const signed = await prisma.hopDong.update({
    where: { MaHopDong: Number(contractId) },
    data: { TrangThai: 'HieuLuc' },
    include: { coQuan: true, chiTiet: { include: { hangHoa: true } } }
  });

  // Thông báo cho nhân viên hợp đồng
  await createNotifications([{
    MaTaiKhoan: contract.MaTaiKhoan_NVHD,
    NoiDung: `Hợp đồng #${contract.MaHopDong} với ${contract.coQuan?.Ten || 'cơ quan'} đã được ký xác nhận và có hiệu lực.`,
    Loai: 'DaKy'
  }]);

  return signed;
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

  if (user?.VaiTro === 'TaiKhoanCoQuan') {
    const purchaser = await prisma.taiKhoanCoQuan.findUnique({
      where: { MaTaiKhoan: user.MaTaiKhoan }
    });

    if (!purchaser) {
      throw Object.assign(new Error('Không tìm thấy thông tin cơ quan của nhân viên mua sắm'), { statusCode: 403 });
    }

    where.MaCoQuan = purchaser.MaCoQuan;
    where.OR = [
      { TrangThai: 'ChoKy' },
      { TrangThai: 'HieuLuc', NgayHetHan: { gte: new Date() } }
    ];
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

export async function updateContractTerms(contractId, data) {
  const { NgayHetHan, DieuKhoan, chiTiet } = data;

  const contract = await prisma.hopDong.findUnique({ where: { MaHopDong: Number(contractId) } });
  if (!contract) throw Object.assign(new Error('Không tìm thấy hợp đồng'), { statusCode: 404 });

  return prisma.$transaction(async (tx) => {
    let updated = null;

    if (NgayHetHan) {
      if (new Date(NgayHetHan) <= contract.NgayKy) {
        throw Object.assign(new Error('Ngày hết hạn mới phải sau ngày ký'), { statusCode: 400 });
      }
      updated = await tx.hopDong.update({ where: { MaHopDong: Number(contractId) }, data: { NgayHetHan: new Date(NgayHetHan), TrangThai: 'HieuLuc' } });
    }

    if (DieuKhoan !== undefined) {
      updated = await tx.hopDong.update({
        where: { MaHopDong: Number(contractId) },
        data: { DieuKhoan: DieuKhoan || null }
      });
    }

    if (Array.isArray(chiTiet) && chiTiet.length > 0) {
      const newMaHangHoas = [];
      for (const item of chiTiet) {
        const { MaHangHoa: rawMaHangHoa, SoTienToiDa } = item;
        const MaHangHoa = Number(rawMaHangHoa);
        if (!MaHangHoa || !SoTienToiDa) continue;
        newMaHangHoas.push(MaHangHoa);
        await tx.chiTietHopDong.upsert({
          where: { MaHopDong_MaHangHoa: { MaHopDong: Number(contractId), MaHangHoa } },
          update: { SoTienToiDa },
          create: { MaHopDong: Number(contractId), MaHangHoa, SoTienToiDa }
        });
      }
      // delete items not in the new list (handles deletion from UI)
      await tx.chiTietHopDong.deleteMany({
        where: {
          MaHopDong: Number(contractId),
          MaHangHoa: { notIn: newMaHangHoas }
        }
      });
    }

    // return fresh contract with details
    return tx.hopDong.findUnique({ where: { MaHopDong: Number(contractId) }, include: { coQuan: true, chiTiet: { include: { hangHoa: true } } } });
  });
}

