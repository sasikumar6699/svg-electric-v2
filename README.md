# SVG ELECTRIC – ESTIMATION MANAGEMENT SYSTEM
### Production-Ready Internal Enterprise Estimation & Quotation Platform

---

## 1. Overview & Business Purpose

**SVG Electric – Estimation Management System** is a dedicated internal software platform engineered specifically for the sales and engineering teams of **SVG Electric & Control Products** (dealers, custom manufacturers, and retrofitting specialists of industrial electrical panels, drives, automation systems, and switchgear).

### Key Business Problems Solved
- **Eliminates Manual Errors:** Replaces spreadsheets with an automated calculation and validation engine.
- **Dynamic Product Specifications:** Automatically adapts technical parameter inputs (Form separation, Ingress Protection, Busbars, Starter Type, Drive capacity, HMI sizes, I/O count) based on the chosen panel category.
- **Strict Pricing Engine:** Evaluates specification combinations against configured pricing matrixes. If a combination is unpriced, it displays clear actionable feedback rather than silent fallbacks or ₹0.
- **Historical Snapshot Immutability:** Freezes product codes, descriptions, exact specifications, and unit prices on created estimations. Updating master price rules never mutates historical customer quotations.
- **Indian Statutory & Currency Standards:** Native Indian GST handling (Intra-State CGST/SGST 9%+9% vs Inter-State IGST 18%), INR currency formatting (`₹ 2,50,000.00`), and automatic Indian Numbering words conversion (`Rupees in Words`).
- **One-Click Quotation PDF Generation:** Instant vector PDF generation with SVG Electric branding, customer bill-to box, technical breakdown table, GST breakdown, amount in words, and authorized signatory blocks.
- **Admin Control Center:** Complete governance over product catalogs, specifications, dynamic product-specification mappings, pricing rules, user roles, audit trails, and Excel bulk import/export.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router), React 18, TypeScript |
| **Styling & UI** | Tailwind CSS, Lucide React Icons |
| **Database & ORM** | PostgreSQL 16, Prisma ORM |
| **Authentication** | Secure HTTP-Only Cookie Session JWTs (`jose`), `bcryptjs` password hashing |
| **Pricing Engine** | Pluggable Strategy Architecture (`PricingEngine` class) |
| **PDF Generation** | `jspdf` & `jspdf-autotable` (Vector precision, zero native C++ runtime dependencies) |
| **Excel Handling** | SheetJS (`xlsx`) for multi-sheet import/export and template generation |
| **Containerization** | Docker, Docker Compose (Multi-stage Alpine production image) |
| **Testing** | Node test suite with automated assertions for pricing, tax, and snapshot immutability |

---

## 3. Seed Users & Default Credentials

The database is pre-seeded with realistic SVG Electric catalog data and two ready-to-use accounts:

| Role | Email Address | Password | Permissions |
|---|---|---|---|
| **ADMIN** | `admin@svgelectric.com` | `Admin@12345` | Full access to Product Catalog, Specifications, Pricing Matrix, Users, Company Settings, Audit Logs, and Excel Import/Export. |
| **SALES USER** | `sales@svgelectric.com` | `Sales@12345` | Can create, edit drafts, finalize estimations, duplicate quotations, manage customers, and generate PDFs. Cannot modify master prices. |

> **Tip:** The login page (`/login`) includes quick demo autofill buttons for instant 1-click login as either role.

---

## 4. Local Quickstart (Windows Native)

### Prerequisites
- Node.js v18+ (Node.js v24 tested)
- PostgreSQL 16 running on port `5432`

### Setup Instructions
1. Clone or open the project folder:
   ```powershell
   cd C:\Users\LENOVO\.gemini\antigravity\scratch\svg-electric-estimation
   ```

