'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  Edit,
  Trash2,
  Upload,
  FileText,
  Image as ImageIcon,
  IndianRupee,
  Printer,
  ExternalLink,
  PlusCircle,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { ProductPrintModal } from '@/components/products/ProductPrintModal';

interface SpecificationItem {
  name: string;
  value: string;
}

interface ProductItem {
  id: string;
  productCode: string;
  name: string;
  price: number;
  basePrice?: number;
  categoryId: string;
  category?: { id: string; name: string };
  description?: string | null;
  specifications?: SpecificationItem[] | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const COMMON_SPEC_SUGGESTIONS = [
  'Rated Current',
  'Operating Voltage',
  'Phase / Frequency',
  'Form of Separation',
  'Busbar Material',
  'Ingress Protection',
  'Incomer Switchgear',
  'Short Circuit Rating',
  'Control Voltage',
  'Enclosure Material',
  'Mounting Type',
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  // Form Fields
  const [productCode, setProductCode] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [specifications, setSpecifications] = useState<SpecificationItem[]>([]);

  // File Upload State
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form feedback
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Print Modal
  const [printProduct, setPrintProduct] = useState<ProductItem | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch(`/api/admin/products?categoryId=${selectedCategory}&search=${encodeURIComponent(search)}`),
        fetch('/api/admin/categories'),
      ]);
      const [prodData, catData] = await Promise.all([prodRes.json(), catRes.json()]);
      setProducts(prodData.products || []);
      setCategories(catData.categories || []);
    } catch {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, selectedCategory]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setProductCode('');
    setName('');
    setPrice('');
    setCategoryId(categories[0]?.id || '');
    setDescription('');
    setActive(true);
    setSpecifications([
      { name: 'Rated Current', value: '' },
      { name: 'Operating Voltage', value: '415V AC, 3 Phase 50Hz' },
      { name: 'Ingress Protection', value: 'IP54' },
    ]);
    setFileUrl(null);
    setFileName(null);
    setFileType(null);
    setFileSize(null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: ProductItem) => {
    setEditingProduct(p);
    setProductCode(p.productCode);
    setName(p.name);
    setPrice(p.price || p.basePrice || 0);
    setCategoryId(p.categoryId);
    setDescription(p.description || '');
    setActive(p.active);
    setSpecifications(Array.isArray(p.specifications) ? [...p.specifications] : []);
    setFileUrl(p.fileUrl || null);
    setFileName(p.fileName || null);
    setFileType(p.fileType || null);
    setFileSize(p.fileSize || null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenPrint = (p: ProductItem) => {
    setPrintProduct(p);
    setIsPrintOpen(true);
  };

  // Spec management
  const handleAddSpecRow = (suggestedName?: string) => {
    setSpecifications((prev) => [...prev, { name: suggestedName || '', value: '' }]);
  };

  const handleUpdateSpec = (index: number, field: 'name' | 'value', val: string) => {
    setSpecifications((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleRemoveSpec = (index: number) => {
    setSpecifications((prev) => prev.filter((_, i) => i !== index));
  };

  // File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload file');
      }

      setFileUrl(data.fileUrl);
      setFileName(data.fileName);
      setFileType(data.fileType);
      setFileSize(data.fileSize);
    } catch (err: any) {
      setError(err.message || 'File upload error');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = () => {
    setFileUrl(null);
    setFileName(null);
    setFileType(null);
    setFileSize(null);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      // Clean specs
      const cleanSpecs = specifications
        .map((s) => ({ name: s.name.trim(), value: s.value.trim() }))
        .filter((s) => s.name.length > 0 && s.value.length > 0);

      const payload: any = {
        name,
        price: Number(price) || 0,
        categoryId,
        description,
        specifications: cleanSpecs,
        fileUrl,
        fileName,
        fileType,
        fileSize,
        active,
      };

      if (editingProduct) {
        payload.id = editingProduct.id;
        payload.productCode = productCode;
      } else {
        payload.productCode = productCode;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save product');

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (p: ProductItem) => {
    if (!confirm(`Are you sure you want to permanently delete product "${p.productCode} - ${p.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/products?id=${p.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const handleToggleActive = async (p: ProductItem) => {
    try {
      await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, active: !p.active }),
      });
      fetchData();
    } catch {
      alert('Failed to update status');
    }
  };

  const generateSKU = () => {
    const cat = categories.find((c) => c.id === categoryId);
    const prefix = cat ? cat.code.replace('CAT-', '') : 'PANEL';
    const rand = Math.floor(100 + Math.random() * 900);
    setProductCode(`${prefix}-${rand}`);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
              ADMIN PRODUCT MANAGEMENT
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Products & Technical Specifications</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create panel entries with custom specifications, final prices, and uploaded datasheets/drawings.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product Entry</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search code, model, or specs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-brand-500 bg-white"
          >
            <option value="">-- All Categories --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-mono border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-16">Visual</th>
                <th className="px-4 py-3">Product Code & Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Key Specifications</th>
                <th className="px-4 py-3 text-right">Final Price</th>
                <th className="px-4 py-3 text-center">Attachment</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-600 mx-auto mb-2" />
                    <span>Loading products catalog...</span>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    <Box className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No products found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || selectedCategory
                        ? 'Try clearing search filters.'
                        : 'Click "Add Product Entry" above to add your first panel.'}
                    </p>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const specs = Array.isArray(p.specifications) ? p.specifications : [];
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Visual Thumbnail */}
                      <td className="px-4 py-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                          {p.fileUrl && p.fileType === 'IMAGE' ? (
                            <img src={p.fileUrl} alt={p.name} className="w-full h-full object-cover" />
                          ) : p.fileUrl && p.fileType === 'PDF' ? (
                            <FileText className="w-5 h-5 text-rose-600" />
                          ) : (
                            <Box className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </td>

                      {/* Code & Name */}
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-slate-900 block">{p.productCode}</span>
                        <span className="text-slate-600 font-medium line-clamp-1">{p.name}</span>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className="inline-block bg-slate-100 text-slate-700 font-mono text-[10px] px-2 py-0.5 rounded font-semibold">
                          {p.category?.name || 'Standard'}
                        </span>
                      </td>

                      {/* Specifications Badges */}
                      <td className="px-4 py-3 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {specs.slice(0, 3).map((s, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-brand-50 text-brand-700 border border-brand-200/60 px-1.5 py-0.5 rounded font-mono truncate max-w-[130px]"
                              title={`${s.name}: ${s.value}`}
                            >
                              <strong className="font-medium text-slate-500">{s.name}:</strong> {s.value}
                            </span>
                          ))}
                          {specs.length > 3 && (
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                              +{specs.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Final Price */}
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 text-sm">
                        {formatINR(p.price || p.basePrice || 0)}
                      </td>

                      {/* Attachment Status */}
                      <td className="px-4 py-3 text-center">
                        {p.fileUrl ? (
                          <a
                            href={p.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-2 py-0.5 rounded border border-brand-200 transition-colors"
                          >
                            {p.fileType === 'PDF' ? (
                              <FileText className="w-3.5 h-3.5 text-rose-600" />
                            ) : (
                              <ImageIcon className="w-3.5 h-3.5 text-brand-600" />
                            )}
                            <span>{p.fileType}</span>
                            <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono italic">None</span>
                        )}
                      </td>

                      {/* Active Status */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleActive(p)}
                          className="inline-flex items-center gap-1 cursor-pointer"
                        >
                          {p.active ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-200">
                              <XCircle className="w-3 h-3 text-slate-400" /> Inactive
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Print Sheet */}
                          <button
                            onClick={() => handleOpenPrint(p)}
                            title="Print Technical Spec Sheet"
                            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Edit Product Entry"
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            title="Delete Product Entry"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-600/30 border border-brand-500/40 flex items-center justify-center text-brand-400">
                  <Box className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    {editingProduct ? 'Edit Product Entry' : 'Create New Product Entry'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Configure specifications, price, and upload technical drawings/datasheet.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center justify-between">
                  <span>{error}</span>
                  <button type="button" onClick={() => setError(null)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* 1. Basic Information */}
              <div className="space-y-3 border-b border-slate-200 pb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-brand-600" />
                  1. Basic Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Product Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Industrial Motor Control Center 800A"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Product Code / SKU <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={generateSKU}
                        className="text-[10px] text-brand-600 hover:underline font-mono"
                      >
                        Auto SKU
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MCC-IND-800A"
                      value={productCode}
                      onChange={(e) => setProductCode(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono uppercase focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Product Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-brand-500"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Final Price (₹ INR) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        required
                        placeholder="e.g. 385000"
                        value={price}
                        onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    {typeof price === 'number' && price > 0 && (
                      <p className="text-[10px] text-emerald-600 font-mono mt-0.5">
                        Formatted: {formatINR(price)}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Technical Scope & Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Short description of enclosure, wiring, component make, or applications..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* 2. Technical Specifications Builder */}
              <div className="space-y-3 border-b border-slate-200 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                      2. Technical Specifications
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Add parameters and values. Sales users can filter and match products by these specs.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddSpecRow()}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Row</span>
                  </button>
                </div>

                {/* Quick Suggestion Chips */}
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block mb-1">Quick Suggestions:</span>
                  <div className="flex flex-wrap gap-1">
                    {COMMON_SPEC_SUGGESTIONS.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleAddSpecRow(sug)}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded transition-colors"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Specifications Rows */}
                <div className="space-y-2">
                  {specifications.length === 0 ? (
                    <div className="text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-slate-400 text-xs">
                      No specifications added yet. Click &quot;Add Row&quot; or choose a suggestion above.
                    </div>
                  ) : (
                    specifications.map((spec, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Parameter Name (e.g. Current Rating)"
                          value={spec.name}
                          onChange={(e) => handleUpdateSpec(idx, 'name', e.target.value)}
                          className="w-1/2 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-brand-500 font-medium"
                        />
                        <input
                          type="text"
                          placeholder="Value (e.g. 800A)"
                          value={spec.value}
                          onChange={(e) => handleUpdateSpec(idx, 'value', e.target.value)}
                          className="w-1/2 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-brand-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSpec(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 3. Image or PDF Attachment Upload */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                    3. Attachment Upload (Image or PDF)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Upload panel photo, single line diagram (SLD), GA drawing, or technical PDF datasheet.
                  </p>
                </div>

                {fileUrl ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {fileType === 'IMAGE' ? (
                          <img src={fileUrl} alt="Upload preview" className="w-full h-full object-cover" />
                        ) : (
                          <FileText className="w-6 h-6 text-rose-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 line-clamp-1">{fileName || 'Attachment'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Format: {fileType} • {fileSize ? `${Math.round(fileSize / 1024)} KB` : ''}
                        </p>
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-brand-600 hover:underline inline-flex items-center gap-0.5 mt-0.5"
                        >
                          <span>Open file</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-brand-400 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="product-file-upload"
                      accept=".jpg,.jpeg,.png,.webp,.pdf,image/*,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="product-file-upload"
                      className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                    >
                      {uploadingFile ? (
                        <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
                      ) : (
                        <Upload className="w-6 h-6 text-slate-400" />
                      )}
                      <span className="text-xs font-semibold text-slate-700">
                        {uploadingFile ? 'Uploading file...' : 'Click to upload Image (.jpg, .png) or PDF (.pdf)'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Maximum file size: 25MB
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Status Toggle */}
              <div className="pt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Product Active & Searchable by Sales
                  </span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingFile}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingProduct ? 'Update Product' : 'Save Product Entry'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Specification Sheet Modal */}
      <ProductPrintModal
        isOpen={isPrintOpen}
        product={printProduct}
        onClose={() => setIsPrintOpen(false)}
      />
    </div>
  );
}