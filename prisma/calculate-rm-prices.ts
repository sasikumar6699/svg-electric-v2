import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to determine realistic purchase price based on category, rating, and brand
function calculatePrice(section: string, desc: string, rating: string, make: string, typeCode: string): number {
  // Brand multiplier
  let brandMult = 1.0;
  if (['Schneider Electric', 'ABB'].includes(make)) brandMult = 1.15;
  else if (['Siemens'].includes(make)) brandMult = 1.12;
  else if (['L&T', 'Danfoss', 'Yaskawa'].includes(make)) brandMult = 1.0;
  else if (['Legrand', 'Pfannenberg', 'Socomec'].includes(make)) brandMult = 0.95;
  else if (['C&S Electric', 'Hager', 'Delta', 'Fuji Electric'].includes(make)) brandMult = 0.85;
  else if (['Generic', 'Local'].includes(make)) brandMult = 0.70;

  // 1. MCB
  if (section === 'Protection / MCB') {
    const poles = rating.includes('4P') ? 4 : rating.includes('3P') ? 3 : rating.includes('2P') ? 2 : 1;
    const amps = parseInt(rating) || 16;
    let base = 180;
    if (amps <= 10) base = 190;
    else if (amps <= 25) base = 210;
    else if (amps <= 40) base = 240;
    else if (amps <= 63) base = 320;
    else if (amps <= 100) base = 850;
    else base = 1200;
    return Math.round(base * poles * (poles === 1 ? 1 : poles === 2 ? 1.8 : poles === 3 ? 2.7 : 3.5) * brandMult);
  }

  // 2. MCCB
  if (section === 'Protection / MCCB') {
    const poles = rating.includes('4P') ? 4 : rating.includes('3P') ? 3 : 2;
    const amps = parseInt(rating) || 100;
    let base = 3500;
    if (amps <= 63) base = 3200;
    else if (amps <= 125) base = 5200;
    else if (amps <= 160) base = 7500;
    else if (amps <= 250) base = 14000;
    else if (amps <= 400) base = 24000;
    else if (amps <= 630) base = 42000;
    else if (amps <= 1000) base = 75000;
    else if (amps <= 1250) base = 98000;
    else base = 145000;
    const poleFactor = poles === 2 ? 0.75 : poles === 3 ? 1.0 : 1.35;
    return Math.round(base * poleFactor * brandMult);
  }

  // 3. Motor Control Contactors
  if (section === 'Motor Control') {
    const amps = parseInt(rating) || 18;
    let base = 950;
    if (amps <= 12) base = 950;
    else if (amps <= 18) base = 1350;
    else if (amps <= 32) base = 2400;
    else if (amps <= 50) base = 3800;
    else if (amps <= 80) base = 6500;
    else if (amps <= 115) base = 12500;
    else if (amps <= 185) base = 19500;
    else if (amps <= 265) base = 32000;
    else base = 52000;
    return Math.round(base * brandMult);
  }

  // 4. Motor Protection: OLR & MPCB
  if (section === 'Motor Protection') {
    if (desc.includes('MPCB')) {
      const amps = parseFloat(rating) || 10;
      let base = 3200;
      if (amps <= 4) base = 2800;
      else if (amps <= 16) base = 3400;
      else base = 4800;
      return Math.round(base * brandMult);
    } else {
      // Overload Relay
      const amps = parseFloat(rating) || 10;
      let base = 1200;
      if (amps <= 10) base = 1200;
      else if (amps <= 32) base = 1800;
      else if (amps <= 80) base = 3200;
      else base = 6500;
      return Math.round(base * brandMult);
    }
  }

  // 5. Protection / Fuses
  if (section === 'Protection / Fuses') {
    if (desc.includes('Holder')) {
      const poles = rating.includes('3P') ? 3 : rating.includes('2P') ? 2 : 1;
      const amps = parseInt(rating) || 32;
      let base = 180;
      if (amps <= 32) base = 180;
      else if (amps <= 63) base = 350;
      else if (amps <= 160) base = 850;
      else if (amps <= 250) base = 1450;
      else base = 2200;
      return Math.round(base * (poles === 1 ? 1 : poles === 2 ? 1.8 : 2.5) * brandMult);
    } else {
      // HRC Fuse Link
      const amps = parseInt(rating) || 32;
      let base = 140;
      if (amps <= 32) base = 140;
      else if (amps <= 63) base = 210;
      else if (amps <= 160) base = 420;
      else if (amps <= 250) base = 750;
      else if (amps <= 400) base = 1200;
      else base = 1850;
      return Math.round(base * brandMult);
    }
  }

  // 6. Control & Indication
  if (section === 'Control & Indication') {
    if (desc.includes('Lamp')) return Math.round(140 * brandMult);
    if (desc.includes('Push Button')) return Math.round(260 * brandMult);
    if (desc.includes('Emergency')) return Math.round(520 * brandMult);
    if (desc.includes('Selector')) return Math.round(420 * brandMult);
    if (desc.includes('Buzzer') || desc.includes('Horn')) return Math.round(650 * brandMult);
    return Math.round(280 * brandMult);
  }

  // 7. Control Relays
  if (section === 'Control Relays') {
    if (desc.includes('Module')) {
      const amps = parseInt(rating) || 5;
      return Math.round((550 + amps * 35) * brandMult);
    }
    const co = rating.includes('4CO') ? 4 : 2;
    return Math.round((420 + co * 120) * brandMult);
  }

  // 8. Timers & Controllers
  if (section === 'Timers & Controllers') {
    let base = 1850;
    if (rating.includes('Multifunction')) base = 2950;
    else if (rating.includes('Star-Delta')) base = 2450;
    return Math.round(base * brandMult);
  }

  // 9. Phase / Protection Relays
  if (section === 'Phase / Protection Relays') {
    let base = 2200;
    if (desc.includes('Over/Under')) base = 2850;
    if (desc.includes('Single Phase')) base = 1950;
    return Math.round(base * brandMult);
  }

  // 10. Power Supply
  if (section === 'Power Supply') {
    if (desc.includes('SMPS')) {
      const amps = parseFloat(rating.replace('24VDC', '')) || 5;
      let base = 1200;
      if (amps <= 2.5) base = 1450;
      else if (amps <= 5) base = 2250;
      else if (amps <= 10) base = 3950;
      else if (amps <= 20) base = 7500;
      else base = 13500;
      return Math.round(base * brandMult);
    } else {
      // Transformer
      const va = parseInt(rating.match(/(\d+)VA/)?.[1] || '100');
      let base = 1100;
      if (va <= 100) base = 1450;
      else if (va <= 250) base = 2400;
      else if (va <= 630) base = 4800;
      else if (va <= 1000) base = 7500;
      else base = 14500;
      return Math.round(base * brandMult);
    }
  }

  // 11. Metering & CT
  if (section === 'Metering') {
    if (desc.includes('Multifunction')) return Math.round(8500 * brandMult);
    if (desc.includes('Energy')) return Math.round(4500 * brandMult);
    if (desc.includes('Power Factor')) return Math.round(5200 * brandMult);
    return Math.round(1850 * brandMult);
  }
  if (section === 'Metering / CT') {
    const pri = parseInt(rating) || 100;
    let base = 650;
    if (pri <= 100) base = 650;
    else if (pri <= 400) base = 950;
    else if (pri <= 1000) base = 1650;
    else if (pri <= 2000) base = 2850;
    else base = 4200;
    return Math.round(base * brandMult);
  }

  // 12. Busbars
  if (section === 'Busbar / Power Distribution') {
    if (desc.includes('Copper')) return 960; // per Kg
    if (desc.includes('Aluminium')) return 380; // per Kg
    return 550;
  }
  if (section === 'Busbar Accessories') {
    if (desc.includes('Insulator')) {
      const amps = parseInt(rating) || 250;
      const poles = rating.includes('4P') ? 4 : rating.includes('3P') ? 3 : rating.includes('2P') ? 2 : 1;
      let base = 450;
      if (amps <= 400) base = 550;
      else if (amps <= 800) base = 950;
      else if (amps <= 1600) base = 1850;
      else base = 3200;
      return Math.round(base * poles * 0.7);
    }
    if (desc.includes('Sleeve')) return 65;
    if (desc.includes('Joint')) return 350;
    return 250;
  }

  // 13. Enclosure & Fabrication
  if (section === 'Enclosure / Fabrication') {
    if (desc.includes('SS304')) return 260; // per kg
    if (desc.includes('GI')) return 95; // per kg
    return 84; // CRCA per kg
  }
  if (section === 'Enclosure Accessories') {
    if (desc.includes('Lock')) return Math.round(350 * brandMult);
    if (desc.includes('Hinge')) return Math.round(180 * brandMult);
    if (desc.includes('Plinth')) return 1450;
    if (desc.includes('Mounting')) return 1850;
    return 280;
  }

  // 14. Cable Management
  if (section === 'Cable Management') {
    if (desc.includes('Duct')) {
      const w = parseInt(rating) || 40;
      return Math.round(85 + w * 2.2);
    }
    if (desc.includes('DIN')) return 160;
    if (desc.includes('Tie')) return 2.5;
    if (desc.includes('Conduit')) return 48;
    if (desc.includes('Wrap')) return 32;
    return 45;
  }

  // 15. Terminal Blocks
  if (section === 'Terminal Blocks') {
    const sq = parseFloat(rating) || 2.5;
    let base = 18;
    if (sq <= 4) base = 18;
    else if (sq <= 10) base = 35;
    else if (sq <= 25) base = 75;
    else if (sq <= 50) base = 145;
    else if (sq <= 95) base = 260;
    else base = 420;
    if (desc.includes('Earth')) base *= 1.4;
    if (desc.includes('Fuse') || desc.includes('Disconnect')) base *= 2.2;
    return Math.round(base * brandMult);
  }
  if (section === 'Terminal Accessories') {
    return 14;
  }

  // 16. Wiring & Power Cables
  if (section === 'Wiring') {
    const sq = parseFloat(rating) || 1.5;
    let base = 24;
    if (sq <= 0.75) base = 18;
    else if (sq <= 1.5) base = 32;
    else if (sq <= 2.5) base = 52;
    else if (sq <= 4) base = 82;
    else base = 125;
    if (rating.includes('FRLS')) base *= 1.15;
    return Math.round(base);
  }
  if (section === 'Power Cable') {
    if (desc.includes('Multi-core')) {
      const cores = parseInt(rating.match(/(\d+)C/)?.[1] || '4');
      const sq = parseFloat(rating.match(/x\s*([\d\.]+)/)?.[1] || '1.5');
      return Math.round(cores * (sq * 24 + 18) * 1.15);
    }
    const sq = parseFloat(rating) || 16;
    let base = 55;
    if (sq <= 6) base = 125;
    else if (sq <= 16) base = 310;
    else if (sq <= 35) base = 680;
    else if (sq <= 70) base = 1350;
    else if (sq <= 120) base = 2250;
    else if (sq <= 185) base = 3450;
    else if (sq <= 240) base = 4650;
    else base = 5900;
    return Math.round(base);
  }
  if (section === 'Instrumentation') {
    const pairs = parseInt(rating.match(/(\d+)\s*Pair/)?.[1] || '1');
    return Math.round(pairs * 75 * 1.1);
  }

  // 17. Glands & Lugs
  if (section === 'Cable Glands') {
    const mm = parseInt(rating.replace('M', '')) || 25;
    let base = 95;
    if (mm <= 20) base = 95;
    else if (mm <= 32) base = 185;
    else if (mm <= 50) base = 480;
    else if (mm <= 75) base = 1150;
    else base = 2450;
    if (desc.includes('Double')) base *= 1.85;
    return Math.round(base);
  }
  if (section === 'Cable Lugs') {
    const sq = parseFloat(rating) || 16;
    let base = 8;
    if (sq <= 6) base = 8;
    else if (sq <= 25) base = 24;
    else if (sq <= 70) base = 65;
    else if (sq <= 150) base = 145;
    else if (sq <= 240) base = 220;
    else base = 340;
    if (desc.includes('Aluminium')) base *= 0.6;
    return Math.round(base);
  }
  if (section === 'Cable Accessories') {
    return 45;
  }

  // 18. PLC & HMI
  if (section === 'PLC CPU') {
    let base = 28000;
    if (rating.includes('Compact')) base = 24000;
    else if (rating.includes('Standard')) base = 45000;
    else if (rating.includes('Advanced')) base = 75000;
    else if (rating.includes('Safety')) base = 115000;
    return Math.round(base * brandMult);
  }
  if (section === 'PLC I/O') {
    let base = 8500;
    if (desc.includes('Digital Input')) {
      const pts = parseInt(rating) || 16;
      base = pts === 8 ? 6500 : pts === 16 ? 9500 : 16500;
    } else if (desc.includes('Digital Output')) {
      const pts = parseInt(rating) || 16;
      base = pts === 8 ? 7500 : pts === 16 ? 11500 : 18500;
    } else if (desc.includes('Analog Input')) {
      const pts = parseInt(rating) || 4;
      base = pts === 2 ? 11000 : pts === 4 ? 18500 : 28500;
    } else if (desc.includes('Analog Output')) {
      const pts = parseInt(rating) || 4;
      base = pts === 2 ? 12500 : pts === 4 ? 21000 : 34000;
    }
    return Math.round(base * brandMult);
  }
  if (section === 'PLC Communication') {
    let base = 14500;
    if (rating.includes('Profinet') || rating.includes('Ethernet')) base = 26000;
    return Math.round(base * brandMult);
  }
  if (section === 'HMI') {
    const inch = parseFloat(rating) || 7;
    let base = 18000;
    if (inch <= 4.3) base = 14500;
    else if (inch <= 7) base = 26000;
    else if (inch <= 10) base = 48000;
    else if (inch <= 15) base = 85000;
    else base = 125000;
    return Math.round(base * brandMult);
  }
  if (section === 'Industrial Networking') {
    const ports = parseInt(rating) || 8;
    const managed = rating.includes('Managed');
    let base = managed ? 18000 : 7500;
    if (ports >= 16) base *= 1.8;
    return Math.round(base * brandMult);
  }
  if (section === 'Safety') {
    if (desc.includes('Controller')) return Math.round(38000 * brandMult);
    return Math.round(12500 * brandMult);
  }

  // 19. VFD / AC Drive & Accessories
  if (section === 'VFD / AC Drive') {
    const kw = parseFloat(rating) || 11;
    let base = 18500;
    if (kw <= 2.2) base = 16500;
    else if (kw <= 5.5) base = 28000;
    else if (kw <= 11) base = 45000;
    else if (kw <= 22) base = 75000;
    else if (kw <= 45) base = 145000;
    else if (kw <= 75) base = 235000;
    else if (kw <= 110) base = 345000;
    else if (kw <= 160) base = 490000;
    else if (kw <= 250) base = 780000;
    else if (kw <= 355) base = 1150000;
    else base = 1650000;
    return Math.round(base * brandMult);
  }
  if (section === 'VFD Accessories') {
    const kw = parseFloat(rating) || 11;
    let base = 4500;
    if (desc.includes('Line Reactor') || desc.includes('Output Reactor')) {
      base = kw <= 11 ? 5500 : kw <= 37 ? 12500 : kw <= 90 ? 28000 : 58000;
    } else if (desc.includes('Filter')) {
      base = kw <= 11 ? 12000 : kw <= 45 ? 26000 : 54000;
    } else if (desc.includes('Resistor')) {
      base = kw <= 11 ? 2800 : kw <= 45 ? 7500 : 16500;
    }
    return Math.round(base * brandMult);
  }
  if (section === 'Soft Starter') {
    const kw = parseFloat(rating) || 22;
    let base = 22000;
    if (kw <= 15) base = 22000;
    else if (kw <= 37) base = 42000;
    else if (kw <= 75) base = 78000;
    else if (kw <= 132) base = 135000;
    else base = 210000;
    return Math.round(base * brandMult);
  }

  // 20. APFC
  if (section === 'APFC') {
    if (desc.includes('Capacitor') && !desc.includes('Contactor') && !desc.includes('Resistor')) {
      const kvar = parseFloat(rating) || 10;
      return Math.round(kvar * 320 * brandMult);
    }
    if (desc.includes('Contactor')) {
      const kvar = parseFloat(rating) || 10;
      return Math.round((1800 + kvar * 95) * brandMult);
    }
    if (desc.includes('Reactor')) {
      const kvar = parseFloat(rating) || 10;
      return Math.round((4500 + kvar * 420) * brandMult);
    }
    if (desc.includes('Relay')) {
      const steps = parseInt(rating) || 6;
      return Math.round((6500 + steps * 950) * brandMult);
    }
    if (desc.includes('Discharge')) return 350;
    return 1800;
  }

  // 21. AMF / Changeover
  if (section === 'AMF / Changeover') {
    if (desc.includes('Motorized')) {
      const amps = parseInt(rating) || 250;
      const poles = rating.includes('4P') ? 4 : 3;
      let base = 18500;
      if (amps <= 160) base = 18500;
      else if (amps <= 250) base = 28000;
      else if (amps <= 400) base = 48000;
      else if (amps <= 630) base = 78000;
      else if (amps <= 1000) base = 125000;
      else base = 165000;
      return Math.round(base * (poles === 3 ? 1 : 1.35) * brandMult);
    }
    if (desc.includes('ATS')) {
      const amps = parseInt(rating) || 250;
      const poles = rating.includes('4P') ? 4 : 3;
      let base = 24000;
      if (amps <= 100) base = 24000;
      else if (amps <= 250) base = 42000;
      else if (amps <= 630) base = 85000;
      else if (amps <= 1000) base = 145000;
      else base = 230000;
      return Math.round(base * (poles === 3 ? 1 : 1.35) * brandMult);
    }
    if (desc.includes('Controller')) {
      let base = 14500;
      if (rating.includes('Standard')) base = 24000;
      else if (rating.includes('Advanced')) base = 36000;
      return Math.round(base * brandMult);
    }
    if (desc.includes('Charger')) {
      const amps = parseInt(rating.match(/(\d+)A/)?.[1] || '5');
      const v = rating.includes('24V') ? 24 : 12;
      return Math.round((2800 + amps * 380 + (v === 24 ? 1200 : 0)) * brandMult);
    }
    return 4500;
  }

  // 22. PCC / ACB
  if (section === 'PCC / ACB') {
    if (desc.includes('Trip Unit')) return Math.round(24000 * brandMult);
    if (desc.includes('Shunt') || desc.includes('Release')) return Math.round(4800 * brandMult);
    if (desc.includes('Motor Mechanism')) return Math.round(18500 * brandMult);
    // ACB
    const amps = parseInt(rating) || 1250;
    const poles = rating.includes('4P') ? 4 : 3;
    let base = 85000;
    if (amps <= 800) base = 78000;
    else if (amps <= 1250) base = 115000;
    else if (amps <= 1600) base = 145000;
    else if (amps <= 2500) base = 245000;
    else if (amps <= 3200) base = 320000;
    else if (amps <= 4000) base = 440000;
    else base = 580000;
    return Math.round(base * (poles === 3 ? 1 : 1.35) * brandMult);
  }

  // 23. Surge Protection & Panel Cooling
  if (section === 'Surge Protection') {
    let base = 3800;
    if (desc.includes('1+2')) base = 8500;
    const poles = rating.includes('4P') || rating.includes('3P+N') ? 4 : 2;
    return Math.round(base * (poles === 4 ? 1.6 : 1.0) * brandMult);
  }
  if (section === 'Panel Cooling') {
    if (desc.includes('Fan')) {
      const cfm = parseInt(rating) || 100;
      let base = 1200 + cfm * 14;
      if (desc.includes('Filter')) base *= 1.3;
      return Math.round(base * brandMult);
    }
    if (desc.includes('Heater')) {
      const w = parseInt(rating) || 100;
      return Math.round((850 + w * 3.5) * brandMult);
    }
    if (desc.includes('Thermostat') || desc.includes('Hygrostat')) return Math.round(1650 * brandMult);
    return 1200;
  }

  // 24. Hardware & Consumables
  if (['Hardware', 'Identification', 'Consumables', 'Fabrication Material'].includes(section)) {
    if (desc.includes('Disc')) return Math.round(95 * brandMult);
    if (desc.includes('Electrode')) return 180;
    if (desc.includes('Paint') || desc.includes('Primer') || desc.includes('Thinner')) return 420;
    if (desc.includes('Powder')) return 65;
    if (desc.includes('Tape')) return 35;
    if (desc.includes('Bolt') || desc.includes('Screw')) return 8;
    if (desc.includes('Rivet') || desc.includes('Marker')) return 3;
    return 45;
  }

  // 25. Isolators / Switches
  if (section === 'Isolators / Switches') {
    const amps = parseInt(rating) || 63;
    const poles = rating.includes('4P') ? 4 : rating.includes('3P') ? 3 : 2;
    let base = 1450;
    if (desc.includes('SFU')) base = 2800;
    if (desc.includes('Changeover')) base = 3400;

    if (amps <= 32) base *= 1.0;
    else if (amps <= 63) base *= 1.6;
    else if (amps <= 125) base *= 2.8;
    else if (amps <= 250) base *= 5.5;
    else if (amps <= 400) base *= 9.5;
    else base *= 14.0;

    const pFact = poles === 2 ? 0.75 : poles === 3 ? 1.0 : 1.35;
    return Math.round(base * pFact * brandMult);
  }

  return 500;
}

export { calculatePrice };
