import prisma from '../config/prisma.js';

export async function listProducts() {
  return prisma.hangHoa.findMany({
    orderBy: { MaHangHoa: 'asc' }
  });
}

export async function createProduct(data) {
  const { Ten, SoLuongTrongKho, Gia } = data;

  if (!Ten || SoLuongTrongKho === undefined || Gia === undefined) {
    throw Object.assign(new Error('Tên hàng hóa, số lượng trong kho và giá là bắt buộc'), { statusCode: 400 });
  }

  if (Number(SoLuongTrongKho) < 0 || Number(Gia) <= 0) {
    throw Object.assign(new Error('Số lượng phải không âm và giá phải lớn hơn 0'), { statusCode: 400 });
  }

  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"HangHoa"', 'MaHangHoa'), COALESCE((SELECT MAX("MaHangHoa") FROM "HangHoa"), 1), true)`;

  return prisma.hangHoa.create({
    data: {
      Ten,
      SoLuongTrongKho: Number(SoLuongTrongKho),
      Gia: Number(Gia)
    }
  });
}
