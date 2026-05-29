import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';

const includeProfiles = {
  nhanVienHopDong: true,
  nhanVienMuaSamCoQuan: { include: { coQuan: true } },
  nhanVienThanhToan: true,
  nhanVienKho: true
};

function sanitizeUser(user) {
  const { MatKhau, ...safeUser } = user;
  return safeUser;
}

export async function listUsers() {
  const users = await prisma.taiKhoan.findMany({
    include: includeProfiles,
    orderBy: { MaTaiKhoan: 'asc' }
  });

  return users.map(sanitizeUser);
}

export async function createUser(data) {
  const { TenNguoiDung, SDT, Email, MatKhau, VaiTro, profile = {} } = data;

  if (!TenNguoiDung || !Email || !MatKhau || !VaiTro) {
    throw Object.assign(new Error('Tên người dùng, email, mật khẩu và vai trò là bắt buộc'), { statusCode: 400 });
  }

  const hashedPassword = await bcrypt.hash(MatKhau, 10);

  const user = await prisma.$transaction(async (tx) => {
    const account = await tx.taiKhoan.create({
      data: {
        TenNguoiDung,
        SDT,
        Email,
        MatKhau: hashedPassword,
        VaiTro,
        TrangThai: data.TrangThai || 'HoatDong'
      }
    });

    if (VaiTro === 'NhanVienHopDong') {
      await tx.nhanVienHopDong.create({
        data: {
          MaTaiKhoan: account.MaTaiKhoan,
          ChucVu: profile.ChucVu || 'Nhân viên hợp đồng',
          ChungChi: profile.ChungChi || null,
          HanMucDuyet: profile.HanMucDuyet || null
        }
      });
    }

    if (VaiTro === 'NhanVienMuaSamCoQuan') {
      if (!profile.MaCoQuan) {
        throw Object.assign(new Error('Nhân viên mua sắm cần MaCoQuan'), { statusCode: 400 });
      }

      await tx.nhanVienMuaSamCoQuan.create({
        data: {
          MaTaiKhoan: account.MaTaiKhoan,
          MaCoQuan: Number(profile.MaCoQuan),
          BoPhanCongTac: profile.BoPhanCongTac || 'Phòng mua sắm'
        }
      });
    }

    if (VaiTro === 'NhanVienThanhToan') {
      await tx.nhanVienThanhToan.create({
        data: {
          MaTaiKhoan: account.MaTaiKhoan,
          MaSoKeToan: profile.MaSoKeToan || `KT-${account.MaTaiKhoan}`,
          HanMucChiTra: profile.HanMucChiTra || null
        }
      });
    }

    if (VaiTro === 'NhanVienKho') {
      await tx.nhanVienKho.create({
        data: {
          MaTaiKhoan: account.MaTaiKhoan,
          KhuVucQuanLy: profile.KhuVucQuanLy || 'Kho chính',
          CaLam: profile.CaLam || 'Ca hành chính'
        }
      });
    }

    return tx.taiKhoan.findUnique({
      where: { MaTaiKhoan: account.MaTaiKhoan },
      include: includeProfiles
    });
  });

  return sanitizeUser(user);
}

export async function deleteUser(userId, currentUserId) {
  const MaTaiKhoan = Number(userId);

  if (MaTaiKhoan === Number(currentUserId)) {
    throw Object.assign(new Error('Admin không thể tự xóa tài khoản đang đăng nhập'), { statusCode: 400 });
  }

  const user = await prisma.taiKhoan.findUnique({
    where: { MaTaiKhoan }
  });

  if (!user) {
    throw Object.assign(new Error('Không tìm thấy tài khoản'), { statusCode: 404 });
  }

  try {
    await prisma.taiKhoan.delete({
      where: { MaTaiKhoan }
    });
  } catch (error) {
    if (error.code === 'P2003') {
      throw Object.assign(new Error('Không thể xóa tài khoản đã phát sinh hợp đồng, đơn hàng, giao hàng hoặc hóa đơn'), { statusCode: 409 });
    }

    throw error;
  }

  return { message: 'Xóa tài khoản thành công' };
}

export async function listGovernmentAgencies() {
  return prisma.coQuanChinhPhu.findMany({
    orderBy: { MaCoQuan: 'asc' }
  });
}

export async function createGovernmentAgency(data) {
  const { Ten, DiaChi } = data;

  if (!Ten || !DiaChi) {
    throw Object.assign(new Error('Tên cơ quan và địa chỉ là bắt buộc'), { statusCode: 400 });
  }

  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"CoQuanChinhPhu"', 'MaCoQuan'), COALESCE((SELECT MAX("MaCoQuan") FROM "CoQuanChinhPhu"), 1), true)`;

  return prisma.coQuanChinhPhu.create({
    data: { Ten, DiaChi }
  });
}
