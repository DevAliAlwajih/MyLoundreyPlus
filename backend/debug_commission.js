const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n=== 1. Commission Transactions in DB ===');
  const txs = await prisma.commissionTransaction.findMany({
    orderBy: { created_at: 'desc' },
    take: 10,
    include: { invoice: { select: { invoiceNumber: true, status: true } } },
  });
  if (txs.length === 0) {
    console.log('⚠️  NO commission transactions found in DB!');
  } else {
    txs.forEach(t => {
      console.log(`  ID: ${t.id}`);
      console.log(`  Invoice: ${t.invoice?.invoiceNumber} (${t.invoice?.status})`);
      console.log(`  Amount: ${t.commission_amount}, Rate: ${t.commission_rate}%, Type: ${t.type}`);
      console.log(`  Created: ${t.created_at}`);
      console.log('  ---');
    });
  }

  console.log('\n=== 2. Invoices with status = completed ===');
  const completed = await prisma.invoice.findMany({
    where: { status: 'completed' },
    select: { id: true, invoiceNumber: true, totalAmount: true, laundryId: true, completedAt: true },
  });
  if (completed.length === 0) {
    console.log('⚠️  No completed invoices found! Commission only triggers when status = completed');
  } else {
    completed.forEach(i => console.log(`  ${i.invoiceNumber} | total: ${i.totalAmount} | laundryId: ${i.laundryId}`));
  }

  console.log('\n=== 3. Laundries billing_type ===');
  const laundries = await prisma.laundry.findMany({
    select: { id: true, name: true, billing_type: true, commission_rate: true, balance: true },
  });
  laundries.forEach(l => {
    console.log(`  ${l.name} | billing_type: ${l.billing_type} | rate: ${l.commission_rate}% | balance: ${l.balance}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
