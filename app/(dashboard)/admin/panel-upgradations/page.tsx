'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  SlidersHorizontal,
  Boxes,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Save,
  ArrowRight,
  RefreshCw,
  FolderPlus,
  Info,
  DollarSign,
  Package,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface VariantOption {
  id?: string;
  optionName: string;
  isDefault: boolean;
  priceDelta: number;
  description?: string | null;
  displayOrder?: number;
}

interface VariantDimension {
  id?: string;
  dimensionName: string;
  displayOrder?: number;
  description?: string | null;
  options: VariantOption[];
}

interface FinishedGood {
  id: string;
  modelNumber: string;
  name: string;
  categoryId: string;
  category: { id: string; name: string; code?: string };
  description: string | null;
  enclosureHeight: number | null;
  enclosureWidth: number | null;
  enclosureDepth: number | null;
  ipRating: string | null;
  formRating: string | null;
  finalExWorksPrice: number;
  variants: VariantDimension[];
}

interface MasterTemplate {
  id: string;
  categoryCode: string;
  dimensionName: string;
  description: string | null;
  displayOrder: number;
  options: VariantOption[];
}

export default function PanelUpgradationsAdminPage() {
  const searchParams = useSearchParams();
  const initialModelId = searchParams.get('modelId') || '';

  // Active view: 'PRODUCT_VARIANTS' | 'MASTER_TEMPLATES'
  const [activeTab, setActiveTab] = useState<'PRODUCT_VARIANTS' | 'MASTER_TEMPLATES'>('PRODUCT_VARIANTS');

  // Products State
  const [products, setProducts] = useState<FinishedGood[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string>(initialModelId);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Master Templates State
  const [templates, setTemplates] = useState<MasterTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplateFilter, setSelectedTemplateFilter] = useState<string>('ALL');

  // Active product variants being edited
  const [currentVariants, setCurrentVariants] = useState<VariantDimension[]>([]);
  const [savingVariants, setSavingVariants] = useState(false);

  // New / Editing Variant Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDimensionIdx, setEditingDimensionIdx] = useState<number | null>(null);

  // Form Fields for adding/editing a variant
  const [formDimensionName, setFormDimensionName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(1);
  const [formOptions, setFormOptions] = useState<VariantOption[]>([
    { optionName: 'Standard Baseline (Included)', isDefault: true, priceDelta: 0, description: 'Factory default specification' },
  ]);
  const [saveAlsoToMaster, setSaveAlsoToMaster] = useState(false);

  // Notification Toast
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Fetch Finished Goods
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await fetch('/api/finished-goods');
      if (res.ok) {
        const data = await res.json();
        const list: FinishedGood[] = data.finishedGoods || [];
        setProducts(list);
        if (!selectedProductId && list.length > 0) {
          setSelectedProductId(list[0].id);
        }
      }
    } catch (err: any) {
      showNotify('error', 'Failed to load product catalog.');
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch Variant Master Templates
  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const res = await fetch('/api/variant-templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (err: any) {
      showNotify('error', 'Failed to load variant templates.');
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchTemplates();
  }, []);

  // Selected Product details
  const currentProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  // Sync currentVariants when selected product changes
  useEffect(() => {
    if (currentProduct) {
      setCurrentVariants(currentProduct.variants || []);
      setShowAddForm(false);
      setEditingDimensionIdx(null);
    } else {
      setCurrentVariants([]);
    }
  }, [currentProduct]);

  // Distinct categories from products
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category?.name) set.add(p.category.name);
    });
    return Array.from(set).sort();
  }, [products]);

  // Filtered products for dropdown
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'ALL') return products;
    return products.filter((p) => p.category?.name === selectedCategory);
  }, [products, selectedCategory]);

  // Relevant Master Templates tailored for the selected product's category
  const relevantTemplates = useMemo(() => {
    if (!currentProduct) return templates;
    const catCode = (currentProduct.category?.code || '').toUpperCase();
    let prefix = 'ALL';
    if (catCode.includes('ACD') || catCode.includes('DC')) prefix = 'ACD';
    else if (catCode.includes('MCC')) prefix = 'MCC';
    else if (catCode.includes('PLC')) prefix = 'PLC';
    else if (catCode.includes('APFC')) prefix = 'APFC';
    else if (catCode.includes('PCC')) prefix = 'PCC';

    return templates.filter((t) => t.categoryCode === prefix || t.categoryCode === 'ALL');
  }, [templates, currentProduct]);

  // Filtered templates for Tab 2
  const tab2FilteredTemplates = useMemo(() => {
    if (selectedTemplateFilter === 'ALL') return templates;
    return templates.filter((t) => t.categoryCode === selectedTemplateFilter);
  }, [templates, selectedTemplateFilter]);

  // Handle Preset Template Selection in Form
  const handleApplyPresetTemplate = (templateId: string) => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;

    setFormDimensionName(tpl.dimensionName);
    setFormDescription(tpl.description || '');
    setFormDisplayOrder(currentVariants.length + 1);

    const mappedOpts: VariantOption[] = (tpl.options || []).map((o, idx) => ({
      optionName: o.optionName,
      isDefault: o.isDefault !== undefined ? o.isDefault : idx === 0,
      priceDelta: o.priceDelta || 0,
      description: o.description || '',
    }));

    setFormOptions(mappedOpts.length > 0 ? mappedOpts : [
      { optionName: 'Standard (Included)', isDefault: true, priceDelta: 0, description: '' },
    ]);
  };

  // Add new blank option row in form
  const handleAddOptionRow = () => {
    setFormOptions((prev) => [
      ...prev,
      {
        optionName: '',
        isDefault: prev.length === 0,
        priceDelta: 0,
        description: '',
      },
    ]);
  };

  // Remove option row in form
  const handleRemoveOptionRow = (index: number) => {
    if (formOptions.length <= 1) {
      showNotify('error', 'A variant must have at least one option.');
      return;
    }
    setFormOptions((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      // Ensure at least one is default
      if (!next.some((o) => o.isDefault) && next.length > 0) {
        next[0].isDefault = true;
      }
      return next;
    });
  };

  // Set default option in form
  const handleSetDefaultOption = (index: number) => {
    setFormOptions((prev) =>
      prev.map((opt, idx) => ({
        ...opt,
        isDefault: idx === index,
      }))
    );
  };

  // Update option row value
  const handleOptionChange = (index: number, field: keyof VariantOption, val: any) => {
    setFormOptions((prev) =>
      prev.map((opt, idx) => {
        if (idx === index) {
          return { ...opt, [field]: val };
        }
        return opt;
      })
    );
  };

  // Open form for a new variant
  const handleOpenAddForm = () => {
    setEditingDimensionIdx(null);
    setFormDimensionName('');
    setFormDescription('');
    setFormDisplayOrder(currentVariants.length + 1);
    setFormOptions([
      { optionName: 'Standard Baseline (Included)', isDefault: true, priceDelta: 0, description: 'Factory standard baseline specification' },
      { optionName: '', isDefault: false, priceDelta: 0, description: '' },
    ]);
    setSaveAlsoToMaster(false);
    setShowAddForm(true);
  };

  // Open form to edit an existing variant
  const handleOpenEditForm = (dimIdx: number) => {
    const dim = currentVariants[dimIdx];
    if (!dim) return;
    setEditingDimensionIdx(dimIdx);
    setFormDimensionName(dim.dimensionName);
    setFormDescription(dim.description || '');
    setFormDisplayOrder(dim.displayOrder || dimIdx + 1);
    setFormOptions(
      dim.options.map((o) => ({
        id: o.id,
        optionName: o.optionName,
        isDefault: Boolean(o.isDefault),
        priceDelta: o.priceDelta || 0,
        description: o.description || '',
      }))
    );
    setSaveAlsoToMaster(false);
    setShowAddForm(true);
  };

  // Save variant from form into current product's variants state
  const handleCommitFormToVariants = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formDimensionName.trim()) {
      showNotify('error', 'Variant Subsystem / Dimension Name is required.');
      return;
    }

    const validOptions = formOptions.filter((o) => o.optionName.trim() !== '');
    if (validOptions.length === 0) {
      showNotify('error', 'Please enter at least one valid variant option name.');
      return;
    }

    // Ensure one is marked default
    if (!validOptions.some((o) => o.isDefault)) {
      validOptions[0].isDefault = true;
    }

    const newDimension: VariantDimension = {
      dimensionName: formDimensionName.trim(),
      description: formDescription.trim() || null,
      displayOrder: formDisplayOrder || (currentVariants.length + 1),
      options: validOptions,
    };

    let updated: VariantDimension[];
    if (editingDimensionIdx !== null) {
      updated = currentVariants.map((d, idx) => (idx === editingDimensionIdx ? newDimension : d));
    } else {
      updated = [...currentVariants, newDimension];
    }

    setCurrentVariants(updated);
    setShowAddForm(false);
    setEditingDimensionIdx(null);

    // If admin checked "Save also as Reusable Master Template"
    if (saveAlsoToMaster) {
      try {
        const catCode = currentProduct?.category?.code || 'ALL';
        await fetch('/api/variant-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryCode: catCode.toUpperCase(),
            dimensionName: formDimensionName.trim(),
            description: formDescription.trim() || null,
            displayOrder: formDisplayOrder,
            options: validOptions,
          }),
        });
        fetchTemplates();
        showNotify('success', `Saved variant & created reusable template "${formDimensionName}"!`);
      } catch (err) {
        console.error('Failed to create master template:', err);
      }
    } else {
      showNotify('success', `Variant "${formDimensionName}" added to staged list.`);
    }
  };

  // Delete a dimension
  const handleDeleteDimension = (dimIdx: number) => {
    const dim = currentVariants[dimIdx];
    if (confirm(`Remove variant subsystem "${dim.dimensionName}" from this product?`)) {
      setCurrentVariants((prev) => prev.filter((_, idx) => idx !== dimIdx));
      showNotify('success', `Removed "${dim.dimensionName}". Click "Save Upgradations" to apply changes.`);
    }
  };

  // Save all configured variants to the database for this product
  const handleSaveAllVariantsToProduct = async () => {
    if (!selectedProductId) {
      showNotify('error', 'No product selected.');
      return;
    }

    try {
      setSavingVariants(true);
      const res = await fetch(`/api/finished-goods/${selectedProductId}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variants: currentVariants }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save variants');
      }

      const data = await res.json();
      setCurrentVariants(data.variants || []);

      // Update in products list
      setProducts((prev) =>
        prev.map((p) => (p.id === selectedProductId ? { ...p, variants: data.variants || [] } : p))
      );

      showNotify('success', `Successfully published ${currentVariants.length} upgradation variants to ${currentProduct?.modelNumber}!`);
    } catch (err: any) {
      showNotify('error', err.message);
    } finally {
      setSavingVariants(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold transition-all ${
            notification.type === 'success'
              ? 'bg-slate-900 text-emerald-400 border-emerald-500/40 shadow-emerald-950/20'
              : 'bg-slate-900 text-rose-400 border-rose-500/40 shadow-rose-950/20'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400 uppercase tracking-wider mb-1">
            <SlidersHorizontal className="w-4 h-4" />
            <span>SVG Electric Engineering & Costing Configuration</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
            Panel Upgradations & Variants Master
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Configure technical upgrade options, components, and pricing deltas per panel. Separate from the central raw material Price Master, these variants empower sales engineers to tailor estimations instantly.
          </p>
        </div>

        {/* Global Action / View Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('PRODUCT_VARIANTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'PRODUCT_VARIANTS'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            Configure Product Variants
          </button>
          <button
            onClick={() => setActiveTab('MASTER_TEMPLATES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'MASTER_TEMPLATES'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            Variant Templates Library ({templates.length})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CONFIGURE VARIANTS PER PRODUCT                                      */}
      {/* ========================================================================= */}
      {activeTab === 'PRODUCT_VARIANTS' && (
        <div className="space-y-6">
          {/* STEP 1: SELECT PRODUCT CARD */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono text-blue-600 font-bold uppercase tracking-wider">
                  Step 1: Choose Finished Good Panel
                </span>
                <h2 className="text-sm font-bold text-slate-900 mt-0.5">
                  Select Product to Manage Upgradations
                </h2>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">All Categories ({products.length})</option>
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Selector Dropdown & Info Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Select Model / Panel *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {filteredProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.modelNumber} — {p.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">
                  Choose from {filteredProducts.length} registered finished good panels.
                </p>
              </div>

              {/* Product Technical Profile Badge */}
              {currentProduct && (
                <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-blue-700 bg-blue-100 font-bold px-2 py-0.5 rounded">
                        {currentProduct.modelNumber}
                      </span>
                      <h3 className="text-sm font-black text-slate-900 mt-1">{currentProduct.name}</h3>
                      <p className="text-xs text-slate-500">{currentProduct.category?.name || 'Control Panel'}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Baseline Ex-Works</span>
                      <strong className="text-base font-mono font-bold text-slate-900">
                        ₹{currentProduct.finalExWorksPrice.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-600 mt-2 pt-2 border-t border-slate-200/80">
                    <span>
                      Dims: {currentProduct.enclosureHeight || '-'}×{currentProduct.enclosureWidth || '-'}×{currentProduct.enclosureDepth || '-'} mm
                    </span>
                    <span>Protection: {currentProduct.ipRating || 'IP54'}</span>
                    <span>Form: {currentProduct.formRating || 'Form 2B'}</span>
                    <span className="text-emerald-700 font-bold">
                      {currentVariants.length} Active Variant Dimensions
                    </span>
                    <Link
                      href={`/sales/configurator?modelId=${currentProduct.id}`}
                      target="_blank"
                      className="ml-auto text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 text-[11px]"
                    >
                      <span>Preview in Sales Configurator</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* STEP 2: VARIANTS LIST & MANAGEMENT */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
              <div>
                <span className="text-[10px] font-mono text-blue-600 font-bold uppercase tracking-wider">
                  Step 2: Configured Upgrade Subsystems
                </span>
                <h2 className="text-sm font-bold text-slate-900 mt-0.5">
                  Variants for {currentProduct?.modelNumber || 'Selected Product'}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenAddForm}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-600/30 flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Variant Dimension</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAllVariantsToProduct}
                  disabled={savingVariants || !currentProduct}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-emerald-600/30 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingVariants ? 'Saving...' : 'Save & Publish Upgradations'}</span>
                </button>
              </div>
            </div>

            {/* FORM DRAWER (CREATE / EDIT VARIANT) */}
            {showAddForm && (
              <div className="p-6 bg-blue-50/40 border-b-2 border-blue-200 space-y-4">
                <div className="flex items-center justify-between border-b border-blue-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {editingDimensionIdx !== null ? 'Edit Variant Subsystem' : 'Create New Variant Dimension'}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Define the upgrade category, select sample preset templates, and configure selectable options with price deltas.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCommitFormToVariants} className="space-y-4">
                  {/* Preset Template Selector (FEED SAMPLES AS DROPDOWN) */}
                  <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        <span>Pre-engineered Variant Specification Master (Standard Library):</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {relevantTemplates.length} templates matching category
                      </span>
                    </div>
                    <select
                      onChange={(e) => {
                        if (e.target.value) handleApplyPresetTemplate(e.target.value);
                      }}
                      defaultValue=""
                      className="w-full px-3 py-2 bg-blue-50/50 border border-blue-300 rounded-lg text-xs font-bold text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="" disabled>
                        ⚡ Choose a pre-configured sample variant (Auto-populates fields & options)...
                      </option>
                      {relevantTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          [{t.categoryCode}] {t.dimensionName} — ({t.options.length} options)
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500">
                      Selecting a sample automatically pre-fills industry-standard options with realistic prices. You can edit any field below.
                    </p>
                  </div>

                  {/* Dimension Name & Description */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Variant Subsystem / Dimension Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formDimensionName}
                        onChange={(e) => setFormDimensionName(e.target.value)}
                        placeholder="e.g. PLC & Automation Controller, Busbar Material, Incomer Switchgear..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Display Order
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formDisplayOrder}
                        onChange={(e) => setFormDisplayOrder(parseInt(e.target.value, 10) || 1)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Technical Scope / Subsystem Purpose
                    </label>
                    <input
                      type="text"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Optional brief note e.g. Programmable logic controller and touchscreen graphic HMI options"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Options Table */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
                        Selectable Variant Options & Price Impact (₹ Delta)
                      </label>
                      <button
                        type="button"
                        onClick={handleAddOptionRow}
                        className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add Option</span>
                      </button>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 text-slate-300 uppercase font-mono text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3 w-16 text-center">Default</th>
                            <th className="py-2.5 px-3">Option Name *</th>
                            <th className="py-2.5 px-3 w-36 text-right">Price Delta (₹)</th>
                            <th className="py-2.5 px-3">Technical Description / Specification</th>
                            <th className="py-2.5 px-2 w-12 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans">
                          {formOptions.map((opt, idx) => (
                            <tr key={idx} className={opt.isDefault ? 'bg-emerald-50/40' : 'bg-white'}>
                              {/* Default Radio */}
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="radio"
                                  name="defaultVariantOption"
                                  checked={opt.isDefault}
                                  onChange={() => handleSetDefaultOption(idx)}
                                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                  title="Mark as default baseline option (₹0)"
                                />
                              </td>

                              {/* Option Name */}
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  required
                                  value={opt.optionName}
                                  onChange={(e) => handleOptionChange(idx, 'optionName', e.target.value)}
                                  placeholder="e.g. Siemens S7-1200 + 7 inch KTP HMI"
                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </td>

                              {/* Price Delta */}
                              <td className="py-2 px-3 text-right">
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={opt.priceDelta}
                                    onChange={(e) =>
                                      handleOptionChange(idx, 'priceDelta', parseFloat(e.target.value) || 0)
                                    }
                                    placeholder="0"
                                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-right text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                              </td>

                              {/* Description */}
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={opt.description || ''}
                                  onChange={(e) => handleOptionChange(idx, 'description', e.target.value)}
                                  placeholder="Includes 24V DC SMPS, programmed logic, graphics"
                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </td>

                              {/* Delete */}
                              <td className="py-2 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOptionRow(idx)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded"
                                  title="Delete option"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Save Checkbox & Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-blue-200/80">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={saveAlsoToMaster}
                        onChange={(e) => setSaveAlsoToMaster(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300"
                      />
                      <span>Also save as reusable Master Template in library</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>{editingDimensionIdx !== null ? 'Update Variant' : 'Add Variant to Product'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* CURRENT CONFIGURED VARIANTS LIST */}
            {currentVariants.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Sliders className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-700">No Upgradation Variants Configured Yet</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Click &quot;+ Add Variant Dimension&quot; above to select from industry sample templates (PLC Make, Busbar Material, Protection Relays, Incomer Type) and publish to this panel.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddForm}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  + Add First Variant
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {currentVariants.map((dim, dIdx) => (
                  <div key={dim.id || dIdx} className="p-5 hover:bg-slate-50/60 transition-colors space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-mono font-bold text-xs flex items-center justify-center">
                          {dIdx + 1}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{dim.dimensionName}</h4>
                          {dim.description && <p className="text-xs text-slate-500">{dim.description}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditForm(dIdx)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3 text-slate-500" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDimension(dIdx)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3 text-rose-500" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>

                    {/* Options Pills / Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                      {dim.options.map((opt, oIdx) => (
                        <div
                          key={opt.id || oIdx}
                          className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                            opt.isDefault
                              ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400/20'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-slate-900 truncate">{opt.optionName}</span>
                              {opt.isDefault && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-600 text-white font-mono font-bold shrink-0">
                                  Default
                                </span>
                              )}
                            </div>
                            {opt.description && (
                              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{opt.description}</p>
                            )}
                          </div>

                          <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between font-mono">
                            <span className="text-[10px] text-slate-400">Price Delta:</span>
                            <strong
                              className={`text-xs ${
                                opt.priceDelta > 0
                                  ? 'text-emerald-700'
                                  : opt.priceDelta < 0
                                  ? 'text-rose-600'
                                  : 'text-slate-600'
                              }`}
                            >
                              {opt.priceDelta > 0
                                ? `+ ₹${opt.priceDelta.toLocaleString('en-IN')}`
                                : opt.priceDelta < 0
                                ? `- ₹${Math.abs(opt.priceDelta).toLocaleString('en-IN')}`
                                : 'Included (₹0)'}
                            </strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MASTER TEMPLATES REPOSITORY                                         */}
      {/* ========================================================================= */}
      {activeTab === 'MASTER_TEMPLATES' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono text-emerald-600 font-bold uppercase tracking-wider">
                Variant Master Blueprints
              </span>
              <h2 className="text-sm font-bold text-slate-900 mt-0.5">
                Central Library of Reusable Panel Upgradation Templates
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Independent from the raw material Price Master, these blueprints standardize PLC models, busbar platings, protections, and cooling upgrades across products.
              </p>
            </div>

            {/* Filter by Category */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Filter Category:</span>
              <select
                value={selectedTemplateFilter}
                onChange={(e) => setSelectedTemplateFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
              >
                <option value="ALL">All Panel Blueprints ({templates.length})</option>
                <option value="ACD">AC Drive Panels (ACD)</option>
                <option value="MCC">Motor Control Center (MCC)</option>
                <option value="PLC">Automation & PLC (PLC)</option>
                <option value="APFC">Power Factor Correction (APFC)</option>
                <option value="PCC">Distribution & PCC (PCC)</option>
              </select>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tab2FilteredTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between space-y-3 hover:border-blue-400 transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 uppercase">
                      {tpl.categoryCode}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {tpl.options.length} Pre-configured Options
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{tpl.dimensionName}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{tpl.description}</p>
                </div>

                {/* Option summary pills */}
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  {tpl.options.slice(0, 3).map((o, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-700 truncate max-w-[170px]" title={o.optionName}>
                        {o.optionName}
                      </span>
                      <strong className="font-mono text-emerald-700">
                        {o.priceDelta > 0 ? `+ ₹${o.priceDelta.toLocaleString('en-IN')}` : '₹0'}
                      </strong>
                    </div>
                  ))}
                  {tpl.options.length > 3 && (
                    <span className="block text-[10px] text-slate-400 italic font-mono">
                      +{tpl.options.length - 3} more options...
                    </span>
                  )}
                </div>

                {/* Apply Button */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('PRODUCT_VARIANTS');
                    handleApplyPresetTemplate(tpl.id);
                    setShowAddForm(true);
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Map Variant Dimension to Panel &rarr;</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
