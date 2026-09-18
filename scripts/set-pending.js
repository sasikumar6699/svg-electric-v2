const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.estimation.updateMany({
    where: { estimationNumber: 'EST-2026-01001' },
    data: { status: 'PENDING_APPROVAL' }
  });
  console.log('Updated to PENDING_APPROVAL:', updated.count);
}

main().catch(console.error).finally(() => prisma.$disconnect());