import * as XLSX from 'xlsx';
import { db } from '@/lib/db';
import { buildCriteriaHash } from '@/lib/pricing/pricing-engine';

export class ExcelService {
  /**
   * Generates blank/sample Excel templates for bulk data import.
   */
  static generateTemplate(type: 'products' | 'specifications' | 'pricing-rules'): Buffer {
    const wb = XLSX.utils.book_new();

    if (type === 'products') {
      const headers = [
        ['Product Code', 'Product Name', 'Category Code', 'Description', 'Active (YES/NO)'],
        ['MCC-DEMO-02', 'High Voltage MCC Panel', 'CAT-MCC', '3.3kV Motor Control Center with Vacuum Contactors', 'YES'],
        ['PLC-DEMO-02', 'Compact Machine Controller', 'CAT-PLC', 'Compact automation panel for packaging machines', 'YES'],
      ];
      const ws = XLSX.utils.aoa_to_sheet(headers);
      XLSX.utils.book_append_sheet(wb, ws, 'Products Template');
    } else if (type === 'specifications') {
      const headers = [
        ['Specification Code', 'Specification Name', 'Input Type (DROPDOWN/TEXT/NUMBER/BOOLEAN)', 'Unit', 'Options (Comma-Separated)', 'Active (YES/NO)'],
        ['ALTITUDE', 'Operating Altitude', 'DROPDOWN', 'm', 'Up to 1000m, Up to 2000m, Above 2000m', 'YES'],
        ['PAINT_SHADE', 'Powder Coating Shade', 'DROPDOWN', '', 'RAL 7032, RAL 7035, Siemens Grey', 'YES'],
      ];
      const ws = XLSX.utils.aoa_to_sheet(headers);
      XLSX.utils.book_append_sheet(wb, ws, 'Specifications Template');
    } else if (type === 'pricing-rules') {
      const headers = [
        ['Rule Code', 'Product Code', 'Base Price (INR)', 'Specification Criteria (SPEC:VALUE | SPEC:VALUE)', 'Notes'],
        ['PR-SAMPLE-01', 'MCC-IND-01', '275000', 'CURRENT_RATING:1250A | VOLTAGE:415V | FORM:FORM_2B | IP_RATING:IP54 | STARTER_TYPE:STAR_DELTA | BUSBAR_MATERIAL:ALUMINIUM', '[DEMO DATA] Sample 1250A rule'],
      ];
      const ws = XLSX.utils.aoa_to_sheet(headers);
      XLSX.utils.book_append_sheet(wb, ws, 'Pricing Rules Template');
    }

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Parses and validates uploaded Excel files for products.
   */
  static async validateAndImportProducts(buffer: Buffer): Promise<{ success: boolean; importedCount: number; errors: string[] }> {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });

    if (rows.length < 2) {
      return { success: false, importedCount: 0, errors: ['File contains no data rows.'] };
    }

    const categories = await db.productCategory.findMany();
    const catMap = new Map(categories.map(c => [c.code.toUpperCase(), c.id]));

