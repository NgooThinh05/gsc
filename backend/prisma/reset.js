import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Delete all data
  await prisma.auditLog.deleteMany();
  await prisma.thuTuChoi.deleteMany();
  await prisma.hoaDonThanhToan.deleteMany();
  await prisma.giaoHang.deleteMany();
  await prisma.chiTietDonHang.deleteMany();
  await prisma.donDatHang.deleteMany();
  await prisma.chiTietHopDong.deleteMany();
  await prisma.hopDong.deleteMany();
  await prisma.nhanVienKho.deleteMany();
  await prisma.nhanVienThanhToan.deleteMany();
  await prisma.nhanVienMuaSamCoQuan.deleteMany();
  await prisma.nhanVienHopDong.deleteMany();
  await prisma.hangHoa.deleteMany();
  await prisma.coQuanChinhPhu.deleteMany();
  await prisma.taiKhoan.deleteMany();
  console.log('Data deleted');

  // Get all sequences and reset them
  const tables = await prisma.$queryRawUnsafe(`
    SELECT relname FROM pg_class WHERE relkind = 'S' AND relnamespace = 'public'::regnamespace
  `);
  for (const row of tables) {
    const seqName = row.relname;
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE "${seqName}" RESTART WITH 1`);
  }
  console.log('Sequences reset');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
