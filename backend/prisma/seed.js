import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  const exists = await prisma.user.findUnique({ where: { email: 'admin@parametrizze.com' } });
  if (!exists) {
    const hash = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: { name: 'Admin', email: 'admin@parametrizze.com', password: hash, role: Role.admin }
    });
    console.log('Admin criado: admin@parametrizze.com / admin123');
  } else {
    console.log('Admin já existe.');
  }
}
main().finally(() => prisma.$disconnect());