    const errors: string[] = [];
    const validProducts: any[] = [];

    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || !row[0]) continue;

      const code = String(row[0]).trim();
      const name = String(row[1] || '').trim();
      const catCode = String(row[2] || '').trim().toUpperCase();
      const description = String(row[3] || '').trim();
      const activeStr = String(row[4] || 'YES').trim().toUpperCase();

      if (!code) {
        errors.push(`Row ${i + 1}: Missing Product Code`);
        continue;
      }
      if (!name) {
        errors.push(`Row ${i + 1}: Missing Product Name`);
        continue;
      }
      if (!catMap.has(catCode)) {
        errors.push(`Row ${i + 1}: Unknown Category Code "${catCode}". Available: ${Array.from(catMap.keys()).join(', ')}`);
        continue;
      }

      validProducts.push({
        productCode: code,
        name,
        categoryId: catMap.get(catCode)!,
        description: description || null,
        active: activeStr === 'YES' || activeStr === 'TRUE',
      });
    }

    if (errors.length > 0) {
      return { success: false, importedCount: 0, errors };
    }

    let count = 0;
    for (const p of validProducts) {
      await db.product.upsert({
        where: { productCode: p.productCode },
        update: { name: p.name, categoryId: p.categoryId, description: p.description, active: p.active },
        create: p,
      });
      count++;
    }

    return { success: true, importedCount: count, errors: [] };
  }

  /**
   * Parses and validates uploaded Excel files for pricing rules.
   */
  static async validateAndImportPricingRules(buffer: Buffer): Promise<{ success: boolean; importedCount: number; errors: string[] }> {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });

    if (rows.length < 2) {
      return { success: false, importedCount: 0, errors: ['File contains no data rows.'] };
    }

    const products = await db.product.findMany();
    const prodMap = new Map(products.map(p => [p.productCode.toUpperCase(), p.id]));

    const errors: string[] = [];
    const validRules: any[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || !row[0]) continue;

      const ruleCode = String(row[0]).trim();
      const productCode = String(row[1] || '').trim().toUpperCase();
      const priceVal = parseFloat(String(row[2]));
      const specStr = String(row[3] || '').trim();
      const notes = String(row[4] || '').trim();

      if (!ruleCode) {
        errors.push(`Row ${i + 1}: Missing Rule Code`);
        continue;
      }
      if (!prodMap.has(productCode)) {
        errors.push(`Row ${i + 1}: Product Code "${productCode}" not found.`);
        continue;
      }
      if (isNaN(priceVal) || priceVal < 0) {
        errors.push(`Row ${i + 1}: Invalid Base Price "${row[2]}"`);
        continue;
      }
      if (!specStr) {
        errors.push(`Row ${i + 1}: Missing Specification Criteria string`);
        continue;
      }

      // Parse criteria e.g. "CURRENT_RATING:1000A | VOLTAGE:415V"
      const specMap: Record<string, string> = {};
      const parts = specStr.split('|');
      let specError = false;

      for (const part of parts) {
        const [k, v] = part.split(':').map(s => s.trim());
        if (!k || !v) {
          errors.push(`Row ${i + 1}: Malformed spec pair "${part}". Format must be CODE:VALUE`);
          specError = true;
          break;
        }
        specMap[k] = v;
      }

      if (specError) continue;

      const criteriaHash = buildCriteriaHash(specMap);

      validRules.push({
        ruleCode,
        productId: prodMap.get(productCode)!,
        specCriteria: specMap,
        criteriaHash,
        basePrice: priceVal,
        notes: notes || null,
        active: true,
      });
    }

    if (errors.length > 0) {
      return { success: false, importedCount: 0, errors };
    }

    let count = 0;
    for (const r of validRules) {
      await db.pricingRule.upsert({
        where: { ruleCode: r.ruleCode },
        update: {
          productId: r.productId,
          specCriteria: r.specCriteria,
          criteriaHash: r.criteriaHash,
          basePrice: r.basePrice,
          notes: r.notes,
          active: true,
        },
        create: r,
      });
      count++;
    }

    return { success: true, importedCount: count, errors: [] };
  }

  /**
   * Exports master products and current pricing to Excel.
   */
  static async exportMasterData(): Promise<Buffer> {
    const wb = XLSX.utils.book_new();

    // 1. Products Sheet
    const products = await db.product.findMany({
      include: { category: true },
      orderBy: { productCode: 'asc' },
    });
    const prodRows = [
      ['Product Code', 'Product Name', 'Category Code', 'Category Name', 'Description', 'Active'],
      ...products.map(p => [p.productCode, p.name, p.category.code, p.category.name, p.description || '', p.active ? 'YES' : 'NO']),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(prodRows), 'Products');

    // 2. Specifications Sheet
    const specs = await db.specification.findMany({
      include: { options: { orderBy: { displayOrder: 'asc' } } },
      orderBy: { displayOrder: 'asc' },
    });
    const specRows = [
      ['Code', 'Name', 'Input Type', 'Unit', 'Options', 'Active'],
      ...specs.map(s => [
        s.code,
        s.name,
        s.inputType,
        s.unit || '',
        s.options.map(o => `${o.label} (${o.value})`).join('; '),
        s.active ? 'YES' : 'NO',
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(specRows), 'Specifications');

    // 3. Pricing Rules Sheet
    const rules = await db.pricingRule.findMany({
      include: { product: true },
      orderBy: { ruleCode: 'asc' },
    });
    const ruleRows = [
      ['Rule Code', 'Product Code', 'Product Name', 'Base Price (INR)', 'Criteria Hash', 'Notes', 'Active'],
      ...rules.map(r => [
        r.ruleCode,
        r.product.productCode,
        r.product.name,
        r.basePrice,
        r.criteriaHash,
        r.notes || '',
        r.active ? 'YES' : 'NO',
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ruleRows), 'Pricing Rules');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
}
