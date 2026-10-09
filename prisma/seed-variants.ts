import { db } from '../lib/db';

async function seedVariants() {
  console.log('Fetching active finished goods...');
  const goods = await db.finishedGood.findMany({
    where: { active: true },
    include: { category: true, variants: true },
  });

  console.log(`Found ${goods.length} active finished goods.`);

  for (const fg of goods) {
    if (fg.variants && fg.variants.length > 0) {
      console.log(`Model ${fg.modelNumber} already has ${fg.variants.length} variants, skipping.`);
      continue;
    }

    console.log(`Seeding standard industrial variants for ${fg.modelNumber} (${fg.name})...`);

    // 1. Switchgear Make
    const dimMake = await db.fgVariantDimension.create({
      data: {
        finishedGoodId: fg.id,
        dimensionName: 'Switchgear & Feeder Component Make',
        displayOrder: 1,
      },
    });

    await db.fgVariantOption.createMany({
      data: [
        {
          dimensionId: dimMake.id,
          optionName: 'Schneider Electric Compact NSX',
          isDefault: true,
          priceDelta: 0,
          description: 'Factory baseline switchgear specification',
          displayOrder: 1,
        },
        {
          dimensionId: dimMake.id,
          optionName: 'L&T Power Control Standard',
          isDefault: false,
          priceDelta: 12500,
          description: 'Tier-1 domestic switchgear with local warranty',
          displayOrder: 2,
        },
        {
          dimensionId: dimMake.id,
          optionName: 'ABB SACE Isomax & XT Series',
          isDefault: false,
          priceDelta: 18000,
          description: 'European high-breaking capacity switchgear',
          displayOrder: 3,
        },
        {
          dimensionId: dimMake.id,
          optionName: 'Siemens 3VA / 3WL High-End',
          isDefault: false,
          priceDelta: 24500,
          description: 'Heavy industrial grade breaker package',
          displayOrder: 4,
        },
      ],
    });

    // 2. Ingress Protection (IP Rating)
    const dimIp = await db.fgVariantDimension.create({
      data: {
        finishedGoodId: fg.id,
        dimensionName: 'Ingress Protection & Gasketing',
        displayOrder: 2,
      },
    });

    await db.fgVariantOption.createMany({
      data: [
        {
          dimensionId: dimIp.id,
          optionName: 'IP54 Standard Industrial Enclosure',
          isDefault: true,
          priceDelta: 0,
          description: 'Neoprene gasket with dust and splash protection',
          displayOrder: 1,
        },
        {
          dimensionId: dimIp.id,
          optionName: 'IP55 Outdoor Weatherproof Gasketing',
          isDefault: false,
          priceDelta: 8500,
          description: 'Polyurethane foam-in-place seal with rain canopies',
          displayOrder: 2,
        },
        {
          dimensionId: dimIp.id,
          optionName: 'IP65 Heavy Washdown / Corrosive Environment',
          isDefault: false,
          priceDelta: 22000,
          description: 'Dual-door stainless steel hardware with hermetic seal',
          displayOrder: 3,
        },
      ],
    });

    // 3. Busbar System
    const dimBusbar = await db.fgVariantDimension.create({
      data: {
        finishedGoodId: fg.id,
        dimensionName: 'Busbar Conductor Material',
        displayOrder: 3,
      },
    });

    await db.fgVariantOption.createMany({
      data: [
        {
          dimensionId: dimBusbar.id,
          optionName: 'EC-Grade Aluminium Busbars (0.8 A/sq.mm)',
          isDefault: true,
          priceDelta: 0,
          description: 'Standard engineered aluminium busbar with heat-shrink sleeves',
          displayOrder: 1,
        },
        {
          dimensionId: dimBusbar.id,
          optionName: 'Electrolytic ETP Copper Busbars (1.6 A/sq.mm)',
          isDefault: false,
          priceDelta: 36000,
          description: '99.9% Pure copper busbars with CPRI-validated current density',
          displayOrder: 2,
        },
      ],
    });

    // 4. Digital Metering & Communication
    const dimMeter = await db.fgVariantDimension.create({
      data: {
        finishedGoodId: fg.id,
        dimensionName: 'Metering & Energy Management',
        displayOrder: 4,
      },
    });

    await db.fgVariantOption.createMany({
      data: [
        {
          dimensionId: dimMeter.id,
          optionName: 'Standard Analog Ammeter & Voltmeter',
          isDefault: true,
          priceDelta: 0,
          description: 'Analog panel meters with selector switches',
          displayOrder: 1,
        },
        {
          dimensionId: dimMeter.id,
          optionName: 'Digital Multifunction Meter (MFM) with RS-485',
          isDefault: false,
          priceDelta: 7500,
          description: 'Class 1.0 MFM with V, I, kW, kVA, PF, and Modbus RTU',
          displayOrder: 2,
        },
        {
          dimensionId: dimMeter.id,
          optionName: 'Smart IoT Gateway with Cloud Telemetry',
          isDefault: false,
          priceDelta: 16500,
          description: 'Ethernet + 4G cellular gateway with web dashboard logging',
          displayOrder: 3,
        },
      ],
    });

    console.log(`Successfully configured 4 dimensions for ${fg.modelNumber}.`);
  }

  console.log('Seeding complete!');
}

seedVariants()
  .catch(console.error)
  .finally(() => process.exit(0));
