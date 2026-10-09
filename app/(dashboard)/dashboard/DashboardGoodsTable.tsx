'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  SlidersHorizontal,
  FileSpreadsheet,
  Copy,
  ExternalLink,
  ChevronRight,
  Boxes,
} from 'lucide-react';

interface FinishedGoodItem {
  id: string;
  modelNumber: string;
  name: string;
  categoryName: string;
  categoryCode: string;
  enclosureHeight: number | null;
  enclosureWidth: number | null;
  enclosureDepth: number | null;
  ipRating: string | null;
  formRating: string | null;
  bomItemsCount: number;
  variantsCount: number;
  bomMaterialCost: number;
  netManufacturingCost: number;
  finalExWorksPrice: number;
  finalGrossPrice: number;
  createdAt: string;
}

interface DashboardGoodsTableProps {
  finishedGoods: FinishedGoodItem[];
}

export function DashboardGoodsTable({ finishedGoods }: DashboardGoodsTableProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = useMemo(() => {
    return Array.from(new Set(finishedGoods.map((fg) => fg.categoryName).filter(Boolean)));
  }, [finishedGoods]);

  const filteredGoods = useMemo(() => {
    return finishedGoods.filter((fg) => {
      const matchSearch =
        !search.trim() ||
        fg.modelNumber.toLowerCase().includes(search.toLowerCase()) ||
        fg.name.toLowerCase().includes(search.toLowerCase()) ||
        fg.categoryName.toLowerCase().includes(search.toLowerCase());

      const matchCat = selectedCategory === 'ALL' || fg.categoryName === selectedCategory;

      return matchSearch && matchCat;
    });
  }, [finishedGoods, search, selectedCategory]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Model Number or Name..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Categories ({finishedGoods.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-600 font-mono border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Official Model & Category</th>
              <th className="py-3 px-4">Panel Specifications</th>
              <th className="py-3 px-4 text-center">BOM Items</th>
              <th className="py-3 px-4 text-right">Direct Cost</th>
              <th className="py-3 px-4 text-right">Ex-Works Selling</th>
              <th className="py-3 px-4 text-right">Gross (+18% GST)</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {filteredGoods.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <Boxes className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-medium">No Products match your filter</p>
                </td>
              </tr>
            ) : (
              filteredGoods.map((fg) => (
                <tr key={fg.id} className="hover:bg-blue-50/30 transition-colors group">
                  {/* Model & Category */}
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-blue-700 text-xs">
                      {fg.modelNumber}
                    </div>
                    <div className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      {fg.categoryName}
                    </div>
                  </td>

                  {/* Specifications & Dimensions */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-semibold text-slate-900 truncate">{fg.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {fg.enclosureHeight && fg.enclosureWidth
                        ? `${fg.enclosureHeight}×${fg.enclosureWidth}×${fg.enclosureDepth || 0} mm`
                        : 'Standard Enclosure'}
                      {fg.ipRating ? ` • ${fg.ipRating}` : ''}
                      {fg.formRating ? ` • ${fg.formRating}` : ''}
                    </div>
                  </td>

                  {/* BOM Items Count */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {fg.bomItemsCount} lines
                    </span>
                  </td>

                  {/* Direct Cost */}
                  <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-600">
                    ₹{fg.netManufacturingCost.toLocaleString('en-IN')}
                  </td>

                  {/* Ex-Works Selling */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                    ₹{fg.finalExWorksPrice.toLocaleString('en-IN')}
                  </td>

                  {/* Gross Price */}
                  <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700">
                    ₹{fg.finalGrossPrice.toLocaleString('en-IN')}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Link
                        href={`/sales/configurator?modelId=${fg.id}`}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 whitespace-nowrap"
                        title="Configure variants & generate commercial estimation"
                      >
                        <SlidersHorizontal className="w-3 h-3" />
                        <span>Estimate</span>
                      </Link>

                      <Link
                        href={`/admin/finished-goods/${fg.id}`}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 whitespace-nowrap"
                        title="View confidential 4-stage costing sheet and export to Excel"
                      >
                        <FileSpreadsheet className="w-3 h-3 text-blue-600" />
                        <span>Cost Sheet</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
