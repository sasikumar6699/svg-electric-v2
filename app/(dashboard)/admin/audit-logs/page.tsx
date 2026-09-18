'use client';

import React, { useState, useEffect } from 'react';
import { History, Search, Filter, Loader2, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (actionFilter) q.set('action', actionFilter);
      if (entityFilter) q.set('entity', entityFilter);

      const res = await fetch(`/api/admin/audit-logs?${q.toString()}`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {
      console.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter]);

  return (
    <div className="space-y-6 pb-20">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
            ADMIN MASTER
          </span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Audit Trail</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable logging of user authentication, catalog modifications, price updates, and quotation generation.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600">Filter Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-amber-500"
          >
            <option value="">-- All Actions --</option>
            <option value="USER_LOGIN">USER_LOGIN</option>
            <option value="ESTIMATION_FINALIZED">ESTIMATION_FINALIZED</option>
            <option value="ESTIMATION_DRAFT_CREATED">ESTIMATION_DRAFT_CREATED</option>
            <option value="PDF_GENERATED">PDF_GENERATED</option>
            <option value="PRICING_RULE_CREATED">PRICING_RULE_CREATED</option>
            <option value="PRICING_RULE_UPDATED">PRICING_RULE_UPDATED</option>
            <option value="PRODUCT_CREATED">PRODUCT_CREATED</option>
            <option value="PRODUCT_SPECS_MAPPED">PRODUCT_SPECS_MAPPED</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600">Filter Entity:</span>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-amber-500"
          >
            <option value="">-- All Entities --</option>
            <option value="Estimation">Estimation</option>
            <option value="Product">Product</option>
            <option value="PricingRule">PricingRule</option>
            <option value="User">User</option>
            <option value="Specification">Specification</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-mono border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
                    <span>Loading audit trail...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    No audit records match the selected filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                      {format(new Date(log.createdAt), 'dd-MMM-yyyy HH:mm:ss')}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{log.user?.name || 'System'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{log.user?.email || 'SYSTEM'}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                      {log.entity}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                      {log.details ? JSON.stringify(log.details) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}