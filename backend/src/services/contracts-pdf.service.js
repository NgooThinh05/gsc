import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pdfmake from 'pdfmake/js/index.js';
import prisma from '../config/prisma.js';

// Đường dẫn tương đối tới thư mục font (chạy được trên mọi OS, không phụ thuộc đường dẫn Linux).
const fontBase = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/fonts');

try {
  pdfmake.addFonts({
    Roboto: {
      normal: path.join(fontBase, 'Roboto-Regular.ttf'),
      bold: path.join(fontBase, 'Roboto-Bold.ttf'),
      italics: path.join(fontBase, 'Roboto-Italic.ttf'),
      bolditalics: path.join(fontBase, 'Roboto-BoldItalic.ttf')
    }
  });

  // Tắt cảnh báo bảo mật của pdfmake: chỉ cho đọc font cục bộ, chặn tải tài nguyên qua URL.
  pdfmake.setLocalAccessPolicy((filePath) => filePath.startsWith(fontBase)); // chỉ cho đọc font cục bộ
  pdfmake.setUrlAccessPolicy(() => false);                                   // chặn tải tài nguyên URL ngoài
} catch {
  // Không bao giờ để việc cấu hình font làm hỏng quá trình tạo PDF.
}

export async function generateContractPdf(contractId) {
  const contract = await prisma.hopDong.findUnique({
    where: { MaHopDong: Number(contractId) },
    include: {
      coQuan: true,
      chiTiet: { include: { hangHoa: true } },
      nhanVienHopDong: true
    }
  });

  if (!contract) {
    throw Object.assign(new Error('Không tìm thấy hợp đồng'), { statusCode: 404 });
  }

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 50],
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
      lineHeight: 1.25
    },
    styles: {
      title: { fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 6] },
      subtitle: { fontSize: 10, alignment: 'center', margin: [0, 0, 0, 14] },
      section: { fontSize: 11, bold: true, margin: [0, 8, 0, 6] },
      label: { bold: true },
      tableHeader: { bold: true, fillColor: '#f1f5f9' }
    },
    content: [
      { text: 'HỢP ĐỒNG CUNG CẤP HÀNG HÓA', style: 'title' },
      { text: `Mã hợp đồng: #${contract.MaHopDong}`, style: 'subtitle' },

      { text: 'I. THÔNG TIN CHUNG', style: 'section' },
      {
        stack: [
          { text: [{ text: 'Cơ quan: ', style: 'label' }, contract.coQuan?.Ten || '—'] },
          { text: [{ text: 'Ngày ký: ', style: 'label' }, formatDate(contract.NgayKy)] },
          { text: [{ text: 'Ngày hết hạn: ', style: 'label' }, formatDate(contract.NgayHetHan)] },
          { text: [{ text: 'Trạng thái: ', style: 'label' }, getStatusLabel(contract.TrangThai)] },
          contract.TenNguoiKy ? { text: [{ text: 'Người ký: ', style: 'label' }, contract.TenNguoiKy] } : null,
          contract.ChucVuNguoiKy ? { text: [{ text: 'Chức vụ: ', style: 'label' }, contract.ChucVuNguoiKy] } : null,
          contract.DieuKhoan ? {
            stack: [
              { text: [{ text: 'Điều khoản: ', style: 'label' }, ''] },
              ...renderContractTerms(contract.DieuKhoan)
            ],
            margin: [0, 4, 0, 0]
          } : null
        ].filter(Boolean)
      },

      ...(contract.nhanVienHopDong
        ? [
            { text: 'II. NHÂN VIÊN PHỤ TRÁCH', style: 'section' },
            { text: [{ text: 'Tên: ', style: 'label' }, contract.nhanVienHopDong.TenNguoiDung || '—'] },
            { text: [{ text: 'Email: ', style: 'label' }, contract.nhanVienHopDong.Email || '—'], margin: [0, 0, 0, 4] }
          ]
        : []),

      { text: 'III. DANH SÁCH HÀNG HÓA', style: 'section' },
      {
        table: {
          headerRows: 1,
          widths: [30, '*', 110],
          body: [
            [
              { text: 'STT', style: 'tableHeader' },
              { text: 'Hàng hóa', style: 'tableHeader' },
              { text: 'Hạn mức tối đa', style: 'tableHeader', alignment: 'right' }
            ],
            ...(contract.chiTiet?.length
              ? contract.chiTiet.map((item, idx) => [
                  String(idx + 1),
                  item.hangHoa?.Ten || `#${item.MaHangHoa}`,
                  { text: formatCurrency(item.SoTienToiDa), alignment: 'right' }
                ])
              : [[{ text: 'Không có chi tiết hàng hóa', colSpan: 3, italics: true }, {}, {}]])
          ]
        },
        layout: 'lightHorizontalLines'
      },

      {
        margin: [0, 26, 0, 0],
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            alignment: 'center',
            stack: [
              { text: 'Ký và dấu', margin: [0, 0, 0, 34] },
              { text: '_________________' },
              { text: `Ngày: ${formatDate(new Date())}`, margin: [0, 10, 0, 0] }
            ]
          }
        ]
      }
    ]
  };

  return pdfmake.createPdf(docDefinition);
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('vi-VN');
}

function formatCurrency(value) {
  return `${Number(value).toLocaleString('vi-VN')} đ`;
}

function renderContractTerms(termsText) {
  return String(termsText)
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-•]\s*/, '').trim())
    .filter(Boolean)
    .map((line) => ({
      columns: [
        { width: 12, text: '•' },
        { width: '*', text: line }
      ],
      margin: [0, 1, 0, 1]
    }));
}

function getStatusLabel(status) {
  const map = { HieuLuc: 'Hiệu lực', TamDung: 'Tạm dừng', HetHan: 'Hết hạn' };
  return map[status] || status;
}
