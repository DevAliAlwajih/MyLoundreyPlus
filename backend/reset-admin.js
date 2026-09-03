const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  console.log('Searching for admin user...');
  let admin = await prisma.user.findFirst({
    where: { role: 'admin' },
  });

  const newPassword = 'admin';
  const password_hash = await bcrypt.hash(newPassword, 10);

  if (!admin) {
    console.log('No admin user found. Creating one...');
    const uniqueId = crypto.randomBytes(4).toString('hex').toUpperCase();
    admin = await prisma.user.create({
      data: {
        email: 'admin@admin.com',
        fullName: 'Admin User',
        role: 'admin',
        password_hash: password_hash,
        uniqueId: uniqueId,
        isVerified: true,
        isActive: true
      },
    });
    console.log(`Created new admin: Email: admin@admin.com | Password: ${newPassword}`);
  } else {
    await prisma.user.update({
      where: { id: admin.id },
      data: { password_hash },
    });
    console.log(`Updated existing admin (${admin.email}) password to: ${newPassword}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
