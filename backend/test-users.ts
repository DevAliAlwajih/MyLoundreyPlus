import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, id: true, isActive: true },
  });
  console.log(users);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
