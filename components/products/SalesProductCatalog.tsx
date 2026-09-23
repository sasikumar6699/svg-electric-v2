'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Box,
  Layers,
  FileText,
  Image as ImageIcon,
  Printer,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  CheckCircle2,
  X,
  Loader2,
  LayoutGrid,
  Table as TableIcon,
  Tag,
  Download,
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

interface CategoryItem {
  id: string;
  name: string;
  code: string;
}

export const SalesProductCatalog: React.FC = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [availableFilters, setAvailableFilters] = useState<Array<{ name: string; values: string[] }>>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSpecName, setSelectedSpecName] = useState('');
  const [selectedSpecValue, setSelectedSpecValue] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal State
  const [detailProduct, setDetailProduct] = useState<ProductItem | null>(null);
  const [printProduct, setPrintProduct] = useState<ProductItem | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const fetchSearchResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (selectedSpecName && selectedSpecValue) {
        params.append('specName', selectedSpecName);
        params.append('specValue', selectedSpecValue);
      } else if (selectedSpecValue) {
        params.append('specValue', selectedSpecValue);
      }

      const res = await fetch(`/api/products/search?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
        if (data.categories) setCategories(data.categories);
        if (data.availableFilters) setAvailableFilters(data.availableFilters);
      }
    } catch (err) {
      console.error('Failed to search products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSearchResults();
  }, [search, selectedCategory, selectedSpecName, selectedSpecValue]);

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedSpecName('');
    setSelectedSpecValue('');
  };

  const handleOpenPrint = (p: ProductItem) => {
    setPrintProduct(p);
    setIsPrintOpen(true);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Hero / Header Section */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-brand-500/20 border border-brand-500/30 px-3 py-1 rounded-full text-brand-300 text-xs font-mono mb-3">
            <Tag className="w-3.5 h-3.5" />
            <span>SALES & ESTIMATION PRICING CONSOLE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Product Search & Price Discovery
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Search electrical panels and control systems across specific technical parameters (current, voltage, ingress protection) to instantly retrieve the final pricing and technical datasheets.
          </p>
        </div>
      </div>

      {/* Search Bar & Primary Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Main Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by panel name, product code, current (e.g. 800A), voltage (415V), or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all placeholder:text-slate-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-end md:self-auto border border-slate-200 flex-shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase flex-shrink-0">
            Category:
          </span>
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === ''
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories ({products.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id === selectedCategory ? '' : c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === c.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Specifications Filter Row (if available) */}
        {availableFilters.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" />
              Quick Specs:
            </span>

            {/* Spec Selector */}
            <select
              value={selectedSpecName}
              onChange={(e) => {
                setSelectedSpecName(e.target.value);
                setSelectedSpecValue('');
              }}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1 bg-white focus:ring-1 focus:ring-brand-500"
            >
              <option value="">-- Filter by Parameter --</option>
              {availableFilters.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>

            {selectedSpecName && (
              <select
                value={selectedSpecValue}
                onChange={(e) => setSelectedSpecValue(e.target.value)}
                className="text-xs border border-brand-300 rounded-lg px-2.5 py-1 bg-brand-50 text-brand-900 font-semibold focus:ring-1 focus:ring-brand-500"
              >
                <option value="">-- All Values --</option>
                {availableFilters
                  .find((f) => f.name === selectedSpecName)
                  ?.values.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
              </select>
            )}

            {(search || selectedCategory || selectedSpecValue) && (
              <button
                onClick={handleClearFilters}
                className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold px-2 py-0.5 rounded hover:bg-rose-50 transition-colors ml-auto"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results Section */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-xs font-mono text-slate-500">
            Showing <strong className="text-slate-800">{products.length}</strong> matching products
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">Searching products catalog...</p>
            <p className="text-xs text-slate-400 mt-1">Filtering by specified technical parameters</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
            <Box className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No matching products found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              We couldn&apos;t find any panels matching your current search criteria. Try removing some filters or searching with a different term.
            </p>
            <button
              onClick={handleClearFilters}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg text-xs font-semibold transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p) => {
              const specs = Array.isArray(p.specifications) ? p.specifications : [];
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-brand-500/50 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group"
                >
                  {/* Card Visual & Top Badges */}
                  <div className="h-44 bg-slate-100 relative overflow-hidden border-b border-slate-100 flex items-center justify-center">
                    {p.fileUrl && p.fileType === 'IMAGE' ? (
                      <img
                        src={p.fileUrl}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5">
                        {p.fileUrl && p.fileType === 'PDF' ? (
                          <>
                            <FileText className="w-10 h-10 text-rose-500" />
                            <span className="text-[10px] font-mono text-slate-500 font-semibold">
                              PDF Datasheet Attached
                            </span>
                          </>
                        ) : (
                          <>
                            <Box className="w-10 h-10 text-slate-300" />
                            <span className="text-[10px] font-mono text-slate-400">
                              Standard Industrial Enclosure
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Category Floating Pill */}
                    <div className="absolute top-3 left-3">
                      <span className="bg-slate-900/80 backdrop-blur-sm text-white font-mono text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {p.category?.name || 'Panel'}
                      </span>
                    </div>

                    {/* Attachment Badge */}
                    {p.fileUrl && (
                      <div className="absolute top-3 right-3">
                        <a
                          href={p.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open Technical Attachment"
                          className="bg-white/90 hover:bg-white text-slate-800 p-1.5 rounded-full shadow-md transition-transform active:scale-95 flex items-center justify-center"
                        >
                          {p.fileType === 'PDF' ? (
                            <FileText className="w-4 h-4 text-rose-600" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-brand-600" />
                          )}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      {/* SKU */}
                      <span className="font-mono text-[11px] font-bold text-brand-600 block">
                        {p.productCode}
                      </span>
                      {/* Name */}
                      <h3 className="font-bold text-sm text-slate-900 mt-0.5 leading-snug line-clamp-2">
                        {p.name}
                      </h3>
                      {/* Description */}
                      {p.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>
                      )}

                      {/* Specifications Preview */}
                      <div className="mt-3.5 space-y-1.5">
                        <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block tracking-wider">
                          Key Specifications:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {specs.slice(0, 4).map((s, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono border border-slate-200/80"
                            >
                              <strong className="text-slate-500 font-semibold">{s.name}:</strong> {s.value}
                            </span>
                          ))}
                          {specs.length > 4 && (
                            <button
                              onClick={() => setDetailProduct(p)}
                              className="text-[10px] bg-brand-50 text-brand-700 hover:bg-brand-100 px-2 py-0.5 rounded-md font-mono font-semibold"
                            >
                              +{specs.length - 4} more
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Price & Actions Bottom Box */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                          Final Price
                        </span>
                        <span className="text-lg font-black font-mono text-slate-900 tracking-tight">
                          {formatINR(p.price || p.basePrice || 0)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Print Button */}
                        <button
                          onClick={() => handleOpenPrint(p)}
                          title="Print Technical Spec Sheet (With / Without Price)"
                          className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg border border-slate-200 transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* View Full Specs Modal Button */}
                        <button
                          onClick={() => setDetailProduct(p)}
                          className="inline-flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition-all"
                        >
                          <span>Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-mono border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Product Code & Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Key Specifications</th>
                    <th className="px-4 py-3 text-right">Final Price (INR)</th>
                    <th className="px-4 py-3 text-center">Attachment</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => {
                    const specs = Array.isArray(p.specifications) ? p.specifications : [];
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-brand-600 block">{p.productCode}</span>
                          <span className="font-semibold text-slate-800 line-clamp-1">{p.name}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                          {p.category?.name}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-sm">
                            {specs.slice(0, 3).map((s, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono"
                              >
                                {s.name}: {s.value}
                              </span>
                            ))}
                            {specs.length > 3 && (
                              <span className="text-[9px] text-slate-400 font-mono">
                                +{specs.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-extrabold text-slate-900 text-sm">
                          {formatINR(p.price || p.basePrice || 0)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {p.fileUrl ? (
                            <a
                              href={p.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-mono text-brand-600 hover:underline"
                            >
                              {p.fileType === 'PDF' ? (
                                <FileText className="w-3.5 h-3.5 text-rose-600" />
                              ) : p.fileType === 'IMAGE' ? (
                                <ImageIcon className="w-3.5 h-3.5 text-brand-600" />
                              ) : (
                                <FileText className="w-3.5 h-3.5 text-blue-600" />
                              )}
                              <span>{p.fileType === 'IMAGE' ? 'IMG' : p.fileType === 'PDF' ? 'PDF' : 'DOC'}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[10px]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenPrint(p)}
                              title="Print Spec Sheet"
                              className="p-1.5 text-slate-500 hover:text-brand-600 rounded-md"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDetailProduct(p)}
                              className="px-2.5 py-1 text-xs font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-md transition-colors"
                            >
                              View Specs
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Product Details Full Specification Sheet Modal */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded font-bold uppercase">
                  {detailProduct.category?.name || 'Control Panel'}
                </span>
                <h3 className="text-base font-bold text-white tracking-wide mt-1">
                  {detailProduct.name}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Code: {detailProduct.productCode}
                </p>
              </div>
              <button
                onClick={() => setDetailProduct(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Price Banner */}
              <div className="bg-gradient-to-r from-brand-50 to-blue-50 border border-brand-200/80 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">
                    Final Price (Ex-Works)
                  </span>
                  <span className="text-2xl font-black font-mono text-brand-900 block">
                    {formatINR(detailProduct.price || detailProduct.basePrice || 0)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    + Applicable GST (18%) & Freight
                  </span>
                </div>

                <button
                  onClick={() => {
                    handleOpenPrint(detailProduct);
                  }}
                  className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Datasheet</span>
                </button>
              </div>

              {/* Description */}
              {detailProduct.description && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono mb-1">
                    Technical Scope
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {detailProduct.description}
                  </p>
                </div>
              )}

              {/* Specifications Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono mb-2">
                  Complete Technical Specifications
                </h4>
                {Array.isArray(detailProduct.specifications) && detailProduct.specifications.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-mono text-[10px] uppercase border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3 text-left w-2/5">Specification</th>
                          <th className="py-2 px-3 text-left">Parameter Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {detailProduct.specifications.map((s, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="py-2 px-3 font-semibold text-slate-800">{s.name}</td>
                            <td className="py-2 px-3 font-mono text-slate-900">{s.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No custom specifications listed.</p>
                )}
              </div>

              {/* Attachment Preview (if any) */}
              {detailProduct.fileUrl && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono mb-2">
                    Technical Attachment ({detailProduct.fileType})
                  </h4>
                  {detailProduct.fileType === 'IMAGE' ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-2 flex justify-center">
                      <img
                        src={detailProduct.fileUrl}
                        alt={detailProduct.name}
                        className="max-h-72 object-contain rounded"
                      />
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-rose-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {detailProduct.fileName || 'Technical Datasheet.pdf'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            PDF Document • Ready for download and client sharing
                          </p>
                        </div>
                      </div>

                      <a
                        href={detailProduct.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download / View</span>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-end">
              <button
                onClick={() => setDetailProduct(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
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
};
