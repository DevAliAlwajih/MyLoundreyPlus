const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const rows = await p.app_settings.findMany();
  console.log(JSON.stringify(rows, null, 2));
  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
