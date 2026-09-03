const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.app_settings.upsert({
    where: { key: 'default_debt_limit' },
    update: { value: '5000', description: 'حد الآجل الافتراضي للمغسلة الجديدة (ريال)' },
    create: { key: 'default_debt_limit', value: '5000', description: 'حد الآجل الافتراضي للمغسلة الجديدة (ريال)' },
  });

  const r = await prisma.laundry.updateMany({
    data: { debt_limit: 5000 },
  });

  const settings = await prisma.app_settings.findMany({ orderBy: { key: 'asc' } });
  console.log('\n=== app_settings ===');
  settings.forEach(s => console.log(`  ${s.key}: ${s.value}  — ${s.description}`));

  const laundries = await prisma.laundry.findMany({
    select: { name: true, billing_type: true, commission_rate: true, balance: true, debt_limit: true, trial_commission_ends_at: true }
  });
  console.log('\n=== Laundries billing ===');
  laundries.forEach(l => console.log(`  ${l.name} | type: ${l.billing_type} | rate: ${l.commission_rate}% | balance: ${l.balance} | debt_limit: ${l.debt_limit} | trial_ends: ${l.trial_commission_ends_at}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
