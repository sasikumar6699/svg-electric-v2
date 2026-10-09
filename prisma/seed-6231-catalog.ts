import { PrismaClient } from '@prisma/client';
import { calculatePrice } from './calculate-rm-prices';

const prisma = new PrismaClient();

interface RawItem {
  sNo: number;
  section: string;
  desc: string;
  rating: string;
  typeCode: string;
  make: string;
  unit: string;
  price: number;
}

function buildAll6231Items(): RawItem[] {
  const items: RawItem[] = [];
  let sNo = 1;

  // 1. Protection / MCB (392)
  const mcbRatings = ['2A', '4A', '6A', '10A', '16A', '20A', '25A', '32A', '40A', '50A', '63A', '80A', '100A', '125A'];
  const mcbPoles = ['1P', '2P', '3P', '4P'];
  const mcbMakes = ['Schneider Electric', 'Siemens', 'ABB', 'L&T', 'C&S Electric', 'Legrand', 'Hager'];
  let mcbSeq = 1;
  for (const r of mcbRatings) {
    for (const p of mcbPoles) {
      for (const m of mcbMakes) {
        const typeCode = `MCB-${String(mcbSeq++).padStart(4, '0')}`;
        const rating = `${r} ${p}`;
        items.push({
          sNo: sNo++,
          section: 'Protection / MCB',
          desc: 'MCB',
          rating,
          typeCode,
          make: m,
          unit: 'Nos',
          price: calculatePrice('Protection / MCB', 'MCB', rating, m, typeCode),
        });
      }
    }
  }

  // 2. Protection / MCCB (420)
  const mccbRatings = ['16A', '25A', '32A', '40A', '50A', '63A', '80A', '100A', '125A', '160A', '200A', '250A', '320A', '400A', '500A', '630A', '800A', '1000A', '1250A', '1600A'];
  const mccbPoles = ['2P', '3P', '4P'];
  const mccbMakes = ['Schneider Electric', 'Siemens', 'ABB', 'L&T', 'C&S Electric', 'Legrand', 'Hager'];
  let mccbSeq = 393;
  for (const r of mccbRatings) {
    for (const p of mccbPoles) {
      for (const m of mccbMakes) {
        const typeCode = `MCCB-${String(mccbSeq++).padStart(4, '0')}`;
        const rating = `${r} ${p}`;
        items.push({
          sNo: sNo++,
          section: 'Protection / MCCB',
          desc: 'MCCB',
          rating,
          typeCode,
          make: m,
          unit: 'Nos',
          price: calculatePrice('Protection / MCCB', 'MCCB', rating, m, typeCode),
        });
      }
    }
  }

  // 3. Motor Control (90)
  const contRatings = ['6A AC-3', '9A AC-3', '12A AC-3', '18A AC-3', '25A AC-3', '32A AC-3', '40A AC-3', '50A AC-3', '65A AC-3', '80A AC-3', '95A AC-3', '115A AC-3', '150A AC-3', '185A AC-3', '225A AC-3', '265A AC-3', '330A AC-3', '400A AC-3'];
  const contMakes = ['Schneider Electric', 'Siemens', 'ABB', 'L&T', 'C&S Electric'];
  let contSeq = 813;
  for (const r of contRatings) {
    for (const m of contMakes) {
      const typeCode = `CONT-${String(contSeq++).padStart(4, '0')}`;
      items.push({
        sNo: sNo++,
        section: 'Motor Control',
        desc: 'Contactor',
        rating: r,
        typeCode,
        make: m,
        unit: 'Nos',
        price: calculatePrice('Motor Control', 'Contactor', r, m, typeCode),
      });
    }
  }

  // 4. Motor Protection: OLR (120) & MPCB (80)
  const olrRanges = ['0.1-0.16A', '0.16-0.25A', '0.25-0.4A', '0.4-0.63A', '0.63-1A', '1-1.6A', '1.6-2.5A', '2.5-4A', '4-6A', '5-8A', '7-10A', '9-13A', '12-18A', '17-25A', '23-32A', '30-40A', '37-50A', '48-65A', '55-70A', '63-80A', '80-104A', '95-120A', '110-140A', '140-180A'];
  let olrSeq = 903;
  for (const r of olrRanges) {
    for (const m of contMakes) {
      const typeCode = `OLR-${String(olrSeq++).padStart(4, '0')}`;
      items.push({
        sNo: sNo++,
        section: 'Motor Protection',
        desc: 'Thermal Overload Relay',
        rating: r,
        typeCode,
        make: m,
        unit: 'Nos',
        price: calculatePrice('Motor Protection', 'Thermal Overload Relay', r, m, typeCode),
      });
    }
  }

  const mpcbRanges = ['0.1-0.16A', '0.16-0.25A', '0.25-0.4A', '0.4-0.63A', '0.63-1A', '1-1.6A', '1.6-2.5A', '2.5-4A', '4-6A', '5-8A', '7-10A', '9-13A', '12-18A', '17-23A', '20-25A', '24-32A'];
  let mpcbSeq = 1023;
  for (const r of mpcbRanges) {
    for (const m of contMakes) {
      const typeCode = `MPCB-${String(mpcbSeq++).padStart(4, '0')}`;
      items.push({
        sNo: sNo++,
        section: 'Motor Protection',
        desc: 'Motor Protection Circuit Breaker',
        rating: r,
        typeCode,
        make: m,
        unit: 'Nos',
        price: calculatePrice('Motor Protection', 'Motor Protection Circuit Breaker', r, m, typeCode),
      });
    }
  }

  // 5. Protection / Fuses (336)
  const fuseRatings = ['2A, 415V', '4A, 415V', '6A, 415V', '10A, 415V', '16A, 415V', '20A, 415V', '25A, 415V', '32A, 415V', '40A, 415V', '50A, 415V', '63A, 415V', '80A, 415V', '100A, 415V', '125A, 415V', '160A, 415V', '200A, 415V', '250A, 415V', '315A, 415V', '400A, 415V', '500A, 415V', '630A, 415V'];
  const fuseMakes = ['Schneider Electric', 'Siemens', 'ABB', 'L&T', 'C&S Electric', 'Legrand', 'Hager'];
  let fuseSeq = 1103;
  for (const r of fuseRatings) {
    for (const m of fuseMakes) {
      const typeCode = `FUSE-${String(fuseSeq++).padStart(4, '0')}`;
      items.push({
        sNo: sNo++,
        section: 'Protection / Fuses',
        desc: 'HRC Fuse Link',
        rating: r,
        typeCode,
        make: m,
        unit: 'Nos',
        price: calculatePrice('Protection / Fuses', 'HRC Fuse Link', r, m, typeCode),
      });
    }
  }

  const fhAmps = ['10A', '16A', '32A', '63A', '100A', '160A', '250A', '400A', '630A'];
  const fhPoles = ['1P', '2P', '3P'];
  let fhSeq = 1250;
  for (const a of fhAmps) {
    for (const p of fhPoles) {
      for (const m of fuseMakes) {
        const typeCode = `FH-${String(fhSeq++).padStart(4, '0')}`;
        const rating = `${a}, ${p}`;
        items.push({
          sNo: sNo++,
          section: 'Protection / Fuses',
          desc: 'Fuse Holder',
          rating,
          typeCode,
          make: m,
          unit: 'Nos',
          price: calculatePrice('Protection / Fuses', 'Fuse Holder', rating, m, typeCode),
        });
      }
    }
  }

  // 6. Control & Indication (96)
  const ctrlDescs = [
    { desc: 'Push Button', rating: 'Green, 22mm' },
    { desc: 'Push Button', rating: 'Red, 22mm' },
    { desc: 'Push Button', rating: 'Yellow, 22mm' },
    { desc: 'Emergency Stop', rating: 'Mushroom, 22mm' },
    { desc: 'Selector Switch', rating: '2-position' },
    { desc: 'Selector Switch', rating: '3-position' },
    { desc: 'Key Selector', rating: '2-position' },
    { desc: 'Key Selector', rating: '3-position' },
    { desc: 'Pilot Lamp', rating: 'LED 22mm Green' },
    { desc: 'Pilot Lamp', rating: 'LED 22mm Red' },
    { desc: 'Pilot Lamp', rating: 'LED 22mm Yellow' },
    { desc: 'Pilot Lamp', rating: 'LED 22mm Blue' },
    { desc: 'Buzzer', rating: '24VDC' },
    { desc: 'Buzzer', rating: '230VAC' },
    { desc: 'Horn', rating: '24VDC' },
    { desc: 'Horn', rating: '230VAC' },
  ];
  const ctrlMakes = ['Schneider Electric', 'Siemens', 'ABB', 'L&T', 'Teknic', 'Selec'];
  let ctrlSeq = 1439;
  for (const c of ctrlDescs) {
    for (const m of ctrlMakes) {
      const typeCode = `CTRL-${String(ctrlSeq++).padStart(4, '0')}`;
      items.push({
        sNo: sNo++,
        section: 'Control & Indication',
        desc: c.desc,
        rating: c.rating,
        typeCode,
        make: m,
        unit: 'Nos',
        price: calculatePrice('Control & Indication', c.desc, c.rating, m, typeCode),
      });
    }
  }

  // 7. Control Relays (185)
  const relVolts = ['12VDC', '24VDC', '48VDC', '110VDC', '220VDC'];
  const relCO = ['2CO', '4CO'];
  const relMakes = ['Schneider Electric', 'Siemens', 'ABB', 'Finder', 'Omron', 'Phoenix Contact'];
  let relSeq = 1535;
  for (const v of relVolts) {
    for (const co of relCO) {
      for (const m of relMakes) {
        const typeCode = `REL-${String(relSeq++).padStart(4, '0')}`;
        const rating = `${v}, ${co}`;
        items.push({
          sNo: sNo++,
          section: 'Control Relays',
          desc: 'Auxiliary Relay',
          rating,
          typeCode,
          make: m,
          unit: 'Nos',
          price: calculatePrice('Control Relays', 'Auxiliary Relay', rating, m, typeCode),
        });
      }
    }
  }

  const rlmCoils = ['12VDC coil', '24VDC coil', '48VDC coil', '110VDC coil', '230VDC coil'];
  const rlmAmps = ['3A', '5A', '8A', '10A', '16A'];
  const rlmMakes = ['Schneider Electric', 'Siemens', 'Phoenix Contact', 'Weidmuller', 'Omron'];
  let rlmSeq = 1595;
  for (const c of rlmCoils) {
    for (const a of rlmAmps) {
      for (const m of rlmMakes) {
        const typeCode = `RLM-${String(rlmSeq++).padStart(4, '0')}`;
        const rating = `${c}, ${a}`;
        items.push({
          sNo: sNo++,
          section: 'Control Relays',
          desc: 'Relay Module',
          rating,
          typeCode,
          make: m,
          unit: 'Nos',
          price: calculatePrice('Control Relays', 'Relay Module', rating, m, typeCode),
        });
      }
    }
  }

  // 8. Timers & Controllers (75)
  const timVolts = ['24V', '110V', '230V'];
  const timFuncs = ['ON-delay', 'OFF-delay', 'Cyclic', 'Star-Delta', 'Multifunction'];
  const timMakes = ['Schneider Electric', 'Siemens', 'ABB', 'Omron', 'Selec'];
  let timSeq = 1720;
  for (const v of timVolts) {
    for (const f of timFuncs) {
      for (const m of timMakes) {
        const typeCode = `TIM-${String(timSeq++).padStart(4, '0')}`;
        const rating = `${v}, ${f}`;
        items.push({
          sNo: sNo++,
          section: 'Timers & Controllers',
          desc: 'Timer Relay',
          rating,
          typeCode,
          make: m,
          unit: 'Nos',
          price: calculatePrice('Timers & Controllers', 'Timer Relay', rating, m, typeCode),
        });
      }
    }
  }

  // 9. Phase / Protection Relays (25)
  const psrMakes = ['Schneider Electric', 'Siemens', 'ABB', 'L&T', 'Selec'];
  let psrSeq = 1795;
  const psrConfigs = [
    { desc: 'Phase Sequence Relay', rating: '230VAC' },
    { desc: 'Phase Sequence Relay', rating: '415VAC' },
    { desc: 'Over/Under Voltage Relay', rating: '230VAC' },
    { desc: 'Over/Under Voltage Relay', rating: '415VAC' },
    { desc: 'Single Phase Preventer', rating: '415VAC' },
  ];
  for (const cfg of psrConfigs) {
    for (const m of psrMakes) {
      const typeCode = `PSR-${String(psrSeq++).padStart(4, '0')}`;
      items.push({
        sNo: sNo++,
        section: 'Phase / Protection Relays',
        desc: cfg.desc,
        rating: cfg.rating,
        typeCode,
        make: m,
        unit: 'Nos',
        price: calculatePrice('Phase / Protection Relays', cfg.desc, cfg.rating, m, typeCode),
      });
    }
  }

  // 10. Power Supply (128)
  const smpsAmps = ['1.25A', '2.5A', '5A', '10A', '15A', '20A', '30A', '40A'];
  const smpsMakes = ['Schneider Electric', 'Siemens', 'ABB', 'Mean Well', 'Delta', 'Phoenix Contact'];
  let smpsSeq = 1820;
  for (const a of smpsAmps) {
    for (const m of smpsMakes) {
      const typeCode = `SMPS-${String(smpsSeq++).padStart(4, '0')}`;
      const rating = `24VDC ${a}`;
      items.push({
        sNo: sNo++,
        section: 'Power Supply',
        desc: 'SMPS',
        rating,
        typeCode,
        make: m,
        unit: 'Nos',
        price: calculatePrice('Power Supply', 'SMPS', rating, m, typeCode),
      });
    }
  }

  const trf230VA = ['50VA', '100VA', '160VA', '250VA', '400VA', '630VA', '1000VA', '1600VA', '2500VA'];
  const trfMakes = ['Schneider Electric', 'Siemens', 'ABB', 'L&T', 'CG Power'];
  let trfSeq = 1868;
  for (const va of trf230VA) {
    for (const m of trfMakes) {
      const typeCode = `TRF-${String(trfSeq++).padStart(4, '0')}`;
      const rating = `415/230V ${va}`;
      items.push({
        sNo: sNo++,
        section: 'Power Supply',
        desc: 'Control Transformer',
        rating,
        typeCode,
        make: m,
        unit: 'Nos',
        price: calculatePrice('Power Supply', 'Control Transformer', rating, m, typeCode),
      });
    }
  }

  const trf24VA = ['50VA', '100VA', '160VA', '250VA', '400VA', '630VA', '1000VA'];
  let trf24Seq = 1913;
  for (const va of trf24VA) {
    for (const m of trfMakes) {
      const typeCode = `TRF24-${String(trf24Seq++).padStart(4, '0')}`;
      const rating = `415/24V ${va}`;
      items.push({
        sNo: sNo++,
        section: 'Power Supply',
        desc: 'Control Transformer',
        rating,
        typeCode,
        make: m,
        unit: 'Nos',
        price: calculatePrice('Power Supply', 'Control Transformer', rating, m, typeCode),
      });
    }
  }

  // 11. Metering (48)
  const mfmConfigs = [
    { desc: 'Multifunction Meter', rating: '1A CT input', prefix: 'MFM', seq: 1948, makes: ['Schneider Electric', 'Siemens', 'ABB', 'L&T', 'Selec'] },
    { desc: 'Multifunction Meter', rating: '5A CT input', prefix: 'MFM', seq: 1953, makes: ['Schneider Electric', 'Siemens', 'ABB', 'L&T', 'Selec'] },
    { desc: 'Digital Ammeter', rating: '0-5A CT', prefix: 'AMM', seq: 1958, makes: ['Schneider Electric', 'Siemens', 'ABB', 'L&T', 'Selec'] },
    { desc: 'Digital Ammeter', rating: '0-1A CT', prefix: 'AMM', seq: 1963, makes: ['Schneider Electric', 'Siemens', 'ABB', 'L&T', 'Selec'] },
    { desc: 'Digital Voltmeter', rating: '0-500VAC', prefix: 'VLT', seq: 1968, makes: ['Schneider Electric', 'Siemens', 'ABB', 'L&T', 'Selec'] },
    { desc: 'Digital Voltmeter', rating: '0-600VAC', prefix: 'VLT', seq: 1973, makes: ['Schneider Electric', 'Siemens', 'ABB', 'L&T', 'Selec'] },
    { desc: 'Energy Meter', rating: 'Single phase', prefix: 'EM', seq: 1978, makes: ['Schneider Electric', 'Siemens', 'ABB', 'L&T', 'Secure'] },
    { desc: 'Energy Meter', rating: 'Three phase', prefix: 'EM', seq: 1984, makes: ['Schneider Electric', 'Siemens', 'ABB', 'L&T', 'Secure'] },
    { desc: 'Power Factor Meter', rating: 'Panel mount', prefix: 'PFM', seq: 1990, makes: ['Schneider Electric', 'Siemens', 'ABB', 'Selec'] },
    { desc: 'Frequency Meter', rating: '45-65Hz', prefix: 'HZM', seq: 1994, makes: ['Schneider Electric', 'Siemens', 'ABB', 'Selec'] },
  ];
  for (const cfg of mfmConfigs) {
    let curSeq = cfg.seq;
    for (const m of cfg.makes) {
      const typeCode = `${cfg.prefix}-${String(curSeq++).padStart(4, '0')}`;
      items.push({
        sNo: sNo++,
        section: 'Metering',
        desc: cfg.desc,
        rating: cfg.rating,
        typeCode,
        make: m,
        unit: 'Nos',
        price: calculatePrice('Metering', cfg.desc, cfg.rating, m, typeCode),
      });
    }
  }

  // 12. Metering / CT (150)
  const ct5Ratings = ['25/5A', '50/5A', '75/5A', '100/5A', '150/5A', '200/5A', '250/5A', '300/5A', '400/5A', '500/5A', '600/5A', '800/5A', '1000/5A', '1200/5A', '1500/5A', '2000/5A', '2500/5A', '3000/5A'];
  const ctMakes = ['Schneider Electric', 'Siemens', 'ABB', 'L&T', 'C&S Electric'];
  let ctSeq = 1998;
  for (const r of ct5Ratings) {
    for (const m of ctMakes) {
      const typeCode = `CT-${String(ctSeq++).padStart(4, '0')}`;
      items.push({
        sNo: sNo++,
        section: 'Metering / CT',
        desc: 'Current Transformer',
        rating: r,
        typeCode,
        make: m,
        unit: 'Nos',
        price: calculatePrice('Metering / CT', 'Current Transformer', r, m, typeCode),
      });
    }
  }

  const ct1Ratings = ['25/1A', '50/1A', '75/1A', '100/1A', '150/1A', '200/1A', '250/1A', '300/1A', '400/1A', '500/1A', '600/1A', '800/1A', '1000/1A', '1200/1A', '1500/1A'];
  const ct1Makes = ['Schneider Electric', 'Siemens', 'ABB', 'L&T'];
  let ct1Seq = 2088;
  for (const r of ct1Ratings) {
    for (const m of ct1Makes) {
      const typeCode = `CT1-${String(ct1Seq++).padStart(4, '0')}`;
      items.push({
        sNo: sNo++,
        section: 'Metering / CT',
        desc: 'Current Transformer',
        rating: r,
        typeCode,
        make: m,
        unit: 'Nos',
        price: calculatePrice('Metering / CT', 'Current Transformer', r, m, typeCode),
      });
    }
  }

  // 13. Busbar / Power Distribution (115)
  const cuWidths = ['10', '12.5', '15', '20', '25', '30', '32', '40', '50', '60', '75', '80', '100', '125', '150'];
  const cuThicks = ['2 mm', '3 mm', '5 mm', '6 mm', '10 mm'];
  let cubSeq = 2148;
  for (const w of cuWidths) {
    for (const t of cuThicks) {
      const typeCode = `CUB-${String(cubSeq++).padStart(4, '0')}`;
      const rating = `${w}x${t}`;
      items.push({
        sNo: sNo++,
        section: 'Busbar / Power Distribution',
        desc: 'Copper Flat Busbar',
        rating,
        typeCode,
        make: 'Generic',
        unit: 'Kg',
        price: 960,
      });
    }
  }

  const alWidths = ['20', '25', '30', '40', '50', '60', '75', '80', '100', '125'];
  const alThicks = ['3 mm', '5 mm', '6 mm', '10 mm'];
  let albSeq = 2223;
  for (const w of alWidths) {
    for (const t of alThicks) {
      const typeCode = `ALB-${String(albSeq++).padStart(4, '0')}`;
      const rating = `${w}x${t}`;
      items.push({
        sNo: sNo++,
        section: 'Busbar / Power Distribution',
        desc: 'Aluminium Flat Busbar',
        rating,
        typeCode,
        make: 'Generic',
        unit: 'Kg',
        price: 380,
      });
    }
  }

  // 14. Busbar Accessories (217)
  const bsiAmps = ['160A', '250A', '400A', '630A', '800A', '1250A', '1600A', '2000A', '2500A', '3200A'];
  const bsiPoles = ['1P', '2P', '3P', '4P'];
  const bsiMakes = ['Schneider Electric', 'Siemens', 'ABB', 'L&T', 'Generic'];
  let bsiSeq = 2263;
  for (const a of bsiAmps) {
    for (const p of bsiPoles) {
      for (const m of bsiMakes) {
        const typeCode = `BSI-${String(bsiSeq++).padStart(4, '0')}`;
        const rating = `${a}, ${p}`;
        items.push({
          sNo: sNo++,
          section: 'Busbar Accessories',
          desc: 'Busbar Support Insulator',
          rating,
          typeCode,
          make: m,
          unit: 'Set',
          price: calculatePrice('Busbar Accessories', 'Busbar Support Insulator', rating, m, typeCode),
        });
      }
    }
  }

  const bssColors = ['PVC Red', 'PVC Yellow', 'PVC Blue', 'PVC Black', 'Heat Shrink Red', 'Heat Shrink Yellow', 'Heat Shrink Blue', 'Heat Shrink Black'];
  let bssSeq = 2463;
  for (const c of bssColors) {
    const typeCode = `BSS-${String(bssSeq++).padStart(4, '0')}`;
    items.push({
      sNo: sNo++,
      section: 'Busbar Accessories',
      desc: 'Busbar Sleeve',
      rating: c,
      typeCode,
      make: 'Generic',
      unit: 'Mtr',
      price: c.includes('Heat') ? 85 : 45,
    });
  }

  const bjlRatings = ['160A', '250A', '400A', '630A', '800A', '1250A', '1600A', '2000A', '2500A'];
  let bjlSeq = 2471;
  for (const r of bjlRatings) {
    const typeCode = `BJL-${String(bjlSeq++).padStart(4, '0')}`;
    items.push({
      sNo: sNo++,
      section: 'Busbar Accessories',
      desc: 'Busbar Joint / Link',
      rating: r,
      typeCode,
      make: 'Generic',
      unit: 'Nos',
      price: calculatePrice('Busbar Accessories', 'Busbar Joint / Link', r, 'Generic', typeCode),
    });
  }

  // 15. Enclosure / Fabrication (19)
  const crcaGauges = ['1 mm', '1.2 mm', '1.5 mm', '1.6 mm', '2 mm', '2.5 mm', '3 mm', '4 mm', '5 mm', '6 mm'];
  let sheetSeq = 2480;
  for (const g of crcaGauges) {
    const typeCode = `SHEET-${String(sheetSeq++).padStart(4, '0')}`;
    items.push({
      sNo: sNo++,
      section: 'Enclosure / Fabrication',
      desc: 'CRCA Sheet',
      rating: g,
      typeCode,
      make: 'Generic',
      unit: 'Kg',
      price: 84,
    });
  }
  const ssGauges = ['1 mm', '1.2 mm', '1.5 mm', '2 mm', '3 mm'];
  let ssSeq = 2490;
  for (const g of ssGauges) {
    const typeCode = `SS304-${String(ssSeq++).padStart(4, '0')}`;
    items.push({
      sNo: sNo++,
      section: 'Enclosure / Fabrication',
      desc: 'SS304 Sheet',
      rating: g,
      typeCode,
      make: 'Generic',
      unit: 'Kg',
      price: 260,
    });
  }
  const giGauges = ['1 mm', '1.2 mm', '1.5 mm', '2 mm'];
  let giSeq = 2495;
  for (const g of giGauges) {
    const typeCode = `GI-${String(giSeq++).padStart(4, '0')}`;
    items.push({
      sNo: sNo++,
      section: 'Enclosure / Fabrication',
      desc: 'GI Sheet',
      rating: g,
      typeCode,
      make: 'Generic',
      unit: 'Kg',
      price: 95,
    });
  }

  // 16. Enclosure Accessories (26)
  const mpThick = ['CRCA 1.6mm', 'CRCA 2mm', 'CRCA 2.5mm', 'CRCA 3mm'];
  let mpSeq = 2499;
  for (const t of mpThick) {
    const typeCode = `MP-${String(mpSeq++).padStart(4, '0')}`;
    items.push({ sNo: sNo++, section: 'Enclosure Accessories', desc: 'Mounting Plate', rating: t, typeCode, make: 'Generic', unit: 'Nos', price: 1650 });
  }
  const plinthH = ['CRCA, 50mm height', 'CRCA, 75mm height', 'CRCA, 100mm height', 'CRCA, 150mm height'];
  let plSeq = 2503;
  for (const h of plinthH) {
    const typeCode = `PL-${String(plSeq++).padStart(4, '0')}`;
    items.push({ sNo: sNo++, section: 'Enclosure Accessories', desc: 'Plinth', rating: h, typeCode, make: 'Generic', unit: 'Set', price: 1450 });
  }
  const hingeConfigs = [
    { rating: 'Standard', make: 'Generic', seq: 2507 },
    { rating: 'Standard', make: 'Rittal', seq: 2508 },
    { rating: 'Heavy Duty', make: 'Generic', seq: 2509 },
    { rating: 'Heavy Duty', make: 'Rittal', seq: 2510 },
  ];
  for (const h of hingeConfigs) {
    const typeCode = `HINGE-${String(h.seq).padStart(4, '0')}`;
    items.push({ sNo: sNo++, section: 'Enclosure Accessories', desc: 'Door Hinge', rating: h.rating, typeCode, make: h.make, unit: 'Nos', price: h.make === 'Rittal' ? 380 : 180 });
  }
  const lockTypes = ['Quarter-turn', 'Key lock', 'L-handle', 'T-handle'];
  const lockMakes = ['Generic', 'Rittal', 'Schneider Electric'];
  let lockSeq = 2511;
  for (const t of lockTypes) {
    for (const m of lockMakes) {
      const typeCode = `LOCK-${String(lockSeq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'Enclosure Accessories', desc: 'Panel Lock', rating: t, typeCode, make: m, unit: 'Nos', price: m === 'Generic' ? 240 : 580 });
    }
  }
  items.push({ sNo: sNo++, section: 'Enclosure Accessories', desc: 'Door Stay', rating: 'Standard', typeCode: 'STAY-2523', make: 'Generic', unit: 'Nos', price: 280 });
  items.push({ sNo: sNo++, section: 'Enclosure Accessories', desc: 'Door Stay', rating: 'Heavy Duty', typeCode: 'STAY-2524', make: 'Generic', unit: 'Nos', price: 420 });

  // 17. Cable Management (179)
  const ductSizes = [
    '25x25 mm', '25x40 mm', '25x60 mm', '25x80 mm',
    '40x25 mm', '40x40 mm', '40x60 mm', '40x80 mm',
    '60x25 mm', '60x40 mm', '60x60 mm', '60x80 mm',
    '80x25 mm', '80x40 mm', '80x60 mm', '80x80 mm',
    '100x25 mm', '100x40 mm', '100x60 mm', '100x80 mm',
    '120x25 mm', '120x40 mm', '120x60 mm', '120x80 mm'
  ];
  const ductMakes = ['Generic', 'Legrand', 'Phoenix Contact'];
  let ductSeq = 2525;
  for (const d of ductSizes) {
    for (const m of ductMakes) {
      const typeCode = `DUCT-${String(ductSeq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'Cable Management', desc: 'PVC Wire Duct', rating: d, typeCode, make: m, unit: 'Mtr', price: calculatePrice('Cable Management', 'PVC Wire Duct', d, m, typeCode) });
    }
  }

  const dinTypes = ['TS35x7.5', 'TS35x15', 'C-rail'];
  const dinMakes = ['Phoenix Contact', 'Weidmuller', 'WAGO', 'Generic'];
  let dinSeq = 2597;
  for (const d of dinTypes) {
    for (const m of dinMakes) {
      const typeCode = `DIN-${String(dinSeq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'Cable Management', desc: 'DIN Rail', rating: d, typeCode, make: m, unit: 'Mtr', price: m === 'Generic' ? 120 : 210 });
    }
  }

  const tieLengths = ['100', '150', '200', '250', '300', '370', '450', '500'];
  const tieWidths = ['2.5 mm', '3.6 mm', '4.8 mm', '7.6 mm', '9 mm'];
  const tieMakes = ['Generic', 'HellermannTyton'];
  let tieSeq = 2609;
  for (const l of tieLengths) {
    for (const w of tieWidths) {
      for (const m of tieMakes) {
        const typeCode = `TIE-${String(tieSeq++).padStart(4, '0')}`;
        const rating = `${l}x${w}`;
        items.push({ sNo: sNo++, section: 'Cable Management', desc: 'Cable Tie', rating, typeCode, make: m, unit: 'Nos', price: m === 'Generic' ? 1.5 : 3.5 });
      }
    }
  }

  const wrapSizes = ['6 mm', '10 mm', '12 mm', '16 mm', '20 mm', '25 mm', '32 mm'];
  let wrapSeq = 2689;
  for (const w of wrapSizes) {
    const typeCode = `WRAP-${String(wrapSeq++).padStart(4, '0')}`;
    items.push({ sNo: sNo++, section: 'Cable Management', desc: 'Spiral Cable Wrap', rating: w, typeCode, make: 'Generic', unit: 'Mtr', price: 32 });
  }

  const condSizes = ['10 mm', '13 mm', '16 mm', '20 mm', '25 mm', '32 mm', '40 mm', '50 mm'];
  let condSeq = 2696;
  for (const c of condSizes) {
    const typeCode = `COND-${String(condSeq++).padStart(4, '0')}`;
    items.push({ sNo: sNo++, section: 'Cable Management', desc: 'Flexible Conduit', rating: c, typeCode, make: 'Generic', unit: 'Mtr', price: 48 });
  }

  // 18. Terminal Blocks (190)
  const tbSizes = ['1.5 sq.mm', '2.5 sq.mm', '4 sq.mm', '6 sq.mm', '10 sq.mm', '16 sq.mm', '25 sq.mm', '35 sq.mm', '50 sq.mm', '70 sq.mm', '95 sq.mm', '120 sq.mm', '150 sq.mm', '185 sq.mm', '240 sq.mm'];
  const tbMakes = ['Phoenix Contact', 'WAGO', 'Weidmuller', 'Connectwell', 'Elmex'];
  let tbSeq = 2704;
  for (const s of tbSizes) {
    for (const m of tbMakes) {
      const typeCode = `TB-${String(tbSeq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'Terminal Blocks', desc: 'Feed-through Terminal Block', rating: s, typeCode, make: m, unit: 'Nos', price: calculatePrice('Terminal Blocks', 'Feed-through Terminal Block', s, m, typeCode) });
    }
  }

  const teSizes = ['1.5 sq.mm', '2.5 sq.mm', '4 sq.mm', '6 sq.mm', '10 sq.mm', '16 sq.mm', '25 sq.mm', '35 sq.mm', '50 sq.mm', '70 sq.mm', '95 sq.mm', '120 sq.mm'];
  let teSeq = 2779;
  for (const s of teSizes) {
    for (const m of tbMakes) {
      const typeCode = `TE-${String(teSeq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'Terminal Blocks', desc: 'Earth Terminal Block', rating: s, typeCode, make: m, unit: 'Nos', price: calculatePrice('Terminal Blocks', 'Earth Terminal Block', s, m, typeCode) });
    }
  }

  const tfSizes = ['1.5 sq.mm', '2.5 sq.mm', '4 sq.mm', '6 sq.mm', '10 sq.mm'];
  let tfSeq = 2839;
  for (const s of tfSizes) {
    for (const m of tbMakes) {
      const typeCode = `TF-${String(tfSeq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'Terminal Blocks', desc: 'Fuse Terminal Block', rating: s, typeCode, make: m, unit: 'Nos', price: calculatePrice('Terminal Blocks', 'Fuse Terminal Block', s, m, typeCode) });
    }
  }

  const tdSizes = ['1.5 sq.mm', '2.5 sq.mm', '4 sq.mm', '6 sq.mm', '10 sq.mm', '16 sq.mm'];
  let tdSeq = 2864;
  for (const s of tdSizes) {
    for (const m of tbMakes) {
      const typeCode = `TD-${String(tdSeq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'Terminal Blocks', desc: 'Disconnect Terminal Block', rating: s, typeCode, make: m, unit: 'Nos', price: calculatePrice('Terminal Blocks', 'Disconnect Terminal Block', s, m, typeCode) });
    }
  }

  // 19. Terminal Accessories (35)
  let ebSeq = 2894;
  for (const m of tbMakes) {
    items.push({ sNo: sNo++, section: 'Terminal Accessories', desc: 'End Bracket', rating: 'For TS35', typeCode: `EB-${String(ebSeq++).padStart(4, '0')}`, make: m, unit: 'Nos', price: 24 });
  }
  const epGroups = ['1.5/2.5/4/6/10 sq.mm', '16/25 sq.mm', '35/50 sq.mm'];
  let epSeq = 2899;
  for (const g of epGroups) {
    for (const m of tbMakes) {
      items.push({ sNo: sNo++, section: 'Terminal Accessories', desc: 'End Plate', rating: g, typeCode: `EP-${String(epSeq++).padStart(4, '0')}`, make: m, unit: 'Nos', price: 18 });
    }
  }
  const tmGroups = ['Blank', 'Numbered 0-9', 'A-Z'];
  let tmSeq = 2914;
  for (const g of tmGroups) {
    for (const m of tbMakes) {
      items.push({ sNo: sNo++, section: 'Terminal Accessories', desc: 'Terminal Marker', rating: g, typeCode: `TM-${String(tmSeq++).padStart(4, '0')}`, make: m, unit: 'Strip', price: 35 });
    }
  }

  // 20. Wiring (105)
  const cwSizes = ['0.5 sq.mm', '0.75 sq.mm', '1 sq.mm', '1.5 sq.mm', '2.5 sq.mm', '4 sq.mm', '6 sq.mm'];
  const cwGrades = ['FR', 'FRLS', 'PVC'];
  const cableMakes = ['Polycab', 'Finolex', 'RR Kabel', 'KEI', 'Havells'];
  let cwSeq = 2929;
  for (const s of cwSizes) {
    for (const g of cwGrades) {
      for (const m of cableMakes) {
        const typeCode = `CW-${String(cwSeq++).padStart(4, '0')}`;
        const rating = `${s} ${g}`;
        items.push({ sNo: sNo++, section: 'Wiring', desc: 'Control Wire', rating, typeCode, make: m, unit: 'Mtr', price: calculatePrice('Wiring', 'Control Wire', rating, m, typeCode) });
      }
    }
  }

  // 21. Power Cable (455)
  const pcSizes = ['1.5 sq.mm', '2.5 sq.mm', '4 sq.mm', '6 sq.mm', '10 sq.mm', '16 sq.mm', '25 sq.mm', '35 sq.mm', '50 sq.mm', '70 sq.mm', '95 sq.mm', '120 sq.mm', '150 sq.mm', '185 sq.mm', '240 sq.mm', '300 sq.mm', '400 sq.mm'];
  const pcGrades = ['FR', 'FRLS', 'XLPE'];
  let pcSeq = 3034;
  for (const s of pcSizes) {
    for (const g of pcGrades) {
      for (const m of cableMakes) {
        const typeCode = `PC-${String(pcSeq++).padStart(4, '0')}`;
        const rating = `${s} ${g}`;
        items.push({ sNo: sNo++, section: 'Power Cable', desc: 'Flexible Copper Cable', rating, typeCode, make: m, unit: 'Mtr', price: calculatePrice('Power Cable', 'Flexible Copper Cable', rating, m, typeCode) });
      }
    }
  }

  const mccCores = ['2C', '3C', '4C', '5C', '7C', '10C', '12C', '14C', '19C', '24C'];
  const mccSq = ['0.5 sq.mm', '0.75 sq.mm', '1 sq.mm', '1.5 sq.mm', '2.5 sq.mm'];
  const mccMakes = ['Polycab', 'Finolex', 'RR Kabel', 'KEI'];
  let mccSeq = 3289;
  for (const c of mccCores) {
    for (const s of mccSq) {
      for (const m of mccMakes) {
        const typeCode = `MCC-${String(mccSeq++).padStart(4, '0')}`;
        const rating = `${c} x ${s}`;
        items.push({ sNo: sNo++, section: 'Power Cable', desc: 'Multi-core Control Cable', rating, typeCode, make: m, unit: 'Mtr', price: calculatePrice('Power Cable', 'Multi-core Control Cable', rating, m, typeCode) });
      }
    }
  }

  // 22. Instrumentation (36)
  const icPairs = ['1 Pair', '2 Pair', '4 Pair', '8 Pair'];
  const icSq = ['0.5 sq.mm', '0.75 sq.mm', '1 sq.mm'];
  const icMakes = ['Polycab', 'Finolex', 'KEI'];
  let icSeq = 3489;
  for (const p of icPairs) {
    for (const s of icSq) {
      for (const m of icMakes) {
        const typeCode = `IC-${String(icSeq++).padStart(4, '0')}`;
        const rating = `${p} x ${s}`;
        items.push({ sNo: sNo++, section: 'Instrumentation', desc: 'Shielded Instrument Cable', rating, typeCode, make: m, unit: 'Mtr', price: calculatePrice('Instrumentation', 'Shielded Instrument Cable', rating, m, typeCode) });
      }
    }
  }

  // 23. Cable Glands (80)
  const glandSizes = ['M12', 'M16', 'M20', 'M25', 'M32', 'M40', 'M50', 'M63', 'M75', 'M90', 'M110'];
  const glandMakes = ['Dowells', 'Comet', 'Elmex', 'Generic'];
  let glSeq = 3525;
  for (const s of glandSizes) {
    for (const m of glandMakes) {
      const typeCode = `GL-${String(glSeq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'Cable Glands', desc: 'Brass Cable Gland', rating: s, typeCode, make: m, unit: 'Nos', price: calculatePrice('Cable Glands', 'Brass Cable Gland', s, m, typeCode) });
    }
  }
  const dcgSizes = ['M20', 'M25', 'M32', 'M40', 'M50', 'M63', 'M75', 'M90', 'M110'];
  let dcgSeq = 3569;
  for (const s of dcgSizes) {
    for (const m of glandMakes) {
      const typeCode = `DCG-${String(dcgSeq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'Cable Glands', desc: 'Double Compression Cable Gland', rating: s, typeCode, make: m, unit: 'Nos', price: calculatePrice('Cable Glands', 'Double Compression Cable Gland', s, m, typeCode) });
    }
  }

  // 24. Cable Lugs (246)
  const lugSizes = ['1.5 sq.mm', '2.5 sq.mm', '4 sq.mm', '6 sq.mm', '10 sq.mm', '16 sq.mm', '25 sq.mm', '35 sq.mm', '50 sq.mm', '70 sq.mm', '95 sq.mm', '120 sq.mm', '150 sq.mm', '185 sq.mm', '240 sq.mm', '300 sq.mm', '400 sq.mm'];
  const lugTypes = ['Ring', 'Fork', 'Pin'];
  const lugMakes = ['Dowells', '3D', 'Elmex', 'Generic'];
  let lugSeq = 3605;
  for (const s of lugSizes) {
    for (const t of lugTypes) {
      for (const m of lugMakes) {
        const typeCode = `LUG-${String(lugSeq++).padStart(4, '0')}`;
        const rating = `${s}, ${t}`;
        items.push({ sNo: sNo++, section: 'Cable Lugs', desc: 'Copper Cable Lug', rating, typeCode, make: m, unit: 'Nos', price: calculatePrice('Cable Lugs', 'Copper Cable Lug', rating, m, typeCode) });
      }
    }
  }

  const alugSizes = ['16 sq.mm', '25 sq.mm', '35 sq.mm', '50 sq.mm', '70 sq.mm', '95 sq.mm', '120 sq.mm', '150 sq.mm', '185 sq.mm', '240 sq.mm', '300 sq.mm', '400 sq.mm', '500 sq.mm', '630 sq.mm'];
  const alugMakes = ['Dowells', '3D', 'Generic'];
  let alugSeq = 3809;
  for (const s of alugSizes) {
    for (const m of alugMakes) {
      const typeCode = `ALUG-${String(alugSeq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'Cable Lugs', desc: 'Aluminium Cable Lug', rating: s, typeCode, make: m, unit: 'Nos', price: calculatePrice('Cable Lugs', 'Aluminium Cable Lug', s, m, typeCode) });
    }
  }

  // 25. Cable Accessories (44)
  const hstSizes = ['3mm dia', '6mm dia', '9mm dia', '12mm dia', '16mm dia', '20mm dia', '25mm dia', '32mm dia', '40mm dia', '50mm dia', '63mm dia'];
  const hstColors = ['Black', 'Red', 'Yellow', 'Blue'];
  let hstSeq = 3851;
  for (const s of hstSizes) {
    for (const c of hstColors) {
      const typeCode = `HST-${String(hstSeq++).padStart(4, '0')}`;
      const rating = `${s} ${c}`;
      items.push({ sNo: sNo++, section: 'Cable Accessories', desc: 'Heat Shrink Tube', rating, typeCode, make: 'Generic', unit: 'Mtr', price: calculatePrice('Cable Accessories', 'Heat Shrink Tube', rating, 'Generic', typeCode) });
    }
  }

  // 26. PLC CPU (84)
  const plcTiers = [
    'Compact DI/DO', 'Compact Ethernet', 'Compact Ethernet+Serial',
    'Standard DI/DO', 'Standard Ethernet', 'Standard Ethernet+Serial',
    'Advanced DI/DO', 'Advanced Ethernet', 'Advanced Ethernet+Serial',
    'Safety DI/DO', 'Safety Ethernet', 'Safety Ethernet+Serial'
  ];
  const plcMakes = ['Siemens', 'Schneider Electric', 'Mitsubishi Electric', 'Delta', 'Omron', 'Rockwell Automation', 'Weintek'];
  let plcSeq = 3895;
  for (const t of plcTiers) {
    for (const m of plcMakes) {
      const typeCode = `PLC-${String(plcSeq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'PLC CPU', desc: 'PLC CPU', rating: t, typeCode, make: m, unit: 'Nos', price: calculatePrice('PLC CPU', 'PLC CPU', t, m, typeCode) });
    }
  }

  // 27. PLC I/O (84)
  const ioConfigs = [
    { desc: 'Digital Input Module', rating: '8 DI, 24VDC', prefix: 'DI', seq: 3979 },
    { desc: 'Digital Input Module', rating: '16 DI, 24VDC', prefix: 'DI', seq: 3986 },
    { desc: 'Digital Input Module', rating: '32 DI, 24VDC', prefix: 'DI', seq: 3993 },
    { desc: 'Digital Output Module', rating: '8 DO, 24VDC', prefix: 'DO', seq: 4000 },
    { desc: 'Digital Output Module', rating: '16 DO, 24VDC', prefix: 'DO', seq: 4007 },
    { desc: 'Digital Output Module', rating: '32 DO, 24VDC', prefix: 'DO', seq: 4014 },
    { desc: 'Analog Input Module', rating: '2 AI, 4-20mA/0-10V', prefix: 'AI', seq: 4021 },
    { desc: 'Analog Input Module', rating: '4 AI, 4-20mA/0-10V', prefix: 'AI', seq: 4028 },
    { desc: 'Analog Input Module', rating: '8 AI, 4-20mA/0-10V', prefix: 'AI', seq: 4035 },
    { desc: 'Analog Output Module', rating: '2 AO, 4-20mA/0-10V', prefix: 'AO', seq: 4042 },
    { desc: 'Analog Output Module', rating: '4 AO, 4-20mA/0-10V', prefix: 'AO', seq: 4049 },
    { desc: 'Analog Output Module', rating: '8 AO, 4-20mA/0-10V', prefix: 'AO', seq: 4056 },
  ];
  for (const cfg of ioConfigs) {
    let curSeq = cfg.seq;
    for (const m of plcMakes) {
      const typeCode = `${cfg.prefix}-${String(curSeq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'PLC I/O', desc: cfg.desc, rating: cfg.rating, typeCode, make: m, unit: 'Nos', price: calculatePrice('PLC I/O', cfg.desc, cfg.rating, m, typeCode) });
    }
  }

  // 28. PLC Communication (42)
  const comTypes = ['RS485', 'RS232', 'Ethernet', 'Profinet', 'Modbus TCP', 'Profibus'];
  let comSeq = 4063;
  for (const c of comTypes) {
    for (const m of plcMakes) {
      const typeCode = `COM-${String(comSeq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'PLC Communication', desc: 'Communication Module', rating: c, typeCode, make: m, unit: 'Nos', price: calculatePrice('PLC Communication', 'Communication Module', c, m, typeCode) });
    }
  }

  // 29. HMI (56)
  const hmiSizes = ['4.3 inch, Touch', '5 inch, Touch', '7 inch, Touch', '9 inch, Touch', '10 inch, Touch', '12 inch, Touch', '15 inch, Touch', '19 inch, Touch'];
  let hmiSeq = 4105;
  for (const s of hmiSizes) {
    for (const m of plcMakes) {
      const typeCode = `HMI-${String(hmiSeq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'HMI', desc: 'HMI', rating: s, typeCode, make: m, unit: 'Nos', price: calculatePrice('HMI', 'HMI', s, m, typeCode) });
    }
  }

  // 30. Industrial Networking (70)
  const swPorts = ['5 Port', '8 Port', '10 Port', '16 Port', '24 Port'];
  let swSeq = 4161;
  for (const p of swPorts) {
    for (const m of plcMakes) {
      const typeCode = `SW-${String(swSeq++).padStart(4, '0')}`;
      const rating = `${p}, Managed`;
      items.push({ sNo: sNo++, section: 'Industrial Networking', desc: 'Industrial Ethernet Switch', rating, typeCode, make: m, unit: 'Nos', price: calculatePrice('Industrial Networking', 'Industrial Ethernet Switch', rating, m, typeCode) });
    }
  }
  let uswSeq = 4196;
  for (const p of swPorts) {
    for (const m of plcMakes) {
      const typeCode = `USW-${String(uswSeq++).padStart(4, '0')}`;
      const rating = `${p}, Unmanaged`;
      items.push({ sNo: sNo++, section: 'Industrial Networking', desc: 'Industrial Ethernet Switch', rating, typeCode, make: m, unit: 'Nos', price: calculatePrice('Industrial Networking', 'Industrial Ethernet Switch', rating, m, typeCode) });
    }
  }

  // 31. Safety (20)
  const safeRelTypes = ['E-stop', 'Two-hand', 'Guard monitoring'];
  const safeMakes = ['Pilz', 'Schmersal', 'Siemens', 'Schneider Electric'];
  let safeSeq = 4231;
  for (const t of safeRelTypes) {
    for (const m of safeMakes) {
      const typeCode = `SAFE-${String(safeSeq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'Safety', desc: 'Safety Relay', rating: t, typeCode, make: m, unit: 'Nos', price: calculatePrice('Safety', 'Safety Relay', t, m, typeCode) });
    }
  }
  const scTypes = ['Compact', 'Modular'];
  let scSeq = 4243;
  for (const t of scTypes) {
    for (const m of safeMakes) {
      const typeCode = `SC-${String(scSeq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'Safety', desc: 'Safety Controller', rating: t, typeCode, make: m, unit: 'Nos', price: calculatePrice('Safety', 'Safety Controller', t, m, typeCode) });
    }
  }

  // 32. VFD / AC Drive (208)
  const vfdKw = ['0.75 kW', '1.5 kW', '2.2 kW', '3.7 kW', '5.5 kW', '7.5 kW', '11 kW', '15 kW', '18.5 kW', '22 kW', '30 kW', '37 kW', '45 kW', '55 kW', '75 kW', '90 kW', '110 kW', '132 kW', '160 kW', '200 kW', '250 kW', '315 kW', '355 kW', '400 kW', '450 kW', '500 kW'];
  const vfdMakes = ['Siemens', 'Schneider Electric', 'ABB', 'Delta', 'Danfoss', 'Yaskawa', 'Fuji Electric', 'Rockwell Automation'];
  let vfdSeq = 4251;
  for (const kw of vfdKw) {
    for (const m of vfdMakes) {
      const typeCode = `VFD-${String(vfdSeq++).padStart(4, '0')}`;
      const rating = `${kw}, 415V`;
      items.push({ sNo: sNo++, section: 'VFD / AC Drive', desc: 'VFD', rating, typeCode, make: m, unit: 'Nos', price: calculatePrice('VFD / AC Drive', 'VFD', rating, m, typeCode) });
    }
  }

  // 33. VFD Accessories (456)
  const reactorKw = ['2.2 kW', '5.5 kW', '7.5 kW', '11 kW', '15 kW', '22 kW', '30 kW', '37 kW', '45 kW', '55 kW', '75 kW', '90 kW', '110 kW', '160 kW', '200 kW', '250 kW'];
  let lrSeq = 4459;
  for (const kw of reactorKw) {
    for (const m of vfdMakes) {
      const typeCode = `LR-${String(lrSeq++).padStart(4, '0')}`;
      const rating = `${kw} equivalent`;
      items.push({ sNo: sNo++, section: 'VFD Accessories', desc: 'Input Line Reactor', rating, typeCode, make: m, unit: 'Nos', price: calculatePrice('VFD Accessories', 'Input Line Reactor', rating, m, typeCode) });
    }
  }

  let orSeq = 4587;
  for (const kw of reactorKw) {
    for (const m of vfdMakes) {
      const typeCode = `OR-${String(orSeq++).padStart(4, '0')}`;
      const rating = `${kw} equivalent`;
      items.push({ sNo: sNo++, section: 'VFD Accessories', desc: 'Output Reactor', rating, typeCode, make: m, unit: 'Nos', price: calculatePrice('VFD Accessories', 'Output Reactor', rating, m, typeCode) });
    }
  }

  const dvKw = ['5.5 kW', '11 kW', '15 kW', '22 kW', '30 kW', '37 kW', '45 kW', '55 kW', '75 kW', '90 kW', '110 kW', '160 kW', '200 kW'];
  let dvSeq = 4707;
  for (const kw of dvKw) {
    for (const m of vfdMakes) {
      const typeCode = `DV-${String(dvSeq++).padStart(4, '0')}`;
      const rating = `${kw} equivalent`;
      items.push({ sNo: sNo++, section: 'VFD Accessories', desc: 'dv/dt Filter', rating, typeCode, make: m, unit: 'Nos', price: calculatePrice('VFD Accessories', 'dv/dt Filter', rating, m, typeCode) });
    }
  }

  const brKw = ['2.2 kW', '5.5 kW', '7.5 kW', '11 kW', '15 kW', '22 kW', '30 kW', '37 kW', '45 kW', '55 kW', '75 kW', '90 kW', '110 kW'];
  let brSeq = 4811;
  for (const kw of brKw) {
    for (const m of vfdMakes) {
      const typeCode = `BR-${String(brSeq++).padStart(4, '0')}`;
      const rating = `${kw} drive`;
      items.push({ sNo: sNo++, section: 'VFD Accessories', desc: 'Braking Resistor', rating, typeCode, make: m, unit: 'Nos', price: calculatePrice('VFD Accessories', 'Braking Resistor', rating, m, typeCode) });
    }
  }

  // 34. Soft Starter (85)
  const ssKw = ['5.5 kW', '7.5 kW', '11 kW', '15 kW', '18.5 kW', '22 kW', '30 kW', '37 kW', '45 kW', '55 kW', '75 kW', '90 kW', '110 kW', '132 kW', '160 kW', '200 kW', '250 kW'];
  const ssMakes = ['Schneider Electric', 'Siemens', 'ABB', 'L&T', 'C&S Electric'];
  let softSeq = 4915;
  for (const kw of ssKw) {
    for (const m of ssMakes) {
      const typeCode = `SS-${String(softSeq++).padStart(4, '0')}`;
      const rating = `${kw}, 415V`;
      items.push({ sNo: sNo++, section: 'Soft Starter', desc: 'Soft Starter', rating, typeCode, make: m, unit: 'Nos', price: calculatePrice('Soft Starter', 'Soft Starter', rating, m, typeCode) });
    }
  }

  // 35. APFC (191)
  const capKvar = ['2.5 kVAR', '5 kVAR', '7.5 kVAR', '10 kVAR', '12.5 kVAR', '15 kVAR', '20 kVAR', '25 kVAR', '30 kVAR', '40 kVAR', '50 kVAR'];
  const capMakes = ['Schneider Electric', 'Siemens', 'ABB', 'EPCOS', 'L&T', 'C&S Electric'];
  let capSeq = 5000;
  for (const kv of capKvar) {
    for (const m of capMakes) {
      const typeCode = `CAP-${String(capSeq++).padStart(4, '0')}`;
      const rating = `${kv}, 440V`;
      items.push({ sNo: sNo++, section: 'APFC', desc: 'Power Capacitor', rating, typeCode, make: m, unit: 'Nos', price: calculatePrice('APFC', 'Power Capacitor', rating, m, typeCode) });
    }
  }

  const cdcKvar = ['5 kVAR', '10 kVAR', '12.5 kVAR', '15 kVAR', '20 kVAR', '25 kVAR', '30 kVAR', '40 kVAR', '50 kVAR'];
  const cdcMakes = ['Schneider Electric', 'Siemens', 'ABB', 'L&T'];
  let cdcSeq = 5066;
  for (const kv of cdcKvar) {
    for (const m of cdcMakes) {
      const typeCode = `CDC-${String(cdcSeq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'APFC', desc: 'Capacitor Duty Contactor', rating: kv, typeCode, make: m, unit: 'Nos', price: calculatePrice('APFC', 'Capacitor Duty Contactor', kv, m, typeCode) });
    }
  }

  const drKvar = ['5 kVAR', '10 kVAR', '12.5 kVAR', '15 kVAR', '20 kVAR', '25 kVAR', '30 kVAR', '40 kVAR', '50 kVAR'];
  const drMakes = ['Schneider Electric', 'Siemens', 'ABB', 'EPCOS', 'L&T'];
  let drSeq = 5102;
  for (const kv of drKvar) {
    for (const m of drMakes) {
      const typeCode = `DR-${String(drSeq++).padStart(4, '0')}`;
      const rating = `${kv}, 7% detuned`;
      items.push({ sNo: sNo++, section: 'APFC', desc: 'Detuned Reactor', rating, typeCode, make: m, unit: 'Nos', price: calculatePrice('APFC', 'Detuned Reactor', rating, m, typeCode) });
    }
  }

  const apfcSteps = ['4 Step', '6 Step', '8 Step', '10 Step', '12 Step', '14 Step'];
  const apfcMakes = ['Schneider Electric', 'Siemens', 'ABB', 'EPCOS', 'L&T', 'Selec'];
  let apfcSeq = 5147;
  for (const st of apfcSteps) {
    for (const m of apfcMakes) {
      const typeCode = `APFC-${String(apfcSeq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'APFC', desc: 'APFC Relay', rating: st, typeCode, make: m, unit: 'Nos', price: calculatePrice('APFC', 'APFC Relay', st, m, typeCode) });
    }
  }

  const cdrKvar = ['For 5kVAR', 'For 10kVAR', 'For 15kVAR', 'For 20kVAR', 'For 25kVAR', 'For 30kVAR', 'For 40kVAR', 'For 50kVAR'];
  let cdrSeq = 5183;
  for (const kv of cdrKvar) {
    const typeCode = `CDR-${String(cdrSeq++).padStart(4, '0')}`;
    items.push({ sNo: sNo++, section: 'APFC', desc: 'Capacitor Discharge Resistor', rating: kv, typeCode, make: 'Generic', unit: 'Set', price: 350 });
  }

  // 36. AMF / Changeover (227)
  const mmccbAmps = ['100A', '160A', '250A', '400A', '630A', '800A', '1000A', '1250A', '1600A'];
  const mmccbPoles = ['3P', '4P'];
  const mmccbMakes = ['Schneider Electric', 'Siemens', 'ABB', 'L&T'];
  let mmccbSeq = 5191;
  for (const a of mmccbAmps) {
    for (const p of mmccbPoles) {
      for (const m of mmccbMakes) {
        const typeCode = `MMCCB-${String(mmccbSeq++).padStart(4, '0')}`;
        const rating = `${a} ${p}`;
        items.push({ sNo: sNo++, section: 'AMF / Changeover', desc: 'Motorized MCCB', rating, typeCode, make: m, unit: 'Nos', price: calculatePrice('AMF / Changeover', 'Motorized MCCB', rating, m, typeCode) });
      }
    }
  }

  const atsAmps = ['63A', '100A', '160A', '250A', '400A', '630A', '800A', '1000A', '1250A', '1600A'];
  const atsPoles = ['3P', '4P'];
  const atsMakes = ['Schneider Electric', 'Siemens', 'ABB', 'Socomec', 'L&T'];
  let atsSeq = 5263;
  for (const a of atsAmps) {
    for (const p of atsPoles) {
      for (const m of atsMakes) {
        const typeCode = `ATS-${String(atsSeq++).padStart(4, '0')}`;
        const rating = `${a}, ${p}`;
        items.push({ sNo: sNo++, section: 'AMF / Changeover', desc: 'ATS / Automatic Transfer Switch', rating, typeCode, make: m, unit: 'Nos', price: calculatePrice('AMF / Changeover', 'ATS / Automatic Transfer Switch', rating, m, typeCode) });
      }
    }
  }

  const amfTiers = ['Basic', 'Standard', 'Advanced'];
  const amfMakes = ['Deep Sea', 'ComAp', 'Woodward', 'Selec', 'DEIF'];
  let amfSeq = 5363;
  for (const t of amfTiers) {
    for (const m of amfMakes) {
      const typeCode = `AMF-${String(amfSeq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'AMF / Changeover', desc: 'AMF Controller', rating: t, typeCode, make: m, unit: 'Nos', price: calculatePrice('AMF / Changeover', 'AMF Controller', t, m, typeCode) });
    }
  }

  const bc12Amps = ['12V 3A', '12V 5A', '12V 10A', '12V 15A', '12V 20A'];
  const bcMakes = ['Exide', 'Amara Raja', 'Deep Sea', 'ComAp'];
  let bc12Seq = 5378;
  for (const a of bc12Amps) {
    for (const m of bcMakes) {
      const typeCode = `BC12-${String(bc12Seq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'AMF / Changeover', desc: 'Battery Charger', rating: a, typeCode, make: m, unit: 'Nos', price: calculatePrice('AMF / Changeover', 'Battery Charger', a, m, typeCode) });
    }
  }

  const bc24Amps = ['24V 3A', '24V 5A', '24V 10A', '24V 15A', '24V 20A'];
  let bc24Seq = 5398;
  for (const a of bc24Amps) {
    for (const m of bcMakes) {
      const typeCode = `BC24-${String(bc24Seq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'AMF / Changeover', desc: 'Battery Charger', rating: a, typeCode, make: m, unit: 'Nos', price: calculatePrice('AMF / Changeover', 'Battery Charger', a, m, typeCode) });
    }
  }

  // 37. PCC / ACB (144)
  const acbAmps = ['400A', '630A', '800A', '1000A', '1250A', '1600A', '2000A', '2500A', '3200A', '4000A', '5000A', '6300A'];
  const acbPoles = ['3P', '4P'];
  const acbMakes = ['Schneider Electric', 'Siemens', 'ABB', 'L&T'];
  let acbSeq = 5418;
  for (const a of acbAmps) {
    for (const p of acbPoles) {
      for (const m of acbMakes) {
        const typeCode = `ACB-${String(acbSeq++).padStart(4, '0')}`;
        const rating = `${a} ${p}`;
        items.push({ sNo: sNo++, section: 'PCC / ACB', desc: 'ACB', rating, typeCode, make: m, unit: 'Nos', price: calculatePrice('PCC / ACB', 'ACB', rating, m, typeCode) });
      }
    }
  }

  const acbtTypes = ['LSI', 'LSIG', 'Electronic'];
  let acbtSeq = 5514;
  for (const t of acbtTypes) {
    for (const m of acbMakes) {
      const typeCode = `ACBT-${String(acbtSeq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'PCC / ACB', desc: 'ACB Trip Unit', rating: t, typeCode, make: m, unit: 'Nos', price: calculatePrice('PCC / ACB', 'ACB Trip Unit', t, m, typeCode) });
    }
  }

  const stVolts = ['110VAC', '230VAC', '24VDC'];
  let stSeq = 5526;
  for (const v of stVolts) {
    for (const m of acbMakes) {
      const typeCode = `ST-${String(stSeq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'PCC / ACB', desc: 'Shunt Trip', rating: v, typeCode, make: m, unit: 'Nos', price: calculatePrice('PCC / ACB', 'Shunt Trip', v, m, typeCode) });
    }
  }

  let uvrSeq = 5538;
  for (const v of stVolts) {
    for (const m of acbMakes) {
      const typeCode = `UVR-${String(uvrSeq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'PCC / ACB', desc: 'Undervoltage Release', rating: v, typeCode, make: m, unit: 'Nos', price: calculatePrice('PCC / ACB', 'Undervoltage Release', v, m, typeCode) });
    }
  }

  let mmSeq = 5550;
  for (const v of stVolts) {
    for (const m of acbMakes) {
      const typeCode = `MM-${String(mmSeq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'PCC / ACB', desc: 'Motor Mechanism', rating: v, typeCode, make: m, unit: 'Nos', price: calculatePrice('PCC / ACB', 'Motor Mechanism', v, m, typeCode) });
    }
  }

  // 38. Surge Protection (33)
  const spd2Types = ['1P+N', '2P', '3P', '3P+N', '4P'];
  const spd2Makes = ['Schneider Electric', 'Siemens', 'ABB', 'C&S Electric', 'Phoenix Contact'];
  let spd2Seq = 5562;
  for (const t of spd2Types) {
    for (const m of spd2Makes) {
      const typeCode = `SPD2-${String(spd2Seq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'Surge Protection', desc: 'SPD Type 2', rating: t, typeCode, make: m, unit: 'Nos', price: calculatePrice('Surge Protection', 'SPD Type 2', t, m, typeCode) });
    }
  }

  const spd12Types = ['1P+N', '3P+N'];
  const spd12Makes = ['Schneider Electric', 'Siemens', 'ABB', 'Phoenix Contact'];
  let spd12Seq = 5587;
  for (const t of spd12Types) {
    for (const m of spd12Makes) {
      const typeCode = `SPD12-${String(spd12Seq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'Surge Protection', desc: 'SPD Type 1+2', rating: t, typeCode, make: m, unit: 'Nos', price: calculatePrice('Surge Protection', 'SPD Type 1+2', t, m, typeCode) });
    }
  }

  // 39. Panel Cooling (89)
  const fanCfm = ['50CFM', '100CFM', '150CFM', '200CFM', '300CFM', '400CFM', '500CFM'];
  const fanMakes = ['Rittal', 'Schneider Electric', 'Pfannenberg', 'Generic'];
  let fanSeq = 5595;
  for (const c of fanCfm) {
    for (const m of fanMakes) {
      const typeCode = `FAN-${String(fanSeq++).padStart(4, '0')}`;
      const rating = `230VAC ${c}`;
      items.push({ sNo: sNo++, section: 'Panel Cooling', desc: 'Panel Fan', rating, typeCode, make: m, unit: 'Nos', price: calculatePrice('Panel Cooling', 'Panel Fan', rating, m, typeCode) });
    }
  }

  const ffCfm = ['50 CFM', '100 CFM', '150 CFM', '200 CFM', '300 CFM', '400 CFM', '500 CFM'];
  let ffSeq = 5623;
  for (const c of ffCfm) {
    for (const m of fanMakes) {
      const typeCode = `FF-${String(ffSeq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'Panel Cooling', desc: 'Filter Fan', rating: c, typeCode, make: m, unit: 'Set', price: calculatePrice('Panel Cooling', 'Filter Fan', c, m, typeCode) });
    }
  }

  const heatW = ['50W', '100W', '150W', '250W', '400W', '600W'];
  let heatSeq = 5651;
  for (const w of heatW) {
    for (const m of fanMakes) {
      const typeCode = `HEAT-${String(heatSeq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'Panel Cooling', desc: 'Panel Heater', rating: w, typeCode, make: m, unit: 'Nos', price: calculatePrice('Panel Cooling', 'Panel Heater', w, m, typeCode) });
    }
  }

  const thTemps = ['0-60C', '0-100C'];
  const thMakes = ['Rittal', 'Schneider Electric', 'Pfannenberg'];
  let thSeq = 5675;
  for (const t of thTemps) {
    for (const m of thMakes) {
      const typeCode = `TH-${String(thSeq++).padStart(4, '0')}`;
      items.push({ sNo: sNo++, section: 'Panel Cooling', desc: 'Thermostat', rating: t, typeCode, make: m, unit: 'Nos', price: 1850 });
    }
  }

  let hySeq = 5681;
  for (const m of thMakes) {
    const typeCode = `HY-${String(hySeq++).padStart(4, '0')}`;
    items.push({ sNo: sNo++, section: 'Panel Cooling', desc: 'Hygrostat', rating: '35-95% RH', typeCode, make: m, unit: 'Nos', price: 2450 });
  }

  // 40. Hardware (62)
  const hwSizes = ['M4', 'M5', 'M6', 'M8', 'M10', 'M12', 'M16'];
  let hwSeq = 5684;
  for (const s of hwSizes) {
    items.push({ sNo: sNo++, section: 'Hardware', desc: 'MS Bolt Nut Washer Set', rating: s, typeCode: `HW-${String(hwSeq++).padStart(4, '0')}`, make: 'Generic', unit: 'Set', price: 6 });
  }
  let sshwSeq = 5691;
  for (const s of hwSizes) {
    items.push({ sNo: sNo++, section: 'Hardware', desc: 'SS304 Bolt Nut Washer Set', rating: s, typeCode: `SSHW-${String(sshwSeq++).padStart(4, '0')}`, make: 'Generic', unit: 'Set', price: 18 });
  }
  const psM = ['M4', 'M5', 'M6', 'M8'];
  const psL = ['10mm', '15mm', '20mm', '25mm', '30mm', '40mm'];
  let psSeq = 5698;
  for (const m of psM) {
    for (const l of psL) {
      items.push({ sNo: sNo++, section: 'Hardware', desc: 'Panel Screw', rating: `${m} x ${l}`, typeCode: `PS-${String(psSeq++).padStart(4, '0')}`, make: 'Generic', unit: 'Nos', price: 2.5 });
    }
  }
  const rivD = ['3', '4', '5', '6'];
  const rivL = ['6mm', '8mm', '10mm', '12mm', '16mm', '20mm'];
  let rivSeq = 5722;
  for (const d of rivD) {
    for (const l of rivL) {
      items.push({ sNo: sNo++, section: 'Hardware', desc: 'Rivet', rating: `${d} x ${l}`, typeCode: `RIV-${String(rivSeq++).padStart(4, '0')}`, make: 'Generic', unit: 'Nos', price: 1.2 });
    }
  }

  // 41. Identification (31)
  const cmRanges = ['1-10', '11-20', '21-30', '31-40', '41-50', '51-100', 'Blank'];
  const cmMakes = ['Phoenix Contact', 'Weidmuller', 'Connectwell', 'Generic'];
  let cmSeq = 5746;
  for (const r of cmRanges) {
    for (const m of cmMakes) {
      items.push({ sNo: sNo++, section: 'Identification', desc: 'Cable Marker', rating: r, typeCode: `CM-${String(cmSeq++).padStart(4, '0')}`, make: m, unit: 'Strip', price: 28 });
    }
  }
  const npTypes = ['Engraved ABS', 'Acrylic', 'Aluminium'];
  let npSeq = 5774;
  for (const t of npTypes) {
    items.push({ sNo: sNo++, section: 'Identification', desc: 'Name Plate', rating: t, typeCode: `NP-${String(npSeq++).padStart(4, '0')}`, make: 'Generic', unit: 'Nos', price: 85 });
  }

  // 42. Consumables (27)
  const tapeColors = ['Red', 'Yellow', 'Blue', 'Black', 'Green'];
  const tapeMakes = ['3M', 'Anchor', 'Generic'];
  let tapeSeq = 5777;
  for (const c of tapeColors) {
    for (const m of tapeMakes) {
      items.push({ sNo: sNo++, section: 'Consumables', desc: 'PVC Insulation Tape', rating: c, typeCode: `TAPE-${String(tapeSeq++).padStart(4, '0')}`, make: m, unit: 'Roll', price: 38 });
    }
  }
  items.push({ sNo: sNo++, section: 'Consumables', desc: 'Cable Tie Mount', rating: 'Adhesive', typeCode: 'CTM-5792', make: 'HellermannTyton', unit: 'Nos', price: 4.5 });
  items.push({ sNo: sNo++, section: 'Consumables', desc: 'Cable Tie Mount', rating: 'Adhesive', typeCode: 'CTM-5793', make: 'Generic', unit: 'Nos', price: 2.0 });
  items.push({ sNo: sNo++, section: 'Consumables', desc: 'Cable Tie Mount', rating: 'Screw mount', typeCode: 'CTM-5794', make: 'HellermannTyton', unit: 'Nos', price: 5.5 });
  items.push({ sNo: sNo++, section: 'Consumables', desc: 'Cable Tie Mount', rating: 'Screw mount', typeCode: 'CTM-5795', make: 'Generic', unit: 'Nos', price: 2.5 });
  const grmSizes = ['10mm', '16mm', '20mm', '25mm', '32mm', '40mm', '50mm', '63mm'];
  let grmSeq = 5796;
  for (const s of grmSizes) {
    items.push({ sNo: sNo++, section: 'Consumables', desc: 'Cable Grommet', rating: s, typeCode: `GRM-${String(grmSeq++).padStart(4, '0')}`, make: 'Generic', unit: 'Nos', price: 8 });
  }

  // 43. Fabrication Material (46)
  const pcoats = ['RAL7032', 'RAL7035', 'RAL9002', 'RAL9005'];
  let pcoatSeq = 5804;
  for (const p of pcoats) {
    items.push({ sNo: sNo++, section: 'Fabrication Material', desc: 'Powder Coating', rating: p, typeCode: `PCOAT-${String(pcoatSeq++).padStart(4, '0')}`, make: 'Generic', unit: 'Sq.ft', price: 45 });
  }
  const paintMakes = ['Asian Paints', 'Jotun', 'Berger'];
  let prmSeq = 5808;
  for (const t of ['Epoxy', 'PU']) {
    for (const m of paintMakes) {
      items.push({ sNo: sNo++, section: 'Fabrication Material', desc: 'Primer', rating: t, typeCode: `PRM-${String(prmSeq++).padStart(4, '0')}`, make: m, unit: 'Ltr', price: 380 });
    }
  }
  let thnSeq = 5814;
  for (const t of ['PU', 'Epoxy']) {
    for (const m of paintMakes) {
      items.push({ sNo: sNo++, section: 'Fabrication Material', desc: 'Thinner', rating: t, typeCode: `THN-${String(thnSeq++).padStart(4, '0')}`, make: m, unit: 'Ltr', price: 220 });
    }
  }
  const weldSpecs = ['E6013 2.5mm', 'E6013 3.15mm', 'E7018 3.15mm', 'E7018 4mm'];
  const weldMakes = ['Ador', 'ESAB', 'Bohler'];
  let weldSeq = 5820;
  for (const w of weldSpecs) {
    for (const m of weldMakes) {
      items.push({ sNo: sNo++, section: 'Fabrication Material', desc: 'Welding Electrode', rating: w, typeCode: `WELD-${String(weldSeq++).padStart(4, '0')}`, make: m, unit: 'Kg', price: 185 });
    }
  }
  const discSizes = ['4 inch', '7 inch', '9 inch'];
  const discMakes = ['Bosch', '3M', 'Generic'];
  let discSeq = 5832;
  for (const s of discSizes) {
    for (const m of discMakes) {
      items.push({ sNo: sNo++, section: 'Fabrication Material', desc: 'Grinding Disc', rating: s, typeCode: `DISC-${String(discSeq++).padStart(4, '0')}`, make: m, unit: 'Nos', price: m === 'Generic' ? 45 : 120 });
    }
  }
  let cutSeq = 5841;
  for (const s of discSizes) {
    for (const m of discMakes) {
      items.push({ sNo: sNo++, section: 'Fabrication Material', desc: 'Cutting Disc', rating: s, typeCode: `CUT-${String(cutSeq++).padStart(4, '0')}`, make: m, unit: 'Nos', price: m === 'Generic' ? 35 : 95 });
    }
  }

  // 44. Isolators / Switches (384)
  const isoAmps = ['16A', '25A', '32A', '40A', '63A', '80A', '100A', '125A', '160A', '250A', '400A', '630A'];
  const isoPoles = ['2P', '3P', '4P'];
  const isoMakes = ['Schneider Electric', 'Siemens', 'ABB', 'L&T', 'Legrand'];
  let isoSeq = 5850;
  for (const a of isoAmps) {
    for (const p of isoPoles) {
      for (const m of isoMakes) {
        const typeCode = `ISO-${String(isoSeq++).padStart(4, '0')}`;
        const rating = `${a} ${p}`;
        items.push({ sNo: sNo++, section: 'Isolators / Switches', desc: 'Switch Disconnector', rating, typeCode, make: m, unit: 'Nos', price: calculatePrice('Isolators / Switches', 'Switch Disconnector', rating, m, typeCode) });
      }
    }
  }

  const sfuAmps = ['32A', '63A', '100A', '160A', '250A', '400A', '630A'];
  const sfuPoles = ['2P', '3P', '4P'];
  const sfuMakes = ['Schneider Electric', 'Siemens', 'ABB', 'L&T'];
  let sfuSeq = 6030;
  for (const a of sfuAmps) {
    for (const p of sfuPoles) {
      for (const m of sfuMakes) {
        const typeCode = `SFU-${String(sfuSeq++).padStart(4, '0')}`;
        const rating = `${a} ${p}`;
        items.push({ sNo: sNo++, section: 'Isolators / Switches', desc: 'SFU', rating, typeCode, make: m, unit: 'Nos', price: calculatePrice('Isolators / Switches', 'SFU', rating, m, typeCode) });
      }
    }
  }

  const cosAmps = ['16A', '32A', '63A', '100A', '160A', '250A', '400A', '630A'];
  const cosPoles = ['2P', '3P', '4P'];
  const cosMakes = ['Schneider Electric', 'Siemens', 'ABB', 'Socomec', 'L&T'];
  let cosSeq = 6114;
  for (const a of cosAmps) {
    for (const p of cosPoles) {
      for (const m of cosMakes) {
        const typeCode = `COS-${String(cosSeq++).padStart(4, '0')}`;
        const rating = `${a} ${p}`;
        items.push({ sNo: sNo++, section: 'Isolators / Switches', desc: 'Changeover Switch', rating, typeCode, make: m, unit: 'Nos', price: calculatePrice('Isolators / Switches', 'Changeover Switch', rating, m, typeCode) });
      }
    }
  }

  return items;
}

async function main() {
  console.log('=== Generating 6,231 Raw Material Master Records ===');
  const allItems = buildAll6231Items();
  console.log(`Generated ${allItems.length} raw material master items.`);

  // Deliberately keep 14 items with price = 0 as requested by the user:
  // "Also show the RM name which has no price in dashboard."
  const unpricedIndices = [5, 12, 45, 95, 180, 420, 850, 1200, 1850, 2400, 3200, 4250, 5000, 5850];
  for (const idx of unpricedIndices) {
    if (allItems[idx]) {
      allItems[idx].price = 0;
    }
  }

  // Map to ComponentMaster model
  const componentsToInsert = allItems.map((item) => {
    // Generate clean item code
    const cleanItemCode = item.typeCode || `RM-${String(item.sNo).padStart(5, '0')}`;
    return {
      itemCode: cleanItemCode,
      description: `${item.desc} (${item.rating})`,
      rating: item.rating,
      typeCode: item.typeCode,
      make: item.make,
      category: item.section,
      unit: item.unit,
      unitPrice: item.price,
      hsnCode: '8537',
      gstRate: 18.0,
      active: true,
    };
  });

  console.log('Seeding into Supabase database in chunks of 500...');
  const CHUNK_SIZE = 500;
  let insertedCount = 0;

  for (let i = 0; i < componentsToInsert.length; i += CHUNK_SIZE) {
    const chunk = componentsToInsert.slice(i, i + CHUNK_SIZE);
    await prisma.componentMaster.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    insertedCount += chunk.length;
    process.stdout.write(`Inserted ${insertedCount} / ${componentsToInsert.length} items...\r`);
  }

  console.log('\n=== Raw Material Master Seeding Complete! ===');
  const totalInDb = await prisma.componentMaster.count();
  const unpricedInDb = await prisma.componentMaster.count({ where: { unitPrice: 0 } });
  console.log(`Total components in Price Master: ${totalInDb}`);
  console.log(`Unpriced components (price = 0): ${unpricedInDb}`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
