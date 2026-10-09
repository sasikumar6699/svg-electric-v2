'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Search,
  Filter,
  Plus,
  Upload,
  Download,
  Percent,
  Edit2,
  Check,
  X,
  RefreshCw,
  Building2,
  Package,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Tag,
  Sliders,
} from 'lucide-react';
import * as xlsx from 'xlsx';

interface ComponentItem {
  id: string;
  itemCode: string;
  description: string;
  rating: string | null;
  typeCode: string | null;
  make: string;
  category: string;
  unit: string;
  unitPrice: number;
  listPrice?: number | null;
  finalPrice?: number | null;
  hsnCode: string | null;
  gstRate: number;
  active: boolean;
  updatedAt: string;
}

export default function PriceMasterPage() {
  const [items, setItems] = useState<ComponentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMake, setSelectedMake] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedRating, setSelectedRating] = useState('ALL');
  const [filterUnpricedOnly, setFilterUnpricedOnly] = useState(false);
  const [activeView, setActiveView] = useState<'DIRECTORY' | 'BRANDS' | 'GROUPS'>('DIRECTORY');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editListPrice, setEditListPrice] = useState<string>('');
  const [editFinalPrice, setEditFinalPrice] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Multiplier Modal state
  const [showMultiplierModal, setShowMultiplierModal] = useState(false);
  const [multiplierMake, setMultiplierMake] = useState('ALL');
  const [multiplierCategory, setMultiplierCategory] = useState('ALL');
  const [multiplierPercent, setMultiplierPercent] = useState('5.0');
  const [applyingMultiplier, setApplyingMultiplier] = useState(false);

  // Manual Add Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingNewItem, setSavingNewItem] = useState(false);
  const [formData, setFormData] = useState({
    itemCode: '',
    make: 'ABB',
    category: 'Switchgear & Protection',
    description: '',
    rating: '',
    typeCode: '',
    unit: 'Nos',
    listPrice: '',
    finalPrice: '',
    hsnCode: '8537',
    gstRate: '18',
  });

  // Bulk Excel Import Modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [parsedUploadData, setParsedUploadData] = useState<any[]>([]);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadingBulk, setUploadingBulk] = useState(false);

  // Notification message
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/price-master');
      if (!res.ok) throw new Error('Failed to load Price Master');
      const data = await res.json();
      setItems(data.items || []);
    } catch (err: any) {
      showNotify('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedMake, selectedCategory, selectedRating, filterUnpricedOnly]);

  // Count unpriced components
  const unpricedCount = useMemo(() => {
    return items.filter((it) => !it.unitPrice || it.unitPrice === 0).length;
  }, [items]);

  // Distinct Filter options
  const makesList = useMemo(() => {
    const s = new Set<string>();
    items.forEach((it) => {
      if (it.make) s.add(it.make.trim());
    });
    return Array.from(s).sort();
  }, [items]);

  const categoriesList = useMemo(() => {
    const s = new Set<string>();
    items.forEach((it) => {
      if (it.category) s.add(it.category.trim());
    });
    return Array.from(s).sort();
  }, [items]);

  // Dynamic Specification / Rating list based on currently selected make and category
  const ratingsList = useMemo(() => {
    const s = new Set<string>();
    items.forEach((it) => {
      if (!it.rating || !it.rating.trim()) return;
      const matchMake = selectedMake === 'ALL' || it.make.toLowerCase() === selectedMake.toLowerCase();
      const matchCat = selectedCategory === 'ALL' || it.category.toLowerCase() === selectedCategory.toLowerCase();
      if (matchMake && matchCat) {
        s.add(it.rating.trim());
      }
    });
    return Array.from(s).sort();
  }, [items, selectedMake, selectedCategory]);

  // Brand statistics for Brand Explorer View
  const brandStats = useMemo(() => {
    const map = new Map<string, { make: string; count: number; unpriced: number; categories: Set<string> }>();
    items.forEach((it) => {
      const m = it.make ? it.make.trim() : 'Standard';
      if (!map.has(m)) {
        map.set(m, { make: m, count: 0, unpriced: 0, categories: new Set() });
      }
      const entry = map.get(m)!;
      entry.count++;
      if (!it.unitPrice || it.unitPrice === 0) entry.unpriced++;
      if (it.category) entry.categories.add(it.category.trim());
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [items]);

  // Product Group statistics for Category Explorer View
  const groupStats = useMemo(() => {
    const map = new Map<string, { category: string; count: number; unpriced: number; makes: Set<string> }>();
    items.forEach((it) => {
      const c = it.category ? it.category.trim() : 'General';
      if (!map.has(c)) {
        map.set(c, { category: c, count: 0, unpriced: 0, makes: new Set() });
      }
      const entry = map.get(c)!;
      entry.count++;
      if (!it.unitPrice || it.unitPrice === 0) entry.unpriced++;
      if (it.make) entry.makes.add(it.make.trim());
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [items]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !search ||
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        item.itemCode.toLowerCase().includes(search.toLowerCase()) ||
        (item.typeCode && item.typeCode.toLowerCase().includes(search.toLowerCase())) ||
        (item.rating && item.rating.toLowerCase().includes(search.toLowerCase())) ||
        item.make.toLowerCase().includes(search.toLowerCase());

      const matchMake = selectedMake === 'ALL' || item.make.toLowerCase() === selectedMake.toLowerCase();
      const matchCat = selectedCategory === 'ALL' || item.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchRating = selectedRating === 'ALL' || (item.rating && item.rating.trim().toLowerCase() === selectedRating.trim().toLowerCase());
      const matchUnpriced = !filterUnpricedOnly || (!item.unitPrice || item.unitPrice === 0);

      return matchSearch && matchMake && matchCat && matchRating && matchUnpriced;
    });
  }, [items, search, selectedMake, selectedCategory, selectedRating, filterUnpricedOnly]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Inline Price Edit Handler
  const handleStartEdit = (item: ComponentItem) => {
    setEditingId(item.id);
    const list = item.listPrice && item.listPrice > 0 ? item.listPrice : (item.unitPrice || 0);
    const final = item.finalPrice && item.finalPrice > 0 ? item.finalPrice : Math.round(list * 0.90 * 100) / 100;
    setEditListPrice(String(list));
    setEditFinalPrice(String(final));
  };

  const handleSaveEdit = async (id: string) => {
    const listVal = parseFloat(editListPrice);
    const finalVal = parseFloat(editFinalPrice);
    if (isNaN(listVal) || listVal < 0) {
      showNotify('error', 'Please enter a valid List Price (MRP).');
      return;
    }
    const finalToSave = !isNaN(finalVal) && finalVal >= 0 ? finalVal : Math.round(listVal * 0.90 * 100) / 100;

    try {
      setSavingEdit(true);
      const res = await fetch('/api/price-master', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, listPrice: listVal, finalPrice: finalToSave }),
      });
      if (!res.ok) throw new Error('Failed to update price');

      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? {
                ...it,
                listPrice: listVal,
                finalPrice: finalToSave,
                unitPrice: finalToSave,
                updatedAt: new Date().toISOString(),
              }
            : it
        )
      );
      setEditingId(null);
      showNotify('success', 'Prices updated successfully.');
    } catch (err: any) {
      showNotify('error', err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // Annual Multiplier Handler
  const handleApplyMultiplier = async (e: React.FormEvent) => {
    e.preventDefault();
    const pct = parseFloat(multiplierPercent);
    if (isNaN(pct)) {
      showNotify('error', 'Please enter a valid percentage multiplier.');
      return;
    }

    try {
      setApplyingMultiplier(true);
      const res = await fetch('/api/price-master/multiplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          make: multiplierMake,
          category: multiplierCategory,
          percentageMultiplier: pct,
        }),
      });
      if (!res.ok) throw new Error('Failed to apply multiplier');
      const data = await res.json();

      showNotify('success', `Successfully updated ${data.count} components with ${pct > 0 ? '+' : ''}${pct}% price revision.`);
      setShowMultiplierModal(false);
      fetchItems();
    } catch (err: any) {
      showNotify('error', err.message);
    } finally {
      setApplyingMultiplier(false);
    }
  };

  // Add Item Handler
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const listNum = parseFloat(formData.listPrice);
    if (!formData.description || !formData.make || isNaN(listNum) || listNum < 0) {
      showNotify('error', 'Make, Description, and List Price (MRP) are required.');
      return;
    }
    const finalNum = parseFloat(formData.finalPrice) || Math.round(listNum * 0.90 * 100) / 100;

    try {
      setSavingNewItem(true);
      const res = await fetch('/api/price-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          listPrice: listNum,
          finalPrice: finalNum,
          unitPrice: finalNum,
        }),
      });
      if (!res.ok) throw new Error('Failed to add component');
      const data = await res.json();

      showNotify('success', `Component "${data.component.description}" added to Price Master.`);
      setShowAddModal(false);
      setFormData({
        itemCode: '',
        make: 'ABB',
        category: 'Switchgear & Protection',
        description: '',
        rating: '',
        typeCode: '',
        unit: 'Nos',
        listPrice: '',
        finalPrice: '',
        hsnCode: '8537',
        gstRate: '18',
      });
      fetchItems();
    } catch (err: any) {
      showNotify('error', err.message);
    } finally {
      setSavingNewItem(false);
    }
  };

  // Bulk Excel File Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = xlsx.read(bstr, { type: 'binary' });
        const sheetName = wb.SheetNames[0];
        const rows: any[] = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });

        const mapped = rows.map((r, idx) => {
          const list = parseFloat(String(r['List Price (MRP)'] || r['MRP'] || r['Unit Price (INR)'] || r['Price'] || r['unitPrice'] || 0)) || 0;
          const finalVal = r['Final Price (INR)'] || r['Final Price'] || r['finalPrice']
            ? (parseFloat(String(r['Final Price (INR)'] || r['Final Price'] || r['finalPrice'])) || 0)
            : Math.round(list * 0.90 * 100) / 100;

          return {
            itemCode: String(r['Item Code'] || r['itemCode'] || '').trim(),
            category: String(r['Category'] || r['category'] || 'Switchgear & Protection').trim(),
            make: String(r['Make / Brand'] || r['Make'] || r['make'] || 'Standard').trim(),
            description: String(r['Material Description'] || r['Description'] || r['description'] || `Imported Item ${idx + 1}`).trim(),
            rating: String(r['Specification / Rating'] || r['Rating'] || r['rating'] || '').trim(),
            typeCode: String(r['Type Code'] || r['typeCode'] || '').trim(),
            unit: String(r['Unit'] || r['unit'] || 'Nos').trim(),
            listPrice: list,
            finalPrice: finalVal,
            unitPrice: finalVal,
            hsnCode: String(r['HSN Code'] || r['hsnCode'] || '8537').trim(),
            gstRate: parseFloat(String(r['GST %'] || r['gstRate'] || 18)) || 18,
          };
        }).filter((item) => item.description && item.make);

        setParsedUploadData(mapped);
      } catch (err) {
        showNotify('error', 'Error reading Excel file. Please use the official template.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmBulkUpload = async () => {
    if (parsedUploadData.length === 0) return;

    try {
      setUploadingBulk(true);
      const res = await fetch('/api/price-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: parsedUploadData }),
      });
      if (!res.ok) throw new Error('Bulk import failed');
      const data = await res.json();

      showNotify('success', `Imported / updated ${data.count} items in Price Master.`);
      setShowUploadModal(false);
      setParsedUploadData([]);
      setUploadFileName('');
      fetchItems();
    } catch (err: any) {
      showNotify('error', err.message);
    } finally {
      setUploadingBulk(false);
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

      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm text-white">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400 uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>SVG Electric Component Repository</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
            Central Price Master (Raw Materials & Bought-Out Items)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Inbuilt component catalog with live brand pricing, annual bulk price adjustments, and seamless Excel synchronization.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowMultiplierModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95"
            title="Apply annual price hike across a Make or Category"
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Brand Multiplier</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Bulk Excel Import</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Raw Material</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar (Interactive Redirection Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Catalog Items */}
        <div
          onClick={() => {
            setActiveView('DIRECTORY');
            setSelectedMake('ALL');
            setSelectedCategory('ALL');
            setSelectedRating('ALL');
            setFilterUnpricedOnly(false);
            setSearch('');
          }}
          className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
            activeView === 'DIRECTORY' && !filterUnpricedOnly && selectedMake === 'ALL' && selectedCategory === 'ALL'
              ? 'bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-blue-400'
          }`}
          title="Click to view full component directory"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Catalog Items</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{items.length}</p>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[11px] text-slate-500">Active bought-out</span>
            <span className="text-[10px] text-blue-600 font-bold font-mono">View All &rarr;</span>
          </div>
        </div>

        {/* Card 2: Registered Makes / Brands */}
        <div
          onClick={() => {
            setActiveView('BRANDS');
          }}
          className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
            activeView === 'BRANDS' || (activeView === 'DIRECTORY' && selectedMake !== 'ALL')
              ? 'bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-emerald-400'
          }`}
          title="Click to explore components by Brand"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Registered Makes</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{makesList.length}</p>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[11px] text-slate-500">ABB, Siemens, etc.</span>
            <span className="text-[10px] text-emerald-600 font-bold font-mono">By Make &rarr;</span>
          </div>
        </div>

        {/* Card 3: Product Groups */}
        <div
          onClick={() => {
            setActiveView('GROUPS');
          }}
          className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
            activeView === 'GROUPS' || (activeView === 'DIRECTORY' && selectedCategory !== 'ALL')
              ? 'bg-indigo-50/50 border-indigo-500 ring-2 ring-indigo-500/20'
              : 'bg-white border-slate-200 hover:border-indigo-400'
          }`}
          title="Click to explore components by Product Group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Product Groups</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{categoriesList.length}</p>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[11px] text-slate-500">Switchgear, busbar</span>
            <span className="text-[10px] text-indigo-600 font-bold font-mono">By Group &rarr;</span>
          </div>
        </div>

        {/* Card 4: Components Without Pricing (NEW) */}
        <div
          onClick={() => {
            setActiveView('DIRECTORY');
            setFilterUnpricedOnly(true);
            setSelectedRating('ALL');
          }}
          className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
            filterUnpricedOnly
              ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/30'
              : unpricedCount > 0
              ? 'bg-amber-50/20 border-amber-300 hover:border-amber-500'
              : 'bg-white border-slate-200 hover:border-amber-400'
          }`}
          title="Click to filter and enter pricing for unpriced components"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span className="text-amber-800 font-bold">Without Pricing</span>
            <AlertCircle className={`w-4 h-4 ${unpricedCount > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-400'}`} />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-1">{unpricedCount}</p>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[11px] text-amber-800/80">Missing unit price</span>
            <span className="text-[10px] text-amber-700 font-bold font-mono">Fix Now &rarr;</span>
          </div>
        </div>

        {/* Card 5: Template & Export */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Template & Export</span>
            <FileSpreadsheet className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <a
              href="/api/price-master/template"
              className="text-xs text-blue-600 hover:text-blue-800 font-bold underline flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> Template
            </a>
            <span className="text-slate-300">|</span>
            <a
              href="/api/price-master/export"
              className="text-xs text-slate-700 hover:text-slate-900 font-bold underline flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> Export
            </a>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Excel offline sync</p>
        </div>
      </div>

      {/* Navigation View Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setActiveView('DIRECTORY');
              setFilterUnpricedOnly(false);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeView === 'DIRECTORY' && !filterUnpricedOnly
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            All Catalog Items ({items.length})
          </button>
          <button
            onClick={() => setActiveView('BRANDS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeView === 'BRANDS'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Browse by Make / Brand ({makesList.length})
          </button>
          <button
            onClick={() => setActiveView('GROUPS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeView === 'GROUPS'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Browse by Product Group ({categoriesList.length})
          </button>
          <button
            onClick={() => {
              setActiveView('DIRECTORY');
              setFilterUnpricedOnly(true);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeView === 'DIRECTORY' && filterUnpricedOnly
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300'
            }`}
          >
            ⚠️ Missing Prices ({unpricedCount})
          </button>
        </div>

        {/* Clear active drilldown button if filtered */}
        {(selectedMake !== 'ALL' || selectedCategory !== 'ALL' || selectedRating !== 'ALL' || filterUnpricedOnly || search) && (
          <button
            onClick={() => {
              setSelectedMake('ALL');
              setSelectedCategory('ALL');
              setSelectedRating('ALL');
              setFilterUnpricedOnly(false);
              setSearch('');
            }}
            className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Clear All Filters
          </button>
        )}
      </div>

      {/* VIEW 1: BRAND EXPLORER (When Registered Makes card is clicked) */}
      {activeView === 'BRANDS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                Registered Makers & Brands Catalog
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any brand below to view all its catalog materials, compare product groups, and drill down by specific rating or spec.
              </p>
            </div>
            <button
              onClick={() => setActiveView('DIRECTORY')}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold whitespace-nowrap self-start sm:self-auto"
            >
              Back to Full Directory &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {brandStats.map((brand) => (
              <div
                key={brand.make}
                onClick={() => {
                  setSelectedMake(brand.make);
                  setSelectedRating('ALL');
                  setFilterUnpricedOnly(false);
                  setActiveView('DIRECTORY');
                }}
                className={`group p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedMake === brand.make
                    ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50/50 hover:bg-white border-slate-200 hover:border-emerald-500 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {brand.make}
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono">
                      {brand.count} Items
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-1">
                    {Array.from(brand.categories).join(', ')}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  {brand.unpriced > 0 ? (
                    <span className="text-[10px] text-amber-600 font-bold font-mono">
                      ⚠️ {brand.unpriced} unpriced
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">100% priced</span>
                  )}
                  <span className="text-emerald-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1 text-[11px]">
                    Browse Materials <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: PRODUCT GROUP EXPLORER (When Product Groups card is clicked) */}
      {activeView === 'GROUPS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Product Groups & Material Categories
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any product group below to view its components, compare brand pricing, and filter by rating/specifications.
              </p>
            </div>
            <button
              onClick={() => setActiveView('DIRECTORY')}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold whitespace-nowrap self-start sm:self-auto"
            >
              Back to Full Directory &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {groupStats.map((grp) => (
              <div
                key={grp.category}
                onClick={() => {
                  setSelectedCategory(grp.category);
                  setSelectedRating('ALL');
                  setFilterUnpricedOnly(false);
                  setActiveView('DIRECTORY');
                }}
                className={`group p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedCategory === grp.category
                    ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'bg-slate-50/50 hover:bg-white border-slate-200 hover:border-indigo-500 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-sm text-slate-900 group-hover:text-indigo-700 transition-colors">
                      {grp.category}
                    </span>
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-mono">
                      {grp.count} Items
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-1">
                    Makes: {Array.from(grp.makes).join(', ')}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  {grp.unpriced > 0 ? (
                    <span className="text-[10px] text-amber-600 font-bold font-mono">
                      ⚠️ {grp.unpriced} unpriced
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">All priced</span>
                  )}
                  <span className="text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1 text-[11px]">
                    Browse Components <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Filter Badges Bar */}
      {(selectedMake !== 'ALL' || selectedCategory !== 'ALL' || selectedRating !== 'ALL' || filterUnpricedOnly) && (
        <div className="flex flex-wrap items-center gap-2 bg-slate-100/80 p-2.5 rounded-xl border border-slate-200 text-xs">
          <span className="font-bold text-slate-500 font-mono text-[11px] uppercase mr-1">Active Filter:</span>
          {selectedMake !== 'ALL' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-semibold">
              <span>Make: {selectedMake}</span>
              <button onClick={() => setSelectedMake('ALL')} className="hover:text-emerald-950">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {selectedCategory !== 'ALL' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-lg font-semibold">
              <span>Group: {selectedCategory}</span>
              <button onClick={() => setSelectedCategory('ALL')} className="hover:text-indigo-950">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {selectedRating !== 'ALL' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg font-semibold">
              <span>Spec: {selectedRating}</span>
              <button onClick={() => setSelectedRating('ALL')} className="hover:text-purple-950">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {filterUnpricedOnly && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg font-bold border border-amber-300">
              <span>⚠️ Unpriced Items Only ({filteredItems.length})</span>
              <button onClick={() => setFilterUnpricedOnly(false)} className="hover:text-amber-950">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Filter & Search Bar with Specification Dropdown */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search description, part code, rating, or make..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Make Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-500 font-medium">Make:</span>
            <select
              value={selectedMake}
              onChange={(e) => {
                setSelectedMake(e.target.value);
                setSelectedRating('ALL');
              }}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="ALL">All Makes ({makesList.length})</option>
              {makesList.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-500 font-medium">Group:</span>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedRating('ALL');
              }}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="ALL">All Categories</option>
              {categoriesList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Specification / Rating Filter (Requested Field!) */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-500 font-medium">Spec / Rating:</span>
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              <option value="ALL">All Specs ({ratingsList.length})</option>
              {ratingsList.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Pricing Status Toggle */}
          <button
            onClick={() => setFilterUnpricedOnly(!filterUnpricedOnly)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              filterUnpricedOnly
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
            title="Toggle showing only unpriced components"
          >
            {filterUnpricedOnly ? 'Showing Unpriced' : `Unpriced (${unpricedCount})`}
          </button>

          <button
            onClick={fetchItems}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh component list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Unpriced Filter Alert Banner */}
      {filterUnpricedOnly && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider font-mono">
                Components Missing Unit Price ({filteredItems.length} items)
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Click on the unit price cell in any row to enter the purchase cost directly, or use Bulk Excel Import to upload an updated rate list.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilterUnpricedOnly(false)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold whitespace-nowrap self-start sm:self-auto transition-colors shadow-sm"
          >
            Show All Catalog Items
          </button>
        </div>
      )}

      {/* Main Table Section */}
      <div id="catalog-table-section" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide font-mono">
              Component Items Directory
            </span>
            <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full font-mono">
              {filteredItems.length} matching of {items.length} total
            </span>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Click on price to edit directly. Ex-Works exclusive of GST.
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Loading component price library...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No components found matching your filter</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing search or filters to see all components.</p>
            <button
              onClick={() => {
                setSelectedMake('ALL');
                setSelectedCategory('ALL');
                setSelectedRating('ALL');
                setFilterUnpricedOnly(false);
                setSearch('');
              }}
              className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-300 uppercase font-mono text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Item Code</th>
                  <th className="py-3 px-4">Brand / Make</th>
                  <th className="py-3 px-4">Material Description</th>
                  <th className="py-3 px-4">Rating / Specs</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-3 text-center">Unit</th>
                  <th className="py-3 px-4 text-right">List Price (MRP)</th>
                  <th className="py-3 px-4 text-right">Final Price (₹)</th>
                  <th className="py-3 px-3 text-center">HSN</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {paginatedItems.map((item, idx) => {
                  const isEditing = editingId === item.id;
                  const itemList = item.listPrice && item.listPrice > 0 ? item.listPrice : (item.unitPrice || 0);
                  const itemFinal = item.finalPrice && item.finalPrice > 0 ? item.finalPrice : Math.round(itemList * 0.90 * 100) / 100;
                  const isZeroPrice = itemFinal === 0 && itemList === 0;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        isZeroPrice
                          ? 'bg-amber-50/30'
                          : idx % 2 === 0
                          ? 'bg-white'
                          : 'bg-slate-50/30'
                      }`}
                    >
                      {/* Code */}
                      <td className="py-3 px-4 font-mono font-semibold text-[11px] text-slate-700">
                        {item.itemCode}
                      </td>

                      {/* Make */}
                      <td className="py-3 px-4">
                        <span
                          onClick={() => {
                            setSelectedMake(item.make);
                            setSelectedRating('ALL');
                          }}
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase cursor-pointer hover:opacity-80 transition-opacity ${
                            item.make.toUpperCase() === 'ABB'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : item.make.toUpperCase() === 'SIEMENS'
                              ? 'bg-teal-100 text-teal-800 border border-teal-200'
                              : item.make.toUpperCase() === 'MITSUBISHI'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : item.make.toUpperCase() === 'SCHNEIDER'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : item.make.toUpperCase() === 'INOVANCE'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                          title={`Click to filter by make: ${item.make}`}
                        >
                          {item.make}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 font-medium text-slate-900 max-w-xs truncate" title={item.description}>
                        {item.description}
                      </td>

                      {/* Rating */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {item.rating ? (
                          <span
                            onClick={() => setSelectedRating(item.rating || 'ALL')}
                            className="cursor-pointer hover:text-blue-600 hover:underline"
                            title="Click to filter by this rating"
                          >
                            {item.rating}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-slate-600">
                        <span
                          onClick={() => {
                            setSelectedCategory(item.category);
                            setSelectedRating('ALL');
                          }}
                          className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded cursor-pointer hover:bg-slate-200 transition-colors"
                          title={`Click to filter by group: ${item.category}`}
                        >
                          {item.category}
                        </span>
                      </td>

                      {/* Unit */}
                      <td className="py-3 px-3 text-center font-mono text-slate-600 font-semibold">
                        {item.unit}
                      </td>

                      {/* List Price (MRP) */}
                      <td className="py-3 px-4 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editListPrice}
                            onChange={(e) => {
                              const lp = e.target.value;
                              setEditListPrice(lp);
                              const n = parseFloat(lp);
                              if (!isNaN(n)) setEditFinalPrice(String(Math.round(n * 0.90 * 100) / 100));
                            }}
                            className="w-20 px-2 py-1 bg-white border border-blue-500 rounded text-right font-mono font-bold text-xs focus:outline-none"
                            placeholder="MRP"
                            autoFocus
                          />
                        ) : (
                          <span className="font-mono text-slate-700">
                            ₹{itemList.toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>

                      {/* Final Price (10% Discount) with Inline Edit */}
                      <td className="py-3 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              value={editFinalPrice}
                              onChange={(e) => setEditFinalPrice(e.target.value)}
                              className="w-20 px-2 py-1 bg-white border border-emerald-500 rounded text-right font-mono font-bold text-xs focus:outline-none"
                              placeholder="Final"
                            />
                            <button
                              onClick={() => handleSaveEdit(item.id)}
                              disabled={savingEdit}
                              className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : isZeroPrice ? (
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 font-mono font-bold text-[11px] transition-colors"
                            title="Unpriced! Click to enter price"
                          >
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            <span>₹0 (Set Price)</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="group flex items-center justify-end gap-1.5 w-full text-right font-mono font-bold text-emerald-800 hover:text-blue-600"
                            title="Click to edit prices"
                          >
                            <span>₹{itemFinal.toLocaleString('en-IN')}</span>
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1 py-0.2 rounded shrink-0">
                              10% Off
                            </span>
                            <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                          </button>
                        )}
                      </td>

                      {/* HSN */}
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-500">
                        {item.hsnCode || '8537'}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors ${
                            isZeroPrice
                              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold'
                              : 'text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          {isZeroPrice ? 'Set Price' : 'Quick Edit'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {filteredItems.length > pageSize && (
          <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-600 font-medium">
              Showing <strong className="text-slate-900">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
              <strong className="text-slate-900">
                {Math.min(currentPage * pageSize, filteredItems.length)}
              </strong>{' '}
              of <strong className="text-slate-900">{filteredItems.length}</strong> components
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 disabled:opacity-40 hover:bg-slate-100 font-semibold flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>

              <span className="px-3 py-1 font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 disabled:opacity-40 hover:bg-slate-100 font-semibold flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ANNUAL PRICE MULTIPLIER                                          */}
      {/* ========================================================================= */}
      {showMultiplierModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm tracking-wide">Brand & Commodity Annual Multiplier</h3>
              </div>
              <button
                onClick={() => setShowMultiplierModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyMultiplier} className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Apply an instant across-the-board percentage price update when manufacturers (ABB, Siemens, etc.) issue yearly revisions.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Manufacturer / Make</label>
                <select
                  value={multiplierMake}
                  onChange={(e) => setMultiplierMake(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Apply to ALL Brands (Catalog-wide)</option>
                  {makesList.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Product Category</label>
                <select
                  value={multiplierCategory}
                  onChange={(e) => setMultiplierCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Categories</option>
                  {categoriesList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Percentage Adjustment (%): <span className="text-slate-400 font-normal">Use + for increase, - for discount</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={multiplierPercent}
                    onChange={(e) => setMultiplierPercent(e.target.value)}
                    placeholder="e.g. 5.0 for +5% hike"
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMultiplierModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applyingMultiplier}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg shadow-sm"
                >
                  {applyingMultiplier ? 'Applying Update...' : 'Apply Multiplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: MANUAL ADD RAW MATERIAL                                          */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm tracking-wide">Add New Raw Material / Component</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Manufacturer / Make *</label>
                  <input
                    type="text"
                    required
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    placeholder="e.g. ABB, Siemens, Polycab"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category Group *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Drives & Softstarters">Drives & Softstarters</option>
                    <option value="Switchgear & Protection">Switchgear & Protection</option>
                    <option value="Automation & Control">Automation & Control</option>
                    <option value="Busbar Systems">Busbar Systems</option>
                    <option value="Cables & Wiring">Cables & Wiring</option>
                    <option value="Enclosures">Enclosures</option>
                    <option value="Hardware & Accessories">Hardware & Accessories</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Material Description *</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. DC Drive 680A Thyristor Converter Module"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rating / Specification</label>
                  <input
                    type="text"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    placeholder="e.g. 680A, 415V, 1.0 sq.mm"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Catalog / Type Code</label>
                  <input
                    type="text"
                    value={formData.typeCode}
                    onChange={(e) => setFormData({ ...formData, typeCode: e.target.value })}
                    placeholder="e.g. DCS880-S01-0680-05"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Nos">Nos</option>
                    <option value="Mtrs">Mtrs</option>
                    <option value="Set">Set</option>
                    <option value="Kg">Kg</option>
                    <option value="Lot">Lot</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">List Price (MRP) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.listPrice}
                    onChange={(e) => {
                      const lp = e.target.value;
                      const n = parseFloat(lp);
                      const autoFinal = !isNaN(n) && n > 0 ? String(Math.round(n * 0.90 * 100) / 100) : '';
                      setFormData({ ...formData, listPrice: lp, finalPrice: autoFinal });
                    }}
                    placeholder="MRP ₹"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-emerald-800 mb-1">Final Price (10% Disc)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.finalPrice}
                    onChange={(e) => setFormData({ ...formData, finalPrice: e.target.value })}
                    placeholder="Auto 10% off"
                    className="w-full px-3 py-1.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-mono font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={formData.hsnCode}
                    onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                    placeholder="8537"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNewItem}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  {savingNewItem ? 'Saving...' : 'Save to Price Master'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: BULK EXCEL IMPORT                                                */}
      {/* ========================================================================= */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm tracking-wide">Bulk Excel Component Import</h3>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between bg-blue-50 p-3 rounded-xl border border-blue-200 text-xs text-blue-900">
                <span>Need the official columns format?</span>
                <a
                  href="/api/price-master/template"
                  className="font-bold underline text-blue-700 hover:text-blue-900 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Download Template
                </a>
              </div>

              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  {uploadFileName ? uploadFileName : 'Choose or drag & drop Component Excel spreadsheet'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Supports .xlsx or .xls</p>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  className="mt-3 text-xs text-slate-600 block mx-auto file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {parsedUploadData.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Ready to import {parsedUploadData.length} components!</span>
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    First item: &quot;{parsedUploadData[0]?.description}&quot; ({parsedUploadData[0]?.make}) - ₹
                    {parsedUploadData[0]?.unitPrice}
                  </p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkUpload}
                  disabled={uploadingBulk || parsedUploadData.length === 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {uploadingBulk ? 'Importing...' : `Import ${parsedUploadData.length} Items`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
