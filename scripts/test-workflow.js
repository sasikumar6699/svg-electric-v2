const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('--- TESTING WORKFLOW & COUNTS ---');

  // 1. Fetch users
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true }
  });
  console.log('Users:', users);

  const admin = users.find(u => u.role === 'ADMIN');
  const sales = users.find(u => u.role === 'SALES_USER');

  // 2. Counts check
  const total = await prisma.estimation.count();
  const pending = await prisma.estimation.count({ where: { status: 'PENDING_APPROVAL' } });
  const approved = await prisma.estimation.count({ where: { status: { in: ['APPROVED', 'FINALIZED', 'PDF_GENERATED'] } } });
  const drafts = await prisma.estimation.count({ where: { status: { in: ['DRAFT', 'REVISION_REQUESTED'] } } });
  const rejected = await prisma.estimation.count({ where: { status: 'REJECTED' } });
  const revision = await prisma.estimation.count({ where: { status: 'REVISION_REQUESTED' } });

  console.log({
    total,
    pending,
    approved,
    drafts,
    rejected,
    revision,
  });

  console.log('--- TEST COMPLETED SUCCESSFULLY ---');
}

run().catch(console.error).finally(() => prisma.$disconnect());
