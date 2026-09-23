import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { formatINR } from '@/lib/utils';
import {
  Box,
  Layers,
  FileText,
  IndianRupee,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Image as ImageIcon,
  Tag,
  Search,
  ExternalLink,
} from 'lucide-react';
import { SalesProductCatalog } from '@/components/products/SalesProductCatalog';

export default async function DashboardPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const isAdmin = session.role === 'ADMIN';

  // If user is Sales, render the Sales Product Search & Price Discovery Console directly!
  if (!isAdmin) {
    return <SalesProductCatalog />;
  }

  // Admin Dashboard Overview Queries
  const [
    totalProducts,
    activeProducts,
    productsWithFiles,
    categories,
    recentProducts,
  ] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { active: true } }),
    db.product.count({ where: { fileUrl: { not: null } } }),
    db.productCategory.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { displayOrder: 'asc' },
    }),
    db.product.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    }),
  ]);

  return (
    <div className="space-y-6 pb-20">
      {/* Admin Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-full text-amber-300 text-xs font-mono mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ADMINISTRATION PORTAL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              SVG Electric Master Console
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Manage panel configurations, specifications, prices, and attachments for the sales team.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Manage Products</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Total Products</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1 font-mono">{totalProducts}</h3>
            <span className="text-[10px] text-emerald-600 font-semibold font-mono flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> {activeProducts} Active
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center">
            <Box className="w-5 h-5" />
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Panel Categories</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1 font-mono">{categories.length}</h3>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              MCC, PCC, APFC, VFD...
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Products with Datasheets */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Uploaded Datasheets</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1 font-mono">{productsWithFiles}</h3>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              Images & PDF Drawings
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Sales Search Quick Access */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Sales Console</span>
            <h3 className="text-sm font-bold text-slate-900 mt-1">Live Price Lookup</h3>
            <span className="text-[10px] text-brand-600 font-semibold font-mono mt-0.5 block">
              Test Sales View Below
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
            <Search className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Category Breakdown & Recent Entries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono mb-3">
            Category Breakdown
          </h3>
          <div className="space-y-2">
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-xs"
              >
                <span className="font-semibold text-slate-800">{c.name}</span>
                <span className="font-mono text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded font-bold text-brand-600">
                  {c._count.products} products
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Product Entries */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
              Recent Product Entries
            </h3>
            <Link
              href="/admin/products"
              className="text-xs font-semibold text-brand-600 hover:underline inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentProducts.map((p) => {
              const specs = Array.isArray(p.specifications) ? p.specifications : [];
              return (
                <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {p.fileUrl && p.fileType === 'IMAGE' ? (
                        <img src={p.fileUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : p.fileUrl && p.fileType === 'PDF' ? (
                        <FileText className="w-4 h-4 text-rose-600" />
                      ) : (
                        <Box className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-bold text-slate-900">
                          {p.productCode}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                          {p.category?.name}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-600 line-clamp-1">{p.name}</p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="font-mono font-bold text-slate-900 text-xs block">
                      {formatINR(p.price || p.basePrice || 0)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {specs.length} specifications
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Sales Search Experience for Admin Testing */}
      <div className="pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Live Sales Search & Price Discovery Preview
            </h2>
            <p className="text-xs text-slate-500">
              This is the exact view the sales team sees when searching for panels and specifications.
            </p>
          </div>
        </div>

        <SalesProductCatalog />
      </div>
    </div>
  );
}
