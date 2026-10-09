import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import bcrypt from 'bcryptjs';
import * as xlsx from 'xlsx';
import JSZip from 'jszip';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Check Admin Session
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized: Only system administrators can perform data purge operations.' },
        { status: 403 }
      );
    }

    // 2. Parse Request Body
    const body = await request.json();
    const { password, confirmPhrase, scope = 'ALL' } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Administrator password is required for security verification.' },
        { status: 400 }
      );
    }

    if (confirmPhrase !== 'DELETE-DATA' && confirmPhrase !== 'PURGE-DATA') {
      return NextResponse.json(
        { error: 'Confirmation phrase mismatch. You must type "DELETE-DATA" exactly.' },
        { status: 400 }
      );
    }

    // 3. Verify Admin Password via bcrypt
    const adminUser = await db.user.findUnique({
      where: { id: session.userId },
    });

    if (!adminUser || !adminUser.passwordHash) {
      return NextResponse.json(
        { error: 'Administrator account verification failed.' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, adminUser.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Incorrect administrator password. Authentication failed and data was not touched.' },
        { status: 401 }
      );
    }

    // 4. Fetch All Current Data to Generate Full Backup BEFORE Deletion
    const [components, finishedGoods, estimations] = await Promise.all([
      db.componentMaster.findMany({
        orderBy: { itemCode: 'asc' },
      }),
      db.finishedGood.findMany({
        include: {
          category: true,
          bomItems: {
            orderBy: { sNo: 'asc' },
          },
          variants: {
            include: {
              options: {
                orderBy: { displayOrder: 'asc' },
              },
            },
            orderBy: { displayOrder: 'asc' },
          },
        },
        orderBy: { modelNumber: 'asc' },
      }),
      db.estimation.findMany({
        include: {
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // 5. Generate Excel Workbooks in Exact Re-Importable Templates
    const zip = new JSZip();

    // -----------------------------------------------------------------
    // File 1: Price Master Catalog (Exact format for Bulk Import)
    // -----------------------------------------------------------------
    const priceMasterHeaders = [
      'Item Code',
      'Category',
      'Make / Brand',
      'Material Description',
      'Specification / Rating',
      'Type Code',
      'Unit',
      'Unit Price (INR)',
      'HSN Code',
      'GST %',
    ];
    const priceMasterRows = components.map((c) => [
      c.itemCode,
      c.category,
      c.make,
      c.description,
      c.rating || '',
      c.typeCode || '',
      c.unit,
      c.unitPrice,
      c.hsnCode || '8537',
      c.gstRate || 18,
    ]);
    const wsPrice = xlsx.utils.aoa_to_sheet([priceMasterHeaders, ...priceMasterRows]);
    wsPrice['!cols'] = [
      { wch: 22 },
      { wch: 24 },
      { wch: 16 },
      { wch: 42 },
      { wch: 22 },
      { wch: 22 },
      { wch: 8 },
      { wch: 18 },
      { wch: 12 },
      { wch: 8 },
    ];
    const wbPrice = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wbPrice, wsPrice, 'Price Master');
    const priceMasterBuffer = xlsx.write(wbPrice, { type: 'buffer', bookType: 'xlsx' });
    zip.file('01_Price_Master_Import_Template.xlsx', priceMasterBuffer);

    // -----------------------------------------------------------------
    // File 2: Master Finished Goods Catalog
    // -----------------------------------------------------------------
    const fgHeaders = [
      'Model Number',
      'Product Name',
      'Category Code',
      'Category Name',
      'Description',
      'Enclosure Height (mm)',
      'Enclosure Width (mm)',
      'Enclosure Depth (mm)',
      'IP Rating',
      'Form Rating',
      'BOM Material Cost (INR)',
      'Fabrication Cost (INR)',
      'Busbar Cost (INR)',
      'Wiring Cost (INR)',
      'Net Manufacturing Cost (INR)',
      'Final Ex-Works Price (INR)',
      'GST Amount (18%)',
      'Final Gross Price (INR)',
    ];
    const fgRows = finishedGoods.map((fg) => [
      fg.modelNumber,
      fg.name,
      fg.category?.code || '',
      fg.category?.name || '',
      fg.description || '',
      fg.enclosureHeight || 0,
      fg.enclosureWidth || 0,
      fg.enclosureDepth || 0,
      fg.ipRating || 'IP54',
      fg.formRating || 'Form 4B',
      fg.bomMaterialCost,
      fg.fabricationCost,
      fg.busbarCost,
      fg.wiringCost,
      fg.netManufacturingCost,
      fg.finalExWorksPrice,
      fg.gstAmount,
      fg.finalGrossPrice,
    ]);
    const wsFg = xlsx.utils.aoa_to_sheet([fgHeaders, ...fgRows]);
    wsFg['!cols'] = [
      { wch: 24 },
      { wch: 36 },
      { wch: 16 },
      { wch: 28 },
      { wch: 40 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 12 },
      { wch: 12 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 22 },
      { wch: 22 },
      { wch: 18 },
      { wch: 22 },
    ];
    const wbFg = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wbFg, wsFg, 'Finished Goods');
    const fgBuffer = xlsx.write(wbFg, { type: 'buffer', bookType: 'xlsx' });
    zip.file('02_Master_Finished_Goods.xlsx', fgBuffer);

    // -----------------------------------------------------------------
    // File 3: Consolidated BOM Items Master
    // -----------------------------------------------------------------
    const bomMasterHeaders = [
      'Model Number',
      'Product Name',
      'S.No',
      'Section / Sub-Assembly',
      'Material Description',
      'Specification / Rating',
      'Type Code',
      'Make / Brand',
      'Unit',
      'Quantity',
      'Unit Price (INR)',
      'Total Amount (INR)',
    ];
    const bomMasterRows: any[] = [];
    finishedGoods.forEach((fg) => {
      fg.bomItems.forEach((b) => {
        bomMasterRows.push([
          fg.modelNumber,
          fg.name,
          b.sNo,
          b.sectionName,
          b.description,
          b.rating || '',
          b.typeCode || '',
          b.make,
          b.unit,
          b.quantity,
          b.unitPrice,
          b.totalAmount,
        ]);
      });
    });
    const wsBomMaster = xlsx.utils.aoa_to_sheet([bomMasterHeaders, ...bomMasterRows]);
    wsBomMaster['!cols'] = [
      { wch: 24 },
      { wch: 32 },
      { wch: 8 },
      { wch: 24 },
      { wch: 38 },
      { wch: 20 },
      { wch: 20 },
      { wch: 16 },
      { wch: 10 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
    ];
    const wbBomMaster = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wbBomMaster, wsBomMaster, 'Consolidated BOM');
    const bomMasterBuffer = xlsx.write(wbBomMaster, { type: 'buffer', bookType: 'xlsx' });
    zip.file('03_Consolidated_BOM_List.xlsx', bomMasterBuffer);

    // -----------------------------------------------------------------
    // Folder: Individual BOM Files per Model (Exact BOM Upload Template)
    // -----------------------------------------------------------------
    const bomFolder = zip.folder('BOM_Upload_Templates_Per_Model');
    finishedGoods.forEach((fg) => {
      const singleBomHeaders = [
        'S.No',
        'Section / Sub-Assembly',
        'Material Description',
        'Specification / Rating',
        'Type Code',
        'Make / Brand',
        'Unit',
        'Quantity',
        'Unit Price (INR)',
        'Total Amount (INR)',
      ];
      const singleBomRows = fg.bomItems.map((b) => [
        b.sNo,
        b.sectionName,
        b.description,
        b.rating || '',
        b.typeCode || '',
        b.make,
        b.unit,
        b.quantity,
        b.unitPrice,
        b.totalAmount,
      ]);
      const wsSingle = xlsx.utils.aoa_to_sheet([singleBomHeaders, ...singleBomRows]);
      wsSingle['!cols'] = [
        { wch: 8 },
        { wch: 26 },
        { wch: 38 },
        { wch: 22 },
        { wch: 22 },
        { wch: 18 },
        { wch: 10 },
        { wch: 12 },
        { wch: 16 },
        { wch: 18 },
      ];
      const wbSingle = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wbSingle, wsSingle, 'Panel BOM Template');
      const singleBuffer = xlsx.write(wbSingle, { type: 'buffer', bookType: 'xlsx' });
      bomFolder?.file(`BOM_${fg.modelNumber}.xlsx`, singleBuffer);
    });

    // -----------------------------------------------------------------
    // File 4: Product Upgrade Variants & Options
    // -----------------------------------------------------------------
    const variantHeaders = [
      'Model Number',
      'Dimension / Feature Name',
      'Option Name',
      'Is Default',
      'Price Delta (INR)',
      'Description',
    ];
    const variantRows: any[] = [];
    finishedGoods.forEach((fg) => {
      fg.variants.forEach((dim) => {
        dim.options.forEach((opt) => {
          variantRows.push([
            fg.modelNumber,
            dim.dimensionName,
            opt.optionName,
            opt.isDefault ? 'YES' : 'NO',
            opt.priceDelta,
            opt.description || '',
          ]);
        });
      });
    });
    const wsVariant = xlsx.utils.aoa_to_sheet([variantHeaders, ...variantRows]);
    wsVariant['!cols'] = [
      { wch: 24 },
      { wch: 28 },
      { wch: 36 },
      { wch: 12 },
      { wch: 18 },
      { wch: 36 },
    ];
    const wbVariant = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wbVariant, wsVariant, 'Product Variants');
    const variantBuffer = xlsx.write(wbVariant, { type: 'buffer', bookType: 'xlsx' });
    zip.file('04_Product_Variants_Upgrades.xlsx', variantBuffer);

    // -----------------------------------------------------------------
    // File 5: Customer Estimations & Quotations
    // -----------------------------------------------------------------
    const estHeaders = [
      'Estimation Number',
      'Customer Name',
      'Company Name',
      'Phone',
      'Email',
      'Site Location',
      'Delivery Period',
      'Status',
      'Total Amount (INR)',
      'Created Date',
    ];
    const estRows = estimations.map((e) => [
      e.estimationNumber,
      e.customerName,
      e.companyName || '',
      e.phone || '',
      e.email || '',
      e.address || '',
      e.status,
      e.grandTotal,
      new Date(e.createdAt).toISOString().split('T')[0],
    ]);
    const wsEst = xlsx.utils.aoa_to_sheet([estHeaders, ...estRows]);
    wsEst['!cols'] = [
      { wch: 20 },
      { wch: 24 },
      { wch: 28 },
      { wch: 16 },
      { wch: 24 },
      { wch: 22 },
      { wch: 18 },
      { wch: 14 },
      { wch: 20 },
      { wch: 14 },
    ];
    const wbEst = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wbEst, wsEst, 'Estimations');
    const estBuffer = xlsx.write(wbEst, { type: 'buffer', bookType: 'xlsx' });
    zip.file('05_Customer_Estimations.xlsx', estBuffer);

    // -----------------------------------------------------------------
    // File 6: Restore & Re-Import Instructions Readme
    // -----------------------------------------------------------------
    const readmeContent = `================================================================================
SVG ELECTRIC & CONTROL PRODUCTS - SYSTEM DATA BACKUP & RESTORE GUIDE
================================================================================
Timestamp: ${new Date().toISOString()}
Generated By: ${adminUser.email} (${adminUser.name})
Purge Scope Executed: ${scope}

BACKUP CONTENTS & HOW TO RE-IMPORT:

1. '01_Price_Master_Import_Template.xlsx'
   - Contains all raw materials and bought-out components with exact specifications, makes, and pricing.
   - TO RE-IMPORT:
     a) Go to Central Price Master (/admin/price-master)
     b) Click "Bulk Excel Import"
     c) Upload this file directly. All component prices, ratings, and makes will be restored.

2. '02_Master_Finished_Goods.xlsx'
   - Complete finished goods catalog with 4-stage costings, enclosure dimensions, and ratings.

3. '03_Consolidated_BOM_List.xlsx' & Folder 'BOM_Upload_Templates_Per_Model/'
   - Every product's full Bill of Materials in the exact template format.
   - TO RE-IMPORT A PANEL BOM:
     a) Open Create Product or FG Costing (/admin/finished-goods/new)
     b) Click "Bulk Excel BOM Upload"
     c) Select any file from 'BOM_Upload_Templates_Per_Model/BOM_<ModelNumber>.xlsx'
     d) The system automatically maps components, matches with Price Master, and computes manufacturing costs.

4. '04_Product_Variants_Upgrades.xlsx'
   - Contains all upgrade dimensions, option deltas, and default configurations.

5. '05_Customer_Estimations.xlsx'
   - Full historical commercial quotes and proposals.

SYSTEM INTEGRITY NOTE:
Admin login accounts, company contact info, GST settings, and audit logs were preserved.
================================================================================
`;
    zip.file('README_RESTORE_INSTRUCTIONS.txt', readmeContent);

    // -----------------------------------------------------------------
    // Generate the Compressed ZIP Archive Buffer
    // -----------------------------------------------------------------
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });

    // 6. Execute Transactional Database Deletion ONLY AFTER ZIP is Ready!
    await db.$transaction(async (tx) => {
      if (scope === 'ALL' || scope === 'PRODUCTS') {
        // Cascade delete BOM items, Variant options, Variant dimensions, and Finished goods
        await tx.fgBomItem.deleteMany();
        await tx.fgVariantOption.deleteMany();
        await tx.fgVariantDimension.deleteMany();
        await tx.finishedGood.deleteMany();
      }

      if (scope === 'ALL' || scope === 'PRICE_MASTER') {
        if (scope === 'PRICE_MASTER') {
          // If only price master is purged, nullify reference from BOM items first
          await tx.fgBomItem.updateMany({
            data: { componentId: null },
          });
        }
        await tx.componentMaster.deleteMany();
      }

      if (scope === 'ALL' || scope === 'ESTIMATIONS') {
        await tx.estimationItemSpecification.deleteMany();
        await tx.estimationItem.deleteMany();
        await tx.estimation.deleteMany();
      }

      // Record immutable Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: 'SYSTEM_PURGE',
          entity: 'SYSTEM_DATA',
          details: {
            scope,
            timestamp: new Date().toISOString(),
            adminEmail: adminUser.email,
            recordsPurged: {
              components: scope === 'ALL' || scope === 'PRICE_MASTER' ? components.length : 0,
              finishedGoods: scope === 'ALL' || scope === 'PRODUCTS' ? finishedGoods.length : 0,
              estimations: scope === 'ALL' || scope === 'ESTIMATIONS' ? estimations.length : 0,
            },
          },
        },
      });
    });

    // 7. Return the ZIP Archive as an Attachment Download
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `SVG_Electric_Backup_${scope}_${timestampStr}.zip`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Purge-Status': 'SUCCESS',
        'X-Purge-Scope': scope,
        'X-Purge-Components': String(components.length),
        'X-Purge-FinishedGoods': String(finishedGoods.length),
        'X-Purge-Estimations': String(estimations.length),
      },
    });
  } catch (error: any) {
    console.error('[System Purge] Error executing purge and backup:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during data backup and purge execution.' },
      { status: 500 }
    );
  }
}
