'use client';

import React, { useState, useEffect } from 'react';
import { GitFork, Save, Loader2, CheckCircle2, AlertCircle, Box, Sliders, IndianRupee } from 'lucide-react';
import { formatINR } from '@/lib/utils';

export default function ProductSpecificationsMappingPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [allSpecs, setAllSpecs] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [loading, setLoading] = useState(true);

  // Mapped state: Record<specId, { isMapped: boolean; isRequired: boolean; displayOrder: number }>
  const [mappings, setMappings] = useState<Record<string, { isMapped: boolean; isRequired: boolean; displayOrder: number }>>({});
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, specRes] = await Promise.all([
          fetch('/api/admin/products'),
          fetch('/api/admin/specifications'),
        ]);
        const [prodData, specData] = await Promise.all([prodRes.json(), specRes.json()]);

        const prods = prodData.products || [];
        setProducts(prods);
        setAllSpecs(specData.specifications || []);

        if (prods.length > 0) {
          setSelectedProductId(prods[0].id);
        }
      } catch {
        console.error('Failed to load mapping data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // When selected product changes, load current mappings
  useEffect(() => {
    if (!selectedProductId) return;

    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const mapState: Record<string, { isMapped: boolean; isRequired: boolean; displayOrder: number }> = {};

    allSpecs.forEach((s, idx) => {
      const existing = prod.productSpecs?.find((ps: any) => ps.specificationId === s.id);
      if (existing) {
        mapState[s.id] = {
          isMapped: true,
          isRequired: existing.isRequired,
          displayOrder: existing.displayOrder ?? idx,
        };
      } else {
        mapState[s.id] = {
          isMapped: false,
          isRequired: true,
          displayOrder: idx,
        };
      }
    });

    setMappings(mapState);
    setSavedSuccess(false);
  }, [selectedProductId, products, allSpecs]);

  const toggleMapped = (specId: string) => {
    setMappings((prev) => ({
      ...prev,
      [specId]: {
        ...prev[specId],
        isMapped: !prev[specId]?.isMapped,
      },
    }));
    setSavedSuccess(false);
  };

  const toggleRequired = (specId: string) => {
    setMappings((prev) => ({
      ...prev,
      [specId]: {
        ...prev[specId],
        isRequired: !prev[specId]?.isRequired,
      },
    }));
    setSavedSuccess(false);
  };

  const handleSave = async () => {
    if (!selectedProductId) return;
    setSaving(true);
    setSavedSuccess(false);

    try {
      const specificationsToSave = Object.entries(mappings)
        .filter(([_, v]) => v.isMapped)
        .map(([specId, v]) => ({
          specificationId: specId,
          isRequired: v.isRequired,
          displayOrder: v.displayOrder,
        }));

      const res = await fetch('/api/admin/product-specifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          specifications: specificationsToSave,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        // Refresh product specs in background
        const pRes = await fetch('/api/admin/products');
        const pData = await pRes.json();
        setProducts(pData.products || []);
      } else {
        alert('Failed to save mapping');
      }
    } catch {
      alert('Error saving mappings');
    } finally {
      setSaving(false);
    }
  };

  const currentProduct = products.find((p) => p.id === selectedProductId);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
              ADMIN MASTER
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Product-Specification Mapping</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure dynamic technical parameters applicable to each specific electrical panel finished good.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Mappings</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Product specifications updated successfully! Changes take effect immediately in estimation builder.</span>
        </div>
      )}

      {/* Product Selector */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
        <label className="block text-xs font-bold font-mono text-slate-700 uppercase tracking-wider">
          Select Product to Configure:
        </label>
        <div className="flex flex-wrap gap-2">
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProductId(p.id)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all text-left border ${
                selectedProductId === p.id
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm font-bold'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="font-mono text-[10px] opacity-80">{p.productCode}</div>
              <div className="truncate max-w-[200px]">{p.name}</div>
              <div className="text-[10px] font-mono mt-0.5 opacity-90">Base: {formatINR(p.basePrice || 0)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Product Pricing Overview Banner */}
      {currentProduct && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-50 via-amber-50/50 to-orange-50 border border-amber-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center font-bold flex-shrink-0">
              <IndianRupee className="w-5 h-5 text-amber-900" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800">
                ACTIVE PRICING RULE BASELINE
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                {currentProduct.name} ({currentProduct.productCode})
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Starting Enclosure Price</span>
              <span className="text-base font-bold font-mono text-slate-900">{formatINR(currentProduct.basePrice || 0)}</span>
            </div>
            <div className="text-xs text-amber-900 bg-white/90 px-3 py-2 rounded-lg border border-amber-300 font-semibold shadow-xs">
              Formula: Base Enclosure + Sum of Selected Specification Add-ons
            </div>
          </div>
        </div>
      )}

      {/* Specifications Mapping Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-600" />
              <span>Available Specifications Matrix</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Check the boxes below to link specifications to <strong className="text-slate-700">{currentProduct?.name}</strong>.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-mono border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-center">Applicable?</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Specification Name</th>
                <th className="px-4 py-3">Input Type</th>
                <th className="px-4 py-3">Available Options & Add-on Prices</th>
                <th className="px-4 py-3 text-center">Mandatory / Required?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
                    <span>Loading specifications...</span>
                  </td>
                </tr>
              ) : (
                allSpecs.map((spec) => {
                  const m = mappings[spec.id] || { isMapped: false, isRequired: true };
                  return (
                    <tr
                      key={spec.id}
                      className={`transition-colors ${m.isMapped ? 'bg-amber-50/30' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={m.isMapped}
                          onChange={() => toggleMapped(spec.id)}
                          className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {spec.code}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {spec.name}
                        {spec.unit && <span className="text-slate-400 font-normal"> ({spec.unit})</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {spec.inputType}
                      </td>
                      <td className="px-4 py-3 max-w-md">
                        <div className="flex flex-wrap gap-1.5">
                          {spec.options?.slice(0, 5).map((o: any) => (
                            <span
                              key={o.id}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-700 font-mono"
                            >
                              <span>{o.label}</span>
                              <span className="font-bold text-amber-800 text-[9px] bg-amber-50 px-1 rounded border border-amber-200">
                                +₹{(o.price || 0).toLocaleString('en-IN')}
                              </span>
                            </span>
                          ))}
                          {spec.options?.length > 5 && (
                            <span className="text-[10px] text-slate-400 font-mono self-center">
                              +{spec.options.length - 5} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <label className={`inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${m.isMapped ? 'text-slate-800' : 'text-slate-300'}`}>
                          <input
                            type="checkbox"
                            disabled={!m.isMapped}
                            checked={m.isRequired}
                            onChange={() => toggleRequired(spec.id)}
                            className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 disabled:opacity-30"
                          />
                          <span>Required</span>
                        </label>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}