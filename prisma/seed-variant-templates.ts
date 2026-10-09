import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SAMPLE_TEMPLATES = [
  // ----------------------------------------------------
  // AC DRIVE & SOFT STARTER PANELS (ACD)
  // ----------------------------------------------------
  {
    categoryCode: 'ACD',
    dimensionName: 'Drive Protection & Harmonic Filter',
    description: 'Input line reactor, harmonic filtering, and dynamic braking resistors for AC Drive panels',
    displayOrder: 1,
    options: [
      {
        optionName: 'Standard Input Line Choke (Included)',
        isDefault: true,
        priceDelta: 0,
        description: '3% AC Line Reactor for basic line surge and peak current protection',
      },
      {
        optionName: 'Active Front End (AFE) Low Harmonic Filter',
        isDefault: false,
        priceDelta: 95000,
        description: 'Limits THDi < 5%, IEEE 519 compliance for clean factory power grids',
      },
      {
        optionName: 'Heavy Duty dV/dt Sine Wave Output Filter',
        isDefault: false,
        priceDelta: 34000,
        description: 'Protects motor winding insulation on long cable lengths (>50 meters)',
      },
      {
        optionName: 'Dynamic Braking Unit & High Capacity Resistor',
        isDefault: false,
        priceDelta: 22000,
        description: 'Absorbs regenerative motor energy for rapid stopping and high-inertia loads',
      },
    ],
  },
  {
    categoryCode: 'ACD',
    dimensionName: 'Bypass & Redundancy Starter System',
    description: 'Manual and automatic bypass provisions to run motor directly from mains during VFD service',
    displayOrder: 2,
    options: [
      {
        optionName: 'Single Drive Mode (Baseline)',
        isDefault: true,
        priceDelta: 0,
        description: 'Standard single VFD drive output to motor',
      },
      {
        optionName: 'Manual Bypass DOL / Star-Delta Starter System',
        isDefault: false,
        priceDelta: 28000,
        description: 'Contactor-based bypass circuit allows motor operation while VFD is serviced',
      },
      {
        optionName: 'Automatic Dual Drive Redundant System with Auto-Transfer',
        isDefault: false,
        priceDelta: 145000,
        description: 'Duty/Standby dual VFD modules with automatic changeover on drive fault trip',
      },
    ],
  },
  {
    categoryCode: 'ACD',
    dimensionName: 'Drive Cooling & Thermal Management',
    description: 'Heat dissipation and climate control solutions for high-power converter modules',
    displayOrder: 3,
    options: [
      {
        optionName: 'Forced Louver Fan Cooling (Baseline)',
        isDefault: true,
        priceDelta: 0,
        description: 'Top exhaust fans with washable air filter inlet pads',
      },
      {
        optionName: 'Twin Heavy Duty Fans with Digital Thermostat',
        isDefault: false,
        priceDelta: 8500,
        description: 'Automatic temperature-triggered exhaust cooling system',
      },
      {
        optionName: 'Industrial Panel Air Conditioner (3400 BTU / 1000W)',
        isDefault: false,
        priceDelta: 58000,
        description: 'Closed-loop IP54 active cooling for dusty, humid, or high-ambient plant environments',
      },
      {
        optionName: 'Anti-Condensation Space Heater with Hygrostat',
        isDefault: false,
        priceDelta: 4500,
        description: 'Automatic humidity-controlled heater to prevent internal condensation',
      },
    ],
  },

  // ----------------------------------------------------
  // MOTOR CONTROL CENTER PANELS (MCC)
  // ----------------------------------------------------
  {
    categoryCode: 'MCC',
    dimensionName: 'Starter Feeder Compartment Execution',
    description: 'Construction format of motor starter feeder modules',
    displayOrder: 1,
    options: [
      {
        optionName: 'Fixed Starter Feeders (Baseline)',
        isDefault: true,
        priceDelta: 0,
        description: 'Bolted busbar connections with mechanical door interlock switches',
      },
      {
        optionName: 'Fully Drawout Modular Cassette Execution',
        isDefault: false,
        priceDelta: 85000,
        description: 'Plug-in cassettes with Service/Test/Isolated mechanical interlock positions',
      },
      {
        optionName: 'Soft Starter in Incomer & Critical Motor Feeders',
        isDefault: false,
        priceDelta: 65000,
        description: 'Smooth current-limited acceleration for pumps, compressors and heavy blowers',
      },
    ],
  },
  {
    categoryCode: 'MCC',
    dimensionName: 'Motor Protection & Intelligent Relays',
    description: 'Level of electrical protection and diagnostics for connected electric motors',
    displayOrder: 2,
    options: [
      {
        optionName: 'Standard Bimetallic Thermal Overload Relays',
        isDefault: true,
        priceDelta: 0,
        description: 'Class 10 thermal overload protection with single-phase sensitivity',
      },
      {
        optionName: 'Microprocessor Motor Protection Relay (MPR)',
        isDefault: false,
        priceDelta: 28000,
        description: 'Earth fault, locked rotor, current unbalance, phase reversal and stall protection',
      },
      {
        optionName: 'Intelligent Smart Motor Controller (SIMOCODE / TeSys T)',
        isDefault: false,
        priceDelta: 54000,
        description: 'Digital current/voltage telemetry, operating hours, fault logging and Ethernet/IP integration',
      },
    ],
  },
  {
    categoryCode: 'MCC',
    dimensionName: 'Incomer Switchgear Make & Trip Unit',
    description: 'Main incoming breaker brand and trip release mechanism',
    displayOrder: 3,
    options: [
      {
        optionName: 'L&T / ABB MCCB with Thermal-Magnetic Trip (Standard)',
        isDefault: true,
        priceDelta: 0,
        description: 'Standard 50kA breaking capacity with adjustable overload and short circuit trip',
      },
      {
        optionName: 'Schneider NSX Breaker with MicroLogic Electronic Release',
        isDefault: false,
        priceDelta: 24000,
        description: 'MicroLogic electronic trip with integrated ammeter display and ground fault protection',
      },
      {
        optionName: 'Air Circuit Breaker (ACB) 3P/4P Drawout Execution',
        isDefault: false,
        priceDelta: 95000,
        description: 'Heavy duty drawout ACB with motorized spring charging and microprocessor release',
      },
    ],
  },

  // ----------------------------------------------------
  // PLC & AUTOMATION PANELS (PLC)
  // ----------------------------------------------------
  {
    categoryCode: 'PLC',
    dimensionName: 'PLC Controller Make & CPU Model',
    description: 'Main programmable logic controller hardware and touchscreen HMI interface',
    displayOrder: 1,
    options: [
      {
        optionName: 'Conventional Relay Logic Controls (Baseline)',
        isDefault: true,
        priceDelta: 0,
        description: 'Hardwired control relays, timers and indicators without PLC',
      },
      {
        optionName: 'Siemens S7-1200 (CPU 1214C) + 7" KTP Color HMI',
        isDefault: false,
        priceDelta: 55000,
        description: 'Profinet-enabled compact modular PLC with 7-inch color graphic touchscreen',
      },
      {
        optionName: 'Mitsubishi FX5U High-Speed PLC + 7" GOT HMI',
        isDefault: false,
        priceDelta: 48000,
        description: 'Built-in Ethernet, analog inputs and high-speed positioning pulse outputs',
      },
      {
        optionName: 'Schneider Modicon M241 PLC + 7" Magelis HMI',
        isDefault: false,
        priceDelta: 42000,
        description: 'Dual Ethernet ports with embedded web server and CANopen fieldbus support',
      },
      {
        optionName: 'Siemens S7-1500 (CPU 1512C) + 10" Comfort HMI',
        isDefault: false,
        priceDelta: 135000,
        description: 'High-performance CPU for large plants with recipes, alarms and diagnostics',
      },
    ],
  },
  {
    categoryCode: 'PLC',
    dimensionName: 'I/O Signal Channels & Expansion',
    description: 'Digital and analog field sensor inputs and actuator output capacity',
    displayOrder: 2,
    options: [
      {
        optionName: 'Standard 24 I/O Digital Base (Baseline)',
        isDefault: true,
        priceDelta: 0,
        description: '14 Digital Inputs / 10 Relay Outputs on main CPU',
      },
      {
        optionName: '64 I/O High Density Opto-isolated Expansion Rack',
        isDefault: false,
        priceDelta: 28000,
        description: 'Optically isolated terminal rail for extensive field limit switches and solenoids',
      },
      {
        optionName: 'Analog 8-Channel 4-20mA / RTD Temperature Module',
        isDefault: false,
        priceDelta: 22000,
        description: '16-bit analog acquisition for pressure, flow, level and PT100 temperature sensors',
      },
    ],
  },
  {
    categoryCode: 'PLC',
    dimensionName: 'IoT Telemetry & Remote SCADA Communication',
    description: 'Cloud gateway, mobile app access and industrial network connectivity',
    displayOrder: 3,
    options: [
      {
        optionName: 'No Remote Communication (Local HMI Only)',
        isDefault: true,
        priceDelta: 0,
        description: 'Local panel operation without external network link',
      },
      {
        optionName: 'Industrial 4G LTE Cloud IoT Gateway & SCADA',
        isDefault: false,
        priceDelta: 38000,
        description: 'Live mobile dashboard, cloud logging, SMS fault alerts and remote troubleshooting',
      },
      {
        optionName: 'Industrial Managed Ethernet Switch with Fiber Optic Port',
        isDefault: false,
        priceDelta: 24000,
        description: 'Noise-immune optical fiber plant network interface with ring redundancy',
      },
    ],
  },

  // ----------------------------------------------------
  // APFC PANELS (APFC)
  // ----------------------------------------------------
  {
    categoryCode: 'APFC',
    dimensionName: 'Capacitor Switching Technology',
    description: 'Switching device for power factor capacitor banks',
    displayOrder: 1,
    options: [
      {
        optionName: 'Heavy Duty Capacitor Duty Contactors (Baseline)',
        isDefault: true,
        priceDelta: 0,
        description: 'Special contactors with pre-charging damping resistors to suppress inrush spikes',
      },
      {
        optionName: 'Thyristor Switching Electronic Modules (TSC)',
        isDefault: false,
        priceDelta: 68000,
        description: 'Zero-voltage cross electronic switching for rapid welding and press shop loads (<10ms)',
      },
    ],
  },
  {
    categoryCode: 'APFC',
    dimensionName: 'Harmonic Suppression & Reactor Protection',
    description: 'Detuned reactors to prevent resonance and harmonic amplification',
    displayOrder: 2,
    options: [
      {
        optionName: 'Standard MPP Capacitors (Un-detuned Baseline)',
        isDefault: true,
        priceDelta: 0,
        description: 'Standard heavy duty capacitor banks for low harmonic environments',
      },
      {
        optionName: '7% Detuned Copper Harmonic Filter Reactors (189 Hz)',
        isDefault: false,
        priceDelta: 52000,
        description: 'Tuned to suppress 5th and 7th harmonics, prevents dangerous resonance and overheating',
      },
      {
        optionName: '14% Detuned Heavy Duty Harmonic Filter Reactors',
        isDefault: false,
        priceDelta: 72000,
        description: 'For severe 3rd harmonic environments (furnaces, data centers, non-linear loads)',
      },
    ],
  },
  {
    categoryCode: 'APFC',
    dimensionName: 'APFC Controller Relay & Analytics',
    description: 'Automatic power factor controller relay model and telemetry',
    displayOrder: 3,
    options: [
      {
        optionName: '8-Stage Automatic Power Factor Relay (Baseline)',
        isDefault: true,
        priceDelta: 0,
        description: 'Microcontroller relay tracking target cos phi from 0.80 to 1.00',
      },
      {
        optionName: '12-Stage Advanced Microprocessor Controller with Modbus',
        isDefault: false,
        priceDelta: 14500,
        description: 'Intelligent cyclic step wear-leveling, hunting prevention and RS485 port',
      },
      {
        optionName: '16-Stage Dual PF & Total Harmonic Distortion (THD) Analyzer',
        isDefault: false,
        priceDelta: 26000,
        description: 'Real-time V/I harmonic spectrum, capacitor bank temperature and kvar degradation monitoring',
      },
    ],
  },

  // ----------------------------------------------------
  // UNIVERSAL / APPLICABLE TO ALL PANELS (ALL / PCC)
  // ----------------------------------------------------
  {
    categoryCode: 'ALL',
    dimensionName: 'Busbar Conductor Material & Plating',
    description: 'Main and vertical droop busbar conductor grade and joint plating',
    displayOrder: 1,
    options: [
      {
        optionName: 'EC Grade Aluminum with Heat Shrink Sleeve (Baseline)',
        isDefault: true,
        priceDelta: 0,
        description: 'High conductivity electrolytic aluminum (63401 WP) with phase-colored insulation sleeves',
      },
      {
        optionName: 'Electrolytic Copper (99.9% Cu) with Tinned Plating',
        isDefault: false,
        priceDelta: 48000,
        description: 'Lower I2R heat losses, higher current density, electro-tinned contact joints',
      },
      {
        optionName: 'Electrolytic Copper with Silver Plated Contact Joints',
        isDefault: false,
        priceDelta: 78000,
        description: 'Ultra-low contact resistance and corrosion immunity for chemical / marine environments',
      },
    ],
  },
  {
    categoryCode: 'ALL',
    dimensionName: 'Enclosure Protection & Ingress Rating',
    description: 'Sheet metal structure, ingress protection rating, and internal form of segregation',
    displayOrder: 2,
    options: [
      {
        optionName: 'Standard IP54 Form 2B Industrial Enclosure',
        isDefault: true,
        priceDelta: 0,
        description: '2.0mm CRCA steel, CNC pu foam gasket, dust & splash resistant for indoor plants',
      },
      {
        optionName: 'Heavy Duty IP55 Outdoor Weatherproof Canopy',
        isDefault: false,
        priceDelta: 18500,
        description: 'Sloped rain canopy roof, double-door seals, and louvers with stainless steel insect mesh',
      },
      {
        optionName: 'Form 4B Fully Compartmentalized Segregation',
        isDefault: false,
        priceDelta: 34000,
        description: 'Metallic barrier segregation between busbars, functional feeders, and terminal chambers',
      },
      {
        optionName: 'Stainless Steel SS304 Enclosure Execution',
        isDefault: false,
        priceDelta: 72000,
        description: 'Food & pharmaceutical grade 304 stainless steel with mirror or satin finish',
      },
    ],
  },
  {
    categoryCode: 'ALL',
    dimensionName: 'Digital Energy Metering & Power Quality',
    description: 'Instrumentation, energy recording, and electrical safety monitoring',
    displayOrder: 3,
    options: [
      {
        optionName: 'Standard Analog Volt/Ammeter (Baseline)',
        isDefault: true,
        priceDelta: 0,
        description: '96x96mm analog moving iron meters with phase selector switches',
      },
      {
        optionName: 'Digital Multi-Function Meter (MFM) with Modbus RS485',
        isDefault: false,
        priceDelta: 8500,
        description: 'Measures V, A, kW, kVA, PF, Frequency and cumulative kWh energy registers',
      },
      {
        optionName: 'Class 0.2S Revenue Grade Power Quality Analyzer',
        isDefault: false,
        priceDelta: 26000,
        description: 'Harmonics up to 31st order, waveform capture, sag/swell and crest factor logging',
      },
      {
        optionName: 'Earth Leakage Relay (ELR) with Core Balance CT (CBCT)',
        isDefault: false,
        priceDelta: 9500,
        description: 'Adjustable 30mA - 30A leakage protection with trip timer for fire and life safety',
      },
    ],
  },
];

async function main() {
  console.log('Seeding Master Panel Upgradation Variant Templates...');
  let count = 0;

  for (const tpl of SAMPLE_TEMPLATES) {
    const existing = await prisma.variantMasterTemplate.findFirst({
      where: { dimensionName: tpl.dimensionName },
    });

    if (existing) {
      await prisma.variantMasterTemplate.update({
        where: { id: existing.id },
        data: {
          categoryCode: tpl.categoryCode,
          description: tpl.description,
          displayOrder: tpl.displayOrder,
          options: tpl.options,
        },
      });
    } else {
      await prisma.variantMasterTemplate.create({
        data: {
          categoryCode: tpl.categoryCode,
          dimensionName: tpl.dimensionName,
          description: tpl.description,
          displayOrder: tpl.displayOrder,
          options: tpl.options,
        },
      });
    }
    count++;
  }

  console.log(`Successfully seeded ${count} Master Variant Templates!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
