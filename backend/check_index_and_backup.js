const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Check existing unique index on invoices for invoice_number
    const indexes = await prisma.$queryRawUnsafe(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'invoices' AND indexname LIKE '%invoice_number%';
    `);
    console.log('--- INDEXES ON INVOICES ---');
    console.log(indexes);
    console.log('---------------------------\n');

    // 2. Backup invoices and invoice_items
    console.log('Starting backup...');
    const invoices = await prisma.invoice.findMany();
    const invoiceItems = await prisma.invoiceItem.findMany();
    
    fs.writeFileSync('invoices_backup.json', JSON.stringify(invoices, null, 2));
    fs.writeFileSync('invoice_items_backup.json', JSON.stringify(invoiceItems, null, 2));
    
    console.log(`Backup completed: ${invoices.length} invoices, ${invoiceItems.length} invoice items.`);
  } catch (error) {
    console.error('Error:', error);
  }
}

main().finally(() => prisma.$disconnect());
