process.env.DATABASE_URL = "postgresql://postgres:775547603@localhost:5432/myloundreyplus";
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({ 
    where: { role: 'admin' },
    select: { id: true, email: true, role: true } 
  });
  console.log('ADMIN USERS:', JSON.stringify(users, null, 2));

  const notifs = await prisma.notification.findMany({ take: 10, orderBy: { sentAt: 'desc' } });
  console.log('LATEST 10 NOTIFS:', JSON.stringify(notifs, null, 2));

  const settings = await prisma.app_settings.findMany({
    where: { key: { startsWith: 'notif_' } }
  });
  console.log('NOTIF SETTINGS:', JSON.stringify(settings, null, 2));

  const latestMessages = await prisma.chat_messages.findMany({
    take: 5,
    orderBy: { sent_at: 'desc' }
  });
  console.log('LATEST MESSAGES:', JSON.stringify(latestMessages, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
