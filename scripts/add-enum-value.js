const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Adding REVISION_REQUESTED to EstimationStatus in PostgreSQL...');
  await prisma.$executeRawUnsafe(`ALTER TYPE "EstimationStatus" ADD VALUE IF NOT EXISTS 'REVISION_REQUESTED'`);
  console.log('Successfully altered PostgreSQL type EstimationStatus!');
  
  const result = await prisma.$queryRawUnsafe(`
    SELECT enumlabel 
    FROM pg_enum 
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
    WHERE pg_type.typname = 'EstimationStatus';
  `);
  console.log('Updated PostgreSQL EstimationStatus values:', result);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
