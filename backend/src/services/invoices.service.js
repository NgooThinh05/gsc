import prisma from '../config/prisma.js';
import { createNotifications } from './notifications.service.js';

// Sinh mã giao dịch "giả" giống ngân hàng trả về sau khi quét QR.
function generateTransactionCode() {
  const stamp = Date.now().toString().slice(-9);
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `GD${stamp}${rand}`;
}

const PAYMENT_LABELS = {
  ChuyenKhoan: 'Chuyển khoản (QR)',
  TienMat: 'Tiền mặt'
};

// Mô phỏng ngân hàng xác nhận đã quét QR: đánh dấu hóa đơn đã thanh toán,
// sinh mã giao dịch và gửi thông báo cho NV mua sắm, NV hợp đồng và quản lý.
export async function payInvoice(invoiceId, userId, data = {}) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.hoaDonThanhToan.findUnique({
      where: { MaHoaDon: Number(invoiceId) },
      include: {
        donHang: { include: { hopDong: true } }
      }
    });

    if (!invoice) {
      throw Object.assign(new Error('Không tìm thấy hóa đơn'), { statusCode: 404 });
    }

    const order = invoice.donHang;

    // Tài khoản cơ quan chỉ được thanh toán hóa đơn của chính đơn mình đặt.
    if (data.requireOwner && order.MaTaiKhoan_NVMS !== Number(userId)) {
      throw Object.assign(new Error('Bạn không có quyền thanh toán hóa đơn này'), { statusCode: 403 });
    }

    if (invoice.TrangThai === 'DaThanhToan') {
      throw Object.assign(new Error('Hóa đơn đã được thanh toán'), { statusCode: 400 });
    }

    if (invoice.TrangThai === 'Huy') {
      throw Object.assign(new Error('Hóa đơn đã bị hủy'), { statusCode: 400 });
    }

    const phuongThuc = data.PhuongThuc === 'TienMat' ? 'TienMat' : 'ChuyenKhoan';
    const maGiaoDich = generateTransactionCode();

    const updated = await tx.hoaDonThanhToan.update({
      where: { MaHoaDon: invoice.MaHoaDon },
      data: {
        TrangThai: 'DaThanhToan',
        PhuongThuc: phuongThuc,
        MaGiaoDich: maGiaoDich,
        NgayThanhToan: new Date()
      }
    });

    const soTien = Number(invoice.TongTien).toLocaleString('vi-VN');
    const phuongThucLabel = PAYMENT_LABELS[phuongThuc] || phuongThuc;

    // Người nhận thông báo: NV mua sắm (đặt đơn), NV hợp đồng, và toàn bộ quản lý.
    const managers = await tx.taiKhoan.findMany({
      where: { VaiTro: 'QuanLy', TrangThai: 'HoatDong' },
      select: { MaTaiKhoan: true }
    });

    const recipients = [
      {
        MaTaiKhoan: order.MaTaiKhoan_NVMS,
        NoiDung: `Đơn hàng #${order.MaDonHang} đã thanh toán thành công ${soTien} đ qua ${phuongThucLabel}. Mã giao dịch: ${maGiaoDich}.`
      }
    ];

    if (order.hopDong?.MaTaiKhoan_NVHD) {
      recipients.push({
        MaTaiKhoan: order.hopDong.MaTaiKhoan_NVHD,
        NoiDung: `Đơn hàng #${order.MaDonHang} (hợp đồng #${order.MaHopDong}) đã được cơ quan thanh toán ${soTien} đ. Mã giao dịch: ${maGiaoDich}.`
      });
    }

    for (const manager of managers) {
      recipients.push({
        MaTaiKhoan: manager.MaTaiKhoan,
        NoiDung: `Hóa đơn #${invoice.MaHoaDon} (đơn #${order.MaDonHang}) đã thanh toán ${soTien} đ. Mã giao dịch: ${maGiaoDich}.`
      });
    }

    await createNotifications(
      recipients.map((r) => ({
        ...r,
        Loai: 'ThanhToan',
        MaDonHang: order.MaDonHang,
        MaHoaDon: invoice.MaHoaDon
      })),
      tx
    );

    return updated;
  });
}

export async function createInvoice(userId, data) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.donDatHang.findUnique({
      where: { MaDonHang: Number(data.MaDonHang) },
      include: {
        chiTiet: { include: { hangHoa: true } },
        giaoHangs: true,
        hoaDons: true
      }
    });

    if (!order) {
      throw Object.assign(new Error('Không tìm thấy đơn hàng'), { statusCode: 404 });
    }

    if (order.giaoHangs.length === 0) {
      throw Object.assign(new Error('Đơn hàng chưa có phiếu giao hàng'), { statusCode: 400 });
    }

    if (order.hoaDons.length > 0) {
      throw Object.assign(new Error('Đơn hàng đã được lập hóa đơn'), { statusCode: 400 });
    }

    const total = order.chiTiet.reduce((sum, item) => {
      return sum + item.SoLuongGiao * Number(item.hangHoa.Gia);
    }, 0);

    if (total <= 0) {
      throw Object.assign(new Error('Không thể lập hóa đơn cho đơn chưa có số lượng giao'), { statusCode: 400 });
    }

    return tx.hoaDonThanhToan.create({
      data: {
        MaDonHang: order.MaDonHang,
        MaTaiKhoan_NVTT: userId,
        TongTien: total,
        NgayLap: data.NgayLap ? new Date(data.NgayLap) : new Date(),
        TrangThai: data.TrangThai || 'ChoThanhToan'
      },
      include: {
        donHang: { include: { chiTiet: { include: { hangHoa: true } } } }
      }
    });
  });
}

export async function listBillableOrders() {
  return prisma.donDatHang.findMany({
    where: {
      giaoHangs: { some: {} },
      hoaDons: { none: {} }
    },
    include: {
      hopDong: { include: { coQuan: true } },
      chiTiet: { include: { hangHoa: true } },
      giaoHangs: true
    },
    orderBy: { NgayDat: 'desc' }
  });
}

export async function listInvoices() {
  return prisma.hoaDonThanhToan.findMany({
    include: {
      donHang: { include: { hopDong: { include: { coQuan: true } }, chiTiet: { include: { hangHoa: true } }, giaoHangs: true } }
    },
    orderBy: { NgayLap: 'desc' }
  });
}
