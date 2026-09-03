const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  const pw = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@mgslty.com' },
    update: { password_hash: pw, role: 'admin', isActive: true },
    create: {
      email: 'admin@mgslty.com',
      fullName: 'Admin',
      role: 'admin',
      password_hash: pw,
      uniqueId: crypto.randomBytes(4).toString('hex').toUpperCase(),
      isVerified: true,
      isActive: true
    }
  });
  console.log('Admin admin@mgslty.com configured with password admin123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
