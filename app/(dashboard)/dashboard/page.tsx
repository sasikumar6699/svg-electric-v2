import React from 'react';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { SalesProductCatalog } from '@/components/products/SalesProductCatalog';
import { MasterAdminConsole } from '@/components/admin/MasterAdminConsole';

export default async function DashboardPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const isAdmin = session.role === 'ADMIN';

  // If user is Sales, render the Sales Product Search & Price Discovery Console directly
  if (!isAdmin) {
    return <SalesProductCatalog />;
  }

  // Admin Master Console Data Queries
  const [products, categories, auditLogs] = await Promise.all([
    db.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: { id: true, name: true, code: true },
        },
      },
    }),
    db.productCategory.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    }),
    db.auditLog.findMany({
      take: 12,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    }),
  ]);

  // Clean serialization for client component boundary
  const initialProducts = products.map((p) => ({
    id: p.id,
    productCode: p.productCode,
    name: p.name,
    price: p.price,
    basePrice: p.basePrice,
    categoryId: p.categoryId,
    category: p.category ? { id: p.category.id, name: p.category.name, code: p.category.code } : undefined,
    description: p.description,
    specifications: (Array.isArray(p.specifications) ? p.specifications : []) as Array<{ name: string; value: string }>,
    fileUrl: p.fileUrl,
    fileName: p.fileName,
    fileType: p.fileType,
    fileSize: p.fileSize,
    active: p.active,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  const initialCategories = categories.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    description: c.description,
    _count: c._count,
  }));

  const initialAuditLogs = auditLogs.map((log) => ({
    id: log.id,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    details: log.details,
    createdAt: log.createdAt.toISOString(),
    user: log.user ? { name: log.user.name, email: log.user.email } : null,
  }));

  return (
    <div>
      <MasterAdminConsole
        initialProducts={initialProducts}
        initialCategories={initialCategories}
        initialAuditLogs={initialAuditLogs}
      />
    </div>
  );
}

