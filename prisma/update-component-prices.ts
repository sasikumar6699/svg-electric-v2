import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Running instant batch SQL update for listPrice and finalPrice (10% discount)...');
  
  // Set listPrice to unitPrice if listPrice is null or 0, and finalPrice to 90% of listPrice (10% discount)
  const result = await prisma.$executeRawUnsafe(`
    UPDATE "ComponentMaster"
    SET 
      "listPrice" = CASE 
        WHEN "listPrice" IS NOT NULL AND "listPrice" > 0 THEN "listPrice"
        ELSE "unitPrice"
      END,
      "finalPrice" = ROUND((CASE 
        WHEN "listPrice" IS NOT NULL AND "listPrice" > 0 THEN "listPrice"
        ELSE "unitPrice"
      END * 0.90)::numeric, 2),
      "unitPrice" = ROUND((CASE 
        WHEN "listPrice" IS NOT NULL AND "listPrice" > 0 THEN "listPrice"
        ELSE "unitPrice"
      END * 0.90)::numeric, 2);
  `);

  console.log(`Updated ${result} components with listPrice and finalPrice (10% discount) in a single fast query!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
