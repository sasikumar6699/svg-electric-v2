'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatINR } from '@/lib/utils';
import {
  FileSpreadsheet,
  Search,
  PlusCircle,
  Eye,
  Edit,
  Copy,
  FileDown,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';

export default function EstimationsListPage() {
  const router = useRouter();
  const [estimations, setEstimations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchEstimations = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        status: statusFilter,
        page: String(page),
      });
      const res = await fetch(`/api/estimations?${query.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setEstimations(data.estimations || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstimations();
  }, [search, statusFilter, page]);

  const handleDuplicate = async (id: string) => {
    if (!confirm('Duplicate this estimation as a new draft?')) return;
    try {
      const res = await fetch(`/api/estimations/${id}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        router.push(`/estimations/${data.estimation.id}`);
      } else {
        alert(data.error || 'Failed to duplicate');
      }
    } catch {
      alert('Error duplicating estimation');
    }
  };

  const handleDelete = async (id: string, num: string) => {
    if (!confirm(`Are you sure you want to delete estimation ${num}?`)) return;
    try {
      const res = await fetch(`/api/estimations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchEstimations();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete estimation');
      }
    } catch {
      alert('Error deleting estimation');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Estimations Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Search, filter, view, and manage all sales estimations and quotations.
          </p>
        </div>
        <Link
          href="/estimations/new"
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Estimation</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Est #, Company, Ref..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'PENDING_APPROVAL', label: 'Pending Approval' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'DRAFT', label: 'Drafts' },
            { id: 'REVISION_REQUESTED', label: 'Revisions' },
            { id: 'REJECTED', label: 'Rejected' },
            { id: 'FINALIZED', label: 'Finalized' },
            { id: 'CANCELLED', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white font-semibold shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-mono border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Estimation No.</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer / Company</th>
                <th className="px-4 py-3">Created By</th>
                <th className="px-4 py-3 text-right">Grand Total</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
                    <span>Loading estimations...</span>
                  </td>
                </tr>
              ) : estimations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No estimations match the selected criteria.
                  </td>
                </tr>
              ) : (
                estimations.map((est) => (
                  <tr key={est.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-brand-600 whitespace-nowrap">
                      <Link href={`/estimations/${est.id}`} className="hover:underline">
                        {est.estimationNumber}
                      </Link>
                      {est.referenceNumber && (
                        <p className="text-[10px] text-slate-400 font-sans truncate">Ref: {est.referenceNumber}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {format(new Date(est.date), 'dd-MMM-yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800 truncate max-w-[200px]">{est.companyName}</p>
                      <p className="text-[10px] text-slate-400 truncate">{est.customerName}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {est.createdBy?.name || 'Sales'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatINR(est.grandTotal)}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                          est.status === 'APPROVED' || est.status === 'FINALIZED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : est.status === 'PENDING_APPROVAL'
                            ? 'bg-amber-50 text-amber-800 border border-amber-300'
                            : est.status === 'REVISION_REQUESTED'
                            ? 'bg-amber-100 text-amber-900 border border-amber-400 font-bold'
                            : est.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : est.status === 'PDF_GENERATED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {est.status === 'PENDING_APPROVAL'
                          ? 'PENDING'
                          : est.status === 'REVISION_REQUESTED'
                          ? 'REVISION'
                          : est.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/estimations/${est.id}`}
                          title="View Details"
                          className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        {(est.status === 'DRAFT' || est.status === 'REVISION_REQUESTED') && (
                          <Link
                            href={`/estimations/${est.id}/edit`}
                            title={est.status === 'REVISION_REQUESTED' ? 'Edit & Revise' : 'Edit Draft'}
                            className="p-1 rounded hover:bg-slate-100 text-amber-600 hover:text-amber-700 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        <button
                          onClick={() => handleDuplicate(est.id)}
                          title="Duplicate Estimation"
                          className="p-1 rounded hover:bg-slate-100 text-brand-600 hover:text-brand-700 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={`/api/estimations/${est.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Download PDF"
                          className="p-1 rounded hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDelete(est.id, est.estimationNumber)}
                          title="Delete Estimation"
                          className="p-1 rounded hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Total {totalCount} estimation(s)</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}