'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Boxes,
  ArrowLeft,
  Copy,
  SlidersHorizontal,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Building2,
  Layers,
  Sparkles,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import * as xlsx from 'xlsx';

export default function FinishedGoodDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [fg, setFg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('ALL');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/finished-goods/${id}`);
        if (!res.ok) throw new Error('Failed to load Product details');
        const data = await res.json();
        setFg(data.finishedGood);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading panel costing details...</p>
      </div>
    );
  }

  if (!fg) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-sm font-bold text-slate-700">Product Not Found</p>
        <Link href="/admin/finished-goods" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
          &larr; Back to Product Catalog
        </Link>
      </div>
    );
  }

  const sections = Array.from(new Set(fg.bomItems?.map((it: any) => it.sectionName) || [])) as string[];
  const displayedItems =
    activeSection === 'ALL'
      ? fg.bomItems || []
      : (fg.bomItems || []).filter((it: any) => it.sectionName === activeSection);

  // Export full BOM with stages to Excel
  const handleExportExcel = () => {
    const headers = [
      'S.No',
      'Sub-Assembly / Section',
      'Material Description',
      'Specification / Rating',
      'Type Code',
      'Make / Brand',
      'Unit',
      'Quantity',
      'Unit Price (INR)',
      'Total Amount (INR)',
      'GST Amount (INR)',
      'Grand Total (INR)',
    ];

    const rows = (fg.bomItems || []).map((it: any) => [
      it.sNo,
      it.sectionName,
      it.description,
      it.rating || '',
      it.typeCode || '',
      it.make,
      it.unit,
      it.quantity,
      it.unitPrice,
      it.totalAmount,
      it.gstAmount,
      it.grandTotal,
    ]);

    const summaryRows = [
      [],
      ['--- 4-STAGE PANEL COSTING SUMMARY ---'],
      ['BOM Bought-Out Hardware:', fg.bomMaterialCost],
      ['Stage 1: Fabrication (Enclosure):', fg.fabricationCost],
      ['Stage 2: Busbar Distribution System:', fg.busbarCost],
      ['Stage 3: Control & Power Wiring Labor:', fg.wiringCost],
      ['Total Direct Manufacturing Cost:', fg.netManufacturingCost],
      ['FAT Routine Testing:', fg.fatTestingCost],
      ['Engineering Design & Documentation:', fg.designEngineeringCost],
      ['Factory Overheads:', fg.overheadCost],
      ['Gross Profit Margin (%):', `${fg.profitMarginPercent}%`],
      ['Ex-Works Selling Price:', fg.finalExWorksPrice],
      ['GST 18%:', fg.gstAmount],
      ['Final Selling Price (with GST):', fg.finalGrossPrice],
    ];

    const ws = xlsx.utils.aoa_to_sheet([headers, ...rows, ...summaryRows]);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, '4-Stage Cost Sheet');
    xlsx.writeFile(wb, `${fg.modelNumber}_Cost_Sheet.xlsx`);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm text-white">
        <div>
          <Link
            href="/admin/finished-goods"
            className="flex items-center gap-1.5 text-xs font-mono text-blue-400 hover:text-blue-300 uppercase tracking-wider mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Finished Goods Catalog</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">{fg.name}</h1>
            <span className="text-xs bg-blue-600 text-white font-mono font-bold px-2.5 py-0.5 rounded-full">
              {fg.modelNumber}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">{fg.description}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/sales/configurator?modelId=${fg.id}`}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Sales Configurator</span>
          </Link>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Cost Sheet</span>
          </button>
        </div>
      </div>

      {/* 4-Stage Costing Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Stage 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 font-mono">
            <span>STAGE 1: FABRICATION</span>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <p className="text-xl font-black text-slate-900 font-mono">
            ₹{fg.fabricationCost.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500">
            {fg.enclosureHeight}×{fg.enclosureWidth}×{fg.enclosureDepth} mm | {fg.ipRating} | {fg.formRating}
          </p>
          <div className="bg-blue-50 text-blue-900 px-2 py-1 rounded text-[10px] font-mono">
            Formula: Area(m²) × ₹450 × 4.2 + Plinth (₹9k) + Locks (₹6k)
          </div>
        </div>

        {/* Stage 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 font-mono">
            <span>STAGE 2: BUSBARS</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-xl font-black text-slate-900 font-mono">
            ₹{fg.busbarCost.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500">Power distribution & insulator clamps</p>
          <div className="bg-emerald-50 text-emerald-900 px-2 py-1 rounded text-[10px] font-mono">
            Formula: (Amps/CD) × 12m × Density × Rate/kg + Sleeves + Labor
          </div>
        </div>

        {/* Stage 3 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 font-mono">
            <span>STAGE 3: WIRING</span>
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
          </div>
          <p className="text-xl font-black text-slate-900 font-mono">
            ₹{fg.wiringCost.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500">Control cables, ferrules & point labor</p>
          <div className="bg-indigo-50 text-indigo-900 px-2 py-1 rounded text-[10px] font-mono">
            Formula: (Points × ₹35/pt) + Wire Materials & Trunking
          </div>
        </div>

        {/* Stage 4 */}
        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-amber-400 font-mono">
            <span>STAGE 4: FINAL SELLING</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-xl font-black text-emerald-400 font-mono">
            ₹{fg.finalGrossPrice.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-slate-400">
            Ex-Works ₹{fg.finalExWorksPrice.toLocaleString('en-IN')} + 18% GST (Margin {fg.profitMarginPercent}%)
          </p>
          <div className="bg-slate-800 text-amber-300 px-2 py-1 rounded text-[10px] font-mono">
            Formula: Direct Cost × (1 + Overheads%) × (1 + Margin%) + 18% GST
          </div>
        </div>
      </div>

      {/* Configured Variants Overview */}
      {fg.variants && fg.variants.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <span>Configured Upgrade Variants ({fg.variants.length} Dimensions)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fg.variants.map((dim: any, idx: number) => (
              <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-900 block mb-1.5">{dim.dimensionName}</span>
                <div className="space-y-1">
                  {dim.options.map((opt: any, oIdx: number) => (
                    <div
                      key={oIdx}
                      className={`flex items-center justify-between p-1.5 rounded ${
                        opt.isDefault ? 'bg-blue-50 border border-blue-200 text-blue-900 font-bold' : 'text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {opt.isDefault && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                        <span>{opt.optionName}</span>
                      </div>
                      <span className="font-mono text-[11px]">
                        {opt.priceDelta === 0 ? 'Base' : `${opt.priceDelta > 0 ? '+' : ''}₹${opt.priceDelta.toLocaleString('en-IN')}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Itemized BOM Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide font-mono">
              Itemized Engineering Bill of Materials (BOM)
            </span>
            <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
              {displayedItems.length} Lines
            </span>
          </div>

          {/* Section Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveSection('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                activeSection === 'ALL' ? 'bg-slate-900 text-white' : 'bg-white border text-slate-700 hover:bg-slate-100'
              }`}
            >
              All Sections ({fg.bomItems?.length || 0})
            </button>
            {sections.map((sec) => (
              <button
                key={sec}
                onClick={() => setActiveSection(sec)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  activeSection === sec ? 'bg-slate-900 text-white' : 'bg-white border text-slate-700 hover:bg-slate-100'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto max-h-[550px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-300 uppercase font-mono text-[10px] tracking-wider sticky top-0 z-10">
              <tr>
                <th className="py-3 px-3 w-12 text-center">S.No</th>
                <th className="py-3 px-3">Make</th>
                <th className="py-3 px-3">Material Description</th>
                <th className="py-3 px-3">Rating / Specs</th>
                <th className="py-3 px-3">Type Code</th>
                <th className="py-3 px-2 text-center w-14">Unit</th>
                <th className="py-3 px-2 text-center w-14">Qty</th>
                <th className="py-3 px-3 text-right">Price/Unit (₹)</th>
                <th className="py-3 px-3 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {displayedItems.map((item: any, idx: number) => (
                <tr
                  key={item.id}
                  className={`hover:bg-blue-50/40 transition-colors ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                  }`}
                >
                  <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500">
                    {item.sNo || idx + 1}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-[11px]">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold uppercase">
                      {item.make}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-900 max-w-sm truncate" title={item.description}>
                    {item.description}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                    {item.rating || '-'}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                    {item.typeCode || '-'}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                    {item.unit}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-800">
                    {item.quantity}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                    ₹{item.unitPrice.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    ₹{item.totalAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
