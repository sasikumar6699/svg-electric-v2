'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  IndianRupee,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  Edit,
  Info,
  AlertCircle,
  Sliders,
  Layers,
  Calculator,
  Save,
  Check,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Tag
} from 'lucide-react';
import { formatINR } from '@/lib/utils';

export default function AdminPricingPage() {
  const [activeTab, setActiveTab] = useState<'options' | 'rules' | 'simulator'>('options');

  // Combination Rules State
  const [rules, setRules] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState('');

  // Add Rule Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalRuleCode, setModalRuleCode] = useState('');
  const [modalProductId, setModalProductId] = useState('');
  const [modalSpecChoices, setModalSpecChoices] = useState<Record<string, any>>({});
  const [modalBasePrice, setModalBasePrice] = useState<number | ''>('');
  const [modalNotes, setModalNotes] = useState('');
  const [savingRule, setSavingRule] = useState(false);
  const [ruleError, setRuleError] = useState<string | null>(null);

  // Quick Edit Price Modal State for Combination Rules
  const [editingRule, setEditingRule] = useState<any>(null);
  const [editPriceVal, setEditPriceVal] = useState<number | ''>('');

  // Specification Option Matrix State
  const [specifications, setSpecifications] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionSearch, setOptionSearch] = useState('');
  const [optionSpecFilter, setOptionSpecFilter] = useState('');
  const [optionProductFilter, setOptionProductFilter] = useState('');
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [savingOptionId, setSavingOptionId] = useState<string | null>(null);
  const [optionsNotification, setOptionsNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Simulator State
  const [simProductId, setSimProductId] = useState('');
  const [simSelectedOptions, setSimSelectedOptions] = useState<Record<string, string>>({});

  // 1. Fetch Combination Rules
  const fetchRules = async () => {
    setLoadingRules(true);
    try {
      const url = selectedProductId
        ? `/api/admin/pricing-rules?productId=${selectedProductId}`
        : '/api/admin/pricing-rules';
      const res = await fetch(url);
      const data = await res.json();
      setRules(data.rules || []);
    } catch {
      console.error('Failed to load pricing rules');
    } finally {
      setLoadingRules(false);
    }
  };

  // 2. Fetch Specification Options Matrix
  const fetchOptionMatrix = async () => {
    setLoadingOptions(true);
    try {
      const res = await fetch('/api/admin/pricing-matrix/options');
      const data = await res.json();
      setSpecifications(data.specifications || []);
      if (data.products) {
        setProducts(data.products);
        if (!simProductId && data.products.length > 0) {
          setSimProductId(data.products[0].id);
        }
      }
    } catch {
      console.error('Failed to load options pricing matrix');
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    fetchOptionMatrix();
  }, []);

  useEffect(() => {
    fetchRules();
  }, [selectedProductId]);

  // Set initial simulator choices when product changes
  useEffect(() => {
    if (!simProductId) return;
    const prod = products.find((p) => p.id === simProductId);
    if (!prod) return;

    // Find specifications mapped to this product
    const mappedSpecs = specifications.filter((s) =>
      s.productSpecs?.some((ps: any) => ps.product.id === simProductId)
    );

    const initialChoices: Record<string, string> = {};
    mappedSpecs.forEach((s) => {
      if (s.options && s.options.length > 0) {
        initialChoices[s.code] = s.options[0].value;
      }
    });
    setSimSelectedOptions(initialChoices);
  }, [simProductId, specifications]);

  // Handler: Save single option price change
  const handleSaveOptionPrice = async (optionId: string) => {
    const newPrice = editedPrices[optionId];
    if (newPrice === undefined) return;

    setSavingOptionId(optionId);
    setOptionsNotification(null);

    try {
      const res = await fetch('/api/admin/pricing-matrix/options', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId, price: newPrice }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to update option price');

      // Update local specifications state
      setSpecifications((prev) =>
        prev.map((spec) => ({
          ...spec,
          options: spec.options.map((opt: any) =>
            opt.id === optionId ? { ...opt, price: newPrice } : opt
          ),
        }))
      );

      // Clean up edited map for this option
      setEditedPrices((prev) => {
        const next = { ...prev };
        delete next[optionId];
        return next;
      });

      setOptionsNotification({ type: 'success', text: 'Option add-on price updated successfully' });
      setTimeout(() => setOptionsNotification(null), 3000);
    } catch (err: any) {
      setOptionsNotification({ type: 'error', text: err.message || 'Error updating price' });
    } finally {
      setSavingOptionId(null);
    }
  };

  // Handler: Batch save all modified option prices
  const handleBatchSaveOptions = async () => {
    const updates = Object.entries(editedPrices).map(([id, price]) => ({ id, price }));
    if (updates.length === 0) return;

    setLoadingOptions(true);
    setOptionsNotification(null);

    try {
      const res = await fetch('/api/admin/pricing-matrix/options', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Batch update failed');

      // Refresh option matrix from server
      await fetchOptionMatrix();
      setEditedPrices({});
      setOptionsNotification({
        type: 'success',
        text: `Successfully updated ${updates.length} specification option prices`,
      });
      setTimeout(() => setOptionsNotification(null), 3500);
    } catch (err: any) {
      setOptionsNotification({ type: 'error', text: err.message || 'Error saving changes' });
    } finally {
      setLoadingOptions(false);
    }
  };

  // Add Combination Rule Modal Handlers
  const handleOpenAddRule = () => {
    const nextCode = `PR-NEW-${Math.floor(1000 + Math.random() * 9000)}`;
    setModalRuleCode(nextCode);
    setModalProductId(products[0]?.id || '');
    setModalSpecChoices({});
    setModalBasePrice('');
    setModalNotes('[DEMO DATA] Configured panel combination');
    setRuleError(null);
    setIsModalOpen(true);
  };

  const selectedProductForModal = products.find((p) => p.id === modalProductId);

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalProductId || modalBasePrice === '') {
      setRuleError('Product and Base Price are required.');
      return;
    }

    setSavingRule(true);
    setRuleError(null);

    try {
      const res = await fetch('/api/admin/pricing-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleCode: modalRuleCode.trim().toUpperCase(),
          productId: modalProductId,
          specCriteria: modalSpecChoices,
          basePrice: Number(modalBasePrice),
          notes: modalNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save price rule');

      setIsModalOpen(false);
      fetchRules();
    } catch (err: any) {
      setRuleError(err.message || 'Error occurred');
    } finally {
      setSavingRule(false);
    }
  };

  const handleQuickUpdateRulePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule || editPriceVal === '') return;

    try {
      const res = await fetch('/api/admin/pricing-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRule.id,
          basePrice: Number(editPriceVal),
        }),
      });
      if (res.ok) {
        setEditingRule(null);
        fetchRules();
      } else {
        alert('Failed to update price');
      }
    } catch {
      alert('Error updating price');
    }
  };

  const handleToggleRuleActive = async (rule: any) => {
    try {
      await fetch('/api/admin/pricing-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rule.id, active: !rule.active }),
      });
      fetchRules();
    } catch {
      alert('Failed to update status');
    }
  };

  // Filtered specifications for Options Matrix
  const filteredSpecs = useMemo(() => {
    return specifications
      .filter((spec) => {
        if (optionSpecFilter && spec.id !== optionSpecFilter) return false;
        if (
          optionProductFilter &&
          !spec.productSpecs?.some((ps: any) => ps.product.id === optionProductFilter)
        ) {
          return false;
        }
        return true;
      })
      .map((spec) => {
        const matchingOptions = (spec.options || []).filter((opt: any) => {
          if (!optionSearch) return true;
          const query = optionSearch.toLowerCase();
          return (
            opt.label.toLowerCase().includes(query) ||
            opt.value.toLowerCase().includes(query) ||
            spec.name.toLowerCase().includes(query) ||
            spec.code.toLowerCase().includes(query)
          );
        });
        return { ...spec, filteredOptions: matchingOptions };
      })
      .filter((spec) => spec.filteredOptions.length > 0);
  }, [specifications, optionSpecFilter, optionProductFilter, optionSearch]);

  // Total modified options count
  const modifiedCount = Object.keys(editedPrices).length;

  // Simulator Calculations
  const simProduct = products.find((p) => p.id === simProductId);
  const simMappedSpecs = specifications.filter((s) =>
    s.productSpecs?.some((ps: any) => ps.product.id === simProductId)
  );

  const simAddonBreakdown = simMappedSpecs.map((spec) => {
    const selectedVal = simSelectedOptions[spec.code];
    const opt = spec.options?.find((o: any) => o.value === selectedVal);
    return {
      specCode: spec.code,
      specName: spec.name,
      optionLabel: opt?.label || 'None',
      optionValue: selectedVal,
      price: opt ? Number(opt.price || 0) : 0,
    };
  });

  const simProductBasePrice = Number(simProduct?.basePrice || 0);
  const simOptionsTotal = simAddonBreakdown.reduce((sum, item) => sum + item.price, 0);
  const simCalculatedAdditivePrice = simProductBasePrice + simOptionsTotal;

  // Check if any active combination rule matches the simulator choices
  const matchingRule = rules.find((r) => {
    if (!r.active || r.productId !== simProductId) return false;
    const criteria = r.specCriteria || {};
    const criteriaKeys = Object.keys(criteria);
    if (criteriaKeys.length === 0) return false;
    return criteriaKeys.every((k) => simSelectedOptions[k] === criteria[k]);
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
              ADMIN MASTER
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> ACTIVE PRICING ENGINE
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pricing Matrix Engine</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage specification option add-on prices, product starting base prices, and combination rule overrides.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'rules' && (
            <button
              onClick={handleOpenAddRule}
              className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Combination Rule</span>
            </button>
          )}

          {activeTab === 'options' && modifiedCount > 0 && (
            <button
              onClick={handleBatchSaveOptions}
              disabled={loadingOptions}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all animate-pulse"
            >
              <Save className="w-4 h-4" />
              <span>Save {modifiedCount} Changes</span>
            </button>
          )}
        </div>
      </div>

      {/* Pricing Rule Formula Explanation Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 via-slate-50 to-blue-50 border border-amber-200/80 shadow-sm text-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="font-bold flex items-center gap-1.5 font-mono text-[11px] uppercase text-amber-900">
              <Calculator className="w-4 h-4 text-amber-700" />
              Standard Pricing Rule Formula:
            </span>
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-slate-800 pt-0.5">
              <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 rounded font-semibold text-amber-900">
                Product Base Enclosure Price
              </span>
              <span className="font-bold text-slate-500">+</span>
              <span className="px-2 py-0.5 bg-blue-100 border border-blue-300 rounded font-semibold text-blue-900">
                Sum of Selected Specification Add-ons
              </span>
              <span className="font-bold text-slate-500">=</span>
              <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-300 rounded font-bold text-emerald-900">
                Final Unit Price
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-600 border-l border-slate-300 pl-4 max-w-sm hidden lg:block">
            <strong className="text-slate-800">Rule Precedence:</strong> If an active combination rule matches exact specifications, it overrides additive pricing. Otherwise, standard additive calculation applies.
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('options')}
          className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'options'
              ? 'border-amber-600 text-amber-800 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Specification Option Add-on Matrix</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600">
            {specifications.reduce((acc, s) => acc + (s.options?.length || 0), 0)}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'rules'
              ? 'border-amber-600 text-amber-800 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Combination Rules Matrix (Overrides)</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600">
            {rules.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'simulator'
              ? 'border-amber-600 text-amber-800 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Live Pricing Rule Simulator</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-700 font-mono">
            Interactive
          </span>
        </button>
      </div>

      {/* Notifications */}
      {optionsNotification && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            optionsNotification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {optionsNotification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{optionsNotification.text}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: SPECIFICATION OPTION PRICING MATRIX                                */}
      {/* ========================================================================= */}
      {activeTab === 'options' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-500 font-semibold">Filter:</span>
              </div>

              {/* Filter by Product */}
              <select
                value={optionProductFilter}
                onChange={(e) => setOptionProductFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-amber-500"
              >
                <option value="">-- All Products --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.productCode} - {p.name}
                  </option>
                ))}
              </select>

              {/* Filter by Specification */}
              <select
                value={optionSpecFilter}
                onChange={(e) => setOptionSpecFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-amber-500"
              >
                <option value="">-- All Specifications --</option>
                {specifications.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.code}] {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Box */}
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={optionSearch}
                onChange={(e) => setOptionSearch(e.target.value)}
                placeholder="Search option or spec..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {loadingOptions ? (
              <div className="p-12 text-center text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
                <span>Loading specification options matrix...</span>
              </div>
            ) : filteredSpecs.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                No specification options match the selected filters.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {filteredSpecs.map((spec) => {
                  const mappedProducts = (spec.productSpecs || []).map((ps: any) => ps.product);

                  return (
                    <div key={spec.id} className="p-4 space-y-3">
                      {/* Spec Group Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-200">
                              {spec.code}
                            </span>
                            <span className="text-xs font-bold text-slate-900">{spec.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({spec.filteredOptions.length} options)
                            </span>
                          </div>
                          {spec.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5">{spec.description}</p>
                          )}
                        </div>

                        {/* Mapped Products Badges */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-slate-400 font-semibold">Mapped To:</span>
                          {mappedProducts.length === 0 ? (
                            <span className="text-[10px] font-mono text-slate-400 italic">None</span>
                          ) : (
                            mappedProducts.map((p: any) => (
                              <span
                                key={p.id}
                                className="text-[10px] font-mono bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded shadow-2xs"
                                title={`Base Enclosure Price: ${formatINR(p.basePrice)}`}
                              >
                                {p.productCode}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Options Table for this Spec */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="text-[10px] font-mono uppercase text-slate-400 border-b border-slate-100">
                            <tr>
                              <th className="py-2 px-3">Option Value</th>
                              <th className="py-2 px-3">Display Label</th>
                              <th className="py-2 px-3 text-right">Current Add-on Price (INR)</th>
                              <th className="py-2 px-3 text-right">Adjust Add-on Price (₹)</th>
                              <th className="py-2 px-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-sans">
                            {spec.filteredOptions.map((opt: any) => {
                              const isEdited = editedPrices[opt.id] !== undefined;
                              const currentPrice = isEdited ? editedPrices[opt.id] : (opt.price || 0);
                              const isSaving = savingOptionId === opt.id;

                              return (
                                <tr
                                  key={opt.id}
                                  className={`hover:bg-slate-50/60 transition-colors ${
                                    isEdited ? 'bg-amber-50/40' : ''
                                  }`}
                                >
                                  <td className="py-2.5 px-3 font-mono text-slate-700 font-medium whitespace-nowrap">
                                    {opt.value}
                                  </td>
                                  <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                                    {opt.label}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                                    <span
                                      className={`px-2 py-0.5 rounded font-bold ${
                                        (opt.price || 0) > 0
                                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                          : 'text-slate-400 bg-slate-50'
                                      }`}
                                    >
                                      + {formatINR(opt.price || 0)}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                    <div className="inline-flex items-center gap-1 justify-end">
                                      <span className="text-slate-400 font-mono text-xs">₹</span>
                                      <input
                                        type="number"
                                        min={0}
                                        step={50}
                                        value={currentPrice}
                                        onChange={(e) => {
                                          const val = Math.max(0, parseFloat(e.target.value) || 0);
                                          setEditedPrices((prev) => ({
                                            ...prev,
                                            [opt.id]: val,
                                          }));
                                        }}
                                        className={`w-28 text-right font-mono text-xs font-bold px-2 py-1 rounded border focus:ring-1 focus:ring-amber-500 ${
                                          isEdited
                                            ? 'border-amber-500 bg-amber-50/60 text-amber-900'
                                            : 'border-slate-300 text-slate-900'
                                        }`}
                                      />
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                    {isEdited ? (
                                      <div className="flex items-center justify-end gap-1">
                                        <button
                                          onClick={() => handleSaveOptionPrice(opt.id)}
                                          disabled={isSaving}
                                          className="inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold px-2.5 py-1 rounded shadow-2xs transition-colors"
                                          title="Save this option price"
                                        >
                                          {isSaving ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <Check className="w-3 h-3" />
                                          )}
                                          <span>Save</span>
                                        </button>
                                        <button
                                          onClick={() => {
                                            setEditedPrices((prev) => {
                                              const next = { ...prev };
                                              delete next[opt.id];
                                              return next;
                                            });
                                          }}
                                          className="p-1 text-slate-400 hover:text-slate-600 rounded"
                                          title="Revert"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-[11px] text-slate-400 font-mono italic">
                                        Active
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: COMBINATION RULES MATRIX (PACKAGE OVERRIDES)                       */}
      {/* ========================================================================= */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {/* Versioning Notice */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5 font-mono text-[11px] uppercase">
                Combination Override Rules:
              </span>
              <p className="text-slate-600 leading-relaxed">
                Rules in this table define fixed total package prices for specific product specification combinations.
                When matched during estimation, these rule base prices take precedence over the additive option prices.
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 font-semibold">Filter by Product:</span>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-amber-500"
              >
                <option value="">-- All Products ({rules.length} Rules) --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.productCode} - {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing Matrix Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-mono border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Rule Code</th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Specification Criteria Match</th>
                    <th className="px-4 py-3 text-right">Fixed Package Base Price (INR)</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingRules ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
                        <span>Loading pricing rules...</span>
                      </td>
                    </tr>
                  ) : rules.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        No combination pricing rules configured for this product.
                      </td>
                    </tr>
                  ) : (
                    rules.map((r) => {
                      const criteriaObj = r.specCriteria || {};
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-amber-700 whitespace-nowrap">
                            {r.ruleCode}
                            {r.notes?.includes('DEMO DATA') && (
                              <span className="block text-[9px] font-mono text-amber-600 bg-amber-50 px-1 rounded border border-amber-200 w-fit mt-0.5">
                                DEMO DATA
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <p className="font-bold text-slate-900">{r.product.name}</p>
                            <p className="text-[10px] font-mono text-slate-400">[{r.product.productCode}]</p>
                          </td>
                          <td className="px-4 py-3 max-w-md">
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(criteriaObj).map(([k, v]) => (
                                <span
                                  key={k}
                                  className="inline-block px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-700 font-mono"
                                >
                                  <strong>{k}:</strong> {String(v)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 text-sm whitespace-nowrap">
                            {formatINR(r.basePrice)}
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleToggleRuleActive(r)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                r.active
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}
                            >
                              {r.active ? 'ACTIVE' : 'INACTIVE'}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => {
                                setEditingRule(r);
                                setEditPriceVal(r.basePrice);
                              }}
                              className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-amber-700 transition-colors"
                              title="Edit Base Price"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
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
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LIVE PRICING RULE SIMULATOR                                        */}
      {/* ========================================================================= */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Calculator className="w-4 h-4 text-amber-700" />
              Interactive Pricing Rule Simulation
            </h2>
            <p className="text-slate-600">
              Test how panel configurations calculate their prices in real-time according to your active product base prices and specification add-on prices.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Configurator Inputs */}
            <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase font-mono">
                  1. Select Product Panel Model
                </label>
                <select
                  value={simProductId}
                  onChange={(e) => setSimProductId(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-amber-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.productCode}] {p.name} (Base: {formatINR(p.basePrice || 0)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Specifications */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono">
                  2. Choose Specification Parameters
                </label>

                {simMappedSpecs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No specifications mapped to this product.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {simMappedSpecs.map((spec) => {
                      const selectedVal = simSelectedOptions[spec.code] || '';
                      return (
                        <div key={spec.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            {spec.name}
                          </label>
                          <select
                            value={selectedVal}
                            onChange={(e) =>
                              setSimSelectedOptions((prev) => ({
                                ...prev,
                                [spec.code]: e.target.value,
                              }))
                            }
                            className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white focus:ring-1 focus:ring-amber-500"
                          >
                            {(spec.options || []).map((opt: any) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label} (+{formatINR(opt.price || 0)})
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Real-time Calculation Breakdown Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold uppercase font-mono text-slate-700">
                    Live Calculation Breakdown
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                    PREVIEW
                  </span>
                </div>

                {/* Overriding rule notice */}
                {matchingRule ? (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs space-y-1">
                    <span className="font-bold text-amber-900 flex items-center gap-1 font-mono text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                      Combination Rule Matched!
                    </span>
                    <p className="text-amber-800 text-[11px]">
                      Rule <strong>{matchingRule.ruleCode}</strong> applies a fixed package price of{' '}
                      <strong>{formatINR(matchingRule.basePrice)}</strong>, overriding additive spec add-ons.
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900 font-medium">
                    Additive Rule Active: Product Base Enclosure + Sum of Add-ons
                  </div>
                )}

                {/* Calculation Lines */}
                <div className="space-y-2 text-xs">
                  {/* Base Product Price */}
                  <div className="flex items-center justify-between py-1 border-b border-dashed border-slate-200">
                    <span className="text-slate-600">Product Base Price ({simProduct?.productCode}):</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatINR(simProductBasePrice)}
                    </span>
                  </div>

                  {/* Options Add-on List */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                      Specification Add-ons:
                    </span>
                    {simAddonBreakdown.map((item) => (
                      <div
                        key={item.specCode}
                        className="flex items-center justify-between text-[11px] text-slate-700 pl-2"
                      >
                        <span className="truncate max-w-[160px]" title={`${item.specName}: ${item.optionLabel}`}>
                          {item.specName}: {item.optionLabel}
                        </span>
                        <span className="font-mono text-blue-800 font-semibold">
                          +{formatINR(item.price)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-t border-slate-200 text-xs text-slate-700 font-semibold">
                    <span>Total Options Add-on:</span>
                    <span className="font-mono text-blue-900">+{formatINR(simOptionsTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Total Unit Price Banner */}
              <div className="pt-4 border-t border-slate-200">
                <div className="p-4 rounded-xl bg-slate-900 text-white space-y-1">
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">
                    {matchingRule ? 'Matched Combination Rule Price' : 'Estimated Unit Price'}
                  </span>
                  <div className="text-2xl font-bold font-mono text-amber-400">
                    {formatINR(matchingRule ? matchingRule.basePrice : simCalculatedAdditivePrice)}
                  </div>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {matchingRule
                      ? `Overridden by ${matchingRule.ruleCode}`
                      : `${formatINR(simProductBasePrice)} (Base) + ${formatINR(simOptionsTotal)} (Add-ons)`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD COMBINATION RULE                                               */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Add Combination Price Rule</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              {ruleError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                  {ruleError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rule Code *</label>
                  <input
                    type="text"
                    required
                    value={modalRuleCode}
                    onChange={(e) => setModalRuleCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Product *</label>
                  <select
                    value={modalProductId}
                    onChange={(e) => {
                      setModalProductId(e.target.value);
                      setModalSpecChoices({});
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-amber-500 font-medium"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.productCode} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Specification Options for this Product */}
              {selectedProductForModal && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <span className="font-bold text-slate-800 font-mono uppercase text-[11px] block">
                    Select Specific Parameter Combination:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {specifications
                      .filter((s) =>
                        s.productSpecs?.some((ps: any) => ps.product.id === modalProductId)
                      )
                      .map((spec) => {
                        return (
                          <div key={spec.code}>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              {spec.name}
                            </label>
                            <select
                              value={modalSpecChoices[spec.code] || ''}
                              onChange={(e) =>
                                setModalSpecChoices({
                                  ...modalSpecChoices,
                                  [spec.code]: e.target.value,
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-amber-500"
                            >
                              <option value="">-- Choose Option --</option>
                              {(spec.options || []).map((opt: any) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fixed Package Base Price (INR ₹) *</label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  required
                  placeholder="e.g. 250000"
                  value={modalBasePrice}
                  onChange={(e) => setModalBasePrice(parseFloat(e.target.value) || '')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-base font-bold focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rule Notes / Description</label>
                <input
                  type="text"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="e.g. Standard powder coated Form 2B MCC Panel"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRule}
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingRule && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Combination Rule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: QUICK EDIT COMBINATION RULE PRICE                                   */}
      {/* ========================================================================= */}
      {editingRule && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Update Package Price</h3>
              <button onClick={() => setEditingRule(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickUpdateRulePrice} className="space-y-4 text-xs">
              <div>
                <p className="font-mono text-amber-700 font-bold mb-1">{editingRule.ruleCode}</p>
                <p className="font-semibold text-slate-800">{editingRule.product.name}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Package Base Price (INR ₹):</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={editPriceVal}
                  onChange={(e) => setEditPriceVal(parseFloat(e.target.value) || '')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-base font-bold focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700"
                >
                  Update Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}