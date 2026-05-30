import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const result = await prisma.$queryRawUnsafe(
  "SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'DonDatHang' AND column_name = 'MaHopDong'"
);
console.log(JSON.stringify(result));
await prisma.$disconnect();
