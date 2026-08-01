import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Check invoices for walk_in_phone 775547603 or علي الوجيه
  const invoices = await prisma.invoice.findMany({
    where: {
      OR: [
        { walk_in_name: { contains: 'علي' } },
        { walk_in_phone: '775547603' },
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      walk_in_name: true,
      walk_in_phone: true,
      totalAmount: true,
      createdAt: true,
      items: {
        select: {
          id: true,
          itemName: true,
          unitPrice: true,
          quantity: true,
          subtotal: true,
          service_type: true,
        }
      }
    }
  });

  console.log('=== Invoices for علي الوجيه / 775547603 ===');
  console.log(JSON.stringify(invoices, null, 2));

  // Also check last 5 invoices overall
  const lastInvoices = await prisma.invoice.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      walk_in_name: true,
      totalAmount: true,
      createdAt: true,
      items: { select: { unitPrice: true, subtotal: true, service_type: true } }
    }
  });

  console.log('\n=== Last 5 invoices overall ===');
  console.log(JSON.stringify(lastInvoices, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
