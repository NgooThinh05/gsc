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
