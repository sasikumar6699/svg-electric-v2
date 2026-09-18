import React from 'react';
import { db } from '@/lib/db';
import { formatINR } from '@/lib/utils';
import { BarChart3, TrendingUp, Users, Box, Calendar, FileSpreadsheet } from 'lucide-react';

export default async function ReportsPage() {
  const [
    totalEstimations,
    statusBreakdown,
    topCustomers,
    salesBreakdown,
    recentEstimations,
  ] = await Promise.all([
    db.estimation.count(),
    db.estimation.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { grandTotal: true },
    }),
    db.estimation.groupBy({
      by: ['companyName'],
      _count: { id: true },
      _sum: { grandTotal: true },
      orderBy: { _sum: { grandTotal: 'desc' } },
      take: 5,
    }),
    db.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        _count: { select: { estimations: true } },
      },
    }),
    db.estimation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        estimationNumber: true,
        companyName: true,
        grandTotal: true,
        status: true,
        date: true,
      },
    }),
  ]);

  const totalPipeline = statusBreakdown.reduce((sum, s) => sum + (s._sum.grandTotal || 0), 0);

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Estimation Analytics & Reports</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          High-level operational metrics, customer pipelines, and product-wise estimations.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-mono uppercase text-slate-400 font-semibold">Total Pipeline Value</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatINR(totalPipeline)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Cumulative sum of all estimations</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-mono uppercase text-slate-400 font-semibold">Active Estimations</p>
          <p className="text-2xl font-bold text-brand-600 mt-1">{totalEstimations}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Drafts and finalized quotations</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-mono uppercase text-slate-400 font-semibold">Top Client Account</p>
          <p className="text-lg font-bold text-slate-900 mt-1 truncate">
            {topCustomers[0]?.companyName || 'None'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {formatINR(topCustomers[0]?._sum.grandTotal || 0)}
          </p>
        </div>
      </div>

      {/* Grid: Status Distribution & Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <TrendingUp className="w-4 h-4 text-brand-600" />
            <h2 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider">
              Status Breakdown
            </h2>
          </div>

          <div className="space-y-3">
            {statusBreakdown.map((sb) => (
              <div key={sb.status} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="font-mono font-bold text-slate-800 block">{sb.status}</span>
                  <span className="text-[11px] text-slate-400">{sb._count.id} estimation(s)</span>
                </div>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formatINR(sb._sum.grandTotal || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Clients by Value */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Users className="w-4 h-4 text-brand-600" />
            <h2 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider">
              Top Customer Accounts
            </h2>
          </div>

          <div className="space-y-3">
            {topCustomers.map((tc, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="font-bold text-slate-800 block truncate max-w-xs">{tc.companyName}</span>
                  <span className="text-[11px] text-slate-400">{tc._count.id} quotation(s)</span>
                </div>
                <span className="font-mono font-bold text-emerald-600 text-sm">
                  {formatINR(tc._sum.grandTotal || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}