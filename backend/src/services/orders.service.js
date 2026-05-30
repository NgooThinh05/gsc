import prisma from '../config/prisma.js';

/**
 * Tiến trình 2.3 - Kiểm tra tính hợp lệ của đơn hàng so với điều khoản hợp đồng.
 * Trả về { valid, reasons[] }. Đơn cần include:
 *  - hopDong: { TrangThai, NgayHetHan, chiTiet[] (MaHangHoa, SoLuongToiDa, SoTienToiDa) }
 *  - chiTiet: [{ MaHangHoa, SoLuongDat, hangHoa: { Ten, Gia } }]
 */
export function evaluateOrderCompliance(order) {
  const reasons = [];
  const contract = order.hopDong;

  if (!contract) {
    return { valid: false, reasons: ['Đơn hàng không gắn với hợp đồng hợp lệ'] };
  }

  // 2.3.1 - Kiểm tra hiệu lực của hợp đồng
  if (contract.TrangThai !== 'HieuLuc') {
    reasons.push(`Hợp đồng đang ở trạng thái "${contract.TrangThai}", không còn hiệu lực`);
  }
  if (new Date(contract.NgayHetHan) < new Date()) {
    reasons.push('Hợp đồng đã hết hạn');
  }

  const terms = new Map((contract.chiTiet || []).map((term) => [term.MaHangHoa, term]));

  for (const detail of order.chiTiet) {
    const term = terms.get(detail.MaHangHoa);
    const ten = detail.hangHoa?.Ten || `#${detail.MaHangHoa}`;

    // 2.3.2 - Kiểm tra danh mục thiết bị
    if (!term) {
      reasons.push(`Hàng hóa "${ten}" không thuộc danh mục hợp đồng`);
      continue;
    }

    if (detail.SoLuongDat > term.SoLuongToiDa) {
      reasons.push(`"${ten}" đặt ${detail.SoLuongDat} vượt số lượng tối đa ${term.SoLuongToiDa}`);
    }

    // 2.3.3 - Kiểm tra hạn mức chi phí
    const lineTotal = detail.SoLuongDat * Number(detail.hangHoa.Gia);
    if (lineTotal > Number(term.SoTienToiDa)) {
      reasons.push(
        `Chi phí "${ten}" (${lineTotal.toLocaleString('vi-VN')}đ) vượt hạn mức hợp đồng (${Number(term.SoTienToiDa).toLocaleString('vi-VN')}đ)`
      );
    }
  }

  return { valid: reasons.length === 0, reasons };
}

/**
 * Tự động duyệt các đơn "ChoDuyet" đã tuân thủ điều khoản hợp đồng -> "DaDuyet".
 * (Mutating-on-read theo cùng kiểu syncExpiredContracts để danh sách luôn cập nhật.)
 */
export async function syncOrderApprovals() {
  const pending = await prisma.donDatHang.findMany({
    where: { TrangThai: 'ChoDuyet' },
    include: {
      hopDong: { include: { chiTiet: true } },
      chiTiet: { include: { hangHoa: true } }
    }
  });

  const compliantIds = pending
    .filter((order) => evaluateOrderCompliance(order).valid)
    .map((order) => order.MaDonHang);

  if (compliantIds.length > 0) {
    await prisma.donDatHang.updateMany({
      where: { MaDonHang: { in: compliantIds } },
      data: { TrangThai: 'DaDuyet' }
    });
  }
}

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

    if (!contract) {
      throw Object.assign(new Error('Hợp đồng không tồn tại'), { statusCode: 400 });
    }

    const purchaser = await tx.nhanVienMuaSamCoQuan.findUnique({
      where: { MaTaiKhoan: userId }
    });

    if (!purchaser) {
      throw Object.assign(new Error('Không tìm thấy thông tin cơ quan của nhân viên mua sắm'), { statusCode: 403 });
    }

    // Phân quyền: chỉ được đặt theo hợp đồng của cơ quan mình (chặn cứng)
    if (purchaser.MaCoQuan !== contract.MaCoQuan) {
      throw Object.assign(new Error('Bạn chỉ được đặt hàng theo hợp đồng của cơ quan mình'), { statusCode: 403 });
    }

    // Lấy giá hàng hóa (cho phép cả mặt hàng ngoài danh mục để bước duyệt phát hiện vi phạm)
    const orderedIds = items.map((item) => Number(item.MaHangHoa));
    const products = await tx.hangHoa.findMany({ where: { MaHangHoa: { in: orderedIds } } });
    const productMap = new Map(products.map((product) => [product.MaHangHoa, product]));

    let total = 0;
    const detailRows = items.map((item) => {
      const MaHangHoa = Number(item.MaHangHoa);
      const SoLuongDat = Number(item.SoLuongDat);
      const product = productMap.get(MaHangHoa);

      if (!product) {
        throw Object.assign(new Error(`Hàng hóa ${MaHangHoa} không tồn tại`), { statusCode: 400 });
      }

      if (!Number.isInteger(SoLuongDat) || SoLuongDat <= 0) {
        throw Object.assign(new Error(`Số lượng đặt của hàng hóa ${MaHangHoa} không hợp lệ`), { statusCode: 400 });
      }

      total += SoLuongDat * Number(product.Gia);
      return { MaHangHoa, SoLuongDat };
    });

    // 2.3 - So sánh đơn với điều khoản hợp đồng để quyết định trạng thái khởi tạo
    const compliance = evaluateOrderCompliance({
      hopDong: contract,
      chiTiet: detailRows.map((row) => ({ ...row, hangHoa: productMap.get(row.MaHangHoa) }))
    });

    return tx.donDatHang.create({
      data: {
        MaHopDong: contract.MaHopDong,
        MaTaiKhoan_NVMS: userId,
        TongTien: total,
        TrangThai: compliance.valid ? 'DaDuyet' : 'ChoDuyet',
        chiTiet: { create: detailRows }
      },
      include: { chiTiet: { include: { hangHoa: true } }, hopDong: true }
    });
  });
}

