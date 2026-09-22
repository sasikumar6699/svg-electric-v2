const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDashboardQueries() {
  console.log('Testing dashboard Prisma queries...');
  
  const draftCount = await prisma.estimation.count({
    where: {
      status: {
        in: ['DRAFT', 'REVISION_REQUESTED'],
      },
    },
  });
  console.log('draftCount:', draftCount);

  const sampleFindMany = await prisma.estimation.findMany({
    where: {
      status: {
        in: [
          'PENDING_APPROVAL',
          'APPROVED',
          'FINALIZED',
          'PDF_GENERATED',
          'REVISION_REQUESTED',
          'REJECTED',
        ],
      },
    },
    take: 5,
  });
  console.log('sampleFindMany returned count:', sampleFindMany.length);
  console.log('SUCCESS: All enum values including REVISION_REQUESTED are valid in Prisma!');
}

testDashboardQueries()
  .catch((e) => {
    console.error('Query test failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
