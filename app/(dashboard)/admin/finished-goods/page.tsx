'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Boxes,
  Plus,
  Copy,
  SlidersHorizontal,
  FileSpreadsheet,
  Trash2,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface FinishedGoodItem {
  id: string;
  modelNumber: string;
  name: string;
  category: {
    id: string;
    code: string;
    name: string;
  };
  description: string | null;
  enclosureHeight: number | null;
  enclosureWidth: number | null;
  enclosureDepth: number | null;
  ipRating: string | null;
  formRating: string | null;
  bomMaterialCost: number;
  fabricationCost: number;
  busbarCost: number;
  wiringCost: number;
  netManufacturingCost: number;
  finalExWorksPrice: number;
  gstAmount: number;
  finalGrossPrice: number;
  _count: {
    bomItems: number;
    variants: number;
  };
  variants: any[];
  createdAt: string;
}

export default function FinishedGoodsListPage() {
  const [goods, setGoods] = useState<FinishedGoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Clone Modal State
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [cloneSource, setCloneSource] = useState<FinishedGoodItem | null>(null);
  const [newModelNumber, setNewModelNumber] = useState('');
  const [cloning, setCloning] = useState(false);

  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchGoods = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/finished-goods');
      if (!res.ok) throw new Error('Failed to load Finished Goods');
      const data = await res.json();
      setGoods(data.finishedGoods || []);
    } catch (err: any) {
      showNotify('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoods();
  }, []);

  const filteredGoods = goods.filter((g) => {
    const matchSearch =
      !search ||
      g.modelNumber.toLowerCase().includes(search.toLowerCase()) ||
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.category?.name.toLowerCase().includes(search.toLowerCase());

    const matchCat = selectedCategory === 'ALL' || g.category?.name === selectedCategory;
    return matchSearch && matchCat;
  });

  const categories = Array.from(new Set(goods.map((g) => g.category?.name).filter(Boolean)));

  const handleOpenClone = (item: FinishedGoodItem) => {
    setCloneSource(item);
    setNewModelNumber(`${item.modelNumber}-REV1`);
    setCloneModalOpen(true);
  };

  const handleConfirmClone = async () => {
    if (!cloneSource) return;
    try {
      setCloning(true);
      const res = await fetch(`/api/finished-goods/${cloneSource.id}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newModelNumber }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to clone model');
      }
      const data = await res.json();
      showNotify('success', data.message || 'Model cloned successfully');
      setCloneModalOpen(false);
      fetchGoods();
    } catch (err: any) {
      showNotify('error', err.message);
    } finally {
      setCloning(false);
    }
  };

  const handleDelete = async (id: string, modelNumber: string) => {
    if (!confirm(`Are you sure you want to delete model "${modelNumber}"? This will remove its BOM and variant configurations.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/finished-goods/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete Finished Good');
      showNotify('success', `Model "${modelNumber}" deleted.`);
      fetchGoods();
    } catch (err: any) {
      showNotify('error', err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all ${
            notification.type === 'success'
              ? 'bg-slate-900 text-emerald-400 border-emerald-500/40'
              : 'bg-slate-900 text-rose-400 border-rose-500/40'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm text-white">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400 uppercase tracking-wider mb-1">
            <Boxes className="w-4 h-4" />
            <span>Industrial Panel Costing & Product Engineering</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
            Product Master Catalog & Costing Models
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Master repository of engineered panels with 4-stage deterministic costing (Fabrication, Busbar, Wiring, Margins), 500-item BOMs, and dynamic variant configurations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/finished-goods/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Create Product</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Products</span>
            <Boxes className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{goods.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Engineered panel products</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Active Categories</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{categories.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">MCC, PLC, APFC, PCC, Drives</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Sales Configurator</span>
            <SlidersHorizontal className="w-4 h-4 text-amber-600" />
          </div>
          <Link
            href="/sales/configurator"
            className="text-xs text-blue-600 hover:text-blue-800 font-bold underline flex items-center gap-1 mt-2"
          >
            <span>Open Configurator</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
          <p className="text-[10px] text-slate-400 mt-1">Interactive instant estimations</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Model Number (e.g. SVG-DC-680A) or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 font-medium">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Finished Goods Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide font-mono">
              Engineered Panel Products
            </span>
            <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
              {filteredGoods.length} Models
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Use &quot;Clone&quot; to replicate a 500-item BOM into a new model in 30 seconds.
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Loading Products...</p>
          </div>
        ) : filteredGoods.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Boxes className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No Products Found</p>
            <p className="text-xs text-slate-400 mt-1">
              Click &quot;+ Create Product&quot; to build your first engineered panel model.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-300 uppercase font-mono text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Model Number</th>
                  <th className="py-3 px-4">Panel Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-3 text-center">BOM Items</th>
                  <th className="py-3 px-3 text-center">Dimensions</th>
                  <th className="py-3 px-4 text-right">Direct Cost (₹)</th>
                  <th className="py-3 px-4 text-right">Ex-Works Selling (₹)</th>
                  <th className="py-3 px-4 text-right">Gross (+18% GST)</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredGoods.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-blue-50/40 transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                    }`}
                  >
                    {/* Model Number */}
                    <td className="py-3 px-4 font-mono font-bold text-xs text-blue-700">
                      <Link href={`/admin/finished-goods/${item.id}`} className="hover:underline">
                        {item.modelNumber}
                      </Link>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-semibold text-slate-900 truncate" title={item.name}>
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5" title={item.description || ''}>
                        {item.description || 'Standard engineered switchboard'}
                      </p>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-semibold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                        {item.category?.name}
                      </span>
                    </td>

                    {/* BOM Items Count */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 text-[11px]">
                        {item._count.bomItems} lines
                      </span>
                    </td>

                    {/* Dimensions */}
                    <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-600">
                      {item.enclosureHeight && item.enclosureWidth ? (
                        <span>
                          {item.enclosureHeight}×{item.enclosureWidth}×{item.enclosureDepth || '-'}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Direct Cost */}
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      ₹{item.netManufacturingCost.toLocaleString('en-IN')}
                    </td>

                    {/* Ex-Works Selling */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{item.finalExWorksPrice.toLocaleString('en-IN')}
                    </td>

                    {/* Gross */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      ₹{item.finalGrossPrice.toLocaleString('en-IN')}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Clone Button */}
                        <button
                          onClick={() => handleOpenClone(item)}
                          title="Clone as New Model"
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* View / Costing Details */}
                        <Link
                          href={`/admin/finished-goods/${item.id}`}
                          title="View 4-Stage Cost Sheet"
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </Link>

                        {/* Configure in Sales */}
                        <Link
                          href={`/sales/configurator?modelId=${item.id}`}
                          title="Open in Sales Configurator"
                          className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </Link>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(item.id, item.modelNumber)}
                          title="Delete Model"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1-CLICK CLONE MODAL                                                       */}
      {/* ========================================================================= */}
      {cloneModalOpen && cloneSource && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Copy className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm tracking-wide">Clone Finished Good Model</h3>
              </div>
              <button onClick={() => setCloneModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Cloning will copy all <strong>{cloneSource._count.bomItems} BOM materials</strong>, dimensions, 4-stage costing parameters, and variant configurations from <strong>{cloneSource.modelNumber}</strong> into an independent new model.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Unique Model Number *
                </label>
                <input
                  type="text"
                  required
                  value={newModelNumber}
                  onChange={(e) => setNewModelNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. SVG-DC-800A-STD"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs text-blue-900">
                <p className="font-bold">Base Model: {cloneSource.name}</p>
                <p className="text-[11px] text-blue-700 mt-0.5">Ex-Works Baseline: ₹{cloneSource.finalExWorksPrice.toLocaleString('en-IN')}</p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCloneModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClone}
                  disabled={cloning || !newModelNumber}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {cloning ? 'Cloning Model...' : 'Confirm & Clone'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
