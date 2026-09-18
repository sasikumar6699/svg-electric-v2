import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { formatINR } from '@/lib/utils';
import {
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  IndianRupee,
  Calendar,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Box,
  Eye,
  FileDown,
  AlertCircle,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { QuickApproveButton } from '@/components/dashboard/QuickApproveButton';

export default async function DashboardPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const isAdmin = session.role === 'ADMIN';
  const isSales = session.role === 'SALES_USER';

  const pendingApprovalWhere = isSales
    ? { status: 'PENDING_APPROVAL', createdById: session.userId }
    : { status: 'PENDING_APPROVAL' };

  const approvedWhere = isSales
    ? { status: { in: ['APPROVED', 'FINALIZED', 'PDF_GENERATED'] }, createdById: session.userId }
    : { status: { in: ['APPROVED', 'FINALIZED', 'PDF_GENERATED'] } };

  const draftWhere = isSales
    ? { status: 'DRAFT', createdById: session.userId }
    : { status: 'DRAFT' };

  const rejectedWhere = isSales
    ? { status: 'REJECTED', createdById: session.userId }
    : { status: 'REJECTED' };

  // Stats queries
  const [
    totalEstimations,
    pendingApprovalCount,
    approvedCount,
    draftCount,
    rejectedCount,
    allEstimations,
    pendingEstimations,
    categories,
  ] = await Promise.all([
    db.estimation.count({ where: isSales ? { createdById: session.userId } : undefined }),
    db.estimation.count({ where: pendingApprovalWhere as any }),
    db.estimation.count({ where: approvedWhere as any }),
    db.estimation.count({ where: draftWhere as any }),
    db.estimation.count({ where: rejectedWhere as any }),
    db.estimation.findMany({
      where: isSales
        ? {
            OR: [
              { createdById: session.userId },
              { status: { in: ['PENDING_APPROVAL', 'APPROVED', 'FINALIZED', 'PDF_GENERATED', 'REVISION_REQUESTED', 'REJECTED'] } },
            ],
          }
        : {},
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        createdBy: { select: { name: true } },
        _count: { select: { items: true } },
      },
    }),
    db.estimation.findMany({
      where: pendingApprovalWhere as any,
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        createdBy: { select: { name: true } },
        _count: { select: { items: true } },
      },
    }),
    db.productCategory.findMany({
      include: { _count: { select: { products: true } } },
    }),
  ]);

  const totalValueAgg = await db.estimation.aggregate({
    where: isSales
      ? { createdById: session.userId, status: { notIn: ['REJECTED', 'CANCELLED'] } }
      : { status: { notIn: ['REJECTED', 'CANCELLED'] } },
    _sum: { grandTotal: true },
  });
  const totalValue = totalValueAgg._sum.grandTotal || 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl text-white shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
              {session.role} CONSOLE
            </span>
            <span className="text-xs text-slate-400">• SVG Electric & Control Products</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Welcome, {session.name}</h1>
          <p className="text-xs text-slate-300 mt-1">
            Create dynamic electrical panel estimations, configure engineering specifications, and generate quotations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/estimations/new"
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg shadow-brand-600/30 transition-all active:scale-95 whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Estimation</span>
          </Link>
        </div>
      </div>

      {/* 6 KPI Cards: Total Est, Pending Approval, Approved, Drafts, Rejected, Pipeline Value */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Total Est */}
        <Link
          href="/estimations"
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-brand-300 hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">Total Est</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalEstimations}</p>
            <span className="text-[10px] text-slate-400 font-medium">All quotations</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </Link>

        {/* 2. Pending Approval */}
        <Link
          href="/estimations?status=PENDING_APPROVAL"
          className="bg-white p-4 rounded-xl border border-amber-300 shadow-sm hover:border-amber-400 hover:shadow-md transition-all flex items-center justify-between relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500" />
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider font-mono">Pending Approval</p>
              {pendingApprovalCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pendingApprovalCount}</p>
            <span className="text-[10px] text-amber-600/80 font-medium">
              {isAdmin ? 'Action required' : 'Awaiting review'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
        </Link>

        {/* 3. Approved */}
        <Link
          href="/estimations?status=APPROVED"
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">Approved</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{approvedCount}</p>
            <span className="text-[10px] text-slate-400 font-medium">Ready for clients</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Link>

        {/* 4. Drafts */}
        <Link
          href="/estimations?status=DRAFT"
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">Drafts</p>
            <p className="text-2xl font-bold text-slate-700 mt-1">{draftCount}</p>
            <span className="text-[10px] text-slate-400 font-medium">Work in progress</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
        </Link>

        {/* 5. Rejected */}
        <Link
          href="/estimations?status=REJECTED"
          className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm hover:border-rose-300 hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider font-mono">Rejected</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{rejectedCount}</p>
            <span className="text-[10px] text-slate-400 font-medium">Declined quotations</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <XCircle className="w-5 h-5" />
          </div>
        </Link>

        {/* 6. Pipeline Value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">Pipeline Value</p>
            <p className="text-base font-bold text-slate-900 mt-1 truncate">{formatINR(totalValue)}</p>
            <span className="text-[10px] text-slate-400 font-medium">Active quotations</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Pending Approvals Section (Prominently visible for both Admin and Sales) */}
      <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-50/50 to-transparent border-b border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">Estimations Pending Approval</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 font-mono">
                  {pendingApprovalCount} {pendingApprovalCount === 1 ? 'Quotation' : 'Quotations'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAdmin
                  ? 'Estimations submitted by Sales Engineers awaiting management review and authorization.'
                  : 'Your submitted estimations currently under management review.'}
              </p>
            </div>
          </div>

          <Link
            href="/estimations?status=PENDING_APPROVAL"
            className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Pending</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {pendingEstimations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5 opacity-80" />
              <span>All estimations are processed. There are no pending approvals at this time.</span>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-mono border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Quotation No.</th>
                  <th className="px-4 py-3">Customer / Company</th>
                  <th className="px-4 py-3">Submitted By</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingEstimations.map((est) => (
                  <tr key={est.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-brand-600">
                      <Link href={`/estimations/${est.id}`} className="hover:underline">
                        {est.estimationNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 truncate max-w-[200px]">{est.companyName}</p>
                      <p className="text-[10px] text-slate-400">{est._count.items} product item(s)</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        {est.createdBy?.name || 'Sales User'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {format(new Date(est.date), 'dd-MMM-yyyy')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {formatINR(est.grandTotal)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Pending Approval
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/estimations/${est.id}`}
                          className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold transition-colors"
                        >
                          Review
                        </Link>
                        {isAdmin && (
                          <QuickApproveButton
                            estimationId={est.id}
                            estimationNumber={est.estimationNumber}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Main Grid: Recent Estimations + Catalog Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Estimations Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-600" />
              <h2 className="text-sm font-bold text-slate-800">Recent Estimations</h2>
            </div>
            <Link
              href="/estimations"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-mono border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Est. Number</th>
                  <th className="px-4 py-3">Customer / Company</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allEstimations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No estimations found. Click "Create New Estimation" to begin.
                    </td>
                  </tr>
                ) : (
                  allEstimations.map((est) => (
                    <tr key={est.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-brand-600">
                        <Link href={`/estimations/${est.id}`} className="hover:underline">
                          {est.estimationNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800 truncate max-w-[180px]">{est.companyName}</p>
                        <p className="text-[10px] text-slate-400">{est._count?.items || 0} product item(s)</p>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {format(new Date(est.date), 'dd-MMM-yyyy')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {formatINR(est.grandTotal)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                            est.status === 'APPROVED' || est.status === 'FINALIZED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : est.status === 'PENDING_APPROVAL'
                              ? 'bg-amber-50 text-amber-800 border border-amber-300'
                              : est.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : est.status === 'PDF_GENERATED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {est.status === 'PENDING_APPROVAL' ? 'PENDING' : est.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/estimations/${est.id}`}
                            title="View Estimation"
                            className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <a
                            href={`/api/estimations/${est.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Download PDF"
                            className="p-1 rounded hover:bg-brand-50 text-brand-600 hover:text-brand-700 transition-colors"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Product Categories & Quick Nav (1 Col) */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-brand-600" />
                <h2 className="text-sm font-bold text-slate-800">Product Categories</h2>
              </div>
              {session.role === 'ADMIN' && (
                <Link href="/admin/products" className="text-[11px] font-semibold text-brand-600 hover:underline">
                  Manage
                </Link>
              )}
            </div>

            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                >
                  <span className="font-medium text-slate-700">{cat.name}</span>
                  <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500">
                    {cat._count.products} Products
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Action Box */}
          <div className="bg-gradient-to-br from-brand-900 to-slate-900 rounded-xl p-4 text-white shadow-sm space-y-3">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-brand-300">
              Estimation Guidelines
            </h3>
            <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Product specifications adapt dynamically by category.</li>
              <li>Unit prices are calculated via the Pricing Engine.</li>
              <li>Finalized estimations freeze snapshots permanently.</li>
              <li>Generated PDFs follow professional quotation standards.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
