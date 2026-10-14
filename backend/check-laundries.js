const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const laundries = await prisma.laundry.findMany({
    include: {
      owner: { select: { fullName: true, email: true, phoneNumber: true } },
      subscriptions: {
        where: { isActive: true },
        take: 1,
        include: { plan: { select: { nameAr: true } } },
      },
      _count: { select: { invoices: true, ratings: true } },
    },
  });
  console.log('Total laundries:', laundries.length);
  console.log('First laundry (sample):', laundries[0]);
}

main().catch(console.error).finally(() => prisma.$disconnect());