export async function listOrders(user) {
  // Tự động duyệt các đơn đã tuân thủ trước khi trả danh sách
  await syncOrderApprovals();

  const where = {};

  if (user?.VaiTro === 'NhanVienMuaSamCoQuan') {
    where.MaTaiKhoan_NVMS = user.MaTaiKhoan;
  }

  // Kho chỉ xử lý đơn đã được nhân viên hợp đồng duyệt
  if (user?.VaiTro === 'NhanVienKho') {
    where.TrangThai = 'DaDuyet';
  }

  const orders = await prisma.donDatHang.findMany({
    where,
    include: {
      hopDong: { include: { coQuan: true, chiTiet: true } },
      chiTiet: { include: { hangHoa: true } },
      giaoHangs: true,
      hoaDons: true,
      ThuTuChoi: true
    },
    orderBy: { NgayDat: 'desc' }
  });

  // Đính kèm kết quả so sánh điều khoản để frontend hiển thị lí do / bật nút từ chối
  return orders.map((order) => ({ ...order, danhGia: evaluateOrderCompliance(order) }));
}

/**
 * Tiến trình 2.4 - Xử lí đơn hàng không hợp lệ.
 * Nhân viên hợp đồng xác nhận từ chối một đơn hàng đang chờ duyệt:
 *  2.4.1 Xác định lí do vi phạm  -> reason bắt buộc
 *  2.4.2 Soạn thư từ chối        -> tạo bản ghi ThuTuChoi (thư từ chối kèm lí do)
 *  2.4.4 Cập nhật trạng thái     -> đơn hàng chuyển sang trạng thái Huy (vi phạm)
 */
export async function rejectOrder(userId, orderId, reason) {
  const LiDo = (reason || '').trim();

  if (!LiDo) {
    throw Object.assign(new Error('Lí do từ chối là bắt buộc'), { statusCode: 400 });
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.donDatHang.findUnique({
      where: { MaDonHang: Number(orderId) },
      include: { chiTiet: true }
    });

    if (!order) {
      throw Object.assign(new Error('Không tìm thấy đơn hàng'), { statusCode: 404 });
    }

    if (!['ChoDuyet', 'DaDuyet'].includes(order.TrangThai)) {
      throw Object.assign(new Error('Chỉ từ chối đơn hàng đang chờ duyệt hoặc đã duyệt'), { statusCode: 400 });
    }

    // Hoàn trả tồn kho nếu đơn đã được phân bổ số lượng giao trước đó
    for (const detail of order.chiTiet) {
      if (detail.SoLuongGiao > 0) {
        await tx.hangHoa.update({
          where: { MaHangHoa: detail.MaHangHoa },
          data: { SoLuongTrongKho: { increment: detail.SoLuongGiao } }
        });
        await tx.chiTietDonHang.update({
          where: { MaDonHang_MaHangHoa: { MaDonHang: detail.MaDonHang, MaHangHoa: detail.MaHangHoa } },
          data: { SoLuongGiao: 0 }
        });
      }
    }

    // 2.4.2 - Soạn / lưu thư từ chối kèm lí do
    await tx.thuTuChoi.create({
      data: {
        LiDo,
        MaDonHang: order.MaDonHang,
        MaTaiKhoan_NVHD: userId
      }
    });

    // 2.4.4 - Cập nhật trạng thái đơn hàng sang Huy (vi phạm / bị từ chối)
    return tx.donDatHang.update({
      where: { MaDonHang: order.MaDonHang },
      data: { TrangThai: 'Huy' },
      include: {
        hopDong: { include: { coQuan: true } },
        chiTiet: { include: { hangHoa: true } },
        ThuTuChoi: true
      }
    });
  });
}

export async function getOrder(orderId) {
  const order = await prisma.donDatHang.findUnique({
    where: { MaDonHang: Number(orderId) },
    include: {
      hopDong: { include: { coQuan: true, chiTiet: true } },
      chiTiet: { include: { hangHoa: true } },
      giaoHangs: true,
      hoaDons: true,
      ThuTuChoi: true
    }
  });

  if (!order) {
    throw Object.assign(new Error('Không tìm thấy đơn hàng'), { statusCode: 404 });
  }

  return { ...order, danhGia: evaluateOrderCompliance(order) };
}