2. Verify `.env` configuration:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/svg_electric_db?schema=public"
   SESSION_SECRET="svg-electric-estimation-secure-session-key-32chars-min!"
   ADMIN_EMAIL="admin@svgelectric.com"
   ADMIN_PASSWORD="Admin@12345"
   SALES_EMAIL="sales@svgelectric.com"
   SALES_PASSWORD="Sales@12345"
   PORT=3000
   ```

3. Initialize database and seed catalog:
   ```powershell
   npx prisma db push
   npx tsx prisma/seed.ts
   ```

4. Run the production build or development server:
   ```powershell
   # Development
   npm run dev

   # Or Production Server
   npm run build
   npm start
   ```

5. Open your browser at:
   `http://localhost:3000`

---

## 5. Docker Deployment

The application is fully containerized and can run standalone on any local server or cloud VPS without requiring Node or PostgreSQL to be pre-installed on the host.

### Starting with Docker Compose
```bash
docker-compose up -d --build
```
This launches:
- `svg_electric_postgres`: PostgreSQL 16 Alpine container on port 5432 with persistent volume `postgres_data`.
- `svg_electric_app`: Next.js production standalone container on port 3000.

### Seeding within Docker
```bash
docker exec -it svg_electric_app npx prisma db push
docker exec -it svg_electric_app npx tsx prisma/seed.ts
```

---

## 6. Accessing on Local Office Network (LAN)

To allow sales engineers on other computers or tablets in the office to access the estimation system:

1. **Find the Host Computer's Local IP Address:**
   In PowerShell on the server/host machine:
   ```powershell
   ipconfig
   ```
   Look for `IPv4 Address` (e.g. `192.168.1.50`).

2. **Allow Inbound Port 3000 in Windows Firewall:**
   Run PowerShell as Administrator:
   ```powershell
   New-NetFirewallRule -DisplayName "SVG Electric Estimation App" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
   ```

3. **Connect from Client Devices:**
   On any laptop, iPad, or mobile connected to the same office Wi-Fi, open:
   ```
   http://192.168.1.50:3000
   ```

---

## 7. Database Backup & Restore

Dedicated scripts are provided in the `scripts/` directory:

### Windows:
- **Backup:** Double-click `scripts\backup-db.bat`. Creates a timestamped `.sql` dump in `backups\`.
- **Restore:** Run in command prompt:
  ```cmd
  scripts\restore-db.bat backups\svg_electric_backup_YYYY-MM-DD_HH-MM-SS.sql
  ```

### Linux / Docker:
- **Backup:**
  ```bash
  chmod +x scripts/backup-db.sh
  ./scripts/backup-db.sh
  ```
- **Restore:**
  ```bash
  chmod +x scripts/restore-db.sh
  ./scripts/restore-db.sh backups/your_backup.sql
  ```

---

## 8. Excel Bulk Import & Export

Located at `/admin/import-export`:
- **Export Master Data:** Downloads `svg_electric_master_data.xlsx` containing Products, Specifications, and Pricing Rules.
- **Templates:** Download pre-formatted templates for Products, Specifications, and Pricing Rules.
- **Validation Engine:** Automatically checks for required fields, category code existence, duplicate codes, and specification criteria format before inserting. Displays exact row-by-row error feedback if invalid data is found.

---

## 9. Running Automated Tests

Run the comprehensive business logic test suite:
```bash
node tests/runner.js
```

### Verified Test Cases:
- Exact specification combination criteria hashing and matching
- Multi-product line amount and subtotal summation
- Commercial discount calculation
- Intra-State CGST (9%) + SGST (9%) calculation
- Inter-State IGST (18%) calculation
- Indian currency words ("Rupees in Words")
- Historical Price Snapshot Immutability (updating master price rules does not mutate existing estimations)
- Missing price rule detection and descriptive error reporting

---

## 10. Contact & Support

**SVG Electric & Control Products**
- **Address:** SF No. 342/1, Trichy Road, Singanallur, Coimbatore - 641005, Tamil Nadu, India
- **Phone:** +91 94432 55678 / +91 422 2578901
- **Email:** sales@svgelectric.com
- **Website:** https://svgelectric.com