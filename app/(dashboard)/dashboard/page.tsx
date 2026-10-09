import React from 'react';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Boxes,
  Layers,
  SlidersHorizontal,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Zap,
  IndianRupee,
  ArrowRight,
  TrendingUp,
  PlusCircle,
  FolderTree,
  ExternalLink,
  Building2,
  FileSpreadsheet,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

async function fetchDashboardData() {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const [finishedGoods, componentCount, categories, auditLogs, unpricedComponents, totalUsers] = await Promise.all([
        db.finishedGood.findMany({
          where: { active: true },
          include: {
            category: { select: { id: true, name: true, code: true } },
            _count: { select: { bomItems: true, variants: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        db.componentMaster.count({ where: { active: true } }),
        db.productCategory.findMany({
          where: { active: true },
          orderBy: { displayOrder: 'asc' },
          include: {
            _count: { select: { finishedGoods: true } },
          },
        }),
        db.auditLog.findMany({
          take: 6,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { name: true, email: true } },
          },
        }),
        db.componentMaster.findMany({
          where: {
            active: true,
            OR: [
              { unitPrice: 0 },
              { unitPrice: { lte: 0 } },
            ],
          },
          select: {
            id: true,
            itemCode: true,
            description: true,
            rating: true,
            typeCode: true,
            make: true,
            category: true,
            unit: true,
            unitPrice: true,
          },
          take: 50,
          orderBy: { itemCode: 'asc' },
        }),
        db.user.count({ where: { active: true } }),
      ]);
      return { finishedGoods, componentCount, categories, auditLogs, unpricedComponents, totalUsers };
    } catch (err) {
      console.warn(`[Dashboard] DB query attempt ${attempt} warning:`, err);
      if (attempt >= 2) break;
      await new Promise((r) => setTimeout(r, 600));
    }
  }
  return { finishedGoods: [], componentCount: 0, categories: [], auditLogs: [], unpricedComponents: [], totalUsers: 0 };
}

export default async function DashboardPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  // If user is Sales, redirect them directly to the Sales Panel Configurator
  if (session.role === 'SALES_USER') {
    redirect('/sales/configurator');
  }

  const { finishedGoods, componentCount, categories, auditLogs, unpricedComponents, totalUsers } = await fetchDashboardData();

  // Aggregate metrics
  const totalFGs = finishedGoods.length;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white border border-blue-900/40 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>SVG Electric Control Products • Master Admin Command Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Product Master & Costing Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Standardized panel costing workflow: Fabrication & Enclosures, Busbar Systems, Wiring & Assembly, and Central Price Master across all industrial categories.
            </p>
          </div>

          {/* Quick Actions (Create Product + Price Master + Configurator) */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/finished-goods/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all active:scale-95 whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Product</span>
            </Link>

            <Link
              href="/admin/price-master"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95 whitespace-nowrap"
            >
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Price Master ({componentCount} Items)</span>
            </Link>

            <Link
              href="/admin/panel-upgradations"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all active:scale-95 whitespace-nowrap"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Panel Upgradations</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Admin Operational Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Active Finished Goods */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
              Active Panel Models
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{totalFGs}</span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-mono">
              Models
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Active engineered panel configurations
          </p>
        </div>

        {/* Metric 2: Central Price Master Raw Materials */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
              Central Price Master
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{componentCount.toLocaleString('en-IN')}</span>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-mono">
              RM Items
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Schneider, Siemens, ABB, L&T, Polycab & more
          </p>
        </div>

        {/* Metric 3: Product Categories */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
              Product Categories
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FolderTree className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{categories.length}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-mono">
              Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            MCC, PLC, APFC, PCC, AC/DC Drive categories
          </p>
        </div>

        {/* Metric 4: Registered Users */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
              System User Accounts
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{totalUsers}</span>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-mono">
              Accounts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Authorized administrator & sales engineering users
          </p>
        </div>
      </div>

      {/* 2.5. Unpriced Raw Materials Alert Section (Prompt requirement: "Also show the RM name which has no price in dashboard.") */}
      {unpricedComponents && unpricedComponents.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Unpriced Raw Materials (Pending Commercial Price Setup)</span>
                  <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-xs font-black font-mono">
                    {unpricedComponents.length} Items Unpriced
                  </span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  The following raw material components do not have a purchase price set in Price Master.
                </p>
              </div>
            </div>

            <Link
              href="/admin/price-master"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5 self-start sm:self-center whitespace-nowrap active:scale-95"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Update in Price Master</span>
            </Link>
          </div>

          <div className="overflow-x-auto bg-white rounded-xl border border-amber-200/80 shadow-sm max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-amber-50/80 text-slate-700 font-mono border-b border-amber-200/80 text-[11px] uppercase tracking-wider sticky top-0 bg-amber-50">
                <tr>
                  <th className="py-2.5 px-4">Raw Material Name & Description</th>
                  <th className="py-2.5 px-4">Make / Brand</th>
                  <th className="py-2.5 px-4">Rating / Specs</th>
                  <th className="py-2.5 px-4">Type Code</th>
                  <th className="py-2.5 px-4">Section / Category</th>
                  <th className="py-2.5 px-4 text-center">Price Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 text-slate-800 font-medium">
                {unpricedComponents.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{item.description}</td>
                    <td className="py-2.5 px-4 font-semibold text-blue-700">{item.make}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">{item.rating || 'Standard'}</td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">{item.typeCode || item.itemCode}</td>
                    <td className="py-2.5 px-4 text-[11px] text-slate-600">{item.category}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 rounded-full text-[10px] font-bold font-mono">
                        ₹0 (Unpriced)
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Link
                        href={`/admin/price-master?search=${encodeURIComponent(item.typeCode || item.itemCode)}`}
                        className="text-[11px] font-bold text-amber-700 hover:text-amber-900 underline underline-offset-2"
                      >
                        Set Price &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Categories Quick-Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
              Industrial Product Categories (All 9 Populated)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">Standardized SVG Electric Catalog</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
          {categories.map((c) => {
            const count = c._count?.finishedGoods || 0;
            return (
              <Link
                key={c.id}
                href={`/admin/finished-goods?category=${encodeURIComponent(c.name)}`}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/40 transition-all text-center group"
              >
                <div className="text-[11px] font-bold text-slate-800 truncate group-hover:text-blue-700">
                  {c.name.replace(' Panel', '')}
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                  {count} {count === 1 ? 'model' : 'models'}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
