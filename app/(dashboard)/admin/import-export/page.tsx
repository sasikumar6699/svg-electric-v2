'use client';

import React, { useState } from 'react';
import { FileUp, FileDown, Download, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminImportExportPage() {
  const [importType, setImportType] = useState<'products' | 'pricing-rules'>('products');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; importedCount?: number; errors?: string[] } | null>(null);

  const handleDownloadTemplate = (type: 'products' | 'specifications' | 'pricing-rules') => {
    window.open(`/api/admin/import/template?type=${type}`, '_blank');
  };

  const handleExportMaster = () => {
    window.open('/api/admin/export', '_blank');
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', importType);

      const res = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, errors: ['Network error occurred during import.'] });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
            ADMIN MASTER
          </span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Excel Master Data Import & Export</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Bulk maintain products, specifications, and pricing rules using standard Excel spreadsheets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <FileDown className="w-5 h-5 text-amber-600" />
            <span>Export Master Data</span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Download the current database catalog including Products, Specifications with Options, and Pricing Rules
            as a multi-sheet Microsoft Excel workbook (.xlsx).
          </p>

          <button
            onClick={handleExportMaster}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download Master Workbook (.xlsx)</span>
          </button>
        </div>

        {/* Download Templates Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Download className="w-5 h-5 text-brand-600" />
            <span>Download Import Templates</span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Use formatted templates with column headers and sample data for hassle-free bulk importation.
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleDownloadTemplate('products')}
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-medium text-slate-700 font-mono"
            >
              Products Template
            </button>
            <button
              onClick={() => handleDownloadTemplate('specifications')}
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-medium text-slate-700 font-mono"
            >
              Specifications Template
            </button>
            <button
              onClick={() => handleDownloadTemplate('pricing-rules')}
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-medium text-slate-700 font-mono"
            >
              Pricing Rules Template
            </button>
          </div>
        </div>
      </div>

      {/* Upload & Import Form */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <FileUp className="w-5 h-5 text-amber-600" />
          <span>Bulk Upload Master File</span>
        </div>

        <form onSubmit={handleUpload} className="space-y-4 max-w-xl text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Import Entity *</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="importType"
                  value="products"
                  checked={importType === 'products'}
                  onChange={() => setImportType('products')}
                  className="text-amber-600"
                />
                <span>Finished Goods Products</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="importType"
                  value="pricing-rules"
                  checked={importType === 'pricing-rules'}
                  onChange={() => setImportType('pricing-rules')}
                  className="text-amber-600"
                />
                <span>Pricing Rules Matrix</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Choose Excel File (.xlsx) *</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full p-2 rounded-lg border border-slate-300 text-xs file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
            />
          </div>

          <button
            type="submit"
            disabled={uploading || !file}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>Validate & Import File</span>
          </button>
        </form>

        {/* Import Results Banner */}
        {result && (
          <div className="pt-4 border-t border-slate-100">
            {result.success ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-bold">Import Completed Successfully!</p>
                  <p className="mt-0.5">
                    {result.importedCount} record(s) processed and updated in the database.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  <span>Import Validation Failed</span>
                </div>
                <p className="text-[11px] text-rose-700">
                  Please correct the following errors in your spreadsheet before importing:
                </p>
                <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-rose-900 max-h-48 overflow-y-auto">
                  {result.errors?.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}