import fs from 'fs';
import path from 'path';

function generateOfficialWordBRD() {
  console.log('Generating Official Word Document (.doc) with logo and colors...');

  let logoB64 = '';
  const logoPath = path.join(process.cwd(), 'public', 'logo.jpg');
  if (fs.existsSync(logoPath)) {
    const buf = fs.readFileSync(logoPath);
    logoB64 = `data:image/jpeg;base64,${buf.toString('base64')}`;
  }

  const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>SVG Electric - Business Requirements Document (BRD)</title>
<!--[if gte mso 9]>
<xml>
 <w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:DoNotOptimizeForBrowser/>
 </w:WordDocument>
</xml>
<![endif]-->
<style>
  @page {
    size: 210mm 297mm;
    margin: 18mm 18mm 18mm 18mm;
    mso-header-margin: 36pt;
    mso-footer-margin: 36pt;
  }
  body {
    font-family: 'Segoe UI', Calibri, Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.45;
    color: #1e293b;
    background-color: #ffffff;
  }
  .page-break {
    page-break-before: always;
  }
  .header-band {
    background-color: #0f172a;
    color: #ffffff;
    padding: 6pt 10pt;
    text-align: center;
    font-size: 9pt;
    font-weight: bold;
    letter-spacing: 1pt;
    border-bottom: 2pt solid #dc2626;
  }
  .running-header {
    background-color: #0f172a;
    color: #ffffff;
    padding: 5pt 10pt;
    font-size: 8pt;
    font-weight: bold;
    border-bottom: 2pt solid #dc2626;
    margin-bottom: 12pt;
  }
  .running-header table {
    width: 100%;
    border: none;
    margin: 0;
  }
  .running-header td {
    border: none;
    padding: 0;
    color: #ffffff;
  }
  h1.main-title {
    font-size: 20pt;
    font-weight: bold;
    color: #0f172a;
    margin-top: 14pt;
    margin-bottom: 4pt;
    text-align: center;
  }
  .subtitle {
    font-size: 11pt;
    font-weight: bold;
    color: #334155;
    text-align: center;
    margin-bottom: 3pt;
  }
  .client-tag {
    font-size: 10pt;
    color: #026ec7;
    text-align: center;
    margin-bottom: 16pt;
  }
  .section-title {
    font-size: 11pt;
    font-weight: bold;
    color: #0f172a;
    border-left: 4pt solid #0f172a;
    padding-left: 6pt;
    margin-top: 14pt;
    margin-bottom: 6pt;
    text-transform: uppercase;
  }
  p {
    margin-top: 0;
    margin-bottom: 6pt;
    text-align: justify;
    font-size: 9pt;
    color: #334155;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 6pt;
    margin-bottom: 10pt;
    font-size: 8.5pt;
  }
  th {
    background-color: #0f172a;
    color: #ffffff;
    font-weight: bold;
    text-align: left;
    padding: 5pt 7pt;
    border: 1pt solid #cbd5e1;
    font-size: 8pt;
    text-transform: uppercase;
  }
  td {
    padding: 4.5pt 7pt;
    border: 1pt solid #cbd5e1;
    vertical-align: top;
    color: #334155;
  }
  tr:nth-child(even) td {
    background-color: #f8fafc;
  }
  .badge-high {
    color: #dc2626;
    font-weight: bold;
  }
  .badge-medium {
    color: #0d9488;
    font-weight: bold;
  }
  .badge-approval {
    color: #ea580c;
    font-weight: bold;
  }
  .badge-approved {
    color: #16a34a;
    font-weight: bold;
  }
  .box-notice {
    background-color: #fafafa;
    border: 1pt solid #e2e8f0;
    border-left: 3pt solid #0f172a;
    padding: 8pt 10pt;
    margin-top: 10pt;
    font-size: 8pt;
  }
  .footer-row {
    border-top: 1pt solid #cbd5e1;
    padding-top: 4pt;
    margin-top: 16pt;
    font-size: 7.5pt;
    color: #64748b;
  }
</style>
</head>
<body>

<!-- ========================================================================= -->
<!-- PAGE 1: TITLE, DOCUMENT CONTROL & EXECUTIVE SUMMARY -->
<!-- ========================================================================= -->
<div style="text-align: center; margin-bottom: 12pt;">
  ${logoB64 ? `<img src="${logoB64}" alt="ElectCare - Feel The Excellence" style="height: 52pt; width: auto; margin-bottom: 8pt;" />` : ''}
</div>

<div class="header-band">
  ENTERPRISE APPLICATION SPECIFICATION
</div>

<h1 class="main-title">BUSINESS REQUIREMENTS DOCUMENT (BRD)</h1>
<div class="subtitle">Product Catalog, Technical Specifications, Pricing & Sales Discovery System</div>
<div class="client-tag">Client: SVG Electric & Control Products (India)</div>

<div class="section-title">DOCUMENT CONTROL INFORMATION</div>
<table>
  <tr>
    <td style="width: 30%; font-weight: bold; background-color: #f8fafc;">Document Reference:</td>
    <td style="width: 70%; font-weight: bold;">BRD-SVG-ELE-2026-V1</td>
  </tr>
  <tr>
    <td style="font-weight: bold; background-color: #f8fafc;">System Name:</td>
    <td>SVG Electric Estimation & Product Management System</td>
  </tr>
  <tr>
    <td style="font-weight: bold; background-color: #f8fafc;">Target Audience:</td>
    <td>Executive Management, Sales Engineers, Software Engineering Team</td>
  </tr>
  <tr>
    <td style="font-weight: bold; background-color: #f8fafc;">Scope Revision:</td>
    <td>Version 1.0 (Streamlined Admin Product Entry & Sales Price Finder)</td>
  </tr>
  <tr>
    <td style="font-weight: bold; background-color: #f8fafc;">Document Owner:</td>
    <td>Principal Solutions Architect & Engineering Lead</td>
  </tr>
  <tr>
    <td style="font-weight: bold; background-color: #f8fafc;">Publication Date:</td>
    <td>September 2026</td>
  </tr>
  <tr>
    <td style="font-weight: bold; background-color: #f8fafc;">Document Status:</td>
    <td class="badge-approval">Need Approval</td>
  </tr>
</table>

<div class="section-title">1. EXECUTIVE SUMMARY & PROJECT BACKGROUND</div>
<p>
SVG Electric & Control Products (India) is an established industrial manufacturer specializing in Motor Control Centers (MCC), Power Control Centers (PCC), Variable Frequency Drive (VFD) panels, Automation/PLC cabinets, APFC power factor correction capacitor switchboards, and distribution systems.
</p>
<p>
To accelerate sales cycle velocity and eliminate pricing bottlenecks, SVG Electric commissioned this internal web application. While earlier iterations featured heavy multistage estimation approval workflows, customer CRM databases, and rule matrices, client field operations identified that sales engineers primarily require an instantaneous, high-precision Product Search & Price Discovery Engine. Concurrently, administrative staff require an agile Product Catalog Entry Console where technical parameters, direct final prices, and engineering drawings/PDF datasheets can be entered in minutes.
</p>
<p>
This BRD establishes the definitive operational, functional, and technical blueprint for the deployed version 1.0 system.
</p>

<div class="box-notice">
  <strong>CONFIDENTIALITY NOTICE:</strong> This document contains proprietary business logic, data models, and architectural specifications belonging to SVG Electric & Control Products. No part of this publication may be reproduced, transmitted, or distributed without prior written consent.
</div>

<div class="footer-row">
  <table style="border: none; margin: 0;">
    <tr style="background: none;">
      <td style="border: none; padding: 0;">Confidential — For Internal Use Only</td>
      <td style="border: none; padding: 0; text-align: right;">Page 1 of 5</td>
    </tr>
  </table>
</div>

<!-- ========================================================================= -->
<!-- PAGE 2: TABLE OF CONTENTS, SCOPE ANALYSIS & USER PERSONAS -->
<!-- ========================================================================= -->
<br clear="all" style="page-break-before:always" />

<div class="running-header">
  <table>
    <tr style="background: none;">
      <td>SVG ELECTRIC & CONTROL PRODUCTS</td>
      <td style="text-align: right;">BUSINESS REQUIREMENTS DOCUMENT (BRD)</td>
    </tr>
  </table>
</div>

<div class="section-title">TABLE OF CONTENTS</div>
<table>
  <thead>
    <tr>
      <th style="width: 80%;">SECTION NAME</th>
      <th style="width: 20%; text-align: right;">PAGE</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>1. Executive Summary & Project Background</td><td style="text-align: right;">Page 1</td></tr>
    <tr><td>2. Business Problem & Transformed Scope Analysis</td><td style="text-align: right;">Page 2</td></tr>
    <tr><td>3. User Personas & Role-Based Access Control (RBAC)</td><td style="text-align: right;">Page 2</td></tr>
    <tr><td>4. Functional Requirements Specification (FR-1 through FR-7)</td><td style="text-align: right;">Page 3</td></tr>
    <tr><td>5. Technical Architecture & Technology Stack</td><td style="text-align: right;">Page 4</td></tr>
    <tr><td>6. Data Dictionary (Core Product Model)</td><td style="text-align: right;">Page 4</td></tr>
    <tr><td>7. API Architecture & Endpoint Contracts</td><td style="text-align: right;">Page 5</td></tr>
    <tr><td>8. Non-Functional Requirements (Performance, Security, Reliability)</td><td style="text-align: right;">Page 5</td></tr>
    <tr><td>9. Verification & Approval Sign-Off Matrix</td><td style="text-align: right;">Page 5</td></tr>
  </tbody>
</table>

<div class="section-title">2. BUSINESS PROBLEM & SCOPE ANALYSIS</div>
<p>
Historical electrical estimation workflows involved manual lookups across static spreadsheets, delays in waiting for admin approval, and inability to quickly answer customer technical inquiries regarding specific ratings (e.g. "What is our price for an 800A IP54 MCC panel?").
</p>

<table>
  <thead>
    <tr>
      <th style="width: 25%;">CAPABILITY AREA</th>
      <th style="width: 35%;">PHASE 1 LEGACY MODEL</th>
      <th style="width: 40%;">PHASE 2 STREAMLINED MODEL (APPROVED)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Pricing Methodology</strong></td>
      <td>Complex formula combination matrix</td>
      <td><strong>Direct Admin Final Price per product entry</strong></td>
    </tr>
    <tr>
      <td><strong>Technical Specs</strong></td>
      <td>Static dropdown attributes</td>
      <td><strong>Dynamic Key-Value Spec Builder + Quick suggestions</strong></td>
    </tr>
    <tr>
      <td><strong>Technical Attachments</strong></td>
      <td>None</td>
      <td><strong>Direct Image & PDF datasheet upload (&lt;25MB)</strong></td>
    </tr>
    <tr>
      <td><strong>Sales Workflow</strong></td>
      <td>Draft estimation &rarr; Submit &rarr; Admin Approval</td>
      <td><strong>Instant keyword & parameter-based price discovery</strong></td>
    </tr>
    <tr>
      <td><strong>Client Submittals</strong></td>
      <td>Generic multi-page estimation quote</td>
      <td><strong>Branded Technical Spec Sheet with optional price toggle</strong></td>
    </tr>
  </tbody>
</table>

<div class="section-title">3. USER PERSONAS & ROLE-BASED ACCESS CONTROL (RBAC)</div>
<table>
  <thead>
    <tr>
      <th style="width: 25%;">PERSONA</th>
      <th style="width: 45%;">PRIMARY OBJECTIVES & CAPABILITIES</th>
      <th style="width: 30%;">ASSIGNED ROUTE ACCESS</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>ADMINISTRATOR</strong><br><em>(Engineering & Operations Head)</em></td>
      <td>
        • Create, modify, and delete product panel entries.<br>
        • Configure dynamic technical specifications (Current, Voltage, IP, Form, Busbar).<br>
        • Set final commercial prices in Indian Rupees.<br>
        • Upload panel photographs and PDF engineering drawings.<br>
        • Manage user logins and audit logs.
      </td>
      <td style="color: #026ec7; font-family: monospace;">
        /dashboard (Overview)<br>
        /admin/products<br>
        /admin/users<br>
        /admin/settings
      </td>
    </tr>
    <tr>
      <td><strong>SALES ENGINEER</strong><br><em>(Field Technical Sales)</em></td>
      <td>
        • Real-time keyword search across panel models and specifications.<br>
        • Filter panels by category and electrical parameters (e.g. 800A, 415V).<br>
        • Retrieve exact final prices immediately during client calls.<br>
        • Preview/download technical PDF datasheets and GA drawings.<br>
        • Generate printable technical submittals (with or without price).
      </td>
      <td style="color: #026ec7; font-family: monospace;">
        /dashboard (Product Search & Price Finder)
      </td>
    </tr>
  </tbody>
</table>

<div class="footer-row">
  <table style="border: none; margin: 0;">
    <tr style="background: none;">
      <td style="border: none; padding: 0;">Confidential — For Internal Use Only</td>
      <td style="border: none; padding: 0; text-align: right;">Page 2 of 5</td>
    </tr>
  </table>
</div>

<!-- ========================================================================= -->
<!-- PAGE 3: FUNCTIONAL REQUIREMENTS SPECIFICATION -->
<!-- ========================================================================= -->
<br clear="all" style="page-break-before:always" />

<div class="running-header">
  <table>
    <tr style="background: none;">
      <td>SVG ELECTRIC & CONTROL PRODUCTS</td>
      <td style="text-align: right;">BUSINESS REQUIREMENTS DOCUMENT (BRD)</td>
    </tr>
  </table>
</div>

<div class="section-title">4. FUNCTIONAL REQUIREMENTS SPECIFICATION</div>
<p>
The following functional requirements govern the complete operation of the Version 1.0 system across authentication, catalog management, pricing, files, and discovery.
</p>

<table>
  <thead>
    <tr>
      <th style="width: 25%;">REQ ID & FEATURE</th>
      <th style="width: 12%; text-align: center;">PRIORITY</th>
      <th style="width: 63%;">DETAILED FUNCTIONAL REQUIREMENT</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>FR-1: Authentication & RBAC</strong></td>
      <td style="text-align: center;" class="badge-high">High</td>
      <td>The system shall authenticate users via email and bcrypt-hashed password, issuing secure HTTP-only JWT cookies. Middleware guards must intercept and enforce role boundaries (e.g. restricting /admin routes to ADMIN role).</td>
    </tr>
    <tr>
      <td><strong>FR-2: Product Master Entry & Specs Builder</strong></td>
      <td style="text-align: center;" class="badge-high">High</td>
      <td>Admin shall create products with Product Code (SKU), Name, Category, and Description. An interactive Specifications Builder must allow arbitrary Key-Value technical parameters with one-click electrical suggestions (Rated Current, Operating Voltage, Ingress Protection, Busbar Material, Form of Separation, Incomer Switchgear).</td>
    </tr>
    <tr>
      <td><strong>FR-3: Direct Final Commercial Pricing</strong></td>
      <td style="text-align: center;" class="badge-high">High</td>
      <td>Admin shall directly specify the final ex-works unit price in INR for each product entry. The system must format this into Indian numbering standard (e.g., Rs. 3,85,000) and store it in the database.</td>
    </tr>
    <tr>
      <td><strong>FR-4: Multi-Format Attachment Pipeline</strong></td>
      <td style="text-align: center;" class="badge-high">High</td>
      <td>The system shall provide an asynchronous upload API (/api/upload) supporting images (.jpg, .jpeg, .png, .webp) and PDF documents (.pdf) up to 25MB. Files must be sanitized, assigned timestamped unique filenames, and stored in public/uploads/ with full preview and download capabilities.</td>
    </tr>
    <tr>
      <td><strong>FR-5: Sales Search & Filter Engine</strong></td>
      <td style="text-align: center;" class="badge-high">High</td>
      <td>Sales engineers shall search products in real-time. The query parser must search across product codes, product names, categories, descriptions, and dynamic JSON specification values. Parameter-specific dropdowns must allow filtering by exact ratings.</td>
    </tr>
    <tr>
      <td><strong>FR-6: Dual-Mode Catalog Presentation</strong></td>
      <td style="text-align: center;" class="badge-medium">Medium</td>
      <td>The UI shall support instantaneous switching between Visual Grid Cards (featuring visual thumbnails, specs badges, and prominent price tags) and Dense Technical Tables (optimized for rapid multi-item comparisons).</td>
    </tr>
    <tr>
      <td><strong>FR-7: Printable Technical Spec Sheet</strong></td>
      <td style="text-align: center;" class="badge-high">High</td>
      <td>The system must render a publication-grade technical datasheet modal. A prominent "Show Price on Print" toggle must allow users to include or omit commercial pricing. When printing via window.print(), background navigation must hide, leaving a clean A4 technical submittal.</td>
    </tr>
  </tbody>
</table>

<div class="footer-row">
  <table style="border: none; margin: 0;">
    <tr style="background: none;">
      <td style="border: none; padding: 0;">Confidential — For Internal Use Only</td>
      <td style="border: none; padding: 0; text-align: right;">Page 3 of 5</td>
    </tr>
  </table>
</div>

<!-- ========================================================================= -->
<!-- PAGE 4: TECHNICAL ARCHITECTURE & DATA DICTIONARY -->
<!-- ========================================================================= -->
<br clear="all" style="page-break-before:always" />

<div class="running-header">
  <table>
    <tr style="background: none;">
      <td>SVG ELECTRIC & CONTROL PRODUCTS</td>
      <td style="text-align: right;">BUSINESS REQUIREMENTS DOCUMENT (BRD)</td>
    </tr>
  </table>
</div>

<div class="section-title">5. TECHNICAL SYSTEM ARCHITECTURE & TECHNOLOGY STACK</div>
<table>
  <thead>
    <tr>
      <th style="width: 25%;">LAYER / COMPONENT</th>
      <th style="width: 30%;">SELECTED TECHNOLOGY</th>
      <th style="width: 45%;">ARCHITECTURAL RATIONALE</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Frontend Framework</strong></td>
      <td style="color: #026ec7; font-weight: bold;">Next.js 14 (App Router) + React 18</td>
      <td>Server-Side Rendering, fast client hydration, robust route nesting</td>
    </tr>
    <tr>
      <td><strong>Styling & Design System</strong></td>
      <td style="color: #026ec7; font-weight: bold;">Tailwind CSS + Lucide Icons</td>
      <td>Industrial design system, consistent brand palette, print stylesheets</td>
    </tr>
    <tr>
      <td><strong>Backend API Layer</strong></td>
      <td style="color: #026ec7; font-weight: bold;">Next.js Route Handlers (Node.js)</td>
      <td>Secure RESTful endpoints, streaming multipart file uploads</td>
    </tr>
    <tr>
      <td><strong>ORM & Database Layer</strong></td>
      <td style="color: #026ec7; font-weight: bold;">Prisma ORM + PostgreSQL</td>
      <td>Type-safe schema, relational integrity, native JSON column support</td>
    </tr>
    <tr>
      <td><strong>Authentication</strong></td>
      <td style="color: #026ec7; font-weight: bold;">JWT (jose) + Bcrypt.js</td>
      <td>Stateless session tokens, HTTP-only cookie security, salted hashing</td>
    </tr>
  </tbody>
</table>

<div class="section-title">6. DATABASE SCHEMA & DATA DICTIONARY</div>
<table>
  <thead>
    <tr>
      <th style="width: 20%;">FIELD NAME</th>
      <th style="width: 12%;">TYPE</th>
      <th style="width: 20%;">CONSTRAINTS</th>
      <th style="width: 48%;">BUSINESS PURPOSE</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>id</code></td>
      <td>String</td>
      <td><em>PK, UUID</em></td>
      <td>Unique immutable product identifier</td>
    </tr>
    <tr>
      <td><code>productCode</code></td>
      <td>String</td>
      <td><em>Unique, Indexed</em></td>
      <td>Commercial model SKU (e.g. MCC-IND-01)</td>
    </tr>
    <tr>
      <td><code>name</code></td>
      <td>String</td>
      <td>Required</td>
      <td>Full descriptive product title</td>
    </tr>
    <tr>
      <td><code>price</code></td>
      <td>Float</td>
      <td>Default 0.0</td>
      <td>Final ex-works commercial unit price in INR</td>
    </tr>
    <tr>
      <td><code>categoryId</code></td>
      <td>String</td>
      <td><em>FK -&gt; Category</em></td>
      <td>Relational link to panel category</td>
    </tr>
    <tr>
      <td><code>specifications</code></td>
      <td>Json</td>
      <td><em>Nullable, Array</em></td>
      <td>Structured list of [{ name: string, value: string }]</td>
    </tr>
    <tr>
      <td><code>fileUrl</code></td>
      <td>String</td>
      <td><em>Nullable</em></td>
      <td>Path to uploaded drawing/datasheet in /uploads/</td>
    </tr>
    <tr>
      <td><code>fileName</code></td>
      <td>String</td>
      <td><em>Nullable</em></td>
      <td>Original user file name with extension</td>
    </tr>
    <tr>
      <td><code>fileType</code></td>
      <td>String</td>
      <td>IMAGE | PDF</td>
      <td>MIME classification for appropriate UI rendering</td>
    </tr>
    <tr>
      <td><code>active</code></td>
      <td>Boolean</td>
      <td>Default true</td>
      <td>Controls sales catalog search visibility</td>
    </tr>
  </tbody>
</table>

<div class="footer-row">
  <table style="border: none; margin: 0;">
    <tr style="background: none;">
      <td style="border: none; padding: 0;">Confidential — For Internal Use Only</td>
      <td style="border: none; padding: 0; text-align: right;">Page 4 of 5</td>
    </tr>
  </table>
</div>

<!-- ========================================================================= -->
<!-- PAGE 5: API CONTRACTS, NFR & SIGN-OFF MATRIX -->
<!-- ========================================================================= -->
<br clear="all" style="page-break-before:always" />

<div class="running-header">
  <table>
    <tr style="background: none;">
      <td>SVG ELECTRIC & CONTROL PRODUCTS</td>
      <td style="text-align: right;">BUSINESS REQUIREMENTS DOCUMENT (BRD)</td>
    </tr>
  </table>
</div>

<div class="section-title">7. API ARCHITECTURE & ENDPOINT CONTRACTS</div>
<table>
  <thead>
    <tr>
      <th style="width: 25%;">ENDPOINT</th>
      <th style="width: 15%;">METHOD</th>
      <th style="width: 18%;">AUTH ROLE</th>
      <th style="width: 42%;">PAYLOAD & RESPONSE SUMMARY</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="color: #026ec7; font-family: monospace; font-weight: bold;">/api/auth/login</td>
      <td>POST</td>
      <td>Public</td>
      <td>Validates credentials; sets HTTP-only auth_session cookie</td>
    </tr>
    <tr>
      <td style="color: #026ec7; font-family: monospace; font-weight: bold;">/api/auth/logout</td>
      <td>POST</td>
      <td>All</td>
      <td>Invalidates session cookie; redirects to /login</td>
    </tr>
    <tr>
      <td style="color: #026ec7; font-family: monospace; font-weight: bold;">/api/upload</td>
      <td>POST</td>
      <td>Authenticated</td>
      <td>Multipart form data (file); returns {fileUrl, fileName, fileType, fileSize}</td>
    </tr>
    <tr>
      <td style="color: #026ec7; font-family: monospace; font-weight: bold;">/api/admin/products</td>
      <td>GET, POST, PUT, DELETE</td>
      <td>ADMIN</td>
      <td>Full CRUD on product entries with specs, price, and attachments</td>
    </tr>
    <tr>
      <td style="color: #026ec7; font-family: monospace; font-weight: bold;">/api/products/search</td>
      <td>GET</td>
      <td>SALES / ADMIN</td>
      <td>Searches by keyword q, categoryId, specName, specValue; returns matching products</td>
    </tr>
  </tbody>
</table>

<div class="section-title">8. NON-FUNCTIONAL REQUIREMENTS (NFR)</div>
<table>
  <thead>
    <tr>
      <th style="width: 25%;">DIMENSION</th>
      <th style="width: 75%;">REQUIREMENT & ARCHITECTURE GUARANTEE</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Performance</strong></td>
      <td>Search queries execute in &lt; 80ms across the full panel catalog. Assets load with cache-control headers.</td>
    </tr>
    <tr>
      <td><strong>Security</strong></td>
      <td>HTTP-only secure JWT cookies prevent XSS. Password hashes use 10-round bcrypt salt. Sanitized file uploads.</td>
    </tr>
    <tr>
      <td><strong>Reliability</strong></td>
      <td>PostgreSQL transactional ACID guarantees. Zero data loss on concurrent price updates.</td>
    </tr>
    <tr>
      <td><strong>Usability</strong></td>
      <td>Industrial dark sidebar with ElectCare logo. Responsive layout across desktop workstations and mobile tablets.</td>
    </tr>
  </tbody>
</table>

<div class="section-title">9. VERIFICATION & APPROVAL SIGN-OFF MATRIX</div>
<table>
  <thead>
    <tr>
      <th style="width: 30%;">ROLE / STAKEHOLDER</th>
      <th style="width: 30%;">SIGN-OFF NAME</th>
      <th style="width: 25%;">VERIFICATION STATUS</th>
      <th style="width: 15%;">DATE</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Client Business Sponsor</strong></td>
      <td>SVG Management</td>
      <td class="badge-approved">[ APPROVED ] / [ NEED REVISION ]</td>
      <td></td>
    </tr>
    <tr>
      <td><strong>Lead Systems Architect</strong></td>
      <td>Principal Solution Architect</td>
      <td class="badge-approved">[ APPROVED ] / [ NEED REVISION ]</td>
      <td></td>
    </tr>
  </tbody>
</table>

<div class="footer-row">
  <table style="border: none; margin: 0;">
    <tr style="background: none;">
      <td style="border: none; padding: 0;">Confidential — For Internal Use Only</td>
      <td style="border: none; padding: 0; text-align: right;">Page 5 of 5</td>
    </tr>
  </table>
</div>

</body>
</html>
`;

  const publicDocPath = path.join(process.cwd(), 'public', 'SVG_Electric_BRD.doc');
  const artifactDir = path.join('C:', 'Users', 'LENOVO', '.gemini', 'antigravity', 'brain', '646b3c2e-ac0d-47d9-8f88-9fe70d59109f');
  const artifactDocPath = path.join(artifactDir, 'SVG_Electric_BRD.doc');

  fs.writeFileSync(publicDocPath, htmlContent, 'utf-8');
  try {
    fs.writeFileSync(artifactDocPath, htmlContent, 'utf-8');
  } catch (e) {}

  console.log(`✓ Generated Official Word Document (.doc) successfully at: ${publicDocPath} (${htmlContent.length} bytes)`);
}

generateOfficialWordBRD();
