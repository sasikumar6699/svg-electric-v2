'use client';

import React, { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  FileText,
  IndianRupee,
  Layers,
  Upload,
  PlusCircle,
  FileSpreadsheet,
  Download,
  Users,
  Search,
  Edit,
  Trash2,
  Printer,
  ExternalLink,
  X,
  Loader2,
  Sliders,
  Cpu,
  Clock,
  ArrowUpRight,
  AlertTriangle,
  FileDown,
  ChevronRight,
  Activity,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { format } from 'date-fns';
import { ProductPrintModal } from '@/components/products/ProductPrintModal';

export interface SpecificationItem {
  name: string;
  value: string;
}

export interface ProductItem {
  id: string;
  productCode: string;
  name: string;
  price: number;
  basePrice?: number;
  categoryId: string;
  category?: { id: string; name: string; code?: string };
  description?: string | null;
  specifications?: SpecificationItem[] | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  active: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CategoryItem {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  _count?: { products: number };
}

export interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: any;
  createdAt: string | Date;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

interface MasterAdminConsoleProps {
  initialProducts: ProductItem[];
  initialCategories: CategoryItem[];
  initialAuditLogs: AuditLogItem[];
}

function getCategoryPrefix(category?: { code?: string; name?: string } | null): string {
  if (!category || !category.code) return 'PANEL-';
  const code = category.code.toUpperCase().trim();
  if (code.startsWith('CAT-')) {
    return code.replace('CAT-', '') + '-';
  }
  return code + '-';
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


export function MasterAdminConsole({
  initialProducts,
  initialCategories,
  initialAuditLogs,
}: MasterAdminConsoleProps) {
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(initialAuditLogs);

  // Table filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [tableLoading, setTableLoading] = useState(false);

  // Product Create/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [codeNumber, setCodeNumber] = useState('');
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

  // Bulk Upload Modal State
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    success: boolean;
    importedCount?: number;
    errors?: string[];
  } | null>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  // Form feedback
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Print Spec Sheet Modal State
  const [printProduct, setPrintProduct] = useState<ProductItem | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Refresh products list
  const refreshProducts = async () => {
    setTableLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (data.products) setProducts(data.products);
    } catch (err) {
      console.error('Failed to refresh products:', err);
    } finally {
      setTableLoading(false);
    }
  };

  // Section 1 Computations: Catalog Governance & Health Gauges
  const healthMetrics = useMemo(() => {
    const total = products.length;
    const priced = products.filter((p) => (p.price || p.basePrice || 0) > 0).length;
    const withFiles = products.filter((p) => Boolean(p.fileUrl)).length;
    const pdfs = products.filter((p) => p.fileType === 'PDF').length;

    // Technical Specs completeness check: has IP rating and rated current/voltage
    let completeSpecs = 0;
    let pendingIPCount = 0;

    products.forEach((p) => {
      const specs = Array.isArray(p.specifications) ? p.specifications : [];
      const hasIP = specs.some(
        (s) =>
          /ingress|ip/i.test(s.name) ||
          /ip\d{2}/i.test(s.value)
      );
      const hasVoltageOrCurrent = specs.some(
        (s) =>
          /current|amp|volt/i.test(s.name) ||
          /\d+A|\d+V/i.test(s.value)
      );

      if (hasIP && hasVoltageOrCurrent && specs.length >= 2) {
        completeSpecs++;
      } else if (!hasIP) {
        pendingIPCount++;
      }
    });

    const activeCats = categories.filter((c) =>
      products.some((p) => p.categoryId === c.id)
    ).length;

    return {
      total,
      priced,
      pricedPercent: total > 0 ? Math.round((priced / total) * 100) : 0,
      withFiles,
      missingFiles: total - withFiles,
      pdfs,
      completeSpecs,
      pendingIPCount,
      pendingSpecs: total - completeSpecs,
      activeCats: activeCats || categories.length,
    };
  }, [products, categories]);


  // Filtered Products for Live Product Master Table
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search ||
        p.productCode.toLowerCase().includes(search.toLowerCase()) ||
        p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = !selectedCategory || p.categoryId === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, search, selectedCategory]);

  // Modal handlers
  const handleOpenCreate = () => {
    setEditingProduct(null);
    const defaultCat = categories[0];
    setCategoryId(defaultCat?.id || '');
    setCodeNumber('');
    setName('');
    setPrice('');
    setDescription('');
    setActive(true);
    setSpecifications([
      { name: 'Rated Current', value: '' },
      { name: 'Operating Voltage', value: '415V AC, 3 Phase 50Hz' },
      { name: 'Ingress Protection', value: 'IP54' },
      { name: 'Form of Separation', value: 'Form 4B' },
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
    setCategoryId(p.categoryId);
    const cat = categories.find((c) => c.id === p.categoryId) || p.category;
    const pfx = getCategoryPrefix(cat);
    if (p.productCode.toUpperCase().startsWith(pfx.toUpperCase())) {
      setCodeNumber(p.productCode.slice(pfx.length));
    } else {
      setCodeNumber(p.productCode);
    }
    setName(p.name);
    setPrice(p.price || p.basePrice || 0);
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

  const handleToggleActive = async (p: ProductItem) => {
    const newStatus = !p.active;
    // Optimistic local state update
    setProducts((prev) =>
      prev.map((item) => (item.id === p.id ? { ...item, active: newStatus } : item))
    );

    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, active: newStatus }),
      });
      if (!res.ok) throw new Error('Status update failed');
    } catch {
      // Revert if failed
      setProducts((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, active: !newStatus } : item))
      );
      alert('Failed to update product active status');
    }
  };

  const handleDeleteProduct = async (p: ProductItem) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete product "${p.productCode} - ${p.name}"?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/products?id=${p.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      setProducts((prev) => prev.filter((item) => item.id !== p.id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

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
      if (!res.ok) throw new Error(data.error || 'Failed to upload file');

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

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const currentCat = categories.find((c) => c.id === categoryId);
      const pfx = getCategoryPrefix(currentCat);
      const trimmedNum = codeNumber.trim().toUpperCase();
      if (!trimmedNum) {
        setError('Please enter a product code number or identifier.');
        setSaving(false);
        return;
      }
      const finalCode = trimmedNum.startsWith(pfx.toUpperCase())
        ? trimmedNum
        : `${pfx}${trimmedNum}`;

      const isDup = products.some(
        (p) => p.productCode.toUpperCase() === finalCode && p.id !== editingProduct?.id
      );
      if (isDup) {
        setError(`Product code "${finalCode}" already exists. Please choose a different number.`);
        setSaving(false);
        return;
      }

      const cleanSpecs = specifications
        .map((s) => ({ name: s.name.trim(), value: s.value.trim() }))
        .filter((s) => s.name.length > 0 && s.value.length > 0);

      const payload: any = {
        productCode: finalCode,
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
      }

      const res = await fetch('/api/admin/products', {
        method: editingProduct ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save product');

      setIsModalOpen(false);
      await refreshProducts();
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFile) return;

    setBulkUploading(true);
    setBulkResult(null);

    try {
      const formData = new FormData();
      formData.append('file', bulkFile);
      formData.append('type', 'products');

      const res = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setBulkResult(data);
      if (data.success) {
        await refreshProducts();
      }
    } catch {
      setBulkResult({
        success: false,
        errors: ['Network error occurred during bulk import.'],
      });
    } finally {
      setBulkUploading(false);
    }
  };

  // Helper formatting for category prefix
  const currentCategory = categories.find((c) => c.id === categoryId);
  const currentPrefix = getCategoryPrefix(currentCategory);
  const trimmedCode = codeNumber.trim().toUpperCase();
  const previewProductCode = trimmedCode
    ? trimmedCode.startsWith(currentPrefix.toUpperCase())
      ? trimmedCode
      : `${currentPrefix}${trimmedCode}`
    : `${currentPrefix}???`;

  return (
    <div className="space-y-6 pb-20">
      {/* Console Top Header */}
      <div className="bg-[#0B1120] rounded-2xl p-6 sm:p-7 text-white shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/15 border border-blue-500/30 px-3 py-1 rounded-full text-blue-300 text-xs font-mono mb-2.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-semibold tracking-wide">SVG MASTER ADMIN CONSOLE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
              <span className="text-[10px] text-emerald-400 font-bold">OPERATIONAL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Price and Product Finder
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Ensuring quotation readiness through master catalog integrity, controlled price matrices, actionable asset completion, and administrative audit trails.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/25 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add New Product</span>
            </button>
            <button
              onClick={() => setIsBulkOpen(true)}
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
            >
              <Upload className="w-4 h-4 text-blue-400" />
              <span>Bulk Upload</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2nd Box: Catalog Health Gauges (4 Cards Only) */}
      <div className="bg-[#0B1120] rounded-2xl border border-slate-800 shadow-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Catalog Integrity & Coverage Gauges
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Real-time Database Health
          </span>
        </div>

        {/* 4 Health Gauge Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Pill 1: Priced SKUs */}
          <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Priced SKUs
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white font-mono">
                  {healthMetrics.priced} / {healthMetrics.total}
                </span>
                <span className="text-xs font-bold text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                  {healthMetrics.pricedPercent}% Covered
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                {healthMetrics.total - healthMetrics.priced === 0
                  ? '✓ All products commercially priced'
                  : `⚠ ${healthMetrics.total - healthMetrics.priced} unpriced item(s)`}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>

          {/* Pill 2: Datasheets Attached */}
          <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Datasheets Attached
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white font-mono">
                  {healthMetrics.withFiles} / {healthMetrics.total}
                </span>
                {healthMetrics.missingFiles > 0 ? (
                  <span className="text-xs font-bold text-amber-400 font-mono bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                    {healthMetrics.missingFiles} Missing
                  </span>
                ) : (
                  <span className="text-xs font-bold text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                    100% Attached
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                {healthMetrics.pdfs} PDF Drawing(s) •{' '}
                {healthMetrics.withFiles - healthMetrics.pdfs} Image(s)
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          {/* Pill 3: Technical Specs */}
          <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Technical Specs
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white font-mono">
                  {healthMetrics.completeSpecs} / {healthMetrics.total}
                </span>
                {healthMetrics.pendingIPCount > 0 ? (
                  <span className="text-xs font-bold text-sky-400 font-mono bg-sky-500/10 border border-sky-500/30 px-1.5 py-0.5 rounded">
                    {healthMetrics.pendingIPCount} Pending IP
                  </span>
                ) : (
                  <span className="text-xs font-bold text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Current, Voltage, Form & IP Completeness
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
          </div>

          {/* Pill 4: Active Categories */}
          <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Active Categories
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white font-mono">
                  {categories.length} Categories
                </span>
                <span className="text-xs font-bold text-purple-400 font-mono bg-purple-500/10 border border-purple-500/30 px-1.5 py-0.5 rounded">
                  Standardized
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono truncate max-w-[190px]">
                MCC, PCC, APFC, VFD, PLC & HMI...
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 3rd Box: Admin Master Control (Landscape Layout) */}
      <div className="bg-[#0B1120] rounded-2xl border border-slate-800 shadow-xl p-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Admin Master Control
            </h3>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span>Superadmin Access Active</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-bold">256-bit AES</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 mt-2 mb-4 leading-relaxed">
          Operational command hub for catalog maintenance, batch imports, master exports, and user privileges.
        </p>

        {/* 4 Action Buttons in Landscape Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Button 1: Add New Product */}
          <button
            onClick={handleOpenCreate}
            className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white p-3.5 rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-black/20 flex items-center justify-center flex-shrink-0">
                <PlusCircle className="w-4 h-4 text-white" />
              </div>
              <div className="text-left min-w-0">
                <span className="text-xs font-bold block leading-none truncate">
                  + Add New Product
                </span>
                <span className="text-[10px] text-blue-100 font-mono mt-1 block truncate">
                  Category prefix & specs
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-blue-200 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
          </button>

          {/* Button 2: Bulk Upload */}
          <button
            onClick={() => setIsBulkOpen(true)}
            className="group bg-slate-900 hover:bg-slate-800/90 active:scale-[0.98] text-slate-100 border border-slate-700/80 p-3.5 rounded-xl flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 flex-shrink-0">
                <Upload className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0">
                <span className="text-xs font-bold block leading-none truncate">
                  📁 Bulk Upload
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-1 block truncate">
                  Batch import (.xlsx / .csv)
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
          </button>

          {/* Button 3: Export Full Price Master */}
          <a
            href="/api/admin/export?type=products"
            target="_blank"
            rel="noreferrer"
            className="group bg-slate-900 hover:bg-slate-800/90 active:scale-[0.98] text-slate-100 border border-slate-700/80 p-3.5 rounded-xl flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0">
                <span className="text-xs font-bold block leading-none truncate">
                  📊 Export Price Master
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-1 block truncate">
                  Download catalog (.xlsx)
                </span>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:translate-y-0.5 transition-transform flex-shrink-0" />
          </a>

          {/* Button 4: Manage User Accounts */}
          <Link
            href="/admin/users"
            className="group bg-slate-900 hover:bg-slate-800/90 active:scale-[0.98] text-slate-100 border border-slate-700/80 p-3.5 rounded-xl flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 flex-shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0">
                <span className="text-xs font-bold block leading-none truncate">
                  👥 Manage Users
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-1 block truncate">
                  Sales & admin roles
                </span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: COMMERCIAL AUDIT LOG & LIVE ESTIMATION PREVIEW (2-COLUMN GRID) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Commercial Audit & Revision Trail (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                  Audit & Revision Trail
                </h3>
              </div>
              <Link
                href="/admin/audit-logs"
                className="text-[11px] font-mono text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
              >
                <span>View Full Log</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <p className="text-[11px] text-slate-500 mt-2 mb-3">
              Immutable logging of catalog adjustments, price revisions, and quotation issuances.
            </p>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {auditLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No system audit logs found.
                </div>
              ) : (
                auditLogs.map((log) => {
                  let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (log.action.includes('PRODUCT')) {
                    badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                  } else if (log.action.includes('ESTIMATION_FINALIZED')) {
                    badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  } else if (log.action.includes('ESTIMATION')) {
                    badgeColor = 'bg-sky-50 text-sky-700 border-sky-200';
                  } else if (log.action.includes('LOGIN')) {
                    badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
                  }

                  const detailStr = log.details
                    ? typeof log.details === 'string'
                      ? log.details
                      : log.details.code
                      ? `Code: ${log.details.code} • ${log.details.name || ''}`
                      : log.details.estimationNumber
                      ? `Est #${log.details.estimationNumber} (₹${log.details.grandTotal?.toLocaleString() || ''})`
                      : log.details.message || JSON.stringify(log.details)
                    : '';

                  return (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 hover:bg-slate-100/70 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] text-slate-400">
                          {format(new Date(log.createdAt), 'dd-MMM-yyyy HH:mm:ss')}
                        </span>
                        <span
                          className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded border ${badgeColor}`}
                        >
                          {log.action}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-800">
                          {log.user?.name || 'System Administrator'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({log.user?.email || 'SYSTEM'})
                        </span>
                      </div>
                      {detailStr && (
                        <p className="text-[11px] font-mono text-slate-600 line-clamp-2 bg-white px-2 py-1 rounded border border-slate-100">
                          {detailStr}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 text-center">
            <Link
              href="/admin/audit-logs"
              className="text-xs font-bold text-slate-700 hover:text-blue-600 font-mono inline-flex items-center gap-1.5"
            >
              <span>Explore full audit database with entity filters</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Column: Live Product Master Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                  Live Product Master Table
                </h3>
              </div>

              {/* Table search & category filter */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search code or model..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 w-36 sm:w-44 font-mono"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-mono border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Model / Panel</th>
                    <th className="px-3 py-2.5">Category</th>
                    <th className="px-3 py-2.5">Ex-Works Price</th>
                    <th className="px-3 py-2.5">Drawing</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                    <th className="px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tableLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-1" />
                        <span>Updating catalog records...</span>
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        No products match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.slice(0, 7).map((p) => {
                      const pPrice = p.price || p.basePrice || 0;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Model / Name */}
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-bold bg-slate-900 text-blue-400 border border-slate-700 px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap">
                                {p.productCode}
                              </span>
                              <span className="font-semibold text-slate-800 line-clamp-1 max-w-[140px]">
                                {p.name}
                              </span>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="px-3 py-2.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                            {p.category?.name || 'Standard'}
                          </td>

                          {/* Ex-Works Price */}
                          <td className="px-3 py-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {formatINR(pPrice)}
                          </td>

                          {/* Drawing Attachment */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {p.fileUrl ? (
                              <a
                                href={p.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition-colors"
                              >
                                <FileText className="w-3 h-3 text-emerald-600" />
                                <span>{p.fileType === 'PDF' ? 'PDF' : 'IMAGE'}</span>
                              </a>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                <span>Missing</span>
                              </span>
                            )}
                          </td>

                          {/* Active/Draft Switch */}
                          <td className="px-3 py-2.5 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(p)}
                              title={p.active ? 'Click to set as Draft' : 'Click to Activate'}
                              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                p.active ? 'bg-emerald-600' : 'bg-slate-300'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                  p.active ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="px-3 py-2.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit */}
                              <button
                                onClick={() => handleOpenEdit(p)}
                                title="Edit Product Specs & Price"
                                className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Print Sheet */}
                              <button
                                onClick={() => handleOpenPrint(p)}
                                title="Print Technical Spec Sheet"
                                className="p-1 rounded bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition-colors"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteProduct(p)}
                                title="Delete Product"
                                className="p-1 rounded bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500">
            <span>
              Showing {Math.min(filteredProducts.length, 7)} of {filteredProducts.length} items
            </span>
            <Link
              href="/admin/products"
              className="text-blue-600 hover:underline font-bold flex items-center gap-1"
            >
              <span>Manage all products &rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRODUCT CREATE / EDIT MODAL                                               */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {editingProduct ? 'Edit Panel Product & Specs' : 'Create New Panel Product'}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {editingProduct ? `Code: ${previewProductCode}` : 'Manual code with category prefix'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Category & Product Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Panel Category *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 font-mono"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({getCategoryPrefix(c)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Code Number *
                  </label>
                  <div className="flex rounded-lg shadow-xs overflow-hidden border border-slate-300 focus-within:ring-2 focus-within:ring-blue-500">
                    <span className="inline-flex items-center px-3 bg-slate-100 text-slate-600 font-mono text-xs font-bold border-r border-slate-300 select-none">
                      {currentPrefix}
                    </span>
                    <input
                      type="text"
                      value={codeNumber}
                      onChange={(e) => setCodeNumber(e.target.value)}
                      placeholder="e.g. 101, 950"
                      required
                      className="flex-1 px-3 py-2 text-xs font-mono font-bold uppercase focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                    Final Code: <strong className="text-blue-600">{previewProductCode}</strong>
                  </span>
                </div>
              </div>

              {/* Name & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Panel / Model Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Industrial Motor Control Center"
                    required
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ex-Works Final Price (₹ INR) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={price}
                      onChange={(e) =>
                        setPrice(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      placeholder="e.g. 350000"
                      required
                      className="w-full text-xs border border-slate-300 rounded-lg pl-7 pr-3 py-2 focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Engineering Notes
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed engineering description, busbar specs, breaker ratings..."
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* File Upload Section */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Engineering Drawing / Datasheet Attachment
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Supports PDF drawings, CAD sheets, Word specs, and panel images (.pdf, .doc, .docx, .xlsx, .jpg, .png).
                </p>

                {fileUrl ? (
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
                        >
                          <span>{fileName || 'Attached Document'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {fileType} • {fileSize ? `${Math.round(fileSize / 1024)} KB` : ''}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFileUrl(null);
                        setFileName(null);
                        setFileType(null);
                        setFileSize(null);
                      }}
                      className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded hover:bg-rose-50"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="console-file-input"
                    />
                    <label
                      htmlFor="console-file-input"
                      className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-colors bg-white"
                    >
                      {uploadingFile ? (
                        <div className="flex items-center gap-2 text-xs text-blue-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading to cloud storage...</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-slate-400 mb-1" />
                          <span className="text-xs font-semibold text-slate-700">
                            Click to upload PDF drawing or panel photo
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            Max 25MB • Stored securely in Supabase / Local Storage
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>

              {/* Technical Specifications Matrix */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800">
                    Technical Specifications Matrix
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setSpecifications((prev) => [...prev, { name: '', value: '' }])
                    }
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ Add Parameter</span>
                  </button>
                </div>

                {/* Suggestions Pills */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="text-[10px] text-slate-400 font-mono py-0.5">Quick add:</span>
                  {COMMON_SPEC_SUGGESTIONS.slice(0, 5).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() =>
                        setSpecifications((prev) => [...prev, { name: s, value: '' }])
                      }
                      className="text-[10px] bg-white border border-slate-200 text-slate-600 hover:border-blue-400 px-2 py-0.5 rounded font-mono transition-colors"
                    >
                      +{s}
                    </button>
                  ))}
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {specifications.map((spec, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Spec Name (e.g. Ingress Protection)"
                        value={spec.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSpecifications((prev) => {
                            const n = [...prev];
                            n[i] = { ...n[i], name: val };
                            return n;
                          });
                        }}
                        className="w-1/2 text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. IP54)"
                        value={spec.value}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSpecifications((prev) => {
                            const n = [...prev];
                            n[i] = { ...n[i], value: val };
                            return n;
                          });
                        }}
                        className="w-1/2 text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setSpecifications((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="product-active-toggle"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label
                  htmlFor="product-active-toggle"
                  className="text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Active in Live Sales Catalog (uncheck to save as Draft)
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingFile}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm shadow-blue-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BULK UPLOAD MODAL                                                         */}
      {/* ========================================================================= */}
      {isBulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Bulk Upload Master Products</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Import multiple products via Excel (.xlsx) or CSV
                </p>
              </div>
              <button
                onClick={() => {
                  setIsBulkOpen(false);
                  setBulkResult(null);
                  setBulkFile(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkUpload} className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Standardized Excel Template</h4>
                  <p className="text-[11px] text-slate-500">
                    Use our template with pre-configured headers and examples.
                  </p>
                </div>
                <a
                  href="/api/admin/import/template?type=products"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 bg-white border border-slate-300 text-slate-800 hover:text-blue-600 text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs hover:bg-slate-100 transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5 text-blue-600" />
                  <span>Download</span>
                </a>
              </div>

              <div>
                <input
                  ref={bulkFileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="bulk-file-upload-input"
                />
                <label
                  htmlFor="bulk-file-upload-input"
                  className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors bg-slate-50"
                >
                  <FileSpreadsheet className="w-8 h-8 text-slate-400 mb-2" />
                  {bulkFile ? (
                    <div>
                      <span className="text-xs font-bold text-slate-900 block font-mono">
                        {bulkFile.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {Math.round(bulkFile.size / 1024)} KB • Click to change file
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-semibold text-slate-700 block">
                        Drop Excel file here, or click to browse
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Supports .xlsx, .xls, .csv files up to 25MB
                      </span>
                    </div>
                  )}
                </label>
              </div>

              {bulkResult && (
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    bulkResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {bulkResult.success ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>
                        Import successful! {bulkResult.importedCount} products added or updated.
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="font-bold block mb-1">Import Errors:</span>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {bulkResult.errors?.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsBulkOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={!bulkFile || bulkUploading}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm shadow-blue-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {bulkUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{bulkUploading ? 'Importing...' : 'Upload & Import'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRODUCT PRINT MODAL                                                       */}
      {/* ========================================================================= */}
      <ProductPrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        product={printProduct}
      />
    </div>
  );
}
