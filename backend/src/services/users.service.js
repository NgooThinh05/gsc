import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';

const includeProfiles = {
  nhanVienHopDong: true,
  taiKhoanCoQuan: { include: { coQuan: true } },
  nhanVienKho: true,
  quanLy: true
};

function sanitizeUser(user) {
  const { MatKhau, ...safeUser } = user;
  return safeUser;
}

// Tạo hồ sơ vai trò (sub-table) tương ứng. Admin/QuanLy không có hồ sơ phụ.
async function createProfileForRole(tx, MaTaiKhoan, VaiTro, profile = {}) {
  if (VaiTro === 'NhanVienHopDong') {
    await tx.nhanVienHopDong.create({
      data: { MaTaiKhoan }
    });
  } else if (VaiTro === 'TaiKhoanCoQuan') {
    if (!profile.MaCoQuan) {
      throw Object.assign(new Error('Nhân viên mua sắm cần MaCoQuan'), { statusCode: 400 });
    }
    await tx.taiKhoanCoQuan.create({
      data: {
        MaTaiKhoan,
        MaCoQuan: Number(profile.MaCoQuan)
      }
    });
  } else if (VaiTro === 'NhanVienKho') {
    await tx.nhanVienKho.create({
      data: { MaTaiKhoan }
    });
  } else if (VaiTro === 'QuanLy') {
    await tx.quanLy.create({
      data: { MaTaiKhoan }
    });
  }
  // NhanVienThanhToan không có bảng riêng
}

// Xóa hồ sơ vai trò cũ (dùng deleteMany để an toàn khi không tồn tại).
async function deleteProfileForRole(tx, MaTaiKhoan, VaiTro) {
  if (VaiTro === 'NhanVienHopDong') await tx.nhanVienHopDong.deleteMany({ where: { MaTaiKhoan } });
  else if (VaiTro === 'TaiKhoanCoQuan') await tx.taiKhoanCoQuan.deleteMany({ where: { MaTaiKhoan } });
  else if (VaiTro === 'NhanVienKho') await tx.nhanVienKho.deleteMany({ where: { MaTaiKhoan } });
  else if (VaiTro === 'QuanLy') await tx.quanLy.deleteMany({ where: { MaTaiKhoan } });
}

// Cập nhật các trường hồ sơ của vai trò hiện tại (chỉ những trường được gửi lên).
async function updateProfileForRole(tx, MaTaiKhoan, VaiTro, profile = {}) {
  if (VaiTro === 'TaiKhoanCoQuan') {
    await tx.taiKhoanCoQuan.update({
      where: { MaTaiKhoan },
      data: {
        ...(profile.MaCoQuan !== undefined && profile.MaCoQuan !== '' ? { MaCoQuan: Number(profile.MaCoQuan) } : {})
      }
    });
  }
  // Các vai trò khác không có field nào để cập nhật
}

// 7.5 - Tra cứu người dùng (có thể lọc theo từ khóa tên/email/SĐT)
export async function listUsers(search) {
  const keyword = (search || '').trim();
  const where = keyword
    ? {
        OR: [
          { TenNguoiDung: { contains: keyword, mode: 'insensitive' } },
          { Email: { contains: keyword, mode: 'insensitive' } },
          { SDT: { contains: keyword, mode: 'insensitive' } }
        ]
      }
    : {};

  const users = await prisma.taiKhoan.findMany({
    where,
    include: includeProfiles,
    orderBy: { MaTaiKhoan: 'asc' }
  });

  return users.map(sanitizeUser);
}

// 7.1 - Thêm người dùng
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

    await createProfileForRole(tx, account.MaTaiKhoan, VaiTro, profile);

    return tx.taiKhoan.findUnique({
      where: { MaTaiKhoan: account.MaTaiKhoan },
      include: includeProfiles
    });
  });

  return sanitizeUser(user);
}

// 7.3 - Sửa thông tin người dùng & 7.4 - Cập nhật vai trò người dùng
export async function updateUser(userId, data, currentUserId) {
  const MaTaiKhoan = Number(userId);

  const existing = await prisma.taiKhoan.findUnique({ where: { MaTaiKhoan } });
  if (!existing) {
    throw Object.assign(new Error('Không tìm thấy tài khoản'), { statusCode: 404 });
  }

  const isSelf = MaTaiKhoan === Number(currentUserId);
  const roleChanged = data.VaiTro && data.VaiTro !== existing.VaiTro;

  // Tránh admin tự khóa hoặc tự đổi vai trò của mình -> mất quyền truy cập
  if (isSelf && roleChanged) {
    throw Object.assign(new Error('Không thể tự đổi vai trò tài khoản đang đăng nhập'), { statusCode: 400 });
  }
  if (isSelf && data.TrangThai === 'Khoa') {
    throw Object.assign(new Error('Không thể tự khóa tài khoản đang đăng nhập'), { statusCode: 400 });
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    const accountData = {};
    if (data.TenNguoiDung !== undefined) accountData.TenNguoiDung = data.TenNguoiDung;
    if (data.Email !== undefined) accountData.Email = data.Email;
    if (data.SDT !== undefined) accountData.SDT = data.SDT || null;
    if (data.TrangThai !== undefined) accountData.TrangThai = data.TrangThai;
    if (data.VaiTro !== undefined) accountData.VaiTro = data.VaiTro;
    if (data.MatKhau) accountData.MatKhau = await bcrypt.hash(data.MatKhau, 10);

    await tx.taiKhoan.update({ where: { MaTaiKhoan }, data: accountData });

    const newRole = data.VaiTro || existing.VaiTro;

    if (roleChanged) {
      // 7.4 - đổi vai trò: bỏ hồ sơ vai trò cũ, tạo hồ sơ vai trò mới
      await deleteProfileForRole(tx, MaTaiKhoan, existing.VaiTro);
      await createProfileForRole(tx, MaTaiKhoan, newRole, data.profile || {});
    } else if (data.profile) {
      // 7.3 - sửa thông tin hồ sơ của vai trò hiện tại
      await updateProfileForRole(tx, MaTaiKhoan, newRole, data.profile);
    }

    return tx.taiKhoan.findUnique({ where: { MaTaiKhoan }, include: includeProfiles });
  });

  return sanitizeUser(updatedUser);
}

// 7.2 - Xóa người dùng
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
