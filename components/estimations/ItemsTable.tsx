'use client';

import React from 'react';
import { formatINR } from '@/lib/utils';
import { Layers, PlusCircle, Trash2, Tag } from 'lucide-react';

interface ItemsTableProps {
  items: any[];
  onOpenAddModal: () => void;
  onRemoveItem: (index: number) => void;
}

export const ItemsTable: React.FC<ItemsTableProps> = ({
  items,
  onOpenAddModal,
  onRemoveItem,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-600" />
            <span>Configured Products ({items.length})</span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Each product is priced dynamically according to its configured technical specifications.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Add Product</span>
        </button>
      </div>

      {items.length === 0 ? (
        <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl text-center">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-600">No products added to this estimation yet.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Click "+ Add Product" above to configure electrical panels and calculate estimated prices.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-mono border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">S.No</th>
                <th className="px-4 py-3">Product / Panel</th>
                <th className="px-4 py-3">Technical Specifications Snapshot</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3 text-right">Line Total</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-mono text-slate-500">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-800">{item.productName}</p>
                    <p className="text-[10px] font-mono text-brand-600">[{item.productCode}]</p>
                    <p className="text-[10px] text-slate-400">{item.category}</p>
                  </td>
                  <td className="px-4 py-3 max-w-sm">
                    <div className="flex flex-wrap gap-1">
                      {item.detailedSpecs?.map((ds: any, sIdx: number) => (
                        <span
                          key={sIdx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-700"
                        >
                          <strong className="text-slate-900">{ds.name}:</strong>
                          <span>{ds.label}</span>
                          {ds.price > 0 && (
                            <span className="font-mono text-emerald-700 text-[9px] font-semibold">
                              (+{formatINR(ds.price)})
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-semibold">{item.quantity}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-mono text-slate-700 font-semibold">{formatINR(item.unitPrice)}</div>
                    {item.isManualPrice && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-0.5 font-sans">
                        <Tag className="w-2.5 h-2.5" /> Manual Override
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{formatINR(item.lineTotal)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(idx)}
                      className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};