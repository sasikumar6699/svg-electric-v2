import { jsPDF } from 'jspdf';
import autoTableModule from 'jspdf-autotable';
const autoTable = autoTableModule.default?.default || autoTableModule.default || autoTableModule;
import fs from 'fs';
import path from 'path';

async function generateOfficialBRD() {
  console.log('Generating Official 5-Page SVG Electric BRD PDF...');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 16;
  const contentWidth = pageWidth - margin * 2; // 178mm

  // Colors
  const COLOR_NAVY = [15, 23, 42];     // #0F172A
  const COLOR_RED = [220, 38, 38];     // #DC2626 (ElectCare Red)
  const COLOR_BLUE = [2, 110, 199];    // #026EC7 (Brand Blue)
  const COLOR_SLATE = [51, 65, 85];    // #334155
  const COLOR_MUTED = [100, 116, 139]; // #64748B
  const COLOR_LIGHT = [248, 250, 252]; // #F8FAFC
  const COLOR_BORDER = [226, 232, 240];// #E2E8F0

  // Read ElectCare Logo
  let logoB64 = null;
  const logoPath = path.join(process.cwd(), 'public', 'logo.jpg');
  if (fs.existsSync(logoPath)) {
    const buf = fs.readFileSync(logoPath);
    logoB64 = `data:image/jpeg;base64,${buf.toString('base64')}`;
  }

  // Helper for Section Titles with Vertical Indicator Bar
  const drawSectionTitle = (title, y) => {
    // Vertical accent bar (4mm x 5.5mm)
    doc.setFillColor(...COLOR_NAVY);
    doc.rect(margin, y - 4.5, 2.5, 5.5, 'F');
    doc.setFillColor(...COLOR_RED);
    doc.rect(margin + 2.5, y - 4.5, 1, 5.5, 'F');

    // Title text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLOR_NAVY);
    doc.text(title, margin + 6, y);
    return y + 3;
  };

  // Helper for running header (pages 2-5)
  const drawRunningHeader = (pageNum) => {
    // Navy top block
    doc.setFillColor(...COLOR_NAVY);
    doc.rect(margin, 12, contentWidth, 7, 'F');
    // Red thin bottom accent stripe
    doc.setFillColor(...COLOR_RED);
    doc.rect(margin, 19, contentWidth, 0.8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('SVG ELECTRIC & CONTROL PRODUCTS', margin + 3, 16.5);
    doc.text('BUSINESS REQUIREMENTS DOCUMENT (BRD)', pageWidth - margin - 3, 16.5, { align: 'right' });
  };

  // Helper for running footer (pages 1-5)
  const drawRunningFooter = (pageNum) => {
    doc.setDrawColor(...COLOR_BORDER);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_MUTED);
    doc.text('Confidential — For Internal Use Only', margin, pageHeight - 7.5);
    doc.text(`Page ${pageNum} of 5`, pageWidth - margin, pageHeight - 7.5, { align: 'right' });
  };

  // =========================================================================
  // PAGE 1: TITLE, DOCUMENT CONTROL & EXECUTIVE SUMMARY
  // =========================================================================
  console.log('Building Page 1...');

  // 1. Logo at Top Center
  if (logoB64) {
    const logoW = 54;
    const logoH = 26;
    const logoX = (pageWidth - logoW) / 2;
    doc.addImage(logoB64, 'JPEG', logoX, 14, logoW, logoH);
  }

  // 2. Enterprise Banner Bar
  let yPos = 45;
  doc.setFillColor(...COLOR_NAVY);
  doc.rect(margin, yPos, contentWidth, 7.5, 'F');
  // Red thin accent
  doc.setFillColor(...COLOR_RED);
  doc.rect(margin, yPos + 7.5, contentWidth, 0.8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('ENTERPRISE APPLICATION SPECIFICATION', pageWidth / 2, yPos + 5, { align: 'center' });

  // 3. Document Title Block
  yPos += 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...COLOR_NAVY);
  doc.text('BUSINESS REQUIREMENTS DOCUMENT (BRD)', pageWidth / 2, yPos, { align: 'center' });

  yPos += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLOR_SLATE);
  doc.text('Product Catalog, Technical Specifications, Pricing & Sales Discovery System', pageWidth / 2, yPos, { align: 'center' });

  yPos += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLOR_BLUE);
  doc.text('Client: SVG Electric & Control Products (India)', pageWidth / 2, yPos, { align: 'center' });

  // 4. Section: Document Control Information
  yPos += 11;
  drawSectionTitle('DOCUMENT CONTROL INFORMATION', yPos);

  const docControlData = [
    ['Document Reference:', 'BRD-SVG-ELE-2026-V1'],
    ['System Name:', 'SVG Electric Estimation & Product Management System'],
    ['Target Audience:', 'Executive Management, Sales Engineers, Software Engineering Team'],
    ['Scope Revision:', 'Version 1.0 (Streamlined Admin Product Entry & Sales Price Finder)'],
    ['Document Owner:', 'Principal Solutions Architect & Engineering Lead'],
    ['Publication Date:', 'September 2026'],
    ['Document Status:', 'Need Approval'],
  ];

  autoTable(doc, {
    startY: yPos + 2,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 2,
      lineColor: COLOR_BORDER,
      lineWidth: 0.2,
      textColor: COLOR_SLATE,
    },
    columnStyles: {
      0: { cellWidth: 52, fontStyle: 'bold', textColor: COLOR_NAVY, fillColor: [248, 250, 252] },
      1: { cellWidth: contentWidth - 52 },
    },
    body: docControlData,
    didParseCell: (data) => {
      if (data.row.index === 6 && data.column.index === 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [194, 65, 12]; // Amber/orange for "Need Approval"
      }
    },
  });

  yPos = doc.lastAutoTable.finalY + 8;

  // 5. Section: 1. Executive Summary & Project Background
  drawSectionTitle('1. EXECUTIVE SUMMARY & PROJECT BACKGROUND', yPos);
  yPos += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_SLATE);
  const p1 =
    'SVG Electric & Control Products (India) is an established industrial manufacturer specializing in Motor Control Centers (MCC), Power Control Centers (PCC), Variable Frequency Drive (VFD) panels, Automation/PLC cabinets, APFC power factor correction capacitor switchboards, and distribution systems.';
  const p1Lines = doc.splitTextToSize(p1, contentWidth);
  doc.text(p1Lines, margin, yPos);
  yPos += p1Lines.length * 4.2 + 2;

  const p2 =
    'To accelerate sales cycle velocity and eliminate pricing bottlenecks, SVG Electric commissioned this internal web application. While earlier iterations featured heavy multistage estimation approval workflows, customer CRM databases, and rule matrices, client field operations identified that sales engineers primarily require an instantaneous, high-precision Product Search & Price Discovery Engine. Concurrently, administrative staff require an agile Product Catalog Entry Console where technical parameters, direct final prices, and engineering drawings/PDF datasheets can be entered in minutes.';
  const p2Lines = doc.splitTextToSize(p2, contentWidth);
  doc.text(p2Lines, margin, yPos);
  yPos += p2Lines.length * 4.2 + 2;

  const p3 =
    'This BRD establishes the definitive operational, functional, and technical blueprint for the deployed version 1.0 system.';
  const p3Lines = doc.splitTextToSize(p3, contentWidth);
  doc.text(p3Lines, margin, yPos);
  yPos += p3Lines.length * 4.2 + 4;

  // 6. Confidentiality Notice Box
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(...COLOR_BORDER);
  doc.roundedRect(margin, yPos, contentWidth, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_NAVY);
  doc.text('CONFIDENTIALITY NOTICE:', margin + 4, yPos + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_MUTED);
  const confText =
    'This document contains proprietary business logic, data models, and architectural specifications belonging to SVG Electric & Control Products. No part of this publication may be reproduced, transmitted, or distributed without prior written consent.';
  const confLines = doc.splitTextToSize(confText, contentWidth - 8);
  doc.text(confLines, margin + 4, yPos + 9.5);

  drawRunningFooter(1);

  // =========================================================================
  // PAGE 2: TABLE OF CONTENTS, SCOPE ANALYSIS & USER PERSONAS
  // =========================================================================
  doc.addPage();
  console.log('Building Page 2...');
  drawRunningHeader(2);

  yPos = 27;

  // 1. Table of Contents
  drawSectionTitle('TABLE OF CONTENTS', yPos);
  yPos += 2;

  const tocRows = [
    ['1. Executive Summary & Project Background', 'Page 1'],
    ['2. Business Problem & Transformed Scope Analysis', 'Page 2'],
    ['3. User Personas & Role-Based Access Control (RBAC)', 'Page 2'],
    ['4. Functional Requirements Specification (FR-1 through FR-7)', 'Page 3'],
    ['5. Technical Architecture & Technology Stack', 'Page 4'],
    ['6. Data Dictionary (Core Product Model)', 'Page 4'],
    ['7. API Architecture & Endpoint Contracts', 'Page 5'],
    ['8. Non-Functional Requirements (Performance, Security, Reliability)', 'Page 5'],
    ['9. Verification & Approval Sign-Off Matrix', 'Page 5'],
  ];

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [['SECTION NAME', 'PAGE']],
    body: tocRows,
    headStyles: { fillColor: COLOR_NAVY, fontSize: 8, fontStyle: 'bold', textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: contentWidth - 25, fontSize: 8, textColor: COLOR_SLATE },
      1: { cellWidth: 25, halign: 'right', fontSize: 8, textColor: COLOR_SLATE },
    },
    styles: { cellPadding: 1.6, lineColor: COLOR_BORDER, lineWidth: 0.2 },
    alternateRowStyles: { fillColor: COLOR_LIGHT },
  });

  yPos = doc.lastAutoTable.finalY + 8;

  // 2. Section: 2. Business Problem & Scope Analysis
  drawSectionTitle('2. BUSINESS PROBLEM & SCOPE ANALYSIS', yPos);
  yPos += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(...COLOR_SLATE);
  const scopeDesc =
    'Historical electrical estimation workflows involved manual lookups across static spreadsheets, delays in waiting for admin approval, and inability to quickly answer customer technical inquiries regarding specific ratings (e.g. "What is our price for an 800A IP54 MCC panel?").';
  const scopeLines = doc.splitTextToSize(scopeDesc, contentWidth);
  doc.text(scopeLines, margin, yPos);
  yPos += scopeLines.length * 3.8 + 2;

  const scopeComparisonData = [
    ['Pricing Methodology', 'Complex formula combination matrix', 'Direct Admin Final Price per product entry'],
    ['Technical Specs', 'Static dropdown attributes', 'Dynamic Key-Value Spec Builder + Quick suggestions'],
    ['Technical Attachments', 'None', 'Direct Image & PDF datasheet upload (<25MB)'],
    ['Sales Workflow', 'Draft estimation -> Submit -> Admin Approval', 'Instant keyword & parameter-based price discovery'],
    ['Client Submittals', 'Generic multi-page estimation quote', 'Branded Technical Spec Sheet with optional price toggle'],
  ];

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [['CAPABILITY AREA', 'PHASE 1 LEGACY MODEL', 'PHASE 2 STREAMLINED MODEL (APPROVED)']],
    body: scopeComparisonData,
    headStyles: { fillColor: COLOR_NAVY, fontSize: 8, fontStyle: 'bold', textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold', textColor: COLOR_NAVY, fontSize: 7.8 },
      1: { cellWidth: 58, fontSize: 7.8, textColor: COLOR_MUTED },
      2: { cellWidth: contentWidth - 100, fontSize: 7.8, textColor: COLOR_SLATE, fontStyle: 'bold' },
    },
    styles: { cellPadding: 1.8, lineColor: COLOR_BORDER, lineWidth: 0.2 },
    alternateRowStyles: { fillColor: COLOR_LIGHT },
  });

  yPos = doc.lastAutoTable.finalY + 8;

  // 3. Section: 3. User Personas & Role-Based Access Control (RBAC)
  drawSectionTitle('3. USER PERSONAS & ROLE-BASED ACCESS CONTROL (RBAC)', yPos);
  yPos += 2;

  const rbacData = [
    [
      'ADMINISTRATOR\n(Engineering & Operations Head)',
      '• Create, modify, and delete product panel entries.\n• Configure dynamic technical specifications (Current, Voltage, IP, Form, Busbar).\n• Set final commercial prices in Indian Rupees.\n• Upload panel photographs and PDF engineering drawings.\n• Manage user logins and audit logs.',
      '/dashboard (Overview)\n/admin/products\n/admin/users\n/admin/settings',
    ],
    [
      'SALES ENGINEER\n(Field Technical Sales)',
      '• Real-time keyword search across panel models and specifications.\n• Filter panels by category and electrical parameters (e.g. 800A, 415V).\n• Retrieve exact final prices immediately during client calls.\n• Preview/download technical PDF datasheets and GA drawings.\n• Generate printable technical submittals (with or without price).',
      '/dashboard (Product Search & Price Finder)',
    ],
  ];

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [['PERSONA', 'PRIMARY OBJECTIVES & CAPABILITIES', 'ASSIGNED ROUTE ACCESS']],
    body: rbacData,
    headStyles: { fillColor: COLOR_NAVY, fontSize: 8, fontStyle: 'bold', textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold', textColor: COLOR_NAVY, fontSize: 7.8 },
      1: { cellWidth: 84, fontSize: 7.8, textColor: COLOR_SLATE },
      2: { cellWidth: contentWidth - 126, fontStyle: 'italic', fontSize: 7.8, textColor: COLOR_BLUE },
    },
    styles: { cellPadding: 2, lineColor: COLOR_BORDER, lineWidth: 0.2 },
    alternateRowStyles: { fillColor: COLOR_LIGHT },
  });

  drawRunningFooter(2);

  // =========================================================================
  // PAGE 3: FUNCTIONAL REQUIREMENTS SPECIFICATION
  // =========================================================================
  doc.addPage();
  console.log('Building Page 3...');
  drawRunningHeader(3);

  yPos = 27;

  drawSectionTitle('4. FUNCTIONAL REQUIREMENTS SPECIFICATION', yPos);
  yPos += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(...COLOR_SLATE);
  const frIntro =
    'The following functional requirements govern the complete operation of the Version 1.0 system across authentication, catalog management, pricing, files, and discovery.';
  doc.text(frIntro, margin, yPos);
  yPos += 4;

  const frData = [
    [
      'FR-1: Authentication & RBAC',
      'High',
      'The system shall authenticate users via email and bcrypt-hashed password, issuing secure HTTP-only JWT cookies. Middleware guards must intercept and enforce role boundaries (e.g. restricting /admin routes to ADMIN role).',
    ],
    [
      'FR-2: Product Master Entry & Specs Builder',
      'High',
      'Admin shall create products with Product Code (SKU), Name, Category, and Description. An interactive Specifications Builder must allow arbitrary Key-Value technical parameters with one-click electrical suggestions (Rated Current, Operating Voltage, Ingress Protection, Busbar Material, Form of Separation, Incomer Switchgear).',
    ],
    [
      'FR-3: Direct Final Commercial Pricing',
      'High',
      'Admin shall directly specify the final ex-works unit price in INR for each product entry. The system must format this into Indian numbering standard (e.g., Rs. 3,85,000) and store it in the database.',
    ],
    [
      'FR-4: Multi-Format Attachment Pipeline',
      'High',
      'The system shall provide an asynchronous upload API (/api/upload) supporting images (.jpg, .jpeg, .png, .webp) and PDF documents (.pdf) up to 25MB. Files must be sanitized, assigned timestamped unique filenames, and stored in public/uploads/ with full preview and download capabilities.',
    ],
    [
      'FR-5: Sales Search & Filter Engine',
      'High',
      'Sales engineers shall search products in real-time. The query parser must search across product codes, product names, categories, descriptions, and dynamic JSON specification values. Parameter-specific dropdowns must allow filtering by exact ratings.',
    ],
    [
      'FR-6: Dual-Mode Catalog Presentation',
      'Medium',
      'The UI shall support instantaneous switching between Visual Grid Cards (featuring visual thumbnails, specs badges, and prominent price tags) and Dense Technical Tables (optimized for rapid multi-item comparisons).',
    ],
    [
      'FR-7: Printable Technical Spec Sheet',
      'High',
      'The system must render a publication-grade technical datasheet modal. A prominent "Show Price on Print" toggle must allow users to include or omit commercial pricing. When printing via window.print(), background navigation must hide, leaving a clean A4 technical submittal.',
    ],
  ];

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [['REQ ID & FEATURE', 'PRIORITY', 'DETAILED FUNCTIONAL REQUIREMENT']],
    body: frData,
    headStyles: { fillColor: COLOR_NAVY, fontSize: 8, fontStyle: 'bold', textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 44, fontStyle: 'bold', textColor: COLOR_NAVY, fontSize: 7.8 },
      1: { cellWidth: 18, halign: 'center', fontSize: 7.8 },
      2: { cellWidth: contentWidth - 62, fontSize: 7.8, textColor: COLOR_SLATE },
    },
    styles: { cellPadding: 2.2, lineColor: COLOR_BORDER, lineWidth: 0.2 },
    alternateRowStyles: { fillColor: COLOR_LIGHT },
    didParseCell: (data) => {
      if (data.column.index === 1 && data.section === 'body') {
        const val = data.cell.raw;
        if (val === 'High') {
          data.cell.styles.textColor = COLOR_RED;
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'Medium') {
          data.cell.styles.textColor = [13, 148, 136]; // Teal
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  drawRunningFooter(3);

  // =========================================================================
  // PAGE 4: TECHNICAL ARCHITECTURE & DATA DICTIONARY
  // =========================================================================
  doc.addPage();
  console.log('Building Page 4...');
  drawRunningHeader(4);

  yPos = 27;

  // 1. Technical System Architecture
  drawSectionTitle('5. TECHNICAL SYSTEM ARCHITECTURE & TECHNOLOGY STACK', yPos);
  yPos += 2;

  const techStackData = [
    ['Frontend Framework', 'Next.js 14 (App Router) + React 18', 'Server-Side Rendering, fast client hydration, robust route nesting'],
    ['Styling & Design System', 'Tailwind CSS + Lucide Icons', 'Industrial design system, consistent brand palette, print stylesheets'],
    ['Backend API Layer', 'Next.js Route Handlers (Node.js)', 'Secure RESTful endpoints, streaming multipart file uploads'],
    ['ORM & Database Layer', 'Prisma ORM + PostgreSQL', 'Type-safe schema, relational integrity, native JSON column support'],
    ['Authentication', 'JWT (jose) + Bcrypt.js', 'Stateless session tokens, HTTP-only cookie security, salted hashing'],
  ];

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [['LAYER / COMPONENT', 'SELECTED TECHNOLOGY', 'ARCHITECTURAL RATIONALE']],
    body: techStackData,
    headStyles: { fillColor: COLOR_NAVY, fontSize: 8, fontStyle: 'bold', textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 44, fontStyle: 'bold', textColor: COLOR_NAVY, fontSize: 7.8 },
      1: { cellWidth: 50, fontStyle: 'bold', textColor: COLOR_BLUE, fontSize: 7.8 },
      2: { cellWidth: contentWidth - 94, fontSize: 7.8, textColor: COLOR_SLATE },
    },
    styles: { cellPadding: 2, lineColor: COLOR_BORDER, lineWidth: 0.2 },
    alternateRowStyles: { fillColor: COLOR_LIGHT },
  });

  yPos = doc.lastAutoTable.finalY + 8;

  // 2. Database Schema & Data Dictionary
  drawSectionTitle('6. DATABASE SCHEMA & DATA DICTIONARY', yPos);
  yPos += 2;

  const dataDictData = [
    ['id', 'String', 'PK, UUID', 'Unique immutable product identifier'],
    ['productCode', 'String', 'Unique, Indexed', 'Commercial model SKU (e.g. MCC-IND-01)'],
    ['name', 'String', 'Required', 'Full descriptive product title'],
    ['price', 'Float', 'Default 0.0', 'Final ex-works commercial unit price in INR'],
    ['categoryId', 'String', 'FK -> Category', 'Relational link to panel category'],
    ['specifications', 'Json', 'Nullable, Array', 'Structured list of [{ name: string, value: string }]'],
    ['fileUrl', 'String', 'Nullable', 'Path to uploaded drawing/datasheet in /uploads/'],
    ['fileName', 'String', 'Nullable', 'Original user file name with extension'],
    ['fileType', 'String', 'IMAGE | PDF', 'MIME classification for appropriate UI rendering'],
    ['active', 'Boolean', 'Default true', 'Controls sales catalog search visibility'],
  ];

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [['FIELD NAME', 'TYPE', 'CONSTRAINTS', 'BUSINESS PURPOSE']],
    body: dataDictData,
    headStyles: { fillColor: COLOR_NAVY, fontSize: 8, fontStyle: 'bold', textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 32, fontStyle: 'bold', textColor: COLOR_NAVY, fontSize: 7.8 },
      1: { cellWidth: 22, fontSize: 7.8, textColor: COLOR_SLATE },
      2: { cellWidth: 32, fontStyle: 'italic', fontSize: 7.8, textColor: COLOR_MUTED },
      3: { cellWidth: contentWidth - 86, fontSize: 7.8, textColor: COLOR_SLATE },
    },
    styles: { cellPadding: 1.8, lineColor: COLOR_BORDER, lineWidth: 0.2 },
    alternateRowStyles: { fillColor: COLOR_LIGHT },
  });

  drawRunningFooter(4);

  // =========================================================================
  // PAGE 5: API CONTRACTS, NFR & SIGN-OFF MATRIX
  // =========================================================================
  doc.addPage();
  console.log('Building Page 5...');
  drawRunningHeader(5);

  yPos = 27;

  // 1. API Architecture
  drawSectionTitle('7. API ARCHITECTURE & ENDPOINT CONTRACTS', yPos);
  yPos += 2;

  const apiData = [
    ['/api/auth/login', 'POST', 'Public', 'Validates credentials; sets HTTP-only auth_session cookie'],
    ['/api/auth/logout', 'POST', 'All', 'Invalidates session cookie; redirects to /login'],
    ['/api/upload', 'POST', 'Authenticated', 'Multipart form data (file); returns {fileUrl, fileName, fileType, fileSize}'],
    ['/api/admin/products', 'GET, POST, PUT,\nDELETE', 'ADMIN', 'Full CRUD on product entries with specs, price, and attachments'],
    ['/api/products/search', 'GET', 'SALES / ADMIN', 'Searches by keyword q, categoryId, specName, specValue; returns matching products'],
  ];

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [['ENDPOINT', 'METHOD', 'AUTH ROLE', 'PAYLOAD & RESPONSE SUMMARY']],
    body: apiData,
    headStyles: { fillColor: COLOR_NAVY, fontSize: 8, fontStyle: 'bold', textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 44, fontStyle: 'bold', textColor: COLOR_BLUE, fontSize: 7.8 },
      1: { cellWidth: 26, fontSize: 7.8, textColor: COLOR_SLATE },
      2: { cellWidth: 26, fontStyle: 'bold', fontSize: 7.8, textColor: COLOR_NAVY },
      3: { cellWidth: contentWidth - 96, fontSize: 7.8, textColor: COLOR_SLATE },
    },
    styles: { cellPadding: 2, lineColor: COLOR_BORDER, lineWidth: 0.2 },
    alternateRowStyles: { fillColor: COLOR_LIGHT },
  });

  yPos = doc.lastAutoTable.finalY + 8;

  // 2. Non-Functional Requirements
  drawSectionTitle('8. NON-FUNCTIONAL REQUIREMENTS (NFR)', yPos);
  yPos += 2;

  const nfrData = [
    ['Performance', 'Search queries execute in < 80ms across the full panel catalog. Assets load with cache-control headers.'],
    ['Security', 'HTTP-only secure JWT cookies prevent XSS. Password hashes use 10-round bcrypt salt. Sanitized file uploads.'],
    ['Reliability', 'PostgreSQL transactional ACID guarantees. Zero data loss on concurrent price updates.'],
    ['Usability', 'Industrial dark sidebar with ElectCare logo. Responsive layout across desktop workstations and mobile tablets.'],
  ];

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [['DIMENSION', 'REQUIREMENT & ARCHITECTURE GUARANTEE']],
    body: nfrData,
    headStyles: { fillColor: COLOR_NAVY, fontSize: 8, fontStyle: 'bold', textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 38, fontStyle: 'bold', textColor: COLOR_NAVY, fontSize: 7.8 },
      1: { cellWidth: contentWidth - 38, fontSize: 7.8, textColor: COLOR_SLATE },
    },
    styles: { cellPadding: 2, lineColor: COLOR_BORDER, lineWidth: 0.2 },
    alternateRowStyles: { fillColor: COLOR_LIGHT },
  });

  yPos = doc.lastAutoTable.finalY + 8;

  // 3. Verification & Approval Sign-Off Matrix
  drawSectionTitle('9. VERIFICATION & APPROVAL SIGN-OFF MATRIX', yPos);
  yPos += 2;

  const signOffData = [
    ['Client Business Sponsor', 'SVG Management', '[ APPROVED ] / [ NEED REVISION ]', ''],
    ['Lead Systems Architect', 'Principal Solution Architect', '[ APPROVED ] / [ NEED REVISION ]', ''],
  ];

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [['ROLE / STAKEHOLDER', 'SIGN-OFF NAME', 'VERIFICATION STATUS', 'DATE']],
    body: signOffData,
    headStyles: { fillColor: COLOR_NAVY, fontSize: 8, fontStyle: 'bold', textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 48, fontStyle: 'bold', textColor: COLOR_NAVY, fontSize: 7.8 },
      1: { cellWidth: 48, fontSize: 7.8, textColor: COLOR_SLATE },
      2: { cellWidth: 52, fontStyle: 'bold', fontSize: 7.8, textColor: [16, 185, 129] },
      3: { cellWidth: contentWidth - 148, fontSize: 7.8 },
    },
    styles: { cellPadding: 3.5, lineColor: COLOR_BORDER, lineWidth: 0.2 },
    alternateRowStyles: { fillColor: COLOR_LIGHT },
  });

  drawRunningFooter(5);

  // Write Official PDF
  const outDir = path.join(process.cwd(), 'public');
  const pdfPath = path.join(outDir, 'SVG_Electric_BRD.pdf');
  const artifactDir = path.join('C:', 'Users', 'LENOVO', '.gemini', 'antigravity', 'brain', '646b3c2e-ac0d-47d9-8f88-9fe70d59109f');
  const artifactPdfPath = path.join(artifactDir, 'SVG_Electric_BRD.pdf');

  const pdfOutput = doc.output('arraybuffer');
  const buffer = Buffer.from(pdfOutput);

  fs.writeFileSync(pdfPath, buffer);
  try {
    fs.writeFileSync(artifactPdfPath, buffer);
  } catch (e) {}

  console.log(`✓ Generated Official 5-Page BRD PDF successfully at: ${pdfPath} (${buffer.length} bytes)`);
}

generateOfficialBRD().catch(console.error);
