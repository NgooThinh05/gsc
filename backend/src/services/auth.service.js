import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

export async function login({ identifier, password }) {
  const account = await prisma.taiKhoan.findFirst({
    where: {
      OR: [{ TenNguoiDung: identifier }, { Email: identifier }]
    }
  });

  if (!account) {
    throw Object.assign(new Error('Thông tin đăng nhập không đúng'), { statusCode: 401 });
  }

  if (account.TrangThai !== 'HoatDong') {
    throw Object.assign(new Error('Tài khoản đã bị khóa'), { statusCode: 403 });
  }

  const isValidPassword = await bcrypt.compare(password, account.MatKhau);
  if (!isValidPassword) {
    throw Object.assign(new Error('Thông tin đăng nhập không đúng'), { statusCode: 401 });
  }

  const payload = {
    MaTaiKhoan: account.MaTaiKhoan,
    TenNguoiDung: account.TenNguoiDung,
    VaiTro: account.VaiTro
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });

  return {
    token,
    user: payload
  };
}

// Thông tin tài khoản hiện tại (kèm cơ quan nếu là TaiKhoanCoQuan)
export async function getCurrentUser(userId) {
  const user = await prisma.taiKhoan.findUnique({
    where: { MaTaiKhoan: Number(userId) },
    include: {
      nhanVienHopDong: true,
      taiKhoanCoQuan: { include: { coQuan: true } },
      nhanVienKho: true,
      quanLy: true
    }
  });

  if (!user) {
    throw Object.assign(new Error('Không tìm thấy tài khoản'), { statusCode: 404 });
  }

  const { MatKhau, ...safeUser } = user;
  return safeUser;
}

// Đổi mật khẩu cho tài khoản đang đăng nhập (mọi vai trò)
export async function changePassword(userId, { oldPassword, newPassword }) {
  if (!oldPassword || !newPassword) {
    throw Object.assign(new Error('Vui lòng nhập mật khẩu cũ và mật khẩu mới'), { statusCode: 400 });
  }

  if (String(newPassword).length < 6) {
    throw Object.assign(new Error('Mật khẩu mới phải có ít nhất 6 ký tự'), { statusCode: 400 });
  }

  const account = await prisma.taiKhoan.findUnique({ where: { MaTaiKhoan: Number(userId) } });
  if (!account) {
    throw Object.assign(new Error('Không tìm thấy tài khoản'), { statusCode: 404 });
  }

  const isValid = await bcrypt.compare(oldPassword, account.MatKhau);
  if (!isValid) {
    throw Object.assign(new Error('Mật khẩu cũ không đúng'), { statusCode: 400 });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.taiKhoan.update({ where: { MaTaiKhoan: account.MaTaiKhoan }, data: { MatKhau: hashed } });

  return { message: 'Đổi mật khẩu thành công' };
}
